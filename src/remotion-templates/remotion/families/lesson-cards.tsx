import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, clampInterp, resolvePalette, type Palette } from "../lib/primitives";

/**
 * FAMILY: lesson-cards
 * Ten modular micro-learning compositions for definitions, examples, practice,
 * correction, recap, and a final action. Defaults are intentionally textual and
 * asset-free so an agent can swap in lesson content without adding media.
 */
type LessonVariant =
  | "definition-card"
  | "formula-card"
  | "flashcard-flip"
  | "worked-example"
  | "three-step-lesson"
  | "mistake-correction"
  | "quiz-card"
  | "memory-palace"
  | "recap-grid"
  | "lesson-to-action";

export interface LessonCardProps {
  variant: LessonVariant;
  lessonTitle: string;
  concept: string;
  examples?: string[];
  answers?: string[];
  cards?: string[];
  steps?: string[];
  question?: string;
  formula?: string;
  correctAnswer?: string;
  action?: string;
  paletteName: string;
  accentColor?: string;
  progress?: number;
}

type VariantProps = { p: LessonCardProps; pal: Palette };
const SANS = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const SERIF = 'Georgia, "Times New Roman", serif';

const values = (input: string[] | undefined, fallback: string[], count = 6): string[] => {
  const clean = (input ?? []).map((x) => String(x).trim()).filter(Boolean);
  return (clean.length ? clean : fallback).slice(0, count);
};

const LessonBackdrop: React.FC<{ pal: Palette; accent: string }> = ({ pal, accent }) => (
  <AbsoluteFill
    style={{
      backgroundColor: pal.bg,
      backgroundImage: `radial-gradient(circle at 15% 12%, ${accent}22, transparent 34%), radial-gradient(circle at 86% 86%, ${pal.secondary}18, transparent 38%)`,
    }}
  />
);

const Eyebrow: React.FC<{ children: React.ReactNode; pal: Palette; accent: string }> = ({ children, pal, accent }) => (
  <div style={{ fontFamily: MONO, color: accent, fontSize: 18, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" }}>
    {children}
  </div>
);

const Progress: React.FC<{ pal: Palette; accent: string; value: number }> = ({ pal, accent, value }) => (
  <div style={{ height: 8, borderRadius: 8, background: `${pal.secondary}30`, overflow: "hidden" }}>
    <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: "100%", borderRadius: 8, background: accent }} />
  </div>
);

const Panel: React.FC<{
  children: React.ReactNode;
  pal: Palette;
  accent: string;
  style?: React.CSSProperties;
}> = ({ children, pal, accent, style }) => (
  <div style={{ border: `1px solid ${pal.secondary}40`, borderRadius: 28, background: `${pal.bg}dd`, boxShadow: `0 26px 80px ${pal.bg}99`, ...style }}>
    {children}
  </div>
);

const Header: React.FC<{ p: LessonCardProps; pal: Palette; accent: string; label?: string }> = ({ p, pal, accent, label = "MICRO LESSON" }) => (
  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 50 }}>
    <div>
      <Eyebrow pal={pal} accent={accent}>{label}</Eyebrow>
      <div style={{ marginTop: 18, color: pal.text, fontFamily: SANS, fontSize: 58, lineHeight: 1.04, fontWeight: 850, letterSpacing: "-0.04em" }}>{p.lessonTitle}</div>
    </div>
    <div style={{ minWidth: 190, paddingTop: 5 }}>
      <div style={{ marginBottom: 11, color: pal.secondary, fontFamily: MONO, fontSize: 15, letterSpacing: "0.12em", textAlign: "right" }}>PROGRESS</div>
      <Progress pal={pal} accent={accent} value={p.progress ?? 42} />
    </div>
  </div>
);

const DefinitionCard: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const accent = p.accentColor || pal.accent;
  const reveal = clampInterp(frame, [12, 40], [0, 1]);
  return (
    <AbsoluteFill style={{ padding: "88px 112px", justifyContent: "center" }}>
      <Header p={p} pal={pal} accent={accent} />
      <Panel pal={pal} accent={accent} style={{ marginTop: 70, padding: "70px 84px", minHeight: 430, opacity: reveal, transform: `translateY(${(1 - reveal) * 34}px)` }}>
        <Eyebrow pal={pal} accent={accent}>KEY CONCEPT</Eyebrow>
        <div style={{ marginTop: 28, color: pal.text, fontFamily: SERIF, fontSize: 74, lineHeight: 1.08, fontWeight: 700 }}>{p.concept}</div>
        <div style={{ marginTop: 38, width: 130, height: 7, background: accent, transform: `scaleX(${reveal})`, transformOrigin: "left" }} />
        <div style={{ marginTop: 35, color: pal.secondary, fontFamily: SANS, fontSize: 27, lineHeight: 1.35 }}>A clear definition is the first handle your audience can use to remember the idea.</div>
      </Panel>
    </AbsoluteFill>
  );
};

const FormulaCard: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const accent = p.accentColor || pal.accent;
  const equation = p.formula || `${p.concept} = signal × context`;
  const parts = values(p.examples, ["Name the inputs", "Choose the relationship", "Check the result"], 3);
  return (
    <AbsoluteFill style={{ padding: "80px 110px", justifyContent: "center" }}>
      <Header p={p} pal={pal} accent={accent} label="FORMULA / METHOD" />
      <Panel pal={pal} accent={accent} style={{ marginTop: 54, padding: "55px 74px" }}>
        <div style={{ color: pal.secondary, fontFamily: MONO, fontSize: 17, letterSpacing: "0.16em" }}>THE RELATIONSHIP</div>
        <div style={{ margin: "34px 0 52px", padding: "34px 42px", borderRadius: 18, background: `${accent}1c`, color: pal.text, fontFamily: SERIF, fontSize: 66, fontWeight: 700, textAlign: "center" }}>{equation}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
          {parts.map((item, i) => {
            const t = clampInterp(frame, [34 + i * 9, 52 + i * 9], [0, 1]);
            return <div key={item} style={{ padding: "22px 24px", borderTop: `3px solid ${i === 1 ? accent : pal.secondary}88`, color: pal.text, fontFamily: SANS, fontSize: 23, lineHeight: 1.22, opacity: t, transform: `translateY(${(1 - t) * 18}px)` }}><span style={{ display: "block", marginBottom: 11, color: accent, fontFamily: MONO, fontSize: 15 }}>0{i + 1}</span>{item}</div>;
          })}
        </div>
      </Panel>
    </AbsoluteFill>
  );
};

const FlashcardFlip: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = p.accentColor || pal.accent;
  const flip = spring({ frame: Math.max(0, frame - 32), fps, config: { damping: 14, stiffness: 90, mass: 0.8 } });
  const cards = values(p.cards, [p.concept, "Recall the idea before you see the answer."] , 2);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", perspective: 1500 }}>
      <div style={{ position: "absolute", top: 72, left: 95, right: 95 }}><Header p={p} pal={pal} accent={accent} label="RECALL / REVEAL" /></div>
      <div style={{ width: 760, height: 520, position: "relative", transformStyle: "preserve-3d", transform: `rotateY(${flip * 180}deg)`, transition: "none" }}>
        <Panel pal={pal} accent={accent} style={{ position: "absolute", inset: 0, padding: 65, backfaceVisibility: "hidden", background: `linear-gradient(135deg, ${accent}28, ${pal.bg}f4)` }}>
          <Eyebrow pal={pal} accent={accent}>PROMPT</Eyebrow><div style={{ marginTop: 50, color: pal.text, fontFamily: SERIF, fontSize: 64, lineHeight: 1.1, fontWeight: 700 }}>{cards[0]}</div><div style={{ position: "absolute", bottom: 54, color: pal.secondary, fontFamily: MONO, fontSize: 17, letterSpacing: "0.12em" }}>THINK FIRST · FLIP TO REVEAL</div>
        </Panel>
        <Panel pal={pal} accent={accent} style={{ position: "absolute", inset: 0, padding: 65, backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: pal.text, color: pal.bg }}>
          <Eyebrow pal={{ ...pal, text: pal.bg }} accent={accent}>ANSWER</Eyebrow><div style={{ marginTop: 50, color: pal.bg, fontFamily: SANS, fontSize: 44, lineHeight: 1.2, fontWeight: 800 }}>{cards[1]}</div><div style={{ position: "absolute", bottom: 54, color: `${pal.bg}99`, fontFamily: MONO, fontSize: 17, letterSpacing: "0.12em" }}>RECALL LOCKED IN</div>
        </Panel>
      </div>
    </AbsoluteFill>
  );
};

const WorkedExample: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const accent = p.accentColor || pal.accent;
  const rows = values(p.steps, ["Identify the given information", "Apply the method to the example", "Explain why the result makes sense", "State the answer in context"], 4);
  return (
    <AbsoluteFill style={{ padding: "78px 105px", justifyContent: "center" }}>
      <Header p={p} pal={pal} accent={accent} label="WORKED EXAMPLE" />
      <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: 34, marginTop: 54 }}>
        <Panel pal={pal} accent={accent} style={{ padding: 46, minHeight: 490 }}><Eyebrow pal={pal} accent={accent}>QUESTION</Eyebrow><div style={{ marginTop: 28, color: pal.text, fontFamily: SERIF, fontSize: 47, lineHeight: 1.15 }}>{p.question || `How does ${p.concept} work in practice?`}</div><div style={{ marginTop: 48, padding: "22px 24px", borderLeft: `5px solid ${accent}`, color: pal.secondary, fontFamily: MONO, fontSize: 18 }}>FOLLOW THE STEPS →</div></Panel>
        <Panel pal={pal} accent={accent} style={{ padding: 46 }}><Eyebrow pal={pal} accent={accent}>SOLUTION</Eyebrow>{rows.map((row, i) => { const t = clampInterp(frame, [16 + i * 11, 34 + i * 11], [0, 1]); return <div key={row} style={{ display: "flex", gap: 22, alignItems: "flex-start", marginTop: 28, opacity: t, transform: `translateX(${(1 - t) * 24}px)` }}><div style={{ width: 43, height: 43, flex: "0 0 43px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: i === rows.length - 1 ? accent : `${pal.secondary}24`, color: i === rows.length - 1 ? pal.bg : pal.text, fontFamily: MONO, fontSize: 17 }}>{i + 1}</div><div style={{ paddingTop: 8, color: pal.text, fontFamily: SANS, fontSize: 24, lineHeight: 1.25 }}>{row}</div></div>; })}</Panel>
      </div>
    </AbsoluteFill>
  );
};

const ThreeStepLesson: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const accent = p.accentColor || pal.accent;
  const steps = values(p.steps, ["Understand the idea", "Try one example", "Use it yourself"], 3);
  return (
    <AbsoluteFill style={{ padding: "92px 108px", justifyContent: "center" }}>
      <Header p={p} pal={pal} accent={accent} label="THREE STEP LESSON" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22, marginTop: 68 }}>
        {steps.map((step, i) => { const t = clampInterp(frame, [10 + i * 12, 32 + i * 12], [0, 1]); return <Panel key={step} pal={pal} accent={accent} style={{ minHeight: 350, padding: 38, opacity: t, transform: `translateY(${(1 - t) * 38}px)` }}><div style={{ color: accent, fontFamily: MONO, fontSize: 52, fontWeight: 800 }}>0{i + 1}</div><div style={{ marginTop: 62, color: pal.text, fontFamily: SANS, fontSize: 31, lineHeight: 1.14, fontWeight: 750 }}>{step}</div><div style={{ position: "absolute", width: 30, height: 4, marginTop: 36, background: i === 2 ? accent : pal.secondary }} /></Panel>; })}
      </div>
    </AbsoluteFill>
  );
};

const MistakeCorrection: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const accent = p.accentColor || pal.accent;
  const wrong = values(p.examples, ["Using the wrong input", "Skipping the middle step"], 2);
  const correct = p.correctAnswer || "Name the idea, show the step, then check the result.";
  const t = clampInterp(frame, [24, 45], [0, 1]);
  return (
    <AbsoluteFill style={{ padding: "88px 108px", justifyContent: "center" }}>
      <Header p={p} pal={pal} accent={accent} label="MISTAKE → FIX" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 25, marginTop: 58 }}>
        <Panel pal={pal} accent={accent} style={{ minHeight: 420, padding: 48, borderColor: `${pal.accent}88` }}><Eyebrow pal={pal} accent={pal.accent}>COMMON MISSTEP</Eyebrow>{wrong.map((x) => <div key={x} style={{ marginTop: 28, padding: "20px 24px", borderRadius: 14, background: `${pal.accent}16`, color: pal.text, fontFamily: SANS, fontSize: 25 }}>× {x}</div>)}</Panel>
        <Panel pal={pal} accent={accent} style={{ minHeight: 420, padding: 48, borderColor: `${accent}88`, opacity: t, transform: `translateX(${(1 - t) * 32}px)` }}><Eyebrow pal={pal} accent={accent}>BETTER MOVE</Eyebrow><div style={{ marginTop: 40, color: pal.text, fontFamily: SANS, fontSize: 32, lineHeight: 1.22, fontWeight: 700 }}>✓ {correct}</div><div style={{ marginTop: 45, color: pal.secondary, fontFamily: MONO, fontSize: 17, letterSpacing: "0.1em" }}>CHECK YOUR ASSUMPTIONS</div></Panel>
      </div>
    </AbsoluteFill>
  );
};

const QuizCard: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const accent = p.accentColor || pal.accent;
  const options = values(p.answers, ["The first approach", "The second approach", "The careful approach", "None of these"], 4);
  const selected = Math.min(2, options.length - 1);
  const answerReveal = clampInterp(frame, [62, 83], [0, 1]);
  return (
    <AbsoluteFill style={{ padding: "82px 108px", justifyContent: "center" }}>
      <Header p={p} pal={pal} accent={accent} label="QUICK CHECK" />
      <Panel pal={pal} accent={accent} style={{ marginTop: 58, padding: "46px 62px" }}><div style={{ color: pal.text, fontFamily: SERIF, fontSize: 47, lineHeight: 1.15 }}>{p.question || `Which statement best describes ${p.concept}?`}</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 38 }}>{options.map((option, i) => { const chosen = i === selected; const hovered = clampInterp(frame, [24 + i * 5, 39 + i * 5], [0, 1]); return <div key={option} style={{ padding: "21px 24px", borderRadius: 14, border: `2px solid ${chosen && answerReveal > 0.5 ? accent : pal.secondary}55`, background: chosen && answerReveal > 0.5 ? `${accent}24` : `${pal.secondary}0c`, opacity: hovered, transform: `translateY(${(1 - hovered) * 15}px)`, color: pal.text, fontFamily: SANS, fontSize: 23 }}><span style={{ marginRight: 14, color: accent, fontFamily: MONO }}>{String.fromCharCode(65 + i)}</span>{option}</div>; })}</div><div style={{ marginTop: 34, minHeight: 34, opacity: answerReveal, color: accent, fontFamily: MONO, fontSize: 19, letterSpacing: "0.1em" }}>ANSWER: {p.correctAnswer || options[selected]}</div></Panel>
    </AbsoluteFill>
  );
};

const MemoryPalace: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const accent = p.accentColor || pal.accent;
  const rooms = values(p.cards, ["Entrance: name the idea", "Library: connect an example", "Studio: practice the move", "Exit: recall the result"], 4);
  const lineProgress = clampInterp(frame, [8, 92], [0, 1]);
  return (
    <AbsoluteFill style={{ padding: "82px 105px", justifyContent: "center" }}>
      <Header p={p} pal={pal} accent={accent} label="MEMORY PALACE" />
      <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginTop: 88 }}>
        <div style={{ position: "absolute", top: 40, left: "7%", right: "7%", height: 4, background: `linear-gradient(90deg, ${accent} ${lineProgress * 100}%, ${pal.secondary}28 ${lineProgress * 100}%)` }} />
        {rooms.map((room, i) => { const t = clampInterp(frame, [12 + i * 10, 30 + i * 10], [0, 1]); return <div key={room} style={{ position: "relative", zIndex: 1, opacity: t, transform: `scale(${0.84 + t * 0.16})` }}><div style={{ width: 82, height: 82, margin: "0 auto 28px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: i === 0 ? accent : pal.bg, border: `4px solid ${i <= Math.floor(lineProgress * rooms.length) ? accent : pal.secondary}88`, color: i === 0 ? pal.bg : pal.text, fontFamily: MONO, fontSize: 23 }}>{i + 1}</div><Panel pal={pal} accent={accent} style={{ minHeight: 180, padding: 24, textAlign: "center" }}><div style={{ color: pal.text, fontFamily: SANS, fontSize: 22, lineHeight: 1.22, fontWeight: 700 }}>{room}</div></Panel></div>; })}
      </div>
    </AbsoluteFill>
  );
};

const RecapGrid: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const accent = p.accentColor || pal.accent;
  const recap = values(p.cards, ["Define the concept", "See one example", "Avoid the common mistake", "Try it yourself", "Say it back"], 5);
  return (
    <AbsoluteFill style={{ padding: "80px 112px", justifyContent: "center" }}>
      <Header p={p} pal={pal} accent={accent} label="RECAP / REMEMBER" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginTop: 54 }}>{recap.map((item, i) => { const t = clampInterp(frame, [8 + i * 8, 25 + i * 8], [0, 1]); return <Panel key={item} pal={pal} accent={accent} style={{ minHeight: 190, padding: 28, opacity: t, transform: `translateY(${(1 - t) * 22}px)`, gridColumn: i === 3 ? "2" : undefined }}><div style={{ color: accent, fontFamily: MONO, fontSize: 16, letterSpacing: "0.14em" }}>TAKEAWAY {String(i + 1).padStart(2, "0")}</div><div style={{ marginTop: 23, color: pal.text, fontFamily: SANS, fontSize: 25, lineHeight: 1.18, fontWeight: 700 }}>{item}</div></Panel>; })}</div>
    </AbsoluteFill>
  );
};

const LessonToAction: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const accent = p.accentColor || pal.accent;
  const actions = values(p.steps, ["Write the idea in your own words", "Use it on one real example", "Teach it to someone else"], 3);
  const done = clampInterp(frame, [55, 92], [0, 1]);
  return (
    <AbsoluteFill style={{ padding: "90px 112px", justifyContent: "center" }}>
      <Header p={p} pal={pal} accent={accent} label="NEXT ACTION" />
      <Panel pal={pal} accent={accent} style={{ marginTop: 62, padding: "45px 58px" }}><div style={{ color: pal.text, fontFamily: SERIF, fontSize: 50, lineHeight: 1.12 }}>{p.action || `Now use ${p.concept} in one small project.`}</div><div style={{ marginTop: 42 }}>{actions.map((item, i) => { const t = clampInterp(frame, [10 + i * 10, 28 + i * 10], [0, 1]); const complete = done > 0.45 && i < 2; return <div key={item} style={{ display: "flex", alignItems: "center", gap: 22, padding: "21px 0", borderTop: `1px solid ${pal.secondary}30`, color: pal.text, fontFamily: SANS, fontSize: 25, opacity: t, transform: `translateX(${(1 - t) * 22}px)` }}><div style={{ width: 39, height: 39, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: `2px solid ${complete ? accent : pal.secondary}99`, background: complete ? accent : "transparent", color: complete ? pal.bg : pal.secondary, fontFamily: MONO, fontSize: 17 }}>{complete ? "✓" : i + 1}</div>{item}</div>; })}</div><div style={{ marginTop: 20 }}><Progress pal={pal} accent={accent} value={Math.max(p.progress ?? 42, done * 100)} /></div></Panel>
    </AbsoluteFill>
  );
};

const VARIANTS: Record<LessonVariant, React.FC<VariantProps>> = {
  "definition-card": DefinitionCard,
  "formula-card": FormulaCard,
  "flashcard-flip": FlashcardFlip,
  "worked-example": WorkedExample,
  "three-step-lesson": ThreeStepLesson,
  "mistake-correction": MistakeCorrection,
  "quiz-card": QuizCard,
  "memory-palace": MemoryPalace,
  "recap-grid": RecapGrid,
  "lesson-to-action": LessonToAction,
};

export const LessonCardsTemplate: React.FC<LessonCardProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const accent = props.accentColor || pal.accent;
  const Variant = VARIANTS[props.variant] ?? DefinitionCard;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg, overflow: "hidden" }}>
      <LessonBackdrop pal={pal} accent={accent} />
      <FadeEdges inFrames={9} outFrames={12}><div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><Variant p={props} pal={pal} /></div></FadeEdges>
    </AbsoluteFill>
  );
};

const familyCast = (component: React.FC<LessonCardProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "lesson-cards-definition-card": familyCast(LessonCardsTemplate),
  "lesson-cards-formula-card": familyCast(LessonCardsTemplate),
  "lesson-cards-flashcard-flip": familyCast(LessonCardsTemplate),
  "lesson-cards-worked-example": familyCast(LessonCardsTemplate),
  "lesson-cards-three-step-lesson": familyCast(LessonCardsTemplate),
  "lesson-cards-mistake-correction": familyCast(LessonCardsTemplate),
  "lesson-cards-quiz-card": familyCast(LessonCardsTemplate),
  "lesson-cards-memory-palace": familyCast(LessonCardsTemplate),
  "lesson-cards-recap-grid": familyCast(LessonCardsTemplate),
  "lesson-cards-lesson-to-action": familyCast(LessonCardsTemplate),
};
