import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import {
  FadeEdges,
  GradientMeshBackground,
  NoiseGrainOverlay,
  clampInterp,
  resolvePalette,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: beat-synced-type
 * Ten deterministic typography systems driven by beat markers. Beat markers are
 * frame numbers (or {frame, strength} objects) and gracefully fall back to a
 * regular grid when no audio analysis is supplied.
 */
export type BeatSyncedTypeVariant =
  | "word-hit"
  | "syllable-pulse"
  | "type-scale"
  | "letter-wave"
  | "beat-underline"
  | "stutter-type"
  | "chorus-stack"
  | "percussion-grid"
  | "bass-drop"
  | "outro-type";

export interface BeatMarker {
  frame: number;
  strength?: number;
}

export interface BeatSyncedTypeProps {
  variant: BeatSyncedTypeVariant;
  text: string;
  words?: string[];
  beatMarkers?: Array<number | BeatMarker>;
  paletteName: string;
  fontFamily?: string;
  intensity?: number;
  alignment?: "left" | "center" | "right";
  accent?: string;
}

type Beat = { frame: number; strength: number };
type VariantProps = { p: BeatSyncedTypeProps; pal: Palette; beats: Beat[] };

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const DEFAULT_BEATS = [0, 15, 30, 45, 60, 75, 90, 105];
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const normalizedBeats = (p: BeatSyncedTypeProps, duration: number): Beat[] => {
  const source = (p.beatMarkers ?? DEFAULT_BEATS).map((marker) => {
    if (typeof marker === "number") return { frame: marker, strength: 1 };
    return { frame: marker.frame, strength: marker.strength ?? 1 };
  });
  const clean = source
    .filter((beat) => Number.isFinite(beat.frame))
    .map((beat) => ({ frame: Math.max(0, Math.min(duration - 1, beat.frame)), strength: Math.max(0.2, beat.strength) }))
    .sort((a, b) => a.frame - b.frame);
  return clean.length >= 2 ? clean : DEFAULT_BEATS.map((frame) => ({ frame: Math.min(frame, duration - 1), strength: 1 }));
};

const beatIndex = (frame: number, beats: Beat[]) => {
  let index = 0;
  for (let i = 0; i < beats.length; i += 1) if (frame >= beats[i].frame) index = i;
  return index;
};

const beatPulse = (frame: number, beat: Beat, intensity: number, width = 10) => {
  const elapsed = frame - beat.frame;
  if (elapsed < 0 || elapsed > width) return 0;
  return clamp01((1 - elapsed / width) * beat.strength * intensity);
};

const textWords = (p: BeatSyncedTypeProps) => (p.words?.length ? p.words : p.text.trim().split(/\s+/).filter(Boolean));

const BeatBackdrop: React.FC<VariantProps & { children: React.ReactNode }> = ({ p, pal, children }) => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const intensity = Math.max(0.2, Math.min(2, p.intensity ?? 1));
  const pulse = beatPulse(frame, { frame: frame, strength: 1 }, intensity, 1);
  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg, color: pal.text, fontFamily: p.fontFamily ?? FONT, overflow: "hidden" }}>
      <GradientMeshBackground palette={pal} speed={0.3 + intensity * 0.12} blobs={3} />
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, ${pal.accent}${Math.round(10 + pulse * 20).toString(16).padStart(2, "0")}, transparent 60%)` }} />
      <div style={{ position: "absolute", inset: 0, opacity: 0.3, background: `linear-gradient(135deg, transparent 0 48%, ${pal.primary}14 49% 50%, transparent 51%)`, backgroundSize: `${Math.max(90, width * 0.09)}px ${Math.max(90, height * 0.09)}px` }} />
      <div style={{ position: "absolute", inset: 0, zIndex: 2 }}>{children}</div>
      <NoiseGrainOverlay opacity={0.06} />
    </AbsoluteFill>
  );
};

const WordHit: React.FC<VariantProps> = ({ p, pal, beats }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const words = textWords(p);
  const active = beatIndex(frame, beats) % words.length;
  const align = p.alignment ?? "center";
  return (
    <div style={{ position: "absolute", inset: "18% 8%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center", textAlign: align }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center", alignItems: "baseline", fontSize: Math.min(width * 0.095, 142), gap: "0.24em 0.32em", maxWidth: "94%" }}>
        {words.map((word, index) => {
          const pulse = beatPulse(frame, beats[index % beats.length], p.intensity ?? 1, 9);
          return <span key={`${word}-${index}`} style={{ display: "inline-block", fontSize: Math.min(width * 0.095, 142), lineHeight: 0.92, fontWeight: 950, letterSpacing: "-0.07em", color: index === active ? p.accent ?? pal.accent : pal.text, transform: `translateY(${-pulse * 18}px) scale(${1 + pulse * 0.22})`, textShadow: index === active ? `0 0 ${pulse * 34}px ${p.accent ?? pal.accent}` : "none" }}>{word}</span>;
        })}
      </div>
      <div style={{ marginTop: 30, color: pal.secondary, letterSpacing: "0.3em", textTransform: "uppercase", fontSize: Math.min(width * 0.02, 30), fontWeight: 700 }}>WORD / {String(active + 1).padStart(2, "0")}</div>
    </div>
  );
};

const SyllablePulse: React.FC<VariantProps> = ({ p, pal, beats }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const words = textWords(p);
  return (
    <div style={{ position: "absolute", inset: "18% 8%", display: "flex", flexWrap: "wrap", alignContent: "center", justifyContent: "center", fontSize: Math.min(width * 0.085, 126), gap: "0.16em 0.42em" }}>
      {words.map((word, wi) => <span key={`${word}-${wi}`} style={{ display: "inline-flex", whiteSpace: "nowrap" }}>{word.split("").map((char, ci) => {
        const pulse = beatPulse(frame, beats[(wi + ci) % beats.length], p.intensity ?? 1, 8);
        return <span key={`${char}-${ci}`} style={{ display: "inline-block", fontSize: Math.min(width * 0.085, 126), fontWeight: 850, letterSpacing: "-0.06em", color: ci % 3 === 0 ? p.accent ?? pal.accent : pal.text, transform: `translateY(${Math.sin((frame - beats[(wi + ci) % beats.length].frame) * 0.3) * pulse * 12}px) scale(${1 + pulse * 0.18})`, opacity: 0.72 + pulse * 0.28 }}>{char}</span>;
      })}</span>)}
    </div>
  );
};

const TypeScale: React.FC<VariantProps> = ({ p, pal, beats }) => {
  const frame = useCurrentFrame();
  const { width, durationInFrames } = useVideoConfig();
  const pulse = beatPulse(frame, beats[beatIndex(frame, beats)], p.intensity ?? 1, 12);
  const progress = clamp01(frame / Math.max(1, durationInFrames - 1));
  return (
    <div style={{ position: "absolute", inset: "15% 10%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: p.alignment === "left" ? "flex-start" : p.alignment === "right" ? "flex-end" : "center", textAlign: p.alignment ?? "center" }}>
      <div style={{ color: pal.secondary, fontSize: Math.min(width * 0.018, 26), letterSpacing: "0.42em", textTransform: "uppercase", fontWeight: 800 }}>SCALE / {Math.round((1 + progress * 3) * 10) / 10}×</div>
      <div style={{ marginTop: 20, fontSize: Math.min(width * (0.055 + progress * 0.04), 138), lineHeight: 0.92, fontWeight: 950, letterSpacing: "-0.08em", transform: `scale(${1 + pulse * 0.16})`, transformOrigin: p.alignment === "left" ? "left" : p.alignment === "right" ? "right" : "center", color: pal.text }}>{p.text}</div>
      <div style={{ width: "min(680px, 82%)", height: 6, marginTop: 38, background: `${pal.text}22`, borderRadius: 99 }}><div style={{ width: `${progress * 100}%`, height: "100%", background: p.accent ?? pal.accent, borderRadius: 99 }} /></div>
    </div>
  );
};

const LetterWave: React.FC<VariantProps> = ({ p, pal, beats }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const chars = Array.from(p.text);
  const current = beatIndex(frame, beats);
  return (
    <div style={{ position: "absolute", inset: "18% 6%", display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "wrap", alignContent: "center" }}>
      {chars.map((char, index) => {
        const beat = beats[(current + index) % beats.length];
        const phase = (frame - beat.frame) * 0.24 - index * 0.36;
        const pulse = beatPulse(frame, beat, p.intensity ?? 1, 12);
        return <span key={`${char}-${index}`} style={{ display: "inline-block", whiteSpace: char === " " ? "pre" : undefined, fontSize: Math.min(width * 0.082, 124), fontWeight: 900, letterSpacing: "-0.065em", color: index % 4 === 0 ? p.accent ?? pal.accent : pal.text, transform: `translateY(${Math.sin(phase) * (12 + pulse * 18)}px) rotate(${Math.sin(phase * 0.6) * (2 + pulse * 4)}deg)`, opacity: char === " " ? 0.4 : 1 }}>{char === " " ? "\u00a0" : char}</span>;
      })}
    </div>
  );
};

const BeatUnderline: React.FC<VariantProps> = ({ p, pal, beats }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const words = textWords(p);
  return (
    <div style={{ position: "absolute", inset: "20% 10%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.25em", fontSize: Math.min(width * 0.09, 136), lineHeight: 0.95, fontWeight: 900, letterSpacing: "-0.07em" }}>{words.map((word, index) => {
        const pulse = beatPulse(frame, beats[index % beats.length], p.intensity ?? 1, 11);
        return <span key={`${word}-${index}`} style={{ position: "relative", color: index % 2 ? pal.text : pal.primary, paddingBottom: 12 }}>{word}<span style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 5 + pulse * 8, borderRadius: 99, background: p.accent ?? pal.accent, transformOrigin: "left", transform: `scaleX(${0.35 + pulse * 0.65})`, opacity: 0.65 + pulse * 0.35 }} /></span>;
      })}</div>
      <div style={{ marginTop: 40, color: pal.secondary, fontSize: 18, letterSpacing: "0.28em", textTransform: "uppercase" }}>MARK THE MOMENT</div>
    </div>
  );
};

const StutterType: React.FC<VariantProps> = ({ p, pal, beats }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const index = beatIndex(frame, beats);
  const pulse = beatPulse(frame, beats[index], p.intensity ?? 1, 9);
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
      {[-3, -2, -1, 0, 1, 2, 3].map((offset) => <div key={offset} style={{ position: "absolute", fontSize: Math.min(width * 0.1, 150), lineHeight: 0.9, fontWeight: 950, letterSpacing: "-0.08em", color: offset === 0 ? pal.text : (p.accent ?? pal.accent), opacity: offset === 0 ? 1 : Math.max(0, 0.18 - Math.abs(offset) * 0.025) + pulse * 0.08, transform: `translate(${offset * (5 + pulse * 16)}px, ${offset * (2 + pulse * 5)}px) skewX(${offset * pulse * 3}deg)` }}>{p.text}</div>)}
      <div style={{ position: "absolute", bottom: "22%", color: pal.secondary, letterSpacing: "0.34em", fontSize: 18, textTransform: "uppercase" }}>STUTTER / {String(index + 1).padStart(2, "0")}</div>
    </div>
  );
};

const ChorusStack: React.FC<VariantProps> = ({ p, pal, beats }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const index = beatIndex(frame, beats);
  return (
    <div style={{ position: "absolute", inset: "16% 8%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
      {[0, 1, 2, 3].map((line) => {
        const pulse = beatPulse(frame, beats[(index + line) % beats.length], p.intensity ?? 1, 10);
        return <div key={line} style={{ fontSize: Math.min(width * (0.062 - line * 0.007), 96), fontWeight: line === 0 ? 950 : 650, letterSpacing: "-0.055em", color: line === 0 ? pal.text : `${pal.text}${Math.max(30, 96 - line * 18).toString(16)}`, transform: `translateX(${(line % 2 ? -1 : 1) * pulse * 22}px) scale(${1 + pulse * (0.08 - line * 0.01)})`, paddingLeft: `${line * 8}%` }}>{p.text}</div>;
      })}
      <div style={{ marginTop: 28, paddingLeft: "8%", color: p.accent ?? pal.accent, letterSpacing: "0.3em", textTransform: "uppercase", fontSize: 17 }}>CHORUS / {String(index + 1).padStart(2, "0")}</div>
    </div>
  );
};

const PercussionGrid: React.FC<VariantProps> = ({ p, pal, beats }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const index = beatIndex(frame, beats);
  const rows = 4;
  const cols = 12;
  return (
    <div style={{ position: "absolute", inset: "17% 9%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: Math.max(5, width * 0.008), transform: `perspective(${width}px) rotateX(${8 + Math.sin(frame * 0.02) * 2}deg)` }}>{Array.from({ length: rows * cols }, (_, cell) => {
        const row = Math.floor(cell / cols);
        const col = cell % cols;
        const lit = (col + row * 2 + index) % (row + 2) === 0;
        const pulse = lit ? beatPulse(frame, beats[(col + row) % beats.length], p.intensity ?? 1, 8) : 0;
        return <div key={cell} style={{ height: Math.max(28, height * 0.045), borderRadius: 7, background: lit ? (row === 0 ? p.accent ?? pal.accent : pal.primary) : `${pal.text}12`, border: `1px solid ${lit ? pal.text + "38" : pal.text + "18"}`, transform: `scale(${1 + pulse * 0.14})`, boxShadow: pulse ? `0 0 ${pulse * 20}px ${p.accent ?? pal.accent}` : "none" }} />;
      })}</div>
      <div style={{ marginTop: 30, display: "flex", justifyContent: "space-between", color: pal.secondary, letterSpacing: "0.24em", textTransform: "uppercase", fontSize: 16 }}><span>KICK</span><span>SNARE</span><span>HAT</span><span>BEAT GRID</span></div>
    </div>
  );
};

const BassDrop: React.FC<VariantProps> = ({ p, pal, beats }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const dropIndex = Math.max(0, beats.length - 1);
  const drop = beatPulse(frame, beats[dropIndex], (p.intensity ?? 1) * 1.5, 18);
  const pre = clamp01((frame - beats[Math.max(0, dropIndex - 1)].frame) / Math.max(1, beats[dropIndex].frame - beats[Math.max(0, dropIndex - 1)].frame));
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: `radial-gradient(circle, ${p.accent ?? pal.accent}${Math.round(10 + drop * 80).toString(16).padStart(2, "0")}, transparent ${35 + drop * 20}%)` }}>
      <div style={{ position: "absolute", width: `${35 + pre * 65}%`, height: `${35 + pre * 65}%`, border: `2px solid ${pal.primary}${Math.round(30 + drop * 120).toString(16).padStart(2, "0")}`, borderRadius: "50%", transform: `scale(${1 + drop * 0.35})`, opacity: 0.4 + drop * 0.6 }} />
      <div style={{ textAlign: "center", transform: `scale(${1 + drop * 0.5}) rotate(${Math.sin(frame * 0.7) * drop * 2}deg)` }}><div style={{ color: pal.secondary, fontSize: 18, letterSpacing: "0.4em", textTransform: "uppercase", fontWeight: 800 }}>BASS DROP</div><div style={{ marginTop: 18, fontSize: Math.min(width * 0.13, 190), lineHeight: 0.85, fontWeight: 950, letterSpacing: "-0.09em", color: pal.text }}>{p.text}</div></div>
      <div style={{ position: "absolute", bottom: height * 0.16, left: "20%", right: "20%", height: 8, borderRadius: 99, background: `${pal.text}20` }}><div style={{ height: "100%", width: `${pre * 100}%`, borderRadius: 99, background: p.accent ?? pal.accent }} /></div>
    </div>
  );
};

const OutroType: React.FC<VariantProps> = ({ p, pal, beats }) => {
  const frame = useCurrentFrame();
  const { width, durationInFrames } = useVideoConfig();
  const fade = clamp01((durationInFrames - frame) / Math.max(1, durationInFrames * 0.28));
  const pulse = beatPulse(frame, beats[beatIndex(frame, beats)], p.intensity ?? 1, 10);
  return (
    <div style={{ position: "absolute", inset: "14% 10%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", opacity: 0.22 + fade * 0.78 }}>
      <div style={{ width: "min(160px, 14vw)", height: 5, marginBottom: 38, background: p.accent ?? pal.accent, transform: `scaleX(${0.65 + pulse * 0.35})`, transformOrigin: "center" }} />
      <div style={{ fontSize: Math.min(width * 0.095, 142), lineHeight: 0.9, fontWeight: 900, letterSpacing: "-0.07em", transform: `translateY(${pulse * -10}px)` }}>{p.text}</div>
      <div style={{ marginTop: 28, color: pal.secondary, letterSpacing: "0.36em", textTransform: "uppercase", fontSize: 17 }}>{p.words?.join(" · ") || "SEE YOU ON THE NEXT BEAT"}</div>
    </div>
  );
};

const BeatSyncedTypeTemplate: React.FC<BeatSyncedTypeProps> = (props) => {
  const { durationInFrames } = useVideoConfig();
  const pal = resolvePalette(props.paletteName);
  const beats = normalizedBeats(props, durationInFrames);
  const variant = props.variant;
  const Component: React.FC<VariantProps> = variant === "word-hit" ? WordHit : variant === "syllable-pulse" ? SyllablePulse : variant === "type-scale" ? TypeScale : variant === "letter-wave" ? LetterWave : variant === "beat-underline" ? BeatUnderline : variant === "stutter-type" ? StutterType : variant === "chorus-stack" ? ChorusStack : variant === "percussion-grid" ? PercussionGrid : variant === "bass-drop" ? BassDrop : OutroType;
  return <BeatBackdrop p={props} pal={pal} beats={beats}><FadeEdges inFrames={8} outFrames={12}><Component p={props} pal={pal} beats={beats} /></FadeEdges></BeatBackdrop>;
};

const familyCast = (component: React.FC<BeatSyncedTypeProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "beat-synced-type-word-hit": familyCast(BeatSyncedTypeTemplate),
  "beat-synced-type-syllable-pulse": familyCast(BeatSyncedTypeTemplate),
  "beat-synced-type-type-scale": familyCast(BeatSyncedTypeTemplate),
  "beat-synced-type-letter-wave": familyCast(BeatSyncedTypeTemplate),
  "beat-synced-type-beat-underline": familyCast(BeatSyncedTypeTemplate),
  "beat-synced-type-stutter-type": familyCast(BeatSyncedTypeTemplate),
  "beat-synced-type-chorus-stack": familyCast(BeatSyncedTypeTemplate),
  "beat-synced-type-percussion-grid": familyCast(BeatSyncedTypeTemplate),
  "beat-synced-type-bass-drop": familyCast(BeatSyncedTypeTemplate),
  "beat-synced-type-outro-type": familyCast(BeatSyncedTypeTemplate),
};
