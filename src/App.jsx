import { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { TypingBox } from "./components/TypingBox";
import { RTFCalculation } from "./components/RTFCalculation";
import { VASEvaluationAzure } from "./components/VASEvaluationAzure";

function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#ececec]">
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-gray-300" />
        <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
      </div>
      <p className="text-gray-600 text-sm font-medium tracking-wide">Loading...</p>
    </div>
  );
}

function App() {
  const [page, setPage] = useState("avatar"); // "avatar" | "vas" | "rtf"
  const [avatarReady, setAvatarReady] = useState(false);

  return (
    <>
      {/* Avatar page — always mounted to keep Canvas and TypingBox state */}
      <div className={page !== "avatar" ? "hidden" : "w-full h-full"}>
        <div className="fixed top-4 right-4 z-20 flex gap-3">
          <button
            onClick={() => setPage("rtf")}
            className="bg-emerald-500/70 hover:bg-emerald-500/90 rounded-xl py-2 px-4 text-white text-sm font-medium cursor-pointer transition-all flex items-center gap-2 backdrop-blur-md border border-white/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            RTF Calculation
          </button>

          <button
            onClick={() => setPage("vas")}
            className="bg-purple-500/70 hover:bg-purple-500/90 rounded-xl py-2 px-4 text-white text-sm font-medium cursor-pointer transition-all flex items-center gap-2 backdrop-blur-md border border-white/10"
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            VAS Evaluation
          </button>
        </div>

        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10 flex justify-center">
          <TypingBox />
        </div>
        {!avatarReady && <LoadingScreen />}
        <Canvas shadows camera={{ position: [0, 0, 8], fov: 42 }}>
          <color attach="background" args={["#ececec"]} />
          <Suspense fallback={null}>
            <Experience onReady={() => setAvatarReady(true)} />
          </Suspense>
        </Canvas>

      </div>

      {page === "rtf" && <RTFCalculation onBack={() => setPage("avatar")} />}
      {page === "vas" && <VASEvaluationAzure onBack={() => setPage("avatar")} />}
    </>
  );
}

export default App;
