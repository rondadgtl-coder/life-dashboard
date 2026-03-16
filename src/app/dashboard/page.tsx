'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import TaskList from '@/components/tasks/TaskList'
import CreateTaskButton from '@/components/tasks/CreateTaskButton'
import type { Task } from '@/lib/types'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([])
  const [hebrewDay, setHebrewDay] = useState('')

  useEffect(() => {
    setHebrewDay(new Intl.DateTimeFormat('he-IL', {
      weekday: 'long', day: 'numeric', month: 'long'
    }).format(new Date()))

    async function load() {
      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: todayData }, { data: overdueData }] = await Promise.all([
        supabase.from('tasks')
          .select('*, domain:domains(*), project:projects(*)')
          .eq('user_id', user.id)
          .eq('type', 'today')
          .neq('status', 'done')
          .order('priority', { ascending: false })
          .order('created_at', { ascending: true }),
        supabase.from('tasks')
          .select('*, domain:domains(*), project:projects(*)')
          .eq('user_id', user.id)
          .neq('status', 'done')
          .lt('deadline', today)
          .not('deadline', 'is', null)
          .order('deadline', { ascending: true }),
      ])

      setTodayTasks((todayData ?? []) as Task[])
      setOverdueTasks((overdueData ?? []) as Task[])
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
          <h1 className="text-2xl font-bold text-gray-900">היום</h1>
          <p className="text-gray-500 text-sm mt-0.5">{hebrewDay}</p>
        </div>
        <CreateTaskButton defaultType="today" />
      </div>

      {overdueTasks.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-1.5">
            <span>⚠️</span> באיחור ({overdueTasks.length})
          </h2>
          <TaskList tasks={overdueTasks} />
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
          <span>📋</span> משימות להיום ({todayTasks.length})
        </h2>
        {todayTasks.length > 0 ? (
          <TaskList tasks={todayTasks} />
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-sm">אין משימות להיום!</p>
            <p className="text-xs mt-1">תוסיף משימה חדשה</p>
          </div>
        )}
      </div>
    </div>
  )
}
