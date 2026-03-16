'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import TaskList from '@/components/tasks/TaskList'
import CreateTaskButton from '@/components/tasks/CreateTaskButton'
import type { Task } from '@/lib/types'

export default function WeekPage() {
  const [loading, setLoading] = useState(true)
  const [weekTasks, setWeekTasks] = useState<Task[]>([])

  const load = useCallback(async () => {
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
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">השבוע 📅</h1>
            <p className="text-gray-400 text-sm mt-0.5">משימות לשבוע הנוכחי</p>
          </div>
          <CreateTaskButton defaultType="week" onCreated={load} />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-100 rounded-lg w-3/4 mb-3" />
                <div className="h-3 bg-gray-50 rounded-full w-1/2" />
              </div>
            ))}
          </div>
        ) : weekTasks.length > 0 ? (
          <TaskList tasks={weekTasks} onRefresh={load} />
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-5xl mb-3">📅</p>
            <p className="text-sm font-semibold text-gray-700">אין משימות לשבוע</p>
            <p className="text-xs text-gray-400 mt-1">תוסיף משימה חדשה</p>
          </div>
        )}
      </div>
    </div>
  )
}
