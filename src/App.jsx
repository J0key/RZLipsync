import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { TypingBox } from "./components/TypingBox";

function App() {
  return (
    <>
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
