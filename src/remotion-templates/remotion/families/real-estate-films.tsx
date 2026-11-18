import React from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, resolvePalette, seededRand, type Palette } from "../lib/primitives";

/** Cinematic, asset-free property-film scenes with optional listing imagery. */
export type RealEstateVariant =
  | "property-hero"
  | "room-tour"
  | "floor-plan"
  | "amenity-grid"
  | "location-card"
  | "stats-card"
  | "before-after-room"
  | "neighborhood-route"
  | "price-reveal"
  | "contact-cta";

export interface RealEstateFilmsProps {
  variant: RealEstateVariant;
  propertyName: string;
  address: string;
  price: string;
  rooms: string;
  area: string;
  year: string;
  agent: string;
  contact: string;
  subtitle?: string;
  roomImages?: string[];
  features?: string[];
  floorPlan?: string[];
  neighborhood?: string;
  paletteName: string;
  accentColor?: string;
  imageUrl?: string;
  speed?: number;
}

const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';
const MONO = '"SFMono-Regular", Consolas, monospace';
const DEFAULT_FEATURES = ["Sunlit living", "Chef kitchen", "Private terrace", "Walkable district", "Quiet outlook", "Move-in ready"];
const DEFAULT_PLAN = ["ENTRY", "LIVING", "KITCHEN", "BED 01", "BED 02", "BATH"];

const safe = (v: string | undefined, fallback: string) => v?.trim() || fallback;
const series = (items: string[] | undefined, fallback: string[]) => (items?.length ? items : fallback);

const PropertyBackdrop: React.FC<{ p: RealEstateFilmsProps; pal: Palette; dark?: boolean; image?: string }> = ({ p, pal, dark = false, image }) => {
  const src = image ?? p.imageUrl ?? p.roomImages?.[0];
  return <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: `linear-gradient(135deg, ${pal.primary}aa, ${pal.bg} 52%, ${pal.secondary}66)` }}>
    {src ? <Img src={src} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: dark ? "brightness(.64) saturate(.85)" : "brightness(.9) saturate(.9)" }} /> : <>
      <div style={{ position: "absolute", inset: "-10%", background: `radial-gradient(ellipse at 68% 28%, ${pal.accent}88, transparent 28%), linear-gradient(${110 + seededRand(12) * 50}deg, ${pal.primary}cc, ${pal.bg} 52%, ${pal.secondary}99)` }} />
      <div style={{ position: "absolute", left: "8%", right: "8%", bottom: "16%", height: "42%", border: `2px solid ${pal.text}38`, borderBottom: 0, transform: "perspective(700px) rotateX(4deg)" }} />
      <div style={{ position: "absolute", left: "12%", bottom: "16%", width: "27%", height: "24%", border: `2px solid ${pal.text}45`, background: `${pal.secondary}18` }} />
      <div style={{ position: "absolute", right: "16%", bottom: "16%", width: "21%", height: "31%", border: `2px solid ${pal.text}45`, background: `${pal.accent}16` }} />
    </>}
    <div style={{ position: "absolute", inset: 0, background: dark ? `linear-gradient(180deg, ${pal.bg}18 28%, ${pal.bg}dd 100%)` : `linear-gradient(180deg, ${pal.bg}05 35%, ${pal.bg}8c 100%)` }} />
  </div>;
};

const Meta: React.FC<{ label: string; value: string; pal: Palette; accent: string }> = ({ label, value, pal, accent }) => <div style={{ minWidth: 120 }}><div style={{ color: accent, font: `700 12px ${MONO}`, letterSpacing: "0.14em", marginBottom: 8 }}>{label}</div><div style={{ color: pal.text, font: `600 18px ${SANS}` }}>{value}</div></div>;

const Scene: React.FC<{ p: RealEstateFilmsProps; pal: Palette; children: React.ReactNode; dark?: boolean }> = ({ p, pal, children, dark = false }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const enter = interpolate(frame, [0, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exit = interpolate(frame, [Math.max(0, durationInFrames - 18), durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ background: pal.bg, color: pal.text, fontFamily: SANS, opacity: Math.min(enter, exit) }}>{children}<div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: .09, backgroundImage: `repeating-linear-gradient(0deg, ${pal.text}10 0 1px, transparent 1px 5px)` }} />{dark && <div style={{ position: "absolute", inset: 0, pointerEvents: "none", boxShadow: `inset 0 0 100px ${pal.bg}` }} />}</AbsoluteFill>;
};

const RealEstateRenderer: React.FC<{ p: RealEstateFilmsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const accent = p.accentColor ?? pal.accent;
  const features = series(p.features, DEFAULT_FEATURES);
  const plan = series(p.floorPlan, DEFAULT_PLAN);
  const rooms = series(p.roomImages, ["", "", ""]);
  const name = safe(p.propertyName, "The Meridian House");
  const address = safe(p.address, "18 Garden Avenue · North Quarter");
  const price = safe(p.price, "$1.25M");
  const agent = safe(p.agent, "Avery Morgan");
  const contact = safe(p.contact, "hello@meridian.example");
  const subtitle = safe(p.subtitle, "A considered home for the way you live");
  const neighborhood = safe(p.neighborhood, "North Quarter");
  const drift = Math.sin(frame * 0.012) * 1.5;

  switch (p.variant) {
    case "property-hero":
      return <Scene p={p} pal={pal} dark><PropertyBackdrop p={p} pal={pal} dark /><div style={{ position: "absolute", left: "7vw", top: "8vh", color: accent, font: `700 14px ${MONO}`, letterSpacing: ".18em" }}>PRIVATE LISTING / 01</div><div style={{ position: "absolute", left: "7vw", right: "7vw", bottom: "10vh" }}><div style={{ font: `700 clamp(58px, 10vw, 160px) ${SERIF}`, lineHeight: .88, maxWidth: "80vw" }}>{name}</div><div style={{ marginTop: 20, font: `20px ${SANS}`, color: pal.secondary }}>{subtitle}</div><div style={{ display: "flex", gap: 34, marginTop: 34, flexWrap: "wrap" }}><Meta label="ADDRESS" value={address} pal={pal} accent={accent} /><Meta label="GUIDE PRICE" value={price} pal={pal} accent={accent} /></div></div></Scene>;
    case "room-tour":
      return <Scene p={p} pal={pal}><div style={{ position: "absolute", inset: "8vh 7vw 12vh", display: "grid", gridTemplateColumns: "1.45fr .8fr", gap: "5vw", alignItems: "center" }}><div style={{ position: "relative", height: "68vh", overflow: "hidden", borderRadius: 4, transform: `translateY(${drift}px)` }}>{rooms[0] ? <Img src={rooms[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <PropertyBackdrop p={p} pal={pal} image={p.imageUrl} />}<div style={{ position: "absolute", left: 24, bottom: 22, color: pal.text, font: `700 13px ${MONO}`, letterSpacing: ".15em" }}>01 / LIVING ROOM</div></div><div><div style={{ color: accent, font: `700 14px ${MONO}`, letterSpacing: ".15em" }}>A WALK THROUGH</div><div style={{ marginTop: 20, font: `700 clamp(42px, 6vw, 92px) ${SERIF}`, lineHeight: .94 }}>Rooms with<br />room to breathe.</div><div style={{ marginTop: 26, color: pal.secondary, fontSize: 18 }}>{safe(p.rooms, "3 bed · 2 bath")}</div><div style={{ marginTop: 42, display: "flex", gap: 10 }}>{rooms.slice(0, 3).map((src, i) => <div key={`room-${i}`} style={{ width: 54, height: 54, border: `1px solid ${accent}`, background: src ? `url(${src}) center/cover` : `${pal.primary}${20 + i * 8}` }} />)}</div></div></div></Scene>;
    case "floor-plan":
      return <Scene p={p} pal={pal}><div style={{ position: "absolute", left: "7vw", top: "8vh", right: "7vw", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}><div><div style={{ color: accent, font: `700 13px ${MONO}`, letterSpacing: ".16em" }}>THE LAYOUT</div><div style={{ marginTop: 12, font: `700 clamp(44px, 7vw, 112px) ${SERIF}` }}>Flow, framed.</div></div><div style={{ textAlign: "right", color: pal.secondary, font: `15px ${MONO}` }}>{safe(p.area, "2,180 SQ FT")}<br />{safe(p.rooms, "3 BED / 2.5 BATH")}</div></div><div style={{ position: "absolute", left: "10vw", right: "10vw", top: "31vh", bottom: "10vh", border: `2px solid ${pal.text}55`, display: "grid", gridTemplateColumns: "1.2fr .8fr 1fr", gridTemplateRows: "1fr 1.2fr .8fr", background: `${pal.primary}10` }}>{plan.map((label, i) => <div key={`${label}-${i}`} style={{ border: `1px solid ${pal.text}38`, display: "flex", alignItems: "center", justifyContent: "center", color: i === 0 ? accent : pal.text, font: `700 14px ${MONO}`, letterSpacing: ".1em", background: i === 0 ? `${accent}12` : "transparent" }}>{label}</div>)}</div></Scene>;
    case "amenity-grid":
      return <Scene p={p} pal={pal}><div style={{ position: "absolute", inset: "8vh 7vw" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}><div><div style={{ color: accent, font: `700 13px ${MONO}`, letterSpacing: ".16em" }}>THE DETAILS</div><div style={{ marginTop: 14, font: `700 clamp(44px, 7vw, 110px) ${SERIF}` }}>Made for living.</div></div><div style={{ color: pal.secondary, font: `15px ${MONO}` }}>{features.length.toString().padStart(2, "0")} FEATURES</div></div><div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, marginTop: "7vh", height: "52vh" }}>{features.slice(0, 6).map((feature, i) => <div key={feature} style={{ position: "relative", padding: 24, border: `1px solid ${pal.text}30`, background: `linear-gradient(${120 + i * 12}deg, ${pal.primary}${18 + i * 4}, transparent)`, overflow: "hidden" }}><div style={{ position: "absolute", right: -18, top: -24, font: `700 100px ${SERIF}`, color: `${accent}16` }}>{String(i + 1).padStart(2, "0")}</div><div style={{ position: "absolute", left: 24, bottom: 22, font: `600 20px ${SANS}`, maxWidth: "80%" }}>{feature}</div></div>)}</div></div></Scene>;
    case "location-card":
      return <Scene p={p} pal={pal} dark><div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${pal.primary}30, transparent 45%), ${pal.bg}` }} /><div style={{ position: "absolute", left: "7vw", right: "7vw", top: "11vh", bottom: "11vh", border: `1px solid ${pal.secondary}55`, padding: "6vh 6vw" }}><div style={{ color: accent, font: `700 13px ${MONO}`, letterSpacing: ".16em" }}>WHERE IT LIVES</div><div style={{ marginTop: 20, font: `700 clamp(52px, 8vw, 132px) ${SERIF}`, lineHeight: .9 }}>{neighborhood}</div><div style={{ marginTop: 18, color: pal.secondary, fontSize: 20 }}>{address}</div><div style={{ position: "absolute", inset: "35% 10% 16%", opacity: .65 }}>{Array.from({ length: 7 }, (_, i) => <div key={`street-h-${i}`} style={{ position: "absolute", left: `${i * 3}%`, right: `${(6 - i) * 3}%`, top: `${i * 14}%`, borderTop: `1px solid ${pal.secondary}40`, transform: `rotate(${i % 2 ? 5 : -4}deg)` }} />)}{Array.from({ length: 6 }, (_, i) => <div key={`street-v-${i}`} style={{ position: "absolute", top: 0, bottom: 0, left: `${10 + i * 16}%`, borderLeft: `1px solid ${pal.secondary}38`, transform: `rotate(${i % 2 ? -10 : 8}deg)` }} />)}<div style={{ position: "absolute", left: "47%", top: "36%", width: 16, height: 16, borderRadius: "50%", background: accent, boxShadow: `0 0 0 10px ${accent}22` }} /></div><div style={{ position: "absolute", bottom: "6vh", left: "6vw", right: "6vw", display: "flex", justifyContent: "space-between", color: pal.secondary, font: `13px ${MONO}` }}><span>TRANSIT / 04 MIN</span><span>MARKET / 08 MIN</span><span>PARK / 02 MIN</span></div></div></Scene>;
    case "stats-card":
      return <Scene p={p} pal={pal}><div style={{ position: "absolute", inset: "10vh 8vw" }}><div style={{ color: accent, font: `700 13px ${MONO}`, letterSpacing: ".16em" }}>THE NUMBERS</div><div style={{ marginTop: 14, font: `700 clamp(46px, 7vw, 110px) ${SERIF}` }}>{name}</div><div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, marginTop: "9vh" }}>{[[safe(p.rooms, "3"), "BEDROOMS"], ["2.5", "BATHS"], [safe(p.area, "2,180"), "SQ FT"], [safe(p.year, "1928"), "BUILT"]].map(([value, label], i) => <div key={label} style={{ borderTop: `3px solid ${i === 0 ? accent : pal.primary}`, padding: "22px 14px" }}><div style={{ font: `700 clamp(34px, 5vw, 72px) ${SERIF}`, color: i === 0 ? accent : pal.text }}>{value}</div><div style={{ marginTop: 10, color: pal.secondary, font: `700 12px ${MONO}`, letterSpacing: ".12em" }}>{label}</div></div>)}</div><div style={{ position: "absolute", bottom: 0, left: 0, right: 0, borderTop: `1px solid ${pal.text}35`, paddingTop: 18, color: pal.secondary }}>{subtitle}</div></div></Scene>;
    case "before-after-room":
      return <Scene p={p} pal={pal}><div style={{ position: "absolute", inset: "9vh 7vw" }}><div style={{ color: accent, font: `700 13px ${MONO}`, letterSpacing: ".16em" }}>A ROOM, REIMAGINED</div><div style={{ marginTop: 12, font: `700 clamp(42px, 6vw, 96px) ${SERIF}` }}>Before / after</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, marginTop: "5vh", height: "58vh" }}>{[0, 1].map((side) => <div key={side} style={{ position: "relative", overflow: "hidden", background: side ? `${pal.primary}40` : `${pal.secondary}28`, filter: side ? "none" : "grayscale(.9)" }}>{rooms[side] ? <Img src={rooms[side]} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: .75 }} /> : <PropertyBackdrop p={p} pal={side ? pal : { ...pal, primary: pal.secondary, accent: pal.text }} />}<div style={{ position: "absolute", left: 20, bottom: 18, font: `700 13px ${MONO}`, letterSpacing: ".15em", color: side ? accent : pal.text }}>{side ? "AFTER / THE FINISH" : "BEFORE / THE POTENTIAL"}</div></div>)}</div></div></Scene>;
    case "neighborhood-route":
      return <Scene p={p} pal={pal}><div style={{ position: "absolute", left: "7vw", right: "7vw", top: "8vh" }}><div style={{ color: accent, font: `700 13px ${MONO}`, letterSpacing: ".16em" }}>LIFE AROUND THE CORNER</div><div style={{ marginTop: 14, font: `700 clamp(43px, 7vw, 108px) ${SERIF}` }}>Close to what matters.</div></div><div style={{ position: "absolute", inset: "35vh 9vw 10vh", border: `1px solid ${pal.text}30`, overflow: "hidden" }}>{Array.from({ length: 9 }, (_, i) => <div key={i} style={{ position: "absolute", left: `${-10 + i * 12}%`, top: `${i % 3 * 30}%`, width: "125%", borderTop: `1px solid ${pal.secondary}35`, transform: `rotate(${i % 2 ? -8 : 6}deg)` }} />)}{["HOME", "PARK", "MARKET", "STATION"].map((label, i) => <div key={label} style={{ position: "absolute", left: `${15 + i * 23}%`, top: `${50 + (i % 2 ? -18 : 14)}%`, color: i === 0 ? accent : pal.text, font: `700 13px ${MONO}`, letterSpacing: ".1em" }}><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: i === 0 ? accent : pal.secondary, marginRight: 9 }} />{label}</div>)}<div style={{ position: "absolute", left: "17%", top: "52%", width: "65%", borderTop: `3px dashed ${accent}`, transform: "rotate(-4deg)" }} /></div></Scene>;
    case "price-reveal":
      return <Scene p={p} pal={pal} dark><PropertyBackdrop p={p} pal={pal} dark /><div style={{ position: "absolute", inset: "11vh 8vw", display: "flex", flexDirection: "column", justifyContent: "space-between" }}><div style={{ display: "flex", justifyContent: "space-between", color: pal.secondary, font: `700 13px ${MONO}`, letterSpacing: ".15em" }}><span>THE ASK</span><span>{address}</span></div><div><div style={{ color: accent, font: `700 15px ${MONO}`, letterSpacing: ".15em" }}>A PLACE TO COME HOME TO</div><div style={{ marginTop: 16, font: `700 clamp(62px, 11vw, 180px) ${SERIF}`, lineHeight: .85 }}>{price}</div><div style={{ marginTop: 20, font: `22px ${SANS}`, color: pal.secondary }}>{name}</div></div><div style={{ display: "flex", justifyContent: "space-between", color: pal.secondary, font: `14px ${MONO}` }}><span>{safe(p.rooms, "3 BED / 2.5 BATH")}</span><span>{safe(p.area, "2,180 SQ FT")}</span><span>{safe(p.year, "BUILT 1928")}</span></div></div></Scene>;
    case "contact-cta":
    default:
      return <Scene p={p} pal={pal}><div style={{ position: "absolute", inset: "10vh 8vw", display: "flex", flexDirection: "column", justifyContent: "space-between" }}><div><div style={{ color: accent, font: `700 13px ${MONO}`, letterSpacing: ".16em" }}>PRIVATE VIEWING</div><div style={{ marginTop: 18, font: `700 clamp(58px, 10vw, 158px) ${SERIF}`, lineHeight: .86, maxWidth: "80vw" }}>Come see<br />{name}.</div></div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", borderTop: `1px solid ${pal.text}45`, paddingTop: 22, gap: 30 }}><div><div style={{ font: `600 22px ${SANS}` }}>{agent}</div><div style={{ marginTop: 8, color: pal.secondary, font: `16px ${MONO}` }}>{contact}</div></div><div style={{ color: accent, font: `700 15px ${MONO}`, letterSpacing: ".12em", textAlign: "right" }}>BOOK A TOUR<br />→</div></div></div></Scene>;
  }
};

export const RealEstateFilms: React.FC<{ p: RealEstateFilmsProps; pal: Palette }> = ({ p, pal }) => <FadeEdges><RealEstateRenderer p={p} pal={pal} /></FadeEdges>;

const familyCast = (variant: RealEstateVariant) => ((props: Record<string, unknown>) => {
  const p = { ...(props as unknown as RealEstateFilmsProps), variant };
  return <RealEstateFilms p={p} pal={resolvePalette(p.paletteName ?? "ocean")} />;
}) as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "real-estate-films-property-hero": familyCast("property-hero"),
  "real-estate-films-room-tour": familyCast("room-tour"),
  "real-estate-films-floor-plan": familyCast("floor-plan"),
  "real-estate-films-amenity-grid": familyCast("amenity-grid"),
  "real-estate-films-location-card": familyCast("location-card"),
  "real-estate-films-stats-card": familyCast("stats-card"),
  "real-estate-films-before-after-room": familyCast("before-after-room"),
  "real-estate-films-neighborhood-route": familyCast("neighborhood-route"),
  "real-estate-films-price-reveal": familyCast("price-reveal"),
  "real-estate-films-contact-cta": familyCast("contact-cta"),
};
