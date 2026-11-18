import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  FadeEdges,
  GradientMeshBackground,
  NoiseGrainOverlay,
  clampInterp,
  resolvePalette,
  seededRand,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: creator-ugc
 * Creator-first social video layouts with deterministic procedural media cards.
 * Every composition is usable without footage; clipUrls/productImage can replace
 * the placeholders when an agent supplies real media.
 */
type CreatorUgcVariant =
  | "talking-head-frame"
  | "caption-burst"
  | "jump-cut-stack"
  | "product-in-hand"
  | "duet-layout"
  | "green-screen-card"
  | "comment-reply"
  | "voiceover-broll"
  | "creator-testimonial"
  | "raw-to-polished";

export interface CreatorUgcProps {
  variant: CreatorUgcVariant;
  creatorName: string;
  headline: string;
  subline: string;
  handle: string;
  captions: string[];
  comments: string[];
  clipUrls?: string[];
  productImage?: string;
  frameStyle: "rounded" | "polaroid" | "bordered" | "clean";
  cuts: number[];
  paletteName: string;
}

type VariantProps = { p: CreatorUgcProps; pal: Palette };
const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const captions = (p: CreatorUgcProps): string[] => p.captions?.length ? p.captions : [p.headline, p.subline, "Save this for later"];
const cuts = (p: CreatorUgcProps): number[] => p.cuts?.length ? p.cuts : [0, 28, 56, 84];

const CreatorBadge: React.FC<{ p: CreatorUgcProps; pal: Palette; dark?: boolean }> = ({ p, pal, dark = false }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: FONT, color: dark ? pal.bg : pal.text }}>
    <div style={{ width: 54, height: 54, borderRadius: "50%", display: "grid", placeItems: "center", background: `linear-gradient(140deg, ${pal.primary}, ${pal.accent})`, color: pal.text, fontSize: 24, fontWeight: 900, boxShadow: `0 7px 20px ${pal.bg}88` }}>{p.creatorName.slice(0, 1).toUpperCase()}</div>
    <div><div style={{ fontSize: 22, fontWeight: 850 }}>{p.creatorName}</div><div style={{ marginTop: 3, opacity: 0.62, fontSize: 16 }}>{p.handle}</div></div>
  </div>
);

const PlaceholderMedia: React.FC<{ p: CreatorUgcProps; pal: Palette; index?: number; style?: React.CSSProperties; label?: string }> = ({ p, pal, index = 0, style, label }) => {
  const image = p.clipUrls?.[index];
  const text = label ?? (index % 2 ? "B-ROLL" : "CREATOR CLIP");
  return (
    <div style={{ position: "relative", overflow: "hidden", background: `linear-gradient(${130 + index * 17}deg, ${pal.primary}dd, ${pal.bg} 56%, ${pal.accent}bb)`, ...style }}>
      {image ? <Img src={image} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at ${28 + index * 15}% ${22 + index * 9}%, ${pal.secondary}aa, transparent 32%)` }} />
        <div style={{ position: "absolute", left: "18%", top: "13%", width: "42%", height: "42%", borderRadius: "50%", background: `${pal.text}24`, border: `2px solid ${pal.text}38` }} />
        <div style={{ position: "absolute", left: "10%", right: "10%", bottom: "12%", height: "25%", borderRadius: "45% 45% 12% 12%", background: `${pal.bg}65`, border: `1px solid ${pal.text}2f` }} />
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: `${pal.text}ba`, font: `800 18px ${MONO}`, letterSpacing: "0.2em" }}>{text}</div>
      </>}
    </div>
  );
};

const Caption: React.FC<{ children: React.ReactNode; pal: Palette; size?: number; dark?: boolean }> = ({ children, pal, size = 35, dark = false }) => (
  <div style={{ display: "inline-block", maxWidth: "100%", padding: "10px 18px", borderRadius: 12, color: dark ? pal.bg : pal.text, background: dark ? pal.text : `${pal.bg}cc`, fontFamily: FONT, fontSize: size, lineHeight: 1.08, fontWeight: 900, letterSpacing: "-0.03em", boxShadow: `0 7px 24px ${pal.bg}55` }}>{children}</div>
);

const FrameStyle: React.CSSProperties = { borderRadius: 24, border: "1px solid #ffffff30", boxShadow: "0 28px 75px #0008" };
const frameFor = (style: CreatorUgcProps["frameStyle"]): React.CSSProperties => style === "clean" ? {} : style === "bordered" ? { border: "3px solid #ffffffcc", borderRadius: 14 } : style === "polaroid" ? { border: "16px solid #fff", borderBottomWidth: 62, borderRadius: 2, boxShadow: "0 28px 70px #0009" } : FrameStyle;

const TalkingHead: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { fps, width, height } = useVideoConfig();
  const enter = spring({ frame: frame - 7, fps, config: { damping: 16, stiffness: 115 } });
  const cap = captions(p)[Math.min(captions(p).length - 1, Math.floor(Math.max(0, frame - 30) / 24))];
  const portrait = height > width; const mediaW = portrait ? width * .78 : width * .43; const mediaH = portrait ? height * .62 : height * .82;
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
    <div style={{ position: "absolute", left: portrait ? 40 : 100, top: portrait ? 65 : 100 }}><CreatorBadge p={p} pal={pal} /></div>
    <div style={{ display: "flex", alignItems: "center", gap: portrait ? 0 : 90, flexDirection: portrait ? "column" : "row", transform: `translateY(${interpolate(enter, [0, 1], [160, 0])}px)`, opacity: enter }}>
      <div style={{ width: mediaW, height: mediaH, ...frameFor(p.frameStyle) }}><PlaceholderMedia p={p} pal={pal} style={{ width: "100%", height: "100%" }} /></div>
      <div style={{ width: portrait ? width * .82 : width * .34, marginTop: portrait ? 30 : 0 }}><div style={{ color: pal.accent, fontSize: 18, letterSpacing: "0.2em", fontWeight: 850 }}>REAL TALK</div><div style={{ color: pal.text, fontSize: portrait ? 51 : 68, lineHeight: .96, fontWeight: 950, marginTop: 15 }}>{p.headline}</div><div style={{ color: `${pal.text}aa`, fontSize: 25, lineHeight: 1.35, marginTop: 20 }}>{p.subline}</div><div style={{ marginTop: 30 }}><Caption pal={pal} size={portrait ? 26 : 31}>{cap}</Caption></div></div>
    </div>
  </AbsoluteFill>;
};

const CaptionBurst: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig(); const words = captions(p).flatMap((x) => x.split(" ")).slice(0, 12); const portrait = height > width;
  return <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT, padding: portrait ? "0 70px" : "0 170px" }}>
    <PlaceholderMedia p={p} pal={pal} index={0} style={{ position: "absolute", inset: portrait ? "8% 13%" : "9% 21%", opacity: .5, ...frameFor(p.frameStyle) }} />
    <div style={{ position: "relative", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 13, maxWidth: portrait ? width * .78 : width * .67, transform: `rotate(${Math.sin(frame * .035) * 1.4}deg)` }}>
      {words.map((word, i) => { const t = clampInterp(frame, [8 + i * 4, 18 + i * 4], [0, 1]); return <div key={`${word}-${i}`} style={{ opacity: t, transform: `translateY(${interpolate(t, [0, 1], [45, 0])}px) scale(${interpolate(t, [0, 1], [.72, 1])})` }}><Caption pal={pal} size={portrait ? 39 : 53} dark={i % 4 === 1}>{word}</Caption></div>; })}
    </div>
    <div style={{ position: "absolute", bottom: portrait ? 130 : 78, left: portrait ? 50 : 100 }}><CreatorBadge p={p} pal={pal} /></div>
  </AbsoluteFill>;
};

const JumpCutStack: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig(); const portrait = height > width; const cards = [0, 1, 2];
  return <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT }}>
    {cards.map((i) => { const enter = spring({ frame: frame - 10 - i * 10, fps: 30, config: { damping: 13, stiffness: 120 } }); return <div key={i} style={{ position: "absolute", width: portrait ? width * .64 : width * .28, height: portrait ? height * .6 : height * .77, transform: `translate(${(i - 1) * (portrait ? 0 : 220) + interpolate(enter, [0, 1], [0, (i - 1) * 35])}px, ${interpolate(enter, [0, 1], [height * .5, (i - 1) * 20])}px) rotate(${(i - 1) * 5}deg) scale(${interpolate(enter, [0, 1], [.75, 1])})`, opacity: enter, zIndex: i }}><PlaceholderMedia p={p} pal={pal} index={i} style={{ width: "100%", height: "100%", ...frameFor(p.frameStyle) }} /><div style={{ position: "absolute", bottom: 30, left: 24, right: 24 }}><Caption pal={pal} size={portrait ? 26 : 29}>{captions(p)[i % captions(p).length]}</Caption></div></div>; })}
    <div style={{ position: "absolute", top: portrait ? 80 : 80, left: portrait ? 40 : 100 }}><CreatorBadge p={p} pal={pal} /></div>
    <div style={{ position: "absolute", right: portrait ? 36 : 100, bottom: portrait ? 90 : 70, color: pal.accent, font: `800 19px ${MONO}`, letterSpacing: "0.15em" }}>CUT {String(Math.min(3, Math.floor(frame / 28) + 1)).padStart(2, "0")}</div>
  </AbsoluteFill>;
};

const ProductInHand: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig(); const enter = spring({ frame: frame - 9, fps: 30, config: { damping: 14, stiffness: 100 } }); const portrait = height > width;
  return <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT }}>
    <div style={{ position: "absolute", width: portrait ? "90%" : "73%", height: portrait ? "62%" : "73%", display: "flex", flexDirection: portrait ? "column" : "row", alignItems: "center", justifyContent: "space-around", gap: 35, transform: `translateY(${interpolate(enter, [0, 1], [120, 0])}px)`, opacity: enter }}>
      <div style={{ width: portrait ? "88%" : "43%", height: portrait ? "62%" : "82%", ...frameFor(p.frameStyle) }}><PlaceholderMedia p={p} pal={pal} index={0} style={{ width: "100%", height: "100%" }} /><div style={{ position: "absolute", left: "8%", right: "8%", bottom: "8%" }}><Caption pal={pal} size={portrait ? 24 : 30}>{p.headline}</Caption></div></div>
      <div style={{ position: "relative", width: portrait ? "62%" : "31%", height: portrait ? "30%" : "55%", borderRadius: "50%", background: p.productImage ? pal.bg : `linear-gradient(145deg, ${pal.accent}, ${pal.primary})`, border: `5px solid ${pal.text}`, boxShadow: `0 35px 80px ${pal.bg}`, overflow: "hidden", transform: `rotate(${interpolate(enter, [0, 1], [-18, 5])}deg) scale(${interpolate(enter, [0, 1], [.45, 1])})` }}>{p.productImage ? <Img src={p.productImage} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <><div style={{ position: "absolute", inset: "15%", borderRadius: "50%", background: `${pal.text}18` }} /><div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: pal.text, fontSize: 20, fontWeight: 900, letterSpacing: ".13em", textAlign: "center" }}>{p.headline.slice(0, 16).toUpperCase()}</div></>}</div>
    </div>
    <div style={{ position: "absolute", left: portrait ? 42 : 110, top: portrait ? 70 : 94 }}><CreatorBadge p={p} pal={pal} /></div>
    <div style={{ position: "absolute", right: portrait ? 42 : 120, bottom: portrait ? 95 : 74, color: pal.accent, font: `850 22px ${FONT}` }}>TRY IT WITH ME →</div>
  </AbsoluteFill>;
};

const DuetLayout: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig(); const portrait = height > width; const split = clampInterp(frame, [6, 26], [0, 1]);
  return <AbsoluteFill style={{ padding: portrait ? 60 : 75, boxSizing: "border-box", fontFamily: FONT }}>
    <div style={{ display: "flex", height: "100%", gap: 14, flexDirection: portrait ? "column" : "row", transform: `scale(${interpolate(split, [0, 1], [.92, 1])})`, opacity: split }}>
      {[0, 1].map((i) => <div key={i} style={{ flex: 1, position: "relative", overflow: "hidden", ...frameFor(p.frameStyle) }}><PlaceholderMedia p={p} pal={pal} index={i} style={{ width: "100%", height: "100%" }} /><div style={{ position: "absolute", top: 22, left: 22 }}><CreatorBadge p={p} pal={pal} /></div><div style={{ position: "absolute", bottom: 34, left: 26, right: 26 }}><Caption pal={pal} size={portrait ? 28 : 33} dark={i === 1}>{i === 0 ? "ME" : "REACTING"}</Caption></div></div>)}
    </div>
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 68, height: 68, borderRadius: "50%", display: "grid", placeItems: "center", color: pal.bg, background: pal.text, fontWeight: 950, fontSize: 20 }}>VS</div>
  </AbsoluteFill>;
};

const GreenScreenCard: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig(); const reveal = spring({ frame: frame - 8, fps: 30, config: { damping: 15, stiffness: 90 } }); const portrait = height > width;
  return <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT }}>
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${pal.secondary} 0%, ${pal.primary} 48%, ${pal.accent} 100%)` }} />
    <div style={{ position: "absolute", left: portrait ? "8%" : "13%", top: portrait ? "20%" : "15%", width: portrait ? "84%" : "74%", height: portrait ? "45%" : "66%", background: `${pal.bg}d4`, border: `3px solid ${pal.text}55`, transform: `perspective(1000px) rotateY(${interpolate(reveal, [0, 1], [18, -5])}deg) rotateZ(-2deg) scale(${interpolate(reveal, [0, 1], [.8, 1])})`, opacity: reveal, ...frameFor(p.frameStyle) }}><div style={{ position: "absolute", inset: 20, border: `2px dashed ${pal.accent}88`, display: "grid", placeItems: "center", color: pal.text, fontSize: portrait ? 35 : 55, fontWeight: 950, textAlign: "center" }}>{p.subline}</div></div>
    <div style={{ position: "absolute", right: portrait ? "12%" : "17%", bottom: portrait ? "16%" : "13%", width: portrait ? "48%" : "30%", height: portrait ? "36%" : "56%", transform: `translateY(${interpolate(reveal, [0, 1], [height, 0])}px) rotate(5deg)`, opacity: reveal }}><PlaceholderMedia p={p} pal={pal} index={0} style={{ width: "100%", height: "100%", ...frameFor(p.frameStyle) }} /></div>
    <div style={{ position: "absolute", left: portrait ? 40 : 105, top: portrait ? 65 : 80 }}><CreatorBadge p={p} pal={pal} /></div>
  </AbsoluteFill>;
};

const CommentReply: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig(); const comments = p.comments?.length ? p.comments : ["How did you make this?", "Need the template!", "This is so good"];
  return <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT }}>
    <div style={{ width: width > height ? "72%" : "84%", display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ alignSelf: "flex-start", maxWidth: "80%", padding: "18px 23px", borderRadius: "24px 24px 24px 5px", background: pal.text, color: pal.bg, fontSize: 27, fontWeight: 720, transform: `translateX(${interpolate(clampInterp(frame, [4, 24], [0, 1]), [0, 1], [-width, 0])}px)` }}>@viewer · {comments[0]}</div>
      <div style={{ alignSelf: "flex-end", maxWidth: "82%", padding: "24px 28px", borderRadius: "24px 24px 5px 24px", background: `${pal.primary}ee`, color: pal.text, fontSize: 37, lineHeight: 1.1, fontWeight: 900, transform: `translateX(${interpolate(clampInterp(frame, [20, 42], [0, 1]), [0, 1], [width, 0])}px)` }}>{p.headline}<div style={{ marginTop: 10, color: `${pal.text}bb`, fontSize: 22, fontWeight: 500 }}>{p.subline}</div></div>
      <div style={{ alignSelf: "center", marginTop: 26, width: width > height ? "55%" : "78%", height: height > width ? height * .32 : height * .4, ...frameFor(p.frameStyle) }}><PlaceholderMedia p={p} pal={pal} index={1} style={{ width: "100%", height: "100%" }} /><div style={{ position: "absolute", left: 18, right: 18, bottom: 18 }}><Caption pal={pal} size={25}>{comments[1] ?? "Replying with a video"}</Caption></div></div>
    </div>
    <div style={{ position: "absolute", top: height > width ? 70 : 70, left: height > width ? 36 : 100 }}><CreatorBadge p={p} pal={pal} /></div>
  </AbsoluteFill>;
};

const VoiceoverBroll: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig(); const portrait = height > width; const bars = Array.from({ length: 32 }, (_, i) => 13 + seededRand(i * 4 + 3) * 58);
  return <AbsoluteFill style={{ padding: portrait ? "90px 42px" : "80px 110px", boxSizing: "border-box", fontFamily: FONT }}>
    <div style={{ color: pal.accent, fontSize: 18, fontWeight: 900, letterSpacing: ".22em" }}>VOICEOVER / B-ROLL</div>
    <div style={{ marginTop: 18, color: pal.text, fontSize: portrait ? 53 : 76, lineHeight: .95, fontWeight: 950, maxWidth: 840 }}>{p.headline}</div>
    <div style={{ display: "grid", gridTemplateColumns: portrait ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 15, marginTop: 42 }}>
      {[0, 1, 2, 3].map((i) => <div key={i} style={{ height: portrait ? height * .2 : height * .38, ...frameFor(p.frameStyle), transform: `translateY(${Math.sin(frame * .04 + i) * 5}px)` }}><PlaceholderMedia p={p} pal={pal} index={i % Math.max(1, p.clipUrls?.length ?? 1)} style={{ width: "100%", height: "100%" }} /></div>)}
    </div>
    <div style={{ position: "absolute", left: portrait ? 42 : 110, right: portrait ? 42 : 110, bottom: portrait ? 80 : 70, height: 76, display: "flex", alignItems: "center", gap: 5, padding: "0 18px", borderRadius: 18, background: `${pal.bg}dd`, border: `1px solid ${pal.text}22` }}>
      {bars.map((h, i) => <div key={i} style={{ flex: 1, height: h * (0.45 + .55 * (0.5 + .5 * Math.sin(frame * .13 + i))), borderRadius: 5, background: i < ((frame * 1.4) % 32) ? pal.accent : `${pal.text}42` }} />)}
      <span style={{ marginLeft: 14, color: pal.text, font: `700 16px ${MONO}` }}>00:{String(Math.floor(frame / 30)).padStart(2, "0")}</span>
    </div>
  </AbsoluteFill>;
};

const CreatorTestimonial: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig(); const reveal = spring({ frame: frame - 8, fps: 30, config: { damping: 16, stiffness: 100 } }); const portrait = height > width;
  return <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: portrait ? 55 : 120, boxSizing: "border-box", fontFamily: FONT }}>
    <div style={{ width: portrait ? "100%" : "82%", display: "flex", alignItems: "center", gap: portrait ? 24 : 70, flexDirection: portrait ? "column" : "row", transform: `translateY(${interpolate(reveal, [0, 1], [90, 0])}px)`, opacity: reveal }}>
      <div style={{ width: portrait ? width * .62 : width * .28, height: portrait ? height * .35 : height * .58, flexShrink: 0, ...frameFor(p.frameStyle) }}><PlaceholderMedia p={p} pal={pal} index={0} style={{ width: "100%", height: "100%" }} /></div>
      <div><div style={{ color: pal.accent, fontSize: 37, letterSpacing: ".12em" }}>★★★★★</div><div style={{ marginTop: 20, color: pal.text, fontSize: portrait ? 42 : 57, lineHeight: 1.02, fontWeight: 900, letterSpacing: "-.04em" }}>“{p.headline}”</div><div style={{ marginTop: 22, color: `${pal.text}a8`, fontSize: 24, lineHeight: 1.4 }}>{p.subline}</div><div style={{ marginTop: 30 }}><CreatorBadge p={p} pal={pal} /></div></div>
    </div>
  </AbsoluteFill>;
};

const RawToPolished: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig(); const wipe = clampInterp(frame, [28, 72], [0, 1]); const portrait = height > width;
  return <AbsoluteFill style={{ fontFamily: FONT }}>
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: portrait ? "column" : "row" }}>
      <div style={{ position: "relative", width: portrait ? "100%" : `${100 - wipe * 100}%`, height: portrait ? `${100 - wipe * 100}%` : "100%", overflow: "hidden", background: "#28303b" }}><PlaceholderMedia p={p} pal={pal} index={0} style={{ width: "100%", height: "100%", filter: "saturate(.55) contrast(.86)" }} /><div style={{ position: "absolute", left: 25, top: 25 }}><Caption pal={pal} size={23}>RAW / TAKE 01</Caption></div></div>
      <div style={{ position: "relative", flex: 1, height: portrait ? `${wipe * 100}%` : "100%", overflow: "hidden", background: pal.bg }}><PlaceholderMedia p={p} pal={pal} index={1} style={{ width: "100%", height: "100%", filter: "saturate(1.2) contrast(1.08)" }} /><div style={{ position: "absolute", right: 25, top: 25 }}><Caption pal={pal} size={23} dark>POLISHED / FINAL</Caption></div></div>
    </div>
    <div style={{ position: "absolute", left: portrait ? "50%" : `${wipe * 100}%`, top: portrait ? `${wipe * 100}%` : "50%", width: portrait ? "100%" : 8, height: portrait ? 8 : "100%", background: pal.accent, transform: portrait ? "translate(-50%,-50%)" : "translate(-50%,-50%)", boxShadow: `0 0 25px ${pal.accent}` }} />
    <div style={{ position: "absolute", bottom: portrait ? 50 : 55, left: portrait ? 32 : 85 }}><CreatorBadge p={p} pal={pal} /></div>
  </AbsoluteFill>;
};

const VARIANTS: Record<CreatorUgcVariant, React.FC<VariantProps>> = {
  "talking-head-frame": TalkingHead,
  "caption-burst": CaptionBurst,
  "jump-cut-stack": JumpCutStack,
  "product-in-hand": ProductInHand,
  "duet-layout": DuetLayout,
  "green-screen-card": GreenScreenCard,
  "comment-reply": CommentReply,
  "voiceover-broll": VoiceoverBroll,
  "creator-testimonial": CreatorTestimonial,
  "raw-to-polished": RawToPolished,
};

export const CreatorUgcTemplate: React.FC<CreatorUgcProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? TalkingHead;
  return <AbsoluteFill style={{ backgroundColor: pal.bg }}><GradientMeshBackground palette={pal} speed={0.45} blobs={4} /><FadeEdges inFrames={8} outFrames={10}><Variant p={props} pal={pal} /></FadeEdges><NoiseGrainOverlay opacity={0.03} /></AbsoluteFill>;
};

const familyCast = (component: React.FC<CreatorUgcProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;
export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "creator-ugc-talking-head-frame": familyCast(CreatorUgcTemplate),
  "creator-ugc-caption-burst": familyCast(CreatorUgcTemplate),
  "creator-ugc-jump-cut-stack": familyCast(CreatorUgcTemplate),
  "creator-ugc-product-in-hand": familyCast(CreatorUgcTemplate),
  "creator-ugc-duet-layout": familyCast(CreatorUgcTemplate),
  "creator-ugc-green-screen-card": familyCast(CreatorUgcTemplate),
  "creator-ugc-comment-reply": familyCast(CreatorUgcTemplate),
  "creator-ugc-voiceover-broll": familyCast(CreatorUgcTemplate),
  "creator-ugc-creator-testimonial": familyCast(CreatorUgcTemplate),
  "creator-ugc-raw-to-polished": familyCast(CreatorUgcTemplate),
};
