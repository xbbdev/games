import React from 'react'
import { useGameStore } from '../game/state/gameStore'
import { ShieldAlert } from 'lucide-react'

export const Speedometer: React.FC = () => {
  const inVehicle = useGameStore((s) => s.inVehicle)
  const vehicleName = useGameStore((s) => s.vehicleName)
  const speed = useGameStore((s) => s.vehicleSpeed)
  const rpm = useGameStore((s) => s.vehicleRpm)
  const gear = useGameStore((s) => s.vehicleGear)
  const vehicleHealth = useGameStore((s) => s.vehicleHealth)

  if (!inVehicle) return null

  // Calculate needle angle (-120deg to +120deg)
  const maxDisplaySpeed = 260
  const ratio = Math.min(1, speed / maxDisplaySpeed)
  const needleDeg = -120 + ratio * 240

  return (
    <div className="flex flex-col items-end pointer-events-none select-none">
      {/* Vehicle Name Banner */}
      <div className="mb-2 px-3 py-1 bg-black/70 border-r-4 border-amber-500 rounded-l backdrop-blur-md">
        <span className="text-xs font-black tracking-widest text-amber-400 uppercase">
          {vehicleName}
        </span>
      </div>

      {/* Main Dial */}
      <div className="relative w-48 h-48 bg-black/75 rounded-full border border-slate-700/80 shadow-2xl backdrop-blur-md flex items-center justify-center">
        {/* RPM Arc Ring */}
        <svg className="absolute w-44 h-44 -rotate-90">
          <circle
            cx="88"
            cy="88"
            r="80"
            stroke="currentColor"
            strokeWidth="5"
            fill="transparent"
            className="text-slate-800"
          />
          <circle
            cx="88"
            cy="88"
            r="80"
            stroke="currentColor"
            strokeWidth="5"
            fill="transparent"
            strokeDasharray={502}
            strokeDashoffset={502 - (502 * (rpm * 0.75))}
            className={`transition-all duration-75 ${
              rpm > 0.85 ? 'text-red-500' : 'text-amber-400'
            }`}
          />
        </svg>

        {/* Speedometer Needle */}
        <div
          className="absolute w-1 h-20 bg-gradient-to-t from-red-600 to-amber-400 origin-bottom rounded-full transition-transform duration-75"
          style={{
            transform: `translateY(-50%) rotate(${needleDeg}deg)`,
            boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)',
          }}
        />

        {/* Center Cap & Digital Speed Readout */}
        <div className="relative z-10 w-24 h-24 rounded-full bg-slate-950 border border-slate-700 flex flex-col items-center justify-center shadow-inner">
          <span className="text-3xl font-black italic tracking-tighter text-white font-mono leading-none">
            {speed}
          </span>
          <span className="text-[10px] font-bold text-slate-400 tracking-wider">KM/H</span>

          {/* Current Gear */}
          <div className="mt-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
            <span className="text-[11px] font-black text-amber-400 font-mono">
              GEAR {gear}
            </span>
          </div>
        </div>

        {/* Dial tick marks */}
        <div className="absolute top-3 text-[10px] font-mono text-slate-500 font-bold">140</div>
        <div className="absolute left-4 text-[10px] font-mono text-slate-500 font-bold">40</div>
        <div className="absolute right-4 text-[10px] font-mono text-slate-500 font-bold">220</div>
      </div>

      {/* Vehicle Integrity Bar */}
      <div className="w-48 mt-2 px-2 py-1 bg-black/70 rounded border border-slate-800 flex items-center gap-2">
        <ShieldAlert size={14} className={vehicleHealth < 40 ? 'text-red-500' : 'text-slate-400'} />
        <div className="flex-1 h-1.5 bg-slate-900 rounded overflow-hidden">
          <div
            className={`h-full transition-all duration-150 ${
              vehicleHealth > 60
                ? 'bg-emerald-500'
                : vehicleHealth > 30
                ? 'bg-amber-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${vehicleHealth}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-slate-400">{Math.round(vehicleHealth)}%</span>
      </div>
    </div>
  )
}
