import { useMemo } from 'react';
import { Text, Box, Cylinder } from '@react-three/drei';
import { Character3D } from './Character3D';
import { Building3D } from './Building3D';

interface Settlement3DProps {
  settlement: any;
  position: { x: number; y: number; z: number };
  worldData: any;
  onCharacterInteraction: (character: any) => void;
}

export function Settlement3D({
  settlement,
  position,
  worldData,
  onCharacterInteraction
}: Settlement3DProps) {
  // Get all entities in this settlement
  const settlementData = useMemo(() => {
    const lots = worldData.lots?.filter((l: any) => l.settlementId === settlement.id) || [];
    const businesses = worldData.businesses?.filter((b: any) => b.settlementId === settlement.id) || [];
    const residences = worldData.residences?.filter((r: any) => r.settlementId === settlement.id) || [];

    // Get all characters - just take first 10 for this settlement as a demo
    // In reality, you'd filter by settlement properly
    const allCharacters = worldData.characters || [];
    const charactersPerSettlement = Math.ceil(allCharacters.length / (worldData.settlements?.length || 1));
    const settlementIndex = worldData.settlements?.indexOf(settlement) || 0;
    const startIndex = settlementIndex * charactersPerSettlement;
    const characters = allCharacters.slice(startIndex, startIndex + charactersPerSettlement);

    return { lots, businesses, residences, characters };
  }, [settlement, worldData]);

  // Generate building layout
  const buildings = useMemo(() => {
    const result: any[] = [];
    const { lots, businesses, residences } = settlementData;

    // Create buildings from lots
    const buildingSpacing = 25; // Increased spacing for larger buildings

    lots.forEach((lot: any, index: number) => {
      // Arrange buildings in a grid
      const gridSize = Math.ceil(Math.sqrt(lots.length));
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;

      const localX = (col - gridSize / 2) * buildingSpacing;
      const localZ = (row - gridSize / 2) * buildingSpacing;

      const building = businesses.find((b: any) => b.lotId === lot.id) ||
                      residences.find((r: any) => r.lotId === lot.id);

      result.push({
        lot,
        building,
        position: { x: localX, y: 0, z: localZ },
        type: lot.buildingType
      });
    });

    // If no lots, create some default buildings based on settlement type
    if (result.length === 0) {
      const defaultBuildingCount = settlement.settlementType === 'city' ? 20 :
                                   settlement.settlementType === 'town' ? 10 : 5;

      for (let i = 0; i < defaultBuildingCount; i++) {
        const gridSize = Math.ceil(Math.sqrt(defaultBuildingCount));
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;

        result.push({
          lot: null,
          building: businesses[i] || residences[i],
          position: {
            x: (col - gridSize / 2) * buildingSpacing,
            y: 0,
            z: (row - gridSize / 2) * buildingSpacing
          },
          type: i < businesses.length ? 'business' : 'residence'
        });
      }
    }

    return result;
  }, [settlement, settlementData]);

  // Position characters in the settlement
  const positionedCharacters = useMemo(() => {
    return settlementData.characters.map((character: any, index: number) => {
      // Distribute characters around the settlement
      const numChars = settlementData.characters.length;
      const gridSize = Math.ceil(Math.sqrt(numChars));
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;

      // Spread characters throughout the settlement area
      const spreadRadius = 60; // Larger area for characters to wander
      const charPosition = {
        x: (col - gridSize / 2) * 15 + (Math.random() - 0.5) * 10,
        z: (row - gridSize / 2) * 15 + (Math.random() - 0.5) * 10
      };

      return {
        character,
        position: charPosition
      };
    });
  }, [settlementData]);

  // Determine settlement color based on type
  const settlementColor = settlement.settlementType === 'city' ? '#ffd700' :
                         settlement.settlementType === 'town' ? '#ffeb3b' : '#fff59d';

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Settlement name marker */}
      <group position={[0, 15, 0]}>
        <Text
          fontSize={2}
          color={settlementColor}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.1}
          outlineColor="black"
        >
          {settlement.name}
        </Text>
        <Text
          position={[0, -1.5, 0]}
          fontSize={0.8}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="black"
        >
          {settlement.settlementType.toUpperCase()}
        </Text>
      </group>

      {/* Central plaza/landmark */}
      <Cylinder
        args={[10, 10, 0.5, 32]}
        position={[0, 0.25, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#cccccc" />
      </Cylinder>

      {/* Central monument/fountain */}
      <Cylinder
        args={[1, 1.5, 3, 16]}
        position={[0, 1.5, 0]}
        castShadow
      >
        <meshStandardMaterial color="#8b7355" />
      </Cylinder>

      {/* Buildings */}
      {buildings.map((item, index) => (
        <Building3D
          key={`building-${index}`}
          building={item.building}
          lot={item.lot}
          position={item.position}
          type={item.type}
        />
      ))}

      {/* Characters */}
      {positionedCharacters.map(({ character, position: charPos }, index: number) => (
        <Character3D
          key={character.id}
          character={character}
          position={{ x: charPos.x, y: 0, z: charPos.z }}
          onInteraction={onCharacterInteraction}
        />
      ))}

      {/* Settlement boundary indicator */}
      <Cylinder
        args={[40, 40, 0.2, 32]}
        position={[0, 0.1, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          color={settlementColor}
          transparent
          opacity={0.1}
        />
      </Cylinder>
    </group>
  );
}
