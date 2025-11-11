import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft } from 'lucide-react';

interface PhaserRPGGameProps {
  worldId: string;
  worldName: string;
  onBack: () => void;
}

interface Character {
  id: string;
  firstName: string;
  lastName: string;
  occupation?: string;
  age?: number | string;
}

interface WorldData {
  countries: any[];
  settlements: any[];
  rules: any[];
  baseRules: any[];
  actions: any[];
  baseActions: any[];
  quests: any[];
  characters: Character[];
}

export function PhaserRPGGame({ worldId, worldName, onBack }: PhaserRPGGameProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [worldData, setWorldData] = useState<WorldData>({
    countries: [],
    settlements: [],
    rules: [],
    baseRules: [],
    actions: [],
    baseActions: [],
    quests: [],
    characters: []
  });
  const [dialogueData, setDialogueData] = useState<{ speaker: string; text: string } | null>(null);

  // Load world data
  useEffect(() => {
    async function loadWorldData() {
      try {
        // Fetch core data (always needed)
        const [charactersRes, countriesRes, settlementsRes, rulesRes, actionsRes, questsRes] = await Promise.all([
          fetch(`/api/worlds/${worldId}/characters`),
          fetch(`/api/worlds/${worldId}/countries`),
          fetch(`/api/worlds/${worldId}/settlements`),
          fetch(`/api/rules?worldId=${worldId}`),
          fetch(`/api/worlds/${worldId}/actions`),
          fetch(`/api/worlds/${worldId}/quests`)
        ]);

        const characters = charactersRes.ok ? await charactersRes.json() : [];
        const countries = countriesRes.ok ? await countriesRes.json() : [];
        const settlements = settlementsRes.ok ? await settlementsRes.json() : [];
        const rules = rulesRes.ok ? await rulesRes.json() : [];
        const actions = actionsRes.ok ? await actionsRes.json() : [];
        const quests = questsRes.ok ? await questsRes.json() : [];

        // Try to fetch base resources (optional, may not exist)
        let baseRules: any[] = [];
        let baseActions: any[] = [];
        
        try {
          const baseRulesRes = await fetch(`/api/rules/base`);
          if (baseRulesRes.ok) {
            baseRules = await baseRulesRes.json();
          }
        } catch (e) {
          console.log('Base rules not available:', e);
        }

        try {
          const baseActionsRes = await fetch(`/api/actions/base`);
          if (baseActionsRes.ok) {
            baseActions = await baseActionsRes.json();
          }
        } catch (e) {
          console.log('Base actions not available:', e);
        }

        // Try to fetch config (optional)
        let config: any = {};
        try {
          const configRes = await fetch(`/api/worlds/${worldId}/base-resources/config`);
          if (configRes.ok) {
            config = await configRes.json();
          }
        } catch (e) {
          console.log('Base resources config not available:', e);
        }

        // Filter base resources if config exists
        if (config.disabledBaseRules?.length > 0) {
          baseRules = baseRules.filter((r: any) => !config.disabledBaseRules.includes(r.id));
        }
        if (config.disabledBaseActions?.length > 0) {
          baseActions = baseActions.filter((a: any) => !config.disabledBaseActions.includes(a.id));
        }

        setWorldData({
          countries,
          settlements,
          rules,
          baseRules,
          actions,
          baseActions,
          quests,
          characters: characters.slice(0, 10)
        });

        setLoading(false);
      } catch (error) {
        console.error('Failed to load world data:', error);
        setLoading(false);
      }
    }

    loadWorldData();
  }, [worldId]);

  // Initialize Phaser game
  useEffect(() => {
    if (loading || !containerRef.current) return;

    class GameScene extends Phaser.Scene {
      private player!: Phaser.GameObjects.Sprite;
      private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
      private wasd!: { w: Phaser.Input.Keyboard.Key; a: Phaser.Input.Keyboard.Key; s: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key };
      private npcs: Phaser.GameObjects.Sprite[] = [];
      private spaceKey!: Phaser.Input.Keyboard.Key;

      constructor() {
        super({ key: 'GameScene' });
      }

      preload() {
        // Create sprites locally instead of loading from external sources
      }

      createCharacterSprite(key: string, skinColor: number, shirtColor: number, hairColor: number, hairStyle: 'short' | 'long' | 'bald' = 'short') {
        const graphics = this.add.graphics();
        const size = 48;
        
        // Enhanced character sprite with better proportions
        // Legs (pants)
        graphics.fillStyle(0x2c3e50, 1);
        graphics.fillRect(14, 32, 8, 12); // Left leg
        graphics.fillRect(26, 32, 8, 12); // Right leg
        
        // Shoes
        graphics.fillStyle(0x1a1a1a, 1);
        graphics.fillRect(14, 42, 8, 4);
        graphics.fillRect(26, 42, 8, 4);
        
        // Body/Shirt
        graphics.fillStyle(shirtColor, 1);
        graphics.fillRect(12, 18, 24, 14);
        
        // Neck
        graphics.fillStyle(skinColor, 1);
        graphics.fillRect(20, 16, 8, 3);
        
        // Arms
        graphics.fillStyle(skinColor, 1);
        graphics.fillRect(8, 20, 5, 10);  // Left arm
        graphics.fillRect(35, 20, 5, 10); // Right arm
        
        // Hands
        graphics.fillCircle(10, 30, 3);
        graphics.fillCircle(38, 30, 3);
        
        // Head
        graphics.fillStyle(skinColor, 1);
        graphics.fillCircle(24, 12, 8);
        
        // Hair
        if (hairStyle !== 'bald') {
          graphics.fillStyle(hairColor, 1);
          if (hairStyle === 'short') {
            graphics.fillCircle(24, 8, 8);
            graphics.fillRect(16, 6, 16, 6);
          } else { // long
            graphics.fillCircle(24, 8, 8);
            graphics.fillRect(16, 6, 16, 10);
            graphics.fillRect(16, 14, 4, 4); // Side hair
            graphics.fillRect(28, 14, 4, 4);
          }
        }
        
        // Eyes
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(20, 12, 2);
        graphics.fillCircle(28, 12, 2);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(20, 12, 1);
        graphics.fillCircle(28, 12, 1);
        
        // Smile
        graphics.lineStyle(1, 0x000000, 1);
        graphics.beginPath();
        graphics.arc(24, 12, 4, 0.2, Math.PI - 0.2);
        graphics.strokePath();
        
        graphics.generateTexture(key, size, size);
        graphics.destroy();
      }

      create() {
        // Create character sprites
        const characterStyles = [
          // Player
          { key: 'player', skin: 0xfdbcb4, shirt: 0x3b82f6, hair: 0x8b4513, style: 'short' as const },
          // NPCs with varied appearances
          { key: 'npc0', skin: 0xfdbcb4, shirt: 0x8b4513, hair: 0x2c1810, style: 'short' as const },
          { key: 'npc1', skin: 0xfdbcb4, shirt: 0x2c5aa0, hair: 0xffd700, style: 'long' as const },
          { key: 'npc2', skin: 0xd4a574, shirt: 0x5d3a1a, hair: 0x1a0f08, style: 'short' as const },
          { key: 'npc3', skin: 0xfdbcb4, shirt: 0x6b8e23, hair: 0x8b4513, style: 'short' as const },
          { key: 'npc4', skin: 0xe0ac69, shirt: 0x8b0000, hair: 0x2c1810, style: 'bald' as const },
          { key: 'npc5', skin: 0xfdbcb4, shirt: 0x4b0082, hair: 0xff6b35, style: 'long' as const },
          { key: 'npc6', skin: 0xd4a574, shirt: 0x2f4f4f, hair: 0x9e9e9e, style: 'short' as const },
          { key: 'npc7', skin: 0xfdbcb4, shirt: 0x8b008b, hair: 0xffd700, style: 'long' as const },
          { key: 'npc8', skin: 0xe0ac69, shirt: 0x556b2f, hair: 0x654321, style: 'short' as const },
          { key: 'npc9', skin: 0xfdbcb4, shirt: 0xff6347, hair: 0xdaa520, style: 'long' as const }
        ];
        
        characterStyles.forEach(style => {
          this.createCharacterSprite(style.key, style.skin, style.shirt, style.hair, style.style);
        });
        
        // Draw background
        this.add.rectangle(400, 300, 800, 600, 0x3a5f0b);

        // Draw paths
        this.add.rectangle(140, 300, 80, 600, 0x8b7355);
        this.add.rectangle(400, 290, 800, 80, 0x8b7355);

        // Draw trees
        const treePositions = [
          { x: 50, y: 100 }, { x: 700, y: 100 }, { x: 50, y: 450 },
          { x: 700, y: 450 }, { x: 600, y: 50 }, { x: 650, y: 500 }
        ];
        treePositions.forEach(pos => {
          this.add.circle(pos.x, pos.y, 18, 0x228b22);
        });

        // Create player - spawn away from NPCs
        this.player = this.add.sprite(100, 500, 'player');
        this.player.setData('speed', 3);
        this.player.setDepth(10);

        // Create NPCs from world data
        worldData.characters.forEach((char, index) => {
          const npcIndex = index % 10;
          const x = 200 + (index % 5) * 100;
          const y = 200 + Math.floor(index / 5) * 100;
          
          const npc = this.add.sprite(x, y, `npc${npcIndex}`);
          
          // Store character data
          npc.setData('character', char);
          npc.setData('questGiver', worldData.quests.some((q: any) => q.giverCharacterId === char.id));
          
          // Add name label
          const text = this.add.text(x, y - 30, char.firstName, {
            fontSize: '12px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 4, y: 2 }
          }).setOrigin(0.5);

          // Quest indicator
          if (npc.getData('questGiver')) {
            this.add.text(x + 20, y - 20, '!', {
              fontSize: '20px',
              color: '#ffd700',
              fontStyle: 'bold'
            }).setOrigin(0.5);
          }

          this.npcs.push(npc);
        });

        // Input
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.wasd = {
          w: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
          a: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
          s: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
          d: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };
        this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Handle space for interaction
        this.spaceKey.on('down', () => {
          this.checkInteraction();
        });

        // Add world label
        const countryName = worldData.countries[0]?.name || worldName;
        this.add.text(700, 20, countryName, {
          fontSize: '16px',
          color: '#ffd700',
          fontStyle: 'bold',
          backgroundColor: '#000000',
          padding: { x: 8, y: 4 }
        }).setOrigin(0.5);
      }

      update() {
        if (!this.player) return;

        // Movement
        let velocityX = 0;
        let velocityY = 0;

        if (this.cursors.left.isDown || this.wasd.a.isDown) {
          velocityX = -this.player.getData('speed');
        } else if (this.cursors.right.isDown || this.wasd.d.isDown) {
          velocityX = this.player.getData('speed');
        }

        if (this.cursors.up.isDown || this.wasd.w.isDown) {
          velocityY = -this.player.getData('speed');
        } else if (this.cursors.down.isDown || this.wasd.s.isDown) {
          velocityY = this.player.getData('speed');
        }

        // Only move if there's input
        if (velocityX === 0 && velocityY === 0) return;

        // Apply movement with collision check
        const newX = this.player.x + velocityX;
        const newY = this.player.y + velocityY;

        // Check collision with NPCs
        let collided = false;
        for (const npc of this.npcs) {
          const distance = Phaser.Math.Distance.Between(newX, newY, npc.x, npc.y);
          if (distance < 45) {
            collided = true;
            break;
          }
        }

        if (!collided) {
          this.player.x = Phaser.Math.Clamp(newX, 32, 768);
          this.player.y = Phaser.Math.Clamp(newY, 32, 568);
        }
      }

      checkInteraction() {
        for (const npc of this.npcs) {
          const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
          if (distance < 65) {
            const char = npc.getData('character') as Character;
            const greetings = [
              `Hello! I'm ${char.firstName} ${char.lastName || ''}.`,
              char.occupation ? `I work as a ${char.occupation} around here.` : '',
              char.age ? `I'm ${char.age} years old.` : ''
            ].filter(Boolean).join(' ');
            
            setDialogueData({
              speaker: char.firstName,
              text: greetings
            });
            break;
          }
        }
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: containerRef.current,
      backgroundColor: '#2d5016',
      scene: GameScene,
      physics: {
        default: 'arcade',
        arcade: {
          debug: false
        }
      }
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [loading, worldData]);

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
            <p className="text-muted-foreground">Use arrow keys or WASD to move, SPACE to interact</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Game View</CardTitle>
                <CardDescription>Powered by Phaser</CardDescription>
              </CardHeader>
              <CardContent>
                <div ref={containerRef} className="border border-border rounded-lg overflow-hidden" />
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
                  </div>
                  <div className="border-t pt-2">
                    <p className="font-semibold mb-1">Authoring Progress:</p>
                    <div className="space-y-1">
                      <p>🌍 Countries: {worldData.countries.length}</p>
                      <p>🏘️ Settlements: {worldData.settlements.length}</p>
                      <p>👥 Characters: {worldData.characters.length}</p>
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

            {dialogueData && (
              <Card className="mt-4 border-2 border-primary">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    💬 {dialogueData.speaker}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 leading-relaxed">{dialogueData.text}</p>
                  <Button onClick={() => setDialogueData(null)} className="w-full">
                    Continue (SPACE or Click)
                  </Button>
                </CardContent>
              </Card>
            )}

            {!dialogueData && (
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
