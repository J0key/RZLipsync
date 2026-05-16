// Azure Speech SDK Viseme Reference (IDs 0-21)
// Source: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-speech-synthesis-viseme
export const AZURE_VISEMES = {
  0:  { id: 0,  short: "sil", morphTarget: null,         description: "Silence" },
  1:  { id: 1,  short: "v1",  morphTarget: "viseme_1",   description: "æ, ə, ʌ" },
  2:  { id: 2,  short: "v2",  morphTarget: "viseme_2",   description: "ɑ" },
  3:  { id: 3,  short: "v3",  morphTarget: "viseme_3",   description: "ɔ" },
  4:  { id: 4,  short: "v4",  morphTarget: "viseme_4",   description: "ɛ, ʊ" },
  5:  { id: 5,  short: "v5",  morphTarget: "viseme_5",   description: "ɝ" },
  6:  { id: 6,  short: "v6",  morphTarget: "viseme_6",   description: "j, i, ɪ" },
  7:  { id: 7,  short: "v7",  morphTarget: "viseme_7",   description: "w, u" },
  8:  { id: 8,  short: "v8",  morphTarget: "viseme_8",   description: "o" },
  9:  { id: 9,  short: "v9",  morphTarget: "viseme_9",   description: "aʊ" },
  10: { id: 10, short: "v10", morphTarget: "viseme_10",  description: "ɔɪ" },
  11: { id: 11, short: "v11", morphTarget: "viseme_11",  description: "aɪ" },
  12: { id: 12, short: "v12", morphTarget: "viseme_12",  description: "h" },
  13: { id: 13, short: "v13", morphTarget: "viseme_13",  description: "ɹ" },
  14: { id: 14, short: "v14", morphTarget: "viseme_14",  description: "l" },
  15: { id: 15, short: "v15", morphTarget: "viseme_15",  description: "s, z" },
  16: { id: 16, short: "v16", morphTarget: "viseme_16",  description: "ʃ, tʃ, dʒ, ʒ" },
  17: { id: 17, short: "v17", morphTarget: "viseme_17",  description: "ð" },
  18: { id: 18, short: "v18", morphTarget: "viseme_18",  description: "f, v" },
  19: { id: 19, short: "v19", morphTarget: "viseme_19",  description: "d, t, n, θ" },
  20: { id: 20, short: "v20", morphTarget: "viseme_20",  description: "k, g, ŋ" },
  21: { id: 21, short: "v21", morphTarget: "viseme_21",  description: "p, b, m" },
};

// Di-generate dari AZURE_VISEMES.description: IPA fonem → viseme ID
// Contoh: "æ" → 1, "ə" → 1, "s" → 15, "tʃ" → 16, dst.
export const IPA_TO_VISEME = (() => {
  const map = {};
  for (const [id, v] of Object.entries(AZURE_VISEMES)) {
    if (v.description === "Silence") continue;
    const phonemes = v.description.split(",").map((p) => p.trim());
    for (const ph of phonemes) {
      map[ph] = Number(id);
    }
  }
  return map;
})();

/**
 * Tokenize string IPA per-fonem (greedy, diphone dulu).
 * Input: string IPA satu kata, misal "saja" atau "θæŋk"
 * Output: array of IPA fonem string
 */
export function tokenizeIPA(ipa) {
  const cleaned = ipa.replace(/[ˈˌːˑ̃ ]/g, "");
  const tokens = [];
  let i = 0;
  while (i < cleaned.length) {
    const two = cleaned.slice(i, i + 2);
    if (IPA_TO_VISEME[two] !== undefined) {
      tokens.push(two);
      i += 2;
    } else {
      tokens.push(cleaned[i]);
      i++;
    }
  }
  return tokens;
}

/**
 * Fetch IPA dari backend phonemizer (espeak).
 * GET /api/phonemize?text=...&lang=en|id
 * Returns: [{ word, ipa }, ...]
 */
export async function fetchIPAForText(text, lang = "id") {
  const res = await fetch(
    `/api/phonemize?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}`
  );
  if (!res.ok) throw new Error("Phonemize request failed");
  return res.json();
}

/**
 * Analisis teks: user input → espeak IPA → cek tiap fonem ada di IPA_TO_VISEME (Azure).
 * Returns: [{ word, phoneme, visemeId, inAzure }]
 *   - inAzure: true jika fonem dikenal Azure, false jika tidak
 */
export async function analyzeText(text, lang = "en") {
  const normalized = text.toLowerCase().trim();
  if (!normalized) return [];

  let wordIPAs;
  try {
    wordIPAs = await fetchIPAForText(normalized, lang);
  } catch {
    return normalized.split(/\s+/).filter(Boolean).map((word) => ({
      word, phoneme: "?", visemeId: null, inAzure: false,
    }));
  }

  const result = [];
  for (const { word, ipa } of wordIPAs) {
    if (!ipa) {
      result.push({ word, phoneme: "?", visemeId: null, inAzure: false });
      continue;
    }
    const phonemes = tokenizeIPA(ipa);
    for (const ph of phonemes) {
      const visemeId = IPA_TO_VISEME[ph] ?? null;
      result.push({ word, phoneme: ph, visemeId, inAzure: visemeId !== null });
    }
  }
  return result;
}
