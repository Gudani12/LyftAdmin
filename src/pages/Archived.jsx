import React from 'react'
import { ArchiveRestore, FileWarning, Users, Car } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { Card, SectionHeader, EmptyState, Button } from '../components/ui.jsx'

export default function Archived() {
  const { users, drivers, restoreUser, restoreDriver } = useData()

  const archivedUsers = users.filter((u) => u.status === 'archived')
  const archivedDrivers = drivers.filter((d) => d.status === 'archived')

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Archived records"
        subtitle="Review suspended or archived accounts before restoring or permanently removing them."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard title="Archived users" value={archivedUsers.length} tone="info" icon={Users} />
        <StatCard title="Archived drivers" value={archivedDrivers.length} tone="warn" icon={Car} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-display text-xl font-semibold text-ink">Users</h2>
          {archivedUsers.length === 0 ? (
            <EmptyState title="No archived users" hint="Archived accounts will appear here for review." />
          ) : (
            <div className="space-y-3">
              {archivedUsers.map((u) => (
                <Card key={u.id} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-ink">{u.name}</div>
                      <div className="mt-1 text-xs text-slate2">{u.email}</div>
                    </div>
                    <Button variant="accent" className="!px-2 !py-1 text-xs" onClick={() => restoreUser(u.id)}>
                      <ArchiveRestore size={12} />
                      Restore
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-semibold text-ink">Drivers</h2>
          {archivedDrivers.length === 0 ? (
            <EmptyState title="No archived drivers" hint="Archived driver accounts will appear here for review." />
          ) : (
            <div className="space-y-3">
              {archivedDrivers.map((d) => (
                <Card key={d.id} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-ink">{d.name}</div>
                      <div className="mt-1 text-xs text-slate2">{d.email || d.phone || 'Driver profile'}</div>
                    </div>
                    <Button variant="accent" className="!px-2 !py-1 text-xs" onClick={() => restoreDriver(d.id)}>
                      <ArchiveRestore size={12} />
                      Restore
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Card className="border-amber/25 bg-amber-bg p-4">
        <div className="flex items-start gap-3">
          <FileWarning className="mt-0.5 text-amber-700" size={18} />
          <p className="text-sm text-amber-700">
            Permanent deletion is reserved for the Super Admin and should only be used after an archive review and documented reason.
          </p>
        </div>
      </Card>
    </div>
  )
}

function StatCard({ title, value, tone, icon: Icon }) {
  const tones = {
    info: 'border-info/20 bg-info-bg text-info',
    warn: 'border-amber/20 bg-amber-bg text-amber-700',
  }

  return (
    <Card className={`p-4 ${tones[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em]">{title}</div>
          <div className="mt-2 font-display text-3xl font-semibold tracking-tight">{value}</div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 ring-1 ring-black/5">
          <Icon size={18} />
        </div>
      </div>
    </Card>
  )
}
