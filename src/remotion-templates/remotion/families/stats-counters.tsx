import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  FadeEdges,
  easeOutExpo,
  resolvePalette,
  seededRand,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: stats-counters
 * Ten structurally distinct, deterministic count-up compositions.
 */

type StatsVariant =
  | "hero"
  | "grid"
  | "ticker"
  | "odometer"
  | "rings"
  | "timeline"
  | "delta"
  | "leaderboard"
  | "glass"
  | "parallax";

export interface StatsProps {
  variant: StatsVariant;
  label: string;
  value: number;
  paletteName: string;
  unit?: string;
  delta?: number;
}

const FONT_STACK = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
const MONO_STACK = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const expo = Easing.bezier(...easeOutExpo);

const countProgress = (frame: number, start = 8, end = 68): number =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: expo,
  });

const countTo = (frame: number, target: number, start = 8, end = 68): number =>
  target * countProgress(frame, start, end);

const trimDecimal = (n: number): string => n.toFixed(n >= 100 ? 0 : 1).replace(/\.0$/, "");
const formatComma = (n: number): string => Math.round(n).toLocaleString("en-US");
const formatCompact = (n: number): string => {
  const absolute = Math.abs(n);
  if (absolute >= 1_000_000_000) return `${trimDecimal(n / 1_000_000_000)}B`;
  if (absolute >= 1_000_000) return `${trimDecimal(n / 1_000_000)}M`;
  if (absolute >= 10_000) return `${trimDecimal(n / 1_000)}k`;
  return formatComma(n);
};

const Background: React.FC<{ pal: Palette; radial?: boolean }> = ({ pal, radial = false }) => (
  <AbsoluteFill
    style={{
      backgroundColor: pal.bg,
      backgroundImage: radial
        ? `radial-gradient(circle at 72% 28%, ${pal.primary}33, transparent 38%), radial-gradient(circle at 18% 86%, ${pal.accent}25, transparent 34%)`
        : `linear-gradient(135deg, ${pal.bg} 0%, ${pal.primary}18 56%, ${pal.bg} 100%)`,
    }}
  />
);

const Eyebrow: React.FC<{ children: React.ReactNode; pal: Palette }> = ({ children, pal }) => (
  <div
    style={{
      color: pal.secondary,
      fontFamily: FONT_STACK,
      fontSize: 24,
      fontWeight: 700,
      letterSpacing: "0.22em",
      textTransform: "uppercase",
    }}
  >
    {children}
  </div>
);

// ---------------- hero single KPI ----------------
const HeroKpi: React.FC<{ p: StatsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const progress = countProgress(frame);
  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 11%" }}>
      <div style={{ width: 110, height: 8, borderRadius: 99, background: pal.accent, transform: `scaleX(${progress})`, transformOrigin: "left" }} />
      <div style={{ marginTop: 34 }}><Eyebrow pal={pal}>{p.label}</Eyebrow></div>
      <div
        style={{
          color: pal.text,
          fontFamily: FONT_STACK,
          fontSize: Math.min(width * 0.18, 310),
          fontWeight: 850,
          letterSpacing: "-0.075em",
          lineHeight: 0.95,
          marginTop: 16,
          opacity: progress,
          transform: `translateY(${(1 - progress) * 54}px)`,
        }}
      >
        {formatComma(countTo(frame, p.value))}{p.unit ?? ""}
      </div>
      <div style={{ color: `${pal.text}88`, fontFamily: FONT_STACK, fontSize: 25, marginTop: 32 }}>
        LIVE PERFORMANCE · UPDATED NOW
      </div>
    </AbsoluteFill>
  );
};

// ---------------- 2x2 staggered grid ----------------
const GridKpis: React.FC<{ p: StatsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const metrics = [
    { label: p.label, value: p.value, accent: pal.primary },
    { label: "ACTIVE USERS", value: p.value * 0.62, accent: pal.secondary },
    { label: "CONVERSIONS", value: p.value * 0.31, accent: pal.accent },
    { label: "REPEAT RATE", value: p.value * 0.78, accent: pal.primary },
  ];
  return (
    <AbsoluteFill style={{ padding: "92px 120px", fontFamily: FONT_STACK }}>
      <div style={{ color: pal.text, fontSize: 42, fontWeight: 750, marginBottom: 38 }}>At a glance</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 22, flex: 1 }}>
        {metrics.map((metric, i) => {
          const progress = countProgress(frame, 8 + i * 8, 54 + i * 8);
          return (
            <div
              key={metric.label}
              style={{
                background: `${pal.text}09`,
                border: `1px solid ${pal.text}1d`,
                borderRadius: 24,
                padding: "38px 46px",
                opacity: progress,
                transform: `translateY(${(1 - progress) * 34}px)`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div style={{ width: 46, height: 5, borderRadius: 8, background: metric.accent }} />
              <div>
                <div style={{ color: pal.text, fontSize: 72, lineHeight: 1, fontWeight: 800 }}>{formatCompact(metric.value * progress)}</div>
                <div style={{ color: `${pal.text}83`, fontSize: 20, fontWeight: 650, letterSpacing: "0.14em", marginTop: 14 }}>{metric.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------- ticker-tape metric row ----------------
const TickerTape: React.FC<{ p: StatsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const metrics = [
    [p.label, p.value],
    ["SESSIONS", p.value * 1.42],
    ["ORDERS", p.value * 0.37],
    ["RETENTION", p.value * 0.82],
    ["REACH", p.value * 2.18],
  ] as const;
  const progress = countProgress(frame, 6, 62);
  const offset = (frame * 1.4) % 90;
  return (
    <AbsoluteFill style={{ justifyContent: "center", overflow: "hidden", fontFamily: FONT_STACK }}>
      <div style={{ position: "absolute", top: 78, left: 92, color: pal.text, fontSize: 34, fontWeight: 700 }}>Realtime metrics</div>
      <div style={{ position: "absolute", top: 92, right: 92, display: "flex", alignItems: "center", gap: 12, color: pal.secondary, fontSize: 18, letterSpacing: "0.16em" }}>
        <span style={{ width: 11, height: 11, borderRadius: "50%", background: pal.accent, boxShadow: `0 0 22px ${pal.accent}` }} /> LIVE
      </div>
      <div style={{ display: "flex", gap: 18, width: "max-content", transform: `translateX(${-offset - 40}px)` }}>
        {[...metrics, ...metrics].map(([label, value], i) => (
          <div key={`${label}-${i}`} style={{ width: 350, borderTop: `2px solid ${i % 3 === 0 ? pal.accent : pal.primary}`, borderBottom: `1px solid ${pal.text}22`, padding: "32px 30px 28px" }}>
            <div style={{ color: `${pal.text}83`, fontSize: 18, fontWeight: 700, letterSpacing: "0.15em" }}>{label}</div>
            <div style={{ color: pal.text, fontSize: 58, fontWeight: 760, marginTop: 15, fontVariantNumeric: "tabular-nums" }}>{formatCompact(value * progress)}</div>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", bottom: 102, left: 0, width: width * progress, height: 5, background: `linear-gradient(90deg, ${pal.primary}, ${pal.accent})` }} />
    </AbsoluteFill>
  );
};

// ---------------- odometer rolling digits ----------------
const RollingDigit: React.FC<{ digit: number; progress: number; color: string }> = ({ digit, progress, color }) => {
  const height = 168;
  const turns = 3;
  const stop = turns * 10 + digit;
  const position = stop * progress;
  const values = Array.from({ length: turns * 10 + 10 }, (_, i) => i % 10);
  return (
    <div style={{ width: 118, height, overflow: "hidden", position: "relative", borderRadius: 14, background: "#00000035" }}>
      <div style={{ transform: `translateY(${-position * height}px)` }}>
        {values.map((number, i) => (
          <div key={i} style={{ height, display: "flex", justifyContent: "center", alignItems: "center", color, fontFamily: MONO_STACK, fontSize: 132, fontWeight: 800, lineHeight: 1 }}>
            {number}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", inset: 0, border: `1px solid ${color}26`, borderRadius: 14, boxShadow: "inset 0 18px 24px #0008, inset 0 -18px 24px #0008" }} />
    </div>
  );
};

const Odometer: React.FC<{ p: StatsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const target = Math.max(0, Math.round(p.value)).toString();
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT_STACK }}>
      <Eyebrow pal={pal}>{p.label}</Eyebrow>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 44 }}>
        {target.split("").map((char, i) => {
          const remaining = target.length - i;
          const progress = countProgress(frame, 6 + i * 3, 68 + i * 3);
          return (
            <React.Fragment key={`${char}-${i}`}>
              <RollingDigit digit={Number(char)} progress={progress} color={pal.text} />
              {remaining > 1 && remaining % 3 === 1 ? <div style={{ color: pal.accent, fontSize: 86, alignSelf: "flex-end", marginBottom: 7 }}>‚</div> : null}
            </React.Fragment>
          );
        })}
      </div>
      <div style={{ marginTop: 40, color: `${pal.text}6f`, fontSize: 20, letterSpacing: "0.25em" }}>TOTAL AND COUNTING</div>
    </AbsoluteFill>
  );
};

// ---------------- percentage ring trio ----------------
const Ring: React.FC<{ label: string; target: number; progress: number; pal: Palette; index: number }> = ({ label, target, progress, pal, index }) => {
  const size = 280;
  const radius = 108;
  const circumference = Math.PI * 2 * radius;
  const color = [pal.primary, pal.secondary, pal.accent][index % 3];
  const shown = Math.min(100, Math.max(0, target)) * progress;
  return (
    <div style={{ width: 330, textAlign: "center", fontFamily: FONT_STACK }}>
      <div style={{ width: size, height: size, position: "relative", margin: "0 auto" }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={`${pal.text}16`} strokeWidth={20} />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={20} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - shown / 100)} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: pal.text, fontSize: 62, fontWeight: 800 }}>{Math.round(shown)}%</div>
      </div>
      <div style={{ color: `${pal.text}a0`, fontSize: 20, fontWeight: 700, letterSpacing: "0.13em", marginTop: 16 }}>{label}</div>
    </div>
  );
};

const RingTrio: React.FC<{ p: StatsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const rings = [
    [p.label, p.value],
    ["ENGAGEMENT", p.value * 0.86],
    ["COMPLETION", p.value * 0.72],
  ] as const;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ color: pal.text, fontFamily: FONT_STACK, fontSize: 42, fontWeight: 760, marginBottom: 78 }}>Performance mix</div>
      <div style={{ display: "flex", gap: 90 }}>
        {rings.map(([label, target], i) => <Ring key={label} label={label} target={target} progress={countProgress(frame, 8 + i * 7, 64 + i * 7)} pal={pal} index={i} />)}
      </div>
    </AbsoluteFill>
  );
};

// ---------------- milestone timeline counters ----------------
const MilestoneTimeline: React.FC<{ p: StatsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const milestones = [
    ["Q1", 0.22],
    ["Q2", 0.48],
    ["Q3", 0.73],
    ["NOW", 1],
  ] as const;
  const lineProgress = countProgress(frame, 5, 76);
  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 130px", fontFamily: FONT_STACK }}>
      <div style={{ color: pal.text, fontSize: 52, fontWeight: 780 }}>{p.label}</div>
      <div style={{ color: `${pal.text}72`, fontSize: 23, marginTop: 12 }}>Milestones over time</div>
      <div style={{ position: "relative", marginTop: 120, height: 280 }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 90, height: 4, borderRadius: 4, background: `${pal.text}18` }} />
        <div style={{ position: "absolute", left: 0, width: `${lineProgress * 100}%`, top: 90, height: 4, borderRadius: 4, background: `linear-gradient(90deg, ${pal.primary}, ${pal.accent})` }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {milestones.map(([period, ratio], i) => {
            const progress = countProgress(frame, 10 + i * 14, 52 + i * 14);
            return (
              <div key={period} style={{ width: 250, opacity: progress, transform: `translateY(${(1 - progress) * 26}px)` }}>
                <div style={{ color: pal.secondary, fontSize: 18, fontWeight: 750, letterSpacing: "0.18em" }}>{period}</div>
                <div style={{ color: pal.text, fontSize: 48, fontWeight: 800, marginTop: 14 }}>{formatCompact(p.value * ratio * progress)}</div>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: i === 3 ? pal.accent : pal.primary, border: `6px solid ${pal.bg}`, boxShadow: `0 0 0 2px ${pal.primary}`, marginTop: 28 }} />
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- big number + unit + delta chip ----------------
const DeltaMetric: React.FC<{ p: StatsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const progress = countProgress(frame);
  const delta = p.delta ?? 18.4;
  // Thumbnail/gate renders use a reduced composition width without automatically
  // scaling CSS pixels. Keep the panel and its large metric inside that viewport.
  const panelWidth = Math.min(1120, Math.max(0, width - 112));
  const panelPaddingX = Math.min(68, Math.max(24, width * 0.035));
  const panelPaddingY = Math.min(44, Math.max(28, width * 0.023));
  const borderWidth = Math.min(8, Math.max(4, width * 0.0042));
  const metricSize = Math.min(210, Math.max(96, width * 0.205));
  const unitSize = Math.min(48, Math.max(26, width * 0.045));
  const metricGap = Math.min(26, Math.max(10, width * 0.014));
  const deltaMargin = Math.min(52, Math.max(24, width * 0.027));
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT_STACK }}>
      <div style={{ width: panelWidth, boxSizing: "border-box", borderLeft: `${borderWidth}px solid ${pal.accent}`, padding: `${panelPaddingY}px ${panelPaddingX}px`, background: `linear-gradient(90deg, ${pal.text}0b, transparent)` }}>
        <Eyebrow pal={pal}>{p.label}</Eyebrow>
        <div style={{ display: "flex", alignItems: "flex-end", gap: metricGap, marginTop: 30, minWidth: 0 }}>
          <div style={{ color: pal.text, fontSize: metricSize, lineHeight: 0.88, fontWeight: 850, letterSpacing: "-0.065em", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{formatCompact(countTo(frame, p.value))}</div>
          <div style={{ color: `${pal.text}80`, fontSize: unitSize, fontWeight: 650, paddingBottom: Math.min(16, Math.max(8, width * 0.008)), whiteSpace: "nowrap" }}>{p.unit ?? "users"}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: Math.min(18, Math.max(10, width * 0.009)), marginTop: deltaMargin, minWidth: 0 }}>
          <div style={{ background: `${pal.primary}28`, color: pal.secondary, border: `1px solid ${pal.primary}66`, borderRadius: 999, padding: `${Math.min(12, Math.max(8, width * 0.006))}px ${Math.min(22, Math.max(14, width * 0.011))}px`, fontSize: Math.min(25, Math.max(16, width * 0.013)), fontWeight: 780, opacity: progress, whiteSpace: "nowrap" }}>↗ +{trimDecimal(delta * progress)}%</div>
          <div style={{ color: `${pal.text}70`, fontSize: Math.min(21, Math.max(14, width * 0.011)), whiteSpace: "nowrap" }}>versus previous period</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- vertical leaderboard ----------------
const Leaderboard: React.FC<{ p: StatsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const rows = [
    ["North", p.value, pal.accent],
    ["West", p.value * 0.88, pal.primary],
    ["Central", p.value * 0.71, pal.secondary],
    ["South", p.value * 0.57, pal.primary],
    ["East", p.value * 0.43, pal.secondary],
  ] as const;
  return (
    <AbsoluteFill style={{ padding: "78px 150px", fontFamily: FONT_STACK }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 42 }}>
        <div><div style={{ color: pal.text, fontSize: 48, fontWeight: 800 }}>Leaderboard</div><div style={{ color: `${pal.text}70`, fontSize: 20, marginTop: 8 }}>{p.label} by region</div></div>
        <div style={{ color: pal.secondary, fontSize: 18, letterSpacing: "0.18em" }}>TOP 5</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        {rows.map(([name, value, color], i) => {
          const progress = countProgress(frame, 8 + i * 7, 55 + i * 7);
          return (
            <div key={name} style={{ display: "grid", gridTemplateColumns: "70px 190px 1fr 150px", alignItems: "center", gap: 25, height: 125, opacity: progress }}>
              <div style={{ color: i === 0 ? pal.accent : `${pal.text}68`, fontSize: 27, fontWeight: 800 }}>0{i + 1}</div>
              <div style={{ color: pal.text, fontSize: 29, fontWeight: 690 }}>{name}</div>
              <div style={{ height: 18, borderRadius: 99, background: `${pal.text}12`, overflow: "hidden" }}><div style={{ width: `${(value / p.value) * progress * 100}%`, height: "100%", borderRadius: 99, background: color }} /></div>
              <div style={{ textAlign: "right", color: pal.text, fontSize: 34, fontWeight: 780, fontVariantNumeric: "tabular-nums" }}>{formatCompact(value * progress)}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------- glass cards row ----------------
const GlassCards: React.FC<{ p: StatsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const cards = [
    [p.label, p.value, "01"],
    ["Weekly active", p.value * 0.68, "02"],
    ["Net growth", p.value * 0.24, "03"],
  ] as const;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT_STACK }}>
      <div style={{ position: "absolute", width: 520, height: 520, borderRadius: "50%", background: pal.primary, filter: "blur(120px)", opacity: 0.24, left: 180, top: 180 }} />
      <div style={{ position: "absolute", width: 430, height: 430, borderRadius: "50%", background: pal.accent, filter: "blur(120px)", opacity: 0.2, right: 180, bottom: 120 }} />
      <div style={{ color: pal.text, fontSize: 43, fontWeight: 760, marginBottom: 64, zIndex: 1 }}>Signal board</div>
      <div style={{ display: "flex", gap: 30, zIndex: 1 }}>
        {cards.map(([label, value, index], i) => {
          const progress = countProgress(frame, 7 + i * 8, 60 + i * 8);
          return (
            <div key={label} style={{ width: 450, height: 370, boxSizing: "border-box", padding: "38px 42px", borderRadius: 30, background: `${pal.text}0d`, border: `1px solid ${pal.text}28`, boxShadow: "0 30px 70px #0005", backdropFilter: "blur(26px)", opacity: progress, transform: `translateY(${(1 - progress) * 60}px)` }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: `${pal.text}6e`, fontSize: 18, letterSpacing: "0.14em" }}><span>{label.toUpperCase()}</span><span>{index}</span></div>
              <div style={{ color: pal.text, fontSize: 88, fontWeight: 820, letterSpacing: "-0.05em", marginTop: 102 }}>{formatCompact(value * progress)}</div>
              <div style={{ color: i === 2 ? pal.accent : pal.secondary, fontSize: 19, fontWeight: 700, marginTop: 18 }}>+{trimDecimal((8 + i * 5.2) * progress)}% ↗</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------- full-screen metric with background parallax ----------------
const ParallaxMetric: React.FC<{ p: StatsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const progress = countProgress(frame, 8, 72);
  const layers = Array.from({ length: 16 }, (_, i) => ({
    x: seededRand(i * 3 + 1) * 100,
    y: seededRand(i * 3 + 2) * 100,
    size: 90 + seededRand(i * 3 + 3) * 280,
  }));
  return (
    <AbsoluteFill style={{ overflow: "hidden", justifyContent: "center", alignItems: "center", fontFamily: FONT_STACK }}>
      {layers.map((layer, i) => {
        const depth = 0.25 + (i % 5) * 0.18;
        return <div key={i} style={{ position: "absolute", left: `${layer.x}%`, top: `${layer.y}%`, width: layer.size, height: layer.size, borderRadius: i % 2 ? "50%" : 38, border: `1px solid ${i % 3 === 0 ? pal.accent : pal.primary}35`, background: `${i % 3 === 0 ? pal.accent : pal.primary}0c`, transform: `translate(-50%, -50%) translate(${Math.sin(frame * 0.018 + i) * 80 * depth}px, ${Math.cos(frame * 0.014 + i) * 60 * depth}px) rotate(${frame * depth * 0.08}deg)` }} />;
      })}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle, transparent 12%, ${pal.bg}55 62%, ${pal.bg} 100%)` }} />
      <div style={{ zIndex: 1, textAlign: "center", transform: `scale(${0.9 + progress * 0.1})` }}>
        <Eyebrow pal={pal}>{p.label}</Eyebrow>
        <div style={{ color: pal.text, fontSize: Math.min(width * 0.22, 390), lineHeight: 1, fontWeight: 900, letterSpacing: "-0.08em", textShadow: `0 28px 90px ${pal.bg}`, marginTop: 22 }}>{formatCompact(countTo(frame, p.value, 8, 72))}{p.unit ?? ""}</div>
        <div style={{ width: 320 * progress, height: 5, borderRadius: 99, background: `linear-gradient(90deg, ${pal.primary}, ${pal.accent})`, margin: "42px auto 0" }} />
      </div>
    </AbsoluteFill>
  );
};

const VARIANTS: Record<StatsVariant, React.FC<{ p: StatsProps; pal: Palette }>> = {
  hero: HeroKpi,
  grid: GridKpis,
  ticker: TickerTape,
  odometer: Odometer,
  rings: RingTrio,
  timeline: MilestoneTimeline,
  delta: DeltaMetric,
  leaderboard: Leaderboard,
  glass: GlassCards,
  parallax: ParallaxMetric,
};

export const StatsCountersTemplate: React.FC<StatsProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? HeroKpi;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return (
    <AbsoluteFill>
      <Background pal={pal} radial={props.variant === "glass" || props.variant === "parallax"} />
      <FadeEdges>
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><Variant p={props} pal={pal} /></div>
      </FadeEdges>
    </AbsoluteFill>
  );
};

const familyCast = (component: React.FC<StatsProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "stats-hero-single-kpi": familyCast(StatsCountersTemplate),
  "stats-staggered-grid": familyCast(StatsCountersTemplate),
  "stats-ticker-tape-row": familyCast(StatsCountersTemplate),
  "stats-odometer-rolling": familyCast(StatsCountersTemplate),
  "stats-percentage-ring-trio": familyCast(StatsCountersTemplate),
  "stats-milestone-timeline": familyCast(StatsCountersTemplate),
  "stats-number-unit-delta": familyCast(StatsCountersTemplate),
  "stats-vertical-leaderboard": familyCast(StatsCountersTemplate),
  "stats-glass-cards-row": familyCast(StatsCountersTemplate),
  "stats-parallax-single-metric": familyCast(StatsCountersTemplate),
};
