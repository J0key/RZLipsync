import { useState } from "react";
import { useLipsyncStore } from "../store/useLipsyncStore";
import { analyzeText, AZURE_VISEMES, WORD_PHONEME_VISEME } from "../data/azurePhonemeVisemeMap";

export const VASEvaluationAzure = ({ onBack }) => {
  const { lastOutput } = useLipsyncStore();
  const [scriptText, setScriptText] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleLoadFromGenerate = () => {
    if (lastOutput?.text) {
      setScriptText(lastOutput.text);
      setAnalysisResult(null);
    }
  };

  const handleAnalyze = () => {
    if (!scriptText.trim()) return;
    if (!lastOutput?.visemes?.length) {
      alert("Belum ada data viseme. Generate lipsync dulu.");
      return;
    }
    if (!lastOutput?.wordBoundaries?.length) {
      alert("Word boundary tidak tersedia. Re-generate lipsync dulu agar evaluasi VAS akurat.");
      return;
    }

    // Expected: dari hardcoded table (ground truth), per fonem per kata
    const expected = analyzeText(scriptText);

    // All detected visemes (termasuk silence untuk keperluan slicing)
    const allDetected = lastOutput.visemes; // [[timeMs, visemeId], ...]
    const wordBoundaries = lastOutput.wordBoundaries; // [{ word, offsetMs }, ...]

    // Helper: ambil viseme yg jatuh dalam window [startMs, endMs)
    const getVisemesInWindow = (startMs, endMs) =>
      allDetected.filter(([t, id]) => id !== 0 && t >= startMs && (endMs === null || t < endMs));

    // Buat windows per kata berdasarkan bookmark timestamps
    // wordBoundaries sudah diurutkan berdasarkan waktu dari Azure
    const wordWindows = {};
    for (let i = 0; i < wordBoundaries.length; i++) {
      const { word, offsetMs } = wordBoundaries[i];
      const nextOffsetMs = wordBoundaries[i + 1]?.offsetMs ?? null;
      const key = word.toLowerCase();
      if (!wordWindows[key]) wordWindows[key] = [];
      wordWindows[key].push({ startMs: offsetMs, endMs: nextOffsetMs });
    }

    // Tambahkan windows untuk frasa multi-kata (misal "i love this game")
    // dengan meng-span dari startMs kata pertama sampai endMs kata terakhir
    const phraseKeys = Object.keys(WORD_PHONEME_VISEME).filter((k) => k.includes(" "));
    for (const phrase of phraseKeys) {
      const words = phrase.split(" ");
      // Cari semua posisi berurutan di wordBoundaries yang cocok dengan frasa ini
      for (let i = 0; i <= wordBoundaries.length - words.length; i++) {
        const slice = wordBoundaries.slice(i, i + words.length);
        const matches = slice.every((wb, idx) => wb.word.toLowerCase() === words[idx]);
        if (matches) {
          const startMs = slice[0].offsetMs;
          const afterLastIdx = i + words.length;
          const endMs = wordBoundaries[afterLastIdx]?.offsetMs ?? null;
          if (!wordWindows[phrase]) wordWindows[phrase] = [];
          wordWindows[phrase].push({ startMs, endMs });
        }
      }
    }

    // Tracker: berapa kali suatu kata sudah di-pakai (untuk duplikat)
    const wordUsageCount = {};

    const rows = [];
    let rowIndex = 0;

    // Group expected entries by word untuk pairing
    let i = 0;
    while (i < expected.length) {
      const exp = expected[i];

      if (exp.notInDict) {
        rows.push({
          index: ++rowIndex,
          word: exp.word,
          phoneme: exp.phoneme,
          expectedId: null,
          expectedLabel: "?",
          detectedId: null,
          detectedLabel: "-",
          isMatch: false,
          notInDict: true,
          source: exp.source,
        });
        i++;
        continue;
      }

      // Kumpulkan semua fonem untuk kata ini
      const wordKey = exp.word.toLowerCase();
      const phonemesForWord = [];
      let j = i;
      while (j < expected.length && expected[j].word === exp.word) {
        phonemesForWord.push(expected[j]);
        j++;
      }

      // Ambil window timestamp untuk kata ini (gunakan urutan kemunculan)
      const usageIdx = wordUsageCount[wordKey] ?? 0;
      wordUsageCount[wordKey] = usageIdx + 1;

      const windows = wordWindows[wordKey];
      const window = windows?.[usageIdx] ?? null;

      const detectedInWord = window
        ? getVisemesInWindow(window.startMs, window.endMs)
        : [];

      // Set-based matching: collect the set of morphTargets detected for this word
      // and check which expected morphTargets are covered.
      const detectedMorphSet = new Set(
        detectedInWord
          .map(([, id]) => AZURE_VISEMES[id]?.morphTarget)
          .filter(Boolean)
      );

      for (let k = 0; k < phonemesForWord.length; k++) {
        const e = phonemesForWord[k];
        const expInfo = e.visemeId !== null ? AZURE_VISEMES[e.visemeId] : null;
        const expMorph = expInfo?.morphTarget ?? null;

        // A phoneme is matched if its morphTarget appears anywhere in the detected window
        const isMatch = expMorph !== null && detectedMorphSet.has(expMorph);

        // For display: find the first detected viseme with the matching morphTarget
        const matchedDet = isMatch
          ? detectedInWord.find(([, id]) => AZURE_VISEMES[id]?.morphTarget === expMorph)
          : null;
        const detectedId = matchedDet ? matchedDet[1] : (detectedInWord[0]?.[1] ?? null);
        const detInfo = detectedId !== null ? (AZURE_VISEMES[detectedId] ?? null) : null;

        rows.push({
          index: ++rowIndex,
          word: e.word,
          phoneme: e.phoneme,
          syllable: e.syllable,
          expectedId: e.visemeId,
          expectedLabel: e.visemeId !== null ? `${e.visemeId} (${expInfo?.short ?? "?"})` : "?",
          detectedId: isMatch ? matchedDet?.[1] ?? null : (detectedInWord.length > 0 ? detectedInWord[0][1] : null),
          detectedLabel: detectedInWord.length === 0
            ? "-"
            : isMatch
            ? `${matchedDet?.[1]} (${AZURE_VISEMES[matchedDet?.[1]]?.short ?? "?"})`
            : `${detectedInWord[0][1]} (${AZURE_VISEMES[detectedInWord[0][1]]?.short ?? "?"})`,
          isMatch,
          notInDict: false,
          noWindow: !window,
          source: e.source,
        });
      }

      i = j;
    }

    // VAS = correct / evaluable x 100
    // Evaluable = phonemes where we had a detection window (even if no match found in it)
    const evaluable = rows.filter((r) => !r.notInDict && !r.noWindow);
    const correct   = evaluable.filter((r) => r.isMatch).length;
    const total     = evaluable.length;
    const vasScore  = total > 0 ? (correct / total) * 100 : 0;

    // Build per-word debug info: what viseme IDs were detected in each word's window
    const wordDebug = {};
    for (const [key, wins] of Object.entries(wordWindows)) {
      wordDebug[key] = wins.map(({ startMs, endMs }) =>
        getVisemesInWindow(startMs, endMs).map(([t, id]) => `${id}(${AZURE_VISEMES[id]?.short ?? "?"})@${t.toFixed(0)}ms`)
      );
    }

    setAnalysisResult({ rows, correct, total, vasScore, wordDebug });
  };

  const scoreColor = (s) => s >= 80 ? "text-green-400" : s >= 60 ? "text-yellow-400" : "text-red-400";
  const barColor   = (s) => s >= 80 ? "bg-green-400"  : s >= 60 ? "bg-yellow-400"  : "bg-red-400";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="bg-white/10 hover:bg-white/20 rounded-full py-2 px-4 text-white text-sm cursor-pointer transition-all flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Avatar
          </button>
          <h1 className="text-white text-2xl font-bold">VAS Evaluation — Azure TTS</h1>
        </div>

        {/* Input */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/20">
          <h2 className="text-white text-lg font-semibold mb-3">Script</h2>
          <textarea
            className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none placeholder:text-white/40 resize-none"
            placeholder="Masukkan teks (contoh: thank you)"
            value={scriptText}
            onChange={(e) => { setScriptText(e.target.value); setAnalysisResult(null); }}
            rows={2}
          />
          <div className="flex gap-3 mt-3">
            <button
              onClick={handleLoadFromGenerate}
              disabled={!lastOutput}
              className={`rounded-xl py-2 px-4 text-sm cursor-pointer transition-all ${
                lastOutput ? "bg-blue-500/60 hover:bg-blue-500/80 text-white" : "bg-gray-600/40 text-gray-400 cursor-not-allowed"
              }`}
            >
              Load from Last Generate
            </button>
            <button
              onClick={handleAnalyze}
              disabled={!scriptText.trim() || !lastOutput?.visemes?.length}
              className={`rounded-xl py-2 px-4 text-sm font-medium cursor-pointer transition-all ${
                scriptText.trim() && lastOutput?.visemes?.length
                  ? "bg-purple-500/70 hover:bg-purple-500/90 text-white"
                  : "bg-gray-600/40 text-gray-400 cursor-not-allowed"
              }`}
            >
              Analyze VAS
            </button>
          </div>
          {lastOutput && (
            <p className="text-gray-500 text-xs mt-2">
              Last: &ldquo;{lastOutput.text?.substring(0, 60)}&rdquo; — {lastOutput.visemes?.length ?? 0} visemes
            </p>
          )}
          {!lastOutput && (
            <p className="text-yellow-400/70 text-xs mt-2">Generate lipsync di halaman Avatar dulu.</p>
          )}
        </div>

        {/* Result */}
        {analysisResult && (
          <>
            {/* VAS Score */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/20">
              <h2 className="text-white text-lg font-semibold mb-4">VAS Score</h2>
              <div className="flex items-center gap-6">
                <div className="text-center min-w-[110px]">
                  <div className={`text-5xl font-bold ${scoreColor(analysisResult.vasScore)}`}>
                    {analysisResult.vasScore.toFixed(1)}%
                  </div>
                  <div className="text-gray-400 text-sm mt-1">
                    {analysisResult.correct} / {analysisResult.total}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor(analysisResult.vasScore)}`}
                      style={{ width: `${analysisResult.vasScore}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-gray-500 text-xs mt-1">
                    <span>0%</span><span>50%</span><span>100%</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-500 text-xs mt-3">
                VAS = Corrected Visemes / Total Evaluable Visemes × 100
              </p>
            </div>

            {/* Comparison Table */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <h2 className="text-white text-lg font-semibold mb-4">Detail Perbandingan</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-3 px-3 text-gray-400 font-medium w-8">#</th>
                      <th className="text-left py-3 px-3 text-gray-400 font-medium">Kata · Fonem</th>
                      <th className="text-left py-3 px-3 text-gray-400 font-medium">Expected Viseme ID</th>
                      <th className="text-left py-3 px-3 text-gray-400 font-medium">Detected Viseme ID</th>
                      <th className="text-center py-3 px-3 text-gray-400 font-medium">✓ / ✗</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisResult.rows.map((row) => (
                      <tr
                        key={row.index}
                        className={`border-b border-white/5 ${
                          row.notInDict ? "opacity-40" : row.isMatch ? "" : "bg-red-500/5"
                        }`}
                      >
                        <td className="py-2 px-3 text-gray-500 text-xs">{row.index}</td>
                        <td className="py-2 px-3">
                          <span className="text-white font-medium">{row.word}</span>
                          {row.source === "cmu" && (
                            <span className="ml-1 text-[10px] bg-blue-500/30 text-blue-300 rounded px-1 align-middle">CMU</span>
                          )}
                          <span className="text-blue-300 font-mono text-xs ml-2">{row.syllable ?? row.phoneme}</span>
                          <span className="text-gray-500 font-mono text-xs ml-1">({row.phoneme})</span>
                        </td>
                        <td className="py-2 px-3 font-mono text-green-300">
                          {row.notInDict
                            ? <span className="text-yellow-400 text-xs">tidak di dict</span>
                            : row.expectedLabel}
                        </td>
                        <td className={`py-2 px-3 font-mono ${row.noWindow ? "text-gray-500" : row.isMatch ? "text-green-300" : "text-red-300"}`}>
                          {row.noWindow
                            ? <span className="text-yellow-400/60 text-xs">no-window</span>
                            : row.detectedLabel || <span className="text-gray-500">-</span>}
                        </td>
                        <td className="py-2 px-3 text-center text-base">
                          {row.notInDict
                            ? <span className="text-yellow-400">?</span>
                            : row.noWindow
                            ? <span className="text-gray-500">-</span>
                            : row.isMatch
                            ? <span className="text-green-400">✓</span>
                            : <span className="text-red-400">✗</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-5 text-xs text-gray-500">
                <span><span className="text-green-400 mr-1">✓</span>Correct</span>
                <span><span className="text-red-400 mr-1">✗</span>Mismatch</span>
                <span><span className="text-yellow-400 mr-1">?</span>Kata tidak ada di dictionary</span>
                <span><span className="text-gray-400 mr-1">-</span>Tidak ada detected viseme</span>
                <span><span className="bg-blue-500/30 text-blue-300 rounded px-1 mr-1">CMU</span>Fonem dari CMU Pronouncing Dict</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
