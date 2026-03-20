const GOOGLE_TRANSLATE_URL =
  "https://translation.googleapis.com/language/translate/v2";

export async function translateText(text: string): Promise<string> {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!key) {
    throw new Error("GOOGLE_TRANSLATE_API_KEY is not configured");
  }

  const res = await fetch(`${GOOGLE_TRANSLATE_URL}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text, source: "en", target: "ha", format: "text" }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const msg = body?.error?.message || `Google Translate API error (${res.status})`;
    throw new Error(msg);
  }

  const data = await res.json();
  return data.data.translations[0].translatedText;
}
