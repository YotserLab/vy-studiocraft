import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, clampInterp, resolvePalette, type Palette } from "../lib/primitives";

type FashionVariant =
  | "lookbook-cover"
  | "look-reveal"
  | "detail-crop"
  | "collection-grid"
  | "material-close"
  | "model-card"
  | "runway-pulse"
  | "price-tag"
  | "season-card"
  | "fashion-close";

export interface FashionEditorialProps {
  variant: FashionVariant;
  imageUrls?: string[];
  lookNames?: string[];
  collection: string;
  season: string;
  designer: string;
  product: string;
  paletteName: string;
  crop?: string;
  accentColor?: string;
  tagline?: string;
  model?: string;
  price?: string;
  currency?: string;
  background?: string;
}

const SANS = 'Inter, "Helvetica Neue", Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

const names = (p: FashionEditorialProps) => p.lookNames?.length ? p.lookNames : ["Look 01", "Look 02", "Look 03", "Look 04", "Look 05", "Look 06"];
const images = (p: FashionEditorialProps) => p.imageUrls ?? [];
const accent = (p: FashionEditorialProps, pal: Palette) => p.accentColor ?? pal.accent;

const Swatch: React.FC<{ pal: Palette; index: number; size?: number }> = ({ pal, index, size = 120 }) => {
  const colors = [pal.primary, pal.secondary, pal.accent, pal.text, "#c9a783", "#25252a"];
  return <div style={{ width: size, height: size, borderRadius: size * 0.16, background: `linear-gradient(145deg, ${colors[index % colors.length]}, ${colors[(index + 2) % colors.length]})`, border: `1px solid ${pal.text}30`, boxShadow: `0 14px 30px ${pal.bg}66` }} />;
};

const ImageOrField: React.FC<{ p: FashionEditorialProps; pal: Palette; index?: number; className?: string; style?: React.CSSProperties }> = ({ p, pal, index = 0, style }) => {
  const src = images(p)[index % Math.max(1, images(p).length)];
  if (src) return <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: p.crop === "contain" ? "contain" : "cover", objectPosition: p.crop && p.crop !== "contain" ? p.crop : "center", display: "block", ...style }} />;
  const angle = 120 + index * 28;
  return <div style={{ width: "100%", height: "100%", background: `linear-gradient(${angle}deg, ${pal.primary}, ${pal.bg} 52%, ${pal.accent}cc)`, position: "relative", overflow: "hidden", ...style }}><div style={{ position: "absolute", inset: "12% 16%", border: `1px solid ${pal.text}35`, transform: `rotate(${index % 2 ? -9 : 7}deg)`, background: `linear-gradient(145deg, ${pal.secondary}22, transparent)` }} /><div style={{ position: "absolute", width: "46%", height: "78%", left: `${28 + (index % 3) * 7}%`, top: "12%", borderRadius: "45% 45% 16% 16%", background: `${pal.text}18`, filter: "blur(2px)" }} /></div>;
};

const FrameLabel: React.FC<{ p: FashionEditorialProps; pal: Palette; right?: boolean }> = ({ p, pal, right }) => <div style={{ display: "flex", justifyContent: right ? "flex-end" : "space-between", alignItems: "center", color: pal.text, fontFamily: MONO, fontSize: 16, letterSpacing: "0.16em", textTransform: "uppercase" }}><span>{p.collection}</span><span>{p.season} · {p.designer}</span></div>;

const Base: React.FC<{ p: FashionEditorialProps; pal: Palette; children: React.ReactNode }> = ({ p, pal, children }) => <AbsoluteFill style={{ overflow: "hidden", background: p.background ?? pal.bg, color: pal.text, fontFamily: SANS }}>{children}</AbsoluteFill>;

const LookbookCover: React.FC<{ p: FashionEditorialProps; pal: Palette }> = ({ p, pal }) => {
  const f = useCurrentFrame(); const reveal = clampInterp(f, [8, 38], [0, 1]);
  return <Base p={p} pal={pal}><div style={{ position: "absolute", inset: "6% 7%", overflow: "hidden" }}><ImageOrField p={p} pal={pal} index={0} style={{ transform: `scale(${1.12 - reveal * 0.12})`, opacity: .92 }} /><div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${pal.bg}22, transparent 35%, ${pal.bg}cc)` }} /></div><div style={{ position: "relative", zIndex: 2, padding: "8% 10%", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }}><FrameLabel p={p} pal={pal} /><div style={{ opacity: reveal, transform: `translateY(${(1 - reveal) * 26}px)` }}><div style={{ fontFamily: SERIF, fontSize: 112, lineHeight: .86, letterSpacing: "-0.06em", textTransform: "uppercase" }}>{p.collection}</div><div style={{ marginTop: 22, fontFamily: MONO, fontSize: 18, letterSpacing: ".2em" }}>{p.tagline ?? "A STUDY IN FORM"}</div></div><div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 15, letterSpacing: ".14em" }}><span>{p.designer}</span><span>LOOKBOOK / {p.season}</span></div></div></Base>;
};

const LookReveal: React.FC<{ p: FashionEditorialProps; pal: Palette }> = ({ p, pal }) => {
  const f = useCurrentFrame(); const i = Math.min(names(p).length - 1, Math.floor(clampInterp(f, [8, 120], [0, names(p).length]))); const local = (f - 8) % 30; const e = clampInterp(local, [0, 14], [0, 1]);
  return <Base p={p} pal={pal}><div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "58% 42%" }}><div style={{ overflow: "hidden" }}><ImageOrField p={p} pal={pal} index={i} style={{ transform: `scale(${1.08 - e * .08})`, opacity: e }} /></div><div style={{ padding: "12% 9%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: `${pal.bg}ee` }}><FrameLabel p={p} pal={pal} /><div><div style={{ color: accent(p, pal), fontFamily: MONO, fontSize: 16, letterSpacing: ".18em" }}>LOOK {String(i + 1).padStart(2, "0")}</div><div style={{ marginTop: 24, fontFamily: SERIF, fontSize: 76, lineHeight: .98 }}>{names(p)[i]}</div><div style={{ marginTop: 30, color: pal.secondary, fontSize: 21, lineHeight: 1.5 }}>{p.product}<br />{p.designer}</div></div><div style={{ fontFamily: MONO, fontSize: 14, color: pal.secondary }}>SCROLL / COLLECTION STUDY</div></div></div></Base>;
};

const DetailCrop: React.FC<{ p: FashionEditorialProps; pal: Palette }> = ({ p, pal }) => { const f = useCurrentFrame(); const z = clampInterp(f, [0, 100], [1.28, 1.02]); return <Base p={p} pal={pal}><div style={{ position: "absolute", inset: 0 }}><ImageOrField p={p} pal={pal} index={1} style={{ transform: `scale(${z})`, objectPosition: p.crop ?? "center" }} /><div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${pal.bg}dd, transparent 58%), linear-gradient(0deg, ${pal.bg}bb, transparent 48%)` }} /></div><div style={{ position: "relative", zIndex: 2, height: "100%", padding: "10% 9%", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }}><FrameLabel p={p} pal={pal} /><div><div style={{ color: accent(p, pal), fontFamily: MONO, letterSpacing: ".2em", fontSize: 16 }}>DETAIL / {p.crop ?? "TEXTURE"}</div><div style={{ marginTop: 28, fontFamily: SERIF, fontSize: 88, lineHeight: .94, maxWidth: 700 }}>{p.product}</div></div><div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 15, letterSpacing: ".13em" }}><span>CRAFT / 01</span><span>{p.designer}</span></div></div></Base>; };

const CollectionGrid: React.FC<{ p: FashionEditorialProps; pal: Palette }> = ({ p, pal }) => { const f = useCurrentFrame(); return <Base p={p} pal={pal}><div style={{ padding: "7% 8%", height: "100%", boxSizing: "border-box" }}><FrameLabel p={p} pal={pal} /><div style={{ marginTop: 42, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, height: "82%" }}>{names(p).slice(0, 6).map((name, i) => { const e = clampInterp(f, [8 + i * 5, 24 + i * 5], [0, 1]); return <div key={name + i} style={{ position: "relative", overflow: "hidden", opacity: e, transform: `translateY(${(1 - e) * 22}px)` }}><ImageOrField p={p} pal={pal} index={i} /><div style={{ position: "absolute", inset: "auto 15px 14px", fontFamily: MONO, fontSize: 14, letterSpacing: ".12em", textTransform: "uppercase", textShadow: `0 2px 10px ${pal.bg}` }}>{String(i + 1).padStart(2, "0")} / {name}</div></div>; })}</div></div></Base>; };

const MaterialClose: React.FC<{ p: FashionEditorialProps; pal: Palette }> = ({ p, pal }) => { const f = useCurrentFrame(); const scan = clampInterp(f, [0, 110], [-8, 108]); return <Base p={p} pal={pal}><div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 52% 42%, ${pal.secondary}66, transparent 28%), repeating-linear-gradient(38deg, ${pal.primary} 0 18px, ${pal.bg} 18px 38px, ${pal.accent}88 38px 42px)` }}><div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, transparent ${scan - 15}%, ${pal.text}55 ${scan}%, transparent ${scan + 8}%)`, mixBlendMode: "screen" }} /></div><div style={{ position: "relative", height: "100%", padding: "9% 9%", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }}><FrameLabel p={p} pal={pal} /><div style={{ alignSelf: "flex-end", width: "42%" }}><div style={{ color: accent(p, pal), fontFamily: MONO, fontSize: 16, letterSpacing: ".2em" }}>MATERIAL STUDY</div><div style={{ marginTop: 20, fontFamily: SERIF, fontSize: 64, lineHeight: 1 }}>{p.product}</div><div style={{ marginTop: 25, color: pal.secondary, fontSize: 20, lineHeight: 1.5 }}>{p.tagline ?? "Texture, weight, movement."}</div></div><div style={{ fontFamily: MONO, fontSize: 15 }}>01 — FABRIC / SURFACE / LIGHT</div></div></Base>; };

const ModelCard: React.FC<{ p: FashionEditorialProps; pal: Palette }> = ({ p, pal }) => { const f = useCurrentFrame(); const e = clampInterp(f, [10, 38], [0, 1]); return <Base p={p} pal={pal}><div style={{ padding: "8% 9%", height: "100%", boxSizing: "border-box" }}><FrameLabel p={p} pal={pal} /><div style={{ marginTop: 42, display: "grid", gridTemplateColumns: "55% 45%", height: "78%", alignItems: "center" }}><div style={{ opacity: e, transform: `translateX(${(1 - e) * -30}px)` }}><div style={{ color: accent(p, pal), fontFamily: MONO, fontSize: 16, letterSpacing: ".2em" }}>MODEL / PROFILE</div><div style={{ marginTop: 22, fontFamily: SERIF, fontSize: 96, lineHeight: .9 }}>{p.model ?? "The New Silhouette"}</div><div style={{ marginTop: 30, color: pal.secondary, fontSize: 22 }}>{p.product} · {p.collection}</div></div><div style={{ height: "100%", overflow: "hidden", borderRadius: "50% 50% 0 0" }}><ImageOrField p={p} pal={pal} index={2} /></div></div></div></Base>; };

const RunwayPulse: React.FC<{ p: FashionEditorialProps; pal: Palette }> = ({ p, pal }) => { const f = useCurrentFrame(); const x = ((f * 4) % 140) - 20; return <Base p={p} pal={pal}><div style={{ position: "absolute", inset: 0, background: `linear-gradient(105deg, ${pal.bg}, ${pal.primary} 48%, ${pal.bg})` }}><div style={{ position: "absolute", top: 0, bottom: 0, left: `${x}%`, width: "16%", background: `linear-gradient(90deg, transparent, ${pal.text}35, transparent)`, transform: "skewX(-18deg)" }} /></div><div style={{ position: "relative", height: "100%", padding: "7% 8%", boxSizing: "border-box" }}><FrameLabel p={p} pal={pal} /><div style={{ position: "absolute", inset: "16% 18% 12%", display: "flex", alignItems: "center", justifyContent: "center" }}><ImageOrField p={p} pal={pal} index={3} style={{ width: "52%", height: "100%", clipPath: "polygon(18% 0, 82% 0, 100% 100%, 0 100%)", opacity: .88 }} /></div><div style={{ position: "absolute", left: "8%", bottom: "9%", fontFamily: SERIF, fontSize: 68 }}>{p.collection}</div><div style={{ position: "absolute", right: "8%", bottom: "10%", fontFamily: MONO, fontSize: 15, letterSpacing: ".18em" }}>RUNWAY / {p.season}</div></div></Base>; };

const PriceTag: React.FC<{ p: FashionEditorialProps; pal: Palette }> = ({ p, pal }) => { const f = useCurrentFrame(); const e = clampInterp(f, [14, 40], [0, 1]); return <Base p={p} pal={pal}><div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "58% 42%" }}><div style={{ overflow: "hidden" }}><ImageOrField p={p} pal={pal} index={4} /></div><div style={{ padding: "12% 10%", background: pal.text, color: pal.bg, display: "flex", flexDirection: "column", justifyContent: "space-between", opacity: e }}><div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: ".18em" }}>OBJECT / {p.season}</div><div><div style={{ fontFamily: SERIF, fontSize: 62, lineHeight: 1 }}>{p.product}</div><div style={{ marginTop: 30, fontFamily: MONO, fontSize: 22, letterSpacing: ".08em" }}>{p.currency ?? "$"}{p.price ?? "480"}</div></div><div style={{ fontFamily: SANS, fontSize: 18 }}>{p.designer}<br />{p.collection}</div></div></div></Base>; };

const SeasonCard: React.FC<{ p: FashionEditorialProps; pal: Palette }> = ({ p, pal }) => { const f = useCurrentFrame(); const e = clampInterp(f, [10, 42], [0, 1]); return <Base p={p} pal={pal}><div style={{ position: "absolute", inset: "8% 7%", border: `1px solid ${pal.text}38` }} /><div style={{ position: "relative", height: "100%", padding: "11% 12%", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }}><FrameLabel p={p} pal={pal} /><div style={{ opacity: e, transform: `scale(${.92 + e * .08})` }}><div style={{ fontFamily: MONO, color: accent(p, pal), letterSpacing: ".28em", fontSize: 17 }}>THE COLLECTION</div><div style={{ marginTop: 25, fontFamily: SERIF, fontSize: 132, lineHeight: .8, textTransform: "uppercase", letterSpacing: "-.08em" }}>{p.season}</div><div style={{ marginTop: 28, fontFamily: SANS, fontSize: 24 }}>{p.collection}</div></div><div style={{ display: "flex", alignItems: "center", gap: 18 }}><Swatch pal={pal} index={0} size={38} /><Swatch pal={pal} index={1} size={38} /><Swatch pal={pal} index={2} size={38} /><span style={{ marginLeft: 14, color: pal.secondary, fontFamily: MONO, fontSize: 14 }}>PALETTE / 03</span></div></div></Base>; };

const FashionClose: React.FC<{ p: FashionEditorialProps; pal: Palette }> = ({ p, pal }) => { const f = useCurrentFrame(); const out = clampInterp(f, [0, 70, 120], [0, 1, 0]); const line = clampInterp(f, [65, 100], [0, 1]); return <Base p={p} pal={pal}><div style={{ position: "absolute", inset: 0, opacity: out }}><ImageOrField p={p} pal={pal} index={5} style={{ transform: `scale(${1.1 - out * .1})` }} /><div style={{ position: "absolute", inset: 0, background: `${pal.bg}99` }} /></div><div style={{ position: "relative", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}><div style={{ opacity: Math.max(out, line), transform: `translateY(${(1 - Math.max(out, line)) * 20}px)` }}><div style={{ fontFamily: SERIF, fontSize: 104, lineHeight: .88 }}>{p.designer}</div><div style={{ width: 100, height: 4, margin: "28px auto", background: accent(p, pal), transformOrigin: "center", transform: `scaleX(${line})` }} /><div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: ".2em" }}>{p.collection} · {p.season}</div></div></div></Base>; };

const COMPONENTS: Record<FashionVariant, React.FC<{ p: FashionEditorialProps; pal: Palette }>> = {
  "lookbook-cover": LookbookCover,
  "look-reveal": LookReveal,
  "detail-crop": DetailCrop,
  "collection-grid": CollectionGrid,
  "material-close": MaterialClose,
  "model-card": ModelCard,
  "runway-pulse": RunwayPulse,
  "price-tag": PriceTag,
  "season-card": SeasonCard,
  "fashion-close": FashionClose,
};

export const FashionEditorialTemplate: React.FC<FashionEditorialProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = COMPONENTS[props.variant] ?? LookbookCover;
  return <AbsoluteFill style={{ fontFamily: SANS }}><FadeEdges inFrames={8} outFrames={12}><Variant p={props} pal={pal} /></FadeEdges></AbsoluteFill>;
};

const familyCast = (component: React.FC<FashionEditorialProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;
export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "fashion-editorial-lookbook-cover": familyCast(FashionEditorialTemplate),
  "fashion-editorial-look-reveal": familyCast(FashionEditorialTemplate),
  "fashion-editorial-detail-crop": familyCast(FashionEditorialTemplate),
  "fashion-editorial-collection-grid": familyCast(FashionEditorialTemplate),
  "fashion-editorial-material-close": familyCast(FashionEditorialTemplate),
  "fashion-editorial-model-card": familyCast(FashionEditorialTemplate),
  "fashion-editorial-runway-pulse": familyCast(FashionEditorialTemplate),
  "fashion-editorial-price-tag": familyCast(FashionEditorialTemplate),
  "fashion-editorial-season-card": familyCast(FashionEditorialTemplate),
  "fashion-editorial-fashion-close": familyCast(FashionEditorialTemplate),
};
