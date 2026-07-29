import React, { useMemo } from 'react'
import { Download } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { SectionHeader, Button, Planned } from '../components/ui.jsx'

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
    return { activeUsers, completed: completed.length, cancelled: cancelled.length, cancellationRate, revenue, commission, approved, rejected, rejectionReasons }
  }, [users, trips, verifications])

  const exportTrips = () => {
    const rows = trips.map((t) => ({ id: t.id, status: t.status, rider: t.rider, driver: t.driver, pickup: t.pickup, dropoff: t.dropoff, fare: t.fare?.total || '', startedAt: t.startedAt }))
    downloadCSV('trips.csv', toCSV(rows, ['id', 'status', 'rider', 'driver', 'pickup', 'dropoff', 'fare', 'startedAt']))
  }

  return (
    <div>
      <SectionHeader
        title="Reporting"
        subtitle="Key operating metrics, computed live from current data."
        action={<Button variant="ghost" onClick={exportTrips}><Download size={14} /> Export trips CSV</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Metric label="Active users" value={stats.activeUsers} />
        <Metric label="Completed trips" value={stats.completed} />
        <Metric label="Cancellation rate" value={`${stats.cancellationRate}%`} />
        <Metric label="Revenue" value={`R${stats.revenue.toLocaleString()}`} />
        <Metric label="Commission" value={`R${stats.commission.toLocaleString()}`} />
        <Metric label="Docs approved" value={stats.approved} />
        <Metric label="Docs rejected" value={stats.rejected} />
      </div>

      {Object.keys(stats.rejectionReasons).length > 0 && (
        <div className="mb-6">
          <h2 className="font-display font-semibold mb-3">Rejection reasons</h2>
          <div className="rounded-lg border border-black/5 bg-white divide-y divide-black/5">
            {Object.entries(stats.rejectionReasons).map(([reason, count]) => (
              <div key={reason} className="flex justify-between px-4 py-2 text-sm">
                <span>{reason}</span>
                <span className="font-mono text-slate2">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Planned items={[
        'Signups and trips-per-day time series',
        'Verification throughput over time (not just current totals)',
        'Driver supply vs passenger demand by area',
        'CSV export for users, verifications, and payouts (trips export is live above)',
      ]} />
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-black/5 bg-white p-4">
      <div className="text-xs text-slate2">{label}</div>
      <div className="font-display text-2xl font-semibold mt-1">{value}</div>
    </div>
  )
}
