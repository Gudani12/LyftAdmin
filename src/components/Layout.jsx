import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  ShieldCheck, Car, Users, MapPin, Siren, Wallet, SlidersHorizontal,
  MessageSquare, KeyRound, BarChart3, FileText, Bell,
} from 'lucide-react'
import { useData } from '../context/DataContext.jsx'

const NAV = [
  { to: '/verification', label: 'Verification', icon: ShieldCheck },
  { to: '/drivers', label: 'Drivers', icon: Car },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/trips', label: 'Trips', icon: MapPin },
  { to: '/safety', label: 'Safety', icon: Siren },
  { to: '/payments', label: 'Payments', icon: Wallet },
  { to: '/pricing', label: 'Pricing', icon: SlidersHorizontal },
  { to: '/comments', label: 'Comments', icon: MessageSquare },
  { to: '/admin-accounts', label: 'Admin accounts', icon: KeyRound },
  { to: '/reporting', label: 'Reporting', icon: BarChart3 },
  { to: '/content', label: 'Content', icon: FileText },
]

export default function Layout() {
  const { currentAdmin, safety } = useData()
  const openSOS = safety.sos.filter((s) => s.status === 'open').length

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 bg-deep text-white flex flex-col">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="font-display text-xl font-bold tracking-tight">
            Lyft<span className="text-accent">Admin</span>
          </div>
          <div className="text-[11px] text-white/40 mt-0.5">Operations console</div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {NAV.map(({ to, label, icon: Icon }) => (
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
        </nav>
        <div className="px-5 py-4 border-t border-white/10 text-xs text-white/50">
          Signed in as <span className="text-white/90 font-medium">{currentAdmin.name}</span>
          <div className="mt-0.5 capitalize">{currentAdmin.role.replace('_', ' ')}</div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 border-b border-black/5 bg-white flex items-center justify-between px-6">
          <div className="text-sm text-slate2">South Africa &middot; Johannesburg (UTC+2)</div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell size={18} className="text-slate2" />
              {openSOS > 0 && <span className="absolute -top-1.5 -right-1.5 h-2.5 w-2.5 rounded-full bg-bad" />}
            </div>
            <div className="h-8 w-8 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center text-xs font-semibold">
              {currentAdmin.name.split(' ').map((s) => s[0]).join('').slice(0, 2)}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-paper">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
