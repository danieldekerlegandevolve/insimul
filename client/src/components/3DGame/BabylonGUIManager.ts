import {
  AdvancedDynamicTexture,
  Button,
  Container,
  Control,
  Ellipse,
  Rectangle,
  ScrollViewer,
  StackPanel,
  TextBlock,
  Image
} from "@babylonjs/gui";
import { Scene } from "babylonjs";
import type { Action } from "@/components/rpg/types/actions";

export interface GUIConfig {
  worldName: string;
  worldId: string;
}

export interface WorldStats {
  countries: number;
  settlements: number;
  characters: number;
  rules: number;
  baseRules: number;
  actions: number;
  baseActions: number;
  quests: number;
}

export interface PlayerStatus {
  energy: number;
  maxEnergy: number;
  status: string;
  gold?: number; // Player's currency
}

export interface NPCInfo {
  id: string;
  name: string;
  occupation?: string;
  disposition?: string;
  questGiver: boolean;
}

export interface ActionFeedbackData {
  actionName: string;
  targetName: string;
  narrativeText: string;
  success: boolean;
  timestamp: number;
}

export interface MinimapData {
  settlements: Array<{
    id: string;
    name: string;
    position: { x: number; z: number };
    type: string; // city, town, village
    zoneType: string; // safe, neutral, caution
  }>;
  playerPosition: { x: number; z: number };
  worldSize: number; // Terrain size for scaling
}

export interface ReputationData {
  settlementName: string;
  score: number; // -100 to 100
  standing: string; // hostile, unfriendly, neutral, friendly, revered
  isBanned: boolean;
  violationCount: number;
  outstandingFines: number;
}

export class BabylonGUIManager {
  public advancedTexture: AdvancedDynamicTexture;
  private scene: Scene;
  private config: GUIConfig;

  // UI Elements
  private hudContainer: Container | null = null;
  private worldStatsPanel: Container | null = null;
  private playerStatsPanel: Container | null = null;
  private actionPanel: Container | null = null;
  private npcListPanel: Container | null = null;
  private feedbackPanel: Container | null = null;
  private menuButton: Button | null = null;
  private menuPanel: Container | null = null;
  private minimapPanel: Container | null = null;
  private reputationPanel: Container | null = null;

  // State
  private isMenuOpen = false;
  private selectedNPCId: string | null = null;

  // Callbacks
  private onActionSelected: ((actionId: string) => void) | null = null;
  private onNPCSelected: ((npcId: string) => void) | null = null;
  private onBackPressed: (() => void) | null = null;
  private onFullscreenPressed: (() => void) | null = null;
  private onDebugPressed: (() => void) | null = null;
  private onPayFines: (() => void) | null = null;

  constructor(scene: Scene, config: GUIConfig) {
    this.scene = scene;
    this.config = config;
    this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
    this.initialize();
  }

  private initialize() {
    this.createHUD();
    this.createMenuButton();
  }

  private createHUD() {
    // Main HUD container
    this.hudContainer = new Container("hud");
    this.advancedTexture.addControl(this.hudContainer);

    // Create all HUD panels
    this.createPlayerStatsPanel();
    this.createWorldStatsPanel();
    this.createNPCListPanel();
    this.createActionPanel();
    this.createFeedbackPanel();
    this.createMinimapPanel();
    this.createReputationPanel();
  }

  private createMenuButton() {
    this.menuButton = Button.CreateSimpleButton("menuBtn", "☰ Menu");
    this.menuButton.width = "100px";
    this.menuButton.height = "40px";
    this.menuButton.color = "white";
    this.menuButton.background = "rgba(0, 0, 0, 0.6)";
    this.menuButton.cornerRadius = 5;
    this.menuButton.top = "10px";
    this.menuButton.left = "-10px";
    this.menuButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.menuButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.menuButton.fontSize = 16;

    this.menuButton.onPointerClickObservable.add(() => {
      this.toggleMenu();
    });

    this.advancedTexture.addControl(this.menuButton);
  }

  private toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;

    if (this.isMenuOpen) {
      this.showMenu();
    } else {
      this.hideMenu();
    }
  }

  private showMenu() {
    if (this.menuPanel) {
      this.menuPanel.isVisible = true;
      return;
    }

    // Create menu panel
    this.menuPanel = new Rectangle("menuPanel");
    this.menuPanel.width = "400px";
    this.menuPanel.height = "500px";
    this.menuPanel.background = "rgba(0, 0, 0, 0.9)";
    this.menuPanel.color = "white";
    this.menuPanel.thickness = 2;
    this.menuPanel.cornerRadius = 10;
    this.menuPanel.top = "60px";
    this.menuPanel.left = "-10px";
    this.menuPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.menuPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

    const menuStack = new StackPanel();
    menuStack.width = "100%";
    menuStack.paddingTop = "20px";
    menuStack.paddingBottom = "20px";
    this.menuPanel.addControl(menuStack);

    // Title
    const title = new TextBlock();
    title.text = this.config.worldName;
    title.color = "white";
    title.fontSize = 24;
    title.height = "40px";
    title.fontWeight = "bold";
    menuStack.addControl(title);

    // World ID
    const worldId = new TextBlock();
    worldId.text = `World ID: ${this.config.worldId}`;
    worldId.color = "#888";
    worldId.fontSize = 14;
    worldId.height = "30px";
    menuStack.addControl(worldId);

    // Buttons
    const buttonsData = [
      { text: "🖥️ Fullscreen", callback: () => this.onFullscreenPressed?.() },
      { text: "🔧 Toggle Debug", callback: () => this.onDebugPressed?.() },
      { text: "⬅️ Back to Menu", callback: () => this.onBackPressed?.() }
    ];

    buttonsData.forEach((data) => {
      const btn = Button.CreateSimpleButton("menuBtn", data.text);
      btn.width = "90%";
      btn.height = "50px";
      btn.color = "white";
      btn.background = "rgba(60, 60, 60, 0.8)";
      btn.cornerRadius = 5;
      btn.fontSize = 16;
      btn.paddingTop = "10px";
      btn.paddingBottom = "10px";
      btn.onPointerClickObservable.add(() => {
        data.callback();
        this.toggleMenu();
      });
      menuStack.addControl(btn);
    });

    this.advancedTexture.addControl(this.menuPanel);
  }

  private hideMenu() {
    if (this.menuPanel) {
      this.menuPanel.isVisible = false;
    }
  }

  private createPlayerStatsPanel() {
    const panel = new Rectangle("playerStats");
    panel.width = "200px";
    panel.height = "125px"; // Increased height for gold display
    panel.background = "rgba(0, 0, 0, 0.7)";
    panel.color = "white";
    panel.thickness = 2;
    panel.cornerRadius = 5;
    panel.top = "60px";
    panel.left = "10px";
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

    const stack = new StackPanel();
    stack.paddingTop = "10px";
    panel.addControl(stack);

    // Title
    const title = new TextBlock();
    title.text = "Player Status";
    title.color = "white";
    title.fontSize = 16;
    title.height = "25px";
    title.fontWeight = "bold";
    stack.addControl(title);

    // Status text
    const statusText = new TextBlock("playerStatusText");
    statusText.text = "Ready";
    statusText.color = "#4CAF50";
    statusText.fontSize = 14;
    statusText.height = "20px";
    stack.addControl(statusText);

    // Energy bar background
    const energyBg = new Rectangle("energyBg");
    energyBg.width = "180px";
    energyBg.height = "20px";
    energyBg.background = "rgba(60, 60, 60, 0.8)";
    energyBg.color = "#444";
    energyBg.thickness = 1;
    energyBg.cornerRadius = 3;
    stack.addControl(energyBg);

    // Energy bar fill
    const energyFill = new Rectangle("energyFill");
    energyFill.width = "180px";
    energyFill.height = "20px";
    energyFill.background = "#4CAF50";
    energyFill.cornerRadius = 3;
    energyFill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    energyBg.addControl(energyFill);

    // Energy text
    const energyText = new TextBlock("energyText");
    energyText.text = "100 / 100";
    energyText.color = "white";
    energyText.fontSize = 12;
    energyBg.addControl(energyText);

    // Gold display
    const goldText = new TextBlock("playerGoldText");
    goldText.text = "Gold: 100";
    goldText.color = "#FFD700"; // Gold color
    goldText.fontSize = 14;
    goldText.height = "20px";
    goldText.fontWeight = "bold";
    goldText.paddingTop = "5px";
    stack.addControl(goldText);

    this.playerStatsPanel = panel;
    this.advancedTexture.addControl(panel);
  }

  private createWorldStatsPanel() {
    const panel = new Rectangle("worldStats");
    panel.width = "250px";
    panel.height = "220px";
    panel.background = "rgba(0, 0, 0, 0.7)";
    panel.color = "white";
    panel.thickness = 2;
    panel.cornerRadius = 5;
    panel.top = "170px";
    panel.left = "10px";
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

    const stack = new StackPanel();
    stack.paddingTop = "10px";
    stack.paddingLeft = "10px";
    stack.paddingRight = "10px";
    panel.addControl(stack);

    // Title
    const title = new TextBlock();
    title.text = "World Data";
    title.color = "white";
    title.fontSize = 16;
    title.height = "25px";
    title.fontWeight = "bold";
    stack.addControl(title);

    // Stats container (will be populated dynamically)
    const statsContainer = new StackPanel("worldStatsContainer");
    statsContainer.width = "100%";
    stack.addControl(statsContainer);

    this.worldStatsPanel = panel;
    this.advancedTexture.addControl(panel);
  }

  private createNPCListPanel() {
    const panel = new Rectangle("npcList");
    panel.width = "300px";
    panel.height = "200px";
    panel.background = "rgba(0, 0, 0, 0.7)";
    panel.color = "white";
    panel.thickness = 2;
    panel.cornerRadius = 5;
    panel.top = "-10px";
    panel.right = "-10px";
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;

    const stack = new StackPanel();
    stack.paddingTop = "10px";
    panel.addControl(stack);

    // Title
    const title = new TextBlock();
    title.text = "NPCs Nearby";
    title.color = "white";
    title.fontSize = 16;
    title.height = "25px";
    title.fontWeight = "bold";
    stack.addControl(title);

    // NPC list container
    const scrollViewer = new ScrollViewer("npcScrollViewer");
    scrollViewer.width = "100%";
    scrollViewer.height = "160px";
    scrollViewer.paddingTop = "5px";
    scrollViewer.paddingBottom = "5px";
    stack.addControl(scrollViewer);

    const npcContainer = new StackPanel("npcContainer");
    npcContainer.width = "100%";
    scrollViewer.addControl(npcContainer);

    this.npcListPanel = panel;
    this.advancedTexture.addControl(panel);
  }

  private createActionPanel() {
    const panel = new Rectangle("actionPanel");
    panel.width = "350px";
    panel.height = "250px";
    panel.background = "rgba(0, 0, 0, 0.8)";
    panel.color = "white";
    panel.thickness = 2;
    panel.cornerRadius = 5;
    panel.top = "-220px";
    panel.right = "-10px";
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    panel.isVisible = false;

    const stack = new StackPanel();
    stack.paddingTop = "10px";
    panel.addControl(stack);

    // Title
    const title = new TextBlock("actionPanelTitle");
    title.text = "Actions";
    title.color = "white";
    title.fontSize = 16;
    title.height = "25px";
    title.fontWeight = "bold";
    stack.addControl(title);

    // Action list container
    const scrollViewer = new ScrollViewer("actionScrollViewer");
    scrollViewer.width = "100%";
    scrollViewer.height = "210px";
    scrollViewer.paddingTop = "5px";
    scrollViewer.paddingBottom = "5px";
    stack.addControl(scrollViewer);

    const actionContainer = new StackPanel("actionContainer");
    actionContainer.width = "100%";
    scrollViewer.addControl(actionContainer);

    this.actionPanel = panel;
    this.advancedTexture.addControl(panel);
  }

  private createFeedbackPanel() {
    const panel = new Rectangle("feedbackPanel");
    panel.width = "400px";
    panel.height = "120px";
    panel.background = "rgba(0, 0, 0, 0.9)";
    panel.color = "#4CAF50";
    panel.thickness = 2;
    panel.cornerRadius = 5;
    panel.top = "10px";
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    panel.isVisible = false;

    const stack = new StackPanel();
    stack.paddingTop = "10px";
    stack.paddingLeft = "15px";
    stack.paddingRight = "15px";
    panel.addControl(stack);

    // Title
    const title = new TextBlock("feedbackTitle");
    title.text = "Action Result";
    title.color = "white";
    title.fontSize = 16;
    title.height = "25px";
    title.fontWeight = "bold";
    title.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    stack.addControl(title);

    // Message
    const message = new TextBlock("feedbackMessage");
    message.text = "";
    message.color = "white";
    message.fontSize = 14;
    message.height = "80px";
    message.textWrapping = true;
    message.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    message.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    stack.addControl(message);

    this.feedbackPanel = panel;
    this.advancedTexture.addControl(panel);
  }

  private createMinimapPanel() {
    const panel = new Rectangle("minimapPanel");
    panel.width = "200px";
    panel.height = "200px";
    panel.background = "rgba(0, 0, 0, 0.7)";
    panel.color = "white";
    panel.thickness = 2;
    panel.cornerRadius = 5;
    panel.top = "10px";
    panel.right = "10px";
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

    // Title
    const title = new TextBlock();
    title.text = "Minimap";
    title.color = "white";
    title.fontSize = 14;
    title.height = "20px";
    title.fontWeight = "bold";
    title.top = "-85px";
    title.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    panel.addControl(title);

    // Minimap background (world view)
    const mapBackground = new Rectangle("minimapBackground");
    mapBackground.width = "180px";
    mapBackground.height = "160px";
    mapBackground.background = "rgba(30, 30, 30, 0.9)";
    mapBackground.cornerRadius = 3;
    mapBackground.top = "5px";
    mapBackground.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    panel.addControl(mapBackground);

    // Container for map elements (settlements, zones, player)
    const mapContainer = new Container("minimapContainer");
    mapContainer.width = "180px";
    mapContainer.height = "160px";
    mapContainer.top = "5px";
    mapContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    panel.addControl(mapContainer);

    // Legend
    const legend = new TextBlock();
    legend.text = "Green: Safe | Blue: Neutral | Amber: Caution";
    legend.color = "#888";
    legend.fontSize = 9;
    legend.height = "15px";
    legend.top = "85px";
    legend.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    panel.addControl(legend);

    this.minimapPanel = panel;
    this.advancedTexture.addControl(panel);
  }

  private createReputationPanel() {
    const panel = new Rectangle("reputationPanel");
    panel.width = "220px";
    panel.height = "160px"; // Increased height for fine payment button
    panel.background = "rgba(0, 0, 0, 0.75)";
    panel.color = "white";
    panel.thickness = 2;
    panel.cornerRadius = 5;
    panel.top = "-10px";
    panel.left = "10px";
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    panel.isVisible = false; // Hidden by default, shown when in a zone

    const stack = new StackPanel();
    stack.paddingTop = "10px";
    stack.paddingLeft = "10px";
    stack.paddingRight = "10px";
    panel.addControl(stack);

    // Title
    const title = new TextBlock("reputationTitle");
    title.text = "Reputation";
    title.color = "white";
    title.fontSize = 14;
    title.height = "20px";
    title.fontWeight = "bold";
    title.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    stack.addControl(title);

    // Settlement name
    const settlementName = new TextBlock("reputationSettlement");
    settlementName.text = "Unknown";
    settlementName.color = "#AAA";
    settlementName.fontSize = 12;
    settlementName.height = "18px";
    settlementName.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    stack.addControl(settlementName);

    // Standing text
    const standing = new TextBlock("reputationStanding");
    standing.text = "Neutral";
    standing.color = "#FFC107";
    standing.fontSize = 14;
    standing.height = "20px";
    standing.fontWeight = "bold";
    standing.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    stack.addControl(standing);

    // Reputation bar background
    const repBarBg = new Rectangle("reputationBarBg");
    repBarBg.width = "200px";
    repBarBg.height = "16px";
    repBarBg.background = "rgba(60, 60, 60, 0.9)";
    repBarBg.color = "#444";
    repBarBg.thickness = 1;
    repBarBg.cornerRadius = 3;
    stack.addControl(repBarBg);

    // Reputation bar fill
    const repBarFill = new Rectangle("reputationBarFill");
    repBarFill.width = "100px"; // Will be updated based on score
    repBarFill.height = "16px";
    repBarFill.background = "#FFC107"; // Yellow for neutral
    repBarFill.cornerRadius = 3;
    repBarFill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    repBarBg.addControl(repBarFill);

    // Score text overlay
    const scoreText = new TextBlock("reputationScore");
    scoreText.text = "0 / 100";
    scoreText.color = "white";
    scoreText.fontSize = 11;
    repBarBg.addControl(scoreText);

    // Warning/Ban indicator
    const warningText = new TextBlock("reputationWarning");
    warningText.text = "";
    warningText.color = "#F44336";
    warningText.fontSize = 11;
    warningText.height = "16px";
    warningText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    stack.addControl(warningText);

    // Pay Fines button
    const payFinesBtn = Button.CreateSimpleButton("payFinesBtn", "Pay Fines (50g)");
    payFinesBtn.width = "200px";
    payFinesBtn.height = "28px";
    payFinesBtn.color = "white";
    payFinesBtn.background = "rgba(76, 175, 80, 0.8)"; // Green
    payFinesBtn.cornerRadius = 5;
    payFinesBtn.fontSize = 12;
    payFinesBtn.fontWeight = "bold";
    payFinesBtn.paddingTop = "4px";
    payFinesBtn.isVisible = false; // Hidden until there are fines
    payFinesBtn.onPointerClickObservable.add(() => {
      if (this.onPayFines) {
        this.onPayFines();
      }
    });
    stack.addControl(payFinesBtn);

    this.reputationPanel = panel;
    this.advancedTexture.addControl(panel);
  }

  // Public methods for updating UI

  public updatePlayerStatus(status: PlayerStatus) {
    if (!this.playerStatsPanel) return;

    const statusText = this.playerStatsPanel.getDescendants().find(
      (c) => c.name === "playerStatusText"
    ) as TextBlock;
    if (statusText) {
      statusText.text = status.status;
    }

    const energyText = this.playerStatsPanel.getDescendants().find(
      (c) => c.name === "energyText"
    ) as TextBlock;
    if (energyText) {
      energyText.text = `${status.energy} / ${status.maxEnergy}`;
    }

    const energyFill = this.playerStatsPanel.getDescendants().find(
      (c) => c.name === "energyFill"
    ) as Rectangle;
    if (energyFill) {
      const percentage = status.energy / status.maxEnergy;
      energyFill.width = `${180 * percentage}px`;

      // Change color based on energy level
      if (percentage > 0.5) {
        energyFill.background = "#4CAF50"; // Green
      } else if (percentage > 0.25) {
        energyFill.background = "#FFC107"; // Yellow
      } else {
        energyFill.background = "#F44336"; // Red
      }
    }

    // Update gold display
    if (status.gold !== undefined) {
      const goldText = this.playerStatsPanel.getDescendants().find(
        (c) => c.name === "playerGoldText"
      ) as TextBlock;
      if (goldText) {
        goldText.text = `Gold: ${status.gold}`;
      }
    }
  }

  public updateWorldStats(stats: WorldStats) {
    if (!this.worldStatsPanel) return;

    const container = this.worldStatsPanel.getDescendants().find(
      (c) => c.name === "worldStatsContainer"
    ) as StackPanel;
    if (!container) return;

    // Clear existing stats
    container.clearControls();

    const statsData = [
      { label: "Countries", value: stats.countries },
      { label: "Settlements", value: stats.settlements },
      { label: "Characters", value: stats.characters },
      { label: "Rules", value: `${stats.rules + stats.baseRules}` },
      { label: "Actions", value: `${stats.actions + stats.baseActions}` },
      { label: "Quests", value: stats.quests }
    ];

    statsData.forEach((stat) => {
      const statText = new TextBlock();
      statText.text = `${stat.label}: ${stat.value}`;
      statText.color = "white";
      statText.fontSize = 13;
      statText.height = "22px";
      statText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      statText.paddingLeft = "5px";
      container.addControl(statText);
    });
  }

  public updateNPCList(npcs: NPCInfo[]) {
    if (!this.npcListPanel) return;

    const container = this.npcListPanel.getDescendants().find(
      (c) => c.name === "npcContainer"
    ) as StackPanel;
    if (!container) return;

    // Clear existing NPCs
    container.clearControls();

    if (npcs.length === 0) {
      const emptyText = new TextBlock();
      emptyText.text = "No NPCs nearby";
      emptyText.color = "#888";
      emptyText.fontSize = 14;
      emptyText.height = "30px";
      container.addControl(emptyText);
      return;
    }

    npcs.forEach((npc) => {
      const btn = Button.CreateSimpleButton(`npc-${npc.id}`, npc.name);
      btn.width = "95%";
      btn.height = "35px";
      btn.fontSize = 14;
      btn.paddingTop = "5px";
      btn.paddingBottom = "5px";

      if (npc.id === this.selectedNPCId) {
        btn.background = "rgba(76, 175, 80, 0.8)";
        btn.color = "white";
      } else if (npc.questGiver) {
        btn.background = "rgba(255, 193, 7, 0.6)";
        btn.color = "white";
      } else {
        btn.background = "rgba(60, 60, 60, 0.6)";
        btn.color = "white";
      }

      btn.cornerRadius = 3;

      btn.onPointerClickObservable.add(() => {
        this.selectedNPCId = npc.id;
        this.onNPCSelected?.(npc.id);
        this.updateNPCList(npcs); // Refresh to update selection
      });

      container.addControl(btn);
    });
  }

  public updateActionList(npc: NPCInfo | null, actions: Action[], playerEnergy: number) {
    if (!this.actionPanel) return;

    const title = this.actionPanel.getDescendants().find(
      (c) => c.name === "actionPanelTitle"
    ) as TextBlock;
    const container = this.actionPanel.getDescendants().find(
      (c) => c.name === "actionContainer"
    ) as StackPanel;

    if (!container) return;

    // Clear existing actions
    container.clearControls();

    if (!npc) {
      this.actionPanel.isVisible = false;
      return;
    }

    this.actionPanel.isVisible = true;

    if (title) {
      title.text = `Actions: ${npc.name}`;
    }

    if (actions.length === 0) {
      const emptyText = new TextBlock();
      emptyText.text = "No actions available";
      emptyText.color = "#888";
      emptyText.fontSize = 14;
      emptyText.height = "30px";
      container.addControl(emptyText);
      return;
    }

    actions.forEach((action) => {
      const canAfford = !action.energyCost || playerEnergy >= action.energyCost;

      const btn = Button.CreateSimpleButton(`action-${action.id}`, action.name);
      btn.width = "95%";
      btn.height = "40px";
      btn.fontSize = 14;
      btn.paddingTop = "5px";
      btn.paddingBottom = "5px";
      btn.color = "white";
      btn.cornerRadius = 3;

      if (canAfford) {
        btn.background = "rgba(33, 150, 243, 0.8)";
      } else {
        btn.background = "rgba(100, 100, 100, 0.5)";
        btn.color = "#666";
      }

      btn.onPointerClickObservable.add(() => {
        if (canAfford) {
          this.onActionSelected?.(action.id);
        }
      });

      container.addControl(btn);

      // Energy cost label
      if (action.energyCost) {
        const costText = new TextBlock();
        costText.text = `⚡${action.energyCost}`;
        costText.color = canAfford ? "#FFC107" : "#666";
        costText.fontSize = 12;
        costText.height = "18px";
        costText.paddingLeft = "10px";
        costText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        container.addControl(costText);
      }
    });
  }

  public showActionFeedback(feedback: ActionFeedbackData) {
    if (!this.feedbackPanel) return;

    const title = this.feedbackPanel.getDescendants().find(
      (c) => c.name === "feedbackTitle"
    ) as TextBlock;
    const message = this.feedbackPanel.getDescendants().find(
      (c) => c.name === "feedbackMessage"
    ) as TextBlock;

    if (title) {
      title.text = `${feedback.actionName} → ${feedback.targetName}`;
    }

    if (message) {
      message.text = feedback.narrativeText || (feedback.success ? "Action succeeded!" : "Action failed.");
    }

    // Update color based on success
    if (this.feedbackPanel instanceof Rectangle) {
      this.feedbackPanel.color = feedback.success ? "#4CAF50" : "#F44336";
    }

    this.feedbackPanel.isVisible = true;

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (this.feedbackPanel) {
        this.feedbackPanel.isVisible = false;
      }
    }, 5000);
  }

  public hideActionFeedback() {
    if (this.feedbackPanel) {
      this.feedbackPanel.isVisible = false;
    }
  }

  public updateMinimap(data: MinimapData) {
    if (!this.minimapPanel) return;

    const mapContainer = this.minimapPanel.getDescendants().find(
      (c) => c.name === "minimapContainer"
    ) as Container;

    if (!mapContainer) return;

    // Clear existing map elements
    mapContainer.children.slice().forEach((child) => {
      mapContainer.removeControl(child);
      child.dispose();
    });

    const mapWidth = 180;
    const mapHeight = 160;
    const scale = Math.min(mapWidth, mapHeight) / data.worldSize;

    // Draw settlements and zones
    data.settlements.forEach((settlement) => {
      const x = (settlement.position.x * scale);
      const z = (settlement.position.z * scale);

      // Determine zone color
      let zoneColor = "#4CAF50"; // Green (safe)
      if (settlement.zoneType === "neutral") {
        zoneColor = "#2196F3"; // Blue
      } else if (settlement.zoneType === "caution") {
        zoneColor = "#FF9800"; // Amber
      }

      // Draw zone circle
      const zoneRadius = settlement.type === "city" ? 15 : settlement.type === "village" ? 8 : 12;
      const zoneCircle = new Ellipse(`zone-${settlement.id}`);
      zoneCircle.width = `${zoneRadius * 2}px`;
      zoneCircle.height = `${zoneRadius * 2}px`;
      zoneCircle.color = zoneColor;
      zoneCircle.thickness = 2;
      zoneCircle.background = `${zoneColor}33`; // Semi-transparent
      zoneCircle.left = `${x}px`;
      zoneCircle.top = `${-z}px`; // Invert Z for top-down view
      mapContainer.addControl(zoneCircle);

      // Draw settlement marker
      const marker = new Ellipse(`settlement-${settlement.id}`);
      marker.width = "8px";
      marker.height = "8px";
      marker.color = "white";
      marker.background = zoneColor;
      marker.thickness = 1;
      marker.left = `${x}px`;
      marker.top = `${-z}px`;
      mapContainer.addControl(marker);
    });

    // Draw player marker
    const playerX = data.playerPosition.x * scale;
    const playerZ = data.playerPosition.z * scale;

    const playerMarker = new Rectangle("player-marker");
    playerMarker.width = "8px";
    playerMarker.height = "8px";
    playerMarker.background = "#FFC107"; // Yellow
    playerMarker.color = "white";
    playerMarker.thickness = 2;
    playerMarker.cornerRadius = 4;
    playerMarker.left = `${playerX}px`;
    playerMarker.top = `${-playerZ}px`;
    mapContainer.addControl(playerMarker);
  }

  public updateReputation(data: ReputationData | null) {
    if (!this.reputationPanel) return;

    // Hide panel if no reputation data (not in any zone)
    if (!data) {
      this.reputationPanel.isVisible = false;
      return;
    }

    // Show panel
    this.reputationPanel.isVisible = true;

    // Update settlement name
    const settlementName = this.reputationPanel.getDescendants().find(
      (c) => c.name === "reputationSettlement"
    ) as TextBlock;
    if (settlementName) {
      settlementName.text = data.settlementName;
    }

    // Update standing text and color
    const standing = this.reputationPanel.getDescendants().find(
      (c) => c.name === "reputationStanding"
    ) as TextBlock;
    if (standing) {
      standing.text = data.standing.charAt(0).toUpperCase() + data.standing.slice(1);

      // Color based on standing
      if (data.standing === 'revered') {
        standing.color = "#4CAF50"; // Green
      } else if (data.standing === 'friendly') {
        standing.color = "#8BC34A"; // Light green
      } else if (data.standing === 'neutral') {
        standing.color = "#FFC107"; // Yellow
      } else if (data.standing === 'unfriendly') {
        standing.color = "#FF9800"; // Orange
      } else if (data.standing === 'hostile') {
        standing.color = "#F44336"; // Red
      }
    }

    // Update reputation bar
    const repBarFill = this.reputationPanel.getDescendants().find(
      (c) => c.name === "reputationBarFill"
    ) as Rectangle;
    if (repBarFill) {
      // Convert score (-100 to 100) to bar width (0 to 200px)
      const normalizedScore = ((data.score + 100) / 200) * 200;
      repBarFill.width = `${Math.max(0, Math.min(200, normalizedScore))}px`;

      // Color based on score
      if (data.score >= 51) {
        repBarFill.background = "#4CAF50"; // Green (Revered)
      } else if (data.score >= 1) {
        repBarFill.background = "#8BC34A"; // Light green (Friendly)
      } else if (data.score >= -49) {
        repBarFill.background = "#FFC107"; // Yellow (Neutral)
      } else if (data.score >= -99) {
        repBarFill.background = "#FF9800"; // Orange (Unfriendly)
      } else {
        repBarFill.background = "#F44336"; // Red (Hostile)
      }
    }

    // Update score text
    const scoreText = this.reputationPanel.getDescendants().find(
      (c) => c.name === "reputationScore"
    ) as TextBlock;
    if (scoreText) {
      scoreText.text = `${data.score} / 100`;
    }

    // Update warning/ban text
    const warningText = this.reputationPanel.getDescendants().find(
      (c) => c.name === "reputationWarning"
    ) as TextBlock;
    if (warningText) {
      if (data.isBanned) {
        warningText.text = "⚠ BANNED - Leave immediately!";
        warningText.color = "#F44336";
      } else if (data.violationCount > 0) {
        warningText.text = `⚠ Violations: ${data.violationCount}`;
        warningText.color = "#FF9800";
      } else if (data.outstandingFines > 0) {
        warningText.text = `Fine due: ${data.outstandingFines} gold`;
        warningText.color = "#FFC107";
      } else {
        warningText.text = "";
      }
    }

    // Show/hide Pay Fines button based on outstanding fines
    const payFinesBtn = this.reputationPanel.getDescendants().find(
      (c) => c.name === "payFinesBtn"
    ) as Button;
    if (payFinesBtn) {
      if (data.outstandingFines > 0 && !data.isBanned) {
        payFinesBtn.isVisible = true;
        payFinesBtn.textBlock!.text = `Pay Fines (${data.outstandingFines}g)`;
      } else {
        payFinesBtn.isVisible = false;
      }
    }
  }

  // Callback setters
  public setOnActionSelected(callback: (actionId: string) => void) {
    this.onActionSelected = callback;
  }

  public setOnNPCSelected(callback: (npcId: string) => void) {
    this.onNPCSelected = callback;
  }

  public setOnBackPressed(callback: () => void) {
    this.onBackPressed = callback;
  }

  public setOnFullscreenPressed(callback: () => void) {
    this.onFullscreenPressed = callback;
  }

  public setOnDebugPressed(callback: () => void) {
    this.onDebugPressed = callback;
  }

  public setOnPayFines(callback: () => void) {
    this.onPayFines = callback;
  }

  public dispose() {
    this.advancedTexture.dispose();
  }
}
