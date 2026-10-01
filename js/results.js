document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const from = (urlParams.get('from') || 'JFK').toUpperCase();
  const to = (urlParams.get('to') || 'LAX').toUpperCase();
  const date = urlParams.get('date') || urlParams.get('depart') || '2026-11-20';
  const returnDate = urlParams.get('returnDate') || urlParams.get('return') || '';
  const cabin = urlParams.get('cabin') || 'Economy';
  const adults = parseInt(urlParams.get('adults'), 10) || 1;
  const children = parseInt(urlParams.get('children'), 10) || 0;
  const infants = parseInt(urlParams.get('infants'), 10) || 0;
  let currency = urlParams.get('currency') || localStorage.getItem('fs_currency') || 'USD';

  let rawFlights = [];
  let activeFilterStops = 'all';
  let activeFilterAirline = 'ALL';
  let activeSort = 'cheapest';

  // Currency Selector
  const currSelect = document.getElementById('resultsCurrencySelect');
  if (currSelect) {
    currSelect.value = currency;
    currSelect.addEventListener('change', (e) => {
      currency = e.target.value;
      localStorage.setItem('fs_currency', currency);
      applyAndRender();
    });
  }

  // Common Airport to City map for instantaneous zero-flash display
  const AIRPORT_CITIES = {
    JFK: 'New York', EWR: 'Newark', LGA: 'New York', LAX: 'Los Angeles', SFO: 'San Francisco',
    ORD: 'Chicago', MIA: 'Miami', DFW: 'Dallas', ATL: 'Atlanta', BOS: 'Boston',
    SEA: 'Seattle', DEN: 'Denver', LAS: 'Las Vegas', MCO: 'Orlando', PHX: 'Phoenix',
    LHR: 'London', LGW: 'London', CDG: 'Paris', FRA: 'Frankfurt', AMS: 'Amsterdam',
    DXB: 'Dubai', DOH: 'Doha', SIN: 'Singapore', BKK: 'Bangkok', NRT: 'Tokyo', HND: 'Tokyo',
    DEL: 'New Delhi', BOM: 'Mumbai', BLR: 'Bengaluru', MAA: 'Chennai', CCU: 'Kolkata',
    HYD: 'Hyderabad', PAT: 'Patna', AMD: 'Ahmedabad', PNQ: 'Pune', COK: 'Kochi',
    YYZ: 'Toronto', YVR: 'Vancouver', SYD: 'Sydney', MEL: 'Melbourne'
  };

  // Update Route Banner Header immediately
  const displayOriginIata = document.getElementById('displayOriginIata');
  const displayOriginCity = document.getElementById('displayOriginCity');
  const displayDestIata = document.getElementById('displayDestIata');
  const displayDestCity = document.getElementById('displayDestCity');
  const displayDatePill = document.getElementById('displayDatePill');
  const displayPaxPill = document.getElementById('displayPaxPill');

  if (displayOriginIata) displayOriginIata.textContent = from;
  if (displayDestIata) displayDestIata.textContent = to;

  // Immediate city name resolution with zero DEL/PAT flashing
  const immediateOriginCity = urlParams.get('fromCity') || urlParams.get('originCity') || AIRPORT_CITIES[from] || from;
  const immediateDestCity = urlParams.get('toCity') || urlParams.get('destCity') || AIRPORT_CITIES[to] || to;
  if (displayOriginCity) displayOriginCity.textContent = immediateOriginCity;
  if (displayDestCity) displayDestCity.textContent = immediateDestCity;

  if (displayPaxPill) {
    const totalPax = adults + children + infants;
    displayPaxPill.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      <span>${totalPax} Traveler${totalPax > 1 ? 's' : ''} · ${cabin}</span>
    `;
  }

  // Date Formatting Helper
  function formatDateNice(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
      }
    } catch {
      return dateStr;
    }
    return dateStr;
  }

  if (displayDatePill) {
    const calSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`;
    if (returnDate) {
      displayDatePill.innerHTML = `${calSvg}<span>${formatDateNice(date)} – ${formatDateNice(returnDate)}</span>`;
    } else {
      displayDatePill.innerHTML = `${calSvg}<span>${formatDateNice(date)}</span>`;
    }
  }

  renderDateStrip();
  initBottomSheet();
  fetchResults();

  // Responsive Date Strip (7 on desktop, 4 on phone + manual calendar picker)
  function renderDateStrip() {
    const strip = document.getElementById('resultsDateStrip');
    const manualDateInput = document.getElementById('manualDateInput');
    if (!strip) return;

    let baseDate = new Date();
    try {
      const parts = date.split('-');
      if (parts.length === 3) {
        baseDate = new Date(parts[0], parts[1] - 1, parts[2]);
      }
    } catch (e) {
      console.error(e);
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    let html = '';
    // Generate exactly 7 dates around current selection
    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(baseDate);
      targetDate.setDate(baseDate.getDate() + i);
      const isSelected = i === 0;
      const dayNum = targetDate.getDate();
      const monthStr = months[targetDate.getMonth()];
      const weekdayStr = days[targetDate.getDay()];
      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dd = String(dayNum).padStart(2, '0');
      const isoStr = `${yyyy}-${mm}-${dd}`;

      html += `
        <div class="date-pill-btn ${isSelected ? 'active' : ''}" data-date="${isoStr}">
          <div class="date-pill-day">${dayNum} ${monthStr}</div>
          <div class="date-pill-weekday">${weekdayStr}</div>
          <div class="date-pill-price">${isSelected ? 'Selected' : 'View Fares'}</div>
        </div>
      `;
    }

    // Append sleek Manual Date Picker pill with SVG icon
    html += `
      <div class="date-picker-trigger-pill" id="btnManualDatePicker" title="Choose specific travel date">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 2px;">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
          <line x1="16" x2="16" y1="2" y2="6"/>
          <line x1="8" x2="8" y1="2" y2="6"/>
          <line x1="3" x2="21" y1="10" y2="10"/>
        </svg>
        <span>Pick Date</span>
      </div>
    `;

    strip.innerHTML = html;

    // Date pill click
    strip.querySelectorAll('.date-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const newDate = btn.dataset.date;
        const newParams = new URLSearchParams(window.location.search);
        newParams.set('date', newDate);
        window.location.href = `${window.location.pathname}?${newParams.toString()}`;
      });
    });

    // Manual date picker click
    const btnPick = document.getElementById('btnManualDatePicker');
    if (btnPick && manualDateInput) {
      manualDateInput.value = date;
      btnPick.addEventListener('click', () => {
        if (typeof manualDateInput.showPicker === 'function') {
          manualDateInput.showPicker();
        } else {
          manualDateInput.click();
        }
      });

      manualDateInput.addEventListener('change', (e) => {
        if (e.target.value) {
          const newParams = new URLSearchParams(window.location.search);
          newParams.set('date', e.target.value);
          window.location.href = `${window.location.pathname}?${newParams.toString()}`;
        }
      });
    }
  }

  // Floating Bottom Bar & Bottom Sheet Logic
  function initBottomSheet() {
    const btnFloatSort = document.getElementById('btnFloatSort');
    const btnFloatFilter = document.getElementById('btnFloatFilter');
    const overlay = document.getElementById('bottomSheetOverlay');
    const btnClose = document.getElementById('btnCloseSheet');
    const btnApply = document.getElementById('btnApplySheet');
    const sheetTitle = document.getElementById('sheetTitle');

    if (!overlay) return;

    function openSheet(title) {
      if (sheetTitle) sheetTitle.textContent = title;
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeSheet() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    btnFloatSort?.addEventListener('click', () => openSheet('Sort Flights'));
    btnFloatFilter?.addEventListener('click', () => openSheet('Filter Flights'));
    btnClose?.addEventListener('click', closeSheet);
    btnApply?.addEventListener('click', () => {
      closeSheet();
      applyAndRender();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeSheet();
    });

    // Sort buttons inside sheet
    document.querySelectorAll('.sheet-sort-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sheet-sort-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeSort = btn.dataset.sort;
        applyAndRender();
      });
    });

    // Stops buttons inside sheet
    document.querySelectorAll('.sheet-stops-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sheet-stops-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilterStops = btn.dataset.stops;
        updateFilterIndicator();
        applyAndRender();
      });
    });
  }

  function updateFilterIndicator() {
    const filterActiveDot = document.getElementById('filterActiveDot');
    const isFiltered = activeFilterStops !== 'all' || activeFilterAirline !== 'ALL';
    if (filterActiveDot) {
      filterActiveDot.style.display = isFiltered ? 'inline-block' : 'none';
    }
  }

  // Carrier Logo Helper for Filter Sheet
  function getAirlineLogo(airlineName, flights) {
    const match = flights.find(f => (f.airlineName || f.airline) === airlineName);
    if (match && match.airlineLogo) return match.airlineLogo;
    if (match && match.carrierCode) return `https://images.kiwi.com/airlines/64/${match.carrierCode}.png`;
    const map = {
      'IndiGo': '6E',
      'Air India': 'AI',
      'Air India Express': 'IX',
      'SpiceJet': 'SG',
      'Akasa Air': 'QP',
      'Vistara': 'UK',
      'Delta': 'DL',
      'Delta Air Lines': 'DL',
      'American': 'AA',
      'American Airlines': 'AA',
      'United': 'UA',
      'United Airlines': 'UA',
      'Southwest Airlines': 'WN',
      'Southwest': 'WN',
      'JetBlue': 'B6',
      'Alaska Airlines': 'AS',
      'Emirates': 'EK',
      'British Airways': 'BA',
      'Qatar Airways': 'QR',
      'Lufthansa': 'LH'
    };
    const code = map[airlineName];
    return code ? `https://images.kiwi.com/airlines/64/${code}.png` : '';
  }

  // Fetch Live Results from Server
  async function fetchResults() {
    const container = document.getElementById('resultsListContainer');

    try {
      const queryUrl = `/api/flights/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}&returnDate=${encodeURIComponent(returnDate)}&cabin=${encodeURIComponent(cabin)}&adults=${adults}&children=${children}&infants=${infants}&currency=USD`;
      
      const res = await fetch(queryUrl);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Flight search returned an error.');
      }

      rawFlights = Array.isArray(data.flights) ? data.flights : [];

      if (displayOriginCity && data.originName) displayOriginCity.textContent = data.originName;
      if (displayDestCity && data.destName) displayDestCity.textContent = data.destName;

      // Generate dynamic airline filter pills into bottom sheet with logos
      buildSheetAirlineFilters(rawFlights);
      applyAndRender();
    } catch (err) {
      console.error('Flight search fetch error:', err);
      container.innerHTML = `
        <div style="text-align: center; padding: 48px 20px; background: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
          <div style="font-size: 38px; margin-bottom: 12px;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto;"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>
          </div>
          <h3 style="font-size: 20px; font-weight: 800; color: #0f172a;">No Live Flights Found for Selected Route</h3>
          <p style="color: #64748b; font-size: 14px; margin: 8px auto 20px; max-width: 440px;">
            We could not find matching flight itineraries for <strong>${from} → ${to}</strong> on the selected dates.
          </p>
          <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            <a href="/" class="btn-book-ticket" style="text-decoration: none; padding: 10px 24px;">Change Route or Dates</a>
            <button type="button" class="btn-flight-details-toggle" onclick="location.reload()">Retry Search</button>
          </div>
        </div>
      `;
    }
  }

  // Build Dynamic Airline Filter in Bottom Sheet with REAL LOGOS (User Requirement 3)
  function buildSheetAirlineFilters(flights) {
    const listContainer = document.getElementById('sheetAirlinesList');
    if (!listContainer) return;

    const airlinesSet = new Set();
    flights.forEach(f => {
      const name = f.airlineName || f.airline;
      if (name) airlinesSet.add(name);
    });

    let html = `
      <button type="button" class="sheet-airline-chip ${activeFilterAirline === 'ALL' ? 'active' : ''}" data-airline="ALL">
        <span style="width: 8px; height: 8px; border-radius: 50%; background: currentColor; opacity: 0.6;"></span>
        <span>All Airlines</span>
        <span class="sheet-chip-count">${flights.length}</span>
      </button>
    `;

    airlinesSet.forEach(airline => {
      const count = flights.filter(f => (f.airlineName || f.airline) === airline).length;
      const logo = getAirlineLogo(airline, flights);
      html += `
        <button type="button" class="sheet-airline-chip ${activeFilterAirline === airline ? 'active' : ''}" data-airline="${airline}">
          ${logo ? `<img src="${logo}" alt="${airline}" class="sheet-carrier-img" onerror="this.style.display='none'">` : ''}
          <span>${airline}</span>
          <span class="sheet-chip-count">${count}</span>
        </button>
      `;
    });

    listContainer.innerHTML = html;

    listContainer.querySelectorAll('.sheet-airline-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        listContainer.querySelectorAll('.sheet-airline-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeFilterAirline = chip.dataset.airline;
        updateFilterIndicator();
        applyAndRender();
      });
    });
  }

  // Filter, Sort and Render Flights
  function applyAndRender() {
    const container = document.getElementById('resultsListContainer');
    let list = [...rawFlights];

    // Filter by Stops
    if (activeFilterStops === 'direct') {
      list = list.filter(f => (f.stops || '').toLowerCase().includes('nonstop') || (f.stops || '').toLowerCase().includes('direct') || f.stopsCount === 0);
    }

    // Filter by Airline
    if (activeFilterAirline && activeFilterAirline !== 'ALL') {
      list = list.filter(f => (f.airlineName || f.airline) === activeFilterAirline);
    }

    // Sort
    if (activeSort === 'cheapest') {
      list.sort((a, b) => (a.pricing?.total || a.price || 0) - (b.pricing?.total || b.price || 0));
    } else if (activeSort === 'fastest') {
      list.sort((a, b) => (a.durationMinutes || 999) - (b.durationMinutes || 999));
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 48px 20px; background: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0;">
          <h3 style="font-size: 18px; font-weight: 800; color: #0f172a;">No Flights Match Your Filter Criteria</h3>
          <p style="color: #64748b; font-size: 14px; margin: 8px 0 16px;">Try switching to "All Flights" or selecting "All Airlines".</p>
          <button type="button" class="btn-book-ticket" id="btnResetAllFilters" style="padding: 10px 22px;">Reset Filters</button>
        </div>
      `;
      document.getElementById('btnResetAllFilters')?.addEventListener('click', () => {
        activeFilterStops = 'all';
        activeFilterAirline = 'ALL';
        document.querySelectorAll('.sheet-stops-btn').forEach(b => b.classList.toggle('active', b.dataset.stops === 'all'));
        document.querySelectorAll('.sheet-airline-chip').forEach(c => c.classList.toggle('active', c.dataset.airline === 'ALL'));
        updateFilterIndicator();
        applyAndRender();
      });
      return;
    }

    // Plane SVG Icon
    const planeSvg = `<svg class="trail-plane-svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`;
    const returnPlaneSvg = `<svg class="trail-plane-svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style="transform: scaleX(-1);"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`;

    // Render Ticket Cards Matching Reference 1 & 3 with Generous Column Gap & No Emojis
    container.innerHTML = list.map((flight, idx) => {
      const priceTotal = flight.pricing?.total || flight.price || 199;
      const formattedTotal = `$${priceTotal.toLocaleString()}`;
      const isRound = Boolean(flight.isRoundTrip && flight.inbound);

      // Status pill badge
      let badgeClass = 'badge-cheapest';
      let badgeText = 'Cheapest';
      if (idx === 1) {
        badgeClass = 'badge-bestseller';
        badgeText = 'Best Value';
      } else if (idx === 2) {
        badgeClass = 'badge-recommended';
        badgeText = 'Popular Choice';
      } else if (flight.stopsCount === 0) {
        badgeClass = 'badge-cheapest';
        badgeText = 'Nonstop Direct';
      } else {
        badgeClass = 'badge-fastest';
        badgeText = 'Verified Deal';
      }

      // Baggage text
      const baggageText = flight.baggage?.cabin || '1 Personal Item Included';
      const checkedBaggage = flight.baggage?.checked || 'Checked bag options available';

      // Outbound leg
      const outboundHtml = `
        <div class="ticket-flight-row">
          <div class="time-city-block">
            <div class="flight-time-large">${flight.depTime}</div>
            <div class="flight-city-sm">${flight.origin} · ${flight.originCity || ''}</div>
          </div>

          <div class="flight-mid-route">
            <span class="flight-duration-tag">${flight.duration}</span>
            <div class="flight-trail-visual">
              <span class="trail-line"></span>
              ${planeSvg}
              <span class="trail-line"></span>
            </div>
            <span style="font-size: 11.5px; color: #10b981; font-weight: 700;">
              ${flight.stops} · ${flight.aircraft || 'Airbus / Boeing'}
            </span>
          </div>

          <div class="time-city-block right">
            <div class="flight-time-large">${flight.arrTime}</div>
            <div class="flight-city-sm">${flight.destination} · ${flight.destCity || ''}</div>
          </div>
        </div>
      `;

      // Inbound leg if round trip
      let inboundHtml = '';
      if (isRound && flight.inbound) {
        inboundHtml = `
          <div class="ticket-return-leg">
            <div class="return-leg-header">
              <span>Return Flight · ${flight.inbound.carrier || flight.airlineName || 'Operating Carrier'}</span>
              <span>${flight.inbound.duration || ''}</span>
            </div>
            <div class="ticket-flight-row">
              <div class="time-city-block">
                <div class="flight-time-large">${flight.inbound.depTime || '---'}</div>
                <div class="flight-city-sm">${flight.destination}</div>
              </div>

              <div class="flight-mid-route">
                <span class="flight-duration-tag">${flight.inbound.duration || ''}</span>
                <div class="flight-trail-visual">
                  <span class="trail-line"></span>
                  ${returnPlaneSvg}
                  <span class="trail-line"></span>
                </div>
                <span style="font-size: 11.5px; color: #0284c7; font-weight: 700;">
                  Return Leg · Verified Schedule
                </span>
              </div>

              <div class="time-city-block right">
                <div class="flight-time-large">${flight.inbound.arrTime || '---'}</div>
                <div class="flight-city-sm">${flight.origin}</div>
              </div>
            </div>
          </div>
        `;
      }

      // Segments for details accordion
      const segments = Array.isArray(flight.segments) ? flight.segments : [];
      const segmentsHtml = segments.map((seg, sIdx) => `
        <div class="segment-leg-row" style="display: flex; gap: 12px; margin-bottom: 8px; font-size: 12.5px;">
          <div style="font-weight: 800; color: #0284c7;">Leg ${sIdx + 1}:</div>
          <div>
            <strong>${seg.carrierName || flight.airlineName}</strong> (${seg.carrierCode} ${seg.flightNumber || ''}) · ${seg.aircraft || ''}<br>
            <span>${seg.depAirport} (${seg.depTime}) → ${seg.arrAirport} (${seg.arrTime})</span> · 
            <span style="color: #64748b;">Duration: ${seg.duration}</span>
          </div>
        </div>
      `).join('');

      return `
        <div class="ticket-card" id="ticket-${flight.flightId}">
          <!-- Card Header -->
          <div class="ticket-card-header">
            <div class="ticket-airline-info">
              <img src="${flight.airlineLogo || 'https://images.kiwi.com/airlines/64/' + (flight.carrierCode || '6E') + '.png'}" 
                   alt="${flight.airlineName || flight.airline}" 
                   onerror="this.src='/assets/airlines/default.png'"
                   class="ticket-airline-logo">
              <div>
                <span class="ticket-airline-name">${flight.airlineName || flight.airline || 'Verified Carrier'}</span>
                <span style="font-size: 11.5px; color: #64748b; font-weight: 600;"> · ${flight.flightNumber || flight.carrierCode || 'Direct'}</span>
              </div>
            </div>
            <span class="ticket-badge ${badgeClass}">${badgeText}</span>
          </div>

          <!-- Outbound Flight Section -->
          ${outboundHtml}

          <!-- Inbound Flight Section (If Round Trip) -->
          ${inboundHtml}

          <!-- Baggage and Amenities Row with Clean SVGs (No Emojis) -->
          <div class="ticket-amenities-row">
            <span style="display: inline-flex; align-items: center; gap: 6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              ${baggageText}
            </span>
            <span style="color: #cbd5e1;">·</span>
            <span style="display: inline-flex; align-items: center; gap: 6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 20h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M10 20v-4"/><path d="M14 20v-4"/></svg>
              ${checkedBaggage}
            </span>
            <span style="color: #cbd5e1;">·</span>
            <span style="color: #059669; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Instant Ticket Issuance
            </span>
          </div>

          <!-- Perforated Ticket Divider with Left and Right Circular Notches -->
          <div class="flight-perforation-divider">
            <div class="notch-left"></div>
            <div class="perforation-dashed-line"></div>
            <div class="notch-right"></div>
          </div>

          <!-- Ticket Footer: Pricing and Book Now CTA -->
          <div class="ticket-card-footer">
            <div class="price-container">
              <div class="price-main">${formattedTotal}</div>
              <div class="fare-category">
                <div>${flight.fareType || 'Economy Standard'}</div>
                <div style="font-size: 11px; color: #64748b;">Total for ${adults + children + infants} traveler${adults + children + infants > 1 ? 's' : ''} (taxes & fees incl.)</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
              <button type="button" class="btn-flight-details-toggle" data-target="drawer-${flight.flightId}">
                <span>Flight Details</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="toggle-arrow" style="transition: transform 0.2s ease;"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <a href="/book.html?flightId=${flight.flightId}&currency=${currency}" class="btn-book-ticket" data-flight-id="${flight.flightId}">
                <span>Book Now</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </a>
            </div>
          </div>

          <!-- Expandable Details Drawer -->
          <div class="flight-details-drawer" id="drawer-${flight.flightId}">
            <div style="font-weight: 800; color: #0f172a; margin-bottom: 10px; font-size: 13.5px;">Flight Itinerary & Aircraft Details</div>
            ${segmentsHtml || '<p style="color: #64748b;">Direct flight without layovers.</p>'}
            <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size: 12px; color: #64748b;">
              <strong>Fare Rules:</strong> ${flight.fareConditions || 'Refundable / Changeable per airline guidelines'}. 
              Seats and personal items are confirmed upon booking.
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach Toggle Listeners to Flight Details buttons
    container.querySelectorAll('.btn-flight-details-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = btn.dataset.target;
        const drawer = document.getElementById(targetId);
        if (drawer) {
          const isOpen = drawer.classList.contains('open');
          drawer.classList.toggle('open', !isOpen);
          const arrow = btn.querySelector('.toggle-arrow');
          if (arrow) arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
          const textSpan = btn.querySelector('span');
          if (textSpan) textSpan.textContent = isOpen ? 'Flight Details' : 'Hide Details';
        }
      });
    });

    // Attach Book Now click listener to store selected flight in sessionStorage
    container.querySelectorAll('.btn-book-ticket').forEach(btn => {
      btn.addEventListener('click', () => {
        const fId = btn.dataset.flightId;
        const selected = rawFlights.find(f => f.flightId === fId);
        if (selected) {
          sessionStorage.setItem('fs_active_flight', JSON.stringify(selected));
        }
      });
    });
  }
});
