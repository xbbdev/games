import RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'

export class PhysicsEngine {
  private static instance: PhysicsEngine | null = null
  public world!: RAPIER.World
  public RAPIER!: typeof RAPIER
  public isReady = false

  public static async getInstance(): Promise<PhysicsEngine> {
    if (!PhysicsEngine.instance) {
      PhysicsEngine.instance = new PhysicsEngine()
      await PhysicsEngine.instance.init()
    }
    return PhysicsEngine.instance
  }

  private async init() {
    await RAPIER.init()
    this.RAPIER = RAPIER
    const gravity = new RAPIER.Vector3(0.0, -9.81, 0.0)
    this.world = new RAPIER.World(gravity)
    this.isReady = true
  }

  public step(deltaTime: number) {
    if (!this.isReady) return
    // Fixed or clamped timestep to avoid instability
    const stepTime = Math.min(deltaTime, 0.05)
    this.world.timestep = stepTime
    this.world.step()
  }

  // Create static ground / road plane collider
  public createGround(sizeX: number, sizeZ: number, posY: number = 0): RAPIER.RigidBody {
    const bodyDesc = this.RAPIER.RigidBodyDesc.fixed().setTranslation(0, posY - 0.5, 0)
    const body = this.world.createRigidBody(bodyDesc)
    const colliderDesc = this.RAPIER.ColliderDesc.cuboid(sizeX / 2, 0.5, sizeZ / 2)
      .setFriction(0.85)
      .setRestitution(0.05)
    this.world.createCollider(colliderDesc, body)
    return body
  }

  // Create static building or obstacle box collider
  public createBoxCollider(
    x: number,
    y: number,
    z: number,
    halfX: number,
    halfY: number,
    halfZ: number,
    rotationY: number = 0
  ): { body: RAPIER.RigidBody; collider: RAPIER.Collider } {
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotationY)
    const bodyDesc = this.RAPIER.RigidBodyDesc.fixed()
      .setTranslation(x, y, z)
      .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
    const body = this.world.createRigidBody(bodyDesc)
    const colliderDesc = this.RAPIER.ColliderDesc.cuboid(halfX, halfY, halfZ)
      .setFriction(0.6)
      .setRestitution(0.1)
    const collider = this.world.createCollider(colliderDesc, body)
    return { body, collider }
  }

  // Raycast down to find ground height and normal
  public raycastGround(
    origin: THREE.Vector3,
    maxDistance: number = 10
  ): { hit: boolean; point: THREE.Vector3; normal: THREE.Vector3; distance: number } | null {
    if (!this.isReady) return null
    const ray = new this.RAPIER.Ray(
      { x: origin.x, y: origin.y, z: origin.z },
      { x: 0, y: -1, z: 0 }
    )
    const hit = this.world.castRayAndGetNormal(
      ray,
      maxDistance,
      true, // solid
      undefined,
      undefined,
      undefined,
      undefined
    )
    if (hit) {
      const hitPoint = origin.clone().add(new THREE.Vector3(0, -hit.timeOfImpact, 0))
      return {
        hit: true,
        point: hitPoint,
        normal: new THREE.Vector3(hit.normal.x, hit.normal.y, hit.normal.z),
        distance: hit.timeOfImpact,
      }
    }
    return null
  }

  // Generic raycast for AI sight / traffic collision detection
  public castRay(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    maxDistance: number = 20
  ): boolean {
    if (!this.isReady) return false
    const dirNorm = direction.clone().normalize()
    const ray = new this.RAPIER.Ray(
      { x: origin.x, y: origin.y, z: origin.z },
      { x: dirNorm.x, y: dirNorm.y, z: dirNorm.z }
    )
    const hit = this.world.castRay(ray, maxDistance, true)
    return hit !== null
  }
}
