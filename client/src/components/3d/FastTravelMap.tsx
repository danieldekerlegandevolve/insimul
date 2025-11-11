import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { X, MapPin, Building, Home, Users, Globe } from 'lucide-react';
import { useMemo } from 'react';

interface FastTravelMapProps {
  worldData: any;
  currentLocation: any;
  onClose: () => void;
  onTravel: (position: { x: number; y: number; z: number }, location: any) => void;
}

export function FastTravelMap({ worldData, currentLocation, onClose, onTravel }: FastTravelMapProps) {
  const handleTravelToSettlement = (settlement: any, index: number) => {
    const settlements = worldData.settlements || [];
    const spacing = 300; // Match the spacing in World3D
    const gridSize = Math.ceil(Math.sqrt(settlements.length));
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;

    const x = (col - gridSize / 2) * spacing;
    const z = (row - gridSize / 2) * spacing;

    const state = worldData.states?.find((s: any) => s.id === settlement.stateId);
    const country = worldData.countries?.find((c: any) => c.id === settlement.countryId);

    onTravel({ x, y: 0, z }, { settlement, state, country });
  };

  // Generate settlement positions for visual map
  const settlementPositions = useMemo(() => {
    const settlements = worldData.settlements || [];
    const spacing = 300;
    const gridSize = Math.ceil(Math.sqrt(settlements.length));

    return settlements.map((settlement: any, index: number) => {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      const x = (col - gridSize / 2) * spacing;
      const z = (row - gridSize / 2) * spacing;

      return {
        settlement,
        index,
        x,
        z,
        gridX: col,
        gridZ: row
      };
    });
  }, [worldData.settlements]);

  // Get terrain color based on terrain type
  const getTerrainColor = (terrain?: string) => {
    if (!terrain) return '#4a7c0f'; // default green
    const t = terrain.toLowerCase();
    if (t.includes('mountain')) return '#78716c';
    if (t.includes('desert')) return '#fef3c7';
    if (t.includes('forest')) return '#166534';
    if (t.includes('coast') || t.includes('beach')) return '#7dd3fc';
    if (t.includes('plain') || t.includes('grassland')) return '#84cc16';
    if (t.includes('swamp')) return '#134e4a';
    if (t.includes('tundra') || t.includes('snow')) return '#e0f2fe';
    return '#4a7c0f';
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <Card className="w-[90vw] h-[90vh] max-w-6xl bg-background/95 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <MapPin className="w-6 h-6" />
              Fast Travel Map
            </CardTitle>
            <CardDescription>Select a location to travel to instantly</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>

        <CardContent className="h-[calc(100%-8rem)]">
          <Tabs defaultValue="map" className="h-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="map">
                <Globe className="w-4 h-4 mr-2" />
                World Map
              </TabsTrigger>
              <TabsTrigger value="settlements">
                <Building className="w-4 h-4 mr-2" />
                Settlements
              </TabsTrigger>
              <TabsTrigger value="countries">
                <MapPin className="w-4 h-4 mr-2" />
                Countries
              </TabsTrigger>
              <TabsTrigger value="characters">
                <Users className="w-4 h-4 mr-2" />
                Characters
              </TabsTrigger>
            </TabsList>

            <TabsContent value="map" className="h-[calc(100%-3rem)]">
              <div className="h-full w-full bg-gradient-to-br from-green-900/30 to-blue-900/30 rounded-lg overflow-hidden relative">
                <svg
                  viewBox="-1000 -1000 2000 2000"
                  className="w-full h-full"
                  style={{ background: 'linear-gradient(135deg, #1e3a1e 0%, #0f2f3f 100%)' }}
                >
                  {/* Grid lines */}
                  {Array.from({ length: 20 }).map((_, i) => {
                    const pos = -1000 + (i * 100);
                    return (
                      <g key={`grid-${i}`}>
                        <line
                          x1={pos}
                          y1="-1000"
                          x2={pos}
                          y2="1000"
                          stroke="#ffffff10"
                          strokeWidth="1"
                        />
                        <line
                          x1="-1000"
                          y1={pos}
                          x2="1000"
                          y2={pos}
                          stroke="#ffffff10"
                          strokeWidth="1"
                        />
                      </g>
                    );
                  })}

                  {/* Settlement markers */}
                  {settlementPositions.map(({ settlement, index, x, z }) => {
                    const isCurrentLocation = currentLocation.settlement?.id === settlement.id;
                    const terrainColor = getTerrainColor(settlement.terrain);
                    const settlementSize = settlement.settlementType === 'city' ? 60 :
                                         settlement.settlementType === 'town' ? 40 : 25;

                    return (
                      <g
                        key={settlement.id}
                        transform={`translate(${x}, ${z})`}
                        onClick={() => handleTravelToSettlement(settlement, index)}
                        className="cursor-pointer transition-all hover:opacity-80"
                      >
                        {/* Terrain circle */}
                        <circle
                          r={settlementSize + 20}
                          fill={terrainColor}
                          opacity="0.3"
                        />

                        {/* Settlement circle */}
                        <circle
                          r={settlementSize}
                          fill={isCurrentLocation ? '#fbbf24' : '#ffffff'}
                          stroke={isCurrentLocation ? '#f59e0b' : '#94a3b8'}
                          strokeWidth="3"
                        />

                        {/* Current location indicator */}
                        {isCurrentLocation && (
                          <>
                            <circle
                              r={settlementSize + 10}
                              fill="none"
                              stroke="#fbbf24"
                              strokeWidth="2"
                              opacity="0.5"
                            >
                              <animate
                                attributeName="r"
                                from={settlementSize}
                                to={settlementSize + 15}
                                dur="1.5s"
                                repeatCount="indefinite"
                              />
                              <animate
                                attributeName="opacity"
                                from="0.8"
                                to="0"
                                dur="1.5s"
                                repeatCount="indefinite"
                              />
                            </circle>
                          </>
                        )}

                        {/* Settlement name */}
                        <text
                          y={settlementSize + 35}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="20"
                          fontWeight="bold"
                        >
                          {settlement.name}
                        </text>

                        {/* Settlement type */}
                        <text
                          y={settlementSize + 55}
                          textAnchor="middle"
                          fill="#94a3b8"
                          fontSize="14"
                        >
                          {settlement.settlementType.toUpperCase()}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Legend */}
                <div className="absolute bottom-4 right-4 bg-black/70 p-4 rounded-lg backdrop-blur-sm text-white text-sm">
                  <p className="font-semibold mb-2">Legend</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-white border-2 border-gray-400"></div>
                      <span>Settlement</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-yellow-400 border-2 border-yellow-600"></div>
                      <span>Current Location</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ background: '#166534' }}></div>
                      <span>Forest</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ background: '#78716c' }}></div>
                      <span>Mountains</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ background: '#7dd3fc' }}></div>
                      <span>Coastal</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settlements" className="h-[calc(100%-3rem)]">
              <ScrollArea className="h-full pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {worldData.settlements.map((settlement: any, index: number) => {
                    const state = worldData.states?.find((s: any) => s.id === settlement.stateId);
                    const country = worldData.countries?.find((c: any) => c.id === settlement.countryId);
                    const isCurrentLocation = currentLocation.settlement?.id === settlement.id;
                    const businesses = worldData.businesses?.filter((b: any) => b.settlementId === settlement.id) || [];
                    const characters = worldData.characters?.filter((c: any) => {
                      const residence = worldData.residences?.find((r: any) =>
                        r.settlementId === settlement.id && r.residentIds?.includes(c.id)
                      );
                      return residence;
                    }) || [];

                    return (
                      <Card
                        key={settlement.id}
                        className={`cursor-pointer transition-all hover:shadow-lg ${
                          isCurrentLocation ? 'border-2 border-primary' : ''
                        }`}
                        onClick={() => handleTravelToSettlement(settlement, index)}
                      >
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            {settlement.name}
                            {isCurrentLocation && <MapPin className="w-4 h-4 text-primary" />}
                          </CardTitle>
                          <CardDescription>
                            {settlement.settlementType.toUpperCase()}
                            {state && ` - ${state.name}`}
                            {country && `, ${country.name}`}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1 text-sm">
                            <p>🏘️ Population: {settlement.population || 'Unknown'}</p>
                            <p>🏢 Businesses: {businesses.length}</p>
                            <p>👥 Characters: {characters.length}</p>
                            {settlement.terrain && <p>🌍 Terrain: {settlement.terrain}</p>}
                          </div>
                          {!isCurrentLocation && (
                            <Button className="w-full mt-4" size="sm">
                              Travel Here
                            </Button>
                          )}
                          {isCurrentLocation && (
                            <p className="text-center text-sm text-muted-foreground mt-4">
                              Current Location
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="countries" className="h-[calc(100%-3rem)]">
              <ScrollArea className="h-full pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {worldData.countries.map((country: any) => {
                    const states = worldData.states?.filter((s: any) => s.countryId === country.id) || [];
                    const settlements = worldData.settlements?.filter((s: any) =>
                      s.countryId === country.id || states.some((st: any) => st.id === s.stateId)
                    ) || [];

                    return (
                      <Card key={country.id}>
                        <CardHeader>
                          <CardTitle>{country.name}</CardTitle>
                          <CardDescription>{country.description || 'A country in this world'}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-sm">🗺️ States: {states.length}</p>
                            <p className="text-sm">🏘️ Settlements: {settlements.length}</p>
                            {settlements.length > 0 && (
                              <div className="mt-4">
                                <p className="text-sm font-semibold mb-2">Major Settlements:</p>
                                <div className="space-y-1">
                                  {settlements.slice(0, 5).map((settlement: any, idx: number) => (
                                    <Button
                                      key={settlement.id}
                                      variant="outline"
                                      size="sm"
                                      className="w-full justify-start"
                                      onClick={() => handleTravelToSettlement(
                                        settlement,
                                        worldData.settlements.indexOf(settlement)
                                      )}
                                    >
                                      {settlement.name}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="characters" className="h-[calc(100%-3rem)]">
              <ScrollArea className="h-full pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {worldData.characters.slice(0, 50).map((character: any) => {
                    const residence = worldData.residences?.find((r: any) =>
                      r.residentIds?.includes(character.id)
                    );
                    const settlement = residence
                      ? worldData.settlements?.find((s: any) => s.id === residence.settlementId)
                      : null;

                    if (!settlement) return null;

                    return (
                      <Card
                        key={character.id}
                        className="cursor-pointer hover:shadow-lg transition-all"
                        onClick={() => {
                          const index = worldData.settlements.indexOf(settlement);
                          handleTravelToSettlement(settlement, index);
                        }}
                      >
                        <CardHeader>
                          <CardTitle className="text-base">
                            {character.firstName} {character.lastName}
                          </CardTitle>
                          <CardDescription>
                            {character.occupation || 'Resident'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1 text-sm">
                            {character.age && <p>Age: {character.age}</p>}
                            {character.gender && <p>Gender: {character.gender}</p>}
                            {settlement && (
                              <p className="flex items-center gap-1 mt-2">
                                <MapPin className="w-3 h-3" />
                                {settlement.name}
                              </p>
                            )}
                          </div>
                          <Button className="w-full mt-4" size="sm">
                            Visit
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
