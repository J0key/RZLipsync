import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { RTFCalculation } from "./components/RTFCalculation";
import { TypingBox } from "./components/TypingBox";
import { VASEvaluation } from "./components/VASEvaluation";

const PAGES = {
  avatar: "avatar",
  rtf: "rtf",
  evaluation: "evaluation",
};

const getPageFromHash = () => {
  const page = window.location.hash.replace("#", "");
  return Object.values(PAGES).includes(page) ? page : PAGES.avatar;
};

function App() {
  const [currentPage, setCurrentPage] = useState(getPageFromHash);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(getPageFromHash());
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (page) => {
    window.location.hash = page === PAGES.avatar ? "" : page;
    setCurrentPage(page);
  };

  if (currentPage === PAGES.evaluation) {
    return <VASEvaluation onBack={() => navigate(PAGES.avatar)} />;
  }

  if (currentPage === PAGES.rtf) {
    return <RTFCalculation onBack={() => navigate(PAGES.avatar)} />;
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
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={() => navigate(PAGES.rtf)}
          className="bg-emerald-500/70 hover:bg-emerald-500/90 rounded-xl py-2 px-4 text-white text-sm font-medium cursor-pointer transition-all flex items-center gap-2 backdrop-blur-md border border-white/10"
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
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          RTF Calculation
        </button>
        <button
          type="button"
          onClick={() => navigate(PAGES.evaluation)}
          aria-pressed={currentPage === PAGES.evaluation}
          className="bg-white/15 backdrop-blur-xl hover:bg-white/25 rounded-xl py-2 px-4 text-gray-700 text-sm font-medium cursor-pointer transition-all border border-white/20"
        >
          VAS Evaluation
        </button>
      </div>
    </div>
  );
}

export default App;
