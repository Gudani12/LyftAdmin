import React, { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { SignedIn, UserButton, useAuth, useUser } from '@clerk/clerk-react'
import {
  ShieldCheck, Car, Users, MapPin, Siren, Wallet, SlidersHorizontal,
  MessageSquare, KeyRound, BarChart3, FileText, Bell, Search, Building2,
  LayoutDashboard, Archive, Menu, X,
} from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import HopOnLogo from '../assets/hopon.logo.png'

const NAV_GROUPS = [
  {
    label: 'Operations',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
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
      { to: '/archived', label: 'Archived', icon: Archive },
      { to: '/reporting', label: 'Reporting', icon: BarChart3 },
      { to: '/content', label: 'Content', icon: FileText },
      { to: '/hubs', label: 'Hubs', icon: Building2 },
    ],
  },
]

export default function Layout() {
  const { safety, currentAdmin, outageBanner } = useData()
  const { user, isLoaded } = useUser()
  const { signOut } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const openSOS = safety.sos.filter((s) => s.status === 'open').length

  useEffect(() => {
    const idleTimeout = 30 * 60 * 1000
    let timeoutId

    const signOutAfterInactivity = () => {
      signOut({ redirectUrl: '/login?reason=timeout' })
    }

    const resetIdleTimer = () => {
      window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(signOutAfterInactivity, idleTimeout)
    }

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart']
    activityEvents.forEach((eventName) => window.addEventListener(eventName, resetIdleTimer, { passive: true }))
    resetIdleTimer()

    return () => {
      window.clearTimeout(timeoutId)
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, resetIdleTimer))
    }
  }, [signOut])

  useEffect(() => {
    if (!mobileNavOpen) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileNavOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [mobileNavOpen])

  const displayName = user?.fullName || user?.firstName || currentAdmin?.name || 'Admin'
  const initials = (user?.fullName || user?.firstName || currentAdmin?.name || 'Admin')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex min-h-screen bg-white text-ink">
      {mobileNavOpen && <button type="button" aria-label="Close navigation menu" onClick={() => setMobileNavOpen(false)} className="fixed inset-0 z-40 bg-black/50 md:hidden" />}
      <aside className={`${mobileNavOpen ? 'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw]' : 'hidden'} animate-fade-in-up border-r border-white/20 bg-brand-deep text-white shadow-[0_20px_45px_rgba(0,0,0,0.18)] md:relative md:inset-auto md:z-auto md:flex md:w-[260px] md:shrink-0`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(157,78,221,0.24),transparent_40%)]" />
        <div className="relative flex h-full flex-col">
          <div className="border-b border-white/10 px-4 py-4 sm:px-5 sm:py-5">
            <div className="flex items-center gap-3">
              <img src={HopOnLogo} alt="HopOn" className="h-10 w-10 rounded-xl bg-white object-contain p-1" />
              <div className="min-w-0">
                <div className="font-display text-xl font-bold tracking-tight">
                  Hop<span className="text-brand-accent">On</span>
                </div>
                <div className="text-[11px] text-white/45">Admin console</div>
              </div>
              <button type="button" aria-label="Close navigation menu" onClick={() => setMobileNavOpen(false)} className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white md:hidden">
                <X size={19} />
              </button>
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
                      onClick={() => setMobileNavOpen(false)}
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
                          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${isActive ? 'bg-brand-accent/30 text-white' : 'bg-white/5 text-white/75 group-hover:bg-white/10'}`}>
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
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-accent to-brand-dark text-xs font-bold text-white shadow-lg shadow-purple-900/20">
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
          <div className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4 md:gap-6 md:px-6 md:py-3.5">
            <button
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/5 bg-white text-slate2 shadow-sm md:hidden"
            >
              <Menu size={19} />
            </button>
            <div className="relative min-w-0 max-w-xl flex-1">
              <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate2" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search users, drivers, trips..."
                aria-label="Search users, drivers, and trips"
                className="w-full rounded-2xl border border-black/5 bg-[#f5f7f6] py-2.5 pl-9 pr-2 text-xs text-ink shadow-[0_1px_0_rgba(15,23,42,0.02)] outline-none transition focus:border-accent/40 focus:bg-white focus:ring-4 focus:ring-accent/10 sm:pl-10 sm:pr-3 sm:text-sm"
              />
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3 md:gap-4">
              <div className="hidden rounded-full border border-black/5 bg-white px-3 py-1.5 text-sm text-slate2 md:block">
                South Africa &middot; Johannesburg (UTC+2)
              </div>
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-black/5 bg-white text-slate2 shadow-sm transition hover:shadow-md">
                <Bell size={17} />
                {openSOS > 0 && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-bad ring-2 ring-white" />}
              </div>
              <SignedIn>
                <div className="flex items-center gap-2 rounded-full border border-black/5 bg-white px-1.5 py-1 shadow-sm transition hover:shadow-md">
                  <UserButton
                    afterSignOutUrl="/login"
                    appearance={{
                      elements: {
                        avatarBox: 'h-8 w-8',
                        userButtonTrigger: 'border-0 bg-transparent p-0',
                      },
                    }}
                  />
                </div>
              </SignedIn>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto bg-white p-3 sm:p-5 md:p-6">
          <div className="mx-auto max-w-[1600px]">
            {outageBanner && (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber/25 bg-amber-bg px-4 py-3 text-sm text-amber-700 shadow-sm">
                <Bell size={17} className="mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold">{outageBanner.title}</div>
                  <div className="mt-0.5">{outageBanner.message}</div>
                </div>
              </div>
            )}
            <Outlet context={{ searchQuery, setSearchQuery }} />
          </div>
        </main>
      </div>
    </div>
  )
}