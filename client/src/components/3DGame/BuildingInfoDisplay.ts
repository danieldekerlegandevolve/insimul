/**
 * Building Info Display
 *
 * Displays building information (name, type, occupants) when player hovers
 * or interacts with buildings in the 3D world.
 */

import { Scene, Mesh, ActionManager, ExecuteCodeAction, Vector3 } from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';

export class BuildingInfoDisplay {
  private scene: Scene;
  private advancedTexture: GUI.AdvancedDynamicTexture;
  private infoLabel: GUI.Rectangle | null = null;
  private currentBuilding: Mesh | null = null;

  constructor(scene: Scene, advancedTexture: GUI.AdvancedDynamicTexture) {
    this.scene = scene;
    this.advancedTexture = advancedTexture;
  }

  /**
   * Register hover events for a building mesh
   */
  public registerBuilding(building: Mesh): void {
    if (!building.metadata) return;

    // Ensure the building has an action manager
    if (!building.actionManager) {
      building.actionManager = new ActionManager(this.scene);
    }

    // Register pointer over action
    building.actionManager.registerAction(
      new ExecuteCodeAction(
        ActionManager.OnPointerOverTrigger,
        () => {
          this.showBuildingInfo(building);
        }
      )
    );

    // Register pointer out action
    building.actionManager.registerAction(
      new ExecuteCodeAction(
        ActionManager.OnPointerOutTrigger,
        () => {
          this.hideBuildingInfo();
        }
      )
    );

    // Make building pickable
    building.isPickable = true;
  }

  /**
   * Show building information label
   */
  private showBuildingInfo(building: Mesh): void {
    if (!building.metadata) return;

    this.currentBuilding = building;
    const metadata = building.metadata;

    // Create info label if it doesn't exist
    if (!this.infoLabel) {
      this.infoLabel = new GUI.Rectangle('buildingInfo');
      this.infoLabel.width = '300px';
      this.infoLabel.height = '120px';
      this.infoLabel.cornerRadius = 8;
      this.infoLabel.color = 'white';
      this.infoLabel.thickness = 2;
      this.infoLabel.background = 'rgba(0, 0, 0, 0.8)';
      this.advancedTexture.addControl(this.infoLabel);

      // Position at top center of screen
      this.infoLabel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
      this.infoLabel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
      this.infoLabel.top = '80px';
    }

    // Clear previous content
    this.infoLabel.clearControls();

    // Create content stack
    const stack = new GUI.StackPanel('buildingInfoStack');
    stack.width = '280px';
    stack.paddingTop = '10px';
    stack.paddingBottom = '10px';
    stack.spacing = 5;
    this.infoLabel.addControl(stack);

    // Building name/type header
    const nameText = new GUI.TextBlock('buildingName');
    if (metadata.buildingType === 'business') {
      nameText.text = metadata.businessName || metadata.businessType || 'Business';
    } else if (metadata.buildingType === 'residence') {
      nameText.text = 'Residence';
    } else {
      nameText.text = 'Building';
    }
    nameText.height = '24px';
    nameText.fontSize = 18;
    nameText.fontWeight = 'bold';
    nameText.color = 'white';
    stack.addControl(nameText);

    // Building type subtitle
    const typeText = new GUI.TextBlock('buildingType');
    if (metadata.buildingType === 'business') {
      typeText.text = metadata.businessType || 'Business';
      typeText.color = '#FFA500'; // Orange for businesses
    } else {
      typeText.text = 'Residence';
      typeText.color = '#87CEEB'; // Sky blue for residences
    }
    typeText.height = '20px';
    typeText.fontSize = 14;
    stack.addControl(typeText);

    // Separator
    const separator = new GUI.Rectangle('separator');
    separator.height = '2px';
    separator.width = '260px';
    separator.background = 'rgba(255, 255, 255, 0.3)';
    separator.thickness = 0;
    stack.addControl(separator);

    // Occupants/Employees info
    const infoText = new GUI.TextBlock('buildingOccupants');
    if (metadata.buildingType === 'business') {
      const employeeCount = metadata.employees?.length || 0;
      infoText.text = `${employeeCount} employee${employeeCount !== 1 ? 's' : ''}`;
      if (metadata.ownerId) {
        infoText.text += '\nOwner-operated';
      }
    } else if (metadata.buildingType === 'residence') {
      const occupantCount = metadata.occupants?.length || 0;
      infoText.text = `${occupantCount} resident${occupantCount !== 1 ? 's' : ''}`;
    }
    infoText.height = '40px';
    infoText.fontSize = 13;
    infoText.color = '#CCCCCC';
    infoText.textWrapping = true;
    stack.addControl(infoText);

    // Show the label
    this.infoLabel.isVisible = true;
  }

  /**
   * Hide building information label
   */
  private hideBuildingInfo(): void {
    if (this.infoLabel) {
      this.infoLabel.isVisible = false;
    }
    this.currentBuilding = null;
  }

  /**
   * Update label position if it's visible
   * Call this from render loop if you want the label to follow the building
   */
  public update(): void {
    // Currently using fixed position at top of screen
    // Could be enhanced to follow building position in world space
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.infoLabel) {
      this.advancedTexture.removeControl(this.infoLabel);
      this.infoLabel.dispose();
      this.infoLabel = null;
    }
    this.currentBuilding = null;
  }
}
