// Browser prayer-time engine for the Namaz website.
// Uses adhan-js, the JavaScript port of the Adhan library the Namaz app is built on, with the
// app's Ja'fari presets: Maghrib by its own solar angle (listed apart from sunset) and
// Shari'i midnight as the midpoint of Maghrib and the next day's Fajr.
(() => {
  const METHODS = {
    QUM: { fajr: 16.0, isha: 14.0, maghrib: 4.0 },
    TEHRAN: { fajr: 17.7, isha: 14.0, maghrib: 4.5 },
  };
  const COUNTRY_NAMES = {
    AE: 'United Arab Emirates', AF: 'Afghanistan', AU: 'Australia', AZ: 'Azerbaijan', BH: 'Bahrain',
    CA: 'Canada', DE: 'Germany', FR: 'France', GB: 'United Kingdom', GE: 'Georgia', IN: 'India',
    IQ: 'Iraq', IR: 'Iran', KW: 'Kuwait', LB: 'Lebanon', NO: 'Norway', OM: 'Oman', PK: 'Pakistan',
    QA: 'Qatar', RU: 'Russia', SA: 'Saudi Arabia', SE: 'Sweden', SY: 'Syria', TR: 'Turkey',
    US: 'United States',
  };
  const regionNames = (() => { try { return new Intl.DisplayNames(['en'], { type: 'region' }); } catch { return null; } })();
  function countryName(code) {
    if (COUNTRY_NAMES[code]) return COUNTRY_NAMES[code];
    try { return regionNames?.of(code) || code; } catch { return code; }
  }

  const ADJUSTABLE = ['IMSAK', 'FAJR', 'SUNRISE', 'DHUHR', 'ASR', 'SUNSET', 'MAGHRIB', 'ISHA', 'MIDNIGHT'];

  function highLatRule(rule, lat) {
    const H = adhan.HighLatitudeRule;
    if (rule === 'MIDDLE_OF_NIGHT') return H.MiddleOfTheNight;
    if (rule === 'SEVENTH_OF_NIGHT') return H.SeventhOfTheNight;
    if (rule === 'TWILIGHT_ANGLE') return H.TwilightAngle;
    // Same AUTO choice as the earlier web port of the app's engine.
    return lat > 48 ? H.SeventhOfTheNight : H.MiddleOfTheNight;
  }

  function params(angles, rule) {
    const p = adhan.CalculationMethod.Other();
    p.fajrAngle = angles.fajr;
    p.ishaAngle = angles.isha;
    p.maghribAngle = angles.maghrib;
    p.madhab = adhan.Madhab.Shafi;
    p.highLatitudeRule = rule;
    p.polarCircleResolution = adhan.PolarCircleResolution.Unresolved;
    return p;
  }

  function addDays(dateStr, days) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const t = new Date(Date.UTC(y, m - 1, d + days, 12));
    return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`;
  }
  const valid = d => d instanceof Date && Number.isFinite(d.getTime());

  // settings: { method, fajrAngle, ishaAngle, maghribAngle, highLat, showImsak, imsakOffset, offsets }
  function compute(lat, lon, dateStr, settings) {
    if (!window.adhan) throw new Error('The calculation library did not load. Refresh the page and try again.');
    const angles = settings.method === 'CUSTOM'
      ? { fajr: Number(settings.fajrAngle), isha: Number(settings.ishaAngle), maghrib: Number(settings.maghribAngle) }
      : METHODS[settings.method] || METHODS.QUM;
    for (const [name, value] of [['Fajr', angles.fajr], ['Isha', angles.isha]]) {
      if (!Number.isFinite(value) || value < 1 || value > 30) throw new Error(`${name} angle must be from 1 to 30 degrees.`);
    }
    if (!Number.isFinite(angles.maghrib) || !(angles.maghrib === 0 || (angles.maghrib >= 1 && angles.maghrib <= 30))) {
      throw new Error('Maghrib angle must be 0 or from 1 to 30 degrees.');
    }
    const coords = new adhan.Coordinates(lat, lon);
    const rule = highLatRule(settings.highLat, lat);
    const p = params(angles, rule);
    const dayOf = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
    const today = new adhan.PrayerTimes(coords, dayOf(dateStr), p);
    const tomorrow = new adhan.PrayerTimes(coords, dayOf(addDays(dateStr, 1)), p);
    if (![today.fajr, today.sunrise, today.dhuhr, today.asr, today.sunset, today.isha, tomorrow.fajr, tomorrow.dhuhr].every(valid)) {
      throw new Error('Prayer times cannot be calculated for this place and date. Try a different high-latitude rule.');
    }
    const sunset = today.sunset;
    let maghrib = sunset, approximated = false;
    if (angles.maghrib > 0) {
      // Bound Maghrib by the middle of the night so the library doesn't replace the angle with
      // sunset when its Isha estimate comes earlier; if the angle is never reached, use the
      // deepest point of the night, as the app does.
      const m = new adhan.PrayerTimes(coords, dayOf(dateStr), params(angles, adhan.HighLatitudeRule.MiddleOfTheNight)).maghrib;
      if (valid(m) && m > sunset) maghrib = m;
      else { maghrib = new Date(today.dhuhr.getTime() + (tomorrow.dhuhr.getTime() - today.dhuhr.getTime()) / 2); approximated = true; }
    }
    const isha = new Date(Math.max(today.isha.getTime(), maghrib.getTime()));
    const midnight = new Date(maghrib.getTime() + Math.max(0, tomorrow.fajr.getTime() - maghrib.getTime()) / 2);
    const times = { FAJR: today.fajr, SUNRISE: today.sunrise, DHUHR: today.dhuhr, ASR: today.asr, SUNSET: sunset, MAGHRIB: maghrib, ISHA: isha, MIDNIGHT: midnight };
    if (settings.showImsak) {
      const offset = Number(settings.imsakOffset) || 0;
      if (offset < 0 || offset > 120) throw new Error('Imsak offset must be from 0 to 120 minutes.');
      times.IMSAK = new Date(today.fajr.getTime() - offset * 60000);
    }
    const rows = ADJUSTABLE.filter(id => times[id]).map(id => {
      const minutes = Number(settings.offsets?.[id]) || 0;
      if (minutes < -120 || minutes > 120) throw new Error('Time adjustments must be from -120 to 120 minutes.');
      return { id, time: new Date(times[id].getTime() + minutes * 60000) };
    });
    return { rows, approximated };
  }

  // Hijri date estimate from the browser's Umm al-Qura calendar. Local moon sighting can differ by a day or two.
  const hijriFormat = (() => {
    for (const cal of ['islamic-umalqura', 'islamic-civil', 'islamic']) {
      try {
        const f = new Intl.DateTimeFormat(`en-u-ca-${cal}-nu-latn`, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
        if (f.resolvedOptions().calendar.startsWith('islamic')) return f;
      } catch {}
    }
    return null;
  })();
  function hijri(dateStr) {
    if (!hijriFormat) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    const parts = hijriFormat.formatToParts(new Date(Date.UTC(y, m - 1, d, 12)));
    const get = type => parts.find(p => p.type === type)?.value;
    return { day: Number(get('day')), month: get('month'), year: Number(String(get('year') || get('relatedYear')).replace(/\D/g, '')) };
  }
  function hijriMonth(dateStr) {
    const anchor = hijri(dateStr);
    if (!anchor) throw new Error('This browser cannot show Hijri dates.');
    const days = [];
    for (let i = -35; i <= 35; i += 1) {
      const date = addDays(dateStr, i), h = hijri(date);
      if (h.month === anchor.month && h.year === anchor.year) days.push({ day: h.day, date });
    }
    return { month: anchor.month, year: anchor.year, days };
  }

  // City search over the bundled GeoNames list, loaded on first use.
  let citiesPromise = null;
  const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  function loadCities() {
    citiesPromise ||= fetch('data/cities.json').then(r => {
      if (!r.ok) throw new Error('City search is unavailable. Enter coordinates instead.');
      return r.json();
    }).then(rows => rows.map(([name, cc, region, lat, lon]) => ({ name, cc, region, lat, lon, key: fold(name) })))
      .catch(error => { citiesPromise = null; throw error; });
    return citiesPromise;
  }
  async function searchCities(query, limit = 20) {
    const cities = await loadCities();
    const [cityPart, ...rest] = query.split(',');
    const q = fold(cityPart), where = fold(rest.join(' '));
    if (q.length < 2) return [];
    const matchesWhere = c => !where || fold(`${c.region} ${countryName(c.cc)} ${c.cc}`).includes(where);
    const exact = [], prefix = [], inside = [];
    for (const c of cities) {
      if (!matchesWhere(c)) continue;
      if (c.key === q) exact.push(c);
      else if (c.key.startsWith(q)) prefix.push(c);
      else if (q.length >= 3 && c.key.includes(q)) inside.push(c);
      if (exact.length >= limit) break;
    }
    return [...exact, ...prefix, ...inside].slice(0, limit).map(c => ({
      name: c.name, region: c.region, country: countryName(c.cc), lat: c.lat, lon: c.lon,
      zone: zoneFor(c.lat, c.lon),
    }));
  }
  function zoneFor(lat, lon) {
    try { return window.tzlookup ? tzlookup(lat, lon) : null; } catch { return null; }
  }

  window.NamazEngine = { compute, hijri, hijriMonth, searchCities, zoneFor };
})();
