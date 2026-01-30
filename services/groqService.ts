import { supabase } from './supabaseClient';
import { SYSTEM_PROMPT_ID, SYSTEM_PROMPT_EN } from '../constants';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// --- KONFIGURASI MODEL ---
// FAST: Llama 3.1 8B (Instant, Low Cost, High Speed) -> Chat ringan, sapaan, info dasar
const FAST_MODEL = 'llama-3.1-8b-instant';       
// SMART: Llama 3.3 70B (Versatile, High Reasoning) -> Coding, Debugging, Arsitektur, Logika Berat
const SMART_MODEL = 'llama-3.3-70b-versatile';  

// --- KEYWORDS DETECTOR (Kompleksitas Tinggi) ---
const COMPLEX_TASK_KEYWORDS = [
  // Coding & Technical
  'buatkan', 'script', 'code', 'coding', 'debug', 'fix', 'error', 'log',
  'function', 'api', 'deploy', 'database', 'sql', 'algo', 'analisis', 
  'optimize', 'refactor', 'terminal', 'bug', 'salah', 'kenapa', 'regex',
  'json', 'docker', 'aws', 'server', 'react', 'python', 'typescript',
  
  // Reasoning & Deep explanation
  'jelaskan secara detail', 'analisa', 'bandingkan', 'konsep', 'arsitektur',
  'best practice', 'cara kerja', 'mengapa', 'solusi', 'tutorial',
  'explain', 'analyze', 'compare', 'concept', 'architecture', 'why', 'solution'
];

const NEGATIVE_EMOTION_KEYWORDS = [
  'bodoh', 'goblok', 'tolol', 'stupid', 'bego', 
  'capek', 'pusing', 'kesal', 'marah', 'gagal terus', 
  'stres', 'bingung', 'susah', 'anjing', 'tai', 'shit',
  'idiot', 'useless', 'fail', 'angry'
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** 1. TIME HELPER */
function getTimeContext(lang: 'id' | 'en'): string {
  const now = new Date();
  const userLocalTime = now.toLocaleString(lang === 'id' ? 'id-ID' : 'en-US', { 
     weekday: 'long', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' 
  });
  const hour = now.getHours();
  
  if (lang === 'id') {
    let greeting = hour >= 3 && hour < 11 ? "Pagi" : hour >= 11 && hour < 15 ? "Siang" : hour >= 15 && hour < 18 ? "Sore" : "Malam";
    return `[WAKTU: ${userLocalTime}. Sapa "${greeting}" HANYA jika ini pesan pertama.]`;
  } else {
    let greeting = hour >= 3 && hour < 12 ? "Good Morning" : hour >= 12 && hour < 17 ? "Good Afternoon" : "Good Evening";
    return `[TIME: ${userLocalTime}. Greet "${greeting}" ONLY if this is the first message.]`;
  }
}

/** 2. MOOD ANALYZER */
function detectMoodAndConstructPrompt(lastMessage: string): string {
  const lowerMsg = lastMessage.toLowerCase();
  const isStressed = NEGATIVE_EMOTION_KEYWORDS.some(word => lowerMsg.includes(word));
  if (isStressed) {
    return `\n[EMOTION: USER STRESSED] -> Mode: Patient, Empathetic, Solution-oriented. Do not be overly technical yet. Validate emotion first.`;
  }
  return "";
}

/** 3. COMPLEXITY ANALYZER (AUTO-SWITCH LOGIC) */
function selectOptimalModel(lastMessage: string): { model: string, reason: string } {
  const lowerMsg = lastMessage.toLowerCase();
  
  // A. Cek Panjang Input (> 200 karakter biasanya butuh konteks lebih baik)
  if (lastMessage.length > 300) {
    return { model: SMART_MODEL, reason: 'Input Panjang (Deep Context)' };
  }

  // B. Cek Code Block
  if (lastMessage.includes('```') || lastMessage.includes('    ')) {
    return { model: SMART_MODEL, reason: 'Code Block Detected' };
  }

  // C. Cek Keywords
  const foundKeyword = COMPLEX_TASK_KEYWORDS.find(k => lowerMsg.includes(k));
  if (foundKeyword) {
    return { model: SMART_MODEL, reason: `Keyword: ${foundKeyword}` };
  }

  // Default ke Fast Model
  return { model: FAST_MODEL, reason: 'Simple Query' };
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

  // B. CHECK SUBSCRIPTION LIMIT
  if (userId) {
    const { data: usageCheck, error: usageError } = await supabase.rpc('check_and_increment_usage', { p_user_id: userId });
    
    if (usageError) {
      console.error("Usage check error:", usageError);
    }

    if (usageCheck && usageCheck.allowed === false) {
       throw new Error(usageCheck.message || "Limit harian habis.");
    }
  }

  // --- FETCH REAL-TIME USER STATUS & LANGUAGE ---
  let userStatusPrompt = "";
  let userLang: 'id' | 'en' = 'id';

  if (userId) {
    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (profile) {
        userLang = profile.language || 'id'; // GET LANGUAGE
        
        const isPremium = profile.is_premium && profile.premium_until && new Date(profile.premium_until) > new Date();
        const premiumDate = profile.premium_until 
          ? new Date(profile.premium_until).toLocaleDateString(userLang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) 
          : '-';
        
        userStatusPrompt = `
[USER ACCOUNT STATUS]
- Name: ${profile.full_name || 'User'}
- Email: ${profile.email}
- Type: ${isPremium ? '👑 PREMIUM' : 'FREE TIER'}
- Daily Usage: ${profile.daily_usage} / ${isPremium ? 'Unlimited' : '20'}
- Premium Expiry: ${isPremium ? premiumDate : 'Inactive'}
- Language Pref: ${userLang === 'id' ? 'Bahasa Indonesia' : 'English'}
- ID: ${userId}
`;
      }
    } catch (err) { console.error("Failed to fetch user context", err); }
  }

  // C. MODEL SELECTION STRATEGY
  const lastMsgObj = messages[messages.length - 1];
  const lastMsgContent = typeof lastMsgObj.content === 'string' ? lastMsgObj.content : JSON.stringify(lastMsgObj.content);
  const hasImage = Array.isArray(lastMsgObj.content);
  const isSearchResult = lastMsgContent.includes('DATA WEB:');
  
  let activeModel = FAST_MODEL;
  let modelReason = "Standard";

  if (hasImage) {
    activeModel = initialModelId; // Vision Model (Llama 3.2 Vision)
    modelReason = "Vision Analysis";
  } else if (isSearchResult) {
    activeModel = SMART_MODEL; // Web Search butuh penalaran tinggi
    modelReason = "Web Search Context";
  } else {
    // AUTO SWITCH LOGIC
    const selection = selectOptimalModel(lastMsgContent);
    activeModel = selection.model;
    modelReason = selection.reason;
  }

  // D. BUILD SYSTEM PROMPT BASED ON LANGUAGE
  const baseSystemPrompt = userLang === 'en' ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_ID;
  const timePrompt = getTimeContext(userLang);
  const moodPrompt = detectMoodAndConstructPrompt(lastMsgContent);
  const memories = await fetchUserMemories(userId);
  const recentMemories = memories.slice(-2).join('; ');
  const memoryPrompt = recentMemories ? `[USER MEMORIES: ${recentMemories}]` : '';

  const finalSystemContent = `
  ${baseSystemPrompt}
  
  ${timePrompt}
  ${userStatusPrompt}
  ${memoryPrompt}
  ${moodPrompt}

  [RULES]
  1. Use ${userLang === 'id' ? 'Indonesian' : 'English'} language.
  2. [SUMBER: Title | URL] -> Mandatory if search used.
  3. [SAVE_MEMORY: ...] -> Record important user info.
  `;

  // E. PREPARE PAYLOAD
  const chatHistory = messages.filter(msg => msg.role !== 'system');
  const limitedHistory = chatHistory.slice(-6); 

  const processedMessages = [
    { role: 'system', content: finalSystemContent },
    ...limitedHistory.map(msg => {
      if (msg === lastMsgObj) return msg;
      if (Array.isArray(msg.content)) {
        const text = msg.content.find((c: any) => c.type === 'text')?.text || "";
        return { role: msg.role, content: text };
      }
      if (typeof msg.content === 'string') {
         const cleaned = msg.content.replace(/!\[[^\]]*\]\(data:image\/[^;]+;base64,[^\)]+\)/g, '[Image Uploaded]');
         return { ...msg, content: cleaned };
      }
      return msg;
    })
  ];

  // F. UI FEEDBACK (INDICATOR)
  if (isSearchResult) {
    yield userLang === 'id' ? "🔍 _Verifikasi data web..._\n\n" : "🔍 _Verifying web data..._\n\n";
    await delay(200);
  } else if (hasImage) {
    yield userLang === 'id' ? "👁️ _Menganalisis screenshot (Llama 3.2 Vision)..._\n\n" : "👁️ _Analyzing screenshot (Llama 3.2 Vision)..._\n\n";
    await delay(200);
  } else if (activeModel === SMART_MODEL && !moodPrompt) {
    // Beri tahu user kalau kita pakai model pintar
    const msg = userLang === 'id' ? "⚡ _Mengaktifkan Llama 3.3 (70B) untuk analisis mendalam..._\n\n" : "⚡ _Activating Llama 3.3 (70B) for deep analysis..._\n\n";
    yield msg;
    await delay(300);
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
          temperature: moodPrompt ? 0.6 : (activeModel === SMART_MODEL ? 0.5 : 0.7), // Lebih presisi jika Smart
          max_tokens: 4096,
          top_p: 0.95
        }),
      });

      if (response.status === 429 || response.status === 503) {
         console.warn(`Key ${keyData.id} Limit. Switching...`);
         await delay(1000); 
         continue; 
      }

      if (response.status === 413) {
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

      const errorMessage = error instanceof Error ? error.message : String(error);
      const isUserLimitError = errorMessage.includes("Limit harian habis");

      if (userId && !isUserLimitError) {
         console.warn("System Error detected. Refunding user credit...");
         await supabase.rpc('decrement_usage', { p_user_id: userId });
      }

      if (errorMessage.includes("Gambar terlalu besar")) throw error;
    }
  }

  if (!success) {
    throw new Error("Semua server sibuk (Overload). Coba lagi nanti ya Bang.");
  }
}