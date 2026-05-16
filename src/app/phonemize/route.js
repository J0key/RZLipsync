import { spawn } from "child_process";

// GET /api/phonemize?text=...&lang=en|id
// Returns: [{ word, ipa }, ...]
export async function GET(req) {
  const text = req.nextUrl.searchParams.get("text") || "";
  const lang = req.nextUrl.searchParams.get("lang") || "id";

  if (!text.trim()) {
    return Response.json([]);
  }

  const espeakLang = lang === "en" ? "en-us" : "id";

  const ipa = await runPhonemizer(text, espeakLang);

  // Pair each word with its IPA segment
  const words = text.trim().toLowerCase().split(/\s+/);
  const ipaSegments = ipa.trim().split(/\s+/);

  const result = words.map((word, i) => ({
    word,
    ipa: ipaSegments[i] ?? null,
  }));

  return Response.json(result);
}

function runPhonemizer(text, lang) {
  return new Promise((resolve, reject) => {
    const script = `
import sys
from phonemizer import phonemize
sys.stdout.reconfigure(encoding='utf-8')
result = phonemize(sys.argv[1], language='${lang}', backend='espeak', strip=True, with_stress=False)
print(result)
`.trim();

    const py = spawn("python", ["-c", script, text], {
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    });

    let out = "";
    let err = "";
    py.stdout.on("data", (d) => (out += d.toString()));
    py.stderr.on("data", (d) => (err += d.toString()));
    py.on("close", (code) => {
      if (code !== 0) reject(new Error(err || "Python error"));
      else resolve(out);
    });
  });
}
