import { Canvas } from '@react-three/fiber';
import { ContactShadows, Float, OrbitControls } from '@react-three/drei';
import type { CollectibleItem } from '../types';

interface VoxelShowcaseProps {
  item?: CollectibleItem | null;
  mode: 'sealed' | 'reveal' | 'figure' | 'locked';
}

function CapsuleOrb() {
  return (
    <Float speed={2.2} rotationIntensity={0.5} floatIntensity={0.6}>
      <mesh>
        <sphereGeometry args={[1.05, 32, 32]} />
        <meshPhysicalMaterial
          color="#f7fbff"
          transparent
          opacity={0.62}
          roughness={0.12}
          metalness={0.02}
          transmission={0.25}
          thickness={0.8}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.48, 24, 24]} />
        <meshStandardMaterial color="#bff6ff" emissive="#8feaff" emissiveIntensity={0.9} />
      </mesh>
    </Float>
  );
}

function VoxelFigure({ item, locked = false }: { item: CollectibleItem; locked?: boolean }) {
  const primary = locked ? '#cbd5df' : item.palette.primary;
  const secondary = locked ? '#e4ebf2' : item.palette.secondary;
  const accent = locked ? '#b9c6d3' : item.palette.accent;

  return (
    <Float speed={1.6} rotationIntensity={0.35} floatIntensity={0.35}>
      <group position={[0, -0.45, 0]}>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.82, 1.12, 0.52]} />
          <meshStandardMaterial color={primary} roughness={0.32} metalness={0.12} />
        </mesh>
        <mesh position={[0, 0.92, 0]}>
          <boxGeometry args={[0.68, 0.62, 0.58]} />
          <meshStandardMaterial color={secondary} roughness={0.28} metalness={0.05} />
        </mesh>
        <mesh position={[0, 1.29, -0.02]}>
          <boxGeometry args={[0.78, 0.24, 0.62]} />
          <meshStandardMaterial color={primary} roughness={0.25} metalness={0.1} />
        </mesh>
        <mesh position={[-0.58, 0.15, 0]}>
          <boxGeometry args={[0.22, 0.82, 0.26]} />
          <meshStandardMaterial color={primary} roughness={0.34} metalness={0.08} />
        </mesh>
        <mesh position={[0.58, 0.15, 0]}>
          <boxGeometry args={[0.22, 0.82, 0.26]} />
          <meshStandardMaterial color={primary} roughness={0.34} metalness={0.08} />
        </mesh>
        <mesh position={[0.53, 0.72, 0.34]}>
          <boxGeometry args={[0.12, 0.72, 0.12]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.18} />
        </mesh>
        <mesh position={[-0.18, 0.96, 0.31]}>
          <boxGeometry args={[0.08, 0.08, 0.08]} />
          <meshStandardMaterial color="#141820" />
        </mesh>
        <mesh position={[0.18, 0.96, 0.31]}>
          <boxGeometry args={[0.08, 0.08, 0.08]} />
          <meshStandardMaterial color="#141820" />
        </mesh>
        <mesh position={[0, -0.63, 0]}>
          <boxGeometry args={[1.15, 0.18, 0.72]} />
          <meshStandardMaterial color={accent} roughness={0.2} metalness={0.22} />
        </mesh>
      </group>
    </Float>
  );
}

export function VoxelShowcase({ item, mode }: VoxelShowcaseProps) {
  return (
    <div className={`voxel-frame ${mode}`}>
      <Canvas camera={{ position: [2.6, 2.2, 3.3], fov: 42 }} shadows>
        <color attach="background" args={['#eef7fb']} />
        <ambientLight intensity={1.6} />
        <directionalLight position={[3, 4, 2]} intensity={2.2} castShadow />
        <pointLight position={[-2, 1.5, 2]} intensity={1.2} color="#c8f7ff" />
        {mode === 'sealed' || !item ? (
          <CapsuleOrb />
        ) : (
          <VoxelFigure item={item} locked={mode === 'locked'} />
        )}
        <ContactShadows position={[0, -1.2, 0]} opacity={0.22} scale={5} blur={2.4} far={2} />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate
          autoRotateSpeed={mode === 'reveal' ? 2.4 : 1}
        />
      </Canvas>
    </div>
  );
}
