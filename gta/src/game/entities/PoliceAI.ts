import * as THREE from 'three'
import { Vehicle } from './Vehicle'
import { VehicleManager } from './VehicleManager'
import { gameAudio } from '../core/Audio'
import { useGameStore } from '../state/gameStore'

export class PolicePursuitSystem {
  public scene: THREE.Scene
  public vehicleManager: VehicleManager
  public policeCars: Vehicle[] = []

  private evasionTimer = 0
  private isPursuing = false

  constructor(scene: THREE.Scene, vehicleManager: VehicleManager) {
    this.scene = scene
    this.vehicleManager = vehicleManager
  }

  public update(deltaTime: number, playerPos: THREE.Vector3) {
    const wantedLevel = useGameStore.getState().wantedLevel

    if (wantedLevel > 0) {
      if (!this.isPursuing) {
        this.isPursuing = true
        gameAudio.playWantedChirp()
        gameAudio.setSiren(true)
        this.spawnPoliceSquad(playerPos, wantedLevel)
      }

      this.updatePursuit(deltaTime, playerPos)
    } else {
      if (this.isPursuing) {
        this.isPursuing = false
        gameAudio.setSiren(false)
        this.despawnPoliceSquad()
      }
    }
  }

  private spawnPoliceSquad(playerPos: THREE.Vector3, wantedLevel: number) {
    const count = Math.min(3, Math.max(1, wantedLevel))

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const spawnDist = 65 + i * 20
      const spawnPos = new THREE.Vector3(
        playerPos.x + Math.cos(angle) * spawnDist,
        0.5,
        playerPos.z + Math.sin(angle) * spawnDist
      )

      const policeCar = this.vehicleManager.spawnVehicle(
        {
          name: 'Vapid Interceptor (Pursuit)',
          type: 'police',
          maxSpeedKmh: 200 + wantedLevel * 10,
          acceleration: 30 + wantedLevel * 4,
          braking: 40,
          steerSpeed: 3.6,
          maxSteerAngle: 0.55,
          mass: 1800,
          paintColor: 0xffffff,
        },
        spawnPos,
        angle + Math.PI
      )

      this.policeCars.push(policeCar)
    }
  }

  private updatePursuit(deltaTime: number, playerPos: THREE.Vector3) {
    let anyPoliceNear = false

    for (const cop of this.policeCars) {
      const dist = cop.position.distanceTo(playerPos)

      if (dist < 110) {
        anyPoliceNear = true
      }

      // Intercept course towards player
      const toPlayer = new THREE.Vector3().subVectors(playerPos, cop.position).normalize()
      const targetAngle = Math.atan2(toPlayer.x, toPlayer.z)

      const diff = THREE.MathUtils.euclideanModulo(targetAngle - cop.rotationY + Math.PI, Math.PI * 2) - Math.PI
      cop.steerAngle = Math.max(-0.55, Math.min(0.55, diff * 1.5))
      cop.rotationY += diff * Math.min(1, deltaTime * 3.0)
      cop.group.rotation.y = cop.rotationY

      // Accelerate towards player
      const forwardVec = new THREE.Vector3(Math.sin(cop.rotationY), 0, Math.cos(cop.rotationY))
      const targetSpeed = Math.min(cop.config.maxSpeedKmh / 3.6, dist > 20 ? 35 : 15)
      cop.velocity.lerp(forwardVec.clone().multiplyScalar(targetSpeed), deltaTime * 3.0)

      cop.position.addScaledVector(cop.velocity, deltaTime)
      cop.group.position.copy(cop.position)

      // Ramming / PIT maneuver impact
      if (dist < 4.0) {
        gameAudio.playCrash(0.8)
        const playerInCar = useGameStore.getState().inVehicle
        if (playerInCar) {
          useGameStore.getState().takeDamage(12)
        } else {
          useGameStore.getState().takeDamage(20)
        }
        cop.velocity.multiplyScalar(-0.4)
      }
    }

    // Evasion mechanics: If player is out of police range, start countdown to lose wanted level!
    if (!anyPoliceNear) {
      this.evasionTimer += deltaTime
      useGameStore.setState({ wantedFlashing: true })
      if (this.evasionTimer > 12.0) {
        // Escaped!
        useGameStore.getState().setWantedLevel(0)
        useGameStore.setState({ wantedFlashing: false })
        this.evasionTimer = 0
      }
    } else {
      this.evasionTimer = 0
      useGameStore.setState({ wantedFlashing: false })
    }
  }

  private despawnPoliceSquad() {
    for (const cop of this.policeCars) {
      cop.group.visible = false
      this.scene.remove(cop.group)
    }
    this.policeCars = []
  }
}
