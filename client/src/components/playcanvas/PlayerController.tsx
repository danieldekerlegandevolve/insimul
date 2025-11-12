import { useRef } from 'react';
import { Entity } from '@playcanvas/react';
import { useApp, useFrame, useMaterial } from '@playcanvas/react/hooks';
import { Camera, Render } from '@playcanvas/react/components';
import { CameraMode } from './PlayCanvasGame';
import * as pc from 'playcanvas';

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
  const app = useApp();
  const playerRef = useRef<pc.Entity>(null);
  const cameraRef = useRef<pc.Entity>(null);
  const yaw = useRef(0);
  const pitch = useRef(0);
  const isPointerLocked = useRef(false);

  // Materials for player
  const bodyMaterial = useMaterial({ diffuse: '#3b82f6' });
  const headMaterial = useMaterial({ diffuse: '#ffd7a8' });

  // Mouse look controls
  useFrame(() => {
    const canvas = app?.graphicsDevice?.canvas;
    if (!canvas) return;

    if (!isPointerLocked.current && document.pointerLockElement === canvas) {
      isPointerLocked.current = true;
    } else if (isPointerLocked.current && document.pointerLockElement !== canvas) {
      isPointerLocked.current = false;
    }

    // Request pointer lock on click
    const handleClick = () => {
      if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock();
      }
    };

    canvas.onclick = handleClick;

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      if (!isPointerLocked.current) return;

      const lookSpeed = 0.2;
      yaw.current -= e.movementX * lookSpeed;
      pitch.current -= e.movementY * lookSpeed;

      // Clamp pitch
      pitch.current = Math.max(-85, Math.min(85, pitch.current));
    };

    window.onmousemove = handleMouseMove;
  });

  // Update loop
  useFrame((dt: number) => {
    if (!playerRef.current || !cameraRef.current || !app || !app.keyboard) return;

    const keyboard = app.keyboard;
    const moveSpeed = 5;
    let moveX = 0;
    let moveZ = 0;

    // Calculate movement direction using PlayCanvas keyboard API
    if (keyboard.isPressed(pc.KEY_W) || keyboard.isPressed(pc.KEY_UP)) {
      moveZ -= 1;
    }
    if (keyboard.isPressed(pc.KEY_S) || keyboard.isPressed(pc.KEY_DOWN)) {
      moveZ += 1;
    }
    if (keyboard.isPressed(pc.KEY_A) || keyboard.isPressed(pc.KEY_LEFT)) {
      moveX -= 1;
    }
    if (keyboard.isPressed(pc.KEY_D) || keyboard.isPressed(pc.KEY_RIGHT)) {
      moveX += 1;
    }

    // Normalize diagonal movement
    if (moveX !== 0 || moveZ !== 0) {
      const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
      moveX /= length;
      moveZ /= length;
    }

    // Apply movement relative to camera direction
    if (moveX !== 0 || moveZ !== 0) {
      const yawRad = yaw.current * (Math.PI / 180);
      const forward = new pc.Vec3(-Math.sin(yawRad), 0, -Math.cos(yawRad));
      const right = new pc.Vec3(Math.cos(yawRad), 0, -Math.sin(yawRad));

      const movement = new pc.Vec3();
      movement.add2(forward.mulScalar(moveZ), right.mulScalar(moveX));
      movement.mulScalar(moveSpeed * dt);

      const currentPos = playerRef.current.getPosition();
      playerRef.current.setPosition(
        currentPos.x + movement.x,
        currentPos.y,
        currentPos.z + movement.z
      );

      onPositionChange({
        x: currentPos.x + movement.x,
        y: currentPos.y,
        z: currentPos.z + movement.z
      });
    }

    // Update camera based on mode
    const playerPos = playerRef.current.getPosition();

    if (cameraMode === 'first-person') {
      // First person: camera at player eye level
      cameraRef.current.setPosition(playerPos.x, playerPos.y + 1.6, playerPos.z);
      cameraRef.current.setEulerAngles(pitch.current, yaw.current, 0);
    } else {
      // Third person: camera behind and above player
      const distance = 5;
      const height = 2;
      const yawRad = yaw.current * (Math.PI / 180);
      const pitchRad = pitch.current * (Math.PI / 180);

      const camX = playerPos.x + distance * Math.sin(yawRad) * Math.cos(pitchRad);
      const camY = playerPos.y + height + distance * Math.sin(pitchRad);
      const camZ = playerPos.z + distance * Math.cos(yawRad) * Math.cos(pitchRad);

      cameraRef.current.setPosition(camX, camY, camZ);
      cameraRef.current.lookAt(playerPos.x, playerPos.y + 1, playerPos.z);
    }
  });

  return (
    <>
      {/* Player Entity */}
      <Entity
        name="player"
        ref={playerRef}
        position={[position.x, position.y + 1, position.z]}
      >
        {/* Player Body */}
        <Entity name="player-body" position={[0, 0, 0]}>
          <Render type="cylinder" material={bodyMaterial} />
        </Entity>

        {/* Player Head */}
        <Entity name="player-head" position={[0, 0.9, 0]}>
          <Render type="sphere" material={headMaterial} />
        </Entity>
      </Entity>

      {/* Camera Entity */}
      <Entity
        name="camera"
        ref={cameraRef}
        position={[0, 5, 10]}
      >
        <Camera clearColor="#87CEEB" fov={60} />
      </Entity>
    </>
  );
}
