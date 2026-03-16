'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Domain, Project } from '@/lib/types'

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
]

const ICONS = ['📁', '💼', '🏠', '🎯', '💡', '🚀', '🌿', '⭐', '🔧', '📊']

type DomainWithProjects = Domain & { projects: Project[] }

export default function DomainsClient({ initialDomains }: { initialDomains: DomainWithProjects[] }) {
  const supabase = createClient()
  const [domains, setDomains] = useState(initialDomains)
  const [showNewDomain, setShowNewDomain] = useState(false)
  const [newDomainName, setNewDomainName] = useState('')
  const [newDomainColor, setNewDomainColor] = useState(COLORS[0])
  const [newDomainIcon, setNewDomainIcon] = useState(ICONS[0])
  const [newProjectName, setNewProjectName] = useState<Record<string, string>>({})
  const [showNewProject, setShowNewProject] = useState<Record<string, boolean>>({})

  async function createDomain() {
    if (!newDomainName.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase.from('domains').insert({
      user_id: user.id,
      name: newDomainName,
      color: newDomainColor,
      icon: newDomainIcon,
      archived: false,
    }).select().single()

    if (data) {
      setDomains(prev => [...prev, { ...data, projects: [] }])
      setNewDomainName('')
      setShowNewDomain(false)
    }
  }

  async function createProject(domainId: string) {
    const name = newProjectName[domainId]
    if (!name?.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase.from('projects').insert({
      user_id: user.id,
      domain_id: domainId,
      name,
      archived: false,
    }).select().single()

    if (data) {
      setDomains(prev => prev.map(d =>
        d.id === domainId ? { ...d, projects: [...d.projects, data] } : d
      ))
      setNewProjectName(prev => ({ ...prev, [domainId]: '' }))
      setShowNewProject(prev => ({ ...prev, [domainId]: false }))
    }
  }

  async function archiveDomain(domainId: string) {
    await supabase.from('domains').update({ archived: true }).eq('id', domainId)
    setDomains(prev => prev.filter(d => d.id !== domainId))
  }

  async function archiveProject(domainId: string, projectId: string) {
    await supabase.from('projects').update({ archived: true }).eq('id', projectId)
    setDomains(prev => prev.map(d =>
      d.id === domainId
        ? { ...d, projects: d.projects.filter(p => p.id !== projectId) }
        : d
    ))
  }

  return (
    <div className="space-y-4">
      {domains.map(domain => (
        <div key={domain.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span>{domain.icon}</span>
              <span
                className="font-semibold text-sm px-2 py-0.5 rounded-full"
                style={{ backgroundColor: domain.color + '20', color: domain.color }}
              >
                {domain.name}
              </span>
              <span className="text-xs text-gray-400">{domain.projects.length} פרויקטים</span>
            </div>
            <button
              onClick={() => archiveDomain(domain.id)}
              className="text-xs text-gray-300 hover:text-red-400 transition"
            >
              ארכיון
            </button>
          </div>

          {/* Projects */}
          <div className="space-y-1.5 mr-4">
            {domain.projects.map(project => (
              <div key={project.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                <span className="text-sm text-gray-700">{project.name}</span>
                <button
                  onClick={() => archiveProject(domain.id, project.id)}
                  className="text-xs text-gray-300 hover:text-red-400 transition"
                >
                  ✕
                </button>
              </div>
            ))}

            {showNewProject[domain.id] ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newProjectName[domain.id] ?? ''}
                  onChange={e => setNewProjectName(prev => ({ ...prev, [domain.id]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && createProject(domain.id)}
                  autoFocus
                  placeholder="שם הפרויקט"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={() => createProject(domain.id)} className="text-blue-600 text-sm font-medium px-2">שמור</button>
                <button onClick={() => setShowNewProject(prev => ({ ...prev, [domain.id]: false }))} className="text-gray-400 text-sm px-2">ביטול</button>
              </div>
            ) : (
              <button
                onClick={() => setShowNewProject(prev => ({ ...prev, [domain.id]: true }))}
                className="text-xs text-gray-400 hover:text-blue-500 transition px-3 py-1"
              >
                + פרויקט חדש
              </button>
            )}
          </div>
        </div>
      ))}

      {/* New domain */}
      {showNewDomain ? (
        <div className="bg-white border-2 border-dashed border-blue-200 rounded-2xl p-4 space-y-3">
          <h3 className="font-medium text-sm text-gray-700">תחום חדש</h3>
          <input
            type="text"
            value={newDomainName}
            onChange={e => setNewDomainName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createDomain()}
            autoFocus
            placeholder="שם התחום"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div>
            <p className="text-xs text-gray-500 mb-1.5">צבע</p>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setNewDomainColor(c)}
                  className={`w-7 h-7 rounded-full transition ${newDomainColor === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1.5">אייקון</p>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setNewDomainIcon(icon)}
                  className={`w-9 h-9 rounded-xl text-lg transition ${newDomainIcon === icon ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={createDomain} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-xl transition">
              צור תחום
            </button>
            <button onClick={() => setShowNewDomain(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 rounded-xl transition">
              ביטול
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowNewDomain(true)}
          className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-4 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition"
        >
          + הוסף תחום חדש
        </button>
      )}
    </div>
  )
}
