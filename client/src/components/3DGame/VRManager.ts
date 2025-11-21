/**
 * VR Manager
 *
 * Manages WebXR VR support, controllers, teleportation, and VR interactions
 */

import {
  Scene,
  WebXRDefaultExperience,
  WebXRState,
  Vector3,
  Color3,
  Mesh,
  StandardMaterial,
  AbstractMesh,
  Ray,
  WebXRInputSource,
  WebXRControllerComponent,
  WebXRMotionControllerManager,
  Observable,
  GroundMesh
} from '@babylonjs/core';

export interface VRControllerInfo {
  inputSource: WebXRInputSource;
  hand: 'left' | 'right' | 'none';
  mesh?: AbstractMesh;
  pointer?: Ray;
}

export class VRManager {
  private scene: Scene;
  private xrExperience: WebXRDefaultExperience | null = null;
  private isVREnabled: boolean = false;
  private isInVRSession: boolean = false;

  // Controllers
  private controllers: Map<string, VRControllerInfo> = new Map();

  // Teleportation
  private teleportationEnabled: boolean = true;
  private teleportMeshes: AbstractMesh[] = [];
  private teleportationFloorMeshes: AbstractMesh[] = [];

  // Callbacks
  private onVRSessionStart: (() => void) | null = null;
  private onVRSessionEnd: (() => void) | null = null;
  private onTeleport: ((position: Vector3) => void) | null = null;
  private onControllerAdded: ((controller: VRControllerInfo) => void) | null = null;
  private onControllerRemoved: ((controllerId: string) => void) | null = null;

  // Observables for real-time events
  public onBeforeRenderObservable: Observable<void> = new Observable();

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Initialize VR with WebXR
   */
  public async initializeVR(ground?: GroundMesh): Promise<boolean> {
    try {
      console.log('Initializing VR with WebXR...');

      // Create WebXR experience
      this.xrExperience = await this.scene.createDefaultXRExperienceAsync({
        floorMeshes: ground ? [ground] : [],
        optionalFeatures: true
      });

      if (!this.xrExperience) {
        console.warn('Failed to create WebXR experience');
        return false;
      }

      this.isVREnabled = true;

      // Set up teleportation if ground is provided
      if (ground && this.xrExperience.teleportation) {
        this.teleportationFloorMeshes.push(ground);
        this.xrExperience.teleportation.addFloorMesh(ground);
        console.log('Teleportation enabled on ground mesh');
      }

      // Set up session state handlers
      this.xrExperience.baseExperience.onStateChangedObservable.add((state) => {
        switch (state) {
          case WebXRState.IN_XR:
            this.handleVRSessionStart();
            break;
          case WebXRState.NOT_IN_XR:
            this.handleVRSessionEnd();
            break;
        }
      });

      // Set up controller tracking
      this.xrExperience.input.onControllerAddedObservable.add((controller) => {
        this.handleControllerAdded(controller);
      });

      this.xrExperience.input.onControllerRemovedObservable.add((controller) => {
        this.handleControllerRemoved(controller);
      });

      console.log('VR initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize VR:', error);
      this.isVREnabled = false;
      return false;
    }
  }

  /**
   * Enter VR session
   */
  public async enterVR(): Promise<boolean> {
    if (!this.isVREnabled || !this.xrExperience) {
      console.warn('VR not initialized');
      return false;
    }

    try {
      const xrHelper = this.xrExperience.baseExperience;
      await xrHelper.enterXRAsync('immersive-vr', 'local-floor');
      return true;
    } catch (error) {
      console.error('Failed to enter VR:', error);
      return false;
    }
  }

  /**
   * Exit VR session
   */
  public async exitVR(): Promise<void> {
    if (!this.xrExperience) return;

    try {
      await this.xrExperience.baseExperience.exitXRAsync();
    } catch (error) {
      console.error('Failed to exit VR:', error);
    }
  }

  /**
   * Check if VR is available
   */
  public isVRAvailable(): boolean {
    return this.isVREnabled && this.xrExperience !== null;
  }

  /**
   * Check if currently in VR session
   */
  public isInVR(): boolean {
    return this.isInVRSession;
  }

  /**
   * Get VR camera
   */
  public getVRCamera() {
    return this.xrExperience?.baseExperience.camera;
  }

  /**
   * Add mesh for teleportation
   */
  public addTeleportMesh(mesh: AbstractMesh): void {
    if (!this.xrExperience?.teleportation) return;

    this.teleportationFloorMeshes.push(mesh);
    this.xrExperience.teleportation.addFloorMesh(mesh);
  }

  /**
   * Remove mesh from teleportation
   */
  public removeTeleportMesh(mesh: AbstractMesh): void {
    if (!this.xrExperience?.teleportation) return;

    const index = this.teleportationFloorMeshes.indexOf(mesh);
    if (index > -1) {
      this.teleportationFloorMeshes.splice(index, 1);
    }

    this.xrExperience.teleportation.removeFloorMesh(mesh);
  }

  /**
   * Enable/disable teleportation
   */
  public setTeleportationEnabled(enabled: boolean): void {
    this.teleportationEnabled = enabled;

    if (this.xrExperience?.teleportation) {
      if (enabled) {
        this.xrExperience.teleportation.attach();
      } else {
        this.xrExperience.teleportation.detach();
      }
    }
  }

  /**
   * Get controller by hand
   */
  public getController(hand: 'left' | 'right'): VRControllerInfo | null {
    for (const controller of this.controllers.values()) {
      if (controller.hand === hand) {
        return controller;
      }
    }
    return null;
  }

  /**
   * Get all controllers
   */
  public getAllControllers(): VRControllerInfo[] {
    return Array.from(this.controllers.values());
  }

  /**
   * Handle VR session start
   */
  private handleVRSessionStart(): void {
    console.log('VR session started');
    this.isInVRSession = true;

    if (this.onVRSessionStart) {
      this.onVRSessionStart();
    }
  }

  /**
   * Handle VR session end
   */
  private handleVRSessionEnd(): void {
    console.log('VR session ended');
    this.isInVRSession = false;

    if (this.onVRSessionEnd) {
      this.onVRSessionEnd();
    }
  }

  /**
   * Handle controller added
   */
  private handleControllerAdded(controller: WebXRInputSource): void {
    console.log('VR controller added:', controller.uniqueId);

    const hand = controller.inputSource.handedness as 'left' | 'right' | 'none';

    const controllerInfo: VRControllerInfo = {
      inputSource: controller,
      hand,
      mesh: controller.grip || controller.pointer
    };

    this.controllers.set(controller.uniqueId, controllerInfo);

    // Set up controller button events
    controller.onMotionControllerInitObservable.add((motionController) => {
      console.log(`Motion controller initialized for ${hand} hand`);

      // Set up button handlers
      const triggerComponent = motionController.getComponent('xr-standard-trigger');
      if (triggerComponent) {
        triggerComponent.onButtonStateChangedObservable.add((component) => {
          if (component.pressed) {
            this.handleTriggerPressed(hand);
          }
        });
      }

      const squeezeComponent = motionController.getComponent('xr-standard-squeeze');
      if (squeezeComponent) {
        squeezeComponent.onButtonStateChangedObservable.add((component) => {
          if (component.pressed) {
            this.handleGripPressed(hand);
          }
        });
      }

      const thumbstickComponent = motionController.getComponent('xr-standard-thumbstick');
      if (thumbstickComponent) {
        thumbstickComponent.onAxisValueChangedObservable.add((axes) => {
          this.handleThumbstickMoved(hand, axes.x, axes.y);
        });
      }
    });

    if (this.onControllerAdded) {
      this.onControllerAdded(controllerInfo);
    }
  }

  /**
   * Handle controller removed
   */
  private handleControllerRemoved(controller: WebXRInputSource): void {
    console.log('VR controller removed:', controller.uniqueId);

    this.controllers.delete(controller.uniqueId);

    if (this.onControllerRemoved) {
      this.onControllerRemoved(controller.uniqueId);
    }
  }

  /**
   * Handle trigger button pressed
   */
  private handleTriggerPressed(hand: 'left' | 'right'): void {
    console.log(`${hand} trigger pressed`);
    // Trigger is typically used for selection/interaction
  }

  /**
   * Handle grip button pressed
   */
  private handleGripPressed(hand: 'left' | 'right'): void {
    console.log(`${hand} grip pressed`);
    // Grip is typically used for grabbing
  }

  /**
   * Handle thumbstick movement
   */
  private handleThumbstickMoved(hand: 'left' | 'right', x: number, y: number): void {
    // Thumbstick movement (can be used for smooth locomotion)
    // x: -1 (left) to 1 (right)
    // y: -1 (down) to 1 (up)
  }

  /**
   * Get pointer ray from controller
   */
  public getControllerRay(hand: 'left' | 'right'): Ray | null {
    const controller = this.getController(hand);
    if (!controller?.inputSource.pointer) return null;

    const pointerMesh = controller.inputSource.pointer;
    const origin = pointerMesh.position;
    const direction = pointerMesh.forward;

    return new Ray(origin, direction, 100);
  }

  /**
   * Raycast from controller
   */
  public raycastFromController(hand: 'left' | 'right', predicate?: (mesh: AbstractMesh) => boolean): AbstractMesh | null {
    const ray = this.getControllerRay(hand);
    if (!ray) return null;

    const pickInfo = this.scene.pickWithRay(ray, predicate);

    if (pickInfo?.hit && pickInfo.pickedMesh) {
      return pickInfo.pickedMesh as AbstractMesh;
    }

    return null;
  }

  /**
   * Set callbacks
   */
  public setOnVRSessionStart(callback: () => void): void {
    this.onVRSessionStart = callback;
  }

  public setOnVRSessionEnd(callback: () => void): void {
    this.onVRSessionEnd = callback;
  }

  public setOnTeleport(callback: (position: Vector3) => void): void {
    this.onTeleport = callback;
  }

  public setOnControllerAdded(callback: (controller: VRControllerInfo) => void): void {
    this.onControllerAdded = callback;
  }

  public setOnControllerRemoved(callback: (controllerId: string) => void): void {
    this.onControllerRemoved = callback;
  }

  /**
   * Get XR experience (for advanced use)
   */
  public getXRExperience(): WebXRDefaultExperience | null {
    return this.xrExperience;
  }

  /**
   * Dispose VR manager
   */
  public dispose(): void {
    if (this.xrExperience) {
      this.xrExperience.dispose();
      this.xrExperience = null;
    }

    this.controllers.clear();
    this.teleportationFloorMeshes = [];
    this.isVREnabled = false;
    this.isInVRSession = false;
  }
}
