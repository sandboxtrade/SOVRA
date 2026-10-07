import * as THREE from 'three'
import { box, cylinder, emissiveMaterial, material, texturedMaterial } from '../visual'

export function addRoad(
  scene: THREE.Scene,
  x: number,
  z: number,
  w: number,
  d: number,
  roadMaterials: THREE.MeshStandardMaterial[],
) {
  const roadMat = texturedMaterial('#25292b', '#3b3d3d', Math.floor((x + 30) * 7 + (z + 30) * 3), 4, 2)
  roadMaterials.push(roadMat)
  const road = box(w, 0.075, d, roadMat)
  road.position.set(x, -0.02, z)
  scene.add(road)

  const horizontal = w > d
  const length = horizontal ? w : d
  const laneMat = material(0xc3bca2, 0.86)
  for (let p = -length / 2 + 1.15; p < length / 2 - 0.6; p += 2.8) {
    const mark = box(horizontal ? 0.92 : 0.065, 0.018, horizontal ? 0.065 : 0.92, laneMat)
    mark.position.set(horizontal ? x + p : x, 0.033, horizontal ? z : z + p)
    scene.add(mark)
  }

  // Dark gutters visually separate the road from sidewalks and buildings.
  const gutterMat = material(0x1d2223, 0.96)
  for (const side of [-1, 1]) {
    const gutter = box(horizontal ? w : 0.055, 0.02, horizontal ? 0.055 : d, gutterMat)
    gutter.position.set(horizontal ? x : x + side * (w / 2 - 0.03), 0.015, horizontal ? z + side * (d / 2 - 0.03) : z)
    scene.add(gutter)
  }
}

export function addSidewalk(scene: THREE.Scene, x: number, z: number, w: number, d: number) {
  const slab = box(w, 0.11, d, texturedMaterial('#70746e', '#8c8f87', Math.floor(x * 11 + z * 17 + 100), 3, 3))
  slab.position.set(x, 0.018, z)
  scene.add(slab)

  const curbMat = material(0x8e9088)
  const horizontal = w > d
  for (const side of [-1, 1]) {
    const curb = box(horizontal ? w : 0.075, 0.12, horizontal ? 0.075 : d, curbMat)
    curb.position.set(horizontal ? x : x + side * w / 2, 0.035, horizontal ? z + side * d / 2 : z)
    scene.add(curb)
  }
}

export function addCrosswalk(scene: THREE.Scene, x: number, z: number, rotation = 0) {
  const group = new THREE.Group()
  const white = material(0xc9c8bd, 0.9)
  for (let i = -3; i <= 3; i += 1) {
    const stripe = box(0.16, 0.025, 0.82, white)
    stripe.position.set(i * 0.28, 0.05, 0)
    group.add(stripe)
  }
  group.position.set(x, 0, z)
  group.rotation.y = rotation
  scene.add(group)
}

export function addStreetLamp(
  scene: THREE.Scene,
  x: number,
  z: number,
  lampMaterials: THREE.MeshStandardMaterial[],
  rotation = 0,
) {
  const group = new THREE.Group()
  const poleMat = material(0x41494a, 0.62, 0.08)
  const pole = cylinder(0.032, 0.045, 1.55, 7, poleMat)
  pole.position.y = 0.775
  group.add(pole)

  const arm = box(0.38, 0.035, 0.035, poleMat)
  arm.position.set(0.17, 1.49, 0)
  group.add(arm)

  const lampMat = emissiveMaterial(0x66675f, 0x19170f, 0.1)
  lampMaterials.push(lampMat)
  const lamp = box(0.22, 0.09, 0.13, lampMat)
  lamp.position.set(0.34, 1.45, 0)
  group.add(lamp)

  group.position.set(x, 0, z)
  group.rotation.y = rotation
  scene.add(group)
}

export function addBusStop(scene: THREE.Scene, x: number, z: number, rotation = 0) {
  const group = new THREE.Group()
  const frameMat = material(0x454c4d, 0.55, 0.11)
  const glass = new THREE.MeshStandardMaterial({ color: 0x58717a, roughness: 0.2, metalness: 0.12, transparent: true, opacity: 0.56 })
  const roof = box(1.25, 0.06, 0.52, frameMat)
  roof.position.y = 1.15
  group.add(roof)
  for (const px of [-0.56, 0.56]) {
    const post = box(0.055, 1.12, 0.055, frameMat)
    post.position.set(px, 0.56, -0.20)
    group.add(post)
  }
  const back = box(1.12, 0.82, 0.025, glass)
  back.position.set(0, 0.68, -0.23)
  group.add(back)
  const bench = box(0.72, 0.08, 0.22, material(0x6d563f))
  bench.position.set(0, 0.31, -0.03)
  group.add(bench)
  group.position.set(x, 0, z)
  group.rotation.y = rotation
  scene.add(group)
}

export function addRail(scene: THREE.Scene, z: number) {
  const railMat = material(0x343a3b, 0.42, 0.2)
  const bed = box(56, 0.065, 1.15, texturedMaterial('#4b4942', '#696357', 1440, 6, 2))
  bed.position.set(0, -0.03, z)
  scene.add(bed)
  for (const offset of [-0.28, 0.28]) {
    const rail = box(56, 0.075, 0.055, railMat)
    rail.position.set(0, 0.06, z + offset)
    scene.add(rail)
  }
  const sleeperMat = material(0x51483e)
  for (let x = -27; x <= 27; x += 0.72) {
    const sleeper = box(0.09, 0.04, 0.91, sleeperMat)
    sleeper.position.set(x, 0.024, z)
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

  const fenceMat = material(0x8c7351)
  for (let x = -2.6; x <= 2.6; x += 0.55) {
    const fence = box(0.42, 0.45, 0.035, fenceMat)
    fence.position.set(x, 0.23, -2.18)
    group.add(fence)
  }

  const craneMat = material(0xd2a83d, 0.72, 0.04)
  const tower = box(0.12, 5.8, 0.12, craneMat)
  tower.position.set(2.2, 2.9, 1.5)
  group.add(tower)
  const armPivot = new THREE.Group()
  armPivot.position.set(2.2, 5.55, 1.5)
  const arm = box(4.2, 0.10, 0.10, craneMat)
  arm.position.x = -1.3
  armPivot.add(arm)
  const counter = box(0.55, 0.25, 0.28, material(0x4e5050))
  counter.position.set(0.55, -0.15, 0)
  armPivot.add(counter)
  group.add(armPivot)

  group.position.set(1.2, 0, 10.4)
  group.visible = false
  scene.add(group)
  return { group, armPivot }
}

export function addRoadworks(scene: THREE.Scene) {
  const group = new THREE.Group()
  const orange = material(0xc17a30)
  for (let i = 0; i < 12; i += 1) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.30, 7), orange)
    cone.position.set(-5.5 + i, 0.17, 0.8)
    group.add(cone)
  }
  const barrier = box(3.1, 0.12, 0.12, material(0xddd4b7))
  barrier.position.set(0, 0.42, 0.95)
  group.add(barrier)
  for (const x of [-1.2, 0, 1.2]) {
    const stripe = box(0.38, 0.13, 0.125, material(0xb66b33))
    stripe.position.set(x, 0.42, 0.95)
    group.add(stripe)
  }
  group.visible = false
  scene.add(group)
  return group
}
