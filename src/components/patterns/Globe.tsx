'use client';

import { useEffect, useRef } from 'react';

/**
 * Realistische NASA-Erde (W3.5) — interaktiv wie ein Globus in der Hand:
 * – Textur-Mapping (Blue Marble Tag + Black Marble Nachtlichter, lokal)
 * – Drag-Rotation (Yaw+Pitch, Trägheit); Auto-Rotation nach Idle
 * – Nerven-Netz: Ketten-Standort = helles Licht; jeder verortete Beter =
 *   kleiner Punkt mit schwach glimmender Großkreis-Linie; läuft sein Gebet
 *   GERADE, pulsiert die Verbindung heller und ein Impuls wandert zum Gebetsort.
 * prefers-reduced-motion → statisch, keine Impulse. Fallback: blaue Kugel.
 */

const TEX_W = 1024;
const TEX_H = 512;

export interface ChainPoint {
  lat: number;
  lon: number;
  links?: { lat: number; lon: number; active: boolean }[];
}

// Fallback-Deko, falls (noch) keine Kette einen echten Standort hat.
const FALLBACK_POINTS: ChainPoint[] = [
  { lat: 52.5, lon: 13.4 }, { lat: 48.1, lon: 11.6 }, { lat: 51.5, lon: -0.1 },
  { lat: 40.7, lon: -74.0 }, { lat: -23.5, lon: -46.6 }, { lat: 6.5, lon: 3.4 },
  { lat: -1.3, lon: 36.8 }, { lat: 28.6, lon: 77.2 }, { lat: 14.6, lon: 121.0 },
  { lat: -33.9, lon: 151.2 },
];

// Sonnenstand „Morgenröte" (fix im Blickraum): Licht von rechts-vorn.
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

/** Sphärische Interpolation zwischen zwei Einheitsvektoren (Großkreis). */
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

/** Schnelles atan2 (max. Fehler ~0,005 rad ≈ 0,8 Texel bei 1024er Textur). */
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

export interface GlobeProps {
  activeChains: number;
  points?: ChainPoint[];
  className?: string;
}

export function Globe({ activeChains, points, className }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cv = canvas; // narrowed Alias für gehoistete Handler-Funktionen
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const size = Math.round(canvas.clientWidth * dpr);
    canvas.width = size;
    canvas.height = size;

    const R = size * 0.42;
    const cx = size / 2;
    const cy = size / 2;

    // ── Geometrie einmal vorberechnen (blickraum-fix) ─────────────────
    const bb = Math.ceil(R * 2 + 4);
    const bx0 = Math.floor(cx - R - 2);
    const by0 = Math.floor(cy - R - 2);
    const count = bb * bb;
    const vx = new Float32Array(count); // Einheitskugel-Vektor je Pixel
    const vy = new Float32Array(count);
    const vz = new Float32Array(count);
    const uBase = new Float32Array(count); // Längengrad (Texel) bei Pitch 0
    const rowOff = new Int32Array(count); // Textur-Zeile bei Pitch 0
    const lit = new Float32Array(count);
    const shade = new Float32Array(count);
    const rim = new Float32Array(count);
    const alpha = new Uint8ClampedArray(count);
    for (let py = 0; py < bb; py++) {
      for (let px = 0; px < bb; px++) {
        const i = py * bb + px;
        const dx = (bx0 + px - cx) / R;
        const dy = (by0 + py - cy) / R;
        const d2 = dx * dx + dy * dy;
        if (d2 > 1.004) {
          alpha[i] = 0;
          continue;
        }
        const d = Math.sqrt(d2);
        const z = Math.sqrt(Math.max(0, 1 - d2));
        const sx = dx;
        const sy = -dy;
        vx[i] = sx;
        vy[i] = sy;
        vz[i] = z;
        alpha[i] = d > 0.995 ? Math.max(0, Math.min(255, Math.round((1.002 - d) * R * 255 * 0.5))) : 255;
        rowOff[i] = Math.min(TEX_H - 1, Math.max(0, Math.round((0.5 - Math.asin(sy) / Math.PI) * TEX_H))) * TEX_W;
        uBase[i] = (fatan2(sx, z) / (2 * Math.PI) + 0.5) * TEX_W;
        const lambert = sx * SUN[0] + sy * SUN[1] + z * SUN[2];
        const t = Math.max(0, Math.min(1, (lambert + 0.14) / 0.28));
        lit[i] = t * t * (3 - 2 * t);
        shade[i] = 0.25 + 0.85 * Math.max(0, lambert);
        rim[i] = Math.pow(1 - z, 2.2);
      }
    }
    // asin-Lookup für den Pitch-Pfad
    const ASIN_N = 2048;
    const asinLut = new Float32Array(ASIN_N + 1);
    for (let i = 0; i <= ASIN_N; i++) asinLut[i] = Math.asin((i / ASIN_N) * 2 - 1);

    const earthCanvas = document.createElement('canvas');
    earthCanvas.width = bb;
    earthCanvas.height = bb;
    const earthCtx = earthCanvas.getContext('2d')!;
    const imgData = earthCtx.createImageData(bb, bb);
    const out = imgData.data;

    const stars = Array.from({ length: 110 }, (_, i) => ({
      x: ((i * 137.508) % 360) / 360,
      y: ((i * 76.31) % 97) / 97,
      s: (0.4 + ((i * 29) % 10) / 12) * dpr,
    }));

    const chainPts: ChainPoint[] =
      points && points.length > 0
        ? points
        : FALLBACK_POINTS.slice(0, Math.max(3, Math.min(FALLBACK_POINTS.length, activeChains)));

    // Bögen vorbereiten: Großkreis-Samples (leicht angehoben) je Link
    const ARC_N = 26;
    const arcs = chainPts.flatMap((p) => {
      const target = latLonToVec(p.lat, p.lon);
      return (p.links ?? []).map((l) => {
        const from = latLonToVec(l.lat, l.lon);
        const pts: [number, number, number][] = [];
        for (let k = 0; k <= ARC_N; k++) {
          const t = k / ARC_N;
          const v = slerp(from, target, t);
          const lift = 1 + 0.07 * Math.sin(Math.PI * t); // Bogen hebt sich von der Oberfläche
          pts.push([v[0] * lift, v[1] * lift, v[2] * lift]);
        }
        return { pts, active: l.active, from };
      });
    });

    // ── Interaktion: Drag (Yaw+Pitch) mit Trägheit, Auto-Rotation bei Idle ──
    let yaw = 0; // Grad
    let pitch = 0; // Grad, geklemmt
    let yawVel = 0;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let lastInteraction = -Infinity;
    const AUTO_DEG_S = 360 / 120;

    function onDown(e: PointerEvent) {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      lastInteraction = performance.now();
      cv.setPointerCapture(e.pointerId);
      cv.style.cursor = 'grabbing';
    }
    function onMove(e: PointerEvent) {
      if (!dragging) return;
      const k = 0.35 / dpr; // Grad pro CSS-Pixel
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      yaw -= dx * k * dpr;
      pitch = Math.max(-60, Math.min(60, pitch + dy * k * dpr));
      yawVel = -dx * k * dpr;
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
    }
    cv.style.cursor = 'grab';
    cv.style.touchAction = 'none'; // Touch-Drag ohne Seiten-Scroll
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);

    // ── Render ────────────────────────────────────────────────────────
    let day: Uint8ClampedArray | null = null;
    let night: Uint8ClampedArray | null = null;
    let raf = 0;
    let last = 0;
    let prev = 0;
    const t0 = performance.now();

    function texAt(i: number, shift: number, cosP: number, sinP: number, usePitch: boolean): number {
      if (!usePitch) {
        let u = uBase[i] + shift;
        if (u >= TEX_W) u -= TEX_W;
        else if (u < 0) u += TEX_W;
        return (rowOff[i] + (u | 0)) * 4;
      }
      // Pitch: Blickvektor um X zurückdrehen, dann wie gehabt mappen
      const y = vy[i] * cosP - vz[i] * sinP;
      const zz = vy[i] * sinP + vz[i] * cosP;
      const row = Math.min(
        TEX_H - 1,
        Math.max(0, Math.round((0.5 - asinLut[Math.round(((y + 1) / 2) * ASIN_N)] / Math.PI) * TEX_H)),
      ) * TEX_W;
      let u = (fatan2(vx[i], zz) / (2 * Math.PI) + 0.5) * TEX_W + shift;
      u %= TEX_W;
      if (u < 0) u += TEX_W;
      return (row + (u | 0)) * 4;
    }

    function drawEarth(yawDeg: number, pitchDeg: number) {
      if (!day || !night) return;
      const shift = ((((yawDeg / 360) * TEX_W) % TEX_W) + TEX_W) % TEX_W;
      const usePitch = Math.abs(pitchDeg) > 0.05;
      const pr = (pitchDeg * Math.PI) / 180;
      const cosP = Math.cos(pr);
      const sinP = Math.sin(pr);
      for (let i = 0; i < count; i++) {
        const o = i * 4;
        const a = alpha[i];
        if (a === 0) {
          out[o + 3] = 0;
          continue;
        }
        const ti = texAt(i, shift, cosP, sinP, usePitch);
        const L = lit[i];
        const s = shade[i] * L;
        const nGain = (1 - L) * 1.55;
        const rm = rim[i];
        out[o] = day[ti] * s + night[ti] * nGain + rm * 45;
        out[o + 1] = day[ti + 1] * s + night[ti + 1] * nGain + rm * 70;
        out[o + 2] = day[ti + 2] * s + night[ti + 2] * nGain + rm * 130;
        out[o + 3] = a;
      }
      earthCtx.putImageData(imgData, 0, 0);
    }

    /** Welt-Vektor → Bildschirm (mit Yaw um Y, dann Pitch um X). */
    function proj(v: [number, number, number], yawDeg: number, pitchDeg: number) {
      const ya = ((-yawDeg) * Math.PI) / 180;
      const cy1 = Math.cos(ya);
      const sy1 = Math.sin(ya);
      const x1 = v[0] * cy1 + v[2] * sy1;
      const z1 = -v[0] * sy1 + v[2] * cy1;
      const pa = (pitchDeg * Math.PI) / 180;
      const cp = Math.cos(pa);
      const sp = Math.sin(pa);
      const y2 = v[1] * cp + z1 * sp;
      const z2 = -v[1] * sp + z1 * cp;
      return { x: cx + R * x1, y: cy - R * y2, z: z2 };
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

      // Bewegung: Drag > Trägheit > Auto-Rotation (nach 4 s Idle)
      if (!dragging) {
        if (Math.abs(yawVel) > 0.02) {
          yaw += yawVel;
          yawVel *= 0.94;
        } else if (!reduced && now - lastInteraction > 4000) {
          yaw += AUTO_DEG_S * dt * 60 * (1 / 60);
        }
      }
      const pulse = reduced ? 1 : 0.75 + 0.25 * Math.sin((now - t0) / 600);

      ctx.clearRect(0, 0, size, size);

      // Sterne
      for (const st of stars) {
        const sx = st.x * size;
        const sy = st.y * size;
        if (Math.hypot(sx - cx, sy - cy) < R + 4 * dpr) continue;
        ctx.globalAlpha = 0.2 + 0.3 * (st.s / dpr);
        ctx.fillStyle = 'rgb(226, 232, 255)';
        ctx.beginPath();
        ctx.arc(sx, sy, st.s * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Atmosphäre + Morgenröte
      const glow = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.18);
      glow.addColorStop(0, 'rgba(96, 140, 235, 0.22)');
      glow.addColorStop(1, 'rgba(96, 140, 235, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.09, 0, Math.PI * 2);
      ctx.clip();
      const dawn = ctx.createRadialGradient(cx + R * 0.9, cy - R * 0.2, 0, cx + R * 0.9, cy - R * 0.2, R * 0.95);
      dawn.addColorStop(0, 'rgba(255, 176, 84, 0.4)');
      dawn.addColorStop(1, 'rgba(255, 176, 84, 0)');
      ctx.fillStyle = dawn;
      ctx.fillRect(0, 0, size, size);
      ctx.restore();

      drawEarth(yaw, pitch);
      ctx.drawImage(earthCanvas, bx0, by0);

      // ── Nerven-Netz: Bögen Beter → Gebetsort ──
      for (const arc of arcs) {
        const alphaLine = arc.active ? 0.5 : 0.16;
        ctx.lineWidth = (arc.active ? 1.6 : 1) * dpr;
        ctx.strokeStyle = `rgba(255, 214, 110, ${alphaLine})`;
        ctx.beginPath();
        let pen = false;
        const screen: { x: number; y: number; z: number }[] = [];
        for (const v of arc.pts) {
          const p = proj(v, yaw, pitch);
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

        // Impuls: wandert bei aktivem Gebet vom Beter zum Gebetsort (wie ein Nerven-Signal)
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

        // Beter-Punkt (klein, pulsierend; aktiv = heller)
        const bp = proj(arc.pts[0], yaw, pitch);
        if (bp.z > 0.05) {
          const bAlpha = (arc.active ? 0.95 : 0.55) * pulse;
          ctx.fillStyle = `rgba(255, 226, 150, ${bAlpha})`;
          ctx.beginPath();
          ctx.arc(bp.x, bp.y, (arc.active ? 1.8 : 1.3) * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Ketten-Standorte (helles Licht)
      for (const p of chainPts) {
        const sp = proj(latLonToVec(p.lat, p.lon), yaw, pitch);
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
      }

      if (!reduced || dragging) raf = requestAnimationFrame(frame);
      else raf = requestAnimationFrame(frameIdleReduced);
    }

    // reduced-motion: nur bei Interaktion neu zeichnen
    function frameIdleReduced(now: number) {
      if (dragging || Math.abs(yawVel) > 0.02) frame(now);
      else raf = requestAnimationFrame(frameIdleReduced);
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
        const sphere = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.45, R * 0.1, cx, cy, R);
        sphere.addColorStop(0, 'rgb(40, 56, 110)');
        sphere.addColorStop(1, 'rgb(13, 17, 36)');
        ctx.fillStyle = sphere;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.fill();
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
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
