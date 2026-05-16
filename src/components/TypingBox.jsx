import { useState } from "react";
import { useLipsyncStore, VOICES } from "../store/useLipsyncStore";

export const TypingBox = () => {
  const [text, setText] = useState("");
  const {
    loading,
    speak,
    stop,
    currentMessage,
    lastOutput,
    downloadAll,
    language,
    setLanguage,
  } = useLipsyncStore();

  const handleSwitch = (lang) => {
    if (currentMessage) stop();
    setLanguage(lang);
  };

  const handleSubmit = () => {
    if (text.trim()) {
      speak(text);
      setText("");
    }
  };

  const handleStop = () => {
    stop();
  };

  return (
    <div className="bg-white/15 backdrop-blur-xl rounded-2xl p-4 sm:p-6 w-full shadow-lg border border-white/20">
      <div className="flex flex-col items-center justify-between mb-3">
        <div className="text-gray-800 text-xl font-semibold mb-3">
          Azure 
        </div>
        {/* Language toggle */}
        <div className="flex gap-1.5">
          {Object.entries(VOICES).map(([key, voice]) => (
            <button
              key={key}
              onClick={() => handleSwitch(key)}
              className={`flex items-center gap-1 rounded-lg py-1 px-2.5 text-xs font-medium transition-all border ${
                language === key
                  ? "bg-emerald-500 text-white border-emerald-600"
                  : "bg-white/30 text-gray-700 border-white/30 hover:bg-white/50"
              }`}
            >
              <span>{voice.flag}</span>
              {voice.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-3 gap-3 text-gray-800">
          <div className="w-5 h-5 border-3 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
          <span>Generating...</span>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
          <input
            className="flex-1 bg-black/30 border-none rounded-full py-3 px-5 text-white text-sm outline-none placeholder:text-white/50"
            placeholder="Drop your text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit();
              }
            }}
            disabled={currentMessage !== null}
          />
          {currentMessage ? (
            <button
              className="bg-red-500/80 hover:bg-red-500 rounded-full py-3 px-7 text-white text-sm font-medium cursor-pointer transition-all w-full sm:w-auto shrink-0"
              onClick={handleStop}
            >
              Stop
            </button>
          ) : (
            <button
              className="bg-white/90 hover:bg-white rounded-full py-3 px-7 text-gray-800 text-sm font-medium cursor-pointer transition-all w-full sm:w-auto shrink-0"
              onClick={handleSubmit}
            >
              Generate
            </button>
          )}
        </div>
      )}

      {/* Download Section */}
      {/* {lastOutput && !loading && (
        <div className="border-t border-white/20 mt-4 pt-4">
          <p className="text-gray-600 text-xs mb-2">Download Output:</p>
          <button
            className="bg-purple-500/60 hover:bg-purple-500/80 rounded-xl py-2 px-4 text-white text-sm cursor-pointer flex items-center gap-2 transition-all"
            onClick={downloadAll}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download Data
          </button>
          <p className="text-gray-500 text-xs mt-2">
            Last: "{lastOutput.text.substring(0, 30)}
            {lastOutput.text.length > 30 ? "..." : ""}"
          </p>
        </div>
      )} */}
    </div>
  );
};
