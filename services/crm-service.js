import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const LEADS_FILE = path.join(DATA_DIR, 'crm_leads.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial realistic sample leads if file doesn't exist
const INITIAL_LEADS = [
  {
    leadId: 'LD-100821',
    pnr: 'CF-782194',
    customerName: 'Kimberly Adams',
    phone: '+1 (555) 234-8910',
    email: 'kimberly.adams@example.com',
    source: 'WEB_BOOKING',
    status: 'CONFIRMED',
    route: 'JFK → LAX',
    origin: 'JFK',
    originCity: 'New York',
    destination: 'LAX',
    destCity: 'Los Angeles',
    date: '2026-11-20',
    returnDate: '2026-11-27',
    carrier: 'Delta Air Lines',
    flightNumber: 'DL 482',
    cabin: 'Economy',
    passengersCount: 1,
    amount: 249.00,
    currency: 'USD',
    paymentStatus: 'PAID',
    assignedAgent: 'Ravi S.',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    notes: [
      { text: 'Customer completed online payment via card token.', author: 'System', timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString() },
      { text: 'Sent e-ticket copy to customer email.', author: 'Ravi S.', timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString() }
    ]
  },
  {
    leadId: 'LD-100822',
    pnr: 'CF-842109',
    customerName: 'David Miller',
    phone: '+1 (888) 492-3110',
    email: 'dmiller.travel@gmail.com',
    source: 'PHONE_CALL',
    status: 'IN_PROGRESS',
    route: 'ORD → MIA',
    origin: 'ORD',
    originCity: 'Chicago',
    destination: 'MIA',
    destCity: 'Miami',
    date: '2026-11-15',
    returnDate: '2026-11-22',
    carrier: 'American Airlines',
    flightNumber: 'AA 1420',
    cabin: 'Economy',
    passengersCount: 2,
    amount: 518.00,
    currency: 'USD',
    paymentStatus: 'PENDING',
    assignedAgent: 'Alex M.',
    createdAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    notes: [
      { text: 'Customer called on TFN (+1 888-885-5061) asking for family holiday discount.', author: 'Alex M.', timestamp: new Date(Date.now() - 105 * 60 * 1000).toISOString() },
      { text: 'Quoted $259/pax. Follow up scheduled at 4:30 PM today.', author: 'Alex M.', timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString() }
    ]
  },
  {
    leadId: 'LD-100823',
    pnr: 'CF-910482',
    customerName: 'Sarah Jenkins',
    phone: '+1 (312) 789-4412',
    email: 'sarah.j@outlook.com',
    source: 'WEB_BOOKING',
    status: 'PAYMENT_PENDING',
    route: 'SFO → LHR',
    origin: 'SFO',
    originCity: 'San Francisco',
    destination: 'LHR',
    destCity: 'London',
    date: '2026-12-05',
    returnDate: null,
    carrier: 'British Airways',
    flightNumber: 'BA 286',
    cabin: 'Premium Economy',
    passengersCount: 1,
    amount: 680.00,
    currency: 'USD',
    paymentStatus: 'UNPAID',
    assignedAgent: 'Unassigned',
    createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    notes: [
      { text: 'Customer reached payment review page but card authorization timed out.', author: 'System', timestamp: new Date(Date.now() - 175 * 60 * 1000).toISOString() },
      { text: 'Need to call customer to assist with transaction.', author: 'System', timestamp: new Date(Date.now() - 175 * 60 * 1000).toISOString() }
    ]
  },
  {
    leadId: 'LD-100824',
    pnr: 'CF-639102',
    customerName: 'Michael Chang',
    phone: '+1 (415) 662-8901',
    email: 'm.chang99@yahoo.com',
    source: 'SEARCH_INQUIRY',
    status: 'NEW',
    route: 'LAX → NRT',
    origin: 'LAX',
    originCity: 'Los Angeles',
    destination: 'NRT',
    destCity: 'Tokyo',
    date: '2026-12-10',
    returnDate: '2026-12-24',
    carrier: 'All Nippon Airways',
    flightNumber: 'NH 5',
    cabin: 'Economy',
    passengersCount: 1,
    amount: 890.00,
    currency: 'USD',
    paymentStatus: 'UNPAID',
    assignedAgent: 'Unassigned',
    createdAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    notes: [
      { text: 'High-intent search inquiry on Tokyo holiday route.', author: 'System', timestamp: new Date(Date.now() - 240 * 60 * 1000).toISOString() }
    ]
  }
];

export class CRMService {
  static getLeads() {
    try {
      if (!fs.existsSync(LEADS_FILE)) {
        fs.writeFileSync(LEADS_FILE, JSON.stringify(INITIAL_LEADS, null, 2), 'utf-8');
        return INITIAL_LEADS;
      }
      const data = fs.readFileSync(LEADS_FILE, 'utf-8');
      const leads = JSON.parse(data || '[]');
      return Array.isArray(leads) ? leads : [];
    } catch (err) {
      console.error('[CRMService] Error reading leads file:', err);
      return INITIAL_LEADS;
    }
  }

  static saveLeads(leads) {
    try {
      fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('[CRMService] Error saving leads file:', err);
      return false;
    }
  }

  static getLeadById(leadId) {
    const leads = this.getLeads();
    return leads.find(l => l.leadId === leadId || l.pnr === leadId) || null;
  }

  static createLead(leadData) {
    const leads = this.getLeads();
    const newId = `LD-${Math.floor(100000 + Math.random() * 900000)}`;
    const newPnr = leadData.pnr || `CF-${Math.floor(100000 + Math.random() * 900000)}`;

    const newLead = {
      leadId: newId,
      pnr: newPnr,
      customerName: leadData.customerName || 'Direct Traveler',
      phone: leadData.phone || 'N/A',
      email: leadData.email || 'N/A',
      source: leadData.source || 'MANUAL_PHONE',
      status: leadData.status || 'NEW',
      route: leadData.route || `${leadData.origin || 'JFK'} → ${leadData.destination || 'LAX'}`,
      origin: leadData.origin || 'JFK',
      originCity: leadData.originCity || leadData.origin || 'JFK',
      destination: leadData.destination || 'LAX',
      destCity: leadData.destCity || leadData.destination || 'LAX',
      date: leadData.date || new Date().toISOString().split('T')[0],
      returnDate: leadData.returnDate || null,
      carrier: leadData.carrier || 'Major Carrier',
      flightNumber: leadData.flightNumber || 'Direct Flight',
      cabin: leadData.cabin || 'Economy',
      passengersCount: parseInt(leadData.passengersCount, 10) || 1,
      amount: parseFloat(leadData.amount) || 0,
      currency: leadData.currency || 'USD',
      paymentStatus: leadData.paymentStatus || 'UNPAID',
      assignedAgent: leadData.assignedAgent || 'Agent Admin',
      billingAddress: leadData.billingAddress || null,
      createdAt: new Date().toISOString(),
      notes: leadData.notes || [
        {
          text: leadData.initialNote || 'Lead captured into CRM system.',
          author: leadData.assignedAgent || 'System',
          timestamp: new Date().toISOString()
        }
      ]
    };

    leads.unshift(newLead);
    this.saveLeads(leads);
    return newLead;
  }

  static updateLeadStatus(leadId, newStatus, agentName = 'Agent Admin') {
    const leads = this.getLeads();
    const index = leads.findIndex(l => l.leadId === leadId || l.pnr === leadId);
    if (index === -1) return null;

    const oldStatus = leads[index].status;
    leads[index].status = newStatus;
    if (newStatus === 'CONFIRMED' || newStatus === 'TICKET_ISSUED') {
      leads[index].paymentStatus = 'PAID';
    } else if (newStatus === 'CANCELLED') {
      leads[index].paymentStatus = 'CANCELLED';
    }

    leads[index].notes = leads[index].notes || [];
    leads[index].notes.unshift({
      text: `Status changed from ${oldStatus} to ${newStatus}.`,
      author: agentName,
      timestamp: new Date().toISOString()
    });

    this.saveLeads(leads);
    return leads[index];
  }

  static addNote(leadId, noteText, author = 'Agent Admin') {
    const leads = this.getLeads();
    const index = leads.findIndex(l => l.leadId === leadId || l.pnr === leadId);
    if (index === -1) return null;

    leads[index].notes = leads[index].notes || [];
    const newNote = {
      text: noteText,
      author,
      timestamp: new Date().toISOString()
    };
    leads[index].notes.unshift(newNote);

    this.saveLeads(leads);
    return leads[index];
  }

  static getMetrics() {
    const leads = this.getLeads();
    const totalLeads = leads.length;

    const confirmedCount = leads.filter(l => l.status === 'CONFIRMED' || l.status === 'TICKET_ISSUED').length;
    const inProgressCount = leads.filter(l => l.status === 'IN_PROGRESS' || l.status === 'NEW' || l.status === 'PAYMENT_PENDING').length;
    const cancelledCount = leads.filter(l => l.status === 'CANCELLED').length;

    const totalRevenue = leads
      .filter(l => l.status === 'CONFIRMED' || l.status === 'TICKET_ISSUED')
      .reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);

    const pipelineValue = leads
      .filter(l => l.status !== 'CANCELLED')
      .reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);

    // Today's leads count
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCount = leads.filter(l => (l.createdAt || '').startsWith(todayStr)).length;

    const conversionRate = totalLeads > 0 ? Math.round((confirmedCount / totalLeads) * 100) : 0;

    return {
      totalLeads,
      todayCount,
      confirmedCount,
      inProgressCount,
      cancelledCount,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      pipelineValue: Math.round(pipelineValue * 100) / 100,
      conversionRate
    };
  }

  static generateCSV() {
    const leads = this.getLeads();
    const headers = [
      'Lead ID',
      'PNR',
      'Date Created',
      'Customer Name',
      'Phone',
      'Email',
      'Source',
      'Status',
      'Route',
      'Departure Date',
      'Return Date',
      'Airline',
      'Flight Number',
      'Cabin',
      'Passengers',
      'Amount (USD)',
      'Payment Status',
      'Assigned Agent',
      'Latest Note'
    ];

    const rows = leads.map(l => {
      const latestNote = l.notes && l.notes.length > 0 ? l.notes[0].text.replace(/"/g, '""') : '';
      return [
        `"${l.leadId || ''}"`,
        `"${l.pnr || ''}"`,
        `"${l.createdAt ? l.createdAt.split('T')[0] : ''}"`,
        `"${(l.customerName || '').replace(/"/g, '""')}"`,
        `"${(l.phone || '').replace(/"/g, '""')}"`,
        `"${(l.email || '').replace(/"/g, '""')}"`,
        `"${l.source || ''}"`,
        `"${l.status || ''}"`,
        `"${l.route || ''}"`,
        `"${l.date || ''}"`,
        `"${l.returnDate || ''}"`,
        `"${(l.carrier || '').replace(/"/g, '""')}"`,
        `"${(l.flightNumber || '').replace(/"/g, '""')}"`,
        `"${l.cabin || 'Economy'}"`,
        `"${l.passengersCount || 1}"`,
        `"${l.amount || 0}"`,
        `"${l.paymentStatus || 'UNPAID'}"`,
        `"${(l.assignedAgent || 'Agent').replace(/"/g, '""')}"`,
        `"${latestNote}"`
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}
