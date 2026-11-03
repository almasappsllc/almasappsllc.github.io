const locationScreen=document.querySelector('#location-screen');
const scheduleScreen=document.querySelector('#schedule-screen');
const citySearch=document.querySelector('#city-search');
const suggestions=document.querySelector('#city-suggestions');
const locationError=document.querySelector('#location-error');
const tableMessage=document.querySelector('#table-message');
const methodSelect=document.querySelector('#method');
const timeZoneInput=document.querySelector('#time-zone');
const names={IMSAK:'Imsak',FAJR:'Fajr',SUNRISE:'Sunrise',DHUHR:'Dhuhr',ASR:'Asr',SUNSET:'Sunset',MAGHRIB:'Maghrib',ISHA:'Isha',MIDNIGHT:"Shari'i midnight"};
const adjustmentRows=['IMSAK','FAJR','SUNRISE','DHUHR','ASR','SUNSET','MAGHRIB','ISHA','MIDNIGHT'];
let selectedPlace=null,searchTimer=null,searchResults=[],searchSequence=0;
const deviceZone=Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';
timeZoneInput.value=deviceZone;
document.querySelector('#time-adjustments').innerHTML=adjustmentRows.map(id=>`<label>${names[id]}<input type="number" min="-120" max="120" step="1" value="0" data-adjust="${id}"></label>`).join('');

function methodLabel(){return {QUM:'Qom method',TEHRAN:'Tehran method',CUSTOM:'Custom angles'}[methodSelect.value]||'Qom method'}
try{document.querySelector('#print-url').textContent=(location.host+location.pathname).replace(/index\.html$/,'').replace(/\/$/,'')}catch{}
function shareLink(){
  const url=new URL(location.href.split(/[?#]/)[0]);
  if(selectedPlace){url.searchParams.set('lat',Number(selectedPlace.lat).toFixed(3));url.searchParams.set('lon',Number(selectedPlace.lon).toFixed(3));url.searchParams.set('city',selectedPlace.label);const zone=timeZoneInput.value.trim();if(zone!==NamazEngine.zoneFor(selectedPlace.lat,selectedPlace.lon))url.searchParams.set('zone',zone);if(methodSelect.value!=='QUM'&&methodSelect.value!=='CUSTOM')url.searchParams.set('method',methodSelect.value)}
  return url.toString();
}
function renderQr(caption){
  try{
    const qr=qrcode(0,'M');qr.addData(shareLink());qr.make();
    document.querySelector('#print-qr').innerHTML=qr.createSvgTag({cellSize:4,margin:0,scalable:true});
    document.querySelector('#print-qr-caption').textContent=caption;
  }catch{document.querySelector('.print-qr').hidden=true}
}
function showError(message){locationError.textContent=message;locationError.hidden=false}
function clearError(){locationError.textContent='';locationError.hidden=true}
function localDateInZone(zone){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const value=type=>parts.find(part=>part.type===type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}
function hideSuggestions(){suggestions.replaceChildren();suggestions.hidden=true;searchResults=[];citySearch.setAttribute('aria-expanded','false')}
function openSchedule(){locationScreen.hidden=true;scheduleScreen.hidden=false;clearError()}
function rememberPreferences(){
  if(!selectedPlace)return;
  const preferences={
    place:selectedPlace,method:methodSelect.value,fajrAngle:document.querySelector('#fajr-angle').value,
    ishaAngle:document.querySelector('#isha-angle').value,maghribAngle:document.querySelector('#maghrib-angle').value,
    highLat:document.querySelector('#high-lat').value,zone:timeZoneInput.value,
    showImsak:document.querySelector('#show-imsak').checked,imsakOffset:document.querySelector('#imsak-offset').value,
    offsets:Object.fromEntries([...document.querySelectorAll('[data-adjust]')].map(input=>[input.dataset.adjust,input.value]))
  };
  try{localStorage.setItem('namaz-site-page',JSON.stringify(preferences))}catch{}
}
function restorePreferences(preferences){
  if(!preferences||!preferences.place)return false;
  selectedPlace=preferences.place;
  methodSelect.value=preferences.method||'QUM';
  document.querySelector('#fajr-angle').value=preferences.fajrAngle||'16';
  document.querySelector('#isha-angle').value=preferences.ishaAngle||'14';
  document.querySelector('#maghrib-angle').value=preferences.maghribAngle||'4';
  document.querySelector('#custom-angles').hidden=methodSelect.value!=='CUSTOM';
  document.querySelector('#high-lat').value=preferences.highLat||'AUTO';
  timeZoneInput.value=preferences.zone||deviceZone;
  document.querySelector('#show-imsak').checked=!!preferences.showImsak;
  document.querySelector('#imsak-offset').value=preferences.imsakOffset||'0';
  document.querySelector('#imsak-offset-wrap').hidden=!preferences.showImsak;
  for(const input of document.querySelectorAll('[data-adjust]'))input.value=preferences.offsets?.[input.dataset.adjust]||'0';
  return true;
}
function displaySuggestions(items){
  hideSuggestions();searchResults=items;
  if(!items.length){const note=document.createElement('p');note.className='suggestion-message';note.textContent='No matching city found. Try another spelling or enter coordinates.';suggestions.append(note);suggestions.hidden=false;citySearch.setAttribute('aria-expanded','true');return}
  for(const [index,place] of items.entries()){
    const button=document.createElement('button');button.type='button';button.className='city-option';button.setAttribute('role','option');
    const name=document.createElement('strong');name.textContent=place.name;
    const region=document.createElement('span');region.textContent=[place.region,place.country].filter(Boolean).join(', ');
    button.append(name,region);
    button.addEventListener('click',()=>selectPlace({...place,label:[place.name,place.region,place.country].filter(Boolean).join(', ')}));
    button.addEventListener('keydown',event=>{if(event.key==='ArrowDown'){event.preventDefault();suggestions.querySelectorAll('button')[Math.min(index+1,items.length-1)]?.focus()}if(event.key==='ArrowUp'){event.preventDefault();if(index===0)citySearch.focus();else suggestions.querySelectorAll('button')[index-1]?.focus()}});
    suggestions.append(button);
  }
  suggestions.hidden=false;citySearch.setAttribute('aria-expanded','true');
}
async function selectPlace(place){
  const zone=place.zone||NamazEngine.zoneFor(place.lat,place.lon);if(zone)timeZoneInput.value=zone;
  selectedPlace=place;rememberPreferences();openSchedule();await calculateTimes();
}
citySearch.addEventListener('focus',()=>{NamazEngine.loadCities().catch(()=>{})},{once:true});
citySearch.addEventListener('input',()=>{
  clearError();clearTimeout(searchTimer);hideSuggestions();const sequence=++searchSequence;const query=citySearch.value.trim();
  if(query.length<2)return;
  searchTimer=setTimeout(async()=>{
    const slow=setTimeout(()=>{if(sequence!==searchSequence)return;suggestions.replaceChildren(Object.assign(document.createElement('p'),{className:'suggestion-message',textContent:'Loading cities…'}));suggestions.hidden=false},150);
    try{const data=await NamazEngine.searchCities(query);clearTimeout(slow);if(sequence!==searchSequence)return;displaySuggestions(data)}
    catch(error){clearTimeout(slow);if(sequence===searchSequence){hideSuggestions();showError(error.message)}}
  },90);
});
citySearch.addEventListener('keydown',event=>{if(event.key==='ArrowDown'){event.preventDefault();suggestions.querySelector('button')?.focus()}if(event.key==='Enter'&&searchResults.length){event.preventDefault();const place=searchResults[0];selectPlace({...place,label:[place.name,place.region,place.country].filter(Boolean).join(', ')})}});
document.addEventListener('click',event=>{if(event.target!==citySearch&&!event.target.closest('#city-suggestions')){searchSequence++;hideSuggestions()}});

document.querySelector('#locate').addEventListener('click',()=>{
  clearError();
  if(!navigator.geolocation)return showError('Location is not available here. Type your city or enter coordinates.');
  const button=document.querySelector('#locate');button.disabled=true;button.textContent='Finding your location…';
  navigator.geolocation.getCurrentPosition(async({coords})=>{
    button.disabled=false;button.textContent='Use my location';
    await selectPlace({lat:coords.latitude,lon:coords.longitude,label:'My location'});
  },()=>{button.disabled=false;button.textContent='Use my location';showError('Could not get your location. Type your city or enter coordinates instead.')},{timeout:12000,maximumAge:300000});
});
function applyCoordinates(){
  const latText=document.querySelector('#latitude').value.trim(),lonText=document.querySelector('#longitude').value.trim();
  if(!latText||!lonText)return showError('Enter both latitude and longitude.');
  const lat=Number(latText),lon=Number(lonText);
  if(!Number.isFinite(lat)||lat < -90||lat > 90||!Number.isFinite(lon)||lon < -180||lon > 180)return showError('Enter a latitude from -90 to 90 and longitude from -180 to 180.');
  selectPlace({lat,lon,label:`Coordinates ${lat.toFixed(4)}, ${lon.toFixed(4)}`});
}
document.querySelector('#apply-coordinates').addEventListener('click',applyCoordinates);
document.querySelector('#import-coordinates').addEventListener('click',()=>{
  const values=document.querySelector('#paste-coordinates').value.match(/[+-]?\d+(?:\.\d+)?/g)||[];
  if(values.length<2)return showError('Paste two decimal numbers: latitude, longitude.');
  document.querySelector('#latitude').value=values[0];document.querySelector('#longitude').value=values[1];applyCoordinates();
});

document.querySelector('#change-city').addEventListener('click',()=>{scheduleScreen.hidden=true;locationScreen.hidden=false;citySearch.value='';citySearch.focus()});
methodSelect.addEventListener('change',()=>{document.querySelector('#custom-angles').hidden=methodSelect.value!=='CUSTOM'});
document.querySelector('#show-imsak').addEventListener('change',event=>{document.querySelector('#imsak-offset-wrap').hidden=!event.target.checked});
document.querySelector('#update-times').addEventListener('click',()=>calculateTimes());
document.querySelector('#print-table').addEventListener('click',()=>{renderQr(`Scan for daily times in ${selectedPlace?.label.split(',')[0]||'your city'}`);document.body.dataset.printView='timetable';window.print()});
document.querySelector('#print-hijri').addEventListener('click',printHijriCalendar);
window.addEventListener('afterprint',()=>{delete document.body.dataset.printView;document.querySelector('#hijri-calendar').hidden=true});

async function printHijriCalendar(){
  if(!selectedPlace)return;
  const zone=timeZoneInput.value.trim();
  const params=new URLSearchParams({lat:selectedPlace.lat,lon:selectedPlace.lon,zone,date:localDateInZone(zone)});
  const button=document.querySelector('#print-hijri');button.disabled=true;button.textContent='Preparing calendar…';
  try{
    await NamazEngine.ready();
    const payload=NamazEngine.hijriMonth(document.querySelector('#hijri-date').dataset.civilDate||params.get('date'),selectedPlace.lat,selectedPlace.lon,zone);
    document.querySelector('#calendar-title').textContent=`${payload.monthName} ${payload.year} AH`;
    document.querySelector('#calendar-location').textContent=selectedPlace.label;
    const cells=Array(42).fill(null),firstOffset=new Date(`${payload.days[0].date}T12:00:00Z`).getUTCDay();
    for(const day of payload.days)cells[firstOffset+day.day-1]=day;
    const rows=Math.ceil((firstOffset+payload.days.length)/7);
    const shortMonth=new Intl.DateTimeFormat(undefined,{month:'short',timeZone:'UTC'}),longMonth=new Intl.DateTimeFormat(undefined,{month:'long',year:'numeric',timeZone:'UTC'});
    const civil=date=>new Date(`${date}T12:00:00Z`);
    const gregorian=(day,index)=>{const d=civil(day.date);return index===0||d.getUTCDate()===1?`${d.getUTCDate()} ${shortMonth.format(d)}`:String(d.getUTCDate())};
    const first=civil(payload.days[0].date),last=civil(payload.days[payload.days.length-1].date);
    document.querySelector('#calendar-span').textContent=`${longMonth.format(first)}${first.getUTCMonth()!==last.getUTCMonth()?` – ${longMonth.format(last)}`:''} · ${methodLabel()}`;
    document.querySelector('#calendar-days').innerHTML=Array.from({length:rows},(_,row)=>`<tr>${cells.slice(row*7,row*7+7).map(day=>day?`<td data-day="${day.day}"><span class="hijri-day-number">${day.day}</span><small>${gregorian(day,payload.days.indexOf(day))}</small></td>`:'<td class="empty"></td>').join('')}</tr>`).join('');
    let occasionsByDay={};
    try{
      const {items,note}=await NamazEngine.occasions(payload.month);
      for(const item of items)(occasionsByDay[item.day] ||= []).push(item);
      const list=document.querySelector('#calendar-event-list');
      list.innerHTML='';
      for(const item of items){const day=payload.days.find(d=>d.day===item.day);const li=document.createElement('li');li.className=`occasion-${item.kind}`;const when=document.createElement('strong');when.textContent=`${item.day} ${payload.monthName}`+(day?` · ${new Intl.DateTimeFormat(undefined,{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(`${day.date}T12:00:00Z`))}`:'');const what=document.createElement('span');what.textContent=item.title;li.append(when,what);list.append(li)}
      document.querySelector('#calendar-events-note').textContent=note;
      document.querySelector('#calendar-events').hidden=!items.length;
    }catch{document.querySelector('#calendar-events').hidden=true}
    for(const cell of document.querySelectorAll('#calendar-days td[data-day]')){const items=occasionsByDay[cell.dataset.day];if(items){cell.classList.add('has-occasion',`occasion-${items[0].kind}`);const tag=document.createElement('span');tag.className='cell-occasion';tag.textContent=items.map(i=>i.title.split(':')[0]).join(' · ');cell.append(tag)}}
    document.querySelector('#hijri-calendar').hidden=false;
    renderQr(`Scan for prayer times in ${selectedPlace.label.split(',')[0]}`);
    document.body.dataset.printView='calendar';
    window.print();
  }catch(error){tableMessage.hidden=false;tableMessage.textContent=error.message}
  finally{button.disabled=false;button.textContent='Print Hijri calendar'}
}

async function calculateTimes(){
  if(!selectedPlace)return;
  const zone=timeZoneInput.value.trim();
  try{new Intl.DateTimeFormat(undefined,{timeZone:zone}).format(new Date())}catch{return showError('Enter a valid time zone, such as America/Toronto.')}
  rememberPreferences();
  const params=new URLSearchParams({lat:selectedPlace.lat,lon:selectedPlace.lon,zone,date:localDateInZone(zone),method:methodSelect.value,highLat:document.querySelector('#high-lat').value,showImsak:String(document.querySelector('#show-imsak').checked),imsakOffset:document.querySelector('#imsak-offset').value});
  if(methodSelect.value==='CUSTOM')for(const [id,key] of [['fajr-angle','fajrAngle'],['isha-angle','ishaAngle'],['maghrib-angle','maghribAngle']])params.set(key,document.getElementById(id).value);
  for(const input of document.querySelectorAll('[data-adjust]'))if(Number(input.value)!==0)params.set(`offset_${input.dataset.adjust}`,input.value);
  tableMessage.hidden=false;tableMessage.textContent='Loading prayer times…';
  try{
    await NamazEngine.ready();
    const result=NamazEngine.compute(selectedPlace.lat,selectedPlace.lon,zone,{method:methodSelect.value,fajrAngle:params.get('fajrAngle'),ishaAngle:params.get('ishaAngle'),maghribAngle:params.get('maghribAngle'),highLat:params.get('highLat'),showImsak:params.get('showImsak')==='true',imsakOffset:params.get('imsakOffset'),offsets:Object.fromEntries([...document.querySelectorAll('[data-adjust]')].map(input=>[input.dataset.adjust,input.value]))});
    const payload={date:result.date,zone,hijri:result.hijri,rows:result.rows,approximated:result.approximated,maghribApproximated:result.maghribApproximated};
    const clock=new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit',timeZone:payload.zone});
    const prayers=['FAJR','DHUHR','ASR','MAGHRIB','ISHA'],now=Date.now();
    const nextId=payload.rows.find(row=>prayers.includes(row.id)&&new Date(row.time).getTime()>now)?.id;
    const rows=payload.rows.map(row=>{const cls=[['SUNRISE','SUNSET','IMSAK'].includes(row.id)?'marker':'',row.id===nextId?'next':''].filter(Boolean).join(' ');return `<tr${cls?` class="${cls}"`:''}><th scope="row">${names[row.id]||row.id}${row.id===nextId?'<span class="next-tag">Next</span>':''}</th><td>${clock.format(new Date(row.time))}</td></tr>`}).join('');
    const [placeName,...placeRest]=selectedPlace.label.split(', ');document.querySelector('#selected-location').textContent=placeName;document.querySelector('#selected-region').textContent=placeRest.join(', ');
    const [year,month,day]=payload.date.split('-').map(Number);
    document.querySelector('#gregorian-date').textContent=new Intl.DateTimeFormat(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(year,month-1,day,12)));
    document.querySelector('#hijri-date').textContent=`${payload.hijri.day} ${payload.hijri.monthName} ${payload.hijri.year} AH`;
    document.querySelector('#hijri-date').dataset.civilDate=payload.date;
    document.querySelector('#prayer-rows').innerHTML=rows;
    tableMessage.hidden=true;
    document.querySelector('#method-line').textContent=`${methodLabel()} · ${zone.replace(/_/g,' ')} time`;
    const note=document.querySelector('#approximation-note');note.hidden=!payload.approximated;note.textContent=payload.maghribApproximated?'At this time of year, the sun does not reach the Maghrib angle. Maghrib is set to the deepest point of the night.':'At this time of year, the sun does not reach one of the selected angles. The calculation uses the high-latitude rule above.';
  }catch(error){tableMessage.textContent=error.message}
}

// A shared or scanned link (?lat=&lon=&city=&zone=) opens that city's timetable.
function placeFromLink(){
  try{const q=new URLSearchParams(location.search),lat=Number(q.get('lat')),lon=Number(q.get('lon'));
    if(!q.has('lat')||!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return null;
    return {lat,lon,label:(q.get('city')||`Coordinates ${lat.toFixed(4)}, ${lon.toFixed(4)}`).slice(0,120),zone:q.get('zone')||null,method:q.get('method')}}catch{return null}
}
const linked=placeFromLink();
let saved=null;try{saved=JSON.parse(localStorage.getItem('namaz-site-page')||'null')}catch{}
if(linked){if(saved)restorePreferences(saved);if(['QUM','TEHRAN'].includes(linked.method))methodSelect.value=linked.method;document.querySelector('#custom-angles').hidden=methodSelect.value!=='CUSTOM';let zoneOk=false;try{if(linked.zone){new Intl.DateTimeFormat(undefined,{timeZone:linked.zone});zoneOk=true}}catch{}selectPlace({lat:linked.lat,lon:linked.lon,label:linked.label,zone:zoneOk?linked.zone:null});history.replaceState(null,'',location.pathname)}
else if(restorePreferences(saved)){openSchedule();calculateTimes()}

