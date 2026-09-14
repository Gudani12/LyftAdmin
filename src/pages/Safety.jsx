import React, { useEffect, useRef, useState, useMemo } from 'react'
import { Siren, Volume2, VolumeX, Star as StarIcon, Flag, AlertTriangle, MessageSquare, ClipboardCheck, Phone } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { Rail, StatusBadge, Button, Modal, SectionHeader, EmptyState, timeAgo, Card, fmtDate } from '../components/ui.jsx'

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
  const { safety, users, trips, acknowledgeSOS, resolveSOS, tripChats, incidentLog, recordIncident } = useData()
  const [muted, setMuted] = useState(false)
  const [resolving, setResolving] = useState(null)
  const [note, setNote] = useState('')
  const [chatTrip, setChatTrip] = useState(null)
  const [incidentTrip, setIncidentTrip] = useState(null)
  const [incidentOutcome, setIncidentOutcome] = useState('Resolved - no further action')
  const [incidentNotes, setIncidentNotes] = useState('')
  const [contactTrip, setContactTrip] = useState(null)
  const lastOpenCount = useRef(0)

  const openSOS = safety.sos.filter((s) => s.status === 'open')
  const ackSOS = safety.sos.filter((s) => s.status === 'acknowledged')
  const resolvedSOS = safety.sos.filter((s) => s.status === 'resolved')

  const summary = useMemo(() => ({
    open: openSOS.length,
    acknowledged: ackSOS.length,
    lowRatings: safety.lowRatingFlags.length,
    reports: safety.reportedUsers.length,
  }), [openSOS.length, ackSOS.length, safety.lowRatingFlags.length, safety.reportedUsers.length])

  useEffect(() => {
    if (!muted && openSOS.length > lastOpenCount.current) beep()
    lastOpenCount.current = openSOS.length
  }, [openSOS.length, muted])

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Safety"
        subtitle="SOS alerts, low-rating flags, and reported users."
        action={
          <Button variant="ghost" onClick={() => setMuted((m) => !m)}>
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />} {muted ? 'Alerts muted' : 'Alerts on'}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryKPI label="Open SOS" value={summary.open} tone="urgent" icon={Siren} />
        <SummaryKPI label="Acknowledged" value={summary.acknowledged} tone="warn" icon={AlertTriangle} />
        <SummaryKPI label="Low-rating flags" value={summary.lowRatings} tone="amber" icon={StarIcon} />
        <SummaryKPI label="Reported users" value={summary.reports} tone="bad" icon={Flag} />
      </div>

      <div className="mb-3 flex items-center gap-2">
        <Siren size={16} className="text-bad" />
        <h2 className="font-display font-semibold">SOS inbox</h2>
        {openSOS.length > 0 && <span className="rounded-full bg-bad text-white text-xs px-2 py-0.5 sos-pulse">{openSOS.length} open</span>}
      </div>

      {safety.sos.length === 0 ? (
        <EmptyState title="No SOS alerts" />
      ) : (
        <div className="space-y-3 mb-6">
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
            <div className="space-y-3">
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
            <div className="space-y-3">
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

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2"><MessageSquare size={17} className="text-info" /><h2 className="font-display font-semibold">Active trip investigation</h2></div>
          {trips.filter((trip) => trip.status === 'in_progress').length === 0 ? <p className="text-sm text-slate2">No active trips available.</p> : <div className="space-y-2">{trips.filter((trip) => trip.status === 'in_progress').map((trip) => <div key={trip.id} className="flex items-center justify-between gap-3 rounded-xl border border-black/5 bg-slate-50 px-3 py-2.5"><div><div className="text-sm font-medium">{trip.id}</div><div className="text-xs text-slate2">{trip.rider} with {trip.driver}</div></div><div className="flex gap-1.5"><Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => setChatTrip(trip)}>Chat</Button><Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => setContactTrip(trip)}><Phone size={12} /> Contact</Button></div></div>)}</div>}
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2"><ClipboardCheck size={17} className="text-accent" /><h2 className="font-display font-semibold">Incident outcomes</h2></div>
          {incidentLog.length === 0 ? <p className="text-sm text-slate2">No incident outcomes recorded yet.</p> : <div className="space-y-2">{incidentLog.slice(0, 4).map((incident) => <div key={incident.id} className="rounded-xl border border-black/5 bg-slate-50 px-3 py-2.5 text-sm"><div className="font-medium">{incident.tripId} · {incident.outcome}</div><div className="mt-1 text-xs text-slate2">{incident.notes || 'No additional notes'} · {fmtDate(incident.recordedAt)}</div></div>)}</div>}
          {trips.filter((trip) => trip.status === 'in_progress').length > 0 && <Button variant="accent" className="mt-3" onClick={() => setIncidentTrip(trips.find((trip) => trip.status === 'in_progress'))}><ClipboardCheck size={13} /> Record outcome</Button>}
        </Card>
      </div>

      <Modal open={!!resolving} onClose={() => setResolving(null)} title="Resolve SOS alert">
        <label className="text-xs text-slate2">Resolution note</label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="mt-1 w-full rounded-2xl border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40" placeholder="What happened, and how it was resolved..." />
        <div className="mt-4 flex justify-end gap-2 border-t border-black/5 pt-4">
          <Button variant="ghost" onClick={() => setResolving(null)}>Cancel</Button>
          <Button variant="good" onClick={() => { resolveSOS(resolving.id, note || 'Resolved by admin.'); setNote(''); setResolving(null) }}>Mark resolved</Button>
        </div>
      </Modal>

      <Modal open={!!chatTrip} onClose={() => setChatTrip(null)} title={`Trip chat · ${chatTrip?.id || ''}`}>
        <div className="space-y-3">{(chatTrip && tripChats[chatTrip.id] || []).length === 0 ? <EmptyState title="No chat messages" hint="No messages are available for this trip." /> : tripChats[chatTrip.id].map((message) => <div key={message.id} className="rounded-xl border border-black/5 bg-slate-50 p-3"><div className="flex justify-between gap-2 text-sm font-medium"><span>{message.sender} <span className="text-xs font-normal capitalize text-slate2">({message.role})</span></span><span className="text-[11px] font-normal text-slate2">{timeAgo(message.at)}</span></div><p className="mt-1 text-sm text-ink-700">{message.message}</p></div>)}</div>
      </Modal>

      <Modal open={!!contactTrip} onClose={() => setContactTrip(null)} title="Emergency contact lookup">
        {contactTrip && (() => { const user = users.find((item) => item.name === contactTrip.rider); const contact = user?.emergencyContact; return contact ? <div className="space-y-3"><div className="rounded-xl border border-bad/20 bg-bad-bg p-3 text-sm text-bad"><div className="font-semibold">Active trip: {contactTrip.id}</div><div className="mt-1">{contactTrip.rider} is currently travelling with {contactTrip.driver}.</div></div><div className="rounded-xl border border-black/5 bg-slate-50 p-4"><div className="text-xs uppercase tracking-[0.16em] text-slate2">Emergency contact</div><div className="mt-2 text-lg font-semibold">{contact.name}</div><div className="text-sm text-slate2">{contact.relationship}</div><a className="mt-3 inline-flex items-center gap-2 font-medium text-accent" href={`tel:${contact.phone}`}><Phone size={14} /> {contact.phone}</a></div></div> : <EmptyState title="No emergency contact recorded" hint="The user's profile does not contain an emergency contact." /> })()}
      </Modal>

      <Modal open={!!incidentTrip} onClose={() => setIncidentTrip(null)} title="Record incident outcome">
        <label className="text-xs text-slate2">Trip</label><div className="mt-1 rounded-xl bg-slate-50 px-3 py-2 text-sm">{incidentTrip?.id} · {incidentTrip?.rider} with {incidentTrip?.driver}</div>
        <label className="mt-4 block text-xs text-slate2">Outcome</label><select value={incidentOutcome} onChange={(event) => setIncidentOutcome(event.target.value)} className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"><option>Resolved - no further action</option><option>Driver contacted</option><option>Rider contacted</option><option>Escalated to emergency services</option><option>Requires follow-up</option></select>
        <label className="mt-4 block text-xs text-slate2">Notes</label><textarea value={incidentNotes} onChange={(event) => setIncidentNotes(event.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm" placeholder="Record what happened and what was done..." />
        <div className="mt-4 flex justify-end gap-2"><Button variant="ghost" onClick={() => setIncidentTrip(null)}>Cancel</Button><Button variant="accent" onClick={() => { recordIncident({ tripId: incidentTrip.id, outcome: incidentOutcome, notes: incidentNotes }); setIncidentNotes(''); setIncidentTrip(null) }}>Save outcome</Button></div>
      </Modal>
    </div>
  )
}

function SummaryKPI({ label, value, tone, icon: Icon }) {
  const tones = {
    urgent: 'border-bad/15 bg-bad-bg text-bad',
    warn: 'border-amber/20 bg-amber-bg text-amber-700',
    amber: 'border-amber/20 bg-amber-bg text-amber-700',
    bad: 'border-bad/15 bg-bad-bg text-bad',
  }
  return (
    <Card className={`p-4 ${tones[tone]}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em]">{label}</div>
          <div className="mt-2 font-display text-3xl font-semibold tracking-tight">{value}</div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 ring-1 ring-black/5">
          <Icon size={18} />
        </div>
      </div>
    </Card>
  )
}
