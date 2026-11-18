import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { ComponentType, CSSProperties } from "react";
import { clampInterp, resolvePalette, type Palette } from "../lib/primitives";

/**
 * FAMILY: brand-guidelines
 * Motion-ready brand documentation cards. Every treatment has procedural
 * defaults so it renders without an asset, while accepting a logo and a
 * small set of brand-system inputs when used in a real production.
 */
export type BrandGuidelinesVariant =
  | "logo-rules"
  | "clearspace-demo"
  | "dont-use-grid"
  | "color-do-dont"
  | "type-rules"
  | "photography-rules"
  | "motion-rules"
  | "icon-rules"
  | "voice-card"
  | "guidelines-close";

export interface BrandGuidelinesProps {
  variant: BrandGuidelinesVariant;
  brandName: string;
  title: string;
  subtitle: string;
  paletteName: string;
  logoUrl?: string;
  colors?: string[];
  fonts?: { heading?: string; body?: string; mono?: string } | string[];
  examples?: string[];
  doDont?: { do?: string[]; dont?: string[] };
  notes?: string[];
  background?: string;
  accentColor?: string;
}

type VariantProps = { p: BrandGuidelinesProps; pal: Palette };
const SANS = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const SERIF = 'Georgia, "Times New Roman", serif';

const DEFAULT_COLORS = ["#171717", "#f5f1e8", "#e85d3f", "#4f6d7a", "#f2c14e"];
const DEFAULT_EXAMPLES = ["Clear over clever", "Warm, direct, useful", "Make the next step obvious"];
const DEFAULT_DO = ["Use generous clearspace", "Keep contrast intentional", "Lead with the human benefit"];
const DEFAULT_DONT = ["Stretch or rotate the mark", "Mix unapproved colors", "Hide the source of the claim"];

const safe = (value: string | undefined, fallback: string) => value?.trim() || fallback;
const fade = (frame: number, start = 0, end = 20) => clampInterp(frame, [start, end], [0, 1]);
const rise = (frame: number, start = 0, end = 20, distance = 28) => interpolate(fade(frame, start, end), [0, 1], [distance, 0]);
const asColors = (p: BrandGuidelinesProps) => (p.colors?.filter(Boolean).slice(0, 8).length ? p.colors!.filter(Boolean).slice(0, 8) : DEFAULT_COLORS);
const asFont = (fonts: BrandGuidelinesProps["fonts"], key: "heading" | "body" | "mono", fallback: string) => {
  if (Array.isArray(fonts)) return fonts[key === "heading" ? 0 : key === "body" ? 1 : 2] || fallback;
  return fonts?.[key] || fallback;
};

const LogoMark: React.FC<{ p: BrandGuidelinesProps; pal: Palette; size?: number; inverted?: boolean }> = ({ p, pal, size = 86, inverted = false }) => {
  const frame = useCurrentFrame();
  const t = fade(frame, 8, 28);
  const color = inverted ? pal.bg : pal.text;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, opacity: t, transform: `translateY(${rise(frame, 8, 28)}px)`, color }}>
      <div style={{ width: size, height: size, borderRadius: size * 0.23, border: `2px solid ${inverted ? pal.bg : pal.accent}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: inverted ? pal.text : `${pal.primary}28`, boxShadow: `0 12px 32px ${pal.bg}66` }}>
        {p.logoUrl ? <img src={p.logoUrl} alt="" style={{ width: "72%", height: "72%", objectFit: "contain" }} /> : <span style={{ font: `900 ${Math.round(size * 0.27)}px ${SANS}`, letterSpacing: "-0.08em" }}>{safe(p.brandName, "N") .slice(0, 2).toUpperCase()}</span>}
      </div>
      <div>
        <div style={{ font: `850 ${Math.max(22, size * 0.28)}px ${SANS}`, letterSpacing: "-0.045em" }}>{safe(p.brandName, "Northstar")}</div>
        <div style={{ marginTop: 6, color: inverted ? `${pal.bg}b8` : `${pal.text}78`, font: `11px ${MONO}`, letterSpacing: ".18em" }}>IDENTITY SYSTEM</div>
      </div>
    </div>
  );
};

const Header: React.FC<{ p: BrandGuidelinesProps; pal: Palette; eyebrow?: string; light?: boolean }> = ({ p, pal, eyebrow = "BRAND GUIDELINES", light = false }) => {
  const frame = useCurrentFrame();
  const color = light ? pal.bg : pal.text;
  const muted = light ? `${pal.bg}a6` : `${pal.text}9a`;
  const headingFont = asFont(p.fonts, "heading", SANS);
  return (
    <div style={{ position: "absolute", left: "7%", top: "7%", width: "53%", color, fontFamily: headingFont, opacity: fade(frame, 2, 20), transform: `translateY(${rise(frame, 2, 20)}px)`, zIndex: 2 }}>
      <div style={{ color: light ? pal.bg : pal.accent, font: `800 15px ${MONO}`, letterSpacing: ".22em" }}>{eyebrow}</div>
      <div style={{ marginTop: 13, fontSize: 54, lineHeight: .98, fontWeight: 900, letterSpacing: "-.055em" }}>{safe(p.title, "Make the system unmistakable")}</div>
      <div style={{ marginTop: 16, maxWidth: 650, color: muted, font: `21px/1.35 ${asFont(p.fonts, "body", SANS)}` }}>{safe(p.subtitle, "A concise motion card for a brand people can recognize and trust.")}</div>
    </div>
  );
};

// Variant content mixes percentage positions with fixed-pixel type/panels.
// Compose on a 1920×1080 design canvas and scale as one unit so panels and
// copy keep their intended relationship at any viewport (thumbnails 800×450).
const StageFit: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}>{children}</div>;
};

const Base: React.FC<VariantProps & { children: React.ReactNode; eyebrow?: string; light?: boolean }> = ({ p, pal, children, eyebrow, light = false }) => {
  const frame = useCurrentFrame();
  const bg = p.background ? (p.background.startsWith("#") || p.background.startsWith("rgb") ? p.background : `url(${p.background}) center / cover`) : pal.bg;
  const accent = p.accentColor || pal.accent;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: bg, color: light ? pal.bg : pal.text, fontFamily: SANS }}>
      {!p.background && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 78% 24%, ${pal.primary}28, transparent 32%), linear-gradient(135deg, ${pal.bg}, ${pal.bgAlt ?? pal.bg})` }} />}
      <div style={{ position: "absolute", inset: 0, opacity: .07, backgroundImage: `linear-gradient(${light ? pal.bg : pal.text} 1px, transparent 1px), linear-gradient(90deg, ${light ? pal.bg : pal.text} 1px, transparent 1px)`, backgroundSize: "78px 78px", transform: `translate(${-(frame % 78) * .12}px, ${-(frame % 60) * .1}px)` }} />
      <StageFit>
        <div style={{ position: "absolute", inset: 0 }}>
          <div style={{ position: "absolute", left: "7%", top: "3.5%", width: "86%", height: 1, background: `${light ? pal.bg : pal.text}30` }} />
          <Header p={p} pal={{ ...pal, accent }} eyebrow={eyebrow} light={light} />
          {children}
          <div style={{ position: "absolute", right: "7%", bottom: "6%", color: `${light ? pal.bg : pal.text}62`, font: `11px ${MONO}`, letterSpacing: ".16em" }}>BUILD / USE / REPEAT</div>
        </div>
      </StageFit>
    </AbsoluteFill>
  );
};

const Panel: React.FC<{ pal: Palette; children: React.ReactNode; style?: CSSProperties; light?: boolean }> = ({ pal, children, style, light = false }) => (
  <div style={{ border: `1px solid ${light ? pal.bg : pal.text}2c`, background: `${light ? pal.bg : pal.text}0d`, borderRadius: 18, boxShadow: `0 22px 60px ${pal.bg}44`, ...style }}>{children}</div>
);

const LogoRules: React.FC<VariantProps> = ({ p, pal }) => (
  <Base p={p} pal={pal} eyebrow="01 / LOGO RULES">
    <div style={{ position: "absolute", left: "8%", top: "47%", width: "45%" }}><LogoMark p={p} pal={pal} size={104} /><div style={{ marginTop: 30, color: `${pal.text}8c`, font: `16px/1.5 ${SANS}`, maxWidth: 470 }}>The mark is the shortest path to recognition. Give it room, keep it legible, and let the system do the talking.</div></div>
    <Panel pal={pal} style={{ position: "absolute", left: "57%", top: "31%", width: "34%", padding: 28 }}><div style={{ color: pal.accent, font: `11px ${MONO}`, letterSpacing: ".18em" }}>APPROVED LOCKUPS</div>{["Primary / horizontal", "Compact / social", "Monochrome / print"].map((label, i) => <div key={label} style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 0", borderBottom: i < 2 ? `1px solid ${pal.text}20` : undefined }}><LogoMark p={{ ...p, logoUrl: i === 1 ? undefined : p.logoUrl }} pal={pal} size={40} /><span style={{ marginLeft: "auto", color: `${pal.text}9d`, font: `12px ${MONO}` }}>{label}</span></div>)}</Panel>
  </Base>
);

const ClearspaceDemo: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const t = fade(frame, 12, 36); const accent = p.accentColor || pal.accent;
  return <Base p={p} pal={pal} eyebrow="02 / CLEARSPACE"><div style={{ position: "absolute", left: "13%", top: "40%", width: "43%", height: "38%", border: `1px dashed ${accent}75`, borderRadius: 14, opacity: t }}><div style={{ position: "absolute", inset: "16%", border: `2px solid ${accent}`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}><LogoMark p={p} pal={pal} size={90} /></div>{["top", "bottom"].map((side) => <span key={side} style={{ position: "absolute", [side]: -28, left: "50%", transform: "translateX(-50%)", color: accent, font: `800 12px ${MONO}` }}>1× X-HEIGHT</span>)}<span style={{ position: "absolute", left: -105, top: "50%", color: accent, font: `800 12px ${MONO}`, transform: "rotate(-90deg)" }}>PROTECTED AREA</span></div><Panel pal={pal} style={{ position: "absolute", left: "64%", top: "39%", width: "27%", padding: 26 }}><div style={{ color: accent, font: `800 12px ${MONO}`, letterSpacing: ".16em" }}>THE RULE</div><div style={{ marginTop: 15, color: pal.text, font: `700 27px/1.08 ${SANS}` }}>Nothing crowds the mark.</div><div style={{ marginTop: 18, color: `${pal.text}9c`, font: `15px/1.45 ${SANS}` }}>Use the height of the internal letterform as the minimum clearspace on every side.</div></Panel></Base>;
};

const DontUseGrid: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const t = fade(frame, 10, 28); const bad = ["stretched", "busy", "tilted"];
  return <Base p={p} pal={pal} eyebrow="03 / DON'T USE"><div style={{ position: "absolute", left: "8%", top: "37%", width: "84%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>{[false, true].map((isBad) => <Panel key={String(isBad)} pal={pal} style={{ height: 350, padding: 26, borderColor: isBad ? "#ff5570aa" : `${pal.accent}88` }}><div style={{ display: "flex", justifyContent: "space-between", color: isBad ? "#ff5570" : pal.accent, font: `800 12px ${MONO}`, letterSpacing: ".18em" }}>{isBad ? "DON'T" : "DO"}<span>{isBad ? "×" : "✓"}</span></div><div style={{ height: 210, display: "flex", alignItems: "center", justifyContent: "center", opacity: t, transform: isBad ? `rotate(-8deg) scaleX(1.28)` : `scale(${.92 + t * .08})` }}><LogoMark p={p} pal={isBad ? { ...pal, accent: "#ff5570" } : pal} size={82} /></div><div style={{ color: `${pal.text}a0`, font: `15px ${SANS}` }}>{isBad ? (p.doDont?.dont?.[0] ?? "Never distort the mark") : (p.doDont?.do?.[0] ?? "Protect the mark")}</div></Panel>)}</div><div style={{ position: "absolute", left: "8%", top: "84%", color: `${pal.text}7c`, font: `12px ${MONO}` }}>01 / {bad.join("  ·  ")}</div></Base>;
};

const ColorDoDont: React.FC<VariantProps> = ({ p, pal }) => {
  const colors = asColors(p); const frame = useCurrentFrame(); const t = fade(frame, 8, 28);
  return <Base p={p} pal={pal} eyebrow="04 / COLOR SYSTEM"><div style={{ position: "absolute", left: "8%", top: "38%", width: "84%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>{[{ label: "DO / controlled contrast", values: colors, good: true }, { label: "DON'T / accidental noise", values: [...colors].reverse(), good: false }].map((group) => <Panel key={group.label} pal={pal} style={{ padding: 26, borderColor: group.good ? `${pal.accent}77` : "#ff557077" }}><div style={{ color: group.good ? pal.accent : "#ff5570", font: `800 12px ${MONO}`, letterSpacing: ".14em" }}>{group.label}</div><div style={{ display: "flex", gap: 10, marginTop: 25, opacity: t }}>{group.values.slice(0, 5).map((color, i) => <div key={`${color}-${i}`} style={{ flex: 1 }}><div style={{ height: 145, borderRadius: 12, background: color, transform: group.good ? `translateY(${Math.sin(frame * .04 + i) * 4}px)` : `rotate(${(i - 2) * 7}deg)` }} /><div style={{ marginTop: 10, color: `${pal.text}75`, font: `11px ${MONO}` }}>{color}</div></div>)}</div></Panel>)}</div></Base>;
};

const TypeRules: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const t = fade(frame, 8, 30); const heading = asFont(p.fonts, "heading", SANS); const body = asFont(p.fonts, "body", SANS); const mono = asFont(p.fonts, "mono", MONO);
  return <Base p={p} pal={pal} eyebrow="05 / TYPOGRAPHY"><Panel pal={pal} style={{ position: "absolute", left: "8%", top: "38%", width: "54%", padding: 28, opacity: t }}><div style={{ color: pal.accent, font: `11px ${mono}`, letterSpacing: ".18em" }}>TYPE SCALE / 01—04</div><div style={{ marginTop: 28, color: pal.text, font: `900 67px/.95 ${heading}`, letterSpacing: "-.06em" }}>{safe(p.brandName, "Northstar")}<span style={{ color: pal.accent }}>.</span></div><div style={{ marginTop: 18, color: `${pal.text}c3`, font: `27px/1.1 ${body}` }}>{safe(p.subtitle, "A recognizable voice in every size.")}</div><div style={{ marginTop: 29, height: 1, background: `${pal.text}32` }} /><div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 19 }}>{["DISPLAY", "TITLE", "BODY", "META"].map((label, i) => <div key={label}><div style={{ color: `${pal.text}68`, font: `10px ${mono}` }}>{label}</div><div style={{ marginTop: 9, color: pal.text, font: `${[28, 21, 16, 12][i]}px ${i < 2 ? heading : body}` }}>Aa</div></div>)}</div></Panel><Panel pal={pal} style={{ position: "absolute", left: "66%", top: "42%", width: "25%", padding: 25 }}><div style={{ color: pal.accent, font: `11px ${mono}`, letterSpacing: ".15em" }}>USAGE NOTE</div><div style={{ marginTop: 16, color: pal.text, font: `700 21px/1.2 ${body}` }}>{p.notes?.[0] ?? "One voice. Many useful sizes."}</div><div style={{ marginTop: 18, color: `${pal.text}82`, font: `13px/1.5 ${body}` }}>Pair the display face with a quiet body face. Let hierarchy do the work.</div></Panel></Base>;
};

const PhotographyRules: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const t = fade(frame, 9, 28); const examples = (p.examples?.length ? p.examples : DEFAULT_EXAMPLES).slice(0, 3);
  const tile = (good: boolean, i: number) => <div key={`${good}-${i}`} style={{ position: "relative", height: 142, borderRadius: 12, overflow: "hidden", background: good ? `linear-gradient(${120 + i * 18}deg, ${pal.primary}, ${pal.secondary} 52%, ${pal.accent})` : `linear-gradient(25deg, ${pal.text}22, ${pal.primary}55)`, filter: good ? undefined : "saturate(.35)", transform: `translateY(${good ? Math.sin(frame * .04 + i) * 3 : 0}px)` }}>{p.logoUrl && good && <img src={p.logoUrl} alt="" style={{ position: "absolute", inset: "18%", width: "64%", height: "64%", objectFit: "contain", opacity: .5 }} />}<div style={{ position: "absolute", left: 14, bottom: 12, color: good ? "#fff" : `${pal.text}bc`, font: `800 12px ${MONO}` }}>{good ? "DO / HUMAN + TEXTURED" : "DON'T / GENERIC + FLAT"}</div></div>;
  return <Base p={p} pal={pal} eyebrow="06 / PHOTOGRAPHY"><div style={{ position: "absolute", left: "8%", top: "39%", width: "84%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>{[true, false].map((good) => <Panel key={String(good)} pal={pal} style={{ padding: 24, borderColor: good ? `${pal.accent}77` : "#ff557077" }}><div style={{ color: good ? pal.accent : "#ff5570", font: `800 12px ${MONO}`, letterSpacing: ".16em" }}>{good ? "DO / POINT OF VIEW" : "DON'T / VISUAL NOISE"}</div><div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 22, opacity: t }}>{[0, 1, 2].map((i) => tile(good, i))}</div><div style={{ marginTop: 16, color: `${pal.text}8c`, font: `14px ${SANS}` }}>{good ? examples[0] : "Avoid stock-photo sameness."}</div></Panel>)}</div></Base>;
};

const MotionRules: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const t = fade(frame, 10, 30); const accent = p.accentColor || pal.accent;
  return <Base p={p} pal={pal} eyebrow="07 / MOTION PRINCIPLES"><Panel pal={pal} style={{ position: "absolute", left: "8%", top: "39%", width: "55%", height: 330, padding: 28 }}><div style={{ color: accent, font: `11px ${MONO}`, letterSpacing: ".18em" }}>MOTION / RESTRAINT → PURPOSE</div><svg viewBox="0 0 760 210" width="100%" height="205" style={{ marginTop: 22, overflow: "visible" }}><path d="M20 170 C 125 170, 130 32, 260 32 S 390 170, 510 170 S 630 32, 740 32" fill="none" stroke={`${pal.text}22`} strokeWidth="2" /><path d="M20 170 C 125 170, 130 32, 260 32 S 390 170, 510 170 S 630 32, 740 32" fill="none" stroke={accent} strokeWidth="7" strokeDasharray="800" strokeDashoffset={800 * (1 - t)} strokeLinecap="round" /><circle cx={20 + (720 * ((frame % 100) / 100))} cy={100} r="9" fill={pal.secondary} /></svg><div style={{ display: "flex", justifyContent: "space-between", color: `${pal.text}75`, font: `11px ${MONO}` }}><span>REST</span><span>REVEAL</span><span>SETTLE</span></div></Panel><Panel pal={pal} style={{ position: "absolute", left: "67%", top: "42%", width: "24%", padding: 25 }}><div style={{ color: accent, font: `11px ${MONO}`, letterSpacing: ".14em" }}>RULE 01</div><div style={{ marginTop: 15, color: pal.text, font: `700 22px/1.18 ${SANS}` }}>{p.notes?.[0] ?? "Motion earns attention; it does not demand it."}</div><div style={{ marginTop: 16, color: `${pal.text}80`, font: `13px/1.5 ${SANS}` }}>Use a clear entrance, one meaningful emphasis, and a calm landing.</div></Panel></Base>;
};

const IconRules: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const t = fade(frame, 8, 28); const colors = asColors(p);
  return <Base p={p} pal={pal} eyebrow="08 / ICONOGRAPHY"><div style={{ position: "absolute", left: "8%", top: "39%", width: "53%", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>{Array.from({ length: 8 }, (_, i) => <Panel key={i} pal={pal} style={{ height: 112, display: "flex", alignItems: "center", justifyContent: "center", opacity: t, transform: `translateY(${rise(frame, 8 + i * 2, 26 + i * 2, 18)}px)` }}><svg width="50" height="50" viewBox="0 0 50 50" fill="none" stroke={colors[i % colors.length]} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="25" cy="25" r="17" opacity=".28" />{i % 4 === 0 && <path d="M16 25h18M25 16v18" />}{i % 4 === 1 && <path d="M17 32l8-14 8 14M20 27h10" />}{i % 4 === 2 && <path d="M17 18h16v14H17zM21 22h8M21 27h5" />}{i % 4 === 3 && <path d="M16 27l7 7 12-15" />}</svg></Panel>)}</div><Panel pal={pal} style={{ position: "absolute", left: "67%", top: "42%", width: "24%", padding: 25 }}><div style={{ color: pal.accent, font: `11px ${MONO}`, letterSpacing: ".14em" }}>ICON RULES</div><div style={{ marginTop: 15, color: pal.text, font: `700 22px/1.18 ${SANS}` }}>One stroke. One idea.</div><div style={{ marginTop: 16, color: `${pal.text}80`, font: `13px/1.5 ${SANS}` }}>{p.notes?.[1] ?? "Keep optical weight consistent and let icons breathe at every size."}</div></Panel></Base>;
};

const VoiceCard: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const t = fade(frame, 8, 28); const doItems = (p.doDont?.do?.length ? p.doDont.do : DEFAULT_DO).slice(0, 3); const dontItems = (p.doDont?.dont?.length ? p.doDont.dont : DEFAULT_DONT).slice(0, 3);
  return <Base p={p} pal={pal} eyebrow="09 / VOICE & TONE"><div style={{ position: "absolute", left: "8%", top: "39%", width: "84%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>{[{ good: true, label: "SOUND LIKE", items: doItems }, { good: false, label: "NOT LIKE", items: dontItems }].map((group) => <Panel key={group.label} pal={pal} style={{ padding: 28, borderColor: group.good ? `${pal.accent}77` : "#ff557077", opacity: t }}><div style={{ color: group.good ? pal.accent : "#ff5570", font: `800 12px ${MONO}`, letterSpacing: ".18em" }}>{group.label}</div>{group.items.map((item, i) => <div key={item} style={{ display: "flex", alignItems: "center", gap: 16, padding: "19px 0", borderBottom: i < group.items.length - 1 ? `1px solid ${pal.text}20` : undefined, color: pal.text, font: `650 19px ${SANS}` }}><span style={{ color: group.good ? pal.accent : "#ff5570", font: `900 20px ${MONO}` }}>{group.good ? "✓" : "×"}</span>{item}</div>)}</Panel>)}</div></Base>;
};

const GuidelinesClose: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const t = fade(frame, 12, 34); const examples = (p.examples?.length ? p.examples : DEFAULT_EXAMPLES).slice(0, 3); const colors = asColors(p);
  return <Base p={p} pal={{ ...pal, accent: p.accentColor || pal.accent }} eyebrow="10 / SYSTEM CLOSE" light><div style={{ position: "absolute", inset: 0, background: `linear-gradient(120deg, ${pal.text} 0%, ${pal.secondary} 100%)`, opacity: .95 }} /><div style={{ position: "absolute", left: "8%", top: "38%", width: "84%", display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 34, alignItems: "center" }}><div><LogoMark p={p} pal={pal} size={116} inverted /><div style={{ marginTop: 30, color: `${pal.bg}b5`, font: `18px/1.45 ${SANS}`, maxWidth: 460 }}>{safe(p.subtitle, "A living system for every place the brand shows up.")}</div></div><div style={{ opacity: t, display: "grid", gap: 12 }}>{examples.map((item, i) => <div key={item} style={{ display: "flex", alignItems: "center", gap: 18, padding: "17px 19px", borderRadius: 12, background: `${pal.bg}19`, border: `1px solid ${pal.bg}35`, color: pal.bg, font: `700 17px ${SANS}` }}><span style={{ width: 27, height: 27, borderRadius: 99, background: colors[i % colors.length], color: pal.bg, display: "inline-flex", alignItems: "center", justifyContent: "center", font: `900 12px ${MONO}` }}>0{i + 1}</span>{item}</div>)}</div></div></Base>;
};

const VARIANT_COMPONENTS: Record<BrandGuidelinesVariant, ComponentType<VariantProps>> = {
  "logo-rules": LogoRules,
  "clearspace-demo": ClearspaceDemo,
  "dont-use-grid": DontUseGrid,
  "color-do-dont": ColorDoDont,
  "type-rules": TypeRules,
  "photography-rules": PhotographyRules,
  "motion-rules": MotionRules,
  "icon-rules": IconRules,
  "voice-card": VoiceCard,
  "guidelines-close": GuidelinesClose,
};

const BrandGuidelines: React.FC<BrandGuidelinesProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Component = VARIANT_COMPONENTS[props.variant] ?? LogoRules;
  return <Component p={props} pal={pal} />;
};

const familyCast = (variant: BrandGuidelinesVariant): ComponentType<Record<string, unknown>> => (props) => (
  <BrandGuidelines {...(props as unknown as BrandGuidelinesProps)} variant={variant} />
);

export const FAMILY_COMPONENTS: Record<string, ComponentType<Record<string, unknown>>> = {
  "brand-guidelines-logo-rules": familyCast("logo-rules"),
  "brand-guidelines-clearspace-demo": familyCast("clearspace-demo"),
  "brand-guidelines-dont-use-grid": familyCast("dont-use-grid"),
  "brand-guidelines-color-do-dont": familyCast("color-do-dont"),
  "brand-guidelines-type-rules": familyCast("type-rules"),
  "brand-guidelines-photography-rules": familyCast("photography-rules"),
  "brand-guidelines-motion-rules": familyCast("motion-rules"),
  "brand-guidelines-icon-rules": familyCast("icon-rules"),
  "brand-guidelines-voice-card": familyCast("voice-card"),
  "brand-guidelines-guidelines-close": familyCast("guidelines-close"),
};
