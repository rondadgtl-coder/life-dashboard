'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import TaskList from '@/components/tasks/TaskList'
import CreateTaskButton from '@/components/tasks/CreateTaskButton'
import type { Task } from '@/lib/types'

const typeLabels: Record<string, string> = {
  today: 'היום',
  week: 'השבוע',
  month: 'החודש',
  quarter: 'הרבעון',
  year: 'השנה',
}

export default function AllTasksPage() {
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('tasks')
        .select('*, domain:domains(*), project:projects(*)')
        .eq('user_id', user.id)
        .neq('status', 'done')
        .order('type', { ascending: true })
        .order('priority', { ascending: false })

      setTasks((data ?? []) as Task[])
      setLoading(false)
    }

    load()
  }, [])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-48 text-gray-400">
        <span className="text-sm">טוען...</span>
      </div>
    )
  }

  const grouped = tasks.reduce<Record<string, Task[]>>((acc, task) => {
    const key = task.type
    if (!acc[key]) acc[key] = []
    acc[key]!.push(task)
    return acc
  }, {})

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">כל המשימות</h1>
          <p className="text-gray-500 text-sm mt-0.5">{tasks.length} משימות פעילות</p>
        </div>
        <CreateTaskButton />
      </div>

      {Object.keys(typeLabels).map(typeKey => {
        const typeTasks = grouped[typeKey]
        if (!typeTasks || typeTasks.length === 0) return null
        return (
          <div key={typeKey} className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 mb-2">
              {typeLabels[typeKey]} ({typeTasks.length})
            </h2>
            <TaskList tasks={typeTasks} />
          </div>
        )
      })}

      {tasks.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-sm">אין משימות פעילות</p>
        </div>
      )}
    </div>
  )
}
