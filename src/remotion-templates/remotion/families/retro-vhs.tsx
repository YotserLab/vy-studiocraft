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
 * FAMILY: retro-vhs
 * Ten period-inspired layouts with deterministic analog artifacts and motion.
 */

type RetroVariant =
  | "tape-label"
  | "tracking-title"
  | "chrome-sun"
  | "arcade-score"
  | "polaroid-memory"
  | "crt-channel"
  | "computer-boot"
  | "horizon-drive"
  | "broadcast-card"
  | "film-leader";

export interface RetroProps {
  variant: RetroVariant;
  headline: string;
  paletteName: string;
}

const SANS = 'Arial, "Helvetica Neue", Helvetica, sans-serif';
const CONDENSED = 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif';
const MONO = '"Courier New", Courier, monospace';
const SERIF = 'Georgia, "Times New Roman", serif';

const AnalogOverlay: React.FC<{ strength?: number; tint?: string }> = ({ strength = 0.2, tint = "#ffffff" }) => {
  const frame = useCurrentFrame();
  const flicker = 0.84 + seededRand(Math.floor(frame / 2) + 19) * 0.16;
  const band = ((frame * 17) % 1280) - 160;
  const tear = (seededRand(Math.floor(frame / 5) + 91) - 0.5) * 18;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: strength * flicker, overflow: "hidden", mixBlendMode: "screen" }}>
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,0,0,.72) 4px, rgba(0,0,0,.72) 5px)" }} />
      <div style={{ position: "absolute", left: tear, right: -tear, top: band, height: 82, background: `linear-gradient(180deg, transparent, ${tint}55, transparent)`, filter: "blur(6px)" }} />
      {Array.from({ length: 26 }, (_, i) => {
        const y = seededRand(i * 71 + Math.floor(frame / 3) * 13) * 100;
        const x = seededRand(i * 89 + Math.floor(frame / 3) * 7) * 100;
        return <i key={i} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: 2 + seededRand(i + 4) * 9, height: 1, background: tint }} />;
      })}
    </AbsoluteFill>
  );
};

const TrackingStamp: React.FC<{ color: string; label?: string }> = ({ color, label = "PLAY  ▶" }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", top: 56, left: 66, color, fontFamily: MONO, fontSize: 28, fontWeight: 700, letterSpacing: 3, textShadow: `2px 0 ${color}66`, opacity: frame < 12 ? frame % 4 < 2 ? 0 : 1 : 0.9 }}>
      {label}
      <div style={{ marginTop: 12, fontSize: 20, letterSpacing: 2 }}>SP&nbsp;&nbsp;{String(Math.floor(frame / 30)).padStart(2, "0")}:00:{String(frame % 30).padStart(2, "0")}</div>
    </div>
  );
};

type VariantView = React.FC<{ p: RetroProps; pal: Palette }>;

// ---------------- VHS tape label card ----------------
const TapeLabel: VariantView = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 95, mass: 1.15 } });
  const spin = frame * 3.2;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 38%, ${pal.secondary}38, transparent 45%), ${pal.bg}`, alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.14, background: "repeating-linear-gradient(90deg, transparent 0 79px, #fff 80px), repeating-linear-gradient(0deg, transparent 0 79px, #fff 80px)" }} />
      <div style={{ width: 1120, height: 650, borderRadius: 42, background: "linear-gradient(155deg,#272727,#090909 70%)", border: "7px solid #353535", boxShadow: "0 42px 90px #000c, inset 0 0 0 7px #050505", transform: `translateY(${interpolate(enter, [0, 1], [130, 0])}px) rotate(${interpolate(enter, [0, 1], [-7, -1.5])}deg)`, opacity: enter, position: "relative", padding: 54 }}>
        <div style={{ height: 292, borderRadius: 16, background: "#eee4c7", boxShadow: "inset 0 0 30px #7b654955", padding: "28px 42px", color: "#25221e", overflow: "hidden", position: "relative" }}>
          <div style={{ font: `700 26px ${MONO}`, letterSpacing: 7, borderBottom: "3px solid #2a2926", paddingBottom: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>VIDEO CASSETTE • E-180</div>
          <div style={{ width: "100%", boxSizing: "border-box", font: `italic 900 clamp(42px, 4.2vw, 70px)/.95 ${SANS}`, textTransform: "uppercase", marginTop: 28, letterSpacing: -2, textAlign: "center", overflowWrap: "anywhere", transform: `translateX(${clampInterp(frame, [4, 25], [-18, 0])}px)`, opacity: clampInterp(frame, [4, 20], [0, 1]) }}>{p.headline}</div>
          <div style={{ position: "absolute", height: 16, left: 0, right: 0, bottom: 18, background: `linear-gradient(90deg,#e34055 0 33%,${pal.primary} 33% 66%,#d4a62a 66%)` }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "45px 90px 0" }}>
          {[0, 1].map((i) => (
            <div key={i} style={{ width: 145, height: 145, borderRadius: "50%", background: "repeating-conic-gradient(#cfcfcf 0 8deg,#343434 8deg 20deg)", border: "15px solid #111", transform: `rotate(${i ? -spin : spin}deg)`, boxShadow: "0 0 0 6px #777" }}>
              <div style={{ width: 48, height: 48, margin: 33, borderRadius: "50%", background: "#111", border: "8px dotted #aaa" }} />
            </div>
          ))}
          <div style={{ width: 370, height: 90, background: "#050505", clipPath: "polygon(10% 0,90% 0,100% 100%,0 100%)", borderTop: "9px solid #555" }} />
        </div>
        <div style={{ position: "absolute", right: 52, bottom: 24, color: "#aaa", font: `700 24px ${MONO}`, letterSpacing: 4 }}>SIDE A • 1987</div>
      </div>
      <AnalogOverlay strength={0.18} tint={pal.text} />
    </AbsoluteFill>
  );
};

// ---------------- scanlines + tracking wobble ----------------
const TrackingTitle: VariantView = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const tick = Math.floor(frame / 3);
  const wobble = (seededRand(tick + 42) - 0.5) * (frame % 41 < 5 ? 36 : 8);
  const y = (seededRand(tick + 77) - 0.5) * 7;
  const size = Math.min(width * 0.105, 190);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${pal.bg}, #020203)`, justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
      <TrackingStamp color={pal.text} />
      <div style={{ position: "relative", width: "90%", textAlign: "center", transform: `translate(${wobble}px,${y}px)` }}>
        {[{ x: -11, c: pal.accent }, { x: 11, c: pal.secondary }].map((layer, i) => (
          <div key={i} aria-hidden style={{ position: "absolute", inset: 0, font: `900 ${size}px/0.9 ${CONDENSED}`, letterSpacing: `${4 + Math.sin(frame * 0.23) * 9}px`, color: layer.c, opacity: 0.7, transform: `translateX(${layer.x}px)`, filter: "blur(1px)" }}>{p.headline.toUpperCase()}</div>
        ))}
        <div style={{ position: "relative", font: `900 ${size}px/0.9 ${CONDENSED}`, letterSpacing: `${4 + Math.sin(frame * 0.23) * 9}px`, color: pal.text, textShadow: "0 9px 0 #000" }}>{p.headline.toUpperCase()}</div>
        <div style={{ width: `${clampInterp(frame, [8, 35], [0, 78])}%`, height: 8, background: pal.primary, margin: "50px auto 0", boxShadow: `0 0 24px ${pal.primary}` }} />
      </div>
      <div style={{ position: "absolute", right: 58, bottom: 54, font: `700 23px ${MONO}`, color: pal.text, letterSpacing: 4 }}>TRACKING — AUTO</div>
      <AnalogOverlay strength={0.34} tint={pal.secondary} />
    </AbsoluteFill>
  );
};

// ---------------- 80s chrome type + sun grid ----------------
const ChromeSun: VariantView = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const rise = clampInterp(frame, [0, 36], [140, 0]);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(#050018 0%,${pal.bg} 48%,#120018 100%)`, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: "50%", top: 225, width: 470, height: 470, borderRadius: "50%", transform: `translate(-50%,${rise}px)`, background: `repeating-linear-gradient(0deg, ${pal.accent} 0 30px, transparent 31px 42px), linear-gradient(${pal.secondary},${pal.accent})`, boxShadow: `0 0 85px ${pal.accent}aa` }} />
      <div style={{ position: "absolute", left: "-15%", right: "-15%", top: "57%", height: "70%", transform: `perspective(650px) rotateX(64deg) translateY(${(frame * 5) % 55}px)`, transformOrigin: "top", backgroundImage: `linear-gradient(${pal.primary}aa 2px,transparent 2px),linear-gradient(90deg,${pal.primary}aa 2px,transparent 2px)`, backgroundSize: "55px 55px", boxShadow: `0 -8px 35px ${pal.primary}` }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", transform: `translateY(${Math.sin(frame * 0.04) * 6 - 55}px)` }}>
        <div style={{ font: `italic 900 ${Math.min(width * 0.103, 178)}px/.9 ${SANS}`, textTransform: "uppercase", letterSpacing: -8, color: "transparent", WebkitTextStroke: `3px ${pal.text}`, background: `linear-gradient(#fff 5%,#7deaff 25%,#18285e 46%,#fff 49%,#777 54%,${pal.primary} 75%,#fff)`, WebkitBackgroundClip: "text", filter: `drop-shadow(10px 14px 0 ${pal.accent}) drop-shadow(0 0 20px ${pal.secondary})`, transform: `skewX(-9deg) scale(${clampInterp(frame, [0, 28], [1.45, 1])})` }}>{p.headline}</div>
        <div style={{ marginTop: 45, padding: "12px 32px", color: pal.text, font: `italic 800 30px ${SANS}`, letterSpacing: 13, textTransform: "uppercase", background: `${pal.bg}cc`, border: `2px solid ${pal.secondary}` }}>MIDNIGHT • 1986</div>
      </div>
      <AnalogOverlay strength={0.12} tint={pal.accent} />
    </AbsoluteFill>
  );
};

// ---------------- arcade pixel title + score bar ----------------
const ArcadeScore: VariantView = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const reveal = Math.floor(clampInterp(frame, [5, 42], [0, p.headline.length]));
  const score = String(Math.min(999999, frame * 1370)).padStart(6, "0");
  return (
    <AbsoluteFill style={{ background: "#04020c", color: pal.text, fontFamily: MONO, overflow: "hidden" }}>
      <div style={{ height: 92, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 58px", borderBottom: `7px solid ${pal.primary}`, fontSize: 29, fontWeight: 900, letterSpacing: 4 }}>
        <span>1UP&nbsp; {score}</span><span style={{ color: pal.accent }}>HIGH SCORE&nbsp; 999999</span><span>STAGE 08</span>
      </div>
      {Array.from({ length: 58 }, (_, i) => {
        const x = seededRand(i * 11 + 3) * width;
        const y = 130 + seededRand(i * 17 + 7) * 780;
        const blink = (frame + i * 3) % 22 < 12;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: i % 7 === 0 ? 8 : 4, height: i % 7 === 0 ? 8 : 4, background: i % 3 ? pal.text : pal.secondary, opacity: blink ? 0.8 : 0.2, boxShadow: `0 0 8px ${pal.secondary}` }} />;
      })}
      <div style={{ position: "absolute", inset: "160px 100px 120px", border: `8px solid ${pal.secondary}`, boxShadow: `inset 0 0 0 8px #000, inset 0 0 0 13px ${pal.accent}`, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "#07031ddd" }}>
        <div style={{ font: `900 ${Math.min(width * 0.067, 120)}px/1 ${MONO}`, textTransform: "uppercase", textAlign: "center", color: pal.accent, letterSpacing: 5, textShadow: `8px 8px 0 ${pal.primary}, 12px 12px 0 #000`, imageRendering: "pixelated" }}>{p.headline.slice(0, reveal)}<span style={{ opacity: frame % 12 < 6 ? 1 : 0 }}>_</span></div>
        <div style={{ marginTop: 65, fontSize: 31, color: pal.secondary, letterSpacing: 9, opacity: frame > 45 && frame % 26 < 18 ? 1 : 0 }}>PRESS START</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 70, background: `repeating-linear-gradient(90deg,${pal.primary} 0 34px,#000 34px 68px)`, borderTop: `6px solid ${pal.accent}` }} />
      <AnalogOverlay strength={0.1} />
    </AbsoluteFill>
  );
};

// ---------------- instant-film timestamp memory ----------------
const PolaroidMemory: VariantView = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drop = spring({ frame, fps, config: { damping: 12, stiffness: 80, mass: 1.2 } });
  const exposure = clampInterp(frame, [18, 68], [0.88, 0]);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 25% 20%,${pal.secondary}44,transparent 45%),${pal.bg}`, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.22, background: "repeating-linear-gradient(25deg,transparent 0 7px,#000 8px 9px)" }} />
      <div style={{ width: 730, height: 860, padding: "38px 38px 0", background: "#f3ead6", boxShadow: "25px 35px 90px #000a, inset 0 0 60px #8c765733", transform: `translateY(${interpolate(drop, [0, 1], [-900, 0])}px) rotate(${interpolate(drop, [0, 1], [14, -4])}deg)`, position: "relative" }}>
        <div style={{ height: 625, position: "relative", overflow: "hidden", background: `linear-gradient(165deg,${pal.secondary},${pal.primary} 46%,${pal.accent})`, filter: "sepia(.28) contrast(1.16) saturate(.8)" }}>
          <div style={{ position: "absolute", width: 390, height: 390, borderRadius: "50%", left: 170, top: 120, background: `${pal.text}35`, boxShadow: `0 0 100px ${pal.text}66` }} />
          <div style={{ position: "absolute", left: -30, right: -30, bottom: -55, height: 300, background: `${pal.bg}bb`, clipPath: "polygon(0 72%,18% 30%,32% 60%,50% 8%,70% 58%,85% 28%,100% 70%,100% 100%,0 100%)" }} />
          <div style={{ position: "absolute", right: 20, bottom: 18, color: "#ff8a54", font: `700 27px ${MONO}`, textShadow: "2px 2px #000" }}>AUG 22 '89&nbsp; 08:17 PM</div>
          <div style={{ position: "absolute", inset: 0, background: `#fff`, opacity: exposure }} />
        </div>
        <div style={{ color: "#27201b", font: `italic 700 48px ${SERIF}`, textAlign: "center", paddingTop: 55, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.headline}</div>
        <div style={{ position: "absolute", right: 32, bottom: 20, font: `20px ${MONO}`, color: "#806b55" }}>#042</div>
      </div>
      <div style={{ position: "absolute", left: 120, top: 110, font: `700 27px ${MONO}`, color: pal.text, letterSpacing: 5 }}>MEMORY ARCHIVE</div>
      <AnalogOverlay strength={0.15} tint="#f5d6a0" />
    </AbsoluteFill>
  );
};

// ---------------- CRT frame + channel knob flip ----------------
const CrtChannel: VariantView = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const channel = 2 + Math.floor(frame / 18) % 11;
  const knob = Math.floor(frame / 18) * 30;
  const flipWindow = frame < 42;
  const shellPad = Math.min(60, width * 0.035);
  const shellGap = Math.min(48, width * 0.025);
  const controlWidth = Math.min(220, width * 0.16);
  const knobSize = Math.min(135, width * 0.1);
  const shellBorder = Math.min(13, width * 0.01);
  const roll = flipWindow && frame % 18 < 5 ? (frame % 18) * 62 - 120 : 0;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(145deg,${pal.bg},#1b1510)`, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ width: `min(1370px, calc(100% - ${Math.min(120, width * 0.08)}px))`, height: `min(820px, calc(100% - ${Math.min(120, height * 0.12)}px))`, boxSizing: "border-box", minWidth: 0, minHeight: 0, borderRadius: "12% 10% 9% 11%", padding: shellPad, background: "linear-gradient(145deg,#8a704e,#3e3022)", border: `${shellBorder}px solid #211a13`, boxShadow: "inset 16px 18px 30px #ffffff18, 35px 45px 90px #000c", display: "flex", gap: shellGap }}>
        <div style={{ flex: "1 1 auto", minWidth: 0, borderRadius: "12% / 9%", background: "#060808", border: `${Math.min(22, width * 0.018)}px solid #211d18`, padding: Math.min(18, width * 0.014), boxShadow: "inset 0 0 35px #000", overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "10% / 8%", background: `radial-gradient(ellipse,${pal.primary}44,#000 72%)`, display: "flex", justifyContent: "center", alignItems: "center", transform: `translateY(${roll}px)`, filter: "contrast(1.3)" }}>
            <div style={{ width: "min(85%, 920px)", maxWidth: "100%", minWidth: 0, textAlign: "center", color: pal.text, font: `900 clamp(40px, 4.4vw, 94px)/.95 ${CONDENSED}`, textTransform: "uppercase", letterSpacing: 5, textShadow: `-7px 0 ${pal.accent},7px 0 ${pal.secondary}`, overflowWrap: "anywhere", transform: `scaleY(${flipWindow && frame % 18 < 3 ? 0.18 : 1})` }}>{p.headline}</div>
          </div>
          <AnalogOverlay strength={0.45} tint={pal.text} />
          <div style={{ position: "absolute", top: 34, right: 42, color: pal.text, font: `700 28px ${MONO}` }}>CH {String(channel).padStart(2, "0")}</div>
          <div style={{ position: "absolute", inset: 0, borderRadius: "12% / 10%", boxShadow: "inset 0 0 100px #000, inset 0 0 24px #fff3", pointerEvents: "none" }} />
        </div>
        <div style={{ width: controlWidth, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: Math.min(45, height * 0.06) }}>
          {["CHANNEL", "VOLUME"].map((label, i) => (
            <div key={label} style={{ maxWidth: "100%", textAlign: "center", marginBottom: Math.min(55, height * 0.05), color: "#dbc9a8", font: `700 ${Math.min(20, width * 0.022)}px ${SANS}`, letterSpacing: Math.min(3, width * 0.003) }}>
              <div style={{ width: knobSize, height: knobSize, marginBottom: 16, borderRadius: "50%", background: "repeating-conic-gradient(#222 0 5deg,#777 6deg 9deg)", border: `${Math.max(4, Math.min(10, width * 0.008))}px solid #18130f`, transform: `rotate(${i ? -35 : knob}deg)`, boxShadow: "0 8px 15px #0009", position: "relative" }}>
                <div style={{ position: "absolute", width: Math.max(4, width * 0.004), height: knobSize * 0.36, left: `calc(50% - ${Math.max(2, width * 0.002)}px)`, top: knobSize * 0.06, background: "#eee0bd" }} />
              </div>{label}
            </div>
          ))}
          <div style={{ width: Math.min(145, controlWidth * 0.8), height: Math.min(120, height * 0.2), background: "repeating-linear-gradient(90deg,#1c1712 0 6px,#806a4a 7px 10px)", border: `${Math.max(2, Math.min(5, width * 0.004))}px solid #251d15` }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- retro computer boot typing ----------------
const ComputerBoot: VariantView = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const lines = [
    "RETRO/OS 3.1  640K SYSTEM RAM",
    "COPYRIGHT (C) 1984 ANALOG SYSTEMS",
    "CHECKING MEMORY .......... OK",
    "MOUNTING /DEV/TAPE0 ...... OK",
    "LOADING DISPLAY DRIVER ... OK",
    `RUN TITLE.EXE --TEXT=\"${p.headline.toUpperCase()}\"`,
    "READY.",
  ];
  const typed = Math.floor(frame * 1.35);
  let used = 0;
  return (
    <AbsoluteFill style={{ background: "#050806", padding: "70px 90px", color: pal.primary, fontFamily: MONO, overflow: "hidden", textShadow: `0 0 9px ${pal.primary}` }}>
      <div style={{ position: "absolute", inset: 34, border: `3px solid ${pal.primary}66`, borderRadius: "4% / 7%", boxShadow: `inset 0 0 100px ${pal.primary}22` }} />
      <div style={{ fontSize: Math.min(width * 0.024, 40), lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
        {lines.map((line, i) => {
          const local = Math.max(0, typed - used);
          used += line.length + 8;
          const shown = line.slice(0, local);
          return <div key={i} style={{ minHeight: "1.55em", color: i === 5 ? pal.secondary : i === 6 ? pal.accent : pal.primary }}>{shown}</div>;
        })}
        <div style={{ marginTop: 30, color: pal.text }}>A:\&gt; <span style={{ display: "inline-block", width: 22, height: 38, background: pal.primary, opacity: frame % 16 < 9 ? 1 : 0, verticalAlign: "bottom" }} /></div>
      </div>
      <div style={{ position: "absolute", right: 90, bottom: 58, fontSize: 23, color: `${pal.primary}aa` }}>80 COL&nbsp;&nbsp; MONO&nbsp;&nbsp; TAPE:ONLINE</div>
      <AbsoluteFill style={{ background: `linear-gradient(90deg,transparent,${pal.primary}0b,transparent)`, transform: `translateX(${((frame * 21) % 2300) - 2100}px)` }} />
      <AnalogOverlay strength={0.2} tint={pal.primary} />
    </AbsoluteFill>
  );
};

// ---------------- synthwave horizon drive ----------------
const HorizonDrive: VariantView = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const laneShift = (frame * 22) % 150;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(#070019 0%,${pal.bg} 48%,#020007 49%)`, overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 370, height: 370, borderRadius: "50%", left: "50%", top: 165, transform: "translateX(-50%)", background: `repeating-linear-gradient(0deg,${pal.accent} 0 23px,transparent 24px 34px),linear-gradient(${pal.secondary},${pal.accent})`, boxShadow: `0 0 75px ${pal.accent}` }} />
      {Array.from({ length: 18 }, (_, i) => {
        const h = 30 + seededRand(i * 9) * 190;
        return <div key={i} style={{ position: "absolute", left: `${i * 6 - 2}%`, top: 535 - h, width: `${4 + seededRand(i + 2) * 4}%`, height: h, background: "#050008", borderTop: `3px solid ${pal.primary}`, boxShadow: `0 0 12px ${pal.primary}` }} />;
      })}
      <div style={{ position: "absolute", left: "-30%", right: "-30%", top: "51%", bottom: "-40%", transform: "perspective(600px) rotateX(63deg)", transformOrigin: "top", backgroundImage: `linear-gradient(${pal.primary}88 2px,transparent 2px),linear-gradient(90deg,${pal.primary}88 2px,transparent 2px)`, backgroundSize: `150px 150px`, backgroundPositionY: laneShift, boxShadow: `0 -8px 30px ${pal.primary}` }} />
      <div style={{ position: "absolute", left: "50%", top: "51%", bottom: -80, width: 710, transform: "translateX(-50%)", clipPath: "polygon(43% 0,57% 0,100% 100%,0 100%)", background: "#07060c" }}>
        {Array.from({ length: 7 }, (_, i) => {
          const y = ((i * 150 + laneShift) % 950) - 40;
          const scale = 0.2 + y / 600;
          return <div key={i} style={{ position: "absolute", left: "49%", top: y, width: 18 * scale, height: 85 * scale, background: pal.secondary, boxShadow: `0 0 16px ${pal.secondary}` }} />;
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", font: `italic 900 ${Math.min(width * 0.075, 136)}px ${CONDENSED}`, letterSpacing: 4, color: pal.text, WebkitTextStroke: `2px ${pal.accent}`, textShadow: `8px 9px 0 ${pal.primary},0 0 25px ${pal.accent}`, transform: `translateY(${clampInterp(frame, [0, 25], [-90, 0])}px) skewX(-6deg)`, textTransform: "uppercase" }}>{p.headline}</div>
      <div style={{ position: "absolute", bottom: 45, left: 60, color: pal.text, font: `700 23px ${MONO}`, letterSpacing: 5 }}>NIGHT DRIVE // 88 MPH</div>
      <AnalogOverlay strength={0.12} tint={pal.accent} />
    </AbsoluteFill>
  );
};

// ---------------- analog broadcast test card ----------------
const BroadcastCard: VariantView = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const bars = ["#f5f5f5", "#e4e247", "#45d8db", "#4bd04e", "#d945d5", "#db3c3c", "#3d42d9"];
  const pulse = 0.96 + Math.sin(frame * 0.11) * 0.015;
  return (
    <AbsoluteFill style={{ background: "#151515", alignItems: "center", justifyContent: "center", fontFamily: MONO, overflow: "hidden" }}>
      <div style={{ width: 1420, height: 930, background: "#aaa", border: "18px solid #090909", boxShadow: "0 0 0 4px #777, 0 30px 80px #000", transform: `scale(${pulse})`, position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", height: 230 }}>{bars.map((c) => <div key={c} style={{ flex: 1, background: c }} />)}</div>
        <div style={{ position: "absolute", width: 680, height: 680, borderRadius: "50%", left: "50%", top: "50%", transform: "translate(-50%,-43%)", border: "18px solid #111", background: "#bdbdbd", boxShadow: "inset 0 0 0 7px #eee" }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 5, background: "#111" }} />
          <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 5, background: "#111" }} />
          <div style={{ position: "absolute", inset: 92, border: "6px solid #111", display: "flex", alignItems: "center", justifyContent: "center", background: "repeating-linear-gradient(90deg,#eee 0 22px,#222 22px 44px)" }}>
            <div style={{ width: "100%", padding: "35px 10px", background: "#111", textAlign: "center", color: pal.text, font: `900 47px ${SANS}`, letterSpacing: 4, textTransform: "uppercase" }}>{p.headline}</div>
          </div>
          <div style={{ position: "absolute", left: "50%", top: "50%", width: 255, height: 6, background: pal.accent, transformOrigin: "left", transform: `rotate(${frame * 2.3 - 90}deg)` }} />
        </div>
        <div style={{ height: 170, display: "flex" }}>{["#06104b", "#fff", "#40004e", "#111", "#050505", "#ddd", "#050505"].map((c, i) => <div key={i} style={{ flex: i === 3 ? 2 : 1, background: c }} />)}</div>
        <div style={{ position: "absolute", bottom: 26, left: 38, right: 38, display: "flex", justifyContent: "space-between", color: "#111", fontSize: 25, fontWeight: 900 }}><span>NETWORK 08</span><span>PLEASE STAND BY</span><span>{String(Math.floor(frame / 30)).padStart(2, "0")}:{String(frame % 30).padStart(2, "0")}</span></div>
      </div>
      <TrackingStamp color="#fff" label="REC ●" />
      <AnalogOverlay strength={0.32} />
    </AbsoluteFill>
  );
};

// ---------------- vintage film leader countdown ----------------
const FilmLeader: VariantView = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const count = Math.max(2, 8 - Math.floor(frame / 15) % 7);
  const sweep = (frame % 15) / 15 * 360 - 90;
  const jitterX = (seededRand(frame * 3 + 1) - 0.5) * 8;
  const jitterY = (seededRand(frame * 3 + 2) - 0.5) * 6;
  return (
    <AbsoluteFill style={{ background: "#d7c9a6", color: "#29251e", overflow: "hidden", transform: `translate(${jitterX}px,${jitterY}px) scale(1.02)` }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.22, background: "repeating-radial-gradient(circle at 30% 40%,#000 0 1px,transparent 1px 5px)" }} />
      <div style={{ position: "absolute", left: "50%", top: "50%", width: 720, height: 720, border: "9px solid #312d25", borderRadius: "50%", transform: "translate(-50%,-50%)" }}>
        <div style={{ position: "absolute", inset: 72, border: "5px solid #312d25", borderRadius: "50%" }} />
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 360, height: 360, background: "#4a443688", clipPath: "polygon(50% 50%,100% 0,100% 100%)", transformOrigin: "0 0", transform: `rotate(${sweep}deg)` }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", font: `700 390px/.9 ${SANS}` }}>{count}</div>
      </div>
      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 5, background: "#312d25" }} />
      <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 5, background: "#312d25" }} />
      <div style={{ position: "absolute", left: 55, top: 42, font: `700 28px ${MONO}`, letterSpacing: 5 }}>SMPTE UNIVERSAL LEADER</div>
      <div style={{ position: "absolute", right: 55, bottom: 42, font: `700 25px ${MONO}` }}>{p.headline.toUpperCase()} • REEL 01</div>
      {Array.from({ length: 14 }, (_, i) => {
        const x = seededRand(i * 21 + 4) * 100;
        const shift = seededRand(Math.floor(frame / 4) + i * 32) * 16;
        return <div key={i} style={{ position: "absolute", top: -20, bottom: -20, left: `${x}%`, width: i % 4 === 0 ? 2 : 1, background: i % 3 ? "#fff8" : "#241f1888", transform: `translateX(${shift}px)`, opacity: 0.25 + seededRand(i) * 0.45 }} />;
      })}
      <div style={{ position: "absolute", inset: 0, opacity: clampInterp(frame, [durationInFrames - 10, durationInFrames], [0, 1]), background: "#eee5ca" }} />
    </AbsoluteFill>
  );
};

const VARIANTS: Record<RetroVariant, VariantView> = {
  "tape-label": TapeLabel,
  "tracking-title": TrackingTitle,
  "chrome-sun": ChromeSun,
  "arcade-score": ArcadeScore,
  "polaroid-memory": PolaroidMemory,
  "crt-channel": CrtChannel,
  "computer-boot": ComputerBoot,
  "horizon-drive": HorizonDrive,
  "broadcast-card": BroadcastCard,
  "film-leader": FilmLeader,
};

export const RetroVhsTemplate: React.FC<RetroProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? TapeLabel;
  return (
    <AbsoluteFill>
      <FadeEdges inFrames={8} outFrames={10}>
        <Variant p={props} pal={pal} />
      </FadeEdges>
    </AbsoluteFill>
  );
};

const familyCast = (component: React.FC<RetroProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "retro-vhs-tape-label": familyCast(RetroVhsTemplate),
  "retro-tracking-title": familyCast(RetroVhsTemplate),
  "retro-chrome-sunset": familyCast(RetroVhsTemplate),
  "retro-arcade-high-score": familyCast(RetroVhsTemplate),
  "retro-polaroid-memory": familyCast(RetroVhsTemplate),
  "retro-crt-channel-flip": familyCast(RetroVhsTemplate),
  "retro-computer-boot": familyCast(RetroVhsTemplate),
  "retro-synthwave-drive": familyCast(RetroVhsTemplate),
  "retro-broadcast-test-card": familyCast(RetroVhsTemplate),
  "retro-film-leader-countdown": familyCast(RetroVhsTemplate),
};
