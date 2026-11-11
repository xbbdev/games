import * as THREE from 'three'
import { RoadNetwork, type Waypoint } from '../world/RoadNetwork'
import { useGameStore } from '../state/gameStore'

export interface Pedestrian {
  id: string
  group: THREE.Group
  torso: THREE.Mesh
  leftLeg: THREE.Group
  rightLeg: THREE.Group
  leftArm: THREE.Group
  rightArm: THREE.Group
  position: THREE.Vector3
  rotationY: number
  targetWaypoint: Waypoint | null
  walkSpeed: number
  animTime: number
  isPanicked: boolean
  panicTimer: number
}

export class PedestrianAISystem {
  public scene: THREE.Scene
  public roadNetwork: RoadNetwork
  public pedestrians: Pedestrian[] = []

  private pedGroup = new THREE.Group()
  private maxPedestrians = 20

  constructor(scene: THREE.Scene, roadNetwork: RoadNetwork) {
    this.scene = scene
    this.roadNetwork = roadNetwork
    this.scene.add(this.pedGroup)

    this.spawnInitialPedestrians()
  }

  private spawnInitialPedestrians() {
    const waypoints = this.roadNetwork.pedestrianWaypoints
    if (waypoints.length === 0) return

    const shirtColors = [0x3b82f6, 0xef4444, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xec4899, 0xf3f4f6, 0x1f2937]
    const pantsColors = [0x1e3a5f, 0x374151, 0x4b5563, 0x18181b]

    for (let i = 0; i < this.maxPedestrians; i++) {
      const wp = waypoints[(i * 4) % waypoints.length]
      const shirt = shirtColors[i % shirtColors.length]
      const pants = pantsColors[i % pantsColors.length]

      const ped = this.buildPedestrianMesh(shirt, pants)
      ped.group.position.copy(wp.position)
      this.pedGroup.add(ped.group)

      this.pedestrians.push({
        ...ped,
        id: `ped_${i}`,
        position: wp.position.clone(),
        rotationY: Math.random() * Math.PI * 2,
        targetWaypoint: wp,
        walkSpeed: 1.8 + Math.random() * 0.8,
        animTime: Math.random() * 10,
        isPanicked: false,
        panicTimer: 0,
      })
    }
  }

  private buildPedestrianMesh(shirtColor: number, pantsColor: number) {
    const group = new THREE.Group()

    const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.6 })
    const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.7 })
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.8 })

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.65, 0.28), shirtMat)
    torso.position.y = 1.15
    torso.castShadow = true
    group.add(torso)

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.3, 0.26), skinMat)
    head.position.set(0, 0.48, 0)
    torso.add(head)

    // Left Arm
    const leftArm = new THREE.Group()
    leftArm.position.set(-0.3, 0.25, 0)
    const lArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.6, 0.16), shirtMat)
    lArmMesh.position.y = -0.3
    leftArm.add(lArmMesh)
    torso.add(leftArm)

    // Right Arm
    const rightArm = new THREE.Group()
    rightArm.position.set(0.3, 0.25, 0)
    const rArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.6, 0.16), shirtMat)
    rArmMesh.position.y = -0.3
    rightArm.add(rArmMesh)
    torso.add(rightArm)

    // Left Leg
    const leftLeg = new THREE.Group()
    leftLeg.position.set(-0.14, 0.75, 0)
    const lLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.7, 0.2), pantsMat)
    lLegMesh.position.y = -0.35
    leftLeg.add(lLegMesh)
    group.add(leftLeg)

    // Right Leg
    const rightLeg = new THREE.Group()
    rightLeg.position.set(0.14, 0.75, 0)
    const rLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.7, 0.2), pantsMat)
    rLegMesh.position.y = -0.35
    rightLeg.add(rLegMesh)
    group.add(rightLeg)

    return { group, torso, leftLeg, rightLeg, leftArm, rightArm }
  }

  public update(deltaTime: number, playerPos: THREE.Vector3, playerVelocity: THREE.Vector3) {
    for (const ped of this.pedestrians) {
      // 1. Check for incoming speeding vehicle / player threat
      const distToPlayer = ped.position.distanceTo(playerPos)
      const playerSpeed = playerVelocity.length()

      if (distToPlayer < 7.0 && playerSpeed > 8.0) {
        // Vehicle rushing towards pedestrian - PANIC & DIVE!
        ped.isPanicked = true
        ped.panicTimer = 4.0

        // If player hits pedestrian
        if (distToPlayer < 2.0 && playerSpeed > 10.0) {
          // Wanted level +1!
          const curWanted = useGameStore.getState().wantedLevel
          useGameStore.getState().setWantedLevel(Math.max(1, curWanted + 1))
        }
      }

      if (ped.isPanicked) {
        ped.panicTimer -= deltaTime
        if (ped.panicTimer <= 0) {
          ped.isPanicked = false
        }
      }

      // 2. Waypoint Following
      if (ped.targetWaypoint) {
        const distToWp = ped.position.distanceTo(ped.targetWaypoint.position)
        if (distToWp < 2.0) {
          const nexts = ped.targetWaypoint.nextWaypointIds
          if (nexts.length > 0) {
            const nextId = nexts[Math.floor(Math.random() * nexts.length)]
            const nextWp = this.roadNetwork.pedestrianWaypoints.find((w) => w.id === nextId)
            if (nextWp) ped.targetWaypoint = nextWp
          } else {
            ped.targetWaypoint = this.roadNetwork.getNearestPedestrianWaypoint(ped.position)
          }
        }

        if (!ped.targetWaypoint) continue
        const toTarget = new THREE.Vector3().subVectors(ped.targetWaypoint.position, ped.position).normalize()
        let desiredAngle = Math.atan2(toTarget.x, toTarget.z)

        // Flee away from vehicle if panicked
        if (ped.isPanicked) {
          const awayFromPlayer = new THREE.Vector3().subVectors(ped.position, playerPos).normalize()
          desiredAngle = Math.atan2(awayFromPlayer.x, awayFromPlayer.z)
        }

        const diff = THREE.MathUtils.euclideanModulo(desiredAngle - ped.rotationY + Math.PI, Math.PI * 2) - Math.PI
        ped.rotationY += diff * Math.min(1, deltaTime * 5.0)
        ped.group.rotation.y = ped.rotationY

        // Walk speed
        const speed = ped.isPanicked ? 5.5 : ped.walkSpeed
        const moveVec = new THREE.Vector3(Math.sin(ped.rotationY), 0, Math.cos(ped.rotationY)).multiplyScalar(speed)
        ped.position.addScaledVector(moveVec, deltaTime)
        ped.group.position.copy(ped.position)

        // 3. Walk / Run Animation
        ped.animTime += deltaTime * (ped.isPanicked ? 12 : 6)
        const sinAnim = Math.sin(ped.animTime)

        ped.leftLeg.rotation.x = sinAnim * 0.7
        ped.rightLeg.rotation.x = -sinAnim * 0.7
        ped.leftArm.rotation.x = -sinAnim * 0.6
        ped.rightArm.rotation.x = sinAnim * 0.6
      }
    }
  }
}
