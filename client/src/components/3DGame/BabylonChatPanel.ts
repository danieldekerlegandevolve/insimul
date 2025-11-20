import {
  AdvancedDynamicTexture,
  Button,
  Container,
  Control,
  InputText,
  Rectangle,
  ScrollViewer,
  StackPanel,
  TextBlock,
  TextWrapping
} from "@babylonjs/gui";
import { Scene, Mesh } from "babylonjs";
import { BabylonDialogueActions } from "./BabylonDialogueActions";
import { Action } from "../rpg/types/actions";
import { NPCTalkingIndicator } from "./NPCTalkingIndicator";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Character {
  id: string;
  worldId: string;
  firstName: string;
  lastName: string;
  age?: number | null;
  gender?: string;
  occupation?: string | null;
  personality?: Record<string, any>;
  currentLocation?: string;
  [key: string]: any;
}

export class BabylonChatPanel {
  private advancedTexture: AdvancedDynamicTexture;
  private scene: Scene;
  private chatContainer: Container | null = null;
  private messagesPanel: StackPanel | null = null;
  private inputText: InputText | null = null;
  private character: Character | null = null;
  private messages: Message[] = [];
  private isVisible = false;

  // Audio
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private currentAudio: HTMLAudioElement | null = null;
  private isRecording = false;
  private isProcessing = false;
  private isSpeaking = false;

  // Dialogue Actions
  private dialogueActions: BabylonDialogueActions | null = null;
  private actionsContainer: Container | null = null;
  private availableActions: Action[] = [];
  private playerEnergy: number = 100;

  // Talking Indicator
  private talkingIndicator: NPCTalkingIndicator | null = null;
  private npcMesh: Mesh | null = null;

  // Callbacks
  private onClose: (() => void) | null = null;
  private onQuestAssigned: ((questData: any) => void) | null = null;
  private onActionSelect: ((actionId: string) => void) | null = null;
  private onVocabularyUsed: ((word: string) => void) | null = null;
  private onConversationTurn: ((keywords: string[]) => void) | null = null;

  constructor(advancedTexture: AdvancedDynamicTexture, scene: Scene) {
    this.advancedTexture = advancedTexture;
    this.scene = scene;
    this.talkingIndicator = new NPCTalkingIndicator(scene);
  }

  public show(character: Character, truths: any[], npcMesh?: Mesh) {
    this.character = character;
    this.npcMesh = npcMesh || null;
    this.isVisible = true;

    if (this.chatContainer) {
      this.chatContainer.isVisible = true;
      this.initializeChat(truths);
      return;
    }

    this.createChatUI();
    this.initializeChat(truths);
  }

  public hide() {
    this.isVisible = false;
    if (this.chatContainer) {
      this.chatContainer.isVisible = false;
    }
    if (this.dialogueActions) {
      this.dialogueActions.hide();
    }
    // Hide talking indicator
    if (this.talkingIndicator && this.character) {
      this.talkingIndicator.hide(this.character.id);
    }
    this.stopAllAudio();
  }

  private stopAllAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
    this.isSpeaking = false;
  }

  private initializeChat(truths: any[]) {
    if (!this.character) return;

    // Build greeting based on language
    const greeting = this.buildGreeting(truths);

    this.messages = [{
      role: 'assistant',
      content: greeting,
      timestamp: new Date()
    }];

    this.updateMessagesDisplay();
  }

  private buildGreeting(truths: any[]): string {
    if (!this.character) return "Hello!";

    const { firstName, lastName } = this.character;
    const presentTruths = truths.filter(t => t.timestep === 0);

    // Check language fluency
    const frenchTruth = presentTruths.find(t =>
      (t.entryType === 'language' && t.title?.includes('French')) ||
      (t.content?.includes('French') && t.content?.includes('fluency'))
    );
    const englishTruth = presentTruths.find(t =>
      (t.entryType === 'language' && t.title?.includes('English')) ||
      (t.content?.includes('English') && t.content?.includes('fluency'))
    );

    let frenchFluency = 0;
    let englishFluency = 100;

    if (frenchTruth?.sourceData?.value) {
      frenchFluency = frenchTruth.sourceData.value;
    } else if (frenchTruth?.content) {
      const match = frenchTruth.content.match(/(\d+)\/100 fluency in French/);
      if (match && match[1]) frenchFluency = parseInt(match[1]);
    }

    if (englishTruth?.sourceData?.value) {
      englishFluency = englishTruth.sourceData.value;
    } else if (englishTruth?.content) {
      const match = englishTruth.content.match(/(\d+)\/100 fluency in English/);
      if (match && match[1]) englishFluency = parseInt(match[1]);
    }

    if (frenchFluency > englishFluency) {
      return `Bonjour! Je m'appelle ${firstName} ${lastName}. Comment puis-je vous aider?`;
    } else if (englishFluency >= 70) {
      return `Hello! I'm ${firstName} ${lastName}. How can I help you today?`;
    } else if (englishFluency >= 50) {
      return `Hello! My name is ${firstName} ${lastName}. How can I help you?`;
    } else {
      return `Hello... I am ${firstName}. Sorry, my English not very good.`;
    }
  }

  private createChatUI() {
    // Main container
    this.chatContainer = new Rectangle("chatContainer");
    this.chatContainer.width = "600px";
    this.chatContainer.height = "500px";
    this.chatContainer.background = "rgba(0, 0, 0, 0.95)";
    this.chatContainer.color = "white";
    this.chatContainer.thickness = 2;
    this.chatContainer.cornerRadius = 10;
    this.chatContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.chatContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

    const mainStack = new StackPanel();
    mainStack.width = "100%";
    mainStack.height = "100%";
    this.chatContainer.addControl(mainStack);

    // Header
    const header = new Rectangle("chatHeader");
    header.width = "100%";
    header.height = "60px";
    header.background = "rgba(30, 30, 30, 0.9)";
    header.thickness = 0;
    mainStack.addControl(header);

    const headerStack = new StackPanel();
    headerStack.width = "100%";
    headerStack.paddingTop = "10px";
    header.addControl(headerStack);

    const titleText = new TextBlock();
    titleText.text = this.character ? `💬 ${this.character.firstName} ${this.character.lastName}` : "Chat";
    titleText.color = "white";
    titleText.fontSize = 20;
    titleText.height = "30px";
    titleText.fontWeight = "bold";
    headerStack.addControl(titleText);

    const subtitleText = new TextBlock();
    subtitleText.text = "Press TAB to toggle voice mode";
    subtitleText.color = "#888";
    subtitleText.fontSize = 12;
    subtitleText.height = "20px";
    headerStack.addControl(subtitleText);

    // Close button
    const closeBtn = Button.CreateSimpleButton("closeChat", "✕");
    closeBtn.width = "40px";
    closeBtn.height = "40px";
    closeBtn.color = "white";
    closeBtn.background = "rgba(255, 50, 50, 0.8)";
    closeBtn.cornerRadius = 5;
    closeBtn.fontSize = 20;
    closeBtn.top = "10px";
    closeBtn.left = "-10px";
    closeBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    closeBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    closeBtn.onPointerClickObservable.add(() => {
      this.hide();
      this.onClose?.();
    });
    header.addControl(closeBtn);

    // Messages scroll area
    const scrollViewer = new ScrollViewer("chatScroll");
    scrollViewer.width = "100%";
    scrollViewer.height = "240px";
    scrollViewer.paddingTop = "10px";
    scrollViewer.paddingBottom = "10px";
    scrollViewer.background = "rgba(20, 20, 20, 0.5)";
    mainStack.addControl(scrollViewer);

    this.messagesPanel = new StackPanel("messagesPanel");
    this.messagesPanel.width = "100%";
    scrollViewer.addControl(this.messagesPanel);

    // Actions container (for dialogue actions)
    this.actionsContainer = new Container("actionsContainer");
    this.actionsContainer.width = "100%";
    this.actionsContainer.height = "100px";
    this.actionsContainer.background = "transparent";
    this.actionsContainer.paddingLeft = "10px";
    this.actionsContainer.paddingRight = "10px";
    mainStack.addControl(this.actionsContainer);

    // Input area
    const inputContainer = new Rectangle("inputContainer");
    inputContainer.width = "100%";
    inputContainer.height = "100px";
    inputContainer.background = "rgba(30, 30, 30, 0.9)";
    inputContainer.thickness = 0;
    mainStack.addControl(inputContainer);

    const inputStack = new StackPanel();
    inputStack.isVertical = false;
    inputStack.width = "100%";
    inputStack.height = "100%";
    inputStack.paddingLeft = "10px";
    inputStack.paddingRight = "10px";
    inputStack.paddingTop = "10px";
    inputStack.paddingBottom = "10px";
    inputContainer.addControl(inputStack);

    // Text input
    this.inputText = new InputText("chatInput");
    this.inputText.width = "480px";
    this.inputText.height = "80px";
    this.inputText.color = "white";
    this.inputText.background = "rgba(50, 50, 50, 0.8)";
    this.inputText.placeholderText = "Type your message...";
    this.inputText.placeholderColor = "#666";
    this.inputText.fontSize = 14;
    this.inputText.paddingLeft = "10px";
    this.inputText.paddingRight = "10px";
    this.inputText.onTextChangedObservable.add(() => {
      // Auto-resize not needed for Babylon GUI
    });
    inputStack.addControl(this.inputText);

    // Buttons container
    const buttonsStack = new StackPanel();
    buttonsStack.width = "100px";
    buttonsStack.paddingLeft = "10px";
    inputStack.addControl(buttonsStack);

    // Mic button
    const micBtn = Button.CreateSimpleButton("micBtn", "🎤");
    micBtn.width = "100%";
    micBtn.height = "35px";
    micBtn.color = "white";
    micBtn.background = this.isRecording ? "rgba(255, 50, 50, 0.8)" : "rgba(60, 60, 60, 0.8)";
    micBtn.cornerRadius = 5;
    micBtn.fontSize = 16;
    micBtn.paddingBottom = "5px";
    micBtn.onPointerClickObservable.add(() => {
      if (this.isRecording) {
        this.stopRecording();
      } else {
        this.startRecording();
      }
    });
    buttonsStack.addControl(micBtn);

    // Send button
    const sendBtn = Button.CreateSimpleButton("sendBtn", "📤 Send");
    sendBtn.width = "100%";
    sendBtn.height = "35px";
    sendBtn.color = "white";
    sendBtn.background = "rgba(30, 150, 255, 0.8)";
    sendBtn.cornerRadius = 5;
    sendBtn.fontSize = 14;
    sendBtn.paddingTop = "5px";
    sendBtn.onPointerClickObservable.add(() => {
      this.sendMessage();
    });
    buttonsStack.addControl(sendBtn);

    this.advancedTexture.addControl(this.chatContainer);
  }

  private updateMessagesDisplay() {
    if (!this.messagesPanel) return;

    this.messagesPanel.clearControls();

    this.messages.forEach((message, index) => {
      const messageContainer = new Rectangle(`msg-${index}`);
      messageContainer.width = "95%";
      messageContainer.height = "auto";
      messageContainer.thickness = 0;
      messageContainer.paddingTop = "5px";
      messageContainer.paddingBottom = "5px";
      messageContainer.horizontalAlignment = message.role === 'user'
        ? Control.HORIZONTAL_ALIGNMENT_RIGHT
        : Control.HORIZONTAL_ALIGNMENT_LEFT;

      const messageBubble = new Rectangle(`bubble-${index}`);
      messageBubble.width = "80%";
      messageBubble.adaptHeightToChildren = true;
      messageBubble.background = message.role === 'user' ? "rgba(30, 150, 255, 0.9)" : "rgba(60, 60, 60, 0.9)";
      messageBubble.cornerRadius = 10;
      messageBubble.thickness = 0;
      messageBubble.paddingTop = "10px";
      messageBubble.paddingBottom = "10px";
      messageBubble.paddingLeft = "15px";
      messageBubble.paddingRight = "15px";
      messageBubble.horizontalAlignment = message.role === 'user'
        ? Control.HORIZONTAL_ALIGNMENT_RIGHT
        : Control.HORIZONTAL_ALIGNMENT_LEFT;
      messageContainer.addControl(messageBubble);

      const messageStack = new StackPanel();
      messageStack.width = "100%";
      messageBubble.addControl(messageStack);

      const messageText = new TextBlock();
      messageText.text = message.content;
      messageText.color = "white";
      messageText.fontSize = 14;
      messageText.textWrapping = TextWrapping.WordWrap;
      messageText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      messageText.resizeToFit = true;
      messageStack.addControl(messageText);

      const timeText = new TextBlock();
      timeText.text = message.timestamp.toLocaleTimeString();
      timeText.color = "rgba(255, 255, 255, 0.6)";
      timeText.fontSize = 10;
      timeText.height = "15px";
      timeText.textHorizontalAlignment = message.role === 'user'
        ? Control.HORIZONTAL_ALIGNMENT_RIGHT
        : Control.HORIZONTAL_ALIGNMENT_LEFT;
      timeText.paddingTop = "5px";
      messageStack.addControl(timeText);

      this.messagesPanel.addControl(messageContainer);
    });

    // Scroll to bottom (not directly possible in Babylon GUI, but we add new messages at bottom)
  }

  private async sendMessage() {
    if (!this.inputText || !this.character || this.isProcessing) return;

    const userMessage = this.inputText.text.trim();
    if (!userMessage) return;

    this.inputText.text = "";
    this.isProcessing = true;

    // Add user message
    this.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    });
    this.updateMessagesDisplay();

    try {
      // Send to Gemini API
      const aiResponse = await this.sendToGemini(userMessage);

      // Add AI response
      this.messages.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      });
      this.updateMessagesDisplay();

      // Track vocabulary usage for quests
      this.trackQuestProgress(userMessage, aiResponse);

      // Convert to speech and play
      await this.textToSpeech(aiResponse);

    } catch (error) {
      console.error('Chat error:', error);
      this.messages.push({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      });
      this.updateMessagesDisplay();
    } finally {
      this.isProcessing = false;
    }
  }

  private async sendToGemini(userMessage: string): Promise<string> {
    if (!this.character) throw new Error('No character selected');

    const systemPrompt = this.buildSystemPrompt();
    const conversationHistory = this.messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    conversationHistory.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    const response = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt,
        messages: conversationHistory,
        temperature: 0.8,
        maxTokens: 2048
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get response from AI');
    }

    const data = await response.json();
    return data.response;
  }

  private buildSystemPrompt(): string {
    if (!this.character) return '';

    const { firstName, lastName, age, gender, occupation } = this.character;

    return `You are ${firstName} ${lastName} (${age || '?'} years old, ${gender}, ${occupation || 'no occupation'}).

BEHAVIOR:
1. Keep responses under 3 sentences unless asked for more.
2. Stay in character based on your personality and background.
3. You can talk about your location, the world, your relationships, and your life.

Respond naturally and conversationally.`;
  }

  private async textToSpeech(text: string) {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: this.character?.gender === 'female' ? 'Kore' : 'Charon',
          gender: this.character?.gender || 'neutral'
        })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        await this.playAudio(audioBlob);
      } else {
        // Fallback to browser TTS
        this.browserTextToSpeech(text);
      }
    } catch (error) {
      console.error('TTS error:', error);
      this.browserTextToSpeech(text);
    }
  }

  private browserTextToSpeech(text: string) {
    if (!('speechSynthesis' in window)) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;

    const voices = speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith('en'));
    if (voice) utterance.voice = voice;

    this.isSpeaking = true;

    // Show talking indicator
    if (this.talkingIndicator && this.character && this.npcMesh) {
      this.talkingIndicator.show(this.character.id, this.npcMesh);
    }

    utterance.onend = () => {
      this.isSpeaking = false;

      // Hide talking indicator
      if (this.talkingIndicator && this.character) {
        this.talkingIndicator.hide(this.character.id);
      }
    };

    speechSynthesis.speak(utterance);
  }

  private async playAudio(audioBlob: Blob) {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    this.currentAudio = audio;

    this.isSpeaking = true;

    // Show talking indicator
    if (this.talkingIndicator && this.character && this.npcMesh) {
      this.talkingIndicator.show(this.character.id, this.npcMesh);
    }

    audio.onended = () => {
      this.isSpeaking = false;
      URL.revokeObjectURL(audioUrl);

      // Hide talking indicator
      if (this.talkingIndicator && this.character) {
        this.talkingIndicator.hide(this.character.id);
      }
    };

    await audio.play();
  }

  private async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());

        this.isProcessing = true;
        try {
          const transcript = await this.speechToText(audioBlob);
          if (this.inputText) {
            this.inputText.text = transcript;
          }
          await this.sendMessage();
        } catch (error) {
          console.error('Speech to text error:', error);
        } finally {
          this.isProcessing = false;
        }
      };

      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (error) {
      console.error('Microphone error:', error);
    }
  }

  private stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  private async speechToText(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const response = await fetch('/api/stt', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to convert speech to text');
    }

    const data = await response.json();
    return data.transcript;
  }

  /**
   * Track quest progress from conversation
   */
  private trackQuestProgress(userMessage: string, aiResponse: string) {
    // Extract words from both messages
    const combinedText = `${userMessage} ${aiResponse}`;
    const words = combinedText.toLowerCase()
      .replace(/[^\wà-ÿ\s]/gi, '') // Keep accented characters
      .split(/\s+/)
      .filter(word => word.length > 3); // Only words longer than 3 chars

    // Track vocabulary usage
    if (this.onVocabularyUsed) {
      // Deduplicate words
      const uniqueWords = Array.from(new Set(words));
      uniqueWords.forEach(word => {
        this.onVocabularyUsed!(word);
      });
    }

    // Extract keywords for conversation tracking
    const keywords = words.filter(word => {
      // French greeting/polite keywords
      const importantWords = [
        'bonjour', 'bonsoir', 'salut', 'au revoir', 'merci', 'pardon',
        'comment', 'pourquoi', 'quand', 'où', 'qui', 'que', 'quel',
        'sil', 'vous', 'plaît', 'allez'
      ];
      return importantWords.includes(word);
    });

    // Track conversation turn if we have keywords
    if (this.onConversationTurn && keywords.length > 0) {
      this.onConversationTurn(keywords);
    }
  }

  public setOnClose(callback: () => void) {
    this.onClose = callback;
  }

  public setOnQuestAssigned(callback: (questData: any) => void) {
    this.onQuestAssigned = callback;
  }

  public setOnActionSelect(callback: (actionId: string) => void) {
    this.onActionSelect = callback;
  }

  public setOnVocabularyUsed(callback: (word: string) => void) {
    this.onVocabularyUsed = callback;
  }

  public setOnConversationTurn(callback: (keywords: string[]) => void) {
    this.onConversationTurn = callback;
  }

  /**
   * Set available dialogue actions for the current conversation
   */
  public setDialogueActions(actions: Action[], playerEnergy: number) {
    this.availableActions = actions;
    this.playerEnergy = playerEnergy;

    if (this.isVisible && this.actionsContainer && actions.length > 0) {
      if (!this.dialogueActions) {
        this.dialogueActions = new BabylonDialogueActions();
      }

      this.dialogueActions.show(
        this.actionsContainer,
        actions,
        playerEnergy,
        (actionId: string) => {
          this.onActionSelect?.(actionId);
        }
      );
    }
  }

  /**
   * Update dialogue actions (e.g., when player energy changes)
   */
  public updateDialogueActions(playerEnergy: number) {
    this.playerEnergy = playerEnergy;
    if (this.dialogueActions && this.dialogueActions.isVisible()) {
      this.dialogueActions.update(this.availableActions, playerEnergy);
    }
  }

  public dispose() {
    this.stopAllAudio();
    if (this.dialogueActions) {
      this.dialogueActions.hide();
      this.dialogueActions = null;
    }
    if (this.talkingIndicator) {
      this.talkingIndicator.dispose();
      this.talkingIndicator = null;
    }
    if (this.chatContainer) {
      this.advancedTexture.removeControl(this.chatContainer);
    }
  }
}
