import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { seededRand, resolvePalette, FadeEdges } from "../lib/primitives";

/**
 * FAMILY: gradient-mesh
 * Ten full-frame gradient studies driven by one deterministic dispatcher.
 */

type GradientMeshVariant =
  | "aurora-mesh"
  | "duotone-blob"
  | "grainy-poster"
  | "liquid-waves"
  | "glass-card"
  | "radial-orbit"
  | "vertical-bands"
  | "soft-focus"
  | "ribbon-sweep"
  | "translucent-panes";

export interface GradientMeshProps {
  variant: GradientMeshVariant;
  headline: string;
  subline: string;
  paletteName: string;
}

type Palette = ReturnType<typeof resolvePalette>;
type VariantProps = { p: GradientMeshProps; pal: Palette };

const FONT_STACK = 'Inter, "Helvetica Neue", Arial, sans-serif';

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

const enter = (frame: number, start = 0, length = 24) =>
  clamp((frame - start) / length);

const Mesh: React.FC<{
  colors: string[];
  count?: number;
  seed: number;
  blur?: number;
  opacity?: number;
  blend?: React.CSSProperties["mixBlendMode"];
}> = ({ colors, count = 6, seed, blur = 70, opacity = 0.78, blend = "screen" }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {Array.from({ length: count }).map((_, i) => {
        const a = seededRand(seed + i * 101);
        const b = seededRand(seed + i * 101 + 17);
        const c = seededRand(seed + i * 101 + 41);
        const d = seededRand(seed + i * 101 + 73);
        const size = 38 + c * 42;
        const x = -15 + a * 95 + Math.sin(frame * (0.009 + d * 0.012) + i) * 7;
        const y = -18 + b * 96 + Math.cos(frame * (0.008 + c * 0.01) + i * 0.7) * 8;
        const scale = 0.92 + Math.sin(frame * 0.018 + i * 1.3) * 0.12;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: `${size}%`,
              aspectRatio: "1",
              borderRadius: `${42 + a * 20}% ${58 - b * 16}% ${45 + c * 18}% ${55 - d * 14}%`,
              background: `radial-gradient(circle at ${35 + b * 30}% ${30 + c * 35}%, ${colors[i % colors.length]} 0%, ${colors[(i + 1) % colors.length]}b8 36%, transparent 72%)`,
              filter: `blur(${blur}px)`,
              mixBlendMode: blend,
              opacity,
              transform: `translate(-25%, -25%) scale(${scale}) rotate(${frame * (i % 2 ? -0.025 : 0.02) + d * 50}deg)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Label: React.FC<{ children: React.ReactNode; color: string }> = ({ children, color }) => (
  <div
    style={{
      color,
      fontFamily: FONT_STACK,
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: "0.32em",
      textTransform: "uppercase",
    }}
  >
    {children}
  </div>
);

const AuroraMesh: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const intro = enter(frame, 5, 30);
  return (
    <AbsoluteFill style={{ background: pal.bg, justifyContent: "center", alignItems: "center" }}>
      <Mesh colors={[pal.primary, pal.accent, pal.secondary, pal.text]} count={8} seed={1103} blur={92} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at center, transparent 0%, ${pal.bg}30 48%, ${pal.bg}dd 100%)`,
        }}
      />
      <div style={{ position: "relative", textAlign: "center", padding: "0 8%", transform: `scale(${0.9 + intro * 0.1})`, opacity: intro }}>
        <div
          style={{
            color: pal.text,
            fontFamily: FONT_STACK,
            fontSize: Math.min(width * 0.12, 176),
            fontWeight: 800,
            letterSpacing: "-0.07em",
            lineHeight: 0.92,
            textShadow: `0 20px 70px ${pal.bg}99`,
          }}
        >
          {p.headline}
        </div>
        <div style={{ marginTop: 30 }}><Label color={`${pal.text}cc`}>{p.subline}</Label></div>
      </div>
    </AbsoluteFill>
  );
};

const DuotoneBlob: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const wobble = Math.sin(frame * 0.035) * 5;
  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: "-8%",
          top: "-22%",
          width: "70%",
          aspectRatio: "1",
          borderRadius: `${54 + wobble}% ${46 - wobble}% 58% 42%`,
          background: `radial-gradient(circle at 65% 35%, ${pal.primary}, ${pal.secondary} 55%, transparent 76%)`,
          filter: "blur(28px)",
          mixBlendMode: "screen",
          transform: `rotate(${frame * 0.05}deg)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "18%",
          bottom: "-40%",
          width: "63%",
          aspectRatio: "1",
          borderRadius: `44% 56% ${52 - wobble}% ${48 + wobble}%`,
          background: `radial-gradient(circle at 40% 35%, ${pal.accent}, ${pal.primary}aa 48%, transparent 72%)`,
          filter: "blur(38px)",
          mixBlendMode: "screen",
          transform: `rotate(${-frame * 0.04}deg)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: "7%",
          top: "13%",
          bottom: "13%",
          width: "32%",
          borderLeft: `1px solid ${pal.text}55`,
          paddingLeft: "4%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          opacity: enter(frame, 12, 24),
          transform: `translateX(${interpolate(enter(frame, 12, 24), [0, 1], [70, 0])}px)`,
        }}
      >
        <Label color={pal.accent}>Duotone / 02</Label>
        <div style={{ color: pal.text, fontFamily: FONT_STACK, fontSize: Math.min(width * 0.066, 104), fontWeight: 750, lineHeight: 0.98, margin: "34px 0", letterSpacing: "-0.055em" }}>{p.headline}</div>
        <div style={{ color: `${pal.text}aa`, fontFamily: FONT_STACK, fontSize: 29, lineHeight: 1.4, maxWidth: 480 }}>{p.subline}</div>
      </div>
    </AbsoluteFill>
  );
};

const GrainyPoster: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${pal.bg}, ${pal.primary})`, overflow: "hidden" }}>
      <Mesh colors={[pal.secondary, pal.accent, pal.primary]} count={5} seed={2917} blur={45} opacity={0.88} blend="hard-light" />
      <AbsoluteFill
        style={{
          opacity: 0.17,
          backgroundImage: `repeating-radial-gradient(circle at ${frame % 9}px ${frame % 7}px, ${pal.text} 0 0.7px, transparent 0.8px 3px)`,
          mixBlendMode: "overlay",
        }}
      />
      <div style={{ position: "absolute", inset: "7% 6%", border: `2px solid ${pal.text}88`, padding: "4.5%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Label color={pal.text}>Gradient studies · No. 03</Label>
        <div>
          <div
            style={{
              color: pal.text,
              fontFamily: FONT_STACK,
              fontSize: Math.min(width * 0.13, 188),
              fontWeight: 900,
              letterSpacing: "-0.075em",
              lineHeight: 0.82,
              textTransform: "uppercase",
              maxWidth: "88%",
              opacity: enter(frame, 4, 22),
              transform: `translateY(${(1 - enter(frame, 4, 22)) * 70}px)`,
            }}
          >
            {p.headline}
          </div>
          <div style={{ color: pal.text, fontFamily: FONT_STACK, fontSize: 27, fontWeight: 600, marginTop: 38, letterSpacing: "0.08em" }}>{p.subline}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const LiquidWaves: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "12%", left: "8%", right: "8%" }}>
        <Label color={pal.accent}>Fluid spectrum</Label>
        <div style={{ color: pal.text, fontFamily: FONT_STACK, fontSize: Math.min(width * 0.082, 124), fontWeight: 720, letterSpacing: "-0.055em", marginTop: 24 }}>{p.headline}</div>
        <div style={{ color: `${pal.text}99`, fontFamily: FONT_STACK, fontSize: 30, marginTop: 18 }}>{p.subline}</div>
      </div>
      {[0, 1, 2, 3].map((i) => {
        const y = height * (0.63 + i * 0.06) + Math.sin(frame * 0.045 + i * 1.4) * (22 + i * 4);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "-12%",
              top: y,
              width: "124%",
              height: height * 0.46,
              borderRadius: `${44 + i * 5}% ${56 - i * 4}% 0 0 / ${18 + i * 5}% ${24 + i * 3}% 0 0`,
              background: `linear-gradient(${102 + i * 9}deg, ${[pal.primary, pal.secondary, pal.accent, pal.text][i]}e8, ${[pal.accent, pal.primary, pal.secondary, pal.primary][i]}b8)`,
              filter: `blur(${i * 3}px)`,
              mixBlendMode: i === 0 ? "normal" : "screen",
              opacity: 0.9 - i * 0.12,
              transform: `translateX(${Math.sin(frame * 0.025 + i) * 28}px) rotate(${Math.sin(frame * 0.02 + i) * 1.2}deg)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const GlassCard: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const reveal = enter(frame, 7, 28);
  return (
    <AbsoluteFill style={{ background: pal.bg, justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
      <Mesh colors={[pal.accent, pal.primary, pal.secondary]} count={9} seed={4409} blur={82} opacity={0.72} />
      <div
        style={{
          position: "relative",
          width: "62%",
          minHeight: "48%",
          borderRadius: 42,
          border: `1px solid ${pal.text}55`,
          background: `linear-gradient(135deg, ${pal.text}25, ${pal.text}08)`,
          boxShadow: `0 40px 100px ${pal.bg}88, inset 0 1px 0 ${pal.text}66`,
          backdropFilter: "blur(34px)",
          padding: "5%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          opacity: reveal,
          transform: `translateY(${(1 - reveal) * 60 + Math.sin(frame * 0.025) * 8}px) scale(${0.94 + reveal * 0.06})`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Label color={pal.text}>Mesh / Glass</Label>
          <div style={{ width: 18, height: 18, borderRadius: "50%", background: pal.accent, boxShadow: `0 0 30px ${pal.accent}` }} />
        </div>
        <div>
          <div style={{ color: pal.text, fontFamily: FONT_STACK, fontSize: Math.min(width * 0.07, 108), fontWeight: 720, letterSpacing: "-0.055em", lineHeight: 0.98 }}>{p.headline}</div>
          <div style={{ color: `${pal.text}b8`, fontFamily: FONT_STACK, fontSize: 29, marginTop: 28 }}>{p.subline}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const RadialOrbit: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const orbit = `${p.subline.toUpperCase()}  •  `.repeat(4);
  return (
    <AbsoluteFill style={{ background: pal.bg, justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `repeating-conic-gradient(from ${frame * 0.16}deg at 50% 50%, ${pal.primary}55 0deg 4deg, transparent 4deg 13deg, ${pal.accent}33 13deg 17deg, transparent 17deg 26deg)`,
          maskImage: "radial-gradient(circle, black 0%, black 52%, transparent 78%)",
          opacity: 0.8,
        }}
      />
      <div style={{ position: "absolute", width: 690, height: 690, borderRadius: "50%", border: `1px solid ${pal.text}55`, transform: `rotate(${frame * 0.22}deg)` }}>
        {orbit.split("").map((ch, i) => {
          const angle = (i / orbit.length) * 360;
          return (
            <span key={i} style={{ position: "absolute", left: "50%", top: "50%", color: `${pal.text}cc`, fontFamily: FONT_STACK, fontSize: 17, fontWeight: 700, transformOrigin: "0 0", transform: `rotate(${angle}deg) translateY(-345px) rotate(90deg)` }}>{ch}</span>
          );
        })}
      </div>
      <div style={{ position: "relative", width: 480, height: 480, borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center", background: `radial-gradient(circle at 35% 30%, ${pal.accent}dd, ${pal.primary}cc 48%, ${pal.bg} 76%)`, boxShadow: `0 0 110px ${pal.primary}88`, transform: `scale(${0.98 + Math.sin(frame * 0.03) * 0.025})` }}>
        <div style={{ color: pal.text, fontFamily: FONT_STACK, fontSize: Math.min(width * 0.052, 80), fontWeight: 800, lineHeight: 0.96, letterSpacing: "-0.05em", width: "80%" }}>{p.headline}</div>
      </div>
    </AbsoluteFill>
  );
};

const VerticalBands: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const colors = [pal.primary, pal.secondary, pal.accent, pal.primary, pal.text, pal.secondary];
  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, display: "flex" }}>
        {colors.map((color, i) => {
          const offset = Math.sin(frame * 0.026 + i * 0.8) * 120;
          return (
            <div key={i} style={{ position: "relative", width: `${100 / colors.length + 2}%`, marginLeft: i ? "-1%" : 0, height: "130%", top: "-15%", background: `linear-gradient(${i % 2 ? 180 : 0}deg, ${pal.bg}, ${color}, ${pal.accent}88)`, filter: "blur(8px)", mixBlendMode: i % 2 ? "screen" : "normal", transform: `translateY(${offset}px) scaleX(${1 + Math.sin(frame * 0.018 + i) * 0.08})` }} />
          );
        })}
      </div>
      <AbsoluteFill style={{ background: `linear-gradient(90deg, ${pal.bg}99, transparent 42%, ${pal.bg}55)` }} />
      <div style={{ position: "absolute", left: "7%", bottom: "10%", width: "72%", opacity: enter(frame, 8, 26), transform: `translateY(${(1 - enter(frame, 8, 26)) * 60}px)` }}>
        <div style={{ color: pal.text, fontFamily: FONT_STACK, fontSize: Math.min(width * 0.095, 142), fontWeight: 850, lineHeight: 0.88, letterSpacing: "-0.065em" }}>{p.headline}</div>
        <div style={{ marginTop: Math.min(height * 0.04, 38) }}><Label color={`${pal.text}cc`}>{p.subline}</Label></div>
      </div>
    </AbsoluteFill>
  );
};

const SoftFocus: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const breath = (Math.sin(frame * 0.025 - Math.PI / 2) + 1) / 2;
  return (
    <AbsoluteFill style={{ background: pal.bg, justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
      <Mesh colors={[pal.primary, pal.secondary, pal.accent, pal.text]} count={6} seed={8069} blur={135} opacity={0.62} />
      <AbsoluteFill style={{ background: `${pal.bg}22`, backdropFilter: `blur(${8 + breath * 7}px)` }} />
      <div style={{ position: "relative", textAlign: "center", width: "82%", transform: `scale(${0.96 + breath * 0.04})`, filter: `blur(${(1 - enter(frame, 3, 28)) * 18}px)`, opacity: enter(frame, 3, 28) }}>
        <div style={{ color: pal.text, fontFamily: FONT_STACK, fontSize: Math.min(width * 0.09, 136), fontWeight: 420, letterSpacing: "-0.045em", lineHeight: 1 }}>{p.headline}</div>
        <div style={{ color: `${pal.text}b0`, fontFamily: FONT_STACK, fontSize: 28, letterSpacing: "0.22em", textTransform: "uppercase", marginTop: 34 }}>{p.subline}</div>
      </div>
    </AbsoluteFill>
  );
};

const RibbonSweep: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: pal.bg, justifyContent: "center", overflow: "hidden" }}>
      {[0, 1, 2].map((i) => {
        const x = interpolate(enter(frame, i * 7, 38), [0, 1], [-125, 0]) + Math.sin(frame * 0.018 + i) * 3;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "-20%",
              top: `${14 + i * 25}%`,
              width: "145%",
              height: `${20 - i * 2}%`,
              borderRadius: "50% 8% 50% 12% / 55% 42% 58% 45%",
              background: `linear-gradient(90deg, transparent, ${[pal.primary, pal.accent, pal.secondary][i]} 18%, ${[pal.accent, pal.secondary, pal.primary][i]} 62%, transparent)`,
              filter: `blur(${5 + i * 3}px)`,
              mixBlendMode: "screen",
              opacity: 0.82,
              transform: `translateX(${x}%) rotate(${-9 + i * 7 + Math.sin(frame * 0.02 + i) * 2}deg)`,
            }}
          />
        );
      })}
      <div style={{ position: "relative", marginLeft: "8%", width: "62%", zIndex: 2 }}>
        <Label color={pal.accent}>Chromatic motion</Label>
        <div style={{ color: pal.text, fontFamily: FONT_STACK, fontSize: Math.min(width * 0.1, 150), fontWeight: 820, lineHeight: 0.9, letterSpacing: "-0.07em", marginTop: 26, textShadow: `0 18px 65px ${pal.bg}` }}>{p.headline}</div>
        <div style={{ color: `${pal.text}b8`, fontFamily: FONT_STACK, fontSize: 30, marginTop: 32 }}>{p.subline}</div>
      </div>
    </AbsoluteFill>
  );
};

const TranslucentPanes: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const panes = [
    { left: "5%", top: "7%", width: "48%", height: "52%", rotate: -7, color: pal.primary },
    { left: "39%", top: "16%", width: "54%", height: "67%", rotate: 8, color: pal.accent },
    { left: "18%", top: "54%", width: "48%", height: "35%", rotate: 3, color: pal.secondary },
  ];
  return (
    <AbsoluteFill style={{ background: pal.bg, justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
      <Mesh colors={[pal.primary, pal.accent, pal.secondary]} count={5} seed={9887} blur={110} opacity={0.5} />
      {panes.map((pane, i) => {
        const reveal = enter(frame, 4 + i * 7, 26);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: pane.left,
              top: pane.top,
              width: pane.width,
              height: pane.height,
              border: `1px solid ${pal.text}44`,
              borderRadius: 36,
              background: `linear-gradient(145deg, ${pane.color}38, ${pal.text}0d)`,
              boxShadow: `inset 0 1px 0 ${pal.text}44, 0 40px 90px ${pal.bg}55`,
              backdropFilter: "blur(28px)",
              mixBlendMode: "screen",
              opacity: reveal * 0.9,
              transform: `translateY(${(1 - reveal) * 90 + Math.sin(frame * 0.02 + i) * 10}px) rotate(${pane.rotate + Math.sin(frame * 0.012 + i) * 1.5}deg)`,
            }}
          />
        );
      })}
      <div style={{ position: "relative", zIndex: 3, width: "70%", textAlign: "center" }}>
        <div style={{ color: pal.text, fontFamily: FONT_STACK, fontSize: Math.min(width * 0.088, 132), fontWeight: 760, letterSpacing: "-0.06em", lineHeight: 0.94 }}>{p.headline}</div>
        <div style={{ marginTop: 34 }}><Label color={`${pal.text}cc`}>{p.subline}</Label></div>
      </div>
    </AbsoluteFill>
  );
};

const VARIANTS: Record<GradientMeshVariant, React.FC<VariantProps>> = {
  "aurora-mesh": AuroraMesh,
  "duotone-blob": DuotoneBlob,
  "grainy-poster": GrainyPoster,
  "liquid-waves": LiquidWaves,
  "glass-card": GlassCard,
  "radial-orbit": RadialOrbit,
  "vertical-bands": VerticalBands,
  "soft-focus": SoftFocus,
  "ribbon-sweep": RibbonSweep,
  "translucent-panes": TranslucentPanes,
};

export const GradientMeshTemplate: React.FC<GradientMeshProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? AuroraMesh;
  return (
    <AbsoluteFill style={{ background: pal.bg }}>
      <FadeEdges>
        <Variant p={props} pal={pal} />
      </FadeEdges>
    </AbsoluteFill>
  );
};

const familyCast = (c: React.FC<GradientMeshProps>) =>
  c as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "gradient-aurora-word": familyCast(GradientMeshTemplate),
  "gradient-duotone-blob": familyCast(GradientMeshTemplate),
  "gradient-grain-poster": familyCast(GradientMeshTemplate),
  "gradient-liquid-waves": familyCast(GradientMeshTemplate),
  "gradient-glass-card": familyCast(GradientMeshTemplate),
  "gradient-radial-orbit": familyCast(GradientMeshTemplate),
  "gradient-vertical-bands": familyCast(GradientMeshTemplate),
  "gradient-soft-focus": familyCast(GradientMeshTemplate),
  "gradient-ribbon-sweep": familyCast(GradientMeshTemplate),
  "gradient-translucent-panes": familyCast(GradientMeshTemplate),
};
