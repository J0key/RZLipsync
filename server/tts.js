import express from "express";
import cors from "cors";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import dotenv from "dotenv";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: ".env.local" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3002;
const isProd = process.env.NODE_ENV === "production";

const ALLOWED_VOICES = new Set(["id-ID-ArdiNeural", "en-US-GuyNeural"]);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/tts", async (req, res) => {
  const text = req.query.text;
  const voiceParam = req.query.voice;
  const voice = ALLOWED_VOICES.has(voiceParam) ? voiceParam : "id-ID-ArdiNeural";

  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }

  try {
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_SPEECH_KEY,
      process.env.AZURE_SPEECH_REGION
    );

    speechConfig.speechSynthesisVoiceName = voice;
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm;

    const speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig);

    const visemes = [];
    const wordBoundaries = []; // { word, offsetMs }

    speechSynthesizer.visemeReceived = function (s, e) {
      visemes.push([e.audioOffset / 10000, e.visemeId]);
    };

    speechSynthesizer.bookmarkReached = function (s, e) {
      wordBoundaries.push({ word: e.text, offsetMs: e.audioOffset / 10000 });
    };

    // Build SSML with a <bookmark> before each word so we can slice visemes per word
    const words = text.trim().split(/\s+/);
    const ssmlWords = words
      .map((w) => {
        const mark = w.toLowerCase().replace(/[^a-z0-9'-]/g, "");
        return `<bookmark mark="${mark}"/>${w}`;
      })
      .join(" ");
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
  <voice name="${voice}">${ssmlWords}</voice>
</speak>`;

    const result = await new Promise((resolve, reject) => {
      speechSynthesizer.speakSsmlAsync(
        ssml,
        (result) => {
          speechSynthesizer.close();
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            resolve(result);
          } else {
            reject(new Error("Speech synthesis failed: " + result.errorDetails));
          }
        },
        (error) => {
          speechSynthesizer.close();
          reject(error);
        }
      );
    });

    console.log(`[TTS] visemes: ${visemes.length}, wordBoundaries: ${wordBoundaries.length}`);

    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Visemes", JSON.stringify(visemes));
    res.setHeader("Word-Boundaries", JSON.stringify(wordBoundaries));
    res.setHeader("Access-Control-Expose-Headers", "Visemes, Word-Boundaries");

    res.send(Buffer.from(result.audioData));

  } catch (error) {
    console.error("TTS Error:", error);
    res.status(500).json({ error: error.message });
  }
});


app.get("/api/phonemize", async (req, res) => {
  const text = (req.query.text || "").trim();
  const lang = req.query.lang === "en" ? "en-us" : "id";

  if (!text) return res.json([]);

  const words = text.toLowerCase().split(/\s+/);

  try {
    const ipaRaw = await runPhonemizer(text, lang);
    const ipaSegments = ipaRaw.trim().split(/\s+/);
    const result = words.map((word, i) => ({ word, ipa: ipaSegments[i] ?? null }));
    res.json(result);
  } catch (err) {
    console.error("[Phonemize] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

function runPhonemizer(text, lang) {
  return new Promise((resolve, reject) => {
    const py = spawn("python", [
      "-c",
      `import sys; from phonemizer import phonemize; sys.stdout.reconfigure(encoding='utf-8'); print(phonemize(sys.argv[1], language='${lang}', backend='espeak', strip=True, with_stress=False))`,
      text,
    ], { env: { ...process.env, PYTHONIOENCODING: "utf-8" } });

    let out = "", err = "";
    py.stdout.on("data", (d) => (out += d.toString()));
    py.stderr.on("data", (d) => (err += d.toString()));
    py.on("close", (code) => {
      if (code !== 0) reject(new Error(err || "Python error"));
      else resolve(out);
    });
  });
}

// Serve React build in production
if (isProd) {
  const distPath = path.join(__dirname, "../dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
