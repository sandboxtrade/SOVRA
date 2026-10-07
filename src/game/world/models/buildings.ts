import * as THREE from 'three'
import { box, cylinder, emissiveMaterial, glassMaterial, material, texturedMaterial } from '../visual'

export type SmokeParticle = { mesh: THREE.Mesh; phase: number; originX: number; originZ: number }
export type GrowthBuilding = { root: THREE.Group; threshold: number }

function addFacadeWindows(
  group: THREE.Group,
  floors: number,
  columns: number,
  width: number,
  depth: number,
  floorHeight: number,
  windows: THREE.MeshStandardMaterial[],
  seed: number,
) {
  const mats = [0, 1, 2].map((i) => emissiveMaterial(0x53636a + i * 0x020202, 0x090a0b, 0.06))
  windows.push(...mats)
  const winW = Math.min(0.24, width / (columns * 1.75))
  const winH = Math.min(0.22, floorHeight * 0.39)
  const startX = -width * 0.36
  const stepX = columns > 1 ? (width * 0.72) / (columns - 1) : 0

  for (let f = 0; f < floors; f += 1) {
    for (let c = 0; c < columns; c += 1) {
      const mat = mats[(f * 2 + c + seed) % mats.length]
      for (const side of [-1, 1]) {
        const win = box(winW, winH, 0.028, mat)
        win.position.set(startX + c * stepX, 0.34 + f * floorHeight, side * (depth / 2 + 0.016))
        group.add(win)
      }
    }
  }
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
  const width = 3.85
  const depth = 2.20
  const floorH = 0.53
  const totalH = floors * floorH
  const facade = texturedMaterial(seed % 2 ? '#a7aaa4' : '#959994', '#747972', seed, 2, Math.max(2, floors / 2))
  buildingMaterials.push(facade)

  const plinth = box(width * 1.03, 0.22, depth * 1.04, material(0x6e716d))
  plinth.position.y = 0.11
  group.add(plinth)

  const body = box(width, totalH, depth, facade)
  body.position.y = totalH / 2 + 0.18
  group.add(body)

  // Vertical seams and side stripes make panel houses readable instead of plain boxes.
  const seamMat = material(0x7b7f79)
  for (let c = 1; c < 6; c += 1) {
    const seam = box(0.025, totalH * 0.96, 0.026, seamMat)
    seam.position.set(-width / 2 + (width / 6) * c, totalH / 2 + 0.18, depth / 2 + 0.03)
    group.add(seam)
  }

  addFacadeWindows(group, floors, 6, width, depth, floorH, windows, seed)

  // Balconies, entrances and utility details break the silhouette.
  const balconyMat = material(0x878b85)
  const railingMat = material(0x50585a, 0.6, 0.08)
  for (let f = 1; f < floors; f += 2) {
    const slab = box(0.72, 0.07, 0.28, balconyMat)
    slab.position.set(width * 0.24, 0.32 + f * floorH, depth / 2 + 0.16)
    group.add(slab)
    const rail = box(0.72, 0.17, 0.035, railingMat)
    rail.position.set(width * 0.24, 0.43 + f * floorH, depth / 2 + 0.30)
    group.add(rail)
  }

  const entryMat = material(0x33383a)
  for (const doorX of [-0.95, 0.95]) {
    const entry = box(0.43, 0.62, 0.065, entryMat)
    entry.position.set(doorX, 0.49, depth / 2 + 0.05)
    group.add(entry)
    const canopy = box(0.62, 0.07, 0.42, material(0x626965))
    canopy.position.set(doorX, 0.83, depth / 2 + 0.20)
    group.add(canopy)
  }

  const roof = box(width * 0.93, 0.16, depth * 0.90, material(0x606663))
  roof.position.y = totalH + 0.26
  group.add(roof)
  const service = box(0.92, 0.42, 0.75, material(0x707570))
  service.position.set(-0.7, totalH + 0.52, -0.20)
  group.add(service)
  const vent = cylinder(0.075, 0.09, 0.38, 7, material(0x565d5c, 0.55, 0.12))
  vent.position.set(0.92, totalH + 0.42, 0.35)
  group.add(vent)

  group.position.set(x, 0, z)
  group.rotation.y = rotation
  scene.add(group)
  return group
}

export function addOffice(scene: THREE.Scene, x: number, z: number, floors: number, threshold: number, growthBuildings: GrowthBuilding[]) {
  const root = new THREE.Group()
  const floorH = 0.56
  const height = floors * floorH
  const concrete = texturedMaterial('#626c70', '#8e9a9c', 200 + floors, 2, floors / 2)
  const glass = glassMaterial(0x48626d)

  const podium = box(3.05, 0.62, 2.85, concrete)
  podium.position.y = 0.31
  root.add(podium)

  const tower = box(2.28, height, 2.18, glass)
  tower.position.y = 0.62 + height / 2
  root.add(tower)

  for (let f = 1; f < floors; f += 1) {
    const belt = box(2.34, 0.055, 2.24, material(0x7c8586, 0.5, 0.12))
    belt.position.y = 0.62 + f * floorH
    root.add(belt)
  }
  for (const xLine of [-0.72, 0, 0.72]) {
    const mullion = box(0.035, height * 0.96, 2.235, material(0x424a4c, 0.5, 0.14))
    mullion.position.set(xLine, 0.62 + height / 2, 0)
    root.add(mullion)
  }

  const rooftop = box(0.92, 0.35, 0.82, material(0x555d5e))
  rooftop.position.set(0.4, 0.62 + height + 0.18, -0.25)
  root.add(rooftop)

  root.position.set(x, 0, z)
  root.scale.y = 0.02
  root.visible = false
  scene.add(root)
  growthBuildings.push({ root, threshold })
}

export function addGovernment(scene: THREE.Scene, x: number, z: number, windows: THREE.MeshStandardMaterial[]) {
  const group = new THREE.Group()
  const bodyMat = texturedMaterial('#91958f', '#b6b7ad', 401, 3, 2)
  const stone = material(0xa7a79e)

  const plaza = box(7.2, 0.055, 5.6, texturedMaterial('#777a75', '#93948e', 402, 5, 4))
  plaza.position.y = -0.035
  group.add(plaza)

  const main = box(5.7, 2.15, 3.45, bodyMat)
  main.position.y = 1.16
  group.add(main)
  const upper = box(3.6, 1.02, 2.58, bodyMat)
  upper.position.y = 2.74
  group.add(upper)

  const windowMats = [0, 1].map((i) => emissiveMaterial(0x526168 + i * 0x040404, 0x090a0b, 0.05))
  windows.push(...windowMats)
  for (let f = 0; f < 3; f += 1) {
    for (let c = 0; c < 7; c += 1) {
      const win = box(0.27, 0.27, 0.03, windowMats[(c + f) % 2])
      win.position.set(-2.25 + c * 0.75, 0.72 + f * 0.56, 1.745)
      group.add(win)
    }
  }

  const entrance = box(1.05, 0.95, 0.10, material(0x30373a))
  entrance.position.set(0, 0.56, 1.79)
  group.add(entrance)
  const canopy = box(1.5, 0.12, 0.58, stone)
  canopy.position.set(0, 1.06, 2.02)
  group.add(canopy)

  for (let i = 0; i < 4; i += 1) {
    const step = box(2.1 + i * 0.42, 0.08, 0.34, stone)
    step.position.set(0, 0.04 + i * 0.045, 2.02 + i * 0.26)
    group.add(step)
  }

  const roof = box(3.95, 0.18, 2.86, material(0x4d5554))
  roof.position.y = 3.34
  group.add(roof)
  const mast = cylinder(0.032, 0.04, 1.68, 7, material(0x656b6b, 0.48, 0.15))
  mast.position.set(0, 4.18, 0)
  group.add(mast)
  const flag = box(0.76, 0.34, 0.035, material(0x8b3f3f))
  flag.position.set(0.39, 4.58, 0)
  group.add(flag)

  group.position.set(x, 0, z)
  scene.add(group)
  return group
}

export function addHouse(scene: THREE.Scene, x: number, z: number, seed: number, scale = 1) {
  const group = new THREE.Group()
  const wallColor = seed % 3 === 0 ? ['#a69d8d', '#756c61'] : seed % 3 === 1 ? ['#969f93', '#6e766d'] : ['#a48f7e', '#765f55']
  const base = box(1.46 * scale, 0.86 * scale, 1.12 * scale, texturedMaterial(wallColor[0], wallColor[1], 500 + seed, 2, 2))
  base.position.y = 0.43 * scale
  group.add(base)

  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.05 * scale, 0.62 * scale, 4), material(seed % 2 ? 0x645149 : 0x57534b))
  roof.rotation.y = Math.PI / 4
  roof.position.y = 1.16 * scale
  roof.castShadow = true
  group.add(roof)

  const door = box(0.25 * scale, 0.48 * scale, 0.045, material(0x4b382c))
  door.position.set(-0.28 * scale, 0.25 * scale, 0.58 * scale)
  group.add(door)
  const glass = glassMaterial(0x52666c)
  for (const wx of [0.12, 0.42]) {
    const win = box(0.20 * scale, 0.23 * scale, 0.03, glass)
    win.position.set(wx * scale, 0.48 * scale, 0.58 * scale)
    group.add(win)
  }

  const chimney = box(0.15 * scale, 0.48 * scale, 0.16 * scale, material(0x6a5c50))
  chimney.position.set(0.30 * scale, 1.28 * scale, -0.16 * scale)
  group.add(chimney)

  group.position.set(x, 0, z)
  scene.add(group)
  return group
}

export function addShop(scene: THREE.Scene, x: number, z: number, seed: number, rotation = 0) {
  const group = new THREE.Group()
  const body = box(2.15, 0.88, 1.45, texturedMaterial('#747975', '#565b57', 2100 + seed, 2, 2))
  body.position.y = 0.44
  group.add(body)
  const frontGlass = box(1.36, 0.48, 0.035, glassMaterial(0x456069))
  frontGlass.position.set(0.18, 0.48, 0.745)
  group.add(frontGlass)
  const door = box(0.34, 0.58, 0.04, material(0x303638))
  door.position.set(-0.72, 0.31, 0.75)
  group.add(door)
  const sign = box(1.66, 0.19, 0.055, emissiveMaterial(seed % 2 ? 0x725b48 : 0x52675c, seed % 2 ? 0x5a321f : 0x294b3b, 0.18))
  sign.position.set(0.08, 0.87, 0.77)
  group.add(sign)
  const awning = box(1.52, 0.07, 0.36, material(0x565e5b))
  awning.position.set(0.12, 0.77, 0.90)
  group.add(awning)
  group.position.set(x, 0, z)
  group.rotation.y = rotation
  scene.add(group)
  return group
}

export function addWarehouse(scene: THREE.Scene, x: number, z: number, seed: number) {
  const group = new THREE.Group()
  const body = box(2.55, 1.24, 1.76, texturedMaterial('#6d716d', '#4d524f', 780 + seed, 2, 2))
  body.position.y = 0.62
  group.add(body)
  const door = box(1.0, 0.88, 0.045, material(0x4a4e4c))
  door.position.set(0, 0.46, 0.90)
  group.add(door)
  for (const y of [0.24, 0.44, 0.64]) {
    const seam = box(0.92, 0.025, 0.05, material(0x676b68))
    seam.position.set(0, y, 0.93)
    group.add(seam)
  }
  const roof = box(2.68, 0.10, 1.89, material(0x555a57))
  roof.position.y = 1.28
  group.add(roof)
  group.position.set(x, 0, z)
  scene.add(group)
}

export function addFactory(
  scene: THREE.Scene,
  x: number,
  z: number,
  smoke: SmokeParticle[],
  buildingMaterials: THREE.MeshStandardMaterial[],
) {
  const group = new THREE.Group()
  const facade = texturedMaterial('#747875', '#535854', 900, 4, 2)
  buildingMaterials.push(facade)
  const body = box(6.45, 1.92, 3.35, facade)
  body.position.y = 0.96
  group.add(body)

  // Raised roof bays and clerestory glazing are much more legible than one flat factory box.
  for (let i = 0; i < 4; i += 1) {
    const bay = box(1.42, 0.36, 2.92, material(i % 2 ? 0x606763 : 0x686e69))
    bay.position.set(-2.25 + i * 1.5, 2.05, 0)
    group.add(bay)
    const skylight = box(1.05, 0.08, 2.15, glassMaterial(0x4e646b))
    skylight.position.set(-2.25 + i * 1.5, 2.27, 0)
    group.add(skylight)
  }

  const loading = box(1.6, 0.92, 0.055, material(0x3c4140))
  loading.position.set(1.72, 0.48, 1.705)
  group.add(loading)
  const office = box(1.45, 1.25, 1.45, texturedMaterial('#858a84', '#666b65', 901, 2, 2))
  office.position.set(-3.35, 0.63, 0.55)
  group.add(office)

  for (let i = 0; i < 2; i += 1) {
    const chimney = cylinder(0.25, 0.34, 4.9, 10, material(0x6e6059))
    chimney.position.set(-1.55 + i * 2.25, 2.45, -0.72)
    group.add(chimney)

    for (let p = 0; p < 5; p += 1) {
      const puffMat = new THREE.MeshStandardMaterial({ color: 0x6d7474, transparent: true, opacity: 0.25, roughness: 1 })
      const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(0.31 + p * 0.07, 1), puffMat)
      puff.position.set(x + chimney.position.x, 5.0 + p * 0.52, z + chimney.position.z)
      scene.add(puff)
      smoke.push({ mesh: puff, phase: p * 0.51 + i, originX: x + chimney.position.x, originZ: z + chimney.position.z })
    }
  }

  group.position.set(x, 0, z)
  scene.add(group)
  return group
}
