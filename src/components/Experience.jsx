import { Environment, useTexture } from "@react-three/drei";
import { Avatar } from "./Avatar";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

export const Experience = ({ onReady }) => {
  const texture = useTexture("textures/school.jpg");
  const viewport = useThree((state) => state.viewport);

  useEffect(() => {
    if (texture && onReady) onReady();
  }, [texture]);

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
