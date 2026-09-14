import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import {
  initialVerifications, initialUsers, initialTrips,
  initialSafety, initialPayouts, initialFailedPayments, initialAdmins,
} from '../data/mockData.js'
import { supabase } from '../lib/supabaseClient.js'

const DataContext = createContext(null)
export const useData = () => useContext(DataContext)

const CURRENT_ADMIN = { id: 'adm_5', name: 'You', role: 'super_admin' }

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
  const [verifications, setVerifications] = useState(initialVerifications)
  const [drivers, setDrivers] = useState([])
  const [users, setUsers] = useState(initialUsers)
  const [trips, setTrips] = useState(initialTrips)
  const [safety, setSafety] = useState(initialSafety)
  const [payouts, setPayouts] = useState(initialPayouts)
  const [failedPayments, setFailedPayments] = useState(initialFailedPayments)
  const [admins, setAdmins] = useState(initialAdmins)
  const [currentAdmin, setCurrentAdmin] = useState(CURRENT_ADMIN)
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

  const loadDrivers = useCallback(async () => {
    setDriversLoading(true)
    setDriversError(null)
    const { data, error } = await supabase.from('drivers').select('*')
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
    loadDrivers()
  }, [loadDrivers])

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
    if (!user?.id) return

    const loadCurrentAdmin = async () => {
      const { data, error } = await supabase.from('admin').select('*').eq('clerk_id', user.id).maybeSingle()
      if (error) {
        console.error('Failed to load current admin profile from Supabase', error)
        return
      }
      if (!data) return

      const admin = normalizeAdmin(data)
      setCurrentAdmin(admin)
      setAdmins((list) => [admin, ...list.filter((item) => item.id !== CURRENT_ADMIN.id && item.clerk_id !== admin.clerk_id && item.id !== admin.id)])
    }

    loadCurrentAdmin()
  }, [user?.id])

  const logAudit = useCallback((action, target) => {
    setAuditLog((log) => [
      { id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, admin: currentAdmin.name, role: currentAdmin.role, action, target, at: new Date().toISOString() },
      ...log,
    ])
  }, [currentAdmin])

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
    loadHubs()
  }, [loadHubs])

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
  }, [currentAdmin.name, logAudit])

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

  const deleteAdmin = useCallback((adminId) => {
    setAdmins((list) => {
      const removed = list.find((a) => a.id === adminId)
      if (removed) logAudit('Deleted admin account', `${removed.name} (${removed.role})`)
      return list.filter((a) => a.id !== adminId)
    })
  }, [logAudit])

  const archiveAdmin = useCallback((adminId, reason) => {
    setAdmins((list) => list.map((a) => a.id === adminId ? {
      ...a,
      status: 'archived',
      archiveReason: reason,
      archivedAt: new Date().toISOString(),
    } : a))
    const admin = admins.find((a) => a.id === adminId)
    logAudit('Archived admin account', `${admin?.name || adminId}${reason ? ' — ' + reason : ''}`)
  }, [admins, logAudit])

  const restoreAdmin = useCallback((adminId) => {
    setAdmins((list) => list.map((a) => a.id === adminId ? {
      ...a,
      status: 'active',
      archiveReason: null,
      archivedAt: null,
    } : a))
    const admin = admins.find((a) => a.id === adminId)
    logAudit('Restored admin account', admin?.name || adminId)
  }, [admins, logAudit])

  const archiveDriver = useCallback((driverId, reason) => {
    setDrivers((list) => list.map((d) => d.id === driverId ? {
      ...d,
      status: 'archived',
      liveApproved: false,
      is_online: false,
      backgroundCheck: 'pending',
      notes: reason ? [...(d.notes || []), `Archived: ${reason} (${new Date().toLocaleString()})`] : (d.notes || []),
    } : d))
    const d = drivers.find((x) => x.id === driverId)
    logAudit('Archived driver account', `${d?.name || driverId}${reason ? ' — ' + reason : ''}`)
  }, [drivers, logAudit])

  const restoreDriver = useCallback((driverId) => {
    setDrivers((list) => list.map((d) => d.id === driverId ? {
      ...d,
      status: 'pending_review',
      liveApproved: false,
      is_online: false,
      backgroundCheck: 'pending',
      notes: [...(d.notes || []), `Restored: pending review reinstated (${new Date().toLocaleString()})`],
    } : d))
    const d = drivers.find((x) => x.id === driverId)
    logAudit('Restored driver account', d?.name || driverId)
  }, [drivers, logAudit])

  const deleteDriver = useCallback(async (driverId) => {
    const { error } = await supabase.from('drivers').delete().eq('id', driverId)
    if (error) {
      console.error('Failed to delete driver from Supabase', error)
      return
    }
    setDrivers((list) => {
      const removed = list.find((d) => d.id === driverId)
      if (removed) logAudit('Deleted driver', removed.name)
      return list.filter((d) => d.id !== driverId)
    })
  }, [logAudit])

  const acknowledgeSOS = useCallback((id) => {
    setSafety((s) => ({ ...s, sos: s.sos.map((x) => x.id === id ? { ...x, status: 'acknowledged' } : x) }))
    logAudit('Acknowledged SOS alert', id)
  }, [logAudit])

  const resolveSOS = useCallback((id, note) => {
    setSafety((s) => ({ ...s, sos: s.sos.map((x) => x.id === id ? { ...x, status: 'resolved', resolvedNote: note } : x) }))
    logAudit('Resolved SOS alert', `${id} — ${note}`)
  }, [logAudit])

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
  }, [currentAdmin.name, logAudit])

  const value = {
    currentAdmin,
    verifications, drivers, users, trips, safety, payouts, failedPayments, admins, auditLog, notifications,
    decideVerification, bulkApprove, setDriverLive, setUserStatus, addUserNote, handleDeletionRequest,
    archiveUser, archiveDriver, restoreUser, restoreDriver, deleteUser, deleteDriver, archiveAdmin, restoreAdmin, deleteAdmin,
    bannedIdentifiers, banIdentifier, unbanIdentifier,
    communicationTemplates, saveCommunicationTemplate, broadcastToSegment, sendExpiryDigest,
    outageBanner, publishOutageBanner, clearOutageBanner,
    incidentLog, recordIncident, tripChats,
    acknowledgeSOS, resolveSOS, forceEndTrip, refundTrip, retryFailedPayment, sendPushToUser, logAudit,
    driversLoading, driversError,
    hubs, hubsLoading, hubsError, loadHubs, createHub, updateHub, deleteHub,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
