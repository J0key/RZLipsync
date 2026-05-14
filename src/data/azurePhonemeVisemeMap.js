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

  // --- Kata tunggal ---

  // maaf: ma-af
  maaf: [
    { p: "M",  v: 21, s: "ma" },
    { p: "AA", v: 2,  s: "ma" },
    { p: "AA", v: 2,  s: "af" },
    { p: "F",  v: 18, s: "af" }
  ],

  // tolong: to-long
  tolong: [
    { p: "T",  v: 19, s: "to"   },
    { p: "OW", v: 8,  s: "to"   },
    { p: "L",  v: 14, s: "long" },
    { p: "OW", v: 8,  s: "long" },
    { p: "NG", v: 20, s: "long" }
  ],

  // permisi: per-mi-si
  permisi: [
    { p: "P",  v: 21, s: "per" },
    { p: "ER", v: 5,  s: "per" },
    { p: "M",  v: 21, s: "mi"  },
    { p: "IY", v: 6,  s: "mi"  },
    { p: "S",  v: 15, s: "si"  },
    { p: "IY", v: 6,  s: "si"  }
  ],

  // halo: ha-lo
  halo: [
    { p: "HH", v: 12, s: "ha" },
    { p: "AA", v: 2,  s: "ha" },
    { p: "L",  v: 14, s: "lo" },
    { p: "OW", v: 8,  s: "lo" }
  ],

  // mulai: mu-lai
  mulai: [
    { p: "M",  v: 21, s: "mu"  },
    { p: "UW", v: 7,  s: "mu"  },
    { p: "L",  v: 14, s: "lai" },
    { p: "AA", v: 2,  s: "lai" },
    { p: "IY", v: 6,  s: "lai" }
  ],

  // berhenti: ber-hen-ti
  berhenti: [
    { p: "B",  v: 21, s: "ber" },
    { p: "ER", v: 5,  s: "ber" },
    { p: "HH", v: 12, s: "hen" },
    { p: "EH", v: 4,  s: "hen" },
    { p: "N",  v: 19, s: "hen" },
    { p: "T",  v: 19, s: "ti"  },
    { p: "IY", v: 6,  s: "ti"  }
  ],

  // lanjut: lan-jut
  lanjut: [
    { p: "L",  v: 14, s: "lan" },
    { p: "AA", v: 2,  s: "lan" },
    { p: "N",  v: 19, s: "lan" },
    { p: "JH", v: 16, s: "jut" },
    { p: "UW", v: 7,  s: "jut" },
    { p: "T",  v: 19, s: "jut" }
  ],

  // sakit: sa-kit
  sakit: [
    { p: "S",  v: 15, s: "sa"  },
    { p: "AA", v: 2,  s: "sa"  },
    { p: "K",  v: 20, s: "kit" },
    { p: "IH", v: 6,  s: "kit" },
    { p: "T",  v: 19, s: "kit" }
  ],

  // kembali: kem-ba-li
  kembali: [
    { p: "K",  v: 20, s: "kem" },
    { p: "EH", v: 4,  s: "kem" },
    { p: "M",  v: 21, s: "kem" },
    { p: "B",  v: 21, s: "ba"  },
    { p: "AA", v: 2,  s: "ba"  },
    { p: "L",  v: 14, s: "li"  },
    { p: "IY", v: 6,  s: "li"  }
  ],

  // awas: a-was
  awas: [
    { p: "AA", v: 2,  s: "a"   },
    { p: "W",  v: 7,  s: "was" },
    { p: "AA", v: 2,  s: "was" },
    { p: "S",  v: 15, s: "was" }
  ],

  // terima: te-ri-ma
  terima: [
    { p: "T",  v: 19, s: "te" },
    { p: "ER", v: 5,  s: "te" },
    { p: "IY", v: 6,  s: "ri" },
    { p: "M",  v: 21, s: "ma" },
    { p: "AA", v: 2,  s: "ma" },
  ],

  // kasih: ka-sih
  kasih: [
    { p: "K",  v: 20, s: "ka"  },
    { p: "AA", v: 2,  s: "ka"  },
    { p: "S",  v: 15, s: "sih" },
    { p: "IH", v: 6,  s: "sih" },
    { p: "HH", v: 12, s: "sih" }
  ],

  // saya: sa-ya
  saya: [
    { p: "S",  v: 15, s: "sa" },
    { p: "AA", v: 2,  s: "sa" },
    { p: "Y",  v: 6,  s: "ya" },
    { p: "AA", v: 2,  s: "ya" },
  ],

  // minta: min-ta
  minta: [
    { p: "M",  v: 21, s: "min" },
    { p: "IH", v: 6,  s: "min" },
    { p: "N",  v: 19, s: "min" },
    { p: "T",  v: 19, s: "ta"  },
    { p: "AA", v: 2,  s: "ta"  },
  ],

};
/**
 * Tokenize teks dan kembalikan urutan expected { word, phoneme, visemeId }
 * berdasarkan WORD_PHONEME_VISEME table.
 */
export function analyzeText(text) {
  const normalized = text.toLowerCase().replace(/[^a-z\s]/g, "").trim();
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const result = [];
  let i = 0;

  while (i < tokens.length) {
    // coba cocokkan frasa terpanjang dulu (max 3 kata)
    let matched = false;
    for (let len = Math.min(3, tokens.length - i); len >= 1; len--) {
      const phrase = tokens.slice(i, i + len).join(" ");
      const entries = WORD_PHONEME_VISEME[phrase];
      if (entries) {
        for (const { p, v, s } of entries) {
          result.push({ word: phrase, phoneme: p, syllable: s ?? p, visemeId: v, notInDict: false });
        }
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      result.push({ word: tokens[i], phoneme: "?", visemeId: null, notInDict: true });
      i++;
    }
  }
  return result;
}
