import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  FadeEdges,
  GradientMeshBackground,
  clampInterp,
  resolvePalette,
  seededRand,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: data-viz
 * Ten animated, presentation-ready data visualizations driven by serializable data.
 */

type DataVizVariant =
  | "bar-race"
  | "line-area"
  | "donut-kpi"
  | "ranked-bars"
  | "stacked-area"
  | "radial-rings"
  | "kpi-delta"
  | "dual-comparison"
  | "sparkline-dashboard"
  | "gauge-dial";

export interface DataVizPoint {
  label: string;
  value: number;
  secondary?: number;
  previous?: number;
  delta?: number;
  color?: string;
  values?: number[];
}

export interface DataVizSeries {
  label: string;
  values: number[];
  color?: string;
}

export interface DataVizProps {
  variant: DataVizVariant;
  title: string;
  subtitle: string;
  paletteName: string;
  data: DataVizPoint[];
  series?: DataVizSeries[];
  unit?: string;
  prefix?: string;
  suffix?: string;
  maxValue?: number;
  target?: number;
  primaryLabel?: string;
  secondaryLabel?: string;
}

const FONT_STACK = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO_STACK = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const FALLBACK_DATA: DataVizPoint[] = [
  { label: "North", value: 72 },
  { label: "South", value: 58 },
  { label: "East", value: 86 },
  { label: "West", value: 64 },
];

const dataOf = (p: DataVizProps): DataVizPoint[] => (p.data?.length ? p.data : FALLBACK_DATA);
const positiveMax = (values: number[], supplied?: number): number =>
  Math.max(1, supplied ?? 0, ...values.map((value) => Math.max(0, value)));
const paletteColors = (pal: Palette): string[] => [pal.primary, pal.secondary, pal.accent, "#a78bfa", "#22d3ee", "#fb7185"];

const formatValue = (value: number, p: DataVizProps, compact = false): string => {
  const abs = Math.abs(value);
  let number: string;
  if (compact && abs >= 1_000_000) number = `${(value / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  else if (compact && abs >= 1_000) number = `${(value / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
  else number = Math.round(value).toLocaleString("en-US");
  return `${p.prefix ?? ""}${number}${p.suffix ?? p.unit ?? ""}`;
};

const pointsPath = (values: number[], width: number, height: number, max?: number, min?: number): string => {
  if (!values.length) return "";
  const hi = max ?? Math.max(...values);
  const lo = min ?? Math.min(...values);
  const range = Math.max(1, hi - lo);
  return values
    .map((value, i) => {
      const x = values.length === 1 ? width / 2 : (i / (values.length - 1)) * width;
      const y = height - ((value - lo) / range) * height;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
};

const Panel: React.FC<{
  children: React.ReactNode;
  pal: Palette;
  style?: React.CSSProperties;
}> = ({ children, pal, style }) => (
  <div
    style={{
      background: `linear-gradient(145deg, ${pal.text}10, ${pal.text}05)`,
      border: `1px solid ${pal.text}1f`,
      boxShadow: `0 30px 80px ${pal.bg}99`,
      borderRadius: 34,
      backdropFilter: "blur(18px)",
      ...style,
    }}
  >
    {children}
  </div>
);

const ChartGrid: React.FC<{ pal: Palette; rows?: number }> = ({ pal, rows = 5 }) => (
  <AbsoluteFill style={{ justifyContent: "space-between", padding: "2px 0" }}>
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} style={{ width: "100%", borderTop: `1px dashed ${pal.text}1c` }} />
    ))}
  </AbsoluteFill>
);

const ChartFrame: React.FC<{
  p: DataVizProps;
  pal: Palette;
  children: React.ReactNode;
}> = ({ p, pal, children }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ padding: "82px 108px 78px", color: pal.text, fontFamily: FONT_STACK }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", height: 116 }}>
        <div>
          <div style={{ fontSize: 46, lineHeight: 1.05, fontWeight: 760, letterSpacing: "-0.035em" }}>{p.title}</div>
          <div style={{ marginTop: 14, color: `${pal.text}8f`, fontSize: 21, letterSpacing: "0.04em" }}>{p.subtitle}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, color: `${pal.text}99`, fontSize: 16, letterSpacing: "0.13em", textTransform: "uppercase" }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: pal.accent, boxShadow: `0 0 18px ${pal.accent}`, opacity: 0.6 + Math.sin(frame * 0.12) * 0.25 }} />
          Live report
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </AbsoluteFill>
  );
};

// ---------------- variant: bar chart race-in ----------------
const BarRace: React.FC<{ p: DataVizProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const data = dataOf(p);
  const max = positiveMax(data.map((d) => d.value), p.maxValue);
  const colors = paletteColors(pal);
  return (
    <Panel pal={pal} style={{ height: "100%", padding: "54px 64px 44px" }}>
      <div style={{ position: "relative", height: "100%" }}>
        <ChartGrid pal={pal} />
        <div style={{ position: "absolute", inset: "16px 12px 0", display: "flex", alignItems: "flex-end", gap: 28 }}>
          {data.map((d, i) => {
            const reveal = spring({ frame: Math.max(0, frame - 8 - i * 5), fps, config: { damping: 16, stiffness: 105, mass: 0.85 } });
            const height = (Math.max(0, d.value) / max) * 82 * reveal;
            return (
              <div key={`${d.label}-${i}`} style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", minWidth: 0 }}>
                <div style={{ marginBottom: 15, fontFamily: MONO_STACK, fontWeight: 700, fontSize: 24, opacity: reveal }}>
                  {formatValue(d.value * reveal, p, true)}
                </div>
                <div style={{ width: "100%", maxWidth: 170, height: `${height}%`, minHeight: reveal * 4, position: "relative", borderRadius: "18px 18px 5px 5px", background: `linear-gradient(180deg, ${d.color ?? colors[i % colors.length]}, ${d.color ?? colors[i % colors.length]}99)`, boxShadow: `0 16px 38px ${d.color ?? colors[i % colors.length]}30`, overflow: "hidden" }}>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(110deg, transparent 12%, rgba(255,255,255,.22) 38%, transparent 62%)", transform: `translateX(${interpolate(frame, [0, 80], [-150, 240], { extrapolateRight: "clamp" })}%)` }} />
                </div>
                <div style={{ height: 56, paddingTop: 17, fontSize: 18, color: `${pal.text}b8`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{d.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
};

// ---------------- variant: line draw-on + area fill ----------------
const LineArea: React.FC<{ p: DataVizProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const data = dataOf(p);
  const values = data.map((d) => d.value);
  const hi = Math.max(...values) * 1.08;
  const lo = Math.min(0, Math.min(...values) * 0.82);
  const width = 1420;
  const height = 590;
  const line = pointsPath(values, width, height, hi, lo);
  const area = `${line} L${width},${height} L0,${height} Z`;
  const draw = clampInterp(frame, [10, 76], [0, 1]);
  return (
    <Panel pal={pal} style={{ height: "100%", padding: "30px 42px 22px" }}>
      <svg viewBox={`-30 -35 ${width + 60} ${height + 100}`} width="100%" height="100%" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="dataviz-line-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={pal.primary} stopOpacity="0.46" />
            <stop offset="100%" stopColor={pal.primary} stopOpacity="0.02" />
          </linearGradient>
          <clipPath id="dataviz-line-clip"><rect x="-20" y="-30" width={width * draw + 20} height={height + 60} /></clipPath>
          <filter id="dataviz-line-glow"><feGaussianBlur stdDeviation="9" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        {Array.from({ length: 5 }, (_, i) => <line key={i} x1="0" x2={width} y1={(i / 4) * height} y2={(i / 4) * height} stroke={`${pal.text}20`} strokeWidth="1" strokeDasharray="8 10" />)}
        <path d={area} fill="url(#dataviz-line-fill)" clipPath="url(#dataviz-line-clip)" opacity={clampInterp(frame, [24, 74], [0, 1])} />
        <path d={line} fill="none" stroke={pal.primary} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} filter="url(#dataviz-line-glow)" />
        {data.map((d, i) => {
          const x = data.length === 1 ? width / 2 : (i / (data.length - 1)) * width;
          const y = height - ((d.value - lo) / Math.max(1, hi - lo)) * height;
          const show = clampInterp(draw, [i / Math.max(1, data.length - 1) - 0.03, i / Math.max(1, data.length - 1) + 0.03], [0, 1]);
          return <g key={`${d.label}-${i}`} opacity={show}><circle cx={x} cy={y} r="11" fill={pal.bg} stroke={pal.secondary} strokeWidth="6" /><text x={x} y={height + 50} fill={`${pal.text}99`} fontSize="21" textAnchor="middle" fontFamily={FONT_STACK}>{d.label}</text></g>;
        })}
      </svg>
    </Panel>
  );
};

// ---------------- variant: donut sweep with center KPI ----------------
const DonutKpi: React.FC<{ p: DataVizProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const data = dataOf(p).filter((d) => d.value > 0);
  const total = Math.max(1, data.reduce((sum, d) => sum + d.value, 0));
  const progress = clampInterp(frame, [8, 70], [0, 1]);
  const radius = 205;
  const circumference = Math.PI * 2 * radius;
  const colors = paletteColors(pal);
  let offset = 0;
  return (
    <Panel pal={pal} style={{ height: "100%", display: "grid", gridTemplateColumns: "1.15fr 0.85fr", alignItems: "center", padding: "36px 70px" }}>
      <div style={{ position: "relative", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="570" height="570" viewBox="0 0 570 570" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="285" cy="285" r={radius} fill="none" stroke={`${pal.text}12`} strokeWidth="76" />
          {data.map((d, i) => {
            const segment = (d.value / total) * circumference;
            const start = offset;
            offset += segment;
            const visible = Math.max(0, segment * progress - 7);
            return <circle key={`${d.label}-${i}`} cx="285" cy="285" r={radius} fill="none" stroke={d.color ?? colors[i % colors.length]} strokeWidth="76" strokeLinecap="round" strokeDasharray={`${visible} ${circumference - visible}`} strokeDashoffset={-start * progress} />;
          })}
        </svg>
        <div style={{ position: "absolute", textAlign: "center" }}>
          <div style={{ fontFamily: MONO_STACK, fontSize: 68, fontWeight: 800, letterSpacing: "-0.06em" }}>{formatValue(total * progress, p, true)}</div>
          <div style={{ marginTop: 9, color: `${pal.text}87`, fontSize: 18, letterSpacing: "0.17em", textTransform: "uppercase" }}>Total</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 23 }}>
        {data.map((d, i) => (
          <div key={`${d.label}-${i}`} style={{ display: "grid", gridTemplateColumns: "18px 1fr auto", alignItems: "center", gap: 16, opacity: clampInterp(frame, [30 + i * 5, 42 + i * 5], [0, 1]), transform: `translateX(${clampInterp(frame, [30 + i * 5, 42 + i * 5], [22, 0])}px)` }}>
            <span style={{ width: 13, height: 13, borderRadius: 4, background: d.color ?? colors[i % colors.length] }} />
            <span style={{ color: `${pal.text}b8`, fontSize: 21 }}>{d.label}</span>
            <span style={{ fontFamily: MONO_STACK, fontSize: 23, fontWeight: 700 }}>{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </Panel>
  );
};

// ---------------- variant: ranked horizontal bars count-up ----------------
const RankedBars: React.FC<{ p: DataVizProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const data = [...dataOf(p)].sort((a, b) => b.value - a.value).slice(0, 7);
  const max = positiveMax(data.map((d) => d.value), p.maxValue);
  return (
    <Panel pal={pal} style={{ height: "100%", padding: "36px 62px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
      {data.map((d, i) => {
        const grow = spring({ frame: Math.max(0, frame - 7 - i * 5), fps, config: { damping: 18, stiffness: 95 } });
        return (
          <div key={`${d.label}-${i}`} style={{ display: "grid", gridTemplateColumns: "48px 185px 1fr 125px", gap: 22, alignItems: "center", opacity: grow }}>
            <span style={{ width: 38, height: 38, display: "grid", placeItems: "center", borderRadius: 12, color: i < 3 ? pal.bg : `${pal.text}99`, background: i < 3 ? [pal.accent, pal.primary, pal.secondary][i] : `${pal.text}10`, fontFamily: MONO_STACK, fontWeight: 800 }}>{i + 1}</span>
            <span style={{ fontSize: 20, fontWeight: 650, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.label}</span>
            <div style={{ height: 25, borderRadius: 999, background: `${pal.text}0c`, overflow: "hidden" }}>
              <div style={{ width: `${(d.value / max) * grow * 100}%`, height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${pal.primary}, ${i % 2 ? pal.secondary : pal.accent})`, boxShadow: `0 0 24px ${pal.primary}55` }} />
            </div>
            <span style={{ textAlign: "right", fontFamily: MONO_STACK, fontWeight: 750, fontSize: 24 }}>{formatValue(d.value * grow, p, true)}</span>
          </div>
        );
      })}
    </Panel>
  );
};

// ---------------- variant: stacked area layers ----------------
const StackedArea: React.FC<{ p: DataVizProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const labels = dataOf(p).map((d) => d.label);
  const sourceValues = dataOf(p).map((d) => d.value);
  const series = p.series?.length ? p.series : [
    { label: "Core", values: sourceValues.map((v) => v * 0.5) },
    { label: "Growth", values: sourceValues.map((v, i) => v * (0.24 + seededRand(i + 10) * 0.09)) },
    { label: "New", values: sourceValues.map((v, i) => v * (0.12 + seededRand(i + 30) * 0.08)) },
  ];
  const count = Math.max(2, labels.length);
  const width = 1400;
  const height = 560;
  const totals = Array.from({ length: count }, (_, i) => series.reduce((sum, s) => sum + Math.max(0, s.values[i] ?? 0), 0));
  const max = positiveMax(totals, p.maxValue) * 1.08;
  const colors = paletteColors(pal);
  const lower = Array.from({ length: count }, () => 0);
  const layers = series.map((s, si) => {
    const upper = lower.map((value, i) => value + Math.max(0, s.values[i] ?? 0));
    const topPoints = upper.map((value, i) => `${(i / (count - 1)) * width},${height - (value / max) * height}`);
    const bottomPoints = [...lower].reverse().map((value, ri) => {
      const i = count - 1 - ri;
      return `${(i / (count - 1)) * width},${height - (value / max) * height}`;
    });
    const path = `M${topPoints.join(" L")} L${bottomPoints.join(" L")} Z`;
    upper.forEach((value, i) => { lower[i] = value; });
    return { ...s, path, color: s.color ?? colors[si % colors.length] };
  });
  const reveal = clampInterp(frame, [10, 82], [0, 1]);
  return (
    <Panel pal={pal} style={{ height: "100%", padding: "38px 44px 22px", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 26, height: 34 }}>
        {layers.map((layer) => <div key={layer.label} style={{ display: "flex", alignItems: "center", gap: 9, color: `${pal.text}a8`, fontSize: 17 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: layer.color }} />{layer.label}</div>)}
      </div>
      <svg viewBox={`-20 -20 ${width + 40} ${height + 75}`} width="100%" height="100%">
        <defs><clipPath id="dataviz-stack-clip"><rect x="-5" y="-10" width={width * reveal + 5} height={height + 20} /></clipPath></defs>
        {Array.from({ length: 5 }, (_, i) => <line key={i} x1="0" x2={width} y1={(i / 4) * height} y2={(i / 4) * height} stroke={`${pal.text}18`} strokeDasharray="7 11" />)}
        <g clipPath="url(#dataviz-stack-clip)">
          {layers.map((layer, i) => <path key={layer.label} d={layer.path} fill={layer.color} opacity={0.72 + i * 0.07} stroke={`${pal.bg}77`} strokeWidth="3" />)}
        </g>
        {labels.map((label, i) => <text key={`${label}-${i}`} x={(i / Math.max(1, labels.length - 1)) * width} y={height + 47} textAnchor="middle" fill={`${pal.text}92`} fontFamily={FONT_STACK} fontSize="20">{label}</text>)}
      </svg>
    </Panel>
  );
};

// ---------------- variant: radial progress rings ----------------
const RadialRings: React.FC<{ p: DataVizProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const data = dataOf(p).slice(0, 4);
  const max = positiveMax(data.map((d) => d.value), p.maxValue ?? 100);
  const colors = paletteColors(pal);
  return (
    <Panel pal={pal} style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 46, padding: "48px" }}>
      {data.map((d, i) => {
        const progress = clampInterp(frame, [8 + i * 8, 64 + i * 8], [0, 1]);
        const ratio = Math.min(1, Math.max(0, d.value / max));
        const r = 112;
        const circumference = Math.PI * 2 * r;
        const color = d.color ?? colors[i % colors.length];
        return (
          <div key={`${d.label}-${i}`} style={{ width: 286, textAlign: "center", opacity: clampInterp(frame, [i * 7, i * 7 + 12], [0, 1]) }}>
            <div style={{ position: "relative", height: 275, display: "grid", placeItems: "center" }}>
              <svg width="275" height="275" viewBox="0 0 275 275" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="137.5" cy="137.5" r={r} fill="none" stroke={`${pal.text}12`} strokeWidth="20" />
                <circle cx="137.5" cy="137.5" r={r} fill="none" stroke={color} strokeWidth="20" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - ratio * progress)} style={{ filter: `drop-shadow(0 0 11px ${color}88)` }} />
              </svg>
              <div style={{ position: "absolute", fontFamily: MONO_STACK, fontSize: 45, fontWeight: 800 }}>{formatValue(d.value * progress, p, true)}</div>
            </div>
            <div style={{ fontSize: 19, fontWeight: 650, color: `${pal.text}b5`, letterSpacing: "0.02em" }}>{d.label}</div>
          </div>
        );
      })}
    </Panel>
  );
};

// ---------------- variant: KPI card delta arrow ----------------
const KpiDelta: React.FC<{ p: DataVizProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const data = dataOf(p);
  const current = data[data.length - 1];
  const previous = current.previous ?? (data.length > 1 ? data[data.length - 2].value : current.value * 0.88);
  const delta = current.delta ?? ((current.value - previous) / Math.max(1, Math.abs(previous))) * 100;
  const good = delta >= 0;
  const enter = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 15, stiffness: 105 } });
  const trendValues = data.map((d) => d.value);
  const path = pointsPath(trendValues, 700, 210);
  const draw = clampInterp(frame, [28, 88], [0, 1]);
  const accent = good ? pal.primary : pal.accent;
  return (
    <Panel pal={pal} style={{ height: "100%", display: "grid", gridTemplateColumns: "0.82fr 1.18fr", overflow: "hidden", transform: `scale(${interpolate(enter, [0, 1], [0.94, 1])})`, opacity: enter }}>
      <div style={{ padding: "76px 68px", display: "flex", flexDirection: "column", justifyContent: "center", borderRight: `1px solid ${pal.text}18` }}>
        <div style={{ color: `${pal.text}83`, fontSize: 18, textTransform: "uppercase", letterSpacing: "0.18em" }}>{current.label}</div>
        <div style={{ marginTop: 28, fontFamily: MONO_STACK, fontWeight: 850, fontSize: 82, letterSpacing: "-0.07em" }}>{formatValue(current.value * enter, p, true)}</div>
        <div style={{ marginTop: 32, display: "inline-flex", alignItems: "center", gap: 14, color: accent, fontSize: 25, fontWeight: 760 }}>
          <span style={{ width: 46, height: 46, display: "grid", placeItems: "center", borderRadius: 14, background: `${accent}20`, transform: `translateY(${interpolate(enter, [0, 1], [good ? 18 : -18, 0])}px) rotate(${good ? 0 : 180}deg)` }}>↗</span>
          {Math.abs(delta).toFixed(1)}%
        </div>
        <div style={{ marginTop: 14, color: `${pal.text}70`, fontSize: 17 }}>vs. previous period</div>
      </div>
      <div style={{ padding: "68px 74px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: `${pal.text}7d`, fontSize: 17 }}><span>Performance trend</span><span>{data[0]?.label} — {current.label}</span></div>
        <svg viewBox="-20 -25 740 270" width="100%" style={{ marginTop: 48, overflow: "visible" }}>
          {Array.from({ length: 4 }, (_, i) => <line key={i} x1="0" x2="700" y1={(i / 3) * 210} y2={(i / 3) * 210} stroke={`${pal.text}16`} strokeDasharray="7 10" />)}
          <path d={path} fill="none" stroke={accent} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} style={{ filter: `drop-shadow(0 0 10px ${accent}88)` }} />
        </svg>
      </div>
    </Panel>
  );
};

// ---------------- variant: dual-column comparison ----------------
const DualComparison: React.FC<{ p: DataVizProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const data = dataOf(p).slice(0, 6);
  const max = positiveMax(data.flatMap((d) => [d.value, d.secondary ?? 0]), p.maxValue);
  return (
    <Panel pal={pal} style={{ height: "100%", padding: "34px 56px 26px", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 44, display: "flex", justifyContent: "flex-end", gap: 30, color: `${pal.text}9b`, fontSize: 17 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 9 }}><i style={{ width: 13, height: 13, borderRadius: 4, background: pal.primary }} />{p.primaryLabel ?? "Current"}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 9 }}><i style={{ width: 13, height: 13, borderRadius: 4, background: pal.secondary }} />{p.secondaryLabel ?? "Previous"}</span>
      </div>
      <div style={{ flex: 1, position: "relative" }}>
        <ChartGrid pal={pal} />
        <div style={{ position: "absolute", inset: "10px 12px 0", display: "flex", gap: 42, alignItems: "flex-end" }}>
          {data.map((d, i) => {
            const grow = spring({ frame: Math.max(0, frame - 8 - i * 5), fps, config: { damping: 17, stiffness: 100 } });
            const secondary = d.secondary ?? d.previous ?? d.value * 0.82;
            return (
              <div key={`${d.label}-${i}`} style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", minWidth: 0 }}>
                <div style={{ flex: 1, display: "flex", gap: 10, alignItems: "flex-end", justifyContent: "center" }}>
                  <div style={{ width: "36%", maxWidth: 78, height: `${(d.value / max) * 100 * grow}%`, borderRadius: "13px 13px 3px 3px", background: `linear-gradient(${pal.primary}, ${pal.primary}88)`, position: "relative" }}><span style={{ position: "absolute", top: -34, width: "100%", textAlign: "center", fontFamily: MONO_STACK, fontSize: 15, opacity: grow }}>{formatValue(d.value * grow, p, true)}</span></div>
                  <div style={{ width: "36%", maxWidth: 78, height: `${(secondary / max) * 100 * grow}%`, borderRadius: "13px 13px 3px 3px", background: `linear-gradient(${pal.secondary}, ${pal.secondary}77)` }} />
                </div>
                <div style={{ height: 48, paddingTop: 15, textAlign: "center", color: `${pal.text}a0`, fontSize: 17, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
};

// ---------------- variant: sparkline grid dashboard ----------------
const SparklineDashboard: React.FC<{ p: DataVizProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const data = dataOf(p).slice(0, 6);
  const colors = paletteColors(pal);
  return (
    <div style={{ height: "100%", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(2, 1fr)", gap: 24 }}>
      {data.map((d, i) => {
        const enter = spring({ frame: Math.max(0, frame - 5 - i * 5), fps, config: { damping: 17, stiffness: 105 } });
        const values = d.values?.length ? d.values : Array.from({ length: 9 }, (_, j) => d.value * (0.72 + j * 0.035 + seededRand(i * 20 + j) * 0.12));
        const path = pointsPath(values, 380, 92);
        const delta = d.delta ?? ((values[values.length - 1] - values[0]) / Math.max(1, Math.abs(values[0]))) * 100;
        const color = d.color ?? colors[i % colors.length];
        const draw = clampInterp(frame, [18 + i * 4, 68 + i * 4], [0, 1]);
        return (
          <Panel key={`${d.label}-${i}`} pal={pal} style={{ padding: "27px 30px 22px", opacity: enter, transform: `translateY(${interpolate(enter, [0, 1], [28, 0])}px)`, overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: `${pal.text}9a`, fontSize: 17, fontWeight: 650 }}>{d.label}</span>
              <span style={{ color: delta >= 0 ? pal.primary : pal.accent, fontFamily: MONO_STACK, fontSize: 15 }}>{delta >= 0 ? "+" : ""}{delta.toFixed(1)}%</span>
            </div>
            <div style={{ marginTop: 14, fontFamily: MONO_STACK, fontSize: 36, fontWeight: 800, letterSpacing: "-0.05em" }}>{formatValue(d.value * enter, p, true)}</div>
            <svg viewBox="-5 -8 390 108" width="100%" height="96" style={{ marginTop: 8, overflow: "visible" }}>
              <path d={path} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} style={{ filter: `drop-shadow(0 0 7px ${color}66)` }} />
            </svg>
          </Panel>
        );
      })}
    </div>
  );
};

// ---------------- variant: gauge dial needle ----------------
const GaugeDial: React.FC<{ p: DataVizProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = dataOf(p)[0];
  const max = Math.max(1, p.maxValue ?? 100);
  const ratio = Math.min(1, Math.max(0, d.value / max));
  const move = spring({ frame: Math.max(0, frame - 12), fps, config: { damping: 13, stiffness: 75, mass: 1.1 } });
  const animatedRatio = ratio * move;
  const angle = -90 + animatedRatio * 180;
  const targetRatio = p.target === undefined ? undefined : Math.min(1, Math.max(0, p.target / max));
  return (
    <Panel pal={pal} style={{ height: "100%", display: "grid", placeItems: "center", overflow: "hidden" }}>
      <div style={{ width: "82%", height: "100%", position: "relative", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <svg viewBox="0 0 920 520" width="100%" height="92%" style={{ overflow: "visible" }}>
          <defs><linearGradient id="dataviz-gauge-gradient"><stop offset="0%" stopColor={pal.accent} /><stop offset="52%" stopColor={pal.secondary} /><stop offset="100%" stopColor={pal.primary} /></linearGradient></defs>
          <path d="M180 370 A280 280 0 0 1 740 370" pathLength={1} fill="none" stroke={`${pal.text}12`} strokeWidth="58" strokeLinecap="round" />
          <path d="M180 370 A280 280 0 0 1 740 370" pathLength={1} fill="none" stroke="url(#dataviz-gauge-gradient)" strokeWidth="58" strokeLinecap="round" strokeDasharray={`${animatedRatio} 1`} style={{ filter: `drop-shadow(0 0 14px ${pal.primary}55)` }} />
          {Array.from({ length: 11 }, (_, i) => {
            const a = Math.PI + (i / 10) * Math.PI;
            const x1 = 460 + Math.cos(a) * 232;
            const y1 = 370 + Math.sin(a) * 232;
            const x2 = 460 + Math.cos(a) * 247;
            const y2 = 370 + Math.sin(a) * 247;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={`${pal.bg}aa`} strokeWidth={i % 5 === 0 ? 5 : 3} strokeLinecap="round" />;
          })}
          {targetRatio !== undefined && <g transform={`rotate(${-90 + targetRatio * 180} 460 370)`}><path d="M448 78 L472 78 L460 108 Z" fill={pal.text} opacity="0.8" /></g>}
          <g transform={`rotate(${angle} 460 370)`}>
            <line x1="460" y1="390" x2="460" y2="142" stroke={pal.text} strokeWidth="12" strokeLinecap="round" style={{ filter: `drop-shadow(0 8px 8px ${pal.bg})` }} />
            <circle cx="460" cy="370" r="31" fill={pal.text} />
            <circle cx="460" cy="370" r="13" fill={pal.bg} />
          </g>
          <text x="180" y="452" fill={`${pal.text}72`} fontFamily={MONO_STACK} fontSize="20" textAnchor="middle">0</text>
          <text x="740" y="452" fill={`${pal.text}72`} fontFamily={MONO_STACK} fontSize="20" textAnchor="middle">{formatValue(max, p, true)}</text>
        </svg>
        <div style={{ position: "absolute", bottom: 44, textAlign: "center" }}>
          <div style={{ fontFamily: MONO_STACK, fontSize: 67, fontWeight: 850, letterSpacing: "-0.06em" }}>{formatValue(d.value * move, p, true)}</div>
          <div style={{ marginTop: 8, color: `${pal.text}82`, fontSize: 18, letterSpacing: "0.16em", textTransform: "uppercase" }}>{d.label}</div>
        </div>
      </div>
    </Panel>
  );
};

// ---------------- dispatcher ----------------
const VARIANTS: Record<DataVizVariant, React.FC<{ p: DataVizProps; pal: Palette }>> = {
  "bar-race": BarRace,
  "line-area": LineArea,
  "donut-kpi": DonutKpi,
  "ranked-bars": RankedBars,
  "stacked-area": StackedArea,
  "radial-rings": RadialRings,
  "kpi-delta": KpiDelta,
  "dual-comparison": DualComparison,
  "sparkline-dashboard": SparklineDashboard,
  "gauge-dial": GaugeDial,
};

export const DataVizTemplate: React.FC<DataVizProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? BarRace;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg }}>
      <GradientMeshBackground palette={pal} blobs={4} speed={0.28} />
      <AbsoluteFill style={{ opacity: 0.22, backgroundImage: `linear-gradient(${pal.text}0b 1px, transparent 1px), linear-gradient(90deg, ${pal.text}0b 1px, transparent 1px)`, backgroundSize: "64px 64px", maskImage: "linear-gradient(to bottom, transparent, black 35%, black)" }} />
      <FadeEdges inFrames={12} outFrames={14}>
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}>
          <ChartFrame p={props} pal={pal}><Variant p={props} pal={pal} /></ChartFrame>
        </div>
      </FadeEdges>
    </AbsoluteFill>
  );
};

const familyCast = (component: React.FC<DataVizProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "dataviz-bar-race": familyCast(DataVizTemplate),
  "dataviz-line-area": familyCast(DataVizTemplate),
  "dataviz-donut-kpi": familyCast(DataVizTemplate),
  "dataviz-ranked-bars": familyCast(DataVizTemplate),
  "dataviz-stacked-area": familyCast(DataVizTemplate),
  "dataviz-radial-rings": familyCast(DataVizTemplate),
  "dataviz-kpi-delta": familyCast(DataVizTemplate),
  "dataviz-dual-comparison": familyCast(DataVizTemplate),
  "dataviz-sparkline-dashboard": familyCast(DataVizTemplate),
  "dataviz-gauge-dial": familyCast(DataVizTemplate),
};
