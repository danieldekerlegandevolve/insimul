import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  PerspectiveCamera,
  Sky,
  Environment,
  OrbitControls,
  Text,
  Box,
  Sphere,
  Cylinder,
  Plane,
  RoundedBox
} from '@react-three/drei';
import * as THREE from 'three';
import { Terrain } from './Terrain';
import { Settlement3D } from './Settlement3D';
import { Character3D } from './Character3D';

interface World3DProps {
  worldData: any;
  playerPosition: { x: number; y: number; z: number };
  onPlayerMove: (position: { x: number; y: number; z: number }) => void;
  onCharacterInteraction: (character: any) => void;
  currentLocation: any;
}

export function World3D({
  worldData,
  playerPosition,
  onPlayerMove,
  onCharacterInteraction,
  currentLocation
}: World3DProps) {
  const { camera } = useThree();
  const playerRef = useRef<THREE.Group>(null);
  const [moveDirection, setMoveDirection] = useState({ x: 0, z: 0 });
  const keysPressed = useRef<Set<string>>(new Set());

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current.add(key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Update player movement based on keys
  useFrame((state, delta) => {
    if (!playerRef.current) return;

    const moveSpeed = 20 * delta; // Increased speed
    let moveX = 0;
    let moveZ = 0;

    // World-space movement (not camera-relative)
    if (keysPressed.current.has('w') || keysPressed.current.has('arrowup')) {
      moveZ -= moveSpeed; // Move north
    }
    if (keysPressed.current.has('s') || keysPressed.current.has('arrowdown')) {
      moveZ += moveSpeed; // Move south
    }
    if (keysPressed.current.has('a') || keysPressed.current.has('arrowleft')) {
      moveX -= moveSpeed; // Move west
    }
    if (keysPressed.current.has('d') || keysPressed.current.has('arrowright')) {
      moveX += moveSpeed; // Move east
    }

    // Apply movement directly in world space
    if (moveX !== 0 || moveZ !== 0) {
      playerRef.current.position.x += moveX;
      playerRef.current.position.z += moveZ;

      // Update player position callback
      const newPos = {
        x: playerRef.current.position.x,
        y: playerRef.current.position.y,
        z: playerRef.current.position.z
      };
      onPlayerMove(newPos);
    }
  });

  // Generate world layout based on settlements
  const generateWorldLayout = () => {
    const settlements = worldData.settlements || [];
    const spacing = 300; // Increased distance between settlements for more space

    return settlements.map((settlement: any, index: number) => {
      // Arrange settlements in a grid pattern
      const gridSize = Math.ceil(Math.sqrt(settlements.length));
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;

      const x = (col - gridSize / 2) * spacing;
      const z = (row - gridSize / 2) * spacing;

      return {
        settlement,
        position: { x, y: 0, z }
      };
    });
  };

  const settlementPositions = generateWorldLayout();

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[50, 50, 25]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={500}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />

      {/* Sky */}
      <Sky
        distance={450000}
        sunPosition={[100, 20, 100]}
        inclination={0}
        azimuth={0.25}
      />

      {/* Ground Plane */}
      <Plane
        args={[10000, 10000]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.1, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#4a7c0f" />
      </Plane>

      {/* Terrain - procedurally generated based on world data */}
      <Terrain worldData={worldData} />

      {/* Render settlements */}
      {settlementPositions.map(({ settlement, position }, index: number) => (
        <Settlement3D
          key={settlement.id}
          settlement={settlement}
          position={position}
          worldData={worldData}
          onCharacterInteraction={onCharacterInteraction}
        />
      ))}

      {/* Player character */}
      <group ref={playerRef} position={[playerPosition.x, 0, playerPosition.z]}>
        {/* Torso */}
        <RoundedBox
          args={[0.5, 0.7, 0.3]}
          position={[0, 0.85, 0]}
          radius={0.05}
          smoothness={4}
          castShadow
        >
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.2} />
        </RoundedBox>

        {/* Neck */}
        <Cylinder args={[0.12, 0.12, 0.15, 8]} position={[0, 1.275, 0]} castShadow>
          <meshStandardMaterial color="#ffd7a8" />
        </Cylinder>

        {/* Head */}
        <Sphere args={[0.25, 16, 16]} position={[0, 1.5, 0]} castShadow>
          <meshStandardMaterial color="#ffd7a8" emissive="#ffd7a8" emissiveIntensity={0.1} />
        </Sphere>

        {/* Hair */}
        <Sphere args={[0.27, 16, 16]} position={[0, 1.58, 0]} castShadow>
          <meshStandardMaterial color="#4a2511" />
        </Sphere>

        {/* Left arm */}
        <group position={[-0.35, 0.9, 0]}>
          <Cylinder args={[0.08, 0.08, 0.6, 8]} position={[0, -0.3, 0]} castShadow>
            <meshStandardMaterial color="#10b981" />
          </Cylinder>
          <Sphere args={[0.1, 8, 8]} position={[0, -0.65, 0]} castShadow>
            <meshStandardMaterial color="#ffd7a8" />
          </Sphere>
        </group>

        {/* Right arm */}
        <group position={[0.35, 0.9, 0]}>
          <Cylinder args={[0.08, 0.08, 0.6, 8]} position={[0, -0.3, 0]} castShadow>
            <meshStandardMaterial color="#10b981" />
          </Cylinder>
          <Sphere args={[0.1, 8, 8]} position={[0, -0.65, 0]} castShadow>
            <meshStandardMaterial color="#ffd7a8" />
          </Sphere>
        </group>

        {/* Left leg */}
        <group position={[-0.15, 0.5, 0]}>
          <Cylinder args={[0.1, 0.1, 0.5, 8]} position={[0, -0.25, 0]} castShadow>
            <meshStandardMaterial color="#1e3a8a" />
          </Cylinder>
          <Box args={[0.15, 0.1, 0.25]} position={[0, -0.55, 0.05]} castShadow>
            <meshStandardMaterial color="#000000" />
          </Box>
        </group>

        {/* Right leg */}
        <group position={[0.15, 0.5, 0]}>
          <Cylinder args={[0.1, 0.1, 0.5, 8]} position={[0, -0.25, 0]} castShadow>
            <meshStandardMaterial color="#1e3a8a" />
          </Cylinder>
          <Box args={[0.15, 0.1, 0.25]} position={[0, -0.55, 0.05]} castShadow>
            <meshStandardMaterial color="#000000" />
          </Box>
        </group>

        {/* Player name label */}
        <Text
          position={[0, 2.3, 0]}
          fontSize={0.25}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="black"
        >
          You
        </Text>
      </group>

      {/* Camera controls (orbit controls for looking around) */}
      <OrbitControls
        target={[playerPosition.x, 0.6, playerPosition.z]}
        enablePan={true}
        enableZoom={true}
        minDistance={10}
        maxDistance={100}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        enableDamping={true}
        dampingFactor={0.05}
      />
    </>
  );
}
