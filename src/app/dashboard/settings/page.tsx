'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Domain } from '@/lib/types'

const colorOptions = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899']

export default function SettingsPage() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editGoal, setEditGoal] = useState<number>(0)
  const [saving, setSaving] = useState(false)
  const [newDomain, setNewDomain] = useState({ name: '', icon: '📁', color: '#6366f1' })
  const [showNewForm, setShowNewForm] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('domains').select('*').eq('user_id', user.id).eq('archived', false).order('name')
      setDomains((data ?? []) as Domain[])
      setLoading(false)
    }
    load()
  }, [])

  async function saveGoal(domainId: string) {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('domains').update({ weekly_hours_goal: editGoal }).eq('id', domainId)
    setDomains(prev => prev.map(d => d.id === domainId ? { ...d, weekly_hours_goal: editGoal } : d))
    setEditingId(null); setSaving(false)
  }

  async function createDomain() {
    if (!newDomain.name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('domains').insert({ user_id: user.id, name: newDomain.name, icon: newDomain.icon, color: newDomain.color, archived: false, weekly_hours_goal: 0 }).select().single()
    if (data) { setDomains(prev => [...prev, data as Domain]); setNewDomain({ name: '', icon: '📁', color: '#6366f1' }); setShowNewForm(false) }
    setSaving(false)
  }

  async function archiveDomain(domainId: string) {
    if (!confirm('להסתיר את התחום?')) return
    const supabase = createClient()
    await supabase.from('domains').update({ archived: true }).eq('id', domainId)
    setDomains(prev => prev.filter(d => d.id !== domainId))
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">טוען...</div>

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">הגדרות</h1>

      {/* Domains + KPI */}
      <section className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">תחומים ומטרות שעות שבועיות</h2>
            <p className="text-xs text-slate-400 mt-0.5">הגדר כמה שעות בשבוע כל תחום צריך</p>
          </div>
          <button onClick={() => setShowNewForm(v => !v)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition">
            + תחום חדש
          </button>
        </div>

        {showNewForm && (
          <div className="px-5 py-4 bg-indigo-50 border-b border-indigo-100 space-y-3">
            <div className="flex gap-3">
              <input value={newDomain.icon} onChange={e => setNewDomain(p => ({ ...p, icon: e.target.value }))} placeholder="אייקון"
                className="w-14 border border-slate-200 rounded-xl px-3 py-2 text-center text-lg focus:outline-none" />
              <input value={newDomain.name} onChange={e => setNewDomain(p => ({ ...p, name: e.target.value }))} placeholder="שם התחום"
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {colorOptions.map(c => (
                <button key={c} onClick={() => setNewDomain(p => ({ ...p, color: c }))}
                  className={`w-7 h-7 rounded-full transition ${newDomain.color === c ? 'ring-2 ring-offset-1 ring-slate-400 scale-110' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={createDomain} disabled={saving || !newDomain.name.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-medium py-2 rounded-xl transition">
                {saving ? '...' : 'צור תחום'}
              </button>
              <button onClick={() => setShowNewForm(false)}
                className="flex-1 bg-white hover:bg-slate-100 text-slate-700 text-sm font-medium py-2 rounded-xl border border-slate-200 transition">
                ביטול
              </button>
            </div>
          </div>
        )}

        <div className="divide-y divide-slate-50">
          {domains.map(d => (
            <div key={d.id} className="px-5 py-4 flex items-center gap-4">
              <span className="text-xl w-8 text-center flex-shrink-0">{d.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{d.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                  {editingId === d.id ? (
                    <div className="flex items-center gap-2">
                      <input type="number" value={editGoal} onChange={e => setEditGoal(Number(e.target.value))} min={0} max={80}
                        className="w-16 border border-indigo-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" dir="ltr" />
                      <span className="text-xs text-slate-400">שעות/שבוע</span>
                      <button onClick={() => saveGoal(d.id)} disabled={saving}
                        className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-lg hover:bg-indigo-700 transition">{saving ? '...' : 'שמור'}</button>
                      <button onClick={() => setEditingId(null)} className="text-xs text-slate-400 hover:text-slate-600">ביטול</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingId(d.id); setEditGoal(d.weekly_hours_goal ?? 0) }}
                      className="text-xs text-slate-400 hover:text-indigo-500 transition">
                      {(d.weekly_hours_goal ?? 0) > 0 ? `${d.weekly_hours_goal}h/שבוע` : 'הגדר מטרה'} ✎
                    </button>
                  )}
                </div>
              </div>
              <button onClick={() => archiveDomain(d.id)} className="text-slate-300 hover:text-red-400 transition text-sm">✕</button>
            </div>
          ))}
          {domains.length === 0 && (
            <div className="px-5 py-8 text-center text-slate-400 text-sm">אין תחומים — צור תחום חדש למעלה</div>
          )}
        </div>
      </section>

      {/* Logout */}
      <section className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4">
          <h2 className="font-semibold text-slate-900 mb-3">חשבון</h2>
          <button onClick={async () => { const s = createClient(); await s.auth.signOut(); window.location.href = '/login' }}
            className="text-sm text-red-500 hover:text-red-700 transition font-medium">
            התנתקות →
          </button>
        </div>
      </section>
    </div>
  )
}
