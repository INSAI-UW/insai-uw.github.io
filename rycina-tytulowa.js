// rycina-tytulowa.js – telefon i tablet (poniżej 1081 px): rycina tytułowa, znak osadzony w sieci.
// Pulpit tego pliku nie ładuje. Rycina rysuje geometrię pola (forms.js) funkcją rycin (plates.js),
// bez three.js. Najpierw rycina (wejście IN s, od razu po wczytaniu), potem znak się z niej odrywa (znak.js, D: grudki
// z 1–2 nićmi, krótki przelot); węzły ryciny odbijają się po zerwaniu nici (api.bounce). Potem spoczynek bez pętli.
// Znak jest wycięty z sieci z miękkim brzegiem: pod literami i w oku nie ma ani linii, ani ruchu.
// Wejście gra raz; bez ruchu (redukcja ruchu, zatrzymany ruch, rycina poza oknem) od razu stan końcowy.
import { N, build, buildAsync } from './forms.js';
import { render2D, project, VIS } from './plates.js';

const $ = (s, r = document) => r.querySelector(s);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const ease = (v) => 1 - Math.pow(1 - clamp01(v), 3);
const sstep = (a, b, v) => { const k = clamp01((v - a) / (b - a)); return k * k * (3 - 2 * k); };
const mqRM = matchMedia('(prefers-reduced-motion: reduce)');

function fit(fig, cv, dprMax) {
  const r = fig.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, dprMax);
  const W = Math.max(1, Math.round(r.width)), H = Math.max(1, Math.round(r.height));
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  return { ctx: cv.getContext('2d'), W, H, dpr, r };
}
// Wejście: węzły zbiegają się do punktu c, każdy z opóźnieniem z własnego ziarna (jak wejście sieci na pulpicie).
function gather(out, F, seed, c, k, spread = 1.5) {
  for (let i = 0; i < N; i++) {
    const s = 1 + spread * (1 - ease((k - seed[i] * 0.45) / 0.55));
    out[i * 3] = c[0] + (F[i * 3] - c[0]) * s;
    out[i * 3 + 1] = c[1] + (F[i * 3 + 1] - c[1]) * s;
    out[i * 3 + 2] = c[2] + (F[i * 3 + 2] - c[2]) * s;
  }
}
const edgesOf = (f, a) => Object.fromEntries(Object.keys(VIS).map((k) => [k, VIS[k][f] * a]));
// Stop poza widokiem i przy ukrytej karcie: ruch kończy się od razu stanem spoczynku.
function entry(el, dur, draw) {
  let raf = 0, t0 = 0, over = false;
  const finish = () => { if (over) return; over = true; cancelAnimationFrame(raf); io.disconnect(); document.removeEventListener('visibilitychange', vis); draw(1); };
  const vis = () => { if (document.hidden) finish(); };
  const io = new IntersectionObserver(([e]) => { if (!e.isIntersecting) finish(); });
  const tick = (now) => { if (!t0) t0 = now; const k = (now - t0) / dur; if (k >= 1) return finish(); draw(k); raf = requestAnimationFrame(tick); };
  io.observe(el); document.addEventListener('visibilitychange', vis);
  draw(0); raf = requestAnimationFrame(tick);
  return finish;
}
const inView = (el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.width > 0; };

const CAM = [-2, 0.4, 16];   // kamera względem oka: lekko z lewej i z góry, pole widoczne w prawo
export const IN = 1.1;   // wejście ryciny (s)
// o: { moving (czy ruch dozwolony), dev (tryb klatek: chwila t w s albo null) }
// Zwraca { stop (kończy wejście od razu), api } albo nic. api ma kształt netApi z main.js (znak.js, D): węzły ryciny
// w px okna, sąsiedzi w sieci, wolne miejsca poza znakiem, odbicia węzłów, t0 (początek wejścia, performance.now()).
export async function start(o) {
  const fig = $('.plate-hero'), cv = fig && fig.querySelector('canvas'), stage = $('[data-ink]');
  if (!cv || !stage) return;
  await buildAsync();
  const data = build(), F = data.F[0];
  // oko znaku = węzeł centralny skupiska z lewej strony pola i blisko jego środka w pionie:
  // reszta pola rozchodzi się od oka w prawo, nad znak i pod niego
  const hub = data.hubs.reduce((a, h) => (F[h * 3] + 1.6 * Math.abs(F[h * 3 + 1]) < F[a * 3] + 1.6 * Math.abs(F[a * 3 + 1]) ? h : a), data.hubs[0]);
  const look = [F[hub * 3], F[hub * 3 + 1], F[hub * 3 + 2]];
  const pos = [look[0] + CAM[0], look[1] + CAM[1], look[2] + CAM[2]];
  const P = new Float32Array(N * 3);
  const nsai = new Path2D(document.getElementById('znak-nsai').getAttribute('d'));
  let bump = null, kNow = 0, inEntry = false;
  const pr = {};   // ostatni rzut węzłów (sx, sy, a) dla api.at
  const draw = (k) => {
    kNow = k;
    const { ctx, W, H, dpr, r } = fit(fig, cv, 2);
    const s = stage.getBoundingClientRect(), u = s.width / 148;
    const ox = s.left - r.left - 58 * u, oy = s.top - r.top - 7 * u;
    if (k < 1) gather(P, F, data.seed, look, k, 1.4);
    render2D(ctx, W, H, dpr, { f: 0, P: k < 1 ? P : null, pos, look, cx: ox + 78 * u, cy: oy + 34 * u, fullH: H, alpha: 0.82 * clamp01(k * 1.6), edges: edgesOf(0, sstep(0.45, 1, k)), bump, out: pr });
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.setTransform(dpr * u, 0, 0, dpr * u, dpr * ox, dpr * oy);
    ctx.lineJoin = 'round';
    for (const [pad, a] of [[6, 0.25], [4, 0.4], [2.2, 0.7], [1.2, 1]]) {
      ctx.globalAlpha = a; ctx.lineWidth = pad * 2;
      ctx.beginPath(); ctx.rect(73, 17, 10, 34); ctx.moveTo(87.6, 34); ctx.arc(78, 34, 9.6, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke(); ctx.fill(nsai); ctx.stroke(nsai);
    }
    ctx.restore();
  };
  let NB = null;
  const api = {
    t0: 0, count: N, hubs: Array.from(data.hubs),
    nbrs(id) {
      if (!NB) { const E = data.E.net; NB = Array.from({ length: N }, () => []); for (let q = 0; q < E.length; q += 2) { NB[E[q]].push(E[q + 1]); NB[E[q + 1]].push(E[q]); } }
      return NB[id];
    },
    // bieżące położenia (w wejściu węzły jeszcze się zbiegają); ok = węzeł widoczny (mgła głębi, bez krycia wejścia)
    at(ids) {
      if (!pr.sx) return null;
      const r = fig.getBoundingClientRect();
      return ids.map((i) => [pr.sx[i] + r.left, pr.sy[i] + r.top, pr.a[i] > 0.35]);
    },
    // położenia spoczynkowe (po wejściu): wybór grudek i nici nie zależy od chwili startu znaku
    atRest(ids) {
      if (!pr.sx) return null;
      const r = fig.getBoundingClientRect(), s = stage.getBoundingClientRect(), u = s.width / 148;
      const q = project(r.width, r.height, { f: 0, pos, look, cx: s.left - r.left + 20 * u, cy: s.top - r.top + 27 * u, fullH: r.height });
      const vis = (z) => (z < 0.8 ? 0 : (1 - clamp01((z - q.near) / (q.far - q.near))) * Math.min(1, (z - 0.8) / 2.4) * 0.9);   // mgła jak w render2D
      return ids.map((i) => [q.sx[i] + r.left, q.sy[i] + r.top, vis(q.sz[i]) > 0.35]);
    },
    // poza wycięciem znaku (pudełko znaku z zapasem miękkiego brzegu)
    free(x, y) { const s = stage.getBoundingClientRect(), p = (6 * s.width) / 148; return !(x > s.left - p && x < s.right + p && y > s.top - p && y < s.bottom + p); },
    // odbicia węzłów po zerwaniu nici (Map id -> [dx, dy] px); poza wejściem rycina rysuje się od razu
    bounce(m) { if (!m.size && !bump) return; bump = m.size ? m : null; if (!inEntry) draw(kNow); },
    drawAt(t, m) { bump = m && m.size ? m : null; draw(Math.min(1, t / IN)); },   // tryb klatek
  };
  fig.classList.add('drawn');
  let rz = 0;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => draw(1), 150); });
  if (o.dev != null) { api.drawAt(o.dev, null); return { api }; }
  if (!o.moving() || mqRM.matches || !inView(fig) || document.hidden) { draw(1); return { api }; }
  api.t0 = performance.now();
  const stop = entry(fig, IN * 1000, (k) => { inEntry = k < 1; draw(k); });
  return { stop: () => { bump = null; stop(); draw(1); }, api };
}
