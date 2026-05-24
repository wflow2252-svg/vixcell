import React, { useRef, Suspense, useState, useEffect } from 'react'
import ErrorBoundary from './ErrorBoundary'

// Lazy load all Three.js dependencies to prevent crashes if WebGL is not available
const Canvas = React.lazy(() => import('@react-three/fiber').then(m => ({ default: m.Canvas })))

function ThreeDLogoInner() {
  const [threeModules, setThreeModules] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      import('@react-three/fiber'),
      import('@react-three/drei'),
      import('three'),
    ]).then(([fiber, drei, THREE]) => {
      if (!cancelled) {
        setThreeModules({ fiber, drei, THREE })
      }
    }).catch((err) => {
      console.error('[ThreeDLogo] Failed to load 3D modules:', err)
    })
    return () => { cancelled = true }
  }, [])

  if (!threeModules) {
    return (
      <div className="logo-fallback-container">
        <div className="logo-fallback-glass">
          <svg className="logo-fallback-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logo-loading-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="var(--primary, #6366f1)" />
              </linearGradient>
            </defs>
            <path
              d="M32 24 L50 72 L68 24 H58 L50 51 L42 24 Z"
              fill="url(#logo-loading-gradient)"
              opacity="0.6"
            />
          </svg>
        </div>
      </div>
    )
  }

  const { drei, THREE } = threeModules
  const { Float, Text3D, Center, Environment } = drei

  const chromeMaterial = new THREE.MeshPhysicalMaterial({
    color: '#dcdcdc',
    metalness: 0.9,
    roughness: 0.22,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
    envMapIntensity: 0.25,
    reflectivity: 0.8
  })

  function VixcellLogo() {
    const groupRef = useRef()
    const { size } = threeModules.fiber.useThree()

    threeModules.fiber.useFrame((state) => {
      if (groupRef.current) {
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, (state.mouse.y * 0.2), 0.08)
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, (state.mouse.x * 0.3), 0.08)
      }
    })

    const fontUrl = '/helvetiker_bold.typeface.json'
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

  return (
    <div className="canvas-container">
      <Suspense fallback={null}>
        <Canvas camera={{ position: [0, 0, 4.5], fov: 60 }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 10]} intensity={1.8} />
          <directionalLight position={[-10, 5, -5]} intensity={1.2} />
          <directionalLight position={[0, -10, 5]} intensity={0.8} />
          <pointLight position={[5, -5, 5]} intensity={1.0} />
          <Suspense fallback={null}>
            <Environment preset="studio" />
            <VixcellLogo />
          </Suspense>
        </Canvas>
      </Suspense>
    </div>
  )
}

// Check WebGL support before trying to render
function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')))
  } catch {
    return false
  }
}

export default function ThreeDLogo() {
  if (!isWebGLAvailable()) {
    return (
      <div className="logo-fallback-container">
        <div className="logo-fallback-glass">
          <svg className="logo-fallback-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logo-nowebgl-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="var(--primary, #6366f1)" />
              </linearGradient>
              <filter id="nowebgl-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d="M32 24 L50 72 L68 24 H58 L50 51 L42 24 Z"
              fill="url(#logo-nowebgl-gradient)"
              filter="url(#nowebgl-glow)"
            />
          </svg>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <ThreeDLogoInner />
    </ErrorBoundary>
  )
}
