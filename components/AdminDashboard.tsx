
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Save, Key, Shield, AlertCircle, Check, X, 
  Loader2, Database, Copy, Trash2, Globe, Send, RefreshCw, 
  Activity, Signal, Server, Cpu, Menu, DollarSign, Terminal,
  FileJson, Filter, Search, History, CheckSquare, Square
} from 'lucide-react';
import { TopupRequest, SystemLog } from '../types';
import { supabase } from '../services/supabaseClient';

interface AdminDashboardProps {
  onExit: () => void;
}

// === LOGIKA CEK KESEHATAN API KEY ===
const checkApiKeyHealth = async (key: string) => {
  const start = Date.now();
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    const latency = Date.now() - start;
    if (res.status === 200) return { status: 'active', latency, msg: 'Active' };
    if (res.status === 401) return { status: 'invalid', latency, msg: 'Invalid' };
    if (res.status === 429) return { status: 'limited', latency, msg: 'Limit' };
    return { status: 'error', latency, msg: `Err ${res.status}` };
  } catch (err) {
    return { status: 'error', latency: 0, msg: 'Network' };
  }
};

// === SQL SCRIPT UPDATE (Termasuk Table Logs, Usage, & Optimized User Memories) ===
const REQUIRED_SQL = `
-- COPY SCRIPT INI KE SUPABASE SQL EDITOR

-- 1. Table System Logs
CREATE TABLE IF NOT EXISTS public.system_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    level text, 
    action text,
    message text,
    meta jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- 2. Table API Key Usage
CREATE TABLE IF NOT EXISTS public.api_key_usage (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    api_key text UNIQUE NOT NULL,
    usage_count int DEFAULT 0,
    last_used_at timestamptz DEFAULT now()
);

-- 3. Optimized User Memories (1 Row Per User via JSONB Array)
CREATE TABLE IF NOT EXISTS public.user_memories (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    memories jsonb DEFAULT '[]'::jsonb,
    updated_at timestamptz DEFAULT now()
);

-- 4. Enable RLS for Memories
ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own memories" ON public.user_memories
    FOR ALL USING (auth.uid() = user_id);

-- 5. Atomic JSONB Memory Append Function
CREATE OR REPLACE FUNCTION public.upsert_user_memory(p_user_id uuid, p_fact text)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_memories (user_id, memories)
  VALUES (p_user_id, jsonb_build_array(p_fact))
  ON CONFLICT (user_id)
  DO UPDATE SET 
    memories = CASE 
      WHEN user_memories.memories @> jsonb_build_array(p_fact) THEN user_memories.memories
      ELSE user_memories.memories || jsonb_build_array(p_fact)
    END,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Increment Usage Function
CREATE OR REPLACE FUNCTION public.increment_key_usage(key_input text)
RETURNS void AS $$
BEGIN
  INSERT INTO public.api_key_usage (api_key, usage_count, last_used_at)
  VALUES (key_input, 1, now())
  ON CONFLICT (api_key)
  DO UPDATE SET
    usage_count = api_key_usage.usage_count + 1,
    last_used_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Approve Function
CREATE OR REPLACE FUNCTION public.admin_approve_topup(request_id uuid, target_user_id uuid, credit_amount int) 
RETURNS json AS $$
DECLARE v_new_credits int;
BEGIN
  UPDATE public.topup_requests SET status = 'approved' WHERE id = request_id;
  UPDATE public.profiles SET credits = COALESCE(credits, 0) + credit_amount WHERE id = target_user_id RETURNING credits INTO v_new_credits;
  INSERT INTO public.notifications (user_id, title, message, type) VALUES (target_user_id, '✅ Pembayaran Diterima', 'Topup ' || credit_amount || ' kredit berhasil.', 'payment');
  RETURN json_build_object('success', true, 'new_credits', v_new_credits);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<'keys' | 'payments' | 'history' | 'broadcast' | 'logs' | 'database'>('keys');
  
  const [keys, setKeys] = useState<string[]>([]);
  const [serperKey, setSerperKey] = useState('');
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [keyHealth, setKeyHealth] = useState<{ [key: string]: any }>({});
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [visibleKeys, setVisibleKeys] = useState<{ [index: number]: boolean }>({});

  const [requests, setRequests] = useState<TopupRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  
  const [historyRequests, setHistoryRequests] = useState<TopupRequest[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<Set<string>>(new Set());

  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logFilter, setLogFilter] = useState<'ALL' | 'ERROR' | 'SUCCESS'>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const [msgTitle, setMsgTitle] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [targetUser, setTargetUser] = useState('');
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reject' | 'delete_history' | null;
    req: TopupRequest | null;
    loading: boolean;
  }>({ isOpen: false, type: null, req: null, loading: false });

  const logToDB = async (level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS', action: string, message: string, meta: any = {}) => {
    try {
      await supabase.from('system_logs').insert({ level, action, message, meta });
      if (activeTab === 'logs') fetchLogs();
    } catch (e) {
      console.error("Gagal mencatat log:", e);
    }
  };

  const fetchKeys = async () => {
    setLoadingKeys(true);
    const { data } = await supabase.from('system_settings').select('groq_api_keys, serper_api_key').single();
    if (data) {
      setKeys(data.groq_api_keys || []);
      setSerperKey(data.serper_api_key || '');
    }
    setLoadingKeys(false);
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    const { data: raw } = await supabase.from('topup_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false });
    if (raw) {
      const uids = [...new Set(raw.map((r: any) => r.user_id))];
      const { data: profs } = await supabase.from('profiles').select('id, full_name, email').in('id', uids);
      const merged = raw.map((r: any) => ({ ...r, profiles: profs?.find((p: any) => p.id === r.user_id) }));
      setRequests(merged);
    }
    setLoadingRequests(false);
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    setSelectedHistoryIds(new Set()); 
    const { data: raw } = await supabase.from('topup_requests')
      .select('*')
      .neq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(50); 
    
    if (raw) {
      const uids = [...new Set(raw.map((r: any) => r.user_id))];
      const { data: profs } = await supabase.from('profiles').select('id, full_name, email').in('id', uids);
      const merged = raw.map((r: any) => ({ ...r, profiles: profs?.find((p: any) => p.id === r.user_id) }));
      setHistoryRequests(merged);
    }
    setLoadingHistory(false);
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    let query = supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(50);
    if (logFilter !== 'ALL') query = query.eq('level', logFilter);
    
    const { data } = await query;
    if (data) setLogs(data as SystemLog[]);
    setLoadingLogs(false);
  };

  const runHealthCheck = async () => {
    if (keys.length === 0) return;
    const results = await Promise.all(keys.map(async (k) => {
      if (!k) return { key: k, data: { status: 'unknown' } };
      return { key: k, data: await checkApiKeyHealth(k) };
    }));
    const newMap: any = {};
    results.forEach(r => newMap[r.key] = r.data);
    setKeyHealth(prev => ({ ...prev, ...newMap }));
  };

  useEffect(() => {
    let interval: any;
    if (isAutoRefresh && activeTab === 'keys') {
      runHealthCheck();
      interval = setInterval(runHealthCheck, 30000);
    }
    return () => clearInterval(interval);
  }, [isAutoRefresh, activeTab, keys.length]);

  useEffect(() => {
    if (activeTab === 'keys') fetchKeys();
    if (activeTab === 'payments') fetchRequests();
    if (activeTab === 'history') fetchHistory();
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab, logFilter]);

  const handleSaveKeys = async () => {
    const validKeys = keys.filter(k => k.trim() !== '');
    try {
      await supabase.from('system_settings').update({ groq_api_keys: validKeys, serper_api_key: serperKey }).gt('id', 0);
      setKeys(validKeys); 
      alert("Disimpan!"); 
      logToDB('SUCCESS', 'UPDATE_KEYS', 'Admin updated API keys', { count: validKeys.length });
      runHealthCheck();
    } catch(e: any) {
      logToDB('ERROR', 'UPDATE_KEYS_FAIL', e.message);
    }
  };

  const toggleSelectHistory = (id: string) => {
    const newSet = new Set(selectedHistoryIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedHistoryIds(newSet);
  };

  const toggleSelectAllHistory = () => {
    if (selectedHistoryIds.size === historyRequests.length) {
      setSelectedHistoryIds(new Set());
    } else {
      setSelectedHistoryIds(new Set(historyRequests.map(r => r.id)));
    }
  };

  const openConfirmModal = (type: 'approve' | 'reject' | 'delete_history', req?: TopupRequest) => {
    if (type === 'delete_history' && selectedHistoryIds.size === 0) return;
    setConfirmModal({ isOpen: true, type, req: req || null, loading: false });
  };

  const executeAction = async () => {
    const { type, req } = confirmModal;
    setConfirmModal(prev => ({ ...prev, loading: true }));
    
    try {
      if (type === 'approve' && req) {
        const { error } = await supabase.rpc('admin_approve_topup', { 
          request_id: req.id, target_user_id: req.user_id, credit_amount: req.amount 
        });
        if (error) throw error;
        await logToDB('SUCCESS', 'PAYMENT_APPROVE', `Topup ${req.amount} Credits Approved`, { user: req.profiles?.full_name });
        fetchRequests(); 

      } else if (type === 'reject' && req) {
        const { error } = await supabase.rpc('admin_reject_topup', { 
          request_id: req.id, target_user_id: req.user_id 
        });
        if (error) throw error;
        await logToDB('WARN', 'PAYMENT_REJECT', `Topup Request Rejected`, { user: req.profiles?.full_name });
        fetchRequests();

      } else if (type === 'delete_history') {
        const idsToDelete = Array.from(selectedHistoryIds);
        const { error } = await supabase.from('topup_requests').delete().in('id', idsToDelete);
        if (error) throw error;
        
        await logToDB('WARN', 'HISTORY_DELETE', `Deleted ${idsToDelete.length} payment history records`);
        fetchHistory();
      }

      setConfirmModal({ isOpen: false, type: null, req: null, loading: false });

    } catch (err: any) {
      alert("Gagal: " + err.message);
      logToDB('ERROR', `ACTION_${type?.toUpperCase()}_FAIL`, err.message);
      setConfirmModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleBroadcastMsg = async () => {
    if(!msgTitle || !msgBody) return alert("Isi judul & pesan!");
    setSendingMsg(true);
    try {
      const { data: users } = await supabase.from('profiles').select('id');
      if (!users) return;
      
      const targets = isBroadcast ? users : users.filter(u => u.id === targetUser);
      if(targets.length === 0) return alert("User tidak ditemukan");

      const payload = targets.map(u => ({ user_id: u.id, title: msgTitle, message: msgBody, type: 'admin' }));
      await supabase.from('notifications').insert(payload);
      
      alert(`Terkirim ke ${targets.length} user.`);
      logToDB('INFO', 'BROADCAST_SENT', `Pesan "${msgTitle}" dikirim ke ${targets.length} user.`);
      
      setMsgTitle(''); setMsgBody('');
    } catch(e: any) { 
      alert("Error: " + e.message);
      logToDB('ERROR', 'BROADCAST_FAIL', e.message); 
    }
    setSendingMsg(false);
  };

  const activeCount = Object.values(keyHealth).filter((h: any) => h.status === 'active').length;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-3 md:p-6 font-sans relative">
      
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 transform scale-100 animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-full ${confirmModal.type === 'approve' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {confirmModal.type === 'approve' ? <Check size={24} /> : <Trash2 size={24} />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white capitalize">
                  {confirmModal.type === 'delete_history' ? 'Hapus History?' : `${confirmModal.type} Request?`}
                </h3>
                <p className="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700/50 space-y-2">
              {confirmModal.type === 'delete_history' ? (
                 <div className="text-center py-2">
                    <p className="text-slate-300">Anda akan menghapus</p>
                    <p className="text-2xl font-bold text-red-400 my-1">{selectedHistoryIds.size}</p>
                    <p className="text-slate-300">Riwayat pembayaran.</p>
                 </div>
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">User:</span>
                    <span className="font-bold text-white">{confirmModal.req?.profiles?.full_name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Jumlah:</span>
                    <span className="font-bold text-green-400">+{confirmModal.req?.amount} Credits</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} disabled={confirmModal.loading} className="flex-1 py-2.5 rounded-lg border border-slate-600 text-slate-300 font-bold text-sm hover:bg-slate-800 transition-colors">Batal</button>
              <button onClick={executeAction} disabled={confirmModal.loading} className={`flex-1 py-2.5 rounded-lg font-bold text-sm text-white shadow-lg flex items-center justify-center gap-2 ${confirmModal.type === 'approve' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}`}>{confirmModal.loading ? <Loader2 size={16} className="animate-spin"/> : 'Ya, Konfirmasi'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg text-blue-400"><Shield size={24} /></div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Admin Panel</h1>
              <p className="text-xs text-slate-400 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> System Active</p>
            </div>
          </div>
          <button onClick={onExit} className="self-start md:self-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm flex items-center gap-2 transition-colors"><ArrowLeft size={16} /> Exit</button>
        </header>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-3 px-3 md:mx-0 md:px-0 custom-scrollbar">
           {[
             { id: 'keys', label: 'Monitor', icon: <Activity size={16}/> },
             { id: 'payments', label: 'Requests', icon: <DollarSign size={16}/> },
             { id: 'history', label: 'History', icon: <History size={16}/> }, 
             { id: 'logs', label: 'Logs', icon: <Terminal size={16}/> }, 
             { id: 'broadcast', label: 'Broadcast', icon: <Send size={16}/> },
             { id: 'database', label: 'Database', icon: <Database size={16}/> }
           ].map(tab => (
             <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400'}`}>
               {tab.icon} {tab.label}
               {tab.id === 'payments' && requests.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{requests.length}</span>}
             </button>
           ))}
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 md:p-6 min-h-[500px] shadow-2xl relative">
          {activeTab === 'keys' && (
            <div className="animate-in fade-in">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700"><p className="text-[10px] text-slate-400 uppercase font-bold">Total Keys</p><p className="text-xl font-black text-white">{keys.filter(k=>k).length}</p></div>
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700"><p className="text-[10px] text-slate-400 uppercase font-bold">Active</p><p className="text-xl font-black text-green-400">{activeCount}</p></div>
                <div className="col-span-2 md:col-span-1 bg-slate-800/60 p-3 rounded-xl border border-slate-700 flex justify-between items-center"><div><p className="text-[10px] text-slate-400 uppercase font-bold">Auto Refresh</p><p className="text-xs text-white">{isAutoRefresh ? 'ON (30s)' : 'OFF'}</p></div><button onClick={()=>setIsAutoRefresh(!isAutoRefresh)} className={`p-2 rounded-lg ${isAutoRefresh?'bg-green-500/20 text-green-400':'bg-slate-700 text-slate-400'}`}><RefreshCw size={16} className={isAutoRefresh?'animate-spin':''}/></button></div>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">{keys.map((k, i) => { const h = keyHealth[k] || { status: 'unknown', latency: 0, msg: 'Wait' }; return ( <div key={i} className={`p-3 rounded-lg border flex flex-col sm:flex-row gap-3 items-start sm:items-center ${h.status==='active'?'border-green-500/30 bg-green-900/10':'border-slate-700 bg-slate-800/30'}`}> <div className="flex items-center gap-2 w-full sm:w-auto"> <span className="text-xs font-mono text-slate-500">#{i+1}</span> <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${h.status==='active'?'bg-green-500/20 text-green-400':'bg-slate-700 text-slate-400'}`}>{h.msg}</span> </div> <input type={visibleKeys[i] ? "text" : "password"} value={k} onChange={e=>{const n=[...keys];n[i]=e.target.value;setKeys(n)}} className="flex-1 w-full bg-black/20 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-300 focus:border-blue-500 outline-none" placeholder="API Key..."/> <div className="flex items-center gap-2 w-full sm:w-auto justify-end"> <span className="hidden sm:block text-[10px] font-mono text-slate-500">{h.latency}ms</span> <button onClick={()=>setVisibleKeys(p=>({...p,[i]:!p[i]}))} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-400"><Activity size={14}/></button> <button onClick={()=>{const n=[...keys];n.splice(i,1);setKeys(n)}} className="p-2 bg-slate-800 hover:bg-red-900/50 rounded text-red-400"><Trash2 size={14}/></button> </div> </div> ); })}</div>
              <div className="mt-4 flex flex-col sm:flex-row gap-3"><button onClick={()=>setKeys([...keys,''])} className="flex-1 bg-slate-800 hover:bg-slate-700 py-2 rounded-lg text-xs font-bold text-white border border-slate-700">+ Add Key</button><button onClick={handleSaveKeys} className="flex-[2] bg-blue-600 hover:bg-blue-500 py-2 rounded-lg text-xs font-bold text-white shadow-lg">Save Changes</button></div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="animate-in fade-in">
              <div className="flex justify-between items-center mb-4"><h2 className="font-bold text-white">Pending Requests</h2><button onClick={fetchRequests} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700"><RefreshCw size={16}/></button></div>
              {loadingRequests ? <div className="text-center py-10"><Loader2 className="animate-spin mx-auto"/></div> : ( <div className="grid gap-4">{requests.map(req => ( <div key={req.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-col sm:flex-row gap-4"> <div className="w-full sm:w-24 h-24 bg-black rounded-lg overflow-hidden shrink-0 border border-slate-600">{req.proof_url ? ( <a href={req.proof_url} target="_blank" className="block w-full h-full hover:scale-105 transition-transform"><img src={req.proof_url} className="w-full h-full object-cover"/></a> ) : <div className="flex items-center justify-center h-full"><AlertCircle size={20} className="text-slate-600"/></div>}</div> <div className="flex-1"> <div className="flex justify-between items-start"> <div> <div className="font-bold text-white">{req.profiles?.full_name || 'Unknown'}</div> <div className="text-xs text-slate-400">{req.profiles?.email}</div> </div> <span className="text-[10px] px-2 py-0.5 rounded uppercase font-bold text-yellow-400 bg-yellow-900/20">{req.status}</span> </div> <div className="mt-2 bg-black/20 p-2 rounded border border-slate-700/50 flex justify-between items-center"> <span className="text-xs text-slate-400">Topup: <b>{req.amount} Credits</b></span> <span className="text-sm font-bold text-green-400">Rp {req.price.toLocaleString()}</span> </div> <div className="flex gap-2 mt-3"><button onClick={() => openConfirmModal('approve', req)} className="flex-1 bg-green-600 hover:bg-green-500 py-2 rounded-lg text-xs font-bold text-white shadow-lg flex justify-center items-center gap-2">Approve</button><button onClick={() => openConfirmModal('reject', req)} className="flex-1 bg-slate-700 hover:bg-red-900/50 py-2 rounded-lg text-xs font-bold text-slate-300 hover:text-red-300 flex justify-center items-center gap-2">Reject</button></div> </div> </div> ))} {requests.length === 0 && <p className="text-center text-slate-500 py-10">Tidak ada request pending.</p>} </div> )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="animate-in fade-in flex flex-col h-[500px]">
              <div className="flex justify-between items-center mb-4"><div className="flex gap-2 items-center"><h2 className="font-bold text-white mr-4">History</h2>{selectedHistoryIds.size > 0 && ( <button onClick={() => openConfirmModal('delete_history')} className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg animate-in zoom-in"><Trash2 size={14} /> Hapus ({selectedHistoryIds.size})</button> )}</div><button onClick={fetchHistory} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700"><RefreshCw size={16} className={loadingHistory?"animate-spin":""}/></button></div>
              <div className="flex-1 bg-black/40 rounded-xl border border-slate-800 overflow-hidden flex flex-col"><div className="flex items-center px-4 py-3 bg-slate-900/80 border-b border-slate-800 text-[10px] text-slate-500 font-bold uppercase tracking-wider"><button onClick={toggleSelectAllHistory} className="mr-3 text-slate-400 hover:text-white">{selectedHistoryIds.size > 0 && selectedHistoryIds.size === historyRequests.length ? <CheckSquare size={16}/> : <Square size={16}/>}</button><span className="w-24">Date</span><span className="flex-1">User</span><span className="w-24 text-right pr-4">Amount</span><span className="w-20 text-center">Status</span><span className="w-12 text-center">Proof</span></div><div className="overflow-y-auto flex-1 custom-scrollbar">{historyRequests.map(req => ( <div key={req.id} className={`flex items-center px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${selectedHistoryIds.has(req.id) ? 'bg-blue-900/10' : ''}`}><button onClick={() => toggleSelectHistory(req.id)} className={`mr-3 ${selectedHistoryIds.has(req.id) ? 'text-blue-400' : 'text-slate-600 hover:text-slate-400'}`}>{selectedHistoryIds.has(req.id) ? <CheckSquare size={16}/> : <Square size={16}/>}</button><span className="w-24 text-[10px] text-slate-500 font-mono">{new Date(req.created_at).toLocaleDateString()}</span><div className="flex-1 min-w-0 pr-2"><div className="text-xs font-bold text-white truncate">{req.profiles?.full_name || 'Unknown'}</div><div className="text-[10px] text-slate-500 truncate">{req.profiles?.email}</div></div><div className="w-24 text-right pr-4"><div className="text-xs font-bold text-white">{req.amount} Cr</div><div className="text-[10px] text-slate-500">Rp {req.price.toLocaleString()}</div></div><div className="w-20 text-center"><span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${req.status==='approved'?'text-green-400 bg-green-900/20':'text-red-400 bg-red-900/20'}`}>{req.status}</span></div><div className="w-12 flex justify-center">{req.proof_url ? ( <a href={req.proof_url} target="_blank" className="text-blue-400 hover:text-blue-300"><FileJson size={14}/></a> ) : <span className="text-slate-700">-</span>}</div></div> ))}</div></div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="animate-in fade-in flex flex-col h-[500px]">
              <div className="flex justify-between items-center mb-4"><div className="flex gap-2"><button onClick={() => setLogFilter('ALL')} className={`px-3 py-1 text-xs font-bold rounded-lg ${logFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>All</button><button onClick={() => setLogFilter('ERROR')} className={`px-3 py-1 text-xs font-bold rounded-lg ${logFilter === 'ERROR' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'}`}>Errors</button></div><button onClick={fetchLogs} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700"><RefreshCw size={16} className={loadingLogs ? "animate-spin" : ""}/></button></div>
              <div className="flex-1 bg-black/40 rounded-xl border border-slate-800 overflow-hidden flex flex-col"><div className="overflow-y-auto flex-1 custom-scrollbar">{logs.map(log => ( <div key={log.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors" onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}><div className="flex items-center px-4 py-3"><span className="w-20 text-[10px] text-slate-500 font-mono">{new Date(log.created_at).toLocaleTimeString()}</span><span className={`w-20 text-[10px] font-bold ${log.level === 'ERROR' ? 'text-red-400' : 'text-blue-400'}`}>{log.level}</span><span className="w-32 text-xs font-bold text-slate-300 truncate pr-2">{log.action}</span><span className="flex-1 text-xs text-slate-400 truncate">{log.message}</span></div>{expandedLogId === log.id && ( <div className="px-4 py-3 bg-[#0a0a0a] border-y border-slate-800"><pre className="text-[10px] text-green-300 font-mono bg-black p-2 rounded border border-slate-800 overflow-x-auto">{JSON.stringify(log.meta, null, 2)}</pre></div> )}</div> ))}</div></div>
            </div>
          )}

          {activeTab === 'broadcast' && (
            <div className="grid md:grid-cols-2 gap-6 animate-in fade-in">
               <div className="space-y-4">
                 <h2 className="font-bold flex gap-2"><Send size={18}/> Kirim Pesan</h2>
                 <div className="flex bg-slate-950 p-1 rounded-lg"><button onClick={()=>setIsBroadcast(false)} className={`flex-1 py-2 text-xs rounded-md ${!isBroadcast?'bg-slate-800 text-white':'text-slate-500'}`}>Personal</button><button onClick={()=>setIsBroadcast(true)} className={`flex-1 py-2 text-xs rounded-md ${isBroadcast?'bg-blue-600 text-white':'text-slate-500'}`}>Broadcast All</button></div>
                 {!isBroadcast && <input value={targetUser} onChange={e=>setTargetUser(e.target.value)} className="w-full bg-slate-950 p-3 rounded-xl text-xs text-white border border-slate-800 focus:border-blue-500 outline-none" placeholder="User ID (UUID)"/>}
                 <input value={msgTitle} onChange={e=>setMsgTitle(e.target.value)} className="w-full bg-slate-950 p-3 rounded-xl text-xs text-white border border-slate-800 focus:border-blue-500 outline-none" placeholder="Judul Notifikasi"/>
                 <textarea value={msgBody} onChange={e=>setMsgBody(e.target.value)} className="w-full bg-slate-950 p-3 rounded-xl text-xs text-white border border-slate-800 focus:border-blue-500 outline-none h-24 resize-none" placeholder="Isi pesan..."/>
                 <button onClick={handleBroadcastMsg} disabled={sendingMsg} className="w-full bg-green-600 py-3 rounded-xl font-bold text-sm text-white shadow-lg">{sendingMsg ? 'Mengirim...' : 'Kirim Pesan'}</button>
               </div>
            </div>
          )}

          {activeTab === 'database' && (
             <div className="h-full flex flex-col">
               <div className="bg-black/50 p-4 rounded-xl border border-slate-800 flex-1 overflow-hidden relative group">
                 <button onClick={()=>{navigator.clipboard.writeText(REQUIRED_SQL);alert("Copied!")}} className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">Copy SQL</button>
                 <pre className="text-[10px] text-green-400 font-mono h-full overflow-y-auto custom-scrollbar">{REQUIRED_SQL}</pre>
               </div>
               <p className="text-center text-xs text-slate-500 mt-4">Jalankan script di atas di Supabase SQL Editor untuk fitur Memori & Log.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
