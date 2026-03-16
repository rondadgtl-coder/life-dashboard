'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import TaskCard from '@/components/tasks/TaskCard'
import CreateTaskModal from '@/components/tasks/CreateTaskModal'
import GoogleCalendarButton from '@/components/GoogleCalendarButton'
import type { Task, Domain, DomainStat, DomainHealth } from '@/lib/types'

function getDomainHealth(hours: number, goal: number): DomainHealth {
  if (goal === 0) return 'on_track'
  const pct = hours / goal
  if (pct >= 1) return 'completed'
  if (pct >= 0.5) return 'on_track'
  if (pct >= 0.2) return 'needs_attention'
  return 'neglected'
}

const healthConfig: Record<DomainHealth, { label: string; color: string; bg: string; bar: string }> = {
  completed:       { label: '✓ הושלם',       color: 'text-emerald-600', bg: 'bg-emerald-50',  bar: 'bg-emerald-500' },
  on_track:        { label: 'במסלול',         color: 'text-blue-600',    bg: 'bg-blue-50',     bar: 'bg-blue-500'    },
  needs_attention: { label: 'צריך תשומת לב', color: 'text-amber-600',   bg: 'bg-amber-50',    bar: 'bg-amber-400'   },
  neglected:       { label: 'מוזנח ⚠️',       color: 'text-red-600',     bg: 'bg-red-50',      bar: 'bg-red-500'     },
}

function BrainDumpBar({ onCreated }: { onCreated: () => void }) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    const { data: domains } = await supabase.from('domains').select('id').eq('user_id', user.id).eq('archived', false).limit(1)
    const { data: projects } = await supabase.from('projects').select('id').eq('user_id', user.id).eq('archived', false).limit(1)
    await supabase.from('tasks').insert({
      user_id: user.id, title: text.trim(), type: 'inbox', priority: 'medium',
      status: 'not_started', task_nature: 'proactive', is_inbox: true, is_focus: false,
      recurring: false, domain_id: domains?.[0]?.id ?? null, project_id: projects?.[0]?.id ?? null,
    })
    setText(''); setSaving(false); onCreated()
  }

  return (
    <form onSubmit={submit} className="flex gap-2 mb-6">
      <input value={text} onChange={e => setText(e.target.value)}
        placeholder="📥 brain dump — זרוק פה כל מחשבה, בלי לחשוב..."
        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm" />
      <button type="submit" disabled={!text.trim() || saving}
        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition">
        {saving ? '...' : '+ שמור'}
      </button>
    </form>
  )
}

function DomainHealthCard({ stat }: { stat: DomainStat }) {
  const { domain, hoursThisWeek, health } = stat
  const goal = domain.weekly_hours_goal ?? 0
  const pct = goal > 0 ? Math.min((hoursThisWeek / goal) * 100, 100) : 0
  const cfg = healthConfig[health]

  return (
    <div className={`rounded-xl p-3 ${cfg.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span>{domain.icon}</span>
          <span className="text-sm font-semibold text-slate-800">{domain.name}</span>
        </div>
        <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
      </div>
      <div className="h-1.5 bg-white/70 rounded-full overflow-hidden mb-1">
        <div className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>{hoursThisWeek.toFixed(1)}h</span>
        {goal > 0 && <span>/ {goal}h מטרה</span>}
      </div>
    </div>
  )
}

function MiniTimer({ domains }: { domains: Domain[] }) {
  const [domainId, setDomainId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [entryId, setEntryId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!domainId) { setProjects([]); setProjectId(''); return }
    supabase.from('projects').select('id,name').eq('domain_id', domainId).eq('archived', false)
      .then(({ data }) => { setProjects(data ?? []); setProjectId('') })
  }, [domainId])

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [running])

  function fmt(s: number) {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  async function start() {
    if (!domainId || !projectId) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('time_entries').insert({
      user_id: user.id, domain_id: domainId, project_id: projectId, started_at: new Date().toISOString()
    }).select().single()
    if (data) { setEntryId(data.id); setRunning(true); setElapsed(0) }
  }

  async function stop() {
    if (!entryId) return
    await supabase.from('time_entries').update({ ended_at: new Date().toISOString(), duration_seconds: elapsed }).eq('id', entryId)
    setRunning(false); setEntryId(null); setElapsed(0)
  }

  return (
    <div className="bg-slate-900 rounded-2xl p-4 text-white">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">⏱ טיימר</p>
      {running ? (
        <div className="text-center space-y-3">
          <div className="text-3xl font-mono font-bold text-emerald-400">{fmt(elapsed)}</div>
          <button onClick={stop} className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 rounded-xl transition">■ עצור</button>
        </div>
      ) : (
        <div className="space-y-2">
          <select value={domainId} onChange={e => setDomainId(e.target.value)}
            className="w-full bg-slate-800 text-white text-sm rounded-xl px-3 py-2 border border-slate-700 focus:outline-none">
            <option value="">בחר תחום...</option>
            {domains.map(d => <option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
          </select>
          {domainId && (
            <select value={projectId} onChange={e => setProjectId(e.target.value)}
              className="w-full bg-slate-800 text-white text-sm rounded-xl px-3 py-2 border border-slate-700 focus:outline-none">
              <option value="">בחר פרויקט...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          <button onClick={start} disabled={!domainId || !projectId}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 text-white text-sm font-semibold py-2 rounded-xl transition">
            ▶ התחל
          </button>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [focusTasks, setFocusTasks] = useState<Task[]>([])
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([])
  const [domainStats, setDomainStats] = useState<DomainStat[]>([])
  const [domains, setDomains] = useState<Domain[]>([])
  const [hebrewDay, setHebrewDay] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [inboxCount, setInboxCount] = useState(0)

  const load = useCallback(async () => {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: todayData }, { data: overdueData }, { data: domainsData }, { data: timeData }, { data: inboxData }] = await Promise.all([
      supabase.from('tasks').select('*, domain:domains(*), project:projects(*)')
        .eq('user_id', user.id).in('type', ['today','week']).neq('status','done')
        .order('is_focus', { ascending: false }).order('priority', { ascending: false }),
      supabase.from('tasks').select('*, domain:domains(*), project:projects(*)')
        .eq('user_id', user.id).neq('status','done').lt('deadline', today).not('deadline','is',null),
      supabase.from('domains').select('*').eq('user_id', user.id).eq('archived', false).order('name'),
      supabase.from('time_entries').select('domain_id, duration_seconds')
        .eq('user_id', user.id).gte('started_at', weekStart.toISOString().split('T')[0]).not('duration_seconds','is',null),
      supabase.from('tasks').select('id').eq('user_id', user.id).eq('is_inbox', true).neq('status','done'),
    ])

    const allTasks = (todayData ?? []) as Task[]
    setFocusTasks(allTasks.filter(t => t.is_focus))
    setTodayTasks(allTasks.filter(t => !t.is_focus))
    setOverdueTasks((overdueData ?? []) as Task[])
    setInboxCount(inboxData?.length ?? 0)

    const hoursMap: Record<string, number> = {}
    for (const e of timeData ?? []) hoursMap[e.domain_id] = (hoursMap[e.domain_id] ?? 0) + (e.duration_seconds ?? 0) / 3600

    const allDomains = (domainsData ?? []) as Domain[]
    setDomains(allDomains)
    setDomainStats(allDomains.filter(d => (d.weekly_hours_goal ?? 0) > 0).map(d => ({
      domain: d, hoursThisWeek: hoursMap[d.id] ?? 0,
      health: getDomainHealth(hoursMap[d.id] ?? 0, d.weekly_hours_goal),
    })))
    setLoading(false)
  }, [])

  useEffect(() => {
    setHebrewDay(new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()))
    load()
  }, [load])

  function handleStatusChange(id: string, status: Task['status']) {
    const upd = (t: Task[]) => t.map(x => x.id === id ? { ...x, status } : x)
    setFocusTasks(upd); setTodayTasks(upd)
    setOverdueTasks(prev => prev.filter(t => t.id !== id))
  }
  function handleDelete(id: string) {
    const rm = (t: Task[]) => t.filter(x => x.id !== id)
    setFocusTasks(rm); setTodayTasks(rm); setOverdueTasks(rm)
  }
  async function toggleFocus(task: Task) {
    const supabase = createClient()
    await supabase.from('tasks').update({ is_focus: !task.is_focus }).eq('id', task.id)
    load()
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">טוען...</div>

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">שלום 👋</h1>
          <p className="text-sm text-slate-400 mt-0.5">{hebrewDay}</p>
        </div>
        <button onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-sm flex items-center gap-2">
          <span>+</span><span>משימה חדשה</span>
        </button>
      </div>

      <BrainDumpBar onCreated={load} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {overdueTasks.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-red-500 uppercase tracking-wide mb-2">⚠️ באיחור ({overdueTasks.length})</h2>
              <div className="space-y-2">{overdueTasks.map(t => <TaskCard key={t.id} task={t} onStatusChange={handleStatusChange} onDelete={handleDelete} onToggleFocus={toggleFocus} />)}</div>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-wide">⭐ פוקוס היום ({focusTasks.length}/3)</h2>
              {focusTasks.length < 3 && <span className="text-xs text-slate-400">לחץ ⭐ על משימה</span>}
            </div>
            {focusTasks.length > 0 ? (
              <div className="space-y-2 bg-indigo-50 rounded-2xl p-3 border border-indigo-100">
                {focusTasks.map(t => <TaskCard key={t.id} task={t} onStatusChange={handleStatusChange} onDelete={handleDelete} onToggleFocus={toggleFocus} highlight />)}
              </div>
            ) : (
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-center text-sm text-indigo-400">
                לחץ ⭐ על משימה כלשהי להוספה לפוקוס
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">📋 שאר המשימות ({todayTasks.length})</h2>
            {todayTasks.length > 0 ? (
              <div className="space-y-2">{todayTasks.map(t => <TaskCard key={t.id} task={t} onStatusChange={handleStatusChange} onDelete={handleDelete} onToggleFocus={toggleFocus} />)}</div>
            ) : (
              <div className="text-center py-8 text-slate-400"><p className="text-3xl mb-2">🎉</p><p className="text-sm">הכל הושלם!</p></div>
            )}
          </section>

          {inboxCount > 0 && (
            <a href="/dashboard/tasks?tab=inbox" className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-700 hover:bg-amber-100 transition">
              <span>📥</span><span><strong>{inboxCount}</strong> פריטים ב-Inbox ממתינים לסיווג</span><span className="mr-auto text-amber-500">←</span>
            </a>
          )}
        </div>

        <div className="space-y-4">
          <MiniTimer domains={domains} />
          {domainStats.length > 0 ? (
            <section>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">📊 שעות השבוע</h2>
              <div className="space-y-2">{domainStats.map(s => <DomainHealthCard key={s.domain.id} stat={s} />)}</div>
            </section>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center text-sm text-slate-400">
              <p className="mb-1">📊 אין מטרות שעות</p>
              <a href="/dashboard/settings" className="text-indigo-500 text-xs hover:underline">הגדר בהגדרות →</a>
            </div>
          )}
          <Suspense fallback={null}>
            <div className="bg-white border border-slate-100 rounded-2xl p-3">
              <p className="text-xs text-slate-400 mb-2">יומן Google</p>
              <GoogleCalendarButton />
            </div>
          </Suspense>
        </div>
      </div>

      {showCreateModal && (
        <CreateTaskModal defaultType="today" onClose={() => setShowCreateModal(false)} onCreated={() => { setShowCreateModal(false); load() }} />
      )}
    </div>
  )
}
