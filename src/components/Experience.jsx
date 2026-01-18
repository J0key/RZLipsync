import { Environment, useTexture } from "@react-three/drei";
import { Avatar } from "./Avatar";
import { useThree } from "@react-three/fiber";
import { TypingBox } from "./TypingBox";

export const Experience = () => {
  const texture = useTexture("textures/school.jpg");
  const viewport = useThree((state) => state.viewport);

  return (
    <>
      <Avatar position={[0, -3, 5]} scale={2} />
      <Environment preset="apartment" />
      <mesh>
        <planeGeometry args={[viewport.width, viewport.height]} />
        <meshBasicMaterial map={texture} />
      </mesh>
    </>
  );
};
