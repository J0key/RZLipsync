import { Environment, useTexture } from "@react-three/drei";
import { Avatar } from "./Avatar";
import { useThree } from "@react-three/fiber";

export const Experience = () => {
  const texture = useTexture("/textures/rhubarb.jpg");
  const viewport = useThree((state) => state.viewport);

  return (
    <>
      <Avatar position={[0, -3, 0]} scale={2} rotation={[0, 0, 0]} />
      <Environment preset="sunset" />

      {/* Background plane */}
      <mesh position={[0, 0, -5]}>
        <planeGeometry args={[viewport.width * 4, viewport.height * 4]} />
        <meshBasicMaterial map={texture} />
      </mesh>
    </>
  );
};