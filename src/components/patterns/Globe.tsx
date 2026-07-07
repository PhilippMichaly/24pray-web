'use client';

import { useEffect, useRef } from 'react';

/**
 * Gepunktete Erde im Weltall (Landing-Signature, W3.1).
 * Canvas 2D, orthografische Projektion, langsame Rotation, Morgenröte-Schimmer
 * an der Ostkante, pulsierende Gold-Punkte = laufende Gebetsketten.
 * prefers-reduced-motion → statisches Bild (ein Frame, kein Puls).
 */

// Landmassen als Disk-Approximation (lat, lon, radius°) — bei Punkt-Auflösung
// liest sich das als Erde, ohne GeoJSON-Dependency.
const LAND: [number, number, number][] = [
  // Europa
  [50, 10, 8], [60, 25, 6], [45, 25, 5], [40, -4, 4], [54, -3, 3], [63, 15, 6],
  // Russland / Asien
  [60, 60, 12], [60, 90, 12], [65, 120, 10], [62, 145, 8], [50, 80, 8], [46, 100, 8],
  [34, 104, 9], [23, 80, 7], [14, 102, 5], [36, 138, 3], [30, 60, 6], [40, 50, 5],
  // Naher Osten
  [25, 45, 7], [35, 40, 4],
  // Afrika
  [22, 5, 8], [20, 25, 8], [5, 20, 9], [0, 27, 7], [-10, 25, 8], [-25, 25, 6],
  [12, -5, 6], [5, -7, 4], [8, 40, 5], [-19, 47, 2.5],
  // Nordamerika
  [60, -110, 12], [65, -150, 6], [50, -100, 9], [40, -100, 8], [36, -115, 5],
  [31, -99, 5], [45, -75, 5], [21, -100, 4], [75, -40, 6], [15, -90, 3],
  // Südamerika
  [0, -60, 8], [-10, -55, 7], [-20, -60, 6], [-33, -64, 5], [-47, -70, 3], [5, -70, 4],
  // Australien / NZ
  [-25, 135, 7], [-28, 120, 5], [-19, 144, 4], [-42, 172, 2],
];

function isLand(lat: number, lon: number): boolean {
  for (const [clat, clon, r] of LAND) {
    const dLat = lat - clat;
    let dLon = lon - clon;
    if (dLon > 180) dLon -= 360;
    if (dLon < -180) dLon += 360;
    // Länge mit Breitengrad-Korrektur, grob elliptisch
    const d2 = dLat * dLat + dLon * dLon * Math.cos((clat * Math.PI) / 180) ** 2;
    if (d2 < r * r) return true;
  }
  return false;
}

// Plausible Städte für die Ketten-Punkte (dekorativ — Projekte haben noch keine Geo-Daten).
const CITY_POINTS: [number, number][] = [
  [52.5, 13.4], [48.1, 11.6], [51.5, -0.1], [40.7, -74.0], [-23.5, -46.6],
  [6.5, 3.4], [-1.3, 36.8], [28.6, 77.2], [14.6, 121.0], [-33.9, 151.2],
  [55.8, 37.6], [41.0, 28.9], [19.4, -99.1], [37.6, 127.0], [50.9, 6.96],
];

export interface GlobeProps {
  activeChains: number; // echte Anzahl laufender Ketten (Punkt-Anzahl, min 3 fürs Bild)
  className?: string;
}

export function Globe({ activeChains, className }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const size = canvas.clientWidth;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const R = size * 0.42;
    const cx = size / 2;
    const cy = size / 2;

    // Punktraster der Kugel vorberechnen (lat/lon → Einheitskugel)
    const dots: { lat: number; lon: number; land: boolean }[] = [];
    for (let lat = -85; lat <= 85; lat += 4) {
      const step = 4 / Math.max(0.35, Math.cos((lat * Math.PI) / 180));
      for (let lon = -180; lon < 180; lon += step) {
        dots.push({ lat, lon, land: isLand(lat, lon) });
      }
    }

    const nPoints = Math.max(3, Math.min(CITY_POINTS.length, activeChains));
    const chainPts = CITY_POINTS.slice(0, nPoints);

    // Sterne (fix, dezent)
    const stars = Array.from({ length: 90 }, (_, i) => ({
      x: ((i * 137.508) % 360) / 360, // goldener Winkel → gleichmäßig, deterministisch
      y: ((i * 76.31) % 97) / 97,
      s: 0.4 + ((i * 29) % 10) / 12,
    }));

    let raf = 0;
    const t0 = performance.now();

    function project(latDeg: number, lonDeg: number, rot: number) {
      const lat = (latDeg * Math.PI) / 180;
      const lon = ((lonDeg + rot) * Math.PI) / 180;
      const x = Math.cos(lat) * Math.sin(lon);
      const y = Math.sin(lat);
      const z = Math.cos(lat) * Math.cos(lon);
      return { x: cx + R * x, y: cy - R * y * 0.98, z };
    }

    function frame(now: number) {
      const rot = reduced ? -20 : ((now - t0) / 1000) * (360 / 90); // 90 s / Umdrehung
      const pulse = reduced ? 1 : 0.75 + 0.25 * Math.sin((now - t0) / 600);
      if (!ctx) return;

      ctx.clearRect(0, 0, size, size);

      // Sterne
      ctx.fillStyle = 'rgba(230, 235, 255, 0.5)';
      for (const st of stars) {
        const sx = st.x * size;
        const sy = st.y * size;
        const d = Math.hypot(sx - cx, sy - cy);
        if (d < R + 6) continue; // nicht über der Kugel
        ctx.globalAlpha = 0.25 + 0.3 * st.s;
        ctx.beginPath();
        ctx.arc(sx, sy, st.s, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Atmosphären-Glow + Morgenröte an der Ostkante (Hoffnung: die Sonne kommt)
      const glow = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R * 1.22);
      glow.addColorStop(0, 'rgba(90, 120, 220, 0.16)');
      glow.addColorStop(1, 'rgba(90, 120, 220, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.22, 0, Math.PI * 2);
      ctx.fill();

      // Morgenröte: auf einen schmalen Ring um die Sphäre geclippt (kein Kanten-Artefakt)
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.09, 0, Math.PI * 2);
      ctx.clip();
      const dawn = ctx.createRadialGradient(cx + R * 0.9, cy - R * 0.2, 0, cx + R * 0.9, cy - R * 0.2, R * 0.95);
      dawn.addColorStop(0, 'rgba(255, 170, 60, 0.4)');
      dawn.addColorStop(1, 'rgba(255, 170, 60, 0)');
      ctx.fillStyle = dawn;
      ctx.fillRect(0, 0, size, size);
      ctx.restore();

      // Kugel-Grundton (blaue Stunde)
      const sphere = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.45, R * 0.1, cx, cy, R);
      sphere.addColorStop(0, 'rgba(38, 52, 100, 0.95)');
      sphere.addColorStop(1, 'rgba(14, 18, 38, 0.98)');
      ctx.fillStyle = sphere;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // Punktraster (Ozean schwach blau, Land hell)
      for (const d of dots) {
        const p = project(d.lat, d.lon, rot);
        if (p.z <= 0.02) continue; // Rückseite
        const fade = Math.min(1, p.z * 1.4);
        // Ostkante wärmer (Morgenröte streift das Land)
        const eastWarm = Math.max(0, (p.x - cx) / R) * 0.5;
        if (d.land) {
          ctx.fillStyle = `rgba(${205 + eastWarm * 45}, ${215 - eastWarm * 25}, ${235 - eastWarm * 90}, ${0.75 * fade})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.5 * fade + 0.3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = `rgba(120, 150, 235, ${0.16 * fade})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 0.9 * fade, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Gebetsketten-Punkte (pulsierendes Gold + Glow)
      for (const [plat, plon] of chainPts) {
        const p = project(plat, plon, rot);
        if (p.z <= 0.05) continue;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 11 * pulse);
        g.addColorStop(0, 'rgba(255, 200, 70, 0.9)');
        g.addColorStop(1, 'rgba(255, 200, 70, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 11 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 226, 130, 1)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.1, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduced) raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [activeChains]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', aspectRatio: '1 / 1' }}
      aria-hidden
    />
  );
}
