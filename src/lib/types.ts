export type WeekType = 'A' | 'B'
export type TaskType = 'today' | 'week' | 'month' | 'quarter' | 'year'
export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'not_started' | 'in_progress' | 'done' | 'paused'
export type SlotStatus = 'free' | 'busy' | 'flexible' | 'office'
export type NotificationType = 'slot_request' | 'slot_conflict'
export type NotificationStatus = 'pending' | 'approved' | 'declined' | 'rescheduled'

export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  week_type: WeekType
  created_at: string
}

export interface Domain {
  id: string
  user_id: string
  name: string
  color: string
  icon: string
  archived: boolean
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
  deadline?: string
  estimated_duration?: number
  actual_duration?: number
  notes?: string
  recurring: boolean
  recurrence_rule?: string
  created_at: string
  domain?: Domain
  project?: Project
}

export interface TimeEntry {
  id: string
  user_id: string
  task_id: string
  domain_id: string
  project_id: string
  started_at: string
  ended_at?: string
  duration_seconds?: number
}

export interface AvailabilitySlot {
  id: string
  user_id: string
  date: string
  hour: number
  status: SlotStatus
  created_at: string
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
