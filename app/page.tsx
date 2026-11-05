"use client";

import { useEffect, useRef, useState } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

const COLORS = [
  "#ff2d95",
  "#00f5ff",
  "#b829ff",
  "#ff6b00",
  "#00ff9f",
  "#ffe600",
  "#ff0055",
];

export default function Nebula() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const mouse = useRef({ x: -9999, y: -9999, active: false });
  const animationId = useRef<number>(0);
  const [theme, setTheme] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Initial particles
    const initParticles = () => {
      particles.current = [];
      const amount = Math.min(180, Math.floor((canvas.width * canvas.height) / 9000));
      for (let i = 0; i < amount; i++) {
        particles.current.push(createParticle(canvas.width, canvas.height, true));
      }
    };
    initParticles();

    const onMove = (e: MouseEvent | TouchEvent) => {
      const point = "touches" in e ? e.touches[0] : e;
      mouse.current.x = point.clientX;
      mouse.current.y = point.clientY;
      mouse.current.active = true;

      // Spawn extra particles near mouse
      if (Math.random() > 0.4) {
        for (let i = 0; i < 2; i++) {
          particles.current.push(
            createParticleNear(mouse.current.x, mouse.current.y)
          );
        }
      }
    };

    const onLeave = () => {
      mouse.current.active = false;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("touchend", onLeave);

    const animate = () => {
      // Fade effect for trails
      ctx.fillStyle = "rgba(3, 0, 20, 0.22)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const mx = mouse.current.x;
      const my = mouse.current.y;

      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];

        // Mouse gravity / attraction
        if (mouse.current.active) {
          const dx = mx - p.x;
          const dy = my - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = Math.min(2.8 / (dist * 0.08), 0.9);

          p.vx += (dx / dist) * force * 0.35;
          p.vy += (dy / dist) * force * 0.35;
        }

        // Soft center gravity so it doesn't fly away forever
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        p.vx += (cx - p.x) * 0.000018;
        p.vy += (cy - p.y) * 0.000018;

        // Damping
        p.vx *= 0.985;
        p.vy *= 0.985;

        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        // Draw
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha * 0.95;
        ctx.fill();

        // Soft glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3.5 * alpha, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha * 0.08;
        ctx.fill();

        ctx.globalAlpha = 1;

        // Remove dead or out of bounds
        if (
          p.life <= 0 ||
          p.x < -50 ||
          p.x > canvas.width + 50 ||
          p.y < -50 ||
          p.y > canvas.height + 50
        ) {
          particles.current.splice(i, 1);
        }
      }

      // Keep a minimum population
      while (particles.current.length < 90) {
        particles.current.push(createParticle(canvas.width, canvas.height, true));
      }

      // Limit max particles for performance
      if (particles.current.length > 320) {
        particles.current.splice(0, particles.current.length - 320);
      }

      setCount(particles.current.length);
      animationId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("touchend", onLeave);
    };
  }, []);

  function createParticle(w: number, h: number, randomPos = false): Particle {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    return {
      x: randomPos ? Math.random() * w : w / 2,
      y: randomPos ? Math.random() * h : h / 2,
      vx: (Math.random() - 0.5) * 1.4,
      vy: (Math.random() - 0.5) * 1.4,
      size: Math.random() * 2.2 + 0.6,
      color,
      life: 120 + Math.random() * 180,
      maxLife: 300,
    };
  }

  function createParticleNear(x: number, y: number): Particle {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    return {
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 3.5,
      vy: (Math.random() - 0.5) * 3.5,
      size: Math.random() * 2.8 + 0.8,
      color,
      life: 40 + Math.random() * 50,
      maxLife: 90,
    };
  }

  const clear = () => {
    particles.current = [];
  };

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <canvas ref={canvasRef} />

      {/* Overlay UI */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: "24px 28px",
          pointerEvents: "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.8rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              background: "linear-gradient(135deg, #00f5ff, #b829ff, #ff2d95)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Nebula
          </h1>
          <p style={{ fontSize: "0.85rem", opacity: 0.55, marginTop: 4 }}>
            حرکت ماوس = گرانش • لمس کن و بازی کن
          </p>
        </div>

        <div style={{ textAlign: "left", opacity: 0.5, fontSize: "0.8rem" }}>
          {count} ذره
        </div>
      </div>

      {/* Bottom credit + controls */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "20px 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pointerEvents: "none",
        }}
      >
        <div style={{ pointerEvents: "auto" }}>
          <button
            onClick={clear}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "white",
              padding: "8px 16px",
              borderRadius: "999px",
              cursor: "pointer",
              fontSize: "0.85rem",
              backdropFilter: "blur(8px)",
            }}
          >
            پاک کردن
          </button>
        </div>

        <div style={{ textAlign: "left", fontSize: "0.85rem", opacity: 0.7 }}>
          ساخته شده توسط{" "}
          <span
            style={{
              background: "linear-gradient(90deg, #00f5ff, #ff2d95)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: 600,
            }}
          >
            امیرحسین بخشی
          </span>
        </div>
      </div>
    </div>
  );
}