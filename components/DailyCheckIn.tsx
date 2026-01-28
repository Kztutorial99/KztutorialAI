import React, { useState, useEffect } from 'react';
import { Gift, CheckCircle, Flame } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface DailyCheckInProps {
  userId: string;
  onCreditsUpdate: () => void;
}

export const DailyCheckIn: React.FC<DailyCheckInProps> = ({ userId, onCreditsUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [streak, setStreak] = useState(0);
  const [hasClaimedToday, setHasClaimedToday] = useState(false);
  const [nextBonus, setNextBonus] = useState(1);

  const fetchStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching streak:", error);
        return;
      }

      if (data) {
        setStreak(data.current_streak);
        
        // Cek client-side hanya untuk UI (Validasi asli di Server)
        const lastDate = new Date(data.last_claim_at).toDateString();
        const today = new Date().toDateString();
        setHasClaimedToday(lastDate === today);

        const nextDay = data.current_streak + 1;
        setNextBonus(nextDay % 7 === 0 ? 5 : 1);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchStatus(); }, [userId]);

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('claim_daily_bonus');
      if (error) throw error;

      const result = data as { success: boolean, message: string, streak: number, bonus: number };
      alert(result.message);
      
      if (result.success) {
        setStreak(result.streak);
        setHasClaimedToday(true);
        onCreditsUpdate();
      } else {
        setHasClaimedToday(true);
      }
    } catch (err: any) {
      alert("Gagal absen: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden group hover:border-blue-500/30 transition-all">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl -z-10 group-hover:bg-blue-600/10 transition-all"></div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
            <Flame size={24} className={streak > 0 ? "animate-pulse" : ""} />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Daily Streak</h3>
            <p className="text-xs text-slate-400">Absen tiap hari = bonus!</p>
          </div>
        </div>
        <div className="text-right">
           <span className="text-2xl font-black text-white">{streak}</span>
           <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-bold">Hari</span>
        </div>
      </div>

      <div className="flex justify-between items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5, 6, 7].map((day) => {
          const currentProgress = streak % 7; 
          const isCompleted = streak > 0 && currentProgress === 0 ? true : day <= currentProgress;
          
          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-1">
               <div className={`w-full h-1.5 rounded-full ${isCompleted ? 'bg-orange-500' : 'bg-slate-700'}`}></div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleCheckIn}
        disabled={hasClaimedToday || loading}
        className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
          hasClaimedToday 
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-900/20'
        }`}
      >
        {loading ? "Memproses..." : hasClaimedToday ? (
          <> <CheckCircle size={18} /> Sudah Absen Hari Ini </>
        ) : (
          <> <Gift size={18} /> Klaim Bonus (+{nextBonus}) </>
        )}
      </button>

      {!hasClaimedToday && (
         <p className="text-[10px] text-center text-slate-500 mt-2">
           Reset jam 00:00 UTC
         </p>
      )}
    </div>
  );
};