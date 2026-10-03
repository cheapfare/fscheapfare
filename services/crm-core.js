import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'crm_data.json');
const USERS_FILE = path.join(DATA_DIR, 'crm_users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Password hashing helper using standard crypto
function hashPassword(password, salt = null) {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  const result = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return result === hash;
}

// Default system permissions list (17 granular permissions)
export const ALL_PERMISSIONS = [
  'dashboard.view',
  'leads.view',
  'leads.create',
  'leads.edit',
  'leads.delete',
  'customers.view',
  'customers.edit',
  'bookings.view',
  'bookings.create',
  'bookings.edit',
  'bookings.cancel',
  'payments.view',
  'card.view',
  'reports.view',
  'reports.export',
  'users.manage',
  'settings.access'
];

export const ROLE_PERMISSIONS = {
  'SUPER ADMIN': [...ALL_PERMISSIONS],
  'ADMIN': [...ALL_PERMISSIONS],
  'MANAGER': [
    'dashboard.view',
    'leads.view', 'leads.create', 'leads.edit',
    'customers.view', 'customers.edit',
    'bookings.view', 'bookings.create', 'bookings.edit',
    'payments.view',
    'card.view',
    'reports.view', 'reports.export'
  ],
  'AGENT': [
    'dashboard.view',
    'leads.view', 'leads.create', 'leads.edit',
    'customers.view',
    'bookings.view', 'bookings.create'
  ]
};

// Initial Seed Users (Super Admin + Default Agent)
function initUsersDb() {
  if (fs.existsSync(USERS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch (e) {
      console.error('[CRM DB] Error reading users file, resetting:', e);
    }
  }

  // Super Admin Default
  const adminHashed = hashPassword('FScheap@123');
  const agentHashed = hashPassword('agent123');

  const initialUsers = [
    {
      id: 'USR-0001',
      name: 'Super Admin',
      email: 'fscheapfare@gmail.com',
      role: 'SUPER ADMIN',
      status: 'Active',
      permissions: [...ALL_PERMISSIONS],
      salt: adminHashed.salt,
      hash: adminHashed.hash,
      forcePasswordChange: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'USR-0002',
      name: 'John Agent',
      email: 'agent@fscheapfare.com',
      role: 'AGENT',
      status: 'Active',
      permissions: [
        'dashboard.view',
        'leads.view', 'leads.create', 'leads.edit',
        'customers.view',
        'bookings.view', 'bookings.create'
      ],
      salt: agentHashed.salt,
      hash: agentHashed.hash,
      forcePasswordChange: false,
      createdAt: new Date().toISOString()
    }
  ];

  fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2));
  return initialUsers;
}

// Initial Core Data: Completely Clean Production Slate (0 fake leads)
function initCoreDb() {
  if (fs.existsSync(DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
      console.error('[CRM DB] Error reading core data, resetting:', e);
    }
  }

  const initialData = {
    leads: [],
    bookings: [],
    customers: [],
    payments: [],
    auditLogs: [
      {
        id: 'LOG-001',
        user: 'System',
        action: 'Database initialized in clean production state. Ready for live website customer leads.',
        date: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date().toISOString()
      }
    ]
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
  return initialData;
}

// In-Memory active token cache: token -> { userId, email, role, permissions, expiresAt }
const activeSessions = new Map();

class CRMCoreService {
  constructor() {
    this.users = initUsersDb();
    this.db = initCoreDb();
  }

  saveUsers() {
    fs.writeFileSync(USERS_FILE, JSON.stringify(this.users, null, 2));
  }

  saveDb() {
    fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2));
  }

  // AUDIT LOGGING
  logAudit(user, action) {
    const entry = {
      id: `LOG-${Date.now().toString().slice(-5)}`,
      user: user?.name || user || 'System',
      action,
      date: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date().toISOString()
    };
    this.db.auditLogs.unshift(entry);
    if (this.db.auditLogs.length > 500) this.db.auditLogs.pop();
    this.saveDb();
    return entry;
  }

  // 1. AUTHENTICATION & SESSIONS
  login(email, password) {
    const user = this.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      return { success: false, error: 'Invalid email address or password.' };
    }
    if (user.status === 'Disabled') {
      return { success: false, error: 'This user account is currently disabled. Please contact the Super Admin.' };
    }

    const isValid = verifyPassword(password, user.salt, user.hash);
    if (!isValid) {
      return { success: false, error: 'Invalid email address or password.' };
    }

    const token = 'FS_SESSION_' + crypto.randomBytes(24).toString('hex');
    const sessionData = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      forcePasswordChange: !!user.forcePasswordChange,
      expiresAt: Date.now() + 1000 * 60 * 60 * 12
    };

    activeSessions.set(token, sessionData);
    this.logAudit(user, 'User signed in successfully');

    return {
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        forcePasswordChange: !!user.forcePasswordChange
      }
    };
  }

  verifySession(token) {
    if (!token || !activeSessions.has(token)) return null;
    const session = activeSessions.get(token);
    if (Date.now() > session.expiresAt) {
      activeSessions.delete(token);
      return null;
    }
    return session;
  }

  logout(token) {
    if (token && activeSessions.has(token)) {
      const s = activeSessions.get(token);
      if (s) this.logAudit(s, 'User logged out');
      activeSessions.delete(token);
    }
    return true;
  }

  changePassword(userId, newPassword, actor = null) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'User not found.' };

    const { salt, hash } = hashPassword(newPassword);
    user.salt = salt;
    user.hash = hash;
    user.forcePasswordChange = false;
    this.saveUsers();

    this.logAudit(actor || user, `Password changed for user ${user.name} (${user.email})`);
    return { success: true, message: 'Password updated successfully.' };
  }

  // 2. USER ACCESS MANAGEMENT (Add, Edit, Disable, Delete, Permissions)
  getUsers() {
    return this.users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      permissions: u.permissions,
      forcePasswordChange: !!u.forcePasswordChange,
      createdAt: u.createdAt
    }));
  }

  createUser(userData, actor = 'Super Admin') {
    const existing = this.users.find(u => u.email.toLowerCase() === userData.email.trim().toLowerCase());
    if (existing) {
      return { success: false, error: 'A user with this email address already exists.' };
    }

    const role = (userData.role || 'Agent').toUpperCase();
    let permissions = userData.permissions;
    if (!permissions || !Array.isArray(permissions)) {
      permissions = ROLE_PERMISSIONS[role] || [...ROLE_PERMISSIONS.AGENT];
    }

    const { salt, hash } = hashPassword(userData.password || 'FScheap@' + Math.floor(100 + Math.random() * 900));
    const newUser = {
      id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
      name: userData.name.trim(),
      email: userData.email.trim().toLowerCase(),
      role: userData.role || 'Agent',
      status: userData.status || 'Active',
      permissions,
      salt,
      hash,
      forcePasswordChange: true,
      createdAt: new Date().toISOString()
    };

    this.users.push(newUser);
    this.saveUsers();
    this.logAudit(actor, `Created new employee: ${newUser.name} (${newUser.role})`);
    return { success: true, user: newUser };
  }

  updateUser(userId, updates, actor = 'Super Admin') {
    const user = this.users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'User not found.' };

    if (user.role === 'SUPER ADMIN' && updates.status === 'Disabled') {
      return { success: false, error: 'Cannot disable the primary Super Admin account.' };
    }

    if (updates.name) user.name = updates.name.trim();
    if (updates.role) {
      user.role = updates.role;
      if (!updates.permissions) {
        user.permissions = ROLE_PERMISSIONS[updates.role.toUpperCase()] || user.permissions;
      }
    }
    if (updates.permissions && Array.isArray(updates.permissions)) {
      user.permissions = updates.permissions;
    }
    if (updates.status) user.status = updates.status;
    if (updates.password) {
      const { salt, hash } = hashPassword(updates.password);
      user.salt = salt;
      user.hash = hash;
    }

    this.saveUsers();
    this.logAudit(actor, `Updated user profile: ${user.name} (${user.email})`);
    return { success: true, user };
  }

  deleteUser(userId, actor = 'Super Admin') {
    const user = this.users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'User not found.' };
    if (user.role === 'SUPER ADMIN') {
      return { success: false, error: 'Cannot delete the primary Super Admin account.' };
    }

    this.users = this.users.filter(u => u.id !== userId);
    this.saveUsers();
    this.logAudit(actor, `Deleted user account: ${user.name} (${user.email})`);
    return { success: true };
  }

  // 3. LEADS MANAGEMENT
  getLeads(filters = {}) {
    let list = [...this.db.leads];

    if (filters.status) {
      list = list.filter(l => l.status === filters.status);
    }
    if (filters.payment) {
      list = list.filter(l => l.paymentStatus === filters.payment);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(l => 
        (l.id && l.id.toLowerCase().includes(q)) ||
        (l.customerName && l.customerName.toLowerCase().includes(q)) ||
        (l.email && l.email.toLowerCase().includes(q)) ||
        (l.phone && l.phone.includes(q)) ||
        (l.route && l.route.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getLeadById(id) {
    return this.db.leads.find(l => l.id === id) || null;
  }

  // AUTOMATIC LEAD CREATION ON PASSENGER FORM SUBMIT
  // NO fake card details attached!
  recordPassengerStepLead(data) {
    const existingIndex = this.db.leads.findIndex(l => 
      (data.bookingId && l.id === data.bookingId) || 
      (data.email && l.email.toLowerCase() === data.email.toLowerCase() && l.route === `${data.origin} → ${data.destination}`)
    );

    const leadId = data.bookingId || `FS-LEAD-${Math.floor(10000 + Math.random() * 90000)}`;
    const customerName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Traveler';

    const leadRecord = {
      id: leadId,
      customerName,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || data.residentialAddress || null,
      residentialAddress: data.residentialAddress || data.address || null,
      billingAddress: data.billingAddress || data.address || null,
      contact: data.contact || { email: data.email, phone: data.phone },
      origin: data.origin || '',
      destination: data.destination || '',
      route: `${data.origin || 'JFK'} → ${data.destination || 'LAX'}`,
      departureDate: data.departureDate || data.date || '',
      returnDate: data.returnDate || null,
      tripType: data.tripType || (data.returnDate ? 'Round Trip' : 'One Way'),
      cabin: data.cabin || 'Economy',
      passengersCount: data.passengersCount || (data.passengers ? data.passengers.length : 1),
      passengers: data.passengers || [
        { index: 1, firstName: data.firstName, lastName: data.lastName, dob: data.dob || '', gender: data.gender || 'Adult' }
      ],
      carrier: data.carrier || 'Major Airline',
      flightNumber: data.flightNumber || 'FL 100',
      amount: data.amount || 0,
      currency: data.currency || 'USD',
      status: 'PASSENGER DETAILS',
      paymentStatus: 'Pending',
      payment: null, // Card Not Shared yet!
      source: 'WEB_BOOKING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingIndex !== -1) {
      // Preserve existing payment if already completed
      const existing = this.db.leads[existingIndex];
      this.db.leads[existingIndex] = {
        ...existing,
        ...leadRecord,
        payment: existing.payment || null,
        status: existing.status === 'BOOKED' ? 'BOOKED' : 'PASSENGER DETAILS',
        updatedAt: new Date().toISOString()
      };
    } else {
      this.db.leads.unshift(leadRecord);
      this.findOrCreateCustomer(leadRecord);
    }

    this.saveDb();
    this.logAudit('System', `Lead captured upon traveler details submit: ${leadRecord.id} (${customerName})`);
    return leadRecord;
  }

  // CUSTOMER SUPPORT INQUIRY SUBMITTED FROM WEBSITE
  recordSupportInquiry(data) {
    const inquiryId = `FS-SUP-${Math.floor(10000 + Math.random() * 90000)}`;
    const customerName = `${data.firstName || data.name || ''} ${data.lastName || ''}`.trim() || 'Traveler';

    const leadRecord = {
      id: inquiryId,
      customerName,
      firstName: data.firstName || data.name || '',
      lastName: data.lastName || '',
      email: data.email || '',
      phone: data.phone || '',
      origin: data.origin || '',
      destination: data.destination || '',
      route: data.route || (data.origin && data.destination ? `${data.origin} → ${data.destination}` : 'Travel Support Request'),
      departureDate: data.travelDate || data.departureDate || '',
      returnDate: null,
      tripType: 'Support Inquiry',
      cabin: data.cabin || 'Economy',
      passengersCount: 1,
      passengers: [
        { index: 1, firstName: customerName, lastName: '', dob: '', gender: 'Adult' }
      ],
      amount: parseFloat(data.amount) || 0,
      currency: 'USD',
      status: 'NEW',
      paymentStatus: 'Pending',
      payment: null, // Card Not Shared
      source: 'CUSTOMER_SUPPORT',
      inquiryType: data.inquiryType || 'Flight Assistance',
      message: data.message || data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.db.leads.unshift(leadRecord);
    this.findOrCreateCustomer(leadRecord);
    this.saveDb();
    this.logAudit('Support Form', `Support inquiry received: ${leadRecord.id} (${customerName}) - ${leadRecord.inquiryType}`);
    return leadRecord;
  }

  // MARK CHECKOUT ABANDONED (User left without paying)
  markAbandoned(leadId) {
    const lead = this.db.leads.find(l => l.id === leadId);
    if (lead && lead.status !== 'BOOKED') {
      lead.status = 'ABANDONED';
      lead.abandonedAt = new Date().toISOString();
      lead.updatedAt = new Date().toISOString();
      this.saveDb();
      this.logAudit('System', `Customer abandoned checkout on lead: ${leadId}`);
    }
  }

  // RECORD PAYMENT & CONFIRM BOOKING (Real Card Details Only, Never Fake Defaults)
  confirmBookingAndPayment(leadId, paymentData) {
    const lead = this.db.leads.find(l => l.id === leadId);
    if (!lead) return null;

    lead.status = 'BOOKED';
    lead.paymentStatus = 'Paid';
    lead.updatedAt = new Date().toISOString();

    const bookingId = `FS-BKG-${Math.floor(10000 + Math.random() * 90000)}`;
    const txnId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;

    const last4 = paymentData.last4 ? String(paymentData.last4).slice(-4) : (paymentData.cardNumber ? String(paymentData.cardNumber).slice(-4) : '');
    const cardBrand = paymentData.cardBrand || 'Card';

    lead.payment = {
      cardBrand,
      cardNumber: paymentData.cardNumber || (last4 ? `•••• •••• •••• ${last4}` : ''),
      last4,
      cvv: paymentData.cvv || paymentData.cardCvv || '',
      expiry: paymentData.expiry || '',
      cardholderName: paymentData.cardholderName || lead.customerName,
      billingAddress: paymentData.billingAddress || lead.billingAddress || lead.address || null,
      transactionId: txnId,
      status: 'Paid',
      amount: lead.amount,
      currency: lead.currency || 'USD'
    };
    if (paymentData.billingAddress) {
      lead.billingAddress = paymentData.billingAddress;
    }
    lead.bookingId = bookingId;

    // Create Booking Record
    const bookingRecord = {
      id: bookingId,
      leadId: lead.id,
      customerName: lead.customerName,
      email: lead.email,
      phone: lead.phone,
      origin: lead.origin,
      destination: lead.destination,
      route: lead.route,
      carrier: lead.carrier,
      flightNumber: lead.flightNumber,
      departureDate: lead.departureDate,
      returnDate: lead.returnDate,
      status: 'Confirmed',
      paymentStatus: 'Paid',
      amount: lead.amount,
      pnr: `CF-${Math.floor(100000 + Math.random() * 900000)}`,
      carrierPnr: `${(lead.carrier || 'DL').slice(0, 2).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`,
      passengersCount: lead.passengersCount,
      cabin: lead.cabin,
      createdAt: new Date().toISOString()
    };
    this.db.bookings.unshift(bookingRecord);

    // Create Payment Record
    const paymentRecord = {
      transactionId: txnId,
      customer: lead.customerName,
      booking: bookingId,
      amount: lead.amount,
      currency: lead.currency || 'USD',
      paymentMethod: last4 ? `${cardBrand} •••• ${last4}` : 'Card Authorized',
      status: 'Paid',
      date: new Date().toISOString()
    };
    this.db.payments.unshift(paymentRecord);

    // Update Customer
    this.findOrCreateCustomer(lead, true);

    this.saveDb();
    this.logAudit('Payment Gateway', `Booking confirmed & ticket issued: ${bookingId} (PNR: ${bookingRecord.pnr})`);
    return { lead, booking: bookingRecord, payment: paymentRecord };
  }

  // DEDUPLICATE CUSTOMER DIRECTORY
  findOrCreateCustomer(lead, isPaid = false) {
    let cust = this.db.customers.find(c => 
      (lead.email && c.email.toLowerCase() === lead.email.toLowerCase()) || 
      (c.phone && lead.phone && c.phone.replace(/\D/g, '') === lead.phone.replace(/\D/g, ''))
    );

    if (cust) {
      if (isPaid) {
        cust.bookingsCount = (cust.bookingsCount || 0) + 1;
        cust.lastBooking = lead.departureDate || new Date().toISOString().split('T')[0];
      }
      cust.updatedAt = new Date().toISOString();
    } else {
      cust = {
        id: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
        name: lead.customerName,
        email: lead.email,
        phone: lead.phone,
        bookingsCount: isPaid ? 1 : 0,
        lastBooking: isPaid ? (lead.departureDate || new Date().toISOString().split('T')[0]) : '--',
        status: 'Active',
        createdAt: new Date().toISOString()
      };
      this.db.customers.unshift(cust);
    }
    return cust;
  }

  updateLeadStatus(leadId, status, actor = 'Admin') {
    const lead = this.db.leads.find(l => l.id === leadId);
    if (!lead) return { success: false, error: 'Lead not found.' };

    const validStatuses = ['NEW', 'PASSENGER DETAILS', 'PAYMENT PENDING', 'BOOKED', 'CANCELLED', 'ABANDONED'];
    if (!validStatuses.includes(status)) {
      return { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` };
    }

    const oldStatus = lead.status;
    lead.status = status;
    lead.updatedAt = new Date().toISOString();

    if (status === 'BOOKED') {
      lead.paymentStatus = 'Paid';
    } else if (status === 'CANCELLED') {
      if (lead.paymentStatus === 'Paid') lead.paymentStatus = 'Refunded';
    }

    this.saveDb();
    this.logAudit(actor, `Updated status of lead ${leadId} from "${oldStatus}" to "${status}"`);
    return { success: true, lead };
  }

  createManualLead(leadData, actor = 'Admin') {
    const newLead = {
      id: `FS-LEAD-${Math.floor(10000 + Math.random() * 90000)}`,
      customerName: `${leadData.firstName} ${leadData.lastName}`.trim(),
      firstName: leadData.firstName,
      lastName: leadData.lastName,
      email: leadData.email,
      phone: leadData.phone,
      origin: leadData.origin,
      destination: leadData.destination,
      route: `${leadData.origin} → ${leadData.destination}`,
      departureDate: leadData.departureDate,
      returnDate: leadData.returnDate || null,
      tripType: leadData.returnDate ? 'Round Trip' : 'One Way',
      cabin: leadData.cabin || 'Economy',
      passengersCount: 1,
      passengers: [{ index: 1, firstName: leadData.firstName, lastName: leadData.lastName, dob: '', gender: '' }],
      carrier: 'Major Carrier',
      flightNumber: 'AA 100',
      amount: parseFloat(leadData.amount) || 0,
      currency: 'USD',
      status: 'NEW',
      paymentStatus: 'Pending',
      payment: null, // Card Not Shared
      source: 'MANUAL_ENTRY',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.db.leads.unshift(newLead);
    this.findOrCreateCustomer(newLead);
    this.saveDb();
    this.logAudit(actor, `Created new manual lead: ${newLead.id} for ${newLead.customerName}`);
    return newLead;
  }

  getBookings() {
    return [...this.db.bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getCustomers() {
    return [...this.db.customers];
  }

  getCustomerById(id) {
    const cust = this.db.customers.find(c => c.id === id);
    if (!cust) return null;
    const customerLeads = this.db.leads.filter(l => l.email && cust.email && l.email.toLowerCase() === cust.email.toLowerCase());
    const customerBookings = this.db.bookings.filter(b => b.email && cust.email && b.email.toLowerCase() === cust.email.toLowerCase());
    return { ...cust, leads: customerLeads, bookings: customerBookings };
  }

  getPayments() {
    return [...this.db.payments].sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  getAuditLogs() {
    return [...this.db.auditLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // 4. CLEAN, REAL 5-KPI DASHBOARD ANALYTICS WITH ACCURATE DATES & GRAPH
  getDashboardAnalytics(period = '30d') {
    const now = new Date();
    let startDate = new Date();

    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === '7d') {
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === '90d') {
      startDate.setDate(now.getDate() - 90);
      startDate.setHours(0, 0, 0, 0);
    } else { // 30d default
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    }

    const filteredLeads = this.db.leads.filter(l => new Date(l.createdAt || l.updatedAt) >= startDate);
    const filteredBookings = this.db.bookings.filter(b => new Date(b.createdAt) >= startDate);

    // 5 Real KPIs (Exact figures, NO hardcoded fake fallbacks!)
    const newLeads = filteredLeads.filter(l => l.status === 'NEW' || l.status === 'PASSENGER DETAILS').length;
    const totalBookings = filteredBookings.length;
    const paymentPending = filteredLeads.filter(l => l.status === 'PAYMENT PENDING').length;
    const abandoned = filteredLeads.filter(l => l.status === 'ABANDONED').length;
    const revenue = filteredBookings.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);

    // Real dynamic booking chart points based on actual timestamps
    const trendLabels = [];
    const trendValues = [];

    if (period === 'today') {
      // 6 time buckets today: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00
      for (let h = 0; h < 24; h += 4) {
        const bucketStart = new Date(startDate);
        bucketStart.setHours(h, 0, 0, 0);
        const bucketEnd = new Date(startDate);
        bucketEnd.setHours(h + 4, 0, 0, 0);
        
        const count = filteredBookings.filter(b => {
          const bd = new Date(b.createdAt);
          return bd >= bucketStart && bd < bucketEnd;
        }).length;

        trendLabels.push(`${String(h).padStart(2, '0')}:00`);
        trendValues.push(count);
      }
    } else if (period === '7d') {
      // 7 daily points for the last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
        const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

        const count = filteredBookings.filter(b => {
          const bd = new Date(b.createdAt);
          return bd >= dayStart && bd <= dayEnd;
        }).length;

        trendLabels.push(dayStr);
        trendValues.push(count);
      }
    } else if (period === '90d') {
      // 12 weekly buckets for past 90 days
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i * 7);
        const weekStart = new Date(d);
        weekStart.setDate(weekStart.getDate() - 7);

        const count = filteredBookings.filter(b => {
          const bd = new Date(b.createdAt);
          return bd >= weekStart && bd <= d;
        }).length;

        trendLabels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        trendValues.push(count);
      }
    } else { // 30d
      // 10 3-day points for past 30 days
      for (let i = 9; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i * 3);
        const binStart = new Date(d);
        binStart.setDate(binStart.getDate() - 3);

        const count = filteredBookings.filter(b => {
          const bd = new Date(b.createdAt);
          return bd >= binStart && bd <= d;
        }).length;

        trendLabels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        trendValues.push(count);
      }
    }

    const recentLeads = filteredLeads.slice(0, 8).map(l => ({
      id: l.id,
      customerName: l.customerName,
      route: l.route,
      departureDate: l.departureDate,
      status: l.status,
      paymentStatus: l.paymentStatus,
      amount: l.amount,
      source: l.source || 'WEB_BOOKING',
      createdAt: l.createdAt
    }));

    return {
      period,
      kpis: {
        newLeads,
        bookings: totalBookings,
        paymentPending,
        abandoned,
        revenue
      },
      chart: {
        labels: trendLabels,
        values: trendValues
      },
      recentLeads
    };
  }
}

export default new CRMCoreService();
