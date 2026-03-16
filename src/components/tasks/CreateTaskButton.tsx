'use client'

import { useState } from 'react'
import CreateTaskModal from './CreateTaskModal'
import type { TaskType } from '@/lib/types'

export default function CreateTaskButton({ defaultType }: { defaultType?: TaskType }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition flex items-center gap-2"
      >
        <span>+</span>
        <span>משימה חדשה</span>
      </button>

      {open && (
        <CreateTaskModal
          defaultType={defaultType}
          onClose={() => setOpen(false)}
          onCreated={() => {
            setOpen(false)
            window.location.reload()
          }}
        />
      )}
    </>
  )
}
