'use client';

import { useEffect, useRef } from 'react';

/**
 * Realistische Erde (Landing-Signature, W3.1) — echte NASA-Texturen:
 * Blue Marble (Tag) + Black Marble (Nachtlichter), public domain, lokal unter
 * /earth/*.jpg. Canvas-Pixel-Mapping (orthografische Projektion), fester
 * Morgenröte-Sonnenstand mit weichem Terminator; auf der Nachtseite leuchten
 * die echten Stadtlichter. Geometrie wird einmal vorberechnet, pro Frame
 * rotiert nur der Längengrad (kein WebGL, keine Dependency).
 * prefers-reduced-motion → statisches Bild. Fallback ohne Texturen: blaue Kugel.
 */

const TEX_W = 1024;
const TEX_H = 512;

// Fallback-Deko, falls (noch) keine Kette einen echten Standort hat (W3.4).
const FALLBACK_POINTS: [number, number][] = [
  [52.5, 13.4], [48.1, 11.6], [51.5, -0.1], [40.7, -74.0], [-23.5, -46.6],
  [6.5, 3.4], [-1.3, 36.8], [28.6, 77.2], [14.6, 121.0], [-33.9, 151.2],
];

// Sonnenstand „Morgenröte": Licht kommt von rechts-vorn (Osten), leicht erhöht.
const SUN = normalize([0.82, 0.2, 0.52]);

function normalize(v: [number, number, number]): [number, number, number] {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
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
  activeChains: number; // echte Anzahl laufender Ketten (für Fallback-Punktzahl)
  points?: { lat: number; lon: number }[]; // echte Standorte aktiver Ketten (W3.4)
  className?: string;
}

export function Globe({ activeChains, points, className }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const cssSize = canvas.clientWidth;
    const size = Math.round(cssSize * dpr);
    canvas.width = size;
    canvas.height = size;

    const R = size * 0.42;
    const cx = size / 2;
    const cy = size / 2;

    // ── Geometrie einmal vorberechnen ────────────────────────────────
    // Bounding-Box der Kugel; pro Pixel: Textur-Zeile, Längengrad-Basis,
    // Tag/Nacht-Blend (weicher Terminator), Beleuchtung, Atmosphären-Rim.
    const bb = Math.ceil(R * 2 + 4);
    const bx0 = Math.floor(cx - R - 2);
    const by0 = Math.floor(cy - R - 2);
    const count = bb * bb;
    const rowOff = new Int32Array(count); // Textur-Zeilenoffset (v * TEX_W)
    const uBase = new Float32Array(count); // Längengrad-Basis in Texel
    const lit = new Float32Array(count); // 0 = Nacht … 1 = Tag
    const shade = new Float32Array(count); // Helligkeit Tagseite
    const rim = new Float32Array(count); // Atmosphäre am Rand
    const alpha = new Uint8ClampedArray(count); // Kanten-AA
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
        // Kanten-Antialiasing
        alpha[i] = d > 0.995 ? Math.max(0, Math.min(255, Math.round((1.002 - d) * R * 255 * 0.5))) : 255;
        const lat = Math.asin(sy);
        const lon = Math.atan2(sx, z);
        rowOff[i] = Math.min(TEX_H - 1, Math.max(0, Math.round((0.5 - lat / Math.PI) * TEX_H))) * TEX_W;
        uBase[i] = (lon / (2 * Math.PI) + 0.5) * TEX_W;
        const lambert = sx * SUN[0] + sy * SUN[1] + z * SUN[2];
        // weicher Terminator (±0.14), Nachtseite nicht ganz schwarz
        const t = Math.max(0, Math.min(1, (lambert + 0.14) / 0.28));
        lit[i] = t * t * (3 - 2 * t); // smoothstep
        shade[i] = 0.25 + 0.85 * Math.max(0, lambert);
        rim[i] = Math.pow(1 - z, 2.2);
      }
    }

    const earthCanvas = document.createElement('canvas');
    earthCanvas.width = bb;
    earthCanvas.height = bb;
    const earthCtx = earthCanvas.getContext('2d')!;
    const imgData = earthCtx.createImageData(bb, bb);
    const out = imgData.data;

    // Sterne (deterministisch, dezent)
    const stars = Array.from({ length: 110 }, (_, i) => ({
      x: ((i * 137.508) % 360) / 360,
      y: ((i * 76.31) % 97) / 97,
      s: (0.4 + ((i * 29) % 10) / 12) * dpr,
    }));

    // Echte Standorte, wenn vorhanden — sonst Deko-Fallback in Ketten-Anzahl.
    const chainPts: [number, number][] =
      points && points.length > 0
        ? points.map((p) => [p.lat, p.lon] as [number, number])
        : FALLBACK_POINTS.slice(0, Math.max(3, Math.min(FALLBACK_POINTS.length, activeChains)));

    let day: Uint8ClampedArray | null = null;
    let night: Uint8ClampedArray | null = null;
    let raf = 0;
    let last = 0;
    const t0 = performance.now();

    function drawEarth(rotDeg: number) {
      if (!day || !night) return;
      const shift = ((rotDeg / 360) * TEX_W) % TEX_W;
      for (let i = 0; i < count; i++) {
        const o = i * 4;
        const a = alpha[i];
        if (a === 0) {
          out[o + 3] = 0;
          continue;
        }
        let u = uBase[i] + shift;
        if (u >= TEX_W) u -= TEX_W;
        const ti = (rowOff[i] + (u | 0)) * 4;
        const L = lit[i];
        const s = shade[i] * L;
        const nGain = (1 - L) * 1.55; // Stadtlichter nur im Dunkeln
        const rm = rim[i];
        // Tag * Beleuchtung + Nachtlichter + blauer Atmosphären-Saum
        out[o] = day[ti] * s + night[ti] * nGain + rm * 45;
        out[o + 1] = day[ti + 1] * s + night[ti + 1] * nGain + rm * 70;
        out[o + 2] = day[ti + 2] * s + night[ti + 2] * nGain + rm * 130;
        out[o + 3] = a;
      }
      earthCtx.putImageData(imgData, 0, 0);
    }

    function project(latDeg: number, lonDeg: number, rotDeg: number) {
      const lat = (latDeg * Math.PI) / 180;
      const lon = ((lonDeg - rotDeg) * Math.PI) / 180;
      const x = Math.cos(lat) * Math.sin(lon);
      const y = Math.sin(lat);
      const z = Math.cos(lat) * Math.cos(lon);
      return { x: cx + R * x, y: cy - R * y, z, sx: x, sy: y };
    }

    function frame(now: number) {
      if (!ctx) return;
      // ~30 fps reichen für die langsame Rotation (Akku)
      if (!reduced && now - last < 33) {
        raf = requestAnimationFrame(frame);
        return;
      }
      last = now;
      const rot = reduced ? 55 : (((now - t0) / 1000) * (360 / 120)) % 360; // 120 s/Umdrehung
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

      // Atmosphären-Glow außen + Morgenröte an der Sonnenkante
      const glow = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.18);
      glow.addColorStop(0, 'rgba(96, 140, 235, 0.22)');
      glow.addColorStop(1, 'rgba(96, 140, 235, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.18, 0, Math.PI * 2);
      ctx.fill();
      const dawn = ctx.createRadialGradient(cx + R * 0.92, cy - R * 0.22, 0, cx + R * 0.92, cy - R * 0.22, R * 0.8);
      dawn.addColorStop(0, 'rgba(255, 176, 84, 0.3)');
      dawn.addColorStop(1, 'rgba(255, 176, 84, 0)');
      ctx.fillStyle = dawn;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.18, 0, Math.PI * 2);
      ctx.fill();

      // Erde
      drawEarth(rot);
      ctx.drawImage(earthCanvas, bx0, by0);

      // Gebetsketten-Punkte (Gold; auf der Nachtseite strahlen sie stärker)
      for (const [plat, plon] of chainPts) {
        const p = project(plat, plon, rot);
        if (p.z <= 0.06) continue;
        const lambert = p.sx * SUN[0] + p.sy * SUN[1] + p.z * SUN[2];
        const nightBoost = lambert < 0 ? 1.45 : 1;
        const rad = 9 * dpr * pulse * nightBoost;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
        g.addColorStop(0, `rgba(255, 205, 80, ${0.85 * Math.min(1, p.z * 2)})`);
        g.addColorStop(1, 'rgba(255, 205, 80, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 232, 150, 1)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.8 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduced) raf = requestAnimationFrame(frame);
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
        // Fallback ohne Texturen: stille blaue Kugel + Punkte
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
