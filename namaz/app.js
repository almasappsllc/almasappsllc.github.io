const locationScreen=document.querySelector('#location-screen');
const scheduleScreen=document.querySelector('#schedule-screen');
const citySearch=document.querySelector('#city-search');
const suggestions=document.querySelector('#city-suggestions');
const locationError=document.querySelector('#location-error');
const tableMessage=document.querySelector('#table-message');
const methodSelect=document.querySelector('#method');
const timeZoneInput=document.querySelector('#time-zone');
const clockToggle=document.querySelector('#clock-24');
const names={IMSAK:'Imsak',FAJR:'Fajr',SUNRISE:'Sunrise',DHUHR:'Dhuhr',ASR:'Asr',SUNSET:'Sunset',MAGHRIB:'Maghrib',ISHA:'Isha',MIDNIGHT:"Shari'i midnight"};
const adjustmentRows=['IMSAK','FAJR','SUNRISE','DHUHR','ASR','SUNSET','MAGHRIB','ISHA','MIDNIGHT'];
let selectedPlace=null,searchTimer=null,searchResults=[],resultsFor='',searchSequence=0,shownTimes=null;
const deviceZone=Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';
timeZoneInput.value=deviceZone;
document.querySelector('#time-adjustments').innerHTML=adjustmentRows.map(id=>`<label>${names[id]}<input type="number" min="-120" max="120" step="1" value="0" data-adjust="${id}"></label>`).join('');

function methodLabel(){return {QUM:'Qom method',TEHRAN:'Tehran method',CUSTOM:'Custom angles'}[methodSelect.value]||'Qom method'}
const siteUrl=(location.host+location.pathname).replace(/index\.html$/,'').replace(/\/$/,'');
function shareLink(){
  const url=new URL(location.href.split(/[?#]/)[0]);
  if(selectedPlace){url.searchParams.set('lat',Number(selectedPlace.lat).toFixed(3));url.searchParams.set('lon',Number(selectedPlace.lon).toFixed(3));url.searchParams.set('city',selectedPlace.label);const zone=timeZoneInput.value.trim();if(zone!==NamazEngine.zoneFor(selectedPlace.lat,selectedPlace.lon))url.searchParams.set('zone',zone);if(methodSelect.value!=='QUM'&&methodSelect.value!=='CUSTOM')url.searchParams.set('method',methodSelect.value)}
  return url.toString();
}
function showError(message){locationError.textContent=message;locationError.hidden=false}
function clearError(){locationError.textContent='';locationError.hidden=true}
function localDateInZone(zone){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const value=type=>parts.find(part=>part.type===type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}
function hideSuggestions(){suggestions.replaceChildren();suggestions.hidden=true;searchResults=[];resultsFor='';citySearch.setAttribute('aria-expanded','false')}
// One swap from the old list to the new: the list is never emptied first, so typing doesn't flicker.
function showSuggestions(nodes){suggestions.replaceChildren(...nodes);suggestions.scrollTop=0;suggestions.hidden=false;citySearch.setAttribute('aria-expanded','true')}
const suggestionMessage=text=>Object.assign(document.createElement('p'),{className:'suggestion-message',textContent:text});
function openSchedule(){locationScreen.hidden=true;scheduleScreen.hidden=false;clearError();whenIdle(printTools)}
function openLocation(){hideSuggestions();scheduleScreen.hidden=true;locationScreen.hidden=false;showSavedCity();whenIdle(()=>NamazEngine.prepareSearch())}
// The city search is always the first screen; a returning visitor's city waits there as one tap.
function showSavedCity(){
  const card=document.querySelector('#saved-city');card.hidden=!selectedPlace;if(!selectedPlace)return;
  const [name,...rest]=selectedPlace.label.split(', ');
  document.querySelector('#saved-city-name').textContent=name;document.querySelector('#saved-city-region').textContent=rest.join(', ');
}
const whenIdle=task=>'requestIdleCallback' in window?requestIdleCallback(()=>task(),{timeout:2000}):setTimeout(task,500);
// The printed sheet's QR code and its link's time zone; loaded after the timetable shows.
function printTools(){return Promise.all([NamazEngine.loadScript('vendor/qrcode.js'),NamazEngine.loadScript('vendor/tz-lookup.js')])}
function rememberPreferences(){
  if(!selectedPlace)return;
  const preferences={
    place:selectedPlace,method:methodSelect.value,fajrAngle:document.querySelector('#fajr-angle').value,
    ishaAngle:document.querySelector('#isha-angle').value,maghribAngle:document.querySelector('#maghrib-angle').value,
    highLat:document.querySelector('#high-lat').value,zone:timeZoneInput.value,
    showImsak:document.querySelector('#show-imsak').checked,imsakOffset:document.querySelector('#imsak-offset').value,clock24:clockToggle.checked,
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
  clockToggle.checked=!!preferences.clock24;
  for(const input of document.querySelectorAll('[data-adjust]'))input.value=preferences.offsets?.[input.dataset.adjust]||'0';
  return true;
}
const placeLabel=place=>[place.name,place.region,place.country].filter(Boolean).join(', ');
function displaySuggestions(items,query){
  searchResults=items;resultsFor=query;
  if(!items.length)return showSuggestions([suggestionMessage('No matching city found. Try another spelling or enter coordinates.')]);
  showSuggestions(items.map((place,index)=>{
    const button=document.createElement('button');button.type='button';button.className='city-option';button.setAttribute('role','option');
    const name=document.createElement('strong');name.textContent=place.name;
    const region=document.createElement('span');region.textContent=[place.region,place.country].filter(Boolean).join(', ');
    button.append(name,region);
    button.addEventListener('click',()=>selectPlace({...place,label:placeLabel(place)}));
    button.addEventListener('keydown',event=>{if(event.key==='ArrowDown'){event.preventDefault();suggestions.querySelectorAll('button')[Math.min(index+1,items.length-1)]?.focus()}if(event.key==='ArrowUp'){event.preventDefault();if(index===0)citySearch.focus();else suggestions.querySelectorAll('button')[index-1]?.focus()}});
    return button;
  }));
}
async function selectPlace(place){
  const zone=place.zone||await NamazEngine.zoneAt(place.lat,place.lon);if(zone)timeZoneInput.value=zone;
  selectedPlace=place;rememberPreferences();openSchedule();await calculateTimes();
}
citySearch.addEventListener('focus',()=>NamazEngine.prepareSearch(),{once:true});
citySearch.addEventListener('input',()=>{
  clearError();clearTimeout(searchTimer);const sequence=++searchSequence;const query=citySearch.value.trim();
  if(query.length<2)return hideSuggestions();
  // The current list stays up until the next one is ready. A slow first download (the city
  // index) says so, but only when there is no list to keep.
  searchTimer=setTimeout(async()=>{
    const slow=setTimeout(()=>{if(sequence===searchSequence&&suggestions.hidden)showSuggestions([suggestionMessage('Loading cities…')])},300);
    try{const data=await NamazEngine.searchCities(query);clearTimeout(slow);if(sequence!==searchSequence)return;displaySuggestions(data,query)}
    catch(error){clearTimeout(slow);if(sequence===searchSequence){hideSuggestions();showError(error.message)}}
  },90);
});
citySearch.addEventListener('keydown',async event=>{
  if(event.key==='ArrowDown'){event.preventDefault();suggestions.querySelector('button')?.focus()}
  if(event.key!=='Enter')return;
  event.preventDefault();
  // Enter picks the top result for what is typed now, not for the list still on screen.
  const query=citySearch.value.trim();if(query.length<2)return;
  let results=resultsFor===query?searchResults:null;
  if(!results){clearTimeout(searchTimer);const sequence=++searchSequence;try{results=await NamazEngine.searchCities(query)}catch(error){return showError(error.message)}if(sequence!==searchSequence)return;displaySuggestions(results,query)}
  if(results.length)selectPlace({...results[0],label:placeLabel(results[0])});
});
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

document.querySelector('#change-city').addEventListener('click',()=>{openLocation();citySearch.value='';citySearch.focus()});
methodSelect.addEventListener('change',()=>{document.querySelector('#custom-angles').hidden=methodSelect.value!=='CUSTOM'});
document.querySelector('#show-imsak').addEventListener('change',event=>{document.querySelector('#imsak-offset-wrap').hidden=!event.target.checked});
document.querySelector('#update-times').addEventListener('click',()=>calculateTimes());
for(const button of document.querySelectorAll('[data-print]'))button.addEventListener('click',async()=>{
  if(!selectedPlace)return;
  const label=button.querySelector('strong'),text=label.textContent;
  button.disabled=true;label.textContent='Preparing…';
  try{
    await printTools();
    const zone=timeZoneInput.value.trim();
    await NamazPrint.print(button.dataset.print,{place:selectedPlace,zone,settings:computeSettings(),methodLabel:methodLabel(),h24:clockToggle.checked,
      date:document.querySelector('#hijri-date').dataset.civilDate||localDateInZone(zone),link:shareLink(),siteUrl});
  }catch(error){tableMessage.hidden=false;tableMessage.textContent=error.message}
  finally{button.disabled=false;label.textContent=text}
});

// While the engine loads, show the page as it will look: city, date and method are known
// already, so only the times (and the Hijri date) wait, as quiet placeholders.
const placeholderRows=['FAJR','SUNRISE','DHUHR','ASR','SUNSET','MAGHRIB','ISHA','MIDNIGHT'];
function showPending(zone){
  const [placeName,...placeRest]=selectedPlace.label.split(', ');
  document.querySelector('#selected-location').textContent=placeName;
  document.querySelector('#selected-region').textContent=placeRest.join(', ');
  const [year,month,day]=localDateInZone(zone).split('-').map(Number);
  document.querySelector('#gregorian-date').textContent=new Intl.DateTimeFormat(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(year,month-1,day,12)));
  document.querySelector('#method-line').textContent=`${methodLabel()} · ${zone.replace(/_/g,' ')} time`;
  tableMessage.hidden=true;
  scheduleScreen.classList.add('is-loading');scheduleScreen.setAttribute('aria-busy','true');
  const body=document.querySelector('#prayer-rows');
  if(!body.children.length)body.innerHTML=placeholderRows.map(id=>`<tr class="pending${['SUNRISE','SUNSET'].includes(id)?' marker':''}"><th scope="row">${names[id]}</th><td><span class="placeholder" aria-hidden="true"></span></td></tr>`).join('');
}
function endPending(){scheduleScreen.classList.remove('is-loading');scheduleScreen.removeAttribute('aria-busy')}
function labelPrintChoices(payload){
  const civil=date=>new Date(`${date}T12:00:00Z`),first=civil(payload.date),last=new Date(first.getTime()+6*864e5);
  const span=new Intl.DateTimeFormat(undefined,{day:'numeric',month:'short',timeZone:'UTC'});
  document.querySelector('#print-week-span').textContent=span.formatRange?span.formatRange(first,last):`${span.format(first)} – ${span.format(last)}`;
  document.querySelector('#print-month-span').textContent=new Intl.DateTimeFormat(undefined,{month:'long',year:'numeric',timeZone:'UTC'}).format(first);
  document.querySelector('#print-hijri-span').textContent=`${payload.hijri.monthName} ${payload.hijri.year}`;
}
function computeSettings(){
  const value=id=>document.getElementById(id).value;
  return {method:methodSelect.value,fajrAngle:value('fajr-angle'),ishaAngle:value('isha-angle'),maghribAngle:value('maghrib-angle'),
    highLat:value('high-lat'),showImsak:document.querySelector('#show-imsak').checked,imsakOffset:value('imsak-offset'),
    offsets:Object.fromEntries([...document.querySelectorAll('[data-adjust]')].map(input=>[input.dataset.adjust,input.value]))};
}
// The rows, in the clock the visitor chose; the 24-hour switch redraws them without recalculating.
function showTimes(payload){
  shownTimes=payload;
  const clock=NamazEngine.clock(payload.zone,clockToggle.checked);
  const prayers=['FAJR','DHUHR','ASR','MAGHRIB','ISHA'],now=Date.now();
  const nextId=payload.rows.find(row=>prayers.includes(row.id)&&row.time.getTime()>now)?.id;
  document.querySelector('#prayer-rows').innerHTML=payload.rows.map(row=>{
    const cls=[['SUNRISE','SUNSET','IMSAK'].includes(row.id)?'marker':'',row.id===nextId?'next':''].filter(Boolean).join(' ');
    const t=clock(row.time);
    return `<tr${cls?` class="${cls}"`:''}><th scope="row">${names[row.id]||row.id}${row.id===nextId?'<span class="next-tag">Next</span>':''}</th><td>${t.time}${t.period?`<span class="period">${t.period}</span>`:''}</td></tr>`;
  }).join('');
}
clockToggle.addEventListener('change',()=>{rememberPreferences();if(shownTimes)showTimes(shownTimes)});
async function calculateTimes(){
  if(!selectedPlace)return;
  const zone=timeZoneInput.value.trim();
  try{new Intl.DateTimeFormat(undefined,{timeZone:zone}).format(new Date())}catch{return showError('Enter a valid time zone, such as America/Toronto.')}
  rememberPreferences();
  showPending(zone);
  try{
    await NamazEngine.ready();
    const result=NamazEngine.compute(selectedPlace.lat,selectedPlace.lon,zone,computeSettings());
    const payload={date:result.date,zone,hijri:result.hijri,rows:result.rows,approximated:result.approximated,maghribApproximated:result.maghribApproximated};
    showTimes(payload);
    const [year,month,day]=payload.date.split('-').map(Number);
    document.querySelector('#gregorian-date').textContent=new Intl.DateTimeFormat(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(year,month-1,day,12)));
    document.querySelector('#hijri-date').textContent=`${payload.hijri.day} ${payload.hijri.monthName} ${payload.hijri.year} AH`;
    document.querySelector('#hijri-date').dataset.civilDate=payload.date;
    endPending();
    labelPrintChoices(payload);
    const note=document.querySelector('#approximation-note');note.hidden=!payload.approximated;note.textContent=payload.maghribApproximated?'At this time of year, the sun does not reach the Maghrib angle. Maghrib is set to the deepest point of the night.':'At this time of year, the sun does not reach one of the selected angles. The calculation uses the high-latitude rule above.';
  }catch(error){endPending();document.querySelector('#prayer-rows').querySelectorAll('tr.pending').forEach(row=>row.remove());tableMessage.hidden=false;tableMessage.textContent=error.message}
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
else{restorePreferences(saved);openLocation()}
document.querySelector('#saved-city').addEventListener('click',()=>{openSchedule();calculateTimes()});

