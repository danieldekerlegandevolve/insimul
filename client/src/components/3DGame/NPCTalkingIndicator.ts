/**
 * NPC Talking Indicator
 *
 * Visual indicator that shows when an NPC is talking/in conversation
 * Displays an animated speech bubble above the NPC's head
 */

import { Scene, Mesh, MeshBuilder, StandardMaterial, Color3, Vector3, Animation } from '@babylonjs/core';

export class NPCTalkingIndicator {
  private scene: Scene;
  private indicators: Map<string, Mesh> = new Map();
  private animations: Map<string, Animation> = new Map();

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Show talking indicator above an NPC
   * @param npcId The NPC's ID
   * @param npcMesh The NPC's mesh to attach the indicator to
   */
  public show(npcId: string, npcMesh: Mesh) {
    // Don't create duplicate indicators
    if (this.indicators.has(npcId)) {
      return;
    }

    // Create speech bubble indicator
    const bubble = MeshBuilder.CreateSphere(
      `talkIndicator_${npcId}`,
      { diameter: 0.3, segments: 8 },
      this.scene
    );

    // Position above NPC head
    bubble.parent = npcMesh;
    bubble.position = new Vector3(0.5, 2.5, 0);

    // Create material with soft color
    const material = new StandardMaterial(`talkIndicatorMat_${npcId}`, this.scene);
    material.diffuseColor = new Color3(1, 1, 1);
    material.emissiveColor = new Color3(0.3, 0.6, 1);
    material.alpha = 0.9;
    bubble.material = material;

    // Create floating animation
    const floatAnim = new Animation(
      `talkFloat_${npcId}`,
      'position.y',
      30,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const keys = [
      { frame: 0, value: 2.5 },
      { frame: 30, value: 2.7 },
      { frame: 60, value: 2.5 }
    ];

    floatAnim.setKeys(keys);
    bubble.animations.push(floatAnim);

    // Create scale pulse animation
    const pulseAnim = new Animation(
      `talkPulse_${npcId}`,
      'scaling',
      30,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const scaleKeys = [
      { frame: 0, value: new Vector3(1, 1, 1) },
      { frame: 15, value: new Vector3(1.2, 1.2, 1.2) },
      { frame: 30, value: new Vector3(1, 1, 1) }
    ];

    pulseAnim.setKeys(scaleKeys);
    bubble.animations.push(pulseAnim);

    // Start animations
    this.scene.beginAnimation(bubble, 0, 60, true);

    // Store reference
    this.indicators.set(npcId, bubble);
  }

  /**
   * Hide talking indicator for an NPC
   * @param npcId The NPC's ID
   */
  public hide(npcId: string) {
    const bubble = this.indicators.get(npcId);
    if (bubble) {
      this.scene.stopAnimation(bubble);
      bubble.dispose();
      this.indicators.delete(npcId);
    }
  }

  /**
   * Check if an NPC has a talking indicator showing
   * @param npcId The NPC's ID
   */
  public isShowing(npcId: string): boolean {
    return this.indicators.has(npcId);
  }

  /**
   * Hide all talking indicators
   */
  public hideAll() {
    this.indicators.forEach((bubble, npcId) => {
      this.scene.stopAnimation(bubble);
      bubble.dispose();
    });
    this.indicators.clear();
  }

  /**
   * Clean up all resources
   */
  public dispose() {
    this.hideAll();
  }
}
