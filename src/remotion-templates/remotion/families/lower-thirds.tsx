import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  NoiseGrainOverlay,
  clampInterp,
  resolvePalette,
  seededRand,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: lower-thirds
 * Ten broadcast straps with distinct silhouettes and motion systems.
 * The dark studio set is intentionally neutral so every design previews well
 * without requiring footage behind it.
 */

type LowerThirdVariant =
  | "bar-rule"
  | "pill-stack"
  | "side-tab"
  | "underline-kicker"
  | "corner-card"
  | "minimal-hairline"
  | "edge-glow"
  | "dual-divider"
  | "diagonal-ribbon"
  | "signal-cascade";

export interface LowerThirdProps {
  variant: LowerThirdVariant;
  name: string;
  role: string;
  paletteName: string;
}

type VariantProps = { p: LowerThirdProps; pal: Palette };

const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const IN_FRAMES = 15;
const OUT_FRAMES = 12;

const useStrapMotion = (delay = 0) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps, width, height } = useVideoConfig();
  const enter = spring({
    frame: Math.max(0, frame - delay),
    fps,
    durationInFrames: IN_FRAMES,
    config: { damping: 18, stiffness: 210, mass: 0.72 },
  });
  const exit = interpolate(
    frame,
    [durationInFrames - OUT_FRAMES, durationInFrames],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.cubic),
    },
  );
  return {
    frame,
    width,
    height,
    enter: clampInterp(enter, [0, 1], [0, 1]),
    exit,
    opacity: clampInterp(enter, [0, 0.16, 1], [0, 1, 1]) * (1 - exit),
  };
};

const StudioBackdrop: React.FC<{ pal: Palette; variant: LowerThirdVariant }> = ({ pal, variant }) => {
  const frame = useCurrentFrame();
  const variantSeed = Math.max(1, variant.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0));
  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        background: "linear-gradient(180deg, #11151d 0%, #090b10 62%, #050609 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "0 0 35% 0",
          background: `radial-gradient(ellipse at 50% 22%, ${pal.primary}12 0%, transparent 45%), radial-gradient(ellipse at 16% 56%, #ffffff0a 0%, transparent 28%)`,
        }}
      />
      {Array.from({ length: 3 }, (_, i) => {
        const x = 12 + seededRand(variantSeed + i * 17) * 76;
        const drift = Math.sin(frame * 0.012 + i * 2.4) * 1.5;
        return (
          <div
            key={`studio-light-${i}`}
            style={{
              position: "absolute",
              left: `${x + drift}%`,
              top: "-18%",
              width: i === 1 ? "24%" : "18%",
              height: "94%",
              opacity: 0.16 + seededRand(variantSeed + i * 23) * 0.08,
              background: "linear-gradient(180deg, #ffffff18, transparent 72%)",
              filter: "blur(42px)",
              transform: `rotate(${i === 1 ? 0 : i === 0 ? -9 : 9}deg)`,
              transformOrigin: "top center",
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "65%",
          height: 1,
          background: "linear-gradient(90deg, transparent, #ffffff17, transparent)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "8%",
          right: "8%",
          bottom: "-27%",
          height: "47%",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, #222a3555 0%, #090b0f00 70%)",
          transform: "perspective(700px) rotateX(66deg)",
        }}
      />
      <NoiseGrainOverlay opacity={0.028} />
    </AbsoluteFill>
  );
};

// 01 — solid broadcast slab, vertical accent rule, separate text wipes.
const BarRule: React.FC<VariantProps> = ({ p, pal }) => {
  const m = useStrapMotion();
  const panelWidth = clampInterp(m.enter, [0, 1], [8, 690]);
  const textIn = clampInterp(m.frame, [6, 14], [0, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: 112,
        bottom: 112,
        width: 690,
        height: 132,
        opacity: m.opacity,
        transform: `translateX(${m.exit * -150}px)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: panelWidth,
          overflow: "hidden",
          borderRadius: 4,
          background: "linear-gradient(100deg, #10151ef5, #151b25ee)",
          boxShadow: "0 18px 60px #00000070",
        }}
      >
        <div style={{ position: "absolute", inset: "0 auto 0 0", width: 10, background: pal.accent }} />
        <div
          style={{
            position: "absolute",
            left: 42,
            top: 25,
            whiteSpace: "nowrap",
            color: pal.text,
            fontFamily: SANS,
            fontWeight: 760,
            fontSize: 40,
            letterSpacing: "-0.025em",
            opacity: textIn,
            transform: `translateX(${(1 - textIn) * -28}px)`,
          }}
        >
          {p.name}
        </div>
        <div
          style={{
            position: "absolute",
            left: 44,
            top: 80,
            whiteSpace: "nowrap",
            color: pal.secondary,
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: 20,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            opacity: clampInterp(m.frame, [9, 15], [0, 1]),
          }}
        >
          {p.role}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 10,
          bottom: -8,
          width: clampInterp(m.frame, [5, 15], [0, 680]) * (1 - m.exit),
          height: 3,
          background: `linear-gradient(90deg, ${pal.accent}, ${pal.primary}, transparent)`,
        }}
      />
    </div>
  );
};

// 02 — floating identity pill connected to a clean name/title stack.
const PillStack: React.FC<VariantProps> = ({ p, pal }) => {
  const m = useStrapMotion();
  const pill = spring({ frame: Math.max(0, m.frame - 2), fps: 30, config: { damping: 14, stiffness: 230, mass: 0.6 } });
  const stackIn = clampInterp(m.frame, [6, 15], [0, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: 124,
        bottom: 118,
        display: "flex",
        alignItems: "center",
        gap: 24,
        opacity: m.opacity,
        transform: `translateY(${m.exit * 46}px)`,
      }}
    >
      <div
        style={{
          height: 76,
          minWidth: 174,
          padding: "0 30px",
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: pal.primary,
          boxShadow: `0 12px 42px ${pal.primary}42`,
          transform: `scale(${clampInterp(pill, [0, 1], [0.25, 1]) * (1 - m.exit * 0.35)})`,
          color: pal.bg,
          fontFamily: MONO,
          fontSize: 17,
          fontWeight: 800,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        On air
      </div>
      <div style={{ overflow: "hidden", padding: "5px 38px 7px 0" }}>
        <div
          style={{
            color: pal.text,
            fontFamily: SANS,
            fontSize: 42,
            fontWeight: 720,
            lineHeight: 1,
            letterSpacing: "-0.025em",
            transform: `translateY(${(1 - stackIn) * 48}px)`,
          }}
        >
          {p.name}
        </div>
        <div
          style={{
            marginTop: 13,
            color: `${pal.text}9f`,
            fontFamily: SANS,
            fontSize: 21,
            fontWeight: 500,
            letterSpacing: "0.045em",
            transform: `translateY(${(1 - clampInterp(m.frame, [9, 15], [0, 1])) * 30}px)`,
          }}
        >
          {p.role}
        </div>
      </div>
    </div>
  );
};

// 03 — a fixed vertical tab unlocks a panel that telescopes from its side.
const SideTab: React.FC<VariantProps> = ({ p, pal }) => {
  const m = useStrapMotion();
  const tabH = clampInterp(m.enter, [0, 1], [0, 150]);
  const panelScale = clampInterp(m.frame, [4, 15], [0, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: 104,
        bottom: 104,
        width: 730,
        height: 150,
        opacity: m.opacity,
        transform: `translateX(${m.exit * -110}px)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: 68,
          height: tabH,
          borderRadius: "5px 0 0 5px",
          background: pal.accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            transform: "rotate(-90deg)",
            whiteSpace: "nowrap",
            color: pal.bg,
            fontFamily: MONO,
            fontSize: 14,
            fontWeight: 900,
            letterSpacing: "0.24em",
          }}
        >
          PROFILE
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 68,
          top: 0,
          width: 620,
          height: 150,
          transformOrigin: "left center",
          transform: `scaleX(${panelScale * (1 - m.exit)})`,
          background: "#0e131bea",
          border: "1px solid #ffffff17",
          boxShadow: "0 20px 64px #00000066",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 108,
          top: 28,
          opacity: clampInterp(m.frame, [8, 15], [0, 1]) * (1 - m.exit),
          transform: `translateX(${(1 - panelScale) * -24}px)`,
        }}
      >
        <div style={{ color: pal.text, fontFamily: SANS, fontSize: 40, fontWeight: 740, letterSpacing: "-0.02em" }}>{p.name}</div>
        <div style={{ marginTop: 13, color: pal.secondary, fontFamily: SANS, fontSize: 19, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>{p.role}</div>
      </div>
    </div>
  );
};

// 04 — editorial role kicker, large name, and a precision underline sweep.
const UnderlineKicker: React.FC<VariantProps> = ({ p, pal }) => {
  const m = useStrapMotion();
  const textIn = clampInterp(m.frame, [3, 13], [0, 1]);
  const rule = clampInterp(m.frame, [7, 15], [0, 1]) * (1 - m.exit);
  return (
    <div
      style={{
        position: "absolute",
        left: 126,
        bottom: 112,
        width: 740,
        padding: "8px 0 20px 26px",
        borderLeft: `3px solid ${pal.accent}`,
        opacity: m.opacity,
        transform: `translateY(${(1 - m.enter) * 36 - m.exit * 24}px)`,
      }}
    >
      <div
        style={{
          color: pal.accent,
          fontFamily: MONO,
          fontSize: 16,
          fontWeight: 800,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          opacity: clampInterp(m.frame, [0, 8], [0, 1]),
        }}
      >
        {p.role}
      </div>
      <div style={{ overflow: "hidden", marginTop: 10 }}>
        <div
          style={{
            color: pal.text,
            fontFamily: SANS,
            fontSize: 49,
            lineHeight: 1.05,
            fontWeight: 680,
            letterSpacing: "-0.035em",
            transform: `translateY(${(1 - textIn) * 58}px)`,
          }}
        >
          {p.name}
        </div>
      </div>
      <div style={{ marginTop: 17, width: `${rule * 100}%`, height: 1, background: `linear-gradient(90deg, ${pal.primary}, ${pal.secondary}99, transparent)` }} />
    </div>
  );
};

// 05 — glass card assembled by four animated corner brackets.
const CornerCard: React.FC<VariantProps> = ({ p, pal }) => {
  const m = useStrapMotion();
  const bracket = clampInterp(m.frame, [3, 13], [0, 1]);
  const corners: Array<React.CSSProperties> = [
    { left: 0, top: 0, borderLeft: `3px solid ${pal.accent}`, borderTop: `3px solid ${pal.accent}` },
    { right: 0, top: 0, borderRight: `3px solid ${pal.accent}`, borderTop: `3px solid ${pal.accent}` },
    { left: 0, bottom: 0, borderLeft: `3px solid ${pal.accent}`, borderBottom: `3px solid ${pal.accent}` },
    { right: 0, bottom: 0, borderRight: `3px solid ${pal.accent}`, borderBottom: `3px solid ${pal.accent}` },
  ];
  return (
    <div
      style={{
        position: "absolute",
        left: 118,
        bottom: 104,
        width: 668,
        height: 164,
        opacity: m.opacity,
        transform: `scale(${0.94 + m.enter * 0.06 - m.exit * 0.08}) translateY(${m.exit * 28}px)`,
      }}
    >
      <div style={{ position: "absolute", inset: 9, borderRadius: 2, background: "linear-gradient(115deg, #151b25e8, #0b1018d9)", border: "1px solid #ffffff13", boxShadow: "0 22px 70px #00000073" }} />
      {corners.map((style, i) => (
        <div
          key={`corner-${i}`}
          style={{
            position: "absolute",
            width: 34 * bracket,
            height: 34 * bracket,
            ...style,
          }}
        />
      ))}
      <div style={{ position: "absolute", left: 50, top: 36, opacity: clampInterp(m.frame, [6, 14], [0, 1]) }}>
        <div style={{ color: pal.text, fontFamily: SANS, fontSize: 42, fontWeight: 730, letterSpacing: "-0.025em" }}>{p.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 13 }}>
          <span style={{ width: 26, height: 3, background: pal.accent }} />
          <span style={{ color: `${pal.text}ad`, fontFamily: SANS, fontSize: 19, fontWeight: 560, letterSpacing: "0.08em" }}>{p.role}</span>
        </div>
      </div>
      <div style={{ position: "absolute", right: 27, top: 24, color: `${pal.secondary}82`, fontFamily: MONO, fontSize: 13, letterSpacing: "0.16em" }}>01 / ID</div>
    </div>
  );
};

// 06 — almost no container: one hairline, one locator dot, pure typography.
const MinimalHairline: React.FC<VariantProps> = ({ p, pal }) => {
  const m = useStrapMotion();
  const line = clampInterp(m.frame, [2, 13], [0, 1]) * (1 - m.exit);
  const nameIn = clampInterp(m.frame, [5, 14], [0, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: 132,
        bottom: 118,
        width: 650,
        height: 116,
        opacity: m.opacity,
        transform: `translateX(${m.exit * 70}px)`,
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 12, width: 9, height: 9, borderRadius: "50%", background: pal.accent, boxShadow: `0 0 0 ${m.enter * 9}px ${pal.accent}18` }} />
      <div style={{ position: "absolute", left: 28, right: 0, top: 16, height: 1, transformOrigin: "left", transform: `scaleX(${line})`, background: `linear-gradient(90deg, ${pal.text}8f, ${pal.text}12)` }} />
      <div
        style={{
          position: "absolute",
          left: 28,
          top: 36,
          color: pal.text,
          fontFamily: SANS,
          fontSize: 39,
          fontWeight: 520,
          letterSpacing: "-0.018em",
          opacity: nameIn,
          transform: `translateY(${(1 - nameIn) * 16}px)`,
        }}
      >
        {p.name}
      </div>
      <div style={{ position: "absolute", left: 30, top: 86, color: `${pal.text}83`, fontFamily: MONO, fontSize: 15, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", opacity: clampInterp(m.frame, [9, 15], [0, 1]) }}>
        {p.role}
      </div>
    </div>
  );
};

// 07 — luminous gradient edge grows around a dark glass panel.
const EdgeGlow: React.FC<VariantProps> = ({ p, pal }) => {
  const m = useStrapMotion();
  const panelIn = clampInterp(m.frame, [1, 13], [0, 1]);
  const shimmer = 32 + Math.sin(m.frame * 0.045) * 9;
  return (
    <div
      style={{
        position: "absolute",
        left: 112,
        bottom: 102,
        width: 724,
        height: 152,
        padding: 2,
        borderRadius: 13,
        opacity: m.opacity,
        transform: `translateX(${(1 - m.enter) * -90 + m.exit * 110}px)`,
        background: `linear-gradient(105deg, ${pal.primary}, ${pal.accent}cc ${shimmer}%, ${pal.secondary}55 64%, transparent)`,
        boxShadow: `0 16px 62px #0000007d, 0 0 ${24 + panelIn * 22}px ${pal.primary}24`,
      }}
    >
      <div style={{ position: "absolute", inset: 2, borderRadius: 11, overflow: "hidden", background: "linear-gradient(102deg, #111823fa, #0a0e15f5 78%)" }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at ${shimmer}% 0%, ${pal.primary}1f, transparent 35%)` }} />
        <div style={{ position: "absolute", left: 42, top: 29, opacity: clampInterp(m.frame, [6, 14], [0, 1]) }}>
          <div style={{ color: pal.text, fontFamily: SANS, fontSize: 42, fontWeight: 740, letterSpacing: "-0.027em" }}>{p.name}</div>
          <div style={{ marginTop: 13, color: pal.secondary, fontFamily: SANS, fontSize: 18, fontWeight: 650, letterSpacing: "0.14em", textTransform: "uppercase" }}>{p.role}</div>
        </div>
        <div style={{ position: "absolute", right: 35, top: 34, width: 62, height: 62, borderRadius: "50%", border: `1px solid ${pal.primary}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 11, height: 11, borderRadius: "50%", background: pal.accent, boxShadow: `0 0 18px ${pal.accent}` }} />
        </div>
      </div>
    </div>
  );
};

// 08 — two typographic floors divided by a central broadcast rule.
const DualDivider: React.FC<VariantProps> = ({ p, pal }) => {
  const m = useStrapMotion();
  const leftIn = clampInterp(m.frame, [2, 12], [0, 1]);
  const rightIn = clampInterp(m.frame, [6, 15], [0, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: 116,
        bottom: 108,
        height: 136,
        display: "flex",
        alignItems: "stretch",
        opacity: m.opacity,
        transform: `translateY(${m.exit * 52}px)`,
      }}
    >
      <div
        style={{
          width: 430,
          padding: "27px 35px 0 38px",
          background: "#10161ff0",
          borderRadius: "7px 0 0 7px",
          boxShadow: "0 17px 58px #00000061",
          transform: `translateX(${(1 - leftIn) * -130}px)`,
        }}
      >
        <div style={{ color: `${pal.text}78`, fontFamily: MONO, fontSize: 13, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" }}>Featured guest</div>
        <div style={{ marginTop: 12, color: pal.text, fontFamily: SANS, fontSize: 38, fontWeight: 740, letterSpacing: "-0.025em", whiteSpace: "nowrap" }}>{p.name}</div>
      </div>
      <div style={{ width: 5, background: pal.accent, transform: `scaleY(${clampInterp(m.frame, [4, 13], [0, 1]) * (1 - m.exit)})` }} />
      <div
        style={{
          width: 285,
          padding: "44px 28px 0 30px",
          background: "#171e29e8",
          borderRadius: "0 7px 7px 0",
          transform: `translateX(${(1 - rightIn) * -80}px)`,
          opacity: rightIn,
        }}
      >
        <div style={{ color: pal.secondary, fontFamily: SANS, fontSize: 18, fontWeight: 650, lineHeight: 1.35, letterSpacing: "0.065em", textTransform: "uppercase" }}>{p.role}</div>
      </div>
    </div>
  );
};

// 09 — clipped sports/news ribbon with diagonal nose and trailing chevrons.
const DiagonalRibbon: React.FC<VariantProps> = ({ p, pal }) => {
  const m = useStrapMotion();
  const ribbon = clampInterp(m.frame, [0, 13], [0, 1]);
  const content = clampInterp(m.frame, [7, 15], [0, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: 92,
        bottom: 102,
        width: 840,
        height: 140,
        opacity: m.opacity,
        transform: `translateX(${(1 - ribbon) * -900 - m.exit * 210}px)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: "polygon(0 0, 94% 0, 100% 50%, 94% 100%, 0 100%, 4% 50%)",
          background: `linear-gradient(105deg, ${pal.primary} 0 21%, #121925f5 21% 100%)`,
          boxShadow: "0 22px 60px #00000075",
        }}
      />
      <div style={{ position: "absolute", left: 48, top: 0, width: 9, height: 140, background: pal.accent, transform: "skewX(-25deg)" }} />
      <div style={{ position: "absolute", left: 80, top: 51, color: pal.bg, fontFamily: MONO, fontSize: 16, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase" }}>Live</div>
      <div style={{ position: "absolute", left: 226, top: 27, opacity: content }}>
        <div style={{ color: pal.text, fontFamily: SANS, fontSize: 41, fontWeight: 780, letterSpacing: "-0.025em", whiteSpace: "nowrap" }}>{p.name}</div>
        <div style={{ marginTop: 13, color: pal.secondary, fontFamily: SANS, fontSize: 18, fontWeight: 650, letterSpacing: "0.13em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{p.role}</div>
      </div>
      {[0, 1, 2].map((i) => (
        <div key={`chevron-${i}`} style={{ position: "absolute", right: 75 + i * 17, top: 56, width: 11, height: 28, borderRight: `2px solid ${pal.accent}${i === 0 ? "ff" : "88"}`, borderTop: `2px solid ${pal.accent}${i === 0 ? "ff" : "88"}`, transform: "rotate(45deg)" }} />
      ))}
    </div>
  );
};

// 10 — live signal dots lead a staggered two-line text cascade.
const SignalCascade: React.FC<VariantProps> = ({ p, pal }) => {
  const m = useStrapMotion();
  const pulse = 0.72 + Math.sin(m.frame * 0.28) * 0.28;
  const nameIn = spring({ frame: Math.max(0, m.frame - 4), fps: 30, config: { damping: 17, stiffness: 190, mass: 0.65 } });
  const roleIn = spring({ frame: Math.max(0, m.frame - 8), fps: 30, config: { damping: 19, stiffness: 185, mass: 0.65 } });
  return (
    <div
      style={{
        position: "absolute",
        left: 118,
        bottom: 112,
        height: 132,
        display: "flex",
        alignItems: "center",
        opacity: m.opacity,
        transform: `translateX(${m.exit * 90}px)`,
      }}
    >
      <div style={{ position: "relative", width: 106, height: 106, borderRadius: "50%", background: "#101720ec", border: "1px solid #ffffff1c", boxShadow: "0 16px 44px #00000066", transform: `scale(${m.enter})` }}>
        {[0, 1, 2].map((i) => {
          const dotIn = clampInterp(m.frame, [i * 2, i * 2 + 8], [0, 1]);
          return (
            <div
              key={`signal-${i}`}
              style={{
                position: "absolute",
                left: 27 + i * 18,
                top: 48,
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: i === 2 ? pal.accent : pal.primary,
                opacity: dotIn * (i === 2 ? pulse : 0.58 + i * 0.18),
                transform: `scale(${dotIn})`,
                boxShadow: i === 2 ? `0 0 17px ${pal.accent}` : undefined,
              }}
            />
          );
        })}
      </div>
      <div style={{ marginLeft: 24, padding: "17px 44px 17px 26px", minWidth: 580, borderLeft: `2px solid ${pal.accent}`, background: "linear-gradient(90deg, #121923d9, transparent)", overflow: "hidden" }}>
        <div
          style={{
            color: pal.text,
            fontFamily: SANS,
            fontSize: 42,
            fontWeight: 740,
            letterSpacing: "-0.026em",
            opacity: clampInterp(nameIn, [0, 1], [0, 1]),
            transform: `translateX(${clampInterp(nameIn, [0, 1], [-70, 0])}px)`,
          }}
        >
          {p.name}
        </div>
        <div
          style={{
            marginTop: 12,
            color: pal.secondary,
            fontFamily: MONO,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            opacity: clampInterp(roleIn, [0, 1], [0, 1]),
            transform: `translateX(${clampInterp(roleIn, [0, 1], [-52, 0])}px)`,
          }}
        >
          {p.role}
        </div>
      </div>
    </div>
  );
};

const VARIANTS: Record<LowerThirdVariant, React.FC<VariantProps>> = {
  "bar-rule": BarRule,
  "pill-stack": PillStack,
  "side-tab": SideTab,
  "underline-kicker": UnderlineKicker,
  "corner-card": CornerCard,
  "minimal-hairline": MinimalHairline,
  "edge-glow": EdgeGlow,
  "dual-divider": DualDivider,
  "diagonal-ribbon": DiagonalRibbon,
  "signal-cascade": SignalCascade,
};

export const LowerThirdTemplate: React.FC<LowerThirdProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? BarRule;
  return (
    <AbsoluteFill style={{ fontFamily: SANS }}>
      <StudioBackdrop pal={pal} variant={props.variant} />
      <Variant p={props} pal={pal} />
    </AbsoluteFill>
  );
};

const familyCast = (component: React.FC<LowerThirdProps>) =>
  component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "lower-third-bar-rule": familyCast(LowerThirdTemplate),
  "lower-third-pill-stack": familyCast(LowerThirdTemplate),
  "lower-third-side-tab": familyCast(LowerThirdTemplate),
  "lower-third-underline-kicker": familyCast(LowerThirdTemplate),
  "lower-third-corner-card": familyCast(LowerThirdTemplate),
  "lower-third-minimal-hairline": familyCast(LowerThirdTemplate),
  "lower-third-edge-glow": familyCast(LowerThirdTemplate),
  "lower-third-dual-divider": familyCast(LowerThirdTemplate),
  "lower-third-diagonal-ribbon": familyCast(LowerThirdTemplate),
  "lower-third-signal-cascade": familyCast(LowerThirdTemplate),
};
