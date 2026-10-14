import React, { useMemo } from 'react'
import {
  Activity, AlertTriangle, ArrowUpRight, BellRing, Car, CheckCircle2, ShieldCheck, Users, Wallet,
} from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { Card, SectionHeader, StatusBadge } from '../components/ui.jsx'

export default function Dashboard() {
  const { verifications, drivers, users, safety, failedPayments, payouts, auditLog } = useData()

  const summary = useMemo(() => {
    const pendingVerifications = verifications.filter((v) => ['pending', 'resubmitted', 'not_submitted'].includes(v.status)).length
    const openSOS = safety.sos.filter((s) => s.status === 'open').length
    const liveDrivers = drivers.filter((d) => d.liveApproved).length
    const failedPayouts = failedPayments.length
    const activeUsers = users.filter((u) => u.status === 'active').length
    const paidThisWeek = payouts.filter((p) => p.status === 'paid').length

    return {
      pendingVerifications,
      openSOS,
      liveDrivers,
      failedPayouts,
      activeUsers,
      paidThisWeek,
    }
  }, [verifications, drivers, users, safety, failedPayments, payouts])

  const priorityItems = useMemo(() => [
    ...safety.sos.filter((s) => s.status === 'open').slice(0, 3).map((item) => ({
      title: `${item.user} needs attention`,
      subtitle: `${item.location} • ${item.role}`,
      tone: 'bad',
      meta: item.status,
    })),
    ...failedPayments.slice(0, 2).map((item) => ({
      title: `Payment failed: ${item.rider}`,
      subtitle: `Trip ${item.tripId} • R${item.amount}`,
      tone: 'warn',
      meta: 'payment',
    })),
    ...verifications.filter((v) => ['pending', 'resubmitted'].includes(v.status)).slice(0, 2).map((item) => ({
      title: `${item.userName} verification pending`,
      subtitle: `${item.docType.replace(/_/g, ' ')} • ${item.role}`,
      tone: 'info',
      meta: item.status,
    })),
  ], [safety, failedPayments, verifications])

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Operations dashboard"
        subtitle="Quick view of the most important actions across verification, safety, drivers, and money."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <KpiCard label="Pending verifications" value={summary.pendingVerifications} tone="info" icon={ShieldCheck} />
        <KpiCard label="Open SOS" value={summary.openSOS} tone="bad" icon={BellRing} />
        <KpiCard label="Live drivers" value={summary.liveDrivers} tone="good" icon={Car} />
        <KpiCard label="Users active" value={summary.activeUsers} tone="accent" icon={Users} />
        <KpiCard label="Failed payouts" value={summary.failedPayouts} tone="warn" icon={Wallet} />
        <KpiCard label="Paid this week" value={summary.paidThisWeek} tone="good" icon={CheckCircle2} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-ink">Priority queue</h2>
            <span className="text-xs uppercase tracking-[0.18em] text-slate2">Live</span>
          </div>

          <div className="space-y-3">
            {priorityItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/10 bg-slate-50 px-4 py-8 text-sm text-slate2 text-center">
                No active issues to review.
              </div>
            ) : (
              priorityItems.map((item, index) => (
                <div key={`${item.title}-${index}`} className="flex items-start justify-between gap-3 rounded-2xl border border-black/5 bg-slate-50 px-3 py-3">
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-ink">{item.title}</div>
                    <div className="mt-1 text-xs text-slate2">{item.subtitle}</div>
                  </div>
                  <StatusBadge status={item.meta === 'payment' ? 'pending' : item.meta === 'open' ? 'open' : item.meta} />
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-ink">Recent admin actions</h2>
            <Activity size={18} className="text-slate2" />
          </div>

          <div className="space-y-3">
            {auditLog.slice(0, 5).map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-black/5 bg-white px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-ink">{entry.action}</span>
                  <span className="text-[11px] text-slate2">{new Date(entry.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="mt-1 text-xs text-slate2">{entry.target}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MiniPanel title="Verification health" value={String(Math.max(0, 100 - summary.pendingVerifications * 6)) + '%'} tone="good" icon={CheckCircle2} />
        <MiniPanel title="Risk watch" value={`${summary.openSOS + failedPayments.length} flagged`} tone="bad" icon={AlertTriangle} />
        <MiniPanel title="Driver network" value={`${summary.liveDrivers} online`} tone="accent" icon={ArrowUpRight} />
      </div>
    </div>
  )
}

function KpiCard({ label, value, tone, icon: Icon }) {
  const tones = {
    good: 'border-good/15 bg-good-bg text-good',
    bad: 'border-bad/15 bg-bad-bg text-bad',
    info: 'border-info/20 bg-info-bg text-info',
    accent: 'border-accent/15 bg-accent-50 text-accent-700',
    warn: 'border-amber/20 bg-amber-bg text-amber-700',
  }

  return (
    <Card className={`p-4 ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
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

function MiniPanel({ title, value, tone, icon: Icon }) {
  const tones = {
    good: 'border-good/15 bg-good-bg text-good',
    bad: 'border-bad/15 bg-bad-bg text-bad',
    accent: 'border-accent/15 bg-accent-50 text-accent-700',
  }

  return (
    <Card className={`p-4 ${tones[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em]">{title}</div>
          <div className="mt-2 font-display text-2xl font-semibold tracking-tight">{value}</div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 ring-1 ring-black/5">
          <Icon size={16} />
        </div>
      </div>
    </Card>
  )
}
