"use client";

import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";

interface HeroMistProps {
  onFirstFrame?: () => void;
  accentColor: string;
}

function parseHexToRgb(hex: string): [number, number, number] {
  let c = hex.replace("#", "").trim();
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  if (c.length !== 6) {
    return [0.788, 0.651, 0.420]; // default gold #C9A66B
  }
  const num = parseInt(c, 16);
  if (Number.isNaN(num)) {
    return [0.788, 0.651, 0.420];
  }
  return [
    ((num >> 16) & 255) / 255,
    ((num >> 8) & 255) / 255,
    (num & 255) / 255,
  ];
}

const vertexShader = /* glsl */ `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uColor;
  uniform vec2 uPointer;
  uniform vec2 uVelocity;
  uniform float uClear;

  varying vec2 vUv;

  // Simple 2D pseudo-random
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  // Value noise with cubic interpolation
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  // 4-octave Fractal Brownian Motion
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = rot * p * 2.02 + vec2(0.15, 0.25);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
    vec2 uv = vUv * aspect;

    // Pointer disturbance
    vec2 pDist = uv - (uPointer * aspect);
    float d = length(pDist);
    float pointerInfluence = exp(-d * 3.5);
    vec2 disturbance = normalize(pDist + 0.0001) * pointerInfluence * 0.28 * min(length(uVelocity) * 3.0, 1.0);

    // Coordinate domain warping with fbm
    vec2 drift = vec2(uTime * 0.045, uTime * 0.025);
    vec2 q = uv * 1.8 + drift + disturbance;
    
    float f1 = fbm(q);
    float f2 = fbm(q + f1 * 1.4 + vec2(uTime * 0.02, -uTime * 0.015));
    float density = fbm(q + f2 * 1.1);

    // Vignette / atmospheric falloff
    vec2 center = vUv - 0.5;
    float vignette = smoothstep(0.75, 0.15, length(center));

    // Scroll clear effect (clear goes 0 to 1, thinning the mist)
    float clearMult = 1.0 - smoothstep(0.0, 0.9, uClear);

    // Mist opacity
    float alpha = smoothstep(0.25, 0.75, density) * vignette * 0.62 * clearMult;

    // Dark base with accent color blending
    vec3 baseDark = vec3(0.039, 0.035, 0.031); // #0A0908
    vec3 mistTint = mix(uColor, vec3(1.0, 0.92, 0.80), density * 0.35);
    vec3 finalColor = mix(baseDark, mistTint, alpha);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export default function HeroMist({ onFirstFrame, accentColor }: HeroMistProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetColorRef = useRef<[number, number, number]>(parseHexToRgb(accentColor));
  const currentColorRef = useRef<[number, number, number]>(parseHexToRgb(accentColor));

  // Update target color on accentColor change
  useEffect(() => {
    targetColorRef.current = parseHexToRgb(accentColor);
  }, [accentColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Device & safety capabilities check
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nav = navigator as unknown as {
      hardwareConcurrency?: number;
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };

    if (
      isReducedMotion ||
      (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 4) ||
      (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) ||
      (nav.connection?.saveData === true)
    ) {
      return;
    }

    // DPR & scale limits: 1.25 on touch, 1.5 on desktop; 0.6 scale on phones
    const maxDpr = isTouch ? 1.25 : 1.5;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const renderScale = isTouch ? 0.6 : 1.0;
    const targetFps = isTouch ? 30 : 60;
    const frameInterval = 1000 / targetFps;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        canvas,
        alpha: true,
        antialias: false,
        dpr: dpr * renderScale,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }

    const gl = renderer.gl;

    let isLost = false;
    const onContextLost = (e: Event) => {
      e.preventDefault();
      isLost = true;
    };
    canvas.addEventListener("webglcontextlost", onContextLost, false);

    const geometry = new Triangle(gl);

    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [canvas.width, canvas.height] },
        uColor: { value: currentColorRef.current },
        uPointer: { value: [0.5, 0.5] },
        uVelocity: { value: [0, 0] },
        uClear: { value: 0 },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    const mesh = new Mesh(gl, { geometry, program });

    // Size handling
    const resize = () => {
      if (isLost) return;
      const width = canvas.parentElement?.clientWidth || window.innerWidth;
      const height = canvas.parentElement?.clientHeight || window.innerHeight;
      renderer.setSize(width, height);
      program.uniforms.uResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight];
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    // Pointer & velocity smoothing (normalized 0..1)
    let pointerX = 0.5;
    let pointerY = 0.5;
    let smoothedPointerX = 0.5;
    let smoothedPointerY = 0.5;
    let velocityX = 0;
    let velocityY = 0;
    let lastPointerX = 0.5;
    let lastPointerY = 0.5;

    const heroContainer = canvas.closest<HTMLDivElement>("[data-hero-container]");

    const onPointerMove = (e: PointerEvent) => {
      const rect = (heroContainer || canvas).getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        pointerX = (e.clientX - rect.left) / rect.width;
        pointerY = 1.0 - (e.clientY - rect.top) / rect.height; // invert for WebGL UV
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = (heroContainer || canvas).getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          pointerX = (touch.clientX - rect.left) / rect.width;
          pointerY = 1.0 - (touch.clientY - rect.top) / rect.height;
        }
      }
    };

    const targetEl = heroContainer || canvas;
    targetEl.addEventListener("pointermove", onPointerMove as EventListener, { passive: true });
    targetEl.addEventListener("touchmove", onTouchMove as EventListener, { passive: true });

    // Render loop with FPS throttle, visibility pause, and intersection observer
    let animationFrameId: number;
    let lastFrameTime = performance.now();
    let hasNotifiedFirstFrame = false;
    let isVisible = true;
    let isIntersecting = true;

    const onVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const observer = new IntersectionObserver(([entry]) => {
      isIntersecting = entry.isIntersecting;
    });
    observer.observe(targetEl);

    const loop = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(loop);

      if (!isVisible || !isIntersecting || isLost) return;

      const elapsed = currentTime - lastFrameTime;
      if (elapsed < frameInterval) return;
      lastFrameTime = currentTime - (elapsed % frameInterval);

      // Color easing over ~700ms (lerp factor ~0.08 per frame)
      const targetRgb = targetColorRef.current;
      const currentRgb = currentColorRef.current;
      currentRgb[0] += (targetRgb[0] - currentRgb[0]) * 0.08;
      currentRgb[1] += (targetRgb[1] - currentRgb[1]) * 0.08;
      currentRgb[2] += (targetRgb[2] - currentRgb[2]) * 0.08;
      program.uniforms.uColor.value = currentRgb;

      // Pointer easing & velocity decay
      smoothedPointerX += (pointerX - smoothedPointerX) * 0.12;
      smoothedPointerY += (pointerY - smoothedPointerY) * 0.12;
      velocityX = (smoothedPointerX - lastPointerX);
      velocityY = (smoothedPointerY - lastPointerY);
      lastPointerX = smoothedPointerX;
      lastPointerY = smoothedPointerY;

      program.uniforms.uPointer.value = [smoothedPointerX, smoothedPointerY];
      program.uniforms.uVelocity.value = [velocityX, velocityY];
      program.uniforms.uTime.value = currentTime * 0.001;

      // Read --p scroll progress directly from heroContainer
      let clearVal = 0;
      if (heroContainer) {
        const pStr = heroContainer.style.getPropertyValue("--p");
        if (pStr) {
          clearVal = parseFloat(pStr) || 0;
        }
      }
      program.uniforms.uClear.value = clearVal;

      renderer.render({ scene: mesh });

      if (!hasNotifiedFirstFrame) {
        hasNotifiedFirstFrame = true;
        onFirstFrame?.();
      }
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      targetEl.removeEventListener("pointermove", onPointerMove as EventListener);
      targetEl.removeEventListener("touchmove", onTouchMove as EventListener);

      const loseContextExt = gl.getExtension("WEBGL_lose_context");
      loseContextExt?.loseContext();
    };
  }, [onFirstFrame]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{
        zIndex: 1,
      }}
    />
  );
}
