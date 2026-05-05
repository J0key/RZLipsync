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
          type="button"
          onClick={() => navigate(PAGES.rtf)}
          aria-pressed={currentPage === PAGES.rtf}
          className="bg-white/15 backdrop-blur-xl hover:bg-white/25 rounded-xl py-2 px-4 text-gray-700 text-sm font-medium cursor-pointer transition-all border border-white/20"
        >
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
