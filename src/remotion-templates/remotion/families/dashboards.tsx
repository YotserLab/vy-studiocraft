import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, GradientMeshBackground, clampInterp, resolvePalette, type Palette } from "../lib/primitives";

/** Coordinated multi-panel dashboard narratives with drill-down and focus choreography. */
export type DashboardVariant =
  | "kpi-wall"
  | "dashboard-drilldown"
  | "executive-summary"
  | "operations-monitor"
  | "product-analytics"
  | "marketing-dashboard"
  | "finance-dashboard"
  | "health-dashboard"
  | "real-time-grid"
  | "dashboard-alert";

export interface DashboardMetric {
  label: string;
  value: number | string;
  delta?: number;
  unit?: string;
  status?: "good" | "warn" | "bad" | "neutral";
  target?: number;
}

export interface DashboardPanel {
  label: string;
  value: number | string;
  subtitle?: string;
  status?: "good" | "warn" | "bad" | "neutral";
  trend?: number[];
  color?: string;
}

export interface DashboardSeries {
  label: string;
  values: number[];
  color?: string;
}

export interface DashboardsProps {
  variant: DashboardVariant;
  title: string;
  subtitle: string;
  paletteName: string;
  metrics: DashboardMetric[];
  panels: DashboardPanel[];
  series: DashboardSeries[];
  focusPanel?: string;
  units?: string;
  status?: string;
  period?: string;
  alertText?: string;
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const FALLBACK_METRICS: DashboardMetric[] = [
  { label: "Active users", value: 12840, delta: 12.4, status: "good" },
  { label: "Conversion", value: 7.8, unit: "%", delta: 1.8, status: "good" },
  { label: "Open tickets", value: 43, delta: -8, status: "warn" },
  { label: "Net revenue", value: 84200, unit: "$", delta: 6.2, status: "good" },
];
const FALLBACK_PANELS: DashboardPanel[] = [
  { label: "North America", value: 68, subtitle: "of target", status: "good", trend: [32, 38, 35, 49, 52, 61, 68] },
  { label: "Europe", value: 54, subtitle: "of target", status: "warn", trend: [28, 42, 37, 44, 41, 48, 54] },
  { label: "Asia Pacific", value: 42, subtitle: "of target", status: "neutral", trend: [18, 22, 31, 29, 34, 39, 42] },
  { label: "Enterprise", value: 81, subtitle: "of target", status: "good", trend: [42, 48, 50, 61, 67, 75, 81] },
  { label: "Self serve", value: 36, subtitle: "of target", status: "bad", trend: [41, 38, 35, 39, 32, 34, 36] },
  { label: "Partners", value: 63, subtitle: "of target", status: "good", trend: [24, 33, 35, 40, 49, 57, 63] },
];
const FALLBACK_SERIES: DashboardSeries[] = [
  { label: "Current", values: [31, 38, 34, 46, 43, 55, 61, 68], color: "primary" },
  { label: "Previous", values: [25, 30, 33, 35, 37, 41, 44, 48], color: "secondary" },
];

const colors = (pal: Palette): string[] => [pal.primary, pal.secondary, pal.accent, "#a78bfa", "#22d3ee", "#fb7185"];
const metricsOf = (p: DashboardsProps): DashboardMetric[] => (p.metrics?.length ? p.metrics : FALLBACK_METRICS);
const panelsOf = (p: DashboardsProps): DashboardPanel[] => (p.panels?.length ? p.panels : FALLBACK_PANELS);
const seriesOf = (p: DashboardsProps): DashboardSeries[] => (p.series?.length ? p.series : FALLBACK_SERIES);
const numeric = (value: number | string): number => typeof value === "number" ? value : Number.parseFloat(value.replace(/[^0-9.-]/g, "")) || 0;
const fmt = (value: number | string, unit = ""): string => {
  if (typeof value === "string") return value;
  const abs = Math.abs(value);
  const out = abs >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)}M` : abs >= 10_000 ? `${(value / 1_000).toFixed(1)}K` : value.toLocaleString("en-US", { maximumFractionDigits: 1 });
  return `${unit === "$" ? "$" : ""}${out}${unit && unit !== "$" ? unit : ""}`;
};
const statusColor = (pal: Palette, status?: DashboardMetric["status"]): string => status === "bad" ? "#fb7185" : status === "warn" ? pal.accent : status === "good" ? "#34d399" : `${pal.text}66`;
const reveal = (frame: number, index: number, fps: number): number => spring({ frame: Math.max(0, frame - 7 - index * 4), fps, config: { damping: 18, stiffness: 120, mass: 0.75 } });

const Panel: React.FC<{ pal: Palette; children: React.ReactNode; style?: React.CSSProperties; index?: number; tone?: string }> = ({ pal, children, style, index = 0, tone }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = reveal(frame, index, fps);
  return <div style={{ background: tone ?? `linear-gradient(145deg, ${pal.text}0d, ${pal.text}04)`, border: `1px solid ${pal.text}1c`, borderRadius: 22, boxShadow: `0 24px 60px ${pal.bg}88`, backdropFilter: "blur(16px)", opacity: enter, transform: `translateY(${(1 - enter) * 18}px)`, overflow: "hidden", ...style }}>{children}</div>;
};

const Sparkline: React.FC<{ values: number[]; color: string; pal: Palette; width?: number; height?: number; fill?: boolean }> = ({ values, color, pal, width = 420, height = 120, fill = true }) => {
  const frame = useCurrentFrame();
  const safe = values.length > 1 ? values : [0, ...(values.length ? values : [1])];
  const hi = Math.max(...safe, 1);
  const lo = Math.min(...safe, 0);
  const range = Math.max(1, hi - lo);
  const path = safe.map((v, i) => `${i ? "L" : "M"}${(i / (safe.length - 1)) * width},${height - ((v - lo) / range) * height}`).join(" ");
  const area = `${path} L${width},${height} L0,${height} Z`;
  const draw = clampInterp(frame, [8, 62], [0, 1]);
  return <svg viewBox={`0 0 ${width} ${height + 4}`} width="100%" height="100%" preserveAspectRatio="none"><defs><linearGradient id={`dash-fill-${color.replace(/[^a-z0-9]/gi, "")}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".38" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs><path d={area} fill={fill ? `url(#dash-fill-${color.replace(/[^a-z0-9]/gi, "")})` : "none"} opacity={draw} /><path d={path} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} /><circle cx={width * draw} cy={height - ((safe[Math.min(safe.length - 1, Math.floor((safe.length - 1) * draw))] - lo) / range) * height} r="5" fill={pal.bg} stroke={color} strokeWidth="3" /></svg>;
};

const Bars: React.FC<{ values: number[]; pal: Palette; color?: string; horizontal?: boolean }> = ({ values, pal, color, horizontal = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hi = Math.max(1, ...values);
  return <div style={{ display: "flex", flexDirection: horizontal ? "column" : "row", alignItems: horizontal ? "stretch" : "flex-end", justifyContent: "space-between", gap: horizontal ? 11 : 9, height: "100%" }}>{values.map((v, i) => { const h = reveal(frame, i, fps); const pct = Math.max(3, (Math.max(0, v) / hi) * 100) * h; return <div key={i} style={{ flex: horizontal ? undefined : 1, display: "flex", alignItems: horizontal ? "center" : "flex-end", gap: 9, minHeight: horizontal ? 24 : 0 }}>{horizontal && <span style={{ width: 84, color: `${pal.text}8c`, fontSize: 14, whiteSpace: "nowrap" }}>{`Segment ${i + 1}`}</span>}<div style={{ flex: 1, height: horizontal ? 12 : `${pct}%`, minHeight: horizontal ? 12 : 4, borderRadius: 7, background: `linear-gradient(90deg, ${color ?? pal.primary}, ${color ?? pal.secondary})`, boxShadow: `0 0 18px ${color ?? pal.primary}28`, transform: horizontal ? `scaleX(${h})` : undefined, transformOrigin: "left" }} /></div>; })}</div>;
};

const MetricCard: React.FC<{ metric: DashboardMetric; pal: Palette; index: number; compact?: boolean }> = ({ metric, pal, index, compact = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = reveal(frame, index, fps);
  const target = metric.target ?? Math.max(1, numeric(metric.value) * 1.25);
  const amount = clampInterp(frame, [12 + index * 3, 52 + index * 3], [0, numeric(metric.value)]);
  const delta = metric.delta ?? 0;
  return <Panel pal={pal} index={index} style={{ padding: compact ? 18 : 26, minHeight: compact ? 104 : 150 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}><div style={{ color: `${pal.text}91`, fontSize: compact ? 13 : 15, letterSpacing: ".08em", textTransform: "uppercase" }}>{metric.label}</div><span style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor(pal, metric.status), boxShadow: `0 0 14px ${statusColor(pal, metric.status)}` }} /></div><div style={{ marginTop: compact ? 10 : 18, fontFamily: MONO, fontWeight: 700, fontSize: compact ? 26 : 36, letterSpacing: "-.06em", color: pal.text }}>{typeof metric.value === "string" ? metric.value : fmt(amount, metric.unit)}</div><div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 12, color: delta >= 0 ? "#34d399" : "#fb7185", fontSize: 13 }}>{delta >= 0 ? "↗" : "↘"} {Math.abs(delta).toFixed(1)}% <span style={{ color: `${pal.text}55` }}>vs prior period</span></div>{!compact && <div style={{ height: 4, marginTop: 15, background: `${pal.text}12`, borderRadius: 3 }}><div style={{ width: `${Math.min(100, (numeric(metric.value) / target) * 100) * enter}%`, height: "100%", borderRadius: 3, background: statusColor(pal, metric.status) }} /></div>}</Panel>;
};

const Header: React.FC<{ p: DashboardsProps; pal: Palette; live?: boolean }> = ({ p, pal, live = false }) => <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}><div><div style={{ color: `${pal.text}54`, fontSize: 13, textTransform: "uppercase", letterSpacing: ".2em" }}>{p.period ?? "Overview / 2025"}</div><h1 style={{ margin: "9px 0 0", fontSize: 42, lineHeight: 1, letterSpacing: "-.055em", fontWeight: 760 }}>{p.title}</h1><div style={{ marginTop: 12, color: `${pal.text}81`, fontSize: 17 }}>{p.subtitle}</div></div><div style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 15px", border: `1px solid ${pal.text}16`, borderRadius: 99, color: `${pal.text}88`, fontSize: 13, letterSpacing: ".08em", textTransform: "uppercase" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: live ? "#34d399" : pal.primary, boxShadow: `0 0 16px ${live ? "#34d399" : pal.primary}` }} />{live ? "Live feed" : "Updated 2m ago"}</div></div>;

const Legend: React.FC<{ pal: Palette; series: DashboardSeries[] }> = ({ pal, series }) => <div style={{ display: "flex", gap: 18, color: `${pal.text}78`, fontSize: 13 }}>{series.slice(0, 3).map((s, i) => <span key={s.label} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><i style={{ width: 7, height: 7, borderRadius: "50%", background: s.color === "secondary" ? pal.secondary : s.color === "accent" ? pal.accent : pal.primary }} />{s.label}</span>)}</div>;

const Base: React.FC<{ p: DashboardsProps; pal: Palette; children: React.ReactNode; live?: boolean }> = ({ p, pal, children, live = false }) => <AbsoluteFill style={{ background: pal.bg, color: pal.text, fontFamily: FONT, padding: "62px 76px 58px" }}><GradientMeshBackground palette={pal} blobs={4} speed={.2} /><AbsoluteFill style={{ opacity: .12, backgroundImage: `linear-gradient(${pal.text}0b 1px, transparent 1px), linear-gradient(90deg, ${pal.text}0b 1px, transparent 1px)`, backgroundSize: "58px 58px", maskImage: "linear-gradient(to bottom, transparent, black 25%, black 80%, transparent)" }} /><FadeEdges inFrames={12} outFrames={15}><div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", gap: 29 }}><Header p={p} pal={pal} live={live} />{children}</div></FadeEdges></AbsoluteFill>;

const KpiWall: React.FC<{ p: DashboardsProps; pal: Palette }> = ({ p, pal }) => { const series = seriesOf(p); return <Base p={p} pal={pal}><div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>{metricsOf(p).slice(0, 4).map((m, i) => <MetricCard key={m.label} metric={m} pal={pal} index={i} />)}</div><Panel pal={pal} index={5} style={{ flex: 1, padding: 25, minHeight: 0 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 17 }}><div><div style={{ fontWeight: 700, fontSize: 20 }}>Performance trend</div><div style={{ color: `${pal.text}61`, fontSize: 14, marginTop: 5 }}>Trailing eight reporting periods</div></div><Legend pal={pal} series={series} /></div><div style={{ height: "calc(100% - 62px)" }}><Sparkline values={series[0].values} color={pal.primary} pal={pal} height={230} /></div></Panel></Base>; };

const Drilldown: React.FC<{ p: DashboardsProps; pal: Palette }> = ({ p, pal }) => { const panels = panelsOf(p); const focus = p.focusPanel ?? panels[0].label; const selected = panels.find(x => x.label === focus) ?? panels[0]; return <Base p={p} pal={pal}><div style={{ display: "grid", gridTemplateColumns: "290px 1fr", gap: 18, flex: 1, minHeight: 0 }}><Panel pal={pal} index={0} style={{ padding: 18 }}><div style={{ color: `${pal.text}5e`, fontSize: 12, textTransform: "uppercase", letterSpacing: ".15em", padding: "10px 12px 18px" }}>Explore panels</div>{panels.map((item, i) => <div key={item.label} style={{ padding: "15px 13px", marginBottom: 7, borderRadius: 13, background: item.label === focus ? `${pal.primary}20` : "transparent", border: `1px solid ${item.label === focus ? pal.primary + "55" : "transparent"}`, color: item.label === focus ? pal.text : `${pal.text}79`, display: "flex", justifyContent: "space-between", alignItems: "center" }}><span>{item.label}</span><span style={{ fontFamily: MONO, color: `${pal.text}9e` }}>{fmt(item.value)}</span></div>)}</Panel><Panel pal={pal} index={1} style={{ padding: 32, minHeight: 0 }}><div style={{ display: "flex", justifyContent: "space-between" }}><div><div style={{ fontSize: 26, fontWeight: 720 }}>{selected.label}</div><div style={{ color: `${pal.text}67`, marginTop: 8 }}>{selected.subtitle ?? "Selected panel detail"}</div></div><div style={{ fontFamily: MONO, fontSize: 43, color: pal.primary }}>{fmt(selected.value, p.units)}</div></div><div style={{ height: "calc(100% - 96px)", marginTop: 25 }}><Sparkline values={selected.trend ?? [18, 29, 26, 41, 38, 52, numeric(selected.value)]} color={pal.primary} pal={pal} height={330} /></div></Panel></div></Base>; };

const Executive: React.FC<{ p: DashboardsProps; pal: Palette }> = ({ p, pal }) => { const ms = metricsOf(p); const panels = panelsOf(p); return <Base p={p} pal={pal}><div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>{ms.slice(0, 3).map((m, i) => <MetricCard metric={m} pal={pal} index={i} key={m.label} />)}</div><div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 18, flex: 1, minHeight: 0 }}><Panel pal={pal} index={4} style={{ padding: 28 }}><div style={{ fontSize: 20, fontWeight: 700 }}>What changed</div><div style={{ color: `${pal.text}73`, lineHeight: 1.7, fontSize: 17, marginTop: 18, maxWidth: 670 }}>Momentum is concentrated in the enterprise segment while self-serve recovery remains the clearest opportunity. The current mix supports the next growth milestone.</div><div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginTop: 32 }}>{panels.slice(0, 4).map((x, i) => <div key={x.label} style={{ borderTop: `1px solid ${pal.text}18`, paddingTop: 14 }}><div style={{ fontSize: 13, color: `${pal.text}62` }}>{x.label}</div><div style={{ fontFamily: MONO, fontSize: 24, marginTop: 7 }}>{fmt(x.value, p.units)}</div></div>)}</div></Panel><Panel pal={pal} index={5} style={{ padding: 26 }}><div style={{ fontSize: 20, fontWeight: 700 }}>Regional pulse</div><div style={{ height: "calc(100% - 48px)", marginTop: 22 }}><Bars values={panels.slice(0, 5).map(x => numeric(x.value))} pal={pal} color={pal.secondary} horizontal /></div></Panel></div></Base>; };

const Operations: React.FC<{ p: DashboardsProps; pal: Palette }> = ({ p, pal }) => { const frame = useCurrentFrame(); const panels = panelsOf(p); return <Base p={p} pal={pal} live><div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>{panels.slice(0, 6).map((x, i) => <Panel key={x.label} pal={pal} index={i} style={{ padding: 21, minHeight: 132 }}><div style={{ display: "flex", justifyContent: "space-between", color: `${pal.text}86`, fontSize: 14 }}><span>{x.label}</span><span style={{ color: statusColor(pal, x.status as DashboardMetric["status"]), fontSize: 12 }}>● {x.status ?? "nominal"}</span></div><div style={{ fontFamily: MONO, fontSize: 30, marginTop: 14 }}>{fmt(x.value, p.units)}</div><div style={{ height: 5, marginTop: 15, borderRadius: 4, background: `${pal.text}13` }}><div style={{ width: `${Math.min(100, numeric(x.value))}%`, height: "100%", background: statusColor(pal, x.status as DashboardMetric["status"]), borderRadius: 4, boxShadow: `0 0 16px ${statusColor(pal, x.status as DashboardMetric["status"])}` }} /></div></Panel>)}</div><Panel pal={pal} index={7} style={{ flex: 1, minHeight: 0, padding: 25 }}><div style={{ display: "flex", justifyContent: "space-between" }}><div style={{ fontSize: 20, fontWeight: 700 }}>Event stream</div><div style={{ fontFamily: MONO, color: "#34d399", fontSize: 13 }}>LIVE {String(Math.floor(frame / 3)).padStart(4, "0")}</div></div><div style={{ marginTop: 18 }}>{["Queue latency returned to normal", "Worker pool scaled to 84%", "New region health check passed", "Scheduled deployment completed"].map((x, i) => <div key={x} style={{ padding: "14px 0", borderTop: `1px solid ${pal.text}13`, display: "flex", gap: 20, color: `${pal.text}87`, fontFamily: MONO, fontSize: 14 }}><span style={{ color: `${pal.text}4e` }}>{`0${i + 1}:4${i}`}</span><span style={{ color: i === 0 ? "#34d399" : pal.text }}>{x}</span></div>)}</div></Panel></Base>; };

const Product: React.FC<{ p: DashboardsProps; pal: Palette }> = ({ p, pal }) => { const ms = metricsOf(p); const series = seriesOf(p); return <Base p={p} pal={pal}><div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 13 }}>{ms.slice(0, 4).map((m, i) => <MetricCard metric={m} pal={pal} index={i} compact key={m.label} />)}</div><div style={{ display: "grid", gridTemplateColumns: ".8fr 1.2fr", gap: 18, flex: 1, minHeight: 0 }}><Panel pal={pal} index={4} style={{ padding: 26 }}><div style={{ fontSize: 19, fontWeight: 700 }}>Activation funnel</div><div style={{ height: "calc(100% - 45px)", marginTop: 18 }}><Bars values={[100, 74, 52, 31, 18]} pal={pal} color={pal.accent} horizontal /></div></Panel><Panel pal={pal} index={5} style={{ padding: 26 }}><div style={{ display: "flex", justifyContent: "space-between" }}><div style={{ fontSize: 19, fontWeight: 700 }}>Retention curve</div><Legend pal={pal} series={series} /></div><div style={{ height: "calc(100% - 45px)", marginTop: 19 }}><Sparkline values={series[0].values} color={pal.secondary} pal={pal} height={290} /></div></Panel></div></Base>; };

const Marketing: React.FC<{ p: DashboardsProps; pal: Palette }> = ({ p, pal }) => { const panels = panelsOf(p); return <Base p={p} pal={pal}><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, flex: 1, minHeight: 0 }}><Panel pal={pal} index={0} style={{ padding: 27 }}><div style={{ fontSize: 20, fontWeight: 700 }}>Campaign reach</div><div style={{ marginTop: 23, display: "grid", gap: 17 }}>{panels.slice(0, 5).map((x, i) => <div key={x.label}><div style={{ display: "flex", justifyContent: "space-between", color: `${pal.text}8a`, fontSize: 14 }}><span>{x.label}</span><span style={{ fontFamily: MONO }}>{fmt(x.value, p.units)}</span></div><div style={{ height: 10, marginTop: 8, background: `${pal.text}12`, borderRadius: 6 }}><div style={{ width: `${Math.min(100, numeric(x.value))}%`, height: "100%", borderRadius: 6, background: colors(pal)[i % 3] }} /></div></div>)}</div></Panel><Panel pal={pal} index={1} style={{ padding: 27 }}><div style={{ fontSize: 20, fontWeight: 700 }}>Channel mix</div><div style={{ height: 220, width: 220, margin: "28px auto 18px", borderRadius: "50%", background: `conic-gradient(${pal.primary} 0 34%, ${pal.secondary} 34% 61%, ${pal.accent} 61% 82%, #a78bfa 82% 100%)`, display: "grid", placeItems: "center" }}><div style={{ width: 112, height: 112, borderRadius: "50%", background: pal.bg, display: "grid", placeItems: "center", textAlign: "center", fontFamily: MONO, fontSize: 19 }}>4.8M<span style={{ display: "block", fontFamily: FONT, fontSize: 11, color: `${pal.text}66` }}>impressions</span></div></div><div style={{ display: "flex", justifyContent: "center", gap: 15, color: `${pal.text}76`, fontSize: 12 }}>{["Paid", "Organic", "Social", "Email"].map((x, i) => <span key={x}><i style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: colors(pal)[i] }} /> {x}</span>)}</div></Panel></div></Base>; };

const Finance: React.FC<{ p: DashboardsProps; pal: Palette }> = ({ p, pal }) => { const ms = metricsOf(p); return <Base p={p} pal={pal}><div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>{ms.slice(0, 3).map((m, i) => <MetricCard metric={m} pal={pal} index={i} key={m.label} />)}</div><div style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 18, flex: 1, minHeight: 0 }}><Panel pal={pal} index={4} style={{ padding: 27 }}><div style={{ fontSize: 20, fontWeight: 700 }}>Cash flow</div><div style={{ height: "calc(100% - 50px)", marginTop: 21 }}><Bars values={[24, 38, 31, 47, 42, 63, 57, 71]} pal={pal} color={pal.primary} /></div></Panel><Panel pal={pal} index={5} style={{ padding: 27 }}><div style={{ fontSize: 20, fontWeight: 700 }}>Forecast guardrails</div>{["Gross margin", "Runway", "Burn multiple", "Plan attainment"].map((x, i) => <div key={x} style={{ borderTop: `1px solid ${pal.text}15`, padding: "17px 0", display: "flex", justifyContent: "space-between", color: `${pal.text}80` }}><span>{x}</span><span style={{ fontFamily: MONO, color: i === 2 ? pal.accent : pal.text }}>{["72.4%", "14.2 mo", "1.8x", "94% "][i]}</span></div>)}</Panel></div></Base>; };

const Health: React.FC<{ p: DashboardsProps; pal: Palette }> = ({ p, pal }) => { const panels = panelsOf(p); return <Base p={p} pal={pal}><div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>{panels.slice(0, 4).map((x, i) => <Panel pal={pal} index={i} key={x.label} style={{ padding: 20, textAlign: "center" }}><div style={{ color: `${pal.text}76`, fontSize: 14 }}>{x.label}</div><div style={{ width: 110, height: 110, borderRadius: "50%", margin: "16px auto 10px", display: "grid", placeItems: "center", background: `conic-gradient(${statusColor(pal, x.status as DashboardMetric["status"])} ${Math.min(100, numeric(x.value))}%, ${pal.text}12 0)` }}><div style={{ width: 84, height: 84, borderRadius: "50%", background: pal.bg, display: "grid", placeItems: "center", fontFamily: MONO, fontSize: 20 }}>{fmt(x.value, p.units)}</div></div><div style={{ color: statusColor(pal, x.status as DashboardMetric["status"]), fontSize: 12, textTransform: "uppercase", letterSpacing: ".13em" }}>{x.status ?? "stable"}</div></Panel>)}</div><Panel pal={pal} index={5} style={{ flex: 1, minHeight: 0, padding: 25 }}><div style={{ fontSize: 20, fontWeight: 700 }}>Vitals over time</div><div style={{ height: "calc(100% - 48px)", marginTop: 18 }}><Sparkline values={seriesOf(p)[0].values} color="#34d399" pal={pal} height={255} /></div></Panel></Base>; };

const RealTime: React.FC<{ p: DashboardsProps; pal: Palette }> = ({ p, pal }) => { const frame = useCurrentFrame(); const ms = metricsOf(p); return <Base p={p} pal={pal} live><div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 11 }}>{[...ms, ...FALLBACK_METRICS].slice(0, 8).map((m, i) => <MetricCard metric={m} pal={pal} index={i} compact key={`${m.label}-${i}`} />)}</div><Panel pal={pal} index={9} style={{ flex: 1, minHeight: 0, padding: 24 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 15 }}><div style={{ fontSize: 19, fontWeight: 700 }}>Real-time activity grid</div><div style={{ fontFamily: MONO, fontSize: 12, color: "#34d399" }}>SYNC {String(frame % 60).padStart(2, "0")}s</div></div><div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 6, height: "calc(100% - 42px)" }}>{Array.from({ length: 96 }, (_, i) => { const pulse = (Math.sin(frame * .08 + i * 1.7) + 1) / 2; return <div key={i} style={{ borderRadius: 3, background: i % 11 === 0 ? pal.accent : pal.primary, opacity: .18 + pulse * .72 }} />; })}</div></Panel></Base>; };

const Alert: React.FC<{ p: DashboardsProps; pal: Palette }> = ({ p, pal }) => { const panels = panelsOf(p); return <Base p={p} pal={pal}><Panel pal={pal} index={0} tone={`linear-gradient(110deg, ${pal.accent}27, ${pal.accent}08)`} style={{ padding: 22, borderColor: `${pal.accent}65` }}><div style={{ display: "flex", alignItems: "center", gap: 14 }}><div style={{ width: 37, height: 37, borderRadius: 11, display: "grid", placeItems: "center", background: `${pal.accent}2d`, color: pal.accent, fontSize: 21 }}>!</div><div><div style={{ fontWeight: 700, fontSize: 17 }}>Attention required</div><div style={{ color: `${pal.text}8a`, marginTop: 4 }}>{p.alertText ?? "One or more operating thresholds need review before the next reporting window."}</div></div></div></Panel><div style={{ display: "grid", gridTemplateColumns: ".9fr 1.1fr", gap: 18, flex: 1, minHeight: 0 }}><Panel pal={pal} index={2} style={{ padding: 26 }}><div style={{ fontSize: 20, fontWeight: 700 }}>Alert queue</div>{panels.slice(0, 5).map((x, i) => <div key={x.label} style={{ display: "flex", gap: 12, alignItems: "center", borderTop: `1px solid ${pal.text}15`, marginTop: 16, paddingTop: 16 }}><span style={{ width: 9, height: 9, borderRadius: "50%", background: statusColor(pal, x.status as DashboardMetric["status"]) }} /><div style={{ flex: 1, color: `${pal.text}8a`, fontSize: 14 }}>{x.label}</div><span style={{ fontFamily: MONO, color: pal.text }}>{fmt(x.value)}</span></div>)}</Panel><Panel pal={pal} index={3} style={{ padding: 26 }}><div style={{ fontSize: 20, fontWeight: 700 }}>Recovery trajectory</div><div style={{ height: "calc(100% - 52px)", marginTop: 22 }}><Sparkline values={seriesOf(p)[0].values} color={pal.accent} pal={pal} height={285} /></div></Panel></div></Base>; };

const DashboardTemplate: React.FC<DashboardsProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const p = { ...props, metrics: metricsOf(props), panels: panelsOf(props), series: seriesOf(props) };
  const shared = { p, pal };
  switch (props.variant) {
    case "dashboard-drilldown": return <Drilldown {...shared} />;
    case "executive-summary": return <Executive {...shared} />;
    case "operations-monitor": return <Operations {...shared} />;
    case "product-analytics": return <Product {...shared} />;
    case "marketing-dashboard": return <Marketing {...shared} />;
    case "finance-dashboard": return <Finance {...shared} />;
    case "health-dashboard": return <Health {...shared} />;
    case "real-time-grid": return <RealTime {...shared} />;
    case "dashboard-alert": return <Alert {...shared} />;
    case "kpi-wall":
    default: return <KpiWall {...shared} />;
  }
};

const familyCast = (component: React.FC<DashboardsProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;
export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "dashboards-kpi-wall": familyCast(DashboardTemplate),
  "dashboards-dashboard-drilldown": familyCast(DashboardTemplate),
  "dashboards-executive-summary": familyCast(DashboardTemplate),
  "dashboards-operations-monitor": familyCast(DashboardTemplate),
  "dashboards-product-analytics": familyCast(DashboardTemplate),
  "dashboards-marketing-dashboard": familyCast(DashboardTemplate),
  "dashboards-finance-dashboard": familyCast(DashboardTemplate),
  "dashboards-health-dashboard": familyCast(DashboardTemplate),
  "dashboards-real-time-grid": familyCast(DashboardTemplate),
  "dashboards-dashboard-alert": familyCast(DashboardTemplate),
};
