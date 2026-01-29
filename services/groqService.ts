import { supabase } from './supabaseClient';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// --- KONFIGURASI MODEL ---
const FAST_MODEL = 'llama-3.1-8b-instant';       
const SMART_MODEL = 'llama-3.3-70b-versatile';  

// --- KEYWORDS DETECTOR ---
const COMPLEX_TASK_KEYWORDS = [
  'buatkan', 'script', 'code', 'coding', 'debug', 'fix', 'error', 
  'function', 'api', 'deploy', 'database', 'sql', 'algo', 'analisis', 
  'optimize', 'refactor', 'terminal', 'bug', 'salah', 'kenapa'
];

const NEGATIVE_EMOTION_KEYWORDS = [
  'bodoh', 'goblok', 'tolol', 'stupid', 'bego', 
  'capek', 'pusing', 'kesal', 'marah', 'gagal terus', 
  'stres', 'bingung', 'susah', 'anjing', 'tai', 'shit'
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** 1. TIME HELPER */
function getTimeContext(): string {
  const now = new Date();
  const userLocalTime = now.toLocaleString('id-ID', { 
     weekday: 'long', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' 
  });
  const hour = now.getHours();
  let greeting = hour >= 3 && hour < 11 ? "Pagi" : hour >= 11 && hour < 15 ? "Siang" : hour >= 15 && hour < 18 ? "Sore" : "Malam";
  return `[WAKTU: ${userLocalTime}. Sapa "${greeting}" HANYA jika ini pesan pertama.]`;
}

/** 2. MOOD ANALYZER */
function detectMoodAndConstructPrompt(lastMessage: string): string {
  const lowerMsg = lastMessage.toLowerCase();
  const isStressed = NEGATIVE_EMOTION_KEYWORDS.some(word => lowerMsg.includes(word));
  if (isStressed) {
    return `\n[EMOTION: USER STRESSED] -> Mode: Sabar, Empati, Solutif. Jangan teknis berlebihan. Validasi dulu emosinya.`;
  }
  return "";
}

/** 3. COMPLEXITY ANALYZER */
function selectOptimalModel(lastMessage: string): string {
  const lowerMsg = lastMessage.toLowerCase();
  const isComplex = COMPLEX_TASK_KEYWORDS.some(keyword => lowerMsg.includes(keyword)) || 
                    lowerMsg.includes('```') || 
                    lastMessage.length > 500;
  return isComplex ? SMART_MODEL : FAST_MODEL;
}

/** 4. MEMORY FETCHING */
async function fetchUserMemories(userId: string): Promise<string[]> {
  try {
    const { data } = await supabase.from('user_memories').select('memories').eq('user_id', userId).single();
    return data && Array.isArray(data.memories) ? data.memories : [];
  } catch { return []; }
}

async function saveUserMemory(userId: string, fact: string) {
  try { await supabase.rpc('upsert_user_memory', { p_user_id: userId, p_fact: fact.trim() }); } 
  catch (err) { console.error("[Memory] Save failed:", err); }
}

/** * --- MAIN STREAMING FUNCTION --- */
export async function* streamGroqRequest(
  messages: any[], 
  _unusedKeys: any, 
  initialModelId: string = FAST_MODEL, 
  userId: string,
  userCredits: number = 0 // Legacy param, ignored logic
) {
  
  // A. FETCH API KEYS DARI SUPABASE (Smart Rotation)
  const { data: dbKeys, error: dbError } = await supabase
    .from('api_key_usage') 
    .select('*')
    .order('usage_count', { ascending: true });

  if (dbError || !dbKeys || dbKeys.length === 0) {
    throw new Error("Gagal mengambil API Key dari server.");
  }

  // B. CHECK SUBSCRIPTION LIMIT (CORE LOGIC CHANGE)
  if (userId) {
    const { data: usageCheck, error: usageError } = await supabase.rpc('check_and_increment_usage', { p_user_id: userId });
    
    if (usageError) {
      console.error("Usage check error:", usageError);
    }

    if (usageCheck && usageCheck.allowed === false) {
       throw new Error(usageCheck.message || "Limit harian habis.");
    }
  }

  // --- NEW FEATURE: FETCH REAL-TIME USER STATUS FOR AI CONTEXT ---
  let userStatusPrompt = "";
  if (userId) {
    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (profile) {
        const isPremium = profile.is_premium && profile.premium_until && new Date(profile.premium_until) > new Date();
        const premiumDate = profile.premium_until 
          ? new Date(profile.premium_until).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) 
          : '-';
        
        userStatusPrompt = `
[STATUS AKUN USER (REAL-TIME DATA)]
- Nama: ${profile.full_name || 'User'}
- Email: ${profile.email}
- Tipe Akun: ${isPremium ? '👑 PREMIUM' : 'FREE TIER'}
- Limit Harian Terpakai: ${profile.daily_usage} / ${isPremium ? 'Unlimited' : '20'}
- Masa Aktif Premium: ${isPremium ? premiumDate : 'Tidak Aktif'}
- ID: ${userId}
*INSTRUKSI: Jika user bertanya tentang status akun/limit/sisa kuota, JAWABLAH berdasarkan data di atas. Jangan mengarang.*
`;
      }
    } catch (err) {
      console.error("Failed to fetch user context for AI", err);
    }
  }

  // C. MODEL SELECTION
  const lastMsgObj = messages[messages.length - 1];
  const lastMsgContent = typeof lastMsgObj.content === 'string' ? lastMsgObj.content : JSON.stringify(lastMsgObj.content);
  const hasImage = Array.isArray(lastMsgObj.content);
  const isSearchResult = lastMsgContent.includes('DATA WEB:');
  
  let activeModel = FAST_MODEL;

  if (hasImage) {
    activeModel = initialModelId; // Use Vision Model
  } else if (isSearchResult) {
    activeModel = SMART_MODEL;
  } else {
    activeModel = selectOptimalModel(lastMsgContent);
  }

  // D. BUILD SYSTEM PROMPT
  const timePrompt = getTimeContext();
  const moodPrompt = detectMoodAndConstructPrompt(lastMsgContent);
  const memories = await fetchUserMemories(userId);
  const recentMemories = memories.slice(-2).join('; ');
  const memoryPrompt = recentMemories ? `[INGATAN USER: ${recentMemories}]` : '';

  const systemMessage = messages.find(msg => msg.role === 'system');
  const baseSystem = systemMessage ? systemMessage.content : "You are an AI Assistant.";
  
  const finalSystemContent = `
  ${baseSystem}
  
  ${timePrompt}
  ${userStatusPrompt}
  ${memoryPrompt}
  ${moodPrompt}

  [PRIORITAS UTAMA: JAWABAN RELEVAN & NYAMBUNG]
  1. TUGAS: Jawab pertanyaan user to-the-point.
  2. JANGAN MAKSA: Jangan roasting/jokes kalau user lagi serius error.
  3. ANTI-YAPPING: Jangan ceramah panjang lebar.

  [IDENTITAS: TEMAN MABAR CODING (KZ.TUTORIAL)]
  - Lu partner coding Bang Jul. Asik, pinter, santai.
  - Panggilan: Gue/Lu, Bang, Bro.

  [ATURAN VISUAL]
  1. [SUMBER: Judul | URL] -> Wajib kalau search web.
  2. [SAVE_MEMORY: ...] -> Catat info penting user.
  `;

  // E. PREPARE PAYLOAD (WITH SANITIZATION FOR 413 ERROR FIX)
  const chatHistory = messages.filter(msg => msg.role !== 'system');
  const limitedHistory = chatHistory.slice(-6); 

  const processedMessages = [
    { role: 'system', content: finalSystemContent },
    ...limitedHistory.map(msg => {
      // 1. JANGAN UBAH PESAN TERAKHIR (Current Message)
      // Ini penting agar gambar yang BARU SAJA diupload tetap terkirim ke AI
      if (msg === lastMsgObj) return msg;

      // 2. UNTUK HISTORY: Convert Multimodal Array ke Text Biasa
      if (Array.isArray(msg.content)) {
        const text = msg.content.find((c: any) => c.type === 'text')?.text || "";
        return { role: msg.role, content: text };
      }
      
      // 3. UNTUK HISTORY: Hapus Base64 Image string yang besar
      // Regex ini mencari pola ![...](data:image/...) dan menggantinya dengan placeholder
      if (typeof msg.content === 'string') {
         // Regex optimization: [^\]]* matches alt text, [^;]+ matches mimetype, [^\)]+ matches base64 data
         const cleaned = msg.content.replace(/!\[[^\]]*\]\(data:image\/[^;]+;base64,[^\)]+\)/g, '[Gambar Diupload]');
         return { ...msg, content: cleaned };
      }

      return msg;
    })
  ];

  // F. UI FEEDBACK
  if (isSearchResult) {
    yield "🔍 _Verifikasi data web..._\n\n";
    await delay(200);
  } else if (hasImage) {
    yield "👁️ _Menganalisis screenshot (Llama 4 Vision)..._\n\n";
    await delay(200);
  } else if (activeModel === SMART_MODEL && !moodPrompt) {
    yield "⚡ _Menganalisis logika..._\n\n";
    await delay(200);
  }

  // G. EXECUTE API
  let success = false;

  for (const keyData of dbKeys) {
    const currentKey = keyData.api_key;

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: activeModel,
          messages: processedMessages,
          stream: true,
          temperature: moodPrompt ? 0.6 : 0.4, 
          max_tokens: 4096,
          top_p: 0.95
        }),
      });

      // SMART HANDLING 429, 503, & 413
      if (response.status === 429 || response.status === 503) {
         console.warn(`Key ${keyData.id} Limit (429/503). Switching with delay...`);
         await delay(1000); 
         continue; 
      }

      // Handle Payload Too Large specifically
      if (response.status === 413) {
        console.error("Groq API Error: 413 (Payload Too Large).");
        throw new Error("Gambar terlalu besar atau chat terlalu panjang. Coba refresh chat.");
      }

      if (!response.ok) throw new Error(`Groq API Error: ${response.status}`);

      success = true;

      // UPDATE KEY USAGE STATS
      supabase.from('api_key_usage')
        .update({ usage_count: keyData.usage_count + 1, last_used_at: new Date().toISOString() })
        .eq('id', keyData.id).then();

      // STREAM RESPONSE
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullTextAccumulator = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === 'data: [DONE]') break;
            if (line.startsWith('data: ')) {
              try {
                const json = JSON.parse(line.slice(6));
                const content = json.choices[0]?.delta?.content || '';
                if (content) {
                  fullTextAccumulator += content;
                  yield content;
                }
              } catch (e) {}
            }
          }
        }
      }

      // MEMORY SAVE
      const memoryMatch = fullTextAccumulator.match(/\[SAVE_MEMORY: (.*?)\]/);
      if (memoryMatch && memoryMatch[1]) {
        await saveUserMemory(userId, memoryMatch[1]);
      }
      
      break; 

    } catch (error) {
      console.error(`Error Key ${keyData.id}:`, error);

      // --- CRITICAL UPDATE: REFUND USAGE ON SYSTEM ERROR ---
      // Jika error bukan karena "Limit Harian Habis" (yang sudah dicek di awal),
      // maka kita asumsikan ini error sistem/API Key/Network, jadi kita kembalikan limit user.
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isUserLimitError = errorMessage.includes("Limit harian habis");

      if (userId && !isUserLimitError) {
         console.warn("System Error detected. Refunding user credit...");
         await supabase.rpc('decrement_usage', { p_user_id: userId });
      }

      // If it's 413, break loop immediately because switching keys won't fix payload size
      if (errorMessage.includes("Gambar terlalu besar")) {
        throw error;
      }
    }
  }

  if (!success) {
    throw new Error("Semua server sibuk (Overload). Coba lagi nanti ya Bang.");
  }
}