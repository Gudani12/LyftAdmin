import React, { useMemo, useState } from 'react'
import { Navigation, Square, TrendingUp, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { Rail, StatusBadge, Button, Modal, SectionHeader, EmptyState, Planned, fmtDate, Card } from '../components/ui.jsx'

export default function Trips() {
  const { trips, forceEndTrip } = useData()
  const [statusFilter, setStatusFilter] = useState('in_progress')
  const [active, setActive] = useState(null)

  const summary = useMemo(() => {
    return {
      inProgress: trips.filter((t) => t.status === 'in_progress').length,
      completed: trips.filter((t) => t.status === 'completed').length,
      cancelled: trips.filter((t) => t.status === 'cancelled').length,
      total: trips.length,
      avgFare: trips.filter((t) => t.fare).reduce((sum, t) => sum + t.fare.total, 0) / Math.max(trips.filter((t) => t.fare).length, 1),
    }
  }, [trips])

  const filtered = useMemo(() => {
    const list = statusFilter === 'all' ? trips : trips.filter((t) => t.status === statusFilter)
    return [...list].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
  }, [trips, statusFilter])

  return (
    <div className="space-y-6">
      <SectionHeader title="Trips" subtitle="Live trips and trip history." />

      <div className="grid gap-4 md:grid-cols-5">
        <KPICard label="In progress" value={summary.inProgress} tone="info" icon={Navigation} />
        <KPICard label="Completed" value={summary.completed} tone="good" icon={CheckCircle2} />
        <KPICard label="Cancelled" value={summary.cancelled} tone="bad" icon={XCircle} />
        <KPICard label="Total trips" value={summary.total} tone="neutral" icon={TrendingUp} />
        <KPICard label="Avg fare" value={`R${Math.round(summary.avgFare)}`} tone="accent" icon={Clock} />
      </div>

      <div className="flex items-center gap-1.5 mb-4">
        {['in_progress', 'completed', 'cancelled', 'all'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize border transition ${statusFilter === s ? 'bg-deep text-white border-deep' : 'border-black/10 text-ink-700 hover:bg-black/5'}`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No trips in this view" />
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => {
            const tone = t.status === 'in_progress' ? 'info' : t.status === 'cancelled' ? 'neutral' : 'ok'
            return (
              <Rail key={t.id} tone={tone}>
                <div className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate2">{t.id}</span>
                      {t.status === 'in_progress' && <span className="inline-flex h-2 w-2 rounded-full bg-info pulse-ring"></span>}
                    </div>
                    <div className="text-sm font-medium mt-1">{t.rider} <span className="text-slate2 font-normal">→</span> {t.driver}</div>
                    <div className="text-xs text-slate2 mt-1">{t.pickup} {t.dropoff ? ` → ${t.dropoff}` : ''}</div>
                  </div>
                  {t.fare && <div className="text-sm font-mono font-semibold text-accent-700">R{t.fare.total}</div>}
                  <StatusBadge status={t.status} />
                  <Button variant="ghost" onClick={() => setActive(t)}>Details</Button>
                </div>
              </Rail>
            )
          })}
        </div>
      )}

      <div className="mt-6">
        <Planned items={['Route replay from stored GPS pings (live map above uses start/end coordinates only)']} />
      </div>

      <TripModal trip={active} onClose={() => setActive(null)} onForceEnd={forceEndTrip} />
    </div>
  )
}

function TripModal({ trip: t, onClose, onForceEnd }) {
  if (!t) return null
  return (
    <Modal open={!!t} onClose={onClose} title={`Trip ${t.id}`} wide>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate2 mb-2">Route</p>
          <div className="aspect-video rounded-2xl border border-black/5 bg-gradient-to-br from-deep-800 to-deep-900 text-white flex flex-col items-center justify-center text-xs gap-3 shadow-lg">
            <Navigation size={24} className="text-accent" />
            <div className="text-center">
              <span className="block font-medium">{t.pickup}</span>
              <span className="text-white/40 text-xs">↓</span>
              <span className="block font-medium">{t.dropoff}</span>
            </div>
          </div>
          {t.status === 'cancelled' && (
            <div className="mt-3 text-sm">
              <p className="text-slate2 text-xs uppercase tracking-wide font-semibold mb-1">Cancellation</p>
              <p>Cancelled by <span className="capitalize font-medium">{t.cancelledBy}</span> — {t.cancelReason}</p>
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate2 mb-2">Details</p>
          <div className="rounded-2xl border border-black/5 divide-y divide-black/5 bg-white text-sm shadow-sm">
            <Row label="Rider" value={t.rider} />
            <Row label="Driver" value={t.driver} />
            <Row label="Started" value={fmtDate(t.startedAt)} />
            <Row label="Ended" value={t.endedAt ? fmtDate(t.endedAt) : '—'} />
          </div>
          {t.fare && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate2 mb-2">Fare breakdown</p>
              <div className="rounded-2xl border border-black/5 divide-y divide-black/5 bg-white text-sm shadow-sm">
                <Row label="Base fare" value={`R${t.fare.base}`} />
                <Row label="Distance" value={`R${t.fare.distance}`} />
                <Row label="Time" value={`R${t.fare.time}`} />
                <Row label="Surge" value={`R${t.fare.surge}`} />
                <Row label="Total" value={<span className="font-semibold text-lg">R{t.fare.total}</span>} />
              </div>
            </div>
          )}
        </div>
      </div>
      {t.status === 'in_progress' && (
        <div className="mt-5 border-t border-black/5 pt-4 flex justify-end">
          <Button variant="bad" onClick={() => { onForceEnd(t.id); onClose() }}><Square size={13} /> Force-end trip</Button>
        </div>
      )}
    </Modal>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between px-4 py-2.5">
      <span className="text-slate2">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function KPICard({ label, value, tone, icon: Icon }) {
  const tones = {
    good: 'border-good/15 bg-good-bg text-good',
    info: 'border-info/20 bg-info-bg text-info',
    bad: 'border-bad/15 bg-bad-bg text-bad',
    accent: 'border-accent/20 bg-accent-50 text-accent-700',
    neutral: 'border-black/5 bg-slate-50 text-slate2',
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
