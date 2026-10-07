import * as THREE from 'three'
import { box, material } from './visual'

export function vehicleMesh(color: number, kind: 'car' | 'bus' | 'truck') {
  const group = new THREE.Group()
  const isBus = kind === 'bus'
  const isTruck = kind === 'truck'
  const w = isBus ? 1.12 : isTruck ? 0.95 : 0.65
  const d = isBus ? 0.38 : isTruck ? 0.42 : 0.34
  const h = isBus ? 0.42 : isTruck ? 0.34 : 0.27
  const body = box(w, h, d, material(color))
  body.position.y = 0.17 + h / 2
  group.add(body)
  const roof = box(isBus ? 0.85 : 0.34, isBus ? 0.13 : 0.17, d * 0.88, material(0x455158))
  roof.position.set(isTruck ? -0.2 : 0, 0.17 + h + (isBus ? 0.055 : 0.075), 0)
  group.add(roof)
  return group
}

export function pedestrianMesh(seed: number) {
  const group = new THREE.Group()
  const colors = [0x6d4e48, 0x44576a, 0x686b55, 0x4f4d5b, 0x754f3f]
  const body = box(0.13, 0.32, 0.12, material(colors[seed % colors.length]))
  body.position.y = 0.19
  group.add(body)
  const head = box(0.12, 0.12, 0.12, material(0xb79778))
  head.position.y = 0.41
  group.add(head)
  group.scale.setScalar(0.9)
  return group
}
