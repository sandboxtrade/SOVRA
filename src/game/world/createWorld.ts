import * as THREE from 'three'
import type { CountryState } from '../state/types'
import { pedestrianMesh, vehicleMesh } from './actors'
import {
  addConstructionSite, addFactory, addField, addGovernment, addGround, addHouse, addOffice, addPanelBlock,
  addRail, addRoad, addRoadworks, addSidewalk, addTree,
} from './structures'
import type { GrowthBuilding, SmokeParticle } from './structures'
import { box, clamp01, material, seeded, texturedMaterial } from './visual'

type MovingVehicle = {
  mesh: THREE.Object3D
  curve: THREE.CatmullRomCurve3
  t: number
  speed: number
  kind: 'car' | 'bus' | 'truck'
}

type Walker = { mesh: THREE.Object3D; curve: THREE.CatmullRomCurve3; t: number; speed: number }

export type WorldHandle = {
  scene: THREE.Scene
  update: (dt: number, state: CountryState) => void
  dispose: () => void
}

export function createWorld(): WorldHandle {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x12171a)
  scene.fog = new THREE.FogExp2(0x12171a, 0.011)

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

  const { waterMat } = addGround(scene)

  // Road skeleton: intentionally sparse and readable from a phone screen.
  addRoad(scene, 0, 0, 43, 2.15, roadMaterials)
  addRoad(scene, -8.4, 1.5, 2.05, 30, roadMaterials)
  addRoad(scene, 8.6, -1.0, 2.05, 31, roadMaterials)
  addRoad(scene, 0, 10.0, 25, 1.75, roadMaterials)
  addRoad(scene, 2.5, -9.6, 29, 1.85, roadMaterials)
  addRoad(scene, -16.0, -6.0, 1.55, 12, roadMaterials)

  addSidewalk(scene, 0, 1.55, 42, 0.58)
  addSidewalk(scene, 0, -1.55, 42, 0.58)
  addSidewalk(scene, -10.0, 2.0, 0.55, 27)
  addSidewalk(scene, -6.8, 2.0, 0.55, 27)

  addRail(scene, -14.2)

  // Capital / old panel districts.
  const blocks = [
    [-14.2, -4.8, 8, 0], [-14.0, 4.8, 10, 0], [-5.2, -5.0, 12, 0], [-5.0, 5.0, 9, 0],
    [4.9, -5.0, 11, 0], [4.8, 5.0, 13, 0], [14.1, -5.0, 8, 0], [14.0, 5.0, 10, 0],
    [-5.1, 13.5, 7, Math.PI / 2], [4.8, 13.4, 8, Math.PI / 2],
  ] as const
  blocks.forEach(([x, z, floors, rot], i) => addPanelBlock(scene, x, z, floors, 50 + i, windows, buildingMaterials, rot))

  addGovernment(scene, 0.2, 5.1)

  // Industrial belt.
  addFactory(scene, 13.3, -11.2, smoke, buildingMaterials)
  const yard = box(12.5, 0.08, 5.7, texturedMaterial('#4c504c', '#666861', 777, 5, 3))
  yard.position.set(13.0, -0.02, -11.4)
  scene.add(yard)
  for (let i = 0; i < 4; i += 1) {
    const warehouse = box(2.3, 1.15, 1.6, texturedMaterial('#6d706c', '#4e524e', 780 + i, 2, 2))
    warehouse.position.set(8.9 + i * 2.7, 0.57, -16.0)
    scene.add(warehouse)
  }

  // Private / rural west.
  for (let i = 0; i < 18; i += 1) {
    const x = -21 + (i % 5) * 2.45
    const z = -11.8 + Math.floor(i / 5) * 2.05
    addHouse(scene, x, z, i, 0.82 + (i % 3) * 0.08)
  }
  addField(scene, -17.7, 13.4, 7.0, 5.1, 1)
  addField(scene, -18.2, 7.3, 6.0, 4.0, 2)
  addField(scene, 16.8, 12.8, 7.0, 4.2, 3)

  // Trees and green belts.
  for (let i = 0; i < 86; i += 1) {
    const rand = seeded(300 + i)
    const x = -23 + rand() * 46
    const z = -17 + rand() * 34
    const nearMainRoad = Math.abs(z) < 1.8 || Math.abs(x + 8.4) < 1.5 || Math.abs(x - 8.6) < 1.5
    const industrial = x > 7 && z < -7
    const ruralHouses = x < -9 && z < -4
    if (!nearMainRoad && !industrial && !ruralHouses) addTree(scene, x, z, 0.62 + rand() * 0.45, treeMaterials, i)
  }

  // Trash / neglect markers. Visibility changes with state.
  const trashMat = material(0x49433b)
  for (let i = 0; i < 22; i += 1) {
    const item = box(0.16 + (i % 2) * 0.1, 0.08, 0.13, trashMat)
    item.position.set(-17 + ((i * 4.7) % 33), 0.08, -2.0 + ((i * 7.1) % 4))
    scene.add(item)
    trash.push(item)
  }

  // Lamps use emissive pixels instead of many point lights.
  for (let i = -18; i <= 18; i += 3) {
    for (const z of [-1.55, 1.55]) {
      const pole = box(0.05, 1.45, 0.05, material(0x474d4b))
      pole.position.set(i, 0.73, z)
      scene.add(pole)
      const lampMat = new THREE.MeshStandardMaterial({ color: 0x68685f, emissive: 0x19170f, emissiveIntensity: 0.1 })
      lampMaterials.push(lampMat)
      const lamp = box(0.16, 0.1, 0.12, lampMat)
      lamp.position.set(i, 1.46, z)
      scene.add(lamp)
    }
  }

  // Future skyline grows from policy/economic state without extra assets.
  addOffice(scene, 1.8, 8.6, 8, 39, growthBuildings)
  addOffice(scene, 5.4, 9.0, 11, 51, growthBuildings)
  addOffice(scene, -2.2, 9.0, 9, 60, growthBuildings)

  const construction = addConstructionSite(scene)
  const roadworks = addRoadworks(scene)

  const curveMain = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-20.5, 0.18, -0.55),
    new THREE.Vector3(-8.5, 0.18, -0.55),
    new THREE.Vector3(8.6, 0.18, -0.55),
    new THREE.Vector3(20.5, 0.18, -0.55),
    new THREE.Vector3(8.6, 0.18, 0.55),
    new THREE.Vector3(-8.5, 0.18, 0.55),
    new THREE.Vector3(-20.5, 0.18, 0.55),
  ], true)

  const curveLoop = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-8.8, 0.18, -12.3),
    new THREE.Vector3(-8.8, 0.18, 9.6),
    new THREE.Vector3(8.9, 0.18, 9.6),
    new THREE.Vector3(8.9, 0.18, -9.1),
    new THREE.Vector3(-8.8, 0.18, -9.1),
  ], true)

  const carColors = [0x7e898a, 0x5a5049, 0x874343, 0x4d5f6b, 0x79715c, 0x3e4944]
  for (let i = 0; i < 30; i += 1) {
    const kind: MovingVehicle['kind'] = i % 11 === 0 ? 'bus' : i % 7 === 0 ? 'truck' : 'car'
    const mesh = vehicleMesh(kind === 'bus' ? 0x647b6a : kind === 'truck' ? 0x6b665d : carColors[i % carColors.length], kind)
    scene.add(mesh)
    cars.push({ mesh, curve: i % 2 ? curveMain : curveLoop, t: (i * 0.073) % 1, speed: 0.012 + (i % 5) * 0.0018, kind })
  }

  const walkingLoops = [
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-15, 0.1, 2.0), new THREE.Vector3(-10, 0.1, 2.0), new THREE.Vector3(-10, 0.1, 6.7),
      new THREE.Vector3(-15, 0.1, 6.7), new THREE.Vector3(-15, 0.1, 2.0),
    ], true),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-5.9, 0.1, -2.0), new THREE.Vector3(5.8, 0.1, -2.0), new THREE.Vector3(5.8, 0.1, -7.0),
      new THREE.Vector3(-5.9, 0.1, -7.0), new THREE.Vector3(-5.9, 0.1, -2.0),
    ], true),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(10.2, 0.1, 2.0), new THREE.Vector3(17.5, 0.1, 2.0), new THREE.Vector3(17.5, 0.1, 7.6),
      new THREE.Vector3(10.2, 0.1, 7.6), new THREE.Vector3(10.2, 0.1, 2.0),
    ], true),
  ]
  for (let i = 0; i < 36; i += 1) {
    const mesh = pedestrianMesh(i)
    scene.add(mesh)
    walkers.push({ mesh, curve: walkingLoops[i % walkingLoops.length], t: (i * 0.127) % 1, speed: 0.008 + (i % 4) * 0.001 })
  }

  // Small protest crowd near the government building. It becomes visible only when politics deteriorates.
  const protestGroup = new THREE.Group()
  const signMat = material(0x8e6b55)
  for (let i = 0; i < 18; i += 1) {
    const person = pedestrianMesh(90 + i)
    person.position.set(-2.4 + (i % 6) * 0.78, 0, 7.15 + Math.floor(i / 6) * 0.65)
    protestGroup.add(person)
    if (i % 3 === 0) {
      const sign = box(0.34, 0.22, 0.035, signMat)
      sign.position.set(person.position.x + 0.14, 0.72, person.position.z)
      protestGroup.add(sign)
    }
  }
  protestGroup.visible = false
  scene.add(protestGroup)

  // Train on the southern rail.
  const train = new THREE.Group()
  for (let i = 0; i < 3; i += 1) {
    const carriage = box(1.45, 0.52, 0.58, material(i === 0 ? 0x6b5d52 : 0x59676b))
    carriage.position.set(-i * 1.6, 0.36, 0)
    train.add(carriage)
  }
  train.position.set(-21, 0.05, -14.2)
  scene.add(train)
  let trainT = 0
  let trainDirection = 1

  const hemisphere = new THREE.HemisphereLight(0xbcc4c4, 0x27302a, 1.45)
  scene.add(hemisphere)

  const sun = new THREE.DirectionalLight(0xcbd0ca, 2.0)
  sun.position.set(-20, 34, -12)
  sun.castShadow = true
  sun.shadow.mapSize.set(1024, 1024)
  sun.shadow.camera.left = -34
  sun.shadow.camera.right = 34
  sun.shadow.camera.top = 34
  sun.shadow.camera.bottom = -34
  sun.shadow.bias = -0.0004
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
      hourBucket === last.hourBucket &&
      infraBucket === last.infraBucket &&
      prosperityBucket === last.prosperityBucket &&
      ecologyBucket === last.ecologyBucket &&
      projectSignature === last.projectSignature &&
      politicsBucket === last.politicsBucket &&
      protestVisible === last.protestVisible
    ) return

    last.hourBucket = hourBucket
    last.infraBucket = infraBucket
    last.prosperityBucket = prosperityBucket
    last.ecologyBucket = ecologyBucket
    last.projectSignature = projectSignature
    last.politicsBucket = politicsBucket
    last.protestVisible = protestVisible

    const night = state.hour < 6.2 || state.hour > 19.2
    const twilight = (state.hour >= 6.2 && state.hour < 8) || (state.hour > 17.5 && state.hour <= 19.2)
    const daylight = night ? 0.22 : twilight ? 0.56 : 1

    hemisphere.intensity = 0.36 + daylight * 1.1
    sun.intensity = 0.18 + daylight * 1.9
    const sky = night ? 0x10151b : twilight ? 0x545b5c : 0x7a8380
    scene.background = new THREE.Color(sky)
    ;(scene.fog as THREE.FogExp2).color.setHex(sky)
    waterMat.color.setHex(night ? 0x19272d : 0x2a3b3e)

    const lightChance = night ? 0.72 : twilight ? 0.24 : 0.045
    const glow = 0.45 + state.prosperity / 65
    windows.forEach((m, i) => {
      const active = ((i * 31 + hourBucket * 7) % 100) / 100 < lightChance
      m.emissive.set(active ? 0xffc66c : 0x090a0b)
      m.emissiveIntensity = active ? glow : 0.06
      const clean = clamp01((state.prosperity + state.infrastructure - 45) / 90)
      m.color.lerpColors(new THREE.Color(0x536064), new THREE.Color(0x789099), clean)
    })

    lampMaterials.forEach((m, i) => {
      const reliability = ((i * 13 + state.day) % 100) / 100 < state.infrastructure / 115
      m.emissive.set(night && reliability ? 0xffbf63 : 0x17150f)
      m.emissiveIntensity = night && reliability ? 1.8 : 0.1
      m.color.set(night && reliability ? 0xb9a272 : 0x5d5e59)
    })

    const roadClean = clamp01((state.infrastructure - 18) / 70)
    roadMaterials.forEach((m) => m.color.lerpColors(new THREE.Color(0x73706a), new THREE.Color(0xd8d8d0), roadClean * 0.12))

    const buildingClean = clamp01((state.prosperity + state.infrastructure - 45) / 100)
    buildingMaterials.forEach((m) => m.color.lerpColors(new THREE.Color(0x88867f), new THREE.Color(0xffffff), 0.24 + buildingClean * 0.55))

    treeMaterials.forEach((m) => {
      const health = clamp01(state.ecology / 100)
      m.color.lerpColors(new THREE.Color(0x4b5540), new THREE.Color(0x54774b), health)
    })

    const trashCount = Math.round(trash.length * clamp01(1.1 - state.infrastructure / 72 - state.prosperity / 180))
    trash.forEach((item, i) => { item.visible = i < trashCount })

    growthBuildings.forEach(({ root, threshold }) => {
      const factor = clamp01((state.prosperity - threshold) / 13)
      root.visible = factor > 0.02
      root.scale.y = Math.max(0.02, factor)
    })

    const hasConstruction = state.projects.some((p) => p.kind === 'districts' || p.kind === 'industry')
    construction.group.visible = hasConstruction
    roadworks.visible = state.projects.some((p) => p.kind === 'roads' || p.kind === 'transit')
    protestGroup.visible = protestVisible
  }

  function update(dt: number, state: CountryState) {
    updateAppearance(state)
    const running = state.speed === 0 ? 0 : 1
    const trafficMultiplier = (0.36 + state.employment / 120 + state.prosperity / 180) * running
    const visibleVehicles = Math.round(7 + state.prosperity * 0.18 + state.employment * 0.10)

    cars.forEach((car, i) => {
      car.t = (car.t + dt * car.speed * trafficMultiplier) % 1
      const p = car.curve.getPointAt(car.t)
      const next = car.curve.getPointAt((car.t + 0.003) % 1)
      car.mesh.position.copy(p)
      car.mesh.rotation.y = Math.atan2(next.x - p.x, next.z - p.z)
      const transitBonus = state.projects.some((p) => p.kind === 'transit') || state.infrastructure > 46
      car.mesh.visible = i < visibleVehicles && (car.kind !== 'bus' || transitBonus)
    })

    const walkerMultiplier = (0.22 + state.employment / 110 + state.prosperity / 210) * running
    const visibleWalkers = Math.round(6 + state.prosperity * 0.18 + state.employment * 0.11)
    walkers.forEach((walker, i) => {
      walker.t = (walker.t + dt * walker.speed * walkerMultiplier) % 1
      const p = walker.curve.getPointAt(walker.t)
      const next = walker.curve.getPointAt((walker.t + 0.006) % 1)
      walker.mesh.position.copy(p)
      walker.mesh.rotation.y = Math.atan2(next.x - p.x, next.z - p.z)
      walker.mesh.visible = i < visibleWalkers
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
      trainT += dt * 0.035 * running * trainDirection
      if (trainT >= 1) { trainT = 1; trainDirection = -1 }
      if (trainT <= 0) { trainT = 0; trainDirection = 1 }
    }
    train.position.x = THREE.MathUtils.lerp(-20.5, 20.5, trainT)
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
    })
    textures.forEach((t) => t.dispose())
  }

  return { scene, update, dispose }
}
