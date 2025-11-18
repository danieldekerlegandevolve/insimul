import {
  AdvancedDynamicTexture,
  Button,
  Container,
  Control,
  Rectangle,
  ScrollViewer,
  StackPanel,
  TextBlock,
  TextWrapping
} from "@babylonjs/gui";
import { Scene } from "babylonjs";

interface Quest {
  id: string;
  worldId: string;
  assignedTo: string;
  assignedBy: string | null;
  assignedByCharacterId: string | null;
  title: string;
  description: string;
  questType: string;
  difficulty: string;
  targetLanguage: string;
  progress: Record<string, any> | null;
  status: string;
  completionCriteria: Record<string, any> | null;
  experienceReward: number;
  assignedAt: Date;
  completedAt: Date | null;
  conversationContext: string | null;
}

export class BabylonQuestTracker {
  private advancedTexture: AdvancedDynamicTexture;
  private scene: Scene;
  private questPanel: Container | null = null;
  private questListPanel: StackPanel | null = null;
  private quests: Quest[] = [];
  private isVisible = false;
  private isMinimized = false;

  // Callbacks
  private onClose: (() => void) | null = null;

  constructor(advancedTexture: AdvancedDynamicTexture, scene: Scene) {
    this.advancedTexture = advancedTexture;
    this.scene = scene;
    this.createQuestUI();
  }

  private createQuestUI() {
    // Main container
    this.questPanel = new Rectangle("questPanel");
    this.questPanel.width = "350px";
    this.questPanel.height = "450px";
    this.questPanel.background = "rgba(0, 0, 0, 0.85)";
    this.questPanel.color = "#FFD700";
    this.questPanel.thickness = 2;
    this.questPanel.cornerRadius = 10;
    this.questPanel.top = "10px";
    this.questPanel.left = "-10px";
    this.questPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.questPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.questPanel.isVisible = false;

    const mainStack = new StackPanel();
    mainStack.width = "100%";
    mainStack.height = "100%";
    this.questPanel.addControl(mainStack);

    // Header
    const header = new Rectangle("questHeader");
    header.width = "100%";
    header.height = "50px";
    header.background = "rgba(30, 30, 30, 0.95)";
    header.thickness = 0;
    mainStack.addControl(header);

    const headerStack = new StackPanel();
    headerStack.isVertical = false;
    headerStack.width = "100%";
    headerStack.height = "100%";
    header.addControl(headerStack);

    const titleText = new TextBlock();
    titleText.text = "🎯 Quests";
    titleText.color = "#FFD700";
    titleText.fontSize = 18;
    titleText.fontWeight = "bold";
    titleText.paddingLeft = "15px";
    titleText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    titleText.width = "250px";
    headerStack.addControl(titleText);

    // Minimize button
    const minimizeBtn = Button.CreateSimpleButton("minimizeQuest", "−");
    minimizeBtn.width = "40px";
    minimizeBtn.height = "40px";
    minimizeBtn.color = "white";
    minimizeBtn.background = "rgba(100, 100, 100, 0.8)";
    minimizeBtn.cornerRadius = 5;
    minimizeBtn.fontSize = 24;
    minimizeBtn.paddingRight = "5px";
    minimizeBtn.onPointerClickObservable.add(() => {
      this.toggleMinimize();
    });
    headerStack.addControl(minimizeBtn);

    // Close button
    const closeBtn = Button.CreateSimpleButton("closeQuest", "✕");
    closeBtn.width = "40px";
    closeBtn.height = "40px";
    closeBtn.color = "white";
    closeBtn.background = "rgba(255, 50, 50, 0.8)";
    closeBtn.cornerRadius = 5;
    closeBtn.fontSize = 20;
    closeBtn.paddingRight = "5px";
    closeBtn.onPointerClickObservable.add(() => {
      this.hide();
      this.onClose?.();
    });
    headerStack.addControl(closeBtn);

    // Quest list scroll area
    const scrollViewer = new ScrollViewer("questScroll");
    scrollViewer.width = "100%";
    scrollViewer.height = "390px";
    scrollViewer.paddingTop = "10px";
    scrollViewer.paddingBottom = "10px";
    scrollViewer.background = "rgba(20, 20, 20, 0.5)";
    mainStack.addControl(scrollViewer);

    this.questListPanel = new StackPanel("questListPanel");
    this.questListPanel.width = "100%";
    scrollViewer.addControl(this.questListPanel);

    this.advancedTexture.addControl(this.questPanel);
  }

  public async updateQuests(worldId: string) {
    try {
      const response = await fetch(`/api/worlds/${worldId}/quests`);
      if (!response.ok) {
        throw new Error('Failed to fetch quests');
      }

      this.quests = await response.json();
      this.updateQuestsDisplay();
    } catch (error) {
      console.error('Failed to load quests:', error);
    }
  }

  private updateQuestsDisplay() {
    if (!this.questListPanel) return;

    this.questListPanel.clearControls();

    const activeQuests = this.quests.filter(q => q.status === 'active');
    const completedQuests = this.quests.filter(q => q.status === 'completed');

    if (activeQuests.length === 0 && completedQuests.length === 0) {
      const emptyText = new TextBlock();
      emptyText.text = "No active quests\n\nTalk to NPCs to receive quests!";
      emptyText.color = "#888";
      emptyText.fontSize = 14;
      emptyText.height = "80px";
      emptyText.textWrapping = TextWrapping.WordWrap;
      emptyText.paddingTop = "20px";
      this.questListPanel.addControl(emptyText);
      return;
    }

    // Active quests section
    if (activeQuests.length > 0) {
      const activeHeader = new TextBlock();
      activeHeader.text = `ACTIVE (${activeQuests.length})`;
      activeHeader.color = "#4CAF50";
      activeHeader.fontSize = 14;
      activeHeader.fontWeight = "bold";
      activeHeader.height = "30px";
      activeHeader.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      activeHeader.paddingLeft = "10px";
      this.questListPanel.addControl(activeHeader);

      activeQuests.forEach((quest) => {
        this.questListPanel?.addControl(this.createQuestCard(quest));
      });
    }

    // Completed quests section
    if (completedQuests.length > 0) {
      const completedHeader = new TextBlock();
      completedHeader.text = `COMPLETED (${completedQuests.length})`;
      completedHeader.color = "#FFD700";
      completedHeader.fontSize = 14;
      completedHeader.fontWeight = "bold";
      completedHeader.height = "30px";
      completedHeader.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      completedHeader.paddingLeft = "10px";
      completedHeader.paddingTop = "10px";
      this.questListPanel.addControl(completedHeader);

      completedQuests.slice(0, 3).forEach((quest) => {
        this.questListPanel?.addControl(this.createQuestCard(quest));
      });
    }
  }

  private createQuestCard(quest: Quest): Container {
    const card = new Rectangle(`quest-${quest.id}`);
    card.width = "95%";
    card.adaptHeightToChildren = true;
    card.background = quest.status === 'active'
      ? "rgba(40, 120, 40, 0.3)"
      : "rgba(100, 100, 100, 0.3)";
    card.color = quest.status === 'active' ? "#4CAF50" : "#888";
    card.thickness = 1;
    card.cornerRadius = 5;
    card.paddingTop = "10px";
    card.paddingBottom = "10px";
    card.paddingLeft = "10px";
    card.paddingRight = "10px";

    const cardStack = new StackPanel();
    cardStack.width = "100%";
    card.addControl(cardStack);

    // Title with icon
    const titleContainer = new StackPanel();
    titleContainer.isVertical = false;
    titleContainer.width = "100%";
    titleContainer.height = "25px";
    cardStack.addControl(titleContainer);

    const iconText = new TextBlock();
    iconText.text = this.getQuestIcon(quest.questType);
    iconText.fontSize = 16;
    iconText.width = "30px";
    iconText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    titleContainer.addControl(iconText);

    const titleText = new TextBlock();
    titleText.text = quest.title;
    titleText.color = "white";
    titleText.fontSize = 14;
    titleText.fontWeight = "bold";
    titleText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    titleText.textWrapping = TextWrapping.Clip;
    titleText.width = "280px";
    titleContainer.addControl(titleText);

    // Description
    const descText = new TextBlock();
    descText.text = quest.description;
    descText.color = "#CCC";
    descText.fontSize = 12;
    descText.height = "40px";
    descText.textWrapping = TextWrapping.WordWrap;
    descText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    descText.paddingTop = "5px";
    cardStack.addControl(descText);

    // Metadata row
    const metaContainer = new StackPanel();
    metaContainer.isVertical = false;
    metaContainer.width = "100%";
    metaContainer.height = "20px";
    metaContainer.paddingTop = "5px";
    cardStack.addControl(metaContainer);

    const difficultyText = new TextBlock();
    difficultyText.text = `[${quest.difficulty.toUpperCase()}]`;
    difficultyText.color = this.getDifficultyColor(quest.difficulty);
    difficultyText.fontSize = 10;
    difficultyText.fontWeight = "bold";
    difficultyText.width = "100px";
    difficultyText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    metaContainer.addControl(difficultyText);

    const rewardText = new TextBlock();
    rewardText.text = `⭐ ${quest.experienceReward} XP`;
    rewardText.color = "#FFD700";
    rewardText.fontSize = 10;
    rewardText.width = "100px";
    rewardText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    metaContainer.addControl(rewardText);

    if (quest.assignedBy) {
      const assignerText = new TextBlock();
      assignerText.text = `From: ${quest.assignedBy}`;
      assignerText.color = "#AAA";
      assignerText.fontSize = 10;
      assignerText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      assignerText.width = "120px";
      metaContainer.addControl(assignerText);
    }

    // Progress bar (if active and has progress)
    if (quest.status === 'active' && quest.completionCriteria && quest.progress) {
      const progress = this.calculateProgress(quest);
      if (progress !== null) {
        const progressContainer = new Rectangle("progressContainer");
        progressContainer.width = "100%";
        progressContainer.height = "20px";
        progressContainer.background = "rgba(40, 40, 40, 0.8)";
        progressContainer.cornerRadius = 3;
        progressContainer.thickness = 0;
        progressContainer.paddingTop = "5px";
        cardStack.addControl(progressContainer);

        const progressBar = new Rectangle("progressBar");
        progressBar.width = `${progress * 100}%`;
        progressBar.height = "20px";
        progressBar.background = "#4CAF50";
        progressBar.cornerRadius = 3;
        progressBar.thickness = 0;
        progressBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        progressContainer.addControl(progressBar);

        const progressText = new TextBlock();
        progressText.text = `${Math.round(progress * 100)}%`;
        progressText.color = "white";
        progressText.fontSize = 10;
        progressText.fontWeight = "bold";
        progressContainer.addControl(progressText);
      }
    }

    return card;
  }

  private calculateProgress(quest: Quest): number | null {
    if (!quest.completionCriteria || !quest.progress) return null;

    const criteria = quest.completionCriteria;
    const progress = quest.progress;

    switch (criteria.type) {
      case 'vocabulary_usage':
        if (criteria.requiredCount && progress.currentCount !== undefined) {
          return Math.min(progress.currentCount / criteria.requiredCount, 1);
        }
        break;

      case 'conversation_turns':
        if (criteria.requiredTurns && progress.turnsCompleted !== undefined) {
          return Math.min(progress.turnsCompleted / criteria.requiredTurns, 1);
        }
        break;

      case 'grammar_pattern':
        if (criteria.requiredCount && progress.currentCount !== undefined) {
          return Math.min(progress.currentCount / criteria.requiredCount, 1);
        }
        break;

      case 'conversation_engagement':
        if (criteria.requiredMessages && progress.messagesCount !== undefined) {
          return Math.min(progress.messagesCount / criteria.requiredMessages, 1);
        }
        break;
    }

    return null;
  }

  private getQuestIcon(questType: string): string {
    switch (questType) {
      case 'conversation': return '💬';
      case 'translation': return '🔄';
      case 'vocabulary': return '📚';
      case 'grammar': return '📝';
      case 'cultural': return '🌍';
      default: return '🎯';
    }
  }

  private getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FFC107';
      case 'advanced': return '#F44336';
      default: return '#888';
    }
  }

  public show() {
    this.isVisible = true;
    if (this.questPanel) {
      this.questPanel.isVisible = true;
    }
  }

  public hide() {
    this.isVisible = false;
    if (this.questPanel) {
      this.questPanel.isVisible = false;
    }
  }

  public toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  private toggleMinimize() {
    if (!this.questPanel) return;

    this.isMinimized = !this.isMinimized;

    if (this.isMinimized) {
      this.questPanel.height = "50px";
    } else {
      this.questPanel.height = "450px";
    }
  }

  public setOnClose(callback: () => void) {
    this.onClose = callback;
  }

  public dispose() {
    if (this.questPanel) {
      this.advancedTexture.removeControl(this.questPanel);
    }
  }
}
