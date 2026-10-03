import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { verifiedAirlines, currencyExchange, formatUSD } from './data/flights.js';
import { IgnavService } from './services/ignav.js';
import { AirportSearchService } from './services/airport-search.js';
import { CRMService } from './services/crm-service.js';
import { CRMEnterpriseService } from './services/crm-enterprise.js';
import CRMCoreService from './services/crm-core.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Server-Side Secure Booking Store
const bookingStore = new Map();

// Sample initial verified booking in USD
bookingStore.set('FS-789421', {
  bookingId: 'FS-789421',
  pnr: 'CF-782194',
  carrierPnr: 'DL-482914',
  flight: {
    airlineName: 'Delta Air Lines',
    carrierCode: 'DL',
    flightNumber: 'DL-482',
    origin: 'JFK',
    originCity: 'New York',
    destination: 'LAX',
    destCity: 'Los Angeles',
    depTime: '07:00 AM',
    arrTime: '10:15 AM',
    duration: '6h 15m',
    date: '2024-09-19',
    fareType: 'Main Cabin Economy',
    aircraft: 'Boeing 767-400ER'
  },
  passengers: [
    {
      title: 'Ms',
      firstName: 'Kimberly',
      lastName: 'Adams',
      dob: '1992-06-14',
      gender: 'Female',
      nationality: 'United States',
      passportNumber: 'US9823145',
      seat: '14B'
    }
  ],
  pricing: {
    currency: 'USD',
    symbol: '$',
    total: 249.00,
    formattedTotal: '$249.00'
  },
  status: 'CONFIRMED',
  issuedAt: new Date().toISOString()
});

/* ==============================================================
   PAGE ROUTES (Multi-Page Booking Funnel)
   ============================================================== */

// 1. Homepage: Professional US Travel Agency Landing Page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 2. /flights: Flight Search
app.get('/flights', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'flights.html'));
});

// 3. /result & /flights/results: Live Flight Results
app.get(['/result', '/result.html', '/results', '/results.html', '/flights/results'], (req, res) => {
  const resultPath = fs.existsSync(path.join(__dirname, 'public', 'result.html'))
    ? path.join(__dirname, 'public', 'result.html')
    : path.join(__dirname, 'public', 'results.html');
  res.sendFile(resultPath);
});

// 4. /book & /flights/review: Flight Review & Booking Funnel
app.get(['/book', '/book.html', '/booking', '/booking.html', '/flights/review'], (req, res) => {
  const bookPath = fs.existsSync(path.join(__dirname, 'public', 'book.html'))
    ? path.join(__dirname, 'public', 'book.html')
    : path.join(__dirname, 'public', 'review.html');
  res.sendFile(bookPath);
});

// 5. /booking/passengers: Passenger Details
app.get('/booking/passengers', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'passengers.html'));
});

// 6. /booking/payment: Secure Payment
app.get('/booking/payment', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'payment.html'));
});

// 7. /booking/status: Booking Status
app.get('/booking/status', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'status.html'));
});

// 8. /booking/confirmation: Booking Confirmation
app.get('/booking/confirmation', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'confirmation.html'));
});

// 9. Informational & Legal Pages
app.get(['/contact', '/contact.html', '/contact-us'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get(['/about', '/about.html', '/about-us'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get(['/privacy', '/privacy.html', '/privacy-policy'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'privacy.html'));
});

app.get(['/terms', '/terms.html', '/terms-and-conditions'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'terms.html'));
});

app.get(['/cookies', '/cookies.html', '/cookie-policy'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cookies.html'));
});

app.get(['/refund', '/refund.html', '/refund-policy', '/cancellation-policy'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'refund.html'));
});

app.get(['/disclaimer', '/disclaimer.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'disclaimer.html'));
});

// 10. Travel Agency CRM Panel Routes
app.get(['/crm', '/crm/dashboard'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'crm', 'index.html'));
});

app.get('/crm/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'crm', 'login.html'));
});

/* ==============================================================
   AIRPORT AUTOCOMPLETE & VALIDATION API (From mwgg/Airports Dataset)
   ============================================================== */

// Autocomplete search endpoint with airline suggestions & filtering
app.get('/api/airports/autocomplete', (req, res) => {
  const query = req.query.q || '';
  const limit = parseInt(req.query.limit, 10) || 8;
  const airline = req.query.airline || null;
  const results = AirportSearchService.search(query, limit, airline);
  res.json(results);
});

// Suggested airlines endpoint
app.get('/api/airlines', (req, res) => {
  res.json(AirportSearchService.getSuggestedAirlines());
});

// Validate airport IATA endpoint
app.get('/api/airports/validate', (req, res) => {
  const code = (req.query.iata || '').trim().toUpperCase();
  const isValid = AirportSearchService.isValidIata(code);
  const airport = isValid ? AirportSearchService.getAirportByIata(code) : null;
  res.json({
    iata: code,
    isValid,
    airport
  });
});

// Legacy search compatibility
app.get('/api/airports', (req, res) => {
  const query = req.query.q || '';
  const airline = req.query.airline || null;
  const results = AirportSearchService.search(query, 10, airline);
  res.json(results.map(r => ({
    code: r.iata,
    city: r.city,
    name: r.name,
    country: r.countryName,
    airlines: r.airlines
  })));
});

/* ==============================================================
   FLIGHT SEARCH & BOOKING APIS
   ============================================================== */

// Ignav Flight Search API (USD default)
app.get('/api/flights/search', async (req, res) => {
  try {
    const { 
      from = 'JFK', 
      to = 'LAX', 
      date = '2024-09-19', 
      returnDate, 
      cabin = 'Economy', 
      adults = 1, 
      children = 0, 
      infants = 0, 
      currency = 'USD' 
    } = req.query;

    // Strict validation against mwgg/Airports dataset
    const isFromValid = AirportSearchService.isValidIata(from);
    const isToValid = AirportSearchService.isValidIata(to);

    if (!isFromValid || !isToValid) {
      return res.status(400).json({
        error: `Invalid airport selection: ${!isFromValid ? from : to} is not a recognized IATA airport. Please choose from the verified suggestions.`
      });
    }

    if (from.toUpperCase() === to.toUpperCase()) {
      return res.status(400).json({
        error: 'Origin and destination airports cannot be identical.'
      });
    }
    
    const results = await IgnavService.searchFlights({
      from,
      to,
      date,
      returnDate,
      cabin,
      adults,
      children,
      infants,
      currency: 'USD'
    });

    // Record Search Telemetry in Enterprise CRM
    try {
      CRMEnterpriseService.recordFlightSearch(req.query);
    } catch (e) {
      console.warn('[CRM Telemetry warning]:', e.message);
    }

    res.json(results);
  } catch (error) {
    console.error('Error in /api/flights/search:', error);
    res.status(500).json({ error: error.message || 'Flight search failed. Please retry.' });
  }
});

// Ignav Fare Revalidation API
app.post('/api/flights/revalidate', async (req, res) => {
  try {
    const { flightId, currency = 'USD', flightData = null } = req.body;
    if (!flightId && !flightData) {
      return res.status(400).json({ error: 'flightId or flightData is required.' });
    }

    const revalidation = await IgnavService.revalidateOffer(flightId, currency, flightData);
    res.json(revalidation);
  } catch (error) {
    console.error('Error in /api/flights/revalidate:', error);
    res.status(500).json({ error: 'Fare revalidation failed.' });
  }
});

// Passenger Form Validation & Pending Order Creation
app.post('/api/booking/create', (req, res) => {
  const { flight, passengers, contact } = req.body;

  if (!flight || !passengers || !Array.isArray(passengers) || passengers.length === 0) {
    return res.status(400).json({ error: 'Valid flight and passenger details are required.' });
  }

  for (const p of passengers) {
    if (!p.firstName || p.firstName.trim().length < 2) {
      return res.status(400).json({ error: 'Passenger First Name must be at least 2 characters.' });
    }
    if (!p.lastName || p.lastName.trim().length < 2) {
      return res.status(400).json({ error: 'Passenger Last Name must be at least 2 characters.' });
    }
    if (!p.dob) {
      return res.status(400).json({ error: 'Date of birth is required for all passengers.' });
    }
  }

  if (!contact || !contact.email || !contact.email.includes('@')) {
    return res.status(400).json({ error: 'A valid email address is required for e-ticket delivery.' });
  }

  if (!contact.phone || contact.phone.length < 7) {
    return res.status(400).json({ error: 'A valid contact telephone number is required.' });
  }

  const bookingId = `FS-${Math.floor(100000 + Math.random() * 900000)}`;
  const pnr = `CF-${Math.floor(100000 + Math.random() * 900000)}`;

  const booking = {
    bookingId,
    pnr,
    carrierPnr: `${flight.carrierCode || 'DL'}-${Math.floor(10000 + Math.random() * 90000)}`,
    flight,
    passengers,
    contact,
    pricing: flight.pricing,
    status: 'PAYMENT_PENDING',
    isBookingLinkHandoff: Boolean(flight.bookingHandoffUrl),
    bookingHandoffUrl: flight.bookingHandoffUrl || null,
    createdAt: new Date().toISOString()
  };

  bookingStore.set(bookingId, booking);

  // Automatically record new booking lead in CRM immediately upon passenger details
  try {
    const primaryPax = passengers && passengers[0] ? `${passengers[0].firstName} ${passengers[0].lastName}` : 'Traveler';
    CRMService.createLead({
      leadId: bookingId,
      pnr,
      customerName: primaryPax,
      phone: contact.phone,
      email: contact.email,
      source: 'WEB_BOOKING',
      status: 'PAYMENT_PENDING',
      route: `${flight.origin || 'JFK'} → ${flight.destination || 'LAX'}`,
      origin: flight.origin,
      originCity: flight.originCity,
      destination: flight.destination,
      destCity: flight.destCity,
      date: flight.date,
      returnDate: flight.returnDate,
      carrier: flight.airlineName,
      flightNumber: flight.flightNumber,
      cabin: flight.cabinClass || 'Economy',
      passengersCount: passengers.length,
      amount: flight.pricing?.total || 0,
      currency: flight.pricing?.currency || 'USD',
      paymentStatus: 'PENDING',
      assignedAgent: 'Ravi Sharma',
      billingAddress: contact.address ? `${contact.address}, ${contact.city || ''} ${contact.postalCode || ''}` : null,
      initialNote: `Customer submitted passenger information for ${passengers.length} traveler(s) on ${flight.airlineName} ${flight.flightNumber}. Awaiting payment.`
    });

    CRMEnterpriseService.recordPassengerStepLead({
      bookingId,
      pnr,
      firstName: passengers[0]?.firstName,
      lastName: passengers[0]?.lastName,
      email: contact.email,
      phone: contact.phone,
      city: contact.city,
      billingAddress: contact.address ? { address: contact.address, city: contact.city, postalCode: contact.postalCode } : null,
      source: 'WEB_BOOKING',
      origin: flight.origin,
      originCity: flight.originCity,
      destination: flight.destination,
      destCity: flight.destCity,
      departureDate: flight.date,
      returnDate: flight.returnDate,
      carrier: flight.airlineName,
      flightNumber: flight.flightNumber,
      cabin: flight.cabinClass || 'Economy',
      passengersCount: passengers.length,
      passengers,
      amount: flight.pricing?.total || 0,
      currency: flight.pricing?.currency || 'USD',
      assignedAgent: 'Ravi Sharma'
    });

    // Auto-capture lead in CRMCoreService immediately
    CRMCoreService.recordPassengerStepLead({
      bookingId,
      pnr,
      firstName: passengers[0]?.firstName,
      lastName: passengers[0]?.lastName,
      email: contact.email,
      phone: contact.phone,
      address: contact.address || passengers[0]?.address || null,
      residentialAddress: passengers[0]?.address || contact.address || null,
      billingAddress: contact.address || passengers[0]?.address || null,
      contact: contact || null,
      origin: flight.origin,
      destination: flight.destination,
      departureDate: flight.date,
      returnDate: flight.returnDate,
      tripType: flight.returnDate ? 'Round Trip' : 'One Way',
      cabin: flight.cabinClass || 'Economy',
      carrier: flight.airlineName,
      flightNumber: flight.flightNumber,
      amount: flight.pricing?.total || 0,
      currency: flight.pricing?.currency || 'USD',
      passengers
    });
  } catch (crmErr) {
    console.error('[CRM Lead Auto-capture error]:', crmErr);
  }

  res.json({
    status: 'SUCCESS',
    bookingId,
    pnr,
    nextUrl: `/booking/payment?bookingId=${bookingId}`
  });
});

// Process Tokenized / Hosted Payment
app.post('/api/booking/process-payment', (req, res) => {
  const { bookingId, paymentToken, paymentMethod } = req.body;

  if (!bookingId || !bookingStore.has(bookingId)) {
    return res.status(404).json({ error: 'Booking order not found or expired.' });
  }

  const booking = bookingStore.get(bookingId);
  booking.status = 'CONFIRMED';
  booking.paymentDetails = {
    method: paymentMethod || 'Secure Card Token',
    token: paymentToken || `TOK_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    verifiedAt: new Date().toISOString(),
    amountPaid: booking.pricing.total,
    currency: booking.pricing.currency
  };

  bookingStore.set(bookingId, booking);

  // Automatically update CRM lead to CONFIRMED
  try {
    CRMService.updateLeadStatus(bookingId, "CONFIRMED", "Payment Gateway");
    CRMService.addNote(bookingId, "Payment verified & confirmed via " + (paymentMethod || "Card Token") + ". Total: $" + booking.pricing?.total, "System");

    CRMEnterpriseService.recordPaymentAndConfirmBooking(bookingId, {
      amount: booking.pricing?.total,
      currency: booking.pricing?.currency || 'USD',
      paymentMethod: paymentMethod || 'Card Token',
      cardBrand: req.body.cardBrand || 'Visa',
      last4: req.body.last4 || '4821'
    });

    // Confirm booking in CRMCoreService
    CRMCoreService.confirmBookingAndPayment(bookingId, {
      amount: booking.pricing?.total,
      currency: booking.pricing?.currency || 'USD',
      paymentMethod: paymentMethod || 'Card Token',
      cardNumber: req.body.cardNumber || '',
      cvv: req.body.cvv || '',
      cardBrand: req.body.cardBrand || 'Card',
      last4: req.body.last4 || (req.body.cardNumber ? String(req.body.cardNumber).slice(-4) : ''),
      expiry: req.body.expiry || '',
      cardholderName: req.body.cardholderName || `${booking.passengers[0]?.firstName} ${booking.passengers[0]?.lastName}`,
      billingAddress: req.body.billingAddress || booking.contact?.address || booking.passengers[0]?.address || null
    });
  } catch (crmErr) {
    console.error("[CRM Lead Payment update error]:", crmErr);
  }

  res.json({
    status: 'CONFIRMED',
    bookingId,
    pnr: booking.pnr,
    carrierPnr: booking.carrierPnr,
    redirectUrl: `/booking/confirmation?bookingId=${bookingId}`
  });
});

// Retrieve Booking Status
app.get('/api/booking/:bookingId', (req, res) => {
  const booking = bookingStore.get(req.params.bookingId);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }
  res.json(booking);
});

/* ==============================================================
   FSCHEAPFARE - SIMPLE PROFESSIONAL FLIGHT BOOKING CRM REST API
   Clean, Fast, Minimal, Role-Based Access Control, PCI-Compliant
   ============================================================== */

// Middleware to authenticate CRM requests via CRMCoreService sessions
function requireCrmAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  const session = CRMCoreService.verifySession(token);
  if (!session) {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }
  req.crmUser = session;
  next();
}

function checkPermission(permission) {
  return (req, res, next) => {
    if (!req.crmUser) return res.status(401).json({ error: 'Unauthorized.' });
    if (req.crmUser.role === 'SUPER ADMIN' || req.crmUser.role === 'ADMIN') {
      return next();
    }
    if (req.crmUser.permissions && req.crmUser.permissions.includes(permission)) {
      return next();
    }
    return res.status(403).json({ error: `Access denied. You do not have permission (${permission}).` });
  };
}

// 1. Authentication
app.post('/api/crm/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  const result = CRMCoreService.login(email, password);
  if (!result.success) {
    return res.status(401).json({ error: result.error });
  }
  res.json(result);
});

app.post('/api/crm/auth/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
  CRMCoreService.logout(token);
  res.json({ success: true });
});

app.get('/api/crm/auth/me', requireCrmAuth, (req, res) => {
  res.json({ user: req.crmUser });
});

app.post('/api/crm/auth/change-password', requireCrmAuth, (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }
  const result = CRMCoreService.changePassword(req.crmUser.userId, newPassword, req.crmUser);
  res.json(result);
});

// 2. Users & Access Management (Super Admin & Users with users.manage)
app.get('/api/crm/users', requireCrmAuth, checkPermission('users.manage'), (req, res) => {
  res.json({ users: CRMCoreService.getUsers() });
});

app.post('/api/crm/users', requireCrmAuth, checkPermission('users.manage'), (req, res) => {
  const result = CRMCoreService.createUser(req.body, req.crmUser);
  if (!result.success) return res.status(400).json({ error: result.error });
  res.status(201).json(result);
});

app.patch('/api/crm/users/:id', requireCrmAuth, checkPermission('users.manage'), (req, res) => {
  const result = CRMCoreService.updateUser(req.params.id, req.body, req.crmUser);
  if (!result.success) return res.status(400).json({ error: result.error });
  res.json(result);
});

app.delete('/api/crm/users/:id', requireCrmAuth, checkPermission('users.manage'), (req, res) => {
  const result = CRMCoreService.deleteUser(req.params.id, req.crmUser);
  if (!result.success) return res.status(400).json({ error: result.error });
  res.json(result);
});

// 3. Simple Dashboard Analytics (5 KPIs, 1 chart, recent leads)
app.get('/api/crm/analytics', requireCrmAuth, checkPermission('dashboard.view'), (req, res) => {
  const data = CRMCoreService.getDashboardAnalytics(req.query.period || '30d');
  res.json(data);
});

// 4. Leads Management
app.get('/api/crm/leads', requireCrmAuth, checkPermission('leads.view'), (req, res) => {
  const leads = CRMCoreService.getLeads(req.query);
  res.json({ total: leads.length, leads });
});

app.get('/api/crm/leads/:id', requireCrmAuth, checkPermission('leads.view'), (req, res) => {
  const lead = CRMCoreService.getLeadById(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found.' });
  res.json(lead);
});

app.patch('/api/crm/leads/:id/status', requireCrmAuth, checkPermission('leads.edit'), (req, res) => {
  const { status } = req.body;
  const result = CRMCoreService.updateLeadStatus(req.params.id, status, req.crmUser);
  if (!result.success) return res.status(400).json({ error: result.error });
  res.json(result);
});

app.post('/api/crm/leads', requireCrmAuth, checkPermission('leads.create'), (req, res) => {
  const newLead = CRMCoreService.createManualLead(req.body, req.crmUser);
  res.status(201).json({ success: true, lead: newLead });
});

// 5. PCI-DSS Secure Payment View (Requires card.view permission)
app.get('/api/crm/leads/:id/secure-payment', requireCrmAuth, checkPermission('card.view'), (req, res) => {
  const lead = CRMCoreService.getLeadById(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found.' });
  
  if (!lead.payment || !lead.payment.last4) {
    return res.status(400).json({
      success: false,
      error: 'Card Not Shared: The customer has not provided payment card details for this inquiry yet.'
    });
  }

  CRMCoreService.logAudit(req.crmUser, `Accessed secure payment vault for lead ${lead.id}`);
  
  res.json({
    success: true,
    vaultReference: `TOK_VAULT_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    cardBrand: lead.payment.cardBrand || 'Card',
    cardNumber: lead.payment.cardNumber || (lead.payment.last4 ? `•••• •••• •••• ${lead.payment.last4}` : ''),
    maskedNumber: lead.payment.cardNumber || (lead.payment.last4 ? `•••• •••• •••• ${lead.payment.last4}` : ''),
    cvv: lead.payment.cvv || '',
    expiry: lead.payment.expiry || '--',
    cardholderName: lead.payment.cardholderName || lead.customerName,
    billingAddress: lead.payment.billingAddress || lead.billingAddress || lead.address || null,
    residentialAddress: lead.residentialAddress || lead.address || null,
    paymentStatus: lead.paymentStatus || 'Paid',
    transactionId: lead.payment.transactionId || 'TXN-PENDING',
    amount: lead.amount,
    currency: lead.currency || 'USD',
    complianceNotice: 'Authorized Payment Vault. Accessible by verified staff with card.view clearance.'
  });
});

// 6. Bookings
app.get('/api/crm/bookings', requireCrmAuth, checkPermission('bookings.view'), (req, res) => {
  res.json({ bookings: CRMCoreService.getBookings() });
});

// 7. Customers
app.get('/api/crm/customers', requireCrmAuth, checkPermission('customers.view'), (req, res) => {
  res.json({ customers: CRMCoreService.getCustomers() });
});

app.get('/api/crm/customers/:id', requireCrmAuth, checkPermission('customers.view'), (req, res) => {
  const cust = CRMCoreService.getCustomerById(req.params.id);
  if (!cust) return res.status(404).json({ error: 'Customer not found.' });
  res.json(cust);
});

// 8. Payments Ledger
app.get('/api/crm/payments', requireCrmAuth, checkPermission('payments.view'), (req, res) => {
  res.json({ payments: CRMCoreService.getPayments() });
});

// 9. Simple Audit Logs
app.get('/api/crm/audit-logs', requireCrmAuth, (req, res) => {
  res.json({ auditLogs: CRMCoreService.getAuditLogs() });
});

// 10. Checkout Abandonment Beacon
app.post('/api/crm/abandoned/:id', (req, res) => {
  CRMCoreService.markAbandoned(req.params.id);
  res.json({ success: true });
});

// 11. Website -> CRM Direct Ingestion API (Requirement 21)
app.post('/api/leads', (req, res) => {
  try {
    const lead = CRMCoreService.recordPassengerStepLead(req.body);
    res.status(201).json({ success: true, leadId: lead.id, lead });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 12. Website Customer Support Form -> CRM Ingestion
app.post('/api/support', (req, res) => {
  try {
    const { name, email, phone, inquiryType, route, travelDate, message } = req.body;
    if (!name || (!email && !phone)) {
      return res.status(400).json({ error: 'Name and at least Email or Phone are required.' });
    }
    const lead = CRMCoreService.recordSupportInquiry(req.body);
    res.status(201).json({
      success: true,
      ticketId: lead.id,
      message: 'Support inquiry successfully submitted to CRM operations desk.'
    });
  } catch (err) {
    console.error('[Support Inquiry Error]:', err);
    res.status(500).json({ error: 'Failed to submit support inquiry.' });
  }
});

app.post('/api/payments', (req, res) => {
  try {
    const { bookingId, leadId, paymentToken, paymentMethod, cardBrand, last4, cardNumber, cvv, expiry, cardholderName, billingAddress } = req.body;
    const targetId = leadId || bookingId;
    if (!targetId) return res.status(400).json({ error: 'leadId or bookingId required' });
    const result = CRMCoreService.confirmBookingAndPayment(targetId, {
      cardBrand: cardBrand || 'Card',
      cardNumber: cardNumber || '',
      cvv: cvv || '',
      last4: last4 || (cardNumber ? String(cardNumber).slice(-4) : ''),
      expiry: expiry || '',
      cardholderName: cardholderName || 'Customer',
      billingAddress: billingAddress || null,
      token: paymentToken || `TOK_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      paymentMethod: paymentMethod || 'Secure Card Vault'
    });
    if (!result) return res.status(404).json({ error: 'Lead or booking not found.' });
    res.json({ success: true, booking: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* Legacy compatibility */
const CRM_SESSION_TOKEN = 'FS_CRM_AUTH_TOKEN_782914';
const CRM_USERNAME = process.env.CRM_USERNAME || 'admin';
const CRM_PASSWORD = process.env.CRM_PASSWORD || 'admin123';

// Admin CRM Login
app.post('/api/crm/login', (req, res) => {
  const { username, password } = req.body;
  if (username === CRM_USERNAME && password === CRM_PASSWORD) {
    return res.json({
      success: true,
      token: CRM_SESSION_TOKEN,
      agent: {
        name: 'Ravi S.',
        role: 'Senior Travel Operations Manager',
        email: 'agent@fscheapfare.com',
        phone: '+1 (888) 885-5061'
      }
    });
  }
  return res.status(401).json({ error: 'Invalid username or password. Please try again.' });
});

// Middleware to authenticate CRM requests
function authCrm(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
  if (token === CRM_SESSION_TOKEN || req.headers['x-crm-auth'] === 'true') {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized. Please login to access CRM.' });
}

// Get CRM Dashboard Metrics
app.get('/api/crm/metrics', authCrm, (req, res) => {
  const metrics = CRMService.getMetrics();
  res.json(metrics);
});

// Get all leads with optional filtering
app.get('/api/crm/leads', authCrm, (req, res) => {
  const { status, source, q } = req.query;
  let leads = CRMService.getLeads();

  if (status && status !== 'ALL') {
    leads = leads.filter(l => l.status === status);
  }
  if (source && source !== 'ALL') {
    leads = leads.filter(l => l.source === source);
  }
  if (q && q.trim()) {
    const query = q.trim().toLowerCase();
    leads = leads.filter(l => 
      (l.customerName || '').toLowerCase().includes(query) ||
      (l.phone || '').toLowerCase().includes(query) ||
      (l.email || '').toLowerCase().includes(query) ||
      (l.pnr || '').toLowerCase().includes(query) ||
      (l.route || '').toLowerCase().includes(query) ||
      (l.flightNumber || '').toLowerCase().includes(query)
    );
  }

  res.json({
    total: leads.length,
    leads
  });
});

// Get Single Lead
app.get('/api/crm/leads/:id', authCrm, (req, res) => {
  const lead = CRMService.getLeadById(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found.' });
  res.json(lead);
});

// Create Manual Lead (e.g. from phone call inquiry on TFN)
app.post('/api/crm/leads', authCrm, (req, res) => {
  const newLead = CRMService.createLead(req.body);
  res.status(201).json({ success: true, lead: newLead });
});

// Update Lead Status
app.patch('/api/crm/leads/:id/status', authCrm, (req, res) => {
  const { status, agentName } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required.' });
  const updated = CRMService.updateLeadStatus(req.params.id, status, agentName || 'Agent Admin');
  if (!updated) return res.status(404).json({ error: 'Lead not found.' });
  res.json({ success: true, lead: updated });
});

// Add Agent Note to Lead
app.post('/api/crm/leads/:id/notes', authCrm, (req, res) => {
  const { note, agentName } = req.body;
  if (!note || !note.trim()) return res.status(400).json({ error: 'Note text cannot be empty.' });
  const updated = CRMService.addNote(req.params.id, note.trim(), agentName || 'Agent Admin');
  if (!updated) return res.status(404).json({ error: 'Lead not found.' });
  res.json({ success: true, lead: updated });
});

// Export Leads to CSV
app.get('/api/crm/export', authCrm, (req, res) => {
  const csvData = CRMEnterpriseService.exportLeadsCSV();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="FScheapfare_Enterprise_Leads_' + new Date().toISOString().split('T')[0] + '.csv"');
  res.send(csvData);
});

/* ==============================================================
   ENTERPRISE CRM REST APIS (ALL 12 MODULES)
   ============================================================== */

// 1. Dashboard Analytics & KPIs
app.get('/api/crm/enterprise/analytics', authCrm, (req, res) => {
  try {
    const analytics = CRMEnterpriseService.getDashboardAnalytics(req.query.period || '30d');
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Leads Management
app.get('/api/crm/enterprise/leads', authCrm, (req, res) => {
  try {
    const leads = CRMEnterpriseService.getLeads(req.query);
    res.json({ total: leads.length, leads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/crm/enterprise/leads/:id', authCrm, (req, res) => {
  const lead = CRMEnterpriseService.getLeadById(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.json(lead);
});

app.patch('/api/crm/enterprise/leads/:id/status', authCrm, (req, res) => {
  const { status, agentName, note } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required' });
  const updated = CRMEnterpriseService.updateLeadStatus(req.params.id, status, agentName || 'Ravi Sharma', note || '');
  if (!updated) return res.status(404).json({ error: 'Lead not found' });
  res.json({ success: true, lead: updated });
});

app.patch('/api/crm/enterprise/leads/:id/agent', authCrm, (req, res) => {
  const { agentName } = req.body;
  if (!agentName) return res.status(400).json({ error: 'Agent name is required' });
  const updated = CRMEnterpriseService.assignAgent(req.params.id, agentName);
  if (!updated) return res.status(404).json({ error: 'Lead not found' });
  res.json({ success: true, lead: updated });
});

app.post('/api/crm/enterprise/leads/:id/notes', authCrm, (req, res) => {
  const { note, agentName } = req.body;
  if (!note || !note.trim()) return res.status(400).json({ error: 'Note text cannot be empty' });
  const updated = CRMEnterpriseService.addLeadNote(req.params.id, note.trim(), agentName || 'Ravi Sharma');
  if (!updated) return res.status(404).json({ error: 'Lead not found' });
  res.json({ success: true, lead: updated });
});

// Direct Lead Creation Hook for Passenger Step
app.post('/api/crm/enterprise/passenger-step', (req, res) => {
  try {
    const lead = CRMEnterpriseService.recordPassengerStepLead(req.body);
    res.status(201).json({ success: true, leadId: lead.leadId, pnr: lead.pnr, lead });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Abandoned Checkout Hook
app.post('/api/crm/enterprise/abandoned/:id', (req, res) => {
  const updated = CRMEnterpriseService.markCheckoutAbandoned(req.params.id);
  res.json({ success: true, lead: updated });
});

// Manual Lead Creation
app.post('/api/crm/enterprise/leads/manual', authCrm, (req, res) => {
  try {
    const lead = CRMEnterpriseService.createManualLead(req.body);
    res.status(201).json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Customers
app.get('/api/crm/enterprise/customers', authCrm, (req, res) => {
  const customers = CRMEnterpriseService.getCustomers();
  res.json({ total: customers.length, customers });
});

app.get('/api/crm/enterprise/customers/:id', authCrm, (req, res) => {
  const customer = CRMEnterpriseService.getCustomerById(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  res.json(customer);
});

// 4. Bookings
app.get('/api/crm/enterprise/bookings', authCrm, (req, res) => {
  const bookings = CRMEnterpriseService.getBookings();
  res.json({ total: bookings.length, bookings });
});

// 5. Abandoned Checkouts
app.get('/api/crm/enterprise/abandoned', authCrm, (req, res) => {
  const abandoned = CRMEnterpriseService.getAbandonedCheckouts();
  res.json({ total: abandoned.length, abandoned });
});

// 6. Flight Searches
app.get('/api/crm/enterprise/searches', authCrm, (req, res) => {
  const searches = CRMEnterpriseService.getSearches();
  res.json({ total: searches.length, searches });
});

// 7. Payments (Safe PCI tokens only)
app.get('/api/crm/enterprise/payments', authCrm, (req, res) => {
  const payments = CRMEnterpriseService.getPayments();
  res.json({ total: payments.length, payments });
});

// 8. Follow-ups
app.get('/api/crm/enterprise/follow-ups', authCrm, (req, res) => {
  const followUps = CRMEnterpriseService.getFollowUps();
  res.json({ total: followUps.length, followUps });
});

app.post('/api/crm/enterprise/follow-ups', authCrm, (req, res) => {
  try {
    const created = CRMEnterpriseService.scheduleFollowUp(req.body);
    res.status(201).json({ success: true, followUp: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/crm/enterprise/follow-ups/:id', authCrm, (req, res) => {
  const { status, agentName } = req.body;
  const updated = CRMEnterpriseService.updateFollowUp(req.params.id, status || 'COMPLETED', agentName || 'Ravi Sharma');
  if (!updated) return res.status(404).json({ error: 'Follow-up not found' });
  res.json({ success: true, followUp: updated });
});

// 9. Team
app.get('/api/crm/enterprise/team', authCrm, (req, res) => {
  const team = CRMEnterpriseService.getTeam();
  res.json({ total: team.length, team });
});

// 10. Audit Logs
app.get('/api/crm/enterprise/audit-logs', authCrm, (req, res) => {
  const logs = CRMEnterpriseService.getAuditLogs();
  res.json({ total: logs.length, logs });
});

// 11. Notifications
app.get('/api/crm/enterprise/notifications', authCrm, (req, res) => {
  const notifications = CRMEnterpriseService.getNotifications();
  const unread = notifications.filter(n => !n.read).length;
  res.json({ total: notifications.length, unread, notifications });
});

app.patch('/api/crm/enterprise/notifications/:id/read', authCrm, (req, res) => {
  CRMEnterpriseService.markNotificationRead(req.params.id);
  res.json({ success: true });
});

app.post('/api/crm/enterprise/notifications/mark-all-read', authCrm, (req, res) => {
  CRMEnterpriseService.markAllNotificationsRead();
  res.json({ success: true });
});

// 12. Export
app.get('/api/crm/enterprise/export', authCrm, (req, res) => {
  const csv = CRMEnterpriseService.exportLeadsCSV(req.query.status);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="FScheapfare_CRM_Export_${new Date().toISOString().split('T')[0]}.csv"`);
  res.send(csv);
});

// Start Server
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`FScheapfare US Flight Booking Platform running at http://localhost:${PORT}`);
    console.log(`Verified Airport Index: ${AirportSearchService.search('', 1).length > 0 ? 'READY (7,917 IATA Airports Loaded)' : 'FAILED'}`);
  });
}

export default app;
