import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { resolvePalette, seededRand } from "../lib/primitives";

/** Procedural geometric motion studies. Every shape is generated locally for deterministic renders. */
type AbstractGeometryVariant =
  | "orbital-rings"
  | "folding-cube"
  | "parametric-knot"
  | "crystal-growth"
  | "tunnel-passage"
  | "ribbon-knot"
  | "stacked-prisms"
  | "magnetic-spheres"
  | "wireframe-bloom"
  | "geometry-morph";

export interface AbstractGeometryProps {
  variant: AbstractGeometryVariant;
  headline: string;
  subline: string;
  paletteName: string;
  seed?: number;
  density?: number;
  speed?: number;
}

type Palette = ReturnType<typeof resolvePalette>;
type VariantProps = { p: AbstractGeometryProps; pal: Palette };

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const SVG_W = 1000;
const SVG_H = 600;
const TAU = Math.PI * 2;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const reveal = (frame: number, start = 0, duration = 24) => clamp01((frame - start) / duration);
const safeDensity = (n: number | undefined, min = 3, max = 18) => Math.round(Math.min(max, Math.max(min, n ?? 8)));
const points = (items: Array<[number, number]>) => items.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
const polar = (cx: number, cy: number, radius: number, angle: number): [number, number] => [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];

const SceneSvg: React.FC<{ children: React.ReactNode; pal: Palette; seed: number }> = ({ children, pal, seed }) => (
  <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="presentation">
    <defs>
      <filter id={`geo-glow-${seed}`} x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <linearGradient id={`geo-grad-${seed}`} x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor={pal.primary} /><stop offset="0.52" stopColor={pal.secondary} /><stop offset="1" stopColor={pal.accent} />
      </linearGradient>
      <radialGradient id={`geo-orb-${seed}`}>
        <stop offset="0" stopColor={pal.text} stopOpacity="0.9" /><stop offset="0.16" stopColor={pal.accent} stopOpacity="0.9" /><stop offset="1" stopColor={pal.primary} stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width={SVG_W} height={SVG_H} fill="transparent" />
    {children}
  </svg>
);

const OrbitalRings: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const density = safeDensity(p.density, 4, 12);
  const speed = p.speed ?? 1;
  const seed = p.seed ?? 17;
  return (
    <SceneSvg pal={pal} seed={seed}>
      <g transform="translate(595 305)" filter={`url(#geo-glow-${seed})`}>
        {Array.from({ length: density }, (_, i) => {
          const r = 44 + i * 25;
          const tilt = -38 + i * 8 + Math.sin(frame * 0.01 * speed + i) * 5;
          const rotation = frame * speed * (0.4 + i * 0.07) * (i % 2 ? -1 : 1) + seededRand(seed + i) * 60;
          return <ellipse key={i} rx={r} ry={r * (0.25 + (i % 3) * 0.11)} fill="none" stroke={[pal.primary, pal.secondary, pal.accent][i % 3]} strokeWidth={i % 3 === 0 ? 3 : 1.5} opacity={0.72 - i * 0.035} transform={`rotate(${tilt + rotation})`} />;
        })}
        <circle r="36" fill={`url(#geo-orb-${seed})`} opacity="0.95" />
        {Array.from({ length: density }, (_, i) => {
          const a = frame * 0.018 * speed * (i % 2 ? -1 : 1) + seededRand(seed + i * 13) * TAU;
          const r = 70 + (i % 4) * 36;
          const [x, y] = polar(0, 0, r, a);
          return <circle key={`dot-${i}`} cx={x} cy={y * 0.42} r={3 + (i % 3)} fill={pal.text} opacity="0.86" />;
        })}
      </g>
      <line x1="110" y1="526" x2="900" y2="526" stroke={pal.text} opacity="0.14" />
      <text x="112" y="554" fill={pal.text} opacity="0.45" fontFamily={FONT} fontSize="14" letterSpacing="4">ORBIT / 01</text>
    </SceneSvg>
  );
};

const FoldingCube: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const t = reveal(frame, 8, 30);
  const spin = frame * (p.speed ?? 1) * 0.65;
  const cx = 600;
  const cy = 300;
  const s = 150;
  const tilt = Math.sin(frame * 0.035) * 18;
  const face = (dx: number, dy: number, color: string, opacity: number, transform: string) => (
    <polygon points={points([[cx + dx, cy + dy], [cx + dx + s, cy + dy - 54], [cx + dx + s, cy + dy + s - 54], [cx + dx, cy + dy + s]])} fill={color} fillOpacity={opacity} stroke={pal.text} strokeOpacity="0.35" strokeWidth="2" transform={transform} />
  );
  return (
    <SceneSvg pal={pal} seed={p.seed ?? 23}>
      <g opacity={t} transform={`rotate(${spin} ${cx} ${cy})`}>
        {face(-85, -60, pal.primary, 0.72, `skewY(${tilt * 0.25})`)}
        {face(65, -114, pal.secondary, 0.56, `skewY(${-tilt * 0.25})`)}
        {face(65, 36, pal.accent, 0.72, `skewY(${tilt * 0.15})`)}
        <path d={`M${cx - 85} ${cy - 60} L${cx + 65} ${cy - 114} L${cx + 65} ${cy + 36} L${cx - 85} ${cy + 90} Z`} fill="none" stroke={pal.text} strokeWidth="3" opacity="0.75" />
      </g>
      <text x="130" y="180" fill={pal.accent} fontFamily={FONT} fontSize="15" letterSpacing="5" opacity={t}>FOLD / 02</text>
      <path d="M130 205 H330" stroke={pal.text} opacity="0.25" />
      <text x="130" y="231" fill={pal.text} opacity="0.45" fontFamily={FONT} fontSize="13">PLANES IN MOTION</text>
    </SceneSvg>
  );
};

const ParametricKnot: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const seed = p.seed ?? 41;
  const speed = p.speed ?? 1;
  const count = 180;
  const d = Array.from({ length: count }, (_, i) => {
    const u = (i / (count - 1)) * TAU * 2;
    const phase = frame * 0.018 * speed;
    const r = 118 + 34 * Math.cos(3 * u + phase);
    const x = 590 + r * Math.cos(2 * u + phase * 0.3);
    const y = 300 + r * Math.sin(2 * u + phase * 0.3) * 0.56;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
  return (
    <SceneSvg pal={pal} seed={seed}>
      <path d={d} fill="none" stroke={pal.primary} strokeWidth="18" opacity="0.2" filter={`url(#geo-glow-${seed})`} />
      <path d={d} fill="none" stroke={`url(#geo-grad-${seed})`} strokeWidth="7" strokeLinecap="round" filter={`url(#geo-glow-${seed})`} />
      <circle cx="590" cy="300" r="150" fill="none" stroke={pal.text} strokeOpacity="0.16" strokeDasharray="3 16" />
      <text x="125" y="178" fill={pal.accent} fontFamily={FONT} fontSize="15" letterSpacing="5">KNOT / 03</text>
      <text x="125" y="520" fill={pal.text} opacity="0.55" fontFamily={FONT} fontSize="16" letterSpacing="3">PARAMETRIC LOOP / 2 × 3</text>
    </SceneSvg>
  );
};

const CrystalGrowth: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const density = safeDensity(p.density, 5, 12);
  const seed = p.seed ?? 61;
  return (
    <SceneSvg pal={pal} seed={seed}>
      {Array.from({ length: density }, (_, i) => {
        const delay = i * 5;
        const t = reveal(frame, delay, 22);
        const h = 66 + i * 20;
        const x = 520 + (i % 5) * 44 - Math.floor(i / 5) * 18;
        const y = 482 - h * t;
        const w = 40 + (i % 3) * 12;
        const color = [pal.primary, pal.secondary, pal.accent][i % 3];
        return <polygon key={i} points={points([[x, 482], [x + w / 2, y], [x + w, 482]])} fill={color} fillOpacity={0.3 + t * 0.5} stroke={pal.text} strokeOpacity="0.35" strokeWidth="2" />;
      })}
      <path d="M380 482 H770" stroke={pal.text} strokeOpacity="0.28" strokeWidth="2" />
      <text x="116" y="185" fill={pal.accent} fontFamily={FONT} fontSize="15" letterSpacing="5">GROWTH / 04</text>
      <text x="116" y="215" fill={pal.text} opacity="0.5" fontFamily={FONT} fontSize="14" letterSpacing="2">FORM FOLLOWS TIME</text>
    </SceneSvg>
  );
};

const TunnelPassage: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const density = safeDensity(p.density, 7, 18);
  const speed = p.speed ?? 1;
  const seed = p.seed ?? 83;
  return (
    <SceneSvg pal={pal} seed={seed}>
      {Array.from({ length: density }, (_, i) => {
        const z = ((i / density + frame * 0.006 * speed) % 1 + 1) % 1;
        const scale = 0.12 + z * 1.18;
        const x = 650 + Math.sin(i * 2.1) * 28 * z;
        const y = 306 + Math.cos(i * 1.7) * 18 * z;
        const w = 120 * scale;
        const h = 82 * scale;
        return <rect key={i} x={x - w / 2} y={y - h / 2} width={w} height={h} rx={10 * scale} fill="none" stroke={[pal.primary, pal.secondary, pal.accent][i % 3]} strokeWidth={Math.max(1, 5 - z * 3)} opacity={0.18 + z * 0.65} transform={`rotate(${i * 11 + frame * 0.12} ${x} ${y})`} />;
      })}
      <circle cx="650" cy="306" r="17" fill={pal.text} opacity="0.85" />
      <path d="M112 475 H370" stroke={pal.text} strokeOpacity="0.3" />
      <text x="112" y="178" fill={pal.accent} fontFamily={FONT} fontSize="15" letterSpacing="5">PASSAGE / 05</text>
      <text x="112" y="510" fill={pal.text} opacity="0.48" fontFamily={FONT} fontSize="13" letterSpacing="3">DEPTH IS A RHYTHM</text>
    </SceneSvg>
  );
};

const RibbonKnot: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const seed = p.seed ?? 107;
  const speed = p.speed ?? 1;
  return (
    <SceneSvg pal={pal} seed={seed}>
      {Array.from({ length: 5 }, (_, i) => {
        const phase = frame * 0.025 * speed + i * 0.72;
        const y = 300 + Math.sin(phase) * 62;
        const d = `M140 ${y} C300 ${y - 180} 420 ${y + 180} 590 ${300 + Math.sin(phase + 1.5) * 70} S820 ${y - 140} 900 ${300 + Math.cos(phase) * 90}`;
        return <path key={i} d={d} fill="none" stroke={[pal.primary, pal.secondary, pal.accent, pal.text, pal.primary][i]} strokeWidth={28 - i * 3} opacity={0.23 + i * 0.12} strokeLinecap="round" filter={i === 2 ? `url(#geo-glow-${seed})` : undefined} />;
      })}
      <text x="125" y="175" fill={pal.accent} fontFamily={FONT} fontSize="15" letterSpacing="5">RIBBON / 06</text>
      <text x="125" y="535" fill={pal.text} opacity="0.54" fontFamily={FONT} fontSize="14" letterSpacing="3">A LINE CAN BECOME A VOLUME</text>
    </SceneSvg>
  );
};

const StackedPrisms: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const density = safeDensity(p.density, 5, 12);
  const seed = p.seed ?? 131;
  return (
    <SceneSvg pal={pal} seed={seed}>
      {Array.from({ length: density }, (_, i) => {
        const t = reveal(frame, i * 3, 18);
        const x = 530 + i * 20 - t * 12;
        const y = 466 - i * 30;
        const w = 200 - i * 8;
        const h = 32 + (i % 3) * 9;
        const depth = 38;
        const col = [pal.primary, pal.secondary, pal.accent][i % 3];
        return <g key={i} opacity={t}><polygon points={points([[x, y], [x + w, y], [x + w - depth, y - depth / 2], [x - depth, y - depth / 2]])} fill={col} fillOpacity="0.6" stroke={pal.text} strokeOpacity="0.3" /><polygon points={points([[x, y], [x + w, y], [x + w, y + h], [x, y + h]])} fill={col} fillOpacity="0.32" stroke={pal.text} strokeOpacity="0.35" /></g>;
      })}
      <text x="120" y="175" fill={pal.accent} fontFamily={FONT} fontSize="15" letterSpacing="5">PRISMS / 07</text>
      <text x="120" y="520" fill={pal.text} opacity="0.5" fontFamily={FONT} fontSize="14" letterSpacing="3">LAYER / LIFT / REPEAT</text>
    </SceneSvg>
  );
};

const MagneticSpheres: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const density = safeDensity(p.density, 5, 12);
  const seed = p.seed ?? 151;
  const centers = Array.from({ length: density }, (_, i) => {
    const a = frame * 0.012 * (p.speed ?? 1) + seededRand(seed + i) * TAU;
    const r = 48 + (i % 4) * 38;
    return [620 + Math.cos(a) * r, 300 + Math.sin(a * 1.4) * r * 0.65] as [number, number];
  });
  return (
    <SceneSvg pal={pal} seed={seed}>
      {centers.map(([x1, y1], i) => centers.slice(i + 1).map(([x2, y2], j) => <line key={`${i}-${j}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={pal.secondary} strokeOpacity={0.12 + 0.08 * Math.sin(frame * 0.04 + i)} strokeWidth="2" />))}
      {centers.map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r={18 + (i % 3) * 4} fill={i % 2 ? pal.primary : pal.accent} opacity="0.82" filter={i === 0 ? `url(#geo-glow-${seed})` : undefined} /><circle cx={x - 5} cy={y - 6} r="4" fill={pal.text} opacity="0.7" /></g>)}
      <text x="120" y="178" fill={pal.accent} fontFamily={FONT} fontSize="15" letterSpacing="5">FIELD / 08</text>
      <text x="120" y="515" fill={pal.text} opacity="0.5" fontFamily={FONT} fontSize="14" letterSpacing="3">ATTRACTION / DISTANCE / FORCE</text>
    </SceneSvg>
  );
};

const WireframeBloom: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const density = safeDensity(p.density, 4, 10);
  const seed = p.seed ?? 173;
  return (
    <SceneSvg pal={pal} seed={seed}>
      {Array.from({ length: density }, (_, i) => {
        const s = 42 + i * 32 + Math.sin(frame * 0.03 + i) * 5;
        const cx = 625 + Math.sin(frame * 0.012 + i * 0.9) * 28;
        const cy = 306 + Math.cos(frame * 0.015 + i * 1.2) * 22;
        const poly = [[cx, cy - s], [cx + s, cy], [cx, cy + s], [cx - s, cy]] as Array<[number, number]>;
        return <polygon key={i} points={points(poly)} fill="none" stroke={[pal.primary, pal.secondary, pal.accent][i % 3]} strokeWidth={i === density - 1 ? 3 : 1.5} opacity={0.16 + i * 0.07} transform={`rotate(${frame * (0.2 + i * 0.04)} ${cx} ${cy})`} filter={i === density - 1 ? `url(#geo-glow-${seed})` : undefined} />;
      })}
      <circle cx="625" cy="306" r="5" fill={pal.text} />
      <text x="120" y="178" fill={pal.accent} fontFamily={FONT} fontSize="15" letterSpacing="5">BLOOM / 09</text>
      <text x="120" y="515" fill={pal.text} opacity="0.5" fontFamily={FONT} fontSize="14" letterSpacing="3">WIREFRAME / LIGHT / SPACE</text>
    </SceneSvg>
  );
};

const GeometryMorph: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const seed = p.seed ?? 191;
  const phase = (Math.sin(frame * 0.025 * (p.speed ?? 1)) + 1) / 2;
  const n = 8;
  const poly = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * TAU - Math.PI / 2;
    const circleR = 145;
    const squareR = 145 / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)));
    const r = circleR + (squareR - circleR) * phase;
    return polar(625, 304, r, a);
  });
  return (
    <SceneSvg pal={pal} seed={seed}>
      <polygon points={points(poly)} fill={`url(#geo-grad-${seed})`} fillOpacity="0.36" stroke={pal.text} strokeWidth="3" strokeOpacity="0.75" filter={`url(#geo-glow-${seed})`} />
      <polygon points={points(poly.map(([x, y]) => [625 + (x - 625) * 0.56, 304 + (y - 304) * 0.56]))} fill="none" stroke={pal.accent} strokeWidth="2" strokeDasharray="5 9" opacity="0.8" />
      {poly.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5" fill={pal.text} />)}
      <text x="120" y="178" fill={pal.accent} fontFamily={FONT} fontSize="15" letterSpacing="5">MORPH / 10</text>
      <text x="120" y="515" fill={pal.text} opacity="0.5" fontFamily={FONT} fontSize="14" letterSpacing="3">CIRCLE → POLYGON → FORM</text>
    </SceneSvg>
  );
};

const VARIANTS: Record<AbstractGeometryVariant, React.FC<VariantProps>> = {
  "orbital-rings": OrbitalRings,
  "folding-cube": FoldingCube,
  "parametric-knot": ParametricKnot,
  "crystal-growth": CrystalGrowth,
  "tunnel-passage": TunnelPassage,
  "ribbon-knot": RibbonKnot,
  "stacked-prisms": StackedPrisms,
  "magnetic-spheres": MagneticSpheres,
  "wireframe-bloom": WireframeBloom,
  "geometry-morph": GeometryMorph,
};

export const AbstractGeometryTemplate: React.FC<AbstractGeometryProps> = (props) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? OrbitalRings;
  const intro = reveal(frame, 0, 18);
  const outro = clamp01((durationInFrames - frame) / 18);
  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden" }}>
      <Variant p={props} pal={pal} />
      <AbsoluteFill style={{ pointerEvents: "none", opacity: intro * outro }}>
        <div style={{ position: "absolute", left: "7.5%", top: "8%", maxWidth: "38%", color: pal.text, fontFamily: FONT }}>
          <div style={{ fontSize: 16, letterSpacing: "0.32em", textTransform: "uppercase", color: pal.accent, fontWeight: 700 }}>Abstract geometry</div>
          <div style={{ marginTop: 24, fontSize: "clamp(38px, 5.5vw, 88px)", lineHeight: 0.95, letterSpacing: "-0.06em", fontWeight: 800 }}>{props.headline}</div>
          <div style={{ marginTop: 18, fontSize: 19, letterSpacing: "0.08em", color: `${pal.text}aa` }}>{props.subline}</div>
        </div>
        <div style={{ position: "absolute", right: "7.5%", bottom: "8%", fontFamily: FONT, color: `${pal.text}88`, fontSize: 13, letterSpacing: "0.22em", textTransform: "uppercase" }}>Original motion study · 0{Object.keys(VARIANTS).indexOf(props.variant) + 1}/10</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const familyCast = (c: React.FC<AbstractGeometryProps>) => c as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "abstract-geometry-orbital-rings": familyCast(AbstractGeometryTemplate),
  "abstract-geometry-folding-cube": familyCast(AbstractGeometryTemplate),
  "abstract-geometry-parametric-knot": familyCast(AbstractGeometryTemplate),
  "abstract-geometry-crystal-growth": familyCast(AbstractGeometryTemplate),
  "abstract-geometry-tunnel-passage": familyCast(AbstractGeometryTemplate),
  "abstract-geometry-ribbon-knot": familyCast(AbstractGeometryTemplate),
  "abstract-geometry-stacked-prisms": familyCast(AbstractGeometryTemplate),
  "abstract-geometry-magnetic-spheres": familyCast(AbstractGeometryTemplate),
  "abstract-geometry-wireframe-bloom": familyCast(AbstractGeometryTemplate),
  "abstract-geometry-geometry-morph": familyCast(AbstractGeometryTemplate),
};
