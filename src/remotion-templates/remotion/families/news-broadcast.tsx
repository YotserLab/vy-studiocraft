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
  clampInterp,
  resolvePalette,
  seededRand,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: news-broadcast
 * Ten structurally distinct, brand-neutral broadcast graphics.
 */

type NewsVariant =
  | "breaking-news"
  | "lower-third"
  | "anchor-intro"
  | "weather-panel"
  | "market-ticker"
  | "election-results"
  | "press-conference"
  | "morning-show"
  | "sports-desk"
  | "closing-headlines";

export interface NewsBroadcastProps {
  variant: NewsVariant;
  headline: string;
  subheadline: string;
  label: string;
  paletteName: string;
  items?: string[];
  ticker?: string[];
  name?: string;
  title?: string;
  location?: string;
  value?: string;
  icon?: string;
}

const FONT_STACK = 'Arial, "Helvetica Neue", Helvetica, sans-serif';
const CONDENSED_STACK = '"Arial Narrow", "Helvetica Neue", Arial, sans-serif';

const splitFields = (item: string): string[] => item.split("|").map((field) => field.trim());

const BroadcastBackground: React.FC<{
  pal: Palette;
  tone?: "dark" | "light" | "warm";
}> = ({ pal, tone = "dark" }) => {
  const frame = useCurrentFrame();
  const bg = tone === "light" ? "#edf1f4" : tone === "warm" ? "#fff3dd" : pal.bg;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: bg }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            tone === "light"
              ? `linear-gradient(135deg, #ffffff 0%, ${pal.secondary}22 100%)`
              : tone === "warm"
                ? `radial-gradient(circle at 72% 28%, ${pal.accent}44, transparent 34%), linear-gradient(125deg, #fff9ef, #ffd99a)`
                : `radial-gradient(circle at 72% 30%, ${pal.primary}35, transparent 34%), linear-gradient(135deg, ${pal.bg}, #02050a)`,
        }}
      />
      {Array.from({ length: 12 }, (_, i) => {
        const x = seededRand(i + 31) * 100;
        const height = 18 + seededRand(i + 71) * 48;
        return (
          <div
            key={`tower-${i}`}
            style={{
              position: "absolute",
              left: `${x}%`,
              bottom: -20,
              width: 2 + seededRand(i + 101) * 4,
              height: `${height}%`,
              background: tone === "light" ? `${pal.primary}18` : `${pal.text}0d`,
              transform: `translateX(${Math.sin(frame * 0.008 + i) * 10}px)`,
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: tone === "light" ? 0.12 : 0.08,
          backgroundImage: `linear-gradient(${pal.text} 1px, transparent 1px), linear-gradient(90deg, ${pal.text} 1px, transparent 1px)`,
          backgroundSize: "96px 96px",
          transform: `translateX(${-(frame % 96)}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

const NetworkRail: React.FC<{ label: string; pal: Palette; dark?: boolean }> = ({ label, pal, dark = true }) => (
  <div
    style={{
      position: "absolute",
      top: 58,
      left: 72,
      right: 72,
      height: 42,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottom: `1px solid ${dark ? `${pal.text}44` : `${pal.primary}55`}`,
      color: dark ? pal.text : pal.primary,
      fontFamily: FONT_STACK,
      fontSize: 20,
      fontWeight: 800,
      letterSpacing: "0.24em",
      textTransform: "uppercase",
    }}
  >
    <span>{label}</span>
    <span style={{ fontSize: 14, opacity: 0.65 }}>LIVE • 30 FPS</span>
  </div>
);

// ---------------- breaking-news red slab banner ----------------
const BreakingNews: React.FC<{ p: NewsBroadcastProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const enter = spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 16, stiffness: 150 } });
  const wipe = clampInterp(frame, [4, 28], [0, 100]);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#8b0710", color: "white" }}>
      <div
        style={{
          position: "absolute",
          inset: "-30%",
          opacity: 0.18,
          backgroundImage: "repeating-linear-gradient(115deg, transparent 0 70px, #ffffff 70px 78px)",
          transform: `translateX(${frame * 5}px)`,
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 82% 18%, #ff606866, transparent 35%)" }} />
      <div
        style={{
          position: "absolute",
          top: 112,
          left: 110,
          padding: "14px 24px",
          background: "white",
          color: "#a50914",
          font: `900 24px ${FONT_STACK}`,
          letterSpacing: "0.25em",
          transform: `translateX(${interpolate(enter, [0, 1], [-260, 0])}px)`,
        }}
      >
        {p.label}
      </div>
      <div
        style={{
          position: "absolute",
          left: 110,
          right: 110,
          top: 270,
          padding: "54px 62px 58px",
          background: "#bd0b18",
          borderLeft: "14px solid white",
          boxShadow: "0 34px 80px #43000688",
          clipPath: `inset(0 ${100 - wipe}% 0 0)`,
        }}
      >
        <div style={{ font: `900 ${Math.min(width * 0.074, 132)}px/0.92 ${CONDENSED_STACK}`, letterSpacing: "-0.035em", textTransform: "uppercase" }}>
          {p.headline}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 110,
          right: 110,
          bottom: 150,
          display: "flex",
          alignItems: "center",
          gap: 28,
          opacity: clampInterp(frame, [27, 40], [0, 1]),
          transform: `translateY(${clampInterp(frame, [27, 40], [24, 0])}px)`,
          font: `500 32px ${FONT_STACK}`,
        }}
      >
        <div style={{ width: 120, height: 6, background: pal.accent }} />
        {p.subheadline}
      </div>
    </AbsoluteFill>
  );
};

// ---------------- lower-third headline strap with ticker ----------------
const LowerThird: React.FC<{ p: NewsBroadcastProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const tickerText = (p.ticker ?? [p.subheadline]).join("     ◆     ");
  const rise = clampInterp(frame, [8, 25], [250, 0]);
  return (
    <AbsoluteFill>
      <BroadcastBackground pal={pal} />
      <NetworkRail label={p.label} pal={pal} />
      <div style={{ position: "absolute", left: 120, top: 190, width: 650, color: `${pal.text}aa`, font: `500 26px ${FONT_STACK}`, lineHeight: 1.5 }}>
        <div style={{ width: 72, height: 5, marginBottom: 24, background: pal.accent }} />
        {p.subheadline}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, transform: `translateY(${rise}px)` }}>
        <div style={{ display: "flex", height: 154, background: "#f6f7f8", boxShadow: "0 -20px 60px #00000055" }}>
          <div style={{ width: 330, background: pal.accent, color: "white", display: "flex", alignItems: "center", justifyContent: "center", font: `900 30px ${CONDENSED_STACK}`, letterSpacing: "0.18em", textTransform: "uppercase" }}>
            {p.label}
          </div>
          <div style={{ flex: 1, padding: "34px 52px", color: "#10141a", font: `800 48px/1.1 ${FONT_STACK}` }}>
            {p.headline}
          </div>
        </div>
        <div style={{ height: 62, overflow: "hidden", background: "#121821", color: "white", display: "flex", alignItems: "center" }}>
          <div style={{ flexShrink: 0, height: "100%", padding: "0 34px", display: "flex", alignItems: "center", background: pal.primary, font: `900 19px ${FONT_STACK}`, letterSpacing: "0.16em" }}>LATEST</div>
          <div style={{ whiteSpace: "nowrap", transform: `translateX(${width - ((frame * 5.5) % (width * 2.2))}px)`, font: `600 21px ${FONT_STACK}`, letterSpacing: "0.04em" }}>
            {`${tickerText}     ◆     ${tickerText}`}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- anchor intro card ----------------
const AnchorIntro: React.FC<{ p: NewsBroadcastProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const card = spring({ frame: Math.max(0, frame - 7), fps, config: { damping: 19, stiffness: 120 } });
  const initials = (p.name ?? "A N").split(/\s+/).map((word) => word[0]).join("").slice(0, 2);
  return (
    <AbsoluteFill>
      <BroadcastBackground pal={pal} />
      <NetworkRail label={p.label} pal={pal} />
      <div style={{ position: "absolute", left: 130, top: 180, bottom: 120, width: 620, background: `linear-gradient(145deg, ${pal.primary}, ${pal.secondary})`, overflow: "hidden", transform: `translateX(${interpolate(card, [0, 1], [-780, 0])}px)` }}>
        <div style={{ position: "absolute", width: 520, height: 520, borderRadius: "50%", left: 50, top: 120, background: `${pal.bg}55`, border: `2px solid ${pal.text}44` }} />
        <div style={{ position: "absolute", left: 160, right: 160, top: 230, height: 230, borderRadius: "50%", background: pal.text, opacity: 0.9 }} />
        <div style={{ position: "absolute", left: 100, right: 100, bottom: -140, height: 440, borderRadius: "50% 50% 0 0", background: pal.text, opacity: 0.9 }} />
        <div style={{ position: "absolute", right: 30, bottom: 24, color: pal.bg, font: `900 92px ${CONDENSED_STACK}`, opacity: 0.16 }}>{initials}</div>
      </div>
      <div style={{ position: "absolute", left: 850, right: 120, top: 300, color: pal.text, opacity: clampInterp(frame, [18, 35], [0, 1]) }}>
        <div style={{ color: pal.accent, font: `800 22px ${FONT_STACK}`, letterSpacing: "0.3em", textTransform: "uppercase" }}>{p.headline}</div>
        <div style={{ width: 90, height: 6, margin: "28px 0 34px", background: pal.primary }} />
        <div style={{ font: `900 86px/0.98 ${CONDENSED_STACK}`, textTransform: "uppercase", letterSpacing: "-0.025em" }}>{p.name}</div>
        <div style={{ marginTop: 28, font: `400 33px ${FONT_STACK}`, color: `${pal.text}aa` }}>{p.title}</div>
        <div style={{ marginTop: 100, paddingTop: 22, borderTop: `1px solid ${pal.text}33`, font: `500 22px ${FONT_STACK}`, letterSpacing: "0.1em", color: `${pal.text}88` }}>{p.subheadline}</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- weather panel ----------------
const WeatherPanel: React.FC<{ p: NewsBroadcastProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const days = p.items ?? [];
  const iconFloat = Math.sin(frame * 0.08) * 12;
  return (
    <AbsoluteFill style={{ color: pal.text }}>
      <BroadcastBackground pal={pal} />
      <NetworkRail label={p.label} pal={pal} />
      <div style={{ position: "absolute", top: 166, left: 110, right: 110, display: "flex", alignItems: "stretch", gap: 36 }}>
        <div style={{ flex: 1, minHeight: 500, padding: "48px 58px", background: `${pal.text}0d`, border: `1px solid ${pal.text}25` }}>
          <div style={{ font: `800 24px ${FONT_STACK}`, letterSpacing: "0.18em", textTransform: "uppercase", color: pal.secondary }}>{p.location}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 40 }}>
            <div style={{ font: `200 ${Math.min(width * 0.14, 238)}px/0.85 ${FONT_STACK}`, letterSpacing: "-0.08em" }}>{p.value}</div>
            <div style={{ fontSize: 190, lineHeight: 1, color: pal.accent, transform: `translateY(${iconFloat}px) scale(${0.92 + clampInterp(frame, [5, 26], [0, 0.08])})`, textShadow: `0 18px 50px ${pal.accent}55` }}>{p.icon}</div>
          </div>
          <div style={{ marginTop: 48, font: `700 38px ${FONT_STACK}` }}>{p.headline}</div>
          <div style={{ marginTop: 15, color: `${pal.text}aa`, font: `400 25px ${FONT_STACK}` }}>{p.subheadline}</div>
        </div>
        <div style={{ width: 510, display: "grid", gridTemplateRows: `repeat(${Math.max(1, days.length)}, 1fr)`, gap: 12 }}>
          {days.map((item, i) => {
            const [day, temp, glyph = "•"] = splitFields(item);
            const t = clampInterp(frame, [10 + i * 5, 24 + i * 5], [0, 1]);
            return (
              <div key={`${item}-${i}`} style={{ display: "grid", gridTemplateColumns: "1fr 90px 100px", alignItems: "center", padding: "0 28px", background: `${pal.text}10`, borderLeft: `5px solid ${i === 0 ? pal.accent : `${pal.primary}77`}`, opacity: t, transform: `translateX(${(1 - t) * 80}px)` }}>
                <span style={{ font: `800 23px ${FONT_STACK}`, letterSpacing: "0.12em" }}>{day}</span>
                <span style={{ fontSize: 38, textAlign: "center" }}>{glyph}</span>
                <span style={{ font: `300 38px ${FONT_STACK}`, textAlign: "right" }}>{temp}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- market ticker strip ----------------
const MarketTicker: React.FC<{ p: NewsBroadcastProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const rows = p.items ?? [];
  return (
    <AbsoluteFill>
      <BroadcastBackground pal={pal} />
      <NetworkRail label={p.label} pal={pal} />
      <div style={{ position: "absolute", top: 170, left: 90, right: 90 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", color: pal.text }}>
          <div>
            <div style={{ font: `800 22px ${FONT_STACK}`, color: pal.secondary, letterSpacing: "0.24em", textTransform: "uppercase" }}>{p.subheadline}</div>
            <div style={{ marginTop: 14, font: `900 70px ${CONDENSED_STACK}`, letterSpacing: "-0.025em" }}>{p.headline}</div>
          </div>
          <div style={{ font: `300 82px ${FONT_STACK}`, color: pal.accent }}>{p.value}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18, marginTop: 64 }}>
          {rows.map((item, i) => {
            const [symbol, price, change = "+0.0%"] = splitFields(item);
            const down = change.startsWith("-");
            const t = clampInterp(frame, [7 + i * 4, 22 + i * 4], [0, 1]);
            return (
              <div key={`${symbol}-${i}`} style={{ height: 105, padding: "0 28px", display: "grid", gridTemplateColumns: "1fr 1fr 170px", alignItems: "center", color: pal.text, background: `${pal.text}0c`, border: `1px solid ${pal.text}20`, transform: `scaleX(${t})`, transformOrigin: i % 2 ? "right" : "left" }}>
                <span style={{ font: `900 29px ${FONT_STACK}`, letterSpacing: "0.08em" }}>{symbol}</span>
                <span style={{ font: `400 31px ${FONT_STACK}`, textAlign: "right" }}>{price}</span>
                <span style={{ justifySelf: "end", minWidth: 135, padding: "10px 16px", borderRadius: 6, textAlign: "center", background: down ? "#bd2637" : "#168966", font: `800 22px ${FONT_STACK}` }}>
                  {down ? "▼" : "▲"} {change}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 94, display: "flex", alignItems: "center", overflow: "hidden", background: pal.primary, color: pal.text }}>
        <div style={{ padding: "0 38px", alignSelf: "stretch", display: "flex", alignItems: "center", background: pal.accent, font: `900 20px ${FONT_STACK}`, letterSpacing: "0.16em" }}>MARKETS</div>
        <div style={{ whiteSpace: "nowrap", transform: `translateX(${-((frame * 4) % 1100)}px)`, font: `700 25px ${FONT_STACK}` }}>{`${rows.join("     •     ")}     •     ${rows.join("     •     ")}`}</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- election-style results board ----------------
const ElectionResults: React.FC<{ p: NewsBroadcastProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const candidates = p.items ?? [];
  return (
    <AbsoluteFill>
      <BroadcastBackground pal={pal} tone="light" />
      <NetworkRail label={p.label} pal={pal} dark={false} />
      <div style={{ position: "absolute", left: 100, right: 100, top: 165, color: "#111722" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", paddingBottom: 28, borderBottom: "3px solid #111722" }}>
          <div>
            <div style={{ font: `900 25px ${FONT_STACK}`, color: pal.accent, letterSpacing: "0.22em", textTransform: "uppercase" }}>{p.subheadline}</div>
            <div style={{ marginTop: 12, font: `900 66px ${CONDENSED_STACK}`, textTransform: "uppercase" }}>{p.headline}</div>
          </div>
          <div style={{ padding: "15px 22px", background: "#111722", color: "white", font: `800 20px ${FONT_STACK}`, letterSpacing: "0.15em" }}>{p.value}</div>
        </div>
        <div style={{ marginTop: 34 }}>
          {candidates.map((item, i) => {
            const [candidate, rawPercent = "0", status = ""] = splitFields(item);
            const percent = Math.max(0, Math.min(100, Number.parseFloat(rawPercent) || 0));
            const barColor = i % 2 === 0 ? pal.primary : pal.accent;
            const width = clampInterp(frame, [12 + i * 9, 42 + i * 9], [0, percent]);
            return (
              <div key={`${candidate}-${i}`} style={{ marginBottom: 27, padding: "25px 30px", background: "#ffffff", boxShadow: "0 8px 24px #14203816" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 230px", alignItems: "baseline" }}>
                  <span style={{ font: `800 37px ${FONT_STACK}` }}>{candidate}</span>
                  <span style={{ font: `900 48px ${FONT_STACK}`, textAlign: "right" }}>{rawPercent}%</span>
                  <span style={{ font: `800 19px ${FONT_STACK}`, color: barColor, textAlign: "right", letterSpacing: "0.12em", textTransform: "uppercase" }}>{status}</span>
                </div>
                <div style={{ height: 17, marginTop: 18, background: "#e2e6eb" }}>
                  <div style={{ width: `${width}%`, height: "100%", background: barColor }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- press-conference title frame ----------------
const PressConference: React.FC<{ p: NewsBroadcastProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const draw = clampInterp(frame, [6, 34], [0, 1]);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(115deg, ${pal.bg}, ${pal.primary}77)`, color: pal.text, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: "63%", top: "45%", width: 700, height: 700, borderRadius: "50%", border: `2px solid ${pal.text}20`, transform: `translate(-50%, -50%) scale(${0.8 + draw * 0.2})` }} />
      <div style={{ position: "absolute", left: "63%", top: "45%", width: 480, height: 480, borderRadius: "50%", border: `30px double ${pal.text}12`, transform: "translate(-50%, -50%)", display: "flex", alignItems: "center", justifyContent: "center", color: `${pal.text}16`, font: `900 150px ${FONT_STACK}` }}>◆</div>
      <NetworkRail label={p.label} pal={pal} />
      <div style={{ position: "absolute", left: 120, top: 220, width: Math.min(width * 0.55, 1000) }}>
        <div style={{ display: "inline-block", padding: "13px 22px", background: pal.accent, font: `900 21px ${FONT_STACK}`, letterSpacing: "0.22em", textTransform: "uppercase", opacity: clampInterp(frame, [2, 12], [0, 1]) }}>{p.subheadline}</div>
        <div style={{ marginTop: 35, font: `900 89px/0.98 ${CONDENSED_STACK}`, letterSpacing: "-0.025em", textTransform: "uppercase", clipPath: `inset(0 ${100 - draw * 100}% 0 0)` }}>{p.headline}</div>
        <div style={{ marginTop: 42, display: "flex", gap: 26, alignItems: "center", font: `500 29px ${FONT_STACK}`, color: `${pal.text}aa`, opacity: clampInterp(frame, [30, 43], [0, 1]) }}>
          <div style={{ width: 75, height: 5, background: pal.secondary }} />
          {p.location}
        </div>
      </div>
      <div style={{ position: "absolute", right: 220, bottom: 0, width: 260, height: 320, background: "#090c12", clipPath: "polygon(19% 0, 81% 0, 100% 100%, 0 100%)" }}>
        <div style={{ width: 140, height: 26, margin: "52px auto 0", background: "#1c222c", borderTop: `5px solid ${pal.accent}` }} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 18, background: pal.accent, transform: `scaleX(${draw})`, transformOrigin: "left" }} />
    </AbsoluteFill>
  );
};

// ---------------- morning-show segment card ----------------
const MorningShow: React.FC<{ p: NewsBroadcastProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 13, stiffness: 110 } });
  return (
    <AbsoluteFill style={{ overflow: "hidden", color: "#20212a" }}>
      <BroadcastBackground pal={pal} tone="warm" />
      <div style={{ position: "absolute", width: 760, height: 760, borderRadius: "50%", right: -110, top: -280, background: pal.accent, opacity: 0.9, transform: `scale(${0.9 + Math.sin(frame * 0.025) * 0.03})` }} />
      {Array.from({ length: 12 }, (_, i) => (
        <div key={`ray-${i}`} style={{ position: "absolute", width: 10, height: 220, right: 264, top: 326, background: `${pal.accent}55`, transformOrigin: "50% -215px", transform: `rotate(${i * 30 + frame * 0.08}deg)` }} />
      ))}
      <div style={{ position: "absolute", left: 90, top: 72, font: `900 23px ${FONT_STACK}`, letterSpacing: "0.25em", textTransform: "uppercase", color: pal.primary }}>{p.label}</div>
      <div style={{ position: "absolute", left: 90, top: 190, width: 1120, minHeight: 610, padding: "70px 74px", background: "#ffffffed", boxShadow: "0 35px 100px #9e672b33", transform: `translateY(${interpolate(pop, [0, 1], [650, 0])}px) rotate(${interpolate(pop, [0, 1], [3, 0])}deg)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, color: pal.accent, font: `900 22px ${FONT_STACK}`, letterSpacing: "0.2em", textTransform: "uppercase" }}><span style={{ fontSize: 32 }}>☀</span>{p.subheadline}</div>
        <div style={{ marginTop: 30, font: `900 83px/0.98 ${CONDENSED_STACK}`, letterSpacing: "-0.025em" }}>{p.headline}</div>
        <div style={{ marginTop: 50, width: 120, height: 8, background: pal.primary }} />
        <div style={{ marginTop: 30, font: `500 28px/1.4 ${FONT_STACK}`, color: "#646773" }}>{p.title}</div>
        <div style={{ position: "absolute", right: 50, bottom: 40, font: `900 110px ${CONDENSED_STACK}`, color: `${pal.primary}12` }}>{p.value}</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- sports-desk split banner ----------------
const SportsDesk: React.FC<{ p: NewsBroadcastProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const teams = p.items ?? ["HOME|0", "AWAY|0"];
  const [leftName = "HOME", leftScore = "0"] = splitFields(teams[0] ?? "HOME|0");
  const [rightName = "AWAY", rightScore = "0"] = splitFields(teams[1] ?? "AWAY|0");
  const split = clampInterp(frame, [5, 30], [0, 1]);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#070b13", color: "white" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 50% 40%, #ffffff18, transparent 35%), repeating-linear-gradient(0deg, transparent 0 69px, #ffffff08 70px)" }} />
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "53%", background: `linear-gradient(120deg, ${pal.primary}, ${pal.bg})`, clipPath: "polygon(0 0, 100% 0, 82% 100%, 0 100%)", transform: `translateX(${(split - 1) * -100}%)` }} />
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "53%", background: `linear-gradient(240deg, ${pal.accent}, #25040b)`, clipPath: "polygon(18% 0, 100% 0, 100% 100%, 0 100%)", transform: `translateX(${(1 - split) * 100}%)` }} />
      <NetworkRail label={p.label} pal={pal} />
      <div style={{ position: "absolute", inset: "170px 110px 190px", display: "grid", gridTemplateColumns: "1fr 260px 1fr", alignItems: "center", textAlign: "center" }}>
        {[{ name: leftName, score: leftScore }, { name: rightName, score: rightScore }].map((team, i) => (
          <React.Fragment key={team.name}>
            {i === 1 && (
              <div style={{ order: 2, alignSelf: "center" }}>
                <div style={{ width: 120, height: 120, margin: "0 auto", borderRadius: "50%", border: "3px solid #ffffff55", display: "flex", alignItems: "center", justifyContent: "center", font: `900 30px ${FONT_STACK}` }}>VS</div>
              </div>
            )}
            <div style={{ order: i === 0 ? 1 : 3, opacity: clampInterp(frame, [18 + i * 5, 33 + i * 5], [0, 1]), transform: `translateY(${clampInterp(frame, [18 + i * 5, 33 + i * 5], [60, 0])}px)` }}>
              <div style={{ width: 138, height: 138, margin: "0 auto 26px", display: "flex", alignItems: "center", justifyContent: "center", border: "5px solid white", transform: i ? "rotate(45deg)" : undefined, font: `900 50px ${FONT_STACK}` }}><span style={{ transform: i ? "rotate(-45deg)" : undefined }}>●</span></div>
              <div style={{ font: `900 45px ${CONDENSED_STACK}`, letterSpacing: "0.12em" }}>{team.name}</div>
              <div style={{ marginTop: 16, font: `200 150px/1 ${FONT_STACK}` }}>{team.score}</div>
            </div>
          </React.Fragment>
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 132, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 90px", background: "#f4f5f6", color: "#10141c" }}>
        <div style={{ font: `900 35px ${FONT_STACK}` }}>{p.headline}</div>
        <div style={{ font: `700 22px ${FONT_STACK}`, color: pal.accent, letterSpacing: "0.14em", textTransform: "uppercase" }}>{p.subheadline}</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- closing headlines list ----------------
const ClosingHeadlines: React.FC<{ p: NewsBroadcastProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const items = p.items ?? [];
  const progress = clampInterp(frame, [0, durationInFrames], [0, 100]);
  return (
    <AbsoluteFill>
      <BroadcastBackground pal={pal} />
      <NetworkRail label={p.label} pal={pal} />
      <div style={{ position: "absolute", left: 120, right: 120, top: 165, bottom: 90, color: pal.text }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ font: `900 68px ${CONDENSED_STACK}`, textTransform: "uppercase" }}>{p.headline}</div>
          <div style={{ font: `500 23px ${FONT_STACK}`, color: pal.secondary, letterSpacing: "0.16em" }}>{p.subheadline}</div>
        </div>
        <div style={{ marginTop: 32, borderTop: `1px solid ${pal.text}44` }}>
          {items.map((item, i) => {
            const [headline, section = "TOP STORY"] = splitFields(item);
            const t = clampInterp(frame, [10 + i * 7, 26 + i * 7], [0, 1]);
            return (
              <div key={`${headline}-${i}`} style={{ minHeight: 135, display: "grid", gridTemplateColumns: "90px 1fr 230px", alignItems: "center", borderBottom: `1px solid ${pal.text}30`, opacity: t, transform: `translateX(${(1 - t) * 120}px)` }}>
                <span style={{ font: `300 30px ${FONT_STACK}`, color: pal.accent }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ font: `700 35px ${FONT_STACK}` }}>{headline}</span>
                <span style={{ justifySelf: "end", padding: "10px 15px", border: `1px solid ${pal.secondary}66`, font: `800 16px ${FONT_STACK}`, color: pal.secondary, letterSpacing: "0.13em", textTransform: "uppercase" }}>{section}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 10, width: `${progress}%`, background: pal.accent }} />
    </AbsoluteFill>
  );
};

const VARIANTS: Record<NewsVariant, React.FC<{ p: NewsBroadcastProps; pal: Palette }>> = {
  "breaking-news": BreakingNews,
  "lower-third": LowerThird,
  "anchor-intro": AnchorIntro,
  "weather-panel": WeatherPanel,
  "market-ticker": MarketTicker,
  "election-results": ElectionResults,
  "press-conference": PressConference,
  "morning-show": MorningShow,
  "sports-desk": SportsDesk,
  "closing-headlines": ClosingHeadlines,
};

export const NewsBroadcastTemplate: React.FC<NewsBroadcastProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? BreakingNews;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return (
    <AbsoluteFill style={{ fontFamily: FONT_STACK }}>
      <FadeEdges inFrames={8} outFrames={10}>
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}>
          <Variant p={props} pal={pal} />
        </div>
      </FadeEdges>
    </AbsoluteFill>
  );
};

const familyCast = (component: React.FC<NewsBroadcastProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "news-breaking-red-slab": familyCast(NewsBroadcastTemplate),
  "news-lower-third-ticker": familyCast(NewsBroadcastTemplate),
  "news-anchor-intro-card": familyCast(NewsBroadcastTemplate),
  "news-weather-big-temp": familyCast(NewsBroadcastTemplate),
  "news-market-ticker-strip": familyCast(NewsBroadcastTemplate),
  "news-election-results-board": familyCast(NewsBroadcastTemplate),
  "news-press-conference-frame": familyCast(NewsBroadcastTemplate),
  "news-morning-show-segment": familyCast(NewsBroadcastTemplate),
  "news-sports-desk-split": familyCast(NewsBroadcastTemplate),
  "news-closing-headlines-list": familyCast(NewsBroadcastTemplate),
};
