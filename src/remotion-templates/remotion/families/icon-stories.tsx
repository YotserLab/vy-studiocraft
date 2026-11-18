import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clampInterp, resolvePalette, type Palette } from "../lib/primitives";

type IconStoriesVariant =
  | "icon-grid"
  | "stroke-draw"
  | "feature-icons"
  | "icon-to-pattern"
  | "filled-outline"
  | "icon-family"
  | "icon-morph"
  | "navigation-set"
  | "service-icons"
  | "icon-lockup";

export interface IconStoriesProps {
  variant: IconStoriesVariant;
  icons: string[];
  labels: string[];
  strokeColor: string;
  fillColor: string;
  grid: number;
  highlightIndex: number;
  brandName: string;
  paletteName: string;
  accentColor?: string;
  headline?: string;
  subline?: string;
  speed?: number;
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const TAU = Math.PI * 2;
const ICONS = ["spark", "arrow", "shield", "heart", "bolt", "globe", "chat", "play"];
const DEFAULT_LABELS = ["Discover", "Connect", "Protect", "Delight", "Accelerate", "Explore", "Support", "Create"];
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const progress = (frame: number, start: number, length = 24) => clamp01((frame - start) / length);
const listOr = (value: string[] | undefined, fallback: string[]) => value && value.length ? value : fallback;
const safeIndex = (n: number, length: number) => ((Math.round(n) % length) + length) % length;

function pointsForIcon(kind: string, cx: number, cy: number, size: number): string {
  const s = size / 2;
  if (kind === "arrow") return `${cx - s * 0.75},${cy} ${cx + s * 0.35},${cy} ${cx + s * 0.35},${cy - s * 0.4} ${cx + s * 0.86},${cy} ${cx + s * 0.35},${cy + s * 0.4} ${cx + s * 0.35},${cy + s * 0.02} ${cx - s * 0.75},${cy + s * 0.02}`;
  if (kind === "spark") return `${cx},${cy - s} ${cx + s * 0.18},${cy - s * 0.18} ${cx + s},${cy} ${cx + s * 0.18},${cy + s * 0.18} ${cx},${cy + s} ${cx - s * 0.18},${cy + s * 0.18} ${cx - s},${cy} ${cx - s * 0.18},${cy - s * 0.18}`;
  if (kind === "shield") return `${cx},${cy - s} ${cx + s * 0.72},${cy - s * 0.66} ${cx + s * 0.58},${cy + s * 0.25} ${cx},${cy + s} ${cx - s * 0.58},${cy + s * 0.25} ${cx - s * 0.72},${cy - s * 0.66}`;
  if (kind === "heart") return `${cx},${cy + s * 0.78} ${cx - s * 0.83},${cy - s * 0.05} ${cx - s * 0.72},${cy - s * 0.63} ${cx - s * 0.35},${cy - s * 0.82} ${cx},${cy - s * 0.48} ${cx + s * 0.35},${cy - s * 0.82} ${cx + s * 0.72},${cy - s * 0.63} ${cx + s * 0.83},${cy - s * 0.05}`;
  if (kind === "bolt") return `${cx + s * 0.18},${cy - s} ${cx - s * 0.55},${cy + s * 0.05} ${cx - s * 0.06},${cy + s * 0.05} ${cx - s * 0.22},${cy + s} ${cx + s * 0.6},${cy - s * 0.17} ${cx + s * 0.14},${cy - s * 0.17}`;
  if (kind === "globe") return `${cx},${cy - s} ${cx + s * 0.67},${cy - s * 0.68} ${cx + s},${cy} ${cx + s * 0.67},${cy + s * 0.68} ${cx},${cy + s} ${cx - s * 0.67},${cy + s * 0.68} ${cx - s},${cy} ${cx - s * 0.67},${cy - s * 0.68}`;
  if (kind === "chat") return `${cx - s * 0.82},${cy - s * 0.6} H${cx + s * 0.82} V${cy + s * 0.42} H${cx + s * 0.08} L${cx - s * 0.48},${cy + s * 0.88} V${cy + s * 0.42} H${cx - s * 0.82} Z`;
  return `${cx - s * 0.72},${cy - s * 0.82} H${cx + s * 0.2} L${cx + s * 0.72},${cy - s * 0.3} V${cy + s * 0.82} H${cx - s * 0.72} Z`;
}

const IconGlyph: React.FC<{
  kind: string;
  size?: number;
  stroke: string;
  fill: string;
  progress?: number;
  filled?: boolean;
  rotate?: number;
  opacity?: number;
}> = ({ kind, size = 92, stroke, fill, progress: draw = 1, filled = false, rotate = 0, opacity = 1 }) => {
  const view = 120;
  const pts = pointsForIcon(kind, 60, 60, 72);
  const dash = 360;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${view} ${view}`} role="img" aria-label={`${kind} icon`} style={{ overflow: "visible", opacity, transform: `rotate(${rotate}deg)` }}>
      <defs><filter id={`icon-shadow-${kind}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2" /></filter></defs>
      <circle cx="60" cy="60" r="50" fill={filled ? `${fill}22` : "transparent"} stroke={stroke} strokeOpacity="0.2" strokeWidth="1.5" />
      <polygon points={pts} fill={filled ? fill : "transparent"} fillOpacity={filled ? 0.82 : 0} stroke={stroke} strokeWidth="5" strokeLinejoin="round" strokeDasharray={dash} strokeDashoffset={dash * (1 - clamp01(draw))} style={{ transition: "none" }} />
      <path d={kind === "shield" ? "M60 37 V72 M43 56 H77" : kind === "heart" ? "M42 59 L55 70 L79 46" : kind === "chat" ? "M46 57 H74 M46 67 H65" : kind === "globe" ? "M31 60 H89 M60 25 C46 42 46 78 60 95 M60 25 C74 42 74 78 60 95" : "M43 60 H77"} fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeOpacity={draw} />
    </svg>
  );
};

const IconScene: React.FC<{ pal: Palette; children: React.ReactNode }> = ({ pal, children }) => (
  <svg viewBox="0 0 1200 680" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="presentation">
    <defs>
      <linearGradient id="icon-surface" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={pal.primary} stopOpacity="0.2" /><stop offset="1" stopColor={pal.accent} stopOpacity="0.03" /></linearGradient>
      <radialGradient id="icon-glow"><stop offset="0" stopColor={pal.accent} stopOpacity="0.4" /><stop offset="1" stopColor={pal.accent} stopOpacity="0" /></radialGradient>
    </defs>
    <rect width="1200" height="680" fill="url(#icon-surface)" />
    <circle cx="1000" cy="90" r="260" fill="url(#icon-glow)" opacity="0.6" />
    <path d="M0 566 H1200" stroke={pal.text} strokeOpacity="0.12" />
    {children}
  </svg>
);

const IconGrid: React.FC<{ p: IconStoriesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const icons = listOr(p.icons, ICONS);
  const labels = listOr(p.labels, DEFAULT_LABELS);
  const cols = Math.max(2, Math.min(4, Math.round(p.grid || 4)));
  return <IconScene pal={pal}>{icons.slice(0, 8).map((kind, i) => {
    const col = i % cols; const row = Math.floor(i / cols); const x = 180 + col * 220; const y = 155 + row * 190; const t = progress(frame, i * 7, 26); const active = i === safeIndex(p.highlightIndex, icons.length);
    return <g key={`${kind}-${i}`} opacity={t} transform={`translate(0 ${(1 - t) * 24})`}><rect x={x - 78} y={y - 82} width="156" height="156" rx="22" fill={active ? `${pal.accent}22` : `${pal.text}05`} stroke={active ? pal.accent : pal.text} strokeOpacity={active ? 0.85 : 0.15} strokeWidth={active ? 2 : 1} /><g transform={`translate(${x - 45} ${y - 46})`}><IconGlyph kind={kind} size={90} stroke={active ? pal.accent : pal.text} fill={pal.primary} filled={active} /></g><text x={x} y={y + 105} textAnchor="middle" fill={pal.text} opacity="0.72" fontFamily={FONT} fontSize="16" letterSpacing="2">{labels[i] ?? `ICON ${i + 1}`}</text></g>;
  })}</IconScene>;
};

const StrokeDraw: React.FC<{ p: IconStoriesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const icons = listOr(p.icons, ICONS); const active = Math.floor(frame / 24) % Math.min(icons.length, 6); const draw = progress(frame % 24, 2, 18);
  return <IconScene pal={pal}><g transform="translate(90 92)">{icons.slice(0, 6).map((kind, i) => { const x = i * 180; const selected = i === active; return <g key={kind + i} opacity={selected ? 1 : 0.35}><rect x={x} y="0" width="144" height="420" rx="18" fill={selected ? `${pal.primary}18` : "transparent"} stroke={selected ? pal.accent : pal.text} strokeOpacity={selected ? 0.8 : 0.12} /><g transform={`translate(${x + 26} 110)`}><IconGlyph kind={kind} size={92} stroke={selected ? pal.accent : pal.text} fill={pal.primary} progress={selected ? draw : 1} filled={false} /></g><text x={x + 72} y="260" textAnchor="middle" fill={pal.text} fontFamily={MONO} fontSize="14" letterSpacing="2">DRAW {String(i + 1).padStart(2, "0")}</text><rect x={x + 25} y="300" width="94" height="3" fill={pal.text} opacity="0.16" /><rect x={x + 25} y="300" width={94 * (selected ? draw : 0.35)} height="3" fill={pal.accent} /></g>; })}</g></IconScene>;
};

const FeatureIcons: React.FC<{ p: IconStoriesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const icons = listOr(p.icons, ICONS); const labels = listOr(p.labels, DEFAULT_LABELS);
  return <IconScene pal={pal}><g transform="translate(130 104)">{icons.slice(0, 5).map((kind, i) => { const t = progress(frame, i * 9, 24); return <g key={kind + i} opacity={t} transform={`translate(${i * 214} ${(1 - t) * 30})`}><circle cx="74" cy="76" r="68" fill={i === safeIndex(p.highlightIndex, 5) ? `${pal.accent}27` : `${pal.primary}18`} stroke={i === safeIndex(p.highlightIndex, 5) ? pal.accent : pal.text} strokeOpacity="0.35" strokeWidth="2" /><g transform="translate(28 30)"><IconGlyph kind={kind} size={92} stroke={i === safeIndex(p.highlightIndex, 5) ? pal.accent : pal.text} fill={pal.primary} filled={i === safeIndex(p.highlightIndex, 5)} /></g><text x="74" y="190" textAnchor="middle" fill={pal.text} fontFamily={FONT} fontWeight="700" fontSize="19">{labels[i] ?? `Feature ${i + 1}`}</text><text x="74" y="220" textAnchor="middle" fill={pal.text} opacity="0.45" fontFamily={FONT} fontSize="13">BUILT INTO THE FLOW</text></g>; })}</g></IconScene>;
};

const Pattern: React.FC<{ p: IconStoriesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const icons = listOr(p.icons, ICONS); const rows = 5; const cols = 10; const cell = 140; const shift = (frame * (p.speed ?? 1) * 0.6) % cell;
  return <IconScene pal={pal}>{Array.from({ length: rows * cols }, (_, i) => { const col = i % cols; const row = Math.floor(i / cols); const x = -20 + col * cell - shift; const y = 105 + row * 112; const opacity = 0.28 + ((i + Math.floor(frame / 20)) % 4) * 0.12; return <g key={i} opacity={opacity} transform={`translate(${x - 33} ${y - 33}) rotate(${((i % 3) - 1) * 7} ${33} ${33})`}><IconGlyph kind={icons[i % icons.length]} size={66} stroke={i % 3 ? pal.text : pal.accent} fill={pal.primary} filled={i % 6 === 0} /></g>; })}<rect x="72" y="72" width="1058" height="480" fill="none" stroke={pal.accent} strokeOpacity="0.25" strokeWidth="2" strokeDasharray="4 14" /></IconScene>;
};

const FilledOutline: React.FC<{ p: IconStoriesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const icons = listOr(p.icons, ICONS); const phase = (Math.sin(frame * 0.035 * (p.speed ?? 1)) + 1) / 2;
  return <IconScene pal={pal}><g transform="translate(160 118)">{icons.slice(0, 4).map((kind, i) => { const t = clamp01(phase + i * 0.08); return <g key={kind + i} transform={`translate(${i * 240} 0)`}><circle cx="90" cy="90" r="88" fill={pal.bg} stroke={pal.text} strokeOpacity="0.2" /><g transform="translate(42 42)"><IconGlyph kind={kind} size={96} stroke={pal.accent} fill={pal.primary} progress={t} filled={t > 0.5} opacity={1} /></g><text x="90" y="220" fill={pal.text} textAnchor="middle" fontFamily={MONO} fontSize="14" letterSpacing="2">{t > 0.5 ? "FILLED" : "OUTLINE"}</text><line x1="24" y1="244" x2="156" y2="244" stroke={pal.text} opacity="0.2" /><line x1="24" y1="244" x2={24 + t * 132} y2="244" stroke={pal.accent} strokeWidth="3" /></g>; })}</g></IconScene>;
};

const IconFamily: React.FC<{ p: IconStoriesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const icons = listOr(p.icons, ICONS); const labels = listOr(p.labels, DEFAULT_LABELS); const centerX = 600; const centerY = 316;
  return <IconScene pal={pal}><circle cx={centerX} cy={centerY} r="188" fill="none" stroke={pal.text} strokeOpacity="0.12" strokeDasharray="2 12" /><circle cx={centerX} cy={centerY} r="78" fill={`${pal.accent}19`} stroke={pal.accent} strokeOpacity="0.7" /><g transform={`translate(${centerX - 46} ${centerY - 46})`}><IconGlyph kind={icons[0]} size={92} stroke={pal.accent} fill={pal.primary} filled /></g>{icons.slice(1, 7).map((kind, i) => { const a = -Math.PI / 2 + (i / 6) * TAU; const x = centerX + Math.cos(a) * 220; const y = centerY + Math.sin(a) * 180; const t = progress(frame, i * 8, 22); return <g key={kind + i} opacity={t}><line x1={centerX + Math.cos(a) * 90} y1={centerY + Math.sin(a) * 70} x2={x} y2={y} stroke={pal.accent} strokeOpacity="0.25" strokeDasharray="5 8" /><circle cx={x} cy={y} r="58" fill={`${pal.primary}1c`} stroke={pal.text} strokeOpacity="0.4" /><g transform={`translate(${x - 35} ${y - 35})`}><IconGlyph kind={kind} size={70} stroke={pal.text} fill={pal.primary} /></g><text x={x} y={y + 86} textAnchor="middle" fill={pal.text} opacity="0.65" fontFamily={FONT} fontSize="13">{labels[i + 1] ?? `Part ${i + 1}`}</text></g>; })}</IconScene>;
};

const IconMorph: React.FC<{ p: IconStoriesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const icons = listOr(p.icons, ICONS); const phase = (Math.sin(frame * 0.03 * (p.speed ?? 1)) + 1) / 2; const a = icons[Math.floor(frame / 48) % icons.length]; const b = icons[(Math.floor(frame / 48) + 1) % icons.length];
  return <IconScene pal={pal}><text x="120" y="142" fill={pal.accent} fontFamily={MONO} fontSize="15" letterSpacing="4">MORPH / ICON LANGUAGE</text><g transform="translate(480 180)"><circle cx="120" cy="120" r="145" fill={`${pal.primary}18`} stroke={pal.accent} strokeOpacity="0.4" strokeWidth="2" /><g transform={`translate(72 72) rotate(${(phase - 0.5) * 8})`}><IconGlyph kind={phase < 0.5 ? a : b} size={96} stroke={pal.accent} fill={pal.primary} progress={1} filled={phase > 0.58} /></g><circle cx="120" cy="120" r="145" fill="none" stroke={pal.text} strokeOpacity="0.2" strokeDasharray="3 13" transform={`rotate(${frame * 0.25} 120 120)`} /></g><text x="600" y="548" textAnchor="middle" fill={pal.text} fontFamily={FONT} fontSize="24" fontWeight="700">{a} <tspan fill={pal.accent}>→</tspan> {b}</text></IconScene>;
};

const NavigationSet: React.FC<{ p: IconStoriesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const icons = listOr(p.icons, ["spark", "arrow", "chat", "heart"]); const labels = listOr(p.labels, ["Home", "Explore", "Inbox", "Profile"]); const active = Math.floor(frame / 75) % 4;
  return <IconScene pal={pal}><rect x="190" y="110" width="820" height="410" rx="28" fill={`${pal.bg}cc`} stroke={pal.text} strokeOpacity="0.22" /><rect x="190" y="110" width="820" height="72" rx="28" fill={`${pal.primary}20`} /><text x="235" y="156" fill={pal.text} fontFamily={FONT} fontSize="22" fontWeight="800">{p.brandName}</text><path d="M250 475 H950" stroke={pal.text} strokeOpacity="0.14" />{icons.slice(0, 4).map((kind, i) => { const x = 330 + i * 170; const selected = i === active; return <g key={kind + i} opacity={selected ? 1 : 0.5}><circle cx={x} cy="392" r="39" fill={selected ? `${pal.accent}2d` : "transparent"} /><g transform={`translate(${x - 28} 360)`}><IconGlyph kind={kind} size={58} stroke={selected ? pal.accent : pal.text} fill={pal.primary} filled={selected} /></g><text x={x} y="470" textAnchor="middle" fill={selected ? pal.accent : pal.text} fontFamily={FONT} fontSize="14">{labels[i]}</text></g>; })}<g transform="translate(530 220)"><IconGlyph kind={icons[active]} size={128} stroke={pal.accent} fill={pal.primary} filled progress={progress(frame % 75, 0, 20)} /></g></IconScene>;
};

const ServiceIcons: React.FC<{ p: IconStoriesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const icons = listOr(p.icons, ICONS); const labels = listOr(p.labels, DEFAULT_LABELS);
  return <IconScene pal={pal}><g transform="translate(130 120)">{icons.slice(0, 6).map((kind, i) => { const t = progress(frame, i * 6, 20); return <g key={kind + i} opacity={t} transform={`translate(0 ${(1 - t) * 20})`}><rect x={(i % 3) * 320} y={Math.floor(i / 3) * 190} width="280" height="142" rx="16" fill={`${pal.text}08`} stroke={pal.text} strokeOpacity="0.2" /><g transform={`translate(${(i % 3) * 320 + 24} ${Math.floor(i / 3) * 190 + 25})`}><IconGlyph kind={kind} size={88} stroke={pal.accent} fill={pal.primary} filled={i === safeIndex(p.highlightIndex, 6)} /></g><text x={(i % 3) * 320 + 132} y={Math.floor(i / 3) * 190 + 65} fill={pal.text} fontFamily={FONT} fontSize="19" fontWeight="700">{labels[i] ?? `Service ${i + 1}`}</text><text x={(i % 3) * 320 + 132} y={Math.floor(i / 3) * 190 + 94} fill={pal.text} opacity="0.48" fontFamily={MONO} fontSize="12">READY / AVAILABLE</text></g>; })}</g></IconScene>;
};

const IconLockup: React.FC<{ p: IconStoriesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const t = progress(frame, 10, 35); const brand = p.brandName || "Northstar";
  return <IconScene pal={pal}><g transform="translate(170 210)" opacity={t}><g transform={`translate(0 0) rotate(${(1 - t) * -20})`}><IconGlyph kind={listOr(p.icons, ["spark"])[0]} size={150} stroke={pal.accent} fill={pal.primary} filled /></g><path d="M175 75 H245" stroke={pal.accent} strokeWidth="2" strokeDasharray="4 8" opacity="0.65" /><text x="290" y="72" fill={pal.text} fontFamily={FONT} fontSize="76" fontWeight="800" letterSpacing="-4">{brand}</text><text x="294" y="116" fill={pal.accent} fontFamily={MONO} fontSize="15" letterSpacing="5">ICON SYSTEM / LOCKUP</text></g><g opacity={t} transform={`translate(300 ${470 + (1 - t) * 30})`}><text x="0" y="0" fill={pal.text} opacity="0.55" fontFamily={FONT} fontSize="18">One mark. Many moments.</text><line x1="0" y1="28" x2="590" y2="28" stroke={pal.text} strokeOpacity="0.2" /></g></IconScene>;
};

const VARIANTS: Record<IconStoriesVariant, React.FC<{ p: IconStoriesProps; pal: Palette }>> = {
  "icon-grid": IconGrid,
  "stroke-draw": StrokeDraw,
  "feature-icons": FeatureIcons,
  "icon-to-pattern": Pattern,
  "filled-outline": FilledOutline,
  "icon-family": IconFamily,
  "icon-morph": IconMorph,
  "navigation-set": NavigationSet,
  "service-icons": ServiceIcons,
  "icon-lockup": IconLockup,
};

export const IconStoriesTemplate: React.FC<IconStoriesProps> = (props) => {
  const frame = useCurrentFrame(); const { durationInFrames } = useVideoConfig(); const pal = resolvePalette(props.paletteName); const accent = props.accentColor ?? pal.accent; const Variant = VARIANTS[props.variant] ?? IconGrid; const intro = progress(frame, 0, 18); const outro = clamp01((durationInFrames - frame) / 18); const normalized: IconStoriesProps = { ...props, icons: listOr(props.icons, ICONS), labels: listOr(props.labels, DEFAULT_LABELS), strokeColor: props.strokeColor || pal.text, fillColor: props.fillColor || pal.primary, brandName: props.brandName || "Northstar", paletteName: props.paletteName || "midnight", grid: props.grid || 4, highlightIndex: Number.isFinite(props.highlightIndex) ? props.highlightIndex : 0 };
  return <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", opacity: intro * outro }}><Variant p={{ ...normalized, accentColor: accent }} pal={{ ...pal, accent }} /><AbsoluteFill style={{ pointerEvents: "none", padding: "58px 72px", fontFamily: FONT, color: pal.text }}><div style={{ color: accent, fontFamily: MONO, fontSize: 14, letterSpacing: "0.32em", textTransform: "uppercase" }}>Icon stories / {String(Object.keys(VARIANTS).indexOf(props.variant) + 1).padStart(2, "0")}</div><div style={{ position: "absolute", left: 72, bottom: 48, maxWidth: 560, opacity: 0.75 }}><div style={{ fontSize: 12, letterSpacing: "0.2em", color: accent, textTransform: "uppercase" }}>{props.brandName || "Northstar"} · reusable icon language</div><div style={{ marginTop: 9, fontSize: 22, fontWeight: 760 }}>{props.headline || "Small marks. Clear stories."}</div><div style={{ marginTop: 5, fontSize: 14, opacity: 0.58 }}>{props.subline || "A procedural icon system for product and brand communication."}</div></div></AbsoluteFill></AbsoluteFill>;
};

const familyCast = (c: React.FC<IconStoriesProps>) => c as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "icon-stories-icon-grid": familyCast(IconStoriesTemplate),
  "icon-stories-stroke-draw": familyCast(IconStoriesTemplate),
  "icon-stories-feature-icons": familyCast(IconStoriesTemplate),
  "icon-stories-icon-to-pattern": familyCast(IconStoriesTemplate),
  "icon-stories-filled-outline": familyCast(IconStoriesTemplate),
  "icon-stories-icon-family": familyCast(IconStoriesTemplate),
  "icon-stories-icon-morph": familyCast(IconStoriesTemplate),
  "icon-stories-navigation-set": familyCast(IconStoriesTemplate),
  "icon-stories-service-icons": familyCast(IconStoriesTemplate),
  "icon-stories-icon-lockup": familyCast(IconStoriesTemplate),
};
