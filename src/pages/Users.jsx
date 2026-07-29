import React, { useMemo, useState } from 'react'
import { Search, Trash2 } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { Rail, StatusBadge, Button, Modal, SectionHeader, EmptyState, Star, Planned, fmtDate } from '../components/ui.jsx'

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

  return (
    <div>
      <SectionHeader title="Users" subtitle="Search riders and drivers, manage account status." />

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, phone, or ID number..."
          className="w-full rounded-lg border border-black/10 bg-white pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </div>

      {deletionRequests.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber/30 bg-amber-bg px-4 py-3">
          <p className="text-sm font-semibold text-amber-700 flex items-center gap-1.5"><Trash2 size={14} /> {deletionRequests.length} pending account deletion request(s)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {deletionRequests.map((u) => (
              <div key={u.id} className="flex items-center gap-2 rounded-md bg-white px-2.5 py-1.5 text-sm border border-black/5">
                <span>{u.name}</span>
                <Button variant="bad" className="!px-2 !py-1 text-xs" onClick={() => handleDeletionRequest(u.id, true)}>Delete</Button>
                <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => handleDeletionRequest(u.id, false)}>Decline</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.length === 0 ? (
        <EmptyState title="No matching users" hint="Try a different name, email, phone number, or ID number." />
      ) : (
        <div className="space-y-2">
          {results.map((u) => {
            const tone = u.status === 'suspended' ? 'urgent' : u.status === 'deleted' ? 'neutral' : u.paymentState !== 'ok' ? 'warn' : 'ok'
            return (
              <Rail key={u.id} tone={tone}>
                <div className="flex items-center gap-4 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{u.name}</span>
                      <span className="text-[11px] text-slate2 capitalize">{u.role}</span>
                    </div>
                    <div className="text-xs text-slate2 mt-0.5">{u.email} &middot; {u.phone}</div>
                  </div>
                  <div className="text-xs text-slate2 hidden sm:block w-24">{u.trips} trips</div>
                  <div className="text-xs text-slate2 hidden sm:block w-16">{u.rating ? `★ ${u.rating}` : '—'}</div>
                  <StatusBadge status={u.status} />
                  <Button variant="ghost" onClick={() => setActive(u)}>Profile</Button>
                  <Button variant="bad" className="!px-2 !py-1 text-xs" onClick={() => {
                    if (window.confirm(`Delete user ${u.name}? This cannot be undone.`)) deleteUser(u.id)
                  }}>Delete</Button>
                </div>
              </Rail>
            )
          })}
        </div>
      )}

      <div className="mt-6">
        <Star /> <span className="text-xs text-slate2 ml-1">Ban by device/phone (cross-account) is planned:</span>
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
      <div className="grid grid-cols-3 gap-4 mb-5">
        <Stat label="Status" value={<StatusBadge status={u.status} />} />
        <Stat label="Trips" value={u.trips} />
        <Stat label="Rating" value={u.rating ? `★ ${u.rating}` : 'No rating yet'} />
        <Stat label="Payment state" value={<StatusBadge status={u.paymentState} />} />
        <Stat label="ID number" value={<span className="font-mono text-xs">{u.idNumber}</span>} />
        <Stat label="Role" value={<span className="capitalize">{u.role}</span>} />
      </div>

      <p className="text-xs font-semibold uppercase tracking-wide text-slate2 mb-2">Admin notes (internal only)</p>
      <div className="rounded-lg border border-black/5 bg-white p-3 space-y-1.5 mb-2 max-h-32 overflow-y-auto">
        {u.notes.length === 0 ? <p className="text-sm text-slate2">No notes yet.</p> : u.notes.map((n, i) => <p key={i} className="text-sm text-ink-700">{n}</p>)}
      </div>
      <div className="flex gap-2 mb-5">
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note..." className="flex-1 rounded-md border border-black/10 px-2.5 py-1.5 text-sm" />
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
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Repeated cancellations" className="mt-1 w-full rounded-md border border-black/10 px-2.5 py-1.5 text-sm" />
            </div>
            <Button variant="ghost" onClick={() => setShowSuspendForm(false)}>Cancel</Button>
            <Button variant="bad" onClick={submitStatusChange}>Confirm suspend</Button>
          </div>
        )}
        <p className="text-[11px] text-slate2 mt-2 text-right">Action is timestamped and written to the audit log automatically.</p>
      </div>
    </Modal>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-black/5 bg-white px-3 py-2">
      <div className="text-[11px] text-slate2">{label}</div>
      <div className="text-sm font-medium mt-0.5">{value}</div>
    </div>
  )
}
