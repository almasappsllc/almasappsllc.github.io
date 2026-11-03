// Printable sheets: a week or a month of prayer times, or the Hijri month, each on one page.
// Every sheet shares one layout: brand and method at the top, the city as the title with the
// period beside it, the table, then a quiet footer with the QR code back to this city.
(() => {
  const NAMES = { IMSAK: 'Imsak', FAJR: 'Fajr', SUNRISE: 'Sunrise', DHUHR: 'Dhuhr', ASR: 'Asr', SUNSET: 'Sunset', MAGHRIB: 'Maghrib', ISHA: 'Isha', MIDNIGHT: 'Midnight' };
  const MARKERS = new Set(['IMSAK', 'SUNRISE', 'SUNSET']);
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const civil = date => new Date(`${date}T12:00:00Z`);
  const format = options => new Intl.DateTimeFormat(undefined, { ...options, timeZone: 'UTC' });
  const addDays = (date, n) => { const d = civil(date); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const isFriday = date => civil(date).getUTCDay() === 5;

  // Times without a.m./p.m.: the column already says which prayer it is, and the sheet's
  // header says which clock. 24-hour where the reader's locale uses it.
  function clock(zone) {
    const options = new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions();
    const twelve = options.hour12 ?? /h1[12]/.test(options.hourCycle || '');
    const formatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hourCycle: twelve ? 'h12' : 'h23', timeZone: zone });
    const text = time => {
      const parts = formatter.formatToParts(time), part = type => parts.find(p => p.type === type).value;
      return twelve ? `${Number(part('hour'))}:${part('minute')}` : `${part('hour').padStart(2, '0')}:${part('minute')}`;
    };
    return { text, label: twelve ? '12-hour clock' : '24-hour clock' };
  }

  function hijriSpan(first, last) {
    if (first.month === last.month && first.year === last.year) {
      return first.day === last.day ? `${first.day} ${first.monthName} ${first.year} AH` : `${first.day}–${last.day} ${first.monthName} ${first.year} AH`;
    }
    const year = first.year === last.year ? '' : ` ${first.year}`;
    return `${first.day} ${first.monthName}${year} – ${last.day} ${last.monthName} ${last.year} AH`;
  }

  function sheet(ctx, { kind, period, periodSub, body, notes = [] }) {
    const [city, ...region] = ctx.place.label.split(', ');
    const qr = (() => {
      try {
        const code = qrcode(0, 'M'); code.addData(ctx.link); code.make();
        return code.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
      } catch { return ''; }
    })();
    return `<article class="sheet sheet-${kind}">
      <header class="sheet-head">
        <span class="sheet-brand"><img src="icon.png" alt="" width="24" height="24">Shia Namaz <i>·</i> Ja'fari</span>
        <span class="sheet-meta">${esc(ctx.methodLabel)} <i>·</i> ${esc(ctx.zone.replace(/_/g, ' '))} time${ctx.clockLabel ? ` <i>·</i> ${ctx.clockLabel}` : ''}</span>
      </header>
      <div class="sheet-title${city.length > 16 ? ' long' : ''}">
        <div><h1>${esc(city)}</h1>${region.length ? `<p class="sheet-place">${esc(region.join(', '))}</p>` : ''}</div>
        <div class="sheet-period"><p class="sheet-period-main">${esc(period)}</p>${periodSub ? `<p class="sheet-period-sub">${esc(periodSub)}</p>` : ''}</div>
      </div>
      ${body}
      ${notes.length ? `<div class="sheet-notes">${notes.map(n => `<p>${esc(n)}</p>`).join('')}</div>` : ''}
      <footer class="sheet-foot">
        <div class="sheet-foot-text">
          <p class="sheet-foot-name">Shia Namaz</p>
          <p>Ja'fari prayer times for any city, from the Shia Namaz app's own engine.</p>
          <p>Daily reminders in the app, on the App Store and Google Play.</p>
          <p class="sheet-url">${esc(ctx.siteUrl)}</p>
        </div>
        ${qr ? `<figure class="sheet-qr">${qr}<figcaption>Today's times in ${esc(city)}</figcaption></figure>` : ''}
      </footer>
    </article>`;
  }

  // A run of days as a table: one row per day, one column per time the timetable shows.
  function daysTable(ctx, dates, { compact }) {
    const days = dates.map(date => NamazEngine.computeOn(ctx.place.lat, ctx.place.lon, ctx.zone, ctx.settings, date));
    const ids = days[0].rows.map(row => row.id);
    const time = clock(ctx.zone);
    ctx.clockLabel = time.label;
    const weekday = format({ weekday: compact ? 'short' : 'long' });
    const dayMonth = format({ day: 'numeric', month: 'short' });
    const head = `<thead><tr><th class="col-day" scope="col">${compact ? 'Date' : 'Day'}</th>${compact ? '<th class="col-hijri" scope="col">Hijri</th>' : ''}${ids.map(id => `<th scope="col"${MARKERS.has(id) ? ' class="marker"' : ''}>${NAMES[id]}</th>`).join('')}</tr></thead>`;
    const rows = days.map((day, index) => {
      const date = dates[index], d = civil(date), h = day.hijri;
      const showMonth = index === 0 || h.day === 1;
      const dayCell = compact
        ? `<th scope="row" class="col-day"><span class="wd">${esc(weekday.format(d))}</span> ${d.getUTCDate()}</th><td class="col-hijri">${h.day}${showMonth ? ` <span class="hm">${esc(h.monthName)}</span>` : ''}</td>`
        : `<th scope="row" class="col-day"><span class="wd">${esc(weekday.format(d))}</span><span class="dm">${esc(dayMonth.format(d))} <i>·</i> ${h.day} ${esc(h.monthName)}</span></th>`;
      const times = day.rows.map(row => `<td${MARKERS.has(row.id) ? ' class="marker"' : ''}>${time.text(row.time)}</td>`).join('');
      return `<tr${isFriday(date) ? ' class="friday"' : ''}>${dayCell}${times}</tr>`;
    }).join('');
    const notes = [];
    if (days.some(day => day.maghribApproximated)) notes.push('On some of these days the sun does not reach the Maghrib angle; Maghrib is set to the deepest point of the night.');
    else if (days.some(day => day.approximated)) notes.push('On some of these days the sun does not reach one of the angles; those times use the high-latitude rule.');
    return { days, html: `<table class="sheet-table">${head}<tbody>${rows}</tbody></table>`, notes };
  }

  function week(ctx) {
    const dates = Array.from({ length: 7 }, (_, i) => addDays(ctx.date, i));
    const table = daysTable(ctx, dates, { compact: false });
    const range = format({ day: 'numeric', month: 'short', year: 'numeric' });
    const period = range.formatRange ? range.formatRange(civil(dates[0]), civil(dates[6])) : `${range.format(civil(dates[0]))} – ${range.format(civil(dates[6]))}`;
    return sheet(ctx, { kind: 'week', period, periodSub: hijriSpan(table.days[0].hijri, table.days[6].hijri), body: table.html,
      notes: [...table.notes, 'Hijri dates follow the app’s moon-sighting calculation for this city and may differ from local announcements by a day.'] });
  }

  function month(ctx) {
    const [y, m] = ctx.date.split('-').map(Number);
    const length = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const dates = Array.from({ length }, (_, i) => `${y}-${String(m).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`);
    const table = daysTable(ctx, dates, { compact: true });
    return sheet(ctx, { kind: 'month', period: format({ month: 'long', year: 'numeric' }).format(civil(dates[0])),
      periodSub: hijriSpan(table.days[0].hijri, table.days[length - 1].hijri), body: table.html,
      notes: [...table.notes, 'Hijri dates follow the app’s moon-sighting calculation for this city and may differ from local announcements by a day.'] });
  }

  async function hijri(ctx) {
    const payload = NamazEngine.hijriMonth(ctx.date, ctx.place.lat, ctx.place.lon, ctx.zone);
    ctx.clockLabel = '';
    const offset = civil(payload.days[0].date).getUTCDay();
    const cells = Array(offset).fill(null).concat(payload.days);
    while (cells.length % 7) cells.push(null);
    let occasions = { items: [], note: '' };
    try { occasions = await NamazEngine.occasions(payload.month); } catch {}
    const byDay = {};
    for (const item of occasions.items) (byDay[item.day] ||= []).push(item);
    const short = format({ day: 'numeric', month: 'short' });
    const weekdays = Array.from({ length: 7 }, (_, i) => format({ weekday: 'short' }).format(new Date(Date.UTC(2023, 0, 1 + i, 12))));
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(`<tr>${cells.slice(i, i + 7).map((day, col) => {
        if (!day) return '<td class="empty"></td>';
        const d = civil(day.date), items = byDay[day.day] || [];
        const gregorian = day.day === 1 || d.getUTCDate() === 1 ? short.format(d) : String(d.getUTCDate());
        return `<td class="${[col === 5 ? 'friday' : '', items.length ? 'occasion' : ''].filter(Boolean).join(' ')}"><span class="hd">${day.day}</span><span class="gd">${esc(gregorian)}</span>${items.length ? `<span class="oc">${esc(items.map(item => item.title.split(':')[0]).join(' · '))}</span>` : ''}</td>`;
      }).join('')}</tr>`);
    }
    const first = civil(payload.days[0].date), last = civil(payload.days[payload.days.length - 1].date);
    const monthYear = format({ month: 'long', year: 'numeric' });
    const gregorianSpan = monthYear.formatRange ? monthYear.formatRange(first, last) : `${monthYear.format(first)} – ${monthYear.format(last)}`;
    const list = occasions.items.length ? `<section class="sheet-occasions"><h2>Occasions this month</h2><ul>${occasions.items.map(item => {
      const day = payload.days.find(d => d.day === item.day);
      return `<li><span>${item.day} ${esc(payload.monthName)}${day ? ` <i>·</i> ${esc(short.format(civil(day.date)))}` : ''}</span><span>${esc(item.title)}</span></li>`;
    }).join('')}</ul></section>` : '';
    const notes = ['Hijri dates follow the app’s moon-sighting calculation for this city and may differ from local announcements by a day.'];
    if (occasions.note) notes.push(occasions.note);
    return sheet(ctx, { kind: 'hijri', period: `${payload.monthName} ${payload.year} AH`, periodSub: gregorianSpan,
      body: `<table class="sheet-calendar"><thead><tr>${weekdays.map(w => `<th scope="col">${esc(w)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>${list}`, notes });
  }

  // kind: 'week' | 'month' | 'hijri'. ctx: { place, zone, settings, methodLabel, date, link, siteUrl }
  async function print(kind, ctx) {
    await NamazEngine.ready();
    const html = kind === 'week' ? week(ctx) : kind === 'month' ? month(ctx) : await hijri(ctx);
    const target = document.querySelector('#print-sheet');
    target.innerHTML = html;
    // Let the QR image and icon settle before the print dialog snapshots the page.
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    window.print();
  }
  // The sheet stays in place after printing (it never shows on screen): some browsers fire
  // afterprint before the page has been laid out for paper.

  window.NamazPrint = { print, clock };
})();
