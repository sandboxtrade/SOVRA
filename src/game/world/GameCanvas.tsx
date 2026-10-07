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
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', alpha: false })
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.08
    renderer.domElement.className = 'world-canvas'
    mount.appendChild(renderer.domElement)

    const camera = new THREE.OrthographicCamera(-20, 20, 20, -20, 0.1, 220)
    camera.position.set(42, 42, 40)
    camera.lookAt(0, 0.8, 0)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.enablePan = true
    controls.enableRotate = true
    controls.minZoom = 0.64
    controls.maxZoom = 3.9
    controls.zoomSpeed = 0.82
    controls.rotateSpeed = 0.34
    controls.panSpeed = 0.76
    controls.minPolarAngle = Math.PI * 0.24
    controls.maxPolarAngle = Math.PI * 0.405
    controls.target.set(0, 1.0, 0)
    controls.maxDistance = 160

    const resize = () => {
      const width = Math.max(1, mount.clientWidth)
      const height = Math.max(1, mount.clientHeight)
      const aspect = width / height
      const size = width < 500 ? 22.4 : 24.8
      camera.left = -size * aspect
      camera.right = size * aspect
      camera.top = size
      camera.bottom = -size
      camera.updateProjectionMatrix()

      // v0.5 favors cleaner silhouettes. DPR is capped to protect mobile GPUs without deliberately blurring the scene.
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 700 ? 1.42 : 1.65))
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
