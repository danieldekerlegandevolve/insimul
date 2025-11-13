import { createScript } from '@playcanvas/react/scripts';
import * as pc from 'playcanvas';

interface PlayerMovementProps {
  speed?: number;
  cameraMode?: 'first-person' | 'third-person';
  lookSpeed?: number;
  onPositionChange?: (pos: { x: number; y: number; z: number }) => void;
}

export const PlayerMovement = createScript<PlayerMovementProps>('PlayerMovement', {
  attributes: {
    speed: { type: 'number', default: 5 },
    cameraMode: { type: 'string', default: 'third-person' },
    lookSpeed: { type: 'number', default: 0.25 },
  },

  initialize() {
    this.eulers = new pc.Vec3();
    this.force = new pc.Vec3();

    // Get camera reference
    this.camera = this.entity.findByName('camera');

    if (!this.camera) {
      console.error('PlayerMovement: Camera entity not found as child');
      return;
    }

    // Set up mouse controls
    if (this.app.mouse) {
      this.app.mouse.on(pc.EVENT_MOUSEMOVE, this._onMouseMove, this);

      // Enable pointer lock on click
      this.app.mouse.on(pc.EVENT_MOUSEDOWN, () => {
        if (!pc.Mouse.isPointerLocked()) {
          this.app.mouse.enablePointerLock();
        }
      }, this);
    }
  },

  _onMouseMove(event: pc.MouseEvent) {
    // Check if pointer is locked or left mouse button is down
    if (pc.Mouse.isPointerLocked() || event.buttons[0]) {
      this.eulers.x -= this.lookSpeed * event.dx;
      this.eulers.y -= this.lookSpeed * event.dy;

      // Clamp pitch to prevent over-rotation
      this.eulers.y = Math.max(-85, Math.min(85, this.eulers.y));
    }
  },

  update(dt: number) {
    if (!this.app.keyboard || !this.camera) return;

    const keyboard = this.app.keyboard;
    const camera = this.camera;

    // Get camera forward and right vectors for movement
    const forward = camera.forward;
    const right = camera.right;

    // Calculate movement direction from keyboard
    let x = 0;
    let z = 0;

    if (keyboard.isPressed(pc.KEY_W) || keyboard.isPressed(pc.KEY_UP)) {
      x += forward.x;
      z += forward.z;
    }
    if (keyboard.isPressed(pc.KEY_S) || keyboard.isPressed(pc.KEY_DOWN)) {
      x -= forward.x;
      z -= forward.z;
    }
    if (keyboard.isPressed(pc.KEY_A) || keyboard.isPressed(pc.KEY_Q)) {
      x -= right.x;
      z -= right.z;
    }
    if (keyboard.isPressed(pc.KEY_D)) {
      x += right.x;
      z += right.z;
    }

    // Apply movement if there's input
    if (x !== 0 || z !== 0) {
      // Normalize and scale movement
      this.force.set(x, 0, z).normalize().scale(this.speed * dt);

      // Move the player entity
      const currentPos = this.entity.getPosition();
      this.entity.setPosition(
        currentPos.x + this.force.x,
        currentPos.y,
        currentPos.z + this.force.z
      );

      // Notify parent component of position change
      if (this.onPositionChange) {
        this.onPositionChange({
          x: currentPos.x + this.force.x,
          y: currentPos.y,
          z: currentPos.z + this.force.z
        });
      }
    }

    // Update camera based on mode
    const playerPos = this.entity.getPosition();

    if (this.cameraMode === 'first-person') {
      // First person: camera at player eye level
      camera.setLocalPosition(0, 1.6, 0);
      camera.setLocalEulerAngles(this.eulers.y, this.eulers.x, 0);
    } else {
      // Third person: camera behind and above player
      const distance = 5;
      const height = 2;

      // Convert euler angles to radians for calculation
      const yawRad = this.eulers.x * (Math.PI / 180);
      const pitchRad = this.eulers.y * (Math.PI / 180);

      // Calculate camera position
      const offset = new pc.Vec3(
        distance * Math.sin(yawRad) * Math.cos(pitchRad),
        height + distance * Math.sin(pitchRad),
        distance * Math.cos(yawRad) * Math.cos(pitchRad)
      );

      camera.setPosition(
        playerPos.x + offset.x,
        playerPos.y + offset.y,
        playerPos.z + offset.z
      );
      camera.lookAt(playerPos.x, playerPos.y + 1, playerPos.z);
    }
  },

  destroy() {
    // Clean up event listeners
    if (this.app.mouse) {
      this.app.mouse.off(pc.EVENT_MOUSEMOVE, this._onMouseMove, this);
    }
  }
});
