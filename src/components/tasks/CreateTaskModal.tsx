'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Domain, Project, TaskType, TaskPriority } from '@/lib/types'

const typeOptions: { value: TaskType; label: string }[] = [
  { value: 'today', label: 'היום' },
  { value: 'week', label: 'השבוע' },
  { value: 'month', label: 'החודש' },
  { value: 'quarter', label: 'הרבעון' },
  { value: 'year', label: 'השנה' },
]

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'high', label: 'גבוה' },
  { value: 'medium', label: 'בינוני' },
  { value: 'low', label: 'נמוך' },
]

export default function CreateTaskModal({
  defaultType,
  onClose,
  onCreated,
}: {
  defaultType?: TaskType
  onClose: () => void
  onCreated: () => void
}) {
  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [type, setType] = useState<TaskType>(defaultType ?? 'today')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [domainId, setDomainId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [deadline, setDeadline] = useState('')
  const [notes, setNotes] = useState('')
  const [recurring, setRecurring] = useState(false)
  const [recurrenceRule, setRecurrenceRule] = useState('weekly')
  const [domains, setDomains] = useState<Domain[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchDomains() {
      const { data } = await supabase.from('domains').select('*').eq('archived', false).order('name')
      setDomains(data ?? [])
    }
    fetchDomains()
  }, [])

  useEffect(() => {
    if (!domainId) { setProjects([]); setProjectId(''); return }
    async function fetchProjects() {
      const { data } = await supabase.from('projects').select('*').eq('domain_id', domainId).eq('archived', false).order('name')
      setProjects(data ?? [])
      setProjectId('')
    }
    fetchProjects()
  }, [domainId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!domainId) { setError('יש לבחור תחום'); return }
    if (!projectId) { setError('יש לבחור פרויקט'); return }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: insertError } = await supabase.from('tasks').insert({
      user_id: user.id,
      title,
      type,
      priority,
      domain_id: domainId,
      project_id: projectId,
      deadline: deadline || null,
      notes: notes || null,
      status: 'not_started',
      recurring,
      recurrence_rule: recurring ? recurrenceRule : null,
    })

    if (insertError) {
      setError('שגיאה ביצירת המשימה')
      setLoading(false)
    } else {
      // Auto-sync to Google Calendar if deadline is set
      if (deadline) {
        const { data: newTask } = await supabase
          .from('tasks')
          .select('id')
          .eq('user_id', user.id)
          .eq('title', title)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        if (newTask) {
          fetch('/api/calendar/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', taskId: newTask.id }),
          }).catch(() => {}) // fire & forget, don't block UI
        }
      }
      onCreated()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="font-semibold text-gray-900">✨ משימה חדשה</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">כותרת *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="מה צריך לעשות?"
            />
          </div>

          {/* Domain */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תחום *</label>
            <select
              value={domainId}
              onChange={e => setDomainId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">בחר תחום...</option>
              {domains.map(d => <option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
            </select>
          </div>

          {/* Project */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">פרויקט *</label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              disabled={!domainId}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:opacity-50"
            >
              <option value="">בחר פרויקט...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Type + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סוג</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as TaskType)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">עדיפות</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {priorityOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">דדליין (אופציונלי)</label>
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              dir="ltr"
            />
          </div>

          {/* Recurring */}
          <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={recurring}
                onChange={e => setRecurring(e.target.checked)}
                className="w-4 h-4 rounded accent-purple-600"
              />
              <span className="text-sm font-medium text-purple-800">🔁 משימה חוזרת</span>
            </label>
            {recurring && (
              <div className="mt-3">
                <select
                  value={recurrenceRule}
                  onChange={e => setRecurrenceRule(e.target.value)}
                  className="w-full border border-purple-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="daily">כל יום</option>
                  <option value="weekly">כל שבוע</option>
                  <option value="monthly">כל חודש</option>
                </select>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">הערות (אופציונלי)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="הערות נוספות..."
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm transition"
            >
              {loading ? 'שומר...' : 'צור משימה'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl text-sm transition"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
