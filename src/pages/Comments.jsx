import React, { useState } from 'react'
import { Send, CheckCircle2 } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { SectionHeader, Button, Planned, EmptyState, timeAgo, Card } from '../components/ui.jsx'

export default function Comments() {
  const { users, notifications, sendPushToUser } = useData()
  const [userName, setUserName] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sent, setSent] = useState(false)

  const send = () => {
    if (!userName || !title) return
    sendPushToUser(userName, title, body)
    setSent(true)
    setTitle(''); setBody('')
    setTimeout(() => setSent(false), 2000)
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

      <div className="mt-6">
        <Planned items={[
          'Broadcast to a segment (all drivers, one city)',
          'Email/SMS templates for verification outcomes',
          'In-app banner for outages',
        ]} />
      </div>
    </div>
  )
}
