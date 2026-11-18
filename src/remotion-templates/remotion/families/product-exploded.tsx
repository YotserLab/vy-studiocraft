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
  seededRand,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: product-exploded
 * Procedural exploded-view product choreography. Parts are CSS/SVG primitives
 * so every default is renderable without images, models, or network access.
 */
export type ProductExplodedVariant =
  | "layer-separate"
  | "component-callout"
  | "assembly-reverse"
  | "cutaway-reveal"
  | "magnetic-snap"
  | "parts-carousel"
  | "material-layers"
  | "dimension-explode"
  | "inside-out"
  | "assembly-to-hero";

export interface ProductExplodedProps {
  variant: ProductExplodedVariant;
  productName: string;
  tagline: string;
  parts: string[];
  paletteName: string;
  focusPart?: string;
  spacing?: number;
  assemblyOrder?: number[];
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const VARIANT_IDS: ProductExplodedVariant[] = [
  "layer-separate",
  "component-callout",
  "assembly-reverse",
  "cutaway-reveal",
  "magnetic-snap",
  "parts-carousel",
  "material-layers",
  "dimension-explode",
  "inside-out",
  "assembly-to-hero",
];

const PartNames = ({ p }: { p: ProductExplodedProps }) => (
  <>
    {p.parts.slice(0, 6).map((part, i) => (
      <span key={`${part}-${i}`} style={{ color: i % 2 ? "#ffffff99" : "#ffffffd0" }}>
        {part}
        {i < Math.min(p.parts.length, 6) - 1 ? "  /  " : ""}
      </span>
    ))}
  </>
);

const Heading: React.FC<{ p: ProductExplodedProps; pal: Palette; eyebrow?: string; width?: number }> = ({ p, pal, eyebrow = "SEE WHAT'S INSIDE", width = 510 }) => {
  const frame = useCurrentFrame();
  const y = clampInterp(frame, [4, 25], [30, 0]);
  return (
    <div style={{ width, color: pal.text, fontFamily: FONT, opacity: clampInterp(frame, [0, 13], [0, 1]), transform: `translateY(${y}px)` }}>
      <div style={{ color: pal.accent, fontSize: 16, fontWeight: 850, letterSpacing: ".24em" }}>{eyebrow}</div>
      <div style={{ marginTop: 13, fontSize: 66, lineHeight: .98, fontWeight: 900, letterSpacing: "-.06em" }}>{p.productName}</div>
      <div style={{ marginTop: 18, color: `${pal.text}b5`, fontSize: 24, lineHeight: 1.35 }}>{p.tagline}</div>
    </div>
  );
};

const Marker: React.FC<{ pal: Palette; x: number; y: number; label: string; delay?: number; side?: "left" | "right" }> = ({ pal, x, y, label, delay = 0, side = "right" }) => {
  const frame = useCurrentFrame();
  const show = clampInterp(frame, [28 + delay, 43 + delay], [0, 1]);
  return (
    <div style={{ position: "absolute", left: x, top: y, display: "flex", alignItems: "center", gap: 10, opacity: show, transform: `translateX(${interpolate(show, [0, 1], [side === "right" ? 26 : -26, 0])}px)`, color: pal.text, font: `700 16px ${FONT}`, whiteSpace: "nowrap" }}>
      {side === "left" && <span style={{ width: 46, height: 1, background: `${pal.accent}aa` }} />}
      <span style={{ width: 9, height: 9, borderRadius: 99, background: pal.accent, boxShadow: `0 0 0 5px ${pal.accent}28` }} />
      <span style={{ padding: "9px 13px", borderRadius: 10, background: `${pal.bg}e6`, border: `1px solid ${pal.accent}66` }}>{label}</span>
      {side === "right" && <span style={{ width: 46, height: 1, background: `${pal.accent}aa` }} />}
    </div>
  );
};

const ProductPart: React.FC<{
  pal: Palette;
  index: number;
  total: number;
  label: string;
  explode: number;
  mode: ProductExplodedVariant;
  focus?: boolean;
  colorShift?: number;
  order?: number;
  carouselX?: number;
}> = ({ pal, index, total, label, explode, mode, focus = false, colorShift = 0, order = index, carouselX = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fan = index - (total - 1) / 2;
  const palette = [pal.primary, pal.secondary, pal.accent, "#f5f7ff", "#8b7cff", "#ff9f5a"];
  const color = palette[(index + colorShift + palette.length) % palette.length];
  const depth = index / Math.max(1, total - 1);
  const springIn = spring({ frame: Math.max(0, frame - index * 3), fps, config: { damping: 18, stiffness: 110, mass: .7 } });
  const snap = mode === "magnetic-snap" ? spring({ frame: Math.max(0, frame - 34 - index * 3), fps, config: { damping: 12, stiffness: 160, mass: .55 } }) : 0;
  const travel = mode === "assembly-reverse" ? explode : explode * (.72 + depth * .35);
  const vertical = mode === "dimension-explode" ? (fan * 25 + fan * travel * 1.1) : fan * travel * 0.85;
  const horizontal = mode === "parts-carousel" ? carouselX + fan * 120 : mode === "dimension-explode" ? fan * travel * 1.45 : (index % 2 ? fan * travel * .45 : fan * travel * .16);
  // Inside-out keeps the exploded motion inside the safe frame: the earlier
  // treatment pushed alternating modules too far and made the thumbnail read
  // like a clipped, upside-down panel. Use a restrained radial lift instead.
  const radial = mode === "inside-out" ? (index % 2 ? -travel * .52 : travel * .62) : 0;
  const depthScale = mode === "inside-out" ? 1 + (index % 2 ? .02 : -.02) * explode : 1;
  const y = 390 + (mode === "inside-out" ? vertical * .64 : vertical) - radial;
  const width = 270 + (total - index) * 16;
  const height = 84 + (total - index) * 8;
  const z = mode === "inside-out" ? total - index : index + 1;
  const tilt = fan * (mode === "parts-carousel" ? 4 : mode === "inside-out" ? .8 : 2.2) + Math.sin(frame * .02 + index) * (mode === "layer-separate" ? 1.5 : 0);
  const transition = mode === "magnetic-snap" ? interpolate(snap, [0, 1], [1, 0]) : 1;
  const opacity = clampInterp(springIn, [0, 1], [0, 1]) * (focus ? .98 : 1);
  const sheen = ((frame * 2.2 + index * 47) % 180) - 80;
  return (
    <div style={{ position: "absolute", zIndex: z, left: `calc(50% + ${horizontal * transition}px)`, top: y, width, height, opacity, transform: `translate(-50%, -50%) scale(${depthScale * (focus ? 1.06 : 1)}) rotate(${tilt}deg)`, transformOrigin: "center", filter: focus ? `drop-shadow(0 22px 25px ${color}52)` : "drop-shadow(0 20px 26px #0008)", transition: "none" }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: mode === "material-layers" ? 14 + index * 2 : 22, background: `linear-gradient(105deg, ${color}f0 0%, ${color}a8 42%, ${pal.bg} 100%)`, border: `2px solid ${focus ? pal.accent : color}aa`, boxShadow: `inset 0 8px 18px #ffffff28, inset 0 -10px 22px #0004` }} />
      <div style={{ position: "absolute", left: `${sheen}%`, top: -20, width: 42, height: height + 40, transform: "rotate(18deg)", background: "linear-gradient(90deg, transparent, #ffffff32, transparent)", filter: "blur(5px)" }} />
      <div style={{ position: "absolute", left: 22, top: 18, width: 11, height: height - 36, borderRadius: 10, background: "linear-gradient(#ffffff5c, transparent)", opacity: .8 }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "0 26px", boxSizing: "border-box", color: pal.text, fontFamily: FONT }}>
        <div style={{ width: 42, height: 42, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", background: `${pal.bg}78`, border: `1px solid ${pal.text}42`, font: `800 15px ${MONO}` }}>{String(order + 1).padStart(2, "0")}</div>
        <div style={{ marginLeft: 16, fontSize: 20, fontWeight: 800, letterSpacing: "-.01em" }}>{label}</div>
        <div style={{ marginLeft: "auto", color: `${pal.text}86`, font: `600 12px ${MONO}` }}>MODULE_{String(index + 1).padStart(2, "0")}</div>
      </div>
      {mode === "cutaway-reveal" && index === Math.floor(total / 2) && <div style={{ position: "absolute", inset: 8, borderRadius: 14, background: `${pal.bg}9e`, border: `2px dashed ${pal.accent}aa` }} />}
    </div>
  );
};

const Connectors: React.FC<{ pal: Palette; explode: number; mode: ProductExplodedVariant }> = ({ pal, explode, mode }) => {
  const center = 960;
  const spread = mode === "dimension-explode" ? 1.4 : 1;
  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: .55 }}>
      <g fill="none" stroke={pal.accent} strokeWidth="2" strokeDasharray="8 12" opacity={.65}>
        <path d={`M${center - 300 * spread} 390 L${center + 300 * spread} 390`} />
        <path d={`M${center - 250 * spread} 455 L${center + 250 * spread} 455`} />
        <path d={`M${center - 220 * spread} 520 L${center + 220 * spread} 520`} />
      </g>
      {mode === "dimension-explode" && <g fill={pal.accent} fontFamily={MONO} fontSize="15"><text x="650" y="335">EXPLODE AXIS / X</text><text x="1340" y="605">ASSEMBLY DATUM</text></g>}
    </svg>
  );
};

const Dimensions: React.FC<{ pal: Palette; explode: number; mode: ProductExplodedVariant }> = ({ pal, explode, mode }) => {
  const frame = useCurrentFrame();
  if (mode !== "dimension-explode") return null;
  const draw = clampInterp(frame, [20, 48], [0, 1]);
  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <g fill="none" stroke={pal.accent} strokeWidth="2" strokeDasharray="10 8" strokeDashoffset={900 * (1 - draw)}>
        <path d="M450 330v220M1470 330v220M455 350h1010M470 565h980" />
        <path d="M450 330l18 24M450 330l-18 24M1470 330l-18 24M1470 330l18 24" />
      </g>
      <text x="870" y="322" fill={pal.text} fontFamily={MONO} fontSize="17" opacity={draw}>TOTAL SPREAD 1024 MM</text>
      <text x="825" y="600" fill={pal.accent} fontFamily={MONO} fontSize="14" opacity={draw}>TOLERANCE ±0.04</text>
    </svg>
  );
};

const AssemblyStage: React.FC<{ p: ProductExplodedProps; pal: Palette; mode: ProductExplodedVariant }> = ({ p, pal, mode }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const parts = p.parts.length ? p.parts.slice(0, 6) : ["Outer shell", "Control board", "Power core", "Optical layer", "Seal ring"];
  const base = clampInterp(frame, [8, 40], [0, 1]);
  const assembly = mode === "assembly-reverse"
    ? clampInterp(frame, [durationInFrames - 55, durationInFrames - 5], [1, 0])
    : mode === "assembly-to-hero"
      ? clampInterp(frame, [48, durationInFrames - 36], [1, 0])
      : 1;
  const explode = mode === "magnetic-snap"
    ? clampInterp(frame, [8, 38], [0, 1])
    : mode === "assembly-reverse"
      ? clampInterp(frame, [10, durationInFrames - 55], [0, 1])
      : mode === "assembly-to-hero"
        ? clampInterp(frame, [12, 48], [0, 1])
        : mode === "parts-carousel"
          ? clampInterp(frame, [8, 26], [0, 1])
          : base;
  const totalSpread = (p.spacing ?? 115) * explode * assembly;
  const focusIndex = p.focusPart ? Math.max(0, parts.findIndex((x) => x.toLowerCase() === p.focusPart?.toLowerCase())) : Math.min(2, parts.length - 1);
  const scale = mode === "assembly-to-hero" ? interpolate(assembly, [0, 1], [1.28, 1]) : 1;
  const carousel = mode === "parts-carousel" ? ((frame * -3.2) % 700) : 0;
  const order = p.assemblyOrder?.length === parts.length ? p.assemblyOrder : parts.map((_, i) => i);
  const stageX = mode === "component-callout" || mode === "cutaway-reveal" ? 110 : 0;
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translateX(${stageX}px) scale(${scale})`, transformOrigin: "center 48%" }}>
      <Connectors pal={pal} explode={totalSpread} mode={mode} />
      <div style={{ position: "absolute", left: "50%", top: 605, width: 860, height: 120, transform: "translateX(-50%)", borderRadius: "50%", background: `radial-gradient(ellipse, ${pal.primary}82, ${pal.bg} 70%)`, opacity: .62, filter: "blur(4px)" }} />
      <div style={{ position: "absolute", left: "50%", top: 665, width: 760, height: 34, transform: "translateX(-50%)", borderRadius: "50%", background: `${pal.text}15`, border: `1px solid ${pal.text}2a`, boxShadow: `0 25px 60px ${pal.bg}` }} />
      {parts.map((part, index) => (
        <ProductPart key={`${part}-${index}`} pal={pal} index={index} total={parts.length} label={part} explode={totalSpread} mode={mode} focus={mode === "component-callout" ? index === focusIndex : mode === "cutaway-reveal" ? index === Math.floor(parts.length / 2) : false} colorShift={mode === "material-layers" ? index + 1 : 0} order={order[index] ?? index} carouselX={carousel + ((index * 260 + 120) % 780) - 390} />
      ))}
      <Dimensions pal={pal} explode={totalSpread} mode={mode} />
    </div>
  );
};

const TechnicalFrame: React.FC<{ p: ProductExplodedProps; pal: Palette; mode: ProductExplodedVariant }> = ({ p, pal, mode }) => {
  const frame = useCurrentFrame();
  const focus = p.focusPart ?? p.parts[Math.min(2, p.parts.length - 1)] ?? "core module";
  const showLabels = mode === "component-callout" || mode === "dimension-explode" || mode === "inside-out";
  return (
    <>
      <AssemblyStage p={p} pal={pal} mode={mode} />
      {showLabels && (
        <>
          <Marker pal={pal} x={1450} y={330} label={focus} delay={0} />
          <Marker pal={pal} x={1440} y={470} label={p.parts[0] ?? "outer shell"} delay={7} />
          <Marker pal={pal} x={245} y={600} label={p.parts[1] ?? "interface layer"} delay={14} side="left" />
        </>
      )}
      <div style={{ position: "absolute", left: 92, bottom: 62, color: `${pal.text}78`, font: `13px ${MONO}`, letterSpacing: ".08em" }}>EXPLODED VIEW / {String(frame).padStart(3, "0")} / REV.01</div>
    </>
  );
};

const ProductExplodedTemplate: React.FC<ProductExplodedProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const mode = VARIANT_IDS.includes(props.variant) ? props.variant : "layer-separate";
  const technical = mode === "dimension-explode" || mode === "component-callout" || mode === "inside-out";
  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg, overflow: "hidden" }}>
      {technical ? <GridPerspectiveBackground palette={pal} /> : <GradientMeshBackground palette={pal} speed={.35} blobs={mode === "material-layers" ? 6 : 4} />}
      <FadeEdges inFrames={12} outFrames={14}>
        <Heading p={props} pal={pal} eyebrow={mode === "assembly-to-hero" ? "FROM PARTS TO PRESENCE" : mode === "inside-out" ? "THE DETAILS MATTER" : "DESIGNED IN LAYERS"} />
        <TechnicalFrame p={{ ...props, variant: mode }} pal={pal} mode={mode} />
        <div style={{ position: "absolute", right: 92, bottom: 64, display: "flex", gap: 18, color: `${pal.text}80`, font: `600 14px ${MONO}` }}><span><PartNames p={props} /></span></div>
      </FadeEdges>
    </AbsoluteFill>
  );
};

const familyCast = (c: React.FC<ProductExplodedProps>) => c as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "product-exploded-layer-separate": familyCast(ProductExplodedTemplate),
  "product-exploded-component-callout": familyCast(ProductExplodedTemplate),
  "product-exploded-assembly-reverse": familyCast(ProductExplodedTemplate),
  "product-exploded-cutaway-reveal": familyCast(ProductExplodedTemplate),
  "product-exploded-magnetic-snap": familyCast(ProductExplodedTemplate),
  "product-exploded-parts-carousel": familyCast(ProductExplodedTemplate),
  "product-exploded-material-layers": familyCast(ProductExplodedTemplate),
  "product-exploded-dimension-explode": familyCast(ProductExplodedTemplate),
  "product-exploded-inside-out": familyCast(ProductExplodedTemplate),
  "product-exploded-assembly-to-hero": familyCast(ProductExplodedTemplate),
};
