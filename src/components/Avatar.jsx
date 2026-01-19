import React from "react";
import { useGraph, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import * as THREE from "three";
import { useLipsyncStore } from "../store/useLipsyncStore";

// Rhubarb viseme to ReadyPlayerMe morph target mapping
const visemeToMorphTarget = {
  A: "viseme_PP",   // Closed mouth (M, B, P)
  B: "viseme_kk",   // Slightly open (consonants)
  C: "viseme_E",    // Open mouth (E, EH)
  D: "viseme_aa",   // Wide open (A, I, AI)
  E: "viseme_O",    // Rounded small (O)
  F: "viseme_U",    // Rounded open (U, OO)
  G: "viseme_FF",   // Upper teeth on lower lip (F, V)
  H: "viseme_nn",   // Tongue behind teeth (L)
  X: "viseme_sil",  // Rest/neutral
};

// All available viseme morph targets
const allVisemes = [
  "viseme_PP",
  "viseme_kk",
  "viseme_E",
  "viseme_aa",
  "viseme_O",
  "viseme_U",
  "viseme_FF",
  "viseme_nn",
  "viseme_sil",
  "viseme_TH",
  "viseme_DD",
  "viseme_SS",
  "viseme_CH",
  "viseme_RR",
];

export function Avatar(props) {
  const { scene } = useGLTF("/models/696b7e55ab4bb0861132da19.glb");
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);

  const currentMessage = useLipsyncStore((state) => state.currentMessage);

  const lerpMorphTarget = (target, value, speed = 0.1) => {
    if (!target) return;

    // Apply to Wolf3D_Head
    if (nodes.Wolf3D_Head?.morphTargetDictionary?.[target] !== undefined) {
      const index = nodes.Wolf3D_Head.morphTargetDictionary[target];
      if (nodes.Wolf3D_Head.morphTargetInfluences[index] !== undefined) {
        nodes.Wolf3D_Head.morphTargetInfluences[index] = THREE.MathUtils.lerp(
          nodes.Wolf3D_Head.morphTargetInfluences[index],
          value,
          speed
        );
      }
    }

    // Apply to Wolf3D_Teeth
    if (nodes.Wolf3D_Teeth?.morphTargetDictionary?.[target] !== undefined) {
      const index = nodes.Wolf3D_Teeth.morphTargetDictionary[target];
      if (nodes.Wolf3D_Teeth.morphTargetInfluences[index] !== undefined) {
        nodes.Wolf3D_Teeth.morphTargetInfluences[index] = THREE.MathUtils.lerp(
          nodes.Wolf3D_Teeth.morphTargetInfluences[index],
          value,
          speed
        );
      }
    }
  };

  useFrame(() => {
    // Reset all visemes to 0 first
    allVisemes.forEach((viseme) => {
      lerpMorphTarget(viseme, 0, 0.1);
    });

    // Apply subtle smile when not talking
    lerpMorphTarget("mouthSmile", currentMessage ? 0 : 0.2, 0.5);

    // If we have a current message with audio playing, animate visemes
    if (currentMessage?.audioPlayer && currentMessage?.visemes) {
      const currentTime = currentMessage.audioPlayer.currentTime * 1000; // Convert to ms

      // Find the current viseme based on audio time
      for (let i = currentMessage.visemes.length - 1; i >= 0; i--) {
        const [time, visemeId] = currentMessage.visemes[i];
        if (currentTime >= time) {
          const morphTarget = visemeToMorphTarget[visemeId];
          if (morphTarget) {
            lerpMorphTarget(morphTarget, 1, 0.3);
          }
          break;
        }
      }
    }
  });

  return (
    <group {...props} dispose={null}>
      <primitive object={nodes.Hips} />
      <skinnedMesh
        geometry={nodes.Wolf3D_Hair.geometry}
        material={materials.Wolf3D_Hair}
        skeleton={nodes.Wolf3D_Hair.skeleton}
      />

      <skinnedMesh
        geometry={nodes.Wolf3D_Body.geometry}
        material={materials.Wolf3D_Body}
        skeleton={nodes.Wolf3D_Body.skeleton}
      />

      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Bottom.geometry}
        material={materials.Wolf3D_Outfit_Bottom}
        skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton}
      />

      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
        material={materials.Wolf3D_Outfit_Footwear}
        skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton}
      />

      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Top.geometry}
        material={materials.Wolf3D_Outfit_Top}
        skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
      />

      <skinnedMesh
        name="EyeLeft"
        geometry={nodes.EyeLeft.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeLeft.skeleton}
        morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences}
      />

      <skinnedMesh
        name="EyeRight"
        geometry={nodes.EyeRight.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeRight.skeleton}
        morphTargetDictionary={nodes.EyeRight.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeRight.morphTargetInfluences}
      />

      <skinnedMesh
        name="Wolf3D_Head"
        geometry={nodes.Wolf3D_Head.geometry}
        material={materials.Wolf3D_Skin}
        skeleton={nodes.Wolf3D_Head.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
      />

      <skinnedMesh
        name="Wolf3D_Teeth"
        geometry={nodes.Wolf3D_Teeth.geometry}
        material={materials.Wolf3D_Teeth}
        skeleton={nodes.Wolf3D_Teeth.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences}
      />
    </group>
  );
}

useGLTF.preload("/models/696b7e55ab4bb0861132da19.glb");