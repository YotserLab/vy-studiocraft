import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, clampInterp, resolvePalette, type Palette } from "../lib/primitives";

/**
 * FAMILY: traffic-updates
 * Neutral, asset-free traffic and route graphics for broadcast, logistics, and commute stories.
 */
export type TrafficVariant =
  | "route-status"
  | "incident-card"
  | "eta-update"
  | "closure-alert"
  | "commute-map"
  | "speed-bars"
  | "before-after-route"
  | "detour-flow"
  | "traffic-recap"
  | "all-clear";

export interface TrafficPoint {
  x: number;
  y: number;
  label?: string;
}

export interface TrafficUpdatesProps {
  variant: TrafficVariant;
  headline: string;
  subheadline: string;
  label: string;
  paletteName: string;
  routes?: string[];
  incidents?: string[];
  eta?: string;
  locations?: string[];
  severity?: string;
  timestamp?: string;
  mapShape?: "grid" | "ring" | "coast";
  routePoints?: TrafficPoint[];
  colors?: string[];
  speed?: number;
  showLabels?: boolean;
}

const FONT = 'Arial, "Helvetica Neue", Helvetica, sans-serif';
const CONDENSED = '"Arial Narrow", "Helvetica Neue", Arial, sans-serif';
const DEFAULT_POINTS: TrafficPoint[] = [
  { x: 10, y: 74, label: "WEST" },
  { x: 29, y: 62, label: "A" },
  { x: 49, y: 52, label: "B" },
  { x: 69, y: 35, label: "C" },
  { x: 91, y: 21, label: "EAST" },
];

const split = (value: string): string[] => value.split("|").map((part) => part.trim());
const pct = (value: number): string => `${Math.max(0, Math.min(100, value))}%`;
const severityColor = (pal: Palette, severity = "moderate"): string => {
  const tone = severity.toLowerCase();
  if (tone.includes("clear") || tone.includes("low")) return "#22c55e";
  if (tone.includes("high") || tone.includes("critical") || tone.includes("closed")) return "#ef4444";
  return pal.accent || "#f59e0b";
};

const TrafficBackdrop: React.FC<{ pal: Palette; light?: boolean }> = ({ pal, light = false }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: light ? "#f2f5f7" : pal.bg, color: light ? "#13202b" : pal.text }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: light
            ? `radial-gradient(circle at 82% 8%, ${pal.secondary}2b, transparent 34%), linear-gradient(145deg, #ffffff, #e7edf1)`
            : `radial-gradient(circle at 78% 16%, ${pal.primary}35, transparent 35%), linear-gradient(135deg, ${pal.bg}, #03070c)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "-20% -10%",
          opacity: light ? 0.1 : 0.16,
          backgroundImage: `linear-gradient(90deg, ${light ? "#102033" : pal.text} 1px, transparent 1px), linear-gradient(${light ? "#102033" : pal.text} 1px, transparent 1px)`,
          backgroundSize: "92px 92px",
          transform: `translate(${-(frame % 92)}px, ${-(frame % 92)}px) rotate(-8deg)`,
        }}
      />
    </AbsoluteFill>
  );
};

const TrafficMap: React.FC<{
  pal: Palette;
  points: TrafficPoint[];
  severity?: string;
  progress?: number;
  showLabels?: boolean;
  compact?: boolean;
  blocked?: boolean;
  detour?: boolean;
  light?: boolean;
}> = ({ pal, points, severity, progress = 1, showLabels = true, compact = false, blocked = false, detour = false, light = false }) => {
  const frame = useCurrentFrame();
  const route = points.map((point) => `${point.x},${point.y}`).join(" ");
  const signal = severityColor(pal, severity);
  const mapText = light ? "#1f3344" : pal.text;
  const road = light ? "#77869355" : `${pal.text}2b`;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" style={{ overflow: "visible" }}>
      <g opacity={light ? 0.55 : 0.35} stroke={road} fill="none" strokeWidth={compact ? 0.7 : 1.1}>
        <path d="M0 16 C20 23 35 7 55 18 S81 14 100 5" />
        <path d="M-3 87 C22 71 35 85 54 69 S80 73 103 57" />
        <path d="M18 -5 C25 17 17 34 31 52 S29 82 39 105" />
        <path d="M78 -5 C67 21 81 36 66 53 S76 84 63 105" />
        <path d="M2 47 C27 39 39 57 56 43 S79 38 103 47" />
      </g>
      <g opacity={light ? 0.22 : 0.13} stroke={mapText} fill="none" strokeWidth="0.35">
        {Array.from({ length: 8 }, (_, i) => <path key={`cross-${i}`} d={`M${i * 15 - 10} 0 L${i * 15 + 35} 100`} />)}
      </g>
      <polyline points={route} fill="none" stroke="#00000055" strokeWidth={compact ? 4 : 6} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={route} fill="none" stroke={blocked ? "#ef4444" : detour ? "#22c55e" : signal} strokeWidth={compact ? 2.1 : 3.1} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={blocked ? "5 3" : undefined} pathLength={100} strokeDashoffset={100 - progress * 100} />
      {blocked && <line x1={points[Math.max(0, Math.floor(points.length / 2) - 1)]?.x ?? 48} y1={points[Math.max(0, Math.floor(points.length / 2) - 1)]?.y ?? 48} x2={points[Math.min(points.length - 1, Math.floor(points.length / 2) + 1)]?.x ?? 63} y2={points[Math.min(points.length - 1, Math.floor(points.length / 2) + 1)]?.y ?? 37} stroke="#fff" strokeWidth="1.2" />}
      {points.map((point, i) => {
        const pulse = 1 + Math.sin(frame * 0.08 + i) * 0.12;
        return (
          <g key={`${point.x}-${point.y}-${i}`}>
            <circle cx={point.x} cy={point.y} r={(compact ? 2 : 2.8) * pulse} fill={light ? "#fff" : pal.bg} stroke={detour ? "#22c55e" : signal} strokeWidth="1" />
            {showLabels && point.label && <text x={point.x} y={point.y - 4.5} fill={mapText} fontSize={compact ? 3.4 : 4.2} fontFamily={FONT} fontWeight="700" textAnchor="middle" letterSpacing="0.08em">{point.label}</text>}
          </g>
        );
      })}
      {detour && <polyline points={points.map((point, i) => `${point.x + (i % 2 ? 1.5 : -1.5)},${point.y + (i % 2 ? 7 : -7)}`).join(" ")} fill="none" stroke="#22c55e" strokeWidth="1.4" strokeDasharray="2 2" />}
    </svg>
  );
};

const Header: React.FC<{ pal: Palette; label: string; timestamp?: string; light?: boolean }> = ({ pal, label, timestamp, light = false }) => (
  <div style={{ position: "absolute", left: 70, right: 70, top: 52, display: "flex", justifyContent: "space-between", alignItems: "center", color: light ? "#14222d" : pal.text }}>
    <div style={{ display: "flex", alignItems: "center", gap: 16, font: `900 21px ${FONT}`, letterSpacing: "0.22em", textTransform: "uppercase" }}><span style={{ width: 12, height: 12, borderRadius: "50%", background: pal.accent, boxShadow: `0 0 22px ${pal.accent}` }} />{label}</div>
    <div style={{ font: `600 19px ${FONT}`, color: light ? "#536575" : `${pal.text}99`, letterSpacing: "0.12em" }}>{timestamp ?? "LIVE · 08:42"}</div>
  </div>
);

const Card: React.FC<{ children: React.ReactNode; pal: Palette; light?: boolean; style?: React.CSSProperties }> = ({ children, pal, light = false, style }) => (
  <div style={{ background: light ? "#ffffffdd" : `${pal.bg}d9`, border: `1px solid ${light ? "#132b3a22" : `${pal.text}22`}`, boxShadow: light ? "0 24px 70px #20384618" : "0 24px 70px #0000003a", ...style }}>{children}</div>
);

const RouteStatus: React.FC<{ p: TrafficUpdatesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const points = p.routePoints?.length ? p.routePoints : DEFAULT_POINTS;
  const route = p.routes?.[0] ? split(p.routes[0]) : ["A1", "Downtown", "moderate", "18 min"];
  const progress = clampInterp(frame, [5, 35], [0, 1]);
  return <AbsoluteFill><TrafficBackdrop pal={pal} /><Header pal={pal} label={p.label} timestamp={p.timestamp} /><div style={{ position: "absolute", left: "5%", top: "18%", width: "48%", height: "64%" }}><TrafficMap pal={pal} points={points} severity={p.severity ?? route[2]} progress={progress} showLabels={p.showLabels} /></div><Card pal={pal} style={{ position: "absolute", right: "5%", top: "23%", width: "36%", minHeight: "40%", padding: "3%", boxSizing: "border-box", color: pal.text, transform: `translateY(${interpolate(progress, [0, 1], [90, 0])}px)`, opacity: progress }}><div style={{ color: severityColor(pal, p.severity ?? route[2]), font: `900 clamp(12px, 1.35vw, 22px) ${FONT}`, letterSpacing: "0.14em", textTransform: "uppercase" }}>{route[2] ?? "MODERATE"} ROUTE STATUS</div><div style={{ marginTop: "4%", font: `900 clamp(34px, 5vw, 62px)/1 ${CONDENSED}`, letterSpacing: "-0.03em" }}>{route[0]}</div><div style={{ marginTop: "4%", font: `500 clamp(16px, 2vw, 28px) ${FONT}`, color: `${pal.text}aa` }}>{route[1] ?? p.headline}</div><div style={{ marginTop: "7%", display: "flex", gap: "5%", justifyContent: "space-between", borderTop: `1px solid ${pal.text}22`, paddingTop: "5%" }}><span style={{ font: `700 clamp(15px, 1.6vw, 22px) ${FONT}`, whiteSpace: "nowrap" }}>{route[3] ?? p.eta ?? "18 min"}</span><span style={{ color: pal.secondary, font: `700 clamp(11px, 1.25vw, 18px) ${FONT}`, textAlign: "right" }}>{p.subheadline}</span></div></Card><div style={{ position: "absolute", left: "5%", right: "5%", bottom: "4%", font: `500 clamp(12px, 1.4vw, 20px) ${FONT}`, color: `${pal.text}77`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.headline}</div></AbsoluteFill>;
};

const IncidentCard: React.FC<{ p: TrafficUpdatesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const reveal = clampInterp(frame, [5, 27], [0, 1]);
  const incident = p.incidents?.[0] ? split(p.incidents[0]) : ["INCIDENT", p.headline, "moderate", "Junction B"];
  return <AbsoluteFill><TrafficBackdrop pal={pal} light /><Header pal={pal} label={p.label} timestamp={p.timestamp} light /><div style={{ position: "absolute", left: "6%", right: "6%", top: "21%", height: "62%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4%", alignItems: "stretch" }}><Card pal={pal} light style={{ minWidth: 0, padding: "5%", boxSizing: "border-box", borderTop: `10px solid ${severityColor(pal, p.severity ?? incident[2])}`, transform: `translateX(${(1 - reveal) * -90}px)`, opacity: reveal }}><div style={{ color: severityColor(pal, p.severity ?? incident[2]), font: `900 clamp(12px, 1.5vw, 22px) ${FONT}`, letterSpacing: "0.14em", textTransform: "uppercase" }}>{incident[0] ?? "INCIDENT"}</div><div style={{ marginTop: "5%", font: `900 clamp(28px, 4.5vw, 67px)/0.98 ${CONDENSED}`, color: "#13202b", overflowWrap: "anywhere" }}>{incident[1] ?? p.headline}</div><div style={{ marginTop: "6%", font: `600 clamp(15px, 1.8vw, 27px) ${FONT}`, color: "#586a76" }}>{incident[3] ?? p.locations?.[0] ?? "Junction B"}</div><div style={{ marginTop: "7%", font: `500 clamp(14px, 1.65vw, 25px)/1.3 ${FONT}`, color: "#344855" }}>{p.subheadline}</div></Card><div style={{ minWidth: 0, height: "100%", padding: "3%", boxSizing: "border-box", background: "#e3ebee", borderRadius: 16, opacity: reveal }}><TrafficMap pal={pal} points={p.routePoints?.length ? p.routePoints : DEFAULT_POINTS} severity={p.severity ?? incident[2]} progress={reveal} showLabels={p.showLabels} light /></div></div></AbsoluteFill>;
};

const EtaUpdate: React.FC<{ p: TrafficUpdatesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const t = clampInterp(frame, [8, 42], [0, 1]);
  return <AbsoluteFill><TrafficBackdrop pal={pal} /><Header pal={pal} label={p.label} timestamp={p.timestamp} /><div style={{ position: "absolute", left: "6%", top: "20%", width: "36%", color: pal.text }}><div style={{ font: `900 clamp(12px, 1.5vw, 23px) ${FONT}`, color: pal.secondary, letterSpacing: "0.16em", textTransform: "uppercase" }}>{p.subheadline}</div><div style={{ marginTop: "5%", font: `900 clamp(64px, 10vw, 180px)/0.85 ${CONDENSED}`, letterSpacing: "-0.06em", color: severityColor(pal, p.severity), whiteSpace: "nowrap" }}>{p.eta ?? "18 min"}</div><div style={{ marginTop: "5%", font: `500 clamp(16px, 2.1vw, 32px) ${FONT}`, color: `${pal.text}aa` }}>{p.headline}</div><div style={{ marginTop: "10%", height: 10, background: `${pal.text}1c`, overflow: "hidden" }}><div style={{ height: "100%", width: pct(t * 78), background: severityColor(pal, p.severity) }} /></div></div><div style={{ position: "absolute", right: "5%", top: "20%", width: "45%", height: "60%", transform: `scale(${0.92 + t * 0.08})`, opacity: t }}><TrafficMap pal={pal} points={p.routePoints?.length ? p.routePoints : DEFAULT_POINTS} severity={p.severity} progress={t} showLabels={p.showLabels} /></div></AbsoluteFill>;
};

const ClosureAlert: React.FC<{ p: TrafficUpdatesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const reveal = clampInterp(frame, [0, 20], [0, 1]);
  return <AbsoluteFill><TrafficBackdrop pal={pal} /><Header pal={pal} label={p.label} timestamp={p.timestamp} /><div style={{ position: "absolute", left: "5%", right: "5%", top: "20%", bottom: "6%" }}><div style={{ height: "47%", padding: "3%", boxSizing: "border-box", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: "4%", background: "#270d13", border: `2px solid #ef444455`, color: "#fff", transform: `translateY(${(1 - reveal) * -60}px)`, opacity: reveal }}><div style={{ minWidth: 0 }}><div style={{ font: `900 clamp(12px, 1.5vw, 24px) ${FONT}`, color: "#ef4444", letterSpacing: "0.16em", textTransform: "uppercase" }}>⛔ {p.severity ?? "ROAD CLOSED"}</div><div style={{ marginTop: "4%", font: `900 clamp(32px, 5vw, 82px)/0.95 ${CONDENSED}`, textTransform: "uppercase", overflowWrap: "anywhere" }}>{p.headline}</div><div style={{ marginTop: "4%", font: `500 clamp(14px, 1.8vw, 28px) ${FONT}`, color: "#ffd6d6" }}>{p.subheadline}</div></div><div style={{ minWidth: 0, borderLeft: "1px solid #fff3", paddingLeft: "6%", font: `600 clamp(14px, 1.7vw, 27px)/1.35 ${FONT}`, overflow: "hidden" }}><div style={{ color: "#ff9b9b", font: `900 clamp(11px, 1.2vw, 18px) ${FONT}`, letterSpacing: "0.14em" }}>PLAN AHEAD</div><div style={{ marginTop: "5%", overflowWrap: "anywhere" }}>{p.incidents?.[0] ?? "Use the signed detour and expect additional travel time."}</div></div></div><div style={{ marginTop: "3%", height: "39%", background: "#111820", padding: "2%", boxSizing: "border-box" }}><TrafficMap pal={pal} points={p.routePoints?.length ? p.routePoints : DEFAULT_POINTS} severity="closed" progress={reveal} showLabels={p.showLabels} blocked /></div></div></AbsoluteFill>;
};

const CommuteMap: React.FC<{ p: TrafficUpdatesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const rows = p.routes?.length ? p.routes : ["North Loop|24 min|moderate", "River Road|31 min|high", "Airport Way|18 min|low", "Market Street|26 min|moderate"];
  const reveal = clampInterp(frame, [5, 38], [0, 1]);
  return <AbsoluteFill><TrafficBackdrop pal={pal} light /><Header pal={pal} label={p.label} timestamp={p.timestamp} light /><div style={{ position: "absolute", left: 85, right: 85, top: 175, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 58 }}><div style={{ height: 700, padding: 22, background: "#e7eef1" }}><TrafficMap pal={pal} points={p.routePoints?.length ? p.routePoints : DEFAULT_POINTS} severity={p.severity} progress={reveal} showLabels={p.showLabels} light /></div><div style={{ paddingTop: 10 }}><div style={{ font: `900 66px/1 ${CONDENSED}`, color: "#14242e" }}>{p.headline}</div><div style={{ marginTop: 18, font: `500 25px ${FONT}`, color: "#60717d" }}>{p.subheadline}</div><div style={{ marginTop: 44 }}>{rows.slice(0, 5).map((row, i) => { const fields = split(row); const color = severityColor(pal, fields[2]); const q = clampInterp(frame, [12 + i * 7, 27 + i * 7], [0, 1]); return <div key={`${row}-${i}`} style={{ display: "grid", gridTemplateColumns: "1fr 130px 12px", alignItems: "center", gap: 18, padding: "19px 0", borderBottom: "1px solid #19304022", opacity: q, transform: `translateX(${(1 - q) * 70}px)` }}><span style={{ font: `700 25px ${FONT}`, color: "#1f3440" }}>{fields[0]}</span><span style={{ font: `900 28px ${FONT}`, textAlign: "right", color }}>{fields[1]}</span><i style={{ width: 12, height: 12, borderRadius: "50%", background: color }} /></div>; })}</div></div></div></AbsoluteFill>;
};

const SpeedBars: React.FC<{ p: TrafficUpdatesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const rows = p.routes?.length ? p.routes : ["North Loop|42", "River Road|26", "Airport Way|58", "Market Street|34", "Harbor Tunnel|17"];
  return <AbsoluteFill><TrafficBackdrop pal={pal} /><Header pal={pal} label={p.label} timestamp={p.timestamp} /><div style={{ position: "absolute", left: "8%", right: "8%", top: "20%", color: pal.text }}><div style={{ font: `900 clamp(34px, 6vw, 72px) ${CONDENSED}`, textTransform: "uppercase", lineHeight: 1 }}>{p.headline}</div><div style={{ marginTop: "2%", font: `500 clamp(14px, 2vw, 25px) ${FONT}`, color: `${pal.text}99` }}>{p.subheadline}</div><div style={{ marginTop: "7%" }}>{rows.slice(0, 6).map((row, i) => { const fields = split(row); const speed = Math.max(0, Math.min(100, Number(fields[1]) || 0)); const q = clampInterp(frame, [8 + i * 4, 28 + i * 4], [0, speed]); const color = speed < 30 ? "#ef4444" : speed < 50 ? pal.accent : "#22c55e"; return <div key={`${row}-${i}`} style={{ display: "grid", gridTemplateColumns: "28% 1fr 15%", gap: "3%", alignItems: "center", marginBottom: "4%", opacity: clampInterp(frame, [2 + i * 4, 15 + i * 4], [0, 1]) }}><span style={{ font: `700 clamp(13px, 1.8vw, 27px) ${FONT}`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fields[0]}</span><div style={{ height: 16, background: `${pal.text}17`, borderRadius: 20, overflow: "hidden" }}><div style={{ height: "100%", width: pct(q), background: color, borderRadius: 20 }} /></div><span style={{ font: `900 clamp(15px, 2vw, 31px) ${FONT}`, color, textAlign: "right", whiteSpace: "nowrap" }}>{speed} <small style={{ fontSize: "0.5em" }}>MPH</small></span></div>; })}</div></div></AbsoluteFill>;
};

const BeforeAfterRoute: React.FC<{ p: TrafficUpdatesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const reveal = clampInterp(frame, [5, 32], [0, 1]);
  const points = p.routePoints?.length ? p.routePoints : DEFAULT_POINTS;
  return <AbsoluteFill><TrafficBackdrop pal={pal} light /><Header pal={pal} label={p.label} timestamp={p.timestamp} light /><div style={{ position: "absolute", left: 82, right: 82, top: 180, bottom: 65, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}><div style={{ position: "relative", padding: 22, background: "#e7edf0" }}><div style={{ position: "absolute", left: 38, top: 30, zIndex: 2, padding: "11px 16px", background: "#667783", color: "white", font: `900 17px ${FONT}`, letterSpacing: "0.18em" }}>BEFORE</div><TrafficMap pal={pal} points={points} severity="high" progress={reveal} showLabels={p.showLabels} light /></div><div style={{ position: "relative", padding: 22, background: "#e7f4ea" }}><div style={{ position: "absolute", left: 38, top: 30, zIndex: 2, padding: "11px 16px", background: "#22c55e", color: "white", font: `900 17px ${FONT}`, letterSpacing: "0.18em" }}>AFTER</div><TrafficMap pal={pal} points={points} severity="low" progress={reveal} showLabels={p.showLabels} light detour /></div></div></AbsoluteFill>;
};

const DetourFlow: React.FC<{ p: TrafficUpdatesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const t = clampInterp(frame, [8, 40], [0, 1]);
  return <AbsoluteFill><TrafficBackdrop pal={pal} /><Header pal={pal} label={p.label} timestamp={p.timestamp} /><div style={{ position: "absolute", left: 100, right: 100, top: 175, bottom: 80, display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: 50, alignItems: "center" }}><div style={{ color: pal.text }}><div style={{ color: "#22c55e", font: `900 21px ${FONT}`, letterSpacing: "0.2em" }}>DETOUR ACTIVE</div><div style={{ marginTop: 24, font: `900 80px/0.94 ${CONDENSED}` }}>{p.headline}</div><div style={{ marginTop: 30, font: `500 28px/1.4 ${FONT}`, color: `${pal.text}aa` }}>{p.subheadline}</div><div style={{ marginTop: 48, padding: 22, borderLeft: "5px solid #22c55e", background: `${pal.text}0b`, font: `700 23px ${FONT}` }}>{p.eta ?? "Add 7 minutes via alternate route"}</div></div><div style={{ height: 650, transform: `scale(${0.9 + t * 0.1})`, opacity: t }}><TrafficMap pal={pal} points={p.routePoints?.length ? p.routePoints : DEFAULT_POINTS} severity={p.severity} progress={t} showLabels={p.showLabels} detour /></div></div></AbsoluteFill>;
};

const TrafficRecap: React.FC<{ p: TrafficUpdatesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const rows = p.routes?.length ? p.routes : ["AM peak|42 min|moderate", "Midday|18 min|low", "PM peak|51 min|high"];
  const t = clampInterp(frame, [4, 28], [0, 1]);
  return <AbsoluteFill><TrafficBackdrop pal={pal} /><Header pal={pal} label={p.label} timestamp={p.timestamp} /><div style={{ position: "absolute", left: "6%", right: "6%", top: "19%", color: pal.text }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: "4%" }}><div style={{ minWidth: 0 }}><div style={{ color: pal.secondary, font: `900 clamp(12px, 1.4vw, 20px) ${FONT}`, letterSpacing: "0.16em" }}>TRAFFIC RECAP</div><div style={{ marginTop: "3%", font: `900 clamp(34px, 6vw, 72px)/1 ${CONDENSED}`, overflowWrap: "anywhere" }}>{p.headline}</div></div><div style={{ flexShrink: 0, font: `700 clamp(13px, 1.6vw, 24px) ${FONT}`, color: `${pal.text}88` }}>{p.timestamp ?? "TODAY"}</div></div><div style={{ marginTop: "5%", display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "3%" }}>{rows.slice(0, 3).map((row, i) => { const fields = split(row); const q = clampInterp(frame, [12 + i * 6, 28 + i * 6], [0, 1]); const c = severityColor(pal, fields[2]); return <Card key={`${row}-${i}`} pal={pal} style={{ minWidth: 0, padding: "8%", boxSizing: "border-box", opacity: q, transform: `translateY(${(1 - q) * 40}px)` }}><div style={{ color: `${pal.text}88`, font: `700 clamp(11px, 1.2vw, 18px) ${FONT}`, letterSpacing: "0.08em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fields[0]}</div><div style={{ marginTop: "8%", font: `900 clamp(25px, 4vw, 62px) ${FONT}`, color: c, whiteSpace: "nowrap" }}>{fields[1]}</div><div style={{ marginTop: "8%", height: 7, background: `${pal.text}1c` }}><div style={{ width: pct(t * (35 + i * 21)), height: "100%", background: c }} /></div></Card>; })}</div><div style={{ marginTop: "5%", height: "30vh", minHeight: 110, maxHeight: 315, padding: "2%", boxSizing: "border-box", background: `${pal.bg}dd` }}><TrafficMap pal={pal} points={p.routePoints?.length ? p.routePoints : DEFAULT_POINTS} severity={p.severity} progress={t} showLabels={p.showLabels} /></div></div></AbsoluteFill>;
};

const AllClear: React.FC<{ p: TrafficUpdatesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const t = clampInterp(frame, [0, 35], [0, 1]);
  return <AbsoluteFill><TrafficBackdrop pal={pal} light /><Header pal={pal} label={p.label} timestamp={p.timestamp} light /><div style={{ position: "absolute", inset: "190px 90px 75px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", color: "#173229" }}><div style={{ width: 150, height: 150, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "#22c55e", color: "white", font: `900 76px ${FONT}`, transform: `scale(${0.6 + t * 0.4})`, boxShadow: "0 18px 50px #22c55e44" }}>✓</div><div style={{ marginTop: 35, font: `900 94px/1 ${CONDENSED}`, textTransform: "uppercase", opacity: t }}>{p.headline || "All routes clear"}</div><div style={{ marginTop: 24, font: `500 29px ${FONT}`, color: "#567468", opacity: t }}>{p.subheadline}</div><div style={{ marginTop: 42, width: "72%", height: 180, opacity: t }}><TrafficMap pal={pal} points={p.routePoints?.length ? p.routePoints : DEFAULT_POINTS} severity="clear" progress={t} showLabels={p.showLabels} light /></div></div></AbsoluteFill>;
};

const VARIANTS: Record<TrafficVariant, React.FC<{ p: TrafficUpdatesProps; pal: Palette }>> = {
  "route-status": RouteStatus,
  "incident-card": IncidentCard,
  "eta-update": EtaUpdate,
  "closure-alert": ClosureAlert,
  "commute-map": CommuteMap,
  "speed-bars": SpeedBars,
  "before-after-route": BeforeAfterRoute,
  "detour-flow": DetourFlow,
  "traffic-recap": TrafficRecap,
  "all-clear": AllClear,
};

export const TrafficUpdatesTemplate: React.FC<TrafficUpdatesProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? RouteStatus;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <AbsoluteFill style={{ fontFamily: FONT }}><FadeEdges inFrames={8} outFrames={10}><div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><Variant p={props} pal={pal} /></div></FadeEdges></AbsoluteFill>;
};

const familyCast = (component: React.FC<TrafficUpdatesProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "traffic-updates-route-status": familyCast(TrafficUpdatesTemplate),
  "traffic-updates-incident-card": familyCast(TrafficUpdatesTemplate),
  "traffic-updates-eta-update": familyCast(TrafficUpdatesTemplate),
  "traffic-updates-closure-alert": familyCast(TrafficUpdatesTemplate),
  "traffic-updates-commute-map": familyCast(TrafficUpdatesTemplate),
  "traffic-updates-speed-bars": familyCast(TrafficUpdatesTemplate),
  "traffic-updates-before-after-route": familyCast(TrafficUpdatesTemplate),
  "traffic-updates-detour-flow": familyCast(TrafficUpdatesTemplate),
  "traffic-updates-traffic-recap": familyCast(TrafficUpdatesTemplate),
  "traffic-updates-all-clear": familyCast(TrafficUpdatesTemplate),
};
