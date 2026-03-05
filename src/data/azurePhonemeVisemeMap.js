// Azure Speech SDK Viseme Reference (IDs 0-21)
// Source: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-speech-synthesis-viseme
// Official mouth-position viseme table (22 visemes, each maps to a set of IPA phonemes)
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

// Arpabet phoneme → Azure Viseme ID
// Source: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-speech-synthesis-viseme
// Based on official IPA-to-viseme-ID table (IDs 0-21)
export const PHONEME_TO_VISEME = {
  // Silence
  "SIL": 0,
  // ID 1 — æ, ə, ʌ
  "AE": 1, "AH": 1,
  // ID 2 — ɑ
  "AA": 2,
  // ID 3 — ɔ
  "AO": 3,
  // ID 4 — ɛ, ʊ
  "EH": 4, "UH": 4,
  // ID 5 — ɝ
  "ER": 5,
  // ID 6 — j, i, ɪ
  "IY": 6, "IH": 6, "Y": 6,
  // ID 7 — w, u
  "UW": 7, "W": 7,
  // ID 8 — o
  "OW": 8,
  // ID 9 — aʊ
  "AW": 9,
  // ID 10 — ɔɪ
  "OY": 10,
  // ID 11 — aɪ
  "AY": 11,
  // ID 12 — h
  "HH": 12,
  // ID 13 — ɹ
  "R": 13,
  // ID 14 — l
  "L": 14,
  // ID 15 — s, z
  "S": 15, "Z": 15,
  // ID 16 — ʃ, tʃ, dʒ, ʒ
  "SH": 16, "CH": 16, "JH": 16, "ZH": 16,
  // ID 17 — ð
  "DH": 17,
  // ID 18 — f, v
  "F": 18, "V": 18,
  // ID 19 — d, t, n, θ
  "D": 19, "T": 19, "N": 19, "TH": 19,
  // ID 20 — k, g, ŋ
  "K": 20, "G": 20, "NG": 20,
  // ID 21 — p, b, m
  "P": 21, "B": 21, "M": 21,
};

// Word → sequence of { phoneme, visemeId }
// Digunakan sebagai "kunci jawaban" untuk VAS evaluation
export const WORD_PHONEME_VISEME = {

  stop: [
    { p: "S", v: 15 },
    { p: "T", v: 19 },
    { p: "AA", v: 2 },
    { p: "P", v: 21 }
  ],

  navigation: [
    { p: "N", v: 19 },
    { p: "AE", v: 1 },
    { p: "V", v: 18 },
    { p: "IH", v: 6 },
    { p: "G", v: 20 },
    { p: "EY", v: 11 },
    { p: "SH", v: 16 },
    { p: "AH", v: 1 },
    { p: "N", v: 19 }
  ],

  excuse: [
    { p: "IH", v: 6 },
    { p: "K", v: 20 },
    { p: "S", v: 15 },
    { p: "K", v: 20 },
    { p: "Y", v: 6 },
    { p: "UW", v: 7 },
    { p: "Z", v: 15 }
  ],

  me: [
    { p: "M", v: 21 },
    { p: "IY", v: 6 }
  ],

  i: [
    { p: "AY", v: 11 }
  ],

  am: [
    { p: "AE", v: 1 },
    { p: "M", v: 21 }
  ],

  sorry: [
    { p: "S", v: 15 },
    { p: "AO", v: 3 },
    { p: "R", v: 13 },
    { p: "IY", v: 6 }
  ],

  thank: [
    { p: "TH", v: 19 },
    { p: "AE", v: 1 },
    { p: "NG", v: 20 },
    { p: "K", v: 20 }
  ],

  you: [
    { p: "Y", v: 6 },
    { p: "UW", v: 7 }
  ],

  good: [
    { p: "G", v: 20 },
    { p: "UH", v: 4 },
    { p: "D", v: 19 }
  ],

  bye: [
    { p: "B", v: 21 },
    { p: "AY", v: 11 }
  ],

  love: [
    { p: "L", v: 14 },
    { p: "AH", v: 1 },
    { p: "V", v: 18 }
  ],

  this: [
    { p: "DH", v: 17 },
    { p: "IH", v: 6 },
    { p: "S", v: 15 }
  ],

  game: [
    { p: "G", v: 20 },
    { p: "EY", v: 11 },
    { p: "M", v: 21 }
  ],

  nice: [
    { p: "N", v: 19 },
    { p: "AY", v: 11 },
    { p: "S", v: 15 }
  ],

  to: [
    { p: "T", v: 19 },
    { p: "UW", v: 7 }
  ],

  meet: [
    { p: "M", v: 21 },
    { p: "IY", v: 6 },
    { p: "T", v: 19 }
  ],

  are: [
    { p: "AA", v: 2 },
    { p: "R", v: 13 }
  ],

  welcome: [
    { p: "W", v: 7 },
    { p: "EH", v: 4 },
    { p: "L", v: 14 },
    { p: "K", v: 20 },
    { p: "AH", v: 1 },
    { p: "M", v: 21 }
  ],

  how: [
    { p: "HH", v: 12 },
    { p: "AW", v: 9 }
  ],

  have: [
    { p: "HH", v: 12 },
    { p: "AE", v: 1 },
    { p: "V", v: 18 }
  ],

  a: [
    { p: "AH", v: 1 }
  ],

  time: [
    { p: "T", v: 19 },
    { p: "AY", v: 11 },
    { p: "M", v: 21 }
  ]

};
/**
 * Tokenize teks dan kembalikan urutan expected { word, phoneme, visemeId }
 * berdasarkan WORD_PHONEME_VISEME table.
 */
export function analyzeText(text) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  const result = [];
  for (const word of words) {
    const entries = WORD_PHONEME_VISEME[word];
    if (!entries) {
      result.push({ word, phoneme: "?", visemeId: null, notInDict: true });
      continue;
    }
    for (const { p, v } of entries) {
      result.push({ word, phoneme: p, visemeId: v, notInDict: false });
    }
  }
  return result;
}
