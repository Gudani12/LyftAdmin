import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { useData } from './context/DataContext.jsx'
import Layout from './components/Layout.jsx'

const Verification = lazy(() => import('./pages/Verification.jsx'))
const Drivers = lazy(() => import('./pages/Drivers.jsx'))
const UsersPage = lazy(() => import('./pages/Users.jsx'))
const Trips = lazy(() => import('./pages/Trips.jsx'))
const Safety = lazy(() => import('./pages/Safety.jsx'))
const Payments = lazy(() => import('./pages/Payments.jsx'))
const Pricing = lazy(() => import('./pages/Pricing.jsx'))
const Comments = lazy(() => import('./pages/Comments.jsx'))
const AdminAccounts = lazy(() => import('./pages/AdminAccounts.jsx'))
const Reporting = lazy(() => import('./pages/Reporting.jsx'))
const Content = lazy(() => import('./pages/Content.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Archived = lazy(() => import('./pages/Archived.jsx'))
const Hubs = lazy(() => import('./pages/Hubs.jsx'))
const Auth = lazy(() => import('./pages/Auth.jsx'))

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
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-paper text-sm text-slate2">Loading workspace…</div>}>
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
    </Suspense>
  )
}
