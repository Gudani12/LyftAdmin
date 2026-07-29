// Seed data for LYftAdmin. Replace with real API calls when a backend exists.

export const REJECTION_REASONS = [
  'Photo is blurry or unreadable',
  'Document appears expired',
  'Name does not match account details',
  'Document type incorrect for this slot',
  'Photo is cropped / missing corners',
  'Suspected tampering or edited image',
  'Selfie does not match ID photo',
]

export const DOC_TYPES = [
  { key: 'id_document', label: 'ID document' },
  { key: 'selfie', label: 'Selfie' },
  { key: 'drivers_licence', label: "Driver's licence" },
  { key: 'pdp', label: 'PDP (Professional Driving Permit)' },
  { key: 'vehicle_registration', label: 'Vehicle registration (NATIS)' },
  { key: 'roadworthy', label: 'Roadworthy certificate' },
  { key: 'insurance', label: 'Insurance certificate' },
]

const now = Date.now()
const daysAgo = (n) => new Date(now - n * 86400000).toISOString()
const daysFromNow = (n) => new Date(now + n * 86400000).toISOString()

export const initialVerifications = [
  {
    id: 'ver_1001',
    userId: 'usr_204',
    userName: 'Thabo Nkosi',
    role: 'driver',
    docType: 'drivers_licence',
    status: 'pending',
    submittedAt: daysAgo(4),
    expiresAt: daysFromNow(180),
    documentImage: 'licence',
    typedDetails: { fullName: 'Thabo Nkosi', idNumber: '8907125800083', licenceNumber: 'GP-8827719', expiry: '2028-03-14' },
    resubmissionHistory: [],
  },
  {
    id: 'ver_1002',
    userId: 'usr_204',
    userName: 'Thabo Nkosi',
    role: 'driver',
    docType: 'pdp',
    status: 'pending',
    submittedAt: daysAgo(4),
    expiresAt: daysFromNow(365),
    documentImage: 'pdp',
    typedDetails: { fullName: 'Thabo Nkosi', pdpNumber: 'PDP-556213', expiry: '2027-11-02' },
    resubmissionHistory: [],
  },
  {
    id: 'ver_1003',
    userId: 'usr_311',
    userName: 'Aisha Patel',
    role: 'driver',
    docType: 'vehicle_registration',
    status: 'pending',
    submittedAt: daysAgo(2),
    expiresAt: daysFromNow(365),
    documentImage: 'natis',
    typedDetails: { plate: 'CA 442-190', vin: 'AHTBX12938KX00219', ownerName: 'Aisha Patel' },
    resubmissionHistory: [],
  },
  {
    id: 'ver_1004',
    userId: 'usr_412',
    userName: 'Sipho Dlamini',
    role: 'driver',
    docType: 'id_document',
    status: 'resubmitted',
    submittedAt: daysAgo(1),
    expiresAt: null,
    documentImage: 'id',
    typedDetails: { fullName: 'Sipho Dlamini', idNumber: '9203015800084' },
    resubmissionHistory: [
      { at: daysAgo(6), reason: 'Photo is blurry or unreadable', by: 'verifier: N. Mokoena' },
    ],
  },
  {
    id: 'ver_1005',
    userId: 'usr_509',
    userName: 'Lerato Sithole',
    role: 'rider',
    docType: 'selfie',
    status: 'pending',
    submittedAt: daysAgo(6),
    expiresAt: null,
    documentImage: 'selfie',
    typedDetails: { fullName: 'Lerato Sithole' },
    resubmissionHistory: [],
    faceMatchScore: 0.94,
  },
  {
    id: 'ver_1006',
    userId: 'usr_618',
    userName: 'Johan van der Merwe',
    role: 'driver',
    docType: 'insurance',
    status: 'expired',
    submittedAt: daysAgo(400),
    expiresAt: daysAgo(20),
    documentImage: 'insurance',
    typedDetails: { fullName: 'Johan van der Merwe', policyNumber: 'INS-9981223', expiry: '2026-07-06' },
    resubmissionHistory: [],
  },
  {
    id: 'ver_1007',
    userId: 'usr_701',
    userName: 'Nomvula Khumalo',
    role: 'driver',
    docType: 'roadworthy',
    status: 'approved',
    submittedAt: daysAgo(15),
    decidedAt: daysAgo(14),
    decidedBy: 'verifier: N. Mokoena',
    expiresAt: daysFromNow(300),
    documentImage: 'roadworthy',
    typedDetails: { fullName: 'Nomvula Khumalo', plate: 'GP 118-903', expiry: '2027-05-01' },
    resubmissionHistory: [],
  },
  {
    id: 'ver_1008',
    userId: 'usr_733',
    userName: 'Karabo Molefe',
    role: 'driver',
    docType: 'drivers_licence',
    status: 'rejected',
    submittedAt: daysAgo(9),
    decidedAt: daysAgo(8),
    decidedBy: 'verifier: T. Naidoo',
    decisionReason: 'Suspected tampering or edited image',
    expiresAt: null,
    documentImage: 'licence',
    typedDetails: { fullName: 'Karabo Molefe', idNumber: '9411085800080', licenceNumber: 'GP-3341290', expiry: '2029-01-20' },
    resubmissionHistory: [],
  },
  {
    id: 'ver_1009',
    userId: 'usr_812',
    userName: 'Zanele Mahlangu',
    role: 'rider',
    docType: 'id_document',
    status: 'not_submitted',
    submittedAt: null,
    expiresAt: null,
    documentImage: null,
    typedDetails: {},
    resubmissionHistory: [],
  },
  // Duplicate ID number for duplicate-detection demo
  {
    id: 'ver_1010',
    userId: 'usr_900',
    userName: 'Trevor Mabaso',
    role: 'driver',
    docType: 'id_document',
    status: 'pending',
    submittedAt: daysAgo(1),
    expiresAt: null,
    documentImage: 'id',
    typedDetails: { fullName: 'Trevor Mabaso', idNumber: '9203015800084' }, // same as usr_412
    resubmissionHistory: [],
  },
]

export const initialDrivers = [
  {
    id: 'usr_204',
    name: 'Thabo Nkosi',
    phone: '+27 82 555 0142',
    email: 'thabo.nkosi@example.com',
    status: 'pending_review',
    liveApproved: false,
    backgroundCheck: 'clear',
    vehicles: [
      { id: 'veh_1', make: 'Toyota', model: 'Corolla Quest', year: 2021, colour: 'White', plate: 'GP 118-903', seats: 4, primary: true },
    ],
    documents: { drivers_licence: 'pending', pdp: 'pending', vehicle_registration: 'not_submitted', roadworthy: 'not_submitted', insurance: 'not_submitted' },
  },
  {
    id: 'usr_311',
    name: 'Aisha Patel',
    phone: '+27 83 555 0298',
    email: 'aisha.patel@example.com',
    status: 'pending_review',
    liveApproved: false,
    backgroundCheck: 'pending',
    vehicles: [
      { id: 'veh_2', make: 'Volkswagen', model: 'Polo Vivo', year: 2020, colour: 'Silver', plate: 'CA 442-190', seats: 4, primary: true },
    ],
    documents: { drivers_licence: 'approved', pdp: 'approved', vehicle_registration: 'pending', roadworthy: 'not_submitted', insurance: 'not_submitted' },
  },
  {
    id: 'usr_701',
    name: 'Nomvula Khumalo',
    phone: '+27 84 555 0417',
    email: 'nomvula.k@example.com',
    status: 'live',
    liveApproved: true,
    backgroundCheck: 'clear',
    vehicles: [
      { id: 'veh_3', make: 'Hyundai', model: 'Grand i10', year: 2022, colour: 'Blue', plate: 'GP 118-903', seats: 4, primary: true },
      { id: 'veh_4', make: 'Toyota', model: 'Avanza', year: 2019, colour: 'White', plate: 'GP 552-011', seats: 7, primary: false },
    ],
    documents: { drivers_licence: 'approved', pdp: 'approved', vehicle_registration: 'approved', roadworthy: 'approved', insurance: 'approved' },
  },
  {
    id: 'usr_618',
    name: 'Johan van der Merwe',
    phone: '+27 82 555 0771',
    email: 'johan.vdm@example.com',
    status: 'suspended_expired_docs',
    liveApproved: false,
    backgroundCheck: 'clear',
    vehicles: [
      { id: 'veh_5', make: 'Ford', model: 'Figo', year: 2018, colour: 'Red', plate: 'WC 991-002', seats: 4, primary: true },
    ],
    documents: { drivers_licence: 'approved', pdp: 'approved', vehicle_registration: 'approved', roadworthy: 'approved', insurance: 'expired' },
  },
  {
    id: 'usr_733',
    name: 'Karabo Molefe',
    phone: '+27 71 555 0933',
    email: 'karabo.m@example.com',
    status: 'rejected',
    liveApproved: false,
    backgroundCheck: 'clear',
    vehicles: [
      { id: 'veh_6', make: 'Nissan', model: 'Almera', year: 2020, colour: 'Grey', plate: 'GP 774-220', seats: 4, primary: true },
    ],
    documents: { drivers_licence: 'rejected', pdp: 'not_submitted', vehicle_registration: 'not_submitted', roadworthy: 'not_submitted', insurance: 'not_submitted' },
  },
]

export const initialUsers = [
  { id: 'usr_204', name: 'Thabo Nkosi', email: 'thabo.nkosi@example.com', phone: '+27 82 555 0142', idNumber: '8907125800083', role: 'driver', status: 'active', trips: 0, rating: null, paymentState: 'ok', notes: [], deletionRequested: false },
  { id: 'usr_311', name: 'Aisha Patel', email: 'aisha.patel@example.com', phone: '+27 83 555 0298', idNumber: '9502140800081', role: 'driver', status: 'active', trips: 0, rating: null, paymentState: 'ok', notes: [], deletionRequested: false },
  { id: 'usr_701', name: 'Nomvula Khumalo', email: 'nomvula.k@example.com', phone: '+27 84 555 0417', idNumber: '9107020800082', role: 'driver', status: 'active', trips: 1842, rating: 4.91, paymentState: 'ok', notes: [], deletionRequested: false },
  { id: 'usr_618', name: 'Johan van der Merwe', email: 'johan.vdm@example.com', phone: '+27 82 555 0771', idNumber: '8511300800080', role: 'driver', status: 'suspended', trips: 966, rating: 4.62, paymentState: 'ok', notes: ['Suspended: insurance document expired 20 days ago.'], deletionRequested: false },
  { id: 'usr_733', name: 'Karabo Molefe', email: 'karabo.m@example.com', phone: '+27 71 555 0933', idNumber: '9411085800080', role: 'driver', status: 'active', trips: 0, rating: null, paymentState: 'ok', notes: [], deletionRequested: false },
  { id: 'usr_509', name: 'Lerato Sithole', email: 'lerato.s@example.com', phone: '+27 76 555 0620', idNumber: '9801220800085', role: 'rider', status: 'active', trips: 312, rating: 4.85, paymentState: 'ok', notes: [], deletionRequested: false },
  { id: 'usr_812', name: 'Zanele Mahlangu', email: 'zanele.m@example.com', phone: '+27 78 555 0455', idNumber: '9909090800086', role: 'rider', status: 'active', trips: 4, rating: 4.5, paymentState: 'card_failed', notes: [], deletionRequested: false },
  { id: 'usr_845', name: 'Ryan Govender', email: 'ryan.g@example.com', phone: '+27 79 555 0187', idNumber: '9302170800087', role: 'rider', status: 'active', trips: 88, rating: 4.2, paymentState: 'ok', notes: [], deletionRequested: true },
  { id: 'usr_412', name: 'Sipho Dlamini', email: 'sipho.d@example.com', phone: '+27 81 555 0309', idNumber: '9203015800084', role: 'driver', status: 'pending_review', trips: 0, rating: null, paymentState: 'ok', notes: [], deletionRequested: false },
  { id: 'usr_900', name: 'Trevor Mabaso', email: 'trevor.m@example.com', phone: '+27 81 555 0900', idNumber: '9203015800084', role: 'driver', status: 'pending_review', trips: 0, rating: null, paymentState: 'ok', notes: [], deletionRequested: false },
]

export const initialTrips = [
  { id: 'trp_5501', status: 'in_progress', rider: 'Lerato Sithole', driver: 'Nomvula Khumalo', pickup: 'Sandton City, Johannesburg', dropoff: 'OR Tambo Airport', startedAt: daysAgo(0), fare: null, route: [[-26.1076, 28.0567], [-26.1367, 28.2411]] },
  { id: 'trp_5502', status: 'in_progress', rider: 'Ryan Govender', driver: 'Johan van der Merwe', pickup: 'V&A Waterfront, Cape Town', dropoff: 'Claremont', startedAt: daysAgo(0), fare: null, route: [[-33.9036, 18.4201], [-33.9814, 18.4642]] },
  { id: 'trp_5490', status: 'completed', rider: 'Zanele Mahlangu', driver: 'Nomvula Khumalo', pickup: 'Rosebank', dropoff: 'Melrose Arch', startedAt: daysAgo(1), endedAt: daysAgo(1), fare: { base: 25, distance: 42, time: 18, surge: 0, total: 85 }, cancelledBy: null, cancelReason: null },
  { id: 'trp_5488', status: 'cancelled', rider: 'Ryan Govender', driver: 'Johan van der Merwe', pickup: 'Sea Point', dropoff: 'CBD', startedAt: daysAgo(2), endedAt: daysAgo(2), fare: null, cancelledBy: 'rider', cancelReason: 'Changed my mind' },
  { id: 'trp_5471', status: 'completed', rider: 'Lerato Sithole', driver: 'Nomvula Khumalo', pickup: 'Menlyn Mall', dropoff: 'Hatfield', startedAt: daysAgo(3), endedAt: daysAgo(3), fare: { base: 25, distance: 30, time: 12, surge: 10, total: 77 }, cancelledBy: null, cancelReason: null },
  { id: 'trp_5460', status: 'completed', rider: 'Zanele Mahlangu', driver: 'Johan van der Merwe', pickup: 'Century City', dropoff: 'Bellville', startedAt: daysAgo(5), endedAt: daysAgo(5), fare: { base: 25, distance: 55, time: 22, surge: 0, total: 102 }, cancelledBy: null, cancelReason: null },
  { id: 'trp_5455', status: 'cancelled', rider: 'Ryan Govender', driver: 'Nomvula Khumalo', pickup: 'Fourways', dropoff: 'Randburg', startedAt: daysAgo(6), endedAt: daysAgo(6), fare: null, cancelledBy: 'driver', cancelReason: 'Rider not at pickup' },
]

export const initialSafety = {
  sos: [
    { id: 'sos_1', tripId: 'trp_5502', user: 'Ryan Govender', role: 'rider', triggeredAt: new Date(now - 3 * 60000).toISOString(), status: 'open', location: 'Sea Point, Cape Town' },
    { id: 'sos_2', tripId: 'trp_5488', user: 'Johan van der Merwe', role: 'driver', triggeredAt: daysAgo(2), status: 'resolved', location: 'CBD, Cape Town', resolvedNote: 'False alarm — accidental button press, confirmed with driver by phone.' },
  ],
  lowRatingFlags: [
    { id: 'flg_1', tripId: 'trp_5455', user: 'Ryan Govender', role: 'rider', rating: 2, comment: 'Driver cancelled without warning.' },
    { id: 'flg_2', tripId: 'trp_5460', user: 'Johan van der Merwe', role: 'driver', rating: 2, comment: 'Rider was rude to driver.' },
  ],
  reportedUsers: [
    { id: 'rpt_1', reported: 'Karabo Molefe', reportedBy: 'Zanele Mahlangu', reason: 'Unsafe driving', tripId: null, status: 'open', reportedAt: daysAgo(1) },
    { id: 'rpt_2', reported: 'Ryan Govender', reportedBy: 'Nomvula Khumalo', reason: 'Verbal abuse', tripId: 'trp_5455', status: 'investigating', reportedAt: daysAgo(6) },
  ],
}

export const initialPayouts = [
  { id: 'pay_1', driver: 'Nomvula Khumalo', amount: 4820, status: 'paid', period: 'Week of 14 Jul', method: 'Bank transfer' },
  { id: 'pay_2', driver: 'Johan van der Merwe', amount: 3110, status: 'failed', period: 'Week of 14 Jul', method: 'Bank transfer', failReason: 'Invalid account number' },
  { id: 'pay_3', driver: 'Thabo Nkosi', amount: 0, status: 'pending', period: 'Week of 21 Jul', method: 'Bank transfer' },
]

export const initialFailedPayments = [
  { id: 'fp_1', tripId: 'trp_5488', rider: 'Ryan Govender', amount: 63, reason: 'Card declined', retries: 1 },
]

export const initialAdmins = [
  { id: 'adm_1', name: 'Naledi Mokoena', email: 'n.mokoena@lyft-admin.example', role: 'verifier', lastLogin: daysAgo(0) },
  { id: 'adm_2', name: 'Tumi Naidoo', email: 't.naidoo@lyft-admin.example', role: 'verifier', lastLogin: daysAgo(1) },
  { id: 'adm_3', name: 'Grace Adebayo', email: 'g.adebayo@lyft-admin.example', role: 'support', lastLogin: daysAgo(0) },
  { id: 'adm_4', name: 'Sam Reddy', email: 's.reddy@lyft-admin.example', role: 'finance', lastLogin: daysAgo(2) },
  { id: 'adm_5', name: 'You', email: 'gudani@lyft-admin.example', role: 'super_admin', lastLogin: 'now' },
]

export const ROLES = ['super_admin', 'verifier', 'support', 'finance']
