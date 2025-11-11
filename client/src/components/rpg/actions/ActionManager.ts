// Action system logic for RPG game

import { Action, ActionState, ActionContext, ActionResult, ActionEffect, ACTION_UI_CONFIGS } from '../types/actions';

export class ActionManager {
  private availableActions: Action[] = [];
  private activeActionStates: Map<string, ActionState> = new Map();
  private worldActions: Action[] = [];
  private baseActions: Action[] = [];

  constructor(worldActions: Action[], baseActions: Action[]) {
    this.worldActions = worldActions;
    this.baseActions = baseActions;
    this.availableActions = [...worldActions, ...baseActions];
  }

  /**
   * Get all actions by category (social, mental, combat, etc.)
   */
  getActionsByCategory(category: string): Action[] {
    return this.availableActions.filter(action => action.actionType === category);
  }

  /**
   * Get actions available in a specific context (e.g., talking to NPC)
   */
  getContextualActions(context: ActionContext): Action[] {
    return this.availableActions.filter(action => {
      // Check if action is available
      if (!action.isAvailable) return false;

      // Check cooldown
      const state = this.activeActionStates.get(action.id);
      if (state && state.cooldownRemaining > 0) return false;

      // Check energy cost
      if (action.energyCost && action.energyCost > context.playerEnergy) return false;

      // Check if target is required and present
      if (action.requiresTarget && !context.target) return false;

      // Check range if target is specified
      if (action.range && context.target) {
        // Would need to calculate distance to target
        // For now, assume close enough if target exists
      }

      // Check prerequisites
      if (action.prerequisites && action.prerequisites.length > 0) {
        // Would need to evaluate prerequisites against world state
        // For now, assume prerequisites are met
      }

      return true;
    });
  }

  /**
   * Get social actions available during NPC dialogue
   */
  getSocialActionsForNPC(npcId: string, context: ActionContext): Action[] {
    const socialActions = this.getActionsByCategory('social');
    return socialActions.filter(action => {
      const state = this.activeActionStates.get(action.id);
      const onCooldown = state && state.cooldownRemaining > 0;
      const hasEnergy = !action.energyCost || action.energyCost <= context.playerEnergy;
      return !onCooldown && hasEnergy;
    });
  }

  /**
   * Check if an action can be performed
   */
  canPerformAction(actionId: string, context: ActionContext): { canPerform: boolean; reason?: string } {
    const action = this.availableActions.find(a => a.id === actionId);
    
    if (!action) {
      return { canPerform: false, reason: 'Action not found' };
    }

    if (!action.isAvailable) {
      return { canPerform: false, reason: 'Action not available' };
    }

    // Check cooldown
    const state = this.activeActionStates.get(actionId);
    if (state && state.cooldownRemaining > 0) {
      return { canPerform: false, reason: `On cooldown (${state.cooldownRemaining}s remaining)` };
    }

    // Check energy
    if (action.energyCost && action.energyCost > context.playerEnergy) {
      return { canPerform: false, reason: `Not enough energy (need ${action.energyCost})` };
    }

    // Check target requirement
    if (action.requiresTarget && !context.target) {
      return { canPerform: false, reason: 'Requires a target' };
    }

    return { canPerform: true };
  }

  /**
   * Perform an action
   */
  async performAction(actionId: string, context: ActionContext): Promise<ActionResult> {
    const check = this.canPerformAction(actionId, context);
    if (!check.canPerform) {
      return {
        success: false,
        message: check.reason || 'Cannot perform action',
        effects: [],
        energyUsed: 0
      };
    }

    const action = this.availableActions.find(a => a.id === actionId);
    if (!action) {
      return {
        success: false,
        message: 'Action not found',
        effects: [],
        energyUsed: 0
      };
    }

    // Apply effects
    const effects = this.applyActionEffects(action, context);

    // Generate narrative text
    const narrativeText = this.generateNarrativeText(action, context);

    // Start cooldown
    if (action.cooldown && action.cooldown > 0) {
      this.startCooldown(actionId, action.cooldown);
    }

    // Update action state
    const state = this.activeActionStates.get(actionId) || {
      actionId,
      lastUsed: 0,
      cooldownRemaining: 0,
      timesUsed: 0
    };
    state.lastUsed = context.timestamp;
    state.timesUsed += 1;
    this.activeActionStates.set(actionId, state);

    return {
      success: true,
      message: `${action.name} performed successfully`,
      effects,
      energyUsed: action.energyCost || 0,
      narrativeText
    };
  }

  /**
   * Apply action effects to game state
   */
  private applyActionEffects(action: Action, context: ActionContext): ActionEffect[] {
    const effects: ActionEffect[] = [];

    // Process each effect from action definition
    for (const effect of action.effects) {
      // Effect structure from schema:
      // { category: 'relationship', first: 'initiator', second: 'responder', type: 'friendship', value: 10 }
      
      if (effect.category === 'relationship') {
        effects.push({
          type: 'relationship',
          target: context.target || '',
          value: effect.value,
          description: `${effect.type} changed by ${effect.value}`
        });
      } else if (effect.category === 'attribute') {
        effects.push({
          type: 'attribute',
          target: effect.first === 'initiator' ? context.actor : context.target || '',
          value: effect.value,
          description: `${effect.type} ${effect.operator || ''} ${effect.value}`
        });
      } else if (effect.category === 'status') {
        effects.push({
          type: 'status',
          target: context.actor,
          value: effect.value,
          description: effect.type
        });
      }
    }

    return effects;
  }

  /**
   * Generate narrative text from action
   */
  private generateNarrativeText(action: Action, context: ActionContext): string {
    if (action.narrativeTemplates && action.narrativeTemplates.length > 0) {
      // Pick random template
      const template = action.narrativeTemplates[Math.floor(Math.random() * action.narrativeTemplates.length)];
      // Simple substitution (could be enhanced with Tracery)
      return template
        .replace('{actor}', 'You')
        .replace('{target}', context.target || 'someone');
    }

    // Fallback
    return `You ${action.verbPast || action.name.toLowerCase()}.`;
  }

  /**
   * Start action cooldown
   */
  private startCooldown(actionId: string, cooldownSeconds: number): void {
    const state = this.activeActionStates.get(actionId) || {
      actionId,
      lastUsed: Date.now(),
      cooldownRemaining: 0,
      timesUsed: 0
    };
    state.cooldownRemaining = cooldownSeconds;
    this.activeActionStates.set(actionId, state);
  }

  /**
   * Update cooldowns (call each frame/tick)
   */
  updateCooldowns(deltaTimeSeconds: number): void {
    // Convert Map entries to array for iteration
    Array.from(this.activeActionStates.entries()).forEach(([actionId, state]) => {
      if (state.cooldownRemaining > 0) {
        state.cooldownRemaining = Math.max(0, state.cooldownRemaining - deltaTimeSeconds);
        this.activeActionStates.set(actionId, state);
      }
    });
  }

  /**
   * Get UI configuration for action category
   */
  getUIConfig(category: string) {
    return ACTION_UI_CONFIGS[category];
  }

  /**
   * Get cooldown for specific action
   */
  getCooldown(actionId: string): number {
    const state = this.activeActionStates.get(actionId);
    return state?.cooldownRemaining || 0;
  }

  /**
   * Format action for display in UI
   */
  formatActionForUI(action: Action): {
    id: string;
    name: string;
    description: string;
    icon: string;
    energyCost: number;
    cooldown: number;
    canUse: boolean;
  } {
    const uiConfig = this.getUIConfig(action.actionType);
    const cooldown = this.getCooldown(action.id);

    return {
      id: action.id,
      name: action.name,
      description: action.description || '',
      icon: uiConfig.icon,
      energyCost: action.energyCost || 0,
      cooldown,
      canUse: cooldown === 0
    };
  }
}
