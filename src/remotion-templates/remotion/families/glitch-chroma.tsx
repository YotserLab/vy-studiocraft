import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import {
  FadeEdges,
  clampInterp,
  resolvePalette,
  seededRand,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: glitch-chroma
 * Ten deterministic signal-failure treatments. Random-looking motion is derived
 * from seededRand and the current frame so renders are byte-stable.
 */

type GlitchVariant =
  | "rgb-split"
  | "datamosh"
  | "crt"
  | "digital-rain"
  | "vhs"
  | "pixel-sort"
  | "scramble"
  | "hologram"
  | "signal-lost"
  | "cyber-hud";

export interface GlitchChromaProps {
  headline: string;
  paletteName: string;
  intensity: number;
}

type VariantProps = { p: GlitchChromaProps; pal: Palette };

const FONT = '"Arial Black", "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const GLYPHS = "01アイウエオカキクケコ#<>/\\[]{}$%&*+!?";

const strengthOf = (value: number): number => Math.max(0, Math.min(1.5, Number.isFinite(value) ? value : 0.8));
const frameRand = (frame: number, seed: number): number => seededRand(frame * 1009 + seed * 9176);
const glitchOn = (frame: number, seed: number, chance: number, strength: number): boolean =>
  frameRand(frame, seed) < Math.min(0.92, chance * strength);
const signedRand = (frame: number, seed: number): number => frameRand(frame, seed) * 2 - 1;
const glyphAt = (seed: number): string => GLYPHS[Math.floor(seededRand(seed) * GLYPHS.length)] ?? "0";

const RGBSplit: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const strength = strengthOf(p.intensity);
  const burst = glitchOn(frame, 11, 0.2, strength);
  const dx = burst ? signedRand(frame, 12) * 38 * strength : Math.sin(frame * 0.11) * 2;
  const dy = burst ? signedRand(frame, 13) * 12 * strength : 0;
  const skew = burst ? signedRand(frame, 14) * 4 : 0;

  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, ${pal.primary}22, ${pal.bg} 63%)`, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.18, backgroundImage: `linear-gradient(${pal.secondary}22 1px, transparent 1px)`, backgroundSize: "100% 6px" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", transform: `translateY(${dy}px) skewX(${skew}deg)` }}>
        <div style={{ position: "relative", fontFamily: FONT, fontSize: Math.min(width * 0.105, 176), fontWeight: 950, letterSpacing: "-0.06em", lineHeight: 0.9, textAlign: "center", textTransform: "uppercase", maxWidth: "84%" }}>
          <span aria-hidden style={{ position: "absolute", inset: 0, color: "#ff245f", transform: `translateX(${-10 - dx}px)`, mixBlendMode: "screen", opacity: 0.86 }}>{p.headline}</span>
          <span aria-hidden style={{ position: "absolute", inset: 0, color: "#00eaff", transform: `translateX(${10 + dx}px)`, mixBlendMode: "screen", opacity: 0.86 }}>{p.headline}</span>
          <span style={{ position: "relative", color: pal.text, textShadow: `0 0 28px ${pal.primary}88` }}>{p.headline}</span>
        </div>
      </div>
      {Array.from({ length: 9 }, (_, i) => {
        const visible = glitchOn(frame, 50 + i, 0.16, strength);
        const left = seededRand(i * 41 + frame * 7) * 72;
        return visible ? <div key={i} style={{ position: "absolute", left: `${left}%`, top: `${10 + seededRand(i * 83) * 80}%`, width: `${8 + seededRand(i * 29) * 24}%`, height: 2 + (i % 3), background: i % 2 ? pal.accent : pal.secondary, transform: `translateX(${signedRand(frame, 70 + i) * 90}px)` }} /> : null;
      })}
      <div style={{ position: "absolute", left: "8%", bottom: "9%", font: `600 20px ${MONO}`, color: pal.secondary, letterSpacing: "0.3em" }}>CHROMA / SYNC_{String(frame).padStart(4, "0")}</div>
    </AbsoluteFill>
  );
};

const Datamosh: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const strength = strengthOf(p.intensity);
  const slices = 18;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${pal.bg}, ${pal.primary}19)`, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: "8%", top: "13%", width: "84%", height: "74%", border: `1px solid ${pal.secondary}33`, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(110deg, ${pal.primary}18, transparent 45%, ${pal.accent}1c)` }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", fontFamily: FONT, fontSize: Math.min(width * 0.09, 150), fontWeight: 900, letterSpacing: "-0.055em", textTransform: "uppercase", color: `${pal.text}25`, textAlign: "center" }}>{p.headline}</div>
        {Array.from({ length: slices }, (_, i) => {
          const top = (i / slices) * 100;
          const bottom = 100 - ((i + 1) / slices) * 100;
          const hit = glitchOn(frame, 120 + i, 0.34, strength);
          const drift = hit ? signedRand(frame, 170 + i) * (55 + i * 5) * strength : Math.sin(frame * 0.04 + i) * 2;
          const color = i % 5 === 0 ? pal.accent : i % 3 === 0 ? pal.secondary : pal.text;
          return (
            <div key={i} style={{ position: "absolute", inset: 0, clipPath: `inset(${top}% 0 ${bottom}% 0)`, display: "flex", justifyContent: "center", alignItems: "center", transform: `translateX(${drift}px)`, fontFamily: FONT, fontSize: Math.min(width * 0.09, 150), fontWeight: 900, letterSpacing: "-0.055em", textTransform: "uppercase", color, textAlign: "center", textShadow: hit ? `${-drift * 0.35}px 0 ${pal.primary}` : undefined }}>{p.headline}</div>
          );
        })}
        {Array.from({ length: 20 }, (_, i) => {
          const hit = glitchOn(frame, 230 + i, 0.22, strength);
          return hit ? <div key={`b-${i}`} style={{ position: "absolute", left: `${seededRand(i * 17) * 92}%`, top: `${seededRand(i * 31 + frame * 3) * 94}%`, width: `${2 + seededRand(i * 47) * 12}%`, height: 5 + seededRand(i * 71) * 22, background: [pal.primary, pal.secondary, pal.accent][i % 3], opacity: 0.22 + seededRand(i) * 0.42, transform: `translateX(${signedRand(frame, 300 + i) * 120}px)` }} /> : null;
        })}
      </div>
      <div style={{ position: "absolute", right: "8%", top: "9%", color: pal.accent, font: `18px ${MONO}` }}>FRAME LOSS {Math.floor(frameRand(frame, 401) * 99)}%</div>
    </AbsoluteFill>
  );
};

const ScanlineCRT: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const strength = strengthOf(p.intensity);
  const snap = glitchOn(frame, 510, 0.13, strength);
  const x = snap ? signedRand(frame, 511) * 28 * strength : 0;
  const rollY = ((frame * (7 + strength * 5)) % (height * 1.3)) - height * 0.15;
  return (
    <AbsoluteFill style={{ background: "#020303", padding: "4%", overflow: "hidden" }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: "7% / 10%", overflow: "hidden", border: `10px solid ${pal.primary}22`, boxShadow: `inset 0 0 90px #000, 0 0 50px ${pal.primary}22`, background: `radial-gradient(ellipse, ${pal.primary}20, ${pal.bg} 72%)` }}>
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${x}px) scaleY(${snap ? 0.985 : 1})`, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <div style={{ color: pal.text, fontFamily: MONO, fontWeight: 800, fontSize: Math.min(width * 0.073, 124), letterSpacing: "0.04em", maxWidth: "80%", textShadow: `${-5 * strength}px 0 #ff1744, ${5 * strength}px 0 #00e5ff, 0 0 24px ${pal.primary}` }}>{p.headline}</div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: rollY, height: 130, background: `linear-gradient(transparent, ${pal.text}18, ${pal.secondary}30, transparent)`, filter: "blur(4px)" }} />
        <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,.68) 0px, rgba(0,0,0,.68) 2px, transparent 2px, transparent 5px)", opacity: 0.7 }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse, transparent 48%, rgba(0,0,0,.88) 100%)" }} />
        <div style={{ position: "absolute", left: "5%", top: "6%", color: pal.secondary, font: `18px ${MONO}` }}>CH 03&nbsp;&nbsp; NTSC&nbsp;&nbsp; {String(Math.floor(frame / 30)).padStart(2, "0")}:{String(frame % 30).padStart(2, "0")}</div>
        <div style={{ position: "absolute", right: "5%", bottom: "6%", width: "18%", height: 6, background: `${pal.text}22` }}><div style={{ width: `${35 + frameRand(frame, 520) * 65}%`, height: "100%", background: pal.accent }} /></div>
      </div>
    </AbsoluteFill>
  );
};

const DigitalRain: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const strength = strengthOf(p.intensity);
  const columns = 32;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at center, ${pal.primary}16, ${pal.bg} 68%)`, overflow: "hidden" }}>
      {Array.from({ length: columns }, (_, col) => {
        const speed = 0.65 + seededRand(col * 41) * (1.7 + strength);
        const y = ((frame * speed + seededRand(col * 103) * 120) % 142) - 32;
        const tick = Math.floor(frame / 2);
        const chars = Array.from({ length: 20 }, (_, row) => glyphAt(col * 1000 + row * 37 + tick * 59)).join("\n");
        return <div key={col} style={{ position: "absolute", left: `${(col / columns) * 100}%`, top: `${y}%`, color: col % 7 === 0 ? pal.secondary : pal.primary, opacity: 0.16 + seededRand(col * 9) * 0.48, whiteSpace: "pre", font: `500 ${12 + seededRand(col) * 12}px/1.18 ${MONO}`, textShadow: `0 0 9px ${pal.primary}` }}>{chars}</div>;
      })}
      <div style={{ position: "absolute", left: "13%", right: "13%", top: "31%", bottom: "31%", background: `${pal.bg}d9`, borderLeft: `5px solid ${pal.accent}`, borderRight: `1px solid ${pal.primary}77`, boxShadow: `0 0 70px ${pal.bg}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", transform: glitchOn(frame, 610, 0.1, strength) ? `translateX(${signedRand(frame, 611) * 16}px)` : undefined }}>
        <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: Math.min(width * 0.064, 108), color: pal.text, textAlign: "center", maxWidth: "88%", textShadow: `0 0 18px ${pal.primary}` }}>{p.headline}</div>
        <div style={{ position: "absolute", left: 20, bottom: 16, color: pal.secondary, font: `16px ${MONO}` }}>ACCESS // {Math.floor(clampInterp(frame, [0, 65], [0, 100]))}%</div>
      </div>
    </AbsoluteFill>
  );
};

const VHSTracking: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const strength = strengthOf(p.intensity);
  const trackingY = ((frame * (12 + strength * 8)) % (height + 180)) - 90;
  const bands = 14;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${pal.bg}, ${pal.secondary}18)`, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(90deg, ${pal.accent}0f, transparent 28%, ${pal.primary}12)`, filter: "saturate(0.75) contrast(1.18)" }} />
      {Array.from({ length: bands }, (_, i) => {
        const top = (i / bands) * 100;
        const bottom = 100 - ((i + 1) / bands) * 100;
        const tear = glitchOn(frame, 700 + i, 0.16, strength);
        const shift = tear ? signedRand(frame, 740 + i) * 46 * strength : Math.sin(frame * 0.035 + i) * 1.2;
        return <div key={i} style={{ position: "absolute", inset: 0, clipPath: `inset(${top}% 0 ${bottom}% 0)`, transform: `translateX(${shift}px)`, display: "flex", justifyContent: "center", alignItems: "center", color: pal.text, fontFamily: FONT, fontSize: Math.min(width * 0.085, 145), fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.045em", textShadow: `3px 0 ${pal.accent}99, -3px 0 ${pal.secondary}99`, textAlign: "center" }}>{p.headline}</div>;
      })}
      <div style={{ position: "absolute", left: 0, right: 0, top: trackingY, height: 80, background: "repeating-linear-gradient(0deg, rgba(255,255,255,.18) 0 2px, rgba(0,0,0,.2) 2px 5px, transparent 5px 8px)", boxShadow: "0 -12px 30px rgba(0,0,0,.6), 0 12px 30px rgba(255,255,255,.08)", opacity: 0.85 }} />
      <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, transparent 0 3px, rgba(0,0,0,.18) 3px 5px)" }} />
      <div style={{ position: "absolute", left: "5%", top: "6%", color: "#fff", font: `700 25px ${MONO}`, textShadow: "2px 2px #000" }}>PLAY ▷&nbsp;&nbsp; SP</div>
      <div style={{ position: "absolute", right: "5%", bottom: "6%", color: "#fff", font: `700 25px ${MONO}`, textShadow: "2px 2px #000" }}>00:{String(Math.floor(frame / 30)).padStart(2, "0")}:{String(frame % 30).padStart(2, "0")}</div>
    </AbsoluteFill>
  );
};

const PixelSort: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const strength = strengthOf(p.intensity);
  const reveal = clampInterp(frame, [4, 26], [0, 1]);
  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: "10%", right: "10%", top: "18%", bottom: "18%", background: `linear-gradient(120deg, ${pal.primary}33, ${pal.secondary}12 48%, ${pal.accent}33)`, borderTop: `2px solid ${pal.text}55`, overflow: "hidden" }}>
        {Array.from({ length: 52 }, (_, i) => {
          const x = seededRand(i * 31) * 100;
          const base = 20 + seededRand(i * 73) * 58;
          const active = glitchOn(Math.floor(frame / 2), 810 + i, 0.42, strength);
          const length = active ? (80 + seededRand(frame * 101 + i) * height * 0.52) * strength : base;
          const color = [pal.primary, pal.secondary, pal.accent, pal.text][i % 4];
          const direction = i % 3 === 0 ? -1 : 1;
          return <div key={i} style={{ position: "absolute", left: `${x}%`, top: `${base}%`, width: 2 + seededRand(i * 19) * 16, height: length * reveal, background: `linear-gradient(${direction > 0 ? "to bottom" : "to top"}, ${color}, transparent)`, opacity: 0.18 + seededRand(i * 7) * 0.62, transform: `translateY(${direction < 0 ? -length : 0}px)` }} />;
        })}
        {Array.from({ length: 22 }, (_, i) => <div key={`p-${i}`} style={{ position: "absolute", left: `${seededRand(i * 97) * 100}%`, top: `${seededRand(i * 113) * 100}%`, width: 8 + seededRand(i * 17) * 50, height: 4 + seededRand(i * 23) * 18, background: [pal.primary, pal.secondary, pal.accent][i % 3], opacity: glitchOn(frame, 900 + i, 0.2, strength) ? 0.75 : 0.08 }} />)}
      </div>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", pointerEvents: "none" }}>
        <div style={{ padding: "0.12em 0.22em", background: `${pal.bg}b8`, fontFamily: FONT, fontSize: Math.min(width * 0.09, 154), fontWeight: 900, color: pal.text, textTransform: "uppercase", letterSpacing: "-0.055em", maxWidth: "82%", boxShadow: `14px 0 0 ${pal.accent}, -14px 0 0 ${pal.secondary}` }}>{p.headline}</div>
      </div>
      <div style={{ position: "absolute", left: "10%", bottom: "10%", font: `18px ${MONO}`, color: pal.secondary }}>PIXEL ORDER // {Math.floor(frameRand(frame, 930) * 65535).toString(16).toUpperCase().padStart(4, "0")}</div>
    </AbsoluteFill>
  );
};

const ScrambleDecode: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width } = useVideoConfig();
  const strength = strengthOf(p.intensity);
  const chars = p.headline.split("");
  const progress = clampInterp(frame, [5, durationInFrames * 0.68], [0, 1]);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${pal.bg}, #000)`, justifyContent: "center", alignItems: "center" }}>
      <div style={{ width: "82%", padding: "5% 6%", border: `1px solid ${pal.primary}66`, background: `${pal.primary}08`, boxShadow: `inset 0 0 60px ${pal.primary}0d` }}>
        <div style={{ marginBottom: 34, color: pal.primary, font: `18px ${MONO}`, letterSpacing: "0.22em" }}>DECRYPTING TRANSMISSION</div>
        <div style={{ display: "flex", flexWrap: "wrap", fontFamily: MONO, fontSize: Math.min(width * 0.068, 116), fontWeight: 800, letterSpacing: "0.02em", lineHeight: 1.12 }}>
          {chars.map((char, i) => {
            const lockAt = (i + 1) / Math.max(1, chars.length);
            const locked = progress >= lockAt;
            const corrupt = locked && glitchOn(frame, 1010 + i, 0.025, strength);
            const shown = char === " " ? "\u00a0" : locked && !corrupt ? char : glyphAt(frame * 131 + i * 977);
            return <span key={i} style={{ color: locked && !corrupt ? pal.text : i % 3 === 0 ? pal.accent : pal.secondary, textShadow: corrupt ? `8px 0 ${pal.primary}, -5px 0 ${pal.accent}` : `0 0 12px ${pal.primary}55`, transform: corrupt ? `translateY(${signedRand(frame, 1040 + i) * 9}px)` : undefined }}>{shown}</span>;
          })}
          <span style={{ color: pal.accent, opacity: frame % 16 < 9 ? 1 : 0 }}>▌</span>
        </div>
        <div style={{ marginTop: 44, height: 5, background: `${pal.text}18` }}><div style={{ width: `${progress * 100}%`, height: "100%", background: `linear-gradient(90deg, ${pal.primary}, ${pal.accent})`, boxShadow: `0 0 15px ${pal.primary}` }} /></div>
        <div style={{ marginTop: 13, textAlign: "right", color: pal.secondary, font: `16px ${MONO}` }}>{String(Math.floor(progress * 100)).padStart(3, "0")}% // KEY_{Math.floor(frameRand(frame, 1100) * 9999).toString().padStart(4, "0")}</div>
      </div>
    </AbsoluteFill>
  );
};

const HologramPanel: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const strength = strengthOf(p.intensity);
  const flicker = glitchOn(frame, 1200, 0.15, strength);
  const opacity = flicker ? 0.42 + frameRand(frame, 1201) * 0.35 : 0.94;
  const y = flicker ? signedRand(frame, 1202) * 10 : Math.sin(frame * 0.055) * 5;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 78%, ${pal.primary}2e, ${pal.bg} 62%)`, overflow: "hidden", perspective: 1200 }}>
      <div style={{ position: "absolute", left: "12%", right: "12%", top: "14%", bottom: "15%", transform: `rotateX(4deg) rotateY(-5deg) translateY(${y}px)`, transformStyle: "preserve-3d", opacity, border: `2px solid ${pal.secondary}a0`, clipPath: "polygon(4% 0, 96% 0, 100% 8%, 100% 92%, 96% 100%, 4% 100%, 0 92%, 0 8%)", background: `linear-gradient(145deg, ${pal.secondary}13, ${pal.primary}0b 48%, ${pal.accent}12)`, boxShadow: `0 0 24px ${pal.secondary}55, inset 0 0 55px ${pal.primary}22` }}>
        <div style={{ position: "absolute", inset: 0, background: `repeating-linear-gradient(0deg, transparent 0 5px, ${pal.secondary}16 5px 7px)` }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: `${(frame * 1.6) % 112 - 6}%`, height: 50, background: `linear-gradient(transparent, ${pal.secondary}28, transparent)` }} />
        {[[-8, "#ff3d81"], [8, "#00e0ff"]].map(([offset, color], i) => <div aria-hidden key={i} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", transform: `translateX(${flicker ? Number(offset) * strength : 0}px)`, opacity: flicker ? 0.42 : 0, color: String(color), fontFamily: FONT, fontSize: Math.min(width * 0.074, 126), fontWeight: 850, textAlign: "center", maxWidth: "100%" }}>{p.headline}</div>)}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: pal.text, fontFamily: FONT, fontSize: Math.min(width * 0.074, 126), fontWeight: 850, letterSpacing: "0.015em", textAlign: "center", maxWidth: "82%", textShadow: `0 0 22px ${pal.secondary}` }}>{p.headline}</div></div>
        <div style={{ position: "absolute", left: "4%", top: "6%", color: pal.secondary, font: `16px ${MONO}`, letterSpacing: "0.18em" }}>HOLO_CHANNEL // 07</div>
        <div style={{ position: "absolute", right: "4%", bottom: "6%", color: pal.accent, font: `16px ${MONO}` }}>STABILITY {Math.floor((1 - frameRand(frame, 1230) * 0.12 * strength) * 100)}%</div>
        {Array.from({ length: 8 }, (_, i) => glitchOn(frame, 1250 + i, 0.1, strength) ? <div key={i} style={{ position: "absolute", left: `${seededRand(i * 61) * 90}%`, top: `${seededRand(i * 79) * 90}%`, width: 30 + seededRand(i * 19) * 130, height: 3, background: pal.secondary, boxShadow: `0 0 8px ${pal.secondary}` }} /> : null)}
      </div>
      <div style={{ position: "absolute", left: "30%", right: "30%", bottom: "7%", height: 16, borderRadius: "50%", background: pal.secondary, filter: "blur(18px)", opacity: 0.35 }} />
    </AbsoluteFill>
  );
};

const SignalLost: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width } = useVideoConfig();
  const strength = strengthOf(p.intensity);
  const switchAt = Math.floor(durationInFrames * 0.42);
  const clean = clampInterp(frame, [switchAt - 2, switchAt + 12], [0, 1]);
  const relapse = frame > switchAt && glitchOn(frame, 1400, 0.045, strength);
  const staticOpacity = relapse ? 0.72 : 1 - clean;
  const logoJitter = relapse ? signedRand(frame, 1401) * 22 : 0;
  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: staticOpacity }}>
        <div style={{ position: "absolute", inset: 0, background: "#080808" }} />
        {Array.from({ length: 70 }, (_, i) => {
          const y = seededRand(frame * 3001 + i * 29) * 100;
          const x = seededRand(frame * 1999 + i * 47) * 100;
          const w = 2 + seededRand(frame * 1237 + i * 83) * 42;
          const shade = Math.floor(45 + seededRand(frame * 2017 + i * 101) * 210);
          return <div key={i} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: `${w}%`, height: 2 + (i % 7), background: `rgb(${shade},${shade},${shade})`, opacity: 0.28 + seededRand(i * 11) * 0.62, transform: `translateX(${signedRand(frame, 1450 + i) * 80 * strength}px)` }} />;
        })}
        <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, transparent 0 3px, rgba(0,0,0,.62) 3px 6px)" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", font: `800 ${Math.min(width * 0.055, 94)}px ${MONO}`, letterSpacing: "0.12em", textShadow: "5px 0 #f00, -5px 0 #0ff" }}>NO SIGNAL</div>
      </div>
      <div style={{ position: "absolute", inset: 0, opacity: clean, transform: `translateX(${logoJitter}px)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: `radial-gradient(circle, ${pal.primary}1f, ${pal.bg} 66%)` }}>
        <div style={{ width: 110, height: 110, marginBottom: 42, transform: `rotate(${45 + frame * 0.18}deg)`, border: `9px solid ${pal.accent}`, boxShadow: `0 0 38px ${pal.accent}88, inset 0 0 28px ${pal.primary}66` }} />
        <div style={{ color: pal.text, fontFamily: FONT, fontSize: Math.min(width * 0.087, 148), fontWeight: 900, textAlign: "center", maxWidth: "84%", letterSpacing: "-0.05em" }}>{p.headline}</div>
        <div style={{ marginTop: 28, color: pal.secondary, font: `18px ${MONO}`, letterSpacing: "0.34em" }}>SIGNAL RESTORED</div>
      </div>
    </AbsoluteFill>
  );
};

const HudCorner: React.FC<{ x: "left" | "right"; y: "top" | "bottom"; color: string }> = ({ x, y, color }) => (
  <div style={{ position: "absolute", [x]: "4%", [y]: "7%", width: 150, height: 100, borderColor: color, borderStyle: "solid", borderWidth: y === "top" ? `${x === "left" ? 4 : 0}px ${x === "right" ? 4 : 0}px 0 ${x === "left" ? 4 : 0}px` : `0 ${x === "right" ? 4 : 0}px 4px ${x === "left" ? 4 : 0}px` }} />
);

const CyberHUD: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const strength = strengthOf(p.intensity);
  const hit = glitchOn(frame, 1600, 0.11, strength);
  const offset = hit ? signedRand(frame, 1601) * 24 * strength : 0;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(120deg, ${pal.bg}, ${pal.primary}14)`, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.19, backgroundImage: `linear-gradient(${pal.primary}33 1px, transparent 1px), linear-gradient(90deg, ${pal.primary}33 1px, transparent 1px)`, backgroundSize: "64px 64px", transform: `perspective(700px) rotateX(58deg) scale(1.6) translateY(${frame % 64}px)` }} />
      <HudCorner x="left" y="top" color={pal.primary} /><HudCorner x="right" y="top" color={pal.secondary} /><HudCorner x="left" y="bottom" color={pal.secondary} /><HudCorner x="right" y="bottom" color={pal.accent} />
      <div style={{ position: "absolute", right: "11%", top: "20%", width: 330, height: 330, border: `2px solid ${pal.secondary}66`, borderRadius: "50%", transform: `rotate(${frame * 0.7}deg)`, boxShadow: `0 0 35px ${pal.secondary}22` }}>
        <div style={{ position: "absolute", inset: 40, border: `1px dashed ${pal.accent}aa`, borderRadius: "50%", transform: `rotate(${-frame * 1.6}deg)` }} />
        <div style={{ position: "absolute", left: "50%", top: -20, bottom: -20, width: 1, background: pal.secondary }} /><div style={{ position: "absolute", top: "50%", left: -20, right: -20, height: 1, background: pal.secondary }} />
      </div>
      <div style={{ position: "absolute", left: "9%", top: "25%", width: "55%", transform: `translateX(${offset}px)` }}>
        <div style={{ marginBottom: 24, color: pal.accent, font: `18px ${MONO}`, letterSpacing: "0.28em" }}>TARGET // ACQUIRED</div>
        <div style={{ color: pal.text, fontFamily: FONT, fontSize: Math.min(width * 0.075, 128), lineHeight: 0.94, fontWeight: 900, letterSpacing: "-0.045em", textTransform: "uppercase", textShadow: hit ? `10px 0 ${pal.accent}, -10px 0 ${pal.secondary}` : `0 0 24px ${pal.primary}66` }}>{p.headline}</div>
        <div style={{ marginTop: 38, width: "68%", height: 3, background: `${pal.text}22` }}><div style={{ width: `${45 + Math.sin(frame * 0.08) * 24}%`, height: "100%", background: pal.primary }} /></div>
      </div>
      <div style={{ position: "absolute", left: "9%", bottom: "13%", display: "flex", gap: 34, color: pal.secondary, font: `16px ${MONO}` }}><span>LAT {String((frameRand(frame, 1660) * 90).toFixed(3)).padStart(6, "0")}</span><span>LON {String((frameRand(frame, 1661) * 180).toFixed(3)).padStart(7, "0")}</span><span>FPS 30</span></div>
      {Array.from({ length: 12 }, (_, i) => glitchOn(frame, 1700 + i, 0.12, strength) ? <div key={i} style={{ position: "absolute", left: `${seededRand(i * 43) * 95}%`, top: `${seededRand(i * 67) * 95}%`, width: 18 + seededRand(i * 89) * 120, height: 2 + (i % 4), background: i % 2 ? pal.accent : pal.secondary, transform: `translateX(${signedRand(frame, 1750 + i) * 70}px)` }} /> : null)}
    </AbsoluteFill>
  );
};

const VARIANTS: Record<GlitchVariant, React.FC<VariantProps>> = {
  "rgb-split": RGBSplit,
  datamosh: Datamosh,
  crt: ScanlineCRT,
  "digital-rain": DigitalRain,
  vhs: VHSTracking,
  "pixel-sort": PixelSort,
  scramble: ScrambleDecode,
  hologram: HologramPanel,
  "signal-lost": SignalLost,
  "cyber-hud": CyberHUD,
};

const GlitchTemplate: React.FC<GlitchChromaProps & { variant: GlitchVariant }> = ({ variant, ...p }) => {
  const pal = resolvePalette(p.paletteName);
  const Variant = VARIANTS[variant];
  return <AbsoluteFill><FadeEdges inFrames={6} outFrames={8}><Variant p={p} pal={pal} /></FadeEdges></AbsoluteFill>;
};

const makeVariant = (variant: GlitchVariant): React.FC<GlitchChromaProps> => {
  const Component: React.FC<GlitchChromaProps> = (props) => <GlitchTemplate {...props} variant={variant} />;
  return Component;
};

const familyCast = (component: React.FC<GlitchChromaProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "glitch-rgb-split-jitter": familyCast(makeVariant("rgb-split")),
  "glitch-datamosh-slices": familyCast(makeVariant("datamosh")),
  "glitch-scanline-crt": familyCast(makeVariant("crt")),
  "glitch-digital-rain": familyCast(makeVariant("digital-rain")),
  "glitch-vhs-tracking": familyCast(makeVariant("vhs")),
  "glitch-pixel-sort-streaks": familyCast(makeVariant("pixel-sort")),
  "glitch-scramble-decode": familyCast(makeVariant("scramble")),
  "glitch-hologram-panel": familyCast(makeVariant("hologram")),
  "glitch-signal-lost": familyCast(makeVariant("signal-lost")),
  "glitch-cyberpunk-hud": familyCast(makeVariant("cyber-hud")),
};

void interpolate;
