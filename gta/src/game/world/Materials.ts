import * as THREE from 'three'

// Helper to generate canvas-based procedural textures
function createAsphaltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!

  // Base dark asphalt
  ctx.fillStyle = '#222326'
  ctx.fillRect(0, 0, 512, 512)

  // Gravel speckles & grain
  for (let i = 0; i < 35000; i++) {
    const x = Math.random() * 512
    const y = Math.random() * 512
    const shade = Math.floor(25 + Math.random() * 30)
    ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`
    ctx.fillRect(x, y, 1.5, 1.5)
  }

  // Subtle tire wear bands
  const gradient = ctx.createLinearGradient(0, 0, 512, 0)
  gradient.addColorStop(0.15, 'rgba(15, 15, 16, 0.4)')
  gradient.addColorStop(0.35, 'rgba(35, 36, 38, 0.0)')
  gradient.addColorStop(0.65, 'rgba(15, 15, 16, 0.4)')
  gradient.addColorStop(0.85, 'rgba(35, 36, 38, 0.0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 512, 512)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(4, 4)
  return texture
}

function createAsphaltNormalMap(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!

  // Normal map neutral blue (128, 128, 255)
  ctx.fillStyle = 'rgb(128, 128, 255)'
  ctx.fillRect(0, 0, 256, 256)

  for (let i = 0; i < 15000; i++) {
    const x = Math.random() * 256
    const y = Math.random() * 256
    const r = Math.floor(120 + Math.random() * 20)
    const g = Math.floor(120 + Math.random() * 20)
    ctx.fillStyle = `rgb(${r}, ${g}, 255)`
    ctx.fillRect(x, y, 2, 2)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(4, 4)
  return texture
}

function createSidewalkTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!

  // Concrete base
  ctx.fillStyle = '#8f9296'
  ctx.fillRect(0, 0, 512, 512)

  // Slab joints (grid)
  ctx.strokeStyle = '#525458'
  ctx.lineWidth = 4
  ctx.strokeRect(4, 4, 250, 250)
  ctx.strokeRect(258, 4, 250, 250)
  ctx.strokeRect(4, 258, 250, 250)
  ctx.strokeRect(258, 258, 250, 250)

  // Fine concrete grain
  for (let i = 0; i < 20000; i++) {
    const x = Math.random() * 512
    const y = Math.random() * 512
    const val = 120 + Math.floor(Math.random() * 35)
    ctx.fillStyle = `rgba(${val}, ${val}, ${val}, 0.35)`
    ctx.fillRect(x, y, 2, 2)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(2, 2)
  return texture
}

function createBuildingFacadeTexture(style: 'glass' | 'concrete' | 'brick'): {
  diffuse: THREE.CanvasTexture
  emissive: THREE.CanvasTexture
} {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 1024
  const ctx = canvas.getContext('2d')!

  const emissiveCanvas = document.createElement('canvas')
  emissiveCanvas.width = 512
  emissiveCanvas.height = 1024
  const eCtx = emissiveCanvas.getContext('2d')!

  eCtx.fillStyle = '#000000'
  eCtx.fillRect(0, 0, 512, 1024)

  if (style === 'glass') {
    // Modern glass skyscraper with mullions
    ctx.fillStyle = '#182430'
    ctx.fillRect(0, 0, 512, 1024)

    const cols = 8
    const rows = 16
    const cellW = 512 / cols
    const cellH = 1024 / rows

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Window pane
        const windowGrad = ctx.createLinearGradient(0, r * cellH, 0, (r + 1) * cellH)
        windowGrad.addColorStop(0, '#243a4e')
        windowGrad.addColorStop(1, '#111c26')
        ctx.fillStyle = windowGrad
        ctx.fillRect(c * cellW + 4, r * cellH + 4, cellW - 8, cellH - 8)

        // Random lit offices at night
        if (Math.random() > 0.45) {
          const warm = Math.random() > 0.5
          eCtx.fillStyle = warm ? 'rgb(255, 230, 160)' : 'rgb(200, 235, 255)'
          eCtx.fillRect(c * cellW + 4, r * cellH + 4, cellW - 8, cellH - 8)
        }
      }
    }
  } else if (style === 'brick') {
    // Terracotta / red brick
    ctx.fillStyle = '#6b3226'
    ctx.fillRect(0, 0, 512, 1024)

    // Windows
    const cols = 6
    const rows = 12
    const cellW = 512 / cols
    const cellH = 1024 / rows

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = '#1a1f26'
        ctx.fillRect(c * cellW + 12, r * cellH + 16, cellW - 24, cellH - 32)
        ctx.strokeStyle = '#e0dedb'
        ctx.lineWidth = 3
        ctx.strokeRect(c * cellW + 12, r * cellH + 16, cellW - 24, cellH - 32)

        if (Math.random() > 0.55) {
          eCtx.fillStyle = 'rgb(255, 220, 140)'
          eCtx.fillRect(c * cellW + 14, r * cellH + 18, cellW - 28, cellH - 36)
        }
      }
    }
  } else {
    // Precast modern concrete panels with louvers
    ctx.fillStyle = '#7a7e82'
    ctx.fillRect(0, 0, 512, 1024)

    const cols = 6
    const rows = 14
    const cellW = 512 / cols
    const cellH = 1024 / rows

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = '#202933'
        ctx.fillRect(c * cellW + 8, r * cellH + 12, cellW - 16, cellH - 24)

        if (Math.random() > 0.5) {
          eCtx.fillStyle = 'rgb(240, 245, 255)'
          eCtx.fillRect(c * cellW + 8, r * cellH + 12, cellW - 16, cellH - 24)
        }
      }
    }
  }

  const diffuse = new THREE.CanvasTexture(canvas)
  diffuse.wrapS = THREE.RepeatWrapping
  diffuse.wrapT = THREE.RepeatWrapping
  diffuse.repeat.set(1, 1)

  const emissive = new THREE.CanvasTexture(emissiveCanvas)
  emissive.wrapS = THREE.RepeatWrapping
  emissive.wrapT = THREE.RepeatWrapping
  emissive.repeat.set(1, 1)

  return { diffuse, emissive }
}

export class MaterialLibrary {
  public asphaltMaterial!: THREE.MeshStandardMaterial
  public roadMarkingWhite!: THREE.MeshStandardMaterial
  public roadMarkingYellow!: THREE.MeshStandardMaterial
  public sidewalkMaterial!: THREE.MeshStandardMaterial
  public grassMaterial!: THREE.MeshStandardMaterial
  public waterMaterial!: THREE.MeshPhysicalMaterial
  public glassSkyscraperMat!: THREE.MeshStandardMaterial
  public concreteSkyscraperMat!: THREE.MeshStandardMaterial
  public brickBuildingMat!: THREE.MeshStandardMaterial

  // Vehicle materials
  public carTireMaterial!: THREE.MeshStandardMaterial
  public carRimMaterial!: THREE.MeshStandardMaterial
  public carGlassMaterial!: THREE.MeshPhysicalMaterial
  public carChromeMaterial!: THREE.MeshStandardMaterial
  public carHeadlightGlass!: THREE.MeshStandardMaterial
  public carTaillightGlass!: THREE.MeshStandardMaterial
  public policeSirenRed!: THREE.MeshBasicMaterial
  public policeSirenBlue!: THREE.MeshBasicMaterial

  // Props
  public streetLightPoleMat!: THREE.MeshStandardMaterial
  public streetLightLampMat!: THREE.MeshBasicMaterial
  public treeBarkMat!: THREE.MeshStandardMaterial
  public treeLeavesMat!: THREE.MeshStandardMaterial

  constructor() {
    this.initMaterials()
  }

  private initMaterials() {
    // 1. Asphalt Road
    const asphaltTex = createAsphaltTexture()
    const asphaltNorm = createAsphaltNormalMap()
    this.asphaltMaterial = new THREE.MeshStandardMaterial({
      map: asphaltTex,
      normalMap: asphaltNorm,
      normalScale: new THREE.Vector2(0.5, 0.5),
      roughness: 0.85,
      metalness: 0.1,
      color: 0xffffff,
    })

    // 2. Road Markings
    this.roadMarkingWhite = new THREE.MeshStandardMaterial({
      color: 0xefeff5,
      roughness: 0.5,
      metalness: 0.05,
    })
    this.roadMarkingYellow = new THREE.MeshStandardMaterial({
      color: 0xf5b800,
      roughness: 0.5,
      metalness: 0.05,
    })

    // 3. Sidewalk
    const sidewalkTex = createSidewalkTexture()
    this.sidewalkMaterial = new THREE.MeshStandardMaterial({
      map: sidewalkTex,
      roughness: 0.8,
      metalness: 0.05,
      color: 0xcccccc,
    })

    // 4. Grass / Parks
    this.grassMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d662e,
      roughness: 0.9,
      metalness: 0.05,
    })

    // 5. Water / Canals / Ocean
    this.waterMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x083344,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.8,
      ior: 1.333,
      transparent: true,
      opacity: 0.9,
    })

    // 6. Buildings
    const glassFacade = createBuildingFacadeTexture('glass')
    this.glassSkyscraperMat = new THREE.MeshStandardMaterial({
      map: glassFacade.diffuse,
      emissiveMap: glassFacade.emissive,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.85,
      roughness: 0.2,
      metalness: 0.8,
    })

    const concreteFacade = createBuildingFacadeTexture('concrete')
    this.concreteSkyscraperMat = new THREE.MeshStandardMaterial({
      map: concreteFacade.diffuse,
      emissiveMap: concreteFacade.emissive,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.75,
      roughness: 0.7,
      metalness: 0.2,
    })

    const brickFacade = createBuildingFacadeTexture('brick')
    this.brickBuildingMat = new THREE.MeshStandardMaterial({
      map: brickFacade.diffuse,
      emissiveMap: brickFacade.emissive,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.8,
      roughness: 0.85,
      metalness: 0.05,
    })

    // 7. Vehicle Components
    this.carTireMaterial = new THREE.MeshStandardMaterial({
      color: 0x181818,
      roughness: 0.85,
      metalness: 0.1,
    })

    this.carRimMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8d8d8,
      roughness: 0.2,
      metalness: 0.9,
    })

    this.carChromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.05,
      metalness: 0.95,
    })

    this.carGlassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x111620,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.7,
      transparent: true,
      opacity: 0.85,
      ior: 1.5,
    })

    this.carHeadlightGlass = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfffae0,
      emissiveIntensity: 2.5,
      roughness: 0.1,
      metalness: 0.3,
    })

    this.carTaillightGlass = new THREE.MeshStandardMaterial({
      color: 0xbb1111,
      emissive: 0xff1111,
      emissiveIntensity: 1.0,
      roughness: 0.2,
      metalness: 0.2,
    })

    this.policeSirenRed = new THREE.MeshBasicMaterial({
      color: 0xff1010,
    })

    this.policeSirenBlue = new THREE.MeshBasicMaterial({
      color: 0x0066ff,
    })

    // 8. Street Props
    this.streetLightPoleMat = new THREE.MeshStandardMaterial({
      color: 0x2b2e33,
      roughness: 0.4,
      metalness: 0.7,
    })

    this.streetLightLampMat = new THREE.MeshBasicMaterial({
      color: 0xfff2cc,
    })

    this.treeBarkMat = new THREE.MeshStandardMaterial({
      color: 0x422e1b,
      roughness: 0.9,
      metalness: 0.05,
    })

    this.treeLeavesMat = new THREE.MeshStandardMaterial({
      color: 0x245422,
      roughness: 0.7,
      metalness: 0.05,
      side: THREE.DoubleSide,
    })
  }

  // Generate car paint material with custom color
  public createCarPaint(colorHex: number, metallic = 0.85, roughness = 0.15): THREE.MeshPhysicalMaterial {
    return new THREE.MeshPhysicalMaterial({
      color: colorHex,
      metalness: metallic,
      roughness: roughness,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      reflectivity: 0.9,
    })
  }

  // Update wetness on materials when raining
  public setWetness(isRaining: boolean) {
    const roughnessTarget = isRaining ? 0.15 : 0.85
    const metalnessTarget = isRaining ? 0.35 : 0.1
    this.asphaltMaterial.roughness = roughnessTarget
    this.asphaltMaterial.metalness = metalnessTarget
    this.sidewalkMaterial.roughness = isRaining ? 0.35 : 0.8
  }

  // Update emissive intensity of building office lights and streetlights based on time of day
  public updateTimeOfDay(hour: number) {
    // Night is between 19.5 and 5.5
    const isNight = hour >= 19.5 || hour < 5.5
    const isDuskDawn = (hour >= 18.0 && hour < 19.5) || (hour >= 5.5 && hour < 7.0)

    let nightFactor = 0.0
    if (isNight) {
      nightFactor = 1.0
    } else if (isDuskDawn) {
      nightFactor = 0.5
    }

    this.glassSkyscraperMat.emissiveIntensity = 0.15 + nightFactor * 1.8
    this.concreteSkyscraperMat.emissiveIntensity = 0.1 + nightFactor * 1.5
    this.brickBuildingMat.emissiveIntensity = 0.1 + nightFactor * 1.4

    this.streetLightLampMat.color.set(isNight || isDuskDawn ? 0xfff0c0 : 0x444444)
  }
}
