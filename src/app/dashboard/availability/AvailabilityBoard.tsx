'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AvailabilitySlot, SlotStatus } from '@/lib/types'

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8) // 8-22

const STATUS_CONFIG: Record<SlotStatus, { label: string; color: string; bg: string }> = {
  free:     { label: 'פנוי',   color: 'text-green-700',  bg: 'bg-green-100' },
  busy:     { label: 'תפוס',   color: 'text-red-700',    bg: 'bg-red-100' },
  flexible: { label: 'גמיש',   color: 'text-yellow-700', bg: 'bg-yellow-100' },
  office:   { label: 'משרד',   color: 'text-blue-700',   bg: 'bg-blue-100' },
}

const STATUS_CYCLE: SlotStatus[] = ['free', 'flexible', 'busy', 'office']

function getWeekDays() {
  const days = []
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - today.getDay() + 1)
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    days.push(d)
  }
  return days
}

const dayNames = ['ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳', 'א׳']

export default function AvailabilityBoard({
  currentUserId,
  allUsers,
  initialSlots,
}: {
  currentUserId: string
  allUsers: { id: string; name: string }[]
  initialSlots: AvailabilitySlot[]
}) {
  const supabase = createClient()
  const [slots, setSlots] = useState<AvailabilitySlot[]>(initialSlots)
  const weekDays = getWeekDays()

  function getSlot(userId: string, date: string, hour: number) {
    return slots.find(s => s.user_id === userId && s.date === date && s.hour === hour)
  }

  async function toggleSlot(date: string, hour: number) {
    const existing = getSlot(currentUserId, date, hour)
    if (existing) {
      const currentIdx = STATUS_CYCLE.indexOf(existing.status as SlotStatus)
      const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length]
      const { data } = await supabase
        .from('availability_slots')
        .update({ status: nextStatus })
        .eq('id', existing.id)
        .select()
        .single()
      if (data) setSlots(prev => prev.map(s => s.id === existing.id ? data : s))
    } else {
      const { data } = await supabase
        .from('availability_slots')
        .insert({ user_id: currentUserId, date, hour, status: 'free' })
        .select()
        .single()
      if (data) setSlots(prev => [...prev, data])
    }
  }

  const otherUser = allUsers.find(u => u.id !== currentUserId)

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Header */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 mb-2">
          <div />
          {weekDays.map((day, i) => (
            <div key={i} className="text-center">
              <p className="text-xs font-semibold text-gray-500">{dayNames[i]}</p>
              <p className={`text-sm font-bold ${day.toDateString() === new Date().toDateString() ? 'text-blue-600' : 'text-gray-700'}`}>
                {day.getDate()}
              </p>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex gap-3 mb-4 flex-wrap">
          {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
            <div key={status} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded ${cfg.bg}`} />
              <span className="text-xs text-gray-500">{cfg.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-100" />
            <span className="text-xs text-gray-500">לא מוגדר</span>
          </div>
        </div>

        {/* My slots */}
        <p className="text-xs font-semibold text-gray-500 mb-1">הזמינות שלי (לחץ לשינוי)</p>
        <div className="space-y-0.5 mb-4">
          {HOURS.map(hour => (
            <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] gap-1">
              <div className="text-xs text-gray-400 flex items-center justify-end pl-2">
                {hour}:00
              </div>
              {weekDays.map((day, i) => {
                const dateStr = day.toISOString().split('T')[0]
                const slot = getSlot(currentUserId, dateStr, hour)
                const cfg = slot ? STATUS_CONFIG[slot.status as SlotStatus] : null
                return (
                  <button
                    key={i}
                    onClick={() => toggleSlot(dateStr, hour)}
                    className={`h-8 rounded-lg text-xs font-medium transition hover:opacity-80 ${
                      cfg ? `${cfg.bg} ${cfg.color}` : 'bg-gray-50 text-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {cfg ? cfg.label[0] : '·'}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Partner slots (status only, no names) */}
        {otherUser && (
          <>
            <p className="text-xs font-semibold text-gray-500 mb-1">
              זמינות {otherUser.name} (צפייה בלבד)
            </p>
            <div className="space-y-0.5">
              {HOURS.map(hour => (
                <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] gap-1">
                  <div className="text-xs text-gray-400 flex items-center justify-end pl-2">
                    {hour}:00
                  </div>
                  {weekDays.map((day, i) => {
                    const dateStr = day.toISOString().split('T')[0]
                    const slot = getSlot(otherUser.id, dateStr, hour)
                    const cfg = slot ? STATUS_CONFIG[slot.status as SlotStatus] : null
                    return (
                      <div
                        key={i}
                        className={`h-8 rounded-lg flex items-center justify-center text-xs ${
                          cfg ? `${cfg.bg} ${cfg.color}` : 'bg-gray-50 text-gray-200'
                        }`}
                      >
                        {cfg ? cfg.label[0] : '·'}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
