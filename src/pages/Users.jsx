import React, { useMemo, useState } from 'react'
import { Search, Trash2, UserRound, ShieldAlert, CheckCircle2, ArrowUpRight } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { Rail, StatusBadge, Button, Modal, SectionHeader, EmptyState, Star, Planned, Card } from '../components/ui.jsx'

export default function UsersPage() {
  const { users, setUserStatus, addUserNote, handleDeletionRequest, deleteUser } = useData()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
      u.idNumber.includes(q)
    )
  }, [users, query])

  const deletionRequests = users.filter((u) => u.deletionRequested)
  const summary = useMemo(() => {
    const active = users.filter((u) => u.status === 'active').length
    const suspended = users.filter((u) => u.status === 'suspended').length
    const riders = users.filter((u) => u.role === 'rider').length
    const drivers = users.filter((u) => u.role === 'driver').length
    return { active, suspended, riders, drivers }
  }, [users])

  return (
    <div className="space-y-6">
      <SectionHeader title="Users" subtitle="Search riders and drivers, manage account status." />

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Active" value={summary.active} tone="good" icon={CheckCircle2} />
        <SummaryCard label="Suspended" value={summary.suspended} tone="bad" icon={ShieldAlert} />
        <SummaryCard label="Riders" value={summary.riders} tone="info" icon={UserRound} />
        <SummaryCard label="Drivers" value={summary.drivers} tone="accent" icon={ArrowUpRight} />
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, phone, or ID number..."
          className="w-full rounded-2xl border border-black/5 bg-white pl-9 pr-3 py-2.5 text-sm shadow-[0_10px_24px_rgba(15,23,42,0.03)] outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10"
        />
      </div>

      {deletionRequests.length > 0 && (
        <Card className="border-amber/30 bg-amber-bg p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-700"><Trash2 size={14} /> {deletionRequests.length} pending account deletion request(s)</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {deletionRequests.map((u) => (
              <div key={u.id} className="flex items-center gap-2 rounded-xl border border-black/5 bg-white px-2.5 py-1.5 text-sm shadow-sm">
                <span>{u.name}</span>
                <Button variant="bad" className="!px-2 !py-1 text-xs" onClick={() => handleDeletionRequest(u.id, true)}>Delete</Button>
                <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => handleDeletionRequest(u.id, false)}>Decline</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {results.length === 0 ? (
        <EmptyState title="No matching users" hint="Try a different name, email, phone number, or ID number." />
      ) : (
        <div className="space-y-3">
          {results.map((u) => {
            const tone = u.status === 'suspended' ? 'urgent' : u.status === 'deleted' ? 'neutral' : u.paymentState !== 'ok' ? 'warn' : 'ok'
            return (
              <Rail key={u.id} tone={tone}>
                <div className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent-100 to-emerald-100 text-xs font-bold text-accent-700">
                        {u.name.split(' ').map((s) => s[0]).join('').slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium text-sm text-ink">{u.name}</span>
                          <span className="text-[11px] capitalize text-slate2">{u.role}</span>
                        </div>
                        <div className="mt-0.5 text-xs text-slate2">{u.email} &middot; {u.phone}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 md:justify-end">
                    <div className="hidden text-xs text-slate2 sm:block">{u.trips} trips</div>
                    <div className="hidden text-xs text-slate2 sm:block">{u.rating ? `★ ${u.rating}` : '—'}</div>
                    <StatusBadge status={u.status} />
                    <Button variant="ghost" onClick={() => setActive(u)}>Profile</Button>
                    <Button variant="bad" className="!px-2 !py-1 text-xs" onClick={() => {
                      if (window.confirm(`Delete user ${u.name}? This cannot be undone.`)) deleteUser(u.id)
                    }}>Delete</Button>
                  </div>
                </div>
              </Rail>
            )
          })}
        </div>
      )}

      <div className="mt-6">
        <Star /> <span className="ml-1 text-xs text-slate2">Ban by device/phone (cross-account) is planned:</span>
        <div className="mt-2">
          <Planned items={['Ban by device ID or phone number, blocking new signups tied to that identifier']} />
        </div>
      </div>

      <UserModal user={active} onClose={() => setActive(null)} onSetStatus={setUserStatus} onAddNote={addUserNote} />
    </div>
  )
}

function UserModal({ user: u, onClose, onSetStatus, onAddNote }) {
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [showSuspendForm, setShowSuspendForm] = useState(false)

  if (!u) return null

  const isSuspended = u.status === 'suspended'

  const submitStatusChange = () => {
    onSetStatus(u.id, isSuspended ? 'active' : 'suspended', reason || (isSuspended ? 'Reactivated by admin' : 'No reason given'))
    setReason('')
    setShowSuspendForm(false)
    onClose()
  }

  return (
    <Modal open={!!u} onClose={onClose} title={u.name} wide>
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <Stat label="Status" value={<StatusBadge status={u.status} />} />
        <Stat label="Trips" value={u.trips} />
        <Stat label="Rating" value={u.rating ? `★ ${u.rating}` : 'No rating yet'} />
        <Stat label="Payment state" value={<StatusBadge status={u.paymentState} />} />
        <Stat label="ID number" value={<span className="font-mono text-xs">{u.idNumber}</span>} />
        <Stat label="Role" value={<span className="capitalize">{u.role}</span>} />
      </div>

      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate2">Admin notes (internal only)</p>
      <div className="mb-2 max-h-32 space-y-1.5 overflow-y-auto rounded-2xl border border-black/5 bg-slate-50 p-3">
        {u.notes.length === 0 ? <p className="text-sm text-slate2">No notes yet.</p> : u.notes.map((n, i) => <p key={i} className="text-sm text-ink-700">{n}</p>)}
      </div>
      <div className="mb-5 flex gap-2">
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note..." className="flex-1 rounded-xl border border-black/10 px-2.5 py-1.5 text-sm outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10" />
        <Button variant="ghost" onClick={() => { if (note.trim()) { onAddNote(u.id, note.trim()); setNote('') } }}>Add</Button>
      </div>

      <div className="border-t border-black/5 pt-4">
        {!showSuspendForm ? (
          <div className="flex justify-end">
            {isSuspended ? (
              <Button variant="good" onClick={submitStatusChange}>Reactivate account</Button>
            ) : (
              <Button variant="bad" onClick={() => setShowSuspendForm(true)}>Suspend account</Button>
            )}
          </div>
        ) : (
          <div className="flex items-end gap-2 justify-end">
            <div className="flex-1">
              <label className="text-xs text-slate2">Reason for suspension</label>
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Repeated cancellations" className="mt-1 w-full rounded-xl border border-black/10 px-2.5 py-1.5 text-sm outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10" />
            </div>
            <Button variant="ghost" onClick={() => setShowSuspendForm(false)}>Cancel</Button>
            <Button variant="bad" onClick={submitStatusChange}>Confirm suspend</Button>
          </div>
        )}
        <p className="mt-2 text-right text-[11px] text-slate2">Action is timestamped and written to the audit log automatically.</p>
      </div>
    </Modal>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-slate-50 px-3 py-2.5">
      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate2">{label}</div>
      <div className="mt-1 text-sm font-semibold text-ink">{value}</div>
    </div>
  )
}

function SummaryCard({ label, value, tone, icon: Icon }) {
  const tones = {
    good: 'border-good/15 bg-good-bg text-good',
    bad: 'border-bad/15 bg-bad-bg text-bad',
    info: 'border-info/20 bg-info-bg text-info',
    accent: 'border-accent/15 bg-accent-50 text-accent-700',
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
