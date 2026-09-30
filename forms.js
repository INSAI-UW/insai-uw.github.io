// forms.js – geometria sieci wspólna dla sceny three.js (pulpit)
// i dla rycin Canvas 2D (telefon, tablet, pulpit bez WebGL). Moduł nie zna three.js.
// Siedem formacji tych samych 1338 węzłów: 0 pole, 1 koło, 2 dokument, 3 oś, 4 sieć otwarta, 5 członkostwo, 6 zarząd.

export const N = 1338;
// oś kamery kadru 03: koło F1 widziane z góry, 35° nad płaszczyzną koła (oś widzenia 55° od normalnej; przy obrocie ±7°:
// 54–57°): elipsa szeroka i niska, wielka oś pochylona o 13° (prawy koniec niżej), bez osi symetrii pionowej
const PLANY_CAM = [-0.147, 0.405, 0.903];

// Układ wierszy uchwały nr 75: prekomputowane dane ekstrakcji tekstowej, 9 stron.
// Format: strona,wiersz,wcięcie,długość,paragraf[h = wiersz „§ n”].
// Paragraf 10 = tytuł uchwały, 11 = § 9 ust. 3. Sama geometria, bez treści.
const DOC = "0,0,32,35,0;0,1,32,34,0;0,5,39,7,0;0,8,28,13,10;0,9,18,36,10;0,11,29,26,10;0,13,23,32,10;0,14,19,45,10;0,15,29,22,10;0,17,8,75,0;0,18,0,87,0;0,19,0,79,0;0,20,0,72,0;0,21,0,77,0;0,22,0,73,0;0,23,0,84,0;0,24,0,10,0;0,25,41,2,1h;0,26,38,9,1;0,27,6,48,1;0,28,0,69,1;0,29,3,44,1;0,30,0,77,1;0,31,3,71,1;0,32,3,68,1;0,33,3,79,1;0,34,3,77,1;0,35,3,76,1;0,36,3,78,1;0,37,3,69,1;0,38,3,70,1;0,39,3,62,1;0,40,3,73,1;0,41,3,79,1;0,42,3,56,1;1,0,40,2,2h;1,1,24,32,2;1,2,6,61,2;1,3,0,76,2;1,4,0,75,2;1,5,0,7,2;1,6,6,70,2;1,7,0,73,2;1,8,0,78,2;1,9,0,63,2;1,10,6,71,2;1,11,0,76,2;1,12,0,40,2;1,13,7,66,2;1,14,0,82,2;1,15,0,22,2;1,16,8,67,2;1,17,0,85,2;1,18,0,47,2;1,19,40,2,3h;1,20,16,46,3;1,21,7,65,3;1,22,0,72,3;1,23,0,80,3;1,24,0,81,3;1,25,0,53,3;1,26,7,69,3;1,27,0,57,3;1,28,0,71,3;1,29,4,71,3;1,30,4,72,3;1,31,4,80,3;1,32,0,75,3;1,33,4,66,3;1,34,4,41,3;1,35,4,28,3;1,36,4,23,3;1,37,4,28,3;1,38,4,48,3;2,0,0,73,3;2,1,3,68,3;2,2,3,65,3;2,3,3,21,3;2,4,0,78,3;2,5,3,77,3;2,6,3,31,3;2,7,7,69,3;2,8,0,64,3;2,9,0,37,3;2,10,0,76,3;2,11,4,77,3;2,12,4,77,3;2,13,4,29,3;2,14,0,65,3;2,15,4,77,3;2,16,4,78,3;2,17,0,66,3;2,18,4,67,3;2,19,4,40,3;2,20,0,68,3;2,21,4,79,3;2,22,4,70,3;2,23,4,49,3;2,24,0,80,3;2,25,4,66,3;2,26,0,78,3;2,27,4,70,3;2,28,4,72,3;2,29,4,69,3;2,30,4,42,3;2,31,7,72,3;2,32,0,70,3;2,33,0,77,3;2,34,4,74,3;2,35,4,77,3;2,36,4,59,3;2,37,0,75,3;2,38,4,79,3;2,39,4,75,3;2,40,0,67,3;2,41,4,72,3;3,0,3,76,3;3,1,3,21,3;3,2,0,68,3;3,3,3,68,3;3,4,3,69,3;3,5,3,9,3;3,6,0,75,3;3,7,3,78,3;3,8,3,64,3;3,9,40,2,4h;3,10,15,46,4;3,11,7,71,4;3,12,0,77,4;3,13,0,85,4;3,14,7,71,4;3,15,0,67,4;3,16,0,73,4;3,17,4,75,4;3,18,4,72,4;3,19,4,38,4;3,20,0,75,4;3,21,4,71,4;3,22,4,67,4;3,23,4,80,4;3,24,4,64,4;3,25,4,13,4;3,26,0,65,4;3,27,4,69,4;3,28,4,77,4;3,29,4,69,4;3,30,0,75,4;3,31,4,76,4;3,32,4,77,4;3,33,4,24,4;3,34,0,71,4;3,35,4,76,4;3,36,4,73,4;3,37,4,44,4;3,38,0,71,4;3,39,4,79,4;3,40,4,71,4;4,0,3,70,4;4,1,3,31,4;4,2,0,66,4;4,3,3,70,4;4,4,3,11,4;4,5,7,71,4;4,6,0,62,4;4,7,0,37,4;4,8,0,68,4;4,9,4,13,4;4,10,0,69,4;4,11,4,65,4;4,12,4,72,4;4,13,0,75,4;4,14,4,71,4;4,15,4,78,4;4,16,0,74,4;4,17,4,69,4;4,18,4,45,4;4,19,0,77,4;4,20,4,79,4;4,21,4,77,4;4,22,4,78,4;4,23,4,68,4;4,24,4,69,4;4,25,4,10,4;4,26,7,71,4;4,27,0,71,4;4,28,0,75,4;4,29,4,70,4;4,30,4,72,4;4,31,4,77,4;4,32,4,12,4;4,33,0,80,4;4,34,4,78,4;4,35,4,72,4;4,36,4,51,4;4,37,0,72,4;4,38,4,76,4;4,39,4,21,4;4,40,6,73,4;4,41,0,59,4;5,0,0,72,4;5,1,0,74,4;5,2,3,64,4;5,3,3,67,4;5,4,39,2,5h;5,5,15,45,5;5,6,6,69,5;5,7,0,79,5;5,8,0,13,5;5,9,6,66,5;5,10,0,75,5;5,11,0,62,5;5,12,6,63,5;5,13,0,76,5;5,14,0,81,5;5,15,0,3,5;5,16,7,72,5;5,17,0,80,5;5,18,0,5,5;5,19,0,74,5;5,20,4,42,5;5,21,0,57,5;5,22,0,78,5;5,23,4,9,5;5,24,6,67,5;5,25,0,81,5;5,26,0,69,5;5,27,6,66,5;5,28,0,68,5;5,29,0,42,5;5,30,6,70,5;5,31,0,78,5;5,32,0,79,5;5,33,0,75,5;5,34,6,67,5;5,35,0,80,5;5,36,0,61,5;6,0,40,2,6h;6,1,25,31,6;6,2,8,67,6;6,3,0,78,6;6,4,0,75,6;6,5,0,14,6;6,6,7,69,6;6,7,0,74,6;6,8,0,75,6;6,9,0,37,6;6,10,7,70,6;6,11,0,38,6;6,12,0,82,6;6,13,4,30,6;6,14,0,52,6;6,15,0,46,6;6,16,7,64,6;6,17,0,64,6;6,18,6,71,6;6,19,0,64,6;6,20,6,68,6;6,21,0,69,6;6,22,6,66,6;6,23,0,72,6;6,24,0,19,6;6,25,6,64,6;6,26,0,72,6;6,27,0,79,6;6,28,4,67,6;6,29,0,74,6;6,30,4,48,6;6,31,7,77,6;6,32,0,77,6;6,33,0,72,6;6,34,0,83,6;6,35,0,24,6;6,36,6,69,6;6,37,0,72,6;7,0,0,78,6;7,1,0,36,6;7,2,6,69,6;7,3,0,73,6;7,4,0,81,6;7,5,0,14,6;7,6,0,79,6;7,7,0,39,6;7,8,40,2,7h;7,9,32,15,7;7,10,5,68,7;7,11,0,75,7;7,12,7,68,7;7,13,0,62,7;7,14,0,73,7;7,15,0,73,7;7,16,4,72,7;7,17,0,75,7;7,18,4,73,7;7,19,4,64,7;7,20,4,53,7;7,21,7,71,7;7,22,0,54,7;7,23,0,75,7;7,24,4,73,7;7,25,4,74,7;7,26,4,67,7;7,27,4,78,7;7,28,4,80,7;7,29,4,39,7;7,30,0,74,7;7,31,4,61,7;7,32,7,73,7;7,33,0,80,7;7,34,0,46,7;7,35,6,71,7;7,36,0,66,7;7,37,0,30,7;7,38,0,56,7;7,39,0,24,7;7,40,0,49,7;8,0,0,32,7;8,1,7,63,7;8,2,0,85,7;8,3,0,71,7;8,4,0,80,7;8,5,0,82,7;8,6,0,74,7;8,7,0,74,7;8,8,0,67,7;8,9,0,77,7;8,10,0,25,7;8,11,7,70,7;8,12,0,72,7;8,13,0,76,7;8,14,0,84,7;8,15,0,35,7;8,16,40,2,8h;8,17,25,30,8;8,18,6,73,8;8,19,0,19,8;8,20,5,66,8;8,21,0,59,8;8,22,6,70,8;8,23,0,79,8;8,24,0,70,8;8,25,6,66,8;8,26,0,35,8;8,27,40,2,9h;8,28,8,72,9;8,29,0,81,9;8,30,0,73,9;8,31,6,67,9;8,32,6,57,11";

function rng(seed) {
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gauss(r) {
  let u = 0, v = 0;
  while (!u) u = r();
  while (!v) v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function addEdge(out, seen, i, j) {
  if (i === j) return;
  const a = Math.min(i, j), b = Math.max(i, j), key = a * 4096 + b;
  if (seen.has(key)) return;
  seen.add(key);
  out.push(a, b);
}
// k najbliższych sąsiadów na siatce komórek, bez porównania wszystkich par.
function knn(P, idx, k, out, seen, cell = 1.1) {
  const key = (x, y, z) => ((x + 512) * 1024 + (y + 512)) * 1024 + (z + 512);
  const grid = new Map();
  const cx = (i) => [Math.floor(P[i * 3] / cell), Math.floor(P[i * 3 + 1] / cell), Math.floor(P[i * 3 + 2] / cell)];
  for (const i of idx) { const c = key(...cx(i)); if (!grid.has(c)) grid.set(c, []); grid.get(c).push(i); }
  const bd = new Float64Array(k), bj = new Int32Array(k);
  for (const i of idx) {
    const [gx, gy, gz] = cx(i);
    let n = 0;
    for (let r = 1; r <= 6 && n < k; r++) {
      n = 0; bd.fill(Infinity); bj.fill(-1);
      for (let x = gx - r; x <= gx + r; x++) for (let y = gy - r; y <= gy + r; y++) for (let z = gz - r; z <= gz + r; z++) {
        const b = grid.get(key(x, y, z)); if (!b) continue;
        for (const j of b) {
          if (j === i) continue;
          const dx = P[i * 3] - P[j * 3], dy = P[i * 3 + 1] - P[j * 3 + 1], dz = P[i * 3 + 2] - P[j * 3 + 2];
          const d = dx * dx + dy * dy + dz * dz;
          if (d > bd[k - 1] || (d === bd[k - 1] && j > bj[k - 1])) continue;
          let q = k - 1;   // wstawienie do k najlepszych (k jest małe), remis rozstrzyga numer węzła
          while (q > 0 && (bd[q - 1] > d || (bd[q - 1] === d && bj[q - 1] > j))) { bd[q] = bd[q - 1]; bj[q] = bj[q - 1]; q--; }
          bd[q] = d; bj[q] = j; n++;
        }
      }
    }
    for (let q = 0; q < k; q++) if (bj[q] >= 0) addEdge(out, seen, i, bj[q]);
  }
}
function set(F, i, x, y, z) { F[i * 3] = x; F[i * 3 + 1] = y; F[i * 3 + 2] = z; }
function orderBy(F, axis) {
  return Array.from({ length: N }, (_, i) => i).sort((a, b) => F[a * 3 + axis] - F[b * 3 + axis] || a - b);
}

// Leporello: strona 6 x 8.49 (proporcja A4), składana w zygzak.
export const PAGE = { w: 6, h: 8.49, fold: 0.32, pages: 9 };
function foldPoint(k) {
  const step = PAGE.w * Math.cos(PAGE.fold);
  return [(k - PAGE.pages / 2) * step, k % 2 ? PAGE.w * Math.sin(PAGE.fold) : 0];
}
export function pageCenter(k) {
  const a = foldPoint(k), b = foldPoint(k + 1);
  return [(a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2];
}

// Oś czyta pozycje i daty z listy HTML. Odstęp optyczny rozdziela bliskie daty.
// Nie jest skalą czasu do odczytu liczbowego. Pierścień rozdziela dwie części listy.
export function timelineItems(doc = globalThis.document) {
  return doc ? [...doc.querySelectorAll('.timeline > .tl')].map((el) => ({
    key: el.dataset.cam, date: el.querySelector('time')?.dateTime,
    after: el.closest('[data-timeline]').hasAttribute('data-after'),
  })) : [];
}
export function timelineModel(items = timelineItems()) {
  const months = items.map(({ date }) => {
    const [y, m, d = 1] = (date || '').split('-').map(Number);
    if (!y || !m) throw new Error('Brak daty pozycji osi');
    return (y - 2025) * 12 + m - 5 + (d - 1) / 30;
  });
  const knots = months.map((m, i) => Math.max(m, ...months.slice(0, i).map((v, j) => v + (i - j) * 0.85)));
  const before = knots.filter((_, i) => !items[i].after);
  const after = knots.filter((_, i) => items[i].after);
  const ring = before.length && after.length ? (Math.max(...before) + Math.min(...after)) / 2 : 12.6;
  return { knots, ring, ringId: items.length + 1, span: Math.max(15, ...knots.map((m) => m + 1.4)) };
}
export const TIMELINE = timelineModel();
export function curve(m) {
  return [-26 + (m * 52) / TIMELINE.span, Math.sin(m * 0.5) * 1.0, Math.cos(m * 0.37) * 1.3 - 1.3];
}

let cache = null;
// build() liczy wszystko od razu (pulpit, scena three.js); buildAsync() te same kroki oddaje
// wątkowi głównemu między formacjami (telefon: bez jednego długiego zadania).
export function build() {
  if (cache) return cache;
  const it = steps(); let s = it.next();
  while (!s.done) s = it.next();
  return (cache = s.value);
}
export async function buildAsync() {
  if (cache) return cache;
  const it = steps(); let s = it.next();
  while (!s.done) { await new Promise((r) => setTimeout(r, 0)); if (cache) return cache; s = it.next(); }
  return (cache = cache || s.value);
}
function* steps() {
  const r = rng(1338);
  const F = [0, 1, 2, 3, 4, 5, 6].map(() => new Float32Array(N * 3));
  const seed = new Float32Array(N), size = new Float32Array(N);
  const par = new Float32Array(N), knot = new Float32Array(N);
  for (let i = 0; i < N; i++) { seed[i] = r(); size[i] = 0.6 + 0.8 * r() * r(); }

  // F0 pole: dziewięć rozdzielonych skupisk i rzadkie tło (mapa powiązań)
  const C = [];
  while (C.length < 9) {
    const c = [(r() * 2 - 1) * 8.8, (r() * 2 - 1) * 4.6, (r() * 2 - 1) * 4.4];
    if (C.every((o) => Math.hypot(o.c[0] - c[0], o.c[1] - c[1], (o.c[2] - c[2]) * 0.7) > 4.2)) {
      C.push({ c, s: [0.55 + r() * 0.75, 0.45 + r() * 0.55, 0.5 + r() * 0.7] });
    }
  }
  const cl = new Int16Array(N);
  for (let i = 0; i < N; i++) {
    if (r() < 0.9) {
      const k = Math.min(8, Math.floor(Math.pow(r(), 1.35) * 9)), c = C[k];
      cl[i] = k;
      set(F[0], i, c.c[0] + gauss(r) * c.s[0], c.c[1] + gauss(r) * c.s[1], c.c[2] + gauss(r) * c.s[2]);
    } else {
      cl[i] = -1;
      let x, y, z;
      do { x = r() * 2 - 1; y = r() * 2 - 1; z = r() * 2 - 1; } while (x * x + y * y + z * z > 1);
      set(F[0], i, x * 11, y * 6, z * 6);
    }
  }
  const hubs = [];
  C.forEach((c, k) => {
    let best = -1, bd = 1e9;
    for (let i = 0; i < N; i++) {
      if (cl[i] !== k) continue;
      const d = Math.hypot(F[0][i * 3] - c.c[0], F[0][i * 3 + 1] - c.c[1], F[0][i * 3 + 2] - c.c[2]);
      if (d < bd) { bd = d; best = i; }
    }
    if (best >= 0) { size[best] = 2.8; hubs.push(best); }
  });
  // F4 sieć otwarta: to samo pole, obrócone i rozszerzone
  const ca = Math.cos(0.7), sa = Math.sin(0.7);
  for (let i = 0; i < N; i++) {
    const x = F[0][i * 3], y = F[0][i * 3 + 1], z = F[0][i * 3 + 2];
    set(F[4], i, (x * ca + z * sa) * 2.3, y * 2.6, (-x * sa + z * ca) * 2.3);
  }
  yield;
  const all = Array.from({ length: N }, (_, i) => i);
  const E = { net: [], ring: [], doc: [], thread: [], czl: [], skl: [] };
  let seen = new Set();
  knn(F[0], all, 3, E.net, seen);
  for (let q = 0; q < 60; q++) {
    const i = Math.floor(r() * N), j = Math.floor(r() * N);
    if (cl[i] >= 0 && cl[j] >= 0 && cl[i] !== cl[j] && Math.abs(cl[i] - cl[j]) < 4) addEdge(E.net, seen, i, j);
  }

  yield;
  // F1 koło: pierścień (torus), kolejność kątowa z pola
  const byAngle = all.slice().sort((a, b) => Math.atan2(F[0][a * 3 + 1], F[0][a * 3]) - Math.atan2(F[0][b * 3 + 1], F[0][b * 3]) || a - b);
  const R = 6.4, rx = 0.52, ry = -0.38;
  const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry);
  byAngle.forEach((i, j) => {
    const th = (j / N) * Math.PI * 2 + gauss(r) * 0.004;
    const ph = r() * Math.PI * 2, rho = 1.0 * Math.sqrt(r());
    const x = (R + rho * Math.cos(ph)) * Math.cos(th), y = (R + rho * Math.cos(ph)) * Math.sin(th), z = rho * Math.sin(ph);
    const y1 = y * cx - z * sx, z1 = y * sx + z * cx;
    const x2 = x * cy + z1 * sy, z2 = -x * sy + z1 * cy;
    set(F[1], i, x2, y1, z2);
  });
  seen = new Set();
  for (let j = 0; j < N; j++) {
    addEdge(E.ring, seen, byAngle[j], byAngle[(j + 1) % N]);
    addEdge(E.ring, seen, byAngle[j], byAngle[(j + 2) % N]);
    if (j % 2 === 0) addEdge(E.ring, seen, byAngle[j], byAngle[(j + 11) % N]);
  }

  yield;
  // F2 dokument: wiersze uchwały, węzły wzdłuż wierszy
  const lines = DOC.split(";").map((s) => {
    const h = s.endsWith("h");
    const [p, l, ind, len, pr] = s.replace("h", "").split(",").map(Number);
    return { p, l, ind, len, pr, h };
  });
  const total = lines.reduce((a, b) => a + b.len, 0);
  const extra = N - 2 * lines.length;
  const cnt = lines.map((ln) => 2 + Math.floor((extra * ln.len) / total));
  let rest = N - cnt.reduce((a, b) => a + b, 0);
  for (let q = 0; rest > 0; q = (q + 7) % lines.length) { if (lines[q].len > 30) { cnt[q]++; rest--; } }
  const slots = [];
  const lh = (PAGE.h - 0.8) / 43, cw = (PAGE.w - 0.8) / 88;
  lines.forEach((ln, li) => {
    const a = foldPoint(ln.p), b = foldPoint(ln.p + 1);
    const n = cnt[li];
    for (let q = 0; q < n; q++) {
      const col = ln.ind + (n === 1 ? 0 : (q / (n - 1)) * ln.len) + (q > 0 && q < n - 1 ? (r() - 0.5) * 1.2 : 0);
      const lx = -PAGE.w / 2 + 0.4 + col * cw;
      const u = (lx + PAGE.w / 2) / PAGE.w;
      slots.push({ x: a[0] + (b[0] - a[0]) * u, y: PAGE.h / 2 - 0.4 - ln.l * lh, z: a[1] + (b[1] - a[1]) * u, pr: ln.pr, line: li });
    }
  });
  const nodesByX = orderBy(F[1], 0);
  const slotOrder = slots.map((s, k) => k).sort((a, b) => slots[a].x - slots[b].x || a - b);
  const slotNode = new Int32Array(slots.length);
  slotOrder.forEach((k, j) => {
    const i = nodesByX[j], s = slots[k];
    slotNode[k] = i;
    set(F[2], i, s.x, s.y, s.z);
    par[i] = s.pr;
  });
  seen = new Set();
  for (let k = 1; k < slots.length; k++) {
    if (slots[k].line === slots[k - 1].line) addEdge(E.doc, seen, slotNode[k - 1], slotNode[k]);
  }

  yield;
  // F3 oś: nić z pięciu splotów, węzły pozycji HTML i pierścień.
  const tslots = [];
  const per = Math.min(88, Math.floor((N - 320) / Math.max(1, TIMELINE.knots.length)));
  TIMELINE.knots.forEach((m, k) => {
    const c = curve(m);
    for (let q = 0; q < per; q++) tslots.push({ p: [c[0] + gauss(r) * 0.55, c[1] + gauss(r) * 0.55, c[2] + gauss(r) * 0.55], kn: k + 1, m, s: -1 });
  });
  const rc = curve(TIMELINE.ring);
  for (let q = 0; q < 160; q++) {
    const ph = (q / 160) * Math.PI * 2;
    tslots.push({ p: [rc[0] + gauss(r) * 0.08, rc[1] + Math.cos(ph) * 2.2 + gauss(r) * 0.06, rc[2] + Math.sin(ph) * 2.2 + gauss(r) * 0.06], kn: TIMELINE.ringId, m: TIMELINE.ring, s: -2 });
  }
  const strandN = N - tslots.length;
  for (let q = 0; q < strandN; q++) {
    const s = q % 5, m = r() * TIMELINE.span, c = curve(m), ang = m * 1.9 + (s * Math.PI * 2) / 5;
    const rr = 0.55 + 0.12 * Math.sin(m * 3.1 + s);
    tslots.push({ p: [c[0], c[1] + Math.cos(ang) * rr, c[2] + Math.sin(ang) * rr], kn: 0, m, s });
  }
  const nodesByDocX = orderBy(F[2], 0);
  const tOrder = tslots.map((s, k) => k).sort((a, b) => tslots[a].p[0] - tslots[b].p[0] || a - b);
  const tNode = new Int32Array(tslots.length);
  tOrder.forEach((k, j) => {
    const i = nodesByDocX[j], s = tslots[k];
    tNode[k] = i;
    set(F[3], i, s.p[0], s.p[1], s.p[2]);
    knot[i] = s.kn;
  });
  seen = new Set();
  for (let s = 0; s < 5; s++) {
    const ks = tslots.map((t, k) => k).filter((k) => tslots[k].s === s).sort((a, b) => tslots[a].m - tslots[b].m);
    for (let q = 1; q < ks.length; q++) addEdge(E.thread, seen, tNode[ks[q - 1]], tNode[ks[q]]);
  }
  for (let kn = 1; kn <= TIMELINE.knots.length; kn++) knn(F[3], Array.from(tNode.filter((i, k) => tslots[k].kn === kn)), 2, E.thread, seen, 0.6);
  const ringK = tslots.map((t, k) => k).filter((k) => tslots[k].s === -2);
  ringK.forEach((k, q) => addEdge(E.thread, seen, tNode[k], tNode[ringK[(q + 1) % ringK.length]]));

  yield;
  // Formacje 5 i 6 są bryłami, jak koło, dokument i oś: węzły na cienkich torach w różnych
  // płaszczyznach, krawędzie tylko między sąsiadami.
  const TAU = Math.PI * 2, deg = Math.PI / 180;
  const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm3 = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const basis = (n) => { const u = norm3(cross3(Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], n)); return [u, cross3(n, u)]; };
  // punkt na torusie o środku c, normalnej n, promieniu R, kącie a i grubości rho (jak koło F1)
  const onRing = (c, n, R, a, rho) => { const [u, v] = basis(n), ph = r() * TAU, t = rho * Math.sqrt(r()), rr = R + t * Math.cos(ph);
    return add3(c, add3(add3(mul3(u, rr * Math.cos(a)), mul3(v, rr * Math.sin(a))), mul3(n, t * Math.sin(ph)))); };
  const rotAxis = (p, k, t) => { const c = Math.cos(t), s1 = Math.sin(t), d = p[0] * k[0] + p[1] * k[1] + p[2] * k[2], x = cross3(k, p);
    return [p[0] * c + x[0] * s1 + k[0] * d * (1 - c), p[1] * c + x[1] * s1 + k[1] * d * (1 - c), p[2] * c + x[2] * s1 + k[2] * d * (1 - c)]; };
  const bez3 = (a, c, b, t) => { const u = 1 - t; return add3(add3(mul3(a, u * u), mul3(c, 2 * u * t)), mul3(b, t * t)); };
  const rotF1 = (p) => { const [x, y, z] = p, y1 = y * cx - z * sx, z1 = y * sx + z * cx; return [x * cy + z1 * sy, y1, -x * sy + z1 * cy]; };
  // Szkic formacji: sloty { p, key (kolejność przydziału), grp, hub }, łańcuchy krawędzi { ids, closed, skip }
  const sketch = () => ({ S: [], chains: [], stars: [] });
  const chainOf = (K, ids, closed, skip = 0, every = 3) => K.chains.push({ ids, closed, skip, every });
  const edgesOf = (K, out, nodeOf) => {
    const sn = new Set();
    for (const { ids, closed, skip, every } of K.chains) {
      const n = ids.length;
      for (let q = 0; q < n; q++) {
        if (q + 1 < n || closed) addEdge(out, sn, nodeOf[ids[q]], nodeOf[ids[(q + 1) % n]]);
        if (skip && q % every === 0 && (q + skip < n || closed)) addEdge(out, sn, nodeOf[ids[q]], nodeOf[ids[(q + skip) % n]]);
      }
    }
    for (const [hub, ids] of K.stars) for (const q of ids) addEdge(out, sn, nodeOf[hub], nodeOf[q]);
  };

  // F5 członkostwo (03): koło z „O kole” (torus R 6,4, obrót F1) widziane z góry pod 35° (szeroka, niska elipsa), jeden
  // tor z lekką grubością jak w F1 (krawędzie wzdłuż toru, nie w poprzek). Na łuku 222° wyrasta na krótkich szypułkach
  // pięć cienkich pierścieni-sekcji w nierównych odstępach, różnej wielkości (1 : 1,6) i przechylonych w różne strony
  // (mała oś 0,6–0,75 dużej); jeden siedzi za obręczą, jaśniejszy. Nic na szczycie ani pośrodku dołu, bez par (z bliska,
  // z daleka i po obrocie: bez głowy, stóp, łapy i dymka). Głębię niosą: pochylenie koła (bliższa dolna połowa), pąki na
  // różnych odległościach wzdłuż osi kamery, perspektywa powietrzna (net.js: FOG_K, tył jaśniejszy) i obrót ±7°.
  // Współpraca: czterech partnerów jako glify piasty (pierścień z kropką) na kropkowanej orbicie obejmującej formację,
  // nachylonej w głąb, dwa glify przed kołem, dwa za nim; pula ma też położenia na łukach mostów od pąków, z których
  // formacja 6 bierze przydział węzłów. Ta wersja F5 jest źródłem przydziału dla formacji 6; F5 na stronie buduje
  // blok „tunele” niżej. Przydział węzłów po kącie F1.
  const K5 = sketch();
  const add5 = (p, key, hub = false) => { K5.S.push({ p, key, hub }); return K5.S.length - 1; };
  const camD = norm3(PLANY_CAM), [cu, cv] = basis(camD);   // oś kamery kadru plany (rig), od punktu patrzenia
  const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  // koło F1 obrócone o 180° wokół osi kamery kadru: w obrazie ta sama elipsa (także pochylenie), ale bliższa jest dolna
  // połowa, dalsza górna, jak pierścień leżący, widziany z góry
  const rotF5 = (p) => { const q = rotF1(p), k = 2 * dot3(q, camD); return [k * camD[0] - q[0], k * camD[1] - q[1], k * camD[2] - q[2]]; };
  const fw5 = mul3(camD, -1), rt5 = norm3(cross3(fw5, [0, 1, 0])), up5 = cross3(rt5, fw5);   // poziom i pion obrazu kadru plany
  // pąki opisane kątem na elipsie koła w obrazie (współrzędne podzielone przez półosie, 0° = prawy koniec, 90° = góra):
  // łuk 222° od 160° (lewy koniec) przez prawy koniec do -62°, odstępy nierówne (42°, 63°, 50°, 67°), nic na szczycie ani
  // na dole pośrodku (także po obrocie obrazu o 180°), promienie w proporcji
  // 1 : 1,6. Pąk 0 (118°, dalsza połowa koła) siedzi ZA obręczą: środek tuż przy obręczy, cofnięty w głąb
  // (perspektywa powietrzna rozjaśnia go o ponad 40 %), pozostałe przed nią. Kąt na kole dobrany tak, żeby rzut leżał
  // pod tym kątem
  const ringP = Array.from({ length: 720 }, (_, q) => { const p = rotF5([Math.cos((q / 720) * TAU), Math.sin((q / 720) * TAU), 0]); return [dot3(p, rt5), dot3(p, up5)]; });
  const eW = Math.max(...ringP.map((p) => Math.abs(p[0]))), eH = Math.max(...ringP.map((p) => Math.abs(p[1])));
  const budS = [118, 160, 55, 5, -62], budA = budS.map((w) => { let best = 0, bd = 9;
    ringP.forEach(([x, y], q) => { const d = Math.abs(((Math.atan2(y / eH, x / eW) - w * deg + 3 * Math.PI) % TAU) - Math.PI); if (d < bd) { bd = d; best = (q / 720) * TAU; } });
    return best; });
  // budZ: wysunięcie wzdłuż osi kamery (+ ku widzowi), budK: odsunięcie od koła w promieniach pąka; budTh: przechylenie
  // pąka od osi kamery (każdy w inną stronę, budPh), tak że w rzucie mała oś ma ok. 0,6–0,75 dużej
  const budR = [1.0, 1.1, 1.6, 1.25, 1.4], budZ = [-2.4, 1.6, 2.4, 0.4, 1.2], budK = [0.45, 1.1, 1.1, 1.15, 1.1];
  const budTh = [42, 40, 42, 40, 43].map((a) => a * deg), budPh = [35, 205, 120, 300, 250].map((a) => a * deg);
  const nStalk = 4, nStar = 16, nBead = 40, partnerOf = [2, 1, 4, 0], nPool = nStar + nBead + 1;   // pula partnera: piasta i 56 koralików albo kropek orbity
  const budN = budR.map((rb) => Math.round(470 * rb / budR.reduce((a, b) => a + b, 0)));
  const n0 = N - budN.reduce((a, b) => a + b, 0) - 5 * (1 + nStalk + 1) - partnerOf.length * nPool;
  // koło: jeden tor, węzły w rurce o promieniu do 0,2 wokół osi toru; krawędzie tylko wzdłuż toru: łańcuchy co 11. węzeł
  // (odcinek ok. 0,6 wzdłuż wobec najwyżej 0,4 w poprzek); krawędzie ma co trzeci z jedenastu przeplecionych łańcuchów
  // (ok. 3 kreski w przekroju wstęgi zamiast 9: kreska nie nasyca się, więc perspektywa powietrzna czyta się na kole)
  const ringIds = [];
  for (let q = 0; q < n0; q++) {
    const a = (TAU * (q + r() * 0.5)) / n0, ph = r() * TAU, t = 0.2 * Math.sqrt(r());
    ringIds.push(add5(rotF5([(R + t * Math.cos(ph)) * Math.cos(a), (R + t * Math.cos(ph)) * Math.sin(a), t * Math.sin(ph)]), a));
  }
  const STRIDE = 11;
  for (let s0 = 0; s0 < STRIDE; s0 += 3) chainOf(K5, ringIds.filter((_, q) => q % STRIDE === s0), true, 0);
  const budHub = [], budRim = [], budOut = [], budRing = [];
  const ringSlotAt = (A) => { let b = ringIds[0], bd = 9; for (const k of ringIds) { const d = Math.abs(((K5.S[k].key - A + 3 * Math.PI) % TAU) - Math.PI); if (d < bd) { bd = d; b = k; } } return b; };
  budA.forEach((A, k) => {
    const rad = [Math.cos(A), Math.sin(A), 0], rb = budR[k], base = rotF5(mul3(rad, R)), rad3 = rotF5(rad);
    // „na zewnątrz” w płaszczyźnie obrazu (promień koła bez składowej wzdłuż osi kamery): pąk leży poza kołem także
    // w rzucie, a przesunięcie wzdłuż osi kamery (budZ) daje mu własną odległość od widza
    const outS = norm3(add3(rad3, mul3(camD, -dot3(rad3, camD))));
    const c = add3(add3(base, mul3(outS, budK[k] * rb)), mul3(camD, budZ[k]));
    const n = norm3(add3(mul3(camD, Math.cos(budTh[k])), mul3(add3(mul3(cu, Math.cos(budPh[k])), mul3(cv, Math.sin(budPh[k]))), Math.sin(budTh[k]))));
    const [bu, bv] = basis(n), twin = [[], []], ids = [];
    for (let q = 0; q < budN[k]; q++) { const a = (TAU * (q + r() * 0.5)) / budN[k], rr = rb + (q % 2 ? 0.09 : -0.09);
      const id = add5(add3(c, add3(add3(mul3(bu, rr * Math.cos(a)), mul3(bv, rr * Math.sin(a))), mul3(n, gauss(r) * 0.03))), A + (q / budN[k] - 0.5) * 0.08); ids.push(id); twin[q % 2].push(id); }
    budRing.push(ids);
    twin.forEach((t2) => chainOf(K5, t2, true, 0));
    // obręcz: punkt od strony koła (szypułka) i naprzeciw niego (piasta, od niej most)
    const oB = norm3(add3(outS, mul3(n, -dot3(outS, n)))), near = add3(c, mul3(oB, -rb)), far = add3(c, mul3(oB, rb));
    const stalk = [ringSlotAt(A)];
    for (let q = 1; q <= nStalk; q++) { const t = q / (nStalk + 1); stalk.push(add5(add3(add3(mul3(base, 1 - t), mul3(near, t)), [gauss(r) * 0.04, gauss(r) * 0.04, gauss(r) * 0.04]), A)); }
    stalk.push(add5(near, A)); chainOf(K5, stalk, false, 0);
    budRim.push(far); budOut.push(outS); budHub.push(add5(far, A, true));
  });
  // mosty rozchodzą się w różne strony obrazu (kąt w obrazie, 0° w prawo), różnej długości, z końcem przesuniętym w głąb
  // o sideZ (partner pąka za obręczą leży tuż przy nim, jeszcze głębiej): bez pary równoległych „czułków”
  const sideZ = [0.4, 0.3, 0.5, -0.8], bridgeS = [95, 125, -110, 60].map((a) => a * deg), bridgeL = [2.4, 1.5, 2.2, 1.2];
  // Pula partnerów: te same sloty (klucze, piasty, liczba) na mostach i na orbicie, a liczby losowe puli losowane z góry,
  // więc przydział węzłów koła, pąków i szypułek oraz dalszy ciąg losowania (formacja 6) nie zależą od położeń puli.
  const pr = Array.from({ length: partnerOf.length * nPool * 3 }, () => gauss(r)), jit = (m, q, k) => pr[(m * nPool + q) * 3 + k];
  // Partner to glif piasty z rodziny (pierścień z kropką, jak piasty koła), bez promieni. Mosty: od piasty pąka
  // pod kątem bridgeS w obrazie, na długość bridgeL i sideZ w głąb; spokojny łuk w jedną stronę (punkt kontrolny 0,18
  // długości w bok i 0,2 ku widzowi), piasta na końcu; 56 koralików na łuku (40 + 16 z puli, na orbicie te same sloty są kropkami)
  const nArc = nBead + nStar, arcAt = (far, ctl, end, q) => bez3(far, ctl, end, 0.1 + (0.9 * (q + 1)) / (nArc + 1));   // koraliki od 0,1 łuku: bez zagęszczenia na obręczy pąka
  const mosty = partnerOf.map((k, m) => {
    const far = budRim[k], out = norm3(add3(mul3(rt5, Math.cos(bridgeS[m])), mul3(up5, Math.sin(bridgeS[m]))));
    const L = bridgeL[m], end = add3(add3(far, mul3(out, L)), mul3(camD, sideZ[m]));
    const ctl = add3(add3(mul3(add3(far, end), 0.5), mul3(norm3(cross3(out, fw5)), 0.18 * L)), mul3(camD, 0.2 * L));   // jedno łagodne wygięcie, bez przegięć
    return { hub: end, beads: Array.from({ length: nBead }, (_, q) => arcAt(far, ctl, end, q)), star: Array.from({ length: nStar }, (_, q) => arcAt(far, ctl, end, nBead + q)) };
  });
  // orbity: jedna kropkowana elipsa obejmująca całą formację. W obrazie: półosie 1,1 półszerokości i 1,6 półwysokości
  // rdzenia (koło i obręcze pąków), pochylona o 5°, środek przesunięty w prawo o 0,05 półszerokości (lewy brzeg orbity
  // tuż za lewym końcem koła, prawy może wyjść za okno w granicy spadu), w górę o 0,25 półwysokości (dolna, bliższa połowa
  // wychodzi w perspektywie dłuższa; tak orbita stoi w obrazie wokół rdzenia, a nie pod nim). W głąb: górna połowa odchylona od widza o 22°
  // (dalsza, jaśniejsza), dolna ku widzowi. 224 kropki bez krawędzi (po 56 na partnera) i cztery glify piasty: dwa w dolnej
  // połowie przed kołem, dwa w górnej za nim, w nierównych miejscach orbity.
  const coreP = [...ringIds, ...budRing.flat()].map((k) => K5.S[k].p), pX = coreP.map((p) => dot3(p, rt5)), pY = coreP.map((p) => dot3(p, up5)), pZ = coreP.map((p) => dot3(p, camD));
  const hw = (Math.max(...pX) - Math.min(...pX)) / 2, hh = (Math.max(...pY) - Math.min(...pY)) / 2;
  const O = add3(add3(mul3(rt5, (Math.max(...pX) + Math.min(...pX)) / 2 + 0.05 * hw), mul3(up5, (Math.max(...pY) + Math.min(...pY)) / 2 + 0.25 * hh)), mul3(camD, pZ.reduce((x, y) => x + y, 0) / pZ.length));
  const tilt = -5 * deg, beta = 22 * deg, E2 = add3(mul3(rt5, Math.cos(tilt)), mul3(up5, Math.sin(tilt))), E1 = add3(mul3(rt5, -Math.sin(tilt)), mul3(up5, Math.cos(tilt)));
  const oB = 1.1 * hw, oA = (1.6 * hh) / Math.cos(beta), oV = norm3(add3(mul3(E1, Math.cos(beta)), mul3(camD, -Math.sin(beta))));
  const orbAt = (t) => add3(O, add3(mul3(E2, oB * Math.cos(t)), mul3(oV, oA * Math.sin(t))));
  const clusT = [-60, -150, 30, 125].map((a) => a * deg);   // dolna połowa (przed kołem), górna (za nim), bez par na tej samej wysokości
  const nDot = partnerOf.length * nArc, dotAt = (m, q) => orbAt((TAU * (m * nArc + q + 0.5)) / nDot);
  const orbity = partnerOf.map((k, m) => ({ hub: orbAt(clusT[m]), beads: Array.from({ length: nBead }, (_, q) => dotAt(m, q)), star: Array.from({ length: nStar }, (_, q) => dotAt(m, nBead + q)) }));
  const poolX = [];   // [slot, x łuku mostu]: formacja 6 przydziela węzły puli po x mostów, nie po położeniach na orbicie
  partnerOf.forEach((k, m) => {
    const V = orbity[m], M = mosty[m], key = budA[k] + 0.03;
    const beads = V.beads.map((p, q) => add5(p, key + 0.0005 * q)), hub = add5(V.hub, key, true), star = V.star.map((p, q) => add5(p, key + 0.0005 * (nBead + q)));
    beads.forEach((sl, q) => poolX.push([sl, M.beads[q][0]])); poolX.push([hub, M.hub[0]]); star.forEach((sl, q) => poolX.push([sl, M.star[q][0]]));
  });
  const hubSl5 = K5.S.map((sl, k) => (sl.hub ? k : -1)).filter((k) => k >= 0);
  const node5 = new Int32Array(K5.S.length).fill(-1), isHub = new Uint8Array(N);
  hubSl5.forEach((k, q) => { node5[k] = hubs[q]; isHub[hubs[q]] = 1; });
  const angNodes = byAngle.filter((i) => !isHub[i]);
  const keyOf = (v) => ((v % TAU) + TAU) % TAU;
  K5.S.map((sl, k) => k).filter((k) => !K5.S[k].hub).sort((a, b) => keyOf(K5.S[a].key) - keyOf(K5.S[b].key) || a - b).forEach((k, q) => { node5[k] = angNodes[q]; });
  K5.S.forEach((sl, k) => set(F[5], node5[k], sl.p[0], sl.p[1], sl.p[2]));
  edgesOf(K5, E.czl, node5);
  const inRing5 = new Uint8Array(N); ringIds.forEach((k) => { inRing5[node5[k]] = 1; });

  yield;
  // F6 zarząd i opieka naukowa (04), sfera armilarna: równik, dwa południki różnej średnicy i zwrotnik wokół wyraźnej
  // osi z biegunami; w środku mniejszy pierścień członków, przy osi konstelacja trzech jasnych węzłów zarządu (opieka
  // obejmuje, oś prowadzi). Grupa A (pierścienie sfery) dostaje węzły koła z F5, grupa B (pierścień członków,
  // konstelacja, oś) węzły pąków i mostów; w każdej grupie przydział po x (ciągłe przejście 03 -> 04 -> oś czasu 05).
  const K6 = sketch();
  const add6 = (p, grp, hub = false) => { K6.S.push({ p, grp, hub }); return K6.S.length - 1; };
  const nA = n0;
  const hubs6 = [];
  const Bparts = [];   // funkcje budujące grupę B, dostają liczbę węzłów do rozdania
  let triC = [], membersC = null, membersN = null, membersR = 0, extraRing = null;
  {
    const ax = norm3([0.3, 1, 0.14]), [u0, v0] = basis(ax);
    const m1 = norm3(cross3(ax, [0.2, 0, 1])), m2 = rotAxis(m1, ax, 68 * deg);
    const rings = [[[0, 0, 0], ax, 6.2, 1.0], [[0, 0, 0], m1, 6.2, 1.0], [[0, 0, 0], m2, 5.5, 0.9]];   // równik, dwa południki różnej średnicy
    const circ = rings.map((g) => g[2] * g[3]), tot = circ.reduce((x, y) => x + y, 0), per = circ.map((c) => Math.floor((nA * c) / tot));
    per[0] += nA - per.reduce((x, y) => x + y, 0);
    rings.forEach(([c, n, Rr], g) => { const ids = []; for (let q = 0; q < per[g]; q++) ids.push(add6(onRing(c, n, Rr, (TAU * (q + r() * 0.6)) / per[g], 0.45), 'A')); chainOf(K6, ids, true, 6); });
    // piasty: bieguny osi i cztery punkty równika (przecięcia z południkami)
    const poleN = mul3(ax, 8.4), poleS = mul3(ax, -8.4);
    hubs6.push(add6(poleN, 'H', true), add6(poleS, 'H', true));
    for (const d of [norm3(cross3(ax, m1)), mul3(norm3(cross3(ax, m1)), -1), norm3(cross3(ax, m2)), mul3(norm3(cross3(ax, m2)), -1)]) hubs6.push(add6(mul3(d, 6.2), 'H', true));
    membersC = mul3(ax, -1.2); membersN = ax; membersR = 2.7; extraRing = [mul3(ax, 3.4), ax, 5.0];   // zwrotnik
    triC = [90, 210, 330].map((d) => add3(mul3(ax, 1.0), add3(mul3(u0, 1.05 * Math.cos(d * deg)), mul3(v0, 1.05 * Math.sin(d * deg)))));
    Bparts.push((n) => { const ids = [hubs6[1]]; for (let q = 0; q < n; q++) { const t = (q + 0.5) / n; ids.push(add6(add3(mul3(ax, -8.0 + 16 * t), [gauss(r) * 0.03, gauss(r) * 0.03, gauss(r) * 0.03]), 'B')); } ids.push(hubs6[0]); chainOf(K6, ids, false); });   // oś od bieguna do bieguna
  }
  const triHub = triC.map((p) => add6(p, 'H', true));
  const nClus = 16, nSide = 7, nAxis = 70;
  const nB = N - K6.S.length - 3 * nClus - 3 * nSide - nAxis, nExtra = Math.round(nB * 0.42), nMem = nB - nExtra;
  { const ids = []; for (let q = 0; q < nMem; q++) ids.push(add6(onRing(membersC, membersN, membersR, (TAU * (q + r() * 0.6)) / nMem, 0.38), 'B')); chainOf(K6, ids, true, 6); }
  { const [c, n, Rr] = extraRing, ids = []; for (let q = 0; q < nExtra; q++) ids.push(add6(onRing(c, n, Rr, (TAU * (q + r() * 0.6)) / nExtra, 0.4), 'B')); chainOf(K6, ids, true, 6); }
  triC.forEach((c, k) => { const ids = []; for (let q = 0; q < nClus; q++) ids.push(add6(add3(c, [gauss(r) * 0.3, gauss(r) * 0.3, gauss(r) * 0.3]), 'B')); K6.stars.push([triHub[k], ids.filter((_, q) => q % 2 === 0)]); });
  [[0, 1], [1, 2], [2, 0]].forEach(([a, b]) => { const ids = [triHub[a]]; for (let q = 1; q <= nSide; q++) ids.push(add6(add3(mul3(triC[a], 1 - q / (nSide + 1)), mul3(triC[b], q / (nSide + 1))), 'B')); ids.push(triHub[b]); chainOf(K6, ids, false); });
  Bparts.forEach((fn) => fn(nAxis));
  const node6 = new Int32Array(K6.S.length).fill(-1);
  K6.S.map((sl, k) => (sl.hub ? k : -1)).filter((k) => k >= 0).forEach((k, q) => { node6[k] = hubs[q]; });
  const x5s = new Float32Array(N); for (let i = 0; i < N; i++) x5s[i] = F[5][i * 3];
  for (const [sl, x] of poolX) x5s[node5[sl]] = x;
  const x5 = (i) => x5s[i];
  const nodesA = Array.from({ length: N }, (_, i) => i).filter((i) => !isHub[i] && inRing5[i]).sort((a, b) => x5(a) - x5(b) || a - b);
  const nodesB = Array.from({ length: N }, (_, i) => i).filter((i) => !isHub[i] && !inRing5[i]).sort((a, b) => x5(a) - x5(b) || a - b);
  const slotsBy = (g) => K6.S.map((sl, k) => k).filter((k) => K6.S[k].grp === g).sort((a, b) => K6.S[a].p[0] - K6.S[b].p[0] || a - b);
  slotsBy('A').forEach((k, q) => { node6[k] = nodesA[q]; });
  slotsBy('B').forEach((k, q) => { node6[k] = nodesB[q]; });
  K6.S.forEach((sl, k) => set(F[6], node6[k], sl.p[0], sl.p[1], sl.p[2]));
  edgesOf(K6, E.skl, node6);
  const rings6 = Int32Array.from(K6.S.map((sl, k) => (sl.grp === 'A' ? node6[k] : -1)).filter((i) => i >= 0));   // pierścienie sfery (grupa A)
  // F5 członkostwo (03), wersja „tunele”: koło, pąki i orbita to torusy z widoczną
  // objętością, rysowane językiem sfery: sieć widocznych kropek rozrzuconych przy powierzchni rury i cienkich, słabszych
  // krawędzi. Przekrój rury sugerują luźne obręcze po kilka węzłów (krawędzie wokół rury i wzdłuż niej, ok. 35 % z nich
  // usunięte losowo) i mgła (tył rury jaśniejszy). Układ: koło z góry pod 35°, pięć przechylonych pąków na
  // łuku 222°, jeden za obręczą; partnerzy jako glify piasty na orbicie obejmującej rdzeń. Budowana PO formacji 6:
  // pierwsza wersja F5 zostaje wyżej tylko jako źródło przydziału i liczby węzłów sfery (sfera ma zostać bez zmian),
  // a tutaj nadpisuje F[5] i krawędzie E.czl. Własne ziarno.
  // przechylenia pąków-rur: pąk 1 (lewy koniec koła) mniej przechylony, żeby przy -7° nie stał bokiem
  const budThQ = [34, 12, 35, 34, 34].map((a) => a * deg), budPhQ = [35, 170, 120, 300, 250].map((a) => a * deg);
  let X5;
  {
    const rq = rng(5005), gq = () => gauss(rq), K = sketch();
    const addQ = (p, key, hub = false) => { K.S.push({ p, key, hub }); return K.S.length - 1; };
    const nHubB = 5, nStalkQ = 5, nPoolQ = 109, nBudQ = 300, partnerQ = [2, 1, 4, 0];
    const nRingQ = N - nHubB - partnerQ.length - 5 * nStalkQ - nBudQ - partnerQ.length * nPoolQ;
    const RHO = 0.63, RHO_O = 0.31, RHO_M = 0.18;   // grubość rur koła, orbity i mostów
    // Rura z luźnych obręczy: n węzłów w obręczach po H, obręcze co krok wzdłuż drogi path(t) -> { c, e1, e2 } (środek
    // i dwa kierunki prostopadłe); położenia rozrzucone o ok. 30 % odstępu wokół i wzdłuż, promień 0,85–1,15 grubości;
    // krawędzie wokół obręczy i wzdłuż rury (ten sam węzeł następnej obręczy), usunięte losowo: wokół 25 %, wzdłuż 45 %.
    const tube = (n, closed, path, rho, H) => {
      const hoops = Math.max(2, Math.round(n / H)), per = Array.from({ length: hoops }, (_, j) => H + (j < n - hoops * H ? 1 : 0));
      for (let left = n - per.reduce((a, b) => a + b, 0); left < 0; left++) per[per.length - 1 + left] -= 1;
      const pts = [], idx = [], edges = [];
      per.forEach((h, j) => {
        const row = [], tw = (j * Math.PI) / h;
        for (let i = 0; i < h; i++) {
          const t = closed ? (j + (rq() - 0.5) * 0.6) / hoops : (j + 0.5 + (rq() - 0.5) * 0.6) / hoops;
          const { c, e1, e2 } = path(t), ph = (TAU * (i + (rq() - 0.5) * 0.6)) / h + tw, rr = rho * (0.85 + 0.3 * rq());
          row.push(pts.length); pts.push(add3(c, add3(mul3(e1, rr * Math.cos(ph)), mul3(e2, rr * Math.sin(ph)))));
        }
        idx.push(row);
      });
      idx.forEach((row, j) => {
        row.forEach((a, i) => { if (rq() > 0.25) edges.push([a, row[(i + 1) % row.length]]); });
        const nx = idx[j + 1] || (closed ? idx[0] : null);
        if (nx) row.forEach((a, i) => { if (i < nx.length && rq() > 0.45) edges.push([a, nx[i]]); });
      });
      return { pts, edges };
    };
    const place = (T, key) => { const ids = T.pts.map((p, q) => addQ(p, key(q))); T.edges.forEach(([a, b]) => chainOf(K, [ids[a], ids[b]], false, 0)); return ids; };
    const ringPath = (t) => { const a = TAU * t; return { c: rotF5([R * Math.cos(a), R * Math.sin(a), 0]), e1: rotF5([Math.cos(a), Math.sin(a), 0]), e2: rotF5([0, 0, 1]) }; };
    const ringT = tube(nRingQ, true, ringPath, RHO, 7);
    const ringIds = place(ringT, (q) => { const p = ringT.pts[q]; return Math.atan2(dot3(p, rotF5([0, 1, 0])), dot3(p, rotF5([1, 0, 0]))); });
    const ringSlotAt = (A) => { let b = ringIds[0], bd = 9; for (const k of ringIds) { const d = Math.abs(((K.S[k].key - A + 3 * Math.PI) % TAU) - Math.PI); if (d < bd) { bd = d; b = k; } } return b; };
    const budNq = budR.map((rb) => Math.round((nBudQ * rb) / budR.reduce((a, b) => a + b, 0)));
    budNq[budNq.length - 1] += nBudQ - budNq.reduce((a, b) => a + b, 0);
    const bHub = [], bRim = [], bRing = [], bList = [];
    budA.forEach((A, k) => {
      const rad = [Math.cos(A), Math.sin(A), 0], rb = budR[k], base = rotF5(mul3(rad, R + RHO)), rad3 = rotF5(rad);
      const outS = norm3(add3(rad3, mul3(camD, -dot3(rad3, camD))));
      const c = add3(add3(base, mul3(outS, budK[k] * rb + 0.2)), mul3(camD, budZ[k]));
      const n = norm3(add3(mul3(camD, Math.cos(budThQ[k])), mul3(add3(mul3(cu, Math.cos(budPhQ[k])), mul3(cv, Math.sin(budPhQ[k]))), Math.sin(budThQ[k]))));
      bList.push({ c, n, rb });
      const [bu, bv] = basis(n), rho = 0.9 * (0.18 + 0.08 * (rb - 1));
      const path = (t) => { const a = TAU * t, e1 = add3(mul3(bu, Math.cos(a)), mul3(bv, Math.sin(a))); return { c: add3(c, mul3(e1, rb)), e1, e2: n }; };
      const ids = place(tube(budNq[k], true, path, rho, 5), (q) => A + (q / budNq[k] - 0.5) * 0.08);
      bRing.push(ids);
      const oB = norm3(add3(outS, mul3(n, -dot3(outS, n)))), near = add3(c, mul3(oB, -rb)), far = add3(c, mul3(oB, rb));
      const stalk = [ringSlotAt(A)];
      for (let q = 1; q <= nStalkQ; q++) { const t = q / (nStalkQ + 1); stalk.push(addQ(add3(add3(mul3(base, 1 - t), mul3(near, t)), [gq() * 0.05, gq() * 0.05, gq() * 0.05]), A)); }
      chainOf(K, stalk, false, 0);
      bRim.push(far); bHub.push(addQ(far, A, true));
    });
    // orbita obejmująca rdzeń (koło z pąkami): elipsa w obrazie 1,12 półszerokości i 1,55 półwysokości rdzenia, pochylona
    // w głąb o 22° (górna połowa dalej), jako rura o grubości RHO_O; mosty: rury od piasty pąka do partnera (tylko koperta kadru, niżej)
    const coreP = [...ringIds, ...bRing.flat()].map((k) => K.S[k].p), pX = coreP.map((p) => dot3(p, rt5)), pY = coreP.map((p) => dot3(p, up5)), pZ = coreP.map((p) => dot3(p, camD));
    const hw = (Math.max(...pX) - Math.min(...pX)) / 2, hh = (Math.max(...pY) - Math.min(...pY)) / 2;
    const O = add3(add3(mul3(rt5, (Math.max(...pX) + Math.min(...pX)) / 2 + 0.05 * hw), mul3(up5, (Math.max(...pY) + Math.min(...pY)) / 2 + 0.22 * hh)), mul3(camD, pZ.reduce((x, y) => x + y, 0) / pZ.length));
    const tilt = -5 * deg, beta = 22 * deg, E2 = add3(mul3(rt5, Math.cos(tilt)), mul3(up5, Math.sin(tilt))), E1 = add3(mul3(rt5, -Math.sin(tilt)), mul3(up5, Math.cos(tilt)));
    const oBx = 1.12 * hw, oAy = (1.55 * hh) / Math.cos(beta), oV = norm3(add3(mul3(E1, Math.cos(beta)), mul3(camD, -Math.sin(beta)))), oN = norm3(cross3(E2, oV));
    const orbC = (t) => add3(O, add3(mul3(E2, oBx * Math.cos(t)), mul3(oV, oAy * Math.sin(t))));
    const orbPath = (t) => { const tt = TAU * t, tg = norm3(add3(mul3(E2, -oBx * Math.sin(tt)), mul3(oV, oAy * Math.cos(tt)))); return { c: orbC(tt), e1: norm3(cross3(tg, oN)), e2: oN }; };
    const clusQ = [-60, -150, 30, 125].map((a) => a * deg);
    const orbT = tube(partnerQ.length * nPoolQ, true, orbPath, RHO_O, 5);
    // Mosty nie dostają węzłów na stronie. Ich punkty (env5) są dodatkową kopertą kadru 03 (main.js: band.extra) i
    // wyznaczają skalę i położenie kamery; bez nich kamera 03 stanęłaby inaczej, więc budowa zostaje.
    const sideQ = [0.4, 0.3, 0.5, -0.8], brS = [95, 125, -110, 60].map((a) => a * deg), brL = [2.4, 1.5, 2.2, 1.2];
    const mosT = partnerQ.map((k, m) => {
      const far = bRim[k], out = norm3(add3(mul3(rt5, Math.cos(brS[m])), mul3(up5, Math.sin(brS[m])))), L = brL[m];
      const end = add3(add3(far, mul3(out, L)), mul3(camD, sideQ[m])), side = norm3(cross3(out, fw5));
      const ctl = add3(add3(mul3(add3(far, end), 0.5), mul3(side, 0.18 * L)), mul3(camD, 0.2 * L));
      const T = tube(nPoolQ, false, (t) => ({ c: bez3(far, ctl, end, 0.1 + 0.9 * t), e1: side, e2: camD }), RHO_M, 4);
      return { hub: end, T };
    });
    const poolSl = [];
    const keyP = (m, q) => budA[partnerQ[m]] + 0.03 + 0.0003 * q;
    {
      const ids = orbT.pts.map((p, j) => addQ(p, keyP(Math.floor(j / nPoolQ), j % nPoolQ)));
      orbT.edges.forEach(([a, b]) => chainOf(K, [ids[a], ids[b]], false, 0));
      partnerQ.forEach((k, m) => { poolSl.push(...ids.slice(m * nPoolQ, (m + 1) * nPoolQ)); addQ(orbC(clusQ[m]), keyP(m, 0), true); });
    }
    const env = Float32Array.from(mosT.flatMap(({ hub, T }) => [hub, ...T.pts]).flat());
    // przydział węzłów: piasty (9) na stałych węzłach, reszta po kącie F1
    const hubSl = K.S.map((sl, k) => (sl.hub ? k : -1)).filter((k) => k >= 0), nodeQ = new Int32Array(K.S.length).fill(-1), isH = new Uint8Array(N);
    hubSl.forEach((k, q) => { nodeQ[k] = hubs[q]; isH[hubs[q]] = 1; });
    const angQ = byAngle.filter((i) => !isH[i]), keyQ = (v) => ((v % TAU) + TAU) % TAU;
    K.S.map((sl, k) => k).filter((k) => !K.S[k].hub).sort((a, b) => keyQ(K.S[a].key) - keyQ(K.S[b].key) || a - b).forEach((k, q) => { nodeQ[k] = angQ[q]; });
    if (K.S.length !== N || nodeQ.some((i) => i < 0)) throw new Error('F5: liczba slotów różna od N');
    K.S.forEach((sl, k) => set(F[5], nodeQ[k], sl.p[0], sl.p[1], sl.p[2]));
    E.czl.length = 0; edgesOf(K, E.czl, nodeQ);
    X5 = { buds: bList, buds5: bRing.map((ids) => Int32Array.from(ids.map((k) => nodeQ[k]))), budsBack: [0],
      core5: Int32Array.from([...ringIds, ...bRing.flat()].map((k) => nodeQ[k])), ring5: Int32Array.from(ringIds.map((k) => nodeQ[k])),
      env5: env, beads5: Int32Array.from(poolSl.map((k) => nodeQ[k])) };
  }
  // fala przejścia: ranga x węzła w każdej formacji (0..1), wspólna miara dla przejść 02-03-04-05 (net.js)
  const wave = F.map((Fa) => { const w = new Float32Array(N); orderBy(Fa, 0).forEach((i, q) => { w[i] = q / (N - 1); }); return w; });

  return { F, seed, size, par, knot, hubs, wave, ...X5, rings6, E: { net: new Uint16Array(E.net), ring: new Uint16Array(E.ring), doc: new Uint16Array(E.doc), thread: new Uint16Array(E.thread), czl: new Uint16Array(E.czl), skl: new Uint16Array(E.skl) } };
}

// Kamera dla kotwic w treści (atrybut data-cam): f = formacja, par = podświetlony paragraf
// uchwały (10 tytuł, 11 § 9 ust. 3), kn = podświetlony węzeł osi.
export function rig(items = timelineItems()) {
  const timeline = timelineModel(items);
  const v = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const P = (k) => pageCenter(k);
  const K = (k) => curve(timeline.knots[k]);
  const RC = curve(timeline.ring);
  const kn = (k) => ({ f: 3, pos: v(K(k), [-7, 2.2, 12]), look: K(k), kn: k + 1 });
  return {
    hero: { f: 0, pos: [4, 2.6, 31], look: [0, 0, 0] },
    kolo: { f: 1, pos: [0.8, 1.8, 29], look: [0, 0.2, 0] },
    u0: { f: 2, pos: [-17, 6.5, 44], look: [1, -0.4, 0] },
    u9: { f: 2, pos: v(P(8), [-5.5, 0.4, 19]), look: v(P(8), [-0.6, -1.4, 0]), par: 11 },
    ua: { f: 2, pos: [19, 7, 43], look: [0, -0.4, 0] },
    h0: { f: 3, pos: [-36, 6.5, 19], look: [-4, -0.5, 0] },
    ...Object.fromEntries(items.filter((it) => it.key).map((it, k) => [it.key, kn(k)])),
    hr: { f: 3, pos: v(RC, [-8, 3, 14]), look: RC, kn: timeline.ringId },
    sig: { f: 3, pos: [30, 5, 22], look: [4, -0.5, 0] },
    // bryły 03 i 04 z ukosa, żeby było widać głębię; 03: blisko osi koła F1 (koło czyta się jako koło), odchylone o ok. 40° w prawo i w dół
    plany: { f: 5, pos: [0.4 + 24.8 * PLANY_CAM[0], 24.8 * PLANY_CAM[1], 24.8 * PLANY_CAM[2]], look: [0.4, 0, 0] },
    z: { f: 6, pos: [10, 10.5, 19.5], look: [0, 0.4, 0] },
    end: { f: 4, pos: [1.5, 1.2, 13], look: [-1, -0.5, -10] },
  };
}

// Rzut okna na pulpicie: środek sceny w punkcie cx (piksele od lewej), tekst po lewej.
// k = oddalenie kamery, gdy pas na scenę jest węższy niż ok. 600 px.
export function frame(w, h, cx) {
  const c = cx || w * 0.68;
  const band = Math.max(1, w - (2 * c - w));
  return { fullW: 2 * c, fullH: h, offX: 0, offY: 0, dist: Math.min(1.6, Math.max(1, 620 / Math.max(band, 1))) };
}
