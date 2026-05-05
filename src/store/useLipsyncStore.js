import { create } from "zustand";

// Viseme mapping reference
// Source: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-speech-synthesis-viseme
const VISEME_MAP = {
  0:  { id: "sil", name: "viseme_0",  description: "Silence",        morphTarget: null },
  1:  { id: "v1",  name: "viseme_1",  description: "æ, ə, ʌ",        morphTarget: "viseme_1" },
  2:  { id: "v2",  name: "viseme_2",  description: "ɑ",               morphTarget: "viseme_2" },
  3:  { id: "v3",  name: "viseme_3",  description: "ɔ",               morphTarget: "viseme_3" },
  4:  { id: "v4",  name: "viseme_4",  description: "ɛ, ʊ",            morphTarget: "viseme_4" },
  5:  { id: "v5",  name: "viseme_5",  description: "ɝ",               morphTarget: "viseme_5" },
  6:  { id: "v6",  name: "viseme_6",  description: "j, i, ɪ",         morphTarget: "viseme_6" },
  7:  { id: "v7",  name: "viseme_7",  description: "w, u",            morphTarget: "viseme_7" },
  8:  { id: "v8",  name: "viseme_8",  description: "o",               morphTarget: "viseme_8" },
  9:  { id: "v9",  name: "viseme_9",  description: "aʊ",              morphTarget: "viseme_9" },
  10: { id: "v10", name: "viseme_10", description: "ɔɪ",              morphTarget: "viseme_10" },
  11: { id: "v11", name: "viseme_11", description: "aɪ",              morphTarget: "viseme_11" },
  12: { id: "v12", name: "viseme_12", description: "h",               morphTarget: "viseme_12" },
  13: { id: "v13", name: "viseme_13", description: "ɹ",               morphTarget: "viseme_13" },
  14: { id: "v14", name: "viseme_14", description: "l",               morphTarget: "viseme_14" },
  15: { id: "v15", name: "viseme_15", description: "s, z",            morphTarget: "viseme_15" },
  16: { id: "v16", name: "viseme_16", description: "ʃ, tʃ, dʒ, ʒ",   morphTarget: "viseme_16" },
  17: { id: "v17", name: "viseme_17", description: "ð",               morphTarget: "viseme_17" },
  18: { id: "v18", name: "viseme_18", description: "f, v",            morphTarget: "viseme_18" },
  19: { id: "v19", name: "viseme_19", description: "d, t, n, θ",      morphTarget: "viseme_19" },
  20: { id: "v20", name: "viseme_20", description: "k, g, ŋ",         morphTarget: "viseme_20" },
  21: { id: "v21", name: "viseme_21", description: "p, b, m",         morphTarget: "viseme_21" },
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
    const startedAt = performance.now();

    try {
      // Call the TTS API (server runs on port 3002)
      const response = await fetch(`http://localhost:3002/api/tts?text=${encodeURIComponent(text)}`);

      if (!response.ok) {
        throw new Error("TTS request failed");
      }

      // Get visemes from header
      const visemesHeader = response.headers.get("Visemes");
      const visemes = visemesHeader ? JSON.parse(visemesHeader) : [];

      // Get word boundaries from header (bookmark offsets per word)
      const wordBoundariesHeader = response.headers.get("Word-Boundaries");
      const wordBoundaries = wordBoundariesHeader ? JSON.parse(wordBoundariesHeader) : [];

      // Get audio blob
      const audioBlob = await response.blob();
      const processingTime = (performance.now() - startedAt) / 1000;
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create audio player
      const audioPlayer = new Audio(audioUrl);

      const outputData = {
        text,
        visemes,
        wordBoundaries,
        audioPlayer,
        audioBlob,
        audioUrl,
        processingTime,
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
    link.download = `azure_lipsync_bundle_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
}));
