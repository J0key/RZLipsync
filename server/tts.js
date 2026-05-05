import express from "express";
import cors from "cors";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const app = express();
app.use(cors());

const PORT = 3002;

app.get("/api/tts", async (req, res) => {
  const text = req.query.text;

  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }

  try {
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_SPEECH_KEY,
      process.env.AZURE_SPEECH_REGION
    );

    speechConfig.speechSynthesisVoiceName = "en-US-GuyNeural";
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
        // Strip punctuation for the bookmark mark so it matches analyzeText() keys
        const mark = w.toLowerCase().replace(/[^a-z0-9'-]/g, "");
        return `<bookmark mark="${mark}"/>${w}`;
      })
      .join(" ");
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
  <voice name="en-US-GuyNeural">${ssmlWords}</voice>
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


app.listen(PORT, () => {
  console.log(`TTS Server running on http://localhost:${PORT}`);
});
