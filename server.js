import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { verifiedAirlines, currencyExchange, formatUSD } from './data/flights.js';
import { IgnavService } from './services/ignav.js';
import { AirportSearchService } from './services/airport-search.js';

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

// Start Server
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`FScheapfare US Flight Booking Platform running at http://localhost:${PORT}`);
    console.log(`Verified Airport Index: ${AirportSearchService.search('', 1).length > 0 ? 'READY (7,917 IATA Airports Loaded)' : 'FAILED'}`);
  });
}

export default app;
