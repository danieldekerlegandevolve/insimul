import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import {
  AbstractMesh,
  ArcRotateCamera,
  Color3,
  Color4,
  DirectionalLight,
  DynamicTexture,
  Engine,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  PointerEventTypes,
  Ray,
  Scene,
  SceneLoader,
  Skeleton,
  Sound,
  StandardMaterial,
  Texture,
  Vector3
} from "babylonjs";
import "@babylonjs/loaders/glTF";
import { GLTFFileLoader } from "@babylonjs/loaders/glTF";

GLTFFileLoader.IncrementalLoading = false;
SceneLoader.RegisterPlugin(new GLTFFileLoader());

import { CharacterController } from "@/components/3D/src/CharacterController";
import { Action, ActionContext, ActionResult } from "@/components/rpg/types/actions";
import { ActionManager } from "@/components/rpg/actions/ActionManager";
import { TextureManager } from "@/components/3DGame/TextureManager";
import { BabylonGUIManager } from "@/components/3DGame/BabylonGUIManager";
import { BabylonChatPanel } from "@/components/3DGame/BabylonChatPanel";
import { BabylonQuestTracker } from "@/components/3DGame/BabylonQuestTracker";
import { BabylonRadialMenu } from "@/components/3DGame/BabylonRadialMenu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { VisualAsset } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";

interface BabylonWorldProps {
  worldId: string;
  worldName: string;
  worldType?: string;
  userId?: string;
  onBack: () => void;
}

type SceneStatus = "idle" | "loading" | "ready" | "error";
type DataStatus = SceneStatus;
type PlayerStatus = SceneStatus;
type NPCStatus = SceneStatus;

interface WorldCharacter {
  id: string;
  firstName?: string;
  lastName?: string;
  occupation?: string;
  faction?: string;
  disposition?: string;
}

interface QuestSummary {
  id: string;
  name?: string;
  giverCharacterId?: string;
  status?: string;
}

interface SettlementSummary {
  id: string;
  name: string;
  settlementType?: string;
  terrain?: string;
  population?: number;
}

interface WorldData {
  characters: WorldCharacter[];
  actions: Action[];
  baseActions: Action[];
  quests: QuestSummary[];
  settlements: SettlementSummary[];
  rules: any[];
  baseRules: any[];
  countries: any[];
}

interface ActionCategorySummary {
  category: string;
  count: number;
}

interface SampleAction {
  id: string;
  name: string;
  description: string | null;
  actionType: Action["actionType"];
  energyCost: number | null;
}

interface NPCDisplayInfo {
  id: string;
  name: string;
  occupation?: string;
  disposition?: string;
  questGiver: boolean;
  position: { x: number; z: number };
}

interface NPCInstance {
  mesh: Mesh;
  controller?: CharacterController | null;
  questMarker?: Mesh | null;
}

interface ActionFeedback {
  actionId: string;
  actionName: string;
  targetName: string;
  result: ActionResult;
  timestamp: number;
}

interface WorldVisualTheme {
  groundColor: Color3;
  skyColor: Color3;
  roadColor: Color3;
  roadRadius: number;
  settlementBaseColor: Color3;
  settlementRoofColor: Color3;
}

function getWorldVisualTheme(worldType?: string): WorldVisualTheme {
  const type = (worldType || "").toLowerCase();

  // Cyberpunk / sci-fi space: darker ground, cooler sky, brighter roads
  if (type.includes("cyberpunk") || type.includes("sci-fi") || type.includes("space")) {
    return {
      groundColor: new Color3(0.12, 0.12, 0.16),
      skyColor: new Color3(0.05, 0.08, 0.16),
      roadColor: new Color3(0.18, 0.2, 0.32),
      roadRadius: 1.4,
      settlementBaseColor: new Color3(0.25, 0.4, 0.7),
      settlementRoofColor: new Color3(0.5, 0.2, 0.7)
    };
  }

  // Post‑apocalyptic / wild west: dusty ground, desaturated sky, pale roads
  if (type.includes("post-apocalyptic") || type.includes("wild-west")) {
    return {
      groundColor: new Color3(0.6, 0.54, 0.4),
      skyColor: new Color3(0.78, 0.7, 0.55),
      roadColor: new Color3(0.45, 0.36, 0.26),
      roadRadius: 1.3,
      settlementBaseColor: new Color3(0.55, 0.4, 0.25),
      settlementRoofColor: new Color3(0.3, 0.18, 0.12)
    };
  }

  // Solarpunk / optimistic futures: greener ground, brighter sky, soft roads
  if (type.includes("solarpunk")) {
    return {
      groundColor: new Color3(0.35, 0.6, 0.35),
      skyColor: new Color3(0.55, 0.8, 0.95),
      roadColor: new Color3(0.5, 0.6, 0.5),
      roadRadius: 1.1,
      settlementBaseColor: new Color3(0.45, 0.7, 0.5),
      settlementRoofColor: new Color3(0.7, 0.85, 0.6)
    };
  }

  // Historical / medieval / fantasy defaults: earthy ground, blue sky, brown roads
  if (
    type.includes("medieval") ||
    type.includes("fantasy") ||
    type.includes("historical") ||
    type.includes("mythological")
  ) {
    return {
      groundColor: new Color3(0.45, 0.7, 0.38),
      skyColor: new Color3(0.4, 0.6, 0.9),
      roadColor: new Color3(0.38, 0.3, 0.22),
      roadRadius: 1.2,
      settlementBaseColor: new Color3(0.7, 0.55, 0.35),
      settlementRoofColor: new Color3(0.4, 0.2, 0.15)
    };
  }

  // Modern realistic / superhero / urban fantasy: slightly cooler ground, neutral sky
  if (
    type.includes("modern") ||
    type.includes("superhero") ||
    type.includes("urban-fantasy")
  ) {
    return {
      groundColor: new Color3(0.3, 0.55, 0.38),
      skyColor: new Color3(0.5, 0.7, 0.95),
      roadColor: new Color3(0.2, 0.22, 0.28),
      roadRadius: 1.3,
      settlementBaseColor: new Color3(0.6, 0.6, 0.65),
      settlementRoofColor: new Color3(0.25, 0.25, 0.3)
    };
  }

  // Default theme
  return {
    groundColor: new Color3(0.9, 0.6, 0.4),
    skyColor: new Color3(0.4, 0.6, 0.9),
    roadColor: new Color3(0.35, 0.28, 0.2),
    roadRadius: 1.2,
    settlementBaseColor: new Color3(0.8, 0.55, 0.35),
    settlementRoofColor: new Color3(0.4, 0.2, 0.15)
  };
}

function createSeededRandom(seed: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PLAYER_MODEL_URL = "/assets/player/Vincent-frontFacing.babylon";
const NPC_MODEL_URL = "/assets/npc/starterAvatars.babylon";
const FOOTSTEP_SOUND_URL = "/assets/footstep_carpet_000.ogg";
const MAX_NPCS = 8;
const MAX_SETTLEMENTS_3D = 16;
const DEFAULT_PLAYER_ID = "player";
const INITIAL_ENERGY = 100;

export function BabylonWorld({ worldId, worldName, worldType, onBack }: BabylonWorldProps) {
  const { toast } = useToast();
  const { token } = useAuth();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<ArcRotateCamera | null>(null);
  const actionManagerRef = useRef<ActionManager | null>(null);
  const textureManagerRef = useRef<TextureManager | null>(null);
  const playerControllerRef = useRef<CharacterController | null>(null);
  const playerMeshRef = useRef<Mesh | null>(null);
  const npcMeshesRef = useRef<Map<string, NPCInstance>>(new Map());
  const settlementMeshesRef = useRef<Map<string, Mesh>>(new Map());
  const settlementRoadMeshesRef = useRef<Mesh[]>([]);
  const guiManagerRef = useRef<BabylonGUIManager | null>(null);
  const chatPanelRef = useRef<BabylonChatPanel | null>(null);
  const questTrackerRef = useRef<BabylonQuestTracker | null>(null);
  const radialMenuRef = useRef<BabylonRadialMenu | null>(null);

  const [sceneStatus, setSceneStatus] = useState<SceneStatus>("idle");
  const [sceneErrorMessage, setSceneErrorMessage] = useState<string>("");

  const [dataStatus, setDataStatus] = useState<DataStatus>("idle");
  const [worldError, setWorldError] = useState<string>("");
  const [worldData, setWorldData] = useState<WorldData | null>(null);
  const [terrainSize, setTerrainSize] = useState<number>(512);

  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>("idle");
  const [playerError, setPlayerError] = useState<string>("");
  const [playerEnergy, setPlayerEnergy] = useState<number>(INITIAL_ENERGY);

  const [npcStatus, setNPCStatus] = useState<NPCStatus>("idle");
  const [npcInfos, setNPCInfos] = useState<NPCDisplayInfo[]>([]);
  const [selectedNPCId, setSelectedNPCId] = useState<string | null>(null);

  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);
  const [actionInProgress, setActionInProgress] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [playthroughId, setPlaythroughId] = useState<string | null>(null);

  const [availableTextures, setAvailableTextures] = useState<VisualAsset[]>([]);
  const [selectedGroundTexture, setSelectedGroundTexture] = useState<string | null>(null);
  const [selectedWallTexture, setSelectedWallTexture] = useState<string | null>(null);
  const [selectedRoadTexture, setSelectedRoadTexture] = useState<string | null>(null);
  const [showTexturePanel, setShowTexturePanel] = useState<boolean>(false);

  const [characterPortraits, setCharacterPortraits] = useState<Map<string, VisualAsset>>(new Map());
  const [showCharacterDetail, setShowCharacterDetail] = useState<boolean>(false);

  const worldTheme = useMemo(() => getWorldVisualTheme(worldType), [worldType]);

  const initializeScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setSceneStatus("loading");
    setSceneErrorMessage("");

    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    const scene = new Scene(engine);

    engineRef.current = engine;
    sceneRef.current = scene;

    try {
      const camera = setupScene(scene, canvas, worldTheme);
      cameraRef.current = camera;

      // Initialize TextureManager
      const textureManager = new TextureManager(scene);
      textureManagerRef.current = textureManager;

      engine.runRenderLoop(() => {
        if (scene.activeCamera) {
          scene.render();
        }
      });

      const handleResize = () => engine.resize();
      window.addEventListener("resize", handleResize);

      scene.onDisposeObservable.add(() => {
        window.removeEventListener("resize", handleResize);
      });

      // Initialize GUI manager
      const guiManager = new BabylonGUIManager(scene, {
        worldName,
        worldId
      });

      // Set up GUI callbacks
      guiManager.setOnBackPressed(() => onBack());
      guiManager.setOnFullscreenPressed(() => handleToggleFullscreen());
      guiManager.setOnDebugPressed(() => handleToggleDebug());
      guiManager.setOnNPCSelected((npcId) => setSelectedNPCId(npcId));
      guiManager.setOnActionSelected((actionId) => handlePerformAction(actionId));

      guiManagerRef.current = guiManager;

      // Initialize chat panel
      const chatPanel = new BabylonChatPanel(guiManager.advancedTexture, scene);
      chatPanel.setOnClose(() => {
        console.log('Chat closed');
      });
      chatPanel.setOnQuestAssigned((questData) => {
        // Refresh quest tracker when new quest is assigned
        questTrackerRef.current?.updateQuests(worldId);
        toast({
          title: 'New Quest!',
          description: questData.title || 'Quest assigned',
        });
      });
      chatPanel.setOnActionSelect((actionId: string) => {
        // Handle action selection from chat panel
        handlePerformAction(actionId);
      });
      chatPanelRef.current = chatPanel;

      // Initialize quest tracker
      const questTracker = new BabylonQuestTracker(guiManager.advancedTexture, scene);
      questTracker.setOnClose(() => {
        console.log('Quest tracker closed');
      });
      questTrackerRef.current = questTracker;

      // Initialize radial menu
      const radialMenu = new BabylonRadialMenu(scene);
      radialMenuRef.current = radialMenu;

      setSceneStatus("ready");
    } catch (error) {
      console.error("Failed to initialize Babylon scene", error);
      setSceneStatus("error");
      setSceneErrorMessage(error instanceof Error ? error.message : String(error));
    }
  }, [worldTheme, worldName, worldId, onBack]);

  useEffect(() => {
    initializeScene();

    return () => {
      textureManagerRef.current?.dispose();
      textureManagerRef.current = null;
      chatPanelRef.current?.dispose();
      chatPanelRef.current = null;
      questTrackerRef.current?.dispose();
      questTrackerRef.current = null;
      radialMenuRef.current?.dispose();
      radialMenuRef.current = null;
      guiManagerRef.current?.dispose();
      guiManagerRef.current = null;
      sceneRef.current?.dispose();
      engineRef.current?.dispose();
      sceneRef.current = null;
      engineRef.current = null;
      cameraRef.current = null;
      actionManagerRef.current = null;
      disposePlayerResources(playerControllerRef, playerMeshRef);
      disposeAllNPCMeshes(npcMeshesRef);
      disposeAllSettlementMeshes(settlementMeshesRef);
      disposeAllSettlementRoadMeshes(settlementRoadMeshesRef);
      setSceneStatus("idle");
      setPlayerStatus("idle");
      setNPCStatus("idle");
    };
  }, [initializeScene, worldId, toast]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Load available textures when scene is ready
  useEffect(() => {
    if (sceneStatus !== "ready" || !textureManagerRef.current) return;

    let cancelled = false;

    async function loadTextures() {
      const textureManager = textureManagerRef.current;
      if (!textureManager) return;

      try {
        const textures = await textureManager.fetchWorldTextures(worldId);
        if (cancelled) return;
        setAvailableTextures(textures);

        // Auto-select first ground texture if available
        const groundTexture = textures.find(t => t.assetType === 'texture_ground');
        if (groundTexture) {
          setSelectedGroundTexture(groundTexture.id);
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load textures", error);
      }
    }

    loadTextures();

    return () => {
      cancelled = true;
    };
  }, [sceneStatus, worldId]);

  // Load character portraits when world data is ready
  useEffect(() => {
    if (!worldData || worldData.characters.length === 0) return;

    let cancelled = false;

    async function loadCharacterPortraits() {
      const portraitMap = new Map<string, VisualAsset>();

      try {
        // Fetch portraits for all characters
        const portraitPromises = worldData.characters.slice(0, MAX_NPCS).map(async (character) => {
          try {
            const response = await fetch(`/api/assets/character/${character.id}`);
            if (response.ok) {
              const assets: VisualAsset[] = await response.json();
              const portrait = assets.find(a =>
                a.assetType === 'character_portrait' || a.assetType === 'character_full_body'
              );
              if (portrait) {
                return { characterId: character.id, portrait };
              }
            }
          } catch (error) {
            console.error(`Failed to load portrait for character ${character.id}:`, error);
          }
          return null;
        });

        const results = await Promise.all(portraitPromises);

        if (cancelled) return;

        results.forEach(result => {
          if (result) {
            portraitMap.set(result.characterId, result.portrait);
          }
        });

        setCharacterPortraits(portraitMap);
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load character portraits", error);
      }
    }

    loadCharacterPortraits();

    return () => {
      cancelled = true;
    };
  }, [worldData]);

  useEffect(() => {
    let cancelled = false;

    async function loadWorldData() {
      setDataStatus("loading");
      setWorldError("");

      try {
        const [
          charactersRes,
          actionsRes,
          baseActionsRes,
          questsRes,
          settlementsRes,
          rulesRes,
          baseRulesRes,
          countriesRes,
          configRes
        ] = await Promise.all([
          fetch(`/api/worlds/${worldId}/characters`),
          fetch(`/api/worlds/${worldId}/actions`),
          fetch(`/api/actions/base`),
          fetch(`/api/worlds/${worldId}/quests`),
          fetch(`/api/worlds/${worldId}/settlements`),
          fetch(`/api/rules?worldId=${worldId}`),
          fetch(`/api/rules/base`),
          fetch(`/api/worlds/${worldId}/countries`),
          fetch(`/api/worlds/${worldId}/base-resources/config`)
        ]);

        const characters = charactersRes.ok ? await charactersRes.json() : [];
        const actions = actionsRes.ok ? await actionsRes.json() : [];
        let baseActions = baseActionsRes.ok ? await baseActionsRes.json() : [];
        const quests = questsRes.ok ? await questsRes.json() : [];
        const settlements = settlementsRes.ok ? await settlementsRes.json() : [];
        let rules = rulesRes.ok ? await rulesRes.json() : [];
        let baseRules = baseRulesRes.ok ? await baseRulesRes.json() : [];
        const countries = countriesRes.ok ? await countriesRes.json() : [];
        const config = configRes.ok ? await configRes.json() : {};

        if (Array.isArray(config.disabledBaseActions) && config.disabledBaseActions.length > 0) {
          baseActions = baseActions.filter((action: Action) => !config.disabledBaseActions.includes(action.id));
        }

        if (Array.isArray(config.disabledBaseRules) && config.disabledBaseRules.length > 0) {
          baseRules = baseRules.filter((rule: any) => !config.disabledBaseRules.includes(rule.id));
        }

        if (cancelled) return;

        const manager = new ActionManager(actions, baseActions);
        actionManagerRef.current = manager;

        setWorldData({
          characters,
          actions,
          baseActions,
          quests,
          settlements,
          rules,
          baseRules,
          countries
        });
        setTerrainSize(computeTerrainSizeFromSettlements(settlements, worldType));
        setDataStatus("ready");
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load world data", error);
        setWorldError(error instanceof Error ? error.message : String(error));
        setDataStatus("error");
      }
    }

    loadWorldData();

    return () => {
      cancelled = true;
      actionManagerRef.current = null;
    };
  }, [worldId]);

  // Start or resume playthrough
  useEffect(() => {
    if (!token || !worldId) return;

    async function startPlaythrough() {
      try {
        const response = await fetch(`/api/worlds/${worldId}/playthroughs/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: `${worldName} - Playthrough`,
          }),
        });

        if (response.ok) {
          const playthrough = await response.json();
          setPlaythroughId(playthrough.id);
        } else {
          console.error('Failed to start playthrough:', await response.text());
        }
      } catch (error) {
        console.error('Error starting playthrough:', error);
      }
    }

    startPlaythrough();
  }, [token, worldId, worldName]);

  useEffect(() => {
    if (sceneStatus !== "ready") {
      setPlayerStatus("idle");
      setPlayerError("");
      return;
    }

    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!scene || !camera) return;

    let cancelled = false;

    async function loadPlayerAvatar() {
      setPlayerStatus("loading");
      setPlayerError("");

      disposePlayerResources(playerControllerRef, playerMeshRef);

      try {
        const result = await SceneLoader.ImportMeshAsync(null, "", PLAYER_MODEL_URL, scene);
        const meshSummaries = result.meshes.map((mesh) => ({
          name: mesh.name,
          parent: mesh.parent?.name ?? null,
          className: mesh.getClassName?.(),
          hasVertices: typeof mesh.getTotalVertices === "function" ? mesh.getTotalVertices() > 0 : undefined
        }));
        console.info("Player asset meshes", meshSummaries);
        console.info(
          "Player asset skeletons",
          result.skeletons?.map((skeleton) => ({ name: skeleton.name, bones: skeleton.bones?.length ?? 0 })) ?? []
        );
        if (cancelled) {
          result.meshes.forEach((mesh) => mesh.dispose());
          result.skeletons?.forEach((skeleton) => skeleton.dispose && skeleton.dispose());
          return;
        }

        const playerMesh = selectPlayerMesh(result.meshes);
        if (!playerMesh) {
          throw new Error("Player mesh not found in imported asset");
        }

        const skeleton = result.skeletons?.[0];
        const preparedPlayerMesh = preparePlayerMesh(playerMesh, skeleton);

        const controller = new CharacterController(preparedPlayerMesh, camera, scene, undefined, true);
        controller.setCameraTarget(new Vector3(0, 1.6, 0));
        controller.setNoFirstPerson(false);
        controller.setStepOffset(0.4);
        controller.setSlopeLimit(30, 60);
        controller.setWalkSpeed(2.5);
        controller.setRunSpeed(5);
        controller.setLeftSpeed(2);
        controller.setRightSpeed(2);
        controller.setJumpSpeed(6);
        controller.setTurnSpeed(60);

        controller.setIdleAnim("idle", 1, true);
        controller.setWalkAnim("walk", 1, true);
        controller.setRunAnim("run", 1.2, true);
        controller.setTurnLeftAnim("turnLeft", 0.5, true);
        controller.setTurnRightAnim("turnRight", 0.5, true);
        controller.setWalkBackAnim("walkBack", 0.5, true);
        controller.setIdleJumpAnim("idleJump", 0.5, false);
        controller.setRunJumpAnim("runJump", 0.6, false);
        controller.setFallAnim("fall", 2, false);
        controller.setSlideBackAnim("slideBack", 1, false);

        const walkSound = new Sound(
          "player-walk",
          FOOTSTEP_SOUND_URL,
          scene,
          () => {
            controller.setSound(walkSound);
          },
          { loop: false }
        );

        controller.setCameraElasticity(true);
        controller.makeObstructionInvisible(true);
        controller.start();

        playerControllerRef.current = controller;
        playerMeshRef.current = preparedPlayerMesh;
        setPlayerStatus("ready");
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load player avatar", error);
        disposePlayerResources(playerControllerRef, playerMeshRef);
        setPlayerStatus("error");
        setPlayerError(error instanceof Error ? error.message : String(error));
      }
    }

    loadPlayerAvatar();

    return () => {
      cancelled = true;
      disposePlayerResources(playerControllerRef, playerMeshRef);
      setPlayerStatus("idle");
      setPlayerError("");
    };
  }, [worldId, sceneStatus]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || sceneStatus !== "ready" || !worldData) {
      disposeAllNPCMeshes(npcMeshesRef);
      setNPCInfos([]);
      setSelectedNPCId(null);
      setNPCStatus(sceneStatus === "ready" && worldData ? "ready" : "idle");
      return;
    }

    let cancelled = false;
    setNPCStatus("loading");
    disposeAllNPCMeshes(npcMeshesRef);

    const questGiverIds = new Set(
      worldData.quests?.map((quest) => quest.giverCharacterId).filter((id): id is string => Boolean(id))
    );
    const characters = worldData.characters.slice(0, MAX_NPCS);
    const sceneForNPCs: Scene = scene;

    async function loadNPCs() {
      try {
        const instances = await Promise.all(
          characters.map((character, index) =>
            spawnNPCInstance({
              character,
              scene: sceneForNPCs,
              index,
              total: characters.length,
              questGiver: questGiverIds.has(character.id)
            })
          )
        );

        if (cancelled) {
          instances.forEach((instance) => disposeNPCInstance(instance));
          return;
        }

        const npcMap = new Map<string, NPCInstance>();
        const infos: NPCDisplayInfo[] = [];

        instances.forEach((instance, index) => {
          if (!instance) return;
          const character = characters[index];
          instance.mesh.metadata = { ...(instance.mesh.metadata || {}), npcId: character.id };
          tagNPCMeshHierarchy(instance.mesh, character.id);
          npcMap.set(character.id, instance);
          infos.push({
            id: character.id,
            name: formatCharacterName(character),
            occupation: character.occupation,
            disposition: character.disposition,
            questGiver: questGiverIds.has(character.id),
            position: { x: instance.mesh.position.x, z: instance.mesh.position.z }
          });
        });

        npcMeshesRef.current = npcMap;
        setNPCInfos(infos);
        setSelectedNPCId((prev) => (prev && npcMap.has(prev) ? prev : infos[0]?.id ?? null));
        setNPCStatus("ready");
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to spawn NPCs", error);
        setNPCStatus("error");
      }
    }

    loadNPCs();

    return () => {
      cancelled = true;
      disposeAllNPCMeshes(npcMeshesRef);
      setNPCInfos([]);
      setSelectedNPCId(null);
      setNPCStatus("idle");
    };
  }, [worldData, sceneStatus, worldId]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || sceneStatus !== "ready" || !worldData) {
      disposeAllSettlementMeshes(settlementMeshesRef);
      disposeAllSettlementRoadMeshes(settlementRoadMeshesRef);
      return;
    }

    disposeAllSettlementMeshes(settlementMeshesRef);
    disposeAllSettlementRoadMeshes(settlementRoadMeshesRef);

    const settlements = worldData.settlements.slice(0, MAX_SETTLEMENTS_3D);
    const settlementMap = new Map<string, Mesh>();
    const positions: { id: string; position: Vector3 }[] = [];

    settlements.forEach((settlement, index) => {
      const mesh = spawnSettlementMesh({
        settlement,
        scene,
        index,
        total: settlements.length,
        terrainSize,
        worldId,
        theme: worldTheme
      });
      if (mesh) {
        settlementMap.set(settlement.id, mesh);
        positions.push({ id: settlement.id, position: mesh.position.clone() });
      }
    });

    settlementMeshesRef.current = settlementMap;

    const roadMeshes = createSettlementRoads(scene, positions, worldTheme);
    settlementRoadMeshesRef.current = roadMeshes;

    return () => {
      disposeAllSettlementMeshes(settlementMeshesRef);
      disposeAllSettlementRoadMeshes(settlementRoadMeshesRef);
    };
  }, [worldData, sceneStatus, worldId, terrainSize, worldTheme]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || sceneStatus !== "ready") return;

    const ground = scene.getMeshByName("ground") as Mesh | null;
    if (!ground) return;

    const currentSize = (ground.metadata?.terrainSize as number) || 512;
    if (!terrainSize || terrainSize === currentSize) return;

    const scale = terrainSize / currentSize;
    ground.scaling.x = scale;
    ground.scaling.z = scale;
    ground.metadata = { ...(ground.metadata || {}), terrainSize };
  }, [terrainSize, sceneStatus]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const observer = scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type !== PointerEventTypes.POINTERDOWN) return;
      const pickInfo = pointerInfo.pickInfo;
      if (!pickInfo?.hit || !pickInfo.pickedMesh) return;
      const npcId = pickInfo.pickedMesh.metadata?.npcId;
      if (npcId && npcMeshesRef.current.has(npcId)) {
        setSelectedNPCId(npcId);
      }
    });

    return () => {
      if (observer) {
        scene.onPointerObservable.remove(observer);
      }
    };
  }, []);

  // Add keyboard shortcuts for chat, quests, and proximity interaction
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const handleKeyDown = async (event: KeyboardEvent) => {
      // SPACE key - proximity interaction
      if (event.code === 'Space' && !event.repeat) {
        event.preventDefault();

        // Find nearest NPC to player
        const playerMesh = playerMeshRef.current;
        if (!playerMesh) return;

        const playerPos = playerMesh.position;
        let nearestNPC: { id: string; distance: number } | null = null;
        const maxInteractionDistance = 8; // units

        npcMeshesRef.current.forEach((instance, npcId) => {
          if (!instance.mesh) return;
          const npcPos = instance.mesh.position;
          const dx = playerPos.x - npcPos.x;
          const dz = playerPos.z - npcPos.z;
          const distance = Math.sqrt(dx * dx + dz * dz);

          if (distance <= maxInteractionDistance) {
            if (!nearestNPC || distance < nearestNPC.distance) {
              nearestNPC = { id: npcId, distance };
            }
          }
        });

        if (nearestNPC) {
          setSelectedNPCId(nearestNPC.id);

          // Show a toast notification
          const npc = npcInfos.find(n => n.id === nearestNPC.id);
          if (npc) {
            toast({
              title: `Interacting with ${npc.name}`,
              description: npc.occupation || "Character",
              duration: 2000
            });
          }
        } else {
          toast({
            title: "No one nearby",
            description: "Move closer to an NPC to interact",
            variant: "destructive",
            duration: 2000
          });
        }
      }

      // C key - open chat with selected NPC
      if (event.code === 'KeyC' && !event.repeat && selectedNPCId) {
        event.preventDefault();

        const npc = npcInfos.find(n => n.id === selectedNPCId);
        if (npc && worldData && chatPanelRef.current) {
          // Fetch character details and truths
          try {
            const [characterRes, truthsRes] = await Promise.all([
              fetch(`/api/characters/${selectedNPCId}`),
              fetch(`/api/truths?worldId=${worldId}`)
            ]);

            if (characterRes.ok && truthsRes.ok) {
              const character = await characterRes.json();
              const truths = await truthsRes.json();

              // Get NPC mesh
              const npcInstance = npcMeshesRef.current.get(selectedNPCId);
              const npcMesh = npcInstance?.mesh;

              chatPanelRef.current.show(character, truths, npcMesh);

              // Set dialogue actions for the chat panel
              chatPanelRef.current.setDialogueActions(availableActions, playerEnergy);

              toast({
                title: `Chatting with ${npc.name}`,
                description: "Press C again to close chat",
                duration: 2000
              });
            }
          } catch (error) {
            console.error('Failed to open chat:', error);
            toast({
              title: "Chat Error",
              description: "Failed to load character data",
              variant: "destructive"
            });
          }
        } else if (!selectedNPCId) {
          toast({
            title: "No NPC Selected",
            description: "Select an NPC first (click or press SPACE near them)",
            variant: "destructive",
            duration: 2000
          });
        }
      }

      // TAB key - show radial action menu
      if (event.code === 'Tab' && !event.repeat) {
        event.preventDefault();

        if (radialMenuRef.current) {
          if (radialMenuRef.current.isOpen()) {
            radialMenuRef.current.hide();
          } else if (selectedNPCId && availableActions.length > 0) {
            radialMenuRef.current.show(
              availableActions,
              playerEnergy,
              (actionId: string) => {
                handlePerformAction(actionId);
              },
              () => {
                console.log('Radial menu closed');
              }
            );

            toast({
              title: "Action Menu",
              description: "Select an action or press TAB/ESC to close",
              duration: 2000
            });
          } else {
            toast({
              title: "No Actions Available",
              description: "Select an NPC first to see available actions",
              variant: "destructive",
              duration: 2000
            });
          }
        }
      }

      // Q key - toggle quest tracker
      if (event.code === 'KeyQ' && !event.repeat) {
        event.preventDefault();

        if (questTrackerRef.current) {
          questTrackerRef.current.toggle();
          questTrackerRef.current.updateQuests(worldId);

          toast({
            title: "Quest Tracker",
            description: "Press Q again to toggle",
            duration: 1500
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [npcInfos, selectedNPCId, worldData, worldId, toast, availableActions, playerEnergy, handlePerformAction]);

  useEffect(() => {
    npcMeshesRef.current.forEach((instance, npcId) => {
      if (!instance || !instance.mesh) return;
      const mesh = instance.mesh;
      const isSelected = npcId === selectedNPCId;
      mesh.renderOutline = isSelected;
      mesh.outlineWidth = isSelected ? 0.06 : 0;
      if (isSelected) {
        mesh.outlineColor = new Color3(1, 0.9, 0.4);
      }
    });
  }, [selectedNPCId]);

  // Update GUI: Player status
  useEffect(() => {
    const gui = guiManagerRef.current;
    if (!gui) return;

    const statusText = playerStatus === "ready" ? "Ready" :
                      playerStatus === "loading" ? "Loading..." :
                      playerStatus === "error" ? "Error" : "Initializing";

    gui.updatePlayerStatus({
      energy: playerEnergy,
      maxEnergy: INITIAL_ENERGY,
      status: statusText
    });
  }, [playerEnergy, playerStatus]);

  // Update GUI: World stats
  useEffect(() => {
    const gui = guiManagerRef.current;
    if (!gui || !worldData) return;

    gui.updateWorldStats({
      countries: worldData.countries.length,
      settlements: worldData.settlements.length,
      characters: worldData.characters.length,
      rules: worldData.rules.length,
      baseRules: worldData.baseRules.length,
      actions: worldData.actions.length,
      baseActions: worldData.baseActions.length,
      quests: worldData.quests.length
    });
  }, [worldData]);

  // Update GUI: NPC list
  useEffect(() => {
    const gui = guiManagerRef.current;
    if (!gui) return;

    const npcList = npcInfos.map(npc => ({
      id: npc.id,
      name: npc.name,
      occupation: npc.occupation,
      disposition: npc.disposition,
      questGiver: npc.questGiver
    }));

    gui.updateNPCList(npcList);
  }, [npcInfos]);

  // Update GUI: Action list
  useEffect(() => {
    const gui = guiManagerRef.current;
    if (!gui) return;

    const npc = selectedNPC ? {
      id: selectedNPC.id,
      name: selectedNPC.name,
      occupation: selectedNPC.occupation,
      disposition: selectedNPC.disposition,
      questGiver: selectedNPC.questGiver
    } : null;

    gui.updateActionList(npc, availableActions, playerEnergy);
  }, [selectedNPC, availableActions, playerEnergy]);

  // Update GUI: Action feedback
  useEffect(() => {
    const gui = guiManagerRef.current;
    if (!gui || !actionFeedback) return;

    gui.showActionFeedback({
      actionName: actionFeedback.actionName,
      targetName: actionFeedback.targetName,
      narrativeText: actionFeedback.result.narrativeText || actionFeedback.result.message || "",
      success: actionFeedback.result.success,
      timestamp: actionFeedback.timestamp
    });
  }, [actionFeedback]);

  const actionCategories = useMemo(() => ["social", "mental", "combat", "movement", "economic"], []);

  const actionSummaries = useMemo<ActionCategorySummary[]>(() => {
    const manager = actionManagerRef.current;
    if (!manager || !worldData) return [];

    return actionCategories.map((category) => ({
      category,
      count: manager.getActionsByCategory(category).length
    }));
  }, [actionCategories, worldData]);

  const sampleSocialActions = useMemo<SampleAction[]>(() => {
    const manager = actionManagerRef.current;
    if (!manager || !worldData || worldData.characters.length === 0) return [];

    const context: ActionContext = {
      actor: worldData.characters[0]?.id || DEFAULT_PLAYER_ID,
      target: worldData.characters[1]?.id,
      timestamp: Date.now(),
      playerEnergy,
      playerPosition: { x: 0, y: 0 }
    };

    return manager
      .getSocialActionsForNPC(worldData.characters[0].id, context)
      .slice(0, 4)
      .map((action) => ({
        id: action.id,
        name: action.name,
        description: action.description,
        actionType: action.actionType,
        energyCost: action.energyCost
      }));
  }, [worldData, playerEnergy]);

  const selectedNPC = useMemo(() => npcInfos.find((npc) => npc.id === selectedNPCId) || null, [npcInfos, selectedNPCId]);

  const availableActions = useMemo(() => {
    const manager = actionManagerRef.current;
    if (!manager || !selectedNPCId || !worldData) return [];

    const context: ActionContext = {
      actor: worldData.characters[0]?.id || DEFAULT_PLAYER_ID,
      target: selectedNPCId,
      timestamp: Date.now(),
      playerEnergy,
      playerPosition: playerMeshRef.current
        ? { x: playerMeshRef.current.position.x, y: playerMeshRef.current.position.z }
        : { x: 0, y: 0 }
    };

    return manager.getSocialActionsForNPC(selectedNPCId, context);
  }, [selectedNPCId, worldData, playerEnergy]);

  const combinedError = sceneErrorMessage || worldError || playerError;

  const handleToggleFullscreen = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const elem: any = canvas.parentElement ?? canvas;
    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch((err: unknown) => {
          console.error("Failed to enter fullscreen", err);
        });
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch((err: unknown) => {
        console.error("Failed to exit fullscreen", err);
      });
    }
  }, []);

  const handleToggleDebug = () => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (scene.debugLayer.isVisible()) {
      scene.debugLayer.hide();
    } else {
      scene.debugLayer.show({ overlay: true });
    }
  };

  const handleApplyGroundTexture = useCallback(
    (assetId: string) => {
      const textureManager = textureManagerRef.current;
      if (!textureManager) return;

      const asset = textureManager.getAsset(assetId);
      if (!asset) {
        console.warn("Asset not found:", assetId);
        return;
      }

      textureManager.applyGroundTexture(asset, {
        uScale: 8,
        vScale: 8,
        useBump: true
      });

      setSelectedGroundTexture(assetId);

      toast({
        title: "Texture applied",
        description: `Applied ${asset.name} to ground`
      });
    },
    [toast]
  );

  const handleApplyWallTexture = useCallback(
    (assetId: string) => {
      const textureManager = textureManagerRef.current;
      if (!textureManager) return;

      const asset = textureManager.getAsset(assetId);
      if (!asset) {
        console.warn("Asset not found:", assetId);
        return;
      }

      textureManager.applySettlementTextures(asset, {
        uScale: 2,
        vScale: 2
      });

      setSelectedWallTexture(assetId);

      toast({
        title: "Texture applied",
        description: `Applied ${asset.name} to settlements`
      });
    },
    [toast]
  );

  const handleApplyRoadTexture = useCallback(
    (assetId: string) => {
      const textureManager = textureManagerRef.current;
      if (!textureManager) return;

      const asset = textureManager.getAsset(assetId);
      if (!asset) {
        console.warn("Asset not found:", assetId);
        return;
      }

      textureManager.applyRoadTexture(asset, {
        uScale: 4,
        vScale: 4
      });

      setSelectedRoadTexture(assetId);

      toast({
        title: "Texture applied",
        description: `Applied ${asset.name} to roads`
      });
    },
    [toast]
  );

  const handlePerformAction = useCallback(
    async (actionId: string) => {
      const manager = actionManagerRef.current;
      if (!manager || !selectedNPCId) return;

      const context = buildActionContext({
        targetId: selectedNPCId,
        energy: playerEnergy,
        playerMesh: playerMeshRef.current,
        worldData
      });

      setActionInProgress(true);
      try {
        const result = await manager.performAction(actionId, context);
        const actionDefinition = findActionDefinition(worldData, actionId);
        const actionName = actionDefinition?.name || "Action";
        const targetName = selectedNPC?.name || "NPC";

        setActionFeedback({
          actionId,
          actionName,
          targetName,
          result,
          timestamp: Date.now()
        });

        if (result.energyUsed) {
          setPlayerEnergy((energy) => Math.max(0, energy - result.energyUsed));
        }

        // Record play trace if we have a playthrough
        if (playthroughId && token) {
          try {
            await fetch(`/api/playthroughs/${playthroughId}/traces`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                actionType: 'action_performed',
                actionId,
                targetCharacterId: selectedNPCId,
                metadata: {
                  actionName,
                  targetName,
                  success: result.success,
                  energyUsed: result.energyUsed,
                  narrativeText: result.narrativeText,
                },
              }),
            });
          } catch (traceError) {
            // Don't fail the action if trace recording fails
            console.error('Failed to record play trace:', traceError);
          }
        }

        toast({
          title: result.success ? `${actionName} succeeded` : `${actionName} failed`,
          description: result.narrativeText || result.message,
          variant: result.success ? "default" : "destructive"
        });
      } catch (error) {
        console.error("Failed to perform action", error);
        toast({
          title: "Action error",
          description: error instanceof Error ? error.message : String(error),
          variant: "destructive"
        });
      } finally {
        setActionInProgress(false);
      }
    },
    [playerEnergy, selectedNPCId, selectedNPC, toast, worldData, playthroughId, token]
  );

  return (
    <Card className="w-full h-full">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Explore {worldName}</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            BabylonJS scene prototype · World ID: {worldId}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowTexturePanel(!showTexturePanel)}
            disabled={!sceneRef.current || availableTextures.length === 0}
          >
            {showTexturePanel ? "Hide Textures" : "Textures"}
            {availableTextures.length > 0 && <Badge className="ml-2" variant="secondary">{availableTextures.length}</Badge>}
          </Button>
          <Button variant="outline" onClick={handleToggleFullscreen} disabled={!sceneRef.current}>
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </Button>
          <Button variant="outline" onClick={handleToggleDebug} disabled={!sceneRef.current}>
            Toggle Debug
          </Button>
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className={`w-full ${isFullscreen ? "h-screen" : "h-[600px]"} border border-border rounded-md`}
          />

          <StatusOverlay
            sceneStatus={sceneStatus}
            dataStatus={dataStatus}
            playerStatus={playerStatus}
            npcStatus={npcStatus}
            errorMessage={combinedError}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <PlayerStatusPanel status={playerStatus} errorMessage={playerError} energy={playerEnergy} />
          <NPCPanel
            status={npcStatus}
            npcs={npcInfos}
            selectedNPCId={selectedNPCId}
            onSelectNPC={setSelectedNPCId}
            focusedNPC={selectedNPC}
            characterPortraits={characterPortraits}
            onShowCharacterDetail={() => setShowCharacterDetail(true)}
          />
        </div>

        <ActionConsole
          selectedNPC={selectedNPC}
          actions={availableActions}
          playerEnergy={playerEnergy}
          onActionSelect={handlePerformAction}
          actionFeedback={actionFeedback}
          isPerforming={actionInProgress}
        />

        <WorldDataPanel
          worldData={worldData}
          dataStatus={dataStatus}
          actionSummaries={actionSummaries}
          sampleSocialActions={sampleSocialActions}
          errorMessage={worldError}
        />

        {showTexturePanel && (
          <TexturePanel
            textures={availableTextures}
            selectedGroundTexture={selectedGroundTexture}
            selectedWallTexture={selectedWallTexture}
            selectedRoadTexture={selectedRoadTexture}
            onApplyGroundTexture={handleApplyGroundTexture}
            onApplyWallTexture={handleApplyWallTexture}
            onApplyRoadTexture={handleApplyRoadTexture}
            worldId={worldId}
          />
        )}
      </CardContent>

      {/* Character Detail Dialog */}
      {selectedNPC && characterPortraits.get(selectedNPC.id) && (
        <Dialog open={showCharacterDetail} onOpenChange={setShowCharacterDetail}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedNPC.name}</DialogTitle>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <img
                  src={`/${characterPortraits.get(selectedNPC.id)!.filePath}`}
                  alt={selectedNPC.name}
                  className="w-full rounded-lg object-cover border"
                />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Generated by:</strong> {characterPortraits.get(selectedNPC.id)!.generationProvider || 'Unknown'}</p>
                  {characterPortraits.get(selectedNPC.id)!.generationPrompt && (
                    <p className="line-clamp-3"><strong>Prompt:</strong> {characterPortraits.get(selectedNPC.id)!.generationPrompt}</p>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Character Information</h3>
                  <div className="space-y-2 text-sm">
                    {selectedNPC.occupation && (
                      <div>
                        <span className="text-muted-foreground">Occupation:</span>
                        <p className="font-medium">{selectedNPC.occupation}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Disposition:</span>
                      <p className="font-medium">{selectedNPC.disposition || 'Unknown'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Position:</span>
                      <p className="font-medium">
                        ({selectedNPC.position.x.toFixed(1)}, {selectedNPC.position.z.toFixed(1)})
                      </p>
                    </div>
                    {selectedNPC.questGiver && (
                      <div className="pt-2">
                        <Badge>Quest Giver</Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}

function setupScene(scene: Scene, canvas: HTMLCanvasElement, theme: WorldVisualTheme) {
  scene.clearColor = new Color4(0.75, 0.75, 0.75, 1);
  scene.ambientColor = new Color3(1, 1, 1);
  scene.collisionsEnabled = true;

  const camera = new ArcRotateCamera("orbit-camera", 0, Math.PI / 2.5, 7, new Vector3(0, 1.5, 0), scene);
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 3;
  camera.upperRadiusLimit = 40;
  camera.wheelPrecision = 15;
  camera.checkCollisions = true;
  camera.keysUp = [];
  camera.keysDown = [];
  camera.keysLeft = [];
  camera.keysRight = [];

  const hemiLight = new HemisphericLight("hemi-light", new Vector3(0, 1, 0), scene);
  hemiLight.intensity = 0.7;

  const sun = new DirectionalLight("sun", new Vector3(-0.5, -1, -0.5), scene);
  sun.position = new Vector3(0, 20, 0);
  sun.intensity = 1.1;

  const skyDome = MeshBuilder.CreateSphere("sky-dome", { diameter: 1000, sideOrientation: Mesh.BACKSIDE }, scene);
  const skyMaterial = new StandardMaterial("sky-mat", scene);
  skyMaterial.emissiveColor = theme.skyColor;
  skyMaterial.specularColor = Color3.Black();
  skyMaterial.backFaceCulling = false;
  skyMaterial.disableLighting = true;
  skyDome.material = skyMaterial;
  skyDome.isPickable = false;
  skyDome.checkCollisions = false;
  skyDome.infiniteDistance = true;

  createGround(scene, 512, theme);

  return camera;
}

function createGround(scene: Scene, size: number = 512, theme?: WorldVisualTheme) {
  const groundMaterial = new StandardMaterial("ground-mat", scene);
  const diffuseTexture = new Texture("/assets/ground/ground.jpg", scene);
  diffuseTexture.uScale = 4;
  diffuseTexture.vScale = 4;
  groundMaterial.diffuseTexture = diffuseTexture;

  const bumpTexture = new Texture("/assets/ground/ground-normal.png", scene);
  bumpTexture.uScale = 12;
  bumpTexture.vScale = 12;
  groundMaterial.bumpTexture = bumpTexture;
  groundMaterial.diffuseColor = theme?.groundColor ?? new Color3(0.9, 0.6, 0.4);
  groundMaterial.specularColor = Color3.Black();

  const ground = MeshBuilder.CreateGroundFromHeightMap(
    "ground",
    "/assets/ground/ground_heightMap.png",
    {
      width: size,
      height: size,
      minHeight: 0,
      maxHeight: 10,
      subdivisions: 64,
      onReady: (mesh) => {
        mesh.material = groundMaterial;
        mesh.checkCollisions = true;
        mesh.isPickable = true;
        mesh.receiveShadows = true;
        mesh.metadata = { ...(mesh.metadata || {}), terrainSize: size };
      }
    },
    scene
  );
  ground.metadata = { ...(ground.metadata || {}), terrainSize: size };
}

function disposePlayerResources(
  controllerRef: MutableRefObject<CharacterController | null>,
  meshRef: MutableRefObject<Mesh | null>
) {
  controllerRef.current?.stop();
  controllerRef.current = null;
  if (meshRef.current) {
    meshRef.current.dispose(false, true);
    meshRef.current = null;
  }
}

function disposeAllNPCMeshes(npcRef: MutableRefObject<Map<string, NPCInstance>>) {
  npcRef.current.forEach((instance) => {
    disposeNPCInstance(instance);
  });
  npcRef.current.clear();
}

function disposeAllSettlementMeshes(settlementRef: MutableRefObject<Map<string, Mesh>>) {
  settlementRef.current.forEach((mesh) => {
    mesh?.dispose(false, true);
  });
  settlementRef.current.clear();
}

function disposeAllSettlementRoadMeshes(roadsRef: MutableRefObject<Mesh[]>) {
  roadsRef.current.forEach((mesh) => {
    mesh?.dispose(false, true);
  });
  roadsRef.current = [];
}

function meshHasRenderableGeometry(mesh?: AbstractMesh | null): mesh is Mesh {
  return !!mesh && typeof mesh.getTotalVertices === "function" && mesh.getTotalVertices() > 0;
}

function selectPlayerMesh(meshes: AbstractMesh[]): Mesh | null {
  const explicitRoot = meshes.find((mesh) => mesh.name === "__root__" && mesh instanceof Mesh);
  if (explicitRoot instanceof Mesh && meshHasRenderableGeometry(explicitRoot)) {
    return explicitRoot;
  }

  const rootMesh = meshes.find((mesh) => !mesh.parent || mesh.parent.name === "__root__");
  if (meshHasRenderableGeometry(rootMesh)) {
    return rootMesh as Mesh;
  }

  const namedMesh = meshes.find((mesh) => mesh.name === "Vincent" && mesh instanceof Mesh);
  if (namedMesh instanceof Mesh) {
    return namedMesh;
  }

  const skinnedMesh = meshes.find((mesh) => !!mesh.skeleton);
  if (skinnedMesh) {
    return skinnedMesh as Mesh;
  }

  for (const mesh of meshes) {
    if (meshHasRenderableGeometry(mesh)) {
      return mesh;
    }
    const childMeshes = typeof mesh.getChildMeshes === "function" ? mesh.getChildMeshes(false) : [];
    const child = childMeshes.find((childMesh) => meshHasRenderableGeometry(childMesh));
    if (meshHasRenderableGeometry(child)) {
      return child;
    }
  }

  const fallback = meshes.find(Boolean);
  return fallback ? (fallback as Mesh) : null;
}

function preparePlayerMesh(mesh: Mesh, skeleton?: Skeleton): Mesh {
  if (mesh.parent) {
    mesh.setParent(null);
  }

  if (skeleton) {
    skeleton.enableBlending(0.1);
    mesh.skeleton = skeleton;
  }

  mesh.position = new Vector3(0, 12, 0);
  mesh.rotation = Vector3.Zero();
  mesh.scaling = new Vector3(1, 1, 1);
  mesh.checkCollisions = true;
  mesh.ellipsoid = new Vector3(0.5, 1, 0.5);
  mesh.ellipsoidOffset = new Vector3(0, 1, 0);
  mesh.computeWorldMatrix(true);

  return mesh;
}

function spawnNPCMesh({
  character,
  scene,
  index,
  total,
  questGiver
}: {
  character: WorldCharacter;
  scene: Scene;
  index: number;
  total: number;
  questGiver: boolean;
}): Mesh | null {
  try {
    const angle = (index / Math.max(total, 1)) * Math.PI * 2;
    const radius = 10 + Math.floor(index / 4) * 4;
    const mesh = MeshBuilder.CreateCapsule(
      `npc-${character.id}`,
      { height: 2.2, radius: 0.5, tessellation: 8 },
      scene
    );
    mesh.position = new Vector3(Math.cos(angle) * radius, 1.2, Math.sin(angle) * radius);
    mesh.checkCollisions = true;
    mesh.isPickable = true;

    const material = new StandardMaterial(`npc-mat-${character.id}`, scene);
    material.diffuseColor = questGiver ? new Color3(0.95, 0.7, 0.3) : new Color3(0.4, 0.65, 0.95);
    material.specularColor = Color3.Black();
    mesh.material = material;

    return mesh;
  } catch (error) {
    console.warn(`Failed to spawn NPC mesh for ${character.id}`, error);
    return null;
  }
}

function computeTerrainSizeFromSettlements(settlements: SettlementSummary[], worldType?: string): number {
  if (!settlements || settlements.length === 0) {
    return 512;
  }

  const typeBaseSize = (type?: string) => {
    const t = type?.toLowerCase();
    if (t === "city") return 2000;
    if (t === "town") return 1400;
    if (t === "village") return 900;
    return 1200;
  };

  let maxTypeSize = 0;
  let totalPopulation = 0;

  settlements.forEach((s) => {
    maxTypeSize = Math.max(maxTypeSize, typeBaseSize(s.settlementType));
    if (typeof s.population === "number" && s.population > 0) {
      totalPopulation += s.population;
    }
  });

  const count = settlements.length;
  const countFactor = 1 + Math.min(Math.max(count - 1, 0) * 0.12, 2.0);
  const popFactor =
    totalPopulation > 0 ? 1 + Math.min(Math.log10(totalPopulation + 1) * 0.25, 2.0) : 1;

   // Nudge terrain size for different world types (slightly larger for sprawling or epic settings)
   let worldTypeFactor = 1;
   const type = (worldType || "").toLowerCase();
   if (type.includes("sci-fi") || type.includes("space") || type.includes("cyberpunk")) {
     worldTypeFactor = 1.25;
   } else if (type.includes("solarpunk") || type.includes("high-fantasy")) {
     worldTypeFactor = 1.15;
   } else if (type.includes("post-apocalyptic") || type.includes("wild-west")) {
     worldTypeFactor = 1.1;
   }

  const baseSize = maxTypeSize || 1200;
  const rawSize = baseSize * Math.max(countFactor, popFactor) * worldTypeFactor;
  const minSize = 512;
  const maxSize = 4096;
  const clamped = Math.min(Math.max(rawSize, minSize), maxSize);

  const step = 256;
  return Math.round(clamped / step) * step;
}

function computeSettlementPosition(
  index: number,
  total: number,
  terrainSize: number,
  rand: () => number
): Vector3 {
  const size = terrainSize || 512;
  const half = size / 2;
  const usableRadius = half * 0.8;
  const perRing = 6;
  const ring = Math.floor(index / perRing);
  const ringIndex = index % perRing;
  const ringCount = Math.max(1, Math.ceil(total / perRing));
  const innerRadius = usableRadius * 0.35;
  const ringStep = ringCount > 1 ? (usableRadius - innerRadius) / (ringCount - 1) : 0;
  const angle = (ringIndex / perRing) * Math.PI * 2;
  const baseRadius = ringCount > 1 ? innerRadius + ring * ringStep : usableRadius * 0.6;

  const jitterAngle = (rand() - 0.5) * (Math.PI / 12);
  const jitterRadius = baseRadius * 0.1;
  const finalAngle = angle + jitterAngle;
  const rawRadius = baseRadius + (rand() - 0.5) * jitterRadius;
  const clampedRadius = Math.min(Math.max(rawRadius, half * 0.15), usableRadius);

  const x = Math.cos(finalAngle) * clampedRadius;
  const z = Math.sin(finalAngle) * clampedRadius;
  return new Vector3(x, 0, z);
}

function projectToGround(scene: Scene, x: number, z: number): Vector3 {
  const origin = new Vector3(x, 100, z);
  const direction = new Vector3(0, -1, 0);
  const ray = new Ray(origin, direction, 300);
  const pickInfo = scene.pickWithRay(ray, (mesh) => mesh.name === "ground");
  const y = pickInfo?.hit && pickInfo.pickedPoint ? pickInfo.pickedPoint.y : 0;
  return new Vector3(x, y, z);
}

function spawnSettlementMesh({
  settlement,
  scene,
  index,
  total,
  terrainSize,
  worldId,
  theme
}: {
  settlement: SettlementSummary;
  scene: Scene;
  index: number;
  total: number;
  terrainSize: number;
  worldId?: string;
  theme: WorldVisualTheme;
}): Mesh | null {
  try {
    const rand = createSeededRandom(`${worldId ?? "world"}-${settlement.id}`);
    const basePositionXZ = computeSettlementPosition(index, total, terrainSize, rand);
    const groundPosition = projectToGround(scene, basePositionXZ.x, basePositionXZ.z);

    const type = settlement.settlementType?.toLowerCase() ?? "town";
    const baseSize = type === "city" ? 24 : type === "village" ? 14 : 18;
    const baseHeight = type === "city" ? 18 : type === "village" ? 8 : 12;

    const base = MeshBuilder.CreateBox(
      `settlement-${settlement.id}-base`,
      { width: baseSize, depth: baseSize, height: baseHeight },
      scene
    );

    base.position = groundPosition.clone();
    base.position.y += baseHeight / 2;
    base.checkCollisions = false;
    base.isPickable = false;

    const roofHeight = type === "city" ? 10 : type === "village" ? 5 : 7;
    const roof = MeshBuilder.CreateCylinder(
      `settlement-${settlement.id}-roof`,
      { diameter: baseSize * 1.1, height: roofHeight, tessellation: 6 },
      scene
    );
    roof.parent = base;
    roof.position = new Vector3(0, baseHeight / 2 + roofHeight / 2, 0);

    const baseMat = new StandardMaterial(`settlement-${settlement.id}-mat-base`, scene);
    if (theme) {
      baseMat.diffuseColor = theme.settlementBaseColor;
    } else if (type === "city") {
      baseMat.diffuseColor = new Color3(0.7, 0.7, 0.75);
    } else if (type === "village") {
      baseMat.diffuseColor = new Color3(0.6, 0.45, 0.3);
    } else {
      baseMat.diffuseColor = new Color3(0.8, 0.55, 0.35);
    }
    baseMat.specularColor = Color3.Black();
    base.material = baseMat;

    const roofMat = new StandardMaterial(`settlement-${settlement.id}-mat-roof`, scene);
    roofMat.diffuseColor = theme?.settlementRoofColor ?? new Color3(0.4, 0.2, 0.15);
    roofMat.specularColor = Color3.Black();
    roof.material = roofMat;

    base.metadata = { ...(base.metadata || {}), settlementId: settlement.id };
    roof.metadata = { ...(roof.metadata || {}), settlementId: settlement.id };

    // Spawn additional building meshes around the central base to approximate
    // the building count for this settlement.
    const buildingCount = type === "city" ? 24 : type === "town" ? 12 : 5;
    const buildingRadius = baseSize * 1.6;

    for (let i = 0; i < buildingCount; i++) {
      const angleBase = (i / buildingCount) * Math.PI * 2;
      const angleJitter = (rand() - 0.5) * (Math.PI / 20);
      const radiusJitter = buildingRadius * 0.2 * (rand() - 0.5);
      const r = buildingRadius + radiusJitter;
      const bx = Math.cos(angleBase + angleJitter) * r;
      const bz = Math.sin(angleBase + angleJitter) * r;

      const baseBuildingHeight =
        type === "city" ? baseHeight * 1.4 : type === "town" ? baseHeight : Math.max(6, baseHeight * 0.8);
      const heightVariation = (rand() - 0.5) * baseBuildingHeight * 0.3;
      const bh = Math.max(4, baseBuildingHeight + heightVariation);

      const building = MeshBuilder.CreateBox(
        `settlement-${settlement.id}-building-${i}`,
        {
          width: baseSize * 0.6,
          depth: baseSize * 0.6,
          height: bh
        },
        scene
      );
      building.parent = base;
      building.position = new Vector3(bx, bh / 2, bz);
      building.checkCollisions = false;
      building.isPickable = false;
      building.material = baseMat;
    }

    base.metadata = {
      ...(base.metadata || {}),
      buildingCount,
      settlementType: type
    };

    return base;
  } catch (error) {
    console.warn(`Failed to spawn settlement mesh for ${settlement.id}`, error);
    return null;
  }
}

function createSettlementRoads(
  scene: Scene,
  settlements: { id: string; position: Vector3 }[],
  theme: WorldVisualTheme
): Mesh[] {
  if (!settlements || settlements.length < 2) {
    return [];
  }

  const roads: Mesh[] = [];
  const remaining = [...settlements];
  const connected: { id: string; position: Vector3 }[] = [];

  const first = remaining.shift();
  if (!first) return [];
  connected.push(first);

  while (remaining.length) {
    let bestFromIndex = 0;
    let bestToIndex = 0;
    let bestDist = Number.POSITIVE_INFINITY;

    for (let i = 0; i < connected.length; i++) {
      for (let j = 0; j < remaining.length; j++) {
        const a = connected[i].position;
        const b = remaining[j].position;
        const dx = a.x - b.x;
        const dz = a.z - b.z;
        const distSq = dx * dx + dz * dz;
        if (distSq < bestDist) {
          bestDist = distSq;
          bestFromIndex = i;
          bestToIndex = j;
        }
      }
    }

    const from = connected[bestFromIndex];
    const to = remaining.splice(bestToIndex, 1)[0];

    const road = createRoadBetween(scene, from.position, to.position, theme);
    if (road) {
      roads.push(road);
    }
    connected.push(to);
  }

  return roads;
}

function createRoadBetween(scene: Scene, from: Vector3, to: Vector3, theme: WorldVisualTheme): Mesh | null {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const distance = Math.sqrt(dx * dx + dz * dz);
  if (!isFinite(distance) || distance < 1) {
    return null;
  }

  const segments = Math.max(2, Math.floor(distance / 20));
  const path: Vector3[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = from.x + dx * t;
    const z = from.z + dz * t;
    const groundPoint = projectToGround(scene, x, z);
    groundPoint.y += 0.05;
    path.push(groundPoint);
  }

  const road = MeshBuilder.CreateTube(
    `road-${from.x.toFixed(1)}-${from.z.toFixed(1)}-${to.x.toFixed(1)}-${to.z.toFixed(1)}`,
    {
      path,
      radius: theme.roadRadius,
      tessellation: 8,
      sideOrientation: Mesh.FRONTSIDE
    },
    scene
  );

  const material = new StandardMaterial(`${road.name}-mat`, scene);
  material.diffuseColor = theme.roadColor;
  material.specularColor = Color3.Black();
  road.material = material;

  road.checkCollisions = false;
  road.isPickable = false;

  return road;
}

let npcTemplateMesh: Mesh | null = null;
let npcTemplateSkeleton: Skeleton | null = null;

async function ensureNPCTemplate(scene: Scene): Promise<{ mesh: Mesh; skeleton: Skeleton | null } | null> {
  if (npcTemplateMesh && npcTemplateMesh.getScene() === scene) {
    return { mesh: npcTemplateMesh, skeleton: npcTemplateSkeleton };
  }

  try {
    const result = await SceneLoader.ImportMeshAsync(null, "", NPC_MODEL_URL, scene);
    const templateMesh = result.meshes.find((m) => m instanceof Mesh) as Mesh | undefined;
    if (!templateMesh) {
      console.error("NPC template mesh not found in asset", NPC_MODEL_URL);
      return null;
    }

    const templateSkeleton = result.skeletons?.[0] ?? null;
    if (templateSkeleton) {
      templateSkeleton.enableBlending(0.1);
      templateMesh.skeleton = templateSkeleton;
    }

    templateMesh.setEnabled(false);
    templateMesh.isPickable = false;

    npcTemplateMesh = templateMesh;
    npcTemplateSkeleton = templateSkeleton;

    return { mesh: templateMesh, skeleton: templateSkeleton };
  } catch (error) {
    console.error("Failed to load NPC template asset", error);
    return null;
  }
}

function createNPCPosition(index: number, total: number): Vector3 {
  const angle = (index / Math.max(total, 1)) * Math.PI * 2;
  const radius = 10 + Math.floor(index / 4) * 4;
  return new Vector3(Math.cos(angle) * radius, 12, Math.sin(angle) * radius);
}

async function spawnNPCInstance({
  character,
  scene,
  index,
  total,
  questGiver
}: {
  character: WorldCharacter;
  scene: Scene;
  index: number;
  total: number;
  questGiver: boolean;
}): Promise<NPCInstance | null> {
  try {
    const template = await ensureNPCTemplate(scene);
    if (!template) return null;

    const { mesh: templateMesh, skeleton: templateSkeleton } = template;

    const npcMesh = templateMesh.clone(`npc-${character.id}`, null);
    if (!npcMesh) {
      console.warn(`Failed to clone NPC mesh for ${character.id}`);
      return null;
    }

    npcMesh.setEnabled(true);
    npcMesh.isVisible = true;

    const spawnPosition = createNPCPosition(index, total);
    npcMesh.position = spawnPosition.clone();
    npcMesh.checkCollisions = true;
    npcMesh.ellipsoid = new Vector3(0.5, 1, 0.5);
    npcMesh.ellipsoidOffset = new Vector3(0, 1, 0);
    npcMesh.isPickable = true;

    let npcSkeleton: Skeleton | null = null;
    if (templateSkeleton) {
      npcSkeleton = templateSkeleton.clone(`npc-skel-${character.id}`);
      if (npcSkeleton) {
        npcSkeleton.enableBlending(0.1);
        npcMesh.skeleton = npcSkeleton;
      }
    }

    const controller = new CharacterController(npcMesh, null as any, scene);
    controller.setFaceForward(false);
    controller.setMode(0);
    controller.setStepOffset(0.4);
    controller.setSlopeLimit(30, 60);
    controller.setIdleAnim("idle", 1, true);
    controller.setTurnLeftAnim("turnLeft", 0.5, true);
    controller.setTurnRightAnim("turnRight", 0.5, true);
    controller.setWalkBackAnim("walkBack", 0.5, true);
    controller.setIdleJumpAnim("idleJump", 0.5, false);
    controller.setRunJumpAnim("runJump", 0.6, false);
    controller.setFallAnim("fall", 2, false);
    controller.setSlideBackAnim("slideBack", 1, false);
    controller.enableKeyBoard(false);

    const walkSound = new Sound(
      `npc-walk-${character.id}`,
      FOOTSTEP_SOUND_URL,
      scene,
      () => {
        controller.setSound(walkSound);
      },
      { loop: false }
    );

    controller.start();

    // Add quest marker if this NPC is a quest giver
    let questMarker: Mesh | null = null;
    if (questGiver) {
      questMarker = createQuestMarker(scene, character.id);
      questMarker.parent = npcMesh;
      questMarker.position = new Vector3(0, 2.8, 0); // Above NPC head
    }

    return { mesh: npcMesh, controller, questMarker };
  } catch (error) {
    console.warn(`Failed to spawn NPC instance for ${character.id}`, error);
    return null;
  }
}

function createQuestMarker(scene: Scene, npcId: string): Mesh {
  // Create a simple exclamation mark billboard
  const plane = MeshBuilder.CreatePlane(
    `quest-marker-${npcId}`,
    { width: 0.8, height: 0.8, sideOrientation: Mesh.DOUBLESIDE },
    scene
  );

  // Create dynamic texture for the exclamation mark
  const texture = new DynamicTexture(`quest-marker-texture-${npcId}`, 128, scene, true);
  const context = texture.getContext();

  // Draw yellow background circle
  context.fillStyle = '#FFD700';
  context.beginPath();
  context.arc(64, 64, 60, 0, 2 * Math.PI);
  context.fill();

  // Draw exclamation mark
  context.fillStyle = '#FFFFFF';
  context.font = 'bold 80px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('!', 64, 64);

  texture.update();

  // Create material
  const material = new StandardMaterial(`quest-marker-mat-${npcId}`, scene);
  material.diffuseTexture = texture;
  material.emissiveColor = new Color3(1, 0.84, 0); // Gold glow
  material.opacityTexture = texture;
  material.backFaceCulling = false;

  plane.material = material;
  plane.billboardMode = Mesh.BILLBOARDMODE_ALL; // Always face camera
  plane.isPickable = false;

  // Add gentle bobbing animation
  let time = 0;
  scene.onBeforeRenderObservable.add(() => {
    time += 0.016;
    plane.position.y = 2.8 + Math.sin(time * 3) * 0.1;
  });

  return plane;
}

function disposeNPCInstance(instance?: NPCInstance | null) {
  if (!instance) return;
  try {
    instance.controller?.stop();
  } catch (error) {
    console.warn("Failed to stop NPC controller", error);
  }
  instance.controller = null;
  if (instance.questMarker) {
    instance.questMarker.dispose(false, true);
  }
  if (instance.mesh) {
    instance.mesh.dispose(false, true);
  }
}

function tagNPCMeshHierarchy(rootMesh: Mesh, npcId: string) {
  rootMesh.metadata = { ...(rootMesh.metadata || {}), npcId };
  rootMesh.getChildMeshes(false).forEach((child) => {
    child.metadata = { ...(child.metadata || {}), npcId };
  });
}

function formatCharacterName(character: WorldCharacter) {
  const parts = [character.firstName, character.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : `NPC ${character.id.slice(0, 4)}`;
}

function buildActionContext({
  targetId,
  energy,
  playerMesh,
  worldData
}: {
  targetId: string;
  energy: number;
  playerMesh: Mesh | null;
  worldData: WorldData | null;
}): ActionContext {
  return {
    actor: worldData?.characters[0]?.id || DEFAULT_PLAYER_ID,
    target: targetId,
    timestamp: Date.now(),
    playerEnergy: energy,
    playerPosition: playerMesh ? { x: playerMesh.position.x, y: playerMesh.position.z } : { x: 0, y: 0 }
  };
}

function findActionDefinition(worldData: WorldData | null, actionId: string) {
  if (!worldData) return undefined;
  return [...worldData.actions, ...worldData.baseActions].find((action) => action.id === actionId);
}

interface StatusOverlayProps {
  sceneStatus: SceneStatus;
  dataStatus: DataStatus;
  playerStatus: PlayerStatus;
  npcStatus: NPCStatus;
  errorMessage: string;
}

function StatusOverlay({ sceneStatus, dataStatus, playerStatus, npcStatus, errorMessage }: StatusOverlayProps) {
  const isReady = sceneStatus === "ready" && dataStatus === "ready" && playerStatus === "ready" && npcStatus === "ready";
  if (isReady) return null;

  const statusRows = [
    { label: "Scene", value: sceneStatus },
    { label: "World Data", value: dataStatus },
    { label: "Player", value: playerStatus },
    { label: "NPCs", value: npcStatus }
  ];

  return (
    <div className="absolute inset-4 flex flex-col items-center justify-center rounded-md bg-background/80 backdrop-blur-sm border text-center gap-3">
      <p className="font-medium text-lg">Preparing world...</p>
      <div className="w-full max-w-xs space-y-2 text-sm">
        {statusRows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-muted-foreground">{row.label}</span>
            <span className={row.value === "error" ? "text-destructive font-semibold" : "font-medium"}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
      {errorMessage && <p className="text-sm text-destructive max-w-sm">{errorMessage}</p>}
    </div>
  );
}

interface PlayerStatusPanelProps {
  status: PlayerStatus;
  errorMessage: string;
  energy: number;
}

function PlayerStatusPanel({ status, errorMessage, energy }: PlayerStatusPanelProps) {
  const statusText: Record<PlayerStatus, string> = {
    idle: "Waiting for scene...",
    loading: "Loading avatar & animations",
    ready: "Player controller ready",
    error: "Failed to load player"
  };

  return (
    <div className="p-4 border rounded-md bg-muted/15 text-sm flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="font-medium">Player status</p>
        <span
          className={`text-xs uppercase tracking-wide ${
            status === "ready" ? "text-primary" : status === "error" ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          {status}
        </span>
      </div>
      <p className="text-muted-foreground">{statusText[status]}</p>
      <p className="text-xs text-muted-foreground">Energy: {energy}</p>
      {errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}
    </div>
  );
}

interface NPCPanelProps {
  status: NPCStatus;
  npcs: NPCDisplayInfo[];
  selectedNPCId: string | null;
  onSelectNPC: (id: string) => void;
  focusedNPC: NPCDisplayInfo | null;
  characterPortraits: Map<string, VisualAsset>;
  onShowCharacterDetail: () => void;
}

function NPCPanel({ status, npcs, selectedNPCId, onSelectNPC, focusedNPC, characterPortraits, onShowCharacterDetail }: NPCPanelProps) {
  if (status === "error") {
    return (
      <div className="p-4 border rounded-md bg-destructive/10 text-sm text-destructive">
        Failed to place NPCs. Check console for details.
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="p-4 border rounded-md bg-muted/15 text-sm text-muted-foreground">Spawning NPCs...</div>
    );
  }

  if (status === "idle" && npcs.length === 0) {
    return (
      <div className="p-4 border rounded-md bg-muted/15 text-sm text-muted-foreground">
        NPCs will appear once the scene finishes loading.
      </div>
    );
  }

  if (!npcs.length) {
    return (
      <div className="p-4 border rounded-md bg-muted/15 text-sm text-muted-foreground">No characters available.</div>
    );
  }

  return (
    <div className="p-4 border rounded-md bg-background space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <p className="font-semibold">NPC overview</p>
        <span className="text-xs text-muted-foreground">{npcs.length} placed</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {npcs.map((npc) => (
          <button
            key={npc.id}
            type="button"
            onClick={() => onSelectNPC(npc.id)}
            className={`px-3 py-1 rounded-full border text-xs transition-colors ${
              npc.id === selectedNPCId
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 hover:bg-muted"
            } ${npc.questGiver ? "border-amber-500" : "border-border"}`}
          >
            {npc.name}
          </button>
        ))}
      </div>

      {focusedNPC && (
        <div className="rounded-md border bg-muted/20 p-3">
          <div className="flex gap-3">
            {/* Character Portrait */}
            {characterPortraits.get(focusedNPC.id) ? (
              <div className="flex-shrink-0">
                <img
                  src={`/${characterPortraits.get(focusedNPC.id)!.filePath}`}
                  alt={focusedNPC.name}
                  className="w-20 h-20 rounded-md object-cover border-2 border-primary/20"
                />
              </div>
            ) : (
              <div className="flex-shrink-0 w-20 h-20 rounded-md bg-muted/50 border-2 border-dashed border-border flex items-center justify-center">
                <span className="text-xs text-muted-foreground">No portrait</span>
              </div>
            )}

            {/* Character Info */}
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="font-medium">{focusedNPC.name}</p>
                {focusedNPC.questGiver && <Badge className="text-[10px]">Quest giver</Badge>}
              </div>
              {focusedNPC.occupation && <p className="text-xs text-muted-foreground">{focusedNPC.occupation}</p>}
              <p className="text-xs text-muted-foreground">Disposition: {focusedNPC.disposition || "Unknown"}</p>
              <p className="text-xs text-muted-foreground">
                Position: ({focusedNPC.position.x.toFixed(1)}, {focusedNPC.position.z.toFixed(1)})
              </p>
              {characterPortraits.get(focusedNPC.id) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 h-7 text-xs"
                  onClick={onShowCharacterDetail}
                >
                  View Details
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ActionConsoleProps {
  selectedNPC: NPCDisplayInfo | null;
  actions: Action[];
  playerEnergy: number;
  onActionSelect: (actionId: string) => void;
  actionFeedback: ActionFeedback | null;
  isPerforming: boolean;
}

function ActionConsole({
  selectedNPC,
  actions,
  playerEnergy,
  onActionSelect,
  actionFeedback,
  isPerforming
}: ActionConsoleProps) {
  return (
    <div className="p-4 border rounded-md bg-background space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">Action console</p>
          <p className="text-xs text-muted-foreground">
            {selectedNPC ? `Interacting with ${selectedNPC.name}` : "Select an NPC in the scene to see actions"}
          </p>
        </div>
        {isPerforming && <Badge variant="outline">Performing...</Badge>}
      </div>

      {selectedNPC ? (
        <DialogueActions actions={actions} onActionSelect={onActionSelect} playerEnergy={playerEnergy} />
      ) : (
        <div className="text-sm text-muted-foreground">Tap an NPC to surface contextual actions.</div>
      )}

      {actionFeedback && (
        <div className="rounded-md border bg-muted/20 p-3 space-y-1 text-sm">
          <p className="font-medium">Last action: {actionFeedback.actionName}</p>
          <p className="text-xs text-muted-foreground">
            Target: {actionFeedback.targetName} · {new Date(actionFeedback.timestamp).toLocaleTimeString()}
          </p>
          <p>{actionFeedback.result.narrativeText || actionFeedback.result.message || "No narrative provided."}</p>
        </div>
      )}
    </div>
  );
}

interface WorldDataPanelProps {
  worldData: WorldData | null;
  dataStatus: DataStatus;
  actionSummaries: ActionCategorySummary[];
  sampleSocialActions: SampleAction[];
  errorMessage: string;
}

function WorldDataPanel({ worldData, dataStatus, actionSummaries, sampleSocialActions, errorMessage }: WorldDataPanelProps) {
  if (dataStatus === "loading") {
    return <div className="p-4 border rounded-md text-sm text-muted-foreground">Loading world data...</div>;
  }

  if (dataStatus === "error") {
    return (
      <div className="p-4 border rounded-md bg-destructive/10 text-sm text-destructive">
        Failed to load world data: {errorMessage}
      </div>
    );
  }

  if (!worldData) {
    return null;
  }

  return (
    <div className="p-4 border rounded-md bg-background space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <p className="font-semibold">World data</p>
        <Badge variant="outline">{worldData.characters.length} characters</Badge>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs">
        <Stat label="Quests" value={worldData.quests.length} />
        <Stat label="World actions" value={worldData.actions.length} />
        <Stat label="Base actions" value={worldData.baseActions.length} />
        <Stat label="NPCs shown" value={Math.min(worldData.characters.length, MAX_NPCS)} />
      </div>

      <div>
        <p className="font-medium text-xs mb-1">Action categories</p>
        <div className="flex flex-wrap gap-2">
          {actionSummaries.map((summary) => (
            <Badge key={summary.category} variant="secondary">
              {summary.category}: {summary.count}
            </Badge>
          ))}
        </div>
      </div>

      {sampleSocialActions.length > 0 && (
        <div>
          <p className="font-medium text-xs mb-1">Sample social actions</p>
          <ul className="space-y-1">
            {sampleSocialActions.map((action) => (
              <li key={action.id} className="flex items-center justify-between text-xs border-b border-border/70 pb-1">
                <span className="font-medium">{action.name}</span>
                {action.energyCost && <span className="text-muted-foreground">⚡{action.energyCost}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md bg-muted/30 p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

interface TexturePanelProps {
  textures: VisualAsset[];
  selectedGroundTexture: string | null;
  selectedWallTexture: string | null;
  selectedRoadTexture: string | null;
  onApplyGroundTexture: (assetId: string) => void;
  onApplyWallTexture: (assetId: string) => void;
  onApplyRoadTexture: (assetId: string) => void;
  worldId: string;
}

function TexturePanel({
  textures,
  selectedGroundTexture,
  selectedWallTexture,
  selectedRoadTexture,
  onApplyGroundTexture,
  onApplyWallTexture,
  onApplyRoadTexture,
  worldId
}: TexturePanelProps) {
  const groundTextures = textures.filter(t => t.assetType === 'texture_ground');
  const wallTextures = textures.filter(t => t.assetType === 'texture_wall');
  const materialTextures = textures.filter(t => t.assetType === 'texture_material');

  return (
    <div className="p-4 border rounded-md bg-background space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">Texture Manager</p>
          <p className="text-xs text-muted-foreground">
            Apply AI-generated textures to the world
          </p>
        </div>
        <Badge variant="outline">{textures.length} total</Badge>
      </div>

      {/* Ground Textures */}
      {groundTextures.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Ground Textures ({groundTextures.length})</p>
          <p className="text-xs text-muted-foreground">Click to apply to terrain</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {groundTextures.map(texture => (
              <button
                key={texture.id}
                onClick={() => onApplyGroundTexture(texture.id)}
                className={`relative aspect-square rounded-md border-2 overflow-hidden transition-all hover:scale-105 ${
                  selectedGroundTexture === texture.id
                    ? "border-primary ring-2 ring-primary"
                    : "border-border hover:border-primary/50"
                }`}
                title={texture.name}
              >
                <img
                  src={`/${texture.filePath}`}
                  alt={texture.name}
                  className="w-full h-full object-cover"
                />
                {selectedGroundTexture === texture.id && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <Badge className="text-[10px]">Active</Badge>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Wall Textures - Apply to Settlements */}
      {wallTextures.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Building Textures ({wallTextures.length})</p>
          <p className="text-xs text-muted-foreground">Click to apply to all settlements and buildings</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {wallTextures.map(texture => (
              <button
                key={texture.id}
                onClick={() => onApplyWallTexture(texture.id)}
                className={`relative aspect-square rounded-md border-2 overflow-hidden transition-all hover:scale-105 ${
                  selectedWallTexture === texture.id
                    ? "border-primary ring-2 ring-primary"
                    : "border-border hover:border-primary/50"
                }`}
                title={texture.name}
              >
                <img
                  src={`/${texture.filePath}`}
                  alt={texture.name}
                  className="w-full h-full object-cover"
                />
                {selectedWallTexture === texture.id && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <Badge className="text-[10px]">Active</Badge>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Road/Material Textures */}
      {materialTextures.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Road Textures ({materialTextures.length})</p>
          <p className="text-xs text-muted-foreground">Click to apply to all roads connecting settlements</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {materialTextures.map(texture => (
              <button
                key={texture.id}
                onClick={() => onApplyRoadTexture(texture.id)}
                className={`relative aspect-square rounded-md border-2 overflow-hidden transition-all hover:scale-105 ${
                  selectedRoadTexture === texture.id
                    ? "border-primary ring-2 ring-primary"
                    : "border-border hover:border-primary/50"
                }`}
                title={texture.name}
              >
                <img
                  src={`/${texture.filePath}`}
                  alt={texture.name}
                  className="w-full h-full object-cover"
                />
                {selectedRoadTexture === texture.id && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <Badge className="text-[10px]">Active</Badge>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {textures.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No textures available yet.</p>
          <p className="text-xs mt-1">Generate textures from the world management panel.</p>
        </div>
      )}
    </div>
  );
}