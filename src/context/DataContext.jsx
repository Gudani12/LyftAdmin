import React, { createContext, useContext, useState, useCallback } from 'react'
import {
  initialVerifications, initialDrivers, initialUsers, initialTrips,
  initialSafety, initialPayouts, initialFailedPayments, initialAdmins,
} from '../data/mockData.js'

const DataContext = createContext(null)
export const useData = () => useContext(DataContext)

const CURRENT_ADMIN = { id: 'adm_5', name: 'You', role: 'super_admin' }

export function DataProvider({ children }) {
  const [verifications, setVerifications] = useState(initialVerifications)
  const [drivers, setDrivers] = useState(initialDrivers)
  const [users, setUsers] = useState(initialUsers)
  const [trips, setTrips] = useState(initialTrips)
  const [safety, setSafety] = useState(initialSafety)
  const [payouts, setPayouts] = useState(initialPayouts)
  const [failedPayments, setFailedPayments] = useState(initialFailedPayments)
  const [admins, setAdmins] = useState(initialAdmins)
  const [auditLog, setAuditLog] = useState([])
  const [notifications, setNotifications] = useState([]) // simulated outbound notifications

  const logAudit = useCallback((action, target) => {
    setAuditLog((log) => [
      { id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, admin: CURRENT_ADMIN.name, role: CURRENT_ADMIN.role, action, target, at: new Date().toISOString() },
      ...log,
    ])
  }, [])

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

  const setDriverLive = useCallback((driverId, live) => {
    setDrivers((list) => list.map((d) => d.id === driverId ? { ...d, liveApproved: live, status: live ? 'live' : 'revoked' } : d))
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
    acknowledgeSOS, resolveSOS, forceEndTrip, refundTrip, retryFailedPayment, sendPushToUser, logAudit,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
