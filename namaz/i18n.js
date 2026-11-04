// The site's languages. Each timetable page has its own address per language (/, /az/, /tr/,
// /de/, built by namaz/tools/build-pages.js with this file's text already in the HTML) and
// says which in <html data-page-lang>. The English home page's head script sends a visitor
// on to their language's page: ?lang= in the link, then their last choice on this device,
// then the browser's language (reviewed languages only, see REVIEWED).
//
// Azerbaijani and Turkish prayer names, Hijri months, method names and the messages marked
// "app" are the Shia Namaz app's own reviewed strings (data/strings/<lang>.json). Everything
// else here was written for the site and needs a native reader's review before it ships
// (CLAUDE.md, FR-001); German has no app translation at all.
(() => {
  const LANGS = { en: 'English', az: 'Azərbaycanca', tr: 'Türkçe', de: 'Deutsch' };
  const LOCALES = { en: undefined, az: 'az-Latn-AZ', tr: 'tr-TR', de: 'de-DE' };
  // Languages the browser's own setting may pick. A language joins once a native reader has
  // reviewed its text; until then it is reachable only by the switcher or a ?lang= link.
  // The home page's head script (namaz/templates/timetable.html) lists the same codes.
  const REVIEWED = new Set(['en', 'az', 'tr', 'de']);  // az, tr, de reviewed 2026-11-03

  const T = {
    en: {
      title: 'Shia Namaz | Prayer times for your city',
      description: "Shia Ja'fari prayer times for your location. Print the timetable or save it as a PDF.",
      language: 'Language', guides: 'Guides',
      nav_times: 'Prayer times', get_app_long: 'Get the app', get_app_short: 'Get app',
      your_city: 'Your city', show_times: 'Show times',
      heading: 'Get your prayer times',
      intro_html: 'Ja’fari times from the Shia Namaz app’s own engine, with <a href="articles/why-maghrib-after-sunset.html">Maghrib after sunset</a>. We’ll remember your city on this device.',
      type_city: 'Type your city', search_placeholder: 'Start typing a city name', city_choices: 'City choices',
      use_location: 'Use my location', finding_location: 'Finding your location…',
      coords_summary: 'Enter or paste coordinates',
      coords_help_html: 'Paste two decimal numbers, such as <strong>43.6532, -79.3832</strong>, or type them below.',
      paste_coords: 'Paste coordinates', paste_placeholder: 'Latitude, longitude', use_these: 'Use these',
      latitude: 'Latitude', longitude: 'Longitude', use_entered: 'Use entered coordinates',
      change_city: 'Change city', h24: '24-hour', next: 'Next',
      print_heading: 'Print a timetable', this_week: 'This week', seven_days: '7 days',
      this_month: 'This month', every_day: 'Every day', hijri_month: 'Hijri month', calendar: 'Calendar', preparing: 'Preparing…',
      settings: 'Calculation settings',
      hijri_help: 'The Hijri date follows the app’s moon-sighting calculation for your location and can differ from local announcements by a day.',
      method: 'Method', method_QUM: 'Qom', method_TEHRAN: 'Tehran', method_CUSTOM: 'Custom angles',
      method_line_QUM: 'Qom method', method_line_TEHRAN: 'Tehran method', method_line_CUSTOM: 'Custom angles',
      zone_time: '{zone} time',
      method_help: 'Use the method recommended by your mosque.',
      fajr_angle: 'Fajr angle', isha_angle: 'Isha angle', maghrib_angle: 'Maghrib angle',
      high_lat: 'High-latitude rule', hl_AUTO: 'Automatic (recommended)', hl_MIDDLE_OF_NIGHT: 'Middle of the night',
      hl_SEVENTH_OF_NIGHT: 'One-seventh of the night', hl_TWILIGHT_ANGLE: 'Angle-based',
      time_zone: 'Time zone', zone_help: "Your device's time zone is used by default.",
      include_imsak: 'Include Imsak', imsak_minutes: 'Minutes before Fajr',
      adjust_summary: 'Adjust individual times', adjust_help: 'Add or subtract minutes to match a local timetable.',
      update: 'Update timetable', privacy: 'Privacy policy', contact: 'Contact me',
      app_cta_note: 'Reminders at each prayer, and it works offline.',
      p_IMSAK: 'Imsak', p_FAJR: 'Fajr', p_SUNRISE: 'Sunrise', p_DHUHR: 'Dhuhr', p_ASR: 'Asr', p_SUNSET: 'Sunset',
      p_MAGHRIB: 'Maghrib', p_ISHA: 'Isha', p_MIDNIGHT: "Shari'i midnight", p_MIDNIGHT_short: 'Midnight',
      ah: 'AH',
      no_city: 'No matching city found. Try another spelling or enter coordinates.',
      loading_cities: 'Loading cities…',
      no_geolocation: 'Location is not available here. Type your city or enter coordinates.',
      geolocation_failed: 'Could not get your location. Type your city or enter coordinates instead.',
      my_location: 'My location', coordinates_label: 'Coordinates {lat}, {lon}',
      enter_both: 'Enter both latitude and longitude.',
      coords_range: 'Enter a latitude from -90 to 90 and longitude from -180 to 180.',
      paste_two: 'Paste two decimal numbers: latitude, longitude.',
      bad_zone: 'Enter a valid time zone, such as America/Toronto.',
      approx_maghrib: 'At this time of year, the sun does not reach the Maghrib angle. Maghrib is set to the deepest point of the night.',
      approx_angle: 'At this time of year, the sun does not reach one of the selected angles. The calculation uses the high-latitude rule above.',
      err_engine: 'The prayer-time engine did not load. Refresh the page and try again.',
      err_engine_net: 'The prayer-time engine did not load. Check your connection and try again.',
      err_angle: '{name} angle must be from 1 to 30 degrees.',
      err_maghrib_angle: 'Maghrib angle must be 0 or from 1 to 30 degrees.',
      err_imsak: 'Imsak offset must be from 0 to 120 minutes.',
      err_adjust: 'Time adjustments must be from -120 to 120 minutes.',
      err_search: 'City search is unavailable. Check your connection, or enter coordinates.',
      sheet_school: "Ja'fari", get_app: 'Get the app', on_stores: 'Shia Namaz on the App Store and Google Play',
      col_day: 'Day', col_date: 'Date', col_hijri: 'Hijri',
      sheet_hijri_note: 'Hijri dates follow the app’s moon-sighting calculation and may differ from local announcements by a day.',
      sheet_hijri_note_city: 'Hijri dates follow the app’s moon-sighting calculation for this city and may differ from local announcements by a day.',
      sheet_occasions_note: 'Occasions follow the common Ja‘fari narrations.',
      sheet_approx_maghrib: 'On some of these days the sun does not reach the Maghrib angle; Maghrib is set to the deepest point of the night.',
      sheet_approx_angle: 'On some of these days the sun does not reach one of the angles; those times use the high-latitude rule.',
    },
    az: {
      title: 'Shia Namaz | Şəhəriniz üçün namaz vaxtları',
      description: 'Olduğunuz yer üçün Cəfəri namaz vaxtları. Cədvəli çap edin və ya PDF kimi saxlayın.',
      language: 'Dil', guides: 'Bələdçilər',
      nav_times: 'Namaz vaxtları', get_app_long: 'Tətbiqi yükləyin', get_app_short: 'Tətbiq',
      your_city: 'Şəhəriniz', show_times: 'Vaxtları göstər',
      heading: 'Namaz vaxtlarınızı öyrənin',
      intro_html: 'Shia Namaz tətbiqinin öz hesablaması ilə Cəfəri namaz vaxtları, <a href="articles/why-maghrib-after-sunset.html">Məğrib gün batımından sonra</a>. Şəhərinizi bu cihazda yadda saxlayırıq.',
      type_city: 'Şəhərinizi yazın', search_placeholder: 'Şəhər adını yazmağa başlayın', city_choices: 'Şəhər seçimləri',
      use_location: 'Məkanımı istifadə et',
      finding_location: 'Məkanınız tapılır…', // app
      coords_summary: 'Koordinatları yazın və ya yapışdırın',
      coords_help_html: 'İki onluq ədəd yapışdırın, məsələn <strong>40.4093, 49.8671</strong>, və ya aşağıda yazın.',
      paste_coords: 'Koordinatları yapışdırın', paste_placeholder: 'Enlik, uzunluq', use_these: 'Bunları istifadə et',
      latitude: 'Enlik', longitude: 'Uzunluq', use_entered: 'Daxil edilmiş koordinatları istifadə et',
      change_city: 'Şəhəri dəyiş', h24: '24 saat',
      next: 'Növbəti', // app
      print_heading: 'Cədvəl çap edin', this_week: 'Bu həftə', seven_days: '7 gün',
      this_month: 'Bu ay', every_day: 'Hər gün', hijri_month: 'Hicri ay', calendar: 'Təqvim', preparing: 'Hazırlanır…',
      settings: 'Hesablama ayarları',
      hijri_help: 'Hicri tarix tətbiqin olduğunuz yer üçün hilal görünməsi hesablamasına əsaslanır və yerli elanlardan bir gün fərqlənə bilər.',
      method: 'Üsul',
      method_QUM: 'Qum', method_TEHRAN: 'Tehran', method_CUSTOM: 'Fərdi bucaqlar', // app
      method_line_QUM: 'Qum üsulu', method_line_TEHRAN: 'Tehran üsulu', method_line_CUSTOM: 'Fərdi bucaqlar',
      zone_time: '{zone} vaxtı',
      method_help: 'Məscidinizin tövsiyə etdiyi üsuldan istifadə edin.',
      fajr_angle: 'Fəcr bucağı', isha_angle: 'İşa bucağı', maghrib_angle: 'Məğrib bucağı', // app
      high_lat: 'Yüksək enlik qaydası', hl_AUTO: 'Avtomatik (tövsiyə olunur)', hl_MIDDLE_OF_NIGHT: 'Gecənin ortası',
      hl_SEVENTH_OF_NIGHT: 'Gecənin yeddidə biri', hl_TWILIGHT_ANGLE: 'Bucaq əsaslı', // last: app
      time_zone: 'Saat qurşağı', zone_help: 'Standart olaraq cihazınızın saat qurşağı istifadə olunur.',
      include_imsak: 'İmsakı göstər', imsak_minutes: 'Fəcrdən neçə dəqiqə əvvəl',
      adjust_summary: 'Vaxtları ayrıca tənzimləyin', adjust_help: 'Yerli cədvələ uyğunlaşdırmaq üçün dəqiqə əlavə edin və ya çıxın.',
      update: 'Cədvəli yenilə', privacy: 'Məxfilik siyasəti', contact: 'Əlaqə',
      // Prayer names: app
      p_IMSAK: 'İmsak', p_FAJR: 'Fəcr', p_SUNRISE: 'Tülu', p_DHUHR: 'Zöhr', p_ASR: 'Əsr', p_SUNSET: 'Qürub',
      p_MAGHRIB: 'Məğrib', p_ISHA: 'İşa', p_MIDNIGHT: 'Şəri gecə yarısı', p_MIDNIGHT_short: 'Gecə yarısı',
      ah: 'h.',
      no_city: 'Şəhər tapılmadı. Yazılışı yoxlayın və ya aşağıda koordinatları yazın.', // app
      loading_cities: 'Şəhərlər yüklənir…',
      no_geolocation: 'Burada məkan əlçatan deyil. Şəhərinizi yazın və ya koordinatları daxil edin.',
      geolocation_failed: 'Məkanınızı müəyyən etmək mümkün olmadı. Şəhərinizi yazın və ya koordinatları daxil edin.',
      my_location: 'Məkanım', coordinates_label: 'Koordinatlar {lat}, {lon}',
      enter_both: 'Həm enliyi, həm də uzunluğu daxil edin.',
      coords_range: 'Enliyi -90 ilə 90, uzunluğu -180 ilə 180 arasında daxil edin.',
      paste_two: 'İki onluq ədəd yapışdırın: enlik, uzunluq.',
      bad_zone: 'Düzgün saat qurşağı daxil edin, məsələn Asia/Baku.',
      approx_maghrib: 'İlin bu vaxtında günəş Məğrib bucağına çatmır. Məğrib gecənin ən dərin nöqtəsinə təyin edilir.',
      approx_angle: 'İlin bu vaxtında günəş seçilmiş bucaqlardan birinə çatmır. Hesablama yuxarıdakı yüksək enlik qaydasından istifadə edir.',
      err_engine: 'Namaz vaxtları hesablaması yüklənmədi. Səhifəni yeniləyin və yenidən cəhd edin.',
      err_engine_net: 'Namaz vaxtları hesablaması yüklənmədi. İnternet bağlantınızı yoxlayın və yenidən cəhd edin.',
      err_angle: '{name} bucağı 1 ilə 30 dərəcə arasında olmalıdır.',
      err_maghrib_angle: 'Məğrib bucağı 0 və ya 1 ilə 30 dərəcə arasında olmalıdır.',
      err_imsak: 'İmsak 0 ilə 120 dəqiqə arasında olmalıdır.',
      err_adjust: 'Vaxt düzəlişləri -120 ilə 120 dəqiqə arasında olmalıdır.',
      err_search: 'Şəhər axtarışı əlçatan deyil. İnternet bağlantınızı yoxlayın və ya koordinatları daxil edin.',
      sheet_school: 'Cəfəri', get_app: 'Tətbiqi yükləyin', on_stores: 'Shia Namaz App Store və Google Play-də',
      col_day: 'Gün', col_date: 'Tarix', col_hijri: 'Hicri',
      sheet_hijri_note: 'Hicri tarixlər tətbiqin hilal görünməsi hesablamasına əsaslanır və yerli elanlardan bir gün fərqlənə bilər.',
      sheet_hijri_note_city: 'Hicri tarixlər tətbiqin bu şəhər üçün hilal görünməsi hesablamasına əsaslanır və yerli elanlardan bir gün fərqlənə bilər.',
      sheet_occasions_note: 'Mühüm günlər məşhur Cəfəri rəvayətlərinə əsaslanır.',
      sheet_approx_maghrib: 'Bu günlərin bəzilərində günəş Məğrib bucağına çatmır; Məğrib gecənin ən dərin nöqtəsinə təyin edilir.',
      sheet_approx_angle: 'Bu günlərin bəzilərində günəş bucaqlardan birinə çatmır; həmin vaxtlar yüksək enlik qaydası ilə hesablanır.',
    },
    tr: {
      title: 'Shia Namaz | Şehriniz için namaz vakitleri',
      description: 'Bulunduğunuz yer için Caferi namaz vakitleri. Çizelgeyi yazdırın veya PDF olarak kaydedin.',
      language: 'Dil', guides: 'Rehberler',
      nav_times: 'Namaz vakitleri', get_app_long: 'Uygulamayı indirin', get_app_short: 'Uygulama',
      your_city: 'Şehriniz', show_times: 'Vakitleri göster',
      heading: 'Namaz vakitlerinizi öğrenin',
      intro_html: 'Shia Namaz uygulamasının kendi hesaplamasıyla Caferi vakitler, <a href="articles/why-maghrib-after-sunset.html">Mağrib güneş battıktan sonra</a>. Şehrinizi bu cihazda hatırlarız.',
      type_city: 'Şehrinizi yazın', search_placeholder: 'Bir şehir adı yazmaya başlayın', city_choices: 'Şehir seçenekleri',
      use_location: 'Konumumu kullan',
      finding_location: 'Konumunuz bulunuyor…', // app
      coords_summary: 'Koordinatları girin veya yapıştırın',
      coords_help_html: 'İki ondalık sayı yapıştırın, örneğin <strong>41.0082, 28.9784</strong>, ya da aşağıya yazın.',
      paste_coords: 'Koordinatları yapıştırın', paste_placeholder: 'Enlem, boylam', use_these: 'Bunları kullan',
      latitude: 'Enlem', longitude: 'Boylam', use_entered: 'Girilen koordinatları kullan',
      change_city: 'Şehri değiştir', h24: '24 saat',
      next: 'Sıradaki', // app
      print_heading: 'Çizelge yazdırın', this_week: 'Bu hafta', seven_days: '7 gün',
      this_month: 'Bu ay', every_day: 'Her gün', hijri_month: 'Hicri ay', calendar: 'Takvim', preparing: 'Hazırlanıyor…',
      settings: 'Hesaplama ayarları',
      hijri_help: 'Hicri tarih, uygulamanın konumunuz için yaptığı hilal görünürlüğü hesabına dayanır ve yerel duyurulardan bir gün farklı olabilir.',
      method: 'Yöntem',
      method_QUM: 'Kum', method_TEHRAN: 'Tahran', method_CUSTOM: 'Özel açılar', // app
      method_line_QUM: 'Kum yöntemi', method_line_TEHRAN: 'Tahran yöntemi', method_line_CUSTOM: 'Özel açılar',
      zone_time: '{zone} saati',
      method_help: 'Caminizin önerdiği yöntemi kullanın.',
      fajr_angle: 'Fecr açısı', isha_angle: 'İşâ açısı', maghrib_angle: 'Mağrib açısı', // app
      high_lat: 'Yüksek enlem kuralı', hl_AUTO: 'Otomatik (önerilen)', hl_MIDDLE_OF_NIGHT: 'Gecenin ortası',
      hl_SEVENTH_OF_NIGHT: 'Gecenin yedide biri', hl_TWILIGHT_ANGLE: 'Açı tabanlı', // last: app
      time_zone: 'Saat dilimi', zone_help: 'Varsayılan olarak cihazınızın saat dilimi kullanılır.',
      include_imsak: "İmsak'ı göster", imsak_minutes: "Fecr'den kaç dakika önce",
      adjust_summary: 'Vakitleri tek tek ayarlayın', adjust_help: 'Yerel bir çizelgeye uymak için dakika ekleyin veya çıkarın.',
      update: 'Çizelgeyi güncelle', privacy: 'Gizlilik politikası', contact: 'İletişim',
      // Prayer names: app
      p_IMSAK: 'İmsak', p_FAJR: 'Fecr', p_SUNRISE: 'Tulû', p_DHUHR: 'Zuhr', p_ASR: 'Asr', p_SUNSET: 'Gurûb',
      p_MAGHRIB: 'Mağrib', p_ISHA: 'İşâ', p_MIDNIGHT: "Şer'î gece yarısı", p_MIDNIGHT_short: 'Gece yarısı',
      ah: 'H.',
      no_city: 'Şehir bulunamadı. Yazımı kontrol edin veya aşağıya koordinatları girin.', // app
      loading_cities: 'Şehirler yükleniyor…',
      no_geolocation: 'Konum burada kullanılamıyor. Şehrinizi yazın veya koordinat girin.',
      geolocation_failed: 'Konumunuz alınamadı. Bunun yerine şehrinizi yazın veya koordinat girin.',
      my_location: 'Konumum', coordinates_label: 'Koordinatlar {lat}, {lon}',
      enter_both: 'Hem enlemi hem boylamı girin.',
      coords_range: 'Enlemi -90 ile 90, boylamı -180 ile 180 arasında girin.',
      paste_two: 'İki ondalık sayı yapıştırın: enlem, boylam.',
      bad_zone: 'Geçerli bir saat dilimi girin, örneğin Europe/Istanbul.',
      approx_maghrib: 'Yılın bu döneminde güneş Mağrib açısına ulaşmaz. Mağrib, gecenin en derin noktasına ayarlanır.',
      approx_angle: 'Yılın bu döneminde güneş seçilen açılardan birine ulaşmaz. Hesaplama yukarıdaki yüksek enlem kuralını kullanır.',
      err_engine: 'Namaz vakti hesaplaması yüklenemedi. Sayfayı yenileyip tekrar deneyin.',
      err_engine_net: 'Namaz vakti hesaplaması yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.',
      err_angle: '{name} açısı 1 ile 30 derece arasında olmalıdır.',
      err_maghrib_angle: 'Mağrib açısı 0 veya 1 ile 30 derece arasında olmalıdır.',
      err_imsak: 'İmsak 0 ile 120 dakika arasında olmalıdır.',
      err_adjust: 'Vakit ayarları -120 ile 120 dakika arasında olmalıdır.',
      err_search: 'Şehir araması kullanılamıyor. Bağlantınızı kontrol edin veya koordinat girin.',
      sheet_school: 'Caferi', get_app: 'Uygulamayı indirin', on_stores: "Shia Namaz App Store ve Google Play'de",
      col_day: 'Gün', col_date: 'Tarih', col_hijri: 'Hicri',
      sheet_hijri_note: 'Hicri tarihler uygulamanın hilal görünürlüğü hesabına dayanır ve yerel duyurulardan bir gün farklı olabilir.',
      sheet_hijri_note_city: 'Hicri tarihler uygulamanın bu şehir için yaptığı hilal görünürlüğü hesabına dayanır ve yerel duyurulardan bir gün farklı olabilir.',
      sheet_occasions_note: 'Özel günler yaygın Caferi rivayetlerine dayanır.',
      sheet_approx_maghrib: 'Bu günlerin bazılarında güneş Mağrib açısına ulaşmaz; Mağrib gecenin en derin noktasına ayarlanır.',
      sheet_approx_angle: 'Bu günlerin bazılarında güneş açılardan birine ulaşmaz; bu vakitler yüksek enlem kuralıyla hesaplanır.',
    },
    de: {
      title: 'Shia Namaz | Gebetszeiten für Ihre Stadt',
      description: "Ja'fari-Gebetszeiten für Ihren Standort. Drucken Sie den Gebetszeitenplan aus oder speichern Sie ihn als PDF.",
      language: 'Sprache', guides: 'Ratgeber',
      nav_times: 'Gebetszeiten', get_app_long: 'App herunterladen', get_app_short: 'App',
      your_city: 'Ihre Stadt', show_times: 'Zeiten anzeigen',
      heading: 'Ihre Gebetszeiten',
      intro_html: 'Ja’fari-Gebetszeiten, berechnet mit der Engine der Shia-Namaz-App, mit <a href="articles/why-maghrib-after-sunset.html">Maghrib nach Sonnenuntergang</a>. Ihre Stadt wird auf diesem Gerät gespeichert.',
      type_city: 'Stadt eingeben', search_placeholder: 'Stadtnamen eingeben', city_choices: 'Stadtauswahl',
      use_location: 'Meinen Standort verwenden', finding_location: 'Standort wird ermittelt…',
      coords_summary: 'Koordinaten eingeben oder einfügen',
      coords_help_html: 'Fügen Sie zwei Dezimalzahlen ein, etwa <strong>52.5200, 13.4050</strong>, oder geben Sie sie unten ein.',
      paste_coords: 'Koordinaten einfügen', paste_placeholder: 'Breitengrad, Längengrad', use_these: 'Übernehmen',
      latitude: 'Breitengrad', longitude: 'Längengrad', use_entered: 'Eingegebene Koordinaten verwenden',
      change_city: 'Stadt ändern', h24: '24 Stunden', next: 'Nächstes',
      print_heading: 'Gebetszeitenplan drucken', this_week: 'Diese Woche', seven_days: '7 Tage',
      this_month: 'Dieser Monat', every_day: 'Jeder Tag', hijri_month: 'Hidschri-Monat', calendar: 'Kalender', preparing: 'Wird vorbereitet…',
      settings: 'Berechnungseinstellungen',
      hijri_help: 'Das Hidschri-Datum folgt der Mondsichtungsberechnung der App für Ihren Standort und kann um einen Tag von örtlichen Ankündigungen abweichen.',
      method: 'Methode', method_QUM: 'Qom', method_TEHRAN: 'Teheran', method_CUSTOM: 'Eigene Winkel',
      method_line_QUM: 'Methode Qom', method_line_TEHRAN: 'Methode Teheran', method_line_CUSTOM: 'Eigene Winkel',
      zone_time: 'Zeitzone {zone}',
      method_help: 'Verwenden Sie die Methode, die Ihre Moschee empfiehlt.',
      fajr_angle: 'Fadschr-Winkel', isha_angle: 'Ischa-Winkel', maghrib_angle: 'Maghrib-Winkel',
      high_lat: 'Regel für hohe Breiten', hl_AUTO: 'Automatisch (empfohlen)', hl_MIDDLE_OF_NIGHT: 'Mitte der Nacht',
      hl_SEVENTH_OF_NIGHT: 'Ein Siebtel der Nacht', hl_TWILIGHT_ANGLE: 'Winkelbasiert',
      time_zone: 'Zeitzone', zone_help: 'Standardmäßig wird die Zeitzone Ihres Geräts verwendet.',
      include_imsak: 'Imsak anzeigen', imsak_minutes: 'Minuten vor Fadschr',
      adjust_summary: 'Einzelne Zeiten anpassen', adjust_help: 'Fügen Sie Minuten hinzu oder ziehen Sie sie ab, um einem örtlichen Gebetszeitenplan zu entsprechen.',
      update: 'Gebetszeitenplan aktualisieren', privacy: 'Datenschutz', contact: 'Kontakt',
      p_IMSAK: 'Imsak', p_FAJR: 'Fadschr', p_SUNRISE: 'Sonnenaufgang', p_DHUHR: 'Dhuhr', p_ASR: 'Asr', p_SUNSET: 'Sonnenuntergang',
      p_MAGHRIB: 'Maghrib', p_ISHA: 'Ischa', p_MIDNIGHT: "Schar'i-Mitternacht", p_MIDNIGHT_short: 'Mitternacht',
      // Column heads on printed sheets, where the full words don't fit.
      p_SUNRISE_sheet: 'Aufgang', p_SUNSET_sheet: 'Untergang',
      ah: 'n. H.',
      no_city: 'Keine passende Stadt gefunden. Versuchen Sie eine andere Schreibweise oder geben Sie Koordinaten ein.',
      loading_cities: 'Städte werden geladen…',
      no_geolocation: 'Der Standort ist hier nicht verfügbar. Geben Sie Ihre Stadt oder Koordinaten ein.',
      geolocation_failed: 'Ihr Standort konnte nicht ermittelt werden. Geben Sie stattdessen Ihre Stadt oder Koordinaten ein.',
      my_location: 'Mein Standort', coordinates_label: 'Koordinaten {lat}, {lon}',
      enter_both: 'Geben Sie Breiten- und Längengrad ein.',
      coords_range: 'Geben Sie einen Breitengrad von -90 bis 90 und einen Längengrad von -180 bis 180 ein.',
      paste_two: 'Fügen Sie zwei Dezimalzahlen ein: Breitengrad, Längengrad.',
      bad_zone: 'Geben Sie eine gültige Zeitzone ein, etwa Europe/Berlin.',
      approx_maghrib: 'Zu dieser Jahreszeit erreicht die Sonne den Maghrib-Winkel nicht. Maghrib wird auf den tiefsten Punkt der Nacht gesetzt.',
      approx_angle: 'Zu dieser Jahreszeit erreicht die Sonne einen der gewählten Winkel nicht. Die Berechnung verwendet die obige Regel für hohe Breiten.',
      err_engine: 'Die Gebetszeitberechnung wurde nicht geladen. Laden Sie die Seite neu und versuchen Sie es erneut.',
      err_engine_net: 'Die Gebetszeitberechnung wurde nicht geladen. Prüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
      err_angle: 'Der {name}-Winkel muss zwischen 1 und 30 Grad liegen.',
      err_maghrib_angle: 'Der Maghrib-Winkel muss 0 sein oder zwischen 1 und 30 Grad liegen.',
      err_imsak: 'Imsak muss zwischen 0 und 120 Minuten liegen.',
      err_adjust: 'Zeitanpassungen müssen zwischen -120 und 120 Minuten liegen.',
      err_search: 'Die Stadtsuche ist nicht verfügbar. Prüfen Sie Ihre Verbindung oder geben Sie Koordinaten ein.',
      sheet_school: "Ja'fari", get_app: 'App herunterladen', on_stores: 'Shia Namaz im App Store und bei Google Play',
      col_day: 'Tag', col_date: 'Datum', col_hijri: 'Hidschri',
      sheet_hijri_note: 'Die Hidschri-Daten folgen der Mondsichtungsberechnung der App und können um einen Tag von örtlichen Ankündigungen abweichen.',
      sheet_hijri_note_city: 'Die Hidschri-Daten folgen der Mondsichtungsberechnung der App für diese Stadt und können um einen Tag von örtlichen Ankündigungen abweichen.',
      sheet_occasions_note: 'Die Gedenktage folgen den verbreiteten Ja’fari-Überlieferungen.',
      sheet_approx_maghrib: 'An einigen dieser Tage erreicht die Sonne den Maghrib-Winkel nicht; Maghrib wird auf den tiefsten Punkt der Nacht gesetzt.',
      sheet_approx_angle: 'An einigen dieser Tage erreicht die Sonne einen der Winkel nicht; diese Zeiten folgen der Regel für hohe Breiten.',
    },
  };

  // Hijri months: English as the engine has them; Azerbaijani and Turkish from the app.
  const HIJRI = {
    en: ['Muharram', 'Safar', 'Rabiʻ al-Awwal', 'Rabiʻ al-Thani', 'Jumada al-Ula', 'Jumada al-Akhira', 'Rajab', 'Shaʻban', 'Ramadan', 'Shawwal', 'Dhu al-Qaʻda', 'Dhu al-Hijja'],
    az: ['Məhərrəm', 'Səfər', 'Rəbiüləvvəl', 'Rəbiülaxır', 'Cəmadiyələvvəl', 'Cəmadiyəlaxır', 'Rəcəb', 'Şaban', 'Ramazan', 'Şəvval', 'Zilqədə', 'Zilhiccə'],
    tr: ['Muharrem', 'Safer', 'Rebiülevvel', 'Rebiülahir', 'Cemaziyelevvel', 'Cemaziyelahir', 'Recep', 'Şaban', 'Ramazan', 'Şevval', 'Zilkade', 'Zilhicce'],
    de: ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Dschumada al-Ula', 'Dschumada al-Akhira', 'Radschab', 'Schaban', 'Ramadan', 'Schawwal', 'Dhul-Qada', 'Dhul-Hiddscha'],
  };

  // Dates. Browsers format German and Turkish dates themselves, but many ship without
  // Azerbaijani data (Chromium prints "2026 M11 3, Tue"), so Azerbaijani is spelled out here.
  // dateFormat(options) stands in for new Intl.DateTimeFormat(locale, options), with the
  // option sets the site uses; times are always given in UTC.
  const AZ = {
    months: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'],
    monthsShort: ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avq', 'sen', 'okt', 'noy', 'dek'],
    weekdays: ['bazar', 'bazar ertəsi', 'çərşənbə axşamı', 'çərşənbə', 'cümə axşamı', 'cümə', 'şənbə'],
    weekdaysShort: ['B.', 'B.E.', 'Ç.A.', 'Ç.', 'C.A.', 'C.', 'Ş.'],
  };
  const cap = s => s.charAt(0).toLocaleUpperCase('az') + s.slice(1);
  function azFormat(o) {
    const parts = d => ({ day: d.getUTCDate(), month: d.getUTCMonth(), year: d.getUTCFullYear(), weekday: d.getUTCDay() });
    const monthName = m => (o.month === 'short' ? AZ.monthsShort : AZ.months)[m];
    const one = d => {
      const p = parts(d);
      if (o.weekday && !o.day) return o.weekday === 'short' ? AZ.weekdaysShort[p.weekday] : cap(AZ.weekdays[p.weekday]);
      if (!o.day) return cap(`${AZ.months[p.month]}${o.year ? ' ' + p.year : ''}`);
      const date = `${p.day} ${monthName(p.month)}${o.year ? ' ' + p.year : ''}`;
      return o.weekday ? `${date}, ${AZ.weekdays[p.weekday]}` : date;
    };
    const range = (a, b) => {
      const p = parts(a), q = parts(b);
      if (!o.day) return p.year === q.year ? `${cap(AZ.months[p.month])} – ${AZ.months[q.month]} ${q.year}` : `${one(a)} – ${one(b)}`;
      if (p.month === q.month && p.year === q.year) return `${p.day}–${q.day} ${monthName(q.month)}${o.year ? ' ' + q.year : ''}`;
      return `${p.day} ${monthName(p.month)} – ${q.day} ${monthName(q.month)}${o.year ? ' ' + q.year : ''}`;
    };
    return { format: one, formatRange: range };
  }
  const dateFormat = options => lang === 'az' ? azFormat(options) : new Intl.DateTimeFormat(LOCALES[lang], { ...options, timeZone: 'UTC' });

  const STORE_KEY = 'namaz-site-lang';
  function pick() {
    const fixed = document.documentElement.dataset.pageLang;
    if (fixed && LANGS[fixed]) return fixed;
    try { const q = new URLSearchParams(location.search).get('lang'); if (q && LANGS[q]) { try { localStorage.setItem(STORE_KEY, q); } catch {} return q; } } catch {}
    try { const s = localStorage.getItem(STORE_KEY); if (s && LANGS[s]) return s; } catch {}
    for (const tag of navigator.languages || [navigator.language || 'en']) {
      const base = String(tag).toLowerCase().split('-')[0];
      if (REVIEWED.has(base)) return base;
    }
    return 'en';
  }
  let lang = pick();

  function t(key, vars) {
    let s = T[lang][key] ?? T.en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(v);
    return s;
  }
  // Every translation of a value, for labels the page stored in another language.
  const allOf = key => Object.keys(T).map(l => T[l][key]).filter(Boolean);

  function apply(root = document) {
    document.documentElement.lang = lang;
    // Titles and descriptions are written into each page's HTML (a city page has its own).
    for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
    for (const el of root.querySelectorAll('[data-i18n-html]')) el.innerHTML = t(el.dataset.i18nHtml);
    for (const el of root.querySelectorAll('[data-i18n-placeholder]')) el.placeholder = t(el.dataset.i18nPlaceholder);
    for (const el of root.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
    const summary = document.querySelector('#lang-switch summary');
    if (summary) {
      summary.setAttribute('aria-label', `${t('language')}: ${LANGS[lang]}`);
      summary.title = t('language');
      summary.querySelector('.lang-code').textContent = lang.toUpperCase();
    }
    for (const link of document.querySelectorAll('#lang-switch a[data-lang]')) {
      if (link.dataset.lang === lang) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
    }
  }

  // Another language is another page: this page's own version in that language when there is
  // one (its hreflang links), otherwise that language's home page. The choice is remembered,
  // so the English home page doesn't send the visitor straight back. A page showing a city
  // without its own version passes the city on (NamazI18n.carry, set by app.js).
  const alternates = () => Object.fromEntries([...document.querySelectorAll('link[rel="alternate"][hreflang]')]
    .map(link => [link.getAttribute('hreflang'), new URL(link.getAttribute('href'), location.href).pathname]));
  const homeOf = code => (code === 'en' ? '/' : `/${code}/`);
  function hrefFor(code) { return alternates()[code] || homeOf(code); }
  function set(next) {
    if (!LANGS[next] || next === lang) return;
    try { localStorage.setItem(STORE_KEY, next); } catch {}
    const own = !!alternates()[next];
    const href = new URL(hrefFor(next), location.href).toString();
    location.assign(api.carry ? api.carry(href, own) : href);
  }

  // The switcher: the translate mark and the language's code in the header, opening a short
  // menu of the languages, each named in its own words. It is a <details> (header.js closes it
  // on a click elsewhere or Escape); each item links to that language's page (set, above).
  // The mark is Material Icons' "translate" (Apache License 2.0).
  const TRANSLATE = '<svg class="lang-mark" width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>';
  const CHEVRON = '<svg class="menu-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  const CHECK = '<svg class="menu-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  function mountSwitcher() {
    const slot = document.querySelector('#lang-switch');
    if (!slot) return;
    const items = Object.entries(LANGS).map(([code, name]) =>
      `<li><a href="${hrefFor(code)}" lang="${code}" hreflang="${code}" data-lang="${code}"><span>${name}</span>${CHECK}</a></li>`).join('');
    slot.innerHTML = `<summary class="lang-button">${TRANSLATE}<span class="lang-code"></span>${CHEVRON}</summary><ul class="menu-list">${items}</ul>`;
    slot.addEventListener('click', event => {
      const link = event.target instanceof Element ? event.target.closest('a[data-lang]') : null;
      if (!(link instanceof HTMLAnchorElement)) return;
      event.preventDefault();
      slot.removeAttribute('open');
      if (link.dataset.lang !== lang) set(link.dataset.lang);
    });
  }

  /** @type {NamazI18nApi} */
  const api = {
    get lang() { return lang; },
    get locale() { return LOCALES[lang]; },
    langs: LANGS, t, allOf, set, apply, dateFormat,
    hijriMonth: month => (HIJRI[lang] || HIJRI.en)[month - 1],
    strings: T, carry: null,
  };
  window.NamazI18n = api;
  mountSwitcher();
  apply();
})();
