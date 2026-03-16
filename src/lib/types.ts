export type WeekType = 'A' | 'B'
export type TaskType = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'inbox'
export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'not_started' | 'in_progress' | 'done' | 'paused' | 'waiting' | 'blocked'
export type TaskNature = 'proactive' | 'reactive'
export type SlotStatus = 'free' | 'busy' | 'flexible' | 'office'
export type NotificationType = 'slot_request' | 'slot_conflict'
export type NotificationStatus = 'pending' | 'approved' | 'declined' | 'rescheduled'
export type DomainHealth = 'on_track' | 'needs_attention' | 'neglected' | 'completed'

export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  week_type: WeekType
  google_calendar_connected?: boolean
  created_at: string
}

export interface Domain {
  id: string
  user_id: string
  name: string
  color: string
  icon: string
  archived: boolean
  weekly_hours_goal: number
  created_at: string
}

export interface Project {
  id: string
  domain_id: string
  user_id: string
  name: string
  archived: boolean
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  domain_id: string
  project_id: string
  title: string
  type: TaskType
  priority: TaskPriority
  status: TaskStatus
  task_nature: TaskNature
  is_focus: boolean
  is_inbox: boolean
  deadline?: string
  estimated_duration?: number
  actual_duration?: number
  notes?: string
  recurring: boolean
  recurrence_rule?: string
  google_event_id?: string
  created_at: string
  domain?: Domain
  project?: Project
}

export interface TimeEntry {
  id: string
  user_id: string
  task_id?: string
  domain_id: string
  project_id: string
  started_at: string
  ended_at?: string
  duration_seconds?: number
  domain?: Domain
  project?: Project
}

export interface AvailabilitySlot {
  id: string
  user_id: string
  date: string
  hour: number
  status: SlotStatus
  created_at: string
}

export interface KpiGoal {
  id: string
  user_id: string
  domain_id?: string
  title: string
  current_value: number
  target_value: number
  unit: string
  color: string
  created_at: string
  domain?: Domain
}

export interface Notification {
  id: string
  from_user_id: string
  to_user_id: string
  type: NotificationType
  payload: Record<string, unknown>
  status: NotificationStatus
  created_at: string
}

export interface DomainStat {
  domain: Domain
  hoursThisWeek: number
  health: DomainHealth
}
