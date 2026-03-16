'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'

export default function GoogleCalendarButton() {
  const [connected, setConnected] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    async function checkStatus() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('users')
        .select('google_calendar_connected')
        .eq('id', user.id)
        .single()

      setConnected(!!data?.google_calendar_connected)
    }
    checkStatus()
  }, [])

  // Show toast on return from OAuth
  useEffect(() => {
    const gcal = searchParams.get('gcal')
    if (gcal === 'connected') setConnected(true)
    if (gcal === 'error') alert('שגיאה בחיבור גוגל קלנדר. נסה שוב.')
  }, [searchParams])

  async function handleDisconnect() {
    setLoading(true)
    await fetch('/api/calendar/sync', { method: 'DELETE' })
    setConnected(false)
    setLoading(false)
  }

  if (connected === null) return null

  if (connected) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
          <span>✅</span>
          <span className="font-medium">גוגל קלנדר מחובר</span>
        </div>
        <button
          onClick={handleDisconnect}
          disabled={loading}
          className="text-xs text-gray-400 hover:text-red-500 transition px-2 py-1.5 rounded-xl hover:bg-red-50"
        >
          נתק
        </button>
      </div>
    )
  }

  return (
    <a
      href="/api/auth/google"
      className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition shadow-sm text-gray-700 hover:border-indigo-300"
    >
      <svg width="16" height="16" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      <span>חבר גוגל קלנדר</span>
    </a>
  )
}
