import React, { useEffect, useRef } from 'react';
import { Code2, Zap, Globe, Cpu, ArrowRight, CheckCircle, Terminal, Youtube } from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
  onNavigate: (page: string) => void;
}

const Starfield: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Star[] = [];
    const starCount = 400; // Reduced star count for a cleaner look
    const moveSpeed = 0.4; // Drastically reduced speed for ambient feel

    class Star {
      x: number;
      y: number;
      z: number;
      px: number;
      py: number;

      constructor() {
        this.x = (Math.random() - 0.5) * canvas.width * 2;
        this.y = (Math.random() - 0.5) * canvas.height * 2;
        this.z = Math.random() * canvas.width;
        this.px = 0;
        this.py = 0;
      }

      update() {
        this.z -= moveSpeed; // Slow, constant movement
        if (this.z <= 0) {
          this.z = canvas.width;
          this.x = (Math.random() - 0.5) * canvas.width * 2;
          this.y = (Math.random() - 0.5) * canvas.height * 2;
          this.px = 0;
          this.py = 0;
        }
      }

      show() {
        const sx = map(this.x / this.z, 0, 1, 0, canvas.width) + canvas.width / 2;
        const sy = map(this.y / this.z, 0, 1, 0, canvas.height) + canvas.height / 2;

        const r = map(this.z, 0, canvas.width, 2.5, 0);

        if (this.px !== 0) {
          const opacity = map(this.z, 0, canvas.width, 0.8, 0.05);
          const isBlue = Math.random() > 0.9;
          ctx!.strokeStyle = isBlue ? `rgba(96, 165, 250, ${opacity})` : `rgba(255, 255, 255, ${opacity})`;
          ctx!.lineWidth = r;
          ctx!.beginPath();
          ctx!.moveTo(sx, sy);
          ctx!.lineTo(this.px, this.py);
          ctx!.stroke();
        }

        this.px = sx;
        this.py = sy;
      }
    }

    const map = (value: number, start1: number, stop1: number, start2: number, stop2: number) => {
      return ((value - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
    };

    const init = () => {
      stars = [];
      for (let i = 0; i < starCount; i++) {
        stars.push(new Star());
      }
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const draw = () => {
      // Use semi-transparent fill for motion trail effect
      ctx.fillStyle = "rgba(2, 6, 23, 0.2)"; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let star of stars) {
        star.update();
        star.show();
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
};

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onNavigate }) => {
  return (
    <div className="relative min-h-screen bg-[#020617] text-white selection:bg-blue-500/30 font-sans overflow-x-hidden">
      
      {/* --- LAYER 0: AMBIENT STARFIELD --- */}
      <Starfield />
      
      {/* Subtle Overlay to ensure readability and depth */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#020617]/60 via-transparent to-[#020617]/90 z-[1] pointer-events-none"></div>

      {/* --- LAYER 10: KONTEN UTAMA --- */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* NAVBAR */}
        <nav className="border-b border-white/5 bg-slate-950/40 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/10">
                <Code2 size={18} className="text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-100">Kz.tutorial <span className="text-blue-400">AI</span></span>
            </div>
            <button 
              onClick={onLoginClick}
              className="px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-all hover:border-blue-500/50 hover:text-blue-400 active:scale-95"
            >
              Masuk / Daftar
            </button>
          </div>
        </nav>

        {/* HERO SECTION */}
        <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Zap size={12} fill="currentColor" />
            AI ASSISTANT V1.0 TELAH RILIS
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
          <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <button 
              onClick={onLoginClick}
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-xl shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 ring-1 ring-white/10"
            >
              Mulai Gratis Sekarang
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
            </button>
            <button onClick={onLoginClick} className="px-8 py-4 bg-slate-800/50 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-xl font-bold text-lg transition-all active:scale-95 backdrop-blur-sm">
              Lihat Demo
            </button>
          </div>

          {/* PROMOTIONAL BANNER */}
          <div className="w-full flex justify-center mt-4 mb-3 px-4 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-400">
            <div className="relative group max-w-3xl w-full">
              <div className="absolute inset-0 bg-blue-600/20 blur-2xl rounded-2xl group-hover:bg-blue-600/30 transition-all duration-700"></div>
              <img 
                src="https://gesoseeqaaixidsvrttz.supabase.co/storage/v1/object/public/Banner/banner1.png" 
                alt="Promo Banner" 
                className="relative w-full rounded-2xl shadow-2xl border border-slate-700/50 hover:scale-[1.01] transition-transform duration-500 cursor-pointer"
              />
            </div>
          </div>

          {/* FEATURES GRID */}
          <div className="grid md:grid-cols-3 gap-6 mt-12 max-w-6xl w-full text-left animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500 px-4">
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
        <footer className="py-8 border-t border-white/5 text-center text-slate-600 text-sm bg-slate-950/40 backdrop-blur-md">
          <div className="mb-4 flex justify-center gap-6">
              <button onClick={() => onNavigate('privacy')} className="hover:text-blue-400 transition-colors">Privacy</button>
              <button onClick={() => onNavigate('terms')} className="hover:text-blue-400 transition-colors">Terms</button>
              <button onClick={() => onNavigate('help')} className="hover:text-blue-400 transition-colors">Help</button>
          </div>
          <div className="mb-4">
            <a href="https://www.youtube.com/@Kz.tutorial" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-full transition-colors font-medium text-xs">
              <Youtube size={14} /> Subscribe Kz.tutorial
            </a>
          </div>
          <p>&copy; {new Date().getFullYear()} Kz.tutorial AI. Built for Developers.</p>
        </footer>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-blue-500/30 hover:bg-slate-900/60 transition-all group cursor-default backdrop-blur-md ring-1 ring-white/5">
    <div className="mb-4 p-3 bg-slate-950 rounded-lg w-fit border border-slate-800 shadow-inner group-hover:scale-110 transition-transform duration-300 ring-1 ring-white/5">{icon}</div>
    <h3 className="text-white font-bold text-lg mb-2 group-hover:text-blue-400 transition-colors">{title}</h3>
    <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
  </div>
);