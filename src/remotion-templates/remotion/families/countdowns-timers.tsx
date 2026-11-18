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
  resolvePalette,
  seededRand,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: countdowns-timers
 * Ten structurally distinct countdown treatments. All timing is derived from
 * the composition fps and the serializable totalSeconds prop.
 */

type CountdownVariant =
  | "flip-card"
  | "ring-progress"
  | "giant-punch"
  | "split-flap"
  | "thin-caps"
  | "segment-dial"
  | "neon-glow"
  | "hourglass"
  | "boxed-time"
  | "radial-finale";

export interface CountdownProps {
  label?: string;
  totalSeconds?: number;
  paletteName?: string;
}

interface NormalizedCountdownProps {
  label: string;
  totalSeconds: number;
  paletteName: string;
}

interface Clock {
  frame: number;
  fps: number;
  total: number;
  remaining: number;
  previous: number;
  tickFrame: number;
  tick: number;
  progress: number;
  done: boolean;
}

const FONT_STACK = '"Inter", "Helvetica Neue", Arial, sans-serif';
const MONO_STACK = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const two = (value: number) => Math.max(0, Math.floor(value)).toString().padStart(2, "0");

const useCountdown = (seconds: number): Clock => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const total = Math.max(1, Math.floor(Number.isFinite(seconds) ? seconds : 5));
  const elapsed = Math.floor(frame / fps);
  const remaining = Math.max(0, total - elapsed);
  const tickFrame = frame % fps;
  return {
    frame,
    fps,
    total,
    remaining,
    previous: Math.min(total, remaining + 1),
    tickFrame,
    tick: tickFrame / fps,
    progress: clamp(frame / (total * fps)),
    done: frame >= total * fps,
  };
};

const Label: React.FC<{ text: string; pal: Palette; style?: React.CSSProperties }> = ({ text, pal, style }) => (
  <div
    style={{
      color: pal.secondary,
      fontFamily: FONT_STACK,
      fontSize: 24,
      fontWeight: 600,
      letterSpacing: "0.32em",
      textTransform: "uppercase",
      ...style,
    }}
  >
    {text}
  </div>
);

// ---------------- flip-card digits ----------------
const FlipDigit: React.FC<{ current: string; previous: string; clock: Clock; pal: Palette }> = ({ current, previous, clock, pal }) => {
  const transition = clamp(clock.tick / 0.34);
  const incomingRotation = interpolate(transition, [0, 1], [-88, 0]);
  const outgoingRotation = interpolate(transition, [0, 1], [0, 88]);
  const same = current === previous;
  const face: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    background: `linear-gradient(180deg, ${pal.text}18, ${pal.text}08)`,
    border: `1px solid ${pal.text}25`,
    boxShadow: `0 28px 80px ${pal.bg}cc`,
    color: pal.text,
    fontFamily: MONO_STACK,
    fontSize: 260,
    fontWeight: 800,
    lineHeight: 1,
    transformOrigin: "50% 50%",
    backfaceVisibility: "hidden",
  };
  return (
    <div style={{ position: "relative", width: 250, height: 330, perspective: 900 }}>
      {!same && (
        <div style={{ ...face, opacity: 1 - transition, transform: `rotateX(${outgoingRotation}deg)` }}>
          {previous}
        </div>
      )}
      <div style={{ ...face, opacity: same ? 1 : transition, transform: `rotateX(${same ? 0 : incomingRotation}deg)` }}>
        {current}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 3, background: pal.bg, boxShadow: `0 1px ${pal.text}18` }} />
      <div style={{ position: "absolute", left: -6, top: "47%", width: 12, height: 22, borderRadius: 3, background: pal.bg }} />
      <div style={{ position: "absolute", right: -6, top: "47%", width: 12, height: 22, borderRadius: 3, background: pal.bg }} />
    </div>
  );
};

const FlipCard: React.FC<{ p: NormalizedCountdownProps; pal: Palette }> = ({ p, pal }) => {
  const clock = useCountdown(p.totalSeconds);
  const now = two(clock.remaining);
  const before = two(clock.previous);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: `radial-gradient(circle at 50% 42%, ${pal.primary}22, transparent 48%)` }}>
      <Label text={p.label} pal={pal} style={{ marginBottom: 52 }} />
      <div style={{ display: "flex", gap: 28 }}>
        {now.split("").map((digit, i) => <FlipDigit key={i} current={digit} previous={before[i]} clock={clock} pal={pal} />)}
      </div>
      <div style={{ marginTop: 34, color: `${pal.text}66`, fontFamily: MONO_STACK, fontSize: 18, letterSpacing: "0.5em" }}>SECONDS</div>
    </AbsoluteFill>
  );
};

// ---------------- ring progress ----------------
const RingProgress: React.FC<{ p: NormalizedCountdownProps; pal: Palette }> = ({ p, pal }) => {
  const clock = useCountdown(p.totalSeconds);
  const radius = 244;
  const circumference = Math.PI * 2 * radius;
  const fade = clamp(clock.tick / 0.28);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", width: 590, height: 590 }}>
        <svg width="590" height="590" viewBox="0 0 590 590" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="295" cy="295" r={radius} fill="none" stroke={`${pal.text}14`} strokeWidth="16" />
          <circle
            cx="295"
            cy="295"
            r={radius}
            fill="none"
            stroke={pal.primary}
            strokeLinecap="round"
            strokeWidth="16"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * clock.progress}
          />
          <circle cx="295" cy="51" r="13" fill={pal.accent} transform={`rotate(${clock.progress * 360} 295 295)`} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "relative", width: 260, height: 190, overflow: "hidden", textAlign: "center" }}>
            <div style={{ position: "absolute", inset: 0, color: pal.text, fontFamily: FONT_STACK, fontSize: 180, fontWeight: 300, lineHeight: 1, opacity: fade, transform: `translateY(${(1 - fade) * 38}px)` }}>{clock.remaining}</div>
            {clock.previous !== clock.remaining && <div style={{ position: "absolute", inset: 0, color: pal.text, fontFamily: FONT_STACK, fontSize: 180, fontWeight: 300, lineHeight: 1, opacity: 1 - fade, transform: `translateY(${-fade * 38}px)` }}>{clock.previous}</div>}
          </div>
          <Label text={p.label} pal={pal} style={{ fontSize: 19, marginTop: 14 }} />
        </div>
      </div>
      <div style={{ marginTop: 34, color: `${pal.text}66`, fontFamily: FONT_STACK, fontSize: 18 }}>{Math.round((1 - clock.progress) * 100)}% remaining</div>
    </AbsoluteFill>
  );
};

// ---------------- giant number punch ----------------
const GiantPunch: React.FC<{ p: NormalizedCountdownProps; pal: Palette }> = ({ p, pal }) => {
  const clock = useCountdown(p.totalSeconds);
  const punch = spring({ frame: clock.tickFrame, fps: clock.fps, config: { damping: 12, stiffness: 210, mass: 0.65 } });
  const scale = interpolate(punch, [0, 1], [2.3, 1]);
  const opacity = interpolate(punch, [0, 0.2, 1], [0, 1, 1]);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {[0, 1, 2].map((i) => {
        const spread = clamp((clock.tick - i * 0.08) / 0.55);
        return <div key={i} style={{ position: "absolute", width: 250 + spread * 900, height: 250 + spread * 900, borderRadius: "50%", border: `3px solid ${i === 1 ? pal.accent : pal.primary}`, opacity: (1 - spread) * 0.55 }} />;
      })}
      <div style={{ color: pal.text, fontFamily: FONT_STACK, fontSize: 620, fontWeight: 950, letterSpacing: "-0.08em", lineHeight: 0.8, opacity, transform: `scale(${scale})`, textShadow: `0 0 80px ${pal.primary}55` }}>{clock.remaining}</div>
      <Label text={p.label} pal={pal} style={{ position: "absolute", bottom: 100, color: pal.accent }} />
    </AbsoluteFill>
  );
};

// ---------------- split-flap airport style ----------------
const SplitFlapCell: React.FC<{ current: string; previous: string; clock: Clock; pal: Palette }> = ({ current, previous, clock, pal }) => {
  const t = clamp(clock.tick / 0.42);
  return (
    <div style={{ position: "relative", width: 248, height: 300, overflow: "hidden", borderRadius: 10, background: "#101216", border: `2px solid ${pal.secondary}30`, boxShadow: "inset 0 0 30px #000, 0 18px 45px #0008" }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#f2ead7", fontFamily: MONO_STACK, fontSize: 244, fontWeight: 700, transform: `translateY(${t * 100}%)`, opacity: 1 - t }}>{previous}</div>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#f2ead7", fontFamily: MONO_STACK, fontSize: 244, fontWeight: 700, transform: `translateY(${(t - 1) * 100}%)`, opacity: t }}>{current}</div>
      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 4, background: "#050607", boxShadow: "0 -1px #ffffff10, 0 2px #000" }} />
      {[22, 270].map((top) => <div key={top} style={{ position: "absolute", left: 12, right: 12, top, height: 2, background: "#ffffff08" }} />)}
    </div>
  );
};

const SplitFlap: React.FC<{ p: NormalizedCountdownProps; pal: Palette }> = ({ p, pal }) => {
  const clock = useCountdown(p.totalSeconds);
  const current = two(clock.remaining);
  const previous = two(clock.previous);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: `linear-gradient(180deg, ${pal.bg}, #050607)` }}>
      <div style={{ width: 760, padding: "32px 38px 42px", border: `1px solid ${pal.text}14`, borderRadius: 18, background: "#080a0d", boxShadow: "0 40px 100px #0009" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <Label text={p.label} pal={pal} style={{ color: "#d6b56e", fontSize: 18 }} />
          <div style={{ color: "#d6b56e99", fontFamily: MONO_STACK, fontSize: 16, letterSpacing: "0.18em" }}>DEPARTURE IN</div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 24 }}>
          {current.split("").map((digit, i) => <SplitFlapCell key={i} current={digit} previous={previous[i]} clock={clock} pal={pal} />)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- thin caps + progress hairline ----------------
const ThinCaps: React.FC<{ p: NormalizedCountdownProps; pal: Palette }> = ({ p, pal }) => {
  const clock = useCountdown(p.totalSeconds);
  const roll = clamp(clock.tick / 0.4);
  return (
    <AbsoluteFill style={{ padding: "90px 120px", justifyContent: "space-between", background: pal.bg }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Label text={p.label} pal={pal} style={{ color: pal.text, fontSize: 18, fontWeight: 400 }} />
        <div style={{ color: pal.secondary, fontFamily: FONT_STACK, fontSize: 15, letterSpacing: "0.24em", textTransform: "uppercase" }}>Time remaining</div>
      </div>
      <div style={{ height: 330, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", color: pal.text, fontFamily: FONT_STACK, fontSize: 330, fontWeight: 200, letterSpacing: "-0.06em", transform: `translateY(${(roll - 1) * 95}%)`, opacity: roll }}>{two(clock.remaining)}</div>
        {clock.previous !== clock.remaining && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", color: pal.text, fontFamily: FONT_STACK, fontSize: 330, fontWeight: 200, letterSpacing: "-0.06em", transform: `translateY(${roll * 95}%)`, opacity: 1 - roll }}>{two(clock.previous)}</div>}
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", color: pal.secondary, fontFamily: FONT_STACK, fontSize: 14, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 18 }}><span>Seconds</span><span>{Math.round(clock.progress * 100)}%</span></div>
        <div style={{ position: "relative", height: 2, background: `${pal.text}1f` }}><div style={{ width: `${clock.progress * 100}%`, height: "100%", background: pal.accent }} /><div style={{ position: "absolute", left: `${clock.progress * 100}%`, top: -4, width: 10, height: 10, borderRadius: "50%", background: pal.accent, transform: "translateX(-50%)" }} /></div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- circular segment dial ----------------
const SegmentDial: React.FC<{ p: NormalizedCountdownProps; pal: Palette }> = ({ p, pal }) => {
  const clock = useCountdown(p.totalSeconds);
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  const count = 48;
  const fade = clamp(clock.tick / 0.25);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ width: 1920, height: 1080, position: "relative", transform: `scale(${fit})`, transformOrigin: "center center", flexShrink: 0 }}>
        <div style={{ position: "absolute", left: 620, top: 200, width: 680, height: 680 }}>
          {Array.from({ length: count }, (_, i) => {
            const active = i / count >= clock.progress;
            const long = i % 4 === 0;
            return <div key={i} style={{ position: "absolute", left: "50%", top: "50%", width: long ? 7 : 3, height: long ? 58 : 35, borderRadius: 9, background: active ? (i % 4 === 0 ? pal.accent : pal.primary) : `${pal.text}18`, transformOrigin: `50% ${long ? 340 : 340}px`, transform: `translate(-50%, -340px) rotate(${i * 360 / count}deg)`, opacity: active ? 0.95 : 0.55 }} />;
          })}
          <div style={{ position: "absolute", inset: 104, borderRadius: "50%", border: `1px solid ${pal.text}26`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: `inset 0 0 80px ${pal.primary}12` }}>
            <div style={{ color: pal.text, fontFamily: FONT_STACK, fontSize: 210, fontWeight: 600, lineHeight: 1, opacity: fade, transform: `scale(${0.84 + fade * 0.16})` }}>{clock.remaining}</div>
            <Label text={p.label} pal={pal} style={{ fontSize: 17, marginTop: 22 }} />
          </div>
          <div style={{ position: "absolute", left: "50%", top: 4, width: 16, height: 16, borderRadius: "50%", background: pal.text, transform: "translateX(-50%)", boxShadow: `0 0 24px ${pal.text}` }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- neon glow digits ----------------
const NeonGlow: React.FC<{ p: NormalizedCountdownProps; pal: Palette }> = ({ p, pal }) => {
  const clock = useCountdown(p.totalSeconds);
  const totalMinutes = Math.floor(clock.remaining / 60);
  const digits = `${two(totalMinutes)}:${two(clock.remaining % 60)}`;
  const previousDigits = `${two(Math.floor(clock.previous / 60))}:${two(clock.previous % 60)}`;
  const fade = clamp(clock.tick / 0.35);
  const coreOpacity = interpolate(fade, [0, 0.35, 1], [0, 0.82, 1]);
  const flicker = 0.92 + seededRand(clock.frame * 7 + 3) * 0.08;
  const digitStyle: React.CSSProperties = { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO_STACK, fontSize: 310, fontWeight: 600, letterSpacing: "0.04em" };
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", backgroundColor: "#03040a", backgroundImage: `linear-gradient(${pal.primary}0d 1px, transparent 1px), linear-gradient(90deg, ${pal.primary}0d 1px, transparent 1px)`, backgroundSize: "72px 72px" }}>
      <div style={{ position: "absolute", width: 1050, height: 520, borderRadius: "50%", background: `radial-gradient(ellipse, ${pal.primary}1f, transparent 68%)`, filter: "blur(28px)" }} />
      <Label text={p.label} pal={pal} style={{ position: "absolute", top: 150, color: pal.secondary, textShadow: `0 0 18px ${pal.secondary}` }} />
      <div style={{ position: "relative", width: 1120, height: 330, opacity: flicker }}>
        {previousDigits !== digits && <div style={{ ...digitStyle, color: pal.primary, opacity: 1 - fade, filter: `blur(${fade * 18}px)`, textShadow: `0 0 12px ${pal.primary}, 0 0 36px ${pal.primary}, 0 0 90px ${pal.primary}` }}>{previousDigits}</div>}
        <div style={{ ...digitStyle, color: pal.text, opacity: fade, filter: `blur(${(1 - fade) * 18}px)`, textShadow: `0 0 8px ${pal.text}, 0 0 28px ${pal.primary}, 0 0 80px ${pal.primary}, 0 0 130px ${pal.accent}` }}>{digits}</div>
        <div style={{ ...digitStyle, color: pal.text, opacity: coreOpacity, filter: "none", textShadow: `0 0 1px ${pal.text}, 0 0 10px ${pal.primary}66` }}>{digits}</div>
      </div>
      <div style={{ position: "absolute", bottom: 150, display: "flex", gap: 260, color: `${pal.text}66`, fontFamily: FONT_STACK, fontSize: 15, letterSpacing: "0.3em" }}><span>MINUTES</span><span>SECONDS</span></div>
    </AbsoluteFill>
  );
};

// ---------------- hourglass falling particles ----------------
const Hourglass: React.FC<{ p: NormalizedCountdownProps; pal: Palette }> = ({ p, pal }) => {
  const clock = useCountdown(p.totalSeconds);
  const particles = Array.from({ length: 90 }, (_, i) => ({ a: seededRand(i * 4 + 1), b: seededRand(i * 4 + 2), c: seededRand(i * 4 + 3) }));
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Label text={p.label} pal={pal} style={{ position: "absolute", top: 90 }} />
      <div style={{ position: "relative", width: 520, height: 720 }}>
        <svg width="520" height="720" viewBox="0 0 520 720">
          <path d="M92 64 H428 M92 656 H428" stroke={pal.text} strokeWidth="24" strokeLinecap="round" />
          <path d="M120 88 C130 245 230 294 260 352 C290 294 390 245 400 88 M120 632 C130 478 230 418 260 352 C290 418 390 478 400 632" fill="none" stroke={`${pal.text}88`} strokeWidth="8" />
          {particles.map((particle, i) => {
            const moved = particle.a < clock.progress;
            const y = moved ? 610 - particle.b * 125 : 118 + particle.b * 150 * (1 - clock.progress);
            const halfWidth = moved ? 128 * (1 - (610 - y) / 155) + 18 : 125 * (1 - (y - 118) / 190) + 12;
            const x = 260 + (particle.c - 0.5) * Math.max(18, halfWidth * 2);
            return <circle key={i} cx={x} cy={y} r={3 + particle.a * 4} fill={i % 5 === 0 ? pal.accent : pal.primary} opacity={0.55 + particle.c * 0.45} />;
          })}
          {Array.from({ length: 10 }, (_, i) => {
            const y = 330 + ((clock.frame * (4 + seededRand(i + 80) * 5) + i * 31) % 170);
            return <circle key={`fall-${i}`} cx={258 + (seededRand(i + 100) - 0.5) * 9} cy={y} r={3 + seededRand(i + 120) * 3} fill={pal.accent} />;
          })}
        </svg>
      </div>
      <div style={{ position: "absolute", right: 300, top: 420, minWidth: 220 }}>
        <div style={{ color: pal.text, fontFamily: FONT_STACK, fontSize: 130, fontWeight: 300, lineHeight: 1 }}>{two(clock.remaining)}</div>
        <div style={{ width: 180, height: 2, marginTop: 22, background: `${pal.text}22` }}><div style={{ width: `${clock.progress * 100}%`, height: "100%", background: pal.accent }} /></div>
        <div style={{ color: pal.secondary, fontFamily: FONT_STACK, fontSize: 14, letterSpacing: "0.25em", marginTop: 16 }}>SECONDS</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- boxed day / hour / minute / second segments ----------------
const BoxedTime: React.FC<{ p: NormalizedCountdownProps; pal: Palette }> = ({ p, pal }) => {
  const clock = useCountdown(p.totalSeconds);
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  const values = [
    Math.floor(clock.remaining / 86400),
    Math.floor(clock.remaining / 3600) % 24,
    Math.floor(clock.remaining / 60) % 60,
    clock.remaining % 60,
  ];
  const previousValues = [
    Math.floor(clock.previous / 86400),
    Math.floor(clock.previous / 3600) % 24,
    Math.floor(clock.previous / 60) % 60,
    clock.previous % 60,
  ];
  const names = ["DAYS", "HRS", "MIN", "SEC"];
  // The catalog still frame lands mid-second for long durations; finish the
  // short roll before that frame so the two-digit cell never reads as a
  // doubled value in thumbnails while retaining the tick transition in video.
  const roll = clamp(clock.tick / 0.16);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ width: 1920, height: 1080, position: "relative", transform: `scale(${fit})`, transformOrigin: "center center", flexShrink: 0 }}>
        <div style={{ position: "absolute", left: 110, right: 110, top: 290 }}>
          <Label text={p.label} pal={pal} style={{ marginBottom: 58, textAlign: "center" }} />
          <div style={{ display: "flex", gap: 22 }}>
            {values.map((value, i) => (
              <div key={names[i]} style={{ flex: 1, height: 330, border: `1px solid ${pal.text}25`, borderRadius: 18, background: `${pal.text}08`, overflow: "hidden", position: "relative", boxShadow: `inset 0 0 55px ${pal.primary}0c` }}>
                <div style={{ position: "absolute", inset: "0 0 74px", display: "flex", alignItems: "center", justifyContent: "center", color: pal.text, fontFamily: MONO_STACK, fontSize: 150, fontWeight: 500, transform: i === 3 ? `translateY(${(roll - 1) * 35}px)` : undefined, opacity: i === 3 ? roll : 1 }}>{two(value)}</div>
                {i === 3 && previousValues[i] !== value && <div style={{ position: "absolute", inset: "0 0 74px", display: "flex", alignItems: "center", justifyContent: "center", color: pal.text, fontFamily: MONO_STACK, fontSize: 150, fontWeight: 500, transform: `translateY(${roll * 35}px)`, opacity: 1 - roll }}>{two(previousValues[i])}</div>}
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 74, borderTop: `1px solid ${pal.text}1c`, display: "flex", alignItems: "center", justifyContent: "center", color: i === 3 ? pal.accent : pal.secondary, fontFamily: FONT_STACK, fontSize: 15, fontWeight: 700, letterSpacing: "0.28em" }}>{names[i]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- radial tick burst + finale reveal ----------------
const RadialFinale: React.FC<{ p: NormalizedCountdownProps; pal: Palette }> = ({ p, pal }) => {
  const clock = useCountdown(p.totalSeconds);
  const finaleFrame = Math.max(0, clock.frame - clock.total * clock.fps);
  const reveal = spring({ frame: finaleFrame, fps: clock.fps, config: { damping: 12, stiffness: 150, mass: 0.8 } });
  const tickIn = clamp(clock.tick / 0.24);
  const rays = 64;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", overflow: "hidden", background: clock.done ? pal.primary : pal.bg }}>
      {Array.from({ length: rays }, (_, i) => {
        const angle = i * 360 / rays;
        const active = i / rays >= clock.progress;
        const burst = clock.done ? reveal : 0;
        return <div key={i} style={{ position: "absolute", left: "50%", top: "50%", width: i % 4 === 0 ? 5 : 2, height: 75 + (i % 5) * 8 + burst * 170, background: active ? (i % 3 === 0 ? pal.accent : pal.text) : `${pal.text}16`, transformOrigin: `50% ${300 + burst * 180}px`, transform: `translate(-50%, ${-300 - burst * 180}px) rotate(${angle + burst * 28}deg)`, opacity: active || clock.done ? 0.85 : 0.3 }} />;
      })}
      {!clock.done ? (
        <div style={{ color: pal.text, fontFamily: FONT_STACK, fontSize: 390, fontWeight: 900, lineHeight: 1, opacity: tickIn, transform: `scale(${0.55 + tickIn * 0.45})`, textShadow: `0 0 70px ${pal.primary}` }}>{clock.remaining}</div>
      ) : (
        <div style={{ color: pal.text, fontFamily: FONT_STACK, fontSize: 150, fontWeight: 900, letterSpacing: "0.04em", textTransform: "uppercase", opacity: reveal, transform: `scale(${0.25 + reveal * 0.75}) rotate(${(1 - reveal) * -8}deg)`, textAlign: "center", textShadow: `0 12px 50px ${pal.bg}66` }}>{p.label}</div>
      )}
      {!clock.done && <Label text={p.label} pal={pal} style={{ position: "absolute", bottom: 105, color: pal.accent }} />}
    </AbsoluteFill>
  );
};

const VARIANTS: Record<CountdownVariant, React.FC<{ p: NormalizedCountdownProps; pal: Palette }>> = {
  "flip-card": FlipCard,
  "ring-progress": RingProgress,
  "giant-punch": GiantPunch,
  "split-flap": SplitFlap,
  "thin-caps": ThinCaps,
  "segment-dial": SegmentDial,
  "neon-glow": NeonGlow,
  hourglass: Hourglass,
  "boxed-time": BoxedTime,
  "radial-finale": RadialFinale,
};

const CountdownTemplate: React.FC<CountdownProps & { variant: CountdownVariant }> = ({
  variant,
  label = "COUNTDOWN",
  totalSeconds = 4,
  paletteName = "midnight",
}) => {
  const p: NormalizedCountdownProps = {
    label: String(label || "COUNTDOWN"),
    totalSeconds: Math.max(1, Number(totalSeconds) || 4),
    paletteName: String(paletteName || "midnight"),
  };
  const pal = resolvePalette(p.paletteName);
  const Variant = VARIANTS[variant];
  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg }}>
      <FadeEdges inFrames={8} outFrames={10}>
        <Variant p={p} pal={pal} />
      </FadeEdges>
    </AbsoluteFill>
  );
};

const makeVariant = (variant: CountdownVariant): React.FC<CountdownProps> => {
  const Component: React.FC<CountdownProps> = (props) => <CountdownTemplate {...props} variant={variant} />;
  return Component;
};

const familyCast = (component: React.FC<CountdownProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "countdown-flip-card-digits": familyCast(makeVariant("flip-card")),
  "countdown-ring-progress": familyCast(makeVariant("ring-progress")),
  "countdown-giant-number-punch": familyCast(makeVariant("giant-punch")),
  "countdown-split-flap-airport": familyCast(makeVariant("split-flap")),
  "countdown-thin-caps-hairline": familyCast(makeVariant("thin-caps")),
  "countdown-circular-segment-dial": familyCast(makeVariant("segment-dial")),
  "countdown-neon-glow-digits": familyCast(makeVariant("neon-glow")),
  "countdown-hourglass-particles": familyCast(makeVariant("hourglass")),
  "countdown-boxed-time-segments": familyCast(makeVariant("boxed-time")),
  "countdown-radial-finale-reveal": familyCast(makeVariant("radial-finale")),
};
