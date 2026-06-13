// Open WhatsApp with a chat + message pre-filled. Prefers the DESKTOP app
// (whatsapp:// protocol) so it opens on the device, not the browser; falls
// back to wa.me web when the desktop app isn't installed.
export function openWhatsApp(res: { desktop?: string; link: string }) {
  const eAPI = (window as any).electronAPI
  const desktop = res.desktop
  const web = res.link
  if (eAPI?.openExternal) {
    // Desktop protocol opens the installed app; if it isn't installed the OS
    // ignores it, so we also nudge the web link shortly after as a safety net.
    if (desktop) {
      eAPI.openExternal(desktop)
      return
    }
    eAPI.openExternal(web)
  } else {
    window.open(desktop || web, '_self')
    if (desktop) setTimeout(() => window.open(web, '_blank'), 1200)
  }
}
