import * as THREE from 'three'
import { MaterialLibrary } from '../world/Materials'
import { PhysicsEngine } from '../core/Physics'
import { InputManager } from '../core/Input'
import { gameAudio } from '../core/Audio'
import { useGameStore } from '../state/gameStore'

export type VehicleType = 'supercar' | 'muscle' | 'police' | 'sedan'

export interface VehicleConfig {
  name: string
  type: VehicleType
  maxSpeedKmh: number
  acceleration: number
  braking: number
  steerSpeed: number
  maxSteerAngle: number
  mass: number
  paintColor: number
}

export class Vehicle {
  public scene: THREE.Scene
  public materials: MaterialLibrary
  public physics: PhysicsEngine
  public input: InputManager
  public config: VehicleConfig

  // 3D Model
  public group = new THREE.Group()
  public bodyMesh!: THREE.Group
  public wheels: { mesh: THREE.Group; isFront: boolean; isLeft: boolean }[] = []
  public headlights: { light: THREE.SpotLight; mesh: THREE.Mesh }[] = []
  public taillights: THREE.Mesh[] = []
  public sirenBar: THREE.Group | null = null

  // Transform & Physics State
  public position = new THREE.Vector3()
  public velocity = new THREE.Vector3()
  public rotationY = 0
  public speedKmh = 0
  public rpm = 0.2
  public currentGear = '1'
  public steerAngle = 0
  public isDrifting = false
  public health = 100
  public isPlayerControlled = false

  // Visual body roll & pitch
  private bodyRoll = 0
  private bodyPitch = 0

  // Siren flash timer
  private sirenTimer = 0
  private sirenToggle = false

  // Third-person vehicle camera parameters
  public cameraYaw = 0
  public cameraPitch = 0.22
  public cameraDistance = 6.2
  private targetCameraPos = new THREE.Vector3()
  private currentCameraPos = new THREE.Vector3()

  constructor(
    scene: THREE.Scene,
    materials: MaterialLibrary,
    physics: PhysicsEngine,
    input: InputManager,
    config: VehicleConfig,
    spawnPos: THREE.Vector3,
    spawnRotY: number = 0
  ) {
    this.scene = scene
    this.materials = materials
    this.physics = physics
    this.input = input
    this.config = config
    this.position.copy(spawnPos)
    this.rotationY = spawnRotY

    this.buildVehicleMesh()
    this.scene.add(this.group)
    this.group.position.copy(this.position)
    this.group.rotation.y = this.rotationY
    this.cameraYaw = this.rotationY
  }

  private buildVehicleMesh() {
    this.bodyMesh = new THREE.Group()
    this.group.add(this.bodyMesh)

    const paintMat = this.materials.createCarPaint(this.config.paintColor)

    if (this.config.type === 'supercar') {
      this.buildSupercarMesh(paintMat)
    } else if (this.config.type === 'police') {
      this.buildPoliceMesh()
    } else if (this.config.type === 'muscle') {
      this.buildMuscleMesh(paintMat)
    } else {
      this.buildSedanMesh(paintMat)
    }

    // Add 4 Wheels
    this.buildWheels()

    // Add Headlights and Taillights
    this.buildLights()
  }

  private buildSupercarMesh(paintMat: THREE.Material) {
    // Low, sleek, aerodynamic supercar
    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.55, 4.6), paintMat)
    mainBody.position.y = 0.55
    mainBody.castShadow = true
    this.bodyMesh.add(mainBody)

    // Cockpit cabin / tinted glass canopy
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.48, 2.2), this.materials.carGlassMaterial)
    cabin.position.set(0, 0.95, -0.2)
    cabin.castShadow = true
    this.bodyMesh.add(cabin)

    // Wedge front nose
    const nose = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.35, 1.2), paintMat)
    nose.position.set(0, 0.45, 2.2)
    nose.castShadow = true
    this.bodyMesh.add(nose)

    // Rear Carbon Spoiler
    const spoilerWing = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.08, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3, metalness: 0.8 })
    )
    spoilerWing.position.set(0, 1.15, -2.1)
    spoilerWing.castShadow = true
    this.bodyMesh.add(spoilerWing)

    // Spoiler struts
    for (const sx of [-0.6, 0.6]) {
      const strut = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6),
        this.materials.carChromeMaterial
      )
      strut.position.set(sx, 0.95, -2.1)
      this.bodyMesh.add(strut)
    }
  }

  private buildPoliceMesh() {
    // Black & White police cruiser
    const whiteMat = this.materials.createCarPaint(0xf0f0f5)
    const blackMat = this.materials.createCarPaint(0x111111)

    // Main chassis (black)
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.7, 4.8), blackMat)
    chassis.position.y = 0.65
    chassis.castShadow = true
    this.bodyMesh.add(chassis)

    // White door panels
    const doorL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 2.0), whiteMat)
    doorL.position.set(-1.08, 0.65, 0)
    this.bodyMesh.add(doorL)

    const doorR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 2.0), whiteMat)
    doorR.position.set(1.08, 0.65, 0)
    this.bodyMesh.add(doorR)

    // White roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 2.2), whiteMat)
    roof.position.set(0, 1.15, -0.1)
    roof.castShadow = true
    this.bodyMesh.add(roof)

    // Glass windows
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.48, 2.18), this.materials.carGlassMaterial)
    windshield.position.set(0, 1.15, -0.1)
    this.bodyMesh.add(windshield)

    // Front Push-Bumper / Bullbar
    const bullbar = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.5, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x181818, metalness: 0.8, roughness: 0.4 })
    )
    bullbar.position.set(0, 0.55, 2.5)
    this.bodyMesh.add(bullbar)

    // Roof Police Siren Bar (Red & Blue flashing)
    this.sirenBar = new THREE.Group()
    this.sirenBar.position.set(0, 1.48, -0.1)

    const barBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.12, 0.22),
      this.materials.carChromeMaterial
    )
    this.sirenBar.add(barBase)

    const redStrobe = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.2), this.materials.policeSirenRed)
    redStrobe.position.x = -0.3
    this.sirenBar.add(redStrobe)

    const blueStrobe = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.2), this.materials.policeSirenBlue)
    blueStrobe.position.x = 0.3
    this.sirenBar.add(blueStrobe)

    this.bodyMesh.add(this.sirenBar)
  }

  private buildMuscleMesh(paintMat: THREE.Material) {
    // Aggressive muscle car with hood scoop
    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.68, 4.7), paintMat)
    mainBody.position.y = 0.65
    mainBody.castShadow = true
    this.bodyMesh.add(mainBody)

    // Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.52, 2.3), this.materials.carGlassMaterial)
    cabin.position.set(0, 1.1, -0.3)
    cabin.castShadow = true
    this.bodyMesh.add(cabin)

    // Hood scoop
    const scoop = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.18, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 })
    )
    scoep: scoop.position.set(0, 1.05, 1.2)
    this.bodyMesh.add(scoop)
  }

  private buildSedanMesh(paintMat: THREE.Material) {
    // Classic 4-door sedan
    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.65, 4.6), paintMat)
    mainBody.position.y = 0.65
    mainBody.castShadow = true
    this.bodyMesh.add(mainBody)

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 2.5), this.materials.carGlassMaterial)
    cabin.position.set(0, 1.15, 0)
    cabin.castShadow = true
    this.bodyMesh.add(cabin)
  }

  private buildWheels() {
    const wheelRadius = 0.38
    const wheelWidth = 0.28
    const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 16)
    wheelGeo.rotateZ(Math.PI / 2)

    const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.72, wheelRadius * 0.72, wheelWidth + 0.01, 8)
    rimGeo.rotateZ(Math.PI / 2)

    const wheelOffsets = [
      { x: -1.02, y: 0.38, z: 1.45, isFront: true, isLeft: true },
      { x: 1.02, y: 0.38, z: 1.45, isFront: true, isLeft: false },
      { x: -1.02, y: 0.38, z: -1.45, isFront: false, isLeft: true },
      { x: 1.02, y: 0.38, z: -1.45, isFront: false, isLeft: false },
    ]

    for (const off of wheelOffsets) {
      const wheelGroup = new THREE.Group()
      wheelGroup.position.set(off.x, off.y, off.z)

      const tire = new THREE.Mesh(wheelGeo, this.materials.carTireMaterial)
      tire.castShadow = true
      wheelGroup.add(tire)

      const rim = new THREE.Mesh(rimGeo, this.materials.carRimMaterial)
      wheelGroup.add(rim)

      this.bodyMesh.add(wheelGroup)
      this.wheels.push({ mesh: wheelGroup, isFront: off.isFront, isLeft: off.isLeft })
    }
  }

  private buildLights() {
    // Headlights
    for (const hx of [-0.75, 0.75]) {
      const hMesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.1), this.materials.carHeadlightGlass)
      hMesh.position.set(hx, 0.6, 2.32)
      this.bodyMesh.add(hMesh)

      // Projective spotlight for realistic nighttime road illumination
      const spot = new THREE.SpotLight(0xfffae0, 2.5, 45, Math.PI / 6, 0.3, 1.2)
      spot.position.set(hx, 0.6, 2.35)
      spot.target.position.set(hx * 1.5, 0, 25)
      this.bodyMesh.add(spot)
      this.bodyMesh.add(spot.target)

      this.headlights.push({ light: spot, mesh: hMesh })
    }

    // Taillights
    for (const tx of [-0.75, 0.75]) {
      const tMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.1), this.materials.carTaillightGlass)
      tMesh.position.set(tx, 0.65, -2.32)
      this.bodyMesh.add(tMesh)
      this.taillights.push(tMesh)
    }
  }

  public update(deltaTime: number, isControlled: boolean) {
    this.isPlayerControlled = isControlled

    if (isControlled) {
      this.handlePlayerDriving(deltaTime)
      this.updateCamera(deltaTime)
    } else {
      // Natural rolling friction when unoccupied
      this.velocity.multiplyScalar(0.95)
      this.speedKmh = this.velocity.length() * 3.6
      this.position.addScaledVector(this.velocity, deltaTime)
      this.group.position.copy(this.position)
    }

    // Wheel rotation and steering visuals
    this.updateWheelVisuals(deltaTime)

    // Body roll and pitch suspension effects
    this.updateSuspensionVisuals(deltaTime)

    // Siren strobe flashing
    if (this.config.type === 'police' && this.sirenBar) {
      this.updatePoliceSiren(deltaTime)
    }
  }

  private handlePlayerDriving(deltaTime: number) {
    const forwardKey = this.input.isActionActive('forward')
    const backwardKey = this.input.isActionActive('backward')
    const leftKey = this.input.isActionActive('left')
    const rightKey = this.input.isActionActive('right')
    const handbrake = this.input.isActionActive('handbrake')

    // Horn key
    if (this.input.wasKeyJustPressed('KeyH')) {
      gameAudio.playHorn()
    }

    // Steering
    const targetSteer = (leftKey ? 1 : 0) - (rightKey ? 1 : 0)
    const steerSpeed = this.config.steerSpeed * (handbrake ? 1.6 : 1.0)
    this.steerAngle = THREE.MathUtils.lerp(
      this.steerAngle,
      targetSteer * this.config.maxSteerAngle,
      deltaTime * steerSpeed
    )

    // Forward direction unit vector
    const forwardVec = new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY))
    const currentSpeed = this.velocity.dot(forwardVec)
    this.speedKmh = Math.abs(currentSpeed * 3.6)

    // Acceleration & Braking
    let throttle = 0
    if (forwardKey) throttle += 1
    if (backwardKey) throttle -= 1

    const topSpeedMs = this.config.maxSpeedKmh / 3.6

    if (throttle > 0) {
      if (currentSpeed < topSpeedMs) {
        const accel = this.config.acceleration * (1.0 - currentSpeed / topSpeedMs * 0.4)
        this.velocity.addScaledVector(forwardVec, accel * deltaTime)
      }
    } else if (throttle < 0) {
      if (currentSpeed > 0.5) {
        // Braking
        this.velocity.addScaledVector(forwardVec, -this.config.braking * deltaTime)
      } else {
        // Reverse
        if (currentSpeed > -topSpeedMs * 0.35) {
          this.velocity.addScaledVector(forwardVec, -this.config.acceleration * 0.6 * deltaTime)
        }
      }
    }

    // Handbrake Drifting & Lateral Grip
    const lateralVec = new THREE.Vector3(Math.cos(this.rotationY), 0, -Math.sin(this.rotationY))
    const lateralSpeed = this.velocity.dot(lateralVec)

    const gripFactor = handbrake ? 0.25 : 0.88 // Lower lateral grip when drifting!
    this.velocity.addScaledVector(lateralVec, -lateralSpeed * (1 - gripFactor) * deltaTime * 12)

    this.isDrifting = handbrake && Math.abs(this.speedKmh) > 25
    gameAudio.setSkid(this.isDrifting, Math.min(1.0, this.speedKmh / 70))

    // Car Turning: Yaw rate proportional to forward speed and steer angle
    if (Math.abs(currentSpeed) > 0.2) {
      const turnMultiplier = handbrake ? 1.9 : 1.0
      const yawSpeed = (this.steerAngle * (currentSpeed / topSpeedMs) * turnMultiplier * 2.6)
      this.rotationY += yawSpeed * deltaTime
      this.group.rotation.y = this.rotationY
    }

    // Air drag & rolling friction
    this.velocity.multiplyScalar(0.992)

    // Calculate RPM and Gear
    this.calculateGearAndRpm(currentSpeed, topSpeedMs)

    // Update Audio Engine with telemetry
    gameAudio.setEngineState(true, this.rpm, this.speedKmh)

    // Taillights brake glow
    const isBraking = throttle < 0 && currentSpeed > 0.5
    for (const tl of this.taillights) {
      const mat = tl.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = isBraking ? 3.5 : 0.8
    }

    // Proposed new position
    const newPos = this.position.clone().addScaledVector(this.velocity, deltaTime)

    // Raycast Ground Check
    const groundCheck = this.physics.raycastGround(new THREE.Vector3(newPos.x, newPos.y + 1.0, newPos.z), 4.0)
    const groundY = groundCheck && groundCheck.hit ? groundCheck.point.y : 0
    newPos.y = groundY

    // Check collision with buildings/walls
    const canMove = !this.physics.castRay(
      new THREE.Vector3(this.position.x, this.position.y + 0.6, this.position.z),
      forwardVec,
      2.6
    )

    if (canMove) {
      this.position.copy(newPos)
    } else {
      // Crash!
      if (this.speedKmh > 20) {
        gameAudio.playCrash(this.speedKmh / 70)
        this.health = Math.max(0, this.health - this.speedKmh * 0.2)
      }
      this.velocity.multiplyScalar(-0.3) // Bounce back
    }

    this.group.position.copy(this.position)

    // Update Zustand Store Telemetry
    useGameStore.getState().setVehicleTelemetry(this.speedKmh, this.rpm, this.currentGear, this.health)
  }

  private calculateGearAndRpm(currentSpeed: number, topSpeedMs: number) {
    const ratio = Math.abs(currentSpeed) / topSpeedMs
    if (currentSpeed < -0.2) {
      this.currentGear = 'R'
      this.rpm = Math.min(1.0, 0.25 + ratio * 2.0)
    } else if (ratio < 0.02) {
      this.currentGear = '1'
      this.rpm = 0.2 // Idle
    } else if (ratio < 0.22) {
      this.currentGear = '1'
      this.rpm = 0.2 + (ratio / 0.22) * 0.75
    } else if (ratio < 0.45) {
      this.currentGear = '2'
      this.rpm = 0.3 + ((ratio - 0.22) / 0.23) * 0.7
    } else if (ratio < 0.7) {
      this.currentGear = '3'
      this.rpm = 0.35 + ((ratio - 0.45) / 0.25) * 0.65
    } else if (ratio < 0.88) {
      this.currentGear = '4'
      this.rpm = 0.4 + ((ratio - 0.7) / 0.18) * 0.6
    } else {
      this.currentGear = '5'
      this.rpm = 0.5 + ((ratio - 0.88) / 0.12) * 0.5
    }
  }

  private updateWheelVisuals(deltaTime: number) {
    const rollSpeed = (this.speedKmh / 3.6 / 0.38) * deltaTime
    for (const w of this.wheels) {
      // Steer front wheels
      if (w.isFront) {
        w.mesh.rotation.y = this.steerAngle
      }
      // Roll wheels around pitch axis
      w.mesh.children[0].rotation.x += rollSpeed
      w.mesh.children[1].rotation.x += rollSpeed
    }
  }

  private updateSuspensionVisuals(deltaTime: number) {
    // Body roll during turns (leaning into/away from turn)
    const targetRoll = -this.steerAngle * (this.speedKmh / 120) * 0.18
    this.bodyRoll = THREE.MathUtils.lerp(this.bodyRoll, targetRoll, deltaTime * 8)
    this.bodyMesh.rotation.z = this.bodyRoll

    // Body pitch (dive on brake, squat on accel)
    const targetPitch = 0 // subtle pitch
    this.bodyPitch = THREE.MathUtils.lerp(this.bodyPitch, targetPitch, deltaTime * 8)
    this.bodyMesh.rotation.x = this.bodyPitch
  }

  private updatePoliceSiren(deltaTime: number) {
    this.sirenTimer += deltaTime
    if (this.sirenTimer > 0.15) {
      this.sirenTimer = 0
      this.sirenToggle = !this.sirenToggle
      this.materials.policeSirenRed.color.set(this.sirenToggle ? 0xff0000 : 0x330000)
      this.materials.policeSirenBlue.color.set(!this.sirenToggle ? 0x0066ff : 0x001144)
    }
  }

  private updateCamera(deltaTime: number) {
    // Orbit camera with mouse while driving
    const sensitivity = 0.0025
    this.cameraYaw -= this.input.mouseDeltaX * sensitivity
    this.cameraPitch -= this.input.mouseDeltaY * sensitivity
    this.cameraPitch = Math.max(-0.4, Math.min(0.9, this.cameraPitch))

    // Camera smoothly follows behind vehicle orientation when not overriding with mouse
    if (Math.abs(this.input.mouseDeltaX) < 1.0) {
      const diff = THREE.MathUtils.euclideanModulo(this.rotationY - this.cameraYaw + Math.PI, Math.PI * 2) - Math.PI
      this.cameraYaw += diff * Math.min(1, deltaTime * 3.5)
    }

    const cosPitch = Math.cos(this.cameraPitch)
    const sinPitch = Math.sin(this.cameraPitch)
    const sinYaw = Math.sin(this.cameraYaw)
    const cosYaw = Math.cos(this.cameraYaw)

    const lookTarget = this.position.clone().add(new THREE.Vector3(0, 1.2, 0))
    const dist = this.cameraDistance + (this.speedKmh / 160) * 1.5 // Zoom out slightly at high speeds!

    this.targetCameraPos.set(
      lookTarget.x - sinYaw * cosPitch * dist,
      lookTarget.y + sinPitch * dist + 0.8,
      lookTarget.z - cosYaw * cosPitch * dist
    )

    this.currentCameraPos.lerp(this.targetCameraPos, Math.min(1, deltaTime * 14))
    this.camera.position.copy(this.currentCameraPos)
    this.camera.lookAt(lookTarget)

    // Dynamic FOV for speed sensation
    const targetFov = 62 + (this.speedKmh / 180) * 22
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, deltaTime * 6)
    this.camera.updateProjectionMatrix()
  }

  public get camera(): THREE.PerspectiveCamera {
    return this.scene.getObjectByProperty('isPerspectiveCamera', true) as THREE.PerspectiveCamera
  }
}
