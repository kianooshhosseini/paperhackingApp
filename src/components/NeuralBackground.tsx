import { useEffect, useRef } from "react";

// @ts-ignore
const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron === true;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

export function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const lastFrameRef = useRef(0);

  // In Electron: use static particles (no animation loop) for performance
  // In browser: use full animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, isElectron ? 1 : 2);
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const count = isElectron ? 25 : 40;

    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      radius: Math.random() * 1.2 + 0.6,
      opacity: Math.random() * 0.25 + 0.1,
    }));

    // Draw once for static render (used in Electron)
    function drawStatic() {
      const width = canvas!.offsetWidth;
      const height = canvas!.offsetHeight;
      ctx!.clearRect(0, 0, width, height);
      const particles = particlesRef.current;

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 160;
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.08;
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.strokeStyle = `rgba(66, 147, 167, ${alpha})`;
            ctx!.lineWidth = 0.6;
            ctx!.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach((p) => {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(66, 147, 167, ${p.opacity})`;
        ctx!.fill();
      });
    }

    if (isElectron) {
      // Static only — no animation loop
      drawStatic();
    } else {
      // Full browser animation
      const handleMouseMove = (e: MouseEvent) => {
        const rect = canvas!.getBoundingClientRect();
        mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, active: true };
      };
      const handleMouseLeave = () => { mouseRef.current.active = false; };
      canvas.addEventListener("mousemove", handleMouseMove);
      canvas.addEventListener("mouseleave", handleMouseLeave);

      const animate = (timestamp: number) => {
        // Throttle to ~30fps for performance
        if (timestamp - lastFrameRef.current < 33) {
          rafRef.current = requestAnimationFrame(animate);
          return;
        }
        lastFrameRef.current = timestamp;

        const width = canvas!.offsetWidth;
        const height = canvas!.offsetHeight;
        ctx!.clearRect(0, 0, width, height);
        const particles = particlesRef.current;
        const mouse = mouseRef.current;

        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -20) p.x = width + 20;
          if (p.x > width + 20) p.x = -20;
          if (p.y < -20) p.y = height + 20;
          if (p.y > height + 20) p.y = -20;

          if (mouse.active) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120 && dist > 0) {
              p.vx += (dx / dist) * 0.3;
              p.vy += (dy / dist) * 0.3;
            }
          }

          p.vx *= 0.995;
          p.vy *= 0.995;
          if (Math.abs(p.vx) < 0.03) p.vx += (Math.random() - 0.5) * 0.08;
          if (Math.abs(p.vy) < 0.03) p.vy += (Math.random() - 0.5) * 0.08;
        });

        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = 160;
            if (dist < maxDist) {
              const alpha = (1 - dist / maxDist) * 0.1;
              ctx!.beginPath();
              ctx!.moveTo(particles[i].x, particles[i].y);
              ctx!.lineTo(particles[j].x, particles[j].y);
              ctx!.strokeStyle = `rgba(66, 147, 167, ${alpha})`;
              ctx!.lineWidth = 0.7;
              ctx!.stroke();
            }
          }
        }

        particles.forEach((p) => {
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(66, 147, 167, ${p.opacity})`;
          ctx!.fill();
        });

        rafRef.current = requestAnimationFrame(animate);
      };

      rafRef.current = requestAnimationFrame(animate);

      return () => {
        cancelAnimationFrame(rafRef.current);
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseleave", handleMouseLeave);
      };
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0, pointerEvents: isElectron ? 'none' : 'auto' }}
    />
  );
}
