import React, { useMemo, useState } from 'react'
import { RefreshCw, Undo2 } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { Rail, StatusBadge, Button, SectionHeader, EmptyState, Planned, Modal } from '../components/ui.jsx'

const COMMISSION_RATE = 0.20

export default function Payments() {
  const { payouts, failedPayments, trips, retryFailedPayment, refundTrip, logAudit } = useData()
  const [refunded, setRefunded] = useState([])
  const [adjusting, setAdjusting] = useState(false)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustNote, setAdjustNote] = useState('')
  const [adjustDriver, setAdjustDriver] = useState('')

  const completedTrips = trips.filter((t) => t.status === 'completed' && t.fare)
  const totalRevenue = completedTrips.reduce((sum, t) => sum + t.fare.total, 0)
  const totalCommission = Math.round(totalRevenue * COMMISSION_RATE)

  const doRefund = (tripId) => {
    refundTrip(tripId)
    setRefunded((r) => [...r, tripId])
  }

  return (
    <div>
      <SectionHeader title="Payments" subtitle="Payouts, failed charges, refunds, and commission." />

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-lg border border-black/5 bg-white p-4">
          <div className="text-xs text-slate2">Total trip revenue</div>
          <div className="font-display text-2xl font-semibold mt-1">R{totalRevenue.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border border-black/5 bg-white p-4">
          <div className="text-xs text-slate2">Commission ({(COMMISSION_RATE * 100).toFixed(0)}%)</div>
          <div className="font-display text-2xl font-semibold mt-1 text-accent-700">R{totalCommission.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border border-black/5 bg-white p-4">
          <div className="text-xs text-slate2">Completed trips</div>
          <div className="font-display text-2xl font-semibold mt-1">{completedTrips.length}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold">Driver payouts</h2>
            <Button variant="ghost" onClick={() => setAdjusting(true)}>Adjust balance</Button>
          </div>
          <div className="space-y-2">
            {payouts.map((p) => (
              <Rail key={p.id} tone={p.status === 'failed' ? 'urgent' : p.status === 'pending' ? 'warn' : 'ok'}>
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">{p.driver}</div>
                    <div className="text-xs text-slate2 mt-0.5">{p.period} &middot; {p.method}{p.failReason && ` — ${p.failReason}`}</div>
                  </div>
                  <div className="text-sm font-mono">R{p.amount.toLocaleString()}</div>
                  <StatusBadge status={p.status} />
                </div>
              </Rail>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-display font-semibold mb-3">Failed payments</h2>
          {failedPayments.length === 0 ? <EmptyState title="No failed payments" /> : (
            <div className="space-y-2">
              {failedPayments.map((f) => (
                <Rail key={f.id} tone="urgent">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div className="text-sm font-medium">{f.rider} &middot; trip {f.tripId}</div>
                      <div className="text-xs text-slate2 mt-0.5">R{f.amount} — {f.reason} &middot; {f.retries} retr{f.retries === 1 ? 'y' : 'ies'} so far</div>
                    </div>
                    <Button variant="ghost" onClick={() => retryFailedPayment(f.id)}><RefreshCw size={13} /> Retry</Button>
                  </div>
                </Rail>
              ))}
            </div>
          )}

          <h2 className="font-display font-semibold mb-3 mt-6">Refund a trip</h2>
          <div className="space-y-2">
            {completedTrips.slice(0, 4).map((t) => (
              <Rail key={t.id} tone="neutral">
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">{t.rider} &middot; trip {t.id}</div>
                    <div className="text-xs text-slate2 mt-0.5">R{t.fare.total}</div>
                  </div>
                  <Button variant={refunded.includes(t.id) ? 'ghost' : 'bad'} disabled={refunded.includes(t.id)} onClick={() => doRefund(t.id)}>
                    <Undo2 size={13} /> {refunded.includes(t.id) ? 'Refunded' : 'Refund'}
                  </Button>
                </div>
              </Rail>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Planned items={['Stripe dispute inbox', 'Payout schedule configuration', 'Promo codes and referral credit management']} />
      </div>

      <Modal open={adjusting} onClose={() => setAdjusting(false)} title="Adjust driver balance">
        <label className="text-xs text-slate2">Driver name</label>
        <input value={adjustDriver} onChange={(e) => setAdjustDriver(e.target.value)} className="mt-1 w-full rounded-md border border-black/10 px-2.5 py-1.5 text-sm" placeholder="e.g. Nomvula Khumalo" />
        <label className="text-xs text-slate2 mt-3 block">Amount (R, use - for a deduction)</label>
        <input value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} className="mt-1 w-full rounded-md border border-black/10 px-2.5 py-1.5 text-sm font-mono" placeholder="e.g. 150 or -75" />
        <label className="text-xs text-slate2 mt-3 block">Audit note (required)</label>
        <textarea value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)} rows={2} className="mt-1 w-full rounded-md border border-black/10 px-2.5 py-1.5 text-sm" placeholder="Reason for this manual adjustment..." />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setAdjusting(false)}>Cancel</Button>
          <Button
            variant="accent"
            disabled={!adjustDriver || !adjustAmount || !adjustNote}
            onClick={() => {
              logAudit('Manually adjusted driver balance', `${adjustDriver} — R${adjustAmount} — ${adjustNote}`)
              setAdjusting(false); setAdjustDriver(''); setAdjustAmount(''); setAdjustNote('')
            }}
          >
            Apply adjustment
          </Button>
        </div>
      </Modal>
    </div>
  )
}
