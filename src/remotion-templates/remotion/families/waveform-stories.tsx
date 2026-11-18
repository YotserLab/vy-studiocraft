import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, GradientMeshBackground, NoiseGrainOverlay, resolvePalette, seededRand, type Palette } from "../lib/primitives";

type WaveformVariant =
  | "waveform-card"
  | "voice-quote"
  | "chapter-wave"
  | "amplitude-zoom"
  | "waveform-to-title"
  | "speaker-wave"
  | "waveform-scrub"
  | "multi-track"
  | "soundwave-poster"
  | "waveform-close";

export interface WaveformStoriesProps {
  variant: WaveformVariant;
  waveform: number[];
  chapters: string[];
  quote: string;
  speaker: string;
  title: string;
  showName: string;
  paletteName: string;
  accentColor?: string;
  progress?: number;
  durationLabel?: string;
  audioUrl?: string;
}

const FONT = '"Inter", "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", "SF Mono", Menlo, Consolas, monospace';

const samples = (input: number[] | undefined, count = 72, seed = 7): number[] => {
  if (input && input.length > 1) {
    return Array.from({ length: count }, (_, i) => {
      const at = (i / (count - 1)) * (input.length - 1);
      const lo = Math.floor(at);
      const hi = Math.min(input.length - 1, lo + 1);
      const mix = at - lo;
      return Math.max(0.06, Math.min(1, (input[lo] ?? 0.3) * (1 - mix) + (input[hi] ?? 0.3) * mix));
    });
  }
  return Array.from({ length: count }, (_, i) => {
    const base = 0.18 + seededRand(seed * 101 + i * 17) * 0.34;
    return Math.max(0.06, Math.min(1, base + Math.abs(Math.sin(i * 0.47 + seed)) * 0.38 + Math.abs(Math.sin(i * 0.13 + seed * 2)) * 0.16));
  });
};

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]?.toUpperCase()).join("") || "VO";

const WaveBars: React.FC<{
  values: number[];
  color: string;
  height?: number;
  progress?: number;
  mirror?: boolean;
  gap?: number;
  opacity?: number;
  animate?: boolean;
}> = ({ values, color, height = 180, progress = 1, mirror = false, gap = 4, opacity = 1, animate = true }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height, gap, opacity, overflow: "hidden" }}>
      {values.map((value, i) => {
        const motion = animate ? 0.86 + Math.abs(Math.sin(frame * 0.11 + i * 0.51)) * 0.2 : 1;
        const h = Math.max(3, value * height * (mirror ? 0.46 : 0.9) * motion);
        const active = i / values.length <= progress;
        return <div key={`bar-${i}`} style={{ flex: "1 1 0", maxWidth: 20, minWidth: 2, height: h, borderRadius: 999, background: active ? color : `${color}35`, boxShadow: active ? `0 0 18px ${color}66` : undefined }} />;
      })}
    </div>
  );
};

const Label: React.FC<{ children: React.ReactNode; color: string }> = ({ children, color }) => (
  <div style={{ color, font: `700 21px ${MONO}`, letterSpacing: "0.2em", textTransform: "uppercase" }}>{children}</div>
);

const Base: React.FC<{ p: WaveformStoriesProps; pal: Palette; children: React.ReactNode; mesh?: boolean }> = ({ p, pal, children, mesh = false }) => (
  <AbsoluteFill style={{ background: pal.bg, color: pal.text, fontFamily: FONT, overflow: "hidden" }}>
    {mesh ? <GradientMeshBackground palette={pal} blobs={4} speed={0.45} /> : null}
    {children}
    <NoiseGrainOverlay opacity={0.035} />
  </AbsoluteFill>
);

const WaveformCard: React.FC<{ p: WaveformStoriesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 90 } });
  const values = samples(p.waveform, 78, 11);
  return <Base p={p} pal={pal} mesh>
    <div style={{ width: 1320, margin: "auto", padding: 82, borderRadius: 42, border: `1px solid ${pal.text}22`, background: `${pal.bg}dd`, boxShadow: "0 40px 100px #00000066", transform: `translateY(${interpolate(enter, [0, 1], [60, 0])}px)`, opacity: enter }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><Label color={pal.primary}>{p.showName}</Label><span style={{ color: pal.secondary, font: `600 22px ${MONO}` }}>{p.durationLabel ?? "04:32"}</span></div>
      <h1 style={{ margin: "70px 0 45px", font: `850 82px/0.98 ${FONT}`, letterSpacing: "-0.05em" }}>{p.title}</h1>
      <WaveBars values={values} color={p.accentColor ?? pal.primary} height={220} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40, color: `${pal.text}88`, font: `500 24px ${FONT}` }}><span>{p.speaker}</span><span>WAVEFORM · NO AUDIO REQUIRED</span></div>
    </div>
  </Base>;
};

const VoiceQuote: React.FC<{ p: WaveformStoriesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const values = samples(p.waveform, 96, 19);
  return <Base p={p} pal={pal}>
    <div style={{ position: "relative", zIndex: 1, boxSizing: "border-box", padding: "86px 150px 58px", margin: "auto", width: "100%", maxHeight: "100%", overflow: "hidden", opacity: enter, transform: `translateY(${(1 - enter) * 35}px)` }}>
      <Label color={pal.accent}>{p.showName} · VOICE QUOTE</Label>
      <div style={{ marginTop: 55, maxWidth: 1320, maxHeight: 250, overflow: "hidden", font: `850 78px/1.03 ${FONT}`, letterSpacing: "-0.055em", overflowWrap: "anywhere" }}>“{p.quote}”</div>
      <div style={{ marginTop: 42, display: "flex", alignItems: "center", gap: 28 }}><div style={{ flex: "0 0 82px", width: 82, height: 82, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: `${pal.primary}25`, border: `3px solid ${pal.primary}`, color: pal.primary, font: `800 27px ${FONT}` }}>{initials(p.speaker)}</div><div style={{ minWidth: 0 }}><div style={{ font: `700 29px ${FONT}`, overflowWrap: "anywhere" }}>{p.speaker}</div><div style={{ color: pal.secondary, font: `500 20px ${MONO}` }}>SPOKEN EXCERPT</div></div></div>
      <div style={{ marginTop: 55 }}><WaveBars values={values} color={p.accentColor ?? pal.accent} height={100} mirror /></div>
    </div>
  </Base>;
};

const ChapterWave: React.FC<{ p: WaveformStoriesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const values = samples(p.waveform, 84, 23);
  const chapters = p.chapters?.length ? p.chapters : ["Intro", "Context", "Story", "Close"];
  const progress = Math.min(1, frame / 120);
  return <Base p={p} pal={pal} mesh>
    <div style={{ position: "relative", zIndex: 1, boxSizing: "border-box", width: "calc(100% - 120px)", maxWidth: 1460, margin: "auto", padding: 60, flexShrink: 0 }}><Label color={pal.primary}>{p.title} · CHAPTERS</Label><h1 style={{ margin: "28px 0 58px", font: `850 68px/0.98 ${FONT}`, letterSpacing: "-0.05em", maxWidth: 1200, overflowWrap: "anywhere" }}>A story in sound.</h1><WaveBars values={values} color={pal.primary} height={210} progress={progress} />
      <div style={{ height: 5, background: `${pal.text}25`, position: "relative", marginTop: 42 }}><div style={{ width: `${progress * 100}%`, height: "100%", background: pal.accent }} /></div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>{chapters.slice(0, 6).map((chapter, i) => <div key={`${chapter}-${i}`} style={{ color: progress >= i / Math.max(1, chapters.length - 1) ? pal.text : `${pal.text}66`, font: `650 22px ${FONT}`, width: 220 }}>{String(i + 1).padStart(2, "0")}<br /><span style={{ fontWeight: 500 }}>{chapter}</span></div>)}</div>
    </div>
  </Base>;
};

const AmplitudeZoom: React.FC<{ p: WaveformStoriesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const values = samples(p.waveform, 38, 31);
  const scale = interpolate(frame, [0, 90], [0.72, 1.2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <Base p={p} pal={pal}><div style={{ margin: "auto", width: 1160, textAlign: "center" }}><Label color={pal.secondary}>AMPLITUDE ZOOM · {p.speaker}</Label><div style={{ marginTop: 60, transform: `scale(${scale})` }}><WaveBars values={values} color={p.accentColor ?? pal.accent} height={500} gap={8} /></div><h1 style={{ margin: 58, font: `850 70px ${FONT}`, letterSpacing: "-0.05em" }}>{p.title}</h1></div></Base>;
};

const WaveformToTitle: React.FC<{ p: WaveformStoriesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const values = samples(p.waveform, 70, 41);
  const reveal = interpolate(frame, [18, 75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <Base p={p} pal={pal} mesh><div style={{ position: "relative", zIndex: 1, boxSizing: "border-box", margin: "auto", width: "calc(100% - 120px)", maxWidth: 1500, textAlign: "center", flexShrink: 0 }}><div style={{ opacity: 1 - reveal * 0.75, transform: `scale(${1 + reveal * 0.25})` }}><WaveBars values={values} color={pal.primary} height={190} /></div><div style={{ marginTop: -24, opacity: reveal, transform: `translateY(${(1 - reveal) * 55}px)` }}><Label color={pal.accent}>{p.showName}</Label><h1 style={{ maxWidth: 1240, margin: "35px auto 0", font: `900 88px/0.95 ${FONT}`, letterSpacing: "-0.06em", overflowWrap: "anywhere" }}>{p.title}</h1></div></div></Base>;
};

const SpeakerWave: React.FC<{ p: WaveformStoriesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const values = samples(p.waveform, 70, 53);
  return <Base p={p} pal={pal}><div style={{ position: "relative", zIndex: 1, boxSizing: "border-box", margin: "auto", width: "calc(100% - 120px)", maxWidth: 1500, display: "flex", alignItems: "center", gap: 60, flexShrink: 0 }}><div style={{ flex: "0 0 270px", width: 270, height: 270, borderRadius: "50%", border: `8px solid ${pal.primary}`, background: `${pal.primary}16`, color: pal.primary, display: "flex", alignItems: "center", justifyContent: "center", font: `900 74px ${FONT}`, boxShadow: `0 0 100px ${pal.primary}44` }}>{initials(p.speaker)}</div><div style={{ flex: "1 1 0", minWidth: 0, overflow: "hidden" }}><Label color={pal.secondary}>SPEAKER WAVE</Label><h1 style={{ maxWidth: "100%", margin: "26px 0", font: `850 68px/0.98 ${FONT}`, letterSpacing: "-0.055em", overflowWrap: "anywhere" }}>{p.speaker}</h1><WaveBars values={values} color={p.accentColor ?? pal.primary} height={150} /><div style={{ marginTop: 22, maxWidth: "100%", color: `${pal.text}88`, font: `500 21px ${MONO}`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title} · {String(Math.floor(frame / 30)).padStart(2, "0")}s</div></div></div></Base>;
};

const WaveformScrub: React.FC<{ p: WaveformStoriesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const progress = p.progress ?? Math.min(1, frame / 120);
  const values = samples(p.waveform, 110, 67);
  return <Base p={p} pal={pal}><div style={{ margin: "auto", width: 1500 }}><div style={{ display: "flex", justifyContent: "space-between" }}><Label color={pal.primary}>{p.showName}</Label><Label color={pal.accent}>SCRUB {Math.round(progress * 100)}%</Label></div><h1 style={{ margin: "50px 0 90px", font: `850 78px ${FONT}`, letterSpacing: "-0.055em" }}>{p.title}</h1><div style={{ position: "relative" }}><WaveBars values={values} color={pal.primary} height={230} progress={progress} /><div style={{ position: "absolute", top: 0, bottom: 0, left: `${progress * 100}%`, width: 5, background: pal.accent, boxShadow: `0 0 28px ${pal.accent}` }} /></div><div style={{ display: "flex", justifyContent: "space-between", color: `${pal.text}88`, font: `500 22px ${MONO}` }}><span>00:00</span><span>{p.durationLabel ?? "04:32"}</span></div></div></Base>;
};

const MultiTrack: React.FC<{ p: WaveformStoriesProps; pal: Palette }> = ({ p, pal }) => {
  const values = samples(p.waveform, 76, 79);
  const tracks = [{ label: p.speaker || "VOICE", color: pal.primary, seed: values }, { label: "MUSIC", color: pal.accent, seed: samples(p.waveform, 76, 83) }, { label: "ROOM", color: pal.secondary, seed: samples(p.waveform, 76, 89) }];
  return <Base p={p} pal={pal} mesh><div style={{ position: "relative", zIndex: 1, boxSizing: "border-box", margin: "auto", width: "calc(100% - 120px)", maxWidth: 1500, padding: 55, borderRadius: 36, background: `${pal.bg}ee`, border: `1px solid ${pal.text}22`, flexShrink: 0 }}><Label color={pal.primary}>{p.title} · MULTI TRACK</Label><div style={{ marginTop: 52 }}>{tracks.map((track, i) => <div key={track.label} style={{ display: "flex", alignItems: "center", gap: 28, margin: "26px 0" }}><div style={{ flex: "0 0 150px", width: 150, color: track.color, font: `700 21px ${MONO}`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.label}</div><div style={{ flex: 1, minWidth: 0 }}><WaveBars values={track.seed} color={track.color} height={88} mirror gap={3} /></div></div>)}</div></div></Base>;
};

const SoundwavePoster: React.FC<{ p: WaveformStoriesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const values = samples(p.waveform, 64, 97);
  const rings = [0, 1, 2, 3, 4];
  return <Base p={p} pal={pal}><div style={{ margin: "auto", position: "relative", width: 800, height: 800, borderRadius: "50%", background: `radial-gradient(circle, ${pal.primary}44, ${pal.bg} 62%)`, border: `2px solid ${pal.primary}66`, display: "flex", alignItems: "center", justifyContent: "center", transform: `rotate(${frame * 0.25}deg)` }}>{rings.map((r) => <div key={r} style={{ position: "absolute", width: 180 + r * 130, height: 180 + r * 130, borderRadius: "50%", border: `2px solid ${r % 2 ? pal.accent : pal.primary}55` }} />)}<div style={{ position: "absolute", inset: 80 }}><WaveBars values={values} color={pal.accent} height={640} gap={5} mirror /></div><div style={{ position: "relative", textAlign: "center", transform: `rotate(${-frame * 0.25}deg)`, width: 480 }}><Label color={pal.text}>{p.showName}</Label><h1 style={{ margin: 22, font: `900 64px/0.95 ${FONT}`, letterSpacing: "-0.06em" }}>{p.title}</h1></div></div></Base>;
};

const WaveformClose: React.FC<{ p: WaveformStoriesProps; pal: Palette }> = ({ p, pal }) => {
  const values = samples(p.waveform, 36, 107);
  return <Base p={p} pal={pal} mesh><div style={{ margin: "auto", width: "100%", transform: "scale(1.8)" }}><WaveBars values={values} color={p.accentColor ?? pal.primary} height={500} gap={10} /><div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}><div><Label color={pal.text}>{p.showName}</Label><h1 style={{ margin: 25, font: `900 96px ${FONT}`, letterSpacing: "-0.07em" }}>{p.title}</h1></div></div></div></Base>;
};

const VARIANTS: Record<WaveformVariant, React.FC<{ p: WaveformStoriesProps; pal: Palette }>> = {
  "waveform-card": WaveformCard,
  "voice-quote": VoiceQuote,
  "chapter-wave": ChapterWave,
  "amplitude-zoom": AmplitudeZoom,
  "waveform-to-title": WaveformToTitle,
  "speaker-wave": SpeakerWave,
  "waveform-scrub": WaveformScrub,
  "multi-track": MultiTrack,
  "soundwave-poster": SoundwavePoster,
  "waveform-close": WaveformClose,
};

export const WaveformStoriesTemplate: React.FC<WaveformStoriesProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? WaveformCard;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <AbsoluteFill style={{ backgroundColor: pal.bg, overflow: "hidden" }}><FadeEdges inFrames={10} outFrames={12}><div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><Variant p={props} pal={pal} /></div></FadeEdges></AbsoluteFill>;
};

const familyCast = (component: React.FC<WaveformStoriesProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "waveform-stories-waveform-card": familyCast(WaveformStoriesTemplate),
  "waveform-stories-voice-quote": familyCast(WaveformStoriesTemplate),
  "waveform-stories-chapter-wave": familyCast(WaveformStoriesTemplate),
  "waveform-stories-amplitude-zoom": familyCast(WaveformStoriesTemplate),
  "waveform-stories-waveform-to-title": familyCast(WaveformStoriesTemplate),
  "waveform-stories-speaker-wave": familyCast(WaveformStoriesTemplate),
  "waveform-stories-waveform-scrub": familyCast(WaveformStoriesTemplate),
  "waveform-stories-multi-track": familyCast(WaveformStoriesTemplate),
  "waveform-stories-soundwave-poster": familyCast(WaveformStoriesTemplate),
  "waveform-stories-waveform-close": familyCast(WaveformStoriesTemplate),
};
