import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { SignIn, SignUp, SignedIn, SignedOut, useAuth, useUser } from '@clerk/clerk-react'
import { useData } from '../context/DataContext.jsx'
import HopOnLogo from '../assets/hopon.logo.png'

const AuthShell = ({ children }) => (
  <div className="min-h-screen bg-brand-deep flex items-center justify-center p-4">
    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-8 shadow-[0_30px_80px_rgba(29,17,53,0.35)]">
      {children}
    </div>
  </div>
)

export default function Auth() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const { adminAccessStatus, adminAccessError } = useData()

  const route = location.pathname.includes('/register') ? 'register' : 'login'

  useEffect(() => {
    if (isSignedIn && user && ['authorized', 'presentation'].includes(adminAccessStatus)) {
      navigate('/dashboard', { replace: true })
    }
  }, [isSignedIn, user, adminAccessStatus, navigate])

  return (
    <AuthShell>
      <div className="mb-6 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <img src={HopOnLogo} alt="HopOn" className="h-10 w-10 object-contain" />
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-slate2">HopOn</span>
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-ink">{route === 'register' ? 'Create your admin account' : 'Admin login'}</h1>
        <p className="mt-2 text-sm text-slate2">Sign in with your pre-authorized admin account. Multi-factor challenges are handled by Clerk when enabled for this admin workspace.</p>
      </div>

      <SignedIn>
        <div className="rounded-2xl border border-brand-accent/20 bg-brand-accent/10 p-4 text-sm text-ui-ink">
          <div className="font-medium">Signed in as {user?.fullName || user?.primaryEmailAddress?.emailAddress || user?.emailAddress || 'your account'}</div>
          {user?.primaryEmailAddress?.emailAddress && (
            <div className="mt-1 text-xs text-ui-muted">{user.primaryEmailAddress.emailAddress}</div>
          )}
          {user?.id && <div className="mt-2 font-mono text-xs text-brand-dark">Clerk user ID: {user.id}</div>}
          <div className="mt-2 text-ui-muted">{adminAccessStatus === 'loading' ? 'Checking administrator access…' : adminAccessStatus === 'authorized' ? 'Access granted. Redirecting…' : adminAccessStatus === 'presentation' ? 'Local presentation access. Database permissions are still enforced by Supabase.' : adminAccessStatus === 'error' ? `Could not verify your admin profile: ${adminAccessError?.message || 'Supabase request failed'}. Check admin-table read access and apply the admin settings migration.` : 'No active admin profile with a recognized role was found for this Clerk account. Ask a super administrator to verify the Clerk ID and role in Supabase.'}</div>
        </div>
      </SignedIn>

      <SignedOut>
        {route === 'register' ? (
          <SignUp path="/register" routing="path" signInUrl="/login" appearance={{ elements: { headerTitle: 'hidden' } }} />
        ) : (
          <SignIn path="/login" routing="path" signUpUrl="/register" appearance={{ elements: { headerTitle: 'hidden' } }} />
        )}
      </SignedOut>
    </AuthShell>
  )
}
