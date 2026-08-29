import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { SignedIn, UserButton, useUser } from '@clerk/clerk-react'
import {
  ShieldCheck, Car, Users, MapPin, Siren, Wallet, SlidersHorizontal,
  MessageSquare, KeyRound, BarChart3, FileText, Bell, Search,
  Sparkles,
} from 'lucide-react'
import { useData } from '../context/DataContext.jsx'

const NAV_GROUPS = [
  {
    label: 'Operations',
    items: [
      { to: '/verification', label: 'Verification', icon: ShieldCheck },
      { to: '/drivers', label: 'Drivers', icon: Car },
      { to: '/users', label: 'Users', icon: Users },
      { to: '/trips', label: 'Trips', icon: MapPin },
      { to: '/safety', label: 'Safety', icon: Siren },
    ],
  },
  {
    label: 'Money',
    items: [
      { to: '/payments', label: 'Payments', icon: Wallet },
      { to: '/pricing', label: 'Pricing', icon: SlidersHorizontal },
    ],
  },
  {
    label: 'Admin',
    items: [
      { to: '/comments', label: 'Comments', icon: MessageSquare },
      { to: '/admin-accounts', label: 'Admin accounts', icon: KeyRound },
      { to: '/reporting', label: 'Reporting', icon: BarChart3 },
      { to: '/content', label: 'Content', icon: FileText },
    ],
  },
]

export default function Layout() {
  const { safety, currentAdmin } = useData()
  const { user, isLoaded } = useUser()
  const openSOS = safety.sos.filter((s) => s.status === 'open').length

  const displayName = user?.fullName || user?.firstName || currentAdmin?.name || 'Admin'
  const initials = (user?.fullName || user?.firstName || currentAdmin?.name || 'Admin')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,92,63,0.16),_transparent_25%),linear-gradient(180deg,#eef5f1_0%,#f5f7f6_100%)] text-ink">
      <aside className="animate-fade-in-up relative w-[260px] shrink-0 border-r border-white/20 bg-[#081c16] text-white shadow-[0_20px_45px_rgba(0,0,0,0.18)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(24,126,89,0.28),transparent_40%)]" />
        <div className="relative flex h-full flex-col">
          <div className="border-b border-white/10 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="soft-glow flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm">
                <Sparkles size={18} className="text-mint" />
              </div>
              <div>
                <div className="font-display text-xl font-bold tracking-tight">
                  LYft<span className="text-mint">Admin</span>
                </div>
                <div className="text-[11px] text-white/45">Operations console</div>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="mb-5 last:mb-0">
                <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                  {group.label}
                </div>
                <div className="space-y-1">
                  {group.items.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) =>
                        `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:-translate-x-0.5 ${
                          isActive
                            ? 'bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
                            : 'text-white/65 hover:bg-white/5 hover:text-white'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${isActive ? 'bg-accent/30 text-white' : 'bg-white/5 text-white/75 group-hover:bg-white/10'}`}>
                            <Icon size={16} strokeWidth={2.1} />
                          </span>
                          <span>{label}</span>
                          {label === 'Safety' && openSOS > 0 && (
                            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-bad px-1 text-[10px] font-bold sos-pulse">
                              {openSOS}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-white/10 px-4 py-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-mint to-accent text-xs font-bold text-ink shadow-lg shadow-emerald-500/20">
                  {initials || 'A'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-white">{isLoaded ? displayName : currentAdmin?.name || 'Admin'}</div>
                  <div className="truncate text-[11px] capitalize text-white/55">{currentAdmin?.role?.replace('_', ' ') || 'Administrator'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-black/5 bg-white/75 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-6 px-6 py-3.5">
            <div className="relative flex-1 max-w-xl">
              <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate2" />
              <input
                placeholder="Search users, drivers, trips..."
                className="w-full rounded-2xl border border-black/5 bg-[#f5f7f6] pl-10 pr-3 py-2.5 text-sm text-ink shadow-[0_1px_0_rgba(15,23,42,0.02)] outline-none transition focus:border-accent/40 focus:bg-white focus:ring-4 focus:ring-accent/10"
              />
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="hidden rounded-full border border-black/5 bg-white px-3 py-1.5 text-sm text-slate2 md:block">
                South Africa &middot; Johannesburg (UTC+2)
              </div>
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-black/5 bg-white text-slate2 shadow-sm transition hover:shadow-md">
                <Bell size={17} />
                {openSOS > 0 && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-bad ring-2 ring-white" />}
              </div>
              <SignedIn>
                <div className="flex items-center gap-2 rounded-full border border-black/5 bg-white px-1.5 py-1 shadow-sm transition hover:shadow-md">
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-accent-100 via-emerald-100 to-mint text-xs font-bold text-accent-700">
                    {isLoaded && user?.imageUrl ? (
                      <img src={user.imageUrl} alt={displayName} className="h-full w-full object-cover" />
                    ) : (
                      initials || 'A'
                    )}
                  </div>
                  <span className="hidden text-sm font-medium text-ink md:inline">{isLoaded ? displayName : currentAdmin?.name || 'Admin'}</span>
                  <UserButton afterSignOutUrl="/login" appearance={{ elements: { avatarBox: 'h-8 w-8' } }} />
                </div>
              </SignedIn>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 md:p-6">
          <div className="mx-auto max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}