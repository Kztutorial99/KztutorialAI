
import React, { useState } from 'react';
import { X, LogOut, User, CreditCard, Shield, Zap, Terminal, Smartphone, Gift, Cpu, Mail, Lock, FileText, HelpCircle, Eye, EyeOff, Crown } from 'lucide-react';
import { AppSettings } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';

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

  // Helper Check Premium
  const isPremium = profile?.is_premium && profile.premium_until && new Date(profile.premium_until) > new Date();
  const premiumExpiry = profile?.premium_until ? new Date(profile.premium_until).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'}) : '-';

  // FIX NAME DISPLAY: Gunakan Nama Profile, jika kosong gunakan bagian depan email, jika tidak ada gunakan 'User'
  const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'User';

  if (!isOpen) return null;

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
            // Pastikan full_name terkirim ke metadata
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
            {session ? 'Akun Saya' : (authMode === 'login' ? 'Login' : authMode === 'signup' ? 'Daftar' : 'Reset Password')}
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
            <div className="space-y-6 p-6 animate-in fade-in duration-300">
              <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 p-4 rounded-xl border border-blue-500/30 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-bold truncate">{displayName}</h3>
                  <p className="text-xs text-slate-400 truncate">{profile?.email}</p>
                </div>
              </div>

              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm font-medium">Status Akun</span>
                  <span className={`text-sm font-bold flex items-center gap-1 ${isPremium ? 'text-yellow-400' : 'text-slate-300'}`}>
                    {isPremium ? <Crown size={16} fill="currentColor" /> : <User size={16} />}
                    {isPremium ? 'Premium' : 'Free Tier'}
                  </span>
                </div>

                {isPremium ? (
                  <div className="text-xs text-slate-500 bg-slate-900/50 p-2 rounded">
                    Berakhir pada: <span className="text-white font-bold">{premiumExpiry}</span>
                  </div>
                ) : (
                   <div className="flex justify-between text-xs text-slate-500 bg-slate-900/50 p-2 rounded">
                      <span>Limit Harian:</span>
                      <span className="text-white font-bold">{profile?.daily_usage || 0} / 20 Chat</span>
                   </div>
                )}

                <button onClick={onOpenTopUp} className={`w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-sm ${isPremium ? 'bg-slate-700 text-slate-300' : 'bg-green-600 hover:bg-green-500 text-white'}`}>
                  {isPremium ? 'Perpanjang Premium' : 'Upgrade ke Premium'}
                </button>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Pengaturan</h4>
                <div className="space-y-2">
                  <button onClick={() => toggleSetting('terminalMode')} className="w-full flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <Terminal size={16} className={settings.terminalMode ? "text-green-400" : "text-slate-400"} />
                      <span className="text-sm text-slate-300">Terminal Mode</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${settings.terminalMode ? "bg-green-500/20 text-green-400" : "bg-slate-700 text-slate-400"}`}>
                      {settings.terminalMode ? 'ON' : 'OFF'}
                    </span>
                  </button>
                  <button onClick={() => toggleSetting('hapticEnabled')} className="w-full flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <Smartphone size={16} className={settings.hapticEnabled ? "text-purple-400" : "text-slate-400"} />
                        <span className="text-sm text-slate-300">Haptic Feedback</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${settings.hapticEnabled ? "bg-purple-500/20 text-purple-400" : "bg-slate-700 text-slate-400"}`}>
                        {settings.hapticEnabled ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <button onClick={() => onNavigate('privacy')} className="flex items-center gap-2 p-3 bg-slate-800/30 rounded-lg text-xs text-slate-400 hover:text-white transition-colors">
                       <Lock size={14}/> Privacy
                    </button>
                    <button onClick={() => onNavigate('terms')} className="flex items-center gap-2 p-3 bg-slate-800/30 rounded-lg text-xs text-slate-400 hover:text-white transition-colors">
                       <FileText size={14}/> Terms
                    </button>
                </div>
              </div>

              <button onClick={() => { signOut(); onClose(); }} className="w-full flex items-center justify-center gap-2 p-3 bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg transition-all font-bold text-sm border border-slate-700/50">
                <LogOut size={16} /> Keluar Akun
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
