import { Card, CardContent } from '../ui/card';
import { MapPin, Users, Building, Home } from 'lucide-react';

interface LocationInfoProps {
  currentLocation: any;
  worldData: any;
  playerPosition: { x: number; y: number; z: number };
}

export function LocationInfo({ currentLocation, worldData, playerPosition }: LocationInfoProps) {
  const { settlement, state, country } = currentLocation;

  if (!settlement) return null;

  const businesses = worldData.businesses?.filter((b: any) => b.settlementId === settlement.id) || [];
  const residences = worldData.residences?.filter((r: any) => r.settlementId === settlement.id) || [];
  const characters = worldData.characters?.filter((c: any) => {
    const residence = residences.find((r: any) => r.residentIds?.includes(c.id));
    return residence;
  }) || [];

  return (
    <Card className="absolute left-4 top-24 w-80 bg-black/80 border-white/20 text-white backdrop-blur-sm z-10 pointer-events-auto">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-lg">{settlement.name}</h3>
            </div>
            <p className="text-sm text-gray-300">
              {settlement.settlementType.charAt(0).toUpperCase() + settlement.settlementType.slice(1)}
              {state && ` - ${state.name}`}
            </p>
            {country && (
              <p className="text-xs text-gray-400">{country.name}</p>
            )}
          </div>

          <div className="border-t border-white/20 pt-2 space-y-1 text-sm">
            {settlement.population > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Population:</span>
                <span className="font-semibold">{settlement.population.toLocaleString()}</span>
              </div>
            )}
            {settlement.terrain && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Terrain:</span>
                <span className="font-semibold">{settlement.terrain}</span>
              </div>
            )}
          </div>

          <div className="border-t border-white/20 pt-2 space-y-2">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              <span className="text-sm">
                <span className="font-semibold">{businesses.length}</span> Businesses
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              <span className="text-sm">
                <span className="font-semibold">{residences.length}</span> Residences
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="text-sm">
                <span className="font-semibold">{characters.length}</span> Characters
              </span>
            </div>
          </div>

          {settlement.description && (
            <div className="border-t border-white/20 pt-2">
              <p className="text-xs text-gray-300 italic">{settlement.description}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
