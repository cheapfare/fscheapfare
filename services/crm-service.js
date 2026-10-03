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

// Initial production state: 0 fake leads
const INITIAL_LEADS = [];

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
