import React, { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Plus, RefreshCw, ShieldAlert, Undo2, TrendingUp, DollarSign, ToggleLeft, ToggleRight } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { Rail, StatusBadge, Button, SectionHeader, EmptyState, Modal, Card } from '../components/ui.jsx'

const COMMISSION_RATE = 0.20

export default function Payments() {
  const { payouts, failedPayments, trips, retryFailedPayment, refundTrip, logAudit } = useData()
  const [refunded, setRefunded] = useState([])
  const [adjusting, setAdjusting] = useState(false)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustNote, setAdjustNote] = useState('')
  const [adjustDriver, setAdjustDriver] = useState('')
  const [disputes, setDisputes] = useState([
    { id: 'dp_1001', tripId: 'trp_5490', rider: 'Zanele Mahlangu', amount: 85, reason: 'Ride not as described', status: 'open', createdAt: '2026-09-12T08:30:00.000Z' },
  ])
  const [schedule, setSchedule] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lyft_payout_schedule') || 'null') || { frequency: 'weekly', day: 'monday', minimum: '100' } } catch { return { frequency: 'weekly', day: 'monday', minimum: '100' } }
  })
  const [promos, setPromos] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lyft_promo_codes') || '[]') } catch { return [] }
  })
  const [showPromo, setShowPromo] = useState(false)
  const [promoForm, setPromoForm] = useState({ code: '', amount: '', limit: '' })

  const saveSchedule = (next) => {
    setSchedule(next)
    localStorage.setItem('lyft_payout_schedule', JSON.stringify(next))
    logAudit('Updated payout schedule', `${next.frequency} on ${next.day}, minimum R${next.minimum}`)
  }

  const updateDispute = (id, status) => {
    setDisputes((list) => list.map((dispute) => dispute.id === id ? { ...dispute, status } : dispute))
    logAudit('Updated payment dispute', `${id} — ${status}`)
  }

  const createPromo = () => {
    if (!promoForm.code.trim() || !promoForm.amount) return
    const promo = { id: `promo_${Date.now()}`, code: promoForm.code.trim().toUpperCase(), credit: Number(promoForm.amount), limit: Number(promoForm.limit) || null, active: true }
    const next = [promo, ...promos]
    setPromos(next)
    localStorage.setItem('lyft_promo_codes', JSON.stringify(next))
    logAudit('Created promo code', `${promo.code} — R${promo.credit} referral credit`)
    setPromoForm({ code: '', amount: '', limit: '' })
    setShowPromo(false)
  }

  const completedTrips = trips.filter((t) => t.status === 'completed' && t.fare)
  const totalRevenue = completedTrips.reduce((sum, t) => sum + t.fare.total, 0)
  const totalCommission = Math.round(totalRevenue * COMMISSION_RATE)

  const doRefund = (tripId) => {
    refundTrip(tripId)
    setRefunded((r) => [...r, tripId])
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Payments" subtitle="Payouts, failed charges, refunds, and commission." />

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5 border-good/15 bg-good-bg text-good">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em]">Total revenue</div>
              <div className="font-display text-2xl font-semibold mt-2">R{totalRevenue.toLocaleString()}</div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 ring-1 ring-black/5">
              <TrendingUp size={18} />
            </div>
          </div>
        </Card>
        <Card className="p-5 border-accent/20 bg-accent-50 text-accent-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em]">Commission ({(COMMISSION_RATE * 100).toFixed(0)}%)</div>
              <div className="font-display text-2xl font-semibold mt-2">R{totalCommission.toLocaleString()}</div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 ring-1 ring-black/5">
              <DollarSign size={18} />
            </div>
          </div>
        </Card>
        <Card className="p-5 border-info/20 bg-info-bg text-info">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em]">Completed trips</div>
              <div className="font-display text-2xl font-semibold mt-2">{completedTrips.length}</div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 ring-1 ring-black/5">
              <TrendingUp size={18} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold">Driver payouts</h2>
            <Button variant="ghost" onClick={() => setAdjusting(true)}>Adjust balance</Button>
          </div>
          <div className="space-y-3">
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
            <div className="space-y-3">
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
          <div className="space-y-3">
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

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-1">
          <div className="mb-4 flex items-center gap-2"><ShieldAlert size={17} className="text-bad" /><h2 className="font-display font-semibold">Dispute inbox</h2></div>
          <p className="mb-3 text-xs text-slate2">Stripe disputes are simulated until Stripe webhooks are connected.</p>
          {disputes.length === 0 ? <EmptyState title="No disputes" /> : <div className="space-y-2">{disputes.map((dispute) => <div key={dispute.id} className="rounded-xl border border-black/5 bg-slate-50 p-3"><div className="flex items-start justify-between gap-2"><div><div className="text-sm font-medium">{dispute.rider}</div><div className="text-xs text-slate2">{dispute.id} · trip {dispute.tripId}</div></div><StatusBadge status={dispute.status} /></div><div className="mt-2 text-sm">R{dispute.amount} · {dispute.reason}</div><div className="mt-2 flex gap-1.5">{dispute.status === 'open' && <><Button variant="good" className="!px-2 !py-1 text-xs" onClick={() => updateDispute(dispute.id, 'accepted')}><CheckCircle2 size={12} /> Accept</Button><Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => updateDispute(dispute.id, 'challenged')}><AlertTriangle size={12} /> Challenge</Button></>}</div></div>)}</div>}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2"><RefreshCw size={17} className="text-accent" /><h2 className="font-display font-semibold">Payout schedule</h2></div>
          <label className="text-xs text-slate2">Frequency<select value={schedule.frequency} onChange={(event) => saveSchedule({ ...schedule, frequency: event.target.value })} className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="biweekly">Every two weeks</option><option value="monthly">Monthly</option></select></label>
          <label className="mt-3 block text-xs text-slate2">Processing day<input value={schedule.day} onChange={(event) => saveSchedule({ ...schedule, day: event.target.value })} className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm" /></label>
          <label className="mt-3 block text-xs text-slate2">Minimum payout (R)<input type="number" min="0" value={schedule.minimum} onChange={(event) => saveSchedule({ ...schedule, minimum: event.target.value })} className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm" /></label>
          <p className="mt-3 text-xs text-slate2">Changes are saved locally until a payout provider is connected.</p>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between gap-2"><div className="flex items-center gap-2"><DollarSign size={17} className="text-good" /><h2 className="font-display font-semibold">Promo codes</h2></div><Button variant="accent" className="!px-2 !py-1 text-xs" onClick={() => setShowPromo(true)}><Plus size={12} /> Add</Button></div>
          {promos.length === 0 ? <EmptyState title="No promo codes" hint="Create a referral credit code." /> : <div className="space-y-2">{promos.map((promo) => <div key={promo.id} className="flex items-center justify-between gap-2 rounded-xl border border-black/5 bg-slate-50 px-3 py-2.5"><div><div className="font-mono text-sm font-semibold">{promo.code}</div><div className="text-xs text-slate2">R{promo.credit} credit{promo.limit ? ` · ${promo.limit} uses` : ''}</div></div><button type="button" title={promo.active ? 'Disable promo code' : 'Enable promo code'} onClick={() => { const next = promos.map((item) => item.id === promo.id ? { ...item, active: !item.active } : item); setPromos(next); localStorage.setItem('lyft_promo_codes', JSON.stringify(next)); logAudit(`${promo.active ? 'Disabled' : 'Enabled'} promo code`, promo.code) }} className={promo.active ? 'text-good' : 'text-slate2'}>{promo.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}</button></div>)}</div>}
        </Card>
      </div>

      <Modal open={adjusting} onClose={() => setAdjusting(false)} title="Adjust driver balance">
        <label className="text-xs font-semibold text-slate2 uppercase tracking-[0.18em]">Driver name</label>
        <input value={adjustDriver} onChange={(e) => setAdjustDriver(e.target.value)} className="mt-2 w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40" placeholder="e.g. Nomvula Khumalo" />
        <label className="text-xs font-semibold text-slate2 uppercase tracking-[0.18em] mt-3 block">Amount (R, use - for a deduction)</label>
        <input value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} className="mt-2 w-full rounded-xl border border-black/10 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/40" placeholder="e.g. 150 or -75" />
        <label className="text-xs font-semibold text-slate2 uppercase tracking-[0.18em] mt-3 block">Audit note (required)</label>
        <textarea value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)} rows={2} className="mt-2 w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40" placeholder="Reason for this manual adjustment..." />
        <div className="mt-5 flex justify-end gap-2 border-t border-black/5 pt-4">
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

      <Modal open={showPromo} onClose={() => setShowPromo(false)} title="Create promo code">
        <label className="text-xs text-slate2">Code<input value={promoForm.code} onChange={(event) => setPromoForm({ ...promoForm, code: event.target.value })} placeholder="e.g. WELCOME50" className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm uppercase" /></label>
        <label className="mt-3 block text-xs text-slate2">Referral credit (R)<input type="number" min="1" value={promoForm.amount} onChange={(event) => setPromoForm({ ...promoForm, amount: event.target.value })} className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm" /></label>
        <label className="mt-3 block text-xs text-slate2">Usage limit (optional)<input type="number" min="1" value={promoForm.limit} onChange={(event) => setPromoForm({ ...promoForm, limit: event.target.value })} className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm" /></label>
        <div className="mt-4 flex justify-end gap-2"><Button variant="ghost" onClick={() => setShowPromo(false)}>Cancel</Button><Button variant="accent" disabled={!promoForm.code.trim() || !promoForm.amount} onClick={createPromo}>Create code</Button></div>
      </Modal>
    </div>
  )
}
