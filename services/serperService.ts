export const searchWeb = async (query: string, apiKey: string) => {
  if (!apiKey) throw new Error("Fitur Search belum diaktifkan oleh Admin (API Key Missing).");

  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        gl: "id", // Lokasi Indonesia
        hl: "id", // Bahasa Indonesia
        num: 5    // Ambil 5 hasil teratas
      }),
    });

    if (!response.ok) {
      if (response.status === 403) throw new Error("API Key Serper tidak valid atau kuota habis.");
      throw new Error(`Serper Error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.organic || data.organic.length === 0) return "Tidak ditemukan hasil pencarian yang relevan.";

    // Format hasil agar mudah dibaca AI dan dikutip sesuai format [SUMBER: Title | Link]
    const summary = data.organic.map((item: any) => {
      return `Title: ${item.title}\nLink: ${item.link}\nSnippet: ${item.snippet}\n---`;
    }).join("\n");

    return `HASIL PENCARIAN WEB (Gunakan data ini untuk menjawab):\n${summary}`;

  } catch (error: any) {
    console.error("Search API Error:", error);
    throw new Error(error.message || "Gagal terhubung ke layanan pencarian internet.");
  }
};