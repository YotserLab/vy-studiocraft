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
 * FAMILY: calendars-events
 * Ten structurally distinct date and event announcement systems.
 */

type CalendarEventVariant =
  | "page-flip"
  | "date-numeral"
  | "event-card"
  | "save-the-date"
  | "conference-badge"
  | "webinar-banner"
  | "festival-lineup"
  | "countdown"
  | "ticket-stub"
  | "week-grid";

export interface CalendarEventProps {
  variant: CalendarEventVariant;
  title: string;
  date: string;
  time: string;
  venue: string;
  paletteName: string;
}

const SANS = '"Inter", "Helvetica Neue", Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';

type VariantProps = { p: CalendarEventProps; pal: Palette };

const dateParts = (date: string): { month: string; day: string; year: string } => {
  const clean = date.replace(/,/g, " ").trim().split(/\s+/).filter(Boolean);
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const monthToken = clean.find((token) => months.some((month) => token.toUpperCase().startsWith(month)));
  const dayToken = clean.find((token) => /^\d{1,2}(?:ST|ND|RD|TH)?$/i.test(token));
  const yearToken = clean.find((token) => /^\d{4}$/.test(token));
  return {
    month: (monthToken ?? clean[0] ?? "DATE").slice(0, 9).toUpperCase(),
    day: (dayToken ?? clean[1] ?? "01").replace(/\D/g, "") || "01",
    year: yearToken ?? clean.at(-1) ?? "",
  };
};

const MetaLine: React.FC<{
  label: string;
  value: string;
  color: string;
  borderColor: string;
}> = ({ label, value, color, borderColor }) => (
  <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 24, padding: "20px 0", borderTop: `1px solid ${borderColor}` }}>
    <span style={{ fontFamily: SANS, fontSize: 17, fontWeight: 800, letterSpacing: "0.18em", color, opacity: 0.56 }}>{label}</span>
    <span style={{ fontFamily: SANS, fontSize: 28, fontWeight: 650, color }}>{value}</span>
  </div>
);

// ---------------- tear-off calendar page flip ----------------
const PageFlip: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const parsed = dateParts(p.date);
  const cardIn = spring({ frame: Math.max(0, frame - 2), fps, config: { damping: 14, stiffness: 105, mass: 0.9 } });
  const turn = clampInterp(frame, [12, 40], [0, 1]);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", perspective: 1500 }}>
      <div style={{ position: "relative", width: 760, height: 720, transform: `translateY(${interpolate(cardIn, [0, 1], [120, 0])}px) scale(${interpolate(cardIn, [0, 1], [0.9, 1])})` }}>
        <div style={{ position: "absolute", inset: "24px -18px -18px 18px", borderRadius: 30, background: `${pal.primary}45` }} />
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 30, background: pal.text, boxShadow: `0 35px 90px ${pal.bg}99` }}>
          <div style={{ height: 126, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 58px", background: pal.primary, color: pal.bg }}>
            <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 34, letterSpacing: "0.18em" }}>{parsed.month}</span>
            <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 24 }}>{parsed.year}</span>
          </div>
          <div style={{ height: 594, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: pal.bg }}>
            <div style={{ fontFamily: SANS, fontSize: 280, lineHeight: 0.82, fontWeight: 950, letterSpacing: "-0.08em" }}>{parsed.day}</div>
            <div style={{ maxWidth: 600, marginTop: 48, fontFamily: SANS, fontSize: 36, lineHeight: 1.1, fontWeight: 850, textAlign: "center", textTransform: "uppercase" }}>{p.title}</div>
            <div style={{ marginTop: 25, fontFamily: SANS, fontSize: 22, color: pal.secondary, letterSpacing: "0.06em" }}>{p.time} · {p.venue}</div>
          </div>
        </div>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 30, background: pal.text, transformOrigin: "top center", transform: `rotateX(${-turn * 116}deg)`, opacity: clampInterp(turn, [0, 0.95, 1], [1, 0.85, 0]), backfaceVisibility: "hidden", boxShadow: `0 ${Math.round(turn * 36)}px 50px ${pal.bg}66` }}>
          <div style={{ height: 126, background: pal.accent }} />
          <div style={{ height: 594, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontSize: 280, lineHeight: 1, fontWeight: 950, color: pal.bg, opacity: 0.18 }}>{String(Math.max(1, Number(parsed.day) - 1)).padStart(2, "0")}</div>
        </div>
        <div style={{ position: "absolute", top: -18, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 74 }}>
          {Array.from({ length: 6 }, (_, i) => <div key={i} style={{ width: 22, height: 58, border: `7px solid ${pal.secondary}`, borderRadius: 20, background: pal.bg }} />)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- giant date numeral with month band ----------------
const DateNumeral: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const parsed = dateParts(p.date);
  const numeralX = clampInterp(frame, [4, 28], [-width * 0.42, 0]);
  const bandX = clampInterp(frame, [14, 36], [width, 0]);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 105, top: 62, fontFamily: MONO, fontSize: 22, letterSpacing: "0.2em", color: pal.secondary }}>{parsed.year} / EVENT NOTICE</div>
      <div style={{ position: "absolute", left: 70, bottom: -98, transform: `translateX(${numeralX}px)`, fontFamily: SANS, fontSize: 760, lineHeight: 0.9, fontWeight: 950, letterSpacing: "-0.1em", color: pal.text }}>{parsed.day}</div>
      <div style={{ position: "absolute", top: 248, right: 0, width: "58%", height: 150, display: "flex", alignItems: "center", paddingLeft: 70, transform: `translateX(${bandX}px)`, background: pal.accent, color: pal.bg, fontFamily: SANS, fontSize: 70, fontWeight: 950, letterSpacing: "0.16em" }}>{parsed.month}</div>
      <div style={{ position: "absolute", right: 110, top: 455, width: 700, opacity: clampInterp(frame, [34, 52], [0, 1]), transform: `translateY(${clampInterp(frame, [34, 52], [34, 0])}px)` }}>
        <div style={{ fontFamily: SANS, fontSize: 62, lineHeight: 1.04, fontWeight: 820, color: pal.text }}>{p.title}</div>
        <div style={{ width: 95, height: 6, margin: "32px 0", background: pal.primary }} />
        <div style={{ fontFamily: MONO, fontSize: 25, lineHeight: 1.8, color: pal.secondary }}>{p.time}<br />{p.venue}</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- event card with venue/time rows ----------------
const EventCard: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const s = spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 18, stiffness: 90 } });
  const x = interpolate(s, [0, 1], [width * 0.75, 0]);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ width: 1460, minHeight: 690, display: "grid", gridTemplateColumns: "34% 66%", overflow: "hidden", border: `1px solid ${pal.secondary}55`, borderRadius: 34, background: `${pal.bg}e8`, boxShadow: `0 40px 100px ${pal.bg}`, transform: `translateX(${x}px)` }}>
        <div style={{ position: "relative", padding: "76px 64px", background: pal.primary, color: pal.bg }}>
          <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 800, letterSpacing: "0.22em" }}>YOU'RE INVITED</div>
          <div style={{ position: "absolute", left: 55, bottom: 54, fontFamily: SANS, fontSize: 170, lineHeight: 0.84, fontWeight: 950, opacity: 0.18 }}>RS<br />VP</div>
          <div style={{ position: "absolute", left: 64, right: 64, top: 160, height: 3, background: `${pal.bg}66` }} />
        </div>
        <div style={{ padding: "66px 82px", color: pal.text }}>
          <div style={{ fontFamily: SANS, fontSize: 66, lineHeight: 1.05, fontWeight: 870, maxWidth: 760 }}>{p.title}</div>
          <div style={{ marginTop: 55 }}>
            <MetaLine label="DATE" value={p.date} color={pal.text} borderColor={`${pal.secondary}55`} />
            <MetaLine label="TIME" value={p.time} color={pal.text} borderColor={`${pal.secondary}55`} />
            <MetaLine label="VENUE" value={p.venue} color={pal.text} borderColor={`${pal.secondary}55`} />
          </div>
          <div style={{ marginTop: 34, display: "flex", alignItems: "center", gap: 16, fontFamily: MONO, fontSize: 17, color: pal.accent, letterSpacing: "0.12em" }}>
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: pal.accent }} /> ADD TO CALENDAR
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- save-the-date elegant serif ----------------
const SaveTheDate: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const lineWidth = clampInterp(frame, [5, 35], [0, 520]);
  const reveal = clampInterp(frame, [20, 48], [0, 1]);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", color: pal.text }}>
      <div style={{ position: "absolute", inset: 70, border: `1px solid ${pal.secondary}55` }} />
      <div style={{ position: "absolute", inset: 94, border: `1px solid ${pal.secondary}22` }} />
      {[0, 1, 2, 3].map((i) => {
        const left = i % 2 === 0 ? 72 : undefined;
        const right = i % 2 === 1 ? 72 : undefined;
        const top = i < 2 ? 72 : undefined;
        const bottom = i >= 2 ? 72 : undefined;
        return <div key={i} style={{ position: "absolute", left, right, top, bottom, width: 54, height: 54, borderTop: `3px solid ${pal.accent}`, borderLeft: `3px solid ${pal.accent}`, transform: `rotate(${i * 90}deg)` }} />;
      })}
      <div style={{ width: 1040, textAlign: "center", opacity: reveal, transform: `translateY(${(1 - reveal) * 24}px)` }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 34 }}>
          <div style={{ width: lineWidth, maxWidth: 260, height: 1, background: pal.secondary }} />
          <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 700, letterSpacing: "0.45em", color: pal.accent, whiteSpace: "nowrap" }}>SAVE THE DATE</div>
          <div style={{ width: lineWidth, maxWidth: 260, height: 1, background: pal.secondary }} />
        </div>
        <div style={{ marginTop: 62, fontFamily: SERIF, fontSize: 104, lineHeight: 1.02, fontStyle: "italic", fontWeight: 400 }}>{p.title}</div>
        <div style={{ margin: "55px auto 0", fontFamily: SERIF, fontSize: 38, letterSpacing: "0.16em", textTransform: "uppercase", color: pal.primary }}>{p.date}</div>
        <div style={{ marginTop: 34, fontFamily: SANS, fontSize: 21, letterSpacing: "0.2em", textTransform: "uppercase", color: pal.secondary }}>{p.time} · {p.venue}</div>
        <div style={{ margin: "48px auto 0", width: 12, height: 12, transform: "rotate(45deg)", background: pal.accent }} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------- conference badge reveal ----------------
const ConferenceBadge: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drop = spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 9, stiffness: 80, mass: 1.1 } });
  const rotate = interpolate(drop, [0, 1], [-11, 0]);
  return (
    <AbsoluteFill style={{ alignItems: "center", overflow: "hidden", perspective: 1200 }}>
      <div style={{ position: "absolute", top: -220, width: 46, height: 560, borderRadius: 30, background: `linear-gradient(90deg, ${pal.primary}, ${pal.secondary}, ${pal.primary})`, transform: `translateY(${interpolate(drop, [0, 1], [-280, 0])}px)` }} />
      <div style={{ position: "absolute", top: 280, width: 850, height: 650, borderRadius: 38, background: pal.text, color: pal.bg, boxShadow: `0 35px 100px ${pal.bg}aa`, overflow: "hidden", transform: `translateY(${interpolate(drop, [0, 1], [-900, 0])}px) rotateZ(${rotate}deg)` }}>
        <div style={{ height: 118, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 54px", background: pal.accent }}>
          <span style={{ fontFamily: MONO, fontSize: 22, fontWeight: 800, letterSpacing: "0.15em" }}>ALL ACCESS</span>
          <span style={{ fontFamily: MONO, fontSize: 20 }}>{p.date}</span>
        </div>
        <div style={{ padding: "48px 58px" }}>
          <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 800, letterSpacing: "0.3em", color: pal.primary }}>CONFERENCE BADGE</div>
          <div style={{ marginTop: 30, fontFamily: SANS, fontSize: 73, lineHeight: 0.98, fontWeight: 920, letterSpacing: "-0.035em" }}>{p.title}</div>
          <div style={{ marginTop: 42, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, fontFamily: SANS, fontSize: 23 }}>
            <div><div style={{ fontSize: 14, letterSpacing: "0.18em", color: pal.secondary }}>DOORS</div><div style={{ marginTop: 8, fontWeight: 800 }}>{p.time}</div></div>
            <div><div style={{ fontSize: 14, letterSpacing: "0.18em", color: pal.secondary }}>LOCATION</div><div style={{ marginTop: 8, fontWeight: 800 }}>{p.venue}</div></div>
          </div>
          <div style={{ marginTop: 46, height: 64, display: "flex", alignItems: "stretch", gap: 8 }}>
            {Array.from({ length: 36 }, (_, i) => <div key={i} style={{ width: i % 4 === 0 ? 9 : 4, background: pal.bg, opacity: 0.88 }} />)}
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 95, bottom: 62, fontFamily: MONO, fontSize: 18, color: pal.secondary, letterSpacing: "0.15em", opacity: clampInterp(frame, [40, 56], [0, 1]) }}>CHECK IN / CONNECT / CREATE</div>
    </AbsoluteFill>
  );
};

// ---------------- webinar banner with date chip ----------------
const WebinarBanner: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const fit = Math.min(1, width / 1920, height / 1080);
  const parsed = dateParts(p.date);
  const left = clampInterp(frame, [3, 27], [-1050, 0]);
  const chip = spring({ frame: Math.max(0, frame - 20), fps: 30, config: { damping: 12, stiffness: 130 } });
  const pulse = 0.65 + Math.sin(frame * 0.22) * 0.25;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ width: 1640, height: 650, display: "grid", gridTemplateColumns: "68% 32%", overflow: "hidden", borderRadius: 28, background: pal.text, color: pal.bg, boxShadow: `0 50px 120px ${pal.bg}`, transform: `scale(${fit})` }}> 
        <div style={{ position: "relative", padding: "68px 82px", transform: `translateX(${left}px)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: SANS, fontSize: 18, fontWeight: 900, letterSpacing: "0.2em", color: pal.accent }}>
            <span style={{ width: 13, height: 13, borderRadius: "50%", background: pal.accent, transform: `scale(${pulse})`, boxShadow: `0 0 0 10px ${pal.accent}22` }} /> LIVE WEBINAR
          </div>
          <div style={{ marginTop: 58, maxWidth: 900, overflowWrap: "anywhere", fontFamily: SANS, fontSize: 79, lineHeight: 1.02, fontWeight: 900, letterSpacing: "-0.035em" }}>{p.title}</div>
          <div style={{ position: "absolute", left: 82, bottom: 68, display: "flex", gap: 50, fontFamily: SANS, fontSize: 24, fontWeight: 700 }}>
            <span>{p.time}</span><span style={{ color: pal.secondary }}>{p.venue}</span>
          </div>
        </div>
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", background: pal.primary }}>
          <div style={{ width: 330, height: 390, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 28, border: `3px solid ${pal.bg}`, background: pal.bg, color: pal.text, transform: `scale(${interpolate(chip, [0, 1], [0.3, 1])}) rotate(${interpolate(chip, [0, 1], [12, -3])}deg)` }}>
            <div style={{ fontFamily: SANS, fontSize: 36, fontWeight: 900, letterSpacing: "0.2em", color: pal.accent }}>{parsed.month}</div>
            <div style={{ marginTop: 4, fontFamily: SANS, fontSize: 190, lineHeight: 0.95, fontWeight: 950, letterSpacing: "-0.08em" }}>{parsed.day}</div>
            <div style={{ marginTop: 18, fontFamily: MONO, fontSize: 22, color: pal.secondary }}>{parsed.year}</div>
          </div>
          <div style={{ position: "absolute", right: -40, top: -40, width: 170, height: 170, borderRadius: "50%", border: `35px solid ${pal.accent}66` }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- festival lineup stacked names ----------------
const FestivalLineup: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const acts = p.title.split(/\s*(?:\/|\||•)\s*/).filter(Boolean).slice(0, 5);
  return (
    <AbsoluteFill style={{ overflow: "hidden", padding: "70px 95px" }}>
      {Array.from({ length: 22 }, (_, i) => {
        const x = seededRand(i * 3 + 1) * 100;
        const y = (seededRand(i * 3 + 2) * 100 + frame * (0.08 + seededRand(i) * 0.12)) % 110;
        const rotation = seededRand(i * 7) * 180 + frame * 0.6;
        return <div key={i} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: 8 + seededRand(i + 90) * 24, height: 4, background: i % 2 ? pal.accent : pal.primary, opacity: 0.42, transform: `rotate(${rotation}deg)` }} />;
      })}
      <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: MONO, fontSize: 19, letterSpacing: "0.17em", color: pal.secondary }}>
        <span>{p.date}</span><span>{p.time} / {p.venue}</span>
      </div>
      <div style={{ position: "relative", zIndex: 1, marginTop: 50, borderTop: `5px solid ${pal.accent}` }}>
        {acts.map((act, i) => {
          const t = clampInterp(frame, [8 + i * 8, 24 + i * 8], [0, 1]);
          const outlined = i % 2 === 1;
          return (
            <div key={`${act}-${i}`} style={{ height: 155, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${pal.secondary}66`, transform: `translateX(${interpolate(t, [0, 1], [i % 2 ? width : -width, 0])}px)`, opacity: t }}>
              <span style={{ fontFamily: SANS, fontSize: acts.length > 4 ? 78 : 96, lineHeight: 1, fontWeight: 950, letterSpacing: "-0.045em", color: outlined ? "transparent" : pal.text, WebkitTextStroke: outlined ? `2px ${pal.text}` : undefined, textTransform: "uppercase" }}>{act}</span>
              <span style={{ fontFamily: MONO, fontSize: 17, color: i === 0 ? pal.accent : pal.secondary }}>0{i + 1}</span>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", right: 95, bottom: 35, zIndex: 1, fontFamily: SANS, fontWeight: 950, fontSize: 44, letterSpacing: "0.06em", color: pal.primary }}>ONE NIGHT ONLY</div>
    </AbsoluteFill>
  );
};

// ---------------- countdown-to-event hybrid ----------------
const Countdown: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const fit = Math.min(1, width / 1920, height / 1080);
  const phase = Math.min(3, Math.floor(frame / 14));
  const number = Math.max(1, 3 - phase);
  const local = frame % 14;
  const numberScale = clampInterp(local, [0, 11], [1.45, 0.75]);
  const card = spring({ frame: Math.max(0, frame - 44), fps, config: { damping: 14, stiffness: 100 } });
  const circumference = 2 * Math.PI * 205;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - clampInterp(card, [0, 0.7], [0, 1]), display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="520" height="520" style={{ position: "absolute", transform: "rotate(-90deg)" }}>
          <circle cx="260" cy="260" r="205" fill="none" stroke={`${pal.secondary}44`} strokeWidth="9" />
          <circle cx="260" cy="260" r="205" fill="none" stroke={pal.accent} strokeWidth="9" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (local / 14)} />
        </svg>
        <div style={{ fontFamily: SANS, fontSize: 300, lineHeight: 1, fontWeight: 950, color: pal.text, transform: `scale(${numberScale})` }}>{number}</div>
        <div style={{ position: "absolute", bottom: 165, fontFamily: MONO, fontSize: 19, letterSpacing: "0.3em", color: pal.secondary }}>COUNTDOWN TO EVENT</div>
      </div>
      <div style={{ width: 1420, height: 610, display: "grid", gridTemplateColumns: "40% 60%", overflow: "hidden", borderRadius: 42, background: pal.text, color: pal.bg, opacity: clampInterp(card, [0.05, 0.7], [0, 1]), transform: `scale(${fit * interpolate(card, [0, 1], [0.65, 1])})` }}> 
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: pal.accent }}>
          <div style={{ fontFamily: SANS, fontSize: 28, fontWeight: 900, letterSpacing: "0.25em" }}>IT'S TIME</div>
          <div style={{ marginTop: 32, fontFamily: MONO, fontSize: 30, textAlign: "center", maxWidth: 430 }}>{p.date}</div>
        </div>
        <div style={{ padding: "84px 80px" }}>
          <div style={{ maxWidth: "100%", overflowWrap: "anywhere", fontFamily: SANS, fontSize: 78, lineHeight: 1.02, fontWeight: 930 }}>{p.title}</div>
          <div style={{ marginTop: 68, height: 2, width: 140, background: pal.primary }} />
          <div style={{ marginTop: 35, fontFamily: SANS, fontSize: 27, fontWeight: 700 }}>{p.time}</div>
          <div style={{ marginTop: 13, fontFamily: SANS, fontSize: 24, color: pal.secondary }}>{p.venue}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- ticket stub with perforation dots ----------------
const TicketStub: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const fit = Math.min(1, width / 1920, height / 1080);
  const parsed = dateParts(p.date);
  const s = spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 12, stiffness: 85 } });
  const ticketColor = pal.text;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", perspective: 1300 }}>
      <div style={{ position: "relative", width: 1580, height: 560, display: "grid", gridTemplateColumns: "72% 28%", background: ticketColor, color: pal.bg, boxShadow: `0 38px 100px ${pal.bg}bb`, transform: `scale(${fit}) translateY(${interpolate(s, [0, 1], [600, 0])}px) rotateX(${interpolate(s, [0, 1], [28, 0])}deg) rotateZ(-2deg)` }}>
        {Array.from({ length: 27 }, (_, i) => <div key={`top-${i}`} style={{ position: "absolute", top: -10, left: 15 + i * 60, width: 20, height: 20, borderRadius: "50%", background: pal.bg }} />)}
        {Array.from({ length: 27 }, (_, i) => <div key={`bottom-${i}`} style={{ position: "absolute", bottom: -10, left: 15 + i * 60, width: 20, height: 20, borderRadius: "50%", background: pal.bg }} />)}
        <div style={{ padding: "68px 82px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 22, fontFamily: MONO, fontSize: 18, fontWeight: 800, letterSpacing: "0.2em", color: pal.accent }}><span style={{ width: 60, height: 5, background: pal.accent }} />ADMIT ONE</div>
          <div style={{ marginTop: 53, maxWidth: "100%", overflowWrap: "anywhere", fontFamily: SANS, fontSize: 88, lineHeight: 0.98, fontWeight: 950, letterSpacing: "-0.04em" }}>{p.title}</div>
          <div style={{ marginTop: 58, display: "flex", gap: 72, fontFamily: SANS }}>
            <div><div style={{ fontSize: 15, letterSpacing: "0.18em", color: pal.secondary }}>WHEN</div><div style={{ marginTop: 10, fontSize: 25, fontWeight: 800 }}>{p.date} · {p.time}</div></div>
            <div><div style={{ fontSize: 15, letterSpacing: "0.18em", color: pal.secondary }}>WHERE</div><div style={{ marginTop: 10, fontSize: 25, fontWeight: 800 }}>{p.venue}</div></div>
          </div>
        </div>
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: pal.primary, borderLeft: `4px dashed ${pal.bg}77` }}>
          <div style={{ position: "absolute", left: -23, top: -24, width: 44, height: 44, borderRadius: "50%", background: pal.bg }} />
          <div style={{ position: "absolute", left: -23, bottom: -24, width: 44, height: 44, borderRadius: "50%", background: pal.bg }} />
          <div style={{ fontFamily: SANS, fontSize: 34, fontWeight: 900, letterSpacing: "0.18em" }}>{parsed.month}</div>
          <div style={{ fontFamily: SANS, fontSize: 170, lineHeight: 0.95, fontWeight: 950 }}>{parsed.day}</div>
          <div style={{ fontFamily: MONO, fontSize: 22 }}>{parsed.year}</div>
          <div style={{ marginTop: 42, fontFamily: MONO, fontSize: 16, writingMode: "vertical-rl", letterSpacing: "0.17em" }}>NO. 026480</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- week-grid highlight cell ----------------
const WeekGrid: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const dates = [18, 19, 20, 21, 22, 23, 24];
  const active = 4;
  const highlight = clampInterp(frame, [28, 50], [0, 1]);
  return (
    <AbsoluteFill style={{ padding: "72px 90px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: "0.22em", color: pal.accent }}>WEEKLY SCHEDULE</div>
          <div style={{ marginTop: 18, fontFamily: SANS, fontSize: 52, fontWeight: 900, color: pal.text }}>{p.date}</div>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 18, color: pal.secondary }}>WEEK 34 / 2026</div>
      </div>
      <div style={{ marginTop: 55, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderTop: `1px solid ${pal.secondary}55`, borderLeft: `1px solid ${pal.secondary}55` }}>
        {days.map((day, i) => {
          const t = clampInterp(frame, [5 + i * 4, 18 + i * 4], [0, 1]);
          const selected = i === active;
          return (
            <div key={day} style={{ position: "relative", height: 480, padding: "28px 24px", overflow: "hidden", borderRight: `1px solid ${pal.secondary}55`, borderBottom: `1px solid ${pal.secondary}55`, background: selected ? `linear-gradient(180deg, ${pal.accent} ${highlight * 100}%, transparent ${highlight * 100}%)` : "transparent", opacity: t, transform: `translateY(${(1 - t) * 35}px)` }}>
              <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: "0.14em", color: selected && highlight > 0.55 ? pal.bg : pal.secondary }}>{day}</div>
              <div style={{ marginTop: 20, fontFamily: SANS, fontSize: 74, lineHeight: 1, fontWeight: 900, color: selected && highlight > 0.55 ? pal.bg : pal.text }}>{dates[i]}</div>
              {selected && <div style={{ position: "absolute", left: 24, right: 24, bottom: 28, color: pal.bg, opacity: clampInterp(frame, [44, 62], [0, 1]) }}>
                <div style={{ width: 38, height: 5, background: pal.bg, marginBottom: 18 }} />
                <div style={{ fontFamily: SANS, fontSize: 26, lineHeight: 1.1, fontWeight: 900 }}>{p.title}</div>
                <div style={{ marginTop: 13, fontFamily: MONO, fontSize: 15, lineHeight: 1.5 }}>{p.time}<br />{p.venue}</div>
              </div>}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const VARIANTS: Record<CalendarEventVariant, React.FC<VariantProps>> = {
  "page-flip": PageFlip,
  "date-numeral": DateNumeral,
  "event-card": EventCard,
  "save-the-date": SaveTheDate,
  "conference-badge": ConferenceBadge,
  "webinar-banner": WebinarBanner,
  "festival-lineup": FestivalLineup,
  countdown: Countdown,
  "ticket-stub": TicketStub,
  "week-grid": WeekGrid,
};

export const CalendarEventTemplate: React.FC<CalendarEventProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? EventCard;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 78% 18%, ${pal.primary}22, transparent 42%), radial-gradient(circle at 12% 88%, ${pal.accent}18, transparent 38%)` }} />
      <FadeEdges inFrames={9} outFrames={12}>
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}>
          <Variant p={props} pal={pal} />
        </div>
      </FadeEdges>
    </AbsoluteFill>
  );
};

const familyCast = (component: React.FC<CalendarEventProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "event-tear-off-page-flip": familyCast(CalendarEventTemplate),
  "event-giant-date-numeral": familyCast(CalendarEventTemplate),
  "event-venue-time-card": familyCast(CalendarEventTemplate),
  "event-save-the-date-serif": familyCast(CalendarEventTemplate),
  "event-conference-badge-reveal": familyCast(CalendarEventTemplate),
  "event-webinar-date-chip": familyCast(CalendarEventTemplate),
  "event-festival-lineup-stack": familyCast(CalendarEventTemplate),
  "event-countdown-hybrid": familyCast(CalendarEventTemplate),
  "event-ticket-stub-perforated": familyCast(CalendarEventTemplate),
  "event-week-grid-highlight": familyCast(CalendarEventTemplate),
};
