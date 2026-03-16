'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Task } from '@/lib/types'

type ViewMode = 'month' | 'week'

function getWeekDays(date: Date) {
  const start = new Date(date)
  start.setDate(date.getDate() - date.getDay())
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d })
}

function getMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startPad = first.getDay()
  const days: (Date | null)[] = Array(startPad).fill(null)
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d))
  while (days.length % 7 !== 0) days.push(null)
  return days
}

const hebrewDays = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
const hebrewMonths = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']

export default function CalendarPage() {
  const [view, setView] = useState<ViewMode>('week')
  const [current, setCurrent] = useState(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function load() {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('tasks').select('*, domain:domains(*)').eq('user_id', user.id).not('deadline','is',null)
      setTasks((data ?? []) as Task[])
      setLoading(false)
    }
    load()
  }, [])

  function tasksByDate(dateStr: string) {
    return tasks.filter(t => t.deadline === dateStr)
  }

  function fmt(d: Date) { return d.toISOString().split('T')[0] }

  const weekDays = getWeekDays(current)
  const monthGrid = getMonthGrid(current.getFullYear(), current.getMonth())

  function navigate(dir: 1 | -1) {
    const d = new Date(current)
    if (view === 'week') d.setDate(d.getDate() + dir * 7)
    else d.setMonth(d.getMonth() + dir)
    setCurrent(d)
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-slate-900">לוח שנה</h1>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-xl p-1">
            <button onClick={() => setView('week')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${view==='week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>שבועי</button>
            <button onClick={() => setView('month')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${view==='month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>חודשי</button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Nav */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition text-slate-600">‹</button>
          <h2 className="font-semibold text-slate-900 text-sm">
            {view === 'week'
              ? `${weekDays[0].getDate()} — ${weekDays[6].getDate()} ${hebrewMonths[current.getMonth()]} ${current.getFullYear()}`
              : `${hebrewMonths[current.getMonth()]} ${current.getFullYear()}`}
          </h2>
          <button onClick={() => navigate(1)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition text-slate-600">›</button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {hebrewDays.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-slate-400">{d}</div>
          ))}
        </div>

        {view === 'week' ? (
          <div className="grid grid-cols-7 min-h-40">
            {weekDays.map(day => {
              const dateStr = fmt(day)
              const dayTasks = tasksByDate(dateStr)
              const isToday = dateStr === today
              return (
                <div key={dateStr} className={`border-l border-slate-50 first:border-l-0 p-2 min-h-24 ${isToday ? 'bg-indigo-50' : ''}`}>
                  <div className={`text-xs font-bold mb-1.5 w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-indigo-600 text-white' : 'text-slate-500'
                  }`}>{day.getDate()}</div>
                  <div className="space-y-1">
                    {dayTasks.map(t => (
                      <div key={t.id} className="text-[10px] leading-tight px-1.5 py-0.5 rounded-lg truncate font-medium"
                        style={{ backgroundColor: (t.domain?.color ?? '#6366f1') + '20', color: t.domain?.color ?? '#6366f1' }}>
                        {t.title}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {monthGrid.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} className="border-l border-t border-slate-50 first:border-l-0 p-2 min-h-20 bg-slate-50/50" />
              const dateStr = fmt(day)
              const dayTasks = tasksByDate(dateStr)
              const isToday = dateStr === today
              return (
                <div key={dateStr} className={`border-l border-t border-slate-50 first:border-l-0 p-2 min-h-20 ${isToday ? 'bg-indigo-50' : ''}`}>
                  <div className={`text-xs font-bold mb-1 w-5 h-5 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-indigo-600 text-white' : 'text-slate-500'
                  }`}>{day.getDate()}</div>
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 3).map(t => (
                      <div key={t.id} className="text-[9px] leading-tight px-1 py-0.5 rounded truncate font-medium"
                        style={{ backgroundColor: (t.domain?.color ?? '#6366f1') + '25', color: t.domain?.color ?? '#6366f1' }}>
                        {t.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && <div className="text-[9px] text-slate-400">+{dayTasks.length - 3}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      {loading && <div className="text-center py-4 text-slate-400 text-sm">טוען משימות...</div>}
    </div>
  )
}
