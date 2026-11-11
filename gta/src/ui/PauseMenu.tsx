import React from 'react'
import { useGameStore } from '../game/state/gameStore'
import { GameEngine } from '../game/core/Engine'
import { GAME_MISSIONS } from '../game/missions/MissionsData'
import { gameAudio } from '../game/core/Audio'
import {
  Play,
  Map as MapIcon,
  Crosshair,
  Settings,
  HelpCircle,
  Sun,
  CloudRain,
  Volume2,
  Radio,
  Sliders,
  X,
} from 'lucide-react'

interface PauseMenuProps {
  engine: GameEngine | null
}

export const PauseMenu: React.FC<PauseMenuProps> = ({ engine }) => {
  const isPaused = useGameStore((s) => s.isPaused)
  const activeTab = useGameStore((s) => s.activeMenuTab)
  const setPaused = useGameStore((s) => s.setPaused)
  const setActiveTab = useGameStore((s) => s.setActiveMenuTab)

  const timeOfDay = useGameStore((s) => s.timeOfDay)
  const setTimeOfDay = useGameStore((s) => s.setTimeOfDay)
  const weather = useGameStore((s) => s.weather)
  const setWeather = useGameStore((s) => s.setWeather)
  const graphicsQuality = useGameStore((s) => s.graphicsQuality)
  const setGraphicsQuality = useGameStore((s) => s.setGraphicsQuality)
  const soundVolume = useGameStore((s) => s.soundVolume)
  const musicVolume = useGameStore((s) => s.musicVolume)
  const setVolumes = useGameStore((s) => s.setVolumes)
  const missionsCompleted = useGameStore((s) => s.missionsCompleted)

  if (!isPaused) return null

  const handleResume = () => {
    setPaused(false)
  }

  const handleWeatherChange = (w: 'clear' | 'sunset' | 'night' | 'rain') => {
    setWeather(w)
    if (engine) engine.setWeather(w)
  }

  const handleTimeChange = (hour: number) => {
    setTimeOfDay(hour)
    if (engine) engine.setTimeOfDay(hour)
  }

  const handleQualityChange = (q: 'low' | 'medium' | 'high' | 'ultra') => {
    setGraphicsQuality(q)
    if (engine) engine.setQuality(q)
  }

  const handleVolumeChange = (sfx: number, music: number) => {
    setVolumes(sfx, music)
    gameAudio.setVolumes(sfx, music)
  }

  const handleStartMission = (id: string) => {
    if (engine) {
      engine.missionManager.startMission(id)
    }
    setPaused(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex flex-col justify-between p-6 select-none animate-fadeIn">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-amber-500 rounded font-black italic text-black tracking-widest text-lg">
            GTA WEB
          </div>
          <span className="text-slate-400 font-bold tracking-widest uppercase text-sm">
            PAUSE MENU
          </span>
        </div>

        <button
          onClick={handleResume}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition font-bold text-sm cursor-pointer"
        >
          <X size={18} />
          RESUME [ESC]
        </button>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex justify-center gap-3 my-4">
        {[
          { id: 'resume', label: 'GAME', icon: Play },
          { id: 'map', label: 'CITY MAP', icon: MapIcon },
          { id: 'missions', label: 'MISSIONS', icon: Crosshair },
          { id: 'settings', label: 'SETTINGS', icon: Settings },
          { id: 'controls', label: 'CONTROLS', icon: HelpCircle },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'resume') handleResume()
                else setActiveTab(tab.id as unknown as typeof activeTab)
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black tracking-wider text-xs transition cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 flex items-center justify-center overflow-y-auto px-4 py-2">
        {/* MAP TAB */}
        {activeTab === 'map' && (
          <div className="max-w-2xl w-full bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-2xl flex flex-col items-center">
            <h2 className="text-xl font-black text-amber-400 tracking-wider mb-2 uppercase">
              SAN ANDREAS CITY OVERVIEW
            </h2>
            <p className="text-xs text-slate-400 mb-6 text-center max-w-md">
              Explore the sprawling open-world metropolis featuring Downtown skyscrapers, Commercial shopping avenues, Industrial docklands, and Residential suburbs.
            </p>

            <div className="grid grid-cols-2 gap-4 w-full text-xs">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-amber-400 font-bold block mb-1">DOWNTOWN [Center]</span>
                <span className="text-slate-300">Skyscrapers, corporate headquarters, high-speed avenues.</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-blue-400 font-bold block mb-1">INDUSTRIAL DOCKS [South]</span>
                <span className="text-slate-300">Warehouses, shipping containers, cargo loading yards.</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-emerald-400 font-bold block mb-1">GAS STATION & COMMERCIAL [West]</span>
                <span className="text-slate-300">Refueling canopy, convenience mart, neon retail storefronts.</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-rose-400 font-bold block mb-1">RESIDENTIAL SUBURB [East]</span>
                <span className="text-slate-300">Townhouses, driveways, landscaped palm trees.</span>
              </div>
            </div>
          </div>
        )}

        {/* MISSIONS TAB */}
        {activeTab === 'missions' && (
          <div className="max-w-3xl w-full flex flex-col gap-3">
            <h2 className="text-xl font-black text-amber-400 tracking-wider mb-2 uppercase text-center">
              AVAILABLE CONTRACTS & MISSIONS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {GAME_MISSIONS.map((m) => {
                const isCompleted = missionsCompleted.includes(m.id)
                return (
                  <div
                    key={m.id}
                    className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-black text-white">{m.title}</span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          +${m.reward.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-2">
                        CLIENT: {m.client}
                      </span>
                      <p className="text-xs text-slate-300 mb-4">{m.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold">
                        {m.timeLimit ? `TIME LIMIT: ${m.timeLimit}s` : 'FREE ROAM'}
                      </span>
                      <button
                        onClick={() => handleStartMission(m.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wider transition cursor-pointer ${
                          isCompleted
                            ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            : 'bg-amber-500 hover:bg-amber-400 text-black shadow-md'
                        }`}
                      >
                        {isCompleted ? 'REPLAY MISSION' : 'START MISSION'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl w-full bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-2xl flex flex-col gap-6">
            <h2 className="text-lg font-black text-amber-400 tracking-wider uppercase">
              GRAPHICS & ENVIRONMENT SETTINGS
            </h2>

            {/* Time of Day Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Sun size={15} className="text-amber-400" /> TIME OF DAY
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {Math.floor(timeOfDay)}:
                  {Math.floor((timeOfDay % 1) * 60)
                    .toString()
                    .padStart(2, '0')}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="24"
                step="0.25"
                value={timeOfDay}
                onChange={(e) => handleTimeChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Weather Presets */}
            <div>
              <span className="text-xs font-bold text-slate-300 block mb-2 flex items-center gap-2">
                <CloudRain size={15} className="text-sky-400" /> WEATHER PRESET
              </span>
              <div className="grid grid-cols-4 gap-2">
                {(['clear', 'sunset', 'night', 'rain'] as const).map((w) => (
                  <button
                    key={w}
                    onClick={() => handleWeatherChange(w)}
                    className={`py-2 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
                      weather === w
                        ? 'bg-sky-500 text-white shadow-md'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Graphics Preset */}
            <div>
              <span className="text-xs font-bold text-slate-300 block mb-2 flex items-center gap-2">
                <Sliders size={15} className="text-purple-400" /> GRAPHICS PRESET
              </span>
              <div className="grid grid-cols-4 gap-2">
                {(['low', 'medium', 'high', 'ultra'] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => handleQualityChange(q)}
                    className={`py-2 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
                      graphicsQuality === q
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Volumes */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Volume2 size={14} /> SFX VOLUME
                  </span>
                  <span className="text-xs font-mono text-slate-400">{soundVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={soundVolume}
                  onChange={(e) => handleVolumeChange(parseInt(e.target.value), musicVolume)}
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Radio size={14} /> MUSIC / RADIO
                  </span>
                  <span className="text-xs font-mono text-slate-400">{musicVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={musicVolume}
                  onChange={(e) => handleVolumeChange(soundVolume, parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* CONTROLS TAB */}
        {activeTab === 'controls' && (
          <div className="max-w-2xl w-full bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-2xl">
            <h2 className="text-lg font-black text-amber-400 tracking-wider uppercase mb-4 text-center">
              KEYBOARD & MOUSE CONTROLS
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex justify-between p-2.5 bg-slate-900 rounded-lg">
                <span className="text-slate-400">Move On Foot / Steer Car</span>
                <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">W A S D</span>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-900 rounded-lg">
                <span className="text-slate-400">Camera Rotation</span>
                <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">MOUSE MOVE</span>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-900 rounded-lg">
                <span className="text-slate-400">Enter Vehicle / Interact</span>
                <span className="font-mono font-bold text-amber-400 bg-slate-800 px-2 py-0.5 rounded">E</span>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-900 rounded-lg">
                <span className="text-slate-400">Exit Vehicle</span>
                <span className="font-mono font-bold text-amber-400 bg-slate-800 px-2 py-0.5 rounded">F</span>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-900 rounded-lg">
                <span className="text-slate-400">Jump / Handbrake Drift</span>
                <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">SPACE</span>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-900 rounded-lg">
                <span className="text-slate-400">Sprint / Accelerate Boost</span>
                <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">SHIFT</span>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-900 rounded-lg">
                <span className="text-slate-400">Crouch / Stealth</span>
                <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">C</span>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-900 rounded-lg">
                <span className="text-slate-400">Honk Horn</span>
                <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">H</span>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-900 rounded-lg">
                <span className="text-slate-400">Cycle Radio Station</span>
                <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">Q</span>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-900 rounded-lg">
                <span className="text-slate-400">Pause Menu</span>
                <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">ESC / P</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center text-[10px] text-slate-500 font-mono tracking-wider pt-2 border-t border-slate-900">
        GTA WEB OPEN WORLD 3D ENGINE • POWERED BY THREE.JS & RAPIER PHYSICS • 60 FPS
      </div>
    </div>
  )
}
