'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import TaskList from '@/components/tasks/TaskList'
import CreateTaskButton from '@/components/tasks/CreateTaskButton'
import type { Task } from '@/lib/types'

export default function WeekPage() {
  const [loading, setLoading] = useState(true)
  const [weekTasks, setWeekTasks] = useState<Task[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('tasks')
        .select('*, domain:domains(*), project:projects(*)')
        .eq('user_id', user.id)
        .eq('type', 'week')
        .neq('status', 'done')
        .order('priority', { ascending: false })

      setWeekTasks((data ?? []) as Task[])
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

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">השבוע</h1>
          <p className="text-gray-500 text-sm mt-0.5">משימות לשבוע הנוכחי</p>
        </div>
        <CreateTaskButton defaultType="week" />
      </div>

      {weekTasks.length > 0 ? (
        <TaskList tasks={weekTasks} />
      ) : (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-sm">אין משימות לשבוע</p>
        </div>
      )}
    </div>
  )
}
