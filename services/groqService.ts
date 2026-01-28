import { Message, ApiKeys } from '../types';
import { MODEL_ID } from '../constants';
import { supabase } from './supabaseClient';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// UPDATE 2026: Menggunakan Model Llama 4 Scout (17B) untuk Vision
// Model lama (11b-vision-preview) sudah decommissioned.
const VISION_MODEL_ID = 'meta-llama/llama-4-scout-17b-16e-instruct'; 

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
let currentKeyIndex = 0;

export async function* streamGroqRequest(
  messages: any[], // Changed to any[] to support structured content (Text + Image)
  keys: ApiKeys, 
  modelId: string = MODEL_ID
): AsyncGenerator<string, void, unknown> {
  
  // 1. Prepare Messages
  const apiMessages = messages.map(m => ({
    role: m.role,
    content: m.content
  }));

  // 2. Check for Vision Content & Switch Model
  let activeModelId = modelId;
  const lastMsg = apiMessages[apiMessages.length - 1];
  
  // Logic: Jika content adalah Array (strukturnya [ {type: text}, {type: image_url} ]), maka paksa pakai Vision Model Terbaru
  if (Array.isArray(lastMsg.content)) {
    activeModelId = VISION_MODEL_ID;
    console.log("[GroqService] Vision Content Detected. Switching to:", activeModelId);
  }

  const requestBody = {
    model: activeModelId,
    messages: apiMessages,
    temperature: 0.7,
    max_tokens: 2048,
    stream: true
  };

  const attemptFetch = async (apiKey: string): Promise<Response> => {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      if (response.status === 429 || response.status === 401) {
        throw { status: response.status, message: "Key Failed" };
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `API Error: ${response.status}`);
    }
    return response;
  };

  let response: Response | null = null;
  let lastError: any = null;

  if (!keys || keys.length === 0) throw new Error("No API Keys configured.");

  const startIndex = currentKeyIndex;
  const totalKeys = keys.length;

  for (let i = 0; i < totalKeys; i++) {
    const actualIndex = (startIndex + i) % totalKeys;
    const currentKey = keys[actualIndex];

    if (!currentKey.trim()) continue;

    try {
      console.log(`[GroqService] Attempting with Key #${actualIndex + 1} (${activeModelId})...`);
      response = await attemptFetch(currentKey);
      currentKeyIndex = (actualIndex + 1) % totalKeys;
      
      // Fire and forget usage tracking
      supabase.rpc('increment_key_usage', { key_input: currentKey }).then(({ error }) => {
        if (error) console.error("[GroqService] Usage Tracking Error:", error.message);
      });
      
      break; 
    } catch (error: any) {
      console.warn(`Key #${actualIndex + 1} failed (${error.status}). Trying next key...`);
      lastError = error;
      if (i < totalKeys - 1) await delay(1000); 
    }
  }

  if (!response) {
    throw lastError || new Error("All API Keys failed or Rate Limited.");
  }

  if (!response.body) throw new Error("No response body received.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data: ")) {
          const jsonStr = trimmed.slice(6);
          if (jsonStr === "[DONE]") continue;

          try {
            const json = JSON.parse(jsonStr);
            const content = json.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (e) {
            console.warn("Error parsing stream chunk", e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// Deprecated: But kept for compatibility if referenced elsewhere
export const makeGroqRequest = async () => {
  throw new Error("Use streamGroqRequest instead");
};