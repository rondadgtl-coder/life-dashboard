'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Domain, Project } from '@/lib/types'

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function TimerWidget({ userId }: { userId: string }) {
  const supabase = createClient()
  const [domains, setDomains] = useState<(Domain & { projects: Project[] })[]>([])
  const [domainId, setDomainId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [entryId, setEntryId] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<Date | null>(null)

  useEffect(() => {
    async function loadDomains() {
      const { data: domainsData } = await supabase
        .from('domains')
        .select('*')
        .eq('user_id', userId)
        .eq('archived', false)
        .order('name')
      if (!domainsData) return
      const withProjects = await Promise.all(domainsData.map(async (d) => {
        const { data: projects } = await supabase
          .from('projects')
          .select('*')
          .eq('domain_id', d.id)
          .eq('archived', false)
        return { ...d, projects: projects ?? [] }
      }))
      setDomains(withProjects)
    }
    loadDomains()
  }, [userId])

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
    await supabase.from('time_entries').update({
      ended_at: new Date().toISOString(),
      duration_seconds: elapsed,
    }).eq('id', entryId)
    setRunning(false)
    setEntryId(null)
    setElapsed(0)
    setDomainId('')
    setProjectId('')
  }

  const selectedDomain = domains.find(d => d.id === domainId)
  const projects = selectedDomain?.projects ?? []

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">⏱️ טיימר</span>
        {running && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            רץ
          </span>
        )}
      </div>

      <div className="p-4">
        {/* Clock display */}
        <div
          className={`text-center text-3xl font-mono font-bold mb-4 tracking-wider transition-colors ${
            running ? 'text-emerald-600' : 'text-gray-800'
          }`}
          style={running && selectedDomain ? { color: selectedDomain.color } : undefined}
        >
          {formatDuration(elapsed)}
        </div>

        {running ? (
          <div className="space-y-3">
            {selectedDomain && (
              <div
                className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl"
                style={{ backgroundColor: selectedDomain.color + '15', color: selectedDomain.color }}
              >
                <span>{selectedDomain.icon}</span>
                <span className="font-medium">{selectedDomain.name}</span>
                <span className="text-gray-400 mx-1">·</span>
                <span className="text-gray-600">{projects.find(p => p.id === projectId)?.name}</span>
              </div>
            )}
            <button
              onClick={stopTimer}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition text-sm flex items-center justify-center gap-2"
            >
              <span>⏹</span> עצור
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <select
              value={domainId}
              onChange={e => { setDomainId(e.target.value); setProjectId('') }}
              className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">בחר תחום...</option>
              {domains.map(d => (
                <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
              ))}
            </select>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              disabled={!domainId}
              className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
            >
              <option value="">בחר פרויקט...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button
              onClick={startTimer}
              disabled={!domainId || !projectId}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl transition text-sm flex items-center justify-center gap-2"
            >
              <span>▶</span> התחל טיימר
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
