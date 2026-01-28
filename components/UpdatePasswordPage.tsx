
import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Cpu, CheckCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface UpdatePasswordPageProps {
  onComplete: () => void;
}

export const UpdatePasswordPage: React.FC<UpdatePasswordPageProps> = ({ onComplete }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
        {success ? (
          <div className="animate-in zoom-in">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Password Diperbarui!</h2>
            <p className="text-slate-400 text-sm">Anda akan dialihkan ke halaman login...</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-400">
              <Lock size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Buat Password Baru</h2>
            <p className="text-slate-400 text-sm mb-8">Silakan masukkan password baru untuk mengamankan akun Anda.</p>

            <form onSubmit={handleUpdate} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Password Baru</label>
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

              {error && <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded text-center">{error}</div>}

              <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl font-bold transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg">
                {loading ? <Cpu size={16} className="animate-spin"/> : 'Perbarui Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
