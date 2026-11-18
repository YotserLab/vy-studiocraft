import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FadeEdges, resolvePalette, seededRand, type Palette } from "../lib/primitives";

/**
 * FAMILY: sale-promos
 * Ten deterministic promotion stories. Every variant works with procedural
 * product cards by default and accepts optional product image URLs.
 */
export type SalePromoVariant =
  | "percent-off"
  | "flash-sale"
  | "midnight-drop"
  | "bundle-save"
  | "member-price"
  | "free-shipping"
  | "coupon-reveal"
  | "last-chance"
  | "weekend-sale"
  | "seasonal-sale";

export interface SalePromoProps {
  variant: SalePromoVariant;
  offer: string;
  dates: string;
  terms: string;
  productImages?: string[];
  productName: string;
  price: string;
  compareAt: string;
  code: string;
  cta: string;
  countdown: string;
  paletteName: string;
}

type VariantProps = { p: SalePromoProps; pal: Palette };
const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';

const ease = (frame: number, start: number, end: number): number =>
  interpolate(frame, [start, end], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const ProductArt: React.FC<{
  p: SalePromoProps;
  pal: Palette;
  index?: number;
  size?: number;
  radius?: number;
  angle?: number;
}> = ({ p, pal, index = 0, size = 330, radius = 32, angle = 0 }) => {
  const src = p.productImages?.[index];
  return (
    <div style={{ width: size, height: size * 1.08, borderRadius: radius, overflow: "hidden", position: "relative", flex: "0 0 auto", transform: `rotate(${angle}deg)`, background: `linear-gradient(145deg, ${pal.primary}cc, ${pal.accent}bb 58%, ${pal.secondary}66)`, border: `1px solid ${pal.text}35`, boxShadow: `0 28px 80px ${pal.bg}88` }}>
      {src ? (
        <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <>
          <div style={{ position: "absolute", inset: "12% 12% 28%", borderRadius: "48% 48% 26% 26%", background: `linear-gradient(155deg, ${pal.text}ee, ${pal.secondary}90 48%, ${pal.primary}a0)`, transform: `rotate(${index % 2 ? 5 : -5}deg)` }} />
          <div style={{ position: "absolute", left: "17%", right: "17%", bottom: "13%", height: "10%", borderRadius: 99, background: `${pal.bg}99` }} />
          <div style={{ position: "absolute", left: "10%", top: "8%", color: pal.text, fontFamily: MONO, fontSize: Math.max(12, size * 0.045), letterSpacing: "0.16em", fontWeight: 800 }}>DROP 0{index + 1}</div>
        </>
      )}
    </div>
  );
};

const GrainDots: React.FC<{ pal: Palette; count?: number }> = ({ pal, count = 12 }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const x = 5 + seededRand(i * 9 + 1) * 90;
        const y = 5 + seededRand(i * 9 + 2) * 90;
        const size = 4 + seededRand(i * 9 + 3) * 13;
        const drift = Math.sin(frame * 0.035 + i) * 18;
        return <div key={i} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: size, height: size, borderRadius: "50%", background: [pal.primary, pal.secondary, pal.accent][i % 3], opacity: 0.22, transform: `translateY(${drift}px)` }} />;
      })}
    </>
  );
};

const Eyebrow: React.FC<{ children: React.ReactNode; pal: Palette }> = ({ children, pal }) => (
  <div style={{ color: pal.accent, fontFamily: MONO, fontSize: 20, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" }}>{children}</div>
);

const CTA: React.FC<{ label: string; pal: Palette; scale?: number }> = ({ label, pal, scale = 1 }) => (
  <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: `${16 * scale}px ${29 * scale}px`, borderRadius: 999, color: pal.bg, background: pal.accent, fontFamily: FONT, fontSize: 21 * scale, fontWeight: 900, letterSpacing: "0.02em", boxShadow: `0 12px 35px ${pal.accent}45` }}>{label} <span style={{ marginLeft: 12 }}>→</span></div>
);

const PriceLine: React.FC<{ p: SalePromoProps; pal: Palette; large?: boolean }> = ({ p, pal, large = false }) => (
  <div style={{ display: "flex", alignItems: "baseline", gap: large ? 17 : 11, fontFamily: FONT }}>
    <span style={{ color: pal.text, fontSize: large ? 78 : 44, lineHeight: 1, fontWeight: 950, letterSpacing: "-0.06em" }}>{p.price}</span>
    <span style={{ color: `${pal.text}70`, fontSize: large ? 30 : 20, textDecoration: "line-through" }}>{p.compareAt}</span>
  </div>
);

const PercentOff: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = Math.min(width / 1920, height / 1080);
  const enter = spring({ frame: frame - 8, fps, config: { damping: 16, stiffness: 110 } });
  const product = spring({ frame: frame - 22, fps, config: { damping: 13, stiffness: 120 } });
  return <AbsoluteFill style={{ justifyContent: "center", padding: 100 * s, fontFamily: FONT }}>
    <GrainDots pal={pal} />
    <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", alignItems: "center", gap: 70 * s, width: "100%", maxWidth: 1500 * s, margin: "0 auto" }}>
      <div style={{ opacity: enter, transform: `translateX(${interpolate(enter, [0, 1], [-80 * s, 0])}px)` }}>
        <Eyebrow pal={pal}>{p.dates}</Eyebrow>
        <div style={{ color: pal.text, fontSize: Math.min(130 * s, width * 0.075), lineHeight: 0.88, fontWeight: 950, letterSpacing: "-0.07em", marginTop: 23 * s }}>{p.offer}</div>
        <div style={{ color: pal.secondary, fontSize: 30 * s, marginTop: 26 * s, maxWidth: 680 * s }}>{p.productName} · {p.terms}</div>
        <div style={{ marginTop: 30 * s }}><PriceLine p={p} pal={pal} large /></div>
        <div style={{ marginTop: 34 * s }}><CTA label={p.cta} pal={pal} scale={s} /></div>
      </div>
      <div style={{ position: "relative", display: "grid", placeItems: "center", opacity: product, transform: `translateY(${interpolate(product, [0, 1], [120 * s, 0])}px) rotate(${interpolate(product, [0, 1], [8, 0])}deg)` }}>
        <ProductArt p={p} pal={pal} size={390 * s} />
        <div style={{ position: "absolute", top: -25 * s, right: 0, padding: `${17 * s}px ${24 * s}px`, borderRadius: 18 * s, color: pal.bg, background: pal.accent, fontSize: 30 * s, fontWeight: 950, transform: "rotate(8deg)", boxShadow: `0 18px 40px ${pal.bg}88` }}>{p.offer}</div>
      </div>
    </div>
  </AbsoluteFill>;
};

const FlashSale: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = Math.min(width / 1920, height / 1080);
  const reveal = spring({ frame: frame - 5, fps, config: { damping: 15, stiffness: 125 } });
  const progress = ease(frame, 22, 96);
  const digits = p.countdown.split(":").slice(0, 3);
  return <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT }}>
    <div style={{ position: "absolute", inset: 0, opacity: 0.18, background: `repeating-linear-gradient(-45deg, ${pal.accent} 0 22px, transparent 22px 58px)` }} />
    <div style={{ width: "82%", maxWidth: 1480 * s, textAlign: "center", opacity: reveal, transform: `scale(${interpolate(reveal, [0, 1], [0.82, 1])})` }}>
      <Eyebrow pal={pal}>LIMITED TIME · {p.dates}</Eyebrow>
      <div style={{ color: pal.text, fontSize: Math.min(112 * s, width * 0.07), lineHeight: 0.95, fontWeight: 950, letterSpacing: "-0.06em", marginTop: 20 * s }}>{p.offer}</div>
      <div style={{ display: "flex", justifyContent: "center", gap: 17 * s, marginTop: 44 * s }}>
        {digits.map((digit, i) => <div key={i} style={{ minWidth: 150 * s, padding: `${24 * s}px ${18 * s}px`, borderRadius: 22 * s, background: `${pal.text}12`, border: `1px solid ${pal.text}45`, color: pal.text, fontFamily: MONO, fontSize: 70 * s, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{digit.padStart(2, "0")}<div style={{ marginTop: 8 * s, color: pal.secondary, fontFamily: FONT, fontSize: 15 * s, letterSpacing: "0.18em" }}>{["HOURS", "MIN", "SEC"][i]}</div></div>)}
      </div>
      <div style={{ height: 12 * s, margin: `${37 * s}px auto ${25 * s}px`, maxWidth: 900 * s, borderRadius: 99, background: `${pal.text}20`, overflow: "hidden" }}><div style={{ width: `${(1 - progress) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${pal.primary}, ${pal.accent})` }} /></div>
      <div style={{ color: pal.secondary, fontSize: 26 * s }}>{p.productName} · {p.terms}</div>
      <div style={{ marginTop: 28 * s }}><CTA label={p.cta} pal={pal} scale={s} /></div>
    </div>
  </AbsoluteFill>;
};

const MidnightDrop: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = Math.min(width / 1920, height / 1080);
  const enter = spring({ frame: frame - 14, fps, config: { damping: 16, stiffness: 95 } });
  const moon = ease(frame, 0, 60);
  return <AbsoluteFill style={{ justifyContent: "center", overflow: "hidden", fontFamily: FONT, background: `radial-gradient(circle at 73% 31%, ${pal.secondary}30 0 7%, transparent 7.5%), linear-gradient(145deg, ${pal.bg}, ${pal.primary}22)` }}>
    <div style={{ position: "absolute", width: 560 * s, height: 560 * s, borderRadius: "50%", right: -120 * s, top: -110 * s, background: pal.text, opacity: 0.08 + moon * 0.08, boxShadow: `0 0 120px ${pal.secondary}45` }} />
    <div style={{ width: "78%", maxWidth: 1450 * s, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 0.8fr", gap: 80 * s, alignItems: "center", opacity: enter, transform: `translateY(${interpolate(enter, [0, 1], [80 * s, 0])}px)` }}>
      <div><Eyebrow pal={pal}>{p.dates}</Eyebrow><div style={{ color: pal.text, fontSize: Math.min(122 * s, width * 0.078), fontWeight: 950, lineHeight: 0.9, letterSpacing: "-0.07em", marginTop: 24 * s }}>{p.offer}</div><div style={{ color: pal.secondary, fontSize: 29 * s, lineHeight: 1.35, marginTop: 28 * s }}>{p.productName} · {p.terms}</div><div style={{ marginTop: 32 * s, color: pal.accent, fontFamily: MONO, fontSize: 34 * s, letterSpacing: "0.12em" }}>DROPS AT {p.countdown}</div><div style={{ marginTop: 34 * s }}><CTA label={p.cta} pal={pal} scale={s} /></div></div>
      <div style={{ display: "grid", placeItems: "center", transform: `translateY(${Math.sin(frame * 0.04) * 12 * s}px)` }}><ProductArt p={p} pal={pal} size={400 * s} angle={-6} /></div>
    </div>
  </AbsoluteFill>;
};

const BundleSave: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = Math.min(width / 1920, height / 1080);
  return <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT }}>
    <div style={{ width: "84%", maxWidth: 1500 * s, textAlign: "center" }}><Eyebrow pal={pal}>{p.dates}</Eyebrow><div style={{ color: pal.text, fontSize: Math.min(86 * s, width * 0.06), fontWeight: 900, letterSpacing: "-0.055em", marginTop: 15 * s }}>{p.offer}</div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "end", height: 420 * s, marginTop: 32 * s }}>
        {[0, 1, 2].map((i) => { const enter = spring({ frame: frame - 10 - i * 9, fps, config: { damping: 13, stiffness: 125 } }); return <div key={i} style={{ margin: `0 ${-34 * s}px`, zIndex: i, transform: `translateY(${interpolate(enter, [0, 1], [200 * s, 0])}px) rotate(${(i - 1) * 7}deg) scale(${interpolate(enter, [0, 1], [0.76, 1])})`, opacity: enter }}><ProductArt p={p} pal={pal} index={i} size={270 * s} angle={0} /></div>; })}
      </div><div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 30 * s, marginTop: 20 * s }}><PriceLine p={p} pal={pal} large /><CTA label={p.cta} pal={pal} scale={s} /></div>
      <div style={{ color: pal.secondary, fontSize: 21 * s, marginTop: 16 * s }}>{p.terms}</div>
    </div>
  </AbsoluteFill>;
};

const MemberPrice: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = Math.min(width / 1920, height / 1080);
  const card = spring({ frame: frame - 10, fps, config: { damping: 17, stiffness: 105 } });
  return <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT }}><div style={{ width: "78%", maxWidth: 1320 * s, padding: `${62 * s}px ${76 * s}px`, borderRadius: 44 * s, border: `1px solid ${pal.accent}70`, background: `linear-gradient(125deg, ${pal.primary}42, ${pal.bg}e8 54%, ${pal.accent}24)`, display: "grid", gridTemplateColumns: "1fr 0.75fr", gap: 60 * s, alignItems: "center", opacity: card, transform: `scale(${interpolate(card, [0, 1], [0.88, 1])})` }}><div><div style={{ display: "inline-block", padding: `${10 * s}px ${18 * s}px`, borderRadius: 99, color: pal.bg, background: pal.accent, fontFamily: MONO, fontSize: 17 * s, fontWeight: 900, letterSpacing: "0.14em" }}>MEMBERS ONLY</div><div style={{ color: pal.text, fontSize: Math.min(86 * s, width * 0.055), lineHeight: 0.95, fontWeight: 950, letterSpacing: "-0.06em", marginTop: 25 * s }}>{p.offer}</div><div style={{ color: pal.secondary, fontSize: 26 * s, marginTop: 22 * s }}>{p.productName} · {p.dates}</div><div style={{ marginTop: 26 * s }}><PriceLine p={p} pal={pal} large /></div><div style={{ marginTop: 30 * s }}><CTA label={p.cta} pal={pal} scale={s} /></div></div><div style={{ display: "grid", placeItems: "center" }}><ProductArt p={p} pal={pal} size={350 * s} angle={3} /></div></div></AbsoluteFill>;
};

const FreeShipping: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const s = Math.min(width / 1920, height / 1080);
  const progress = ease(frame, 10, 74);
  return <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT }}><div style={{ width: "82%", maxWidth: 1450 * s, textAlign: "center" }}><Eyebrow pal={pal}>{p.dates}</Eyebrow><div style={{ color: pal.text, fontSize: Math.min(100 * s, width * 0.065), fontWeight: 950, letterSpacing: "-0.065em", marginTop: 19 * s }}>{p.offer}</div><div style={{ color: pal.secondary, fontSize: 27 * s, marginTop: 15 * s }}>{p.productName} · {p.terms}</div><div style={{ position: "relative", height: 200 * s, margin: `${45 * s}px auto ${28 * s}px` }}><div style={{ position: "absolute", left: "6%", right: "6%", top: "50%", borderTop: `${4 * s}px dashed ${pal.secondary}70` }} /><div style={{ position: "absolute", left: `${6 + progress * 88}%`, top: "50%", transform: "translate(-50%, -50%)", width: 74 * s, height: 74 * s, borderRadius: 18 * s, background: pal.accent, display: "grid", placeItems: "center", boxShadow: `0 0 35px ${pal.accent}66` }}><div style={{ width: 38 * s, height: 27 * s, borderRadius: 7 * s, background: pal.bg }} /></div>{[0, 1, 2].map((i) => <div key={i} style={{ position: "absolute", left: `${6 + i * 44}%`, top: "calc(50% - 22px)", width: 44 * s, height: 44 * s, borderRadius: "50%", border: `3px solid ${pal.primary}`, background: pal.bg }} />)}</div><CTA label={p.cta} pal={pal} scale={s} /></div></AbsoluteFill>;
};

const CouponReveal: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = Math.min(width / 1920, height / 1080);
  const reveal = spring({ frame: frame - 14, fps, config: { damping: 14, stiffness: 110 } });
  const shine = ease(frame, 38, 78);
  return <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT }}><div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at ${20 + shine * 60}% 45%, ${pal.accent}25, transparent 30%)` }} /><div style={{ width: "78%", maxWidth: 1340 * s, textAlign: "center", opacity: reveal, transform: `translateY(${interpolate(reveal, [0, 1], [110 * s, 0])}px)` }}><Eyebrow pal={pal}>{p.dates}</Eyebrow><div style={{ color: pal.text, fontSize: Math.min(92 * s, width * 0.06), fontWeight: 950, letterSpacing: "-0.06em", marginTop: 19 * s }}>{p.offer}</div><div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", height: 190 * s, margin: `${40 * s}px auto ${30 * s}px`, maxWidth: 930 * s, overflow: "hidden", borderRadius: 24 * s, border: `2px dashed ${pal.accent}`, background: `${pal.text}0b` }}><div style={{ position: "absolute", inset: 0, background: `linear-gradient(110deg, transparent ${shine * 100 - 16}%, ${pal.text}25%, transparent ${shine * 100 + 10}%)` }} /><div style={{ color: pal.text, fontFamily: MONO, fontSize: 67 * s, fontWeight: 900, letterSpacing: "0.14em" }}>{p.code}</div><div style={{ position: "absolute", left: -26 * s, width: 52 * s, height: 52 * s, borderRadius: "50%", background: pal.bg }} /><div style={{ position: "absolute", right: -26 * s, width: 52 * s, height: 52 * s, borderRadius: "50%", background: pal.bg }} /></div><div style={{ color: pal.secondary, fontSize: 24 * s }}>{p.terms}</div><div style={{ marginTop: 27 * s }}><CTA label={p.cta} pal={pal} scale={s} /></div></div></AbsoluteFill>;
};

const LastChance: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = Math.min(width / 1920, height / 1080);
  const enter = spring({ frame: frame - 5, fps, config: { damping: 12, stiffness: 135 } });
  const pulse = 1 + Math.sin(frame * 0.22) * 0.025;
  return <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT, background: `linear-gradient(135deg, ${pal.accent}28, ${pal.bg} 48%, ${pal.primary}25)` }}><div style={{ width: "80%", textAlign: "center", opacity: enter, transform: `scale(${interpolate(enter, [0, 1], [0.84, 1]) * pulse})` }}><div style={{ color: pal.accent, fontFamily: MONO, fontSize: 25 * s, fontWeight: 900, letterSpacing: "0.24em" }}>FINAL HOURS</div><div style={{ color: pal.text, fontSize: Math.min(128 * s, width * 0.08), fontWeight: 950, lineHeight: 0.86, letterSpacing: "-0.075em", marginTop: 20 * s }}>{p.offer}</div><div style={{ color: pal.secondary, fontSize: 29 * s, marginTop: 28 * s }}>{p.productName} · {p.terms}</div><div style={{ color: pal.text, fontFamily: MONO, fontSize: 58 * s, fontWeight: 900, marginTop: 32 * s, fontVariantNumeric: "tabular-nums" }}>{p.countdown}</div><div style={{ marginTop: 28 * s }}><CTA label={p.cta} pal={pal} scale={s} /></div></div></AbsoluteFill>;
};

const WeekendSale: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = Math.min(width / 1920, height / 1080);
  const enter = spring({ frame: frame - 10, fps, config: { damping: 16, stiffness: 110 } });
  return <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT }}><div style={{ width: "80%", maxWidth: 1400 * s, display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 70 * s, alignItems: "center", opacity: enter }}><div style={{ position: "relative", width: 390 * s, height: 440 * s, borderRadius: 30 * s, background: `${pal.text}10`, border: `1px solid ${pal.secondary}40`, padding: 30 * s, boxSizing: "border-box", transform: `rotate(${interpolate(enter, [0, 1], [-8, -2])}deg)` }}><div style={{ color: pal.accent, fontFamily: MONO, fontSize: 18 * s, letterSpacing: "0.15em" }}>THIS</div><div style={{ color: pal.text, fontSize: 73 * s, lineHeight: 0.88, fontWeight: 950, marginTop: 20 * s }}>WEEK<br />END</div><div style={{ position: "absolute", left: 30 * s, right: 30 * s, bottom: 40 * s, height: 1, background: `${pal.secondary}50` }} /><div style={{ position: "absolute", left: 30 * s, bottom: 15 * s, color: pal.secondary, fontFamily: MONO, fontSize: 16 * s }}>{p.dates}</div></div><div><Eyebrow pal={pal}>{p.dates}</Eyebrow><div style={{ color: pal.text, fontSize: Math.min(92 * s, width * 0.06), lineHeight: 0.93, fontWeight: 950, letterSpacing: "-0.06em", marginTop: 22 * s }}>{p.offer}</div><div style={{ color: pal.secondary, fontSize: 27 * s, marginTop: 24 * s }}>{p.productName} · {p.terms}</div><div style={{ marginTop: 26 * s }}><PriceLine p={p} pal={pal} large /></div><div style={{ marginTop: 30 * s }}><CTA label={p.cta} pal={pal} scale={s} /></div></div></div></AbsoluteFill>;
};

const SeasonalSale: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = Math.min(width / 1920, height / 1080);
  const enter = spring({ frame: frame - 12, fps, config: { damping: 15, stiffness: 100 } });
  return <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", overflow: "hidden", fontFamily: FONT }}><GrainDots pal={pal} count={18} /><div style={{ width: "82%", maxWidth: 1480 * s, display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 70 * s, alignItems: "center", opacity: enter, transform: `translateY(${interpolate(enter, [0, 1], [90 * s, 0])}px)` }}><div><Eyebrow pal={pal}>{p.dates}</Eyebrow><div style={{ color: pal.text, fontSize: Math.min(112 * s, width * 0.073), lineHeight: 0.88, fontWeight: 950, letterSpacing: "-0.07em", marginTop: 22 * s }}>{p.offer}</div><div style={{ color: pal.secondary, fontSize: 28 * s, marginTop: 25 * s }}>{p.productName} · {p.terms}</div><div style={{ marginTop: 28 * s }}><PriceLine p={p} pal={pal} large /></div><div style={{ marginTop: 32 * s }}><CTA label={p.cta} pal={pal} scale={s} /></div></div><div style={{ display: "grid", placeItems: "center", position: "relative" }}><ProductArt p={p} pal={pal} size={420 * s} angle={4} /><div style={{ position: "absolute", bottom: -15 * s, left: "50%", transform: "translateX(-50%)", padding: `${13 * s}px ${26 * s}px`, borderRadius: 999, color: pal.bg, background: pal.secondary, fontFamily: MONO, fontSize: 18 * s, fontWeight: 900, whiteSpace: "nowrap" }}>{p.code}</div></div></div></AbsoluteFill>;
};

const VARIANTS: Record<SalePromoVariant, React.FC<VariantProps>> = {
  "percent-off": PercentOff,
  "flash-sale": FlashSale,
  "midnight-drop": MidnightDrop,
  "bundle-save": BundleSave,
  "member-price": MemberPrice,
  "free-shipping": FreeShipping,
  "coupon-reveal": CouponReveal,
  "last-chance": LastChance,
  "weekend-sale": WeekendSale,
  "seasonal-sale": SeasonalSale,
};

export const SalePromosTemplate: React.FC<SalePromoProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? PercentOff;
  return <AbsoluteFill style={{ background: pal.bg, overflow: "hidden" }}><AbsoluteFill style={{ background: `radial-gradient(circle at 15% 15%, ${pal.primary}25, transparent 36%), radial-gradient(circle at 90% 85%, ${pal.accent}1f, transparent 38%)` }} /><FadeEdges><Variant p={props} pal={pal} /></FadeEdges></AbsoluteFill>;
};

const familyCast = (component: React.FC<SalePromoProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "sale-promos-percent-off": familyCast(SalePromosTemplate),
  "sale-promos-flash-sale": familyCast(SalePromosTemplate),
  "sale-promos-midnight-drop": familyCast(SalePromosTemplate),
  "sale-promos-bundle-save": familyCast(SalePromosTemplate),
  "sale-promos-member-price": familyCast(SalePromosTemplate),
  "sale-promos-free-shipping": familyCast(SalePromosTemplate),
  "sale-promos-coupon-reveal": familyCast(SalePromosTemplate),
  "sale-promos-last-chance": familyCast(SalePromosTemplate),
  "sale-promos-weekend-sale": familyCast(SalePromosTemplate),
  "sale-promos-seasonal-sale": familyCast(SalePromosTemplate),
};
