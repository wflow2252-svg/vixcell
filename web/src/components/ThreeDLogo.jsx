import React, { useRef, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Float, Text3D, Center } from '@react-three/drei'
import * as THREE from 'three'

// Premium Liquid Chrome (Silver Rhodium) using MeshPhysicalMaterial - adjusted to be shiny silver by light only (non-mirror)
const chromeMaterial = new THREE.MeshPhysicalMaterial({
  color: '#dcdcdc',
  metalness: 0.9,
  roughness: 0.22,
  clearcoat: 0.8,
  clearcoatRoughness: 0.1,
  envMapIntensity: 0.25, // minimal environment reflections to avoid mirror effect
  reflectivity: 0.8
})

function VixcellLogo() {
  const groupRef = useRef()
  const { size } = useThree()

  useFrame((state) => {
    // Smooth Parallax tilt based on mouse movement
    if (groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, (state.mouse.y * 0.2), 0.08)
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, (state.mouse.x * 0.3), 0.08)
    }
  })

  const fontUrl = '/helvetiker_bold.typeface.json'

  // Text options tailored for a thick, round, beveled liquid metal look (matching the reference "S" logo)
  const textOptions = {
    font: fontUrl,
    size: 2.4,
    height: 0.65,
    curveSegments: 32,
    bevelEnabled: true,
    bevelThickness: 0.2,
    bevelSize: 0.09,
    bevelOffset: 0,
    bevelSegments: 16,
    material: chromeMaterial
  }

  // Responsive scaling based on viewport width
  const isMobile = size.width < 768
  const isTablet = size.width >= 768 && size.width < 1024
  const scaleValue = isMobile ? 0.55 : (isTablet ? 0.8 : 1.1)

  return (
    <Float speed={1.5} rotationIntensity={0.15} floatIntensity={0.3}>
      <group ref={groupRef} scale={[scaleValue, scaleValue, scaleValue]}>
        <Center>
          <Text3D {...textOptions}>
            V
          </Text3D>
        </Center>
      </group>
    </Float>
  )
}

export default function ThreeDLogo() {
  return (
    <div className="canvas-container">
      <Canvas camera={{ position: [0, 0, 4.5], fov: 60 }}>
        {/* Ambient light for general soft illumination */}
        <ambientLight intensity={0.4} />
        {/* Dynamic directional lights from different angles to create brilliant specular highlights */}
        <directionalLight position={[10, 10, 10]} intensity={1.8} />
        <directionalLight position={[-10, 5, -5]} intensity={1.2} />
        <directionalLight position={[0, -10, 5]} intensity={0.8} />
        <pointLight position={[5, -5, 5]} intensity={1.0} />
        
        {/* Studio environment for subtle metallic shading foundation */}
        <Suspense fallback={null}>
          <Environment preset="studio" />
          <VixcellLogo />
        </Suspense>
      </Canvas>
    </div>
  )
}
