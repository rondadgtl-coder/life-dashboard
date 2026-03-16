'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import TimerClient from './TimerClient'
import type { Domain, Project } from '@/lib/types'

type DomainWithProjects = Domain & { projects: Project[] }

export default function TimerPage() {
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [domains, setDomains] = useState<DomainWithProjects[]>([])
  const [recentEntries, setRecentEntries] = useState<Record<string, unknown>[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: domainsData }, { data: entriesData }] = await Promise.all([
        supabase
          .from('domains')
          .select('*, projects(*)')
          .eq('user_id', user.id)
          .eq('archived', false)
          .order('name'),
        supabase
          .from('time_entries')
          .select('*, domain:domains(name, color, icon), project:projects(name)')
          .eq('user_id', user.id)
          .not('ended_at', 'is', null)
          .order('started_at', { ascending: false })
          .limit(10),
      ])

      setUserId(user.id)
      setDomains((domainsData ?? []) as DomainWithProjects[])
      setRecentEntries(entriesData ?? [])
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
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">טיימר</h1>
        <p className="text-gray-500 text-sm mt-0.5">מעקב שעות לפי תחום ופרויקט</p>
      </div>
      <TimerClient
        userId={userId}
        domains={domains}
        recentEntries={recentEntries}
      />
    </div>
  )
}
