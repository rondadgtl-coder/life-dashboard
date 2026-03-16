'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7)
const statusColors: Record<string, string> = {
  free:     'bg-emerald-100 text-emerald-700 border-emerald-200',
  busy:     'bg-red-100 text-red-700 border-red-200',
  flexible: 'bg-amber-100 text-amber-700 border-amber-200',
  office:   'bg-blue-100 text-blue-700 border-blue-200',
}
const statusLabels: Record<string, string> = { free: 'פנוי', busy: 'תפוס', flexible: 'גמיש', office: 'משרד' }

export default function TogetherPage() {
  const [slots, setSlots] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('availability_slots').select('*').eq('user_id', user.id).eq('date', today)
      const map: Record<string, string> = {}
      for (const s of data ?? []) map[s.hour] = s.status
      setSlots(map); setLoading(false)
    }
    load()
  }, [])

  async function toggleSlot(hour: number) {
    const cycle = ['free', 'busy', 'flexible', 'office']
    const current = slots[hour] ?? null
    const next = current ? (cycle[(cycle.indexOf(current) + 1) % cycle.length]) : 'free'
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    await supabase.from('availability_slots').upsert({ user_id: user.id, date: today, hour, status: next }, { onConflict: 'user_id,date,hour' })
    setSlots(prev => ({ ...prev, [hour]: next }))
    setSaving(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">טוען...</div>

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">יחד</h1>
      <p className="text-sm text-slate-400 mb-6">סמן את הזמינות שלך להיום</p>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex gap-3 flex-wrap">
          {Object.entries(statusLabels).map(([key, label]) => (
            <span key={key} className={`text-xs px-2 py-1 rounded-lg border font-medium ${statusColors[key]}`}>{label}</span>
          ))}
        </div>
        <div className="divide-y divide-slate-50">
          {HOURS.map(h => {
            const status = slots[h]
            return (
              <button key={h} onClick={() => toggleSlot(h)} disabled={saving}
                className={`w-full px-5 py-3 flex items-center justify-between transition hover:bg-slate-50 ${saving ? 'opacity-60' : ''}`}>
                <span className="text-sm font-medium text-slate-700 dir-ltr">{String(h).padStart(2,'0')}:00</span>
                {status ? (
                  <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${statusColors[status]}`}>{statusLabels[status]}</span>
                ) : (
                  <span className="text-xs text-slate-300">לחץ לסימון</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
