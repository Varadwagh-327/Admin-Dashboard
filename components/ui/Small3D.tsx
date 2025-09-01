
"use client";
import React from 'react';
import { Canvas } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";


function Small3D() {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-60">
      <Canvas camera={{ position: [0, 0, 4] }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 2, 5]} />
        <Float speed={1.6} rotationIntensity={1.2} floatIntensity={0.8}>
          <mesh>
            <torusKnotGeometry args={[0.9, 0.18, 160, 16]} />
            <meshStandardMaterial wireframe />
          </mesh>
        </Float>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate={true} />
      </Canvas>
    </div>
  );
}

export default Small3D