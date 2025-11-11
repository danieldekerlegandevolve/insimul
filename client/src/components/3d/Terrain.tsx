import { useMemo } from 'react';
import { Plane, Box } from '@react-three/drei';
import * as THREE from 'three';

interface TerrainProps {
  worldData: any;
}

export function Terrain({ worldData }: TerrainProps) {
  // Generate terrain features based on world data
  const terrainFeatures = useMemo(() => {
    const features: any[] = [];
    const settlements = worldData.settlements || [];
    const spacing = 100;
    const gridSize = Math.ceil(Math.sqrt(settlements.length));

    // Create paths between settlements
    for (let i = 0; i < settlements.length - 1; i++) {
      const row1 = Math.floor(i / gridSize);
      const col1 = i % gridSize;
      const x1 = (col1 - gridSize / 2) * spacing;
      const z1 = (row1 - gridSize / 2) * spacing;

      const row2 = Math.floor((i + 1) / gridSize);
      const col2 = (i + 1) % gridSize;
      const x2 = (col2 - gridSize / 2) * spacing;
      const z2 = (row2 - gridSize / 2) * spacing;

      // Create road between settlements
      features.push({
        type: 'road',
        start: { x: x1, z: z1 },
        end: { x: x2, z: z2 }
      });
    }

    // Add natural features (trees, rocks) based on terrain type
    settlements.forEach((settlement: any, index: number) => {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;

      const centerX = (col - gridSize / 2) * spacing;
      const centerZ = (row - gridSize / 2) * spacing;

      const terrain = settlement.terrain || 'plains';

      // Add terrain-specific features around settlements
      if (terrain === 'forest') {
        // Add trees
        for (let i = 0; i < 20; i++) {
          features.push({
            type: 'tree',
            position: {
              x: centerX + (Math.random() - 0.5) * 80,
              y: 0,
              z: centerZ + (Math.random() - 0.5) * 80
            }
          });
        }
      } else if (terrain === 'mountains') {
        // Add rocks
        for (let i = 0; i < 10; i++) {
          features.push({
            type: 'rock',
            position: {
              x: centerX + (Math.random() - 0.5) * 80,
              y: 0,
              z: centerZ + (Math.random() - 0.5) * 80
            }
          });
        }
      }
    });

    return features;
  }, [worldData]);

  return (
    <group>
      {/* Render terrain features */}
      {terrainFeatures.map((feature, index) => {
        if (feature.type === 'tree') {
          return (
            <group key={`tree-${index}`} position={[feature.position.x, 0, feature.position.z]}>
              {/* Tree trunk */}
              <Box args={[0.5, 3, 0.5]} position={[0, 1.5, 0]} castShadow>
                <meshStandardMaterial color="#654321" />
              </Box>
              {/* Tree foliage */}
              <Box args={[2, 2, 2]} position={[0, 4, 0]} castShadow>
                <meshStandardMaterial color="#228b22" />
              </Box>
            </group>
          );
        }

        if (feature.type === 'rock') {
          return (
            <Box
              key={`rock-${index}`}
              args={[2, 2, 2]}
              position={[feature.position.x, 1, feature.position.z]}
              rotation={[
                Math.random() * 0.5,
                Math.random() * Math.PI,
                Math.random() * 0.5
              ]}
              castShadow
            >
              <meshStandardMaterial color="#808080" />
            </Box>
          );
        }

        if (feature.type === 'road') {
          const start = feature.start;
          const end = feature.end;
          const midX = (start.x + end.x) / 2;
          const midZ = (start.z + end.z) / 2;
          const length = Math.sqrt(
            Math.pow(end.x - start.x, 2) + Math.pow(end.z - start.z, 2)
          );
          const angle = Math.atan2(end.z - start.z, end.x - start.x);

          return (
            <Box
              key={`road-${index}`}
              args={[length, 0.1, 4]}
              position={[midX, 0.05, midZ]}
              rotation={[0, angle, 0]}
              receiveShadow
            >
              <meshStandardMaterial color="#8b7355" />
            </Box>
          );
        }

        return null;
      })}
    </group>
  );
}
