import * as THREE from 'three'
import { MaterialLibrary } from '../world/Materials'
import { gameAudio } from './Audio'
import type { WeatherType } from '../state/gameStore'

export class WeatherSystem {
  public scene: THREE.Scene
  public materials: MaterialLibrary

  // Lighting
  public sunLight: THREE.DirectionalLight
  public ambientLight: THREE.AmbientLight
  public hemiLight: THREE.HemisphereLight

  // Sky dome & celestial bodies
  public skyMesh: THREE.Mesh
  public sunMesh: THREE.Mesh
  public moonMesh: THREE.Mesh
  public cloudGroup = new THREE.Group()

  // Rain particle system
  public rainParticles: THREE.Points | null = null
  public rainGeometry: THREE.BufferGeometry | null = null
  public isRaining = false
  public rainCount = 4000

  // Lightning
  public lightningLight: THREE.PointLight
  public lightningTimer = 0

  // State
  public timeOfDay = 14.5 // 2:30 PM
  public timeScale = 0.04 // 1 game hour every ~25 real seconds (adjustable)
  public currentWeather: WeatherType = 'clear'

  constructor(scene: THREE.Scene, materials: MaterialLibrary) {
    this.scene = scene
    this.materials = materials

    // 1. Directional Sun/Moon light with soft shadows
    this.sunLight = new THREE.DirectionalLight(0xfff5e6, 2.8)
    this.sunLight.castShadow = true
    this.sunLight.shadow.mapSize.width = 2048
    this.sunLight.shadow.mapSize.height = 2048
    this.sunLight.shadow.camera.near = 0.5
    this.sunLight.shadow.camera.far = 400
    const d = 120
    this.sunLight.shadow.camera.left = -d
    this.sunLight.shadow.camera.right = d
    this.sunLight.shadow.camera.top = d
    this.sunLight.shadow.camera.bottom = -d
    this.sunLight.shadow.bias = -0.0005
    this.sunLight.shadow.normalBias = 0.02
    this.scene.add(this.sunLight)

    // 2. Ambient & Hemisphere Light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    this.scene.add(this.ambientLight)

    this.hemiLight = new THREE.HemisphereLight(0x7090b0, 0x303030, 0.5)
    this.scene.add(this.hemiLight)

    // 3. Sky Dome with atmospheric gradient shader
    const skyGeo = new THREE.SphereGeometry(600, 32, 16)
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x0077ff) },
        bottomColor: { value: new THREE.Color(0xffffff) },
        offset: { value: 33 },
        exponent: { value: 0.6 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide,
    })
    this.skyMesh = new THREE.Mesh(skyGeo, skyMat)
    this.scene.add(this.skyMesh)

    // Sun & Moon Visual Discs
    const sunGeo = new THREE.SphereGeometry(15, 16, 16)
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfffae0 })
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat)
    this.scene.add(this.sunMesh)

    const moonGeo = new THREE.SphereGeometry(10, 16, 16)
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xe6e6fa })
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat)
    this.scene.add(this.moonMesh)

    // 4. Moving Cloud Layer
    this.buildClouds()
    this.scene.add(this.cloudGroup)

    // 5. Rain Particle System
    this.buildRain()

    // 6. Lightning Flash
    this.lightningLight = new THREE.PointLight(0xaaccff, 0.0, 500)
    this.lightningLight.position.set(0, 150, 0)
    this.scene.add(this.lightningLight)

    // Set initial sky colors
    this.updateAtmosphere(this.timeOfDay)
  }

  private buildClouds() {
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 1.0,
      metalness: 0.0,
      transparent: true,
      opacity: 0.65,
    })

    for (let i = 0; i < 25; i++) {
      const cloud = new THREE.Group()
      const puffs = 4 + Math.floor(Math.random() * 5)
      for (let p = 0; p < puffs; p++) {
        const puffGeo = new THREE.SphereGeometry(18 + Math.random() * 14, 8, 8)
        const puff = new THREE.Mesh(puffGeo, cloudMat)
        puff.position.set(
          (p - puffs / 2) * 16 + (Math.random() * 8 - 4),
          Math.random() * 4 - 2,
          Math.random() * 10 - 5
        )
        cloud.add(puff)
      }
      cloud.position.set(
        Math.random() * 800 - 400,
        140 + Math.random() * 30,
        Math.random() * 800 - 400
      )
      this.cloudGroup.add(cloud)
    }
  }

  private buildRain() {
    this.rainGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array(this.rainCount * 3)
    const velocities = new Float32Array(this.rainCount)

    for (let i = 0; i < this.rainCount; i++) {
      positions[i * 3 + 0] = Math.random() * 200 - 100
      positions[i * 3 + 1] = Math.random() * 60
      positions[i * 3 + 2] = Math.random() * 200 - 100
      velocities[i] = 35 + Math.random() * 20
    }

    this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const rainMat = new THREE.PointsMaterial({
      color: 0x99bbdd,
      size: 0.6,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    })

    this.rainParticles = new THREE.Points(this.rainGeometry, rainMat)
    this.rainParticles.visible = false
    this.scene.add(this.rainParticles)
  }

  public setWeather(weather: WeatherType) {
    this.currentWeather = weather
    const isRaining = weather === 'rain'
    this.isRaining = isRaining
    if (this.rainParticles) {
      this.rainParticles.visible = isRaining
    }
    this.materials.setWetness(isRaining)
    gameAudio.setRain(isRaining)

    if (weather === 'sunset') {
      this.timeOfDay = 18.2
    } else if (weather === 'night') {
      this.timeOfDay = 0.5
    } else if (weather === 'clear') {
      this.timeOfDay = 13.5
    }
  }

  public update(deltaTime: number, playerPos: THREE.Vector3) {
    // Progress time smoothly
    this.timeOfDay = (this.timeOfDay + deltaTime * this.timeScale) % 24
    this.updateAtmosphere(this.timeOfDay)

    // Follow player with sunlight target
    this.sunLight.target.position.copy(playerPos)
    this.sunLight.target.updateMatrixWorld()

    // Move clouds slowly with wind
    for (const cloud of this.cloudGroup.children) {
      cloud.position.x += deltaTime * 4.0
      if (cloud.position.x > 450) cloud.position.x = -450
    }

    // Update Rain particles centered around player
    if (this.isRaining && this.rainParticles && this.rainGeometry) {
      const posAttr = this.rainGeometry.attributes.position as THREE.BufferAttribute
      const positions = posAttr.array as Float32Array

      for (let i = 0; i < this.rainCount; i++) {
        positions[i * 3 + 1] -= deltaTime * 45 // Fall fast
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3 + 0] = playerPos.x + (Math.random() * 160 - 80)
          positions[i * 3 + 1] = 50 + Math.random() * 10
          positions[i * 3 + 2] = playerPos.z + (Math.random() * 160 - 80)
        }
      }
      posAttr.needsUpdate = true

      // Random lightning flash
      this.lightningTimer -= deltaTime
      if (this.lightningTimer <= 0) {
        if (Math.random() < 0.05) {
          this.triggerLightning()
        }
      }
    }

    // Fade lightning
    if (this.lightningLight.intensity > 0) {
      this.lightningLight.intensity = Math.max(0, this.lightningLight.intensity - deltaTime * 12)
    }
  }

  private triggerLightning() {
    this.lightningLight.intensity = 4.5
    this.lightningTimer = 4 + Math.random() * 6
    // Thunder rumble sound
    gameAudio.playCrash(0.8)
  }

  private updateAtmosphere(hour: number) {
    const sunAngle = ((hour - 6) / 24) * Math.PI * 2
    const sunDist = 350

    const sunX = Math.cos(sunAngle) * sunDist
    const sunY = Math.sin(sunAngle) * sunDist
    const sunZ = Math.sin(sunAngle * 0.5) * 80

    this.sunLight.position.set(sunX, Math.max(sunY, -20), sunZ)
    this.sunMesh.position.set(sunX, sunY, sunZ)
    this.moonMesh.position.set(-sunX, -sunY, -sunZ)

    // Notify materials of hour
    this.materials.updateTimeOfDay(hour)

    const skyShader = this.skyMesh.material as THREE.ShaderMaterial

    if (hour >= 5.5 && hour < 7.5) {
      // SUNRISE: Golden Orange / Rose
      const t = (hour - 5.5) / 2.0
      skyShader.uniforms.topColor.value.setRGB(0.15 + t * 0.1, 0.2 + t * 0.3, 0.45 + t * 0.3)
      skyShader.uniforms.bottomColor.value.setRGB(0.95, 0.5 + t * 0.2, 0.25)
      this.sunLight.color.setRGB(1.0, 0.7, 0.4)
      this.sunLight.intensity = 1.8 * t
      this.ambientLight.intensity = 0.3 + 0.2 * t
      this.scene.fog = new THREE.FogExp2(0x9a7b66, 0.003)
    } else if (hour >= 7.5 && hour < 17.5) {
      // CRISP DAYLIGHT
      skyShader.uniforms.topColor.value.setRGB(0.12, 0.48, 0.88)
      skyShader.uniforms.bottomColor.value.setRGB(0.85, 0.92, 0.98)
      this.sunLight.color.setRGB(1.0, 0.98, 0.92)
      this.sunLight.intensity = 2.6
      this.ambientLight.color.setRGB(0.9, 0.95, 1.0)
      this.ambientLight.intensity = 0.55
      this.hemiLight.intensity = 0.55
      this.scene.fog = new THREE.FogExp2(0x8faec7, 0.0018)
    } else if (hour >= 17.5 && hour < 19.5) {
      // SUNSET (Iconic GTA golden hour / purple sky)
      const t = (hour - 17.5) / 2.0
      skyShader.uniforms.topColor.value.setRGB(0.35 - t * 0.25, 0.15 - t * 0.1, 0.5 - t * 0.3)
      skyShader.uniforms.bottomColor.value.setRGB(0.98 - t * 0.5, 0.45 - t * 0.3, 0.15)
      this.sunLight.color.setRGB(1.0, 0.45, 0.15)
      this.sunLight.intensity = 2.0 * (1 - t)
      this.ambientLight.color.setRGB(0.65, 0.45, 0.4)
      this.ambientLight.intensity = 0.4 - t * 0.15
      this.scene.fog = new THREE.FogExp2(0x5a3848, 0.0028)
    } else {
      // NIGHT: Deep Navy / Moonlight
      skyShader.uniforms.topColor.value.setRGB(0.01, 0.02, 0.06)
      skyShader.uniforms.bottomColor.value.setRGB(0.04, 0.06, 0.12)
      this.sunLight.color.setRGB(0.4, 0.5, 0.8) // Moon tint
      this.sunLight.intensity = 0.45
      this.ambientLight.color.setRGB(0.2, 0.25, 0.4)
      this.ambientLight.intensity = 0.25
      this.hemiLight.intensity = 0.25
      this.scene.fog = new THREE.FogExp2(0x060810, 0.0035)
    }

    if (this.isRaining) {
      skyShader.uniforms.topColor.value.setRGB(0.1, 0.12, 0.16)
      skyShader.uniforms.bottomColor.value.setRGB(0.2, 0.22, 0.25)
      this.sunLight.intensity = 0.8
      this.ambientLight.intensity = 0.3
      this.scene.fog = new THREE.FogExp2(0x1a202c, 0.005)
    }
  }
}
