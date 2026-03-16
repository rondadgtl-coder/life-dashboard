'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import TaskCard from '@/components/tasks/TaskCard'
import CreateTaskModal from '@/components/tasks/CreateTaskModal'
import type { Task, TaskType } from '@/lib/types'

type Tab = 'today' | 'week' | 'all' | 'inbox' | 'done'

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'היום', icon: '☀️' },
  { id: 'week',  label: 'השבוע', icon: '📅' },
  { id: 'all',   label: 'הכל',   icon: '📋' },
  { id: 'inbox', label: 'Inbox', icon: '📥' },
  { id: 'done',  label: 'הושלם', icon: '✅' },
]

function TasksContent() {
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as Tab) ?? 'today'
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let query = supabase.from('tasks').select('*, domain:domains(*), project:projects(*)')
      .eq('user_id', user.id).order('is_focus', { ascending: false }).order('priority', { ascending: false })

    if (activeTab === 'today')  query = query.in('type', ['today']).neq('status', 'done')
    if (activeTab === 'week')   query = query.in('type', ['today','week']).neq('status', 'done')
    if (activeTab === 'all')    query = query.neq('status', 'done').neq('is_inbox', true)
    if (activeTab === 'inbox')  query = query.eq('is_inbox', true).neq('status', 'done')
    if (activeTab === 'done')   query = query.eq('status', 'done').order('created_at', { ascending: false }).limit(50)

    const { data } = await query
    setTasks((data ?? []) as Task[])
    setLoading(false)
  }, [activeTab])

  useEffect(() => { load() }, [load])

  function handleStatusChange(id: string, status: Task['status']) {
    if (activeTab !== 'done') {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    } else {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    }
  }
  function handleDelete(id: string) { setTasks(prev => prev.filter(t => t.id !== id)) }
  async function toggleFocus(task: Task) {
    const supabase = createClient()
    await supabase.from('tasks').update({ is_focus: !task.is_focus }).eq('id', task.id)
    load()
  }

  const defaultType: TaskType = activeTab === 'inbox' ? 'inbox' : activeTab === 'week' ? 'week' : 'today'

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-slate-900">משימות</h1>
        <button onClick={() => setShowCreate(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2">
          <span>+</span><span>חדשה</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl mb-5 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            <span>{tab.icon}</span><span>{tab.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-slate-400 text-sm">טוען...</div>
      ) : tasks.length > 0 ? (
        <div className="space-y-2">
          {tasks.map(t => (
            <TaskCard key={t.id} task={t} onStatusChange={handleStatusChange} onDelete={handleDelete} onToggleFocus={toggleFocus} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">{activeTab === 'done' ? '🎉' : activeTab === 'inbox' ? '📥' : '✅'}</p>
          <p className="text-sm">
            {activeTab === 'done' ? 'אין משימות שהושלמו' : activeTab === 'inbox' ? 'ה-Inbox ריק' : 'אין משימות'}
          </p>
        </div>
      )}

      {showCreate && (
        <CreateTaskModal defaultType={defaultType} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load() }} />
      )}
    </div>
  )
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-slate-400">טוען...</div>}>
      <TasksContent />
    </Suspense>
  )
}
