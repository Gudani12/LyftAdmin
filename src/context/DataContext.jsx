import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import {
  initialVerifications, initialUsers, initialTrips,
  initialSafety, initialPayouts, initialFailedPayments, ROLES,
} from '../data/mockData.js'
import { retrySupabaseRequestOnInvalidToken, safetySupabase, setSupabaseAccessTokenProvider, supabase } from '../lib/supabaseClient.js'

const DataContext = createContext(null)
export const useData = () => useContext(DataContext)

const CURRENT_ADMIN = { id: 'adm_5', name: 'You', role: 'super_admin' }
const PRESENTATION_ADMIN_ACCOUNTS = [
  {
    id: 'user_3HDsbBFCEFwD3A2yVg5ZAjDhKgY',
    clerk_id: 'user_3HDsbBFCEFwD3A2yVg5ZAjDhKgY',
    name: 'Gudani Makwarela',
    email: 'gudanimakwarela12@gmail.com',
    role: 'super_admin',
    status: 'active',
  },
  {
    id: 'user_3HByAN5i1Q7LNEuVC6chNZ80FX6',
    clerk_id: 'user_3HByAN5i1Q7LNEuVC6chNZ80FX6',
    name: 'Mulweli',
    email: 'mulw3li1@gmail.com',
    role: 'super_admin',
    status: 'active',
  },
]

const getPresentationAdmin = (clerkUser) => {
  if (!clerkUser) return null

  const clerkId = clerkUser.id || clerkUser.clerk_id
  if (clerkId) {
    const byId = PRESENTATION_ADMIN_ACCOUNTS.find((admin) => admin.clerk_id === clerkId)
    if (byId) return byId
  }

  const email = clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddress || clerkUser.email || ''
  if (!email) return null

  return PRESENTATION_ADMIN_ACCOUNTS.find((admin) => admin.email?.toLowerCase() === email.toLowerCase()) || null
}


const normalizeAdmin = (admin) => ({
  id: admin.id || admin.clerk_id,
  clerk_id: admin.clerk_id,
  name: admin.full_name || admin.name || admin.email || 'Admin',
  email: admin.email || '',
  role: admin.role || 'support',
  status: admin.status || 'active',
  lastLogin: admin.last_login_at || admin.lastLogin || 'now',
})

const isExpired = (value) => value && new Date(value).getTime() < Date.now()

const getDocumentExpiry = (driver, key) => (
  driver.document_expiry?.[key] ||
  driver.document_expiries?.[key] ||
  driver.vehicle_details?.[`${key}_expiry`] ||
  driver.vehicle_details?.[`${key}_expires_at`] ||
  null
)

const normalizeDriver = (driver) => {
  const expiredDocuments = ['drivers_licence', 'pdp', 'vehicle_registration', 'roadworthy', 'insurance']
    .filter((key) => isExpired(getDocumentExpiry(driver, key)))
  const vehicles = Array.isArray(driver.vehicles)
    ? driver.vehicles
    : driver.vehicle_details && typeof driver.vehicle_details === 'object'
      ? [{
          id: `veh_${driver.id}`,
          make: driver.vehicle_details.make || '',
          model: driver.vehicle_details.model || '',
          year: driver.vehicle_details.year || null,
          colour: driver.vehicle_details.colour || '',
          plate: driver.vehicle_details.plate || '',
          seats: driver.vehicle_details.seats || driver.car_seats || 4,
          primary: true,
        }]
      : []

  return {
    id: driver.id,
    name: driver.full_name || `${driver.first_name || ''} ${driver.last_name || ''}`.trim() || driver.email || `Driver ${driver.id}`,
    email: driver.email,
    phone: driver.phone_number,
    status: expiredDocuments.length > 0 && driver.status !== 'archived' ? 'suspended_expired_docs' : (driver.status || 'pending'),
    verified: driver.verified ?? false,
    profile_image_url: driver.profile_image_url,
    driver_license_url: driver.driver_license_url,
    government_id_url: driver.government_id_url,
    vehicle_details: driver.vehicle_details,
    bank_details: driver.bank_details,
    car_image_url: driver.car_image_url,
    car_seats: driver.car_seats,
    total_trips: driver.total_trips,
    verification_percentage: driver.verification_percentage,
    profile_data: driver.profile_data,
    latitude: driver.latitude,
    longitude: driver.longitude,
    is_online: driver.is_online,
    last_location_update: driver.last_location_update,
    clerk_id: driver.clerk_id,
    liveApproved: expiredDocuments.length === 0 && (driver.status === 'live' || driver.status === 'approved'),
    backgroundCheck: driver.background_check_status || (driver.verified ? 'clear' : 'pending'),
    backgroundCheckUpdatedAt: driver.background_check_updated_at || null,
    backgroundCheckProvider: driver.background_check_provider || null,
    vehicles,
    documents: {
      drivers_licence: isExpired(getDocumentExpiry(driver, 'drivers_licence')) ? 'expired' : driver.driver_license_url ? 'approved' : 'pending',
      pdp: isExpired(getDocumentExpiry(driver, 'pdp')) ? 'expired' : driver.government_id_url ? 'approved' : 'pending',
      vehicle_registration: isExpired(getDocumentExpiry(driver, 'vehicle_registration')) ? 'expired' : driver.vehicle_details?.registration_url ? 'approved' : 'pending',
      roadworthy: isExpired(getDocumentExpiry(driver, 'roadworthy')) ? 'expired' : driver.vehicle_details?.roadworthy_url ? 'approved' : 'pending',
      insurance: isExpired(getDocumentExpiry(driver, 'insurance')) ? 'expired' : driver.vehicle_details?.insurance_url ? 'approved' : 'pending',
    },
  }
}

export function DataProvider({ children }) {
  const { user } = useUser()
  const { getToken } = useAuth()
  const [verifications, setVerifications] = useState(initialVerifications)
  const [drivers, setDrivers] = useState([])
  const [users, setUsers] = useState(initialUsers)
  const [trips, setTrips] = useState(initialTrips)
  const [safety, setSafety] = useState({ ...initialSafety, sos: [] })
  const [sosLoading, setSosLoading] = useState(true)
  const [sosError, setSosError] = useState(null)
  const [sosRealtimeStatus, setSosRealtimeStatus] = useState('connecting')
  const [payouts, setPayouts] = useState(initialPayouts)
  const [failedPayments, setFailedPayments] = useState(initialFailedPayments)
  const [admins, setAdmins] = useState([])
  const [currentAdmin, setCurrentAdmin] = useState(CURRENT_ADMIN)
  const [adminAccessStatus, setAdminAccessStatus] = useState('loading')
  const [adminAccessError, setAdminAccessError] = useState(null)
  const [bannedIdentifiers, setBannedIdentifiers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lyft_banned_identifiers') || '[]')
    } catch {
      return []
    }
  })
  const [communicationTemplates, setCommunicationTemplates] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lyft_communication_templates') || 'null') || {
        approved: { subject: 'Document approved', message: 'Your {document} has been approved.' },
        rejected: { subject: 'Document needs attention', message: 'Your {document} was not approved. Reason: {reason}' },
      }
    } catch {
      return {
        approved: { subject: 'Document approved', message: 'Your {document} has been approved.' },
        rejected: { subject: 'Document needs attention', message: 'Your {document} was not approved. Reason: {reason}' },
      }
    }
  })
  const [outageBanner, setOutageBanner] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lyft_outage_banner') || 'null')
    } catch {
      return null
    }
  })
  const [incidentLog, setIncidentLog] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lyft_incident_log') || '[]') } catch { return [] }
  })
  const [tripChats] = useState({
    trp_5501: [
      { id: 'msg_1', sender: 'Lerato Sithole', role: 'rider', message: 'I am at the pickup point.', at: new Date(Date.now() - 12 * 60000).toISOString() },
      { id: 'msg_2', sender: 'Nomvula Khumalo', role: 'driver', message: 'I am two minutes away.', at: new Date(Date.now() - 10 * 60000).toISOString() },
    ],
    trp_5502: [
      { id: 'msg_3', sender: 'Ryan Govender', role: 'rider', message: 'Please take the usual route.', at: new Date(Date.now() - 8 * 60000).toISOString() },
    ],
  })
  const [auditLog, setAuditLog] = useState([])
  const [notifications, setNotifications] = useState([]) // simulated outbound notifications
  const [driversLoading, setDriversLoading] = useState(false)
  const [driversError, setDriversError] = useState(null)
  const [hubs, setHubs] = useState([])
  const [hubsLoading, setHubsLoading] = useState(false)
  const [hubsError, setHubsError] = useState(null)
  const [adminSettings, setAdminSettings] = useState({})
  const [adminSettingsLoading, setAdminSettingsLoading] = useState(true)
  const [adminSettingsError, setAdminSettingsError] = useState(null)

  useEffect(() => {
    setSupabaseAccessTokenProvider((options) => getToken(options))
    return () => setSupabaseAccessTokenProvider(null)
  }, [getToken])

  const loadDrivers = useCallback(async () => {
    setDriversLoading(true)
    setDriversError(null)
    const { data, error } = await retrySupabaseRequestOnInvalidToken(
      () => supabase.from('drivers').select('*')
    )
    if (error) {
      console.error('Failed to load drivers from Supabase', error)
      setDrivers([])
      setDriversError(error)
    } else if (Array.isArray(data)) {
      setDrivers(data.map(normalizeDriver))
    }
    setDriversLoading(false)
  }, [])

  useEffect(() => {
    if (user?.id) loadDrivers()
  }, [loadDrivers, user?.id])

  const loadSOSAlerts = useCallback(async () => {
    setSosLoading(true)
    setSosError(null)
    const { data, error } = await retrySupabaseRequestOnInvalidToken(
      () => safetySupabase.from('safety_alerts').select('*')
    )
    if (error) {
      console.error('Failed to load SOS alerts from Supabase', error)
      setSosError(error)
    } else {
      const alerts = (data || []).map((alert) => ({
        ...alert,
        id: alert.id,
        userId: alert.user_id || alert.passenger_id || alert.driver_id,
        user: alert.user_name || alert.passenger_name || alert.driver_name || alert.user || alert.passenger_id || alert.driver_id || 'Unknown user',
        role: alert.user_role || alert.role || (alert.driver_id ? 'driver' : 'rider'),
        tripId: alert.trip_id || alert.tripId || '—',
        triggeredAt: alert.triggered_at || alert.created_at || alert.inserted_at,
        location: alert.location || alert.address || (Number.isFinite(Number(alert.latitude)) && Number.isFinite(Number(alert.longitude)) ? `${alert.latitude}, ${alert.longitude}` : 'Location unavailable'),
        latitude: alert.latitude,
        longitude: alert.longitude,
        status: alert.status || 'open',
        resolvedNote: alert.resolved_note || alert.resolution_note || null,
        escalationNote: alert.escalation_note || null,
        acknowledgedAt: alert.acknowledged_at || null,
        acknowledgedBy: alert.acknowledged_by || null,
        escalatedAt: alert.escalated_at || null,
        escalatedBy: alert.escalated_by || null,
        resolvedAt: alert.resolved_at || null,
        resolvedBy: alert.resolved_by || null,
      }))
      alerts.sort((a, b) => new Date(b.triggeredAt || 0).getTime() - new Date(a.triggeredAt || 0).getTime())
      setSafety((current) => ({ ...current, sos: alerts }))
    }
    setSosLoading(false)
  }, [])

  useEffect(() => {
    if (!user?.id) {
      setSafety((current) => ({ ...current, sos: [] }))
      setSosError(null)
      setSosLoading(false)
      setSosRealtimeStatus('disconnected')
      return
    }

    loadSOSAlerts()
    const channel = safetySupabase
      .channel('admin-sos-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'safety_alerts' }, loadSOSAlerts)
      .subscribe((status) => {
        setSosRealtimeStatus(status === 'SUBSCRIBED' ? 'connected' : status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED' ? 'disconnected' : 'connecting')
      })
    return () => { supabase.removeChannel(channel) }
  }, [loadSOSAlerts, user?.id])

  useEffect(() => {
    localStorage.setItem('lyft_banned_identifiers', JSON.stringify(bannedIdentifiers))
  }, [bannedIdentifiers])

  useEffect(() => {
    localStorage.setItem('lyft_communication_templates', JSON.stringify(communicationTemplates))
  }, [communicationTemplates])

  useEffect(() => {
    if (outageBanner) localStorage.setItem('lyft_outage_banner', JSON.stringify(outageBanner))
    else localStorage.removeItem('lyft_outage_banner')
  }, [outageBanner])

  useEffect(() => {
    localStorage.setItem('lyft_incident_log', JSON.stringify(incidentLog))
  }, [incidentLog])

  useEffect(() => {
    if (!user?.id) {
      setCurrentAdmin(null)
      setAdminAccessError(null)
      setAdminAccessStatus('signed_out')
      return
    }

    const loadCurrentAdmin = async () => {
      setAdminAccessStatus('loading')
      setAdminAccessError(null)
      const { data, error } = await retrySupabaseRequestOnInvalidToken(
        () => supabase.from('admin').select('*').eq('clerk_id', user.id).maybeSingle()
      )
      if (error) {
        console.error('Failed to load current admin profile from Supabase', error)
        setCurrentAdmin(null)
        setAdminAccessError(error)
        setAdminAccessStatus('error')
        return
      }
      if (!data || !ROLES.includes(data.role) || (data.status || 'active') !== 'active') {
        const presentationAdmin = getPresentationAdmin(user)
        if (import.meta.env.DEV && presentationAdmin) {
          setCurrentAdmin(presentationAdmin)
          setAdmins(PRESENTATION_ADMIN_ACCOUNTS.filter((admin) => admin.role === 'super_admin'))
          setAdminAccessStatus('presentation')
          return
        }
        setCurrentAdmin(null)
        setAdmins([])
        setAdminAccessStatus('denied')
        return
      }

      const admin = normalizeAdmin(data)
      setCurrentAdmin(admin)
      if (admin.role === 'super_admin') {
        const { data: adminRows, error: adminsError } = await supabase.from('admin').select('*').order('created_at', { ascending: false })
        if (adminsError) console.error('Failed to load admin accounts', adminsError)
        setAdmins((adminRows || [data]).map(normalizeAdmin))
      } else {
        setAdmins([admin])
      }
      setAdminAccessStatus('authorized')
    }

    loadCurrentAdmin()
  }, [user?.id])

  const loadAuditLog = useCallback(async () => {
    if (adminAccessStatus !== 'authorized') return { error: new Error('Admin access is required to load the audit log.') }
    const { data, error } = await supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(250)
    if (error) {
      console.error('Failed to load admin audit history', error)
      return { error }
    }
    setAuditLog((data || []).map((entry) => ({
      id: entry.id,
      admin: entry.admin_name,
      role: entry.admin_role,
      action: entry.action,
      target: entry.target,
      at: entry.created_at,
    })))
    return { data }
  }, [adminAccessStatus])

  useEffect(() => {
    if (adminAccessStatus === 'authorized') loadAuditLog()
  }, [adminAccessStatus, loadAuditLog])

  const logAudit = useCallback(async (action, target) => {
    if (adminAccessStatus !== 'authorized' || !user?.id || !currentAdmin) return { error: new Error('Admin access is required to write audit history.') }
    const { data, error } = await supabase.from('admin_audit_log').insert({
      admin_clerk_id: user.id,
      admin_name: currentAdmin.name,
      admin_role: currentAdmin.role,
      action,
      target: String(target ?? ''),
    }).select('*').single()
    if (error) {
      console.error('Failed to persist admin audit event', error)
      return { error }
    }
    setAuditLog((log) => [{
      id: data.id,
      admin: data.admin_name,
      role: data.admin_role,
      action: data.action,
      target: data.target,
      at: data.created_at,
    }, ...log].slice(0, 250))
    return { data }
  }, [adminAccessStatus, currentAdmin, user?.id])

  const loadHubs = useCallback(async () => {
    setHubsLoading(true)
    setHubsError(null)
    const { data, error } = await supabase.from('hubs').select('*').order('name')
    if (error) {
      console.error('Failed to load hubs from Supabase', error)
      setHubsError(error)
    } else {
      setHubs(data || [])
    }
    setHubsLoading(false)
  }, [])

  useEffect(() => {
    if (user?.id) loadHubs()
  }, [loadHubs, user?.id])

  const loadAdminSettings = useCallback(async () => {
    if (!user?.id) return { error: new Error('Sign in to load admin settings.') }
    setAdminSettingsLoading(true)
    const { data, error } = await supabase.from('admin_app_settings').select('key, value')
    if (error) {
      console.error('Failed to load admin settings from Supabase', error)
      setAdminSettingsError(error)
      setAdminSettingsLoading(false)
      return { error }
    }
    setAdminSettingsError(null)
    const settings = Object.fromEntries((data || []).map((setting) => [setting.key, setting.value]))
    setAdminSettings(settings)
    if ('banned_identifiers' in settings) setBannedIdentifiers(settings.banned_identifiers || [])
    if ('communication_templates' in settings) setCommunicationTemplates(settings.communication_templates || {})
    if ('outage_banner' in settings) setOutageBanner(settings.outage_banner)
    if ('incident_log' in settings) setIncidentLog(settings.incident_log || [])
    setAdminSettingsLoading(false)
    return { data }
  }, [user?.id])

  useEffect(() => {
    if (adminAccessStatus === 'authorized') loadAdminSettings()
  }, [adminAccessStatus, loadAdminSettings])

  const saveAdminSetting = useCallback(async (key, value) => {
    if (adminAccessStatus !== 'authorized' || !user?.id) return { error: new Error('Admin access is required to save settings.') }
    const { data, error } = await supabase.from('admin_app_settings')
      .upsert({ key, value, updated_by: user.id, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      .select('key, value')
      .single()
    if (error) {
      console.error(`Failed to save admin setting ${key}`, error)
      return { error }
    }
    setAdminSettings((current) => ({ ...current, [key]: data.value }))
    return { data }
  }, [adminAccessStatus, user?.id])

  useEffect(() => {
    if (adminAccessStatus === 'authorized' && !adminSettingsLoading && !adminSettingsError) {
      saveAdminSetting('banned_identifiers', bannedIdentifiers)
    }
  }, [adminAccessStatus, adminSettingsLoading, adminSettingsError, bannedIdentifiers, saveAdminSetting])

  useEffect(() => {
    if (adminAccessStatus === 'authorized' && !adminSettingsLoading && !adminSettingsError) {
      saveAdminSetting('communication_templates', communicationTemplates)
    }
  }, [adminAccessStatus, adminSettingsLoading, adminSettingsError, communicationTemplates, saveAdminSetting])

  useEffect(() => {
    if (adminAccessStatus === 'authorized' && !adminSettingsLoading && !adminSettingsError) {
      saveAdminSetting('outage_banner', outageBanner)
    }
  }, [adminAccessStatus, adminSettingsLoading, adminSettingsError, outageBanner, saveAdminSetting])

  useEffect(() => {
    if (adminAccessStatus === 'authorized' && !adminSettingsLoading && !adminSettingsError) {
      saveAdminSetting('incident_log', incidentLog)
    }
  }, [adminAccessStatus, adminSettingsLoading, adminSettingsError, incidentLog, saveAdminSetting])

  const createHub = useCallback(async (hub) => {
    const { data, error } = await supabase.from('hubs').insert(hub).select().single()
    if (error) return { error }
    setHubs((list) => [...list, data].sort((a, b) => a.name.localeCompare(b.name)))
    logAudit('Created hub', data.name)
    return { data }
  }, [logAudit])

  const updateHub = useCallback(async (id, changes) => {
    const { data, error } = await supabase.from('hubs').update({ ...changes, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) return { error }
    setHubs((list) => list.map((hub) => hub.id === id ? data : hub).sort((a, b) => a.name.localeCompare(b.name)))
    logAudit(changes.status ? `${changes.status === 'active' ? 'Enabled' : 'Disabled'} hub` : 'Updated hub', data.name)
    return { data }
  }, [logAudit])

  const deleteHub = useCallback(async (id) => {
    const hub = hubs.find((item) => item.id === id)
    const { error } = await supabase.from('hubs').delete().eq('id', id)
    if (error) return { error }
    setHubs((list) => list.filter((item) => item.id !== id))
    logAudit('Deleted hub', hub?.name || id)
    return {}
  }, [hubs, logAudit])

  const notify = useCallback((userName, title, body) => {
    setNotifications((n) => [
      { id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, userName, title, body, at: new Date().toISOString() },
      ...n,
    ])
  }, [])

  const decideVerification = useCallback((id, decision, reason) => {
    setVerifications((list) => list.map((v) => {
      if (v.id !== id) return v
      const decidedAt = new Date().toISOString()
      const updated = {
        ...v,
        status: decision,
        decidedAt,
        decidedBy: `${currentAdmin.role}: ${currentAdmin.name}`,
        decisionReason: decision === 'rejected' ? reason : null,
        resubmissionHistory: decision === 'rejected'
          ? [...(v.resubmissionHistory || []), { at: decidedAt, reason, by: `${currentAdmin.role}: ${currentAdmin.name}` }]
          : v.resubmissionHistory,
      }
      return updated
    }))
    const v = verifications.find((x) => x.id === id)
    if (v) {
      logAudit(decision === 'approved' ? 'Approved verification' : 'Rejected verification', `${v.userName} — ${v.docType} (${id})`)
      notify(
        v.userName,
        decision === 'approved' ? 'Document approved' : 'Document rejected',
        decision === 'approved'
          ? `Your ${v.docType.replace(/_/g, ' ')} has been approved.`
          : `Your ${v.docType.replace(/_/g, ' ')} was rejected. Reason: ${reason}`
      )
    }
  }, [verifications, currentAdmin, logAudit, notify])

  const bulkApprove = useCallback((ids) => {
    setVerifications((list) => list.map((v) => ids.includes(v.id) ? { ...v, status: 'approved', decidedAt: new Date().toISOString(), decidedBy: `${CURRENT_ADMIN.role}: ${CURRENT_ADMIN.name}` } : v))
    logAudit('Bulk approved verifications', `${ids.length} low-risk items`)
    ids.forEach((id) => {
      const v = verifications.find((x) => x.id === id)
      if (v) notify(v.userName, 'Document approved', `Your ${v.docType.replace(/_/g, ' ')} has been approved.`)
    })
  }, [verifications, logAudit, notify])

  const setDriverLive = useCallback(async (driverId, live) => {
    const status = live ? 'live' : 'revoked'
    const updatePayload = {
      status,
      verified: live,
      is_online: live,
      last_location_update: new Date().toISOString(),
    }

    const { error } = await supabase.from('drivers').update(updatePayload).eq('id', driverId)
    if (error) {
      console.error('Failed to update driver live status in Supabase', error)
      return { error }
    }

    setDrivers((list) => list.map((d) => d.id === driverId ? {
      ...d,
      liveApproved: live,
      status,
      verified: live,
      is_online: live,
      last_location_update: updatePayload.last_location_update,
    } : d))

    const d = drivers.find((x) => x.id === driverId)
    logAudit(live ? 'Approved driver to go live' : 'Revoked driver', d?.name || driverId)
    if (d) notify(d.name, live ? 'You are approved to drive' : 'Driving access revoked', live ? 'You can now go online and accept trips.' : 'Your ability to accept trips has been revoked. Contact support for details.')
    return {}
  }, [drivers, logAudit, notify])

  const setUserStatus = useCallback((userId, status, reason) => {
    setUsers((list) => list.map((u) => u.id === userId ? { ...u, status, notes: reason ? [...u.notes, `${status === 'suspended' ? 'Suspended' : 'Reactivated'}: ${reason} (${new Date().toLocaleString()})`] : u.notes } : u))
    const u = users.find((x) => x.id === userId)
    logAudit(status === 'suspended' ? 'Suspended account' : 'Reactivated account', `${u?.name || userId}${reason ? ' — ' + reason : ''}`)
    if (u) notify(u.name, status === 'suspended' ? 'Account suspended' : 'Account reactivated', reason || '')
  }, [users, logAudit, notify])

  const addUserNote = useCallback((userId, note) => {
    setUsers((list) => list.map((u) => u.id === userId ? { ...u, notes: [...u.notes, note] } : u))
    logAudit('Added admin note', userId)
  }, [logAudit])

  const banIdentifier = useCallback((type, value, reason, target) => {
    const normalizedValue = type === 'phone' ? value.replace(/\s/g, '') : value.trim()
    if (!normalizedValue) return
    const ban = {
      id: `ban_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      value: normalizedValue,
      reason,
      target,
      createdAt: new Date().toISOString(),
      createdBy: currentAdmin.name,
    }
    setBannedIdentifiers((list) => list.some((item) => item.type === type && item.value === normalizedValue) ? list : [ban, ...list])
    logAudit(`Banned ${type}`, `${normalizedValue}${reason ? ' — ' + reason : ''}`)
  }, [currentAdmin?.name, logAudit])

  const unbanIdentifier = useCallback((banId) => {
    const ban = bannedIdentifiers.find((item) => item.id === banId)
    setBannedIdentifiers((list) => list.filter((item) => item.id !== banId))
    if (ban) logAudit(`Removed ${ban.type} ban`, ban.value)
  }, [bannedIdentifiers, logAudit])

  const handleDeletionRequest = useCallback((userId, approve) => {
    setUsers((list) => list.map((u) => u.id === userId ? { ...u, deletionRequested: false, status: approve ? 'deleted' : u.status } : u))
    logAudit(approve ? 'Approved account deletion' : 'Declined deletion request', userId)
  }, [logAudit])

  const archiveUser = useCallback((userId, reason) => {
    setUsers((list) => list.map((u) => u.id === userId ? { ...u, status: 'archived', notes: reason ? [...u.notes, `Archived: ${reason} (${new Date().toLocaleString()})`] : u.notes } : u))
    const u = users.find((x) => x.id === userId)
    logAudit('Archived user account', `${u?.name || userId}${reason ? ' — ' + reason : ''}`)
  }, [users, logAudit])

  const restoreUser = useCallback((userId) => {
    setUsers((list) => list.map((u) => u.id === userId ? { ...u, status: 'active', notes: [...u.notes, `Restored: active state reinstated (${new Date().toLocaleString()})`] } : u))
    const u = users.find((x) => x.id === userId)
    logAudit('Restored user account', u?.name || userId)
  }, [users, logAudit])

  const deleteUser = useCallback((userId) => {
    setUsers((list) => {
      const removed = list.find((u) => u.id === userId)
      if (removed) logAudit('Deleted user account', removed.name)
      return list.filter((u) => u.id !== userId)
    })
  }, [logAudit])

  const deleteAdmin = useCallback(async (adminId) => {
    const admin = admins.find((item) => item.id === adminId)
    if (!admin?.clerk_id) return { error: new Error('Admin account was not found.') }
    const { error } = await supabase.from('admin').delete().eq('clerk_id', admin.clerk_id)
    if (error) return { error }
    setAdmins((list) => list.filter((item) => item.id !== adminId))
    logAudit('Deleted admin account', `${admin.name} (${admin.role})`)
    return {}
  }, [admins, logAudit])

  const archiveAdmin = useCallback(async (adminId, reason) => {
    const admin = admins.find((item) => item.id === adminId)
    if (!admin?.clerk_id) return { error: new Error('Admin account was not found.') }
    const archivedAt = new Date().toISOString()
    const { error } = await supabase.from('admin').update({ status: 'archived', archive_reason: reason, archived_at: archivedAt }).eq('clerk_id', admin.clerk_id)
    if (error) return { error }
    setAdmins((list) => list.map((item) => item.id === adminId ? { ...item, status: 'archived', archiveReason: reason, archivedAt } : item))
    logAudit('Archived admin account', `${admin.name}${reason ? ` — ${reason}` : ''}`)
    return {}
  }, [admins, logAudit])

  const restoreAdmin = useCallback(async (adminId) => {
    const admin = admins.find((item) => item.id === adminId)
    if (!admin?.clerk_id) return { error: new Error('Admin account was not found.') }
    const { error } = await supabase.from('admin').update({ status: 'active', archive_reason: null, archived_at: null }).eq('clerk_id', admin.clerk_id)
    if (error) return { error }
    setAdmins((list) => list.map((item) => item.id === adminId ? { ...item, status: 'active', archiveReason: null, archivedAt: null } : item))
    logAudit('Restored admin account', admin.name)
    return {}
  }, [admins, logAudit])

  const archiveDriver = useCallback(async (driverId, reason) => {
    const { error } = await supabase.from('drivers').update({ status: 'archived', is_online: false }).eq('id', driverId)
    if (error) return { error }
    setDrivers((list) => list.map((driver) => driver.id === driverId ? {
      ...driver,
      status: 'archived',
      liveApproved: false,
      is_online: false,
      notes: reason ? [...(driver.notes || []), `Archived: ${reason} (${new Date().toLocaleString()})`] : (driver.notes || []),
    } : driver))
    const driver = drivers.find((item) => item.id === driverId)
    logAudit('Archived driver account', `${driver?.name || driverId}${reason ? ` — ${reason}` : ''}`)
    return {}
  }, [drivers, logAudit])

  const restoreDriver = useCallback(async (driverId) => {
    const { error } = await supabase.from('drivers').update({ status: 'pending_review', is_online: false }).eq('id', driverId)
    if (error) return { error }
    setDrivers((list) => list.map((driver) => driver.id === driverId ? {
      ...driver,
      status: 'pending_review',
      liveApproved: false,
      is_online: false,
      notes: [...(driver.notes || []), `Restored: pending review reinstated (${new Date().toLocaleString()})`],
    } : driver))
    const driver = drivers.find((item) => item.id === driverId)
    logAudit('Restored driver account', driver?.name || driverId)
    return {}
  }, [drivers, logAudit])

  const deleteDriver = useCallback(async (driverId) => {
    const { error } = await supabase.from('drivers').delete().eq('id', driverId)
    if (error) {
      console.error('Failed to delete driver from Supabase', error)
      return { error }
    }
    setDrivers((list) => {
      const removed = list.find((d) => d.id === driverId)
      if (removed) logAudit('Deleted driver', removed.name)
      return list.filter((d) => d.id !== driverId)
    })
    return {}
  }, [logAudit])

  const updateSOSStatus = useCallback(async (id, status, note = '') => {
    const now = new Date().toISOString()
    const update = { status }
    if (status === 'acknowledged') Object.assign(update, { acknowledged_at: now, acknowledged_by: currentAdmin.name })
    if (status === 'escalated') Object.assign(update, { escalated_at: now, escalated_by: currentAdmin.name, escalation_note: note || null })
    if (status === 'resolved') Object.assign(update, { resolved_at: now, resolved_by: currentAdmin.name, resolved_note: note })
    const { error } = await safetySupabase.from('safety_alerts').update(update).eq('id', id)
    if (error) {
      console.error(`Failed to set SOS alert status to ${status}`, error)
      setSosError(error)
      return { error }
    }
    setSosError(null)
    setSafety((current) => ({ ...current, sos: current.sos.map((alert) => alert.id === id ? {
      ...alert,
      status,
      ...(status === 'acknowledged' ? { acknowledgedAt: now, acknowledgedBy: currentAdmin.name } : {}),
      ...(status === 'escalated' ? { escalatedAt: now, escalatedBy: currentAdmin.name, escalationNote: note } : {}),
      ...(status === 'resolved' ? { resolvedAt: now, resolvedBy: currentAdmin.name, resolvedNote: note } : {}),
    } : alert) }))
    logAudit(`${status === 'acknowledged' ? 'Acknowledged' : status === 'escalated' ? 'Escalated' : 'Resolved'} SOS alert`, `${id}${note ? ` — ${note}` : ''}`)
    return {}
  }, [currentAdmin?.name, logAudit])

  const acknowledgeSOS = useCallback((id) => updateSOSStatus(id, 'acknowledged'), [updateSOSStatus])
  const escalateSOS = useCallback((id, note) => updateSOSStatus(id, 'escalated', note), [updateSOSStatus])
  const resolveSOS = useCallback((id, note) => updateSOSStatus(id, 'resolved', note), [updateSOSStatus])

  const forceEndTrip = useCallback((tripId) => {
    setTrips((list) => list.map((t) => t.id === tripId ? { ...t, status: 'completed', endedAt: new Date().toISOString(), forceEnded: true } : t))
    logAudit('Force-ended trip', tripId)
  }, [logAudit])

  const refundTrip = useCallback((tripId) => {
    logAudit('Refunded trip', tripId)
  }, [logAudit])

  const retryFailedPayment = useCallback((id) => {
    setFailedPayments((list) => list.map((p) => p.id === id ? { ...p, retries: p.retries + 1 } : p))
    logAudit('Retried failed payment', id)
  }, [logAudit])

  const sendPushToUser = useCallback((userName, title, body) => {
    notify(userName, title, body)
    logAudit('Sent push notification', `${userName} — ${title}`)
  }, [notify, logAudit])

  const sendExpiryDigest = useCallback((items) => {
    const activeAdmins = admins.filter((admin) => (admin.status || 'active') === 'active')
    const summary = items.map((item) => `${item.userName} — ${item.docType.replace(/_/g, ' ')} expires ${new Date(item.expiresAt).toLocaleDateString('en-ZA')}`).join('; ')
    activeAdmins.forEach((admin) => notify(admin.name, 'Document expiry digest', `${items.length} approved document(s) expire within 30 days. ${summary}`))
    logAudit('Sent document expiry digest', `${items.length} expiring documents to ${activeAdmins.length} admins`)
    return activeAdmins.length
  }, [admins, notify, logAudit])

  const broadcastToSegment = useCallback((segment, city, title, body) => {
    const audience = segment === 'drivers'
      ? users.filter((user) => user.role === 'driver')
      : users.filter((user) => !city || user.city?.toLowerCase() === city.toLowerCase())
    audience.forEach((user) => notify(user.name, title, body))
    logAudit('Broadcast notification', `${title} — ${segment}${city ? ` in ${city}` : ''} (${audience.length} recipients)`)
    return audience.length
  }, [users, notify, logAudit])

  const saveCommunicationTemplate = useCallback((outcome, template) => {
    setCommunicationTemplates((current) => ({ ...current, [outcome]: template }))
    logAudit('Updated notification template', `${outcome} verification outcome`)
  }, [logAudit])

  const publishOutageBanner = useCallback((banner) => {
    const nextBanner = { ...banner, id: `banner_${Date.now()}`, publishedAt: new Date().toISOString() }
    setOutageBanner(nextBanner)
    logAudit('Published outage banner', banner.title)
  }, [logAudit])

  const clearOutageBanner = useCallback(() => {
    if (outageBanner) logAudit('Cleared outage banner', outageBanner.title)
    setOutageBanner(null)
  }, [outageBanner, logAudit])

  const recordIncident = useCallback((incident) => {
    const entry = { ...incident, id: `inc_${Date.now()}`, recordedAt: new Date().toISOString(), recordedBy: currentAdmin.name }
    setIncidentLog((list) => [entry, ...list])
    logAudit('Recorded safety incident outcome', `${incident.tripId} — ${incident.outcome}`)
  }, [currentAdmin?.name, logAudit])

  const value = {
    currentAdmin, adminAccessStatus, adminAccessError, loadAuditLog,
    adminSettings, adminSettingsLoading, adminSettingsError, loadAdminSettings, saveAdminSetting,
    verifications, drivers, users, trips, safety, payouts, failedPayments, admins, auditLog, notifications,
    decideVerification, bulkApprove, setDriverLive, setUserStatus, addUserNote, handleDeletionRequest,
    archiveUser, archiveDriver, restoreUser, restoreDriver, deleteUser, deleteDriver, archiveAdmin, restoreAdmin, deleteAdmin,
    bannedIdentifiers, banIdentifier, unbanIdentifier,
    communicationTemplates, saveCommunicationTemplate, broadcastToSegment, sendExpiryDigest,
    outageBanner, publishOutageBanner, clearOutageBanner,
    incidentLog, recordIncident, tripChats,
    acknowledgeSOS, escalateSOS, resolveSOS, sosLoading, sosError, sosRealtimeStatus, loadSOSAlerts,
    forceEndTrip, refundTrip, retryFailedPayment, sendPushToUser, logAudit,
    driversLoading, driversError,
    hubs, hubsLoading, hubsError, loadHubs, createHub, updateHub, deleteHub,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
