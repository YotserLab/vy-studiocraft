import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, GradientMeshBackground, clampInterp, resolvePalette, type Palette } from "../lib/primitives";

/**
 * FAMILY: infographics
 * Ten data-led, one-page compositions for facts, reports, comparisons, and recaps.
 * All visuals are procedural SVG/CSS so the defaults render without external assets.
 */
export type InfographicsVariant =
  | "fact-stack"
  | "icon-stat-grid"
  | "comparison-infographic"
  | "ranked-infographic"
  | "process-infographic"
  | "annual-report"
  | "one-page-brief"
  | "fact-vs-fiction"
  | "metric-spotlight"
  | "infographic-recap";

export interface InfographicFact {
  id?: string;
  label: string;
  value: string | number;
  detail?: string;
  source?: string;
  group?: string;
  icon?: string;
  color?: string;
  trend?: number;
}

export interface InfographicsProps {
  variant: InfographicsVariant;
  title: string;
  subtitle: string;
  paletteName: string;
  facts?: InfographicFact[];
  source?: string;
  footnote?: string;
  accentColor?: string;
  speed?: number;
  showSource?: boolean;
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const DEFAULT_FACTS: InfographicFact[] = [
  { label: "People reached", value: "2.4M", detail: "Across 42 markets", icon: "↗", trend: 18 },
  { label: "Hours saved", value: "18,640", detail: "Since the launch", icon: "◷", trend: 32 },
  { label: "Completion rate", value: "86%", detail: "Up from 71%", icon: "✓", trend: 21 },
  { label: "Projects shipped", value: 128, detail: "This quarter", icon: "◆", trend: 14 },
  { label: "Customer score", value: "4.8", detail: "From 3,200 responses", icon: "★", trend: 9 },
  { label: "Repeat usage", value: "63%", detail: "Within 30 days", icon: "↻", trend: 27 },
];

const factsOf = (p: InfographicsProps): InfographicFact[] => {
  const facts = p.facts?.length ? p.facts : DEFAULT_FACTS;
  return facts.slice(0, 8).map((fact, i) => ({ ...fact, id: fact.id ?? `fact-${i + 1}`, label: fact.label || `Fact ${i + 1}` }));
};

const text = (pal: Palette, alpha = "") => `${pal.text}${alpha}`;
const colorsOf = (pal: Palette, accent?: string): string[] => [accent ?? pal.primary, pal.secondary, pal.accent, "#a78bfa", "#22d3ee", "#fbbf24"];
const numericValue = (value: string | number, fallback: number): number => {
  if (typeof value === "number") return value;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
};
const maxOf = (facts: InfographicFact[]): number => Math.max(1, ...facts.map((fact, i) => Math.max(0, numericValue(fact.value, 40 + i * 8))));

const Header: React.FC<{ p: InfographicsProps; pal: Palette; eyebrow: string }> = ({ p, pal, eyebrow }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 30 }}>
    <div style={{ maxWidth: 1250 }}>
      <div style={{ color: pal.accent, font: `800 15px ${MONO}`, letterSpacing: ".2em", textTransform: "uppercase" }}>{eyebrow}</div>
      <div style={{ marginTop: 13, color: pal.text, fontSize: 54, fontWeight: 820, letterSpacing: "-.045em", lineHeight: 1.03 }}>{p.title}</div>
      <div style={{ marginTop: 14, color: text(pal, "a0"), fontSize: 23, letterSpacing: ".015em" }}>{p.subtitle}</div>
    </div>
    <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 10, paddingTop: 8, color: text(pal, "80"), font: `700 13px ${MONO}`, letterSpacing: ".16em", textTransform: "uppercase" }}>
      <span style={{ width: 10, height: 10, borderRadius: "50%", background: pal.accent, boxShadow: `0 0 20px ${pal.accent}` }} />
      Field notes
    </div>
  </div>
);

const SourceLine: React.FC<{ p: InfographicsProps; pal: Palette }> = ({ p, pal }) => {
  if (p.showSource === false) return null;
  const source = p.source ?? "Source: internal benchmark / 2025 report";
  const footnote = p.footnote ?? "Values shown for illustrative use.";
  const metadataStyle: React.CSSProperties = {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };
  return <div style={{ position: "absolute", left: 102, right: 102, bottom: 38, height: 42, boxSizing: "border-box", display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", alignItems: "center", gap: 28, padding: "0 14px", borderTop: `1px solid ${text(pal, "18")}`, color: text(pal, "68"), font: `500 14px ${MONO}`, letterSpacing: ".03em" }}><span style={metadataStyle}>{source}</span><span style={{ ...metadataStyle, textAlign: "right" }}>{footnote}</span></div>;
};

const Panel: React.FC<{ pal: Palette; children: React.ReactNode; style?: React.CSSProperties }> = ({ pal, children, style }) => (
  <div style={{ background: `linear-gradient(145deg, ${text(pal, "12")}, ${text(pal, "05")} 72%)`, border: `1px solid ${text(pal, "20")}`, borderRadius: 26, boxShadow: `0 24px 70px ${pal.bg}99`, ...style }}>{children}</div>
);

const Reveal: React.FC<{ index: number; count: number; speed: number; children: React.ReactNode }> = ({ index, count, speed, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: Math.max(0, frame - index * 5 / Math.max(.25, speed)), fps, config: { damping: 18, stiffness: 120, mass: .8 } });
  return <div style={{ opacity: progress, transform: `translateY(${(1 - progress) * 28}px) scale(${.96 + progress * .04})`, transformOrigin: "center" }}>{children}</div>;
};

const FactStack: React.FC<{ facts: InfographicFact[]; pal: Palette; accent: string; speed: number }> = ({ facts, pal, accent, speed }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 44 }}>
    {facts.slice(0, 6).map((fact, i) => <Reveal key={fact.id ?? i} index={i} count={facts.length} speed={speed}><Panel pal={pal} style={{ minHeight: 135, padding: "24px 28px", display: "grid", gridTemplateColumns: "54px 1fr auto", alignItems: "center", gap: 18 }}>
      <div style={{ width: 48, height: 48, display: "grid", placeItems: "center", borderRadius: 16, color: fact.color ?? accent, background: `${fact.color ?? accent}22`, fontSize: 25, fontWeight: 800 }}>{fact.icon ?? `${i + 1}`}</div>
      <div><div style={{ color: text(pal, "8b"), fontSize: 17 }}>{fact.label}</div><div style={{ marginTop: 5, font: `800 34px ${MONO}`, color: pal.text }}>{fact.value}</div><div style={{ marginTop: 4, color: text(pal, "60"), fontSize: 14 }}>{fact.detail ?? "Measured across the reporting period"}</div></div>
      <div style={{ color: fact.trend && fact.trend >= 0 ? pal.secondary : "#fb7185", font: `800 17px ${MONO}` }}>{fact.trend !== undefined ? `${fact.trend >= 0 ? "+" : ""}${fact.trend}%` : "—"}</div>
    </Panel></Reveal>)}
  </div>
);

const IconStatGrid: React.FC<{ facts: InfographicFact[]; pal: Palette; accent: string; speed: number }> = ({ facts, pal, accent, speed }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginTop: 42 }}>
    {facts.slice(0, 6).map((fact, i) => <Reveal key={fact.id ?? i} index={i} count={facts.length} speed={speed}><Panel pal={pal} style={{ height: 220, padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between", borderTop: `3px solid ${fact.color ?? colorsOf(pal, accent)[i % 6]}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ width: 54, height: 54, borderRadius: "50%", display: "grid", placeItems: "center", background: `${fact.color ?? accent}20`, color: fact.color ?? accent, fontSize: 28 }}>{fact.icon ?? "✦"}</div><span style={{ color: text(pal, "55"), font: `700 12px ${MONO}` }}>0{i + 1}</span></div>
      <div><div style={{ font: `800 38px ${MONO}`, color: pal.text }}>{fact.value}</div><div style={{ marginTop: 7, fontSize: 16, color: text(pal, "a0") }}>{fact.label}</div></div>
    </Panel></Reveal>)}
  </div>
);

const Comparison: React.FC<{ facts: InfographicFact[]; pal: Palette; accent: string; speed: number }> = ({ facts, pal, accent, speed }) => {
  const frame = useCurrentFrame();
  const values = facts.slice(0, 6);
  const max = maxOf(values);
  return <div style={{ marginTop: 42, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}><Panel pal={pal} style={{ padding: 34 }}><div style={{ color: text(pal, "70"), font: `700 13px ${MONO}`, letterSpacing: ".16em" }}>BEFORE / BASELINE</div>{values.slice(0, 3).map((f, i) => { const w = clampInterp(frame, [10 + i * 5, 70 + i * 5], [0, Math.max(14, numericValue(f.value, 50) / max * 100)]); return <div key={f.id ?? i} style={{ marginTop: 26 }}><div style={{ display: "flex", justifyContent: "space-between", color: text(pal, "b0"), fontSize: 17 }}><span>{f.label}</span><span style={{ font: `700 16px ${MONO}` }}>{f.value}</span></div><div style={{ marginTop: 9, height: 18, borderRadius: 99, background: `${pal.text}10` }}><div style={{ width: `${w}%`, height: "100%", borderRadius: 99, background: `${pal.text}55` }} /></div></div>; })}</Panel><Panel pal={pal} style={{ padding: 34, borderColor: `${accent}55` }}><div style={{ color: accent, font: `700 13px ${MONO}`, letterSpacing: ".16em" }}>AFTER / OUTCOME</div>{values.slice(3, 6).map((f, i) => { const w = clampInterp(frame, [18 + i * 5, 78 + i * 5], [0, Math.max(14, numericValue(f.value, 70) / max * 100)]); return <div key={f.id ?? i} style={{ marginTop: 26 }}><div style={{ display: "flex", justifyContent: "space-between", color: text(pal, "b0"), fontSize: 17 }}><span>{f.label}</span><span style={{ font: `700 16px ${MONO}`, color: accent }}>{f.value}</span></div><div style={{ marginTop: 9, height: 18, borderRadius: 99, background: `${accent}16` }}><div style={{ width: `${w}%`, height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${accent}, ${pal.secondary})`, boxShadow: `0 0 22px ${accent}55` }} /></div></div>; })}</Panel></div>;
};

const Ranked: React.FC<{ facts: InfographicFact[]; pal: Palette; accent: string; speed: number }> = ({ facts, pal, accent, speed }) => {
  const frame = useCurrentFrame(); const sorted = [...facts].sort((a, b) => numericValue(b.value, 0) - numericValue(a.value, 0)).slice(0, 6); const max = maxOf(sorted);
  return <Panel pal={pal} style={{ marginTop: 42, padding: "28px 38px" }}>{sorted.map((f, i) => { const width = clampInterp(frame, [8 + i * 5, 64 + i * 5], [0, Math.max(12, numericValue(f.value, 50) / max * 100)]); return <Reveal key={f.id ?? i} index={i} count={sorted.length} speed={speed}><div style={{ display: "grid", gridTemplateColumns: "54px 220px 1fr 100px", alignItems: "center", gap: 18, height: 78, borderBottom: i < sorted.length - 1 ? `1px solid ${text(pal, "10")}` : "none" }}><div style={{ color: i === 0 ? accent : text(pal, "65"), font: `850 ${i === 0 ? 29 : 22}px ${MONO}` }}>{String(i + 1).padStart(2, "0")}</div><div style={{ color: text(pal, "c5"), fontSize: 18 }}>{f.label}</div><div style={{ height: 20, borderRadius: 99, background: `${pal.text}0c` }}><div style={{ width: `${width}%`, height: "100%", borderRadius: 99, background: i === 0 ? `linear-gradient(90deg, ${accent}, ${pal.secondary})` : `${pal.primary}aa` }} /></div><div style={{ color: pal.text, textAlign: "right", font: `750 19px ${MONO}` }}>{f.value}</div></div></Reveal>; })}</Panel>;
};

const Process: React.FC<{ facts: InfographicFact[]; pal: Palette; accent: string; speed: number }> = ({ facts, pal, accent, speed }) => {
  const frame = useCurrentFrame(); const shown = facts.slice(0, 5); const progress = clampInterp(frame, [10, 82], [0, 1]);
  return <div style={{ position: "relative", marginTop: 54, height: 470, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18 }}><div style={{ position: "absolute", left: 105, right: 105, top: 205, height: 4, background: `${pal.text}1f` }}><div style={{ width: `${progress * 100}%`, height: "100%", background: `linear-gradient(90deg, ${accent}, ${pal.secondary})`, boxShadow: `0 0 25px ${accent}` }} /></div>{shown.map((f, i) => <Reveal key={f.id ?? i} index={i} count={shown.length} speed={speed}><div style={{ position: "relative", zIndex: 1, width: 245, textAlign: "center" }}><div style={{ margin: "0 auto", width: 104, height: 104, borderRadius: "50%", display: "grid", placeItems: "center", color: pal.bg, background: `linear-gradient(145deg, ${i === 0 ? accent : pal.primary}, ${pal.secondary})`, boxShadow: `0 16px 40px ${accent}35`, font: `850 28px ${MONO}` }}>{String(i + 1).padStart(2, "0")}</div><div style={{ marginTop: 25, color: pal.text, fontSize: 20, fontWeight: 750 }}>{f.label}</div><div style={{ marginTop: 8, color: text(pal, "70"), fontSize: 15, lineHeight: 1.35 }}>{f.detail ?? f.value}</div></div></Reveal>)}</div>;
};

const AnnualReport: React.FC<{ facts: InfographicFact[]; pal: Palette; accent: string; speed: number }> = ({ facts, pal, accent, speed }) => {
  const frame = useCurrentFrame(); const values = facts.slice(0, 6).map((f, i) => numericValue(f.value, 35 + i * 9)); const max = Math.max(1, ...values);
  const points = values.map((v, i) => `${(i / Math.max(1, values.length - 1)) * 950},${270 - (v / max) * 220}`).join(" ");
  return <div style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 22, marginTop: 42 }}><Panel pal={pal} style={{ padding: 28, height: 450 }}><div style={{ color: text(pal, "75"), font: `700 13px ${MONO}`, letterSpacing: ".16em" }}>YEAR OVER YEAR</div><svg viewBox="-15 0 980 330" width="100%" height="360" style={{ marginTop: 20 }}><path d={`M ${points} L950,300 L0,300 Z`} fill={`${accent}18`} /><polyline points={points} fill="none" stroke={accent} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clampInterp(frame, [12, 78], [0, 1])} />{values.map((v, i) => <circle key={i} cx={(i / Math.max(1, values.length - 1)) * 950} cy={270 - (v / max) * 220} r="9" fill={pal.bg} stroke={pal.secondary} strokeWidth="5" />)}</svg></Panel><div style={{ display: "grid", gridTemplateRows: "repeat(3, 1fr)", gap: 15 }}>{facts.slice(0, 3).map((f, i) => <Reveal key={f.id ?? i} index={i} count={3} speed={speed}><Panel pal={pal} style={{ padding: "21px 25px", display: "flex", alignItems: "center", justifyContent: "space-between" }}><span style={{ color: text(pal, "90"), fontSize: 17 }}>{f.label}</span><strong style={{ color: i === 0 ? accent : pal.text, font: `800 28px ${MONO}` }}>{f.value}</strong></Panel></Reveal>)}</div></div>;
};

const OnePageBrief: React.FC<{ facts: InfographicFact[]; pal: Palette; accent: string; speed: number }> = ({ facts, pal, accent, speed }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gridTemplateRows: "1fr 1fr", gap: 18, marginTop: 40, height: 490 }}><Reveal index={0} count={4} speed={speed}><Panel pal={pal} style={{ gridRow: "1 / span 2", padding: 34, display: "flex", flexDirection: "column", justifyContent: "space-between", background: `linear-gradient(145deg, ${accent}28, ${pal.primary}0a)` }}><div><div style={{ color: accent, font: `700 13px ${MONO}`, letterSpacing: ".18em" }}>THE TAKEAWAY</div><div style={{ marginTop: 22, fontSize: 46, fontWeight: 800, letterSpacing: "-.04em", lineHeight: 1.05 }}>{facts[0]?.detail ?? "A small set of clear facts can move a large decision forward."}</div></div><div style={{ color: text(pal, "70"), font: `500 14px ${MONO}` }}>{facts[0]?.label ?? "Signal"} / {facts[0]?.value ?? "0"}</div></Panel></Reveal>{facts.slice(1, 5).map((f, i) => <Reveal key={f.id ?? i} index={i + 1} count={4} speed={speed}><Panel pal={pal} style={{ padding: 23, display: "flex", alignItems: "center", justifyContent: "space-between" }}><div><div style={{ color: text(pal, "78"), fontSize: 16 }}>{f.label}</div><div style={{ marginTop: 5, color: pal.text, font: `800 28px ${MONO}` }}>{f.value}</div></div><div style={{ color: i % 2 === 0 ? accent : pal.secondary, fontSize: 26 }}>{f.icon ?? "•"}</div></Panel></Reveal>)}</div>
);

const FactVsFiction: React.FC<{ facts: InfographicFact[]; pal: Palette; accent: string; speed: number }> = ({ facts, pal, accent, speed }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 42 }}><Panel pal={pal} style={{ padding: 30, borderTop: `4px solid ${pal.secondary}` }}><div style={{ color: pal.secondary, font: `800 14px ${MONO}`, letterSpacing: ".17em" }}>FACT</div>{facts.slice(0, 3).map((f, i) => <Reveal key={f.id ?? i} index={i} count={3} speed={speed}><div style={{ marginTop: 22, padding: 20, borderRadius: 17, background: `${pal.secondary}0d` }}><div style={{ fontSize: 20, fontWeight: 750 }}>{f.label}</div><div style={{ marginTop: 8, color: pal.secondary, font: `800 27px ${MONO}` }}>{f.value}</div><div style={{ marginTop: 6, color: text(pal, "75"), fontSize: 14 }}>{f.detail ?? "Supported by the available evidence."}</div></div></Reveal>)}</Panel><Panel pal={pal} style={{ padding: 30, borderTop: `4px solid ${accent}` }}><div style={{ color: accent, font: `800 14px ${MONO}`, letterSpacing: ".17em" }}>CONTEXT</div>{facts.slice(3, 6).map((f, i) => <Reveal key={f.id ?? i} index={i} count={3} speed={speed}><div style={{ marginTop: 22, padding: 20, borderRadius: 17, background: `${accent}0d` }}><div style={{ fontSize: 20, fontWeight: 750 }}>{f.label}</div><div style={{ marginTop: 8, color: accent, font: `800 27px ${MONO}` }}>{f.value}</div><div style={{ marginTop: 6, color: text(pal, "75"), fontSize: 14 }}>{f.detail ?? "Add the nuance your audience needs."}</div></div></Reveal>)}</Panel></div>
);

const MetricSpotlight: React.FC<{ facts: InfographicFact[]; pal: Palette; accent: string; speed: number }> = ({ facts, pal, accent, speed }) => {
  const frame = useCurrentFrame(); const main = facts[0] ?? DEFAULT_FACTS[0]; const scale = spring({ frame: Math.max(0, frame - 8), fps: 30, config: { damping: 16, stiffness: 100 } });
  return <div style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 22, marginTop: 42, height: 470 }}><Panel pal={pal} style={{ padding: 40, display: "flex", flexDirection: "column", justifyContent: "center", background: `radial-gradient(circle at 30% 40%, ${accent}2b, transparent 64%), ${pal.bg}66` }}><div style={{ color: text(pal, "72"), font: `700 15px ${MONO}`, letterSpacing: ".18em" }}>THE NUMBER TO REMEMBER</div><div style={{ marginTop: 18, color: accent, font: `900 145px ${MONO}`, letterSpacing: "-.09em", lineHeight: .9, transform: `scale(${.82 + scale * .18})`, transformOrigin: "left center", textShadow: `0 0 42px ${accent}35` }}>{main.value}</div><div style={{ marginTop: 23, color: pal.text, fontSize: 29, fontWeight: 760 }}>{main.label}</div><div style={{ marginTop: 9, color: text(pal, "82"), fontSize: 18 }}>{main.detail}</div></Panel><div style={{ display: "grid", gridTemplateRows: "repeat(3, 1fr)", gap: 15 }}>{facts.slice(1, 4).map((f, i) => <Reveal key={f.id ?? i} index={i} count={3} speed={speed}><Panel pal={pal} style={{ padding: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}><div><div style={{ color: text(pal, "80"), fontSize: 16 }}>{f.label}</div><div style={{ marginTop: 7, font: `800 31px ${MONO}`, color: pal.text }}>{f.value}</div></div><span style={{ color: colorsOf(pal, accent)[(i + 1) % 6], fontSize: 25 }}>{f.icon ?? "↗"}</span></Panel></Reveal>)}</div></div>;
};

const Recap: React.FC<{ facts: InfographicFact[]; pal: Palette; accent: string; speed: number }> = ({ facts, pal, accent, speed }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 17, marginTop: 42 }}>{facts.slice(0, 6).map((f, i) => <Reveal key={f.id ?? i} index={i} count={facts.length} speed={speed}><Panel pal={pal} style={{ minHeight: 210, padding: 25, display: "flex", flexDirection: "column", justifyContent: "space-between", borderBottom: `3px solid ${colorsOf(pal, accent)[i % 6]}` }}><div style={{ display: "flex", justifyContent: "space-between", color: text(pal, "65"), font: `700 12px ${MONO}` }}><span>CHAPTER {String(i + 1).padStart(2, "0")}</span><span>{f.icon ?? "✦"}</span></div><div><div style={{ font: `800 38px ${MONO}`, color: colorsOf(pal, accent)[i % 6] }}>{f.value}</div><div style={{ marginTop: 9, color: pal.text, fontSize: 17, fontWeight: 700 }}>{f.label}</div><div style={{ marginTop: 5, color: text(pal, "6f"), fontSize: 14 }}>{f.detail}</div></div></Panel></Reveal>)}</div>
);

export const InfographicsTemplate: React.FC<InfographicsProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const facts = factsOf(props);
  const accent = props.accentColor ?? pal.accent;
  const speed = props.speed ?? 1;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  const body = (() => {
    switch (props.variant) {
      case "fact-stack": return <FactStack facts={facts} pal={pal} accent={accent} speed={speed} />;
      case "icon-stat-grid": return <IconStatGrid facts={facts} pal={pal} accent={accent} speed={speed} />;
      case "comparison-infographic": return <Comparison facts={facts} pal={pal} accent={accent} speed={speed} />;
      case "ranked-infographic": return <Ranked facts={facts} pal={pal} accent={accent} speed={speed} />;
      case "process-infographic": return <Process facts={facts} pal={pal} accent={accent} speed={speed} />;
      case "annual-report": return <AnnualReport facts={facts} pal={pal} accent={accent} speed={speed} />;
      case "one-page-brief": return <OnePageBrief facts={facts} pal={pal} accent={accent} speed={speed} />;
      case "fact-vs-fiction": return <FactVsFiction facts={facts} pal={pal} accent={accent} speed={speed} />;
      case "metric-spotlight": return <MetricSpotlight facts={facts} pal={pal} accent={accent} speed={speed} />;
      case "infographic-recap": return <Recap facts={facts} pal={pal} accent={accent} speed={speed} />;
      default: return <FactStack facts={facts} pal={pal} accent={accent} speed={speed} />;
    }
  })();
  const eyebrow = props.variant.replace(/-/g, " ").toUpperCase();
  return <AbsoluteFill style={{ backgroundColor: pal.bg, color: pal.text, fontFamily: FONT, overflow: "hidden" }}>
    <GradientMeshBackground palette={pal} speed={0.25 * speed} blobs={props.variant === "metric-spotlight" ? 5 : 3} />
    <FadeEdges inFrames={12} outFrames={14}>
      <div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}>
      <AbsoluteFill style={{ padding: "70px 102px 150px" }}>
        <Header p={props} pal={pal} eyebrow={eyebrow} />
        {body}
      </AbsoluteFill>
      </div>
    </FadeEdges>
    <SourceLine p={props} pal={pal} />
  </AbsoluteFill>;
};

const familyCast = (component: React.FC<InfographicsProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "infographics-fact-stack": familyCast(InfographicsTemplate),
  "infographics-icon-stat-grid": familyCast(InfographicsTemplate),
  "infographics-comparison-infographic": familyCast(InfographicsTemplate),
  "infographics-ranked-infographic": familyCast(InfographicsTemplate),
  "infographics-process-infographic": familyCast(InfographicsTemplate),
  "infographics-annual-report": familyCast(InfographicsTemplate),
  "infographics-one-page-brief": familyCast(InfographicsTemplate),
  "infographics-fact-vs-fiction": familyCast(InfographicsTemplate),
  "infographics-metric-spotlight": familyCast(InfographicsTemplate),
  "infographics-infographic-recap": familyCast(InfographicsTemplate),
};
