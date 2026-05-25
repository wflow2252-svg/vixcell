import dynamic from 'next/dynamic'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Builder — VIXCELL AI',
  description: 'Build a complete website by describing what you need.',
}

// Builder uses localStorage + browser APIs — must be client-only
const Builder = dynamic(() => import('@/components/builder/Builder'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center text-brand-text3">
      Loading builder…
    </div>
  ),
})

export default function BuilderPage() {
  return <Builder />
}
