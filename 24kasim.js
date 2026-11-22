/* =========================================================
   24 KASIM ÖĞRETMENLER GÜNÜ SÜRPRİZİ  (v2 – index.html'e göre düzeltilmiş)
   Test için adresin sonuna  ?kasim=1  ekle  (örn. index.html?kasim=1)
   ========================================================= */
(function () {
  'use strict';

  var FORCE = /[?&]kasim(=|&|$)/.test(location.search);
  function isTeacherDay() {
    if (FORCE) return true;
    var d = new Date();
    return d.getMonth() === 10 && d.getDate() === 24;
  }
  if (!isTeacherDay()) return;

  // --- Uygulamanın global değişkenlerine güvenli erişim (let ile tanımlı oldukları için window.xxx ÇALIŞMAZ) ---
  function getPId()   { try { return pId; }       catch (e) { return null; } }
  function getPType() { try { return pType; }     catch (e) { return null; } }
  function getCache() { try { return dayCache; }  catch (e) { return null; } }
  function getName()  { try { return profileName() || ''; } catch (e) { return ''; } }

  // --- 1. CSS ---
  var style = document.createElement('style');
  style.textContent = `
    .bday-badge { position: relative !important; overflow: hidden !important;
      background: linear-gradient(135deg, rgba(245,158,11,.2), rgba(139,92,246,.2)) !important;
      border: 1px solid rgba(245,158,11,.6) !important;
      animation: badgeGlow 2s infinite alternate; }
    .bday-badge::before { content: '🎉'; font-size: 14px; line-height: 1; }
    @keyframes badgeGlow { from { box-shadow: 0 0 5px rgba(245,158,11,.2); } to { box-shadow: 0 0 20px rgba(245,158,11,.6); } }
    .confetti-particle { position: absolute !important; width: 5px; height: 5px; border-radius: 2px; opacity: 0;
      bottom: -10px; animation: floatUp 3s linear infinite; pointer-events: none; z-index: 0; }
    .confetti-particle:nth-child(1) { left: 10%; background: #FCD34D; animation-delay: 0s;   animation-duration: 2.5s; }
    .confetti-particle:nth-child(2) { left: 30%; background: #F472B6; animation-delay: 1s;   animation-duration: 3.2s; }
    .confetti-particle:nth-child(3) { left: 50%; background: #34D399; animation-delay: .5s;  animation-duration: 2.8s; }
    .confetti-particle:nth-child(4) { left: 70%; background: #60A5FA; animation-delay: 1.5s; animation-duration: 3s; }
    .confetti-particle:nth-child(5) { left: 85%; background: #FCD34D; animation-delay: .2s;  animation-duration: 2.2s; }
    .confetti-particle:nth-child(6) { left: 20%; background: #A78BFA; animation-delay: 2s;   animation-duration: 3.5s; }
    @keyframes floatUp {
      0%   { bottom: -10px; transform: translateX(0) rotate(0deg); opacity: 1; }
      50%  { bottom: 50%;   transform: translateX(5px) rotate(180deg); opacity: 1; }
      100% { bottom: 110%;  transform: translateX(-5px) rotate(360deg); opacity: 0; }
    }
    /* parçacıklar hariç diğer çocuklar öne gelsin */
    .bday-badge > :not(.confetti-particle) { position: relative; z-index: 1; }

    /* Zarf */
    @keyframes envelopeWiggle { 0%,100% { transform: rotate(0) scale(1); } 25% { transform: rotate(-10deg) scale(1.1); } 75% { transform: rotate(10deg) scale(1.1); } }
    .envelope-icon { animation: envelopeWiggle 1.5s ease-in-out infinite; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%;
      background: rgba(245,158,11,.15); color: #f59e0b; flex-shrink: 0; border: 1px solid rgba(245,158,11,.3);
      transition: background .2s; box-shadow: 0 2px 10px rgba(245,158,11,.2); padding: 0; }
    .envelope-icon:hover { background: rgba(245,158,11,.3); animation: none; }

    /* 3D kart */
    #statusCard { position: relative; }
    .live-card-container { perspective: 1200px; }
    .flip-card-inner { transition: transform .6s; transform-style: preserve-3d; -webkit-transform-style: preserve-3d; position: relative; }
    .flip-card-inner.is-flipped { transform: rotateY(180deg); }
    .flip-front { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
    .flip-back { backface-visibility: hidden; -webkit-backface-visibility: hidden; transform: rotateY(180deg);
      position: absolute; inset: -16px; border-radius: 16px; padding: 20px;
      display: flex; flex-direction: column; justify-content: center; align-items: center; overflow: auto;
      background: linear-gradient(135deg, #312E81, #4F46E5); color: #fff; text-align: center; border: 1px solid #4F46E5; cursor: pointer; }
    @media (min-width: 640px) { .flip-back { inset: -20px; } }
    .flip-card-inner:not(.is-flipped) .flip-back { pointer-events: none; }

    /* Açılış yazısı */
    #teacherDaySplash { position: fixed; inset: 0; z-index: 9998; background: rgba(15,23,42,.85); backdrop-filter: blur(5px);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      animation: tdFade 4.5s forwards; pointer-events: none; }
    @keyframes tdFade { 0% { opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { opacity: 0; } }
    .splash-text { color: #fff; font-size: 26px; font-weight: 800; text-align: center; padding: 0 20px;
      text-shadow: 0 0 20px rgba(245,158,11,.8); animation: tdScale 1s ease-out; }
    @keyframes tdScale { 0% { transform: scale(.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
    @media (prefers-reduced-motion: reduce) {
      .envelope-icon, .bday-badge, .confetti-particle { animation: none !important; }
      .flip-card-inner { transition: none; }
    }
  `;
  document.head.appendChild(style);

  // --- 2. MESAJ HAVUZLARI ---
  // Genel mesajlar: [İsim] otomatik olarak öğretmenin adıyla değişir (sınıf profilindeyken "Öğretmenim" yazar)
  var GENEL_MESAJLAR = {
    ders: [
      "Atatürk: 'Öğretmenler, yeni nesil sizin eseriniz olacaktır.'",
      "Bugün sınıfa girdiğinde, birinin yıllar sonra 'Bir öğretmenim vardı...' diye başlayacağı cümlesine giriyorsun.",
      "Şu an tahtaya yazdığın bir harf, yarın birinin hayatına yön verecek. Öğretmenler Günün kutlu olsun!",
      "Öğrencilerinin gözündeki o ışığı hatırla. İyi ki varsın [İsim] Öğretmenim."
    ],
    teneffus: [
      "Bir fincan çayı hak ettin [İsim] öğretmenim. Şimdi 10 dakika sadece kendin için.",
      "Dünyayı değiştirmek yorucu iştir. Bu teneffüs, senin hak ettiğin mola.",
      "İyi ki varsın [İsim]. O zil sadece çocuklar için değil, senin de nefes alman için çalıyor."
    ],
    ogle: [
      "Bir fincan kahveyi hak ettin [İsim] öğretmenim. En iyi öğretmen, dinlenmeyi bilen öğretmendir.",
      "Öğle arası... Yemek kadar, o güzel kalbini de dinlendirmeyi unutma. Öğretmenler Günün kutlu olsun.",
      "Bir öğretmen, sonsuzluğa dokunan bir iz bırakır. Afiyet olsun, iyi ki varsın."
    ],
    bos: [
      "Bu boşluk bir mola değil [İsim], belki de bugünün en çok ihtiyaç duyduğun sessizliği.",
      "Boş ders! Kahveni al ve pencereden dışarıyı izle. Bunu hak ettin.",
      "Bazı anlar boştur ki, en güzel fikirler içine doğsun. İyi ki öğretmensin."
    ]
  };

  // Kişiye özel: anahtar = programdaki öğretmen kodu VEYA ad soyad (büyük/küçük, Türkçe harf, tire fark etmez)
  var OZEL_MESAJLAR = {
    "ali-sahin": [
      "Ali Hocam, bu 24 Kasım'da senin gibi bir öğretmenin emeğini unutmadık. İyi ki varsın.",
      "Ali Hocam, bugün sınıfa girdiğinde bıraktığın izi düşündüm. İyi ki varsın.",
      "Bu 24 Kasım'da aklıma gelen ilk isim sen oldun Ali Hocam."
    ],
    "neslihan-okur": [
      "Neslihan Öğretmenim, bana sadece ders değil, insan olmayı da öğrettiniz. Gününüz kutlu olsun.",
      "Neslihan Hocam, sizin gibi bir öğretmene sahip olmak bir ayrıcalıktı. İyi ki varsınız.",
      "Neslihan Öğretmenim, 24 Kasım'ınız kutlu olsun. Işığınız hiç sönmesin."
    ]
  };

  // --- 3. YARDIMCILAR ---
  function normalize(str) {
    return String(str || '').toLowerCase()
      .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
      .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '');
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function getOzelMesaj() {
    if (getPType() !== 'teacher') return null;          // sınıf profilinde kişisel mesaj gösterme
    var pid = normalize(getPId()), pname = normalize(getName());
    for (var key in OZEL_MESAJLAR) {
      var k = normalize(key);
      if (k && (k === pid || k === pname)) return OZEL_MESAJLAR[key];
    }
    return null;
  }

  // --- 4. TARİH KUTUSU (dateLabel'a DOKUNMUYORUZ: uygulama her saniye üzerine yazıyor) ---
  function applyDateBadge() {
    var label = document.getElementById('dateLabel');
    if (!label || !label.parentElement) return;
    var pill = label.parentElement;
    if (pill.classList.contains('bday-badge')) return;
    pill.classList.add('bday-badge');
    pill.insertAdjacentHTML('afterbegin', '<div class="confetti-particle"></div>'.repeat(6));
  }

  // --- 5. ZARF + 3D KART ---
  var isFlipped = false, flipTimeout = null, lastState = null;

  function closeCard() {
    var inner = document.getElementById('liveCardInner');
    var env = document.getElementById('bdayEnvelope');
    if (inner) inner.classList.remove('is-flipped');
    if (env) env.style.display = 'inline-flex';
    isFlipped = false;
    clearTimeout(flipTimeout);
  }

  function currentPool() {
    var c = getCache(), cur = c && c.cur;
    var map = { lesson: 'ders', 'break': 'teneffus', ara: 'teneffus', lunch: 'ogle', free: 'bos' };
    return (cur && map[cur.kind]) || 'ders';
  }

  window.toggleBirthdayFlip = function (e) {
    if (e) e.stopPropagation();
    if (isFlipped) { closeCard(); return; }
    var inner = document.getElementById('liveCardInner');
    var env = document.getElementById('bdayEnvelope');
    if (!inner) return;

    var msg, ozel = getOzelMesaj();
    if (ozel) {
      msg = pick(ozel);
    } else {
      msg = pick(GENEL_MESAJLAR[currentPool()]);
      var name = getPType() === 'teacher' ? getName() : '';
      msg = msg.replace(/\[İsim\]/g, name || 'Öğretmenim');
    }
    document.getElementById('liveCardBackMsg').textContent = msg;
    inner.classList.add('is-flipped');
    if (env) env.style.display = 'none';
    isFlipped = true;
    clearTimeout(flipTimeout);
    flipTimeout = setTimeout(closeCard, 60000);
  };

  function injectEnhancements() {
    var card = document.getElementById('statusCard');
    if (!card) return;

    // 3D yapıyı bir kez kur: mevcut düğümleri TAŞIYORUZ (innerHTML kopyalamıyoruz → id'ler ve referanslar bozulmaz)
    if (!document.getElementById('liveCardInner')) {
      var container = document.createElement('div');
      container.className = 'live-card-container';
      var inner = document.createElement('div');
      inner.className = 'flip-card-inner';
      inner.id = 'liveCardInner';
      var front = document.createElement('div');
      front.className = 'flip-front';
      while (card.firstChild) front.appendChild(card.firstChild);
      var back = document.createElement('div');
      back.className = 'flip-back';
      back.onclick = window.toggleBirthdayFlip;
      back.innerHTML = '<i data-lucide="heart" class="w-8 h-8 mb-3" style="color:#FCD34D;width:32px;height:32px;margin-bottom:12px"></i>' +
                       '<p id="liveCardBackMsg" style="font-size:15px;font-style:italic;font-weight:600;line-height:1.6">...</p>' +
                       '<span style="margin-top:12px;font-size:11px;opacity:.7">kapatmak için dokun</span>';
      inner.appendChild(front);
      inner.appendChild(back);
      container.appendChild(inner);
      card.appendChild(container);
    }

    // Zarfı, sağ üstteki süre/isim kutusunun yanına koy (statusDur ile birlikte bir kapsayıcıya al)
    if (!document.getElementById('bdayEnvelope')) {
      var dur = document.getElementById('statusDur');
      if (!dur) return;
      var wrap = document.createElement('div');
      wrap.className = 'flex items-center gap-2';
      wrap.style.minWidth = '0';
      dur.parentNode.insertBefore(wrap, dur);
      wrap.appendChild(dur);
      var env = document.createElement('button');
      env.type = 'button';
      env.id = 'bdayEnvelope';
      env.className = 'envelope-icon';
      env.setAttribute('aria-label', 'Öğretmenler Günü mesajını aç');
      env.innerHTML = '<i data-lucide="mail" style="width:20px;height:20px"></i>';
      env.onclick = window.toggleBirthdayFlip;
      wrap.appendChild(env);
      if (window.lucide && lucide.createIcons) lucide.createIcons();
    }

    // Ders/teneffüs durumu veya profil değişince açık kartı kapat
    var c = getCache(), cur = c && c.cur;
    var state = (cur ? cur.kind + '_' + cur.s : 'none') + '|' + getPId();
    if (state !== lastState) {
      if (lastState !== null && isFlipped) closeCard();
      lastState = state;
    }
  }

  // --- 6. renderStatus'u sar (her saniye çağrılıyor; işlemler idempotent) ---
  var origRenderStatus = window.renderStatus;
  window.renderStatus = function () {
    if (typeof origRenderStatus === 'function') origRenderStatus.apply(this, arguments);
    try { applyDateBadge(); injectEnhancements(); } catch (e) { console.warn('24kasim:', e); }
  };

  // --- 7. İLK AÇILIŞ KONFETİSİ (günde bir kez) ---
  function triggerFirstOpen() {
    var key = 'ogretmenlergunu_' + new Date().toISOString().slice(0, 10);
    try { if (!FORCE && localStorage.getItem(key)) return; } catch (e) {}

    function show() {
      var done = false;
      var fire = function () {
        if (done) return; done = true;
        try { localStorage.setItem(key, '1'); } catch (e) {}
        if (window.confetti) {
          window.confetti({ particleCount: 200, spread: 90, origin: { y: .5 }, colors: ['#312E81', '#4F46E5', '#FCD34D', '#F472B6', '#34D399'] });
        }
        var splash = document.createElement('div');
        splash.id = 'teacherDaySplash';
        splash.innerHTML = '<div class="splash-text">24 Kasım<br><span style="color:#FCD34D">Öğretmenler Günü Kutlu Olsun!</span></div>';
        document.body.appendChild(splash);
        setTimeout(function () { if (splash.parentNode) splash.remove(); }, 5000);
      };
      if (window.confetti) return fire();
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';
      s.onload = fire;
      s.onerror = fire;                 // çevrimdışıysa konfetisiz de olsa yazı çıksın
      document.head.appendChild(s);
    }

    // Uygulamanın kendi açılış (logo) ekranı bitene kadar bekle (en fazla ~7 sn)
    var waited = 0;
    (function wait() {
      var sp = document.getElementById('splashScreen');
      var open = sp && sp.style.display !== 'none' && getComputedStyle(sp).display !== 'none';
      if (open && waited < 7000) { waited += 300; return setTimeout(wait, 300); }
      setTimeout(show, 400);
    })();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', triggerFirstOpen);
  else triggerFirstOpen();
})();
