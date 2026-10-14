import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { useData } from './context/DataContext.jsx'
import Layout from './components/Layout.jsx'
import Verification from './pages/Verification.jsx'
import Drivers from './pages/Drivers.jsx'
import UsersPage from './pages/Users.jsx'
import Trips from './pages/Trips.jsx'
import Safety from './pages/Safety.jsx'
import Payments from './pages/Payments.jsx'
import Pricing from './pages/Pricing.jsx'
import Comments from './pages/Comments.jsx'
import AdminAccounts from './pages/AdminAccounts.jsx'
import Reporting from './pages/Reporting.jsx'
import Content from './pages/Content.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Archived from './pages/Archived.jsx'
import Hubs from './pages/Hubs.jsx'
import Auth from './pages/Auth.jsx'

function RequireAuth({ children }) {
  const { isSignedIn } = useAuth()
  const { adminAccessStatus } = useData()
  if (isSignedIn === undefined) return null
  if (!isSignedIn) return <Navigate to="/login" replace />
  if (adminAccessStatus === 'loading') return <div className="p-8 text-sm text-slate2">Checking administrator access…</div>
  return adminAccessStatus === 'authorized' || adminAccessStatus === 'presentation' ? children : <Navigate to="/login?access=denied" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login/*" element={<Auth />} />
      <Route path="/register/*" element={<Auth />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/verification" element={<Verification />} />
        <Route path="/drivers" element={<Drivers />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/safety" element={<Safety />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/comments" element={<Comments />} />
        <Route path="/admin-accounts" element={<AdminAccounts />} />
        <Route path="/archived" element={<Archived />} />
        <Route path="/reporting" element={<Reporting />} />
        <Route path="/content" element={<Content />} />
        <Route path="/hubs" element={<Hubs />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
