import { Environment, OrbitControls, useTexture } from "@react-three/drei";
import { Avatar } from "./Avatar";
import { useThree } from "@react-three/fiber";
import { TypingBox } from "./TypingBox";

export const Experience = () => {
  const texture = useTexture("textures/school.jpg");
  const viewport = useThree((state) => state.viewport);

  return (
    <>
      <div className="z-10 md:justify-center fixed bottom-4 left-4 right-4 flex gap-3 flex-wrap justify-stretch">
        <TypingBox />
      </div>
      <Avatar position={[0, -3, 5]} scale={2} />
      <Environment preset="apartment" />
      <mesh>
        <planeGeometry args={[viewport.width, viewport.height]} />
        <meshBasicMaterial map={texture} />
      </mesh>
    </>
  );
};
