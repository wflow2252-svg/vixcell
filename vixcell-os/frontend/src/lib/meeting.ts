import toast from 'react-hot-toast'
import { websiteAPI } from '@/api/client'

const FALLBACK_URL = 'https://vixcell.com/meeting?role=admin'

/**
 * Opens the admin meeting room and ALWAYS copies the link so the admin can
 * share it. Tries the configured website URL, falls back to vixcell.com.
 * In Electron it opens a dedicated meeting window (camera/mic granted);
 * in the browser it opens a new tab.
 */
export async function startMeeting(isAr = true): Promise<string> {
  let url = FALLBACK_URL
  try {
    const res = await websiteAPI.meetingUrl('admin')
    if (res?.data?.url) url = res.data.url
  } catch {
    // backend unreachable — use the fallback link
  }

  try { await navigator.clipboard.writeText(url) } catch { /* clipboard blocked */ }

  const eAPI = (window as any).electronAPI
  if (eAPI?.openMeeting) {
    try { eAPI.openMeeting(url) } catch { window.open(url, '_blank') }
    toast.success(isAr ? 'فتحت الميتنج ونسخت اللينك 📋' : 'Meeting opened, link copied 📋')
  } else {
    window.open(url, '_blank')
    toast.success(isAr ? 'فتحت الميتنج ونسخت اللينك 📋' : 'Meeting opened, link copied 📋')
  }
  return url
}
