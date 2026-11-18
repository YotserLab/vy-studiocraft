import React from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, resolvePalette, seededRand, type Palette } from "../lib/primitives";

export type FilmTrailersVariant =
  | "teaser-escalation"
  | "three-act-trailer"
  | "review-burst"
  | "character-intro"
  | "mystery-cut"
  | "release-date"
  | "title-impact"
  | "ensemble-grid"
  | "final-lockup"
  | "trailer-loop";

export interface FilmTrailersProps {
  variant: FilmTrailersVariant;
  title: string;
  logline: string;
  tagline: string;
  reviews: string[];
  characters: string[];
  releaseDate: string;
  credits: string;
  imageUrls?: string[];
  accentColor?: string;
  paletteName: string;
  shots?: string[];
  intensity?: number;
}

const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';
const MONO = '"SFMono-Regular", Consolas, monospace';

const labels: Record<FilmTrailersVariant, string> = {
  "teaser-escalation": "A FIRST LOOK",
  "three-act-trailer": "THREE ACTS",
  "review-burst": "THE REVIEWS ARE IN",
  "character-intro": "MEET THE CAST",
  "mystery-cut": "EVERYTHING IS NOT WHAT IT SEEMS",
  "release-date": "COMING SOON",
  "title-impact": "A NEW MOTION PICTURE",
  "ensemble-grid": "ONE STORY / MANY LIVES",
  "final-lockup": "IN THEATRES / ON DEMAND",
  "trailer-loop": "WATCH AGAIN",
};

const defaultShots = [
  "A signal arrives in the dark.",
  "The door was never meant to open.",
  "Everyone has a version of what happened.",
  "The truth is closer than it looks.",
];

const fallbackReviews = ["A breathtaking new vision.", "Beautifully made and impossible to forget.", "A story that stays with you."];
const fallbackCharacters = ["THE SEEKER", "THE WITNESS", "THE UNKNOWN"];

const ShotField: React.FC<{ p: FilmTrailersProps; pal: Palette; index?: number; dark?: boolean }> = ({ p, pal, index = 0, dark = false }) => {
  const frame = useCurrentFrame();
  const image = p.imageUrls?.[index % p.imageUrls.length];
  const drift = Math.sin((frame + index * 31) * 0.018) * 3;
  const hue = seededRand(index + 8) * 25;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: `linear-gradient(${115 + hue}deg, ${pal.primary}99, ${pal.bg} 52%, ${pal.secondary}66)` }}>
      {image ? (
        <Img src={image} style={{ position: "absolute", inset: "-8%", width: "116%", height: "116%", objectFit: "cover", transform: `scale(1.04) translate(${drift}%, ${-drift / 2}%)`, filter: dark ? "brightness(0.52) contrast(1.25) saturate(0.7)" : "contrast(1.08) saturate(0.85)" }} />
      ) : (
        <>
          <div style={{ position: "absolute", inset: "-20%", background: `radial-gradient(ellipse at ${20 + seededRand(index + 2) * 60}% ${25 + seededRand(index + 3) * 50}%, ${pal.accent}99 0%, transparent 30%), linear-gradient(${130 + index * 23}deg, ${pal.primary}dd 0%, ${pal.bg} 52%, ${pal.secondary}77 100%)`, transform: `translate(${drift}%, ${-drift / 2}%) scale(1.08)` }} />
          <div style={{ position: "absolute", width: "55vw", height: "55vw", borderRadius: "50%", right: `${8 + index * 5}%`, top: `${8 + (index % 3) * 18}%`, border: `1px solid ${pal.text}35`, boxShadow: `0 0 80px ${pal.accent}33` }} />
          <div style={{ position: "absolute", left: "-10%", right: "-10%", bottom: `${18 + index * 3}%`, height: 2, background: pal.text, opacity: 0.24, transform: `rotate(${-7 + index * 2}deg)` }} />
        </>
      )}
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${pal.bg}${dark ? "28" : "05"} 15%, ${pal.bg}${dark ? "e6" : "58"} 100%)` }} />
    </AbsoluteFill>
  );
};

const Grain: React.FC<{ pal: Palette; opacity?: number }> = ({ pal, opacity = 0.1 }) => (
  <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity, backgroundImage: `repeating-linear-gradient(0deg, ${pal.text}10 0px, transparent 1px, transparent 4px), repeating-linear-gradient(90deg, ${pal.text}08 0px, transparent 1px, transparent 5px)`, mixBlendMode: "screen" }} />
);

const Frame: React.FC<{ p: FilmTrailersProps; pal: Palette; children: React.ReactNode; dark?: boolean }> = ({ p, pal, children, dark = true }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const intensity = p.intensity ?? 1;
  const enter = interpolate(frame, [0, Math.round(20 / intensity)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exit = interpolate(frame, [Math.max(0, durationInFrames - 20), durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ color: pal.text, background: dark ? "#050507" : pal.bg, fontFamily: SANS, opacity: Math.min(enter, exit) }}>{children}<Grain pal={pal} opacity={dark ? 0.16 : 0.08} /></AbsoluteFill>;
};

const Kicker: React.FC<{ text: string; accent: string; pal: Palette }> = ({ text, accent, pal }) => (
  <div style={{ color: accent, font: `700 15px ${MONO}`, letterSpacing: "0.2em", display: "flex", alignItems: "center", gap: 12 }}><span style={{ width: 34, height: 2, background: accent }} /><span>{text}</span><span style={{ color: pal.secondary, opacity: 0.65 }}>//</span></div>
);

const TrailerRenderer: React.FC<{ p: FilmTrailersProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const accent = p.accentColor ?? pal.accent;
  const shots = p.shots?.length ? p.shots : defaultShots;
  const reviews = p.reviews?.length ? p.reviews : fallbackReviews;
  const characters = p.characters?.length ? p.characters : fallbackCharacters;
  const beat = (n: number) => interpolate(frame, [n, n + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  switch (p.variant) {
    case "teaser-escalation":
      return <Frame p={p} pal={pal}><ShotField p={p} pal={pal} index={Math.floor(frame / 42)} dark /><div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${pal.bg}dd 0%, transparent 68%)` }} /><div style={{ position: "absolute", left: "7vw", bottom: "13vh", width: "76vw" }}><Kicker text={labels[p.variant]} accent={accent} pal={pal} /><div style={{ marginTop: 24, font: `700 clamp(42px, 7vw, 112px) ${SERIF}`, lineHeight: 0.95, maxWidth: 900 }}>{shots[Math.floor(frame / 42) % shots.length]}</div><div style={{ marginTop: 28, color: pal.secondary, font: `20px ${SANS}`, letterSpacing: "0.06em" }}>{p.tagline}</div></div><div style={{ position: "absolute", right: "6vw", top: "8vh", color: pal.secondary, font: `12px ${MONO}`, letterSpacing: "0.18em" }}>{String(Math.min(shots.length, Math.floor(frame / 42) + 1)).padStart(2, "0")} / {String(shots.length).padStart(2, "0")}</div></Frame>;
    case "three-act-trailer":
      return <Frame p={p} pal={pal}><div style={{ position: "absolute", inset: 0, display: "flex" }}>{[0, 1, 2].map((i) => <div key={i} style={{ flex: 1, position: "relative", overflow: "hidden", opacity: beat(i * 30) }}>{<ShotField p={p} pal={pal} index={i} dark />}<div style={{ position: "absolute", inset: 0, padding: "9vh 3vw", background: `linear-gradient(180deg, ${pal.bg}66, transparent 45%, ${pal.bg}dd)` }}><div style={{ color: accent, font: `700 13px ${MONO}`, letterSpacing: "0.16em" }}>{`ACT ${i + 1}`}</div><div style={{ position: "absolute", left: "3vw", right: "3vw", bottom: "10vh", font: `700 28px ${SERIF}` }}>{shots[i % shots.length]}</div></div></div>)}</div><div style={{ position: "absolute", left: "7vw", top: "7vh" }}><Kicker text={labels[p.variant]} accent={accent} pal={pal} /></div></Frame>;
    case "review-burst":
      return <Frame p={p} pal={pal} dark><div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 50%, ${pal.primary}44, transparent 54%)` }} /><div style={{ position: "absolute", left: "8vw", top: "8vh" }}><Kicker text={labels[p.variant]} accent={accent} pal={pal} /></div><div style={{ position: "absolute", left: "10vw", right: "10vw", top: "24vh", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>{reviews.slice(0, 3).map((review, i) => <div key={review} style={{ opacity: beat(i * 22), transform: `translateY(${(1 - beat(i * 22)) * 30}px)`, borderTop: `3px solid ${i === 1 ? accent : pal.secondary}`, paddingTop: 22 }}><div style={{ color: i === 1 ? accent : pal.secondary, font: `700 38px ${SERIF}` }}>“</div><div style={{ font: `italic 26px ${SERIF}`, lineHeight: 1.2 }}>{review}</div><div style={{ marginTop: 18, color: pal.secondary, font: `12px ${MONO}`, letterSpacing: "0.12em" }}>— PRESS / REVIEW</div></div>)}</div><div style={{ position: "absolute", left: "10vw", bottom: "12vh", font: `700 clamp(42px, 7vw, 110px) ${SERIF}` }}>{p.title}</div></Frame>;
    case "character-intro":
      return <Frame p={p} pal={pal}><div style={{ position: "absolute", inset: 0, display: "flex" }}>{characters.slice(0, 3).map((name, i) => <div key={name} style={{ flex: 1, position: "relative", overflow: "hidden", borderRight: `1px solid ${pal.text}25`, opacity: beat(i * 28) }}><ShotField p={p} pal={pal} index={i} dark /><div style={{ position: "absolute", left: "3vw", right: "3vw", bottom: "11vh" }}><div style={{ color: accent, font: `700 12px ${MONO}`, letterSpacing: "0.18em" }}>CHARACTER {String(i + 1).padStart(2, "0")}</div><div style={{ marginTop: 12, font: `700 clamp(28px, 4vw, 64px) ${SERIF}` }}>{name}</div></div></div>)}</div><div style={{ position: "absolute", left: "6vw", top: "7vh" }}><Kicker text={labels[p.variant]} accent={accent} pal={pal} /></div></Frame>;
    case "mystery-cut":
      return <Frame p={p} pal={pal} dark><ShotField p={p} pal={pal} index={2} dark /><div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 52% 44%, transparent 0%, ${pal.bg}dd 68%)` }} /><div style={{ position: "absolute", left: "12vw", right: "12vw", top: "29vh", textAlign: "center" }}><div style={{ color: accent, font: `700 14px ${MONO}`, letterSpacing: "0.22em" }}>{labels[p.variant]}</div><div style={{ marginTop: 30, font: `italic clamp(38px, 6vw, 92px) ${SERIF}`, lineHeight: 1.04 }}>{p.logline}</div><div style={{ marginTop: 32, color: pal.secondary, font: `17px ${MONO}`, letterSpacing: "0.12em" }}>THE ANSWER IS IN THE FRAME</div></div></Frame>;
    case "release-date":
      return <Frame p={p} pal={pal}><div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${pal.bg}, ${pal.primary}44)` }} /><div style={{ position: "absolute", inset: "10vh 7vw", border: `1px solid ${pal.text}44`, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}><Kicker text={labels[p.variant]} accent={accent} pal={pal} /><div style={{ marginTop: 34, font: `700 clamp(58px, 11vw, 180px) ${SERIF}`, lineHeight: 0.88 }}>{p.title}</div><div style={{ marginTop: 34, color: accent, font: `700 clamp(28px, 5vw, 72px) ${MONO}`, letterSpacing: "0.12em" }}>{p.releaseDate}</div><div style={{ marginTop: 22, color: pal.secondary, font: `18px ${SANS}`, letterSpacing: "0.14em" }}>{p.tagline}</div></div></Frame>;
    case "title-impact":
      return <Frame p={p} pal={pal} dark><ShotField p={p} pal={pal} index={1} dark /><div style={{ position: "absolute", inset: 0, background: `${pal.bg}66` }} /><div style={{ position: "absolute", left: "7vw", right: "7vw", top: "30vh", textAlign: "center" }}><div style={{ color: accent, font: `700 14px ${MONO}`, letterSpacing: "0.28em" }}>{labels[p.variant]}</div><div style={{ marginTop: 30, font: `900 clamp(76px, 15vw, 250px) ${SANS}`, lineHeight: 0.78, letterSpacing: "-0.06em", textTransform: "uppercase", transform: `scaleX(${0.88 + beat(15) * 0.12})` }}>{p.title}</div><div style={{ marginTop: 32, color: pal.text, font: `italic 24px ${SERIF}` }}>{p.tagline}</div></div></Frame>;
    case "ensemble-grid":
      return <Frame p={p} pal={pal}><div style={{ position: "absolute", left: "7vw", top: "7vh" }}><Kicker text={labels[p.variant]} accent={accent} pal={pal} /></div><div style={{ position: "absolute", left: "7vw", right: "7vw", top: "18vh", bottom: "11vh", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gridTemplateRows: "repeat(2, 1fr)", gap: 14 }}>{characters.slice(0, 4).map((name, i) => <div key={name} style={{ position: "relative", overflow: "hidden", opacity: beat(i * 18), border: `1px solid ${pal.text}33` }}><ShotField p={p} pal={pal} index={i} dark /><div style={{ position: "absolute", left: 18, bottom: 18, color: pal.text, font: `700 26px ${SERIF}` }}>{name}</div><div style={{ position: "absolute", right: 16, top: 14, color: accent, font: `12px ${MONO}` }}>0{i + 1}</div></div>)}</div></Frame>;
    case "final-lockup":
      return <Frame p={p} pal={pal} dark><div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 38%, ${pal.primary}55, transparent 38%), linear-gradient(135deg, ${pal.bg}, ${pal.primary}44)` }} /><div style={{ position: "absolute", inset: "12vh 8vw", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", borderTop: `1px solid ${accent}`, borderBottom: `1px solid ${pal.secondary}55` }}><div style={{ color: accent, font: `700 14px ${MONO}`, letterSpacing: "0.22em" }}>{labels[p.variant]}</div><div style={{ marginTop: 28, font: `700 clamp(62px, 12vw, 190px) ${SERIF}`, lineHeight: 0.86 }}>{p.title}</div><div style={{ marginTop: 28, color: pal.text, font: `italic 24px ${SERIF}` }}>{p.tagline}</div><div style={{ marginTop: 34, color: accent, font: `700 23px ${MONO}`, letterSpacing: "0.14em" }}>{p.releaseDate}</div><div style={{ marginTop: 38, color: pal.secondary, font: `12px ${MONO}`, letterSpacing: "0.1em" }}>{p.credits}</div></div></Frame>;
    case "trailer-loop":
    default:
      return <Frame p={p} pal={pal}><ShotField p={p} pal={pal} index={Math.floor((frame % Math.max(1, durationInFrames)) / 30)} dark /><div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${pal.bg}cc, transparent 58%, ${pal.bg}55)` }} /><div style={{ position: "absolute", left: "7vw", bottom: "12vh", maxWidth: "72vw" }}><Kicker text={labels[p.variant]} accent={accent} pal={pal} /><div style={{ marginTop: 24, font: `700 clamp(52px, 9vw, 150px) ${SERIF}`, lineHeight: 0.88 }}>{p.title}</div><div style={{ marginTop: 20, color: pal.secondary, font: `20px ${SANS}` }}>{shots[Math.floor(frame / 30) % shots.length]}</div></div><div style={{ position: "absolute", right: "7vw", top: "8vh", color: pal.secondary, font: `12px ${MONO}`, letterSpacing: "0.2em" }}>LOOP / {String(Math.floor(frame / 30) % shots.length + 1).padStart(2, "0")}</div></Frame>;
  }
};

export const FilmTrailers: React.FC<{ p: FilmTrailersProps; pal: Palette }> = ({ p, pal }) => <TrailerRenderer p={p} pal={pal} />;

const familyCast = (variant: FilmTrailersVariant) => ((props: Record<string, unknown>) => {
  const p = { ...(props as unknown as FilmTrailersProps), variant };
  return <FilmTrailers p={p} pal={resolvePalette(p.paletteName ?? "midnight")} />;
}) as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "film-trailers-teaser-escalation": familyCast("teaser-escalation"),
  "film-trailers-three-act-trailer": familyCast("three-act-trailer"),
  "film-trailers-review-burst": familyCast("review-burst"),
  "film-trailers-character-intro": familyCast("character-intro"),
  "film-trailers-mystery-cut": familyCast("mystery-cut"),
  "film-trailers-release-date": familyCast("release-date"),
  "film-trailers-title-impact": familyCast("title-impact"),
  "film-trailers-ensemble-grid": familyCast("ensemble-grid"),
  "film-trailers-final-lockup": familyCast("final-lockup"),
  "film-trailers-trailer-loop": familyCast("trailer-loop"),
};
