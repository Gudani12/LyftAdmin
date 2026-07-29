import React, { useState } from 'react'
import { Car, ShieldAlert } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { DOC_TYPES } from '../data/mockData.js'
import { Rail, StatusBadge, Button, Modal, SectionHeader, Planned } from '../components/ui.jsx'

const DRIVER_DOC_KEYS = ['drivers_licence', 'pdp', 'vehicle_registration', 'roadworthy', 'insurance']

export default function Drivers() {
  const { drivers, setDriverLive } = useData()
  const [active, setActive] = useState(null)

  return (
    <div>
      <SectionHeader title="Drivers" subtitle="Document status, vehicles, and go-live approval." />

      <div className="space-y-2">
        {drivers.map((d) => {
          const allApproved = DRIVER_DOC_KEYS.every((k) => d.documents[k] === 'approved')
          const hasExpired = DRIVER_DOC_KEYS.some((k) => d.documents[k] === 'expired')
          const tone = hasExpired ? 'urgent' : d.liveApproved ? 'ok' : allApproved ? 'info' : 'warn'
          return (
            <Rail key={d.id} tone={tone}>
              <div className="flex items-center gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{d.name}</span>
                    {d.backgroundCheck !== 'clear' && (
                      <span title="Background check pending"><ShieldAlert size={13} className="text-amber" /></span>
                    )}
                  </div>
                  <div className="text-xs text-slate2 mt-0.5 flex items-center gap-1.5">
                    <Car size={12} />
                    {d.vehicles.map((v) => `${v.make} ${v.model} (${v.plate})`).join(' + ')}
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-1">
                  {DRIVER_DOC_KEYS.map((k) => (
                    <span key={k} title={DOC_TYPES.find((t) => t.key === k)?.label} className={`h-2 w-2 rounded-full ${
                      d.documents[k] === 'approved' ? 'bg-good' : d.documents[k] === 'pending' ? 'bg-amber' : d.documents[k] === 'expired' ? 'bg-bad' : 'bg-slate2/40'
                    }`} />
                  ))}
                </div>
                <StatusBadge status={d.status} />
                <Button variant="ghost" onClick={() => setActive(d)}>Details</Button>
              </div>
            </Rail>
          )
        })}
      </div>

      <div className="mt-6">
        <Planned items={[
          'Document expiry auto-suspend (currently manual — expired insurance above shows a suspended example)',
          'Background check integration status webhook',
        ]} />
      </div>

      <DriverModal driver={active} onClose={() => setActive(null)} onSetLive={setDriverLive} />
    </div>
  )
}

function DriverModal({ driver: d, onClose, onSetLive }) {
  if (!d) return null
  return (
    <Modal open={!!d} onClose={onClose} title={d.name} wide>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate2 mb-2">Documents</p>
          <div className="rounded-lg border border-black/5 divide-y divide-black/5 bg-white">
            {DRIVER_DOC_KEYS.map((k) => (
              <div key={k} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>{DOC_TYPES.find((t) => t.key === k)?.label}</span>
                <StatusBadge status={d.documents[k]} />
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-slate2">Background check</span>
            <StatusBadge status={d.backgroundCheck} />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate2 mb-2">Vehicles ({d.vehicles.length})</p>
          <div className="space-y-2">
            {d.vehicles.map((v) => (
              <div key={v.id} className="rounded-lg border border-black/5 bg-white p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{v.make} {v.model} ({v.year})</span>
                  {v.primary && <span className="text-[10px] uppercase tracking-wide text-accent-700 bg-accent-50 rounded px-1.5 py-0.5">Primary</span>}
                </div>
                <div className="text-xs text-slate2 mt-1 grid grid-cols-3 gap-1">
                  <span>Colour: {v.colour}</span>
                  <span className="font-mono">{v.plate}</span>
                  <span>{v.seats} seats</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-black/5 pt-4 flex justify-end gap-2">
        {d.liveApproved ? (
          <Button variant="bad" onClick={() => { onSetLive(d.id, false); onClose() }}>Revoke access</Button>
        ) : (
          <Button variant="good" onClick={() => { onSetLive(d.id, true); onClose() }}>Approve to go live</Button>
        )}
      </div>
    </Modal>
  )
}
