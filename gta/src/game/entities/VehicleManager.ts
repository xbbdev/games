import * as THREE from 'three'
import { Vehicle, type VehicleConfig } from './Vehicle'
import { Player } from './Player'
import { MaterialLibrary } from '../world/Materials'
import { PhysicsEngine } from '../core/Physics'
import { InputManager } from '../core/Input'
import { gameAudio } from '../core/Audio'
import { useGameStore } from '../state/gameStore'

export class VehicleManager {
  public scene: THREE.Scene
  public materials: MaterialLibrary
  public physics: PhysicsEngine
  public input: InputManager
  public vehicles: Vehicle[] = []
  public activeVehicle: Vehicle | null = null

  constructor(
    scene: THREE.Scene,
    materials: MaterialLibrary,
    physics: PhysicsEngine,
    input: InputManager
  ) {
    this.scene = scene
    this.materials = materials
    this.physics = physics
    this.input = input

    this.spawnInitialVehicles()
  }

  private spawnInitialVehicles() {
    // 1. Player Starting Supercar (Pegassi Tempesta in Rosso Red) parked right near spawn
    this.spawnVehicle(
      {
        name: 'Pegassi Tempesta',
        type: 'supercar',
        maxSpeedKmh: 240,
        acceleration: 38,
        braking: 45,
        steerSpeed: 3.8,
        maxSteerAngle: 0.55,
        mass: 1450,
        paintColor: 0xcc1111,
      },
      new THREE.Vector3(12, 0.5, 8),
      Math.PI / 2
    )

    // 2. Vapid Dominator (Muscle car in Metallic Cobalt Blue)
    this.spawnVehicle(
      {
        name: 'Vapid Dominator',
        type: 'muscle',
        maxSpeedKmh: 215,
        acceleration: 34,
        braking: 38,
        steerSpeed: 3.2,
        maxSteerAngle: 0.52,
        mass: 1680,
        paintColor: 0x1d4ed8,
      },
      new THREE.Vector3(-45, 0.5, 25),
      0
    )

    // 3. Police Interceptor (Black & White patrol car)
    this.spawnVehicle(
      {
        name: 'Vapid Interceptor',
        type: 'police',
        maxSpeedKmh: 210,
        acceleration: 32,
        braking: 42,
        steerSpeed: 3.5,
        maxSteerAngle: 0.54,
        mass: 1800,
        paintColor: 0xffffff,
      },
      new THREE.Vector3(50, 0.5, -60),
      Math.PI
    )

    // 4. Albany President (Executive Sedan in Obsidian Black)
    this.spawnVehicle(
      {
        name: 'Albany President',
        type: 'sedan',
        maxSpeedKmh: 190,
        acceleration: 28,
        braking: 35,
        steerSpeed: 3.0,
        maxSteerAngle: 0.5,
        mass: 1750,
        paintColor: 0x111827,
      },
      new THREE.Vector3(-85, 0.5, -45),
      -Math.PI / 2
    )
  }

  public spawnVehicle(config: VehicleConfig, pos: THREE.Vector3, rotY: number = 0): Vehicle {
    const v = new Vehicle(this.scene, this.materials, this.physics, this.input, config, pos, rotY)
    this.vehicles.push(v)
    return v
  }

  public update(deltaTime: number, player: Player) {
    // Update all vehicles
    for (const v of this.vehicles) {
      const isControlled = v === this.activeVehicle
      v.update(deltaTime, isControlled)
    }

    if (this.activeVehicle) {
      // IN VEHICLE
      // Synchronize player position with vehicle position
      player.position.copy(this.activeVehicle.position)

      // Exit Vehicle with [F]
      if (this.input.wasKeyJustPressed('KeyF')) {
        this.exitVehicle(player)
      }
    } else {
      // ON FOOT
      // Check nearest vehicle for Enter prompt
      let nearestVehicle: Vehicle | null = null
      let nearestDist = Infinity

      for (const v of this.vehicles) {
        const dist = player.position.distanceTo(v.position)
        if (dist < nearestDist) {
          nearestDist = dist
          nearestVehicle = v
        }
      }

      if (nearestVehicle && nearestDist < 3.8) {
        useGameStore.getState().setInteractionPrompt(`Press [E] to enter ${nearestVehicle.config.name}`)

        // Enter Vehicle with [E]
        if (this.input.wasKeyJustPressed('KeyE')) {
          this.enterVehicle(player, nearestVehicle)
        }
      } else {
        useGameStore.getState().setInteractionPrompt(null)
      }
    }
  }

  public enterVehicle(player: Player, vehicle: Vehicle) {
    this.activeVehicle = vehicle
    player.setVisible(false)
    useGameStore.getState().setInVehicle(true, vehicle.config.name)
    gameAudio.playDoorSlam()
    gameAudio.setEngineState(true, 0.2, 0)

    if (vehicle.config.type === 'police') {
      gameAudio.setSiren(true)
    }
  }

  public exitVehicle(player: Player) {
    if (!this.activeVehicle) return
    const v = this.activeVehicle

    // Position player right outside driver door
    const driverDoorOffset = new THREE.Vector3(-1.8, 0, 0).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      v.rotationY
    )
    player.position.copy(v.position).add(driverDoorOffset)
    player.position.y = Math.max(0.2, player.position.y)
    player.velocity.set(0, 0, 0)
    player.group.position.copy(player.position)
    player.setVisible(true)

    // Camera matches vehicle orientation
    player.cameraYaw = v.rotationY

    gameAudio.playDoorSlam()
    gameAudio.setEngineState(false)
    gameAudio.setSkid(false)
    if (v.config.type === 'police') {
      gameAudio.setSiren(false)
    }

    useGameStore.getState().setInVehicle(false)
    this.activeVehicle = null
  }
}
