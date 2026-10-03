document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const fromInput = document.getElementById('inputFromAirport');
  const toInput = document.getElementById('inputToAirport');
  const hiddenFrom = document.getElementById('hiddenFromIata');
  const hiddenTo = document.getElementById('hiddenToIata');
  const fromDropdown = document.getElementById('fromSuggestionsDropdown');
  const toDropdown = document.getElementById('toSuggestionsDropdown');
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

  // Setup Autocomplete on an Input field (Pure Airport & City search)
  function setupAutocomplete(inputEl, hiddenIataEl, dropdownEl) {
    let activeIndex = -1;
    let currentSuggestions = [];

    const fetchSuggestions = debounce(async (query) => {
      try {
        const url = `/api/airports/autocomplete?q=${encodeURIComponent(query || '')}&limit=10`;
        const res = await fetch(url);
        const list = await res.json();
        currentSuggestions = list;
        renderSuggestions(list, query);
      } catch (err) {
        console.error('Airport autocomplete fetch error:', err);
      }
    }, 180);

    function renderSuggestions(list, currentQuery) {
      activeIndex = -1;

      let itemsHtml = '';
      if (!list || list.length === 0) {
        itemsHtml = `
          <div class="apt-items-container">
            <div class="autocomplete-item empty">
              <div class="empty-icon">✈</div>
              <div class="empty-text">No commercial airports found matching your search.</div>
              <div class="empty-sub">Try searching by city (e.g. New York, Delhi, London), airport name, or 3-letter IATA code.</div>
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
      if (alertBox) alertBox.style.display = 'none';
    }

    inputEl.addEventListener('input', () => {
      hiddenIataEl.value = '';
      fetchSuggestions(inputEl.value);
    });

    inputEl.addEventListener('focus', () => {
      fetchSuggestions(inputEl.value);
    });

    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
      if (!inputEl.contains(e.target) && !dropdownEl.contains(e.target)) {
        dropdownEl.style.display = 'none';
      }
    });

    inputEl.addEventListener('blur', async () => {
      // Validate 3-letter IATA code if typed directly
      const typed = inputEl.value.trim().toUpperCase();
      if (!hiddenIataEl.value && typed.length === 3) {
        try {
          const check = await fetch(`/api/airports/validate?iata=${typed}`);
          const data = await check.json();
          if (data.isValid && data.airport) {
            selectAirport(data.airport.iata, data.airport.displayLabel);
          }
        } catch (e) {
          console.error(e);
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

  setupAutocomplete(fromInput, hiddenFrom, fromDropdown);
  setupAutocomplete(toInput, hiddenTo, toDropdown);

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

  // Strict Form Validation Before Submission
  form.addEventListener('submit', (e) => {
    alertBox.style.display = 'none';

    const fromIata = hiddenFrom.value.trim().toUpperCase();
    const toIata = hiddenTo.value.trim().toUpperCase();
    const depart = document.getElementById('departDateInput').value;
    const ret = returnInput.value;
    const isRound = tripTypeInput.value === 'roundTrip';

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
    if (returnDateInput && departDateInput.value) {
      returnDateInput.min = departDateInput.value;
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

  setupDealsSwiper();
});

