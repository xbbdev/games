import * as THREE from 'three'
import confetti from 'canvas-confetti'
import { GAME_MISSIONS } from './MissionsData'
import { type Mission, useGameStore } from '../state/gameStore'
import { gameAudio } from '../core/Audio'

export class MissionManager {
  public scene: THREE.Scene
  public markerMesh: THREE.Group
  private beaconPillar: THREE.Mesh
  private beaconRing: THREE.Mesh

  constructor(scene: THREE.Scene) {
    this.scene = scene

    // Build 3D glowing waypoint marker beacon
    this.markerMesh = new THREE.Group()

    // Vertical light cylinder
    const pillarGeo = new THREE.CylinderGeometry(1.2, 1.2, 40, 16, 1, true)
    const pillarMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    })
    this.beaconPillar = new THREE.Mesh(pillarGeo, pillarMat)
    this.beaconPillar.position.y = 20
    this.markerMesh.add(this.beaconPillar)

    // Ground target ring
    const ringGeo = new THREE.RingGeometry(3.5, 4.0, 32)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      side: THREE.DoubleSide,
    })
    this.beaconRing = new THREE.Mesh(ringGeo, ringMat)
    this.beaconRing.rotation.x = -Math.PI / 2
    this.beaconRing.position.y = 0.15
    this.markerMesh.add(this.beaconRing)

    this.scene.add(this.markerMesh)
    this.markerMesh.visible = false

    this.loadSavedProgress()
  }

  private loadSavedProgress() {
    try {
      const saved = localStorage.getItem('gta_progress')
      if (saved) {
        const data = JSON.parse(saved)
        if (data.money) useGameStore.setState({ money: data.money })
        if (data.missionsCompleted) useGameStore.setState({ missionsCompleted: data.missionsCompleted })
      }
    } catch (e) {
      console.warn('Failed to load saved progress:', e)
    }
  }

  public saveProgress() {
    try {
      const state = useGameStore.getState()
      const data = {
        money: state.money,
        missionsCompleted: state.missionsCompleted,
      }
      localStorage.setItem('gta_progress', JSON.stringify(data))
    } catch (e) {
      console.warn('Failed to save progress:', e)
    }
  }

  public startMission(missionId: string) {
    const mission = GAME_MISSIONS.find((m) => m.id === missionId)
    if (!mission) return

    useGameStore.getState().startMission(mission)
    this.markerMesh.position.set(mission.targetX, 0, mission.targetZ)
    this.markerMesh.visible = true

    if (mission.type === 'evasion') {
      useGameStore.getState().setWantedLevel(2)
    }
  }

  public update(deltaTime: number, playerPos: THREE.Vector3) {
    const activeMission = useGameStore.getState().activeMission
    if (!activeMission) {
      this.markerMesh.visible = false
      return
    }

    this.markerMesh.visible = true
    this.markerMesh.position.set(activeMission.targetX, 0, activeMission.targetZ)

    // Pulse marker beacon ring & pillar rotation
    this.beaconPillar.rotation.y += deltaTime * 1.5
    const pulse = 1.0 + Math.sin(Date.now() * 0.005) * 0.15
    this.beaconRing.scale.set(pulse, pulse, pulse)

    // Distance to target
    const targetPos = new THREE.Vector2(activeMission.targetX, activeMission.targetZ)
    const currentPos = new THREE.Vector2(playerPos.x, playerPos.z)
    const distance = targetPos.distanceTo(currentPos)

    // Check timer countdown
    const timeRemaining = useGameStore.getState().missionTimeRemaining
    if (timeRemaining !== null) {
      const nextTime = timeRemaining - deltaTime
      if (nextTime <= 0) {
        useGameStore.getState().failMission('TIME RAN OUT!')
        this.markerMesh.visible = false
        return
      } else {
        useGameStore.setState({ missionTimeRemaining: Math.max(0, nextTime) })
      }
    }

    // Check completion condition
    if (distance <= activeMission.targetRadius) {
      this.completeActiveMission(activeMission)
    }
  }

  private completeActiveMission(mission: Mission) {
    useGameStore.getState().completeMission(mission.id)
    gameAudio.playMissionSuccess()
    this.markerMesh.visible = false
    this.saveProgress()

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      })
    } catch {
      // fallback
    }
  }
}
