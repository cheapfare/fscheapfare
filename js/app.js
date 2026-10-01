import { airports, searchAirports, getAirportByCode } from './airports.js';
import { generateFlights, formatPrice, currencyRates } from './flights-data.js';

// Application State
const state = {
  tripType: 'roundTrip',
  origin: getAirportByCode('STP'),
  destination: getAirportByCode('XPG'),
  departDate: '2024-09-19',
  returnDate: '2024-09-24',
  passengers: {
    adults: 1,
    children: 0,
    infants: 0,
    pets: 1,
    cabin: 'Economy'
  },
  currency: 'EUR',
  selectedDateIndex: 0,
  dateList: [
    { day: '19 Sep', weekday: 'Wed', fullDate: '2024-09-19', price: 171 },
    { day: '20 Sep', weekday: 'Thu', fullDate: '2024-09-20', price: 185 },
    { day: '21 Sep', weekday: 'Fri', fullDate: '2024-09-21', price: 210 },
    { day: '22 Sep', weekday: 'Sat', fullDate: '2024-09-22', price: 220 },
    { day: '23 Sep', weekday: 'Sun', fullDate: '2024-09-23', price: 195 },
    { day: '24 Sep', weekday: 'Mon', fullDate: '2024-09-24', price: 165 },
    { day: '25 Sep', weekday: 'Tue', fullDate: '2024-09-25', price: 175 }
  ],
  flights: [],
  filteredFlights: [],
  filters: {
    maxPrice: 400,
    stops: 'all', // 'all', 'direct', '1stop'
    airline: 'all'
  },
  sortBy: 'cheapest',
  upcomingTrips: [
    {
      id: 'TRIP-984',
      origin: 'STP',
      originCity: 'London',
      destination: 'XPG',
      destCity: 'Paris',
      date: '16 Sep 2024',
      depTime: '12:30',
      arrTime: '14:50',
      duration: '2h 18m',
      vehicle: 'Train/Flight',
      pnr: 'CF-782194',
      passenger: 'Kimberly Adams'
    }
  ],
  activeAirportField: 'origin', // 'origin' | 'destination'
  selectedFlightForBooking: null,
  currentBookingStep: 1
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  loadStoredTrips();
  initFlights();
  renderApp();
  setupEventListeners();
});

function loadStoredTrips() {
  const saved = localStorage.getItem('fs_upcoming_trips');
  if (saved) {
    try {
      state.upcomingTrips = JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
}

function saveTrips() {
  localStorage.setItem('fs_upcoming_trips', JSON.stringify(state.upcomingTrips));
}

function initFlights() {
  state.flights = generateFlights(state.origin.code, state.destination.code, state.departDate);
  applyFiltersAndSort();
}

function applyFiltersAndSort() {
  let list = [...state.flights];

  // Filter stops
  if (state.filters.stops === 'direct') {
    list = list.filter(f => f.stops.toLowerCase().includes('direct'));
  } else if (state.filters.stops === '1stop') {
    list = list.filter(f => f.stops.toLowerCase().includes('1 stop'));
  }

  // Filter max price
  list = list.filter(f => f.basePriceUSD <= state.filters.maxPrice);

  // Sorting
  if (state.sortBy === 'cheapest') {
    list.sort((a, b) => a.basePriceUSD - b.basePriceUSD);
  } else if (state.sortBy === 'fastest') {
    list.sort((a, b) => a.duration.localeCompare(b.duration));
  } else if (state.sortBy === 'earliest') {
    list.sort((a, b) => a.depTime.localeCompare(b.depTime));
  }

  state.filteredFlights = list;
}

// Render Core Elements
function renderApp() {
  renderTripType();
  renderRouteBoxes();
  renderDateDisplays();
  renderPassengerSummaries();
  renderDateStrip();
  renderFlightCards();
  renderUpcomingTrips();
  renderDealsGrid();
}

function renderTripType() {
  const isRound = state.tripType === 'roundTrip';
  document.querySelectorAll('.btn-round-trip').forEach(btn => {
    btn.classList.toggle('active', isRound);
  });
  document.querySelectorAll('.btn-one-way').forEach(btn => {
    btn.classList.toggle('active', !isRound);
  });

  const returnBoxes = document.querySelectorAll('.return-date-container');
  returnBoxes.forEach(box => {
    box.style.opacity = isRound ? '1' : '0.4';
    box.style.pointerEvents = isRound ? 'auto' : 'none';
  });
}

function renderRouteBoxes() {
  const routeOriginCity = document.getElementById('routeOriginCity');
  const routeOriginCode = document.getElementById('routeOriginCode');
  const routeDestCity = document.getElementById('routeDestCity');
  const routeDestCode = document.getElementById('routeDestCode');

  if (routeOriginCity) routeOriginCity.textContent = state.origin.city;
  if (routeOriginCode) routeOriginCode.textContent = state.origin.code;
  if (routeDestCity) routeDestCity.textContent = state.destination.city;
  if (routeDestCode) routeDestCode.textContent = state.destination.code;

  // Fallbacks for any legacy elements
  const mobOriginCity = document.getElementById('mobOriginCity');
  const mobOriginCode = document.getElementById('mobOriginCode');
  const mobDestCity = document.getElementById('mobDestCity');
  const mobDestCode = document.getElementById('mobDestCode');
  if (mobOriginCity) mobOriginCity.textContent = state.origin.city;
  if (mobOriginCode) mobOriginCode.textContent = state.origin.code;
  if (mobDestCity) mobDestCity.textContent = state.destination.city;
  if (mobDestCode) mobDestCode.textContent = state.destination.code;

  // Results Top Bar
  const resOrigin = document.getElementById('resOriginCode');
  const resDest = document.getElementById('resDestCode');
  const resOriginCity = document.getElementById('resOriginCity');
  const resDestCity = document.getElementById('resDestCity');

  if (resOrigin) resOrigin.textContent = state.origin.code;
  if (resDest) resDest.textContent = state.destination.code;
  if (resOriginCity) resOriginCity.textContent = state.origin.city;
  if (resDestCity) resDestCity.textContent = state.destination.city;
}

function renderDateDisplays() {
  const formatDateNice = (isoStr) => {
    const d = new Date(isoStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const departFormatted = formatDateNice(state.departDate);
  const returnFormatted = formatDateNice(state.returnDate);

  document.querySelectorAll('.depart-date-text').forEach(el => el.textContent = departFormatted);
  document.querySelectorAll('.return-date-text').forEach(el => el.textContent = returnFormatted);

  const resDateMeta = document.getElementById('resDateMeta');
  if (resDateMeta) {
    const d = new Date(state.departDate);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    resDateMeta.textContent = `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
  }
}

function renderPassengerSummaries() {
  const { adults, children, infants, pets, cabin } = state.passengers;
  const parts = [];
  if (adults > 0) parts.push(`${adults} Adult${adults > 1 ? 's' : ''}`);
  if (children > 0) parts.push(`${children} Child${children > 1 ? 'ren' : ''}`);
  if (infants > 0) parts.push(`${infants} Infant${infants > 1 ? 's' : ''}`);
  if (pets > 0) parts.push(`${pets} Pet${pets > 1 ? 's' : ''}`);

  const summary = parts.join(', ') || '1 Adult';

  document.querySelectorAll('.passenger-summary-text').forEach(el => {
    el.innerHTML = `<span style="font-size: 15px;">👤</span> ${parts[0] || '1 Adult'} ${pets > 0 ? `<span style="font-size: 15px; margin-left: 6px;">🐾</span> ${pets} Pet` : ''}`;
  });

  const deskPax = document.getElementById('deskPassengerSummary');
  if (deskPax) deskPax.textContent = `${summary} · ${cabin}`;

  const resPaxMeta = document.getElementById('resPassengerMeta');
  if (resPaxMeta) resPaxMeta.textContent = `${adults} Adult${adults > 1 ? 's' : ''}${pets > 0 ? `, ${pets} Pet` : ''}`;
}

function renderDateStrip() {
  const container = document.getElementById('dateStripContainer');
  if (!container) return;

  container.innerHTML = state.dateList.map((item, index) => {
    const isActive = index === state.selectedDateIndex;
    const formattedPrice = formatPrice(item.price, state.currency);
    return `
      <div class="date-pill-btn ${isActive ? 'active' : ''}" data-index="${index}">
        <div class="date-pill-day">${item.day}</div>
        <div class="date-pill-weekday">${item.weekday}</div>
        <div class="date-pill-price">${formattedPrice}</div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.date-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.selectedDateIndex = parseInt(btn.dataset.index, 10);
      renderDateStrip();
      initFlights();
      renderFlightCards();
    });
  });
}

function renderFlightCards() {
  const container = document.getElementById('flightCardsContainer');
  if (!container) return;

  if (state.filteredFlights.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
        <p style="font-size: 28px; margin-bottom: 8px;">✈️</p>
        <h4 style="font-weight: 700; color: #111;">No flights match your filter</h4>
        <p style="font-size: 13px; margin-top: 4px;">Try loosening price or stop limits.</p>
        <button id="btnResetFilters" style="margin-top: 14px; background: #111; color: #fff; border:none; padding: 8px 18px; border-radius: 20px; font-weight: 600; cursor: pointer;">Reset Filters</button>
      </div>
    `;
    const resetBtn = document.getElementById('btnResetFilters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.filters.stops = 'all';
        state.filters.maxPrice = 500;
        applyFiltersAndSort();
        renderFlightCards();
      });
    }
    return;
  }

  container.innerHTML = state.filteredFlights.map(flight => {
    const formattedPrice = formatPrice(flight.basePriceUSD, state.currency);
    const badgeHtml = flight.badge 
      ? `<span class="ticket-badge ${flight.badgeClass}">${flight.badge}</span>` 
      : '';

    return `
      <div class="ticket-card" data-id="${flight.id}">
        <div class="ticket-top-section">
          <div class="ticket-header-row">
            <div class="carrier-brand">
              <span class="carrier-brand-icon">🚅</span>
              <span>${flight.airline}</span>
            </div>
            ${badgeHtml}
          </div>

          <div class="ticket-flight-row">
            <div class="time-city-block">
              <div class="flight-time-large">${flight.depTime}</div>
              <div class="flight-city-sm">${state.origin.city}</div>
            </div>

            <div class="flight-mid-route">
              <span class="flight-duration-tag">${flight.duration}</span>
              <div class="flight-trail-visual">
                <span class="trail-line"></span>
                <span class="carrier-vehicle-icon">🚆</span>
                <span class="trail-line"></span>
              </div>
            </div>

            <div class="time-city-block right">
              <div class="flight-time-large">${flight.arrTime}</div>
              <div class="flight-city-sm">${state.destination.city}</div>
            </div>
          </div>
        </div>

        <div class="ticket-perforation-divider">
          <div class="notch-left"></div>
          <div class="perforation-dashed-line"></div>
          <div class="notch-right"></div>
        </div>

        <div class="ticket-bottom-section">
          <div class="price-container">
            <div class="price-main">${formattedPrice}</div>
            <div class="fare-category">${flight.fareType}</div>
          </div>
          <button class="btn-book-ticket" data-flight-id="${flight.id}">Book Now</button>
        </div>
      </div>
    `;
  }).join('');

  // Attach Book Now click events
  container.querySelectorAll('.btn-book-ticket').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const flightId = btn.dataset.flightId;
      startBookingFlow(flightId);
    });
  });
}

function renderUpcomingTrips() {
  const container = document.getElementById('upcomingTripsContainer');
  if (!container) return;

  if (state.upcomingTrips.length === 0) {
    container.innerHTML = `
      <div style="background: #fff; border-radius: 20px; padding: 20px; text-align: center; color: #94a3b8; font-size: 13px; border: 1px solid #edf0f2;">
        No upcoming trips yet. Book a flight to see your itinerary here!
      </div>
    `;
    return;
  }

  const latestTrip = state.upcomingTrips[0];
  container.innerHTML = `
    <div class="upcoming-trip-card" data-trip-id="${latestTrip.id}">
      <div class="trip-card-top">
        <div class="trip-city-col">
          <div class="trip-code-sm">${latestTrip.origin}</div>
          <div class="trip-city-name">${latestTrip.originCity}</div>
        </div>

        <div class="trip-route-visual">
          <span class="trip-route-date">${latestTrip.date}</span>
          <div class="trip-route-line-svg">
            <span>🚆</span>
            <span style="letter-spacing: 2px;">••••••</span>
            <span>📍</span>
          </div>
        </div>

        <div class="trip-city-col" style="text-align: right;">
          <div class="trip-code-sm">${latestTrip.destination}</div>
          <div class="trip-city-name">${latestTrip.destCity}</div>
        </div>
      </div>

      <div class="trip-card-bottom">
        <div>${latestTrip.depTime}</div>
        <div class="trip-duration-pill">${latestTrip.duration}</div>
        <div>${latestTrip.arrTime}</div>
      </div>
    </div>
  `;

  const card = container.querySelector('.upcoming-trip-card');
  if (card) {
    card.addEventListener('click', () => {
      showTripDetailModal(latestTrip);
    });
  }
}

function renderDealsGrid() {
  const container = document.getElementById('desktopDealsContainer');
  if (!container) return;

  const deals = [
    { from: 'London (LHR)', to: 'Paris (CDG)', dates: 'Oct 12 - Oct 18', priceUSD: 145, badge: 'Popular' },
    { from: 'New York (JFK)', to: 'London (LHR)', dates: 'Nov 04 - Nov 12', priceUSD: 389, badge: 'Best Value' },
    { from: 'Dubai (DXB)', to: 'Singapore (SIN)', dates: 'Nov 15 - Nov 22', priceUSD: 420, badge: 'Cheapest' },
    { from: 'Mumbai (BOM)', to: 'Dubai (DXB)', dates: 'Oct 25 - Nov 02', priceUSD: 210, badge: 'Trending' }
  ];

  container.innerHTML = deals.map(d => {
    return `
      <div class="deal-card">
        <div>
          <div class="deal-card-route">
            <span>${d.from} ➔ ${d.to}</span>
            <span class="deal-badge">${d.badge}</span>
          </div>
          <div class="deal-dates">📅 ${d.dates}</div>
        </div>
        <div class="deal-bottom">
          <span style="font-size: 12px; color: var(--text-muted);">From</span>
          <span class="deal-price-val">${formatPrice(d.priceUSD, state.currency)}</span>
        </div>
      </div>
    `;
  }).join('');
}

// Event Listeners Setup
function setupEventListeners() {
  // Mode switcher (Dual Demo vs Full Desktop)
  const btnDual = document.getElementById('btnModeDual');
  const btnFull = document.getElementById('btnModeFull');
  const appSection = document.getElementById('appMockupSection');
  const deskSection = document.getElementById('desktopPortalSection');

  if (btnDual && btnFull) {
    btnDual.addEventListener('click', () => {
      btnDual.classList.add('active');
      btnFull.classList.remove('active');
      appSection.scrollIntoView({ behavior: 'smooth' });
    });
    btnFull.addEventListener('click', () => {
      btnFull.classList.add('active');
      btnDual.classList.remove('active');
      deskSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Currency Select
  const currencySelect = document.getElementById('globalCurrencySelect');
  if (currencySelect) {
    currencySelect.addEventListener('change', (e) => {
      state.currency = e.target.value;
      renderApp();
    });
  }

  // Trip Type Toggles
  document.querySelectorAll('.btn-round-trip').forEach(btn => {
    btn.addEventListener('click', () => {
      state.tripType = 'roundTrip';
      renderTripType();
    });
  });

  document.querySelectorAll('.btn-one-way').forEach(btn => {
    btn.addEventListener('click', () => {
      state.tripType = 'oneWay';
      renderTripType();
    });
  });

  // Airport Selector Trigger
  const openAirportModal = (type) => {
    state.activeAirportField = type;
    const modal = document.getElementById('airportModal');
    const title = document.getElementById('airportModalTitle');
    title.textContent = type === 'origin' ? 'Select Departure City' : 'Select Destination City';
    const input = document.getElementById('airportSearchInput');
    input.value = '';
    renderAirportOptions('');
    modal.classList.add('active');
    setTimeout(() => input.focus(), 100);
  };

  document.querySelectorAll('.origin-click-trigger').forEach(el => {
    el.addEventListener('click', () => openAirportModal('origin'));
  });

  document.querySelectorAll('.dest-click-trigger').forEach(el => {
    el.addEventListener('click', () => openAirportModal('destination'));
  });

  // Swap Buttons
  document.querySelectorAll('.swap-action-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const temp = state.origin;
      state.origin = state.destination;
      state.destination = temp;
      renderRouteBoxes();
      initFlights();
      renderFlightCards();
    });
  });

  // Passenger Modal Trigger
  document.querySelectorAll('.passenger-click-trigger').forEach(el => {
    el.addEventListener('click', () => {
      document.getElementById('passengerModal').classList.add('active');
    });
  });

  // Search Action
  document.querySelectorAll('.search-action-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.innerHTML = `<span>⏳ Searching...</span>`;
      setTimeout(() => {
        btn.innerHTML = `<span style="font-size: 16px;">🔍</span> Search`;
        initFlights();
        renderFlightCards();
        // Smoothly scroll to results section
        const resultsSec = document.getElementById('resultsSection');
        if (resultsSec) {
          resultsSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 350);
    });
  });

  // Airport Modal Search & Selection
  const airportInput = document.getElementById('airportSearchInput');
  if (airportInput) {
    airportInput.addEventListener('input', (e) => {
      renderAirportOptions(e.target.value);
    });
  }

  // Passenger Modal Counters
  setupPassengerModalCounters();

  // Sort & Filter Bottom Sheet Triggers
  const btnSort = document.getElementById('btnSortTrigger');
  const btnFilter = document.getElementById('btnFilterTrigger');

  if (btnSort) {
    btnSort.addEventListener('click', () => {
      document.getElementById('sortModal').classList.add('active');
    });
  }

  if (btnFilter) {
    btnFilter.addEventListener('click', () => {
      document.getElementById('filterModal').classList.add('active');
    });
  }

  // Close modals when clicking close button or background overlay
  document.querySelectorAll('.modal-close-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });
}

function renderAirportOptions(query) {
  const container = document.getElementById('airportListGrid');
  if (!container) return;

  const matches = searchAirports(query);
  container.innerHTML = matches.map(apt => `
    <button class="airport-item-btn" data-code="${apt.code}">
      <div>
        <div style="font-weight: 700; font-size: 15px; color: #111;">${apt.city} (${apt.code})</div>
        <div style="font-size: 12px; color: var(--text-muted);">${apt.name}, ${apt.country}</div>
      </div>
      <span class="airport-code-badge">${apt.code}</span>
    </button>
  `).join('');

  container.querySelectorAll('.airport-item-btn').forEach(item => {
    item.addEventListener('click', () => {
      const code = item.dataset.code;
      const selectedApt = getAirportByCode(code);
      if (state.activeAirportField === 'origin') {
        state.origin = selectedApt;
      } else {
        state.destination = selectedApt;
      }
      renderRouteBoxes();
      initFlights();
      renderFlightCards();
      document.getElementById('airportModal').classList.remove('active');
    });
  });
}

function setupPassengerModalCounters() {
  const p = state.passengers;
  const updateCounts = () => {
    document.getElementById('countAdults').textContent = p.adults;
    document.getElementById('countChildren').textContent = p.children;
    document.getElementById('countPets').textContent = p.pets;
    renderPassengerSummaries();
  };

  document.getElementById('btnIncAdults')?.addEventListener('click', () => { p.adults++; updateCounts(); });
  document.getElementById('btnDecAdults')?.addEventListener('click', () => { if (p.adults > 1) { p.adults--; updateCounts(); } });

  document.getElementById('btnIncChildren')?.addEventListener('click', () => { p.children++; updateCounts(); });
  document.getElementById('btnDecChildren')?.addEventListener('click', () => { if (p.children > 0) { p.children--; updateCounts(); } });

  document.getElementById('btnIncPets')?.addEventListener('click', () => { p.pets++; updateCounts(); });
  document.getElementById('btnDecPets')?.addEventListener('click', () => { if (p.pets > 0) { p.pets--; updateCounts(); } });

  document.getElementById('cabinClassSelect')?.addEventListener('change', (e) => {
    p.cabin = e.target.value;
    renderPassengerSummaries();
  });

  document.getElementById('btnSavePassengers')?.addEventListener('click', () => {
    document.getElementById('passengerModal').classList.remove('active');
  });
}

// Booking Checkout Flow
function startBookingFlow(flightId) {
  const flight = state.flights.find(f => f.id === flightId);
  if (!flight) return;
  state.selectedFlightForBooking = flight;
  state.currentBookingStep = 1;

  const modal = document.getElementById('checkoutModal');
  renderBookingStep();
  modal.classList.add('active');
}

function renderBookingStep() {
  const body = document.getElementById('checkoutModalBody');
  const flight = state.selectedFlightForBooking;
  if (!flight || !body) return;

  const formattedPrice = formatPrice(flight.basePriceUSD, state.currency);

  if (state.currentBookingStep === 1) {
    // Step 1: Review & Passenger Info
    body.innerHTML = `
      <div class="checkout-summary-box">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-weight: 800; font-size: 16px;">🚅 ${flight.airline} (${flight.flightNumber})</span>
          <span style="font-weight: 800; font-size: 18px; color: #111;">${formattedPrice}</span>
        </div>
        <div style="font-size: 13px; color: var(--text-muted);">
          ${state.origin.city} (${state.origin.code}) ➔ ${state.destination.city} (${state.destination.code})
        </div>
        <div style="font-size: 12px; color: #10b981; font-weight: 600; margin-top: 4px;">
          ✓ Non-stop (${flight.duration}) · Free cancellation within 24h
        </div>
      </div>

      <h4 style="font-weight: 800; margin-bottom: 12px; font-size: 16px;">Lead Passenger Details</h4>
      <div class="form-row-2">
        <div class="form-group-custom">
          <label>First Name</label>
          <input type="text" id="paxFirstName" value="Kimberly" required>
        </div>
        <div class="form-group-custom">
          <label>Last Name</label>
          <input type="text" id="paxLastName" value="Adams" required>
        </div>
      </div>
      <div class="form-group-custom">
        <label>Email Address</label>
        <input type="email" id="paxEmail" value="kimberly.adams@example.com" required>
      </div>
      <div class="form-group-custom">
        <label>Mobile Number</label>
        <input type="tel" id="paxPhone" value="+44 7700 900077" required>
      </div>

      <button id="btnProceedToPay" class="search-submit-btn" style="margin-top: 14px;">
        Continue to Payment (${formattedPrice}) ➔
      </button>
    `;

    document.getElementById('btnProceedToPay').addEventListener('click', () => {
      state.currentBookingStep = 2;
      renderBookingStep();
    });
  } else if (state.currentBookingStep === 2) {
    // Step 2: Payment Simulation
    body.innerHTML = `
      <div class="checkout-summary-box">
        <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 4px;">Total Amount to Pay:</div>
        <div style="font-size: 26px; font-weight: 800; color: #111;">${formattedPrice}</div>
        <div style="font-size: 12px; color: #0284c7; margin-top: 4px;">🔒 256-Bit SSL Encrypted Safe Checkout</div>
      </div>

      <div class="form-group-custom">
        <label>Cardholder Name</label>
        <input type="text" value="Kimberly Adams">
      </div>
      <div class="form-group-custom">
        <label>Card Number</label>
        <input type="text" value="4532 •••• •••• 8892">
      </div>
      <div class="form-row-2">
        <div class="form-group-custom">
          <label>Expiry</label>
          <input type="text" value="09/28">
        </div>
        <div class="form-group-custom">
          <label>CVV</label>
          <input type="password" value="842">
        </div>
      </div>

      <button id="btnConfirmPayment" class="search-submit-btn" style="background: #10b981; margin-top: 14px;">
        Confirm & Pay ${formattedPrice} 🔒
      </button>
    `;

    document.getElementById('btnConfirmPayment').addEventListener('click', () => {
      const btn = document.getElementById('btnConfirmPayment');
      btn.textContent = 'Processing Payment...';
      btn.style.opacity = '0.7';

      setTimeout(() => {
        completeBooking(flight);
      }, 1000);
    });
  } else if (state.currentBookingStep === 3) {
    // Step 3: Confirmed Boarding Pass / E-Ticket
    const latest = state.upcomingTrips[0];
    body.innerHTML = `
      <div style="text-align: center; margin-bottom: 16px;">
        <span style="font-size: 40px;">🎉</span>
        <h3 style="font-weight: 800; font-size: 22px; color: #111;">Booking Confirmed!</h3>
        <p style="font-size: 13px; color: var(--text-muted);">Your e-ticket has been sent to Kimberly's email.</p>
      </div>

      <div class="boarding-pass-final">
        <div class="bp-header">
          <div>
            <div style="font-weight: 800; font-size: 16px;">FS Cheap Fare Network</div>
            <div style="font-size: 11px; opacity: 0.8;">E-Boarding Pass & Reservation</div>
          </div>
          <div class="bp-pnr">PNR: ${latest.pnr}</div>
        </div>

        <div class="bp-grid">
          <div>
            <div class="bp-cell-lbl">Passenger</div>
            <div class="bp-cell-val">${latest.passenger}</div>
          </div>
          <div>
            <div class="bp-cell-lbl">Travel Date</div>
            <div class="bp-cell-val">${latest.date}</div>
          </div>
          <div>
            <div class="bp-cell-lbl">Departure</div>
            <div class="bp-cell-val">${latest.depTime} (${latest.origin})</div>
          </div>
          <div>
            <div class="bp-cell-lbl">Arrival</div>
            <div class="bp-cell-val">${latest.arrTime} (${latest.destination})</div>
          </div>
        </div>

        <div class="qr-code-placeholder">
          <span>||||| ||| ||||||| || ||||||</span>
          <span style="font-size: 11px; color: #555;">VERIFIED TICKET</span>
        </div>
      </div>

      <div style="display: flex; gap: 10px;">
        <button id="btnPrintTicket" class="search-submit-btn" style="flex: 1; background: #f1f5f9; color: #111; margin-top:0;">
          🖨️ Print Ticket
        </button>
        <button id="btnCloseDone" class="search-submit-btn" style="flex: 1; margin-top:0;">
          Done
        </button>
      </div>
    `;

    document.getElementById('btnPrintTicket').addEventListener('click', () => {
      window.print();
    });

    document.getElementById('btnCloseDone').addEventListener('click', () => {
      document.getElementById('checkoutModal').classList.remove('active');
    });
  }
}

function completeBooking(flight) {
  const newTrip = {
    id: `TRIP-${Math.floor(1000 + Math.random() * 9000)}`,
    origin: state.origin.code,
    originCity: state.origin.city,
    destination: state.destination.code,
    destCity: state.destination.city,
    date: state.departDate,
    depTime: flight.depTime,
    arrTime: flight.arrTime,
    duration: flight.duration,
    vehicle: flight.airline,
    pnr: `FS-${Math.floor(100000 + Math.random() * 900000)}`,
    passenger: 'Kimberly Adams'
  };

  state.upcomingTrips.unshift(newTrip);
  saveTrips();
  renderUpcomingTrips();

  state.currentBookingStep = 3;
  renderBookingStep();
}

function showTripDetailModal(trip) {
  const modal = document.getElementById('checkoutModal');
  const body = document.getElementById('checkoutModalBody');
  if (!modal || !body) return;

  body.innerHTML = `
    <div style="text-align: center; margin-bottom: 16px;">
      <h3 style="font-weight: 800; font-size: 20px;">Trip Details</h3>
      <p style="font-size: 13px; color: var(--text-muted);">Confirmed Booking Itinerary</p>
    </div>

    <div class="boarding-pass-final">
      <div class="bp-header">
        <div>
          <div style="font-weight: 800; font-size: 16px;">${trip.vehicle}</div>
          <div style="font-size: 11px; opacity: 0.8;">FS Cheap Fare Network</div>
        </div>
        <div class="bp-pnr">PNR: ${trip.pnr}</div>
      </div>

      <div class="bp-grid">
        <div>
          <div class="bp-cell-lbl">Passenger</div>
          <div class="bp-cell-val">${trip.passenger}</div>
        </div>
        <div>
          <div class="bp-cell-lbl">Date</div>
          <div class="bp-cell-val">${trip.date}</div>
        </div>
        <div>
          <div class="bp-cell-lbl">From</div>
          <div class="bp-cell-val">${trip.originCity} (${trip.origin}) · ${trip.depTime}</div>
        </div>
        <div>
          <div class="bp-cell-lbl">To</div>
          <div class="bp-cell-val">${trip.destCity} (${trip.destination}) · ${trip.arrTime}</div>
        </div>
      </div>

      <div class="qr-code-placeholder">
        <span>||||| ||| ||||||| || ||||||</span>
        <span style="font-size: 11px; color: #555;">VALID BOARDING PASS</span>
      </div>
    </div>

    <button id="btnCloseTripModal" class="search-submit-btn" style="margin-top: 10px;">
      Close
    </button>
  `;

  document.getElementById('btnCloseTripModal').addEventListener('click', () => {
    modal.classList.remove('active');
  });

  modal.classList.add('active');
}

// Global functions for modal actions
window.setSortOption = function(option) {
  state.sortBy = option;
  applyFiltersAndSort();
  renderFlightCards();
  document.getElementById('sortModal').classList.remove('active');
};

// Filter modal event listeners
const priceSlider = document.getElementById('priceRangeSlider');
const priceSliderVal = document.getElementById('priceSliderVal');
if (priceSlider && priceSliderVal) {
  priceSlider.addEventListener('input', (e) => {
    priceSliderVal.textContent = `Up to €${e.target.value}`;
  });
}

const btnStopAll = document.getElementById('filterStopAll');
const btnStopDirect = document.getElementById('filterStopDirect');
if (btnStopAll && btnStopDirect) {
  btnStopAll.addEventListener('click', () => {
    state.filters.stops = 'all';
    btnStopAll.classList.add('active');
    btnStopDirect.classList.remove('active');
  });
  btnStopDirect.addEventListener('click', () => {
    state.filters.stops = 'direct';
    btnStopDirect.classList.add('active');
    btnStopAll.classList.remove('active');
  });
}

const btnApplyFilters = document.getElementById('btnApplyFilters');
if (btnApplyFilters && priceSlider) {
  btnApplyFilters.addEventListener('click', () => {
    state.filters.maxPrice = parseInt(priceSlider.value, 10);
    applyFiltersAndSort();
    renderFlightCards();
    document.getElementById('filterModal').classList.remove('active');
  });
}
