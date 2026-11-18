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
  resolvePalette,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: pricing-comparison
 * Ten deterministic pricing stories driven by serializable plan data.
 */

type PricingVariant =
  | "three-tier"
  | "spotlight"
  | "before-after"
  | "feature-checklist"
  | "comparison-table"
  | "billing-toggle"
  | "tier-ladder"
  | "enterprise"
  | "bundle-stack"
  | "competitive-matrix";

export interface PricingPlan {
  name: string;
  price: number | string;
  period: string;
  features: string[];
  highlight?: boolean;
  cta?: string;
}

export interface PricingComparisonProps {
  variant: PricingVariant;
  eyebrow: string;
  headline: string;
  subline: string;
  currency: string;
  paletteName: string;
  plans: PricingPlan[];
  beforePrice?: number;
  afterPrice?: number;
  monthlyLabel?: string;
  yearlyLabel?: string;
}

type VariantProps = { p: PricingComparisonProps; pal: Palette };

const FONT_STACK = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO_STACK = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const clamp = (frame: number, input: [number, number], output: [number, number]) =>
  interpolate(frame, input, output, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const priceNumber = (price: number | string) => {
  if (typeof price === "number") return price;
  const parsed = Number(price.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};
const featureRows = (plans: PricingPlan[], limit = 6) =>
  Array.from(new Set(plans.flatMap((plan) => plan.features))).slice(0, limit);

const Header: React.FC<{ p: PricingComparisonProps; pal: Palette; compact?: boolean }> = ({ p, pal, compact }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 110 } });
  return (
    <div style={{ textAlign: "center", transform: `translateY(${interpolate(enter, [0, 1], [-30, 0])}px)`, opacity: enter }}>
      <div style={{ color: pal.accent, fontFamily: MONO_STACK, fontSize: 22, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
        {p.eyebrow}
      </div>
      <div style={{ color: pal.text, fontFamily: FONT_STACK, fontSize: compact ? 58 : 72, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1.04, marginTop: 14 }}>
        {p.headline}
      </div>
      <div style={{ color: pal.secondary, fontFamily: FONT_STACK, fontSize: compact ? 24 : 27, marginTop: 15 }}>
        {p.subline}
      </div>
    </div>
  );
};

const Price: React.FC<{ plan: PricingPlan; currency: string; pal: Palette; large?: boolean }> = ({ plan, currency, pal, large }) => (
  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", color: pal.text, fontFamily: FONT_STACK }}>
    {priceNumber(plan.price) > 0 && <span style={{ fontSize: large ? 42 : 28, fontWeight: 700, marginRight: 4 }}>{currency}</span>}
    <span style={{ fontSize: large ? 126 : 70, fontWeight: 850, letterSpacing: "-0.07em" }}>{plan.price}</span>
    <span style={{ color: pal.secondary, fontSize: large ? 25 : 19, marginLeft: 10 }}>/ {plan.period}</span>
  </div>
);

const ThreeTier: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "68px 120px" }}>
      <Header p={p} pal={pal} compact />
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 28, marginTop: 54 }}>
        {p.plans.slice(0, 3).map((plan, i) => {
          const s = spring({ frame: frame - 12 - i * 7, fps, config: { damping: 16, stiffness: 130 } });
          const highlighted = plan.highlight || i === 1;
          return (
            <div key={plan.name} style={{ width: 410, minHeight: highlighted ? 530 : 482, borderRadius: 30, padding: "34px 38px", boxSizing: "border-box", background: highlighted ? `linear-gradient(150deg, ${pal.primary}38, ${pal.accent}18)` : `${pal.bg}d9`, border: `${highlighted ? 3 : 1}px solid ${highlighted ? pal.accent : `${pal.secondary}38`}`, boxShadow: highlighted ? `0 28px 80px ${pal.accent}25` : "none", opacity: s, transform: `translateY(${interpolate(s, [0, 1], [95, highlighted ? -12 : 0])}px) scale(${interpolate(s, [0, 1], [0.88, highlighted ? 1.05 : 1])})` }}>
              {highlighted && <div style={{ display: "inline-block", borderRadius: 999, background: pal.accent, color: pal.bg, padding: "8px 15px", fontFamily: MONO_STACK, fontSize: 15, fontWeight: 800, letterSpacing: "0.09em", textTransform: "uppercase" }}>Most popular</div>}
              <div style={{ color: pal.text, fontFamily: FONT_STACK, fontSize: 31, fontWeight: 750, marginTop: highlighted ? 20 : 49 }}>{plan.name}</div>
              <div style={{ margin: "20px 0 24px" }}><Price plan={plan} currency={p.currency} pal={pal} /></div>
              {plan.features.slice(0, 4).map((feature) => <div key={feature} style={{ color: pal.secondary, fontFamily: FONT_STACK, fontSize: 19, marginTop: 15 }}><span style={{ color: pal.accent, marginRight: 12 }}>✓</span>{feature}</div>)}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Spotlight: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const plan = p.plans.find((item) => item.highlight) ?? p.plans[0];
  const target = priceNumber(plan?.price ?? 0);
  const count = Math.round(clamp(frame, [14, 76], [0, target]));
  const ring = spring({ frame: frame - 6, fps, config: { damping: 14, stiffness: 95 } });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ position: "absolute", width: 760, height: 760, borderRadius: "50%", border: `2px solid ${pal.accent}55`, boxShadow: `0 0 130px ${pal.primary}28 inset, 0 0 100px ${pal.accent}18`, transform: `scale(${interpolate(ring, [0, 1], [0.25, 1])})`, opacity: ring }} />
      <div style={{ position: "relative", textAlign: "center" }}>
        <div style={{ color: pal.accent, fontFamily: MONO_STACK, fontSize: 22, letterSpacing: "0.18em", textTransform: "uppercase" }}>{plan?.name ?? "Plan"}</div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", color: pal.text, fontFamily: FONT_STACK, marginTop: 12 }}>
          <span style={{ fontSize: 54, fontWeight: 700, marginTop: 24 }}>{p.currency}</span>
          <span style={{ fontSize: 230, fontWeight: 900, letterSpacing: "-0.09em", lineHeight: 0.95 }}>{count}</span>
        </div>
        <div style={{ color: pal.secondary, fontFamily: FONT_STACK, fontSize: 28, marginTop: 20 }}>/ {plan?.period} · {p.subline}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 34, marginTop: 44 }}>
          {(plan?.features ?? []).slice(0, 3).map((feature, i) => <div key={feature} style={{ color: pal.text, fontFamily: FONT_STACK, fontSize: 19, opacity: clamp(frame, [64 + i * 6, 74 + i * 6], [0, 1]) }}><span style={{ color: pal.accent }}>●</span> {feature}</div>)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const BeforeAfter: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const plan = p.plans.find((item) => item.highlight) ?? p.plans[0];
  const before = p.beforePrice ?? Math.round(priceNumber(plan?.price ?? 29) * 1.7);
  const after = p.afterPrice ?? priceNumber(plan?.price ?? 29);
  const slash = spring({ frame: frame - 42, fps, config: { damping: 16, stiffness: 150 } });
  const reveal = spring({ frame: frame - 52, fps, config: { damping: 11, stiffness: 170 } });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 90 }}>
      <Header p={p} pal={pal} compact />
      <div style={{ display: "flex", alignItems: "center", gap: 94, marginTop: 82 }}>
        <div style={{ position: "relative", color: `${pal.text}78`, fontFamily: FONT_STACK, fontSize: 142, fontWeight: 800, letterSpacing: "-0.06em" }}>
          {p.currency}{before}
          <div style={{ position: "absolute", left: -22, right: -22, top: "52%", height: 8, borderRadius: 8, background: pal.accent, transformOrigin: "left", transform: `rotate(-10deg) scaleX(${slash})` }} />
          <div style={{ textAlign: "center", fontSize: 20, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 15 }}>Before</div>
        </div>
        <div style={{ color: pal.accent, fontFamily: FONT_STACK, fontSize: 74, fontWeight: 300, opacity: clamp(frame, [40, 54], [0, 1]) }}>→</div>
        <div style={{ color: pal.text, fontFamily: FONT_STACK, transform: `scale(${interpolate(reveal, [0, 1], [0.35, 1])})`, opacity: reveal }}>
          <div style={{ fontSize: 190, fontWeight: 900, letterSpacing: "-0.08em", textShadow: `0 20px 70px ${pal.accent}30` }}>{p.currency}{after}</div>
          <div style={{ color: pal.accent, textAlign: "center", fontSize: 22, fontWeight: 750, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 8 }}>Now · Save {p.currency}{Math.max(0, before - after)}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const FeatureChecklist: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const plan = p.plans.find((item) => item.highlight) ?? p.plans[0];
  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "78px 210px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 100, alignItems: "center" }}>
        <div><Header p={p} pal={pal} compact /><div style={{ color: pal.text, fontFamily: FONT_STACK, marginTop: 50, textAlign: "center" }}><Price plan={plan} currency={p.currency} pal={pal} large /></div></div>
        <div style={{ borderRadius: 32, border: `1px solid ${pal.secondary}38`, background: `${pal.bg}c8`, padding: "36px 46px" }}>
          <div style={{ color: pal.secondary, fontFamily: MONO_STACK, fontSize: 17, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 17 }}>Everything included</div>
          {plan.features.slice(0, 6).map((feature, i) => {
            const s = spring({ frame: frame - 16 - i * 9, fps, config: { damping: 15, stiffness: 140 } });
            return <div key={feature} style={{ display: "flex", alignItems: "center", gap: 20, borderTop: `1px solid ${pal.secondary}28`, padding: "19px 0", opacity: s, transform: `translateX(${interpolate(s, [0, 1], [65, 0])}px)` }}><div style={{ width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", background: pal.accent, color: pal.bg, fontFamily: FONT_STACK, fontSize: 20, fontWeight: 900, transform: `scale(${s})` }}>✓</div><div style={{ color: pal.text, fontFamily: FONT_STACK, fontSize: 25, fontWeight: 600 }}>{feature}</div></div>;
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ComparisonTable: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const rows = featureRows(p.plans, 5);
  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "60px 150px" }}>
      <Header p={p} pal={pal} compact />
      <div style={{ marginTop: 46, borderRadius: 26, overflow: "hidden", border: `1px solid ${pal.secondary}38`, background: `${pal.bg}d6`, fontFamily: FONT_STACK }}>
        <div style={{ display: "grid", gridTemplateColumns: `1.35fr repeat(${Math.min(3, p.plans.length)}, 1fr)`, background: `${pal.primary}20` }}>
          <div style={{ padding: "22px 30px", color: pal.secondary, fontSize: 18, textTransform: "uppercase", letterSpacing: "0.12em" }}>Compare plans</div>
          {p.plans.slice(0, 3).map((plan) => <div key={plan.name} style={{ padding: "22px 20px", textAlign: "center", color: plan.highlight ? pal.accent : pal.text, fontSize: 24, fontWeight: 750 }}>{plan.name}</div>)}
        </div>
        {rows.map((feature, i) => {
          const wipe = clamp(frame, [18 + i * 9, 38 + i * 9], [0, 100]);
          return <div key={feature} style={{ position: "relative", display: "grid", gridTemplateColumns: `1.35fr repeat(${Math.min(3, p.plans.length)}, 1fr)`, borderTop: `1px solid ${pal.secondary}28`, minHeight: 76, clipPath: `inset(0 ${100 - wipe}% 0 0)` }}><div style={{ padding: "23px 30px", color: pal.text, fontSize: 20 }}>{feature}</div>{p.plans.slice(0, 3).map((plan) => <div key={plan.name} style={{ display: "grid", placeItems: "center", color: plan.features.includes(feature) ? pal.accent : `${pal.secondary}58`, fontSize: 25, fontWeight: 800 }}>{plan.features.includes(feature) ? "✓" : "—"}</div>)}</div>;
        })}
      </div>
    </AbsoluteFill>
  );
};

const BillingToggle: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const yearly = spring({ frame: frame - 48, fps, config: { damping: 15, stiffness: 120 } });
  const plan = p.plans.find((item) => item.highlight) ?? p.plans[0];
  const monthly = priceNumber(plan?.price ?? 0);
  const annualMonthly = Math.round(monthly * 0.8);
  const shown = Math.round(interpolate(yearly, [0, 1], [monthly, annualMonthly]));
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <Header p={p} pal={pal} compact />
      <div style={{ position: "relative", width: 520, height: 82, borderRadius: 999, padding: 7, boxSizing: "border-box", marginTop: 48, background: `${pal.secondary}25`, border: `1px solid ${pal.secondary}40`, fontFamily: FONT_STACK }}>
        <div style={{ position: "absolute", top: 7, left: 7, width: 250, height: 66, borderRadius: 999, background: pal.accent, transform: `translateX(${interpolate(yearly, [0, 1], [0, 256])}px)`, boxShadow: `0 10px 36px ${pal.accent}32` }} />
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr", height: "100%", alignItems: "center", textAlign: "center", color: pal.text, fontSize: 21, fontWeight: 700 }}><div>{p.monthlyLabel ?? "Monthly"}</div><div>{p.yearlyLabel ?? "Yearly"}</div></div>
      </div>
      <div style={{ color: pal.text, fontFamily: FONT_STACK, display: "flex", alignItems: "baseline", marginTop: 46 }}><span style={{ fontSize: 48, fontWeight: 700 }}>{p.currency}</span><span style={{ fontSize: 180, lineHeight: 1, fontWeight: 900, letterSpacing: "-0.08em" }}>{shown}</span><span style={{ color: pal.secondary, fontSize: 26, marginLeft: 14 }}>/ month</span></div>
      <div style={{ color: pal.accent, fontFamily: MONO_STACK, fontSize: 21, letterSpacing: "0.1em", textTransform: "uppercase", opacity: yearly }}>Two months free · billed yearly</div>
    </AbsoluteFill>
  );
};

const TierLadder: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "64px 130px 70px", justifyContent: "center" }}>
      <Header p={p} pal={pal} compact />
      <div style={{ height: 570, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 30, marginTop: 34 }}>
        {p.plans.slice(0, 4).map((plan, i) => {
          const s = spring({ frame: frame - 14 - i * 10, fps, config: { damping: 17, stiffness: 125 } });
          const height = 270 + i * 76;
          return <div key={plan.name} style={{ width: 310, height, transformOrigin: "bottom", transform: `scaleY(${s})`, borderRadius: "26px 26px 6px 6px", padding: "31px 28px", boxSizing: "border-box", background: `linear-gradient(180deg, ${i === p.plans.length - 1 ? pal.accent : pal.primary}${i === p.plans.length - 1 ? "55" : "25"}, ${pal.bg}e8)`, border: `1px solid ${i === p.plans.length - 1 ? pal.accent : `${pal.secondary}42`}`, fontFamily: FONT_STACK, boxShadow: `0 -18px 55px ${pal.primary}12` }}><div style={{ color: pal.secondary, fontFamily: MONO_STACK, fontSize: 16, letterSpacing: "0.12em" }}>LEVEL 0{i + 1}</div><div style={{ color: pal.text, fontSize: 31, fontWeight: 800, marginTop: 14 }}>{plan.name}</div><div style={{ color: pal.text, fontSize: 63, fontWeight: 900, letterSpacing: "-0.06em", marginTop: 16 }}>{p.currency}{plan.price}</div><div style={{ color: pal.secondary, fontSize: 18, marginTop: 8 }}>/ {plan.period}</div>{plan.features.slice(0, 2).map((feature) => <div key={feature} style={{ color: pal.text, fontSize: 17, marginTop: 16 }}><span style={{ color: pal.accent }}>+</span> {feature}</div>)}</div>;
        })}
      </div>
    </AbsoluteFill>
  );
};

const Enterprise: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const plan = p.plans.find((item) => item.name.toLowerCase().includes("enterprise")) ?? p.plans[p.plans.length - 1];
  const enter = spring({ frame: frame - 10, fps, config: { damping: 18, stiffness: 100 } });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 120 }}>
      <div style={{ width: 1380, minHeight: 650, boxSizing: "border-box", borderRadius: 42, border: `1px solid ${pal.accent}70`, background: `linear-gradient(135deg, ${pal.primary}30, ${pal.bg}e8 52%, ${pal.accent}18)`, padding: "76px 86px", display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 90, alignItems: "center", opacity: enter, transform: `scale(${interpolate(enter, [0, 1], [0.9, 1])})`, boxShadow: `0 38px 120px ${pal.bg}` }}>
        <div><div style={{ color: pal.accent, fontFamily: MONO_STACK, fontSize: 20, letterSpacing: "0.18em", textTransform: "uppercase" }}>{p.eyebrow}</div><div style={{ color: pal.text, fontFamily: FONT_STACK, fontSize: 77, fontWeight: 850, letterSpacing: "-0.05em", lineHeight: 1.02, marginTop: 22 }}>{p.headline}</div><div style={{ color: pal.secondary, fontFamily: FONT_STACK, fontSize: 26, lineHeight: 1.45, marginTop: 27 }}>{p.subline}</div><div style={{ display: "inline-block", marginTop: 42, padding: "20px 34px", borderRadius: 14, background: pal.accent, color: pal.bg, fontFamily: FONT_STACK, fontSize: 22, fontWeight: 800 }}>{plan?.cta ?? "Contact sales"} →</div></div>
        <div style={{ borderLeft: `1px solid ${pal.secondary}45`, paddingLeft: 68 }}><div style={{ color: pal.text, fontFamily: FONT_STACK, fontSize: 37, fontWeight: 800, marginBottom: 27 }}>{plan?.name ?? "Enterprise"}</div>{(plan?.features ?? []).slice(0, 5).map((feature, i) => <div key={feature} style={{ color: pal.text, fontFamily: FONT_STACK, fontSize: 21, marginTop: 22, opacity: clamp(frame, [36 + i * 7, 48 + i * 7], [0, 1]), transform: `translateX(${clamp(frame, [36 + i * 7, 48 + i * 7], [22, 0])}px)` }}><span style={{ color: pal.accent, marginRight: 14 }}>◆</span>{feature}</div>)}</div>
      </div>
    </AbsoluteFill>
  );
};

const BundleStack: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const plans = p.plans.slice(0, 3);
  const total = plans.reduce((sum, plan) => sum + priceNumber(plan.price), 0);
  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "70px 160px" }}>
      <Header p={p} pal={pal} compact />
      <div style={{ position: "relative", height: 550, marginTop: 35 }}>
        {plans.map((plan, i) => {
          const s = spring({ frame: frame - 15 - i * 10, fps, config: { damping: 12, stiffness: 145 } });
          const rotation = (i - 1) * 5;
          return <div key={plan.name} style={{ position: "absolute", width: 740, height: 335, left: `calc(50% - 370px + ${(i - 1) * 280}px)`, top: 40 + i * 55, zIndex: i, borderRadius: 30, boxSizing: "border-box", padding: "38px 44px", background: `linear-gradient(145deg, ${i === 2 ? pal.accent : pal.primary}${i === 2 ? "48" : "30"}, ${pal.bg}f2)`, border: `1px solid ${i === 2 ? pal.accent : `${pal.secondary}55`}`, boxShadow: `0 28px 70px ${pal.bg}cc`, opacity: s, transform: `translateY(${interpolate(s, [0, 1], [-170, 0])}px) rotate(${interpolate(s, [0, 1], [rotation * 2, rotation])}deg) scale(${interpolate(s, [0, 1], [0.7, 1])})`, fontFamily: FONT_STACK }}><div style={{ color: pal.accent, fontFamily: MONO_STACK, fontSize: 17, letterSpacing: "0.14em" }}>BUNDLE 0{i + 1}</div><div style={{ color: pal.text, fontSize: 40, fontWeight: 800, marginTop: 17 }}>{plan.name}</div><div style={{ color: pal.secondary, fontSize: 21, marginTop: 16 }}>{plan.features.slice(0, 2).join(" · ")}</div><div style={{ position: "absolute", right: 42, bottom: 35, color: pal.text, fontSize: 51, fontWeight: 900 }}>{p.currency}{plan.price}</div></div>;
        })}
        <div style={{ position: "absolute", right: 30, bottom: 20, color: pal.text, fontFamily: FONT_STACK, textAlign: "right", opacity: clamp(frame, [72, 90], [0, 1]) }}><div style={{ color: pal.accent, fontSize: 19, fontWeight: 750, letterSpacing: "0.12em", textTransform: "uppercase" }}>One bundle · one bill</div><div style={{ fontSize: 63, fontWeight: 900, letterSpacing: "-0.05em", marginTop: 8 }}>{p.currency}{Math.round(total * 0.75)}<span style={{ color: pal.secondary, fontSize: 21, marginLeft: 8 }}>/ mo</span></div></div>
      </div>
    </AbsoluteFill>
  );
};

const CompetitiveMatrix: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rows = featureRows(p.plans, 6);
  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "58px 150px" }}>
      <Header p={p} pal={pal} compact />
      <div style={{ display: "grid", gridTemplateColumns: `1.45fr repeat(${Math.min(4, p.plans.length)}, 1fr)`, marginTop: 38, borderRadius: 28, overflow: "hidden", border: `1px solid ${pal.secondary}3d`, background: `${pal.bg}d8`, fontFamily: FONT_STACK }}>
        <div style={{ padding: "23px 28px", color: pal.secondary, fontFamily: MONO_STACK, fontSize: 16, letterSpacing: "0.12em" }}>CAPABILITIES</div>
        {p.plans.slice(0, 4).map((plan) => <div key={plan.name} style={{ padding: "20px 14px", color: plan.highlight ? pal.accent : pal.text, textAlign: "center", fontSize: 20, fontWeight: 750, background: plan.highlight ? `${pal.accent}12` : undefined }}>{plan.name}</div>)}
        {rows.map((feature, ri) => <React.Fragment key={feature}><div style={{ padding: "18px 28px", color: pal.text, fontSize: 19, borderTop: `1px solid ${pal.secondary}25` }}>{feature}</div>{p.plans.slice(0, 4).map((plan, ci) => {
          const has = plan.features.includes(feature);
          const dot = spring({ frame: frame - 18 - ri * 6 - ci * 2, fps, config: { damping: 12, stiffness: 170 } });
          return <div key={plan.name} style={{ display: "grid", placeItems: "center", minHeight: 62, borderTop: `1px solid ${pal.secondary}25`, background: plan.highlight ? `${pal.accent}0d` : undefined }}><div style={{ width: has ? 22 : 8, height: has ? 22 : 8, borderRadius: "50%", background: has ? (plan.highlight ? pal.accent : pal.primary) : `${pal.secondary}40`, boxShadow: has && plan.highlight ? `0 0 24px ${pal.accent}` : undefined, transform: `scale(${dot})` }} /></div>;
        })}</React.Fragment>)}
      </div>
    </AbsoluteFill>
  );
};

const VARIANTS: Record<PricingVariant, React.FC<VariantProps>> = {
  "three-tier": ThreeTier,
  spotlight: Spotlight,
  "before-after": BeforeAfter,
  "feature-checklist": FeatureChecklist,
  "comparison-table": ComparisonTable,
  "billing-toggle": BillingToggle,
  "tier-ladder": TierLadder,
  enterprise: Enterprise,
  "bundle-stack": BundleStack,
  "competitive-matrix": CompetitiveMatrix,
};

export const PricingComparisonTemplate: React.FC<PricingComparisonProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? ThreeTier;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 18% 8%, ${pal.primary}25, transparent 34%), radial-gradient(circle at 88% 92%, ${pal.accent}18, transparent 38%)` }} />
      <FadeEdges>
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}>
          <Variant p={props} pal={pal} />
        </div>
      </FadeEdges>
    </AbsoluteFill>
  );
};

const familyCast = (component: React.FC<PricingComparisonProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "pricing-three-tier-highlight": familyCast(PricingComparisonTemplate),
  "pricing-single-plan-spotlight": familyCast(PricingComparisonTemplate),
  "pricing-before-after-slash": familyCast(PricingComparisonTemplate),
  "pricing-feature-checklist-reveal": familyCast(PricingComparisonTemplate),
  "pricing-comparison-table-wipes": familyCast(PricingComparisonTemplate),
  "pricing-monthly-yearly-toggle": familyCast(PricingComparisonTemplate),
  "pricing-tier-ladder-steps": familyCast(PricingComparisonTemplate),
  "pricing-enterprise-contact": familyCast(PricingComparisonTemplate),
  "pricing-bundle-stack-pop": familyCast(PricingComparisonTemplate),
  "pricing-competitive-matrix-dots": familyCast(PricingComparisonTemplate),
};
