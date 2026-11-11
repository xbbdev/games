import * as THREE from 'three'
import { MaterialLibrary } from './Materials'
import { RoadNetwork } from './RoadNetwork'
import { PhysicsEngine } from '../core/Physics'

export interface BuildingData {
  id: string
  box: THREE.Box3
  height: number
  type: 'skyscraper' | 'commercial' | 'residential' | 'industrial'
}

export class CityBuilder {
  public scene: THREE.Scene
  public materials: MaterialLibrary
  public roadNetwork: RoadNetwork
  public physics: PhysicsEngine

  public buildings: BuildingData[] = []
  public trafficLights: { mesh: THREE.Mesh; intersectionId: string; axis: 'NS' | 'EW' }[] = []
  public streetLights: { light: THREE.PointLight; pole: THREE.Object3D }[] = []

  private cityGroup = new THREE.Group()

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
    this.scene.add(this.cityGroup)
  }

  public build() {
    this.buildGround()
    this.buildRoads()
    this.buildSidewalks()
    this.buildBuildings()
    this.buildPropsAndVegetation()
    this.buildStuntRamps()
  }

  // 1. Base Ground
  private buildGround() {
    const groundGeo = new THREE.PlaneGeometry(1200, 1200)
    const groundMesh = new THREE.Mesh(groundGeo, this.materials.grassMaterial)
    groundMesh.rotation.x = -Math.PI / 2
    groundMesh.position.y = -0.05
    groundMesh.receiveShadow = true
    this.cityGroup.add(groundMesh)

    // Physics ground
    this.physics.createGround(1200, 1200, 0)
  }

  // 2. Road Meshes with markings and zebra crossings
  private buildRoads() {
    const rw = this.roadNetwork.streetWidth

    // Asphalt segments
    for (const seg of this.roadNetwork.roadSegments) {
      const length = seg.length
      const roadGeo = new THREE.PlaneGeometry(rw, length)
      const roadMesh = new THREE.Mesh(roadGeo, this.materials.asphaltMaterial)
      roadMesh.rotation.x = -Math.PI / 2

      // Position at midpoint
      const mid = new THREE.Vector3().addVectors(seg.start, seg.end).multiplyScalar(0.5)
      roadMesh.position.set(mid.x, 0.02, mid.z)

      if (seg.isEastWest) {
        roadMesh.rotation.z = Math.PI / 2
      }
      roadMesh.receiveShadow = true
      this.cityGroup.add(roadMesh)

      // Center double yellow line
      const lineGeo = new THREE.PlaneGeometry(0.35, length)
      const yellowLine = new THREE.Mesh(lineGeo, this.materials.roadMarkingYellow)
      yellowLine.rotation.x = -Math.PI / 2
      yellowLine.position.set(mid.x, 0.03, mid.z)
      if (seg.isEastWest) yellowLine.rotation.z = Math.PI / 2
      this.cityGroup.add(yellowLine)

      // Dashed white lane dividers
      const dashCount = Math.floor(length / 6)
      for (let i = 0; i < dashCount; i++) {
        const offset = -length / 2 + (i + 0.5) * 6
        const dashGeo = new THREE.PlaneGeometry(0.25, 2.5)

        // Left lane divider
        const dashLeft = new THREE.Mesh(dashGeo, this.materials.roadMarkingWhite)
        dashLeft.rotation.x = -Math.PI / 2

        // Right lane divider
        const dashRight = new THREE.Mesh(dashGeo, this.materials.roadMarkingWhite)
        dashRight.rotation.x = -Math.PI / 2

        if (seg.isEastWest) {
          dashLeft.rotation.z = Math.PI / 2
          dashRight.rotation.z = Math.PI / 2
          dashLeft.position.set(mid.x + offset, 0.03, mid.z - rw * 0.25)
          dashRight.position.set(mid.x + offset, 0.03, mid.z + rw * 0.25)
        } else {
          dashLeft.position.set(mid.x - rw * 0.25, 0.03, mid.z + offset)
          dashRight.position.set(mid.x + rw * 0.25, 0.03, mid.z + offset)
        }
        this.cityGroup.add(dashLeft)
        this.cityGroup.add(dashRight)
      }
    }

    // Intersections
    for (const int of this.roadNetwork.intersections) {
      const intGeo = new THREE.PlaneGeometry(rw, rw)
      const intMesh = new THREE.Mesh(intGeo, this.materials.asphaltMaterial)
      intMesh.rotation.x = -Math.PI / 2
      intMesh.position.set(int.center.x, 0.02, int.center.z)
      intMesh.receiveShadow = true
      this.cityGroup.add(intMesh)

      // Zebra crossings on 4 sides of intersection
      this.buildZebraCrossing(int.center.x, int.center.z, rw)
      // Traffic light pole
      this.buildTrafficLight(int.id, int.center.x, int.center.z, rw)
    }
  }

  private buildZebraCrossing(cx: number, cz: number, rw: number) {
    const zebraWidth = 3.0
    const stripeCount = 6
    const halfRw = rw / 2

    const createCrosswalk = (posX: number, posZ: number, isHoriz: boolean) => {
      for (let s = 0; s < stripeCount; s++) {
        const stripe = new THREE.Mesh(
          new THREE.PlaneGeometry(isHoriz ? 0.6 : 2.5, isHoriz ? 2.5 : 0.6),
          this.materials.roadMarkingWhite
        )
        stripe.rotation.x = -Math.PI / 2
        const sOffset = (s - (stripeCount - 1) / 2) * 1.8
        stripe.position.set(
          isHoriz ? posX + sOffset : posX,
          0.035,
          isHoriz ? posZ : posZ + sOffset
        )
        this.cityGroup.add(stripe)
      }
    }

    // North, South, East, West crosswalks
    createCrosswalk(cx, cz - halfRw - zebraWidth / 2, true)
    createCrosswalk(cx, cz + halfRw + zebraWidth / 2, true)
    createCrosswalk(cx - halfRw - zebraWidth / 2, cz, false)
    createCrosswalk(cx + halfRw + zebraWidth / 2, cz, false)
  }

  // 3. Sidewalks around blocks
  private buildSidewalks() {
    const rw = this.roadNetwork.streetWidth
    const extent = this.roadNetwork.extent
    const gs = this.roadNetwork.gridSize

    // Build block sidewalk rectangles
    for (let x = -extent + gs; x < extent - gs; x += gs) {
      for (let z = -extent + gs; z < extent - gs; z += gs) {
        const blockX = x + gs / 2
        const blockZ = z + gs / 2
        const blockSize = gs - rw

        // Sidewalk slab
        const swGeo = new THREE.BoxGeometry(blockSize, 0.3, blockSize)
        const swMesh = new THREE.Mesh(swGeo, this.materials.sidewalkMaterial)
        swMesh.position.set(blockX, 0.15, blockZ)
        swMesh.receiveShadow = true
        this.cityGroup.add(swMesh)

        // Physics for sidewalk
        this.physics.createBoxCollider(blockX, 0.15, blockZ, blockSize / 2, 0.15, blockSize / 2)
      }
    }
  }

  // 4. City Buildings per district
  private buildBuildings() {
    const extent = this.roadNetwork.extent
    const gs = this.roadNetwork.gridSize
    const rw = this.roadNetwork.streetWidth
    const sw = this.roadNetwork.sidewalkWidth
    const lotSize = gs - rw - sw * 2

    for (let x = -extent + gs; x < extent - gs; x += gs) {
      for (let z = -extent + gs; z < extent - gs; z += gs) {
        const blockCenterX = x + gs / 2
        const blockCenterZ = z + gs / 2

        // Determine district by distance from downtown (0, 0)
        const distFromCenter = Math.hypot(blockCenterX, blockCenterZ)

        if (distFromCenter < 120) {
          // DOWNTOWN: High-rise Skyscrapers
          this.buildSkyscraperBlock(blockCenterX, blockCenterZ, lotSize)
        } else if (blockCenterZ > 100) {
          // SOUTH ZONE: Industrial Warehouses & Docks
          this.buildIndustrialBlock(blockCenterX, blockCenterZ, lotSize)
        } else if (blockCenterX < -80) {
          // WEST ZONE: Commercial & Shopping Centers + Gas Station
          this.buildCommercialBlock(blockCenterX, blockCenterZ, lotSize)
        } else {
          // EAST ZONE: Residential Neighborhoods & Luxury Villas
          this.buildResidentialBlock(blockCenterX, blockCenterZ, lotSize)
        }
      }
    }
  }

  private buildSkyscraperBlock(cx: number, cz: number, size: number) {
    // 1 or 2 mega skyscrapers per downtown block
    const numTowers = Math.random() > 0.4 ? 1 : 2

    if (numTowers === 1) {
      const width = size * 0.75
      const depth = size * 0.75
      const height = 90 + Math.random() * 95 // 90m to 185m skyscraper!

      const geo = new THREE.BoxGeometry(width, height, depth)
      const mesh = new THREE.Mesh(geo, this.materials.glassSkyscraperMat)
      mesh.position.set(cx, height / 2, cz)
      mesh.castShadow = true
      mesh.receiveShadow = true
      this.cityGroup.add(mesh)

      // Rooftop helipad or antenna
      this.buildRooftopDetails(cx, height, cz, width, depth)

      // Physics
      this.physics.createBoxCollider(cx, height / 2, cz, width / 2, height / 2, depth / 2)

      this.buildings.push({
        id: `bld_dt_${cx}_${cz}`,
        box: new THREE.Box3().setFromObject(mesh),
        height,
        type: 'skyscraper',
      })
    } else {
      // Twin towers
      const halfSize = size * 0.42
      const offsets = [
        { x: cx - size * 0.22, z: cz - size * 0.22 },
        { x: cx + size * 0.22, z: cz + size * 0.22 },
      ]

      offsets.forEach((pos, idx) => {
        const height = 75 + Math.random() * 80
        const isGlass = idx === 0
        const mat = isGlass ? this.materials.glassSkyscraperMat : this.materials.concreteSkyscraperMat
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(halfSize, height, halfSize), mat)
        mesh.position.set(pos.x, height / 2, pos.z)
        mesh.castShadow = true
        mesh.receiveShadow = true
        this.cityGroup.add(mesh)

        this.physics.createBoxCollider(pos.x, height / 2, pos.z, halfSize / 2, height / 2, halfSize / 2)
      })
    }
  }

  private buildRooftopDetails(cx: number, y: number, cz: number, w: number, d: number) {
    // Antennas / spires with red flashing warning lights
    const spireGeo = new THREE.CylinderGeometry(0.3, 1.2, 18, 8)
    const spireMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.8, roughness: 0.2 })
    const spire = new THREE.Mesh(spireGeo, spireMat)
    spire.position.set(cx, y + 9, cz)
    this.cityGroup.add(spire)

    const beaconGeo = new THREE.SphereGeometry(0.6, 8, 8)
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0000 })
    const beacon = new THREE.Mesh(beaconGeo, beaconMat)
    beacon.position.set(cx, y + 18, cz)
    this.cityGroup.add(beacon)

    // Air conditioner unit boxes
    for (let i = 0; i < 4; i++) {
      const acGeo = new THREE.BoxGeometry(4, 3, 4)
      const acMat = new THREE.MeshStandardMaterial({ color: 0x555c66, metalness: 0.5, roughness: 0.5 })
      const acMesh = new THREE.Mesh(acGeo, acMat)
      const ox = (i % 2 === 0 ? 1 : -1) * (w * 0.25)
      const oz = (i < 2 ? 1 : -1) * (d * 0.25)
      acMesh.position.set(cx + ox, y + 1.5, cz + oz)
      this.cityGroup.add(acMesh)
    }
  }

  private buildCommercialBlock(cx: number, cz: number, size: number) {
    // 2-3 mid-rise commercial buildings or gas station
    const isGasStation = Math.random() > 0.65
    if (isGasStation) {
      this.buildGasStation(cx, cz)
      return
    }

    const bldCount = 2
    for (let i = 0; i < bldCount; i++) {
      const w = size * 0.42
      const d = size * 0.85
      const h = 25 + Math.random() * 30
      const posX = cx + (i === 0 ? -size * 0.23 : size * 0.23)

      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.materials.concreteSkyscraperMat)
      mesh.position.set(posX, h / 2, cz)
      mesh.castShadow = true
      mesh.receiveShadow = true
      this.cityGroup.add(mesh)

      this.physics.createBoxCollider(posX, h / 2, cz, w / 2, h / 2, d / 2)

      // Neon store sign
      const signGeo = new THREE.PlaneGeometry(12, 3)
      const signMat = new THREE.MeshBasicMaterial({ color: i === 0 ? 0x00ffcc : 0xff00aa })
      const signMesh = new THREE.Mesh(signGeo, signMat)
      signMesh.position.set(posX, 5, cz + (i === 0 ? d / 2 + 0.1 : -d / 2 - 0.1))
      if (i !== 0) signMesh.rotation.y = Math.PI
      this.cityGroup.add(signMesh)
    }
  }

  private buildGasStation(cx: number, cz: number) {
    // Canopy roof
    const canopyGeo = new THREE.BoxGeometry(32, 1.2, 22)
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0xee2222, metalness: 0.4, roughness: 0.3 })
    const canopy = new THREE.Mesh(canopyGeo, canopyMat)
    canopy.position.set(cx, 6.5, cz)
    canopy.castShadow = true
    this.cityGroup.add(canopy)

    // Support pillars
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.4 })
    const pCoords = [
      [-10, -7],
      [-10, 7],
      [10, -7],
      [10, 7],
    ]
    pCoords.forEach(([ox, oz]) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 6, 8), pillarMat)
      pillar.position.set(cx + ox, 3, cz + oz)
      this.cityGroup.add(pillar)
      this.physics.createBoxCollider(cx + ox, 3, cz + oz, 0.5, 3, 0.5)
    })

    // Fuel pumps
    const pumpGeo = new THREE.BoxGeometry(1.5, 2.5, 4)
    const pumpMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.5, roughness: 0.3 })
    for (let p = -1; p <= 1; p += 2) {
      const pump = new THREE.Mesh(pumpGeo, pumpMat)
      pump.position.set(cx, 1.25, cz + p * 6)
      this.cityGroup.add(pump)
      this.physics.createBoxCollider(cx, 1.25, cz + p * 6, 0.75, 1.25, 2)
    }

    // Convenience store behind canopy
    const storeGeo = new THREE.BoxGeometry(26, 7, 14)
    const store = new THREE.Mesh(storeGeo, this.materials.brickBuildingMat)
    store.position.set(cx, 3.5, cz - 18)
    store.castShadow = true
    this.cityGroup.add(store)
    this.physics.createBoxCollider(cx, 3.5, cz - 18, 13, 3.5, 7)
  }

  private buildResidentialBlock(cx: number, cz: number, size: number) {
    // 4 modern suburban townhouses per block with palm trees
    const half = size * 0.25
    const positions = [
      { x: cx - half, z: cz - half },
      { x: cx + half, z: cz - half },
      { x: cx - half, z: cz + half },
      { x: cx + half, z: cz + half },
    ]

    positions.forEach((pos) => {
      const w = size * 0.38
      const d = size * 0.38
      const h = 10 + Math.random() * 6

      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.materials.brickBuildingMat)
      mesh.position.set(pos.x, h / 2, pos.z)
      mesh.castShadow = true
      mesh.receiveShadow = true
      this.cityGroup.add(mesh)

      this.physics.createBoxCollider(pos.x, h / 2, pos.z, w / 2, h / 2, d / 2)

      // Plant a palm tree in the front garden
      this.buildPalmTree(pos.x + w * 0.4, pos.z + d * 0.4)
    })
  }

  private buildIndustrialBlock(cx: number, cz: number, size: number) {
    // Long warehouse + colorful stacked shipping containers
    const whGeo = new THREE.BoxGeometry(size * 0.75, 12, size * 0.4)
    const whMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.4 })
    const warehouse = new THREE.Mesh(whGeo, whMat)
    warehouse.position.set(cx, 6, cz - size * 0.2)
    warehouse.castShadow = true
    this.cityGroup.add(warehouse)

    this.physics.createBoxCollider(cx, 6, cz - size * 0.2, (size * 0.75) / 2, 6, (size * 0.4) / 2)

    // Shipping containers (blue, orange, green, red)
    const colors = [0x1e3a8a, 0xea580c, 0x15803d, 0xb91c1c]
    for (let c = 0; c < 6; c++) {
      const col = colors[c % colors.length]
      const cMat = new THREE.MeshStandardMaterial({ color: col, metalness: 0.65, roughness: 0.35 })
      const cGeo = new THREE.BoxGeometry(12, 3.2, 4.5)
      const cont = new THREE.Mesh(cGeo, cMat)

      const stackHeight = c > 3 ? 4.8 : 1.6
      const ox = (c % 3 - 1) * 14
      cont.position.set(cx + ox, stackHeight, cz + size * 0.25)
      cont.castShadow = true
      this.cityGroup.add(cont)

      this.physics.createBoxCollider(cx + ox, stackHeight, cz + size * 0.25, 6, 1.6, 2.25)
    }
  }

  // 5. Urban Props & Street Furniture
  private buildPropsAndVegetation() {
    const rw = this.roadNetwork.streetWidth
    const offset = rw / 2 + 1.2

    // Place Streetlights along road segments
    for (const seg of this.roadNetwork.roadSegments) {
      const steps = Math.floor(seg.length / 35)
      for (let s = 1; s <= steps; s++) {
        const t = s / (steps + 1)
        const pos = new THREE.Vector3().lerpVectors(seg.start, seg.end, t)

        if (seg.isEastWest) {
          this.buildStreetLight(pos.x, pos.z - offset, Math.PI / 2)
          this.buildStreetLight(pos.x, pos.z + offset, -Math.PI / 2)
        } else {
          this.buildStreetLight(pos.x - offset, pos.z, 0)
          this.buildStreetLight(pos.x + offset, pos.z, Math.PI)
        }
      }
    }
  }

  private buildStreetLight(x: number, z: number, rotY: number) {
    const poleGroup = new THREE.Group()
    poleGroup.position.set(x, 0, z)
    poleGroup.rotation.y = rotY

    // Vertical pole
    const poleGeo = new THREE.CylinderGeometry(0.14, 0.2, 8, 8)
    const pole = new THREE.Mesh(poleGeo, this.materials.streetLightPoleMat)
    pole.position.y = 4
    poleGroup.add(pole)

    // Curved horizontal arm extending toward street
    const armGeo = new THREE.CylinderGeometry(0.1, 0.14, 3.2, 8)
    const arm = new THREE.Mesh(armGeo, this.materials.streetLightPoleMat)
    arm.rotation.z = Math.PI / 3
    arm.position.set(1.4, 7.8, 0)
    poleGroup.add(arm)

    // Lamp fixture
    const lampGeo = new THREE.BoxGeometry(0.8, 0.25, 0.5)
    const lamp = new THREE.Mesh(lampGeo, this.materials.streetLightLampMat)
    lamp.position.set(2.6, 8.2, 0)
    poleGroup.add(lamp)

    // Real-time point light for nighttime illumination
    const pLight = new THREE.PointLight(0xffeedd, 0.0, 35, 1.8)
    pLight.position.set(2.6, 7.5, 0)
    poleGroup.add(pLight)

    this.cityGroup.add(poleGroup)
    this.streetLights.push({ light: pLight, pole: poleGroup })
  }

  private buildTrafficLight(id: string, cx: number, cz: number, rw: number) {
    // Traffic light gantry at corner of intersection
    const px = cx + rw / 2 + 1.5
    const pz = cz + rw / 2 + 1.5

    const gantry = new THREE.Group()
    gantry.position.set(px, 0, pz)

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 7, 8),
      this.materials.streetLightPoleMat
    )
    pole.position.y = 3.5
    gantry.add(pole)

    // Signal housing box
    const boxGeo = new THREE.BoxGeometry(0.5, 1.6, 0.5)
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x111111 })
    const boxMesh = new THREE.Mesh(boxGeo, boxMat)
    boxMesh.position.set(-1.0, 6.2, 0)
    gantry.add(boxMesh)

    // Light lens
    const lightLens = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    )
    lightLens.position.set(-1.0, 6.2, 0.26)
    gantry.add(lightLens)

    this.cityGroup.add(gantry)
    this.trafficLights.push({ mesh: lightLens, intersectionId: id, axis: 'NS' })
  }

  public buildPalmTree(x: number, z: number) {
    const treeGroup = new THREE.Group()
    treeGroup.position.set(x, 0, z)

    // Trunk with characteristic curve
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.55, 10, 8)
    const trunk = new THREE.Mesh(trunkGeo, this.materials.treeBarkMat)
    trunk.position.y = 5
    trunk.rotation.z = 0.08
    treeGroup.add(trunk)

    // Fronds / Palm Canopy
    const frondCount = 7
    for (let i = 0; i < frondCount; i++) {
      const angle = (i / frondCount) * Math.PI * 2
      const frondGeo = new THREE.ConeGeometry(1.6, 6, 4)
      const frond = new THREE.Mesh(frondGeo, this.materials.treeLeavesMat)
      frond.position.set(Math.cos(angle) * 2.2, 9.8, Math.sin(angle) * 2.2)
      frond.rotation.x = Math.sin(angle) * 0.9
      frond.rotation.z = -Math.cos(angle) * 0.9
      treeGroup.add(frond)
    }

    this.cityGroup.add(treeGroup)
  }

  // 6. Stunt Ramps for vehicle aerial tricks!
  private buildStuntRamps() {
    const rampPositions = [
      { x: 30, z: -40, rot: 0 },
      { x: -140, z: 80, rot: Math.PI / 2 },
      { x: 120, z: 130, rot: -Math.PI / 4 },
    ]

    const rampMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.3,
      roughness: 0.5,
    })

    rampPositions.forEach((pos) => {
      const rampGeo = new THREE.CylinderGeometry(0.1, 8, 4, 3) // Triangular wedge prism
      const ramp = new THREE.Mesh(rampGeo, rampMat)
      ramp.position.set(pos.x, 1.8, pos.z)
      ramp.rotation.y = pos.rot
      ramp.rotation.z = Math.PI / 6
      ramp.castShadow = true
      this.cityGroup.add(ramp)

      // Physics box collider
      this.physics.createBoxCollider(pos.x, 1.5, pos.z, 3.5, 1.5, 3.5, pos.rot)
    })
  }

  // Update dynamic lights based on time and traffic signals
  public update(_deltaTime: number, hour: number) {
    const isDark = hour >= 18.5 || hour < 6.0
    const lightIntensity = isDark ? 2.5 : 0.0

    // Update streetlights
    for (const sl of this.streetLights) {
      sl.light.intensity = THREE.MathUtils.lerp(sl.light.intensity, lightIntensity, 0.05)
    }

    // Update traffic signal colors
    for (const tl of this.trafficLights) {
      const int = this.roadNetwork.intersections.find((i) => i.id === tl.intersectionId)
      if (int) {
        const mat = tl.mesh.material as THREE.MeshBasicMaterial
        if (int.trafficState === 'NS_GREEN') {
          mat.color.set(0x00ff44)
        } else if (int.trafficState === 'NS_YELLOW') {
          mat.color.set(0xffaa00)
        } else {
          mat.color.set(0xff1111)
        }
      }
    }
  }
}
