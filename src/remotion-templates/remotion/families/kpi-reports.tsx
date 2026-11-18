import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, resolvePalette, type Palette } from "../lib/primitives";

/** Ten deterministic KPI-report compositions for recurring business reporting. */
export type KpiReportVariant =
  | "monthly-report"
  | "quarterly-review"
  | "target-vs-actual"
  | "variance-bridge"
  | "growth-summary"
  | "retention-report"
  | "conversion-report"
  | "budget-report"
  | "health-score"
  | "report-to-action";

export interface KpiMetric {
  label: string;
  value: number;
  target?: number;
  previous?: number;
  delta?: number;
  unit?: string;
  color?: string;
}

export interface KpiReportsProps {
  variant: KpiReportVariant;
  title: string;
  subtitle?: string;
  period?: string;
  paletteName: string;
  metrics?: KpiMetric[];
  periods?: string[];
  targets?: number[];
  actuals?: number[];
  notes?: string[];
  unit?: string;
  prefix?: string;
  suffix?: string;
  statusColors?: string[];
}

const FONT = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const FALLBACK: KpiMetric[] = [
  { label: "Revenue", value: 84200, target: 80000, previous: 76800, delta: 9.6 },
  { label: "Pipeline", value: 126, target: 140, previous: 108, delta: 16.7 },
  { label: "Activation", value: 72, target: 70, previous: 65, delta: 10.8, unit: "%" },
  { label: "Retention", value: 88, target: 85, previous: 83, delta: 6.0, unit: "%" },
  { label: "NPS", value: 54, target: 50, previous: 47, delta: 14.9 },
];

const metricsOf = (p: KpiReportsProps): KpiMetric[] => (p.metrics?.length ? p.metrics : FALLBACK);
const periodsOf = (p: KpiReportsProps): string[] => p.periods?.length ? p.periods : ["JAN", "FEB", "MAR", "APR", "MAY", "JUN"];
const progress = (frame: number, start = 8, end = 55): number => interpolate(frame, [start, end], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const fmt = (value: number, p: KpiReportsProps, compact = false): string => {
  const n = Math.abs(value);
  let shown = Math.round(value).toLocaleString("en-US");
  if (compact && n >= 1_000_000) shown = `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  else if (compact && n >= 1_000) shown = `${(value / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, "")}K`;
  return `${p.prefix ?? ""}${shown}${p.suffix ?? ""}`;
};
const unit = (m: KpiMetric, p: KpiReportsProps): string => m.unit ?? p.unit ?? "";
const colors = (pal: Palette, p: KpiReportsProps): string[] => p.statusColors?.length ? p.statusColors : [pal.primary, pal.secondary, pal.accent, "#a78bfa", "#22d3ee"];

const Backdrop: React.FC<{ pal: Palette; mode?: "grid" | "plain" | "glow" }> = ({ pal, mode = "grid" }) => (
  <AbsoluteFill style={{ backgroundColor: pal.bg, backgroundImage: mode === "grid" ? `linear-gradient(${pal.text}08 1px, transparent 1px), linear-gradient(90deg, ${pal.text}08 1px, transparent 1px)` : mode === "glow" ? `radial-gradient(circle at 78% 18%, ${pal.primary}35, transparent 36%), radial-gradient(circle at 12% 84%, ${pal.accent}20, transparent 34%)` : undefined, backgroundSize: mode === "grid" ? "64px 64px" : undefined }} />
);

const Header: React.FC<{ p: KpiReportsProps; pal: Palette; eyebrow?: string }> = ({ p, pal, eyebrow = "PERFORMANCE REPORT" }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 30 }}>
    <div>
      <div style={{ color: pal.accent, fontFamily: FONT, fontSize: 18, fontWeight: 800, letterSpacing: "0.22em" }}>{eyebrow}</div>
      <div style={{ color: pal.text, fontFamily: FONT, fontSize: 52, fontWeight: 800, letterSpacing: "-0.045em", marginTop: 14 }}>{p.title}</div>
      {p.subtitle ? <div style={{ color: `${pal.text}8a`, fontFamily: FONT, fontSize: 21, marginTop: 10 }}>{p.subtitle}</div> : null}
    </div>
    <div style={{ color: pal.secondary, fontFamily: MONO, fontSize: 18, letterSpacing: "0.12em", paddingTop: 5, whiteSpace: "nowrap" }}>{p.period ?? "Q2 · 2026"}</div>
  </div>
);

const MetricCard: React.FC<{ metric: KpiMetric; pal: Palette; p: KpiReportsProps; index: number; compact?: boolean }> = ({ metric, pal, p, index, compact = false }) => {
  const frame = useCurrentFrame();
  const show = progress(frame, 12 + index * 5, 48 + index * 5);
  const palette = colors(pal, p);
  const delta = metric.delta ?? (metric.previous ? ((metric.value - metric.previous) / Math.max(1, Math.abs(metric.previous))) * 100 : 0);
  const positive = delta >= 0;
  return (
    <div style={{ background: `${pal.text}09`, border: `1px solid ${pal.text}1c`, borderRadius: compact ? 16 : 22, padding: compact ? "22px 24px" : "28px 30px", opacity: show, transform: `translateY(${(1 - show) * 24}px)`, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div style={{ color: `${pal.text}8c`, fontFamily: FONT, fontSize: compact ? 15 : 17, fontWeight: 750, letterSpacing: "0.13em", textTransform: "uppercase" }}>{metric.label}</div>
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: palette[index % palette.length], boxShadow: `0 0 14px ${palette[index % palette.length]}` }} />
      </div>
      <div style={{ color: pal.text, fontFamily: MONO, fontSize: compact ? 36 : 48, fontWeight: 800, marginTop: compact ? 14 : 22, fontVariantNumeric: "tabular-nums" }}>{fmt(metric.value * show, p, true)}{unit(metric, p)}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 15, gap: 12 }}>
        <div style={{ color: positive ? pal.accent : "#fb7185", fontFamily: FONT, fontSize: 16, fontWeight: 750 }}>{positive ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%</div>
        {metric.target !== undefined ? <div style={{ color: `${pal.text}66`, fontFamily: FONT, fontSize: 14 }}>goal {fmt(metric.target, p, true)}{unit(metric, p)}</div> : null}
      </div>
    </div>
  );
};

const MonthlyReport: React.FC<{ p: KpiReportsProps; pal: Palette }> = ({ p, pal }) => {
  const ms = metricsOf(p);
  return <AbsoluteFill style={{ padding: "82px 100px", fontFamily: FONT }}><Header p={p} pal={pal} eyebrow="MONTHLY REPORT · EXECUTIVE SNAPSHOT" /><div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginTop: 58 }}>{ms.slice(0, 3).map((m, i) => <MetricCard key={m.label} metric={m} p={p} pal={pal} index={i} />)}</div><div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 22, marginTop: 22, flex: 1 }}><div style={{ border: `1px solid ${pal.text}1c`, borderRadius: 22, padding: 30 }}><div style={{ color: pal.text, fontSize: 21, fontWeight: 750 }}>Monthly run-rate</div><Sparkline values={ms.map((m, i) => m.value * (0.82 + i * 0.04))} pal={pal} height={230} /></div><div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{ms.slice(3).map((m, i) => <MetricCard key={m.label} metric={m} p={p} pal={pal} index={i + 3} compact />)}</div></div></AbsoluteFill>;
};

const QuarterlyReview: React.FC<{ p: KpiReportsProps; pal: Palette }> = ({ p, pal }) => {
  const ms = metricsOf(p); const qs = ["Q1", "Q2", "Q3", "Q4"];
  return <AbsoluteFill style={{ padding: "84px 100px", fontFamily: FONT }}><Header p={p} pal={pal} eyebrow="QUARTERLY REVIEW · MOMENTUM" /><div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 68, flex: 1 }}>{qs.map((q, i) => { const val = (ms[i % ms.length].value) * (0.72 + i * 0.1); const show = progress(useCurrentFrame(), 10 + i * 8, 60 + i * 8); return <div key={q} style={{ borderTop: `4px solid ${i === 3 ? pal.accent : pal.primary}`, background: `${pal.text}08`, padding: "26px 24px", opacity: show, transform: `translateY(${(1 - show) * 35}px)`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}><div style={{ color: `${pal.text}77`, fontWeight: 800, letterSpacing: "0.18em" }}>{q}</div><div><div style={{ color: pal.text, fontFamily: MONO, fontSize: 46, fontWeight: 800 }}>{fmt(val * show, p, true)}</div><div style={{ color: pal.secondary, fontSize: 17, marginTop: 12 }}>{i === 3 ? "CURRENT" : `${i + 1} periods ago`}</div></div><div style={{ height: 6, background: `${pal.text}18`, borderRadius: 6 }}><div style={{ width: `${Math.min(100, 34 + i * 18)}%`, height: "100%", background: i === 3 ? pal.accent : pal.primary, transform: `scaleX(${show})`, transformOrigin: "left" }} /></div></div>; })}</div></AbsoluteFill>;
};

const TargetActual: React.FC<{ p: KpiReportsProps; pal: Palette }> = ({ p, pal }) => { const m = metricsOf(p)[0]; const target = m.target ?? p.targets?.[0] ?? m.value * 1.1; const frame = useCurrentFrame(); const show = progress(frame); const ratio = Math.min(1.25, m.value / Math.max(1, target)); return <AbsoluteFill style={{ padding: "100px 130px", fontFamily: FONT }}><Header p={p} pal={pal} eyebrow="TARGET VS ACTUAL · DELIVERY" /><div style={{ display: "flex", alignItems: "center", gap: 90, flex: 1 }}><div style={{ flex: 1 }}><div style={{ color: `${pal.text}8a`, fontSize: 22, letterSpacing: "0.16em", fontWeight: 750 }}>{m.label.toUpperCase()}</div><div style={{ color: pal.text, fontFamily: MONO, fontSize: 132, fontWeight: 850, marginTop: 20 }}>{fmt(m.value * show, p, true)}{unit(m, p)}</div><div style={{ color: pal.secondary, fontSize: 22, marginTop: 20 }}>Target {fmt(target, p, true)}{unit(m, p)}</div></div><div style={{ width: 420, height: 420, borderRadius: "50%", border: `26px solid ${pal.text}15`, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", background: `conic-gradient(${ratio >= 1 ? pal.accent : pal.primary} ${Math.min(100, ratio * 100 * show)}%, transparent 0)` }}><div style={{ width: 330, height: 330, borderRadius: "50%", background: pal.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}><div style={{ color: ratio >= 1 ? pal.accent : pal.primary, fontFamily: MONO, fontSize: 58, fontWeight: 800 }}>{Math.round(ratio * 100 * show)}%</div><div style={{ color: `${pal.text}73`, fontSize: 16, letterSpacing: "0.14em" }}>ATTAINMENT</div></div></div></div></AbsoluteFill>; };

const VarianceBridge: React.FC<{ p: KpiReportsProps; pal: Palette }> = ({ p, pal }) => { const ms = metricsOf(p); const frame = useCurrentFrame(); const show = progress(frame); const vals = [ms[0].previous ?? ms[0].value * 0.8, ...ms.slice(0, 4).map((m, i) => (m.delta ?? (i % 2 ? -5 : 8)) * 80), ms[0].value]; let running = vals[0]; return <AbsoluteFill style={{ padding: "90px 100px", fontFamily: FONT }}><Header p={p} pal={pal} eyebrow="VARIANCE BRIDGE · WHAT MOVED" /><div style={{ display: "flex", alignItems: "flex-end", gap: 24, height: 440, marginTop: 50, borderBottom: `2px solid ${pal.text}28`, padding: "0 22px" }}>{vals.map((v, i) => { const isTotal = i === 0 || i === vals.length - 1; const value = isTotal ? v : Math.abs(v); const h = Math.min(330, Math.max(32, value / Math.max(1, ms[0].value) * 330)); if (!isTotal) running += v; const up = i === 0 || i === vals.length - 1 || v >= 0; const x = progress(frame, 8 + i * 5, 42 + i * 5) * show; return <div key={i} style={{ flex: 1, height: h * x, background: isTotal ? pal.primary : up ? pal.accent : "#fb7185", opacity: x, borderRadius: "8px 8px 0 0", position: "relative" }}><div style={{ position: "absolute", bottom: "calc(100% + 12px)", width: "100%", textAlign: "center", color: pal.text, fontFamily: MONO, fontSize: 16 }}>{isTotal ? fmt(v, p, true) : `${v >= 0 ? "+" : ""}${Math.round(v)}`}</div><div style={{ position: "absolute", top: "calc(100% + 16px)", width: "100%", textAlign: "center", color: `${pal.text}7a`, fontSize: 15 }}>{isTotal ? "TOTAL" : ms[(i - 1) % ms.length].label}</div></div>; })}</div></AbsoluteFill>; };

const Sparkline: React.FC<{ values: number[]; pal: Palette; height?: number }> = ({ values, pal, height = 180 }) => { const frame = useCurrentFrame(); const { width } = useVideoConfig(); const max = Math.max(...values, 1); const w = Math.max(480, width - 420); const points = values.map((v, i) => `${(i / Math.max(1, values.length - 1)) * w},${height - (v / max) * (height - 24)}`).join(" "); const show = progress(frame, 10, 62); return <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} style={{ marginTop: 22, overflow: "visible" }}><polyline points={points} fill="none" stroke={pal.primary} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={w * 3} strokeDashoffset={w * 3 * (1 - show)} />{values.map((v, i) => <circle key={i} cx={(i / Math.max(1, values.length - 1)) * w} cy={height - (v / max) * (height - 24)} r={7} fill={pal.accent} opacity={show} />)}</svg>; };

const GrowthSummary: React.FC<{ p: KpiReportsProps; pal: Palette }> = ({ p, pal }) => { const ms = metricsOf(p); return <AbsoluteFill style={{ padding: "90px 110px", fontFamily: FONT }}><Header p={p} pal={pal} eyebrow="GROWTH SUMMARY · TRAJECTORY" /><div style={{ flex: 1, marginTop: 38, border: `1px solid ${pal.text}20`, borderRadius: 24, padding: "24px 34px" }}><div style={{ color: pal.text, fontSize: 24, fontWeight: 750 }}>Progress over reporting periods</div><Sparkline values={ms.concat(ms.slice(0, 2)).map((m, i) => m.value * (0.68 + i * 0.06))} pal={pal} height={430} /></div></AbsoluteFill>; };

const RetentionReport: React.FC<{ p: KpiReportsProps; pal: Palette }> = ({ p, pal }) => { const frame = useCurrentFrame(); const show = progress(frame); const rows = ["Week 0", "Week 1", "Week 2", "Week 4", "Week 8"]; return <AbsoluteFill style={{ padding: "88px 110px", fontFamily: FONT }}><Header p={p} pal={pal} eyebrow="RETENTION REPORT · COHORT HEALTH" /><div style={{ marginTop: 48, display: "grid", gridTemplateColumns: "180px repeat(6, 1fr)", gap: 10, flex: 1 }}>{rows.map((row, r) => <React.Fragment key={row}><div style={{ color: pal.text, fontWeight: 750, display: "flex", alignItems: "center" }}>{row}</div>{Array.from({ length: 6 }, (_, c) => { const value = Math.max(12, 100 - r * 16 - c * 5); const alpha = (0.15 + value / 160) * show; return <div key={`${r}-${c}`} style={{ borderRadius: 10, background: `${pal.primary}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`, color: pal.text, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 20, opacity: show }}>{c < 6 - r ? `${value}%` : "—"}</div>; })}</React.Fragment>)}</div></AbsoluteFill>; };

const ConversionReport: React.FC<{ p: KpiReportsProps; pal: Palette }> = ({ p, pal }) => { const frame = useCurrentFrame(); const ms = metricsOf(p); const show = progress(frame); const labels = ["VISITORS", "ENGAGED", "TRIAL", "PAID"]; return <AbsoluteFill style={{ padding: "90px 120px", fontFamily: FONT }}><Header p={p} pal={pal} eyebrow="CONVERSION REPORT · FUNNEL" /><div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 42 }}>{labels.map((label, i) => { const value = (ms[i % ms.length].value || 100) * (i === 0 ? 8 : i === 1 ? 4.8 : i === 2 ? 2.2 : 1); const w = (78 - i * 15) * show; return <div key={label} style={{ width: `${w}%`, minWidth: 330, height: 92, background: [pal.primary, pal.secondary, pal.accent, "#a78bfa"][i], color: pal.bg, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 34px", borderRadius: 12, opacity: show, transform: `translateX(${(1 - show) * (i % 2 ? 22 : -22)}px)` }}><span style={{ fontWeight: 850, letterSpacing: "0.13em" }}>{label}</span><span style={{ fontFamily: MONO, fontSize: 32, fontWeight: 800 }}>{fmt(value, p, true)}</span></div>; })}</div></AbsoluteFill>; };

const BudgetReport: React.FC<{ p: KpiReportsProps; pal: Palette }> = ({ p, pal }) => { const ms = metricsOf(p); const frame = useCurrentFrame(); return <AbsoluteFill style={{ padding: "90px 110px", fontFamily: FONT }}><Header p={p} pal={pal} eyebrow="BUDGET REPORT · ALLOCATION" /><div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 22 }}>{ms.slice(0, 5).map((m, i) => { const show = progress(frame, 10 + i * 5, 54 + i * 5); const spent = Math.min(100, (m.value / Math.max(1, m.target ?? m.value * 1.15)) * 100); return <div key={m.label} style={{ opacity: show, transform: `translateX(${(1 - show) * 36}px)` }}><div style={{ display: "flex", justifyContent: "space-between", color: pal.text, fontSize: 20, fontWeight: 700, marginBottom: 9 }}><span>{m.label}</span><span style={{ fontFamily: MONO }}>{Math.round(spent)}%</span></div><div style={{ height: 26, background: `${pal.text}16`, borderRadius: 30, overflow: "hidden" }}><div style={{ width: `${spent}%`, height: "100%", background: spent > 95 ? "#fb7185" : colors(pal, p)[i % colors(pal, p).length], transform: `scaleX(${show})`, transformOrigin: "left", borderRadius: 30 }} /></div></div>; })}</div></AbsoluteFill>; };

const HealthScore: React.FC<{ p: KpiReportsProps; pal: Palette }> = ({ p, pal }) => { const frame = useCurrentFrame(); const ms = metricsOf(p); const score = Math.round(ms.reduce((a, m) => a + Math.min(100, Math.max(0, (m.value / Math.max(1, m.target ?? m.value)) * 100)), 0) / ms.length); const show = progress(frame, 8, 65); return <AbsoluteFill style={{ padding: "92px 120px", fontFamily: FONT }}><Header p={p} pal={pal} eyebrow="HEALTH SCORE · SIGNAL CHECK" /><div style={{ display: "flex", alignItems: "center", gap: 100, flex: 1 }}><div style={{ width: 430, height: 430, borderRadius: "50%", background: `conic-gradient(${pal.accent} ${score * show}%, ${pal.text}12 0)`, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 340, height: 340, borderRadius: "50%", background: pal.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}><div style={{ color: pal.text, fontFamily: MONO, fontWeight: 850, fontSize: 86 }}>{Math.round(score * show)}</div><div style={{ color: pal.secondary, letterSpacing: "0.2em", fontWeight: 750 }}>OUT OF 100</div></div></div><div style={{ display: "flex", flexDirection: "column", gap: 17, flex: 1 }}>{ms.slice(0, 5).map((m, i) => <MetricCard key={m.label} metric={m} p={p} pal={pal} index={i} compact />)}</div></div></AbsoluteFill>; };

const ReportToAction: React.FC<{ p: KpiReportsProps; pal: Palette }> = ({ p, pal }) => { const ms = metricsOf(p); const notes = p.notes?.length ? p.notes : ["Protect conversion quality", "Close the activation gap", "Double down on retention"]; const frame = useCurrentFrame(); return <AbsoluteFill style={{ padding: "88px 100px", fontFamily: FONT }}><Header p={p} pal={pal} eyebrow="REPORT TO ACTION · NEXT MOVES" /><div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 28, marginTop: 45, flex: 1 }}><div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{ms.slice(0, 4).map((m, i) => <MetricCard key={m.label} metric={m} p={p} pal={pal} index={i} compact />)}</div><div style={{ borderLeft: `1px solid ${pal.text}24`, paddingLeft: 34 }}><div style={{ color: pal.accent, fontSize: 18, letterSpacing: "0.2em", fontWeight: 800 }}>RECOMMENDED NEXT ACTIONS</div><div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 24 }}>{notes.slice(0, 4).map((note, i) => { const show = progress(frame, 22 + i * 8, 58 + i * 8); return <div key={note} style={{ display: "flex", gap: 18, alignItems: "center", padding: "19px 20px", background: `${pal.text}09`, borderRadius: 14, opacity: show, transform: `translateX(${(1 - show) * 28}px)` }}><div style={{ width: 34, height: 34, borderRadius: "50%", background: pal.accent, color: pal.bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 850 }}>{i + 1}</div><div style={{ color: pal.text, fontSize: 21, fontWeight: 650 }}>{note}</div></div>; })}</div></div></div></AbsoluteFill>; };

const VARIANTS: Record<KpiReportVariant, React.FC<{ p: KpiReportsProps; pal: Palette }>> = {
  "monthly-report": MonthlyReport,
  "quarterly-review": QuarterlyReview,
  "target-vs-actual": TargetActual,
  "variance-bridge": VarianceBridge,
  "growth-summary": GrowthSummary,
  "retention-report": RetentionReport,
  "conversion-report": ConversionReport,
  "budget-report": BudgetReport,
  "health-score": HealthScore,
  "report-to-action": ReportToAction,
};

export const KpiReportsTemplate: React.FC<KpiReportsProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? MonthlyReport;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <AbsoluteFill style={{ backgroundColor: pal.bg }}><Backdrop pal={pal} mode={props.variant === "health-score" ? "glow" : "grid"} /><FadeEdges inFrames={10} outFrames={12}><div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><Variant p={props} pal={pal} /></div></FadeEdges></AbsoluteFill>;
};

const familyCast = (component: React.FC<KpiReportsProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;
export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "kpi-reports-monthly-report": familyCast(KpiReportsTemplate),
  "kpi-reports-quarterly-review": familyCast(KpiReportsTemplate),
  "kpi-reports-target-vs-actual": familyCast(KpiReportsTemplate),
  "kpi-reports-variance-bridge": familyCast(KpiReportsTemplate),
  "kpi-reports-growth-summary": familyCast(KpiReportsTemplate),
  "kpi-reports-retention-report": familyCast(KpiReportsTemplate),
  "kpi-reports-conversion-report": familyCast(KpiReportsTemplate),
  "kpi-reports-budget-report": familyCast(KpiReportsTemplate),
  "kpi-reports-health-score": familyCast(KpiReportsTemplate),
  "kpi-reports-report-to-action": familyCast(KpiReportsTemplate),
};
