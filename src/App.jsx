import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
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
import Auth from './pages/Auth.jsx'

function RequireAuth({ children }) {
  const { isSignedIn } = useAuth()
  if (isSignedIn === undefined) return null
  return isSignedIn ? children : <Navigate to="/login" replace />
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
        <Route index element={<Navigate to="/verification" replace />} />
        <Route path="/verification" element={<Verification />} />
        <Route path="/drivers" element={<Drivers />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/safety" element={<Safety />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/comments" element={<Comments />} />
        <Route path="/admin-accounts" element={<AdminAccounts />} />
        <Route path="/reporting" element={<Reporting />} />
        <Route path="/content" element={<Content />} />
        <Route path="*" element={<Navigate to="/verification" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
