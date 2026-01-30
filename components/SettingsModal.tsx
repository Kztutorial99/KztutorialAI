import React, { useState } from 'react';
import { X, LogOut, User, CreditCard, Shield, Zap, Terminal, Smartphone, Gift, Cpu, Mail, Lock, FileText, HelpCircle, Eye, EyeOff, Crown, Star, Copy, Activity, Globe, Infinity } from 'lucide-react';
import { AppSettings } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { TRANSLATIONS } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onClearChat: () => void;
  onOpenTopUp: () => void;
  onNavigate: (page: string) => void;
  onSignUpSuccess?: (email: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, onClose, settings, onUpdateSettings, onClearChat, onOpenTopUp, onNavigate, onSignUpSuccess
}) => {
  const { session, profile, refreshProfile, signOut } = useAuth();
  
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // LANGUAGE CONFIG
  const currentLang = profile?.language || 'id';
  const t = TRANSLATIONS[currentLang];

  // Helper Check Premium
  const isPremium = profile?.is_premium && profile.premium_until && new Date(profile.premium_until) > new Date();
  const premiumExpiry = profile?.premium_until ? new Date(profile.premium_until).toLocaleDateString(currentLang === 'id' ? 'id-ID' : 'en-US', {day: 'numeric', month: 'long', year: 'numeric'}) : '-';

  // FIX NAME DISPLAY
  const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'User';

  if (!isOpen) return null;

  const handleCopyId = () => {
    if (session?.user?.id) {
      navigator.clipboard.writeText(session.user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleChangeLanguage = async (lang: 'id' | 'en') => {
    if (!session?.user?.id) return;
    const { error } = await supabase.from('profiles').update({ language: lang }).eq('id', session.user.id);
    if (!error) {
       await refreshProfile();
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await refreshProfile(); 
        onClose(); 
      } else if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email, 
          password, 
          options: { 
            data: { full_name: fullName || email.split('@')[0] },
            emailRedirectTo: window.location.origin 
          }
        });
        if (error) throw error;
        if (onSignUpSuccess) onSignUpSuccess(email);
        else setMsg('✅ Link verifikasi telah dikirim ke email Anda!');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}`, 
        });
        if (error) throw error;
        setMsg('✅ Link reset password telah dikirim ke email Anda!');
      }
    } catch (err: any) {
      setMsg(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = (key: keyof AppSettings) => {
    onUpdateSettings({ ...settings, [key]: !settings[key] });
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#18181b] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-[#202023] shrink-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {session ? <User size={18} className="text-green-400" /> : <Shield size={18} className="text-blue-400" />}
            {session ? t.settings_title : (authMode === 'login' ? 'Login' : authMode === 'signup' ? 'Daftar' : 'Reset Password')}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-0 overflow-y-auto custom-scrollbar">
          {!session ? (
            <div className="p-6">
              {authMode === 'signup' && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl mb-4 text-center">
                  <p className="text-blue-400 font-bold text-sm flex items-center justify-center gap-2">
                    <Gift size={16} /> Daftar & Dapatkan Free Plan!
                  </p>
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Nama Lengkap</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-3.5 text-slate-500" />
                      <input 
                        type="text" placeholder="Nama Lengkap" 
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500"
                        value={fullName} onChange={e => setFullName(e.target.value)} required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-3.5 text-slate-500" />
                    <input 
                      type="email" placeholder="nama@email.com" 
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500"
                      value={email} onChange={e => setEmail(e.target.value)} required
                    />
                  </div>
                </div>

                {authMode !== 'reset' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-3.5 text-slate-500" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-10 text-white focus:outline-none focus:border-blue-500"
                        value={password} onChange={e => setPassword(e.target.value)} required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}
                
                {msg && <div className={`text-xs text-center p-2 rounded ${msg.includes('✅') ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>{msg}</div>}

                <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl font-bold transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg">
                  {loading ? <Cpu size={16} className="animate-spin"/> : authMode === 'login' ? 'Masuk' : authMode === 'signup' ? 'Daftar' : 'Kirim Link Reset'}
                </button>

                <div className="flex justify-between text-xs text-slate-400 mt-4 pt-2 border-t border-slate-800">
                  {authMode === 'login' ? (
                    <>
                      <button type="button" onClick={() => {setMsg(''); setAuthMode('signup');}} className="hover:text-white">Daftar Akun</button>
                      <button type="button" onClick={() => {setMsg(''); setAuthMode('reset');}} className="hover:text-white">Lupa Password?</button>
                    </>
                  ) : (
                    <button type="button" onClick={() => {setMsg(''); setAuthMode('login');}} className="w-full text-center hover:text-white">Kembali Login</button>
                  )}
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-4 p-5 animate-in fade-in">
              {/* --- NEW PROFILE CARD DESIGN --- */}
              <div className={`flex items-center gap-4 p-4 rounded-2xl border relative overflow-hidden group transition-all ${isPremium ? 'bg-gradient-to-r from-slate-900 via-purple-900/20 to-slate-900 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'bg-slate-800/40 border-slate-700/50'}`}>
                {/* Decoration for Premium */}
                {isPremium && <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/10 to-purple-500/10 blur-2xl rounded-full -mr-10 -mt-10 animate-pulse"></div>}
                
                <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg shrink-0 ${isPremium ? 'bg-gradient-to-br from-yellow-500 to-orange-600 shadow-yellow-900/20' : 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-900/20'}`}>
                  {displayName.charAt(0).toUpperCase()}
                  {isPremium && <div className="absolute -top-1.5 -right-1.5 bg-black rounded-full p-0.5 border border-yellow-500"><Crown size={12} className="text-yellow-400" fill="currentColor"/></div>}
                </div>
                <div className="flex-1 min-w-0 relative">
                  <h3 className={`font-bold truncate text-lg ${isPremium ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 to-yellow-400' : 'text-white'}`}>{displayName}</h3>
                  <p className="text-xs text-slate-400 truncate">{profile?.email}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${isPremium ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]' : 'bg-slate-700/50 text-slate-300 border-slate-600/50'}`}>
                      {isPremium ? <Crown size={10} fill="currentColor"/> : <User size={10}/>}
                      {isPremium ? t.premium_badge : t.free_badge}
                    </span>
                  </div>
                </div>
              </div>

              {/* INFO GRID */}
              <div className="grid grid-cols-2 gap-3">
                {/* CARD 1: USAGE (COOL VERSION FOR PREMIUM, SPLIT FOR FREE) */}
                <div className={`p-3 rounded-xl border flex flex-col justify-between relative overflow-hidden h-[100px] ${
                  isPremium 
                    ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-yellow-500/30' 
                    : 'bg-slate-800/30 border-slate-700/50'
                }`}>
                  <div className="flex justify-between items-start relative z-10">
                    <p className={`text-[10px] uppercase font-bold tracking-wider ${isPremium ? 'text-yellow-500/80' : 'text-slate-500'}`}>
                      {isPremium ? 'Status Akses' : t.limit_label}
                    </p>
                    {isPremium ? <Crown size={14} className="text-yellow-400" fill="currentColor"/> : <Activity size={14} className="text-slate-600"/>}
                  </div>
                  
                  <div className="relative z-10">
                     {isPremium ? (
                       <div className="flex items-center gap-2 mt-1">
                         <Infinity size={32} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                         <span className="text-xs font-bold text-yellow-100/80 leading-tight">Unlimited<br/>Access</span>
                       </div>
                     ) : (
                       <div className="flex items-baseline gap-1.5">
                          {/* Angka Terpakai */}
                          <span className={`text-2xl font-black ${profile?.daily_usage! >= 20 ? 'text-red-500' : 'text-white'}`}>
                             {profile?.daily_usage || 0}
                          </span>
                          
                          {/* Divider & Limit */}
                          <span className="text-sm font-medium text-slate-500">
                             / 20
                          </span>
                       </div>
                     )}
                     
                     <p className={`text-[10px] font-medium mt-1 ${isPremium ? 'text-yellow-600' : 'text-slate-500'}`}>
                        {isPremium ? 'Bebas Limit Harian' : t.status_free}
                     </p>
                  </div>

                  {/* Progress Bar Visual (Only for Free) */}
                  {!isPremium && (
                    <div className="w-full h-1 bg-slate-700/50 rounded-full mt-auto relative overflow-hidden">
                       <div 
                         className={`h-full rounded-full transition-all duration-500 ${
                           profile?.daily_usage! >= 20 ? 'bg-red-500' : 'bg-blue-500'
                         }`} 
                         style={{
                           width: `${Math.min(((profile?.daily_usage || 0) / 20) * 100, 100)}%`
                         }}
                       ></div>
                    </div>
                  )}
                  
                  {isPremium && (
                      <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-yellow-500/10 rounded-full blur-xl"></div>
                  )}
                </div>

                {/* CARD 2: STATUS / EXPIRY */}
                <div className={`p-3 rounded-xl border flex flex-col justify-between h-[100px] ${isPremium ? 'bg-slate-800/60 border-purple-500/30' : 'bg-slate-800/30 border-slate-700/50'}`}>
                  <div className="flex justify-between items-start">
                    <p className={`text-[10px] uppercase font-bold tracking-wider ${isPremium ? 'text-purple-400' : 'text-slate-500'}`}>{t.active_until}</p>
                    {isPremium ? <Star size={14} className="text-purple-400" fill="currentColor"/> : <Zap size={14} className="text-slate-600"/>}
                  </div>
                  
                  <div className="mt-auto">
                    <p className={`text-sm font-bold ${isPremium ? 'text-white' : 'text-slate-300'}`}>
                      {isPremium ? 'Premium Plan' : 'Basic Plan'}
                    </p>
                    <p className={`text-[10px] mt-1 truncate ${isPremium ? 'text-purple-300' : 'text-slate-500'}`}>
                       {isPremium ? `Exp: ${premiumExpiry}` : t.forever}
                    </p>
                  </div>
                </div>
              </div>

              {/* USER ID (COPYABLE) */}
              <button 
                onClick={handleCopyId}
                className="w-full bg-black/20 p-3 rounded-xl border border-slate-800 flex items-center justify-between group hover:bg-black/30 transition-colors"
              >
                 <div className="text-left overflow-hidden">
                   <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">User ID (UUID)</p>
                   <p className="text-xs font-mono text-slate-400 truncate w-full pr-4">{session?.user?.id}</p>
                 </div>
                 <div className={`p-2 rounded-lg transition-colors ${copiedId ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-500 group-hover:text-white'}`}>
                    {copiedId ? <CheckIcon size={14} /> : <Copy size={14} />}
                 </div>
              </button>

              {/* UPGRADE ACTION */}
              <button onClick={onOpenTopUp} className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 border ${isPremium ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-transparent'}`}>
                {isPremium ? <Star size={16} fill="currentColor" className="text-yellow-400"/> : <Zap size={16} fill="currentColor"/>}
                {isPremium ? 'Perpanjang Layanan' : t.upgrade_btn}
              </button>

              {/* LANGUAGE SELECTOR */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                 <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">{t.settings_lang}</h4>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => handleChangeLanguage('id')}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all border ${currentLang === 'id' ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' : 'bg-slate-800/30 text-slate-400 border-slate-700/50 hover:bg-slate-800'}`}
                    >
                       <span className="text-lg">🇮🇩</span> Indonesia
                    </button>
                    <button 
                      onClick={() => handleChangeLanguage('en')}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all border ${currentLang === 'en' ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' : 'bg-slate-800/30 text-slate-400 border-slate-700/50 hover:bg-slate-800'}`}
                    >
                       <span className="text-lg">🇺🇸</span> English
                    </button>
                 </div>
              </div>

              {/* SETTINGS LIST */}
              <div className="pt-2 border-t border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">{t.settings_pref}</h4>
                <div className="space-y-2">
                  <button onClick={() => toggleSetting('terminalMode')} className="w-full flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded ${settings.terminalMode ? "bg-green-500/10 text-green-400" : "bg-slate-700/50 text-slate-400"}`}>
                         <Terminal size={16} />
                      </div>
                      <span className="text-sm text-slate-300">Terminal Mode</span>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.terminalMode ? 'bg-green-500' : 'bg-slate-700'}`}>
                       <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.terminalMode ? 'left-6' : 'left-1'}`}></div>
                    </div>
                  </button>
                  <button onClick={() => toggleSetting('hapticEnabled')} className="w-full flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded ${settings.hapticEnabled ? "bg-purple-500/10 text-purple-400" : "bg-slate-700/50 text-slate-400"}`}>
                           <Smartphone size={16} />
                        </div>
                        <span className="text-sm text-slate-300">Haptic Feedback</span>
                    </div>
                     <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.hapticEnabled ? 'bg-purple-500' : 'bg-slate-700'}`}>
                       <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.hapticEnabled ? 'left-6' : 'left-1'}`}></div>
                    </div>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <button onClick={() => onNavigate('privacy')} className="flex items-center justify-center gap-2 p-3 bg-slate-800/30 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-700/30">
                       <Lock size={14}/> Privacy
                    </button>
                    <button onClick={() => onNavigate('terms')} className="flex items-center justify-center gap-2 p-3 bg-slate-800/30 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-700/30">
                       <FileText size={14}/> Terms
                    </button>
                </div>
              </div>

              <button onClick={() => { signOut(); onClose(); }} className="w-full flex items-center justify-center gap-2 p-3 bg-red-900/10 text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg transition-all font-bold text-sm border border-red-900/20 mt-2">
                <LogOut size={16} /> {t.btn_logout}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Simple Icon Component for Check
const CheckIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);