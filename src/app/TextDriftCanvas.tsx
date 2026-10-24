import * as React from 'react';
import { useToolcraft, useToolcraftValue } from '@/toolcraft/runtime/react';

interface LetterParticle {
  char: string;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  phase: number;
  color: string;
  driftX: number;
  driftY: number;
}

const PALETTE = {
  bg: '#e8f4f8',
  layer: '#d4ecf0',
  accent1: '#81d4fa',
  accent2: '#ce93d8',
  accent3: '#f48fb1',
  accent4: '#fff176',
  text: 'rgba(0,0,0,0.5)',
};

const tempColors = [
  { temp: 22, color: '#81d4fa' },
  { temp: 25, color: '#a7d8f0' },
  { temp: 28, color: '#ce93d8' },
  { temp: 31, color: '#e8a0b8' },
  { temp: 34, color: '#f48fb1' },
];

function lerpColor(a: string, b: string, t: number): string {
  const ah = parseInt(a.slice(1), 16);
  const bh = parseInt(b.slice(1), 16);
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return `rgb(${rr},${rg},${rb})`;
}

// Color Mood shifts the temperature-to-colour scale: Cool reads every reading as
// 6 °C colder (more blue), Warm as 6 °C warmer (more pink), Mixed uses it as is
const MOOD_SHIFT: Record<string, number> = { cool: -6, mixed: 0, warm: 6 };

function tempToColor(temp: number): string {
  if (temp <= 22) return tempColors[0].color;
  if (temp >= 34) return tempColors[4].color;
  for (let i = 0; i < tempColors.length - 1; i++) {
    const lo = tempColors[i];
    const hi = tempColors[i + 1];
    if (temp >= lo.temp && temp <= hi.temp) {
      const t = (temp - lo.temp) / (hi.temp - lo.temp);
      return lerpColor(lo.color, hi.color, t);
    }
  }
  return tempColors[2].color;
}

const DEFAULT_TEXT = 'textdrift';
const API_URL = 'https://api.open-meteo.com/v1/forecast?latitude=1.35&longitude=103.82&current=temperature_2m,wind_speed_10m,wind_direction_10m&timezone=Asia/Singapore';

function getWeatherData(): Promise<{ temp: number; windSpeed: number; windDir: number } | null> {
  return fetch(API_URL)
    .then(r => r.json())
    .then(d => ({
      temp: d.current.temperature_2m,
      windSpeed: d.current.wind_speed_10m,
      windDir: d.current.wind_direction_10m,
    }))
    .catch(() => null);
}

export function TextDriftCanvas(): React.JSX.Element {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const particlesRef = React.useRef<LetterParticle[]>([]);
  const weatherRef = React.useRef({ temp: 28, windSpeed: 5, windDir: 90, live: false, lastFetch: 0 });
  const animRef = React.useRef(0);
  const timeRef = React.useRef(0);
  const textRef = React.useRef(DEFAULT_TEXT);
  const stampRef = React.useRef<HTMLDivElement>(null);
  const heroRef = React.useRef<HTMLDivElement>(null);
  const quietRef = React.useRef<HTMLDivElement>(null);
  const quietTimerRef = React.useRef<number>(0);

  // Read Toolcraft controls
  const userText = (useToolcraftValue('userText') as string) || DEFAULT_TEXT;
  const fontSize = (useToolcraftValue('fontSize') as number) || 32;
  const windMult = (useToolcraftValue('windMultiplier') as number) || 1;
  const spread = (useToolcraftValue('particleSpread') as number) || 1;
  const colorMood = (useToolcraftValue('colorMood') as string) || 'mixed';
  const colorMoodRef = React.useRef(colorMood);
  colorMoodRef.current = colorMood;

  // The output frame (not the window) is the drawing surface; fit it into the viewport
  const { dispatch, state } = useToolcraft();
  const frameW = state.canvas.size.width;
  const frameH = state.canvas.size.height;
  React.useEffect(() => {
    const fit = () => {
      const viewport = canvasRef.current?.closest<HTMLElement>("[data-slot='toolcraft-runtime-canvas']");
      if (!viewport || !frameW || !frameH) return;
      // Fit into the part of the viewport actually on screen (the app shell has a minimum
      // width, so on phones it runs past the window), left of the controls panel when there is room
      const r = viewport.getBoundingClientRect();
      const left = Math.max(r.left, 0);
      const top = Math.max(r.top, 0);
      let right = Math.min(r.right, window.innerWidth);
      const bottom = Math.min(r.bottom, window.innerHeight);
      const panel = document.querySelector<HTMLElement>("[data-slot='toolcraft-runtime-panel-host']");
      const panelLeft = panel?.getBoundingClientRect().left ?? right;
      if (panelLeft < right && panelLeft - left > 600) right = panelLeft - 12;
      const visW = right - left;
      const visH = bottom - top;
      if (visW <= 0 || visH <= 0) return;
      const zoom = Math.min(visW / frameW, visH / frameH) * 100;
      if (zoom < 25) {
        // Below the runtime's minimum zoom: reshape the output frame to the screen instead
        dispatch({ type: 'canvas.setSize', size: { width: Math.floor(visW), height: Math.floor(visH), unit: 'px' } });
        return;
      }
      dispatch({
        type: 'canvas.setViewport',
        offset: { x: left + visW / 2 - (r.left + r.width / 2), y: top + visH / 2 - (r.top + r.height / 2) },
        zoom: Math.floor(zoom),
      });
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [dispatch, frameW, frameH]);

  // Fetch weather
  React.useEffect(() => {
    const fetchWeather = () => {
      getWeatherData().then(data => {
        if (data) {
          weatherRef.current = { ...data, live: true, lastFetch: performance.now() };
          updateStamp();
          updateHero();
        }
      });
    };
    fetchWeather();
    const iv = setInterval(fetchWeather, 60000);
    return () => clearInterval(iv);
  }, []);

  const updateStamp = () => {
    if (!stampRef.current) return;
    const w = weatherRef.current;
    const ago = Math.round((performance.now() - w.lastFetch) / 1000);
    const status = w.live ? 'live' : 'fallback';
    stampRef.current.textContent = `Open-Meteo Singapore · ${w.temp}°C · ${w.windSpeed} km/h · ${status} · ${ago}s ago`;
  };

  const updateHero = () => {
    if (!heroRef.current) return;
    heroRef.current.textContent = `${weatherRef.current.temp}°C`;
  };

  // Recreate particles when text changes
  React.useEffect(() => {
    textRef.current = userText || DEFAULT_TEXT;
    const txt = textRef.current;
    const W = frameW || window.innerWidth;
    const H = frameH || window.innerHeight;
    const count = txt.length;
    const s = spread || 1;
    const particles: LetterParticle[] = [];
    const totalWidth = count * (fontSize || 32) * 0.7 * s;
    const startX = (W - totalWidth) / 2;
    const startY = H / 2;

    for (let i = 0; i < count; i++) {
      const cx = startX + i * (fontSize || 32) * 0.7 * s + Math.random() * 20 - 10;
      const cy = startY + Math.random() * 40 - 20;
      particles.push({
        char: txt[i],
        x: cx, y: cy,
        baseX: cx, baseY: cy,
        size: fontSize || 32,
        phase: Math.random() * Math.PI * 2,
        color: PALETTE.accent1,
        driftX: 0, driftY: 0,
      });
    }
    particlesRef.current = particles;
  }, [userText, fontSize, spread, frameW, frameH]);

  // Animation loop
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0;
    let H = 0;

    // Size the drawing buffer to the output frame the canvas sits in
    const resize = () => {
      const frame = canvas.parentElement ?? canvas;
      W = frame.clientWidth || window.innerWidth;
      H = frame.clientHeight || window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas.parentElement ?? canvas);

    const loop = (t: number) => {
      const dt = Math.min((t - timeRef.current) / 1000, 0.05);
      timeRef.current = t;
      const w = weatherRef.current;
      const wm = windMult || 1;
      const fSize = fontSize || 32;

      // Update stamp
      updateStamp();

      // Wind vector (meteo to canvas)
      const rad = w.windDir * Math.PI / 180;
      const vx = -Math.sin(rad) * w.windSpeed * 0.15 * wm;
      const vy = Math.cos(rad) * w.windSpeed * 0.15 * wm;

      // Update particles
      const particles = particlesRef.current;
      for (const p of particles) {
        p.driftX += (vx - p.driftX) * 0.02;
        p.driftY += (vy - p.driftY) * 0.02;
        p.phase += dt * 1.5;
        const bob = Math.sin(p.phase) * 2;
        p.x = p.baseX + p.driftX + bob;
        p.y = p.baseY + p.driftY + Math.cos(p.phase * 0.7) * 2;
        p.color = tempToColor(w.temp + (MOOD_SHIFT[colorMoodRef.current] ?? 0));
        p.size = fSize;
      }

      // Draw
      ctx.clearRect(0, 0, W, H);
      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, PALETTE.bg);
      grad.addColorStop(0.5, PALETTE.layer);
      grad.addColorStop(1, '#dceef2');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Draw subtle cloud wisps
      ctx.globalAlpha = 0.08;
      for (let i = 0; i < 5; i++) {
        const cloudX = ((t * 0.01 + i * 200) % (W + 300)) - 150;
        const cloudY = H * 0.15 + i * 60 + Math.sin(t * 0.0005 + i) * 20;
        ctx.beginPath();
        ctx.arc(cloudX, cloudY, 40 + i * 15, 0, Math.PI * 2);
        ctx.arc(cloudX + 50, cloudY - 10, 30 + i * 10, 0, Math.PI * 2);
        ctx.arc(cloudX - 40, cloudY + 5, 25 + i * 12, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Draw letters
      for (const p of particles) {
        ctx.save();
        ctx.font = `${p.size}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.85;
        // Subtle glow
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fillText(p.char, p.x, p.y);
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animRef.current);
      resizeObserver.disconnect();
    };
  }, [fontSize, windMult, spread]);

  // Handle tap for quiet zone
  const handleTap = React.useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : e.clientY;
    // The frame may be zoomed to fit the viewport; convert to canvas units
    const canvasEl = canvasRef.current!;
    const scale = rect.width / (canvasEl.clientWidth || rect.width);
    const x = (cx - rect.left) / scale;
    const y = (cy - rect.top) / scale;

    // Find closest letter
    let minDist = Infinity;
    let closest: LetterParticle | null = null;
    for (const p of particlesRef.current) {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < minDist && d < (fontSize || 32)) {
        minDist = d;
        closest = p;
      }
    }

    const q = quietRef.current;
    if (!q) return;
    if (closest) {
      const w = weatherRef.current;
      q.innerHTML = `
        <div style="font-weight:600;margin-bottom:4px">Letter "${closest.char}"</div>
        <div>Temperature drives color: ${w.temp}°C</div>
        <div>Wind drives drift: ${w.windSpeed} km/h</div>
        <div>Direction: ${Math.round(w.windDir)}°</div>
      `;
      q.style.opacity = '1';
      clearTimeout(quietTimerRef.current);
      quietTimerRef.current = window.setTimeout(() => {
        q.style.opacity = '0';
      }, 3000);
    } else {
      q.style.opacity = '0';
    }
  }, [fontSize]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: 'manipulation', cursor: 'pointer' }}
        onClick={handleTap}
        onTouchStart={handleTap}
      />
      <div
        ref={stampRef}
        id="stamp"
        className="fixed"
        style={{
          bottom: 20, left: 16,
          font: '10px system-ui, sans-serif',
          color: 'rgba(0,0,0,0.4)',
          pointerEvents: 'none', zIndex: 20,
        }}
      >
        Open-Meteo Singapore · 28°C · 5 km/h · loading...
      </div>
      <div
        id="desc"
        className="fixed"
        style={{
          bottom: 68, left: '50%', transform: 'translateX(-50%)',
          font: '11px system-ui, sans-serif',
          color: 'rgba(0,0,0,0.45)',
          textAlign: 'center', maxWidth: '65ch',
          pointerEvents: 'none', zIndex: 20,
        }}
      >
        Type any words. Live Singapore weather animates each letter — temperature controls color, wind controls drift.
      </div>
      <div
        id="legend"
        className="fixed"
        style={{
          bottom: 44, left: '50%', transform: 'translateX(-50%)',
          font: '10px system-ui, sans-serif',
          color: 'rgba(0,0,0,0.35)',
          textAlign: 'center',
          pointerEvents: 'none', zIndex: 20,
        }}
      >
        cooler ← temperature → warmer · calmer ← wind → stronger
      </div>
      <div
        ref={heroRef}
        id="hero"
        className="fixed"
        style={{
          top: 24, right: 24,
          font: 'bold 40px system-ui, sans-serif',
          color: '#81d4fa',
          pointerEvents: 'none', zIndex: 20,
        }}
      >
        28°C
      </div>
      <div
        ref={quietRef}
        id="quiet"
        className="fixed"
        style={{
          bottom: 100, left: '50%', transform: 'translateX(-50%)',
          font: '11px system-ui, sans-serif',
          color: 'rgba(0,0,0,0.6)',
          backgroundColor: 'rgba(255,255,255,0.8)',
          padding: '8px 14px', borderRadius: 8,
          pointerEvents: 'none', zIndex: 20,
          opacity: 0, transition: 'opacity 0.4s',
        }}
      />
    </>
  );
}
