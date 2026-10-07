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
  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)
  const rand = seeded(seed)

  for (let i = 0; i < 52; i += 1) {
    const x = Math.floor(rand() * size)
    const y = Math.floor(rand() * size)
    const w = 1 + Math.floor(rand() * 4)
    const h = 1 + Math.floor(rand() * 3)
    ctx.globalAlpha = 0.1 + rand() * 0.24
    ctx.fillStyle = accent
    ctx.fillRect(x, y, w, h)
  }
  ctx.globalAlpha = 1

  const texture = new THREE.CanvasTexture(canvas)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestMipmapNearestFilter
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

export function material(color: number, roughness = 0.95) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.015, flatShading: true })
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
