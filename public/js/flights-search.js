document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Trip Type Switcher
  const btnRound = document.getElementById('btnSearchRound');
  const btnOneWay = document.getElementById('btnSearchOneWay');
  const returnTile = document.getElementById('searchReturnTile');
  const tripTypeInput = document.getElementById('searchTripType');
  const returnDateInput = document.getElementById('searchReturnDate');

  if (btnRound && btnOneWay) {
    btnRound.addEventListener('click', () => {
      btnRound.classList.add('active');
      btnOneWay.classList.remove('active');
      tripTypeInput.value = 'roundTrip';
      returnTile.style.opacity = '1';
      returnTile.style.pointerEvents = 'auto';
      returnDateInput.required = true;
    });

    btnOneWay.addEventListener('click', () => {
      btnOneWay.classList.add('active');
      btnRound.classList.remove('active');
      tripTypeInput.value = 'oneWay';
      returnTile.style.opacity = '0.35';
      returnTile.style.pointerEvents = 'none';
      returnDateInput.required = false;
      returnDateInput.value = '';
    });
  }

  // Swap Route
  document.getElementById('btnSearchSwap')?.addEventListener('click', () => {
    const origCity = document.getElementById('searchTxtOriginCity');
    const origCode = document.getElementById('searchTxtOriginCode');
    const fromInput = document.getElementById('searchFromCode');

    const destCity = document.getElementById('searchTxtDestCity');
    const destCode = document.getElementById('searchTxtDestCode');
    const toInput = document.getElementById('searchToCode');

    const tCity = origCity.textContent;
    const tCode = origCode.textContent;
    const tVal = fromInput.value;

    origCity.textContent = destCity.textContent;
    origCode.textContent = destCode.textContent;
    fromInput.value = toInput.value;

    destCity.textContent = tCity;
    destCode.textContent = tCode;
    toInput.value = tVal;
  });

  // Airport Autocomplete Modal
  let activeField = 'origin';
  const airportModal = document.getElementById('airportSearchModal');
  const airportTitle = document.getElementById('searchAirportModalTitle');
  const airportInput = document.getElementById('inputFilterAirports');
  const airportsGrid = document.getElementById('searchAirportsGrid');
  const btnCloseAirport = document.getElementById('btnCloseSearchAirport');

  const openAirportModal = (type) => {
    activeField = type;
    airportTitle.textContent = type === 'origin' ? 'Select Origin Airport' : 'Select Destination Airport';
    airportModal.classList.add('active');
    airportInput.value = '';
    fetchAirports('');
    setTimeout(() => airportInput.focus(), 100);
  };

  document.getElementById('searchOriginTrigger')?.addEventListener('click', () => openAirportModal('origin'));
  document.getElementById('searchDestTrigger')?.addEventListener('click', () => openAirportModal('dest'));
  btnCloseAirport?.addEventListener('click', () => airportModal.classList.remove('active'));

  airportInput?.addEventListener('input', (e) => fetchAirports(e.target.value));

  async function fetchAirports(q) {
    try {
      const res = await fetch(`/api/airports?q=${encodeURIComponent(q)}`);
      const list = await res.json();
      airportsGrid.innerHTML = list.map(apt => `
        <button type="button" class="airport-item-btn" data-code="${apt.code}" data-city="${apt.city}">
          <div>
            <div style="font-weight: 800; font-size: 15px; color: #111;">${apt.city} (${apt.code})</div>
            <div style="font-size: 12px; color: #64748b;">${apt.name}, ${apt.country}</div>
          </div>
          <span class="airport-code-badge">${apt.code}</span>
        </button>
      `).join('');

      airportsGrid.querySelectorAll('.airport-item-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const code = btn.dataset.code;
          const city = btn.dataset.city;

          if (activeField === 'origin') {
            document.getElementById('searchTxtOriginCity').textContent = city;
            document.getElementById('searchTxtOriginCode').textContent = code;
            document.getElementById('searchFromCode').value = code;
          } else {
            document.getElementById('searchTxtDestCity').textContent = city;
            document.getElementById('searchTxtDestCode').textContent = code;
            document.getElementById('searchToCode').value = code;
          }
          airportModal.classList.remove('active');
        });
      });
    } catch (e) {
      console.error(e);
    }
  }

  // Passenger Modal
  const paxModal = document.getElementById('paxSearchModal');
  const btnClosePax = document.getElementById('btnCloseSearchPax');
  const btnSavePax = document.getElementById('btnSavePaxSearch');
  const paxLabel = document.getElementById('searchPaxLabel');

  let adults = 1, children = 0, infants = 0;
  const lblAdults = document.getElementById('lblAdults');
  const lblChildren = document.getElementById('lblChildren');
  const lblInfants = document.getElementById('lblInfants');
  const selCabin = document.getElementById('selectCabinOption');

  document.getElementById('searchPaxTrigger')?.addEventListener('click', () => paxModal.classList.add('active'));
  btnClosePax?.addEventListener('click', () => paxModal.classList.remove('active'));

  document.getElementById('btnIncA')?.addEventListener('click', () => { adults++; lblAdults.textContent = adults; });
  document.getElementById('btnDecA')?.addEventListener('click', () => { if (adults > 1) { adults--; lblAdults.textContent = adults; } });
  document.getElementById('btnIncC')?.addEventListener('click', () => { children++; lblChildren.textContent = children; });
  document.getElementById('btnDecC')?.addEventListener('click', () => { if (children > 0) { children--; lblChildren.textContent = children; } });
  document.getElementById('btnIncI')?.addEventListener('click', () => { infants++; lblInfants.textContent = infants; });
  document.getElementById('btnDecI')?.addEventListener('click', () => { if (infants > 0) { infants--; lblInfants.textContent = infants; } });

  btnSavePax?.addEventListener('click', () => {
    document.getElementById('numAdults').value = adults;
    document.getElementById('numChildren').value = children;
    document.getElementById('numInfants').value = infants;
    document.getElementById('cabinClass').value = selCabin.value;

    const total = adults + children + infants;
    paxLabel.textContent = `${total} Traveler${total > 1 ? 's' : ''} · ${selCabin.value}`;
    paxModal.classList.remove('active');
  });

  // Currency select
  const currSelect = document.getElementById('flightsCurrency');
  if (currSelect) {
    currSelect.addEventListener('change', (e) => {
      document.getElementById('searchCurrency').value = e.target.value;
      localStorage.setItem('fs_currency', e.target.value);
    });
  }

  // Form Validation
  const form = document.getElementById('mainFlightSearchForm');
  const errBox = document.getElementById('searchValidationError');

  form.addEventListener('submit', (e) => {
    errBox.style.display = 'none';
    const from = document.getElementById('searchFromCode').value.trim();
    const to = document.getElementById('searchToCode').value.trim();
    const depart = document.getElementById('searchDepartDate').value;
    const returnD = document.getElementById('searchReturnDate').value;
    const isRound = tripTypeInput.value === 'roundTrip';

    if (!from || !to) {
      e.preventDefault();
      errBox.textContent = 'Please choose both departure and destination airports.';
      errBox.style.display = 'block';
      return;
    }

    if (from.toUpperCase() === to.toUpperCase()) {
      e.preventDefault();
      errBox.textContent = 'Origin and destination airports cannot be identical.';
      errBox.style.display = 'block';
      return;
    }

    if (isRound && returnD && new Date(returnD) < new Date(depart)) {
      e.preventDefault();
      errBox.textContent = 'Return date cannot precede departure date.';
      errBox.style.display = 'block';
      return;
    }
  });
});
