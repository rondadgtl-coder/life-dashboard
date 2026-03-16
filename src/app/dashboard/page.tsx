import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TaskList from '@/components/tasks/TaskList'
import CreateTaskButton from '@/components/tasks/CreateTaskButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]

  const { data: todayTasks } = await supabase
    .from('tasks')
    .select('*, domain:domains(*), project:projects(*)')
    .eq('user_id', user.id)
    .eq('type', 'today')
    .neq('status', 'done')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })

  const { data: overdueTasks } = await supabase
    .from('tasks')
    .select('*, domain:domains(*), project:projects(*)')
    .eq('user_id', user.id)
    .neq('status', 'done')
    .lt('deadline', today)
    .not('deadline', 'is', null)
    .order('deadline', { ascending: true })

  const hebrewDay = new Intl.DateTimeFormat('he-IL', {
    weekday: 'long', day: 'numeric', month: 'long'
  }).format(new Date())

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">היום</h1>
          <p className="text-gray-500 text-sm mt-0.5">{hebrewDay}</p>
        </div>
        <CreateTaskButton defaultType="today" />
      </div>

      {/* Overdue */}
      {overdueTasks && overdueTasks.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-1.5">
            <span>⚠️</span> באיחור ({overdueTasks.length})
          </h2>
          <TaskList tasks={overdueTasks} />
        </div>
      )}

      {/* Today's Tasks */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
          <span>📋</span> משימות להיום ({todayTasks?.length ?? 0})
        </h2>
        {todayTasks && todayTasks.length > 0 ? (
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
