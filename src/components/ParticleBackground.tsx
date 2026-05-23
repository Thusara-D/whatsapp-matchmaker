"use client";

import React, { useEffect, useRef } from "react";

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  isTrail: boolean;
  angle: number;

  constructor(x: number, y: number, isTrail: boolean = false) {
    this.x = x;
    this.y = y;
    this.isTrail = isTrail;

    const colors = ["#fda4af", "#f43f5e", "#fbcfe8", "#fecdd3", "#ffffff"];
    this.color = colors[Math.floor(Math.random() * colors.length)];

    if (isTrail) {
      // Trail particles: quick burst, small size, fast decay
      this.size = Math.random() * 4 + 2;
      this.vx = (Math.random() - 0.5) * 4;
      this.vy = (Math.random() - 0.5) * 4;
      this.alpha = 0.8;
      this.decay = Math.random() * 0.02 + 0.015;
    } else {
      // Background floaters: gentle upward drift
      this.size = Math.random() * 8 + 3;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = Math.random() * -1 - 0.2;
      this.alpha = Math.random() * 0.4 + 0.1;
      this.decay = 0; // Don't decay automatically
    }

    this.angle = Math.random() * Math.PI * 2;
  }

  update(mouse: { x: number, y: number, radius: number }) {
    // Interaction with mouse (repulsion)
    if (!this.isTrail) {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const distance = Math.hypot(dx, dy);

      if (distance < mouse.radius) {
        const force = (mouse.radius - distance) / mouse.radius;
        const angle = Math.atan2(dy, dx);
        const pushX = Math.cos(angle) * force * 2;
        const pushY = Math.sin(angle) * force * 2;
        
        this.x -= pushX;
        this.y -= pushY;
      }
    }

    this.x += this.vx;
    this.y += this.vy;

    if (this.isTrail) {
      this.alpha -= this.decay;
    } else {
      // Wobble effect
      this.x += Math.sin(this.angle) * 0.3;
      this.angle += 0.02;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;

    // Draw a small heart or circle depending on size
    if (this.size > 4) {
      ctx.translate(this.x, this.y);
      const s = this.size / 2;
      ctx.beginPath();
      ctx.moveTo(0, s);
      ctx.bezierCurveTo(-s, -s, -2*s, s, 0, 2*s);
      ctx.bezierCurveTo(2*s, s, s, -s, 0, s);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const mouse = {
      x: -1000,
      y: -1000,
      radius: 120
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initBackgroundParticles();
    };

    const initBackgroundParticles = () => {
      particles = particles.filter(p => p.isTrail); // keep trails, reset floaters
      const numParticles = Math.floor((canvas.width * canvas.height) / 15000);
      for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle(Math.random() * canvas.width, Math.random() * canvas.height, false));
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;

      // Add trail particles
      for (let i = 0; i < 3; i++) {
        particles.push(new Particle(mouse.x + (Math.random()-0.5)*10, mouse.y + (Math.random()-0.5)*10, true));
      }
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseLeave);

    resize();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.update(mouse);
        p.draw(ctx);

        // Remove dead trail particles
        if (p.isTrail && p.alpha <= 0) {
          particles.splice(i, 1);
          i--;
          continue;
        }

        // Wrap background particles around the screen
        if (!p.isTrail) {
          if (p.y < -p.size * 2) {
            p.y = canvas.height + p.size * 2;
            p.x = Math.random() * canvas.width;
          }
          if (p.x < -p.size * 2) p.x = canvas.width + p.size * 2;
          if (p.x > canvas.width + p.size * 2) p.x = -p.size * 2;
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}
