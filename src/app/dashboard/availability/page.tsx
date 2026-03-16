'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AvailabilityBoard from './AvailabilityBoard'
import type { AvailabilitySlot } from '@/lib/types'

export default function AvailabilityPage() {
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState('')
  const [allUsers, setAllUsers] = useState<{ id: string; name: string }[]>([])
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6)

      const [{ data: usersData }, { data: slotsData }] = await Promise.all([
        supabase.from('users').select('id, name'),
        supabase
          .from('availability_slots')
          .select('*')
          .gte('date', startOfWeek.toISOString().split('T')[0])
          .lte('date', endOfWeek.toISOString().split('T')[0]),
      ])

      setCurrentUserId(user.id)
      setAllUsers(usersData ?? [])
      setSlots((slotsData ?? []) as AvailabilitySlot[])
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
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">זמינות משותפת</h1>
        <p className="text-gray-500 text-sm mt-0.5">סמן את הזמינות שלך — הצד השני רואה רק את הסטטוס</p>
      </div>
      <AvailabilityBoard
        currentUserId={currentUserId}
        allUsers={allUsers}
        initialSlots={slots}
      />
    </div>
  )
}
