import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, clampInterp, resolvePalette, type Palette } from "../lib/primitives";

/** Neutral, source-labeled election/results graphics. No outcome inference is performed. */
type ElectionVariant =
  | "results-board"
  | "district-grid"
  | "turnout-meter"
  | "candidate-bars"
  | "map-callout"
  | "swing-indicator"
  | "count-update"
  | "provisional-banner"
  | "coalition-math"
  | "results-close";

export interface ElectionGraphicsProps {
  variant: ElectionVariant;
  headline: string;
  subheadline: string;
  label: string;
  paletteName: string;
  candidates?: string[];
  districts?: string[];
  values?: number[];
  status?: string;
  timestamp?: string;
  source?: string;
  disclaimer?: string;
  turnout?: number;
  counted?: number;
  totalVotes?: number;
  mapLabels?: string[];
}

const FONT = 'Arial, "Helvetica Neue", Helvetica, sans-serif';
const CONDENSED = '"Arial Narrow", "Helvetica Neue", Arial, sans-serif';
const DEFAULT_CANDIDATES = ["Candidate A|48|#4f7cff", "Candidate B|42|#f07855", "Candidate C|10|#9b8cff"];
const DEFAULT_DISTRICTS = ["North|A|48", "Central|B|42", "Coastal|A|56", "Valley|C|31", "Metro|B|51", "Lakes|A|44", "East|B|47", "West|A|53"];

const split = (text: string, fallback: string[] = []) => {
  const result = text.split("|").map((x) => x.trim());
  return result.length ? result : fallback;
};
const asNumber = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const Header: React.FC<{ p: ElectionGraphicsProps; pal: Palette; right?: string }> = ({ p, pal, right = "LIVE DATA" }) => (
  <div style={{ position: "absolute", left: 80, right: 80, top: 48, height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${pal.text}35`, color: pal.text, font: `800 20px ${FONT}`, letterSpacing: "0.18em", textTransform: "uppercase" }}>
    <span>{p.label}</span><span style={{ color: pal.accent, fontSize: 14 }}>{right}</span>
  </div>
);

const Footer: React.FC<{ p: ElectionGraphicsProps; pal: Palette }> = ({ p, pal }) => (
  <div style={{
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 92,
    boxSizing: "border-box",
    padding: "0 80px",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.2fr) minmax(220px, 0.8fr) minmax(0, 2fr)",
    alignItems: "center",
    gap: 24,
    borderTop: `1px solid ${pal.text}30`,
    background: `linear-gradient(180deg, ${pal.bg}d9, ${pal.bg}f5)`,
    color: `${pal.text}aa`,
    font: `500 15px/1.25 ${FONT}`,
    zIndex: 20,
  }}>
    <span style={{ minWidth: 0, maxWidth: 430, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.source || "Source: reporting desk"}</span>
    <span style={{ minWidth: 0, textAlign: "center", whiteSpace: "nowrap" }}>{p.timestamp || "Updated 20:30 local"}</span>
    <span style={{ minWidth: 0, maxWidth: 760, justifySelf: "end", color: pal.accent, textAlign: "right", overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 }}>{p.disclaimer || "Provisional figures; verify against official source."}</span>
  </div>
);

const Background: React.FC<{ pal: Palette; grid?: boolean }> = ({ pal, grid = true }) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ background: `linear-gradient(135deg, ${pal.bg}, ${pal.bgAlt || pal.bg} 55%, #05070b)`, overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 0, opacity: 0.08, background: `radial-gradient(circle at ${48 + Math.sin(frame * 0.01) * 8}% 28%, ${pal.primary}, transparent 38%)` }} />
    {grid && <div style={{ position: "absolute", inset: 0, opacity: 0.08, backgroundImage: `linear-gradient(${pal.text} 1px, transparent 1px), linear-gradient(90deg, ${pal.text} 1px, transparent 1px)`, backgroundSize: "80px 80px", transform: `translate(${-(frame % 80)}px, ${-(frame % 80)}px)` }} />}
  </AbsoluteFill>;
};

const CandidateRows: React.FC<{ p: ElectionGraphicsProps; pal: Palette; compact?: boolean }> = ({ p, pal, compact = false }) => {
  const frame = useCurrentFrame();
  const rows = (p.candidates?.length ? p.candidates : DEFAULT_CANDIDATES).map((row, i) => {
    const [name = `Candidate ${String.fromCharCode(65 + i)}`, value = "0", color = [pal.primary, pal.accent, pal.secondary][i % 3]] = split(row);
    return { name, value: asNumber(value, [48, 42, 10][i] || 0), color };
  });
  const max = Math.max(1, ...rows.map((r) => r.value));
  return <div style={{ display: "grid", gap: compact ? 18 : 28 }}>
    {rows.map((row, i) => {
      const t = clampInterp(frame, [8 + i * 5, 25 + i * 5], [0, 1]);
      return <div key={row.name} style={{ opacity: t, transform: `translateX(${(1 - t) * 70}px)` }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", color: pal.text, fontFamily: FONT }}>
          <span style={{ fontSize: compact ? 24 : 31, fontWeight: 800 }}>{row.name}</span>
          <span style={{ color: row.color, fontSize: compact ? 26 : 34, fontWeight: 900 }}>{row.value.toFixed(1)}%</span>
        </div>
        <div style={{ height: compact ? 12 : 18, marginTop: 10, background: `${pal.text}18`, borderRadius: 99, overflow: "hidden" }}><div style={{ width: `${(row.value / max) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${row.color}, ${row.color}88)`, transform: `scaleX(${t})`, transformOrigin: "left", borderRadius: 99 }} /></div>
      </div>;
    })}
  </div>;
};

const ResultsBoard: React.FC<{ p: ElectionGraphicsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const counted = p.counted ?? 62;
  return <AbsoluteFill><Background pal={pal} /><Header p={p} pal={pal} right="RESULTS BOARD" />
    <div style={{ position: "absolute", left: 110, top: 176, color: pal.text, font: `900 64px/1 ${CONDENSED}`, letterSpacing: "-0.02em" }}>{p.headline}</div>
    <div style={{ position: "absolute", left: 110, top: 258, color: `${pal.text}aa`, font: `500 24px ${FONT}` }}>{p.subheadline}</div>
    <div style={{ position: "absolute", left: 110, top: 365, width: 1000 }}><CandidateRows p={p} pal={pal} /></div>
    <div style={{ position: "absolute", right: 120, top: 350, width: 430, padding: 34, border: `1px solid ${pal.text}35`, background: `${pal.bg}bb` }}>
      <div style={{ color: `${pal.text}99`, font: `800 18px ${FONT}`, letterSpacing: "0.14em" }}>REPORTING</div>
      <div style={{ marginTop: 20, color: pal.text, font: `900 88px ${FONT}` }}>{Math.round(counted)}%</div>
      <div style={{ color: pal.accent, font: `700 20px ${FONT}` }}>PRECINCTS REPORTING</div>
      <div style={{ height: 10, marginTop: 22, background: `${pal.text}18` }}><div style={{ width: `${clampInterp(frame, [10, 45], [0, counted])}%`, height: "100%", background: pal.accent }} /></div>
      <div style={{ marginTop: 22, color: `${pal.text}99`, font: `500 17px ${FONT}` }}>{p.status || "Partial, unofficial results"}</div>
    </div><Footer p={p} pal={pal} /></AbsoluteFill>;
};

const DistrictGrid: React.FC<{ p: ElectionGraphicsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const rows = (p.districts?.length ? p.districts : DEFAULT_DISTRICTS).map((x, i) => { const [name = `District ${i + 1}`, lead = i % 2 ? "B" : "A", value = "50"] = split(x); return { name, lead, value: asNumber(value, 50) }; });
  return <AbsoluteFill><Background pal={pal} grid={false} /><Header p={p} pal={pal} right="DISTRICT VIEW" />
    <div style={{ position: "absolute", left: 110, top: 168, color: pal.text, font: `900 55px ${CONDENSED}` }}>{p.headline}</div>
    <div style={{ position: "absolute", left: 110, top: 246, color: `${pal.text}99`, font: `500 24px ${FONT}` }}>{p.subheadline}</div>
    <div style={{ position: "absolute", left: 110, right: 110, top: 350, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>{rows.map((row, i) => { const t = clampInterp(frame, [i * 3, 14 + i * 3], [0, 1]); const color = row.lead === "A" ? pal.primary : row.lead === "B" ? pal.accent : pal.secondary; return <div key={row.name} style={{ minHeight: 170, padding: 20, opacity: t, transform: `translateY(${(1 - t) * 32}px)`, background: `${color}24`, border: `2px solid ${color}88` }}><div style={{ color: `${pal.text}aa`, font: `700 16px ${FONT}`, textTransform: "uppercase" }}>{row.name}</div><div style={{ marginTop: 24, color, font: `900 58px ${FONT}` }}>{row.lead}</div><div style={{ color: pal.text, font: `600 18px ${FONT}` }}>{row.value.toFixed(0)}% reported</div></div>; })}</div><Footer p={p} pal={pal} /></AbsoluteFill>;
};

const TurnoutMeter: React.FC<{ p: ElectionGraphicsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const turnout = Math.max(0, Math.min(100, p.turnout ?? 64));
  return <AbsoluteFill><Background pal={pal} /><Header p={p} pal={pal} right="TURNOUT" />
    <div style={{ position: "absolute", left: 120, top: 180, width: 680, color: pal.text }}><div style={{ font: `900 64px ${CONDENSED}` }}>{p.headline}</div><div style={{ marginTop: 24, color: `${pal.text}aa`, font: `500 26px ${FONT}` }}>{p.subheadline}</div><div style={{ marginTop: 100, font: `900 170px ${FONT}`, color: pal.accent }}>{Math.round(turnout)}%</div><div style={{ color: `${pal.text}99`, font: `800 20px ${FONT}`, letterSpacing: "0.15em" }}>ESTIMATED TURNOUT</div></div>
    <div style={{ position: "absolute", right: 180, top: 240, width: 380, height: 380, borderRadius: "50%", border: `34px solid ${pal.text}16`, borderTopColor: pal.primary, borderRightColor: pal.accent, transform: `rotate(${clampInterp(frame, [0, 50], [-90, 270])}deg)`, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ transform: "rotate(-90deg)", textAlign: "center", color: pal.text }}><div style={{ font: `900 55px ${FONT}` }}>{Math.round(turnout)}%</div><div style={{ font: `600 16px ${FONT}` }}>OF ELIGIBLE VOTERS</div></div></div><Footer p={p} pal={pal} /></AbsoluteFill>;
};

const CandidateBars: React.FC<{ p: ElectionGraphicsProps; pal: Palette }> = ({ p, pal }) => <AbsoluteFill><Background pal={pal} grid={false} /><Header p={p} pal={pal} right="COMPARISON" /><div style={{ position: "absolute", left: 120, top: 170, color: pal.text, font: `900 58px ${CONDENSED}` }}>{p.headline}</div><div style={{ position: "absolute", left: 120, top: 255, color: `${pal.text}99`, font: `500 24px ${FONT}` }}>{p.subheadline}</div><div style={{ position: "absolute", left: 120, right: 120, top: 390 }}><CandidateRows p={p} pal={pal} /></div><Footer p={p} pal={pal} /></AbsoluteFill>;

const MapCallout: React.FC<{ p: ElectionGraphicsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const labels = p.mapLabels?.length ? p.mapLabels : ["NORTH", "CENTRAL", "COASTAL", "VALLEY", "METRO"];
  return <AbsoluteFill><Background pal={pal} grid={false} /><Header p={p} pal={pal} right="MAP CALLOUT" /><div style={{ position: "absolute", left: 100, top: 170, color: pal.text, font: `900 56px ${CONDENSED}` }}>{p.headline}</div><svg style={{ position: "absolute", left: 170, top: 320, width: 920, height: 510, overflow: "visible" }} viewBox="0 0 920 510"><path d="M100 100 L280 45 L470 110 L650 65 L820 180 L745 360 L540 430 L360 370 L160 430 L55 290 Z" fill={`${pal.primary}22`} stroke={pal.primary} strokeWidth="5" /><path d="M280 45 L360 370 M470 110 L540 430 M650 65 L745 360 M55 290 L820 180" stroke={`${pal.text}44`} strokeWidth="3" fill="none" />{labels.map((label, i) => { const x = [210, 405, 600, 260, 610][i % 5]; const y = [140, 190, 135, 315, 310][i % 5]; const t = clampInterp(frame, [i * 8, 18 + i * 8], [0, 1]); return <g key={label} opacity={t}><circle cx={x} cy={y} r="18" fill={[pal.primary, pal.accent, pal.secondary][i % 3]} /><text x={x + 28} y={y + 7} fill={pal.text} fontFamily={FONT} fontSize="22" fontWeight="700">{label}</text></g>; })}</svg><div style={{ position: "absolute", right: 140, top: 340, width: 360, padding: 28, borderLeft: `5px solid ${pal.accent}`, color: pal.text, font: `500 22px/1.5 ${FONT}`, background: `${pal.bg}cc` }}>{p.subheadline}<div style={{ marginTop: 18, color: pal.accent, fontSize: 16 }}>{p.status || "Map shading reflects reported status only"}</div></div><Footer p={p} pal={pal} /></AbsoluteFill>;
};

const SwingIndicator: React.FC<{ p: ElectionGraphicsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const v = Math.max(-100, Math.min(100, p.values?.[0] ?? 12)); const x = clampInterp(frame, [8, 42], [-300, v * 3]);
  return <AbsoluteFill><Background pal={pal} /><Header p={p} pal={pal} right="CHANGE INDICATOR" /><div style={{ position: "absolute", left: 120, top: 185, color: pal.text, font: `900 62px ${CONDENSED}` }}>{p.headline}</div><div style={{ position: "absolute", left: 120, top: 275, color: `${pal.text}99`, font: `500 25px ${FONT}` }}>{p.subheadline}</div><div style={{ position: "absolute", left: 230, right: 230, top: 480, height: 5, background: `${pal.text}55` }}><div style={{ position: "absolute", left: "50%", top: -28, width: 3, height: 62, background: pal.text }} /><div style={{ position: "absolute", left: `calc(50% + ${x}px)`, top: -18, width: 36, height: 36, borderRadius: "50%", background: v >= 0 ? pal.accent : pal.primary, boxShadow: `0 0 0 10px ${v >= 0 ? pal.accent : pal.primary}22` }} /></div><div style={{ position: "absolute", left: 220, top: 535, right: 220, display: "flex", justifyContent: "space-between", color: `${pal.text}99`, font: `700 17px ${FONT}` }}><span>LOWER</span><span>NO CHANGE</span><span>HIGHER</span></div><Footer p={p} pal={pal} /></AbsoluteFill>;
};

const CountUpdate: React.FC<{ p: ElectionGraphicsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const total = p.totalVotes ?? 1000000; const counted = Math.round(interpolate(frame, [6, 55], [p.counted ?? 420000, total], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return <AbsoluteFill><Background pal={pal} grid={false} /><Header p={p} pal={pal} right="COUNT UPDATE" /><div style={{ position: "absolute", left: 120, top: 180, color: pal.text, font: `900 58px ${CONDENSED}` }}>{p.headline}</div><div style={{ position: "absolute", left: 120, top: 270, color: `${pal.text}99`, font: `500 24px ${FONT}` }}>{p.subheadline}</div><div style={{ position: "absolute", left: 120, top: 420, color: pal.accent, font: `900 122px ${FONT}` }}>{counted.toLocaleString()}</div><div style={{ position: "absolute", left: 125, top: 570, color: `${pal.text}aa`, font: `800 20px ${FONT}`, letterSpacing: "0.15em" }}>TOTAL BALLOTS REPORTED</div><div style={{ position: "absolute", right: 180, top: 380, width: 380, padding: 30, border: `1px solid ${pal.text}44` }}><div style={{ color: `${pal.text}99`, font: `700 17px ${FONT}` }}>REPORTING PROGRESS</div><div style={{ marginTop: 22, height: 18, background: `${pal.text}18` }}><div style={{ width: `${(counted / total) * 100}%`, height: "100%", background: pal.primary }} /></div><div style={{ marginTop: 18, color: pal.text, font: `800 23px ${FONT}` }}>{((counted / total) * 100).toFixed(1)}% counted</div></div><Footer p={p} pal={pal} /></AbsoluteFill>;
};

const ProvisionalBanner: React.FC<{ p: ElectionGraphicsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const opacity = clampInterp(frame, [10, 28], [0, 1]);
  return <AbsoluteFill><Background pal={pal} /><Header p={p} pal={pal} right="STATUS LABEL" /><div style={{ position: "absolute", inset: "190px 120px 160px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", color: pal.text }}><div style={{ opacity, padding: "18px 34px", background: pal.accent, color: "#090b10", font: `900 22px ${FONT}`, letterSpacing: "0.24em" }}>{p.status || "PROVISIONAL"}</div><div style={{ marginTop: 34, font: `900 78px/1 ${CONDENSED}` }}>{p.headline}</div><div style={{ marginTop: 25, maxWidth: 980, color: `${pal.text}aa`, font: `500 28px/1.4 ${FONT}` }}>{p.subheadline}</div><div style={{ marginTop: 40, color: pal.primary, font: `700 20px ${FONT}` }}>No projection is implied by this graphic.</div></div><Footer p={p} pal={pal} /></AbsoluteFill>;
};

const CoalitionMath: React.FC<{ p: ElectionGraphicsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const values = p.values?.length ? p.values : [38, 27, 19, 11]; const names = p.candidates?.length ? p.candidates : ["Group A", "Group B", "Group C", "Group D"]; const threshold = 50;
  return <AbsoluteFill><Background pal={pal} grid={false} /><Header p={p} pal={pal} right="SEAT MATH" /><div style={{ position: "absolute", left: 120, top: 165, color: pal.text, font: `900 58px ${CONDENSED}` }}>{p.headline}</div><div style={{ position: "absolute", left: 120, top: 250, color: `${pal.text}99`, font: `500 24px ${FONT}` }}>{p.subheadline}</div><div style={{ position: "absolute", left: 120, right: 120, top: 380, display: "flex", gap: 8, height: 110 }}>{values.map((value, i) => { const w = `${(value / values.reduce((a, b) => a + b, 0)) * 100}%`; return <div key={i} style={{ width: w, background: [pal.primary, pal.accent, pal.secondary, `${pal.text}66`][i % 4], transform: `scaleX(${clampInterp(frame, [i * 4, 22 + i * 4], [0, 1])})`, transformOrigin: "left", display: "flex", alignItems: "center", justifyContent: "center", color: pal.bg, font: `900 20px ${FONT}` }}>{names[i] || `Group ${i + 1}`}</div>; })}</div><div style={{ position: "absolute", left: 120, top: 550, color: pal.text, font: `800 24px ${FONT}` }}>Threshold: {threshold} seats</div><div style={{ position: "absolute", left: 120, top: 625, color: pal.accent, font: `900 70px ${FONT}` }}>{Math.round(values[0] + values[1])} + {Math.round(values[2])} = {Math.round(values[0] + values[1] + values[2])}</div><div style={{ position: "absolute", left: 120, top: 730, color: `${pal.text}99`, font: `500 21px ${FONT}` }}>{p.status || "Illustrative arithmetic; not a projection"}</div><Footer p={p} pal={pal} /></AbsoluteFill>;
};

const ResultsClose: React.FC<{ p: ElectionGraphicsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const t = clampInterp(frame, [8, 30], [0, 1]);
  return <AbsoluteFill><Background pal={pal} /><Header p={p} pal={pal} right="RESULTS DESK" /><div style={{ position: "absolute", left: 120, top: 230, right: 120, color: pal.text, opacity: t, transform: `translateY(${(1 - t) * 30}px)` }}><div style={{ font: `900 88px/0.95 ${CONDENSED}`, textTransform: "uppercase" }}>{p.headline}</div><div style={{ marginTop: 28, font: `500 31px/1.4 ${FONT}`, color: `${pal.text}bb` }}>{p.subheadline}</div><div style={{ display: "flex", gap: 20, marginTop: 70 }}><div style={{ flex: 1, padding: 28, background: `${pal.primary}28`, borderTop: `5px solid ${pal.primary}` }}><div style={{ color: `${pal.text}99`, font: `700 17px ${FONT}` }}>STATUS</div><div style={{ marginTop: 14, font: `900 30px ${FONT}` }}>{p.status || "Awaiting official certification"}</div></div><div style={{ flex: 1, padding: 28, background: `${pal.accent}28`, borderTop: `5px solid ${pal.accent}` }}><div style={{ color: `${pal.text}99`, font: `700 17px ${FONT}` }}>NEXT UPDATE</div><div style={{ marginTop: 14, font: `900 30px ${FONT}` }}>{p.timestamp || "Source desk update pending"}</div></div></div></div><Footer p={p} pal={pal} /></AbsoluteFill>;
};

const VARIANTS: Record<ElectionVariant, React.FC<{ p: ElectionGraphicsProps; pal: Palette }>> = { "results-board": ResultsBoard, "district-grid": DistrictGrid, "turnout-meter": TurnoutMeter, "candidate-bars": CandidateBars, "map-callout": MapCallout, "swing-indicator": SwingIndicator, "count-update": CountUpdate, "provisional-banner": ProvisionalBanner, "coalition-math": CoalitionMath, "results-close": ResultsClose };

export const ElectionGraphicsTemplate: React.FC<ElectionGraphicsProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] || ResultsBoard;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <AbsoluteFill style={{ fontFamily: FONT }}><FadeEdges inFrames={8} outFrames={10}><div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><Variant p={props} pal={pal} /></div></FadeEdges></AbsoluteFill>;
};

const familyCast = (component: React.FC<ElectionGraphicsProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;
export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "election-graphics-results-board": familyCast(ElectionGraphicsTemplate),
  "election-graphics-district-grid": familyCast(ElectionGraphicsTemplate),
  "election-graphics-turnout-meter": familyCast(ElectionGraphicsTemplate),
  "election-graphics-candidate-bars": familyCast(ElectionGraphicsTemplate),
  "election-graphics-map-callout": familyCast(ElectionGraphicsTemplate),
  "election-graphics-swing-indicator": familyCast(ElectionGraphicsTemplate),
  "election-graphics-count-update": familyCast(ElectionGraphicsTemplate),
  "election-graphics-provisional-banner": familyCast(ElectionGraphicsTemplate),
  "election-graphics-coalition-math": familyCast(ElectionGraphicsTemplate),
  "election-graphics-results-close": familyCast(ElectionGraphicsTemplate),
};
