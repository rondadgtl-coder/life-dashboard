import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getAccessToken(refreshToken: string): Promise<string | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  return data.access_token ?? null
}

function taskToCalendarEvent(task: {
  title: string
  deadline: string
  priority: string
  domain?: { name: string; icon: string } | null
  notes?: string | null
}) {
  const startDate = task.deadline
  // All-day event
  return {
    summary: `${task.domain?.icon ?? ''} ${task.title}`.trim(),
    description: [
      task.domain ? `תחום: ${task.domain.name}` : '',
      task.priority === 'high' ? '⚡ עדיפות גבוהה' : task.priority === 'medium' ? 'עדיפות בינונית' : '',
      task.notes ?? '',
    ].filter(Boolean).join('\n'),
    start: { date: startDate },
    end: { date: startDate },
    colorId: task.priority === 'high' ? '11' : task.priority === 'medium' ? '5' : '1',
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    action: 'create' | 'update' | 'delete'
    taskId: string
  }

  // Get user's refresh token
  const { data: profile } = await supabase
    .from('users')
    .select('google_refresh_token')
    .eq('id', user.id)
    .single()

  if (!profile?.google_refresh_token) {
    return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 })
  }

  const accessToken = await getAccessToken(profile.google_refresh_token)
  if (!accessToken) {
    return NextResponse.json({ error: 'Failed to get access token' }, { status: 401 })
  }

  // Get task details
  const { data: task } = await supabase
    .from('tasks')
    .select('*, domain:domains(*)')
    .eq('id', body.taskId)
    .single()

  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  const calendarBase = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }

  if (body.action === 'delete') {
    if (task.google_event_id) {
      await fetch(`${calendarBase}/${task.google_event_id}`, { method: 'DELETE', headers })
      await supabase.from('tasks').update({ google_event_id: null }).eq('id', task.id)
    }
    return NextResponse.json({ ok: true })
  }

  if (!task.deadline) {
    return NextResponse.json({ ok: true, skipped: 'no deadline' })
  }

  const eventBody = taskToCalendarEvent(task as {
    title: string
    deadline: string
    priority: string
    domain?: { name: string; icon: string } | null
    notes?: string | null
  })

  if (body.action === 'create' || !task.google_event_id) {
    // Create new event
    const res = await fetch(calendarBase, {
      method: 'POST',
      headers,
      body: JSON.stringify(eventBody),
    })
    const event = await res.json()
    if (event.id) {
      await supabase.from('tasks').update({ google_event_id: event.id }).eq('id', task.id)
    }
  } else if (body.action === 'update' && task.google_event_id) {
    // Update existing event
    await fetch(`${calendarBase}/${task.google_event_id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(eventBody),
    })
  }

  return NextResponse.json({ ok: true })
}

// Disconnect Google Calendar
export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase
    .from('users')
    .update({ google_refresh_token: null, google_calendar_connected: false })
    .eq('id', user.id)

  return NextResponse.json({ ok: true })
}
