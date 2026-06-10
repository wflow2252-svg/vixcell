'use client'

import dynamic from 'next/dynamic'
import React from 'react'

const DashboardView = dynamic(
  () => import('@/components/dashboard/DashboardView'),
  { ssr: false, loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-[#0c0c0e] text-[#c8a35c]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#c8a35c]/20 border-t-[#c8a35c]" />
        <p className="text-sm font-semibold tracking-wider animate-pulse font-mono">LOADING VIXCELL OS...</p>
      </div>
    </div>
  )}
)

export default function DashboardPage() {
  return <DashboardView />
}
