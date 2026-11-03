// Browser prayer-time engine for the Namaz website.
// Times and Hijri dates come from the app's own PrayerEngine and HijriCalendar, compiled to
// JavaScript (vendor/namaz-engine.js, built by namaz/engine-js in the growth repo).
(() => {
  // Deploys stamp ?v=<version> on this script's URL; pass it on so data files refresh too.
  const V = (document.currentScript?.src.match(/[?&]v=([\w-]+)/) || [])[1];
  const versioned = path => V ? `${path}?v=${V}` : path;
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
  // The engine bundle is large, so it loads in the background instead of holding up the page.
  let enginePromise = null;
  function ready() {
    if (window.NamazKotlin) return Promise.resolve();
    enginePromise ||= new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = versioned('vendor/namaz-engine.js');
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => { enginePromise = null; reject(new Error('The prayer-time engine did not load. Check your connection and try again.')); };
      document.head.append(script);
    });
    return enginePromise;
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

  // The schedule for a civil date (yyyy-mm-dd) at this place: the app's schedule at local noon
  // that day, which is the day's own schedule (the midnight-to-Fajr rollover is hours away).
  function computeOn(lat, lon, zone, settings, date) {
    const [y, m, d] = date.split('-').map(Number);
    const guess = Date.UTC(y, m - 1, d, 12);
    const first = guess - zoneOffsetMs(zone, guess);
    return compute(lat, lon, zone, settings, guess - zoneOffsetMs(zone, first));
  }
  function zoneOffsetMs(zone, utcMs) {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }).formatToParts(new Date(utcMs));
    const v = type => Number(parts.find(p => p.type === type).value);
    return Date.UTC(v('year'), v('month') - 1, v('day'), v('hour'), v('minute'), v('second')) - Math.floor(utcMs / 1000) * 1000;
  }

  // The Hijri month (the app's crescent-visibility calendar) containing a civil date.
  function hijriMonth(dateStr, lat, lon, zone) {
    const month = parse(kotlin().hijriMonth(dateStr, lat, lon, zone));
    month.monthName = HIJRI_MONTHS[month.month - 1];
    return month;
  }

  // The app's Ja'fari occasions and their titles (data/events.json, data/strings/<lang>.json).
  const jsonCache = {};
  const getJSON = path => (jsonCache[path] ||= fetch(versioned(path)).then(r => { if (!r.ok) throw new Error(path); return r.json(); })
    .catch(error => { delete jsonCache[path]; throw error; }));
  async function strings(lang = 'en') {
    try { return await getJSON(`data/strings/${lang}.json`); } catch { return getJSON('data/strings/en.json'); }
  }
  async function occasions(month, lang = 'en') {
    const [events, text] = await Promise.all([getJSON('data/events.json'), strings(lang)]);
    return { note: text.calendar_events_note || '', items: events.filter(e => e.month === month).map(e => ({ ...e, title: text[e.key] || e.key })) };
  }

  // Scripts the timetable itself does not need load on first use.
  const scripts = {};
  function loadScript(path) {
    return (scripts[path] ||= new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = versioned(path);
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => { delete scripts[path]; reject(new Error(`${path} did not load.`)); };
      document.head.append(script);
    }));
  }

  // City search: the app's own gazetteer (239,120 places, every spelling its search knows),
  // split by the first letters of each word so a search downloads one small file
  // (data/places, built by namaz/tools/build-places.py). The rules are the app's
  // CityGazetteer.search: every typed word starts a word of the place's names, most
  // populous first; failing that, trailing words name its province or country; same-named
  // places within 10 km are one place.
  const SEARCH_LIMIT = 20, OVERFETCH = 3, DUPLICATE_KM = 10;
  const fold = s => s.normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase();
  const tokens = s => fold(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const startsWord = (text, term) => text.startsWith(term) || text.includes(' ' + term);
  let indexPromise = null;
  function loadIndex() {
    indexPromise ||= Promise.all([getJSON('data/places/index.json'), loadScript('vendor/tz-lookup.js')])
      .then(([index]) => ({ ...index, split: new Set(index.split), regionFold: {} }))
      .catch(() => { indexPromise = null; throw new Error('City search is unavailable. Check your connection, or enter coordinates.'); });
    return indexPromise;
  }
  const fileKey = key => /^[a-z0-9]+$/.test(key) ? key : '_' + [...key].map(c => c.codePointAt(0).toString(16)).join('-');
  const shards = {};
  function shardFor(word, index) {
    const letters = [...word];
    let n = 2;
    while (index.split.has(letters.slice(0, n).join('')) && letters.length > n) n++;
    const key = letters.slice(0, n).join('');
    const file = `data/places/s/${fileKey(key)}${index.split.has(key) ? '.top' : ''}.json`;
    return (shards[file] ||= fetch(versioned(file)).then(r => {
      if (r.status === 404) return [];
      if (!r.ok) throw new Error('City search is unavailable. Check your connection, or enter coordinates.');
      return r.json();
    }).then(rows => rows.map(([name, cc, admin1, lat, lon, words]) => ({ name, cc, admin1, lat: lat / 1000, lon: lon / 1000, words: words.split(' ') })))
      .catch(error => { delete shards[file]; throw error; }));
  }
  const countryFold = {};
  function inRegion(place, term, index) {
    const code = `${place.cc}.${place.admin1}`;
    const region = index.regions[code];
    if (region) {
      const folded = index.regionFold[code] ??= fold(region);
      if (startsWord(folded, term)) return true;
    }
    if (place.admin1.toLowerCase() === term) return true;
    const country = countryFold[place.cc] ??= fold(countryName(place.cc));
    return startsWord(country, term) || place.cc.toLowerCase() === term;
  }
  function distanceKm(lat1, lon1, lat2, lon2) {
    const deg = Math.PI / 180, a = Math.sin((lat2 - lat1) * deg / 2), b = Math.sin((lon2 - lon1) * deg / 2);
    const h = a * a + Math.cos(lat1 * deg) * Math.cos(lat2 * deg) * b * b;
    return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  async function searchCities(query, limit = SEARCH_LIMIT) {
    const typed = tokens(query);
    if (typed.join('').length < 2) return [];
    const index = await loadIndex();
    // The whole query as a name first, then the last word as a region, then the last two...
    for (let n = typed.length; n >= 1; n--) {
      const name = typed.slice(0, n), region = typed.slice(n);
      const anchor = name.reduce((a, b) => (b.length > a.length ? b : a));
      if ([...anchor].length < 2) continue;
      const hits = [];
      for (const place of await shardFor(anchor, index)) {
        if (!name.every(t => place.words.some(w => w.startsWith(t)))) continue;
        if (!region.every(t => inRegion(place, t, index))) continue;
        hits.push(place);
        if (hits.length >= limit * OVERFETCH) break;
      }
      if (!hits.length) continue;
      const kept = [];
      for (const place of hits) {
        if (kept.length >= limit) break;
        const folded = fold(place.name);
        if (!kept.some(k => fold(k.name) === folded && distanceKm(k.lat, k.lon, place.lat, place.lon) <= DUPLICATE_KM)) kept.push(place);
      }
      return kept.map(place => ({
        name: place.name, region: index.regions[`${place.cc}.${place.admin1}`] || '', country: countryName(place.cc),
        lat: place.lat, lon: place.lon, zone: zoneFor(place.lat, place.lon),
      }));
    }
    return [];
  }
  // Called when the city screen shows, so the first search does not wait.
  function prepareSearch() { return loadIndex().catch(() => {}); }
  function zoneFor(lat, lon) {
    try { return window.tzlookup ? tzlookup(lat, lon) : null; } catch { return null; }
  }
  async function zoneAt(lat, lon) {
    try { await loadScript('vendor/tz-lookup.js'); } catch {}
    return zoneFor(lat, lon);
  }

  // Times as the page and the printed sheets show them: 12-hour (5:13, with AM/PM apart
  // so the page can set it small, the sheets leave it out) or 24-hour (05:13).
  function clock(zone, h24) {
    const formatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hourCycle: h24 ? 'h23' : 'h12', timeZone: zone });
    return time => {
      const parts = formatter.formatToParts(time), part = type => parts.find(p => p.type === type)?.value || '';
      return h24 ? { time: `${part('hour').padStart(2, '0')}:${part('minute')}`, period: '' }
        : { time: `${Number(part('hour'))}:${part('minute')}`, period: part('dayPeriod').toUpperCase() };
    };
  }

  window.NamazEngine = { clock, occasions, strings, ready, compute, computeOn, hijriMonth, searchCities, prepareSearch, zoneFor, zoneAt, loadScript, HIJRI_MONTHS };
  // The engine is preloaded by the page; start it once the page is idle so the first
  // timetable after picking a city is instant.
  const warm = () => ready().catch(() => {});
  if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 1500 }); else setTimeout(warm, 300);
})();
