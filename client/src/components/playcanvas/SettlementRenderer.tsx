import { Entity } from '@playcanvas/react';
import { Render } from '@playcanvas/react/components';
import { useMaterial } from '@playcanvas/react/hooks';

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

interface WorldData {
  countries: Country[];
  states: State[];
  settlements: Settlement[];
  businesses: Business[];
  residences: Residence[];
  lots: Lot[];
  [key: string]: any;
}

interface SettlementRendererProps {
  worldData: WorldData;
  currentLocation: {
    settlement?: Settlement;
    state?: State;
    country?: Country;
  };
}

export function SettlementRenderer({
  worldData,
  currentLocation
}: SettlementRendererProps) {
  const settlements = worldData.settlements || [];
  const lots = worldData.lots || [];

  // Materials for settlements
  const settlementMarkerMaterial = useMaterial({ diffuse: '#fbbf24', emissive: '#fbbf24', emissiveIntensity: 0.3 });
  const settlementGroundMaterial = useMaterial({ diffuse: '#78716c' });
  const buildingMaterial = useMaterial({ diffuse: '#8b7355' });

  // Generate settlement layout
  const generateSettlementLayout = () => {
    const spacing = 100;
    const gridSize = Math.ceil(Math.sqrt(settlements.length));

    return settlements.map((settlement, index) => {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;

      const x = (col - gridSize / 2) * spacing;
      const z = (row - gridSize / 2) * spacing;

      // Get lots for this settlement
      const settlementLots = lots.filter(lot => lot.settlementId === settlement.id);

      return {
        settlement,
        position: { x, y: 0, z },
        lots: settlementLots
      };
    });
  };

  const settlementLayouts = generateSettlementLayout();

  return (
    <>
      {settlementLayouts.map(({ settlement, position, lots: settlementLots }) => (
        <Entity
          key={settlement.id}
          name={`settlement-${settlement.name}`}
          position={[position.x, position.y, position.z]}
        >
          {/* Settlement Center Marker */}
          <Entity name="settlement-marker" position={[0, 2, 0]} scale={[2, 2, 2]}>
            <Render type="sphere" material={settlementMarkerMaterial} />
          </Entity>

          {/* Settlement Ground Plane */}
          <Entity name="settlement-ground" position={[0, 0.05, 0]} scale={[50, 1, 50]}>
            <Render type="box" material={settlementGroundMaterial} />
          </Entity>

          {/* Render Lots/Buildings */}
          {settlementLots.map((lot, lotIndex) => {
            // Arrange lots in a grid around settlement center
            const lotsGridSize = Math.ceil(Math.sqrt(settlementLots.length));
            const lotRow = Math.floor(lotIndex / lotsGridSize);
            const lotCol = lotIndex % lotsGridSize;
            const lotSpacing = 8;

            const lotX = (lotCol - lotsGridSize / 2) * lotSpacing;
            const lotZ = (lotRow - lotsGridSize / 2) * lotSpacing;

            const buildingHeight = 3;

            return (
              <Entity
                key={lot.id}
                name={`lot-${lot.address}`}
                position={[lotX, buildingHeight / 2, lotZ]}
                scale={[2, buildingHeight, 2]}
              >
                <Render type="box" material={buildingMaterial} />
              </Entity>
            );
          })}
        </Entity>
      ))}
    </>
  );
}
