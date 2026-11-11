import * as THREE from 'three'
import { MaterialLibrary } from '../world/Materials'
import { RoadNetwork, type Waypoint } from '../world/RoadNetwork'
import { PhysicsEngine } from '../core/Physics'
import { gameAudio } from '../core/Audio'

export interface TrafficCar {
  id: string
  group: THREE.Group
  position: THREE.Vector3
  velocity: THREE.Vector3
  rotationY: number
  targetSpeed: number
  currentSpeed: number
  currentWaypoint: Waypoint | null
  color: number
  honkCooldown: number
}

export class TrafficAISystem {
  public scene: THREE.Scene
  public materials: MaterialLibrary
  public roadNetwork: RoadNetwork
  public physics: PhysicsEngine
  public cars: TrafficCar[] = []

  private trafficGroup = new THREE.Group()
  private maxCars = 14

  constructor(
    scene: THREE.Scene,
    materials: MaterialLibrary,
    roadNetwork: RoadNetwork,
    physics: PhysicsEngine
  ) {
    this.scene = scene
    this.materials = materials
    this.roadNetwork = roadNetwork
    this.physics = physics
    this.scene.add(this.trafficGroup)

    this.spawnInitialTraffic()
  }

  private spawnInitialTraffic() {
    const waypoints = this.roadNetwork.carWaypoints
    if (waypoints.length === 0) return

    const colors = [
      0x2563eb, // Royal Blue
      0xdc2626, // Crimson
      0x4b5563, // Slate Grey
      0xf59e0b, // Amber
      0x10b981, // Emerald Green
      0xffffff, // Alpine White
      0x18181b, // Midnight Black
      0x8b5cf6, // Violet
    ]

    for (let i = 0; i < this.maxCars; i++) {
      const wp = waypoints[(i * 3) % waypoints.length]
      const color = colors[i % colors.length]

      const carGroup = this.buildCivilianCarMesh(color)
      carGroup.position.copy(wp.position)
      this.trafficGroup.add(carGroup)

      this.cars.push({
        id: `traffic_${i}`,
        group: carGroup,
        position: wp.position.clone(),
        velocity: new THREE.Vector3(),
        rotationY: 0,
        targetSpeed: 12 + Math.random() * 6, // 45-65 km/h
        currentSpeed: 10,
        currentWaypoint: wp,
        color,
        honkCooldown: Math.random() * 5,
      })
    }
  }

  private buildCivilianCarMesh(colorHex: number): THREE.Group {
    const car = new THREE.Group()
    const paintMat = this.materials.createCarPaint(colorHex, 0.7, 0.25)

    // Body chassis
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.65, 4.4), paintMat)
    body.position.y = 0.6
    body.castShadow = true
    car.add(body)

    // Cabin glass
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.52, 2.3), this.materials.carGlassMaterial)
    cabin.position.set(0, 1.12, -0.1)
    cabin.castShadow = true
    car.add(cabin)

    // 4 Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.25, 12)
    wheelGeo.rotateZ(Math.PI / 2)
    const offsets = [
      [-0.95, 0.36, 1.3],
      [0.95, 0.36, 1.3],
      [-0.95, 0.36, -1.3],
      [0.95, 0.36, -1.3],
    ]
    offsets.forEach(([x, y, z]) => {
      const wheel = new THREE.Mesh(wheelGeo, this.materials.carTireMaterial)
      wheel.position.set(x, y, z)
      car.add(wheel)
    })

    // Headlights & Taillights
    for (const hx of [-0.7, 0.7]) {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.05), this.materials.carHeadlightGlass)
      hl.position.set(hx, 0.6, 2.22)
      car.add(hl)

      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.05), this.materials.carTaillightGlass)
      tl.position.set(hx, 0.6, -2.22)
      car.add(tl)
    }

    return car
  }

  public update(deltaTime: number, playerPos: THREE.Vector3) {
    for (const car of this.cars) {
      if (!car.currentWaypoint) continue

      // 1. Waypoint Navigation
      const targetPos = car.currentWaypoint.position
      const distToWp = car.position.distanceTo(targetPos)

      if (distToWp < 5.0) {
        // Pick next waypoint
        const nextIds = car.currentWaypoint.nextWaypointIds
        if (nextIds.length > 0) {
          const nextId = nextIds[Math.floor(Math.random() * nextIds.length)]
          const nextWp = this.roadNetwork.carWaypoints.find((w) => w.id === nextId)
          if (nextWp) {
            car.currentWaypoint = nextWp
          }
        } else {
          // Find any nearby waypoint to continue
          const newWp = this.roadNetwork.getNearestCarWaypoint(car.position)
          car.currentWaypoint = newWp
        }
      }

      // 2. Steer towards waypoint target
      const toTarget = new THREE.Vector3().subVectors(targetPos, car.position).normalize()
      const desiredAngle = Math.atan2(toTarget.x, toTarget.z)

      const diff = THREE.MathUtils.euclideanModulo(desiredAngle - car.rotationY + Math.PI, Math.PI * 2) - Math.PI
      car.rotationY += diff * Math.min(1, deltaTime * 3.5)
      car.group.rotation.y = car.rotationY

      // 3. Traffic Lights Awareness
      let shouldStopForLight = false
      for (const int of this.roadNetwork.intersections) {
        const distToInt = car.position.distanceTo(int.center)
        if (distToInt < int.radius + 12 && distToInt > int.radius - 2) {
          // Check if light is red for this car's direction
          const isGoingNS = Math.abs(toTarget.z) > Math.abs(toTarget.x)
          if (isGoingNS && (int.trafficState === 'EW_GREEN' || int.trafficState === 'EW_YELLOW')) {
            shouldStopForLight = true
          } else if (!isGoingNS && (int.trafficState === 'NS_GREEN' || int.trafficState === 'NS_YELLOW')) {
            shouldStopForLight = true
          }
        }
      }

      // 4. Preceding Obstacle & Player Avoidance Raycast
      const forwardVec = new THREE.Vector3(Math.sin(car.rotationY), 0, Math.cos(car.rotationY))
      const distToPlayer = car.position.distanceTo(playerPos)
      const isPlayerAhead = distToPlayer < 10 && forwardVec.dot(new THREE.Vector3().subVectors(playerPos, car.position).normalize()) > 0.65

      // Stop behind other traffic cars
      let isTrafficAhead = false
      for (const other of this.cars) {
        if (other.id === car.id) continue
        const dist = car.position.distanceTo(other.position)
        if (dist < 8.0 && forwardVec.dot(new THREE.Vector3().subVectors(other.position, car.position).normalize()) > 0.7) {
          isTrafficAhead = true
          break
        }
      }

      // Desired speed
      let desiredSpeed = car.targetSpeed
      if (shouldStopForLight || isPlayerAhead || isTrafficAhead) {
        desiredSpeed = 0
        // Honk horn if player is blocking lane
        car.honkCooldown -= deltaTime
        if (isPlayerAhead && car.honkCooldown <= 0) {
          car.honkCooldown = 6.0
          if (distToPlayer < 25) {
            gameAudio.playHorn()
          }
        }
      }

      // Smooth acceleration / braking
      car.currentSpeed = THREE.MathUtils.lerp(car.currentSpeed, desiredSpeed, deltaTime * 2.5)

      // Move car
      car.velocity.copy(forwardVec).multiplyScalar(car.currentSpeed)
      car.position.addScaledVector(car.velocity, deltaTime)
      car.group.position.copy(car.position)
    }
  }
}
