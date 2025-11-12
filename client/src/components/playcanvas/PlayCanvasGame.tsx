import { useState, useEffect } from 'react';
import { Application, Entity } from '@playcanvas/react';
import { Camera, Light, Render } from '@playcanvas/react/components';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { ArrowLeft, Map, Users, Eye } from 'lucide-react';
import { CharacterChatDialog } from '../CharacterChatDialog';
import { LocationInfo } from '../3d/LocationInfo';
import { FastTravelMap } from '../3d/FastTravelMap';
import { PlayerController } from './PlayerController';
import { NPCManager } from './NPCManager';
import { SettlementRenderer } from './SettlementRenderer';

interface PlayCanvasGameProps {
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

interface Business {
  id: string;
  name: string;
  businessType: string;
  settlementId: string;
  lotId?: string;
}

interface Residence {
  id: string;
  address: string;
  residenceType: string;
  settlementId: string;
  lotId: string;
  residentIds: string[];
}

interface Lot {
  id: string;
  address: string;
  settlementId: string;
  buildingType: string;
  buildingId?: string;
}

interface Truth {
  id: string;
  title: string;
  content: string;
  entryType: string;
  timestep: number;
  characterId?: string;
  [key: string]: any;
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
  businesses: Business[];
  residences: Residence[];
  lots: Lot[];
  truths: Truth[];
}

export type CameraMode = 'first-person' | 'third-person';

export function PlayCanvasGame({ worldId, worldName, onBack }: PlayCanvasGameProps) {
  const [loading, setLoading] = useState(true);
  const [worldData, setWorldData] = useState<WorldData>({
    countries: [],
    states: [],
    settlements: [],
    rules: [],
    baseRules: [],
    actions: [],
    baseActions: [],
    quests: [],
    characters: [],
    businesses: [],
    residences: [],
    lots: [],
    truths: []
  });
  const [showFastTravel, setShowFastTravel] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0, z: 0 });
  const [currentLocation, setCurrentLocation] = useState<{
    settlement?: Settlement;
    state?: State;
    country?: Country;
  }>({});
  const [showStats, setShowStats] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>('third-person');

  // Load world data
  useEffect(() => {
    async function loadWorldData() {
      try {
        const [
          charactersRes,
          countriesRes,
          statesRes,
          settlementsRes,
          rulesRes,
          actionsRes,
          questsRes,
          businessesRes,
          residencesRes,
          lotsRes,
          truthsRes
        ] = await Promise.all([
          fetch(`/api/worlds/${worldId}/characters`),
          fetch(`/api/worlds/${worldId}/countries`),
          fetch(`/api/worlds/${worldId}/states`),
          fetch(`/api/worlds/${worldId}/settlements`),
          fetch(`/api/rules?worldId=${worldId}`),
          fetch(`/api/worlds/${worldId}/actions`),
          fetch(`/api/worlds/${worldId}/quests`),
          fetch(`/api/worlds/${worldId}/businesses`),
          fetch(`/api/worlds/${worldId}/residences`),
          fetch(`/api/worlds/${worldId}/lots`),
          fetch(`/api/worlds/${worldId}/truths`)
        ]);

        const characters = charactersRes.ok ? await charactersRes.json() : [];
        const countries = countriesRes.ok ? await countriesRes.json() : [];
        const states = statesRes.ok ? await statesRes.json() : [];
        const settlements = settlementsRes.ok ? await settlementsRes.json() : [];
        const rules = rulesRes.ok ? await rulesRes.json() : [];
        const actions = actionsRes.ok ? await actionsRes.json() : [];
        const quests = questsRes.ok ? await questsRes.json() : [];
        const businesses = businessesRes.ok ? await businessesRes.json() : [];
        const residences = residencesRes.ok ? await residencesRes.json() : [];
        const lots = lotsRes.ok ? await lotsRes.json() : [];
        const truths = truthsRes.ok ? await truthsRes.json() : [];

        // Try to fetch base resources
        let baseRules: any[] = [];
        let baseActions: any[] = [];

        try {
          const baseRulesRes = await fetch(`/api/rules/base`);
          if (baseRulesRes.ok) baseRules = await baseRulesRes.json();
        } catch (e) {
          console.log('Base rules not available:', e);
        }

        try {
          const baseActionsRes = await fetch(`/api/actions/base`);
          if (baseActionsRes.ok) baseActions = await baseActionsRes.json();
        } catch (e) {
          console.log('Base actions not available:', e);
        }

        setWorldData({
          countries,
          states,
          settlements,
          rules,
          baseRules,
          actions,
          baseActions,
          quests,
          characters,
          businesses,
          residences,
          lots,
          truths
        });

        // Set initial location (first settlement if available)
        if (settlements.length > 0) {
          const firstSettlement = settlements[0];
          const settlementState = states.find((s: State) => s.id === firstSettlement.stateId);
          const settlementCountry = countries.find((c: Country) => c.id === firstSettlement.countryId);

          setCurrentLocation({
            settlement: firstSettlement,
            state: settlementState,
            country: settlementCountry
          });
        }

        setLoading(false);
      } catch (error) {
        console.error('Failed to load world data:', error);
        setLoading(false);
      }
    }

    loadWorldData();
  }, [worldId]);

  const handleCharacterInteraction = (character: Character) => {
    setSelectedCharacter(character);
    setShowChat(true);
  };

  const handleFastTravel = (targetPosition: { x: number; y: number; z: number }, location: { settlement?: Settlement; state?: State; country?: Country }) => {
    setPlayerPosition(targetPosition);
    setCurrentLocation(location);
    setShowFastTravel(false);
  };

  const toggleCameraMode = () => {
    setCameraMode(prev => prev === 'first-person' ? 'third-person' : 'first-person');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-sky-400 to-green-600">
        <Card>
          <CardContent className="pt-6">
            <p className="text-lg">Loading world...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black overflow-hidden relative">
      {/* PlayCanvas Application */}
      <Application className="w-full h-full">
        {/* Lighting */}
        <Entity name="ambient-light">
          <Light type="directional" color="#ffffff" intensity={0.5} />
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
          onPositionChange={setPlayerPosition}
          cameraMode={cameraMode}
        />

        {/* Ground */}
        <Entity name="ground" position={[0, 0, 0]} rotation={[-90, 0, 0]}>
          <Render type="plane" />
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
          onCharacterClick={handleCharacterInteraction}
        />
      </Application>

      {/* Top Bar UI */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <Button variant="ghost" size="icon" onClick={onBack} className="bg-black/50 hover:bg-black/70">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">
            <h1 className="text-xl font-bold text-white">{worldName}</h1>
            {currentLocation.settlement && (
              <p className="text-sm text-gray-300">
                {currentLocation.settlement.name}
                {currentLocation.state && `, ${currentLocation.state.name}`}
                {currentLocation.country && ` - ${currentLocation.country.name}`}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleCameraMode}
            className="bg-black/50 hover:bg-black/70 border-white/20"
          >
            <Eye className="w-4 h-4 mr-2" />
            {cameraMode === 'first-person' ? '1st Person' : '3rd Person'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFastTravel(true)}
            className="bg-black/50 hover:bg-black/70 border-white/20"
          >
            <Map className="w-4 h-4 mr-2" />
            Fast Travel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStats(!showStats)}
            className="bg-black/50 hover:bg-black/70 border-white/20"
          >
            <Users className="w-4 h-4 mr-2" />
            Stats
          </Button>
        </div>
      </div>

      {/* Location Info Panel */}
      <LocationInfo
        currentLocation={currentLocation}
        worldData={worldData}
        playerPosition={playerPosition}
      />

      {/* Stats Panel */}
      {showStats && (
        <Card className="absolute right-4 top-24 w-80 bg-black/90 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Countries:</span>
                <span className="font-semibold">{worldData.countries.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">States/Regions:</span>
                <span className="font-semibold">{worldData.states.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Settlements:</span>
                <span className="font-semibold">{worldData.settlements.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Characters:</span>
                <span className="font-semibold">{worldData.characters.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Businesses:</span>
                <span className="font-semibold">{worldData.businesses.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Residences:</span>
                <span className="font-semibold">{worldData.residences.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls Help */}
      <div className="absolute bottom-4 left-4 bg-black/70 px-4 py-3 rounded-lg backdrop-blur-sm text-white text-sm pointer-events-none">
        <p className="font-semibold mb-1">Controls:</p>
        <p>• WASD / Arrow Keys - Move</p>
        <p>• Mouse - Look Around</p>
        <p>• V - Toggle Camera (1st/3rd Person)</p>
        <p>• Click Character - Talk</p>
        <p>• M - Open Map</p>
      </div>

      {/* Fast Travel Map */}
      {showFastTravel && (
        <FastTravelMap
          worldData={worldData}
          currentLocation={currentLocation}
          onClose={() => setShowFastTravel(false)}
          onTravel={handleFastTravel}
        />
      )}

      {/* Character Chat Dialog */}
      {selectedCharacter && (
        <CharacterChatDialog
          character={selectedCharacter}
          truths={worldData.truths.filter(t =>
            !t.characterId || t.characterId === selectedCharacter.id
          )}
          open={showChat}
          onOpenChange={(open) => {
            setShowChat(open);
            if (!open) setSelectedCharacter(null);
          }}
        />
      )}
    </div>
  );
}
