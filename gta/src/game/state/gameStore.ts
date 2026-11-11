import { create } from 'zustand'

export interface Mission {
  id: string
  title: string
  client: string
  description: string
  reward: number
  targetX: number
  targetZ: number
  targetRadius: number
  timeLimit?: number // seconds, optional
  type: 'delivery' | 'race' | 'evasion' | 'checkpoint'
  completed: boolean
}

export type WeatherType = 'clear' | 'sunset' | 'night' | 'rain'

interface GameState {
  // Player status
  health: number
  maxHealth: number
  armor: number
  stamina: number
  money: number
  wantedLevel: number
  wantedFlashing: boolean
  
  // Vehicle status
  inVehicle: boolean
  vehicleName: string
  vehicleSpeed: number // in km/h
  vehicleRpm: number // 0.0 - 1.0
  vehicleGear: string
  vehicleHealth: number
  headlightsOn: boolean
  sirenOn: boolean

  // Interaction prompts
  interactionPrompt: string | null

  // Missions
  activeMission: Mission | null
  missionsCompleted: string[]
  missionTimeRemaining: number | null
  missionSuccessBanner: string | null
  missionFailedBanner: string | null

  // Environment & Settings
  timeOfDay: number // 0 - 24
  weather: WeatherType
  isPaused: boolean
  radioStation: number // 0=off, 1=Synthwave, 2=HipHop, 3=Electro
  radioStationName: string
  soundVolume: number
  musicVolume: number
  graphicsQuality: 'low' | 'medium' | 'high' | 'ultra'
  showControlsModal: boolean
  activeMenuTab: 'resume' | 'map' | 'missions' | 'settings' | 'controls'

  // Actions
  setHealth: (health: number) => void
  takeDamage: (amount: number) => void
  setArmor: (armor: number) => void
  setStamina: (stamina: number) => void
  addMoney: (amount: number) => void
  setWantedLevel: (level: number) => void
  setInVehicle: (inVehicle: boolean, vehicleName?: string) => void
  setVehicleTelemetry: (speed: number, rpm: number, gear: string, health: number) => void
  setHeadlights: (on: boolean) => void
  setSiren: (on: boolean) => void
  setInteractionPrompt: (prompt: string | null) => void
  startMission: (mission: Mission) => void
  completeMission: (missionId: string) => void
  failMission: (reason: string) => void
  clearMissionBanner: () => void
  setTimeOfDay: (time: number) => void
  setWeather: (weather: WeatherType) => void
  setPaused: (paused: boolean) => void
  setRadioStation: (station: number) => void
  cycleRadioStation: () => void
  setGraphicsQuality: (quality: 'low' | 'medium' | 'high' | 'ultra') => void
  setVolumes: (sound: number, music: number) => void
  setActiveMenuTab: (tab: 'resume' | 'map' | 'missions' | 'settings' | 'controls') => void
  toggleControlsModal: () => void
  resetPlayer: () => void
}

const RADIO_STATIONS = [
  'RADIO OFF',
  'FLASH FM 98.2 (SYNTH)',
  'LOS SANTOS WEST (HIP HOP)',
  'ELECTRO SHOCK 104.5',
]

export const useGameStore = create<GameState>((set, get) => ({
  health: 100,
  maxHealth: 100,
  armor: 75,
  stamina: 100,
  money: 5240,
  wantedLevel: 0,
  wantedFlashing: false,

  inVehicle: false,
  vehicleName: 'Pegassi Tempesta',
  vehicleSpeed: 0,
  vehicleRpm: 0,
  vehicleGear: 'N',
  vehicleHealth: 100,
  headlightsOn: true,
  sirenOn: false,

  interactionPrompt: null,

  activeMission: null,
  missionsCompleted: [],
  missionTimeRemaining: null,
  missionSuccessBanner: null,
  missionFailedBanner: null,

  timeOfDay: 14.5, // 2:30 PM sunny afternoon
  weather: 'clear',
  isPaused: false,
  radioStation: 1,
  radioStationName: RADIO_STATIONS[1],
  soundVolume: 80,
  musicVolume: 65,
  graphicsQuality: 'high',
  showControlsModal: false,
  activeMenuTab: 'resume',

  setHealth: (health) => set({ health: Math.max(0, Math.min(100, health)) }),
  takeDamage: (amount) => {
    const { health, armor } = get()
    let remainingDamage = amount
    let newArmor = armor
    if (newArmor > 0) {
      if (newArmor >= remainingDamage) {
        newArmor -= remainingDamage
        remainingDamage = 0
      } else {
        remainingDamage -= newArmor
        newArmor = 0
      }
    }
    const newHealth = Math.max(0, health - remainingDamage)
    set({ health: newHealth, armor: newArmor })
  },
  setArmor: (armor) => set({ armor: Math.max(0, Math.min(100, armor)) }),
  setStamina: (stamina) => set({ stamina: Math.max(0, Math.min(100, stamina)) }),
  addMoney: (amount) => set((s) => ({ money: Math.max(0, s.money + amount) })),
  setWantedLevel: (level) => {
    const clamped = Math.max(0, Math.min(5, Math.floor(level)))
    set({ wantedLevel: clamped, wantedFlashing: clamped > 0 })
  },
  setInVehicle: (inVehicle, vehicleName) =>
    set({
      inVehicle,
      vehicleName: vehicleName || (inVehicle ? 'Vehicle' : ''),
      interactionPrompt: null,
    }),
  setVehicleTelemetry: (speed, rpm, gear, health) =>
    set({
      vehicleSpeed: Math.round(speed),
      vehicleRpm: Math.max(0, Math.min(1, rpm)),
      vehicleGear: gear,
      vehicleHealth: Math.max(0, Math.min(100, health)),
    }),
  setHeadlights: (on) => set({ headlightsOn: on }),
  setSiren: (on) => set({ sirenOn: on }),
  setInteractionPrompt: (prompt) => set({ interactionPrompt: prompt }),

  startMission: (mission) =>
    set({
      activeMission: mission,
      missionTimeRemaining: mission.timeLimit || null,
      missionSuccessBanner: null,
      missionFailedBanner: null,
    }),

  completeMission: (missionId) => {
    const { activeMission, missionsCompleted, addMoney } = get()
    if (activeMission && activeMission.id === missionId) {
      addMoney(activeMission.reward)
      set({
        activeMission: null,
        missionTimeRemaining: null,
        missionsCompleted: [...missionsCompleted, missionId],
        missionSuccessBanner: `MISSION PASSED! +$${activeMission.reward.toLocaleString()}`,
      })
      setTimeout(() => {
        set({ missionSuccessBanner: null })
      }, 5000)
    }
  },

  failMission: (reason) => {
    set({
      activeMission: null,
      missionTimeRemaining: null,
      missionFailedBanner: `MISSION FAILED: ${reason.toUpperCase()}`,
    })
    setTimeout(() => {
      set({ missionFailedBanner: null })
    }, 4500)
  },

  clearMissionBanner: () =>
    set({ missionSuccessBanner: null, missionFailedBanner: null }),

  setTimeOfDay: (time) => set({ timeOfDay: (time + 24) % 24 }),
  setWeather: (weather) => set({ weather }),
  setPaused: (paused) => set({ isPaused: paused }),
  setRadioStation: (station) => {
    const idx = (station + RADIO_STATIONS.length) % RADIO_STATIONS.length
    set({ radioStation: idx, radioStationName: RADIO_STATIONS[idx] })
  },
  cycleRadioStation: () => {
    const next = (get().radioStation + 1) % RADIO_STATIONS.length
    set({ radioStation: next, radioStationName: RADIO_STATIONS[next] })
  },
  setGraphicsQuality: (graphicsQuality) => set({ graphicsQuality }),
  setVolumes: (soundVolume, musicVolume) => set({ soundVolume, musicVolume }),
  setActiveMenuTab: (activeMenuTab) => set({ activeMenuTab }),
  toggleControlsModal: () =>
    set((s) => ({ showControlsModal: !s.showControlsModal })),
  resetPlayer: () =>
    set({
      health: 100,
      armor: 50,
      stamina: 100,
      wantedLevel: 0,
      inVehicle: false,
    }),
}))
