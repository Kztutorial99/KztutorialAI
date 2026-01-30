import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from './services/supabaseClient';
import { ChatInterface } from './components/ChatInterface';
import { LandingPage } from './components/LandingPage';
import { AdminModal } from './components/AdminModal';
import { AdminDashboard } from './components/AdminDashboard';
import { SettingsModal } from './components/SettingsModal';
import { TopUpModal } from './components/TopUpModal';
import { InboxModal } from './components/InboxModal';
import { EmailVerification } from './components/EmailVerification';
import { UpdatePasswordPage } from './components/UpdatePasswordPage';
import { PrivacyPolicy } from './components/pages/PrivacyPolicy';
import { TermsOfService } from './components/pages/TermsOfService';
import { HelpCenter } from './components/pages/HelpCenter';
import { streamGroqRequest } from './services/groqService';
import { searchWeb } from './services/serperService';
import { Message, ApiKeys, AppSettings } from './types';
import { SYSTEM_PROMPT, ADMIN_TRIGGER_KEYWORD } from './constants';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const MainApp: React.FC = () => {
  const { session, profile, refreshProfile, loading: authLoading } = useAuth();
  
  // --- View State ---
  const [view, setView] = useState<'landing' | 'chat' | 'admin' | 'privacy' | 'terms' | 'help' | 'verify' | 'reset-password'>('landing');
  const [registeredEmail, setRegisteredEmail] = useState('');

  // --- Detection for Password Reset Flow ---
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && (hash.includes('type=recovery') || hash.includes('type=signup'))) {
      if (hash.includes('type=recovery')) {
        setView('reset-password');
      }
    }
  }, []);

  // --- Chat State ---
  const [messages, setMessages] = useState<Message[]>([
    { id: 'system-1', role: 'system', content: SYSTEM_PROMPT, timestamp: Date.now() }
  ]);
  const [apiKeys, setApiKeys] = useState<ApiKeys>([]);
  const [serperKey, setSerperKey] = useState<string>('');
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('kz_ai_settings');
    const defaultSettings = { terminalMode: false, hapticEnabled: true };
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showInboxModal, setShowInboxModal] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isStreamingRef = useRef(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // --- COOLDOWN STATE (NEW) ---
  const [cooldownTimer, setCooldownTimer] = useState(0);
  const lastMessageTimeRef = useRef<number>(0);

  const fetchSystemKeys = useCallback(async () => {
    try {
      const { data } = await supabase.from('system_settings').select('groq_api_keys, serper_api_key').limit(1).single();
      if (data) {
        setApiKeys(data.groq_api_keys || []);
        if (data.serper_api_key) setSerperKey(data.serper_api_key);
      }
    } catch (err) { setApiKeys([]); }
  }, []);

  useEffect(() => {
    fetchSystemKeys();
  }, [fetchSystemKeys]);

  useEffect(() => {
    if (session && view !== 'reset-password') {
      if (view === 'landing' || view === 'verify') setView('chat');
    } else if (!session && view !== 'reset-password') {
      if (view === 'chat' || view === 'admin') setView('landing');
    }
  }, [session, view]);

  useEffect(() => {
    if (session && !profile) setIsProfileLoading(true);
    else setIsProfileLoading(false);
  }, [session, profile]);

  // Handle Cooldown Timer Decrement
  useEffect(() => {
    if (cooldownTimer > 0) {
      const interval = setInterval(() => {
        setCooldownTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [cooldownTimer]);

  const checkUnread = useCallback(async () => {
    if (!session) return;
    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id).eq('is_read', false);
    setUnreadCount(count || 0);
  }, [session]);

  useEffect(() => {
    if (!session) return;
    checkUnread();
    const channel = supabase.channel('realtime:notifications').on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` }, () => {
      checkUnread();
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session, checkUnread]);

  const cleanResponseText = (text: string) => {
    return text.replace(/\[SAVE_MEMORY: .*?\]/g, '').trim();
  };

  const handleSendMessage = async (content: string, isAnalysis: boolean = false, isSearch: boolean = false, imageBase64?: string) => {
    if (!session) { setShowSettingsModal(true); return; }
    
    // --- COOLDOWN CHECK ---
    const now = Date.now();
    const isPremium = profile?.is_premium && profile.premium_until && new Date(profile.premium_until) > new Date();
    
    // Strategi Anti-Zonk: VIP 3 detik, Free 10 detik
    const cooldownDuration = isPremium ? 3000 : 10000; 
    const timeSinceLast = now - lastMessageTimeRef.current;

    if (timeSinceLast < cooldownDuration && lastMessageTimeRef.current !== 0) {
       // Should be handled by UI disabled state, but double check here to be safe
       return;
    }

    if (content.toLowerCase().trim() === ADMIN_TRIGGER_KEYWORD) { setShowAdminModal(true); return; }
    if (apiKeys.length === 0) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `⚠️ **SISTEM BELUM DIKONFIGURASI**\n\nAdmin belum memasukkan API Key.`, timestamp: Date.now() }]);
      return;
    }

    // Check credits/subscription (handled mostly by backend logic now, but simple check here)
    // We rely on backend 'check_and_increment_usage' which is called inside streamGroqRequest for limit enforcement.
    // However, if we want to block UI for credits we can keep this or rely on backend error.
    // Let's rely on backend error for accuracy or simple pre-check if we had credits field, but we switched to daily_usage.
    // We will let streamGroqRequest handle the detailed check.

    const userContentForUI = imageBase64 ? `![User Image](${imageBase64})\n\n${content}` : content;
    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', content: userContentForUI, timestamp: Date.now() };
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true); 
    isStreamingRef.current = true;
    
    // UPDATE LAST MESSAGE TIME & START COOLDOWN
    lastMessageTimeRef.current = Date.now(); 
    setCooldownTimer(cooldownDuration / 1000);

    const selectedModelId = imageBase64 ? 'meta-llama/llama-4-scout-17b-16e-instruct' : 'llama-3.3-70b-versatile';
    const aiMsgId = (Date.now() + 1).toString();

    try {
      let finalPrompt = content;
      if (isSearch && !imageBase64) {
         try {
           const res = await searchWeb(content, serperKey);
           finalPrompt = `DATA WEB:\n${res}\n\nUSER QUERY:\n${content}`;
         } catch (e) {}
      }

      const apiMessages = [...messages, newUserMsg].map(m => {
        if (m.id === newUserMsg.id && imageBase64) {
          return {
            role: m.role,
            content: [
              { type: "text", text: content },
              { type: "image_url", image_url: { url: imageBase64 } }
            ]
          };
        }
        return { 
          role: m.role, 
          content: m.id === newUserMsg.id ? (isAnalysis ? finalPrompt + "\n\n(Deep Analysis)" : finalPrompt) : m.content 
        };
      });

      setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '', timestamp: Date.now() }]);

      // Note: userCredits param is legacy/ignored inside streamGroqRequest now
      const stream = streamGroqRequest(apiMessages, apiKeys, selectedModelId, session.user.id, 0);
      let fullContent = '';
      for await (const chunk of stream) {
        if (!isStreamingRef.current) break;
        fullContent += chunk;
        const cleanedContent = cleanResponseText(fullContent);
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: cleanedContent } : m));
      }
      
      refreshProfile(); // Refresh usage stats
    } catch (err: any) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `**ERROR:** ${err.message}`, timestamp: Date.now() }]);
    } finally {
      setIsLoading(false); isStreamingRef.current = false;
    }
  };

  if (authLoading) return <div className="h-[100dvh] w-full flex items-center justify-center bg-[#0f172a]"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  if (view === 'reset-password') return <UpdatePasswordPage onComplete={() => { setView('landing'); window.location.hash = ''; }} />;
  if (view === 'verify') return <EmailVerification email={registeredEmail} onLoginClick={() => setView('landing')} />;
  if (view === 'privacy') return <PrivacyPolicy onBack={() => setView(session ? 'chat' : 'landing')} />;
  if (view === 'terms') return <TermsOfService onBack={() => setView(session ? 'chat' : 'landing')} />;
  if (view === 'help') return <HelpCenter onBack={() => setView(session ? 'chat' : 'landing')} />;

  return (
    <div className={`fixed inset-0 h-[100dvh] w-full flex flex-col bg-[#0f172a] text-slate-200 overflow-hidden ${settings.terminalMode ? 'bg-black text-green-500' : ''}`}>
      {view === 'landing' && !session ? (
        <LandingPage onLoginClick={() => setShowSettingsModal(true)} onNavigate={(p) => setView(p as any)} />
      ) : view === 'admin' ? (
        <AdminDashboard onExit={() => { setView('chat'); fetchSystemKeys(); }} />
      ) : (
        <ChatInterface 
          messages={messages} isLoading={isLoading} onSendMessage={handleSendMessage}
          onClearChat={() => setMessages([{ id: 'system-1', role: 'system', content: SYSTEM_PROMPT, timestamp: Date.now() }])} 
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenInbox={() => setShowInboxModal(true)} 
          unreadCount={unreadCount} 
          error={error} settings={settings}
          isProfileLoading={isProfileLoading}
          onOpenTopUp={() => setShowTopUpModal(true)}
          cooldownTimer={cooldownTimer} // Pass timer
        />
      )}
      <AdminModal isOpen={showAdminModal} onClose={() => setShowAdminModal(false)} onSuccess={() => setView('admin')} />
      <SettingsModal 
        isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)}
        settings={settings} onUpdateSettings={(s) => { setSettings(s); localStorage.setItem('kz_ai_settings', JSON.stringify(s)); }}
        onClearChat={() => setMessages([{ id: 'system-1', role: 'system', content: SYSTEM_PROMPT, timestamp: Date.now() }])} 
        onOpenTopUp={() => { setShowSettingsModal(false); setShowTopUpModal(true); }}
        onNavigate={(p) => { setShowSettingsModal(false); setView(p as any); }}
      />
      <TopUpModal isOpen={showTopUpModal} onClose={() => setShowTopUpModal(false)} />
      {session && <InboxModal isOpen={showInboxModal} onClose={() => setShowInboxModal(false)} userId={session.user.id} onUpdateUnread={checkUnread} />}
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <MainApp />
  </AuthProvider>
);

export default App;