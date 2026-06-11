/* ═══════════════════════════════════════════════════
   Vixcell Meetings — Dark Mode
   Font: Cairo (Arabic + English unified)
   Icons: Material Symbols Rounded
═══════════════════════════════════════════════════ */
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../services/supabase'

/* ─── Material Icon component ──────────────────── */
const Icon = ({ name, size = 24, style = {} }) => (
  <span className="material-symbols-rounded" style={{ fontSize: size, lineHeight: 1, verticalAlign: 'middle', ...style }}>
    {name}
  </span>
)

/* ─── Path Simplification (Douglas-Peucker) ────── */
function simplifyPath(points, epsilon = 8) {
  if (points.length <= 2) return points
  
  let dmax = 0
  let index = 0
  const end = points.length - 1
  for (let i = 1; i < end; i++) {
    const d = perpendicularDistance(points[i], points[0], points[end])
    if (d > dmax) {
      index = i
      dmax = d
    }
  }
  
  if (dmax > epsilon) {
    const results1 = simplifyPath(points.slice(0, index + 1), epsilon)
    const results2 = simplifyPath(points.slice(index), epsilon)
    return results1.slice(0, results1.length - 1).concat(results2)
  } else {
    return [points[0], points[end]]
  }
}

function perpendicularDistance(p, lineStart, lineEnd) {
  const dx = lineEnd.x - lineStart.x
  const dy = lineEnd.y - lineStart.y
  if (dx === 0 && dy === 0) {
    return Math.sqrt(Math.pow(p.x - lineStart.x, 2) + Math.pow(p.y - lineStart.y, 2))
  }
  const numerator = Math.abs(dy * p.x - dx * p.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x)
  const denominator = Math.sqrt(dx * dx + dy * dy)
  return numerator / denominator
}

/* ─── Colors ────────────────────────────────────── */
const C = {
  bg:     '#0f0f11',
  bg2:    '#1a1a1e',
  bg3:    '#252529',
  bg4:    '#2f2f34',
  border: 'rgba(255,255,255,0.07)',
  text:   '#e8eaed',
  text2:  '#9aa0a6',
  text3:  '#5f6368',
  blue:   '#1a73e8',
  blueL:  '#4a90e2',
  green:  '#34a853',
  red:    '#ea4335',
  yellow: '#fbbc04',
  purple: '#a142f4',
}

const FONT = "'Cairo', 'Outfit', sans-serif"

/* ─── DB helpers (IndexedDB for recordings) ─────── */
const DB_NAME = 'vixcell_meetings'
const DB_VER  = 1

function openDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, DB_VER)
    req.onupgradeneeded = e => {
      const db = e.target.result
      if (!db.objectStoreNames.contains('meetings'))
        db.createObjectStore('meetings', { keyPath: 'id' })
    }
    req.onsuccess = e => res(e.target.result)
    req.onerror   = () => rej(req.error)
  })
}

async function saveMeeting(record) {
  const db = await openDB()
  return new Promise((res, rej) => {
    const tx  = db.transaction('meetings', 'readwrite')
    const st  = tx.objectStore('meetings')
    st.put(record)
    tx.oncomplete = () => res()
    tx.onerror    = () => rej(tx.error)
  })
}

async function getMeetings() {
  const db = await openDB()
  return new Promise((res, rej) => {
    const tx = db.transaction('meetings', 'readonly')
    const req = tx.objectStore('meetings').getAll()
    req.onsuccess = () => res(req.result || [])
    req.onerror   = () => rej(req.error)
  })
}

/* ─── Helpers ─────────────────────────────────── */
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }
function nowTime() {
  return new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
}
function nowDate() {
  return new Date().toLocaleString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function fmtDur(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  return h > 0
    ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
    : `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

function getMeetingUrl(meetingId) {
  return `${window.location.origin}/meeting?code=${meetingId}&role=client`
}

/* ─── AI helpers (local Ollama) ──────────────── */
async function askOllama(prompt) {
  try {
    const r = await fetch('/api/ai/ollama-analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal: AbortSignal.timeout(30000),
    })
    if (!r.ok) return null
    const resData = await r.json()
    if (resData.success && resData.data) {
      return resData.data.response || null
    }
    return null
  } catch (e) {
    console.error('[Ollama Client Error]:', e)
    return null
  }
}

async function summarizeMeeting(transcript) {
  const text = transcript.map(t => `${t.speaker}: ${t.text}`).join('\n')
  const prompt = `أنت مساعد ذكي. لخّص هذا الاجتماع في نقاط واستخرج المهام المطلوبة:\n\n${text}\n\naكتب:\n1. ملخص موجز (3-5 جمل)\n2. المهام المستخرجة (bullet points)`
  return await askOllama(prompt)
}

/* ─── Supabase meeting registration ──────────── */
async function registerActiveMeeting(meetingId, clientName, adminName, isAdminMode, role) {
  try {
    const { data } = await supabase
      .from('submissions')
      .select('*')
      .eq('type', 'active_meeting')
      .eq('read', false)
      .eq('name', meetingId)
      .maybeSingle();

    const participants = data?.metadata?.participants || [];
    const nameToAdd = isAdminMode ? adminName : clientName;
    if (nameToAdd && !participants.includes(nameToAdd)) participants.push(nameToAdd);

    const isTablet = role === 'Tablet' || adminName === 'Tablet';
    const payload = {
      type: 'active_meeting',
      name: meetingId,
      brief: `Active meeting: ${meetingId}`,
      read: false,
      metadata: {
        meetingId,
        clientName: clientName || data?.metadata?.clientName || '',
        adminName: isAdminMode ? adminName : (data?.metadata?.adminName || ''),
        participants,
        tabletConnected: isTablet || !!data?.metadata?.tabletConnected,
        last_active: new Date().toISOString()
      }
    };

    if (data) {
      await supabase.from('submissions').update(payload).eq('id', data.id);
    } else {
      await supabase.from('submissions').insert(payload);
    }
  } catch (e) {
    console.error('Failed to register active meeting:', e);
  }
}

async function leaveActiveMeeting(meetingId, displayName, isAdminMode) {
  try {
    const { data } = await supabase
      .from('submissions')
      .select('*')
      .eq('type', 'active_meeting')
      .eq('read', false)
      .eq('name', meetingId)
      .maybeSingle();

    if (data) {
      let participants = data.metadata?.participants || [];
      participants = participants.filter(p => p !== displayName);
      const isTablet = displayName === 'Tablet';
      const tabletConnected = isTablet ? false : !!data.metadata?.tabletConnected;

      if (participants.length === 0) {
        await supabase.from('submissions').update({ read: true }).eq('id', data.id);
      } else {
        await supabase.from('submissions').update({
          metadata: { ...data.metadata, participants, tabletConnected, last_active: new Date().toISOString() }
        }).eq('id', data.id);
      }
    }
  } catch (e) {
    console.error('Failed to leave active meeting:', e);
  }
}

/* ═══════════════════════════════════════════════
   ROOT COMPONENT
═══════════════════════════════════════════════ */
export default function MeetingRoom({ isAdmin = false, onViewChange, joinMeetingId = '', chosenRole = '' }) {
  const [meetingId, setMeetingId] = useState(() => {
    const queryParams = new URLSearchParams(window.location.search)
    const urlCode = (queryParams.get('code') || queryParams.get('id') || joinMeetingId || '').trim()
    const savedCode = sessionStorage.getItem('vixcell_meetingId')
    if (urlCode && savedCode && urlCode !== savedCode) {
      sessionStorage.removeItem('vixcell_meetingId')
      sessionStorage.removeItem('vixcell_isTabletMode')
      sessionStorage.removeItem('vixcell_isAdminMode')
      sessionStorage.removeItem('vixcell_screen')
      sessionStorage.removeItem('vixcell_adminName')
      sessionStorage.removeItem('vixcell_clientName')
      return urlCode
    }
    if (urlCode) return urlCode
    return savedCode || ''
  })

  const [isTabletMode, setIsTabletMode] = useState(() => {
    const saved = sessionStorage.getItem('vixcell_isTabletMode')
    if (saved !== null) return saved === 'true'
    const queryParams = new URLSearchParams(window.location.search)
    const role = queryParams.get('role') || chosenRole
    return role?.toLowerCase() === 'tablet'
  })

  const [isAdminMode, setIsAdminMode] = useState(() => {
    const saved = sessionStorage.getItem('vixcell_isAdminMode')
    if (saved !== null) return saved === 'true'
    if (isAdmin) return true
    const queryParams = new URLSearchParams(window.location.search)
    const role = queryParams.get('role') || chosenRole
    if (role?.toLowerCase() === 'admin') return true
    if (role?.toLowerCase() === 'client' || role?.toLowerCase() === 'tablet') return false
    if (queryParams.has('code') || queryParams.has('id')) return false
    return true
  })

  const [screen, setScreen] = useState(() => {
    const saved = sessionStorage.getItem('vixcell_screen')
    if (saved) return saved
    const queryParams = new URLSearchParams(window.location.search)
    const role = queryParams.get('role') || chosenRole
    const tempMeetingId = (queryParams.get('code') || queryParams.get('id') || joinMeetingId || '').trim()
    if (tempMeetingId && role?.toLowerCase() === 'tablet') return 'room';
    if (tempMeetingId && chosenRole) return 'room';
    return 'lobby';
  })
  
  const [adminName, setAdminName]       = useState(() => {
    const saved = sessionStorage.getItem('vixcell_adminName')
    if (saved) return saved
    const queryParams = new URLSearchParams(window.location.search)
    const role = queryParams.get('role') || chosenRole
    if (role?.toLowerCase() === 'tablet') return 'Tablet';
    return chosenRole || 'حازم'
  })
  const [clientName, setClientName]     = useState(() => {
    const saved = sessionStorage.getItem('vixcell_clientName')
    if (saved) return saved
    const queryParams = new URLSearchParams(window.location.search)
    const role = queryParams.get('role') || chosenRole
    if (role?.toLowerCase() === 'tablet') return 'Tablet';
    return ''
  })
  const [joinId, setJoinId]             = useState('')
  const [logoUrl, setLogoUrl]           = useState('/logo.png')
  
  // Shared Media Stream State
  const [localStream, setLocalStream] = useState(null)
  const localStreamRef = useRef(null)
  const [camOn, setCamOn] = useState(true)
  const [micOn, setMicOn] = useState(true)

  const clearSessionStorage = useCallback(() => {
    sessionStorage.removeItem('vixcell_meetingId')
    sessionStorage.removeItem('vixcell_isTabletMode')
    sessionStorage.removeItem('vixcell_isAdminMode')
    sessionStorage.removeItem('vixcell_screen')
    sessionStorage.removeItem('vixcell_adminName')
    sessionStorage.removeItem('vixcell_clientName')
    
    setMeetingId('')
    setClientName('')
    setScreen('lobby')
  }, [])

  // Sync state variables to sessionStorage
  useEffect(() => {
    if (meetingId) {
      sessionStorage.setItem('vixcell_meetingId', meetingId)
    } else {
      sessionStorage.removeItem('vixcell_meetingId')
    }
  }, [meetingId])

  useEffect(() => {
    sessionStorage.setItem('vixcell_isTabletMode', String(isTabletMode))
  }, [isTabletMode])

  useEffect(() => {
    sessionStorage.setItem('vixcell_isAdminMode', String(isAdminMode))
  }, [isAdminMode])

  useEffect(() => {
    if (screen) {
      sessionStorage.setItem('vixcell_screen', screen)
    } else {
      sessionStorage.removeItem('vixcell_screen')
    }
  }, [screen])

  useEffect(() => {
    if (adminName) {
      sessionStorage.setItem('vixcell_adminName', adminName)
    } else {
      sessionStorage.removeItem('vixcell_adminName')
    }
  }, [adminName])

  useEffect(() => {
    if (clientName) {
      sessionStorage.setItem('vixcell_clientName', clientName)
    } else {
      sessionStorage.removeItem('vixcell_clientName')
    }
  }, [clientName])

  const [activeMeetings, setActiveMeetings] = useState([])

  useEffect(() => {
    if (screen !== 'lobby') return
    let active = true
    async function loadActive() {
      try {
        const { data } = await supabase
          .from('submissions')
          .select('*')
          .eq('type', 'active_meeting')
          .eq('read', false)
        if (active && data) {
          const now = new Date()
          const filtered = data.filter(m => {
            const lastActive = new Date(m.metadata?.last_active || m.created_at)
            return (now - lastActive) < 120000 // 2 minutes
          })
          setActiveMeetings(filtered)
        }
      } catch {}
    }
    loadActive()
    const timer = setInterval(loadActive, 5000)
    return () => { active = false; clearInterval(timer) }
  }, [screen])

  const handleSelectActive = useCallback((mId) => {
    setJoinId(mId)
    setMeetingId(mId)
    if (isTabletMode) {
      setClientName('Tablet')
      setScreen('room')
    } else if (isAdminMode) {
      setScreen('pre')
    } else {
      setClientName(clientName || 'عميل')
      setScreen('waiting')
    }
  }, [isTabletMode, isAdminMode, clientName])

  // Sync URL query params with active meeting room code
  useEffect(() => {
    if (meetingId && (screen === 'pre' || screen === 'room' || screen === 'waiting')) {
      const currentUrl = new URL(window.location.href)
      if (currentUrl.searchParams.get('code') !== meetingId) {
        currentUrl.searchParams.set('code', meetingId)
        window.history.pushState(null, '', currentUrl.pathname + currentUrl.search)
      }
    } else if (screen === 'lobby') {
      const currentUrl = new URL(window.location.href)
      if (currentUrl.searchParams.has('code')) {
        currentUrl.searchParams.delete('code')
        window.history.pushState(null, '', currentUrl.pathname + currentUrl.search)
      }
    }
  }, [meetingId, screen])

  useEffect(() => {
    let active = true
    async function loadLogo() {
      try {
        const { data } = await supabase.from('brand_config').select('logo_url').eq('id', true).maybeSingle()
        if (active && data && data.logo_url) setLogoUrl(data.logo_url)
      } catch {}
    }
    loadLogo()
    return () => { active = false }
  }, [])

  // Manage Local Media Stream at Parent Level
  useEffect(() => {
    if (isTabletMode) return
    let active = true
    let stream = null

    async function acquireStream() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { echoCancellation: true, noiseSuppression: true }
        })
        if (active) {
          localStreamRef.current = stream
          setLocalStream(stream)
          stream.getVideoTracks().forEach(t => { t.enabled = camOn })
          stream.getAudioTracks().forEach(t => { t.enabled = micOn })
        }
      } catch (e) {
        console.warn("Camera + Mic acquisition failed, trying audio only:", e)
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          if (active) {
            localStreamRef.current = stream
            setLocalStream(stream)
            stream.getAudioTracks().forEach(t => { t.enabled = micOn })
          }
        } catch (err) {
          console.error("Audio and camera both failed:", err)
        }
      }
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      acquireStream()
    }

    return () => {
      active = false
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop())
        localStreamRef.current = null
      }
    }
  }, [isTabletMode])

  const toggleCam = useCallback(() => {
    setCamOn(prev => {
      const next = !prev
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = next })
      }
      return next
    })
  }, [])

  const toggleMic = useCallback(() => {
    setMicOn(prev => {
      const next = !prev
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = next })
      }
      return next
    })
  }, [])

  if (screen === 'archive') {
    return <MeetingArchive onBack={() => setScreen('lobby')} />
  }

  if (screen === 'lobby' && !isAdmin) {
    return (
      <ClientLobby
        logoUrl={logoUrl}
        localStream={localStream}
        camOn={camOn}
        micOn={micOn}
        toggleCam={toggleCam}
        toggleMic={toggleMic}
        activeMeetings={activeMeetings}
        onJoin={(name, code, cam, mic) => {
          setMeetingId(code.trim())
          setClientName(name)
          setIsAdminMode(false)
          setScreen('waiting')   // → waiting room first
        }}
        onBack={() => {
          clearSessionStorage()
          if (onViewChange) onViewChange('landing')
          else setScreen('lobby')
        }}
      />
    )
  }

  if (screen === 'waiting') {
    return (
      <WaitingRoom
        meetingId={meetingId}
        displayName={clientName}
        logoUrl={logoUrl}
        onAdmitted={() => setScreen('room')}
        onBack={() => {
          clearSessionStorage()
          setScreen('lobby')
        }}
      />
    )
  }

  if (screen === 'pre') {
    return (
      <PreMeeting
        meetingId={meetingId}
        isAdminMode={isAdminMode}
        adminName={adminName}
        clientName={clientName}
        localStream={localStream}
        camOn={camOn}
        micOn={micOn}
        toggleCam={toggleCam}
        toggleMic={toggleMic}
        onEnter={() => setScreen('room')}
        onBack={() => {
          clearSessionStorage()
          setScreen('lobby')
        }}
      />
    )
  }

  if (screen === 'room') {
    return (
      <Room
        meetingId={meetingId}
        displayName={isAdminMode ? adminName : clientName}
        isAdminMode={isAdminMode}
        isTabletMode={isTabletMode}
        localStream={localStream}
        camOn={camOn}
        micOn={micOn}
        toggleCam={toggleCam}
        toggleMic={toggleMic}
        onLeave={() => {
          clearSessionStorage()
          if (!isAdmin && onViewChange) onViewChange('landing');
          else setScreen('lobby');
        }}
      />
    )
  }

  // Admin Lobby
  return (
    <AdminLobby
      adminName={adminName} setAdminName={setAdminName}
      clientName={clientName} setClientName={setClientName}
      joinId={joinId} setJoinId={setJoinId}
      isAdminMode={isAdminMode} setIsAdminMode={setIsAdminMode}
      isTabletMode={isTabletMode} setIsTabletMode={setIsTabletMode}
      logoUrl={logoUrl}
      onViewChange={onViewChange}
      activeMeetings={activeMeetings}
      onSelectActive={handleSelectActive}
      onCreateMeeting={() => {
        setMeetingId(uid())
        if (isTabletMode) {
          setClientName('Tablet')
          setScreen('room')
        } else {
          setScreen('pre')
        }
      }}
      onJoinMeeting={() => {
        const id = joinId.trim() || uid()
        setMeetingId(id)
        if (isTabletMode) {
          setClientName('Tablet')
          setScreen('room')
        } else {
          setScreen('pre')
        }
      }}
      onOpenArchive={() => setScreen('archive')}
    />
  )
}

/* ═══════════════════════════════════════════════
   ADMIN LOBBY
═══════════════════════════════════════════════ */
function AdminLobby({ adminName, setAdminName, clientName, setClientName, joinId, setJoinId,
                 isAdminMode, setIsAdminMode, isTabletMode, setIsTabletMode, onCreateMeeting, onJoinMeeting, onOpenArchive, logoUrl, onViewChange, activeMeetings, onSelectActive }) {
  const [tab, setTab] = useState('new')

  return (
    <div style={lob.root}>
      {/* animated bg orbs */}
      <div style={lob.orb1} />
      <div style={lob.orb2} />
      <div style={lob.orb3} />

      <div style={lob.card}>
        {/* Header */}
        <div style={lob.header}>
          <div style={lob.logoRow}>
            <img src={logoUrl || "/logo.png"} alt="Vixcell Logo" style={{ height: '26px', marginRight: '10px', objectFit: 'contain' }} />
            <div>
              <div style={lob.logoTitle}>Vixcell Meet</div>
              <div style={lob.logoSub}>اجتماعات احترافية وذكية</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onOpenArchive} style={lob.ghostBtn}>
              <Icon name="history" size={16} />
              <span>السجل</span>
            </button>
            {onViewChange && (
              <button onClick={() => onViewChange('landing')} style={lob.ghostBtn}>
                <Icon name="home" size={16} />
                <span>الرئيسية</span>
              </button>
            )}
          </div>
        </div>

        {/* Mode toggle */}
        <div style={lob.modeRow}>
          <button onClick={() => { setIsAdminMode(false); setIsTabletMode(false) }}
            style={{ ...lob.modeBtn, ...((!isAdminMode && !isTabletMode) ? lob.modeBtnActive : {}) }}>
            <Icon name="person" size={18} />
            دخول كعميل
          </button>
          <button onClick={() => { setIsAdminMode(true); setIsTabletMode(false) }}
            style={{ ...lob.modeBtn, ...((isAdminMode && !isTabletMode) ? lob.modeBtnActive : {}) }}>
            <Icon name="admin_panel_settings" size={18} />
            دخول كأدمن
          </button>
          <button onClick={() => { setIsAdminMode(false); setIsTabletMode(true) }}
            style={{ ...lob.modeBtn, ...(isTabletMode ? lob.modeBtnActive : {}) }}>
            <Icon name="tablet_mac" size={18} />
            جهاز لوحي
          </button>
        </div>

        {/* Active Meetings List */}
        {activeMeetings && activeMeetings.length > 0 && (
          <div style={{ marginBottom: 20, padding: 14, background: 'rgba(26,115,232,0.05)', borderRadius: 14, border: '1px solid rgba(26,115,232,0.15)' }}>
            <div style={{ color: C.blue, fontSize: 12, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, animation: 'recPulse 1.2s infinite' }} />
              اجتماعات جارية حالياً (انقر للانضمام):
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeMeetings.map(m => (
                <button key={m.name} onClick={() => onSelectActive(m.name)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: C.bg3, border: `1px solid ${C.border}`,
                  borderRadius: 10, cursor: 'pointer', textAlign: 'right', width: '100%',
                  fontFamily: FONT, transition: 'all 0.2s', alignSelf: 'stretch'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
                    <span style={{ color: C.text, fontSize: 13, fontWeight: 700, fontFamily: FONT }}>اجتماع {m.metadata?.adminName || 'مضيف'}</span>
                    <span style={{ color: C.text3, fontSize: 10, fontFamily: 'monospace' }}>كود: {m.name}</span>
                  </div>
                  <Icon name="chevron_left" size={18} style={{ color: C.blue }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Admin name */}
        {isAdminMode && !isTabletMode && (
          <div style={lob.adminNameRow}>
            <div style={{ color: C.text2, fontSize: 12, marginBottom: 10, fontWeight: 600 }}>اختر اسمك في الاجتماع</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {['حازم', 'نور'].map(name => (
                <button key={name} onClick={() => setAdminName(name)}
                  style={{ ...lob.nameBtn, ...(adminName === name ? lob.nameBtnActive : {}) }}>
                  <Icon name="person" size={18} />
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

        {!isAdminMode && !isTabletMode && (
          <div style={{ marginBottom: 20 }}>
            <label style={lob.label}>اسمك</label>
            <input value={clientName} onChange={e => setClientName(e.target.value)}
              placeholder="أدخل اسمك" style={lob.input} />
          </div>
        )}

        {/* Tabs */}
        <div style={lob.tabs}>
          <button onClick={() => setTab('new')} style={{ ...lob.tabBtn, ...(tab === 'new' ? lob.tabActive : {}) }}>
            <Icon name="video_call" size={16} /> اجتماع جديد
          </button>
          <button onClick={() => setTab('join')} style={{ ...lob.tabBtn, ...(tab === 'join' ? lob.tabActive : {}) }}>
            <Icon name="login" size={16} /> انضم لاجتماع
          </button>
        </div>

        {tab === 'join' && (
          <div style={{ marginBottom: 20 }}>
            <label style={lob.label}>كود الاجتماع</label>
            <input value={joinId} onChange={e => setJoinId(e.target.value)}
              placeholder="أدخل كود الاجتماع" style={lob.input} dir="ltr" />
          </div>
        )}

        <button
          onClick={tab === 'new' ? onCreateMeeting : onJoinMeeting}
          style={{ ...lob.primaryBtn, opacity: (!isAdminMode && !isTabletMode && !clientName.trim()) ? 0.5 : 1 }}
          disabled={!isAdminMode && !isTabletMode && !clientName.trim()}
        >
          <Icon name={tab === 'new' ? 'add_circle' : 'login'} size={20} />
          {tab === 'new' ? 'ابدأ اجتماع جديد' : 'انضم الآن'}
        </button>

        {/* Features */}
        <div style={lob.features}>
          {[
            { icon: 'fiber_manual_record', label: 'تسجيل تلقائي', color: C.red },
            { icon: 'record_voice_over',   label: 'AI Transcript', color: C.blue },
            { icon: 'draw',                label: 'Whiteboard', color: C.purple },
            { icon: 'chat',                label: 'Chat', color: C.green },
            { icon: 'summarize',           label: 'ملخص ذكي', color: C.yellow },
            { icon: 'link',                label: 'رابط دعوة', color: C.blueL },
          ].map(f => (
            <div key={f.icon} style={lob.feature}>
              <Icon name={f.icon} size={14} style={{ color: f.color }} />
              <span>{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   PRE-MEETING (Camera check + invite link)
═══════════════════════════════════════════════ */
function PreMeeting({ meetingId, isAdminMode, adminName, clientName, localStream, camOn, micOn, toggleCam, toggleMic, onEnter, onBack }) {
  const videoRef = useRef(null)
  const [copied, setCopied]   = useState(false)
  const displayName = isAdminMode ? adminName : clientName
  const meetingUrl  = getMeetingUrl(meetingId)

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream
    }
  }, [localStream])

  function copyLink() {
    navigator.clipboard.writeText(meetingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div style={pre.root}>
      <div style={pre.inner}>
        <button onClick={onBack} style={pre.backBtn}>
          <Icon name="arrow_back" size={20} /> رجوع
        </button>

        <h2 style={pre.title}>جاهز للانضمام؟</h2>

        <div style={pre.grid}>
          {/* Preview */}
          <div style={pre.previewWrap}>
            <div style={pre.preview}>
              {camOn && localStream
                ? <video ref={videoRef} autoPlay muted playsInline style={pre.video} />
                : <div style={pre.noVideo}><Icon name="videocam_off" size={48} style={{ color: C.text3 }} /></div>
              }
              <div style={pre.previewName}>{displayName}</div>
              <div style={pre.previewCtrls}>
                <button onClick={() => toggleMic()} style={{ ...pre.ctrl, background: micOn ? 'rgba(255,255,255,0.12)' : C.red }}>
                  <Icon name={micOn ? 'mic' : 'mic_off'} size={22} style={{ color: '#fff' }} />
                </button>
                <button onClick={() => toggleCam()} style={{ ...pre.ctrl, background: camOn ? 'rgba(255,255,255,0.12)' : C.red }}>
                  <Icon name={camOn ? 'videocam' : 'videocam_off'} size={22} style={{ color: '#fff' }} />
                </button>
              </div>
            </div>
          </div>

          {/* Info */}
          <div style={pre.infoWrap}>
            {/* ── INVITE LINK CARD ── */}
            <div style={pre.inviteCard}>
              <div style={pre.inviteCardHeader}>
                <Icon name="link" size={16} style={{ color: C.blue }} />
                <span style={{ color: C.blue, fontWeight: 700, fontSize: 13 }}>رابط الدعوة للعميل</span>
              </div>
              <div style={pre.inviteUrl}>{meetingUrl}</div>
              <button onClick={copyLink} style={{ ...pre.copyBtn, background: copied ? 'rgba(52,168,83,0.15)' : 'rgba(26,115,232,0.12)', borderColor: copied ? 'rgba(52,168,83,0.3)' : 'rgba(26,115,232,0.25)', color: copied ? C.green : C.blue }}>
                <Icon name={copied ? 'check_circle' : 'content_copy'} size={16} />
                {copied ? 'تم النسخ ✓' : 'نسخ رابط الاجتماع'}
              </button>
            </div>

            {/* User card */}
            <div style={pre.infoCard}>
              <div style={pre.infoLabel}>أنت</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={pre.avatar}>{displayName[0]}</div>
                <div>
                  <div style={{ color: C.text, fontWeight: 700 }}>{displayName}</div>
                  <div style={{ color: C.text2, fontSize: 12 }}>
                    {isAdminMode ? '👑 مضيف الاجتماع' : '🙋 عميل'}
                  </div>
                </div>
              </div>
            </div>

            {isAdminMode && (
              <div style={{ ...pre.infoCard, background: 'rgba(26,115,232,0.06)', borderColor: 'rgba(26,115,232,0.18)' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <Icon name="auto_awesome" size={16} style={{ color: C.yellow, flexShrink: 0, marginTop: 2 }} />
                  <div style={{ color: C.text2, fontSize: 12, lineHeight: 1.7 }}>
                    التسجيل التلقائي وـ AI Transcript سيبدآن تلقائياً عند دخول الاجتماع
                  </div>
                </div>
              </div>
            )}

            <button onClick={onEnter} style={pre.joinBtn}>
              <Icon name="video_call" size={20} />
              انضم الآن
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   ROOM
═══════════════════════════════════════════════ */
function Room({ meetingId, displayName, isAdminMode, isTabletMode = false, localStream, camOn, micOn, toggleCam, toggleMic, onLeave }) {
  const myIdRef = useRef('p-' + Math.random().toString(36).substring(2, 10))

  const localVideoRef  = useRef(null)
  const remoteVideoRef = useRef(null)
  
  const [peers, setPeers] = useState([]) // [{ id, name, mic, cam, sharing, conn }]
  const [streamVersion, setStreamVersion] = useState(0)
  const [remoteStream, setRemoteStream] = useState(null)
  const [remoteName, setRemoteName]     = useState('')
  const [pendingKnocks, setPendingKnocks] = useState([]) // ← طلبات الدخول
  const [sharing, setSharing] = useState(false)
  const [screenStream, setScreenStream] = useState(null)
  const screenTrackRef = useRef(null)
  const [whiteboardActive, setWhiteboardActive] = useState(false)
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)
  const [videoFit, setVideoFit] = useState('contain')

  const firstPeer = peers[0]
  const isReconnecting = firstPeer && (firstPeer.presenceOffline || firstPeer.conn === 'disconnected' || firstPeer.conn === 'failed')

  const tools = [
    { id: 'select', icon: 'near_me', label: 'تحديد وتحريك' },
    { id: 'pen', icon: 'edit', label: 'قلم' },
    { id: 'eraser', icon: 'ink_eraser', label: 'ممحاة' },
    { id: 'rect', icon: 'rectangle', label: 'مستطيل' },
    { id: 'circle', icon: 'circle', label: 'دائرة' },
    { id: 'line', icon: 'horizontal_rule', label: 'مستقيم' },
    { id: 'triangle', icon: 'change_history', label: 'مثلث' },
    { id: 'correction', icon: 'gesture', label: 'تصحيح الأشكال' },
    { id: 'text_ai', icon: 'spellcheck', label: 'تصحيح النصوص' }
  ]

  const toggleWhiteboard = useCallback((activeVal) => {
    const next = activeVal !== undefined ? activeVal : !whiteboardActive
    setWhiteboardActive(next)
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'whiteboard_status',
        payload: { active: next }
      }).catch(() => {})
    }
  }, [whiteboardActive])

  const handleManualPlay = useCallback(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.play()
        .then(() => setAutoplayBlocked(false))
        .catch(e => console.error("Manual play failed:", e))
    }
  }, [])

  const recorderRef  = useRef(null)
  const recChunks    = useRef([])
  const [recDuration, setRecDuration] = useState(0)
  const recTimer = useRef(null)

  const [elapsed, setElapsed]   = useState(0)
  const [panel, setPanel]       = useState(null)
  const [fullscreen, setFullscreen] = useState(false)
  const roomRef = useRef(null)

  const [messages, setMessages] = useState([
    { id: 1, from: 'نظام', text: `بدأ الاجتماع · ${nowTime()}`, system: true },
  ])
  const [msgInput, setMsgInput] = useState('')
  const chatEnd = useRef(null)

  const [transcript, setTranscript]   = useState([])
  const [isListening, setListening]   = useState(false)
  const [summary, setSummary]         = useState('')
  const recognitionRef = useRef(null)

  const wbRef    = useRef(null)
  const ctxRef   = useRef(null)
  const drawing  = useRef(false)
  const lastPos  = useRef({ x: 0, y: 0 })
  const [wbColor, setWbColor] = useState('#1a73e8')
  const [wbSize, setWbSize]   = useState(3)
  const [wbTool, setWbTool]   = useState('pen')

  const startPos = useRef({ x: 0, y: 0 })
  const savedImageData = useRef(null)
  const strokePoints = useRef([])
  const [isOCRProcessing, setIsOCRProcessing] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState('')
  const [boardElements, setBoardElements] = useState([])
  const boardElementsRef = useRef([])
  useEffect(() => {
    boardElementsRef.current = boardElements
  }, [boardElements])

  const channelRef = useRef(null)
  const lobbyChannelRef = useRef(null)
  const peersMapRef = useRef(new Map())

  const [inviteCopied, setInviteCopied] = useState(false)
  const meetingUrl = getMeetingUrl(meetingId)

  function copyInvite() {
    navigator.clipboard.writeText(meetingUrl)
    setInviteCopied(true)
    setTimeout(() => setInviteCopied(false), 2500)
  }

  // ── Sync list of peers to local state ──
  const syncPeersState = useCallback(() => {
    const list = Array.from(peersMapRef.current.values()).map(p => ({
      id: p.id,
      name: p.meta?.name || 'مشارك',
      mic: p.meta?.mic !== false,
      cam: p.meta?.cam !== false,
      sharing: !!p.meta?.sharing,
      conn: p.pc.connectionState,
      presenceOffline: !!p.presenceOffline,
    }))
    setPeers(list)

    const sharingPeer = list.find(p => p.sharing)
    if (sharingPeer) {
      setRemoteName(`${sharingPeer.name} (يشارك الشاشة)`)
    } else if (list.length > 0) {
      setRemoteName(list[0].name)
    } else {
      setRemoteName('')
    }
  }, [])

  const bumpStreams = useCallback(() => setStreamVersion(v => v + 1), [])

  const closePeer = useCallback((id) => {
    const p = peersMapRef.current.get(id)
    if (!p) return
    try { p.pc.close() } catch {}
    peersMapRef.current.delete(id)
    syncPeersState()
    bumpStreams()
  }, [syncPeersState, bumpStreams])

  // ── Perfect Negotiation & WebRTC Signaling ──
  const sendSignal = useCallback((to, kind, data) => {
    const ch = channelRef.current
    if (!ch) return
    ch.send({
      type: 'broadcast',
      event: 'signal',
      payload: { from: myIdRef.current, fromName: displayName, to, kind, data },
    }).catch(() => {})
  }, [displayName])

  const ensurePeer = useCallback((id, meta) => {
    const map = peersMapRef.current
    let p = map.get(id)
    if (p) {
      if (meta) { p.meta = { ...p.meta, ...meta }; syncPeersState() }
      return p
    }
    if (map.size >= 5) return null

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
      ]
    })

    p = {
      id,
      pc,
      polite: myIdRef.current > id,
      makingOffer: false,
      ignoreOffer: false,
      pendingIce: [],
      remoteStream: new MediaStream(),
      meta: meta || {},
    }

    const vTx = pc.addTransceiver('video', { direction: 'sendrecv' })
    const aTx = pc.addTransceiver('audio', { direction: 'sendrecv' })
    p.videoSender = vTx.sender
    p.audioSender = aTx.sender

    const ls = localStream
    const vt = (sharing && screenTrackRef.current) ? screenTrackRef.current : (ls && ls.getVideoTracks()[0])
    const at = ls && ls.getAudioTracks()[0]
    if (vt) vTx.sender.replaceTrack(vt).catch(() => {})
    if (at) aTx.sender.replaceTrack(at).catch(() => {})

    pc.onnegotiationneeded = async () => {
      try {
        p.makingOffer = true
        await pc.setLocalDescription()
        sendSignal(id, 'sdp', pc.localDescription)
      } catch (e) {
        console.warn('[Meet] negotiation failed:', e)
      } finally {
        p.makingOffer = false
      }
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendSignal(id, 'ice', e.candidate.toJSON())
      }
    }

    pc.ontrack = (e) => {
      try { p.remoteStream.addTrack(e.track) } catch {}
      e.track.onunmute = bumpStreams
      bumpStreams()
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        try { pc.restartIce() } catch {}
      }
      syncPeersState()
    }

    map.set(id, p)
    syncPeersState()
    return p
  }, [localStream, sendSignal, syncPeersState, bumpStreams, sharing])

  const handleSignal = useCallback(async (payload) => {
    if (!payload || payload.to !== myIdRef.current) return
    const { from, fromName, kind, data } = payload
    if (kind === 'bye') { closePeer(from); return }
    const p = ensurePeer(from, fromName ? { name: fromName } : null)
    if (!p) return
    const pc = p.pc
    try {
      if (kind === 'sdp') {
        const desc = data
        const offerCollision = desc.type === 'offer' && (p.makingOffer || pc.signalingState !== 'stable')
        p.ignoreOffer = !p.polite && offerCollision
        if (p.ignoreOffer) return
        if (offerCollision) {
          await pc.setLocalDescription({ type: 'rollback' })
        }
        await pc.setRemoteDescription(desc)
        for (const c of p.pendingIce.splice(0)) {
          try { await pc.addIceCandidate(c) } catch {}
        }
        if (desc.type === 'offer') {
          await pc.setLocalDescription()
          sendSignal(from, 'sdp', pc.localDescription)
        }
      } else if (kind === 'ice') {
        if (!pc.remoteDescription) {
          p.pendingIce.push(data)
        } else {
          try { await pc.addIceCandidate(data) } catch (e) {
            if (!p.ignoreOffer) console.warn('[Meet] ICE candidate failed:', e)
          }
        }
      }
    } catch (e) {
      console.warn('[Meet] signal error:', e)
    }
  }, [ensurePeer, closePeer, sendSignal])

  const trackPresence = useCallback(() => {
    const ch = channelRef.current
    if (!ch) return
    ch.track({
      name: displayName || 'مشارك',
      mic: micOn,
      cam: camOn,
      sharing: sharing,
    }).catch(() => {})
  }, [displayName, micOn, camOn, sharing])

  const handlePresenceSync = useCallback(() => {
    const ch = channelRef.current
    if (!ch) return
    const state = ch.presenceState()
    const ids = Object.keys(state).filter(k => k !== myIdRef.current)
    ids.forEach(id => {
      const meta = (state[id] && state[id][0]) || {}
      // If a new peer joins, check if there's an existing offline peer with the same name and close it
      if (!peersMapRef.current.has(id)) {
        Array.from(peersMapRef.current.entries()).forEach(([oldId, oldP]) => {
          if (oldP.presenceOffline && oldP.meta?.name === meta.name) {
            console.log(`[Meet] Closing old offline peer ${oldId} since new peer ${id} with same name joined`);
            closePeer(oldId)
          }
        })
      }
      const p = ensurePeer(id, { name: meta.name, mic: meta.mic, cam: meta.cam, sharing: meta.sharing })
      if (p) {
        p.presenceOffline = false
      }
    })
    Array.from(peersMapRef.current.keys()).forEach(id => {
      if (!ids.includes(id)) {
        const p = peersMapRef.current.get(id)
        if (p) {
          if (!p.presenceOffline) {
            p.presenceOffline = true
            syncPeersState()
            setTimeout(() => {
              const currentP = peersMapRef.current.get(id)
              if (currentP && currentP.presenceOffline) {
                console.log(`[Meet] Cleaned up offline peer ${id} after timeout`);
                closePeer(id)
              }
            }, 15000)
          }
        } else {
          closePeer(id)
        }
      }
    })
  }, [ensurePeer, closePeer, syncPeersState])

  // ── Init Active Meeting ──
  useEffect(() => {
    registerActiveMeeting(meetingId, isAdminMode ? '' : displayName, isAdminMode ? displayName : '', isAdminMode, isTabletMode ? 'Tablet' : 'client')
    const hb = setInterval(() => {
      registerActiveMeeting(meetingId, isAdminMode ? '' : displayName, isAdminMode ? displayName : '', isAdminMode, isTabletMode ? 'Tablet' : 'client')
    }, 15000)

    return () => {
      clearInterval(hb)
      leaveActiveMeeting(meetingId, displayName, isAdminMode)
    }
  }, [meetingId, displayName, isAdminMode, isTabletMode])

  // ── Timer ──
  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // ── Supabase Channels ──
  useEffect(() => {
    const ch = supabase.channel(`meeting-${meetingId}`, {
      config: {
        broadcast: { self: false, ack: false },
        presence: { key: myIdRef.current },
      },
    })
    channelRef.current = ch

    ch.on('presence', { event: 'sync' }, handlePresenceSync)
    ch.on('broadcast', { event: 'signal' }, ({ payload }) => { handleSignal(payload) })
    ch.on('broadcast', { event: 'whiteboard_status' }, ({ payload }) => {
      setWhiteboardActive(payload.active)
    })

    ch.on('broadcast', { event: 'draw' }, ({ payload }) => {
      const ctx = ctxRef.current
      if (!ctx) return
      ctx.beginPath()
      ctx.moveTo(payload.x0, payload.y0)
      ctx.lineTo(payload.x1, payload.y1)
      ctx.strokeStyle = payload.tool === 'eraser' ? C.bg : payload.color
      ctx.lineWidth   = payload.tool === 'eraser' ? payload.size * 5 : payload.size
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke()
    })
    ch.on('broadcast', { event: 'element_add' }, ({ payload }) => {
      setBoardElements(prev => {
        if (prev.some(el => el.id === payload.id)) return prev
        return [...prev, payload]
      })
    })
    ch.on('broadcast', { event: 'element_update' }, ({ payload }) => {
      setBoardElements(prev => prev.map(el => el.id === payload.id ? { ...el, ...payload } : el))
    })
    ch.on('broadcast', { event: 'element_delete' }, ({ payload }) => {
      setBoardElements(prev => prev.filter(el => el.id !== payload.id))
    })
    ch.on('broadcast', { event: 'sync_wb_elements' }, ({ payload }) => {
      setBoardElements(payload)
    })
    ch.on('broadcast', { event: 'request_wb_sync' }, () => {
      if (boardElementsRef.current.length > 0 && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'sync_wb_elements',
          payload: boardElementsRef.current
        })
      }
    })
    ch.on('broadcast', { event: 'clear' }, () => {
      const c = wbRef.current; const ctx = ctxRef.current
      if (c && ctx) {
        ctx.fillStyle = C.bg
        ctx.fillRect(0, 0, c.width / (window.devicePixelRatio || 1), c.height / (window.devicePixelRatio || 1))
      }
      setBoardElements([])
    })
    ch.on('broadcast', { event: 'chat' }, ({ payload }) => {
      setMessages(prev => prev.some(m => m.id === payload.id) ? prev : [...prev, payload])
    })

    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        trackPresence()
        if (!isAdminMode) {
          ch.send({ type: 'broadcast', event: 'request_wb_sync' })
        }
      }
    })

    return () => {
      Array.from(peersMapRef.current.keys()).forEach(id => {
        try { sendSignal(id, 'bye', null) } catch {}
      })
      peersMapRef.current.forEach(p => { try { p.pc.close() } catch {} })
      peersMapRef.current.clear()
      ch.unsubscribe()
      channelRef.current = null
    }
  }, [meetingId, handlePresenceSync, handleSignal, trackPresence, sendSignal])

  // Lobby channel (knock/admit) for Admin
  useEffect(() => {
    if (!isAdminMode) return
    const lobbyChannel = supabase.channel(`lobby-${meetingId}`, {
      config: { broadcast: { self: true } }
    })
    lobbyChannelRef.current = lobbyChannel

    lobbyChannel
      .on('broadcast', { event: 'knock' }, ({ payload }) => {
        setPendingKnocks(prev =>
          prev.some(k => k.senderId === payload.senderId)
            ? prev
            : [...prev, { senderId: payload.senderId, name: payload.name }]
        )
      })
      .subscribe()

    return () => {
      lobbyChannel.unsubscribe()
      lobbyChannelRef.current = null
    }
  }, [meetingId, isAdminMode])

  // Track cam/mic/sharing status in presence
  useEffect(() => {
    trackPresence()
  }, [camOn, micOn, sharing, trackPresence])

  // Attach local stream to preview element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  // Replace WebRTC transceiver tracks when localStream is acquired or updated
  useEffect(() => {
    if (!localStream) return
    const vt = localStream.getVideoTracks()[0]
    const at = localStream.getAudioTracks()[0]
    
    peersMapRef.current.forEach(p => {
      if (!sharing && vt && p.videoSender) p.videoSender.replaceTrack(vt).catch(e => console.warn("Failed to replace video track:", e))
      if (at && p.audioSender) p.audioSender.replaceTrack(at).catch(e => console.warn("Failed to replace audio track:", e))
    })
  }, [localStream, sharing])

  // Attach first remote stream to main video
  useEffect(() => {
    const firstPeer = Array.from(peersMapRef.current.values())[0]
    if (firstPeer) {
      setRemoteStream(firstPeer.remoteStream)
      if (remoteVideoRef.current) {
        // Force refresh srcObject to handle track replacement
        remoteVideoRef.current.srcObject = null
        remoteVideoRef.current.srcObject = firstPeer.remoteStream
        remoteVideoRef.current.play()
          .then(() => setAutoplayBlocked(false))
          .catch(e => {
            console.warn("Remote video play failed:", e)
            setAutoplayBlocked(true)
          })
      }
    } else {
      setRemoteStream(null)
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
    }
  }, [peers, streamVersion])

  /* ── AUTO RECORDING (Admin only) ── */
  useEffect(() => {
    if (!isAdminMode || isTabletMode) return
    let rec, chunks = []
    const startRec = () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(st => {
          chunks = []
          recChunks.current = chunks
          try {
            rec = new MediaRecorder(st, { mimeType: 'video/webm;codecs=vp9,opus' })
            rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
            rec.start(1000)
            recorderRef.current = rec
            recTimer.current = setInterval(() => setRecDuration(d => d + 1), 1000)
          } catch (err) {
            console.warn('MediaRecorder failed:', err)
          }
        }).catch(() => {})
      }
    }
    startRec()
    return () => {
      try { rec?.stop() } catch {}
      if (recTimer.current) clearInterval(recTimer.current)
    }
  }, [isAdminMode, isTabletMode])

  /* ── AUTO TRANSCRIPT (Admin only) ── */
  useEffect(() => {
    if (!isAdminMode) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const r = new SR()
    r.lang = 'ar-SA'
    r.continuous = true
    r.interimResults = false
    r.onresult = e => {
      const last = e.results[e.results.length - 1]
      if (last.isFinal) {
        setTranscript(prev => [...prev, { id: Date.now(), speaker: displayName, text: last[0].transcript, time: nowTime() }])
      }
    }
    r.onerror = () => {}
    r.start()
    recognitionRef.current = r
    setListening(true)
    return () => r.stop()
  }, [isAdminMode, displayName])

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  /* ── WB init & Scroll Prevention ── */
  useEffect(() => {
    const isTablet = displayName === 'Tablet' || isTabletMode
    const active = whiteboardActive || isTablet
    if (active) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [whiteboardActive, displayName, isTabletMode])

  useEffect(() => {
    const isTablet = displayName === 'Tablet' || isTabletMode
    if ((!whiteboardActive && !isTablet) || !wbRef.current) return
    const c = wbRef.current

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return
      const rect = entries[0].contentRect
      if (rect.width === 0 || rect.height === 0) return

      let tempCanvas = null
      if (c.width > 0 && c.height > 0) {
        tempCanvas = document.createElement('canvas')
        tempCanvas.width = c.width
        tempCanvas.height = c.height
        const tempCtx = tempCanvas.getContext('2d')
        if (tempCtx) tempCtx.drawImage(c, 0, 0)
      }

      const dpr = window.devicePixelRatio || 1
      const oldW = c.width
      const oldH = c.height

      c.width = rect.width * dpr
      c.height = rect.height * dpr
      const ctx = c.getContext('2d')
      if (ctx) {
        ctx.scale(dpr, dpr)
        ctx.fillStyle = C.bg
        ctx.fillRect(0, 0, rect.width, rect.height)
        
        if (tempCanvas && oldW > 0 && oldH > 0) {
          ctx.drawImage(tempCanvas, 0, 0, oldW, oldH, 0, 0, rect.width * dpr, rect.height * dpr)
        }
        ctxRef.current = ctx
      }
    })

    if (c.parentElement) {
      resizeObserver.observe(c.parentElement)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [whiteboardActive, displayName, isTabletMode])

  useEffect(() => {
    const canvas = wbRef.current
    if (!canvas) return
    const preventScroll = (e) => {
      e.preventDefault()
    }
    canvas.addEventListener('wheel', preventScroll, { passive: false })
    canvas.addEventListener('touchmove', preventScroll, { passive: false })
    return () => {
      canvas.removeEventListener('wheel', preventScroll)
      canvas.removeEventListener('touchmove', preventScroll)
    }
  }, [whiteboardActive, isTabletMode, displayName])

  /* ── Fullscreen ── */
  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  function toggleFullscreen() {
    if (!fullscreen) roomRef.current?.requestFullscreen?.()
    else document.exitFullscreen?.()
  }

  async function endMeeting() {
    if (isAdminMode && recorderRef.current) {
      recorderRef.current.stop()
      clearInterval(recTimer.current)
      await new Promise(r => setTimeout(r, 500))

      let aiSummary = '', aiTasks = []
      if (transcript.length > 0) {
        const result = await summarizeMeeting(transcript)
        if (result) {
          aiSummary = result
          const lines = result.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'))
          aiTasks = lines.map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean)
        } else {
          aiSummary = `اجتماع بتاريخ ${nowDate()} مع ${displayName}. تم تسجيل ${transcript.length} جملة.`
        }
      }

      const chunks = recChunks.current
      let videoUrl = ''
      if (chunks.length > 0) {
        const blob = new Blob(chunks, { type: 'video/webm' })
        videoUrl = URL.createObjectURL(blob)
      }

      const record = {
        id: meetingId,
        date: nowDate(),
        duration: elapsed,
        host: displayName,
        transcript,
        summary: aiSummary,
        tasks: aiTasks,
        videoUrl,
        videoBlob: chunks.length > 0 ? new Blob(chunks, { type: 'video/webm' }) : null,
      }
      await saveMeeting(record).catch(() => {})
    }

    recognitionRef.current?.stop()
    onLeave()
  }

  /* ── WB helpers ── */
  function wbPos(e) {
    const r = wbRef.current.getBoundingClientRect()
    const s = e.touches ? e.touches[0] : e
    return { x: s.clientX - r.left, y: s.clientY - r.top }
  }

  function wbDown(e) {
    if (wbTool === 'select') return
    e.preventDefault()
    drawing.current = true
    const pos = wbPos(e)
    lastPos.current = pos
    startPos.current = pos
    strokePoints.current = [pos]

    const c = wbRef.current
    const ctx = ctxRef.current
    if (c && ctx) {
      savedImageData.current = ctx.getImageData(0, 0, c.width, c.height)
    }
  }

  function wbMove(e) {
    if (wbTool === 'select') return
    e.preventDefault()
    if (!drawing.current) return
    const pos = wbPos(e)
    const ctx = ctxRef.current
    if (!ctx) return

    strokePoints.current.push(pos)

    const isShapeTool = ['rect', 'circle', 'line', 'triangle'].includes(wbTool)

    if (isShapeTool) {
      if (savedImageData.current) {
        ctx.putImageData(savedImageData.current, 0, 0)
      }
      ctx.beginPath()
      ctx.strokeStyle = wbColor
      ctx.lineWidth = wbSize
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (wbTool === 'rect') {
        ctx.rect(startPos.current.x, startPos.current.y, pos.x - startPos.current.x, pos.y - startPos.current.y)
      } else if (wbTool === 'circle') {
        const radius = Math.sqrt(Math.pow(pos.x - startPos.current.x, 2) + Math.pow(pos.y - startPos.current.y, 2))
        ctx.arc(startPos.current.x, startPos.current.y, radius, 0, 2 * Math.PI)
      } else if (wbTool === 'line') {
        ctx.moveTo(startPos.current.x, startPos.current.y)
        ctx.lineTo(pos.x, pos.y)
      } else if (wbTool === 'triangle') {
        ctx.moveTo((startPos.current.x + pos.x) / 2, startPos.current.y)
        ctx.lineTo(pos.x, pos.y)
        ctx.lineTo(startPos.current.x, pos.y)
        ctx.closePath()
      }
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.moveTo(lastPos.current.x, lastPos.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.strokeStyle = wbTool === 'eraser' ? C.bg : wbColor
      ctx.lineWidth   = wbTool === 'eraser' ? wbSize * 5 : wbSize
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke()

      // Do NOT broadcast raw drawings to remote peer for post-processing AI tools
      if (channelRef.current && !['correction', 'text_ai'].includes(wbTool)) {
        channelRef.current.send({
          type: 'broadcast', event: 'draw',
          payload: { x0: lastPos.current.x, y0: lastPos.current.y, x1: pos.x, y1: pos.y, color: wbColor, size: wbSize, tool: wbTool }
        })
      }
    }
    lastPos.current = pos
  }

  async function wbUp() {
    if (!drawing.current) return
    drawing.current = false
    const ctx = ctxRef.current
    const c = wbRef.current
    if (!ctx || !c) return

    const endPos = lastPos.current
    const isShapeTool = ['rect', 'circle', 'line', 'triangle'].includes(wbTool)

    if (isShapeTool) {
      if (savedImageData.current) {
        ctx.putImageData(savedImageData.current, 0, 0)
      }

      const containerRect = c.parentElement.getBoundingClientRect()
      const x0 = startPos.current.x
      const y0 = startPos.current.y
      const x1 = endPos.x
      const y1 = endPos.y

      const left = Math.min(x0, x1)
      const top = Math.min(y0, y1)
      const width = Math.max(10, Math.abs(x1 - x0))
      const height = Math.max(10, Math.abs(y1 - y0))

      const xPercent = (left / containerRect.width) * 100
      const yPercent = (top / containerRect.height) * 100
      const wPercent = (width / containerRect.width) * 100
      const hPercent = (height / containerRect.height) * 100

      const flipX = x1 < x0
      const flipY = y1 < y0

      const newShape = {
        id: 'shape_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        type: 'shape',
        tool: wbTool,
        x: xPercent,
        y: yPercent,
        w: wPercent,
        h: hPercent,
        flipX,
        flipY,
        color: wbColor,
        size: wbSize
      }

      setBoardElements(prev => [...prev, newShape])
      setWbTool('select')

      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'element_add',
          payload: newShape
        })
      }
    } else if (wbTool === 'correction') {
      const points = strokePoints.current
      if (points.length < 5) return

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
      points.forEach(p => {
        if (p.x < minX) minX = p.x
        if (p.x > maxX) maxX = p.x
        if (p.y < minY) minY = p.y
        if (p.y > maxY) maxY = p.y
      })

      const W = maxX - minX
      const H = maxY - minY
      if (W < 10 || H < 10) return

      const start = points[0]
      const end = points[points.length - 1]
      const distStartEnd = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))

      let pathLength = 0
      for (let i = 1; i < points.length; i++) {
        pathLength += Math.sqrt(Math.pow(points[i].x - points[i-1].x, 2) + Math.pow(points[i].y - points[i-1].y, 2))
      }

      if (savedImageData.current) {
        ctx.putImageData(savedImageData.current, 0, 0)
      }

      const simplified = simplifyPath(points, 12)
      const numVertices = simplified.length

      let correctedTool = 'rect'
      let x0 = minX, y0 = minY, x1 = maxX, y1 = maxY

      if (distStartEnd > 40 && pathLength < 1.35 * distStartEnd) {
        correctedTool = 'line'
        x0 = start.x
        y0 = start.y
        x1 = end.x
        y1 = end.y
      } else {
        const isClosed = distStartEnd < 0.3 * pathLength || distStartEnd < 50
        if (isClosed) {
          if (numVertices <= 4) {
            correctedTool = 'triangle'
          } else {
            const ratio = Math.abs(W - H) / Math.max(W, H)
            if (ratio < 0.3) {
              correctedTool = 'circle'
            } else {
              correctedTool = 'rect'
            }
          }
        } else {
          correctedTool = 'line'
          x0 = start.x
          y0 = start.y
          x1 = end.x
          y1 = end.y
        }
      }

      const containerRect = c.parentElement.getBoundingClientRect()
      const left = Math.min(x0, x1)
      const top = Math.min(y0, y1)
      const width = Math.max(10, Math.abs(x1 - x0))
      const height = Math.max(10, Math.abs(y1 - y0))

      const xPercent = (left / containerRect.width) * 100
      const yPercent = (top / containerRect.height) * 100
      const wPercent = (width / containerRect.width) * 100
      const hPercent = (height / containerRect.height) * 100

      const flipX = x1 < x0
      const flipY = y1 < y0

      const newShape = {
        id: 'shape_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        type: 'shape',
        tool: correctedTool,
        x: xPercent,
        y: yPercent,
        w: wPercent,
        h: hPercent,
        flipX,
        flipY,
        color: wbColor,
        size: wbSize
      }

      setBoardElements(prev => [...prev, newShape])
      setWbTool('select')

      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'element_add',
          payload: newShape
        })
      }
    } else if (wbTool === 'text_ai') {
      const points = strokePoints.current
      if (points.length < 5) return

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
      points.forEach(p => {
        if (p.x < minX) minX = p.x
        if (p.x > maxX) maxX = p.x
        if (p.y < minY) minY = p.y
        if (p.y > maxY) maxY = p.y
      })

      const W = maxX - minX
      const H = maxY - minY
      if (W < 10 || H < 10) return

      if (savedImageData.current) {
        ctx.putImageData(savedImageData.current, 0, 0)
      }

      setIsOCRProcessing(true)

      const dpr = window.devicePixelRatio || 1
      const pad = 10
      const sx = Math.max(0, (minX - pad) * dpr)
      const sy = Math.max(0, (minY - pad) * dpr)
      const sw = Math.min(c.width - sx, (W + pad * 2) * dpr)
      const sh = Math.min(c.height - sy, (H + pad * 2) * dpr)

      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = sw
      tempCanvas.height = sh
      const tempCtx = tempCanvas.getContext('2d')
      tempCtx.drawImage(c, sx, sy, sw, sh, 0, 0, sw, sh)
      const croppedBase64 = tempCanvas.toDataURL('image/png')

      try {
        const response = await fetch('/api/ai/correct-handwriting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: croppedBase64
          })
        })
        const resJson = await response.json()
        if (resJson.success && resJson.data && resJson.data.text) {
          const correctedText = resJson.data.text.trim().replace(/^"|"$/g, '')
          
          const containerRect = c.parentElement.getBoundingClientRect()
          const charsCount = correctedText.length
          const estWidthPx = Math.max(120, charsCount * 15)
          const estHeightPx = 48
          
          const wPercent = Math.min(90, (estWidthPx / containerRect.width) * 100)
          const hPercent = Math.min(30, (estHeightPx / containerRect.height) * 100)
          
          const xPercent = (minX / containerRect.width) * 100
          const yPercent = (minY / containerRect.height) * 100

          const newText = {
            id: 'text_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            type: 'text',
            text: correctedText,
            x: xPercent,
            y: yPercent,
            w: wPercent,
            h: hPercent,
            color: wbColor,
            size: wbSize
          }

          setBoardElements(prev => [...prev, newText])
          setWbTool('select')

          if (channelRef.current) {
            channelRef.current.send({
              type: 'broadcast',
              event: 'element_add',
              payload: newText
            })
          }
        }
      } catch (err) {
        console.error('Failed to correct handwriting via AI:', err)
      } finally {
        setIsOCRProcessing(false)
      }
    }
  }

  function compressImage(file, maxDimension = 500) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let w = img.width
          let h = img.height
          if (w > maxDimension || h > maxDimension) {
            if (w > h) {
              h = Math.round((h * maxDimension) / w)
              w = maxDimension
            } else {
              w = Math.round((w * maxDimension) / h)
              h = maxDimension
            }
          }
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, w, h)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.5)
          resolve({ dataUrl, width: w, height: h })
        }
        img.onerror = reject
        img.src = e.target.result
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  function clearCanvas() {
    const c = wbRef.current; const ctx = ctxRef.current
    if (c && ctx) {
      ctx.fillStyle = C.bg
      ctx.fillRect(0, 0, c.width / (window.devicePixelRatio || 1), c.height / (window.devicePixelRatio || 1))
      setBoardElements([])
      if (channelRef.current) channelRef.current.send({ type: 'broadcast', event: 'clear' })
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      const { dataUrl, width, height } = await compressImage(file, 500)
      
      const canvas = wbRef.current
      if (!canvas) return
      
      const containerRect = canvas.parentElement.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const containerWidth = containerRect.width || (canvas.width / dpr) || 800
      const containerHeight = containerRect.height || (canvas.height / dpr) || 600
      
      const wPercent = 40
      const imageAspect = width / height
      
      const wPx = containerWidth * (wPercent / 100)
      const hPx = wPx / imageAspect
      
      let hPercent = (hPx / containerHeight) * 100
      if (isNaN(hPercent) || !isFinite(hPercent) || hPercent <= 0) {
        hPercent = 40
      }
      
      let xPercent = (100 - wPercent) / 2
      let yPercent = (100 - hPercent) / 2
      if (isNaN(xPercent)) xPercent = 30
      if (isNaN(yPercent)) yPercent = 30
      
      const newImage = {
        id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        type: 'image',
        dataUrl,
        x: xPercent,
        y: yPercent,
        w: wPercent,
        h: hPercent
      }
      
      setBoardElements(prev => [...prev, newImage])
      setWbTool('select')
      
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'element_add',
          payload: newImage
        })
      }
    } catch (err) {
      console.error('Failed to compress/upload image:', err)
    }
  }

  async function handleAIAnalysis() {
    if (transcript.length === 0) return
    setAnalyzing(true)
    setAnalysisResult('')
    try {
      const text = transcript.map(t => `${t.speaker}: ${t.text}`).join('\n')
      const prompt = `أنت مساعد ذكي ومحلل اجتماعات خبير. قم بتحليل هذا الاجتماع بشكل كامل ودقيق باللغة العربية:\n\n${text}\n\nاكتب تقريراً منسقاً يحتوي على:\n1. ملخص تنفيذي ذكي للاجتماع.\n2. أهم النقاط والقرارات التي تم الاتفاق عليها.\n3. المهام المطلوبة ومَن المسؤول عن كل مهمة.`
      const result = await askOllama(prompt)
      if (result) {
        setAnalysisResult(result)
        setSummary(result)
      } else {
        setAnalysisResult('فشلت عملية التحليل من أولاما. يرجى التأكد من تشغيل Ollama محلياً على منفذ 11434.')
      }
    } catch (e) {
      setAnalysisResult('حدث خطأ أثناء محاولة الاتصال بالذكاء الاصطناعي Ollama.')
    } finally {
      setAnalyzing(false)
    }
  }

  /* ── Chat ── */
  function sendMsg() {
    if (!msgInput.trim()) return
    const newMsg = { id: Date.now(), from: displayName, text: msgInput.trim(), time: nowTime() }
    setMessages(p => [...p, newMsg])
    setMsgInput('')
    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'chat', payload: newMsg })
    }
  }

  async function toggleShare() {
    if (sharing) { stopShare(); return }
    try {
      const ds = await navigator.mediaDevices.getDisplayMedia({ video: true })
      const track = ds.getVideoTracks()[0]
      screenTrackRef.current = track
      setScreenStream(ds)
      
      peersMapRef.current.forEach(p => {
        if (p.videoSender) p.videoSender.replaceTrack(track).catch(() => {})
      })

      track.onended = stopShare
      setSharing(true)
    } catch (e) {
      console.error('Failed to get screen share stream:', e)
    }
  }

  function stopShare() {
    if (screenTrackRef.current) {
      try { screenTrackRef.current.stop() } catch {}
      screenTrackRef.current = null
    }
    setScreenStream(null)
    const cam = (localStream && localStream.getVideoTracks()[0]) || null
    peersMapRef.current.forEach(p => {
      if (p.videoSender) p.videoSender.replaceTrack(cam).catch(() => {})
    })
    setSharing(false)
  }

  const isTablet = displayName === 'Tablet' || isTabletMode

  if (isTablet) {
    return (
      <TabletWhiteboard
        meetingId={meetingId}
        onLeave={endMeeting}
        channelRef={channelRef}
        wbRef={wbRef} ctxRef={ctxRef}
        wbColor={wbColor} setWbColor={setWbColor}
        wbSize={wbSize} setWbSize={setWbSize}
        wbTool={wbTool} setWbTool={setWbTool}
        wbPos={wbPos} wbDown={wbDown} wbMove={wbMove} wbUp={wbUp}
        clearCanvas={clearCanvas}
        handleImageUpload={handleImageUpload}
        isOCRProcessing={isOCRProcessing}
        boardElements={boardElements}
        setBoardElements={setBoardElements}
      />
    )
  }

  function admitClient(knock) {
    if (lobbyChannelRef.current) {
      lobbyChannelRef.current.send({
        type: 'broadcast', event: 'admit',
        payload: { targetId: knock.senderId, name: knock.name }
      })
    }
    setPendingKnocks(prev => prev.filter(k => k.senderId !== knock.senderId))
  }

  return (
    <div ref={roomRef} style={{ ...rm.root, ...(fullscreen ? rm.rootFull : {}) }}>

      {/* ── KNOCK NOTIFICATION (admin only) ── */}
      {isAdminMode && pendingKnocks.map(knock => (
        <div key={knock.senderId} style={rm.knockBanner}>
          <Icon name="notifications_active" size={20} style={{ color: C.yellow }} />
          <span style={{ color: C.text, fontWeight: 600, flex: 1 }}>
            <span style={{ color: C.yellow }}>{knock.name}</span> يطلب الدخول للاجتماع
          </span>
          <button onClick={() => admitClient(knock)} style={rm.admitBtn}>
            <Icon name="check" size={16} /> قبول
          </button>
          <button onClick={() => setPendingKnocks(prev => prev.filter(k => k.senderId !== knock.senderId))} style={rm.rejectBtn}>
            <Icon name="close" size={16} /> رفض
          </button>
        </div>
      ))}

      {/* ── TOP BAR ── */}
      <div style={rm.topBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src="/logo.png" alt="Vixcell" style={{ height: 22 }} />
          <div style={rm.timer}>{fmtDur(elapsed)}</div>
          {isAdminMode && (
            <div style={rm.recBadge}>
              <span style={rm.recDot} />
              <span>REC {fmtDur(recDuration)}</span>
            </div>
          )}
          {isListening && (
            <div style={rm.aiBadge}>
              <Icon name="record_voice_over" size={13} style={{ color: '#fff' }} />
              <span>AI مفعّل</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isAdminMode && (
            <button onClick={copyInvite} style={{ ...rm.inviteQuickBtn, background: inviteCopied ? 'rgba(52,168,83,0.12)' : 'rgba(26,115,232,0.1)', borderColor: inviteCopied ? 'rgba(52,168,83,0.3)' : 'rgba(26,115,232,0.2)', color: inviteCopied ? C.green : C.blue }}>
              <Icon name={inviteCopied ? 'check' : 'link'} size={15} />
              {inviteCopied ? 'تم النسخ' : 'نسخ رابط العميل'}
            </button>
          )}
          <span style={rm.hostName}>{displayName}</span>
          {isAdminMode && <span style={rm.adminTag}>أدمن</span>}
          <button onClick={endMeeting} style={rm.endBtn}>
            <Icon name="call_end" size={20} />
          </button>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── VIDEO AREA ── */}
        <div style={{ flex: 1, position: 'relative', background: '#000', overflow: 'hidden' }}>
          {whiteboardActive ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: C.bg, position: 'relative', zIndex: 10 }}>
              <div style={{ ...rm.wbBar, flexWrap: 'wrap', height: 'auto', minHeight: 48, padding: '8px 16px', gap: 6 }}>
                {tools.map(t => (
                  <button key={t.id} onClick={() => setWbTool(t.id)}
                    title={t.label}
                    style={{
                      ...rm.wbTool,
                      background: wbTool===t.id ? 'rgba(26,115,232,0.15)' : 'transparent',
                      border: wbTool===t.id ? `1px solid rgba(26,115,232,0.25)` : '1px solid transparent',
                      borderRadius: 6, padding: '4px 8px', height: 32, width: 'auto',
                      display: 'flex', alignItems: 'center', gap: 4
                    }}>
                    <Icon name={t.icon} size={16} style={{ color: wbTool===t.id ? C.blue : C.text2 }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: wbTool===t.id ? C.blue : C.text2, fontFamily: FONT }}>{t.label}</span>
                  </button>
                ))}
                
                <div style={rm.wbDiv} />
                
                <input type="file" accept="image/*" id="desktop-wb-image-upload" onChange={handleImageUpload} style={{ display: 'none' }} />
                <button onClick={() => document.getElementById('desktop-wb-image-upload')?.click()} style={{
                  ...rm.wbTool,
                  border: `1px solid ${C.border}`, borderRadius: 6, padding: '4px 8px',
                  display: 'flex', alignItems: 'center', gap: 4, height: 32, cursor: 'pointer'
                }} title="رفع صورة">
                  <Icon name="image" size={16} style={{ color: C.text2 }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: C.text2, fontFamily: FONT }}>صورة</span>
                </button>

                <div style={rm.wbDiv} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {['#1a73e8','#34a853','#ea4335','#fbbc04','#a142f4','#ffffff'].map(col => (
                    <button key={col} onClick={() => { setWbColor(col); if (wbTool === 'eraser') setWbTool('pen') }}
                      style={{ ...rm.colorBtn, background: col, outline: wbColor===col ? '2px solid #fff' : 'none', width: 18, height: 18 }} />
                  ))}
                </div>

                <div style={rm.wbDiv} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="line_weight" size={16} style={{ color: C.text2 }} />
                  <input type="range" min="1" max="16" value={wbSize} onChange={e => setWbSize(+e.target.value)}
                    style={{ width: 60, accentColor: C.blue }} />
                </div>

                <div style={rm.wbDiv} />

                <button onClick={clearCanvas} style={rm.wbTool} title="مسح">
                  <Icon name="delete_sweep" size={18} style={{ color: C.text2 }} />
                </button>
                <button onClick={() => { const a=document.createElement('a'); a.href=wbRef.current.toDataURL(); a.download='board.png'; a.click() }}
                  style={rm.wbTool} title="حفظ">
                  <Icon name="save" size={18} style={{ color: C.text2 }} />
                </button>
                {isAdminMode && (
                  <button onClick={() => toggleWhiteboard(false)} style={{ ...rm.wbTool, marginRight: 'auto', background: C.red, color: '#fff', borderRadius: 8, padding: '4px 10px', height: 'auto', width: 'auto', display: 'flex', alignItems: 'center', gap: 4 }} title="إغلاق السبورة للجميع">
                    <Icon name="close" size={16} style={{ color: '#fff' }} />
                    <span style={{ fontSize: 11, fontFamily: FONT }}>إغلاق السبورة</span>
                  </button>
                )}
              </div>
              <div style={{ flex: 1, position: 'relative', background: C.bg }}>
                {isOCRProcessing && (
                  <div style={{
                    position: 'absolute', inset: 0, margin: 'auto',
                    width: 200, height: 50, borderRadius: 10,
                    background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)',
                    border: `1px solid rgba(26,115,232,0.2)`,
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 10, zIndex: 100, fontSize: 12, fontFamily: FONT, fontWeight: 600,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                  }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.1)',
                      borderTop: `2px solid ${C.blue}`,
                      animation: 'spin 1s linear infinite'
                    }} />
                    <span>جاري تصحيح النص...</span>
                  </div>
                )}
                <canvas ref={wbRef} style={rm.wbCanvas}
                  onMouseDown={wbDown} onMouseMove={wbMove} onMouseUp={wbUp} onMouseLeave={wbUp}
                  onTouchStart={wbDown} onTouchMove={wbMove} onTouchEnd={wbUp} />
                
                {boardElements.map(img => (
                  <BoardElement
                    key={img.id}
                    img={img}
                    containerRef={wbRef}
                    disabled={wbTool !== 'select'}
                    onUpdate={(updated) => {
                      setBoardElements(prev => prev.map(i => i.id === img.id ? { ...i, ...updated } : i))
                      if (channelRef.current) {
                        channelRef.current.send({
                          type: 'broadcast',
                          event: 'element_update',
                          payload: { id: img.id, ...updated }
                        })
                      }
                    }}
                    onDelete={() => {
                      setBoardElements(prev => prev.filter(i => i.id !== img.id))
                      if (channelRef.current) {
                        channelRef.current.send({
                          type: 'broadcast',
                          event: 'element_delete',
                          payload: { id: img.id }
                        })
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          ) : sharing && screenStream ? (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <video
                ref={el => { if (el && screenStream) el.srcObject = screenStream }}
                autoPlay
                playsInline
                muted
                style={rm.mainVideo}
              />
              <div style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(0,0,0,0.7)', padding: '6px 12px', borderRadius: 8, fontSize: 12, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.blue }} />
                <span>أنت تشارك شاشتك حالياً للجميع</span>
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <video
                ref={el => {
                  remoteVideoRef.current = el;
                  if (el && remoteStream) {
                    if (el.srcObject !== remoteStream) el.srcObject = remoteStream;
                    el.play()
                      .then(() => setAutoplayBlocked(false))
                      .catch(e => {
                        console.warn("Remote video play failed on callback ref:", e);
                        setAutoplayBlocked(true);
                      });
                  }
                }}
                autoPlay
                playsInline
                onDoubleClick={() => setVideoFit(f => f === 'contain' ? 'cover' : 'contain')}
                style={{ ...rm.mainVideo, objectFit: videoFit, display: remoteStream ? 'block' : 'none', cursor: 'pointer' }}
              />
              {remoteStream && isReconnecting && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 20,
                  color: '#fff',
                  fontFamily: FONT,
                  zIndex: 15,
                  borderRadius: 12,
                  animation: 'fadeIn 0.3s ease-in-out',
                  padding: 24,
                  textAlign: 'center'
                }}>
                  <style>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                    @keyframes fadeIn {
                      from { opacity: 0; }
                      to { opacity: 1; }
                    }
                  `}</style>
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    border: '4px solid rgba(255, 255, 255, 0.1)',
                    borderTop: `4px solid ${C.blue || '#1a73e8'}`,
                    animation: 'spin 1s linear infinite'
                  }} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                      انقطع الاتصال مؤقتاً
                    </h4>
                    <p style={{ margin: '8px 0 0 0', fontSize: 14, color: '#94a3b8', lineHeight: 1.5 }}>
                      جاري إعادة الاتصال تلقائياً، يرجى الانتظار...
                    </p>
                  </div>
                </div>
              )}
              {autoplayBlocked && (
                <button
                  onClick={handleManualPlay}
                  style={{
                    position: 'absolute', inset: 0, margin: 'auto',
                    width: 220, height: 50, borderRadius: 25,
                    background: 'linear-gradient(135deg, #1a73e8, #4a90e2)',
                    color: '#fff', border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 700, fontFamily: FONT,
                    boxShadow: '0 8px 24px rgba(26,115,232,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    zIndex: 20,
                  }}
                >
                  <Icon name="volume_up" size={20} />
                  <span>تفعيل الصوت والفيديو</span>
                </button>
              )}
              {remoteStream && (
                <button
                  onClick={() => setVideoFit(f => f === 'contain' ? 'cover' : 'contain')}
                  style={{
                    position: 'absolute', top: 20, left: 20,
                    background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)',
                    padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                    color: '#fff', cursor: 'pointer', fontFamily: FONT,
                    display: 'flex', alignItems: 'center', gap: 6, zIndex: 10,
                    transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                  }}
                >
                  <Icon name={videoFit === 'contain' ? 'zoom_in' : 'zoom_out'} size={16} />
                  <span>{videoFit === 'contain' ? 'ملء الشاشة (تكبير)' : 'ملاءمة الشاشة (تصغير)'}</span>
                </button>
              )}
              {remoteStream && (
                <div style={{
                  position: 'absolute', bottom: 20, left: 20,
                  background: 'rgba(0,0,0,0.6)', padding: '4px 10px',
                  borderRadius: 6, fontSize: 12, color: '#fff',
                  fontFamily: FONT, zIndex: 5
                }}>
                  {remoteName || 'مشارك خارجي'}
                </div>
              )}
              {!remoteStream && (
                <div style={rm.mainPlaceholder}>
                  <div style={rm.waitingPulse}>
                    <Icon name="groups" size={64} style={{ color: 'rgba(255,255,255,0.12)' }} />
                  </div>
                  <p style={{ color: C.text3, marginTop: 16, fontFamily: FONT, fontSize: 15 }}>
                    {isAdminMode ? 'شارك الرابط مع العميل لبدء الاجتماع' : 'في انتظار بدء الاجتماع...'}
                  </p>
                  {isAdminMode && (
                    <button onClick={copyInvite} style={rm.waitingCopyBtn}>
                      <Icon name={inviteCopied ? 'check_circle' : 'link'} size={18} />
                      {inviteCopied ? 'تم نسخ الرابط!' : 'نسخ رابط الاجتماع للعميل'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

        {/* PiP */}
        <div style={rm.pip}>
          {camOn && localStream ? (
            <video
              ref={el => {
                localVideoRef.current = el;
                if (el && localStream) {
                  el.srcObject = localStream;
                }
              }}
              autoPlay
              muted
              playsInline
              style={rm.pipVideo}
            />
          ) : (
            <div style={rm.pipOff}><Icon name="videocam_off" size={24} style={{ color: C.text3 }} /></div>
          )}
          <div style={rm.pipLabel}>{displayName}</div>
        </div>
        </div>

        {/* ── SIDE PANEL ── */}
        {!!panel && (
          <div style={rm.side}>
            <div style={rm.sideHead}>
              <span style={{ fontWeight: 700, color: C.text, fontFamily: FONT }}>
                {panel === 'chat' && 'المحادثة'}
                {panel === 'transcript' && 'النص التلقائي'}
                {panel === 'whiteboard' && 'السبورة'}
                {panel === 'participants' && 'المشاركون'}
              </span>
              <button onClick={() => setPanel(null)} style={rm.sideClose}>
                <Icon name="close" size={20} />
              </button>
            </div>

            {/* CHAT */}
            {panel === 'chat' && (
              <div style={rm.sideFlex}>
                <div style={rm.chatList}>
                  {messages.map(m => (
                    <div key={m.id} style={m.system ? rm.sysMsg : m.from === displayName ? rm.myBubble : rm.otherBubble}>
                      {!m.system && <div style={rm.bubbleName}>{m.from}</div>}
                      <div style={m.system ? rm.sysTxt : rm.bubbleTxt}>{m.text}</div>
                      {!m.system && <div style={rm.bubbleTime}>{m.time}</div>}
                    </div>
                  ))}
                  <div ref={chatEnd} />
                </div>
                <div style={rm.chatBar}>
                  <input value={msgInput} onChange={e => setMsgInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMsg()}
                    placeholder="اكتب رسالة..." style={rm.chatInput} />
                  <button onClick={sendMsg} style={rm.sendBtn}>
                    <Icon name="send" size={18} style={{ color: '#fff' }} />
                  </button>
                </div>
              </div>
            )}

            {/* TRANSCRIPT */}
            {panel === 'transcript' && (
              <div style={rm.sidePad}>
                {!isAdminMode
                  ? <div style={rm.noAccess}><Icon name="lock" size={32} style={{ color: C.text3 }} /><p>للأدمن فقط</p></div>
                  : <>
                    <div style={rm.aiStatus}>
                      <span style={{ ...rm.aiDot, background: isListening ? C.green : C.text3 }} />
                      <span style={{ color: isListening ? C.green : C.text3, fontSize: 12 }}>
                        {isListening ? 'يستمع ويحول الكلام لنص...' : 'متوقف'}
                      </span>
                      {transcript.length > 0 && (
                        <button onClick={() => {
                          const txt = transcript.map(t => `[${t.time}] ${t.speaker}: ${t.text}`).join('\n')
                          const a = document.createElement('a')
                          a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain;charset=utf-8' }))
                          a.download = `transcript-${meetingId.slice(0,8)}.txt`; a.click()
                        }} style={rm.dlBtn}>
                          <Icon name="download" size={14} />تحميل
                        </button>
                      )}
                    </div>
                    {transcript.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                        <button
                          onClick={handleAIAnalysis}
                          disabled={analyzing}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            padding: '8px 12px',
                            borderRadius: 8,
                            background: C.blue,
                            color: '#fff',
                            border: 'none',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: analyzing ? 'not-allowed' : 'pointer',
                            opacity: analyzing ? 0.7 : 1,
                            fontFamily: FONT
                          }}
                        >
                          <Icon name="auto_awesome" size={14} />
                          {analyzing ? 'جاري التحليل من أولاما...' : 'تحليل الاجتماع بالكامل بالذكاء الاصطناعي'}
                        </button>
                        
                        {analysisResult && (
                          <div style={{
                            background: 'rgba(26, 115, 232, 0.08)',
                            border: `1px solid rgba(26, 115, 232, 0.15)`,
                            borderRadius: 8,
                            padding: 12,
                            fontSize: 12,
                            lineHeight: 1.6,
                            color: C.text,
                            maxHeight: 200,
                            overflowY: 'auto',
                            fontFamily: FONT
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <span style={{ fontWeight: 700, color: C.blue }}>تحليل أولاما الذكي:</span>
                              <button onClick={() => setAnalysisResult('')} style={{ background: 'none', border: 'none', color: C.text2, cursor: 'pointer' }}>
                                <Icon name="close" size={14} />
                              </button>
                            </div>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{analysisResult}</div>
                          </div>
                        )}
                      </div>
                    )}
                    <div style={rm.transcriptList}>
                      {transcript.length === 0
                        ? <p style={rm.emptyTxt}>الكلام سيظهر هنا تلقائياً...</p>
                        : transcript.map(t => (
                          <div key={t.id} style={rm.transcriptItem}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                              <span style={{ color: C.blue, fontSize: 11, fontWeight: 700 }}>{t.speaker}</span>
                              <span style={{ color: C.text3, fontSize: 10 }}>{t.time}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: C.text }}>{t.text}</p>
                          </div>
                        ))
                      }
                    </div>
                    {summary && (
                      <div style={rm.summaryCard}>
                        <div style={{ color: C.yellow, fontWeight: 700, marginBottom: 8, fontSize: 13 }}>
                          <Icon name="auto_awesome" size={14} /> ملخص AI
                        </div>
                        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.8, whiteSpace: 'pre-wrap', color: C.text }}>{summary}</p>
                      </div>
                    )}
                  </>
                }
              </div>
            )}



            {/* PARTICIPANTS */}
            {panel === 'participants' && (
              <div style={rm.sidePad}>
                <p style={{ color: C.text2, fontSize: 12, marginBottom: 16 }}>
                  {peers.length + 1} مشارك
                </p>
                {/* المشارك الحالي */}
                <div style={rm.participantRow}>
                  <div style={rm.pAvatar}>{displayName[0]}</div>
                  <div>
                    <div style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>{displayName}</div>
                    <div style={{ color: C.text3, fontSize: 12 }}>أنت · {isAdminMode ? 'مضيف' : 'عميل'}</div>
                  </div>
                  <div style={{ marginRight: 'auto', display: 'flex', gap: 8 }}>
                    <Icon name={micOn ? 'mic' : 'mic_off'} size={18} style={{ color: micOn ? C.text2 : C.red }} />
                    <Icon name={camOn ? 'videocam' : 'videocam_off'} size={18} style={{ color: camOn ? C.text2 : C.red }} />
                  </div>
                </div>

                {/* المشاركون الآخرون */}
                {peers.map(p => (
                  <div key={p.id} style={rm.participantRow}>
                    <div style={{ ...rm.pAvatar, background: 'linear-gradient(135deg, #34a853, #1e7e34)' }}>
                      {(p.name || 'م')[0]}
                    </div>
                    <div>
                      <div style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                      <div style={{ color: C.text3, fontSize: 12 }}>{isAdminMode ? 'عميل' : 'مضيف'}</div>
                    </div>
                    <div style={{ marginRight: 'auto', display: 'flex', gap: 8 }}>
                      <Icon name={p.mic ? 'mic' : 'mic_off'} size={18} style={{ color: p.mic ? C.text2 : C.red }} />
                      <Icon name={p.cam ? 'videocam' : 'videocam_off'} size={18} style={{ color: p.cam ? C.text2 : C.red }} />
                    </div>
                  </div>
                ))}

                {/* ── INVITE BOX ── */}
                <div style={rm.inviteBox}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <Icon name="link" size={15} style={{ color: C.blue }} />
                    <span style={{ color: C.blue, fontSize: 12, fontWeight: 700 }}>رابط دعوة للعميل</span>
                  </div>
                  <code style={rm.inviteCode}>{meetingUrl}</code>
                  <button onClick={copyInvite} style={{ ...rm.inviteBtn, background: inviteCopied ? 'rgba(52,168,83,0.1)' : 'rgba(26,115,232,0.1)', borderColor: inviteCopied ? 'rgba(52,168,83,0.25)' : 'rgba(26,115,232,0.2)', color: inviteCopied ? C.green : C.blue }}>
                    <Icon name={inviteCopied ? 'check' : 'content_copy'} size={14} />
                    {inviteCopied ? 'تم النسخ ✓' : 'نسخ الرابط'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── BOTTOM CONTROLS ── */}
      <div style={rm.controls}>
        <div style={rm.ctrlGroup}>
          <GmBtn onClick={toggleMic} icon={micOn ? 'mic' : 'mic_off'} label={micOn ? 'كتم' : 'الصوت'} red={!micOn} />
          <GmBtn onClick={toggleCam} icon={camOn ? 'videocam' : 'videocam_off'} label={camOn ? 'إيقاف' : 'الكاميرا'} red={!camOn} />
          <GmBtn onClick={toggleShare} icon={sharing ? 'stop_screen_share' : 'screen_share'} label={sharing ? 'إيقاف المشاركة' : 'مشاركة الشاشة'} blue={sharing} />
          {isAdminMode && (
            <GmBtn icon="fiber_manual_record" label={`REC ${fmtDur(recDuration)}`} red style={{ opacity: 1 }} />
          )}
          <GmBtn onClick={toggleFullscreen} icon={fullscreen ? 'fullscreen_exit' : 'fullscreen'} label="شاشة كاملة" />
        </div>

        <div style={rm.ctrlGroup}>
          <PanelBtn icon="chat" label="Chat" active={panel==='chat'} onClick={() => setPanel(p => p==='chat'?null:'chat')} badge={messages.filter(m=>!m.system).length} />
          {isAdminMode && (
            <PanelBtn icon="record_voice_over" label="AI" active={panel==='transcript'} onClick={() => setPanel(p => p==='transcript'?null:'transcript')} />
          )}
          <PanelBtn icon="draw" label="سبورة" active={whiteboardActive} onClick={() => toggleWhiteboard()} />
          <PanelBtn icon="group" label="المشاركون" active={panel==='participants'} onClick={() => setPanel(p => p==='participants'?null:'participants')} />
        </div>
      </div>
    </div>
  )
}

/* ─── Control Buttons ─────────────────────────── */
function GmBtn({ onClick, icon, label, red, blue, style: s = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <button onClick={onClick} style={{
        width: 48, height: 48, borderRadius: '50%',
        background: red ? C.red : blue ? C.blue : 'rgba(255,255,255,0.07)',
        border: 'none', cursor: onClick ? 'pointer' : 'default',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .2s', ...s
      }}>
        <Icon name={icon} size={22} style={{ color: '#fff' }} />
      </button>
      <span style={{ color: C.text2, fontSize: 10, fontFamily: FONT }}>{label}</span>
    </div>
  )
}

function PanelBtn({ icon, label, active, onClick, badge }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative' }}>
      <button onClick={onClick} style={{
        width: 48, height: 48, borderRadius: '50%',
        background: active ? 'rgba(26,115,232,0.15)' : 'rgba(255,255,255,0.07)',
        border: `2px solid ${active ? C.blue : 'transparent'}`,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .2s',
      }}>
        <Icon name={icon} size={22} style={{ color: active ? C.blue : C.text2 }} />
      </button>
      {badge > 0 && (
        <span style={{
          position: 'absolute', top: -2, right: -2, background: C.red,
          color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 10,
          padding: '1px 5px', minWidth: 16, textAlign: 'center',
        }}>{badge}</span>
      )}
      <span style={{ color: active ? C.blue : C.text2, fontSize: 10, fontFamily: FONT }}>{label}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   WAITING ROOM — العميل بينتظر موافقة الأدمن
═══════════════════════════════════════════════ */
function WaitingRoom({ meetingId, displayName, logoUrl, onAdmitted, onBack }) {
  const [peerId]  = useState(() => 'wait_' + Math.random().toString(36).substring(2, 9))
  const [dots, setDots] = useState('')
  const channelRef = useRef(null)

  /* ── animated dots ── */
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 600)
    return () => clearInterval(t)
  }, [])

  /* ── Supabase channel: knock on lobby channel (منفصل عن meeting channel) ── */
  useEffect(() => {
    // نستخدم channel اسمه lobby- بدل meeting- عشان ما نتعارضش مع WebRTC channel
    const lobbyChannel = supabase.channel(`lobby-${meetingId}`, {
      config: { broadcast: { self: true } }
    })
    channelRef.current = lobbyChannel

    const knock = () => {
      lobbyChannel.send({
        type: 'broadcast',
        event: 'knock',
        payload: { senderId: peerId, name: displayName }
      })
    }

    let knockInterval = null

    lobbyChannel
      .on('broadcast', { event: 'admit' }, ({ payload }) => {
        // الأدمن وافق — ندخل الروم لو الـ ID مطابق
        if (payload && payload.targetId === peerId) {
          onAdmitted()
        }
      })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          knock()
          knockInterval = setInterval(knock, 4000)
        }
      })

    return () => {
      if (knockInterval) clearInterval(knockInterval)
      lobbyChannel.unsubscribe()
      channelRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId])

  return (
    <div style={wait.root}>
      <div style={lob.orb1} />
      <div style={lob.orb2} />

      <div style={wait.card}>
        <img src={logoUrl || '/logo.png'} alt="Vixcell" style={{ height: 28, marginBottom: 24 }} />

        {/* Pulse animation */}
        <div style={wait.pulseWrap}>
          <div style={wait.pulse3} />
          <div style={wait.pulse2} />
          <div style={wait.pulse1} />
          <div style={wait.icon}>
            <Icon name="person" size={32} style={{ color: '#fff' }} />
          </div>
        </div>

        <h2 style={wait.title}>في انتظار الموافقة{dots}</h2>
        <p style={wait.sub}>
          مرحباً <span style={{ color: C.blue, fontWeight: 700 }}>{displayName}</span>،
          تم إرسال طلبك للمضيف. سيتم قبولك خلال لحظات.
        </p>

        <div style={wait.infoRow}>
          <Icon name="meeting_room" size={15} style={{ color: C.text3 }} />
          <span style={{ color: C.text3, fontSize: 12, fontFamily: 'monospace' }}>
            {meetingId.slice(0, 16)}...
          </span>
        </div>

        <button onClick={onBack} style={wait.backBtn}>
          <Icon name="arrow_back" size={16} /> إلغاء والرجوع
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   CLIENT LOBBY
═══════════════════════════════════════════════ */
function ClientLobby({ logoUrl, localStream, camOn, micOn, toggleCam, toggleMic, onJoin, onBack, activeMeetings }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState(() => {
    const queryParams = new URLSearchParams(window.location.search)
    return (queryParams.get('code') || queryParams.get('id') || '').trim()
  })
  const videoRef = useRef(null)

  const hasCode = !!code

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream
    }
  }, [localStream])

  return (
    <div style={pre.root}>
      <div style={lob.orb1} />
      <div style={lob.orb2} />
      <div style={pre.inner}>
        <button onClick={onBack} style={pre.backBtn}>
          <Icon name="arrow_back" size={20} />
          الرجوع للرئيسية
        </button>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <img src={logoUrl} alt="Vixcell" style={{ height: 30 }} />
        </div>

        <h2 style={{ ...pre.title, textAlign: 'center', marginBottom: 8 }}>الانضمام للاجتماع</h2>
        {hasCode && (
          <p style={{ textAlign: 'center', color: C.green, fontSize: 13, marginBottom: 24, fontFamily: FONT }}>
            <Icon name="check_circle" size={14} style={{ color: C.green }} /> تم تحديد الاجتماع تلقائياً
          </p>
        )}

        <div style={pre.grid}>
          {/* Camera Preview */}
          <div style={pre.previewWrap}>
            <div style={pre.preview}>
              {camOn && localStream
                ? <video ref={videoRef} autoPlay muted playsInline style={pre.video} />
                : <div style={pre.noVideo}><Icon name="videocam_off" size={48} style={{ color: C.text3 }} /></div>
              }
              <div style={pre.previewName}>{name || 'الاسم'}</div>
              <div style={pre.previewCtrls}>
                <button onClick={() => toggleMic()} style={{ ...pre.ctrl, background: micOn ? 'rgba(255,255,255,0.12)' : C.red }}>
                  <Icon name={micOn ? 'mic' : 'mic_off'} size={22} style={{ color: '#fff' }} />
                </button>
                <button onClick={() => toggleCam()} style={{ ...pre.ctrl, background: camOn ? 'rgba(255,255,255,0.12)' : C.red }}>
                  <Icon name={camOn ? 'videocam' : 'videocam_off'} size={22} style={{ color: '#fff' }} />
                </button>
              </div>
            </div>
          </div>

          {/* Inputs */}
          <div style={pre.infoWrap}>
            <div style={pre.infoCard}>
              <label style={lob.label}>اسمك بالكامل *</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="أدخل اسمك" style={lob.input} />
            </div>

            {!hasCode && (
              <div style={pre.infoCard}>
                <label style={lob.label}>كود الاجتماع *</label>
                <input value={code} onChange={e => setCode(e.target.value)}
                  placeholder="أدخل الكود الموجه لك" style={lob.input} dir="ltr" />
              </div>
            )}

            {activeMeetings && activeMeetings.length > 0 && !hasCode && (
              <div style={{ marginBottom: 10, padding: 12, background: 'rgba(52,168,83,0.05)', borderRadius: 12, border: '1px solid rgba(52,168,83,0.15)' }}>
                <div style={{ color: C.green, fontSize: 12, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, animation: 'recPulse 1.2s infinite' }} />
                  اجتماعات نشطة حالياً (انقر للاختيار):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {activeMeetings.map(m => (
                    <button key={m.name} onClick={() => setCode(m.name)} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', background: C.bg3, border: `1px solid ${C.border}`,
                      borderRadius: 8, cursor: 'pointer', textAlign: 'right', width: '100%',
                      fontFamily: FONT
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
                        <span style={{ color: C.text, fontSize: 12, fontWeight: 600, fontFamily: FONT }}>اجتماع {m.metadata?.adminName || 'مضيف'}</span>
                        <span style={{ color: C.text3, fontSize: 10, fontFamily: 'monospace' }}>كود: {m.name}</span>
                      </div>
                      <Icon name="chevron_left" size={16} style={{ color: C.green }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasCode && (
              <div style={{ ...pre.infoCard, background: 'rgba(52,168,83,0.06)', borderColor: 'rgba(52,168,83,0.2)' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Icon name="video_call" size={16} style={{ color: C.green }} />
                  <div>
                    <div style={{ color: C.green, fontSize: 12, fontWeight: 700 }}>اجتماع محدد</div>
                    <div style={{ color: C.text3, fontSize: 11, fontFamily: 'monospace', marginTop: 2 }}>{code}</div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => onJoin(name, code, camOn, micOn)}
              style={{ ...pre.joinBtn, opacity: (!name.trim() || !code.trim()) ? 0.5 : 1 }}
              disabled={!name.trim() || !code.trim()}
            >
              <Icon name="video_call" size={20} />
              انضم الآن للاجتماع
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   MEETING ARCHIVE
═══════════════════════════════════════════════ */
function MeetingArchive({ onBack }) {
  const [meetings, setMeetings] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => { getMeetings().then(m => setMeetings(m.sort((a,b) => b.id.localeCompare(a.id)))) }, [])

  function downloadVideo(meeting) {
    if (!meeting.videoBlob) { alert('لا يوجد تسجيل محفوظ'); return }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(meeting.videoBlob)
    a.download = `meeting-${meeting.id.slice(0,8)}.webm`; a.click()
  }

  function downloadTranscript(meeting) {
    const txt = (meeting.transcript || []).map(t => `[${t.time}] ${t.speaker}: ${t.text}`).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain;charset=utf-8' }))
    a.download = `transcript-${meeting.id.slice(0,8)}.txt`; a.click()
  }

  return (
    <div style={arc.root}>
      <div style={arc.header}>
        <button onClick={onBack} style={arc.backBtn}>
          <Icon name="arrow_back" size={20} /> رجوع
        </button>
        <h2 style={arc.title}><Icon name="history" size={22} /> سجل الاجتماعات</h2>
        <span style={{ color: C.text3, fontSize: 13 }}>{meetings.length} اجتماع</span>
      </div>

      {meetings.length === 0
        ? <div style={arc.empty}>
            <Icon name="event_busy" size={56} style={{ color: C.text3 }} />
            <p style={{ color: C.text3, marginTop: 12, fontFamily: FONT }}>لا توجد اجتماعات مسجلة بعد</p>
          </div>
        : <div style={arc.body}>
            <div style={arc.list}>
              {meetings.map(m => (
                <div key={m.id} onClick={() => setSelected(m)}
                  style={{ ...arc.meetCard, ...(selected?.id === m.id ? arc.meetCardActive : {}) }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={arc.mIcon}><Icon name="video_camera_back" size={20} style={{ color: C.blue }} /></div>
                    <div>
                      <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{m.host || 'اجتماع'}</div>
                      <div style={{ color: C.text3, fontSize: 12 }}>{m.date}</div>
                    </div>
                    <div style={{ marginRight: 'auto', color: C.text2, fontSize: 12 }}>{fmtDur(m.duration || 0)}</div>
                  </div>
                </div>
              ))}
            </div>

            {selected && (
              <div style={arc.detail}>
                <div style={arc.detailHead}>
                  <div>
                    <div style={{ color: C.text, fontWeight: 800, fontSize: 18 }}>{selected.host}</div>
                    <div style={{ color: C.text3, fontSize: 12, marginTop: 4 }}>{selected.date} · {fmtDur(selected.duration || 0)}</div>
                  </div>
                  <button onClick={() => setSelected(null)} style={arc.closeBtn}>
                    <Icon name="close" size={20} />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                  <button onClick={() => downloadVideo(selected)} style={arc.actionBtn}>
                    <Icon name="video_file" size={16} /> تحميل الفيديو
                  </button>
                  <button onClick={() => downloadTranscript(selected)} style={arc.actionBtn}>
                    <Icon name="description" size={16} /> تحميل النص
                  </button>
                </div>

                {selected.summary && (
                  <div style={arc.section}>
                    <div style={arc.sectionTitle}><Icon name="auto_awesome" size={16} style={{ color: C.yellow }} /> ملخص AI</div>
                    <p style={arc.sectionBody}>{selected.summary}</p>
                  </div>
                )}

                {selected.tasks?.length > 0 && (
                  <div style={arc.section}>
                    <div style={arc.sectionTitle}><Icon name="task_alt" size={16} style={{ color: C.green }} /> المهام</div>
                    <ul style={{ margin: 0, padding: '0 20px' }}>
                      {selected.tasks.map((t, i) => (
                        <li key={i} style={{ color: C.text, fontSize: 13, lineHeight: 2 }}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selected.transcript?.length > 0 && (
                  <div style={arc.section}>
                    <div style={arc.sectionTitle}><Icon name="record_voice_over" size={16} style={{ color: C.blue }} /> النص الكامل</div>
                    <div style={arc.transcriptBox}>
                      {selected.transcript.map(t => (
                        <div key={t.id} style={{ marginBottom: 10 }}>
                          <span style={{ color: C.blue, fontSize: 11, fontWeight: 700 }}>{t.speaker}</span>
                          <span style={{ color: C.text3, fontSize: 10, marginRight: 8 }}>{t.time}</span>
                          <p style={{ margin: '2px 0 0', color: C.text, fontSize: 13 }}>{t.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
      }
    </div>
  )
}

/* ═══════════════════════════════════════════════
   TABLET WHITEBOARD
═══════════════════════════════════════════════ */
function TabletWhiteboard({
  meetingId,
  onLeave,
  channelRef,
  wbRef,
  ctxRef,
  wbColor,
  setWbColor,
  wbSize,
  setWbSize,
  wbTool,
  setWbTool,
  wbPos,
  wbDown,
  wbMove,
  wbUp,
  clearCanvas,
  handleImageUpload,
  isOCRProcessing,
  boardElements,
  setBoardElements
}) {
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  const tools = [
    { id: 'select', icon: 'near_me', label: 'تحديد وتحريك' },
    { id: 'pen', icon: 'edit', label: 'قلم' },
    { id: 'eraser', icon: 'ink_eraser', label: 'ممحاة' },
    { id: 'rect', icon: 'rectangle', label: 'مستطيل' },
    { id: 'circle', icon: 'circle', label: 'دائرة' },
    { id: 'line', icon: 'horizontal_rule', label: 'مستقيم' },
    { id: 'triangle', icon: 'change_history', label: 'مثلث' },
    { id: 'correction', icon: 'gesture', label: 'تصحيح الأشكال' },
    { id: 'text_ai', icon: 'spellcheck', label: 'تصحيح النصوص' }
  ]

  return (
    <div style={tabWb.root}>
      <div style={tabWb.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="Vixcell" style={{ height: 20 }} />
          <div style={tabWb.badge}>
            <span style={tabWb.badgeDot} />
            <span>Tablet Mode — الرسم المشترك</span>
          </div>
          <span style={{ color: C.text2, fontSize: 12 }}>كود: {meetingId}</span>
          
          <button onClick={handleToggleFullscreen} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`,
            color: C.text, padding: '6px 12px', borderRadius: 8,
            cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: FONT,
            transition: 'all 0.2s'
          }}>
            <Icon name={isFullscreen ? "fullscreen_exit" : "fullscreen"} size={16} />
            <span>{isFullscreen ? "الخروج من ملء الشاشة" : "ملء الشاشة"}</span>
          </button>
        </div>
        
        <button onClick={onLeave} style={tabWb.leaveBtn}>
          <Icon name="call_end" size={20} />
          إنهاء الرسم والخروج
        </button>
      </div>

      <div style={tabWb.canvasContainer}>
        {isOCRProcessing && (
          <div style={{
            position: 'absolute', inset: 0, margin: 'auto',
            width: 220, height: 60, borderRadius: 12,
            background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)',
            border: `1px solid rgba(26,115,232,0.2)`,
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 12, zIndex: 100, fontSize: 13, fontFamily: FONT, fontWeight: 600,
            boxShadow: '0 12px 36px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.1)',
              borderTop: `2px solid ${C.blue}`,
              animation: 'spin 1s linear infinite'
            }} />
            <span>جاري تصحيح النص بالـ AI...</span>
          </div>
        )}
        <canvas ref={wbRef} style={{ ...tabWb.canvas, touchAction: 'none' }}
          onMouseDown={wbDown} onMouseMove={wbMove} onMouseUp={wbUp} onMouseLeave={wbUp}
          onTouchStart={wbDown} onTouchMove={wbMove} onTouchEnd={wbUp} />

        {boardElements && boardElements.map(img => (
          <BoardElement
            key={img.id}
            img={img}
            containerRef={wbRef}
            disabled={wbTool !== 'select'}
            onUpdate={(updated) => {
              setBoardElements(prev => prev.map(i => i.id === img.id ? { ...i, ...updated } : i))
              if (channelRef.current) {
                channelRef.current.send({
                  type: 'broadcast',
                  event: 'element_update',
                  payload: { id: img.id, ...updated }
                })
              }
            }}
            onDelete={() => {
              setBoardElements(prev => prev.filter(i => i.id !== img.id))
              if (channelRef.current) {
                channelRef.current.send({
                  type: 'broadcast',
                  event: 'element_delete',
                  payload: { id: img.id }
                })
              }
            }}
          />
        ))}
      </div>

      <div style={{ ...tabWb.toolbar, flexWrap: 'wrap', gap: 6, padding: '12px 20px', height: 'auto', minHeight: 60 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {tools.map(t => (
            <button key={t.id} onClick={() => setWbTool(t.id)}
              title={t.label}
              style={{
                ...tabWb.toolBtn,
                background: wbTool === t.id ? 'rgba(26,115,232,0.15)' : 'transparent',
                border: wbTool === t.id ? `1px solid rgba(26,115,232,0.25)` : '1px solid transparent',
                borderRadius: 8, padding: '6px 10px', height: 38, width: 'auto',
                display: 'flex', alignItems: 'center', gap: 4
              }}>
              <Icon name={t.icon} size={20} style={{ color: wbTool === t.id ? C.blue : C.text2 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: wbTool === t.id ? C.blue : C.text2, fontFamily: FONT }}>{t.label}</span>
            </button>
          ))}
        </div>
        
        <div style={tabWb.divider} />
        
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
        <button onClick={() => fileInputRef.current?.click()} style={{
          ...tabWb.toolBtn,
          border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 12px',
          display: 'flex', alignItems: 'center', gap: 6, height: 38, cursor: 'pointer'
        }}>
          <Icon name="image" size={20} style={{ color: C.text2 }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: C.text2, fontFamily: FONT }}>صورة</span>
        </button>

        <div style={tabWb.divider} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {['#1a73e8','#34a853','#ea4335','#fbbc04','#a142f4','#ffffff'].map(col => (
            <button key={col} onClick={() => { setWbColor(col); if (wbTool === 'eraser') setWbTool('pen') }}
              style={{ ...tabWb.colorBtn, background: col, outline: wbColor===col ? '2px solid #fff' : 'none', width: 24, height: 24 }} />
          ))}
        </div>

        <div style={tabWb.divider} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="line_weight" size={18} style={{ color: C.text2 }} />
          <input type="range" min="1" max="16" value={wbSize} onChange={e => setWbSize(+e.target.value)}
            style={{ width: 80, accentColor: C.blue }} />
        </div>

        <div style={tabWb.divider} />

        <button onClick={clearCanvas} style={{ ...tabWb.actionBtn, height: 38 }} title="مسح الكل">
          <Icon name="delete_sweep" size={22} style={{ color: C.text2 }} />
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════ */

const lob = {
  root: {
    minHeight: '100vh', background: C.bg, display: 'flex',
    alignItems: 'center', justifyContent: 'center', padding: 20,
    fontFamily: FONT, position: 'relative', overflow: 'hidden',
  },
  orb1: {
    position: 'fixed', top: '-10%', left: '-10%',
    width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(26,115,232,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  orb2: {
    position: 'fixed', bottom: '-15%', right: '-10%',
    width: 600, height: 600, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(161,66,244,0.06) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  orb3: {
    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
    width: 800, height: 800, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(52,168,83,0.03) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    background: 'rgba(26,26,30,0.9)',
    backdropFilter: 'blur(20px)',
    border: `1px solid ${C.border}`,
    borderRadius: 28,
    padding: '40px',
    width: '100%', maxWidth: 490,
    boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
    position: 'relative', zIndex: 1,
  },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 },
  logoRow: { display: 'flex', alignItems: 'center', gap: 12 },
  logoTitle: { color: C.text, fontWeight: 800, fontSize: 18 },
  logoSub:   { color: C.text3, fontSize: 12 },
  ghostBtn: {
    background: 'transparent', border: `1px solid ${C.border}`,
    color: C.text2, borderRadius: 10, padding: '7px 12px',
    fontSize: 12, cursor: 'pointer', fontFamily: FONT,
    display: 'flex', alignItems: 'center', gap: 5,
    transition: 'all .2s',
  },
  modeRow: {
    display: 'flex', gap: 6, background: C.bg,
    borderRadius: 14, padding: 4, marginBottom: 22,
    border: `1px solid ${C.border}`,
  },
  modeBtn: {
    flex: 1, padding: '10px 12px', borderRadius: 10, border: 'none',
    background: 'transparent', color: C.text2, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 6, transition: 'all .2s',
  },
  modeBtnActive: { background: C.bg3, color: C.text, boxShadow: '0 2px 10px rgba(0,0,0,0.5)' },
  adminNameRow: {
    marginBottom: 20, padding: '14px',
    background: 'rgba(26,115,232,0.05)',
    borderRadius: 14, border: `1px solid rgba(26,115,232,0.12)`,
  },
  nameBtn: {
    flex: 1, padding: '10px 16px', borderRadius: 10,
    background: C.bg3, border: `1px solid ${C.border}`,
    color: C.text, fontSize: 14, fontWeight: 700, cursor: 'pointer',
    fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all .2s',
  },
  nameBtnActive: { background: C.blue, borderColor: C.blue, color: '#fff', boxShadow: '0 0 20px rgba(26,115,232,0.3)' },
  label: { display: 'block', color: C.text2, fontSize: 12, fontWeight: 600, marginBottom: 6 },
  input: {
    width: '100%', boxSizing: 'border-box', padding: '12px 14px',
    background: C.bg3, color: C.text, border: `1px solid ${C.border}`,
    borderRadius: 12, fontSize: 14, fontFamily: FONT, outline: 'none',
    transition: 'border-color .2s',
  },
  tabs: {
    display: 'flex', gap: 4, marginBottom: 20,
    borderBottom: `1px solid ${C.border}`,
  },
  tabBtn: {
    padding: '10px 14px', border: 'none', borderBottom: '2px solid transparent',
    background: 'transparent', color: C.text2, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: FONT, transition: 'all .2s',
    display: 'flex', alignItems: 'center', gap: 5,
  },
  tabActive: { color: C.blue, borderBottomColor: C.blue },
  primaryBtn: {
    width: '100%', padding: '14px', marginTop: 4,
    background: 'linear-gradient(135deg, #1a73e8, #4a90e2)',
    color: '#fff', border: 'none', borderRadius: 14,
    fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'all .2s', boxShadow: '0 4px 20px rgba(26,115,232,0.3)',
  },
  features: { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22 },
  feature: {
    display: 'flex', alignItems: 'center', gap: 5,
    color: C.text3, fontSize: 11, fontFamily: FONT,
    background: C.bg3, borderRadius: 20, padding: '4px 10px',
  },
}

const pre = {
  root: {
    minHeight: '100vh', background: C.bg, display: 'flex',
    alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: FONT,
    position: 'relative', overflow: 'hidden',
  },
  inner: { width: '100%', maxWidth: 820, position: 'relative', zIndex: 1 },
  backBtn: {
    background: 'transparent', border: 'none', color: C.text2, cursor: 'pointer',
    fontFamily: FONT, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24,
  },
  title: { color: C.text, fontSize: 28, fontWeight: 800, marginBottom: 28, textAlign: 'center' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 },
  previewWrap: {},
  preview: {
    background: '#000', borderRadius: 20, overflow: 'hidden',
    aspectRatio: '16/9', position: 'relative',
    boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
  },
  video: { width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: 'scaleX(-1)' },
  noVideo: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100%', background: C.bg3,
  },
  previewName: {
    position: 'absolute', bottom: 52, left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.7)', color: '#fff', borderRadius: 20,
    padding: '4px 14px', fontSize: 13, fontFamily: FONT, backdropFilter: 'blur(8px)',
  },
  previewCtrls: {
    position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
    display: 'flex', gap: 10,
  },
  ctrl: {
    width: 42, height: 42, borderRadius: '50%', border: 'none',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(8px)',
  },
  infoWrap: { display: 'flex', flexDirection: 'column', gap: 14 },
  infoCard: {
    background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16,
  },
  infoLabel: { color: C.text3, fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  // ── Invite card ──
  inviteCard: {
    background: 'rgba(26,115,232,0.05)',
    border: `1px solid rgba(26,115,232,0.18)`,
    borderRadius: 16, padding: 16,
  },
  inviteCardHeader: {
    display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10,
  },
  inviteUrl: {
    fontFamily: 'monospace', fontSize: 11, color: C.text2,
    background: C.bg, borderRadius: 8, padding: '8px 12px',
    marginBottom: 10, wordBreak: 'break-all', lineHeight: 1.6,
    border: `1px solid ${C.border}`,
  },
  copyBtn: {
    border: '1px solid', borderRadius: 10, padding: '8px 16px', fontSize: 13,
    cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 6,
    fontWeight: 600, transition: 'all .25s', width: '100%', justifyContent: 'center',
  },
  avatar: {
    width: 40, height: 40, borderRadius: '50%',
    background: 'linear-gradient(135deg, #1a73e8, #4a90e2)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 16, flexShrink: 0,
    boxShadow: '0 4px 12px rgba(26,115,232,0.3)',
  },
  joinBtn: {
    width: '100%', padding: '14px',
    background: 'linear-gradient(135deg, #1a73e8, #4a90e2)',
    color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700,
    cursor: 'pointer', fontFamily: FONT,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    boxShadow: '0 4px 20px rgba(26,115,232,0.3)', transition: 'all .2s',
  },
}

const rm = {
  root: {
    display: 'flex', flexDirection: 'column', height: '100vh',
    background: '#050507', fontFamily: FONT, overflow: 'hidden', position: 'relative',
  },
  rootFull: { position: 'fixed', inset: 0, zIndex: 9999 },
  topBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 20px', background: C.bg,
    borderBottom: `1px solid ${C.border}`,
    zIndex: 10, flexShrink: 0,
  },
  timer: { color: C.text, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' },
  recBadge: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(234,67,53,0.12)', border: '1px solid rgba(234,67,53,0.25)',
    borderRadius: 20, padding: '3px 10px', color: C.red, fontSize: 11, fontWeight: 700,
  },
  recDot: {
    display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
    background: C.red, animation: 'recPulse 1.2s ease-in-out infinite',
  },
  aiBadge: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(26,115,232,0.12)', border: '1px solid rgba(26,115,232,0.25)',
    borderRadius: 20, padding: '3px 10px', color: C.blue, fontSize: 11, fontWeight: 700,
  },
  hostName: { color: C.text2, fontSize: 13 },
  adminTag: {
    background: 'rgba(26,115,232,0.12)', color: C.blue,
    borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700,
  },
  inviteQuickBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    border: '1px solid', borderRadius: 20, padding: '5px 14px',
    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
    transition: 'all .25s',
  },
  endBtn: {
    width: 44, height: 44, borderRadius: '50%',
    background: 'linear-gradient(135deg, #ea4335, #c62828)',
    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(234,67,53,0.35)',
  },
  knockBanner: {
    position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)',
    zIndex: 9999,
    background: 'rgba(20,20,24,0.96)', backdropFilter: 'blur(16px)',
    border: '1px solid rgba(251,188,4,0.3)', borderRadius: 16,
    padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)', minWidth: 360, fontFamily: FONT,
    animation: 'fadeIn .3s ease',
  },
  admitBtn: {
    background: 'rgba(52,168,83,0.15)', border: '1px solid rgba(52,168,83,0.3)',
    color: C.green, borderRadius: 10, padding: '7px 16px',
    fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
    display: 'flex', alignItems: 'center', gap: 5, transition: 'all .2s',
  },
  rejectBtn: {
    background: 'rgba(234,67,53,0.12)', border: '1px solid rgba(234,67,53,0.25)',
    color: C.red, borderRadius: 10, padding: '7px 12px',
    fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
    display: 'flex', alignItems: 'center', gap: 5, transition: 'all .2s',
  },
  mainVideo: { width: '100%', height: '100%', objectFit: 'contain' },
  mainPlaceholder: {
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 8,
  },
  waitingPulse: {
    width: 120, height: 120, borderRadius: '50%',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  waitingCopyBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(26,115,232,0.12)', border: '1px solid rgba(26,115,232,0.25)',
    color: C.blue, borderRadius: 24, padding: '10px 22px',
    fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
    marginTop: 8, transition: 'all .25s',
  },
  pip: {
    position: 'absolute', bottom: 16, right: 16, width: 180,
    borderRadius: 16, overflow: 'hidden',
    border: '2px solid rgba(26,115,232,0.35)',
    background: C.bg3, boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
  },
  pipVideo: { width: '100%', display: 'block', objectFit: 'cover', aspectRatio: '16/9', transform: 'scaleX(-1)' },
  pipOff: {
    aspectRatio: '16/9', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: C.bg3,
  },
  pipLabel: {
    background: 'rgba(0,0,0,0.7)', color: '#fff',
    fontSize: 10, padding: '3px 10px', textAlign: 'center', fontFamily: FONT,
  },
  side: {
    width: 340, background: C.bg, borderLeft: `1px solid ${C.border}`,
    display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden',
  },
  sideHead: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px', borderBottom: `1px solid ${C.border}`, flexShrink: 0,
  },
  sideClose: { background: 'transparent', border: 'none', color: C.text3, cursor: 'pointer' },
  sideFlex: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  sidePad: { flex: 1, overflow: 'auto', padding: 16 },
  noAccess: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, color: C.text3, gap: 12, fontFamily: FONT },
  chatList: { flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 },
  sysMsg: { textAlign: 'center' },
  sysTxt: { color: C.text3, fontSize: 11 },
  myBubble: { alignSelf: 'flex-end', maxWidth: '80%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 },
  otherBubble: { alignSelf: 'flex-start', maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: 2 },
  bubbleName: { color: C.text3, fontSize: 10, fontWeight: 700 },
  bubbleTxt: { background: C.bg3, color: C.text, borderRadius: 12, padding: '8px 12px', fontSize: 13, lineHeight: 1.5 },
  bubbleTime: { color: C.text3, fontSize: 9 },
  chatBar: { display: 'flex', gap: 8, padding: '10px 12px', borderTop: `1px solid ${C.border}`, flexShrink: 0 },
  chatInput: {
    flex: 1, background: C.bg2, color: C.text, border: `1px solid ${C.border}`,
    borderRadius: 24, padding: '10px 14px', fontSize: 13, fontFamily: FONT, outline: 'none',
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: '50%',
    background: 'linear-gradient(135deg, #1a73e8, #4a90e2)',
    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  aiStatus: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  aiDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  dlBtn: {
    marginRight: 'auto', background: 'transparent', border: `1px solid ${C.border}`,
    color: C.text2, borderRadius: 8, padding: '3px 10px', fontSize: 11,
    cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 4,
  },
  transcriptList: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 },
  transcriptItem: { background: C.bg2, borderRadius: 10, padding: '10px 12px', border: `1px solid ${C.border}` },
  emptyTxt: { color: C.text3, fontSize: 13, textAlign: 'center', marginTop: 40, fontFamily: FONT },
  summaryCard: {
    background: 'rgba(251,188,4,0.05)', border: '1px solid rgba(251,188,4,0.15)',
    borderRadius: 12, padding: 14, marginTop: 12,
  },
  wbBar: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
    borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap', flexShrink: 0, background: C.bg,
  },
  wbTool: {
    background: 'transparent', border: 'none', cursor: 'pointer',
    width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  wbDiv: { width: 1, height: 20, background: C.border, margin: '0 2px' },
  colorBtn: { width: 18, height: 18, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0 },
  wbCanvas: { flex: 1, cursor: 'crosshair', display: 'block', touchAction: 'none', width: '100%', height: '100%' },
  participantRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: C.bg2, borderRadius: 12, padding: '12px 14px',
    border: `1px solid ${C.border}`, marginBottom: 16,
  },
  pAvatar: {
    width: 36, height: 36, borderRadius: '50%',
    background: 'linear-gradient(135deg, #1a73e8, #4a90e2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0,
  },
  inviteBox: {
    background: 'rgba(26,115,232,0.05)',
    border: '1px solid rgba(26,115,232,0.15)',
    borderRadius: 14, padding: 14,
  },
  inviteCode: {
    display: 'block', color: C.text2, fontFamily: 'monospace', fontSize: 10,
    fontWeight: 600, marginBottom: 10, wordBreak: 'break-all',
    background: C.bg, borderRadius: 8, padding: '8px 10px',
    border: `1px solid ${C.border}`, lineHeight: 1.6,
  },
  inviteBtn: {
    border: '1px solid', borderRadius: 8, padding: '7px 14px', fontSize: 12,
    cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 5,
    fontWeight: 600, transition: 'all .25s',
  },
  controls: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 32px', background: C.bg, borderTop: `1px solid ${C.border}`,
    flexShrink: 0,
  },
  ctrlGroup: { display: 'flex', alignItems: 'flex-start', gap: 16 },
}

const arc = {
  root: { minHeight: '100vh', background: C.bg, fontFamily: FONT, padding: 24 },
  header: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 },
  backBtn: {
    background: 'transparent', border: 'none', color: C.text2, cursor: 'pointer',
    fontFamily: FONT, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6,
  },
  title: { color: C.text, fontSize: 22, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' },
  body: { display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, height: 'calc(100vh - 120px)' },
  list: { display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' },
  meetCard: {
    background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 14,
    padding: 14, cursor: 'pointer', transition: 'all .2s',
  },
  meetCardActive: { border: `1px solid ${C.blue}`, background: 'rgba(26,115,232,0.06)' },
  mIcon: {
    width: 40, height: 40, borderRadius: 10, background: 'rgba(26,115,232,0.1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  detail: { background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, overflowY: 'auto' },
  detailHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  closeBtn: { background: 'transparent', border: 'none', color: C.text3, cursor: 'pointer' },
  actionBtn: {
    background: C.bg3, border: `1px solid ${C.border}`, color: C.text,
    borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 6,
  },
  section: { background: C.bg, borderRadius: 12, padding: 16, marginBottom: 14, border: `1px solid ${C.border}` },
  sectionTitle: { color: C.text2, fontWeight: 700, fontSize: 13, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 },
  sectionBody: { color: C.text, fontSize: 13, lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' },
  transcriptBox: { maxHeight: 300, overflowY: 'auto' },
}

const tabWb = {
  root: {
    display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw',
    background: C.bg, overflow: 'hidden', position: 'fixed', inset: 0, zIndex: 9999,
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0 20px', height: '60px',
    borderBottom: `1px solid ${C.border}`, background: C.bg2,
  },
  badge: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(26,115,232,0.12)', color: C.blue,
    padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold',
  },
  badgeDot: { width: '6px', height: '6px', borderRadius: '50%', background: C.blue },
  leaveBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'linear-gradient(135deg, #ea4335, #c62828)',
    color: '#fff', border: 'none', padding: '8px 16px',
    borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
  },
  canvasContainer: { flex: 1, position: 'relative', background: C.bg },
  canvas: { width: '100%', height: '100%', display: 'block', cursor: 'crosshair' },
  toolbar: {
    position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
    display: 'flex', alignItems: 'center', gap: '14px',
    background: 'rgba(26,26,30,0.92)',
    border: `1px solid ${C.border}`, borderRadius: '100px',
    padding: '10px 24px', backdropFilter: 'blur(20px)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
  },
  toolBtn: {
    background: 'transparent', border: 'none', padding: '8px',
    borderRadius: '50%', cursor: 'pointer', display: 'flex',
  },
  colorBtn: { width: '24px', height: '24px', borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0 },
  divider: { width: '1px', height: '24px', background: C.border },
  actionBtn: { background: 'transparent', border: 'none', padding: '8px', cursor: 'pointer', display: 'flex' },
}

/* ─── Waiting Room Styles ───────────────────── */
const wait = {
  root: {
    minHeight: '100vh', background: C.bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: FONT, position: 'relative', overflow: 'hidden',
  },
  card: {
    background: 'rgba(26,26,30,0.92)', backdropFilter: 'blur(20px)',
    border: `1px solid ${C.border}`, borderRadius: 28,
    padding: '48px 40px', maxWidth: 420, width: '100%',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
    position: 'relative', zIndex: 1, textAlign: 'center',
  },
  pulseWrap: {
    position: 'relative', width: 100, height: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 28,
  },
  pulse1: {
    position: 'absolute', inset: 0, borderRadius: '50%',
    background: 'rgba(26,115,232,0.2)',
    animation: 'waitPulse 2s ease-out infinite',
  },
  pulse2: {
    position: 'absolute', inset: 8, borderRadius: '50%',
    background: 'rgba(26,115,232,0.25)',
    animation: 'waitPulse 2s ease-out infinite 0.4s',
  },
  pulse3: {
    position: 'absolute', inset: 16, borderRadius: '50%',
    background: 'rgba(26,115,232,0.3)',
    animation: 'waitPulse 2s ease-out infinite 0.8s',
  },
  icon: {
    width: 64, height: 64, borderRadius: '50%',
    background: 'linear-gradient(135deg, #1a73e8, #4a90e2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 32px rgba(26,115,232,0.4)',
    position: 'relative', zIndex: 1,
  },
  title: {
    color: C.text, fontSize: 22, fontWeight: 800,
    margin: '0 0 12px', fontFamily: FONT,
  },
  sub: {
    color: C.text2, fontSize: 14, lineHeight: 1.7,
    margin: '0 0 20px', fontFamily: FONT,
  },
  infoRow: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: C.bg3, borderRadius: 20, padding: '6px 14px',
    marginBottom: 28,
  },
  backBtn: {
    background: 'transparent', border: `1px solid ${C.border}`,
    color: C.text2, borderRadius: 12, padding: '10px 20px',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
    display: 'flex', alignItems: 'center', gap: 6, transition: 'all .2s',
  },
}

// ─── Global keyframes ───────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('vx-meet-kf')) {
  const s = document.createElement('style')
  s.id = 'vx-meet-kf'
  s.textContent = `
    @keyframes recPulse { 0%,100%{opacity:1} 50%{opacity:0.15} }
    @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    @keyframes waitPulse { 0%{transform:scale(1);opacity:0.8} 100%{transform:scale(1.8);opacity:0} }
    * { font-family: 'Cairo', 'Outfit', sans-serif !important; }
    .material-symbols-rounded { font-family: 'Material Symbols Rounded' !important; }
    button:hover { filter: brightness(1.1); }
    input:focus { border-color: rgba(26,115,232,0.5) !important; box-shadow: 0 0 0 3px rgba(26,115,232,0.1) !important; }
  `
  document.head.appendChild(s)
}

function BoardElement({ img, onUpdate, onDelete, disabled, containerRef }) {
  const [isHovered, setIsHovered] = React.useState(false)
  const dragStart = React.useRef(null)
  const resizeStart = React.useRef(null)

  const handlePointerDown = (e) => {
    if (disabled) return
    e.stopPropagation()
    if (e.target.closest('.delete-btn')) return
    if (e.target.closest('.resize-handle')) return

    e.target.setPointerCapture(e.pointerId)
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    dragStart.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      origX: img.x,
      origY: img.y,
      rect
    }
  }

  const handlePointerMove = (e) => {
    if (!dragStart.current) return
    e.stopPropagation()
    const { pointerX, pointerY, origX, origY, rect } = dragStart.current
    const dx = e.clientX - pointerX
    const dy = e.clientY - pointerY

    const dxPercent = (dx / rect.width) * 100
    const dyPercent = (dy / rect.height) * 100

    let newX = origX + dxPercent
    let newY = origY + dyPercent

    newX = Math.max(-img.w + 2, Math.min(100 - 2, newX))
    newY = Math.max(-img.h + 2, Math.min(100 - 2, newY))

    onUpdate({ x: newX, y: newY })
  }

  const handlePointerUp = (e) => {
    if (!dragStart.current) return
    e.stopPropagation()
    e.target.releasePointerCapture(e.pointerId)
    dragStart.current = null
  }

  const handleResizeDown = (e) => {
    if (disabled) return
    e.stopPropagation()
    e.target.setPointerCapture(e.pointerId)
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    resizeStart.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      origW: img.w,
      origH: img.h,
      rect
    }
  }

  const handleResizeMove = (e) => {
    if (!resizeStart.current) return
    e.stopPropagation()
    const { pointerX, pointerY, origW, origH, rect } = resizeStart.current
    const dx = e.clientX - pointerX
    const dy = e.clientY - pointerY

    const dwPercent = (dx / rect.width) * 100
    const dhPercent = (dy / rect.height) * 100

    let newW = Math.max(5, origW + dwPercent)
    let newH = Math.max(5, origH + dhPercent)

    onUpdate({ w: newW, h: newH })
  }

  const handleResizeUp = (e) => {
    if (!resizeStart.current) return
    e.stopPropagation()
    e.target.releasePointerCapture(e.pointerId)
    resizeStart.current = null
  }

  const borderStyle = isHovered && !disabled
    ? '2px solid #1a73e8'
    : '2px dashed transparent'

  const container = containerRef.current
  const containerHeight = container ? container.getBoundingClientRect().height : 400
  const fontSize = Math.max(12, Math.round(containerHeight * (img.h / 100) * 0.55))

  const renderContent = () => {
    if (img.type === 'image') {
      return (
        <img
          src={img.dataUrl}
          alt="whiteboard-upload"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            pointerEvents: 'none'
          }}
        />
      )
    }

    if (img.type === 'text') {
      return (
        <div
          style={{
            color: img.color || C.text,
            fontSize: `${fontSize}px`,
            fontFamily: 'Cairo, sans-serif',
            fontWeight: 600,
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            textAlign: 'center',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
            pointerEvents: 'none'
          }}
        >
          {img.text}
        </div>
      )
    }

    if (img.type === 'shape') {
      const size = img.size || 3
      const color = img.color || '#1a73e8'

      if (img.tool === 'rect') {
        return (
          <svg width="100%" height="100%" style={{ overflow: 'visible', pointerEvents: 'none' }}>
            <rect
              x={size / 2}
              y={size / 2}
              width={`calc(100% - ${size}px)`}
              height={`calc(100% - ${size}px)`}
              fill="none"
              stroke={color}
              strokeWidth={size}
            />
          </svg>
        )
      }

      if (img.tool === 'circle') {
        return (
          <svg width="100%" height="100%" style={{ overflow: 'visible', pointerEvents: 'none' }}>
            <ellipse
              cx="50%"
              cy="50%"
              rx={`calc(50% - ${size / 2}px)`}
              ry={`calc(50% - ${size / 2}px)`}
              fill="none"
              stroke={color}
              strokeWidth={size}
            />
          </svg>
        )
      }

      if (img.tool === 'line') {
        return (
          <svg width="100%" height="100%" style={{ overflow: 'visible', pointerEvents: 'none' }}>
            <line
              x1={img.flipX ? "100%" : "0%"}
              y1={img.flipY ? "100%" : "0%"}
              x2={img.flipX ? "0%" : "100%"}
              y2={img.flipY ? "0%" : "100%"}
              stroke={color}
              strokeWidth={size}
              strokeLinecap="round"
            />
          </svg>
        )
      }

      if (img.tool === 'triangle') {
        return (
          <svg width="100%" height="100%" style={{ overflow: 'visible', pointerEvents: 'none' }}>
            <polygon
              points={`50%,${size / 2} calc(100% - ${size / 2}px),calc(100% - ${size / 2}px) ${size / 2},calc(100% - ${size / 2}px)`}
              fill="none"
              stroke={color}
              strokeWidth={size}
              strokeLinejoin="round"
            />
          </svg>
        )
      }
    }

    return null
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'absolute',
        left: `${img.x}%`,
        top: `${img.y}%`,
        width: `${img.w}%`,
        height: `${img.h}%`,
        border: borderStyle,
        cursor: disabled ? 'default' : 'move',
        pointerEvents: disabled ? 'none' : 'auto',
        userSelect: 'none',
        touchAction: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5
      }}
    >
      {renderContent()}

      {isHovered && !disabled && (
        <>
          <button
            className="delete-btn"
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            style={{
              position: 'absolute',
              top: -12,
              right: -12,
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: '#ea4335',
              border: '1px solid #fff',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              padding: 0,
              zIndex: 10
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>close</span>
          </button>

          <div
            className="resize-handle"
            onPointerDown={handleResizeDown}
            onPointerMove={handleResizeMove}
            onPointerUp={handleResizeUp}
            style={{
              position: 'absolute',
              bottom: -6,
              left: -6,
              width: 14,
              height: 14,
              background: '#1a73e8',
              border: '2px solid #fff',
              borderRadius: '50%',
              cursor: 'nesw-resize',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              zIndex: 10
            }}
          />
          <div
            className="resize-handle"
            onPointerDown={handleResizeDown}
            onPointerMove={handleResizeMove}
            onPointerUp={handleResizeUp}
            style={{
              position: 'absolute',
              bottom: -6,
              right: -6,
              width: 14,
              height: 14,
              background: '#1a73e8',
              border: '2px solid #fff',
              borderRadius: '50%',
              cursor: 'nwse-resize',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              zIndex: 10
            }}
          />
        </>
      )}
    </div>
  )
}
