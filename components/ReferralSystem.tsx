
import React, { useState, useEffect } from 'react';
import { Users, Copy, Check, Gift, Sparkles, AlertTriangle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

interface ReferralSystemProps {
  userId: string;
  onCreditsUpdate: () => void;
}

export const ReferralSystem: React.FC<ReferralSystemProps> = ({ userId, onCreditsUpdate }) => {
  const [myCode, setMyCode] = useState<string>('Loading...');
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);

  // Load Data User
  useEffect(() => {
    const fetchData = async () => {
      // Ambil Kode Saya
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', userId)
        .single();
      
      if (profile) setMyCode(profile.referral_code || '-');

      // Cek apakah saya sudah pernah klaim punya orang lain?
      const { data: refCheck } = await supabase
        .from('referrals')
        .select('id')
        .eq('referee_id', userId)
        .single();
      
      if (refCheck) setAlreadyClaimed(true);
    };
    fetchData();
  }, [userId]);

  // Fungsi Copy Code
  const handleCopy = () => {
    navigator.clipboard.writeText(myCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // FUNGSI KLAIM BARU (DENGAN SECURITY CHECK & SILENT BLOCK)
  const handleClaim = async () => {
    if (!inputCode.trim()) return;
    setLoading(true);

    try {
      // 1. Ambil Sidik Jari Perangkat (Fingerprint)
      const fp = await FingerprintJS.load();
      const resultFp = await fp.get();
      const deviceId = resultFp.visitorId; // ID Unik HP

      // 2. Kirim ke Server
      const { data, error } = await supabase.rpc('claim_referral', { 
        code_input: inputCode.trim().toUpperCase(),
        device_id_input: deviceId 
      });
      
      if (error) throw error;

      const result = data as { success: boolean; message: string };
      
      if (result.success) {
        alert("🎉 BERHASIL! " + result.message);
        setAlreadyClaimed(true);
        onCreditsUpdate(); // Refresh kredit di header
        setInputCode('');
      } else {
        // TAMPILKAN PESAN ERROR DARI SERVER (YANG SUDAH DISAMARKAN)
        alert("PEMBERITAHUAN SISTEM: " + result.message);
      }
    } catch (err: any) {
      alert("Terjadi kesalahan jaringan atau server sibuk.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-xl p-5 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>

      <div className="flex items-center gap-3 mb-4 relative z-10">
        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-300">
          <Users size={24} />
        </div>
        <div>
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            Referral Program <span className="bg-yellow-500/20 text-yellow-400 text-[10px] px-2 py-0.5 rounded-full border border-yellow-500/30">+10 Kredit</span>
          </h3>
          <p className="text-xs text-indigo-200">Undang teman, dapatkan bonus bersama!</p>
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        
        {/* BAGIAN 1: KODE SAYA */}
        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1 block">
            Kode Referral Saya
          </label>
          <div className="flex gap-2">
            <div className="flex-1 bg-black/40 border border-slate-600 border-dashed rounded px-3 py-2 text-center font-mono text-lg tracking-widest text-white font-bold select-all overflow-hidden truncate">
              {myCode}
            </div>
            <button 
              onClick={handleCopy}
              className={`shrink-0 px-4 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${copied ? 'bg-green-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
            >
              {copied ? <Check size={16}/> : <Copy size={16}/>}
              <span className="hidden sm:inline">{copied ? 'Disalin' : 'Salin'}</span>
            </button>
          </div>
          
          <div className="mt-3 flex items-start gap-2 bg-indigo-500/10 p-2 rounded border border-indigo-500/20">
             <Sparkles size={14} className="text-yellow-400 flex-shrink-0 mt-0.5"/>
             <p className="text-[10px] text-indigo-200/80 leading-snug">
               Bagikan kode ini. Teman dapat <span className="text-green-400 font-bold">+10</span>, Anda dapat <span className="text-green-400 font-bold">+10</span>.
             </p>
          </div>
        </div>

        {/* BAGIAN 2: KLAIM KODE TEMAN */}
        {!alreadyClaimed ? (
          <div className="pt-2 border-t border-indigo-500/20">
             <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2 block">
               Punya Kode Teman?
             </label>
             <div className="flex items-center gap-2 p-1.5 bg-slate-900/50 border border-slate-700 rounded-xl mt-2">
               <input 
                 type="text" 
                 value={inputCode}
                 onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                 placeholder="Masukan kode..."
                 className="flex-1 bg-transparent border-none px-2 py-1 text-sm text-white focus:outline-none placeholder-slate-600 font-mono"
               />
               <button 
                 onClick={handleClaim}
                 disabled={loading || !inputCode}
                 className="shrink-0 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-lg active:scale-95 whitespace-nowrap flex items-center gap-2"
               >
                 {loading ? '...' : <><Gift size={14}/> Klaim</>}
               </button>
             </div>
          </div>
        ) : (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-3 animate-in fade-in duration-500">
             <div className="bg-green-500 rounded-full p-1"><Check size={12} className="text-white"/></div>
             <div>
               <p className="text-xs font-bold text-green-400">Bonus Referral Diterima!</p>
               <p className="text-[10px] text-green-300/80">Anda sudah menggunakan kesempatan klaim kode.</p>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};
