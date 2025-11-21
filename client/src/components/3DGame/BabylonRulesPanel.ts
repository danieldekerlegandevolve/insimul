/**
 * Babylon Rules Panel
 *
 * Displays active world rules, their conditions, effects, and enforcement status
 */

import { Scene } from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';

export interface Rule {
  id: string;
  name: string;
  description?: string;
  ruleType: 'trigger' | 'volition' | 'trait' | 'default' | 'pattern';
  category?: string;
  priority?: number;
  likelihood?: number;
  conditions?: any[];
  effects?: any[];
  isActive?: boolean;
  isBase?: boolean;
  tags?: string[];
}

export class BabylonRulesPanel {
  private scene: Scene;
  private advancedTexture: GUI.AdvancedDynamicTexture;
  private container: GUI.Rectangle | null = null;
  private rulesContainer: GUI.StackPanel | null = null;
  private isVisible: boolean = false;

  private worldRules: Rule[] = [];
  private baseRules: Rule[] = [];
  private onClose: (() => void) | null = null;

  constructor(scene: Scene, advancedTexture: GUI.AdvancedDynamicTexture) {
    this.scene = scene;
    this.advancedTexture = advancedTexture;

    this.createRulesPanel();
  }

  /**
   * Create the rules panel UI
   */
  private createRulesPanel(): void {
    // Main container
    this.container = new GUI.Rectangle('rulesPanelContainer');
    this.container.width = '500px';
    this.container.height = '600px';
    this.container.cornerRadius = 10;
    this.container.color = 'white';
    this.container.thickness = 2;
    this.container.background = 'rgba(0, 0, 0, 0.9)';
    this.advancedTexture.addControl(this.container);

    // Center on screen
    this.container.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.container.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;

    // Title bar
    const titleBar = new GUI.Rectangle('rulesTitleBar');
    titleBar.width = '500px';
    titleBar.height = '60px';
    titleBar.cornerRadius = 10;
    titleBar.background = 'rgba(60, 40, 80, 1)';
    titleBar.thickness = 0;
    titleBar.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    this.container.addControl(titleBar);

    // Title text
    const titleText = new GUI.TextBlock('rulesTitle');
    titleText.text = '⚖️ World Rules';
    titleText.fontSize = 22;
    titleText.fontWeight = 'bold';
    titleText.color = 'white';
    titleText.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    titleText.top = '20px';
    this.container.addControl(titleText);

    // Close button
    const closeButton = GUI.Button.CreateSimpleButton('rulesClose', 'X');
    closeButton.width = '40px';
    closeButton.height = '40px';
    closeButton.color = 'white';
    closeButton.background = 'rgba(200, 50, 50, 0.8)';
    closeButton.cornerRadius = 5;
    closeButton.fontSize = 18;
    closeButton.fontWeight = 'bold';
    closeButton.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    closeButton.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    closeButton.top = '10px';
    closeButton.left = '-10px';
    closeButton.onPointerUpObservable.add(() => {
      this.hide();
      if (this.onClose) this.onClose();
    });
    this.container.addControl(closeButton);

    // Subtitle
    const subtitle = new GUI.TextBlock('rulesSubtitle');
    subtitle.text = 'Active rules governing this world';
    subtitle.fontSize = 13;
    subtitle.color = 'rgba(200, 200, 200, 0.9)';
    subtitle.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    subtitle.top = '45px';
    this.container.addControl(subtitle);

    // Rules scroll view
    const scrollViewer = new GUI.ScrollViewer('rulesScroll');
    scrollViewer.width = '480px';
    scrollViewer.height = '520px';
    scrollViewer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    scrollViewer.top = '70px';
    scrollViewer.thickness = 0;
    scrollViewer.barColor = 'rgba(150, 100, 200, 0.8)';
    scrollViewer.barBackground = 'rgba(50, 50, 50, 0.5)';
    this.container.addControl(scrollViewer);

    // Rules container (stack panel inside scroll viewer)
    this.rulesContainer = new GUI.StackPanel('rulesItems');
    this.rulesContainer.width = '460px';
    this.rulesContainer.spacing = 8;
    scrollViewer.addControl(this.rulesContainer);

    // Initially hidden
    this.container.isVisible = false;
  }

  /**
   * Show the rules panel
   */
  public show(): void {
    if (this.container) {
      this.container.isVisible = true;
      this.isVisible = true;
      this.refreshRulesList();
    }
  }

  /**
   * Hide the rules panel
   */
  public hide(): void {
    if (this.container) {
      this.container.isVisible = false;
      this.isVisible = false;
    }
  }

  /**
   * Toggle panel visibility
   */
  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Update rules data
   */
  public updateRules(worldRules: Rule[], baseRules: Rule[]): void {
    this.worldRules = worldRules;
    this.baseRules = baseRules;

    if (this.isVisible) {
      this.refreshRulesList();
    }
  }

  /**
   * Refresh the rules list display
   */
  private refreshRulesList(): void {
    if (!this.rulesContainer) return;

    // Clear existing items
    this.rulesContainer.clearControls();

    // Combine and sort rules by priority (higher priority first)
    const allRules = [...this.worldRules, ...this.baseRules];
    const activeRules = allRules.filter(r => r.isActive !== false);
    activeRules.sort((a, b) => (b.priority || 5) - (a.priority || 5));

    if (activeRules.length === 0) {
      // Show empty message
      const emptyText = new GUI.TextBlock('emptyRules');
      emptyText.text = 'No active rules in this world';
      emptyText.height = '40px';
      emptyText.fontSize = 14;
      emptyText.color = '#888888';
      emptyText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
      this.rulesContainer.addControl(emptyText);
      return;
    }

    // Add each rule
    for (const rule of activeRules) {
      const ruleCard = this.createRuleCard(rule);
      this.rulesContainer.addControl(ruleCard);
    }
  }

  /**
   * Create a rule card
   */
  private createRuleCard(rule: Rule): GUI.Rectangle {
    const card = new GUI.Rectangle(`rule_${rule.id}`);
    card.width = '450px';
    card.height = '140px';
    card.cornerRadius = 5;
    card.color = this.getRuleTypeColor(rule.ruleType);
    card.thickness = 2;
    card.background = 'rgba(30, 30, 40, 0.9)';

    // Rule name
    const nameText = new GUI.TextBlock(`rule_name_${rule.id}`);
    nameText.text = rule.name;
    nameText.fontSize = 16;
    nameText.fontWeight = 'bold';
    nameText.color = this.getRuleTypeColor(rule.ruleType);
    nameText.height = '20px';
    nameText.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    nameText.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    nameText.top = '10px';
    nameText.left = '15px';
    nameText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    card.addControl(nameText);

    // Rule type badge
    const typeBadge = new GUI.Rectangle(`rule_type_${rule.id}`);
    typeBadge.width = '80px';
    typeBadge.height = '22px';
    typeBadge.cornerRadius = 11;
    typeBadge.background = this.getRuleTypeColor(rule.ruleType);
    typeBadge.color = 'transparent';
    typeBadge.thickness = 0;
    typeBadge.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    typeBadge.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    typeBadge.top = '8px';
    typeBadge.left = '-10px';
    card.addControl(typeBadge);

    const typeText = new GUI.TextBlock(`rule_type_text_${rule.id}`);
    typeText.text = rule.ruleType.toUpperCase();
    typeText.fontSize = 11;
    typeText.fontWeight = 'bold';
    typeText.color = 'rgba(0, 0, 0, 0.9)';
    typeBadge.addControl(typeText);

    // Priority indicator
    if (rule.priority !== undefined && rule.priority !== 5) {
      const priorityBadge = new GUI.Rectangle(`rule_priority_${rule.id}`);
      priorityBadge.width = '60px';
      priorityBadge.height = '20px';
      priorityBadge.cornerRadius = 10;
      priorityBadge.background = rule.priority > 5 ? 'rgba(255, 100, 100, 0.8)' : 'rgba(100, 150, 255, 0.8)';
      priorityBadge.color = 'white';
      priorityBadge.thickness = 1;
      priorityBadge.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
      priorityBadge.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
      priorityBadge.top = '35px';
      priorityBadge.left = '-10px';
      card.addControl(priorityBadge);

      const priorityText = new GUI.TextBlock(`rule_priority_text_${rule.id}`);
      priorityText.text = `P${rule.priority}`;
      priorityText.fontSize = 11;
      priorityText.fontWeight = 'bold';
      priorityText.color = 'white';
      priorityBadge.addControl(priorityText);
    }

    // Base rule indicator
    if (rule.isBase) {
      const baseIndicator = new GUI.TextBlock(`rule_base_${rule.id}`);
      baseIndicator.text = '🌐';
      baseIndicator.fontSize = 16;
      baseIndicator.height = '20px';
      baseIndicator.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
      baseIndicator.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
      baseIndicator.top = '10px';
      baseIndicator.left = '-100px';
      card.addControl(baseIndicator);
    }

    // Description
    if (rule.description) {
      const descText = new GUI.TextBlock(`rule_desc_${rule.id}`);
      descText.text = rule.description;
      descText.fontSize = 12;
      descText.color = '#CCCCCC';
      descText.height = '55px';
      descText.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
      descText.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      descText.top = '38px';
      descText.left = '15px';
      descText.paddingRight = '15px';
      descText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      descText.textWrapping = true;
      card.addControl(descText);
    }

    // Category and tags
    let tagString = '';
    if (rule.category) {
      tagString += `📂 ${rule.category}`;
    }
    if (rule.tags && rule.tags.length > 0) {
      const firstTags = rule.tags.slice(0, 3).join(', ');
      tagString += (tagString ? ' • ' : '') + `🏷️ ${firstTags}`;
    }

    if (tagString) {
      const tagsText = new GUI.TextBlock(`rule_tags_${rule.id}`);
      tagsText.text = tagString;
      tagsText.fontSize = 10;
      tagsText.color = '#999999';
      tagsText.height = '20px';
      tagsText.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
      tagsText.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      tagsText.top = '-10px';
      tagsText.left = '15px';
      tagsText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      card.addControl(tagsText);
    }

    // Conditions/Effects summary
    const condCount = rule.conditions?.length || 0;
    const effCount = rule.effects?.length || 0;
    if (condCount > 0 || effCount > 0) {
      const summaryText = new GUI.TextBlock(`rule_summary_${rule.id}`);
      summaryText.text = `${condCount} condition${condCount !== 1 ? 's' : ''} → ${effCount} effect${effCount !== 1 ? 's' : ''}`;
      summaryText.fontSize = 10;
      summaryText.color = '#AAAAAA';
      summaryText.height = '20px';
      summaryText.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
      summaryText.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
      summaryText.top = '-10px';
      summaryText.left = '-15px';
      summaryText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
      card.addControl(summaryText);
    }

    return card;
  }

  /**
   * Get color for rule type
   */
  private getRuleTypeColor(ruleType: string): string {
    switch (ruleType) {
      case 'trigger':
        return '#FF6B6B'; // Red for triggers
      case 'volition':
        return '#4ECDC4'; // Teal for volitions
      case 'trait':
        return '#FFE66D'; // Yellow for traits
      case 'default':
        return '#95E1D3'; // Mint for defaults
      case 'pattern':
        return '#C7A4FF'; // Purple for patterns
      default:
        return 'white';
    }
  }

  /**
   * Set callback for close
   */
  public setOnClose(callback: () => void): void {
    this.onClose = callback;
  }

  /**
   * Get active rules by category
   */
  public getRulesByCategory(category: string): Rule[] {
    const allRules = [...this.worldRules, ...this.baseRules];
    return allRules.filter(r => r.isActive !== false && r.category === category);
  }

  /**
   * Get active rules by type
   */
  public getRulesByType(ruleType: string): Rule[] {
    const allRules = [...this.worldRules, ...this.baseRules];
    return allRules.filter(r => r.isActive !== false && r.ruleType === ruleType);
  }

  /**
   * Check if a specific rule is active
   */
  public isRuleActive(ruleId: string): boolean {
    const allRules = [...this.worldRules, ...this.baseRules];
    const rule = allRules.find(r => r.id === ruleId);
    return rule ? rule.isActive !== false : false;
  }

  /**
   * Dispose the panel
   */
  public dispose(): void {
    if (this.container) {
      this.advancedTexture.removeControl(this.container);
      this.container.dispose();
      this.container = null;
    }

    this.rulesContainer = null;
    this.worldRules = [];
    this.baseRules = [];
  }
}
