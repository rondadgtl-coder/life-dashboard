'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/lib/types'

const navItems = [
  { href: '/dashboard', label: 'היום', icon: '☀️' },
  { href: '/dashboard/week', label: 'השבוע', icon: '📅' },
  { href: '/dashboard/tasks', label: 'כל המשימות', icon: '✅' },
  { href: '/dashboard/availability', label: 'זמינות משותפת', icon: '🗓️' },
  { href: '/dashboard/domains', label: 'תחומים ופרויקטים', icon: '📂' },
  { href: '/dashboard/timer', label: 'טיימר', icon: '⏱️' },
]

export default function Sidebar({ user }: { user: User | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-56 min-h-screen bg-white border-l border-gray-100 flex flex-col shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <p className="text-xs text-gray-400 mb-1">שלום,</p>
        <p className="font-semibold text-gray-900">{user?.name ?? 'משתמש'}</p>
        {user?.week_type && (
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full mt-1 inline-block">
            שבוע {user.week_type}
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full text-right px-3 py-2 text-sm text-gray-500 hover:text-red-500 transition rounded-xl hover:bg-red-50"
        >
          התנתקות
        </button>
      </div>
    </aside>
  )
}
