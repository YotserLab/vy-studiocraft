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
  GradientMeshBackground,
  GridPerspectiveBackground,
  clampInterp,
  resolvePalette,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: object-turntables
 * Procedural product/object rotation scenes. The objects are CSS/SVG shapes so
 * every default renders without assets, network access, WebGL, or randomness.
 */
export type ObjectTurntableVariant =
  | "slow-spin"
  | "snap-turn"
  | "quarter-turn"
  | "top-down-turn"
  | "tilt-spin"
  | "multi-object-spin"
  | "material-swap"
  | "light-rig-turn"
  | "shadow-turn"
  | "360-reveal";

export interface ObjectTurntableProps {
  variant: ObjectTurntableVariant;
  objectLabel: string;
  objectShape: string;
  colors: string[];
  paletteName: string;
  camera?: string;
  rotationTurns?: number;
  lightDirection?: number;
  background?: string;
  subtitle?: string;
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const FALLBACK_COLORS = ["#7c5cff", "#00e0ff", "#ff3d81"];

type ShapeKind = "bottle" | "box" | "orb" | "disc" | "cube" | "package";
type MaterialKind = "gloss" | "matte" | "metal" | "glass" | "paper";

const safeColors = (colors: string[] | undefined, pal: Palette): string[] => {
  const values = (colors ?? []).filter(Boolean);
  return values.length >= 3 ? values : [pal.primary, pal.secondary, pal.accent, ...FALLBACK_COLORS];
};

const shapeKind = (value: string | undefined): ShapeKind => {
  const v = (value ?? "bottle").toLowerCase();
  if (v.includes("box") || v.includes("package")) return v.includes("package") ? "package" : "box";
  if (v.includes("orb") || v.includes("sphere")) return "orb";
  if (v.includes("disc") || v.includes("vinyl")) return "disc";
  if (v.includes("cube")) return "cube";
  return "bottle";
};

const TextBlock: React.FC<{
  p: ObjectTurntableProps;
  pal: Palette;
  eyebrow?: string;
  compact?: boolean;
}> = ({ p, pal, eyebrow = "OBJECT STUDY", compact = false }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        fontFamily: FONT,
        color: pal.text,
        opacity: clampInterp(frame, [4, 22], [0, 1]),
        transform: `translateY(${clampInterp(frame, [4, 22], [28, 0])}px)`,
        maxWidth: compact ? 420 : 620,
      }}
    >
      <div style={{ color: pal.accent, fontSize: compact ? 13 : 17, letterSpacing: ".24em", fontWeight: 850 }}>{eyebrow}</div>
      <div style={{ marginTop: 12, fontSize: compact ? 42 : 72, lineHeight: .94, fontWeight: 900, letterSpacing: "-.055em" }}>{p.objectLabel}</div>
      <div style={{ marginTop: 18, color: `${pal.text}a8`, fontSize: compact ? 17 : 24, lineHeight: 1.35 }}>{p.subtitle ?? "A considered form, shown from every angle."}</div>
    </div>
  );
};

const Dots: React.FC<{ colors: string[]; pal: Palette }> = ({ colors, pal }) => (
  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
    {colors.slice(0, 4).map((color, i) => <span key={`${color}-${i}`} style={{ width: 14, height: 14, borderRadius: 20, background: color, border: `2px solid ${pal.text}50`, boxShadow: `0 0 18px ${color}66` }} />)}
  </div>
);

const ObjectShape: React.FC<{
  shape: ShapeKind;
  colors: string[];
  pal: Palette;
  label: string;
  angle?: number;
  tilt?: number;
  scale?: number;
  material?: MaterialKind;
  shadow?: boolean;
  showLabel?: boolean;
}> = ({ shape, colors, pal, label, angle = 0, tilt = 0, scale = 1, material = "gloss", shadow = true, showLabel = true }) => {
  const c0 = colors[0] ?? pal.primary;
  const c1 = colors[1] ?? pal.secondary;
  const c2 = colors[2] ?? pal.accent;
  const isMetal = material === "metal";
  const isGlass = material === "glass";
  const sheen = material === "matte" ? "none" : `linear-gradient(105deg, transparent 20%, ${pal.text}55 42%, transparent 58%)`;
  const body = `linear-gradient(${102 + tilt}deg, ${c0} 0%, ${c1}dd 42%, ${c2}cc 68%, ${c0} 100%)`;
  const labelStyle: React.CSSProperties = { position: "absolute", left: 14, right: 14, top: "50%", transform: "translateY(-50%)", textAlign: "center", color: isGlass ? pal.text : pal.bg, font: `900 18px ${FONT}`, letterSpacing: ".16em", textTransform: "uppercase", lineHeight: 1.1, backfaceVisibility: "hidden" };
  const common: React.CSSProperties = { position: "relative", transform: `perspective(1000px) rotateX(${tilt}deg) rotateY(${angle}deg) scale(${scale})`, transformStyle: "preserve-3d", filter: shadow ? "drop-shadow(0 48px 34px #0009)" : undefined };
  if (shape === "orb") return <div style={{ ...common, width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle at 30% 23%, ${pal.text}bb 0 4%, transparent 17%), ${body}`, border: `2px solid ${pal.text}45`, boxShadow: `inset -35px -35px 65px ${pal.bg}99, inset 25px 20px 45px ${pal.text}32` }}><div style={{ position: "absolute", inset: 30, borderRadius: "50%", border: `1px solid ${pal.text}3e`, transform: "rotate(35deg)" }} />{showLabel && <div style={{ ...labelStyle, color: pal.text }}>{label}</div>}</div>;
  if (shape === "disc") return <div style={{ ...common, width: 390, height: 100, borderRadius: "50%", background: `radial-gradient(circle at center, ${c2} 0 5%, ${c0} 6% 16%, ${c1} 17% 50%, ${c0} 51% 100%)`, border: `3px solid ${pal.text}55`, boxShadow: `inset 0 10px 16px ${pal.text}3a, 0 35px 40px #0008` }}>{showLabel && <div style={{ ...labelStyle, color: pal.text, top: "46%" }}>{label}</div>}</div>;
  if (shape === "cube") return <div style={{ ...common, width: 280, height: 280, borderRadius: 26, background: body, border: `2px solid ${pal.text}62`, boxShadow: `inset 22px 18px 35px ${pal.text}27, inset -28px -30px 45px ${pal.bg}77` }}><div style={{ position: "absolute", inset: 20, border: `1px solid ${pal.text}45`, borderRadius: 16 }} />{showLabel && <div style={{ ...labelStyle, color: pal.text }}>{label}</div>}</div>;
  const isPackage = shape === "package";
  const width = isPackage ? 300 : 210;
  const height = isPackage ? 300 : 390;
  const radius = isPackage ? 24 : "58px 58px 42px 42px / 45px 45px 34px 34px";
  return <div style={{ ...common, width, height, borderRadius: radius, background: isPackage ? `linear-gradient(135deg, ${c1}, ${c0} 55%, ${c2})` : body, border: `2px solid ${pal.text}55`, overflow: "hidden", boxShadow: `inset 20px 10px 35px ${pal.text}25, inset -25px -30px 42px ${pal.bg}66` }}>
    <div style={{ position: "absolute", inset: 0, background: sheen, transform: "translateX(-18%) rotate(4deg)", opacity: material === "matte" ? 0 : .7 }} />
    {isPackage && <><div style={{ position: "absolute", left: 0, right: 0, top: 34, height: 2, background: `${pal.text}55` }} /><div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, background: `${pal.text}35`, transform: "translateX(-50%)" }} /></>}
    {!isPackage && <div style={{ position: "absolute", left: "18%", top: 0, width: "13%", height: "84%", borderRadius: 40, background: `linear-gradient(${pal.text}aa, transparent)`, opacity: material === "matte" ? .12 : .5 }} />}
    {shape === "bottle" && <div style={{ position: "absolute", left: "31%", top: -48, width: "38%", height: 95, borderRadius: "16px 16px 4px 4px", background: `linear-gradient(90deg,${pal.bg},${pal.text}99,${pal.bg})`, border: `1px solid ${pal.text}60` }} />}
    {showLabel && <div style={{ ...labelStyle, color: isPackage ? pal.bg : pal.text }}>{label}</div>}
  </div>;
};

const Stage: React.FC<{ pal: Palette; children: React.ReactNode; platform?: boolean; grid?: boolean }> = ({ pal, children, platform = true, grid = false }) => (
  <div style={{ position: "relative", width: 720, height: 720, display: "flex", alignItems: "center", justifyContent: "center", perspective: 1200 }}>
    {grid && <div style={{ position: "absolute", inset: 50, borderRadius: "50%", border: `1px solid ${pal.primary}55`, background: `repeating-radial-gradient(ellipse, transparent 0 45px, ${pal.primary}24 46px 47px)` }} />}
    {platform && <div style={{ position: "absolute", left: 90, right: 90, bottom: 78, height: 125, borderRadius: "50%", background: `radial-gradient(ellipse, ${pal.secondary}bb, ${pal.primary}88 45%, ${pal.bg})`, border: `2px solid ${pal.text}35`, boxShadow: `0 48px 65px #0009, inset 0 12px 22px ${pal.text}22`, transform: "rotateX(58deg)" }} />}
    {children}
  </div>
);

const SlowSpin: React.FC<{ p: ObjectTurntableProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const colors = safeColors(p.colors, pal); const turns = p.rotationTurns ?? 1;
  return <AbsoluteFill style={{ padding: "120px 110px", boxSizing: "border-box", flexDirection: "row", alignItems: "center", gap: 80 }}><div style={{ width: "42%" }}><TextBlock p={p} pal={pal} eyebrow="SLOW SPIN" /><div style={{ marginTop: 32, display: "flex", gap: 26, alignItems: "center", color: `${pal.text}99`, font: `16px ${MONO}` }}><Dots colors={colors} pal={pal} />{turns.toFixed(1)} TURNS</div></div><Stage pal={pal}><div style={{ transform: `rotateY(${frame * 360 * turns / 180}deg)` }}><ObjectShape shape={shapeKind(p.objectShape)} colors={colors} pal={pal} label={p.objectLabel} /></div></Stage></AbsoluteFill>;
};

const SnapTurn: React.FC<{ p: ObjectTurntableProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const colors = safeColors(p.colors, pal); const snap = interpolate(frame, [0, 24, 34, 66, 76, 108, 118, 150], [0, 0, 90, 90, 180, 180, 270, 360], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ padding: "100px 115px", boxSizing: "border-box" }}><TextBlock p={p} pal={pal} eyebrow="SNAP / TURN" /><div style={{ position: "absolute", left: 690, top: 160 }}><Stage pal={pal} grid><div style={{ transform: `rotateY(${snap}deg)` }}><ObjectShape shape={shapeKind(p.objectShape)} colors={colors} pal={pal} label={p.objectLabel} material="metal" /></div></Stage></div><div style={{ position: "absolute", left: 120, bottom: 100, color: pal.secondary, font: `700 17px ${MONO}`, letterSpacing: ".12em" }}>TACTILE ROTATION / {String(Math.round(snap % 360)).padStart(3, "0")}°</div></AbsoluteFill>;
};

const QuarterTurn: React.FC<{ p: ObjectTurntableProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const colors = safeColors(p.colors, pal); const q = clampInterp(frame, [12, 72], [0, 90]);
  return <AbsoluteFill style={{ background: `linear-gradient(115deg, ${pal.bg}, ${pal.primary}18)` }}><div style={{ position: "absolute", left: 105, top: 112 }}><TextBlock p={p} pal={pal} eyebrow="QUARTER TURN" /></div><div style={{ position: "absolute", left: 650, top: 140 }}><Stage pal={pal} platform={false}><div style={{ transform: `rotateY(${q}deg) rotateX(-5deg)` }}><ObjectShape shape={shapeKind(p.objectShape)} colors={colors} pal={pal} label={p.objectLabel} /></div></Stage></div><div style={{ position: "absolute", left: 110, bottom: 105, display: "flex", gap: 12 }}>{["FRONT", "PROFILE", "DETAIL"].map((s, i) => <div key={s} style={{ padding: "13px 18px", border: `1px solid ${i === 1 ? pal.accent : pal.text}55`, color: i === 1 ? pal.accent : `${pal.text}a0`, font: `700 15px ${MONO}`, borderRadius: 6 }}>{s}</div>)}</div></AbsoluteFill>;
};

const TopDownTurn: React.FC<{ p: ObjectTurntableProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const colors = safeColors(p.colors, pal); const angle = frame * 2.1;
  return <AbsoluteFill style={{ padding: "100px 110px", boxSizing: "border-box" }}><TextBlock p={p} pal={pal} eyebrow="TOP-DOWN STUDY" /><div style={{ position: "absolute", right: 155, top: 75 }}><Stage pal={pal} platform={false} grid><div style={{ transform: `rotateZ(${angle}deg) rotateX(62deg) scale(.92)` }}><ObjectShape shape={shapeKind(p.objectShape)} colors={colors} pal={pal} label={p.objectLabel} /></div></Stage></div><div style={{ position: "absolute", left: 115, bottom: 115, color: `${pal.text}8c`, font: `16px ${MONO}` }}>CAMERA / TOP_ANGLE<br /><span style={{ color: pal.accent }}>ROTATION {Math.round(angle % 360)}°</span></div></AbsoluteFill>;
};

const TiltSpin: React.FC<{ p: ObjectTurntableProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const colors = safeColors(p.colors, pal); const angle = frame * 2.2; const tilt = 10 + Math.sin(frame * .04) * 7;
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}><div style={{ position: "absolute", left: 112, top: 115 }}><TextBlock p={p} pal={pal} eyebrow="TILT / SPIN" /></div><Stage pal={pal}><div style={{ transform: `rotateY(${angle}deg) rotateX(${tilt}deg) rotateZ(${Math.sin(frame * .03) * 4}deg)` }}><ObjectShape shape={shapeKind(p.objectShape)} colors={colors} pal={pal} label={p.objectLabel} material="gloss" /></div></Stage><div style={{ position: "absolute", right: 115, bottom: 92, padding: "12px 17px", borderRadius: 99, border: `1px solid ${pal.secondary}77`, color: pal.secondary, font: `700 15px ${MONO}` }}>CAMERA OFFSET / ACTIVE</div></AbsoluteFill>;
};

const MultiObjectSpin: React.FC<{ p: ObjectTurntableProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const colors = safeColors(p.colors, pal); const shape = shapeKind(p.objectShape);
  return <AbsoluteFill style={{ padding: "95px 110px", boxSizing: "border-box" }}><TextBlock p={p} pal={pal} eyebrow="MULTI-OBJECT SPIN" /><div style={{ position: "absolute", left: 530, top: 155, width: 940, height: 720 }}>{[0, 1, 2].map((i) => { const a = frame * 1.35 + i * 120; const x = Math.cos(a * Math.PI / 180) * 300; const y = Math.sin(a * Math.PI / 180) * 110; return <div key={i} style={{ position: "absolute", left: "50%", top: 260, transform: `translate(${x}px,${y}px) scale(${.78 + (i === 1 ? .22 : 0)})`, zIndex: Math.round(y + 500) }}><ObjectShape shape={i === 1 ? shape : i === 0 ? "orb" : "cube"} colors={[colors[i], colors[(i + 1) % colors.length], colors[(i + 2) % colors.length]]} pal={pal} label={i === 1 ? p.objectLabel : `${p.objectLabel} 0${i + 1}`} angle={a} showLabel={i === 1} /></div>; })}<div style={{ position: "absolute", left: 135, bottom: 95, color: `${pal.text}8e`, font: `16px ${MONO}` }}>SYNCED SET / 03 OBJECTS</div></div></AbsoluteFill>;
};

const MaterialSwap: React.FC<{ p: ObjectTurntableProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const colors = safeColors(p.colors, pal);
  const index = Math.floor(frame / 45) % 3; const materials: MaterialKind[] = ["gloss", "matte", "metal"]; const material = materials[index];
  return <AbsoluteFill style={{ padding: "115px 120px", boxSizing: "border-box" }}><TextBlock p={p} pal={pal} eyebrow="MATERIAL SWAP" /><div style={{ position: "absolute", left: 690, top: 125 }}><Stage pal={pal} grid><div style={{ transform: `rotateY(${frame * 1.5}deg)` }}><ObjectShape shape={shapeKind(p.objectShape)} colors={colors.map((c, i) => i === index ? pal.text : c)} pal={pal} label={p.objectLabel} material={material} /></div></Stage></div><div style={{ position: "absolute", left: 125, bottom: 108, display: "flex", gap: 12 }}>{(["GLOSS", "MATTE", "METAL"] as const).map((m, i) => <div key={m} style={{ padding: "12px 17px", borderRadius: 6, color: i === index ? pal.bg : pal.text, background: i === index ? pal.accent : `${pal.text}12`, border: `1px solid ${pal.text}35`, font: `700 14px ${MONO}` }}>{m}</div>)}</div></AbsoluteFill>;
};

const LightRigTurn: React.FC<{ p: ObjectTurntableProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const colors = safeColors(p.colors, pal); const light = (p.lightDirection ?? 30) + frame * 1.8;
  return <AbsoluteFill style={{ background: `radial-gradient(circle at ${50 + Math.cos(light * Math.PI / 180) * 35}% 36%, ${pal.text}2e, transparent 28%), ${pal.bg}` }}><div style={{ position: "absolute", left: 110, top: 110 }}><TextBlock p={p} pal={pal} eyebrow="LIGHT RIG / TURN" /></div>{[-1, 0, 1].map((i) => <div key={i} style={{ position: "absolute", left: `${50 + i * 25}%`, top: 0, width: 120, height: "100%", transform: `rotate(${i * 18 + Math.sin(frame * .025) * 10}deg)`, transformOrigin: "top center", background: `linear-gradient(90deg, transparent, ${colors[(i + 2 + colors.length) % colors.length]}1c, transparent)`, filter: "blur(18px)" }} />)}<div style={{ position: "absolute", left: 670, top: 160 }}><Stage pal={pal}><div style={{ transform: `rotateY(${frame * 1.8}deg)` }}><ObjectShape shape={shapeKind(p.objectShape)} colors={colors} pal={pal} label={p.objectLabel} material="metal" /></div></Stage></div><div style={{ position: "absolute", right: 112, bottom: 95, color: pal.secondary, font: `700 15px ${MONO}` }}>KEY LIGHT {Math.round(light % 360)}°</div></AbsoluteFill>;
};

const ShadowTurn: React.FC<{ p: ObjectTurntableProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const colors = safeColors(p.colors, pal); const angle = frame * 2; const shadowX = Math.sin(angle * Math.PI / 180) * 95;
  return <AbsoluteFill style={{ padding: "100px 110px", boxSizing: "border-box", background: `linear-gradient(145deg, ${pal.bg}, ${pal.primary}1a)` }}><TextBlock p={p} pal={pal} eyebrow="SHADOW STUDY" /><div style={{ position: "absolute", left: 675, top: 150 }}><Stage pal={pal}><div style={{ position: "absolute", left: 180, top: 260, width: 320, height: 90, borderRadius: "50%", background: `radial-gradient(ellipse, #000b, transparent 70%)`, filter: "blur(20px)", transform: `translateX(${shadowX}px) scaleX(${1.2 + Math.abs(Math.cos(angle * Math.PI / 180))})` }} /><div style={{ transform: `rotateY(${angle}deg) rotateX(-5deg)` }}><ObjectShape shape={shapeKind(p.objectShape)} colors={colors} pal={pal} label={p.objectLabel} shadow={false} /></div></Stage></div><div style={{ position: "absolute", left: 112, bottom: 100, width: 400, height: 2, background: `linear-gradient(90deg,${pal.accent},transparent)` }} /></AbsoluteFill>;
};

const Reveal360: React.FC<{ p: ObjectTurntableProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const colors = safeColors(p.colors, pal); const enter = spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 15, stiffness: 95 } }); const angle = interpolate(enter, [0, 1], [-120, 720]);
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}><div style={{ position: "absolute", left: 110, top: 100 }}><TextBlock p={p} pal={pal} eyebrow="360° REVEAL" /></div><div style={{ position: "absolute", right: 115, top: 95, width: 230, height: 230, borderRadius: "50%", border: `1px solid ${pal.text}3b`, background: `conic-gradient(from ${angle}deg, ${pal.primary}, ${pal.secondary}, ${pal.accent}, ${pal.primary})`, maskImage: "radial-gradient(transparent 0 65%, #000 66%)" }} /><Stage pal={pal} grid><div style={{ transform: `rotateY(${angle}deg)` }}><ObjectShape shape={shapeKind(p.objectShape)} colors={colors} pal={pal} label={p.objectLabel} material="glass" /></div></Stage><div style={{ position: "absolute", right: 130, bottom: 105, color: pal.accent, font: `800 27px ${MONO}` }}>{Math.round(((angle % 360) + 360) % 360)}°</div></AbsoluteFill>;
};

const VARIANTS: Record<ObjectTurntableVariant, React.FC<{ p: ObjectTurntableProps; pal: Palette }>> = {
  "slow-spin": SlowSpin,
  "snap-turn": SnapTurn,
  "quarter-turn": QuarterTurn,
  "top-down-turn": TopDownTurn,
  "tilt-spin": TiltSpin,
  "multi-object-spin": MultiObjectSpin,
  "material-swap": MaterialSwap,
  "light-rig-turn": LightRigTurn,
  "shadow-turn": ShadowTurn,
  "360-reveal": Reveal360,
};

export const ObjectTurntablesTemplate: React.FC<ObjectTurntableProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? SlowSpin;
  const grid = props.variant === "snap-turn" || props.variant === "material-swap" || props.variant === "360-reveal";
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <AbsoluteFill style={{ backgroundColor: pal.bg, overflow: "hidden" }}>
    {grid ? <GridPerspectiveBackground palette={pal} /> : <GradientMeshBackground palette={pal} speed={.4} blobs={props.variant === "light-rig-turn" ? 3 : 4} />}
    <FadeEdges inFrames={10} outFrames={12}><div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><Variant p={props} pal={pal} /></div></FadeEdges>
  </AbsoluteFill>;
};

const familyCast = (c: React.FC<ObjectTurntableProps>) => c as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "object-turntables-slow-spin": familyCast(ObjectTurntablesTemplate),
  "object-turntables-snap-turn": familyCast(ObjectTurntablesTemplate),
  "object-turntables-quarter-turn": familyCast(ObjectTurntablesTemplate),
  "object-turntables-top-down-turn": familyCast(ObjectTurntablesTemplate),
  "object-turntables-tilt-spin": familyCast(ObjectTurntablesTemplate),
  "object-turntables-multi-object-spin": familyCast(ObjectTurntablesTemplate),
  "object-turntables-material-swap": familyCast(ObjectTurntablesTemplate),
  "object-turntables-light-rig-turn": familyCast(ObjectTurntablesTemplate),
  "object-turntables-shadow-turn": familyCast(ObjectTurntablesTemplate),
  "object-turntables-360-reveal": familyCast(ObjectTurntablesTemplate),
};
