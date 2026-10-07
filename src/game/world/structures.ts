import * as THREE from 'three'
import { box, material, texturedMaterial } from './visual'

export type SmokeParticle = { mesh: THREE.Mesh; phase: number; originX: number; originZ: number }
export type GrowthBuilding = { root: THREE.Group; threshold: number }

export function addGround(scene: THREE.Scene) {
  const points = [
    [-24, -7], [-20, -16], [-10, -20], [2, -19], [13, -17], [22, -11], [25, -2],
    [22, 8], [16, 17], [5, 20], [-6, 19], [-16, 16], [-23, 8], [-26, 1],
  ]
  const shape = new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, z)))

  const edgeGeo = new THREE.ShapeGeometry(shape)
  const edge = new THREE.Mesh(edgeGeo, material(0x242925))
  edge.rotation.x = -Math.PI / 2
  edge.scale.set(1.035, 1.035, 1.035)
  edge.position.y = -0.42
  edge.receiveShadow = true
  scene.add(edge)

  const landGeo = new THREE.ShapeGeometry(shape)
  const landMat = texturedMaterial('#53604b', '#374238', 3, 7, 6)
  const land = new THREE.Mesh(landGeo, landMat)
  land.rotation.x = -Math.PI / 2
  land.position.y = -0.18
  land.receiveShadow = true
  scene.add(land)

  const waterMat = new THREE.MeshStandardMaterial({ color: 0x26363a, roughness: 0.7, metalness: 0.05, flatShading: true })
  const water = box(74, 0.16, 62, waterMat)
  water.position.y = -0.65
  water.receiveShadow = true
  scene.add(water)

  return { landMat, waterMat }
}

export function addRoad(
  scene: THREE.Scene,
  x: number,
  z: number,
  w: number,
  d: number,
  roadMaterials: THREE.MeshStandardMaterial[],
) {
  const roadMat = texturedMaterial('#24282a', '#3b3d3d', Math.floor((x + 30) * 7 + (z + 30) * 3), 4, 2)
  roadMaterials.push(roadMat)
  const road = box(w, 0.08, d, roadMat)
  road.position.set(x, -0.02, z)
  scene.add(road)

  const laneMat = material(0xb7b09a)
  const horizontal = w > d
  const length = horizontal ? w : d
  for (let p = -length / 2 + 1.1; p < length / 2 - 0.6; p += 2.8) {
    const mark = box(horizontal ? 0.9 : 0.07, 0.018, horizontal ? 0.07 : 0.9, laneMat)
    mark.position.set(horizontal ? x + p : x, 0.035, horizontal ? z : z + p)
    scene.add(mark)
  }
}

export function addSidewalk(scene: THREE.Scene, x: number, z: number, w: number, d: number) {
  const slab = box(w, 0.1, d, texturedMaterial('#686d68', '#7d817a', Math.floor(x * 11 + z * 17 + 100), 3, 3))
  slab.position.set(x, 0.01, z)
  scene.add(slab)
}

export function addPanelBlock(
  scene: THREE.Scene,
  x: number,
  z: number,
  floors: number,
  seed: number,
  windows: THREE.MeshStandardMaterial[],
  buildingMaterials: THREE.MeshStandardMaterial[],
  rotation = 0,
) {
  const group = new THREE.Group()
  const facade = texturedMaterial(seed % 2 ? '#a7aaa5' : '#959892', '#6f746f', seed, 2, Math.max(2, floors / 2))
  buildingMaterials.push(facade)
  const body = box(3.4, floors * 0.56, 2.08, facade)
  body.position.y = (floors * 0.56) / 2
  group.add(body)

  const roof = box(3.12, 0.16, 1.82, material(0x666b69))
  roof.position.y = floors * 0.56 + 0.08
  group.add(roof)

  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x5c676c,
    emissive: 0x08090a,
    emissiveIntensity: 0.08,
    roughness: 1,
  })
  windows.push(windowMat)

  const winGeo = new THREE.BoxGeometry(0.18, 0.2, 0.025)
  for (let f = 0; f < floors; f += 1) {
    for (let c = 0; c < 5; c += 1) {
      const win = new THREE.Mesh(winGeo, windowMat)
      win.position.set(-1.14 + c * 0.57, 0.37 + f * 0.55, 1.055)
      group.add(win)
    }
  }

  const entry = box(0.5, 0.66, 0.08, material(0x333739))
  entry.position.set(0, 0.33, 1.08)
  group.add(entry)

  group.position.set(x, 0, z)
  group.rotation.y = rotation
  scene.add(group)
  return group
}

export function addOffice(scene: THREE.Scene, x: number, z: number, floors: number, threshold: number, growthBuildings: GrowthBuilding[]) {
  const root = new THREE.Group()
  const bodyMat = texturedMaterial('#606c72', '#95a2a5', 200 + floors, 2, floors / 2)
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x536b74, roughness: 0.35, metalness: 0.15, flatShading: true })
  const body = box(2.5, floors * 0.62, 2.5, bodyMat)
  body.position.y = floors * 0.31
  root.add(body)

  for (let f = 1; f < floors; f += 2) {
    const belt = box(2.56, 0.12, 2.56, glassMat)
    belt.position.y = f * 0.62
    root.add(belt)
  }
  root.position.set(x, 0, z)
  root.scale.y = 0.02
  root.visible = false
  scene.add(root)
  growthBuildings.push({ root, threshold })
}

export function addGovernment(scene: THREE.Scene, x: number, z: number) {
  const group = new THREE.Group()
  const bodyMat = texturedMaterial('#8e928c', '#b4b5aa', 401, 2, 2)
  const body = box(5.2, 2.1, 3.2, bodyMat)
  body.position.y = 1.05
  group.add(body)
  const upper = box(3.3, 1.15, 2.45, bodyMat)
  upper.position.y = 2.68
  group.add(upper)
  const roof = box(3.7, 0.18, 2.75, material(0x4c5150))
  roof.position.y = 3.34
  group.add(roof)

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.6, 5), material(0x656a69))
  mast.position.set(0, 4.18, 0)
  group.add(mast)
  const flag = box(0.65, 0.32, 0.04, material(0x8b3f3f))
  flag.position.set(0.34, 4.58, 0)
  group.add(flag)

  group.position.set(x, 0, z)
  scene.add(group)
}

export function addHouse(scene: THREE.Scene, x: number, z: number, seed: number, scale = 1) {
  const group = new THREE.Group()
  const base = box(1.4 * scale, 0.82 * scale, 1.05 * scale, texturedMaterial('#a39c91', '#777368', 500 + seed, 2, 2))
  base.position.y = 0.41 * scale
  group.add(base)

  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.02 * scale, 0.58 * scale, 4), material(seed % 2 ? 0x645149 : 0x57534b))
  roof.rotation.y = Math.PI / 4
  roof.position.y = 1.11 * scale
  roof.castShadow = true
  group.add(roof)

  group.position.set(x, 0, z)
  scene.add(group)
}

export function addTree(scene: THREE.Scene, x: number, z: number, scale: number, treeMaterials: THREE.MeshStandardMaterial[], seed: number) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.72 * scale, 5), material(0x635741))
  trunk.position.set(x, 0.36 * scale, z)
  trunk.castShadow = true
  scene.add(trunk)

  const crownMat = material(seed % 4 === 0 ? 0x5e704a : 0x4a6546)
  treeMaterials.push(crownMat)
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.48 * scale, 0), crownMat)
  crown.position.set(x, 0.9 * scale, z)
  crown.castShadow = true
  scene.add(crown)
}

export function addFactory(
  scene: THREE.Scene,
  x: number,
  z: number,
  smoke: SmokeParticle[],
  buildingMaterials: THREE.MeshStandardMaterial[],
) {
  const facade = texturedMaterial('#747774', '#535754', 900, 4, 2)
  buildingMaterials.push(facade)
  const body = box(6.4, 1.9, 3.3, facade)
  body.position.set(x, 0.95, z)
  scene.add(body)

  const annex = box(2.5, 1.3, 2.45, texturedMaterial('#686c69', '#4d514f', 901, 2, 2))
  annex.position.set(x + 3.45, 0.65, z + 0.18)
  scene.add(annex)

  for (let i = 0; i < 2; i += 1) {
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.35, 4.9, 8), material(0x6e6059))
    chimney.position.set(x - 1.55 + i * 2.25, 2.45, z - 0.72)
    chimney.castShadow = true
    scene.add(chimney)

    for (let p = 0; p < 5; p += 1) {
      const puffMat = new THREE.MeshStandardMaterial({ color: 0x6d7474, transparent: true, opacity: 0.25, roughness: 1 })
      const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(0.31 + p * 0.07, 0), puffMat)
      puff.position.set(chimney.position.x, 5.0 + p * 0.52, chimney.position.z)
      scene.add(puff)
      smoke.push({ mesh: puff, phase: p * 0.51 + i, originX: chimney.position.x, originZ: chimney.position.z })
    }
  }
}

export function addField(scene: THREE.Scene, x: number, z: number, w: number, d: number, seed: number) {
  const field = box(w, 0.05, d, texturedMaterial(seed % 2 ? '#737648' : '#6e6b42', '#8d8550', 1200 + seed, 6, 5))
  field.position.set(x, -0.04, z)
  scene.add(field)
  const furrowMat = material(0x56533b)
  for (let i = -w / 2 + 0.35; i < w / 2; i += 0.65) {
    const furrow = box(0.045, 0.025, d - 0.35, furrowMat)
    furrow.position.set(x + i, 0, z)
    scene.add(furrow)
  }
}

export function addRail(scene: THREE.Scene, z: number) {
  const railMat = material(0x353a39, 0.55)
  const bed = box(43, 0.06, 1.1, texturedMaterial('#4b4942', '#676155', 1440, 5, 2))
  bed.position.set(0, -0.03, z)
  scene.add(bed)
  for (const offset of [-0.28, 0.28]) {
    const rail = box(43, 0.07, 0.055, railMat)
    rail.position.set(0, 0.06, z + offset)
    scene.add(rail)
  }
  const sleeperMat = material(0x51483e)
  for (let x = -21; x <= 21; x += 0.72) {
    const sleeper = box(0.09, 0.04, 0.9, sleeperMat)
    sleeper.position.set(x, 0.025, z)
    scene.add(sleeper)
  }
}


export function addConstructionSite(scene: THREE.Scene) {
  const group = new THREE.Group()
  const slab = box(5.5, 0.12, 4.3, texturedMaterial('#615b4d', '#77705e', 1701, 4, 3))
  slab.position.y = 0.02
  group.add(slab)

  const foundationMat = material(0x74766e)
  for (let i = 0; i < 4; i += 1) {
    const foundation = box(1.8, 0.45 + (i % 2) * 0.3, 0.65, foundationMat)
    foundation.position.set(-1.6 + (i % 2) * 3.2, 0.24 + (i % 2) * 0.15, -1 + Math.floor(i / 2) * 2)
    group.add(foundation)
  }

  const tower = box(0.12, 5.8, 0.12, material(0xd2a83d))
  tower.position.set(2.2, 2.9, 1.5)
  group.add(tower)
  const armPivot = new THREE.Group()
  armPivot.position.set(2.2, 5.55, 1.5)
  const arm = box(4.2, 0.1, 0.1, material(0xd2a83d))
  arm.position.x = -1.3
  armPivot.add(arm)
  group.add(armPivot)

  group.position.set(1.2, 0, 10.4)
  group.visible = false
  scene.add(group)
  return { group, armPivot }
}

export function addRoadworks(scene: THREE.Scene) {
  const group = new THREE.Group()
  const orange = material(0xb56c2f)
  for (let i = 0; i < 12; i += 1) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.3, 5), orange)
    cone.position.set(-5.5 + i, 0.17, 0.8)
    group.add(cone)
  }
  group.visible = false
  scene.add(group)
  return group
}
