import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei'

export default function ThreeScene() {
  return (
    <div className="canvas-container">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Suspense fallback={null}>
          <Sphere args={[1, 64, 64]} position={[1.5, 0, 0]} scale={1.2}>
            <MeshDistortMaterial
              color="#6C63FF"
              attach="material"
              distort={0.4}
              speed={2}
              roughness={0.2}
            />
          </Sphere>
          <Sphere args={[1, 64, 64]} position={[-1.5, -1, -2]} scale={0.8}>
            <MeshDistortMaterial
              color="#00D4FF"
              attach="material"
              distort={0.5}
              speed={1.5}
              roughness={0.1}
            />
          </Sphere>
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  )
}
