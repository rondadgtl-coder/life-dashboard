import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TaskList from '@/components/tasks/TaskList'
import CreateTaskButton from '@/components/tasks/CreateTaskButton'

export default async function WeekPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: weekTasks } = await supabase
    .from('tasks')
    .select('*, domain:domains(*), project:projects(*)')
    .eq('user_id', user.id)
    .eq('type', 'week')
    .neq('status', 'done')
    .order('priority', { ascending: false })

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">השבוע</h1>
          <p className="text-gray-500 text-sm mt-0.5">משימות לשבוע הנוכחי</p>
        </div>
        <CreateTaskButton defaultType="week" />
      </div>

      {weekTasks && weekTasks.length > 0 ? (
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
