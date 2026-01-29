import React, { useState, useRef, useEffect, memo } from 'react';
import { Send, Bot, User, Code2, Settings, Zap, Terminal, AlertTriangle, FileCode, Sparkles, BrainCircuit, ArrowDown, ChevronDown, Coins, Bell, Trash2, Check, Copy, Share2, ThumbsUp, ThumbsDown, Globe, Camera, Maximize2, X, Loader2, Link as LinkIcon, ExternalLink, CreditCard, Crown, Star, Clock } from 'lucide-react';
import { Message, AppSettings } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { ImageUpload } from './ImageUpload';
import { useAuth } from '../contexts/AuthContext'; 

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string, isAnalysis?: boolean, isSearch?: boolean, image?: string) => void;
  onClearChat: () => void;
  onOpenSettings: () => void;
  onOpenInbox: () => void;
  onOpenTopUp: () => void; 
  unreadCount: number;
  settings: AppSettings;
  error: string | null;
  userCredits: number;
  isProfileLoading: boolean;
  cooldownTimer?: number; // New Prop
}

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

// --- COMPONENT: SOURCE CARD ---
const SourceCard: React.FC<{ title: string, url: string, isTerminal?: boolean }> = ({ title, url, isTerminal }) => {
  let hostname = "web";
  try {
    hostname = new URL(url).hostname.replace('www.', '');
  } catch (e) {}

  const terminalClasses = "bg-black border border-green-800 hover:border-green-500 rounded-none text-green-500";
  const standardClasses = "bg-slate-900/40 border border-slate-700/50 rounded-xl hover:bg-slate-800 hover:border-blue-500/30";

  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer" 
      className={`flex items-center gap-3 px-3 py-2.5 transition-all group max-w-[200px] flex-shrink-0 ${isTerminal ? terminalClasses : standardClasses}`}
    >
      <div className={`w-8 h-8 flex items-center justify-center shrink-0 border transition-colors ${
        isTerminal 
          ? 'bg-black border-green-800 group-hover:border-green-500 rounded-none' 
          : 'bg-slate-800 border-slate-700 group-hover:border-blue-500/30 rounded-lg'
      }`}>
        <img 
          src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`} 
          alt="icon" 
          className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity"
          onError={(e) => { e.currentTarget.style.display='none'; }}
        />
        <Globe size={14} className={`${isTerminal ? 'text-green-700' : 'text-slate-500'} absolute group-hover:hidden`} style={{display: 'none'}} /> 
      </div>
      <div className="flex flex-col min-w-0">
        <span className={`text-xs font-bold truncate transition-colors ${isTerminal ? 'text-green-500 group-hover:text-green-400' : 'text-slate-300 group-hover:text-blue-400'}`}>{title}</span>
        <div className={`flex items-center gap-1 text-[10px] truncate ${isTerminal ? 'text-green-800' : 'text-slate-500'}`}>
          <LinkIcon size={10} />
          <span className="truncate">{hostname}</span>
        </div>
      </div>
    </a>
  );
};

const MessageActions = ({ content, isTerminal }: { content: string, isTerminal: boolean }) => {
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

  const btnClass = isTerminal 
    ? "text-green-700 hover:text-green-400" 
    : "text-slate-400 hover:text-white";

  return (
    <div className="flex items-center gap-4 mt-4 mb-2 opacity-60 hover:opacity-100 transition-opacity pl-1">
      <button onClick={handleCopy} className={`flex items-center gap-1.5 text-xs transition-colors ${btnClass}`} title="Salin">
        {copied ? <Check size={14} className={isTerminal ? "text-green-500" : "text-emerald-400"} /> : <Copy size={14} />}
      </button>
      <button onClick={handleLike} className={`flex items-center gap-1.5 text-xs transition-colors ${
        feedback === 'like' 
          ? (isTerminal ? 'text-green-400' : 'text-blue-400')
          : (isTerminal ? 'text-green-700 hover:text-green-400' : 'text-slate-400 hover:text-blue-400')
      }`}>
        <ThumbsUp size={14} className={feedback === 'like' ? (isTerminal ? 'fill-green-400' : 'fill-blue-400') : ''} />
      </button>
      <button onClick={handleDislike} className={`flex items-center gap-1.5 text-xs transition-colors ${
        feedback === 'dislike' 
          ? 'text-red-400' 
          : (isTerminal ? 'text-green-700 hover:text-red-400' : 'text-slate-400 hover:text-red-400')
      }`}>
        <ThumbsDown size={14} className={feedback === 'dislike' ? 'fill-red-400' : ''} />
      </button>
      <button onClick={handleShare} className={`flex items-center gap-1.5 text-xs transition-colors ${btnClass}`} title="Bagikan">
        <Share2 size={14} />
      </button>
    </div>
  );
};

const SuggestedActions = memo(({ lastMessage, onAction, isTerminal }: { lastMessage: string, onAction: (text: string) => void, isTerminal: boolean }) => {
  const [actions, setActions] = useState<{ label: string; icon: React.ReactNode; prompt: string }[]>([]);

  useEffect(() => {
    if (!lastMessage) return;
    const lowerMsg = lastMessage.toLowerCase();
    let candidates: { label: string; icon: React.ReactNode; prompt: string }[] = [];

    if (lowerMsg.includes("def ") || lowerMsg.includes("import ") || lowerMsg.includes("```python")) {
      candidates.push(
        { label: "Cara Jalankan?", icon: <Terminal size={12}/>, prompt: "Bagaimana cara menjalankan script ini di Termux?" },
        { label: "Jelaskan Code", icon: <FileCode size={12}/>, prompt: "Jelaskan alur kode di atas baris per baris." },
        { label: "Optimalkan", icon: <Zap size={12}/>, prompt: "Bisakah kode ini dibuat lebih efisien?" }
      );
    } 
    else if (lowerMsg.includes("termux") || lowerMsg.includes("pkg") || lowerMsg.includes("apt")) {
      candidates.push(
        { label: "Fungsi Command", icon: <Terminal size={12}/>, prompt: "Jelaskan fungsi perintah tersebut." },
        { label: "Cara Install", icon: <Zap size={12}/>, prompt: "Bagaimana cara install paket ini?" }
      );
    }
    else if (lowerMsg.includes("error") || lowerMsg.includes("failed") || lowerMsg.includes("salah")) {
      candidates.push(
        { label: "Analisis Error", icon: <BrainCircuit size={12}/>, prompt: "Analisis kenapa error ini terjadi dan berikan solusinya." },
        { label: "Solusi Lain", icon: <Sparkles size={12}/>, prompt: "Apakah ada cara lain yang lebih mudah?" }
      );
    }
    
    // Default actions only if no context found
    if (candidates.length === 0) {
      candidates.push(
        { label: "Tips Termux", icon: <Terminal size={12}/>, prompt: "Berikan tips trik rahasia Termux." },
        { label: "Ide Project", icon: <Sparkles size={12}/>, prompt: "Berikan ide project coding yang seru." }
      );
    }
    setActions(candidates.sort(() => 0.5 - Math.random()).slice(0, 3));
  }, [lastMessage]);

  if (!actions.length) return null;

  return (
    <div className={`mt-4 pt-3 flex flex-wrap gap-2 animate-in slide-in-from-bottom-2 fade-in duration-500 ${isTerminal ? 'border-t border-green-900' : 'border-t border-slate-700/30'}`}>
      {actions.map((action, idx) => (
        <button
          key={idx}
          onClick={() => onAction(action.prompt)}
          className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs transition-all group active:scale-95 ${
            isTerminal 
              ? 'bg-black border-green-800 text-green-600 hover:bg-green-900/20 hover:text-green-400 hover:border-green-500 rounded-none' 
              : 'bg-slate-800 hover:bg-blue-600/20 border-slate-700 hover:border-blue-500/50 text-slate-300 hover:text-blue-300'
          }`}
        >
          <span className={isTerminal ? "text-green-700 group-hover:text-green-400" : "text-blue-400 group-hover:text-blue-300 opacity-70"}>{action.icon}</span>
          {action.label}
        </button>
      ))}
    </div>
  );
});

// --- HELPER PARSING ---
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

// --- HELPER: PARSE SPECIAL TAGS ---
const parseSpecialTags = (content: string) => {
  // 1. Sources
  const sourceRegex = /\[SUMBER:\s*(.*?)\s*\|\s*(.*?)\]/g;
  const sources: { title: string, url: string }[] = [];
  let match;
  while ((match = sourceRegex.exec(content)) !== null) {
    if (match[1] && match[2]) sources.push({ title: match[1].trim(), url: match[2].trim() });
  }

  // 2. Actions (e.g. [ACTION:OPEN_TOPUP])
  const actionRegex = /\[ACTION:\s*([A-Z_]+)\s*\]/g;
  const actions: string[] = [];
  while ((match = actionRegex.exec(content)) !== null) {
    if (match[1]) actions.push(match[1].trim());
  }

  // 3. Stats (Legacy, ignored in new logic)
  const statsRegex = /\[STATS:\s*(.*?)\]/g;
  let stats = null;
  match = statsRegex.exec(content);
  if (match && match[1]) stats = match[1].trim();

  // 4. Clean Content
  let cleanContent = content
    .replace(sourceRegex, '')
    .replace(actionRegex, '')
    .replace(statsRegex, '')
    .trim();

  // Extra cleanup for lists
  if (sources.length > 0) {
    const listSectionRegex = /\n+(?:#+\s*)?(?:\*\*|__)?(?:Sumber|Referensi|Sources|References|Citations)(?:\*\*|__)?\s*:?\s*(?:\n\s*(?:[-*]|\d+\.).*)+$/i;
    const hangingHeaderRegex = /\n+(?:#+\s*)?(?:\*\*|__)?(?:Sumber|Referensi|Sources|References|Citations)(?:\*\*|__)?\s*:?\s*$/i;
    cleanContent = cleanContent.replace(listSectionRegex, '').replace(hangingHeaderRegex, '').trim();
  }

  return { cleanContent, sources, actions, stats };
};

const ThinkingIndicator = ({ isTerminal }: { isTerminal: boolean }) => (
  <div className={`flex items-center gap-2 p-3 w-fit animate-pulse border ${
    isTerminal 
      ? 'bg-black border-green-800 rounded-none text-green-500' 
      : 'bg-slate-800/30 rounded-2xl border-slate-700/30'
  }`}>
    <BrainCircuit size={16} className={isTerminal ? "text-green-500" : "text-purple-400"} />
    <span className={`text-xs font-mono ${isTerminal ? "text-green-500" : "text-slate-500"}`}>AI sedang berpikir...</span>
  </div>
);

const ReasoningAccordion: React.FC<{ reasoning: string; isStreaming: boolean; isTerminal: boolean }> = ({ reasoning, isStreaming, isTerminal }) => {
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => { if (isStreaming) setIsOpen(true); else setIsOpen(false); }, [isStreaming]);

  const containerClass = isTerminal 
    ? "mb-4 border border-green-800 rounded-none bg-black"
    : "mb-4 border border-slate-700/50 rounded-lg overflow-hidden bg-black/20";
    
  const buttonClass = isTerminal
    ? "w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-green-700 hover:text-green-500 hover:bg-green-900/10 transition-colors"
    : "w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors";

  const contentClass = isTerminal
    ? "px-3 py-3 border-t border-green-900 bg-black text-xs font-mono text-green-600 whitespace-pre-wrap leading-relaxed"
    : "px-3 py-3 border-t border-slate-700/50 bg-[#111] text-xs font-mono text-slate-400 whitespace-pre-wrap leading-relaxed animate-in slide-in-from-top-2";

  return (
    <div className={containerClass}>
      <button onClick={() => setIsOpen(!isOpen)} className={buttonClass}>
        <BrainCircuit size={14} className={isStreaming ? "animate-pulse" : ""} />
        <span>{isStreaming ? "Thinking Process..." : "Lihat Proses Berpikir"}</span>
        <ChevronDown size={12} className={`ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className={contentClass}>
          {reasoning}
          {isStreaming && <span className={`inline-block w-1.5 h-3 ml-1 animate-pulse ${isTerminal ? 'bg-green-500' : 'bg-purple-500'}`}/>}
        </div>
      )}
    </div>
  );
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, isLoading, onSendMessage, onClearChat, onOpenSettings, onOpenInbox, onOpenTopUp, unreadCount, settings, error, isProfileLoading, cooldownTimer = 0 
}) => {
  const { profile } = useAuth(); // Access profile directly
  const [input, setInput] = useState('');
  const [isAnalysisMode, setIsAnalysisMode] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const prevUnreadCountRef = useRef(unreadCount);
  
  // NEW STATE FOR LIMIT POPUP
  const [showLimitPopup, setShowLimitPopup] = useState(false);
  
  const prevLoadingRef = useRef(isLoading);
  const { terminalMode } = settings;

  // SUBSCRIPTION CHECK LOGIC
  const isPremium = profile?.is_premium && profile.premium_until && new Date(profile.premium_until) > new Date();
  const dailyUsage = profile?.daily_usage || 0;
  const isLimitReached = !isPremium && dailyUsage >= 20;
  const isCooldown = cooldownTimer > 0;

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
      if (force || isAtBottom) {
        scrollContainerRef.current.scrollTo({ 
          top: scrollHeight, 
          behavior: 'smooth' 
        });
      }
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      setShowScrollButton((scrollHeight - scrollTop - clientHeight) > 100);
    }
  };

  useEffect(() => {
    if (prevLoadingRef.current === true && isLoading === false) {
      scrollToBottom(true);
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
      scrollToBottom(true);
    }
  }, [messages.length]);

  useEffect(() => {
    if (!isLoading && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && settings.hapticEnabled) {
      if (navigator.vibrate) navigator.vibrate(20);
    }
  }, [isLoading, messages, settings.hapticEnabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || isLoading || isProfileLoading || isCooldown) return;
    
    // CUSTOM UI FOR LIMIT REACHED
    if (isLimitReached) {
      setShowLimitPopup(true);
      setTimeout(() => setShowLimitPopup(false), 5000); // Auto hide after 5s
      return;
    }
    
    onSendMessage(input, isAnalysisMode, isSearchMode, selectedImage || undefined);
    
    setInput('');
    setSelectedImage(null);
    setIsAnalysisMode(false);
    setIsSearchMode(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const renderUserMessage = (content: string) => {
    let imageUrl = '';
    let textPart = content;

    if (content.startsWith('![User Image]')) {
      const splitIndex = content.indexOf(')\n\n');
      if (splitIndex !== -1) {
        const imagePart = content.substring(0, splitIndex + 1);
        textPart = content.substring(splitIndex + 3);
        imageUrl = imagePart.match(/\((.*?)\)/)?.[1] || '';
      }
    }

    const bubbleClass = terminalMode
      ? "bg-black border border-green-500 text-green-500 rounded-none px-4 py-2.5 w-fit max-w-[90%] break-words font-mono"
      : "bg-blue-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-none shadow-sm w-fit max-w-[90%] break-words";

    return (
      <div className="flex flex-col gap-2 items-end w-full">
        {imageUrl && (
          <div className="relative group cursor-pointer mb-1" onClick={() => setZoomedImage(imageUrl)}>
            <img 
              src={imageUrl} 
              alt="Uploaded" 
              className={`max-h-60 object-contain ${terminalMode ? 'rounded-none border border-green-500' : 'rounded-xl border border-white/10 shadow-lg'}`}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <Maximize2 className="text-white" size={20} />
            </div>
          </div>
        )}
        {textPart && (
          <div className={bubbleClass}>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{textPart}</p>
          </div>
        )}
      </div>
    );
  };

  const displayMessages = messages.filter(m => m.role !== 'system');
  const fontClass = terminalMode ? 'font-mono tracking-tight text-green-500 selection:bg-green-500/30' : 'font-sans';
  const headerClass = terminalMode ? 'bg-black border-green-900 border-b-2' : 'bg-slate-900/80 border-slate-800 shadow-sm border-b';

  return (
    <div className={`flex flex-col h-full relative ${fontClass} ${terminalMode ? 'bg-black' : 'bg-slate-950'}`}>
      
      {terminalMode && <div className="crt-scanlines fixed inset-0 z-[100] pointer-events-none opacity-20"></div>}

      <header className={`h-16 flex items-center justify-between px-4 shrink-0 z-20 backdrop-blur-md ${headerClass}`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 flex items-center justify-center text-white shadow-lg ${terminalMode ? 'bg-green-900 rounded-none' : 'bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl'}`}>
            <Code2 size={18} className={terminalMode ? "text-green-300" : "text-white"} />
          </div>
          <div className="flex flex-col">
            <h1 className={`font-bold text-sm ${terminalMode ? 'text-green-500' : 'text-white'}`}>AI ASISTEN</h1>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${terminalMode ? 'bg-green-500' : 'bg-emerald-500'}`}></span>
              <span className={`text-[10px] ${terminalMode ? 'text-green-800' : 'text-slate-400'}`}>Online | Kz.tutorial</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
           {/* SUBSCRIPTION STATUS INDICATOR */}
           <div 
             onClick={onOpenTopUp}
             className={`flex items-center gap-1 px-2.5 py-1.5 border cursor-pointer hover:opacity-80 transition-opacity ${
             terminalMode 
               ? 'bg-black border-green-800 rounded-none' 
               : (isPremium ? 'bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-500/30 rounded-full' : 'bg-slate-800/80 border-slate-700/50 rounded-full')
           }`}>
             {isPremium ? (
               <>
                 <Crown size={14} className={terminalMode ? "text-green-500" : "text-yellow-400"} fill="currentColor" />
                 <span className={`text-xs font-bold ${terminalMode ? 'text-green-500' : 'text-yellow-400'}`}>PREMIUM</span>
               </>
             ) : (
               <>
                 <Coins size={14} className={terminalMode ? "text-green-500" : "text-slate-400"} />
                 <span className={`text-xs font-bold ${terminalMode ? 'text-green-500' : 'text-slate-300'}`}>
                    {20 - dailyUsage}/20 Free
                 </span>
               </>
             )}
           </div>

           <button onClick={onOpenInbox} className={`p-2 transition-all relative ${
             isRinging 
               ? (terminalMode ? 'text-green-400 scale-110' : 'text-yellow-400 scale-110') 
               : (terminalMode ? 'text-green-700 hover:text-green-500' : 'text-slate-400 hover:text-white')
             } ${terminalMode ? 'rounded-none' : 'rounded-xl'}`}>
             <Bell size={18} className={isRinging ? 'animate-bounce' : ''} />
             {unreadCount > 0 && (
               <span className={`absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 flex items-center justify-center border-2 border-slate-900 ${terminalMode ? 'bg-green-600 rounded-none' : 'bg-red-500 rounded-full'}`}>
                 <span className="text-[8px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
               </span>
             )}
           </button>

           <button onClick={onClearChat} className={`p-2 transition-all ${terminalMode ? 'text-green-700 hover:text-red-500 rounded-none' : 'text-slate-400 hover:text-red-400 rounded-xl'}`} title="Hapus Chat">
             <Trash2 size={18} />
           </button>

           <button onClick={onOpenSettings} className={`p-2 transition-all ${terminalMode ? 'text-green-700 hover:text-green-500 rounded-none' : 'text-slate-400 hover:text-white rounded-xl'}`}>
             <Settings size={18} />
           </button>
        </div>
      </header>

      <div 
        ref={scrollContainerRef} 
        onScroll={handleScroll} 
        className={`flex-1 overflow-y-auto p-4 space-y-8 scroll-smooth ${terminalMode ? 'pb-24' : 'pb-40'} ${terminalMode ? 'bg-black' : 'bg-slate-950'}`}
      >
        {displayMessages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center px-6 text-center animate-in fade-in zoom-in duration-700">
            <div className={`w-20 h-20 mb-6 flex items-center justify-center ${terminalMode ? 'bg-black border-2 border-green-500 rounded-none' : 'bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-2xl'}`}>
              <BlinkingBot size={40} className={terminalMode ? "text-green-500" : "text-white"} />
            </div>
            
            <div className={`max-w-md space-y-4 ${terminalMode ? 'font-mono text-green-500' : 'text-slate-300'}`}>
              <h2 className="text-xl font-black tracking-tight">
                {isPremium && <>Mode PREMIUM Aktif! 🚀<br/></>}
                Selamat datang di <span className={terminalMode ? "underline" : "text-blue-400"}>KztutorialAI</span>, Bro! 🥳
              </h2>
              <p className="text-sm leading-relaxed opacity-80">
                Gue partner koding di sini. Apapun kendala soal Termux, Python, atau project lainnya, langsung gas tanya aja.
              </p>
              
              {!isPremium && (
                <div className={`p-3 text-xs border ${terminalMode ? 'border-green-900 bg-black' : 'bg-slate-900/50 border-slate-800 rounded-xl'}`}>
                  Limit harian sisa <span className="font-bold text-yellow-400">{20 - dailyUsage}</span>. 
                  Mau unlimited? <button onClick={onOpenTopUp} className="text-blue-400 font-bold hover:underline">Upgrade Premium</button>
                </div>
              )}
              
              <p className="text-xs font-bold animate-pulse pt-4">
                {terminalMode ? '> SIAP EKSEKUSI PROJECT APA HARI INI?' : 'Jadi, project apa yang mau kita eksekusi hari ini?'}
              </p>
            </div>
          </div>
        )}

        {displayMessages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const { hasReasoning, reasoning, finalAnswer } = parseMessageContent(msg.content);
          const { cleanContent, sources, actions, stats } = !isUser ? parseSpecialTags(finalAnswer) : { cleanContent: finalAnswer, sources: [], actions: [], stats: null };

          const isStreamingMsg = isLoading && index === displayMessages.length - 1 && !isUser;
          const showActions = !isUser && index === displayMessages.length - 1 && !isLoading;
          
          return (
            <div key={msg.id} className={`flex flex-col w-full ${isUser ? 'items-end' : 'items-start animate-in fade-in slide-in-from-left-2 duration-300'}`}>
              <div className={`flex gap-3 w-full ${isUser ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1 ${
                  isUser 
                    ? (terminalMode ? 'bg-black border border-green-500 text-green-500 rounded-none' : 'bg-blue-600 rounded-lg shadow-sm text-white')
                    : (terminalMode ? 'bg-black border border-green-800 text-green-500 rounded-none' : 'bg-slate-800 border border-slate-700 rounded-lg shadow-sm text-blue-400')
                }`}>
                  {isUser ? <User size={16} /> : <Bot size={18} />}
                </div>

                <div className={`flex flex-col min-w-0 flex-1 ${isUser ? 'items-end' : 'items-start'}`}>
                   {!isUser && (
                     <span className={`text-[10px] font-bold mb-1.5 ml-1 uppercase tracking-widest ${terminalMode ? 'text-green-700' : 'text-blue-400'}`}>
                       AI ASISTEN
                     </span>
                   )}
                   {isStreamingMsg && !msg.content ? <ThinkingIndicator isTerminal={terminalMode} /> : (
                     <div className={`w-full ${isUser ? 'flex flex-col items-end' : 'text-slate-300 py-1'}`}>
                        
                        {!isUser && hasReasoning && <ReasoningAccordion reasoning={reasoning} isStreaming={isStreamingMsg} isTerminal={terminalMode} />}
                        
                        {isUser ? renderUserMessage(msg.content) : (
                          <div className={`w-full max-w-full overflow-hidden break-words ${terminalMode ? 'text-green-500' : ''}`}>
                            <MarkdownRenderer content={cleanContent} isTerminal={terminalMode} />
                          </div>
                        )}

                        {!isUser && sources.length > 0 && (
                          <div className="mt-4 mb-2 animate-in fade-in slide-in-from-bottom-2">
                             <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-none">
                               {sources.map((src, i) => (
                                 <SourceCard key={i} title={src.title} url={src.url} isTerminal={terminalMode} />
                               ))}
                             </div>
                          </div>
                        )}

                        {!isUser && !isStreamingMsg && (
                          <>
                            <MessageActions content={cleanContent} isTerminal={terminalMode} />
                            {showActions && <SuggestedActions lastMessage={cleanContent} onAction={(text) => onSendMessage(text, false)} isTerminal={terminalMode} />}
                          </>
                        )}
                     </div>
                   )}
                   {!isStreamingMsg && (
                     <div className={`flex items-center gap-1.5 mt-1.5 px-1 ${isUser ? 'justify-end' : 'justify-start'} ${terminalMode ? 'text-green-800' : 'text-slate-500'}`}>
                        <span className="text-[10px] font-mono">
                          {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isUser && <Check size={12} strokeWidth={3} className={terminalMode ? "text-green-600" : "text-blue-500"} />}
                     </div>
                   )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showScrollButton && (
        <button onClick={() => scrollToBottom(true)} className={`absolute bottom-32 right-6 p-3 shadow-xl hover:scale-110 transition-all z-20 ${
          terminalMode 
            ? 'bg-black border border-green-500 text-green-500 rounded-none' 
            : 'bg-blue-600 text-white rounded-full'
        }`}>
          <ArrowDown size={20} />
        </button>
      )}

      {/* LIMIT REACHED POPUP */}
      {showLimitPopup && (
        <div className={`absolute bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-300 ${terminalMode ? 'bg-black border border-green-500' : 'bg-slate-900 border border-slate-700'} p-4 rounded-xl shadow-2xl flex items-center justify-between gap-4`}>
          <div className="flex items-center gap-3">
             <div className="p-2 bg-red-500/20 text-red-500 rounded-full">
               <AlertTriangle size={20} />
             </div>
             <div>
               <h4 className={`font-bold text-sm ${terminalMode ? 'text-green-500' : 'text-white'}`}>Limit Harian Habis</h4>
               <p className="text-xs text-slate-400">Kuota 20 chat tercapai. Upgrade untuk lanjut.</p>
             </div>
          </div>
          <button 
            onClick={onOpenTopUp}
            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${terminalMode ? 'bg-green-600 text-black hover:bg-green-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg'}`}
          >
            Upgrade Premium
          </button>
        </div>
      )}

      {terminalMode ? (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t-2 border-green-500 p-3">
          <form onSubmit={handleSubmit} className="flex items-center gap-3 max-w-7xl mx-auto">
             <div className="flex items-center gap-2 text-green-500 font-mono font-bold whitespace-nowrap">
               <span className="animate-pulse">{'>_'}</span>
               <span className="hidden sm:inline">User@Termux:~#</span>
             </div>
             
             <input
               value={input}
               disabled={isProfileLoading || isCooldown}
               onChange={(e) => setInput(e.target.value)}
               placeholder={isCooldown ? `Cooling down... ${cooldownTimer}s` : (isLimitReached ? "Limit Habis. Ketik untuk Info..." : "Enter command...")}
               className="flex-1 bg-transparent border-none outline-none text-green-500 font-mono placeholder-green-900"
               autoComplete="off"
             />

             <button
               type="button"
               onClick={() => { setIsAnalysisMode(!isAnalysisMode); setIsSearchMode(false); }}
               className={`p-1 ${isAnalysisMode ? 'text-green-400' : 'text-green-900 hover:text-green-600'}`}
               title="Analysis Mode"
             >
               <Sparkles size={16} />
             </button>

             <button 
                type="submit" 
                disabled={isLoading || (!input.trim() && !selectedImage) || isProfileLoading || isCooldown} 
                className={`p-1 font-mono font-bold ${
                  isLimitReached || isCooldown ? 'text-red-900' : 'text-green-500 hover:text-green-400'
                }`}
              >
                {isProfileLoading ? <Loader2 size={16} className="animate-spin"/> : isCooldown ? `${cooldownTimer}` : '[ENTER]'}
              </button>
          </form>
        </div>
      ) : (
        <div className="absolute bottom-4 left-4 right-4 z-50">
          <form onSubmit={handleSubmit} className="bg-slate-900/90 backdrop-blur-lg border border-slate-700 rounded-3xl p-2 shadow-2xl flex items-center gap-2">
            <div className="flex items-center gap-1 pl-1">
              <ImageUpload 
                previewImage={selectedImage} 
                onImageSelected={setSelectedImage} 
                onClear={() => setSelectedImage(null)} 
                isLoading={isLoading || isProfileLoading || isCooldown} 
              />
              <button
                type="button"
                onClick={() => { setIsAnalysisMode(!isAnalysisMode); setIsSearchMode(false); }}
                className={`p-2 rounded-lg transition-all ${isAnalysisMode ? 'bg-purple-600 text-white shadow-inner shadow-purple-900/40' : 'text-slate-400 hover:bg-slate-800'}`}
                title="Mode Analisis"
              >
                <Sparkles size={18} />
              </button>
            </div>

            <textarea
              ref={textareaRef}
              value={input}
              disabled={isProfileLoading || isCooldown} 
              onChange={(e) => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${e.target.scrollHeight}px`; }}
              placeholder={isProfileLoading ? "Memuat..." : (isCooldown ? `Tunggu ${cooldownTimer} detik...` : (isLimitReached ? "Limit Habis. Ketik untuk Info..." : "Ketik pesan..."))}
              className="flex-1 max-h-32 bg-transparent text-sm px-3 py-2 border-none focus:ring-0 text-white placeholder-slate-400 resize-none overflow-y-auto"
              rows={1}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
            />
            
            <div className="pr-1">
              <button 
                type="submit" 
                disabled={isLoading || (!input.trim() && !selectedImage) || isProfileLoading || isCooldown} 
                className={`p-2.5 rounded-xl transition-all shadow-md active:scale-90 flex-shrink-0 text-white min-w-[44px] flex items-center justify-center ${
                  (isLimitReached && input.trim()) ? 'bg-red-600 hover:bg-red-500 animate-pulse' : (isLimitReached ? 'bg-slate-700 opacity-50 cursor-not-allowed' : (isCooldown ? 'bg-slate-700 opacity-50' : 'bg-blue-600 hover:bg-blue-500'))
                }`}
              >
                {isProfileLoading ? <Loader2 size={18} className="animate-spin text-slate-400"/> : isCooldown ? <span className="text-xs font-bold">{cooldownTimer}</span> : <Send size={20} />}
              </button>
            </div>
          </form>
        </div>
      )}

      {zoomedImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setZoomedImage(null)}>
          <button className="absolute top-6 right-6 p-2 bg-slate-800 text-white rounded-full transition-transform active:scale-90"><X size={24} /></button>
          <img src={zoomedImage} alt="Full" className="max-w-full max-h-full object-contain rounded animate-in zoom-in-95" />
        </div>
      )}
    </div>
  );
};