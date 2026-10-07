import * as THREE from 'three'
import { box, cylinder, material, seeded, texturedMaterial } from '../visual'

export function addGround(scene: THREE.Scene) {
  const points = [
    [-31, -8], [-27, -19], [-14, -24], [2, -23], [17, -20], [28, -13], [31, -2],
    [29, 10], [21, 21], [7, 24], [-8, 23], [-21, 19], [-29, 10], [-33, 1],
  ]
  const shape = new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, z)))

  const shelf = new THREE.Mesh(new THREE.ShapeGeometry(shape), material(0x242924))
  shelf.rotation.x = -Math.PI / 2
  shelf.scale.set(1.045, 1.045, 1.045)
  shelf.position.y = -0.43
  shelf.receiveShadow = true
  scene.add(shelf)

  const shore = new THREE.Mesh(new THREE.ShapeGeometry(shape), texturedMaterial('#77715d', '#8b846c', 2, 7, 6))
  shore.rotation.x = -Math.PI / 2
  shore.scale.set(1.016, 1.016, 1.016)
  shore.position.y = -0.25
  shore.receiveShadow = true
  scene.add(shore)

  const landMat = texturedMaterial('#55624b', '#3c4739', 3, 7, 6)
  const land = new THREE.Mesh(new THREE.ShapeGeometry(shape), landMat)
  land.rotation.x = -Math.PI / 2
  land.position.y = -0.17
  land.receiveShadow = true
  scene.add(land)

  const waterMat = new THREE.MeshStandardMaterial({ color: 0x26383e, roughness: 0.58, metalness: 0.08, flatShading: true })
  const water = box(92, 0.16, 76, waterMat)
  water.position.y = -0.66
  water.receiveShadow = true
  scene.add(water)

  return { landMat, waterMat }
}

export function addTree(scene: THREE.Scene, x: number, z: number, scale: number, treeMaterials: THREE.MeshStandardMaterial[], seed: number) {
  const trunk = cylinder(0.065 * scale, 0.10 * scale, 0.70 * scale, 6, material(0x5e4f3c))
  trunk.position.set(x, 0.35 * scale, z)
  scene.add(trunk)

  const crownMat = material(seed % 4 === 0 ? 0x58704a : seed % 3 === 0 ? 0x456342 : 0x4e6945)
  treeMaterials.push(crownMat)

  const crownBottom = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42 * scale, 1), crownMat)
  crownBottom.scale.set(1.1, 0.82, 1.0)
  crownBottom.position.set(x, 0.83 * scale, z)
  crownBottom.castShadow = true
  scene.add(crownBottom)

  const crownTop = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32 * scale, 1), crownMat)
  crownTop.position.set(x + 0.04 * scale, 1.10 * scale, z - 0.02 * scale)
  crownTop.castShadow = true
  scene.add(crownTop)
}

export function addField(scene: THREE.Scene, x: number, z: number, w: number, d: number, seed: number) {
  const field = box(w, 0.05, d, texturedMaterial(seed % 2 ? '#74764c' : '#6e6c45', '#968b56', 1200 + seed, 6, 5))
  field.position.set(x, -0.035, z)
  scene.add(field)

  const rand = seeded(6000 + seed)
  const furrowMat = material(0x58543c)
  for (let i = -w / 2 + 0.32; i < w / 2; i += 0.58) {
    const furrow = box(0.035, 0.023, d - 0.28, furrowMat)
    furrow.position.set(x + i, 0.005, z)
    scene.add(furrow)
  }

  // Sparse hay bales / field props keep agricultural areas readable from afar.
  for (let i = 0; i < Math.max(2, Math.floor(w / 2.4)); i += 1) {
    const bale = cylinder(0.16, 0.16, 0.26, 8, material(0x9a8250))
    bale.rotation.z = Math.PI / 2
    bale.position.set(x - w * 0.35 + rand() * w * 0.7, 0.16, z - d * 0.32 + rand() * d * 0.64)
    scene.add(bale)
  }
}

export function addPark(scene: THREE.Scene, x: number, z: number, treeMaterials: THREE.MeshStandardMaterial[]) {
  const grass = box(5.8, 0.055, 4.2, texturedMaterial('#596b4f', '#40513d', 3550, 4, 4))
  grass.position.set(x, -0.03, z)
  scene.add(grass)

  const pathMat = texturedMaterial('#77776f', '#99958a', 3551, 4, 2)
  const pathA = box(5.1, 0.035, 0.52, pathMat)
  pathA.position.set(x, 0.01, z)
  scene.add(pathA)
  const pathB = box(0.52, 0.035, 3.5, pathMat)
  pathB.position.set(x, 0.012, z)
  scene.add(pathB)

  const positions = [[-2.1,-1.45],[-2.05,1.25],[2.0,-1.3],[2.15,1.3],[-1.0,1.35],[1.0,-1.45]]
  positions.forEach(([dx, dz], i) => addTree(scene, x + dx, z + dz, 0.72 + (i % 2) * 0.08, treeMaterials, 500 + i))

  const benchMat = material(0x6a513d)
  const metal = material(0x3f4647)
  for (const dz of [-0.72, 0.72]) {
    const seat = box(0.75, 0.08, 0.24, benchMat)
    seat.position.set(x + 1.2, 0.18, z + dz)
    scene.add(seat)
    for (const dx of [-0.28, 0.28]) {
      const leg = box(0.05, 0.22, 0.05, metal)
      leg.position.set(x + 1.2 + dx, 0.09, z + dz)
      scene.add(leg)
    }
  }
}
