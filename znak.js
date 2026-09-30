// znak.js – znak INSAI w nagłówku (C1): węzły sieci składają znak, oko zapala się na końcu.
// Węzły próbkowane z geometrii znaku (pion, litery NSAI, pierścień oka) lądują ruchem krytycznie tłumionym do 1,5 s,
// krawędzie k-NN zapalają się, gdy dwa węzły się spotkają. Potem najmocniejszy węzeł ląduje w miejscu źrenicy
// i zapala się (rdzeń, blik, źrenica), pierścień rysuje się od góry zgodnie z ruchem wskazówek zegara, krawędzie
// gasną 2,05–2,3 s, a wypełnienie narasta równo w całym znaku 2,2–2,95 s krzywą z brandbooka (cubic-bezier .22 .61
// .36 1). W fazie wypełnienia nic się nie przesuwa. Zero reakcji na kursor, zero pętli po wejściu.
// Pulpit, choreografia D (opts.net): najpierw sieć, potem znak. Przyszłe węzły znaku siedzą w sieci jako grudki
// przyklejone nićmi do sąsiadów; od opts.A (s) fale od najbliższych skupisk odrywają je: nici się napinają i cienieją,
// grudka rusza z przyspieszeniem, nić pęka, a węzeł sieci odbija sprężyście (pulls() -> net.js bounce). Najmocniejszy
// węzeł (hub) odrywa się ostatni i ląduje w źrenicy; dalej C1 bez zmian, przesunięte o DSH. Bez opts.net: rozproszenie C1.
// Telefon: ta sama zasada w rycinie tytułowej (opts.plate, opts.net = api ryciny), lżej: 1–2 nici, krótszy przelot,
// bez three.js; ruch kończy się przed 5 s. Bez api ryciny węzły wychodzą z jej obszaru (rozproszenie C1).
const VB = [58, 7, 148, 54];
const EYE = [78, 34];
const NAVY = [26, 44, 71], TEAL = [44, 95, 111];
const GA = [121.13, 2.76], GB = [137.87, 65.24];   // oś gradientu znaku z brandbooka §2
const TL = { land: 1.5, edge0: 2.05, edge1: 2.3, fill0: 2.2, fill1: 2.95 };
const CUTS = [88, 123, 151.2, 186, 999];   // granice grup w osi x: pion, N, S, A, I (krawędzie tylko w obrębie grupy)

function rng(seed) {   // ten sam generator co forms.js
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const sstep = (a, b, v) => { const k = clamp01((v - a) / (b - a)); return k * k * (3 - 2 * k); };
// ruch krytycznie tłumiony: start z zerową prędkością, dojście bez przestrzelenia; unormowany do 1 w u = 1
const DW = 7, DN = 1 - (1 + DW) * Math.exp(-DW);
const damp = (u) => { u = clamp01(u); return u >= 1 ? 1 : (1 - (1 + DW * u) * Math.exp(-DW * u)) / DN; };
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const fx = (t) => ((ax * t + bx) * t + cx) * t, fy = (t) => ((ay * t + by) * t + cy) * t, dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => { x = clamp01(x); let t = x; for (let i = 0; i < 8; i++) { const e = fx(t) - x, g = dx(t); if (Math.abs(e) < 1e-5 || !g) break; t = clamp01(t - e / g); } return fy(t); };
}
const brand = bezier(0.22, 0.61, 0.36, 1);   // krzywa --ease strony i brandbooka §12

// Węzły: próbkowanie z minimalnym odstępem (rzut strzałką) w masce pionu i liter; pierścień oka osobno.
function build(d, dmin, lite) {
  const S = 4, W = VB[2] * S, H = VB[3] * S;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d', { willReadFrequently: true });
  x.setTransform(S, 0, 0, S, -VB[0] * S, -VB[1] * S);
  x.fillStyle = '#fff'; x.fillRect(73, 17, 10, 34); x.fill(new Path2D(d));
  x.globalCompositeOperation = 'destination-out';
  x.beginPath(); x.arc(EYE[0], EYE[1], 10.2, 0, Math.PI * 2); x.fill();
  const m = x.getImageData(0, 0, W, H).data;
  const inside = (u, v) => { const i = ((Math.round((v - VB[1]) * S) * W) + Math.round((u - VB[0]) * S)) * 4; return m[i] > 127; };
  const r = rng(1338);
  const P = [];   // [x, y, ziarno, rozmiar, grupa]
  const cell = dmin / Math.SQRT2, gw = Math.ceil(VB[2] / cell) + 1, grid = new Map();
  const key = (u, v) => Math.floor((u - VB[0]) / cell) + Math.floor((v - VB[1]) / cell) * gw;
  const far = (u, v) => {
    const cx = Math.floor((u - VB[0]) / cell), cy = Math.floor((v - VB[1]) / cell);
    for (let j = cy - 2; j <= cy + 2; j++) for (let i = cx - 2; i <= cx + 2; i++) {
      const q = grid.get(i + j * gw); if (q == null) continue;
      if (Math.hypot(P[q][0] - u, P[q][1] - v) < dmin) return false;
    }
    return true;
  };
  const tries = lite ? 9000 : 16000;
  for (let n = 0; n < tries; n++) {
    const u = 72 + r() * 134, v = 16.5 + r() * 35;
    if (!inside(u, v) || !far(u, v)) continue;
    grid.set(key(u, v), P.length);
    P.push([u, v, r(), 0.6 + 0.8 * r() * r(), CUTS.findIndex((c) => u < c)]);
  }
  const ringN = lite ? 22 : 30, ring0 = P.length;
  for (let k = 0; k < ringN; k++) {
    const a = (k / ringN) * Math.PI * 2;
    P.push([EYE[0] + Math.cos(a) * 8.9, EYE[1] + Math.sin(a) * 8.9, r(), 0.9, 9]);
  }
  // krawędzie: 3 najbliższe w tej samej grupie (litera, pion), z siatki komórek (co najwyżej jeden węzeł na komórkę)
  const E = [], seen = new Set();
  const add = (a, b) => { const k = Math.min(a, b) * 8192 + Math.max(a, b); if (a !== b && !seen.has(k)) { seen.add(k); E.push(a, b); } };
  const reach = Math.ceil((dmin * 2.3) / cell);
  for (let a = 0; a < ring0; a++) {
    const best = [];
    const cx = Math.floor((P[a][0] - VB[0]) / cell), cy = Math.floor((P[a][1] - VB[1]) / cell);
    for (let j = cy - reach; j <= cy + reach; j++) for (let i = cx - reach; i <= cx + reach; i++) {
      const b = grid.get(i + j * gw);
      if (b == null || b === a || P[b][4] !== P[a][4]) continue;
      const dd = Math.hypot(P[a][0] - P[b][0], P[a][1] - P[b][1]);
      if (dd <= dmin * 2.3) best.push([dd, b]);
    }
    best.sort((p, q) => p[0] - q[0] || p[1] - q[1]).slice(0, 3).forEach(([, b]) => add(a, b));
  }
  // węzły centralne liter NSAI (jak piasty pola sceny): rysowane geometrią oka, póki znak się nie wyłoni
  const hubs = [];
  for (let g = 1; g <= 4; g++) {
    const idx = P.map((p, i) => i).filter((i) => i < ring0 && P[i][4] === g);
    if (!idx.length) continue;
    const cx = idx.reduce((s, i) => s + P[i][0], 0) / idx.length, cy = idx.reduce((s, i) => s + P[i][1], 0) / idx.length;
    let h = idx[0], hd = 1e9;
    for (const i of idx) { const dd = Math.hypot(P[i][0] - cx, P[i][1] - cy); if (dd < hd) { hd = dd; h = i; } }
    hubs.push(h);
  }
  // barwa węzła: położenie na osi gradientu znaku, 6 progów
  const gl = (GB[0] - GA[0]) ** 2 + (GB[1] - GA[1]) ** 2;
  const tone = P.map((p) => Math.min(5, Math.floor(6 * clamp01(((p[0] - GA[0]) * (GB[0] - GA[0]) + (p[1] - GA[1]) * (GB[1] - GA[1])) / gl))));
  return { P, E, hubs, tone, ring0, ringN };
}

// stage: element sceny znaku; opts: { still, lite, desk, field (pole okładki, heroField z main.js), net (pulpit, D: api sieci
// z main.js), A (start oderwania w s), plate (telefon: rycina tytułowa), t (klatka zamrożona), late (start po czasie: bez wejścia) }
// Zwraca { t0 (początek wejścia, performance.now() albo null), setStill }.
export function initZnak(stage, opts = {}) {
  const d = document.getElementById('znak-nsai')?.getAttribute('d');
  if (!d) return null;
  const lite = !!opts.lite;
  const { P, E, hubs, tone, ring0, ringN } = build(d, lite ? 2.05 : 1.5, lite);
  const N = P.length;
  const L0 = new Float32Array(E.length / 2);
  for (let q = 0; q < E.length; q += 2) L0[q >> 1] = Math.max(0.3, Math.hypot(P[E[q]][0] - P[E[q + 1]][0], P[E[q]][1] - P[E[q + 1]][1]));
  const canvas = document.createElement('canvas');
  canvas.className = 'siec-c';
  canvas.setAttribute('aria-hidden', 'true');
  stage.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // Kanwa: pulpit od znaku do prawej krawędzi pola okładki i przez wysokość bloku nagłówka (jak w zatwierdzonym C1);
  // telefon nad ryciną tytułową. Geometria z układu (offsetTop, offsetLeft), więc paralaksa znaku jej nie przestawia.
  const hero = stage.closest('.hero');
  const block = stage.closest('.hero-main') || stage.parentElement;
  let field = null, plate = null;   // pole: [lewa, prawa, środek w pionie, rozrzut w pionie, góra, dół]; rycina: [lewa, prawa, góra, dół]
  const place = () => {
    field = plate = null;
    if (opts.desk && opts.field && hero && matchMedia('(min-width: 1081px)').matches) {
      // w poziomie w układzie okna (bez offsetLeft, który zależy od bloku zawierającego): prawa krawędź kanwy to prawa
      // krawędź pola okładki i nigdy nie wychodzi za okno, więc kanwa nie poszerza dokumentu (bez przewijania w poziomie)
      const [fl, fr] = opts.field(), vw = document.documentElement.clientWidth;
      const W = stage.offsetWidth, sl = stage.getBoundingClientRect().left, sy = stage.offsetTop, u = W / VB[2];
      const left = Math.max(-0.06 * W, -sl), top = block.offsetTop - sy, height = Math.max(stage.offsetHeight * 1.7, block.offsetHeight + 0.5 * innerHeight);
      const width = Math.max(1, Math.min(fr, vw) - sl - left);
      Object.assign(canvas.style, { left: left + 'px', top: top + 'px', width: width + 'px', height: height + 'px' });
      field = [VB[0] + (fl - sl) / u, VB[0] + (fr - sl) / u, VB[1] + (top + height / 2) / u, (0.2 * innerHeight) / u, VB[1] + top / u, VB[1] + (top + height) / u];
      return;
    }
    const pr = opts.plate && opts.plate.offsetWidth ? opts.plate.getBoundingClientRect() : null, sr = stage.getBoundingClientRect();
    if (pr && pr.height > sr.height) {
      const u = sr.width / VB[2];
      Object.assign(canvas.style, { left: pr.left - sr.left + 'px', top: pr.top - sr.top + 'px', width: pr.width + 'px', height: pr.height + 'px' });
      plate = [VB[0] + (pr.left - sr.left) / u, VB[0] + (pr.right - sr.left) / u, VB[1] + (pr.top - sr.top) / u, VB[1] + (pr.bottom - sr.top) / u];
    } else canvas.removeAttribute('style');
  };
  // Starty węzłów: pulpit w polu okładki (jak w zatwierdzonym C1), telefon w obszarze ryciny.
  const S0 = new Float32Array(N * 2), ES = [0, 0];
  const scatter = () => {
    const r = rng(75);
    const gauss = () => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    for (let i = 0; i < N; i++) {
      const [tx, ty] = P[i];
      if (field) {
        const [fl, fr, yc, sy, y0, y1] = field, w = fr - fl;
        S0[i * 2] = fl + w * (0.06 + 0.88 * r());
        S0[i * 2 + 1] = Math.min(y1 - 2, Math.max(y0 + 2, (yc + EYE[1]) / 2 + gauss() * sy));   // między środkiem formacji a znakiem
      } else if (plate) {
        S0[i * 2] = plate[0] + (plate[1] - plate[0]) * (0.04 + 0.92 * r());
        S0[i * 2 + 1] = plate[2] + (plate[3] - plate[2]) * (0.04 + 0.92 * r());
      } else {
        S0[i * 2] = Math.min(203, Math.max(61, tx + gauss() * 22));
        S0[i * 2 + 1] = Math.min(72, Math.max(-4, ty + gauss() * 15));
      }
    }
    if (field) { ES[0] = field[0] + (field[1] - field[0]) * 0.3; ES[1] = (field[2] + EYE[1]) / 2; }
    else if (plate) { ES[0] = plate[0] + (plate[1] - plate[0]) * 0.7; ES[1] = plate[2] + (plate[3] - plate[2]) * 0.3; }
    else { ES[0] = 200; ES[1] = 4; }
  };

  let cw = 1, ch = 1, dpr = 1, ox = 0, oy = 0, su = 1;
  const fit = () => {
    place(); scatter();
    const cr = canvas.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, lite || field ? 1.5 : 2);   // kanwa pulpitu obejmuje pole okładki: gęstość 1,5
    cw = Math.max(1, Math.round(cr.width)); ch = Math.max(1, Math.round(cr.height));
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    su = sr.width / VB[2]; ox = sr.left - cr.left; oy = sr.top - cr.top;
  };
  const X = new Float32Array(N), Y = new Float32Array(N), K = new Float32Array(N);   // K: jak blisko miejsca w znaku
  const GP = new Float32Array(N).fill(1), DK = new Float32Array(N).fill(1);   // D pulpit: zebranie z kotwic w sieci (0 rozproszony, 1 gruda) i ściemnienie (0 ton sieci, 1 ton znaku)

  // ---------- D (pulpit z siecią three, telefon z ryciną): znak odrywa się od sieci ----------
  // opts.net: { count, hubs, nbrs(id), at(ids) -> [[x, y, ok]] w px okna, atRest?(ids), free(x, y), bounce?(m) };
  // opts.A: start odrywania (s, zegar znaku). Litery dzielą się na spójne kawałki (k-średnie po siatce liter); każdy kawałek
  // siedzi w sieci jako gęsta gruda przy swoim źródle (węzły sieci wybrane równo z całego kadru, najdalszym punktem).
  // Trzy fale obejmujące całą sieć: gruda napina nici do sieci (TENS), potem płynie strugą: czoło rusza pierwsze, ogon
  // ostatni (SPREAD), a siatka kawałka rozciąga się w locie i cienieje, przy literze znów się ściąga. Ogon trzyma nici,
  // które pękają z odskokiem obu końców, a węzeł sieci odbija (pulls -> net.js albo rycina). Najmocniejszy węzeł (piasta
  // najbliżej znaku) odrywa się ostatni i ląduje w źrenicy; dalej C1 bez zmian, przesunięte o DSH (zegar C1 + DSH).
  // Telefon (opts.net = rycina tytułowa): lżej, mniej źródeł, 1-2 nici, krótszy przelot.
  let Dm = false;   // ustalane po pierwszym fit(): D na pulpicie z polem okładki albo na telefonie z ryciną
  const LT = !opts.desk;
  const A0 = opts.A != null ? opts.A : 0.9;
  // Pulpit: węzły kawałków leżą rozproszone w skupiskach sieci, w jej tonie i rozmiarze (kotwice),
  // i przez 0,35 s przed szyją zbierają się w luźną, nieregularną grudę (kształt kawałka w skali SQD), ciemnieją dopiero
  // w ostatnich 0,15 s i napinają nici. Czoło rusza pierwsze, ogon trzyma się sieci przez SPREAD s (szyja), a wszystkie
  // węzły kawałka lądują razem (ogon leci szybciej; rozciągnięcie w locie ok. 300 px);
  // przy zerwaniu miejsce w sieci (źródło, sąsiedzi, kotwice) cofa się o BOUNCE px. Oko ląduje zaraz po ostatnim kawałku.
  const WAVES = [0, 0.15, 0.3], TENS = LT ? 0.2 : 0.25, SPREAD = LT ? 0.07 : 0.09, SQD = 0.6, BULGE = 14;   // BULGE: pęcznienie kawałka w poprzek lotu (px)   // SPREAD: ogon za czołem (s), SQD: skala kawałka w grudzie (pulpit)
  const T0 = 0.45, T1 = LT ? 0.3 : 0.35;   // przelot kawałka: T0 + T1 x (odległość / najdłuższa)
  const RK = LT ? 9 : 15, HN = LT ? 12 : 22;   // promień grudy (px), liczba źródeł
  const PULL = LT ? 6 : 10, BOUNCE = LT ? 4 : 9;
  const EYE_D = A0 + (LT ? 1.0 : 0.9), EYE_T = LT ? 0.22 : 0.15, EYE_F = LT ? 0.48 : 0.4, DSH = EYE_D + EYE_T + EYE_F - 1.55;   // oko ląduje, gdy w C1 (1,55 + DSH)
  const flyEase = bezier(0.5, 0, 0.25, 1);   // lepki start, przyspieszenie, lądowanie bez przestrzelenia
  // dsel: { hosts: [id], hostOf, cOf: Int16Array, rel: Float32Array (położenie w kawałku, VB), dly: Float32Array, u: Float32Array,
  //         ch: [{ k, cx, cy, sc, T, bend }], th: [[i, id, bend, start, dir, zerwanie]], eyeHost, ids }
  let dsel = null;
  const selectD = () => {
    const net = opts.net, all = Array.from({ length: net.count }, (_, i) => i), at = (net.atRest || net.at)(all);
    if (!at) return false;
    const cr = canvas.getBoundingClientRect(), [bx0, by0] = px(VB[0], VB[1]), [bx1, by1] = px(VB[0] + VB[2], VB[1] + VB[3]);
    let cand = [];
    at.forEach(([x, y, ok], id) => {
      if (!ok) return;
      const cx = x - cr.left, cy = y - cr.top;
      if (cx < 12 || cx > cw - 12 || cy < 12 || cy > ch - 12 || (!LT && cx < bx1 + 30) || !net.free(x, y)) return;
      cand.push([id, cx, cy, Math.hypot(Math.max(0, bx0 - cx, cx - bx1), Math.max(0, by0 - cy, cy - by1))]);
    });
    if (cand.length < HN) { dsel = false; return true; }
    cand.sort((a, b) => a[3] - b[3]);
    const hubSet = new Set(net.hubs), eyeC = cand.find((c) => hubSet.has(c[0])) || cand[0];
    // źródła: węzły skupisk (stopień >= 3) z całego kadru, najdalszym punktem od najbliższego znakowi
    const dense = cand.filter((c) => c !== eyeC && net.nbrs(c[0]).length >= 3);
    const pool = dense.length >= HN * 2 ? dense : cand.filter((c) => c !== eyeC);
    const hosts = [pool[0]], md = pool.map((c) => Math.hypot(c[1] - pool[0][1], c[2] - pool[0][2]));
    while (hosts.length < HN) {
      let b = 0;
      for (let j = 1; j < pool.length; j++) if (md[j] > md[b]) b = j;
      if (md[b] < 8) break;
      hosts.push(pool[b]);
      for (let j = 0; j < pool.length; j++) md[j] = Math.min(md[j], Math.hypot(pool[j][1] - pool[b][1], pool[j][2] - pool[b][2]));
    }
    // kawałki liter: k-średnie (VB) z ziarnami rozłożonymi najdalszym punktem, 6 przebiegów
    const lat = P.map((p, i) => i).filter((i) => i < ring0), H = hosts.length;
    const cen = [[P[lat[0]][0], P[lat[0]][1]]], dd = lat.map((i) => Math.hypot(P[i][0] - cen[0][0], P[i][1] - cen[0][1]));
    while (cen.length < H) {
      let b = 0;
      for (let j = 1; j < lat.length; j++) if (dd[j] > dd[b]) b = j;
      cen.push([P[lat[b]][0], P[lat[b]][1]]);
      for (let j = 0; j < lat.length; j++) dd[j] = Math.min(dd[j], Math.hypot(P[lat[j]][0] - P[lat[b]][0], P[lat[j]][1] - P[lat[b]][1]));
    }
    let groups = [];
    for (let it = 0; it < 6; it++) {
      groups = cen.map(() => []);
      for (const i of lat) {
        let b = 0, bd = Infinity;
        cen.forEach((c, j) => { const d = (P[i][0] - c[0]) ** 2 + (P[i][1] - c[1]) ** 2; if (d < bd) { bd = d; b = j; } });
        groups[b].push(i);
      }
      groups.forEach((g, j) => { if (g.length) cen[j] = [0, 1].map((a) => g.reduce((s, i) => s + P[i][a], 0) / g.length); });
    }
    // pary kawałek-źródło: od prawej litery do najbliższego wolnego źródła (dalekie źródła niosą dalekie litery)
    const order = cen.map((c, j) => j).filter((j) => groups[j].length).sort((a, b) => cen[b][0] - cen[a][0]);
    const free = hosts.map((h, k) => k), pairs = [];
    for (const j of order) {
      if (!free.length) break;
      const [tx, ty] = px(cen[j][0], cen[j][1]);
      let b = 0;
      free.forEach((k, m) => { if (Math.hypot(hosts[k][1] - tx, hosts[k][2] - ty) < Math.hypot(hosts[free[b]][1] - tx, hosts[free[b]][2] - ty)) b = m; });
      pairs.push([j, free.splice(b, 1)[0]]);
    }
    const maxL = Math.max(1, ...pairs.map(([j, k]) => { const [tx, ty] = px(cen[j][0], cen[j][1]); return Math.hypot(hosts[k][1] - tx, hosts[k][2] - ty); }));
    const hostOf = new Int16Array(N).fill(-1), cOf = new Int16Array(N).fill(-1), rel = new Float32Array(N * 2), kn = new Float32Array(N * 2), dly = new Float32Array(N), u = new Float32Array(N);
    const anc = new Int32Array(N).fill(-1), jit = new Float32Array(N * 2), vw = new Float32Array(N), pl = [];   // pulpit: kotwice w sieci, pęcznienie, odbicia miejsca
    const r = rng(1338 + 7), chs = [], th = [];
    // łuk przelotu wybrzusza się od tytułu (strugi nie przecinają wierszy, gdy się da)
    const tr = document.querySelector('.hero-main .title')?.getBoundingClientRect(), tc = tr ? [(tr.left + tr.right) / 2 - cr.left, (tr.top + tr.bottom) / 2 - cr.top] : null;
    // pulpit: wiersze tytułu i zdania wstępnego (prostokąty linii w px kanwy); kawałek w locie trzyma od nich >= 24 px
    const lines = [];
    if (!LT) for (const el of document.querySelectorAll('.hero-main .title span, .hero-main .lede')) {
      const rg = document.createRange(); rg.selectNodeContents(el);
      for (const q of rg.getClientRects()) if (q.width > 1) lines.push([q.left - cr.left, q.top - cr.top, q.right - cr.left, q.bottom - cr.top]);
    }
    const clearance = (h, tx, ty, dx, dy, L, bend, pr) => {
      let m = Infinity;
      for (let n = 0; n <= 24; n++) {
        const f = n / 24, bw = bend * L * 2 * f * (1 - f), x = h[1] + (tx - h[1]) * f - dy * bw, y = h[2] + (ty - h[2]) * f + dx * bw, rr = pr * (SQD + (1 - SQD) * f) + BULGE * Math.sqrt(Math.sin(Math.PI * f));
        for (const [l, t2, r2, b] of lines) m = Math.min(m, Math.hypot(Math.max(l - x, 0, x - r2), Math.max(t2 - y, 0, y - b)) - rr);
      }
      return m;
    };
    pairs.forEach(([j, k], c) => {
      const g = groups[j], h = hosts[k], [tx, ty] = px(cen[j][0], cen[j][1]), L = Math.hypot(tx - h[1], ty - h[2]) || 1, dx = (tx - h[1]) / L, dy = (ty - h[2]) / L;
      const sc = A0 + WAVES[k % 3] + (r() - 0.5) * 0.08, T = T0 + T1 * (L / maxL);
      let bend = 0.1 + 0.18 * r();
      if (tc && ((h[1] + tx) / 2 - tc[0]) * -dy + ((h[2] + ty) / 2 - tc[1]) * dx < 0) bend = -bend;   // (-dy, dx): strona wybrzuszenia
      chs.push({ k, cx: cen[j][0], cy: cen[j][1], sc, T, bend });
      // czoło kawałka (najbliżej celu) rusza pierwsze, ogon ostatni: struga
      const pr = g.map((i) => (P[i][0] - cen[j][0]) * dx + (P[i][1] - cen[j][1]) * dy), lo = Math.min(...pr), hi = Math.max(...pr);
      const rm = Math.max(1e-3, ...g.map((i) => Math.hypot(P[i][0] - cen[j][0], P[i][1] - cen[j][1])));
      g.forEach((i, m) => {
        hostOf[i] = k; cOf[i] = c;
        rel[i * 2] = P[i][0] - cen[j][0]; rel[i * 2 + 1] = P[i][1] - cen[j][1];
        // w grudzie kawałek jest okrągły: kierunek z litery, promień ściśnięty pierwiastkiem (gęsty środek, miękki brzeg)
        const rr = Math.hypot(rel[i * 2], rel[i * 2 + 1]) || 1e-3, q = LT ? (RK * Math.sqrt(rr / rm)) / rr : su * SQD;   // pulpit: kształt kawałka, bez pierścienia
        kn[i * 2] = rel[i * 2] * q; kn[i * 2 + 1] = rel[i * 2 + 1] * q;
        u[i] = hi > lo ? (pr[m] - lo) / (hi - lo) : 1;
        dly[i] = sc + TENS + (1 - u[i]) * SPREAD;
      });
      if (!LT) {
        // gruda nieregularna: drganie 2,5 px na węzeł; łuk: jeśli kawałek w locie podchodzi do wiersza tekstu bliżej niż
        // 24 px, wybrzuszenie rośnie (najpierw w tę samą stronę, potem w drugą), wybierany jest pierwszy łuk z zapasem
        g.forEach((i) => { kn[i * 2] += (r() - 0.5) * 5; kn[i * 2 + 1] += (r() - 0.5) * 5; });
        // współrzędna w poprzek lotu (-1..1): pęcznienie kawałka w locie
        const pp = g.map((i) => -rel[i * 2] * dy + rel[i * 2 + 1] * dx), pm = Math.max(1e-3, ...pp.map(Math.abs));
        g.forEach((i, m) => { vw[i] = pp[m] / pm; });
        const pr = rm * su, cur = chs[chs.length - 1];
        if (lines.length && clearance(h, tx, ty, dx, dy, L, cur.bend, pr) < 24) {
          let best = [clearance(h, tx, ty, dx, dy, L, cur.bend, pr), cur.bend];
          for (const sg of [Math.sign(cur.bend) || 1, -(Math.sign(cur.bend) || 1)]) {
            for (let b = 0.1; b <= 0.6 + 1e-9 && best[0] < 24; b += 0.04) { const cl = clearance(h, tx, ty, dx, dy, L, sg * b, pr); if (cl > best[0]) best = [cl, sg * b]; }
          }
          cur.bend = best[1];
        }
        // kotwice: węzły sieci w promieniu 70 px od źródła (najbliższe pierwsze), po kolei dla węzłów kawałka, 3-7 px obok
        const near = at.map((q, id) => [id, q[2] ? Math.hypot(q[0] - cr.left - h[1], q[1] - cr.top - h[2]) : 1e9]).filter((q) => q[1] < 70).sort((a, b) => a[1] - b[1]).map((q) => q[0]);
        const pool = near.length ? near : [h[0]];
        g.forEach((i, m) => { const a = r() * Math.PI * 2, d = 3 + 4 * r(); anc[i] = pool[m % pool.length]; jit[i * 2] = Math.cos(a) * d; jit[i * 2 + 1] = Math.sin(a) * d; });   // obok węzła sieci, nie na nim
        // miejsce w sieci: źródło, jego sąsiedzi i kotwice ciągną ku kawałkowi i cofają się przy zerwaniu ogona
        const ts = sc + TENS + SPREAD + 0.03, seen = new Set();
        for (const [ids, w] of [[[h[0]], 1], [net.nbrs(h[0]), 0.75], [pool.slice(0, 12), 0.55]]) for (const id of ids) {
          if (seen.has(id) || !at[id]) continue;
          seen.add(id);
          const nx = at[id][0] - cr.left, ny = at[id][1] - cr.top, dl = Math.hypot(tx - nx, ty - ny) || 1;
          pl.push([id, w, (tx - nx) / dl, (ty - ny) / dl, sc, ts]);
        }
      }
      // nici z ogona do źródła i do 1-2 sąsiadów w sieci (telefon: 0-1), każda z innego węzła ogona, z własną krzywizną
      const tail = g.slice().sort((a, b) => u[a] - u[b]);
      const nb = [h[0], ...net.nbrs(h[0]).filter((id) => at[id] && at[id][2]).sort((a, b) => Math.hypot(at[a][0] - cr.left - h[1], at[a][1] - cr.top - h[2]) - Math.hypot(at[b][0] - cr.left - h[1], at[b][1] - cr.top - h[2])).slice(0, (LT ? 0 : 1) + (c % 2))];
      nb.forEach((id, m) => {
        const i = tail[Math.min(m, tail.length - 1)], nx = at[id][0] - cr.left, ny = at[id][1] - cr.top, dl = Math.hypot(tx - nx, ty - ny) || 1;
        th.push([i, id, (r() - 0.5) * 0.6, sc, [(tx - nx) / dl, (ty - ny) / dl], LT ? dly[i] + T * (0.12 + 0.08 * r()) : dly[i] + 0.03]);
      });
    });
    const [ex, ey] = px(EYE[0], EYE[1]), el = Math.hypot(ex - eyeC[1], ey - eyeC[2]) || 1;
    th.push([-1, eyeC[0], 0.25, EYE_D, [(ex - eyeC[1]) / el, (ey - eyeC[2]) / el], EYE_D + EYE_T + EYE_F * 0.26]);
    dsel = { hosts: hosts.map((h) => h[0]), hostOf, cOf, rel, kn, dly, u, ch: chs, th, eyeHost: eyeC[0], anc, jit, vw, pl };
    dsel.ids = [...new Set([...dsel.hosts, ...th.map((q) => q[1]), ...pl.map((q) => q[0]), ...Array.from(anc).filter((a) => a >= 0)])];
    return true;
  };
  // odbicia węzłów sieci (px): napięcie nici ciągnie węzeł ku znakowi, po zerwaniu tłumiona sprężyna z jednym przestrzeleniem
  function pullsAt(t) {
    const m = new Map();
    if (!dsel) return m;
    const src = LT ? dsel.th.map((q) => [q[1], 1, q[4][0], q[4][1], q[3], q[5]]) : [...dsel.pl, ...dsel.th.filter((q) => q[0] < 0).map((q) => [q[1], 1, q[4][0], q[4][1], q[3], q[5]])];
    for (const [id, wgt, d0x, d0y, d0, ts] of src) {
      const dir = [d0x * wgt, d0y * wgt];
      let a = 0;
      if (t > d0 && t < ts) a = BOUNCE * sstep(d0, ts, t);
      else if (t >= ts && t < ts + 0.6) { const x = t - ts; a = BOUNCE * Math.exp(-x / 0.09) * Math.cos((2 * Math.PI * x) / 0.24); }   // odskok z przestrzeleniem
      if (Math.abs(a) < 0.05) continue;
      const v = m.get(id) || [0, 0]; v[0] += dir[0] * a; v[1] += dir[1] * a; m.set(id, v);
    }
    if (!LT) for (const v of m.values()) { const l = Math.hypot(v[0], v[1]); if (l > 10) { v[0] *= 10 / l; v[1] *= 10 / l; } }   // pulpit: węzeł ciągnięty przez kilka kawałków najwyżej 10 px
    return m;
  }
  const EYEC = `rgb(${NAVY.map((c, j) => Math.round(c + (TEAL[j] - c) * 0.294))})`, EYEA = 0.91;   // barwa i krycie gradientu znaku w punkcie oka
  const px = (u, v) => [ox + (u - VB[0]) * su, oy + (v - VB[1]) * su];
  // oko na kanwie w geometrii SVG (pierścień r 8,2–9,6, źrenica r 5,6 przy 50 %, rdzeń r 3, blik), pierścień do kąta sweep
  function drawEye(cx, cy, a, sweep, core, pup) {
    if (a < 0.01) return;
    ctx.fillStyle = ctx.strokeStyle = EYEC;
    if (sweep > 0.001) { ctx.globalAlpha = a * EYEA; ctx.lineWidth = 1.4 * su; ctx.beginPath(); ctx.arc(cx, cy, 8.9 * su, -Math.PI / 2, -Math.PI / 2 + sweep * Math.PI * 2); ctx.stroke(); }
    if (pup > 0.001) { ctx.globalAlpha = a * EYEA * 0.5 * pup; ctx.beginPath(); ctx.arc(cx, cy, 5.6 * su, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = a * EYEA; ctx.beginPath(); ctx.arc(cx, cy, (0.45 + 2.55 * core) * su, 0, Math.PI * 2); ctx.fill();
    if (core > 0.2) { ctx.fillStyle = '#fff'; ctx.globalAlpha = a * 0.95 * sstep(0.2, 1, core); ctx.beginPath(); ctx.arc(cx - 1.5 * su * core, cy - 1.5 * su * core, 0.9 * su, 0, Math.PI * 2); ctx.fill(); }
  }
  // lepka struna: krzywa kwadratowa (a -> c -> b) jako wypełniony pas, szerokość od w0 do w1 ze zwężeniem neck w środku
  const SNAPR = 0.13;   // odskok końców po zerwaniu (s)
  function strand(ax, ay, cx, cy, bx, by, w0, w1, neck) {
    const n = 10, lx = [], ly = [], rx = [], ry = [];
    for (let j = 0; j <= n; j++) {
      const u = j / n, v = 1 - u;
      const x = v * v * ax + 2 * v * u * cx + u * u * bx, y = v * v * ay + 2 * v * u * cy + u * u * by;
      let tx = 2 * v * (cx - ax) + 2 * u * (bx - cx), ty = 2 * v * (cy - ay) + 2 * u * (by - cy);
      const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      const w = 0.5 * (w0 + (w1 - w0) * u) * (1 - neck * Math.sin(Math.PI * u));
      lx.push(x - ty * w); ly.push(y + tx * w); rx.push(x + ty * w); ry.push(y - tx * w);
    }
    ctx.beginPath(); ctx.moveTo(lx[0], ly[0]);
    for (let j = 1; j <= n; j++) ctx.lineTo(lx[j], ly[j]);
    for (let j = n; j >= 0; j--) ctx.lineTo(rx[j], ry[j]);
    ctx.closePath(); ctx.fill();
  }
  let shown = null;   // ostatnia narysowana chwila: zmiana rozmiaru kanwy ją czyści, więc rysujemy ją ponownie
  function draw(t) {
    shown = t;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    // wypełnienie F prowadzi krycie znaku (zmienna CSS) i wygasza kanwę w tej samej krzywej
    const sh = Dm && dsel ? DSH : 0;   // D: zegar C1 przesunięty o DSH
    const F = brand((t - sh - TL.fill0) / (TL.fill1 - TL.fill0));
    stage.style.setProperty('--c-fill', F.toFixed(3));
    let nodeA = clamp01(t / 0.5) * (1 - F);
    const edgeG = 1 - sstep(TL.edge0 + sh, TL.edge1 + sh, t);
    const sweep = damp((t - sh - 1.8) / 0.35);
    if (Dm && dsel == null && !selectD()) return;   // sieć jeszcze nie narysowana: znak czeka niewidoczny
    const D = Dm && dsel ? dsel : null;
    let hp = null, npos = null;
    if (D) {
      const cr = canvas.getBoundingClientRect(), at = opts.net.at(D.ids);
      if (!at) return;   // sieć jeszcze nie narysowana: grudki czekają niewidoczne
      npos = new Map(D.ids.map((id, j) => [id, [at[j][0] - cr.left, at[j][1] - cr.top]]));
      hp = D.hosts.map((id) => npos.get(id));
      nodeA = (LT ? sstep(0.35, 0.8, t) * (0.6 + 0.4 * sstep(A0 + 0.3, A0 + 0.9, t)) : sstep(Math.min(0.5, A0 - 0.9), Math.min(1.1, A0 - 0.4), t)) * (1 - F);   // węzły kawałków wchodzą z siecią w jej tonie (pulpit: gdy sieć się ustala, przed zbieraniem; telefon: z ryciną, lżej)
    }
    for (let i = 0; i < N; i++) {
      if (D && D.cOf[i] >= 0) {
        // D: węzeł kawałka w okrągłej grudzie przy źródle (RK), napięcie ku literze (czoło mocniej), potem przelot środka
        // kawałka łukiem, a węzeł niesie swoje położenie w kawałku, rozciągane z ruchem (struga) do skali 1 w literze
        const c = D.ch[D.cOf[i]], h = hp[c.k], [tx, ty] = px(c.cx, c.cy), rx = D.rel[i * 2] * su, ry = D.rel[i * 2 + 1] * su;
        const dx = tx - h[0], dy = ty - h[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
        if (!LT) {
          // pulpit: kotwica w sieci -> luźna gruda przed szyją -> szyja (ogon trzyma się SPREAD s) i przelot;
          // ogon leci krócej, więc cały kawałek ląduje razem i siatka ściąga się przy literze
          // zbieranie 0,5-0,15 s przed szyją (ruch), ściemnienie w ostatnich 0,15 s (ton); N0 = start czoła
          const N0 = c.sc + TENS, a = npos.get(D.anc[i]) || h, gp = sstep(N0 - 0.5, N0 - 0.15, t), e = gp;
          DK[i] = sstep(N0 - 0.15, N0, t);
          const sx = a[0] + D.jit[i * 2] + (h[0] + D.kn[i * 2] - a[0] - D.jit[i * 2]) * e, sy = a[1] + D.jit[i * 2 + 1] + (h[1] + D.kn[i * 2 + 1] - a[1] - D.jit[i * 2 + 1]) * e;
          const f = flyEase((t - D.dly[i]) / (c.T - (1 - D.u[i]) * SPREAD)), pull = PULL * sstep(c.sc, c.sc + TENS, t) * (0.4 + 0.6 * D.u[i]) * (1 - f);
          // w locie kawałek pęcznieje w poprzek (do +-BULGE px), żeby płynął masą, a nie kreską
          const bw = c.bend * L * 2 * f * (1 - f) + D.vw[i] * BULGE * Math.sqrt(Math.sin(Math.PI * f)), ex = tx + rx, ey = ty + ry;
          K[i] = f; GP[i] = gp;
          X[i] = sx + (ex - sx) * f - uy * bw + ux * pull; Y[i] = sy + (ey - sy) * f + ux * bw + uy * pull;
          continue;
        }
        const f = flyEase((t - D.dly[i]) / c.T), pull = PULL * sstep(c.sc, c.sc + TENS, t) * (0.4 + 0.6 * D.u[i]) * (1 - f);
        const bw = c.bend * L * 2 * f * (1 - f), g = f * f, kx = D.kn[i * 2] * (1 - g) + rx * g, ky = D.kn[i * 2 + 1] * (1 - g) + ry * g;
        K[i] = f;
        X[i] = h[0] + dx * f - uy * bw + ux * pull + kx; Y[i] = h[1] + dy * f + ux * bw + uy * pull + ky;
        continue;
      }
      const k = damp((t - P[i][2] * 0.5) / 1.0);   // wszystkie wylądowane do 1,5 s
      K[i] = k;
      [X[i], Y[i]] = px(S0[i * 2] + (P[i][0] - S0[i * 2]) * k, S0[i * 2 + 1] + (P[i][1] - S0[i * 2 + 1]) * k);
    }
    if (D) {
      // nici do sieci: zwykła krawędź, potem sprężyste napięcie (cienieje, blednie, wygina się) i zerwanie z cofnięciem
      ctx.fillStyle = `rgb(${TEAL})`;
      const pre0 = sstep(Math.max(0, A0 - 0.5), Math.max(0.2, A0 - 0.1), t);   // jak krawędzie sieci: gdy sieć już stoi
      for (const [i, id, bnd, d0, , ts] of D.th) {
        if (t >= ts + SNAPR) continue;
        const pre = LT ? pre0 : i < 0 ? 1 : GP[i];   // pulpit: nić widać, gdy kawałek się zbiera
        const [nx, ny] = npos.get(id);
        let x0, y0;
        if (i < 0) { if (t < d0) continue; const e = eyePos(t, npos); if (!e) continue; [x0, y0] = e; } else { x0 = X[i]; y0 = Y[i]; }
        const L = Math.hypot(x0 - nx, y0 - ny) || 1, ux = (x0 - nx) / L, uy = (y0 - ny) / L;
        if (t < ts) {
          // napięcie: nić wygina się, cienieje w środku (szyjka), końce zostają grube i przyklejone; krycie rośnie z naciągiem
          // grubość maleje z naciągiem, końce zostają szersze (przyklejone), przed zerwaniem przewężenie w środku
          // pulpit: nić 2 -> 1,5 px (czytelna w skali 1:1), telefon: 1,4 -> 0,7 px
          const tau = sstep(d0, ts, t), b = bnd * L * (0.15 + 0.85 * tau), we = LT ? 1.4 * (1 - 0.5 * tau) : 2 * (1 - 0.25 * tau);
          ctx.globalAlpha = pre * (LT ? 0.3 + 0.3 * tau : 0.35 + 0.3 * tau);
          strand(nx, ny, (x0 + nx) / 2 - uy * b, (y0 + ny) / 2 + ux * b, x0, y0, we, we, (LT ? 0.8 : 0.6) * sstep(0.4, 1, tau));
        } else {
          // zerwanie: oba końce odskakują (SNAPR): kikut wraca do swojego węzła z przestrzeleniem na drugą stronę
          // i znika dopiero w nim; krycie stałe do końca odskoku
          const e = clamp01((t - ts) / SNAPR), k = Math.pow(1 - e, 1.5) * Math.cos(1.5 * Math.PI * e);
          const r0 = Math.min(L * 0.45, 40) * k, r1 = Math.min(L * 0.3, 24) * k;
          ctx.globalAlpha = 0.55 * (1 - sstep(0.8, 1, e));
          strand(nx, ny, nx + ux * r0 * 0.5, ny + uy * r0 * 0.5, nx + ux * r0, ny + uy * r0, 1.5, 0.3, 0);
          strand(x0, y0, x0 - ux * r1 * 0.5, y0 - uy * r1 * 0.5, x0 - ux * r1, y0 - uy * r1, 1.3, 0.3, 0);
        }
      }
    }
    // krawędź pojawia się dopiero, gdy jej długość zbliża się do docelowej (węzły się spotkały): 6 progów krycia
    ctx.lineWidth = Math.max(0.6, su * 0.16);
    const cA = LT ? sstep(0.35, 0.8, t) : 1;   // D: siatka kawałków pojawia się z siecią (telefon: z ryciną)
    let stE = 0, stN = 0;   // licznik (stats): krawędzie o kryciu >= 0,2 i widoczne węzły
    if (edgeG > 0.003) for (let lv = 1; lv <= 6; lv++) {
      ctx.globalAlpha = 0.42 * (lv / 6) * edgeG;
      ctx.beginPath();
      let any = false;
      for (let q = 0; q < E.length; q += 2) {
        const a = E[q], b = E[q + 1];
        if (a >= ring0 && b >= ring0) continue;   // pętlę pierścienia zastępuje łuk oka
        const ratio = Math.hypot(X[a] - X[b], Y[a] - Y[b]) / (su * L0[q >> 1]);
        // D: krawędź wewnątrz kawałka płynie z nim (gruda, struga): im mocniej rozciągnięta, tym bledsza; między kawałkami
        // i w C1 krawędź zapala się, gdy węzły się spotkają
        const w = D && D.cOf[a] >= 0 && D.cOf[a] === D.cOf[b] ? (LT ? cA * Math.min(1, 1.6 / Math.max(0.01, ratio)) * (ratio < 9 ? 1 : 0)
            : Math.min(GP[a], GP[b]) * Math.max(0.3, Math.min(1, 1.6 / Math.max(0.01, ratio))))   // pulpit: siatka od zebrania, szyja widoczna do zerwania
          : (1 - sstep(1.3, 2.6, ratio)) * sstep(0.5, 0.9, Math.min(K[a], K[b]));
        const l = Math.min(6, Math.ceil(w * 6 - 0.01));
        if (l !== lv) continue;
        ctx.moveTo(X[a], Y[a]); ctx.lineTo(X[b], Y[b]); any = true;
        if (lv >= 3) stE++;
      }
      if (any) ctx.stroke();
    }
    if (nodeA > 0.003) {
      for (let tn = 0; tn < 6; tn++) {
        const g = tn / 5;
        ctx.fillStyle = `rgb(${NAVY.map((c, j) => Math.round(c + (TEAL[j] - c) * g))})`;
        ctx.globalAlpha = nodeA * (1 - 0.3 * g);
        ctx.beginPath();
        for (let i = 0; i < N; i++) {
          if (tone[i] !== tn) continue;
          if (i >= ring0 && ((i - ring0) / ringN + 0.25) % 1 > sweep) continue;   // węzły pętli tylko za czołem pierścienia
          if (DK[i] < 0.999 || (D && !LT && D.cOf[i] >= 0 && K[i] < 0.02)) continue;   // pulpit: węzeł kawałka przed lotem rysowany niżej
          const rr = Math.max(0.7, su * (0.2 + 0.16 * P[i][3])) * (D && D.cOf[i] >= 0 ? (LT ? 1 + 0.35 * (1 - K[i]) : 0.85 + 0.15 * K[i]) : 1);   // telefon: masa w sieci i w locie; pulpit: gruda drobniejsza
          ctx.moveTo(X[i] + rr, Y[i]); ctx.arc(X[i], Y[i], rr, 0, Math.PI * 2);
          if (ctx.globalAlpha >= 0.2) stN++;
        }
        ctx.fill();
      }
      if (D && !LT) {
        // węzły kawałków przed szyją: kolor, krycie i rozmiar jak węzły sieci, ciemnieją dopiero w ostatnich 0,15 s (4 progi)
        for (let lv = 0; lv < 4; lv++) {
          const g = lv / 3;
          ctx.fillStyle = `rgb(${NAVY.map((c, j) => Math.round(c + (TEAL[j] - c) * (0.8 - 0.6 * g)))})`;
          ctx.globalAlpha = nodeA * (0.4 + 0.4 * g);   // najciemniej 0,8 i z domieszką tonu sieci: gruda <= 2 x skupisko
          ctx.beginPath();
          for (let i = 0; i < N; i++) {
            if (D.cOf[i] < 0 || K[i] >= 0.02 || Math.min(3, Math.floor(DK[i] * 4)) !== lv) continue;
            const rr = Math.max(0.8, su * (0.2 + 0.16 * P[i][3])) * (0.9 + 0.1 * GP[i]);
            ctx.moveTo(X[i] + rr, Y[i]); ctx.arc(X[i], Y[i], rr, 0, Math.PI * 2);
            if (ctx.globalAlpha >= 0.2) stN++;
          }
          ctx.fill();
        }
      }
      // piasty liter: geometria oka węzła z net.js (pierścień 1–0,854, źrenica 0,583 przy 50 %, rdzeń 0,3125)
      ctx.strokeStyle = ctx.fillStyle = `rgb(${NAVY})`;
      for (const i of hubs) {
        const R = su * 1.35, hA = nodeA * DK[i] * DK[i];   // pulpit: piasta liter wyłania się dopiero w ściemnionej grudzie
        if (hA < 0.01) continue;
        ctx.globalAlpha = hA; ctx.lineWidth = R * 0.146;
        ctx.beginPath(); ctx.arc(X[i], Y[i], R * 0.927, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = hA * 0.5;
        ctx.beginPath(); ctx.arc(X[i], Y[i], R * 0.583, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = hA;
        ctx.beginPath(); ctx.arc(X[i], Y[i], R * 0.3125, 0, Math.PI * 2); ctx.fill();
      }
    }
    // najmocniejszy węzeł sieci ląduje w miejscu źrenicy jako ostatni i zapala się, potem rysuje się pierścień
    if (D) {
      const e = eyePos(t, npos);
      if (e && t >= EYE_D) drawEye(e[0], e[1], clamp01((t - EYE_D) / 0.12) * (1 - F), sweep, damp((t - sh - 1.55) / 0.3), damp((t - sh - 1.65) / 0.3));
    } else {
      const k = damp((t - 0.55) / 1.0);
      const [ex, ey] = px(ES[0] + (EYE[0] - ES[0]) * k, ES[1] + (EYE[1] - ES[1]) * k);
      drawEye(ex, ey, clamp01((t - 0.55) / 0.3) * (1 - F), sweep, damp((t - 1.55) / 0.3), damp((t - 1.65) / 0.3));
    }
    ctx.globalAlpha = 1;
    stats = { t: +t.toFixed(3), nodes: stN, edges: stE, all: N, allEdges: E.length / 2 };
  }
  let stats = null;   // ostatnie rysowanie: węzły i krawędzie widoczne (krycie >= 0,2), do pomiaru złożoności liter
  // oko w D: startuje z piasty sieci (gospodarz oka), napina się, leci łukiem i ląduje w źrenicy
  function eyePos(t, npos) {
    const h = npos && npos.get(dsel.eyeHost);
    if (!h) return null;
    const [tx, ty] = px(EYE[0], EYE[1]), dx = tx - h[0], dy = ty - h[1], dl = Math.hypot(dx, dy) || 1, ux = dx / dl, uy = dy / dl;
    const pull = PULL * sstep(0, 1, clamp01((t - EYE_D) / EYE_T)), qx = h[0] + ux * pull, qy = h[1] + uy * pull;
    const f = flyEase((t - EYE_D - EYE_T) / EYE_F), L = Math.hypot(tx - qx, ty - qy), bw = 0.18 * L * Math.sin(Math.PI * f);
    return [qx + (tx - qx) * f - uy * bw, qy + (ty - qy) * f + ux * bw];
  }

  const END = () => (Dm && dsel !== false ? TL.fill1 + DSH : TL.fill1);   // D: C1 przesunięty o DSH (wszystkie nici zerwane wcześniej); false = brak D
  let still = !!opts.still, loop = 0, prev = 0, live = true, t0 = null, waiting = false;
  const begin = () => {
    waiting = false; prev = t0 = performance.now(); loop = requestAnimationFrame(tick);
    stage.dispatchEvent(new CustomEvent('znak-start', { detail: t0 }));
  };
  // kanwa po wejściu nie trzyma bufora
  // po wejściu kanwa znika z dokumentu: nie trzyma bufora ani pudełka (żadnego wpływu na układ po zmianie okna)
  const release = () => { if (loop) return; live = false; shown = null; canvas.width = canvas.height = 1; canvas.remove(); };
  const finish = () => {
    const was = !!loop || waiting;
    cancelAnimationFrame(loop); loop = 0;
    if (was) stage.dispatchEvent(new CustomEvent('znak-koniec'));   // main.js: kursor włącza się dopiero po wejściu
    if (Dm && opts.net.bounce) opts.net.bounce(new Map());
    stage.classList.remove('c-run');
    stage.style.removeProperty('--c-fill');
    setTimeout(release, 700);
  };
  // zegar ścienny, nie suma klatek: na wolnym urządzeniu klatek jest mniej, ale ruch i tak kończy się po ok. 3 s
  const tick = (now) => {
    const t = (now - prev) / 1000;
    draw(t);
    if (Dm && opts.net.bounce) opts.net.bounce(pullsAt(t));   // telefon: rycina odbija węzły sama
    if (t >= END()) { finish(); return; }
    loop = requestAnimationFrame(tick);
  };
  fit();
  Dm = !!(opts.net && (field || plate));
  if (opts.t != null && opts.t < (Dm ? TL.fill1 + DSH : TL.fill1)) {
    // klatka zamrożona (tryb klatek): stan wejścia w chwili t, bez przejść
    stage.classList.add('c-run');
    draw(opts.t);
  } else if (!still && !opts.late && opts.t == null) {
    // karta w tle: znak czeka niewidoczny (stan t = 0) i gra pełne wejście po pokazaniu karty
    stage.classList.add('c-run');
    draw(0);
    if (!document.hidden) begin();
    else {
      // karta w tle: czekamy na pokazanie, ale najdłużej do 8 s od wczytania (jak zasłona CSS); potem znak statyczny,
      // żeby narzędzie z kartą stale ukrytą nie zostało z pustym miejscem i kanwą w dokumencie
      waiting = true;
      setTimeout(() => { if (waiting) { waiting = false; finish(); release(); } }, Math.max(0, 8000 - performance.now()));
    }
  } else {
    release();
  }
  let rz = 0;
  new ResizeObserver(() => { clearTimeout(rz); rz = setTimeout(() => { if (!live) return; fit(); if (!loop && shown != null) draw(shown); }, 120); }).observe(stage);
  document.addEventListener('visibilitychange', () => { if (document.hidden && loop) finish(); else if (!document.hidden && waiting && !still) begin(); });

  return {
    t0,
    get waiting() { return waiting; },
    setStill(v) { still = v; if (v) { if (loop || waiting) { waiting = false; finish(); } release(); } },
    redraw() { if (live && shown != null) draw(shown); },   // tryb klatek: po narysowaniu sceny (grudki i nici trzymają się jej węzłów)
    // odbicia węzłów sieci w bieżącej chwili (Map id -> [dx, dy] px); pusta po wejściu i przy ruchu zatrzymanym
    pulls() { return live && !still && shown != null && (loop || opts.t != null) ? pullsAt(shown) : new Map(); },
    stats: () => stats,
    get end() { return END(); },   // koniec wejścia na zegarze znaku (s)
    // pomiar (tryb klatek): położenia węzłów w px kanwy, K i kawałek węzła (-1 poza D)
    nodes: () => ({ X: Array.from(X), Y: Array.from(Y), K: Array.from(K), c: dsel ? Array.from(dsel.cOf) : [] }),
  };
}
