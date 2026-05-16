import { useState } from "react";
import { analyzeText, AZURE_VISEMES } from "../data/azurePhonemeVisemeMap";
import { useLipsyncStore } from "../store/useLipsyncStore";

export const VASEvaluationAzure = ({ onBack }) => {
  const { lastOutput, language } = useLipsyncStore();
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const scriptText = lastOutput?.text ?? "";
  // language di store: "id-ID" atau "en-US" → ubah ke "id" atau "en"
  const lang = language?.startsWith("id") ? "id" : "en";

  const handleAnalyze = async () => {
    if (!scriptText.trim()) return;
    setLoading(true);
    setAnalysisResult(null);

    const phonemes = await analyzeText(scriptText, lang);

    const rows = phonemes.map((p, idx) => ({
      index: idx + 1,
      word: p.word,
      phoneme: p.phoneme,
      visemeId: p.visemeId,
      visemeLabel: p.visemeId !== null
        ? `${p.visemeId} (${AZURE_VISEMES[p.visemeId]?.short ?? "?"})`
        : "-",
      azureIPA: p.visemeId !== null
        ? AZURE_VISEMES[p.visemeId]?.description ?? "-"
        : "-",
      inAzure: p.inAzure,
    }));

    const total = rows.length;
    const matched = rows.filter((r) => r.inAzure).length;
    const vasScore = total > 0 ? (matched / total) * 100 : 0;

    setLoading(false);
    setAnalysisResult({ rows, matched, total, vasScore });
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
          {scriptText
            ? <p className="text-white/80 text-sm bg-black/20 rounded-xl py-3 px-4">{scriptText}</p>
            : <p className="text-yellow-400/70 text-xs">Belum ada teks. Generate lipsync di halaman Avatar dulu.</p>
          }
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={handleAnalyze}
              disabled={!scriptText.trim() || loading}
              className={`rounded-xl py-2 px-4 text-sm font-medium cursor-pointer transition-all ${
                scriptText.trim() && !loading
                  ? "bg-purple-500/70 hover:bg-purple-500/90 text-white"
                  : "bg-gray-600/40 text-gray-400 cursor-not-allowed"
              }`}
            >
              {loading ? "Analyzing..." : "Analyze VAS"}
            </button>
            <span className="text-xs text-gray-400">
              Language: <span className="text-white font-medium">{lang === "id" ? "🇮🇩 Indonesia" : "🇺🇸 English"}</span>
            </span>
          </div>
        </div>

        {/* Result */}
        {analysisResult && (
          <>
            {/* VAS Score */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/20">
              <h2 className="text-white text-lg font-semibold mb-4">VAS Score</h2>
              <div className="flex items-center gap-6">
                <div className="text-center min-w-27.5">
                  <div className={`text-5xl font-bold ${scoreColor(analysisResult.vasScore)}`}>
                    {analysisResult.vasScore.toFixed(1)}%
                  </div>
                  <div className="text-gray-400 text-sm mt-1">
                    {analysisResult.matched} / {analysisResult.total}
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
                VAS = Phonemes recognized by Azure / Total phonemes × 100
              </p>
            </div>

            {/* Detail Table */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <h2 className="text-white text-lg font-semibold mb-4">Detail</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-3 px-3 text-gray-400 font-medium w-8">#</th>
                      <th className="text-left py-3 px-3 text-gray-400 font-medium">Word</th>
                      <th className="text-left py-3 px-3 text-gray-400 font-medium">IPA (espeak)</th>
                      <th className="text-left py-3 px-3 text-gray-400 font-medium">Azure IPA</th>
                      <th className="text-left py-3 px-3 text-gray-400 font-medium">Viseme</th>
                      <th className="text-center py-3 px-3 text-gray-400 font-medium">Match</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisResult.rows.map((row) => (
                      <tr
                        key={row.index}
                        className={`border-b border-white/5 ${row.inAzure ? "" : "bg-red-500/5"}`}
                      >
                        <td className="py-2 px-3 text-gray-500 text-xs">{row.index}</td>
                        <td className="py-2 px-3 text-white font-medium">{row.word}</td>
                        <td className="py-2 px-3 font-mono text-blue-300">{row.phoneme}</td>
                        <td className="py-2 px-3 font-mono text-gray-300 text-xs">{row.azureIPA}</td>
                        <td className="py-2 px-3 font-mono text-green-300 text-xs">{row.visemeLabel}</td>
                        <td className="py-2 px-3 text-center text-base">
                          {row.inAzure
                            ? <span className="text-green-400">✓</span>
                            : <span className="text-red-400">✗</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex gap-5 text-xs text-gray-500">
                <span><span className="text-green-400 mr-1">✓</span>Phoneme recognized by Azure</span>
                <span><span className="text-red-400 mr-1">✗</span>Phoneme not in Azure viseme set</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
