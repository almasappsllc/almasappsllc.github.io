(() => {
  const kaaba = { lat: 21.4225, lon: 39.8262 };
  const city = document.getElementById('city');
  const latitude = document.getElementById('latitude');
  const longitude = document.getElementById('longitude');
  const needle = document.getElementById('needle');
  const degrees = document.getElementById('degrees');
  const label = document.getElementById('result-label');
  const detail = document.getElementById('result-detail');
  const error = document.getElementById('error');

  function showBearing(lat, lon, place) {
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      error.textContent = 'Enter a latitude from −90 to 90 and longitude from −180 to 180.';
      return;
    }
    error.textContent = '';
    const toRad = Math.PI / 180;
    const phi1 = lat * toRad;
    const phi2 = kaaba.lat * toRad;
    const deltaLambda = (kaaba.lon - lon) * toRad;
    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
    const bearing = (Math.atan2(y, x) / toRad + 360) % 360;
    const rounded = Math.round(bearing * 10) / 10;
    needle.style.transform = `rotate(${rounded}deg)`;
    degrees.textContent = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
    label.textContent = place ? `Qibla bearing from ${place}` : 'Your Qibla bearing';
    detail.textContent = `${degrees.textContent}° clockwise from true north`;
    latitude.value = lat.toFixed(4);
    longitude.value = lon.toFixed(4);
  }

  city.addEventListener('change', () => {
    if (!city.value) return;
    const [lat, lon] = city.value.split(',').map(Number);
    showBearing(lat, lon, city.options[city.selectedIndex].text);
  });
  document.getElementById('calculate').addEventListener('click', () => {
    showBearing(Number(latitude.value), Number(longitude.value), 'your coordinates');
  });
  document.getElementById('locate').addEventListener('click', () => {
    error.textContent = '';
    if (!navigator.geolocation) {
      error.textContent = 'Location is not available in this browser. Choose a city or enter coordinates.';
      return;
    }
    error.textContent = 'Waiting for location permission…';
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => showBearing(coords.latitude, coords.longitude, 'your location'),
      (reason) => {
        error.textContent = reason.code === 1
          ? 'Location permission was declined. Choose a city or enter coordinates instead.'
          : 'Could not get your location. Choose a city or enter coordinates instead.';
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  });
})();
