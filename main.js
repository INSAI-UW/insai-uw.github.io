// main.js – warstwa ruchu. Treść stoi w HTML i nie czeka na ten plik.
// Pulpit (od 1081 px): sieć pod typografią (net.js, three.js), znak C1 z węzłów sieci (znak.js). Start „D”: najpierw
// sieć, potem fragmenty sieci odrywają się od niej i sklejają w znak; sieć zostaje niezależna.
// Telefon i tablet: znak C1 w rycinie tytułowej (rycina-tytulowa.js), ryciny Canvas 2D w treści (plates.js), bez three.js.
// Ponadto: płynne przewijanie (Lenis) ze strażnikiem ruchu, skok do kotwicy, postęp lektury i postęp w sekcjach,
// indeks dokumentu, paralaksa znaku, rysowanie linii osi.

const root = document.documentElement;
let DEV = null;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const mqRM = matchMedia('(prefers-reduced-motion: reduce)');
const mqDesk = matchMedia('(min-width: 1081px)');
const mqFine = matchMedia('(pointer: fine)');
const mqTouch = matchMedia('(hover: none) and (pointer: coarse)');
let RM = mqRM.matches || !!DEV?.rm;
let still = root.classList.contains('still');
const moving = () => !RM && !still && !DEV;
const idle = window.requestIdleCallback ? (f) => requestIdleCallback(f, { timeout: 400 }) : (f) => setTimeout(f, 60);
if (!RM && !still) root.classList.add('fx');

function probe(kind) {
  if (DEV && DEV.nogl) return false;
  try { const c = document.createElement('canvas'); const g = c.getContext(kind); if (g) g.getExtension('WEBGL_lose_context')?.loseContext(); return !!g; } catch (e) { return false; }
}

// ---------- znak C1 (znak.js): start „D”, znak odrywa się od sieci ----------
// ink: sterownik znaku (setStill, pulls).
// Sieć startuje, gdy tylko three jest gotowe (zegar sceny t0). Znak czeka ukryty (zasłona CSS do 8 s) na swój moduł
// i na narysowaną sieć (najdłużej NET_WAIT), potem gra D: grudki w sieci, odłączenie falami od A s zegara znaku.
// Bez sieci (brak WebGL 2, three niedostępne, ?sprzezenie=0) zostaje zatwierdzone C1 z rozproszenia w polu okładki.
// Telefon: „siecią” jest rycina tytułowa (rycina-tytulowa.js wchodzi od razu, jej api ma kształt netApi).
// Statyczny znak tylko wtedy, gdy moduł się nie wczyta albo dojdzie po zdjęciu zasłony.
let ink = null;
const stage = $('[data-ink]');
// D_A: pierwsza fala na zegarze sieci (pulpit 1,5 s: czysta sieć >= 0,6 s przed oderwaniem; telefon 0,9 s);
// D_A_MIN: najkrótszy czas od startu znaku (pulpit: węzły wchodzą w tonie sieci przez 0,5 s, potem 0,45 s zbierania)
const NET_WAIT = 3000, D_A = [0.9, 1.5], D_A_MIN = [0.45, 1.2];
const netReady = () => new Promise((res) => {   // sieć narysowana (scena WebGL) albo false po NET_WAIT
  const t = performance.now();
  const check = () => { if (scene && isGL && sceneDrawn) return res(true); if (performance.now() - t > NET_WAIT || (!startingNet && !scene && performance.now() - t > 500)) return res(false); setTimeout(check, 50); };
  check();
});
const inkDone = new Promise((done) => {
  if (!stage) { root.classList.remove('ink-wait'); return done(); }
  (async () => {
    try {
      const m = await import('./znak.js');
      await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 300))]);   // pole okładki mierzone z krojem
      // start D, gdy sieć stoi: pulpit = scena three, telefon = rycina tytułowa (bez niej i przy ruchu zatrzymanym:
      // C1 z rozproszenia)
      const wantD = !RM && !still && scrollY < 4 && (!mqDesk.matches || probe('webgl2'));
      let dnet = null, tn = 0;   // tn: zegar sieci w chwili startu znaku
      if (wantD && mqDesk.matches && (DEV || (await netReady()))) { dnet = netApi; tn = DEV ? 0 : (performance.now() - t0) / 1000; }
      else if (wantD && !mqDesk.matches) {
        const api = await Promise.race([plateP, new Promise((r) => setTimeout(r, NET_WAIT, null))]);
        if (api) { dnet = api; tn = DEV ? 0 : api.t0 ? (performance.now() - api.t0) / 1000 : 99; }
      }
      const t = performance.now();
      ink = m.initZnak(stage, { still: RM || still, lite: !mqDesk.matches, desk: mqDesk.matches, field: measureEl ? heroField : null,
        net: dnet, A: Math.max(D_A[+mqDesk.matches] - tn, D_A_MIN[+mqDesk.matches]), plate: $('.plate-hero'), t: DEV ? DEV.t : null, late: t > 7800 });   // zasłona znaku: 8 s (CSS)
      performance.measure('insai:znak', { start: t });
    } catch (e) { /* bez modułu zostaje znak SVG */ }
    root.classList.remove('ink-wait'); done();
    dirty = true; schedule();
  })();
});

// ---------- podkreślenia atramentem ----------
const inks = $$('.ink');
document.fonts.ready.then(() => {
  if (!inks.length || !probe('webgl')) return;
  import('./ink.js').then((m) => m.inkStrips(inks)).catch(() => null);
});
// Obserwator uzbrajany także po wznowieniu ruchu: bez niego podkreślenia pod klasą fx zostałyby ukryte na stałe.
let inkIO = null;
function armInks() {
  if (inkIO || !root.classList.contains('fx')) return;
  inkIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('on'); inkIO.unobserve(e.target); } }), { rootMargin: '0px 0px -38% 0px' });
  inks.forEach((el) => { if (!el.classList.contains('on')) inkIO.observe(el); });
}
armInks();

// ---------- indeks dokumentu: bieżąca sekcja, postęp, spis ----------
// Pulpit od 1081 px: indeks w lewych kolumnach siatki, spis stale rozwinięty (1081–1279 zwarty, nazwy po
// najechaniu, fokusie albo „Spis treści”). Telefon i tablet: pasek pod okładką z rozwijanym spisem.
const secs = $$('[data-sec]');
const pgSec = $('[data-pg-sec]');
const pgNo = $('[data-pg-no]');
const menuLinks = $$('.menu a');
const prog = $('.pg-prog');
const menu = $('.pg-menu');
const pagina = $('.pagina');
const paginaIn = $('.pagina-in');
const opener = $('.pg-open');
const segs = secs.map(() => prog.appendChild(document.createElement('s')));
const items = secs.map((s) => menuLinks.find((a) => a.hash === '#' + s.id)?.parentElement);
const two = (n) => String(n).padStart(2, '0');
let isPinned = false, currentSectionId = null, lastF = '';
function topBar() {   // dolna krawędź paska przy górnej krawędzi okna; na pulpicie indeks stoi z boku, więc 0
  const r = paginaIn.getBoundingClientRect();
  // pasek stoi w przepływie pod okładką i przykleja się dopiero przy sekcji 01
  return r.width > r.height && r.top < 2 * r.height ? Math.max(0, r.bottom) : 0;
}
function orientation() {
  const pin = mqDesk.matches;
  if (pin !== isPinned) {
    isPinned = pin;
    // Nie chowaj linku, który właśnie ma fokus.
    if (pin || !menu.contains(document.activeElement)) menu.open = pin;
    if (!pin) names(false);
  }
  // linia bieżącej sekcji na ok. 1/3 wysokości okna pod paskiem: sekcja staje się bieżąca, gdy czytelnik widzi już jej
  // nagłówek w górnej części okna (przy 24 px spis spóźniał się o jedną sekcję); skok z linku stawia górę sekcji tuż pod
  // paskiem. Na ostatnich 2/3 okna drogi linia zjeżdża płynnie do dolnej krawędzi, więc krótka ostatnia sekcja dochodzi do
  // końca osi postępu bez skoku (atEnd niżej zostaje jako zabezpieczenie)
  const base = topBar() + Math.max(24, Math.round(innerHeight * 0.33)), rest = root.scrollHeight - (innerHeight + scrollY);
  const line = base + (innerHeight - base) * Math.min(1, Math.max(0, 1 - rest / Math.max(1, innerHeight - base)));
  const tops = secs.map((s) => s.getBoundingClientRect().top);
  let ci = -1;
  tops.forEach((t, i) => { if (t <= line) ci = i; });
  const atEnd = secs.length && innerHeight + scrollY >= root.scrollHeight - 2;
  if (atEnd) ci = secs.length - 1;
  const current = ci < 0 ? null : secs[ci];
  // postęp w obrębie każdej sekcji: odcinki paska (telefon) i włosowa oś indeksu (pulpit)
  const n = secs.length;
  const f = tops.map((t, i) => {
    if (atEnd || i < ci) return 1;
    if (i > ci) return 0;
    const end = i + 1 < n ? tops[i + 1] : secs[i].getBoundingClientRect().bottom;
    return Math.min(1, Math.max(0, (line - t) / Math.max(1, end - t)));
  });
  const key = f.map((x) => x.toFixed(3)).join();
  if (key !== lastF) {
    lastF = key;
    f.forEach((x, i) => segs[i].style.setProperty('--f', x.toFixed(3)));
    const li = items[ci], h = li ? li.parentElement.offsetHeight || 1 : 1;
    pagina.style.setProperty('--q', li ? Math.min(1, (li.offsetTop + f[ci] * li.offsetHeight) / h).toFixed(4) : '0');
  }
  const id = current ? current.id : '';
  if (id === currentSectionId) return;
  currentSectionId = id;
  pgSec.textContent = current ? current.dataset.sec : 'INSAI';
  pgNo.textContent = current ? two(ci + 1) : '';
  menuLinks.forEach((a) => current && a.hash === '#' + current.id ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current'));
}
// 1081–1279 px: przycisk „Spis treści” rozwija nazwy przy numerach (dotyk nie ma najechania)
function names(v) { pagina.classList.toggle('pg-names', v); opener.setAttribute('aria-expanded', String(v)); }
opener.addEventListener('click', () => names(!pagina.classList.contains('pg-names')));
document.addEventListener('click', (e) => { if (pagina.classList.contains('pg-names') && !pagina.contains(e.target)) names(false); });
menu.addEventListener('click', (e) => { if (!e.target.closest('a')) return; names(false); if (!isPinned) menu.open = false; });
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (pagina.classList.contains('pg-names')) { names(false); opener.focus(); }
  else if (isPinned && menu.matches(':hover, :focus-within')) pagina.classList.add('pg-quiet');
  else if (menu.open && !isPinned) { menu.open = false; menu.querySelector('summary').focus(); }
});
// WCAG 1.4.13: nazwy rozwinięte najechaniem albo fokusem zwija Escape bez ruchu wskaźnika; wracają po wyjściu z indeksu
menu.addEventListener('pointerleave', () => pagina.classList.remove('pg-quiet'));
pagina.addEventListener('focusout', (e) => { if (!menu.contains(e.relatedTarget)) pagina.classList.remove('pg-quiet'); });

// ---------- miernik przewijania: jeden odczyt na klatkę ----------
const hero = $('.hero');
const lines = $$('[data-timeline]');
const tls = $$('.tl');
const title2 = $$('.title .t2, .title .t3, .title .t4');
function meter() {
  orientation();
  const y = scrollY, vh = innerHeight;
  if (root.classList.contains('fx')) {
    for (const ol of lines) {   // linia osi od 72 % do 62 % wysokości okna
      const r = ol.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh * 0.72 - r.top) / Math.max(1, r.height - vh * 0.1)));
      ol.style.setProperty('--d', p.toFixed(4));
    }
    for (const li of tls) if (!li.classList.contains('on') && li.getBoundingClientRect().top < vh * 0.72) li.classList.add('on');
    if (mqDesk.matches && moving()) {   // wcięcia tytułu domykają się, znak zostaje w tyle (paralaksa 0,18)
      const p = Math.min(1, Math.max(0, y / Math.max(1, hero.offsetHeight)));
      title2.forEach((l) => { l.style.transform = `translateX(${(-parseFloat(getComputedStyle(l).paddingLeft) * p).toFixed(1)}px)`; });
      if (stage) stage.style.transform = `translateY(${(p * 18).toFixed(2)}%)`;
    }
  }
  coverLight(null);
}

// ---------- sieć (pulpit) ----------
let scene = null, isGL = false, anchors = [], CAM = null, t0 = performance.now(), sceneDrawn = false;
let pointer = [9, 9], pTarget = [9, 9], lens = 0, lensTarget = 0, dirty = true, running = false;
let inView = true, lastAct = performance.now(), driftAmp = 1, lastKey = '', lastFrame = 0;
const IDLE_AFTER_S = 5.5; // po tym czasie wygaszamy dryf; do 0 dochodzi w ok. 0,9 s
let raf = 0, startingNet = null;
const canvas = $('#net');
const measureEl = $('#o-kole .in');
// Pole sceny: kolumny siatki za kolumną tekstu, od jej prawej krawędzi + --gap do marginesu --m.
function sceneField() {
  const cs = getComputedStyle(root), gap = parseFloat(cs.getPropertyValue('--gap')) || 24, m = parseFloat(cs.getPropertyValue('--m')) || 56;
  const r = measureEl.getBoundingClientRect();
  return [Math.round(r.left + measureEl.offsetWidth + gap), Math.round(innerWidth - m)];
}
// Pole okładki: od prawej krawędzi znaku, tytułu i zdania (bez przesunięć paralaksy) + --gap do marginesu.
function heroField() {
  const gap = parseFloat(getComputedStyle(root).getPropertyValue('--gap')) || 24, m = parseFloat(getComputedStyle(root).getPropertyValue('--m')) || 56;
  let right = 0;
  for (const el of $$('.hero-main .mark-stage, .title span, .hero-main .lede')) {
    const t = getComputedStyle(el).transform, tx = t && t !== 'none' ? new DOMMatrixReadOnly(t).m41 : 0;
    let r = el.getBoundingClientRect().right;
    if (el.tagName !== 'DIV') { const rg = document.createRange(); rg.selectNodeContents(el); r = rg.getBoundingClientRect().right; }
    right = Math.max(right, r - tx);
  }
  return [Math.round(right + gap), Math.round(innerWidth - m)];
}
function centerX() {
  if (!measureEl) return Math.round(innerWidth * 0.75);
  const [fl, fr] = sceneField();
  return Math.round((fl + fr) / 2);
}
// Maska sceny sprofilowana do treści (pulpit): kanwa sieci leży w warstwie .veil rozciągniętej na cały dokument
// (przyklejona, position: sticky), a maska tej warstwy ma otwory pod każdym wierszem tekstu, znakiem, mapą uchwały,
// osią czasu, kreską nad nagłówkiem i pasem indeksu, z zapasem HALO_PAD i miękkim brzegiem (rozmycie HALO_BLUR).
// Sieć płynie w wolnych miejscach, także obok krótkich wierszy i nad nagłówkami, i gaśnie przy brzegu, zanim dojdzie
// do liter. Maska ma układ dokumentu, więc przewija się razem ze stroną bez pracy w klatce; liczona raz i przy
// zmianie rozmiaru (measure). Maskowana jest kanwa, nie papier: poza siecią strona zostaje czystym papierem.
const veil = $('.veil');
const HALO_PAD = 24, HALO_BLUR = 7, MASK_K = 0.25;
// sekcje 03 i 04 (Członkostwo, Zarząd): bloki tekstu wycięte z maski w całości, z tym samym miękkim brzegiem z czterech
// stron (BLOK_PAD, BLOK_BLUR)
const BLOK_PAD = 32, BLOK_BLUR = 11;   // zapas i rozmycie w px, rozdzielczość maski wobec dokumentu
// przy tytule i zdaniu wstępnym okładki szerszy, miękki otwór (oddech przy tytule, skala sceny bez zmian): w pasie 80 px
// od końca każdego wiersza krycie sieci <= 0,35, pierwszy w pełni widoczny węzeł >= 48 px od ostatniej litery
const SOFT_PAD = 96, SOFT_BLUR = 30;
let HALO_R = [];   // otwory maski w układzie dokumentu: [l, t, r, b, zapas z rozmyciem] (netApi.free)
function halos() {
  if (!veil || !canvas || !mqDesk.matches) return;
  if (canvas.parentNode !== veil) veil.prepend(canvas);
  const t = performance.now(), sx = scrollX, sy = scrollY, R = [], RS = [], RG = [];
  let soft = false, blok = false;
  const add = (l, t, r, b) => { if (r - l > 0.5 && b - t > 0.5) (blok ? RG : soft ? RS : R).push([l + sx, t + sy, r + sx, b + sy]); };
  const shiftOf = (el) => { const t = getComputedStyle(el).transform; return t && t !== 'none' ? new DOMMatrixReadOnly(t) : null; };
  for (const box of $$('.hero-main, .hero .docline, main')) {
    const walk = document.createTreeWalker(box, NodeFilter.SHOW_TEXT, { acceptNode: (n) => n.data.trim() && !n.parentElement.closest('script, style, [hidden]') ? 1 : 3 });
    for (let n; (n = walk.nextNode());) {
      const rg = document.createRange(); rg.selectNodeContents(n);
      // wiersze tytułu przesuwają się w lewo o swoje wcięcie: otwór obejmuje oba położenia
      const span = n.parentElement.closest('.title span'), m = span && shiftOf(span), pl = span ? parseFloat(getComputedStyle(span).paddingLeft) : 0;
      soft = !!n.parentElement.closest('.hero .title, .hero .lede');
      blok = !!n.parentElement.closest('#plany');
      for (const q of rg.getClientRects()) { const dx = m ? m.m41 : 0; add(q.left - dx - pl, q.top, q.right - dx, q.bottom); }
    }
  }
  soft = false; blok = false;
  // grafika treści: znak (paralaksa w dół do 18 % wysokości), mapa uchwały, oś czasu, kreska i numer nad nagłówkiem
  for (const el of $$('.hero .mark-stage, .lep, .timeline')) {
    const q = el.getBoundingClientRect(), m = shiftOf(el), dy = m ? m.m42 : 0;
    if (el.classList.contains('timeline')) add(q.left, q.top, q.left + 14, q.bottom);
    else add(q.left, q.top - dy, q.right, q.bottom - dy + (el.classList.contains('mark-stage') ? q.height * 0.18 : 0));
  }
  for (const h of $$('.sec h2')) { if (h.closest('#zarzad')) continue; const q = h.getBoundingClientRect(); blok = !!h.closest('#plany'); add(q.left, q.top - 6, q.left + 96, q.top + 8); }
  blok = false;
  const RK = [];   // kreska i numer nad nagłówkiem #zarzad: w bloku z rampą jak bloki (bez poziomego cięcia sceny)
  { const h = $('#zarzad h2'), q = h && h.getBoundingClientRect(); if (q) RK.push([q.left + sx, q.top - 6 + sy, q.left + 96 + sx, q.top + 8 + sy]); }
  // Wycięcie BLOKÓW tekstu (sprofilowane jak otwory wierszy): nagłówek, akapity i komórki szpalt #plany (RB),
  // a nagłówek, akapity i lista #zarzad (lista razem z prowadnicami i funkcjami jako jeden blok) oraz bloki końca
  // #dzialalnosc (RBS). Blok = obrys jego wierszy tekstu (lista: cały element). Puste miejsca między
  // blokami i sekcjami zostają otwarte: formacja stoi tam w pełnym kryciu.
  const RB = [], RBS = [];
  {
    const pt = $('#plany').getBoundingClientRect().top;
    const box = (el) => { if (el.matches('ul')) return el.getBoundingClientRect(); const rg = document.createRange(); rg.selectNodeContents(el); let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
      for (const q of rg.getClientRects()) { if (q.width < 1 || q.height < 1) continue; l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom); } return { left: l, top: t, right: r, bottom: b }; };
    for (const el of $$('#plany .in > h2, #plany .plans > p, #zarzad .in > h2, #zarzad .in > p, #zarzad .in > ul, #dzialalnosc .in :is(h2, h3, p, li, dt, dd)')) {
      const q = box(el);
      if (!(q.right > q.left) || (el.closest('#dzialalnosc') && q.bottom < pt - innerHeight)) continue;
      (el.closest('#plany') ? RB : RBS).push([q.left + sx, q.top + sy, q.right + sx, q.bottom + sy]);
    }
  }
  // indeks jest przyklejony: pas na całej drodze, którą przebywa (komórka siatki), a w szerokości jego bloku
  const pi = paginaIn.getBoundingClientRect(), pc = pagina.getBoundingClientRect();
  if (pi.width < pi.height) add(pi.left, pc.top, pi.right, pc.bottom);
  veil.style.height = '0px';
  const W = root.scrollWidth, H = root.scrollHeight, k = MASK_K;
  veil.style.height = H + 'px';
  const hc = document.createElement('canvas'), mc = document.createElement('canvas');
  hc.width = mc.width = Math.ceil(W * k); hc.height = mc.height = Math.ceil(H * k);
  const h = hc.getContext('2d'), m = mc.getContext('2d');
  h.fillStyle = '#000';
  for (const [l, t, r, b] of R) { h.beginPath(); h.roundRect((l - HALO_PAD) * k, (t - HALO_PAD) * k, (r - l + 2 * HALO_PAD) * k, (b - t + 2 * HALO_PAD) * k, 12 * k); h.fill(); }
  m.fillStyle = '#000'; m.fillRect(0, 0, mc.width, mc.height);
  m.globalCompositeOperation = 'destination-out'; m.filter = `blur(${HALO_BLUR * k}px)`; m.drawImage(hc, 0, 0);
  if (RS.length) {   // tytuł i zdanie wstępne: szerszy zapas i miękki brzeg
    const hs = document.createElement('canvas'); hs.width = hc.width; hs.height = hc.height;
    const g = hs.getContext('2d'); g.fillStyle = '#000';
    for (const [l, t, r, b] of RS) { g.beginPath(); g.roundRect((l - SOFT_PAD) * k, (t - SOFT_PAD) * k, (r - l + 2 * SOFT_PAD) * k, (b - t + 2 * SOFT_PAD) * k, 48 * k); g.fill(); }
    m.filter = `blur(${SOFT_BLUR * k}px)`; m.drawImage(hs, 0, 0);
  }
  // bloki wycięte, ta sama rampa ze wszystkich czterech stron każdego bloku: pełne krycie sceny dopiero >= 48 px od
  // najbliższej litery (BLOK_PAD, rozmycie BLOK_BLUR); jeden obraz dla wszystkich
  // bloków (jedno przejście: bez podwójnego wygaszenia na styku)
  const GB = [...RG, ...RB, ...RBS, ...RK];
  if (GB.length) {
    const sh = document.createElement('canvas'); sh.width = hc.width; sh.height = hc.height;
    const s2 = sh.getContext('2d'); s2.fillStyle = '#000';
    for (const [l, t, r, b] of GB) { s2.beginPath(); s2.roundRect((l - BLOK_PAD) * k, (t - BLOK_PAD) * k, (r - l + 2 * BLOK_PAD) * k, (b - t + 2 * BLOK_PAD) * k, 12 * k); s2.fill(); }
    m.filter = `blur(${BLOK_BLUR * k}px)`; m.drawImage(sh, 0, 0); m.filter = 'none';
    // wycięcie: w bloku i piksel maski wokół niego krycie dokładnie 0 (rozmyty brzeg zostawia tam ok. 0,5 %, a skalowanie
    // maski rozlewa go o piksel maski w głąb bloku)
    for (const [l, t, r, b] of GB) { const x0 = Math.floor(l * k) - 1, y0 = Math.floor(t * k) - 1; m.fillRect(x0, y0, Math.ceil(r * k) + 1 - x0, Math.ceil(b * k) + 1 - y0); }
  }
  HALO_R = [...R.map((q) => [...q, HALO_PAD + 2 * HALO_BLUR]), ...RS.map((q) => [...q, SOFT_PAD + SOFT_BLUR]), ...GB.map((q) => [...q, BLOK_PAD + 2 * BLOK_BLUR])];
  // synchronicznie, żeby maska i wysokość warstwy zmieniały się razem (bez klatki sceny pod literami)
  veil.style.setProperty('--veil-mask', `url(${mc.toDataURL()})`);
  performance.measure('insai:tlo', { start: t });
}
function measure() {
  halos();
  if (!CAM) return;
  const vh = innerHeight;
  anchors = $$('[data-cam]').filter((el) => CAM[el.dataset.cam]).map((el) => {
    const key = el.dataset.cam;
    const top = el.getBoundingClientRect().top + scrollY;
    // formacje 5 i 6 (ikony czytane w całości): cała sylwetka między maską tekstu a prawą krawędzią okna; maska sięga
    // HALO_PAD + rozmycie za prawą krawędź kolumny tekstu, zapas od niej co najmniej 24 px (+2 px zaokrągleń);
    // kadr liczy oba skrajne położenia obrotu ±7° (fitCam)
    // 03: kadr na rdzeń (koło i obręcze pąków); główna obręcz cała w oknie, obręcze pąków przy 1180–1340 najwyżej 10 % za
    // prawą krawędzią, szypułki, mosty i partnerzy najwyżej 12 % za prawą, górną albo dolną (limit 15 %);
    // 04: spad do 12 % sylwetki za prawą, górną i dolną krawędź. Od strony tekstu zawsze >= 24 px od maski.
    const gapPx = parseFloat(getComputedStyle(root).getPropertyValue('--gap')) || 24, fl0 = sceneField()[0] - gapPx + HALO_PAD + 2 * HALO_BLUR + 26, f5 = CAM[key].f;
    // 03 (tunele): rdzeń na 51 % szerokości okna w sumie obu skrajnych obrotów (ok. 45 % w każdym), środkiem na 67 %, także pod tekstem sekcji; lewa granica = spis + 24 px
    const pi = paginaIn.getBoundingClientRect(), toc = pi.width < pi.height ? pi.right + 24 : 24;
    const whole = FORMS && f5 >= 5 ? (f5 === 5 ? { srodek: true, l: toc, cw: 0.51 * innerWidth, cx: 0.67 * innerWidth, h: vh - 24, at: 0.5, all: true, core: FORMS.build().core5, ring: FORMS.build().ring5, extra: FORMS.build().env5, spad: 0.13 }
      : { l: fl0, r: innerWidth, h: vh, fill: 1, margin: 0, at: 0.5, all: true, bleed: 0.11 }) : null;
    return { key, y: key === 'hero' ? 0 : Math.max(0, top - vh * (ANCHOR_AT[key] ?? 0.55)), ...(FORMS ? fitCam(key, CAM[key], el, whole) : CAM[key]) };
  });
  for (const [key, [sel, at]] of Object.entries(HOLD)) {
    const an = anchors.find((a) => a.key === key), txt = $(sel);
    if (an && txt) anchors.push({ ...an, y: Math.max(an.y, txt.getBoundingClientRect().bottom + scrollY - vh * at) });
  }
  // Pas między Działalnością a Członkostwem: bez tekstu, więc kadr ub stawia w nim całą uchwałę
  // (dziewięć stron formacji dokumentu) na środku pasa, także nad kolumną tekstu; kotwica liczona z geometrii pasa.
  const g0 = $('#dzialalnosc .in'), g1 = $('#plany h2');
  if (FORMS && g0 && g1) {
    const top = g0.getBoundingClientRect().bottom + scrollY, dol = g1.getBoundingClientRect().top + scrollY;
    if (dol - top > 120) anchors.push({ key: 'ub', y: Math.max(0, (top + dol) / 2 - vh * 0.55), ...fitCam('ub', CAM_UB, null, { l: measureEl.getBoundingClientRect().left, r: innerWidth - (parseFloat(getComputedStyle(root).getPropertyValue('--m')) || 56), h: dol - top }) });
  }
  anchors.sort((a, b) => a.y - b.y);
}
// Członkostwo (formacja 5, schemat do odczytania): rdzeń w oknie, spad tylko szypułek, mostów i partnerów. Kadr stoi w miejscu przez
// całą wysokość tekstu sekcji: od nagłówka na 0,45 wysokości okna do końca tekstu na tej samej wysokości (druga
// kotwica z tym samym kadrem). Zarząd rusza później (nagłówek na 0,3), żeby przejście miało ok. 260-300 px drogi.
const ANCHOR_AT = { plany: 0.45, z: 0.3, h0: 0.35 };
// Postój kadru (formacje 5 i 6): koniec tekstu sekcji na tej wysokości okna kończy postój
const HOLD = { plany: ['#plany .in', 0.45], z: ['#zarzad .in', 0.55] };
// Uchwała w całości, z ukosa i z góry, żeby czytały się złożenia stron (look: środek formacji dokumentu).
const CAM_UB = { f: 2, pos: [-14, 9, 34], look: [0, -0.4, 0] };
const UB_FILL = 0.86, UB_MARGIN = 56;   // szerokość formacji wobec pasa; odstęp od tekstu nad i pod pasem
// Kadr kamery: formacja zaczyna się przy lewej granicy pola sceny (na okładce: pola okładki), przy zbliżeniu
// ognisko stoi w lewej części pola; szerokość to SCENE_SCALE x szerokość pola, więc formacja wychodzi „do spadu”
// za prawą krawędź okna, a na okładce także za górną i dolną.
// Pod litery nie wchodzi nigdy: tam maska sceny ma otwory sprofilowane do treści (halos()). Przy zbliżeniach
// (u9: strona, węzły osi) liczy się ognisko wokół punktu patrzenia; formacje wydłużone (dokument i oś z daleka)
// mają co najmniej SCENE_MIN_H wysokości okna, żeby czytały się jako rysunek, nie pasek. W sekcjach formacja
// mieści się w wysokości okna i stoi na paśmie nagłówka. Zmienia tylko pos i look kotwic z forms.rig().
const SCENE_SCALE = 1.7;
const SCENE_MIN_H = 0.2 * SCENE_SCALE, SCENE_EDGE = 48, SCENE_FOCUS_X = 0.4;   // wysokość minimalna rośnie ze skalą; 48 px = brzeg maski (36) + 12
// Pochylenie kadru w stronę tekstu (ułamek szerokości pola), per kotwica. Działalność: rycina dokumentu
// wypełnia pustkę między kolumną tekstu a prawą krawędzią; zbliżenie u9 ma ognisko na 0,4 - 0,1 = 0,3 pola.
const SCENE_LEAN = { u0: 0.12, u9: 0.1, ua: 0.12 };
let FORMS = null;
const v3 = { sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; } };
function fitCam(key, c, el, band) {
  if (key === 'end') return c;   // kadr pod granatową okładką: nie widać go
  const F = FORMS.build().F[c.f], H = innerHeight, hero = key === 'hero';
  const doc = sceneField(), cx = Math.round((doc[0] + doc[1]) / 2), fpx = (H / 2) / Math.tan(Math.PI / 10);   // środek rzutu jak w centerX(); pionowe pole widzenia 36°
  const [fl, fr] = band ? [band.l, band.r] : hero ? heroField() : doc;
  const distK = FORMS.frame(innerWidth, H, cx).dist;
  const near = c.par ? 5.2 : c.kn ? 5 : 0;   // zbliżenie: ognisko wokół punktu patrzenia
  const pts = [], coreOf = band && band.core ? new Uint8Array(F.length / 3) : null;
  if (coreOf) { for (const i of band.core) coreOf[i] = 1; if (band.ring) for (const i of band.ring) coreOf[i] = 2; }   // 2: główna obręcz, 1: obręcze pąków
  // bryły 5 i 6 obracają się w postoju o ±7° wokół pionu (net.js, st.spin): kadr obejmuje oba skrajne położenia
  const spins = band && band.all && c.f >= 5 ? [-7, 0, 7].map((a) => (a * Math.PI) / 180) : [0];
  // band.extra: punkty spoza formacji, które też wyznaczają kadr (03: punkty mostów z forms.js, env5)
  for (const a of spins) {
    const ca = Math.cos(a), sa = Math.sin(a);
    for (const [P, own] of [[F, true], [(band && band.extra) || [], false]]) for (let i = 0; i < P.length; i += 3) {
      const x = P[i] * ca + P[i + 2] * sa, z = -P[i] * sa + P[i + 2] * ca;
      if (!near || Math.hypot(x - c.look[0], P[i + 1] - c.look[1], z - c.look[2]) <= near) pts.push([x, P[i + 1], z, own && coreOf ? coreOf[i / 3] : own ? 1 : 0]);
    }
  }
  if (pts.length < 3) return c;
  const r = el && el.getBoundingClientRect();
  const yc = band ? H * (band.at ?? 0.55) : hero ? r.top + scrollY + r.height / 2 : H * 0.55 + Math.min(r.height, 160) / 2;
  const V0 = v3.mul(v3.sub(c.pos, c.look), distK), lean = SCENE_LEAN[key] || 0;
  let L = c.look.slice(), s = 1;
  const box = () => {
    const C = v3.add(L, v3.mul(V0, s)), fw = v3.norm(v3.sub(L, C)), rt = v3.norm(v3.cross(fw, [0, 1, 0])), up = v3.cross(rt, fw);
    const xs = [], ys = [];
    let ax0 = Infinity, ax1 = -Infinity, ay0 = Infinity, ay1 = -Infinity, rx1 = -Infinity;   // cała sylwetka (od strony tekstu liczy się ona, nie tylko rdzeń); rx1: prawy brzeg głównej obręczy
    for (const p of pts) { const q = v3.sub(p, C), d = v3.dot(q, fw); if (d < 0.5) continue; const x = cx + v3.dot(q, rt) / d * fpx, y = H / 2 - v3.dot(q, up) / d * fpx;
      ax0 = Math.min(ax0, x); ax1 = Math.max(ax1, x); ay0 = Math.min(ay0, y); ay1 = Math.max(ay1, y); if (!p[3]) continue; if (p[3] === 2) rx1 = Math.max(rx1, x); xs.push(x); ys.push(y); }
    xs.sort((a, b) => a - b); ys.sort((a, b) => a - b);
    const all = near || (band && band.all), lo = all ? 0 : Math.floor(xs.length * 0.01), hi = all ? xs.length - 1 : Math.ceil(xs.length * 0.99) - 1;   // bez pojedynczych odstających węzłów (ikony 5 i 6: wszystkie)
    return { x0: band && band.core ? Math.min(ax0, xs[lo]) : xs[lo], x1: xs[hi], y0: ys[lo], y1: ys[hi], cx0: xs[lo], ax0, ax1, ay0, ay1, rx1, ah: ay1 - ay0, rt, up, d: Math.hypot(...V0) * s };
  };
  // Ułożenie: formacja z daleka zaczyna się przy lewej granicy pola, zbliżenie ma ognisko w lewej części pola
  // (SCENE_FOCUS_X). Przesunięcie jest tłumione, a wynik to najlepszy z przebiegów: przy długich formacjach
  // oglądanych ukośnie (oś z daleka) perspektywa potrafi przestrzelić i wynieść formację poza okno.
  const place = () => {
    const b = box(), h = b.y1 - b.y0, yt = band || hero || h > 0.92 * H ? yc : Math.min(Math.max(yc, 0.04 * H + h / 2), 0.96 * H - h / 2);
    const dx = band && band.srodek ? (b.cx0 + b.x1) / 2 - band.cx : band ? (band.bleed || band.core ? b.x0 - fl : (b.x0 + b.x1 - fl - fr) / 2) : near ? (b.x0 + b.x1) / 2 - (fl + (SCENE_FOCUS_X - lean) * (fr - fl)) : b.x0 - (fl + SCENE_EDGE - lean * (fr - fl)), dy = (b.y0 + b.y1) / 2 - yt;
    return { b, dx, dy, err: Math.abs(dx) + Math.abs(dy) };
  };
  let best = null;
  for (let it = 0; it <= 8; it++) {
    if (it < 8) {
      const b = box(), bw = b.x1 - b.x0, bh = b.y1 - b.y0;
      // pas: formacja cała w pasie (szerokość UB_FILL, wysokość pasa bez odstępów); pozostałe kadry: SCENE_SCALE i SCENE_MIN_H
      const kb = band && band.bleed ? 1 / (1 - band.bleed) : 1;   // spad: sylwetka większa od pola o najwyżej bleed
      let g = band ? Math.min(kb * (band.fill ?? UB_FILL) * (fr - fl) / bw, kb * (band.h - 2 * (band.margin ?? UB_MARGIN)) / bh) : Math.min(Math.max(SCENE_SCALE * (fr - fl) / bw, SCENE_MIN_H * H / bh), hero ? Infinity : 0.92 * H / bh);
      // 03: kadr na rdzeń (koło z pąkami) od strony tekstu (lewy brzeg całej sylwetki na fl): główna obręcz cała w oknie
      // (r), obręcze pąków za prawą krawędzią najwyżej o budSpad szerokości rdzenia, szypułki, mosty i partnerzy za prawą
      // krawędzią najwyżej o spad szerokości sylwetki, a za górną albo dolną o spad wysokości (z obrotem ±7°)
      if (band && band.core) g = Math.min((fr - fl) / (b.rx1 - b.x0), (fr - fl) / ((1 - (band.budSpad || 0)) * bw), (innerWidth - fl) / ((1 - band.spad) * (b.ax1 - b.x0)),
        (band.h - 2 * (band.margin ?? 0)) / bh, H / ((1 - 2 * band.spad) * b.ah));
      // 03 (tunele): rdzeń (koło z pąkami) szeroki na band.cw, środkiem w band.cx, także pod tekstem
      // sekcji (bloki tekstu wycięte z maski); lewy brzeg całej sylwetki nie wchodzi na spis (band.l), orbita i mosty wychodzą za prawą,
      // górną i dolną krawędź najwyżej o spad swojej sylwetki; skala liczona wokół środka rdzenia
      if (band && band.srodek) {
        const ccx = (b.cx0 + b.x1) / 2, ccy = (b.y0 + b.y1) / 2, aw = b.ax1 - b.ax0, ahh = b.ay1 - b.ay0, sp = band.spad;
        const cR = b.ax1 - ccx - sp * aw, cT = ccy - b.ay0 - sp * ahh, cB = b.ay1 - ccy - sp * ahh;
        g = Math.min(band.cw / bw, (band.cx - band.l) / Math.max(1, ccx - b.ax0), cR > 0 ? (innerWidth - band.cx) / cR : Infinity,
          cT > 0 ? (H * band.at) / cT : Infinity, cB > 0 ? (H * (1 - band.at)) / cB : Infinity, band.h / bh);
      }
      s = Math.min(4, Math.max(0.2, s / g));
    }
    const p = place();
    if (!best || p.err < best.err) best = { err: p.err, L: L.slice(), s };
    if (it < 8) L = v3.add(L, v3.add(v3.mul(p.b.rt, 0.8 * p.dx * p.b.d / fpx), v3.mul(p.b.up, -0.8 * p.dy * p.b.d / fpx)));
  }
  L = best.L; s = best.s;
  const b = box();
  return { ...c, look: L, pos: v3.add(L, v3.mul(V0, s / distK)), fit: s, fitBox: [b.x0, b.y0, b.x1, b.y1].map(Math.round), field: [fl, fr] };
}
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
// ---------- start D: sieć dla znak.js ----------
// Węzły sieci na ekranie w bieżącej klatce (px okna), sąsiedzi w sieci (krawędzie formacji pola), piasty i maska.
// Odbicia węzłów po zerwaniu nici (ink.pulls) trafiają do sceny jako st.bounce (net.js przelicza je na świat).
const HERO_A = 0.85;   // stan końcowy przy tytule lżejszy, w treści pełne krycie
// Kursor po wejściu: markEnd = koniec wejścia znaku (zdarzenie znak-koniec) albo chwila, gdy znak nie gra wejścia;
// wpływ kursora narasta krokiem krytycznie tłumionym 1 - (1 + x) e^-x, x = t / LENS_TAU (95 % po ok. 1,9 s)
const LENS_TAU = 0.4;
let markEnd = null;
const critical = (x) => (x <= 0 ? 0 : 1 - (1 + x) * Math.exp(-x));
// tryb klatek (DEV.kursor, ułamki okna): kursor na stałe, a bramka kursora liczy się z zegara klatek (koniec
// wejścia znaku): pomiar włączania kursora na czasie deterministycznym
const KURSOR = DEV && DEV.kursor;
if (KURSOR) { pointer = [2 * +KURSOR[1] - 1, 1 - 2 * +KURSOR[2]]; pTarget = pointer.slice(); }
if (stage) stage.addEventListener('znak-koniec', () => { markEnd = performance.now(); schedule(); });
inkDone.then(() => { if (!ink || (ink.t0 == null && !ink.waiting)) markEnd = markEnd ?? performance.now(); });
let NBRS = null;
const netApi = {
  get count() { return FORMS ? FORMS.N : 0; },
  get hubs() { return FORMS ? Array.from(FORMS.build().hubs) : []; },
  nbrs(id) {
    if (!NBRS && FORMS) { const E = FORMS.build().E.net; NBRS = Array.from({ length: FORMS.N }, () => []); for (let q = 0; q < E.length; q += 2) { NBRS[E[q]].push(E[q + 1]); NBRS[E[q + 1]].push(E[q]); } }
    return NBRS ? NBRS[id] : [];
  },
  at(ids) {
    if (!(sceneDrawn && scene && scene.screen && isGL && root.classList.contains('net-on'))) return null;
    const r = canvas.getBoundingClientRect();
    return scene.screen(ids).map(([x, y, ok]) => [x + r.left, y + r.top, ok]);
  },
  // czy punkt okna leży poza otworami maski (węzeł widoczny): prostokąty halos() z zapasem i rozmyciem
  free: (x, y) => !HALO_R.some(([l, t, r, b, pad]) => x + scrollX > l - pad && x + scrollX < r + pad && y + scrollY > t - pad && y + scrollY < b + pad),
};
function stateAt(y, discrete) {
  const A = anchors; let i = 0;
  while (i < A.length - 1 && y >= A[i + 1].y) i++;
  const a = A[i], b = A[Math.min(i + 1, A.length - 1)];
  let u = b === a ? 0 : Math.min(1, Math.max(0, (y - a.y) / (b.y - a.y)));
  if (discrete) u = u < 0.5 ? 0 : 1;
  const e = sm(0.08, 0.92, u);
  const st = { from: a.f, to: b.f, T: a.f === b.f ? 0 : discrete ? u : sm(0.2, 0.85, u), pos: lerp3(a.pos, b.pos, e), look: lerp3(a.look, b.look, e), par: 0, parStr: 0, knot: 0, knotStr: 0, key: u < 0.5 ? a.key : b.key };
  if (u < 0.5 && a.par) { st.par = a.par; st.parStr = 1 - sm(0.2, 0.5, u); }
  if (u >= 0.5 && b.par) { st.par = b.par; st.parStr = sm(0.5, 0.8, u); }
  if (u < 0.5 && a.kn) { st.knot = a.kn; st.knotStr = 1 - sm(0.2, 0.5, u); }
  if (u >= 0.5 && b.kn) { st.knot = b.kn; st.knotStr = sm(0.5, 0.8, u); }
  if (discrete) { st.parStr = st.parStr > 0 ? 1 : 0; st.knotStr = st.knotStr > 0 ? 1 : 0; }
  // bryły 03 i 04: położenie przewinięcia względem postoju sekcji (-1 początek, +1 koniec), net.js obraca o ±7°
  if (!discrete) {
    st.spin = {};
    for (const key of ['plany', 'z']) {
      const h = A.filter((x) => x.key === key);
      if (h.length === 2) st.spin[h[0].f] = Math.max(-1, Math.min(1, (y - (h[0].y + h[1].y) / 2) / Math.max(1, (h[1].y - h[0].y) / 2)));
    }
  }
  return st;
}
function frameState(now) {
  const pT = DEV ? DEV.t : now / 1000;   // zegar strony (dryf)
  const discrete = RM || still || !isGL;
  const y = DEV ? DEV.y : scrollY;
  const st = stateAt(y, discrete);
  st.time = pT;
  st.drift = RM || !isGL ? 0 : DEV ? 1 : still ? 0 : driftAmp;
  st.pointer = pointer;
  // kursor: w trakcie wejścia (sieć i znak) wpływ 0, potem narasta krytycznie tłumiony, bez skoku sieci
  const endT = markEnd == null ? null : Math.max(markEnd, t0 + 1000);
  st.lensGate = endT == null ? 0 : critical((now - endT) / 1000 / LENS_TAU);
  st.lens = RM || still ? 0 : DEV ? (KURSOR && ink ? critical((DEV.t - Math.max(ink.end, 1)) / LENS_TAU) : 0) : lens * st.lensGate;
  st.topClip = 0;   // linię metadanych chroni maska sceny (halos()), bez prostej krawędzi ucięcia
  st.alphaCap = 1 - (1 - HERO_A) * (1 - sm(0, 0.6 * innerHeight, y));
  // start D: sieć wchodzi pierwsza, krótko (1 s) i z mniejszego rozproszenia; bez ruchu stan końcowy od razu
  const iT = DEV ? DEV.t : (now - t0) / 1000;
  st.intro = discrete ? 1 : Math.min(1, Math.max(0, iT));
  st.introSpread = discrete ? 2.6 : 1.7;
  st.bounce = ink && ink.pulls && !discrete ? ink.pulls() : null;
  st.couple = st.bounce && st.bounce.size ? 1 : 0;
  return st;
}
async function startNet() {
  if (!mqDesk.matches || !canvas) return;
  if (scene) { root.classList.add('net-on'); measure(); scene.resize(); dirty = true; schedule(); return; }
  if (startingNet) return startingNet;
  startingNet = (async () => { try {
    const forms = await import('./forms.js');
    FORMS = forms;
    CAM = forms.rig();
    if (!mqDesk.matches) return;
    if (probe('webgl2')) {
      try { const m = await import('./net.js'); scene = m.createScene(canvas, { preserve: !!DEV, centerX }); isGL = true; } catch (_) { /* lokalna rycina przy niedostępnej bibliotece */ }
    }
    if (!scene) { const m = await import('./plates.js'); scene = m.createFallback(canvas, centerX); }
    if (!mqDesk.matches) return;
    root.classList.add('net-on');
    measure(); centerX(); scene.resize();
    t0 = performance.now();   // zegar sceny od chwili, gdy sieć może się narysować (wejście sieci bez skoku)
    dirty = true; schedule();
  } catch (_) { scene = null; root.classList.remove('net-on'); } finally { startingNet = null; } })();
  return startingNet;
}

// ---------- Lenis ze strażnikiem ruchu: tylko pulpit z myszą, tylko przy ruchu ----------
let lenis = null;
function loadLenis() {
  if (lenis || !moving() || !mqDesk.matches || !mqFine.matches) return;
  const go = () => { if (!lenis && moving() && window.Lenis) { lenis = new window.Lenis({ autoRaf: false, lerp: 0.1, wheelMultiplier: 1, smoothWheel: true, syncTouch: false }); schedule(); } };
  if (window.Lenis) return go();
  if (!$('link[data-lenis]')) {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = new URL('./vendor/lenis.css', import.meta.url); css.dataset.lenis = '1'; document.head.appendChild(css);
    const s = document.createElement('script'); s.src = new URL('./vendor/lenis.min.js', import.meta.url); s.onload = go; document.head.appendChild(s);
  }
}
function killLenis() { if (lenis) { lenis.destroy(); lenis = null; } }

// skok do kotwicy; fokus na nagłówku sekcji (bez Lenisa skok natywny + scroll-padding-top)
document.addEventListener('click', (ev) => {
  const a = ev.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href').slice(1);
  const target = id && document.getElementById(id);
  if (!target) return;
  const focusEl = target.querySelector('h1[tabindex], h2[tabindex]') || target;
  if (lenis && ev.detail !== 0) {
    ev.preventDefault();
    lenis.scrollTo(target, { offset: -(topBar() + 20), duration: 1.1, onComplete: () => focusEl.focus({ preventScroll: true }) });
    history.replaceState(null, '', '#' + id);
  } else {
    setTimeout(() => focusEl.focus({ preventScroll: true }), 0);
  }
});

// ---------- jedna pętla klatek: Lenis + sieć; zasypia, gdy nic się nie dzieje ----------
function tick(now) {
  raf = 0;
  running = false;
  if (document.hidden) return;
  if (lenis) lenis.raf(now);
  meter();
  let again = !!(lenis && lenis.isScrolling);
  if (scene && inView && !document.hidden && root.classList.contains('net-on')) {
    const dp = Math.abs(pTarget[0] - pointer[0]) + Math.abs(pTarget[1] - pointer[1]) + Math.abs(lensTarget - lens);
    pointer[0] += (pTarget[0] - pointer[0]) * 0.08; pointer[1] += (pTarget[1] - pointer[1]) * 0.08; lens += (lensTarget - lens) * 0.06;
    // Wygaszenie liczone w czasie, nie w liczbie klatek.
    const idleS = (now - lastAct) / 1000, dt = lastFrame ? Math.min(0.1, (now - lastFrame) / 1000) : 0.016; lastFrame = now;
    const want = idleS > IDLE_AFTER_S ? 0 : 1;
    driftAmp += (want - driftAmp) * (1 - Math.exp(-dt / 0.18)); if (Math.abs(want - driftAmp) < 0.01) driftAmp = want;
    const st = frameState(now);
    if (RM || !isGL) {
      const sig = st.key + '|' + st.from + st.to + '|' + innerWidth + 'x' + innerHeight;
      if (sig !== lastKey || dirty) { (scene.render(st), sceneDrawn = true); lastKey = sig; }
    } else {
      const continuous = st.intro < 1 || st.drift > 0.001 || st.couple > 0 || (st.lens > 0 && (dp > 0.002 || st.lensGate < 0.999));
      if (continuous || dirty) (scene.render(st), sceneDrawn = true);
      again = again || continuous;
    }
  }
  dirty = false;
  if (again) schedule(); else lastFrame = 0;
}
function schedule() {
  if (DEV || running || document.hidden) return;
  if (!moving()) { tick(performance.now()); return; }
  running = true; raf = requestAnimationFrame(tick);
}
const act = () => { lastAct = performance.now(); schedule(); };
addEventListener('scroll', () => { dirty = true; act(); }, { passive: true });
addEventListener('wheel', act, { passive: true });
addEventListener('keydown', (e) => { if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) act(); });
addEventListener('touchstart', act, { passive: true });
addEventListener('pointermove', (e) => {
  lastAct = performance.now();
  if (e.pointerType !== 'mouse' || !scene) return;
  pTarget = [(e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1)];
  lensTarget = 1; schedule();
}, { passive: true });
document.addEventListener('pointerleave', () => { lensTarget = 0; schedule(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelAnimationFrame(raf); raf = 0; running = false; lastFrame = 0; }
  else { dirty = true; schedule(); }
});
// scena stoi, gdy granatowa okładka zasłania cały ekran (ani pierwszy ekran, ani treść nie są w widoku)
const seen = new Set();
const viewIO = new IntersectionObserver((es) => { es.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target))); inView = seen.size > 0; if (inView) { dirty = true; schedule(); } });
[hero, $('#tresc')].forEach((el) => viewIO.observe(el));
let rsz = 0;
addEventListener('resize', () => { clearTimeout(rsz); rsz = setTimeout(() => { measure(); if (scene) scene.resize(); redrawPlates(); dirty = true; schedule(); }, 150); });

// ---------- ryciny w treści (telefon, tablet): rysowane raz, przy wejściu w widok ----------
const PLATES = {   // stałe kadry z tej samej geometrii co scena
  pole: { f: 0, pos: [9, -1.5, 10], look: [5.5, 0.2, -1] },            // zbliżenie jednego skupiska, oko w węźle centralnym
  kolo: { f: 1, pos: [4, 2.5, 11], look: [4.5, 1, 0] },                // łuk pierścienia jak obręcz oka znaku
  os: { f: 3, pos: [22, 2, 7], look: [13, 0, -1] },                   // nić przechodzi przez pierścień
};
const plates = $$('[data-plate]').filter((f) => f.dataset.plate !== 'pole');   // rycinę pierwszego ekranu rysuje rycina-tytulowa.js
let plateMod = null;
async function drawPlate(fig) {
  if (!fig.offsetWidth) return;
  plateMod = plateMod || (await import('./plates.js'));
  const t = performance.now();
  await plateMod.drawPlate(fig, PLATES[fig.dataset.plate]);
  performance.measure('insai:rycina-' + fig.dataset.plate, { start: t });
  fig.dataset.w = fig.offsetWidth;
}
const plateIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { plateIO.unobserve(e.target); idle(() => drawPlate(e.target)); } }), { rootMargin: '200px 0px' });
function redrawPlates() { plates.forEach((f) => { if (f.classList.contains('drawn') && f.offsetWidth && +f.dataset.w !== f.offsetWidth) drawPlate(f); else if (!f.classList.contains('drawn')) plateIO.observe(f); }); }

// ---------- światło nad tłoczeniem okładki ----------
// Źródła światła wszystkich filtrów tłoczenia (#swiatlo, #swiatlo-ton) dostają ten sam kierunek.
const lights = $$('feDistantLight[id^="swiatlo"]');
const cover = $('.cover');
const emb = $('.emboss', cover);
let lightAz = 225;
// Blik w oku (.blysk) pieczęci B3 jest odblaskiem tego samego światła: przesuwa się ku źródłu najwyżej o 1 j. viewBox
// i przygasa, gdy światło odchodzi od 225° (krycie 0,55 w spoczynku, 0,42 pod światło przeciwne). W spoczynku,
// przy redukcji ruchu i po zatrzymaniu ruchu stoi dokładnie tam, gdzie w znaku podstawowym.
const REST = (225 * Math.PI) / 180;
const glints = $$('.blysk', cover).map((c) => ({ c, x: +c.getAttribute('cx'), y: +c.getAttribute('cy') }));
function setLight(az) {
  lights.forEach((l) => l.setAttribute('azimuth', az.toFixed(1)));
  const a = (az * Math.PI) / 180, k = Math.cos(a - REST);
  const dx = 0.5 * (Math.cos(a) - Math.cos(REST)), dy = 0.5 * (Math.sin(a) - Math.sin(REST));
  glints.forEach((g) => { g.c.setAttribute('cx', (g.x + dx).toFixed(2)); g.c.setAttribute('cy', (g.y + dy).toFixed(2)); g.c.style.opacity = (0.55 * (0.88 + 0.12 * k)).toFixed(3); });
}
function coverLight(e) {
  if (!lights.length || !emb || RM || still) return;
  let az = lightAz;
  if (e) {
    const r = emb.getBoundingClientRect();
    az = (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
  } else if (!mqFine.matches) {
    const r = cover.getBoundingClientRect();
    if (r.top > innerHeight || r.bottom < 0) return;
    const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height)));
    az = 225 + (p - 0.5) * 120;
  } else return;
  az = ((az % 360) + 360) % 360;
  if (Math.abs(az - lightAz) < 0.5) return;
  lightAz = az; setLight(az);
}
cover.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') coverLight(e); }, { passive: true });

// ---------- stopka: kopiowanie adresu ----------
// Przycisk istnieje tylko przy dostępnym schowku; bez niego zostaje sam odnośnik mailto.
$$('[data-copy]').forEach((b) => {
  if (!navigator.clipboard || !window.isSecureContext) return;
  const label = b.textContent, st = b.nextElementSibling;
  let back = 0;
  b.hidden = false;
  b.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(b.dataset.copy);
      b.textContent = 'Skopiowano'; b.classList.add('ok'); if (st) st.textContent = 'Skopiowano';
      clearTimeout(back);
      back = setTimeout(() => { b.textContent = label; b.classList.remove('ok'); if (st) st.textContent = ''; }, 2000);
    } catch (e) {   // odmowa schowka: zaznacz adres, żeby wystarczyło Ctrl+C
      const a = cover.querySelector('a[href^="mailto:"]');
      if (a) { const rg = document.createRange(); rg.selectNodeContents(a); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(rg); }
    }
  });
});

// ---------- przełącznik ruchu (WCAG 2.2.2): etykieta stała, stan w aria-pressed ----------
const btns = $$('[data-motion]');
function setStill(v) {
  still = v;
  try { localStorage.setItem('insai-ruch', v ? 'stop' : 'ruch'); } catch (e) { /* bez pamięci: stan tylko na tę wizytę */ }
  root.classList.toggle('still', v);
  root.classList.toggle('fx', !v && !RM);
  btns.forEach((b) => b.setAttribute('aria-pressed', String(v)));
  if (ink) ink.setStill(v || RM);
  if (v && plateStop) plateStop();   // przeskok do stanu końcowego (znak: ink.setStill)
  if (v) { killLenis(); lensTarget = 0; lens = 0; stage.style.transform = ''; title2.forEach((l) => (l.style.transform = '')); inks.forEach((el) => el.classList.add('on')); lightAz = 225; setLight(225); }
  else { t0 = performance.now() - 2400; loadLenis(); lastAct = performance.now(); armInks(); }
  if (v) { cancelAnimationFrame(raf); raf = 0; running = false; }
  dirty = true; schedule();
}
btns.forEach((b) => b.addEventListener('click', () => setStill(!still)));
function showButtons() { btns.forEach((b) => (b.hidden = RM || mqTouch.matches)); btns.forEach((b) => b.setAttribute('aria-pressed', String(still))); }
mqRM.addEventListener('change', () => {
  RM = mqRM.matches || !!DEV?.rm;
  root.classList.toggle('fx', !RM && !still);
  armInks();
  root.classList.toggle('reduced', RM);
  if (ink) ink.setStill(RM || still);
  if (RM && plateStop) plateStop();
  if (RM) { killLenis(); cancelAnimationFrame(raf); raf = 0; running = false; stage.style.transform = ''; title2.forEach((l) => (l.style.transform = '')); }
  else loadLenis();
  showButtons(); dirty = true; schedule();
});
mqTouch.addEventListener('change', showButtons);
mqDesk.addEventListener('change', () => { showButtons(); if (mqDesk.matches) { startNet(); loadLenis(); } else { killLenis(); root.classList.remove('net-on'); stage.style.transform = ''; title2.forEach((l) => (l.style.transform = '')); redrawPlates(); } dirty = true; schedule(); });

// ---------- karta naboru: wejście raz, przy pierwszym pokazaniu w oknie ----------
// Klasa „in” zostaje do końca wizyty. Bez ruchu styl pokazuje od razu stan końcowy.
const nabor = $('#plany .nabor');
if (nabor && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { nabor.classList.add('in'); io.disconnect(); } }, { threshold: 0.3 });
  io.observe(nabor);
} else if (nabor) nabor.classList.add('in');

// ---------- start ----------
showButtons();
plates.forEach((f) => plateIO.observe(f));
meter();
// sieć rusza, gdy tylko three jest gotowe (zegar sceny t0); znak dołącza do niej (start D)
if (mqDesk.matches) (async () => {   // bez czekania na bezczynność: moduły są wczytane z wyprzedzeniem (modulepreload)
  await startNet();
  await document.fonts.ready; measure(); dirty = true; schedule();
})();
loadLenis();
document.fonts.ready.then(() => { measure(); dirty = true; schedule(); });
// telefon i tablet: rycina tytułowa (znak osadzony w sieci) wchodzi od razu, znak odrywa się od niej (D, api ryciny);
// plateStop kończy wejście od razu
let plateStop = null, plateNet = null;
const plateP = mqDesk.matches ? Promise.resolve(null) : import('./rycina-tytulowa.js').then((m) => m.start({ moving, dev: DEV ? DEV.t : null }))
  .then((r) => { plateStop = (r && r.stop) || null; plateNet = (r && r.api) || null; return plateNet; }).catch(() => null);
