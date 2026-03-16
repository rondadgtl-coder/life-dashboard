import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TimerClient from './TimerClient'

export default async function TimerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: domains } = await supabase
    .from('domains')
    .select('*, projects(*)')
    .eq('user_id', user.id)
    .eq('archived', false)
    .order('name')

  const { data: recentEntries } = await supabase
    .from('time_entries')
    .select('*, domain:domains(name, color, icon), project:projects(name)')
    .eq('user_id', user.id)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false })
    .limit(10)

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">טיימר</h1>
        <p className="text-gray-500 text-sm mt-0.5">מעקב שעות לפי תחום ופרויקט</p>
      </div>
      <TimerClient
        userId={user.id}
        domains={domains ?? []}
        recentEntries={recentEntries ?? []}
      />
    </div>
  )
}
