import { useEffect, useRef, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, Map, MessageSquare, Users, Building, Home } from 'lucide-react';
import { World3D } from './3d/World3D';
import { FastTravelMap } from './3d/FastTravelMap';
import { CharacterChatDialog } from './CharacterChatDialog';
import { LocationInfo } from './3d/LocationInfo';

interface Insimul3DGameProps {
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

export function Insimul3DGame({ worldId, worldName, onBack }: Insimul3DGameProps) {
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard handler for "M" key to open map
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setShowFastTravel(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update current location based on player proximity to settlements
  useEffect(() => {
    if (worldData.settlements.length === 0) return;

    // Find closest settlement
    let closestSettlement = null;
    let closestDistance = Infinity;
    const spacing = 300;
    const gridSize = Math.ceil(Math.sqrt(worldData.settlements.length));

    worldData.settlements.forEach((settlement: Settlement, index: number) => {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      const settlementX = (col - gridSize / 2) * spacing;
      const settlementZ = (row - gridSize / 2) * spacing;

      const distance = Math.sqrt(
        Math.pow(playerPosition.x - settlementX, 2) +
        Math.pow(playerPosition.z - settlementZ, 2)
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestSettlement = settlement;
      }
    });

    if (closestSettlement) {
      const state = worldData.states.find((s: State) => s.id === closestSettlement.stateId);
      const country = worldData.countries.find((c: Country) => c.id === closestSettlement.countryId);

      setCurrentLocation({
        settlement: closestSettlement,
        state,
        country
      });
    }
  }, [playerPosition, worldData.settlements, worldData.states, worldData.countries]);

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
    <div ref={containerRef} className="relative h-screen w-screen bg-black overflow-hidden">
      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas
          shadows
          camera={{ position: [0, 5, 10], fov: 75 }}
          style={{ width: '100%', height: '100%' }}
        >
          <Suspense fallback={null}>
            <World3D
              worldData={worldData}
              playerPosition={playerPosition}
              onPlayerMove={setPlayerPosition}
              onCharacterInteraction={handleCharacterInteraction}
              currentLocation={currentLocation}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Top Bar UI */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent pointer-events-none z-10">
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
            onClick={() => setShowFastTravel(true)}
            className="bg-black/50 hover:bg-black/70 border-white/20 text-white"
          >
            <Map className="w-4 h-4 mr-2" />
            Fast Travel (M)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStats(!showStats)}
            className="bg-black/50 hover:bg-black/70 border-white/20 text-white"
          >
            <Users className="w-4 h-4 mr-2" />
            Stats
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="bg-black/50 hover:bg-black/70 border-white/20 text-white"
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
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
        <Card className="absolute right-4 top-24 w-80 bg-black/90 border-white/20 text-white z-10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              World Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
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
              <div className="flex justify-between">
                <span className="text-gray-400">Lots:</span>
                <span className="font-semibold">{worldData.lots.length}</span>
              </div>
              <div className="flex justify-between border-t border-white/20 pt-2 mt-2">
                <span className="text-gray-400">Quests:</span>
                <span className="font-semibold">{worldData.quests.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls Help */}
      <div className="absolute bottom-4 left-4 bg-black/70 px-4 py-3 rounded-lg backdrop-blur-sm text-white text-sm pointer-events-none z-10">
        <p className="font-semibold mb-1">Controls:</p>
        <p>• WASD / Arrow Keys - Move</p>
        <p>• Mouse - Look Around</p>
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
