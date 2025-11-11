import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Cylinder, Sphere, Box, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

interface Character3DProps {
  character: any;
  position: { x: number; y: number; z: number };
  onInteraction: (character: any) => void;
}

export function Character3D({ character, position, onInteraction }: Character3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Walking/idle animation with limb movement
  useFrame((state) => {
    if (groupRef.current) {
      // Subtle idle bobbing
      const idleTime = state.clock.elapsedTime + position.x;
      groupRef.current.position.y = position.y + Math.sin(idleTime * 2) * 0.05;

      // Animate legs (walking in place)
      if (leftLegRef.current && rightLegRef.current) {
        const walkSpeed = 3;
        const walkTime = state.clock.elapsedTime * walkSpeed + position.x;
        leftLegRef.current.rotation.x = Math.sin(walkTime) * 0.3;
        rightLegRef.current.rotation.x = Math.sin(walkTime + Math.PI) * 0.3;
      }

      // Animate arms (swinging)
      if (leftArmRef.current && rightArmRef.current) {
        const armTime = state.clock.elapsedTime * 3 + position.x;
        leftArmRef.current.rotation.x = Math.sin(armTime + Math.PI) * 0.2;
        rightArmRef.current.rotation.x = Math.sin(armTime) * 0.2;
      }
    }
  });

  // Determine character colors based on occupation or gender
  const getCharacterColors = () => {
    const occupation = character.occupation?.toLowerCase() || '';
    const gender = character.gender;

    // Body/clothing color
    let bodyColor = '#3b82f6'; // default blue
    if (occupation.includes('mayor')) bodyColor = '#9333ea';
    else if (occupation.includes('doctor')) bodyColor = '#ffffff';
    else if (occupation.includes('merchant')) bodyColor = '#d97706';
    else if (occupation.includes('police') || occupation.includes('officer')) bodyColor = '#1e40af';
    else if (occupation.includes('teacher')) bodyColor = '#059669';
    else if (occupation.includes('farmer')) bodyColor = '#92400e';
    else if (gender === 'female') bodyColor = '#ec4899';

    // Skin tone variation
    const skinTones = ['#ffd7a8', '#f0c0a0', '#e0a080', '#d08060', '#c07050'];
    const skinColor = skinTones[Math.floor(Math.abs(Math.sin(character.id?.charCodeAt(0) || 0)) * skinTones.length)];

    // Hair color variation
    const hairColors = ['#2c1810', '#4a2511', '#6b4423', '#8b5a2b', '#d4af37', '#000000'];
    const hairColor = hairColors[Math.floor(Math.abs(Math.sin(character.id?.charCodeAt(1) || 1)) * hairColors.length)];

    return { bodyColor, skinColor, hairColor };
  };

  const { bodyColor, skinColor, hairColor } = getCharacterColors();

  const handleClick = (e: any) => {
    e.stopPropagation();
    onInteraction(character);
  };

  return (
    <group
      ref={groupRef}
      position={[position.x, position.y, position.z]}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Torso */}
      <RoundedBox
        args={[0.5, 0.7, 0.3]}
        position={[0, 0.85, 0]}
        radius={0.05}
        smoothness={4}
        castShadow
      >
        <meshStandardMaterial
          color={bodyColor}
          emissive={hovered ? bodyColor : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </RoundedBox>

      {/* Neck */}
      <Cylinder args={[0.12, 0.12, 0.15, 8]} position={[0, 1.275, 0]} castShadow>
        <meshStandardMaterial color={skinColor} />
      </Cylinder>

      {/* Head */}
      <Sphere args={[0.25, 16, 16]} position={[0, 1.5, 0]} castShadow>
        <meshStandardMaterial
          color={skinColor}
          emissive={hovered ? skinColor : '#000000'}
          emissiveIntensity={hovered ? 0.2 : 0}
        />
      </Sphere>

      {/* Hair */}
      <Sphere args={[0.27, 16, 16]} position={[0, 1.58, 0]} castShadow>
        <meshStandardMaterial color={hairColor} />
      </Sphere>

      {/* Left arm */}
      <group ref={leftArmRef} position={[-0.35, 0.9, 0]}>
        <Cylinder args={[0.08, 0.08, 0.6, 8]} position={[0, -0.3, 0]} castShadow>
          <meshStandardMaterial color={bodyColor} />
        </Cylinder>
        {/* Hand */}
        <Sphere args={[0.1, 8, 8]} position={[0, -0.65, 0]} castShadow>
          <meshStandardMaterial color={skinColor} />
        </Sphere>
      </group>

      {/* Right arm */}
      <group ref={rightArmRef} position={[0.35, 0.9, 0]}>
        <Cylinder args={[0.08, 0.08, 0.6, 8]} position={[0, -0.3, 0]} castShadow>
          <meshStandardMaterial color={bodyColor} />
        </Cylinder>
        {/* Hand */}
        <Sphere args={[0.1, 8, 8]} position={[0, -0.65, 0]} castShadow>
          <meshStandardMaterial color={skinColor} />
        </Sphere>
      </group>

      {/* Left leg */}
      <group ref={leftLegRef} position={[-0.15, 0.5, 0]}>
        <Cylinder args={[0.1, 0.1, 0.5, 8]} position={[0, -0.25, 0]} castShadow>
          <meshStandardMaterial color="#1e3a8a"} />
        </Cylinder>
        {/* Foot */}
        <Box args={[0.15, 0.1, 0.25]} position={[0, -0.55, 0.05]} castShadow>
          <meshStandardMaterial color="#000000"} />
        </Box>
      </group>

      {/* Right leg */}
      <group ref={rightLegRef} position={[0.15, 0.5, 0]}>
        <Cylinder args={[0.1, 0.1, 0.5, 8]} position={[0, -0.25, 0]} castShadow>
          <meshStandardMaterial color="#1e3a8a"} />
        </Cylinder>
        {/* Foot */}
        <Box args={[0.15, 0.1, 0.25]} position={[0, -0.55, 0.05]} castShadow>
          <meshStandardMaterial color="#000000"} />
        </Box>
      </group>

      {/* Character name label */}
      <Text
        position={[0, 2.3, 0]}
        fontSize={0.25}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="black"
      >
        {character.firstName}
      </Text>

      {/* Occupation label */}
      {character.occupation && (
        <Text
          position={[0, 2, 0]}
          fontSize={0.15}
          color="#cccccc"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="black"
        >
          {character.occupation}
        </Text>
      )}

      {/* Interaction indicator when hovered */}
      {hovered && (
        <Cylinder
          args={[0.5, 0.5, 0.1, 16]}
          position={[0, 0.05, 0]}
          rotation={[0, 0, 0]}
        >
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.5}
            emissive="#ffffff"
            emissiveIntensity={0.5}
          />
        </Cylinder>
      )}

      {/* Quest indicator */}
      {character.questGiver && (
        <Text
          position={[0, 2.6, 0]}
          fontSize={0.5}
          color="#ffd700"
          anchorX="center"
          anchorY="middle"
        >
          !
        </Text>
      )}
    </group>
  );
}
