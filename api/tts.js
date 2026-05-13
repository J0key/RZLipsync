import * as sdk from "microsoft-cognitiveservices-speech-sdk";

export default async function handler(req, res) {
  const text = req.query.text;

  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }

  const speechKey = process.env.AZURE_SPEECH_KEY;
  const speechRegion = process.env.AZURE_SPEECH_REGION;

  if (!speechKey || !speechRegion) {
    return res.status(500).json({ error: "Azure credentials not configured" });
  }

  try {
    const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
    speechConfig.speechSynthesisVoiceName = "id-ID-ArdiNeural";
    speechConfig.speechSynthesisOutputFormat =
      sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm;

    const speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig);

    const visemes = [];
    const wordBoundaries = [];

    speechSynthesizer.visemeReceived = (s, e) => {
      visemes.push([e.audioOffset / 10000, e.visemeId]);
    };

    speechSynthesizer.bookmarkReached = (s, e) => {
      wordBoundaries.push({ word: e.text, offsetMs: e.audioOffset / 10000 });
    };

    const words = text.trim().split(/\s+/);
    const ssmlWords = words
      .map((w) => {
        const mark = w.toLowerCase().replace(/[^a-z0-9'-]/g, "");
        return `<bookmark mark="${mark}"/>${w}`;
      })
      .join(" ");

    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
  <voice name="id-ID-ArdiNeural">${ssmlWords}</voice>
</speak>`;

    const result = await new Promise((resolve, reject) => {
      speechSynthesizer.speakSsmlAsync(
        ssml,
        (r) => {
          speechSynthesizer.close();
          if (r.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            resolve(r);
          } else {
            reject(new Error("Speech synthesis failed: " + r.errorDetails));
          }
        },
        (error) => {
          speechSynthesizer.close();
          reject(error);
        }
      );
    });

    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Visemes", JSON.stringify(visemes));
    res.setHeader("Word-Boundaries", JSON.stringify(wordBoundaries));
    res.setHeader("Access-Control-Expose-Headers", "Visemes, Word-Boundaries");

    res.send(Buffer.from(result.audioData));
  } catch (error) {
    console.error("TTS Error:", error);
    res.status(500).json({ error: error.message });
  }
}
