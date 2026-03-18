import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { TypingBox } from "./components/TypingBox";
import { VASEvaluation } from "./components/VASEvaluation";

function App() {
  const [currentPage, setCurrentPage] = useState("avatar");

  if (currentPage === "evaluation") {
    return <VASEvaluation onBack={() => setCurrentPage("avatar")} />;
  }

  return (
    <div className="relative w-full h-full">
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 30 }}>
        <color attach="background" args={["#ececec"]} />
        <Experience />
      </Canvas>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <TypingBox />
      </div>
      <button
        onClick={() => setCurrentPage("evaluation")}
        className="absolute top-4 right-4 z-10 bg-white/15 backdrop-blur-xl hover:bg-white/25 rounded-xl py-2 px-4 text-gray-700 text-sm font-medium cursor-pointer transition-all border border-white/20"
      >
        VAS Evaluation
      </button>
    </div>
  );
}

export default App;