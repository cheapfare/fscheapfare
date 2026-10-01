document.addEventListener('DOMContentLoaded', () => {
  // Trip Type Toggles
  const btnRound = document.getElementById('btnRoundTrip');
  const btnOneWay = document.getElementById('btnOneWay');
  const returnFieldTile = document.getElementById('returnFieldTile');
  const tripTypeInput = document.getElementById('tripTypeInput');

  if (btnRound && btnOneWay) {
    btnRound.addEventListener('click', (e) => {
      e.preventDefault();
      btnRound.classList.add('active');
      btnOneWay.classList.remove('active');
      tripTypeInput.value = 'roundTrip';
      returnFieldTile.style.opacity = '1';
      returnFieldTile.style.pointerEvents = 'auto';
    });

    btnOneWay.addEventListener('click', (e) => {
      e.preventDefault();
      btnOneWay.classList.add('active');
      btnRound.classList.remove('active');
      tripTypeInput.value = 'oneWay';
      returnFieldTile.style.opacity = '0.35';
      returnFieldTile.style.pointerEvents = 'none';
    });
  }

  // Swap Route Button
  const btnSwap = document.getElementById('btnSwapRoute');
  if (btnSwap) {
    btnSwap.addEventListener('click', (e) => {
      e.preventDefault();
      const txtOrigCity = document.getElementById('txtOriginCity');
      const txtOrigCode = document.getElementById('txtOriginCode');
      const inputOrig = document.getElementById('inputOrigin');

      const txtDestCity = document.getElementById('txtDestCity');
      const txtDestCode = document.getElementById('txtDestCode');
      const inputDest = document.getElementById('inputDest');

      const tempCity = txtOrigCity.textContent;
      const tempCode = txtOrigCode.textContent;
      const tempVal = inputOrig.value;

      txtOrigCity.textContent = txtDestCity.textContent;
      txtOrigCode.textContent = txtDestCode.textContent;
      inputOrig.value = inputDest.value;

      txtDestCity.textContent = tempCity;
      txtDestCode.textContent = tempCode;
      inputDest.value = tempVal;
    });
  }

  // Airport Selector Modal
  let activeAirportField = 'origin';
  const airportModal = document.getElementById('airportModal');
  const modalAirportTitle = document.getElementById('modalAirportTitle');
  const inputModalSearch = document.getElementById('inputModalSearch');
  const modalAirportList = document.getElementById('modalAirportList');
  const btnCloseAirportModal = document.getElementById('btnCloseAirportModal');

  const openAirportModal = (type) => {
    activeAirportField = type;
    modalAirportTitle.textContent = type === 'origin' ? 'Select Departure City' : 'Select Destination City';
    airportModal.classList.add('active');
    inputModalSearch.value = '';
    fetchAndRenderAirports('');
    setTimeout(() => inputModalSearch.focus(), 100);
  };

  document.getElementById('originTrigger')?.addEventListener('click', () => openAirportModal('origin'));
  document.getElementById('destTrigger')?.addEventListener('click', () => openAirportModal('dest'));
  btnCloseAirportModal?.addEventListener('click', () => airportModal.classList.remove('active'));

  airportModal?.addEventListener('click', (e) => {
    if (e.target === airportModal) airportModal.classList.remove('active');
  });

  inputModalSearch?.addEventListener('input', (e) => {
    fetchAndRenderAirports(e.target.value);
  });

  async function fetchAndRenderAirports(query) {
    try {
      const res = await fetch(`/api/airports?q=${encodeURIComponent(query)}`);
      const list = await res.json();
      modalAirportList.innerHTML = list.map(apt => `
        <button type="button" class="airport-item-btn" data-code="${apt.code}" data-city="${apt.city}">
          <div>
            <div style="font-weight: 800; font-size: 15px; color: #111;">${apt.city} (${apt.code})</div>
            <div style="font-size: 12px; color: #64748b;">${apt.name}, ${apt.country}</div>
          </div>
          <span class="airport-code-badge">${apt.code}</span>
        </button>
      `).join('');

      modalAirportList.querySelectorAll('.airport-item-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const code = btn.dataset.code;
          const city = btn.dataset.city;

          if (activeAirportField === 'origin') {
            document.getElementById('txtOriginCity').textContent = city;
            document.getElementById('txtOriginCode').textContent = code;
            document.getElementById('inputOrigin').value = code;
          } else {
            document.getElementById('txtDestCity').textContent = city;
            document.getElementById('txtDestCode').textContent = code;
            document.getElementById('inputDest').value = code;
          }
          airportModal.classList.remove('active');
        });
      });
    } catch (err) {
      console.error(err);
    }
  }

  // Passenger Modal
  const paxModal = document.getElementById('passengerModal');
  const paxTrigger = document.getElementById('paxTileTrigger');
  const btnClosePaxModal = document.getElementById('btnClosePaxModal');
  const btnApplyPax = document.getElementById('btnApplyPax');

  let adultsCount = 1;
  const valAdults = document.getElementById('valAdults');
  const selCabin = document.getElementById('selCabin');

  paxTrigger?.addEventListener('click', () => paxModal.classList.add('active'));
  btnClosePaxModal?.addEventListener('click', () => paxModal.classList.remove('active'));
  paxModal?.addEventListener('click', (e) => {
    if (e.target === paxModal) paxModal.classList.remove('active');
  });

  document.getElementById('incAdults')?.addEventListener('click', () => {
    adultsCount++;
    valAdults.textContent = adultsCount;
  });

  document.getElementById('decAdults')?.addEventListener('click', () => {
    if (adultsCount > 1) {
      adultsCount--;
      valAdults.textContent = adultsCount;
    }
  });

  btnApplyPax?.addEventListener('click', () => {
    const cabin = selCabin.value;
    document.getElementById('txtPaxSummary').textContent = `${adultsCount} Adult${adultsCount > 1 ? 's' : ''} · ${cabin}`;
    document.getElementById('inputPassengers').value = adultsCount;
    document.getElementById('inputCabin').value = cabin;
    paxModal.classList.remove('active');
  });

  // Currency Select
  document.getElementById('currencySelect')?.addEventListener('change', (e) => {
    localStorage.setItem('fs_currency', e.target.value);
  });

  // FAQ Accordion
  document.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-question')?.addEventListener('click', () => {
      item.classList.toggle('open');
      const ans = item.querySelector('.faq-answer');
      if (item.classList.contains('open')) {
        ans.style.display = 'block';
      } else {
        ans.style.display = 'none';
      }
    });
  });
});
