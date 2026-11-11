import * as THREE from 'three'
import { PhysicsEngine } from '../core/Physics'
import { InputManager } from '../core/Input'
import { gameAudio } from '../core/Audio'
import { useGameStore } from '../state/gameStore'

export type PlayerState = 'idle' | 'walk' | 'run' | 'jump' | 'crouch'

export class Player {
  public scene: THREE.Scene
  public physics: PhysicsEngine
  public input: InputManager
  public camera: THREE.PerspectiveCamera

  // 3D Model & Hierarchy
  public group = new THREE.Group()
  private torso!: THREE.Mesh
  private head!: THREE.Mesh
  private leftUpperArm!: THREE.Group
  private rightUpperArm!: THREE.Group
  private leftLeg!: THREE.Group
  private rightLeg!: THREE.Group

  // Movement & Physics
  public position = new THREE.Vector3(0, 0.5, 0)
  public velocity = new THREE.Vector3()
  public rotationY = 0
  public isGrounded = true
  public state: PlayerState = 'idle'
  public isCrouched = false

  // Camera Orbit
  public cameraYaw = 0
  public cameraPitch = 0.25 // slight downward look
  public cameraDistance = 4.2
  private targetCameraPos = new THREE.Vector3()
  private currentCameraPos = new THREE.Vector3()

  // Speeds
  private walkSpeed = 5.0
  private runSpeed = 10.5
  private crouchSpeed = 2.5
  private jumpForce = 7.5
  private gravity = 22.0

  // Animation cycle
  private animTime = 0
  private stepTimer = 0

  constructor(
    scene: THREE.Scene,
    physics: PhysicsEngine,
    input: InputManager,
    camera: THREE.PerspectiveCamera,
    spawnX = 0,
    spawnZ = 0
  ) {
    this.scene = scene
    this.physics = physics
    this.input = input
    this.camera = camera
    this.position.set(spawnX, 1.0, spawnZ)

    this.buildCharacterMesh()
    this.scene.add(this.group)
    this.group.position.copy(this.position)

    // Initial camera position
    this.currentCameraPos.copy(this.position).add(new THREE.Vector3(0, 2, 4))
  }

  private buildCharacterMesh() {
    // Materials
    const jacketMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937, // dark leather jacket
      roughness: 0.4,
      metalness: 0.2,
    })
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xd4a373, // skin tone
      roughness: 0.7,
      metalness: 0.05,
    })
    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a5f, // dark denim
      roughness: 0.8,
      metalness: 0.05,
    })
    const shoesMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.5,
    })
    const glassesMat = new THREE.MeshStandardMaterial({
      color: 0x050505,
      metalness: 0.9,
      roughness: 0.1,
    })

    // Torso (Jacket)
    const torsoGeo = new THREE.BoxGeometry(0.55, 0.75, 0.3)
    this.torso = new THREE.Mesh(torsoGeo, jacketMat)
    this.torso.position.y = 1.2
    this.torso.castShadow = true
    this.group.add(this.torso)

    // Head
    const headGeo = new THREE.BoxGeometry(0.3, 0.35, 0.32)
    this.head = new THREE.Mesh(headGeo, skinMat)
    this.head.position.set(0, 0.55, 0)
    this.head.castShadow = true
    this.torso.add(this.head)

    // Sunglasses
    const glassesGeo = new THREE.BoxGeometry(0.32, 0.08, 0.1)
    const glasses = new THREE.Mesh(glassesGeo, glassesMat)
    glasses.position.set(0, 0.05, 0.16)
    this.head.add(glasses)

    // Left Arm
    this.leftUpperArm = new THREE.Group()
    this.leftUpperArm.position.set(-0.35, 0.3, 0)
    const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.7, 0.18), jacketMat)
    lArm.position.y = -0.35
    lArm.castShadow = true
    this.leftUpperArm.add(lArm)
    this.torso.add(this.leftUpperArm)

    // Right Arm
    this.rightUpperArm = new THREE.Group()
    this.rightUpperArm.position.set(0.35, 0.3, 0)
    const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.7, 0.18), jacketMat)
    rArm.position.y = -0.35
    rArm.castShadow = true
    this.rightUpperArm.add(rArm)
    this.torso.add(this.rightUpperArm)

    // Left Leg
    this.leftLeg = new THREE.Group()
    this.leftLeg.position.set(-0.16, 0.8, 0)
    const lPants = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.75, 0.22), pantsMat)
    lPants.position.y = -0.37
    lPants.castShadow = true
    this.leftLeg.add(lPants)
    const lShoe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.32), shoesMat)
    lShoe.position.set(0, -0.75, 0.04)
    lShoe.castShadow = true
    this.leftLeg.add(lShoe)
    this.group.add(this.leftLeg)

    // Right Leg
    this.rightLeg = new THREE.Group()
    this.rightLeg.position.set(0.16, 0.8, 0)
    const rPants = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.75, 0.22), pantsMat)
    rPants.position.y = -0.37
    rPants.castShadow = true
    this.rightLeg.add(rPants)
    const rShoe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.32), shoesMat)
    rShoe.position.set(0, -0.75, 0.04)
    rShoe.castShadow = true
    this.rightLeg.add(rShoe)
    this.group.add(this.rightLeg)
  }

  public update(deltaTime: number) {
    this.updateCameraOrbit()
    this.handleMovement(deltaTime)
    this.applyAnimation(deltaTime)
    this.updateCameraFollow(deltaTime)
  }

  private updateCameraOrbit() {
    // Mouse delta to orbit camera
    const sensitivity = 0.0025
    this.cameraYaw -= this.input.mouseDeltaX * sensitivity
    this.cameraPitch -= this.input.mouseDeltaY * sensitivity

    // Pitch limits (-70° to +75°)
    this.cameraPitch = Math.max(-1.1, Math.min(1.25, this.cameraPitch))
    this.cameraDistance = this.input.cameraDistance
  }

  private handleMovement(deltaTime: number) {
    const isSprint = this.input.isActionActive('sprint')
    const isJump = this.input.isActionActive('jump')
    const isCrouch = this.input.isActionActive('crouch')
    this.isCrouched = isCrouch

    // Calculate move vector from WASD relative to camera yaw
    let moveForward = 0
    let moveRight = 0

    if (this.input.isActionActive('forward')) moveForward += 1
    if (this.input.isActionActive('backward')) moveForward -= 1
    if (this.input.isActionActive('right')) moveRight += 1
    if (this.input.isActionActive('left')) moveRight -= 1

    const isMoving = moveForward !== 0 || moveRight !== 0

    // Speed calculation
    let currentSpeed = this.walkSpeed
    if (isCrouch) {
      currentSpeed = this.crouchSpeed
    } else if (isSprint && isMoving) {
      currentSpeed = this.runSpeed
      // Drain stamina in store
      const curStamina = useGameStore.getState().stamina
      if (curStamina > 0) {
        useGameStore.getState().setStamina(curStamina - deltaTime * 12)
      } else {
        currentSpeed = this.walkSpeed // exhausted
      }
    } else {
      // Regain stamina
      const curStamina = useGameStore.getState().stamina
      if (curStamina < 100) {
        useGameStore.getState().setStamina(curStamina + deltaTime * 8)
      }
    }

    if (isMoving) {
      const inputAngle = Math.atan2(moveRight, moveForward)
      const targetAngle = this.cameraYaw + inputAngle

      // Smooth rotate player mesh towards move direction
      const diff = THREE.MathUtils.euclideanModulo(targetAngle - this.rotationY + Math.PI, Math.PI * 2) - Math.PI
      this.rotationY += diff * Math.min(1, deltaTime * 14)
      this.group.rotation.y = this.rotationY

      // Velocity in XZ
      const vx = Math.sin(targetAngle) * currentSpeed
      const vz = Math.cos(targetAngle) * currentSpeed
      this.velocity.x = vx
      this.velocity.z = vz

      this.state = isSprint && !isCrouch ? 'run' : 'walk'

      // Footstep sound interval
      this.stepTimer += deltaTime * (isSprint ? 14 : 9)
      if (this.stepTimer >= 3.14) {
        this.stepTimer = 0
        if (this.isGrounded) {
          gameAudio.playFootstep(isSprint)
        }
      }
    } else {
      this.velocity.x *= 0.7
      this.velocity.z *= 0.7
      this.state = 'idle'
    }

    // Jump handling
    if (isJump && this.isGrounded && !isCrouch) {
      this.velocity.y = this.jumpForce
      this.isGrounded = false
      this.state = 'jump'
    }

    // Gravity
    this.velocity.y -= this.gravity * deltaTime

    // Proposed new position
    const newPos = this.position.clone().addScaledVector(this.velocity, deltaTime)

    // Raycast ground collision check
    const groundCheck = this.physics.raycastGround(new THREE.Vector3(newPos.x, newPos.y + 1.0, newPos.z), 3.0)
    const groundY = groundCheck && groundCheck.hit ? groundCheck.point.y : 0

    if (newPos.y <= groundY) {
      newPos.y = groundY
      this.velocity.y = 0
      this.isGrounded = true
    } else {
      this.isGrounded = false
      if (!isMoving) this.state = 'jump'
    }

    // Building collision raycast checks (prevent walking through walls)
    const canMoveX = !this.physics.castRay(
      new THREE.Vector3(this.position.x, this.position.y + 0.8, this.position.z),
      new THREE.Vector3(Math.sign(this.velocity.x), 0, 0),
      0.6
    )
    if (canMoveX) {
      this.position.x = newPos.x
    } else {
      this.velocity.x = 0
    }

    const canMoveZ = !this.physics.castRay(
      new THREE.Vector3(this.position.x, this.position.y + 0.8, this.position.z),
      new THREE.Vector3(0, 0, Math.sign(this.velocity.z)),
      0.6
    )
    if (canMoveZ) {
      this.position.z = newPos.z
    } else {
      this.velocity.z = 0
    }

    this.position.y = newPos.y
    this.group.position.copy(this.position)

    // Crouch height adjustment
    const targetTorsoY = this.isCrouched ? 0.8 : 1.2
    this.torso.position.y = THREE.MathUtils.lerp(this.torso.position.y, targetTorsoY, deltaTime * 12)
  }

  private applyAnimation(deltaTime: number) {
    if (this.state === 'walk') {
      this.animTime += deltaTime * 7.5
    } else if (this.state === 'run') {
      this.animTime += deltaTime * 13.5
    } else {
      this.animTime += deltaTime * 2.0 // Idle breath
    }

    const sinAnim = Math.sin(this.animTime)

    if (this.state === 'idle') {
      // Breathing & subtle arm sway
      this.torso.position.y = (this.isCrouched ? 0.8 : 1.2) + Math.sin(this.animTime * 1.5) * 0.02
      this.leftUpperArm.rotation.x = sinAnim * 0.05
      this.rightUpperArm.rotation.x = -sinAnim * 0.05
      this.leftLeg.rotation.x = 0
      this.rightLeg.rotation.x = 0
      this.torso.rotation.x = 0
      this.torso.rotation.z = 0
    } else if (this.state === 'walk') {
      // Natural stride
      this.leftLeg.rotation.x = sinAnim * 0.7
      this.rightLeg.rotation.x = -sinAnim * 0.7
      this.leftUpperArm.rotation.x = -sinAnim * 0.6
      this.rightUpperArm.rotation.x = sinAnim * 0.6
      this.torso.rotation.z = -sinAnim * 0.04
      this.torso.rotation.x = 0.05
    } else if (this.state === 'run') {
      // Athletic sprint lean
      this.leftLeg.rotation.x = sinAnim * 1.1
      this.rightLeg.rotation.x = -sinAnim * 1.1
      this.leftUpperArm.rotation.x = -sinAnim * 0.95
      this.rightUpperArm.rotation.x = sinAnim * 0.95
      this.torso.rotation.x = 0.22 // forward lean
      this.torso.rotation.z = -sinAnim * 0.08
    } else if (this.state === 'jump') {
      // Airborne pose
      this.leftLeg.rotation.x = -0.4
      this.rightLeg.rotation.x = 0.5
      this.leftUpperArm.rotation.x = -1.1
      this.rightUpperArm.rotation.x = -1.1
      this.torso.rotation.x = 0.1
    }
  }

  private updateCameraFollow(deltaTime: number) {
    // Calculate third-person camera eye position
    const lookTarget = this.position.clone().add(new THREE.Vector3(0, this.isCrouched ? 1.0 : 1.5, 0))

    const cosPitch = Math.cos(this.cameraPitch)
    const sinPitch = Math.sin(this.cameraPitch)
    const sinYaw = Math.sin(this.cameraYaw)
    const cosYaw = Math.cos(this.cameraYaw)

    let dist = this.cameraDistance

    // Check camera collision with buildings/walls
    const camDir = new THREE.Vector3(sinYaw * cosPitch, sinPitch, cosYaw * cosPitch)
    if (this.physics.castRay(lookTarget, camDir, dist)) {
      dist = Math.max(1.2, dist * 0.5)
    }

    this.targetCameraPos.set(
      lookTarget.x + sinYaw * cosPitch * dist,
      lookTarget.y + sinPitch * dist,
      lookTarget.z + cosYaw * cosPitch * dist
    )

    // Smooth camera damping
    this.currentCameraPos.lerp(this.targetCameraPos, Math.min(1, deltaTime * 18))
    this.camera.position.copy(this.currentCameraPos)
    this.camera.lookAt(lookTarget)

    // Dynamic FOV when sprinting
    const targetFov = this.state === 'run' ? 72 : 62
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, deltaTime * 6)
    this.camera.updateProjectionMatrix()
  }

  public setVisible(visible: boolean) {
    this.group.visible = visible
  }
}
