import { Entity } from '@playcanvas/react';
import { useMaterial } from '@playcanvas/react/hooks';
import { Camera, Render, Script } from '@playcanvas/react/components';
import { CameraMode } from './PlayCanvasGame';
import { PlayerMovement } from './scripts/PlayerMovement';

interface PlayerControllerProps {
  position: { x: number; y: number; z: number };
  onPositionChange: (position: { x: number; y: number; z: number }) => void;
  cameraMode: CameraMode;
}

export function PlayerController({
  position,
  onPositionChange,
  cameraMode
}: PlayerControllerProps) {
  // Materials for player
  const bodyMaterial = useMaterial({ diffuse: '#3b82f6' });
  const headMaterial = useMaterial({ diffuse: '#ffd7a8' });

  return (
    <>
      {/* Player Entity */}
      <Entity
        name="player"
        position={[position.x, position.y + 1, position.z]}
      >
        {/* Player Controller Script */}
        <Script script={PlayerMovement} speed={5} cameraMode={cameraMode} onPositionChange={onPositionChange} />

        {/* Player Body */}
        <Entity name="player-body" position={[0, 0, 0]}>
          <Render type="cylinder" material={bodyMaterial} />
        </Entity>

        {/* Player Head */}
        <Entity name="player-head" position={[0, 0.9, 0]}>
          <Render type="sphere" material={headMaterial} />
        </Entity>

        {/* Camera Entity (child of player) */}
        <Entity
          name="camera"
          position={[0, 5, 10]}
        >
          <Camera clearColor="#87CEEB" fov={60} />
        </Entity>
      </Entity>
    </>
  );
}
