'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Domain, Project, Task, TaskType, TaskPriority, TaskStatus, TaskNature } from '@/lib/types'

const typeOptions: { value: TaskType; label: string }[] = [
  { value: 'today', label: 'היום' },
  { value: 'week', label: 'השבוע' },
  { value: 'month', label: 'החודש' },
  { value: 'quarter', label: 'הרבעון' },
  { value: 'year', label: 'השנה' },
  { value: 'inbox', label: 'Inbox' },
]
const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'high', label: '🔴 גבוה' },
  { value: 'medium', label: '🟡 בינוני' },
  { value: 'low', label: '⚪ נמוך' },
]
const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'not_started', label: 'לא התחיל' },
  { value: 'in_progress', label: 'בתהליך' },
  { value: 'done', label: 'הושלם' },
  { value: 'waiting', label: 'ממתין לאחר' },
  { value: 'blocked', label: 'חסום' },
  { value: 'paused', label: 'מושהה' },
]

export default function EditTaskModal({ task, onClose, onSaved }: {
  task: Task
  onClose: () => void
  onSaved: (updated: Task) => void
}) {
  const supabase = createClient()
  const [title, setTitle] = useState(task.title)
  const [type, setType] = useState<TaskType>(task.type)
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [status, setStatus] = useState<TaskStatus>(task.status)
  const [nature, setNature] = useState<TaskNature>(task.task_nature ?? 'proactive')
  const [domainId, setDomainId] = useState(task.domain_id ?? '')
  const [projectId, setProjectId] = useState(task.project_id ?? '')
  const [deadline, setDeadline] = useState(task.deadline ?? '')
  const [notes, setNotes] = useState(task.notes ?? '')
  const [isFocus, setIsFocus] = useState(task.is_focus ?? false)
  const [domains, setDomains] = useState<Domain[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('domains').select('*').eq('archived', false).order('name')
      .then(({ data }) => setDomains(data ?? []))
  }, [])

  useEffect(() => {
    if (!domainId) { setProjects([]); return }
    supabase.from('projects').select('*').eq('domain_id', domainId).eq('archived', false).order('name')
      .then(({ data }) => setProjects(data ?? []))
  }, [domainId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('יש להזין כותרת'); return }
    setLoading(true); setError('')
    const { data, error: err } = await supabase.from('tasks')
      .update({ title, type, priority, status, task_nature: nature, domain_id: domainId || null, project_id: projectId || null, deadline: deadline || null, notes: notes || null, is_focus: isFocus })
      .eq('id', task.id).select('*, domain:domains(*), project:projects(*)').single()
    if (err || !data) { setError('שגיאה בעדכון'); setLoading(false); return }
    // sync google calendar
    fetch('/api/calendar/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', taskId: task.id }) }).catch(() => {})
    onSaved(data as Task)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="font-semibold text-slate-900">עריכת משימה</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">כותרת *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required autoFocus
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">תחום</label>
              <select value={domainId} onChange={e => setDomainId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">ללא תחום</option>
                {domains.map(d => <option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">פרויקט</label>
              <select value={projectId} onChange={e => setProjectId(e.target.value)} disabled={!domainId}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
                <option value="">ללא פרויקט</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">סוג</label>
              <select value={type} onChange={e => setType(e.target.value as TaskType)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">עדיפות</label>
              <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {priorityOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">סטטוס</label>
              <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">אופי</label>
              <select value={nature} onChange={e => setNature(e.target.value as TaskNature)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="proactive">🎯 יזום</option>
                <option value="reactive">🔥 ריאקטיבי</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">דדליין</label>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} dir="ltr"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">הערות</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="הערות..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isFocus} onChange={e => setIsFocus(e.target.checked)} className="rounded" />
            <span className="text-sm text-slate-700">⭐ סמן כפוקוס היום</span>
          </label>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm transition">
              {loading ? 'שומר...' : 'שמור שינויים'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 rounded-xl text-sm transition">
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
