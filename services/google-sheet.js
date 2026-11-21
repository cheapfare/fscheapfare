import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

const DEFAULT_WEBHOOK_URL = process.env.GOOGLE_SHEET_WEBHOOK_URL || 
  'https://script.google.com/macros/s/AKfycbyJpiXicF-sZwtn-BjTBHXyOtKDBKDjJ_TEoULNgWrG1QUvkmoyQFUabSe8TLcpcz2a/exec';

const CONFIG_FILE = path.join(DATA_DIR, 'google-sheet-config.json');

function getWebhookUrl() {
  if (process.env.GOOGLE_SHEET_WEBHOOK_URL && process.env.GOOGLE_SHEET_WEBHOOK_URL.startsWith('http')) {
    return process.env.GOOGLE_SHEET_WEBHOOK_URL;
  }
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      if (cfg && cfg.webhookUrl && cfg.webhookUrl.startsWith('http')) {
        return cfg.webhookUrl;
      }
    }
  } catch (e) {}
  return DEFAULT_WEBHOOK_URL;
}

function formatPhoneForSheet(rawPhone) {
  if (!rawPhone) return '';
  const str = String(rawPhone).trim().replace(/^'/, '');
  if (!str) return '';
  // In Google Sheets / Excel, numbers or strings starting with + or = are parsed as formulas.
  // Prepending a single apostrophe ' forces Google Sheets to treat it as plain text and avoids #ERROR!
  return `'${str}`;
}

function getNowTimestamp() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

function escapeCsvField(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function appendToCsv(filename, headerRow, dataRow) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const filePath = path.join(DATA_DIR, filename);
    const isNew = !fs.existsSync(filePath);
    let content = '';
    if (isNew) {
      content += headerRow.join(',') + '\n';
    }
    content += dataRow.map(escapeCsvField).join(',') + '\n';
    fs.appendFileSync(filePath, content, 'utf8');
  } catch (err) {
    console.warn(`[GoogleSheet CSV Backup] Could not write ${filename}:`, err.message);
  }
}

async function postToWebhook(payload) {
  const webhookUrl = getWebhookUrl();
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    console.warn('[GoogleSheet] No valid webhook URL configured.');
    return { success: false, error: 'No webhook URL' };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeout);

    console.log(`[GoogleSheet] Successfully dispatched ${payload.action} to Google Sheet webhook (Status: ${res.status})`);
    return { success: true, status: res.status };
  } catch (err) {
    console.warn(`[GoogleSheet] Webhook dispatch notice (${payload.action}):`, err.message);
    return { success: false, error: err.message };
  }
}

export class GoogleSheetService {
  /**
   * Sheet 1: Save 1st Form (homeSearchForm) Flight Search Query
   */
  static async saveSearchToSheet1(searchData) {
    const timestamp = getNowTimestamp();
    const customerName = searchData.customer_name || searchData.name || 'Direct Search Traveler';
    const cleanPhone = (searchData.customer_phone || searchData.phone || '').trim().replace(/^'/, '');
    const sheetPhone = formatPhoneForSheet(cleanPhone);
    const origin = (searchData.origin || searchData.from || '').toUpperCase().trim();
    const originCity = searchData.originCity || searchData.fromCity || '';
    const destination = (searchData.destination || searchData.to || '').toUpperCase().trim();
    const destCity = searchData.destCity || searchData.toCity || '';
    const departureDate = searchData.departure_date || searchData.date || '';
    const returnDate = searchData.return_date || searchData.returnDate || '';
    const tripType = searchData.trip_type || searchData.tripType || (returnDate ? 'roundTrip' : 'oneWay');
    const adults = searchData.adults || 1;
    const children = searchData.children || 0;
    const infants = searchData.infants || 0;
    const cabinClass = searchData.cabin_class || searchData.cabin || 'Economy';
    const userIp = searchData.user_ip || searchData.ip || '';

    const payload = {
      action: 'sheet1',
      timestamp,
      customer_name: customerName,
      customer_phone: sheetPhone,
      name: customerName,
      phone: sheetPhone,
      origin,
      origin_city: originCity,
      from: origin,
      destination,
      dest_city: destCity,
      to: destination,
      departure_date: departureDate,
      dep_date: departureDate,
      return_date: returnDate || 'N/A (One Way)',
      trip_type: tripType,
      adults: Number(adults) || 1,
      passengers: Number(adults) || 1,
      children: Number(children) || 0,
      infants: Number(infants) || 0,
      cabin_class: cabinClass,
      cabin: cabinClass,
      user_ip: userIp
    };

    // 1. Send to Google Sheets Webhook
    postToWebhook(payload).catch(() => {});

    // 2. Safe local CSV Backup in data/sheet1_searches.csv
    const header = [
      'Timestamp', 'Customer Name', 'Phone Number', 'Origin', 'Origin City',
      'Destination', 'Destination City', 'Departure Date', 'Return Date',
      'Trip Type', 'Adults', 'Children', 'Infants', 'Cabin Class', 'IP Address'
    ];
    const row = [
      timestamp, customerName, cleanPhone, origin, originCity,
      destination, destCity, departureDate, returnDate || 'N/A',
      tripType, adults, children, infants, cabinClass, userIp
    ];
    appendToCsv('sheet1_searches.csv', header, row);

    return { status: 'success', action: 'sheet1', timestamp };
  }

  /**
   * Sheet 2: Save 2nd Form (Lead Traveler Details & Booking)
   */
  static async saveLeadTravelerToSheet2(travelerData) {
    const timestamp = getNowTimestamp();
    const bookingId = travelerData.bookingId || travelerData.ref_number || `FS-${Math.floor(100000 + Math.random() * 900000)}`;
    const pnr = travelerData.pnr || `CF-${Math.floor(100000 + Math.random() * 900000)}`;

    const title = travelerData.title || '';
    const firstName = travelerData.firstName || travelerData.pax_first_name || '';
    const middleName = travelerData.middleName || travelerData.pax_middle_name || '';
    const lastName = travelerData.lastName || travelerData.pax_last_name || '';
    const fullName = `${title ? title + ' ' : ''}${firstName} ${lastName}`.trim();
    const dob = travelerData.dob || travelerData.pax_dob || '';
    const gender = travelerData.gender || travelerData.pax_gender || '';
    const nationality = travelerData.nationality || '';

    // Contact & Address
    const email = travelerData.email || travelerData.contactEmail || '';
    const rawPhone = travelerData.phone || travelerData.contactPhone || '';
    const cleanPhone = String(rawPhone).trim().replace(/^'/, '');
    const sheetPhone = formatPhoneForSheet(cleanPhone);
    const street = travelerData.street || travelerData.billing_address || travelerData.address?.street || '';
    const city = travelerData.city || travelerData.billing_city || travelerData.address?.city || '';
    const state = travelerData.state || travelerData.billing_state || travelerData.address?.state || '';
    const zip = travelerData.zip || travelerData.billing_zip || travelerData.address?.zip || '';
    const country = travelerData.country || travelerData.billing_country || travelerData.address?.country || '';

    // Flight Details
    const flight = travelerData.flight || {};
    const airline = flight.airlineName || travelerData.airline || 'Verified Airline';
    const flightNumber = flight.flightNumber || travelerData.flight_number || 'Direct';
    const origin = flight.origin || travelerData.origin || '';
    const destination = flight.destination || travelerData.destination || '';
    const depDate = flight.date || travelerData.dep_date || '';
    const totalPrice = flight.pricing?.formattedTotal || (travelerData.price ? `$${travelerData.price}` : '$140.00');
    const userIp = travelerData.user_ip || travelerData.ip || '';

    const payload = {
      action: 'sheet2',
      timestamp,
      booking_id: bookingId,
      ref_number: bookingId,
      pnr,
      title,
      first_name: firstName,
      pax_first_name: firstName,
      pax_first: firstName,
      middle_name: middleName,
      pax_middle_name: middleName,
      pax_middle: middleName,
      last_name: lastName,
      pax_last_name: lastName,
      pax_last: lastName,
      full_name: fullName,
      dob,
      pax_dob: dob,
      gender,
      pax_gender: gender,
      nationality,
      email,
      billing_email: email,
      phone,
      billing_phone: phone,
      street_address: street,
      billing_address: street,
      city,
      billing_city: city,
      state,
      billing_state: state,
      zip,
      billing_zip: zip,
      country,
      billing_country: country,
      airline,
      flight_number: flightNumber,
      flight_no: flightNumber,
      origin,
      destination,
      departure_date: depDate,
      dep_date: depDate,
      total_price: totalPrice,
      price: totalPrice,
      user_ip: userIp
    };

    // 1. Send to Google Sheets Webhook
    postToWebhook(payload).catch(() => {});

    // 2. Safe local CSV Backup in data/sheet2_lead_travelers.csv
    const header = [
      'Timestamp', 'Booking ID', 'PNR', 'Title', 'First Name', 'Middle Name',
      'Last Name', 'Full Name', 'DOB', 'Gender', 'Nationality', 'Email',
      'Phone', 'Street Address', 'City', 'State', 'ZIP', 'Country',
      'Airline', 'Flight Number', 'Origin', 'Destination', 'Departure Date',
      'Total Price', 'IP Address'
    ];
    const row = [
      timestamp, bookingId, pnr, title, firstName, middleName,
      lastName, fullName, dob, gender, nationality, email,
      cleanPhone, street, city, state, zip, country,
      airline, flightNumber, origin, destination, depDate,
      totalPrice, userIp
    ];
    appendToCsv('sheet2_lead_travelers.csv', header, row);

    return { status: 'success', action: 'sheet2', bookingId, timestamp };
  }

  static getWebhookUrl() {
    return getWebhookUrl();
  }

  static setWebhookUrl(url) {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      throw new Error('Valid webhook URL starting with http/https is required');
    }
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ webhookUrl: url.trim(), updatedAt: new Date().toISOString() }, null, 2));
    process.env.GOOGLE_SHEET_WEBHOOK_URL = url.trim();
    return true;
  }
}
