// ARPAbet Phoneme → Rhubarb Viseme Class mapping (Ground Truth)
// Reference: Rhubarb Lip Sync Preston Blair phoneme set

// Rhubarb viseme classes
// Reference: https://github.com/DanielSWolf/rhubarb-lip-sync#mouth-shapes
export const RHUBARB_VISEMES = {
  // Basic shapes (always present)
  A: { id: "A", name: "MBP", morphTarget: "viseme_PP", description: "Closed mouth for M, B, P sounds" },
  B: { id: "B", name: "ETC", morphTarget: "viseme_kk", description: "Slightly open mouth with clenched teeth (most consonants, EE)" },
  C: { id: "C", name: "E", morphTarget: "viseme_E", description: "Open mouth for EH, AE vowels; in-between shape" },
  D: { id: "D", name: "AI", morphTarget: "viseme_aa", description: "Wide open mouth for AA vowel" },
  E: { id: "E", name: "AOH", morphTarget: "viseme_O", description: "Slightly rounded mouth for AO, ER; in-between shape" },
  F: { id: "F", name: "U", morphTarget: "viseme_U", description: "Puckered lips for UW, OW, W sounds" },
  // Extended shapes (optional)
  G: { id: "G", name: "FV", morphTarget: "viseme_FF", description: "Upper teeth on lower lip for F, V sounds" },
  H: { id: "H", name: "L", morphTarget: "viseme_nn", description: "Tongue raised behind upper teeth for L sound" },
  X: { id: "X", name: "REST", morphTarget: "viseme_sil", description: "Idle/rest position with relaxed closed lips" },
};

// ARPAbet phoneme → Rhubarb viseme class
// Reference: https://github.com/DanielSWolf/rhubarb-lip-sync#mouth-shapes
export const PHONEME_TO_VISEME = {
  // A - Closed mouth (M, B, P)
  P: "A", B: "A", M: "A",

  // B - Slightly open, clenched teeth (most consonants + EE vowels)
  S: "B", Z: "B", T: "B", D: "B", N: "B",
  K: "B", G: "B", SH: "B", ZH: "B",
  CH: "B", JH: "B", TH: "B", DH: "B",
  NG: "B", Y: "B", HH: "B", R: "B",
  IH: "B", IY: "B",

  // C - Open mouth (EH, AE vowels)
  EH: "C", AE: "C", EY: "C",

  // D - Wide open mouth (AA vowel)
  AA: "D", AH: "D", AY: "D", AW: "D",

  // E - Slightly rounded (AO, ER)
  AO: "E", ER: "E", OY: "E",

  // F - Puckered lips (UW, OW, W)
  UW: "F", OW: "F", W: "F", UH: "F",

  // G - Upper teeth on lower lip (F, V)
  F: "G", V: "G",

  // H - Tongue behind upper teeth (L)
  L: "H",
};

// Common English word → ARPAbet phoneme dictionary
export const WORD_PHONEMES = {
  stop: ["S", "T", "AA", "P"],

  navigation: ["N", "AE", "V", "IH", "G", "EY", "SH", "AH", "N"],

  excuse: ["IH", "K", "S", "K", "Y", "UW", "Z"],

  me: ["M", "IY"],

  i: ["AY"],

  am: ["AE", "M"],

  sorry: ["S", "AO", "R", "IY"],

  thank: ["TH", "AE", "NG", "K"],

  you: ["Y", "UW"],

  good: ["G", "UH", "D"],

  bye: ["B", "AY"],

  love: ["L", "AH", "V"],

  this: ["DH", "IH", "S"],

  game: ["G", "EY", "M"],

  nice: ["N", "AY", "S"],

  to: ["T", "UW"],

  meet: ["M", "IY", "T"],

  are: ["AA", "R"],

  welcome: ["W", "EH", "L", "K", "AH", "M"],

  how: ["HH", "AW"],

  have: ["HH", "AE", "V"],

  a: ["AH"],

  time: ["T", "AY", "M"]

};

// Get phonemes for a word (returns null if not found in dictionary)
export function getWordPhonemes(word) {
  return WORD_PHONEMES[word.toLowerCase()] || null;
}

// Get expected viseme class for a phoneme
export function getExpectedViseme(phoneme) {
  return PHONEME_TO_VISEME[phoneme] || null;
}

// Break a sentence into phonemes with expected visemes
export function analyzeSentence(text) {
  const words = text.trim().split(/\s+/);
  const result = [];

  for (const word of words) {
    const cleanWord = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
    if (!cleanWord) continue;

    const phonemes = getWordPhonemes(cleanWord);
    if (phonemes) {
      for (const phoneme of phonemes) {
        const expectedViseme = getExpectedViseme(phoneme);
        result.push({
          word: cleanWord,
          phoneme,
          expectedViseme,
          expectedVisemeName: expectedViseme ? RHUBARB_VISEMES[expectedViseme]?.name : "?",
          expectedMorphTarget: expectedViseme ? RHUBARB_VISEMES[expectedViseme]?.morphTarget : "?",
        });
      }
    } else {
      result.push({
        word: cleanWord,
        phoneme: "?",
        expectedViseme: null,
        expectedVisemeName: "UNKNOWN",
        expectedMorphTarget: "?",
        notInDictionary: true,
      });
    }
  }

  return result;
}
