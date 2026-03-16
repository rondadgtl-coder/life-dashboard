import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TaskList from '@/components/tasks/TaskList'
import CreateTaskButton from '@/components/tasks/CreateTaskButton'

const typeLabels: Record<string, string> = {
  today: 'היום',
  week: 'השבוע',
  month: 'החודש',
  quarter: 'הרבעון',
  year: 'השנה',
}

export default async function AllTasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, domain:domains(*), project:projects(*)')
    .eq('user_id', user.id)
    .neq('status', 'done')
    .order('type', { ascending: true })
    .order('priority', { ascending: false })

  const grouped = (tasks ?? []).reduce<Record<string, typeof tasks>>((acc, task) => {
    if (!task) return acc
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
          <p className="text-gray-500 text-sm mt-0.5">{tasks?.length ?? 0} משימות פעילות</p>
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
            <TaskList tasks={typeTasks as Parameters<typeof TaskList>[0]['tasks']} />
          </div>
        )
      })}

      {(!tasks || tasks.length === 0) && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-sm">אין משימות פעילות</p>
        </div>
      )}
    </div>
  )
}
