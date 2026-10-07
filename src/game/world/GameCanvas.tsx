import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { CountryState } from '../state/types'
import { createWorld } from './createWorld'

export default function GameCanvas({ state }: { state: CountryState }) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const stateRef = useRef(state)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const world = createWorld()
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' })
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.className = 'world-canvas'
    mount.appendChild(renderer.domElement)

    const camera = new THREE.OrthographicCamera(-20, 20, 20, -20, 0.1, 220)
    camera.position.set(34, 38, 34)
    camera.lookAt(0, 0, 0)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.085
    controls.enablePan = true
    controls.enableRotate = true
    controls.minZoom = 0.7
    controls.maxZoom = 2.8
    controls.zoomSpeed = 0.82
    controls.rotateSpeed = 0.42
    controls.panSpeed = 0.72
    controls.minPolarAngle = Math.PI * 0.23
    controls.maxPolarAngle = Math.PI * 0.43
    controls.target.set(0, 1.2, 0)

    const resize = () => {
      const width = Math.max(1, mount.clientWidth)
      const height = Math.max(1, mount.clientHeight)
      const aspect = width / height
      const size = 20
      camera.left = -size * aspect
      camera.right = size * aspect
      camera.top = size
      camera.bottom = -size
      camera.updateProjectionMatrix()

      // Deliberately render below native resolution: the result is sharper pixel-3D and much cheaper on mobile GPUs.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.35)
      renderer.setPixelRatio(dpr * 0.72)
      renderer.setSize(width, height, false)
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(mount)

    const clock = new THREE.Clock()
    let raf = 0
    const loop = () => {
      const dt = Math.min(clock.getDelta(), 0.05)
      world.update(dt, stateRef.current)
      controls.update()
      renderer.render(world.scene, camera)
      raf = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      controls.dispose()
      renderer.dispose()
      world.dispose()
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className="world-stage" aria-label="Живая 3D мини-страна" />
}
