'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import DomainsClient from './DomainsClient'
import type { Domain, Project } from '@/lib/types'

type DomainWithProjects = Domain & { projects: Project[] }

export default function DomainsPage() {
  const [loading, setLoading] = useState(true)
  const [domains, setDomains] = useState<DomainWithProjects[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('domains')
        .select('*, projects(*)')
        .eq('user_id', user.id)
        .eq('archived', false)
        .order('name')

      setDomains((data ?? []) as DomainWithProjects[])
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
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">תחומים ופרויקטים</h1>
        <p className="text-gray-500 text-sm mt-0.5">נהל את התחומים והפרויקטים שלך</p>
      </div>
      <DomainsClient initialDomains={domains} />
    </div>
  )
}
