import * as THREE from 'three'

export const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

export function seeded(seed: number) {
  let x = Math.sin(seed * 999.91) * 43758.5453
  return () => {
    x = Math.sin(x * 12.9898 + 78.233) * 43758.5453
    return x - Math.floor(x)
  }
}

export function pixelTexture(base: string, accent: string, seed = 1, size = 32) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)
  const rand = seeded(seed)

  for (let i = 0; i < 58; i += 1) {
    const x = Math.floor(rand() * size)
    const y = Math.floor(rand() * size)
    const w = 1 + Math.floor(rand() * 4)
    const h = 1 + Math.floor(rand() * 3)
    ctx.globalAlpha = 0.07 + rand() * 0.19
    ctx.fillStyle = accent
    ctx.fillRect(x, y, w, h)
  }

  // A faint grid gives large flat surfaces a deliberate miniature-model look.
  ctx.globalAlpha = 0.075
  ctx.fillStyle = accent
  for (let x = 0; x < size; x += 8) ctx.fillRect(x, 0, 1, size)
  for (let y = 0; y < size; y += 8) ctx.fillRect(0, y, size, 1)
  ctx.globalAlpha = 1

  const texture = new THREE.CanvasTexture(canvas)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestMipmapLinearFilter
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 2
  return texture
}

export function material(color: number, roughness = 0.92, metalness = 0.015) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: true })
}

export function glassMaterial(color = 0x4c6670, opacity = 0.92) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.2,
    metalness: 0.18,
    transparent: opacity < 1,
    opacity,
    flatShading: true,
  })
}

export function emissiveMaterial(color: number, emissive = 0x08090a, intensity = 0.06) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: intensity,
    roughness: 0.72,
    metalness: 0.03,
    flatShading: true,
  })
}

export function texturedMaterial(base: string, accent: string, seed: number, repeatX = 1, repeatY = 1) {
  const map = pixelTexture(base, accent, seed)
  map.repeat.set(repeatX, repeatY)
  return new THREE.MeshStandardMaterial({ map, color: 0xffffff, roughness: 0.98, metalness: 0, flatShading: true })
}

export function box(w: number, h: number, d: number, mat: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

export function cylinder(radiusTop: number, radiusBottom: number, height: number, segments: number, mat: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), mat)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

export function setObjectShadows(root: THREE.Object3D, cast = true, receive = true) {
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = cast
      obj.receiveShadow = receive
    }
  })
  return root
}
