// net.js – tylko pulpit od 1081 px: sieć 1338 węzłów pod typografią,
// przelot kamery i formacje pod sekcjami. three.js 0.180.0 z repozytorium (vendor/three: licencja MIT, źródło
// i sumy kontrolne w WERSJA.txt), bez serwera zewnętrznego.
// Ładowana dynamicznie PO pierwszym malowaniu treści; tekst na nią nie czeka.
import * as THREE from "./vendor/three/three.module.min.js";
import { N, build, frame } from "./forms.js";

const NAVY = "vec3(0.1020, 0.1725, 0.2784)"; // #1a2c47
const TEAL = "vec3(0.1725, 0.3725, 0.4353)"; // #2c5f6f

const commonV = /* glsl */ `
  uniform vec2 uPointer; uniform float uLens; uniform float uAspect;
  uniform float uFogNear; uniform float uFogFar;
  uniform float uDocW; uniform float uPar; uniform float uParStr;
  uniform float uThrW; uniform float uKnot; uniform float uKnotStr;
  float focusOf(float par, float knot){
    float hp = uDocW * uParStr * step(0.5, par) * (1.0 - step(0.5, abs(par - uPar)));
    float hk = uThrW * uKnotStr * step(0.5, knot) * (1.0 - step(0.5, abs(knot - uKnot)));
    return max(hp, hk);
  }
  float dimOf(){ return 1.0 - max(0.42 * uDocW * uParStr, 0.35 * uThrW * uKnotStr); }
  float lensOf(vec4 clip){
    vec2 ndc = clip.xy / clip.w;
    return uLens * smoothstep(0.34, 0.0, length((ndc - uPointer) * vec2(uAspect, 1.0)));
  }
  float fogOf(float depth){ return 1.0 - smoothstep(uFogNear, uFogFar, depth); }
`;

const nodeV = /* glsl */ `
  attribute vec3 aPos; attribute vec4 aMeta; // rozmiar, paragraf, węzeł osi, ziarno
  uniform float uSize; uniform float uSizeK; uniform float uAlpha; uniform float uPx; uniform float uHubK;
  varying float vA; varying vec2 vUv; varying float vPx; varying float vHot;
  ${commonV}
  void main(){
    vec4 mv = modelViewMatrix * vec4(aPos, 1.0);
    float depth = -mv.z;
    float hot = focusOf(aMeta.y, aMeta.z);
    float lens = lensOf(projectionMatrix * mv);
    float s = uSize * uSizeK * aMeta.x * (aMeta.x > 2.0 ? uHubK : 1.0) * (1.0 + 0.6 * hot + 1.1 * lens);   // piasty (rozmiar 2,8): glif oka
    vPx = s * uPx / max(depth, 0.1);
    mv.xy += position.xy * s;
    gl_Position = projectionMatrix * mv;
    vUv = position.xy + 0.5;
    vHot = max(hot, lens);
    float near = smoothstep(0.8, 3.2, depth);
    vA = uAlpha * fogOf(depth) * near * mix(dimOf(), 1.0, vHot);
  }
`;
// Węzeł z geometrią oka ze znaku INSAI: pierścień 1.0–0.854, źrenica 0.583 (krycie 0.5), rdzeń 0.3125.
const nodeF = /* glsl */ `
  precision highp float;
  varying float vA; varying vec2 vUv; varying float vPx; varying float vHot;
  void main(){
    float r = length(vUv - 0.5) * 2.0;
    float aa = max(fwidth(r), 0.02);
    float disk = 1.0 - smoothstep(0.62 - aa, 0.62 + aa, r);
    float ring = (1.0 - smoothstep(1.0 - aa, 1.0, r)) * smoothstep(0.854 - aa, 0.854 + aa, r);
    float pupil = (1.0 - smoothstep(0.583 - aa, 0.583 + aa, r)) * 0.5;
    float core = (1.0 - smoothstep(0.3125 - aa, 0.3125 + aa, r)) * 0.5;
    float eye = ring + pupil + core;
    float a = mix(disk, eye, smoothstep(7.0, 14.0, vPx)) * vA;
    if (a < 0.004) discard;
    gl_FragColor = vec4(mix(${TEAL}, ${NAVY}, 0.72 + 0.28 * vHot), a);
  }
`;
const edgeV = /* glsl */ `
  attribute vec2 aTag; // paragraf, węzeł osi
  attribute float aP;  // udział krawędzi w przejściu falą (formacje 5 i 6): rysuje się za falą, gaśnie przed nią
  uniform float uEdge;
  varying float vA; varying float vHot;
  ${commonV}
  void main(){
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec4 clip = projectionMatrix * mv;
    gl_Position = clip;
    float hot = max(focusOf(aTag.x, aTag.y), lensOf(clip));
    vHot = hot;
    float near = smoothstep(0.8, 3.2, -mv.z);
    vA = aP * uEdge * fogOf(-mv.z) * near * mix(dimOf(), 1.0, hot) * (1.0 + 1.2 * hot);
  }
`;
const edgeF = /* glsl */ `
  precision highp float;
  varying float vA; varying float vHot;
  void main(){ gl_FragColor = vec4(mix(${TEAL}, ${NAVY}, vHot), min(vA, 0.9)); }
`;

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t) => Math.min(1, Math.max(0, t));

export function createScene(canvas, opts) {
  const centerX = opts.centerX || (() => (canvas.clientWidth || innerWidth) * 0.68);
  const data = build();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: !!opts.preserve });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace; // barwy marki dokładnie, bez konwersji
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 500);

  const uniforms = {
    uPointer: { value: new THREE.Vector2(9, 9) }, uLens: { value: 0 }, uAspect: { value: 1 },
    uFogNear: { value: 18 }, uFogFar: { value: 70 },
    uDocW: { value: 0 }, uPar: { value: 0 }, uParStr: { value: 0 },
    uThrW: { value: 0 }, uKnot: { value: 0 }, uKnotStr: { value: 0 },
  };

  // Węzły: jeden czworokąt, 1338 instancji (InstancedBufferGeometry)
  const quad = new THREE.PlaneGeometry(1, 1);
  const g = new THREE.InstancedBufferGeometry();
  g.index = quad.index;
  g.setAttribute("position", quad.getAttribute("position"));
  g.instanceCount = N;
  const pos = new Float32Array(N * 3);
  const aPos = new THREE.InstancedBufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage);
  const meta = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    meta[i * 4] = data.size[i]; meta[i * 4 + 1] = data.par[i]; meta[i * 4 + 2] = data.knot[i]; meta[i * 4 + 3] = data.seed[i];
  }
  g.setAttribute("aPos", aPos);
  g.setAttribute("aMeta", new THREE.InstancedBufferAttribute(meta, 4));
  const nodeU = { ...uniforms, uSize: { value: 0.1 }, uSizeK: { value: 1 }, uAlpha: { value: 0 }, uPx: { value: 1000 }, uHubK: { value: 1 } };
  const SIZE_K = [1, 0.9, 0.5, 0.6, 1, 0.58, 0.88]; // węzły w dokumencie są drobne jak znaki pisma; 03 (kadr dalej, rdzeń 45 % okna): średnica w kadrze jak dotąd
  const HUB_K = [1, 1, 1, 1, 1, 2.5, 1];   // 03: partnerzy to glify piasty (pierścień z kropką), więc piasty większe
  const ALPHA_K = [1, 1, 1, 1, 1, 0.74, 0.74];   // 03 i 04: ten sam stosunek krycia kropek do krawędzi (język sfery)
  // perspektywa powietrzna: mgła [bliska, daleka] jako krotność odległości kamery; 03 mocniej (tył koła wyraźnie jaśniejszy)
  const FOG_K = [[0.6, 1.6], [0.6, 1.6], [0.6, 1.6], [0.6, 1.6], [0.6, 1.6], [0.8, 1.55], [0.6, 1.6]];   // 03: ostrzejsza perspektywa powietrzna (tylna połowa koła i pąk za obręczą wyraźnie jaśniejsze)
  const nodeMat = new THREE.ShaderMaterial({ uniforms: nodeU, vertexShader: nodeV, fragmentShader: nodeF, transparent: true, depthTest: false, depthWrite: false });
  const nodes = new THREE.Mesh(g, nodeMat);
  nodes.frustumCulled = false;
  scene.add(nodes);

  // Krawędzie: zbiory, każdy widoczny w swojej formacji (5 członkostwo, 6 zarząd i opieka)
  const vis = { net: [1, 0, 0, 0, 1, 0, 0], ring: [0, 1, 0, 0, 0, 0, 0], doc: [0, 0, 1, 0, 0, 0, 0], thread: [0, 0, 0, 1, 0, 0, 0], czl: [0, 0, 0, 0, 0, 1, 0], skl: [0, 0, 0, 0, 0, 0, 1] };
  const base = { net: 0.34, ring: 0.22, doc: 0.85, thread: 0.42, czl: 0.33, skl: 0.38 };
  const sets = Object.keys(data.E).map((k) => {
    const E = data.E[k];
    const geo = new THREE.BufferGeometry();
    const p = new Float32Array(E.length * 3);
    const tag = new Float32Array(E.length * 2);
    for (let q = 0; q < E.length; q++) { tag[q * 2] = data.par[E[q]]; tag[q * 2 + 1] = data.knot[E[q]]; }
    const attr = new THREE.BufferAttribute(p, 3).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("position", attr);
    geo.setAttribute("aTag", new THREE.BufferAttribute(tag, 2));
    const pa = new Float32Array(E.length).fill(1), pAttr = new THREE.BufferAttribute(pa, 1).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("aP", pAttr);
    const u = { ...uniforms, uEdge: { value: 0 } };
    const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: edgeV, fragmentShader: edgeF, transparent: true, depthTest: false, depthWrite: false });
    const lines = new THREE.LineSegments(geo, mat);
    lines.frustumCulled = false;
    scene.add(lines);
    return { k, E, p, attr, u, lines, pa, pAttr, flat: true };
  });
  // Ślady przejścia falą: krótki odcinek od węzła wstecz po jego torze (tylko w locie)
  const trailP = new Float32Array(N * 6), trailA = new Float32Array(N * 2);
  const trailGeo = new THREE.BufferGeometry();
  const trailAttr = new THREE.BufferAttribute(trailP, 3).setUsage(THREE.DynamicDrawUsage), trailPA = new THREE.BufferAttribute(trailA, 1).setUsage(THREE.DynamicDrawUsage);
  trailGeo.setAttribute("position", trailAttr); trailGeo.setAttribute("aP", trailPA); trailGeo.setAttribute("aTag", new THREE.BufferAttribute(new Float32Array(N * 4), 2));
  const trailU = { ...uniforms, uEdge: { value: 0 } };
  const trail = new THREE.LineSegments(trailGeo, new THREE.ShaderMaterial({ uniforms: trailU, vertexShader: edgeV, fragmentShader: edgeF, transparent: true, depthTest: false, depthWrite: false }));
  trail.frustumCulled = false; trail.visible = false;
  scene.add(trail);
  const prog = new Float32Array(N);

  let W = 1, H = 1, distK = 1;
  function resize() {
    W = canvas.clientWidth || innerWidth; H = canvas.clientHeight || innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
    const fr = frame(W, H, centerX());
    distK = fr.dist;
    camera.aspect = fr.fullW / fr.fullH;
    camera.setViewOffset(fr.fullW, fr.fullH, fr.offX, fr.offY, W, H);
    camera.updateProjectionMatrix();
    uniforms.uAspect.value = W / H;
    nodeU.uPx.value = (fr.fullH / 2) / Math.tan((camera.fov * Math.PI) / 360);
    nodeU.uSize.value = 0.16;
  }
  resize();

  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
  // stan: formacje (od, do, t), kamera, podświetlenia, czas, wejście
  const camR = new THREE.Vector3(), camU = new THREE.Vector3(), camF = new THREE.Vector3();
  function render(st) {
    const { from, to, T, time, intro, drift } = st;
    // kamera przed węzłami: odbicia (st.bounce) są w pikselach ekranu i przeliczamy je na świat w układzie kamery
    tmpA.fromArray(st.look);
    tmpB.fromArray(st.pos).sub(tmpA).multiplyScalar(distK);
    if (drift > 0) {
      tmpB.applyAxisAngle(THREE.Object3D.DEFAULT_UP, Math.sin(time * 0.07) * 0.09 * drift);
      tmpB.y += Math.sin(time * 0.11) * 0.6 * drift;
    }
    camera.position.copy(tmpA).add(tmpB);
    camera.position.x += st.pointer[0] * 0.9 * st.lens;
    camera.position.y += st.pointer[1] * 0.5 * st.lens;
    camera.lookAt(tmpA);
    camera.updateMatrixWorld();
    camR.setFromMatrixColumn(camera.matrixWorld, 0); camU.setFromMatrixColumn(camera.matrixWorld, 1); camF.setFromMatrixColumn(camera.matrixWorld, 2).negate();
    const bounce = st.bounce && st.bounce.size ? st.bounce : null;   // Map id -> [dx, dy] w px (znak.js: nici startu)
    const spread = st.introSpread || 2.6;   // wejście: rozproszenie początkowe (start D: mniejsze i krótsze)
    const A = data.F[from], B = data.F[to];
    // Przejścia 02-03-04-05 (formacje 5 i 6): ciągła przemiana jednego zbioru węzłów. Fala z opóźnieniem według
    // rangi x w formacji docelowej, tor zakrzywiony (wir w płaszczyźnie rysunku i uniesienie ku widzowi), krawędzie
    // celu rysują się za falą, krawędzie źródła gasną przed nią, a węzły w locie zostawiają krótki ślad.
    const wave = from !== to && (from >= 5 || to >= 5) && data.wave ? data.wave[to] : null;
    // obrót brył 5 i 6 wokół osi pionowej sterowany przewijaniem przez sekcję (st.spin: -1..1 -> ±7°), osobno dla
    // formacji źródłowej i docelowej, więc przejście zostaje ciągłe; przy redukcji ruchu spin = 0
    const SPIN = 7 * Math.PI / 180, spA = (st.spin && st.spin[from]) || 0, spB = (st.spin && st.spin[to]) || 0;
    const cA = Math.cos(spA * SPIN), sA = Math.sin(spA * SPIN), cB = Math.cos(spB * SPIN), sB = Math.sin(spB * SPIN);
    const pathAt = (i, ti, out) => {
      const a0 = A[i * 3], a2 = A[i * 3 + 2], b0 = B[i * 3], b2 = B[i * 3 + 2];
      const ax = a0 * cA + a2 * sA, az = -a0 * sA + a2 * cA, bx = b0 * cB + b2 * sB, bz = -b0 * sB + b2 * cB, ay = A[i * 3 + 1], by = B[i * 3 + 1];
      let x = ax + (bx - ax) * ti, y = ay + (by - ay) * ti, z = az + (bz - az) * ti;
      if (wave) {
        // tor przestrzenny: wir w płaszczyźnie rysunku, uniesienie ku widzowi i łuk w głąb (znak z ziarna)
        const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1, b = Math.sin(Math.PI * ti), L = Math.min(Math.hypot(dx, dy, bz - az), 14);
        const bend = Math.min(len, 14) * 0.24 * b;
        x += (-dy / len) * bend; y += (dx / len) * bend; z += (1.4 + 0.2 * L * (data.seed[i] > 0.5 ? 1 : -1)) * b;
      }
      out[0] = x; out[1] = y; out[2] = z;
    };
    const tp = [0, 0, 0], tq = [0, 0, 0];
    // oddech formacji 5 i 6 w kadrze: obrót o kilka stopni i drobne skalowanie, tylko z dryfem (gaśnie po 5,5 s)
    const live = drift * ((from >= 5 ? 1 - T : 0) + (to >= 5 ? T : 0));
    const rot = Math.sin(time * 0.11) * 0.05 * live, cr = Math.cos(rot), sr = Math.sin(rot), sc = 1 + Math.sin(time * 0.17) * 0.012 * live;
    let inFlight = 0;
    for (let i = 0; i < N; i++) {
      const sd = data.seed[i];
      const ti = from === to ? 0 : wave ? ease(clamp01((T - 0.6 * (0.8 * wave[i] + 0.2 * sd)) / 0.4)) : ease(clamp01((T - sd * 0.32) / 0.68));
      prog[i] = ti;
      pathAt(i, ti, tp);
      let x = tp[0], y = tp[1], z = tp[2];
      if (live > 0) { const rx = (x * cr - y * sr) * sc, ry = (x * sr + y * cr) * sc; x = rx; y = ry; }
      if (wave) {
        const fl = Math.sin(Math.PI * ti);
        if (fl > 0.02) inFlight++;
        pathAt(i, Math.max(0, ti - 0.09), tq);
        let vx = tq[0] - x, vy = tq[1] - y, vz = tq[2] - z; const vl = Math.hypot(vx, vy, vz), cap = vl > 0.9 ? 0.9 / vl : 1;   // ślad najwyżej 0,9 jednostki
        trailP[i * 6 + 3] = vx * cap; trailP[i * 6 + 4] = vy * cap; trailP[i * 6 + 5] = vz * cap;   // wektor śladu; koniec po dryfie niżej
        trailA[i * 2] = fl; trailA[i * 2 + 1] = 0;
      }
      if (drift > 0) {
        x += Math.sin(time * 0.37 + sd * 40.0) * 0.07 * drift;
        y += Math.cos(time * 0.31 + sd * 57.0) * 0.07 * drift;
        z += Math.sin(time * 0.29 + sd * 23.0) * 0.07 * drift;
      }
      if (intro < 1) {
        // wejście sieci: węzły zbiegają się z rozproszenia, każdy z własnym opóźnieniem
        const k = ease(clamp01((intro - sd * 0.45) / 0.55));
        const sp = spread - (spread - 1) * k;
        x *= sp; y *= sp; z = z * sp + (1 - k) * 5 * (spread - 1);
      }
      const bo = bounce && bounce.get(i);
      if (bo) {
        // węzeł ciągnięty przez nić i odbijający się po jej zerwaniu: przesunięcie ekranowe przeliczone na świat
        const depth = Math.max(0.5, (x - camera.position.x) * camF.x + (y - camera.position.y) * camF.y + (z - camera.position.z) * camF.z);
        const k = depth / nodeU.uPx.value;
        x += (camR.x * bo[0] - camU.x * bo[1]) * k; y += (camR.y * bo[0] - camU.y * bo[1]) * k; z += (camR.z * bo[0] - camU.z * bo[1]) * k;
      }
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      if (wave) { trailP[i * 6] = x; trailP[i * 6 + 1] = y; trailP[i * 6 + 2] = z; trailP[i * 6 + 3] += x; trailP[i * 6 + 4] += y; trailP[i * 6 + 5] += z; }
    }
    aPos.needsUpdate = true;
    const wF = [0, 0, 0, 0, 0, 0, 0];
    wF[from] += 1 - T; wF[to] += T;
    const introA = clamp01(intro * 1.6), introE = clamp01((intro - 0.45) / 0.55);
    nodeU.uAlpha.value = st.alphaCap * introA * wF.reduce((a, w, f) => a + w * ALPHA_K[f], 0);
    nodeU.uSizeK.value = wF.reduce((a, w, f) => a + w * SIZE_K[f], 0);
    nodeU.uHubK.value = wF.reduce((a, w, f) => a + w * HUB_K[f], 0);
    const sm01 = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
    if (wave) {
      trailAttr.needsUpdate = true; trailPA.needsUpdate = true;
      trailU.uEdge.value = 0.5 * introE * st.alphaCap; trail.visible = inFlight > 0;
    } else trail.visible = false;
    for (const s of sets) {
      // krawędzie gasną na początku przejścia i wracają dopiero, gdy formacja jest prawie ułożona;
      // w przejściach falą (formacje 5 i 6) krawędź zależy od postępu obu swoich węzłów
      const inA = vis[s.k][from], inB = vis[s.k][to];
      let a;
      if (wave && (inA || inB) && !(inA && inB)) {
        a = base[s.k] * introE * st.alphaCap;
        const E = s.E, pa = s.pa;
        for (let q = 0; q < E.length; q += 2) {
          const t = Math.min(prog[E[q]], prog[E[q + 1]]), t2 = Math.max(prog[E[q]], prog[E[q + 1]]);
          pa[q] = pa[q + 1] = inB ? sm01(0.8, 1, t) : 1 - sm01(0, 0.1, t2);
        }
        s.pAttr.needsUpdate = true; s.flat = false;
      } else {
        let w = 0;
        for (let f = 0; f < wF.length; f++) if (vis[s.k][f]) { const x = clamp01((wF[f] - 0.72) / 0.28); w += x * x * (3 - 2 * x); }
        a = base[s.k] * w * introE * st.alphaCap;
        if (!s.flat) { s.pa.fill(1); s.pAttr.needsUpdate = true; s.flat = true; }
      }
      s.u.uEdge.value = a;
      s.lines.visible = a > 0.003;
      if (!s.lines.visible) continue;
      const E = s.E, p = s.p;
      for (let q = 0; q < E.length; q++) {
        const i = E[q] * 3;
        p[q * 3] = pos[i]; p[q * 3 + 1] = pos[i + 1]; p[q * 3 + 2] = pos[i + 2];
      }
      s.attr.needsUpdate = true;
    }
    uniforms.uDocW.value = wF[2]; uniforms.uPar.value = st.par; uniforms.uParStr.value = st.parStr;
    uniforms.uThrW.value = wF[3]; uniforms.uKnot.value = st.knot; uniforms.uKnotStr.value = st.knotStr;
    uniforms.uPointer.value.set(st.pointer[0], st.pointer[1]);
    uniforms.uLens.value = st.lens;
    const dist = tmpB.length();
    const fogN = wF.reduce((a, w, f) => a + w * FOG_K[f][0], 0), fogF = wF.reduce((a, w, f) => a + w * FOG_K[f][1], 0);
    uniforms.uFogNear.value = dist * fogN; uniforms.uFogFar.value = dist * fogF;
    // topClip: opcjonalne ucięcie od góry (main.js ustawia 0: linię metadanych chroni maska sceny).
    renderer.setScissorTest(false);
    renderer.clear();
    renderer.setScissor(0, 0, W, Math.max(0, H - (st.topClip || 0)));
    renderer.setScissorTest(true);
    renderer.render(scene, camera);
    renderer.setScissorTest(false);
  }
  // położenia węzłów na kanwie sceny (px) w ostatnio narysowanej klatce: start znaku (znak.js) czyta z nich węzły sieci
  const pv = new THREE.Vector3();
  // rzut węzłów na ekran: [x, y, widoczny, głębia NDC, średnica węzła w px (bez podświetlenia)]; dla znak.js
  const pw = new THREE.Vector3();
  function screen(ids) { return ids.map((i) => { pv.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]); pw.copy(pv).applyMatrix4(camera.matrixWorldInverse); pv.project(camera);
    const sz = data.size[i], px = (nodeU.uSize.value * nodeU.uSizeK.value * sz * (sz > 2 ? nodeU.uHubK.value : 1) * nodeU.uPx.value) / Math.max(0.1, -pw.z);
    return [((pv.x + 1) / 2) * W, ((1 - pv.y) / 2) * H, pv.z < 1, pv.z, px]; }); }
  return { render, resize, screen, dispose: () => renderer.dispose() };
}
