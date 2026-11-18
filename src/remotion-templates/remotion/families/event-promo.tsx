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
  NoiseGrainOverlay,
  clampInterp,
  resolvePalette,
  seededRand,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: event-promo
 * Ten asset-free event promotion compositions for conferences, webinars,
 * concerts, meetups, and launch events. Every layout accepts the same event
 * data so an agent can swap variants without rebuilding its content model.
 */

type EventPromoVariant =
  | "save-the-date"
  | "speaker-reveal"
  | "agenda-stack"
  | "venue-map"
  | "webinar-card"
  | "ticket-drop"
  | "lineup-grid"
  | "session-highlight"
  | "doors-open"
  | "event-recap";

export interface EventPromoProps {
  variant: EventPromoVariant;
  eventName: string;
  headline: string;
  subline: string;
  date: string;
  time: string;
  timezone: string;
  venue: string;
  address: string;
  ticketUrl: string;
  actionLabel: string;
  paletteName: string;
  speakers: string[];
  agenda: string[];
  stats: string[];
  logoUrl?: string;
  backgroundUrl?: string;
  accentLabel?: string;
}

type VariantProps = { p: EventPromoProps; pal: Palette };
const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';

const safeItems = (items: string[] | undefined, fallback: string[]): string[] =>
  items && items.length > 0 ? items : fallback;

const Icon: React.FC<{
  kind: "calendar" | "pin" | "ticket" | "play" | "arrow" | "clock" | "mic" | "spark";
  color: string;
  size?: number;
}> = ({ kind, color, size = 44 }) => {
  const common = {
    fill: "none",
    stroke: color,
    strokeWidth: 2.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      {kind === "calendar" && <><rect x="6" y="9" width="36" height="33" rx="4" {...common} /><path d="M6 18h36M15 5v8M33 5v8" {...common} /><path d="M14 26h5M24 26h5M34 26h1M14 34h5M24 34h5" {...common} /></>}
      {kind === "pin" && <><path d="M24 43S9 28.5 9 17.5a15 15 0 0130 0C39 28.5 24 43 24 43z" {...common} /><circle cx="24" cy="17" r="4.5" {...common} /></>}
      {kind === "ticket" && <path d="M6 14a5 5 0 005-5h26a5 5 0 005 5v5a5 5 0 010 10v5a5 5 0 00-5 5H11a5 5 0 00-5-5v-5a5 5 0 000-10zM24 10v28" {...common} />}
      {kind === "play" && <><circle cx="24" cy="24" r="18" {...common} /><path d="M20 16l11 8-11 8z" fill={color} stroke="none" /></>}
      {kind === "arrow" && <><path d="M8 24h31M27 12l12 12-12 12" {...common} /></>}
      {kind === "clock" && <><circle cx="24" cy="24" r="18" {...common} /><path d="M24 13v12l8 5" {...common} /></>}
      {kind === "mic" && <><rect x="17" y="6" width="14" height="25" rx="7" {...common} /><path d="M11 23a13 13 0 0026 0M24 36v7M17 43h14" {...common} /></>}
      {kind === "spark" && <><path d="M24 4l3.5 14.5L42 22l-14.5 3.5L24 40l-3.5-14.5L6 22l14.5-3.5z" {...common} /><path d="M39 7v7M35.5 10.5h7" {...common} /></>}
    </svg>
  );
};

const EventMark: React.FC<{ p: EventPromoProps; pal: Palette; dark?: boolean }> = ({ p, pal, dark = false }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, color: dark ? pal.bg : pal.text, fontFamily: FONT }}>
    {p.logoUrl ? <img src={p.logoUrl} alt="" style={{ width: 44, height: 44, borderRadius: 12, objectFit: "cover" }} /> : <div style={{ width: 44, height: 44, borderRadius: 13, display: "grid", placeItems: "center", background: dark ? pal.bg : pal.accent, color: dark ? pal.text : pal.bg, fontWeight: 950, fontSize: 22 }}>{(p.eventName || "E").slice(0, 1).toUpperCase()}</div>}
    <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: "0.04em" }}>{p.eventName}</span>
  </div>
);

const Eyebrow: React.FC<{ children: React.ReactNode; pal: Palette; dark?: boolean }> = ({ children, pal, dark = false }) => (
  <div style={{ color: dark ? `${pal.bg}99` : pal.secondary, fontFamily: MONO, fontSize: 16, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase" }}>{children}</div>
);

const EventMeta: React.FC<{ p: EventPromoProps; pal: Palette; dark?: boolean }> = ({ p, pal, dark = false }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 14, color: dark ? `${pal.bg}aa` : `${pal.text}aa`, fontFamily: FONT, fontSize: 19 }}>
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Icon kind="calendar" color={dark ? pal.bg : pal.accent} size={22} />{p.date}</span>
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Icon kind="clock" color={dark ? pal.bg : pal.accent} size={22} />{p.time} {p.timezone}</span>
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Icon kind="pin" color={dark ? pal.bg : pal.accent} size={22} />{p.venue}</span>
  </div>
);

const Button: React.FC<{ label: string; pal: Palette; dark?: boolean; progress?: number }> = ({ label, pal, dark = false, progress = 1 }) => (
  <div style={{ position: "relative", overflow: "hidden", display: "inline-flex", alignItems: "center", gap: 13, padding: "15px 22px", borderRadius: 999, background: dark ? pal.bg : pal.accent, color: dark ? pal.text : pal.bg, fontFamily: FONT, fontSize: 18, fontWeight: 900 }}>
    <span style={{ position: "absolute", inset: 0, width: `${progress * 100}%`, background: `${dark ? pal.text : pal.bg}16` }} />
    <span style={{ position: "relative" }}>{label}</span><Icon kind="arrow" color={dark ? pal.text : pal.bg} size={22} />
  </div>
);

const Poster: React.FC<{ p: EventPromoProps; pal: Palette; children: React.ReactNode; style?: React.CSSProperties }> = ({ p, pal, children, style }) => (
  <div style={{ position: "relative", overflow: "hidden", borderRadius: 28, background: `linear-gradient(145deg, ${pal.primary}2b, ${pal.bg} 56%, ${pal.accent}22)`, border: `1px solid ${pal.text}24`, boxShadow: `0 35px 100px ${pal.bg}99`, ...style }}>
    {p.backgroundUrl && <img src={p.backgroundUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.3, mixBlendMode: "screen" }} />}
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(120deg, ${pal.bg}dd, transparent 60%), radial-gradient(circle at 80% 15%, ${pal.accent}44, transparent 35%)` }} />
    <div style={{ position: "relative", height: "100%" }}>{children}</div>
  </div>
);

const SaveTheDate: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = Math.min(width / 1920, height / 1080);
  const reveal = spring({ frame: frame - 8, fps, config: { damping: 16, stiffness: 110 } });
  const line = clampInterp(frame, [18, 66], [0, 1]);
  return <AbsoluteFill style={{ padding: `${88 * s}px ${110 * s}px`, boxSizing: "border-box", fontFamily: FONT }}>
    <Poster p={p} pal={pal} style={{ width: "100%", height: "100%" }}><div style={{ padding: `${62 * s}px ${74 * s}px`, height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between", transform: `translateY(${interpolate(reveal, [0, 1], [60, 0])}px)`, opacity: reveal }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><EventMark p={p} pal={pal} /><div style={{ color: pal.accent, fontFamily: MONO, fontSize: 17 * s, fontWeight: 800 }}>01 / ANNOUNCEMENT</div></div>
      <div style={{ display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 60 * s, alignItems: "center" }}><div><Eyebrow pal={pal}>{p.accentLabel ?? "SAVE THE DATE"}</Eyebrow><div style={{ color: pal.text, fontSize: Math.min(width * 0.075, 116 * s), lineHeight: 0.9, fontWeight: 950, letterSpacing: "-0.065em", marginTop: 20 * s }}>{p.headline}</div><div style={{ color: `${pal.text}aa`, fontSize: 27 * s, lineHeight: 1.35, marginTop: 25 * s, maxWidth: 720 * s }}>{p.subline}</div><div style={{ marginTop: 34 * s }}><EventMeta p={p} pal={pal} /></div></div><div style={{ padding: `${38 * s}px`, borderRadius: 24 * s, background: `${pal.text}0d`, border: `1px solid ${pal.text}24`, textAlign: "center" }}><Icon kind="calendar" color={pal.accent} size={86 * s} /><div style={{ color: pal.text, fontSize: 68 * s, fontWeight: 950, marginTop: 18 * s, letterSpacing: "-0.06em" }}>{p.date}</div><div style={{ height: 5 * s, marginTop: 27 * s, borderRadius: 99, background: `${pal.text}16`, overflow: "hidden" }}><div style={{ width: `${line * 100}%`, height: "100%", background: `linear-gradient(90deg, ${pal.primary}, ${pal.accent})` }} /></div><div style={{ color: pal.secondary, fontFamily: MONO, fontSize: 16 * s, marginTop: 14 * s }}>{p.time} {p.timezone}</div></div></div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}><div style={{ color: `${pal.text}70`, fontFamily: MONO, fontSize: 15 * s }}>{p.venue} · {p.address}</div><Button label={p.actionLabel} pal={pal} progress={line} /></div>
    </div></Poster>
  </AbsoluteFill>;
};

const SpeakerReveal: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = Math.min(width / 1920, height / 1080);
  const names = safeItems(p.speakers, ["Maya Chen", "Jordan Lee", "Ari Patel"]);
  return <AbsoluteFill style={{ padding: `${86 * s}px ${112 * s}px`, boxSizing: "border-box", fontFamily: FONT }}><EventMark p={p} pal={pal} /><div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", margin: `${72 * s}px 0 ${38 * s}px` }}><div><Eyebrow pal={pal}>SPEAKER REVEAL</Eyebrow><div style={{ color: pal.text, fontSize: 82 * s, fontWeight: 950, letterSpacing: "-0.06em", marginTop: 14 * s }}>{p.headline}</div></div><div style={{ color: `${pal.text}75`, fontFamily: MONO, fontSize: 16 * s }}>MEET THE MINDS / 01—{String(names.length).padStart(2, "0")}</div></div><div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(3, names.length)}, 1fr)`, gap: 22 * s, height: 545 * s }}>{names.slice(0, 4).map((name, i) => { const inT = spring({ frame: frame - 10 - i * 10, fps, config: { damping: 14, stiffness: 110 } }); return <div key={name} style={{ position: "relative", overflow: "hidden", borderRadius: 22 * s, background: `linear-gradient(155deg, ${pal.primary}77, ${pal.bg} 62%, ${pal.accent}55)`, border: `1px solid ${pal.text}22`, transform: `translateY(${interpolate(inT, [0, 1], [100, 0])}px)`, opacity: inT }}><div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at ${35 + i * 18}% 27%, ${pal.secondary}88, transparent 25%), linear-gradient(150deg, transparent 35%, ${pal.bg}cc 85%)` }} /><div style={{ position: "absolute", left: "10%", right: "10%", bottom: "9%" }}><div style={{ color: pal.accent, fontFamily: MONO, fontSize: 14 * s, fontWeight: 800 }}>0{i + 1} / FEATURED</div><div style={{ color: pal.text, fontSize: 34 * s, lineHeight: 0.98, fontWeight: 900, marginTop: 10 * s }}>{name}</div><div style={{ color: `${pal.text}a0`, fontSize: 17 * s, marginTop: 9 * s }}>{safeItems(p.agenda, ["Future of work", "Designing change", "The next chapter"])[i % Math.max(1, safeItems(p.agenda, ["Future of work"]).length)]}</div></div><div style={{ position: "absolute", top: 20 * s, right: 20 * s, width: 46 * s, height: 46 * s, borderRadius: "50%", display: "grid", placeItems: "center", background: `${pal.text}19` }}><Icon kind="mic" color={pal.text} size={25 * s} /></div></div>; })}</div><div style={{ marginTop: 26 * s, color: `${pal.text}82`, fontSize: 22 * s }}>{p.subline} <span style={{ color: pal.accent }}>·</span> {p.date}</div></AbsoluteFill>;
};

const AgendaStack: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = Math.min(width / 1920, height / 1080);
  const items = safeItems(p.agenda, ["Opening keynote", "Designing for momentum", "Break / coffee", "The closing conversation"]);
  const active = Math.min(items.length - 1, Math.floor(frame / 40) % items.length);
  return <AbsoluteFill style={{ padding: `${90 * s}px ${125 * s}px`, boxSizing: "border-box", fontFamily: FONT }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><EventMark p={p} pal={pal} /><div style={{ color: pal.secondary, fontFamily: MONO, fontSize: 16 * s }}>AGENDA / {String(active + 1).padStart(2, "0")}</div></div><div style={{ display: "grid", gridTemplateColumns: ".75fr 1.25fr", gap: 90 * s, alignItems: "center", height: "78%" }}><div><Eyebrow pal={pal}>ONE DAY / MANY IDEAS</Eyebrow><div style={{ color: pal.text, fontSize: 78 * s, lineHeight: 0.95, fontWeight: 950, letterSpacing: "-0.06em", marginTop: 18 * s }}>{p.headline}</div><div style={{ color: `${pal.text}8f`, fontSize: 24 * s, lineHeight: 1.35, marginTop: 24 * s }}>{p.subline}</div><div style={{ marginTop: 34 * s }}><EventMeta p={p} pal={pal} /></div></div><div style={{ display: "flex", flexDirection: "column", gap: 12 * s }}>{items.slice(0, 6).map((item, i) => { const enter = spring({ frame: frame - 8 - i * 5, fps, config: { damping: 15, stiffness: 130 } }); const selected = i === active; return <div key={item} style={{ display: "grid", gridTemplateColumns: `${75 * s}px 1fr ${72 * s}px`, alignItems: "center", gap: 20 * s, padding: `${18 * s}px ${22 * s}px`, borderRadius: 16 * s, background: selected ? `${pal.accent}24` : `${pal.text}08`, border: `1px solid ${selected ? pal.accent : pal.text}30`, transform: `translateX(${interpolate(enter, [0, 1], [80, 0])}px)`, opacity: enter }}><div style={{ color: selected ? pal.accent : `${pal.text}65`, fontFamily: MONO, fontSize: 15 * s }}>0{i + 1}</div><div><div style={{ color: pal.text, fontSize: 23 * s, fontWeight: 800 }}>{item}</div><div style={{ color: `${pal.text}65`, fontSize: 15 * s, marginTop: 5 * s }}>{i % 2 ? "Workshop · Studio" : "Main stage · Hall A"}</div></div><div style={{ color: selected ? pal.accent : `${pal.text}65`, fontFamily: MONO, fontSize: 14 * s, textAlign: "right" }}>{`${String(9 + i).padStart(2, "0")}:30`}</div></div>; })}</div></div></AbsoluteFill>;
};

const VenueMap: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const s = Math.min(width / 1920, height / 1080);
  const draw = clampInterp(frame, [10, 68], [0, 1]);
  return <AbsoluteFill style={{ padding: `${78 * s}px ${108 * s}px`, boxSizing: "border-box", fontFamily: FONT }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><EventMark p={p} pal={pal} /><div style={{ color: pal.accent, fontFamily: MONO, fontSize: 15 * s }}>HOW TO FIND US</div></div><div style={{ display: "grid", gridTemplateColumns: ".65fr 1.35fr", gap: 50 * s, marginTop: 55 * s, height: "76%" }}><div style={{ alignSelf: "center" }}><Eyebrow pal={pal}>VENUE / LOCATION</Eyebrow><div style={{ color: pal.text, fontSize: 71 * s, lineHeight: 0.97, fontWeight: 950, letterSpacing: "-0.06em", marginTop: 18 * s }}>{p.venue}</div><div style={{ color: `${pal.text}9a`, fontSize: 23 * s, lineHeight: 1.35, marginTop: 22 * s }}>{p.address}</div><div style={{ marginTop: 34 * s }}><Button label={p.actionLabel} pal={pal} progress={draw} /></div></div><div style={{ position: "relative", overflow: "hidden", borderRadius: 28 * s, background: `${pal.text}08`, border: `1px solid ${pal.text}25` }}><div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${pal.text}10 1px, transparent 1px), linear-gradient(90deg, ${pal.text}10 1px, transparent 1px)`, backgroundSize: `${54 * s}px ${54 * s}px`, transform: `translate(${interpolate(draw, [0, 1], [40, 0])}px, ${interpolate(draw, [0, 1], [40, 0])}px)` }} /><svg viewBox="0 0 800 600" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}><path d="M55 520 C180 460 165 310 305 350 S410 125 545 220 S640 180 755 66" fill="none" stroke={pal.secondary} strokeWidth="16" opacity=".22" /><path d="M55 520 C180 460 165 310 305 350 S410 125 545 220 S640 180 755 66" fill="none" stroke={pal.accent} strokeWidth="6" strokeDasharray="1200" strokeDashoffset={1200 * (1 - draw)} /></svg>{[[55,520],[305,350],[545,220],[755,66]].map(([x,y], i) => <div key={i} style={{ position: "absolute", left: `${(x / 8)}%`, top: `${(y / 6)}%`, width: (18 + i * 3) * s, height: (18 + i * 3) * s, borderRadius: "50%", background: i === 3 ? pal.accent : pal.bg, border: `3px solid ${i === 3 ? pal.accent : pal.secondary}`, transform: `translate(-50%, -50%) scale(${clampInterp(frame, [18 + i * 8, 34 + i * 8], [0, 1])})` }} />)}<div style={{ position: "absolute", left: "72%", top: "8%", transform: `translate(-50%, -110%) scale(${clampInterp(frame, [48, 64], [0, 1])})` }}><Icon kind="pin" color={pal.accent} size={80 * s} /></div><div style={{ position: "absolute", right: 25 * s, bottom: 20 * s, padding: `${11 * s}px ${15 * s}px`, borderRadius: 9 * s, color: pal.text, background: `${pal.bg}dd`, fontFamily: MONO, fontSize: 13 * s }}>{p.venue.toUpperCase()} / MAP 01</div></div></div></AbsoluteFill>;
};

const WebinarCard: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = Math.min(width / 1920, height / 1080);
  const enter = spring({ frame: frame - 10, fps, config: { damping: 16, stiffness: 105 } });
  const host = safeItems(p.speakers, ["Maya Chen", "Jordan Lee"]);
  return <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT }}><Poster p={p} pal={pal} style={{ width: "82%", height: "78%" }}><div style={{ padding: `${52 * s}px ${62 * s}px`, height: "100%", boxSizing: "border-box", transform: `translateY(${interpolate(enter, [0, 1], [80, 0])}px)`, opacity: enter }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><EventMark p={p} pal={pal} /><div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 999, background: `${pal.accent}25`, color: pal.accent, fontFamily: MONO, fontSize: 14 * s, fontWeight: 800 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: pal.accent }} /> LIVE WEBINAR</div></div><div style={{ display: "grid", gridTemplateColumns: ".9fr 1.1fr", gap: 44 * s, marginTop: 50 * s }}><div><Eyebrow pal={pal}>ONLINE SESSION</Eyebrow><div style={{ color: pal.text, fontSize: 64 * s, lineHeight: .97, fontWeight: 950, letterSpacing: "-0.06em", marginTop: 17 * s }}>{p.headline}</div><div style={{ color: `${pal.text}91`, fontSize: 23 * s, lineHeight: 1.35, marginTop: 22 * s }}>{p.subline}</div><div style={{ marginTop: 30 * s }}><EventMeta p={p} pal={pal} /></div><div style={{ marginTop: 32 * s }}><Button label={p.actionLabel} pal={pal} progress={clampInterp(frame, [12, 50], [0, 1])} /></div></div><div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 * s }}>{host.slice(0, 4).map((name, i) => <div key={name} style={{ minHeight: 180 * s, borderRadius: 18 * s, background: `linear-gradient(145deg, ${pal.primary}66, ${pal.text}0a)`, border: `1px solid ${pal.text}22`, padding: 18 * s, display: "flex", flexDirection: "column", justifyContent: "end" }}><div style={{ width: 62 * s, height: 62 * s, borderRadius: "50%", background: `radial-gradient(circle at 35% 25%, ${pal.secondary}, ${pal.primary})`, marginBottom: "auto" }} /><div style={{ color: pal.text, fontSize: 18 * s, fontWeight: 850 }}>{name}</div><div style={{ color: pal.secondary, fontFamily: MONO, fontSize: 12 * s, marginTop: 5 * s }}>HOST / SPEAKER</div></div>)}</div></div></div></Poster></AbsoluteFill>;
};

const TicketDrop: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = Math.min(width / 1920, height / 1080);
  const enter = spring({ frame: frame - 8, fps, config: { damping: 14, stiffness: 100 } });
  const barcode = clampInterp(frame, [22, 62], [0, 1]);
  return <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT }}><div style={{ width: "78%", maxWidth: 1450 * s, display: "flex", filter: `drop-shadow(0 35px 45px ${pal.bg}aa)`, transform: `translateY(${interpolate(enter, [0, 1], [120, 0])}px) rotate(${interpolate(enter, [0, 1], [-3, 0])}deg)`, opacity: enter }}><div style={{ flex: 1, minHeight: 470 * s, padding: `${54 * s}px ${65 * s}px`, boxSizing: "border-box", background: pal.text, color: pal.bg, borderRadius: `${25 * s}px 0 0 ${25 * s}px` }}><div style={{ display: "flex", justifyContent: "space-between" }}><EventMark p={p} pal={pal} dark /><div style={{ color: `${pal.bg}70`, fontFamily: MONO, fontSize: 14 * s }}>GENERAL ADMISSION</div></div><div style={{ marginTop: 65 * s, color: pal.bg, fontSize: 70 * s, lineHeight: .94, fontWeight: 950, letterSpacing: "-0.06em", maxWidth: 760 * s }}>{p.headline}</div><div style={{ marginTop: 30 * s }}><EventMeta p={p} pal={pal} dark /></div><div style={{ marginTop: 42 * s, display: "flex", justifyContent: "space-between", alignItems: "end" }}><div><div style={{ color: `${pal.bg}70`, fontFamily: MONO, fontSize: 13 * s }}>ENTRY / {p.date}</div><div style={{ color: pal.bg, fontSize: 27 * s, fontWeight: 850, marginTop: 6 * s }}>{p.actionLabel}</div></div><div style={{ color: pal.accent, fontSize: 36 * s, fontWeight: 950 }}>{p.ticketUrl}</div></div></div><div style={{ width: 220 * s, minHeight: 470 * s, padding: `${54 * s}px 28px`, boxSizing: "border-box", background: pal.accent, color: pal.bg, borderRadius: `0 ${25 * s}px ${25 * s}px 0`, borderLeft: `3px dashed ${pal.bg}55`, display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center" }}><Icon kind="ticket" color={pal.bg} size={58 * s} /><div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontFamily: MONO, fontSize: 15 * s, fontWeight: 900, letterSpacing: "0.12em" }}>TICKET DROP / RSVP NOW</div><div style={{ width: 110 * s, height: 150 * s, display: "flex", flexDirection: "column", gap: 4 * s, overflow: "hidden", opacity: barcode }}>{Array.from({ length: 24 }, (_, i) => <div key={i} style={{ height: 3 * s, width: `${35 + seededRand(i) * 65}%`, background: pal.bg, marginLeft: `${seededRand(i + 20) * 30}%` }} />)}</div></div></div></AbsoluteFill>;
};

const LineupGrid: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = Math.min(width / 1920, height / 1080);
  const names = safeItems(p.speakers, ["Maya Chen", "Jordan Lee", "Ari Patel", "Noah Kim", "Rae Morgan", "Sol Diaz"]);
  return <AbsoluteFill style={{ padding: `${78 * s}px ${110 * s}px`, boxSizing: "border-box", fontFamily: FONT }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><EventMark p={p} pal={pal} /><div style={{ color: pal.accent, fontFamily: MONO, fontSize: 15 * s }}>THE LINEUP / {names.length} NAMES</div></div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", margin: `${54 * s}px 0 ${30 * s}px` }}><div><Eyebrow pal={pal}>THE PEOPLE MAKING IT HAPPEN</Eyebrow><div style={{ color: pal.text, fontSize: 67 * s, fontWeight: 950, letterSpacing: "-0.06em", marginTop: 12 * s }}>{p.headline}</div></div><div style={{ color: `${pal.text}75`, fontSize: 20 * s }}>{p.subline}</div></div><div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 15 * s }}>{names.slice(0, 6).map((name, i) => { const t = spring({ frame: frame - i * 7, fps, config: { damping: 14, stiffness: 120 } }); return <div key={name} style={{ display: "flex", alignItems: "center", gap: 17 * s, padding: `${17 * s}px`, borderRadius: 17 * s, background: `${pal.text}0b`, border: `1px solid ${pal.text}1f`, transform: `translateY(${interpolate(t, [0, 1], [70, 0])}px)`, opacity: t }}><div style={{ width: 72 * s, height: 72 * s, flex: `0 0 ${72 * s}px`, borderRadius: 17 * s, background: `radial-gradient(circle at 35% 25%, ${pal.secondary}, ${pal.primary} 62%, ${pal.accent})` }} /><div style={{ minWidth: 0 }}><div style={{ color: pal.text, fontSize: 21 * s, fontWeight: 850, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div><div style={{ color: pal.secondary, fontFamily: MONO, fontSize: 12 * s, marginTop: 6 * s }}>SPEAKER / 0{i + 1}</div></div></div>; })}</div></AbsoluteFill>;
};

const SessionHighlight: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = Math.min(width / 1920, height / 1080);
  const rise = spring({ frame: frame - 12, fps, config: { damping: 15, stiffness: 105 } });
  const names = safeItems(p.speakers, ["Maya Chen"]);
  const agenda = safeItems(p.agenda, ["Designing for momentum", "Opening keynote", "The next chapter"]);
  return <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT }}><div style={{ width: "76%", display: "grid", gridTemplateColumns: ".8fr 1.2fr", minHeight: 510 * s, borderRadius: 27 * s, overflow: "hidden", background: pal.text, color: pal.bg, transform: `translateY(${interpolate(rise, [0, 1], [120, 0])}px)`, opacity: rise, boxShadow: `0 35px 90px ${pal.bg}bb` }}><div style={{ padding: `${55 * s}px`, background: `linear-gradient(150deg, ${pal.primary}, ${pal.accent})`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}><div><Eyebrow pal={pal} dark>SESSION HIGHLIGHT</Eyebrow><div style={{ color: pal.bg, fontSize: 60 * s, lineHeight: .95, fontWeight: 950, letterSpacing: "-0.06em", marginTop: 20 * s }}>{p.headline}</div></div><div><div style={{ color: `${pal.bg}a5`, fontFamily: MONO, fontSize: 14 * s }}>WITH {names[0].toUpperCase()}</div><div style={{ color: pal.bg, fontSize: 25 * s, fontWeight: 850, marginTop: 8 * s }}>{p.date} · {p.time}</div></div></div><div style={{ padding: `${55 * s}px`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}><div><EventMark p={p} pal={pal} dark /><div style={{ color: `${pal.bg}70`, fontSize: 20 * s, lineHeight: 1.4, marginTop: 28 * s }}>{p.subline}</div><div style={{ marginTop: 30 * s, display: "flex", flexDirection: "column", gap: 12 * s }}>{agenda.slice(0, 3).map((item, i) => <div key={item} style={{ display: "flex", alignItems: "center", gap: 12 * s, color: `${pal.bg}a0`, fontSize: 19 * s }}><span style={{ color: pal.accent, fontFamily: MONO }}>0{i + 1}</span>{item}</div>)}</div></div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}><div style={{ color: `${pal.bg}66`, fontFamily: MONO, fontSize: 14 * s }}>{p.venue}</div><div style={{ color: pal.accent, fontSize: 24 * s, fontWeight: 900 }}>{p.actionLabel} →</div></div></div></div></AbsoluteFill>;
};

const DoorsOpen: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const s = Math.min(width / 1920, height / 1080);
  const pulse = clampInterp(frame % 48, [0, 24, 48], [0, 1, 0]);
  const stages = ["DOORS OPEN", "WELCOME DRINK", "FIRST SESSION", "AFTER HOURS"];
  return <AbsoluteFill style={{ padding: `${92 * s}px ${125 * s}px`, boxSizing: "border-box", fontFamily: FONT }}><div style={{ display: "flex", justifyContent: "space-between" }}><EventMark p={p} pal={pal} /><div style={{ color: pal.accent, fontFamily: MONO, fontSize: 17 * s }}>TODAY / LIVE</div></div><div style={{ display: "grid", gridTemplateColumns: ".8fr 1.2fr", gap: 100 * s, alignItems: "center", height: "78%" }}><div><Eyebrow pal={pal}>THE DAY IS HERE</Eyebrow><div style={{ color: pal.text, fontSize: 86 * s, lineHeight: .9, fontWeight: 950, letterSpacing: "-0.07em", marginTop: 19 * s }}>{p.headline}</div><div style={{ color: `${pal.text}8c`, fontSize: 24 * s, lineHeight: 1.4, marginTop: 26 * s }}>{p.subline}</div><div style={{ marginTop: 34 * s, display: "inline-flex", alignItems: "center", gap: 12 * s, padding: `${15 * s}px ${20 * s}px`, borderRadius: 14 * s, border: `1px solid ${pal.accent}66`, color: pal.accent, fontFamily: MONO, fontSize: 16 * s, boxShadow: `0 0 ${pulse * 24}px ${pal.accent}55` }}><Icon kind="clock" color={pal.accent} size={25 * s} />{p.time} · {p.timezone}</div></div><div style={{ position: "relative", paddingLeft: 70 * s }}>{stages.map((stage, i) => { const progress = clampInterp(frame, [12 + i * 12, 34 + i * 12], [0, 1]); return <div key={stage} style={{ position: "relative", display: "flex", alignItems: "center", gap: 24 * s, minHeight: 87 * s, opacity: 0.42 + progress * .58 }}><div style={{ position: "absolute", left: -39 * s, top: i === 0 ? "50%" : 0, bottom: i === stages.length - 1 ? "50%" : 0, width: 2 * s, background: pal.accent, opacity: .45 }} /><div style={{ position: "relative", zIndex: 1, width: 22 * s, height: 22 * s, marginLeft: -50 * s, borderRadius: "50%", background: i === 0 ? pal.accent : pal.bg, border: `3px solid ${pal.accent}`, boxShadow: i === 0 ? `0 0 ${18 + pulse * 12}px ${pal.accent}` : undefined }} /><div><div style={{ color: i === 0 ? pal.accent : pal.text, fontFamily: MONO, fontSize: 13 * s }}>0{i + 1} / {`${String(9 + i * 2).padStart(2, "0")}:00`}</div><div style={{ color: pal.text, fontSize: 26 * s, fontWeight: 850, marginTop: 5 * s }}>{stage}</div></div></div>; })}</div></div></AbsoluteFill>;
};

const EventRecap: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = Math.min(width / 1920, height / 1080);
  const rise = spring({ frame: frame - 8, fps, config: { damping: 14, stiffness: 120 } });
  const stats = safeItems(p.stats, ["2,400", "38", "94%", "1 unforgettable day"]);
  return <AbsoluteFill style={{ padding: `${78 * s}px ${105 * s}px`, boxSizing: "border-box", fontFamily: FONT }}><EventMark p={p} pal={pal} /><div style={{ display: "grid", gridTemplateColumns: ".8fr 1.2fr", gap: 50 * s, height: "82%", alignItems: "center" }}><div style={{ transform: `translateY(${interpolate(rise, [0, 1], [70, 0])}px)`, opacity: rise }}><Eyebrow pal={pal}>THAT WAS {p.eventName.toUpperCase()}</Eyebrow><div style={{ color: pal.text, fontSize: 78 * s, lineHeight: .92, fontWeight: 950, letterSpacing: "-0.07em", marginTop: 18 * s }}>{p.headline}</div><div style={{ color: `${pal.text}8e`, fontSize: 23 * s, lineHeight: 1.35, marginTop: 24 * s }}>{p.subline}</div><div style={{ marginTop: 33 * s }}><Button label={p.actionLabel} pal={pal} progress={clampInterp(frame, [20, 70], [0, 1])} /></div></div><div style={{ position: "relative", display: "grid", gridTemplateColumns: "1.3fr .7fr", gridTemplateRows: "1fr 1fr", gap: 14 * s, height: 500 * s }}>{[0, 1, 2].map((i) => <div key={i} style={{ position: "relative", overflow: "hidden", gridRow: i === 0 ? "1 / span 2" : undefined, borderRadius: 19 * s, background: `linear-gradient(${125 + i * 30}deg, ${pal.primary}, ${pal.accent} 52%, ${pal.secondary})`, transform: `scale(${interpolate(rise, [0, 1], [.8, 1])}) rotate(${interpolate(rise, [0, 1], [i === 0 ? -4 : 4, 0])}deg)`, opacity: rise }}><div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at ${30 + i * 20}% ${25 + i * 15}%, ${pal.text}aa, transparent 18%), repeating-linear-gradient(${i * 40 + 20}deg, transparent 0 35px, ${pal.bg}18 35px 38px)` }} /><div style={{ position: "absolute", left: 18 * s, bottom: 16 * s, color: pal.text, fontFamily: MONO, fontSize: 12 * s }}>RECAP / 0{i + 1}</div></div>)}<div style={{ position: "absolute", right: 15 * s, top: 15 * s, padding: `${16 * s}px`, borderRadius: 15 * s, color: pal.bg, background: pal.text, minWidth: 155 * s }}>{stats.slice(0, 3).map((stat, i) => <div key={stat} style={{ marginBottom: i < 2 ? 12 * s : 0 }}><div style={{ color: pal.primary, fontFamily: MONO, fontSize: 11 * s }}>0{i + 1}</div><div style={{ fontSize: 22 * s, fontWeight: 950 }}>{stat}</div></div>)}</div></div></div></AbsoluteFill>;
};

const VARIANTS: Record<EventPromoVariant, React.FC<VariantProps>> = {
  "save-the-date": SaveTheDate,
  "speaker-reveal": SpeakerReveal,
  "agenda-stack": AgendaStack,
  "venue-map": VenueMap,
  "webinar-card": WebinarCard,
  "ticket-drop": TicketDrop,
  "lineup-grid": LineupGrid,
  "session-highlight": SessionHighlight,
  "doors-open": DoorsOpen,
  "event-recap": EventRecap,
};

export const EventPromoTemplate: React.FC<EventPromoProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? SaveTheDate;
  const quiet = props.variant === "ticket-drop" || props.variant === "session-highlight";
  return <AbsoluteFill style={{ backgroundColor: pal.bg, fontFamily: FONT }}>
    {!quiet && <GradientMeshBackground palette={pal} blobs={props.variant === "venue-map" ? 3 : 5} speed={0.42} />}
    <FadeEdges inFrames={9} outFrames={12}><Variant p={props} pal={pal} /></FadeEdges>
    <NoiseGrainOverlay opacity={0.028} />
  </AbsoluteFill>;
};

const familyCast = (component: React.FC<EventPromoProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "event-promo-save-the-date": familyCast(EventPromoTemplate),
  "event-promo-speaker-reveal": familyCast(EventPromoTemplate),
  "event-promo-agenda-stack": familyCast(EventPromoTemplate),
  "event-promo-venue-map": familyCast(EventPromoTemplate),
  "event-promo-webinar-card": familyCast(EventPromoTemplate),
  "event-promo-ticket-drop": familyCast(EventPromoTemplate),
  "event-promo-lineup-grid": familyCast(EventPromoTemplate),
  "event-promo-session-highlight": familyCast(EventPromoTemplate),
  "event-promo-doors-open": familyCast(EventPromoTemplate),
  "event-promo-event-recap": familyCast(EventPromoTemplate),
};
