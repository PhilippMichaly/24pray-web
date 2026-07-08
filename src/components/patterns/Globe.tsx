'use client';

import { useEffect, useRef } from 'react';

/**
 * Interaktive NASA-Erde (W3.5/W3.7):
 * – Textur-Mapping (Blue/Black Marble 2048px, lokal), Drag-Rotation mit Trägheit,
 *   Auto-Rotation nach Idle
 * – Nerven-Netz: Ketten-Licht + Beter-Punkte mit Großkreis-Linien; aktive Gebete
 *   pulsieren heller, ein Gold-Impuls wandert zum Gebetsort
 * – Fokus-Flug: Klick auf ein Licht → Globus fliegt hin (Rotation + Zoom 1.8×),
 *   Geometrie wird nach der Landung scharf nachgerechnet. Klick ins Leere → zurück.
 * prefers-reduced-motion → statisch, Flüge springen. Fallback ohne Texturen: blaue Kugel.
 */

const TEX_W = 2048;
const TEX_H = 1024;
const FOCUS_ZOOM = 1.8;

export interface ChainPoint {
  lat: number;
  lon: number;
  id?: string; // nur PUBLIC-Ketten (W3.7)
  title?: string;
  locationName?: string | null;
  links?: { lat: number; lon: number; active: boolean }[];
}

const FALLBACK_POINTS: ChainPoint[] = [
  { lat: 52.5, lon: 13.4 }, { lat: 48.1, lon: 11.6 }, { lat: 51.5, lon: -0.1 },
  { lat: 40.7, lon: -74.0 }, { lat: -23.5, lon: -46.6 }, { lat: 6.5, lon: 3.4 },
  { lat: -1.3, lon: 36.8 }, { lat: 28.6, lon: 77.2 }, { lat: 14.6, lon: 121.0 },
  { lat: -33.9, lon: 151.2 },
];

const SUN: [number, number, number] = normalize([0.82, 0.2, 0.52]);

function normalize(v: [number, number, number]): [number, number, number] {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
}

function latLonToVec(latDeg: number, lonDeg: number): [number, number, number] {
  const lat = (latDeg * Math.PI) / 180;
  const lon = (lonDeg * Math.PI) / 180;
  return [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
}

function slerp(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  dot = Math.min(1, Math.max(-1, dot));
  const th = Math.acos(dot);
  if (th < 1e-4) return a;
  const s = Math.sin(th);
  const w1 = Math.sin((1 - t) * th) / s;
  const w2 = Math.sin(t * th) / s;
  return [a[0] * w1 + b[0] * w2, a[1] * w1 + b[1] * w2, a[2] * w1 + b[2] * w2];
}

/** Schnelles atan2 (max. Fehler ~0,005 rad ≈ 1,6 Texel bei 2048er Textur). */
function fatan2(y: number, x: number): number {
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  const mx = ax > ay ? ax : ay;
  const mn = ax > ay ? ay : ax;
  const a = mn / (mx || 1e-9);
  const s = a * a;
  let r = ((-0.0464964749 * s + 0.15931422) * s - 0.327622764) * s * a + a;
  if (ay > ax) r = 1.5707963 - r;
  if (x < 0) r = 3.1415927 - r;
  return y < 0 ? -r : r;
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

async function loadTexture(src: string): Promise<Uint8ClampedArray> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = TEX_W;
  c.height = TEX_H;
  const cx = c.getContext('2d')!;
  cx.drawImage(img, 0, 0, TEX_W, TEX_H);
  return cx.getImageData(0, 0, TEX_W, TEX_H).data;
}

interface Geometry {
  R: number;
  bb: number;
  bx0: number;
  by0: number;
  count: number;
  vx: Float32Array;
  vy: Float32Array;
  vz: Float32Array;
  uBase: Float32Array;
  rowOff: Int32Array;
  lit: Float32Array;
  shade: Float32Array;
  rim: Float32Array;
  alpha: Uint8ClampedArray;
  earthCanvas: HTMLCanvasElement;
  earthCtx: CanvasRenderingContext2D;
  imgData: ImageData;
}

function buildGeometry(size: number, R: number): Geometry {
  const cx = size / 2;
  const cy = size / 2;
  const bb = Math.ceil(R * 2 + 4);
  const bx0 = Math.floor(cx - R - 2);
  const by0 = Math.floor(cy - R - 2);
  const count = bb * bb;
  const g: Geometry = {
    R, bb, bx0, by0, count,
    vx: new Float32Array(count), vy: new Float32Array(count), vz: new Float32Array(count),
    uBase: new Float32Array(count), rowOff: new Int32Array(count),
    lit: new Float32Array(count), shade: new Float32Array(count), rim: new Float32Array(count),
    alpha: new Uint8ClampedArray(count),
    earthCanvas: document.createElement('canvas'),
    earthCtx: null as unknown as CanvasRenderingContext2D,
    imgData: null as unknown as ImageData,
  };
  g.earthCanvas.width = bb;
  g.earthCanvas.height = bb;
  g.earthCtx = g.earthCanvas.getContext('2d')!;
  g.imgData = g.earthCtx.createImageData(bb, bb);
  for (let py = 0; py < bb; py++) {
    for (let px = 0; px < bb; px++) {
      const i = py * bb + px;
      const dx = (bx0 + px - cx) / R;
      const dy = (by0 + py - cy) / R;
      const d2 = dx * dx + dy * dy;
      if (d2 > 1.004) {
        g.alpha[i] = 0;
        continue;
      }
      const d = Math.sqrt(d2);
      const z = Math.sqrt(Math.max(0, 1 - d2));
      const sx = dx;
      const sy = -dy;
      g.vx[i] = sx;
      g.vy[i] = sy;
      g.vz[i] = z;
      g.alpha[i] = d > 0.995 ? Math.max(0, Math.min(255, Math.round((1.002 - d) * R * 255 * 0.5))) : 255;
      g.rowOff[i] = Math.min(TEX_H - 1, Math.max(0, Math.round((0.5 - Math.asin(sy) / Math.PI) * TEX_H))) * TEX_W;
      g.uBase[i] = (fatan2(sx, z) / (2 * Math.PI) + 0.5) * TEX_W;
      const lambert = sx * SUN[0] + sy * SUN[1] + z * SUN[2];
      const t = Math.max(0, Math.min(1, (lambert + 0.14) / 0.28));
      g.lit[i] = t * t * (3 - 2 * t);
      g.shade[i] = 0.25 + 0.85 * Math.max(0, lambert);
      g.rim[i] = Math.pow(1 - z, 2.2);
    }
  }
  return g;
}

export interface GlobeProps {
  activeChains: number;
  points?: ChainPoint[];
  focusPoint?: ChainPoint | null; // controlled: Flugziel (W3.7)
  onSelectPoint?: (p: ChainPoint | null) => void;
  className?: string;
}

export function Globe({ activeChains, points, focusPoint, onSelectPoint, className }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const focusRef = useRef<{ point: ChainPoint | null; dirty: boolean }>({ point: null, dirty: false });
  const selectRef = useRef<GlobeProps['onSelectPoint']>(onSelectPoint);
  selectRef.current = onSelectPoint;

  // controlled focusPoint → Flug im Render-Loop anstoßen (ohne den Haupt-Effect neu zu starten)
  useEffect(() => {
    focusRef.current = { point: focusPoint ?? null, dirty: true };
  }, [focusPoint]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cv = canvas;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const size = Math.round(canvas.clientWidth * dpr);
    canvas.width = size;
    canvas.height = size;

    const baseR = size * 0.42;
    const cx = size / 2;
    const cy = size / 2;

    let geom = buildGeometry(size, baseR);
    let geomZoom = 1;

    const ASIN_N = 2048;
    const asinLut = new Float32Array(ASIN_N + 1);
    for (let i = 0; i <= ASIN_N; i++) asinLut[i] = Math.asin((i / ASIN_N) * 2 - 1);

    const stars = Array.from({ length: 110 }, (_, i) => ({
      x: ((i * 137.508) % 360) / 360,
      y: ((i * 76.31) % 97) / 97,
      s: (0.4 + ((i * 29) % 10) / 12) * dpr,
    }));

    const chainPts: ChainPoint[] =
      points && points.length > 0
        ? points
        : FALLBACK_POINTS.slice(0, Math.max(3, Math.min(FALLBACK_POINTS.length, activeChains)));

    const ARC_N = 26;
    const arcs = chainPts.flatMap((p) => {
      const target = latLonToVec(p.lat, p.lon);
      return (p.links ?? []).map((l) => {
        const from = latLonToVec(l.lat, l.lon);
        const pts: [number, number, number][] = [];
        for (let k = 0; k <= ARC_N; k++) {
          const t = k / ARC_N;
          const v = slerp(from, target, t);
          const lift = 1 + 0.07 * Math.sin(Math.PI * t);
          pts.push([v[0] * lift, v[1] * lift, v[2] * lift]);
        }
        return { pts, active: l.active };
      });
    });

    // ── Zustand: Rotation, Zoom, Flug, Interaktion ──
    let yaw = 0;
    let pitch = 0;
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
      fromYaw: number; toYaw: number; fromPitch: number; toPitch: number;
      fromZoom: number; toZoom: number;
    } | null = null;
    const AUTO_DEG_S = 360 / 120;

    /** Welt-Vektor → Bildschirm mit effektivem Radius. */
    function proj(v: [number, number, number], effR: number) {
      const ya = ((-yaw) * Math.PI) / 180;
      const cy1 = Math.cos(ya);
      const sy1 = Math.sin(ya);
      const x1 = v[0] * cy1 + v[2] * sy1;
      const z1 = -v[0] * sy1 + v[2] * cy1;
      const pa = (pitch * Math.PI) / 180;
      const cp = Math.cos(pa);
      const sp = Math.sin(pa);
      const y2 = v[1] * cp + z1 * sp;
      const z2 = -v[1] * sp + z1 * cp;
      return { x: cx + effR * x1, y: cy - effR * y2, z: z2 };
    }

    function startFlight(toYaw: number, toPitch: number, toZoom: number) {
      // kürzester Yaw-Weg
      const dYaw = ((toYaw - yaw + 540) % 360) - 180;
      if (reduced) {
        yaw += dYaw;
        pitch = toPitch;
        zoom = toZoom;
        rebuildForZoom();
        return;
      }
      flight = {
        start: performance.now(), dur: 1100,
        fromYaw: yaw, toYaw: yaw + dYaw,
        fromPitch: pitch, toPitch,
        fromZoom: zoom, toZoom,
      };
    }

    function rebuildForZoom() {
      if (Math.abs(zoom - geomZoom) < 0.01) return;
      geom = buildGeometry(size, baseR * zoom);
      geomZoom = zoom;
    }

    function handleFocusChange() {
      if (!focusRef.current.dirty) return;
      focusRef.current.dirty = false;
      const p = focusRef.current.point;
      if (p) {
        startFlight(p.lon, Math.max(-60, Math.min(60, -p.lat)), FOCUS_ZOOM);
      } else {
        startFlight(yaw, Math.max(-60, Math.min(60, pitch)), 1);
      }
    }

    // ── Interaktion ──
    function onDown(e: PointerEvent) {
      dragging = true;
      moved = false;
      downX = lastX = e.clientX;
      downY = lastY = e.clientY;
      lastInteraction = performance.now();
      cv.setPointerCapture(e.pointerId);
      cv.style.cursor = 'grabbing';
    }
    function onMove(e: PointerEvent) {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 6) {
        moved = true;
        flight = null; // Drag übersteuert einen laufenden Flug
      }
      if (moved) {
        const k = 0.35 / zoom; // gezoomt = feinfühliger
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
        cv.releasePointerCapture(e.pointerId);
      } catch {
        /* schon released */
      }
      cv.style.cursor = 'grab';
      if (moved) return;
      // Klick (kein Drag): Hit-Test auf Ketten-Lichter
      const rect = cv.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * size;
      const py = ((e.clientY - rect.top) / rect.height) * size;
      const effR = baseR * zoom;
      let hit: ChainPoint | null = null;
      let best = 18 * dpr;
      for (const p of chainPts) {
        const sp = proj(latLonToVec(p.lat, p.lon), effR);
        if (sp.z <= 0.05) continue;
        const d = Math.hypot(sp.x - px, sp.y - py);
        if (d < best) {
          best = d;
          hit = p;
        }
      }
      selectRef.current?.(hit);
    }
    cv.style.cursor = 'grab';
    cv.style.touchAction = 'none';
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onUp);

    // ── Render ──
    let day: Uint8ClampedArray | null = null;
    let night: Uint8ClampedArray | null = null;
    let raf = 0;
    let last = 0;
    let prev = 0;
    const t0 = performance.now();

    function texAt(g: Geometry, i: number, shift: number, cosP: number, sinP: number, usePitch: boolean): number {
      if (!usePitch) {
        let u = g.uBase[i] + shift;
        if (u >= TEX_W) u -= TEX_W;
        else if (u < 0) u += TEX_W;
        return (g.rowOff[i] + (u | 0)) * 4;
      }
      const y = g.vy[i] * cosP - g.vz[i] * sinP;
      const zz = g.vy[i] * sinP + g.vz[i] * cosP;
      const row = Math.min(
        TEX_H - 1,
        Math.max(0, Math.round((0.5 - asinLut[Math.round(((y + 1) / 2) * ASIN_N)] / Math.PI) * TEX_H)),
      ) * TEX_W;
      let u = (fatan2(g.vx[i], zz) / (2 * Math.PI) + 0.5) * TEX_W + shift;
      u %= TEX_W;
      if (u < 0) u += TEX_W;
      return (row + (u | 0)) * 4;
    }

    // Dirty-Cache: Erd-Buffer nur neu rechnen, wenn sich Blickwinkel/Geometrie änderten
    let drawnYaw = NaN;
    let drawnPitch = NaN;
    let drawnGeom: Geometry | null = null;

    function drawEarth(g: Geometry) {
      if (!day || !night) return;
      if (drawnGeom === g && Math.abs(drawnYaw - yaw) < 0.02 && Math.abs(drawnPitch - pitch) < 0.02) return;
      drawnYaw = yaw;
      drawnPitch = pitch;
      drawnGeom = g;
      const shift = ((((yaw / 360) * TEX_W) % TEX_W) + TEX_W) % TEX_W;
      const usePitch = Math.abs(pitch) > 0.05;
      const pr = (pitch * Math.PI) / 180;
      const cosP = Math.cos(pr);
      const sinP = Math.sin(pr);
      const out = g.imgData.data;
      for (let i = 0; i < g.count; i++) {
        const o = i * 4;
        const a = g.alpha[i];
        if (a === 0) {
          out[o + 3] = 0;
          continue;
        }
        const ti = texAt(g, i, shift, cosP, sinP, usePitch);
        const L = g.lit[i];
        const s = g.shade[i] * L;
        const nGain = (1 - L) * 1.55;
        const rm = g.rim[i];
        out[o] = day[ti] * s + night[ti] * nGain + rm * 45;
        out[o + 1] = day[ti + 1] * s + night[ti + 1] * nGain + rm * 70;
        out[o + 2] = day[ti + 2] * s + night[ti + 2] * nGain + rm * 130;
        out[o + 3] = a;
      }
      g.earthCtx.putImageData(g.imgData, 0, 0);
    }

    function frame(now: number) {
      if (!ctx) return;
      if (!reduced && now - last < 33) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const dt = Math.min(0.1, (now - (prev || now)) / 1000);
      prev = now;
      last = now;

      handleFocusChange();

      // Flug
      if (flight) {
        const t = Math.min(1, (now - flight.start) / flight.dur);
        const e = easeInOut(t);
        yaw = flight.fromYaw + (flight.toYaw - flight.fromYaw) * e;
        pitch = flight.fromPitch + (flight.toPitch - flight.fromPitch) * e;
        zoom = flight.fromZoom + (flight.toZoom - flight.fromZoom) * e;
        if (t >= 1) {
          flight = null;
          rebuildForZoom(); // scharf nachrechnen an der Zielposition
        }
      } else if (!dragging) {
        if (Math.abs(yawVel) > 0.02) {
          yaw += yawVel;
          yawVel *= 0.94;
        } else if (!reduced && now - lastInteraction > 4000 && zoom === 1 && !focusRef.current.point) {
          yaw += AUTO_DEG_S * dt;
        }
      }

      const effR = baseR * zoom;
      const pulse = reduced ? 1 : 0.75 + 0.25 * Math.sin((now - t0) / 600);

      ctx.clearRect(0, 0, size, size);

      // Sterne (beim Zoom ausgeblendet — wir sind „näher dran")
      if (zoom < 1.15) {
        for (const st of stars) {
          const sx = st.x * size;
          const sy = st.y * size;
          if (Math.hypot(sx - cx, sy - cy) < effR + 4 * dpr) continue;
          ctx.globalAlpha = (0.2 + 0.3 * (st.s / dpr)) * (1.15 - zoom) * 6.6;
          ctx.fillStyle = 'rgb(226, 232, 255)';
          ctx.beginPath();
          ctx.arc(sx, sy, st.s * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // Atmosphäre + Morgenröte
      const glow = ctx.createRadialGradient(cx, cy, effR * 0.92, cx, cy, effR * 1.18);
      glow.addColorStop(0, 'rgba(96, 140, 235, 0.22)');
      glow.addColorStop(1, 'rgba(96, 140, 235, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, effR * 1.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, effR * 1.09, 0, Math.PI * 2);
      ctx.clip();
      const dawn = ctx.createRadialGradient(cx + effR * 0.9, cy - effR * 0.2, 0, cx + effR * 0.9, cy - effR * 0.2, effR * 0.95);
      dawn.addColorStop(0, 'rgba(255, 176, 84, 0.4)');
      dawn.addColorStop(1, 'rgba(255, 176, 84, 0)');
      ctx.fillStyle = dawn;
      ctx.fillRect(0, 0, size, size);
      ctx.restore();

      // Erde: Geometrie rendern; weicht der Ziel-Zoom ab → skaliert zeichnen (Flugphase)
      drawEarth(geom);
      const scale = zoom / geomZoom;
      if (Math.abs(scale - 1) < 0.005) {
        ctx.drawImage(geom.earthCanvas, geom.bx0, geom.by0);
      } else {
        const w = geom.bb * scale;
        const gx = cx - (cx - geom.bx0) * scale;
        const gy = cy - (cy - geom.by0) * scale;
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(geom.earthCanvas, gx, gy, w, w);
      }

      // Nerven-Netz
      for (const arc of arcs) {
        const alphaLine = arc.active ? 0.5 : 0.16;
        ctx.lineWidth = (arc.active ? 1.6 : 1) * dpr;
        ctx.strokeStyle = `rgba(255, 214, 110, ${alphaLine})`;
        ctx.beginPath();
        let pen = false;
        const screen: { x: number; y: number; z: number }[] = [];
        for (const v of arc.pts) {
          const p = proj(v, effR);
          screen.push(p);
          if (p.z > 0.03) {
            if (pen) ctx.lineTo(p.x, p.y);
            else {
              ctx.moveTo(p.x, p.y);
              pen = true;
            }
          } else pen = false;
        }
        ctx.stroke();

        if (arc.active && !reduced) {
          const tPos = ((now - t0) / 1400) % 1;
          const idx = Math.min(arc.pts.length - 1, Math.round(tPos * ARC_N));
          const p = screen[idx];
          if (p && p.z > 0.03) {
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 6 * dpr);
            g.addColorStop(0, 'rgba(255, 236, 170, 0.95)');
            g.addColorStop(1, 'rgba(255, 236, 170, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6 * dpr, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        const bp = proj(arc.pts[0], effR);
        if (bp.z > 0.05) {
          const bAlpha = (arc.active ? 0.95 : 0.55) * pulse;
          ctx.fillStyle = `rgba(255, 226, 150, ${bAlpha})`;
          ctx.beginPath();
          ctx.arc(bp.x, bp.y, (arc.active ? 1.8 : 1.3) * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Ketten-Lichter (klickbar; fokussiertes Licht bekommt einen Ring)
      const focused = focusRef.current.point;
      for (const p of chainPts) {
        const sp = proj(latLonToVec(p.lat, p.lon), effR);
        if (sp.z <= 0.06) continue;
        const anyActive = (p.links ?? []).some((l) => l.active);
        const rad = (anyActive ? 12 : 9) * dpr * pulse;
        const g = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, rad);
        g.addColorStop(0, `rgba(255, 205, 80, ${0.9 * Math.min(1, sp.z * 2)})`);
        g.addColorStop(1, 'rgba(255, 205, 80, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 232, 150, 1)';
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 2.1 * dpr, 0, Math.PI * 2);
        ctx.fill();
        if (focused && focused.lat === p.lat && focused.lon === p.lon) {
          ctx.strokeStyle = 'rgba(255, 232, 150, 0.8)';
          ctx.lineWidth = 1.5 * dpr;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, 7 * dpr + 1.5 * dpr * pulse, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      raf = requestAnimationFrame(frame);
    }

    let cancelled = false;
    Promise.all([loadTexture('/earth/day.jpg'), loadTexture('/earth/night.jpg')])
      .then(([d, n]) => {
        if (cancelled) return;
        day = d;
        night = n;
        raf = requestAnimationFrame(frame);
      })
      .catch(() => {
        if (cancelled || !ctx) return;
        const sphere = ctx.createRadialGradient(cx - baseR * 0.4, cy - baseR * 0.45, baseR * 0.1, cx, cy, baseR);
        sphere.addColorStop(0, 'rgb(40, 56, 110)');
        sphere.addColorStop(1, 'rgb(13, 17, 36)');
        ctx.fillStyle = sphere;
        ctx.beginPath();
        ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
        ctx.fill();
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      cv.removeEventListener('pointerdown', onDown);
      cv.removeEventListener('pointermove', onMove);
      cv.removeEventListener('pointerup', onUp);
      cv.removeEventListener('pointercancel', onUp);
    };
  }, [activeChains, points]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', aspectRatio: '1 / 1' }}
      aria-hidden
    />
  );
}
