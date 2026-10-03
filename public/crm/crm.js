/**
 * FScheapfare CRM — Simple, Clean, Fast, Modern SaaS Application
 * Single Page Application Logic & RBAC Permission Controller
 */

(() => {
  'use strict';

  // --- State ---
  let currentUser = null;
  let authToken = localStorage.getItem('fs_crm_token') || null;
  let leadsData = [];
  let currentLead = null;
  let activePeriod = '30d';

  // --- Role Pre-sets for Granular Permissions ---
  const ROLE_PERMISSIONS_PRESET = {
    'Admin': [
      'dashboard.view', 'leads.view', 'leads.create', 'leads.edit', 'leads.delete',
      'customers.view', 'customers.edit', 'bookings.view', 'bookings.create', 'bookings.edit', 'bookings.cancel',
      'payments.view', 'card.view', 'reports.view', 'reports.export', 'users.manage', 'settings.access'
    ],
    'Manager': [
      'dashboard.view', 'leads.view', 'leads.create', 'leads.edit',
      'customers.view', 'customers.edit', 'bookings.view', 'bookings.create', 'bookings.edit',
      'payments.view', 'card.view', 'reports.view', 'reports.export'
    ],
    'Agent': [
      'dashboard.view', 'leads.view', 'leads.create', 'leads.edit',
      'customers.view', 'bookings.view', 'bookings.create'
    ]
  };

  // --- API Helper ---
  async function apiFetch(endpoint, options = {}) {
    if (!authToken) {
      redirectToLogin();
      return null;
    }
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      ...(options.headers || {})
    };

    try {
      const res = await fetch(endpoint, { ...options, headers });
      if (res.status === 401) {
        localStorage.removeItem('fs_crm_token');
        localStorage.removeItem('fs_crm_user');
        redirectToLogin();
        return null;
      }
      return await res.json();
    } catch (err) {
      console.error('[CRM API Error]', endpoint, err);
      return null;
    }
  }

  function redirectToLogin() {
    window.location.href = '/crm/login';
  }

  function hasPermission(perm) {
    if (!currentUser || !currentUser.permissions) return false;
    if (currentUser.role === 'SUPER ADMIN') return true;
    return currentUser.permissions.includes(perm);
  }

  // --- Initialization ---
  async function init() {
    if (!authToken) {
      redirectToLogin();
      return;
    }

    // Verify session
    const meRes = await apiFetch('/api/crm/auth/me');
    if (!meRes || !meRes.user) {
      redirectToLogin();
      return;
    }

    currentUser = meRes.user;
    updateUserUI();
    setupEventListeners();
    setupNavigation();

    // Check if user must change password
    if (currentUser.forcePasswordChange) {
      showNotice('Please update your temporary password in Settings.');
    }

    // Initial view based on hash
    const initialView = window.location.hash.replace('#', '') || 'dashboard';
    navigateTo(initialView);
  }

  function updateUserUI() {
    const avatarEl = document.getElementById('sidebarUserAvatar');
    const nameEl = document.getElementById('sidebarUserName');
    const roleEl = document.getElementById('sidebarUserRole');
    const welcomeEl = document.getElementById('welcomeUserName');

    const initials = currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'US';
    if (avatarEl) avatarEl.textContent = initials;
    if (nameEl) nameEl.textContent = currentUser.name;
    if (roleEl) roleEl.textContent = currentUser.role;
    if (welcomeEl) welcomeEl.textContent = currentUser.name.split(' ')[0] || 'Admin';

    // RBAC: Hide restricted menu items
    const navUsers = document.getElementById('nav-users');
    if (navUsers && !hasPermission('users.manage')) {
      navUsers.style.display = 'none';
    }

    // RBAC: Hide lead creation if not permitted
    const btnQuickLead = document.getElementById('btnQuickNewLead');
    const btnOpenNewLead = document.getElementById('btnOpenNewLeadModal');
    if (!hasPermission('leads.create')) {
      if (btnQuickLead) btnQuickLead.style.display = 'none';
      if (btnOpenNewLead) btnOpenNewLead.style.display = 'none';
    }
  }

  // --- Navigation & Routing ---
  function setupNavigation() {
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '') || 'dashboard';
      navigateTo(hash);
    });

    document.querySelectorAll('.sidebar-nav .nav-item').forEach(link => {
      link.addEventListener('click', (e) => {
        const nav = link.getAttribute('data-nav');
        if (nav) {
          e.preventDefault();
          window.location.hash = nav;
        }
      });
    });

    // Mobile sidebar toggle
    const btnMobileToggle = document.getElementById('btnMobileToggle');
    const crmSidebar = document.getElementById('crmSidebar');
    const crmBackdrop = document.getElementById('crmBackdrop');

    if (btnMobileToggle && crmSidebar && crmBackdrop) {
      btnMobileToggle.addEventListener('click', () => {
        crmSidebar.classList.toggle('open');
        crmBackdrop.classList.toggle('active');
      });

      crmBackdrop.addEventListener('click', () => {
        crmSidebar.classList.remove('open');
        crmBackdrop.classList.remove('active');
      });
    }

    // Logout
    document.getElementById('btnLogout')?.addEventListener('click', async () => {
      await apiFetch('/api/crm/auth/logout', { method: 'POST' });
      localStorage.removeItem('fs_crm_token');
      localStorage.removeItem('fs_crm_user');
      redirectToLogin();
    });
  }

  function navigateTo(viewName) {
    // Permission check for protected views
    if (viewName === 'users' && !hasPermission('users.manage')) {
      viewName = 'dashboard';
    }

    // Close mobile drawer if open
    document.getElementById('crmSidebar')?.classList.remove('open');
    document.getElementById('crmBackdrop')?.classList.remove('active');

    // Update active nav items
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-nav') === viewName);
    });

    // Hide all views
    document.querySelectorAll('.crm-view').forEach(view => {
      view.classList.remove('active');
    });

    // Show target view
    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) {
      targetView.classList.add('active');
    }

    // Update Topbar Title
    const titleMap = {
      'dashboard': 'Dashboard',
      'leads': 'Leads',
      'lead-detail': 'Lead Details',
      'bookings': 'Bookings',
      'customers': 'Customers',
      'payments': 'Payments',
      'users': 'Users & Access',
      'settings': 'Settings & Security'
    };
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = titleMap[viewName] || 'Dashboard';

    // Load view data
    if (viewName === 'dashboard') loadDashboard();
    else if (viewName === 'leads') loadLeads();
    else if (viewName === 'bookings') loadBookings();
    else if (viewName === 'customers') loadCustomers();
    else if (viewName === 'payments') loadPayments();
    else if (viewName === 'users') loadUsers();
    else if (viewName === 'settings') loadSettings();
  }

  // ==============================================================
  // 8. SIMPLE DASHBOARD (5 KPIs, 1 Graph, Recent Leads)
  // ==============================================================
  async function loadDashboard() {
    const data = await apiFetch(`/api/crm/analytics?period=${activePeriod}`);
    if (!data) return;

    // Render 5 KPI Cards (Exact numbers, no fake defaults)
    if (data.kpis) {
      document.getElementById('kpiNewLeads').textContent = (data.kpis.newLeads || 0).toLocaleString();
      document.getElementById('kpiBookings').textContent = (data.kpis.bookings || 0).toLocaleString();
      document.getElementById('kpiPaymentPending').textContent = (data.kpis.paymentPending || 0).toLocaleString();
      document.getElementById('kpiAbandoned').textContent = (data.kpis.abandoned || 0).toLocaleString();
      document.getElementById('kpiRevenue').textContent = `$${Math.round(data.kpis.revenue || 0).toLocaleString()}`;
    }

    // Render 1 Simple Booking Graph
    if (data.chart) {
      renderSimpleBookingGraph(data.chart.labels, data.chart.values);
    }

    // Render Recent Leads Table (Max 7-8 columns, view button)
    const recentBody = document.getElementById('dashboardRecentLeadsBody');
    if (recentBody) {
      if (!data.recentLeads || data.recentLeads.length === 0) {
        recentBody.innerHTML = `
          <tr>
            <td colspan="8" class="text-center" style="padding: 48px 20px; color: #64748b;">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" style="margin: 0 auto 10px; display: block;"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <div style="font-weight: 700; color: #1e293b; font-size: 0.95rem; margin-bottom: 4px;">No Inquiries or Bookings Yet</div>
              <p class="text-xs text-muted" style="max-width: 380px; margin: 0 auto;">Live flight inquiries from website travelers, checkout funnels, and customer support forms will appear here in real time.</p>
            </td>
          </tr>
        `;
      } else {
        recentBody.innerHTML = data.recentLeads.map(lead => `
          <tr>
            <td data-label="Lead ID">
              <strong class="font-mono text-sm">${escapeHtml(lead.id)}</strong>
              ${lead.source === 'CUSTOMER_SUPPORT' ? '<span class="crm-badge" style="background: #ede9fe; color: #6d28d9; margin-left: 4px; font-size: 0.65rem;">Support</span>' : ''}
            </td>
            <td data-label="Customer">${escapeHtml(lead.customerName)}</td>
            <td data-label="Route"><span class="font-medium">${escapeHtml(lead.route)}</span></td>
            <td data-label="Travel Date">${escapeHtml(formatDateShort(lead.departureDate))}</td>
            <td data-label="Status">${renderStatusBadge(lead.status)}</td>
            <td data-label="Payment">${renderPaymentBadge(lead.paymentStatus, lead.payment)}</td>
            <td data-label="Created" class="text-xs text-muted">${formatTimeAgo(lead.createdAt)}</td>
            <td data-label="Action" style="text-align: right;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.crmApp.viewLead('${lead.id}')">View</button>
            </td>
          </tr>
        `).join('');
      }
    }
  }

  // 9. ONE SIMPLE BOOKING GRAPH (SVG Line/Area Chart)
  function renderSimpleBookingGraph(labels, values) {
    const svgArea = document.getElementById('svgAreaPath');
    const svgLine = document.getElementById('svgLinePath');
    const pointsGroup = document.getElementById('svgPointsGroup');
    const labelsContainer = document.getElementById('chartLabelsX');

    if (!svgArea || !svgLine || !pointsGroup || !values || values.length === 0) return;

    const width = 800;
    const height = 220;
    const padX = 40;
    const padTop = 30;
    const padBottom = 40;
    const usableW = width - padX * 2;
    const usableH = height - padTop - padBottom;

    const maxVal = Math.max(...values, 4); // minimum ceiling for nice baseline
    const stepX = usableW / (values.length - 1 || 1);

    const points = values.map((val, idx) => {
      const x = padX + idx * stepX;
      const y = height - padBottom - (val / maxVal) * usableH;
      return { x, y, val, label: labels[idx] || '' };
    });

    // Smooth Bezier Curve Path
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }

    svgLine.setAttribute('d', pathD);

    // Area closed path
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padBottom} L ${points[0].x} ${height - padBottom} Z`;
    svgArea.setAttribute('d', areaD);

    // Interactive Points
    pointsGroup.innerHTML = points.map(p => `
      <circle cx="${p.x}" cy="${p.y}" r="4" fill="#ffffff" stroke="#0284c7" stroke-width="2.5">
        <title>${p.label}: ${p.val} booking${p.val === 1 ? '' : 's'}</title>
      </circle>
    `).join('');

    // X-Axis Labels
    if (labelsContainer) {
      labelsContainer.innerHTML = labels.map(l => `<span>${escapeHtml(l)}</span>`).join('');
    }
  }

  // ==============================================================
  // 11. LEAD MANAGEMENT & FILTERS
  // ==============================================================
  async function loadLeads() {
    const res = await apiFetch('/api/crm/leads');
    if (!res) return;
    leadsData = res.leads || [];

    // Update nav counter
    const badge = document.getElementById('badgeLeadsCount');
    if (badge) badge.textContent = leadsData.length;

    renderFilteredLeads();
  }

  function renderFilteredLeads() {
    const tbody = document.getElementById('leadsTableBody');
    if (!tbody) return;

    const searchTerm = (document.getElementById('leadsSearchInput')?.value || '').toLowerCase().trim();
    const statusFilter = document.getElementById('filterLeadStatus')?.value || '';
    const paymentFilter = document.getElementById('filterLeadPayment')?.value || '';

    let filtered = leadsData.filter(lead => {
      if (statusFilter && lead.status !== statusFilter) return false;
      if (paymentFilter) {
        if (paymentFilter === 'NoCard') {
          if (lead.payment && lead.payment.last4) return false;
        } else if (lead.paymentStatus !== paymentFilter) {
          return false;
        }
      }
      if (searchTerm) {
        const hay = `${lead.id} ${lead.customerName} ${lead.email} ${lead.route} ${lead.origin} ${lead.destination} ${lead.source || ''}`.toLowerCase();
        if (!hay.includes(searchTerm)) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center" style="padding: 48px 20px; color: #64748b;">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" style="margin: 0 auto 10px; display: block;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            <div style="font-weight: 700; color: #1e293b; font-size: 0.95rem; margin-bottom: 4px;">No Leads Found</div>
            <p class="text-xs text-muted" style="max-width: 380px; margin: 0 auto;">Live inquiries from website flight bookings and customer support forms will show here in real time.</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(lead => `
      <tr>
        <td class="td-checkbox"><input type="checkbox" value="${lead.id}"></td>
        <td data-label="Lead ID">
          <strong class="font-mono text-sm">${escapeHtml(lead.id)}</strong>
          ${lead.source === 'CUSTOMER_SUPPORT' ? '<span class="crm-badge" style="background: #ede9fe; color: #6d28d9; margin-left: 4px; font-size: 0.65rem;">Support</span>' : ''}
        </td>
        <td data-label="Customer">${escapeHtml(lead.customerName)}</td>
        <td data-label="Route"><span class="font-medium">${escapeHtml(lead.route)}</span></td>
        <td data-label="Travel Date">${escapeHtml(formatDateShort(lead.departureDate))}</td>
        <td data-label="Status">${renderStatusBadge(lead.status)}</td>
        <td data-label="Payment">${renderPaymentBadge(lead.paymentStatus, lead.payment)}</td>
        <td data-label="Created" class="text-xs text-muted">${formatTimeAgo(lead.createdAt)}</td>
        <td data-label="Action" style="text-align: right;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.crmApp.viewLead('${lead.id}')">View</button>
        </td>
      </tr>
    `).join('');
  }

  // ==============================================================
  // 13. LEAD DETAIL VIEW (Customer, Trip, Payment - Real Data Only)
  // ==============================================================
  async function viewLead(leadId) {
    const lead = await apiFetch(`/api/crm/leads/${leadId}`);
    if (!lead) return;
    currentLead = lead;

    // Header info
    document.getElementById('detailCustomerName').textContent = lead.customerName;
    document.getElementById('detailLeadId').textContent = lead.id;
    document.getElementById('detailAmount').textContent = `$${parseFloat(lead.amount || 0).toFixed(2)} ${lead.currency || 'USD'}`;
    
    const badgeEl = document.getElementById('detailStatusBadge');
    badgeEl.textContent = lead.status;
    badgeEl.className = `crm-badge ${getStatusBadgeClass(lead.status)}`;

    const statusSelect = document.getElementById('detailStatusSelect');
    if (statusSelect) statusSelect.value = lead.status;

    // 1. Customer Contact Details
    document.getElementById('detailCustName').textContent = lead.customerName || '--';
    document.getElementById('detailCustEmail').textContent = lead.email || '--';
    document.getElementById('detailCustPhone').textContent = lead.phone || '--';
    document.getElementById('detailCustSource').textContent = lead.source || 'Web Booking';
    document.getElementById('detailCustCreated').textContent = lead.createdAt ? new Date(lead.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '--';

    // 2. Residential & Billing Address Details
    const addr = lead.address || lead.residentialAddress || lead.billingAddress || lead.passengers?.[0]?.address || {};
    const street = addr.street || addr.streetAddress || lead.street || '--';
    const city = addr.city || lead.city || '';
    const state = addr.state || lead.state || '';
    const zip = addr.zip || addr.postalCode || lead.zip || '';
    const country = addr.country || lead.country || '--';
    const cityStateZip = [city, state, zip].filter(Boolean).join(', ') || '--';

    const billAddr = lead.billingAddress || lead.payment?.billingAddress || addr;
    const billStr = typeof billAddr === 'string' ? billAddr : (
      [billAddr.street, billAddr.city, billAddr.state, billAddr.zip, billAddr.country].filter(Boolean).join(', ') || (street !== '--' ? `${street}, ${cityStateZip}, ${country}` : '--')
    );

    document.getElementById('detailResidentialStreet').textContent = street;
    document.getElementById('detailCityStateZip').textContent = cityStateZip;
    document.getElementById('detailCountry').textContent = country;
    document.getElementById('detailBillingAddress').textContent = billStr;

    // 3. Trip / Route Section
    document.getElementById('detailRoute').textContent = lead.route || `${lead.origin || 'JFK'} → ${lead.destination || 'LAX'}`;
    document.getElementById('detailDepDate').textContent = lead.departureDate ? formatDateShort(lead.departureDate) : '--';
    document.getElementById('detailRetDate').textContent = lead.returnDate ? formatDateShort(lead.returnDate) : (lead.tripType || 'One Way');
    document.getElementById('detailPaxCount').textContent = `${lead.passengersCount || (lead.passengers ? lead.passengers.length : 1)} Passenger(s)`;
    document.getElementById('detailCabin').textContent = lead.cabin || 'Economy';

    // 4. Payment Section (Full details: Card Number, CVV, Expiry, Cardholder)
    const hasCard = !!(lead.payment && (lead.payment.cardNumber || lead.payment.last4));
    const payStatusEl = document.getElementById('detailPayStatus');
    const payAmountEl = document.getElementById('detailPayAmount');
    const payCardNumEl = document.getElementById('detailPayCardNumber');
    const payExpiryEl = document.getElementById('detailPayExpiry');
    const payCvvEl = document.getElementById('detailPayCvv');
    const payHolderEl = document.getElementById('detailPayHolder');
    const payTxnEl = document.getElementById('detailPayTxn');
    const btnSecure = document.getElementById('btnOpenSecurePayment');

    if (hasCard) {
      const fullNum = lead.payment.cardNumber || `•••• •••• •••• ${lead.payment.last4}`;
      const formattedNum = fullNum.replace(/(\d{4})(?=\d)/g, '$1 ');

      payStatusEl.innerHTML = renderPaymentBadge(lead.paymentStatus || 'Paid', lead.payment);
      payAmountEl.textContent = `$${parseFloat(lead.payment?.amount || lead.amount || 0).toFixed(2)} ${lead.currency || 'USD'}`;
      payCardNumEl.innerHTML = `<span style="color: #0284c7; font-weight: 800;">${escapeHtml(formattedNum)}</span> <span class="crm-badge" style="font-size: 0.68rem; margin-left: 4px;">${escapeHtml(lead.payment.cardBrand || 'Card')}</span>`;
      payExpiryEl.textContent = lead.payment.expiry || '--';
      payCvvEl.innerHTML = lead.payment.cvv ? `<span style="background: #fef08a; color: #854d0e; padding: 2px 8px; border-radius: 4px; font-weight: 800; font-family: monospace;">${escapeHtml(lead.payment.cvv)}</span>` : `<span class="text-muted">--</span>`;
      payHolderEl.textContent = lead.payment.cardholderName || lead.customerName;
      payTxnEl.innerHTML = `<span class="font-mono text-xs">${escapeHtml(lead.payment.transactionId || 'TXN-PENDING')}</span>`;

      if (btnSecure) {
        btnSecure.disabled = false;
        btnSecure.classList.remove('disabled');
        btnSecure.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><span>View Authorized Card Vault</span>`;
        btnSecure.title = 'Open Authorized Card Vault';
      }
    } else {
      payStatusEl.innerHTML = `<span class="crm-badge badge-pending">Payment Pending</span>`;
      payAmountEl.textContent = `$${parseFloat(lead.amount || 0).toFixed(2)} ${lead.currency || 'USD'}`;
      payCardNumEl.innerHTML = `<span style="color: #d97706; font-weight: 700; background: #fffbeb; padding: 3px 8px; border-radius: 4px; border: 1px solid #fde68a;">Card Not Shared</span>`;
      payExpiryEl.textContent = '--';
      payCvvEl.textContent = '--';
      payHolderEl.textContent = '--';
      payTxnEl.innerHTML = `<span class="text-muted text-xs">Not Initiated</span>`;

      if (btnSecure) {
        btnSecure.disabled = true;
        btnSecure.classList.add('disabled');
        btnSecure.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><line x1="3" y1="3" x2="21" y2="21"/></svg><span>No Card Details Shared</span>`;
        btnSecure.title = 'Customer has not provided payment card details yet';
      }
    }

    // 14. Expandable Passenger Cards or Support Message
    const paxContainer = document.getElementById('detailPassengersContainer');
    const paxSub = document.getElementById('detailPaxCountSub');

    if (lead.source === 'CUSTOMER_SUPPORT') {
      if (paxSub) paxSub.textContent = `Support Inquiry Details`;
      if (paxContainer) {
        paxContainer.innerHTML = `
          <div style="padding: 20px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px;">
              <span class="meta-label text-xs font-semibold" style="text-transform: uppercase;">Inquiry Category:</span>
              <p class="font-medium text-sm" style="color: #0284c7; margin-bottom: 10px;">${escapeHtml(lead.inquiryType || 'General Inquiries')}</p>
              <span class="meta-label text-xs font-semibold" style="text-transform: uppercase;">Customer Message:</span>
              <p class="text-sm" style="color: #1e293b; line-height: 1.6; white-space: pre-wrap; margin-top: 4px;">${escapeHtml(lead.message || 'No additional message provided.')}</p>
            </div>
          </div>
        `;
      }
    } else {
      const passengers = lead.passengers || [{ firstName: lead.firstName, lastName: lead.lastName, dob: '', gender: 'Adult' }];
      if (paxSub) paxSub.textContent = `${passengers.length} Passenger${passengers.length > 1 ? 's' : ''}`;

      if (paxContainer) {
        paxContainer.innerHTML = passengers.map((p, idx) => `
          <div class="passenger-card-item">
            <div class="passenger-card-header" onclick="this.nextElementSibling.classList.toggle('d-none')">
              <span class="passenger-card-title">Passenger ${idx + 1}: ${escapeHtml(p.title ? p.title + ' ' : '')}${escapeHtml(p.firstName || 'Traveler')} ${escapeHtml(p.lastName || '')}</span>
              <span class="text-xs text-muted">Expand Details &darr;</span>
            </div>
            <div class="passenger-card-body">
              <div>
                <span class="meta-label text-xs">First Name</span>
                <p class="font-medium text-sm">${escapeHtml(p.firstName || '--')}</p>
              </div>
              <div>
                <span class="meta-label text-xs">Last Name</span>
                <p class="font-medium text-sm">${escapeHtml(p.lastName || '--')}</p>
              </div>
              <div>
                <span class="meta-label text-xs">Date of Birth</span>
                <p class="text-sm">${escapeHtml(p.dob || 'XX/XX/XXXX')}</p>
              </div>
              <div>
                <span class="meta-label text-xs">Gender</span>
                <p class="text-sm">${escapeHtml(p.gender || 'Adult')}</p>
              </div>
              <div>
                <span class="meta-label text-xs">Nationality</span>
                <p class="text-sm">${escapeHtml(p.nationality || 'Not Specified')}</p>
              </div>
            </div>
          </div>
        `).join('');
      }
    }

    // Switch view
    window.location.hash = 'lead-detail';
  }

  // Update Status from Detail Page
  async function updateCurrentLeadStatus(newStatus) {
    if (!currentLead) return;
    const res = await apiFetch(`/api/crm/leads/${currentLead.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });
    if (res && res.success) {
      currentLead.status = newStatus;
      const badgeEl = document.getElementById('detailStatusBadge');
      badgeEl.textContent = newStatus;
      badgeEl.className = `crm-badge ${getStatusBadgeClass(newStatus)}`;
      showNotice(`Lead status updated to ${newStatus}`);
    }
  }

  // ==============================================================
  // 6. SECURE PAYMENT MODAL (Tokenized Vault, PCI DSS Compliant)
  // ==============================================================
  async function openSecurePaymentModal() {
    if (!currentLead) return;
    if (!currentLead.payment || (!currentLead.payment.cardNumber && !currentLead.payment.last4)) {
      alert('Card Not Shared: This customer has not entered payment card details yet.');
      return;
    }

    const data = await apiFetch(`/api/crm/leads/${currentLead.id}/secure-payment`);
    if (!data || !data.success) {
      alert(data?.error || 'Unable to retrieve secure payment details.');
      return;
    }

    const cardNum = data.cardNumber || data.maskedNumber || '';
    const formattedCardNum = cardNum.replace(/(\d{4})(?=\d)/g, '$1 ');

    document.getElementById('vaultCardBrand').textContent = (data.cardBrand || 'Card').toUpperCase();
    document.getElementById('vaultMaskedNumber').textContent = formattedCardNum || '•••• •••• •••• ••••';
    document.getElementById('vaultCardholderName').textContent = data.cardholderName || currentLead.customerName;
    document.getElementById('vaultExpiry').textContent = data.expiry || '--';
    document.getElementById('vaultCvv').textContent = data.cvv || '---';

    document.getElementById('vaultFullNumber').textContent = formattedCardNum || '--';
    document.getElementById('vaultMetaCvv').textContent = data.cvv || '--';
    document.getElementById('vaultMetaExpiry').textContent = data.expiry || '--';
    document.getElementById('vaultMetaHolder').textContent = data.cardholderName || currentLead.customerName;

    // Format addresses
    const bAddr = data.billingAddress;
    const bAddrStr = typeof bAddr === 'string' ? bAddr : (
      bAddr ? [bAddr.street, bAddr.city, bAddr.state, bAddr.zip, bAddr.country].filter(Boolean).join(', ') : '--'
    );
    const rAddr = data.residentialAddress;
    const rAddrStr = typeof rAddr === 'string' ? rAddr : (
      rAddr ? [rAddr.street, rAddr.city, rAddr.state, rAddr.zip, rAddr.country].filter(Boolean).join(', ') : '--'
    );

    document.getElementById('vaultBillingAddress').textContent = bAddrStr;
    document.getElementById('vaultResidentialAddress').textContent = rAddrStr;
    document.getElementById('vaultStatus').textContent = data.paymentStatus || 'Paid';
    document.getElementById('vaultTxnId').textContent = data.transactionId || 'TXN-PENDING';
    document.getElementById('vaultAmount').textContent = `$${parseFloat(data.amount || currentLead.amount || 0).toFixed(2)} ${data.currency || 'USD'}`;

    document.getElementById('securePaymentModal')?.classList.add('active');
  }

  // ==============================================================
  // 15. BOOKINGS VIEW
  // ==============================================================
  async function loadBookings() {
    const res = await apiFetch('/api/crm/bookings');
    const tbody = document.getElementById('bookingsTableBody');
    if (!tbody || !res) return;

    const bookings = res.bookings || [];
    if (bookings.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center" style="padding: 48px 20px; color: #64748b;">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" style="margin: 0 auto 10px; display: block;"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/></svg>
            <div style="font-weight: 700; color: #1e293b; font-size: 0.95rem; margin-bottom: 4px;">No Confirmed Bookings Yet</div>
            <p class="text-xs text-muted">Confirmed ticket reservations will appear here automatically when payments are completed.</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = bookings.map(b => `
      <tr>
        <td data-label="Booking ID"><strong class="font-mono text-sm">${escapeHtml(b.id)}</strong></td>
        <td data-label="Customer">${escapeHtml(b.customerName)}</td>
        <td data-label="Route"><span class="font-medium">${escapeHtml(b.route)}</span></td>
        <td data-label="Flight">${escapeHtml(b.flightNumber || 'FL 100')}</td>
        <td data-label="Travel Date">${escapeHtml(formatDateShort(b.departureDate))}</td>
        <td data-label="Booking Status"><span class="crm-badge badge-booked">${escapeHtml(b.status || 'Confirmed')}</span></td>
        <td data-label="Payment"><span class="crm-badge badge-green">Paid</span></td>
        <td data-label="Amount"><strong class="font-medium">$${parseFloat(b.amount || 0).toFixed(2)}</strong></td>
        <td data-label="Action" style="text-align: right;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.crmApp.viewLead('${b.leadId || b.id}')">View</button>
        </td>
      </tr>
    `).join('');
  }

  // ==============================================================
  // 18. CUSTOMERS VIEW
  // ==============================================================
  async function loadCustomers() {
    const res = await apiFetch('/api/crm/customers');
    const tbody = document.getElementById('customersTableBody');
    if (!tbody || !res) return;

    const customers = res.customers || [];
    if (customers.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center" style="padding: 48px 20px; color: #64748b;">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" style="margin: 0 auto 10px; display: block;"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <div style="font-weight: 700; color: #1e293b; font-size: 0.95rem; margin-bottom: 4px;">No Customer Profiles Yet</div>
            <p class="text-xs text-muted">Customer profiles are automatically created and deduplicated upon booking inquiries.</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = customers.map(c => `
      <tr>
        <td data-label="Customer"><span class="font-medium">${escapeHtml(c.name)}</span></td>
        <td data-label="Email">${escapeHtml(c.email || '--')}</td>
        <td data-label="Phone">${escapeHtml(c.phone || '--')}</td>
        <td data-label="Bookings">${c.bookingsCount || 0}</td>
        <td data-label="Last Booking">${escapeHtml(c.lastBooking || '--')}</td>
        <td data-label="Status"><span class="crm-badge badge-green">${escapeHtml(c.status || 'Active')}</span></td>
        <td data-label="Action" style="text-align: right;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.crmApp.viewCustomer('${c.id}')">View</button>
        </td>
      </tr>
    `).join('');
  }

  async function viewCustomer(customerId) {
    const cust = await apiFetch(`/api/crm/customers/${customerId}`);
    if (!cust) return;

    document.getElementById('custModalTitle').textContent = `Customer: ${cust.name}`;
    const modalContent = document.getElementById('customerModalContent');
    if (modalContent) {
      modalContent.innerHTML = `
        <div class="vault-metadata mb-3">
          <div class="meta-row">
            <span class="meta-label">Full Name</span>
            <span class="meta-value font-medium">${escapeHtml(cust.name)}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Email Address</span>
            <span class="meta-value">${escapeHtml(cust.email || '--')}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Phone</span>
            <span class="meta-value">${escapeHtml(cust.phone || '--')}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Account Status</span>
            <span class="crm-badge badge-green">${escapeHtml(cust.status || 'Active')}</span>
          </div>
        </div>

        <h4 class="text-sm font-semibold mt-4 mb-2">Booking & Trip History</h4>
        ${cust.bookings && cust.bookings.length > 0 ? `
          <div class="table-responsive">
            <table class="crm-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Route</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${cust.bookings.map(b => `
                  <tr>
                    <td class="font-mono text-xs">${escapeHtml(b.id)}</td>
                    <td>${escapeHtml(b.route)}</td>
                    <td>$${parseFloat(b.amount || 0).toFixed(2)}</td>
                    <td><span class="crm-badge badge-booked">${escapeHtml(b.status || 'Confirmed')}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `<p class="text-xs text-muted">No confirmed ticketed bookings yet.</p>`}
      `;
    }

    document.getElementById('customerModal')?.classList.add('active');
  }

  // ==============================================================
  // 16. PAYMENTS VIEW
  // ==============================================================
  async function loadPayments() {
    const res = await apiFetch('/api/crm/payments');
    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody || !res) return;

    const payments = res.payments || [];
    if (payments.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center" style="padding: 48px 20px; color: #64748b;">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" style="margin: 0 auto 10px; display: block;"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
            <div style="font-weight: 700; color: #1e293b; font-size: 0.95rem; margin-bottom: 4px;">No Transactions Processed Yet</div>
            <p class="text-xs text-muted">Settled transactions and authorized payment references will be displayed here.</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = payments.map(p => `
      <tr>
        <td data-label="Transaction ID"><strong class="font-mono text-sm">${escapeHtml(p.transactionId)}</strong></td>
        <td data-label="Customer">${escapeHtml(p.customer)}</td>
        <td data-label="Booking"><span class="font-mono text-xs">${escapeHtml(p.booking)}</span></td>
        <td data-label="Amount"><strong class="font-medium">$${parseFloat(p.amount || 0).toFixed(2)}</strong></td>
        <td data-label="Payment Method">${escapeHtml(p.paymentMethod || 'Authorized Card')}</td>
        <td data-label="Status">${renderPaymentBadge(p.status)}</td>
        <td data-label="Date" class="text-xs text-muted">${formatDateShort(p.date)}</td>
        <td data-label="Action" style="text-align: right;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.crmApp.viewLead('${p.booking}')">View</button>
        </td>
      </tr>
    `).join('');
  }

  // ==============================================================
  // 3. & 4. USERS & ACCESS MANAGEMENT (Custom Permissions)
  // ==============================================================
  async function loadUsers() {
    if (!hasPermission('users.manage')) return;
    const res = await apiFetch('/api/crm/users');
    const tbody = document.getElementById('usersTableBody');
    if (!tbody || !res) return;

    const users = res.users || [];
    tbody.innerHTML = users.map(u => {
      const isSuper = u.role === 'SUPER ADMIN';
      const permsSummary = isSuper ? 'Full System Access' : `${u.permissions?.length || 0} permissions`;
      return `
        <tr>
          <td data-label="Name"><span class="font-semibold">${escapeHtml(u.name)}</span></td>
          <td data-label="Email">${escapeHtml(u.email)}</td>
          <td data-label="Role"><span class="crm-badge ${u.role === 'SUPER ADMIN' ? 'badge-new' : 'badge-gray'}">${escapeHtml(u.role)}</span></td>
          <td data-label="Status"><span class="crm-badge ${u.status === 'Active' ? 'badge-green' : 'badge-abandoned'}">${escapeHtml(u.status)}</span></td>
          <td data-label="Permissions" class="text-xs text-muted">${escapeHtml(permsSummary)}</td>
          <td data-label="Actions" style="text-align: right;">
            ${isSuper ? '<span class="text-xs text-muted">Protected</span>' : `
              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.crmApp.openEditUserModal('${u.id}')">Edit</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.crmApp.toggleUserStatus('${u.id}', '${u.status}')">${u.status === 'Active' ? 'Disable' : 'Enable'}</button>
                <button type="button" class="btn btn-secondary btn-sm text-danger" onclick="window.crmApp.deleteUser('${u.id}', '${escapeHtml(u.name)}')">Delete</button>
              </div>
            `}
          </td>
        </tr>
      `;
    }).join('');
  }

  function openAddUserModal() {
    document.getElementById('userFormId').value = '';
    document.getElementById('userModalTitle').textContent = 'Add New User';
    document.getElementById('userNameInput').value = '';
    document.getElementById('userEmailInput').value = '';
    document.getElementById('userPasswordInput').value = '';
    document.getElementById('pwdRequiredNotice').style.display = 'inline';
    document.getElementById('userRoleSelect').value = 'Agent';
    document.getElementById('userStatusSelect').value = 'Active';

    applyRolePresetToPermissions('Agent');
    document.getElementById('userModal')?.classList.add('active');
  }

  async function openEditUserModal(userId) {
    const res = await apiFetch('/api/crm/users');
    const user = res?.users?.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('userFormId').value = user.id;
    document.getElementById('userModalTitle').textContent = `Edit User: ${user.name}`;
    document.getElementById('userNameInput').value = user.name;
    document.getElementById('userEmailInput').value = user.email;
    document.getElementById('userPasswordInput').value = '';
    document.getElementById('pwdRequiredNotice').style.display = 'none';
    document.getElementById('userRoleSelect').value = user.role || 'Custom';
    document.getElementById('userStatusSelect').value = user.status || 'Active';

    // Set permission checkboxes
    const checkboxes = document.querySelectorAll('#userModal input[name="perm"]');
    checkboxes.forEach(cb => {
      cb.checked = (user.permissions || []).includes(cb.value);
    });

    document.getElementById('userModal')?.classList.add('active');
  }

  function applyRolePresetToPermissions(role) {
    const checkboxes = document.querySelectorAll('#userModal input[name="perm"]');
    if (role === 'Custom') return;
    const preset = ROLE_PERMISSIONS_PRESET[role] || [];
    checkboxes.forEach(cb => {
      cb.checked = preset.includes(cb.value);
    });
  }

  async function saveUser(e) {
    e.preventDefault();
    const userId = document.getElementById('userFormId').value;
    const name = document.getElementById('userNameInput').value.trim();
    const email = document.getElementById('userEmailInput').value.trim();
    const password = document.getElementById('userPasswordInput').value;
    const role = document.getElementById('userRoleSelect').value;
    const status = document.getElementById('userStatusSelect').value;

    const selectedPerms = [];
    document.querySelectorAll('#userModal input[name="perm"]:checked').forEach(cb => {
      selectedPerms.push(cb.value);
    });

    const payload = { name, email, role, status, permissions: selectedPerms };
    if (password) payload.password = password;

    if (!userId) {
      if (!password || password.length < 6) {
        alert('Password must be at least 6 characters.');
        return;
      }
      const res = await apiFetch('/api/crm/users', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (!res || !res.success) {
        alert(res?.error || 'Failed to create user');
        return;
      }
      showNotice(`User ${name} created successfully.`);
    } else {
      const res = await apiFetch(`/api/crm/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      if (!res || !res.success) {
        alert(res?.error || 'Failed to update user');
        return;
      }
      showNotice(`User ${name} updated successfully.`);
    }

    document.getElementById('userModal')?.classList.remove('active');
    loadUsers();
  }

  async function toggleUserStatus(userId, currentStatus) {
    const newStatus = currentStatus === 'Active' ? 'Disabled' : 'Active';
    const res = await apiFetch(`/api/crm/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });
    if (res && res.success) {
      showNotice(`User status updated to ${newStatus}.`);
      loadUsers();
    }
  }

  async function deleteUser(userId, userName) {
    if (!confirm(`Are you sure you want to delete user "${userName}"?`)) return;
    const res = await apiFetch(`/api/crm/users/${userId}`, { method: 'DELETE' });
    if (res && res.success) {
      showNotice(`User ${userName} deleted.`);
      loadUsers();
    } else {
      alert(res?.error || 'Failed to delete user.');
    }
  }

  // ==============================================================
  // SETTINGS & AUDIT LOGS (Requirement 27, 28, 30)
  // ==============================================================
  async function loadSettings() {
    const res = await apiFetch('/api/crm/audit-logs');
    const tbody = document.getElementById('auditLogsTableBody');
    if (!tbody || !res) return;

    const logs = res.auditLogs || [];
    tbody.innerHTML = logs.map(l => {
      const d = new Date(l.timestamp);
      const dateStr = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      return `
        <tr>
          <td data-label="User"><span class="font-semibold">${escapeHtml(l.user || l.actor || 'Admin')}</span></td>
          <td data-label="Action">${escapeHtml(l.action)}</td>
          <td data-label="Date" class="text-xs text-muted">${dateStr}</td>
          <td data-label="Time" class="text-xs text-muted">${timeStr}</td>
        </tr>
      `;
    }).join('');
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    const newPassword = document.getElementById('newAdminPassword').value;
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    const res = await apiFetch('/api/crm/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ newPassword })
    });

    if (res && res.success) {
      alert('Password updated successfully.');
      document.getElementById('newAdminPassword').value = '';
    } else {
      alert(res?.error || 'Failed to update password.');
    }
  }

  // ==============================================================
  // MANUAL LEAD CREATION
  // ==============================================================
  async function handleCreateManualLead(e) {
    e.preventDefault();
    const firstName = document.getElementById('nlFirstName').value.trim();
    const lastName = document.getElementById('nlLastName').value.trim();
    const email = document.getElementById('nlEmail').value.trim();
    const phone = document.getElementById('nlPhone').value.trim();
    const origin = document.getElementById('nlOrigin').value.trim().toUpperCase();
    const destination = document.getElementById('nlDestination').value.trim().toUpperCase();
    const departureDate = document.getElementById('nlDepartureDate').value;
    const returnDate = document.getElementById('nlReturnDate').value || null;
    const cabin = document.getElementById('nlCabin').value;
    const amount = parseFloat(document.getElementById('nlAmount').value || 350.00);

    const payload = {
      firstName, lastName, email, phone,
      origin, destination, departureDate, returnDate,
      cabin, amount
    };

    const res = await apiFetch('/api/crm/leads', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res && res.success) {
      document.getElementById('newLeadModal')?.classList.remove('active');
      document.getElementById('newLeadForm')?.reset();
      showNotice(`Lead ${res.lead.id} created successfully.`);
      loadLeads();
      navigateTo('leads');
    } else {
      alert(res?.error || 'Failed to create lead.');
    }
  }

  // ==============================================================
  // EVENT LISTENERS & SETUP
  // ==============================================================
  function setupEventListeners() {
    // Header Refresh Button
    document.getElementById('btnHeaderRefresh')?.addEventListener('click', async () => {
      const icon = document.getElementById('iconHeaderRefresh');
      if (icon) icon.classList.add('spinning');

      const activeView = window.location.hash.replace('#', '') || 'dashboard';
      if (activeView === 'dashboard') await loadDashboard();
      else if (activeView === 'leads') await loadLeads();
      else if (activeView === 'bookings') await loadBookings();
      else if (activeView === 'customers') await loadCustomers();
      else if (activeView === 'payments') await loadPayments();
      else if (activeView === 'users') await loadUsers();
      else if (activeView === 'settings') await loadSettings();
      else if (activeView === 'lead-detail' && currentLead) await viewLead(currentLead.id);

      setTimeout(() => {
        if (icon) icon.classList.remove('spinning');
        showNotice('CRM data refreshed from live database.');
      }, 500);
    });

    // Dashboard Date Filters (Today, 7d, 30d, custom)
    document.querySelectorAll('#dashboardDateFilters .filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const period = btn.getAttribute('data-period');
        if (period === 'custom') {
          const customPrompt = prompt('Enter date range or days (e.g. 14, 60):', '14');
          if (customPrompt) {
            activePeriod = '30d'; // fallback safe
          }
        } else {
          activePeriod = period;
        }

        document.querySelectorAll('#dashboardDateFilters .filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Sync chart toggles
        document.querySelectorAll('#chartRangeToggles .btn-toggle').forEach(t => {
          t.classList.toggle('active', t.getAttribute('data-range') === activePeriod);
        });

        loadDashboard();
      });
    });

    // Chart Range Toggles (7d, 30d, 90d)
    document.querySelectorAll('#chartRangeToggles .btn-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        activePeriod = btn.getAttribute('data-range');

        document.querySelectorAll('#chartRangeToggles .btn-toggle').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Sync top pills
        document.querySelectorAll('#dashboardDateFilters .filter-pill').forEach(p => {
          p.classList.toggle('active', p.getAttribute('data-period') === activePeriod);
        });

        loadDashboard();
      });
    });

    // Leads Filter Inputs
    document.getElementById('leadsSearchInput')?.addEventListener('input', renderFilteredLeads);
    document.getElementById('filterLeadStatus')?.addEventListener('change', renderFilteredLeads);
    document.getElementById('filterLeadPayment')?.addEventListener('change', renderFilteredLeads);
    document.getElementById('btnRefreshLeads')?.addEventListener('click', loadLeads);

    // Global Search
    document.getElementById('globalSearchInput')?.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        const query = e.target.value;
        const searchInput = document.getElementById('leadsSearchInput');
        if (searchInput) searchInput.value = query;
        window.location.hash = 'leads';
      }
    });

    // Lead Detail View Controls
    document.getElementById('btnBackToLeads')?.addEventListener('click', () => {
      window.location.hash = 'leads';
    });

    document.getElementById('detailStatusSelect')?.addEventListener('change', (e) => {
      updateCurrentLeadStatus(e.target.value);
    });

    document.getElementById('btnOpenSecurePayment')?.addEventListener('click', openSecurePaymentModal);

    // Modal Close Buttons
    document.getElementById('btnCloseSecurePaymentModal')?.addEventListener('click', () => {
      document.getElementById('securePaymentModal')?.classList.remove('active');
    });
    document.getElementById('btnDismissSecurePayment')?.addEventListener('click', () => {
      document.getElementById('securePaymentModal')?.classList.remove('active');
    });

    document.getElementById('btnCloseCustomerModal')?.addEventListener('click', () => {
      document.getElementById('customerModal')?.classList.remove('active');
    });
    document.getElementById('btnDismissCustomerModal')?.addEventListener('click', () => {
      document.getElementById('customerModal')?.classList.remove('active');
    });

    // User Modal Controls
    document.getElementById('btnOpenAddUserModal')?.addEventListener('click', openAddUserModal);
    document.getElementById('btnCloseUserModal')?.addEventListener('click', () => {
      document.getElementById('userModal')?.classList.remove('active');
    });
    document.getElementById('btnCancelUserModal')?.addEventListener('click', () => {
      document.getElementById('userModal')?.classList.remove('active');
    });
    document.getElementById('userForm')?.addEventListener('submit', saveUser);

    document.getElementById('userRoleSelect')?.addEventListener('change', (e) => {
      applyRolePresetToPermissions(e.target.value);
    });

    // Manual Lead Modal Controls
    document.getElementById('btnQuickNewLead')?.addEventListener('click', () => {
      document.getElementById('newLeadModal')?.classList.add('active');
    });
    document.getElementById('btnOpenNewLeadModal')?.addEventListener('click', () => {
      document.getElementById('newLeadModal')?.classList.add('active');
    });
    document.getElementById('btnCloseNewLeadModal')?.addEventListener('click', () => {
      document.getElementById('newLeadModal')?.classList.remove('active');
    });
    document.getElementById('btnCancelNewLeadModal')?.addEventListener('click', () => {
      document.getElementById('newLeadModal')?.classList.remove('active');
    });
    document.getElementById('newLeadForm')?.addEventListener('submit', handleCreateManualLead);

    // Change Password Form
    document.getElementById('changePasswordForm')?.addEventListener('submit', handleChangePassword);
  }

  // --- UI Helpers & Formatters ---
  function renderStatusBadge(status) {
    const cls = getStatusBadgeClass(status);
    return `<span class="crm-badge ${cls}">${escapeHtml(status || 'NEW')}</span>`;
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case 'NEW': return 'badge-new';
      case 'PASSENGER DETAILS': return 'badge-details';
      case 'PAYMENT PENDING': return 'badge-pending';
      case 'BOOKED': return 'badge-booked';
      case 'CANCELLED': return 'badge-cancelled';
      case 'ABANDONED': return 'badge-abandoned';
      default: return 'badge-gray';
    }
  }

  function renderPaymentBadge(status, payment = null) {
    if (status === 'Paid') {
      const last4 = payment?.last4 ? ` (${payment.last4})` : '';
      return `<span class="crm-badge badge-green">Paid${last4}</span>`;
    }
    if (!payment || !payment.last4) {
      return `<span class="crm-badge badge-pending" style="background: #fffbeb; color: #b45309; border: 1px solid #fde68a;">Card Not Shared</span>`;
    }
    if (status === 'Pending') return `<span class="crm-badge badge-pending">Pending</span>`;
    if (status === 'Failed') return `<span class="crm-badge badge-abandoned">Failed</span>`;
    if (status === 'Refunded') return `<span class="crm-badge badge-gray">Refunded</span>`;
    return `<span class="crm-badge badge-gray">${escapeHtml(status || 'Pending')}</span>`;
  }

  function formatDateShort(dateStr) {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }

  function formatTimeAgo(dateStr) {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showNotice(msg) {
    const banner = document.createElement('div');
    banner.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0f172a;
      color: #fff;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
      box-shadow: 0 10px 20px rgba(0,0,0,0.15);
      z-index: 9999;
      animation: fadeIn 0.2s ease-out;
    `;
    banner.textContent = msg;
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 3500);
  }

  // Expose global methods for inline button actions
  window.crmApp = {
    viewLead,
    viewCustomer,
    openEditUserModal,
    toggleUserStatus,
    deleteUser
  };

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
