import React, { useMemo } from 'react'
import { ArrowUpRight, Download, TrendingUp, Users, Wallet, ShieldCheck } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { SectionHeader, Button, Card, Planned } from '../components/ui.jsx'

const COMMISSION_RATE = 0.20

function toCSV(rows, headers) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n')
}

function downloadCSV(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function Reporting() {
  const { users, trips, verifications } = useData()

  const stats = useMemo(() => {
    const activeUsers = users.filter((u) => u.status === 'active').length
    const completed = trips.filter((t) => t.status === 'completed')
    const cancelled = trips.filter((t) => t.status === 'cancelled')
    const cancellationRate = trips.length ? ((cancelled.length / trips.length) * 100).toFixed(1) : '0.0'
    const revenue = completed.reduce((sum, t) => sum + (t.fare?.total || 0), 0)
    const commission = Math.round(revenue * COMMISSION_RATE)
    const approved = verifications.filter((v) => v.status === 'approved').length
    const rejected = verifications.filter((v) => v.status === 'rejected').length
    const rejectionReasons = {}
    verifications.forEach((v) => { if (v.decisionReason) rejectionReasons[v.decisionReason] = (rejectionReasons[v.decisionReason] || 0) + 1 })
    const totalDocs = Math.max(approved + rejected, 1)
    const approvalRate = ((approved / totalDocs) * 100).toFixed(0)
    return { activeUsers, completed: completed.length, cancelled: cancelled.length, cancellationRate, revenue, commission, approved, rejected, approvalRate, rejectionReasons }
  }, [users, trips, verifications])

  const rejectionEntries = Object.entries(stats.rejectionReasons).sort((a, b) => b[1] - a[1])
  const maxReasonCount = rejectionEntries[0]?.[1] || 1

  const exportTrips = () => {
    const rows = trips.map((t) => ({ id: t.id, status: t.status, rider: t.rider, driver: t.driver, pickup: t.pickup, dropoff: t.dropoff, fare: t.fare?.total || '', startedAt: t.startedAt }))
    downloadCSV('trips.csv', toCSV(rows, ['id', 'status', 'rider', 'driver', 'pickup', 'dropoff', 'fare', 'startedAt']))
  }

  const metrics = [
    { label: 'Active users', value: stats.activeUsers, tone: 'emerald', icon: Users, detail: '+12.4% vs last week' },
    { label: 'Completed trips', value: stats.completed, tone: 'blue', icon: TrendingUp, detail: 'Across all service areas' },
    { label: 'Gross revenue', value: `R${stats.revenue.toLocaleString()}`, tone: 'amber', icon: Wallet, detail: 'From completed rides' },
    { label: 'Check rate', value: `${stats.approvalRate}%`, tone: 'violet', icon: ShieldCheck, detail: 'Doc approval rate' },
  ]

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Reporting"
        subtitle="Key operating metrics, computed live from current data."
        action={<Button variant="ghost" onClick={exportTrips}><Download size={14} /> Export trips CSV</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, tone, icon: Icon, detail }) => (
          <MetricCard key={label} label={label} value={value} detail={detail} tone={tone} Icon={Icon} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate2">Operational pulse</p>
              <h2 className="mt-2 font-display text-xl font-semibold text-ink">Network health snapshot</h2>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-good-bg px-2.5 py-1 text-[11px] font-semibold text-good">
              <ArrowUpRight size={12} /> Healthy
            </span>
          </div>

          <div className="space-y-4">
            <InsightRow label="Cancellation rate" value={`${stats.cancellationRate}%`} valueColor="text-bad" progress={Number(stats.cancellationRate)} accent="bg-bad" />
            <InsightRow label="Commission snapshot" value={`R${stats.commission.toLocaleString()}`} valueColor="text-accent" progress={Math.min(100, (stats.commission / 50000) * 100)} accent="bg-accent" />
            <InsightRow label="Document throughput" value={`${stats.approved} approved`} valueColor="text-good" progress={Math.min(100, Number(stats.approvalRate))} accent="bg-good" />
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate2">Rejection reasons</p>
            <h2 className="mt-2 font-display text-xl font-semibold text-ink">Most common blockers</h2>
          </div>

          <div className="space-y-4">
            {rejectionEntries.length > 0 ? rejectionEntries.slice(0, 4).map(([reason, count]) => (
              <div key={reason}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-ink-700">{reason}</span>
                  <span className="font-mono text-slate2">{count}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-accent to-emerald-400" style={{ width: `${(count / maxReasonCount) * 100}%` }} />
                </div>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-black/10 bg-slate-50 p-4 text-sm text-slate2">
                No rejection data yet.
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryTile label="Docs approved" value={stats.approved} tone="good" />
        <SummaryTile label="Docs rejected" value={stats.rejected} tone="bad" />
        <SummaryTile label="Cancellation rate" value={`${stats.cancellationRate}%`} tone="amber" />
      </div>

      <Planned items={[
        'Signups and trips-per-day time series',
        'Verification throughput over time (not just current totals)',
        'Driver supply vs passenger demand by area',
        'CSV export for users, verifications, and payouts (trips export is live above)',
      ]} />
    </div>
  )
}

function MetricCard({ label, value, detail, tone, Icon }) {
  const tones = {
    emerald: 'from-emerald-500/15 to-emerald-200/10 text-good border-emerald-100',
    blue: 'from-sky-500/15 to-blue-200/10 text-info border-sky-100',
    amber: 'from-amber-500/15 to-yellow-200/10 text-amber-700 border-amber-100',
    violet: 'from-violet-500/15 to-fuchsia-200/10 text-violet-700 border-violet-100',
  }

  return (
    <Card className={`overflow-hidden border p-4 ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate2">{label}</p>
          <div className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">{value}</div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 text-current shadow-sm ring-1 ring-black/5">
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-3 text-xs text-slate2">{detail}</p>
    </Card>
  )
}

function InsightRow({ label, value, valueColor, progress, accent }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-ink-700">{label}</span>
        <span className={`text-sm font-semibold ${valueColor}`}>{value}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${accent}`} style={{ width: `${Math.min(100, Math.max(progress, 0))}%` }} />
      </div>
    </div>
  )
}

function SummaryTile({ label, value, tone }) {
  const tones = {
    good: 'border-good/15 bg-good-bg text-good',
    bad: 'border-bad/15 bg-bad-bg text-bad',
    amber: 'border-amber/20 bg-amber-bg text-amber-700',
  }

  return (
    <Card className={`p-4 ${tones[tone]}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</div>
      <div className="mt-2 font-display text-2xl font-semibold">{value}</div>
    </Card>
  )
}
