import { create } from "zustand";

// Viseme mapping reference
const VISEME_MAP = {
  0: { id: "sil", name: "silence", description: "Diam / tidak ada suara", morphTarget: null },
  1: { id: "PP", name: "viseme_PP", description: "Bunyi: p, b, m", morphTarget: "viseme_PP" },
  2: { id: "FF", name: "viseme_FF", description: "Bunyi: f, v", morphTarget: "viseme_FF" },
  3: { id: "TH", name: "viseme_TH", description: "Bunyi: th (seperti 'think')", morphTarget: "viseme_TH" },
  4: { id: "DD", name: "viseme_DD", description: "Bunyi: t, d, n", morphTarget: "viseme_DD" },
  5: { id: "kk", name: "viseme_kk", description: "Bunyi: k, g", morphTarget: "viseme_kk" },
  6: { id: "CH", name: "viseme_CH", description: "Bunyi: ch, j, sh", morphTarget: "viseme_CH" },
  7: { id: "SS", name: "viseme_SS", description: "Bunyi: s, z", morphTarget: "viseme_SS" },
  8: { id: "nn", name: "viseme_nn", description: "Bunyi: n, l", morphTarget: "viseme_nn" },
  9: { id: "RR", name: "viseme_RR", description: "Bunyi: r", morphTarget: "viseme_RR" },
  10: { id: "aa", name: "viseme_aa", description: "Bunyi vokal: a (mulut terbuka lebar)", morphTarget: "viseme_aa" },
  11: { id: "E", name: "viseme_E", description: "Bunyi vokal: e (seperti 'bed')", morphTarget: "viseme_E" },
  12: { id: "I", name: "viseme_I", description: "Bunyi vokal: i (seperti 'see')", morphTarget: "viseme_I" },
  13: { id: "O", name: "viseme_O", description: "Bunyi vokal: o (seperti 'go')", morphTarget: "viseme_O" },
  14: { id: "U", name: "viseme_U", description: "Bunyi vokal: u (seperti 'too')", morphTarget: "viseme_U" },
  15: { id: "aa2", name: "viseme_aa", description: "Bunyi vokal: aa lebar", morphTarget: "viseme_aa" },
  16: { id: "O2", name: "viseme_O", description: "Bunyi vokal: oo", morphTarget: "viseme_O" },
  17: { id: "U2", name: "viseme_U", description: "Bunyi vokal: ou", morphTarget: "viseme_U" },
  18: { id: "E2", name: "viseme_E", description: "Bunyi vokal: ae", morphTarget: "viseme_E" },
  19: { id: "I2", name: "viseme_I", description: "Bunyi vokal: ih", morphTarget: "viseme_I" },
  20: { id: "O3", name: "viseme_O", description: "Bunyi vokal: oh", morphTarget: "viseme_O" },
  21: { id: "U3", name: "viseme_U", description: "Bunyi vokal: uh", morphTarget: "viseme_U" },
};

// Helper function to format visemes with detailed info
const formatVisemesDetailed = (visemes) => {
  return visemes.map(([timeMs, visemeId], index) => {
    const visemeInfo = VISEME_MAP[visemeId] || { id: "unknown", name: "unknown", description: "Unknown viseme" };
    return {
      index: index,
      time_ms: timeMs,
      time_seconds: (timeMs / 1000).toFixed(3),
      viseme_id: visemeId,
      viseme_name: visemeInfo.name,
      viseme_short: visemeInfo.id,
      description: visemeInfo.description,
      morph_target: visemeInfo.morphTarget,
    };
  });
};

export const useLipsyncStore = create((set, get) => ({
  // State
  loading: false,
  currentMessage: null, // { text, visemes, audioPlayer, audioBlob, audioUrl }
  lastOutput: null, // Menyimpan output terakhir untuk download

  // Actions
  setLoading: (loading) => set({ loading }),

  // Speak text using Azure TTS
  speak: async (text) => {
    if (!text.trim()) return;

    set({ loading: true });

    try {
      // Call the TTS API (server runs on port 3001)
      const response = await fetch(`http://localhost:3001/api/tts?text=${encodeURIComponent(text)}`);

      if (!response.ok) {
        throw new Error("TTS request failed");
      }

      // Get visemes from header
      const visemesHeader = response.headers.get("Visemes");
      const visemes = visemesHeader ? JSON.parse(visemesHeader) : [];

      // Get audio blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create audio player
      const audioPlayer = new Audio(audioUrl);

      const outputData = {
        text,
        visemes,
        audioPlayer,
        audioBlob,
        audioUrl,
        timestamp: new Date().toISOString(),
      };

      // Set the message with audio player
      set({
        currentMessage: outputData,
        lastOutput: outputData,
        loading: false,
      });

      // Play audio
      audioPlayer.play();

      // Clean up when audio ends (but keep lastOutput for download)
      audioPlayer.onended = () => {
        set({ currentMessage: null });
      };

    } catch (error) {
      console.error("Error speaking text:", error);
      set({ loading: false, currentMessage: null });
    }
  },

  // Stop current audio
  stop: () => {
    const { currentMessage } = get();
    if (currentMessage?.audioPlayer) {
      currentMessage.audioPlayer.pause();
      currentMessage.audioPlayer.currentTime = 0;
    }
    set({ currentMessage: null });
  },

  // Download audio file
  downloadAudio: () => {
    const { lastOutput } = get();
    if (!lastOutput?.audioBlob) return;

    const link = document.createElement("a");
    link.href = lastOutput.audioUrl;
    link.download = `tts_audio_${Date.now()}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Download viseme data as JSON
  downloadVisemes: () => {
    const { lastOutput } = get();
    if (!lastOutput?.visemes) return;

    const data = {
      text: lastOutput.text,
      timestamp: lastOutput.timestamp,
      total_visemes: lastOutput.visemes.length,
      duration_ms: lastOutput.visemes.length > 0 ? lastOutput.visemes[lastOutput.visemes.length - 1][0] : 0,
      visemes: formatVisemesDetailed(lastOutput.visemes),
      viseme_reference: VISEME_MAP,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `visemes_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Download all data as a bundle (JSON with base64 audio)
  downloadAll: async () => {
    const { lastOutput } = get();
    if (!lastOutput) return;

    // Convert audio blob to base64
    const arrayBuffer = await lastOutput.audioBlob.arrayBuffer();
    const base64Audio = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    const data = {
      text: lastOutput.text,
      timestamp: lastOutput.timestamp,
      total_visemes: lastOutput.visemes.length,
      duration_ms: lastOutput.visemes.length > 0 ? lastOutput.visemes[lastOutput.visemes.length - 1][0] : 0,
      visemes: formatVisemesDetailed(lastOutput.visemes),
      audio: {
        format: "wav",
        base64: base64Audio,
      },
      viseme_reference: VISEME_MAP,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lipsync_bundle_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
}));
