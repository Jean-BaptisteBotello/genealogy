'use client'
// Note: auth check is handled by middleware (src/middleware.ts).
// DetailPanel visibility and selected person state will be wired in Plan 2.
// View switching (activeView) will be wired in Plan 3.
import { Topbar } from '@/components/layout/Topbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { DetailPanel } from '@/components/layout/DetailPanel'
import { useState } from 'react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [detailOpen, setDetailOpen] = useState(false)

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar userEmail="" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden relative">{children}</main>
        <DetailPanel isOpen={detailOpen} onClose={() => setDetailOpen(false)} />
      </div>
    </div>
  )
}
