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
  GradientMeshBackground,
  NoiseGrainOverlay,
  clampInterp,
  resolvePalette,
  seededRand,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: stories-interactive
 * Story-native interactive UI moments represented as deterministic video states.
 * These are visual simulations of polls, taps, replies, stickers and progress;
 * they are intentionally asset-free but accept copy/content through props.
 */
type StoriesInteractiveVariant =
  | "poll-card"
  | "emoji-slider"
  | "question-box"
  | "tap-to-reveal"
  | "quiz-answer"
  | "countdown-sticker"
  | "link-sticker"
  | "reply-bubble"
  | "swipe-up"
  | "story-progress";

export interface StoriesInteractiveProps {
  variant: StoriesInteractiveVariant;
  headline: string;
  subtitle: string;
  question: string;
  optionA: string;
  optionB: string;
  answer: string;
  sticker: string;
  link: string;
  username: string;
  paletteName: string;
}

type VariantProps = { p: StoriesInteractiveProps; pal: Palette };
const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';

const StoryChrome: React.FC<{
  pal: Palette;
  p: StoriesInteractiveProps;
  children: React.ReactNode;
  footer?: React.ReactNode;
  active?: number;
  count?: number;
}> = ({ pal, p, children, footer, active = 0, count = 5 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const portrait = height > width;
  const s = Math.min(width / (portrait ? 1080 : 1920), height / (portrait ? 1920 : 1080));
  const progress = clampInterp(frame, [0, 24], [0, 1]);
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: pal.text, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: portrait ? 62 * s : 74, right: portrait ? 62 * s : 74, top: portrait ? 54 * s : 42, display: "flex", gap: 8 * s, zIndex: 5 }}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} style={{ flex: 1, height: Math.max(5, 6 * s), borderRadius: 999, background: `${pal.text}28`, overflow: "hidden" }}>
            <div style={{ height: "100%", width: i < active ? "100%" : i === active ? `${progress * 100}%` : "0%", background: pal.text, transformOrigin: "left" }} />
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", top: portrait ? 86 * s : 76, left: portrait ? 62 * s : 74, right: portrait ? 62 * s : 74, display: "flex", alignItems: "center", gap: 14 * s, zIndex: 5 }}>
        <div style={{ width: 42 * s, height: 42 * s, borderRadius: "50%", border: `2px solid ${pal.text}88`, background: `linear-gradient(135deg, ${pal.primary}, ${pal.accent})` }} />
        <div style={{ fontSize: 18 * s, fontWeight: 850, letterSpacing: "0.01em" }}>{p.username}</div>
        <div style={{ marginLeft: "auto", color: `${pal.text}88`, fontSize: 18 * s }}>•••</div>
      </div>
      <div style={{ position: "absolute", inset: 0, padding: portrait ? `${150 * s}px ${62 * s}px ${160 * s}px` : "140px 120px 100px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
      {footer && <div style={{ position: "absolute", left: portrait ? 62 * s : 120, right: portrait ? 62 * s : 120, bottom: portrait ? 66 * s : 54, zIndex: 5 }}>{footer}</div>}
    </AbsoluteFill>
  );
};

const StoryTitle: React.FC<{ p: StoriesInteractiveProps; pal: Palette; align?: "left" | "center" }> = ({ p, pal, align = "center" }) => {
  const frame = useCurrentFrame();
  const reveal = spring({ frame: frame - 8, fps: useVideoConfig().fps, config: { damping: 16, stiffness: 120 } });
  return (
    <div style={{ width: "100%", textAlign: align, opacity: reveal, transform: `translateY(${interpolate(reveal, [0, 1], [36, 0])}px)` }}>
      <div style={{ color: pal.secondary, fontSize: 20, fontWeight: 850, letterSpacing: "0.18em", textTransform: "uppercase" }}>{p.subtitle}</div>
      <div style={{ marginTop: 16, color: pal.text, fontSize: "clamp(38px, 6vw, 92px)", lineHeight: 0.98, fontWeight: 950, letterSpacing: "-0.055em" }}>{p.headline}</div>
    </div>
  );
};

const PollCard: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const s = Math.min(width / 1920, 1);
  const enter = spring({ frame: frame - 14, fps: useVideoConfig().fps, config: { damping: 15, stiffness: 105 } });
  const vote = clampInterp(frame, [34, 72], [0, 1]);
  const rows = [p.optionA, p.optionB];
  return <StoryChrome pal={pal} p={p} active={0}>
    <div style={{ width: Math.min(880 * s, width * 0.82), transform: `scale(${interpolate(enter, [0, 1], [0.88, 1])})`, opacity: enter }}>
      <StoryTitle p={p} pal={pal} />
      <div style={{ marginTop: 46 * s, display: "grid", gap: 18 * s }}>
        {rows.map((label, i) => {
          const value = i === 0 ? 0.68 : 0.32;
          return <div key={label} style={{ position: "relative", height: 92 * s, borderRadius: 22 * s, overflow: "hidden", border: `2px solid ${pal.text}2c`, background: `${pal.text}0d` }}>
            <div style={{ position: "absolute", inset: 0, width: `${(value * vote) * 100}%`, background: i === 0 ? `${pal.primary}cc` : `${pal.secondary}99`, transition: "none" }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: `0 ${28 * s}px`, gap: 18 * s, fontSize: 29 * s, fontWeight: 800 }}>
              <span style={{ width: 42 * s, height: 42 * s, borderRadius: "50%", border: `3px solid ${pal.text}aa`, background: i === 0 ? pal.text : "transparent", boxShadow: i === 0 ? `inset 0 0 0 ${10 * s}px ${pal.primary}` : undefined }} />
              <span style={{ flex: 1 }}>{label}</span><span style={{ fontFamily: MONO, fontSize: 25 * s, opacity: vote }}>{Math.round(value * 100)}%</span>
            </div>
          </div>;
        })}
      </div>
      <div style={{ marginTop: 24 * s, color: `${pal.text}88`, fontSize: 22 * s, textAlign: "center" }}>{p.question} · {Math.round(vote * 1280)} votes</div>
    </div>
  </StoryChrome>;
};

const EmojiSlider: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const s = Math.min(width / 1920, 1);
  const enter = spring({ frame: frame - 10, fps, config: { damping: 16, stiffness: 110 } });
  const value = clampInterp(frame, [22, 78], [0.08, 0.86]);
  const pulse = 1 + Math.sin(frame * 0.16) * 0.04;
  return <StoryChrome pal={pal} p={p} active={1}>
    <div style={{ width: Math.min(920 * s, width * 0.84), textAlign: "center", opacity: enter }}>
      <div style={{ fontSize: 92 * s, transform: `scale(${pulse})` }}>😊</div>
      <StoryTitle p={p} pal={pal} />
      <div style={{ position: "relative", marginTop: 64 * s, height: 20 * s, borderRadius: 999, background: `${pal.text}28` }}>
        <div style={{ position: "absolute", inset: 0, width: `${value * 100}%`, borderRadius: 999, background: `linear-gradient(90deg, ${pal.primary}, ${pal.accent})` }} />
        <div style={{ position: "absolute", top: "50%", left: `${value * 100}%`, width: 54 * s, height: 54 * s, borderRadius: "50%", background: pal.text, border: `7px solid ${pal.accent}`, transform: "translate(-50%, -50%)", boxShadow: `0 8px 30px ${pal.bg}` }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 * s, color: `${pal.text}80`, fontSize: 19 * s, fontWeight: 750 }}><span>not really</span><span>absolutely</span></div>
    </div>
  </StoryChrome>;
};

const QuestionBox: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const s = Math.min(width / 1920, 1);
  const enter = spring({ frame: frame - 12, fps, config: { damping: 14, stiffness: 100 } });
  const reply = clampInterp(frame, [48, 72], [0, 1]);
  return <StoryChrome pal={pal} p={p} active={2} footer={<div style={{ height: 62 * s, borderRadius: 999, border: `1px solid ${pal.text}40`, background: `${pal.bg}aa`, display: "flex", alignItems: "center", padding: `0 ${22 * s}px`, color: `${pal.text}86`, fontSize: 21 * s }}><span style={{ flex: 1 }}>Send a reply...</span><span style={{ fontSize: 27 * s, opacity: reply }}>➤</span></div>}>
    <div style={{ width: Math.min(880 * s, width * 0.82), opacity: enter, transform: `translateY(${interpolate(enter, [0, 1], [55, 0])}px)` }}>
      <div style={{ display: "inline-flex", padding: `${14 * s}px ${20 * s}px`, borderRadius: 22 * s, background: pal.text, color: pal.bg, fontSize: 20 * s, fontWeight: 850 }}>{p.sticker}</div>
      <div style={{ marginTop: 26 * s, color: pal.text, fontSize: "clamp(38px, 5.3vw, 82px)", lineHeight: 1.02, fontWeight: 930, letterSpacing: "-0.05em" }}>{p.question}</div>
      <div style={{ marginTop: 34 * s, color: pal.secondary, fontSize: 27 * s }}>{p.subtitle}</div>
      <div style={{ marginTop: 30 * s, height: 7 * s, width: `${reply * 100}%`, background: pal.accent, borderRadius: 99 }} />
    </div>
  </StoryChrome>;
};

const TapToReveal: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const s = Math.min(width / 1920, 1);
  const enter = spring({ frame: frame - 8, fps, config: { damping: 16, stiffness: 120 } });
  const reveal = clampInterp(frame, [40, 78], [0, 1]);
  return <StoryChrome pal={pal} p={p} active={3}>
    <div style={{ width: Math.min(860 * s, width * 0.8), textAlign: "center", opacity: enter }}>
      <div style={{ color: pal.secondary, fontSize: 21 * s, fontWeight: 850, letterSpacing: "0.16em", textTransform: "uppercase" }}>{p.subtitle}</div>
      <div style={{ position: "relative", marginTop: 28 * s, minHeight: 330 * s, display: "grid", placeItems: "center", borderRadius: 36 * s, border: `2px solid ${pal.text}2a`, background: `linear-gradient(135deg, ${pal.primary}50, ${pal.accent}40)`, overflow: "hidden", transform: `rotate(${interpolate(enter, [0, 1], [-2, 0])}deg)` }}>
        <div style={{ filter: `blur(${(1 - reveal) * 13}px)`, opacity: 0.36 + reveal * 0.64, color: pal.text, fontSize: "clamp(34px, 5.2vw, 82px)", fontWeight: 950, letterSpacing: "-0.05em", padding: 30 }}>{p.answer}</div>
        {reveal < 0.98 && <div style={{ position: "absolute", padding: `${18 * s}px ${26 * s}px`, borderRadius: 999, background: pal.text, color: pal.bg, fontSize: 22 * s, fontWeight: 900, transform: `scale(${interpolate(reveal, [0, 1], [1, 0.7])})`, opacity: 1 - reveal }}>TAP TO REVEAL</div>}
      </div>
      <div style={{ marginTop: 24 * s, color: `${pal.text}90`, fontSize: 23 * s }}>{p.question}</div>
    </div>
  </StoryChrome>;
};

const QuizAnswer: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const s = Math.min(width / 1920, 1);
  const enter = spring({ frame: frame - 10, fps, config: { damping: 15, stiffness: 108 } });
  const selected = clampInterp(frame, [42, 68], [0, 1]);
  const options = [p.optionA, p.optionB, p.answer];
  return <StoryChrome pal={pal} p={p} active={4}>
    <div style={{ width: Math.min(900 * s, width * 0.82), opacity: enter }}>
      <div style={{ color: pal.secondary, fontSize: 20 * s, fontWeight: 850, textTransform: "uppercase", letterSpacing: "0.17em" }}>QUIZ TIME</div>
      <div style={{ marginTop: 15 * s, fontSize: "clamp(36px, 5.2vw, 78px)", lineHeight: 1.02, fontWeight: 950, letterSpacing: "-0.05em" }}>{p.question}</div>
      <div style={{ marginTop: 34 * s, display: "grid", gap: 13 * s }}>
        {options.map((option, i) => { const correct = i === 2; return <div key={option} style={{ height: 70 * s, borderRadius: 18 * s, padding: `0 ${24 * s}px`, display: "flex", alignItems: "center", gap: 16 * s, background: correct ? `${pal.accent}${Math.round(selected * 45).toString(16).padStart(2, "0")}` : `${pal.text}0d`, border: `2px solid ${correct ? `${pal.accent}${Math.round((0.3 + selected * 0.7) * 255).toString(16).padStart(2, "0")}` : `${pal.text}25`}`, transform: `translateX(${interpolate(enter, [0, 1], [i % 2 ? 30 : -30, 0])}px)` }}><span style={{ width: 30 * s, height: 30 * s, display: "grid", placeItems: "center", borderRadius: "50%", border: `2px solid ${pal.text}70`, fontWeight: 800 }}>{String.fromCharCode(65 + i)}</span><span style={{ fontSize: 25 * s, fontWeight: 750, flex: 1 }}>{option}</span><span style={{ fontSize: 25 * s, opacity: correct ? selected : 0 }}>✓</span></div>; })}
      </div>
      <div style={{ marginTop: 23 * s, color: pal.accent, fontSize: 22 * s, fontWeight: 800, opacity: selected }}>{p.answer} is the answer</div>
    </div>
  </StoryChrome>;
};

const CountdownSticker: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const s = Math.min(width / 1920, 1);
  const enter = spring({ frame: frame - 8, fps, config: { damping: 12, stiffness: 145 } });
  const remaining = Math.max(0, 10 - Math.floor(frame / 9));
  const angle = clampInterp(frame, [0, 90], [0, 360]);
  return <StoryChrome pal={pal} p={p} active={0} count={4}>
    <div style={{ textAlign: "center", opacity: enter, transform: `scale(${interpolate(enter, [0, 1], [0.65, 1])})` }}>
      <div style={{ color: pal.secondary, fontSize: 20 * s, fontWeight: 850, letterSpacing: "0.16em", textTransform: "uppercase" }}>{p.subtitle}</div>
      <div style={{ position: "relative", width: 350 * s, height: 350 * s, margin: `${28 * s}px auto`, borderRadius: "50%", padding: 12 * s, background: `conic-gradient(${pal.accent} ${angle}deg, ${pal.text}15 ${angle}deg)` }}><div style={{ width: "100%", height: "100%", borderRadius: "50%", background: pal.bg, display: "grid", placeItems: "center", border: `1px solid ${pal.text}28` }}><div><div style={{ fontFamily: MONO, fontSize: 110 * s, lineHeight: 0.9, fontWeight: 900 }}>{String(remaining).padStart(2, "0")}</div><div style={{ color: pal.accent, fontSize: 17 * s, fontWeight: 850, letterSpacing: "0.16em", marginTop: 18 * s }}>SECONDS</div></div></div></div>
      <div style={{ color: pal.text, fontSize: 34 * s, fontWeight: 900 }}>{p.headline}</div>
    </div>
  </StoryChrome>;
};

const LinkSticker: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const s = Math.min(width / 1920, 1);
  const enter = spring({ frame: frame - 12, fps, config: { damping: 14, stiffness: 120 } });
  const pulse = 1 + Math.sin(frame * 0.16) * 0.03;
  return <StoryChrome pal={pal} p={p} active={1}>
    <div style={{ width: Math.min(900 * s, width * 0.82), textAlign: "center", opacity: enter }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 18 * s, padding: `${16 * s}px ${24 * s}px`, borderRadius: 999, background: pal.text, color: pal.bg, boxShadow: `0 20px 65px ${pal.accent}55`, transform: `scale(${pulse})` }}><span style={{ width: 40 * s, height: 40 * s, borderRadius: "50%", background: pal.accent, display: "grid", placeItems: "center", fontSize: 24 * s }}>↗</span><span style={{ fontSize: 25 * s, fontWeight: 900 }}>{p.sticker}</span></div>
      <div style={{ marginTop: 36 * s, color: pal.text, fontSize: "clamp(40px, 5.8vw, 88px)", lineHeight: 0.98, fontWeight: 950, letterSpacing: "-0.055em" }}>{p.headline}</div>
      <div style={{ margin: "26px auto 0", maxWidth: 700 * s, padding: `${18 * s}px ${24 * s}px`, border: `1px solid ${pal.text}35`, borderRadius: 16 * s, color: pal.secondary, fontFamily: MONO, fontSize: 24 * s, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.link}</div>
      <div style={{ marginTop: 23 * s, color: `${pal.text}88`, fontSize: 23 * s }}>{p.subtitle}</div>
    </div>
  </StoryChrome>;
};

const ReplyBubble: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const s = Math.min(width / 1920, 1);
  const enter = spring({ frame: frame - 8, fps, config: { damping: 17, stiffness: 115 } });
  const first = clampInterp(frame, [22, 40], [0, 1]);
  const second = clampInterp(frame, [48, 68], [0, 1]);
  const third = clampInterp(frame, [75, 94], [0, 1]);
  const bubble = (text: string, side: "left" | "right", visible: number) => <div style={{ alignSelf: side === "left" ? "flex-start" : "flex-end", maxWidth: "78%", padding: `${16 * s}px ${22 * s}px`, borderRadius: `${22 * s}px ${22 * s}px ${side === "left" ? 22 * s : 5 * s}px ${side === "right" ? 22 * s : 5 * s}px`, background: side === "left" ? `${pal.text}18` : pal.primary, color: pal.text, fontSize: 24 * s, fontWeight: 700, opacity: visible, transform: `translateY(${interpolate(visible, [0, 1], [25, 0])}px)` }}>{text}</div>;
  return <StoryChrome pal={pal} p={p} active={2} footer={<div style={{ height: 58 * s, borderRadius: 999, background: `${pal.text}12`, border: `1px solid ${pal.text}25`, display: "flex", alignItems: "center", padding: `0 ${20 * s}px`, color: `${pal.text}75`, fontSize: 20 * s }}>Reply to story… <span style={{ marginLeft: "auto", color: pal.accent }}>➤</span></div>}>
    <div style={{ width: Math.min(760 * s, width * 0.74), display: "flex", flexDirection: "column", gap: 17 * s, opacity: enter }}>
      {bubble(p.question, "left", first)}
      {bubble(p.answer, "right", second)}
      {bubble(p.subtitle, "left", third)}
    </div>
  </StoryChrome>;
};

const SwipeUp: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const s = Math.min(width / 1920, 1);
  const enter = spring({ frame: frame - 9, fps, config: { damping: 15, stiffness: 105 } });
  const handY = interpolate(frame % 42, [0, 21, 42], [28, -22, 28]);
  return <StoryChrome pal={pal} p={p} active={3} footer={<div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 * s, color: pal.text, opacity: enter }}><div style={{ fontSize: 20 * s, textTransform: "uppercase", letterSpacing: "0.16em", fontWeight: 850 }}>{p.sticker}</div><div style={{ fontSize: 33 * s, transform: `translateY(${handY * s}px)` }}>⌃</div><div style={{ width: 190 * s, height: 7 * s, borderRadius: 99, background: pal.text }} /></div>}>
    <div style={{ width: Math.min(900 * s, width * 0.82), textAlign: "center", opacity: enter, transform: `translateY(${interpolate(enter, [0, 1], [70, 0])}px)` }}>
      <div style={{ display: "inline-block", padding: `${13 * s}px ${21 * s}px`, borderRadius: 999, background: pal.accent, color: pal.bg, fontSize: 20 * s, fontWeight: 900 }}>{p.link}</div>
      <div style={{ marginTop: 28 * s, color: pal.text, fontSize: "clamp(42px, 6.3vw, 96px)", lineHeight: 0.95, fontWeight: 950, letterSpacing: "-0.06em" }}>{p.headline}</div>
      <div style={{ marginTop: 25 * s, color: pal.secondary, fontSize: 27 * s }}>{p.subtitle}</div>
    </div>
  </StoryChrome>;
};

const StoryProgress: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const s = Math.min(width / 1920, 1);
  const enter = spring({ frame: frame - 8, fps, config: { damping: 16, stiffness: 110 } });
  const active = Math.min(3, Math.floor(frame / 25));
  const labels = [p.headline, p.optionA, p.optionB, p.answer];
  return <StoryChrome pal={pal} p={p} active={active} count={4}>
    <div style={{ width: Math.min(880 * s, width * 0.82), opacity: enter }}>
      <div style={{ color: pal.secondary, fontSize: 20 * s, fontWeight: 850, letterSpacing: "0.17em", textTransform: "uppercase" }}>{p.subtitle}</div>
      <div style={{ marginTop: 17 * s, color: pal.text, fontSize: "clamp(40px, 5.8vw, 88px)", lineHeight: 0.96, fontWeight: 950, letterSpacing: "-0.055em" }}>{labels[active]}</div>
      <div style={{ marginTop: 44 * s, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 * s }}>
        {labels.map((label, i) => <div key={label} style={{ height: 150 * s, padding: `${18 * s}px`, borderRadius: 18 * s, background: i === active ? `${pal.primary}80` : `${pal.text}0d`, border: `1px solid ${i <= active ? pal.accent : `${pal.text}28`}`, opacity: i > active ? 0.48 : 1, transform: `translateY(${i === active ? -10 * s : 0}px)`, transition: "none" }}><div style={{ fontFamily: MONO, fontSize: 17 * s, color: pal.accent }}>0{i + 1}</div><div style={{ marginTop: 17 * s, fontSize: 20 * s, lineHeight: 1.05, fontWeight: 800 }}>{label}</div></div>)}
      </div>
      <div style={{ marginTop: 28 * s, color: `${pal.text}85`, fontSize: 21 * s }}>{p.question}</div>
    </div>
  </StoryChrome>;
};

const VARIANTS: Record<StoriesInteractiveVariant, React.FC<VariantProps>> = {
  "poll-card": PollCard,
  "emoji-slider": EmojiSlider,
  "question-box": QuestionBox,
  "tap-to-reveal": TapToReveal,
  "quiz-answer": QuizAnswer,
  "countdown-sticker": CountdownSticker,
  "link-sticker": LinkSticker,
  "reply-bubble": ReplyBubble,
  "swipe-up": SwipeUp,
  "story-progress": StoryProgress,
};

export const StoriesInteractiveTemplate: React.FC<StoriesInteractiveProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? PollCard;
  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg }}>
      <GradientMeshBackground palette={pal} blobs={5} speed={0.45} />
      <FadeEdges inFrames={8} outFrames={10}>
        <Variant p={props} pal={pal} />
      </FadeEdges>
      <NoiseGrainOverlay opacity={0.03} />
    </AbsoluteFill>
  );
};

const familyCast = (component: React.FC<StoriesInteractiveProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "stories-interactive-poll-card": familyCast(StoriesInteractiveTemplate),
  "stories-interactive-emoji-slider": familyCast(StoriesInteractiveTemplate),
  "stories-interactive-question-box": familyCast(StoriesInteractiveTemplate),
  "stories-interactive-tap-to-reveal": familyCast(StoriesInteractiveTemplate),
  "stories-interactive-quiz-answer": familyCast(StoriesInteractiveTemplate),
  "stories-interactive-countdown-sticker": familyCast(StoriesInteractiveTemplate),
  "stories-interactive-link-sticker": familyCast(StoriesInteractiveTemplate),
  "stories-interactive-reply-bubble": familyCast(StoriesInteractiveTemplate),
  "stories-interactive-swipe-up": familyCast(StoriesInteractiveTemplate),
  "stories-interactive-story-progress": familyCast(StoriesInteractiveTemplate),
};
