import React, { useEffect, useRef, useState } from 'react'
import { Siren, Volume2, VolumeX, Star as StarIcon, Flag } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { Rail, StatusBadge, Button, Modal, SectionHeader, EmptyState, Planned, timeAgo } from '../components/ui.jsx'

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = 880
    gain.gain.value = 0.08
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    setTimeout(() => { osc.stop(); ctx.close() }, 220)
  } catch (e) { /* audio unavailable in this environment */ }
}

export default function Safety() {
  const { safety, acknowledgeSOS, resolveSOS } = useData()
  const [muted, setMuted] = useState(false)
  const [resolving, setResolving] = useState(null)
  const [note, setNote] = useState('')
  const lastOpenCount = useRef(0)

  const openSOS = safety.sos.filter((s) => s.status === 'open')
  const ackSOS = safety.sos.filter((s) => s.status === 'acknowledged')
  const resolvedSOS = safety.sos.filter((s) => s.status === 'resolved')

  useEffect(() => {
    if (!muted && openSOS.length > lastOpenCount.current) beep()
    lastOpenCount.current = openSOS.length
  }, [openSOS.length, muted])

  return (
    <div>
      <SectionHeader
        title="Safety"
        subtitle="SOS alerts, low-rating flags, and reported users."
        action={
          <Button variant="ghost" onClick={() => setMuted((m) => !m)}>
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />} {muted ? 'Alerts muted' : 'Alerts on'}
          </Button>
        }
      />

      <div className="mb-3 flex items-center gap-2">
        <Siren size={16} className="text-bad" />
        <h2 className="font-display font-semibold">SOS inbox</h2>
        {openSOS.length > 0 && <span className="rounded-full bg-bad text-white text-xs px-2 py-0.5 sos-pulse">{openSOS.length} open</span>}
      </div>

      {safety.sos.length === 0 ? (
        <EmptyState title="No SOS alerts" />
      ) : (
        <div className="space-y-2 mb-6">
          {[...openSOS, ...ackSOS, ...resolvedSOS].map((s) => (
            <Rail key={s.id} tone={s.status === 'open' ? 'urgent' : s.status === 'acknowledged' ? 'warn' : 'ok'}>
              <div className="flex items-center gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{s.user} <span className="text-slate2 capitalize font-normal">({s.role})</span></div>
                  <div className="text-xs text-slate2 mt-0.5">{s.location} &middot; trip {s.tripId} &middot; triggered {timeAgo(s.triggeredAt)}</div>
                  {s.resolvedNote && <div className="text-xs text-good mt-0.5">Resolved: {s.resolvedNote}</div>}
                </div>
                <StatusBadge status={s.status} />
                {s.status === 'open' && <Button variant="bad" onClick={() => acknowledgeSOS(s.id)}>Acknowledge</Button>}
                {s.status === 'acknowledged' && <Button variant="good" onClick={() => setResolving(s)}>Resolve</Button>}
              </div>
            </Rail>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <StarIcon size={16} className="text-amber" />
            <h2 className="font-display font-semibold">Low-rating flags</h2>
          </div>
          {safety.lowRatingFlags.length === 0 ? <EmptyState title="No flags" /> : (
            <div className="space-y-2">
              {safety.lowRatingFlags.map((f) => (
                <Rail key={f.id} tone="warn">
                  <div className="px-4 py-3">
                    <div className="text-sm font-medium">{f.user} <span className="text-slate2 capitalize font-normal">({f.role})</span> rated {f.rating}★</div>
                    <div className="text-xs text-slate2 mt-0.5">Trip {f.tripId} — "{f.comment}"</div>
                  </div>
                </Rail>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Flag size={16} className="text-bad" />
            <h2 className="font-display font-semibold">Reported users</h2>
          </div>
          {safety.reportedUsers.length === 0 ? <EmptyState title="No reports" /> : (
            <div className="space-y-2">
              {safety.reportedUsers.map((r) => (
                <Rail key={r.id} tone={r.status === 'open' ? 'urgent' : 'warn'}>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div className="text-sm font-medium">{r.reported}</div>
                      <div className="text-xs text-slate2 mt-0.5">Reported by {r.reportedBy} — {r.reason}</div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                </Rail>
              ))}
            </div>
          )}
        </div>
      </div>

      <Planned items={[
        'Trip chat access for dispute investigation',
        'Incident log with recorded outcome',
        'Emergency contact lookup for a user in an active trip',
      ]} />

      <Modal open={!!resolving} onClose={() => setResolving(null)} title="Resolve SOS alert">
        <label className="text-xs text-slate2">Resolution note</label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="mt-1 w-full rounded-md border border-black/10 px-2.5 py-1.5 text-sm" placeholder="What happened, and how it was resolved..." />
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setResolving(null)}>Cancel</Button>
          <Button variant="good" onClick={() => { resolveSOS(resolving.id, note || 'Resolved by admin.'); setNote(''); setResolving(null) }}>Mark resolved</Button>
        </div>
      </Modal>
    </div>
  )
}
