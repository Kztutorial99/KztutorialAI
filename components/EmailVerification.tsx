import React from 'react';
import { Mail, CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';

interface EmailVerificationProps {
  email: string;
  onLoginClick: () => void;
}

export const EmailVerification: React.FC<EmailVerificationProps> = ({ email, onLoginClick }) => {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/30 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative z-10 w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl text-center">
        <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
          <div className="relative bg-slate-800 p-5 rounded-full border border-slate-700 shadow-inner">
            <Mail size={40} className="text-blue-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1.5 rounded-full border-4 border-slate-900">
             <CheckCircle size={16} />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Cek Email Kamu!</h2>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          Link verifikasi telah dikirim ke: <br/>
          <span className="text-white font-mono bg-slate-800/80 px-2 py-1 rounded border border-slate-700 mt-1 inline-block">{email}</span>
        </p>

        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mb-6 text-left">
          <div className="flex items-start gap-3">
             <div className="mt-1"><RefreshCw size={16} className="text-blue-400 animate-spin-slow"/></div>
             <div>
               <h3 className="text-xs font-bold text-blue-300 uppercase mb-1">Langkah Selanjutnya</h3>
               <p className="text-xs text-slate-400">Klik tautan di email untuk mengaktifkan akunmu secara otomatis.</p>
             </div>
          </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => window.open('https://gmail.com', '_blank')}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            Buka Gmail <ArrowRight size={18}/>
          </button>
          <button onClick={onLoginClick} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-all text-sm">
            Kembali ke Login
          </button>
        </div>
      </div>
    </div>
  );
};