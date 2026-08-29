import React from 'react'

const STATUS_STYLES = {
  pending: 'bg-amber-bg text-amber-700 border-amber/30',
  approved: 'bg-good-bg text-good border-good/30',
  live: 'bg-good-bg text-good border-good/30',
  rejected: 'bg-bad-bg text-bad border-bad/30',
  revoked: 'bg-bad-bg text-bad border-bad/30',
  suspended: 'bg-bad-bg text-bad border-bad/30',
  expired: 'bg-bad-bg text-bad border-bad/30',
  resubmitted: 'bg-info-bg text-info border-info/30',
  not_submitted: 'bg-slate2-bg text-slate2 border-slate2/30',
  pending_review: 'bg-amber-bg text-amber-700 border-amber/30',
  active: 'bg-good-bg text-good border-good/30',
  in_progress: 'bg-info-bg text-info border-info/30',
  completed: 'bg-good-bg text-good border-good/30',
  cancelled: 'bg-slate2-bg text-slate2 border-slate2/30',
  paid: 'bg-good-bg text-good border-good/30',
  failed: 'bg-bad-bg text-bad border-bad/30',
  open: 'bg-bad-bg text-bad border-bad/30',
  acknowledged: 'bg-amber-bg text-amber-700 border-amber/30',
  resolved: 'bg-good-bg text-good border-good/30',
  investigating: 'bg-amber-bg text-amber-700 border-amber/30',
  deleted: 'bg-slate2-bg text-slate2 border-slate2/30',
  clear: 'bg-good-bg text-good border-good/30',
  card_failed: 'bg-bad-bg text-bad border-bad/30',
  ok: 'bg-good-bg text-good border-good/30',
}

export function StatusBadge({ status }) {
  const label = String(status).replace(/_/g, ' ')
  const style = STATUS_STYLES[status] || 'bg-slate2-bg text-slate2 border-slate2/30'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}>
      {label}
    </span>
  )
}

// The signature element: a colored rail on the left edge of a row/card,
// giving every module the same at-a-glance urgency language. No border —
// a soft shadow gives it depth instead, and it lifts slightly on hover.
const RAIL_COLORS = {
  urgent: 'bg-bad',
  warn: 'bg-amber',
  info: 'bg-info',
  ok: 'bg-good',
  neutral: 'bg-slate2',
}

export function Rail({ tone = 'neutral', children, className = '' }) {
  return (
    <div className={`flex rounded-lg bg-white shadow-[0_1px_2px_rgba(6,35,26,0.06)] hover:shadow-[0_4px_12px_rgba(6,35,26,0.08)] transition-shadow overflow-hidden ${className}`}>
      <div className={`w-1.5 shrink-0 ${RAIL_COLORS[tone]}`} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

// Generic elevated surface for top-level summary boxes (metrics, form
// panels, config fields) — same shadow language as Rail, no left stripe.
export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-lg bg-white shadow-[0_1px_2px_rgba(6,35,26,0.06)] ${className}`}>
      {children}
    </div>
  )
}

export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-5 gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-ink-600/70 text-slate2 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-ink text-white hover:bg-ink-700',
    accent: 'bg-accent text-white hover:bg-accent-600',
    good: 'bg-good text-white hover:opacity-90',
    bad: 'bg-bad text-white hover:opacity-90',
    ghost: 'bg-transparent text-ink border border-black/10 hover:bg-black/5',
  }
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className={`w-full ${wide ? 'max-w-3xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-slate2 hover:text-ink text-lg leading-none">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function EmptyState({ title, hint }) {
  return (
    <div className="rounded-lg border border-dashed border-black/10 py-12 text-center">
      <p className="font-medium text-ink">{title}</p>
      {hint && <p className="text-sm text-slate2 mt-1">{hint}</p>}
    </div>
  )
}

export function Star() {
  return <span className="text-amber align-middle" title="Core feature">★</span>
}

export function Planned({ items }) {
  return (
    <div className="rounded-lg border border-black/5 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate2 mb-3">Planned — not yet built</p>
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2 text-sm text-ink-700">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate2/50 shrink-0" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function timeAgo(iso) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}