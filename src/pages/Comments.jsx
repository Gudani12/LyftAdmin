import React, { useState } from 'react'
import { Send } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { SectionHeader, Button, Planned, EmptyState, timeAgo } from '../components/ui.jsx'

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
    <div>
      <SectionHeader title="Comments" subtitle="Push notification to one user." />

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-black/5 bg-white p-4">
          <label className="text-xs text-slate2">User</label>
          <select value={userName} onChange={(e) => setUserName(e.target.value)} className="mt-1 w-full rounded-md border border-black/10 px-2.5 py-1.5 text-sm">
            <option value="">Select a user...</option>
            {users.map((u) => <option key={u.id} value={u.name}>{u.name} ({u.role})</option>)}
          </select>
          <label className="text-xs text-slate2 mt-3 block">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-md border border-black/10 px-2.5 py-1.5 text-sm" placeholder="e.g. Your document was approved" />
          <label className="text-xs text-slate2 mt-3 block">Message</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="mt-1 w-full rounded-md border border-black/10 px-2.5 py-1.5 text-sm" placeholder="Optional message body..." />
          <Button variant="accent" className="mt-3" disabled={!userName || !title} onClick={send}>
            <Send size={14} /> {sent ? 'Sent!' : 'Send push notification'}
          </Button>
        </div>

        <div>
          <h2 className="font-display font-semibold mb-3">Recent outbound notifications</h2>
          {notifications.length === 0 ? <EmptyState title="Nothing sent yet" hint="Notifications also fire automatically on verification and account decisions." /> : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {notifications.map((n) => (
                <div key={n.id} className="rounded-lg border border-black/5 bg-white p-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{n.userName}</span>
                    <span className="text-slate2 text-xs">{timeAgo(n.at)}</span>
                  </div>
                  <div className="text-sm mt-0.5">{n.title}</div>
                  {n.body && <div className="text-xs text-slate2 mt-0.5">{n.body}</div>}
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
