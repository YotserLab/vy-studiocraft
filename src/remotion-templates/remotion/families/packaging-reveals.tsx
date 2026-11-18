import React from "react";
import {
  AbsoluteFill,
  Img,
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
 * FAMILY: packaging-reveals
 * Asset-free CSS/SVG package mockups for product, label, and unboxing stories.
 * Real artwork and logos can be supplied as optional image URLs.
 */
export type PackagingRevealVariant =
  | "box-open"
  | "label-peel"
  | "front-back-pack"
  | "shelf-lineup"
  | "ingredient-badges"
  | "variant-stack"
  | "seal-reveal"
  | "package-turn"
  | "unboxing-sequence"
  | "packaging-lockup";

export interface PackagingRevealProps {
  variant: PackagingRevealVariant;
  productName: string;
  subtitle: string;
  packageShape: string;
  labels: string[];
  claims: string[];
  variants: string[];
  colors: string[];
  paletteName: string;
  logoUrl?: string;
  artworkUrl?: string;
  background?: string;
  speed?: number;
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';

const colorsFor = (p: PackagingRevealProps, pal: Palette): string[] => {
  const supplied = (p.colors ?? []).filter(Boolean);
  return supplied.length >= 3 ? supplied : [pal.primary, pal.secondary, pal.accent];
};

const textAt = (values: string[] | undefined, index: number, fallback: string): string =>
  values?.[index] || fallback;

const shapeFor = (value: string | undefined): "box" | "bottle" | "tube" | "pouch" | "jar" => {
  const normalized = (value || "box").toLowerCase();
  if (normalized.includes("bottle") || normalized.includes("flask")) return "bottle";
  if (normalized.includes("tube") || normalized.includes("stick")) return "tube";
  if (normalized.includes("pouch") || normalized.includes("sachet")) return "pouch";
  if (normalized.includes("jar") || normalized.includes("tin")) return "jar";
  return "box";
};

const Headline: React.FC<{ p: PackagingRevealProps; pal: Palette; eyebrow: string; compact?: boolean }> = ({ p, pal, eyebrow, compact = false }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        maxWidth: compact ? 470 : 620,
        fontFamily: FONT,
        color: pal.text,
        opacity: clampInterp(frame, [3, 24], [0, 1]),
        transform: `translateY(${clampInterp(frame, [3, 24], [26, 0])}px)`,
      }}
    >
      <div style={{ color: pal.accent, fontSize: compact ? 13 : 16, fontWeight: 900, letterSpacing: ".24em" }}>{eyebrow}</div>
      <div style={{ marginTop: 13, fontSize: compact ? 44 : 70, lineHeight: .95, fontWeight: 900, letterSpacing: "-.06em" }}>{p.productName}</div>
      <div style={{ marginTop: 18, color: `${pal.text}b3`, fontSize: compact ? 18 : 25, lineHeight: 1.32 }}>{p.subtitle}</div>
    </div>
  );
};

const Badge: React.FC<{ pal: Palette; children: React.ReactNode; color?: string }> = ({ pal, children, color = pal.accent }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 999, background: `${pal.bg}e8`, border: `1px solid ${color}88`, color: pal.text, font: `750 15px ${FONT}`, boxShadow: `0 12px 28px ${pal.bg}` }}>
    <span style={{ width: 8, height: 8, borderRadius: 10, background: color, boxShadow: `0 0 14px ${color}` }} />{children}
  </div>
);

const PackageShape: React.FC<{
  p: PackagingRevealProps;
  pal: Palette;
  colors: string[];
  index?: number;
  scale?: number;
  angle?: number;
  rotateY?: number;
  material?: "matte" | "gloss" | "paper" | "metal";
  showLabel?: boolean;
  showArtwork?: boolean;
}> = ({ p, pal, colors, index = 0, scale = 1, angle = 0, rotateY = 0, material = "matte", showLabel = true, showArtwork = true }) => {
  const shape = shapeFor(p.packageShape);
  const c0 = colors[index % colors.length] || pal.primary;
  const c1 = colors[(index + 1) % colors.length] || pal.secondary;
  const c2 = colors[(index + 2) % colors.length] || pal.accent;
  const isBox = shape === "box";
  const width = isBox ? 270 : shape === "bottle" ? 190 : shape === "jar" ? 240 : shape === "tube" ? 165 : 250;
  const height = isBox ? 360 : shape === "bottle" ? 420 : shape === "jar" ? 240 : shape === "tube" ? 410 : 330;
  const radius = isBox ? 20 : shape === "bottle" ? "50px 50px 32px 32px / 48px 48px 30px 30px" : shape === "jar" ? 34 : shape === "tube" ? 52 : 30;
  const bodyGradient = material === "metal"
    ? `linear-gradient(105deg, #69727f, ${c1} 38%, #f4f7fb 52%, ${c0} 72%, #535c69)`
    : material === "paper"
      ? `linear-gradient(135deg, ${c1}, ${c0} 62%, ${c2})`
      : `linear-gradient(120deg, ${c1}, ${c0} 46%, ${c2} 86%)`;
  const labelText = textAt(p.labels, index, p.productName);
  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        borderRadius: radius,
        transform: `perspective(1000px) rotateX(${angle}deg) rotateY(${rotateY}deg) scale(${scale})`,
        transformStyle: "preserve-3d",
        background: bodyGradient,
        border: `2px solid ${pal.text}55`,
        boxShadow: `0 45px 48px #0009, inset 18px 12px 32px ${pal.text}24, inset -24px -28px 42px ${pal.bg}55`,
        overflow: "visible",
      }}
    >
      {shape === "bottle" && <div style={{ position: "absolute", left: "32%", top: -51, width: "36%", height: 72, borderRadius: "14px 14px 3px 3px", background: `linear-gradient(90deg, ${pal.bg}, ${pal.text}99, ${pal.bg})`, border: `1px solid ${pal.text}5c` }} />}
      {shape === "tube" && <div style={{ position: "absolute", left: 0, right: 0, top: -20, height: 27, borderRadius: "50% 50% 8px 8px", background: `linear-gradient(90deg, ${c0}, ${pal.text}90, ${c1})`, border: `1px solid ${pal.text}55` }} />}
      {shape === "jar" && <div style={{ position: "absolute", left: -4, right: -4, top: -17, height: 30, borderRadius: 12, background: `linear-gradient(110deg, ${c0}, ${pal.text}88, ${c1})`, border: `1px solid ${pal.text}66` }} />}
      {isBox && <><div style={{ position: "absolute", top: 27, left: 0, right: 0, height: 2, background: `${pal.text}55` }} /><div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 2, background: `${pal.text}2e` }} /></>}
      <div style={{ position: "absolute", inset: 0, borderRadius: radius, background: `linear-gradient(105deg, transparent 23%, ${pal.text}35 43%, transparent 56%)`, opacity: material === "matte" || material === "paper" ? .18 : .68, transform: "translateX(-20%) rotate(5deg)" }} />
      {showArtwork && p.artworkUrl && <Img src={p.artworkUrl} style={{ position: "absolute", inset: isBox ? 20 : 13, width: `calc(100% - ${isBox ? 40 : 26}px)`, height: `calc(100% - ${isBox ? 40 : 26}px)`, objectFit: "cover", borderRadius: isBox ? 10 : 22, opacity: .82 }} />}
      {showLabel && <div style={{ position: "absolute", left: isBox ? 25 : 16, right: isBox ? 25 : 16, top: "50%", transform: "translateY(-50%)", padding: "19px 10px", boxSizing: "border-box", borderRadius: isBox ? 8 : 16, color: pal.bg, textAlign: "center", background: `${pal.text}d6`, boxShadow: `0 8px 20px ${pal.bg}66`, fontFamily: FONT }}>
        {p.logoUrl ? <Img src={p.logoUrl} style={{ width: 42, height: 25, objectFit: "contain", marginBottom: 8, filter: `drop-shadow(0 2px 2px ${pal.bg}66)` }} /> : <div style={{ color: c2, fontSize: 11, fontWeight: 900, letterSpacing: ".21em" }}>STUDIO / 0{index + 1}</div>}
        <div style={{ marginTop: 6, fontSize: isBox ? 22 : 18, lineHeight: 1, fontWeight: 900, letterSpacing: "-.04em" }}>{labelText}</div>
        <div style={{ marginTop: 8, fontSize: 10, fontWeight: 800, letterSpacing: ".15em", opacity: .68 }}>{textAt(p.claims, index, "MADE WITH INTENT")}</div>
      </div>}
    </div>
  );
};

const Stage: React.FC<{ pal: Palette; children: React.ReactNode; grid?: boolean }> = ({ pal, children, grid = false }) => (
  <div style={{ position: "relative", width: 760, height: 720, display: "flex", alignItems: "center", justifyContent: "center", perspective: 1250 }}>
    {grid && <div style={{ position: "absolute", inset: 34, borderRadius: "50%", border: `1px solid ${pal.primary}48`, background: `repeating-radial-gradient(ellipse, transparent 0 48px, ${pal.primary}20 49px 50px)` }} />}
    <div style={{ position: "absolute", left: 80, right: 80, bottom: 74, height: 118, borderRadius: "50%", background: `radial-gradient(ellipse, ${pal.secondary}88, ${pal.primary}55 43%, transparent 72%)`, transform: "rotateX(62deg)", filter: "blur(1px)" }} />
    {children}
  </div>
);

const BoxOpen: React.FC<{ p: PackagingRevealProps; pal: Palette; colors: string[] }> = ({ p, pal, colors }) => {
  const frame = useCurrentFrame();
  const open = clampInterp(frame, [16, 56], [0, 1]);
  return <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 120 }}>
    <Headline p={p} pal={pal} eyebrow="UNBOX / 01" />
    <Stage pal={pal} grid><div style={{ position: "relative", transform: `translateY(${interpolate(open, [0, 1], [80, 0])}px)` }}>
      <div style={{ position: "absolute", left: 0, top: -95, width: 270, height: 108, borderRadius: "18px 18px 5px 5px", background: `linear-gradient(135deg, ${colors[1]}, ${colors[0]})`, border: `2px solid ${pal.text}55`, transformOrigin: "bottom center", transform: `rotateX(${interpolate(open, [0, 1], [0, -70])}deg) translateY(${interpolate(open, [0, 1], [0, -22])}px)`, boxShadow: "0 20px 25px #0007" }} />
      <PackageShape p={p} pal={pal} colors={colors} material="paper" />
      <div style={{ position: "absolute", left: 42, right: 42, top: 26, height: 2, background: pal.text, opacity: .4 }} />
      <div style={{ position: "absolute", left: 52, right: 52, top: -62, height: 190, borderRadius: 25, background: `linear-gradient(160deg, ${colors[2]}aa, transparent)`, opacity: open, transform: `scaleY(${open})`, transformOrigin: "bottom", filter: "blur(14px)" }} />
    </div></Stage>
  </AbsoluteFill>;
};

const LabelPeel: React.FC<{ p: PackagingRevealProps; pal: Palette; colors: string[] }> = ({ p, pal, colors }) => {
  const frame = useCurrentFrame();
  const peel = clampInterp(frame, [12, 56], [0, 1]);
  return <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 120 }}>
    <Headline p={p} pal={pal} eyebrow="LABEL STUDY / 02" />
    <Stage pal={pal}><div style={{ position: "relative" }}><PackageShape p={p} pal={pal} colors={colors} showLabel={false} material="matte" />
      <div style={{ position: "absolute", left: 18, right: 18, top: "37%", height: 150, borderRadius: 14, color: pal.bg, background: `${pal.text}eb`, padding: 22, boxSizing: "border-box", font: `900 22px ${FONT}`, transformOrigin: "left center", transform: `perspective(600px) rotateY(${interpolate(peel, [0, 1], [0, -74])}deg) translateX(${interpolate(peel, [0, 1], [0, -16])}px)`, boxShadow: `10px 16px 22px ${pal.bg}66` }}><div style={{ color: colors[2], fontSize: 11, letterSpacing: ".18em" }}>PEEL / REVEAL</div><div style={{ marginTop: 12 }}>{textAt(p.claims, 0, "A considered formula")}</div><div style={{ marginTop: 10, font: `700 12px ${MONO}`, opacity: .6 }}>BATCH 002 / 100 ML</div></div>
      <div style={{ position: "absolute", left: 36, right: 36, top: "42%", height: 125, borderRadius: 13, background: `linear-gradient(135deg, ${colors[2]}, ${colors[0]})`, opacity: .88, transform: `translateX(${interpolate(peel, [0, 1], [0, 16])}px)`, display: "flex", alignItems: "center", justifyContent: "center", color: pal.text, font: `900 26px ${FONT}` }}>{textAt(p.labels, 1, "NEW FORMULA")}</div>
    </div></Stage>
  </AbsoluteFill>;
};

const FrontBackPack: React.FC<{ p: PackagingRevealProps; pal: Palette; colors: string[] }> = ({ p, pal, colors }) => {
  const frame = useCurrentFrame();
  const turn = clampInterp(frame, [8, 60], [-20, 20]);
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}><div style={{ position: "absolute", left: 115, top: 112 }}><Headline p={p} pal={pal} eyebrow="FRONT / BACK / 03" compact /></div><Stage pal={pal} grid><div style={{ display: "flex", alignItems: "center", gap: 22, transform: `rotateY(${turn}deg)` }}><PackageShape p={p} pal={pal} colors={colors} index={0} rotateY={-16} material="paper" /><PackageShape p={p} pal={pal} colors={colors} index={1} rotateY={16} material="paper" showLabel={false} /></div></Stage><div style={{ position: "absolute", right: 115, bottom: 94, display: "flex", gap: 10 }}><Badge pal={pal} color={colors[0]}>FRONT</Badge><Badge pal={pal} color={colors[2]}>BACK</Badge></div></AbsoluteFill>;
};

const ShelfLineup: React.FC<{ p: PackagingRevealProps; pal: Palette; colors: string[] }> = ({ p, pal, colors }) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}><div style={{ position: "absolute", left: 105, top: 90 }}><Headline p={p} pal={pal} eyebrow="COLLECTION / 04" compact /></div><div style={{ position: "relative", width: 1250, height: 720, marginTop: 145 }}>{[0, 1, 2, 3].map((i) => <div key={i} style={{ position: "absolute", left: `${13 + i * 25}%`, bottom: 130, transform: `translateY(${clampInterp(frame, [0, 30], [100 * (i % 2 ? -1 : 1), 0])}px) rotate(${(i - 1.5) * 5}deg)`, zIndex: i }}><PackageShape p={p} pal={pal} colors={colors} index={i} scale={i === 1 || i === 2 ? .88 : .7} angle={i * 2 - 3} material={i % 2 ? "gloss" : "paper"} /></div>)}<div style={{ position: "absolute", left: 50, right: 50, bottom: 106, height: 36, borderRadius: 12, background: `linear-gradient(#8993a0, #313743)`, boxShadow: "0 25px 38px #0009" }} /></div><div style={{ position: "absolute", right: 112, bottom: 89, color: `${pal.text}91`, font: `700 15px ${MONO}`, letterSpacing: ".12em" }}>{Math.max(4, p.variants?.length || 4)} FORMATS / ONE FAMILY</div></AbsoluteFill>;
};

const IngredientBadges: React.FC<{ p: PackagingRevealProps; pal: Palette; colors: string[] }> = ({ p, pal, colors }) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 80 }}><Stage pal={pal}><div style={{ transform: `rotateY(${Math.sin(frame * .025) * 12}deg)` }}><PackageShape p={p} pal={pal} colors={colors} material="matte" /></div></Stage><div style={{ width: 490 }}><Headline p={p} pal={pal} eyebrow="FORMULA / 05" compact /><div style={{ marginTop: 32, display: "flex", flexWrap: "wrap", gap: 11 }}>{(p.claims.length ? p.claims : ["Plant based", "Small batch", "No compromise", "Made locally"]).slice(0, 6).map((claim, i) => <Badge key={`${claim}-${i}`} pal={pal} color={colors[i % colors.length]}>{claim}</Badge>)}</div><div style={{ marginTop: 25, color: `${pal.text}77`, font: `600 14px ${MONO}` }}>INGREDIENT INDEX / 0{Math.min(9, Math.max(1, p.claims.length))}</div></div></AbsoluteFill>;
};

const VariantStack: React.FC<{ p: PackagingRevealProps; pal: Palette; colors: string[] }> = ({ p, pal, colors }) => {
  const frame = useCurrentFrame();
  const items = p.variants.length ? p.variants : ["ORIGINAL", "CITRUS", "NIGHT"];
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}><div style={{ position: "absolute", left: 110, top: 105 }}><Headline p={p} pal={pal} eyebrow="VARIANT SYSTEM / 06" /></div><div style={{ position: "relative", width: 1100, height: 650, marginTop: 170 }}>{items.slice(0, 4).map((name, i) => <div key={`${name}-${i}`} style={{ position: "absolute", left: `${13 + i * 24}%`, bottom: 56, transform: `translateY(${clampInterp(frame, [i * 7, i * 7 + 27], [90, 0])}px) rotate(${(i - 1.5) * 7}deg)`, zIndex: i }}><PackageShape p={{ ...p, labels: [name, ...p.labels.slice(1)] }} pal={pal} colors={colors} index={i} scale={i === 1 || i === 2 ? .86 : .68} material={i === 2 ? "metal" : "gloss"} /></div>)}</div><div style={{ position: "absolute", right: 110, bottom: 94, display: "flex", gap: 10 }}>{items.slice(0, 4).map((name, i) => <Badge key={`${name}-${i}`} pal={pal} color={colors[i % colors.length]}>{name}</Badge>)}</div></AbsoluteFill>;
};

const SealReveal: React.FC<{ p: PackagingRevealProps; pal: Palette; colors: string[] }> = ({ p, pal, colors }) => {
  const frame = useCurrentFrame();
  const reveal = spring({ frame: Math.max(0, frame - 15), fps: useVideoConfig().fps, config: { damping: 14, stiffness: 90 } });
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 120 }}><Headline p={p} pal={pal} eyebrow="SEALED / 07" /><div style={{ position: "relative" }}><PackageShape p={p} pal={pal} colors={colors} material="paper" /><div style={{ position: "absolute", left: "50%", top: "50%", width: 112, height: 112, borderRadius: "50%", transform: `translate(-50%, -50%) scale(${interpolate(reveal, [0, 1], [1.6, 1])}) rotate(${interpolate(reveal, [0, 1], [-80, 0])}deg)`, opacity: clampInterp(frame, [0, 18], [0, 1]), background: colors[2], border: `7px double ${pal.text}`, boxShadow: `0 0 35px ${colors[2]}88`, display: "flex", alignItems: "center", justifyContent: "center", color: pal.text, textAlign: "center", font: `900 13px ${MONO}` }}>SEALED<br />WITH CARE</div></div></AbsoluteFill>;
};

const PackageTurn: React.FC<{ p: PackagingRevealProps; pal: Palette; colors: string[] }> = ({ p, pal, colors }) => {
  const frame = useCurrentFrame();
  const turns = (p.speed ?? 1) * frame * 2.2;
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}><div style={{ position: "absolute", left: 110, top: 112 }}><Headline p={p} pal={pal} eyebrow="PACKAGE TURN / 08" /></div><Stage pal={pal} grid><div style={{ transform: `rotateY(${turns}deg) rotateX(${Math.sin(frame * .02) * 5}deg)` }}><PackageShape p={p} pal={pal} colors={colors} material="gloss" /></div></Stage><div style={{ position: "absolute", right: 118, bottom: 98, color: pal.secondary, font: `700 16px ${MONO}` }}>ROTATION / {Math.round(((turns % 360) + 360) % 360)}°</div></AbsoluteFill>;
};

const UnboxingSequence: React.FC<{ p: PackagingRevealProps; pal: Palette; colors: string[] }> = ({ p, pal, colors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = spring({ frame: Math.max(0, frame - 42), fps, config: { damping: 16, stiffness: 90 } });
  const open = clampInterp(frame, [12, 38], [0, 1]);
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}><div style={{ position: "absolute", left: 100, top: 100 }}><Headline p={p} pal={pal} eyebrow="UNBOXING / 09" /></div><div style={{ position: "relative", width: 820, height: 700, marginTop: 160 }}><div style={{ position: "absolute", left: 160, bottom: 60, width: 500, height: 270, borderRadius: 22, background: `linear-gradient(130deg, ${colors[1]}, ${colors[0]})`, border: `2px solid ${pal.text}44`, boxShadow: "0 45px 55px #000a" }} /><div style={{ position: "absolute", left: 160, bottom: 280, width: 500, height: 180, borderRadius: "24px 24px 8px 8px", background: `linear-gradient(130deg, ${colors[0]}, ${colors[2]})`, transformOrigin: "bottom center", transform: `rotateX(${interpolate(open, [0, 1], [0, -68])}deg)`, border: `2px solid ${pal.text}55` }} /><div style={{ position: "absolute", left: 304, bottom: 104, transform: `translateY(${interpolate(rise, [0, 1], [160, 0])}px) scale(${.7 + rise * .3})`, opacity: rise }}><PackageShape p={p} pal={pal} colors={colors} scale={.62} material="paper" /></div><div style={{ position: "absolute", left: 204, bottom: 34, right: 204, height: 3, background: pal.accent, opacity: .65 }} /></div><div style={{ position: "absolute", right: 110, bottom: 95, display: "flex", gap: 10 }}><Badge pal={pal} color={colors[0]}>OPEN</Badge><Badge pal={pal} color={colors[2]}>DISCOVER</Badge></div></AbsoluteFill>;
};

const PackagingLockup: React.FC<{ p: PackagingRevealProps; pal: Palette; colors: string[] }> = ({ p, pal, colors }) => {
  const frame = useCurrentFrame();
  const enter = spring({ frame: Math.max(0, frame - 8), fps: useVideoConfig().fps, config: { damping: 16, stiffness: 90 } });
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 125 }}><div style={{ width: 500, color: pal.text, fontFamily: FONT, opacity: enter, transform: `translateX(${interpolate(enter, [0, 1], [-60, 0])}px)` }}><div style={{ color: pal.accent, fontSize: 15, fontWeight: 900, letterSpacing: ".26em" }}>PACKAGING SYSTEM / 10</div><div style={{ marginTop: 18, fontSize: 66, lineHeight: .95, fontWeight: 900, letterSpacing: "-.06em" }}>{p.productName}</div><div style={{ marginTop: 22, fontSize: 22, lineHeight: 1.35, color: `${pal.text}ae` }}>{p.subtitle}</div><div style={{ marginTop: 34, display: "flex", gap: 11, flexWrap: "wrap" }}>{p.claims.slice(0, 3).map((claim, i) => <Badge key={`${claim}-${i}`} pal={pal} color={colors[i % colors.length]}>{claim}</Badge>)}</div></div><div style={{ transform: `translateY(${interpolate(enter, [0, 1], [120, 0])}px) scale(${.84 + enter * .16})`, opacity: enter }}><PackageShape p={p} pal={pal} colors={colors} material="metal" /></div></AbsoluteFill>;
};

const VARIANTS: Record<PackagingRevealVariant, React.FC<{ p: PackagingRevealProps; pal: Palette; colors: string[] }>> = {
  "box-open": BoxOpen,
  "label-peel": LabelPeel,
  "front-back-pack": FrontBackPack,
  "shelf-lineup": ShelfLineup,
  "ingredient-badges": IngredientBadges,
  "variant-stack": VariantStack,
  "seal-reveal": SealReveal,
  "package-turn": PackageTurn,
  "unboxing-sequence": UnboxingSequence,
  "packaging-lockup": PackagingLockup,
};

export const PackagingRevealsTemplate: React.FC<PackagingRevealProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const colors = colorsFor(props, pal);
  const Variant = VARIANTS[props.variant] ?? BoxOpen;
  const technical = props.variant === "package-turn" || props.variant === "front-back-pack";
  const background = props.background && props.background.startsWith("#") ? props.background : pal.bg;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <AbsoluteFill style={{ backgroundColor: background, overflow: "hidden" }}>
    {technical ? <GridPerspectiveBackground palette={pal} /> : <GradientMeshBackground palette={pal} speed={props.speed ?? .65} blobs={props.variant === "ingredient-badges" ? 3 : 4} />}
    <FadeEdges inFrames={10} outFrames={13}><div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><Variant p={props} pal={pal} colors={colors} /></div></FadeEdges>
  </AbsoluteFill>;
};

const familyCast = (c: React.FC<PackagingRevealProps>) => c as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "packaging-reveals-box-open": familyCast(PackagingRevealsTemplate),
  "packaging-reveals-label-peel": familyCast(PackagingRevealsTemplate),
  "packaging-reveals-front-back-pack": familyCast(PackagingRevealsTemplate),
  "packaging-reveals-shelf-lineup": familyCast(PackagingRevealsTemplate),
  "packaging-reveals-ingredient-badges": familyCast(PackagingRevealsTemplate),
  "packaging-reveals-variant-stack": familyCast(PackagingRevealsTemplate),
  "packaging-reveals-seal-reveal": familyCast(PackagingRevealsTemplate),
  "packaging-reveals-package-turn": familyCast(PackagingRevealsTemplate),
  "packaging-reveals-unboxing-sequence": familyCast(PackagingRevealsTemplate),
  "packaging-reveals-packaging-lockup": familyCast(PackagingRevealsTemplate),
};
