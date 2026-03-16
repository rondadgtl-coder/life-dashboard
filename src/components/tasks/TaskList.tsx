'use client'

import { useState } from 'react'
import type { Task } from '@/lib/types'
import TaskCard from './TaskCard'

export default function TaskList({
  tasks,
  onRefresh,
}: {
  tasks: Task[]
  onRefresh?: () => void
}) {
  const [localTasks, setLocalTasks] = useState(tasks)

  function handleStatusChange(taskId: string, newStatus: Task['status']) {
    setLocalTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
    )
  }

  function handleDelete(taskId: string) {
    setLocalTasks(prev => prev.filter(t => t.id !== taskId))
    onRefresh?.()
  }

  function handleEdit(updatedTask: Task) {
    setLocalTasks(prev =>
      prev.map(t => t.id === updatedTask.id ? updatedTask : t)
    )
    onRefresh?.()
  }

  return (
    <div className="space-y-2">
      {localTasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      ))}
    </div>
  )
}
