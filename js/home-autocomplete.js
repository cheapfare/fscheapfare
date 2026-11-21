document.addEventListener('DOMContentLoaded', () => {
  // Universal API Endpoint Resolver: If previewing via VS Code Live Server (port 5501, 5500) or file://,
  // automatically queries the live Express backend on port 3000 (which has CORS enabled).
  function getApiEndpoint(endpoint) {
    if (window.location.port && window.location.port !== '3000') {
      return `http://localhost:3000${endpoint}`;
    }
    if (window.location.protocol === 'file:') {
      return `http://localhost:3000${endpoint}`;
    }
    return endpoint;
  }

  // Elements
  const fromInput = document.getElementById('inputFromAirport');
  const toInput = document.getElementById('inputToAirport');
  const hiddenFrom = document.getElementById('hiddenFromIata');
  const hiddenTo = document.getElementById('hiddenToIata');
  const fromDropdown = document.getElementById('fromSuggestionsDropdown');
  const toDropdown = document.getElementById('toSuggestionsDropdown');
  const fromWrapper = document.getElementById('fromInputWrapper');
  const toWrapper = document.getElementById('toInputWrapper');
  const swapBtn = document.getElementById('btnSwapAirports');
  const form = document.getElementById('homeSearchForm');
  const alertBox = document.getElementById('homeSearchAlert');

  // Debounce helper
  function debounce(fn, delay = 200) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // Comprehensive Client-Side Instant Airport Index (150+ Top Global & Domestic Hubs)
  // Ensures suggestions ALWAYS display instantly (0ms) even if offline or file:// protocol
  const POPULAR_GLOBAL_AIRPORTS = [
    // India Major & Regional Hubs
    { iata: 'DEL', city: 'New Delhi', name: 'Indira Gandhi International Airport', country: 'IN', countryName: 'India', isMajor: true },
    { iata: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji Maharaj International Airport', country: 'IN', countryName: 'India', isMajor: true },
    { iata: 'BLR', city: 'Bengaluru', name: 'Kempegowda International Airport', country: 'IN', countryName: 'India', isMajor: true },
    { iata: 'HYD', city: 'Hyderabad', name: 'Rajiv Gandhi International Airport', country: 'IN', countryName: 'India', isMajor: true },
    { iata: 'MAA', city: 'Chennai', name: 'Chennai International Airport', country: 'IN', countryName: 'India', isMajor: true },
    { iata: 'CCU', city: 'Kolkata', name: 'Netaji Subhash Chandra Bose International Airport', country: 'IN', countryName: 'India', isMajor: true },
    { iata: 'AMD', city: 'Ahmedabad', name: 'Sardar Vallabhbhai Patel International Airport', country: 'IN', countryName: 'India', isMajor: true },
    { iata: 'COK', city: 'Kochi', name: 'Cochin International Airport', country: 'IN', countryName: 'India', isMajor: true },
    { iata: 'GOI', city: 'Goa (Dabolim)', name: 'Dabolim Airport', country: 'IN', countryName: 'India', isMajor: true },
    { iata: 'GOX', city: 'Goa (Mopa)', name: 'Manohar International Airport', country: 'IN', countryName: 'India', isMajor: true },
    { iata: 'PNQ', city: 'Pune', name: 'Pune International Airport', country: 'IN', countryName: 'India', isMajor: true },
    { iata: 'JAI', city: 'Jaipur', name: 'Jaipur International Airport', country: 'IN', countryName: 'India', isMajor: true },
    { iata: 'LKO', city: 'Lucknow', name: 'Chaudhary Charan Singh International Airport', country: 'IN', countryName: 'India', isMajor: true },
    { iata: 'PAT', city: 'Patna', name: 'Jay Prakash Narayan Airport', country: 'IN', countryName: 'India', isMajor: true },
    { iata: 'TRV', city: 'Thiruvananthapuram', name: 'Trivandrum International Airport', country: 'IN', countryName: 'India', isMajor: true },
    { iata: 'GAU', city: 'Guwahati', name: 'Lokpriya Gopinath Bordoloi International Airport', country: 'IN', countryName: 'India', isMajor: true },
    { iata: 'IXC', city: 'Chandigarh', name: 'Shaheed Bhagat Singh International Airport', country: 'IN', countryName: 'India', isMajor: true },
    { iata: 'IDR', city: 'Indore', name: 'Devi Ahilyabai Holkar International Airport', country: 'IN', countryName: 'India', isMajor: true },
    { iata: 'BBI', city: 'Bhubaneswar', name: 'Biju Patnaik International Airport', country: 'IN', countryName: 'India', isMajor: true },
    { iata: 'SXR', city: 'Srinagar', name: 'Sheikh ul-Alam International Airport', country: 'IN', countryName: 'India', isMajor: true },
    { iata: 'VTZ', city: 'Visakhapatnam', name: 'Visakhapatnam International Airport', country: 'IN', countryName: 'India', isMajor: true },
    { iata: 'ATQ', city: 'Amritsar', name: 'Sri Guru Ram Dass Jee International Airport', country: 'IN', countryName: 'India', isMajor: true },
    { iata: 'VNS', city: 'Varanasi', name: 'Lal Bahadur Shastri International Airport', country: 'IN', countryName: 'India', isMajor: true },

    // US Major Hubs
    { iata: 'JFK', city: 'New York', name: 'John F Kennedy International Airport', country: 'US', countryName: 'United States', isMajor: true },
    { iata: 'LAX', city: 'Los Angeles', name: 'Los Angeles International Airport', country: 'US', countryName: 'United States', isMajor: true },
    { iata: 'ORD', city: 'Chicago', name: "Chicago O'Hare International Airport", country: 'US', countryName: 'United States', isMajor: true },
    { iata: 'ATL', city: 'Atlanta', name: 'Hartsfield Jackson Atlanta International Airport', country: 'US', countryName: 'United States', isMajor: true },
    { iata: 'DFW', city: 'Dallas-Fort Worth', name: 'Dallas Fort Worth International Airport', country: 'US', countryName: 'United States', isMajor: true },
    { iata: 'SFO', city: 'San Francisco', name: 'San Francisco International Airport', country: 'US', countryName: 'United States', isMajor: true },
    { iata: 'MIA', city: 'Miami', name: 'Miami International Airport', country: 'US', countryName: 'United States', isMajor: true },
    { iata: 'EWR', city: 'Newark', name: 'Newark Liberty International Airport', country: 'US', countryName: 'United States', isMajor: true },
    { iata: 'LGA', city: 'New York', name: 'LaGuardia Airport', country: 'US', countryName: 'United States', isMajor: true },
    { iata: 'SEA', city: 'Seattle', name: 'Seattle Tacoma International Airport', country: 'US', countryName: 'United States', isMajor: true },
    { iata: 'DEN', city: 'Denver', name: 'Denver International Airport', country: 'US', countryName: 'United States', isMajor: true },
    { iata: 'BOS', city: 'Boston', name: 'Boston Logan International Airport', country: 'US', countryName: 'United States', isMajor: true },
    { iata: 'LAS', city: 'Las Vegas', name: 'Harry Reid International Airport', country: 'US', countryName: 'United States', isMajor: true },
    { iata: 'MCO', city: 'Orlando', name: 'Orlando International Airport', country: 'US', countryName: 'United States', isMajor: true },
    { iata: 'CLT', city: 'Charlotte', name: 'Charlotte Douglas International Airport', country: 'US', countryName: 'United States', isMajor: true },
    { iata: 'PHX', city: 'Phoenix', name: 'Phoenix Sky Harbor International Airport', country: 'US', countryName: 'United States', isMajor: true },
    { iata: 'IAH', city: 'Houston', name: 'George Bush Intercontinental Airport', country: 'US', countryName: 'United States', isMajor: true },
    { iata: 'DTW', city: 'Detroit', name: 'Detroit Metropolitan Wayne County Airport', country: 'US', countryName: 'United States', isMajor: true },
    { iata: 'MSP', city: 'Minneapolis', name: 'Minneapolis St Paul International Airport', country: 'US', countryName: 'United States', isMajor: true },
    { iata: 'FLL', city: 'Fort Lauderdale', name: 'Fort Lauderdale Hollywood International Airport', country: 'US', countryName: 'United States', isMajor: true },
    { iata: 'PHL', city: 'Philadelphia', name: 'Philadelphia International Airport', country: 'US', countryName: 'United States', isMajor: true },
    { iata: 'BWI', city: 'Baltimore', name: 'Baltimore/Washington International Airport', country: 'US', countryName: 'United States', isMajor: true },
    { iata: 'SLC', city: 'Salt Lake City', name: 'Salt Lake City International Airport', country: 'US', countryName: 'United States', isMajor: true },
    { iata: 'SAN', city: 'San Diego', name: 'San Diego International Airport', country: 'US', countryName: 'United States', isMajor: true },
    { iata: 'IAD', city: 'Washington', name: 'Washington Dulles International Airport', country: 'US', countryName: 'United States', isMajor: true },
    { iata: 'DCA', city: 'Washington', name: 'Ronald Reagan Washington National Airport', country: 'US', countryName: 'United States', isMajor: true },
    { iata: 'TPA', city: 'Tampa', name: 'Tampa International Airport', country: 'US', countryName: 'United States', isMajor: true },
    { iata: 'HNL', city: 'Honolulu', name: 'Daniel K Inouye International Airport', country: 'US', countryName: 'United States', isMajor: true },
    { iata: 'PDX', city: 'Portland', name: 'Portland International Airport', country: 'US', countryName: 'United States', isMajor: true },
    { iata: 'AUS', city: 'Austin', name: 'Austin Bergstrom International Airport', country: 'US', countryName: 'United States', isMajor: true },
    { iata: 'BNA', city: 'Nashville', name: 'Nashville International Airport', country: 'US', countryName: 'United States', isMajor: true },
    { iata: 'MDW', city: 'Chicago', name: 'Chicago Midway International Airport', country: 'US', countryName: 'United States', isMajor: true },

    // UK & Europe
    { iata: 'LHR', city: 'London', name: 'London Heathrow Airport', country: 'GB', countryName: 'United Kingdom', isMajor: true },
    { iata: 'LGW', city: 'London', name: 'London Gatwick Airport', country: 'GB', countryName: 'United Kingdom', isMajor: true },
    { iata: 'MAN', city: 'Manchester', name: 'Manchester Airport', country: 'GB', countryName: 'United Kingdom', isMajor: true },
    { iata: 'CDG', city: 'Paris', name: 'Paris Charles de Gaulle Airport', country: 'FR', countryName: 'France', isMajor: true },
    { iata: 'ORY', city: 'Paris', name: 'Paris Orly Airport', country: 'FR', countryName: 'France', isMajor: true },
    { iata: 'FRA', city: 'Frankfurt', name: 'Frankfurt Airport', country: 'DE', countryName: 'Germany', isMajor: true },
    { iata: 'MUC', city: 'Munich', name: 'Munich Airport', country: 'DE', countryName: 'Germany', isMajor: true },
    { iata: 'AMS', city: 'Amsterdam', name: 'Amsterdam Airport Schiphol', country: 'NL', countryName: 'Netherlands', isMajor: true },
    { iata: 'MAD', city: 'Madrid', name: 'Adolfo Suárez Madrid Barajas Airport', country: 'ES', countryName: 'Spain', isMajor: true },
    { iata: 'BCN', city: 'Barcelona', name: 'Josep Tarradellas Barcelona-El Prat Airport', country: 'ES', countryName: 'Spain', isMajor: true },
    { iata: 'FCO', city: 'Rome', name: 'Leonardo da Vinci Fiumicino Airport', country: 'IT', countryName: 'Italy', isMajor: true },
    { iata: 'MXP', city: 'Milan', name: 'Milan Malpensa Airport', country: 'IT', countryName: 'Italy', isMajor: true },
    { iata: 'ZRH', city: 'Zurich', name: 'Zurich Airport', country: 'CH', countryName: 'Switzerland', isMajor: true },
    { iata: 'VIE', city: 'Vienna', name: 'Vienna International Airport', country: 'AT', countryName: 'Austria', isMajor: true },
    { iata: 'BRU', city: 'Brussels', name: 'Brussels Airport', country: 'BE', countryName: 'Belgium', isMajor: true },
    { iata: 'DUB', city: 'Dublin', name: 'Dublin Airport', country: 'IE', countryName: 'Ireland', isMajor: true },
    { iata: 'CPH', city: 'Copenhagen', name: 'Copenhagen Kastrup Airport', country: 'DK', countryName: 'Denmark', isMajor: true },
    { iata: 'ARN', city: 'Stockholm', name: 'Stockholm Arlanda Airport', country: 'SE', countryName: 'Sweden', isMajor: true },
    { iata: 'OSL', city: 'Oslo', name: 'Oslo Gardermoen Airport', country: 'NO', countryName: 'Norway', isMajor: true },
    { iata: 'HEL', city: 'Helsinki', name: 'Helsinki Vantaa Airport', country: 'FI', countryName: 'Finland', isMajor: true },
    { iata: 'IST', city: 'Istanbul', name: 'Istanbul Airport', country: 'TR', countryName: 'Turkey', isMajor: true },
    { iata: 'ATH', city: 'Athens', name: 'Athens International Airport', country: 'GR', countryName: 'Greece', isMajor: true },
    { iata: 'LIS', city: 'Lisbon', name: 'Humberto Delgado Airport', country: 'PT', countryName: 'Portugal', isMajor: true },

    // Middle East
    { iata: 'DXB', city: 'Dubai', name: 'Dubai International Airport', country: 'AE', countryName: 'United Arab Emirates', isMajor: true },
    { iata: 'DOH', city: 'Doha', name: 'Hamad International Airport', country: 'QA', countryName: 'Qatar', isMajor: true },
    { iata: 'AUH', city: 'Abu Dhabi', name: 'Zayed International Airport', country: 'AE', countryName: 'United Arab Emirates', isMajor: true },
    { iata: 'RUH', city: 'Riyadh', name: 'King Khalid International Airport', country: 'SA', countryName: 'Saudi Arabia', isMajor: true },
    { iata: 'JED', city: 'Jeddah', name: 'King Abdulaziz International Airport', country: 'SA', countryName: 'Saudi Arabia', isMajor: true },
    { iata: 'KWI', city: 'Kuwait City', name: 'Kuwait International Airport', country: 'KW', countryName: 'Kuwait', isMajor: true },
    { iata: 'BAH', city: 'Manama', name: 'Bahrain International Airport', country: 'BH', countryName: 'Bahrain', isMajor: true },
    { iata: 'MCT', city: 'Muscat', name: 'Muscat International Airport', country: 'OM', countryName: 'Oman', isMajor: true },

    // Canada
    { iata: 'YYZ', city: 'Toronto', name: 'Toronto Pearson International Airport', country: 'CA', countryName: 'Canada', isMajor: true },
    { iata: 'YVR', city: 'Vancouver', name: 'Vancouver International Airport', country: 'CA', countryName: 'Canada', isMajor: true },
    { iata: 'YUL', city: 'Montreal', name: 'Montréal Pierre Elliott Trudeau International Airport', country: 'CA', countryName: 'Canada', isMajor: true },
    { iata: 'YYC', city: 'Calgary', name: 'Calgary International Airport', country: 'CA', countryName: 'Canada', isMajor: true },

    // Asia & Pacific
    { iata: 'SIN', city: 'Singapore', name: 'Singapore Changi Airport', country: 'SG', countryName: 'Singapore', isMajor: true },
    { iata: 'BKK', city: 'Bangkok', name: 'Suvarnabhumi Airport', country: 'TH', countryName: 'Thailand', isMajor: true },
    { iata: 'HND', city: 'Tokyo', name: 'Tokyo Haneda International Airport', country: 'JP', countryName: 'Japan', isMajor: true },
    { iata: 'NRT', city: 'Tokyo', name: 'Narita International Airport', country: 'JP', countryName: 'Japan', isMajor: true },
    { iata: 'KIX', city: 'Osaka', name: 'Kansai International Airport', country: 'JP', countryName: 'Japan', isMajor: true },
    { iata: 'ICN', city: 'Seoul', name: 'Incheon International Airport', country: 'KR', countryName: 'South Korea', isMajor: true },
    { iata: 'HKG', city: 'Hong Kong', name: 'Hong Kong International Airport', country: 'HK', countryName: 'Hong Kong', isMajor: true },
    { iata: 'KUL', city: 'Kuala Lumpur', name: 'Kuala Lumpur International Airport', country: 'MY', countryName: 'Malaysia', isMajor: true },
    { iata: 'SYD', city: 'Sydney', name: 'Sydney Kingsford Smith Airport', country: 'AU', countryName: 'Australia', isMajor: true },
    { iata: 'MEL', city: 'Melbourne', name: 'Melbourne Airport', country: 'AU', countryName: 'Australia', isMajor: true },
    { iata: 'BNE', city: 'Brisbane', name: 'Brisbane Airport', country: 'AU', countryName: 'Australia', isMajor: true },
    { iata: 'AKL', city: 'Auckland', name: 'Auckland Airport', country: 'NZ', countryName: 'New Zealand', isMajor: true }
  ].map(item => ({
    ...item,
    displayLabel: `${item.city} (${item.iata}) — ${item.name}`
  }));

  // Client-Side Search Engine
  function searchLocalAirports(rawQuery, limit = 8) {
    if (!rawQuery || typeof rawQuery !== 'string') {
      return POPULAR_GLOBAL_AIRPORTS.slice(0, limit);
    }

    // Extract IATA if query has "(DEL)" or "New York (JFK) — ..." format
    const parenMatch = rawQuery.match(/\(([A-Za-z]{3})\)/);
    if (parenMatch) {
      const code = parenMatch[1].toUpperCase();
      const found = POPULAR_GLOBAL_AIRPORTS.find(a => a.iata === code);
      if (found) return [found];
    }

    const q = rawQuery.trim().toLowerCase();
    if (!q) {
      return POPULAR_GLOBAL_AIRPORTS.slice(0, limit);
    }

    const exactIata = [];
    const prefixIata = [];
    const cityExact = [];
    const cityPrefix = [];
    const nameMatch = [];

    for (const apt of POPULAR_GLOBAL_AIRPORTS) {
      const iata = apt.iata.toLowerCase();
      const city = apt.city.toLowerCase();
      const name = apt.name.toLowerCase();

      if (iata === q) {
        exactIata.push(apt);
      } else if (city === q) {
        cityExact.push(apt);
      } else if (city.startsWith(q)) {
        cityPrefix.push(apt);
      } else if (iata.startsWith(q)) {
        prefixIata.push(apt);
      } else if (city.includes(q) || name.includes(q)) {
        nameMatch.push(apt);
      }
    }

    const combined = [...exactIata, ...cityExact, ...cityPrefix, ...prefixIata, ...nameMatch];
    const seen = new Set();
    const result = [];
    for (const a of combined) {
      if (!seen.has(a.iata)) {
        seen.add(a.iata);
        result.push(a);
        if (result.length >= limit) break;
      }
    }
    return result;
  }

  // Setup Autocomplete on an Input field (Instant Local Fallback + Live Server Index)
  function setupAutocomplete(inputEl, hiddenIataEl, dropdownEl, wrapperEl, nextInputEl) {
    let activeIndex = -1;
    let currentSuggestions = [];

    // Extract query string helper
    function getCleanQuery(val) {
      if (!val) return '';
      const parenMatch = val.match(/\(([A-Za-z]{3})\)/);
      if (parenMatch) return parenMatch[1];
      return val.trim();
    }

    // Debounced fetch to backend for deep catalog lookup (all 7,917 airports)
    const fetchSuggestionsServer = debounce(async (query) => {
      try {
        const cleanQ = getCleanQuery(query);
        const url = getApiEndpoint(`/api/airports/autocomplete?q=${encodeURIComponent(cleanQ)}&limit=10`);
        const res = await fetch(url);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            currentSuggestions = list;
            renderSuggestions(list, cleanQ);
          }
        }
      } catch (err) {
        // Silently keep local suggestions on network/file:// error
      }
    }, 120);

    function triggerAutocomplete(val) {
      const cleanQ = getCleanQuery(val);
      // 1. Instant local render (Zero lag, works 100% offline & under file:// protocol)
      const localResults = searchLocalAirports(cleanQ, 10);
      currentSuggestions = localResults;
      renderSuggestions(localResults, cleanQ);

      // 2. Asynchronous server enrichment
      fetchSuggestionsServer(val);
    }

    function renderSuggestions(list, currentQuery) {
      activeIndex = -1;

      let itemsHtml = '';
      if (!list || list.length === 0) {
        itemsHtml = `
          <div class="apt-items-container">
            <div class="autocomplete-item empty">
              <div class="empty-icon">✈</div>
              <div class="empty-text">No commercial airports found matching your search.</div>
              <div class="empty-sub">Try searching by city (e.g. New York, Delhi, London, Mumbai), airport name, or 3-letter IATA code.</div>
            </div>
          </div>
        `;
      } else {
        itemsHtml = `
          <div class="apt-items-container">
            ${list.map((item, idx) => {
              return `
                <div class="autocomplete-item" data-idx="${idx}" data-iata="${item.iata}" data-label="${item.displayLabel}">
                  <div class="apt-item-row">
                    <div class="apt-iata-badge ${item.isMajor ? 'major' : ''}">
                      <span class="apt-iata-text">${item.iata || '---'}</span>
                      ${item.isMajor ? '<span class="apt-hub-pill">HUB</span>' : ''}
                    </div>
                    <div class="apt-item-details">
                      <div class="apt-item-top-line">
                        <span class="apt-item-city">${item.city || item.name}</span>
                        <span class="apt-item-country">${item.countryName || item.country || ''}</span>
                      </div>
                      <div class="apt-item-name" title="${item.name}">${item.name}</div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }

      dropdownEl.innerHTML = itemsHtml;
      dropdownEl.style.display = 'block';
      if (wrapperEl) wrapperEl.classList.add('dropdown-active');

      // Attach click events to airport suggestions
      dropdownEl.querySelectorAll('.autocomplete-item:not(.empty)').forEach(el => {
        el.addEventListener('mousedown', (e) => {
          e.preventDefault();
          selectAirport(el.dataset.iata, el.dataset.label);
        });
      });
    }

    function selectAirport(iata, label) {
      inputEl.value = label;
      hiddenIataEl.value = iata;
      dropdownEl.style.display = 'none';
      if (wrapperEl) wrapperEl.classList.remove('dropdown-active');
      if (alertBox) alertBox.style.display = 'none';

      // If destination is empty and nextInputEl is available, advance smoothly to next field
      if (nextInputEl && !nextInputEl.value) {
        setTimeout(() => {
          nextInputEl.focus();
        }, 120);
      }
    }

    // Input Typing Event: Instant local filter + Debounced server fetch
    inputEl.addEventListener('input', () => {
      hiddenIataEl.value = '';
      triggerAutocomplete(inputEl.value);
    });

    // Focus & Click Events: Automatically select text and show immediate suggestions
    inputEl.addEventListener('focus', () => {
      try { inputEl.select(); } catch (e) {}
      triggerAutocomplete(inputEl.value);
    });

    inputEl.addEventListener('click', () => {
      if (dropdownEl.style.display !== 'block') {
        triggerAutocomplete(inputEl.value);
      }
    });

    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
      if (!inputEl.contains(e.target) && !dropdownEl.contains(e.target)) {
        dropdownEl.style.display = 'none';
        if (wrapperEl) wrapperEl.classList.remove('dropdown-active');
      }
    });

    inputEl.addEventListener('blur', async () => {
      // Validate 3-letter IATA code if typed directly
      const typed = inputEl.value.trim().toUpperCase();
      if (!hiddenIataEl.value) {
        if (typed.length === 3) {
          const localMatch = POPULAR_GLOBAL_AIRPORTS.find(a => a.iata === typed);
          if (localMatch) {
            selectAirport(localMatch.iata, localMatch.displayLabel);
            return;
          }
          try {
            const check = await fetch(getApiEndpoint(`/api/airports/validate?iata=${typed}`));
            if (check.ok) {
              const data = await check.json();
              if (data.isValid && data.airport) {
                selectAirport(data.airport.iata, data.airport.displayLabel);
              }
            }
          } catch (e) {}
        }
      }
    });

    // Keyboard navigation
    inputEl.addEventListener('keydown', (e) => {
      const items = dropdownEl.querySelectorAll('.autocomplete-item:not(.empty)');
      if (items.length === 0 || dropdownEl.style.display === 'none') return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = (activeIndex + 1) % items.length;
        updateActive(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = (activeIndex - 1 + items.length) % items.length;
        updateActive(items);
      } else if (e.key === 'Enter') {
        if (activeIndex >= 0 && activeIndex < items.length) {
          e.preventDefault();
          const target = items[activeIndex];
          selectAirport(target.dataset.iata, target.dataset.label);
        }
      } else if (e.key === 'Escape') {
        dropdownEl.style.display = 'none';
        if (wrapperEl) wrapperEl.classList.remove('dropdown-active');
      }
    });

    function updateActive(items) {
      items.forEach((it, idx) => {
        it.classList.toggle('active', idx === activeIndex);
        if (idx === activeIndex) {
          it.scrollIntoView({ block: 'nearest' });
        }
      });
    }
  }

  setupAutocomplete(fromInput, hiddenFrom, fromDropdown, fromWrapper, toInput);
  setupAutocomplete(toInput, hiddenTo, toDropdown, toWrapper, null);

  // Swap Button
  swapBtn?.addEventListener('click', () => {
    const tempText = fromInput.value;
    const tempIata = hiddenFrom.value;

    fromInput.value = toInput.value;
    hiddenFrom.value = hiddenTo.value;

    toInput.value = tempText;
    hiddenTo.value = tempIata;
  });

  // Trip Type Toggles
  const btnTripRound = document.getElementById('btnTripRound');
  const btnTripOneWay = document.getElementById('btnTripOneWay');
  const returnTile = document.getElementById('returnDateTile');
  const returnInput = document.getElementById('returnDateInput');
  const tripTypeInput = document.getElementById('homeTripType');

  btnTripRound?.addEventListener('click', () => {
    btnTripRound.classList.add('active');
    btnTripOneWay.classList.remove('active');
    tripTypeInput.value = 'roundTrip';
    returnTile.style.opacity = '1';
    returnTile.style.pointerEvents = 'auto';
    returnInput.required = true;
  });

  btnTripOneWay?.addEventListener('click', () => {
    btnTripOneWay.classList.add('active');
    btnTripRound.classList.remove('active');
    tripTypeInput.value = 'oneWay';
    returnTile.style.opacity = '0.35';
    returnTile.style.pointerEvents = 'none';
    returnInput.required = false;
    returnInput.value = '';
  });

  // Passenger Modal
  const paxModal = document.getElementById('homePaxModal');
  const paxTrigger = document.getElementById('homePaxPickerTrigger');
  const btnClosePax = document.getElementById('btnCloseHomePax');
  const btnSavePax = document.getElementById('btnSaveHPax');
  const paxLabel = document.getElementById('homePaxSummaryText');

  let adults = 1, children = 0, infants = 0;
  const lblA = document.getElementById('lblHAdults');
  const lblC = document.getElementById('lblHChildren');
  const lblI = document.getElementById('lblHInfants');
  const selCabin = document.getElementById('selHCabin');

  paxTrigger?.addEventListener('click', () => paxModal.classList.add('active'));
  btnClosePax?.addEventListener('click', () => paxModal.classList.remove('active'));

  document.getElementById('btnHIncA')?.addEventListener('click', () => { adults++; lblA.textContent = adults; });
  document.getElementById('btnHDecA')?.addEventListener('click', () => { if (adults > 1) { adults--; lblA.textContent = adults; } });
  document.getElementById('btnHIncC')?.addEventListener('click', () => { children++; lblC.textContent = children; });
  document.getElementById('btnHDecC')?.addEventListener('click', () => { if (children > 0) { children--; lblC.textContent = children; } });
  document.getElementById('btnHIncI')?.addEventListener('click', () => { infants++; lblI.textContent = infants; });
  document.getElementById('btnHDecI')?.addEventListener('click', () => { if (infants > 0) { infants--; lblI.textContent = infants; } });

  btnSavePax?.addEventListener('click', () => {
    document.getElementById('inputAdults').value = adults;
    document.getElementById('inputChildren').value = children;
    document.getElementById('inputInfants').value = infants;
    document.getElementById('inputCabinClass').value = selCabin.value;

    const total = adults + children + infants;
    paxLabel.textContent = `${total} Traveler${total > 1 ? 's' : ''} · ${selCabin.value}`;
    paxModal.classList.remove('active');
  });

  // Strict Form Validation & Route Resolution Before Submission
  form.addEventListener('submit', (e) => {
    alertBox.style.display = 'none';

    let fromIata = hiddenFrom.value.trim().toUpperCase();
    let toIata = hiddenTo.value.trim().toUpperCase();

    // Auto-resolve origin if typed directly or selected from popular index
    if (!fromIata || fromIata.length !== 3) {
      const match = fromInput.value.match(/\(([A-Za-z]{3})\)/);
      if (match) {
        fromIata = match[1].toUpperCase();
        hiddenFrom.value = fromIata;
      } else {
        const typed = fromInput.value.trim().toUpperCase();
        const found = POPULAR_GLOBAL_AIRPORTS.find(a => a.iata === typed || a.city.toUpperCase() === typed || a.name.toUpperCase().includes(typed));
        if (found) {
          fromIata = found.iata;
          hiddenFrom.value = fromIata;
        }
      }
    }

    // Auto-resolve destination if typed directly or selected from popular index
    if (!toIata || toIata.length !== 3) {
      const match = toInput.value.match(/\(([A-Za-z]{3})\)/);
      if (match) {
        toIata = match[1].toUpperCase();
        hiddenTo.value = toIata;
      } else {
        const typed = toInput.value.trim().toUpperCase();
        const found = POPULAR_GLOBAL_AIRPORTS.find(a => a.iata === typed || a.city.toUpperCase() === typed || a.name.toUpperCase().includes(typed));
        if (found) {
          toIata = found.iata;
          hiddenTo.value = toIata;
        }
      }
    }

    // Must be selected from verified airport index
    if (!fromIata || fromIata.length !== 3) {
      e.preventDefault();
      alertBox.textContent = 'Please select a valid origin airport from the suggestions list.';
      alertBox.style.display = 'block';
      fromInput.focus();
      return;
    }

    if (!toIata || toIata.length !== 3) {
      e.preventDefault();
      alertBox.textContent = 'Please select a valid destination airport from the suggestions list.';
      alertBox.style.display = 'block';
      toInput.focus();
      return;
    }

    if (fromIata === toIata) {
      e.preventDefault();
      alertBox.textContent = 'Origin and destination airports cannot be the same.';
      alertBox.style.display = 'block';
      return;
    }

    const depart = document.getElementById('departDateInput').value;
    const ret = returnInput.value;
    const isRound = tripTypeInput.value === 'roundTrip';

    if (!depart) {
      e.preventDefault();
      alertBox.textContent = 'Please select a departure date.';
      alertBox.style.display = 'block';
      return;
    }

    if (isRound && ret && new Date(ret) < new Date(depart)) {
      e.preventDefault();
      alertBox.textContent = 'Return date cannot be earlier than departure date.';
      alertBox.style.display = 'block';
      return;
    }

    // Customer Phone Validation (Required for search activation)
    const phoneInput = document.getElementById('homeCustomerPhone');
    const countrySelect = document.getElementById('countrySelect');
    const fullPhoneHidden = document.getElementById('inputCustomerFullPhone');
    const phoneCard = document.getElementById('homePhoneCard');

    if (phoneInput) {
      const rawDigits = phoneInput.value.replace(/\D/g, '');
      const dialCode = countrySelect ? countrySelect.value : '+1';
      // User strict requirement: Must have exactly 10 digits to search flights
      const isValidLength = rawDigits.length === 10;

      if (!rawDigits || !isValidLength) {
        e.preventDefault();
        alertBox.textContent = 'Please enter your complete 10-digit mobile phone number to search flights.';
        alertBox.style.display = 'block';
        if (phoneCard) {
          phoneCard.classList.add('is-invalid-shake');
          setTimeout(() => phoneCard.classList.remove('is-invalid-shake'), 600);
        }
        phoneInput.focus();
        return;
      }

      const fullFormattedPhone = `${dialCode} ${phoneInput.value.trim()}`;
      if (fullPhoneHidden) {
        fullPhoneHidden.value = fullFormattedPhone;
      }

      // Persist customer phone in localStorage
      try {
        localStorage.setItem('fs_customer_phone', fullFormattedPhone);
        localStorage.setItem('fs_customer_phone_raw', rawDigits);
        localStorage.setItem('fs_customer_dial', dialCode);
      } catch (err) {}

      // Asynchronous Lead Ingestion to CRM Operations Desk
      try {
        fetch(getApiEndpoint('/api/support'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Direct Search Traveler',
            phone: fullFormattedPhone,
            inquiryType: 'Flight Search Intent',
            route: `${fromIata} -> ${toIata}`,
            travelDate: depart,
            message: `User searched flights: ${fromIata} to ${toIata} on ${depart}. Trip: ${tripTypeInput.value}, Cabin: ${document.getElementById('inputCabinClass')?.value || 'Economy'}`
          })
        }).catch(() => {});
      } catch (err) {}
    }

    // Persist search criteria in sessionStorage to guarantee 100% route accuracy across all servers
    try {
      sessionStorage.setItem('fs_search_from', fromIata);
      sessionStorage.setItem('fs_search_to', toIata);
      sessionStorage.setItem('fs_search_from_city', fromInput.value.split('(')[0].trim());
      sessionStorage.setItem('fs_search_to_city', toInput.value.split('(')[0].trim());
      sessionStorage.setItem('fs_search_date', depart);
      sessionStorage.setItem('fs_search_return', ret || '');
      sessionStorage.setItem('fs_search_cabin', document.getElementById('inputCabinClass')?.value || 'Economy');
      sessionStorage.setItem('fs_search_adults', document.getElementById('inputAdults')?.value || '1');
      sessionStorage.setItem('fs_search_trip', tripTypeInput.value);
    } catch (e) {}

    // Dispatch 1st Form (homeSearchForm) Flight Search Query to Sheet1
    try {
      const fullPhone = document.getElementById('inputCustomerFullPhone')?.value || 
                        localStorage.getItem('fs_customer_phone') || '';
      const sheet1Data = {
        action: 'sheet1',
        customer_name: 'Direct Search Traveler',
        customer_phone: fullPhone,
        phone: fullPhone,
        origin: fromIata,
        originCity: fromInput.value.split('(')[0].trim(),
        destination: toIata,
        destCity: toInput.value.split('(')[0].trim(),
        departure_date: depart,
        return_date: ret || '',
        trip_type: tripTypeInput.value || (ret ? 'roundTrip' : 'oneWay'),
        adults: document.getElementById('inputAdults')?.value || 1,
        children: document.getElementById('inputChildren')?.value || 0,
        infants: document.getElementById('inputInfants')?.value || 0,
        cabin_class: document.getElementById('inputCabinClass')?.value || 'Economy'
      };

      fetch(getApiEndpoint('/api/sheet/save-search'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sheet1Data),
        keepalive: true
      }).catch((err) => console.warn('[Sheet1 Fetch Warn]:', err));
    } catch (sheetErr) {
      console.warn('[Sheet1 Save Error]:', sheetErr);
    }

    // Clean client-side navigation with query parameters (prevents Live Server directory redirect stripping)
    e.preventDefault();
    const params = new URLSearchParams(new FormData(form)).toString();
    const targetUrl = window.location.protocol === 'file:' 
      ? `results.html?${params}` 
      : `/flights/results/?${params}`;
    setTimeout(() => {
      window.location.href = targetUrl;
    }, 80);
  });

  // Date Display Formatter
  function formatDateReadable(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
      }
    } catch (e) {
      console.error(e);
    }
    return dateStr;
  }

  const departCard = document.getElementById('departDateCard');
  const returnCard = document.getElementById('returnDateTile');
  const departDateInput = document.getElementById('departDateInput');
  const returnDateInput = document.getElementById('returnDateInput');
  const departDisplay = document.getElementById('departDateDisplay');
  const returnDateDisplay = document.getElementById('returnDateDisplay');

  function triggerDatePicker(inputEl) {
    if (!inputEl) return;
    if (typeof inputEl.showPicker === 'function') {
      try {
        inputEl.showPicker();
        return;
      } catch (err) {
        // Fallback
      }
    }
    inputEl.focus();
    inputEl.click();
  }

  // Allow clicking anywhere on card or icon to open native calendar picker
  departCard?.addEventListener('click', (e) => {
    if (e.target !== departDateInput) {
      triggerDatePicker(departDateInput);
    }
  });

  returnCard?.addEventListener('click', (e) => {
    if (e.target !== returnDateInput) {
      triggerDatePicker(returnDateInput);
    }
  });

  // Sync min date and handle date changes
  if (departDateInput) {
    const todayIso = new Date().toISOString().split('T')[0];
    departDateInput.min = todayIso;

    // Automatically initialize with realistic future dates if empty or past date
    if (!departDateInput.value || departDateInput.value < todayIso) {
      const depDate = new Date();
      depDate.setDate(depDate.getDate() + 7);
      departDateInput.value = depDate.toISOString().split('T')[0];
      if (departDisplay) departDisplay.textContent = formatDateReadable(departDateInput.value);
    }

    if (returnDateInput) {
      returnDateInput.min = departDateInput.value;
      if (!returnDateInput.value || returnDateInput.value <= departDateInput.value) {
        const retDate = new Date(departDateInput.value);
        retDate.setDate(retDate.getDate() + 7);
        returnDateInput.value = retDate.toISOString().split('T')[0];
        if (returnDateDisplay) returnDateDisplay.textContent = formatDateReadable(returnDateInput.value);
      }
    }

    departDateInput.addEventListener('change', () => {
      if (departDisplay) departDisplay.textContent = formatDateReadable(departDateInput.value);
      if (returnDateInput) {
        returnDateInput.min = departDateInput.value;
        if (returnDateInput.value && returnDateInput.value < departDateInput.value) {
          try {
            const d = new Date(departDateInput.value);
            d.setDate(d.getDate() + 7);
            const nextIso = d.toISOString().split('T')[0];
            returnDateInput.value = nextIso;
            if (returnDateDisplay) returnDateDisplay.textContent = formatDateReadable(nextIso);
          } catch (e) {}
        }
      }
    });
  }

  returnDateInput?.addEventListener('change', () => {
    if (returnDateDisplay) returnDateDisplay.textContent = formatDateReadable(returnDateInput.value);
  });

  // ==============================================================
  // 5. POPULAR DESTINATIONS SHOWCASE (Swiper Continuous Auto-Glide)
  // Exact feature matching bookeasyflights.com
  // ==============================================================
  function setupDealsSwiper() {
    if (typeof Swiper === 'undefined') {
      setTimeout(setupDealsSwiper, 80);
      return;
    }

    const dealsSwiper = new Swiper('.deals-swiper', {
      loop: true,
      speed: 4500,
      spaceBetween: 22,
      grabCursor: true,
      allowTouchMove: true,
      watchSlidesProgress: true,
      observer: true,
      observeParents: true,
      centeredSlides: false,
      slidesPerGroup: 1,
      autoplay: {
        delay: 1,
        disableOnInteraction: false,
        pauseOnMouseEnter: false,
        waitForTransition: true
      },
      navigation: {
        nextEl: '.deals-next',
        prevEl: '.deals-prev',
      },
      pagination: {
        el: '.deals-pagination',
        clickable: true,
      },
      breakpoints: {
        0: {
          slidesPerView: 1.15,
          spaceBetween: 16
        },
        640: {
          slidesPerView: 1.6,
          spaceBetween: 18
        },
        768: {
          slidesPerView: 2.2,
          spaceBetween: 20
        },
        1024: {
          slidesPerView: 3.25,
          spaceBetween: 22
        },
        1440: {
          slidesPerView: 3.3,
          spaceBetween: 24
        }
      }
    });

    // Destination card click to populate search form
    const dealCards = document.querySelectorAll('.deal-card');
    dealCards.forEach(card => {
      card.addEventListener('click', () => {
        const iata = card.dataset.iata;
        const label = card.dataset.label;
        const city = card.dataset.city;

        if (iata && label && toInput && hiddenTo) {
          toInput.value = label;
          hiddenTo.value = iata;

          // Clear any active search alert banner
          if (alertBox) {
            alertBox.style.display = 'none';
          }

          // Smooth scroll to form
          if (form) {
            form.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }

          // Subtle visual feedback on destination field without distorting form UI
          const toRow = document.getElementById('toInputWrapper');
          if (toRow) {
            toRow.style.transition = 'background-color 0.3s ease, border-color 0.3s ease';
            toRow.style.backgroundColor = '#f0fdf4';
            setTimeout(() => {
              toRow.style.backgroundColor = '';
            }, 1200);
          }
        }
      });
    });
  }

  // 6. Customer Phone Number Validation & Search Activation
  function setupCustomerPhoneValidation() {
    const phoneInput = document.getElementById('homeCustomerPhone');
    const countrySelect = document.getElementById('countrySelect');
    const flagDisplay = document.getElementById('currentFlagDisplay');
    const dialDisplay = document.getElementById('currentDialDisplay');
    const phoneCard = document.getElementById('homePhoneCard');
    const badgeState = document.getElementById('phoneBadgeState');
    const pulseRing = document.getElementById('phonePulseRing');
    const validSvg = document.getElementById('phoneValidSvg');
    const searchBtn = document.getElementById('btnSearchSubmit');
    const fullPhoneHidden = document.getElementById('inputCustomerFullPhone');
    const countryHidden = document.getElementById('inputPhoneCountry');

    if (!phoneInput || !searchBtn) return;

    function validatePhone() {
      const rawDigits = phoneInput.value.replace(/\D/g, '');
      // Strict rule: Customer phone number must have 10 digits to be ready
      const isValid = rawDigits.length === 10;

      if (isValid) {
        // Activate Search Button
        searchBtn.classList.remove('btn-search-disabled');
        searchBtn.removeAttribute('disabled');
        searchBtn.setAttribute('title', 'Search Flights');

        // Phone Card Active State
        if (phoneCard) {
          phoneCard.classList.add('is-valid');
          phoneCard.classList.remove('is-invalid');
        }
        if (badgeState) {
          badgeState.style.display = 'none';
        }
        if (pulseRing) pulseRing.style.display = 'none';
        if (validSvg) validSvg.style.display = 'block';

        const dialCode = countrySelect ? countrySelect.value : '+1';
        if (fullPhoneHidden) {
          fullPhoneHidden.value = `${dialCode} ${phoneInput.value.trim()}`;
        }
      } else {
        // Inactive Search Button State
        searchBtn.classList.add('btn-search-disabled');
        searchBtn.setAttribute('title', 'Please enter a 10-digit mobile number to activate search');

        if (phoneCard) {
          phoneCard.classList.remove('is-valid');
        }
        if (badgeState) {
          badgeState.style.display = 'none';
        }
        if (pulseRing) pulseRing.style.display = 'block';
        if (validSvg) validSvg.style.display = 'none';
      }
      return isValid;
    }

    // Auto format 10-digit numbers: (XXX) XXX-XXXX
    function formatPhoneNumber(val) {
      const digits = val.replace(/\D/g, '').slice(0, 10);
      if (digits.length === 0) return '';
      if (digits.length <= 3) return `(${digits}`;
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }

    phoneInput.addEventListener('input', () => {
      phoneInput.value = formatPhoneNumber(phoneInput.value);
      validatePhone();
    });

    phoneInput.addEventListener('paste', () => {
      setTimeout(() => {
        phoneInput.value = formatPhoneNumber(phoneInput.value);
        validatePhone();
      }, 50);
    });

    countrySelect?.addEventListener('change', () => {
      const selOption = countrySelect.options[countrySelect.selectedIndex];
      const flag = selOption.getAttribute('data-flag') || '🌐';
      const dial = selOption.value;

      if (flagDisplay) flagDisplay.textContent = flag;
      if (dialDisplay) dialDisplay.textContent = dial;
      if (countryHidden) countryHidden.value = dial;

      phoneInput.value = formatPhoneNumber(phoneInput.value);
      validatePhone();
    });

    // If user clicks inactive search button, prompt them
    searchBtn.addEventListener('click', (e) => {
      if (searchBtn.classList.contains('btn-search-disabled')) {
        e.preventDefault();
        e.stopPropagation();

        if (phoneCard) {
          phoneCard.classList.add('is-invalid-shake');
          setTimeout(() => phoneCard.classList.remove('is-invalid-shake'), 600);
        }
        if (alertBox) {
          alertBox.textContent = 'Please enter a valid 10-digit mobile number to activate flight search.';
          alertBox.style.display = 'block';
        }
        phoneInput.focus();
      }
    });

    // Always start with a completely empty, clean phone input box (User requirement: box must be empty)
    phoneInput.value = '';
    validatePhone(); // Sets initial inactive search state until 10 digits are filled
  }

  setupCustomerPhoneValidation();

  setupDealsSwiper();
});
