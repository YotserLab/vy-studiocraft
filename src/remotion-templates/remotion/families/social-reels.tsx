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
 * FAMILY: social-reels
 * Ten short-form social structures driven by one deterministic dispatcher.
 * All visual media is optional: omitted URLs render as procedural editorial cards.
 */
export type SocialReelsVariant =
  | "beat-cut"
  | "photo-beat"
  | "text-beat"
  | "broll-stack"
  | "listicle"
  | "split-screen"
  | "reaction"
  | "fast-facts"
  | "day-in-life"
  | "looping";

export interface SocialReelsProps {
  variant: SocialReelsVariant;
  headline: string;
  subline: string;
  handle: string;
  coverText: string;
  caption: string;
  mediaUrls?: string[];
  beatTimes?: number[];
  captions?: string[];
  accent?: string;
  paletteName: string;
}

type VariantProps = { p: SocialReelsProps; pal: Palette };
const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const DEFAULT_BEATS = [0, 18, 36, 54, 72, 90];
const DEFAULT_CAPTIONS = ["Make the ordinary feel electric.", "One idea.", "Many ways to move.", "Built for the scroll."];

const beatFrames = (p: SocialReelsProps): number[] => {
  const values = (p.beatTimes ?? DEFAULT_BEATS).filter((v) => Number.isFinite(v)).map((v) => Math.max(0, v));
  return values.length >= 2 ? values : DEFAULT_BEATS;
};

const activeBeat = (frame: number, beats: number[]): number => {
  let index = 0;
  for (let i = 0; i < beats.length; i += 1) if (frame >= beats[i]) index = i;
  return index;
};

const mediaFor = (p: SocialReelsProps, index: number): string | undefined => p.mediaUrls?.[index % Math.max(1, p.mediaUrls.length)];

const MediaCard: React.FC<{
  p: SocialReelsProps;
  pal: Palette;
  index: number;
  style?: React.CSSProperties;
  label?: string;
}> = ({ p, pal, index, style, label }) => {
  const url = mediaFor(p, index);
  const hue = seededRand(index * 17 + 4);
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(${125 + hue * 70}deg, ${pal.primary}, ${pal.bg} 52%, ${pal.accent})`,
        border: `1px solid ${pal.text}24`,
        boxShadow: `0 24px 70px ${pal.bg}bb`,
        ...style,
      }}
    >
      {url ? <Img src={url} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : null}
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(145deg, ${pal.text}18, transparent 42%, ${pal.bg}66)` }} />
      {!url && (
        <>
          <div style={{ position: "absolute", width: "56%", height: "56%", left: `${12 + hue * 30}%`, top: `${9 + (1 - hue) * 28}%`, borderRadius: "50%", background: `${pal.secondary}55`, filter: "blur(20px)" }} />
          <div style={{ position: "absolute", right: "10%", bottom: "13%", width: "36%", height: "36%", borderRadius: "38% 62% 50% 50%", background: `${pal.accent}88`, transform: `rotate(${hue * 40 - 20}deg)` }} />
        </>
      )}
      {label && <div style={{ position: "absolute", left: 18, bottom: 16, color: pal.text, fontFamily: FONT, fontSize: 16, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" }}>{label}</div>}
    </div>
  );
};

const ReelChrome: React.FC<VariantProps & { children: React.ReactNode; progress?: number }> = ({ p, pal, children, progress = 0 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const scale = Math.min(width / 1080, height / 1920);
  const bar = clampInterp(progress, [0, 1], [0, 100]);
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: pal.text, overflow: "hidden" }}>
      <GradientMeshBackground palette={pal} speed={0.55} blobs={4} />
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${pal.bg}11, ${pal.bg}77 72%, ${pal.bg}ee)` }} />
      <div style={{ position: "absolute", top: 34 * scale, left: 34 * scale, right: 34 * scale, display: "flex", alignItems: "center", gap: 12 * scale, zIndex: 3 }}>
        <div style={{ width: 42 * scale, height: 42 * scale, borderRadius: "50%", background: `linear-gradient(140deg, ${pal.primary}, ${pal.accent})`, border: `2px solid ${pal.text}55` }} />
        <div style={{ fontSize: 18 * scale, fontWeight: 800, letterSpacing: "0.05em" }}>{p.handle}</div>
        <div style={{ marginLeft: "auto", color: `${pal.text}99`, fontSize: 17 * scale }}>⋯</div>
      </div>
      <div style={{ position: "absolute", top: 96 * scale, left: 34 * scale, right: 34 * scale, height: 4 * scale, background: `${pal.text}25`, borderRadius: 99, zIndex: 3 }}>
        <div style={{ height: "100%", width: `${bar}%`, background: p.accent ?? pal.accent, borderRadius: 99 }} />
      </div>
      <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>{children}</div>
      <div style={{ position: "absolute", bottom: 40 * scale, left: 34 * scale, right: 34 * scale, zIndex: 3 }}>
        <div style={{ maxWidth: width * 0.78, fontSize: 20 * scale, lineHeight: 1.25, fontWeight: 650 }}>{p.caption || p.subline}</div>
        <div style={{ marginTop: 12 * scale, color: `${pal.text}99`, fontSize: 16 * scale }}>{p.handle} · original audio</div>
      </div>
      <div style={{ position: "absolute", right: 28 * scale, bottom: 140 * scale, zIndex: 3, display: "grid", gap: 18 * scale, textAlign: "center", color: `${pal.text}dd`, fontSize: 14 * scale, fontWeight: 800 }}>
        <div><div style={{ fontSize: 28 * scale }}>♡</div>2.4k</div>
        <div><div style={{ fontSize: 27 * scale }}>◌</div>318</div>
        <div><div style={{ fontSize: 27 * scale }}>↗</div>Share</div>
      </div>
      <div style={{ position: "absolute", left: -width * 0.3, top: height * 0.45, width: width * 1.6, height: 1, background: `${pal.text}10`, transform: `rotate(${Math.sin(frame * 0.01) * 2}deg)` }} />
    </AbsoluteFill>
  );
};

const BeatCut: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const beats = beatFrames(p);
  const index = activeBeat(frame, beats);
  const local = frame - beats[index];
  const progress = clampInterp(frame, [0, Math.max(1, beats[beats.length - 1])], [0, 1]);
  return <ReelChrome p={p} pal={pal} progress={progress}>
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: "18% 10% 30%" }}>
      {[-1, 0, 1].map((offset) => {
        const i = (index + offset + 12) % 12;
        const isActive = offset === 0;
        return <MediaCard key={offset} p={p} pal={pal} index={i} label={isActive ? `beat ${String(index + 1).padStart(2, "0")}` : undefined} style={{ width: width * 0.72, height: height * 0.5, borderRadius: width * 0.045, transform: `translateX(${offset * width * 0.92 + interpolate(clampInterp(local, [0, 8], [0, 1]), [0, 1], [offset * width * 0.15, 0])}px) scale(${isActive ? interpolate(clampInterp(local, [0, 8], [0, 1]), [0, 1], [0.92, 1]) : 0.84}) rotate(${offset * 8}deg)`, opacity: isActive ? 1 : 0.35, zIndex: isActive ? 2 : 1 }} />;
      })}
    </div>
    <div style={{ position: "absolute", top: "18%", left: "10%", color: pal.secondary, fontSize: Math.max(18, width * 0.025), fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase" }}>{p.coverText}</div>
  </ReelChrome>;
};

const PhotoBeat: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const beats = beatFrames(p);
  const index = activeBeat(frame, beats);
  const local = frame - beats[index];
  const pulse = 1 + Math.sin(local * 0.32) * 0.025;
  return <ReelChrome p={p} pal={pal} progress={index / Math.max(1, beats.length - 1)}>
    <div style={{ position: "absolute", inset: "15% 9% 25%", display: "grid", placeItems: "center" }}>
      <MediaCard p={p} pal={pal} index={index} label={`frame ${index + 1}`} style={{ width: "100%", height: "100%", borderRadius: 26, transform: `scale(${pulse}) rotate(${Math.sin(local * 0.1) * 1.4}deg)` }} />
      <div style={{ position: "absolute", top: -18, right: 18, padding: "12px 18px", borderRadius: 999, background: p.accent ?? pal.accent, color: pal.bg, fontSize: 15, fontWeight: 900, letterSpacing: "0.12em" }}>BEAT / {String(index + 1).padStart(2, "0")}</div>
    </div>
    <div style={{ position: "absolute", left: "9%", right: "9%", bottom: "24%", display: "flex", gap: 8 }}>
      {Array.from({ length: Math.max(5, beats.length) }, (_, i) => <div key={i} style={{ flex: 1, height: 6, borderRadius: 99, background: i === index ? (p.accent ?? pal.accent) : `${pal.text}55` }} />)}
    </div>
  </ReelChrome>;
};

const TextBeat: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const beats = beatFrames(p);
  const index = activeBeat(frame, beats);
  const words = (p.headline || p.coverText).split(/\s+/).filter(Boolean);
  const word = words[index % Math.max(1, words.length)] ?? p.coverText;
  const local = frame - beats[index];
  const rise = spring({ frame: Math.max(0, local), fps: 30, config: { damping: 13, stiffness: 190 } });
  return <ReelChrome p={p} pal={pal} progress={index / Math.max(1, beats.length - 1)}>
    <div style={{ position: "absolute", inset: "18% 8% 27%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ color: pal.secondary, fontSize: 17, fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase" }}>{p.coverText}</div>
      <div style={{ marginTop: 20, fontSize: "clamp(64px, 15vw, 190px)", lineHeight: 0.88, fontWeight: 950, letterSpacing: "-0.08em", textTransform: "uppercase", transform: `translateY(${interpolate(rise, [0, 1], [130, 0])}px) rotate(${interpolate(rise, [0, 1], [6, 0])}deg)`, opacity: rise }}>
        <span style={{ color: p.accent ?? pal.accent }}>{word}</span>
      </div>
      <div style={{ marginTop: 24, color: `${pal.text}aa`, fontSize: 22, maxWidth: "82%" }}>{p.subline}</div>
    </div>
  </ReelChrome>;
};

const BrollStack: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const beats = beatFrames(p);
  const index = activeBeat(frame, beats);
  return <ReelChrome p={p} pal={pal} progress={index / Math.max(1, beats.length - 1)}>
    <div style={{ position: "absolute", inset: "16% 8% 28%", display: "grid", placeItems: "center" }}>
      {Array.from({ length: 4 }, (_, i) => {
        const depth = 3 - i;
        const active = i === 3;
        return <MediaCard key={i} p={p} pal={pal} index={index + i} label={active ? "B-ROLL" : undefined} style={{ position: "absolute", width: width * (0.68 - depth * 0.055), height: height * (0.48 - depth * 0.03), borderRadius: 22, transform: `translate(${depth * width * 0.055}px, ${depth * height * -0.022}px) rotate(${depth * -4 + Math.sin(frame * 0.02 + i) * 0.7}deg)`, opacity: 1 - depth * 0.15, zIndex: i }} />;
      })}
      <div style={{ position: "absolute", bottom: -8, left: 0, padding: "10px 14px", background: pal.text, color: pal.bg, fontSize: 14, fontWeight: 950, letterSpacing: "0.14em" }}>CUT / STACK / MOVE</div>
    </div>
  </ReelChrome>;
};

const Listicle: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const items = (p.captions?.length ? p.captions : ["Hook harder", "Show the proof", "Land the CTA", "Loop the finish"]).slice(0, 5);
  const active = Math.min(items.length - 1, Math.floor(frame / Math.max(1, Math.floor(108 / items.length))));
  return <ReelChrome p={p} pal={pal} progress={frame / 110}>
    <div style={{ position: "absolute", inset: "16% 9% 27%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ color: pal.secondary, fontSize: 18, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase" }}>SAVE THIS LIST</div>
      <div style={{ marginTop: 16, color: pal.text, fontSize: "clamp(42px, 8vw, 86px)", lineHeight: 0.95, fontWeight: 950, letterSpacing: "-0.06em" }}>{p.headline}</div>
      <div style={{ marginTop: 28, display: "grid", gap: 10 }}>
        {items.map((item, i) => {
          const show = clampInterp(frame, [i * 12, i * 12 + 10], [0, 1]);
          return <div key={item} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 14px", borderRadius: 14, background: i === active ? `${pal.primary}bb` : `${pal.text}0d`, border: `1px solid ${i === active ? pal.accent : pal.text + "22"}`, transform: `translateX(${interpolate(show, [0, 1], [height * 0.06, 0])}px)`, opacity: show }}><span style={{ color: p.accent ?? pal.accent, fontSize: 20, fontWeight: 950 }}>{String(i + 1).padStart(2, "0")}</span><span style={{ fontSize: 20, fontWeight: 750 }}>{item}</span></div>;
        })}
      </div>
    </div>
  </ReelChrome>;
};

const SplitScreen: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const reveal = spring({ frame: frame - 8, fps: 30, config: { damping: 18, stiffness: 105 } });
  const shift = interpolate(reveal, [0, 1], [width * 0.5, 0]);
  return <ReelChrome p={p} pal={pal} progress={frame / 110}>
    <div style={{ position: "absolute", inset: "16% 7% 27%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, overflow: "hidden", borderRadius: 24, background: pal.text }}>
      <MediaCard p={p} pal={pal} index={0} label="VISUAL" style={{ borderRadius: "22px 0 0 22px", transform: `translateX(${shift}px)` }} />
      <div style={{ padding: "12% 8%", background: pal.bgAlt ?? pal.bg, transform: `translateX(${-shift}px)`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ color: pal.secondary, fontSize: 16, fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase" }}>THE POINT</div>
        <div style={{ marginTop: 16, fontSize: "clamp(34px, 7vw, 72px)", lineHeight: 0.96, fontWeight: 950, letterSpacing: "-0.06em" }}>{p.headline}</div>
        <div style={{ marginTop: 18, color: `${pal.text}99`, fontSize: 19, lineHeight: 1.25 }}>{p.subline}</div>
        <div style={{ marginTop: 26, width: "70%", height: 5, background: p.accent ?? pal.accent, transformOrigin: "left", transform: `scaleX(${reveal})` }} />
      </div>
    </div>
  </ReelChrome>;
};

const Reaction: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const pulse = 1 + Math.sin(frame * 0.24) * 0.035;
  const pop = spring({ frame: frame - 15, fps: 30, config: { damping: 9, stiffness: 155 } });
  return <ReelChrome p={p} pal={pal} progress={frame / 110}>
    <div style={{ position: "absolute", inset: "16% 7% 27%", display: "grid", gridTemplateRows: "1fr auto 1fr", gap: 8 }}>
      <MediaCard p={p} pal={pal} index={0} label="ORIGINAL" style={{ borderRadius: 22, transform: `scale(${pulse})` }} />
      <div style={{ justifySelf: "center", zIndex: 2, padding: "10px 20px", borderRadius: 999, background: p.accent ?? pal.accent, color: pal.bg, fontSize: 16, fontWeight: 950, letterSpacing: "0.12em", transform: `scale(${pop}) rotate(${interpolate(pop, [0, 1], [-12, 0])}deg)` }}>MY REACTION</div>
      <div style={{ display: "grid", gridTemplateColumns: "0.64fr 1fr", gap: 8 }}>
        <MediaCard p={p} pal={pal} index={1} label="REACT" style={{ borderRadius: 22 }} />
        <div style={{ borderRadius: 22, padding: "9% 8%", background: `${pal.primary}88`, border: `1px solid ${pal.text}22`, display: "flex", flexDirection: "column", justifyContent: "center" }}><div style={{ fontSize: 17, color: pal.secondary, fontWeight: 900, letterSpacing: "0.16em" }}>THAT PART</div><div style={{ marginTop: 12, fontSize: "clamp(30px, 6vw, 65px)", fontWeight: 950, lineHeight: 0.95 }}>{p.coverText}</div></div>
      </div>
    </div>
  </ReelChrome>;
};

const FastFacts: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const facts = p.captions?.length ? p.captions.slice(0, 4) : ["3x faster", "82% clearer", "1 simple workflow", "0 busywork"];
  return <ReelChrome p={p} pal={pal} progress={frame / 110}>
    <div style={{ position: "absolute", inset: "16% 8% 27%" }}>
      <div style={{ color: pal.secondary, fontSize: 18, fontWeight: 900, letterSpacing: "0.2em" }}>FAST FACTS</div>
      <div style={{ marginTop: 15, fontSize: "clamp(42px, 9vw, 92px)", fontWeight: 950, lineHeight: 0.9, letterSpacing: "-0.07em" }}>{p.headline}</div>
      <div style={{ marginTop: 28, display: "grid", gap: 13 }}>
        {facts.map((fact, i) => { const on = clampInterp(frame, [i * 12, i * 12 + 10], [0, 1]); return <div key={fact} style={{ display: "grid", gridTemplateColumns: `${28 + i * 14}% 1fr`, alignItems: "center", gap: 12, transform: `translateX(${interpolate(on, [0, 1], [width * 0.18, 0])}px)`, opacity: on }}><div style={{ height: 36, borderRadius: 8, background: `linear-gradient(90deg, ${p.accent ?? pal.accent}, ${pal.primary})`, transformOrigin: "left", transform: `scaleX(${0.68 + i * 0.07})` }} /><div style={{ fontSize: 22, fontWeight: 800 }}>{fact}</div></div>; })}
      </div>
    </div>
  </ReelChrome>;
};

const DayInLife: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const chapters = p.captions?.length ? p.captions.slice(0, 5) : ["07:00 / Start", "09:30 / Make", "13:00 / Ship", "18:30 / Reset", "22:00 / Repeat"];
  const cursor = clampInterp(frame, [0, 110], [0, chapters.length - 1]);
  return <ReelChrome p={p} pal={pal} progress={frame / 110}>
    <div style={{ position: "absolute", inset: "15% 9% 27%", display: "grid", gridTemplateColumns: "58px 1fr", gap: 22 }}>
      <div style={{ position: "relative", margin: "8px 0" }}><div style={{ position: "absolute", inset: 0, width: 4, marginLeft: 20, background: `${pal.text}25` }} /><div style={{ position: "absolute", top: `${(cursor / Math.max(1, chapters.length - 1)) * 100}%`, left: 10, width: 24, height: 24, borderRadius: "50%", background: p.accent ?? pal.accent, boxShadow: `0 0 0 7px ${p.accent ?? pal.accent}30`, transform: "translateY(-50%)" }} /></div>
      <div style={{ display: "grid", gap: 11 }}>
        <div style={{ color: pal.secondary, fontSize: 17, fontWeight: 900, letterSpacing: "0.18em" }}>A DAY IN THE LIFE</div>
        <div style={{ color: pal.text, fontSize: "clamp(38px, 8vw, 80px)", fontWeight: 950, lineHeight: 0.9, letterSpacing: "-0.07em" }}>{p.headline}</div>
        {chapters.map((chapter, i) => { const on = clampInterp(frame, [i * 10, i * 10 + 9], [0, 1]); return <div key={chapter} style={{ padding: "13px 16px", borderRadius: 13, background: i <= Math.floor(cursor) ? `${pal.primary}cc` : `${pal.text}0d`, border: `1px solid ${i === Math.floor(cursor) ? p.accent ?? pal.accent : pal.text + "18"}`, transform: `translateY(${interpolate(on, [0, 1], [height * 0.05, 0])}px)`, opacity: on, fontSize: 20, fontWeight: i === Math.floor(cursor) ? 900 : 650 }}>{chapter}</div>; })}
      </div>
    </div>
  </ReelChrome>;
};

const Looping: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const spin = (frame % 110) / 110;
  const enter = spring({ frame: frame - 8, fps: 30, config: { damping: 18, stiffness: 100 } });
  return <ReelChrome p={p} pal={pal} progress={spin}>
    <div style={{ position: "absolute", inset: "14% 8% 27%", display: "grid", placeItems: "center" }}>
      <div style={{ position: "absolute", width: Math.min(width * 0.84, height * 0.54), aspectRatio: "1", borderRadius: "50%", border: `1px dashed ${pal.secondary}66`, transform: `rotate(${spin * 360}deg)` }} />
      {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2 + spin * Math.PI * 2; return <div key={i} style={{ position: "absolute", left: `calc(50% + ${Math.cos(a) * 35}%)`, top: `calc(50% + ${Math.sin(a) * 35}%)`, width: 10, height: 10, borderRadius: "50%", background: i % 3 === 0 ? p.accent ?? pal.accent : pal.secondary, transform: "translate(-50%, -50%)" }} />; })}
      <MediaCard p={p} pal={pal} index={0} label="WATCH AGAIN" style={{ width: "70%", height: "62%", borderRadius: 28, transform: `scale(${interpolate(enter, [0, 1], [0.7, 1])}) rotate(${interpolate(enter, [0, 1], [-7, 0])}deg)`, opacity: enter }} />
      <div style={{ position: "absolute", bottom: -4, padding: "12px 18px", borderRadius: 999, background: pal.text, color: pal.bg, fontSize: 15, fontWeight: 950, letterSpacing: "0.16em" }}>{p.coverText} ↻</div>
    </div>
  </ReelChrome>;
};

const VARIANTS: Record<SocialReelsVariant, React.FC<VariantProps>> = {
  "beat-cut": BeatCut,
  "photo-beat": PhotoBeat,
  "text-beat": TextBeat,
  "broll-stack": BrollStack,
  listicle: Listicle,
  "split-screen": SplitScreen,
  reaction: Reaction,
  "fast-facts": FastFacts,
  "day-in-life": DayInLife,
  looping: Looping,
};

const SocialReelsTemplate: React.FC<SocialReelsProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? BeatCut;
  return <AbsoluteFill style={{ backgroundColor: pal.bg }}><FadeEdges inFrames={9} outFrames={12}><Variant p={props} pal={pal} /></FadeEdges><NoiseGrainOverlay opacity={0.025} /></AbsoluteFill>;
};

const familyCast = (component: React.FC<SocialReelsProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "social-reels-beat-cut-reel": familyCast(SocialReelsTemplate),
  "social-reels-photo-beat": familyCast(SocialReelsTemplate),
  "social-reels-text-beat": familyCast(SocialReelsTemplate),
  "social-reels-broll-stack": familyCast(SocialReelsTemplate),
  "social-reels-listicle-reel": familyCast(SocialReelsTemplate),
  "social-reels-split-screen-reel": familyCast(SocialReelsTemplate),
  "social-reels-reaction-reel": familyCast(SocialReelsTemplate),
  "social-reels-fast-facts": familyCast(SocialReelsTemplate),
  "social-reels-day-in-life": familyCast(SocialReelsTemplate),
  "social-reels-looping-reel": familyCast(SocialReelsTemplate),
};
