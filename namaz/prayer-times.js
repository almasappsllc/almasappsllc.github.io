(() => {
  const cities = [
    { name: 'Toronto, Canada', lat: 43.6532, lon: -79.3832, zone: 'America/Toronto' },
    { name: 'London, United Kingdom', lat: 51.5072, lon: -0.1276, zone: 'Europe/London' },
    { name: 'Dearborn, United States', lat: 42.3223, lon: -83.1763, zone: 'America/Detroit' },
    { name: 'Houston, United States', lat: 29.7604, lon: -95.3698, zone: 'America/Chicago' },
    { name: 'New York, United States', lat: 40.7128, lon: -74.0060, zone: 'America/New_York' },
    { name: 'Sydney, Australia', lat: -33.8688, lon: 151.2093, zone: 'Australia/Sydney' },
    { name: 'Dubai, UAE', lat: 25.2048, lon: 55.2708, zone: 'Asia/Dubai' },
    { name: 'Qom, Iran', lat: 34.6401, lon: 50.8764, zone: 'Asia/Tehran' },
    { name: 'Tehran, Iran', lat: 35.6892, lon: 51.3890, zone: 'Asia/Tehran' },
    { name: 'Karbala, Iraq', lat: 32.6160, lon: 44.0249, zone: 'Asia/Baghdad' },
    { name: 'Najaf, Iraq', lat: 32.0000, lon: 44.3200, zone: 'Asia/Baghdad' },
    { name: 'Karachi, Pakistan', lat: 24.8607, lon: 67.0011, zone: 'Asia/Karachi' },
    { name: 'Lahore, Pakistan', lat: 31.5204, lon: 74.3587, zone: 'Asia/Karachi' },
    { name: 'Montreal, Canada', lat: 45.5019, lon: -73.5674, zone: 'America/Toronto' },
    { name: 'Edmonton, Canada', lat: 53.5461, lon: -113.4938, zone: 'America/Edmonton' }
  ];
  const citySelect = document.getElementById('city');
  const monthInput = document.getElementById('month');
  const methodSelect = document.getElementById('method');
  const rows = document.getElementById('rows');
  const tableTitle = document.getElementById('table-title');
  const tableSubtitle = document.getElementById('table-subtitle');
  const tableNote = document.getElementById('table-note');
  const error = document.getElementById('error');
  const printButton = document.getElementById('print');
  const customZone = document.getElementById('custom-zone');
  let customCity = null;

  customZone.value = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  cities.forEach((city, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = city.name;
    citySelect.append(option);
  });
  citySelect.value = '0';

  const today = new Date();
  monthInput.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  function paramsFor(city, method, highLatitudeOverride = null) {
    let params;
    if (method === 'tehran') {
      params = adhan.CalculationMethod.Tehran();
    } else {
      params = adhan.CalculationMethod.Other();
      params.fajrAngle = 16.0;
      params.ishaAngle = 14.0;
      params.maghribAngle = 4.0;
    }
    params.madhab = adhan.Madhab.Shafi;
    // Matches the app's AUTO recommendation (not absolute latitude).
    params.highLatitudeRule = highLatitudeOverride || (city.lat > 48
      ? adhan.HighLatitudeRule.SeventhOfTheNight
      : adhan.HighLatitudeRule.MiddleOfTheNight);
    // The app reports an unresolved location/date instead of borrowing times from
    // another latitude. Keep the web table all-or-nothing for polar-circle dates too.
    params.polarCircleResolution = adhan.PolarCircleResolution.Unresolved;
    return params;
  }


  function timeAtZone(date, zone) {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hour: 'numeric',
      minute: '2-digit',
      hourCycle: 'h12'
    }).format(date);
  }

  function dayLabel(year, month, day) {
    const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' })
      .format(new Date(Date.UTC(year, month - 1, day, 12)));
    return `${weekday}, ${day}`;
  }

  function tableRow(label, values, unavailable = false) {
    const labels = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Sunset', 'Maghrib', 'Isha', 'Shari’i midnight'];
    const tr = document.createElement('tr');
    const dateCell = document.createElement('th');
    dateCell.scope = 'row';
    dateCell.textContent = label;
    tr.append(dateCell);
    values.forEach((value, index) => {
      const td = document.createElement('td');
      td.dataset.label = labels[index];
      td.textContent = value;
      if (unavailable) td.className = 'unavailable';
      tr.append(td);
    });
    return tr;
  }

  function makeTimetable(city, year, month, method) {
    error.textContent = '';
    if (!window.adhan) {
      throw new Error('The calculation library did not load. Refresh the page and try again.');
    }
    const params = paramsFor(city, method);
    const maghribParams = paramsFor(city, method, adhan.HighLatitudeRule.MiddleOfTheNight);
    const daysInMonth = new Date(year, month, 0).getDate();
    const coords = new adhan.Coordinates(city.lat, city.lon);
    const results = [];
    for (let day = 1; day <= daysInMonth; day += 1) {
      const todayTimes = new adhan.PrayerTimes(coords, new Date(year, month - 1, day, 12), params);
      const nextDate = new Date(year, month - 1, day + 1, 12);
      const nextTimes = new adhan.PrayerTimes(coords, nextDate, params);
      const maghribTimes = new adhan.PrayerTimes(coords, new Date(year, month - 1, day, 12), maghribParams);
      if (!todayTimes.isValid || !nextTimes.isValid) {
        results.push({ day, error: true });
        continue;
      }
      const sunset = todayTimes.sunset;
      const candidateMaghrib = maghribTimes.maghrib;
      const angleAvailable = maghribTimes.isValid && candidateMaghrib instanceof Date &&
        Number.isFinite(candidateMaghrib.getTime()) && candidateMaghrib.getTime() > sunset.getTime();
      // The app computes Maghrib even when its automatic Isha estimate comes earlier.
      // Calculate the angle with a middle-of-night bound so the library doesn't replace
      // that angle with sunset. If the angle itself is unreachable, mirror the app's
      // deepest-night fallback using today's and tomorrow's solar transit (Dhuhr).
      const maghrib = angleAvailable
        ? candidateMaghrib
        : new Date(todayTimes.dhuhr.getTime() + (nextTimes.dhuhr.getTime() - todayTimes.dhuhr.getTime()) / 2);
      const isha = new Date(Math.max(todayTimes.isha.getTime(), maghrib.getTime()));
      const midnight = new Date(maghrib.getTime() + Math.max(0, nextTimes.fajr.getTime() - maghrib.getTime()) / 2);
      results.push({
        day,
        approximateMaghrib: !angleAvailable,
        times: [todayTimes.fajr, todayTimes.sunrise, todayTimes.dhuhr, todayTimes.asr,
          sunset, maghrib, isha, midnight]
      });
    }

    rows.replaceChildren();
    let missing = 0;
    let approximateMaghribDays = 0;
    results.forEach(result => {
      if (result.error) {
        missing += 1;
        rows.append(tableRow(dayLabel(year, month, result.day), Array(8).fill('Unavailable'), true));
      } else {
        const formatted = result.times.map(time => timeAtZone(time, city.zone));
        if (result.approximateMaghrib) {
          approximateMaghribDays += 1;
          formatted[5] += ' †';
        }
        rows.append(tableRow(dayLabel(year, month, result.day), formatted));
      }
    });
    const monthName = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(Date.UTC(year, month - 1, 1, 12)));
    tableTitle.textContent = `${city.name} · ${monthName}`;
    tableSubtitle.textContent = `${method === 'tehran' ? 'Tehran' : 'Qom Ja’fari'} method · local times in ${city.zone}`;
    document.title = `${city.name} ${monthName} Prayer Times · Namaz`;
    const notes = [`Times shown in ${city.zone}. Maghrib is listed separately from sunset.`];
    if (approximateMaghribDays) notes.push(`† Maghrib uses the deepest-night estimate on ${approximateMaghribDays} date${approximateMaghribDays === 1 ? '' : 's'} where the selected sun angle is not reached.`);
    if (missing) notes.push(`${missing} date${missing === 1 ? '' : 's'} could not be resolved and are marked unavailable.`);
    tableNote.textContent = notes.join(' ');
    printButton.disabled = false;
  }

  document.getElementById('settings-form').addEventListener('submit', event => {
    event.preventDefault();
    try {
      const city = citySelect.value === 'custom' ? customCity : cities[Number(citySelect.value)];
      const [year, month] = monthInput.value.split('-').map(Number);
      if (!city || !year || month < 1 || month > 12) throw new Error('Choose a valid city and month.');
      makeTimetable(city, year, month, methodSelect.value);
    } catch (reason) {
      error.textContent = reason.message || 'Could not calculate this timetable.';
    }
  });

  document.getElementById('use-custom').addEventListener('click', () => {
    const name = document.getElementById('custom-name').value.trim() || 'Custom location';
    const lat = Number(document.getElementById('custom-lat').value);
    const lon = Number(document.getElementById('custom-lon').value);
    const zone = customZone.value.trim();
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      error.textContent = 'Enter a latitude from −90 to 90 and longitude from −180 to 180.';
      return;
    }
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: zone });
      const [year, month] = monthInput.value.split('-').map(Number);
      if (!year || month < 1 || month > 12) throw new Error('Choose a valid month.');
      customCity = { name, lat, lon, zone };
      let customOption = citySelect.querySelector('option[value="custom"]');
      if (!customOption) {
        customOption = document.createElement('option');
        customOption.value = 'custom';
        citySelect.append(customOption);
      }
      customOption.textContent = `${name} (custom)`;
      citySelect.value = 'custom';
      makeTimetable(customCity, year, month, methodSelect.value);
      document.querySelector('.custom-location').open = false;
    } catch (reason) {
      error.textContent = reason instanceof RangeError
        ? 'Enter a valid IANA time zone, such as America/Toronto.'
        : reason.message || 'Could not calculate this timetable.';
    }
  });

  printButton.addEventListener('click', () => window.print());
  document.getElementById('settings-form').dispatchEvent(new Event('submit', { cancelable: true }));
})();
