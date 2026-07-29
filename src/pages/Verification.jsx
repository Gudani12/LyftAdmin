import React, { useMemo, useState } from 'react'
import { FileImage, AlertTriangle, Copy, CheckCircle2 } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { DOC_TYPES, REJECTION_REASONS } from '../data/mockData.js'
import { Rail, StatusBadge, Button, Modal, SectionHeader, EmptyState, Star, Planned, timeAgo, fmtDate } from '../components/ui.jsx'

const LOW_RISK_TYPES = ['selfie', 'id_document']

export default function Verification() {
  const { verifications, decideVerification, bulkApprove } = useData()
  const [statusFilter, setStatusFilter] = useState('pending')
  const [typeFilter, setTypeFilter] = useState('all')
  const [active, setActive] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])

  const countsByType = useMemo(() => {
    const pending = verifications.filter((v) => v.status === 'pending' || v.status === 'resubmitted')
    const map = {}
    for (const v of pending) map[v.docType] = (map[v.docType] || 0) + 1
    return map
  }, [verifications])

  const filtered = useMemo(() => {
    let list = verifications.filter((v) => v.status !== 'not_submitted' || statusFilter === 'not_submitted' || statusFilter === 'all')
    if (statusFilter !== 'all') list = list.filter((v) => v.status === statusFilter)
    if (typeFilter !== 'all') list = list.filter((v) => v.docType === typeFilter)
    return [...list].sort((a, b) => new Date(a.submittedAt || 0) - new Date(b.submittedAt || 0))
  }, [verifications, statusFilter, typeFilter])

  // Duplicate detection: same ID number typed on two different accounts
  const duplicates = useMemo(() => {
    const byId = {}
    verifications.forEach((v) => {
      const idNum = v.typedDetails?.idNumber
      if (!idNum) return
      byId[idNum] = byId[idNum] || new Set()
      byId[idNum].add(v.userName)
    })
    return Object.entries(byId).filter(([, names]) => names.size > 1)
  }, [verifications])

  // Expiry warnings: approved docs expiring within 30 days
  const expiringSoon = useMemo(() => {
    const now = Date.now()
    return verifications.filter((v) => v.expiresAt && v.status === 'approved' && new Date(v.expiresAt) - now < 30 * 86400000 && new Date(v.expiresAt) > now)
  }, [verifications])

  const eligibleForBulk = filtered.filter((v) => (v.status === 'pending' || v.status === 'resubmitted') && LOW_RISK_TYPES.includes(v.docType))

  const toggleSelect = (id) => setSelectedIds((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])

  const handleBulkApprove = () => {
    if (selectedIds.length === 0) return
    bulkApprove(selectedIds)
    setSelectedIds([])
  }

  return (
    <div>
      <SectionHeader
        title="Verification"
        subtitle="Review submitted documents and decide on driver and rider verification."
      />

      {duplicates.length > 0 && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-bad/30 bg-bad-bg px-4 py-3 text-sm text-bad">
          <Copy size={16} className="mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold">Duplicate ID number detected: </span>
            {duplicates.map(([id, names]) => `${id} used by ${[...names].join(' and ')}`).join('; ')}
          </div>
        </div>
      )}
      {expiringSoon.length > 0 && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber/30 bg-amber-bg px-4 py-3 text-sm text-amber-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold">{expiringSoon.length} approved document(s) expiring within 30 days: </span>
            {expiringSoon.map((v) => `${v.userName} (${DOC_TYPES.find((d) => d.key === v.docType)?.label}, expires ${fmtDate(v.expiresAt).split(',')[0]})`).join('; ')}
          </div>
        </div>
      )}

      {/* Counts by type <Star/> */}
      <div className="mb-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {DOC_TYPES.map((t) => (
          <button
            key={t.key}
            onClick={() => setTypeFilter(typeFilter === t.key ? 'all' : t.key)}
            className={`rounded-lg border px-3 py-2 text-left transition ${typeFilter === t.key ? 'border-accent bg-accent-50' : 'border-black/5 bg-white hover:border-black/10'}`}
          >
            <div className="text-xl font-display font-semibold">{countsByType[t.key] || 0}</div>
            <div className="text-[11px] text-slate2 leading-tight">{t.label}</div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {['pending', 'resubmitted', 'approved', 'rejected', 'expired', 'not_submitted', 'all'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize border transition ${statusFilter === s ? 'bg-deep text-white border-deep' : 'border-black/10 text-ink-700 hover:bg-black/5'}`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Star /> <span className="text-xs text-slate2">Bulk approve — low-risk types only (selfie, ID document)</span>
          <Button variant="good" disabled={selectedIds.length === 0} onClick={handleBulkApprove}>
            Approve {selectedIds.length || ''} selected
          </Button>
        </div>
      </div>

      <p className="text-xs text-slate2 mb-2">Oldest first &middot; {filtered.length} result{filtered.length === 1 ? '' : 's'}</p>

      {filtered.length === 0 ? (
        <EmptyState title="Nothing in this queue" hint="Try a different status or document type filter." />
      ) : (
        <div className="space-y-2">
          {filtered.map((v) => {
            const tone = v.status === 'pending' || v.status === 'resubmitted' ? 'warn' : v.status === 'expired' || v.status === 'rejected' ? 'urgent' : v.status === 'approved' ? 'ok' : 'neutral'
            const canBulk = eligibleForBulk.includes(v)
            return (
              <Rail key={v.id} tone={tone}>
                <div className="flex items-center gap-4 px-4 py-3">
                  {canBulk && (
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(v.id)}
                      onChange={() => toggleSelect(v.id)}
                      className="h-4 w-4 rounded border-black/20"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{v.userName}</span>
                      <span className="text-[11px] text-slate2 capitalize">{v.role}</span>
                    </div>
                    <div className="text-xs text-slate2 mt-0.5">
                      {DOC_TYPES.find((d) => d.key === v.docType)?.label}
                      {v.submittedAt && <> &middot; submitted {timeAgo(v.submittedAt)}</>}
                      {v.faceMatchScore && <> &middot; face match {(v.faceMatchScore * 100).toFixed(0)}%</>}
                    </div>
                  </div>
                  <StatusBadge status={v.status} />
                  <Button variant="ghost" onClick={() => setActive(v)}>Review</Button>
                </div>
              </Rail>
            )
          })}
        </div>
      )}

      <div className="mt-6">
        <Planned items={[
          'Document expiry advance-warning digest (email/push to admins)',
          'Full resubmission history timeline per user (shown inline in review modal today)',
        ]} />
      </div>

      <ReviewModal verification={active} onClose={() => setActive(null)} onDecide={decideVerification} />
    </div>
  )
}

function ReviewModal({ verification: v, onClose, onDecide }) {
  const [reason, setReason] = useState(REJECTION_REASONS[0])
  const [showReject, setShowReject] = useState(false)

  if (!v) return null

  const decide = (decision) => {
    onDecide(v.id, decision, decision === 'rejected' ? reason : null)
    setShowReject(false)
    onClose()
  }

  return (
    <Modal open={!!v} onClose={onClose} title={`Review — ${v.userName}`} wide>
      <div className="grid grid-cols-2 gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate2 mb-2">Uploaded document</p>
          <div className="aspect-[4/3] rounded-lg border border-dashed border-black/15 bg-slate2-bg flex flex-col items-center justify-center text-slate2">
            <FileImage size={32} />
            <span className="text-xs mt-2">{v.documentImage ? `${v.documentImage}.jpg` : 'No document on file'}</span>
          </div>
          {v.resubmissionHistory?.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate2 mb-1">Resubmission history</p>
              <ul className="text-xs space-y-1">
                {v.resubmissionHistory.map((r, i) => (
                  <li key={i} className="text-ink-700">Rejected {timeAgo(r.at)} by {r.by} — {r.reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate2 mb-2">Typed details</p>
          <div className="rounded-lg border border-black/5 divide-y divide-black/5 bg-white">
            {Object.keys(v.typedDetails || {}).length === 0 ? (
              <p className="p-3 text-sm text-slate2">No details submitted.</p>
            ) : (
              Object.entries(v.typedDetails).map(([k, val]) => (
                <div key={k} className="flex justify-between px-3 py-2 text-sm">
                  <span className="text-slate2 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-mono text-ink-700">{val}</span>
                </div>
              ))
            )}
          </div>
          <div className="mt-3 text-xs text-slate2 space-y-1">
            <div>Status: <StatusBadge status={v.status} /></div>
            {v.expiresAt && <div>Document expires {fmtDate(v.expiresAt)}</div>}
            {v.decidedBy && <div>Last decision by {v.decidedBy} &middot; {fmtDate(v.decidedAt)}</div>}
            {v.decisionReason && <div className="text-bad">Reason: {v.decisionReason}</div>}
          </div>
        </div>
      </div>

      {!['approved', 'rejected'].includes(v.status) && (
        <div className="mt-5 border-t border-black/5 pt-4">
          {!showReject ? (
            <div className="flex justify-end gap-2">
              <Button variant="bad" onClick={() => setShowReject(true)}>Reject</Button>
              <Button variant="good" onClick={() => decide('approved')}><CheckCircle2 size={15} /> Approve</Button>
            </div>
          ) : (
            <div className="flex items-end gap-2 justify-end">
              <div className="flex-1">
                <label className="text-xs text-slate2">Reason (sent to user)</label>
                <select value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full rounded-md border border-black/10 px-2 py-1.5 text-sm">
                  {REJECTION_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <Button variant="ghost" onClick={() => setShowReject(false)}>Cancel</Button>
              <Button variant="bad" onClick={() => decide('rejected')}>Confirm reject</Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
