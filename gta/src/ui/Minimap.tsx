import React, { useEffect, useRef } from 'react'
import { useGameStore } from '../game/state/gameStore'
import { GameEngine } from '../game/core/Engine'

interface MinimapProps {
  engine: GameEngine | null
}

export const Minimap: React.FC<MinimapProps> = ({ engine }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const health = useGameStore((s) => s.health)
  const armor = useGameStore((s) => s.armor)
  const stamina = useGameStore((s) => s.stamina)

  useEffect(() => {
    let animId: number

    const renderMinimap = () => {
      const canvas = canvasRef.current
      if (!canvas || !engine) {
        animId = requestAnimationFrame(renderMinimap)
        return
      }

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const w = canvas.width
      const h = canvas.height
      const cx = w / 2
      const cy = h / 2
      const radius = w / 2 - 4

      // Current player / vehicle position & rotation
      const playerPos = engine.vehicleManager.activeVehicle
        ? engine.vehicleManager.activeVehicle.position
        : engine.player.position

      const playerYaw = engine.vehicleManager.activeVehicle
        ? engine.vehicleManager.activeVehicle.rotationY
        : engine.player.rotationY

      // Clear
      ctx.clearRect(0, 0, w, h)

      // Circular clip
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.clip()

      // Radar dark background
      ctx.fillStyle = '#0d1117'
      ctx.fillRect(0, 0, w, h)

      // Transform radar so it rotates with player
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(-playerYaw)

      const scale = 0.85 // meters to radar pixels

      // 1. Draw Road Network
      ctx.strokeStyle = '#30363d'
      ctx.lineWidth = 14 * scale
      ctx.lineCap = 'round'

      for (const seg of engine.roadNetwork.roadSegments) {
        const x1 = (seg.start.x - playerPos.x) * scale
        const y1 = (seg.start.z - playerPos.z) * scale
        const x2 = (seg.end.x - playerPos.x) * scale
        const y2 = (seg.end.z - playerPos.z) * scale

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }

      // Draw road center markings
      ctx.strokeStyle = '#484f58'
      ctx.lineWidth = 2 * scale
      for (const seg of engine.roadNetwork.roadSegments) {
        const x1 = (seg.start.x - playerPos.x) * scale
        const y1 = (seg.start.z - playerPos.z) * scale
        const x2 = (seg.end.x - playerPos.x) * scale
        const y2 = (seg.end.z - playerPos.z) * scale

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }

      // 2. Draw Civilian Traffic blips (small grey dots)
      ctx.fillStyle = '#8b949e'
      for (const car of engine.trafficAI.cars) {
        const cxp = (car.position.x - playerPos.x) * scale
        const cyp = (car.position.z - playerPos.z) * scale
        ctx.beginPath()
        ctx.arc(cxp, cyp, 3, 0, Math.PI * 2)
        ctx.fill()
      }

      // 3. Draw Parked Vehicles (blue squares)
      ctx.fillStyle = '#38bdf8'
      for (const v of engine.vehicleManager.vehicles) {
        if (v === engine.vehicleManager.activeVehicle) continue
        const vx = (v.position.x - playerPos.x) * scale
        const vy = (v.position.z - playerPos.z) * scale
        ctx.fillRect(vx - 3, vy - 3, 6, 6)
      }

      // 4. Draw Police Pursuers (flashing red/blue dots)
      const flash = Math.floor(Date.now() / 200) % 2 === 0
      for (const cop of engine.policeSystem.policeCars) {
        const cpx = (cop.position.x - playerPos.x) * scale
        const cpy = (cop.position.z - playerPos.z) * scale
        ctx.fillStyle = flash ? '#ef4444' : '#3b82f6'
        ctx.beginPath()
        ctx.arc(cpx, cpy, 5, 0, Math.PI * 2)
        ctx.fill()
      }

      // 5. Draw Active Mission Waypoint (pulsing yellow target)
      const mission = useGameStore.getState().activeMission
      if (mission) {
        const mx = (mission.targetX - playerPos.x) * scale
        const my = (mission.targetZ - playerPos.z) * scale
        const pulse = 6 + Math.sin(Date.now() * 0.008) * 2

        ctx.fillStyle = '#facc15'
        ctx.beginPath()
        ctx.arc(mx, my, pulse, 0, Math.PI * 2)
        ctx.fill()

        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      ctx.restore() // Undo rotation & translation

      // 6. Draw Player Triangle Arrow in Center
      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2

      ctx.beginPath()
      ctx.moveTo(cx, cy - 8)
      ctx.lineTo(cx + 6, cy + 7)
      ctx.lineTo(cx, cy + 4)
      ctx.lineTo(cx - 6, cy + 7)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      ctx.restore() // Undo circular clip

      // Circular metallic border
      ctx.strokeStyle = '#475569'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.stroke()

      // Radar sweep crosshairs
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cx, cy - radius)
      ctx.lineTo(cx, cy + radius)
      ctx.moveTo(cx - radius, cy)
      ctx.lineTo(cx + radius, cy)
      ctx.stroke()

      // Outer rings
      ctx.beginPath()
      ctx.arc(cx, cy, radius * 0.5, 0, Math.PI * 2)
      ctx.stroke()

      animId = requestAnimationFrame(renderMinimap)
    }

    animId = requestAnimationFrame(renderMinimap)
    return () => cancelAnimationFrame(animId)
  }, [engine])

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-44 h-44 rounded-full overflow-hidden shadow-2xl bg-black/60 border-2 border-slate-700/80 backdrop-blur-md">
        <canvas ref={canvasRef} width={176} height={176} className="w-full h-full" />
      </div>

      {/* Health, Armor, Stamina Bars under radar */}
      <div className="w-44 mt-2 flex flex-col gap-1 bg-black/75 p-1.5 rounded-lg border border-slate-800 backdrop-blur-sm">
        {/* Health */}
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <div className="flex-1 h-2 bg-slate-900 rounded-sm overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-150"
              style={{ width: `${health}%` }}
            />
          </div>
        </div>
        {/* Armor */}
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
          <div className="flex-1 h-2 bg-slate-900 rounded-sm overflow-hidden">
            <div
              className="h-full bg-sky-500 transition-all duration-150"
              style={{ width: `${armor}%` }}
            />
          </div>
        </div>
        {/* Stamina */}
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <div className="flex-1 h-1.5 bg-slate-900 rounded-sm overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all duration-150"
              style={{ width: `${stamina}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
