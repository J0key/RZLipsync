import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { TypingBox } from "./components/TypingBox";
import { VASEvaluationAzure } from "./components/VASEvaluationAzure";

function App() {
  const [page, setPage] = useState("avatar"); // "avatar" | "vas"

  if (page === "vas") {
    return <VASEvaluationAzure onBack={() => setPage("avatar")} />;
  }

  return (
    <>
      {/* VAS Evaluation button — top-right corner */}
      <button
        onClick={() => setPage("vas")}
        className="fixed top-4 right-4 z-20 bg-purple-500/70 hover:bg-purple-500/90 rounded-xl py-2 px-4 text-white text-sm font-medium cursor-pointer transition-all flex items-center gap-2 backdrop-blur-md border border-white/10"
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

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10 flex justify-center">
        <TypingBox />
      </div>
      <Canvas shadows camera={{ position: [0, 0, 8], fov: 42 }}>
        <color attach="background" args={["#ececec"]} />
        <Experience />
      </Canvas>
    </>
  );
}

export default App;
