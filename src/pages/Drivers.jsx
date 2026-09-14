import React, { useMemo, useState } from 'react'
import { Car, Search, ShieldAlert, CheckCircle2, AlertTriangle, BadgeCheck, CircleDashed, Webhook } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { DOC_TYPES } from '../data/mockData.js'
import { Rail, StatusBadge, Button, Modal, SectionHeader, Card } from '../components/ui.jsx'

const DRIVER_DOC_KEYS = ['drivers_licence', 'pdp', 'vehicle_registration', 'roadworthy', 'insurance']

export default function Drivers() {
  const { drivers, currentAdmin, driversLoading, driversError, setDriverLive, archiveDriver, restoreDriver, deleteDriver } = useData()
  const [active, setActive] = useState(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const summary = useMemo(() => {
    if (!drivers.length) return { live: 0, pending: 0, expired: 0, risk: 0 }
    return {
      live: drivers.filter((d) => d.liveApproved).length,
      pending: drivers.filter((d) => !d.liveApproved && DRIVER_DOC_KEYS.every((k) => d.documents[k] === 'approved')).length,
      expired: drivers.filter((d) => DRIVER_DOC_KEYS.some((k) => d.documents[k] === 'expired')).length,
      risk: drivers.filter((d) => d.backgroundCheck !== 'clear').length,
    }
  }, [drivers])

  const filteredDrivers = useMemo(() => {
    const q = query.trim().toLowerCase()
    return drivers.filter((d) => (
      (statusFilter === 'all' || d.status === statusFilter) &&
      (!q || d.name.toLowerCase().includes(q) || d.email?.toLowerCase().includes(q) || d.phone?.includes(q) || d.vehicles.some((v) => v.plate?.toLowerCase().includes(q)))
    ))
  }, [drivers, query, statusFilter])

  return (
    <div className="space-y-6">
      <SectionHeader title="Drivers" subtitle="Document status, vehicles, and go-live approval." />

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Live" value={summary.live} tone="good" icon={BadgeCheck} />
        <SummaryCard label="Pending" value={summary.pending} tone="amber" icon={CircleDashed} />
        <SummaryCard label="Expired" value={summary.expired} tone="bad" icon={AlertTriangle} />
        <SummaryCard label="Risk checks" value={summary.risk} tone="info" icon={ShieldAlert} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="border-amber/20 bg-amber-bg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 text-amber-700" size={18} />
            <div><div className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Automatic document protection</div><p className="mt-1 text-sm text-amber-700">Expired document dates are detected when drivers load and automatically remove go-live access.</p></div>
          </div>
        </Card>
        <Card className="border-info/20 bg-info-bg p-4">
          <div className="flex items-start gap-3">
            <Webhook className="mt-0.5 text-info" size={18} />
            <div><div className="text-xs font-semibold uppercase tracking-[0.16em] text-info">Background check webhook</div><p className="mt-1 text-sm text-info">Status is read from Supabase fields updated by the screening provider.</p></div>
          </div>
        </Card>
      </div>

      {!driversLoading && !driversError && drivers.length > 0 && (
        <div className="grid gap-3 rounded-2xl border border-black/5 bg-white p-3 shadow-[0_10px_24px_rgba(15,23,42,0.03)] md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate2" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search driver, email, phone, or plate..." className="w-full rounded-xl border border-black/10 bg-slate-50 pl-9 pr-3 py-2.5 text-sm outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-black/10 bg-slate-50 px-3 py-2.5 text-sm capitalize outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/10">
            <option value="all">All statuses</option>
            <option value="live">Live</option>
            <option value="pending">Pending</option>
            <option value="pending_review">Pending review</option>
            <option value="archived">Archived</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>
      )}

      {driversLoading ? (
        <div className="rounded-2xl border border-black/5 bg-white px-6 py-8 text-center text-sm text-slate2 shadow-[0_10px_24px_rgba(15,23,42,0.03)]">
          Loading drivers from the database...
        </div>
      ) : driversError ? (
        <div className="rounded-2xl border border-bad/20 bg-bad-bg px-6 py-8 text-center text-sm text-bad">
          Error loading drivers: {driversError.message || JSON.stringify(driversError)}
        </div>
      ) : drivers.length === 0 ? (
        <div className="rounded-2xl border border-black/5 bg-white px-6 py-8 text-center text-sm text-slate2 shadow-[0_10px_24px_rgba(15,23,42,0.03)]">
          No drivers found in the database. Confirm the Supabase `drivers` table exists and you have active rows.
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-white px-6 py-10 text-center text-sm text-slate2">
          No drivers match the current search and status filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDrivers.map((d) => {
            const allApproved = DRIVER_DOC_KEYS.every((k) => d.documents[k] === 'approved')
            const hasExpired = DRIVER_DOC_KEYS.some((k) => d.documents[k] === 'expired')
            const tone = hasExpired ? 'urgent' : d.liveApproved ? 'ok' : allApproved ? 'info' : 'warn'
            return (
              <Rail key={d.id} tone={tone}>
                <div className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent-100 to-emerald-100 text-xs font-bold text-accent-700">
                        {d.name.split(' ').map((s) => s[0]).join('').slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-ink">{d.name}</span>
                          {d.backgroundCheck !== 'clear' && (
                            <span title="Background check pending"><ShieldAlert size={13} className="text-amber" /></span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate2">
                          <Car size={12} />
                          <span className="truncate">{d.vehicles.map((v) => `${v.make} ${v.model} (${v.plate})`).join(' + ')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="hidden items-center gap-1 md:flex">
                    {DRIVER_DOC_KEYS.map((k) => (
                      <span key={k} title={DOC_TYPES.find((t) => t.key === k)?.label} className={`h-2.5 w-2.5 rounded-full ${
                        d.documents[k] === 'approved' ? 'bg-good' : d.documents[k] === 'pending' ? 'bg-amber' : d.documents[k] === 'expired' ? 'bg-bad' : 'bg-slate2/40'
                      }`} />
                    ))}
                  </div>

                  <div className="flex items-center gap-3 md:justify-end">
                    <StatusBadge status={d.status} />
                    <Button variant="ghost" onClick={() => setActive(d)}>Details</Button>
                    <Button variant="accent" className="!px-2 !py-1 text-xs" onClick={() => {
                      const reason = window.prompt(`Archive ${d.name}? Add the reason for archiving this driver account.`, 'Policy violation / inactive account')
                      if (reason && reason.trim()) {
                        archiveDriver(d.id, reason.trim())
                      }
                    }}>Archive</Button>
                    {currentAdmin?.role === 'super_admin' && (
                      <Button variant="bad" className="!px-2 !py-1 text-xs" onClick={() => {
                        const reason = window.prompt(`Delete ${d.name} permanently? Add a reason before permanent deletion.`, 'Fraudulent driver profile')
                        if (reason && reason.trim()) {
                          if (window.confirm(`This will permanently remove ${d.name}. Continue?`)) deleteDriver(d.id)
                        }
                      }}>Delete</Button>
                    )}
                  </div>
                </div>
              </Rail>
            )
          })}
        </div>
      )}

      <DriverModal driver={active} onClose={() => setActive(null)} onSetLive={setDriverLive} onRestore={restoreDriver} />
    </div>
  )
}

function DriverModal({ driver: d, onClose, onSetLive, onRestore }) {
  if (!d) return null
  return (
    <Modal open={!!d} onClose={onClose} title={d.name} wide>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate2">Documents</p>
          <div className="divide-y divide-black/5 rounded-2xl border border-black/5 bg-white">
            {DRIVER_DOC_KEYS.map((k) => (
              <div key={k} className="flex items-center justify-between px-3 py-2.5 text-sm">
                <span>{DOC_TYPES.find((t) => t.key === k)?.label}</span>
                <StatusBadge status={d.documents[k]} />
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-black/5 bg-slate-50 px-3 py-2.5 text-sm">
            <span className="text-slate2">Background check</span>
            <StatusBadge status={d.backgroundCheck} />
          </div>
          <div className="mt-2 text-xs text-slate2">{d.backgroundCheckProvider ? `Provider: ${d.backgroundCheckProvider}` : 'Provider webhook awaiting configuration'}{d.backgroundCheckUpdatedAt ? ` · Updated ${new Date(d.backgroundCheckUpdatedAt).toLocaleString()}` : ''}</div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate2">Vehicles ({d.vehicles.length})</p>
          <div className="space-y-2">
            {d.vehicles.map((v) => (
              <div key={v.id} className="rounded-2xl border border-black/5 bg-white p-3 text-sm shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-ink">{v.make} {v.model} ({v.year})</span>
                  {v.primary && <span className="rounded px-1.5 py-0.5 bg-accent-50 text-[10px] font-semibold uppercase tracking-wide text-accent-700">Primary</span>}
                </div>
                <div className="mt-2 grid gap-1 text-xs text-slate2 sm:grid-cols-3">
                  <span>Colour: {v.colour}</span>
                  <span className="font-mono">{v.plate}</span>
                  <span>{v.seats} seats</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2 border-t border-black/5 pt-4">
        {d.status === 'archived' ? (
          <Button variant="good" onClick={() => { onRestore(d.id); onClose() }}>Restore driver</Button>
        ) : d.liveApproved ? (
          <Button variant="bad" onClick={() => { onSetLive(d.id, false); onClose() }}>Revoke access</Button>
        ) : (
          <Button variant="good" onClick={() => { onSetLive(d.id, true); onClose() }}>Approve to go live</Button>
        )}
      </div>
    </Modal>
  )
}

function SummaryCard({ label, value, tone, icon: Icon }) {
  const tones = {
    good: 'border-good/15 bg-good-bg text-good',
    amber: 'border-amber/20 bg-amber-bg text-amber-700',
    bad: 'border-bad/15 bg-bad-bg text-bad',
    info: 'border-info/20 bg-info-bg text-info',
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
