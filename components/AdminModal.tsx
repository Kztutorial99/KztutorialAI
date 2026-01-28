import React, { useState, useEffect, useRef } from 'react';
import { Lock, X, AlertCircle } from 'lucide-react';
import { ADMIN_PIN } from '../constants';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      onSuccess();
      onClose();
    } else {
      setError(true);
      setPin('');
      inputRef.current?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-red-400">
            <Lock size={18} />
            <span className="font-semibold tracking-wider text-sm uppercase">Restricted Access</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-slate-400 text-sm mb-4">
            Security clearance required. Enter PIN to access system internals.
          </p>
          
          <div className="relative">
            <input
              ref={inputRef}
              type="password"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (error) setError(false);
              }}
              placeholder="••••"
              className={`w-full bg-slate-950 border ${error ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-3 text-center text-2xl tracking-[0.5em] text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all`}
              maxLength={4}
            />
          </div>

          {error && (
            <div className="flex items-center justify-center gap-2 mt-4 text-red-500 text-xs font-bold animate-pulse">
              <AlertCircle size={14} />
              <span>ACCESS DENIED: INCORRECT PIN</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition-colors"
          >
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
};