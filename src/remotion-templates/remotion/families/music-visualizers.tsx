import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import {
  GradientMeshBackground,
  clampInterp,
  resolvePalette,
  seededRand,
  type Palette,
} from "../lib/primitives";

/** Music-focused visualizers with deterministic procedural fallback data. */
export type MusicVisualizerVariant =
  | "radial-spectrum"
  | "mirror-bars"
  | "wave-ring"
  | "frequency-mountains"
  | "oscilloscope"
  | "particle-spectrum"
  | "vinyl-spectrum"
  | "equalizer-wall"
  | "stereo-field"
  | "spectrum-tunnel";

export interface MusicVisualizerProps {
  variant: MusicVisualizerVariant;
  title: string;
  artist: string;
  paletteName: string;
  audioData?: number[];
  amplitude?: number[];
  sensitivity?: number;
  seed?: number;
  beatMarkers?: number[];
  coverUrl?: string;
  backgroundUrl?: string;
  accentColor?: string;
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const FALLBACK = Array.from({ length: 64 }, (_, i) => 0.18 + 0.65 * (0.5 + 0.5 * Math.sin(i * 0.47)));

const valuesFor = (p: MusicVisualizerProps, frame: number, count = 64): number[] => {
  const supplied = (p.audioData?.length ? p.audioData : p.amplitude) ?? [];
  const sensitivity = Math.max(0.1, p.sensitivity ?? 1);
  return Array.from({ length: count }, (_, i) => {
    const source = supplied.length ? supplied[i % supplied.length] : FALLBACK[i % FALLBACK.length];
    const beat = (p.beatMarkers ?? []).some((b) => Math.abs(frame - b) < 4) ? 1.2 : 1;
    const pulse = supplied.length ? 1 : 0.82 + 0.18 * Math.sin(frame * 0.13 + i * 0.43 + (p.seed ?? 7));
    return Math.max(0.035, Math.min(1.3, Number(source || 0) * sensitivity * beat * pulse));
  });
};

const energyFor = (values: number[]): number => values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);
const colorAt = (pal: Palette, i: number): string => [pal.primary, pal.secondary, pal.accent, "#fbbf24", "#a78bfa"][i % 5];
const polar = (cx: number, cy: number, radius: number, angle: number): [number, number] => [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
const pathFor = (points: Array<[number, number]>): string => points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");

const Header: React.FC<{ p: MusicVisualizerProps; pal: Palette; compact?: boolean }> = ({ p, pal, compact = false }) => (
  <div style={{ position: "absolute", left: compact ? 60 : 92, top: compact ? 52 : 76, zIndex: 5, maxWidth: "54%" }}>
    <div style={{ fontFamily: MONO, color: `${pal.secondary}bb`, fontSize: compact ? 15 : 18, letterSpacing: "0.2em", textTransform: "uppercase" }}>NOW PLAYING</div>
    <div style={{ fontFamily: FONT, color: pal.text, fontSize: compact ? 38 : 56, fontWeight: 800, letterSpacing: "-0.04em", marginTop: 10 }}>{p.title || "Midnight Frequency"}</div>
    <div style={{ color: `${pal.text}88`, fontSize: compact ? 20 : 24, marginTop: 8 }}>{p.artist || "Synthetic Sessions"}</div>
  </div>
);

const Footer: React.FC<{ p: MusicVisualizerProps; pal: Palette }> = ({ p, pal }) => (
  <div style={{ position: "absolute", left: 92, right: 92, bottom: 68, display: "flex", alignItems: "center", gap: 20, zIndex: 5 }}>
    <div style={{ height: 4, flex: 1, background: `${pal.text}22`, borderRadius: 4, overflow: "hidden" }}><div style={{ width: "58%", height: "100%", background: `linear-gradient(90deg, ${pal.primary}, ${pal.accent})` }} /></div>
    <div style={{ fontFamily: MONO, color: `${pal.text}88`, fontSize: 15, letterSpacing: "0.12em" }}>LIVE VISUALIZER</div>
  </div>
);

const SvgBackground: React.FC<{ pal: Palette; url?: string }> = ({ pal, url }) => (
  <>
    <AbsoluteFill style={{ background: url ? `linear-gradient(${pal.bg}aa, ${pal.bg}dd), url(${url}) center/cover` : pal.bg }} />
    <GradientMeshBackground palette={pal} blobs={4} speed={0.32} />
    <AbsoluteFill style={{ opacity: 0.18, backgroundImage: `linear-gradient(${pal.text}0b 1px, transparent 1px), linear-gradient(90deg, ${pal.text}0b 1px, transparent 1px)`, backgroundSize: "72px 72px" }} />
  </>
);

const RadialSpectrum: React.FC<{ p: MusicVisualizerProps; pal: Palette; values: number[] }> = ({ p, pal, values }) => {
  const frame = useCurrentFrame();
  const cx = 960, cy = 570, n = values.length;
  return <><Header p={p} pal={pal} /><svg width="100%" height="100%" viewBox="0 0 1920 1080"><circle cx={cx} cy={cy} r="218" fill={`${pal.bg}bb`} stroke={`${pal.text}18`} strokeWidth="2" />{values.map((v, i) => { const a = i / n * Math.PI * 2 - Math.PI / 2; const r1 = 240; const r2 = r1 + v * 175; const [x1, y1] = polar(cx, cy, r1, a); const [x2, y2] = polar(cx, cy, r2, a); return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={colorAt(pal, i)} strokeWidth={8} strokeLinecap="round" opacity={0.72 + v * 0.2} />; })}<circle cx={cx} cy={cy} r={126 + Math.sin(frame * .12) * 5} fill={`${pal.primary}1c`} stroke={pal.primary} strokeOpacity=".6" strokeWidth="2" /><text x={cx} y={cy + 10} textAnchor="middle" fill={pal.text} fontFamily={MONO} fontSize="28" letterSpacing="5">{Math.round(energyFor(values) * 100)} BPM</text></svg><Footer p={p} pal={pal} /></>;
};

const MirrorBars: React.FC<{ p: MusicVisualizerProps; pal: Palette; values: number[] }> = ({ p, pal, values }) => <><Header p={p} pal={pal} compact /><svg width="100%" height="100%" viewBox="0 0 1920 1080"><g transform="translate(960 570)">{values.slice(0, 32).map((v, i) => { const x = (i - 16) * 48; const h = 190 + v * 240; return <g key={i}><rect x={x} y={-h} width="32" height={h} rx="16" fill={colorAt(pal, i)} opacity=".86" /><rect x={x} y={8} width="32" height={h * .72} rx="16" fill={colorAt(pal, i)} opacity=".28" /></g>; })}<line x1="-840" x2="840" y1="0" y2="0" stroke={`${pal.text}44`} strokeWidth="2" /></g></svg><Footer p={p} pal={pal} /></>;

const WaveRing: React.FC<{ p: MusicVisualizerProps; pal: Palette; values: number[] }> = ({ p, pal, values }) => { const frame = useCurrentFrame(); const pts = values.map((v, i) => polar(960, 550, 265 + v * 100, i / values.length * Math.PI * 2 + frame * .008)); return <><Header p={p} pal={pal} /><svg width="100%" height="100%" viewBox="0 0 1920 1080"><circle cx="960" cy="550" r="270" fill="none" stroke={`${pal.secondary}24`} strokeWidth="18" /><path d={`${pathFor(pts)} Z`} fill={`${pal.primary}20`} stroke={pal.secondary} strokeWidth="7" strokeLinejoin="round" /><circle cx="960" cy="550" r="105" fill={`${pal.bg}dd`} stroke={pal.accent} strokeWidth="3" /><text x="960" y="558" textAnchor="middle" fill={pal.text} fontFamily={FONT} fontSize="30" fontWeight="700">WAVE RING</text></svg><Footer p={p} pal={pal} /></>; };

const FrequencyMountains: React.FC<{ p: MusicVisualizerProps; pal: Palette; values: number[] }> = ({ p, pal, values }) => <><Header p={p} pal={pal} compact /><svg width="100%" height="100%" viewBox="0 0 1920 1080"><line x1="100" y1="820" x2="1820" y2="820" stroke={`${pal.text}44`} strokeWidth="3" />{[0, 1, 2].map((layer) => { const pts: Array<[number, number]> = [[90, 820]]; values.forEach((v, i) => pts.push([90 + i * 28, 820 - v * (200 + layer * 90) - layer * 30])); pts.push([1830, 820]); return <path key={layer} d={`${pathFor(pts)} Z`} fill={colorAt(pal, layer + 1)} opacity={.18 + layer * .09} stroke={colorAt(pal, layer + 1)} strokeWidth="4" />; })}</svg><Footer p={p} pal={pal} /></>;

const Oscilloscope: React.FC<{ p: MusicVisualizerProps; pal: Palette; values: number[] }> = ({ p, pal, values }) => { const frame = useCurrentFrame(); const pts = Array.from({ length: 150 }, (_, i) => { const x = 90 + i / 149 * 1740; const idx = i % values.length; const y = 550 + Math.sin(i * .38 + frame * .18) * (70 + values[idx] * 175); return [x, y] as [number, number]; }); return <><Header p={p} pal={pal} /><svg width="100%" height="100%" viewBox="0 0 1920 1080"><rect x="80" y="300" width="1760" height="500" rx="26" fill={`${pal.bg}99`} stroke={`${pal.text}20`} strokeWidth="2" /><path d={pathFor(pts)} fill="none" stroke={pal.accent} strokeWidth="7" strokeLinecap="round" /><path d={pathFor(pts.map(([x, y]) => [x, 1100 - y] as [number, number]))} fill="none" stroke={`${pal.primary}55`} strokeWidth="3" /></svg><Footer p={p} pal={pal} /></>; };

const ParticleSpectrum: React.FC<{ p: MusicVisualizerProps; pal: Palette; values: number[] }> = ({ p, pal, values }) => { const frame = useCurrentFrame(); return <><Header p={p} pal={pal} compact /><svg width="100%" height="100%" viewBox="0 0 1920 1080">{Array.from({ length: 180 }, (_, i) => { const base = seededRand((p.seed ?? 4) + i * 3); const x = 960 + (base - .5) * 1500; const band = i % values.length; const y = 580 + (seededRand((p.seed ?? 4) + i * 3 + 1) - .5) * (180 + values[band] * 480); const r = 2 + seededRand(i + 88) * 7 + values[band] * 4; const drift = Math.sin(frame * .04 + i) * (10 + values[band] * 22); return <circle key={i} cx={x + drift} cy={y} r={r} fill={colorAt(pal, i)} opacity={.35 + values[band] * .55} />; })}<line x1="240" x2="1680" y1="580" y2="580" stroke={`${pal.text}28`} strokeWidth="2" /></svg><Footer p={p} pal={pal} /></>; };

const VinylSpectrum: React.FC<{ p: MusicVisualizerProps; pal: Palette; values: number[] }> = ({ p, pal, values }) => { const frame = useCurrentFrame(); const cx = 960, cy = 560; return <><Header p={p} pal={pal} compact /><svg width="100%" height="100%" viewBox="0 0 1920 1080"><circle cx={cx} cy={cy} r="270" fill="#09090dcc" stroke={`${pal.text}35`} strokeWidth="4" />{Array.from({ length: 8 }, (_, i) => <circle key={i} cx={cx} cy={cy} r={40 + i * 30} fill="none" stroke={`${pal.text}12`} strokeWidth="2" />)}{values.slice(0, 40).map((v, i) => { const a = i / 40 * Math.PI * 2 + frame * .012; const [x, y] = polar(cx, cy, 288, a); return <line key={i} x1={cx + Math.cos(a) * 190} y1={cy + Math.sin(a) * 190} x2={x} y2={y} stroke={colorAt(pal, i)} strokeWidth="8" opacity={.7} />; })}<circle cx={cx} cy={cy} r="73" fill={pal.accent} /><circle cx={cx} cy={cy} r="12" fill={pal.bg} /><text x={cx} y="945" textAnchor="middle" fill={pal.text} fontFamily={MONO} fontSize="20" letterSpacing="6">VINYL / A SIDE</text></svg><Footer p={p} pal={pal} /></>; };

const EqualizerWall: React.FC<{ p: MusicVisualizerProps; pal: Palette; values: number[] }> = ({ p, pal, values }) => <><Header p={p} pal={pal} compact /><svg width="100%" height="100%" viewBox="0 0 1920 1080">{values.slice(0, 24).map((v, i) => { const x = 190 + i * 68; const segments = 12; return <g key={i}>{Array.from({ length: segments }, (_, j) => { const active = j / segments < v; return <rect key={j} x={x} y={780 - j * 36} width="42" height="24" rx="5" fill={active ? colorAt(pal, j + i) : `${pal.text}12`} />; })}</g>; })}</svg><Footer p={p} pal={pal} /></>;

const StereoField: React.FC<{ p: MusicVisualizerProps; pal: Palette; values: number[] }> = ({ p, pal, values }) => { const frame = useCurrentFrame(); const make = (sign: number) => Array.from({ length: 100 }, (_, i) => [100 + i / 99 * 1720, 545 + sign * (Math.sin(i * .3 + frame * .14) * (30 + values[i % values.length] * 160))] as [number, number]); return <><Header p={p} pal={pal} /><svg width="100%" height="100%" viewBox="0 0 1920 1080"><path d={pathFor(make(1))} fill="none" stroke={pal.primary} strokeWidth="6" /><path d={pathFor(make(-1))} fill="none" stroke={pal.accent} strokeWidth="6" /><line x1="100" x2="1820" y1="545" y2="545" stroke={`${pal.text}38`} strokeWidth="2" /><text x="100" y="930" fill={pal.primary} fontFamily={MONO} fontSize="18" letterSpacing="4">LEFT CHANNEL</text><text x="1820" y="930" textAnchor="end" fill={pal.accent} fontFamily={MONO} fontSize="18" letterSpacing="4">RIGHT CHANNEL</text></svg><Footer p={p} pal={pal} /></>; };

const SpectrumTunnel: React.FC<{ p: MusicVisualizerProps; pal: Palette; values: number[] }> = ({ p, pal, values }) => { const frame = useCurrentFrame(); return <><Header p={p} pal={pal} compact /><svg width="100%" height="100%" viewBox="0 0 1920 1080">{Array.from({ length: 14 }, (_, i) => { const z = (i + (frame * .035)) % 14 / 14; const size = 90 + z * 850; const x = 960 - size / 2; const y = 545 - size * .29; const v = values[i % values.length]; return <rect key={i} x={x} y={y} width={size} height={size * .58} fill="none" stroke={colorAt(pal, i)} strokeWidth={5 + v * 7} opacity={1 - z * .7} transform={`rotate(${frame * .25 + i * 7} 960 545)`} />; })}<circle cx="960" cy="545" r="42" fill={pal.accent} /></svg><Footer p={p} pal={pal} /></>; };

const VARIANTS: Record<MusicVisualizerVariant, React.FC<{ p: MusicVisualizerProps; pal: Palette; values: number[] }>> = {
  "radial-spectrum": RadialSpectrum,
  "mirror-bars": MirrorBars,
  "wave-ring": WaveRing,
  "frequency-mountains": FrequencyMountains,
  oscilloscope: Oscilloscope,
  "particle-spectrum": ParticleSpectrum,
  "vinyl-spectrum": VinylSpectrum,
  "equalizer-wall": EqualizerWall,
  "stereo-field": StereoField,
  "spectrum-tunnel": SpectrumTunnel,
};

export const MusicVisualizerTemplate: React.FC<MusicVisualizerProps> = (props) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const pal = resolvePalette(props.paletteName);
  const values = valuesFor(props, frame);
  const Variant = VARIANTS[props.variant] ?? RadialSpectrum;
  const opacity = Math.min(clampInterp(frame, [0, 12], [0, 1]), clampInterp(frame, [durationInFrames - 14, durationInFrames], [1, 0]));
  return <AbsoluteFill style={{ backgroundColor: pal.bg, color: pal.text, fontFamily: FONT, overflow: "hidden" }}><SvgBackground pal={pal} url={props.backgroundUrl} /><AbsoluteFill style={{ opacity }}><Variant p={props} pal={pal} values={values} /></AbsoluteFill></AbsoluteFill>;
};

const familyCast = (component: React.FC<MusicVisualizerProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;
export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "music-visualizers-radial-spectrum": familyCast(MusicVisualizerTemplate),
  "music-visualizers-mirror-bars": familyCast(MusicVisualizerTemplate),
  "music-visualizers-wave-ring": familyCast(MusicVisualizerTemplate),
  "music-visualizers-frequency-mountains": familyCast(MusicVisualizerTemplate),
  "music-visualizers-oscilloscope": familyCast(MusicVisualizerTemplate),
  "music-visualizers-particle-spectrum": familyCast(MusicVisualizerTemplate),
  "music-visualizers-vinyl-spectrum": familyCast(MusicVisualizerTemplate),
  "music-visualizers-equalizer-wall": familyCast(MusicVisualizerTemplate),
  "music-visualizers-stereo-field": familyCast(MusicVisualizerTemplate),
  "music-visualizers-spectrum-tunnel": familyCast(MusicVisualizerTemplate),
};
