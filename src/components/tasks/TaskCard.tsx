'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import EditTaskModal from './EditTaskModal'
import type { Task, TaskStatus } from '@/lib/types'

const priorityColors = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-gray-100 text-gray-500 border-gray-200',
}

const priorityLabels = {
  high: 'גבוה',
  medium: 'בינוני',
  low: 'נמוך',
}

export default function TaskCard({
  task,
  onStatusChange,
  onDelete,
  onEdit,
}: {
  task: Task
  onStatusChange: (id: string, status: TaskStatus) => void
  onDelete: (id: string) => void
  onEdit?: (updated: Task) => void
}) {
  const [loading, setLoading] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
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
    <>
      <div
        className={`bg-white border rounded-2xl p-4 flex items-start gap-3 transition-all hover:shadow-md ${
          isDone ? 'opacity-50 border-gray-100' : 'border-gray-100 shadow-sm'
        }`}
        style={
          !isDone && task.domain?.color
            ? { borderRightColor: task.domain.color, borderRightWidth: 3 }
            : undefined
        }
      >
        {/* Checkbox */}
        <button
          onClick={toggleDone}
          disabled={loading}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition ${
            isDone
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-gray-300 hover:border-indigo-400'
          }`}
        >
          {isDone && <span className="text-white text-xs">✓</span>}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-snug ${isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            {task.title}
          </p>

          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {/* Domain */}
            {task.domain && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: task.domain.color + '18',
                  color: task.domain.color,
                }}
              >
                {task.domain.icon} {task.domain.name}
              </span>
            )}

            {/* Priority */}
            <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[task.priority]}`}>
              {priorityLabels[task.priority]}
            </span>

            {/* Recurring */}
            {task.recurring && task.recurrence_rule && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100">
                🔁 {task.recurrence_rule === 'daily' ? 'יומי' : task.recurrence_rule === 'weekly' ? 'שבועי' : 'חודשי'}
              </span>
            )}

            {/* Deadline */}
            {task.deadline && (
              <span className={`text-xs ${new Date(task.deadline) < new Date() && !isDone ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                📅 {new Date(task.deadline).toLocaleDateString('he-IL')}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={() => setShowEdit(true)}
            className="text-gray-300 hover:text-indigo-500 transition p-1.5 rounded-lg hover:bg-indigo-50 text-sm"
            title="ערוך משימה"
          >
            ✏️
          </button>
          <button
            onClick={handleDelete}
            className="text-gray-300 hover:text-red-400 transition p-1.5 rounded-lg hover:bg-red-50 text-xs font-bold"
            title="מחק משימה"
          >
            ✕
          </button>
        </div>
      </div>

      {showEdit && (
        <EditTaskModal
          task={task}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => {
            setShowEdit(false)
            onEdit?.(updated)
          }}
        />
      )}
    </>
  )
}
