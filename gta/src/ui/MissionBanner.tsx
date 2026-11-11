import React from 'react'
import { useGameStore } from '../game/state/gameStore'
import { Target, Clock } from 'lucide-react'

export const MissionBanner: React.FC = () => {
  const activeMission = useGameStore((s) => s.activeMission)
  const timeRemaining = useGameStore((s) => s.missionTimeRemaining)
  const successBanner = useGameStore((s) => s.missionSuccessBanner)
  const failedBanner = useGameStore((s) => s.missionFailedBanner)

  return (
    <>
      {/* 1. Cinematic Success Banner */}
      {successBanner && (
        <div className="fixed inset-x-0 top-24 flex justify-center z-50 pointer-events-none animate-bounce">
          <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 px-8 py-4 rounded-xl border-2 border-emerald-300 shadow-2xl shadow-emerald-500/50 flex flex-col items-center">
            <h1 className="text-3xl font-black italic tracking-widest text-white drop-shadow-md">
              {successBanner}
            </h1>
            <p className="text-xs font-bold text-emerald-100 tracking-wider mt-1 uppercase">
              REPUTATION INCREASED + REWARD TRANSFERRED
            </p>
          </div>
        </div>
      )}

      {/* 2. Cinematic Fail Banner */}
      {failedBanner && (
        <div className="fixed inset-x-0 top-24 flex justify-center z-50 pointer-events-none">
          <div className="bg-gradient-to-r from-red-700 via-rose-600 to-red-800 px-8 py-4 rounded-xl border-2 border-red-400 shadow-2xl shadow-red-600/50 flex flex-col items-center">
            <h1 className="text-3xl font-black italic tracking-widest text-white drop-shadow-md">
              {failedBanner}
            </h1>
            <p className="text-xs font-bold text-rose-200 tracking-wider mt-1 uppercase">
              MISSION CANCELLED
            </p>
          </div>
        </div>
      )}

      {/* 3. Active Mission HUD Card (Top Center) */}
      {activeMission && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div className="bg-black/80 backdrop-blur-md border border-amber-500/60 px-5 py-2.5 rounded-xl shadow-xl flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-400">
              <Target size={18} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                  MISSION: {activeMission.title}
                </span>
                <span className="text-[9px] font-semibold text-slate-400">
                  [{activeMission.client}]
                </span>
              </div>
              <p className="text-xs font-medium text-slate-200 line-clamp-1 max-w-md">
                {activeMission.description}
              </p>
            </div>

            {/* Timer if applicable */}
            {timeRemaining !== null && (
              <div className="flex items-center gap-1.5 pl-3 border-l border-slate-700">
                <Clock size={16} className={timeRemaining < 15 ? 'text-red-500 animate-pulse' : 'text-amber-400'} />
                <span className="text-base font-black font-mono text-white">
                  {Math.floor(timeRemaining / 60)}:
                  {Math.floor(timeRemaining % 60)
                    .toString()
                    .padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
