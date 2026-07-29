import React, { useMemo, useState } from 'react'
import { Navigation, Square } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { Rail, StatusBadge, Button, Modal, SectionHeader, EmptyState, Planned, fmtDate } from '../components/ui.jsx'

export default function Trips() {
  const { trips, forceEndTrip } = useData()
  const [statusFilter, setStatusFilter] = useState('in_progress')
  const [active, setActive] = useState(null)

  const filtered = useMemo(() => {
    const list = statusFilter === 'all' ? trips : trips.filter((t) => t.status === statusFilter)
    return [...list].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
  }, [trips, statusFilter])

  return (
    <div>
      <SectionHeader title="Trips" subtitle="Live trips and trip history." />

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
        <div className="space-y-2">
          {filtered.map((t) => {
            const tone = t.status === 'in_progress' ? 'info' : t.status === 'cancelled' ? 'neutral' : 'ok'
            return (
              <Rail key={t.id} tone={tone}>
                <div className="flex items-center gap-4 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate2">{t.id}</span>
                      {t.status === 'in_progress' && <Navigation size={12} className="text-info" />}
                    </div>
                    <div className="text-sm mt-0.5">{t.rider} <span className="text-slate2">with</span> {t.driver}</div>
                    <div className="text-xs text-slate2 mt-0.5">{t.pickup} → {t.dropoff}</div>
                  </div>
                  {t.fare && <div className="text-sm font-mono">R{t.fare.total}</div>}
                  <StatusBadge status={t.status} />
                  <Button variant="ghost" onClick={() => setActive(t)}>Detail</Button>
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
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate2 mb-2">Route</p>
          <div className="aspect-video rounded-lg border border-black/5 bg-deep-800 text-white flex flex-col items-center justify-center text-xs gap-2">
            <Navigation size={22} className="text-accent" />
            <span>{t.pickup}</span>
            <span className="text-white/40">↓</span>
            <span>{t.dropoff}</span>
          </div>
          {t.status === 'cancelled' && (
            <div className="mt-3 text-sm">
              <p className="text-slate2 text-xs uppercase tracking-wide font-semibold mb-1">Cancellation</p>
              <p>Cancelled by <span className="capitalize font-medium">{t.cancelledBy}</span> — {t.cancelReason}</p>
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate2 mb-2">Details</p>
          <div className="rounded-lg border border-black/5 divide-y divide-black/5 bg-white text-sm">
            <Row label="Rider" value={t.rider} />
            <Row label="Driver" value={t.driver} />
            <Row label="Started" value={fmtDate(t.startedAt)} />
            <Row label="Ended" value={t.endedAt ? fmtDate(t.endedAt) : '—'} />
          </div>
          {t.fare && (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate2 mb-1">Fare breakdown</p>
              <div className="rounded-lg border border-black/5 divide-y divide-black/5 bg-white text-sm">
                <Row label="Base fare" value={`R${t.fare.base}`} />
                <Row label="Distance" value={`R${t.fare.distance}`} />
                <Row label="Time" value={`R${t.fare.time}`} />
                <Row label="Surge" value={`R${t.fare.surge}`} />
                <Row label="Total" value={<span className="font-semibold">R{t.fare.total}</span>} />
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
    <div className="flex justify-between px-3 py-2">
      <span className="text-slate2">{label}</span>
      <span>{value}</span>
    </div>
  )
}
