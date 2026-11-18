import React from "react";
import {
  AbsoluteFill,
  interpolate,
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
 * FAMILY: particle-systems
 * Ten closed-form particle simulations. Every position is derived directly
 * from the current frame and a stable seed, so any frame can render alone.
 */

type ParticleVariant =
  | "confetti-cannon"
  | "ember-rise"
  | "snowfall"
  | "orbiting-sparks"
  | "bubble-columns"
  | "star-warp-streaks"
  | "dust-motes-light-shaft"
  | "firework-burst-gravity"
  | "magnetic-swarm-text"
  | "rain-splash-ripples";

export interface ParticleProps {
  headline: string;
  paletteName: string;
  count: number;
  intensity: number;
}

interface SimulationProps {
  p: ParticleProps;
  pal: Palette;
}

const FONT_STACK = '"Inter", "Helvetica Neue", Arial, sans-serif';
const TAU = Math.PI * 2;
const rand = (i: number, lane = 0) => seededRand(i * 17.17 + lane * 101.3 + 7);
const wrap01 = (n: number) => ((n % 1) + 1) % 1;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (n: number) => {
  const t = clamp01(n);
  return t * t * (3 - 2 * t);
};
const amount = (p: ParticleProps, ceiling: number) =>
  Math.max(1, Math.min(ceiling, Math.floor(Number.isFinite(p.count) ? p.count : 100)));
const force = (p: ParticleProps) =>
  Math.max(0.25, Math.min(2.2, Number.isFinite(p.intensity) ? p.intensity : 1));
const colors = (pal: Palette) => [pal.primary, pal.secondary, pal.accent, pal.text];

const VARIANT_LABELS: Record<ParticleVariant, string> = {
  "confetti-cannon": "CELEBRATION / 01",
  "ember-rise": "AFTERGLOW / 02",
  snowfall: "WINTER STUDY / 03",
  "orbiting-sparks": "IN ORBIT / 04",
  "bubble-columns": "BUOYANCY / 05",
  "star-warp-streaks": "LIGHT SPEED / 06",
  "dust-motes-light-shaft": "INTO THE LIGHT / 07",
  "firework-burst-gravity": "NIGHT BLOOM / 08",
  "magnetic-swarm-text": "ATTRACT / 09",
  "rain-splash-ripples": "AFTER RAIN / 10",
};

const Backdrop: React.FC<{ pal: Palette; variant: ParticleVariant }> = ({ pal, variant }) => {
  const cool = variant === "snowfall" || variant === "rain-splash-ripples" || variant === "bubble-columns";
  const hot = variant === "ember-rise" || variant === "firework-burst-gravity" || variant === "confetti-cannon";
  const glow = hot ? pal.accent : cool ? pal.secondary : pal.primary;
  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: "-25%",
          background: `radial-gradient(circle at 50% 52%, ${glow}24 0%, ${pal.bg}00 42%), radial-gradient(circle at 14% 12%, ${pal.primary}18 0%, transparent 35%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(115deg, ${pal.bg} 0%, ${pal.primary}0d 48%, ${pal.bg} 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: `inset 0 0 240px 70px ${pal.bg}`,
        }}
      />
    </AbsoluteFill>
  );
};

const Headline: React.FC<{ p: ParticleProps; pal: Palette; variant: ParticleVariant }> = ({ p, pal, variant }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const enter = interpolate(frame, [4, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fontSize = Math.min(width * 0.09, Math.max(76, 178 - p.headline.length * 2.2));
  return (
    <AbsoluteFill
      style={{
        zIndex: 5,
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "82%",
          opacity: enter,
          transform: `translateY(${(1 - enter) * 28}px)`,
        }}
      >
        <div
          style={{
            marginBottom: 24,
            color: pal.secondary,
            fontFamily: FONT_STACK,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "0.42em",
            textTransform: "uppercase",
          }}
        >
          {VARIANT_LABELS[variant]}
        </div>
        <div
          style={{
            color: pal.text,
            fontFamily: FONT_STACK,
            fontSize,
            fontWeight: 850,
            letterSpacing: "-0.045em",
            lineHeight: 0.98,
            textShadow: `0 3px 25px ${pal.bg}, 0 0 70px ${pal.primary}55`,
          }}
        >
          {p.headline}
        </div>
        <div
          style={{
            width: `${enter * 190}px`,
            height: 3,
            margin: "30px auto 0",
            background: `linear-gradient(90deg, transparent, ${pal.accent}, transparent)`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// ---------------- confetti cannon ----------------
const ConfettiCannon: React.FC<SimulationProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const n = amount(p, 220);
  const power = force(p);
  const palette = colors(pal);
  return (
    <AbsoluteFill style={{ overflow: "hidden", zIndex: 4 }}>
      {Array.from({ length: n }, (_, i) => {
        const side = i % 2 === 0 ? 1 : -1;
        const launchFrame = 7 + Math.floor(rand(i, 1) * 3) * 35 + rand(i, 2) * 5;
        const age = (frame - launchFrame) / fps;
        const speedX = (320 + rand(i, 3) * 610) * power;
        const speedY = (650 + rand(i, 4) * 520) * power;
        const x = side > 0 ? width * 0.1 + speedX * age : width * 0.9 - speedX * age;
        const y = height - 45 - speedY * age + 430 * age * age;
        const visible = age >= 0 && age < 2.35 ? clamp01((2.35 - age) / 0.45) : 0;
        const w = 7 + rand(i, 5) * 11;
        const h = 4 + rand(i, 6) * 18;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: w,
              height: h,
              borderRadius: rand(i, 7) > 0.72 ? "50%" : 2,
              backgroundColor: palette[i % palette.length],
              opacity: visible,
              transform: `rotate(${rand(i, 8) * 180 + frame * (3 + rand(i, 9) * 10)}deg) scaleX(${0.25 + Math.abs(Math.sin(frame * 0.18 + i)) * 0.75})`,
              boxShadow: `0 0 12px ${palette[i % palette.length]}55`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------- ember rise ----------------
const EmberRise: React.FC<SimulationProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const n = amount(p, 220);
  const power = force(p);
  return (
    <AbsoluteFill style={{ overflow: "hidden", zIndex: 4 }}>
      <div style={{ position: "absolute", left: "10%", right: "10%", bottom: -80, height: 170, background: `radial-gradient(ellipse, ${pal.accent}55, transparent 68%)`, filter: "blur(24px)" }} />
      {Array.from({ length: n }, (_, i) => {
        const speed = (0.0022 + rand(i, 2) * 0.0055) * power;
        const phase = wrap01(rand(i, 1) + frame * speed);
        const x0 = width * (0.12 + rand(i, 3) * 0.76);
        const x = x0 + Math.sin(frame * (0.018 + rand(i, 4) * 0.025) + rand(i, 5) * TAU) * (18 + rand(i, 6) * 68);
        const y = height + 45 - phase * (height + 160);
        const size = 2 + rand(i, 7) * 8;
        const opacity = Math.sin(phase * Math.PI) * (0.35 + rand(i, 8) * 0.65);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size * (1.2 + rand(i, 9)),
              borderRadius: "50% 50% 45% 45%",
              background: `linear-gradient(${pal.secondary}, ${pal.accent})`,
              opacity,
              filter: `blur(${rand(i, 10) * 1.2}px)`,
              boxShadow: `0 0 ${8 + size * 2}px ${pal.accent}`,
              transform: `rotate(${Math.sin(frame * 0.04 + i) * 24}deg)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------- snowfall ----------------
const Snowfall: React.FC<SimulationProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const n = amount(p, 230);
  const power = force(p);
  return (
    <AbsoluteFill style={{ overflow: "hidden", zIndex: 4 }}>
      {Array.from({ length: n }, (_, i) => {
        const depth = 0.35 + rand(i, 1) * 0.95;
        const speed = (0.0017 + rand(i, 2) * 0.004) * power * depth;
        const phase = wrap01(rand(i, 3) + frame * speed);
        const drift = Math.sin(frame * 0.018 * depth + rand(i, 4) * TAU) * (18 + 42 * depth);
        const x = rand(i, 5) * width + drift;
        const y = -50 + phase * (height + 100);
        const size = 3 + depth * 10;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              backgroundColor: pal.text,
              opacity: 0.22 + depth * 0.62,
              filter: `blur(${(1 - depth) * 1.8}px)`,
              boxShadow: `0 0 ${size * 1.8}px ${pal.secondary}88`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------- orbiting sparks ----------------
const OrbitingSparks: React.FC<SimulationProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const n = amount(p, 190);
  const power = force(p);
  const palette = colors(pal);
  return (
    <AbsoluteFill style={{ overflow: "hidden", zIndex: 4 }}>
      {[0, 1, 2].map((ring) => (
        <div
          key={`ring-${ring}`}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 390 + ring * 245,
            height: 175 + ring * 105,
            border: `1px solid ${palette[ring]}24`,
            borderRadius: "50%",
            transform: "translate(-50%, -50%) rotate(-8deg)",
          }}
        />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const ring = i % 4;
        const direction = ring % 2 === 0 ? 1 : -1;
        const angle = rand(i, 1) * TAU + frame * (0.009 + rand(i, 2) * 0.018) * power * direction;
        const radius = 185 + ring * 86 + rand(i, 3) * 78;
        const x = width / 2 + Math.cos(angle) * radius;
        const y = height / 2 + Math.sin(angle) * radius * (0.4 + rand(i, 4) * 0.16);
        const size = 2 + rand(i, 5) * 7;
        const bright = 0.3 + 0.7 * Math.max(0, Math.sin(angle));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size * 2.7,
              height: size,
              borderRadius: 999,
              backgroundColor: palette[i % palette.length],
              opacity: bright,
              transform: `rotate(${(angle * 180) / Math.PI + 90}deg)`,
              boxShadow: `0 0 ${size * 3}px ${palette[i % palette.length]}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------- bubble columns ----------------
const BubbleColumns: React.FC<SimulationProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const n = amount(p, 190);
  const power = force(p);
  const columnCount = 7;
  return (
    <AbsoluteFill style={{ overflow: "hidden", zIndex: 4 }}>
      {Array.from({ length: n }, (_, i) => {
        const column = i % columnCount;
        const size = 9 + rand(i, 1) * 52;
        const phase = wrap01(rand(i, 2) + frame * (0.0018 + rand(i, 3) * 0.0042) * power);
        const baseX = ((column + 1) / (columnCount + 1)) * width;
        const x = baseX + Math.sin(frame * 0.025 + rand(i, 4) * TAU) * (14 + rand(i, 5) * 42);
        const y = height + size - phase * (height + size * 2);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              border: `1.5px solid ${i % 3 ? pal.secondary : pal.accent}aa`,
              background: `radial-gradient(circle at 30% 24%, ${pal.text}dd 0 4%, ${pal.primary}30 12%, transparent 58%)`,
              opacity: 0.28 + rand(i, 6) * 0.58,
              boxShadow: `inset -5px -8px 18px ${pal.primary}22, 0 0 12px ${pal.secondary}22`,
              transform: `scaleX(${0.92 + Math.sin(frame * 0.04 + i) * 0.08})`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------- star warp streaks ----------------
const StarWarpStreaks: React.FC<SimulationProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const n = amount(p, 200);
  const power = force(p);
  const maxRadius = Math.hypot(width, height) * 0.58;
  return (
    <AbsoluteFill style={{ overflow: "hidden", zIndex: 4 }}>
      <div style={{ position: "absolute", left: "50%", top: "50%", width: 50, height: 50, borderRadius: "50%", transform: "translate(-50%, -50%)", background: `radial-gradient(circle, ${pal.text}aa, ${pal.primary}55 25%, transparent 70%)`, filter: "blur(4px)" }} />
      {Array.from({ length: n }, (_, i) => {
        const phase = wrap01(rand(i, 1) + frame * (0.006 + rand(i, 2) * 0.009) * power);
        const angle = rand(i, 3) * TAU;
        const radius = 12 + phase * phase * maxRadius;
        const x = width / 2 + Math.cos(angle) * radius;
        const y = height / 2 + Math.sin(angle) * radius;
        const length = 8 + phase * phase * 145 * power;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: length,
              height: 1 + phase * 3.2,
              borderRadius: 999,
              transformOrigin: "left center",
              transform: `rotate(${(angle * 180) / Math.PI}deg)`,
              background: `linear-gradient(90deg, ${pal.secondary}22, ${i % 4 === 0 ? pal.accent : pal.text})`,
              opacity: clamp01(phase * 1.35),
              boxShadow: `0 0 ${4 + phase * 9}px ${pal.primary}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------- dust motes in a light shaft ----------------
const DustMotesLightShaft: React.FC<SimulationProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const n = amount(p, 190);
  const power = force(p);
  return (
    <AbsoluteFill style={{ overflow: "hidden", zIndex: 4 }}>
      <div
        style={{
          position: "absolute",
          left: "24%",
          top: "-8%",
          width: "52%",
          height: "116%",
          clipPath: "polygon(39% 0, 61% 0, 100% 100%, 0 100%)",
          background: `linear-gradient(90deg, transparent, ${pal.secondary}16 22%, ${pal.text}2b 50%, ${pal.secondary}16 78%, transparent)`,
          filter: "blur(7px)",
        }}
      />
      <div style={{ position: "absolute", left: "25%", right: "25%", bottom: "7%", height: 90, background: `radial-gradient(ellipse, ${pal.secondary}27, transparent 68%)`, filter: "blur(18px)" }} />
      {Array.from({ length: n }, (_, i) => {
        const yBase = height * (0.05 + rand(i, 1) * 0.9);
        const spreadAtY = width * (0.08 + (yBase / height) * 0.25);
        const x = width / 2 + (rand(i, 2) - 0.5) * spreadAtY * 2 + Math.sin(frame * 0.012 * power + rand(i, 3) * TAU) * 25;
        const y = yBase + Math.sin(frame * (0.006 + rand(i, 4) * 0.014) * power + rand(i, 5) * TAU) * (12 + rand(i, 6) * 34);
        const size = 1.5 + rand(i, 7) * 6;
        const twinkle = 0.18 + Math.abs(Math.sin(frame * 0.035 + rand(i, 8) * TAU)) * 0.62;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              backgroundColor: i % 5 === 0 ? pal.accent : pal.text,
              opacity: twinkle,
              filter: `blur(${rand(i, 9) * 1.1}px)`,
              boxShadow: `0 0 ${size * 3}px ${pal.secondary}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------- firework burst with gravity ----------------
const FireworkBurstGravity: React.FC<SimulationProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const n = amount(p, 240);
  const power = force(p);
  const palette = colors(pal);
  const centers = [
    [0.27, 0.42],
    [0.72, 0.34],
    [0.51, 0.58],
  ];
  return (
    <AbsoluteFill style={{ overflow: "hidden", zIndex: 4 }}>
      {centers.map(([cx, cy], group) => {
        const age = (frame - (10 + group * 38)) / fps;
        const pulse = age >= 0 && age < 0.5 ? age / 0.5 : 0;
        return (
          <div
            key={`pulse-${group}`}
            style={{
              position: "absolute",
              left: cx * width,
              top: cy * height,
              width: 30 + pulse * 260,
              height: 30 + pulse * 260,
              border: `2px solid ${palette[group]}${Math.round((1 - pulse) * 90).toString(16).padStart(2, "0")}`,
              borderRadius: "50%",
              opacity: pulse > 0 ? 1 - pulse : 0,
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}
      {Array.from({ length: n }, (_, i) => {
        const group = i % 3;
        const delay = 10 + group * 38;
        const age = (frame - delay) / fps;
        const angle = rand(i, 1) * TAU;
        const speed = (190 + rand(i, 2) * 470) * power;
        const [cx, cy] = centers[group];
        const x = cx * width + Math.cos(angle) * speed * age;
        const y = cy * height + Math.sin(angle) * speed * age + 255 * age * age;
        const opacity = age >= 0 && age < 2.2 ? clamp01(1 - age / 2.2) : 0;
        const size = 2 + rand(i, 3) * 6;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size * (2 + opacity * 2),
              height: size,
              borderRadius: 999,
              backgroundColor: palette[(group + i) % palette.length],
              opacity,
              transform: `rotate(${(angle * 180) / Math.PI}deg)`,
              boxShadow: `0 0 ${8 + size * 3}px ${palette[(group + i) % palette.length]}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------- magnetic swarm converging on text ----------------
const MagneticSwarmText: React.FC<SimulationProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const n = amount(p, 240);
  const power = force(p);
  const palette = colors(pal);
  const textWidth = Math.min(width * 0.68, Math.max(520, p.headline.length * 74));
  return (
    <AbsoluteFill style={{ overflow: "hidden", zIndex: 4 }}>
      {Array.from({ length: n }, (_, i) => {
        const theta = rand(i, 1) * TAU;
        const edgeRadius = Math.hypot(width, height) * (0.48 + rand(i, 2) * 0.35);
        const startX = width / 2 + Math.cos(theta) * edgeRadius;
        const startY = height / 2 + Math.sin(theta) * edgeRadius;
        const targetX = width / 2 + (rand(i, 3) - 0.5) * textWidth;
        const lane = i % 3;
        const targetY = height / 2 + (lane - 1) * 58 + (rand(i, 4) - 0.5) * 28;
        const attraction = smooth((frame - 5 - rand(i, 5) * 18) / (52 / power));
        const curl = (1 - attraction) * (90 + rand(i, 6) * 180);
        const settle = attraction * Math.sin(frame * 0.08 + theta) * (4 + rand(i, 7) * 9);
        const x = startX * (1 - attraction) + targetX * attraction + Math.cos(theta + frame * 0.045) * curl + settle;
        const y = startY * (1 - attraction) + targetY * attraction + Math.sin(theta + frame * 0.045) * curl + settle * 0.35;
        const size = 2 + rand(i, 8) * 7;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              backgroundColor: palette[i % palette.length],
              opacity: 0.3 + attraction * 0.7,
              boxShadow: `0 0 ${5 + size * 2}px ${palette[i % palette.length]}`,
              transform: `scale(${0.65 + attraction * 0.7})`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------- rain with splash ripples ----------------
const RainSplashRipples: React.FC<SimulationProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  // Two divs per drop; cap keeps this composition comfortably below 400 divs.
  const n = amount(p, 150);
  const power = force(p);
  const floorY = height * 0.84;
  return (
    <AbsoluteFill style={{ overflow: "hidden", zIndex: 4 }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: floorY, height: 2, background: `linear-gradient(90deg, transparent, ${pal.secondary}55, transparent)` }} />
      {Array.from({ length: n }, (_, i) => {
        const period = (48 + rand(i, 1) * 42) / power;
        const phase = wrap01((frame + rand(i, 2) * period) / period);
        const impactAt = 0.84;
        const fall = Math.min(phase / impactAt, 1);
        const x = rand(i, 3) * width + Math.sin(i * 4.2) * 28;
        const y = -120 + fall * (floorY + 120);
        const ripple = phase > impactAt ? (phase - impactAt) / (1 - impactAt) : 0;
        const length = 30 + rand(i, 4) * 75;
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: 2 + rand(i, 5) * 2,
                height: length,
                borderRadius: 999,
                background: `linear-gradient(${pal.text}00, ${i % 5 === 0 ? pal.accent : pal.secondary})`,
                opacity: phase < impactAt ? 0.25 + rand(i, 6) * 0.65 : 0,
                transform: "rotate(8deg)",
                transformOrigin: "bottom center",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: x,
                top: floorY,
                width: 12 + ripple * (55 + rand(i, 7) * 75),
                height: 4 + ripple * 19,
                border: `2px solid ${i % 6 === 0 ? pal.accent : pal.secondary}`,
                borderRadius: "50%",
                opacity: ripple > 0 ? (1 - ripple) * 0.72 : 0,
                transform: "translate(-50%, -50%)",
              }}
            />
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

const SIMULATIONS: Record<ParticleVariant, React.FC<SimulationProps>> = {
  "confetti-cannon": ConfettiCannon,
  "ember-rise": EmberRise,
  snowfall: Snowfall,
  "orbiting-sparks": OrbitingSparks,
  "bubble-columns": BubbleColumns,
  "star-warp-streaks": StarWarpStreaks,
  "dust-motes-light-shaft": DustMotesLightShaft,
  "firework-burst-gravity": FireworkBurstGravity,
  "magnetic-swarm-text": MagneticSwarmText,
  "rain-splash-ripples": RainSplashRipples,
};

const ParticleTemplate: React.FC<ParticleProps & { variant: ParticleVariant }> = ({ variant, ...p }) => {
  const pal = resolvePalette(p.paletteName);
  const Simulation = SIMULATIONS[variant];
  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg }}>
      <Backdrop pal={pal} variant={variant} />
      <FadeEdges inFrames={10} outFrames={14}>
        <Simulation p={p} pal={pal} />
        <Headline p={p} pal={pal} variant={variant} />
      </FadeEdges>
    </AbsoluteFill>
  );
};

const makeTemplate = (variant: ParticleVariant): React.FC<ParticleProps> => {
  const Template: React.FC<ParticleProps> = (props) => <ParticleTemplate {...props} variant={variant} />;
  Template.displayName = `ParticleTemplate(${variant})`;
  return Template;
};

const familyCast = (component: React.FC<ParticleProps>) =>
  component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "particles-confetti-cannon": familyCast(makeTemplate("confetti-cannon")),
  "particles-ember-rise": familyCast(makeTemplate("ember-rise")),
  "particles-snowfall": familyCast(makeTemplate("snowfall")),
  "particles-orbiting-sparks": familyCast(makeTemplate("orbiting-sparks")),
  "particles-bubble-columns": familyCast(makeTemplate("bubble-columns")),
  "particles-star-warp-streaks": familyCast(makeTemplate("star-warp-streaks")),
  "particles-dust-motes-light-shaft": familyCast(makeTemplate("dust-motes-light-shaft")),
  "particles-firework-burst-gravity": familyCast(makeTemplate("firework-burst-gravity")),
  "particles-magnetic-swarm-text": familyCast(makeTemplate("magnetic-swarm-text")),
  "particles-rain-splash-ripples": familyCast(makeTemplate("rain-splash-ripples")),
};
