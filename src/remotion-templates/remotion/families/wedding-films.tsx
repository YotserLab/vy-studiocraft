import React from "react";
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, clampInterp, resolvePalette, seededRand, type Palette } from "../lib/primitives";

/** Tasteful cinematic title, photo, and reception beats for wedding films. */
type WeddingVariant =
  | "save-the-date"
  | "names-reveal"
  | "vow-quote"
  | "photo-gallery"
  | "venue-card"
  | "timeline-day"
  | "family-grid"
  | "first-dance"
  | "thank-you"
  | "wedding-finale";

export interface WeddingFilmsProps {
  variant: WeddingVariant;
  names: string;
  date: string;
  venue: string;
  quote: string;
  subtitle: string;
  monogram: string;
  paletteName: string;
  accentColor?: string;
  imageUrls?: string[];
  eventTimes?: string[];
  family?: string[];
  story?: string;
}

const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const fallbackEvents = ["CEREMONY", "COCKTAIL HOUR", "DINNER", "FIRST DANCE", "SEND-OFF"];
const fallbackFamily = ["M", "A", "J", "L", "S", "R"];

const splitNames = (value: string): [string, string] => {
  const bits = value.split(/\s*(?:&|and|×)\s*/i).map((x) => x.trim()).filter(Boolean);
  if (bits.length >= 2) return [bits[0], bits[1]];
  const words = value.trim().split(/\s+/).filter(Boolean);
  return [words[0] ?? "Alex", words.slice(1).join(" ") || "Taylor"];
};

const Accents: React.FC<{ pal: Palette; accent: string }> = ({ pal, accent }) => (
  <>
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 12% 8%, ${accent}20, transparent 32%), radial-gradient(circle at 90% 92%, ${pal.primary}1c, transparent 40%)` }} />
    <div style={{ position: "absolute", inset: 0, opacity: 0.08, backgroundImage: `linear-gradient(${pal.text} 1px, transparent 1px), linear-gradient(90deg, ${pal.text} 1px, transparent 1px)`, backgroundSize: "88px 88px", maskImage: "linear-gradient(to bottom, black, transparent 78%)" }} />
  </>
);

const Petals: React.FC<{ pal: Palette; accent: string; count?: number }> = ({ pal, accent, count = 14 }) => {
  const frame = useCurrentFrame();
  return <>{Array.from({ length: count }, (_, i) => {
    const seed = seededRand(i + 19);
    const x = (seed * 130 - 15 + frame * (0.06 + seed * 0.04)) % 115;
    const y = ((seededRand(i + 81) * 125 + frame * (0.12 + seed * 0.08)) % 130) - 15;
    const rotate = frame * (0.4 + seed * 0.8) + seed * 180;
    return <span key={`petal-${i}`} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: 10 + seed * 10, height: 5 + seed * 6, borderRadius: "100% 0 100% 0", background: i % 3 === 0 ? `${pal.text}66` : `${accent}88`, transform: `rotate(${rotate}deg)`, opacity: 0.45 }} />;
  })}</>;
};

const Photo: React.FC<{ pal: Palette; src?: string; index?: number; className?: React.CSSProperties }> = ({ pal, src, index = 0, className }) => {
  const colors = [pal.primary, pal.secondary, pal.accent];
  return <div style={{ position: "relative", overflow: "hidden", background: `linear-gradient(${112 + index * 13}deg, ${colors[index % 3]}cc, ${pal.bg} 58%, ${colors[(index + 1) % 3]}77)`, ...className }}>
    {src ? <Img src={src} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : <>
      <div style={{ position: "absolute", width: "75%", height: "75%", left: `${12 + (index % 3) * 8}%`, top: `${8 + (index % 2) * 15}%`, borderRadius: "50%", background: `radial-gradient(circle, ${pal.text}4c, transparent 64%)`, filter: "blur(3px)" }} />
      <div style={{ position: "absolute", left: "8%", right: "8%", bottom: "12%", height: "24%", borderRadius: "50% 50% 0 0", background: `${pal.bg}66` }} />
    </>}
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, transparent 45%, ${pal.bg}55)` }} />
  </div>;
};

const Label: React.FC<{ children: React.ReactNode; pal: Palette; accent: string }> = ({ children, pal, accent }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 13, color: accent, font: `700 14px ${MONO}`, letterSpacing: ".2em" }}><span style={{ width: 34, height: 2, background: accent }} />{children}<span style={{ width: 34, height: 1, background: `${pal.text}55` }} /></div>
);

const Monogram: React.FC<{ value: string; pal: Palette; accent: string; size?: number }> = ({ value, pal, accent, size = 90 }) => (
  <div style={{ width: size, height: size, border: `1px solid ${accent}aa`, borderRadius: "50%", display: "grid", placeItems: "center", color: pal.text, font: `${size * 0.32}px ${SERIF}`, letterSpacing: "-0.08em", boxShadow: `0 0 0 7px ${accent}15, 0 0 50px ${accent}22` }}>{value || "A&T"}</div>
);

const Base: React.FC<{ p: WeddingFilmsProps; pal: Palette; children: React.ReactNode; dark?: boolean }> = ({ p, pal, children, dark = false }) => {
  const accent = p.accentColor ?? pal.accent;
  return <AbsoluteFill style={{ overflow: "hidden", background: dark ? "#090909" : pal.bg, color: pal.text, fontFamily: SANS }}><Accents pal={pal} accent={accent} />{children}<FadeEdges inFrames={10} outFrames={16}><div /></FadeEdges></AbsoluteFill>;
};

const SaveTheDate: React.FC<{ p: WeddingFilmsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const accent = p.accentColor ?? pal.accent;
  const enter = clampInterp(frame, [5, 34], [0, 1]);
  return <Base p={p} pal={pal}><Petals pal={pal} accent={accent} /><div style={{ position: "absolute", inset: "10vh 9vw", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 60, opacity: enter, transform: `translateY(${(1 - enter) * 28}px)` }}><div style={{ maxWidth: "62%" }}><Label pal={pal} accent={accent}>SAVE THE DATE</Label><div style={{ marginTop: 34, font: `italic clamp(48px, 8vw, 138px) ${SERIF}`, lineHeight: .92, letterSpacing: "-.05em" }}>{p.names}</div><div style={{ marginTop: 35, color: accent, font: `700 clamp(24px, 3vw, 46px) ${MONO}`, letterSpacing: ".12em" }}>{p.date}</div><div style={{ marginTop: 16, color: `${pal.text}aa`, fontSize: 22 }}>{p.venue}</div></div><Monogram value={p.monogram} pal={pal} accent={accent} size={170} /></div></Base>;
};

const NamesReveal: React.FC<{ p: WeddingFilmsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const accent = p.accentColor ?? pal.accent; const [a, b] = splitNames(p.names);
  const left = clampInterp(frame, [6, 30], [-130, 0]); const right = clampInterp(frame, [18, 42], [130, 0]);
  return <Base p={p} pal={pal}><div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}><div style={{ display: "flex", alignItems: "center", gap: "clamp(24px, 4vw, 80px)" }}><div style={{ textAlign: "right", transform: `translateX(${left}px)`, opacity: clampInterp(frame, [6, 30], [0, 1]) }}><div style={{ color: accent, font: `14px ${MONO}`, letterSpacing: ".18em" }}>THEIR STORY</div><div style={{ marginTop: 20, font: `italic clamp(54px, 8vw, 136px) ${SERIF}`, lineHeight: .9 }}>{a}</div></div><div style={{ color: accent, font: `italic clamp(52px, 7vw, 120px) ${SERIF}`, opacity: clampInterp(frame, [30, 52], [0, 1]) }}>&</div><div style={{ transform: `translateX(${right}px)`, opacity: clampInterp(frame, [18, 42], [0, 1]) }}><div style={{ color: accent, font: `14px ${MONO}`, letterSpacing: ".18em" }}>FOREVER AFTER</div><div style={{ marginTop: 20, font: `italic clamp(54px, 8vw, 136px) ${SERIF}`, lineHeight: .9 }}>{b}</div></div></div><div style={{ position: "absolute", bottom: "12vh", color: `${pal.text}99`, font: `16px ${MONO}`, letterSpacing: ".18em" }}>{p.date} · {p.venue}</div></div></Base>;
};

const VowQuote: React.FC<{ p: WeddingFilmsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const accent = p.accentColor ?? pal.accent; const show = clampInterp(frame, [12, 40], [0, 1]);
  return <Base p={p} pal={pal}><div style={{ position: "absolute", inset: "12vh 13vw", border: `1px solid ${accent}55`, display: "grid", placeItems: "center", padding: "8vw", boxSizing: "border-box", background: `${pal.bg}66`, opacity: show, transform: `scale(${clampInterp(frame, [12, 40], [.94, 1])})` }}><div style={{ textAlign: "center", maxWidth: 1180 }}><div style={{ color: accent, font: `100px ${SERIF}`, lineHeight: .35 }}>“</div><div style={{ marginTop: 35, font: `italic clamp(31px, 4.4vw, 70px) ${SERIF}`, lineHeight: 1.18 }}>{p.quote}</div><div style={{ marginTop: 34, color: `${pal.text}99`, font: `15px ${MONO}`, letterSpacing: ".17em" }}>{p.names.toUpperCase()} · {p.date}</div></div></div></Base>;
};

const PhotoGallery: React.FC<{ p: WeddingFilmsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const accent = p.accentColor ?? pal.accent; const photos = p.imageUrls ?? [];
  return <Base p={p} pal={pal}><div style={{ position: "absolute", left: "7vw", right: "7vw", top: "11vh" }}><Label pal={pal} accent={accent}>A LIFE IN FRAMES</Label><div style={{ marginTop: 36, display: "flex", alignItems: "center", justifyContent: "center", gap: 18, height: "66vh" }}>{Array.from({ length: 5 }, (_, i) => { const t = clampInterp(frame, [10 + i * 8, 32 + i * 8], [0, 1]); return <Photo key={i} pal={pal} src={photos[i % Math.max(1, photos.length)]} index={i} className={{ width: `${i === 2 ? 24 : 17}%`, height: `${i === 2 ? 86 : 66}%`, transform: `translateY(${(1 - t) * (i % 2 ? 70 : -50)}px) rotate(${(i - 2) * 2.3}deg) scale(${i === 2 ? 1 : .9})`, opacity: t, boxShadow: `0 22px 50px ${pal.bg}99` }} />; })}</div><div style={{ marginTop: 12, textAlign: "center", color: `${pal.text}99`, font: `18px ${SERIF}` }}>{p.subtitle}</div></div></Base>;
};

const VenueCard: React.FC<{ p: WeddingFilmsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const accent = p.accentColor ?? pal.accent; const line = clampInterp(frame, [18, 48], [0, 1]);
  return <Base p={p} pal={pal}><div style={{ position: "absolute", inset: "13vh 14vw", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}><div style={{ width: 180, height: 180, border: `1px solid ${accent}66`, borderRadius: "50%", position: "relative", opacity: line }}><div style={{ position: "absolute", inset: 25, border: `1px dashed ${pal.secondary}77`, borderRadius: "50%" }} /><div style={{ position: "absolute", top: "50%", left: "50%", width: 15, height: 15, borderRadius: "50%", background: accent, transform: "translate(-50%,-50%)", boxShadow: `0 0 0 14px ${accent}22` }} /></div><div style={{ marginTop: 34, color: accent, font: `14px ${MONO}`, letterSpacing: ".22em", opacity: line }}>THE PLACE WE CHOSE</div><div style={{ marginTop: 18, font: `italic clamp(48px, 7vw, 120px) ${SERIF}`, lineHeight: .95, opacity: line, transform: `translateY(${(1 - line) * 25}px)` }}>{p.venue}</div><div style={{ marginTop: 24, color: `${pal.text}99`, font: `18px ${SANS}` }}>{p.date} · {p.subtitle}</div></div></Base>;
};

const TimelineDay: React.FC<{ p: WeddingFilmsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const accent = p.accentColor ?? pal.accent; const events = p.eventTimes ?? fallbackEvents;
  return <Base p={p} pal={pal}><div style={{ position: "absolute", left: "14vw", right: "14vw", top: "12vh" }}><Label pal={pal} accent={accent}>THE WEDDING DAY</Label><div style={{ marginTop: 42, position: "relative", display: "grid", gap: 14 }}>{events.slice(0, 5).map((event, i) => { const t = clampInterp(frame, [10 + i * 10, 28 + i * 10], [0, 1]); return <div key={`${event}-${i}`} style={{ display: "grid", gridTemplateColumns: "190px 28px 1fr", alignItems: "center", minHeight: 92, opacity: t, transform: `translateX(${(1 - t) * 50}px)` }}><div style={{ color: accent, font: `700 16px ${MONO}`, letterSpacing: ".11em", textAlign: "right" }}>{event}</div><div style={{ position: "relative", height: "100%", display: "grid", placeItems: "center" }}><span style={{ width: 15, height: 15, borderRadius: "50%", background: accent, boxShadow: `0 0 0 9px ${accent}20` }} /><span style={{ position: "absolute", top: i === 0 ? "50%" : 0, bottom: i === events.length - 1 ? "50%" : 0, width: 1, background: `${accent}66` }} /></div><div style={{ paddingLeft: 28, color: pal.text, font: `italic ${i === 0 ? 34 : 28}px ${SERIF}` }}>{i === 0 ? p.names : (p.subtitle || "A moment to remember")}</div></div>; })}</div></div></Base>;
};

const FamilyGrid: React.FC<{ p: WeddingFilmsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const accent = p.accentColor ?? pal.accent; const people = p.family ?? fallbackFamily;
  return <Base p={p} pal={pal}><div style={{ position: "absolute", inset: "11vh 13vw" }}><Label pal={pal} accent={accent}>THE PEOPLE WE LOVE</Label><div style={{ marginTop: 34, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>{people.slice(0, 6).map((person, i) => { const t = clampInterp(frame, [8 + i * 6, 26 + i * 6], [0, 1]); return <div key={`${person}-${i}`} style={{ height: "24vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `1px solid ${pal.text}25`, background: `${pal.primary}14`, opacity: t, transform: `translateY(${(1 - t) * 30}px)` }}><div style={{ width: 76, height: 76, borderRadius: "50%", display: "grid", placeItems: "center", background: `linear-gradient(145deg, ${pal.primary}, ${pal.secondary})`, color: pal.bg, font: `italic 30px ${SERIF}` }}>{person.slice(0, 2).toUpperCase()}</div><div style={{ marginTop: 14, color: pal.text, font: `16px ${SANS}`, letterSpacing: ".08em" }}>{person}</div></div>; })}</div><div style={{ marginTop: 26, textAlign: "center", color: `${pal.text}99`, font: `18px ${SERIF}` }}>{p.subtitle}</div></div></Base>;
};

const FirstDance: React.FC<{ p: WeddingFilmsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const accent = p.accentColor ?? pal.accent; const [a, b] = splitNames(p.names); const pulse = 1 + Math.sin(frame * .08) * .025;
  return <Base p={p} pal={pal} dark><div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at center, ${accent}20, transparent 35%)` }} /><div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}><div style={{ position: "absolute", width: 600, height: 600, border: `1px solid ${accent}55`, borderRadius: "50%", transform: `scale(${pulse})` }} /><div style={{ position: "absolute", width: 390, height: 390, border: `1px solid ${pal.secondary}45`, borderRadius: "50%", transform: `scale(${1 / pulse})` }} /><div style={{ textAlign: "center", zIndex: 1 }}><div style={{ color: accent, font: `14px ${MONO}`, letterSpacing: ".24em" }}>THE FIRST DANCE</div><div style={{ marginTop: 28, font: `italic clamp(50px, 8vw, 132px) ${SERIF}`, lineHeight: .9 }}>{a}<span style={{ color: accent }}> & </span>{b}</div><div style={{ marginTop: 26, color: `${pal.text}99`, font: `18px ${SANS}` }}>{p.subtitle}</div></div></div></Base>;
};

const ThankYou: React.FC<{ p: WeddingFilmsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const accent = p.accentColor ?? pal.accent; const photos = p.imageUrls ?? []; const t = clampInterp(frame, [10, 38], [0, 1]);
  return <Base p={p} pal={pal}><div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 50 }}><div style={{ width: "38vw", height: "60vh", transform: `rotate(-4deg) translateY(${(1 - t) * 35}px)`, opacity: t }}><Photo pal={pal} src={photos[0]} index={1} className={{ width: "100%", height: "100%", border: `12px solid ${pal.text}`, boxShadow: `18px 22px 0 ${accent}66` }} /></div><div style={{ maxWidth: "36vw", transform: `translateY(${(1 - t) * -28}px)`, opacity: t }}><Label pal={pal} accent={accent}>WITH ALL OUR LOVE</Label><div style={{ marginTop: 25, font: `italic clamp(52px, 7vw, 120px) ${SERIF}`, lineHeight: .9 }}>Thank you.</div><div style={{ marginTop: 28, color: `${pal.text}ad`, font: `20px ${SANS}`, lineHeight: 1.5 }}>{p.story || p.subtitle}</div><div style={{ marginTop: 28, color: accent, font: `16px ${MONO}`, letterSpacing: ".12em" }}>{p.names} · {p.date}</div></div></div></Base>;
};

const WeddingFinale: React.FC<{ p: WeddingFilmsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const accent = p.accentColor ?? pal.accent; const [a, b] = splitNames(p.names); const reveal = clampInterp(frame, [10, 48], [0, 1]);
  return <Base p={p} pal={pal} dark><Photo pal={pal} src={p.imageUrls?.[0]} index={2} className={{ position: "absolute", inset: 0, opacity: .42, transform: `scale(${1.08 - reveal * .08})` }} /><Petals pal={pal} accent={accent} count={18} /><div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${pal.bg}ee, ${pal.bg}33 70%, ${pal.bg}bb)` }} /><div style={{ position: "absolute", left: "9vw", bottom: "11vh", opacity: reveal, transform: `translateY(${(1 - reveal) * 30}px)` }}><Label pal={pal} accent={accent}>AND SO THE STORY BEGINS</Label><div style={{ marginTop: 24, font: `italic clamp(55px, 9vw, 155px) ${SERIF}`, lineHeight: .84 }}>{a}<span style={{ color: accent }}> & </span>{b}</div><div style={{ marginTop: 24, color: pal.text, font: `700 19px ${MONO}`, letterSpacing: ".16em" }}>{p.date} · {p.venue}</div></div><div style={{ position: "absolute", right: "9vw", top: "11vh", opacity: reveal }}><Monogram value={p.monogram} pal={pal} accent={accent} size={112} /></div></Base>;
};

const VARIANTS: Record<WeddingVariant, React.FC<{ p: WeddingFilmsProps; pal: Palette }>> = {
  "save-the-date": SaveTheDate,
  "names-reveal": NamesReveal,
  "vow-quote": VowQuote,
  "photo-gallery": PhotoGallery,
  "venue-card": VenueCard,
  "timeline-day": TimelineDay,
  "family-grid": FamilyGrid,
  "first-dance": FirstDance,
  "thank-you": ThankYou,
  "wedding-finale": WeddingFinale,
};

export const WeddingFilmsTemplate: React.FC<WeddingFilmsProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? SaveTheDate;
  return <Variant p={props} pal={pal} />;
};

const familyCast = (component: React.FC<WeddingFilmsProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;
export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "wedding-films-save-the-date": familyCast(WeddingFilmsTemplate),
  "wedding-films-names-reveal": familyCast(WeddingFilmsTemplate),
  "wedding-films-vow-quote": familyCast(WeddingFilmsTemplate),
  "wedding-films-photo-gallery": familyCast(WeddingFilmsTemplate),
  "wedding-films-venue-card": familyCast(WeddingFilmsTemplate),
  "wedding-films-timeline-day": familyCast(WeddingFilmsTemplate),
  "wedding-films-family-grid": familyCast(WeddingFilmsTemplate),
  "wedding-films-first-dance": familyCast(WeddingFilmsTemplate),
  "wedding-films-thank-you": familyCast(WeddingFilmsTemplate),
  "wedding-films-wedding-finale": familyCast(WeddingFilmsTemplate),
};
