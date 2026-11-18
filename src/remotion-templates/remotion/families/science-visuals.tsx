import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, GradientMeshBackground, resolvePalette, type Palette } from "../lib/primitives";

/** Procedural, factual-neutral science metaphors for explainers and lessons. */
export type ScienceVariant =
  | "cell-zoom"
  | "particle-collision"
  | "wave-interference"
  | "orbit-model"
  | "ecosystem-web"
  | "lab-protocol"
  | "molecule-build"
  | "energy-transfer"
  | "rock-cycle"
  | "weather-cycle";

type ScienceNode = { x: number; y: number; label?: string; color?: string };

export interface ScienceVisualsProps {
  variant: ScienceVariant;
  title: string;
  subtitle: string;
  paletteName: string;
  labels?: string[];
  nodes?: ScienceNode[];
  values?: number[];
  focus?: number;
  speed?: number;
  caption?: string;
  diagramType?: string;
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const FALLBACK_LABELS = ["Signal", "Matter", "Energy", "System", "Input", "Change", "Output", "Cycle"];
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const alpha = (hex: string, value: string) => `${hex}${value}`;

type ChromeKind = "cell" | "collision" | "wave" | "orbit" | "web" | "lab" | "molecule" | "energy" | "rock" | "weather";
type SceneChromeConfig = {
  kind: ChromeKind;
  eyebrow: string;
  frame: string;
  header: { left: number; top: number; width: number };
  panel: { left: number; top: number; width: number; height: number; radius: number; border: string };
  panelLabel: string;
  gridOpacity: number;
  labelSide: "left" | "right";
};

const CHROME: Record<ScienceVariant, SceneChromeConfig> = {
  "cell-zoom": { kind: "cell", eyebrow: "BIOLOGY / CELLULAR SCALE", frame: "BIOLOGY / CELL MODEL", header: { left: 110, top: 90, width: 650 }, panel: { left: 770, top: 225, width: 980, height: 690, radius: 340, border: "solid" }, panelLabel: "MEMBRANE / NUCLEUS / SIGNAL", gridOpacity: .16, labelSide: "right" },
  "particle-collision": { kind: "collision", eyebrow: "PHYSICS / PARTICLE LAB", frame: "PHYSICS / COLLISION MODEL", header: { left: 110, top: 90, width: 680 }, panel: { left: 230, top: 285, width: 1470, height: 555, radius: 36, border: "dashed" }, panelLabel: "BEFORE  →  IMPACT  →  AFTER", gridOpacity: .1, labelSide: "left" },
  "wave-interference": { kind: "wave", eyebrow: "SIGNALS / FIELD STUDY", frame: "WAVE / INTERFERENCE MODEL", header: { left: 110, top: 82, width: 700 }, panel: { left: 675, top: 335, width: 1130, height: 430, radius: 26, border: "solid" }, panelLabel: "AMPLITUDE / PHASE / RESULTANT", gridOpacity: .12, labelSide: "right" },
  "orbit-model": { kind: "orbit", eyebrow: "ASTRONOMY / ORBITAL LAB", frame: "ASTRONOMY / ORBIT MODEL", header: { left: 110, top: 90, width: 670 }, panel: { left: 895, top: 230, width: 850, height: 680, radius: 425, border: "solid" }, panelLabel: "BODY / PATH / PERIOD", gridOpacity: .08, labelSide: "left" },
  "ecosystem-web": { kind: "web", eyebrow: "ECOLOGY / LIVING SYSTEMS", frame: "ECOLOGY / SYSTEM WEB", header: { left: 105, top: 86, width: 700 }, panel: { left: 945, top: 230, width: 770, height: 690, radius: 385, border: "dotted" }, panelLabel: "DEPENDENCIES / BALANCE", gridOpacity: .08, labelSide: "right" },
  "lab-protocol": { kind: "lab", eyebrow: "METHOD / REPEATABLE TEST", frame: "METHOD / LAB PROTOCOL", header: { left: 110, top: 90, width: 690 }, panel: { left: 670, top: 350, width: 990, height: 470, radius: 22, border: "dashed" }, panelLabel: "STEP 01  /  STEP 02  /  STEP 03  /  STEP 04", gridOpacity: .14, labelSide: "left" },
  "molecule-build": { kind: "molecule", eyebrow: "CHEMISTRY / STRUCTURE LAB", frame: "CHEMISTRY / MOLECULE MODEL", header: { left: 110, top: 90, width: 690 }, panel: { left: 805, top: 250, width: 870, height: 660, radius: 44, border: "solid" }, panelLabel: "BOND / ATOM / STRUCTURE", gridOpacity: .1, labelSide: "right" },
  "energy-transfer": { kind: "energy", eyebrow: "ENERGY / SYSTEMS DATA", frame: "ENERGY / TRANSFER MODEL", header: { left: 110, top: 88, width: 680 }, panel: { left: 700, top: 290, width: 1090, height: 570, radius: 18, border: "solid" }, panelLabel: "INPUT  →  STORE  →  CONVERT  →  OUTPUT", gridOpacity: .11, labelSide: "left" },
  "rock-cycle": { kind: "rock", eyebrow: "GEOLOGY / DEEP TIME", frame: "GEOLOGY / ROCK CYCLE", header: { left: 110, top: 88, width: 690 }, panel: { left: 900, top: 260, width: 850, height: 620, radius: 310, border: "dotted" }, panelLabel: "PRESSURE / HEAT / TIME", gridOpacity: .1, labelSide: "right" },
  "weather-cycle": { kind: "weather", eyebrow: "ATMOSPHERE / OBSERVATION", frame: "ATMOSPHERE / WEATHER CYCLE", header: { left: 110, top: 90, width: 700 }, panel: { left: 680, top: 250, width: 1160, height: 650, radius: 325, border: "solid" }, panelLabel: "SUN / CLOUD / RAIN / RUNOFF", gridOpacity: .12, labelSide: "left" },
};

const Header: React.FC<{ p: ScienceVisualsProps; pal: Palette; config: SceneChromeConfig }> = ({ p, pal, config }) => {
  const frame = useCurrentFrame();
  const y = interpolate(frame, [0, 22], [24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: config.header.left, top: config.header.top, width: config.header.width, color: pal.text, fontFamily: FONT, transform: `translateY(${y}px)`, opacity: interpolate(frame, [0, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
      <div style={{ color: pal.accent, font: `800 14px ${MONO}`, letterSpacing: ".22em" }}>{config.eyebrow}</div>
      <div style={{ marginTop: 16, fontSize: 66, lineHeight: .98, fontWeight: 900, letterSpacing: "-.065em" }}>{p.title}</div>
      <div style={{ marginTop: 18, color: alpha(pal.text, "b8"), fontSize: 23, lineHeight: 1.35 }}>{p.subtitle}</div>
    </div>
  );
};

const FrameLabel: React.FC<{ pal: Palette; config: SceneChromeConfig; text: string }> = ({ pal, config, text }) => (
  <div style={{ position: "absolute", ...(config.labelSide === "left" ? { left: 110 } : { right: 110 }), bottom: 72, display: "flex", alignItems: "center", gap: 12, color: alpha(pal.text, "80"), font: `700 12px ${MONO}`, letterSpacing: ".15em" }}>
    {config.labelSide === "left" ? <><span style={{ width: 34, height: 3, background: pal.accent }} />{text}</> : <>{text}<span style={{ width: 34, height: 3, background: pal.accent }} /></>}
  </div>
);

const Grid: React.FC<{ pal: Palette; opacity?: number }> = ({ pal, opacity = .32 }) => (
  <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, opacity }}>
    {Array.from({ length: 15 }, (_, i) => <line key={`h${i}`} x1="90" y1={180 + i * 58} x2="1830" y2={180 + i * 58} stroke={alpha(pal.primary, "30")} strokeWidth="1" />)}
    {Array.from({ length: 25 }, (_, i) => <line key={`v${i}`} x1={90 + i * 73} y1="170" x2={90 + i * 73} y2="950" stroke={alpha(pal.secondary, "26")} strokeWidth="1" />)}
  </svg>
);

const CellZoom: React.FC<{ p: ScienceVisualsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame * .055 * (p.speed ?? 1)) * .035;
  const labels = p.labels ?? ["membrane", "nucleus", "signal"];
  return <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
    <circle cx="1320" cy="555" r={285 * pulse} fill={alpha(pal.secondary, "12")} stroke={alpha(pal.secondary, "80")} strokeWidth="7" />
    <circle cx="1320" cy="555" r="190" fill={alpha(pal.primary, "35")} stroke={alpha(pal.primary, "bb")} strokeWidth="6" />
    <circle cx="1320" cy="555" r="82" fill={alpha(pal.accent, "75")} stroke={pal.accent} strokeWidth="5" />
    {Array.from({ length: 10 }, (_, i) => { const a = i * .63 + frame * .006; return <circle key={i} cx={1320 + Math.cos(a) * 230} cy={555 + Math.sin(a) * 230} r={8 + i % 3 * 3} fill={i % 2 ? pal.accent : pal.secondary} opacity={.75} />; })}
    <path d="M1110 370 L900 300 L750 300" fill="none" stroke={alpha(pal.text, "80")} strokeWidth="2" />
    <path d="M1320 474 L1320 310 L1480 310" fill="none" stroke={alpha(pal.text, "80")} strokeWidth="2" />
    <path d="M1510 640 L1670 730 L1770 730" fill="none" stroke={alpha(pal.text, "80")} strokeWidth="2" />
    <text x="750" y="282" fill={pal.text} fontFamily={MONO} fontSize="18">{labels[0] ?? "membrane"}</text>
    <text x="1480" y="292" fill={pal.text} fontFamily={MONO} fontSize="18">{labels[1] ?? "nucleus"}</text>
    <text x="1770" y="712" textAnchor="end" fill={pal.text} fontFamily={MONO} fontSize="18">{labels[2] ?? "signal"}</text>
  </svg>;
};

const ParticleCollision: React.FC<{ p: ScienceVisualsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const t = clamp(interpolate(frame, [12, 105], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), 0, 1); const impact = Math.exp(-Math.pow((t - .72) * 8, 2));
  return <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
    <line x1="820" y1="560" x2="1120" y2="560" stroke={alpha(pal.text, "28")} strokeWidth="2" strokeDasharray="12 18" />
    {[0, 1, 2, 3, 4].map((i) => <g key={`l${i}`}><circle cx={410 + t * 480} cy={430 + i * 65} r={14 + i * 2} fill={pal.primary} /><circle cx={1510 - t * 480} cy={430 + i * 65} r={14 + i * 2} fill={pal.secondary} /></g>)}
    {Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return <line key={i} x1="960" y1="560" x2={960 + Math.cos(a) * (110 + impact * 250)} y2={560 + Math.sin(a) * (110 + impact * 250)} stroke={i % 2 ? pal.accent : pal.secondary} strokeWidth={4 - i % 2} opacity={impact} />; })}
    <circle cx="960" cy="560" r={42 + impact * 32} fill={alpha(pal.accent, "88")} opacity={.7 + impact * .3} />
    <text x="960" y="760" textAnchor="middle" fill={alpha(pal.text, "9c")} fontFamily={MONO} fontSize="18" letterSpacing="5">COLLISION / ENERGY TRANSFER</text>
  </svg>;
};

const WaveInterference: React.FC<{ p: ScienceVisualsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const speed = p.speed ?? 1;
  const path = (phase: number, amp: number, color: string, opacity: number) => { const d = Array.from({ length: 80 }, (_, i) => { const x = 720 + i * 14; const y = 550 + Math.sin(i * .36 + frame * .055 * speed + phase) * amp; return `${i ? "L" : "M"}${x} ${y}`; }).join(" "); return <path d={d} fill="none" stroke={color} strokeWidth="5" opacity={opacity} />; };
  return <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
    <circle cx="650" cy="550" r="12" fill={pal.primary} /><circle cx="1830" cy="550" r="12" fill={pal.secondary} />
    <path d="M670 550 H720 M1810 550 H1830" stroke={alpha(pal.text, "4c")} strokeWidth="2" />
    {path(0, 72, pal.primary, .75)}{path(Math.PI, 72, pal.secondary, .75)}{path(Math.PI / 2, 112, pal.accent, .95)}
    <text x="720" y="430" fill={pal.primary} fontFamily={MONO} fontSize="17">WAVE A</text><text x="1660" y="430" fill={pal.secondary} fontFamily={MONO} fontSize="17">WAVE B</text><text x="1240" y="760" fill={pal.accent} fontFamily={MONO} fontSize="17">RESULTANT FIELD</text>
  </svg>;
};

const OrbitModel: React.FC<{ p: ScienceVisualsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const speed = p.speed ?? 1;
  return <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
    <circle cx="1320" cy="560" r="76" fill={alpha(pal.accent, "70")} stroke={pal.accent} strokeWidth="5" />
    {[0, 1, 2].map((i) => <g key={i} transform={`rotate(${i * 42 + frame * (i + 1) * .35 * speed} 1320 560) rotate(${i * 18} 1320 560)`}><ellipse cx="1320" cy="560" rx={150 + i * 75} ry={65 + i * 34} fill="none" stroke={alpha([pal.primary, pal.secondary, pal.text][i], "76")} strokeWidth="4" /><circle cx={1320 + 150 + i * 75} cy="560" r={16 - i * 2} fill={[pal.primary, pal.secondary, pal.text][i]} /></g>)}
    <text x="1320" y="740" textAnchor="middle" fill={alpha(pal.text, "9c")} fontFamily={MONO} fontSize="17" letterSpacing="4">ORBITAL RELATIONSHIPS / MODEL</text>
  </svg>;
};

const EcosystemWeb: React.FC<{ p: ScienceVisualsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const labels = p.labels ?? FALLBACK_LABELS; const points = p.nodes?.length ? p.nodes : Array.from({ length: 8 }, (_, i) => ({ x: 1080 + Math.cos(i * .78) * 290, y: 560 + Math.sin(i * .78) * 230, label: labels[i] })); const center = { x: 1320, y: 560 };
  return <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
    {points.map((n, i) => <line key={`l${i}`} x1={center.x} y1={center.y} x2={n.x} y2={n.y} stroke={alpha(pal.secondary, "64")} strokeWidth="3" strokeDasharray="10 12" strokeDashoffset={-frame * 2} />)}
    <circle cx={center.x} cy={center.y} r="72" fill={alpha(pal.accent, "80")} stroke={pal.accent} strokeWidth="5" /><text x={center.x} y={center.y + 6} textAnchor="middle" fill={pal.text} fontFamily={MONO} fontSize="15">CORE</text>
    {points.map((n, i) => <g key={`n${i}`}><circle cx={n.x} cy={n.y} r={32 + (i % 3) * 5} fill={alpha(i % 2 ? pal.primary : pal.secondary, "80")} stroke={alpha(pal.text, "70")} strokeWidth="3" /><text x={n.x} y={n.y + 58} textAnchor="middle" fill={pal.text} fontFamily={MONO} fontSize="14">{n.label ?? labels[i] ?? `NODE ${i + 1}`}</text></g>)}
  </svg>;
};

const LabProtocol: React.FC<{ p: ScienceVisualsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const progress = clamp(interpolate(frame, [15, 115], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), 0, 1); const labels = p.labels ?? ["prepare", "measure", "observe", "record"];
  return <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
    {[0, 1, 2, 3].map((i) => { const x = 820 + i * 220; const active = progress * 4 >= i; return <g key={i} opacity={interpolate(frame, [i * 10, i * 10 + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}><rect x={x - 68} y="475" width="136" height="210" rx="20" fill={alpha(active ? pal.primary : pal.text, active ? "45" : "12")} stroke={active ? pal.accent : alpha(pal.text, "45")} strokeWidth="4" /><path d={`M${x - 35} 560 Q${x} ${530 + Math.sin(frame * .05 + i) * 12} ${x + 35} 560 V635 Q${x} 665 ${x - 35} 635Z`} fill={alpha(i % 2 ? pal.secondary : pal.accent, active ? "98" : "35")} /><text x={x} y="745" textAnchor="middle" fill={pal.text} fontFamily={MONO} fontSize="15">{labels[i] ?? `STEP ${i + 1}`}</text></g>; })}
    <path d="M710 580 H760 M1290 580 H1340 M1510 580 H1560" stroke={pal.accent} strokeWidth="4" strokeDasharray="10 10" />
  </svg>;
};

const MoleculeBuild: React.FC<{ p: ScienceVisualsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const points = p.nodes?.length ? p.nodes : [{ x: 1050, y: 470 }, { x: 1270, y: 430 }, { x: 1450, y: 570 }, { x: 1210, y: 680 }, { x: 980, y: 650 }]; const reveal = clamp(interpolate(frame, [10, 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), 0, 1);
  return <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
    {points.slice(1).map((n, i) => <line key={i} x1={points[i].x} y1={points[i].y} x2={n.x} y2={n.y} stroke={alpha(pal.text, "76")} strokeWidth="12" opacity={reveal * clamp(reveal * 4 - i, 0, 1)} />)}
    {points.map((n, i) => <g key={i} opacity={clamp(reveal * 5 - i, 0, 1)}><circle cx={n.x} cy={n.y} r={48 - (i % 2) * 8} fill={alpha([pal.primary, pal.secondary, pal.accent][i % 3], "a8")} stroke={pal.text} strokeWidth="4" /><text x={n.x} y={n.y + 6} textAnchor="middle" fill={pal.text} fontFamily={MONO} fontSize="16">{p.labels?.[i] ?? ["C", "O", "H", "N", "S"][i]}</text></g>)}
  </svg>;
};

const EnergyTransfer: React.FC<{ p: ScienceVisualsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const values = p.values ?? [22, 45, 68, 88]; const flow = frame * .012 * (p.speed ?? 1);
  return <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
    {values.map((v, i) => { const x = 830 + i * 220; const h = v * 3.1; return <g key={i}><rect x={x - 62} y={720 - h} width="124" height={h} rx="12" fill={alpha(i % 2 ? pal.secondary : pal.primary, "70")} stroke={alpha(pal.text, "70")} strokeWidth="3" /><circle cx={x} cy={720 - h - 14 - Math.sin(flow + i) * 10} r="10" fill={pal.accent} /><text x={x} y="770" textAnchor="middle" fill={pal.text} fontFamily={MONO} fontSize="15">{p.labels?.[i] ?? `STAGE ${i + 1}`}</text>{i < values.length - 1 && <path d={`M${x + 76} 610 H${x + 144}`} stroke={pal.accent} strokeWidth="4" strokeDasharray="10 12" strokeDashoffset={-frame * 2} />}</g>; })}
  </svg>;
};

const RockCycle: React.FC<{ p: ScienceVisualsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const labels = p.labels ?? ["magma", "igneous", "sediment", "metamorphic"]; const points = labels.slice(0, 4).map((label, i) => ({ x: 1240 + Math.cos(i * Math.PI / 2 - Math.PI / 4) * 250, y: 560 + Math.sin(i * Math.PI / 2 - Math.PI / 4) * 190, label }));
  return <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
    {points.map((n, i) => { const next = points[(i + 1) % points.length]; return <g key={i}><path d={`M${n.x} ${n.y} Q1320 560 ${next.x} ${next.y}`} fill="none" stroke={alpha(pal.accent, "85")} strokeWidth="5" strokeDasharray="14 12" strokeDashoffset={-frame * 2} /><circle cx={n.x} cy={n.y} r="62" fill={alpha([pal.accent, pal.primary, pal.secondary, pal.text][i], "70")} stroke={pal.text} strokeWidth="4" /><text x={n.x} y={n.y + 5} textAnchor="middle" fill={pal.text} fontFamily={MONO} fontSize="14">{n.label}</text></g>; })}
    <circle cx="1320" cy="560" r="42" fill={alpha(pal.primary, "50")} /><text x="1320" y="566" textAnchor="middle" fill={pal.text} fontFamily={MONO} fontSize="13">CYCLE</text>
  </svg>;
};

const WeatherCycle: React.FC<{ p: ScienceVisualsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const phase = (frame * .012 * (p.speed ?? 1)) % (Math.PI * 2);
  return <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
    <circle cx="1320" cy="550" r="70" fill={alpha(pal.accent, "80")} stroke={pal.accent} strokeWidth="5" />
    {Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4 + phase; const x = 1320 + Math.cos(a) * 285; const y = 550 + Math.sin(a) * 190; return <g key={i}><line x1="1320" y1="550" x2={x} y2={y} stroke={alpha(pal.secondary, "50")} strokeWidth="3" strokeDasharray="10 12" /><circle cx={x} cy={y} r="28" fill={alpha(i % 2 ? pal.primary : pal.secondary, "75")} /><text x={x} y={y + 54} textAnchor="middle" fill={pal.text} fontFamily={MONO} fontSize="13">{(p.labels ?? ["sun", "cloud", "rain", "wind", "heat", "storm", "runoff", "vapor"])[i]}</text></g>; })}
  </svg>;
};

const SceneChrome: React.FC<{ pal: Palette; config: SceneChromeConfig }> = ({ pal, config }) => {
  const frame = useCurrentFrame();
  const { width: outputWidth, height: outputHeight } = useVideoConfig();
  const scale = Math.min(outputWidth / 1920, outputHeight / 1080);
  const { left, top, width, height, radius, border } = config.panel;
  const panel: React.CSSProperties = {
    position: "absolute", left, top, width, height, borderRadius: radius,
    border: `2px ${border} ${alpha(pal.accent, "66")}`,
    backgroundColor: alpha(pal.bg, "a8"), overflow: "hidden",
    boxShadow: `0 0 80px ${alpha(pal.primary, "18")} inset`,
  };
  const label: React.CSSProperties = {
    position: "absolute", color: alpha(pal.text, "70"), font: `700 12px ${MONO}`,
    letterSpacing: ".16em", whiteSpace: "nowrap", pointerEvents: "none",
  };
  return <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div style={{ position: "absolute", width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: "top left" }}>
    <div style={panel} />
    {config.kind === "cell" && <>
      <div style={{ position: "absolute", left: 790, top: 245, width: 940, height: 650, borderRadius: 330, border: `1px solid ${alpha(pal.secondary, "45")}`, transform: "rotate(-8deg)" }} />
      <div style={{ ...label, left: 820, top: 270, color: alpha(pal.secondary, "a0") }}>01 / SCALE UP</div>
      <div style={{ position: "absolute", left: 790, top: 535, width: 940, height: 1, background: alpha(pal.secondary, "38") }} />
    </>}
    {config.kind === "collision" && <>
      <div style={{ position: "absolute", left: 235, top: 285, width: 735, height: 555, background: `linear-gradient(90deg, ${alpha(pal.primary, "18")}, transparent)`, borderRight: `1px solid ${alpha(pal.primary, "55")}` }} />
      <div style={{ position: "absolute", left: 970, top: 285, width: 730, height: 555, background: `linear-gradient(90deg, transparent, ${alpha(pal.secondary, "18")})` }} />
      <div style={{ position: "absolute", left: 915, top: 530, width: 90, height: 90, border: `1px solid ${alpha(pal.accent, "90")}`, borderRadius: "50%", opacity: .65 + Math.sin(frame * .08) * .2 }} />
      <div style={{ ...label, left: 270, top: 310 }}>A / MOMENTUM</div><div style={{ ...label, right: 270, top: 310 }}>B / MOMENTUM</div>
    </>}
    {config.kind === "wave" && <>
      <div style={{ position: "absolute", left: 700, top: 360, width: 1080, height: 380, backgroundImage: `repeating-linear-gradient(0deg, ${alpha(pal.secondary, "12")} 0 1px, transparent 1px 38px), repeating-linear-gradient(90deg, ${alpha(pal.primary, "10")} 0 1px, transparent 1px 54px)` }} />
      <div style={{ position: "absolute", left: 700, top: 550, width: 1080, height: 2, background: alpha(pal.accent, "60") }} />
      <div style={{ ...label, left: 720, top: 365, color: alpha(pal.accent, "b0") }}>LIVE FIELD / t + {String(Math.round(frame / 30)).padStart(2, "0")}s</div>
    </>}
    {config.kind === "orbit" && <>
      {[0, 1].map(i => <div key={i} style={{ position: "absolute", left: 935 - i * 35, top: 270 - i * 25, width: 770 + i * 70, height: 600 + i * 50, borderRadius: "50%", border: `1px solid ${alpha(i ? pal.secondary : pal.primary, "38")}`, transform: `rotate(${i ? -16 : 12}deg)` }} />)}
      <div style={{ ...label, left: 920, top: 270, color: alpha(pal.accent, "a0") }}>REFERENCE FRAME / 03</div>
      <div style={{ position: "absolute", left: 1318, top: 520, width: 5, height: 80, background: pal.accent, opacity: .6 }} />
    </>}
    {config.kind === "web" && <>
      <div style={{ position: "absolute", left: 970, top: 255, width: 720, height: 640, borderRadius: "50%", background: `radial-gradient(circle, ${alpha(pal.primary, "28")} 0 2px, transparent 3px 38px, ${alpha(pal.secondary, "16")} 40px, transparent 41px)` }} />
      <div style={{ ...label, left: 990, top: 285, color: alpha(pal.secondary, "b0") }}>HABITAT / CONNECTION MAP</div>
      <div style={{ position: "absolute", left: 1290, top: 310, width: 60, height: 60, borderRadius: "50%", border: `2px solid ${alpha(pal.accent, "70")}` }} />
    </>}
    {config.kind === "lab" && <>
      <div style={{ position: "absolute", left: 710, top: 365, width: 910, height: 24, background: `repeating-linear-gradient(90deg, ${alpha(pal.accent, "70")} 0 2px, transparent 2px 44px)` }} />
      <div style={{ position: "absolute", left: 710, top: 400, width: 910, height: 1, background: alpha(pal.secondary, "55") }} />
      <div style={{ ...label, left: 710, top: 335, color: alpha(pal.accent, "b0") }}>PROTOCOL / CONTROLLED CONDITIONS</div>
      <div style={{ position: "absolute", left: 710, top: 805, width: 910, height: 1, background: alpha(pal.secondary, "55") }} />
    </>}
    {config.kind === "molecule" && <>
      <div style={{ position: "absolute", left: 805, top: 250, width: 870, height: 660, backgroundImage: `linear-gradient(30deg, ${alpha(pal.secondary, "12")} 12%, transparent 12.5% 87%, ${alpha(pal.secondary, "12")} 87.5%), linear-gradient(150deg, ${alpha(pal.secondary, "12")} 12%, transparent 12.5% 87%, ${alpha(pal.secondary, "12")} 87.5%)`, backgroundSize: "74px 128px" }} />
      <div style={{ ...label, left: 840, top: 280, color: alpha(pal.accent, "b0") }}>MOLECULAR LATTICE / BUILD SEQUENCE</div>
      <div style={{ position: "absolute", left: 820, top: 870, width: 840, height: 2, background: `linear-gradient(90deg, transparent, ${alpha(pal.accent, "90")}, transparent)` }} />
    </>}
    {config.kind === "energy" && <>
      <div style={{ position: "absolute", left: 720, top: 340, width: 1040, height: 460, background: `linear-gradient(180deg, ${alpha(pal.primary, "1c")}, transparent 75%), repeating-linear-gradient(0deg, ${alpha(pal.text, "12")} 0 1px, transparent 1px 72px)` }} />
      <div style={{ position: "absolute", left: 720, top: 720, width: 1040, height: 3, background: alpha(pal.accent, "80") }} />
      <div style={{ ...label, left: 740, top: 315, color: alpha(pal.accent, "b0") }}>TRANSFER INDEX / RELATIVE UNITS</div>
    </>}
    {config.kind === "rock" && <>
      <div style={{ position: "absolute", left: 930, top: 290, width: 790, height: 560, borderRadius: "50%", border: `1px dashed ${alpha(pal.primary, "55")}`, transform: "rotate(18deg)" }} />
      <div style={{ position: "absolute", left: 1010, top: 370, width: 630, height: 400, borderRadius: "50%", border: `1px solid ${alpha(pal.secondary, "35")}`, transform: "rotate(-24deg)" }} />
      <div style={{ ...label, left: 960, top: 275, color: alpha(pal.accent, "b0") }}>GEOLOGIC TIME / RECORDED STATES</div>
    </>}
    {config.kind === "weather" && <>
      <div style={{ position: "absolute", left: 680, top: 250, width: 1160, height: 650, borderRadius: "50%", background: `linear-gradient(180deg, ${alpha(pal.secondary, "1c")} 0 56%, ${alpha(pal.primary, "18")} 56% 72%, ${alpha(pal.accent, "16")} 72%)` }} />
      <div style={{ position: "absolute", left: 700, top: 610, width: 1120, height: 2, background: alpha(pal.secondary, "60") }} />
      <div style={{ ...label, left: 720, top: 280, color: alpha(pal.secondary, "b0") }}>ATMOSPHERIC LOOP / OBSERVED CONDITIONS</div>
      <div style={{ position: "absolute", left: 1580, top: 330, width: 100, height: 100, borderRadius: "50%", background: `radial-gradient(circle, ${alpha(pal.accent, "80")} 0 12%, transparent 13%)`, boxShadow: `0 0 42px ${alpha(pal.accent, "50")}` }} />
    </>}
    </div>
  </AbsoluteFill>;
};

const VARIANTS: Record<ScienceVariant, React.FC<{ p: ScienceVisualsProps; pal: Palette }>> = {
  "cell-zoom": CellZoom,
  "particle-collision": ParticleCollision,
  "wave-interference": WaveInterference,
  "orbit-model": OrbitModel,
  "ecosystem-web": EcosystemWeb,
  "lab-protocol": LabProtocol,
  "molecule-build": MoleculeBuild,
  "energy-transfer": EnergyTransfer,
  "rock-cycle": RockCycle,
  "weather-cycle": WeatherCycle,
};

export const ScienceVisualsTemplate: React.FC<ScienceVisualsProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? CellZoom;
  const config = CHROME[props.variant] ?? CHROME["cell-zoom"];
  return <AbsoluteFill style={{ backgroundColor: pal.bg, overflow: "hidden" }}>
    <GradientMeshBackground palette={pal} blobs={config.kind === "weather" ? 6 : config.kind === "lab" ? 3 : 4} speed={config.kind === "collision" ? .5 : .28} />
    <SceneChrome pal={pal} config={config} />
    <Grid pal={pal} opacity={config.gridOpacity} />
    <div style={{ position: "absolute", inset: 0, transform: "translate(38px, 70px) scale(.72)", transformOrigin: "top left" }}>
      <FadeEdges inFrames={12} outFrames={14}><Variant p={props} pal={pal} /></FadeEdges>
    </div>
    <div style={{ position: "absolute", left: 0, top: 0, width: 820, height: 300, background: `linear-gradient(90deg, ${pal.bg} 0%, ${alpha(pal.bg, "c8")} 54%, transparent 100%)`, pointerEvents: "none" }} />
    <Header p={props} pal={pal} config={config} />
    <FrameLabel pal={pal} config={config} text={props.caption ?? config.frame} />
  </AbsoluteFill>;
};

const familyCast = (c: React.FC<ScienceVisualsProps>) => c as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "science-visuals-cell-zoom": familyCast(ScienceVisualsTemplate),
  "science-visuals-particle-collision": familyCast(ScienceVisualsTemplate),
  "science-visuals-wave-interference": familyCast(ScienceVisualsTemplate),
  "science-visuals-orbit-model": familyCast(ScienceVisualsTemplate),
  "science-visuals-ecosystem-web": familyCast(ScienceVisualsTemplate),
  "science-visuals-lab-protocol": familyCast(ScienceVisualsTemplate),
  "science-visuals-molecule-build": familyCast(ScienceVisualsTemplate),
  "science-visuals-energy-transfer": familyCast(ScienceVisualsTemplate),
  "science-visuals-rock-cycle": familyCast(ScienceVisualsTemplate),
  "science-visuals-weather-cycle": familyCast(ScienceVisualsTemplate),
};
