import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { resolvePalette, seededRand, type Palette } from "../lib/primitives";

/**
 * FAMILY: background-loops
 * Ten restrained ambient underlays. Every changing value is derived from an
 * integer-cycle phase, so evaluating any variant at durationInFrames produces
 * the same visual state as frame 0.
 */

type BackgroundLoopVariant =
  | "aurora-bands"
  | "soft-bokeh"
  | "topographic-contours"
  | "starfield-parallax"
  | "wave-layers"
  | "conic-sheen"
  | "rising-bubbles"
  | "duotone-geometry"
  | "cloud-parallax"
  | "diagonal-stripes";

export interface BackgroundLoopProps {
  variant?: BackgroundLoopVariant;
  paletteName?: string;
  speed?: number;
  intensity?: number;
}

type LoopSceneProps = {
  pal: Palette;
  phase: number;
  intensity: number;
  width: number;
  height: number;
};

const TAU = Math.PI * 2;
const alpha = (hex: string, opacity: number): string => {
  const value = Math.round(Math.max(0, Math.min(1, opacity)) * 255).toString(16).padStart(2, "0");
  return `${hex}${value}`;
};
const wrap = (value: number, range: number): number => ((value % range) + range) % range;
const pathFromPoints = (points: Array<[number, number]>): string =>
  points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

// Speed is deliberately quantized: integer cycles are the public loop-safety contract.
const loopCycles = (speed: number | undefined): number => Math.round(Math.max(-4, Math.min(4, speed ?? 1)));

const AuroraBands: React.FC<LoopSceneProps> = ({ pal, phase, intensity, width, height }) => {
  const colors = [pal.primary, pal.secondary, pal.accent];
  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg, overflow: "hidden" }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="bg-aurora-blur" x="-30%" y="-50%" width="160%" height="200%">
            <feGaussianBlur stdDeviation={55} />
          </filter>
        </defs>
        {colors.map((color, band) => {
          const points = Array.from({ length: 33 }, (_, i): [number, number] => {
            const x = (i / 32) * width;
            const spatial = (i / 32) * TAU * (1 + band);
            const y = height * (0.3 + band * 0.18) + Math.sin(spatial + phase * (band + 1) + band * 1.7) * height * (0.07 + band * 0.015) * intensity;
            return [x, y];
          });
          return <path key={color} d={pathFromPoints(points)} fill="none" stroke={alpha(color, 0.12 + intensity * 0.08)} strokeWidth={height * (0.16 + band * 0.025)} strokeLinecap="round" filter="url(#bg-aurora-blur)" />;
        })}
      </svg>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, transparent 25%, ${alpha(pal.bg, 0.72)} 100%)` }} />
    </AbsoluteFill>
  );
};

const SoftBokeh: React.FC<LoopSceneProps> = ({ pal, phase, intensity }) => {
  const colors = [pal.primary, pal.secondary, pal.accent];
  return (
    <AbsoluteFill style={{ background: `linear-gradient(145deg, ${pal.bg}, ${alpha(pal.primary, 0.12)})`, overflow: "hidden" }}>
      {Array.from({ length: 18 }, (_, i) => {
        const radius = 55 + seededRand(i * 7 + 1) * 170;
        const orbitX = 5 + seededRand(i * 7 + 2) * 12;
        const orbitY = 4 + seededRand(i * 7 + 3) * 10;
        const offset = seededRand(i * 7 + 4) * TAU;
        const harmonic = 1 + (i % 3);
        const x = seededRand(i * 7 + 5) * 100 + Math.cos(phase * harmonic + offset) * orbitX;
        const y = seededRand(i * 7 + 6) * 100 + Math.sin(phase * harmonic + offset) * orbitY;
        const breathe = 0.78 + 0.22 * Math.sin(phase * (1 + (i % 2)) + offset);
        return <div key={i} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: radius, height: radius, borderRadius: "50%", transform: `translate(-50%, -50%) scale(${breathe})`, background: `radial-gradient(circle at 38% 34%, ${alpha(colors[i % 3], 0.16 * intensity)}, ${alpha(colors[i % 3], 0.025)} 58%, transparent 72%)`, filter: `blur(${12 + radius * 0.04}px)` }} />;
      })}
      <AbsoluteFill style={{ background: `linear-gradient(90deg, ${alpha(pal.bg, 0.35)}, transparent, ${alpha(pal.bg, 0.42)})` }} />
    </AbsoluteFill>
  );
};

const TopographicContours: React.FC<LoopSceneProps> = ({ pal, phase, intensity, width, height }) => (
  <AbsoluteFill style={{ backgroundColor: pal.bg, overflow: "hidden" }}>
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="bg-topo-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={pal.primary} stopOpacity={0.16 * intensity} />
          <stop offset="1" stopColor={pal.secondary} stopOpacity={0.07 * intensity} />
        </linearGradient>
      </defs>
      {Array.from({ length: 17 }, (_, line) => {
        const points = Array.from({ length: 49 }, (_, i): [number, number] => {
          const x = (i / 48) * width;
          const nx = i / 48;
          const ridge = Math.sin(nx * TAU * 2 + phase + line * 0.31) * 28 + Math.sin(nx * TAU * 5 - phase * 2 + line * 0.73) * 9;
          return [x, height * (0.08 + line * 0.055) + ridge * intensity];
        });
        const dash = 0.5 + 0.5 * Math.sin(phase + line * 0.42);
        return <path key={line} d={pathFromPoints(points)} fill="none" stroke="url(#bg-topo-stroke)" strokeWidth={1.2 + (line % 4 === 0 ? 0.8 : 0)} strokeDasharray={line % 4 === 0 ? `${12 + dash * 16} 9` : undefined} strokeLinecap="round" />;
      })}
    </svg>
    <AbsoluteFill style={{ background: `radial-gradient(circle at 70% 45%, ${alpha(pal.accent, 0.055 * intensity)}, transparent 42%)` }} />
  </AbsoluteFill>
);

const StarfieldParallax: React.FC<LoopSceneProps> = ({ pal, phase, intensity }) => {
  const progress = phase / TAU;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 115%, ${alpha(pal.primary, 0.16)}, ${pal.bg} 62%)`, overflow: "hidden" }}>
      {[0, 1, 2].flatMap((layer) => Array.from({ length: 24 }, (_, i) => {
        const seed = layer * 100 + i;
        const x = wrap(seededRand(seed + 1) * 100 + progress * 100 * (layer + 1), 100);
        const y = wrap(seededRand(seed + 2) * 100 + progress * 100 * (layer + 1), 100);
        const size = 1 + layer * 0.8 + seededRand(seed + 3) * 1.4;
        const opacity = (0.18 + layer * 0.09 + seededRand(seed + 4) * 0.18) * intensity;
        return [-100, 0, 100].flatMap((dx) => [-100, 0, 100].map((dy) => (
          <div key={`${layer}-${i}-${dx}-${dy}`} style={{ position: "absolute", left: `${x + dx}%`, top: `${y + dy}%`, width: size, height: size, borderRadius: "50%", backgroundColor: layer === 2 ? pal.secondary : pal.text, opacity, boxShadow: layer === 2 ? `0 0 ${size * 4}px ${alpha(pal.secondary, opacity * 0.5)}` : undefined }} />
        )));
      }))}
    </AbsoluteFill>
  );
};

const WaveLayers: React.FC<LoopSceneProps> = ({ pal, phase, intensity, width, height }) => {
  const colors = [pal.primary, pal.secondary, pal.accent, pal.primary];
  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg, overflow: "hidden" }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {colors.map((color, layer) => {
          const baseline = height * (0.5 + layer * 0.105);
          const wave = Array.from({ length: 49 }, (_, i): [number, number] => {
            const x = (i / 48) * width;
            const y = baseline + Math.sin((i / 48) * TAU * (2 + layer % 2) + phase * (layer + 1) + layer) * height * (0.035 + layer * 0.008) * intensity;
            return [x, y];
          });
          const d = `${pathFromPoints(wave)} L${width},${height} L0,${height} Z`;
          return <path key={layer} d={d} fill={alpha(color, 0.07 + layer * 0.025)} stroke={alpha(color, 0.13)} strokeWidth={1.5} />;
        })}
      </svg>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${alpha(pal.bg, 0.12)}, transparent 52%, ${alpha(pal.bg, 0.28)})` }} />
    </AbsoluteFill>
  );
};

const ConicSheen: React.FC<LoopSceneProps> = ({ pal, phase, intensity }) => {
  const rotation = (phase / TAU) * 360;
  const breathe = 0.82 + Math.sin(phase * 2) * 0.08 * intensity;
  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", width: "145vmax", height: "145vmax", left: "50%", top: "50%", transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${breathe})`, borderRadius: "50%", background: `conic-gradient(from 0deg, transparent 0deg, ${alpha(pal.primary, 0.11 * intensity)} 30deg, transparent 72deg, transparent 170deg, ${alpha(pal.secondary, 0.085 * intensity)} 212deg, transparent 258deg, ${alpha(pal.accent, 0.055 * intensity)} 322deg, transparent 360deg)`, filter: "blur(28px)" }} />
      <AbsoluteFill style={{ background: `radial-gradient(circle at center, transparent 12%, ${alpha(pal.bg, 0.22)} 58%, ${alpha(pal.bg, 0.82)} 100%)` }} />
    </AbsoluteFill>
  );
};

const RisingBubbles: React.FC<LoopSceneProps> = ({ pal, phase, intensity }) => {
  const progress = phase / TAU;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${pal.bg}, ${alpha(pal.primary, 0.13)})`, overflow: "hidden" }}>
      {Array.from({ length: 22 }, (_, i) => {
        const seed = i * 9;
        const size = 18 + seededRand(seed + 1) * 82;
        const baseX = seededRand(seed + 2) * 100;
        const rate = 1 + (i % 3);
        const y = wrap(112 - seededRand(seed + 3) * 124 - progress * 124 * rate, 124) - 12;
        const wobble = Math.sin(phase * rate + seededRand(seed + 4) * TAU) * (1.5 + seededRand(seed + 5) * 4);
        return [-124, 0, 124].map((dy) => <div key={`${i}-${dy}`} style={{ position: "absolute", left: `${baseX + wobble}%`, top: `${y + dy}%`, width: size, height: size, borderRadius: "50%", border: `1.5px solid ${alpha(i % 3 === 0 ? pal.secondary : pal.primary, (0.12 + seededRand(seed + 6) * 0.13) * intensity)}`, background: `radial-gradient(circle at 32% 26%, ${alpha(pal.text, 0.07 * intensity)}, transparent 25%, ${alpha(pal.primary, 0.025)} 72%)`, boxShadow: `inset -8px -10px 22px ${alpha(pal.bg, 0.14)}` }} />);
      })}
    </AbsoluteFill>
  );
};

const DuotoneGeometry: React.FC<LoopSceneProps> = ({ pal, phase, intensity }) => {
  const shapes = [
    { left: 14, top: 18, size: 38, sides: "50%", color: pal.primary, h: 1 },
    { left: 66, top: 11, size: 31, sides: "18%", color: pal.secondary, h: 2 },
    { left: 58, top: 61, size: 43, sides: "50%", color: pal.primary, h: 1 },
    { left: 9, top: 67, size: 28, sides: "12%", color: pal.secondary, h: 3 },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg, overflow: "hidden" }}>
      {shapes.map((shape, i) => {
        const pulse = 0.88 + Math.sin(phase * shape.h + i * 1.4) * 0.1 * intensity;
        const rotate = (phase / TAU) * 360 * (i % 2 ? -shape.h : shape.h) + i * 24;
        return <div key={i} style={{ position: "absolute", left: `${shape.left}%`, top: `${shape.top}%`, width: `${shape.size}vmin`, height: `${shape.size}vmin`, borderRadius: shape.sides, transform: `translate(-50%, -50%) scale(${pulse}) rotate(${rotate}deg)`, background: alpha(shape.color, 0.065 + intensity * 0.035), border: `1px solid ${alpha(shape.color, 0.12 * intensity)}`, filter: "blur(0.2px)" }} />;
      })}
      <AbsoluteFill style={{ background: `linear-gradient(125deg, ${alpha(pal.primary, 0.035)}, transparent 44%, ${alpha(pal.secondary, 0.035)})` }} />
    </AbsoluteFill>
  );
};

const CloudParallax: React.FC<LoopSceneProps> = ({ pal, phase, intensity }) => {
  const progress = phase / TAU;
  const colors = [pal.primary, pal.secondary, pal.text];
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${alpha(pal.secondary, 0.09)}, ${pal.bg} 72%)`, overflow: "hidden" }}>
      {[0, 1, 2].flatMap((layer) => Array.from({ length: 5 }, (_, i) => {
        const seed = layer * 30 + i;
        const x = wrap(seededRand(seed + 1) * 120 - 10 + progress * 120 * (layer + 1), 120) - 10;
        const y = 16 + layer * 24 + seededRand(seed + 2) * 17 + Math.sin(phase * (layer + 1) + seededRand(seed + 3) * TAU) * 2.5;
        const w = 230 + seededRand(seed + 4) * 360;
        const h = w * (0.34 + seededRand(seed + 5) * 0.15);
        return [-120, 0, 120].map((dx) => <div key={`${layer}-${i}-${dx}`} style={{ position: "absolute", left: `${x + dx}%`, top: `${y}%`, width: w, height: h, borderRadius: "50%", transform: "translate(-50%, -50%)", background: `radial-gradient(ellipse at 50% 58%, ${alpha(colors[layer], (0.055 + layer * 0.018) * intensity)}, transparent 70%)`, filter: `blur(${25 - layer * 4}px)` }} />);
      }))}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, transparent 38%, ${alpha(pal.bg, 0.58)} 100%)` }} />
    </AbsoluteFill>
  );
};

const DiagonalStripes: React.FC<LoopSceneProps> = ({ pal, phase, intensity }) => {
  const period = 72;
  const offset = (phase / TAU) * period;
  const glow = 0.025 + (0.5 + 0.5 * Math.sin(phase * 2)) * 0.025 * intensity;
  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ backgroundImage: `repeating-linear-gradient(135deg, ${alpha(pal.primary, 0.075 * intensity)} 0px, ${alpha(pal.primary, 0.075 * intensity)} 2px, transparent 2px, transparent 36px, ${alpha(pal.secondary, 0.045 * intensity)} 36px, ${alpha(pal.secondary, 0.045 * intensity)} 38px, transparent 38px, transparent ${period}px)`, backgroundSize: `${period}px ${period}px`, backgroundPosition: `${offset}px 0px` }} />
      <AbsoluteFill style={{ background: `linear-gradient(105deg, ${alpha(pal.bg, 0.7)}, ${alpha(pal.accent, glow)}, ${alpha(pal.bg, 0.78)})` }} />
    </AbsoluteFill>
  );
};

const VARIANTS: Record<BackgroundLoopVariant, React.FC<LoopSceneProps>> = {
  "aurora-bands": AuroraBands,
  "soft-bokeh": SoftBokeh,
  "topographic-contours": TopographicContours,
  "starfield-parallax": StarfieldParallax,
  "wave-layers": WaveLayers,
  "conic-sheen": ConicSheen,
  "rising-bubbles": RisingBubbles,
  "duotone-geometry": DuotoneGeometry,
  "cloud-parallax": CloudParallax,
  "diagonal-stripes": DiagonalStripes,
};

export const BackgroundLoopTemplate: React.FC<BackgroundLoopProps> = ({
  variant = "aurora-bands",
  paletteName = "midnight",
  speed = 1,
  intensity = 0.75,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const pal = resolvePalette(paletteName);
  const cycles = loopCycles(speed);
  const safeIntensity = Math.max(0, Math.min(1.5, intensity));
  const phase = TAU * cycles * (frame / durationInFrames);
  const Scene = VARIANTS[variant] ?? AuroraBands;
  return <Scene pal={pal} phase={phase} intensity={safeIntensity} width={width} height={height} />;
};

const familyCast = (component: React.FC<BackgroundLoopProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "bg-loop-aurora-bands": familyCast(BackgroundLoopTemplate),
  "bg-loop-soft-bokeh": familyCast(BackgroundLoopTemplate),
  "bg-loop-topographic-contours": familyCast(BackgroundLoopTemplate),
  "bg-loop-starfield-parallax": familyCast(BackgroundLoopTemplate),
  "bg-loop-wave-layers": familyCast(BackgroundLoopTemplate),
  "bg-loop-conic-sheen": familyCast(BackgroundLoopTemplate),
  "bg-loop-rising-bubbles": familyCast(BackgroundLoopTemplate),
  "bg-loop-duotone-geometry": familyCast(BackgroundLoopTemplate),
  "bg-loop-cloud-parallax": familyCast(BackgroundLoopTemplate),
  "bg-loop-diagonal-stripes": familyCast(BackgroundLoopTemplate),
};
