'use client'

import { useState } from 'react'

const mockTasks = [
  { id: '1', title: 'לבדוק קמפיין גוגל אדס', domain: 'רונדה דיגיטל', domainColor: '#10B981', project: 'SpaceBook', priority: 'high', status: 'not_started', deadline: null },
  { id: '2', title: 'פגישה עם לקוח חדש', domain: 'רונדה דיגיטל', domainColor: '#10B981', project: 'Client X', priority: 'high', status: 'in_progress', deadline: '2026-03-17' },
  { id: '3', title: 'לשלוח הצעת מחיר פאדל קורט', domain: 'פאדלינג', domainColor: '#F59E0B', project: 'פרויקט חיפה', priority: 'medium', status: 'not_started', deadline: null },
  { id: '4', title: 'לסיים דוח חודשי', domain: 'טלפרפורמנס', domainColor: '#3B82F6', project: 'כללי', priority: 'medium', status: 'not_started', deadline: '2026-03-16' },
  { id: '5', title: 'לשחק עם כרמי', domain: 'אישי / משפחה', domainColor: '#EC4899', project: 'כרמי', priority: 'high', status: 'not_started', deadline: null },
]

const overdueTasks = [
  { id: '6', title: 'לעדכן אתר padeling.co.il', domain: 'פאדלינג', domainColor: '#F59E0B', project: 'padeling.co.il', priority: 'low', status: 'not_started', deadline: '2026-03-12' },
]

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-500',
}
const priorityLabels: Record<string, string> = { high: 'גבוה', medium: 'בינוני', low: 'נמוך' }

const navItems = [
  { id: 'today', label: 'היום', icon: '☀️' },
  { id: 'week', label: 'השבוע', icon: '📅' },
  { id: 'tasks', label: 'כל המשימות', icon: '✅' },
  { id: 'availability', label: 'זמינות משותפת', icon: '🗓️' },
  { id: 'domains', label: 'תחומים ופרויקטים', icon: '📂' },
  { id: 'timer', label: 'טיימר', icon: '⏱️' },
]

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8)
const DAYS = ['ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳', 'א׳']

const mockSlotsSaar: Record<string, string> = {
  '8': 'office', '9': 'office', '10': 'office', '11': 'busy', '12': 'busy',
  '14': 'free', '15': 'free', '16': 'flexible', '20': 'free', '21': 'free',
}
const mockSlotsBar: Record<string, string> = {
  '9': 'busy', '10': 'busy', '11': 'busy', '12': 'flexible',
  '15': 'free', '16': 'free', '17': 'free', '19': 'free',
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  free:     { label: 'פנוי',  bg: 'bg-green-100',  color: 'text-green-700' },
  busy:     { label: 'תפוס',  bg: 'bg-red-100',    color: 'text-red-700' },
  flexible: { label: 'גמיש',  bg: 'bg-yellow-100', color: 'text-yellow-700' },
  office:   { label: 'משרד',  bg: 'bg-blue-100',   color: 'text-blue-700' },
}

const mockDomains = [
  { id: '1', name: 'טלפרפורמנס', color: '#3B82F6', icon: '💼', projects: ['כללי', 'דוחות'] },
  { id: '2', name: 'רונדה דיגיטל', color: '#10B981', icon: '🚀', projects: ['SpaceBook', 'AccuPOS', 'Client X'] },
  { id: '3', name: 'פאדלינג', color: '#F59E0B', icon: '🎾', projects: ['פרויקט חיפה', 'בית ברל', 'padeling.co.il'] },
  { id: '4', name: 'AI / דרופשיפינג', color: '#8B5CF6', icon: '🤖', projects: [] },
  { id: '5', name: 'אישי / משפחה', color: '#EC4899', icon: '🏠', projects: ['כרמי', 'בית'] },
]

function TaskCard({ task, onDone }: { task: typeof mockTasks[0]; onDone: (id: string) => void }) {
  const [done, setDone] = useState(false)
  return (
    <div className={`bg-white border rounded-2xl p-4 flex items-start gap-3 shadow-sm transition ${done ? 'opacity-40' : 'border-gray-100'}`}>
      <button
        onClick={() => { setDone(!done); if (!done) onDone(task.id) }}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition ${done ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-blue-400'}`}
      >
        {done && <span className="text-white text-xs">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</p>
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: task.domainColor + '20', color: task.domainColor }}>
            {task.domain}
          </span>
          <span className="text-xs text-gray-400">{task.project}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[task.priority]}`}>{priorityLabels[task.priority]}</span>
          {task.deadline && <span className="text-xs text-gray-400">📅 {new Date(task.deadline).toLocaleDateString('he-IL')}</span>}
        </div>
      </div>
    </div>
  )
}

export default function DemoClient() {
  const [activeNav, setActiveNav] = useState('today')
  const [tasks, setTasks] = useState(mockTasks)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerSec, setTimerSec] = useState(0)
  const [timerRef, setTimerRef] = useState<ReturnType<typeof setInterval> | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  function handleDone(id: string) {
    setTimeout(() => setTasks(prev => prev.filter(t => t.id !== id)), 600)
  }

  function startTimer() {
    const ref = setInterval(() => setTimerSec(s => s + 1), 1000)
    setTimerRef(ref); setTimerRunning(true)
  }
  function stopTimer() {
    if (timerRef) clearInterval(timerRef)
    setTimerRunning(false); setTimerSec(0)
  }
  function formatTimer(s: number) {
    return `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
  }

  const hebrewDate = new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans" dir="rtl">
      {/* Sidebar */}
      <aside className="w-56 min-h-screen bg-white border-l border-gray-100 flex flex-col shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <p className="text-xs text-gray-400 mb-1">שלום,</p>
          <p className="font-semibold text-gray-900">סער גבזה</p>
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full mt-1 inline-block">שבוע A</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition text-right ${activeNav === item.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
              <span>{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <button className="w-full text-right px-3 py-2 text-sm text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition">התנתקות</button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">

        {/* TODAY */}
        {activeNav === 'today' && (
          <div className="p-6 max-w-3xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">היום</h1>
                <p className="text-gray-500 text-sm mt-0.5">{hebrewDate}</p>
              </div>
              <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition">+ משימה חדשה</button>
            </div>
            {overdueTasks.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-red-600 mb-2">⚠️ באיחור ({overdueTasks.length})</h2>
                <div className="space-y-2">{overdueTasks.map(t => <TaskCard key={t.id} task={t} onDone={() => {}} />)}</div>
              </div>
            )}
            <div>
              <h2 className="text-sm font-semibold text-gray-500 mb-2">📋 משימות להיום ({tasks.length})</h2>
              <div className="space-y-2">{tasks.map(t => <TaskCard key={t.id} task={t} onDone={handleDone} />)}</div>
            </div>
          </div>
        )}

        {/* AVAILABILITY */}
        {activeNav === 'availability' && (
          <div className="p-6 max-w-5xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">זמינות משותפת</h1>
              <p className="text-gray-500 text-sm mt-0.5">לחץ על תא לשינוי הסטטוס שלך</p>
            </div>
            <div className="flex gap-4 mb-4 flex-wrap">
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <div key={k} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded ${v.bg}`} />
                  <span className="text-xs text-gray-500">{v.label}</span>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[600px] space-y-4">
                {/* Saar */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">הזמינות שלי — סער</p>
                  <div className="grid grid-cols-[50px_repeat(7,1fr)] gap-1 mb-1">
                    <div />{DAYS.map((d,i) => <div key={i} className="text-center text-xs font-semibold text-gray-500">{d}</div>)}
                  </div>
                  {HOURS.map(h => (
                    <div key={h} className="grid grid-cols-[50px_repeat(7,1fr)] gap-1 mb-0.5">
                      <div className="text-xs text-gray-400 flex items-center justify-end pl-1">{h}:00</div>
                      {DAYS.map((_, di) => {
                        const s = di === 0 ? mockSlotsSaar[String(h)] : di === 1 ? (h >= 9 && h <= 13 ? 'busy' : h >= 15 ? 'free' : undefined) : undefined
                        const cfg = s ? STATUS_CONFIG[s] : null
                        return <div key={di} className={`h-8 rounded-lg text-xs flex items-center justify-center font-medium transition cursor-pointer hover:opacity-80 ${cfg ? `${cfg.bg} ${cfg.color}` : 'bg-gray-50 text-gray-300'}`}>{cfg ? cfg.label[0] : '·'}</div>
                      })}
                    </div>
                  ))}
                </div>
                {/* Bar */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">זמינות בר (צפייה בלבד)</p>
                  {HOURS.map(h => (
                    <div key={h} className="grid grid-cols-[50px_repeat(7,1fr)] gap-1 mb-0.5">
                      <div className="text-xs text-gray-400 flex items-center justify-end pl-1">{h}:00</div>
                      {DAYS.map((_, di) => {
                        const s = di === 0 ? mockSlotsBar[String(h)] : di === 2 ? (h >= 10 && h <= 16 ? 'busy' : undefined) : undefined
                        const cfg = s ? STATUS_CONFIG[s] : null
                        return <div key={di} className={`h-8 rounded-lg text-xs flex items-center justify-center ${cfg ? `${cfg.bg} ${cfg.color}` : 'bg-gray-50 text-gray-200'}`}>{cfg ? cfg.label[0] : '·'}</div>
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DOMAINS */}
        {activeNav === 'domains' && (
          <div className="p-6 max-w-3xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">תחומים ופרויקטים</h1>
            </div>
            <div className="space-y-3">
              {mockDomains.map(d => (
                <div key={d.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span>{d.icon}</span>
                    <span className="font-semibold text-sm px-2 py-0.5 rounded-full" style={{ backgroundColor: d.color + '20', color: d.color }}>{d.name}</span>
                    <span className="text-xs text-gray-400">{d.projects.length} פרויקטים</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mr-4">
                    {d.projects.map(p => (
                      <span key={p} className="text-xs bg-gray-50 text-gray-600 px-3 py-1.5 rounded-xl">{p}</span>
                    ))}
                    <button className="text-xs text-gray-300 hover:text-blue-500 px-3 py-1.5 transition">+ פרויקט</button>
                  </div>
                </div>
              ))}
              <button className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-4 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition">
                + הוסף תחום חדש
              </button>
            </div>
          </div>
        )}

        {/* TIMER */}
        {activeNav === 'timer' && (
          <div className="p-6 max-w-2xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">טיימר</h1>
              <p className="text-gray-500 text-sm mt-0.5">מעקב שעות לפי תחום ופרויקט</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm text-center">
              <div className="text-5xl font-mono font-bold text-gray-900 mb-6 tracking-wider">{formatTimer(timerSec)}</div>
              {!timerRunning ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white">
                      <option>🚀 רונדה דיגיטל</option>
                      {mockDomains.map(d => <option key={d.id}>{d.icon} {d.name}</option>)}
                    </select>
                    <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white">
                      <option>SpaceBook</option><option>AccuPOS</option><option>Client X</option>
                    </select>
                  </div>
                  <button onClick={startTimer} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl text-lg transition">▶ התחל</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-green-600">🚀 רונדה דיגיטל · SpaceBook</p>
                  <button onClick={stopTimer} className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl text-lg transition">■ עצור</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* WEEK / TASKS - simple placeholder */}
        {(activeNav === 'week' || activeNav === 'tasks') && (
          <div className="p-6 max-w-3xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">{activeNav === 'week' ? 'השבוע' : 'כל המשימות'}</h1>
              <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl">+ משימה חדשה</button>
            </div>
            <div className="space-y-2">
              {[...mockTasks, ...overdueTasks].map(t => <TaskCard key={t.id} task={t} onDone={() => {}} />)}
            </div>
          </div>
        )}
      </main>

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">משימה חדשה</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <input autoFocus value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
                placeholder="מה צריך לעשות?" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="grid grid-cols-2 gap-3">
                <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">בחר תחום...</option>
                  {mockDomains.map(d => <option key={d.id}>{d.icon} {d.name}</option>)}
                </select>
                <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">בחר פרויקט...</option>
                  <option>SpaceBook</option><option>AccuPOS</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>היום</option><option>השבוע</option><option>החודש</option>
                </select>
                <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>בינוני</option><option>גבוה</option><option>נמוך</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { if (newTaskTitle) { setTasks(p => [...p, { id: Date.now()+'', title: newTaskTitle, domain: 'רונדה דיגיטל', domainColor: '#10B981', project: 'SpaceBook', priority: 'medium', status: 'not_started', deadline: null }]); setNewTaskTitle(''); setShowModal(false); setActiveNav('today') } }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl text-sm transition">צור משימה</button>
                <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl text-sm transition">ביטול</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
