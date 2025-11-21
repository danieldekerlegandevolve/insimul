/**
 * Rule Enforcer
 *
 * Enforces world rules during gameplay, checking conditions and applying restrictions
 */

import { Scene, Vector3, Mesh } from '@babylonjs/core';

export interface Rule {
  id: string;
  name: string;
  description?: string;
  ruleType: 'trigger' | 'volition' | 'trait' | 'default' | 'pattern';
  category?: string;
  priority?: number;
  likelihood?: number;
  conditions?: RuleCondition[];
  effects?: RuleEffect[];
  isActive?: boolean;
  tags?: string[];
}

export interface RuleCondition {
  type: string;
  property?: string;
  operator?: string;
  value?: any;
  location?: string;
  zone?: string;
}

export interface RuleEffect {
  type: string;
  action?: string;
  value?: any;
  message?: string;
}

export interface RuleViolation {
  ruleId: string;
  ruleName: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
  message: string;
  location?: Vector3;
}

export interface GameContext {
  playerId?: string;
  playerPosition?: Vector3;
  playerEnergy?: number;
  targetNPCId?: string;
  targetNPCPosition?: Vector3;
  actionId?: string;
  actionType?: string;
  location?: string;
  settlementId?: string;
  inSettlement?: boolean;
  nearNPC?: boolean;
}

export class RuleEnforcer {
  private scene: Scene;
  private worldRules: Rule[] = [];
  private baseRules: Rule[] = [];
  private violations: RuleViolation[] = [];

  private onViolation: ((violation: RuleViolation) => void) | null = null;
  private onRestriction: ((message: string, rule: Rule) => void) | null = null;

  // Zone definitions
  private settlementZones: Map<string, { position: Vector3; radius: number }> = new Map();

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Update rules
   */
  public updateRules(worldRules: Rule[], baseRules: Rule[]): void {
    this.worldRules = worldRules;
    this.baseRules = baseRules;
  }

  /**
   * Register a settlement as a safe zone
   */
  public registerSettlementZone(settlementId: string, position: Vector3, radius: number): void {
    this.settlementZones.set(settlementId, { position, radius });
  }

  /**
   * Check if an action is allowed based on active rules
   */
  public canPerformAction(actionId: string, actionType: string, context: GameContext): {
    allowed: boolean;
    reason?: string;
    violatedRule?: Rule;
  } {
    const allRules = [...this.worldRules, ...this.baseRules];
    const activeRules = allRules.filter(r => r.isActive !== false);

    // Sort by priority (higher priority first)
    activeRules.sort((a, b) => (b.priority || 5) - (a.priority || 5));

    // Check each rule
    for (const rule of activeRules) {
      // Skip non-trigger and non-volition rules for action checking
      if (rule.ruleType !== 'trigger' && rule.ruleType !== 'volition') {
        continue;
      }

      // Check if rule applies to this action
      const applies = this.checkRuleConditions(rule, { ...context, actionId, actionType });

      if (applies) {
        // Check effects for restrictions
        const restriction = this.findRestriction(rule, actionType);

        if (restriction) {
          return {
            allowed: false,
            reason: restriction.message || `This action violates the rule: ${rule.name}`,
            violatedRule: rule
          };
        }
      }
    }

    return { allowed: true };
  }

  /**
   * Check if movement to a location is allowed
   */
  public canMoveTo(position: Vector3, context: GameContext): {
    allowed: boolean;
    reason?: string;
    violatedRule?: Rule;
  } {
    const allRules = [...this.worldRules, ...this.baseRules];
    const activeRules = allRules.filter(r => r.isActive !== false);

    for (const rule of activeRules) {
      // Check location-based rules
      if (this.hasLocationRestriction(rule)) {
        const applies = this.checkRuleConditions(rule, { ...context, playerPosition: position });

        if (applies) {
          const restriction = this.findRestriction(rule, 'movement');

          if (restriction) {
            return {
              allowed: false,
              reason: restriction.message || `Movement restricted by: ${rule.name}`,
              violatedRule: rule
            };
          }
        }
      }
    }

    return { allowed: true };
  }

  /**
   * Check if player is in a settlement
   */
  public isInSettlement(position: Vector3): { inSettlement: boolean; settlementId?: string } {
    for (const [settlementId, zone] of this.settlementZones.entries()) {
      const distance = Vector3.Distance(position, zone.position);
      if (distance <= zone.radius) {
        return { inSettlement: true, settlementId };
      }
    }
    return { inSettlement: false };
  }

  /**
   * Get rules that apply to current context
   */
  public getApplicableRules(context: GameContext): Rule[] {
    const allRules = [...this.worldRules, ...this.baseRules];
    const activeRules = allRules.filter(r => r.isActive !== false);

    return activeRules.filter(rule => this.checkRuleConditions(rule, context));
  }

  /**
   * Get rules by category
   */
  public getRulesByCategory(category: string): Rule[] {
    const allRules = [...this.worldRules, ...this.baseRules];
    return allRules.filter(r => r.isActive !== false && r.category === category);
  }

  /**
   * Check if rule conditions are met
   */
  private checkRuleConditions(rule: Rule, context: GameContext): boolean {
    if (!rule.conditions || rule.conditions.length === 0) {
      return true; // No conditions = always applies
    }

    // Check each condition
    for (const condition of rule.conditions) {
      if (!this.evaluateCondition(condition, context)) {
        return false; // Any failing condition = rule doesn't apply
      }
    }

    return true;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: RuleCondition, context: GameContext): boolean {
    switch (condition.type) {
      case 'location':
        return this.checkLocationCondition(condition, context);

      case 'zone':
        return this.checkZoneCondition(condition, context);

      case 'action':
        return this.checkActionCondition(condition, context);

      case 'energy':
        return this.checkEnergyCondition(condition, context);

      case 'proximity':
        return this.checkProximityCondition(condition, context);

      case 'tag':
        return this.checkTagCondition(condition, context);

      default:
        return true; // Unknown condition types pass by default
    }
  }

  /**
   * Check location-based condition
   */
  private checkLocationCondition(condition: RuleCondition, context: GameContext): boolean {
    if (condition.location === 'settlement') {
      return context.inSettlement || false;
    }
    if (condition.location === 'wilderness') {
      return !context.inSettlement;
    }
    return true;
  }

  /**
   * Check zone condition
   */
  private checkZoneCondition(condition: RuleCondition, context: GameContext): boolean {
    if (!context.playerPosition) return false;

    const settlementInfo = this.isInSettlement(context.playerPosition);

    if (condition.zone === 'safe' || condition.zone === 'settlement') {
      return settlementInfo.inSettlement;
    }
    if (condition.zone === 'combat' || condition.zone === 'wilderness') {
      return !settlementInfo.inSettlement;
    }

    return true;
  }

  /**
   * Check action-based condition
   */
  private checkActionCondition(condition: RuleCondition, context: GameContext): boolean {
    if (condition.action) {
      return context.actionType === condition.action || context.actionId === condition.action;
    }
    return true;
  }

  /**
   * Check energy condition
   */
  private checkEnergyCondition(condition: RuleCondition, context: GameContext): boolean {
    if (context.playerEnergy === undefined) return true;

    const operator = condition.operator || '>=';
    const value = condition.value || 0;

    switch (operator) {
      case '>':
        return context.playerEnergy > value;
      case '>=':
        return context.playerEnergy >= value;
      case '<':
        return context.playerEnergy < value;
      case '<=':
        return context.playerEnergy <= value;
      case '==':
        return context.playerEnergy === value;
      default:
        return true;
    }
  }

  /**
   * Check proximity condition
   */
  private checkProximityCondition(condition: RuleCondition, context: GameContext): boolean {
    return context.nearNPC || false;
  }

  /**
   * Check tag condition
   */
  private checkTagCondition(condition: RuleCondition, context: GameContext): boolean {
    // This would check if context has certain tags
    // For now, always return true
    return true;
  }

  /**
   * Find restriction effect in rule
   */
  private findRestriction(rule: Rule, actionType: string): RuleEffect | null {
    if (!rule.effects) return null;

    for (const effect of rule.effects) {
      if (effect.type === 'restrict' || effect.type === 'prevent' || effect.type === 'block') {
        // Check if restriction applies to this action type
        if (!effect.action || effect.action === actionType || effect.action === 'all') {
          return effect;
        }
      }
    }

    return null;
  }

  /**
   * Check if rule has location restriction
   */
  private hasLocationRestriction(rule: Rule): boolean {
    if (!rule.conditions) return false;

    return rule.conditions.some(c => c.type === 'location' || c.type === 'zone');
  }

  /**
   * Record a rule violation
   */
  public recordViolation(rule: Rule, context: GameContext, message: string): void {
    const violation: RuleViolation = {
      ruleId: rule.id,
      ruleName: rule.name,
      timestamp: new Date(),
      severity: this.getSeverity(rule),
      message,
      location: context.playerPosition
    };

    this.violations.push(violation);

    // Trigger callback
    if (this.onViolation) {
      this.onViolation(violation);
    }
  }

  /**
   * Get severity level for a rule
   */
  private getSeverity(rule: Rule): 'low' | 'medium' | 'high' {
    const priority = rule.priority || 5;

    if (priority >= 8) return 'high';
    if (priority >= 6) return 'medium';
    return 'low';
  }

  /**
   * Get recent violations
   */
  public getViolations(limit: number = 10): RuleViolation[] {
    return this.violations.slice(-limit);
  }

  /**
   * Clear violations
   */
  public clearViolations(): void {
    this.violations = [];
  }

  /**
   * Set callback for violations
   */
  public setOnViolation(callback: (violation: RuleViolation) => void): void {
    this.onViolation = callback;
  }

  /**
   * Set callback for restrictions
   */
  public setOnRestriction(callback: (message: string, rule: Rule) => void): void {
    this.onRestriction = callback;
  }

  /**
   * Dispose
   */
  public dispose(): void {
    this.worldRules = [];
    this.baseRules = [];
    this.violations = [];
    this.settlementZones.clear();
  }
}
