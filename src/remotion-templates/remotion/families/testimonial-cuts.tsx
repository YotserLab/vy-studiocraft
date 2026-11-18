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
  clampInterp,
  resolvePalette,
  seededRand,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: testimonial-cuts
 * Ten proof-led testimonial edits. Unlike the static quotes family, every
 * variant moves through a claim, evidence, and/or conversion beat.
 */
type TestimonialCutVariant =
  | "quote-to-face"
  | "proof-metric"
  | "customer-story"
  | "logo-wall"
  | "rating-reveal"
  | "objection-answer"
  | "three-voices"
  | "case-study-cut"
  | "before-after-result"
  | "testimonial-cta";

export interface TestimonialPerson {
  quote: string;
  author: string;
  role?: string;
  company?: string;
  portraitUrl?: string;
  rating?: number;
}

export interface TestimonialCutsProps {
  variant: TestimonialCutVariant;
  quote: string;
  author: string;
  role: string;
  company?: string;
  headline?: string;
  subline?: string;
  metric?: string;
  metricLabel?: string;
  cta?: string;
  objection?: string;
  answer?: string;
  before?: string;
  after?: string;
  result?: string;
  rating?: number;
  paletteName: string;
  portraitUrl?: string;
  portraitUrls?: string[];
  logoUrls?: string[];
  logos?: string[];
  testimonials?: TestimonialPerson[];
}

type VariantProps = { p: TestimonialCutsProps; pal: Palette };
const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';

const people = (p: TestimonialCutsProps): TestimonialPerson[] => [
  { quote: p.quote, author: p.author, role: p.role, company: p.company, portraitUrl: p.portraitUrl, rating: p.rating },
  ...(p.testimonials ?? []),
];

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase() ?? "?").join("") || "?";

const Avatar: React.FC<{ name: string; pal: Palette; size?: number; url?: string; index?: number }> = ({ name, pal, size = 110, url, index = 0 }) => {
  const color = [pal.primary, pal.secondary, pal.accent][index % 3];
  return (
    <div style={{ width: size, height: size, flex: `0 0 ${size}px`, borderRadius: "50%", overflow: "hidden", display: "grid", placeItems: "center", background: `linear-gradient(145deg, ${color}, ${pal.bg})`, border: `3px solid ${color}`, color: pal.text, fontFamily: FONT, fontSize: size * 0.31, fontWeight: 900, boxShadow: `0 18px 48px ${pal.bg}99` }}>
      {url ? <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(name)}
    </div>
  );
};

const Backdrop: React.FC<{ pal: Palette; mode?: "plain" | "split" }> = ({ pal, mode = "plain" }) => (
  <AbsoluteFill style={{ background: pal.bg, overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 14% 18%, ${pal.primary}25, transparent 38%), radial-gradient(circle at 86% 84%, ${pal.accent}1d, transparent 42%)` }} />
    {mode === "split" ? <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, background: `${pal.text}20` }} /> : null}
  </AbsoluteFill>
);

const Label: React.FC<{ children: React.ReactNode; pal: Palette; color?: string }> = ({ children, pal, color }) => (
  <div style={{ color: color ?? pal.secondary, fontFamily: FONT, fontWeight: 850, fontSize: 21, letterSpacing: "0.19em", textTransform: "uppercase" }}>{children}</div>
);

const Byline: React.FC<{ p: TestimonialPerson; pal: Palette; index?: number; compact?: boolean }> = ({ p, pal, index = 0, compact = false }) => (
  <div style={{ display: "flex", alignItems: "center", gap: compact ? 14 : 22, fontFamily: FONT }}>
    <Avatar name={p.author} pal={pal} size={compact ? 58 : 82} url={p.portraitUrl} index={index} />
    <div>
      <div style={{ color: pal.text, fontSize: compact ? 23 : 29, fontWeight: 850 }}>{p.author}</div>
      <div style={{ color: `${pal.text}91`, fontSize: compact ? 17 : 20, marginTop: 5 }}>{[p.role, p.company].filter(Boolean).join(" · ")}</div>
    </div>
  </div>
);

const QuoteMark: React.FC<{ pal: Palette; size?: number }> = ({ pal, size = 180 }) => (
  <div aria-hidden style={{ color: `${pal.primary}55`, fontFamily: SERIF, fontSize: size, lineHeight: 0.6, position: "absolute", left: -14, top: -12 }}>“</div>
);

const QuoteToFace: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { fps, width } = useVideoConfig();
  const left = spring({ frame: frame - 8, fps, config: { damping: 16, stiffness: 110 } });
  const face = spring({ frame: frame - 32, fps, config: { damping: 13, stiffness: 130 } });
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 100, fontFamily: FONT }}>
    <div style={{ display: "flex", alignItems: "center", gap: 92, width: "82%", maxWidth: 1540 }}>
      <div style={{ flex: 1, position: "relative", transform: `translateX(${interpolate(left, [0, 1], [-100, 0])}px)`, opacity: left }}>
        <QuoteMark pal={pal} />
        <Label pal={pal}>{p.headline ?? "Customer story"}</Label>
        <div style={{ color: pal.text, fontFamily: SERIF, fontSize: Math.min(width * 0.044, 76), lineHeight: 1.17, marginTop: 30, letterSpacing: "-0.025em" }}>{p.quote}</div>
        <div style={{ marginTop: 42 }}><Byline p={p} pal={pal} /></div>
      </div>
      <div style={{ width: 360, height: 500, borderRadius: 190, overflow: "hidden", display: "grid", placeItems: "center", background: `linear-gradient(155deg, ${pal.primary}, ${pal.accent})`, transform: `translateY(${interpolate(face, [0, 1], [160, 0])}px) rotate(${interpolate(face, [0, 1], [7, 0])}deg) scale(${interpolate(face, [0, 1], [0.72, 1])})`, opacity: face, boxShadow: `0 36px 90px ${pal.primary}40` }}>
        <Avatar name={p.author} pal={pal} size={260} url={p.portraitUrl} />
      </div>
    </div>
  </AbsoluteFill>;
};

const ProofMetric: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { fps, width } = useVideoConfig();
  const metric = spring({ frame: frame - 10, fps, config: { damping: 14, stiffness: 95 } });
  const quote = clampInterp(frame, [38, 62], [0, 1]);
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: FONT, textAlign: "center", padding: 100 }}>
    <Label pal={pal}>{p.metricLabel ?? "Measured outcome"}</Label>
    <div style={{ color: pal.accent, fontSize: Math.min(width * 0.16, 250), lineHeight: 0.95, fontWeight: 950, letterSpacing: "-0.07em", marginTop: 22, transform: `scale(${interpolate(metric, [0, 1], [0.55, 1])})`, opacity: metric }}>{p.metric ?? "3×"}</div>
    <div style={{ color: pal.text, fontSize: Math.min(width * 0.043, 66), lineHeight: 1.25, maxWidth: 1080, marginTop: 32, opacity: quote, transform: `translateY(${interpolate(quote, [0, 1], [25, 0])}px)` }}>{p.quote}</div>
    <div style={{ marginTop: 38, opacity: quote }}><Byline p={p} pal={pal} compact /></div>
  </AbsoluteFill>;
};

const CustomerStory: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { fps, width } = useVideoConfig();
  const phases = ["Before", "The shift", "After"]; const values = [p.before ?? "Manual work", p.answer ?? "A clearer workflow", p.after ?? p.result ?? "More room to grow"];
  return <AbsoluteFill style={{ justifyContent: "center", padding: 90, fontFamily: FONT }}>
    <div style={{ width: "86%", maxWidth: 1540, margin: "0 auto" }}><Label pal={pal}>{p.headline ?? `${p.company ?? "A customer"} story`}</Label><div style={{ color: pal.text, fontSize: Math.min(width * 0.06, 92), fontWeight: 900, letterSpacing: "-0.05em", marginTop: 18 }}>{p.subline ?? "From friction to momentum."}</div>
      <div style={{ display: "flex", gap: 24, marginTop: 76 }}>{phases.map((phase, i) => { const enter = spring({ frame: frame - 18 - i * 15, fps, config: { damping: 15, stiffness: 105 } }); return <div key={phase} style={{ flex: 1, minHeight: 300, padding: 34, borderRadius: 30, border: `1px solid ${i === 2 ? pal.accent : pal.text}30`, background: i === 2 ? `${pal.accent}16` : `${pal.text}08`, transform: `translateY(${interpolate(enter, [0, 1], [100, 0])}px)`, opacity: enter }}><div style={{ color: i === 2 ? pal.accent : pal.secondary, fontWeight: 850, fontSize: 22, textTransform: "uppercase", letterSpacing: "0.14em" }}>{phase}</div><div style={{ color: pal.text, fontSize: 34, lineHeight: 1.2, fontWeight: 750, marginTop: 35 }}>{values[i]}</div><div style={{ marginTop: 38, height: 5, width: `${34 + i * 28}%`, background: i === 2 ? pal.accent : pal.primary, borderRadius: 9 }} /></div>; })}</div>
      <div style={{ marginTop: 44 }}><Byline p={p} pal={pal} compact /></div>
    </div>
  </AbsoluteFill>;
};

const LogoWall: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const names = (p.logos && p.logos.length ? p.logos : ["Northstar", "Relay", "Fieldwork", "Arc", "Goodwell", "Signal"]);
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: FONT, textAlign: "center", padding: 85 }}>
    <Label pal={pal}>Trusted by teams who care</Label><div style={{ color: pal.text, fontSize: 58, fontWeight: 900, letterSpacing: "-0.04em", marginTop: 22 }}>{p.headline ?? "Proof travels further together."}</div>
    <div style={{ width: "78%", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginTop: 70 }}>{names.slice(0, 6).map((name, i) => { const e = spring({ frame: frame - i * 7 - 10, fps, config: { damping: 16, stiffness: 120 } }); const url = p.logoUrls?.[i]; return <div key={`${name}-${i}`} style={{ height: 105, border: `1px solid ${pal.text}1c`, borderRadius: 20, display: "grid", placeItems: "center", color: pal.text, fontSize: 27, fontWeight: 800, opacity: e, transform: `scale(${interpolate(e, [0, 1], [0.84, 1])})` }}>{url ? <img src={url} alt="" style={{ maxWidth: 150, maxHeight: 55, objectFit: "contain" }} /> : name}</div>; })}</div>
    <div style={{ color: pal.text, fontFamily: SERIF, fontSize: 38, maxWidth: 1000, marginTop: 52, opacity: clampInterp(frame, [58, 82], [0, 1]) }}>“{p.quote}”</div>
    <div style={{ marginTop: 25 }}><Byline p={p} pal={pal} compact /></div>
  </AbsoluteFill>;
};

const RatingReveal: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { fps, width } = useVideoConfig(); const rating = Math.max(1, Math.min(5, Math.round(p.rating ?? 5)));
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: FONT, padding: 90 }}>
    <Label pal={pal}>Customer rating</Label><div style={{ display: "flex", gap: 20, marginTop: 36 }}>{Array.from({ length: 5 }, (_, i) => { const s = spring({ frame: frame - 10 - i * 8, fps, config: { damping: 9, stiffness: 190 } }); return <div key={i} style={{ color: i < rating ? pal.accent : `${pal.text}25`, fontSize: 94, transform: `scale(${interpolate(s, [0, 1], [0.2, 1])}) rotate(${interpolate(s, [0, 1], [-30, 0])}deg)`, opacity: s }}>★</div>; })}</div>
    <div style={{ maxWidth: 1150, color: pal.text, fontFamily: SERIF, fontSize: Math.min(width * 0.048, 78), lineHeight: 1.22, marginTop: 44, opacity: clampInterp(frame, [58, 82], [0, 1]) }}>“{p.quote}”</div><div style={{ marginTop: 36, opacity: clampInterp(frame, [72, 94], [0, 1]) }}><Byline p={p} pal={pal} compact /></div>
  </AbsoluteFill>;
};

const ObjectionAnswer: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { fps, width } = useVideoConfig(); const a = spring({ frame: frame - 8, fps, config: { damping: 17, stiffness: 100 } }); const b = spring({ frame: frame - 38, fps, config: { damping: 17, stiffness: 100 } });
  return <AbsoluteFill style={{ fontFamily: FONT, padding: 80, justifyContent: "center" }}><div style={{ width: "84%", maxWidth: 1500, margin: "0 auto" }}><Label pal={pal}>The question we hear most</Label><div style={{ display: "flex", gap: 30, marginTop: 38 }}><div style={{ flex: 1, padding: 42, minHeight: 310, borderRadius: 28, background: `${pal.primary}13`, border: `1px solid ${pal.primary}46`, transform: `translateX(${interpolate(a, [0, 1], [-90, 0])}px)`, opacity: a }}><div style={{ color: pal.secondary, fontSize: 21, fontWeight: 850, textTransform: "uppercase", letterSpacing: "0.14em" }}>Objection</div><div style={{ color: pal.text, fontSize: Math.min(width * 0.035, 54), fontWeight: 750, lineHeight: 1.2, marginTop: 42 }}>{p.objection ?? "Will this actually fit our team?"}</div></div><div style={{ flex: 1, padding: 42, minHeight: 310, borderRadius: 28, background: `${pal.accent}18`, border: `1px solid ${pal.accent}65`, transform: `translateX(${interpolate(b, [0, 1], [90, 0])}px)`, opacity: b }}><div style={{ color: pal.accent, fontSize: 21, fontWeight: 850, textTransform: "uppercase", letterSpacing: "0.14em" }}>Their answer</div><div style={{ color: pal.text, fontSize: Math.min(width * 0.035, 54), fontWeight: 750, lineHeight: 1.2, marginTop: 42 }}>{p.answer ?? p.quote}</div></div></div><div style={{ marginTop: 38, opacity: b }}><Byline p={p} pal={pal} compact /></div></div></AbsoluteFill>;
};

const ThreeVoices: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const rows = people(p).slice(0, 3);
  return <AbsoluteFill style={{ justifyContent: "center", padding: 80, fontFamily: FONT }}><div style={{ width: "84%", maxWidth: 1500, margin: "0 auto" }}><Label pal={pal}>Three perspectives. One outcome.</Label><div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22, marginTop: 45 }}>{rows.map((item, i) => { const e = spring({ frame: frame - 10 - i * 16, fps, config: { damping: 15, stiffness: 115 } }); return <div key={`${item.author}-${i}`} style={{ padding: 30, minHeight: 380, borderRadius: 26, background: `${pal.text}08`, border: `1px solid ${[pal.primary, pal.secondary, pal.accent][i]}65`, transform: `translateY(${interpolate(e, [0, 1], [90, 0])}px) rotate(${interpolate(e, [0, 1], [i === 1 ? -3 : 3, 0])}deg)`, opacity: e }}><Byline p={item} pal={pal} compact index={i} /><div style={{ color: pal.text, fontFamily: SERIF, fontSize: 28, lineHeight: 1.3, marginTop: 40 }}>“{item.quote}”</div></div>; })}</div></div></AbsoluteFill>;
};

const CaseStudyCut: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const stages = [{ label: "Challenge", text: p.before ?? "A process that could not keep up." }, { label: "Change", text: p.answer ?? "A focused workflow removed the drag." }, { label: "Result", text: p.result ?? p.after ?? "The team moved with confidence." }];
  return <AbsoluteFill style={{ justifyContent: "center", padding: 80, fontFamily: FONT }}><div style={{ width: "84%", maxWidth: 1480, margin: "0 auto" }}><Label pal={pal}>{p.company ?? "Case study"}</Label><div style={{ color: pal.text, fontSize: 72, fontWeight: 950, marginTop: 18, letterSpacing: "-0.05em" }}>{p.headline ?? "A better story, in three beats."}</div><div style={{ marginTop: 62 }}>{stages.map((stage, i) => { const e = spring({ frame: frame - 12 - i * 18, fps, config: { damping: 16, stiffness: 110 } }); return <div key={stage.label} style={{ display: "flex", alignItems: "center", gap: 28, padding: "24px 0", borderBottom: `1px solid ${pal.text}22`, opacity: e, transform: `translateX(${interpolate(e, [0, 1], [100, 0])}px)` }}><div style={{ width: 165, color: i === 2 ? pal.accent : pal.secondary, fontWeight: 850, letterSpacing: "0.13em", textTransform: "uppercase", fontSize: 20 }}>{stage.label}</div><div style={{ color: pal.text, fontSize: 37, fontWeight: 700 }}>{stage.text}</div><div style={{ marginLeft: "auto", color: i === 2 ? pal.accent : pal.primary, fontSize: 38, fontWeight: 900 }}>{i === 2 ? "✓" : "→"}</div></div>; })}</div><div style={{ marginTop: 35 }}><Byline p={p} pal={pal} compact /></div></div></AbsoluteFill>;
};

const BeforeAfterResult: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { fps, width } = useVideoConfig(); const split = clampInterp(frame, [20, 70], [0, 1]); const result = spring({ frame: frame - 75, fps, config: { damping: 14, stiffness: 120 } });
  return <AbsoluteFill style={{ justifyContent: "center", padding: 80, fontFamily: FONT }}><div style={{ width: "84%", maxWidth: 1500, margin: "0 auto" }}><Label pal={pal}>Before → after</Label><div style={{ display: "flex", gap: 26, marginTop: 38 }}><div style={{ flex: 1, minHeight: 350, padding: 38, borderRadius: 28, background: `${pal.primary}12`, border: `1px solid ${pal.primary}46`, opacity: 1 - split * 0.25 }}><div style={{ color: pal.secondary, fontWeight: 850, textTransform: "uppercase", letterSpacing: "0.15em" }}>Before</div><div style={{ color: pal.text, fontSize: Math.min(width * 0.035, 52), fontWeight: 750, lineHeight: 1.2, marginTop: 48 }}>{p.before ?? "Scattered work and slow handoffs"}</div></div><div style={{ flex: 1, minHeight: 350, padding: 38, borderRadius: 28, background: `${pal.accent}18`, border: `1px solid ${pal.accent}70`, transform: `translateY(${interpolate(split, [0, 1], [80, 0])}px)`, opacity: split }}><div style={{ color: pal.accent, fontWeight: 850, textTransform: "uppercase", letterSpacing: "0.15em" }}>After</div><div style={{ color: pal.text, fontSize: Math.min(width * 0.035, 52), fontWeight: 750, lineHeight: 1.2, marginTop: 48 }}>{p.after ?? "One clear path from idea to outcome"}</div></div></div><div style={{ marginTop: 34, display: "flex", alignItems: "center", gap: 25, opacity: result }}><div style={{ color: pal.accent, fontSize: 64, fontWeight: 950 }}>{p.result ?? p.metric ?? "2× faster"}</div><div style={{ color: pal.text, fontSize: 23 }}>{p.metricLabel ?? "reported by the customer"}</div></div></div></AbsoluteFill>;
};

const TestimonialCta: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { fps, width } = useVideoConfig(); const quote = spring({ frame: frame - 8, fps, config: { damping: 16, stiffness: 105 } }); const cta = spring({ frame: frame - 65, fps, config: { damping: 11, stiffness: 150 } });
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center", padding: 90, fontFamily: FONT }}><div style={{ maxWidth: 1350, transform: `translateY(${interpolate(quote, [0, 1], [80, 0])}px)`, opacity: quote }}><Label pal={pal}>{p.headline ?? "What happens next?"}</Label><div style={{ color: pal.text, fontFamily: SERIF, fontSize: Math.min(width * 0.055, 90), lineHeight: 1.16, marginTop: 34 }}>“{p.quote}”</div><div style={{ display: "flex", justifyContent: "center", marginTop: 34 }}><Byline p={p} pal={pal} compact /></div></div><div style={{ marginTop: 52, padding: "21px 42px", borderRadius: 999, background: pal.accent, color: pal.bg, fontSize: 28, fontWeight: 900, transform: `scale(${interpolate(cta, [0, 1], [0.5, 1])})`, opacity: cta, boxShadow: `0 22px 65px ${pal.accent}55` }}>{p.cta ?? "See how it works"} <span style={{ marginLeft: 14 }}>→</span></div></AbsoluteFill>;
};

const VARIANTS: Record<TestimonialCutVariant, React.FC<VariantProps>> = {
  "quote-to-face": QuoteToFace,
  "proof-metric": ProofMetric,
  "customer-story": CustomerStory,
  "logo-wall": LogoWall,
  "rating-reveal": RatingReveal,
  "objection-answer": ObjectionAnswer,
  "three-voices": ThreeVoices,
  "case-study-cut": CaseStudyCut,
  "before-after-result": BeforeAfterResult,
  "testimonial-cta": TestimonialCta,
};

const TestimonialCutsTemplate: React.FC<TestimonialCutsProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? QuoteToFace;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <AbsoluteFill style={{ backgroundColor: pal.bg, color: pal.text }}><Backdrop pal={pal} mode={props.variant === "objection-answer" ? "split" : "plain"} /><FadeEdges inFrames={10} outFrames={14}><div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><Variant p={props} pal={pal} /></div></FadeEdges></AbsoluteFill>;
};

const familyCast = (component: React.FC<TestimonialCutsProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "testimonial-cuts-quote-to-face": familyCast(TestimonialCutsTemplate),
  "testimonial-cuts-proof-metric": familyCast(TestimonialCutsTemplate),
  "testimonial-cuts-customer-story": familyCast(TestimonialCutsTemplate),
  "testimonial-cuts-logo-wall": familyCast(TestimonialCutsTemplate),
  "testimonial-cuts-rating-reveal": familyCast(TestimonialCutsTemplate),
  "testimonial-cuts-objection-answer": familyCast(TestimonialCutsTemplate),
  "testimonial-cuts-three-voices": familyCast(TestimonialCutsTemplate),
  "testimonial-cuts-case-study-cut": familyCast(TestimonialCutsTemplate),
  "testimonial-cuts-before-after-result": familyCast(TestimonialCutsTemplate),
  "testimonial-cuts-testimonial-cta": familyCast(TestimonialCutsTemplate),
};
