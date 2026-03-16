'use client'

import { useState } from 'react'
import type { Task } from '@/lib/types'
import TaskCard from './TaskCard'

export default function TaskList({ tasks }: { tasks: Task[] }) {
  const [localTasks, setLocalTasks] = useState(tasks)

  function handleStatusChange(taskId: string, newStatus: Task['status']) {
    setLocalTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
    )
  }

  function handleDelete(taskId: string) {
    setLocalTasks(prev => prev.filter(t => t.id !== taskId))
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
