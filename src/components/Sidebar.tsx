'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/lib/types'

const navItems = [
  { href: '/dashboard', label: 'היום', icon: '☀️' },
  { href: '/dashboard/week', label: 'השבוע', icon: '📅' },
  { href: '/dashboard/tasks', label: 'כל המשימות', icon: '✅' },
  { href: '/dashboard/calendar', label: 'לוח שנה', icon: '📆' },
  { href: '/dashboard/availability', label: 'זמינות משותפת', icon: '🗓️' },
  { href: '/dashboard/domains', label: 'תחומים ופרויקטים', icon: '📂' },
  { href: '/dashboard/timer', label: 'טיימר', icon: '⏱️' },
]

const mobileNavItems = navItems.slice(0, 5)

export default function Sidebar({ user }: { user: User | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <>
      {/* ─── Desktop Sidebar ─────────────────────────────────────────── */}
      <aside className="hidden md:flex w-60 min-h-screen bg-slate-900 flex-col shadow-2xl flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
              L
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide">Life Dashboard</h1>
              <p className="text-xs text-slate-400">ניהול חיים חכם</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(item => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <span className="mr-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/60 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name ?? 'משתמש'}</p>
              {user?.week_type && (
                <p className="text-xs text-slate-400">שבוע {user.week_type}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-right px-3 py-2 text-xs text-slate-500 hover:text-red-400 transition rounded-xl hover:bg-red-900/20"
          >
            התנתקות →
          </button>
        </div>
      </aside>

      {/* ─── Mobile Top Bar ───────────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 right-0 left-0 z-40 bg-slate-900 border-b border-slate-700/50 px-4 h-14 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            L
          </div>
          <span className="text-sm font-bold text-white">Life Dashboard</span>
        </div>
        <div className="flex items-center gap-2">
          {user?.week_type && (
            <span className="text-xs bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
              שבוע {user.week_type}
            </span>
          )}
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
        </div>
      </div>

      {/* ─── Mobile Bottom Nav ────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 right-0 left-0 z-40 bg-slate-900 border-t border-slate-700/50 px-2 h-16 flex items-center justify-around shadow-2xl">
        {mobileNavItems.map(item => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                isActive
                  ? 'text-indigo-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
              {isActive && <span className="w-1 h-1 rounded-full bg-indigo-400 mt-0.5" />}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
