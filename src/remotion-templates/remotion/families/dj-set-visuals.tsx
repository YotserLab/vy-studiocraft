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
 * FAMILY: dj-set-visuals
 * Ten deterministic, club-ready set identities. Motion is deliberately
 * smooth and restrained by default so the templates remain readable and
 * safe for general-purpose playback; raise intensity for a more energetic
 * treatment without introducing rapid strobing.
 */
type DJVariant =
  | "deck-intro"
  | "bpm-pulse"
  | "track-change"
  | "drop-impact"
  | "mix-progress"
  | "laser-grid"
  | "crowd-card"
  | "setlist-scroll"
  | "artist-id"
  | "set-close";

export interface DJSetProps {
  variant: DJVariant;
  artist: string;
  track: string;
  bpm: number;
  setlist: string[];
  beatMarkers: number[];
  paletteName: string;
  logo: string;
  intensity: number;
}

type ViewProps = { p: DJSetProps; pal: Palette };
const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", "SF Mono", Menlo, Consolas, monospace';

const safeIntensity = (value: number) => Math.min(1, Math.max(0.2, Number.isFinite(value) ? value : 0.65));
const beat = (frame: number, p: DJSetProps) => {
  const markers = p.beatMarkers?.length ? p.beatMarkers : [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150];
  const nearest = markers.reduce((best, marker) => Math.abs(marker - frame) < Math.abs(best - frame) ? marker : best, markers[0]);
  return Math.max(0, 1 - Math.abs(frame - nearest) / 14);
};
const textShadow = (color: string, amount = 18) => `0 0 ${amount}px ${color}88`;

const Eyebrow: React.FC<{ children: React.ReactNode; color: string }> = ({ children, color }) => (
  <div style={{ color, fontFamily: MONO, fontSize: 22, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase" }}>
    {children}
  </div>
);

const BeatBars: React.FC<{ p: DJSetProps; color: string; bars?: number; height?: number; seed?: number }> = ({ p, color, bars = 32, height = 180, seed = 1 }) => {
  const frame = useCurrentFrame();
  const energy = safeIntensity(p.intensity);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height, width: "100%" }}>
      {Array.from({ length: bars }, (_, i) => {
        const base = 0.16 + seededRand(seed + i * 19) * 0.26;
        const wave = Math.abs(Math.sin(frame * 0.07 * energy + i * 0.48 + seed));
        const h = Math.max(4, height * (base + wave * (0.28 + energy * 0.38)));
        return <div key={i} style={{ flex: "1 1 0", maxWidth: 22, height: h, borderRadius: 999, background: color, opacity: 0.65 + energy * 0.3, boxShadow: `0 0 ${8 + h * 0.08}px ${color}77` }} />;
      })}
    </div>
  );
};

const Deck: React.FC<{ p: DJSetProps; pal: Palette; scale?: number }> = ({ p, pal, scale = 1 }) => {
  const frame = useCurrentFrame();
  const spin = frame * (1.2 + safeIntensity(p.intensity) * 2.8);
  return (
    <div style={{ transform: `scale(${scale})`, display: "flex", alignItems: "center", gap: 34 }}>
      {[0, 1].map((i) => (
        <div key={i} style={{ width: 230, height: 180, borderRadius: 18, background: `linear-gradient(145deg, ${pal.text}20, ${pal.bg})`, border: `2px solid ${pal.text}44`, boxShadow: `0 24px 50px ${pal.bg}aa`, padding: 18 }}>
          <div style={{ height: 16, display: "flex", justifyContent: "space-between", color: pal.secondary, font: `700 13px ${MONO}`, letterSpacing: 2 }}><span>{i ? "B" : "A"} DECK</span><span>{p.bpm}</span></div>
          <div style={{ width: 110, height: 110, margin: "12px auto 0", borderRadius: "50%", background: `repeating-conic-gradient(${pal.text} 0 5deg, ${pal.primary} 5deg 12deg, ${pal.bg} 12deg 22deg)`, border: `9px solid ${pal.bg}`, transform: `rotate(${i ? -spin : spin}deg)`, boxShadow: `0 0 0 2px ${pal.text}44, 0 0 28px ${pal.primary}55` }}>
            <div style={{ width: 28, height: 28, margin: 32, borderRadius: "50%", background: pal.accent, border: `6px solid ${pal.bg}` }} />
          </div>
        </div>
      ))}
    </div>
  );
};

const DeckIntro: React.FC<ViewProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 90 } });
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, ${pal.primary}44, transparent 45%), ${pal.bg}`, color: pal.text, justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.2, backgroundImage: `linear-gradient(${pal.primary} 1px, transparent 1px), linear-gradient(90deg, ${pal.primary} 1px, transparent 1px)`, backgroundSize: "86px 86px", transform: `perspective(700px) rotateX(58deg) translateY(${(frame * 2) % 86}px)`, transformOrigin: "center bottom" }} />
      <div style={{ position: "relative", width: "80%", display: "flex", alignItems: "center", justifyContent: "space-between", transform: `translateY(${interpolate(enter, [0, 1], [90, 0])}px)`, opacity: enter }}>
        <div style={{ maxWidth: "55%" }}><Eyebrow color={pal.accent}>Live set / 01</Eyebrow><div style={{ marginTop: 26, font: `850 ${Math.min(width * 0.09, 150)}px/.9 ${FONT}`, letterSpacing: "-0.07em", textShadow: textShadow(pal.primary, 28) }}>{p.artist}</div><div style={{ marginTop: 28, color: `${pal.text}bb`, font: `500 34px ${FONT}` }}>{p.track}</div><div style={{ marginTop: 36, color: pal.secondary, font: `700 22px ${MONO}`, letterSpacing: 4 }}>{p.bpm} BPM&nbsp;&nbsp;•&nbsp;&nbsp;{p.logo || "NIGHT SIGNAL"}</div></div>
        <Deck p={p} pal={pal} scale={0.9} />
      </div>
      <div style={{ position: "absolute", bottom: 54, left: "10%", right: "10%" }}><BeatBars p={p} color={pal.accent} bars={48} height={68} seed={19} /></div>
    </AbsoluteFill>
  );
};

const BpmPulse: React.FC<ViewProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const energy = safeIntensity(p.intensity);
  const pulse = 1 + beat(frame, p) * 0.1 * energy;
  return (
    <AbsoluteFill style={{ background: pal.bg, color: pal.text, justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
      {Array.from({ length: 7 }, (_, i) => { const s = 0.22 + i * 0.13 + ((frame * 0.0025 * energy) % 0.12); return <div key={i} style={{ position: "absolute", width: `${s * 100}%`, aspectRatio: 1, borderRadius: "50%", border: `2px solid ${i % 2 ? pal.secondary : pal.primary}`, opacity: Math.max(0.05, 0.42 - i * 0.045), transform: `scale(${pulse}) rotate(${frame * (i % 2 ? -0.03 : 0.03)}deg)` }} />; })}
      <div style={{ position: "relative", textAlign: "center", transform: `scale(${pulse})` }}><Eyebrow color={pal.secondary}>{p.bpm} BPM / pulse study</Eyebrow><div style={{ marginTop: 26, font: `850 116px/.9 ${FONT}`, letterSpacing: "-0.07em", textShadow: textShadow(pal.primary, 30) }}>{p.track}</div><div style={{ marginTop: 26, font: `500 30px ${MONO}`, color: `${pal.text}99`, letterSpacing: 3 }}>{p.artist}</div></div>
      <div style={{ position: "absolute", bottom: 74, width: "72%" }}><BeatBars p={p} color={pal.primary} bars={42} height={120} seed={8} /></div>
    </AbsoluteFill>
  );
};

const TrackChange: React.FC<ViewProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const reveal = clampInterp(frame, [8, 36], [0, 1]);
  const oldTrack = p.setlist?.[0] || "Previous Frequency";
  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${pal.bg}, ${pal.primary}22)`, color: pal.text, overflow: "hidden", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: `repeating-linear-gradient(90deg, transparent 0 90px, ${pal.text}09 91px 92px)`, transform: `translateX(${-(frame * 2 % 90)}px)` }} />
      <div style={{ position: "relative", width: "76%", margin: "0 auto" }}><Eyebrow color={pal.accent}>Now switching / {p.bpm} BPM</Eyebrow><div style={{ display: "flex", alignItems: "center", gap: 42, marginTop: 38 }}><div style={{ flex: 1, color: `${pal.text}55`, font: `700 48px ${FONT}`, textDecoration: "line-through", transform: `translateX(${(1 - reveal) * -80}px)`, opacity: 1 - reveal * 0.6 }}>{oldTrack}</div><div style={{ color: pal.accent, font: `800 48px ${MONO}` }}>→</div><div style={{ flex: 1, color: pal.text, font: `850 70px/.95 ${FONT}`, transform: `translateX(${(1 - reveal) * 100}px)`, opacity: reveal }}>{p.track}</div></div><div style={{ marginTop: 58, width: `${reveal * 100}%`, height: 7, background: pal.primary, boxShadow: `0 0 28px ${pal.primary}` }} /><div style={{ marginTop: 26, color: `${pal.text}88`, font: `500 28px ${MONO}` }}>{p.artist}&nbsp;&nbsp; / &nbsp;&nbsp;crossfade engaged</div></div>
    </AbsoluteFill>
  );
};

const DropImpact: React.FC<ViewProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const energy = safeIntensity(p.intensity);
  const impact = Math.max(0, 1 - Math.min(1, (frame - 28) / 28));
  const scale = 1 + impact * 0.12 * energy;
  return (
    <AbsoluteFill style={{ background: pal.bg, color: pal.text, justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: `${40 + impact * 46}%`, aspectRatio: 1, borderRadius: "50%", background: `radial-gradient(circle, ${pal.accent}bb, ${pal.primary}44 35%, transparent 70%)`, opacity: 0.35 + impact * 0.35, transform: `scale(${scale})` }} />
      {Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2; const r = 170 + impact * 500; return <div key={i} style={{ position: "absolute", width: 5, height: r * 0.22, background: pal.secondary, opacity: 0.18 + impact * 0.4, transformOrigin: "center bottom", transform: `rotate(${a}rad) translateY(${-r}px)`, borderRadius: 9 }} />; })}
      <div style={{ position: "relative", textAlign: "center", transform: `scale(${scale})`, opacity: 0.8 + impact * 0.2 }}><Eyebrow color={pal.accent}>DROP / {p.bpm} BPM</Eyebrow><div style={{ marginTop: 24, font: `950 140px/.86 ${FONT}`, letterSpacing: "-0.09em", textTransform: "uppercase", textShadow: textShadow(pal.accent, 34) }}>{p.track}</div><div style={{ marginTop: 32, color: pal.secondary, font: `700 27px ${MONO}`, letterSpacing: 5 }}>{p.artist}</div></div>
    </AbsoluteFill>
  );
};

const MixProgress: React.FC<ViewProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = clampInterp(frame, [0, Math.max(1, durationInFrames - 1)], [0, 1]);
  const elapsed = Math.floor(progress * 48);
  return (
    <AbsoluteFill style={{ background: pal.bg, color: pal.text, padding: "9% 10%", justifyContent: "center" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}><div><Eyebrow color={pal.secondary}>Mix in progress</Eyebrow><div style={{ marginTop: 25, font: `850 92px/.95 ${FONT}`, letterSpacing: "-0.07em" }}>{p.artist}</div><div style={{ marginTop: 18, color: `${pal.text}aa`, font: `500 32px ${FONT}` }}>{p.track}</div></div><div style={{ color: pal.accent, font: `700 33px ${MONO}` }}>{String(elapsed).padStart(2, "0")} / 48:00</div></div>
      <div style={{ marginTop: 90, height: 22, borderRadius: 99, background: `${pal.text}1c`, overflow: "hidden" }}><div style={{ width: `${progress * 100}%`, height: "100%", background: `linear-gradient(90deg, ${pal.primary}, ${pal.accent})`, boxShadow: `0 0 30px ${pal.primary}` }} /></div>
      <div style={{ marginTop: 46 }}><BeatBars p={p} color={pal.secondary} bars={64} height={180} seed={44} /></div><div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", color: `${pal.text}77`, font: `600 22px ${MONO}` }}><span>WARMUP</span><span>PEAK</span><span>OUTRO</span></div>
    </AbsoluteFill>
  );
};

const LaserGrid: React.FC<ViewProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const energy = safeIntensity(p.intensity);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 28%, ${pal.primary}55, transparent 45%), ${pal.bg}`, overflow: "hidden", color: pal.text }}>
      <div style={{ position: "absolute", left: "-20%", right: "-20%", top: "46%", height: "80%", transform: `perspective(540px) rotateX(66deg) translateY(${(frame * 3 * energy) % 60}px)`, transformOrigin: "top center", backgroundImage: `linear-gradient(${pal.primary}a8 2px, transparent 2px), linear-gradient(90deg, ${pal.secondary}a8 2px, transparent 2px)`, backgroundSize: "58px 58px", boxShadow: `0 -10px 50px ${pal.primary}` }} />
      {[-18, 0, 18].map((x, i) => <div key={i} style={{ position: "absolute", left: `${50 + x}%`, top: "-8%", width: 7, height: "115%", background: `linear-gradient(transparent, ${i === 1 ? pal.accent : pal.secondary}aa, transparent)`, filter: "blur(7px)", opacity: 0.3 + energy * 0.4, transform: `rotate(${x * 0.7 + Math.sin(frame * 0.018 + i) * 5}deg)`, transformOrigin: "center" }} />)}
      <div style={{ position: "relative", zIndex: 2, padding: "10%", display: "flex", justifyContent: "space-between" }}><div><Eyebrow color={pal.accent}>Laser grid / {p.bpm} BPM</Eyebrow><div style={{ marginTop: 28, font: `900 95px/.9 ${FONT}`, letterSpacing: "-0.08em" }}>{p.track}</div></div><div style={{ color: pal.secondary, font: `700 27px ${MONO}`, letterSpacing: 3 }}>{p.artist}</div></div>
    </AbsoluteFill>
  );
};

const CrowdCard: React.FC<ViewProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const energy = safeIntensity(p.intensity);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${pal.primary}55, ${pal.bg} 52%)`, color: pal.text, overflow: "hidden", justifyContent: "flex-end" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: "28%", height: "50%", display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 18, transform: `translateX(${Math.sin(frame * 0.03) * 12}px)` }}>
        {Array.from({ length: 24 }, (_, i) => { const h = 120 + seededRand(i * 13 + 4) * 350; const sway = Math.sin(frame * 0.04 + i) * 10 * energy; return <div key={i} style={{ width: 42 + seededRand(i + 8) * 32, height: h, borderRadius: "50% 50% 12px 12px", background: `linear-gradient(180deg, ${i % 3 ? pal.secondary : pal.accent}, ${pal.bg})`, opacity: 0.45 + seededRand(i + 2) * 0.3, transform: `translateY(${sway}px) rotate(${sway * 0.12}deg)` }} />; })}
      </div>
      <div style={{ position: "relative", zIndex: 2, padding: "0 10% 10%", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}><div><Eyebrow color={pal.accent}>Crowd card / live now</Eyebrow><div style={{ marginTop: 20, font: `900 90px/.9 ${FONT}`, letterSpacing: "-0.08em" }}>{p.artist}</div><div style={{ marginTop: 22, color: `${pal.text}aa`, font: `500 30px ${FONT}` }}>{p.track}</div></div><div style={{ textAlign: "right", color: pal.secondary, font: `700 28px ${MONO}` }}>{p.bpm} BPM<br />{p.logo || "LIVE"}</div></div>
    </AbsoluteFill>
  );
};

const SetlistScroll: React.FC<ViewProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const items = Array.from(new Set([...(p.setlist ?? []), p.track, "Afterimage", "Low Orbit", "Night Drive", "Final Signal"])).slice(0, 5);
  const activeIndex = Math.floor(frame / 48) % items.length;
  return (
    <AbsoluteFill style={{ background: pal.bg, color: pal.text, overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "8%", left: "12%", right: "12%", paddingBottom: "3%", display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: `2px solid ${pal.text}55` }}><div style={{ minWidth: 0, width: "68%", overflow: "hidden" }}><Eyebrow color={pal.secondary}>Tonight's sequence</Eyebrow><div style={{ marginTop: "2%", font: `900 clamp(30px, 6vw, 70px)/.9 ${FONT}`, letterSpacing: "-0.08em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.artist}</div></div><div style={{ width: "28%", color: pal.accent, font: `700 clamp(14px, 2.4vw, 27px) ${MONO}`, letterSpacing: 2, whiteSpace: "nowrap", textAlign: "right" }}>{p.bpm} BPM / SETLIST</div></div>
      <div style={{ position: "absolute", top: "35%", left: "12%", right: "12%", display: "flex", flexDirection: "column", transform: `translateY(-${Math.min(frame * 0.08, 8)}px)` }}>{items.map((item, i) => <div key={`${item}-${i}`} style={{ display: "grid", gridTemplateColumns: "clamp(30px, 5vw, 62px) minmax(0, 1fr) clamp(72px, 11vw, 140px)", alignItems: "center", gap: "2%", height: "11vh", minHeight: 38, maxHeight: 112, boxSizing: "border-box", borderBottom: `1px solid ${pal.text}2e`, opacity: i === activeIndex ? 1 : 0.9 }}><div style={{ color: pal.accent, font: `700 clamp(12px, 2vw, 23px) ${MONO}` }}>{String(i + 1).padStart(2, "0")}</div><div style={{ minWidth: 0, font: `750 clamp(20px, ${i === activeIndex ? "4.8vw" : "3.8vw"}, ${i === activeIndex ? 56 : 46}px)/.98 ${FONT}`, letterSpacing: "-0.04em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item}</div><div style={{ color: pal.secondary, font: `700 clamp(11px, 1.7vw, 20px) ${MONO}`, whiteSpace: "nowrap", textAlign: "right" }}>{String(122 + i * 3)} BPM</div></div>)}</div>
    </AbsoluteFill>
  );
};

const ArtistId: React.FC<ViewProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  const reveal = clampInterp(frame, [5, 38], [0, 1]);
  const logo = p.logo || p.artist.slice(0, 2).toUpperCase();
  return (
    <AbsoluteFill style={{ background: pal.bg, color: pal.text, overflow: "hidden" }}>
      <div style={{ position: "relative", width: 1920, height: 1080, transform: `scale(${fit})`, transformOrigin: "top left", background: pal.bg, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 288, top: 112, width: 1344, height: 1344, borderRadius: "50%", border: `1px solid ${pal.primary}55`, transform: `rotate(${frame * 0.3}deg) scale(${1 + Math.sin(frame * 0.025) * 0.03})`, boxShadow: `0 0 100px ${pal.primary}33` }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", opacity: reveal, transform: `translateY(${(1 - reveal) * 70}px)` }}><div style={{ width: 190, height: 190, flex: "0 0 auto", margin: "0 auto 38px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: `3px solid ${pal.accent}`, background: `linear-gradient(145deg, ${pal.primary}, ${pal.bg})`, color: pal.text, font: `900 62px ${MONO}`, boxShadow: `0 0 44px ${pal.accent}66` }}>{logo}</div><Eyebrow color={pal.secondary}>Artist identity</Eyebrow><div style={{ marginTop: 20, maxWidth: 1500, font: `950 118px/.86 ${FONT}`, letterSpacing: "-0.09em", textTransform: "uppercase", textShadow: textShadow(pal.primary, 28), whiteSpace: "nowrap" }}>{p.artist}</div><div style={{ marginTop: 28, color: `${pal.text}cc`, font: `500 30px ${FONT}` }}>{p.track} / {p.bpm} BPM</div></div>
        <div style={{ position: "absolute", bottom: 62, left: 0, right: 0, textAlign: "center", color: `${pal.text}aa`, font: `700 21px ${MONO}`, letterSpacing: 5 }}>SIGNAL / SOUND / SPACE</div>
      </div>
    </AbsoluteFill>
  );
};

const SetClose: React.FC<ViewProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = spring({ frame: Math.max(0, frame - 16), fps, config: { damping: 18, stiffness: 75 } });
  const opacity = clampInterp(frame, [70, 130], [1, 0]);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 35%, ${pal.primary}55, transparent 45%), ${pal.bg}`, color: pal.text, justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.18 }}><BeatBars p={p} color={pal.secondary} bars={56} height={720} seed={73} /></div>
      <div style={{ position: "relative", textAlign: "center", opacity, transform: `scale(${interpolate(exit, [0, 1], [0.84, 1])})` }}><Eyebrow color={pal.accent}>End of set</Eyebrow><div style={{ marginTop: 24, font: `950 128px/.86 ${FONT}`, letterSpacing: "-0.1em" }}>{p.artist}</div><div style={{ marginTop: 28, color: pal.secondary, font: `700 28px ${MONO}`, letterSpacing: 5 }}>{p.track}</div><div style={{ marginTop: 70, color: `${pal.text}88`, font: `500 29px ${FONT}` }}>Thank you for listening</div><div style={{ marginTop: 32, color: pal.accent, font: `700 22px ${MONO}`, letterSpacing: 4 }}>{p.logo || "SEE YOU ON THE NEXT FREQUENCY"}</div></div>
    </AbsoluteFill>
  );
};

const VARIANTS: Record<DJVariant, React.FC<ViewProps>> = {
  "deck-intro": DeckIntro,
  "bpm-pulse": BpmPulse,
  "track-change": TrackChange,
  "drop-impact": DropImpact,
  "mix-progress": MixProgress,
  "laser-grid": LaserGrid,
  "crowd-card": CrowdCard,
  "setlist-scroll": SetlistScroll,
  "artist-id": ArtistId,
  "set-close": SetClose,
};

export const DJSetVisualsTemplate: React.FC<DJSetProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? DeckIntro;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <AbsoluteFill style={{ background: pal.bg }}><FadeEdges><div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><Variant p={props} pal={pal} /></div></FadeEdges></AbsoluteFill>;
};

const familyCast = (component: React.FC<DJSetProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "dj-set-visuals-deck-intro": familyCast(DJSetVisualsTemplate),
  "dj-set-visuals-bpm-pulse": familyCast(DJSetVisualsTemplate),
  "dj-set-visuals-track-change": familyCast(DJSetVisualsTemplate),
  "dj-set-visuals-drop-impact": familyCast(DJSetVisualsTemplate),
  "dj-set-visuals-mix-progress": familyCast(DJSetVisualsTemplate),
  "dj-set-visuals-laser-grid": familyCast(DJSetVisualsTemplate),
  "dj-set-visuals-crowd-card": familyCast(DJSetVisualsTemplate),
  "dj-set-visuals-setlist-scroll": familyCast(DJSetVisualsTemplate),
  "dj-set-visuals-artist-id": familyCast(DJSetVisualsTemplate),
  "dj-set-visuals-set-close": familyCast(DJSetVisualsTemplate),
};
