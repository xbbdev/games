import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

import { PhysicsEngine } from './Physics'
import { gameInput } from './Input'
import { gameAudio } from './Audio'
import { WeatherSystem } from './Weather'
import { MaterialLibrary } from '../world/Materials'
import { RoadNetwork } from '../world/RoadNetwork'
import { CityBuilder } from '../world/CityBuilder'
import { Player } from '../entities/Player'
import { VehicleManager } from '../entities/VehicleManager'
import { TrafficAISystem } from '../entities/TrafficAI'
import { PedestrianAISystem } from '../entities/PedestrianAI'
import { PolicePursuitSystem } from '../entities/PoliceAI'
import { MissionManager } from '../missions/MissionManager'
import { useGameStore } from '../state/gameStore'

export class GameEngine {
  public canvas: HTMLCanvasElement
  public renderer!: THREE.WebGLRenderer
  public scene!: THREE.Scene
  public camera!: THREE.PerspectiveCamera
  public composer!: EffectComposer
  public bloomPass!: UnrealBloomPass

  public physics!: PhysicsEngine
  public materials!: MaterialLibrary
  public roadNetwork!: RoadNetwork
  public cityBuilder!: CityBuilder
  public weatherSystem!: WeatherSystem
  public player!: Player
  public vehicleManager!: VehicleManager
  public trafficAI!: TrafficAISystem
  public pedestrianAI!: PedestrianAISystem
  public policeSystem!: PolicePursuitSystem
  public missionManager!: MissionManager

  private clock = new THREE.Clock()
  private isRunning = false
  private animationFrameId: number | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  public async init() {
    // 1. Three.js Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    // 2. Scene & Camera
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 1000)

    // 3. Post-Processing Pipeline
    const renderPass = new RenderPass(this.scene, this.camera)
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.45, // strength
      0.4, // radius
      0.85 // threshold
    )
    const outputPass = new OutputPass()

    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(renderPass)
    this.composer.addPass(this.bloomPass)
    this.composer.addPass(outputPass)

    // 4. Physics Engine
    this.physics = await PhysicsEngine.getInstance()

    // 5. Materials Library
    this.materials = new MaterialLibrary()

    // 6. Road Network & Waypoint Paths
    this.roadNetwork = new RoadNetwork()

    // 7. City 3D World Generation
    this.cityBuilder = new CityBuilder(this.scene, this.materials, this.roadNetwork, this.physics)
    this.cityBuilder.build()

    // 8. Dynamic Weather & Lighting
    this.weatherSystem = new WeatherSystem(this.scene, this.materials)

    // 9. Playable Human Character
    this.player = new Player(this.scene, this.physics, gameInput, this.camera, 0, 8)

    // 10. Vehicle System
    this.vehicleManager = new VehicleManager(this.scene, this.materials, this.physics, gameInput)

    // 11. Living City AI
    this.trafficAI = new TrafficAISystem(this.scene, this.materials, this.roadNetwork, this.physics)
    this.pedestrianAI = new PedestrianAISystem(this.scene, this.roadNetwork)
    this.policeSystem = new PolicePursuitSystem(this.scene, this.vehicleManager)

    // 12. Missions
    this.missionManager = new MissionManager(this.scene)

    // Attach input to canvas
    gameInput.attachToElement(this.canvas)

    // Resize listener
    window.addEventListener('resize', this.onWindowResize.bind(this))

    // Start auto loop
    this.isRunning = true
    this.clock.start()
    this.animate()
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.composer.setSize(window.innerWidth, window.innerHeight)
  }

  private animate() {
    if (!this.isRunning) return
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this))

    const deltaTime = Math.min(this.clock.getDelta(), 0.05)
    const isPaused = useGameStore.getState().isPaused

    if (!isPaused) {
      // Step Physics Simulation
      this.physics.step(deltaTime)

      // Update Road Network & Traffic Signals
      this.roadNetwork.update(deltaTime)
      this.cityBuilder.update(deltaTime, this.weatherSystem.timeOfDay)

      // Current player position (on foot or vehicle)
      const currentPos = this.vehicleManager.activeVehicle
        ? this.vehicleManager.activeVehicle.position
        : this.player.position

      const currentVelocity = this.vehicleManager.activeVehicle
        ? this.vehicleManager.activeVehicle.velocity
        : this.player.velocity

      // Update Weather & Sun
      this.weatherSystem.update(deltaTime, currentPos)

      // Update Player & Vehicles
      this.player.update(deltaTime)
      this.vehicleManager.update(deltaTime, this.player)

      // Update AI Systems
      this.trafficAI.update(deltaTime, currentPos)
      this.pedestrianAI.update(deltaTime, currentPos, currentVelocity)
      this.policeSystem.update(deltaTime, currentPos)

      // Update Missions
      this.missionManager.update(deltaTime, currentPos)

      // Synchronize Time with Zustand
      useGameStore.setState({ timeOfDay: this.weatherSystem.timeOfDay })
    }

    // Reset frame inputs
    gameInput.update()

    // Render Scene with Post-Processing
    const quality = useGameStore.getState().graphicsQuality
    if (quality === 'low') {
      this.renderer.render(this.scene, this.camera)
    } else {
      this.composer.render()
    }
  }

  public setWeather(weather: 'clear' | 'sunset' | 'night' | 'rain') {
    this.weatherSystem.setWeather(weather)
  }

  public setTimeOfDay(hour: number) {
    this.weatherSystem.timeOfDay = hour
  }

  public setQuality(quality: 'low' | 'medium' | 'high' | 'ultra') {
    if (quality === 'ultra') {
      this.bloomPass.strength = 0.55
      this.renderer.shadowMap.enabled = true
    } else if (quality === 'high') {
      this.bloomPass.strength = 0.4
      this.renderer.shadowMap.enabled = true
    } else if (quality === 'medium') {
      this.bloomPass.strength = 0.2
      this.renderer.shadowMap.enabled = true
    } else {
      this.renderer.shadowMap.enabled = false
    }
  }

  public destroy() {
    this.isRunning = false
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }
    window.removeEventListener('resize', this.onWindowResize.bind(this))
    this.renderer.dispose()
    gameAudio.cleanup()
  }
}
