'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import TaskList from '@/components/tasks/TaskList'
import CreateTaskButton from '@/components/tasks/CreateTaskButton'
import type { Task } from '@/lib/types'

const typeLabels: Record<string, { label: string; icon: string }> = {
  today: { label: 'היום', icon: '☀️' },
  week: { label: 'השבוע', icon: '📅' },
  month: { label: 'החודש', icon: '🗓️' },
  quarter: { label: 'הרבעון', icon: '📊' },
  year: { label: 'השנה', icon: '🎯' },
}

export default function AllTasksPage() {
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])

  const load = useCallback(async () => {
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
  }, [])

  useEffect(() => { load() }, [load])

  const grouped = tasks.reduce<Record<string, Task[]>>((acc, task) => {
    const key = task.type
    if (!acc[key]) acc[key] = []
    acc[key]!.push(task)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">כל המשימות</h1>
            <p className="text-gray-400 text-sm mt-0.5">{loading ? '...' : `${tasks.length} משימות פעילות`}</p>
          </div>
          <CreateTaskButton onCreated={load} />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-100 rounded-lg w-3/4 mb-3" />
                <div className="h-3 bg-gray-50 rounded-full w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {Object.keys(typeLabels).map(typeKey => {
              const typeTasks = grouped[typeKey]
              if (!typeTasks || typeTasks.length === 0) return null
              const { label, icon } = typeLabels[typeKey]!
              return (
                <div key={typeKey} className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">{icon}</span>
                    <h2 className="text-sm font-bold text-gray-700">{label}</h2>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{typeTasks.length}</span>
                  </div>
                  <TaskList tasks={typeTasks} onRefresh={load} />
                </div>
              )
            })}

            {tasks.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-5xl mb-3">✅</p>
                <p className="text-sm font-semibold text-gray-700">אין משימות פעילות</p>
                <p className="text-xs text-gray-400 mt-1">כל הכבוד!</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
