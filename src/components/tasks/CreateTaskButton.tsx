'use client'

import { useState } from 'react'
import CreateTaskModal from './CreateTaskModal'
import type { TaskType } from '@/lib/types'

export default function CreateTaskButton({
  defaultType,
  onCreated,
}: {
  defaultType?: TaskType
  onCreated?: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-sm"
      >
        <span className="text-lg leading-none">+</span>
        <span>משימה חדשה</span>
      </button>

      {open && (
        <CreateTaskModal
          defaultType={defaultType}
          onClose={() => setOpen(false)}
          onCreated={() => {
            setOpen(false)
            if (onCreated) {
              onCreated()
            } else {
              window.location.reload()
            }
          }}
        />
      )}
    </>
  )
}
