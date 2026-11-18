import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { GradientMeshBackground, NoiseGrainOverlay, resolvePalette, seededRand, type Palette } from "../lib/primitives";

/** Shareable vertical podcast clips. Defaults never require audio, images, or network access. */
export type PodcastClipVariant =
  | "host-guest" | "quote-highlight" | "chapter-tease" | "vertical-caption" | "question-answer"
  | "three-second-hook" | "clip-progress" | "sponsor-read" | "guest-card" | "listen-cta";

export interface PodcastClipProps {
  variant: PodcastClipVariant;
  transcript: string;
  wordTimings: Array<{ word: string; start?: number; end?: number }>;
  speakers: Array<{ name: string; role?: string; portraitUrl?: string; color?: string }>;
  waveform: number[];
  showName: string;
  episode: string;
  chapter: string;
  question: string;
  answer: string;
  quote: string;
  cta: string;
  sponsor: string;
  sponsorUrl: string;
  portraitUrls: string[];
  paletteName: string;
  accent: string;
  captionWords: string[];
}

const FONT = '"Inter", "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Menlo, Consolas, monospace';
const fallbackWords = ["The", "best", "ideas", "start", "as", "a", "conversation."];
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]?.toUpperCase()).join("") || "?";
const wordsFor = (p: PodcastClipProps) => p.captionWords?.length ? p.captionWords : p.wordTimings?.length ? p.wordTimings.map((x) => x.word) : (p.transcript || "").split(/\s+/).filter(Boolean).slice(0, 12).length ? (p.transcript || "").split(/\s+/).filter(Boolean) : fallbackWords;
const visibleWords = (p: PodcastClipProps, frame: number, fps: number, count = 5) => {
  const words = wordsFor(p);
  const at = Math.floor((frame / fps) * 1.7) % Math.max(1, words.length);
  return Array.from({ length: Math.min(count, words.length) }, (_, i) => words[(at + i) % words.length]);
};
const hex = (value: string, fallback: string) => /^#[0-9a-f]{6}$/i.test(value || "") ? value : fallback;

const Backdrop: React.FC<{ p: PodcastClipProps; pal: Palette; children: React.ReactNode }> = ({ p, pal, children }) => (
  <AbsoluteFill style={{ background: pal.bg, color: pal.text, fontFamily: FONT, overflow: "hidden" }}>
    <GradientMeshBackground palette={pal} />
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${pal.bg}18, ${pal.bg}cc 62%, ${pal.bg})` }} />
    {children}
    <NoiseGrainOverlay opacity={0.06} />
    <div style={{ position: "absolute", left: 54, right: 54, bottom: 42, display: "flex", justifyContent: "space-between", color: `${pal.text}88`, font: `700 18px ${MONO}`, letterSpacing: "0.12em", textTransform: "uppercase" }}>
      <span>{p.showName}</span><span>{p.episode}</span>
    </div>
  </AbsoluteFill>
);

const Avatar: React.FC<{ name: string; color: string; portrait?: string; size?: number }> = ({ name, color, portrait, size = 118 }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", flex: "0 0 auto", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", font: `800 ${size * 0.29}px ${FONT}`, background: `linear-gradient(135deg, ${color}, ${color}55)`, border: "3px solid #ffffff44", boxShadow: `0 14px 45px ${color}55` }}>
    {portrait ? <img src={portrait} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(name)}
  </div>
);

const Wave: React.FC<{ p: PodcastClipProps; pal: Palette; frame: number; height?: number; bars?: number; color?: string }> = ({ p, pal, frame, height = 180, bars = 42, color }) => {
  const data = p.waveform?.length ? p.waveform : Array.from({ length: bars }, (_, i) => 0.2 + seededRand(i + 77) * 0.7);
  return <div style={{ height, display: "flex", alignItems: "center", gap: 6, width: "100%" }}>{Array.from({ length: bars }, (_, i) => {
    const base = data[i % data.length] ?? 0.5;
    const pulse = 0.55 + Math.abs(Math.sin(frame * 0.11 + i * 0.43)) * 0.7;
    return <div key={i} style={{ flex: 1, maxWidth: 18, minWidth: 3, height: Math.max(6, Math.min(1, base * pulse) * height * 0.9), borderRadius: 30, background: color || pal.primary, opacity: 0.72 + (i % 4) * 0.06, boxShadow: `0 0 20px ${color || pal.primary}66` }} />;
  })}</div>;
};

const TopLabel: React.FC<{ p: PodcastClipProps; pal: Palette; text?: string }> = ({ p, pal, text }) => <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: pal.secondary, font: `700 20px ${MONO}`, letterSpacing: "0.16em", textTransform: "uppercase" }}><span>{text || p.chapter || "NEW CLIP"}</span><span style={{ color: pal.accent }}>● LIVE AUDIO</span></div>;

const HostGuest: React.FC<{ p: PodcastClipProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const s = p.speakers?.length ? p.speakers : [{ name: "Alex", role: "Host" }, { name: "Jordan", role: "Guest" }];
  return <Backdrop p={p} pal={pal}><AbsoluteFill style={{ padding: "110px 58px 130px", justifyContent: "center" }}><TopLabel p={p} pal={pal} /><div style={{ marginTop: 90, display: "flex", gap: 28, alignItems: "center" }}>{s.slice(0, 2).map((sp, i) => <React.Fragment key={sp.name}><Avatar name={sp.name} color={hex(sp.color || "", i ? pal.accent : pal.primary)} portrait={sp.portraitUrl || p.portraitUrls?.[i]} size={142} />{i === 0 && <div style={{ color: pal.secondary, font: `800 36px ${FONT}` }}>×</div>}</React.Fragment>)}</div><h1 style={{ margin: "50px 0 18px", fontSize: 76, lineHeight: 0.98, letterSpacing: "-0.05em" }}>{p.episode || "A conversation worth sharing"}</h1><div style={{ color: `${pal.text}aa`, fontSize: 30 }}>{s[0]?.name || "Host"} with {s[1]?.name || "Guest"}</div><div style={{ marginTop: 72 }}><Wave p={p} pal={pal} frame={frame} color={pal.accent} /></div><div style={{ color: pal.secondary, font: `700 21px ${MONO}` }}>{(frame / fps).toFixed(1)} / 00:45</div></AbsoluteFill></Backdrop>;
};

const QuoteHighlight: React.FC<{ p: PodcastClipProps; pal: Palette }> = ({ p, pal }) => { const frame = useCurrentFrame(); const enter = interpolate(frame, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }); return <Backdrop p={p} pal={pal}><AbsoluteFill style={{ padding: "150px 64px", justifyContent: "center", transform: `translateY(${(1 - enter) * 50}px)`, opacity: enter }}><div style={{ color: pal.accent, fontSize: 150, lineHeight: 0.5, fontWeight: 900 }}>“</div><div style={{ fontSize: 65, lineHeight: 1.03, letterSpacing: "-0.05em", fontWeight: 800 }}>{p.quote || p.transcript || "Make the thing people remember."}</div><div style={{ marginTop: 62, color: pal.secondary, font: `700 23px ${MONO}` }}>— {p.speakers?.[1]?.name || "THE GUEST"}</div></AbsoluteFill></Backdrop>; };

const ChapterTease: React.FC<{ p: PodcastClipProps; pal: Palette }> = ({ p, pal }) => { const frame = useCurrentFrame(); const chapters = p.chapter ? [p.chapter, "The turning point", "What comes next"] : ["The opening idea", "The turning point", "What comes next"]; return <Backdrop p={p} pal={pal}><AbsoluteFill style={{ padding: "120px 58px", justifyContent: "center" }}><TopLabel p={p} pal={pal} text="CHAPTER TEASE" /><div style={{ marginTop: 92, color: pal.text, fontSize: 62, fontWeight: 800, letterSpacing: "-0.05em" }}>Inside this episode</div><div style={{ marginTop: 58 }}>{chapters.map((x, i) => { const on = i === Math.floor(frame / 30) % chapters.length; return <div key={x} style={{ display: "flex", alignItems: "center", gap: 25, padding: "24px 0", opacity: on ? 1 : 0.4, transform: `translateX(${on ? 0 : 20}px)`, borderBottom: `1px solid ${pal.text}22` }}><span style={{ color: on ? pal.accent : pal.secondary, font: `700 23px ${MONO}` }}>0{i + 1}</span><span style={{ fontSize: 34, fontWeight: 650 }}>{x}</span></div>; })}</div><div style={{ marginTop: 80 }}><Wave p={p} pal={pal} frame={frame} height={100} bars={32} /></div></AbsoluteFill></Backdrop>; };

const Caption: React.FC<{ p: PodcastClipProps; pal: Palette; mode?: "caption" | "question" | "hook" }> = ({ p, pal, mode = "caption" }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const words = visibleWords(p, frame, fps, mode === "hook" ? 3 : 5); const text = mode === "question" ? (p.question || "What would you do differently?") : mode === "hook" ? words.join(" ") : words.join(" "); return <Backdrop p={p} pal={pal}><AbsoluteFill style={{ padding: "110px 48px 150px", justifyContent: "center", alignItems: "center", textAlign: "center" }}><TopLabel p={p} pal={pal} text={mode === "hook" ? "3 SECOND HOOK" : mode === "question" ? "THE QUESTION" : "CAPTION CLIP"} /><div style={{ marginTop: 150, fontSize: mode === "hook" ? 92 : 68, lineHeight: 0.98, letterSpacing: "-0.055em", fontWeight: 850, maxWidth: 900 }}>{text}</div><div style={{ marginTop: 65, width: "100%" }}><Wave p={p} pal={pal} frame={frame} height={90} bars={48} color={pal.accent} /></div></AbsoluteFill></Backdrop>; };

const QuestionAnswer: React.FC<{ p: PodcastClipProps; pal: Palette }> = ({ p, pal }) => <Backdrop p={p} pal={pal}><AbsoluteFill style={{ padding: "125px 54px", justifyContent: "center" }}><TopLabel p={p} pal={pal} text="QUESTION / ANSWER" /><div style={{ marginTop: 80, color: pal.accent, font: `700 22px ${MONO}`, letterSpacing: "0.1em" }}>Q</div><div style={{ fontSize: 52, lineHeight: 1.04, fontWeight: 800, marginTop: 16 }}>{p.question || "What changed your mind?"}</div><div style={{ margin: "58px 0 0", borderLeft: `6px solid ${pal.primary}`, paddingLeft: 27, color: `${pal.text}cc`, fontSize: 38, lineHeight: 1.1 }}>{p.answer || p.quote || "The answer was simpler than I expected."}</div><div style={{ marginTop: 66 }}><Wave p={p} pal={pal} frame={useCurrentFrame()} height={75} bars={38} /></div></AbsoluteFill></Backdrop>;

const Progress: React.FC<{ p: PodcastClipProps; pal: Palette; guest?: boolean }> = ({ p, pal, guest = false }) => { const frame = useCurrentFrame(); const progress = (frame % 135) / 135; return <Backdrop p={p} pal={pal}><AbsoluteFill style={{ padding: "120px 54px", justifyContent: "center" }}><TopLabel p={p} pal={pal} text={guest ? "MEET THE GUEST" : "CLIP PROGRESS"} />{guest ? <><div style={{ marginTop: 90, alignItems: "center", display: "flex", flexDirection: "column" }}><Avatar name={p.speakers?.[1]?.name || "Jordan Lee"} color={pal.accent} portrait={p.portraitUrls?.[1]} size={250} /><div style={{ marginTop: 34, fontSize: 54, fontWeight: 800 }}>{p.speakers?.[1]?.name || "Jordan Lee"}</div><div style={{ marginTop: 14, color: pal.secondary, font: `700 21px ${MONO}` }}>{p.speakers?.[1]?.role || "GUEST / BUILDER"}</div></div></> : <><div style={{ marginTop: 110, fontSize: 94, fontWeight: 850, letterSpacing: "-0.06em" }}>{Math.round(progress * 100)}<span style={{ color: pal.accent }}>%</span></div><div style={{ marginTop: 35, height: 20, borderRadius: 20, background: `${pal.text}1f`, overflow: "hidden" }}><div style={{ height: "100%", width: `${progress * 100}%`, background: pal.accent, borderRadius: 20 }} /></div><div style={{ marginTop: 75 }}><Wave p={p} pal={pal} frame={frame} height={130} bars={52} /></div></>}</AbsoluteFill></Backdrop>; };

const Sponsor: React.FC<{ p: PodcastClipProps; pal: Palette }> = ({ p, pal }) => <Backdrop p={p} pal={pal}><AbsoluteFill style={{ padding: "125px 55px", justifyContent: "center" }}><TopLabel p={p} pal={pal} text="BROUGHT TO YOU BY" /><div style={{ marginTop: 105, padding: "64px 38px", borderRadius: 34, border: `1px solid ${pal.accent}66`, background: `${pal.accent}12`, textAlign: "center" }}><div style={{ color: pal.accent, font: `800 25px ${MONO}`, letterSpacing: "0.15em" }}>PARTNER</div><div style={{ marginTop: 30, fontSize: 68, fontWeight: 850 }}>{p.sponsor || "Northstar"}</div><div style={{ marginTop: 28, fontSize: 29, color: `${pal.text}bb` }}>{p.sponsorUrl || "Build a better workflow."}</div></div><div style={{ marginTop: 100 }}><Wave p={p} pal={pal} frame={useCurrentFrame()} height={90} bars={42} color={pal.accent} /></div></AbsoluteFill></Backdrop>;

const ListenCta: React.FC<{ p: PodcastClipProps; pal: Palette }> = ({ p, pal }) => <Backdrop p={p} pal={pal}><AbsoluteFill style={{ padding: "120px 54px", justifyContent: "center", alignItems: "center", textAlign: "center" }}><TopLabel p={p} pal={pal} text="FULL EPISODE" /><div style={{ marginTop: 120, width: 210, height: 210, borderRadius: "50%", background: pal.accent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 90px ${pal.accent}66` }}><div style={{ marginLeft: 16, width: 0, height: 0, borderTop: "30px solid transparent", borderBottom: "30px solid transparent", borderLeft: `48px solid ${pal.bg}` }} /></div><div style={{ marginTop: 68, fontSize: 68, fontWeight: 850, letterSpacing: "-0.05em" }}>{p.cta || "Listen to the full episode"}</div><div style={{ marginTop: 25, color: pal.secondary, font: `700 22px ${MONO}` }}>{p.showName} · {p.episode}</div></AbsoluteFill></Backdrop>;

const PodcastClips: React.FC<PodcastClipProps> = (p) => { const pal = resolvePalette(p.paletteName || "midnight"); switch (p.variant) { case "host-guest": return <HostGuest p={p} pal={pal} />; case "quote-highlight": return <QuoteHighlight p={p} pal={pal} />; case "chapter-tease": return <ChapterTease p={p} pal={pal} />; case "vertical-caption": return <Caption p={p} pal={pal} />; case "question-answer": return <QuestionAnswer p={p} pal={pal} />; case "three-second-hook": return <Caption p={p} pal={pal} mode="hook" />; case "clip-progress": return <Progress p={p} pal={pal} />; case "sponsor-read": return <Sponsor p={p} pal={pal} />; case "guest-card": return <Progress p={p} pal={pal} guest />; case "listen-cta": return <ListenCta p={p} pal={pal} />; default: return <Caption p={p} pal={pal} />; } };
const familyCast = (component: React.FC<PodcastClipProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;
export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "podcast-clips-host-guest": familyCast(PodcastClips), "podcast-clips-quote-highlight": familyCast(PodcastClips), "podcast-clips-chapter-tease": familyCast(PodcastClips), "podcast-clips-vertical-caption": familyCast(PodcastClips), "podcast-clips-question-answer": familyCast(PodcastClips), "podcast-clips-three-second-hook": familyCast(PodcastClips), "podcast-clips-clip-progress": familyCast(PodcastClips), "podcast-clips-sponsor-read": familyCast(PodcastClips), "podcast-clips-guest-card": familyCast(PodcastClips), "podcast-clips-listen-cta": familyCast(PodcastClips),
};
