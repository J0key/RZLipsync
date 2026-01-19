import { create } from "zustand";

// Rhubarb Lip Sync Viseme Mapping (Preston Blair phoneme set)
// Reference: https://github.com/DanielSWolf/rhubarb-lip-sync
const VISEME_MAP = {
  A: { id: "A", name: "MBP", description: "Closed mouth (M, B, P)", morphTarget: "viseme_PP" },
  B: { id: "B", name: "ETC", description: "Slightly open mouth (most consonants)", morphTarget: "viseme_kk" },
  C: { id: "C", name: "E", description: "Open mouth (E, EH)", morphTarget: "viseme_E" },
  D: { id: "D", name: "AI", description: "Wide open mouth (A, I, AI)", morphTarget: "viseme_aa" },
  E: { id: "E", name: "O", description: "Rounded small (O)", morphTarget: "viseme_O" },
  F: { id: "F", name: "U", description: "Rounded open (U, OO)", morphTarget: "viseme_U" },
  G: { id: "G", name: "FV", description: "Upper teeth on lower lip (F, V)", morphTarget: "viseme_FF" },
  H: { id: "H", name: "L", description: "Tongue behind teeth (L)", morphTarget: "viseme_nn" },
  X: { id: "X", name: "REST", description: "Neutral/rest position", morphTarget: "viseme_sil" },
};

// Phoneme to Rhubarb viseme mapping
const PHONEME_TO_VISEME = {
  // Vowels
  'a': 'D', 'e': 'C', 'i': 'C', 'o': 'E', 'u': 'F',
  'A': 'D', 'E': 'C', 'I': 'C', 'O': 'E', 'U': 'F',

  // Consonants
  'm': 'A', 'b': 'A', 'p': 'A',
  'M': 'A', 'B': 'A', 'P': 'A',

  'f': 'G', 'v': 'G',
  'F': 'G', 'V': 'G',

  'l': 'H',
  'L': 'H',

  'w': 'F', 'q': 'F',
  'W': 'F', 'Q': 'F',

  // Default consonants
  't': 'B', 'd': 'B', 'n': 'B', 's': 'B', 'z': 'B',
  'T': 'B', 'D': 'B', 'N': 'B', 'S': 'B', 'Z': 'B',
  'k': 'B', 'g': 'B', 'h': 'B', 'j': 'B', 'c': 'B',
  'K': 'B', 'G': 'B', 'H': 'B', 'J': 'B', 'C': 'B',
  'r': 'B', 'x': 'B', 'y': 'C',
  'R': 'B', 'X': 'B', 'Y': 'C',

  // Space/silence
  ' ': 'X',
  '.': 'X',
  ',': 'X',
  '!': 'X',
  '?': 'X',
};

// Helper function to format visemes with detailed info (Rhubarb format)
const formatVisemesDetailed = (visemes) => {
  return visemes.map(({ start, end, value }, index) => {
    const visemeInfo = VISEME_MAP[value] || VISEME_MAP.X;
    return {
      index: index,
      start: parseFloat(start.toFixed(3)),
      end: parseFloat(end.toFixed(3)),
      value: value,
      viseme_name: visemeInfo.name,
      description: visemeInfo.description,
      morph_target: visemeInfo.morphTarget,
    };
  });
};

// Generate Rhubarb-style viseme data from text
const generateRhubarbVisemes = (text, durationMs) => {
  const visemes = [];
  const cleanText = text.replace(/[^a-zA-Z\s.,!?]/g, '');
  const chars = cleanText.split('');

  if (chars.length === 0) {
    return [{ start: 0, end: durationMs / 1000, value: 'X' }];
  }

  const charDuration = durationMs / chars.length;
  let currentTime = 0;
  let lastViseme = null;

  chars.forEach((char) => {
    const viseme = PHONEME_TO_VISEME[char] || 'B';
    const start = currentTime / 1000;
    const end = (currentTime + charDuration) / 1000;

    // Merge consecutive same visemes
    if (lastViseme && lastViseme.value === viseme) {
      lastViseme.end = end;
    } else {
      const newViseme = { start, end, value: viseme };
      visemes.push(newViseme);
      lastViseme = newViseme;
    }

    currentTime += charDuration;
  });

  // Add rest at the end
  if (visemes.length > 0) {
    const lastEnd = visemes[visemes.length - 1].end;
    visemes.push({ start: lastEnd, end: lastEnd + 0.1, value: 'X' });
  }

  return visemes;
};

// Convert Rhubarb visemes to legacy format for backward compatibility [timeMs, visemeId]
const convertToLegacyFormat = (rhubarbVisemes) => {
  return rhubarbVisemes.map(v => [v.start * 1000, v.value]);
};

export const useLipsyncStore = create((set, get) => ({
  // State
  loading: false,
  currentMessage: null, // { text, visemes, rhubarbData, audioPlayer, audioBlob, audioUrl }
  lastOutput: null,

  // Speak function - generates audio and visemes
  speak: async (text) => {
    if (!text.trim()) return;

    set({ loading: true });

    try {
      // Check for Web Speech API support
      if (!('speechSynthesis' in window)) {
        throw new Error('Web Speech API not supported');
      }

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);

      // Get available voices and prefer Indonesian or English
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.startsWith('id')) ||
                            voices.find(v => v.lang.startsWith('en')) ||
                            voices[0];
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Estimate duration (roughly 100ms per character)
      const estimatedDuration = Math.max(text.length * 100, 1000);

      // Generate Rhubarb-style viseme data
      const rhubarbVisemes = generateRhubarbVisemes(text, estimatedDuration);
      const legacyVisemes = convertToLegacyFormat(rhubarbVisemes);

      // Create a simple audio context for timing
      let startTime = null;
      let endTime = null;

      // Create message object
      const message = {
        text,
        visemes: legacyVisemes,
        rhubarbData: {
          metadata: {
            soundFile: "speech.wav",
            duration: estimatedDuration / 1000,
          },
          mouthCues: rhubarbVisemes,
        },
        audioPlayer: {
          currentTime: 0,
          paused: false,
          pause: () => {
            speechSynthesis.cancel();
          },
        },
        audioBlob: null,
        audioUrl: null,
      };

      // Handle speech events
      utterance.onstart = () => {
        startTime = Date.now();
        // Update currentTime periodically
        const updateTime = () => {
          if (!message.audioPlayer.paused && startTime) {
            message.audioPlayer.currentTime = (Date.now() - startTime) / 1000;
            if (!speechSynthesis.speaking) return;
            requestAnimationFrame(updateTime);
          }
        };
        requestAnimationFrame(updateTime);
      };

      utterance.onend = () => {
        endTime = Date.now();
        const actualDuration = endTime - startTime;

        // Recalculate visemes with actual duration
        const actualRhubarbVisemes = generateRhubarbVisemes(text, actualDuration);
        const actualLegacyVisemes = convertToLegacyFormat(actualRhubarbVisemes);

        // Save output for download
        set({
          currentMessage: null,
          lastOutput: {
            text,
            timestamp: new Date().toISOString(),
            visemes: actualLegacyVisemes,
            rhubarbData: {
              metadata: {
                soundFile: "speech.wav",
                duration: actualDuration / 1000,
              },
              mouthCues: actualRhubarbVisemes,
            },
            audioBlob: null,
            audioUrl: null,
          },
        });
      };

      utterance.onerror = (event) => {
        console.error('Speech error:', event);
        set({ loading: false, currentMessage: null });
      };

      // Start speaking
      set({ loading: false, currentMessage: message });
      speechSynthesis.speak(utterance);

    } catch (error) {
      console.error('Speak error:', error);
      set({ loading: false });
    }
  },

  // Stop current audio
  stop: () => {
    const { currentMessage } = get();
    if (currentMessage?.audioPlayer) {
      currentMessage.audioPlayer.pause();
      speechSynthesis.cancel();
    }
    set({ currentMessage: null });
  },

  // Download audio file (not available with Web Speech API)
  downloadAudio: () => {
    const { lastOutput } = get();
    if (!lastOutput?.audioBlob) {
      console.warn('Audio download not available with Web Speech API');
      return;
    }

    const link = document.createElement("a");
    link.href = lastOutput.audioUrl;
    link.download = `tts_audio_${Date.now()}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Download viseme data as JSON (Rhubarb format)
  downloadVisemes: () => {
    const { lastOutput } = get();
    if (!lastOutput?.rhubarbData) return;

    const data = {
      metadata: lastOutput.rhubarbData.metadata,
      mouthCues: formatVisemesDetailed(lastOutput.rhubarbData.mouthCues),
      viseme_reference: VISEME_MAP,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rhubarb_visemes_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Download all data as a bundle (Rhubarb format)
  downloadAll: async () => {
    const { lastOutput } = get();
    if (!lastOutput) return;

    const data = {
      text: lastOutput.text,
      timestamp: lastOutput.timestamp,
      metadata: lastOutput.rhubarbData?.metadata || {
        soundFile: "speech.wav",
        duration: lastOutput.visemes.length > 0
          ? lastOutput.visemes[lastOutput.visemes.length - 1][0] / 1000
          : 0,
      },
      mouthCues: formatVisemesDetailed(lastOutput.rhubarbData?.mouthCues || []),
      viseme_reference: VISEME_MAP,
      note: "Generated using Web Speech API with Rhubarb viseme format",
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rhubarb_lipsync_bundle_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
}));

// Export viseme map for use in Avatar
export { VISEME_MAP };
