import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, GradientMeshBackground, clampInterp, resolvePalette, seededRand, type Palette } from "../lib/primitives";

type MapsDataVariant =
  | "choropleth-grid"
  | "bubble-map"
  | "heat-route"
  | "regional-bars"
  | "migration-arcs"
  | "coverage-map"
  | "density-cells"
  | "map-legend"
  | "geo-ranking"
  | "map-callout";

type RegionDatum = { label: string; value: number; x?: number; y?: number; color?: string; note?: string };

export interface MapsDataProps {
  variant: MapsDataVariant;
  title: string;
  subtitle: string;
  paletteName: string;
  regions?: RegionDatum[];
  values?: number[];
  labels?: string[];
  legend?: string[];
  colorScale?: string[];
  focusRegion?: number | string;
  notes?: string;
  mapShape?: "grid" | "hex" | "contour";
  unit?: string;
  source?: string;
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const VARIANTS: MapsDataVariant[] = ["choropleth-grid", "bubble-map", "heat-route", "regional-bars", "migration-arcs", "coverage-map", "density-cells", "map-legend", "geo-ranking", "map-callout"];
const EYEBROWS: Record<MapsDataVariant, string> = {
  "choropleth-grid": "GEOGRAPHY / INTENSITY",
  "bubble-map": "GEOGRAPHY / SCALE",
  "heat-route": "GEOGRAPHY / ROUTE",
  "regional-bars": "REGIONS / COMPARISON",
  "migration-arcs": "GEOGRAPHY / MOVEMENT",
  "coverage-map": "GEOGRAPHY / COVERAGE",
  "density-cells": "GEOGRAPHY / DENSITY",
  "map-legend": "GEOGRAPHY / LEGEND",
  "geo-ranking": "REGIONS / RANKING",
  "map-callout": "GEOGRAPHY / FOCUS",
};
const FALLBACK: RegionDatum[] = [
  { label: "North", value: 82, x: 24, y: 23 },
  { label: "West", value: 46, x: 17, y: 57 },
  { label: "Central", value: 74, x: 48, y: 48 },
  { label: "East", value: 61, x: 78, y: 35 },
  { label: "South", value: 35, x: 64, y: 77 },
  { label: "Coast", value: 93, x: 88, y: 74 },
];
const DEFAULT_SCALE = ["#dbeafe", "#60a5fa", "#2563eb", "#1e1b4b"];

const dataOf = (p: MapsDataProps): RegionDatum[] => {
  if (p.regions?.length) return p.regions.slice(0, 18);
  if (p.values?.length) return p.values.slice(0, 18).map((value, i) => ({ label: p.labels?.[i] ?? `Region ${String(i + 1).padStart(2, "0")}`, value }));
  return FALLBACK;
};
const maxOf = (rows: RegionDatum[]) => Math.max(1, ...rows.map((r) => Math.max(0, r.value)));
const colorsOf = (p: MapsDataProps, pal: Palette) => p.colorScale?.length ? p.colorScale : [pal.secondary, pal.primary, pal.accent, "#a78bfa", "#22d3ee"];
const point = (r: RegionDatum, i: number) => ({ x: r.x ?? (13 + seededRand(i * 11 + 2) * 74), y: r.y ?? (17 + seededRand(i * 11 + 4) * 67) });
const selected = (r: RegionDatum, i: number, p: MapsDataProps) => typeof p.focusRegion === "number" ? p.focusRegion === i : typeof p.focusRegion === "string" ? p.focusRegion === r.label : false;
const colorAt = (row: RegionDatum, i: number, rows: RegionDatum[], scale: string[]) => row.color ?? scale[Math.min(scale.length - 1, Math.floor((Math.max(0, row.value) / maxOf(rows)) * scale.length))];

const Header: React.FC<{ p: MapsDataProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  return <div style={{ position: "absolute", left: 105, top: 70, right: 105, display: "flex", justifyContent: "space-between", alignItems: "flex-start", color: pal.text, fontFamily: FONT, opacity: clampInterp(frame, [0, 18], [0, 1]) }}>
    <div><div style={{ color: pal.accent, fontFamily: MONO, fontSize: 13, fontWeight: 800, letterSpacing: ".19em" }}>{EYEBROWS[p.variant]}</div><div style={{ marginTop: 14, fontSize: 50, fontWeight: 850, lineHeight: .98, letterSpacing: "-.055em" }}>{p.title}</div><div style={{ marginTop: 12, color: `${pal.text}a8`, fontSize: 20 }}>{p.subtitle}</div></div>
    <div style={{ color: `${pal.text}80`, fontFamily: MONO, fontSize: 12, letterSpacing: ".12em", marginTop: 6 }}>{p.source ?? "SOURCE / INTERNAL DATA"}</div>
  </div>;
};

const MapBase: React.FC<{ p: MapsDataProps; pal: Palette; rows: RegionDatum[]; scale: string[]; frame: number }> = ({ p, pal, rows, scale, frame }) => {
  const shape = p.mapShape ?? (p.variant === "density-cells" ? "hex" : "contour");
  const reveal = clampInterp(frame, [8, 48], [0, 1]);
  const width = 1170; const height = 635;
  return <div style={{ position: "absolute", left: 105, top: 272, width, height, border: `1px solid ${pal.text}22`, borderRadius: 28, overflow: "hidden", background: `${pal.text}06`, boxShadow: `0 26px 90px ${pal.bg}99` }}>
    <svg width="100%" height="100%" viewBox="0 0 1170 635">
      <defs><pattern id="maps-grid" width="58" height="58" patternUnits="userSpaceOnUse"><path d="M58 0H0V58" fill="none" stroke={`${pal.text}16`} strokeWidth="1" /></pattern><filter id="maps-glow"><feGaussianBlur stdDeviation="10" /></filter></defs>
      <rect width="1170" height="635" fill={`${pal.bg}35`} /><rect width="1170" height="635" fill="url(#maps-grid)" opacity={shape === "grid" ? .85 : .45} />
      <path d="M0 180 C120 70 210 140 310 82 S520 75 610 170 S800 205 900 98 S1080 100 1170 44 L1170 0 L0 0Z" fill={`${pal.secondary}12`} />
      <path d="M0 570 C160 450 250 550 390 490 S610 440 730 540 S960 560 1170 430 L1170 635 L0 635Z" fill={`${pal.primary}10`} />
      {Array.from({ length: 20 }, (_, i) => { const x = (i * 71) % 1140; const y = 38 + ((i * 127) % 555); const w = 70 + (i % 4) * 22; const h = 48 + (i % 3) * 19; const v = rows[i % rows.length]?.value ?? 50; const fill = colorAt(rows[i % rows.length], i, rows, scale); return <path key={`cell-${i}`} d={`M${x} ${y} l${w} ${-10 + i % 3 * 12} l${18 + i % 5 * 8} ${h} l${-w + 22} ${h + 12}Z`} fill={`${fill}${shape === "hex" ? "40" : "25"}`} stroke={`${fill}55`} strokeWidth="2" opacity={reveal * (shape === "contour" ? .78 : 1)} />; })}
      {p.variant === "choropleth-grid" && Array.from({ length: 7 }, (_, i) => <g key={`band-${i}`} opacity={reveal * .9}><rect x={72 + i * 148} y={70 + (i % 2) * 230} width={115} height={150} rx={18} fill={`${scale[(i + 1) % scale.length]}38`} stroke={`${scale[(i + 1) % scale.length]}9c`} strokeWidth="3" /><text x={129 + i * 148} y={153 + (i % 2) * 230} textAnchor="middle" fill={pal.text} fontFamily={MONO} fontSize="16">{String(10 + i * 13)}%</text></g>)}
      {rows.map((row, i) => { const q = point(row, i); const x = q.x / 100 * width; const y = q.y / 100 * height; const enter = clampInterp(frame, [12 + i * 4, 28 + i * 4], [0, 1]); const isFocus = selected(row, i, p); const radius = 12 + Math.sqrt(Math.max(0, row.value)) * 1.1; return <g key={`${row.label}-${i}`} opacity={enter}>
        {(p.variant === "bubble-map" || p.variant === "density-cells") && <><circle cx={x} cy={y} r={radius * 2.1} fill={colorAt(row, i, rows, scale)} opacity=".12" filter="url(#maps-glow)" /><circle cx={x} cy={y} r={radius} fill={colorAt(row, i, rows, scale)} opacity=".78" stroke={pal.text} strokeWidth="3" /></>}
        {(p.variant !== "bubble-map" && p.variant !== "density-cells") && <circle cx={x} cy={y} r={isFocus ? 15 : 8} fill={isFocus ? pal.accent : pal.text} stroke={colorAt(row, i, rows, scale)} strokeWidth="5" />}
        {(p.variant === "map-callout" || isFocus || p.variant === "map-legend") && <g transform={`translate(${x + 18} ${y - 20})`}><rect width={Math.max(100, row.label.length * 9 + 62)} height="38" rx="10" fill={`${pal.bg}e8`} stroke={`${pal.text}35`} /><text x="14" y="24" fill={pal.text} fontFamily={MONO} fontSize="13" fontWeight="800">{row.label} / {Math.round(row.value)}{p.unit ?? ""}</text></g>}
      </g>; })}
      {p.variant === "heat-route" && <path d="M120 520 C280 220 390 440 530 190 S760 470 900 150 S1030 330 1120 100" fill="none" stroke={pal.accent} strokeWidth="8" strokeDasharray="1350" strokeDashoffset={1350 * (1 - reveal)} strokeLinecap="round" />}
      {p.variant === "migration-arcs" && rows.slice(0, -1).map((row, i) => { const a = point(row, i); const b = point(rows[i + 1], i + 1); const ax = a.x / 100 * width; const ay = a.y / 100 * height; const bx = b.x / 100 * width; const by = b.y / 100 * height; return <path key={`arc-${i}`} d={`M${ax} ${ay} Q${(ax + bx) / 2} ${Math.min(ay, by) - 100 - i * 15} ${bx} ${by}`} fill="none" stroke={scale[i % scale.length]} strokeWidth="5" strokeDasharray="18 13" strokeDashoffset={frame * -3} opacity={reveal * .9} />; })}
      {p.variant === "coverage-map" && <g opacity={reveal}><circle cx="570" cy="320" r="240" fill="none" stroke={pal.accent} strokeDasharray="9 14" strokeWidth="4" /><circle cx="570" cy="320" r="155" fill={`${pal.accent}12`} stroke={pal.accent} strokeWidth="3" /></g>}
      {p.variant === "regional-bars" && rows.slice(0, 7).map((row, i) => { const y = 68 + i * 70; const w = (Math.max(0, row.value) / maxOf(rows)) * 370; return <g key={`bar-${i}`} opacity={reveal}><text x="34" y={y + 22} fill={pal.text} fontFamily={MONO} fontSize="14">{row.label}</text><rect x="180" y={y} width="400" height="28" rx="14" fill={`${pal.text}13`} /><rect x="180" y={y} width={w} height="28" rx="14" fill={colorAt(row, i, rows, scale)} /><text x={200 + w} y={y + 21} fill={pal.text} fontFamily={MONO} fontSize="14">{Math.round(row.value)}</text></g>; })}
    </svg>
  </div>;
};

const SidePanel: React.FC<{ p: MapsDataProps; pal: Palette; rows: RegionDatum[]; scale: string[] }> = ({ p, pal, rows, scale }) => {
  const sorted = [...rows].sort((a, b) => b.value - a.value).slice(0, 5);
  return <div style={{ position: "absolute", right: 112, top: 272, width: 420, color: pal.text, fontFamily: FONT }}><div style={{ color: `${pal.text}80`, fontFamily: MONO, fontSize: 12, letterSpacing: ".14em" }}>{p.variant === "geo-ranking" ? "TOP REGIONS" : "READ THE MAP"}</div><div style={{ marginTop: 20, display: "grid", gap: 12 }}>{sorted.map((row, i) => <div key={`${row.label}-rank`} style={{ display: "flex", gap: 14, alignItems: "center", padding: "13px 15px", border: `1px solid ${pal.text}18`, borderRadius: 13, background: `${pal.text}08` }}><div style={{ color: pal.accent, fontFamily: MONO, fontWeight: 800, fontSize: 15, width: 27 }}>0{i + 1}</div><div style={{ flex: 1, fontSize: 18, fontWeight: 700 }}>{row.label}</div><div style={{ color: scale[i % scale.length], fontFamily: MONO, fontWeight: 800 }}>{Math.round(row.value)}{p.unit ?? ""}</div></div>)}</div>{p.notes && <div style={{ marginTop: 26, padding: 18, borderLeft: `3px solid ${pal.accent}`, color: `${pal.text}a0`, lineHeight: 1.4, fontSize: 16 }}>{p.notes}</div>}</div>;
};

export const MapsDataTemplate: React.FC<MapsDataProps> = (props) => {
  const pal = resolvePalette(props.paletteName); const rows = dataOf(props); const scale = colorsOf(props, pal);
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <AbsoluteFill style={{ backgroundColor: pal.bg, color: pal.text }}><GradientMeshBackground palette={pal} speed={.22} blobs={4} /><FadeEdges inFrames={12} outFrames={14}><div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><Header p={props} pal={pal} /><MapBase p={props} pal={pal} rows={rows} scale={scale} frame={useCurrentFrame()} /><SidePanel p={props} pal={pal} rows={rows} scale={scale} /></div></FadeEdges></AbsoluteFill>;
};

const familyCast = (c: React.FC<MapsDataProps>) => c as unknown as React.ComponentType<Record<string, unknown>>;
export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = Object.fromEntries(VARIANTS.map((variant) => [`maps-data-${variant}`, familyCast(MapsDataTemplate)]));
