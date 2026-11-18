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
  clampInterp,
  resolvePalette,
  seededRand,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: cinematic-credits
 * A reusable credit/title system for films, documentaries, festivals, and branded stories.
 * All defaults are procedural and safe to render without external assets.
 */
export type CinematicCreditsVariant =
  | "opening-credits"
  | "end-credits"
  | "chapter-credits"
  | "cast-grid"
  | "crew-scroll"
  | "festival-card"
  | "production-card"
  | "location-card"
  | "dedication-card"
  | "credit-fade";

export interface CinematicCreditsProps {
  variant: CinematicCreditsVariant;
  title: string;
  subtitle: string;
  names: string[];
  credits: string[];
  production: string;
  date: string;
  location: string;
  dedication: string;
  logo: string;
  background?: string;
  scrollSpeed: number;
  paletteName: string;
}

const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, monospace';

const splitPair = (value: string): [string, string] => {
  const [a, ...rest] = value.split("|");
  return [a?.trim() || "", rest.join("|").trim()];
};

const listOr = (items: string[] | undefined, fallback: string[]): string[] =>
  items?.filter((item) => item.trim().length > 0).length ? items.filter((item) => item.trim().length > 0) : fallback;

const FilmBackdrop: React.FC<{ pal: Palette; image?: string; seed?: number }> = ({ pal, image, seed = 3 }) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame * 0.008 + seed) * 1.8;
  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        backgroundColor: pal.bg,
        backgroundImage: image
          ? `linear-gradient(90deg, ${pal.bg}d9, ${pal.bg}55), url(${image})`
          : `radial-gradient(circle at ${40 + drift}% 32%, ${pal.primary}38, transparent 34%), radial-gradient(circle at 78% 74%, ${pal.accent}24, transparent 28%), linear-gradient(135deg, ${pal.bg}, ${pal.bgAlt ?? pal.bg})`,
        backgroundSize: "cover",
        backgroundPosition: `${50 + drift}% 50%`,
      }}
    >
      <div style={{ position: "absolute", inset: 0, opacity: 0.13, backgroundImage: `linear-gradient(${pal.text} 1px, transparent 1px), linear-gradient(90deg, ${pal.text} 1px, transparent 1px)`, backgroundSize: "120px 120px", transform: `translateX(${-(frame % 120)}px)` }} />
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${pal.bg}cc 0%, transparent 28%, transparent 72%, ${pal.bg}ee 100%)` }} />
    </AbsoluteFill>
  );
};

const Letterbox: React.FC<{ pal: Palette }> = ({ pal }) => (
  <>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "7.5%", background: `${pal.bg}f2`, zIndex: 4 }} />
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "7.5%", background: `${pal.bg}f2`, zIndex: 4 }} />
  </>
);

const FilmMeta: React.FC<{ p: CinematicCreditsProps; pal: Palette; align?: "left" | "center" }> = ({ p, pal, align = "left" }) => (
  <div style={{ textAlign: align, color: `${pal.text}8a`, font: `600 16px ${MONO}`, letterSpacing: "0.2em", textTransform: "uppercase" }}>
    <span>{p.production}</span><span style={{ margin: "0 16px", color: pal.accent }}>·</span><span>{p.date}</span>
  </div>
);

const CreditRows: React.FC<{ items: string[]; pal: Palette; columns?: boolean }> = ({ items, pal, columns = false }) => (
  <div style={{ display: columns ? "grid" : "flex", gridTemplateColumns: columns ? "repeat(2, minmax(0, 1fr))" : undefined, flexDirection: columns ? undefined : "column", gap: columns ? 20 : 26 }}>
    {items.map((item, i) => {
      const [role, name] = splitPair(item);
      return (
        <div key={`${item}-${i}`} style={{ borderTop: `1px solid ${pal.text}25`, paddingTop: 12, minWidth: 0 }}>
          <div style={{ color: `${pal.text}6c`, font: `600 14px ${MONO}`, letterSpacing: "0.18em", textTransform: "uppercase" }}>{role}</div>
          <div style={{ color: pal.text, font: `600 ${columns ? 24 : 29}px ${SERIF}`, marginTop: 6, overflowWrap: "anywhere" }}>{name || role}</div>
        </div>
      );
    })}
  </div>
);

const OpeningCredits: React.FC<{ p: CinematicCreditsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({ frame: Math.max(0, frame - 12), fps, config: { damping: 22, stiffness: 70 } });
  const titleOpacity = clampInterp(frame, [20, 45], [0, 1]);
  return (
    <AbsoluteFill style={{ padding: "14% 12%", display: "flex", flexDirection: "column", justifyContent: "space-between", color: pal.text }}>
      <div style={{ opacity: reveal, transform: `translateY(${(1 - reveal) * 30}px)` }}><FilmMeta p={p} pal={pal} /><div style={{ marginTop: 20, color: pal.secondary, font: `500 22px ${SERIF}`, letterSpacing: "0.08em" }}>{p.subtitle}</div></div>
      <div style={{ opacity: titleOpacity, transform: `translateX(${(1 - titleOpacity) * -70}px)` }}>
        <div style={{ color: pal.accent, font: `700 18px ${MONO}`, letterSpacing: "0.35em", textTransform: "uppercase", marginBottom: 22 }}>{p.logo || "A FILM BY"}</div>
        <div style={{ font: `500 clamp(74px, 9vw, 158px)/0.9 ${SERIF}`, letterSpacing: "-0.045em", maxWidth: 1150 }}>{p.title}</div>
        <div style={{ width: 180, height: 3, marginTop: 34, background: pal.accent, transform: `scaleX(${clampInterp(frame, [35, 62], [0, 1])})`, transformOrigin: "left" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", opacity: clampInterp(frame, [48, 70], [0, 1]) }}><div style={{ color: `${pal.text}80`, font: `500 21px ${SANS}`, maxWidth: 550 }}>{p.location}</div><span style={{ color: pal.secondary, font: `700 16px ${MONO}`, letterSpacing: "0.2em" }}>01 / 10</span></div>
    </AbsoluteFill>
  );
};

const EndCredits: React.FC<{ p: CinematicCreditsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const fade = clampInterp(frame, [12, 52], [0, 1]);
  return (
    <AbsoluteFill style={{ padding: "15% 16%", color: pal.text, textAlign: "center", opacity: fade }}>
      <div style={{ color: pal.secondary, font: `600 16px ${MONO}`, letterSpacing: "0.32em", textTransform: "uppercase" }}>The end</div>
      <div style={{ marginTop: 28, font: `500 clamp(62px, 7vw, 120px)/0.95 ${SERIF}`, letterSpacing: "-0.04em" }}>{p.title}</div>
      <div style={{ margin: "40px auto", width: 120, height: 2, background: pal.accent }} />
      <CreditRows items={listOr(p.credits, ["Written & directed by|Avery North", "Produced by|Northstar Pictures", "Original score|The Quiet Room"])} pal={pal} />
      <div style={{ marginTop: 56, color: `${pal.text}7d`, font: `500 20px ${SANS}` }}>{p.dedication || p.subtitle}</div>
    </AbsoluteFill>
  );
};

const ChapterCredits: React.FC<{ p: CinematicCreditsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inSpring = spring({ frame: Math.max(0, frame - 7), fps, config: { damping: 18, stiffness: 100 } });
  const number = String(Math.min(9, Math.floor(frame / 30) + 1)).padStart(2, "0");
  return (
    <AbsoluteFill style={{ padding: "12%", display: "grid", gridTemplateColumns: "0.8fr 2fr", alignItems: "center", color: pal.text }}>
      <div style={{ color: pal.accent, font: `500 150px ${SERIF}`, opacity: inSpring, transform: `translateY(${(1 - inSpring) * 50}px)` }}>{number}</div>
      <div style={{ borderLeft: `1px solid ${pal.text}42`, paddingLeft: 74, opacity: inSpring }}><FilmMeta p={p} pal={pal} /><div style={{ marginTop: 26, font: `500 clamp(64px, 7vw, 130px)/0.95 ${SERIF}`, letterSpacing: "-0.04em" }}>{p.title}</div><div style={{ color: `${pal.text}8a`, font: `400 27px/1.45 ${SANS}`, marginTop: 30, maxWidth: 720 }}>{p.subtitle}</div></div>
    </AbsoluteFill>
  );
};

const CastGrid: React.FC<{ p: CinematicCreditsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const people = listOr(p.names, ["Lead|Mara Vale", "Co-lead|Jon Bell", "Guest|Nia Park", "Narrator|Sol Reed", "Director|Avery North", "Producer|Mina Cole"]);
  return (
    <AbsoluteFill style={{ padding: "10% 11%", color: pal.text }}>
      <FilmMeta p={p} pal={pal} /><div style={{ margin: "24px 0 48px", font: `500 clamp(52px, 6vw, 106px) ${SERIF}` }}>{p.title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 34 }}>{people.slice(0, 9).map((item, i) => { const [role, name] = splitPair(item); const enter = clampInterp(frame, [i * 5 + 8, i * 5 + 28], [0, 1]); return <div key={`${item}-${i}`} style={{ opacity: enter, transform: `translateY(${(1 - enter) * 28}px)`, borderTop: `2px solid ${i % 3 === 0 ? pal.accent : `${pal.text}35`}`, paddingTop: 18 }}><div style={{ color: `${pal.text}6e`, font: `600 14px ${MONO}`, letterSpacing: "0.14em", textTransform: "uppercase" }}>{role}</div><div style={{ marginTop: 8, font: `500 30px ${SERIF}` }}>{name || role}</div></div>; })}</div>
    </AbsoluteFill>
  );
};

const CrewScroll: React.FC<{ p: CinematicCreditsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const items = listOr(p.credits, ["Written by|Avery North", "Directed by|Mara Vale", "Cinematography|Jon Bell", "Production Design|Nia Park", "Edited by|Sol Reed", "Original Music|The Quiet Room", "Color|Mina Cole", "Special Thanks|Everyone who stayed"]);
  const y = 820 - frame * Math.max(0.45, p.scrollSpeed || 1) * 4.2;
  return (
    <AbsoluteFill style={{ overflow: "hidden", color: pal.text, padding: "0 18%" }}>
      <div style={{ position: "absolute", top: 84, left: 0, right: 0, textAlign: "center", color: pal.accent, font: `700 17px ${MONO}`, letterSpacing: "0.32em", textTransform: "uppercase" }}>Credits</div>
      <div style={{ position: "absolute", left: 0, right: 0, transform: `translateY(${y}px)`, textAlign: "center" }}><div style={{ font: `500 78px ${SERIF}`, marginBottom: 90 }}>{p.title}</div>{items.map((item, i) => { const [role, name] = splitPair(item); return <div key={`${item}-${i}`} style={{ marginBottom: 55 }}><div style={{ color: pal.secondary, font: `600 15px ${MONO}`, letterSpacing: "0.2em", textTransform: "uppercase" }}>{role}</div><div style={{ marginTop: 10, font: `500 38px ${SERIF}` }}>{name || role}</div></div>; })}</div>
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(${pal.bg} 0%, transparent 20%, transparent 78%, ${pal.bg} 100%)`, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

const FestivalCard: React.FC<{ p: CinematicCreditsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const stamp = clampInterp(frame, [18, 50], [0, 1]);
  return <AbsoluteFill style={{ padding: "10% 11%", color: pal.text, display: "flex", flexDirection: "column", justifyContent: "space-between" }}><div style={{ display: "flex", justifyContent: "space-between", color: pal.secondary, font: `700 16px ${MONO}`, letterSpacing: "0.24em", textTransform: "uppercase" }}><span>{p.logo || "OFFICIAL SELECTION"}</span><span>{p.date}</span></div><div style={{ borderTop: `1px solid ${pal.text}45`, borderBottom: `1px solid ${pal.text}45`, padding: "56px 0", transform: `translateX(${(1 - stamp) * -45}px)`, opacity: stamp }}><div style={{ color: pal.accent, font: `700 18px ${MONO}`, letterSpacing: "0.24em", textTransform: "uppercase" }}>{p.production}</div><div style={{ marginTop: 18, font: `500 clamp(66px, 8vw, 145px)/0.9 ${SERIF}`, maxWidth: 1200 }}>{p.title}</div><div style={{ marginTop: 28, color: `${pal.text}86`, font: `400 25px ${SANS}` }}>{p.subtitle}</div></div><div style={{ display: "flex", justifyContent: "space-between", color: `${pal.text}78`, font: `500 18px ${SANS}` }}><span>{p.location}</span><span>Presented with distinction</span></div></AbsoluteFill>;
};

const ProductionCard: React.FC<{ p: CinematicCreditsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const enter = clampInterp(frame, [10, 42], [0, 1]);
  return <AbsoluteFill style={{ padding: "13% 13%", color: pal.text, display: "flex", alignItems: "center" }}><div style={{ maxWidth: 850, opacity: enter, transform: `translateY(${(1 - enter) * 40}px)` }}><div style={{ color: pal.accent, font: `700 16px ${MONO}`, letterSpacing: "0.3em", textTransform: "uppercase" }}>A production by</div><div style={{ marginTop: 22, font: `500 clamp(70px, 9vw, 150px)/0.88 ${SERIF}` }}>{p.production}</div><div style={{ marginTop: 42, width: 100, height: 3, background: pal.accent }} /><div style={{ marginTop: 34, color: `${pal.text}8b`, font: `400 25px/1.45 ${SANS}` }}>{p.subtitle}</div></div><div style={{ position: "absolute", right: "12%", bottom: "14%", color: pal.secondary, font: `600 18px ${MONO}`, letterSpacing: "0.16em" }}>{p.date}</div></AbsoluteFill>;
};

const LocationCard: React.FC<{ p: CinematicCreditsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const scan = (frame * 2.4) % 100;
  return <AbsoluteFill style={{ padding: "10% 11%", color: pal.text, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}><div style={{ position: "absolute", top: `${20 + scan * 0.45}%`, left: "11%", right: "11%", height: 1, background: `${pal.accent}88` }} /><div style={{ color: pal.secondary, font: `600 15px ${MONO}`, letterSpacing: "0.25em", textTransform: "uppercase" }}>Location / {p.date}</div><div style={{ marginTop: 20, font: `500 clamp(74px, 9vw, 160px)/0.86 ${SERIF}`, letterSpacing: "-0.05em" }}>{p.location}</div><div style={{ marginTop: 26, color: `${pal.text}82`, font: `400 26px ${SANS}`, maxWidth: 700 }}>{p.subtitle}</div><div style={{ position: "absolute", top: "11%", right: "11%", font: `700 40px ${MONO}`, color: pal.accent }}>N {String(Math.round(seededRand(4) * 90 + 10)).padStart(2, "0")}°</div></AbsoluteFill>;
};

const DedicationCard: React.FC<{ p: CinematicCreditsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const inOpacity = clampInterp(frame, [22, 64], [0, 1]);
  return <AbsoluteFill style={{ padding: "12%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: pal.text, textAlign: "center", opacity: inOpacity }}><div style={{ color: pal.accent, font: `700 17px ${MONO}`, letterSpacing: "0.3em", textTransform: "uppercase" }}>Dedicated to</div><div style={{ marginTop: 30, maxWidth: 1180, font: `italic 500 clamp(66px, 8vw, 140px)/0.92 ${SERIF}`, letterSpacing: "-0.04em" }}>{p.dedication || p.title}</div><div style={{ marginTop: 48, width: 70, height: 2, background: pal.secondary }} /><div style={{ marginTop: 28, color: `${pal.text}78`, font: `400 23px ${SANS}` }}>{p.subtitle}</div></AbsoluteFill>;
};

const CreditFade: React.FC<{ p: CinematicCreditsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const first = clampInterp(frame, [0, 40], [0, 1]); const second = clampInterp(frame, [55, 110], [0, 1]);
  return <AbsoluteFill style={{ padding: "11% 13%", color: pal.text }}><div style={{ opacity: first, transform: `translateY(${(1 - first) * 30}px)` }}><FilmMeta p={p} pal={pal} /><div style={{ marginTop: 24, font: `500 clamp(62px, 7vw, 120px) ${SERIF}` }}>{p.title}</div></div><div style={{ position: "absolute", left: "13%", right: "13%", bottom: "13%", opacity: second }}><CreditRows items={listOr(p.credits, ["Written by|Avery North", "Produced by|Northstar Pictures"])} pal={pal} columns /><div style={{ marginTop: 34, color: pal.secondary, font: `400 22px ${SANS}` }}>{p.dedication || p.subtitle}</div></div></AbsoluteFill>;
};

const VARIANTS: Record<CinematicCreditsVariant, React.FC<{ p: CinematicCreditsProps; pal: Palette }>> = {
  "opening-credits": OpeningCredits,
  "end-credits": EndCredits,
  "chapter-credits": ChapterCredits,
  "cast-grid": CastGrid,
  "crew-scroll": CrewScroll,
  "festival-card": FestivalCard,
  "production-card": ProductionCard,
  "location-card": LocationCard,
  "dedication-card": DedicationCard,
  "credit-fade": CreditFade,
};

export const CinematicCreditsTemplate: React.FC<CinematicCreditsProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? OpeningCredits;
  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg, fontFamily: SANS }}>
      <FilmBackdrop pal={pal} image={props.background} seed={props.title.length} />
      <GradientMeshBackground palette={pal} speed={0.16} blobs={2} />
      <FadeEdges inFrames={10} outFrames={14}><Variant p={props} pal={pal} /></FadeEdges>
      <Letterbox pal={pal} />
    </AbsoluteFill>
  );
};

const familyCast = (component: React.FC<CinematicCreditsProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "cinematic-credits-opening-credits": familyCast(CinematicCreditsTemplate),
  "cinematic-credits-end-credits": familyCast(CinematicCreditsTemplate),
  "cinematic-credits-chapter-credits": familyCast(CinematicCreditsTemplate),
  "cinematic-credits-cast-grid": familyCast(CinematicCreditsTemplate),
  "cinematic-credits-crew-scroll": familyCast(CinematicCreditsTemplate),
  "cinematic-credits-festival-card": familyCast(CinematicCreditsTemplate),
  "cinematic-credits-production-card": familyCast(CinematicCreditsTemplate),
  "cinematic-credits-location-card": familyCast(CinematicCreditsTemplate),
  "cinematic-credits-dedication-card": familyCast(CinematicCreditsTemplate),
  "cinematic-credits-credit-fade": familyCast(CinematicCreditsTemplate),
};
