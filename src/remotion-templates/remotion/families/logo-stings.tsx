import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  FadeEdges,
  GradientMeshBackground,
  NoiseGrainOverlay,
  clampInterp,
  resolvePalette,
  seededRand,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: logo-stings
 * Ten procedural logo reveals. Every variant owns a different geometric mark,
 * construction system, and motion language; no external brand assets required.
 */

type LogoVariant =
  | "shape-draw"
  | "light-sweep"
  | "particle-assemble"
  | "mask-wipe"
  | "facet-flip"
  | "stroke-trace"
  | "ripple-punch"
  | "split-panel"
  | "glow-bloom"
  | "monogram";

export interface LogoStingProps {
  variant: LogoVariant;
  brandName: string;
  tagline: string;
  paletteName: string;
  monogram: string;
}

const FONT_STACK = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO_STACK = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const bezier = Easing.bezier(0.16, 1, 0.3, 1);

const eased = (frame: number, from: number, to: number): number =>
  interpolate(frame, [from, to], [0, 1], {
    easing: bezier,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const Center: React.FC<{ children: React.ReactNode; size?: number; top?: string; style?: React.CSSProperties }> = ({
  children,
  size = 390,
  top = "43%",
  style,
}) => (
  <div
    style={{
      position: "absolute",
      left: "50%",
      top,
      width: size,
      height: size,
      transform: "translate(-50%, -50%)",
      ...style,
    }}
  >
    {children}
  </div>
);

const MotionStage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const out = eased(frame, durationInFrames - 18, durationInFrames);
  return (
    <AbsoluteFill
      style={{
        transform: `translateY(${-26 * out}px) scale(${1 - out * 0.055})`,
        filter: `blur(${out * 7}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const Wordmark: React.FC<{ p: LogoStingProps; pal: Palette; start?: number }> = ({ p, pal, start = 28 }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const lock = spring({
    frame: Math.max(0, frame - start),
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.85 },
  });
  const rule = eased(frame, start + 4, start + 20);
  const tag = eased(frame, start + 10, start + 24);
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: p.variant === "monogram" ? "70%" : "67%",
        width: "80%",
        transform: `translate(-50%, ${interpolate(lock, [0, 1], [38, 0])}px)`,
        textAlign: "center",
        opacity: lock,
        fontFamily: FONT_STACK,
      }}
    >
      <div
        style={{
          color: pal.text,
          fontSize: Math.min(width * 0.044, 66),
          fontWeight: 760,
          letterSpacing: `${interpolate(lock, [0, 1], [0.22, 0.09])}em`,
          lineHeight: 1,
          textTransform: "uppercase",
        }}
      >
        {p.brandName}
      </div>
      <div
        style={{
          width: 170 * rule,
          height: 2,
          margin: "22px auto 17px",
          background: `linear-gradient(90deg, transparent, ${pal.accent}, transparent)`,
        }}
      />
      <div
        style={{
          color: pal.secondary,
          fontFamily: MONO_STACK,
          fontSize: Math.min(width * 0.014, 22),
          fontWeight: 500,
          letterSpacing: "0.24em",
          opacity: tag * 0.82,
          textTransform: "uppercase",
          transform: `translateY(${(1 - tag) * 9}px)`,
        }}
      >
        {p.tagline}
      </div>
    </div>
  );
};

// 01 — concentric geometry drafted into existence with independent stroke timing.
const ShapeDraw: React.FC<{ pal: Palette }> = ({ pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drawOuter = eased(frame, 3, 27);
  const drawInner = eased(frame, 10, 34);
  const settle = spring({ frame: Math.max(0, frame - 2), fps, config: { damping: 15, stiffness: 105 } });
  const fill = eased(frame, 28, 42);
  return (
    <Center>
      <svg
        viewBox="0 0 400 400"
        width="100%"
        height="100%"
        style={{
          overflow: "visible",
          transform: `rotate(${interpolate(settle, [0, 1], [-34, 0])}deg) scale(${interpolate(settle, [0, 1], [0.72, 1])})`,
        }}
      >
        <circle cx="200" cy="200" r="155" fill="none" stroke={pal.secondary} strokeOpacity={0.28} strokeWidth="2" />
        <polygon
          points="200,42 337,121 337,279 200,358 63,279 63,121"
          fill={`${pal.primary}18`}
          stroke={pal.primary}
          strokeWidth="8"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - drawOuter}
        />
        <circle
          cx="200"
          cy="200"
          r="91"
          fill={`${pal.accent}${Math.round(fill * 40).toString(16).padStart(2, "0")}`}
          stroke={pal.accent}
          strokeWidth="6"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - drawInner}
          transform={`rotate(${-90 + drawInner * 180} 200 200)`}
        />
        <polygon
          points="200,123 270,244 130,244"
          fill={pal.text}
          fillOpacity={fill}
          style={{ transformOrigin: "200px 200px", transform: `scale(${0.55 + fill * 0.45})` }}
        />
        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            cx={200 + Math.cos(i * (Math.PI * 2 / 3) - Math.PI / 2) * 156}
            cy={200 + Math.sin(i * (Math.PI * 2 / 3) - Math.PI / 2) * 156}
            r={5 + fill * 4}
            fill={pal.accent}
            opacity={fill}
          />
        ))}
      </svg>
    </Center>
  );
};

// 02 — an angular prism catches a physically motivated travelling highlight.
const LightSweep: React.FC<{ pal: Palette }> = ({ pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = spring({ frame: Math.max(0, frame - 3), fps, config: { damping: 16, stiffness: 145, mass: 0.8 } });
  const sweep = eased(frame, 20, 48);
  const flare = clampInterp(frame, [18, 30, 47, 55], [0, 1, 1, 0]);
  return (
    <Center size={410}>
      <svg
        viewBox="0 0 410 410"
        width="100%"
        height="100%"
        style={{ transform: `translateY(${(1 - rise) * 80}px) scale(${0.78 + rise * 0.22})` }}
      >
        <defs>
          <clipPath id="prism-sweep-clip">
            <path d="M69 259 L180 70 L342 70 L232 259 L302 259 L213 352 L90 352 L170 259 Z" />
          </clipPath>
          <linearGradient id="prism-base" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={pal.secondary} />
            <stop offset="0.52" stopColor={pal.primary} />
            <stop offset="1" stopColor={pal.accent} />
          </linearGradient>
          <linearGradient id="prism-shine" x1="0" x2="1">
            <stop offset="0" stopColor="white" stopOpacity="0" />
            <stop offset="0.5" stopColor="white" stopOpacity="0.95" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M69 259 L180 70 L342 70 L232 259 L302 259 L213 352 L90 352 L170 259 Z"
          fill="url(#prism-base)"
          opacity={rise}
        />
        <path d="M180 70 L232 259 L342 70 Z" fill={pal.text} opacity={0.13 * rise} />
        <rect
          x={-180 + sweep * 680}
          y="-30"
          width="76"
          height="490"
          fill="url(#prism-shine)"
          clipPath="url(#prism-sweep-clip)"
          transform="rotate(15 205 205)"
          opacity={flare}
        />
        <line
          x1={-130 + sweep * 680}
          x2={-130 + sweep * 680}
          y1="20"
          y2="390"
          stroke="white"
          strokeWidth="3"
          opacity={flare * 0.7}
          clipPath="url(#prism-sweep-clip)"
        />
      </svg>
    </Center>
  );
};

// 03 — seeded fragments fly from the perimeter and lock into a radial crest.
const ParticleAssemble: React.FC<{ pal: Palette }> = ({ pal }) => {
  const frame = useCurrentFrame();
  const count = 54;
  const core = eased(frame, 27, 43);
  const colors = [pal.primary, pal.secondary, pal.accent, pal.text];
  return (
    <Center size={430}>
      <div style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: count }, (_, i) => {
          const angle = (i / count) * Math.PI * 2 + (i % 3) * 0.13;
          const ring = 80 + (i % 3) * 38;
          const tx = 215 + Math.cos(angle) * ring;
          const ty = 215 + Math.sin(angle) * ring;
          const sx = -120 + seededRand(i * 7 + 1) * 670;
          const sy = -110 + seededRand(i * 7 + 2) * 650;
          const t = eased(frame, 3 + (i % 9) * 0.75, 27 + (i % 9) * 0.75);
          const x = interpolate(t, [0, 1], [sx, tx]);
          const y = interpolate(t, [0, 1], [sy, ty]);
          const size = 3 + seededRand(i * 7 + 3) * 7;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: size,
                height: size,
                borderRadius: i % 4 === 0 ? 1 : "50%",
                background: colors[i % colors.length],
                boxShadow: `0 0 ${8 + size}px ${colors[i % colors.length]}`,
                opacity: clampInterp(t, [0, 0.16, 1], [0, 0.9, 0.72]),
                transform: `translate(-50%, -50%) rotate(${i * 37 + frame * 2}deg) scale(${0.5 + t * 0.5})`,
              }}
            />
          );
        })}
      </div>
      <svg viewBox="0 0 430 430" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="particle-core">
            <stop offset="0" stopColor={pal.text} />
            <stop offset="0.4" stopColor={pal.secondary} />
            <stop offset="1" stopColor={pal.primary} />
          </radialGradient>
        </defs>
        <polygon
          points="215,130 289,172 289,258 215,300 141,258 141,172"
          fill="url(#particle-core)"
          opacity={core}
          style={{ transformOrigin: "215px 215px", transform: `scale(${0.35 + core * 0.65}) rotate(${(1 - core) * 45}deg)` }}
        />
        <circle cx="215" cy="215" r="29" fill={pal.bg} opacity={core} />
        <circle cx="215" cy="215" r={9 + core * 4} fill={pal.accent} opacity={core} />
      </svg>
    </Center>
  );
};

// 04 — a hard-edged signal tile is revealed by a travelling matte and scanner.
const MaskWipe: React.FC<{ pal: Palette }> = ({ pal }) => {
  const frame = useCurrentFrame();
  const reveal = eased(frame, 6, 37);
  const scanX = interpolate(reveal, [0, 1], [-28, 408]);
  return (
    <Center size={380}>
      <svg viewBox="0 0 380 380" width="100%" height="100%" style={{ overflow: "visible" }}>
        <rect x="38" y="38" width="304" height="304" rx="64" fill="none" stroke={pal.secondary} strokeOpacity="0.25" strokeWidth="3" />
        <g style={{ clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0 round 58px)` }}>
          <rect x="38" y="38" width="304" height="304" rx="64" fill={pal.primary} />
          <path d="M96 250 V190 H130 V250 Z M151 250 V130 H185 V250 Z M206 250 V96 H240 V250 Z M261 250 V164 H295 V250 Z" fill={pal.bg} />
          <path d="M96 276 H295" stroke={pal.accent} strokeWidth="12" strokeLinecap="round" />
          <circle cx="278" cy="104" r="18" fill={pal.secondary} />
        </g>
        <rect x={scanX} y="25" width="8" height="330" rx="4" fill={pal.text} opacity={clampInterp(reveal, [0, 0.08, 0.92, 1], [0, 1, 1, 0])} />
        <rect x={scanX - 28} y="25" width="28" height="330" fill={`url(#mask-fade)`} opacity="0.25" />
        <defs>
          <linearGradient id="mask-fade" x1="0" x2="1"><stop stopColor={pal.primary} stopOpacity="0" /><stop offset="1" stopColor={pal.primary} /></linearGradient>
        </defs>
      </svg>
    </Center>
  );
};

// 05 — four independent facets hinge into a dimensional diamond.
const FacetFlip: React.FC<{ pal: Palette }> = ({ pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const facets = [
    { points: "200,44 200,200 60,200", color: pal.primary, axis: "Y", from: -100 },
    { points: "200,44 340,200 200,200", color: pal.secondary, axis: "X", from: 100 },
    { points: "60,200 200,200 200,356", color: pal.accent, axis: "X", from: -100 },
    { points: "200,200 340,200 200,356", color: pal.text, axis: "Y", from: 100 },
  ];
  return (
    <Center size={400} style={{ perspective: 900 }}>
      <svg viewBox="0 0 400 400" width="100%" height="100%" style={{ overflow: "visible" }}>
        {facets.map((facet, i) => {
          const s = spring({
            frame: Math.max(0, frame - 3 - i * 4),
            fps,
            config: { damping: 13, stiffness: 115, mass: 0.8 },
          });
          return (
            <polygon
              key={i}
              points={facet.points}
              fill={facet.color}
              opacity={s}
              stroke={pal.bg}
              strokeWidth="5"
              style={{
                transformBox: "fill-box",
                transformOrigin: "center",
                transform: `perspective(700px) rotate${facet.axis}(${interpolate(s, [0, 1], [facet.from, 0])}deg) translateZ(${(1 - s) * 90}px)`,
                filter: `drop-shadow(0 18px 24px ${pal.bg}99)`,
              }}
            />
          );
        })}
        <circle cx="200" cy="200" r={12 + eased(frame, 24, 38) * 9} fill={pal.bg} opacity={eased(frame, 24, 38)} />
      </svg>
    </Center>
  );
};

// 06 — a continuous ribbon is traced, doubled, then sealed with a live node.
const StrokeTrace: React.FC<{ pal: Palette }> = ({ pal }) => {
  const frame = useCurrentFrame();
  const trace = eased(frame, 4, 39);
  const echo = eased(frame, 13, 47);
  const seal = eased(frame, 38, 51);
  return (
    <Center size={430}>
      <svg viewBox="0 0 430 430" width="100%" height="100%" style={{ overflow: "visible" }}>
        <defs>
          <filter id="trace-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path
          d="M82 235 C82 123 165 82 239 132 C306 177 298 273 220 291 C152 307 113 250 157 204 C198 161 267 178 323 110"
          fill="none"
          stroke={pal.primary}
          strokeWidth="30"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - trace}
          filter="url(#trace-glow)"
        />
        <path
          d="M101 267 C144 350 268 346 333 259 C376 202 350 127 302 92"
          fill="none"
          stroke={pal.secondary}
          strokeWidth="10"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - echo}
          opacity="0.9"
        />
        <circle cx="302" cy="92" r={10 + seal * 9} fill={pal.accent} opacity={seal} />
        <circle cx="302" cy="92" r={24 + seal * 14} fill="none" stroke={pal.accent} strokeWidth="2" opacity={seal * 0.55} />
      </svg>
    </Center>
  );
};

// 07 — a compact target mark lands with overshoot and emits timed shock rings.
const RipplePunch: React.FC<{ pal: Palette }> = ({ pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const punch = spring({ frame: Math.max(0, frame - 4), fps, config: { damping: 8, stiffness: 220, mass: 0.62 } });
  return (
    <Center size={430}>
      <svg viewBox="0 0 430 430" width="100%" height="100%" style={{ overflow: "visible" }}>
        {[0, 1, 2].map((i) => {
          const r = eased(frame, 10 + i * 6, 35 + i * 6);
          return <circle key={i} cx="215" cy="215" r={55 + r * 145} fill="none" stroke={i === 1 ? pal.accent : pal.primary} strokeWidth={5 - i} opacity={(1 - r) * 0.68} />;
        })}
        {Array.from({ length: 12 }, (_, i) => {
          const a = i * Math.PI / 6;
          const ray = eased(frame, 8 + (i % 3), 25 + (i % 3));
          const r1 = 118;
          const r2 = 118 + ray * 52;
          return (
            <line
              key={i}
              x1={215 + Math.cos(a) * r1}
              y1={215 + Math.sin(a) * r1}
              x2={215 + Math.cos(a) * r2}
              y2={215 + Math.sin(a) * r2}
              stroke={i % 2 ? pal.secondary : pal.accent}
              strokeWidth="4"
              strokeLinecap="round"
              opacity={(1 - ray) * 0.9}
            />
          );
        })}
        <g style={{ transformOrigin: "215px 215px", transform: `scale(${interpolate(punch, [0, 1], [2.4, 1])})`, opacity: punch }}>
          <rect x="123" y="123" width="184" height="184" rx="46" fill={pal.primary} transform="rotate(45 215 215)" />
          <circle cx="215" cy="215" r="63" fill={pal.bg} />
          <path d="M181 215 L211 245 L259 185" fill="none" stroke={pal.text} strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </Center>
  );
};

// 08 — mirrored curtains and mirrored brackets create a cinematic unveiling.
const SplitPanel: React.FC<{ pal: Palette }> = ({ pal }) => {
  const frame = useCurrentFrame();
  const open = eased(frame, 5, 37);
  const lock = eased(frame, 20, 43);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div
        style={{
          position: "absolute", inset: 0, right: "50%",
          background: `linear-gradient(120deg, ${pal.primary}, ${pal.bg})`,
          transform: `translateX(${-open * 100}%)`,
          boxShadow: `20px 0 70px ${pal.bg}`,
        }}
      />
      <div
        style={{
          position: "absolute", inset: 0, left: "50%",
          background: `linear-gradient(240deg, ${pal.accent}, ${pal.bg})`,
          transform: `translateX(${open * 100}%)`,
          boxShadow: `-20px 0 70px ${pal.bg}`,
        }}
      />
      <Center size={390}>
        <svg viewBox="0 0 390 390" width="100%" height="100%" style={{ overflow: "visible" }}>
          <path
            d="M181 82 H121 Q82 82 82 121 V269 Q82 308 121 308 H181 V260 H139 Q130 260 130 251 V139 Q130 130 139 130 H181 Z"
            fill={pal.primary}
            style={{ transform: `translateX(${(1 - lock) * -120}px)`, opacity: lock }}
          />
          <path
            d="M209 82 H269 Q308 82 308 121 V269 Q308 308 269 308 H209 V260 H251 Q260 260 260 251 V139 Q260 130 251 130 H209 Z"
            fill={pal.accent}
            style={{ transform: `translateX(${(1 - lock) * 120}px)`, opacity: lock }}
          />
          <rect x="176" y="112" width="38" height="166" rx="19" fill={pal.text} opacity={eased(frame, 35, 48)} />
          <circle cx="195" cy="195" r="17" fill={pal.bg} opacity={eased(frame, 35, 48)} />
        </svg>
      </Center>
    </AbsoluteFill>
  );
};

// 09 — elliptical petals bloom around an emissive core with staggered growth.
const GlowBloom: React.FC<{ pal: Palette }> = ({ pal }) => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame * 0.12) * 0.035;
  return (
    <Center size={430}>
      <svg viewBox="0 0 430 430" width="100%" height="100%" style={{ overflow: "visible", transform: `scale(${pulse})` }}>
        <defs>
          <filter id="bloom-glow" x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur stdDeviation="15" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="bloom-core"><stop stopColor={pal.text} /><stop offset="0.45" stopColor={pal.secondary} /><stop offset="1" stopColor={pal.accent} /></radialGradient>
        </defs>
        <g filter="url(#bloom-glow)">
          {Array.from({ length: 10 }, (_, i) => {
            const bloom = eased(frame, 4 + i * 1.7, 25 + i * 1.7);
            const angle = i * 36;
            return (
              <ellipse
                key={i}
                cx="215"
                cy={215 - bloom * 90}
                rx={19 * bloom}
                ry={68 * bloom}
                fill={i % 3 === 0 ? pal.accent : i % 2 ? pal.secondary : pal.primary}
                opacity={0.5 + bloom * 0.35}
                transform={`rotate(${angle + (1 - bloom) * 28} 215 215)`}
              />
            );
          })}
          <circle cx="215" cy="215" r={38 * eased(frame, 18, 36)} fill="url(#bloom-core)" />
        </g>
        <circle cx="215" cy="215" r={15 * eased(frame, 26, 39)} fill={pal.bg} />
        <circle cx="215" cy="215" r={7 * eased(frame, 30, 41)} fill={pal.text} />
      </svg>
    </Center>
  );
};

// 10 — a custom two-character monogram resolves inside a modular drafting grid.
const Monogram: React.FC<{ p: LogoStingProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const letters = (p.monogram || p.brandName.slice(0, 2)).slice(0, 2).toUpperCase();
  const grid = eased(frame, 2, 23);
  const first = eased(frame, 11, 32);
  const second = eased(frame, 18, 39);
  const frameIn = eased(frame, 27, 46);
  return (
    <Center size={420} top="37%">
      <svg viewBox="0 0 420 420" width="100%" height="100%" style={{ overflow: "visible" }}>
        <g opacity={grid * 0.26}>
          {[-120, -60, 0, 60, 120].map((offset) => (
            <React.Fragment key={offset}>
              <line x1={210 + offset} y1="40" x2={210 + offset} y2="380" stroke={pal.secondary} strokeWidth="1" />
              <line x1="40" y1={210 + offset} x2="380" y2={210 + offset} stroke={pal.secondary} strokeWidth="1" />
            </React.Fragment>
          ))}
        </g>
        <rect
          x="78" y="78" width="264" height="264" rx="34"
          fill={`${pal.bg}cc`} stroke={pal.primary} strokeWidth="5"
          pathLength={1} strokeDasharray={1} strokeDashoffset={1 - frameIn}
          transform={`rotate(${(1 - frameIn) * 45} 210 210)`}
        />
        <text
          x="202" y="258" textAnchor="end"
          fill={pal.text} fontFamily={FONT_STACK} fontSize="142" fontWeight="900"
          opacity={first}
          style={{ transform: `translateX(${(1 - first) * -55}px)`, transformOrigin: "center" }}
        >{letters[0] ?? "A"}</text>
        <text
          x="205" y="258" textAnchor="start"
          fill={pal.accent} fontFamily={FONT_STACK} fontSize="142" fontWeight="300"
          opacity={second}
          style={{ transform: `translateX(${(1 - second) * 55}px)`, transformOrigin: "center" }}
        >{letters[1] ?? letters[0] ?? "X"}</text>
        <path d="M210 100 V320" stroke={pal.secondary} strokeWidth="3" opacity={frameIn * 0.55} />
        <circle cx="210" cy="100" r="6" fill={pal.accent} opacity={frameIn} />
        <circle cx="210" cy="320" r="6" fill={pal.accent} opacity={frameIn} />
      </svg>
    </Center>
  );
};

const VARIANTS: Record<LogoVariant, React.FC<{ p: LogoStingProps; pal: Palette }>> = {
  "shape-draw": ({ pal }) => <ShapeDraw pal={pal} />,
  "light-sweep": ({ pal }) => <LightSweep pal={pal} />,
  "particle-assemble": ({ pal }) => <ParticleAssemble pal={pal} />,
  "mask-wipe": ({ pal }) => <MaskWipe pal={pal} />,
  "facet-flip": ({ pal }) => <FacetFlip pal={pal} />,
  "stroke-trace": ({ pal }) => <StrokeTrace pal={pal} />,
  "ripple-punch": ({ pal }) => <RipplePunch pal={pal} />,
  "split-panel": ({ pal }) => <SplitPanel pal={pal} />,
  "glow-bloom": ({ pal }) => <GlowBloom pal={pal} />,
  monogram: ({ p, pal }) => <Monogram p={p} pal={pal} />,
};

export const LogoStingTemplate: React.FC<LogoStingProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? VARIANTS["shape-draw"];
  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg, overflow: "hidden" }}>
      <GradientMeshBackground
        palette={pal}
        speed={props.variant === "glow-bloom" ? 0.65 : 0.35}
        blobs={props.variant === "split-panel" || props.variant === "monogram" ? 3 : 4}
      />
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 43%, transparent 0%, ${pal.bg}22 46%, ${pal.bg}aa 100%)` }} />
      <FadeEdges inFrames={8} outFrames={16}>
        <MotionStage>
          <Variant p={props} pal={pal} />
          <Wordmark p={props} pal={pal} start={props.variant === "particle-assemble" ? 34 : 29} />
        </MotionStage>
      </FadeEdges>
      <NoiseGrainOverlay opacity={0.035} />
    </AbsoluteFill>
  );
};

const familyCast = (component: React.FC<LogoStingProps>) =>
  component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "logo-sting-orbit-draw": familyCast(LogoStingTemplate),
  "logo-sting-prism-sweep": familyCast(LogoStingTemplate),
  "logo-sting-particle-forge": familyCast(LogoStingTemplate),
  "logo-sting-signal-wipe": familyCast(LogoStingTemplate),
  "logo-sting-facet-flip": familyCast(LogoStingTemplate),
  "logo-sting-ribbon-trace": familyCast(LogoStingTemplate),
  "logo-sting-ripple-punch": familyCast(LogoStingTemplate),
  "logo-sting-split-unveil": familyCast(LogoStingTemplate),
  "logo-sting-aurora-bloom": familyCast(LogoStingTemplate),
  "logo-sting-monogram-grid": familyCast(LogoStingTemplate),
};
