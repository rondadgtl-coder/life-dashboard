export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AvailabilityBoard from './AvailabilityBoard'

export default async function AvailabilityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get all users (both Saar and Bar)
  const { data: allUsers } = await supabase.from('users').select('id, name')

  // Get slots for this week for all users
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1) // Monday
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(endOfWeek.getDate() + 6)

  const { data: slots } = await supabase
    .from('availability_slots')
    .select('*')
    .gte('date', startOfWeek.toISOString().split('T')[0])
    .lte('date', endOfWeek.toISOString().split('T')[0])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">זמינות משותפת</h1>
        <p className="text-gray-500 text-sm mt-0.5">סמן את הזמינות שלך — הצד השני רואה רק את הסטטוס</p>
      </div>
      <AvailabilityBoard
        currentUserId={user.id}
        allUsers={allUsers ?? []}
        initialSlots={slots ?? []}
      />
    </div>
  )
}
