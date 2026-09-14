import React, { useMemo } from 'react'
import { ArrowUpRight, Download, TrendingUp, Users, Wallet, ShieldCheck } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { SectionHeader, Button, Card } from '../components/ui.jsx'

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
  const { users, trips, verifications, drivers, payouts } = useData()

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

  const timeSeries = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() - (6 - index))
      return date
    })
    return days.map((date) => {
      const next = new Date(date)
      next.setDate(next.getDate() + 1)
      const dayTrips = trips.filter((trip) => trip.startedAt && new Date(trip.startedAt) >= date && new Date(trip.startedAt) < next).length
      const dayVerifications = verifications.filter((item) => item.decidedAt && new Date(item.decidedAt) >= date && new Date(item.decidedAt) < next)
      const signups = users.filter((user) => user.created_at && new Date(user.created_at) >= date && new Date(user.created_at) < next).length
      return {
        label: date.toLocaleDateString('en-ZA', { weekday: 'short' }),
        trips: dayTrips,
        approved: dayVerifications.filter((item) => item.status === 'approved').length,
        rejected: dayVerifications.filter((item) => item.status === 'rejected').length,
        signups,
        hasSignupData: users.some((user) => user.created_at),
      }
    })
  }, [trips, verifications, users])

  const areaBreakdown = useMemo(() => {
    const areas = [...new Set(trips.map((trip) => trip.pickup?.split(',').pop()?.trim()).filter(Boolean))]
    return areas.map((area) => {
      const demand = trips.filter((trip) => trip.pickup?.includes(area)).length
      const supply = drivers.filter((driver) => {
        const location = driver.area || driver.city || driver.location || driver.service_area
        return location?.toLowerCase?.().includes(area.toLowerCase())
      }).length
      return { area, demand, supply }
    }).sort((a, b) => b.demand - a.demand)
  }, [trips, drivers])

  const exportTrips = () => {
    const rows = trips.map((t) => ({ id: t.id, status: t.status, rider: t.rider, driver: t.driver, pickup: t.pickup, dropoff: t.dropoff, fare: t.fare?.total || '', startedAt: t.startedAt }))
    downloadCSV('trips.csv', toCSV(rows, ['id', 'status', 'rider', 'driver', 'pickup', 'dropoff', 'fare', 'startedAt']))
  }

  const exportUsers = () => {
    const rows = users.map((user) => ({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, status: user.status, trips: user.trips, rating: user.rating }))
    downloadCSV('users.csv', toCSV(rows, ['id', 'name', 'email', 'phone', 'role', 'status', 'trips', 'rating']))
  }

  const exportVerifications = () => {
    const rows = verifications.map((item) => ({ id: item.id, user: item.userName, role: item.role, document: item.docType, status: item.status, submittedAt: item.submittedAt, decidedAt: item.decidedAt, reason: item.decisionReason }))
    downloadCSV('verifications.csv', toCSV(rows, ['id', 'user', 'role', 'document', 'status', 'submittedAt', 'decidedAt', 'reason']))
  }

  const exportPayouts = () => {
    const rows = payouts.map((payout) => ({ id: payout.id, driver: payout.driver, amount: payout.amount, status: payout.status, period: payout.period, method: payout.method, reason: payout.failReason }))
    downloadCSV('payouts.csv', toCSV(rows, ['id', 'driver', 'amount', 'status', 'period', 'method', 'reason']))
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
        action={<div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={exportUsers}><Download size={14} /> Users CSV</Button>
          <Button variant="ghost" onClick={exportVerifications}><Download size={14} /> Verifications CSV</Button>
          <Button variant="ghost" onClick={exportPayouts}><Download size={14} /> Payouts CSV</Button>
          <Button variant="accent" onClick={exportTrips}><Download size={14} /> Trips CSV</Button>
        </div>}
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

      <div className="grid gap-4 xl:grid-cols-2">
        <TimeSeriesCard title="Signups and trips per day" subtitle="Last 7 days" series={timeSeries} keys={['signups', 'trips']} colors={['bg-accent', 'bg-info']} labels={['Signups', 'Trips']} unavailable={!timeSeries[0]?.hasSignupData} />
        <TimeSeriesCard title="Verification throughput" subtitle="Approved and rejected decisions per day" series={timeSeries} keys={['approved', 'rejected']} colors={['bg-good', 'bg-bad']} labels={['Approved', 'Rejected']} />
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate2">Market balance</p>
            <h2 className="mt-2 font-display text-xl font-semibold text-ink">Driver supply vs passenger demand</h2>
          </div>
          <span className="text-xs text-slate2">Grouped by pickup area</span>
        </div>
        {areaBreakdown.length === 0 ? <p className="text-sm text-slate2">No trip area data available yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="border-b border-black/5 text-xs uppercase tracking-[0.14em] text-slate2"><tr><th className="pb-3">Area</th><th className="pb-3">Demand</th><th className="pb-3">Supply</th><th className="pb-3">Signal</th></tr></thead>
              <tbody className="divide-y divide-black/5">{areaBreakdown.map((item) => <tr key={item.area}><td className="py-3 font-medium text-ink">{item.area}</td><td className="py-3">{item.demand} trips</td><td className="py-3">{item.supply || '—'} drivers</td><td className="py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.supply === 0 ? 'bg-amber-bg text-amber-700' : item.demand > item.supply ? 'bg-bad-bg text-bad' : 'bg-good-bg text-good'}`}>{item.supply === 0 ? 'Supply data needed' : item.demand > item.supply ? 'Demand pressure' : 'Balanced'}</span></td></tr>)}</tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function TimeSeriesCard({ title, subtitle, series, keys, colors, labels, unavailable }) {
  const max = Math.max(...series.flatMap((item) => keys.map((key) => item[key])), 1)
  return <Card className="p-5">
    <div className="mb-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate2">Trend</p><h2 className="mt-2 font-display text-xl font-semibold text-ink">{title}</h2><p className="mt-1 text-xs text-slate2">{subtitle}</p></div>
    {unavailable ? <p className="rounded-2xl border border-dashed border-black/10 bg-slate-50 p-4 text-sm text-slate2">Signup timestamps are not available in the current records.</p> : <>
      <div className="flex h-40 items-end gap-2 border-b border-black/5 pb-2">{series.map((item) => <div key={item.label} className="flex h-full flex-1 items-end gap-1" title={`${item.label}: ${keys.map((key) => `${key} ${item[key]}`).join(', ')}`}>{keys.map((key, index) => <div key={key} className={`min-h-[3px] flex-1 rounded-t ${colors[index]}`} style={{ height: `${(item[key] / max) * 100}%` }} />)}</div>)}</div>
      <div className="mt-2 flex justify-between text-[11px] text-slate2">{series.map((item) => <span key={item.label}>{item.label}</span>)}</div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate2">{labels.map((label, index) => <span key={label} className="inline-flex items-center gap-1.5"><i className={`h-2.5 w-2.5 rounded-sm ${colors[index]}`} />{label}</span>)}</div>
    </>}
  </Card>
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
