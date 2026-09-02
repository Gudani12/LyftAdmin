import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import {
  initialVerifications, initialUsers, initialTrips,
  initialSafety, initialPayouts, initialFailedPayments, initialAdmins,
} from '../data/mockData.js'
import { supabase } from '../lib/supabaseClient.js'

const DataContext = createContext(null)
export const useData = () => useContext(DataContext)

const CURRENT_ADMIN = { id: 'adm_5', name: 'You', role: 'super_admin' }

const normalizeDriver = (driver) => {
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
    status: driver.status || 'pending',
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
    liveApproved: driver.status === 'live' || driver.status === 'approved',
    backgroundCheck: driver.verified ? 'clear' : 'pending',
    vehicles,
    documents: {
      drivers_licence: driver.driver_license_url ? 'approved' : 'pending',
      pdp: driver.government_id_url ? 'approved' : 'pending',
      vehicle_registration: driver.vehicle_details?.registration_url ? 'approved' : 'pending',
      roadworthy: driver.vehicle_details?.roadworthy_url ? 'approved' : 'pending',
      insurance: driver.vehicle_details?.insurance_url ? 'approved' : 'pending',
    },
  }
}

export function DataProvider({ children }) {
  const [verifications, setVerifications] = useState(initialVerifications)
  const [drivers, setDrivers] = useState([])
  const [users, setUsers] = useState(initialUsers)
  const [trips, setTrips] = useState(initialTrips)
  const [safety, setSafety] = useState(initialSafety)
  const [payouts, setPayouts] = useState(initialPayouts)
  const [failedPayments, setFailedPayments] = useState(initialFailedPayments)
  const [admins, setAdmins] = useState(initialAdmins)
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

  const logAudit = useCallback((action, target) => {
    setAuditLog((log) => [
      { id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, admin: CURRENT_ADMIN.name, role: CURRENT_ADMIN.role, action, target, at: new Date().toISOString() },
      ...log,
    ])
  }, [])

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
      const updated = { ...v, status: decision, decidedAt: new Date().toISOString(), decidedBy: `${CURRENT_ADMIN.role}: ${CURRENT_ADMIN.name}`, decisionReason: decision === 'rejected' ? reason : null }
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
  }, [verifications, logAudit, notify])

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

  const handleDeletionRequest = useCallback((userId, approve) => {
    setUsers((list) => list.map((u) => u.id === userId ? { ...u, deletionRequested: false, status: approve ? 'deleted' : u.status } : u))
    logAudit(approve ? 'Approved account deletion' : 'Declined deletion request', userId)
  }, [logAudit])

  const deleteUser = useCallback((userId) => {
    setUsers((list) => {
      const removed = list.find((u) => u.id === userId)
      if (removed) logAudit('Deleted user account', removed.name)
      return list.filter((u) => u.id !== userId)
    })
  }, [logAudit])

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

  const value = {
    currentAdmin: CURRENT_ADMIN,
    verifications, drivers, users, trips, safety, payouts, failedPayments, admins, auditLog, notifications,
    decideVerification, bulkApprove, setDriverLive, setUserStatus, addUserNote, handleDeletionRequest,
    deleteUser, deleteDriver,
    acknowledgeSOS, resolveSOS, forceEndTrip, refundTrip, retryFailedPayment, sendPushToUser, logAudit,
    driversLoading, driversError,
    hubs, hubsLoading, hubsError, loadHubs, createHub, updateHub, deleteHub,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
