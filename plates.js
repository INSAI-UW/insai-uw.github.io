// plates.js – ryciny Canvas 2D z geometrii sieci (forms.js), bez WebGL i bez three.js.
// Telefon i tablet: każda rycina jest osobnym obrazem w treści, rysowanym RAZ, gdy wchodzi
// w widok (zero pętli). Pulpit bez WebGL: ta sama funkcja rysuje scenę za tekstem skokowo,
// przy zmianie kotwicy.
import { N, build, buildAsync, frame, TIMELINE, curve } from './forms.js';

const NAVY = '26,44,71', TEAL = '44,95,111';
export const VIS = { net: [1, 0, 0, 0, 1, 0, 0], ring: [0, 1, 0, 0, 0, 0, 0], doc: [0, 0, 1, 0, 0, 0, 0], thread: [0, 0, 0, 1, 0, 0, 0], czl: [0, 0, 0, 0, 0, 1, 0], skl: [0, 0, 0, 0, 0, 0, 1] };
const BASE = { net: 0.34, ring: 0.22, doc: 0.55, thread: 0.38, czl: 0.33, skl: 0.38 };
export const SIZE_K = [1, 0.9, 0.42, 0.6, 1, 0.58, 0.88];
const ALPHA_K = [1, 1, 1, 1, 1, 0.74, 0.74];   // jak w net.js

// Rzut perspektywiczny węzłów na płaszczyznę kanwy (px): { sx, sy, sz, f, near, far }.
export function project(W, H, st) {
  const data = build();
  const F = st.P || data.F[st.f];
  const k = st.dist || 1;
  const look = st.look;
  const pos = [look[0] + (st.pos[0] - look[0]) * k, look[1] + (st.pos[1] - look[1]) * k, look[2] + (st.pos[2] - look[2]) * k];
  let fx = look[0] - pos[0], fy = look[1] - pos[1], fz = look[2] - pos[2];
  const fl = Math.hypot(fx, fy, fz); fx /= fl; fy /= fl; fz /= fl;
  let rx = -fz, ry = 0, rz = fx; const rl = Math.hypot(rx, ry, rz); rx /= rl; ry /= rl; rz /= rl;
  const ux = ry * fz - rz * fy, uy = rz * fx - rx * fz, uz = rx * fy - ry * fx;
  const fullH = st.fullH || H;
  const f = fullH / 2 / Math.tan((36 * Math.PI) / 360);
  const cx = st.cx != null ? st.cx : W / 2, cy = st.cy != null ? st.cy : H / 2;
  const sx = new Float32Array(N), sy = new Float32Array(N), sz = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const dx = F[i * 3] - pos[0], dy = F[i * 3 + 1] - pos[1], dz = F[i * 3 + 2] - pos[2];
    const z = dx * fx + dy * fy + dz * fz;
    sz[i] = z;
    sx[i] = cx + ((dx * rx + dy * ry + dz * rz) / z) * f;
    sy[i] = cy - ((dx * ux + dy * uy + dz * uz) / z) * f;
  }
  const fogK = st.f === 5 ? [0.8, 1.55] : [0.6, 1.6];   // perspektywa powietrzna jak w net.js (FOG_K)
  return { sx, sy, sz, f, near: fl * k * fogK[0], far: fl * k * fogK[1] };
}

// st: { f, pos, look, par, kn, alpha, size, cx, cy, fullW, fullH, dist }
// Rycina tytułowa (rycina-tytulowa.js): P = położenia węzłów w klatce wejścia, edges = krycie zbiorów krawędzi,
// bump = przesunięcia węzłów w px (Map id -> [dx, dy]: odbicia po zerwaniu nici znaku), out = obiekt na rzut
// (sx, sy i widoczność a węzła bez krycia wejścia).
export function render2D(ctx, W, H, dpr, st) {
  const data = build();
  const { sx, sy, sz, f, near, far } = project(W, H, st);
  if (st.bump) for (const [i, v] of st.bump) { sx[i] += v[0]; sy[i] += v[1]; }
  const fog = (z) => (z < 0.8 ? 0 : (1 - Math.min(1, Math.max(0, (z - near) / (far - near)))) * Math.min(1, (z - 0.8) / 2.4));
  const A = (st.alpha != null ? st.alpha : 1) * (ALPHA_K[st.f] ?? 1);   // krycie 0 w pierwszej klatce wejścia to 0, nie pełne
  const hot = (i) => (st.f === 2 && st.par && data.par[i] === st.par) || (st.f === 3 && st.kn && data.knot[i] === st.kn);
  const dim = st.par || st.kn ? 0.55 : 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const M = 24;   // węzły i krawędzie poza kadrem pomijamy (w zbliżeniu to większość)
  const out = (i) => sz[i] < 0.8 || sx[i] < -M || sx[i] > W + M || sy[i] < -M || sy[i] > H + M;
  const va = st.out ? new Float32Array(N) : null;
  ctx.lineWidth = Math.max(0.6, 1 / dpr + 0.25);
  ctx.strokeStyle = `rgb(${TEAL})`;
  for (const key of Object.keys(data.E)) {
    const ek = st.edges ? st.edges[key] || 0 : VIS[key][st.f];
    if (ek < 0.01) continue;
    const E = data.E[key];
    ctx.globalAlpha = BASE[key] * A * dim * ek;
    ctx.beginPath();
    for (let q = 0; q < E.length; q += 2) {
      const a = E[q], b = E[q + 1];
      if (sz[a] < 0.8 || sz[b] < 0.8 || (out(a) && out(b))) continue;
      ctx.moveTo(sx[a], sy[a]); ctx.lineTo(sx[b], sy[b]);
    }
    ctx.stroke();
  }
  // węzły: kropki zbierane w ścieżki według krycia (8 poziomów), a od promienia 3,5 px
  // geometria oka ze znaku (pierścień 1–0,854, źrenica 0,583, rdzeń 0,3125), rysowana od najdalszych
  const sizeK = SIZE_K[st.f] * (st.size || 1);
  const LV = 8, dots = Array.from({ length: LV }, () => []), eyes = [];
  for (let i = 0; i < N; i++) {
    if (out(i)) continue;
    const h = hot(i);
    if (va) va[i] = fog(sz[i]) * 0.9;
    const a = Math.min(1, fog(sz[i]) * 0.9 * A * (h ? 1.25 : dim));
    if (a < 0.015) continue;
    const r = Math.max(0.8, (0.16 * sizeK * data.size[i] * (data.size[i] > 2 && st.f === 5 ? 2.5 : 1) * f) / sz[i] / 2) * (h ? 1.5 : 1);   // 03: piasty jak w net.js (HUB_K)
    if (r < 3.5) dots[Math.min(LV - 1, Math.round(a * (LV - 1)))].push(i, r);
    else eyes.push([sz[i], i, r, a]);
  }
  ctx.fillStyle = `rgb(${NAVY})`;
  dots.forEach((list, lv) => {
    if (!list.length) return;
    ctx.globalAlpha = Math.max(0.02, lv / (LV - 1));
    ctx.beginPath();
    for (let k = 0; k < list.length; k += 2) { const i = list[k], r = list[k + 1] * 0.62; ctx.moveTo(sx[i] + r, sy[i]); ctx.arc(sx[i], sy[i], r, 0, Math.PI * 2); }
    ctx.fill();
  });
  eyes.sort((p, q) => q[0] - p[0]);
  ctx.strokeStyle = `rgb(${NAVY})`;
  for (const [, i, r, a] of eyes) {
    ctx.globalAlpha = a;
    ctx.lineWidth = r * 0.146;
    ctx.beginPath(); ctx.arc(sx[i], sy[i], r * 0.927, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = a * 0.5;
    ctx.beginPath(); ctx.arc(sx[i], sy[i], r * 0.583, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx[i], sy[i], r * 0.3125, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  if (st.out) Object.assign(st.out, { sx, sy, a: va });
}

// Rycina w treści: kanwa w <figure data-plate>, rysowana raz przy wejściu w widok.
export async function drawPlate(fig, spec) {
  await buildAsync();
  if (spec.f === 3) {
    const ring = curve(TIMELINE.ring), reference = curve(12.6);
    const shift = (v) => v.map((x, i) => x + ring[i] - reference[i]);
    spec = { ...spec, kn: TIMELINE.ringId, look: shift(spec.look), pos: shift(spec.pos) };
  }
  const cv = fig.querySelector('canvas');
  const r = fig.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const W = Math.max(1, Math.round(r.width)), H = Math.max(1, Math.round(r.height));
  cv.width = W * dpr; cv.height = H * dpr;
  render2D(cv.getContext('2d'), W, H, dpr, { ...spec, cx: W * (spec.ax ?? 0.5), cy: H * (spec.ay ?? 0.5), fullH: H * (spec.zoom ? 1 / spec.zoom : 1) });
  fig.classList.add('drawn');
}

// Scena za tekstem bez WebGL (pulpit): ta sama rama co three.js.
export function createFallback(canvas, centerX) {
  const ctx = canvas.getContext('2d');
  let W = 1, H = 1, dpr = 1;
  function resize() {
    W = canvas.clientWidth || innerWidth; H = canvas.clientHeight || innerHeight;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  }
  resize();
  return {
    resize,
    render(st) {
      const fr = frame(W, H, centerX());
      const f = st.T >= 0.5 ? st.to : st.from;
      render2D(ctx, W, H, dpr, { f, pos: st.pos, look: st.look, par: st.parStr > 0.5 ? st.par : 0, kn: st.knotStr > 0.5 ? st.knot : 0, alpha: 1, cx: fr.fullW / 2, cy: H / 2, fullH: H, dist: fr.dist });
    },
    dispose() {},
  };
}
