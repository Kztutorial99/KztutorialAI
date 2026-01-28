import React, { useState, useRef, useEffect, memo } from 'react';
import { Send, Bot, User, Code2, Settings, Zap, Terminal, AlertTriangle, FileCode, Sparkles, BrainCircuit, ArrowDown, ChevronDown, Coins, Bell, Trash2, Check, Copy, Share2, ThumbsUp, ThumbsDown, Globe, Camera, Maximize2, X, Loader2 } from 'lucide-react';
import { Message, AppSettings } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { ImageUpload } from './ImageUpload';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string, isAnalysis?: boolean, isSearch?: boolean, image?: string) => void;
  onClearChat: () => void;
  onOpenSettings: () => void;
  onOpenInbox: () => void;
  unreadCount: number;
  settings: AppSettings;
  error: string | null;
  userCredits: number;
  isProfileLoading: boolean; // Props baru untuk status loading profil
}

// --- BLINKING BOT AVATAR ---
const BlinkingBot = ({ className, size = 24 }: { className?: string, size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <style>{`
      @keyframes blink {
        0%, 90%, 100% { transform: scaleY(1); }
        95% { transform: scaleY(0.1); }
      }
      .eye-blink {
        transform-origin: center;
        animation: blink 4s infinite;
      }
    `}</style>
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M9 14h.01" className="eye-blink" strokeWidth="3" strokeLinecap="round" />
    <path d="M15 14h.01" className="eye-blink" strokeWidth="3" strokeLinecap="round" />
    <path d="M12 18h.01" />
  </svg>
);

// --- MESSAGE ACTIONS (COPY, LIKE, DISLIKE, SHARE) ---
const MessageActions = ({ content }: { content: string }) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLike = () => setFeedback(prev => prev === 'like' ? null : 'like');
  const handleDislike = () => setFeedback(prev => prev === 'dislike' ? null : 'dislike');
  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'AI Response', text: content }); } catch (err) { console.log('Share canceled'); }
    } else {
      handleCopy();
      alert("Teks disalin ke clipboard (Share API tidak didukung)");
    }
  };

  return (
    <div className="flex items-center gap-4 mt-4 mb-2 opacity-60 hover:opacity-100 transition-opacity pl-1">
      <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors" title="Salin">
        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
      </button>
      <button onClick={handleLike} className={`flex items-center gap-1.5 text-xs transition-colors ${feedback === 'like' ? 'text-blue-400' : 'text-slate-400 hover:text-blue-400'}`}>
        <ThumbsUp size={14} className={feedback === 'like' ? 'fill-blue-400' : ''} />
      </button>
      <button onClick={handleDislike} className={`flex items-center gap-1.5 text-xs transition-colors ${feedback === 'dislike' ? 'text-red-400' : 'text-slate-400 hover:text-red-400'}`}>
        <ThumbsDown size={14} className={feedback === 'dislike' ? 'fill-red-400' : ''} />
      </button>
      <button onClick={handleShare} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors" title="Bagikan">
        <Share2 size={14} />
      </button>
    </div>
  );
};

// --- SMART ACTIONS V2 ---
const SuggestedActions = memo(({ lastMessage, onAction }: { lastMessage: string, onAction: (text: string) => void }) => {
  const [actions, setActions] = useState<{ label: string; icon: React.ReactNode; prompt: string }[]>([]);

  useEffect(() => {
    if (!lastMessage) return;
    const lowerMsg = lastMessage.toLowerCase();
    let candidates: { label: string; icon: React.ReactNode; prompt: string }[] = [];

    if (lowerMsg.includes("def ") || lowerMsg.includes("import ") || lowerMsg.includes("```python")) {
      candidates.push(
        { label: "Cara Jalankan?", icon: <Terminal size={12}/>, prompt: "Bagaimana cara menjalankan script ini di Termux?" },
        { label: "Jelaskan Code", icon: <FileCode size={12}/>, prompt: "Jelaskan alur kode di atas baris per baris." },
        { label: "Optimalkan", icon: <Zap size={12}/>, prompt: "Bisakah kode ini dibuat lebih efisien?" },
        { label: "Cari Bug", icon: <AlertTriangle size={12}/>, prompt: "Analisis apakah ada potensi error di kode ini." }
      );
    } 
    else if (lowerMsg.includes("termux") || lowerMsg.includes("pkg") || lowerMsg.includes("apt")) {
      candidates.push(
        { label: "Fungsi Command", icon: <Terminal size={12}/>, prompt: "Jelaskan fungsi perintah tersebut." },
        { label: "Cara Install", icon: <Zap size={12}/>, prompt: "Bagaimana cara install paket ini?" },
        { label: "Fix Permission", icon: <AlertTriangle size={12}/>, prompt: "Bagaimana cara mengatasi error permission denied?" }
      );
    }
    else if (lowerMsg.includes("error") || lowerMsg.includes("failed") || lowerMsg.includes("salah")) {
      candidates.push(
        { label: "Analisis Error", icon: <BrainCircuit size={12}/>, prompt: "Analisis kenapa error ini terjadi dan berikan solusinya." },
        { label: "Solusi Lain", icon: <Sparkles size={12}/>, prompt: "Apakah ada cara lain yang lebih mudah?" }
      );
    }
    
    if (candidates.length === 0) {
      candidates.push(
        { label: "Buat Kode Python", icon: <Code2 size={12}/>, prompt: "Buatkan kode Python sederhana untuk pemula." },
        { label: "Tips Termux", icon: <Terminal size={12}/>, prompt: "Berikan tips trik rahasia Termux." },
        { label: "Apa itu AI?", icon: <BrainCircuit size={12}/>, prompt: "Jelaskan cara kerja AI dengan bahasa sederhana." },
        { label: "Ide Project", icon: <Sparkles size={12}/>, prompt: "Berikan ide project coding yang seru." }
      );
    }
    setActions(candidates.sort(() => 0.5 - Math.random()).slice(0, 3));
  }, [lastMessage]);

  if (!actions.length) return null;

  return (
    <div className="mt-4 pt-3 border-t border-slate-700/30 flex flex-wrap gap-2 animate-in slide-in-from-bottom-2 fade-in duration-500">
      {actions.map((action, idx) => (
        <button
          key={idx}
          onClick={() => onAction(action.prompt)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-blue-600/20 border border-slate-700 hover:border-blue-500/50 rounded-lg text-xs text-slate-300 hover:text-blue-300 transition-all group active:scale-95"
        >
          <span className="text-blue-400 group-hover:text-blue-300 opacity-70">{action.icon}</span>
          {action.label}
        </button>
      ))}
    </div>
  );
});

// --- HELPER FUNCTIONS ---
const parseMessageContent = (content: string) => {
  const openTag = '<thinking>';
  const closeTag = '</thinking>';
  const openIndex = content.indexOf(openTag);
  if (openIndex === -1) return { hasReasoning: false, reasoning: '', finalAnswer: content };
  
  const closeIndex = content.indexOf(closeTag, openIndex);
  let reasoning = '', postText = '';
  
  if (closeIndex !== -1) {
    reasoning = content.substring(openIndex + openTag.length, closeIndex);
    postText = content.substring(closeIndex + closeTag.length);
  } else {
    reasoning = content.substring(openIndex + openTag.length);
  }
  return { hasReasoning: true, reasoning: reasoning.trim(), finalAnswer: (content.substring(0, openIndex) + postText).trim() };
};

const ThinkingIndicator = () => (
  <div className="flex items-center gap-2 p-3 bg-slate-800/30 rounded-2xl w-fit animate-pulse border border-slate-700/30">
    <BrainCircuit size={16} className="text-purple-400" />
    <span className="text-xs text-slate-500 font-mono">AI sedang berpikir...</span>
  </div>
);

const ReasoningAccordion: React.FC<{ reasoning: string; isStreaming: boolean }> = ({ reasoning, isStreaming }) => {
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => { if (isStreaming) setIsOpen(true); else setIsOpen(false); }, [isStreaming]);

  return (
    <div className="mb-4 border border-slate-700/50 rounded-lg overflow-hidden bg-black/20">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
        <BrainCircuit size={14} className={isStreaming ? "animate-pulse text-purple-400" : "text-slate-500"} />
        <span>{isStreaming ? "Thinking Process..." : "Lihat Proses Berpikir"}</span>
        <ChevronDown size={12} className={`ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-3 py-3 border-t border-slate-700/50 bg-[#111] text-xs font-mono text-slate-400 whitespace-pre-wrap leading-relaxed animate-in slide-in-from-top-2">
          {reasoning}
          {isStreaming && <span className="inline-block w-1.5 h-3 ml-1 bg-purple-500 animate-pulse"/>}
        </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---
export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, isLoading, onSendMessage, onClearChat, onOpenSettings, onOpenInbox, unreadCount, settings, error, userCredits, isProfileLoading 
}) => {
  const [input, setInput] = useState('');
  const [isAnalysisMode, setIsAnalysisMode] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // STATE BARU: Untuk Zoom Gambar (Lightbox)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const prevUnreadCountRef = useRef(unreadCount);

  // --- HITUNG BIAYA REAL-TIME (UPDATED) ---
  let currentCost = 1;
  if (isAnalysisMode) currentCost = 2; // DISKON: 2 Kredit
  if (selectedImage) currentCost = 1; // MATA DEWA: 1 Kredit (Murah)

  // Cek Apakah Kredit Cukup? (Hanya valid jika profil sudah termuat)
  const canSend = userCredits >= currentCost;

  // Notification Effect
  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current) {
      setIsRinging(true);
      if (settings.hapticEnabled && navigator.vibrate) navigator.vibrate([100, 50, 100]); 
      const timer = setTimeout(() => setIsRinging(false), 2000); 
      return () => clearTimeout(timer);
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount, settings.hapticEnabled]);

  const scrollToBottom = (force = false) => {
    if (scrollContainerRef.current) {
      const { scrollHeight, clientHeight, scrollTop } = scrollContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      if (force || isAtBottom) scrollContainerRef.current.scrollTo({ top: scrollHeight, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      setShowScrollButton((scrollHeight - scrollTop - clientHeight) > 100);
    }
  };

  useEffect(() => { scrollToBottom(true); }, [messages]);

  useEffect(() => {
    if (!isLoading && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && settings.hapticEnabled) {
      if (navigator.vibrate) navigator.vibrate(20);
    }
  }, [isLoading, messages, settings.hapticEnabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validasi tambahan di UI: Blokir jika saldo kurang (setelah loading)
    if ((!input.trim() && !selectedImage) || isLoading || (!canSend && !isProfileLoading) || isProfileLoading) return;
    
    // Kirim status search mode & image
    onSendMessage(input, isAnalysisMode, isSearchMode, selectedImage || undefined);
    
    setInput('');
    setSelectedImage(null);
    setIsAnalysisMode(false);
    setIsSearchMode(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  // --- FUNGSI RENDER PESAN USER (FIX DISPLAY & ZOOM) ---
  const renderUserMessage = (content: string) => {
    // Cek apakah pesan mengandung format gambar Markdown ![...](data:...)
    if (content.startsWith('![User Image]')) {
      // Kita pisahkan Gambar dan Teks agar rapi
      const splitIndex = content.indexOf(')\n\n');
      if (splitIndex !== -1) {
        const imagePart = content.substring(0, splitIndex + 1); // Bagian Gambar
        const textPart = content.substring(splitIndex + 3);     // Bagian Teks
        
        // Ambil URL Base64 dari dalam kurung (...)
        const imageUrl = imagePart.match(/\((.*?)\)/)?.[1];

        return (
          <div className="flex flex-col gap-2">
            {imageUrl && (
              // FIX: Menggunakan Overlay State, bukan window.open
              <div className="relative group cursor-pointer" onClick={() => setZoomedImage(imageUrl)}>
                <img 
                  src={imageUrl} 
                  alt="Uploaded" 
                  className="max-w-full rounded-lg border border-white/20 shadow-sm max-h-64 object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                   <Maximize2 className="text-white" size={24} />
                </div>
              </div>
            )}
            {textPart && <p className="whitespace-pre-wrap">{textPart}</p>}
          </div>
        );
      }
    }
    // Jika tidak ada gambar, render teks biasa
    return <p className="whitespace-pre-wrap">{content}</p>;
  };

  const displayMessages = messages.filter(m => m.role !== 'system');
  const fontClass = settings.terminalMode ? 'font-mono tracking-tight' : 'font-sans';

  return (
    <div className={`flex flex-col h-screen bg-[#0f172a] ${fontClass}`}>
      
      {/* --- HEADER --- */}
      <header className={`h-16 border-b flex items-center justify-between px-3 sm:px-4 sticky top-0 z-20 backdrop-blur-md ${settings.terminalMode ? 'bg-black/90 border-green-900' : 'bg-slate-900/80 border-slate-800 shadow-sm'}`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white shadow-lg ${settings.terminalMode ? 'bg-green-900 shadow-green-900/20' : 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-900/20 ring-1 ring-white/10'}`}>
            <Code2 size={18} className={settings.terminalMode ? 'text-green-400' : 'text-white'} />
          </div>
          <div>
            <h1 className={`font-bold text-xs sm:text-sm tracking-wide ${settings.terminalMode ? 'text-green-500' : 'text-white'}`}>AI ASISTEN</h1>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${settings.terminalMode ? 'bg-green-500' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></span>
              <span className={`text-[10px] font-medium ${settings.terminalMode ? 'text-green-700' : 'text-slate-400'}`}>Kz.tutorial</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
           {/* DISPLAY CREDIT */}
           <div className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full border shadow-inner mr-0.5 sm:mr-1 ${settings.terminalMode ? 'bg-black border-green-800' : 'bg-slate-800/80 border-slate-700/50'}`}>
             <Coins size={14} className="text-yellow-400" />
             <span className="text-xs font-bold text-yellow-400">{userCredits}</span>
             <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">Kredit</span>
           </div>

           {/* INBOX (BELL ICON YANG ANIMASI) */}
           <button 
             onClick={onOpenInbox} 
             className={`p-2 sm:p-2.5 rounded-xl transition-all relative ${settings.terminalMode ? 'text-green-600 hover:text-green-400 hover:bg-green-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'} ${isRinging ? 'text-yellow-400 scale-110' : ''}`}
           >
             <Bell size={20} className={isRinging ? 'animate-bounce fill-yellow-400' : ''} />
             {unreadCount > 0 && (
               <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full flex items-center justify-center border-2 border-[#0f172a] animate-in zoom-in">
                 <span className="text-[9px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
               </span>
             )}
           </button>

           {/* CLEAR CHAT */}
           <button onClick={onClearChat} className={`p-2 sm:p-2.5 rounded-xl transition-colors ${settings.terminalMode ? 'text-green-600 hover:text-red-400' : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'}`}>
             <Trash2 size={20} />
           </button>

           {/* SETTINGS */}
           <button onClick={onOpenSettings} className={`p-2 sm:p-2.5 rounded-xl transition-all active:scale-95 ${settings.terminalMode ? 'text-green-600 hover:text-green-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
             <Settings size={20} />
           </button>
        </div>
      </header>

      {/* CHAT AREA */}
      <div ref={scrollContainerRef} onScroll={handleScroll} className={`flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth ${settings.terminalMode ? 'bg-black' : ''}`}>
        {displayMessages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 animate-in fade-in zoom-in duration-500">
             <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-2 shadow-inner ring-1 ring-white/5 ${settings.terminalMode ? 'bg-green-900/20' : 'bg-slate-800/50'}`}>
                <BlinkingBot size={32} className={settings.terminalMode ? 'text-green-500' : 'text-blue-500'} />
             </div>
             <p className={`text-sm font-medium ${settings.terminalMode ? 'text-green-600' : 'text-slate-400'}`}>Siap membantu coding & diskusi santai.</p>
          </div>
        )}

        {displayMessages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const { hasReasoning, reasoning, finalAnswer } = parseMessageContent(msg.content);
          const isStreamingMsg = isLoading && index === displayMessages.length - 1 && !isUser;
          const showActions = !isUser && index === displayMessages.length - 1 && !isLoading;

          return (
            <div key={msg.id} className={`flex flex-col w-full mb-4 ${isUser ? 'items-end' : 'items-start'}`}>
              <div className={`flex gap-3 max-w-[95%] md:max-w-3xl ${isUser ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ring-1 ring-white/5 ${isUser ? 'bg-blue-600' : settings.terminalMode ? 'bg-green-900 text-green-200' : 'bg-slate-800 border border-slate-700'}`}>
                  {isUser ? <User size={16} className="text-white" /> : <Bot size={18} className={settings.terminalMode ? 'text-green-400' : 'text-blue-400'} />}
                </div>

                <div className={`flex flex-col min-w-0 ${isUser ? 'items-end' : 'items-start'} w-full`}>
                   {isStreamingMsg && !msg.content ? <ThinkingIndicator /> : (
                     <div className={`text-sm leading-relaxed shadow-sm relative px-5 py-4 ${isUser ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none' : settings.terminalMode ? 'bg-black border border-green-500/50 text-green-400 rounded-none font-mono' : 'bg-[#1e1e1e] border border-slate-700/60 text-slate-300 rounded-2xl rounded-tl-none pb-4'}`}>
                        {!isUser && hasReasoning && <ReasoningAccordion reasoning={reasoning} isStreaming={isStreamingMsg} />}
                        
                        {isUser ? renderUserMessage(msg.content) : <MarkdownRenderer content={finalAnswer} />}
                        
                        {!isUser && !isStreamingMsg && (
                          <>
                            <MessageActions content={finalAnswer} />
                            {showActions && <SuggestedActions lastMessage={finalAnswer} onAction={(text) => onSendMessage(text, false)} />}
                          </>
                        )}
                     </div>
                   )}

                   {/* --- MESSAGE METADATA (Timestamp & Status) --- */}
                   {!isStreamingMsg && (
                     <div className={`flex items-center gap-1.5 mt-1.5 px-1 select-none ${isUser ? 'justify-end' : 'justify-start'} ${settings.terminalMode ? 'text-green-800' : 'text-slate-500'}`}>
                        <span className="text-[10px] font-medium tracking-wide font-mono">
                          {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isUser && (
                          <div className="flex items-center" title="Terkirim">
                             <Check size={12} strokeWidth={3} className={settings.terminalMode ? "text-green-600" : "text-blue-500"} />
                          </div>
                        )}
                     </div>
                   )}
                </div>
              </div>
            </div>
          );
        })}
        <div className="h-6" /> 
      </div>

      {showScrollButton && (
        <button onClick={() => scrollToBottom(true)} className="absolute bottom-32 right-6 bg-blue-600 text-white p-3 rounded-full shadow-xl hover:scale-110 transition-transform z-20 animate-in fade-in slide-in-from-bottom-2"><ArrowDown size={20} /></button>
      )}

      {/* --- INPUT AREA DENGAN UI BARU --- */}
      <div className={`backdrop-blur-lg pb-3 pt-1 px-3 border-t ${settings.terminalMode ? 'bg-black/90 border-green-900' : 'bg-slate-900/90 border-slate-800/80'}`}>
        
        {/* INFO BIAYA KREDIT (MODE ANALISIS) */}
        {isAnalysisMode && (
          <div className="flex justify-center mb-2 animate-in slide-in-from-bottom-2 fade-in">
             <div className="flex items-center gap-2 bg-purple-900/60 border border-purple-500/30 px-3 py-1 rounded-full backdrop-blur-md shadow-lg shadow-purple-900/20">
                <Sparkles size={12} className="text-purple-300 animate-pulse" />
                <span className="text-[10px] font-bold text-purple-200">Mode Analisis: Logika Mendalam</span>
                <span className="text-[10px] font-bold text-yellow-400 bg-black/30 px-1.5 rounded border border-yellow-500/20">-2 Kredit</span>
             </div>
          </div>
        )}

        {/* INFO SEARCH ACTIVE (FREE ADD-ON) */}
        {isSearchMode && (
          <div className="flex justify-center mb-2 animate-in slide-in-from-bottom-2 fade-in">
             <div className="flex items-center gap-2 bg-cyan-950/80 border border-cyan-500/30 px-3 py-1 rounded-full backdrop-blur-md shadow-lg">
                <Globe size={12} className="text-cyan-300 animate-pulse" />
                <span className="text-[10px] font-bold text-cyan-100">Mode Internet Aktif</span>
             </div>
          </div>
        )}

        {/* INFO VISION ACTIVE (ANALISIS IMAGE) */}
        {selectedImage && (
          <div className="flex justify-center mb-2 animate-in slide-in-from-bottom-2 fade-in">
             <div className="flex items-center gap-2 bg-purple-950/80 border border-purple-500/30 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg">
                <Camera size={12} className="text-purple-300 animate-pulse" />
                <span className="text-[10px] font-bold text-purple-100">Analisis Image Aktif</span>
                <span className="text-[10px] font-bold text-yellow-400 bg-black/30 px-2 py-0.5 rounded border border-yellow-500/20">-1 Kredit</span>
             </div>
          </div>
        )}

        {/* WARNING SALDO TIDAK CUKUP */}
        {/* HANYA MUNCUL JIKA PROFIL SELESAI DIMUAT DAN SALDO TIDAK CUKUP */}
        {!isProfileLoading && !canSend && (
          <div className="absolute -top-12 left-0 right-0 flex justify-center animate-in slide-in-from-bottom-2 z-30 pointer-events-none">
             <div className="bg-red-900/80 text-red-200 text-xs px-4 py-2 rounded-full border border-red-500/50 backdrop-blur shadow-lg font-bold flex items-center gap-2">
               <AlertTriangle size={14} className="text-red-400"/>
               Kredit Habis! Topup Dulu.
             </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={`relative flex items-end gap-2 p-2 rounded-xl border transition-all shadow-lg ${isAnalysisMode ? 'bg-slate-900 border-purple-500/50 shadow-purple-900/10' : settings.terminalMode ? 'bg-black border-green-800' : 'bg-slate-800 border-slate-700 focus-within:border-blue-500/50'}`}>
          
          {/* TOMBOL IMAGE UPLOAD (VISION) - UPDATED WITH PROPS */}
          <ImageUpload 
            previewImage={selectedImage}
            onImageSelected={setSelectedImage} 
            onClear={() => setSelectedImage(null)}
            isLoading={isLoading || isProfileLoading} 
          />

          {/* TOMBOL SEARCH (GLOBE) */}
          <button
            type="button"
            onClick={() => { setIsSearchMode(!isSearchMode); setIsAnalysisMode(false); setSelectedImage(null); }}
            className={`p-2.5 rounded-lg transition-all flex-shrink-0 ${
              isSearchMode 
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30' 
                : settings.terminalMode ? 'bg-green-900/20 text-green-600 hover:text-green-400' : 'bg-slate-700/50 text-slate-400 hover:text-cyan-400 hover:bg-slate-700'
            }`}
            title={isSearchMode ? "Matikan Pencarian Web" : "Cari di Internet (Gratis)"}
          >
            <Globe size={18} className={isSearchMode ? "animate-spin-slow" : ""} />
          </button>

          {/* TOMBOL TOGGLE MODE ANALISIS */}
          <button
            type="button"
            onClick={() => { setIsAnalysisMode(!isAnalysisMode); setIsSearchMode(false); setSelectedImage(null); }}
            className={`p-2.5 rounded-lg transition-all flex-shrink-0 ${
              isAnalysisMode 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                : settings.terminalMode ? 'bg-green-900/20 text-green-600 hover:text-green-400' : 'bg-slate-700/50 text-slate-400 hover:text-purple-400 hover:bg-slate-700'
            }`}
            title={isAnalysisMode ? "Matikan Mode Analisis" : "Aktifkan Mode Analisis (3 Kredit)"}
          >
            <Sparkles size={18} className={isAnalysisMode ? "animate-pulse" : ""} />
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            disabled={isProfileLoading} 
            onChange={(e) => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${e.target.scrollHeight}px`; }}
            placeholder={isProfileLoading ? "Memuat data profil..." : (selectedImage ? "Jelaskan gambar ini..." : isSearchMode ? "Cari info terbaru di internet..." : isAnalysisMode ? "Jelaskan masalahnya secara detail..." : "Ketik pesan...")}
            className={`w-full max-h-32 bg-transparent text-sm px-2 py-2.5 focus:outline-none resize-none overflow-y-auto font-medium ${settings.terminalMode ? 'text-green-400 placeholder-green-800' : 'text-slate-200 placeholder-slate-500'}`}
            rows={1}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
          />
          
          <button 
            type="submit" 
            disabled={isLoading || (!input.trim() && !selectedImage) || (!canSend && !isProfileLoading) || isProfileLoading} 
            className={`p-2.5 rounded-lg transition-all shadow-lg active:scale-95 flex-shrink-0 text-white ${
              isProfileLoading 
                ? 'bg-slate-700 animate-pulse cursor-wait'
                : !canSend 
                  ? 'bg-slate-700 cursor-not-allowed opacity-50' 
                  : isAnalysisMode 
                    ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/20' 
                    : isSearchMode 
                      ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-900/20' 
                      : settings.terminalMode 
                        ? 'bg-green-700 hover:bg-green-600 text-black' 
                        : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'
            }`}
            title={!canSend && !isProfileLoading ? "Saldo tidak cukup!" : "Kirim Pesan"}
          >
            {isProfileLoading ? <Loader2 size={18} className="animate-spin text-slate-400"/> : <Send size={18} />}
          </button>
        </form>
      </div>

      {/* --- FULL SCREEN IMAGE MODAL (LIGHTBOX) --- */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setZoomedImage(null)}
        >
          <button 
            className="absolute top-4 right-4 p-2 bg-slate-800 text-white rounded-full hover:bg-slate-700 transition-colors"
            onClick={() => setZoomedImage(null)}
          >
            <X size={24} />
          </button>
          <img 
            src={zoomedImage} 
            alt="Full Preview" 
            className="max-w-full max-h-full object-contain rounded shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()} // Mencegah tutup saat klik gambar
          />
        </div>
      )}

    </div>
  );
};