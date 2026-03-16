export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DomainsClient from './DomainsClient'

export default async function DomainsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: domains } = await supabase
    .from('domains')
    .select('*, projects(*)')
    .eq('user_id', user.id)
    .eq('archived', false)
    .order('name')

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">תחומים ופרויקטים</h1>
        <p className="text-gray-500 text-sm mt-0.5">נהל את התחומים והפרויקטים שלך</p>
      </div>
      <DomainsClient initialDomains={domains ?? []} />
    </div>
  )
}
