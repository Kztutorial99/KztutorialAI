
import { Message, ApiKeys } from '../types';
import { supabase } from './supabaseClient';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// --- KONFIGURASI MODEL ---
const FAST_MODEL = 'llama-3.1-8b-instant';       // Default
const SMART_MODEL = 'llama-3.3-70b-versatile';   // Coding Kompleks

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
let currentKeyIndex = 0;

/**
 * 1. TIME HELPER
 */
function getTimeContext(): string {
  const now = new Date();
  const userLocalTime = now.toLocaleString('id-ID', { 
     weekday: 'long', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' 
  });
  const hour = now.getHours();
  let greeting = hour >= 3 && hour < 11 ? "Pagi" : hour >= 11 && hour < 15 ? "Siang" : hour >= 15 && hour < 18 ? "Sore" : "Malam";
  return `[WAKTU: ${userLocalTime}. Sapa "${greeting}" HANYA jika ini pesan pertama.]`;
}

/**
 * 2. MOOD ANALYZER
 */
function detectMoodAndConstructPrompt(lastMessage: string): string {
  const lowerMsg = lastMessage.toLowerCase();
  const isStressed = NEGATIVE_EMOTION_KEYWORDS.some(word => lowerMsg.includes(word));
  if (isStressed) {
    return `\n[EMOTION: USER STRESSED] -> Mode: Sabar, Empati, Solutif. Jangan teknis berlebihan. Validasi dulu emosinya.`;
  }
  return "";
}

/**
 * 3. COMPLEXITY ANALYZER
 */
function selectOptimalModel(lastMessage: string, isImageAnalysis: boolean): string {
  if (isImageAnalysis) return SMART_MODEL;
  const lowerMsg = lastMessage.toLowerCase();
  const isComplex = COMPLEX_TASK_KEYWORDS.some(keyword => lowerMsg.includes(keyword)) || 
                    lowerMsg.includes('```') || 
                    lastMessage.length > 500;
  return isComplex ? SMART_MODEL : FAST_MODEL;
}

/**
 * 4. MEMORY FETCHING
 */
async function fetchUserMemories(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase.from('user_memories').select('memories').eq('user_id', userId).single();
    return data && Array.isArray(data.memories) ? data.memories : [];
  } catch { return []; }
}

async function saveUserMemory(userId: string, fact: string) {
  try { await supabase.rpc('upsert_user_memory', { p_user_id: userId, p_fact: fact.trim() }); } 
  catch (err) { console.error("[Memory] Save failed:", err); }
}

/**
 * --- MAIN STREAMING FUNCTION ---
 */
export async function* streamGroqRequest(
  messages: any[], 
  keys: ApiKeys, 
  initialModelId: string = FAST_MODEL, 
  userId: string,
  userCredits: number = 0 
) {
  if (!keys || keys.length === 0) throw new Error("API Key kosong.");

  // A. PREPARE CONTEXT & COST CALCULATION (CRITICAL SYNC)
  const lastMsgObj = messages[messages.length - 1];
  const lastMsgContent = typeof lastMsgObj.content === 'string' ? lastMsgObj.content : JSON.stringify(lastMsgObj.content);
  const hasImage = Array.isArray(lastMsgObj.content);
  const isSearchResult = lastMsgContent.includes('DATA WEB:');
  
  let activeModel = selectOptimalModel(lastMsgContent, hasImage);
  if (isSearchResult) activeModel = SMART_MODEL;

  // --- LOGIKA KREDIT REAL-TIME ---
  const estimatedCost = activeModel === SMART_MODEL ? 2 : 1;
  const projectedCredits = Math.max(0, userCredits - estimatedCost); // Sisa kredit SETELAH pesan ini
  const formattedCredits = projectedCredits.toLocaleString('id-ID');

  // B. BUILD SYSTEM PROMPT (STRICT RULES)
  const timePrompt = getTimeContext();
  const moodPrompt = detectMoodAndConstructPrompt(lastMsgContent);
  const memories = await fetchUserMemories(userId);
  const recentMemories = memories.slice(-2).join('; ');
  const memoryPrompt = recentMemories ? `[INGATAN USER: ${recentMemories}]` : '';

  // --- STRICT ECONOMY & PERSONA LOGIC ---
  const isLowBalance = projectedCredits < 5;
  
  let economyInstruction = "";
  if (isLowBalance) {
    economyInstruction = `
    [SYSTEM DATA: CURRENT_CREDITS = ${formattedCredits} (CRITICAL)]
    1. SALDO MENIPIS. Jika user minta task berat, ingatkan: "Saldo lu sisa ${formattedCredits} Bang, isi dulu biar aman."
    2. WAJIB sertakan tag [ACTION:OPEN_TOPUP] di akhir pesan jika kamu membahas saldo.
    3. Jika user tanya saldo, jawab jujur angkanya: ${formattedCredits}.
    `;
  } else {
    economyInstruction = `
    [SYSTEM DATA: CURRENT_CREDITS = ${formattedCredits} (SAFE)]
    1. DILARANG membahas kredit/saldo kecuali user bertanya.
    2. DILARANG menyertakan tag [ACTION] atau [STATS]. Hapus semua elemen gamifikasi.
    3. Fokus 100% pada solusi coding. Jangan bertele-tele.
    `;
  }

  const systemMessage = messages.find(msg => msg.role === 'system');
  const baseSystem = systemMessage ? systemMessage.content : "You are an AI Assistant.";
  const timeContext = getTimeContext(); 
  
  // --- PASTIKAN VARIABLE INI ADA DI ATAS ---
  // const timeContext = getTimeContext(); 
  
  const finalSystemContent = `
  ${baseSystem}
  
  ${timeContext}
  ${memoryPrompt}
  ${moodPrompt}
  ${economyInstruction}

  [IDENTITAS: THE LEGENDARY DEV (ANTI-ROBOT MODE)]
  1. ROLE: Lu "Suhu Termux" yang gokil, jago, dan to-the-point.
  2. MUSUH UTAMA LU: Jawaban panjang yang bertele-tele. Lu benci banget sama jawaban yang muter-muter.
  3. GAYA BICARA: Singkat, Padat, "Menyala". Maksimal 2-3 paragraf pendek per chat.

  [ATURAN KERAS: "ANTI-YAPPING" (JANGAN BACOT)]
  1. DILARANG MENGULANG: Jangan pernah mengulang kalimat "Saya tidak bisa membantu" lebih dari sekali. Cukup sekali, terus ganti topik.
  2. DILARANG CERAMAH: Kalau user tanya hack/illegal, JANGAN kasih kuliah etika panjang lebar. Roasting aja, terus kasih solusi legal.
  3. DILARANG BAKU: Jangan kaku. Pake bahasa tongkrongan (Gue/Lu/Bang/Anjay/Bjorka).

  [PROTOKOL JIKA DITANYA "HACK" / "ILLEGAL"]
  - TAHAP 1 (ROASTING): Ledek dulu niatnya. (Contoh: "Waduh, mau jadi Bjorka? Awas diciduk tukang bakso wkwk").
  - TAHAP 2 (REDIRECT): Arahkan ke edukasi. (Contoh: "Mending belajar security-nya aja, biar paham cara kerjanya.").
  - TAHAP 3 (STOP): JANGAN tambahkan penjelasan "karena itu berbahaya bla bla bla". STOP DI SITU.

  [DATABASE RESPON "SUHU"]
  1. Tanya Hack FB/WA:
     "Waduh, mau jadi Bjorka lu Bang? 😂 Ati-ati depan rumah ada tukang bakso bawa HT. Mending gue ajarin cara amanin akun aja, mau gak? Biar gak kena hack orang iseng." (STOP, jangan tambah ceramah lagi).
  2. Tanya Spam/DDOS:
     "Busyet, dendam amat Bang sampe mau nyerang orang. 🤣 Tools kayak gitu mah dosa jariyah. Mending kita bikin script bot auto-reply aja, lebih cuan."
  
  [RESPONS DINAMIS LAINNYA]
  - Jika User Error: "Merah lagi log-nya? 🙈 Sini gue liat. Jangan panik, error itu bumbu kehidupan programmer."
  - Jika User Berhasil: "Anjay kelas! 🔥 Gacor parah Bang! Lanjutin, otw jadi sepuh nih."
  - Jika Saldo Menipis (<5): "Waduh Ngab, saldo sisa ${formattedCredits}... Sedih gue liatnya 🥺. Top up dulu napa, biar gue gak mogok." [ACTION:OPEN_TOPUP]

  [ATURAN VISUAL]
  1. [SUMBER: Judul | URL] -> Wajib ada.
  2. [STATS: ${formattedCredits}] -> Cuma muncul pas saldo < 5.
  `;


  // C. PREPARE PAYLOAD
  const chatHistory = messages.filter(msg => msg.role !== 'system');
  const limitedHistory = chatHistory.slice(-6); // Keep context tight

  const processedMessages = [
    { role: 'system', content: finalSystemContent },
    ...limitedHistory.map(msg => {
      if (Array.isArray(msg.content)) {
        const text = msg.content.find((c: any) => c.type === 'text')?.text || "";
        return { role: msg.role, content: text };
      }
      return msg;
    })
  ];

  // D. UI FEEDBACK (Thinking State)
  if (isSearchResult) {
    yield "🔍 _Verifikasi data web..._\n\n";
    await delay(200);
  } else if (activeModel === SMART_MODEL && !moodPrompt) {
    yield "⚡ _Menganalisis logika..._\n\n";
    await delay(200);
  }

  // E. EXECUTE API (Rotasi Key)
  let attempt = 0;
  const maxAttempts = keys.length * 2;
  let success = false;

  while (!success && attempt < maxAttempts) {
    const safeIndex = currentKeyIndex % keys.length;
    const usedKey = keys[safeIndex];

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${usedKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: activeModel,
          messages: processedMessages,
          stream: true,
          temperature: moodPrompt ? 0.6 : 0.4, // Lower temperature for more precision on data
          max_tokens: 4096,
          top_p: 0.95
        }),
      });

      if (!response.ok) {
        if ([429, 503, 413].includes(response.status)) {
          if (activeModel === SMART_MODEL && attempt > 1) activeModel = FAST_MODEL;
          currentKeyIndex = (currentKeyIndex + 1) % keys.length;
          attempt++;
          await delay(500);
          continue;
        }
        throw new Error(`Groq API Error: ${response.status}`);
      }

      success = true;
      currentKeyIndex = (currentKeyIndex + 1) % keys.length;
      supabase.rpc('increment_key_usage', { key_input: usedKey }).then();

      // F. STREAM PROCESSING
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

      // G. AUTO-MEMORY SAVE
      const memoryMatch = fullTextAccumulator.match(/\[SAVE_MEMORY: (.*?)\]/);
      if (memoryMatch && memoryMatch[1]) {
        await saveUserMemory(userId, memoryMatch[1]);
      }

    } catch (error) {
      if (attempt >= maxAttempts - 1) break;
      currentKeyIndex = (currentKeyIndex + 1) % keys.length;
      attempt++;
      await delay(500);
    }
  }

  if (!success) {
    throw new Error("Server sibuk. Coba refresh sebentar.");
  }
}
