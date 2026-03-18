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

// Convert Rhubarb visemes to legacy format for backward compatibility [timeMs, visemeId]
const convertToLegacyFormat = (rhubarbVisemes) => {
  return rhubarbVisemes.map(v => [v.start * 1000, v.value]);
};

const base64ToBlob = (base64, mimeType) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
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
      const response = await fetch("/api/rhubarb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Rhubarb API error: ${response.status} ${errorBody}`);
      }

      const { rhubarbData, audioBase64, audioMime, rtf, ttp, audioDuration } = await response.json();
      const audioBlob = base64ToBlob(audioBase64, audioMime || "audio/wav");
      const audioUrl = URL.createObjectURL(audioBlob);
      const audioPlayer = new Audio(audioUrl);
      const legacyVisemes = convertToLegacyFormat(rhubarbData.mouthCues || []);

      const message = {
        text,
        visemes: legacyVisemes,
        rhubarbData,
        audioPlayer,
        audioBlob,
        audioUrl,
      };

      audioPlayer.onended = () => {
        set({
          currentMessage: null,
          lastOutput: {
            text,
            timestamp: new Date().toISOString(),
            visemes: legacyVisemes,
            rhubarbData,
            audioBlob,
            audioUrl,
            rtf,
            ttp,
            audioDuration,
          },
        });
      };

      audioPlayer.onerror = (event) => {
        console.error("Audio error:", event);
        set({ loading: false, currentMessage: null });
      };

      set({ loading: false, currentMessage: message });
      await audioPlayer.play();
    } catch (error) {
      console.error('Speak error:', error);
      set({ loading: false, currentMessage: null });
    }
  },

  // Stop current audio
  stop: () => {
    const { currentMessage } = get();
    if (currentMessage?.audioPlayer) {
      currentMessage.audioPlayer.pause();
      currentMessage.audioPlayer.currentTime = 0;
      if (currentMessage.audioUrl) {
        URL.revokeObjectURL(currentMessage.audioUrl);
      }
    }
    set({ currentMessage: null });
  },

  // Download audio file (not available with Web Speech API)
  downloadAudio: () => {
    const { lastOutput } = get();
    if (!lastOutput?.audioBlob) {
      console.warn('Audio download not available');
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
      note: "Generated with Azure TTS and Rhubarb lip-sync",
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
