'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Task, TaskStatus } from '@/lib/types'

const priorityColors = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-500',
}

const priorityLabels = {
  high: 'גבוה',
  medium: 'בינוני',
  low: 'נמוך',
}

const statusLabels: Record<TaskStatus, string> = {
  not_started: 'לא התחיל',
  in_progress: 'בתהליך',
  done: 'הושלם',
  paused: 'מושהה',
}

export default function TaskCard({
  task,
  onStatusChange,
  onDelete,
}: {
  task: Task
  onStatusChange: (id: string, status: TaskStatus) => void
  onDelete: (id: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function toggleDone() {
    const newStatus: TaskStatus = task.status === 'done' ? 'not_started' : 'done'
    setLoading(true)
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)
    onStatusChange(task.id, newStatus)
    setLoading(false)
  }

  async function handleDelete() {
    await supabase.from('tasks').delete().eq('id', task.id)
    onDelete(task.id)
  }

  const isDone = task.status === 'done'

  return (
    <div className={`bg-white border rounded-2xl p-4 flex items-start gap-3 transition ${isDone ? 'opacity-50' : 'border-gray-100 shadow-sm hover:shadow-md'}`}>
      {/* Checkbox */}
      <button
        onClick={toggleDone}
        disabled={loading}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition ${
          isDone
            ? 'bg-green-500 border-green-500'
            : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        {isDone && <span className="text-white text-xs">✓</span>}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {task.title}
        </p>

        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          {/* Domain */}
          {task.domain && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: task.domain.color + '20',
                color: task.domain.color,
              }}
            >
              {task.domain.icon} {task.domain.name}
            </span>
          )}

          {/* Project */}
          {task.project && (
            <span className="text-xs text-gray-400">
              {task.project.name}
            </span>
          )}

          {/* Priority */}
          <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[task.priority]}`}>
            {priorityLabels[task.priority]}
          </span>

          {/* Deadline */}
          {task.deadline && (
            <span className="text-xs text-gray-400">
              📅 {new Date(task.deadline).toLocaleDateString('he-IL')}
            </span>
          )}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={handleDelete}
        className="text-gray-300 hover:text-red-400 transition text-sm flex-shrink-0"
      >
        ✕
      </button>
    </div>
  )
}
