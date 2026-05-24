import React, { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import DotPixelIcon from './DotPixelIcon'

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [socket, setSocket] = useState(null)
  const [visitorId, setVisitorId] = useState('')
  const [status, setStatus] = useState('Connecting...')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    let vid = localStorage.getItem('vixcell_visitor_id')
    if (!vid) {
      vid = 'v_' + Math.random().toString(36).substring(2, 9)
      localStorage.setItem('vixcell_visitor_id', vid)
    }
    setVisitorId(vid)

    try {
      const newSocket = io('https://api.vixcell.com', {
        timeout: 5000,
        reconnectionAttempts: 3,
        transports: ['websocket', 'polling'],
      })
      setSocket(newSocket)

      newSocket.on('connect', () => {
        setStatus('Online')
        newSocket.emit('visitor:join', { visitorId: vid, visitorName: 'Website Visitor' })
      })

      newSocket.on('disconnect', () => {
        setStatus('Offline')
      })

      newSocket.on('connect_error', () => {
        setStatus('Offline')
      })

      newSocket.on('visitor:message', (msg) => {
        setMessages(prev => [...prev, { ...msg, sender: 'visitor' }])
      })

      newSocket.on('admin:message', (msg) => {
        setMessages(prev => [...prev, { ...msg, sender: 'admin' }])
        setIsOpen(true)
      })

      return () => newSocket.close()
    } catch (err) {
      console.error('[LiveChat] Socket connection error:', err)
      setStatus('Offline')
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = (e) => {
    e.preventDefault()
    if (!input.trim() || !socket) return
    socket.emit('visitor:message', { sessionId: visitorId, content: input })
    setInput('')
  }

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} style={styles.fab} className="btn-primary">
        <DotPixelIcon name="chat" size={28} color="white" />
      </button>

      {isOpen && (
        <div className="glass" style={styles.window}>
          <div style={styles.header}>
            <div>
              <h4 style={{margin:0}}>Vixcell Support</h4>
              <small style={{color: status === 'Online' ? '#00B530' : '#FFB547'}}>{status}</small>
            </div>
            <button onClick={() => setIsOpen(false)} style={styles.closeBtn}><DotPixelIcon name="close" size={20} color="var(--text-color)" /></button>
          </div>
          
          <div style={styles.messages}>
            {messages.length === 0 && <p style={{textAlign:'center', color:'rgba(0,0,0,0.4)', marginTop:'2rem'}}>Send us a message!</p>}
            {messages.map((m, i) => (
              <div key={i} style={{...styles.msgBubble, alignSelf: m.sender === 'visitor' ? 'flex-end' : 'flex-start', background: m.sender === 'visitor' ? 'var(--primary)' : 'rgba(0,0,0,0.06)', color: m.sender === 'visitor' ? 'white' : 'var(--text-color)'}}>
                {m.content}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} style={styles.inputArea}>
            <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Type a message..." style={styles.input} />
            <button type="submit" style={styles.sendBtn}><DotPixelIcon name="send" size={18} color="white" /></button>
          </form>
        </div>
      )}
    </>
  )
}

const styles = {
  fab: {
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
    zIndex: 1000,
  },
  window: {
    position: 'fixed',
    bottom: '5.5rem',
    right: '2rem',
    width: '350px',
    height: '500px',
    borderRadius: '16px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
    border: '1px solid var(--border-color)',
  },
  header: {
    padding: '1rem',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'var(--bg-color)',
    color: 'var(--text-color)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-color)',
    cursor: 'pointer',
  },
  messages: {
    flex: 1,
    padding: '1rem',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    background: '#ffffff',
  },
  msgBubble: {
    padding: '0.6rem 1rem',
    borderRadius: '16px',
    maxWidth: '80%',
    wordBreak: 'break-word',
    fontSize: '0.9rem',
  },
  inputArea: {
    padding: '1rem',
    borderTop: '1px solid var(--border-color)',
    display: 'flex',
    gap: '0.5rem',
    background: 'var(--bg-color)',
  },
  input: {
    flex: 1,
    padding: '0.8rem',
    borderRadius: '20px',
    border: '1px solid var(--border-color)',
    outline: 'none',
    background: '#ffffff',
    color: 'var(--text-color)',
    fontFamily: 'Inter',
    fontSize: '0.9rem',
  },
  sendBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    background: 'var(--primary)',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
}
