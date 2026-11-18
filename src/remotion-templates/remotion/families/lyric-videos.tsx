import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  FadeEdges,
  GradientMeshBackground,
  GridPerspectiveBackground,
  NoiseGrainOverlay,
  clampInterp,
  resolvePalette,
  seededRand,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: lyric-videos
 * Ten deterministic lyric treatments. Timings are expressed in seconds so the
 * same props remain useful at any composition FPS; defaults never need audio or
 * remote assets.
 */
export type LyricVariant =
  | "center-lyrics"
  | "karaoke-fill"
  | "word-pop"
  | "line-stack"
  | "chorus-burst"
  | "vertical-lyrics"
  | "lyric-over-photo"
  | "translation-pair"
  | "handwritten-lyrics"
  | "final-line";

export interface LyricWordTiming {
  word: string;
  start: number;
  end: number;
}

export interface LyricVideosProps {
  variant: LyricVariant;
  lyrics: string[];
  wordTimings: LyricWordTiming[];
  translationLines: string[];
  artist: string;
  songTitle: string;
  language: string;
  coverUrl: string;
  backgroundUrl: string;
  paletteName: string;
  accentColor: string;
  chorusEvery: number;
}

const FONT = '"Inter", "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", "SF Mono", Menlo, Consolas, monospace';
const SCRIPT = '"Bradley Hand", "Segoe Print", "Comic Sans MS", cursive';

const fallbackWords: readonly [string, number, number][] = [
  ["Turn", 0.2, 0.65], ["the", 0.68, 0.95], ["lights", 0.98, 1.5], ["down", 1.53, 2.0],
  ["and", 2.08, 2.3], ["let", 2.34, 2.62], ["the", 2.66, 2.92], ["city", 2.96, 3.5],
  ["sing", 3.56, 4.15], ["we", 4.35, 4.62], ["are", 4.66, 4.94], ["alive", 4.98, 5.7],
];

const safeWords = (p: LyricVideosProps) => (p.wordTimings?.length ? p.wordTimings : fallbackWords.map(([word, start, end]) => ({ word, start, end })));
const safeLines = (p: LyricVideosProps) => (p.lyrics?.length ? p.lyrics : ["Turn the lights down", "and let the city sing", "we are alive"]);
const activeTiming = (frame: number, fps: number, p: LyricVideosProps) => {
  const second = frame / fps;
  const words = safeWords(p);
  const exact = words.findIndex((w) => second >= w.start && second < w.end);
  const previous = words.reduce((last, w, i) => (second >= w.start ? i : last), -1);
  return { second, words, index: exact >= 0 ? exact : previous };
};
const activeLine = (frame: number, fps: number, p: LyricVideosProps) => {
  const { index } = activeTiming(frame, fps, p);
  const lines = safeLines(p);
  return Math.max(0, Math.min(lines.length - 1, Math.floor(Math.max(0, index) / 4)));
};
const wordProgress = (frame: number, fps: number, timing: LyricWordTiming) =>
  clampInterp(frame / fps, [timing.start, timing.end], [0, 1]);

const Backdrop: React.FC<{ pal: Palette; p: LyricVideosProps; grid?: boolean; photo?: boolean }> = ({ pal, p, grid = false, photo = false }) => (
  <>
    {photo && p.backgroundUrl ? (
      <AbsoluteFill style={{ backgroundImage: `linear-gradient(110deg, ${pal.bg}ee, ${pal.bg}66), url(${p.backgroundUrl})`, backgroundSize: "cover", backgroundPosition: "center", filter: "saturate(0.8)" }} />
    ) : <AbsoluteFill style={{ background: `radial-gradient(circle at 72% 24%, ${pal.primary}55, transparent 38%), linear-gradient(135deg, ${pal.bg}, ${pal.bgAlt ?? pal.bg})` }} />}
    {grid ? <GridPerspectiveBackground palette={pal} /> : null}
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, transparent 30%, ${pal.bg}aa 100%)` }} />
  </>
);

const Header: React.FC<{ pal: Palette; p: LyricVideosProps; light?: boolean }> = ({ pal, p, light = false }) => (
  <div style={{ position: "absolute", top: 64, left: 80, right: 80, display: "flex", justifyContent: "space-between", alignItems: "center", color: light ? pal.bg : pal.text, fontFamily: MONO, fontSize: 20, letterSpacing: "0.15em", textTransform: "uppercase" }}>
    <span>{p.artist || "NIGHT DRIVE"}</span><span>{p.language || "EN"} · LYRIC EDIT</span>
  </div>
);

const CurrentWord: React.FC<{ pal: Palette; timing: LyricWordTiming; frame: number; fps: number; active: boolean; size?: number }> = ({ pal, timing, frame, fps, active, size = 82 }) => {
  const progress = wordProgress(frame, fps, timing);
  const pop = active ? interpolate(progress, [0, 0.18, 1], [0.65, 1.08, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  return <span style={{ display: "inline-block", color: active ? pal.accent : `${pal.text}66`, transform: `scale(${pop})`, transformOrigin: "center bottom", fontSize: size, fontWeight: active ? 850 : 650, transition: "none" }}>{timing.word}</span>;
};

const CenterLyrics: React.FC<{ p: LyricVideosProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const line = activeLine(frame, fps, p);
  const lines = safeLines(p);
  const enter = spring({ frame: Math.max(0, frame - 6), fps, config: { damping: 16, stiffness: 120 } });
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 120 }}>
    <Header pal={pal} p={p} />
    <div style={{ maxWidth: 1450, textAlign: "center", transform: `translateY(${interpolate(enter, [0, 1], [35, 0])}px)`, opacity: enter }}>
      <div style={{ color: pal.secondary, font: `600 23px ${MONO}`, letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: 34 }}>♪ {p.songTitle || "After Midnight"}</div>
      <div style={{ color: pal.text, font: `800 94px/1.06 ${FONT}`, letterSpacing: "-0.055em" }}>{lines[line] || lines[0]}</div>
      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 58 }}>
        {lines.map((_, i) => <div key={i} style={{ width: i === line ? 72 : 18, height: 6, borderRadius: 9, background: i === line ? pal.accent : `${pal.text}33` }} />)}
      </div>
    </div>
  </AbsoluteFill>;
};

const KaraokeFill: React.FC<{ p: LyricVideosProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const timing = activeTiming(frame, fps, p);
  const words = timing.words;
  // The catalog renders at 800px wide; a fixed 1500px lyric rail would be
  // centered off-canvas and clip the first/last words. Keep the kinetic word
  // treatment, but size the rail and type from the active composition.
  const railWidth = Math.max(320, Math.min(1500, width - 160));
  const wordSize = Math.max(34, Math.min(76, width * 0.065));
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: `120px ${Math.max(80, width * 0.1)}px` }}>
    <Header pal={pal} p={p} />
    <div style={{ position: "absolute", top: 96, left: Math.max(80, width * 0.16), right: Math.max(80, width * 0.16), height: 5, background: `${pal.text}22` }}><div style={{ width: `${Math.min(100, timing.second / 6 * 100)}%`, height: "100%", background: pal.accent }} /></div>
    <div style={{ width: railWidth, maxWidth: "100%", boxSizing: "border-box", textAlign: "center", display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: Math.max(10, width * 0.022), rowGap: Math.max(10, width * 0.018), overflow: "visible" }}>
      {words.map((word, i) => <CurrentWord key={`${word.word}-${i}`} pal={pal} timing={word} frame={frame} fps={fps} active={i === timing.index} size={wordSize} />)}
    </div>
    <div style={{ position: "absolute", bottom: 90, maxWidth: "calc(100% - 160px)", color: pal.secondary, font: `600 ${Math.max(15, Math.min(22, width * 0.0275))}px ${MONO}`, letterSpacing: "0.16em", textAlign: "center" }}>SING ALONG · {String(Math.max(0, Math.floor(timing.second))).padStart(2, "0")}s</div>
  </AbsoluteFill>;
};

const WordPop: React.FC<{ p: LyricVideosProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { words, index } = activeTiming(frame, fps, p);
  const current = words[Math.max(0, index)] ?? words[0];
  const burst = seededRand(Math.max(0, index) + 4);
  const scale = interpolate(frame / fps, [current.start, current.start + 0.16, current.end], [0.4, 1.15, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <Header pal={pal} p={p} />
    {Array.from({ length: 12 }, (_, i) => <div key={i} style={{ position: "absolute", width: 10 + burst * 12, height: 10 + burst * 12, borderRadius: "50%", background: i % 2 ? pal.secondary : pal.accent, left: `${50 + Math.cos(i * 0.52) * (18 + (frame % 30))}%`, top: `${50 + Math.sin(i * 0.52) * (18 + (frame % 30))}%`, opacity: 0.18, transform: "translate(-50%, -50%)" }} />)}
    <div style={{ textAlign: "center", transform: `scale(${scale})`, color: pal.text, font: `900 170px/0.95 ${FONT}`, letterSpacing: "-0.08em", textShadow: `0 0 50px ${pal.accent}88` }}>{current?.word || "alive"}</div>
    <div style={{ position: "absolute", bottom: 90, color: pal.secondary, font: `700 20px ${MONO}`, letterSpacing: "0.24em" }}>WORD {String(Math.max(1, index + 1)).padStart(2, "0")}</div>
  </AbsoluteFill>;
};

const LineStack: React.FC<{ p: LyricVideosProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const lines = safeLines(p);
  const line = activeLine(frame, fps, p);
  // Scale the editorial stack to the active composition. The former 210px
  // vertical padding left only 30px of content height in 800×450 catalog
  // renders, pushing the lower lyric line into the frame edge.
  const typeScale = Math.max(0.52, Math.min(1, width / 1600));
  const padX = Math.max(56, width * 0.105);
  const padY = Math.max(72, height * 0.18);
  const activeSize = Math.round(96 * typeScale);
  const quietSize = Math.round(54 * typeScale);
  const gap = Math.max(9, Math.round(18 * typeScale));
  return <AbsoluteFill style={{ boxSizing: "border-box", padding: `${padY}px ${padX}px`, justifyContent: "center", overflow: "hidden" }}>
    <Header pal={pal} p={p} />
    <div style={{ borderLeft: `${Math.max(2, Math.round(4 * typeScale))}px solid ${pal.accent}`, paddingLeft: Math.max(22, Math.round(60 * typeScale)), maxWidth: Math.min(1400, width * 0.84), width: "100%", boxSizing: "border-box", overflow: "hidden" }}>
      {lines.slice(Math.max(0, line - 1), line + 3).map((text, i) => { const actual = Math.max(0, line - 1) + i; return <div key={`${text}-${actual}`} style={{ color: actual === line ? pal.text : `${pal.text}42`, font: `${actual === line ? 850 : 600} ${actual === line ? activeSize : quietSize}px/1.12 ${FONT}`, letterSpacing: "-0.04em", margin: `${gap}px 0`, maxWidth: "100%", overflowWrap: "anywhere", whiteSpace: "normal", transform: `translateX(${actual === line ? 0 : Math.round(26 * typeScale)}px)`, opacity: actual === line ? 1 : 0.72 }}>{text}</div>; })}
    </div>
    <div style={{ position: "absolute", left: padX, bottom: Math.max(38, height * 0.14), maxWidth: `calc(100% - ${padX * 2}px)`, color: pal.secondary, font: `600 ${Math.max(14, Math.min(21, width * 0.026))}px ${MONO}`, whiteSpace: "nowrap" }}>VERSE {String(line + 1).padStart(2, "0")} / {String(lines.length).padStart(2, "0")}</div>
  </AbsoluteFill>;
};

const ChorusBurst: React.FC<{ p: LyricVideosProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lines = safeLines(p);
  const line = activeLine(frame, fps, p);
  const isChorus = line % Math.max(1, p.chorusEvery || 2) === 1;
  const beat = (frame % 30) / 30;
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
    <Header pal={pal} p={p} />
    {Array.from({ length: 16 }, (_, i) => <div key={i} style={{ position: "absolute", width: `${2 + (i % 3)}px`, height: "140%", background: i % 2 ? pal.primary : pal.accent, opacity: isChorus ? 0.1 : 0.025, transform: `rotate(${i * 11 + beat * 8}deg)`, transformOrigin: "center" }} />)}
    <div style={{ position: "absolute", width: `${620 + beat * 80}px`, height: `${620 + beat * 80}px`, borderRadius: "50%", border: `2px solid ${pal.accent}55`, boxShadow: `0 0 110px ${pal.accent}44` }} />
    <div style={{ zIndex: 1, maxWidth: 1460, textAlign: "center", color: pal.text, font: `900 ${isChorus ? 116 : 88}px/0.98 ${FONT}`, letterSpacing: "-0.065em", transform: `scale(${isChorus ? 1 + beat * 0.035 : 1})` }}>{lines[line] || lines[0]}</div>
    <div style={{ position: "absolute", bottom: 82, color: isChorus ? pal.accent : pal.secondary, font: `800 22px ${MONO}`, letterSpacing: "0.25em" }}>{isChorus ? "CHORUS // SING IT BACK" : "VERSE // KEEP MOVING"}</div>
  </AbsoluteFill>;
};

const VerticalLyrics: React.FC<{ p: LyricVideosProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lines = safeLines(p);
  const line = activeLine(frame, fps, p);
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <Header pal={pal} p={p} />
    <div style={{ display: "flex", gap: 44, alignItems: "center", transform: `rotate(-8deg)` }}>
      {[-1, 0, 1].map((offset) => { const i = Math.max(0, Math.min(lines.length - 1, line + offset)); return <div key={offset} style={{ writingMode: "vertical-rl", textOrientation: "mixed", color: offset === 0 ? pal.text : `${pal.text}3d`, font: `${offset === 0 ? 850 : 600} ${offset === 0 ? 90 : 56}px/1 ${FONT}`, letterSpacing: "0.02em", transform: `translateY(${offset * 28}px)` }}>{lines[i]}</div>; })}
    </div>
    <div style={{ position: "absolute", bottom: 84, color: pal.accent, font: `700 21px ${MONO}`, letterSpacing: "0.2em" }}>VERTICAL TAKE · {String(line + 1).padStart(2, "0")}</div>
  </AbsoluteFill>;
};

const LyricOverPhoto: React.FC<{ p: LyricVideosProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lines = safeLines(p);
  const line = activeLine(frame, fps, p);
  const drift = Math.sin(frame * 0.008) * 2;
  return <AbsoluteFill>
    <Backdrop pal={pal} p={p} photo />
    <div style={{ position: "absolute", inset: 0, background: `${pal.bg}44` }} />
    <Header pal={pal} p={p} />
    <div style={{ position: "absolute", left: 120, bottom: 145, right: 120, transform: `translateY(${drift}px)` }}>
      <div style={{ color: pal.accent, font: `700 22px ${MONO}`, letterSpacing: "0.22em", marginBottom: 25 }}>A SONG FOR THE LONG WAY HOME</div>
      <div style={{ color: pal.text, font: `850 106px/0.98 ${FONT}`, letterSpacing: "-0.065em", maxWidth: 1500 }}>{lines[line]}</div>
      <div style={{ marginTop: 32, width: 180, height: 7, background: pal.accent }} />
    </div>
  </AbsoluteFill>;
};

const TranslationPair: React.FC<{ p: LyricVideosProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lines = safeLines(p);
  const translated = p.translationLines?.length ? p.translationLines : ["Laisse les lumières s'éteindre", "et laisse chanter la ville", "nous sommes vivants"];
  const line = activeLine(frame, fps, p);
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 120 }}>
    <Header pal={pal} p={p} />
    <div style={{ width: 1420, textAlign: "center" }}>
      <div style={{ color: pal.text, font: `850 88px/1.05 ${FONT}`, letterSpacing: "-0.05em" }}>{lines[line]}</div>
      <div style={{ width: 130, height: 3, background: pal.accent, margin: "44px auto" }} />
      <div style={{ color: pal.secondary, font: `500 47px/1.16 ${FONT}`, letterSpacing: "-0.025em" }}>{translated[line % translated.length]}</div>
      <div style={{ marginTop: 58, color: `${pal.text}66`, font: `600 19px ${MONO}`, letterSpacing: "0.2em" }}>{p.language || "ORIGINAL"}  /  TRANSLATION</div>
    </div>
  </AbsoluteFill>;
};

const HandwrittenLyrics: React.FC<{ p: LyricVideosProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lines = safeLines(p);
  const line = activeLine(frame, fps, p);
  const draw = clampInterp(frame, [8, 35], [0, 1]);
  return <AbsoluteFill style={{ background: pal.bg, padding: 120, justifyContent: "center" }}>
    <div style={{ position: "absolute", inset: 70, border: `2px dashed ${pal.text}30`, transform: `rotate(${Math.sin(frame * 0.012) * 0.25}deg)` }} />
    <Header pal={pal} p={p} />
    <div style={{ maxWidth: 1450, color: pal.text, font: `700 112px/1.06 ${SCRIPT}`, transform: `rotate(-3deg)`, clipPath: `inset(0 ${100 - draw * 100}% 0 0)` }}>{lines[line]}</div>
    <div style={{ position: "absolute", right: 150, bottom: 110, color: pal.accent, font: `700 24px ${SCRIPT}`, transform: "rotate(8deg)" }}>— {p.artist || "you"}</div>
    <NoiseGrainOverlay opacity={0.08} />
  </AbsoluteFill>;
};

const FinalLine: React.FC<{ p: LyricVideosProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const lines = safeLines(p);
  const final = lines[lines.length - 1] || "we are alive";
  const reveal = spring({ frame: Math.max(0, frame - Math.max(0, durationInFrames - 65)), fps, config: { damping: 18, stiffness: 90 } });
  const isFinal = frame > durationInFrames - 78;
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 120 }}>
    <Header pal={pal} p={p} />
    <div style={{ textAlign: "center", opacity: isFinal ? reveal : 0.26, transform: `scale(${isFinal ? interpolate(reveal, [0, 1], [0.86, 1]) : 0.92})` }}>
      <div style={{ color: pal.secondary, font: `700 20px ${MONO}`, letterSpacing: "0.3em", marginBottom: 35 }}>THE LAST LINE</div>
      <div style={{ color: pal.text, font: `900 122px/0.98 ${FONT}`, letterSpacing: "-0.07em", textShadow: `0 0 80px ${pal.accent}66` }}>{final}</div>
      <div style={{ margin: "48px auto 0", width: 260, height: 7, background: pal.accent }} />
    </div>
  </AbsoluteFill>;
};

const VARIANTS: Record<LyricVariant, React.FC<{ p: LyricVideosProps; pal: Palette }>> = {
  "center-lyrics": CenterLyrics,
  "karaoke-fill": KaraokeFill,
  "word-pop": WordPop,
  "line-stack": LineStack,
  "chorus-burst": ChorusBurst,
  "vertical-lyrics": VerticalLyrics,
  "lyric-over-photo": LyricOverPhoto,
  "translation-pair": TranslationPair,
  "handwritten-lyrics": HandwrittenLyrics,
  "final-line": FinalLine,
};

export const LyricVideosTemplate: React.FC<LyricVideosProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? CenterLyrics;
  const hasPhoto = props.variant === "lyric-over-photo";
  return <AbsoluteFill style={{ background: pal.bg, fontFamily: FONT, overflow: "hidden" }}>
    {!hasPhoto ? <GradientMeshBackground palette={pal} blobs={4} speed={0.45} /> : null}
    <Backdrop pal={pal} p={props} grid={props.variant === "karaoke-fill" || props.variant === "word-pop"} />
    <FadeEdges inFrames={10} outFrames={14}><Variant p={props} pal={pal} /></FadeEdges>
  </AbsoluteFill>;
};

const familyCast = (component: React.FC<LyricVideosProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "lyric-videos-center-lyrics": familyCast(LyricVideosTemplate),
  "lyric-videos-karaoke-fill": familyCast(LyricVideosTemplate),
  "lyric-videos-word-pop": familyCast(LyricVideosTemplate),
  "lyric-videos-line-stack": familyCast(LyricVideosTemplate),
  "lyric-videos-chorus-burst": familyCast(LyricVideosTemplate),
  "lyric-videos-vertical-lyrics": familyCast(LyricVideosTemplate),
  "lyric-videos-lyric-over-photo": familyCast(LyricVideosTemplate),
  "lyric-videos-translation-pair": familyCast(LyricVideosTemplate),
  "lyric-videos-handwritten-lyrics": familyCast(LyricVideosTemplate),
  "lyric-videos-final-line": familyCast(LyricVideosTemplate),
};
