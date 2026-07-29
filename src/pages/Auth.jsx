import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { SignIn, SignUp, SignedIn, SignedOut, useAuth, useUser } from '@clerk/clerk-react'
import { supabase } from '../lib/supabaseClient.js'

const AuthShell = ({ children }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white p-8 shadow-xl">
      {children}
    </div>
  </div>
)

const createAdminRecord = async (user) => {
  if (!user) return { error: 'No clerk user available' }

  const adminRecord = {
    clerk_id: user.id,
    email: user.emailAddresses?.[0]?.emailAddress || user.primaryEmailAddress?.emailAddress || user.emailAddress || null,
    full_name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || null,
    role: 'super_admin',
    created_at: new Date().toISOString(),
    last_login_at: new Date().toISOString(),
  }

  const { data, error } = await supabase.from('admin').upsert(adminRecord, { onConflict: ['clerk_id'], returning: 'representation' })
  if (error) {
    console.error('Failed to create admin record', error)
    return { error }
  }
  console.log('Admin record upserted', data)
  return { data }
}

export default function Auth() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const [saveError, setSaveError] = useState(null)
  const [saving, setSaving] = useState(false)

  const route = location.pathname.includes('/register') ? 'register' : 'login'

  useEffect(() => {
    const syncUser = async () => {
      if (isSignedIn && user) {
        setSaveError(null)
        setSaving(true)
        const { error } = await createAdminRecord(user)
        setSaving(false)
        if (error) {
          setSaveError(error.message || JSON.stringify(error))
          return
        }
        navigate('/verification', { replace: true })
      }
    }
    syncUser()
  }, [isSignedIn, user, navigate])

  return (
    <AuthShell>
      <div className="mb-6 text-center">
        <div className="text-sm uppercase tracking-[0.3em] text-slate2">Lyft Admin</div>
        <h1 className="mt-3 text-3xl font-semibold text-ink">{route === 'register' ? 'Create your admin account' : 'Admin login'}</h1>
        <p className="mt-2 text-sm text-slate2">Sign in with Clerk, then your admin profile will be created in Supabase.</p>
      </div>

      <SignedIn>
        <div className="rounded-2xl border border-black/5 bg-emerald-50 p-4 text-sm text-emerald-900">
          <div className="font-medium">Signed in as {user?.fullName || user?.primaryEmailAddress?.emailAddress || user?.emailAddress || 'your account'}</div>
          {user?.primaryEmailAddress?.emailAddress && (
            <div className="text-slate2 text-xs mt-1">{user.primaryEmailAddress.emailAddress}</div>
          )}
          <div className="mt-2">{saving ? 'Saving admin record...' : 'Redirecting...'}</div>
          {saveError && (
            <div className="mt-3 rounded-xl border border-bad/20 bg-bad-bg px-3 py-2 text-sm text-bad">
              Error saving admin record: {saveError}
            </div>
          )}
        </div>
      </SignedIn>

      <SignedOut>
        {route === 'register' ? (
          <SignUp path="/register" routing="path" signInUrl="/login" />
        ) : (
          <SignIn path="/login" routing="path" signUpUrl="/register" />
        )}
      </SignedOut>
    </AuthShell>
  )
}
