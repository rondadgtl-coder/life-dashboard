'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Task, TaskStatus } from '@/lib/types'
import EditTaskModal from './EditTaskModal'

const priorityDot: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-400',
  low: 'bg-slate-300',
}
const priorityLabel: Record<string, string> = { high: 'גבוה', medium: 'בינוני', low: 'נמוך' }

export default function TaskCard({
  task,
  onStatusChange,
  onDelete,
  onToggleFocus,
  highlight = false,
}: {
  task: Task
  onStatusChange: (id: string, status: TaskStatus) => void
  onDelete: (id: string) => void
  onToggleFocus?: (task: Task) => void
  highlight?: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const supabase = createClient()
  const isDone = task.status === 'done'

  async function toggleDone() {
    const newStatus: TaskStatus = isDone ? 'not_started' : 'done'
    setLoading(true)
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)
    onStatusChange(task.id, newStatus)
    setLoading(false)
  }

  async function handleDelete() {
    if (!confirm('למחוק את המשימה?')) return
    await supabase.from('tasks').delete().eq('id', task.id)
    onDelete(task.id)
  }

  return (
    <>
      <div className={`bg-white border rounded-2xl p-3.5 flex items-start gap-3 transition group ${
        isDone ? 'opacity-60 border-slate-100' : highlight ? 'border-indigo-200 shadow-sm' : 'border-slate-100 shadow-sm hover:shadow-md'
      }`}>
        {/* Checkbox */}
        <button onClick={toggleDone} disabled={loading}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition ${
            isDone ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-indigo-400'
          }`}>
          {isDone && <span className="text-white text-[10px] font-bold">✓</span>}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-snug ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
            {task.title}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {task.domain && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: task.domain.color + '20', color: task.domain.color }}>
                {task.domain.icon} {task.domain.name}
              </span>
            )}
            <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityDot[task.priority]}`} title={priorityLabel[task.priority]} />
            {task.task_nature === 'reactive' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 font-medium">ריאקטיבי</span>
            )}
            {task.deadline && (
              <span className={`text-xs ${new Date(task.deadline) < new Date() && !isDone ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                📅 {new Date(task.deadline).toLocaleDateString('he-IL')}
              </span>
            )}
            {task.status === 'waiting' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-600">ממתין</span>}
            {task.status === 'blocked' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600">חסום</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
          {onToggleFocus && (
            <button onClick={() => onToggleFocus(task)} title="סמן כפוקוס"
              className={`text-base transition ${task.is_focus ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'}`}>
              ⭐
            </button>
          )}
          <button onClick={() => setShowEdit(true)} className="text-slate-300 hover:text-indigo-400 transition text-sm px-1">✎</button>
          <button onClick={handleDelete} className="text-slate-300 hover:text-red-400 transition text-sm px-1">✕</button>
        </div>
      </div>

      {showEdit && (
        <EditTaskModal task={task} onClose={() => setShowEdit(false)} onSaved={(updated) => { onStatusChange(updated.id, updated.status); setShowEdit(false) }} />
      )}
    </>
  )
}
