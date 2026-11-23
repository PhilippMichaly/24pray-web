'use client';

import { useEffect, useRef, useState } from 'react';
import { Globe, type ChainPoint, type GlobeProps } from './Globe';
import { nextQuality, qualitySettings, QUALITY_WINDOW_MS, type GlobeQuality } from './globe-quality';
import { startLongitude, subsolarPoint } from '@/lib/sun';

/**
 * WebGL2-Erde der Landing. Gleiche Props und gleiche Bedienung wie `Globe`, aber auf der
 * Grafikkarte gerechnet:
 * – Sonnenstand aus der echten UTC-Zeit; beim Start steht der Längengrad des Besuchers in der
 *   Bildmitte — er sieht die Erde so, wie es bei ihm gerade ist
 * – Atmosphäre mit Dämmerungsband, Stadtlichter nur nachts, Sonnenglanz auf dem Meer,
 *   prozedurale Wolken mit Schattenwurf
 * – Gebetsnetz in HDR mit Bloom, Impulse als Kometenschweif
 * – Pixeldichte bis 2, Resize, Pause wenn unsichtbar; schwache Geräte werden stufenweise
 *   entlastet (`globe-quality.ts`)
 * – neue `points` (die Landing lädt minütlich nach) ändern nur das Netz: Blickwinkel, Zoom und
 *   Grafikkontext bleiben
 * Ohne WebGL2, bei Shader-Fehler oder Kontextverlust rendert die Komponente `Globe`.
 * prefers-reduced-motion → keine Eigendrehung, keine Kometen, keine Wolkendrift; Flüge springen.
 */

const FOCUS_ZOOM = 1.8;
const ARC_N = 32;
const AUTO_DEG_S = 360 / 120;

const FALLBACK_POINTS: ChainPoint[] = [
  { lat: 52.5, lon: 13.4 }, { lat: 48.1, lon: 11.6 }, { lat: 51.5, lon: -0.1 },
  { lat: 40.7, lon: -74.0 }, { lat: -23.5, lon: -46.6 }, { lat: 6.5, lon: 3.4 },
  { lat: -1.3, lon: 36.8 }, { lat: 28.6, lon: 77.2 }, { lat: 14.6, lon: 121.0 },
  { lat: -33.9, lon: 151.2 },
];

type Vec3 = [number, number, number];

function latLonToVec(latDeg: number, lonDeg: number): Vec3 {
  const lat = (latDeg * Math.PI) / 180;
  const lon = (lonDeg * Math.PI) / 180;
  return [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
}

function slerp(a: Vec3, b: Vec3, t: number): Vec3 {
  let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  dot = Math.min(1, Math.max(-1, dot));
  const th = Math.acos(dot);
  if (th < 1e-4) return a;
  const s = Math.sin(th);
  const w1 = Math.sin((1 - t) * th) / s;
  const w2 = Math.sin(t * th) / s;
  return [a[0] * w1 + b[0] * w2, a[1] * w1 + b[1] * w2, a[2] * w1 + b[2] * w2];
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// ───────────────────────── Shader ─────────────────────────

const VS_QUAD = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FS_EARTH = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uDay;
uniform sampler2D uNight;
uniform mat3 uRot;     // Blick → Welt
uniform vec3 uSun;     // Welt
uniform float uR;      // Kugelradius in halben Canvas-Breiten
uniform float uPx;     // Pixelgröße in halben Canvas-Breiten
uniform float uTime;
uniform float uStars;
uniform float uClouds;   // 0 = aus (schwache Geräte), 1 = an
const float PI = 3.14159265359;

float hash31(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
float hash21(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float vnoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = mix(hash31(i), hash31(i + vec3(1, 0, 0)), f.x);
  float b = mix(hash31(i + vec3(0, 1, 0)), hash31(i + vec3(1, 1, 0)), f.x);
  float c = mix(hash31(i + vec3(0, 0, 1)), hash31(i + vec3(1, 0, 1)), f.x);
  float d = mix(hash31(i + vec3(0, 1, 1)), hash31(i + vec3(1, 1, 1)), f.x);
  return mix(mix(a, b, f.y), mix(c, d, f.y), f.z);
}
float fbm(vec3 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    s += a * vnoise(p);
    p = p * 2.03 + vec3(17.1, 3.7, 9.2);
    a *= 0.5;
  }
  return s;
}
// Wolkendecke: 3D-Rauschen auf der Kugel (nahtlos), driftet langsam um die Erdachse.
float cloudCover(vec3 n) {
  if (uClouds <= 0.0) return 0.0;
  float ang = uTime * 0.006;
  float ca = cos(ang);
  float sa = sin(ang);
  vec3 q = vec3(n.x * ca - n.z * sa, n.y, n.x * sa + n.z * ca);
  vec3 warp = vec3(fbm(q * 2.1 + 4.0), fbm(q * 2.1 + 11.0), fbm(q * 2.1 + 23.0)) - 0.5;
  float f = fbm(q * vec3(3.2, 5.0, 3.2) + warp * 1.6);
  float bands = 0.06 * cos(asin(clamp(n.y, -1.0, 1.0)) * 6.0);
  return smoothstep(0.54, 0.76, f + bands) * uClouds;
}

vec3 sampleSphere(sampler2D t, vec3 n) {
  float u = atan(n.x, n.z) / (2.0 * PI) + 0.5;
  float v = 0.5 - asin(clamp(n.y, -1.0, 1.0)) / PI;
  float u2 = fract(u + 0.5) - 0.5;            // nahtfreie Ableitung an der Datumsgrenze
  bool alt = fwidth(u2) < fwidth(u);
  vec2 dx = vec2(alt ? dFdx(u2) : dFdx(u), dFdx(v));
  vec2 dy = vec2(alt ? dFdy(u2) : dFdy(u), dFdy(v));
  return textureGrad(t, vec2(u, v), dx, dy).rgb;
}

void main() {
  vec2 p = (vUv * 2.0 - 1.0) / uR;
  float r = length(p);
  float mask = smoothstep(1.0 + uPx / uR, 1.0 - uPx / uR, r);

  // ── Oberfläche ──
  vec2 pc = r > 0.9995 ? p / r * 0.9995 : p;
  vec3 nv = vec3(pc, sqrt(max(0.0, 1.0 - dot(pc, pc))));
  vec3 n = uRot * nv;
  vec3 view = uRot * vec3(0.0, 0.0, 1.0);

  vec3 day = sampleSphere(uDay, n);
  vec3 night = sampleSphere(uNight, n);
  float ndl = dot(n, uSun);
  float dayAmt = smoothstep(-0.10, 0.20, ndl);
  float lit = max(ndl, 0.0);
  vec3 sunCol = mix(vec3(1.0, 0.56, 0.30), vec3(1.0, 0.97, 0.92), smoothstep(0.0, 0.30, ndl));

  float water = smoothstep(0.0, 0.02, day.b - 1.5 * max(day.r, day.g));
  vec3 albedo = day + water * vec3(0.0, 0.014, 0.03);

  float cl = cloudCover(n);
  float clShadow = cloudCover(normalize(n + uSun * 0.014));

  vec3 col = albedo * (lit * 1.25 * (1.0 - 0.45 * clShadow) + 0.012) * sunCol;

  vec3 h = normalize(uSun + view);
  float nh = max(dot(n, h), 0.0);
  float spec = (pow(nh, 90.0) * 1.6 + pow(nh, 14.0) * 0.10) * water * (1.0 - cl) * step(0.0, ndl);
  col += spec * sunCol;

  col = mix(col, sunCol * lit * 0.95 + vec3(0.004, 0.006, 0.012), cl * 0.85);

  // Stadtlichter: nur auf der Nachtseite, helle Kerne in HDR (→ Bloom)
  vec3 lights = night * 1.5 + night * night * vec3(5.0, 3.6, 2.0);
  col += lights * (1.0 - dayAmt) * (1.0 - 0.65 * cl);

  // Atmosphäre von innen: Dunst + Randaufhellung, an der Dämmerungslinie orange
  vec3 scatter = mix(vec3(1.0, 0.40, 0.14), vec3(0.22, 0.48, 1.0), smoothstep(-0.02, 0.22, ndl));
  float atmLit = smoothstep(-0.12, 0.10, ndl);
  float fres = pow(1.0 - nv.z, 3.0);
  col += scatter * (atmLit * fres * 0.55 + smoothstep(0.0, 0.2, ndl) * 0.03);
  col += vec3(0.010, 0.020, 0.045) * fres;

  // ── Außen: Atmosphärensaum + Sterne ──
  float hgt = max(r - 1.0, 0.0);
  vec3 nl = uRot * vec3(p / max(r, 1e-4), 0.0);
  float ndlL = dot(nl, uSun);
  vec3 scatL = mix(vec3(1.0, 0.40, 0.14), vec3(0.22, 0.48, 1.0), smoothstep(-0.04, 0.20, ndlL));
  float dens = exp(-hgt / 0.030) * 0.5 + exp(-hgt / 0.11) * 0.12;
  vec3 halo = scatL * dens * smoothstep(-0.20, 0.15, ndlL) + vec3(0.012, 0.024, 0.055) * exp(-hgt / 0.03);

  vec2 cell = floor(gl_FragCoord.xy / 22.0);
  vec2 inCell = fract(gl_FragCoord.xy / 22.0) - 0.5;
  float sh = hash21(cell);
  vec2 off = vec2(hash21(cell + 7.3), hash21(cell + 19.1)) - 0.5;
  float sd = length(inCell - off * 0.7) * 22.0;
  float star = step(0.93, sh) * exp(-sd * sd * 1.1) * (0.25 + 0.75 * hash21(cell + 3.1));
  vec2 e = abs(vUv * 2.0 - 1.0);
  float edge = smoothstep(1.0, 0.80, max(e.x, e.y));
  vec3 outside = (halo + vec3(0.85, 0.9, 1.0) * star * uStars * smoothstep(0.02, 0.10, hgt)) * edge;

  vec3 c = mix(outside, col, mask);
  float aOut = clamp(max(outside.r, max(outside.g, outside.b)), 0.0, 1.0);
  o = vec4(c, mix(aOut, 1.0, mask));
}`;

const VS_NET = `#version 300 es
in vec2 aPos;   // Pixel, y nach unten
in vec2 aUv;
in vec4 aCol;   // rgb + Intensität
in vec2 aKind;  // Art, Lauf-Parameter t
uniform float uSize;
out vec2 vUv;
out vec4 vCol;
out vec2 vKind;
void main() {
  vUv = aUv; vCol = aCol; vKind = aKind;
  gl_Position = vec4(aPos.x / uSize * 2.0 - 1.0, 1.0 - aPos.y / uSize * 2.0, 0.0, 1.0);
}`;

const FS_NET = `#version 300 es
precision highp float;
in vec2 vUv;
in vec4 vCol;
in vec2 vKind;
uniform float uHead;
out vec4 o;
void main() {
  float a;
  if (vKind.x < 0.5) {            // Lichtpunkt
    float d = dot(vUv, vUv);
    a = exp(-d * 5.0) * vCol.a;
  } else if (vKind.x > 2.5) {     // Fokus-Ring
    float d = length(vUv) - 0.72;
    a = exp(-d * d * 90.0) * vCol.a;
  } else {                        // Bogen (1 = ruhig, 2 = aktiv mit Komet)
    float across = exp(-vUv.x * vUv.x * 4.5);
    float comet = vKind.x > 1.5 ? exp(-fract(uHead + vUv.y - vKind.y) * 9.0) * 4.0 : 0.0;
    a = across * vCol.a * (1.0 + comet);
  }
  o = vec4(vCol.rgb * a, clamp(a, 0.0, 1.0) * 0.5);
}`;

const FS_DOWN = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uTex;
uniform vec2 uTexel;
uniform float uThreshold;
void main() {
  vec3 c = texture(uTex, vUv + uTexel * vec2(-1.0, -1.0)).rgb + texture(uTex, vUv + uTexel * vec2(1.0, -1.0)).rgb
         + texture(uTex, vUv + uTexel * vec2(-1.0, 1.0)).rgb + texture(uTex, vUv + uTexel * vec2(1.0, 1.0)).rgb;
  c *= 0.25;
  float m = max(c.r, max(c.g, c.b));
  o = vec4(c * (max(m - uThreshold, 0.0) / max(m, 1e-4)), 1.0);
}`;

const FS_BLUR = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uTex;
uniform vec2 uDir;
void main() {
  vec3 c = texture(uTex, vUv).rgb * 0.2270270270;
  c += (texture(uTex, vUv + uDir * 1.3846153846).rgb + texture(uTex, vUv - uDir * 1.3846153846).rgb) * 0.3162162162;
  c += (texture(uTex, vUv + uDir * 3.2307692308).rgb + texture(uTex, vUv - uDir * 3.2307692308).rgb) * 0.0702702703;
  o = vec4(c, 1.0);
}`;

const FS_COMPOSITE = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uScene;
uniform sampler2D uBloomA;
uniform sampler2D uBloomB;
uniform float uBloomAmt;
vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}
void main() {
  vec4 s = texture(uScene, vUv);
  vec3 bloom = (texture(uBloomA, vUv).rgb * 0.55 + texture(uBloomB, vUv).rgb * 0.75) * uBloomAmt;
  vec3 c = pow(aces((s.rgb + bloom) * 1.15), vec3(1.0 / 2.2));
  float a = clamp(max(s.a, max(bloom.r, max(bloom.g, bloom.b)) * 1.4), 0.0, 1.0);
  // Weicher, abgerundeter Bildrand: gezoomt füllt die Kugel das Quadrat, ohne harte Kante
  vec2 e = abs(vUv * 2.0 - 1.0);
  float edge = smoothstep(1.0, 0.88, pow(pow(e.x, 6.0) + pow(e.y, 6.0), 1.0 / 6.0));
  c *= edge;
  a *= edge;
  o = vec4(min(c, vec3(a)), a);
}`;

// ───────────────────────── GL-Helfer ─────────────────────────

function compile(gl: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram {
  const prog = gl.createProgram()!;
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]] as const) {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      throw new Error(`Shader: ${gl.getShaderInfoLog(sh) ?? 'unbekannt'}`);
    }
    gl.attachShader(prog, sh);
  }
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(`Programm: ${gl.getProgramInfoLog(prog) ?? 'unbekannt'}`);
  }
  return prog;
}

interface Target {
  fbo: WebGLFramebuffer;
  tex: WebGLTexture;
  w: number;
  h: number;
}

function makeTarget(gl: WebGL2RenderingContext, w: number, h: number, hdr: boolean): Target {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  if (hdr) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
  else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  return { fbo, tex, w, h };
}

async function loadEarthTexture(gl: WebGL2RenderingContext, src: string, aniso: number): Promise<WebGLTexture> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.SRGB8_ALPHA8, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  if (aniso > 0) gl.texParameterf(gl.TEXTURE_2D, 0x84fe /* TEXTURE_MAX_ANISOTROPY_EXT */, aniso);
  return tex;
}

// ───────────────────────── Komponente ─────────────────────────

export function GlobeGL({ activeChains, points, focusPoint, onSelectPoint, className }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [unsupported, setUnsupported] = useState(false);
  const focusRef = useRef<{ point: ChainPoint | null; dirty: boolean }>({ point: null, dirty: false });
  const selectRef = useRef(onSelectPoint);
  selectRef.current = onSelectPoint;
  const dataRef = useRef({ points, activeChains, dirty: true });

  // Neue Daten → nur das Netz neu aufbauen (im Render-Loop), nie den Haupt-Effekt neu starten
  useEffect(() => {
    dataRef.current = { points, activeChains, dirty: true };
  }, [points, activeChains]);

  useEffect(() => {
    focusRef.current = { point: focusPoint ?? null, dirty: true };
  }, [focusPoint]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const gl = cv.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: true });
    if (!gl) {
      setUnsupported(true);
      return;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hdr = !!gl.getExtension('EXT_color_buffer_float');
    const anisoExt = gl.getExtension('EXT_texture_filter_anisotropic');
    const aniso = anisoExt ? Math.min(8, gl.getParameter(anisoExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number) : 0;

    let pEarth: WebGLProgram, pNet: WebGLProgram, pDown: WebGLProgram, pBlur: WebGLProgram, pComp: WebGLProgram;
    try {
      pEarth = compile(gl, VS_QUAD, FS_EARTH);
      pNet = compile(gl, VS_NET, FS_NET);
      pDown = compile(gl, VS_QUAD, FS_DOWN);
      pBlur = compile(gl, VS_QUAD, FS_BLUR);
      pComp = compile(gl, VS_QUAD, FS_COMPOSITE);
    } catch (err) {
      console.error('[GlobeGL]', err);
      setUnsupported(true);
      return;
    }
    const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);

    // Vollbild-Viereck
    const quadVao = gl.createVertexArray()!;
    gl.bindVertexArray(quadVao);
    const quadBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    for (const p of [pEarth, pDown, pBlur, pComp]) gl.bindAttribLocation(p, 0, 'aPos');
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    // bindAttribLocation wirkt erst nach erneutem Linken
    for (const p of [pEarth, pDown, pBlur, pComp]) gl.linkProgram(p);

    // Netz-Geometrie (pro Bild neu gefüllt)
    const STRIDE = 10;
    let netData = new Float32Array(STRIDE * 6 * 512);
    const netVao = gl.createVertexArray()!;
    const netBuf = gl.createBuffer()!;
    gl.bindVertexArray(netVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, netBuf);
    const attr = (name: string, n: number, off: number) => {
      const loc = gl.getAttribLocation(pNet, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, n, gl.FLOAT, false, STRIDE * 4, off * 4);
    };
    attr('aPos', 2, 0);
    attr('aUv', 2, 2);
    attr('aCol', 4, 4);
    attr('aKind', 2, 8);
    gl.bindVertexArray(null);

    // ── Größe / Ziele ──
    let quality: GlobeQuality = 0;
    let settings = qualitySettings(quality, window.devicePixelRatio);
    let dpr = 1;
    let size = 0;
    let scene: Target | null = null;
    let bloom: Target[] = [];
    function resize() {
      dpr = settings.dpr;
      const next = Math.max(2, Math.round(cv!.clientWidth * dpr));
      if (next === size) return;
      size = next;
      cv!.width = size;
      cv!.height = size;
      for (const t of [scene, ...bloom]) {
        if (!t) continue;
        gl!.deleteFramebuffer(t.fbo);
        gl!.deleteTexture(t.tex);
      }
      scene = makeTarget(gl!, size, size, hdr);
      const q = Math.max(1, size >> 2);
      const e = Math.max(1, size >> 3);
      bloom = [makeTarget(gl!, q, q, hdr), makeTarget(gl!, q, q, hdr), makeTarget(gl!, e, e, hdr), makeTarget(gl!, e, e, hdr)];
    }
    resize();
    const ro = new ResizeObserver(() => resize());
    ro.observe(cv);

    // ── Daten ──
    let chainPts: ChainPoint[] = [];
    let chainVecs: Vec3[] = [];
    let arcs: { pts: Vec3[]; active: boolean; phase: number }[] = [];
    function rebuildData() {
      const d = dataRef.current;
      d.dirty = false;
      chainPts =
        d.points && d.points.length > 0
          ? d.points
          : FALLBACK_POINTS.slice(0, Math.max(3, Math.min(FALLBACK_POINTS.length, d.activeChains)));
      chainVecs = chainPts.map((p) => latLonToVec(p.lat, p.lon));
      arcs = chainPts.flatMap((p, pi) =>
        (p.links ?? []).map((l, li) => {
          const from = latLonToVec(l.lat, l.lon);
          const pts: Vec3[] = [];
          for (let k = 0; k <= ARC_N; k++) {
            const t = k / ARC_N;
            const v = slerp(from, chainVecs[pi], t);
            const lift = 1 + 0.07 * Math.sin(Math.PI * t);
            pts.push([v[0] * lift, v[1] * lift, v[2] * lift]);
          }
          return { pts, active: l.active, phase: (pi * 0.37 + li * 0.61) % 1 };
        }),
      );
    }
    rebuildData();

    // ── Zustand ──
    // Start: der Längengrad des Besuchers in der Bildmitte (aus der Zeitzone, ohne Standortabfrage).
    const year = new Date().getFullYear();
    let yaw = startLongitude(new Date(year, 0, 1).getTimezoneOffset(), new Date(year, 6, 1).getTimezoneOffset());
    let pitch = -14;
    let zoom = 1;
    let yawVel = 0;
    let dragging = false;
    let moved = false;
    let downX = 0;
    let downY = 0;
    let lastX = 0;
    let lastY = 0;
    let lastInteraction = -Infinity;
    let flight: {
      start: number; dur: number;
      fromYaw: number; toYaw: number; fromPitch: number; toPitch: number; fromZoom: number; toZoom: number;
    } | null = null;

    const rot = new Float32Array(9);
    function updateRot() {
      const ya = (-yaw * Math.PI) / 180;
      const c = Math.cos(ya);
      const s = Math.sin(ya);
      const pa = (pitch * Math.PI) / 180;
      const cp = Math.cos(pa);
      const sp = Math.sin(pa);
      // Zeilen der Welt→Blick-Matrix als Spalten = Inverse (Blick→Welt)
      rot.set([c, 0, s, -s * sp, cp, c * sp, -s * cp, -sp, c * cp]);
    }
    /** Welt → Bildschirm (Pixel, y nach unten); z > 0 = Vorderseite. */
    function proj(v: Vec3, effR: number) {
      const x = rot[0] * v[0] + rot[1] * v[1] + rot[2] * v[2];
      const y = rot[3] * v[0] + rot[4] * v[1] + rot[5] * v[2];
      const z = rot[6] * v[0] + rot[7] * v[1] + rot[8] * v[2];
      return { x: size / 2 + effR * x, y: size / 2 - effR * y, z };
    }

    function startFlight(toYaw: number, toPitch: number, toZoom: number) {
      const dYaw = ((toYaw - yaw + 540) % 360) - 180;
      if (reduced) {
        yaw += dYaw;
        pitch = toPitch;
        zoom = toZoom;
        return;
      }
      flight = {
        start: performance.now(), dur: 1100,
        fromYaw: yaw, toYaw: yaw + dYaw, fromPitch: pitch, toPitch, fromZoom: zoom, toZoom,
      };
    }
    function handleFocusChange() {
      if (!focusRef.current.dirty) return;
      focusRef.current.dirty = false;
      const p = focusRef.current.point;
      if (p) startFlight(p.lon, Math.max(-60, Math.min(60, -p.lat)), FOCUS_ZOOM);
      else startFlight(yaw, Math.max(-60, Math.min(60, pitch)), 1);
    }

    // ── Interaktion (wie Globe) ──
    function onDown(e: PointerEvent) {
      dragging = true;
      moved = false;
      downX = lastX = e.clientX;
      downY = lastY = e.clientY;
      lastInteraction = performance.now();
      cv!.setPointerCapture(e.pointerId);
      cv!.style.cursor = 'grabbing';
    }
    function onMove(e: PointerEvent) {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 6) {
        moved = true;
        flight = null;
      }
      if (moved) {
        const k = 0.35 / zoom;
        yaw -= dx * k;
        pitch = Math.max(-60, Math.min(60, pitch + dy * k));
        yawVel = -dx * k;
      }
      lastX = e.clientX;
      lastY = e.clientY;
      lastInteraction = performance.now();
    }
    function onUp(e: PointerEvent) {
      dragging = false;
      lastInteraction = performance.now();
      try {
        cv!.releasePointerCapture(e.pointerId);
      } catch {
        /* schon released */
      }
      cv!.style.cursor = 'grab';
      if (moved) return;
      const rect = cv!.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * size;
      const py = ((e.clientY - rect.top) / rect.height) * size;
      const effR = size * 0.42 * zoom;
      updateRot();
      let hit: ChainPoint | null = null;
      let best = 18 * dpr;
      chainVecs.forEach((v, i) => {
        const sp = proj(v, effR);
        if (sp.z <= 0.05) return;
        const d = Math.hypot(sp.x - px, sp.y - py);
        if (d < best) {
          best = d;
          hit = chainPts[i];
        }
      });
      selectRef.current?.(hit);
    }
    cv.style.cursor = 'grab';
    cv.style.touchAction = 'none';
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onUp);

    // ── Netz in den Vertex-Puffer schreiben ──
    let nVerts = 0;
    function push(x: number, y: number, u: number, v: number, r: number, g: number, b: number, a: number, kind: number, t: number) {
      if ((nVerts + 1) * STRIDE > netData.length) {
        const grown = new Float32Array(netData.length * 2);
        grown.set(netData);
        netData = grown;
      }
      netData.set([x, y, u, v, r, g, b, a, kind, t], nVerts * STRIDE);
      nVerts++;
    }
    function sprite(x: number, y: number, rad: number, r: number, g: number, b: number, a: number, kind = 0) {
      const c: [number, number][] = [[-1, -1], [1, -1], [-1, 1], [-1, 1], [1, -1], [1, 1]];
      for (const [u, v] of c) push(x + u * rad, y + v * rad, u, v, r, g, b, a, kind, 0);
    }
    function buildNet(effR: number, pulse: number) {
      nVerts = 0;
      for (const arc of arcs) {
        const sp = arc.pts.map((v) => proj(v, effR));
        const w = (arc.active ? 2.6 : 2.0) * dpr;
        const base = arc.active ? 0.45 : 0.22;
        const kind = arc.active && !reduced ? 2 : 1;
        const edge = sp.map((p, i) => {
          const a = sp[Math.max(0, i - 1)];
          const b = sp[Math.min(sp.length - 1, i + 1)];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const l = Math.hypot(dx, dy) || 1;
          return { nx: (-dy / l) * w, ny: (dx / l) * w, vis: Math.max(0, Math.min(1, p.z / 0.12)) };
        });
        for (let i = 0; i < sp.length - 1; i++) {
          const a = sp[i];
          const b = sp[i + 1];
          const ea = edge[i];
          const eb = edge[i + 1];
          if (ea.vis <= 0 && eb.vis <= 0) continue;
          const ta = i / ARC_N;
          const tb = (i + 1) / ARC_N;
          const q: [number, number, number, number, number][] = [
            [a.x + ea.nx, a.y + ea.ny, 1, ta, ea.vis], [a.x - ea.nx, a.y - ea.ny, -1, ta, ea.vis],
            [b.x + eb.nx, b.y + eb.ny, 1, tb, eb.vis], [b.x + eb.nx, b.y + eb.ny, 1, tb, eb.vis],
            [a.x - ea.nx, a.y - ea.ny, -1, ta, ea.vis], [b.x - eb.nx, b.y - eb.ny, -1, tb, eb.vis],
          ];
          for (const [x, y, u, t, vis] of q) push(x, y, u, arc.phase, 1.0, 0.78, 0.36, base * vis, kind, t);
        }
        // Beter-Punkt am Bogenanfang
        if (sp[0].z > 0.05) {
          sprite(sp[0].x, sp[0].y, (arc.active ? 5 : 3.5) * dpr, 1.0, 0.86, 0.55, (arc.active ? 2.2 : 0.9) * pulse);
        }
      }
      const focused = focusRef.current.point;
      chainPts.forEach((p, i) => {
        const sp = proj(chainVecs[i], effR);
        if (sp.z <= 0.06) return;
        const vis = Math.min(1, sp.z * 2);
        const anyActive = (p.links ?? []).some((l) => l.active);
        sprite(sp.x, sp.y, (anyActive ? 26 : 19) * dpr * pulse, 1.0, 0.66, 0.20, (anyActive ? 1.5 : 1.0) * vis);
        sprite(sp.x, sp.y, 5 * dpr, 1.0, 0.92, 0.66, 5 * vis);
        if (focused && focused.lat === p.lat && focused.lon === p.lon) {
          sprite(sp.x, sp.y, (11 + 2 * pulse) * dpr, 1.0, 0.9, 0.6, 1.6, 3);
        }
      });
    }

    // ── Render ──
    let dayTex: WebGLTexture | null = null;
    let nightTex: WebGLTexture | null = null;
    let raf = 0;
    let prev = 0;
    let visible = true;
    let disposed = false;
    const t0 = performance.now();
    // Qualitätsmessung: 1 s Anlauf, dann fünf Fenster; bei Wiederaufnahme neu beginnen
    let measureLeft = 5;
    let warmupUntil = 0;
    let winStart = 0;
    let winFrames = 0;
    function measure(now: number) {
      if (measureLeft <= 0) return;
      if (warmupUntil === 0) warmupUntil = now + 1000;
      if (now < warmupUntil) return;
      if (winStart === 0) {
        winStart = now;
        winFrames = 0;
        return;
      }
      winFrames++;
      if (now - winStart < QUALITY_WINDOW_MS) return;
      const next = nextQuality(quality, winFrames, now - winStart);
      winStart = now;
      winFrames = 0;
      measureLeft = next === 2 ? 0 : measureLeft - 1;
      if (next !== quality) {
        quality = next;
        settings = qualitySettings(quality, window.devicePixelRatio);
        resize();
      }
    }

    function drawQuad() {
      gl!.bindVertexArray(quadVao);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
    }
    function blurPass(src: Target, dst: Target, dx: number, dy: number) {
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, dst.fbo);
      gl!.viewport(0, 0, dst.w, dst.h);
      gl!.bindTexture(gl!.TEXTURE_2D, src.tex);
      gl!.uniform2f(U(pBlur, 'uDir'), dx / src.w, dy / src.h);
      drawQuad();
    }

    function frame(now: number) {
      raf = 0;
      if (disposed || !scene || !dayTex || !nightTex) return;
      const dt = Math.min(0.1, (now - (prev || now)) / 1000);
      prev = now;

      if (dataRef.current.dirty) rebuildData();
      measure(now);
      handleFocusChange();
      if (flight) {
        const t = Math.min(1, (now - flight.start) / flight.dur);
        const e = easeInOut(t);
        yaw = flight.fromYaw + (flight.toYaw - flight.fromYaw) * e;
        pitch = flight.fromPitch + (flight.toPitch - flight.fromPitch) * e;
        zoom = flight.fromZoom + (flight.toZoom - flight.fromZoom) * e;
        if (t >= 1) flight = null;
      } else if (!dragging) {
        if (Math.abs(yawVel) > 0.02) {
          yaw += yawVel;
          yawVel *= 0.94;
        } else if (!reduced && now - lastInteraction > 4000 && zoom === 1 && !focusRef.current.point) {
          yaw += AUTO_DEG_S * dt;
        }
      }
      updateRot();

      const time = reduced ? 0 : (now - t0) / 1000;
      const pulse = reduced ? 1 : 0.8 + 0.2 * Math.sin(time * 1.7);
      const ss = subsolarPoint(new Date());
      const sun = latLonToVec(ss.lat, ss.lon);
      const effR = size * 0.42 * zoom;

      // 1. Szene (HDR): Erde, dann Netz additiv darüber
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, scene.fbo);
      gl!.viewport(0, 0, size, size);
      gl!.disable(gl!.BLEND);
      gl!.useProgram(pEarth);
      gl!.activeTexture(gl!.TEXTURE0);
      gl!.bindTexture(gl!.TEXTURE_2D, dayTex);
      gl!.activeTexture(gl!.TEXTURE1);
      gl!.bindTexture(gl!.TEXTURE_2D, nightTex);
      gl!.uniform1i(U(pEarth, 'uDay'), 0);
      gl!.uniform1i(U(pEarth, 'uNight'), 1);
      gl!.uniformMatrix3fv(U(pEarth, 'uRot'), false, rot);
      gl!.uniform3f(U(pEarth, 'uSun'), sun[0], sun[1], sun[2]);
      gl!.uniform1f(U(pEarth, 'uR'), 0.84 * zoom);
      gl!.uniform1f(U(pEarth, 'uPx'), 2 / size);
      gl!.uniform1f(U(pEarth, 'uTime'), time);
      gl!.uniform1f(U(pEarth, 'uStars'), Math.max(0, Math.min(1, (1.15 - zoom) * 6.6)));
      gl!.uniform1f(U(pEarth, 'uClouds'), settings.clouds ? 1 : 0);
      drawQuad();

      buildNet(effR, pulse);
      if (nVerts > 0) {
        gl!.enable(gl!.BLEND);
        gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA);
        gl!.useProgram(pNet);
        gl!.uniform1f(U(pNet, 'uSize'), size);
        gl!.uniform1f(U(pNet, 'uHead'), time / 1.6);
        gl!.bindVertexArray(netVao);
        gl!.bindBuffer(gl!.ARRAY_BUFFER, netBuf);
        gl!.bufferData(gl!.ARRAY_BUFFER, netData.subarray(0, nVerts * STRIDE), gl!.DYNAMIC_DRAW);
        gl!.drawArrays(gl!.TRIANGLES, 0, nVerts);
        gl!.disable(gl!.BLEND);
      }

      // 2. Bloom: Helles herausziehen, in zwei Stufen weichzeichnen (auf schwachen Geräten aus)
      if (settings.bloom) {
        gl!.activeTexture(gl!.TEXTURE0);
        gl!.useProgram(pDown);
        gl!.uniform1i(U(pDown, 'uTex'), 0);
        gl!.bindFramebuffer(gl!.FRAMEBUFFER, bloom[0].fbo);
        gl!.viewport(0, 0, bloom[0].w, bloom[0].h);
        gl!.bindTexture(gl!.TEXTURE_2D, scene.tex);
        gl!.uniform2f(U(pDown, 'uTexel'), 1 / size, 1 / size);
        gl!.uniform1f(U(pDown, 'uThreshold'), 1.0);
        drawQuad();
        gl!.useProgram(pBlur);
        gl!.uniform1i(U(pBlur, 'uTex'), 0);
        blurPass(bloom[0], bloom[1], 1, 0);
        blurPass(bloom[1], bloom[0], 0, 1);
        blurPass(bloom[0], bloom[3], 1.5, 0);
        blurPass(bloom[3], bloom[2], 0, 1.5);
      }

      // 3. Zusammensetzen + Tonwert-Abbildung auf den Bildschirm
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
      gl!.viewport(0, 0, size, size);
      gl!.useProgram(pComp);
      gl!.activeTexture(gl!.TEXTURE0);
      gl!.bindTexture(gl!.TEXTURE_2D, scene.tex);
      gl!.activeTexture(gl!.TEXTURE1);
      gl!.bindTexture(gl!.TEXTURE_2D, bloom[0].tex);
      gl!.activeTexture(gl!.TEXTURE2);
      gl!.bindTexture(gl!.TEXTURE_2D, bloom[2].tex);
      gl!.uniform1i(U(pComp, 'uScene'), 0);
      gl!.uniform1i(U(pComp, 'uBloomA'), 1);
      gl!.uniform1i(U(pComp, 'uBloomB'), 2);
      gl!.uniform1f(U(pComp, 'uBloomAmt'), settings.bloom ? 1 : 0);
      drawQuad();

      schedule();
    }
    function schedule() {
      if (!raf && visible && !document.hidden && !disposed) raf = requestAnimationFrame(frame);
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      prev = 0;
      winStart = 0;
      schedule();
    });
    io.observe(cv);
    const onVisibility = () => {
      prev = 0;
      winStart = 0;
      schedule();
    };
    document.addEventListener('visibilitychange', onVisibility);
    const onLost = (e: Event) => {
      e.preventDefault();
      setUnsupported(true); // bewusst kein Wiederherstellen: die Canvas-Erde übernimmt
    };
    cv.addEventListener('webglcontextlost', onLost);

    Promise.all([loadEarthTexture(gl, '/earth/day.jpg', aniso), loadEarthTexture(gl, '/earth/night.jpg', aniso)])
      .then(([d, n]) => {
        if (disposed) return;
        dayTex = d;
        nightTex = n;
        schedule();
      })
      .catch(() => {
        if (!disposed) setUnsupported(true);
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      cv.removeEventListener('webglcontextlost', onLost);
      cv.removeEventListener('pointerdown', onDown);
      cv.removeEventListener('pointermove', onMove);
      cv.removeEventListener('pointerup', onUp);
      cv.removeEventListener('pointercancel', onUp);
      // Ressourcen gezielt freigeben, den Kontext aber NICHT verwerfen: React hängt den Effekt
      // unter StrictMode (Dev, Client-Navigation) auf demselben Canvas erneut ein, und ein
      // verlorener Kontext käme von getContext() unverändert verloren zurück.
      for (const t of [scene, ...bloom]) {
        if (!t) continue;
        gl.deleteFramebuffer(t.fbo);
        gl.deleteTexture(t.tex);
      }
      gl.deleteTexture(dayTex);
      gl.deleteTexture(nightTex);
      gl.deleteBuffer(quadBuf);
      gl.deleteBuffer(netBuf);
      gl.deleteVertexArray(quadVao);
      gl.deleteVertexArray(netVao);
      for (const p of [pEarth, pNet, pDown, pBlur, pComp]) gl.deleteProgram(p);
    };
  }, []);

  if (unsupported) {
    return (
      <Globe
        activeChains={activeChains}
        points={points}
        focusPoint={focusPoint}
        onSelectPoint={onSelectPoint}
        className={className}
      />
    );
  }
  return <canvas ref={canvasRef} className={className} style={{ width: '100%', aspectRatio: '1 / 1' }} aria-hidden />;
}
