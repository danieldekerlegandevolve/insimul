import { useEffect, useRef } from 'react';
import { Entity } from '@playcanvas/react';
import { useApp, useFrame } from '@playcanvas/react/hooks';
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
  const playerRef = useRef<pc.Entity | null>(null);
  const cameraRef = useRef<pc.Entity | null>(null);
  const keysPressed = useRef<Set<string>>(new Set());
  const yaw = useRef(0);
  const pitch = useRef(0);
  const isPointerLocked = useRef(false);

  // Keyboard input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current.add(key);
      if (key === 'v') {
        // Camera toggle handled in parent
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Mouse input handling
  useEffect(() => {
    const canvas = app?.graphicsDevice?.canvas;
    if (!canvas) return;

    const handlePointerLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === canvas;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPointerLocked.current) return;

      const lookSpeed = 0.2;
      yaw.current -= e.movementX * lookSpeed;
      pitch.current -= e.movementY * lookSpeed;

      // Clamp pitch
      pitch.current = Math.max(-85, Math.min(85, pitch.current));
    };

    const handleClick = () => {
      if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock();
      }
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [app]);

  // Update loop using useFrame hook
  useFrame((dt: number) => {
    if (!playerRef.current || !cameraRef.current) return;

    const moveSpeed = 5;
    let moveX = 0;
    let moveZ = 0;

    // Calculate movement direction
    if (keysPressed.current.has('w') || keysPressed.current.has('arrowup')) {
      moveZ -= 1;
    }
    if (keysPressed.current.has('s') || keysPressed.current.has('arrowdown')) {
      moveZ += 1;
    }
    if (keysPressed.current.has('a') || keysPressed.current.has('arrowleft')) {
      moveX -= 1;
    }
    if (keysPressed.current.has('d') || keysPressed.current.has('arrowright')) {
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
  }, [cameraMode, onPositionChange]);

  return (
    <>
      {/* Player Entity */}
      <Entity
        name="player"
        position={[position.x, position.y + 1, position.z]}
        onCreate={(entity) => {
          playerRef.current = entity;
        }}
      >
        {/* Player Body */}
        <Entity name="player-body" position={[0, 0, 0]}>
          <Render type="cylinder" />
        </Entity>

        {/* Player Head */}
        <Entity name="player-head" position={[0, 0.9, 0]}>
          <Render type="sphere" />
        </Entity>
      </Entity>

      {/* Camera Entity */}
      <Entity
        name="camera"
        onCreate={(entity) => {
          cameraRef.current = entity;
        }}
      >
        <Camera clearColor="#87CEEB" fov={60} />
      </Entity>
    </>
  );
}
