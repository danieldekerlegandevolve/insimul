import { Entity } from '@playcanvas/react';
import { Render } from '@playcanvas/react/components';
import { useMaterial } from '@playcanvas/react/hooks';

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

interface NPCManagerProps {
  characters: Character[];
  settlements: Settlement[];
  onCharacterClick: (character: Character) => void;
}

export function NPCManager({
  characters,
  settlements,
  onCharacterClick
}: NPCManagerProps) {
  // Materials for NPCs
  const npcBodyMaterial = useMaterial({ diffuse: '#9ca3af' }); // Gray
  const npcHeadMaterial = useMaterial({ diffuse: '#ffd7a8' }); // Skin tone

  // Generate NPC positions based on their settlements
  const generateNPCPosition = (character: Character, index: number) => {
    // Find the settlement this character belongs to
    const settlement = settlements.find(s => s.id === character.currentLocation);

    if (!settlement) {
      // Default position if settlement not found
      return { x: index * 2, y: 0, z: 0 };
    }

    // Calculate settlement position (using same logic as SettlementRenderer)
    const settlementIndex = settlements.findIndex(s => s.id === settlement.id);
    const gridSize = Math.ceil(Math.sqrt(settlements.length));
    const row = Math.floor(settlementIndex / gridSize);
    const col = settlementIndex % gridSize;
    const spacing = 100;

    const settlementX = (col - gridSize / 2) * spacing;
    const settlementZ = (row - gridSize / 2) * spacing;

    // Spread NPCs around the settlement
    const charactersInSettlement = characters.filter(c => c.currentLocation === settlement.id);
    const charIndex = charactersInSettlement.findIndex(c => c.id === character.id);
    const angle = (charIndex / charactersInSettlement.length) * Math.PI * 2;
    const radius = 15 + Math.random() * 10;

    return {
      x: settlementX + Math.cos(angle) * radius,
      y: 0,
      z: settlementZ + Math.sin(angle) * radius
    };
  };

  return (
    <>
      {characters.map((character, index) => {
        const pos = generateNPCPosition(character, index);

        return (
          <Entity
            key={character.id}
            name={`npc-${character.firstName}-${character.lastName}`}
            position={[pos.x, pos.y + 1, pos.z]}
          >
            {/* Character Body */}
            <Entity name="npc-body" position={[0, 0, 0]}>
              <Render type="cylinder" material={npcBodyMaterial} />
            </Entity>

            {/* Character Head */}
            <Entity name="npc-head" position={[0, 0.9, 0]}>
              <Render type="sphere" material={npcHeadMaterial} />
            </Entity>
          </Entity>
        );
      })}
    </>
  );
}
