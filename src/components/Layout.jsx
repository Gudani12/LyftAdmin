import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  ShieldCheck, Car, Users, MapPin, Siren, Wallet, SlidersHorizontal,
  MessageSquare, KeyRound, BarChart3, FileText, Bell, Search, ChevronDown,
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
      { to: '/comms', label: 'Comms', icon: MessageSquare },
      { to: '/admin-accounts', label: 'Admin accounts', icon: KeyRound },
      { to: '/reporting', label: 'Reporting', icon: BarChart3 },
      { to: '/content', label: 'Content', icon: FileText },
    ],
  },
]

export default function Layout() {
  const { currentAdmin, safety } = useData()
  const openSOS = safety.sos.filter((s) => s.status === 'open').length

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 bg-ink text-white flex flex-col">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="font-display text-xl font-bold tracking-tight">
            LYft<span className="text-accent">Admin</span>
          </div>
          <div className="text-[11px] text-white/40 mt-0.5">Operations console</div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-4 last:mb-0">
              <div className="px-5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/30">
                {group.label}
              </div>
              {group.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `mx-2 mb-0.5 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition relative ${
                      isActive ? 'bg-white/10 text-white font-medium' : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <Icon size={16} strokeWidth={2} />
                  {label}
                  {label === 'Safety' && openSOS > 0 && (
                    <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-bad text-[10px] font-bold sos-pulse">
                      {openSOS}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-white/10 text-xs text-white/50">
          Signed in as <span className="text-white/90 font-medium">{currentAdmin.name}</span>
          <div className="mt-0.5 capitalize">{currentAdmin.role.replace('_', ' ')}</div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 border-b border-black/5 bg-white flex items-center justify-between px-6 gap-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate2" />
            <input
              placeholder="Search users, drivers, trips..."
              className="w-full rounded-md border border-black/10 bg-paper pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-sm text-slate2">South Africa &middot; Johannesburg (UTC+2)</div>
            <div className="relative">
              <Bell size={18} className="text-slate2" />
              {openSOS > 0 && <span className="absolute -top-1.5 -right-1.5 h-2.5 w-2.5 rounded-full bg-bad" />}
            </div>
            <button className="flex items-center gap-1.5 hover:bg-black/5 rounded-full pr-1.5 py-0.5 transition">
              <div className="h-8 w-8 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center text-xs font-semibold">
                {currentAdmin.name.split(' ').map((s) => s[0]).join('').slice(0, 2)}
              </div>
              <ChevronDown size={14} className="text-slate2" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-paper">
          <Outlet />
        </main>
      </div>
    </div>
  )
}