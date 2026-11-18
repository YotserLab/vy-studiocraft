import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  FadeEdges,
  GradientMeshBackground,
  clampInterp,
  resolvePalette,
  seededRand,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: launch-campaign
 * Ten modular launch-film beats: tease, reveal, proof, availability, and recap.
 * All visuals are procedural by default; productImage and logo are optional replacements.
 */
type LaunchVariant =
  | "mystery-teaser"
  | "date-announcement"
  | "reveal-door"
  | "feature-drop"
  | "waitlist-open"
  | "launch-day"
  | "press-quote"
  | "availability-map"
  | "limited-release"
  | "launch-recap";

export interface LaunchCampaignProps {
  variant: LaunchVariant;
  productName: string;
  eyebrow: string;
  headline: string;
  subheadline: string;
  date: string;
  features: string[];
  productImage?: string;
  logo?: string;
  cta: string;
  channels: string[];
  paletteName: string;
  accentColor?: string;
  price?: string;
  quote?: string;
  locations?: string[];
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
type VP = { p: LaunchCampaignProps; pal: Palette };

const safe = (items: string[] | undefined, fallback: string[]) => (items?.length ? items : fallback);
const accent = (p: LaunchCampaignProps, pal: Palette) => p.accentColor || pal.accent;

const Wordmark: React.FC<VP & { dark?: boolean }> = ({ p, pal, dark = false }) => {
  const a = accent(p, pal);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, color: dark ? pal.bg : pal.text, fontFamily: FONT, fontWeight: 900, letterSpacing: "-.045em", fontSize: 24 }}>
      {p.logo ? <img src={p.logo} alt="" style={{ width: 38, height: 38, objectFit: "contain" }} /> : <span style={{ width: 38, height: 38, borderRadius: 12, display: "grid", placeItems: "center", background: a, color: dark ? pal.text : pal.bg, fontSize: 17 }}>✦</span>}
      {p.productName}
    </div>
  );
};

const Eyebrow: React.FC<{ children: React.ReactNode; color: string }> = ({ children, color }) => (
  <div style={{ color, font: `800 15px ${MONO}`, letterSpacing: ".22em", textTransform: "uppercase" }}>{children}</div>
);

const ProductCard: React.FC<VP & { dark?: boolean; label?: string; size?: number }> = ({ p, pal, dark = false, label = "PRODUCT / 001", size = 1 }) => {
  const a = accent(p, pal);
  return (
    <div style={{ position: "relative", width: 580 * size, height: 470 * size, overflow: "hidden", borderRadius: 28 * size, background: `linear-gradient(145deg, ${a}cc, ${pal.primary}cc 48%, ${pal.secondary}55)`, border: `1px solid ${pal.text}30`, boxShadow: `0 35px 90px ${pal.bg}99`, color: dark ? pal.bg : pal.text }}>
      {p.productImage ? <img src={p.productImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : <>
        <div style={{ position: "absolute", width: "76%", height: "76%", left: "12%", top: "10%", borderRadius: "50%", background: `radial-gradient(circle at 32% 28%, ${pal.text}c9, ${a}66 40%, transparent 72%)`, transform: "rotate(-12deg)" }} />
        <div style={{ position: "absolute", right: "-10%", bottom: "-20%", width: "70%", height: "70%", borderRadius: 90, background: `${pal.bg}55`, transform: "rotate(25deg)" }} />
        <div style={{ position: "absolute", left: "14%", bottom: "14%", width: "42%", height: 13 * size, borderRadius: 99, background: `${pal.text}77` }} />
      </>}
      <div style={{ position: "absolute", left: 24 * size, top: 22 * size, padding: `${9 * size}px ${12 * size}px`, borderRadius: 8 * size, background: `${pal.bg}b8`, color: pal.text, font: `800 ${12 * size}px ${MONO}`, letterSpacing: ".12em" }}>{label}</div>
    </div>
  );
};

const MysteryTeaser: React.FC<VP> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const a = accent(p, pal);
  const reveal = spring({ frame: frame - 10, fps, config: { damping: 15, stiffness: 110 } });
  const pulse = 1 + Math.sin(frame * .12) * .025;
  return <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 100, boxSizing: "border-box", fontFamily: FONT }}>
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 42%, ${a}35, transparent 40%)` }} />
    <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", transform: `translateY(${interpolate(reveal, [0, 1], [100, 0])}px)`, opacity: reveal }}>
      <div style={{ width: "48%" }}><Eyebrow color={a}>{p.eyebrow || "COMING SOON"}</Eyebrow><div style={{ marginTop: 25, color: pal.text, fontSize: Math.min(width * .075, 112), fontWeight: 900, lineHeight: .92, letterSpacing: "-.075em" }}>{p.headline}</div><div style={{ marginTop: 28, color: `${pal.text}99`, fontSize: 25 }}>{p.subheadline}</div><div style={{ marginTop: 42, color: a, font: `800 16px ${MONO}` }}>{p.date}　·　{p.cta}</div></div>
      <div style={{ position: "relative", transform: `scale(${pulse}) rotate(-5deg)` }}><ProductCard p={p} pal={pal} label="CLASSIFIED / 000" /><div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: pal.text, fontSize: 150, fontWeight: 900, textShadow: `0 12px 40px ${pal.bg}` }}>?</div></div>
    </div>
  </AbsoluteFill>;
};

const DateAnnouncement: React.FC<VP> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = accent(p, pal);
  const enter = spring({ frame: frame - 8, fps, config: { damping: 17, stiffness: 120 } });
  const dateParts = p.date.split(/[-/\s]+/).filter(Boolean).slice(0, 3);
  return <AbsoluteFill style={{ padding: 105, boxSizing: "border-box", fontFamily: FONT }}><Wordmark p={p} pal={pal} /><div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 70 }}><div style={{ width: "53%", transform: `translateX(${interpolate(enter, [0, 1], [-120, 0])}px)`, opacity: enter }}><Eyebrow color={a}>{p.eyebrow || "MARK YOUR CALENDAR"}</Eyebrow><div style={{ marginTop: 24, color: pal.text, fontSize: 94, fontWeight: 900, lineHeight: .96, letterSpacing: "-.07em" }}>{p.headline}</div><div style={{ marginTop: 24, color: `${pal.text}a8`, fontSize: 26 }}>{p.subheadline}</div></div><div style={{ width: 420, height: 420, borderRadius: 34, background: pal.text, color: pal.bg, padding: 34, boxSizing: "border-box", transform: `rotate(${interpolate(enter, [0, 1], [8, -3])}deg) scale(${interpolate(enter, [0, 1], [.75, 1])})`, opacity: enter, boxShadow: `0 35px 90px ${pal.bg}99` }}><div style={{ color: a, font: `900 16px ${MONO}`, letterSpacing: ".18em" }}>{p.productName.toUpperCase()}</div><div style={{ height: 4, marginTop: 25, background: a }} /><div style={{ marginTop: 50, display: "flex", gap: 12, alignItems: "end" }}>{dateParts.map((part, i) => <div key={`${part}-${i}`} style={{ fontSize: i === dateParts.length - 1 ? 78 : 50, fontWeight: 900, letterSpacing: "-.06em" }}>{part}</div>)}</div><div style={{ marginTop: 42, font: `800 15px ${MONO}`, color: `${pal.bg}88` }}>{p.cta}　·　{p.channels?.[0] || "ONLINE"}</div></div></div></AbsoluteFill>;
};

const RevealDoor: React.FC<VP> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const a = accent(p, pal);
  const open = clampInterp(frame, [12, 68], [0, 1]);
  return <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT }}><div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 50%, ${a}55, transparent 43%)` }} /><div style={{ position: "relative", width: 1100, height: 650, perspective: 1200 }}><div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}><ProductCard p={p} pal={pal} label="REVEALED / 001" size={1.05} /></div><div style={{ position: "absolute", inset: 0, display: "flex", gap: 5, overflow: "hidden" }}><div style={{ width: "50%", height: "100%", background: pal.primary, transformOrigin: "left center", transform: `perspective(900px) rotateY(${interpolate(open, [0, 1], [0, -105])}deg)`, borderRadius: "24px 0 0 24px", border: `1px solid ${pal.text}25` }} /><div style={{ width: "50%", height: "100%", background: pal.primary, transformOrigin: "right center", transform: `perspective(900px) rotateY(${interpolate(open, [0, 1], [0, 105])}deg)`, borderRadius: "0 24px 24px 0", border: `1px solid ${pal.text}25` }} /></div><div style={{ position: "absolute", left: 0, right: 0, bottom: -82, textAlign: "center", color: pal.text, opacity: clampInterp(frame, [35, 75], [0, 1]) }}><Eyebrow color={a}>{p.eyebrow || "MEET THE NEW"}</Eyebrow><div style={{ marginTop: 10, fontSize: 45, fontWeight: 900 }}>{p.headline}</div></div></div></AbsoluteFill>;
};

const FeatureDrop: React.FC<VP> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const a = accent(p, pal);
  const features = safe(p.features, ["Faster", "Clearer", "Made for teams"]);
  return <AbsoluteFill style={{ padding: "94px 105px", boxSizing: "border-box", fontFamily: FONT }}><div style={{ display: "flex", justifyContent: "space-between" }}><div><Eyebrow color={a}>{p.eyebrow || "FEATURE DROP"}</Eyebrow><div style={{ marginTop: 18, color: pal.text, fontSize: Math.min(width * .065, 96), fontWeight: 900, letterSpacing: "-.07em", lineHeight: .95 }}>{p.headline}</div></div><ProductCard p={p} pal={pal} label="NEW / FEATURED" size={.55} /></div><div style={{ position: "absolute", left: 105, right: 105, bottom: 108, display: "grid", gridTemplateColumns: `repeat(${Math.min(features.length, 4)}, 1fr)`, gap: 16 }}>{features.slice(0, 4).map((feature, i) => { const x = clampInterp(frame, [12 + i * 7, 35 + i * 7], [0, 1]); return <div key={feature} style={{ padding: "22px 24px", borderRadius: 18, border: `1px solid ${pal.text}22`, background: `${pal.text}08`, transform: `translateY(${interpolate(x, [0, 1], [80, 0])}px)`, opacity: x }}><div style={{ color: a, font: `800 14px ${MONO}` }}>0{i + 1}</div><div style={{ marginTop: 13, color: pal.text, fontSize: 25, fontWeight: 850 }}>{feature}</div></div>; })}</div></AbsoluteFill>;
};

const WaitlistOpen: React.FC<VP> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = accent(p, pal);
  const enter = spring({ frame: frame - 10, fps, config: { damping: 15, stiffness: 110 } });
  const fill = clampInterp(frame, [28, 82], [12, 88]);
  return <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT }}><div style={{ width: 1330, textAlign: "center", transform: `translateY(${interpolate(enter, [0, 1], [70, 0])}px)`, opacity: enter }}><Eyebrow color={a}>{p.eyebrow || "EARLY ACCESS"}</Eyebrow><div style={{ marginTop: 25, color: pal.text, fontSize: 96, fontWeight: 900, letterSpacing: "-.075em" }}>{p.headline}</div><div style={{ margin: "22px auto 42px", maxWidth: 720, color: `${pal.text}99`, fontSize: 25 }}>{p.subheadline}</div><div style={{ height: 76, padding: 9, borderRadius: 999, display: "flex", alignItems: "center", border: `1px solid ${pal.text}32`, background: `${pal.text}0c`, textAlign: "left" }}><div style={{ width: `${fill}%`, height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${pal.primary}, ${a})` }} /><div style={{ marginLeft: -120, width: 120, textAlign: "center", color: pal.bg, fontWeight: 900 }}>{p.cta}</div></div><div style={{ marginTop: 18, color: `${pal.text}66`, font: `700 14px ${MONO}` }}>{p.date}　·　{safe(p.channels, ["WEB", "APP"])[0]}</div></div></AbsoluteFill>;
};

const LaunchDay: React.FC<VP> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = accent(p, pal);
  const pop = spring({ frame: frame - 12, fps, config: { damping: 12, stiffness: 150 } });
  return <AbsoluteFill style={{ padding: 92, boxSizing: "border-box", fontFamily: FONT }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><Wordmark p={p} pal={pal} /><div style={{ padding: "11px 17px", borderRadius: 99, background: a, color: pal.bg, font: `900 15px ${MONO}`, transform: `scale(${pop})` }}>LIVE NOW</div></div><div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}><div style={{ width: "52%" }}><Eyebrow color={a}>{p.eyebrow || "LAUNCH DAY"}</Eyebrow><div style={{ marginTop: 22, color: pal.text, fontSize: 105, fontWeight: 900, letterSpacing: "-.085em", lineHeight: .9 }}>{p.headline}</div><div style={{ marginTop: 25, color: `${pal.text}a8`, fontSize: 25 }}>{p.subheadline}</div><div style={{ marginTop: 40, display: "inline-flex", padding: "17px 24px", borderRadius: 13, color: pal.bg, background: a, fontWeight: 900 }}>{p.cta}　↗</div></div><div style={{ transform: `translateY(${interpolate(pop, [0, 1], [130, 0])}px) rotate(${interpolate(pop, [0, 1], [8, -4])}deg)`, opacity: pop }}><ProductCard p={p} pal={pal} label={p.price || "AVAILABLE TODAY"} size={1.03} /></div></div></AbsoluteFill>;
};

const PressQuote: React.FC<VP> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = accent(p, pal);
  const enter = spring({ frame: frame - 12, fps, config: { damping: 16, stiffness: 105 } });
  return <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 100, boxSizing: "border-box", fontFamily: FONT }}><div style={{ width: 1360, padding: "72px 88px", boxSizing: "border-box", border: `1px solid ${pal.text}25`, borderRadius: 32, background: `${pal.text}0a`, transform: `scale(${interpolate(enter, [0, 1], [.86, 1])})`, opacity: enter }}><div style={{ color: a, fontSize: 100, lineHeight: .6, fontFamily: "Georgia, serif" }}>“</div><div style={{ marginTop: 35, color: pal.text, font: `700 53px/1.14 Georgia, serif`, letterSpacing: "-.03em" }}>{p.quote || p.headline}</div><div style={{ marginTop: 42, display: "flex", justifyContent: "space-between", alignItems: "end" }}><div><Eyebrow color={a}>{p.eyebrow || "IN THE PRESS"}</Eyebrow><div style={{ marginTop: 10, color: `${pal.text}88`, fontSize: 22 }}>{p.subheadline}</div></div><div style={{ color: pal.text, font: `900 18px ${MONO}`, letterSpacing: ".12em" }}>{p.productName.toUpperCase()}</div></div></div></AbsoluteFill>;
};

const AvailabilityMap: React.FC<VP> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const a = accent(p, pal);
  const locations = safe(p.locations, ["New York", "London", "Tokyo", "Sydney", "Berlin"]);
  return <AbsoluteFill style={{ padding: "92px 105px", boxSizing: "border-box", fontFamily: FONT }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}><div><Eyebrow color={a}>{p.eyebrow || "NOW AVAILABLE"}</Eyebrow><div style={{ marginTop: 18, color: pal.text, fontSize: 84, fontWeight: 900, letterSpacing: "-.07em" }}>{p.headline}</div></div><div style={{ color: `${pal.text}88`, font: `800 15px ${MONO}` }}>{p.date}</div></div><div style={{ position: "relative", marginTop: 44, height: 570, borderRadius: 28, overflow: "hidden", background: `${pal.text}08`, border: `1px solid ${pal.text}22` }}><div style={{ position: "absolute", inset: 0, opacity: .26, backgroundImage: `linear-gradient(${pal.text}22 1px, transparent 1px), linear-gradient(90deg, ${pal.text}22 1px, transparent 1px)`, backgroundSize: "76px 76px", transform: `translate(${(frame * 1.2) % 76}px, ${(frame * .6) % 76}px)` }} />{locations.slice(0, 6).map((place, i) => { const x = 14 + ((seededRand(i + 4) * 72) | 0); const y = 22 + ((seededRand(i + 30) * 52) | 0); const show = clampInterp(frame, [10 + i * 7, 31 + i * 7], [0, 1]); return <div key={place} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, display: "flex", alignItems: "center", gap: 12, color: pal.text, opacity: show, transform: `scale(${interpolate(show, [0, 1], [.4, 1])})` }}><div style={{ width: 22, height: 22, borderRadius: "50%", background: a, boxShadow: `0 0 0 10px ${a}24` }} /><span style={{ padding: "9px 12px", borderRadius: 8, background: `${pal.bg}dd`, fontWeight: 800 }}>{place}</span></div>; })}</div></AbsoluteFill>;
};

const LimitedRelease: React.FC<VP> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = accent(p, pal);
  const enter = spring({ frame: frame - 10, fps, config: { damping: 15, stiffness: 115 } });
  const progress = clampInterp(frame, [22, 94], [0, 76]);
  return <AbsoluteFill style={{ padding: 100, boxSizing: "border-box", fontFamily: FONT, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}><div style={{ width: "51%", transform: `translateX(${interpolate(enter, [0, 1], [-80, 0])}px)`, opacity: enter }}><Eyebrow color={a}>{p.eyebrow || "LIMITED RELEASE"}</Eyebrow><div style={{ marginTop: 22, color: pal.text, fontSize: 86, fontWeight: 900, lineHeight: .92, letterSpacing: "-.075em" }}>{p.headline}</div><div style={{ marginTop: 26, color: `${pal.text}9c`, fontSize: 24 }}>{p.subheadline}</div><div style={{ marginTop: 42, height: 13, borderRadius: 99, background: `${pal.text}1f`, overflow: "hidden" }}><div style={{ width: `${progress}%`, height: "100%", background: a, borderRadius: 99 }} /></div><div style={{ marginTop: 13, display: "flex", justifyContent: "space-between", color: `${pal.text}77`, font: `700 14px ${MONO}` }}><span>EDITION / 001</span><span>{Math.round(progress)}% CLAIMED</span></div></div><div style={{ transform: `rotate(${interpolate(enter, [0, 1], [13, -5])}deg) scale(${interpolate(enter, [0, 1], [.76, 1])})`, opacity: enter }}><ProductCard p={p} pal={pal} label={p.price || "LIMITED / 100"} size={.94} /></div></AbsoluteFill>;
};

const LaunchRecap: React.FC<VP> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const a = accent(p, pal);
  const beats = ["TEASE", "REVEAL", "PROOF", "LAUNCH"];
  return <AbsoluteFill style={{ padding: "92px 100px", boxSizing: "border-box", fontFamily: FONT }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}><div><Eyebrow color={a}>{p.eyebrow || "THE LAUNCH, RECAP"}</Eyebrow><div style={{ marginTop: 15, color: pal.text, fontSize: 75, fontWeight: 900, letterSpacing: "-.075em" }}>{p.headline}</div></div><Wordmark p={p} pal={pal} /></div><div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, alignItems: "center" }}>{beats.map((beat, i) => { const show = clampInterp(frame, [12 + i * 9, 36 + i * 9], [0, 1]); return <div key={beat} style={{ height: 410, borderRadius: 22, overflow: "hidden", border: `1px solid ${pal.text}25`, background: `${i % 2 ? pal.primary : pal.text}18`, transform: `translateY(${interpolate(show, [0, 1], [70, 0])}px)`, opacity: show }}><div style={{ height: 250, position: "relative", background: `linear-gradient(${a}${i % 2 ? "55" : "99"}, ${pal.primary}66)` }}>{i === 1 ? <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: pal.text, fontSize: 90, fontWeight: 900 }}>✦</div> : i === 2 ? <div style={{ position: "absolute", left: "18%", right: "18%", top: "35%", height: 20, borderRadius: 99, background: pal.text }} /> : <div style={{ position: "absolute", width: 110, height: 110, borderRadius: "50%", left: "calc(50% - 55px)", top: 70, border: `2px solid ${pal.text}bb` }} />}</div><div style={{ padding: 22 }}><div style={{ color: a, font: `800 13px ${MONO}` }}>0{i + 1}</div><div style={{ marginTop: 10, color: pal.text, fontSize: 25, fontWeight: 900 }}>{beat}</div></div></div>; })}</div><div style={{ color: `${pal.text}77`, font: `700 14px ${MONO}` }}>{p.cta}　·　{p.date}</div></AbsoluteFill>;
};

const VARIANTS: Record<LaunchVariant, React.FC<VP>> = {
  "mystery-teaser": MysteryTeaser,
  "date-announcement": DateAnnouncement,
  "reveal-door": RevealDoor,
  "feature-drop": FeatureDrop,
  "waitlist-open": WaitlistOpen,
  "launch-day": LaunchDay,
  "press-quote": PressQuote,
  "availability-map": AvailabilityMap,
  "limited-release": LimitedRelease,
  "launch-recap": LaunchRecap,
};

export const LaunchCampaignTemplate: React.FC<LaunchCampaignProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? MysteryTeaser;
  const quiet = props.variant === "press-quote" || props.variant === "date-announcement";
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <AbsoluteFill style={{ backgroundColor: pal.bg, color: pal.text, overflow: "hidden" }}>
    {!quiet && <GradientMeshBackground palette={pal} blobs={props.variant === "availability-map" ? 3 : 5} speed={0.38} />}
    <FadeEdges inFrames={10} outFrames={13}><div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><Variant p={props} pal={pal} /></div></FadeEdges>
  </AbsoluteFill>;
};

const familyCast = (c: React.FC<LaunchCampaignProps>) => c as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "launch-campaign-mystery-teaser": familyCast(LaunchCampaignTemplate),
  "launch-campaign-date-announcement": familyCast(LaunchCampaignTemplate),
  "launch-campaign-reveal-door": familyCast(LaunchCampaignTemplate),
  "launch-campaign-feature-drop": familyCast(LaunchCampaignTemplate),
  "launch-campaign-waitlist-open": familyCast(LaunchCampaignTemplate),
  "launch-campaign-launch-day": familyCast(LaunchCampaignTemplate),
  "launch-campaign-press-quote": familyCast(LaunchCampaignTemplate),
  "launch-campaign-availability-map": familyCast(LaunchCampaignTemplate),
  "launch-campaign-limited-release": familyCast(LaunchCampaignTemplate),
  "launch-campaign-launch-recap": familyCast(LaunchCampaignTemplate),
};
