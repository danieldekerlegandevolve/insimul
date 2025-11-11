import { Box, Cylinder, Text } from '@react-three/drei';
import { useState } from 'react';

interface Building3DProps {
  building: any;
  lot: any;
  position: { x: number; y: number; z: number };
  type: string;
}

export function Building3D({ building, lot, position, type }: Building3DProps) {
  const [hovered, setHovered] = useState(false);

  // Determine building appearance based on type
  const getBuildingStyle = () => {
    // Scale factor to make buildings larger
    const scale = 2.5;

    if (!building) {
      return {
        color: '#808080',
        height: 3 * scale,
        width: 4 * scale,
        depth: 4 * scale,
        name: 'Empty Lot'
      };
    }

    if (type === 'business') {
      const businessType = building.businessType || 'Generic';

      switch (businessType) {
        case 'Bank':
          return { color: '#d4af37', height: 6 * scale, width: 6 * scale, depth: 6 * scale, name: building.name };
        case 'Hospital':
          return { color: '#ffffff', height: 8 * scale, width: 8 * scale, depth: 8 * scale, name: building.name };
        case 'School':
          return { color: '#fbbf24', height: 5 * scale, width: 7 * scale, depth: 6 * scale, name: building.name };
        case 'TownHall':
          return { color: '#9333ea', height: 7 * scale, width: 7 * scale, depth: 7 * scale, name: building.name };
        case 'Shop':
        case 'GroceryStore':
          return { color: '#10b981', height: 4 * scale, width: 5 * scale, depth: 4 * scale, name: building.name };
        case 'Restaurant':
        case 'Bar':
          return { color: '#f59e0b', height: 4 * scale, width: 5 * scale, depth: 5 * scale, name: building.name };
        case 'PoliceStation':
          return { color: '#3b82f6', height: 5 * scale, width: 6 * scale, depth: 6 * scale, name: building.name };
        case 'FireStation':
          return { color: '#ef4444', height: 5 * scale, width: 6 * scale, depth: 6 * scale, name: building.name };
        default:
          return { color: '#8b7355', height: 4 * scale, width: 4 * scale, depth: 4 * scale, name: building.name };
      }
    }

    // Residence
    const residenceType = building.residenceType || 'house';
    switch (residenceType) {
      case 'mansion':
        return { color: '#fcd34d', height: 6 * scale, width: 7 * scale, depth: 7 * scale, name: building.address };
      case 'apartment':
        return { color: '#94a3b8', height: 8 * scale, width: 5 * scale, depth: 5 * scale, name: building.address };
      default:
        return { color: '#dc2626', height: 4 * scale, width: 4 * scale, depth: 4 * scale, name: building.address };
    }
  };

  const style = getBuildingStyle();

  return (
    <group
      position={[position.x, position.y, position.z]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Building body */}
      <Box
        args={[style.width, style.height, style.depth]}
        position={[0, style.height / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={style.color}
          emissive={hovered ? style.color : '#000000'}
          emissiveIntensity={hovered ? 0.2 : 0}
        />
      </Box>

      {/* Roof */}
      <Box
        args={[style.width + 0.5, 0.5, style.depth + 0.5]}
        position={[0, style.height + 0.25, 0]}
        castShadow
      >
        <meshStandardMaterial color="#4a4a4a" />
      </Box>

      {/* Door */}
      <Box
        args={[1, 2, 0.2]}
        position={[0, 1, style.depth / 2]}
        castShadow
      >
        <meshStandardMaterial color="#654321" />
      </Box>

      {/* Windows */}
      {[...Array(2)].map((_, i) => (
        <Box
          key={`window-${i}`}
          args={[0.8, 0.8, 0.1]}
          position={[
            (i - 0.5) * 2,
            style.height * 0.6,
            style.depth / 2 + 0.05
          ]}
          castShadow
        >
          <meshStandardMaterial color="#87ceeb" />
        </Box>
      ))}

      {/* Building label (shown when hovered) */}
      {hovered && building && (
        <Text
          position={[0, style.height + 1, 0]}
          fontSize={0.4}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="black"
        >
          {style.name}
        </Text>
      )}
    </group>
  );
}
