'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import TaskList from '@/components/tasks/TaskList'
import CreateTaskButton from '@/components/tasks/CreateTaskButton'
import TimerWidget from '@/components/TimerWidget'
import GoogleCalendarButton from '@/components/GoogleCalendarButton'
import { Suspense } from 'react'
import type { Task, Domain } from '@/lib/types'

interface DomainStat {
  domain: Domain
  hoursThisWeek: number
  weeklyGoalHours: number
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([])
  const [domainStats, setDomainStats] = useState<DomainStat[]>([])
  const [activeTab, setActiveTab] = useState<'today' | 'overdue'>('today')
  const [hebrewDay, setHebrewDay] = useState('')

  const load = useCallback(async () => {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    // Week boundaries (Mon–Sun)
    const now = new Date()
    const dow = now.getDay()
    const diff = (dow === 0 ? -6 : 1) - dow
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() + diff)
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const [
      { data: todayData },
      { data: overdueData },
      { data: domainsData },
      { data: timeData },
    ] = await Promise.all([
      supabase.from('tasks')
        .select('*, domain:domains(*), project:projects(*)')
        .eq('user_id', user.id)
        .eq('type', 'today')
        .neq('status', 'done')
        .order('priority', { ascending: false }),
      supabase.from('tasks')
        .select('*, domain:domains(*), project:projects(*)')
        .eq('user_id', user.id)
        .neq('status', 'done')
        .lt('deadline', today)
        .not('deadline', 'is', null)
        .order('deadline', { ascending: true }),
      supabase.from('domains')
        .select('*')
        .eq('user_id', user.id)
        .eq('archived', false),
      supabase.from('time_entries')
        .select('domain_id, duration_seconds')
        .eq('user_id', user.id)
        .gte('started_at', weekStart.toISOString())
        .lte('started_at', weekEnd.toISOString())
        .not('duration_seconds', 'is', null),
    ])

    setTodayTasks((todayData ?? []) as Task[])
    setOverdueTasks((overdueData ?? []) as Task[])

    // Build domain stats from time entries this week
    const secondsByDomain: Record<string, number> = {}
    for (const entry of (timeData ?? [])) {
      if (entry.domain_id) {
        secondsByDomain[entry.domain_id] = (secondsByDomain[entry.domain_id] ?? 0) + (entry.duration_seconds ?? 0)
      }
    }

    const stats: DomainStat[] = (domainsData ?? []).map(d => ({
      domain: d as Domain,
      hoursThisWeek: Math.round((secondsByDomain[d.id] ?? 0) / 360) / 10,
      weeklyGoalHours: 8,
    })).filter(s => s.hoursThisWeek > 0)

    setDomainStats(stats)
    setLoading(false)
  }, [])

  useEffect(() => {
    setHebrewDay(new Intl.DateTimeFormat('he-IL', {
      weekday: 'long', day: 'numeric', month: 'long'
    }).format(new Date()))
    load()
  }, [load])

  const displayTasks = activeTab === 'today' ? todayTasks : overdueTasks

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ── Header ── */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">שלום 👋</h1>
              <p className="text-sm text-gray-400 mt-0.5">{hebrewDay}</p>
            </div>
            <CreateTaskButton defaultType="today" onCreated={load} />
          </div>
          <Suspense fallback={null}>
            <GoogleCalendarButton />
          </Suspense>
        </div>

        {/* ── 2-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Left: Tasks ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Tab switcher */}
            <div className="flex gap-1.5 bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm">
              <button
                onClick={() => setActiveTab('today')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'today'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>☀️</span>
                <span>משימות היום</span>
                {todayTasks.length > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    activeTab === 'today' ? 'bg-white/25 text-white' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {todayTasks.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('overdue')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'overdue'
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>⚠️</span>
                <span>באיחור</span>
                {overdueTasks.length > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    activeTab === 'overdue' ? 'bg-white/25 text-white' : 'bg-red-100 text-red-700'
                  }`}>
                    {overdueTasks.length}
                  </span>
                )}
              </button>
            </div>

            {/* Tasks */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
                    <div className="h-4 bg-gray-100 rounded-lg w-3/4 mb-3" />
                    <div className="flex gap-2">
                      <div className="h-3 bg-gray-50 rounded-full w-20" />
                      <div className="h-3 bg-gray-50 rounded-full w-12" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayTasks.length > 0 ? (
              <TaskList tasks={displayTasks} onRefresh={load} />
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                {activeTab === 'today' ? (
                  <>
                    <div className="text-5xl mb-3">🎉</div>
                    <p className="text-sm font-semibold text-gray-700">אין משימות להיום!</p>
                    <p className="text-xs text-gray-400 mt-1">לחץ על ״משימה חדשה״ להוספה</p>
                  </>
                ) : (
                  <>
                    <div className="text-5xl mb-3">✅</div>
                    <p className="text-sm font-semibold text-gray-700">אין משימות באיחור</p>
                    <p className="text-xs text-gray-400 mt-1">כל הכבוד, הכל בסדר!</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Right: Widgets ── */}
          <div className="space-y-4">

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-indigo-600">{loading ? '—' : todayTasks.length}</div>
                <div className="text-xs text-gray-400 mt-0.5">משימות היום</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                <div className={`text-2xl font-bold ${overdueTasks.length > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                  {loading ? '—' : overdueTasks.length}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">באיחור</div>
              </div>
            </div>

            {/* Timer */}
            {userId && <TimerWidget userId={userId} />}

            {/* Domain Progress */}
            {domainStats.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">התקדמות שבועית</span>
                  <span className="text-xs text-gray-400">שעות</span>
                </div>
                <div className="p-4 space-y-3.5">
                  {domainStats.map(({ domain, hoursThisWeek, weeklyGoalHours }) => {
                    const pct = Math.min(100, (hoursThisWeek / weeklyGoalHours) * 100)
                    return (
                      <div key={domain.id}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                            <span>{domain.icon}</span>
                            <span>{domain.name}</span>
                          </span>
                          <span className="text-xs font-semibold" style={{ color: domain.color }}>
                            {hoursThisWeek}h
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, backgroundColor: domain.color }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
