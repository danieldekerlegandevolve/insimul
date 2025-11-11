import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { ActionManager } from "./rpg/actions/ActionManager";
import { DialogueActions } from "./rpg/actions/DialogueActions";
import { ActionRadialMenu } from "./rpg/actions/ActionRadialMenu";
import type { Action } from "./rpg/types/actions";

interface RPGGameProps {
  worldId: string;
  worldName: string;
  onBack: () => void;
}

interface Character {
  id: string;
  firstName: string;
  lastName: string;
  x: number;
  y: number;
  sprite: string;
  occupation?: string;
  personality?: any;
  age?: any;
}

interface GameState {
  player: {
    x: number;
    y: number;
    direction: 'down' | 'up' | 'left' | 'right';
    moving: boolean;
    energy: number;
    maxEnergy: number;
  };
  npcs: Character[];
  dialogue: {
    visible: boolean;
    speaker: string;
    speakerId: string;
    text: string;
  } | null;
  worldTheme: 'fantasy' | 'scifi' | 'cyberpunk' | 'modern';
}

interface WorldData {
  countries: any[];
  settlements: any[];
  rules: any[];
  baseRules: any[];
  actions: any[];
  baseActions: any[];
  quests: any[];
}

export function RPGGame({ worldId, worldName, onBack }: RPGGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    player: {
      x: 400,
      y: 300,
      direction: 'down',
      moving: false,
      energy: 100,
      maxEnergy: 100
    },
    npcs: [],
    dialogue: null,
    worldTheme: 'fantasy'
  });
  const [actionManager, setActionManager] = useState<ActionManager | null>(null);
  const [availableSocialActions, setAvailableSocialActions] = useState<Action[]>([]);
  const [showMentalActionsMenu, setShowMentalActionsMenu] = useState(false);
  const [availableMentalActions, setAvailableMentalActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [worldData, setWorldData] = useState<WorldData>({
    countries: [],
    settlements: [],
    rules: [],
    baseRules: [],
    actions: [],
    baseActions: [],
    quests: []
  });
  const keysPressed = useRef<Set<string>>(new Set());
  const animationFrameId = useRef<number>();
  const gameStateRef = useRef(gameState); // Track current state for game loop
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Update ref whenever gameState changes
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Constants
  const TILE_SIZE = 32;
  const PLAYER_SPEED = 1; // Reduced for better control
  const INTERACTION_RANGE = 60; // Increased for easier interaction
  const NPC_HITBOX_SIZE = 40; // Size of NPC collision area
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  // Load world data
  useEffect(() => {
    async function loadWorldData() {
      try {
        // Fetch all world data in parallel
        const [
          charactersRes,
          countriesRes,
          settlementsRes,
          rulesRes,
          baseRulesRes,
          actionsRes,
          baseActionsRes,
          questsRes,
          configRes
        ] = await Promise.all([
          fetch(`/api/worlds/${worldId}/characters`),
          fetch(`/api/worlds/${worldId}/countries`),
          fetch(`/api/worlds/${worldId}/settlements`),
          fetch(`/api/rules?worldId=${worldId}`),
          fetch(`/api/rules/base`),
          fetch(`/api/worlds/${worldId}/actions`),
          fetch(`/api/actions/base`),
          fetch(`/api/worlds/${worldId}/quests`),
          fetch(`/api/worlds/${worldId}/base-resources/config`)
        ]);

        // Parse responses
        const characters = charactersRes.ok ? await charactersRes.json() : [];
        const countries = countriesRes.ok ? await countriesRes.json() : [];
        const settlements = settlementsRes.ok ? await settlementsRes.json() : [];
        const rules = rulesRes.ok ? await rulesRes.json() : [];
        let baseRules = baseRulesRes.ok ? await baseRulesRes.json() : [];
        const actions = actionsRes.ok ? await actionsRes.json() : [];
        let baseActions = baseActionsRes.ok ? await baseActionsRes.json() : [];
        const quests = questsRes.ok ? await questsRes.json() : [];
        const config = configRes.ok ? await configRes.json() : {};

        // Filter base rules/actions based on world config
        if (config.disabledBaseRules && config.disabledBaseRules.length > 0) {
          baseRules = baseRules.filter((r: any) => !config.disabledBaseRules.includes(r.id));
        }
        if (config.disabledBaseActions && config.disabledBaseActions.length > 0) {
          baseActions = baseActions.filter((a: any) => !config.disabledBaseActions.includes(a.id));
        }

        // Update world data
        setWorldData({
          countries,
          settlements,
          rules,
          baseRules,
          actions,
          baseActions,
          quests
        });
        
        // Place NPCs randomly on the map with full character data
        const npcs = characters.slice(0, 10).map((char: any, index: number) => ({
          id: char.id,
          firstName: char.firstName || 'Unknown',
          lastName: char.lastName || '',
          occupation: char.occupation || 'Resident',
          personality: char.personality || {},
          age: char.age || 'Unknown',
          questGiver: quests.some((q: any) => q.giverCharacterId === char.id),
          x: 200 + (index % 5) * 100,
          y: 200 + Math.floor(index / 5) * 100,
          sprite: 'npc'
        }));

        setGameState(prev => ({
          ...prev,
          npcs,
          player: {
            ...prev.player
          }
        }));

        // Initialize ActionManager
        const manager = new ActionManager(actions, baseActions);
        setActionManager(manager);

        setLoading(false);
      } catch (error) {
        console.error('Failed to load world data:', error);
        setLoading(false);
      }
    }

    loadWorldData();
  }, [worldId]);

  // Load social actions when dialogue opens
  useEffect(() => {
    if (gameState.dialogue?.visible && actionManager && gameState.dialogue.speakerId) {
      const context = {
        actor: 'player',
        target: gameState.dialogue.speakerId,
        timestamp: Date.now(),
        playerEnergy: gameState.player.energy,
        playerPosition: { x: gameState.player.x, y: gameState.player.y }
      };
      
      const socialActions = actionManager.getSocialActionsForNPC(gameState.dialogue.speakerId, context);
      setAvailableSocialActions(socialActions);
    } else {
      setAvailableSocialActions([]);
    }
  }, [gameState.dialogue?.visible, gameState.dialogue?.speakerId, actionManager, gameState.player.energy]);

  // Load mental actions when requested
  useEffect(() => {
    if (showMentalActionsMenu && actionManager) {
      const context = {
        actor: 'player',
        timestamp: Date.now(),
        playerEnergy: gameState.player.energy,
        playerPosition: { x: gameState.player.x, y: gameState.player.y }
      };
      
      const mentalActions = actionManager.getActionsByCategory('mental');
      setAvailableMentalActions(mentalActions);
    }
  }, [showMentalActionsMenu, actionManager, gameState.player.energy]);

  // Keyboard controls
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      
      // TAB key for mental actions menu
      if (key === 'tab') {
        e.preventDefault();
        if (!gameStateRef.current.dialogue) {
          setShowMentalActionsMenu(prev => !prev);
        }
        return;
      }
      
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' ', 'escape'].includes(key)) {
        e.preventDefault();
        keysPressed.current.add(key);
        console.log('Key pressed:', key, 'Keys:', Array.from(keysPressed.current));
        
        // Space bar for interaction or closing dialogue
        if (key === ' ') {
          if (gameStateRef.current.dialogue) {
            closeDialogue();
          } else {
            checkForInteraction();
          }
        }
        
        // Escape to close dialogue or mental menu
        if (key === 'escape') {
          if (gameStateRef.current.dialogue) {
            closeDialogue();
          } else if (showMentalActionsMenu) {
            setShowMentalActionsMenu(false);
          }
        }
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      keysPressed.current.delete(key);
      console.log('Key released:', key);
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.npcs, gameState.dialogue]);

  // Focus canvas on mount
  useEffect(() => {
    canvasRef.current?.focus();
  }, []);

  // Check for NPC interaction
  function checkForInteraction() {
    const { player, npcs } = gameState;
    
    // Find nearby NPCs (within interaction range)
    const nearbyNPC = npcs.find(npc => {
      const distance = Math.sqrt(
        Math.pow(npc.x - player.x, 2) + Math.pow(npc.y - player.y, 2)
      );
      return distance < INTERACTION_RANGE;
    });

    if (nearbyNPC) {
      // Generate contextual dialogue based on character data
      const generateDialogue = () => {
        const fullName = `${nearbyNPC.firstName} ${nearbyNPC.lastName}`;
        const occupation = (nearbyNPC as any).occupation || 'resident';
        const age = (nearbyNPC as any).age;
        
        const dialogueOptions = [
          `Hello! I'm ${fullName}. I work as a ${occupation} around here.`,
          `Greetings, traveler. ${nearbyNPC.firstName} at your service.`,
          `Oh, hello there! Name's ${nearbyNPC.firstName}. ${occupation === 'resident' ? "I live in this area." : `I'm a ${occupation}.`}`,
          `Welcome! I'm ${fullName}.${age ? ` I'm ${age} years old.` : ''}`,
          `*waves* Hi there! ${nearbyNPC.firstName} here. What brings you to our world?`,
          `Good day to you! ${fullName}, ${occupation}. Can I help you with something?`
        ];
        
        return dialogueOptions[Math.floor(Math.random() * dialogueOptions.length)];
      };
      
      setGameState(prev => ({
        ...prev,
        dialogue: {
          visible: true,
          speaker: `${nearbyNPC.firstName} ${nearbyNPC.lastName}`,
          speakerId: nearbyNPC.id,
          text: generateDialogue()
        }
      }));
    }
  }

  // Close dialogue
  function closeDialogue() {
    setGameState(prev => ({
      ...prev,
      dialogue: null
    }));
  }

  // Handle social action selection
  async function handleActionSelect(actionId: string) {
    if (!actionManager || !gameState.dialogue) return;

    const context = {
      actor: 'player',
      target: gameState.dialogue.speakerId,
      timestamp: Date.now(),
      playerEnergy: gameState.player.energy,
      playerPosition: { x: gameState.player.x, y: gameState.player.y }
    };

    // Perform the action
    const result = await actionManager.performAction(actionId, context);

    if (result.success) {
      // Update player energy
      setGameState(prev => ({
        ...prev,
        player: {
          ...prev.player,
          energy: Math.max(0, prev.player.energy - result.energyUsed)
        },
        dialogue: prev.dialogue ? {
          ...prev.dialogue,
          text: result.narrativeText || `${result.message}\n\n${prev.dialogue.text}`
        } : null
      }));

      // Show feedback
      console.log('Action result:', result);
    } else {
      console.error('Action failed:', result.message);
    }
  }

  // Handle mental action selection
  async function handleMentalActionSelect(actionId: string) {
    if (!actionManager) return;

    const context = {
      actor: 'player',
      timestamp: Date.now(),
      playerEnergy: gameState.player.energy,
      playerPosition: { x: gameState.player.x, y: gameState.player.y }
    };

    // Perform the action
    const result = await actionManager.performAction(actionId, context);

    if (result.success) {
      // Update player energy
      setGameState(prev => ({
        ...prev,
        player: {
          ...prev.player,
          energy: Math.max(0, prev.player.energy - result.energyUsed)
        }
      }));

      // Show feedback (could add a toast notification here)
      console.log('Mental action result:', result);
      
      // Apply effects (these would be more visible with proper UI feedback)
      if (result.effects.length > 0) {
        console.log('Effects applied:', result.effects);
      }
    } else {
      console.error('Mental action failed:', result.message);
    }
  }

  // Toggle fullscreen
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Render loop - just render based on current state
  useEffect(() => {
    function renderLoop() {
      render();
      animationFrameId.current = requestAnimationFrame(renderLoop);
    }

    renderLoop();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []); // Empty dependency array - run once and continuously
  
  // Movement loop - update position based on keys
  useEffect(() => {
    const interval = setInterval(() => {
      updatePlayer();
    }, 1000 / 60); // 60 FPS

    return () => clearInterval(interval);
  }, []);

  // Check if position collides with any NPC
  function wouldCollideWithNPC(newX: number, newY: number, npcs: Character[]): boolean {
    return npcs.some(npc => {
      const distance = Math.sqrt(
        Math.pow(npc.x - newX, 2) + Math.pow(npc.y - newY, 2)
      );
      return distance < 30; // Reduced hitbox for easier movement
    });
  }

  // Update player position
  function updatePlayer() {
    // Only update if there are keys pressed
    if (keysPressed.current.size === 0) return;

    setGameState(prev => {
      let { x, y, direction, moving } = prev.player;
      const originalX = x;
      const originalY = y;
      moving = false;
      let newX = x;
      let newY = y;

      if (keysPressed.current.has('arrowup') || keysPressed.current.has('w')) {
        newY -= PLAYER_SPEED;
        direction = 'up';
        moving = true;
      }
      if (keysPressed.current.has('arrowdown') || keysPressed.current.has('s')) {
        newY += PLAYER_SPEED;
        direction = 'down';
        moving = true;
      }
      if (keysPressed.current.has('arrowleft') || keysPressed.current.has('a')) {
        newX -= PLAYER_SPEED;
        direction = 'left';
        moving = true;
      }
      if (keysPressed.current.has('arrowright') || keysPressed.current.has('d')) {
        newX += PLAYER_SPEED;
        direction = 'right';
        moving = true;
      }

      // If no movement keys, skip update
      if (!moving) return prev;

      // Check collision separately for X and Y to allow sliding along NPCs
      if (wouldCollideWithNPC(newX, originalY, prev.npcs)) {
        newX = originalX; // Block X movement if it collides
      }
      if (wouldCollideWithNPC(originalX, newY, prev.npcs)) {
        newY = originalY; // Block Y movement if it collides
      }
      // If both axes collide, check diagonal
      if (newX !== originalX && newY !== originalY && wouldCollideWithNPC(newX, newY, prev.npcs)) {
        newX = originalX;
        newY = originalY;
      }

      // Apply the validated movement
      x = newX;
      y = newY;

      // Keep player within bounds
      x = Math.max(TILE_SIZE, Math.min(CANVAS_WIDTH - TILE_SIZE, x));
      y = Math.max(TILE_SIZE, Math.min(CANVAS_HEIGHT - TILE_SIZE, y));

      const newState = {
        ...prev,
        player: { 
          x, 
          y, 
          direction, 
          moving, 
          energy: prev.player.energy, 
          maxEnergy: prev.player.maxEnergy 
        }
      };
      
      // Update ref synchronously for immediate rendering
      gameStateRef.current = newState;
      
      return newState;
    });
  }

  // Helper function to draw environmental objects
  function drawEnvironment(ctx: CanvasRenderingContext2D) {
    // Draw paths/roads
    ctx.fillStyle = '#8b7355';
    ctx.fillRect(100, 0, 80, CANVAS_HEIGHT); // Vertical path
    ctx.fillRect(0, 250, CANVAS_WIDTH, 80); // Horizontal path
    
    // Draw some trees
    const trees = [
      { x: 50, y: 100 }, { x: 700, y: 100 }, { x: 50, y: 450 },
      { x: 700, y: 450 }, { x: 600, y: 50 }, { x: 650, y: 500 }
    ];
    
    trees.forEach(tree => {
      // Tree trunk
      ctx.fillStyle = '#654321';
      ctx.fillRect(tree.x - 5, tree.y, 10, 20);
      // Tree foliage
      ctx.fillStyle = '#228b22';
      ctx.beginPath();
      ctx.arc(tree.x, tree.y - 5, 18, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw buildings/houses representing settlements
    const buildings = [
      { x: 300, y: 100, width: 60, height: 50, color: '#8b4513', label: worldData.settlements[0]?.name || 'Town Hall' },
      { x: 500, y: 400, width: 70, height: 60, color: '#a0522d', label: worldData.settlements[1]?.name || 'Marketplace' }
    ];
    
    buildings.forEach(building => {
      // Building body
      ctx.fillStyle = building.color;
      ctx.fillRect(building.x, building.y, building.width, building.height);
      // Roof
      ctx.fillStyle = '#4a4a4a';
      ctx.beginPath();
      ctx.moveTo(building.x - 5, building.y);
      ctx.lineTo(building.x + building.width / 2, building.y - 20);
      ctx.lineTo(building.x + building.width + 5, building.y);
      ctx.closePath();
      ctx.fill();
      // Door
      ctx.fillStyle = '#654321';
      ctx.fillRect(building.x + building.width / 2 - 8, building.y + building.height - 20, 16, 20);
      
      // Building label
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      const labelWidth = ctx.measureText(building.label).width + 10;
      ctx.fillRect(building.x + building.width / 2 - labelWidth / 2, building.y - 35, labelWidth, 16);
      ctx.fillStyle = 'white';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(building.label, building.x + building.width / 2, building.y - 23);
    });
    
    // Draw world/country label in top-right
    if (worldData.countries.length > 0 || worldName) {
      const label = worldData.countries[0]?.name || worldName;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(CANVAS_WIDTH - 160, 10, 150, 30);
      ctx.fillStyle = 'gold';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(label, CANVAS_WIDTH - 85, 30);
    }
  }

  // Render game
  function render() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with grass texture
    ctx.fillStyle = '#3a5f0b'; // Darker grass
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Add grass pattern
    ctx.fillStyle = '#4a7c11';
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * CANVAS_WIDTH;
      const y = Math.random() * CANVAS_HEIGHT;
      ctx.fillRect(x, y, 2, 2);
    }

    // Draw environment (paths, trees, buildings)
    drawEnvironment(ctx);

    // Draw NPCs with variety
    gameStateRef.current.npcs.forEach((npc, index) => {
      // Vary clothing colors based on character
      const clothingColors = ['#8b4513', '#2c5aa0', '#5d3a1a', '#6b8e23', '#8b0000', '#4b0082'];
      const clothingColor = clothingColors[index % clothingColors.length];
      
      // Check if player is nearby for interaction indicator
      const distanceToPlayer = Math.sqrt(
        Math.pow(npc.x - gameStateRef.current.player.x, 2) + Math.pow(npc.y - gameStateRef.current.player.y, 2)
      );
      const isNearby = distanceToPlayer < INTERACTION_RANGE;
      
      // NPC body with shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(npc.x, npc.y + 5, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // NPC body
      ctx.fillStyle = clothingColor;
      ctx.fillRect(npc.x - 12, npc.y - 12, 24, 24);
      
      // NPC head
      ctx.fillStyle = '#ffdbac';
      ctx.beginPath();
      ctx.arc(npc.x, npc.y - 20, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Face details
      ctx.fillStyle = '#000';
      ctx.fillRect(npc.x - 3, npc.y - 22, 2, 2); // Left eye
      ctx.fillRect(npc.x + 1, npc.y - 22, 2, 2); // Right eye

      // NPC name label with background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(npc.x - 25, npc.y - 42, 50, 12);
      ctx.fillStyle = 'white';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(npc.firstName, npc.x, npc.y - 33);
      
      // Quest indicator for quest givers
      if ((npc as any).questGiver) {
        ctx.fillStyle = 'gold';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('!', npc.x + 18, npc.y - 15);
        
        // Gold glow effect
        ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
        ctx.shadowBlur = 5;
        ctx.fillText('!', npc.x + 18, npc.y - 15);
        ctx.shadowBlur = 0;
      }
      
      // Show interaction indicator if nearby
      if (isNearby) {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('💬', npc.x, npc.y - 50);
        
        // Pulsing circle
        const pulseSize = 35 + Math.sin(Date.now() / 200) * 5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(npc.x, npc.y, pulseSize, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // Draw player with enhanced sprite
    const { player } = gameStateRef.current;
    
    // Player shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(player.x, player.y + 5, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Player body with gradient effect
    const gradient = ctx.createLinearGradient(player.x - 12, player.y - 12, player.x + 12, player.y + 12);
    gradient.addColorStop(0, '#3b82f6');
    gradient.addColorStop(1, '#1d4ed8');
    ctx.fillStyle = gradient;
    ctx.fillRect(player.x - 12, player.y - 12, 24, 24);
    
    // Player head
    ctx.fillStyle = '#ffd7a8';
    ctx.beginPath();
    ctx.arc(player.x, player.y - 20, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Face details
    ctx.fillStyle = '#000';
    ctx.fillRect(player.x - 3, player.y - 22, 2, 2); // Left eye
    ctx.fillRect(player.x + 1, player.y - 22, 2, 2); // Right eye
    
    // Smile
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(player.x, player.y - 18, 3, 0, Math.PI);
    ctx.stroke();

    // Direction indicator (arrow)
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    if (player.direction === 'down') {
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(player.x - 4, player.y - 6);
      ctx.lineTo(player.x + 4, player.y - 6);
    } else if (player.direction === 'up') {
      ctx.moveTo(player.x, player.y - 30);
      ctx.lineTo(player.x - 4, player.y - 24);
      ctx.lineTo(player.x + 4, player.y - 24);
    } else if (player.direction === 'left') {
      ctx.moveTo(player.x - 18, player.y - 15);
      ctx.lineTo(player.x - 12, player.y - 19);
      ctx.lineTo(player.x - 12, player.y - 11);
    } else if (player.direction === 'right') {
      ctx.moveTo(player.x + 18, player.y - 15);
      ctx.lineTo(player.x + 12, player.y - 19);
      ctx.lineTo(player.x + 12, player.y - 11);
    }
    ctx.closePath();
    ctx.fill();

    // Player label with background
    ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
    ctx.fillRect(player.x - 15, player.y - 42, 30, 12);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('You', player.x, player.y - 33);
    
    // Draw control hint in top-left corner
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 180, 90);
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Controls:', 20, 30);
    ctx.font = '10px Arial';
    ctx.fillText('WASD / Arrow Keys: Move', 20, 50);
    ctx.fillText('SPACE: Talk to NPCs', 20, 65);
    ctx.fillText('TAB: Mental Actions', 20, 80);
    ctx.fillText(`NPCs nearby: ${gameStateRef.current.npcs.filter(npc => {
      const d = Math.sqrt(Math.pow(npc.x - player.x, 2) + Math.pow(npc.y - player.y, 2));
      return d < INTERACTION_RANGE;
    }).length}`, 20, 95);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading world...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Explore {worldName}</h1>
            <p className="text-muted-foreground">Walk around and interact with characters (Press SPACE)</p>
          </div>
          <Button onClick={toggleFullscreen} variant="outline">
            {isFullscreen ? '🗗 Exit Fullscreen' : '🗖 Fullscreen'}
          </Button>
        </div>

        <div ref={containerRef} className={`grid grid-cols-1 lg:grid-cols-4 gap-6 ${isFullscreen ? 'bg-background p-6' : ''}`}>
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Game View</CardTitle>
                  <CardDescription>Use arrow keys or WASD to move, SPACE to interact</CardDescription>
                </div>
                {!isFullscreen && (
                  <Button onClick={toggleFullscreen} variant="outline" size="sm">
                    🗖 Fullscreen
                  </Button>
                )}
              </CardHeader>
              <CardContent className="flex justify-center relative">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  className="border border-border rounded-lg max-w-full"
                  style={{ imageRendering: 'pixelated' }}
                  tabIndex={0}
                />
                
                {/* Mental Actions Radial Menu Overlay */}
                {showMentalActionsMenu && (
                  <ActionRadialMenu
                    actions={availableMentalActions}
                    playerPosition={{ 
                      x: (gameState.player.x / CANVAS_WIDTH) * canvasRef.current!.clientWidth,
                      y: (gameState.player.y / CANVAS_HEIGHT) * canvasRef.current!.clientHeight
                    }}
                    onActionSelect={handleMentalActionSelect}
                    onClose={() => setShowMentalActionsMenu(false)}
                    playerEnergy={gameState.player.energy}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Game Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-semibold mb-1">Controls:</p>
                    <p>• <strong>Move:</strong> Arrow Keys or WASD</p>
                    <p>• <strong>Interact:</strong> SPACE</p>
                    <p>• <strong>Mental Actions:</strong> TAB</p>
                  </div>
                  <div className="border-t pt-2">
                    <p className="font-semibold mb-1">Player Stats:</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span>⚡ Energy:</span>
                        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-primary h-full transition-all"
                            style={{ width: `${(gameState.player.energy / gameState.player.maxEnergy) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs">{gameState.player.energy}/{gameState.player.maxEnergy}</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t pt-2">
                    <p className="font-semibold mb-1">Tips:</p>
                    <p>• Look for 💬 icon above nearby NPCs</p>
                    <p>• Gold ! marks quest givers</p>
                    <p>• Pulsing circle shows interaction range</p>
                    <p>• Social actions cost energy</p>
                  </div>
                  <div className="border-t pt-2">
                    <p className="font-semibold mb-1">Authoring Progress:</p>
                    <div className="space-y-1">
                      <p>🌍 Countries: {worldData.countries.length}</p>
                      <p>🏘️ Settlements: {worldData.settlements.length}</p>
                      <p>👥 Characters: {gameState.npcs.length}</p>
                      <p>📜 Rules: {worldData.rules.length + worldData.baseRules.length}</p>
                      <p className="text-xs text-muted-foreground pl-4">
                        ({worldData.rules.length} custom + {worldData.baseRules.length} base)
                      </p>
                      <p>⚡ Actions: {worldData.actions.length + worldData.baseActions.length}</p>
                      <p className="text-xs text-muted-foreground pl-4">
                        ({worldData.actions.length} custom + {worldData.baseActions.length} base)
                      </p>
                      <p>🎯 Quests: {worldData.quests.length}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {gameState.dialogue && (
              <Card className="mt-4 border-2 border-primary animate-in slide-in-from-right">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    💬 {gameState.dialogue.speaker}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 leading-relaxed">{gameState.dialogue.text}</p>
                  
                  {/* Social Actions */}
                  {availableSocialActions.length > 0 && (
                    <DialogueActions
                      actions={availableSocialActions}
                      onActionSelect={handleActionSelect}
                      playerEnergy={gameState.player.energy}
                    />
                  )}
                  
                  <Button onClick={closeDialogue} className="w-full mt-2">
                    Continue (SPACE or Click)
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {!gameState.dialogue && (
              <Card className="mt-4 bg-muted/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground text-center italic">
                    Walk near a character and press SPACE to start a conversation!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
