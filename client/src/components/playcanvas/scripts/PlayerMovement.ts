import { createScript } from '@playcanvas/react/scripts';
import * as pc from 'playcanvas';

interface PlayerMovementProps {
  speed?: number;
  cameraMode?: 'first-person' | 'third-person';
  onPositionChange?: (pos: { x: number; y: number; z: number }) => void;
}

export const PlayerMovement = createScript<PlayerMovementProps>('PlayerMovement', {
  attributes: {
    speed: { type: 'number', default: 5 },
    cameraMode: { type: 'string', default: 'third-person' },
  },

  initialize() {
    this.yaw = 0;
    this.pitch = 0;
    this.isPointerLocked = false;

    // Get references
    this.camera = this.entity.findByName('camera');

    // Mouse look setup
    const canvas = this.app.graphicsDevice.canvas;

    // Request pointer lock on click
    canvas.addEventListener('click', () => {
      if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock();
      }
    });

    // Track pointer lock state
    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === canvas;
    });

    // Mouse move handler
    if (this.app.mouse) {
      this.app.mouse.on(pc.EVENT_MOUSEMOVE, this.onMouseMove, this);
    }
  },

  onMouseMove(event: pc.MouseEvent) {
    if (!this.isPointerLocked) return;

    const lookSpeed = 0.2;
    this.yaw -= event.dx * lookSpeed;
    this.pitch -= event.dy * lookSpeed;

    // Clamp pitch
    this.pitch = Math.max(-85, Math.min(85, this.pitch));
  },

  update(dt: number) {
    if (!this.app.keyboard || !this.camera) return;

    const keyboard = this.app.keyboard;
    let moveX = 0;
    let moveZ = 0;

    // Calculate movement direction
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
      const yawRad = this.yaw * (Math.PI / 180);
      const forward = new pc.Vec3(-Math.sin(yawRad), 0, -Math.cos(yawRad));
      const right = new pc.Vec3(Math.cos(yawRad), 0, -Math.sin(yawRad));

      const movement = new pc.Vec3();
      movement.add2(forward.mulScalar(moveZ), right.mulScalar(moveX));
      movement.mulScalar(this.speed * dt);

      const currentPos = this.entity.getPosition();
      this.entity.setPosition(
        currentPos.x + movement.x,
        currentPos.y,
        currentPos.z + movement.z
      );

      // Notify parent if callback exists
      if (this.onPositionChange) {
        this.onPositionChange({
          x: currentPos.x + movement.x,
          y: currentPos.y,
          z: currentPos.z + movement.z
        });
      }
    }

    // Update camera based on mode
    const playerPos = this.entity.getPosition();

    if (this.cameraMode === 'first-person') {
      // First person: camera at player eye level
      this.camera.setPosition(playerPos.x, playerPos.y + 1.6, playerPos.z);
      this.camera.setEulerAngles(this.pitch, this.yaw, 0);
    } else {
      // Third person: camera behind and above player
      const distance = 5;
      const height = 2;
      const yawRad = this.yaw * (Math.PI / 180);
      const pitchRad = this.pitch * (Math.PI / 180);

      const camX = playerPos.x + distance * Math.sin(yawRad) * Math.cos(pitchRad);
      const camY = playerPos.y + height + distance * Math.sin(pitchRad);
      const camZ = playerPos.z + distance * Math.cos(yawRad) * Math.cos(pitchRad);

      this.camera.setPosition(camX, camY, camZ);
      this.camera.lookAt(playerPos.x, playerPos.y + 1, playerPos.z);
    }
  },

  destroy() {
    if (this.app.mouse) {
      this.app.mouse.off(pc.EVENT_MOUSEMOVE, this.onMouseMove, this);
    }
  }
});
