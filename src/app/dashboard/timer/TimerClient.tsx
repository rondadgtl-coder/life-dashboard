'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Domain, Project } from '@/lib/types'

type DomainWithProjects = Domain & { projects: Project[] }

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function TimerClient({
  userId,
  domains,
  recentEntries,
}: {
  userId: string
  domains: DomainWithProjects[]
  recentEntries: Record<string, unknown>[]
}) {
  const supabase = createClient()
  const [domainId, setDomainId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [entryId, setEntryId] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<Date | null>(null)

  const projects = domains.find(d => d.id === domainId)?.projects ?? []

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setElapsed(Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000))
        }
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  async function startTimer() {
    if (!domainId || !projectId) return
    const startedAt = new Date()
    startTimeRef.current = startedAt
    const { data } = await supabase.from('time_entries').insert({
      user_id: userId,
      domain_id: domainId,
      project_id: projectId,
      started_at: startedAt.toISOString(),
    }).select().single()
    if (data) {
      setEntryId(data.id)
      setRunning(true)
      setElapsed(0)
    }
  }

  async function stopTimer() {
    if (!entryId) return
    const endedAt = new Date()
    const duration = elapsed
    await supabase.from('time_entries').update({
      ended_at: endedAt.toISOString(),
      duration_seconds: duration,
    }).eq('id', entryId)
    setRunning(false)
    setEntryId(null)
    setElapsed(0)
    window.location.reload()
  }

  const selectedDomain = domains.find(d => d.id === domainId)

  return (
    <div className="space-y-6">
      {/* Timer card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm text-center">
        <div className="text-5xl font-mono font-bold text-gray-900 mb-6 tracking-wider">
          {formatDuration(elapsed)}
        </div>

        {!running ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-right">תחום</label>
                <select
                  value={domainId}
                  onChange={e => { setDomainId(e.target.value); setProjectId('') }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">בחר תחום...</option>
                  {domains.map(d => (
                    <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-right">פרויקט</label>
                <select
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  disabled={!domainId}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50"
                >
                  <option value="">בחר פרויקט...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={startTimer}
              disabled={!domainId || !projectId}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition text-lg"
            >
              ▶ התחל
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDomain && (
              <p className="text-sm text-gray-500">
                <span style={{ color: selectedDomain.color }}>{selectedDomain.icon} {selectedDomain.name}</span>
                {' · '}{projects.find(p => p.id === projectId)?.name}
              </p>
            )}
            <button
              onClick={stopTimer}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition text-lg"
            >
              ■ עצור
            </button>
          </div>
        )}
      </div>

      {/* Recent entries */}
      {recentEntries.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 mb-2">רשומות אחרונות</h2>
          <div className="space-y-2">
            {recentEntries.map((entry: Record<string, unknown>) => {
              const domain = entry.domain as { name: string; color: string; icon: string } | null
              const project = entry.project as { name: string } | null
              const duration = entry.duration_seconds as number
              const startedAt = new Date(entry.started_at as string)
              return (
                <div key={entry.id as string} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
                  <div>
                    {domain && (
                      <span className="text-xs font-medium" style={{ color: domain.color }}>
                        {domain.icon} {domain.name}
                      </span>
                    )}
                    {project && <span className="text-xs text-gray-400 mr-2">{project.name}</span>}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {startedAt.toLocaleDateString('he-IL')} {startedAt.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="font-mono text-sm font-semibold text-gray-700">
                    {formatDuration(duration ?? 0)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
