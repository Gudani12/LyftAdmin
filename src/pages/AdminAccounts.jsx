import React, { useState, useMemo } from 'react'
import { Archive, ArchiveRestore, Search, Trash2 } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { ROLES } from '../data/mockData.js'
import { SectionHeader, Rail, Planned, EmptyState, fmtDate, Card, Button, StatusBadge } from '../components/ui.jsx'

const ROLE_STYLES = {
  super_admin: 'bg-accent-50 text-accent-700 border-accent/30',
  verifier: 'bg-info-bg text-info border-info/30',
  support: 'bg-good-bg text-good border-good/30',
  finance: 'bg-amber-bg text-amber-700 border-amber/30',
}

export default function AdminAccounts() {
  const { admins, currentAdmin, auditLog, archiveAdmin, restoreAdmin, deleteAdmin } = useData()
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [query, setQuery] = useState('')

  const filtered = admins.filter((a) => {
    const q = query.trim().toLowerCase()
    return (roleFilter === 'all' || a.role === roleFilter) &&
      (statusFilter === 'all' || (a.status || 'active') === statusFilter) &&
      (!q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q))
  })
  const summary = useMemo(() => ({
    total: admins.length,
    active: admins.filter((a) => a.lastLogin === 'now').length,
    byRole: Object.fromEntries(ROLES.map((r) => [r, admins.filter((a) => a.role === r).length])),
  }), [admins])

  return (
    <div className="space-y-6">
      <SectionHeader title="Admin accounts" subtitle="Roles and permissions, plus a live audit trail of admin actions." />

      <div className="grid gap-3 md:grid-cols-4">
        <Card className="p-4 border-black/5 bg-white">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate2">Total admins</div>
          <div className="mt-2 font-display text-3xl font-semibold">{summary.total}</div>
        </Card>
        <Card className="p-4 border-good/15 bg-good-bg text-good">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em]">Active now</div>
          <div className="mt-2 font-display text-3xl font-semibold">{summary.active}</div>
        </Card>
        <Card className="p-4 border-info/20 bg-info-bg text-info">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em]">Verifiers</div>
          <div className="mt-2 font-display text-3xl font-semibold">{summary.byRole.verifier}</div>
        </Card>
        <Card className="p-4 border-accent/20 bg-accent-50 text-accent-700">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em]">Super admins</div>
          <div className="mt-2 font-display text-3xl font-semibold">{summary.byRole.super_admin}</div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="mb-3 grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate2" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search admin name or email..." className="w-full rounded-xl border border-black/10 bg-white pl-9 pr-3 py-2.5 text-sm outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm capitalize outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/10">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5 mb-4 flex-wrap">
            {['all', ...ROLES].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize border transition ${roleFilter === r ? 'bg-deep text-white border-deep' : 'border-black/10 text-ink-700 hover:bg-black/5'}`}
              >
                {r.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {filtered.map((a) => (
              <Rail key={a.id} tone="neutral">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate2 to-slate2/40 text-[10px] font-bold text-white">
                        {a.name.split(' ').map((s) => s[0]).join('').slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{a.name}</div>
                        <div className="text-xs text-slate2 truncate">{a.email}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${ROLE_STYLES[a.role]}`}>{a.role.replace('_', ' ')}</span>
                      <div className="text-[11px] text-slate2 mt-1">{a.lastLogin === 'now' ? '✓ Now' : fmtDate(a.lastLogin)}</div>
                    </div>
                    {a.status === 'archived' ? (
                      <div className="flex items-center gap-2">
                        <StatusBadge status="archived" />
                        {currentAdmin?.role === 'super_admin' && (
                          <Button variant="good" className="!px-2 !py-1 text-[11px]" onClick={() => restoreAdmin(a.id)}>
                            <ArchiveRestore size={12} />
                            Restore
                          </Button>
                        )}
                      </div>
                    ) : a.role !== 'super_admin' && currentAdmin?.role === 'super_admin' ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="accent"
                          className="!px-2 !py-1 text-[11px]"
                          onClick={() => {
                            const reason = window.prompt(`Archive ${a.name}? Add the reason for archiving this admin account.`, 'Role change / no longer active')
                            if (reason && reason.trim()) archiveAdmin(a.id, reason.trim())
                          }}
                        >
                          <Archive size={12} />
                          Archive
                        </Button>
                        <Button
                          variant="bad"
                          className="!px-2 !py-1 text-[11px]"
                          onClick={() => {
                            if (window.confirm(`Delete admin ${a.name}? This action is permanent and will be logged.`)) {
                              deleteAdmin(a.id)
                            }
                          }}
                        >
                          <Trash2 size={12} />
                          Delete
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </Rail>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-display font-semibold mb-3">Audit log</h2>
          {auditLog.length === 0 ? (
            <EmptyState title="No admin actions yet" hint="Approvals, rejections, suspensions, and other actions appear here as they happen." />
          ) : (
            <div className="space-y-2 max-h-[28rem] overflow-y-auto">
              {auditLog.map((e) => (
                <div key={e.id} className="rounded-2xl border border-black/5 bg-white px-4 py-3 text-sm shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium text-ink">{e.action}</span>
                    <span className="text-[11px] text-slate2 whitespace-nowrap">{fmtDate(e.at)}</span>
                  </div>
                  <div className="text-xs text-slate2 mt-2">{e.target}</div>
                  <div className="text-[11px] text-slate2 mt-1.5">by {e.admin} <span className="capitalize">({e.role.replace('_', ' ')})</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <Planned items={['Enable multi-factor authentication in Clerk for all admin accounts']} />
      </div>
    </div>
  )
}
