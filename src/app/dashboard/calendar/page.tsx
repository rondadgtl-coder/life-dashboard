'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import CreateTaskButton from '@/components/tasks/CreateTaskButton'
import type { Task } from '@/lib/types'

type ViewMode = 'month' | 'week' | 'day'

const HEBREW_DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
const HEBREW_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function getWeekDays(date: Date): Date[] {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(d)
    dd.setDate(d.getDate() + i)
    return dd
  })
}

function getMonthDays(date: Date): Date[] {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // pad start: go back to Monday
  const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
  const days: Date[] = []
  for (let i = startPad; i > 0; i--) {
    const d = new Date(firstDay)
    d.setDate(firstDay.getDate() - i)
    days.push(d)
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  // pad end to complete grid
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1]!
    const next = new Date(last)
    next.setDate(last.getDate() + 1)
    days.push(next)
  }
  return days
}

function TaskDot({ task }: { task: Task }) {
  const color = task.domain?.color ?? '#6366f1'
  return (
    <div
      className="text-[10px] leading-tight px-1 py-0.5 rounded truncate font-medium"
      style={{ backgroundColor: color + '20', color }}
      title={task.title}
    >
      {task.title}
    </div>
  )
}

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  async function loadTasks() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('tasks')
      .select('*, domain:domains(*), project:projects(*)')
      .eq('user_id', user.id)
      .neq('status', 'done')
      .not('deadline', 'is', null)
      .order('deadline', { ascending: true })

    setTasks((data ?? []) as Task[])
    setLoading(false)
  }

  useEffect(() => { loadTasks() }, [])

  function tasksForDay(date: Date) {
    return tasks.filter(t => t.deadline && isSameDay(new Date(t.deadline), date))
  }

  function navigate(direction: number) {
    const d = new Date(currentDate)
    if (viewMode === 'month') d.setMonth(d.getMonth() + direction)
    else if (viewMode === 'week') d.setDate(d.getDate() + direction * 7)
    else d.setDate(d.getDate() + direction)
    setCurrentDate(d)
  }

  const today = new Date()

  // ── Month View ──────────────────────────────────────────
  function MonthView() {
    const days = getMonthDays(currentDate)
    return (
      <div>
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {['שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת', 'ראשון'].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
          ))}
        </div>
        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth()
            const isToday = isSameDay(day, today)
            const dayTasks = tasksForDay(day)
            return (
              <div
                key={i}
                className={`min-h-[80px] rounded-xl p-1.5 border transition-colors ${
                  isToday
                    ? 'bg-indigo-50 border-indigo-200'
                    : isCurrentMonth
                    ? 'bg-white border-gray-100 hover:border-indigo-200'
                    : 'bg-gray-50/50 border-gray-50'
                }`}
              >
                <div className={`text-xs font-semibold mb-1 w-5 h-5 flex items-center justify-center rounded-full ${
                  isToday ? 'bg-indigo-600 text-white' : isCurrentMonth ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  {day.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 2).map(t => <TaskDot key={t.id} task={t} />)}
                  {dayTasks.length > 2 && (
                    <div className="text-[9px] text-gray-400 text-center">+{dayTasks.length - 2} עוד</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Week View ──────────────────────────────────────────
  function WeekView() {
    const days = getWeekDays(currentDate)
    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, i) => {
          const isToday = isSameDay(day, today)
          const dayTasks = tasksForDay(day)
          return (
            <div key={i} className={`rounded-2xl border p-3 min-h-[200px] ${isToday ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100'}`}>
              <div className="text-center mb-2">
                <p className="text-xs text-gray-400">{HEBREW_DAYS[day.getDay()]}</p>
                <div className={`mx-auto w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${isToday ? 'bg-indigo-600 text-white' : 'text-gray-700'}`}>
                  {day.getDate()}
                </div>
              </div>
              <div className="space-y-1">
                {dayTasks.map(t => <TaskDot key={t.id} task={t} />)}
                {dayTasks.length === 0 && (
                  <p className="text-[10px] text-gray-300 text-center mt-4">ריק</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ── Day View ──────────────────────────────────────────
  function DayView() {
    const dayTasks = tasksForDay(currentDate)
    const isToday = isSameDay(currentDate, today)
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className={`px-5 py-4 border-b border-gray-50 ${isToday ? 'bg-indigo-50' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">{HEBREW_DAYS[currentDate.getDay()]}</p>
              <p className="text-2xl font-bold text-gray-900">{currentDate.getDate()} {HEBREW_MONTHS[currentDate.getMonth()]}</p>
            </div>
            {isToday && (
              <span className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-full font-medium">היום</span>
            )}
          </div>
        </div>
        <div className="p-5">
          {dayTasks.length > 0 ? (
            <div className="space-y-3">
              {dayTasks.map(t => (
                <div
                  key={t.id}
                  className="flex items-start gap-3 p-3 rounded-xl border"
                  style={{ borderRightColor: t.domain?.color ?? '#6366f1', borderRightWidth: 3 }}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{t.title}</p>
                    {t.domain && (
                      <span className="text-xs font-medium" style={{ color: t.domain.color }}>
                        {t.domain.icon} {t.domain.name}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    t.priority === 'high' ? 'bg-red-100 text-red-700' :
                    t.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {t.priority === 'high' ? 'גבוה' : t.priority === 'medium' ? 'בינוני' : 'נמוך'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">📅</p>
              <p className="text-sm text-gray-400">אין משימות ביום זה</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const title = viewMode === 'month'
    ? `${HEBREW_MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    : viewMode === 'week'
    ? (() => { const days = getWeekDays(currentDate); return `${days[0]!.getDate()}–${days[6]!.getDate()} ${HEBREW_MONTHS[currentDate.getMonth()]}` })()
    : `${currentDate.getDate()} ${HEBREW_MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition shadow-sm"
            >
              ›
            </button>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            <button
              onClick={() => navigate(1)}
              className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition shadow-sm"
            >
              ‹
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-xs px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition font-medium"
            >
              היום
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* View mode tabs */}
            <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
              {(['month', 'week', 'day'] as ViewMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    viewMode === mode ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {mode === 'month' ? 'חודש' : mode === 'week' ? 'שבוע' : 'יום'}
                </button>
              ))}
            </div>
            <CreateTaskButton onCreated={loadTasks} />
          </div>
        </div>

        {/* Calendar */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="text-gray-300 text-sm animate-pulse">טוען...</div>
          </div>
        ) : (
          viewMode === 'month' ? <MonthView /> :
          viewMode === 'week' ? <WeekView /> :
          <DayView />
        )}
      </div>
    </div>
  )
}
