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

    // Use Japanese voice
    speechConfig.speechSynthesisVoiceName = "ja-JP-NaokiNeural";

    const speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig);

    const visemes = [];
    speechSynthesizer.visemeReceived = function (s, e) {
      // audioOffset is in 100-nanosecond units, convert to milliseconds
      visemes.push([e.audioOffset / 10000, e.visemeId]);
    };

    const result = await new Promise((resolve, reject) => {
      speechSynthesizer.speakTextAsync(
        text,
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

    // Set headers with visemes
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Visemes", JSON.stringify(visemes));
    res.setHeader("Access-Control-Expose-Headers", "Visemes");

    // Send audio data
    res.send(Buffer.from(result.audioData));

  } catch (error) {
    console.error("TTS Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`TTS Server running on http://localhost:${PORT}`);
});
