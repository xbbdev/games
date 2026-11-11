import React from 'react'
import { useGameStore } from '../game/state/gameStore'
import { Minimap } from './Minimap'
import { Speedometer } from './Speedometer'
import { MissionBanner } from './MissionBanner'
import { GameEngine } from '../game/core/Engine'
import { Star, Radio, Pause } from 'lucide-react'

interface HUDProps {
  engine: GameEngine | null
}

export const HUD: React.FC<HUDProps> = ({ engine }) => {
  const money = useGameStore((s) => s.money)
  const wantedLevel = useGameStore((s) => s.wantedLevel)
  const wantedFlashing = useGameStore((s) => s.wantedFlashing)
  const timeOfDay = useGameStore((s) => s.timeOfDay)
  const prompt = useGameStore((s) => s.interactionPrompt)
  const radioStationName = useGameStore((s) => s.radioStationName)
  const inVehicle = useGameStore((s) => s.inVehicle)
  const isPaused = useGameStore((s) => s.isPaused)
  const setPaused = useGameStore((s) => s.setPaused)
  const cycleRadio = useGameStore((s) => s.cycleRadioStation)

  if (isPaused) return null

  // Format money as GTA style $0000000
  const formattedMoney = `$${money.toLocaleString()}`

  // Format game time (HH:MM)
  const hours = Math.floor(timeOfDay)
  const minutes = Math.floor((timeOfDay % 1) * 60)
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`

  return (
    <div className="fixed inset-0 pointer-events-none z-30 select-none overflow-hidden flex flex-col justify-between p-6">
      {/* --- TOP ROW --- */}
      <div className="flex justify-between items-start">
        {/* Top-Left: Game Clock & Radio Ticker */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-slate-800">
            <span className="text-xl font-black font-mono text-white tracking-wider">
              {formattedTime}
            </span>
            <div className="h-4 w-px bg-slate-700" />
            <button
              onClick={() => {
                cycleRadio()
                if (engine) engine.missionManager
              }}
              className="pointer-events-auto flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition cursor-pointer"
            >
              <Radio size={14} />
              <span className="tracking-wider">{radioStationName} [Q]</span>
            </button>
          </div>
        </div>

        {/* Mission Banner in Top-Center */}
        <MissionBanner />

        {/* Top-Right: Cash & Wanted Stars */}
        <div className="flex flex-col items-end gap-1.5">
          {/* Bank Cash Counter */}
          <div className="bg-black/80 backdrop-blur-md px-4 py-1.5 rounded-lg border border-emerald-900/60 shadow-lg flex items-center gap-2">
            <span className="text-3xl font-black tracking-tight text-emerald-400 font-mono drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
              {formattedMoney}
            </span>
          </div>

          {/* Wanted Stars (1 to 5) */}
          <div className="flex gap-1 bg-black/70 px-3 py-1 rounded-md border border-slate-800">
            {[1, 2, 3, 4, 5].map((starIndex) => {
              const isFilled = starIndex <= wantedLevel
              return (
                <Star
                  key={starIndex}
                  size={20}
                  className={`transition-all duration-150 ${
                    isFilled
                      ? wantedFlashing
                        ? 'text-red-500 fill-red-500 animate-pulse'
                        : 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                      : 'text-slate-700/60'
                  }`}
                />
              )
            })}
          </div>

          {/* Quick Pause Button */}
          <button
            onClick={() => setPaused(true)}
            className="pointer-events-auto mt-2 px-3 py-1.5 bg-black/70 hover:bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Pause size={14} />
            <span>PAUSE [ESC]</span>
          </button>
        </div>
      </div>

      {/* --- CENTER: INTERACTION PROMPT --- */}
      {prompt && !inVehicle && (
        <div className="self-center mb-8 pointer-events-none animate-bounce">
          <div className="bg-black/90 backdrop-blur-md border-2 border-amber-500 px-6 py-2.5 rounded-xl shadow-2xl flex items-center gap-2">
            <span className="text-base font-black tracking-wider text-amber-400 uppercase">
              {prompt}
            </span>
          </div>
        </div>
      )}

      {/* --- BOTTOM ROW --- */}
      <div className="flex justify-between items-end">
        {/* Bottom-Left: Circular Radar Minimap */}
        <Minimap engine={engine} />

        {/* Bottom-Right: Speedometer (when driving) */}
        <Speedometer />
      </div>
    </div>
  )
}
