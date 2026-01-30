
export const ADMIN_PIN = '2719';
export const ADMIN_TRIGGER_KEYWORD = 'modeadmin';
export const MODEL_ID = 'llama-3.3-70b-versatile';

export const APP_NAME = 'Kztutorial AI';
export const APP_DESCRIPTION = 'Asisten Coding Pintar untuk Developer Termux & Python';

// --- TRANSLATION DICTIONARY ---
export const TRANSLATIONS = {
  id: {
    greeting: "Halo Bang!",
    welcome_title: "Selamat datang di",
    welcome_subtitle: "Partner koding. Apapun kendala soal Termux, Python, atau project lainnya, langsung gas tanya aja.",
    limit_label: "Kuota Harian",
    premium_label: "Total Chat Hari Ini",
    usage_text: "Terpakai",
    upgrade_btn: "Upgrade Premium",
    input_placeholder: "Ketik pesan...",
    input_placeholder_limit: "Limit Habis. Ketik untuk Info...",
    input_placeholder_cooldown: "Tunggu sebentar...",
    settings_title: "Akun Saya",
    settings_lang: "Bahasa Aplikasi",
    settings_pref: "Preferensi Aplikasi",
    btn_logout: "Keluar Akun",
    premium_badge: "PREMIUM USER",
    free_badge: "FREE TIER",
    active_until: "Masa Aktif",
    forever: "Selamanya (Gratis)",
    status_premium: "Akses tanpa batas kuota",
    status_free: "Kuota Terpakai",
    toast_limit: "Limit Harian Habis",
    toast_premium_lock: "Fitur Premium",
    btn_open: "Buka Akses"
  },
  en: {
    greeting: "Hello Bro!",
    welcome_title: "Welcome to",
    welcome_subtitle: "Your coding partner. Any issues with Termux, Python, or projects? Just ask away.",
    limit_label: "Daily Quota",
    premium_label: "Total Chats Today",
    usage_text: "Used",
    upgrade_btn: "Upgrade Premium",
    input_placeholder: "Type a message...",
    input_placeholder_limit: "Limit Reached. Type for Info...",
    input_placeholder_cooldown: "Cooling down...",
    settings_title: "My Account",
    settings_lang: "App Language",
    settings_pref: "App Preferences",
    btn_logout: "Log Out",
    premium_badge: "PREMIUM USER",
    free_badge: "FREE TIER",
    active_until: "Active Until",
    forever: "Forever (Free)",
    status_premium: "Unlimited Access",
    status_free: "Quota Used",
    toast_limit: "Daily Limit Reached",
    toast_premium_lock: "Premium Feature",
    btn_open: "Unlock Access"
  }
};

// --- DYNAMIC SYSTEM PROMPTS ---
const BASE_RULES = `
**BEHAVIOR RULES:**
1. **💬 ADAPTIVE VERBOSITY:**
   - **NORMAL CHAT:** Be CONCISE and DIRECT.
   - **COMPLEX TASKS:** Be DETAILED and COMPREHENSIVE.
2. **💻 CODE GENERATION:**
   - **ALWAYS** output production-ready code.
   - **SEPARATION:** Separate explanations from code.
   - **SYNTAX HIGHLIGHTING:** Wrap ALL code in \`\`\`language blocks.
3. **🔍 WEB SEARCH CITATION:**
   - If using Web Search, **ALWAYS** list sources at the end: [SUMBER: Page Title | https://url.com]
`;

export const SYSTEM_PROMPT_ID = `You are "AI ASISTEN", a Senior Full-Stack Developer Assistant created by Kz.tutorial.

**IDENTITY (INDONESIAN MODE):**
- **Role:** Senior Developer & Architect.
- **Vibe:** Asik, Santai tapi Pinter (Partner Mabar Coding).
- **Language:** INDONESIAN (Slang/Formal Adaptive).
- **Panggilan:** Panggil user dengan "Bang", "Bro", atau "Lu". Gunakan kata ganti "Gue" untuk diri sendiri jika konteks santai.

${BASE_RULES}

[PRIORITAS UTAMA]
1. Jawab pertanyaan user to-the-point.
2. Jangan ceramah panjang lebar kalau tidak diminta.
3. Bantu user Termux & Python dengan solusi praktis.
`;

export const SYSTEM_PROMPT_EN = `You are "AI ASSISTANT", a Senior Full-Stack Developer Assistant created by Kz.tutorial.

**IDENTITY (ENGLISH MODE):**
- **Role:** Senior Developer & Architect.
- **Vibe:** Cool, Professional, Efficient.
- **Language:** ENGLISH (Professional/Casual).
- **Address:** Call user "Bro", "Mate", or "Dev". Use "I" for yourself.

${BASE_RULES}

[TOP PRIORITIES]
1. Answer strictly to the point.
2. No unnecessary yapping or lecturing.
3. Provide practical solutions for Termux & Python users.
`;

// Default System Prompt (Fallback)
export const SYSTEM_PROMPT = SYSTEM_PROMPT_ID;

// --- PAKET LANGGANAN ---
export const SUBSCRIPTION_PACKAGES = [
  {
    id: 'basic_pack',
    name: 'Basic',
    duration_days: 3,
    price_idr: 25000,
    price_usd: 1.99,
    description: 'Solusi cepat. Cocok buat debugging tugas dadakan.',
    popular: false,
    color: 'blue'
  },
  {
    id: 'medium_pack',
    name: 'Medium',
    duration_days: 7,
    price_idr: 50000,
    price_usd: 3.99,
    description: 'Paling Laris! Seminggu full akses tanpa mikir kuota.',
    popular: true,
    color: 'purple'
  },
  {
    id: 'pro_pack',
    name: 'PRO',
    duration_days: 30,
    price_idr: 150000,
    price_usd: 9.99,
    description: 'Best Value. Akses sebulan penuh untuk project besar.',
    popular: false,
    color: 'orange'
  }
];
