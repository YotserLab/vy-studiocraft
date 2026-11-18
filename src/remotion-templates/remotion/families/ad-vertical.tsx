import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  FadeEdges,
  NoiseGrainOverlay,
  clampInterp,
  resolvePalette,
  seededRand,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: ad-vertical
 * Ten short-form performance-ad structures. Every composition is safe for a
 * 9:16 canvas while remaining responsive on landscape previews and exports.
 */
export type AdVerticalVariant =
  | "three-second-hook"
  | "problem-solution"
  | "feature-proof"
  | "testimonial-hook"
  | "offer-countdown"
  | "ugc-caption"
  | "product-swipe"
  | "benefit-stack"
  | "social-proof-wall"
  | "cta-endcard";

export interface AdVerticalProps {
  variant: AdVerticalVariant;
  hook: string;
  headline: string;
  subline: string;
  product: string;
  proof: string;
  offer: string;
  cta: string;
  brand: string;
  paletteName: string;
  productImage?: string;
  logo?: string;
  benefits?: string[];
  captions?: string[];
  testimonial?: string;
  handle?: string;
  countdownSeconds?: number;
}

type VariantProps = { p: AdVerticalProps; pal: Palette };
const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const DEFAULT_BENEFITS = ["Ship faster", "Look polished", "Convert more"];
const DEFAULT_CAPTIONS = ["wait for it", "this changed everything", "try it free"];

const textOr = (value: string | undefined, fallback: string): string => value?.trim() || fallback;
const listOr = (value: string[] | undefined, fallback: string[]): string[] =>
  value && value.length ? value : fallback;

const Background: React.FC<{ pal: Palette; variant: AdVerticalVariant }> = ({ pal, variant }) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame * 0.018) * 3;
  const warm = variant === "offer-countdown" || variant === "cta-endcard";
  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: "125%",
          height: "64%",
          left: "-12%",
          top: `${-14 + drift}%`,
          borderRadius: "50%",
          background: `radial-gradient(ellipse, ${warm ? pal.accent : pal.primary}35 0%, transparent 68%)`,
          filter: "blur(22px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "70%",
          right: "-34%",
          bottom: `${-20 - drift}%`,
          borderRadius: "50%",
          background: `radial-gradient(ellipse, ${pal.secondary}24 0%, transparent 69%)`,
          filter: "blur(32px)",
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, transparent 35%, ${pal.bg} 92%)` }} />
    </AbsoluteFill>
  );
};

const TopBar: React.FC<{ p: AdVerticalProps; pal: Palette; progress?: number }> = ({ p, pal, progress = 0 }) => {
  const { width, height } = useVideoConfig();
  const s = Math.min(width / 1080, height / 1920);
  return (
    <div
      style={{
        position: "absolute",
        top: height > width ? 58 * s : 30,
        left: "8%",
        right: "8%",
        display: "flex",
        alignItems: "center",
        gap: 14 * s,
        fontFamily: FONT,
      }}
    >
      <div style={{ width: 46 * s, height: 46 * s, borderRadius: 14 * s, display: "grid", placeItems: "center", background: `linear-gradient(135deg, ${pal.primary}, ${pal.accent})`, color: pal.bg, fontWeight: 950, fontSize: 21 * s }}>
        {p.logo ? <Img src={p.logo} style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 14 * s }} /> : p.brand.slice(0, 1).toUpperCase()}
      </div>
      <div style={{ color: pal.text, fontSize: 22 * s, fontWeight: 850, letterSpacing: "0.01em", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.brand}</div>
      <div style={{ width: 76 * s, height: 6 * s, borderRadius: 99, background: `${pal.text}24`, overflow: "hidden" }}><div style={{ width: `${Math.round(progress * 100)}%`, height: "100%", background: pal.accent, borderRadius: 99 }} /></div>
    </div>
  );
};

const Pill: React.FC<{ children: React.ReactNode; pal: Palette; scale: number; color?: string }> = ({ children, pal, scale, color }) => (
  <div style={{ display: "inline-flex", alignItems: "center", padding: `${10 * scale}px ${16 * scale}px`, borderRadius: 999, color: color || pal.text, background: `${(color || pal.primary)}26`, border: `1px solid ${(color || pal.primary)}70`, fontFamily: FONT, fontSize: 18 * scale, fontWeight: 850, letterSpacing: "0.08em", textTransform: "uppercase" }}>{children}</div>
);

const ProductVisual: React.FC<{ p: AdVerticalProps; pal: Palette; scale: number; rotate?: number; accent?: string }> = ({ p, pal, scale, rotate = 0, accent }) => {
  const { width } = useVideoConfig();
  const box = Math.min(width * 0.62, 520 * scale);
  return (
    <div style={{ width: box, height: box * 1.08, position: "relative", transform: `rotate(${rotate}deg)`, filter: `drop-shadow(0 28px 30px ${pal.bg}99)` }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 42 * scale, background: `linear-gradient(145deg, ${accent || pal.primary}, ${pal.bg} 70%)`, border: `2px solid ${pal.text}35`, overflow: "hidden" }}>
        {p.productImage ? <Img src={p.productImage} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : <>
          <div style={{ position: "absolute", inset: "8%", borderRadius: 28 * scale, border: `1px solid ${pal.text}30`, background: `linear-gradient(160deg, ${pal.text}17, transparent 54%)` }} />
          <div style={{ position: "absolute", left: "14%", right: "14%", top: "17%", height: "8%", borderRadius: 99, background: `${pal.text}35` }} />
          <div style={{ position: "absolute", left: "14%", right: "24%", bottom: "24%", height: "18%", borderRadius: 18 * scale, background: `${pal.text}18`, border: `1px solid ${pal.text}25` }} />
          <div style={{ position: "absolute", width: "36%", aspectRatio: "1", right: "14%", top: "36%", borderRadius: "50%", background: pal.accent, opacity: 0.85 }} />
        </>}
        <div style={{ position: "absolute", left: "12%", bottom: "10%", color: pal.text, fontFamily: FONT, fontSize: 22 * scale, fontWeight: 900, maxWidth: "72%" }}>{p.product}</div>
      </div>
      <div style={{ position: "absolute", width: "30%", aspectRatio: "1", borderRadius: "50%", left: "-18%", top: "15%", background: pal.accent, opacity: 0.8, filter: "blur(2px)" }} />
    </div>
  );
};

const Hook: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = Math.min(width / 1080, height / 1920);
  const enter = spring({ frame: frame - 2, fps, config: { damping: 13, stiffness: 180 } });
  const pop = spring({ frame: frame - 14, fps, config: { damping: 8, stiffness: 190 } });
  return <AbsoluteFill style={{ fontFamily: FONT, color: pal.text }}>
    <TopBar p={p} pal={pal} progress={clampInterp(frame, [0, 90], [0, 1])} />
    <div style={{ position: "absolute", top: height * 0.19, left: "8%", right: "8%", textAlign: "center", transform: `translateY(${interpolate(enter, [0, 1], [height * 0.18, 0])}px)`, opacity: enter }}>
      <Pill pal={pal} scale={s} color={pal.accent}>Stop scrolling</Pill>
      <div style={{ marginTop: 20 * s, fontSize: Math.min(width * 0.105, 118 * s), lineHeight: 0.91, letterSpacing: "-0.06em", fontWeight: 950 }}>{p.hook}</div>
      <div style={{ color: pal.secondary, fontSize: 27 * s, lineHeight: 1.25, marginTop: 24 * s }}>{p.subline}</div>
    </div>
    <div style={{ position: "absolute", left: "50%", top: "57%", transform: `translate(-50%, -50%) scale(${interpolate(pop, [0, 1], [0.45, 1])}) rotate(${interpolate(pop, [0, 1], [-9, 0])}deg)`, opacity: pop }}><ProductVisual p={p} pal={pal} scale={s} /></div>
    <div style={{ position: "absolute", bottom: height > width ? "8%" : "6%", left: "8%", right: "8%", textAlign: "center", color: pal.text, fontSize: 22 * s, fontWeight: 800 }}>{p.cta} <span style={{ color: pal.accent }}>→</span></div>
  </AbsoluteFill>;
};

const ProblemSolution: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { fps, width, height } = useVideoConfig(); const s = Math.min(width / 1080, height / 1920);
  const reveal = spring({ frame: frame - 8, fps, config: { damping: 16, stiffness: 120 } });
  const swap = clampInterp(frame, [44, 72], [0, 1]);
  return <AbsoluteFill style={{ fontFamily: FONT, color: pal.text }}>
    <TopBar p={p} pal={pal} progress={clampInterp(frame, [0, 105], [0, 1])} />
    <div style={{ position: "absolute", left: "8%", right: "8%", top: "19%" }}><Pill pal={pal} scale={s}>The old way → the better way</Pill><div style={{ marginTop: 22 * s, fontSize: Math.min(width * 0.09, 94 * s), lineHeight: 0.93, fontWeight: 950, letterSpacing: "-0.055em" }}>{p.headline}</div></div>
    <div style={{ position: "absolute", left: "8%", right: "8%", top: "43%", display: "flex", flexDirection: "column", gap: 14 * s }}>
      <div style={{ padding: `${25 * s}px`, borderRadius: 28 * s, background: `${pal.text}0d`, border: `1px solid ${pal.text}25`, opacity: 1 - swap * 0.62, transform: `translateX(${interpolate(reveal, [0, 1], [-width * 0.5, 0])}px)` }}><div style={{ color: pal.accent, fontSize: 18 * s, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase" }}>Problem</div><div style={{ marginTop: 10 * s, fontSize: 34 * s, fontWeight: 850 }}>{p.subline}</div></div>
      <div style={{ alignSelf: "center", fontSize: 38 * s, color: pal.accent, opacity: swap }}>↓</div>
      <div style={{ padding: `${25 * s}px`, borderRadius: 28 * s, background: `${pal.primary}32`, border: `1px solid ${pal.primary}80`, opacity: swap, transform: `translateY(${interpolate(swap, [0, 1], [42 * s, 0])}px)` }}><div style={{ color: pal.secondary, fontSize: 18 * s, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase" }}>Solution</div><div style={{ marginTop: 10 * s, fontSize: 34 * s, fontWeight: 850 }}>{p.product}</div></div>
    </div>
    <div style={{ position: "absolute", bottom: "9%", left: "8%", right: "8%", padding: `${18 * s}px`, textAlign: "center", borderRadius: 999, color: pal.bg, background: pal.accent, fontSize: 24 * s, fontWeight: 950, transform: `scale(${interpolate(swap, [0, 1], [0.9, 1])})` }}>{p.cta}</div>
  </AbsoluteFill>;
};

const FeatureProof: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { fps, width, height } = useVideoConfig(); const s = Math.min(width / 1080, height / 1920); const benefits = listOr(p.benefits, DEFAULT_BENEFITS);
  const enter = spring({ frame: frame - 7, fps, config: { damping: 18, stiffness: 115 } });
  return <AbsoluteFill style={{ fontFamily: FONT, color: pal.text }}>
    <TopBar p={p} pal={pal} progress={clampInterp(frame, [0, 115], [0, 1])} />
    <div style={{ position: "absolute", top: "18%", left: "8%", right: "8%" }}><div style={{ color: pal.secondary, fontSize: 19 * s, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase" }}>{p.product}</div><div style={{ marginTop: 16 * s, fontSize: Math.min(width * 0.092, 96 * s), lineHeight: 0.93, letterSpacing: "-0.055em", fontWeight: 950 }}>{p.headline}</div></div>
    <div style={{ position: "absolute", top: "42%", left: "8%", right: "8%", display: "flex", flexDirection: "column", gap: 15 * s }}>{benefits.slice(0, 3).map((benefit, i) => { const t = clampInterp(frame, [14 + i * 13, 34 + i * 13], [0, 1]); return <div key={benefit} style={{ display: "flex", alignItems: "center", gap: 17 * s, padding: `${20 * s}px`, borderRadius: 24 * s, background: `${pal.text}0e`, border: `1px solid ${pal.text}20`, transform: `translateX(${interpolate(t, [0, 1], [-width * 0.5, 0])}px)`, opacity: t }}><div style={{ width: 38 * s, height: 38 * s, borderRadius: "50%", display: "grid", placeItems: "center", color: pal.bg, background: pal.accent, fontWeight: 950, fontSize: 20 * s }}>✓</div><div style={{ fontSize: 29 * s, fontWeight: 850 }}>{benefit}</div></div>; })}</div>
    <div style={{ position: "absolute", bottom: "9%", left: "8%", right: "8%", textAlign: "center", opacity: enter, color: `${pal.text}b5`, fontSize: 22 * s }}>{p.proof}</div>
  </AbsoluteFill>;
};

const Testimonial: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { fps, width, height } = useVideoConfig(); const s = Math.min(width / 1080, height / 1920); const enter = spring({ frame: frame - 9, fps, config: { damping: 16, stiffness: 105 } });
  return <AbsoluteFill style={{ fontFamily: FONT, color: pal.text }}><TopBar p={p} pal={pal} progress={clampInterp(frame, [0, 110], [0, 1])} /><div style={{ position: "absolute", top: "18%", left: "8%", right: "8%", textAlign: "center" }}><Pill pal={pal} scale={s} color={pal.accent}>Real people. Real result.</Pill></div><div style={{ position: "absolute", top: "35%", left: "8%", right: "8%", padding: `${42 * s}px ${30 * s}px`, borderRadius: 34 * s, background: `${pal.text}10`, border: `1px solid ${pal.text}28`, transform: `translateY(${interpolate(enter, [0, 1], [height * 0.2, 0])}px)`, opacity: enter }}><div style={{ color: pal.accent, fontSize: 72 * s, lineHeight: 0.5, fontWeight: 950 }}>“</div><div style={{ marginTop: 20 * s, fontSize: Math.min(width * 0.065, 58 * s), lineHeight: 1.08, fontWeight: 850, letterSpacing: "-0.035em" }}>{textOr(p.testimonial, p.headline)}</div><div style={{ display: "flex", alignItems: "center", gap: 14 * s, marginTop: 28 * s }}><div style={{ width: 54 * s, height: 54 * s, borderRadius: "50%", background: `linear-gradient(135deg, ${pal.primary}, ${pal.accent})` }} /><div><div style={{ fontSize: 21 * s, fontWeight: 900 }}>{textOr(p.handle, "@happy_customer")}</div><div style={{ color: pal.secondary, fontSize: 17 * s }}>{p.proof}</div></div></div></div><div style={{ position: "absolute", bottom: "10%", left: "8%", right: "8%", textAlign: "center", color: pal.accent, fontSize: 26 * s, fontWeight: 900 }}>{p.cta} →</div></AbsoluteFill>;
};

const OfferCountdown: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { fps, width, height } = useVideoConfig(); const s = Math.min(width / 1080, height / 1920); const enter = spring({ frame: frame - 4, fps, config: { damping: 13, stiffness: 150 } }); const total = Math.max(1, p.countdownSeconds || 9); const remain = Math.max(0, Math.ceil(total - frame / 30));
  return <AbsoluteFill style={{ fontFamily: FONT, color: pal.text, textAlign: "center" }}><TopBar p={p} pal={pal} progress={clampInterp(frame, [0, 100], [0, 1])} /><div style={{ position: "absolute", top: "18%", left: "8%", right: "8%" }}><Pill pal={pal} scale={s} color={pal.accent}>Limited drop</Pill><div style={{ marginTop: 20 * s, fontSize: Math.min(width * 0.11, 120 * s), lineHeight: 0.9, fontWeight: 950, letterSpacing: "-0.06em" }}>{p.offer}</div></div><div style={{ position: "absolute", top: "43%", left: "50%", transform: `translate(-50%, -50%) scale(${interpolate(enter, [0, 1], [0.5, 1])})`, opacity: enter, width: 270 * s, height: 270 * s, borderRadius: "50%", display: "grid", placeItems: "center", background: `conic-gradient(${pal.accent} ${clampInterp(frame, [0, total * 30], [360, 0])}deg, ${pal.text}16 0)`, boxShadow: `0 0 80px ${pal.accent}35` }}><div style={{ width: "82%", height: "82%", borderRadius: "50%", display: "grid", placeItems: "center", background: pal.bg }}><div><div style={{ fontSize: 88 * s, lineHeight: 0.9, fontWeight: 950, fontVariantNumeric: "tabular-nums" }}>{String(remain).padStart(2, "0")}</div><div style={{ color: pal.secondary, marginTop: 9 * s, fontSize: 17 * s, letterSpacing: "0.15em", textTransform: "uppercase" }}>seconds</div></div></div></div><div style={{ position: "absolute", bottom: "11%", left: "8%", right: "8%" }}><div style={{ color: pal.secondary, fontSize: 23 * s }}>{p.subline}</div><div style={{ marginTop: 18 * s, padding: `${19 * s}px`, borderRadius: 999, color: pal.bg, background: pal.accent, fontSize: 25 * s, fontWeight: 950 }}>{p.cta}</div></div></AbsoluteFill>;
};

const UgcCaption: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { fps, width, height } = useVideoConfig(); const s = Math.min(width / 1080, height / 1920); const enter = spring({ frame: frame - 5, fps, config: { damping: 18, stiffness: 100 } }); const captions = listOr(p.captions, DEFAULT_CAPTIONS); const captionIndex = Math.min(captions.length - 1, Math.floor(frame / 34));
  return <AbsoluteFill style={{ fontFamily: FONT, color: pal.text }}><TopBar p={p} pal={pal} progress={clampInterp(frame, [0, 100], [0, 1])} /><div style={{ position: "absolute", left: "8%", right: "8%", top: "16%", textAlign: "center", color: pal.text, fontSize: 30 * s, fontWeight: 900 }}>{p.hook}</div><div style={{ position: "absolute", top: "26%", left: "10%", right: "10%", height: "51%", borderRadius: 38 * s, overflow: "hidden", border: `2px solid ${pal.text}30`, background: `linear-gradient(155deg, ${pal.primary}, ${pal.bg} 58%, ${pal.accent})`, transform: `scale(${interpolate(enter, [0, 1], [0.85, 1])}) rotate(${interpolate(enter, [0, 1], [-2, 0])}deg)`, opacity: enter }}><div style={{ position: "absolute", inset: 0, background: `repeating-linear-gradient(135deg, transparent 0 54px, ${pal.text}0d 54px 56px)` }} /><div style={{ position: "absolute", left: "8%", top: "8%", padding: `${9 * s}px ${13 * s}px`, borderRadius: 99, background: `${pal.bg}aa`, fontSize: 16 * s, fontWeight: 850 }}>● LIVE TEST</div><div style={{ position: "absolute", bottom: "12%", left: "8%", right: "8%", textAlign: "center", fontSize: Math.min(width * 0.085, 83 * s), lineHeight: 0.95, fontWeight: 950, letterSpacing: "-0.055em", textShadow: `0 4px 18px ${pal.bg}` }}>{captions[captionIndex]}</div></div><div style={{ position: "absolute", bottom: "10%", left: "8%", right: "8%", textAlign: "center", color: pal.accent, fontSize: 25 * s, fontWeight: 950 }}>{p.cta}</div></AbsoluteFill>;
};

const ProductSwipe: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { fps, width, height } = useVideoConfig(); const s = Math.min(width / 1080, height / 1920); const card = spring({ frame: frame - 8, fps, config: { damping: 15, stiffness: 105 } }); const x = Math.sin(frame * 0.055) * 35 * s;
  return <AbsoluteFill style={{ fontFamily: FONT, color: pal.text }}><TopBar p={p} pal={pal} progress={clampInterp(frame, [0, 110], [0, 1])} /><div style={{ position: "absolute", top: "18%", left: "8%", right: "8%" }}><div style={{ fontSize: Math.min(width * 0.085, 90 * s), lineHeight: 0.95, fontWeight: 950, letterSpacing: "-0.06em" }}>{p.headline}</div><div style={{ color: pal.secondary, marginTop: 16 * s, fontSize: 23 * s }}>{p.subline}</div></div><div style={{ position: "absolute", top: "46%", left: "50%", transform: `translate(-50%, -50%) translateX(${x}px) rotate(${interpolate(card, [0, 1], [9, 0])}deg)`, opacity: card }}><ProductVisual p={p} pal={pal} scale={s} accent={pal.accent} /></div><div style={{ position: "absolute", bottom: "10%", left: "8%", right: "8%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: `${17 * s}px ${21 * s}px`, borderRadius: 999, background: pal.text, color: pal.bg, fontSize: 22 * s, fontWeight: 900 }}><span>{p.product}</span><span style={{ color: pal.accent }}>Swipe →</span></div></AbsoluteFill>;
};

const BenefitStack: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig(); const s = Math.min(width / 1080, height / 1920); const benefits = listOr(p.benefits, DEFAULT_BENEFITS);
  return <AbsoluteFill style={{ fontFamily: FONT, color: pal.text }}><TopBar p={p} pal={pal} progress={clampInterp(frame, [0, 105], [0, 1])} /><div style={{ position: "absolute", top: "18%", left: "8%", right: "8%" }}><Pill pal={pal} scale={s}>Why people switch</Pill><div style={{ marginTop: 19 * s, fontSize: Math.min(width * 0.09, 95 * s), lineHeight: 0.93, fontWeight: 950, letterSpacing: "-0.06em" }}>{p.headline}</div></div><div style={{ position: "absolute", top: "43%", left: "12%", right: "12%" }}>{benefits.slice(0, 3).map((benefit, i) => { const t = clampInterp(frame, [8 + i * 18, 27 + i * 18], [0, 1]); return <div key={benefit} style={{ position: "absolute", width: "100%", padding: `${28 * s}px ${24 * s}px`, borderRadius: 28 * s, background: [pal.primary, pal.secondary, pal.accent][i % 3], color: i === 1 ? pal.bg : pal.text, transform: `translateY(${(i * 42 + (1 - t) * 120) * s}px) rotate(${(i - 1) * 3 * (1 - t)}deg)`, opacity: t, boxShadow: `0 ${18 + i * 10}px ${38 + i * 10}px ${pal.bg}99` }}><div style={{ fontSize: 17 * s, fontWeight: 950, letterSpacing: "0.15em" }}>0{i + 1}</div><div style={{ marginTop: 12 * s, fontSize: 34 * s, fontWeight: 950 }}>{benefit}</div></div>; })}</div><div style={{ position: "absolute", bottom: "9%", left: "8%", right: "8%", textAlign: "center", color: pal.secondary, fontSize: 22 * s }}>{p.proof}</div></AbsoluteFill>;
};

const SocialProof: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig(); const s = Math.min(width / 1080, height / 1920); const comments = [p.testimonial || "Finally, a tool that just works.", "My favorite discovery this month.", "The results speak for themselves."];
  return <AbsoluteFill style={{ fontFamily: FONT, color: pal.text }}><TopBar p={p} pal={pal} progress={clampInterp(frame, [0, 115], [0, 1])} /><div style={{ position: "absolute", top: "18%", left: "8%", right: "8%", textAlign: "center" }}><div style={{ color: pal.accent, fontSize: 24 * s, fontWeight: 950, letterSpacing: "0.12em", textTransform: "uppercase" }}>{p.proof}</div><div style={{ marginTop: 14 * s, fontSize: Math.min(width * 0.095, 98 * s), lineHeight: 0.92, letterSpacing: "-0.06em", fontWeight: 950 }}>{p.headline}</div></div><div style={{ position: "absolute", top: "42%", left: "8%", right: "8%", display: "flex", flexDirection: "column", gap: 14 * s }}>{comments.map((comment, i) => { const t = clampInterp(frame, [13 + i * 14, 32 + i * 14], [0, 1]); return <div key={comment} style={{ display: "flex", gap: 14 * s, alignItems: "flex-start", padding: `${19 * s}px`, borderRadius: 24 * s, background: `${pal.text}0f`, border: `1px solid ${pal.text}24`, transform: `translateX(${interpolate(t, [0, 1], [width * (i % 2 ? 0.5 : -0.5), 0])}px)`, opacity: t }}><div style={{ width: 38 * s, height: 38 * s, borderRadius: "50%", flex: "0 0 auto", background: `linear-gradient(135deg, ${pal.primary}, ${pal.accent})` }} /><div><div style={{ color: pal.accent, fontSize: 17 * s }}>★★★★★</div><div style={{ marginTop: 6 * s, fontSize: 21 * s, lineHeight: 1.18, fontWeight: 800 }}>{comment}</div></div></div>; })}</div><div style={{ position: "absolute", bottom: "10%", left: "8%", right: "8%", textAlign: "center", color: pal.secondary, fontSize: 22 * s }}>{p.subline}</div></AbsoluteFill>;
};

const CtaEndcard: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { fps, width, height } = useVideoConfig(); const s = Math.min(width / 1080, height / 1920); const enter = spring({ frame: frame - 8, fps, config: { damping: 16, stiffness: 105 } }); const pulse = 1 + Math.sin(frame * 0.12) * 0.025;
  return <AbsoluteFill style={{ fontFamily: FONT, color: pal.text, textAlign: "center" }}><TopBar p={p} pal={pal} progress={clampInterp(frame, [0, 100], [0, 1])} /><div style={{ position: "absolute", top: "18%", left: "8%", right: "8%", opacity: enter, transform: `translateY(${interpolate(enter, [0, 1], [80, 0])}px)` }}><div style={{ color: pal.secondary, fontSize: 27 * s, fontWeight: 850 }}>{p.brand}</div><div style={{ marginTop: 20 * s, fontSize: Math.min(width * 0.11, 120 * s), lineHeight: 0.9, fontWeight: 950, letterSpacing: "-0.065em" }}>{p.headline}</div><div style={{ marginTop: 22 * s, color: `${pal.text}aa`, fontSize: 25 * s }}>{p.subline}</div></div><div style={{ position: "absolute", top: "52%", left: "50%", transform: `translate(-50%, -50%) scale(${pulse})`, opacity: enter }}><ProductVisual p={p} pal={pal} scale={s} rotate={-3} /></div><div style={{ position: "absolute", bottom: "10%", left: "8%", right: "8%", padding: `${21 * s}px`, borderRadius: 999, color: pal.bg, background: pal.accent, fontSize: 28 * s, fontWeight: 950, transform: `scale(${interpolate(enter, [0, 1], [0.75, 1])})` }}>{p.cta} <span style={{ marginLeft: 9 * s }}>↗</span></div></AbsoluteFill>;
};

const COMPONENTS: Record<AdVerticalVariant, React.FC<VariantProps>> = {
  "three-second-hook": Hook,
  "problem-solution": ProblemSolution,
  "feature-proof": FeatureProof,
  "testimonial-hook": Testimonial,
  "offer-countdown": OfferCountdown,
  "ugc-caption": UgcCaption,
  "product-swipe": ProductSwipe,
  "benefit-stack": BenefitStack,
  "social-proof-wall": SocialProof,
  "cta-endcard": CtaEndcard,
};

const AdVerticalTemplate: React.FC<AdVerticalProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = COMPONENTS[props.variant] || Hook;
  return <AbsoluteFill style={{ backgroundColor: pal.bg, overflow: "hidden" }}><Background pal={pal} variant={props.variant} /><FadeEdges inFrames={7} outFrames={9}><Variant p={props} pal={pal} /></FadeEdges><NoiseGrainOverlay opacity={0.025} /></AbsoluteFill>;
};

const familyCast = (component: React.FC<AdVerticalProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "ad-vertical-three-second-hook": familyCast(AdVerticalTemplate),
  "ad-vertical-problem-solution": familyCast(AdVerticalTemplate),
  "ad-vertical-feature-proof": familyCast(AdVerticalTemplate),
  "ad-vertical-testimonial-hook": familyCast(AdVerticalTemplate),
  "ad-vertical-offer-countdown": familyCast(AdVerticalTemplate),
  "ad-vertical-ugc-caption": familyCast(AdVerticalTemplate),
  "ad-vertical-product-swipe": familyCast(AdVerticalTemplate),
  "ad-vertical-benefit-stack": familyCast(AdVerticalTemplate),
  "ad-vertical-social-proof-wall": familyCast(AdVerticalTemplate),
  "ad-vertical-cta-endcard": familyCast(AdVerticalTemplate),
};
