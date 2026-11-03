// Printable sheets: a week or a month of prayer times, or the Hijri month, each on one page.
// Every sheet shares one layout: brand and method at the top, a title with the period or
// place beside it, the table, then one quiet line pointing to the app, with a QR code back
// to this city's times. Each sheet fills the page: the table stretches and the app line
// sits at the foot of the paper.
(() => {
  // Sheets print in the page's language (i18n.js); the column heads use the short names.
  const t = (key, vars) => NamazI18n.t(key, vars);
  const name = id => {
    if (id === 'MIDNIGHT') return t('p_MIDNIGHT_short');
    const sheetKey = `p_${id}_sheet`, short = t(sheetKey);
    return short === sheetKey ? t('p_' + id) : short;
  };
  const MARKERS = new Set(['IMSAK', 'SUNRISE', 'SUNSET']);
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const civil = date => new Date(`${date}T12:00:00Z`);
  const format = options => NamazI18n.dateFormat(options);
  const addDays = (date, n) => { const d = civil(date); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const isFriday = date => civil(date).getUTCDay() === 5;

  // Times without AM/PM: the column already says which prayer it is. The clock is the one
  // the visitor chose on the page (12-hour unless they switched).
  const clock = (zone, h24) => { const format = NamazEngine.clock(zone, h24); return time => format(time).time; };

  function hijriSpan(first, last) {
    if (first.month === last.month && first.year === last.year) {
      return first.day === last.day ? `${first.day} ${first.monthName} ${first.year} ${t('ah')}` : `${first.day}–${last.day} ${first.monthName} ${first.year} ${t('ah')}`;
    }
    const year = first.year === last.year ? '' : ` ${first.year}`;
    return `${first.day} ${first.monthName}${year} – ${last.day} ${last.monthName} ${last.year} ${t('ah')}`;
  }

  // title/titleSub on the left, side/sideSub on the right; meta in the brand line.
  function sheet(ctx, { kind, title, titleSub, side, sideSub, meta, body, notes = [] }) {
    const qr = (() => {
      try {
        const code = qrcode(0, 'M'); code.addData(ctx.link); code.make();
        return code.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
      } catch { return ''; }
    })();
    return `<article class="sheet sheet-${kind}">
      <header class="sheet-head">
        <span class="sheet-brand"><img src="icon.png" alt="" width="24" height="24">Shia Namaz <i>·</i> ${esc(t('sheet_school'))}</span>
        ${meta ? `<span class="sheet-meta">${meta}</span>` : ''}
      </header>
      <div class="sheet-title${title.length > 16 ? ' long' : ''}">
        <div><h1>${esc(title)}</h1>${titleSub ? `<p class="sheet-title-sub">${esc(titleSub)}</p>` : ''}</div>
        <div class="sheet-side"><p class="sheet-side-main">${esc(side)}</p>${sideSub ? `<p class="sheet-side-sub">${esc(sideSub)}</p>` : ''}</div>
      </div>
      <div class="sheet-body">${body}</div>
      ${notes.length ? `<p class="sheet-notes">${notes.map(esc).join(' ')}</p>` : ''}
      <footer class="sheet-foot">
        <p><strong>${esc(t('get_app'))}</strong> <i>·</i> ${esc(t('on_stores'))} <i>·</i> ${esc(ctx.siteUrl)}</p>
        ${qr ? `<span class="sheet-qr">${qr}</span>` : ''}
      </footer>
    </article>`;
  }
  const place = ctx => { const [city, ...region] = ctx.place.label.split(', '); return { city, region: region.join(', ') }; };
  const prayerMeta = ctx => `${esc(ctx.methodLabel)} <i>·</i> ${esc(t('zone_time', { zone: ctx.zone.replace(/_/g, ' ') }))}`;

  // A run of days as a table: one row per day, one column per time the timetable shows.
  function daysTable(ctx, dates, { compact }) {
    const days = dates.map(date => NamazEngine.computeOn(ctx.place.lat, ctx.place.lon, ctx.zone, ctx.settings, date));
    const ids = days[0].rows.map(row => row.id);
    const time = clock(ctx.zone, ctx.h24);
    const weekday = format({ weekday: compact ? 'short' : 'long' });
    const dayMonth = format({ day: 'numeric', month: 'short' });
    const head = `<thead><tr><th class="col-day" scope="col">${esc(t(compact ? 'col_date' : 'col_day'))}</th>${compact ? `<th class="col-hijri" scope="col">${esc(t('col_hijri'))}</th>` : ''}${ids.map(id => { const cls = [MARKERS.has(id) ? 'marker' : '', name(id).length > 8 && !name(id).includes(' ') ? 'long' : ''].filter(Boolean).join(' '); return `<th scope="col"${cls ? ` class="${cls}"` : ''}>${esc(name(id))}</th>`; }).join('')}</tr></thead>`;
    const rows = days.map((day, index) => {
      const date = dates[index], d = civil(date), h = day.hijri;
      const showMonth = index === 0 || h.day === 1;
      const dayCell = compact
        ? `<th scope="row" class="col-day"><span class="wd">${esc(weekday.format(d))}</span> ${d.getUTCDate()}</th><td class="col-hijri">${h.day}${showMonth ? ` <span class="hm">${esc(h.monthName)}</span>` : ''}</td>`
        : `<th scope="row" class="col-day"><span class="wd">${esc(weekday.format(d))}</span><span class="dm">${esc(dayMonth.format(d))} <i>·</i> ${h.day} ${esc(h.monthName)}</span></th>`;
      const times = day.rows.map(row => `<td${MARKERS.has(row.id) ? ' class="marker"' : ''}>${time(row.time)}</td>`).join('');
      return `<tr${isFriday(date) ? ' class="friday"' : ''}>${dayCell}${times}</tr>`;
    }).join('');
    const notes = [];
    if (days.some(day => day.maghribApproximated)) notes.push(t('sheet_approx_maghrib'));
    else if (days.some(day => day.approximated)) notes.push(t('sheet_approx_angle'));
    return { days, html: `<table class="sheet-table">${head}<tbody>${rows}</tbody></table>`, notes };
  }

  function week(ctx) {
    const dates = Array.from({ length: 7 }, (_, i) => addDays(ctx.date, i));
    const table = daysTable(ctx, dates, { compact: false });
    const range = format({ day: 'numeric', month: 'short', year: 'numeric' });
    const period = range.formatRange ? range.formatRange(civil(dates[0]), civil(dates[6])) : `${range.format(civil(dates[0]))} – ${range.format(civil(dates[6]))}`;
    const { city, region } = place(ctx);
    return sheet(ctx, { kind: 'week', title: city, titleSub: region, side: period, sideSub: hijriSpan(table.days[0].hijri, table.days[6].hijri), meta: prayerMeta(ctx), body: table.html,
      notes: [...table.notes, t('sheet_hijri_note')] });
  }

  function month(ctx) {
    const [y, m] = ctx.date.split('-').map(Number);
    const length = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const dates = Array.from({ length }, (_, i) => `${y}-${String(m).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`);
    const table = daysTable(ctx, dates, { compact: true });
    const { city, region } = place(ctx);
    return sheet(ctx, { kind: 'month', title: city, titleSub: region, side: format({ month: 'long', year: 'numeric' }).format(civil(dates[0])),
      sideSub: hijriSpan(table.days[0].hijri, table.days[length - 1].hijri), meta: prayerMeta(ctx), body: table.html,
      notes: [...table.notes, t('sheet_hijri_note')] });
  }

  async function hijri(ctx) {
    const payload = NamazEngine.hijriMonth(ctx.date, ctx.place.lat, ctx.place.lon, ctx.zone);
    const offset = civil(payload.days[0].date).getUTCDay();
    const cells = Array(offset).fill(null).concat(payload.days);
    while (cells.length % 7) cells.push(null);
    let occasions = { items: [], note: '' };
    try { occasions = await NamazEngine.occasions(payload.month, NamazI18n.lang); } catch {}
    const byDay = {};
    for (const item of occasions.items) (byDay[item.day] ||= []).push(item);
    const short = format({ day: 'numeric', month: 'short' });
    const weekdays = Array.from({ length: 7 }, (_, i) => format({ weekday: 'short' }).format(new Date(Date.UTC(2023, 0, 1 + i, 12))));
    // A grid of boxes, each drawing its own right and bottom rule (the first column its left
    // rule too). Collapsed table borders drop out of Chrome's print preview at some scales.
    // Occasions are written in full at the foot of their day.
    const head = weekdays.map((w, col) => `<div class="cal-head${col === 0 ? ' first' : ''}${col === 5 ? ' friday' : ''}">${esc(w)}</div>`).join('');
    const days = cells.map((day, i) => {
      const cls = `cal-day${i % 7 === 0 ? ' first' : ''}${day ? '' : ' empty'}`;
      if (!day) return `<div class="${cls}"></div>`;
      const d = civil(day.date), items = byDay[day.day] || [];
      const gregorian = day.day === 1 || d.getUTCDate() === 1 ? short.format(d) : String(d.getUTCDate());
      return `<div class="${cls}${items.length ? ' occasion' : ''}"><span class="hd">${day.day}</span><span class="gd">${esc(gregorian)}</span>${items.length ? `<span class="oc">${items.map(item => esc(item.title)).join('<br>')}</span>` : ''}</div>`;
    }).join('');
    const first = civil(payload.days[0].date), last = civil(payload.days[payload.days.length - 1].date);
    const monthYear = format({ month: 'long', year: 'numeric' });
    const gregorianSpan = monthYear.formatRange ? monthYear.formatRange(first, last) : `${monthYear.format(first)} – ${monthYear.format(last)}`;
    const { city, region } = place(ctx);
    const notes = [t('sheet_hijri_note_city')];
    if (occasions.items.length) notes.push(t('sheet_occasions_note'));
    return sheet(ctx, { kind: 'hijri', title: `${payload.monthName} ${payload.year} ${t('ah')}`, titleSub: gregorianSpan, side: city, sideSub: region,
      body: `<div class="cal" style="--weeks:${cells.length / 7}">${head}${days}</div>`, notes });
  }
  // kind: 'week' | 'month' | 'hijri'. ctx: { place, zone, settings, methodLabel, h24, date, link, siteUrl }
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

  window.NamazPrint = { print };
})();
