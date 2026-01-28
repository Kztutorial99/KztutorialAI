import React from 'react';
import { Code2, Zap, Shield, Globe, Cpu, ArrowRight, CheckCircle, Terminal, CheckCircle2 } from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
  onNavigate: (page: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-blue-500/30 font-sans flex flex-col overflow-hidden">
      
      {/* NAVBAR */}
      <nav className="border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Code2 size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-100">Kz.tutorial <span className="text-blue-400">AI</span></span>
          </div>
          <button 
            onClick={onLoginClick}
            className="px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-all hover:border-blue-500/50 hover:text-blue-400"
          >
            Masuk / Daftar
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 relative">
        
        {/* Background Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] -z-10 pointer-events-none opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Zap size={12} fill="currentColor" />
          AI CODING ASSISTANT V2.0 TELAH RILIS
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 max-w-5xl leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          Coding Lebih Cepat dengan <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Kecerdasan Buatan</span>
        </h1>

        {/* Subheadline */}
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          Asisten coding canggih khusus Developer. 
          Dilengkapi dengan Web Search Real-time, Debugging Cerdas, dan Multi-Model AI (Llama 3.3).
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300 relative z-10">
          <button 
            onClick={onLoginClick}
            className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 ring-1 ring-white/10"
          >
            Mulai Gratis Sekarang
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
          </button>
          <button onClick={onLoginClick} className="px-8 py-4 bg-slate-800/50 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-xl font-bold text-lg transition-all active:scale-95 backdrop-blur-sm">
            Lihat Demo
          </button>
        </div>

        {/* FEATURES GRID */}
        <div className="grid md:grid-cols-3 gap-6 mt-24 max-w-6xl w-full text-left animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500 px-4">
          <FeatureCard 
            icon={<Globe className="text-cyan-400" />} 
            title="Web Search Real-Time" 
            desc="AI yang terhubung ke internet untuk mencari dokumentasi terbaru, solusi error terkini, dan referensi coding valid."
          />
          <FeatureCard 
            icon={<Cpu className="text-purple-400" />} 
            title="Multi-Model Brain" 
            desc="Otomatis beralih antara Llama-3 8B untuk kecepatan kilat, atau 70B untuk logika algoritma yang kompleks."
          />
          <FeatureCard 
            icon={<Terminal className="text-emerald-400" />} 
            title="Hacker / Terminal Mode" 
            desc="Tampilan UI khusus untuk pengguna Termux atau pecinta CLI. Fokus pada kode, tanpa gangguan visual."
          />
        </div>

        {/* STATS */}
        <div className="mt-20 border-t border-white/5 pt-10 flex flex-wrap justify-center gap-8 md:gap-20 text-slate-500 font-medium text-sm md:text-base">
           <div className="flex items-center gap-2"><CheckCircle size={18} className="text-blue-500"/> 100% Data Aman</div>
           <div className="flex items-center gap-2"><CheckCircle size={18} className="text-blue-500"/> Optimized for Termux</div>
           <div className="flex items-center gap-2"><CheckCircle size={18} className="text-blue-500"/> High Speed AI Engine</div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="py-8 border-t border-white/5 text-center text-slate-600 text-sm bg-slate-950/30">
        <div className="mb-4 flex justify-center gap-6">
            <button onClick={() => onNavigate('privacy')} className="hover:text-blue-400 transition-colors">Privacy</button>
            <button onClick={() => onNavigate('terms')} className="hover:text-blue-400 transition-colors">Terms</button>
            <button onClick={() => onNavigate('help')} className="hover:text-blue-400 transition-colors">Help</button>
        </div>
        <p>&copy; {new Date().getFullYear()} Kz.tutorial AI. Built for Developers.</p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="p-6 rounded-2xl bg-slate-800/30 border border-white/5 hover:border-blue-500/30 hover:bg-slate-800/50 transition-all group cursor-default backdrop-blur-sm">
    <div className="mb-4 p-3 bg-slate-900 rounded-lg w-fit border border-slate-700 shadow-inner group-hover:scale-110 transition-transform duration-300">{icon}</div>
    <h3 className="text-white font-bold text-lg mb-2 group-hover:text-blue-400 transition-colors">{title}</h3>
    <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
  </div>
);