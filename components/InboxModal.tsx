import React, { useEffect, useState } from 'react';
import { X, Bell, CheckCircle, Info, Shield, MessageSquare, CreditCard, Trash2, Check } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'payment' | 'admin' | 'security' | 'promo';
  is_read: boolean;
  created_at: string;
}

interface InboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onUpdateUnread: () => void; // Prop baru untuk update badge di parent
}

export const InboxModal: React.FC<InboxModalProps> = ({ isOpen, onClose, userId, onUpdateUnread }) => {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // --- FETCH NOTIFICATIONS ---
  const fetchNotifs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) setNotifs(data as Notification[]);
    setLoading(false);
  };

  // Mark As Read (Satu)
  const markAsRead = async (id: string, currentStatus: boolean) => {
    // Jika sudah dibaca, tidak perlu update DB, tapi tetap buka detail (jika ada logika expand)
    if (currentStatus) return; 

    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (!error) {
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      onUpdateUnread(); // Update Badge di App.tsx
    }
  };

  // Mark All Read
  const markAllRead = async () => {
    const unreadIds = notifs.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
    if (!error) {
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
      onUpdateUnread(); // Update Badge di App.tsx
    }
  };

  // Delete Notif
  const deleteNotif = async (id: string) => {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (!error) {
      setNotifs(prev => prev.filter(n => n.id !== id));
      onUpdateUnread(); // Update Badge di App.tsx (jika yg dihapus belum dibaca)
    }
  };

  useEffect(() => {
    if (isOpen) fetchNotifs();
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter Logic
  const displayNotifs = filter === 'all' ? notifs : notifs.filter(n => !n.is_read);

  // Helper Icon
  const getIcon = (type: string) => {
    switch (type) {
      case 'payment': return <CreditCard size={18} className="text-green-400" />;
      case 'admin': return <MessageSquare size={18} className="text-blue-400" />;
      case 'security': return <Shield size={18} className="text-red-400" />;
      case 'promo': return <CheckCircle size={18} className="text-purple-400" />;
      default: return <Info size={18} className="text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Slide-in Panel */}
      <div className="relative w-full max-w-md h-full bg-[#0f172a] border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell size={20} className="text-white" />
              {notifs.some(n => !n.is_read) && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>}
            </div>
            <h2 className="text-lg font-bold text-white">Inbox Notifikasi</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-3 flex justify-between items-center border-b border-slate-800 bg-slate-900/30">
          <div className="flex gap-2">
            <button onClick={() => setFilter('all')} className={`px-3 py-1 text-xs rounded-full transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>Semua</button>
            <button onClick={() => setFilter('unread')} className={`px-3 py-1 text-xs rounded-full transition-colors ${filter === 'unread' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>Belum Dibaca</button>
          </div>
          <button onClick={markAllRead} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"><Check size={14}/> Tandai Semua Dibaca</button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="text-center py-10 text-slate-500">Memuat...</div>
          ) : displayNotifs.length === 0 ? (
            <div className="text-center py-20 text-slate-600 flex flex-col items-center">
              <Bell size={48} className="mb-4 opacity-20" />
              <p>Tidak ada notifikasi</p>
            </div>
          ) : (
            displayNotifs.map((n) => (
              <div 
                key={n.id} 
                className={`relative group p-4 rounded-xl border transition-all cursor-pointer ${n.is_read ? 'bg-slate-900/30 border-slate-800 opacity-70 hover:opacity-100' : 'bg-slate-800 border-blue-500/30 shadow-lg shadow-blue-900/10'}`}
                onClick={() => markAsRead(n.id, n.is_read)}
              >
                <div className="flex gap-4">
                  <div className={`mt-1 p-2 rounded-lg h-fit ${n.type === 'admin' ? 'bg-blue-500/10' : 'bg-slate-700/50'}`}>
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`font-bold text-sm ${n.is_read ? 'text-slate-400' : 'text-white'}`}>{n.title}</h3>
                      <span className="text-[10px] text-slate-500">{new Date(n.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                    
                    {n.type === 'admin' && (
                       <div className="mt-2 text-[10px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded w-fit">Pesan dari Admin</div>
                    )}
                  </div>
                </div>

                {/* Delete Button (Hover Only) */}
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}
                  className="absolute bottom-3 right-3 p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Hapus"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};