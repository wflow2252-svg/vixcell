import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Icon from '@/components/Icon'
import { whatsappAPI, leadsAPI, aiAPI } from '@/api/client'
import { openWhatsApp } from '@/lib/whatsapp'
import { useAppStore } from '@/store'

interface Contact { id: string; name?: string; phone: string; last_sent_at?: string }
interface Message { id: string; contact_id?: string; body: string; sent_by: string; created_at?: string }

export default function WhatsAppPage() {
  const { language } = useAppStore()
  const isAr = language === 'ar'

  const [to, setTo] = useState('')
  const [message, setMessage] = useState('')
  const [topic, setTopic] = useState('')
  const [sending, setSending] = useState(false)
  const [sendingVoice, setSendingVoice] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [leadOptions, setLeadOptions] = useState<{ name: string; phone?: string }[]>([])
  const [savedContacts, setSavedContacts] = useState<Contact[]>([])
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [savingContact, setSavingContact] = useState(false)

  const loadHistory = useCallback(async () => {
    try {
      const res = await whatsappAPI.history()
      setContacts(res.data.contacts)
      setMessages(res.data.messages)
    } catch { /* ignore */ }
  }, [])

  const loadContacts = useCallback(async () => {
    try { setSavedContacts((await whatsappAPI.contacts()).data.items) } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    loadHistory()
    loadContacts()
    leadsAPI.list({ page_size: 100 }).then(res => {
      setLeadOptions(res.data.items.filter((l: any) => l.phone).map((l: any) => ({ name: l.name, phone: l.phone })))
    }).catch(() => {})
  }, [loadHistory, loadContacts])

  const saveContact = async () => {
    if (!newName.trim() || !newPhone.trim()) { toast.error(isAr ? 'اكتب الاسم والرقم' : 'Enter name and number'); return }
    setSavingContact(true)
    try {
      await whatsappAPI.addContact(newName.trim(), newPhone.trim())
      toast.success(isAr ? `تم حفظ ${newName}` : `Saved ${newName}`)
      setNewName(''); setNewPhone('')
      loadContacts()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || (isAr ? 'فشل الحفظ' : 'Save failed'))
    } finally { setSavingContact(false) }
  }

  const generate = async () => {
    if (!topic.trim()) { toast.error(isAr ? 'اكتب الموضوع الأول' : 'Enter a topic'); return }
    setGenerating(true)
    try {
      const models = await aiAPI.models()
      const names = models.data.models.map((m: any) => m.name)
      const model = names.find((n: string) => n.includes('instruct')) || names[0]
      if (!model) { toast.error(isAr ? 'نزّل نموذج ذكاء الأول' : 'Install an AI model first'); return }
      const res = await aiAPI.content({ model, content_type: 'whatsapp_message', topic: topic.trim(), language: 'ar-eg', tone: 'friendly' })
      setMessage(res.data.text?.trim() || '')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || (isAr ? 'فشل توليد الرسالة' : 'Generation failed'))
    } finally {
      setGenerating(false)
    }
  }

  const send = async () => {
    if (!to.trim()) { toast.error(isAr ? 'اختار أو اكتب المستقبِل' : 'Pick a recipient'); return }
    if (!message.trim()) { toast.error(isAr ? 'اكتب الرسالة' : 'Write the message'); return }
    setSending(true)
    try {
      const res = await whatsappAPI.sendNow(to.trim(), message.trim(), topic.trim() ? 'ai' : 'user')
      if (!res.data.sent) openWhatsApp(res.data)
      toast.success(res.data.sent
        ? (isAr ? `اتبعتت لـ ${res.data.name || to} ✅` : `Sent to ${res.data.name || to} ✅`)
        : (isAr ? `الواتساب فتح لـ ${res.data.name || to} — دوس إرسال` : 'WhatsApp opened — tap send'))
      setMessage(''); setTopic('')
      setTimeout(loadHistory, 800)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || (isAr ? 'ملقتش رقم' : 'No number found'))
    } finally {
      setSending(false)
    }
  }

  const sendVoice = async () => {
    if (!to.trim()) { toast.error(isAr ? 'اختار أو اكتب المستقبِل' : 'Pick a recipient'); return }
    if (!message.trim()) { toast.error(isAr ? 'اكتب الكلام اللي الفويس هيقوله' : 'Write what the voice should say'); return }
    setSendingVoice(true)
    const t = toast.loading(isAr ? 'بحوّل الكلام لفويس وبفتح الواتساب…' : 'Making the voice note…')
    try {
      const res = await whatsappAPI.sendVoice(to.trim(), message.trim(), topic.trim() ? 'ai' : 'user')
      toast.success(isAr ? `الرسالة الصوتية اتبعتت لـ ${res.data.name || to} 🎤✅` : `Voice note sent to ${res.data.name || to} 🎤✅`, { id: t })
      setMessage(''); setTopic('')
      setTimeout(loadHistory, 1000)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || (isAr ? 'مقدرتش أبعت الفويس' : 'Voice send failed'), { id: t })
    } finally {
      setSendingVoice(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Icon name="chat" size={24} className="text-emerald-400" />{isAr ? 'واتساب' : 'WhatsApp'}
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {isAr ? 'اكتب أو خلي الذكاء يكتب، واختار العميل — يفتح الواتساب بالرسالة جاهزة'
                : 'Compose or let AI write, pick a contact — WhatsApp opens with the message ready'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Composer */}
        <div className="lg:col-span-2 glass-card p-5 space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">{isAr ? 'لمين؟ (اسم عميل أو رقم)' : 'To (lead name or number)'}</label>
            <input className="input-field" dir="auto" value={to} onChange={e => setTo(e.target.value)}
              list="wa-leads" placeholder={isAr ? 'مثال: أحمد، أو 01001234567' : 'e.g. Ahmed, or a number'} />
            <datalist id="wa-leads">
              {savedContacts.map((c, i) => <option key={'c' + i} value={c.name || c.phone}>{c.phone}</option>)}
              {leadOptions.map((l, i) => <option key={'l' + i} value={l.name}>{l.phone}</option>)}
            </datalist>
          </div>

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1 block">{isAr ? 'خلي الذكاء يكتبها (اختياري)' : 'Let AI write it (optional)'}</label>
              <input className="input-field" value={topic} onChange={e => setTopic(e.target.value)}
                placeholder={isAr ? 'الموضوع: مثال عرض الشهر' : 'Topic, e.g. this month\'s offer'} />
            </div>
            <button onClick={generate} disabled={generating} className="btn-ghost text-sm flex items-center gap-2 whitespace-nowrap">
              {generating ? <span className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin" /> : <Icon name="auto_awesome" size={16} />}
              {isAr ? 'اكتبها' : 'Write'}
            </button>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">{isAr ? 'الرسالة' : 'Message'}</label>
            <textarea className="input-field min-h-[140px]" dir="auto" value={message} onChange={e => setMessage(e.target.value)}
              placeholder={isAr ? 'اكتب رسالتك هنا...' : 'Type your message...'} />
          </div>

          <div className="flex gap-2">
            <button onClick={send} disabled={sending || sendingVoice} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {sending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="send" size={18} />}
              {isAr ? 'ابعت نص' : 'Send text'}
            </button>
            <button onClick={sendVoice} disabled={sending || sendingVoice}
              className="btn-ghost flex items-center justify-center gap-2 whitespace-nowrap border border-emerald-500/30 text-emerald-300"
              title={isAr ? 'يحوّل الكلام لرسالة صوتية ويبعتها كملف في الواتساب' : 'Turn the text into a voice note and send it as a file'}>
              {sendingVoice ? <span className="w-4 h-4 border-2 border-emerald-300/40 border-t-emerald-300 rounded-full animate-spin" /> : <Icon name="mic" size={18} />}
              {isAr ? 'ابعت صوت 🎤' : 'Send voice 🎤'}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 -mt-1">
            {isAr
              ? '🎤 الصوت بيتبعت كملف صوتي (مش الزرار اللي بتسجّل بيه) — البرنامج بيفتح الواتساب ويلزّقه ويبعته لوحده.'
              : '🎤 The voice is sent as an audio file (not a recorded PTT) — the app opens WhatsApp, pastes it and sends.'}
          </p>
        </div>

        {/* Add contact + Recent */}
        <div className="glass-card p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Icon name="person_add" size={16} className="text-emerald-400" />{isAr ? 'احفظ عميل (اسم + رقم)' : 'Save a contact'}
            </h3>
            <div className="space-y-2">
              <input className="input-field text-sm" value={newName} onChange={e => setNewName(e.target.value)}
                placeholder={isAr ? 'اسم العميل' : 'Contact name'} />
              <input className="input-field text-sm" dir="ltr" value={newPhone} onChange={e => setNewPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveContact()}
                placeholder={isAr ? 'الرقم — مثال 01001234567' : 'Number'} />
              <button onClick={saveContact} disabled={savingContact} className="btn-primary w-full text-sm flex items-center justify-center gap-2">
                {savingContact ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="save" size={16} />}
                {isAr ? 'حفظ' : 'Save'}
              </button>
            </div>
            {savedContacts.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {savedContacts.slice(0, 8).map(c => (
                  <button key={c.id} onClick={() => setTo(c.name || c.phone)}
                    className="badge badge-blue text-[10px] hover:opacity-80" title={c.phone}>
                    {c.name || c.phone}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-line pt-3">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Icon name="history" size={16} />{isAr ? 'آخر اللي بعتّه' : 'Recent'}
          </h3>
          {messages.length === 0 ? (
            <p className="text-slate-500 text-xs py-6 text-center">{isAr ? 'لسه مبعتش حاجة' : 'Nothing sent yet'}</p>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto">
              {messages.map(m => {
                const c = contacts.find(x => x.id === m.contact_id)
                return (
                  <div key={m.id} className="p-2.5 rounded-lg bg-surface-700/40 border border-line">
                    <p className="text-xs text-white font-medium flex items-center gap-1.5">
                      <Icon name="person" size={12} className="text-emerald-400" />
                      {c?.name || c?.phone || (isAr ? 'عميل' : 'contact')}
                      {m.sent_by === 'ai' && <span className="badge badge-purple text-[9px]">AI</span>}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{m.body}</p>
                  </div>
                )
              })}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}
