import React from "react";
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, clampInterp, resolvePalette, type Palette } from "../lib/primitives";

/**
 * FAMILY: interview-frames
 * Ten editorial interview layouts with deterministic speaker IDs, question
 * cards, split interviews, quote emphasis, remote-call framing, and chapter
 * transitions. Portrait and video URLs are optional; defaults are procedural.
 */
export type InterviewVariant =
  | "speaker-lower-third"
  | "question-card"
  | "dual-interview"
  | "quote-punch"
  | "remote-call"
  | "expert-intro"
  | "topic-divider"
  | "answer-highlight"
  | "speaker-compare"
  | "interview-close";

export interface InterviewSpeaker {
  name: string;
  role?: string;
  organization?: string;
  portraitUrl?: string;
  accent?: string;
}

export interface InterviewFramesProps {
  variant: InterviewVariant;
  speaker: string;
  role: string;
  organization?: string;
  question: string;
  answer: string;
  quote: string;
  topic: string;
  chapter?: string;
  timestamp?: string;
  label?: string;
  logo?: string;
  paletteName: string;
  accentColor?: string;
  portraitUrls?: string[];
  videoUrls?: string[];
  captions?: string[];
  speakers?: InterviewSpeaker[];
  showPortrait?: boolean;
  showProgress?: boolean;
}

const SANS = 'Inter, "Helvetica Neue", Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';

const initials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";

const SpeakerAvatar: React.FC<{
  name: string;
  pal: Palette;
  accent: string;
  portraitUrl?: string;
  size?: number;
}> = ({ name, pal, accent, portraitUrl, size = 112 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.22,
      overflow: "hidden",
      flex: `0 0 ${size}px`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: pal.text,
      fontFamily: SANS,
      fontWeight: 850,
      fontSize: size * 0.3,
      background: `linear-gradient(145deg, ${accent}, ${pal.bg})`,
      border: `2px solid ${accent}aa`,
      boxShadow: `0 12px 35px ${pal.bg}99`,
    }}
  >
    {portraitUrl ? (
      <Img src={portraitUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    ) : (
      initials(name)
    )}
  </div>
);

const Backdrop: React.FC<{ pal: Palette; accent: string; grid?: boolean }> = ({ pal, accent, grid = false }) => (
  <AbsoluteFill
    style={{
      backgroundColor: pal.bg,
      backgroundImage: grid
        ? `linear-gradient(${pal.secondary}13 1px, transparent 1px), linear-gradient(90deg, ${pal.secondary}13 1px, transparent 1px), radial-gradient(circle at 75% 15%, ${accent}33, transparent 35%)`
        : `radial-gradient(circle at 18% 20%, ${accent}2b, transparent 38%), radial-gradient(circle at 88% 80%, ${pal.primary}24, transparent 36%)`,
      backgroundSize: grid ? "64px 64px, 64px 64px, auto" : undefined,
    }}
  />
);

const Kicker: React.FC<{ children: React.ReactNode; pal: Palette; accent: string }> = ({ children, pal, accent }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, color: pal.secondary, fontFamily: SANS, fontSize: 20, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase" }}>
    <span style={{ width: 42, height: 4, borderRadius: 4, background: accent }} />
    {children}
  </div>
);

const Progress: React.FC<{ pal: Palette; accent: string; show: boolean }> = ({ pal, accent, show }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  if (!show) return null;
  return (
    <div style={{ position: "absolute", left: 72, right: 72, bottom: 48, height: 4, background: `${pal.secondary}35`, borderRadius: 4 }}>
      <div style={{ width: `${clampInterp(frame, [0, durationInFrames], [0, 100])}%`, height: "100%", background: accent, borderRadius: 4 }} />
    </div>
  );
};

const Identity: React.FC<{ p: InterviewFramesProps; pal: Palette; accent: string; index?: number; compact?: boolean }> = ({ p, pal, accent, index = 0, compact = false }) => {
  const speaker = p.speakers?.[index];
  const name = speaker?.name ?? (index === 0 ? p.speaker : "Jordan Lee");
  const role = speaker?.role ?? (index === 0 ? p.role : "Host & Moderator");
  const organization = speaker?.organization ?? (index === 0 ? p.organization : undefined);
  const portrait = speaker?.portraitUrl ?? p.portraitUrls?.[index];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: compact ? 14 : 22 }}>
      <SpeakerAvatar name={name} pal={pal} accent={speaker?.accent ?? accent} portraitUrl={portrait} size={compact ? 58 : 104} />
      <div style={{ fontFamily: SANS }}>
        <div style={{ color: pal.text, fontSize: compact ? 23 : 31, fontWeight: 850, lineHeight: 1.1 }}>{name}</div>
        <div style={{ color: pal.secondary, fontSize: compact ? 17 : 21, marginTop: 8 }}>{role}{organization ? ` · ${organization}` : ""}</div>
      </div>
    </div>
  );
};

const SpeakerLowerThird: React.FC<{ p: InterviewFramesProps; pal: Palette; accent: string }> = ({ p, pal, accent }) => {
  const frame = useCurrentFrame();
  const x = clampInterp(frame, [4, 26], [-980, 0]);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 0 128px 92px" }}>
      <div style={{ transform: `translateX(${x}px)`, display: "flex", alignItems: "stretch" }}>
        <div style={{ width: 10, background: accent }} />
        <div style={{ padding: "28px 42px 26px 36px", minWidth: 760, background: `${pal.bg}ee`, border: `1px solid ${pal.secondary}45` }}>
          <Kicker pal={pal} accent={accent}>{p.label ?? "IN CONVERSATION"}</Kicker>
          <div style={{ marginTop: 13 }}><Identity p={p} pal={pal} accent={accent} compact /></div>
        </div>
      </div>
      <div style={{ marginTop: 22, marginLeft: 18, color: pal.secondary, fontFamily: SANS, fontSize: 19, letterSpacing: "0.08em" }}>{p.topic} {p.timestamp ? `· ${p.timestamp}` : ""}</div>
    </AbsoluteFill>
  );
};

const QuestionCard: React.FC<{ p: InterviewFramesProps; pal: Palette; accent: string }> = ({ p, pal, accent }) => {
  const frame = useCurrentFrame();
  const reveal = clampInterp(frame, [8, 34], [0, 1]);
  return (
    <AbsoluteFill style={{ padding: "140px 160px", justifyContent: "center" }}>
      <Kicker pal={pal} accent={accent}>{p.chapter ?? "THE QUESTION"}</Kicker>
      <div style={{ marginTop: 44, maxWidth: 1450, color: pal.text, fontFamily: SERIF, fontSize: 76, lineHeight: 1.16, clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)` }}>“{p.question}”</div>
      <div style={{ marginTop: 48, opacity: clampInterp(frame, [30, 50], [0, 1]), transform: `translateY(${clampInterp(frame, [30, 50], [20, 0])}px)` }}><Identity p={p} pal={pal} accent={accent} compact /></div>
      <div style={{ position: "absolute", right: 120, top: 90, color: `${accent}40`, fontFamily: SERIF, fontSize: 340, lineHeight: 1 }}>?</div>
    </AbsoluteFill>
  );
};

const DualInterview: React.FC<{ p: InterviewFramesProps; pal: Palette; accent: string }> = ({ p, pal, accent }) => {
  const frame = useCurrentFrame();
  const split = clampInterp(frame, [8, 30], [0, 50]);
  return (
    <AbsoluteFill style={{ flexDirection: "row", background: pal.bg }}>
      {[0, 1].map((i) => {
        const left = i === 0 ? 0 : split;
        const width = i === 0 ? 100 - split : split;
        return <div key={i} style={{ position: "absolute", left: `${left}%`, width: `${width}%`, top: 0, bottom: 0, padding: "118px 82px", boxSizing: "border-box", background: i === 0 ? `linear-gradient(145deg, ${pal.primary}18, transparent)` : `linear-gradient(210deg, ${accent}24, transparent)`, borderRight: i === 0 ? `2px solid ${accent}` : undefined }}>
          <div style={{ height: 430, borderRadius: 30, border: `2px solid ${(i === 0 ? pal.primary : accent)}66`, background: `radial-gradient(circle at 50% 35%, ${(i === 0 ? pal.primary : accent)}32, transparent 45%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <SpeakerAvatar name={p.speakers?.[i]?.name ?? (i === 0 ? p.speaker : "Jordan Lee")} pal={pal} accent={i === 0 ? pal.primary : accent} portraitUrl={p.speakers?.[i]?.portraitUrl ?? p.portraitUrls?.[i]} size={190} />
          </div>
          <div style={{ marginTop: 36, opacity: clampInterp(frame, [25, 42], [0, 1]) }}><Identity p={p} pal={pal} accent={i === 0 ? pal.primary : accent} index={i} /></div>
        </div>;
      })}
      <div style={{ position: "absolute", left: "50%", top: "47%", transform: "translate(-50%, -50%)", width: 76, height: 76, borderRadius: "50%", background: accent, color: pal.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 900, fontSize: 24 }}>VS</div>
    </AbsoluteFill>
  );
};

const QuotePunch: React.FC<{ p: InterviewFramesProps; pal: Palette; accent: string }> = ({ p, pal, accent }) => {
  const frame = useCurrentFrame();
  const scale = clampInterp(frame, [0, 18, 34], [0.78, 1.04, 1]);
  return (
    <AbsoluteFill style={{ padding: 150, justifyContent: "center", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 48, top: -120, color: `${accent}32`, fontFamily: SERIF, fontSize: 720, lineHeight: 1 }}>“</div>
      <div style={{ position: "relative", transform: `scale(${scale})`, transformOrigin: "left center", maxWidth: 1500 }}>
        <div style={{ color: pal.text, fontFamily: SERIF, fontSize: 83, lineHeight: 1.16, fontWeight: 600 }}>“{p.quote}”</div>
        <div style={{ marginTop: 42, opacity: clampInterp(frame, [26, 46], [0, 1]) }}><Identity p={p} pal={pal} accent={accent} compact /></div>
      </div>
      <div style={{ position: "absolute", right: 92, bottom: 96, color: accent, fontFamily: SANS, fontSize: 22, letterSpacing: "0.16em", textTransform: "uppercase" }}>A WORD FROM {p.speaker}</div>
    </AbsoluteFill>
  );
};

const RemoteCall: React.FC<{ p: InterviewFramesProps; pal: Palette; accent: string }> = ({ p, pal, accent }) => {
  const frame = useCurrentFrame();
  const rise = clampInterp(frame, [6, 28], [60, 0]);
  return (
    <AbsoluteFill style={{ padding: 80 }}>
      <div style={{ position: "absolute", inset: 80, border: `2px solid ${pal.secondary}55`, borderRadius: 32, overflow: "hidden", background: `${pal.primary}0f` }}>
        <div style={{ height: 68, padding: "0 28px", display: "flex", alignItems: "center", gap: 12, background: `${pal.bg}dd`, borderBottom: `1px solid ${pal.secondary}35`, fontFamily: SANS }}>
          <span style={{ width: 13, height: 13, borderRadius: "50%", background: "#ff5f57" }} /><span style={{ width: 13, height: 13, borderRadius: "50%", background: "#febc2e" }} /><span style={{ width: 13, height: 13, borderRadius: "50%", background: "#28c840" }} />
          <span style={{ marginLeft: 18, color: pal.secondary, fontSize: 18 }}>remote conversation · {p.topic}</span>
        </div>
        <div style={{ display: "flex", gap: 24, padding: 38, height: "calc(100% - 68px)", boxSizing: "border-box" }}>
          <div style={{ flex: 1, borderRadius: 22, border: `1px solid ${pal.primary}66`, display: "flex", alignItems: "center", justifyContent: "center", background: `${pal.primary}16` }}><SpeakerAvatar name={p.speaker} pal={pal} accent={pal.primary} portraitUrl={p.portraitUrls?.[0]} size={170} /></div>
          <div style={{ flex: 0.42, minWidth: 240, borderRadius: 22, border: `1px solid ${accent}66`, display: "flex", alignItems: "center", justifyContent: "center", background: `${accent}16` }}><SpeakerAvatar name={p.speakers?.[1]?.name ?? "Jordan Lee"} pal={pal} accent={accent} portraitUrl={p.speakers?.[1]?.portraitUrl ?? p.portraitUrls?.[1]} size={105} /></div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 118, bottom: 132, transform: `translateY(${rise}px)`, padding: "20px 28px", background: pal.bg, borderLeft: `8px solid ${accent}`, fontFamily: SANS }}><div style={{ color: pal.text, fontWeight: 850, fontSize: 28 }}>{p.speaker}</div><div style={{ color: pal.secondary, fontSize: 18, marginTop: 6 }}>{p.role}</div></div>
    </AbsoluteFill>
  );
};

const ExpertIntro: React.FC<{ p: InterviewFramesProps; pal: Palette; accent: string }> = ({ p, pal, accent }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", padding: "110px 150px", gap: 78 }}>
      <div style={{ width: 360, height: 480, borderRadius: 32, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(145deg, ${accent}66, ${pal.primary}22)`, border: `2px solid ${accent}99`, transform: `translateY(${clampInterp(frame, [0, 26], [75, 0])}px)` }}><SpeakerAvatar name={p.speaker} pal={pal} accent={accent} portraitUrl={p.portraitUrls?.[0]} size={220} /></div>
      <div style={{ flex: 1, opacity: clampInterp(frame, [18, 42], [0, 1]) }}><Kicker pal={pal} accent={accent}>{p.label ?? "MEET THE EXPERT"}</Kicker><div style={{ marginTop: 26, color: pal.text, fontFamily: SANS, fontSize: 78, fontWeight: 850, lineHeight: 1.02 }}>{p.speaker}</div><div style={{ marginTop: 22, color: accent, fontFamily: SANS, fontSize: 30, fontWeight: 700 }}>{p.role}</div><div style={{ marginTop: 18, color: pal.secondary, fontFamily: SANS, fontSize: 24 }}>{p.organization ?? p.topic}</div></div>
    </AbsoluteFill>
  );
};

const TopicDivider: React.FC<{ p: InterviewFramesProps; pal: Palette; accent: string }> = ({ p, pal, accent }) => {
  const frame = useCurrentFrame();
  const width = clampInterp(frame, [4, 28], [0, 100]);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 120 }}>
      <div style={{ width: "100%", height: 2, background: pal.secondary, transform: `scaleX(${width / 100})`, transformOrigin: "left" }} />
      <div style={{ alignSelf: "flex-start", marginTop: 45, color: accent, fontFamily: SANS, fontSize: 22, letterSpacing: "0.2em", textTransform: "uppercase" }}>{p.chapter ?? "CHAPTER 01"}</div>
      <div style={{ alignSelf: "flex-start", marginTop: 22, color: pal.text, fontFamily: SERIF, fontSize: 94, lineHeight: 1.05, opacity: clampInterp(frame, [18, 40], [0, 1]) }}>{p.topic}</div>
      <div style={{ alignSelf: "flex-start", marginTop: 28, color: pal.secondary, fontFamily: SANS, fontSize: 24, opacity: clampInterp(frame, [30, 50], [0, 1]) }}>{p.question}</div>
    </AbsoluteFill>
  );
};

const AnswerHighlight: React.FC<{ p: InterviewFramesProps; pal: Palette; accent: string }> = ({ p, pal, accent }) => {
  const frame = useCurrentFrame();
  const line = clampInterp(frame, [18, 43], [0, 100]);
  const caption = p.captions?.[0] ?? p.answer;
  return (
    <AbsoluteFill style={{ padding: "118px 145px", justifyContent: "center" }}>
      <Kicker pal={pal} accent={accent}>ANSWER</Kicker>
      <div style={{ marginTop: 38, maxWidth: 1500, color: pal.text, fontFamily: SANS, fontSize: 58, lineHeight: 1.28, fontWeight: 650 }}>{p.answer}</div>
      <div style={{ marginTop: 54, height: 11, width: `${line}%`, background: accent, borderRadius: 6 }} />
      <div style={{ marginTop: 24, color: pal.secondary, fontFamily: SANS, fontSize: 25, maxWidth: 1100 }}>{caption}</div>
      <div style={{ position: "absolute", right: 130, top: 122, padding: "14px 20px", border: `1px solid ${pal.secondary}55`, color: pal.secondary, fontFamily: SANS, fontSize: 18 }}>{p.timestamp ?? "01:24"}</div>
    </AbsoluteFill>
  );
};

const SpeakerCompare: React.FC<{ p: InterviewFramesProps; pal: Palette; accent: string }> = ({ p, pal, accent }) => {
  const frame = useCurrentFrame();
  const second = p.speakers?.[1] ?? { name: "Jordan Lee", role: "Host" };
  return (
    <AbsoluteFill style={{ padding: "100px 120px" }}>
      <Kicker pal={pal} accent={accent}>TWO PERSPECTIVES</Kicker>
      <div style={{ display: "flex", gap: 36, marginTop: 48, height: 600 }}>
        {[{ name: p.speaker, role: p.role, quote: p.quote, color: pal.primary, portraitUrl: p.portraitUrls?.[0] }, { name: second.name, role: second.role ?? "Guest", quote: p.answer, color: accent, portraitUrl: second.portraitUrl ?? p.portraitUrls?.[1] }].map((s, i) => (
          <div key={s.name} style={{ flex: 1, padding: 42, borderRadius: 28, border: `2px solid ${s.color}77`, background: `${s.color}18`, transform: `translateY(${clampInterp(frame, [8 + i * 7, 30 + i * 7], [70, 0])}px)` }}>
            <Identity p={{ ...p, speaker: s.name, role: s.role ?? "Guest", speakers: [], portraitUrls: s.portraitUrl ? [s.portraitUrl] : [] }} pal={pal} accent={s.color} />
            <div style={{ marginTop: 48, color: pal.text, fontFamily: SERIF, fontSize: 34, lineHeight: 1.35 }}>“{s.quote}”</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const InterviewClose: React.FC<{ p: InterviewFramesProps; pal: Palette; accent: string }> = ({ p, pal, accent }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center", padding: 130 }}>
      <div style={{ width: 96, height: 6, background: accent, transform: `scaleX(${clampInterp(frame, [4, 25], [0, 1])})` }} />
      <div style={{ marginTop: 38, color: pal.text, fontFamily: SERIF, fontSize: 76, lineHeight: 1.12, opacity: clampInterp(frame, [18, 40], [0, 1]) }}>{p.topic}</div>
      <div style={{ marginTop: 30, color: pal.secondary, fontFamily: SANS, fontSize: 26, opacity: clampInterp(frame, [30, 52], [0, 1]) }}>{p.label ?? "THANKS FOR WATCHING"}</div>
      <div style={{ marginTop: 52, opacity: clampInterp(frame, [38, 58], [0, 1]) }}><Identity p={p} pal={pal} accent={accent} compact /></div>
      {p.logo ? <div style={{ position: "absolute", bottom: 88, color: accent, fontFamily: SANS, fontWeight: 850, fontSize: 25, letterSpacing: "0.15em" }}>{p.logo}</div> : null}
    </AbsoluteFill>
  );
};

const VARIANTS: Record<InterviewVariant, React.FC<{ p: InterviewFramesProps; pal: Palette; accent: string }>> = {
  "speaker-lower-third": SpeakerLowerThird,
  "question-card": QuestionCard,
  "dual-interview": DualInterview,
  "quote-punch": QuotePunch,
  "remote-call": RemoteCall,
  "expert-intro": ExpertIntro,
  "topic-divider": TopicDivider,
  "answer-highlight": AnswerHighlight,
  "speaker-compare": SpeakerCompare,
  "interview-close": InterviewClose,
};

export const InterviewFramesTemplate: React.FC<InterviewFramesProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const accent = props.accentColor ?? pal.accent;
  const Variant = VARIANTS[props.variant] ?? SpeakerLowerThird;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return (
    <AbsoluteFill style={{ fontFamily: SANS, overflow: "hidden" }}>
      <Backdrop pal={pal} accent={accent} grid={props.variant === "remote-call"} />
      <FadeEdges inFrames={10} outFrames={14}>
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}>
          <Variant p={props} pal={pal} accent={accent} />
        </div>
      </FadeEdges>
      <Progress pal={pal} accent={accent} show={props.showProgress ?? true} />
    </AbsoluteFill>
  );
};

const familyCast = (component: React.FC<InterviewFramesProps>) =>
  component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "interview-frames-speaker-lower-third": familyCast(InterviewFramesTemplate),
  "interview-frames-question-card": familyCast(InterviewFramesTemplate),
  "interview-frames-dual-interview": familyCast(InterviewFramesTemplate),
  "interview-frames-quote-punch": familyCast(InterviewFramesTemplate),
  "interview-frames-remote-call": familyCast(InterviewFramesTemplate),
  "interview-frames-expert-intro": familyCast(InterviewFramesTemplate),
  "interview-frames-topic-divider": familyCast(InterviewFramesTemplate),
  "interview-frames-answer-highlight": familyCast(InterviewFramesTemplate),
  "interview-frames-speaker-compare": familyCast(InterviewFramesTemplate),
  "interview-frames-interview-close": familyCast(InterviewFramesTemplate),
};
