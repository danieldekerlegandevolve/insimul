/**
 * Quest Object Manager
 *
 * Manages interactive quest objects, NPCs, locations, and objectives in the 3D world.
 * Connects procedurally generated quests with actual game entities.
 */

import { Scene, Mesh, MeshBuilder, Vector3, StandardMaterial, Color3, Animation, ActionManager, ExecuteCodeAction } from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';

// Quest objective types that can be spawned/tracked in the world
export type QuestObjectiveType =
  | 'collect_item'      // Physical object to collect
  | 'visit_location'    // Location marker to visit
  | 'talk_to_npc'       // NPC to talk to
  | 'use_vocabulary'    // Vocabulary words to use in conversation
  | 'complete_conversation' // Conversation turns to complete
  | 'perform_action';   // Social action to perform

export interface QuestObjective {
  id: string;
  questId: string;
  type: QuestObjectiveType;
  description: string;
  completed: boolean;

  // For collect_item
  itemName?: string;
  itemModel?: string;
  itemCount?: number;
  collectedCount?: number;
  spawnPositions?: Vector3[];

  // For visit_location
  locationName?: string;
  locationPosition?: Vector3;
  locationRadius?: number;

  // For talk_to_npc
  npcId?: string;
  npcName?: string;
  requiredDialogue?: string[];

  // For vocabulary/conversation
  targetWords?: string[];
  wordsUsed?: string[];
  requiredCount?: number;
  currentCount?: number;

  // For perform_action
  actionId?: string;
  actionName?: string;
  targetNpcId?: string;
}

export interface Quest {
  id: string;
  worldId: string;
  title: string;
  description: string;
  questType: string;
  difficulty: string;
  status: string;
  objectives: QuestObjective[];
  progress: Record<string, any>;
  completionCriteria: Record<string, any>;
  assignedTo?: string;
  assignedBy?: string;
  assignedByCharacterId?: string;
}

interface QuestObject {
  mesh: Mesh;
  label?: GUI.AdvancedDynamicTexture;
  questId: string;
  objectiveId: string;
  type: QuestObjectiveType;
  isCollected: boolean;
}

export class QuestObjectManager {
  private scene: Scene;
  private questObjects: Map<string, QuestObject> = new Map();
  private locationMarkers: Map<string, Mesh> = new Map();
  private activeQuests: Quest[] = [];

  // Callbacks
  private onObjectCollected?: (questId: string, objectiveId: string) => void;
  private onLocationVisited?: (questId: string, objectiveId: string) => void;
  private onObjectiveCompleted?: (questId: string, objectiveId: string) => void;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Load and spawn objects for a quest
   */
  public async loadQuest(quest: Quest) {
    console.log(`Loading quest objects for: ${quest.title}`);

    // Add to active quests
    this.activeQuests.push(quest);

    // Parse and spawn objectives from quest data
    const objectives = this.parseQuestObjectives(quest);

    for (const objective of objectives) {
      await this.spawnObjective(objective);
    }
  }

  /**
   * Parse quest data to extract objectives
   */
  private parseQuestObjectives(quest: Quest): QuestObjective[] {
    const objectives: QuestObjective[] = [];

    // Check completion criteria for collectible items
    if (quest.completionCriteria?.type === 'collect_items') {
      const itemNames = quest.completionCriteria.items || [];
      itemNames.forEach((itemName: string, index: number) => {
        objectives.push({
          id: `${quest.id}_collect_${index}`,
          questId: quest.id,
          type: 'collect_item',
          description: `Collect ${itemName}`,
          completed: false,
          itemName,
          itemCount: 1,
          collectedCount: 0,
          spawnPositions: this.generateSpawnPositions(1)
        });
      });
    }

    // Check for vocabulary objectives
    if (quest.completionCriteria?.type === 'vocabulary_usage') {
      objectives.push({
        id: `${quest.id}_vocab`,
        questId: quest.id,
        type: 'use_vocabulary',
        description: quest.completionCriteria.description || 'Use vocabulary words',
        completed: false,
        targetWords: quest.completionCriteria.targetWords || [],
        wordsUsed: quest.progress?.wordsUsed || [],
        requiredCount: quest.completionCriteria.requiredCount || 10,
        currentCount: quest.progress?.currentCount || 0
      });
    }

    // Check for conversation objectives
    if (quest.completionCriteria?.type === 'conversation_turns') {
      objectives.push({
        id: `${quest.id}_conversation`,
        questId: quest.id,
        type: 'complete_conversation',
        description: quest.completionCriteria.description || 'Complete conversation',
        completed: false,
        targetWords: quest.completionCriteria.keywords || [],
        requiredCount: quest.completionCriteria.requiredTurns || 5,
        currentCount: quest.progress?.turnsCompleted || 0
      });
    }

    // Check for NPC talk objectives
    if (quest.assignedByCharacterId) {
      objectives.push({
        id: `${quest.id}_talk_npc`,
        questId: quest.id,
        type: 'talk_to_npc',
        description: `Talk to ${quest.assignedBy}`,
        completed: false,
        npcId: quest.assignedByCharacterId,
        npcName: quest.assignedBy
      });
    }

    // Parse objectives array if it exists
    if (quest.objectives && Array.isArray(quest.objectives)) {
      quest.objectives.forEach((obj: any, index: number) => {
        // Try to infer objective type from description
        const desc = obj.description?.toLowerCase() || '';

        if (desc.includes('collect') || desc.includes('find') || desc.includes('gather')) {
          // Extract item name from description
          const itemMatch = desc.match(/collect|find|gather\s+(?:the\s+)?(\w+)/i);
          const itemName = itemMatch ? itemMatch[1] : `item_${index}`;

          objectives.push({
            id: `${quest.id}_obj_${index}`,
            questId: quest.id,
            type: 'collect_item',
            description: obj.description,
            completed: obj.isCompleted || false,
            itemName,
            itemCount: 1,
            collectedCount: 0,
            spawnPositions: this.generateSpawnPositions(1)
          });
        } else if (desc.includes('talk') || desc.includes('speak') || desc.includes('conversation')) {
          // NPC conversation objective
          const npcMatch = desc.match(/talk to|speak with|visit\s+(\w+)/i);
          const npcName = npcMatch ? npcMatch[1] : 'NPC';

          objectives.push({
            id: `${quest.id}_obj_${index}`,
            questId: quest.id,
            type: 'talk_to_npc',
            description: obj.description,
            completed: obj.isCompleted || false,
            npcName
          });
        } else if (desc.includes('go to') || desc.includes('visit') || desc.includes('travel')) {
          // Location visit objective
          const locationMatch = desc.match(/go to|visit|travel to\s+(?:the\s+)?(\w+)/i);
          const locationName = locationMatch ? locationMatch[1] : `location_${index}`;

          objectives.push({
            id: `${quest.id}_obj_${index}`,
            questId: quest.id,
            type: 'visit_location',
            description: obj.description,
            completed: obj.isCompleted || false,
            locationName,
            locationPosition: this.generateLocationPosition(),
            locationRadius: 5
          });
        }
      });
    }

    return objectives;
  }

  /**
   * Spawn a quest objective in the world
   */
  private async spawnObjective(objective: QuestObjective) {
    if (objective.completed) return;

    switch (objective.type) {
      case 'collect_item':
        this.spawnCollectibleItems(objective);
        break;

      case 'visit_location':
        this.spawnLocationMarker(objective);
        break;

      case 'talk_to_npc':
        // NPC objectives don't need spawning, just tracking
        console.log(`Quest objective: Talk to ${objective.npcName}`);
        break;

      case 'use_vocabulary':
      case 'complete_conversation':
        // These are tracked through conversation, no physical spawn
        console.log(`Quest objective: ${objective.description}`);
        break;
    }
  }

  /**
   * Spawn collectible item objects in the world
   */
  private spawnCollectibleItems(objective: QuestObjective) {
    const positions = objective.spawnPositions || this.generateSpawnPositions(objective.itemCount || 1);

    positions.forEach((position, index) => {
      const itemId = `${objective.id}_item_${index}`;

      // Create glowing collectible object
      const item = MeshBuilder.CreateSphere(
        `quest_item_${itemId}`,
        { diameter: 0.8, segments: 16 },
        this.scene
      );

      item.position = position;

      // Create material with quest color (golden yellow)
      const material = new StandardMaterial(`quest_item_mat_${itemId}`, this.scene);
      material.diffuseColor = new Color3(1, 0.84, 0);
      material.emissiveColor = new Color3(0.5, 0.42, 0);
      material.alpha = 0.9;
      item.material = material;

      // Add floating animation
      const floatAnim = new Animation(
        `quest_item_float_${itemId}`,
        'position.y',
        30,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CYCLE
      );

      const baseY = position.y;
      floatAnim.setKeys([
        { frame: 0, value: baseY },
        { frame: 30, value: baseY + 0.3 },
        { frame: 60, value: baseY }
      ]);

      item.animations.push(floatAnim);
      this.scene.beginAnimation(item, 0, 60, true);

      // Add rotation animation
      const rotateAnim = new Animation(
        `quest_item_rotate_${itemId}`,
        'rotation.y',
        30,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CYCLE
      );

      rotateAnim.setKeys([
        { frame: 0, value: 0 },
        { frame: 60, value: Math.PI * 2 }
      ]);

      item.animations.push(rotateAnim);
      this.scene.beginAnimation(item, 0, 60, true);

      // Add collision detection
      item.actionManager = new ActionManager(this.scene);
      item.actionManager.registerAction(
        new ExecuteCodeAction(
          {
            trigger: ActionManager.OnIntersectionEnterTrigger,
            parameter: { usePreciseIntersection: false }
          },
          () => {
            this.collectItem(objective.questId, objective.id, itemId);
          }
        )
      );

      // Create label
      const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI(`quest_item_ui_${itemId}`);
      const label = new GUI.Rectangle(`quest_item_label_${itemId}`);
      label.width = '150px';
      label.height = '40px';
      label.cornerRadius = 5;
      label.color = 'white';
      label.thickness = 2;
      label.background = 'rgba(0, 0, 0, 0.7)';

      const text = new GUI.TextBlock();
      text.text = `✨ ${objective.itemName || 'Quest Item'}`;
      text.color = '#FFD700';
      text.fontSize = 14;
      label.addControl(text);

      advancedTexture.addControl(label);
      label.linkWithMesh(item);
      label.linkOffsetY = -50;

      // Store quest object
      this.questObjects.set(itemId, {
        mesh: item,
        label: advancedTexture,
        questId: objective.questId,
        objectiveId: objective.id,
        type: 'collect_item',
        isCollected: false
      });
    });
  }

  /**
   * Spawn location marker in the world
   */
  private spawnLocationMarker(objective: QuestObjective) {
    if (!objective.locationPosition) return;

    const markerId = objective.id;

    // Create a beacon/pillar of light
    const beacon = MeshBuilder.CreateCylinder(
      `quest_location_${markerId}`,
      { height: 10, diameter: 2, tessellation: 24 },
      this.scene
    );

    beacon.position = objective.locationPosition.clone();
    beacon.position.y += 5; // Raise it up

    // Create glowing material
    const material = new StandardMaterial(`quest_location_mat_${markerId}`, this.scene);
    material.diffuseColor = new Color3(0.2, 0.8, 1);
    material.emissiveColor = new Color3(0.1, 0.4, 0.5);
    material.alpha = 0.4;
    beacon.material = material;

    // Add pulsing animation
    const pulseAnim = new Animation(
      `quest_location_pulse_${markerId}`,
      'material.alpha',
      30,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CYCLE
    );

    pulseAnim.setKeys([
      { frame: 0, value: 0.2 },
      { frame: 30, value: 0.6 },
      { frame: 60, value: 0.2 }
    ]);

    beacon.animations.push(pulseAnim);
    this.scene.beginAnimation(beacon, 0, 60, true);

    this.locationMarkers.set(markerId, beacon);
  }

  /**
   * Generate random spawn positions for quest objects
   */
  private generateSpawnPositions(count: number): Vector3[] {
    const positions: Vector3[] = [];
    const radius = 30; // Spawn within 30 units of origin

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const distance = 10 + Math.random() * radius;

      positions.push(new Vector3(
        Math.cos(angle) * distance,
        0.5, // Slightly above ground
        Math.sin(angle) * distance
      ));
    }

    return positions;
  }

  /**
   * Generate a location position
   */
  private generateLocationPosition(): Vector3 {
    const angle = Math.random() * Math.PI * 2;
    const distance = 20 + Math.random() * 20;

    return new Vector3(
      Math.cos(angle) * distance,
      0,
      Math.sin(angle) * distance
    );
  }

  /**
   * Handle item collection
   */
  private collectItem(questId: string, objectiveId: string, itemId: string) {
    const questObject = this.questObjects.get(itemId);
    if (!questObject || questObject.isCollected) return;

    questObject.isCollected = true;

    // Play collection animation
    const mesh = questObject.mesh;
    const collectAnim = new Animation(
      'collect_anim',
      'scaling',
      60,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    collectAnim.setKeys([
      { frame: 0, value: Vector3.One() },
      { frame: 20, value: new Vector3(1.5, 1.5, 1.5) },
      { frame: 40, value: Vector3.Zero() }
    ]);

    mesh.animations = [collectAnim];
    this.scene.beginAnimation(mesh, 0, 40, false, 2, () => {
      mesh.dispose();
      questObject.label?.dispose();
      this.questObjects.delete(itemId);
    });

    // Notify callback
    if (this.onObjectCollected) {
      this.onObjectCollected(questId, objectiveId);
    }
  }

  /**
   * Check if player is near a location marker
   */
  public checkLocationProximity(playerPosition: Vector3): void {
    this.activeQuests.forEach(quest => {
      quest.objectives?.forEach(objective => {
        if (objective.type === 'visit_location' && !objective.completed) {
          const marker = this.locationMarkers.get(objective.id);
          if (marker && objective.locationPosition) {
            const distance = Vector3.Distance(playerPosition, objective.locationPosition);
            const radius = objective.locationRadius || 5;

            if (distance <= radius) {
              this.visitLocation(quest.id, objective.id);
            }
          }
        }
      });
    });
  }

  /**
   * Handle location visit
   */
  private visitLocation(questId: string, objectiveId: string) {
    const marker = this.locationMarkers.get(objectiveId);
    if (!marker) return;

    // Mark as visited (dispose marker)
    marker.dispose();
    this.locationMarkers.delete(objectiveId);

    // Notify callback
    if (this.onLocationVisited) {
      this.onLocationVisited(questId, objectiveId);
    }
  }

  /**
   * Track NPC conversation for quest
   */
  public trackNPCConversation(npcId: string, questId?: string) {
    this.activeQuests.forEach(quest => {
      if (questId && quest.id !== questId) return;

      quest.objectives?.forEach(objective => {
        if (objective.type === 'talk_to_npc' && objective.npcId === npcId && !objective.completed) {
          this.completeObjective(quest.id, objective.id);
        }
      });
    });
  }

  /**
   * Track vocabulary usage for quests
   */
  public trackVocabularyUsage(word: string, questId?: string) {
    this.activeQuests.forEach(quest => {
      if (questId && quest.id !== questId) return;

      quest.objectives?.forEach(objective => {
        if (objective.type === 'use_vocabulary' && !objective.completed) {
          if (objective.targetWords?.includes(word.toLowerCase()) &&
              !objective.wordsUsed?.includes(word.toLowerCase())) {
            objective.wordsUsed = objective.wordsUsed || [];
            objective.wordsUsed.push(word.toLowerCase());
            objective.currentCount = (objective.currentCount || 0) + 1;

            if (objective.currentCount >= (objective.requiredCount || 10)) {
              this.completeObjective(quest.id, objective.id);
            }
          }
        }
      });
    });
  }

  /**
   * Track conversation turns for quests
   */
  public trackConversationTurn(keywords: string[], questId?: string) {
    this.activeQuests.forEach(quest => {
      if (questId && quest.id !== questId) return;

      quest.objectives?.forEach(objective => {
        if (objective.type === 'complete_conversation' && !objective.completed) {
          const matchedKeywords = keywords.filter(k =>
            objective.targetWords?.some(t => t.toLowerCase() === k.toLowerCase())
          );

          if (matchedKeywords.length > 0) {
            objective.currentCount = (objective.currentCount || 0) + 1;

            if (objective.currentCount >= (objective.requiredCount || 5)) {
              this.completeObjective(quest.id, objective.id);
            }
          }
        }
      });
    });
  }

  /**
   * Complete an objective
   */
  private completeObjective(questId: string, objectiveId: string) {
    const quest = this.activeQuests.find(q => q.id === questId);
    if (!quest) return;

    const objective = quest.objectives?.find(o => o.id === objectiveId);
    if (!objective) return;

    objective.completed = true;

    // Notify callback
    if (this.onObjectiveCompleted) {
      this.onObjectiveCompleted(questId, objectiveId);
    }

    // Check if all objectives are complete
    const allComplete = quest.objectives?.every(o => o.completed);
    if (allComplete) {
      this.completeQuest(questId);
    }
  }

  /**
   * Complete a quest
   */
  private completeQuest(questId: string) {
    console.log(`Quest completed: ${questId}`);

    // Remove quest objects
    this.cleanupQuest(questId);

    // Remove from active quests
    const index = this.activeQuests.findIndex(q => q.id === questId);
    if (index !== -1) {
      this.activeQuests.splice(index, 1);
    }
  }

  /**
   * Clean up all objects for a quest
   */
  private cleanupQuest(questId: string) {
    // Remove quest objects
    Array.from(this.questObjects.entries()).forEach(([itemId, obj]) => {
      if (obj.questId === questId) {
        obj.mesh.dispose();
        obj.label?.dispose();
        this.questObjects.delete(itemId);
      }
    });

    // Remove location markers
    Array.from(this.locationMarkers.entries()).forEach(([markerId, marker]) => {
      const quest = this.activeQuests.find(q => q.id === questId);
      const objective = quest?.objectives?.find(o => o.id === markerId);
      if (objective) {
        marker.dispose();
        this.locationMarkers.delete(markerId);
      }
    });
  }

  /**
   * Set callbacks
   */
  public setOnObjectCollected(callback: (questId: string, objectiveId: string) => void) {
    this.onObjectCollected = callback;
  }

  public setOnLocationVisited(callback: (questId: string, objectiveId: string) => void) {
    this.onLocationVisited = callback;
  }

  public setOnObjectiveCompleted(callback: (questId: string, objectiveId: string) => void) {
    this.onObjectiveCompleted = callback;
  }

  /**
   * Dispose all quest objects
   */
  public dispose() {
    this.questObjects.forEach(obj => {
      obj.mesh.dispose();
      obj.label?.dispose();
    });
    this.questObjects.clear();

    this.locationMarkers.forEach(marker => marker.dispose());
    this.locationMarkers.clear();

    this.activeQuests = [];
  }
}
