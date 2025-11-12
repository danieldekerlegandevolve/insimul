import { Entity } from '@playcanvas/react';
import { Light, Render } from '@playcanvas/react/components';
import { useMaterial } from '@playcanvas/react/hooks';
import { PlayerController } from './PlayerController';
import { NPCManager } from './NPCManager';
import { SettlementRenderer } from './SettlementRenderer';
import { CameraMode } from './PlayCanvasGame';

interface Character {
  id: string;
  firstName: string;
  lastName: string;
  occupation?: string;
  age?: number | string;
  gender?: string;
  personality?: any;
  currentLocation: string;
  currentResidenceId?: string;
  currentOccupationId?: string;
}

interface Settlement {
  id: string;
  name: string;
  settlementType: string;
  terrain?: string;
  population: number;
  countryId?: string;
  stateId?: string;
}

interface Country {
  id: string;
  name: string;
  description?: string;
}

interface State {
  id: string;
  name: string;
  countryId: string;
}

interface WorldData {
  countries: Country[];
  states: State[];
  settlements: Settlement[];
  rules: any[];
  baseRules: any[];
  actions: any[];
  baseActions: any[];
  quests: any[];
  characters: Character[];
  businesses: any[];
  residences: any[];
  lots: any[];
  truths: any[];
}

interface GameSceneProps {
  worldData: WorldData;
  playerPosition: { x: number; y: number; z: number };
  onPlayerMove: (position: { x: number; y: number; z: number }) => void;
  onCharacterInteraction: (character: Character) => void;
  currentLocation: {
    settlement?: Settlement;
    state?: State;
    country?: Country;
  };
  cameraMode: CameraMode;
}

export function GameScene({
  worldData,
  playerPosition,
  onPlayerMove,
  onCharacterInteraction,
  currentLocation,
  cameraMode
}: GameSceneProps) {
  // Materials (must be inside Application component)
  const groundMaterial = useMaterial({ diffuse: '#4a7c0f' });

  return (
    <>
      {/* Lighting */}
      <Entity name="ambient-light">
        <Light type="directional" color="#ffffff" intensity={0.8} />
      </Entity>

      <Entity name="sun" position={[50, 50, 25]} rotation={[45, 45, 0]}>
        <Light
          type="directional"
          color="#ffffff"
          intensity={1}
          castShadows={true}
        />
      </Entity>

      {/* Player with Camera */}
      <PlayerController
        position={playerPosition}
        onPositionChange={onPlayerMove}
        cameraMode={cameraMode}
      />

      {/* Ground */}
      <Entity name="ground" position={[0, -0.5, 0]} scale={[1000, 1, 1000]}>
        <Render type="box" material={groundMaterial} />
      </Entity>

      {/* Settlements */}
      <SettlementRenderer
        worldData={worldData}
        currentLocation={currentLocation}
      />

      {/* NPCs */}
      <NPCManager
        characters={worldData.characters}
        settlements={worldData.settlements}
        onCharacterClick={onCharacterInteraction}
      />
    </>
  );
}
