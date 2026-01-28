import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface LegalLayoutProps {
  title: string;
  lastUpdated?: string;
  children: React.ReactNode;
  onBack: () => void;
}

export const LegalLayout: React.FC<LegalLayoutProps> = ({ title, lastUpdated, children, onBack }) => {
  return (
    <div className="min-h-screen bg-[#0f172a] font-sans text-slate-300 animate-in fade-in duration-300">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
              <ArrowLeft size={20} className="text-slate-400" />
            </button>
            <span className="text-lg font-medium text-white">Kz.tutorial AI <span className="text-slate-600">|</span> {title}</span>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{title}</h1>
        {lastUpdated && <p className="text-sm text-slate-500 mb-8">Terakhir diperbarui: {lastUpdated}</p>}
        <div className="prose prose-invert max-w-none prose-headings:font-semibold prose-a:text-blue-400 prose-p:text-slate-300">
          {children}
        </div>
      </main>
      <footer className="bg-[#0f172a] border-t border-slate-800 py-8 mt-12 text-center text-xs text-slate-500">
        &copy; 2026 Kz.tutorial AI Inc. • Jakarta, Indonesia
      </footer>
    </div>
  );
};