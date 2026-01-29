
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

// UPDATE: Sekarang ApiKeys adalah Array of Strings
export type ApiKeys = string[];

export interface GroqError {
  error: {
    message: string;
    type: string;
    code: string;
  };
}

export interface KeyUsage {
  api_key: string;
  usage_count: number;
  last_used_at: string;
}

export type ViewMode = 'chat' | 'admin_dashboard';

export interface AppSettings {
  terminalMode: boolean; // Matrix/Hacker style
  hapticEnabled: boolean; // Vibration on message
}

export interface TopupRequest {
  id: string;
  user_id: string;
  amount: number; // Disini 'amount' kita pakai untuk menyimpan DURASI HARI (3, 7, atau 30)
  price: number;
  payment_method: string;
  proof_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  currency?: 'IDR' | 'USD'; 
  profiles?: {
    full_name: string;
    email: string;
  };
}

// Interface baru untuk System Logs
export interface SystemLog {
  id: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  action: string;
  message: string;
  meta?: any; // Untuk menyimpan detail JSON object
  created_at: string;
}

// DAFTAR MODEL AI TERSEDIA (Hanya untuk referensi internal/UI info)
export const AI_MODELS = [
  { 
    id: 'llama-3.1-8b-instant', 
    name: '⚡ Llama 3.1 8B (Cepat)', 
    desc: 'Respons Kilat, Hemat.', 
    cost: 0,
    info: 'Free Tier'
  },
  { 
    id: 'llama-3.3-70b-versatile', 
    name: '🧠 Llama 3.3 70B (Pintar)', 
    desc: 'Logika Tinggi. Premium Only.', 
    cost: 0,
    info: 'Premium'
  }
];
