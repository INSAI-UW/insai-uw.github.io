// ink.js – znak INSAI jest ślepym tłoczeniem w papierze i nasiąka
// atramentem wypływającym z oka. Ten sam materiał rysuje podkreślenia.
// WebGL 1 bez biblioteki: jeden trójkąt na cały ekran i własny shader GLSL.
// Litery NSAI są krzywymi z DOM (symbol #znak, ścieżka #znak-nsai), więc kanwa nie
// czeka na krój. Pętla rysuje tylko przy zmianie: wejście 3,4 s, potem ślady kursora.

const VB = [58, 7, 148, 54];
const NP = 6;
const EYE = [78, 34];

function glCtx(canvas, opts) {
  const o = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, ...opts };
  return canvas.getContext('webgl', o) || canvas.getContext('experimental-webgl', o);
}
function program(gl, vs, fs) {
  const sh = (type, src) => {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const p = gl.createProgram();
  gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  gl.useProgram(p);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(p, 'position');
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = new Proxy({}, { get: (c, k) => (k in c ? c[k] : (c[k] = gl.getUniformLocation(p, k))) });
  return { p, u };
}
function texture(gl, unit, data, w, h) {
  const t = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  return t;
}

const VS = 'attribute vec2 position; varying vec2 vUv; void main(){ vUv = position*0.5+0.5; gl_Position = vec4(position,0.0,1.0); }';
const NOISE = `
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for(int i=0;i<OCT;i++){ s += a*n2(p); p = p*2.03 + 17.1; a *= 0.5; } return s; }`;

// ---------- znak: tłoczenie i atrament ----------
const FS_MARK = (oct) => `precision highp float;
#define OCT ${oct}
uniform sampler2D uMask; uniform sampler2D uBlur;
uniform float uT; uniform float uGrow; uniform float uDry; uniform vec2 uTexel; uniform vec3 uP[${NP}];
varying vec2 vUv;
${NOISE}
void main(){
  vec2 tuv = vec2(vUv.x, 1.0 - vUv.y);
  vec2 vb = vec2(${VB[0].toFixed(1)} + vUv.x*${VB[2].toFixed(1)}, ${VB[1].toFixed(1)} + tuv.y*${VB[3].toFixed(1)});
  vec4 mk = texture2D(uMask, tuv);
  vec2 bl = texture2D(uBlur, tuv).rg;
  float fib = fbm(vec2(vb.x*1.1 + vb.y*0.35, vb.y*2.1));
  float grain = n2(vb*6.0);
  float wet = 0.0;
  for (int i = 0; i < ${NP}; i++) { vec2 d = vb - uP[i].xy; wet += uP[i].z * exp(-dot(d,d)/120.0); }
  wet = clamp(wet, 0.0, 1.0);
  float d = length(vb - vec2(${EYE[0].toFixed(1)}, ${EYE[1].toFixed(1)}));
  float front = uGrow*150.0 - d + (fbm(vb*0.16 + 3.1) - 0.5)*26.0 + (fib - 0.5)*8.0;
  float reach = smoothstep(0.0, 3.5, front);
  float tide = exp(-pow((front - 1.8)/1.6, 2.0)) * (1.0 - uDry);
  float bleedAmt = (1.0 - uDry)*0.7 + wet*1.8;
  float feather = smoothstep(0.04, 0.5, bl.g) * smoothstep(0.42, 0.78, fib + wet*0.2) * (0.6 + 0.4*n2(vb*2.3));
  float bleed = max(bl.r*0.8, feather*0.32) * bleedAmt + wet*smoothstep(0.02, 0.4, bl.g)*(0.25 + 0.5*fib);
  float cov = max(mk.r, bleed*(1.0 - step(0.02, mk.r)) + mk.r);
  float pig = fbm(vb*0.32 + vec2(min(uT, 3.4)*0.045, -min(uT, 3.4)*0.03));
  float dens = cov * reach * (0.93 + 0.07*grain) * (1.0 + tide*0.55) * (1.0 - 0.07*(pig - 0.5));
  vec2 A = vec2(121.13, 2.76), B = vec2(137.87, 65.24);
  float gt = clamp(dot(vb - A, B - A) / dot(B - A, B - A), 0.0, 1.0);
  vec3 col = mix(vec3(0.102, 0.173, 0.278), vec3(0.173, 0.373, 0.435), gt);
  float a = clamp(dens, 0.0, 1.0) * mix(1.0, 0.7, gt);
  col *= 1.0 - tide*0.22;
  // tłoczenie: pochodna rozmytej maski; światło w barwie papieru, w stanie suchym słabe (bez aureoli)
  float ex = texture2D(uBlur, tuv + vec2(uTexel.x, 0.0)).r - texture2D(uBlur, tuv - vec2(uTexel.x, 0.0)).r;
  float ey = texture2D(uBlur, tuv + vec2(0.0, uTexel.y)).r - texture2D(uBlur, tuv - vec2(0.0, uTexel.y)).r;
  float e = (-ex + ey) * 3.4;
  float emb = mix(1.0, 0.2, reach);
  float sh = clamp(-e, 0.0, 1.0) * 0.16 * emb;
  float li = min(clamp(e, 0.0, 1.0) * 0.6 * emb, 0.12);
  vec3 lite = mix(vec3(0.969, 0.957, 0.925), vec3(1.0), 0.35);
  vec4 c = vec4(vec3(0.102, 0.173, 0.278)*sh, sh);
  c = vec4(lite*li, li) + c*(1.0 - li);
  c = vec4(col*a, a) + c*(1.0 - a);
  float hA = mk.g * reach * 0.95;
  c = vec4(vec3(hA), hA) + c*(1.0 - hA);
  gl_FragColor = c;
}`;

function drawMask(S, W, H, d) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
  x.setTransform(S, 0, 0, S, -VB[0] * S, -VB[1] * S);
  const circ = (cx, cy, r, f) => { x.fillStyle = f; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); };
  x.fillStyle = 'rgb(255,0,0)'; x.fillRect(73, 17, 10, 34);
  circ(78, 34, 9.6, 'rgb(255,0,0)'); circ(78, 34, 8.2, '#000'); circ(78, 34, 5.6, 'rgb(128,0,0)');
  circ(78, 34, 3, 'rgb(255,0,0)'); circ(76.5, 32.5, 0.9, 'rgb(255,242,0)');
  x.fillStyle = 'rgb(255,0,0)'; x.fill(new Path2D(d));
  return x.getImageData(0, 0, W, H).data;
}
// rozmycie na siatce 1/4: R = małe (ok. 1,2 j.), G = duże (ok. 4 j.)
function blurMask(src, W, H, S) {
  const k = 4, w = W / k | 0, h = H / k | 0, a = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x0 = 0; x0 < w; x0++) {
    let s = 0; for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) s += src[((y * k + j) * W + x0 * k + i) * 4];
    a[y * w + x0] = s / (k * k * 255);
  }
  const box = (inp, r) => {
    const t = new Float32Array(w * h), o = new Float32Array(w * h);
    for (let y = 0; y < h; y++) { let s = 0, n = 0; for (let i = -r; i < w + r; i++) { if (i + r < w) { s += inp[y * w + i + r]; n++; } if (i - r - 1 >= 0) { s -= inp[y * w + i - r - 1]; n--; } if (i >= 0 && i < w) t[y * w + i] = s / n; } }
    for (let x0 = 0; x0 < w; x0++) { let s = 0, n = 0; for (let i = -r; i < h + r; i++) { if (i + r < h) { s += t[(i + r) * w + x0]; n++; } if (i - r - 1 >= 0) { s -= t[(i - r - 1) * w + x0]; n--; } if (i >= 0 && i < h) o[i * w + x0] = s / n; } }
    return o;
  };
  const r1 = Math.max(1, Math.round(S / 10)), r2 = Math.max(2, Math.round(6 * S / 10));
  const b1 = box(box(a, r1), r1), b2 = box(box(a, r2), r2), out = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) { out[i * 4] = b1[i] * 255; out[i * 4 + 1] = b2[i] * 255; out[i * 4 + 3] = 255; }
  return { data: out, w, h };
}

const ease = (v) => 1 - Math.pow(1 - Math.min(Math.max(v, 0), 1), 3);
const sstep = (a, b, v) => { const k = Math.min(Math.max((v - a) / (b - a), 0), 1); return k * k * (3 - 2 * k); };
export const DRY = 3.4;

// stage: element sceny znaku; opts: { still, lite, t (klatka zamrożona), late (start w stanie suchym),
// hold (czeka na play()), speed (mnożnik czasu wejścia), wall (krok zegara bez przycięcia do 0,1 s) }
export function initInk(stage, opts = {}) {
  const d = document.getElementById('znak-nsai')?.getAttribute('d');
  if (!d) return null;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  const gl = glCtx(canvas, { preserveDrawingBuffer: opts.t != null });
  if (!gl) return null;
  const lite = !!opts.lite;
  const S = lite ? 6 : 10, W = VB[2] * S, H = VB[3] * S;
  const src = drawMask(S, W, H, d), bl = blurMask(src, W, H, S);
  const { u } = program(gl, VS, FS_MARK(lite ? 4 : 5));
  texture(gl, 0, new Uint8Array(src.buffer), W, H); gl.uniform1i(u.uMask, 0);
  texture(gl, 1, bl.data, bl.w, bl.h); gl.uniform1i(u.uBlur, 1);
  gl.uniform2f(u.uTexel, 1 / bl.w, 1 / bl.h);
  gl.clearColor(0, 0, 0, 0);
  stage.appendChild(canvas);

  const dprMax = lite ? 1.5 : 2;
  const fit = () => {
    const r = stage.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, dprMax);
    canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  fit();

  let still = !!opts.still;
  let T = opts.t != null ? opts.t : still || opts.late ? DRY : 0;
  const P = new Float32Array(NP * 3);
  const pts = [];
  function draw() {
    gl.uniform1f(u.uT, T);
    gl.uniform1f(u.uGrow, ease((T - 0.15) / 2.1));
    gl.uniform1f(u.uDry, sstep(1.8, DRY, T));
    for (let i = 0; i < NP; i++) { const q = pts[i]; P[i * 3] = q ? q[0] : -999; P[i * 3 + 1] = q ? q[1] : -999; P[i * 3 + 2] = q ? q[2] : 0; }
    gl.uniform3fv(u.uP, P);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  new ResizeObserver(() => { fit(); draw(); }).observe(stage);

  // pętla: tylko w widoku, przy widocznej karcie, do wyschnięcia albo dopóki żyją ślady kursora
  let loop = 0, prev = 0, inView = true, held = !!opts.hold && !still;
  const speed = opts.speed || 1;
  const busy = () => T < DRY || pts.some((q) => q[2] > 0.02);
  const tick = (now) => {
    const dt = opts.wall ? (now - prev) / 1000 : Math.min((now - prev) / 1000, 0.1); prev = now; T += dt * speed;   // wall (telefon): czas ścienny, wejście nie rozciąga się przy wolnych klatkach
    for (const q of pts) q[2] *= Math.exp(-dt / 0.9);
    if (T >= DRY && !pts.some((q) => q[2] > 0.02)) { pts.length = 0; }
    draw();
    loop = busy() ? requestAnimationFrame(tick) : 0;
  };
  function wake() { if (held || loop || still || opts.t != null || !inView || document.hidden || !busy()) return; prev = performance.now(); loop = requestAnimationFrame(tick); }
  function sleep() { cancelAnimationFrame(loop); loop = 0; }
  const toVB = (e) => { const r = stage.getBoundingClientRect(); return [VB[0] + (e.clientX - r.left) / r.width * VB[2], VB[1] + (e.clientY - r.top) / r.height * VB[3], r]; };
  let lastP = null;
  addEventListener('pointermove', (e) => {
    if (still || e.pointerType !== 'mouse') return;
    const [x, y, r] = toVB(e);
    if (e.clientX < r.left - 40 || e.clientX > r.right + 40 || e.clientY < r.top - 40 || e.clientY > r.bottom + 40) return;
    if (lastP && Math.hypot(x - lastP[0], y - lastP[1]) < 2.5) return;
    lastP = [x, y]; pts.unshift([x, y, 0.9]); pts.length = Math.min(pts.length, NP);
    wake();
  }, { passive: true });
  stage.addEventListener('pointerdown', (e) => {   // dotyk: jeden ślad, bez śledzenia palca
    if (still || e.pointerType === 'mouse') return;
    const [x, y] = toVB(e); pts.unshift([x, y, 0.9]); pts.length = Math.min(pts.length, NP); wake();
  }, { passive: true });
  new IntersectionObserver(([en]) => { inView = en.isIntersecting; inView ? wake() : sleep(); }).observe(stage);
  document.addEventListener('visibilitychange', () => (document.hidden ? sleep() : wake()));
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); sleep(); stage.classList.remove('gl-on'); });

  draw();
  stage.classList.add('gl-on');
  wake();
  return {
    setStill(v) { still = v; if (v) { sleep(); T = Math.max(T, DRY); pts.length = 0; draw(); } },
    play() { held = false; wake(); },
    get t() { return T; },
    finish() { held = false; sleep(); T = Math.max(T, DRY); draw(); },
  };
}

// ---------- atrament w podkreśleniach (paski liczone na karcie graficznej) ----------
const FS_STRIP = `precision highp float;
#define OCT 4
uniform vec2 uSize; uniform float uSeed; uniform float uDpr;
varying vec2 vUv;
${NOISE}
void main(){
  vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uSize;            // piksele CSS, y w dół
  float s = uSeed * 13.7;
  float core = 2.0 + (fbm(vec2(px.x / 40.0 + s, s)) - 0.5) * 0.6;
  float cy = uSize.y - 3.2 + (n2(vec2(px.x / 90.0 + s, 1.0)) - 0.5) * 0.8;
  float dy = px.y - cy;
  float body = 1.0 - smoothstep(core * 0.5 - 0.35, core * 0.5 + 0.35, abs(dy));
  float fib = fbm(vec2(px.x * 0.35 + s, px.y * 1.7));
  float feath = smoothstep(0.55, 0.85, fib) * (1.0 - smoothstep(core * 0.5, core * 0.5 + 2.0, abs(dy))) * 0.3;
  float drop = 1.0 - smoothstep(1.2, 1.9, length(px - vec2(2.2, cy)));
  float a = clamp(max(body * (0.86 + 0.14 * n2(px * 0.8 + s)), feath) + drop * 0.9, 0.0, 1.0);
  float gt = clamp(px.x / uSize.x, 0.0, 1.0);
  vec3 col = mix(vec3(0.102, 0.173, 0.278), vec3(0.173, 0.373, 0.435), gt);
  col *= 1.0 - 0.22 * smoothstep(0.2, 1.0, dy / max(core * 0.5, 0.5)) * body;   // brzeg zasychania u dołu
  a *= mix(1.0, 0.7, gt);
  gl_FragColor = vec4(col, a);   // bufor bez premultiplikacji (toDataURL)
}`;
export function inkStrips(els) {
  const canvas = document.createElement('canvas');
  const gl = glCtx(canvas, { preserveDrawingBuffer: true, premultipliedAlpha: false });
  if (!gl) return false;
  const { u } = program(gl, VS, FS_STRIP);
  const dpr = Math.min(devicePixelRatio || 1, 2);
  els.slice(0, 8).forEach((el, i) => {
    const L = Math.max(8, [...el.getClientRects()].reduce((a, r) => a + r.width, 0));
    canvas.width = Math.round(L * dpr); canvas.height = Math.round(8 * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(u.uSize, L, 8); gl.uniform1f(u.uSeed, i + 1); gl.uniform1f(u.uDpr, dpr);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    el.style.setProperty('--strip', `url(${canvas.toDataURL('image/png')})`);
    el.classList.add('ink-gl');
  });
  const ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext();
  return true;
}
