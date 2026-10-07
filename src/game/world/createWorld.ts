import * as THREE from 'three'
import type { CountryState } from '../state/types'
import { createWorldLabel, type WorldLabel } from './labels'
import { createPedestrian, type PedestrianRig, updatePedestrian, vehicleMesh, type VehicleKind } from './models/actors'
import {
  addFactory, addGovernment, addHouse, addOffice, addPanelBlock, addShop, addWarehouse,
  type GrowthBuilding, type SmokeParticle,
} from './models/buildings'
import { addField, addGround, addPark, addTree } from './models/environment'
import {
  addBusStop, addConstructionSite, addCrosswalk, addRail, addRoad, addRoadworks, addSidewalk, addStreetLamp,
} from './models/infrastructure'
import { box, clamp01, material, seeded, texturedMaterial } from './visual'

type MovingVehicle = {
  mesh: THREE.Object3D
  curve: THREE.CatmullRomCurve3
  t: number
  speed: number
  kind: VehicleKind
}

type Walker = {
  rig: PedestrianRig
  curve: THREE.CatmullRomCurve3
  t: number
  speed: number
  elapsed: number
}

export type WorldHandle = {
  scene: THREE.Scene
  update: (dt: number, state: CountryState) => void
  dispose: () => void
}

export function createWorld(): WorldHandle {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x12171b)
  scene.fog = new THREE.FogExp2(0x12171b, 0.0089)

  const windows: THREE.MeshStandardMaterial[] = []
  const roadMaterials: THREE.MeshStandardMaterial[] = []
  const buildingMaterials: THREE.MeshStandardMaterial[] = []
  const treeMaterials: THREE.MeshStandardMaterial[] = []
  const smoke: SmokeParticle[] = []
  const cars: MovingVehicle[] = []
  const walkers: Walker[] = []
  const growthBuildings: GrowthBuilding[] = []
  const trash: THREE.Object3D[] = []
  const lampMaterials: THREE.MeshStandardMaterial[] = []
  const labels: WorldLabel[] = []

  const { waterMat } = addGround(scene)

  // Main road grid: broader and more legible so the country feels less cramped.
  addRoad(scene, 0, 0, 56, 2.2, roadMaterials)
  addRoad(scene, -10.2, 1.5, 2.05, 36, roadMaterials)
  addRoad(scene, 10.4, -1.0, 2.05, 38, roadMaterials)
  addRoad(scene, 0, 12.6, 31, 1.8, roadMaterials)
  addRoad(scene, 4.0, -12.0, 34, 1.9, roadMaterials)
  addRoad(scene, -19.5, -7.5, 1.6, 16, roadMaterials)
  addRoad(scene, 20.5, 6.8, 1.6, 14, roadMaterials)

  addSidewalk(scene, 0, 1.58, 54, 0.58)
  addSidewalk(scene, 0, -1.58, 54, 0.58)
  addSidewalk(scene, -11.8, 2.0, 0.55, 33)
  addSidewalk(scene, -8.6, 2.0, 0.55, 33)
  addCrosswalk(scene, -10.2, 0, Math.PI / 2)
  addCrosswalk(scene, 10.4, 0, Math.PI / 2)
  addCrosswalk(scene, 0, 12.55, 0)
  addBusStop(scene, -3.2, 1.98)
  addBusStop(scene, 15.8, -1.98, Math.PI)
  addRail(scene, -18.4)

  // Capital / residential fabric.
  const blocks = [
    [-19.2, -5.0, 8, 0], [-19.0, 5.0, 10, 0], [-10.2, -5.2, 12, 0], [-10.0, 5.0, 9, 0],
    [-1.0, -5.1, 11, 0], [-1.0, 5.0, 13, 0], [8.5, -5.0, 10, 0], [8.5, 5.0, 11, 0],
    [18.5, -5.1, 8, 0], [18.3, 5.2, 10, 0], [-4.8, 16.2, 7, Math.PI / 2], [5.2, 16.1, 8, Math.PI / 2],
    [14.8, 13.8, 7, Math.PI / 2], [-15.2, 13.8, 6, Math.PI / 2],
  ] as const
  blocks.forEach(([x, z, floors, rot], i) => addPanelBlock(scene, x, z, floors, 50 + i, windows, buildingMaterials, rot))

  addGovernment(scene, 0.4, 6.6, windows)
  addPark(scene, 21.5, 14.6, treeMaterials)
  addPark(scene, -23.5, 14.0, treeMaterials)
  addShop(scene, -5.0, -2.65, 1)
  addShop(scene, -1.1, -2.62, 2)
  addShop(scene, 12.9, 2.55, 3, Math.PI)
  addShop(scene, -13.6, 2.52, 4, Math.PI)
  addShop(scene, 4.0, -2.62, 5)

  // Industrial belt.
  addFactory(scene, 18.3, -14.2, smoke, buildingMaterials)
  const yard = box(15.5, 0.08, 6.2, texturedMaterial('#4c504c', '#666861', 777, 6, 3))
  yard.position.set(18.1, -0.02, -14.5)
  scene.add(yard)
  for (let i = 0; i < 5; i += 1) addWarehouse(scene, 12.0 + i * 2.8, -20.2, i)

  // Private / rural west.
  for (let i = 0; i < 28; i += 1) {
    const x = -27 + (i % 7) * 2.35
    const z = -15.8 + Math.floor(i / 7) * 2.15
    addHouse(scene, x, z, i, 0.82 + (i % 3) * 0.08)
  }
  addField(scene, -23.7, 16.6, 9.0, 5.4, 1)
  addField(scene, -24.4, 9.4, 8.0, 4.4, 2)
  addField(scene, 24.0, 15.2, 8.5, 4.5, 3)

  // Trees and green belts.
  for (let i = 0; i < 118; i += 1) {
    const rand = seeded(300 + i)
    const x = -30 + rand() * 60
    const z = -21 + rand() * 42
    const nearMainRoad = Math.abs(z) < 1.8 || Math.abs(x + 10.2) < 1.5 || Math.abs(x - 10.4) < 1.5
    const industrial = x > 12 && z < -10
    const ruralHouses = x < -14 && z < -6
    const park = (x > 17 && z > 10) || (x < -20 && z > 10)
    if (!nearMainRoad && !industrial && !ruralHouses && !park) addTree(scene, x, z, 0.62 + rand() * 0.45, treeMaterials, i)
  }

  // Neglect markers respond to state instead of being permanently baked into the map.
  const trashMat = material(0x49433b)
  for (let i = 0; i < 22; i += 1) {
    const item = box(0.16 + (i % 2) * 0.1, 0.08, 0.13, trashMat)
    item.position.set(-17 + ((i * 4.7) % 33), 0.08, -2.0 + ((i * 7.1) % 4))
    scene.add(item)
    trash.push(item)
  }

  for (let i = -24; i <= 24; i += 3) {
    addStreetLamp(scene, i, -1.62, lampMaterials, 0)
    addStreetLamp(scene, i, 1.62, lampMaterials, Math.PI)
  }
  for (let z = -14; z <= 14; z += 4) {
    addStreetLamp(scene, -8.54, z, lampMaterials, Math.PI / 2)
    addStreetLamp(scene, 8.74, z, lampMaterials, -Math.PI / 2)
  }

  // Future skyline grows from policy/economic state.
  addOffice(scene, 2.4, 11.2, 8, 39, growthBuildings)
  addOffice(scene, 6.4, 11.8, 11, 51, growthBuildings)
  addOffice(scene, -2.4, 11.5, 9, 60, growthBuildings)
  addOffice(scene, 12.5, 10.6, 8, 58, growthBuildings)

  labels.push(createWorldLabel(scene, 'СТОЛИЦА', 0.2, 6.0, 6.6))
  labels.push(createWorldLabel(scene, 'ПРОМЗОНА', 18.0, -14.6, 6.1))
  labels.push(createWorldLabel(scene, 'СЕВЕРНЫЕ РАЙОНЫ', -18.4, 8.2, 5.7))
  labels.push(createWorldLabel(scene, 'ЗАПАДНЫЕ ПОСЁЛКИ', -23.2, -10.8, 5.4))

  const construction = addConstructionSite(scene)
  const roadworks = addRoadworks(scene)

  const curveMain = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-27.0, 0.18, -0.55), new THREE.Vector3(-10.3, 0.18, -0.55),
    new THREE.Vector3(10.4, 0.18, -0.55), new THREE.Vector3(27.0, 0.18, -0.55),
    new THREE.Vector3(10.4, 0.18, 0.55), new THREE.Vector3(-10.3, 0.18, 0.55), new THREE.Vector3(-27.0, 0.18, 0.55),
  ], true)
  const curveLoop = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-10.5, 0.18, -15.2), new THREE.Vector3(-10.5, 0.18, 12.4),
    new THREE.Vector3(10.7, 0.18, 12.4), new THREE.Vector3(10.7, 0.18, -11.3), new THREE.Vector3(-10.5, 0.18, -11.3),
  ], true)

  const carColors = [0x788789, 0x5c514b, 0x874743, 0x486073, 0x81755c, 0x3f5049, 0x716675, 0x8a8b86]
  for (let i = 0; i < 42; i += 1) {
    const kind: VehicleKind = i % 11 === 0 ? 'bus' : i % 7 === 0 ? 'truck' : 'car'
    const mesh = vehicleMesh(kind === 'bus' ? 0x657d70 : kind === 'truck' ? 0x6c675f : carColors[i % carColors.length], kind)
    scene.add(mesh)
    cars.push({ mesh, curve: i % 2 ? curveMain : curveLoop, t: (i * 0.073) % 1, speed: 0.012 + (i % 5) * 0.0018, kind })
  }

  const walkingLoops = [
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-20, 0.1, 2.0), new THREE.Vector3(-12, 0.1, 2.0), new THREE.Vector3(-12, 0.1, 8.7),
      new THREE.Vector3(-20, 0.1, 8.7), new THREE.Vector3(-20, 0.1, 2.0),
    ], true),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-7.9, 0.1, -2.0), new THREE.Vector3(7.8, 0.1, -2.0), new THREE.Vector3(7.8, 0.1, -8.2),
      new THREE.Vector3(-7.9, 0.1, -8.2), new THREE.Vector3(-7.9, 0.1, -2.0),
    ], true),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(12.2, 0.1, 2.0), new THREE.Vector3(22.5, 0.1, 2.0), new THREE.Vector3(22.5, 0.1, 8.6),
      new THREE.Vector3(12.2, 0.1, 8.6), new THREE.Vector3(12.2, 0.1, 2.0),
    ], true),
  ]
  for (let i = 0; i < 48; i += 1) {
    const rig = createPedestrian(i)
    scene.add(rig.root)
    walkers.push({ rig, curve: walkingLoops[i % walkingLoops.length], t: (i * 0.127) % 1, speed: 0.008 + (i % 4) * 0.001, elapsed: i * 0.13 })
  }

  const protestGroup = new THREE.Group()
  const signMat = material(0x8e6b55)
  for (let i = 0; i < 18; i += 1) {
    const rig = createPedestrian(90 + i)
    rig.root.position.set(-2.4 + (i % 6) * 0.78, 0, 7.15 + Math.floor(i / 6) * 0.65)
    protestGroup.add(rig.root)
    if (i % 3 === 0) {
      const sign = box(0.34, 0.22, 0.035, signMat)
      sign.position.set(rig.root.position.x + 0.14, 0.76, rig.root.position.z)
      protestGroup.add(sign)
    }
  }
  protestGroup.visible = false
  scene.add(protestGroup)

  const train = new THREE.Group()
  const trainBody = material(0x596c72, 0.65, 0.07)
  for (let i = 0; i < 3; i += 1) {
    const carriage = new THREE.Group()
    const shell = box(1.52, 0.56, 0.62, i === 0 ? material(0x735f53) : trainBody)
    shell.position.y = 0.37
    carriage.add(shell)
    const glass = box(1.10, 0.20, 0.635, material(0x34494f, 0.28, 0.12))
    glass.position.y = 0.48
    carriage.add(glass)
    carriage.position.x = -i * 1.68
    train.add(carriage)
  }
  train.position.set(-27, 0.05, -18.4)
  scene.add(train)
  let trainT = 0
  let trainDirection = 1

  const hemisphere = new THREE.HemisphereLight(0xbfc8c8, 0x283129, 1.45)
  scene.add(hemisphere)
  const sun = new THREE.DirectionalLight(0xd9ddd6, 2.1)
  sun.position.set(-25, 38, -15)
  sun.castShadow = true
  sun.shadow.mapSize.set(1536, 1536)
  sun.shadow.camera.left = -46
  sun.shadow.camera.right = 46
  sun.shadow.camera.top = 46
  sun.shadow.camera.bottom = -46
  sun.shadow.bias = -0.00035
  sun.shadow.normalBias = 0.015
  scene.add(sun)

  const last = {
    hourBucket: -1,
    infraBucket: -1,
    prosperityBucket: -1,
    ecologyBucket: -1,
    projectSignature: '',
    politicsBucket: -1,
    protestVisible: false,
  }

  function updateAppearance(state: CountryState) {
    const hourBucket = Math.floor(state.hour * 2)
    const infraBucket = Math.floor(state.infrastructure / 3)
    const prosperityBucket = Math.floor(state.prosperity / 3)
    const ecologyBucket = Math.floor(state.ecology / 3)
    const projectSignature = state.projects.map((p) => `${p.kind}:${Math.floor(p.progress / 10)}`).join('|')
    const politicsBucket = Math.floor((state.approval + state.politics.stability) / 10)
    const protestVisible = state.approval < 36 || state.politics.stability < 34

    if (
      hourBucket === last.hourBucket && infraBucket === last.infraBucket && prosperityBucket === last.prosperityBucket &&
      ecologyBucket === last.ecologyBucket && projectSignature === last.projectSignature && politicsBucket === last.politicsBucket &&
      protestVisible === last.protestVisible
    ) return

    Object.assign(last, { hourBucket, infraBucket, prosperityBucket, ecologyBucket, projectSignature, politicsBucket, protestVisible })

    const night = state.hour < 6.2 || state.hour > 19.2
    const twilight = (state.hour >= 6.2 && state.hour < 8) || (state.hour > 17.5 && state.hour <= 19.2)
    const daylight = night ? 0.22 : twilight ? 0.56 : 1

    hemisphere.intensity = 0.34 + daylight * 1.12
    sun.intensity = 0.16 + daylight * 2.05
    sun.color.setHex(twilight ? 0xe0c09e : 0xd9ddd6)
    const sky = night ? 0x0f151c : twilight ? 0x5d6667 : 0x87918d
    scene.background = new THREE.Color(sky)
    ;(scene.fog as THREE.FogExp2).color.setHex(sky)
    ;(scene.fog as THREE.FogExp2).density = night ? 0.0105 : 0.0079
    waterMat.color.setHex(night ? 0x17272e : 0x2c4247)

    const lightChance = night ? 0.62 : twilight ? 0.22 : 0.035
    const glow = 0.5 + state.prosperity / 62
    windows.forEach((m, i) => {
      const active = ((i * 31 + hourBucket * 7 + state.day * 3) % 100) / 100 < lightChance
      m.emissive.set(active ? 0xffc66c : 0x090a0b)
      m.emissiveIntensity = active ? glow : 0.05
      const clean = clamp01((state.prosperity + state.infrastructure - 45) / 90)
      m.color.lerpColors(new THREE.Color(0x526168), new THREE.Color(0x789099), clean)
    })

    lampMaterials.forEach((m, i) => {
      const reliability = ((i * 13 + state.day) % 100) / 100 < state.infrastructure / 112
      m.emissive.set(night && reliability ? 0xffc36f : 0x17150f)
      m.emissiveIntensity = night && reliability ? 2.0 : 0.1
      m.color.set(night && reliability ? 0xc2ac7b : 0x5d5e59)
    })

    const roadClean = clamp01((state.infrastructure - 18) / 70)
    roadMaterials.forEach((m) => m.color.lerpColors(new THREE.Color(0x6f6e69), new THREE.Color(0xe0dfd6), roadClean * 0.13))
    const buildingClean = clamp01((state.prosperity + state.infrastructure - 45) / 100)
    buildingMaterials.forEach((m) => m.color.lerpColors(new THREE.Color(0x87857f), new THREE.Color(0xffffff), 0.23 + buildingClean * 0.55))
    treeMaterials.forEach((m) => m.color.lerpColors(new THREE.Color(0x48543f), new THREE.Color(0x567b4c), clamp01(state.ecology / 100)))

    const trashCount = Math.round(trash.length * clamp01(1.1 - state.infrastructure / 72 - state.prosperity / 180))
    trash.forEach((item, i) => { item.visible = i < trashCount })
    growthBuildings.forEach(({ root, threshold }) => {
      const factor = clamp01((state.prosperity - threshold) / 13)
      root.visible = factor > 0.02
      root.scale.y = Math.max(0.02, factor)
    })

    construction.group.visible = state.projects.some((p) => p.kind === 'districts' || p.kind === 'industry')
    roadworks.visible = state.projects.some((p) => p.kind === 'roads' || p.kind === 'transit')
    protestGroup.visible = protestVisible
    labels.forEach((label) => { label.sprite.material.opacity = night ? 0.88 : 0.72 })
  }

  function update(dt: number, state: CountryState) {
    updateAppearance(state)
    const running = state.speed === 0 ? 0 : 1
    const trafficMultiplier = (0.36 + state.employment / 120 + state.prosperity / 180) * running
    const visibleVehicles = Math.round(10 + state.prosperity * 0.2 + state.employment * 0.11)

    cars.forEach((car, i) => {
      car.t = (car.t + dt * car.speed * trafficMultiplier) % 1
      const p = car.curve.getPointAt(car.t)
      const next = car.curve.getPointAt((car.t + 0.003) % 1)
      car.mesh.position.copy(p)
      car.mesh.rotation.y = Math.atan2(next.x - p.x, next.z - p.z)
      const transitBonus = state.projects.some((project) => project.kind === 'transit') || state.infrastructure > 46
      car.mesh.visible = i < visibleVehicles && (car.kind !== 'bus' || transitBonus)
    })

    const walkerMultiplier = (0.22 + state.employment / 110 + state.prosperity / 210) * running
    const visibleWalkers = Math.round(9 + state.prosperity * 0.2 + state.employment * 0.12)
    walkers.forEach((walker, i) => {
      walker.t = (walker.t + dt * walker.speed * walkerMultiplier) % 1
      walker.elapsed += dt * Math.max(0.25, walkerMultiplier)
      const p = walker.curve.getPointAt(walker.t)
      const next = walker.curve.getPointAt((walker.t + 0.006) % 1)
      walker.rig.root.position.set(p.x, p.y, p.z)
      walker.rig.root.rotation.y = Math.atan2(next.x - p.x, next.z - p.z)
      walker.rig.root.visible = i < visibleWalkers
      updatePedestrian(walker.rig, walker.elapsed, running > 0 && i < visibleWalkers)
    })

    smoke.forEach((particle, i) => {
      const pollution = clamp01((100 - state.ecology) / 100)
      particle.phase += dt * (0.18 + pollution * 0.42) * running
      const rise = (particle.phase + i * 0.16) % 4.1
      particle.mesh.position.set(
        particle.originX + Math.sin(particle.phase * 0.72 + i) * 0.28,
        5.0 + rise,
        particle.originZ + Math.cos(particle.phase * 0.48 + i) * 0.11,
      )
      const mat = particle.mesh.material as THREE.MeshStandardMaterial
      mat.opacity = 0.08 + pollution * 0.44
      particle.mesh.scale.setScalar(0.82 + rise * 0.12)
    })

    if (running) {
      trainT += dt * 0.035 * trainDirection
      if (trainT >= 1) { trainT = 1; trainDirection = -1 }
      if (trainT <= 0) { trainT = 0; trainDirection = 1 }
    }
    train.position.x = THREE.MathUtils.lerp(-27, 27, trainT)
    train.rotation.y = trainDirection > 0 ? 0 : Math.PI
    train.visible = state.infrastructure > 22

    if (construction.group.visible && running) construction.armPivot.rotation.y += dt * 0.12
    if (protestGroup.visible && running) protestGroup.position.y = Math.sin(state.hour * 0.8) * 0.015
  }

  function dispose() {
    const textures = new Set<THREE.Texture>()
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
        materials.forEach((m) => {
          const standard = m as THREE.MeshStandardMaterial
          if (standard.map) textures.add(standard.map)
          m.dispose()
        })
      }
      if (obj instanceof THREE.Sprite) {
        const mat = obj.material as THREE.SpriteMaterial
        if (mat.map) textures.add(mat.map)
        mat.dispose()
      }
    })
    textures.forEach((texture) => texture.dispose())
  }

  return { scene, update, dispose }
}
