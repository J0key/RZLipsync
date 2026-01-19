import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { TypingBox } from "./components/TypingBox";

function App() {
  return (
    <div className="relative w-full h-full">
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 30 }}>
        <color attach="background" args={["#ececec"]} />
        <Experience />
      </Canvas>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <TypingBox />
      </div>
    </div>
  );
}

export default App;