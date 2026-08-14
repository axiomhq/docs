"use client";

import { useEffect, useRef, type CanvasHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

// Manual tuning knobs, baked into the shader at module load. Widths are
// gaussian sigmas in the SVG's 853x670 design-space px (the original SVG
// strokes were 1px wide) — smaller = thinner, crisper lines.
const CONFIG = {
  mainLineWidth: 0.1, // hero line core
  mainHaloWidth: 6, // soft glow band hugging the hero line
  orangeLineWidth: 0.1, // secondary orange lines
  grayLineWidth: 0.2, // faint gray background lines
  lineBrightness: 0.7, // resting brightness of the secondary orange lines (does not affect the shine sweep)
  glowStrength: 0.6, // central glow cluster + main-line halo (1 = full)
  sweepPeriod: 8, // seconds between shine sweeps
  sweepDelay: 2, // seconds until the first sweep fires
  sweepLength: 60, // along-line size of the traveling shine
  sweepStrength: 0.85, // shine intensity
};

const f = (n: number) => n.toFixed(4);

const VERT = /* glsl */ `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Recreates hero-flares.tsx in a fragment shader. All coordinates live in the
// SVG's 853x670 design space (y-down) and are mapped onto the canvas with
// xMidYMid-meet semantics, so it scales exactly like the original SVG.
const FRAG = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intro;

const vec2 D = vec2(0.70710678, -0.70710678);
const vec2 N = vec2(0.70710678, 0.70710678);
const vec2 GC = vec2(400.0, 358.0);

float px;

float core(float q, float w) {
  float sigma = max(w, 0.8 * px);
  return exp(-(q * q) / (2.0 * sigma * sigma));
}

float prog(float st) {
  return smoothstep(st, st + 0.55, u_intro);
}

// A shine wavefront that travels bottom-left -> top-right along the lines
// every sweepPeriod seconds, then rests off-canvas for the remainder of the
// cycle. ph gives each line a slight stagger so they don't fire in lockstep.
float sweep(vec2 p, float ph) {
  float st = u_time - ${f(CONFIG.sweepDelay)};
  if (st < 0.0) return 0.0;
  float cyc = fract(st / ${f(CONFIG.sweepPeriod)});
  float tr = smoothstep(0.0, 0.42, cyc);
  float W = mix(-460.0, 460.0, tr) + sin(ph) * 40.0;
  float sg = dot(p - GC, D);
  float d = sg - W;
  return exp(-d * d / ${f(2 * CONFIG.sweepLength ** 2)}) * smoothstep(0.75, 0.95, u_intro);
}

vec3 orangeRamp(float t) {
  vec3 bright = vec3(0.980, 0.533, 0.004);
  vec3 mid = vec3(0.776, 0.341, 0.004);
  vec3 dark = vec3(0.212, 0.086, 0.004);
  return mix(mix(bright, mid, smoothstep(0.1, 0.65, t)), dark, smoothstep(0.6, 1.0, t));
}

vec3 flare(vec2 p, vec2 c, float halfLen, float amp, float st, float ph) {
  float pr = prog(st);
  if (pr < 0.001) return vec3(0.0);
  float s = dot(p - c, D);
  float q = dot(p - c, N);
  float len = halfLen * (0.25 + 0.75 * pr);
  float t = clamp(abs(s) / len, 0.0, 1.0);
  float fade = 1.0 - smoothstep(0.45, 1.0, t);
  float flow = 0.9 + 0.1 * sin(s * 0.006 - u_time * 0.7 + ph);
  float mg = sweep(p, ph);
  vec3 col = orangeRamp(t) * flow * ${f(CONFIG.lineBrightness)} + vec3(1.0, 0.72, 0.42) * mg * ${f(CONFIG.sweepStrength)};
  return col * core(q, ${f(CONFIG.orangeLineWidth)}) * fade * amp * pr;
}

vec3 grayFlare(vec2 p, vec2 c, float halfLen, float v, float amp, float st) {
  float pr = prog(st);
  if (pr < 0.001) return vec3(0.0);
  float s = dot(p - c, D);
  float q = dot(p - c, N);
  float len = halfLen * (0.25 + 0.75 * pr);
  float t = clamp(abs(s) / len, 0.0, 1.0);
  return vec3(v) * (1.0 - t) * core(q, ${f(CONFIG.grayLineWidth)}) * amp * pr;
}

vec3 mainRamp(float d0) {
  vec3 hot = vec3(0.929, 0.349, 0.012);
  vec3 warm = vec3(1.0, 0.486, 0.098);
  vec3 dark = vec3(0.231, 0.090, 0.0);
  vec3 col = mix(vec3(1.0), hot, smoothstep(0.0, 0.085, d0));
  col = mix(col, warm, smoothstep(0.085, 0.22, d0));
  return mix(col, dark, smoothstep(0.24, 0.44, d0));
}

vec3 haloRamp(float d1) {
  vec3 yell = vec3(1.0, 0.839, 0.196);
  vec3 oran = vec3(0.902, 0.424, 0.0);
  vec3 dark = vec3(0.231, 0.090, 0.0);
  return mix(mix(yell, oran, smoothstep(0.02, 0.2, d1)), dark, smoothstep(0.2, 0.42, d1));
}

vec3 mainLine(vec2 p) {
  vec2 c = vec2(383.71, 373.71);
  float halfLen = 387.5;
  float pr = smoothstep(0.0, 0.62, u_intro);
  if (pr < 0.001) return vec3(0.0);
  float s = dot(p - c, D);
  float q = dot(p - c, N);
  float len = halfLen * (0.18 + 0.82 * pr);
  float t = clamp(abs(s) / len, 0.0, 1.0);
  float fade = 1.0 - smoothstep(0.5, 1.0, t);
  float fh = 0.5 + 0.5 * clamp(s / halfLen, -1.0, 1.0);
  float breathe = 0.93 + 0.07 * sin(u_time * 0.55 + 0.8);
  vec3 col = mainRamp(abs(fh - 0.5337)) * core(q, ${f(CONFIG.mainLineWidth)}) * breathe;
  col += haloRamp(abs(fh - 0.5)) * exp(-q * q / ${f(2 * CONFIG.mainHaloWidth ** 2)}) * ${f(0.16 * CONFIG.glowStrength)};
  float mg = sweep(p, 0.0);
  col += vec3(1.0, 0.85, 0.62) * mg * core(q, ${f(CONFIG.mainLineWidth * 2.2)}) * ${f(CONFIG.sweepStrength * 1.2)};
  return col * fade * pr;
}

vec3 glowCluster(vec2 p) {
  float gp = smoothstep(0.12, 0.85, u_intro);
  if (gp < 0.001) return vec3(0.0);
  float grow = 0.7 + 0.3 * gp;
  float a = dot(p - GC, D) / grow;
  float b = dot(p - GC, N) / grow;
  float breathe = 1.0 + 0.05 * sin(u_time * 0.7) + 0.03 * sin(u_time * 1.9 + 1.7);
  // Warm up as the shine sweep passes through the core.
  breathe *= 1.0 + 0.3 * sweep(GC, 0.0);
  vec3 col = vec3(0.0);
  float e1 = (a * a) / 3600.0 + (b * b) / 1156.0;
  col += mix(vec3(0.996, 0.533, 0.031), vec3(0.843, 0.341, 0.0), clamp(sqrt(e1), 0.0, 1.0)) * exp(-e1 * 1.1) * 0.34;
  float e2 = (a * a) / 6084.0 + (b * b) / 169.0;
  col += mix(vec3(1.0, 0.92, 0.85), vec3(0.859, 0.345, 0.008), clamp(sqrt(e2), 0.0, 1.0)) * exp(-e2 * 1.4) * 0.32;
  float e3 = (a * a) / 256.0 + (b * b) / 121.0;
  col += vec3(0.902, 0.13, 0.10) * exp(-e3 * 1.2) * 0.30;
  float e4 = (a * a) / 900.0 + (b * b) / 20.25;
  col += vec3(1.0) * exp(-e4 * 1.6) * 0.26;
  return col * gp * breathe * ${f(CONFIG.glowStrength)};
}

void main() {
  float scale = min(u_resolution.x / 853.0, u_resolution.y / 670.0);
  px = 1.0 / scale;
  vec2 offs = 0.5 * (u_resolution - vec2(853.0, 670.0) * scale);
  vec2 p = (gl_FragCoord.xy - offs) / scale;
  p.y = 670.0 - p.y;

  vec3 col = mainLine(p) + glowCluster(p);

  col += flare(p, vec2(470.53, 197.53), 278.6, 0.70, 0.08, 1.7);
  col += flare(p, vec2(468.03, 364.03), 270.8, 0.62, 0.14, 4.2);
  col += flare(p, vec2(499.21, 565.21), 270.8, 0.53, 0.20, 2.9);
  col += flare(p, vec2(249.53, 330.53), 352.1, 0.47, 0.26, 5.6);
  col += flare(p, vec2(660.21, 330.21), 270.8, 0.38, 0.32, 0.9);
  col += flare(p, vec2(522.71, 339.71), 132.9, 0.25, 0.36, 3.4);

  col += grayFlare(p, vec2(468.21, 456.21), 270.8, 0.18, 0.35, 0.30);
  col += grayFlare(p, vec2(574.71, 550.71), 132.9, 0.49, 0.33, 0.38);
  col += grayFlare(p, vec2(315.71, 177.71), 247.5, 0.31, 0.16, 0.42);
  col += grayFlare(p, vec2(523.21, 502.21), 270.8, 0.31, 0.14, 0.45);

  float mask = clamp((340.0 - distance(p, GC)) / 221.0, 0.0, 1.0);
  col *= mask;

  // Premultiplied alpha so the flares composite additively over the page bg.
  float alpha = clamp(max(col.r, max(col.g, col.b)) * 1.15, 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
}
`;

const INTRO_DELAY_MS = 250;
const INTRO_MS = 3200;

// Context-loss handlers must outlive the effect: the App Router keeps
// visited pages cached, and if the browser drops the WebGL context while the
// page is hidden, the webglcontextlost event needs a preventDefault'ed
// listener attached or the context can never be restored (white canvas).
const glHandlers = new WeakMap<
  HTMLCanvasElement,
  { lost: EventListener; restored: EventListener }
>();

export function HeroFlaresShader({
  className,
  style,
  ...props
}: CanvasHTMLAttributes<HTMLCanvasElement>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      powerPreference: "low-power",
    });
    if (!gl) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let uRes: WebGLUniformLocation | null = null;
    let uTime: WebGLUniformLocation | null = null;
    let uIntro: WebGLUniformLocation | null = null;
    let ok = false;

    const setup = () => {
      ok = false;
      const compile = (type: number, src: string) => {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.warn("hero-flares-shader:", gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };
      const vs = compile(gl.VERTEX_SHADER, VERT);
      const fs = compile(gl.FRAGMENT_SHADER, FRAG);
      if (!vs || !fs) return;
      const program = gl.createProgram();
      if (!program) return;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn("hero-flares-shader:", gl.getProgramInfoLog(program));
        return;
      }
      gl.useProgram(program);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW,
      );
      const aPosition = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
      uRes = gl.getUniformLocation(program, "u_resolution");
      uTime = gl.getUniformLocation(program, "u_time");
      uIntro = gl.getUniformLocation(program, "u_intro");
      ok = true;
    };
    if (!gl.isContextLost()) {
      setup();
      // Clear immediately so the buffer never shows uninitialized (white)
      // content before the first real frame.
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    let raf = 0;
    let running = false;
    let visible = false;
    // Animation clock only advances while on screen, so the intro plays from
    // the moment the flares first become visible.
    let elapsed = 0;
    let last = 0;

    const draw = () => {
      if (!ok) return;
      const w = gl.drawingBufferWidth;
      const h = gl.drawingBufferHeight;
      if (w === 0 || h === 0) return;
      gl.viewport(0, 0, w, h);
      const time = reduced ? 30000 : elapsed;
      const p = reduced
        ? 1
        : Math.min(1, Math.max(0, (elapsed - INTRO_DELAY_MS) / INTRO_MS));
      const intro = 1 - Math.pow(1 - p, 3);
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uTime, time / 1000);
      gl.uniform1f(uIntro, intro);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const frame = (now: number) => {
      raf = 0;
      if (!visible) {
        running = false;
        return;
      }
      elapsed += Math.min(100, now - last);
      last = now;
      draw();
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (reduced) {
        draw();
        return;
      }
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    io.observe(canvas);

    const ro = new ResizeObserver(() => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w;
        canvas.height = h;
      }
      draw();
    });
    ro.observe(canvas);

    const onLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      running = false;
      ok = false;
    };
    const onRestored = () => {
      setup();
      if (visible) start();
    };
    const prev = glHandlers.get(canvas);
    if (prev) {
      canvas.removeEventListener("webglcontextlost", prev.lost);
      canvas.removeEventListener("webglcontextrestored", prev.restored);
    }
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    glHandlers.set(canvas, { lost: onLost, restored: onRestored });

    // If this effect re-ran on a cached canvas whose context got dropped
    // while hidden, ask the browser for it back; onRestored re-runs setup.
    if (gl.isContextLost()) {
      gl.getExtension("WEBGL_lose_context")?.restoreContext();
    }

    return () => {
      // Deliberately keep the context and its loss listeners alive — the
      // App Router may reactivate this exact canvas later, and a context
      // lost without a preventDefault'ed listener is unrestorable.
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={853}
      height={670}
      // The SVG's height attribute keeps it 670px tall even with w-full;
      // mirror that so the shader occupies the exact same box.
      style={{ height: 670, ...style }}
      // bg-background prevents the brief white flash some browsers paint
      // while the WebGL context initializes.
      className={cn("pointer-events-none bg-background", className)}
      aria-hidden
      {...props}
    />
  );
}
