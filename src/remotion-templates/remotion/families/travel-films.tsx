import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, clampInterp, resolvePalette, seededRand, type Palette } from "../lib/primitives";

/** Travel-specific cinematic sequence grammar with procedural, asset-free defaults. */
type TravelVariant =
  | "destination-open"
  | "route-to-place"
  | "day-card"
  | "food-stop"
  | "landmark-reveal"
  | "hotel-card"
  | "sunset-recap"
  | "map-to-memory"
  | "trip-timeline"
  | "travel-close";

type Stop = { name: string; city?: string; day?: string; x?: number; y?: number; note?: string };

export interface TravelFilmsProps {
  variant: TravelVariant;
  title: string;
  subtitle: string;
  destination: string;
  dates: string;
  paletteName: string;
  destinations?: string[];
  stops?: Stop[];
  imageUrls?: string[];
  captions?: string[];
  mapPoints?: Array<{ label?: string; x: number; y: number }>;
  accent?: string;
  photographer?: string;
  hotel?: string;
  food?: string;
  showRoute?: boolean;
  speed?: number;
}

const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';
const MONO = '"SFMono-Regular", Consolas, monospace';
const VARIANTS: TravelVariant[] = ["destination-open", "route-to-place", "day-card", "food-stop", "landmark-reveal", "hotel-card", "sunset-recap", "map-to-memory", "trip-timeline", "travel-close"];
const FALLBACK_STOPS: Stop[] = [
  { name: "Lisbon", city: "Portugal", day: "DAY 01", x: 16, y: 59, note: "Tile, tide, and the long way home" },
  { name: "Sintra", city: "Portugal", day: "DAY 02", x: 37, y: 40, note: "A green detour through the hills" },
  { name: "Porto", city: "Portugal", day: "DAY 04", x: 66, y: 26, note: "Blue hour by the river" },
  { name: "Douro", city: "Portugal", day: "DAY 06", x: 83, y: 64, note: "A slow afternoon between vines" },
];
const FALLBACK_CAPTIONS = ["The first light", "A small detour", "Lunch in the shade", "The road keeps going", "Last light on the water"];

const stopsOf = (p: TravelFilmsProps): Stop[] => p.stops?.length ? p.stops.slice(0, 12) : FALLBACK_STOPS;
const captionsOf = (p: TravelFilmsProps): string[] => p.captions?.length ? p.captions : FALLBACK_CAPTIONS;
const imagesOf = (p: TravelFilmsProps): string[] => p.imageUrls?.length ? p.imageUrls : [];
const accentOf = (p: TravelFilmsProps, pal: Palette) => p.accent ?? pal.accent;
const text = (value: string | undefined, fallback: string) => value?.trim() || fallback;

const Eyebrow: React.FC<{ children: React.ReactNode; pal: Palette; color?: string }> = ({ children, pal, color }) => (
  <div style={{ color: color ?? pal.secondary, fontFamily: MONO, fontSize: 14, fontWeight: 800, letterSpacing: ".22em", textTransform: "uppercase" }}>{children}</div>
);

const Photo: React.FC<{ index: number; p: TravelFilmsProps; pal: Palette; style?: React.CSSProperties; label?: string; darken?: number }> = ({ index, p, pal, style, label, darken = .08 }) => {
  const frame = useCurrentFrame();
  const image = imagesOf(p)[index % Math.max(1, imagesOf(p).length)];
  const a = seededRand(index * 19 + 3);
  const b = seededRand(index * 19 + 9);
  const c = seededRand(index * 19 + 15);
  const colors = [pal.primary, pal.secondary, accentOf(p, pal), pal.bg];
  const fallback = `radial-gradient(circle at ${18 + a * 64}% ${22 + b * 50}%, ${colors[(index + 1) % colors.length]}dd 0%, transparent 31%), linear-gradient(${105 + c * 110}deg, ${colors[index % colors.length]}, ${colors[(index + 2) % colors.length]} 54%, ${pal.bg})`;
  const zoom = 1.04 + clampInterp(frame, [0, 180], [0, .08]);
  return <div style={{ position: "relative", overflow: "hidden", background: fallback, ...style }}>
    <div style={{ position: "absolute", inset: "-7%", transform: `scale(${zoom}) translate(${Math.sin(frame * .008 + index) * 1.8}%, ${Math.cos(frame * .006 + index) * 1.4}%)`, backgroundImage: image ? `url(${image})` : fallback, backgroundSize: "cover", backgroundPosition: "center", filter: image ? "saturate(.92)" : "none" }} />
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(145deg, transparent 35%, rgba(0,0,0,${darken}) 100%)` }} />
    {label && <div style={{ position: "absolute", left: 24, bottom: 20, color: pal.text, fontFamily: MONO, fontSize: 13, letterSpacing: ".14em", textTransform: "uppercase", textShadow: "0 2px 10px #000" }}>{label}</div>}
  </div>;
};

const Header: React.FC<{ p: TravelFilmsProps; pal: Palette; eyebrow?: string; align?: "left" | "center" }> = ({ p, pal, eyebrow = "TRAVEL FILM / FIELD NOTES", align = "left" }) => {
  const frame = useCurrentFrame();
  const opacity = clampInterp(frame, [0, 22], [0, 1]);
  return <div style={{ position: "absolute", left: 108, right: 108, top: 72, textAlign: align, opacity, color: pal.text, fontFamily: SANS }}>
    <Eyebrow pal={pal}>{eyebrow}</Eyebrow>
    <div style={{ marginTop: 14, fontFamily: SERIF, fontSize: 60, lineHeight: .98, letterSpacing: "-.045em", fontWeight: 500 }}>{p.title}</div>
    <div style={{ marginTop: 13, color: `${pal.text}a8`, fontSize: 20 }}>{p.subtitle}</div>
  </div>;
};

const MapPanel: React.FC<{ p: TravelFilmsProps; pal: Palette; stops: Stop[]; compact?: boolean; route?: boolean }> = ({ p, pal, stops, compact = false, route = true }) => {
  const frame = useCurrentFrame();
  const accent = accentOf(p, pal);
  const width = compact ? 680 : 1120;
  const height = compact ? 420 : 510;
  const points = p.mapPoints?.length ? p.mapPoints : stops.map((s, i) => ({ label: s.name, x: s.x ?? 15 + seededRand(i * 8 + 2) * 70, y: s.y ?? 20 + seededRand(i * 8 + 4) * 62 }));
  const routePath = points.map((q, i) => `${i === 0 ? "M" : "L"}${(q.x / 100) * width} ${(q.y / 100) * height}`).join(" ");
  const reveal = clampInterp(frame, [12, 62], [0, 1]);
  return <div style={{ position: "relative", width, height, border: `1px solid ${pal.text}28`, borderRadius: 26, overflow: "hidden", background: `${pal.text}08`, boxShadow: `0 24px 80px ${pal.bg}99` }}>
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
      <defs><pattern id={`travel-grid-${compact ? "small" : "large"}`} width="46" height="46" patternUnits="userSpaceOnUse"><path d="M46 0H0V46" fill="none" stroke={`${pal.text}13`} strokeWidth="1" /></pattern><filter id={`travel-glow-${compact ? "small" : "large"}`}><feGaussianBlur stdDeviation="10" /></filter></defs>
      <rect width={width} height={height} fill={`${pal.bg}7a`} /><rect width={width} height={height} fill={`url(#travel-grid-${compact ? "small" : "large"})`} />
      <path d={`M0 ${height * .64} C${width * .18} ${height * .42}, ${width * .25} ${height * .76}, ${width * .43} ${height * .54} S${width * .7} ${height * .22}, ${width} ${height * .38} L${width} ${height} L0 ${height}Z`} fill={`${pal.primary}12`} />
      <path d={`M0 ${height * .16} C${width * .25} ${height * .36}, ${width * .35} ${height * .05}, ${width * .58} ${height * .24} S${width * .85} ${height * .12}, ${width} ${height * .28}`} fill="none" stroke={`${pal.secondary}22`} strokeWidth="3" />
      {route && <><path d={routePath} fill="none" stroke={`${accent}30`} strokeWidth="15" strokeLinecap="round" filter={`url(#travel-glow-${compact ? "small" : "large"})`} /><path d={routePath} fill="none" stroke={accent} strokeWidth={compact ? 4 : 6} strokeDasharray="1200" strokeDashoffset={1200 * (1 - reveal)} strokeLinecap="round" /></>}
      {points.map((q, i) => { const x = q.x / 100 * width; const y = q.y / 100 * height; const on = clampInterp(frame, [22 + i * 8, 38 + i * 8], [0, 1]); return <g key={`${q.label ?? "stop"}-${i}`} opacity={on}><circle cx={x} cy={y} r={22} fill={`${accent}22`} /><circle cx={x} cy={y} r={compact ? 7 : 10} fill={i === points.length - 1 ? accent : pal.text} stroke={accent} strokeWidth="4" /><text x={x + 16} y={y - 17} fill={pal.text} fontFamily={MONO} fontSize={compact ? 12 : 15} fontWeight="800">{q.label ?? `STOP ${String(i + 1).padStart(2, "0")}`}</text></g>; })}
    </svg>
    <div style={{ position: "absolute", left: 22, bottom: 18, color: `${pal.text}6e`, fontFamily: MONO, fontSize: 11, letterSpacing: ".16em" }}>SCHEMATIC ROUTE / NOT TO SCALE</div>
  </div>;
};

const DestinationOpen: React.FC<{ p: TravelFilmsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const stops = stopsOf(p); const accent = accentOf(p, pal); const image = imagesOf(p)[0];
  return <AbsoluteFill style={{ backgroundColor: pal.bg }}><Photo index={0} p={p} pal={pal} style={{ position: "absolute", inset: 0 }} darken={.36} /><div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${pal.bg}d9 0%, transparent 68%), linear-gradient(transparent 48%, ${pal.bg}e6 100%)` }} />
    <div style={{ position: "absolute", left: 116, top: 175, width: 900, color: pal.text, opacity: clampInterp(frame, [12, 44], [0, 1]), transform: `translateY(${clampInterp(frame, [12, 44], [42, 0])}px)` }}><Eyebrow pal={pal} color={accent}>TRAVEL FILM / DESTINATION OPEN</Eyebrow><div style={{ marginTop: 22, fontFamily: SERIF, fontSize: 110, lineHeight: .87, letterSpacing: "-.06em" }}>{text(p.destination, p.title)}</div><div style={{ marginTop: 30, fontFamily: SANS, fontSize: 27, color: `${pal.text}c2` }}>{p.dates} <span style={{ color: accent }}>·</span> {text(p.subtitle, "A field guide in moving pictures")}</div></div>
    <div style={{ position: "absolute", left: 116, bottom: 70, right: 116, display: "flex", justifyContent: "space-between", alignItems: "flex-end", color: pal.text, fontFamily: MONO, fontSize: 13, letterSpacing: ".12em" }}><span>{text(p.photographer, "FIELD NOTES / 2026")}</span><span style={{ color: accent }}>{String(stops.length).padStart(2, "0")} STOPS</span></div>{image && <div style={{ position: "absolute", right: 110, top: 72, color: `${pal.text}99`, fontFamily: MONO, fontSize: 11 }}>IMAGE / 01</div>}
  </AbsoluteFill>;
};

const RouteToPlace: React.FC<{ p: TravelFilmsProps; pal: Palette }> = ({ p, pal }) => <AbsoluteFill style={{ background: pal.bg }}><Header p={p} pal={pal} eyebrow="TRAVEL FILM / ROUTE TO PLACE" /><div style={{ position: "absolute", left: 105, top: 250 }}><MapPanel p={p} pal={pal} stops={stopsOf(p)} /></div><div style={{ position: "absolute", left: 110, bottom: 58, color: `${pal.text}98`, fontFamily: SANS, fontSize: 22 }}>{text(p.subtitle, "Follow the line until the view changes")}</div></AbsoluteFill>;

const DayCard: React.FC<{ p: TravelFilmsProps; pal: Palette }> = ({ p, pal }) => { const frame = useCurrentFrame(); const stops = stopsOf(p); const i = Math.min(stops.length - 1, Math.floor(frame / 38)); const stop = stops[i]; return <AbsoluteFill style={{ background: pal.bg }}><Header p={p} pal={pal} eyebrow="TRAVEL FILM / DAILY LOG" /><div style={{ position: "absolute", left: 112, top: 288, width: 560, color: pal.text }}><div style={{ color: accentOf(p, pal), fontFamily: MONO, fontSize: 20, letterSpacing: ".2em", fontWeight: 800 }}>{stop.day ?? `DAY ${String(i + 1).padStart(2, "0")}`}</div><div style={{ marginTop: 15, fontFamily: SERIF, fontSize: 86, lineHeight: .92 }}>{stop.name}</div><div style={{ marginTop: 16, fontFamily: SANS, fontSize: 24, color: `${pal.text}a8` }}>{stop.city ?? p.destination}</div><div style={{ marginTop: 32, borderLeft: `4px solid ${accentOf(p, pal)}`, paddingLeft: 20, fontFamily: SERIF, fontSize: 28, lineHeight: 1.25 }}>{stop.note ?? captionsOf(p)[i % captionsOf(p).length]}</div></div><Photo index={i + 1} p={p} pal={pal} style={{ position: "absolute", left: 820, top: 240, width: 760, height: 610, borderRadius: 4 }} label={stop.city ?? stop.name} /></AbsoluteFill>; };

const FoodStop: React.FC<{ p: TravelFilmsProps; pal: Palette }> = ({ p, pal }) => { const frame = useCurrentFrame(); const accent = accentOf(p, pal); return <AbsoluteFill style={{ background: `linear-gradient(135deg, ${pal.bg}, ${pal.primary}25)` }}><Photo index={2} p={p} pal={pal} style={{ position: "absolute", left: 0, top: 0, width: "57%", height: "100%" }} darken={.2} label="FOOD / LOCAL STOP" /><div style={{ position: "absolute", right: 92, top: 125, width: 610, color: pal.text, opacity: clampInterp(frame, [10, 32], [0, 1]) }}><Eyebrow pal={pal} color={accent}>TRAVEL FILM / FOOD STOP</Eyebrow><div style={{ marginTop: 25, fontFamily: SERIF, fontSize: 76, lineHeight: .95 }}>{text(p.food, "A table worth taking the long way for")}</div><div style={{ marginTop: 25, fontFamily: SANS, fontSize: 24, color: `${pal.text}a8` }}>{text(p.subtitle, "Local flavor, no reservations required")}</div><div style={{ marginTop: 70, display: "flex", gap: 18, alignItems: "center", color: accent, fontFamily: MONO, fontSize: 14, letterSpacing: ".16em" }}><span style={{ width: 48, height: 2, background: accent }} />{p.destination.toUpperCase()}</div></div></AbsoluteFill>; };

const LandmarkReveal: React.FC<{ p: TravelFilmsProps; pal: Palette }> = ({ p, pal }) => { const frame = useCurrentFrame(); const reveal = clampInterp(frame, [20, 100], [0, 1]); const accent = accentOf(p, pal); const name = stopsOf(p)[Math.min(1, stopsOf(p).length - 1)]?.name ?? p.destination; return <AbsoluteFill style={{ background: pal.bg }}><Photo index={3} p={p} pal={pal} style={{ position: "absolute", inset: 0, transform: `scale(${1.15 - reveal * .15})` }} darken={.28} /><div style={{ position: "absolute", inset: 0, background: `linear-gradient(${90 - reveal * 90}deg, ${pal.bg}e8, transparent 68%)` }} /><div style={{ position: "absolute", left: 120, bottom: 105, color: pal.text, clipPath: `inset(0 ${100 - reveal * 100}% 0 0)` }}><Eyebrow pal={pal} color={accent}>LANDMARK / MEMORY {String(frame).padStart(3, "0")}</Eyebrow><div style={{ marginTop: 14, fontFamily: SERIF, fontSize: 106, lineHeight: .88 }}>{name}</div><div style={{ marginTop: 18, fontFamily: SANS, fontSize: 24, color: `${pal.text}b5` }}>{captionsOf(p)[2]}</div></div></AbsoluteFill>; };

const HotelCard: React.FC<{ p: TravelFilmsProps; pal: Palette }> = ({ p, pal }) => { const frame = useCurrentFrame(); const accent = accentOf(p, pal); return <AbsoluteFill style={{ background: pal.bg }}><Header p={p} pal={pal} eyebrow="TRAVEL FILM / REST STOP" /><div style={{ position: "absolute", left: 110, top: 278, width: 790, height: 570 }}><Photo index={4} p={p} pal={pal} style={{ width: "100%", height: "100%" }} label="ROOM / VIEW / MORNING" /></div><div style={{ position: "absolute", left: 965, top: 320, color: pal.text, width: 650, opacity: clampInterp(frame, [10, 40], [0, 1]) }}><Eyebrow pal={pal} color={accent}>A PLACE TO PAUSE</Eyebrow><div style={{ marginTop: 20, fontFamily: SERIF, fontSize: 70, lineHeight: .98 }}>{text(p.hotel, "The quiet room above the harbor")}</div><div style={{ marginTop: 25, fontFamily: SANS, fontSize: 23, color: `${pal.text}a5`, lineHeight: 1.5 }}>{text(p.subtitle, "A soft landing between two long days.")}</div><div style={{ marginTop: 46, color: accent, fontFamily: MONO, fontSize: 14, letterSpacing: ".18em" }}>CHECK IN / {p.dates}</div></div></AbsoluteFill>; };

const SunsetRecap: React.FC<{ p: TravelFilmsProps; pal: Palette }> = ({ p, pal }) => { const frame = useCurrentFrame(); const captions = captionsOf(p); return <AbsoluteFill style={{ background: `linear-gradient(180deg, ${pal.primary}, ${pal.bg} 82%)` }}><div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 72% 40%, ${accentOf(p, pal)}99 0%, transparent 32%)` }} /><Header p={p} pal={pal} eyebrow="TRAVEL FILM / SUNSET RECAP" align="center" /><div style={{ position: "absolute", left: 120, right: 120, top: 355, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>{[0, 1, 2, 3].map((i) => <div key={i} style={{ height: 330, transform: `translateY(${Math.sin(frame * .03 + i) * 7}px) rotate(${(i - 1.5) * 1.2}deg)` }}><Photo index={i + 1} p={p} pal={pal} style={{ width: "100%", height: "100%" }} label={captions[i % captions.length]} /></div>)}</div><div style={{ position: "absolute", left: 120, right: 120, bottom: 55, display: "flex", justifyContent: "space-between", color: pal.text, fontFamily: MONO, fontSize: 13, letterSpacing: ".16em" }}><span>{p.destination.toUpperCase()}</span><span>{p.dates}</span><span>{captions.length} MOMENTS</span></div></AbsoluteFill>; };

const MapToMemory: React.FC<{ p: TravelFilmsProps; pal: Palette }> = ({ p, pal }) => { const frame = useCurrentFrame(); const stops = stopsOf(p); const i = Math.min(stops.length - 1, Math.floor(frame / 42)); const current = stops[i]; return <AbsoluteFill style={{ background: pal.bg }}><Header p={p} pal={pal} eyebrow="TRAVEL FILM / MAP TO MEMORY" /><div style={{ position: "absolute", left: 90, top: 260 }}><MapPanel p={p} pal={pal} stops={stops} compact /></div><div style={{ position: "absolute", left: 850, top: 300, width: 700, color: pal.text }}><Eyebrow pal={pal}>STOP {String(i + 1).padStart(2, "0")} / {current.city ?? p.destination}</Eyebrow><div style={{ marginTop: 22, fontFamily: SERIF, fontSize: 75, lineHeight: .92 }}>{current.name}</div><div style={{ marginTop: 25, fontFamily: SANS, fontSize: 25, color: `${pal.text}aa`, lineHeight: 1.4 }}>{current.note ?? captionsOf(p)[i % captionsOf(p).length]}</div><Photo index={i} p={p} pal={pal} style={{ marginTop: 32, width: 590, height: 210 }} label="MEMORY / CAPTURED HERE" /></div></AbsoluteFill>; };

const TripTimeline: React.FC<{ p: TravelFilmsProps; pal: Palette }> = ({ p, pal }) => { const frame = useCurrentFrame(); const stops = stopsOf(p); const accent = accentOf(p, pal); return <AbsoluteFill style={{ background: pal.bg }}><Header p={p} pal={pal} eyebrow="TRAVEL FILM / TRIP TIMELINE" /><div style={{ position: "absolute", left: 120, right: 120, top: 390, height: 5, background: `${pal.text}25` }}><div style={{ position: "absolute", left: 0, top: 0, width: `${clampInterp(frame, [0, 120], [0, 100])}%`, height: 5, background: accent }} />{stops.map((s, i) => { const x = i / Math.max(1, stops.length - 1) * 100; const on = clampInterp(frame, [15 + i * 9, 35 + i * 9], [0, 1]); return <div key={i} style={{ position: "absolute", left: `${x}%`, top: -13, width: 30, height: 30, borderRadius: "50%", background: on > .5 ? accent : pal.bg, border: `4px solid ${accent}`, transform: "translateX(-50%)", opacity: on }} />; })}</div><div style={{ position: "absolute", left: 120, right: 120, top: 445, display: "flex", justifyContent: "space-between", color: pal.text }}>{stops.map((s, i) => <div key={i} style={{ width: `${100 / stops.length}%`, paddingRight: 15, opacity: clampInterp(frame, [20 + i * 7, 38 + i * 7], [0, 1]) }}><div style={{ color: accent, fontFamily: MONO, fontSize: 12, letterSpacing: ".14em" }}>{s.day ?? `DAY ${String(i + 1).padStart(2, "0")}`}</div><div style={{ marginTop: 10, fontFamily: SERIF, fontSize: 27 }}>{s.name}</div><div style={{ marginTop: 8, color: `${pal.text}88`, fontFamily: SANS, fontSize: 15 }}>{s.city ?? p.destination}</div></div>)}</div><div style={{ position: "absolute", left: 120, bottom: 60, color: `${pal.text}8a`, fontFamily: MONO, fontSize: 13, letterSpacing: ".14em" }}>{p.dates} / {stops.length} STOPS / {text(p.photographer, "TRAVEL NOTES")}</div></AbsoluteFill>; };

const TravelClose: React.FC<{ p: TravelFilmsProps; pal: Palette }> = ({ p, pal }) => { const frame = useCurrentFrame(); const accent = accentOf(p, pal); return <AbsoluteFill style={{ background: pal.bg, color: pal.text }}><div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 42%, ${accent}28 0%, transparent 42%)` }} /><div style={{ position: "absolute", left: 120, right: 120, top: 230, textAlign: "center", opacity: clampInterp(frame, [14, 48], [0, 1]), transform: `translateY(${clampInterp(frame, [14, 48], [28, 0])}px)` }}><Eyebrow pal={pal} color={accent}>END OF THE ROAD</Eyebrow><div style={{ marginTop: 26, fontFamily: SERIF, fontSize: 116, lineHeight: .86, letterSpacing: "-.06em" }}>{text(p.title, "Until the next map")}</div><div style={{ margin: "28px auto 0", maxWidth: 700, color: `${pal.text}a8`, fontFamily: SANS, fontSize: 25, lineHeight: 1.4 }}>{text(p.subtitle, "The best souvenirs are the stories that keep moving.")}</div></div><div style={{ position: "absolute", left: 120, right: 120, bottom: 66, display: "flex", justifyContent: "space-between", color: `${pal.text}8d`, fontFamily: MONO, fontSize: 12, letterSpacing: ".18em" }}><span>{p.destination.toUpperCase()}</span><span>{p.dates}</span><span>TRAVEL FILMS / 01</span></div></AbsoluteFill>; };

export const TravelFilmsTemplate: React.FC<TravelFilmsProps> = (p) => {
  const pal = resolvePalette(p.paletteName);
  const content = p.variant === "destination-open" ? <DestinationOpen p={p} pal={pal} /> : p.variant === "route-to-place" ? <RouteToPlace p={p} pal={pal} /> : p.variant === "day-card" ? <DayCard p={p} pal={pal} /> : p.variant === "food-stop" ? <FoodStop p={p} pal={pal} /> : p.variant === "landmark-reveal" ? <LandmarkReveal p={p} pal={pal} /> : p.variant === "hotel-card" ? <HotelCard p={p} pal={pal} /> : p.variant === "sunset-recap" ? <SunsetRecap p={p} pal={pal} /> : p.variant === "map-to-memory" ? <MapToMemory p={p} pal={pal} /> : p.variant === "trip-timeline" ? <TripTimeline p={p} pal={pal} /> : <TravelClose p={p} pal={pal} />;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <AbsoluteFill style={{ backgroundColor: pal.bg, color: pal.text, overflow: "hidden" }}><FadeEdges inFrames={12} outFrames={16}><div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}>{content}</div></FadeEdges><div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `linear-gradient(180deg, ${pal.bg}16, transparent 24%, transparent 78%, ${pal.bg}34)` }} /></AbsoluteFill>;
};

const familyCast = (c: React.FC<TravelFilmsProps>) => c as unknown as React.ComponentType<Record<string, unknown>>;
export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = Object.fromEntries(VARIANTS.map((variant) => [`travel-films-${variant}`, familyCast(TravelFilmsTemplate)]));
