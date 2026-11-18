import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, clampInterp, resolvePalette, type Palette } from "../lib/primitives";

/** Persistent broadcast corner bugs and live overlays. Defaults are asset-free and deterministic. */
export type LiveBugsVariant =
  | "network-bug"
  | "live-pill"
  | "location-bug"
  | "breaking-bug"
  | "sports-score-bug"
  | "weather-bug"
  | "ticker-bug"
  | "countdown-bug"
  | "sponsor-bug"
  | "bug-transition";

export interface LiveBugsProps {
  variant: LiveBugsVariant;
  network: string;
  liveText: string;
  location: string;
  score: string;
  tickerItems: string[];
  sponsor: string;
  paletteName: string;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  headline?: string;
  subheadline?: string;
  temperature?: string;
  countdown?: string;
  label?: string;
  accent?: string;
  compact?: boolean;
}

const FONT = 'Arial, "Helvetica Neue", Helvetica, sans-serif';
const CONDENSED = '"Arial Narrow", "Helvetica Neue", Arial, sans-serif';

const BugShell: React.FC<{
  pal: Palette;
  children: React.ReactNode;
  position: LiveBugsProps["position"];
  width?: number;
  tone?: "dark" | "light" | "alert";
}> = ({ pal, children, position = "top-right", width = 420, tone = "dark" }) => {
  const frame = useCurrentFrame();
  const { width: canvasWidth, height: canvasHeight } = useVideoConfig();
  const x = position.includes("left") ? 54 : canvasWidth - width - 54;
  const y = position.includes("top") ? 48 : canvasHeight - 154;
  const bg = tone === "light" ? "#f6f8fa" : tone === "alert" ? "#8b111b" : `${pal.bg}ee`;
  const fg = tone === "light" ? "#101820" : pal.text;
  const border = tone === "alert" ? "#ff5b63" : `${pal.primary}88`;
  const enter = clampInterp(frame, [0, 14], [0, 1]);
  return (
    <div
      style={{
        position: "absolute", left: x, top: y, width, minHeight: 82, padding: "15px 18px",
        boxSizing: "border-box", display: "flex", alignItems: "center", gap: 14,
        background: bg, color: fg, border: `2px solid ${border}`, borderRadius: 10,
        boxShadow: "0 14px 35px #00000055", fontFamily: FONT,
        transform: `translateY(${(1 - enter) * (position.includes("top") ? -35 : 35)}px) scale(${0.96 + enter * 0.04})`,
        opacity: enter,
      }}
    >
      {children}
    </div>
  );
};

const Dot: React.FC<{ color: string; pulse?: boolean }> = ({ color, pulse = false }) => {
  const frame = useCurrentFrame();
  const scale = pulse ? 0.86 + Math.sin(frame * 0.17) * 0.14 : 1;
  return <span style={{ width: 13, height: 13, borderRadius: "50%", background: color, display: "inline-block", transform: `scale(${scale})`, flexShrink: 0 }} />;
};

const NetworkBug: React.FC<{ p: LiveBugsProps; pal: Palette }> = ({ p, pal }) => (
  <BugShell pal={pal} position={p.position} width={440}>
    <div style={{ width: 48, height: 48, borderRadius: 12, display: "grid", placeItems: "center", background: pal.primary, color: pal.bg, font: `900 22px ${CONDENSED}` }}>N</div>
    <div style={{ flex: 1 }}>
      <div style={{ font: `900 22px ${CONDENSED}`, letterSpacing: "0.13em", textTransform: "uppercase" }}>{p.network}</div>
      <div style={{ marginTop: 5, fontSize: 13, letterSpacing: "0.2em", color: pal.secondary }}>NETWORK ORIGINAL</div>
    </div>
    <Dot color={pal.accent} pulse />
  </BugShell>
);

const LivePill: React.FC<{ p: LiveBugsProps; pal: Palette }> = ({ p, pal }) => (
  <BugShell pal={pal} position={p.position} width={270} tone="alert">
    <Dot color="#ffffff" pulse />
    <span style={{ font: `900 24px ${CONDENSED}`, letterSpacing: "0.22em" }}>{p.liveText || "LIVE"}</span>
    <span style={{ marginLeft: "auto", fontSize: 14, opacity: 0.8 }}>●  ON AIR</span>
  </BugShell>
);

const LocationBug: React.FC<{ p: LiveBugsProps; pal: Palette }> = ({ p, pal }) => (
  <BugShell pal={pal} position={p.position} width={380} tone="light">
    <div style={{ width: 42, height: 42, borderRadius: "50% 50% 50% 0", transform: "rotate(-45deg)", background: pal.accent, display: "grid", placeItems: "center" }}><span style={{ transform: "rotate(45deg)", color: "#fff", fontSize: 20 }}>•</span></div>
    <div><div style={{ font: `900 21px ${CONDENSED}`, letterSpacing: "0.14em", textTransform: "uppercase" }}>{p.location}</div><div style={{ fontSize: 13, color: pal.secondary, marginTop: 4 }}>REPORTING LIVE</div></div>
  </BugShell>
);

const BreakingBug: React.FC<{ p: LiveBugsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const wipe = clampInterp(frame, [0, 16], [0, 100]);
  return (
    <BugShell pal={pal} position={p.position} width={500} tone="alert">
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 8, pointerEvents: "none" }}><div style={{ position: "absolute", inset: 0, width: `${wipe}%`, background: "#ff445044" }} /></div>
      <div style={{ position: "relative", zIndex: 1, font: `900 21px ${CONDENSED}`, letterSpacing: "0.18em" }}>BREAKING</div>
      <div style={{ position: "relative", zIndex: 1, width: 2, height: 32, background: "#ffffff88" }} />
      <div style={{ position: "relative", zIndex: 1, flex: 1, fontSize: 17, fontWeight: 800 }}>{p.headline || "DEVELOPING STORY"}</div>
    </BugShell>
  );
};

const SportsScoreBug: React.FC<{ p: LiveBugsProps; pal: Palette }> = ({ p, pal }) => {
  const parts = (p.score || "HOME|2|AWAY|1").split("|");
  const home = parts[0] || "HOME"; const homeScore = parts[1] || "2"; const away = parts[2] || "AWAY"; const awayScore = parts[3] || "1";
  return <BugShell pal={pal} position={p.position} width={440}>
    <div style={{ width: 54, alignSelf: "stretch", margin: "-15px 0 -15px -18px", display: "grid", placeItems: "center", background: pal.primary, color: pal.bg, font: `900 19px ${CONDENSED}`, writingMode: "vertical-rl" }}>LIVE</div>
    <div style={{ flex: 1, font: `800 17px ${FONT}` }}><div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}><span>{home}</span><b>{homeScore}</b></div><div style={{ height: 1, background: `${pal.text}33`, margin: "7px 0" }} /><div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}><span>{away}</span><b>{awayScore}</b></div></div>
    <div style={{ alignSelf: "stretch", display: "grid", placeItems: "center", borderLeft: `1px solid ${pal.text}33`, paddingLeft: 15, font: `900 15px ${CONDENSED}`, color: pal.accent }}>Q3<br />04:18</div>
  </BugShell>;
};

const WeatherBug: React.FC<{ p: LiveBugsProps; pal: Palette }> = ({ p, pal }) => (
  <BugShell pal={pal} position={p.position} width={340} tone="light">
    <span style={{ fontSize: 34 }}>{p.label || "☀"}</span><div><div style={{ font: `900 28px ${CONDENSED}` }}>{p.temperature || p.score || "72°F"}</div><div style={{ fontSize: 14, letterSpacing: "0.15em", color: pal.secondary }}>{p.location || "NEW YORK"}</div></div><span style={{ marginLeft: "auto", fontSize: 13, color: pal.accent }}>CLEAR</span>
  </BugShell>
);

const TickerBug: React.FC<{ p: LiveBugsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { width } = useVideoConfig();
  const items = p.tickerItems?.length ? p.tickerItems : ["TOP STORY", "MARKETS MIXED", "WEATHER CLEAR"];
  const text = `${items.join("     ◆     ")}     ◆     ${items.join("     ◆     ")}`;
  return <div style={{ position: "absolute", left: 0, right: 0, bottom: p.position?.includes("bottom") ? 0 : undefined, top: p.position?.includes("top") ? 0 : undefined, height: 64, overflow: "hidden", display: "flex", alignItems: "center", background: pal.bg, color: pal.text, borderTop: `2px solid ${pal.primary}`, borderBottom: `2px solid ${pal.primary}`, fontFamily: FONT }}><div style={{ flexShrink: 0, height: "100%", display: "grid", placeItems: "center", padding: "0 26px", background: pal.accent, color: pal.bg, font: `900 17px ${CONDENSED}`, letterSpacing: "0.16em" }}>LIVE</div><div style={{ whiteSpace: "nowrap", fontSize: 18, fontWeight: 700, transform: `translateX(${width - ((frame * 4.8) % (width * 2.1))}px)` }}>{text}</div></div>;
};

const CountdownBug: React.FC<{ p: LiveBugsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const remaining = Math.max(0, Math.ceil(15 - frame / 30));
  const timer = p.countdown || `00:${String(remaining).padStart(2, "0")}`;
  return (
    <BugShell pal={pal} position={p.position} width={340}>
      <div style={{ font: `900 14px ${CONDENSED}`, letterSpacing: "0.15em", color: pal.accent }}>STARTS IN</div>
      <div style={{ font: `900 34px ${CONDENSED}`, fontVariantNumeric: "tabular-nums" }}>{timer}</div>
      <div style={{ width: 42, height: 42, borderRadius: "50%", border: `4px solid ${pal.primary}`, borderTopColor: pal.accent, transform: `rotate(${frame * 7}deg)` }} />
    </BugShell>
  );
};

const SponsorBug: React.FC<{ p: LiveBugsProps; pal: Palette }> = ({ p, pal }) => {
  const initials = (p.sponsor || "SP").slice(0, 2).toUpperCase();
  return (
    <BugShell pal={pal} position={p.position} width={380} tone="light">
      <div style={{ width: 45, height: 45, borderRadius: 8, background: pal.primary, color: "#fff", display: "grid", placeItems: "center", font: `900 20px ${CONDENSED}` }}>{initials}</div>
      <div>
        <div style={{ fontSize: 12, color: pal.secondary, letterSpacing: "0.14em" }}>PRESENTED BY</div>
        <div style={{ marginTop: 4, font: `900 21px ${CONDENSED}`, letterSpacing: "0.1em" }}>{p.sponsor || "SPONSOR"}</div>
      </div>
    </BugShell>
  );
};

const BugTransition: React.FC<{ p: LiveBugsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const reveal = interpolate(frame, [0, 22, 48], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: "50%", top: "50%", width: 180, height: 180, borderRadius: "50%", background: pal.accent, transform: `translate(-50%, -50%) scale(${0.4 + reveal * 9})`, opacity: reveal * 0.2 }} />
      <div style={{ position: "absolute", left: 48, top: 42, width: width - 96, height: height - 84, border: `3px solid ${pal.primary}`, opacity: reveal, transform: `scale(${0.94 + reveal * 0.06})`, boxShadow: `0 0 ${28 * reveal}px ${pal.primary}` }} />
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%, -50%) scale(${0.7 + reveal * 0.3})`, opacity: reveal, color: pal.text, font: `900 24px ${CONDENSED}`, letterSpacing: "0.2em" }}>{p.liveText || "LIVE"}</div>
    </AbsoluteFill>
  );
};

const VARIANTS: Record<LiveBugsVariant, React.FC<{ p: LiveBugsProps; pal: Palette }>> = {
  "network-bug": NetworkBug,
  "live-pill": LivePill,
  "location-bug": LocationBug,
  "breaking-bug": BreakingBug,
  "sports-score-bug": SportsScoreBug,
  "weather-bug": WeatherBug,
  "ticker-bug": TickerBug,
  "countdown-bug": CountdownBug,
  "sponsor-bug": SponsorBug,
  "bug-transition": BugTransition,
};

export const LiveBugsTemplate: React.FC<LiveBugsProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? NetworkBug;
  return <AbsoluteFill style={{ fontFamily: FONT }}><FadeEdges inFrames={6} outFrames={8}><Variant p={props} pal={pal} /></FadeEdges></AbsoluteFill>;
};

const familyCast = (component: React.FC<LiveBugsProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "live-bugs-network-bug": familyCast(LiveBugsTemplate),
  "live-bugs-live-pill": familyCast(LiveBugsTemplate),
  "live-bugs-location-bug": familyCast(LiveBugsTemplate),
  "live-bugs-breaking-bug": familyCast(LiveBugsTemplate),
  "live-bugs-sports-score-bug": familyCast(LiveBugsTemplate),
  "live-bugs-weather-bug": familyCast(LiveBugsTemplate),
  "live-bugs-ticker-bug": familyCast(LiveBugsTemplate),
  "live-bugs-countdown-bug": familyCast(LiveBugsTemplate),
  "live-bugs-sponsor-bug": familyCast(LiveBugsTemplate),
  "live-bugs-bug-transition": familyCast(LiveBugsTemplate),
};
