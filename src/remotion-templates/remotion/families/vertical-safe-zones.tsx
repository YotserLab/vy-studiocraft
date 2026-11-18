import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, clampInterp, resolvePalette, type Palette } from "../lib/primitives";

/** Production-safe vertical layouts for TikTok, Reels, Shorts, and any 9:16 export. */
export type VerticalSafeZonesVariant =
  | "safe-zone-grid"
  | "caption-safe"
  | "notch-safe"
  | "platform-compare"
  | "center-crop"
  | "top-bottom-reserve"
  | "side-rail-safe"
  | "vertical-title"
  | "cta-safe"
  | "safe-zone-audit";

export interface SafeInsets {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface VerticalSafeZonesProps {
  variant: VerticalSafeZonesVariant;
  platform: string;
  aspectRatio: string;
  content: string;
  title: string;
  subtitle: string;
  brand: string;
  paletteName: string;
  safeInsets: SafeInsets;
  captions: string[];
  overlays: string[];
  showLabels: boolean;
  contentColor?: string;
  backgroundColor?: string;
  cta?: string;
}

type VariantProps = { p: VerticalSafeZonesProps; pal: Palette };
const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const DEFAULT_CAPTIONS = ["Keep captions inside the safe area.", "Readable on every platform."];
const DEFAULT_OVERLAYS = ["Like", "Comment", "Share"];
const DEFAULT_INSETS = { top: 9, right: 7, bottom: 14, left: 7 };
const text = (value: string | undefined, fallback: string) => value?.trim() || fallback;
const list = (value: string[] | undefined, fallback: string[]) => value && value.length ? value : fallback;
const inset = (p: VerticalSafeZonesProps, key: keyof SafeInsets) => {
  const value = p.safeInsets?.[key];
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(28, value)) : DEFAULT_INSETS[key as keyof typeof DEFAULT_INSETS];
};

const Canvas: React.FC<VariantProps & { children: React.ReactNode }> = ({ p, pal, children }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const progress = clampInterp(frame, [0, 18], [0, 1]);
  const bg = p.backgroundColor || pal.bg;
  return (
    <AbsoluteFill style={{ background: bg, color: p.contentColor || pal.text, fontFamily: FONT, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 20%, ${pal.primary}28, transparent 58%), linear-gradient(155deg, ${bg}, ${pal.bg})` }} />
      <div style={{ position: "absolute", inset: 0, opacity: 0.12, backgroundImage: `linear-gradient(${pal.text}22 1px, transparent 1px), linear-gradient(90deg, ${pal.text}22 1px, transparent 1px)`, backgroundSize: `${Math.max(32, width * 0.055)}px ${Math.max(32, width * 0.055)}px` }} />
      <div style={{ position: "absolute", top: 22, left: 28, right: 28, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: Math.max(12, width * 0.018), letterSpacing: "0.12em", textTransform: "uppercase", opacity: progress, transform: `translateY(${(1 - progress) * -10}px)` }}>
        <span style={{ color: pal.accent, fontWeight: 900 }}>{text(p.brand, "STUDIO")}</span>
        <span style={{ color: pal.secondary }}>{text(p.platform, "VERTICAL")}</span>
      </div>
      {children}
    </AbsoluteFill>
  );
};

const SafeRect: React.FC<{ p: VerticalSafeZonesProps; pal: Palette; children?: React.ReactNode; label?: string; dashed?: boolean }> = ({ p, pal, children, label, dashed = false }) => {
  const { width, height } = useVideoConfig();
  const top = inset(p, "top"); const right = inset(p, "right"); const bottom = inset(p, "bottom"); const left = inset(p, "left");
  return <div style={{ position: "absolute", left: `${left}%`, right: `${right}%`, top: `${top + 4}%`, bottom: `${bottom}%`, border: `${dashed ? 2 : 1}px ${dashed ? "dashed" : "solid"} ${pal.accent}aa`, borderRadius: Math.min(width, height) * 0.018, boxSizing: "border-box" }}>
    {label && <div style={{ position: "absolute", top: -Math.max(14, width * 0.022), left: 12, padding: "4px 8px", borderRadius: 5, color: pal.bg, background: pal.accent, fontSize: Math.max(10, width * 0.014), letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 900 }}>{label}</div>}
    {children}
  </div>;
};

const ZoneLabel: React.FC<{ pal: Palette; children: React.ReactNode; style?: React.CSSProperties }> = ({ pal, children, style }) => <div style={{ color: pal.secondary, fontSize: "clamp(10px, 1.4vw, 18px)", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", ...style }}>{children}</div>;

const SafeZoneGrid: React.FC<VariantProps> = ({ p, pal }) => {
  const { width, height } = useVideoConfig();
  return <Canvas p={p} pal={pal}><SafeRect p={p} pal={pal} label="platform-safe content" dashed><div style={{ height: "100%", display: "grid", placeItems: "center", textAlign: "center", padding: "8%" }}><div><ZoneLabel pal={pal}>9:16 production guide</ZoneLabel><div style={{ marginTop: "3%", fontSize: `clamp(28px, ${Math.min(width * 0.065, height * 0.052)}px, 86px)`, lineHeight: 0.94, fontWeight: 950, letterSpacing: "-0.06em" }}>{text(p.title, "Keep the important part here")}</div><div style={{ marginTop: "3%", color: pal.secondary, fontSize: "clamp(14px, 2vw, 27px)" }}>{text(p.content, "The center stays visible after every crop.")}</div></div></div></SafeRect><ZoneLabel pal={pal} style={{ position: "absolute", top: `${inset(p, "top") + 1.5}%`, left: "50%", transform: "translateX(-50%)", color: pal.accent }}>top interaction chrome</ZoneLabel><ZoneLabel pal={pal} style={{ position: "absolute", bottom: `${inset(p, "bottom") / 2}%`, left: "50%", transform: "translateX(-50%)", color: pal.accent }}>bottom controls</ZoneLabel><div style={{ position: "absolute", left: 0, top: "50%", color: pal.secondary, fontSize: 11, transform: "rotate(-90deg) translateX(-50%)", transformOrigin: "left top" }}>{Math.round(inset(p, "left"))}% SIDE BUFFER</div><div style={{ position: "absolute", right: 0, top: "50%", color: pal.secondary, fontSize: 11, transform: "rotate(90deg) translateX(50%)", transformOrigin: "right top" }}>{Math.round(inset(p, "right"))}% SIDE BUFFER</div></Canvas>;
};

const CaptionSafe: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig(); const captions = list(p.captions, DEFAULT_CAPTIONS); const i = Math.min(captions.length - 1, Math.floor(frame / 42));
  return <Canvas p={p} pal={pal}><SafeRect p={p} pal={pal} label="captions stay readable"><div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "9%", textAlign: "center" }}><ZoneLabel pal={pal}>visual content</ZoneLabel><div style={{ marginTop: "5%", fontSize: `clamp(28px, ${Math.min(width * 0.075, height * 0.058)}px, 92px)`, lineHeight: 0.92, fontWeight: 950, letterSpacing: "-0.06em" }}>{text(p.title, "Design for the subtitle")}</div><div style={{ marginTop: "5%", color: pal.secondary, fontSize: "clamp(15px, 2.3vw, 32px)" }}>{text(p.subtitle, "The caption never covers the message.")}</div></div></SafeRect><div style={{ position: "absolute", left: `${inset(p, "left") + 2}%`, right: `${inset(p, "right") + 2}%`, bottom: `${inset(p, "bottom") + 2}%`, padding: "1.5% 3%", borderRadius: 12, background: `${pal.bg}dd`, border: `2px solid ${pal.accent}`, textAlign: "center", fontSize: "clamp(16px, 2.6vw, 34px)", fontWeight: 850, transform: `translateY(${clampInterp(frame, [0, 12], [40, 0])}px)`, opacity: clampInterp(frame, [0, 12], [0, 1]) }}>{captions[i]}</div><ZoneLabel pal={pal} style={{ position: "absolute", bottom: `${Math.max(1, inset(p, "bottom") - 3)}%`, left: "50%", transform: "translateX(-50%)", color: pal.accent }}>caption reserve</ZoneLabel></Canvas>;
};

const NotchSafe: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { width } = useVideoConfig();
  return <Canvas p={p} pal={pal}><div style={{ position: "absolute", top: `${inset(p, "top") - 1}%`, left: "50%", width: "24%", height: "3.6%", transform: "translateX(-50%)", borderRadius: 999, background: pal.bg, border: `2px solid ${pal.accent}`, boxShadow: `0 0 0 5px ${pal.accent}22` }} /><SafeRect p={p} pal={pal} label="notch-safe content"><div style={{ height: "100%", display: "grid", placeItems: "center", textAlign: "center", padding: "8%" }}><div><div style={{ display: "inline-block", padding: "8px 14px", borderRadius: 999, background: `${pal.primary}44`, color: pal.secondary, fontSize: "clamp(11px, 1.5vw, 18px)", fontWeight: 900 }}>{text(p.platform, "REELS")} CAMERA-SAFE</div><div style={{ marginTop: "7%", fontSize: `clamp(30px, ${Math.min(width * 0.08, 92)}px, 92px)`, lineHeight: 0.92, fontWeight: 950, letterSpacing: "-0.06em" }}>{text(p.title, "Leave room for the camera")}</div><div style={{ marginTop: "5%", color: pal.secondary, fontSize: "clamp(14px, 2vw, 28px)" }}>{text(p.content, "The top edge is reserved for device chrome.")}</div></div></div></SafeRect><ZoneLabel pal={pal} style={{ position: "absolute", top: `${inset(p, "top") - 5}%`, left: "50%", transform: "translateX(-50%)", color: pal.accent }}>camera / notch reserve</ZoneLabel><div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.18, border: `${Math.max(2, width * 0.006)}px solid ${pal.accent}`, borderRadius: 24 }} /></Canvas>;
};

const PlatformCompare: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const platforms = ["TikTok", "Reels", "Shorts"]; const values = ["9 / 14 / 16%", "8 / 12 / 15%", "7 / 10 / 13%"]; const { width } = useVideoConfig();
  return <Canvas p={p} pal={pal}><div style={{ position: "absolute", left: "8%", right: "8%", top: "16%" }}><ZoneLabel pal={pal}>same story / different chrome</ZoneLabel><div style={{ marginTop: "2%", fontSize: `clamp(28px, ${Math.min(width * 0.075, 90)}px, 90px)`, lineHeight: 0.93, fontWeight: 950, letterSpacing: "-0.06em" }}>{text(p.title, "Platform-safe by default")}</div></div><div style={{ position: "absolute", left: "8%", right: "8%", top: "38%", display: "flex", flexDirection: "column", gap: "2%" }}>{platforms.map((name, i) => <div key={name} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4%", alignItems: "center", padding: "3% 4%", borderRadius: 16, background: `${[pal.primary, pal.secondary, pal.accent][i]}22`, border: `1px solid ${[pal.primary, pal.secondary, pal.accent][i]}88`, transform: `translateX(${clampInterp(frame, [0, 15 + i * 8], [width * 0.25, 0])}px)`, opacity: clampInterp(frame, [0, 15 + i * 8], [0, 1]) }}><strong style={{ fontSize: "clamp(18px, 3vw, 34px)" }}>{name}</strong><span style={{ color: pal.secondary, fontSize: "clamp(12px, 1.8vw, 22px)", textAlign: "right" }}>{values[i]} safe insets</span></div>)}</div><div style={{ position: "absolute", left: "8%", right: "8%", bottom: "12%", padding: "3%", borderTop: `1px solid ${pal.text}33`, color: pal.secondary, fontSize: "clamp(14px, 2vw, 26px)" }}>{text(p.content, "Keep essential copy in the shared center.")}</div></Canvas>;
};

const CenterCrop: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig(); const crop = clampInterp(frame, [0, 26], [0.78, 1]);
  return <Canvas p={p} pal={pal}><div style={{ position: "absolute", left: "10%", right: "10%", top: "18%", textAlign: "center" }}><ZoneLabel pal={pal}>center crop simulator</ZoneLabel><div style={{ marginTop: "3%", fontSize: `clamp(25px, ${Math.min(width * 0.06, 75)}px, 75px)`, fontWeight: 950 }}>{text(p.title, "Keep the subject centered")}</div></div><div style={{ position: "absolute", left: "8%", right: "8%", top: "37%", height: "36%", border: `2px solid ${pal.secondary}`, borderRadius: 18, overflow: "hidden", background: `linear-gradient(120deg, ${pal.primary}88, ${pal.accent}55)` }}><div style={{ position: "absolute", left: `${50 - crop * 38}%`, top: "12%", width: `${crop * 76}%`, height: "76%", borderRadius: "50%", background: `radial-gradient(circle at 35% 35%, ${pal.secondary}, ${pal.primary} 45%, ${pal.bg} 78%)`, border: `3px solid ${pal.text}aa`, boxShadow: `0 0 70px ${pal.accent}88` }} /><SafeRect p={{ ...p, safeInsets: { top: 0, bottom: 0, left: 8, right: 8 } }} pal={pal} label="9:16 crop"><div /></SafeRect></div><div style={{ position: "absolute", left: "10%", right: "10%", bottom: "12%", display: "flex", justifyContent: "space-between", color: pal.secondary, fontSize: "clamp(12px, 1.8vw, 22px)" }}><span>source {text(p.aspectRatio, "16:9")}</span><span>target 9:16</span></div></Canvas>;
};

const TopBottomReserve: React.FC<VariantProps> = ({ p, pal }) => {
  const { width } = useVideoConfig();
  return <Canvas p={p} pal={pal}><div style={{ position: "absolute", left: 0, right: 0, top: 0, height: `${inset(p, "top") + 4}%`, background: `${pal.accent}22`, borderBottom: `2px solid ${pal.accent}`, display: "grid", placeItems: "end center", paddingBottom: "1%" }}><ZoneLabel pal={pal} style={{ color: pal.accent }}>top reserve · username / status</ZoneLabel></div><div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${inset(p, "bottom") + 4}%`, background: `${pal.accent}22`, borderTop: `2px solid ${pal.accent}`, display: "grid", placeItems: "start center", paddingTop: "1%" }}><ZoneLabel pal={pal} style={{ color: pal.accent }}>bottom reserve · controls / CTA</ZoneLabel></div><SafeRect p={{ ...p, safeInsets: { top: inset(p, "top") + 3, bottom: inset(p, "bottom") + 3, left: 8, right: 8 } }} pal={pal} label="story window"><div style={{ height: "100%", display: "grid", placeItems: "center", textAlign: "center", padding: "8%" }}><div><div style={{ fontSize: `clamp(28px, ${Math.min(width * 0.075, 88)}px, 88px)`, lineHeight: 0.92, fontWeight: 950, letterSpacing: "-0.05em" }}>{text(p.title, "Protect the story window")}</div><div style={{ marginTop: "5%", color: pal.secondary, fontSize: "clamp(14px, 2vw, 26px)" }}>{text(p.content, "Reserve space before placing text or graphics.")}</div></div></div></SafeRect></Canvas>;
};

const SideRailSafe: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const rails = list(p.overlays, DEFAULT_OVERLAYS); const { width } = useVideoConfig();
  return <Canvas p={p} pal={pal}><div style={{ position: "absolute", left: 0, top: "12%", bottom: "12%", width: `${inset(p, "left") + 4}%`, background: `${pal.accent}18`, borderRight: `2px solid ${pal.accent}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "5%" }}>{rails.slice(0, 3).map((label, i) => <div key={label} style={{ width: "65%", aspectRatio: "1", borderRadius: "50%", display: "grid", placeItems: "center", background: pal.primary, color: pal.bg, fontSize: "clamp(9px, 1.5vw, 16px)", fontWeight: 900, opacity: clampInterp(frame, [i * 10, 18 + i * 10], [0, 1]) }}>{label.slice(0, 1).toUpperCase()}</div>)}</div><div style={{ position: "absolute", right: 0, top: "12%", bottom: "12%", width: `${inset(p, "right") + 4}%`, background: `${pal.accent}18`, borderLeft: `2px solid ${pal.accent}`, display: "grid", placeItems: "center", writingMode: "vertical-rl" }}><ZoneLabel pal={pal} style={{ color: pal.accent }}>interaction rail</ZoneLabel></div><SafeRect p={{ ...p, safeInsets: { ...p.safeInsets, left: inset(p, "left") + 5, right: inset(p, "right") + 5 } }} pal={pal} label="content avoids rails"><div style={{ height: "100%", display: "grid", placeItems: "center", textAlign: "center", padding: "8%" }}><div><div style={{ fontSize: `clamp(26px, ${Math.min(width * 0.06, 78)}px, 78px)`, fontWeight: 950, lineHeight: 0.95 }}>{text(p.title, "Give overlays their own lane")}</div><div style={{ marginTop: "6%", color: pal.secondary, fontSize: "clamp(13px, 1.8vw, 24px)" }}>{text(p.content, "Keep the message clear of interaction chrome.")}</div></div></div></SafeRect></Canvas>;
};

const VerticalTitle: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig();
  return <Canvas p={p} pal={pal}><SafeRect p={p} pal={pal} label="title-safe"><div style={{ height: "100%", display: "grid", gridTemplateColumns: "18% 1fr 18%", alignItems: "center", gap: "5%" }}><div style={{ writingMode: "vertical-rl", transform: `rotate(180deg) translateY(${clampInterp(frame, [0, 20], [height * 0.16, 0])}px)`, fontSize: `clamp(24px, ${Math.min(width * 0.07, height * 0.06)}px, 86px)`, lineHeight: 0.9, fontWeight: 950, letterSpacing: "-0.06em", color: pal.accent }}>{text(p.title, "Vertical story")}</div><div style={{ textAlign: "center" }}><ZoneLabel pal={pal}>vertical-first typography</ZoneLabel><div style={{ marginTop: "8%", fontSize: "clamp(16px, 2.5vw, 34px)", color: pal.secondary }}>{text(p.content, "A title can move with the format instead of fighting it.")}</div></div><div style={{ writingMode: "vertical-rl", fontSize: "clamp(11px, 1.4vw, 18px)", letterSpacing: "0.18em", color: pal.secondary, textTransform: "uppercase" }}>{text(p.subtitle, "safe on every screen")}</div></div></SafeRect></Canvas>;
};

const CtaSafe: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { width } = useVideoConfig(); const cta = text(p.cta, "Learn more");
  return <Canvas p={p} pal={pal}><SafeRect p={p} pal={pal} label="message-safe"><div style={{ height: "100%", display: "grid", placeItems: "center", textAlign: "center", padding: "9%" }}><div><div style={{ color: pal.accent, fontSize: "clamp(12px, 1.6vw, 20px)", fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase" }}>{text(p.platform, "SHORTS")} READY</div><div style={{ marginTop: "5%", fontSize: `clamp(29px, ${Math.min(width * 0.075, 90)}px, 90px)`, lineHeight: 0.92, fontWeight: 950, letterSpacing: "-0.06em" }}>{text(p.title, "Put the CTA where thumbs can find it")}</div><div style={{ marginTop: "5%", color: pal.secondary, fontSize: "clamp(14px, 2vw, 26px)" }}>{text(p.subtitle, "A clear action without covering the subject.")}</div></div></div></SafeRect><div style={{ position: "absolute", left: `${inset(p, "left") + 2}%`, right: `${inset(p, "right") + 2}%`, bottom: `${inset(p, "bottom") + 5}%`, maxHeight: "9%", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", gap: "2%", padding: "1.5% 4%", borderRadius: 999, background: pal.accent, color: pal.bg, textAlign: "center", fontSize: "clamp(17px, 2.7vw, 34px)", lineHeight: 1.08, fontWeight: 950, overflow: "hidden", overflowWrap: "anywhere", boxShadow: `0 12px 30px ${pal.accent}55`, transformOrigin: "center bottom", transform: `scale(${1 + Math.sin(frame * 0.1) * 0.025})` }}>{cta} <span style={{ flex: "0 0 auto" }}>↗</span></div><ZoneLabel pal={pal} style={{ position: "absolute", bottom: `${inset(p, "bottom") + 0.8}%`, left: "50%", transform: "translateX(-50%)", color: pal.accent }}>cta reserve</ZoneLabel></Canvas>;
};

const SafeZoneAudit: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { width } = useVideoConfig(); const checks = ["Subject inside shared crop", "Captions clear of controls", "Top chrome has breathing room", "CTA survives platform overlays"]; return <Canvas p={p} pal={pal}><div style={{ position: "absolute", left: "8%", right: "8%", top: "15%" }}><ZoneLabel pal={pal}>preflight / vertical-safe-zones</ZoneLabel><div style={{ marginTop: "3%", fontSize: `clamp(27px, ${Math.min(width * 0.07, 84)}px, 84px)`, lineHeight: 0.93, fontWeight: 950, letterSpacing: "-0.06em" }}>{text(p.title, "Ship a safe vertical export")}</div><div style={{ marginTop: "3%", color: pal.secondary, fontSize: "clamp(14px, 2vw, 25px)" }}>{text(p.content, "A quick audit before the render leaves the timeline.")}</div></div><div style={{ position: "absolute", left: "8%", right: "8%", top: "40%", display: "flex", flexDirection: "column", gap: "2%" }}>{checks.map((check, i) => { const done = clampInterp(frame, [12 + i * 9, 25 + i * 9], [0, 1]); return <div key={check} style={{ display: "flex", alignItems: "center", gap: "4%", padding: "3% 4%", borderRadius: 14, border: `1px solid ${pal.text}22`, background: `${pal.text}0b`, transform: `translateX(${(1 - done) * width * 0.18}px)`, opacity: done }}><div style={{ width: "clamp(20px, 4vw, 40px)", aspectRatio: "1", borderRadius: "50%", display: "grid", placeItems: "center", background: pal.accent, color: pal.bg, fontWeight: 950 }}>✓</div><span style={{ fontSize: "clamp(14px, 2vw, 25px)", fontWeight: 800 }}>{check}</span></div>; })}</div><div style={{ position: "absolute", bottom: "10%", left: "8%", right: "8%", display: "flex", justifyContent: "space-between", color: pal.secondary, fontSize: "clamp(12px, 1.6vw, 20px)" }}><span>{text(p.aspectRatio, "9:16")} · {text(p.platform, "all platforms")}</span><strong style={{ color: pal.accent }}>READY TO RENDER</strong></div></Canvas>;
};

const COMPONENTS: Record<VerticalSafeZonesVariant, React.FC<VariantProps>> = {
  "safe-zone-grid": SafeZoneGrid,
  "caption-safe": CaptionSafe,
  "notch-safe": NotchSafe,
  "platform-compare": PlatformCompare,
  "center-crop": CenterCrop,
  "top-bottom-reserve": TopBottomReserve,
  "side-rail-safe": SideRailSafe,
  "vertical-title": VerticalTitle,
  "cta-safe": CtaSafe,
  "safe-zone-audit": SafeZoneAudit,
};

const VerticalSafeZonesTemplate: React.FC<VerticalSafeZonesProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = COMPONENTS[props.variant] || SafeZoneGrid;
  return <Canvas p={props} pal={pal}><FadeEdges inFrames={8} outFrames={10}><Variant p={props} pal={pal} /></FadeEdges></Canvas>;
};

const familyCast = (component: React.FC<VerticalSafeZonesProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "vertical-safe-zones-safe-zone-grid": familyCast(VerticalSafeZonesTemplate),
  "vertical-safe-zones-caption-safe": familyCast(VerticalSafeZonesTemplate),
  "vertical-safe-zones-notch-safe": familyCast(VerticalSafeZonesTemplate),
  "vertical-safe-zones-platform-compare": familyCast(VerticalSafeZonesTemplate),
  "vertical-safe-zones-center-crop": familyCast(VerticalSafeZonesTemplate),
  "vertical-safe-zones-top-bottom-reserve": familyCast(VerticalSafeZonesTemplate),
  "vertical-safe-zones-side-rail-safe": familyCast(VerticalSafeZonesTemplate),
  "vertical-safe-zones-vertical-title": familyCast(VerticalSafeZonesTemplate),
  "vertical-safe-zones-cta-safe": familyCast(VerticalSafeZonesTemplate),
  "vertical-safe-zones-safe-zone-audit": familyCast(VerticalSafeZonesTemplate),
};
