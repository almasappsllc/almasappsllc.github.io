// Browser prayer-time engine for the Namaz website.
// Times and Hijri dates come from the app's own PrayerEngine and HijriCalendar, compiled to
// JavaScript (vendor/namaz-engine.js, built by namaz/engine-js in the growth repo).
(() => {
  const METHODS = {
    QUM: { fajr: 16.0, isha: 14.0, maghrib: 4.0 },
    TEHRAN: { fajr: 17.7, isha: 14.0, maghrib: 4.5 },
  };
  const HIJRI_MONTHS = ["Muharram", "Safar", "Rabiʻ al-Awwal", "Rabiʻ al-Thani", "Jumada al-Ula", "Jumada al-Akhira", "Rajab", "Shaʻban", "Ramadan", "Shawwal", "Dhu al-Qaʻda", "Dhu al-Hijja"];
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


  function kotlin() {
    if (!window.NamazKotlin) throw new Error('The prayer-time engine did not load. Refresh the page and try again.');
    return window.NamazKotlin;
  }
  function parse(json) {
    const value = JSON.parse(json);
    if (value.error) throw new Error(value.error);
    return value;
  }

  // The schedule the app would show right now at this place:
  // settings = { method, fajrAngle, ishaAngle, maghribAngle, highLat, showImsak, imsakOffset, offsets }
  function compute(lat, lon, zone, settings, nowMillis = Date.now()) {
    const angles = settings.method === 'CUSTOM'
      ? { fajr: Number(settings.fajrAngle), isha: Number(settings.ishaAngle), maghrib: Number(settings.maghribAngle) }
      : METHODS[settings.method] || METHODS.QUM;
    for (const [name, value] of [['Fajr', angles.fajr], ['Isha', angles.isha]]) {
      if (!Number.isFinite(value) || value < 1 || value > 30) throw new Error(`${name} angle must be from 1 to 30 degrees.`);
    }
    if (!Number.isFinite(angles.maghrib) || !(angles.maghrib === 0 || (angles.maghrib >= 1 && angles.maghrib <= 30))) {
      throw new Error('Maghrib angle must be 0 or from 1 to 30 degrees.');
    }
    const imsakOffset = Math.round(Number(settings.imsakOffset) || 0);
    if (imsakOffset < 0 || imsakOffset > 120) throw new Error('Imsak offset must be from 0 to 120 minutes.');
    const offsets = Object.entries(settings.offsets || {}).map(([id, v]) => [id, Math.round(Number(v) || 0)]);
    if (offsets.some(([, v]) => v < -120 || v > 120)) throw new Error('Time adjustments must be from -120 to 120 minutes.');
    const result = parse(kotlin().computeTimes(lat, lon, nowMillis, zone, angles.fajr, angles.isha, angles.maghrib,
      settings.highLat || 'AUTO', !!settings.showImsak, imsakOffset,
      offsets.filter(([, v]) => v !== 0).map(([id, v]) => `${id}:${v}`).join(',')));
    result.rows = result.rows.map(row => ({ id: row.id, time: new Date(row.time) }));
    result.hijri.monthName = HIJRI_MONTHS[result.hijri.month - 1];
    return result;
  }

  // The Hijri month (the app's crescent-visibility calendar) containing a civil date.
  function hijriMonth(dateStr, lat, lon, zone) {
    const month = parse(kotlin().hijriMonth(dateStr, lat, lon, zone));
    month.monthName = HIJRI_MONTHS[month.month - 1];
    return month;
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

  window.NamazEngine = { compute, hijriMonth, searchCities, zoneFor, HIJRI_MONTHS };
})();
