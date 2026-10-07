import * as THREE from 'three'
import { box, cylinder, emissiveMaterial, material } from '../visual'

export type VehicleKind = 'car' | 'bus' | 'truck'

const tireMaterial = material(0x17191a, 0.82, 0.04)
const wheelHubMaterial = material(0x62686a, 0.42, 0.18)
const darkGlass = material(0x26383f, 0.28, 0.12)
const bumperMaterial = material(0x292c2d, 0.6, 0.08)

function wheel() {
  const group = new THREE.Group()
  const tire = cylinder(0.105, 0.105, 0.095, 10, tireMaterial)
  tire.rotation.z = Math.PI / 2
  group.add(tire)
  const hub = cylinder(0.047, 0.047, 0.102, 8, wheelHubMaterial)
  hub.rotation.z = Math.PI / 2
  group.add(hub)
  return group
}

function addWheels(group: THREE.Group, width: number, length: number, wheelY: number, pairs = 2) {
  const zPositions = pairs === 3 ? [-length * 0.31, 0, length * 0.31] : [-length * 0.31, length * 0.31]
  for (const z of zPositions) {
    for (const x of [-width * 0.48, width * 0.48]) {
      const w = wheel()
      w.position.set(x, wheelY, z)
      group.add(w)
    }
  }
}

function addLights(group: THREE.Group, width: number, frontZ: number, rearZ: number, y: number) {
  const headlightMat = emissiveMaterial(0xf1e2bd, 0xffd993, 0.7)
  const tailMat = emissiveMaterial(0xa6463e, 0x8f1611, 0.55)
  for (const x of [-width * 0.31, width * 0.31]) {
    const head = box(0.11, 0.065, 0.028, headlightMat)
    head.position.set(x, y, frontZ)
    group.add(head)
    const tail = box(0.105, 0.06, 0.028, tailMat)
    tail.position.set(x, y, rearZ)
    group.add(tail)
  }
}

export function vehicleMesh(color: number, kind: VehicleKind) {
  const group = new THREE.Group()
  const bodyMat = material(color, 0.72, 0.08)

  if (kind === 'car') {
    const width = 0.58
    const length = 1.08
    const lower = box(width, 0.2, length, bodyMat)
    lower.position.y = 0.23
    group.add(lower)

    const hood = box(width * 0.94, 0.10, 0.31, bodyMat)
    hood.position.set(0, 0.36, 0.35)
    group.add(hood)

    const cabin = box(width * 0.80, 0.24, 0.48, darkGlass)
    cabin.position.set(0, 0.43, -0.03)
    group.add(cabin)

    const roof = box(width * 0.76, 0.055, 0.38, bodyMat)
    roof.position.set(0, 0.565, -0.06)
    group.add(roof)

    const frontBumper = box(width * 0.92, 0.055, 0.04, bumperMaterial)
    frontBumper.position.set(0, 0.19, length * 0.51)
    group.add(frontBumper)
    const rearBumper = frontBumper.clone()
    rearBumper.position.z = -length * 0.51
    group.add(rearBumper)

    addWheels(group, width, length, 0.15)
    addLights(group, width, length * 0.515, -length * 0.515, 0.29)
  } else if (kind === 'bus') {
    const width = 0.70
    const length = 1.78
    const body = box(width, 0.56, length, bodyMat)
    body.position.y = 0.38
    group.add(body)

    const windowBand = box(width * 1.015, 0.24, length * 0.76, darkGlass)
    windowBand.position.set(0, 0.55, -0.02)
    group.add(windowBand)

    const roof = box(width * 0.94, 0.07, length * 0.90, material(0x6d7472))
    roof.position.y = 0.69
    group.add(roof)

    const destination = emissiveMaterial(0x8d7d5e, 0xd59c45, 0.32)
    const display = box(width * 0.55, 0.08, 0.025, destination)
    display.position.set(0, 0.60, length * 0.505)
    group.add(display)

    addWheels(group, width, length, 0.15, 3)
    addLights(group, width, length * 0.51, -length * 0.51, 0.28)
  } else {
    const width = 0.67
    const length = 1.56
    const cab = box(width, 0.46, 0.58, bodyMat)
    cab.position.set(0, 0.38, 0.46)
    group.add(cab)

    const windshield = box(width * 0.78, 0.18, 0.025, darkGlass)
    windshield.position.set(0, 0.50, 0.758)
    group.add(windshield)

    const cargo = box(width * 1.04, 0.54, 0.82, material(0x72716b))
    cargo.position.set(0, 0.42, -0.37)
    group.add(cargo)

    const cargoTop = box(width * 0.98, 0.055, 0.77, material(0x595c59))
    cargoTop.position.set(0, 0.72, -0.37)
    group.add(cargoTop)

    addWheels(group, width, length, 0.15, 3)
    addLights(group, width, length * 0.50, -length * 0.50, 0.28)
  }

  group.scale.setScalar(1.03)
  return group
}

export type PedestrianRig = {
  root: THREE.Group
  leftArm: THREE.Group
  rightArm: THREE.Group
  leftLeg: THREE.Group
  rightLeg: THREE.Group
  phase: number
}

const clothing = [0x394b5f, 0x5f4741, 0x4d5947, 0x514b5f, 0x69513f, 0x3e5552, 0x6b6160]
const trousers = [0x252a2d, 0x30353a, 0x393833, 0x24313a]
const skin = [0xd0a080, 0xb98368, 0xe0b08f, 0x9f705b]
const hair = [0x2a211c, 0x4d392c, 0x201d1c, 0x6a513a]

function limb(width: number, height: number, depth: number, color: number) {
  const pivot = new THREE.Group()
  const mesh = box(width, height, depth, material(color))
  mesh.position.y = -height * 0.43
  pivot.add(mesh)
  return pivot
}

export function createPedestrian(seed: number): PedestrianRig {
  const root = new THREE.Group()
  const bodyColor = clothing[seed % clothing.length]
  const trouserColor = trousers[(seed * 3) % trousers.length]
  const skinColor = skin[(seed * 5) % skin.length]

  const torso = box(0.18, 0.28, 0.13, material(bodyColor))
  torso.position.y = 0.43
  root.add(torso)

  const coat = box(0.205, 0.09, 0.145, material(bodyColor))
  coat.position.y = 0.31
  root.add(coat)

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 6), material(skinColor))
  head.position.y = 0.67
  head.castShadow = true
  root.add(head)

  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.088, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.52), material(hair[(seed * 7) % hair.length]))
  hairCap.position.y = 0.692
  hairCap.rotation.x = Math.PI
  hairCap.castShadow = true
  root.add(hairCap)

  const leftArm = limb(0.055, 0.27, 0.06, bodyColor)
  leftArm.position.set(-0.125, 0.53, 0)
  root.add(leftArm)
  const rightArm = limb(0.055, 0.27, 0.06, bodyColor)
  rightArm.position.set(0.125, 0.53, 0)
  root.add(rightArm)

  const leftLeg = limb(0.065, 0.28, 0.075, trouserColor)
  leftLeg.position.set(-0.055, 0.29, 0)
  root.add(leftLeg)
  const rightLeg = limb(0.065, 0.28, 0.075, trouserColor)
  rightLeg.position.set(0.055, 0.29, 0)
  root.add(rightLeg)

  root.scale.setScalar(0.92)
  return { root, leftArm, rightArm, leftLeg, rightLeg, phase: seed * 0.71 }
}

export function updatePedestrian(rig: PedestrianRig, elapsed: number, moving: boolean) {
  const swing = moving ? Math.sin(elapsed * 7.4 + rig.phase) * 0.48 : 0
  rig.leftLeg.rotation.x = swing
  rig.rightLeg.rotation.x = -swing
  rig.leftArm.rotation.x = -swing * 0.72
  rig.rightArm.rotation.x = swing * 0.72
}

export function pedestrianMesh(seed: number) {
  return createPedestrian(seed).root
}
