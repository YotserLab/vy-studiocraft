import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, clampInterp, resolvePalette, type Palette } from "../lib/primitives";

/**
 * Platform-aware end screens with an intentionally conservative, readable CTA
 * hierarchy. Every treatment works without external media; URLs only enrich
 * the procedural placeholders when supplied by a caller.
 */
export type EndScreenVariant =
  | "subscribe-end"
  | "watch-next"
  | "two-up-related"
  | "single-cta"
  | "podcast-end"
  | "app-end"
  | "course-end"
  | "newsletter-end"
  | "contact-end"
  | "silent-endcard";

export interface RelatedItem {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  duration?: string;
}

export interface EndScreenVariantsProps {
  variant: EndScreenVariant;
  brand: string;
  cta: string;
  tagline: string;
  paletteName: string;
  platform: string;
  handle: string;
  logoUrl?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  relatedItems?: RelatedItem[];
  nextTitle: string;
  nextSubtitle: string;
  episode: string;
  showName: string;
  hostName: string;
  appName: string;
  appStoreLabel: string;
  lessonTitle: string;
  lessonNumber: string;
  courseName: string;
  newsletterName: string;
  newsletterUrl: string;
  emailLabel: string;
  contactEmail: string;
  contactUrl: string;
  qrData: string;
  accentColor?: string;
  background?: string;
  showQr: boolean;
  showBrand: boolean;
}

type VariantProps = { p: EndScreenVariantsProps; pal: Palette };

const SANS = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const SERIF = 'Georgia, "Times New Roman", serif';

const accent = (p: EndScreenVariantsProps, pal: Palette) => p.accentColor ?? pal.accent;
const fade = (frame: number, start: number, end: number) => clampInterp(frame, [start, end], [0, 1]);
const esc = (value: string) => value.trim() || "YOUR BRAND";

const Logo = ({ p, pal, compact = false }: { p: EndScreenVariantsProps; pal: Palette; compact?: boolean }) => (
  <div style={{ display: "flex", alignItems: "center", gap: compact ? 12 : 16, color: pal.text, fontFamily: SANS, fontWeight: 800, letterSpacing: "-0.035em" }}>
    {p.logoUrl ? <img src={p.logoUrl} alt="" style={{ width: compact ? 42 : 58, height: compact ? 42 : 58, objectFit: "contain", borderRadius: compact ? 10 : 14 }} /> : <div style={{ width: compact ? 42 : 58, height: compact ? 42 : 58, display: "grid", placeItems: "center", borderRadius: compact ? 10 : 14, background: `linear-gradient(145deg, ${accent(p, pal)}, ${pal.primary})`, color: pal.bg, fontSize: compact ? 18 : 25 }}>{esc(p.brand).slice(0, 1).toUpperCase()}</div>}
    <span style={{ fontSize: compact ? 21 : 29 }}>{esc(p.brand)}</span>
  </div>
);

const CornerMeta = ({ p, pal, dark = false }: { p: EndScreenVariantsProps; pal: Palette; dark?: boolean }) => {
  const color = dark ? "#fff" : pal.secondary;
  return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color, fontFamily: MONO, fontSize: 15, letterSpacing: "0.13em", textTransform: "uppercase" }}><span>{p.platform || "VIDEO"}</span><span>{p.handle || esc(p.brand)}</span></div>;
};

const PlaceholderArt = ({ p, pal, imageUrl, dark = false }: { p: EndScreenVariantsProps; pal: Palette; imageUrl?: string; dark?: boolean }) => (
  <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: `linear-gradient(135deg, ${pal.primary}, ${pal.bg} 62%, ${accent(p, pal)})` }}>
    {imageUrl ? <img src={imageUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : <>
      <div style={{ position: "absolute", width: "58%", aspectRatio: "1", borderRadius: "50%", top: "-28%", right: "-13%", background: `${accent(p, pal)}55`, filter: "blur(2px)" }} />
      <div style={{ position: "absolute", width: "70%", height: "38%", left: "-14%", bottom: "-10%", transform: "rotate(-18deg)", background: `${pal.text}12`, border: `1px solid ${pal.text}20` }} />
      <div style={{ position: "absolute", inset: 0, opacity: 0.13, backgroundImage: `linear-gradient(${pal.text} 1px, transparent 1px), linear-gradient(90deg, ${pal.text} 1px, transparent 1px)`, backgroundSize: "48px 48px" }} />
    </>}
    {dark && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, #000000b8, #00000025 66%, #00000080)" }} />}
  </div>
);

const Button = ({ children, pal, p, outline = false, wide = false }: { children: React.ReactNode; pal: Palette; p: EndScreenVariantsProps; outline?: boolean; wide?: boolean }) => (
  <div style={{ minWidth: wide ? 310 : 205, padding: "18px 28px", boxSizing: "border-box", borderRadius: 999, border: `2px solid ${accent(p, pal)}`, background: outline ? "transparent" : accent(p, pal), color: outline ? pal.text : pal.bg, textAlign: "center", fontFamily: SANS, fontSize: 20, fontWeight: 850, letterSpacing: "-0.01em" }}>{children}</div>
);

const QRPlaceholder = ({ p, pal, size = 150 }: { p: EndScreenVariantsProps; pal: Palette; size?: number }) => {
  const cells = [0, 1, 2, 4, 6, 8, 9, 11, 13, 15, 17, 18, 20, 22, 24, 25, 27, 29, 30, 32, 34, 36, 37, 39, 41, 43, 44, 46, 48, 50, 51, 53, 55, 57, 58, 60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 78, 79, 81, 83, 85, 86, 88, 90, 92, 93, 95, 97];
  const finder = (x: number, y: number) => <><div style={{ position: "absolute", left: `${x * 10}%`, top: `${y * 10}%`, width: "30%", height: "30%", border: `5px solid ${pal.bg}`, boxSizing: "border-box" }} /><div style={{ position: "absolute", left: `${(x + 1) * 10}%`, top: `${(y + 1) * 10}%`, width: "10%", height: "10%", background: pal.bg }} /></>;
  return <div style={{ width: size, height: size, padding: size * 0.08, boxSizing: "border-box", background: pal.text, borderRadius: 12, position: "relative" }} aria-label={`QR placeholder ${p.qrData || p.newsletterUrl}`}>
    <div style={{ position: "relative", width: "100%", height: "100%", background: pal.text }}>
      {cells.map((n) => <span key={n} style={{ position: "absolute", left: `${(n % 10) * 10}%`, top: `${Math.floor(n / 10) * 10}%`, width: "8%", height: "8%", background: pal.bg }} />)}
      {finder(0, 0)}{finder(6, 0)}{finder(0, 6)}
    </div>
  </div>;
};

const Thumbnail = ({ item, p, pal, index = 0, large = false }: { item: RelatedItem; p: EndScreenVariantsProps; pal: Palette; index?: number; large?: boolean }) => (
  <div style={{ overflow: "hidden", borderRadius: large ? 18 : 12, border: `1px solid ${pal.text}22`, background: `${pal.primary}28`, boxShadow: `0 ${large ? 18 : 10}px ${large ? 42 : 25}px #00000030` }}>
    <div style={{ position: "relative", height: large ? 285 : 155, overflow: "hidden" }}>
      <PlaceholderArt p={p} pal={pal} imageUrl={item.imageUrl} />
      {item.duration && <span style={{ position: "absolute", right: 12, bottom: 12, padding: "5px 8px", borderRadius: 5, background: "#000000bb", color: "#fff", fontFamily: MONO, fontSize: 13 }}>{item.duration}</span>}
      <span style={{ position: "absolute", left: 15, top: 15, width: 30, height: 30, display: "grid", placeItems: "center", borderRadius: "50%", background: `${accent(p, pal)}ee`, color: pal.bg, fontFamily: MONO, fontSize: 14 }}>{String(index + 1).padStart(2, "0")}</span>
    </div>
    <div style={{ padding: large ? "17px 20px 20px" : "13px 15px 16px" }}>
      <div style={{ color: pal.text, fontFamily: SANS, fontSize: large ? 24 : 18, lineHeight: 1.15, fontWeight: 800 }}>{item.title}</div>
      <div style={{ marginTop: 7, color: pal.secondary, fontFamily: SANS, fontSize: large ? 15 : 13 }}>{item.subtitle ?? "Watch next"}</div>
    </div>
  </div>
);

const baseItems = (p: EndScreenVariantsProps): RelatedItem[] => {
  const items = p.relatedItems?.filter((item) => item.title?.trim()) ?? [];
  return [
    { title: p.nextTitle || "The next chapter", subtitle: p.nextSubtitle || p.tagline, imageUrl: p.thumbnailUrl ?? p.imageUrl, duration: "08:42" },
    { title: "A useful place to begin", subtitle: "Recommended for you", imageUrl: p.imageUrl, duration: "05:18" },
    ...items,
  ].slice(0, 4);
};

const SubscribeEnd: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const inP = fade(frame, 5, 28); const button = fade(frame, 30, 50);
  return <AbsoluteFill style={{ padding: "78px 105px", boxSizing: "border-box" }}>
    <CornerMeta p={p} pal={pal} />
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <div style={{ opacity: inP, transform: `translateY(${(1 - inP) * 28}px)` }}>
        <Logo p={p} pal={pal} />
        <div style={{ marginTop: 48, color: pal.text, fontFamily: SANS, fontSize: 72, fontWeight: 900, letterSpacing: "-0.06em" }}>Stay in the loop.</div>
        <div style={{ margin: "21px auto 36px", maxWidth: 650, color: pal.secondary, fontFamily: SANS, fontSize: 25, lineHeight: 1.4 }}>{p.tagline || "New ideas, useful stories, and the next thing worth watching."}</div>
        <div style={{ opacity: button, transform: `scale(${0.92 + button * 0.08})`, display: "flex", justifyContent: "center", gap: 16 }}><Button p={p} pal={pal} wide>{p.cta || "Subscribe"}</Button><Button p={p} pal={pal} outline>{p.handle || "Follow"}</Button></div>
      </div>
    </div>
    <div style={{ color: `${pal.secondary}99`, fontFamily: MONO, textAlign: "center", fontSize: 14, letterSpacing: "0.1em" }}>NO SPAM · JUST THE GOOD STUFF</div>
  </AbsoluteFill>;
};

const WatchNext: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const inP = fade(frame, 5, 24); const card = fade(frame, 18, 42); const item = baseItems(p)[0];
  return <AbsoluteFill style={{ padding: "76px 100px" }}>
    <CornerMeta p={p} pal={pal} /><div style={{ flex: 1, display: "grid", gridTemplateColumns: "0.88fr 1.12fr", gap: 62, alignItems: "center" }}>
      <div style={{ opacity: inP, transform: `translateX(${(1 - inP) * -35}px)` }}><div style={{ color: accent(p, pal), fontFamily: MONO, fontSize: 18, letterSpacing: "0.22em" }}>UP NEXT</div><div style={{ marginTop: 20, color: pal.text, fontFamily: SANS, fontSize: 78, lineHeight: 0.98, fontWeight: 900, letterSpacing: "-0.06em" }}>Keep<br />going.</div><div style={{ marginTop: 30, color: pal.secondary, fontFamily: SANS, fontSize: 23, lineHeight: 1.4, maxWidth: 480 }}>{p.nextSubtitle || p.tagline}</div><div style={{ marginTop: 38 }}><Button p={p} pal={pal}>{p.cta || "Watch next"}</Button></div></div>
      <div style={{ opacity: card, transform: `translateY(${(1 - card) * 30}px)` }}><Thumbnail item={item} p={p} pal={pal} large /><div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, color: pal.secondary, fontFamily: MONO, fontSize: 14 }}><span>{p.episode || "NEXT EPISODE"}</span><span>PLAY WHEN READY →</span></div></div>
    </div>
  </AbsoluteFill>;
};

const TwoUpRelated: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const head = fade(frame, 4, 22); const items = baseItems(p).slice(0, 2);
  return <AbsoluteFill style={{ padding: "72px 100px" }}><div style={{ opacity: head, display: "flex", alignItems: "end", justifyContent: "space-between" }}><div><div style={{ color: accent(p, pal), fontFamily: MONO, fontSize: 17, letterSpacing: "0.2em" }}>MORE TO EXPLORE</div><div style={{ marginTop: 15, color: pal.text, fontFamily: SANS, fontSize: 57, fontWeight: 900, letterSpacing: "-0.05em" }}>{p.cta || "Choose your next watch"}</div></div><Logo p={p} pal={pal} compact /></div><div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 34, alignItems: "center", padding: "18px 7% 35px" }}>{items.map((item, i) => <div key={`${item.title}-${i}`} style={{ opacity: fade(frame, 18 + i * 12, 38 + i * 12), transform: `translateY(${(1 - fade(frame, 18 + i * 12, 38 + i * 12)) * 26}px)` }}><Thumbnail item={item} p={p} pal={pal} index={i} large /></div>)}</div><CornerMeta p={p} pal={pal} /></AbsoluteFill>;
};

const SingleCta: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const inP = fade(frame, 10, 38); const cta = fade(frame, 42, 60);
  return <AbsoluteFill><PlaceholderArt p={p} pal={pal} imageUrl={p.imageUrl ?? p.thumbnailUrl} dark /><AbsoluteFill style={{ padding: "82px 112px", justifyContent: "space-between" }}><div style={{ opacity: inP }}><Logo p={p} pal={pal} /><div style={{ marginTop: 56, maxWidth: 850, color: "#fff", fontFamily: SANS, fontSize: 91, lineHeight: 0.98, fontWeight: 900, letterSpacing: "-0.07em" }}>{p.cta || "Make your next move."}</div><div style={{ marginTop: 28, maxWidth: 600, color: "#ffffffc9", fontFamily: SANS, fontSize: 25, lineHeight: 1.4 }}>{p.tagline}</div></div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", opacity: cta }}><Button p={p} pal={pal} wide>{p.cta || "Get started"}</Button><CornerMeta p={p} pal={pal} dark /></div></AbsoluteFill></AbsoluteFill>;
};

const Wave = ({ pal, p, light = false }: { pal: Palette; p: EndScreenVariantsProps; light?: boolean }) => <div style={{ height: 90, display: "flex", alignItems: "center", gap: 5, opacity: 0.9 }}>{Array.from({ length: 44 }, (_, i) => { const h = 15 + ((i * 17 + i * i * 3) % 60); return <span key={i} style={{ width: 5, height: h, borderRadius: 5, background: light ? "#fff" : accent(p, pal), opacity: 0.45 + (i % 4) * 0.12 }} />; })}</div>;

const PodcastEnd: React.FC<VariantProps> = ({ p, pal }) => { const frame = useCurrentFrame(); const inP = fade(frame, 5, 28); return <AbsoluteFill style={{ padding: "78px 110px" }}><CornerMeta p={p} pal={pal} /><div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}><div style={{ opacity: inP }}><div style={{ color: accent(p, pal), fontFamily: MONO, fontSize: 17, letterSpacing: "0.2em" }}>THE CONVERSATION CONTINUES</div><div style={{ marginTop: 24, color: pal.text, fontFamily: SERIF, fontSize: 68, lineHeight: 1.05 }}>{p.showName || p.brand}</div><div style={{ marginTop: 25, color: pal.secondary, fontFamily: SANS, fontSize: 25 }}>{p.episode || "Episode 042"} · hosted by {p.hostName || "the team"}</div><div style={{ marginTop: 35 }}><Button p={p} pal={pal}>{p.cta || "Listen to the next episode"}</Button></div></div><div style={{ opacity: fade(frame, 20, 42), padding: 32, border: `1px solid ${pal.text}25`, background: `${pal.primary}20`, borderRadius: 22 }}><div style={{ color: pal.text, fontFamily: MONO, fontSize: 15, letterSpacing: "0.15em" }}>NOW PLAYING</div><Wave p={p} pal={pal} /><div style={{ color: pal.text, fontFamily: SANS, fontSize: 27, fontWeight: 750 }}>{p.nextTitle}</div><div style={{ marginTop: 8, color: pal.secondary, fontFamily: SANS, fontSize: 17 }}>{p.nextSubtitle || "A new conversation"}</div></div></div></AbsoluteFill>; };

const Phone = ({ p, pal }: VariantProps) => <div style={{ width: 250, height: 470, padding: 12, boxSizing: "border-box", borderRadius: 38, border: `5px solid ${pal.text}`, background: pal.bg, boxShadow: `0 28px 70px #00000055`, transform: "rotate(5deg)" }}><div style={{ height: 24, width: 88, margin: "-2px auto 14px", borderRadius: 20, background: pal.text }} /><div style={{ height: 185, borderRadius: 18, overflow: "hidden" }}><PlaceholderArt p={p} pal={pal} imageUrl={p.imageUrl} /></div><div style={{ margin: "24px 10px 0", color: pal.text, fontFamily: SANS, fontSize: 22, fontWeight: 850 }}>{p.appName || p.brand}</div><div style={{ margin: "8px 10px", color: pal.secondary, fontFamily: SANS, fontSize: 14, lineHeight: 1.3 }}>{p.tagline}</div><div style={{ margin: "20px 10px", height: 32, borderRadius: 9, background: accent(p, pal) }} /></div>;

const AppEnd: React.FC<VariantProps> = ({ p, pal }) => { const frame = useCurrentFrame(); const inP = fade(frame, 8, 30); return <AbsoluteFill style={{ padding: "70px 120px" }}><CornerMeta p={p} pal={pal} /><div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8%" }}><div style={{ maxWidth: 680, opacity: inP, transform: `translateX(${(1 - inP) * -30}px)` }}><Logo p={p} pal={pal} /><div style={{ marginTop: 37, color: pal.text, fontFamily: SANS, fontSize: 74, fontWeight: 900, letterSpacing: "-0.065em", lineHeight: 1 }}>{p.appName || "The app for your next idea."}</div><div style={{ marginTop: 25, color: pal.secondary, fontFamily: SANS, fontSize: 24, lineHeight: 1.4 }}>{p.tagline}</div><div style={{ marginTop: 37, display: "flex", alignItems: "center", gap: 20 }}><Button p={p} pal={pal}>{p.appStoreLabel || p.cta || "Download the app"}</Button><span style={{ color: pal.secondary, fontFamily: MONO, fontSize: 14 }}>IOS · ANDROID</span></div></div><div style={{ opacity: fade(frame, 20, 45), transform: `translateY(${(1 - fade(frame, 20, 45)) * 35}px)` }}><Phone p={p} pal={pal} /></div></div></AbsoluteFill>; };

const CourseEnd: React.FC<VariantProps> = ({ p, pal }) => { const frame = useCurrentFrame(); const inP = fade(frame, 8, 28); return <AbsoluteFill style={{ padding: "78px 108px" }}><CornerMeta p={p} pal={pal} /><div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 70, alignItems: "center" }}><div style={{ opacity: inP }}><div style={{ color: accent(p, pal), fontFamily: MONO, fontSize: 17, letterSpacing: "0.2em" }}>{p.courseName || "COURSE"} · {p.lessonNumber || "LESSON 04"}</div><div style={{ marginTop: 22, color: pal.text, fontFamily: SANS, fontSize: 70, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.06em" }}>{p.lessonTitle || "Your next lesson is ready."}</div><div style={{ marginTop: 25, color: pal.secondary, fontFamily: SANS, fontSize: 23, lineHeight: 1.4 }}>{p.nextSubtitle || p.tagline}</div><div style={{ marginTop: 37 }}><Button p={p} pal={pal}>{p.cta || "Continue learning"}</Button></div></div><div style={{ padding: 38, borderRadius: 24, border: `1px solid ${pal.text}28`, background: `${pal.primary}1c`, opacity: fade(frame, 20, 42) }}><div style={{ display: "flex", justifyContent: "space-between", color: pal.text, fontFamily: MONO, fontSize: 15 }}><span>COURSE PROGRESS</span><span>68%</span></div><div style={{ height: 13, marginTop: 24, overflow: "hidden", borderRadius: 99, background: `${pal.text}1c` }}><div style={{ width: "68%", height: "100%", borderRadius: 99, background: accent(p, pal) }} /></div><div style={{ marginTop: 42, color: pal.secondary, fontFamily: SANS, fontSize: 18 }}>NEXT UP</div><div style={{ marginTop: 10, color: pal.text, fontFamily: SANS, fontSize: 32, fontWeight: 800 }}>{p.nextTitle || "Build the habit"}</div></div></div></AbsoluteFill>; };

const NewsletterEnd: React.FC<VariantProps> = ({ p, pal }) => { const frame = useCurrentFrame(); const inP = fade(frame, 8, 30); return <AbsoluteFill style={{ padding: "78px 110px" }}><CornerMeta p={p} pal={pal} /><div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: "78%", minHeight: 430, padding: "58px 72px", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 50, border: `1px solid ${pal.text}2c`, borderRadius: 26, background: `linear-gradient(120deg, ${pal.primary}3e, ${pal.bg}aa)` , opacity: inP, transform: `translateY(${(1 - inP) * 28}px)` }}><div style={{ maxWidth: 700 }}><Logo p={p} pal={pal} /><div style={{ marginTop: 42, color: pal.text, fontFamily: SERIF, fontSize: 57, lineHeight: 1.06 }}>{p.newsletterName || "A better note, once a week."}</div><div style={{ marginTop: 22, color: pal.secondary, fontFamily: SANS, fontSize: 21, lineHeight: 1.4 }}>{p.tagline || "Ideas, links, and field notes delivered with care."}</div><div style={{ marginTop: 32, display: "flex", alignItems: "center", gap: 12 }}><Button p={p} pal={pal}>{p.cta || "Join the list"}</Button><span style={{ color: pal.secondary, fontFamily: MONO, fontSize: 14 }}>{p.newsletterUrl}</span></div></div>{p.showQr && <div style={{ textAlign: "center", color: pal.secondary, fontFamily: MONO, fontSize: 13, letterSpacing: "0.08em" }}><QRPlaceholder p={p} pal={pal} /><div style={{ marginTop: 12 }}>SCAN TO JOIN</div></div>}</div></div></AbsoluteFill>; };

const ContactEnd: React.FC<VariantProps> = ({ p, pal }) => { const frame = useCurrentFrame(); const inP = fade(frame, 8, 31); return <AbsoluteFill style={{ padding: "80px 110px" }}><CornerMeta p={p} pal={pal} /><div style={{ flex: 1, display: "grid", gridTemplateColumns: "0.8fr 1.2fr", alignItems: "center", gap: 80 }}><div style={{ opacity: inP }}><div style={{ color: accent(p, pal), fontFamily: MONO, fontSize: 17, letterSpacing: "0.2em" }}>LET'S TALK</div><div style={{ marginTop: 22, color: pal.text, fontFamily: SANS, fontSize: 76, fontWeight: 900, lineHeight: 0.98, letterSpacing: "-0.065em" }}>Keep the<br />conversation<br />going.</div></div><div style={{ opacity: fade(frame, 25, 47) }}><div style={{ borderTop: `2px solid ${accent(p, pal)}`, paddingTop: 22, color: pal.text, fontFamily: MONO, fontSize: 16, letterSpacing: "0.14em" }}>CONTACT</div><div style={{ marginTop: 22, color: pal.text, fontFamily: SANS, fontSize: 35, fontWeight: 800 }}>{p.contactEmail || "hello@example.com"}</div><div style={{ marginTop: 14, color: pal.secondary, fontFamily: SANS, fontSize: 24 }}>{p.contactUrl || p.handle || "example.com"}</div><div style={{ marginTop: 38, display: "flex", gap: 14 }}><Button p={p} pal={pal}>{p.cta || "Get in touch"}</Button>{p.showQr && <QRPlaceholder p={p} pal={pal} size={96} />}</div></div></div></AbsoluteFill>; };

const SilentEndcard: React.FC<VariantProps> = ({ p, pal }) => { const frame = useCurrentFrame(); const inP = fade(frame, 12, 38); const color = pal.text; return <AbsoluteFill style={{ padding: "88px 110px", background: p.background ?? pal.bg, color }}><div style={{ opacity: inP, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}><div style={{ width: 112, height: 5, background: accent(p, pal), marginBottom: 42 }} /><Logo p={p} pal={pal} /><div style={{ marginTop: 40, maxWidth: 950, fontFamily: SERIF, fontSize: 72, lineHeight: 1.14 }}>{p.tagline || p.cta || "Thank you for watching."}</div><div style={{ marginTop: 34, color: pal.secondary, fontFamily: SANS, fontSize: 22 }}>{p.brand} · {p.handle}</div></div><div style={{ color: `${pal.secondary}aa`, fontFamily: MONO, textAlign: "center", fontSize: 14, letterSpacing: "0.16em" }}>END OF PROGRAM · {p.episode || ""}</div></AbsoluteFill>; };

const VARIANTS: Record<EndScreenVariant, React.FC<VariantProps>> = {
  "subscribe-end": SubscribeEnd,
  "watch-next": WatchNext,
  "two-up-related": TwoUpRelated,
  "single-cta": SingleCta,
  "podcast-end": PodcastEnd,
  "app-end": AppEnd,
  "course-end": CourseEnd,
  "newsletter-end": NewsletterEnd,
  "contact-end": ContactEnd,
  "silent-endcard": SilentEndcard,
};

export const EndScreenVariantsTemplate: React.FC<EndScreenVariantsProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? SubscribeEnd;
  const { width, height } = useVideoConfig();
  // Family layouts are authored on a 1920×1080 design canvas. Keep that
  // canvas intact and scale it as one unit for thumbnails/previews so fixed
  // typography, cards, and device mockups cannot escape the smaller viewport.
  const layoutScale = Math.min(1, width / 1920, height / 1080);
  return <AbsoluteFill style={{ backgroundColor: props.background ?? pal.bg, overflow: "hidden", fontFamily: SANS }}><FadeEdges inFrames={10} outFrames={14}><div style={{ position: "relative", width: 1920, height: 1080, transform: `scale(${layoutScale})`, transformOrigin: "top left" }}><Variant p={props} pal={pal} /></div></FadeEdges></AbsoluteFill>;
};

const familyCast = (component: React.FC<EndScreenVariantsProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "end-screen-variants-subscribe-end": familyCast(EndScreenVariantsTemplate),
  "end-screen-variants-watch-next": familyCast(EndScreenVariantsTemplate),
  "end-screen-variants-two-up-related": familyCast(EndScreenVariantsTemplate),
  "end-screen-variants-single-cta": familyCast(EndScreenVariantsTemplate),
  "end-screen-variants-podcast-end": familyCast(EndScreenVariantsTemplate),
  "end-screen-variants-app-end": familyCast(EndScreenVariantsTemplate),
  "end-screen-variants-course-end": familyCast(EndScreenVariantsTemplate),
  "end-screen-variants-newsletter-end": familyCast(EndScreenVariantsTemplate),
  "end-screen-variants-contact-end": familyCast(EndScreenVariantsTemplate),
  "end-screen-variants-silent-endcard": familyCast(EndScreenVariantsTemplate),
};
