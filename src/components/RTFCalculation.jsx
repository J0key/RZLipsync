import { useEffect, useState } from "react";
import { useLipsyncStore } from "../store/useLipsyncStore";

export const AUDIO_FORMAT = {
  container: "PCM WAV",
  azureOutputFormat: "riff-16khz-16bit-mono-pcm",
};

const DEFAULT_SILENCE_THRESHOLD = 0.01;
const DEFAULT_FRAME_MS = 10;

const getAudioContext = () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    throw new Error("AudioContext is not supported in this browser.");
  }

  return new AudioContextClass();
};

const getFrameRms = (audioBuffer, startSample, endSample) => {
  let sumSquares = 0;
  let sampleCount = 0;

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);

    for (let sample = startSample; sample < endSample; sample++) {
      const value = channelData[sample] || 0;
      sumSquares += value * value;
      sampleCount++;
    }
  }

  return sampleCount > 0 ? Math.sqrt(sumSquares / sampleCount) : 0;
};

export const getDecodedDurationWithoutSilence = (
  audioBuffer,
  {
    silenceThreshold = DEFAULT_SILENCE_THRESHOLD,
    frameMs = DEFAULT_FRAME_MS,
  } = {}
) => {
  const frameSize = Math.max(1, Math.floor((audioBuffer.sampleRate * frameMs) / 1000));
  const totalSamples = audioBuffer.length;
  let firstAudibleSample = null;
  let lastAudibleSample = null;

  for (let start = 0; start < totalSamples; start += frameSize) {
    const end = Math.min(start + frameSize, totalSamples);
    const rms = getFrameRms(audioBuffer, start, end);

    if (rms > silenceThreshold) {
      firstAudibleSample = start;
      break;
    }
  }

  for (let end = totalSamples; end > 0; end -= frameSize) {
    const start = Math.max(0, end - frameSize);
    const rms = getFrameRms(audioBuffer, start, end);

    if (rms > silenceThreshold) {
      lastAudibleSample = end;
      break;
    }
  }

  if (firstAudibleSample === null || lastAudibleSample === null) {
    return 0;
  }

  return (lastAudibleSample - firstAudibleSample) / audioBuffer.sampleRate;
};

export const calculateRTFFromBlob = async (
  audioBlob,
  processingTime,
  options = {}
) => {
  if (!audioBlob) {
    throw new Error("Audio blob is required.");
  }

  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioContext = getAudioContext();

  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const decodedDuration = audioBuffer.duration;
    const duration = getDecodedDurationWithoutSilence(audioBuffer, options);

    if (duration <= 0) {
      throw new Error("Decoded audio duration is 0 after trimming silence.");
    }

    const rtf = processingTime / duration;

    return {
      rtf,
      duration,
      decodedDuration,
      processingTime,
      sampleRate: audioBuffer.sampleRate,
      channels: audioBuffer.numberOfChannels,
      format: AUDIO_FORMAT,
    };
  } finally {
    await audioContext.close();
  }
};

export const calculateRTFFromResponse = async (
  response,
  processingTime,
  options = {}
) => {
  const audioBlob = await response.blob();

  return calculateRTFFromBlob(audioBlob, processingTime, options);
};

export const RTFCalculation = ({
  audioBlob: audioBlobProp,
  processingTime: processingTimeProp,
  onResult,
  onBack,
}) => {
  const { lastOutput, loading } = useLipsyncStore();
  const audioBlob = audioBlobProp ?? lastOutput?.audioBlob ?? null;
  const processingTime = processingTimeProp ?? lastOutput?.processingTime ?? null;
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const calculate = async () => {
      if (!audioBlob || !Number.isFinite(processingTime)) {
        setResult(null);
        setError("");
        return;
      }

      try {
        setError("");
        const nextResult = await calculateRTFFromBlob(audioBlob, processingTime);

        if (isMounted) {
          setResult(nextResult);
          onResult?.(nextResult);
        }
      } catch (err) {
        if (isMounted) {
          setResult(null);
          setError(err.message || "Failed to calculate RTF.");
        }
      }
    };

    calculate();

    return () => {
      isMounted = false;
    };
  }, [audioBlob, processingTime, onResult]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          {onBack && (
            <button
              onClick={onBack}
              className="bg-white/10 hover:bg-white/20 rounded-full py-2 px-4 text-white text-sm cursor-pointer transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Avatar
            </button>
          )}
          <h1 className="text-white text-2xl font-bold">RTF Calculation</h1>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/20">
          <h2 className="text-white text-lg font-semibold mb-4">Audio Format</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500 mb-1">Container</div>
              <div className="text-white font-medium">{AUDIO_FORMAT.container}</div>
            </div>
            <div>
              <div className="text-gray-500 mb-1">Azure Output Format</div>
              <div className="text-white font-medium">{AUDIO_FORMAT.azureOutputFormat}</div>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <h2 className="text-white text-lg font-semibold mb-4">Result</h2>

          {loading && (
            <div className="flex items-center gap-3 text-gray-300">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Generating audio...
            </div>
          )}

          {!loading && (!audioBlob || !Number.isFinite(processingTime)) && (
            <div className="text-yellow-300/80 text-sm">
              Generate TTS audio on the Avatar page first. The RTF calculation uses the last generated audio blob and measured processing time.
            </div>
          )}

          {error && <div className="text-red-300 text-sm">{error}</div>}

          {result && (
            <>
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                  <div className="text-gray-500 text-xs mb-1">Processing Time</div>
                  <div className="text-white text-2xl font-semibold">{result.processingTime.toFixed(3)}s</div>
                </div>
                <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                  <div className="text-gray-500 text-xs mb-1">Decoded Duration</div>
                  <div className="text-white text-2xl font-semibold">{result.decodedDuration.toFixed(3)}s</div>
                </div>
                <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                  <div className="text-gray-500 text-xs mb-1">Trimmed Duration</div>
                  <div className="text-white text-2xl font-semibold">{result.duration.toFixed(3)}s</div>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-white/10">
                <div className="text-gray-400 text-sm mb-2">RTF = processingTime / duration</div>
                <div className="text-green-300 text-5xl font-bold">{result.rtf.toFixed(4)}</div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mt-6 text-sm">
                <div>
                  <div className="text-gray-500 mb-1">Decoded Sample Rate</div>
                  <div className="text-gray-300">{result.sampleRate} Hz</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Decoded Channels</div>
                  <div className="text-gray-300">{result.channels}</div>
                </div>
              </div>

              {lastOutput?.text && (
                <p className="text-gray-500 text-xs mt-4">
                  Last: &ldquo;{lastOutput.text.substring(0, 80)}{lastOutput.text.length > 80 ? "..." : ""}&rdquo;
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RTFCalculation;
