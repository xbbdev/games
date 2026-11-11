import React, { useEffect, useRef, useState } from 'react'
import { GameEngine } from './game/core/Engine'
import { gameAudio } from './game/core/Audio'
import { gameInput } from './game/core/Input'
import { useGameStore } from './game/state/gameStore'
import { HUD } from './ui/HUD'
import { PauseMenu } from './ui/PauseMenu'
import { Play, Sparkles, Car, Shield, Crosshair } from 'lucide-react'

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const engineRef = useRef<GameEngine | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [hasStarted, setHasStarted] = useState(false)
  const [engineReady, setEngineReady] = useState(false)

  const isPaused = useGameStore((s) => s.isPaused)
  const setPaused = useGameStore((s) => s.setPaused)
  const cycleRadio = useGameStore((s) => s.cycleRadioStation)

  useEffect(() => {
    let engine: GameEngine | null = null

    const initEngine = async () => {
      if (!canvasRef.current) return
      engine = new GameEngine(canvasRef.current)
      await engine.init()
      engineRef.current = engine
      setEngineReady(true)
      setIsLoading(false)
    }

    initEngine()

    // Global Key Listener for Pause and Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        const curPaused = useGameStore.getState().isPaused
        setPaused(!curPaused)
        if (!curPaused) {
          gameInput.releasePointerLock()
        }
      } else if (e.code === 'KeyQ') {
        cycleRadio()
        const newStation = useGameStore.getState().radioStation
        gameAudio.setRadioStation(newStation)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (engine) engine.destroy()
    }
  }, [setPaused, cycleRadio])

  // Start / Resume Game onClick
  const handleStartGame = () => {
    gameAudio.init()
    gameAudio.resume()
    gameAudio.setRadioStation(1) // Start Flash FM
    gameInput.requestPointerLock()
    setHasStarted(true)
    setPaused(false)
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans">
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        onClick={() => {
          if (hasStarted && !isPaused) {
            gameInput.requestPointerLock()
            gameAudio.resume()
          }
        }}
        className="w-full h-full cursor-crosshair"
      />

      {/* In-Game HUD Overlay */}
      {hasStarted && engineReady && <HUD engine={engineRef.current} />}

      {/* Pause Menu Modal */}
      {hasStarted && engineReady && <PauseMenu engine={engineRef.current} />}

      {/* Welcome / Loading Splash Screen */}
      {(!hasStarted || isLoading) && (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-slate-950 via-slate-900 to-black flex flex-col items-center justify-between p-8 text-white select-none animate-fadeIn">
          {/* Top Logo */}
          <div className="flex flex-col items-center mt-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-amber-500 rounded text-black font-black text-xs tracking-widest uppercase">
                AAA 3D WebGL2
              </span>
              <span className="px-3 py-1 bg-rose-600 rounded text-white font-black text-xs tracking-widest uppercase">
                Rapier Physics
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 drop-shadow-[0_4px_24px_rgba(245,158,11,0.5)] uppercase">
              SAN ANDREAS 3D
            </h1>
            <p className="text-sm md:text-base font-bold text-slate-400 tracking-widest uppercase mt-2">
              Photorealistic Open World Action Game
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full my-6">
            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col items-center text-center">
              <Car size={24} className="text-amber-400 mb-2" />
              <span className="text-xs font-black uppercase text-white mb-1">Drivable Supercars</span>
              <span className="text-[11px] text-slate-400">Raycast suspension, drift physics, enter/exit cars [E]/[F]</span>
            </div>

            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col items-center text-center">
              <Sparkles size={24} className="text-purple-400 mb-2" />
              <span className="text-xs font-black uppercase text-white mb-1">PBR Graphics & Weather</span>
              <span className="text-[11px] text-slate-400">Wet asphalt, day/night cycle, bloom, dynamic shadows</span>
            </div>

            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col items-center text-center">
              <Shield size={24} className="text-blue-400 mb-2" />
              <span className="text-xs font-black uppercase text-white mb-1">Living City AI</span>
              <span className="text-[11px] text-slate-400">Autonomous traffic, pedestrians & 5-star police chases</span>
            </div>

            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col items-center text-center">
              <Crosshair size={24} className="text-emerald-400 mb-2" />
              <span className="text-xs font-black uppercase text-white mb-1">Missions & Economy</span>
              <span className="text-[11px] text-slate-400">Timed street races, deliveries, cash rewards & save system</span>
            </div>
          </div>

          {/* Start Button & Controls Hint */}
          <div className="flex flex-col items-center gap-4 mb-4">
            {isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">
                  INITIALIZING CITY ENVIRONMENT & WASM PHYSICS...
                </span>
              </div>
            ) : (
              <button
                onClick={handleStartGame}
                className="group relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black italic tracking-widest text-lg rounded-2xl shadow-2xl shadow-orange-500/40 transform hover:scale-105 active:scale-95 transition cursor-pointer"
              >
                <Play size={24} className="fill-black" />
                START GAMEPLAY
              </button>
            )}

            {/* Quick Controls Cheat Sheet */}
            <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono mt-2 bg-slate-900/60 px-4 py-2 rounded-lg border border-slate-800">
              <span><b className="text-white">WASD:</b> Move / Drive</span>
              <span>•</span>
              <span><b className="text-white">Mouse:</b> Look</span>
              <span>•</span>
              <span><b className="text-amber-400">E:</b> Enter Car</span>
              <span>•</span>
              <span><b className="text-amber-400">F:</b> Exit Car</span>
              <span>•</span>
              <span><b className="text-white">Space:</b> Drift</span>
              <span>•</span>
              <span><b className="text-white">Q:</b> Radio</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
