import React, { useState } from 'react'
import { useData } from '../context/DataContext.jsx'
import { ROLES } from '../data/mockData.js'
import { SectionHeader, Rail, Planned, EmptyState, fmtDate } from '../components/ui.jsx'

const ROLE_STYLES = {
  super_admin: 'bg-accent-50 text-accent-700 border-accent/30',
  verifier: 'bg-info-bg text-info border-info/30',
  support: 'bg-good-bg text-good border-good/30',
  finance: 'bg-amber-bg text-amber-700 border-amber/30',
}

export default function AdminAccounts() {
  const { admins, auditLog } = useData()
  const [roleFilter, setRoleFilter] = useState('all')

  const filtered = roleFilter === 'all' ? admins : admins.filter((a) => a.role === roleFilter)

  return (
    <div>
      <SectionHeader title="Admin accounts" subtitle="Roles and permissions, plus a live audit trail of admin actions." />

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
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
          <div className="space-y-2">
            {filtered.map((a) => (
              <Rail key={a.id} tone="neutral">
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">{a.name}</div>
                    <div className="text-xs text-slate2 mt-0.5">{a.email}</div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${ROLE_STYLES[a.role]}`}>{a.role.replace('_', ' ')}</span>
                    <div className="text-[11px] text-slate2 mt-1">Last login {a.lastLogin === 'now' ? 'now' : fmtDate(a.lastLogin)}</div>
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
                <div key={e.id} className="rounded-lg border border-black/5 bg-white px-3 py-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">{e.action}</span>
                    <span className="text-[11px] text-slate2">{fmtDate(e.at)}</span>
                  </div>
                  <div className="text-xs text-slate2 mt-0.5">{e.target}</div>
                  <div className="text-[11px] text-slate2 mt-0.5">by {e.admin} <span className="capitalize">({e.role.replace('_', ' ')})</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <Planned items={['Two-factor authentication on admin login', 'Automatic session timeout']} />
      </div>
    </div>
  )
}
