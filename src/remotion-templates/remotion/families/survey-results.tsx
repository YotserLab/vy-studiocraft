import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, clampInterp, resolvePalette, type Palette } from "../lib/primitives";

/**
 * FAMILY: survey-results
 * Ten evidence-led survey and poll compositions. Data defaults are intentionally
 * compact and neutral so an agent can replace them with a real survey export.
 */
type SurveyVariant =
  | "question-to-chart"
  | "response-distribution"
  | "segment-compare"
  | "nps-reveal"
  | "sentiment-split"
  | "open-text-wall"
  | "response-rate"
  | "trend-by-wave"
  | "top-insight"
  | "survey-recap";

export interface SurveyResponse {
  label: string;
  value: number;
  color?: string;
}

export interface SurveySegment {
  label: string;
  values: number[];
}

export interface SurveyWave {
  label: string;
  value: number;
}

export interface SurveyResultsProps {
  variant: SurveyVariant;
  surveyTitle: string;
  question: string;
  responses?: SurveyResponse[];
  segments?: SurveySegment[];
  labels?: string[];
  values?: number[];
  waves?: SurveyWave[];
  comments?: string[];
  sampleSize?: number;
  responseRate?: number;
  npsScore?: number;
  insight?: string;
  methodology?: string;
  paletteName: string;
  accentColor?: string;
}

type VariantProps = { p: SurveyResultsProps; pal: Palette };
const SANS = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const SERIF = 'Georgia, "Times New Roman", serif';

const FALLBACK_RESPONSES: SurveyResponse[] = [
  { label: "Very likely", value: 46 },
  { label: "Somewhat likely", value: 31 },
  { label: "Not sure", value: 14 },
  { label: "Unlikely", value: 9 },
];
const FALLBACK_SEGMENTS: SurveySegment[] = [
  { label: "New users", values: [38, 29, 21, 12] },
  { label: "Returning users", values: [52, 27, 13, 8] },
];
const FALLBACK_WAVES: SurveyWave[] = [
  { label: "Wave 01", value: 54 },
  { label: "Wave 02", value: 61 },
  { label: "Wave 03", value: 67 },
  { label: "Wave 04", value: 72 },
  { label: "Wave 05", value: 78 },
];
const FALLBACK_COMMENTS = [
  "It finally feels simple enough to use every week.",
  "The biggest win is knowing what to do next.",
  "I can see the value before I have to learn the whole system.",
  "The workflow is clear, but still leaves room for my own style.",
];

const cleanText = (value: unknown, fallback: string): string => {
  const text = String(value ?? "").trim();
  return text || fallback;
};
const limit = <T,>(items: T[] | undefined, fallback: T[], count: number): T[] =>
  (items && items.length ? items : fallback).slice(0, count);
const safeNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const colors = (pal: Palette, accent: string): string[] => [accent, pal.secondary, pal.primary, pal.accent, "#f59e0b", "#a78bfa"];
const maxOf = (items: number[], fallback = 100): number => Math.max(fallback, ...items.map((x) => safeNumber(x, 0)));
const boundedFont = (text: string, max: number, min: number, softLimit: number, slope: number): number => Math.max(min, max - Math.max(0, text.length - softLimit) * slope);

const Backdrop: React.FC<{ pal: Palette; accent: string }> = ({ pal, accent }) => (
  <AbsoluteFill
    style={{
      backgroundColor: pal.bg,
      backgroundImage: `radial-gradient(circle at 12% 18%, ${accent}1f, transparent 32%), radial-gradient(circle at 88% 82%, ${pal.secondary}18, transparent 35%)`,
    }}
  />
);

const Eyebrow: React.FC<{ pal: Palette; accent: string; children: React.ReactNode }> = ({ pal, accent, children }) => (
  <div style={{ color: accent, fontFamily: MONO, fontSize: 17, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase" }}>{children}</div>
);

const Panel: React.FC<{ pal: Palette; accent: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ pal, accent, children, style }) => (
  <div style={{ border: `1px solid ${pal.secondary}38`, borderRadius: 26, background: `${pal.bg}df`, boxShadow: `0 24px 80px ${pal.bg}99`, ...style }}>{children}</div>
);

const Header: React.FC<{ p: SurveyResultsProps; pal: Palette; accent: string; label?: string }> = ({ p, pal, accent, label = "SURVEY / INSIGHT" }) => {
  const title = cleanText(p.surveyTitle, "Audience pulse");
  const question = cleanText(p.question, "What matters most to your audience?");
  return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 32, minWidth: 0 }}>
    <div style={{ minWidth: 0, maxWidth: 1160, flex: 1 }}>
      <Eyebrow pal={pal} accent={accent}>{label}</Eyebrow>
      <div style={{ marginTop: 16, color: pal.text, fontFamily: SANS, fontSize: boundedFont(title, 56, 38, 26, 0.8), lineHeight: 1.04, fontWeight: 850, letterSpacing: "-0.045em", overflowWrap: "anywhere", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden" }}>{title}</div>
      <div style={{ marginTop: 15, color: pal.secondary, fontFamily: SANS, fontSize: boundedFont(question, 23, 17, 48, 0.18), lineHeight: 1.25, overflowWrap: "anywhere", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden" }}>{question}</div>
    </div>
    <div style={{ minWidth: 170, width: 190, textAlign: "right" }}>
      <div style={{ color: pal.secondary, fontFamily: MONO, fontSize: 14, letterSpacing: "0.13em" }}>SAMPLE SIZE</div>
      <div style={{ marginTop: 10, color: pal.text, fontFamily: SANS, fontSize: 38, fontWeight: 800 }}>{safeNumber(p.sampleSize, 842).toLocaleString()}</div>
      <div style={{ color: pal.secondary, fontFamily: MONO, fontSize: 14 }}>RESPONDENTS</div>
    </div>
  </div>;
};

const HorizontalBars: React.FC<{ items: SurveyResponse[]; pal: Palette; accent: string; frame: number; start?: number; max?: number }> = ({ items, pal, accent, frame, start = 15, max }) => {
  const palette = colors(pal, accent);
  const rangeMax = max ?? maxOf(items.map((item) => item.value));
  return (
    <div style={{ display: "grid", gap: 19 }}>
      {items.map((item, i) => {
        const t = clampInterp(frame, [start + i * 7, start + i * 7 + 18], [0, 1]);
        const value = safeNumber(item.value, 0);
        return <div key={`${item.label}-${i}`} style={{ opacity: t, transform: `translateX(${(1 - t) * 24}px)` }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 20, color: pal.text, fontFamily: SANS, fontSize: 21, fontWeight: 700 }}><span>{cleanText(item.label, `Option ${i + 1}`)}</span><span style={{ color: item.color || palette[i % palette.length], fontFamily: MONO }}>{Math.round(value)}%</span></div>
          <div style={{ height: 14, marginTop: 9, borderRadius: 10, background: `${pal.secondary}20`, overflow: "hidden" }}><div style={{ width: `${Math.max(0, Math.min(100, value / rangeMax * 100 * t))}%`, height: "100%", borderRadius: 10, background: item.color || palette[i % palette.length] }} /></div>
        </div>;
      })}
    </div>
  );
};

const QuestionToChart: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const accent = p.accentColor || pal.accent;
  const responses = limit(p.responses, FALLBACK_RESPONSES, 5);
  const q = cleanText(p.question, "Which part of the experience creates the most value?");
  return <AbsoluteFill style={{ padding: "70px 108px 58px", justifyContent: "center" }}><Header p={{ ...p, question: q }} pal={pal} accent={accent} label="QUESTION → DISTRIBUTION" /><div style={{ display: "grid", gridTemplateColumns: "0.82fr 1.18fr", gap: 28, marginTop: 36, minHeight: 0 }}><Panel pal={pal} accent={accent} style={{ padding: 42, minHeight: 390, maxHeight: 430, display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden" }}><Eyebrow pal={pal} accent={accent}>THE QUESTION</Eyebrow><div style={{ color: pal.text, fontFamily: SERIF, fontSize: boundedFont(q, 47, 32, 52, 0.28), lineHeight: 1.12, fontWeight: 700, overflowWrap: "anywhere", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 4, overflow: "hidden" }}>{q}</div><div style={{ borderLeft: `4px solid ${accent}`, paddingLeft: 18, color: pal.secondary, fontFamily: MONO, fontSize: 15, lineHeight: 1.25, letterSpacing: "0.06em", overflowWrap: "anywhere", maxHeight: 42, overflow: "hidden" }}>{cleanText(p.methodology, "Single choice · fielded this quarter")}</div></Panel><Panel pal={pal} accent={accent} style={{ padding: 42, minHeight: 390, maxHeight: 430, overflow: "hidden" }}><Eyebrow pal={pal} accent={accent}>WHAT RESPONDENTS SAID</Eyebrow><div style={{ marginTop: 24 }}><HorizontalBars items={responses} pal={pal} accent={accent} frame={frame} /></div></Panel></div></AbsoluteFill>;
};

const ResponseDistribution: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const accent = p.accentColor || pal.accent;
  const items = limit(p.responses, FALLBACK_RESPONSES, 6);
  const palette = colors(pal, accent);
  const total = Math.max(1, items.reduce((sum, item) => sum + Math.max(0, safeNumber(item.value, 0)), 0));
  const first = items[0];
  const sweep = clampInterp(frame, [16, 52], [0, 360]);
  let offset = 0;
  const stops = items.map((item, i) => { const next = offset + safeNumber(item.value, 0) / total * sweep; const stop = `${item.color || palette[i % palette.length]} ${offset}deg ${next}deg`; offset = next; return stop; });
  return <AbsoluteFill style={{ padding: "82px 108px", justifyContent: "center" }}><Header p={p} pal={pal} accent={accent} label="RESPONSE DISTRIBUTION" /><div style={{ display: "grid", gridTemplateColumns: "0.78fr 1.22fr", alignItems: "center", gap: 66, marginTop: 50 }}><div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 430, height: 430, borderRadius: "50%", background: `conic-gradient(${stops.join(", ")})`, transform: `rotate(-90deg)`, boxShadow: `0 0 0 24px ${pal.bg}, 0 0 0 26px ${pal.secondary}36` }}><div style={{ width: 218, height: 218, margin: 106, borderRadius: "50%", background: pal.bg, transform: "rotate(90deg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}><div style={{ color: accent, fontFamily: MONO, fontSize: 17, letterSpacing: "0.12em" }}>TOP ANSWER</div><div style={{ marginTop: 8, color: pal.text, fontFamily: SANS, fontSize: 43, fontWeight: 850 }}>{Math.round(safeNumber(first?.value, 0))}%</div></div></div></div><Panel pal={pal} accent={accent} style={{ padding: 46 }}><Eyebrow pal={pal} accent={accent}>READ THE MIX</Eyebrow><div style={{ marginTop: 28, display: "grid", gap: 18 }}>{items.map((item, i) => <div key={`${item.label}-${i}`} style={{ display: "flex", alignItems: "center", gap: 18, opacity: clampInterp(frame, [12 + i * 7, 31 + i * 7], [0, 1]) }}><div style={{ width: 16, height: 16, borderRadius: "50%", background: item.color || palette[i % palette.length] }} /><div style={{ flex: 1, color: pal.text, fontFamily: SANS, fontSize: 23 }}>{item.label}</div><div style={{ color: pal.secondary, fontFamily: MONO, fontSize: 19 }}>{Math.round(safeNumber(item.value, 0))}%</div></div>)}</div></Panel></div></AbsoluteFill>;
};

const SegmentCompare: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const accent = p.accentColor || pal.accent;
  const segments = limit(p.segments, FALLBACK_SEGMENTS, 3);
  const labels = limit(p.labels, ["Very likely", "Likely", "Unsure", "Unlikely"], 6);
  const palette = colors(pal, accent);
  return <AbsoluteFill style={{ padding: "68px 100px 54px", justifyContent: "center" }}><Header p={p} pal={pal} accent={accent} label="SEGMENT COMPARISON" /><div style={{ display: "grid", gridTemplateColumns: `repeat(${segments.length}, 1fr)`, gap: 22, marginTop: 30 }}>{segments.map((segment, si) => <Panel key={`${segment.label}-${si}`} pal={pal} accent={accent} style={{ padding: 28, minHeight: 390, maxHeight: 430, overflow: "hidden" }}><div style={{ color: accent, fontFamily: MONO, fontSize: 15, letterSpacing: "0.11em" }}>SEGMENT {String(si + 1).padStart(2, "0")}</div><div style={{ marginTop: 11, color: pal.text, fontFamily: SANS, fontSize: boundedFont(cleanText(segment.label, `Segment ${si + 1}`), 31, 24, 14, 0.5), fontWeight: 800, overflowWrap: "anywhere" }}>{cleanText(segment.label, `Segment ${si + 1}`)}</div><div style={{ marginTop: 23, display: "grid", gap: 15 }}>{segment.values.slice(0, labels.length).map((value, i) => { const t = clampInterp(frame, [15 + i * 7 + si * 5, 34 + i * 7 + si * 5], [0, 1]); return <div key={`${labels[i]}-${i}`} style={{ opacity: t }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8, color: pal.secondary, fontFamily: SANS, fontSize: 15 }}><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{labels[i]}</span><span style={{ color: palette[i % palette.length], fontFamily: MONO }}>{Math.round(safeNumber(value, 0))}%</span></div><div style={{ height: 9, marginTop: 6, borderRadius: 8, background: `${pal.secondary}1c` }}><div style={{ width: `${Math.max(0, Math.min(100, safeNumber(value, 0)) * t)}%`, height: "100%", borderRadius: 8, background: palette[i % palette.length] }} /></div></div>; })}</div></Panel>)}</div></AbsoluteFill>;
};

const NpsReveal: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const accent = p.accentColor || pal.accent;
  const score = Math.round(safeNumber(p.npsScore, 62));
  const shown = Math.round(interpolate(frame, [22, 73], [0, score], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const responses = limit(p.responses, [{ label: "Promoters", value: 62, color: "#34d399" }, { label: "Passives", value: 23, color: "#fbbf24" }, { label: "Detractors", value: 15, color: "#fb7185" }], 3);
  return <AbsoluteFill style={{ padding: "70px 110px 56px", justifyContent: "center" }}><Header p={p} pal={pal} accent={accent} label="NPS / LOYALTY SIGNAL" /><div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: 34, marginTop: 34 }}><Panel pal={pal} accent={accent} style={{ minHeight: 380, maxHeight: 420, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden", background: `linear-gradient(145deg, ${accent}22, ${pal.bg}ee)` }}><div style={{ color: pal.secondary, fontFamily: MONO, fontSize: 16, letterSpacing: "0.15em", textAlign: "center" }}>NET PROMOTER SCORE</div><div style={{ marginTop: 16, color: pal.text, fontFamily: SANS, fontSize: 128, lineHeight: 0.9, fontWeight: 900, letterSpacing: "-0.08em" }}>{shown > 0 ? "+" : ""}{shown}</div><div style={{ marginTop: 22, color: accent, fontFamily: MONO, fontSize: 15 }}>OUT OF 100</div></Panel><Panel pal={pal} accent={accent} style={{ padding: 40, minHeight: 380, maxHeight: 420, overflow: "hidden" }}><Eyebrow pal={pal} accent={accent}>HOW THE SCORE FORMED</Eyebrow><div style={{ marginTop: 27 }}><HorizontalBars items={responses} pal={pal} accent={accent} frame={frame} max={100} /></div><div style={{ marginTop: 24, paddingTop: 18, borderTop: `1px solid ${pal.secondary}32`, color: pal.secondary, fontFamily: MONO, fontSize: 14, letterSpacing: "0.06em" }}>PROMOTERS − DETRACTORS = NPS</div></Panel></div></AbsoluteFill>;
};

const SentimentSplit: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const accent = p.accentColor || pal.accent;
  const items = limit(p.responses, [{ label: "Positive", value: 58, color: "#34d399" }, { label: "Neutral", value: 27, color: "#fbbf24" }, { label: "Negative", value: 15, color: "#fb7185" }], 3);
  return <AbsoluteFill style={{ padding: "84px 110px", justifyContent: "center" }}><Header p={p} pal={pal} accent={accent} label="SENTIMENT SPLIT" /><div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22, marginTop: 58 }}>{items.map((item, i) => { const color = item.color || colors(pal, accent)[i]; const t = clampInterp(frame, [13 + i * 12, 38 + i * 12], [0, 1]); return <Panel key={`${item.label}-${i}`} pal={pal} accent={accent} style={{ minHeight: 390, padding: 38, opacity: t, transform: `translateY(${(1 - t) * 36}px)`, borderTop: `5px solid ${color}` }}><div style={{ color, fontFamily: MONO, fontSize: 17, letterSpacing: "0.16em" }}>{String(item.label).toUpperCase()}</div><div style={{ marginTop: 50, color: pal.text, fontFamily: SANS, fontSize: 90, fontWeight: 900, letterSpacing: "-0.07em" }}>{Math.round(safeNumber(item.value, 0))}%</div><div style={{ marginTop: 23, height: 12, borderRadius: 10, background: `${pal.secondary}20` }}><div style={{ width: `${Math.max(0, Math.min(100, safeNumber(item.value, 0))) * t}%`, height: "100%", borderRadius: 10, background: color }} /></div><div style={{ marginTop: 25, color: pal.secondary, fontFamily: SANS, fontSize: 19, lineHeight: 1.25 }}>{i === 0 ? "The audience is moving toward the idea." : i === 1 ? "A meaningful share is still deciding." : "The friction worth investigating next."}</div></Panel>; })}</div></AbsoluteFill>;
};

const OpenTextWall: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const accent = p.accentColor || pal.accent;
  const comments = limit(p.comments, FALLBACK_COMMENTS, 4);
  return <AbsoluteFill style={{ padding: "78px 104px", justifyContent: "center" }}><Header p={p} pal={pal} accent={accent} label="OPEN TEXT / VOICES" /><div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18, marginTop: 49 }}>{comments.map((comment, i) => { const t = clampInterp(frame, [10 + i * 10, 29 + i * 10], [0, 1]); return <Panel key={`${comment}-${i}`} pal={pal} accent={accent} style={{ minHeight: 205, padding: 31, opacity: t, transform: `scale(${0.96 + t * 0.04})` }}><div style={{ color: accent, fontFamily: SERIF, fontSize: 45, lineHeight: 0.7 }}>“</div><div style={{ marginTop: 10, color: pal.text, fontFamily: SERIF, fontSize: 26, lineHeight: 1.22 }}>{comment}</div><div style={{ marginTop: 20, color: pal.secondary, fontFamily: MONO, fontSize: 14, letterSpacing: "0.1em" }}>ANONYMOUS RESPONSE {String(i + 1).padStart(2, "0")}</div></Panel>; })}</div></AbsoluteFill>;
};

const ResponseRate: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const accent = p.accentColor || pal.accent;
  const rate = Math.max(0, Math.min(100, safeNumber(p.responseRate, 68)));
  const shown = Math.round(interpolate(frame, [18, 62], [0, rate], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const circumference = 2 * Math.PI * 148;
  const dash = circumference * shown / 100;
  return <AbsoluteFill style={{ padding: "70px 110px 56px", justifyContent: "center" }}><Header p={p} pal={pal} accent={accent} label="FIELDWORK / RESPONSE RATE" /><div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 45, alignItems: "center", marginTop: 34 }}><Panel pal={pal} accent={accent} style={{ minHeight: 370, maxHeight: 410, display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden" }}><div style={{ position: "relative", width: 320, height: 320 }}><svg width="320" height="320" viewBox="0 0 360 360" style={{ transform: "rotate(-90deg)" }}><circle cx="180" cy="180" r="148" fill="none" stroke={`${pal.secondary}25`} strokeWidth="24" /><circle cx="180" cy="180" r="148" fill="none" stroke={accent} strokeWidth="24" strokeLinecap="round" strokeDasharray={`${dash} ${circumference}`} /></svg><div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}><div style={{ color: pal.text, fontFamily: SANS, fontSize: 74, fontWeight: 900 }}>{shown}%</div><div style={{ color: pal.secondary, fontFamily: MONO, fontSize: 15, letterSpacing: "0.08em" }}>COMPLETED</div></div></div></Panel><Panel pal={pal} accent={accent} style={{ padding: 40, minHeight: 370, maxHeight: 410, overflow: "hidden" }}><Eyebrow pal={pal} accent={accent}>FIELDWORK NOTES</Eyebrow><div style={{ marginTop: 27, display: "grid", gap: 19 }}><div><div style={{ color: pal.secondary, fontFamily: MONO, fontSize: 14, letterSpacing: "0.1em" }}>INVITED</div><div style={{ marginTop: 7, color: pal.text, fontFamily: SANS, fontSize: 32, fontWeight: 800 }}>{Math.round(safeNumber(p.sampleSize, 842) / Math.max(0.01, rate / 100)).toLocaleString()}</div></div><div><div style={{ color: pal.secondary, fontFamily: MONO, fontSize: 14, letterSpacing: "0.1em" }}>METHODOLOGY</div><div style={{ marginTop: 7, color: pal.text, fontFamily: SANS, fontSize: boundedFont(cleanText(p.methodology, "Anonymous online survey · 5 minute completion"), 23, 18, 45, 0.16), lineHeight: 1.25, overflowWrap: "anywhere", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 3, overflow: "hidden" }}>{cleanText(p.methodology, "Anonymous online survey · 5 minute completion")}</div></div></div></Panel></div></AbsoluteFill>;
};

const TrendByWave: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const accent = p.accentColor || pal.accent;
  const waves = limit(p.waves, FALLBACK_WAVES, 7);
  const values = waves.map((wave) => safeNumber(wave.value, 0));
  const lo = Math.min(...values, 0);
  const hi = Math.max(...values, 100);
  const points = values.map((value, i) => `${50 + (i / Math.max(1, values.length - 1)) * 760},${380 - ((value - lo) / Math.max(1, hi - lo)) * 260}`).join(" ");
  const reveal = clampInterp(frame, [16, 74], [0, 1]);
  const shownPoints = values.map((value, i) => { const x = 50 + (i / Math.max(1, values.length - 1)) * 760; const y = 380 - ((value - lo) / Math.max(1, hi - lo)) * 260; return `${x},${380 + (y - 380) * reveal}`; }).join(" ");
  return <AbsoluteFill style={{ padding: "80px 104px", justifyContent: "center" }}><Header p={p} pal={pal} accent={accent} label="TREND BY WAVE" /><Panel pal={pal} accent={accent} style={{ marginTop: 49, padding: "35px 45px 28px" }}><svg width="100%" height="390" viewBox="0 0 860 430" preserveAspectRatio="none"><line x1="50" y1="380" x2="810" y2="380" stroke={`${pal.secondary}45`} strokeWidth="2" />{[0, 1, 2, 3].map((i) => <line key={i} x1="50" y1={120 + i * 87} x2="810" y2={120 + i * 87} stroke={`${pal.secondary}20`} strokeWidth="2" strokeDasharray="5 10" />)}<polyline points={points} fill="none" stroke={`${accent}20`} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" /><polyline points={shownPoints} fill="none" stroke={accent} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />{values.map((value, i) => { const x = 50 + (i / Math.max(1, values.length - 1)) * 760; const y = 380 - ((value - lo) / Math.max(1, hi - lo)) * 260; return <g key={`${waves[i].label}-${i}`} opacity={clampInterp(frame, [18 + i * 7, 35 + i * 7], [0, 1])}><circle cx={x} cy={y} r="9" fill={pal.bg} stroke={accent} strokeWidth="5" /><text x={x} y="415" textAnchor="middle" fill={pal.secondary} fontFamily={MONO} fontSize="14">{waves[i].label}</text></g>; })}</svg><div style={{ display: "flex", justifyContent: "space-between", color: pal.secondary, fontFamily: MONO, fontSize: 16, letterSpacing: "0.08em" }}><span>BASELINE {Math.round(values[0])}%</span><span style={{ color: accent }}>CURRENT {Math.round(values[values.length - 1])}%</span></div></Panel></AbsoluteFill>;
};

const TopInsight: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const accent = p.accentColor || pal.accent;
  const responses = limit(p.responses, FALLBACK_RESPONSES, 3);
  const insight = cleanText(p.insight, "Clarity is the strongest predictor of whether people return.");
  const reveal = clampInterp(frame, [18, 52], [0, 1]);
  return <AbsoluteFill style={{ padding: "70px 110px 56px", justifyContent: "center" }}><Header p={p} pal={pal} accent={accent} label="TOP INSIGHT" /><div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 28, alignItems: "stretch", marginTop: 34 }}><Panel pal={pal} accent={accent} style={{ minHeight: 340, maxHeight: 400, padding: 44, opacity: reveal, transform: `translateY(${(1 - reveal) * 24}px)`, overflow: "hidden", background: `linear-gradient(135deg, ${accent}25, ${pal.bg}f2 65%)` }}><Eyebrow pal={pal} accent={accent}>THE SIGNAL</Eyebrow><div style={{ marginTop: 24, color: pal.text, fontFamily: SERIF, fontSize: boundedFont(insight, 50, 34, 56, 0.32), lineHeight: 1.08, fontWeight: 700, overflowWrap: "anywhere", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 4, overflow: "hidden" }}>“{insight}”</div><div style={{ marginTop: 24, color: pal.secondary, fontFamily: MONO, fontSize: 14, letterSpacing: "0.08em", overflowWrap: "anywhere" }}>READ THIS AS A DIRECTION, NOT A VERDICT</div></Panel><Panel pal={pal} accent={accent} style={{ padding: 32, maxHeight: 400, overflow: "hidden" }}><Eyebrow pal={pal} accent={accent}>SUPPORTING SIGNALS</Eyebrow><div style={{ marginTop: 24, display: "grid", gap: 15 }}>{responses.map((item, i) => <div key={`${item.label}-${i}`} style={{ paddingBottom: 14, borderBottom: `1px solid ${pal.secondary}26`, opacity: clampInterp(frame, [23 + i * 9, 41 + i * 9], [0, 1]) }}><div style={{ color: pal.secondary, fontFamily: MONO, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(item.label).toUpperCase()}</div><div style={{ marginTop: 6, color: pal.text, fontFamily: SANS, fontSize: 34, fontWeight: 850 }}>{Math.round(safeNumber(item.value, 0))}%</div></div>)}</div></Panel></div></AbsoluteFill>;
};

const SurveyRecap: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const accent = p.accentColor || pal.accent;
  const responses = limit(p.responses, FALLBACK_RESPONSES, 3);
  const insight = cleanText(p.insight, "The audience wants a clearer path from first touch to repeat use.");
  const cards = [
    { label: "SAMPLE", value: `${safeNumber(p.sampleSize, 842).toLocaleString()} people` },
    { label: "TOP SIGNAL", value: `${Math.round(safeNumber(responses[0]?.value, 46))}% ${cleanText(responses[0]?.label, "selected the lead answer")}` },
    { label: "NEXT MOVE", value: insight },
  ];
  return <AbsoluteFill style={{ padding: "66px 100px 48px", justifyContent: "center" }}><Header p={p} pal={pal} accent={accent} label="SURVEY RECAP" /><div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginTop: 34 }}>{cards.map((card, i) => { const t = clampInterp(frame, [12 + i * 12, 35 + i * 12], [0, 1]); return <Panel key={card.label} pal={pal} accent={accent} style={{ minHeight: 248, maxHeight: 290, padding: 28, opacity: t, transform: `translateY(${(1 - t) * 20}px)`, overflow: "hidden" }}><div style={{ color: accent, fontFamily: MONO, fontSize: 14, letterSpacing: "0.12em" }}>{card.label}</div><div style={{ marginTop: 27, color: pal.text, fontFamily: i === 2 ? SERIF : SANS, fontSize: i === 2 ? 27 : 36, lineHeight: 1.14, fontWeight: 800, overflowWrap: "anywhere", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: i === 2 ? 4 : 3, overflow: "hidden" }}>{card.value}</div></Panel>; })}</div><div style={{ marginTop: 18, color: pal.secondary, fontFamily: MONO, fontSize: 14, letterSpacing: "0.06em", overflowWrap: "anywhere", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 1, overflow: "hidden" }}>{cleanText(p.methodology, "Interpret percentages with the sample and question wording in view.")}</div></AbsoluteFill>;
};

const VARIANTS: Record<SurveyVariant, React.FC<VariantProps>> = {
  "question-to-chart": QuestionToChart,
  "response-distribution": ResponseDistribution,
  "segment-compare": SegmentCompare,
  "nps-reveal": NpsReveal,
  "sentiment-split": SentimentSplit,
  "open-text-wall": OpenTextWall,
  "response-rate": ResponseRate,
  "trend-by-wave": TrendByWave,
  "top-insight": TopInsight,
  "survey-recap": SurveyRecap,
};

export const SurveyResultsTemplate: React.FC<SurveyResultsProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const accent = props.accentColor || pal.accent;
  const Variant = VARIANTS[props.variant] ?? QuestionToChart;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <AbsoluteFill style={{ backgroundColor: pal.bg, overflow: "hidden" }}><Backdrop pal={pal} accent={accent} /><FadeEdges inFrames={9} outFrames={12}><div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><Variant p={props} pal={pal} /></div></FadeEdges></AbsoluteFill>;
};

const familyCast = (component: React.FC<SurveyResultsProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "survey-results-question-to-chart": familyCast(SurveyResultsTemplate),
  "survey-results-response-distribution": familyCast(SurveyResultsTemplate),
  "survey-results-segment-compare": familyCast(SurveyResultsTemplate),
  "survey-results-nps-reveal": familyCast(SurveyResultsTemplate),
  "survey-results-sentiment-split": familyCast(SurveyResultsTemplate),
  "survey-results-open-text-wall": familyCast(SurveyResultsTemplate),
  "survey-results-response-rate": familyCast(SurveyResultsTemplate),
  "survey-results-trend-by-wave": familyCast(SurveyResultsTemplate),
  "survey-results-top-insight": familyCast(SurveyResultsTemplate),
  "survey-results-survey-recap": familyCast(SurveyResultsTemplate),
};
