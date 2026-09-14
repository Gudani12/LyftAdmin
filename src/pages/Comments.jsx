import React, { useState } from 'react'
import { Bell, CheckCircle2, Megaphone, Save, Send, XCircle } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { SectionHeader, Button, EmptyState, timeAgo, Card } from '../components/ui.jsx'

export default function Comments() {
  const { users, notifications, sendPushToUser, broadcastToSegment, communicationTemplates, saveCommunicationTemplate, outageBanner, publishOutageBanner, clearOutageBanner } = useData()
  const [userName, setUserName] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sent, setSent] = useState(false)
  const [segment, setSegment] = useState('drivers')
  const [city, setCity] = useState('')
  const [broadcastSent, setBroadcastSent] = useState(null)
  const [templateOutcome, setTemplateOutcome] = useState('approved')
  const [template, setTemplate] = useState(communicationTemplates.approved)
  const [bannerTitle, setBannerTitle] = useState(outageBanner?.title || '')
  const [bannerMessage, setBannerMessage] = useState(outageBanner?.message || '')

  const send = () => {
    if (!userName || !title) return
    sendPushToUser(userName, title, body)
    setSent(true)
    setTitle(''); setBody('')
    setTimeout(() => setSent(false), 2000)
  }

  const sendBroadcast = () => {
    if (!title) return
    const count = broadcastToSegment(segment, city, title, body)
    setBroadcastSent(count)
    setTimeout(() => setBroadcastSent(null), 2500)
  }

  const changeTemplateOutcome = (outcome) => {
    setTemplateOutcome(outcome)
    setTemplate(communicationTemplates[outcome])
  }

  const saveTemplate = () => saveCommunicationTemplate(templateOutcome, template)

  const publishBanner = () => {
    if (bannerTitle.trim() && bannerMessage.trim()) publishOutageBanner({ title: bannerTitle.trim(), message: bannerMessage.trim(), severity: 'warning' })
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Comments" subtitle="Push notification to one user." />

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.03)]">
          <label className="text-xs font-semibold text-slate2 uppercase tracking-[0.18em]">User</label>
          <select value={userName} onChange={(e) => setUserName(e.target.value)} className="mt-2 w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40">
            <option value="">Select a user...</option>
            {users.map((u) => <option key={u.id} value={u.name}>{u.name} ({u.role})</option>)}
          </select>
          <label className="text-xs font-semibold text-slate2 uppercase tracking-[0.18em] mt-3 block">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40" placeholder="e.g. Your document was approved" />
          <label className="text-xs font-semibold text-slate2 uppercase tracking-[0.18em] mt-3 block">Message</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40" placeholder="Optional message body..." />
          <Button variant="accent" className="mt-4 w-full" disabled={!userName || !title} onClick={send}>
            {sent ? <><CheckCircle2 size={14} /> Sent!</> : <><Send size={14} /> Send push notification</>}
          </Button>
        </div>

        <div>
          <h2 className="font-display font-semibold mb-3">Recent outbound notifications</h2>
          {notifications.length === 0 ? <EmptyState title="Nothing sent yet" hint="Notifications also fire automatically on verification and account decisions." /> : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {notifications.map((n) => (
                <div key={n.id} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-medium text-sm">{n.userName}</span>
                    <span className="text-slate2 text-[11px] whitespace-nowrap">{timeAgo(n.at)}</span>
                  </div>
                  <div className="text-sm font-medium mt-2">{n.title}</div>
                  {n.body && <div className="text-xs text-slate2 mt-1.5">{n.body}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-start gap-3"><Megaphone className="text-accent" size={19} /><div><h2 className="font-display text-lg font-semibold text-ink">Broadcast to a segment</h2><p className="text-xs text-slate2">Simulated push delivery for the current admin dataset.</p></div></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <select value={segment} onChange={(e) => setSegment(e.target.value)} className="rounded-xl border border-black/10 px-3 py-2 text-sm"><option value="drivers">All drivers</option><option value="city">One city</option><option value="all">All users</option></select>
            <input value={city} onChange={(e) => setCity(e.target.value)} disabled={segment !== 'city'} placeholder="City, e.g. Johannesburg" className="rounded-xl border border-black/10 px-3 py-2 text-sm disabled:bg-slate-100" />
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Broadcast title" className="mt-3 w-full rounded-xl border border-black/10 px-3 py-2 text-sm" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Broadcast message" className="mt-3 w-full rounded-xl border border-black/10 px-3 py-2 text-sm" />
          <Button variant="accent" className="mt-3 w-full" disabled={!title || (segment === 'city' && !city)} onClick={sendBroadcast}>{broadcastSent === null ? <><Send size={14} /> Send broadcast</> : <><CheckCircle2 size={14} /> Sent to {broadcastSent} users</>}</Button>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-start gap-3"><Save className="text-info" size={19} /><div><h2 className="font-display text-lg font-semibold text-ink">Verification templates</h2><p className="text-xs text-slate2">Reusable email/SMS copy. Delivery provider can be connected later.</p></div></div>
          <select value={templateOutcome} onChange={(e) => changeTemplateOutcome(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm"><option value="approved">Approved outcome</option><option value="rejected">Rejected outcome</option></select>
          <input value={template.subject} onChange={(e) => setTemplate({ ...template, subject: e.target.value })} placeholder="Subject" className="mt-3 w-full rounded-xl border border-black/10 px-3 py-2 text-sm" />
          <textarea value={template.message} onChange={(e) => setTemplate({ ...template, message: e.target.value })} rows={3} placeholder="Message template" className="mt-3 w-full rounded-xl border border-black/10 px-3 py-2 text-sm" />
          <Button variant="ghost" className="mt-3 w-full" onClick={saveTemplate}><Save size={14} /> Save template</Button>
        </Card>

        <Card className="p-5 xl:col-span-2">
          <div className="mb-4 flex items-start gap-3"><Bell className="text-amber-700" size={19} /><div><h2 className="font-display text-lg font-semibold text-ink">In-app outage banner</h2><p className="text-xs text-slate2">Publish a notice for users while a service issue is active.</p></div></div>
          {outageBanner && <div className="mb-3 flex items-start justify-between gap-3 rounded-xl border border-amber/20 bg-amber-bg p-3 text-sm text-amber-700"><div><strong>{outageBanner.title}</strong><p className="mt-1">{outageBanner.message}</p></div><Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={clearOutageBanner}><XCircle size={12} /> Clear</Button></div>}
          <div className="grid gap-3 md:grid-cols-[1fr_1.5fr_auto]"><input value={bannerTitle} onChange={(e) => setBannerTitle(e.target.value)} placeholder="Outage title" className="rounded-xl border border-black/10 px-3 py-2 text-sm" /><input value={bannerMessage} onChange={(e) => setBannerMessage(e.target.value)} placeholder="What users should know" className="rounded-xl border border-black/10 px-3 py-2 text-sm" /><Button variant="accent" disabled={!bannerTitle.trim() || !bannerMessage.trim()} onClick={publishBanner}>Publish banner</Button></div>
        </Card>
      </div>
    </div>
  )
}
