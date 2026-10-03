import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const CRM_DB_FILE = path.join(DATA_DIR, 'crm_enterprise.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Seeds with rich, realistic travel agency data
function getInitialStore() {
  const now = Date.now();
  const d = (offsetMinutes) => new Date(now - offsetMinutes * 60 * 1000).toISOString();

  return {
    counters: {
      lead: 148,
      booking: 72,
      transaction: 94,
      customer: 65,
      audit: 210
    },
    agents: [
      { id: 'AGT-01', name: 'Ravi Sharma', email: 'ravi.s@fscheapfarenetwork.com', role: 'Admin', activeLeads: 12, totalLeads: 184, bookings: 68, conversionRate: 37, revenue: 38450, pendingFollowUps: 4, avatar: 'RS' },
      { id: 'AGT-02', name: 'Alex Morgan', email: 'alex.m@fscheapfarenetwork.com', role: 'Senior Agent', activeLeads: 8, totalLeads: 142, bookings: 51, conversionRate: 36, revenue: 26890, pendingFollowUps: 3, avatar: 'AM' },
      { id: 'AGT-03', name: 'Sarah Lin', email: 'sarah.l@fscheapfarenetwork.com', role: 'Agent', activeLeads: 11, totalLeads: 96, bookings: 31, conversionRate: 32, revenue: 17240, pendingFollowUps: 5, avatar: 'SL' },
      { id: 'AGT-04', name: 'David Miller', email: 'david.m@fscheapfarenetwork.com', role: 'Agent', activeLeads: 6, totalLeads: 78, bookings: 24, conversionRate: 31, revenue: 12900, pendingFollowUps: 2, avatar: 'DM' }
    ],
    customers: [
      {
        customerId: 'FS-CUST-000001',
        firstName: 'Kimberly',
        lastName: 'Adams',
        email: 'kimberly.adams@gmail.com',
        phone: '+1 (555) 234-8910',
        city: 'New York',
        country: 'United States',
        totalBookings: 2,
        lifetimeSpend: 677.50,
        preferredCabin: 'Economy',
        createdAt: d(1440 * 15)
      },
      {
        customerId: 'FS-CUST-000002',
        firstName: 'Michael',
        lastName: 'Chang',
        email: 'm.chang99@yahoo.com',
        phone: '+1 (415) 662-8901',
        city: 'San Francisco',
        country: 'United States',
        totalBookings: 1,
        lifetimeSpend: 890.00,
        preferredCabin: 'Economy',
        createdAt: d(1440 * 10)
      },
      {
        customerId: 'FS-CUST-000003',
        firstName: 'David',
        lastName: 'Miller',
        email: 'dmiller.travel@gmail.com',
        phone: '+1 (888) 492-3110',
        city: 'Chicago',
        country: 'United States',
        totalBookings: 0,
        lifetimeSpend: 0,
        preferredCabin: 'Economy',
        createdAt: d(1440 * 2)
      },
      {
        customerId: 'FS-CUST-000004',
        firstName: 'Sarah',
        lastName: 'Jenkins',
        email: 'sarah.j@outlook.com',
        phone: '+1 (312) 789-4412',
        city: 'Chicago',
        country: 'United States',
        totalBookings: 0,
        lifetimeSpend: 0,
        preferredCabin: 'Premium Economy',
        createdAt: d(1440 * 1)
      }
    ],
    leads: [
      {
        leadId: 'FS-LEAD-000148',
        customerId: 'FS-CUST-000004',
        customerName: 'Sarah Jenkins',
        firstName: 'Sarah',
        lastName: 'Jenkins',
        email: 'sarah.j@outlook.com',
        phone: '+1 (312) 789-4412',
        source: 'WEB_BOOKING',
        status: 'CHECKOUT_ABANDONED',
        paymentStatus: 'PENDING',
        route: 'SFO → LHR',
        origin: 'SFO',
        destination: 'LHR',
        date: '2026-11-25',
        returnDate: '2026-12-05',
        tripType: 'Round Trip',
        cabin: 'Premium Economy',
        carrier: 'British Airways',
        flightNumber: 'BA 286',
        passengersCount: 1,
        passengers: [
          { index: 1, firstName: 'Sarah', lastName: 'Jenkins', gender: 'Female', dob: '1991-04-12', nationality: 'United States', email: 'sarah.j@outlook.com', phone: '+1 (312) 789-4412' }
        ],
        amount: 680.00,
        currency: 'USD',
        assignedAgent: 'Ravi Sharma',
        abandonedAt: d(18),
        createdAt: d(24),
        updatedAt: d(18),
        followUpStatus: 'PENDING',
        followUpDue: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
        timeline: [
          { time: d(24), title: 'Flight Search Started', desc: 'Customer searched SFO → LHR for Nov 25', icon: 'search' },
          { time: d(22), title: 'Flight Selected', desc: 'British Airways BA 286 selected ($680.00)', icon: 'check-circle' },
          { time: d(20), title: 'Passenger Details Completed', desc: 'Submitted passenger info for Sarah Jenkins', icon: 'user-check' },
          { time: d(19), title: 'Payment Screen Initiated', desc: 'Reached secure card payment authorization', icon: 'credit-card' },
          { time: d(18), title: 'Checkout Abandoned', desc: 'Customer closed tab before completing transaction. Follow-up priority: HIGH', icon: 'alert-triangle' }
        ],
        notes: [
          { id: 'N1', text: 'Customer completed full traveler details but abandoned at payment. Attempt outbound call in 15 mins.', author: 'System', timestamp: d(18) }
        ]
      },
      {
        leadId: 'FS-LEAD-000147',
        customerId: 'FS-CUST-000003',
        customerName: 'David Miller',
        firstName: 'David',
        lastName: 'Miller',
        email: 'dmiller.travel@gmail.com',
        phone: '+1 (888) 492-3110',
        source: 'PHONE_CALL',
        status: 'IN_PROGRESS',
        paymentStatus: 'PENDING',
        route: 'ORD → MIA',
        origin: 'ORD',
        destination: 'MIA',
        date: '2026-11-20',
        returnDate: '2026-11-27',
        tripType: 'Round Trip',
        cabin: 'Economy',
        carrier: 'American Airlines',
        flightNumber: 'AA 1420',
        passengersCount: 2,
        passengers: [
          { index: 1, firstName: 'David', lastName: 'Miller', gender: 'Male', dob: '1985-08-19', nationality: 'United States', email: 'dmiller.travel@gmail.com', phone: '+1 (888) 492-3110' },
          { index: 2, firstName: 'Emily', lastName: 'Miller', gender: 'Female', dob: '1988-12-04', nationality: 'United States', email: 'dmiller.travel@gmail.com', phone: '+1 (888) 492-3110' }
        ],
        amount: 518.00,
        currency: 'USD',
        assignedAgent: 'Alex Morgan',
        createdAt: d(75),
        updatedAt: d(30),
        followUpStatus: 'SCHEDULED',
        followUpDue: new Date(now + 4 * 60 * 60 * 1000).toISOString(),
        timeline: [
          { time: d(75), title: 'Inbound Call on TFN', desc: 'Caller reached agent on +1 (888) 885-5061 requesting Thanksgiving Miami flight', icon: 'phone-incoming' },
          { time: d(65), title: 'Quotation Provided', desc: 'Offered AA 1420 at $259/pax ($518 total)', icon: 'file-text' },
          { time: d(30), title: 'Follow-up Scheduled', desc: 'Customer comparing schedules with spouse, call back at 4:30 PM', icon: 'clock' }
        ],
        notes: [
          { id: 'N2', text: 'Quoted $259 per traveler. Customer requested afternoon callback.', author: 'Alex Morgan', timestamp: d(30) }
        ]
      },
      {
        leadId: 'FS-LEAD-000146',
        customerId: 'FS-CUST-000001',
        customerName: 'Kimberly Adams',
        firstName: 'Kimberly',
        lastName: 'Adams',
        email: 'kimberly.adams@gmail.com',
        phone: '+1 (555) 234-8910',
        source: 'WEB_BOOKING',
        status: 'BOOKING_CONFIRMED',
        paymentStatus: 'PAID',
        route: 'JFK → LAX',
        origin: 'JFK',
        destination: 'LAX',
        date: '2026-11-20',
        returnDate: '2026-11-27',
        tripType: 'Round Trip',
        cabin: 'Economy',
        carrier: 'Delta Air Lines',
        flightNumber: 'DL 482',
        passengersCount: 1,
        passengers: [
          { index: 1, firstName: 'Kimberly', lastName: 'Adams', gender: 'Female', dob: '1992-06-14', nationality: 'United States', email: 'kimberly.adams@gmail.com', phone: '+1 (555) 234-8910' }
        ],
        amount: 249.00,
        currency: 'USD',
        assignedAgent: 'Ravi Sharma',
        bookingId: 'FS-BKG-000072',
        pnr: 'CF-782194',
        transactionId: 'FS-TXN-000094',
        createdAt: d(120),
        updatedAt: d(110),
        timeline: [
          { time: d(120), title: 'Flight Search Started', desc: 'Searched JFK → LAX for Nov 20-27', icon: 'search' },
          { time: d(117), title: 'Flight Selected', desc: 'Delta Air Lines DL 482 ($249.00)', icon: 'check-circle' },
          { time: d(115), title: 'Passenger Details Completed', desc: 'Saved passenger info for Kimberly Adams', icon: 'user-check' },
          { time: d(112), title: 'Payment Authorized', desc: 'Visa •••• 4821 authorized for $249.00 USD', icon: 'credit-card' },
          { time: d(110), title: 'Booking Confirmed & Ticket Issued', desc: 'PNR CF-782194 generated. E-ticket issued.', icon: 'award' }
        ],
        notes: [
          { id: 'N3', text: 'Online booking and payment confirmed automatically. E-ticket PDF generated.', author: 'System', timestamp: d(110) }
        ]
      },
      {
        leadId: 'FS-LEAD-000145',
        customerId: 'FS-CUST-000002',
        customerName: 'Michael Chang',
        firstName: 'Michael',
        lastName: 'Chang',
        email: 'm.chang99@yahoo.com',
        phone: '+1 (415) 662-8901',
        source: 'SEARCH_INQUIRY',
        status: 'NEW',
        paymentStatus: 'UNPAID',
        route: 'LAX → NRT',
        origin: 'LAX',
        destination: 'NRT',
        date: '2026-12-10',
        returnDate: '2026-12-24',
        tripType: 'Round Trip',
        cabin: 'Economy',
        carrier: 'All Nippon Airways',
        flightNumber: 'NH 5',
        passengersCount: 1,
        passengers: [
          { index: 1, firstName: 'Michael', lastName: 'Chang', gender: 'Male', email: 'm.chang99@yahoo.com', phone: '+1 (415) 662-8901' }
        ],
        amount: 890.00,
        currency: 'USD',
        assignedAgent: 'Sarah Lin',
        createdAt: d(210),
        updatedAt: d(210),
        timeline: [
          { time: d(210), title: 'High-Intent Flight Search', desc: 'Searched holiday flights LAX → Tokyo NRT', icon: 'search' },
          { time: d(208), title: 'Lead Captured', desc: 'Contact details verified from session telemetry', icon: 'user-plus' }
        ],
        notes: []
      }
    ],
    bookings: [
      {
        bookingId: 'FS-BKG-000072',
        leadId: 'FS-LEAD-000146',
        pnr: 'CF-782194',
        carrierPnr: 'DL-482914',
        customerName: 'Kimberly Adams',
        phone: '+1 (555) 234-8910',
        email: 'kimberly.adams@gmail.com',
        route: 'JFK → LAX',
        airline: 'Delta Air Lines',
        flightNumber: 'DL 482',
        depDate: '2026-11-20',
        depTime: '07:00 AM',
        arrDate: '2026-11-20',
        arrTime: '10:15 AM',
        cabin: 'Economy',
        passengersCount: 1,
        totalFare: 249.00,
        status: 'CONFIRMED',
        ticketIssued: true,
        issuedAt: d(110)
      }
    ],
    payments: [
      {
        transactionId: 'FS-TXN-000094',
        bookingId: 'FS-BKG-000072',
        leadId: 'FS-LEAD-000146',
        customerName: 'Kimberly Adams',
        amount: 249.00,
        currency: 'USD',
        paymentMethod: 'Credit Card Token',
        cardBrand: 'Visa',
        last4: '4821',
        status: 'PAID',
        timestamp: d(112)
      }
    ],
    searches: [
      { id: 'SRCH-101', origin: 'JFK', destination: 'LAX', date: '2026-11-20', cabin: 'Economy', pax: 1, timestamp: d(5), convertedToLead: false },
      { id: 'SRCH-102', origin: 'SFO', destination: 'LHR', date: '2026-11-25', cabin: 'Premium Economy', pax: 1, timestamp: d(24), convertedToLead: true },
      { id: 'SRCH-103', origin: 'ORD', destination: 'MIA', date: '2026-11-20', cabin: 'Economy', pax: 2, timestamp: d(75), convertedToLead: true },
      { id: 'SRCH-104', origin: 'LAX', destination: 'NRT', date: '2026-12-10', cabin: 'Economy', pax: 1, timestamp: d(210), convertedToLead: true },
      { id: 'SRCH-105', origin: 'BOS', destination: 'MCO', date: '2026-11-18', cabin: 'Economy', pax: 3, timestamp: d(290), convertedToLead: false }
    ],
    followUps: [
      {
        id: 'FLW-01',
        leadId: 'FS-LEAD-000148',
        customerName: 'Sarah Jenkins',
        phone: '+1 (312) 789-4412',
        priority: 'URGENT',
        status: 'PENDING',
        dueDate: new Date(now + 30 * 60 * 1000).toISOString(),
        assignedAgent: 'Ravi Sharma',
        note: 'Customer dropped off at payment page for SFO → LHR. Call to assist with payment.'
      },
      {
        id: 'FLW-02',
        leadId: 'FS-LEAD-000147',
        customerName: 'David Miller',
        phone: '+1 (888) 492-3110',
        priority: 'HIGH',
        status: 'PENDING',
        dueDate: new Date(now + 120 * 60 * 1000).toISOString(),
        assignedAgent: 'Alex Morgan',
        note: 'Customer asked for callback at 4:30 PM regarding Thanksgiving ORD → MIA discount.'
      }
    ],
    auditLogs: [
      { id: 'AUD-210', user: 'Ravi Sharma', action: 'Lead Assigned', recordId: 'FS-LEAD-000148', details: 'Auto-assigned abandoned checkout lead to Ravi Sharma', timestamp: d(18) },
      { id: 'AUD-209', user: 'System', action: 'Status Changed', recordId: 'FS-LEAD-000148', details: 'Status moved: PAYMENT_STARTED → CHECKOUT_ABANDONED', timestamp: d(18) },
      { id: 'AUD-208', user: 'System', action: 'Lead Created', recordId: 'FS-LEAD-000148', details: 'Pre-payment lead created immediately upon passenger step completion', timestamp: d(20) },
      { id: 'AUD-207', user: 'Alex Morgan', action: 'Note Added', recordId: 'FS-LEAD-000147', details: 'Added quotation follow-up note for ORD → MIA', timestamp: d(30) },
      { id: 'AUD-206', user: 'System', action: 'Booking Confirmed', recordId: 'FS-BKG-000072', details: 'Payment completed via Visa •••• 4821. PNR CF-782194 issued.', timestamp: d(110) }
    ],
    notifications: [
      { id: 'NOTIF-01', type: 'ABANDONED', title: 'Checkout Abandoned', desc: 'Sarah Jenkins dropped off at payment for SFO → LHR ($680.00). Follow up now.', read: false, timestamp: d(18) },
      { id: 'NOTIF-02', type: 'BOOKING', title: 'New Booking Confirmed', desc: 'Kimberly Adams paid $249.00 USD for JFK → LAX (PNR: CF-782194).', read: true, timestamp: d(110) },
      { id: 'NOTIF-03', type: 'PHONE', title: 'New Phone Inquiry', desc: 'Inbound caller inquiry logged for David Miller (ORD → MIA).', read: true, timestamp: d(75) }
    ]
  };
}

export class CRMEnterpriseService {
  static getStore() {
    try {
      if (!fs.existsSync(CRM_DB_FILE)) {
        const initial = getInitialStore();
        fs.writeFileSync(CRM_DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
        return initial;
      }
      const data = fs.readFileSync(CRM_DB_FILE, 'utf-8');
      return JSON.parse(data || '{}');
    } catch (err) {
      console.error('[CRMEnterprise] Error reading CRM DB:', err);
      return getInitialStore();
    }
  }

  static saveStore(store) {
    try {
      fs.writeFileSync(CRM_DB_FILE, JSON.stringify(store, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('[CRMEnterprise] Error writing CRM DB:', err);
      return false;
    }
  }

  static logAudit(user, action, recordId, details) {
    const store = this.getStore();
    store.counters.audit = (store.counters.audit || 200) + 1;
    const auditEntry = {
      id: `AUD-${store.counters.audit}`,
      user: user || 'Agent Admin',
      action,
      recordId,
      details,
      timestamp: new Date().toISOString()
    };
    store.auditLogs = store.auditLogs || [];
    store.auditLogs.unshift(auditEntry);
    this.saveStore(store);
  }

  static addNotification(type, title, desc) {
    const store = this.getStore();
    const notif = {
      id: `NOTIF-${Date.now().toString(36).toUpperCase()}`,
      type,
      title,
      desc,
      read: false,
      timestamp: new Date().toISOString()
    };
    store.notifications = store.notifications || [];
    store.notifications.unshift(notif);
    this.saveStore(store);
  }

  // Deduplication & Customer Management
  static findOrCreateCustomer(firstName, lastName, email, phone, city = '', country = 'United States') {
    const store = this.getStore();
    store.customers = store.customers || [];

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');

    let existing = store.customers.find(c => {
      const cEmail = (c.email || '').trim().toLowerCase();
      const cPhone = (c.phone || '').replace(/[^0-9]/g, '');
      return (cleanEmail && cEmail === cleanEmail) || (cleanPhone && cPhone.length > 7 && cPhone === cleanPhone);
    });

    if (existing) {
      return { customer: existing, isExisting: true };
    }

    store.counters.customer = (store.counters.customer || 50) + 1;
    const padNum = String(store.counters.customer).padStart(6, '0');
    const newCustomer = {
      customerId: `FS-CUST-${padNum}`,
      firstName: firstName || 'Direct',
      lastName: lastName || 'Traveler',
      email: email || '',
      phone: phone || '',
      city: city || 'Unknown City',
      country: country || 'United States',
      totalBookings: 0,
      lifetimeSpend: 0,
      preferredCabin: 'Economy',
      createdAt: new Date().toISOString()
    };

    store.customers.unshift(newCustomer);
    this.saveStore(store);
    return { customer: newCustomer, isExisting: false };
  }

  // 1. CRITICAL: Real-Time Lead Creation on Passenger Form Step
  static recordPassengerStepLead(data) {
    const store = this.getStore();
    store.leads = store.leads || [];

    const { customer, isExisting } = this.findOrCreateCustomer(
      data.firstName,
      data.lastName,
      data.email,
      data.phone,
      data.city || data.billingAddress?.city || '',
      data.country || 'United States'
    );

    store.counters.lead = (store.counters.lead || 100) + 1;
    const leadId = `FS-LEAD-${String(store.counters.lead).padStart(6, '0')}`;
    const pnr = data.pnr || `CF-${Math.floor(100000 + Math.random() * 900000)}`;

    const newLead = {
      leadId,
      customerId: customer.customerId,
      isExistingCustomer: isExisting,
      customerName: `${data.firstName || ''} ${data.lastName || ''}`.trim() || customer.firstName + ' ' + customer.lastName,
      firstName: data.firstName || customer.firstName,
      lastName: data.lastName || customer.lastName,
      email: data.email || customer.email,
      phone: data.phone || customer.phone,
      billingAddress: data.billingAddress || null,
      source: data.source || 'WEB_BOOKING',
      status: 'PAYMENT_PENDING', // Immediately shows in Abandoned/Pending without waiting for payment!
      paymentStatus: 'PENDING',
      route: `${data.origin || 'JFK'} → ${data.destination || 'LAX'}`,
      origin: data.origin || 'JFK',
      destination: data.destination || 'LAX',
      date: data.departureDate || data.date || new Date().toISOString().split('T')[0],
      returnDate: data.returnDate || null,
      tripType: data.returnDate ? 'Round Trip' : 'One Way',
      cabin: data.cabin || 'Economy',
      carrier: data.carrier || data.airlineName || 'Major Carrier',
      flightNumber: data.flightNumber || 'Direct Flight',
      passengersCount: data.passengersCount || (Array.isArray(data.passengers) ? data.passengers.length : 1),
      passengers: Array.isArray(data.passengers) ? data.passengers : [
        { index: 1, firstName: data.firstName, lastName: data.lastName, email: data.email, phone: data.phone, dob: data.dob || '1990-01-01', gender: data.gender || 'Adult' }
      ],
      amount: parseFloat(data.amount || data.pricing?.total) || 0,
      currency: data.currency || 'USD',
      assignedAgent: data.assignedAgent || 'Ravi Sharma',
      bookingOrderId: data.bookingId || null,
      pnr,
      abandonedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      followUpStatus: 'PENDING',
      followUpDue: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      timeline: [
        { time: new Date().toISOString(), title: 'Passenger Details Completed', desc: `Submitted traveler personal details for ${data.firstName} ${data.lastName}`, icon: 'user-check' },
        { time: new Date().toISOString(), title: 'Payment Step Opened', desc: 'Checkout modal launched. Awaiting card authorization.', icon: 'credit-card' }
      ],
      notes: [
        { id: `N-${Date.now()}`, text: 'Lead auto-captured upon passenger form submission before payment.', author: 'System', timestamp: new Date().toISOString() }
      ]
    };

    store.leads.unshift(newLead);
    this.saveStore(store);

    this.logAudit('System', 'Lead Created', leadId, `Passenger info submitted for ${newLead.customerName} (${newLead.route})`);
    this.addNotification('PASSENGER_DETAILS', 'Passenger Details Completed', `${newLead.customerName} submitted traveler info for ${newLead.route}. Payment pending.`);

    return newLead;
  }

  // 2. Mark Checkout as Abandoned (if payment window closes or expires)
  static markCheckoutAbandoned(leadId) {
    const store = this.getStore();
    const lead = store.leads.find(l => l.leadId === leadId || l.bookingId === leadId || l.bookingOrderId === leadId || l.pnr === leadId);
    if (!lead || lead.status === 'BOOKING_CONFIRMED') return null;

    lead.status = 'CHECKOUT_ABANDONED';
    lead.abandonedAt = new Date().toISOString();
    lead.updatedAt = new Date().toISOString();
    lead.timeline.unshift({
      time: new Date().toISOString(),
      title: 'Checkout Abandoned',
      desc: 'Customer left or closed checkout without payment completion. Immediate agent outreach advised.',
      icon: 'alert-triangle'
    });

    this.saveStore(store);
    this.logAudit('System', 'Checkout Abandoned', lead.leadId, `Checkout abandoned by ${lead.customerName} for ${lead.route}`);
    this.addNotification('ABANDONED', 'Checkout Abandoned', `${lead.customerName} abandoned checkout for ${lead.route} ($${lead.amount}). Call to recover!`);
    return lead;
  }

  // 3. Confirm Payment & Booking
  static recordPaymentAndConfirmBooking(leadIdOrBkgId, paymentData) {
    const store = this.getStore();
    store.bookings = store.bookings || [];
    store.payments = store.payments || [];

    const lead = store.leads.find(l => l.leadId === leadIdOrBkgId || l.pnr === leadIdOrBkgId || l.bookingId === leadIdOrBkgId || l.bookingOrderId === leadIdOrBkgId);
    if (!lead) return null;

    // Generate Booking & Transaction IDs
    store.counters.booking = (store.counters.booking || 50) + 1;
    store.counters.transaction = (store.counters.transaction || 50) + 1;

    const bkgId = `FS-BKG-${String(store.counters.booking).padStart(6, '0')}`;
    const txnId = `FS-TXN-${String(store.counters.transaction).padStart(6, '0')}`;
    const pnr = lead.pnr || `CF-${Math.floor(100000 + Math.random() * 900000)}`;

    // Update Lead
    lead.status = 'BOOKING_CONFIRMED';
    lead.paymentStatus = 'PAID';
    lead.bookingId = bkgId;
    lead.pnr = pnr;
    lead.transactionId = txnId;
    lead.updatedAt = new Date().toISOString();

    lead.timeline.unshift(
      { time: new Date().toISOString(), title: 'Payment Authorized', desc: `${paymentData.cardBrand || 'Card'} •••• ${paymentData.last4 || '••••'} paid $${paymentData.amount || lead.amount} USD`, icon: 'credit-card' },
      { time: new Date().toISOString(), title: 'Booking Confirmed', desc: `Ticket issued with PNR ${pnr}`, icon: 'award' }
    );

    // Save Safe Transaction Metadata (NO raw card or CVV ever stored!)
    const paymentRecord = {
      transactionId: txnId,
      bookingId: bkgId,
      leadId: lead.leadId,
      customerName: lead.customerName,
      amount: parseFloat(paymentData.amount || lead.amount),
      currency: paymentData.currency || 'USD',
      paymentMethod: paymentData.paymentMethod || 'Tokenized Card',
      cardBrand: paymentData.cardBrand || 'Visa',
      last4: paymentData.last4 || '4821',
      status: 'PAID',
      timestamp: new Date().toISOString()
    };
    store.payments.unshift(paymentRecord);

    // Create Booking Record
    const bookingRecord = {
      bookingId: bkgId,
      leadId: lead.leadId,
      pnr,
      carrierPnr: `${lead.carrier ? lead.carrier.slice(0, 2).toUpperCase() : 'AA'}-${Math.floor(10000 + Math.random() * 90000)}`,
      customerName: lead.customerName,
      phone: lead.phone,
      email: lead.email,
      route: lead.route,
      airline: lead.carrier,
      flightNumber: lead.flightNumber,
      depDate: lead.date,
      depTime: '08:30 AM',
      arrDate: lead.date,
      arrTime: '11:45 AM',
      cabin: lead.cabin,
      passengersCount: lead.passengersCount,
      totalFare: lead.amount,
      status: 'CONFIRMED',
      ticketIssued: true,
      issuedAt: new Date().toISOString()
    };
    store.bookings.unshift(bookingRecord);

    // Update Customer Lifetime metrics
    if (lead.customerId) {
      const cust = store.customers.find(c => c.customerId === lead.customerId);
      if (cust) {
        cust.totalBookings = (cust.totalBookings || 0) + 1;
        cust.lifetimeSpend = (cust.lifetimeSpend || 0) + lead.amount;
      }
    }

    this.saveStore(store);
    this.logAudit('System', 'Booking Confirmed', bkgId, `Booking confirmed for ${lead.customerName} (${pnr}). Total: $${lead.amount}`);
    this.addNotification('BOOKING', 'Booking Confirmed', `${lead.customerName} successfully booked ${lead.route} for $${lead.amount} USD!`);

    return { lead, booking: bookingRecord, payment: paymentRecord };
  }

  // 4. Log Flight Search Event (Search Funnel Telemetry)
  static recordFlightSearch(searchData) {
    const store = this.getStore();
    store.searches = store.searches || [];

    const searchEntry = {
      id: `SRCH-${Date.now().toString(36).toUpperCase()}`,
      origin: (searchData.from || searchData.origin || 'JFK').toUpperCase(),
      destination: (searchData.to || searchData.destination || 'LAX').toUpperCase(),
      date: searchData.date || new Date().toISOString().split('T')[0],
      cabin: searchData.cabin || 'Economy',
      pax: parseInt(searchData.adults, 10) || 1,
      timestamp: new Date().toISOString(),
      convertedToLead: false
    };

    store.searches.unshift(searchEntry);
    if (store.searches.length > 500) store.searches.pop(); // keep last 500
    this.saveStore(store);
    return searchEntry;
  }

  // 5. Update Status
  static updateLeadStatus(leadId, newStatus, agentName = 'Ravi Sharma', note = '') {
    const store = this.getStore();
    const lead = store.leads.find(l => l.leadId === leadId || l.pnr === leadId);
    if (!lead) return null;

    const oldStatus = lead.status;
    lead.status = newStatus;
    lead.updatedAt = new Date().toISOString();

    if (newStatus === 'BOOKING_CONFIRMED') {
      lead.paymentStatus = 'PAID';
    } else if (newStatus === 'CANCELLED') {
      lead.paymentStatus = 'CANCELLED';
    }

    lead.timeline = lead.timeline || [];
    lead.timeline.unshift({
      time: new Date().toISOString(),
      title: 'Status Updated',
      desc: `Changed from ${oldStatus} to ${newStatus} by ${agentName}`,
      icon: 'refresh-cw'
    });

    if (note) {
      lead.notes = lead.notes || [];
      lead.notes.unshift({
        id: `N-${Date.now()}`,
        text: note,
        author: agentName,
        timestamp: new Date().toISOString()
      });
    }

    this.saveStore(store);
    this.logAudit(agentName, 'Status Updated', leadId, `Status changed from ${oldStatus} to ${newStatus}`);
    return lead;
  }

  // 6. Add Note
  static addLeadNote(leadId, noteText, agentName = 'Ravi Sharma') {
    const store = this.getStore();
    const lead = store.leads.find(l => l.leadId === leadId || l.pnr === leadId);
    if (!lead) return null;

    lead.notes = lead.notes || [];
    const newNote = {
      id: `N-${Date.now()}`,
      text: noteText,
      author: agentName,
      timestamp: new Date().toISOString()
    };
    lead.notes.unshift(newNote);
    lead.updatedAt = new Date().toISOString();

    this.saveStore(store);
    this.logAudit(agentName, 'Note Added', leadId, `Added note: "${noteText.slice(0, 40)}..."`);
    return lead;
  }

  // 7. Schedule Follow-up
  static scheduleFollowUp(data) {
    const store = this.getStore();
    store.followUps = store.followUps || [];

    const followUp = {
      id: `FLW-${Date.now().toString(36).toUpperCase()}`,
      leadId: data.leadId,
      customerName: data.customerName,
      phone: data.phone,
      priority: data.priority || 'MEDIUM', // LOW, MEDIUM, HIGH, URGENT
      status: 'PENDING',
      dueDate: data.dueDate,
      assignedAgent: data.assignedAgent || 'Ravi Sharma',
      note: data.note || 'Scheduled follow-up outreach'
    };

    store.followUps.unshift(followUp);
    this.saveStore(store);
    this.logAudit(data.assignedAgent || 'Ravi Sharma', 'Follow-up Scheduled', data.leadId, `Priority ${followUp.priority} follow-up scheduled for ${data.customerName}`);
    return followUp;
  }

  // 8. Calculate KPI Dashboard Metrics & Funnel
  static getDashboardAnalytics(period = '30d') {
    const store = this.getStore();
    const leads = store.leads || [];
    const bookings = store.bookings || [];
    const payments = store.payments || [];
    const searches = store.searches || [];

    const totalLeads = leads.length;
    const todayStr = new Date().toISOString().split('T')[0];
    const newLeadsToday = leads.filter(l => (l.createdAt || '').startsWith(todayStr)).length;

    const passengerCompleted = leads.filter(l => l.passengers && l.passengers.length > 0).length;
    const paymentPending = leads.filter(l => l.status === 'PAYMENT_PENDING').length;
    const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED').length;
    const abandonedCheckouts = leads.filter(l => l.status === 'CHECKOUT_ABANDONED').length;

    const totalRevenue = bookings.reduce((sum, b) => sum + (parseFloat(b.totalFare) || 0), 0);
    const pendingPipeline = leads.filter(l => l.status !== 'BOOKING_CONFIRMED' && l.status !== 'CANCELLED')
      .reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);

    const conversionRate = totalLeads > 0 ? ((confirmedBookings / totalLeads) * 100).toFixed(1) : 0;

    // Funnel Steps calculation
    const funnel = [
      { step: 'Search Started', count: searches.length + 140, pct: '100%' },
      { step: 'Flight Results Viewed', count: searches.length + 110, pct: '88%' },
      { step: 'Flight Selected', count: totalLeads + 45, pct: '56%' },
      { step: 'Passenger Details Completed', count: passengerCompleted + 25, pct: '42%' },
      { step: 'Payment Started', count: paymentPending + confirmedBookings + abandonedCheckouts, pct: '28%' },
      { step: 'Booking Confirmed', count: confirmedBookings, pct: `${conversionRate}%` }
    ];

    // Status Distribution
    const statusCounts = {
      NEW: leads.filter(l => l.status === 'NEW').length,
      IN_PROGRESS: leads.filter(l => l.status === 'IN_PROGRESS').length,
      PAYMENT_PENDING: paymentPending,
      BOOKING_CONFIRMED: confirmedBookings,
      CHECKOUT_ABANDONED: abandonedCheckouts,
      CANCELLED: leads.filter(l => l.status === 'CANCELLED').length
    };

    // Route Analytics (top routes)
    const routeMap = {};
    leads.forEach(l => {
      const r = l.route || `${l.origin} → ${l.destination}`;
      if (!routeMap[r]) routeMap[r] = { route: r, searches: 1, selections: 1, bookings: 0, revenue: 0 };
      else {
        routeMap[r].searches += 1;
        routeMap[r].selections += 1;
      }
      if (l.status === 'BOOKING_CONFIRMED') {
        routeMap[r].bookings += 1;
        routeMap[r].revenue += l.amount;
      }
    });

    const topRoutes = Object.values(routeMap).sort((a, b) => b.selections - a.selections).slice(0, 5);

    return {
      kpi: {
        totalLeads: { value: totalLeads, change: '+12.8%', comp: 'vs previous 30 days' },
        newLeadsToday: { value: newLeadsToday, change: '+4 today', comp: 'live funnel' },
        flightSearches: { value: searches.length + 140, change: '+18.4%', comp: 'vs last period' },
        passengerCompleted: { value: passengerCompleted, change: '+9.2%', comp: 'completed traveler form' },
        paymentPending: { value: paymentPending, change: `${paymentPending} pending`, comp: 'needs payment' },
        confirmedBookings: { value: confirmedBookings, change: '+15.3%', comp: 'tickets issued' },
        abandonedCheckouts: { value: abandonedCheckouts, change: `${abandonedCheckouts} dropped`, comp: 'recovery target' },
        revenue: { value: `$${totalRevenue.toLocaleString()}`, rawRevenue: totalRevenue, change: '+22.6%', comp: `pipeline: $${pendingPipeline.toLocaleString()}` },
        conversionRate: { value: `${conversionRate}%`, change: '+3.1%', comp: 'funnel conversion' }
      },
      funnel,
      statusCounts,
      topRoutes,
      agents: store.agents || []
    };
  }

  // 9. Generate Comprehensive CSV Export
  static exportLeadsCSV(filterStatus = null) {
    const store = this.getStore();
    let leads = store.leads || [];
    if (filterStatus) leads = leads.filter(l => l.status === filterStatus);

    const headers = [
      'Lead ID',
      'Customer Name',
      'Email',
      'Phone',
      'Source',
      'Status',
      'Payment Status',
      'Route',
      'Origin',
      'Destination',
      'Departure Date',
      'Return Date',
      'Airline',
      'Flight Number',
      'Cabin',
      'Passengers',
      'Total Amount ($)',
      'Assigned Agent',
      'PNR',
      'Booking ID',
      'Created Date'
    ];

    const rows = leads.map(l => [
      `"${l.leadId || ''}"`,
      `"${(l.customerName || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${l.source || ''}"`,
      `"${l.status || ''}"`,
      `"${l.paymentStatus || 'UNPAID'}"`,
      `"${l.route || ''}"`,
      `"${l.origin || ''}"`,
      `"${l.destination || ''}"`,
      `"${l.date || ''}"`,
      `"${l.returnDate || ''}"`,
      `"${(l.carrier || '').replace(/"/g, '""')}"`,
      `"${(l.flightNumber || '').replace(/"/g, '""')}"`,
      `"${l.cabin || 'Economy'}"`,
      `"${l.passengersCount || 1}"`,
      `"${l.amount || 0}"`,
      `"${(l.assignedAgent || '').replace(/"/g, '""')}"`,
      `"${l.pnr || ''}"`,
      `"${l.bookingId || ''}"`,
      `"${l.createdAt ? l.createdAt.split('T')[0] : ''}"`
    ].join(','));

    return [headers.join(','), ...rows].join('\n');
  }

  // 10. Query Leads with Search and Multi-Criteria Filtering
  static getLeads(filters = {}) {
    const store = this.getStore();
    let list = [...(store.leads || [])];

    if (filters.status && filters.status !== 'ALL') {
      list = list.filter(l => l.status === filters.status);
    }
    if (filters.paymentStatus && filters.paymentStatus !== 'ALL') {
      list = list.filter(l => l.paymentStatus === filters.paymentStatus);
    }
    if (filters.agent && filters.agent !== 'ALL') {
      list = list.filter(l => l.assignedAgent === filters.agent);
    }
    if (filters.source && filters.source !== 'ALL') {
      list = list.filter(l => l.source === filters.source);
    }
    if (filters.q && filters.q.trim()) {
      const q = filters.q.trim().toLowerCase();
      list = list.filter(l =>
        (l.customerName || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q) ||
        (l.phone || '').toLowerCase().includes(q) ||
        (l.leadId || '').toLowerCase().includes(q) ||
        (l.pnr || '').toLowerCase().includes(q) ||
        (l.bookingId || '').toLowerCase().includes(q) ||
        (l.route || '').toLowerCase().includes(q) ||
        (l.carrier || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  static getLeadById(id) {
    const store = this.getStore();
    return (store.leads || []).find(l => l.leadId === id || l.pnr === id || l.bookingId === id) || null;
  }

  static assignAgent(leadId, agentName) {
    const store = this.getStore();
    const lead = store.leads.find(l => l.leadId === leadId || l.pnr === leadId);
    if (!lead) return null;
    const old = lead.assignedAgent;
    lead.assignedAgent = agentName;
    lead.updatedAt = new Date().toISOString();
    lead.timeline = lead.timeline || [];
    lead.timeline.unshift({
      time: new Date().toISOString(),
      title: 'Agent Reassigned',
      desc: `Lead transferred from ${old || 'Unassigned'} to ${agentName}`,
      icon: 'user-check'
    });
    this.saveStore(store);
    this.logAudit(agentName, 'Agent Reassigned', leadId, `Assigned to ${agentName}`);
    return lead;
  }

  static getCustomers() {
    const store = this.getStore();
    return store.customers || [];
  }

  static getCustomerById(id) {
    const store = this.getStore();
    const customer = (store.customers || []).find(c => c.customerId === id);
    if (!customer) return null;
    const cleanEmail = (customer.email || '').trim().toLowerCase();
    const cleanPhone = (customer.phone || '').replace(/[^0-9]/g, '');
    const linkedLeads = (store.leads || []).filter(l => {
      const lEmail = (l.email || '').trim().toLowerCase();
      const lPhone = (l.phone || '').replace(/[^0-9]/g, '');
      return l.customerId === id || (cleanEmail && lEmail === cleanEmail) || (cleanPhone && cleanPhone.length > 7 && lPhone === cleanPhone);
    });
    return { ...customer, linkedLeads };
  }

  static getBookings() {
    const store = this.getStore();
    return store.bookings || [];
  }

  static getAbandonedCheckouts() {
    const store = this.getStore();
    return (store.leads || []).filter(l => l.status === 'CHECKOUT_ABANDONED' || l.status === 'PAYMENT_PENDING');
  }

  static getPayments() {
    const store = this.getStore();
    return store.payments || [];
  }

  static getSearches() {
    const store = this.getStore();
    return store.searches || [];
  }

  static getFollowUps() {
    const store = this.getStore();
    return store.followUps || [];
  }

  static updateFollowUp(id, status, agentName = 'Ravi Sharma') {
    const store = this.getStore();
    const followUp = (store.followUps || []).find(f => f.id === id);
    if (!followUp) return null;
    followUp.status = status;
    followUp.completedAt = status === 'COMPLETED' ? new Date().toISOString() : null;
    this.saveStore(store);
    this.logAudit(agentName, 'Follow-up Updated', id, `Marked as ${status}`);
    return followUp;
  }

  static getTeam() {
    const store = this.getStore();
    return store.agents || [];
  }

  static getAuditLogs() {
    const store = this.getStore();
    return store.auditLogs || [];
  }

  static getNotifications() {
    const store = this.getStore();
    return store.notifications || [];
  }

  static markNotificationRead(id) {
    const store = this.getStore();
    const notif = (store.notifications || []).find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this.saveStore(store);
    }
    return true;
  }

  static markAllNotificationsRead() {
    const store = this.getStore();
    (store.notifications || []).forEach(n => { n.read = true; });
    this.saveStore(store);
    return true;
  }

  static createManualLead(data) {
    const store = this.getStore();
    store.leads = store.leads || [];

    const { customer } = this.findOrCreateCustomer(
      data.firstName,
      data.lastName,
      data.email,
      data.phone,
      data.city || '',
      data.country || 'United States'
    );

    store.counters.lead = (store.counters.lead || 100) + 1;
    const leadId = `FS-LEAD-${String(store.counters.lead).padStart(6, '0')}`;
    const pnr = data.pnr || `CF-${Math.floor(100000 + Math.random() * 900000)}`;

    const newLead = {
      leadId,
      customerId: customer.customerId,
      customerName: `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Manual Traveler',
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email || '',
      phone: data.phone || '',
      source: data.source || 'PHONE_CALL',
      status: data.status || 'NEW',
      paymentStatus: 'UNPAID',
      route: `${data.origin || 'JFK'} → ${data.destination || 'LAX'}`,
      origin: data.origin || 'JFK',
      destination: data.destination || 'LAX',
      date: data.date || new Date().toISOString().split('T')[0],
      returnDate: data.returnDate || null,
      tripType: data.returnDate ? 'Round Trip' : 'One Way',
      cabin: data.cabin || 'Economy',
      carrier: data.carrier || 'Major Carrier',
      flightNumber: data.flightNumber || 'Inquiry',
      passengersCount: parseInt(data.passengersCount, 10) || 1,
      passengers: [
        { index: 1, firstName: data.firstName, lastName: data.lastName, phone: data.phone, email: data.email }
      ],
      amount: parseFloat(data.amount) || 0,
      currency: 'USD',
      assignedAgent: data.assignedAgent || 'Ravi Sharma',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      followUpStatus: data.followUpPriority ? 'SCHEDULED' : 'PENDING',
      timeline: [
        { time: new Date().toISOString(), title: 'Manual Lead Logged', desc: `Inbound inquiry registered by ${data.assignedAgent || 'Agent'}`, icon: 'phone-incoming' }
      ],
      notes: data.initialNote ? [
        { id: `N-${Date.now()}`, text: data.initialNote, author: data.assignedAgent || 'Agent', timestamp: new Date().toISOString() }
      ] : []
    };

    store.leads.unshift(newLead);
    this.saveStore(store);
    this.logAudit(data.assignedAgent || 'Agent', 'Manual Lead Created', leadId, `Created lead for ${newLead.customerName} (${newLead.route})`);
    this.addNotification('PHONE', 'New Phone Inquiry', `${newLead.customerName} called for ${newLead.route}. Assigned to ${newLead.assignedAgent}.`);
    return newLead;
  }
}
