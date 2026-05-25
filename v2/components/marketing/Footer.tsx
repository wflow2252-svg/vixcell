import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-brand-border py-10 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-brand-text3">
        <p>© {new Date().getFullYear()} VIXCELL. Crafted with ⚡</p>
        <div className="flex gap-6">
          <Link href="/builder"   className="hover:text-brand-text transition-colors">Builder</Link>
          <Link href="/templates" className="hover:text-brand-text transition-colors">Templates</Link>
          <a href="mailto:hello@vixcell.com" className="hover:text-brand-text transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  )
}
