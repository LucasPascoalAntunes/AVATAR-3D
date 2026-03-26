import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import Avatar from './Avatar.jsx';
import useStore from '../store.js';

function Platform() {
  const ringRef = useRef();
  const slide = useStore(s => s.currentSlide);
  const colors = ['#00D4FF', '#7C3AED', '#10D9A0', '#F59E0B', '#F0ABFC'];
  const themeColor = colors[slide] || '#00D4FF';

  useFrame((_, delta) => {
    if (ringRef.current) ringRef.current.rotation.y += delta * 0.12;
  });

  return (
    <group position={[0, 0.005, 0]}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[0.8, 64]} />
        <meshStandardMaterial color="#0d0d14" roughness={0.3} metalness={0.4} />
      </mesh>
      <group ref={ringRef}>
        {[0.6, 0.7, 0.76].map((r, i) => (
          <mesh key={i} rotation-x={-Math.PI / 2} position-y={0.003}>
            <ringGeometry args={[r - 0.006, r, 64]} />
            <meshStandardMaterial
              color={themeColor}
              emissive={themeColor}
              emissiveIntensity={0.6 - i * 0.18}
              transparent
              opacity={0.7 - i * 0.2}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Particles({ count = 25 }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 5,
      y: Math.random() * 3.5 + 0.3,
      z: (Math.random() - 0.5) * 5,
      speed: 0.15 + Math.random() * 0.25,
      phase: Math.random() * Math.PI * 2,
      s: 0.008 + Math.random() * 0.012,
    }))
  , [count]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    particles.forEach((p, i) => {
      dummy.position.set(
        p.x + Math.sin(t * p.speed + p.phase) * 0.4,
        p.y + Math.sin(t * p.speed * 0.7 + p.phase) * 0.25,
        p.z + Math.cos(t * p.speed + p.phase) * 0.4
      );
      dummy.scale.setScalar(p.s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial color="#00D4FF" emissive="#00D4FF" emissiveIntensity={0.6} transparent opacity={0.5} />
    </instancedMesh>
  );
}

function Ground() {
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={-0.001} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#080810" roughness={0.9} metalness={0.1} />
    </mesh>
  );
}

function SceneContent() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[3, 6, 4]}
        intensity={1.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-1}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-2, 4, -2]} intensity={0.6} color="#aaccff" />
      <pointLight position={[1, 2.5, 3]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-2, 2, -1]} intensity={0.4} color="#ff9966" />
      <pointLight position={[0, 0.5, 2]} intensity={0.3} color="#88aaff" />

      <Environment preset="city" />

      <OrbitControls
        target={[0, 0.9, 0]}
        minDistance={1.5}
        maxDistance={6}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.65}
        enablePan={false}
        autoRotate={false}
        makeDefault
      />

      <Ground />
      <Platform />
      <Avatar />
      <Particles count={25} />

      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.55}
        scale={5}
        blur={2.5}
        far={5}
      />

      <EffectComposer>
        <Bloom luminanceThreshold={0.85} luminanceSmoothing={0.4} intensity={0.35} />
        <Vignette eskil={false} offset={0.15} darkness={0.45} />
      </EffectComposer>
    </>
  );
}

export default function Scene3D() {
  const setLoading = useStore(s => s.setLoading);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{
        position: [0, 1.1, 2.8],
        fov: 40,
        near: 0.1,
        far: 100,
      }}
      onCreated={() => {
        setTimeout(() => setLoading(false), 600);
      }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    >
      <SceneContent />
    </Canvas>
  );
}
