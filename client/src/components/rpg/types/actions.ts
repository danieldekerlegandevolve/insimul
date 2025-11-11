// Action type definitions for RPG game

export interface Action {
  id: string;
  worldId: string | null;
  name: string;
  description: string | null;
  actionType: 'social' | 'mental' | 'combat' | 'movement' | 'economic';
  category: string | null;
  duration: number | null;
  difficulty: number | null;
  energyCost: number | null;
  prerequisites: any[];
  effects: any[];
  sideEffects: any[];
  targetType: string | null;
  requiresTarget: boolean | null;
  range: number | null;
  isAvailable: boolean | null;
  cooldown: number | null;
  triggerConditions: any[];
  verbPast: string | null;
  verbPresent: string | null;
  narrativeTemplates: string[];
  sourceFormat: string | null;
  customData: Record<string, any>;
  tags: string[];
  isBase?: boolean;
}

export interface ActionState {
  actionId: string;
  lastUsed: number;
  cooldownRemaining: number;
  timesUsed: number;
}

export interface ActionContext {
  actor: string; // character ID
  target?: string; // target character ID
  location?: string;
  timestamp: number;
  playerEnergy: number;
  playerPosition: { x: number; y: number };
}

export interface ActionResult {
  success: boolean;
  message: string;
  effects: ActionEffect[];
  energyUsed: number;
  narrativeText?: string;
}

export interface ActionEffect {
  type: 'relationship' | 'attribute' | 'status' | 'event' | 'item' | 'knowledge';
  target: string;
  value: any;
  description: string;
}

export interface ActionUIConfig {
  display: 'dialogue-choice' | 'radial-menu' | 'action-bar' | 'context-prompt' | 'trade-window';
  icon: string;
  position?: 'around-player' | 'bottom' | 'context';
  showCooldown?: boolean;
  showEnergyCost?: boolean;
  showRange?: boolean;
  showDamage?: boolean;
  showRelationshipImpact?: boolean;
  hotkey?: number | string;
  requiresTarget?: boolean;
  autoTrigger?: boolean;
}

// UI configuration for each action category
export const ACTION_UI_CONFIGS: Record<string, ActionUIConfig> = {
  social: {
    display: 'dialogue-choice',
    icon: '💬',
    showRelationshipImpact: true,
    requiresTarget: true
  },
  mental: {
    display: 'radial-menu',
    icon: '🧠',
    position: 'around-player',
    showCooldown: true,
    showEnergyCost: true
  },
  combat: {
    display: 'action-bar',
    icon: '⚔️',
    position: 'bottom',
    showCooldown: true,
    showRange: true,
    showDamage: true
  },
  movement: {
    display: 'context-prompt',
    icon: '👟',
    position: 'context',
    autoTrigger: false
  },
  economic: {
    display: 'trade-window',
    icon: '💰',
    requiresTarget: true
  }
};
