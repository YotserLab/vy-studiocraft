import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  clampInterp,
  easeInOutQuint,
  easeOutExpo,
  resolvePalette,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: typography-systems
 * Ten reusable studies for typographic scale, hierarchy, pairing, and lockups.
 * Every treatment is asset-free by default: callers can supply a local/system
 * font family, copy, samples, and colors without changing the composition.
 */
export type TypographySystemVariant =
  | "scale-reveal"
  | "pairing-showcase"
  | "weight-spectrum"
  | "grid-type"
  | "responsive-type"
  | "editorial-type"
  | "mono-sans-pair"
  | "display-body"
  | "type-specimen"
  | "type-lockup";

export interface TypographySystemProps {
  variant: TypographySystemVariant;
  title: string;
  subtitle: string;
  body: string;
  brandName: string;
  fontFamily: string;
  fallbackFonts: string;
  samples: string[];
  weights: number[];
  scale: number;
  paletteName: string;
  accentColor?: string;
  grid?: number;
  showGrid?: boolean;
}

const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", Times, serif';
const MONO = '"SFMono-Regular", Menlo, Consolas, monospace';

const progress = (
  frame: number,
  start: number,
  end: number,
  curve: readonly [number, number, number, number] = easeOutExpo,
): number =>
  interpolate(frame, [start, end], [0, 1], {
    easing: Easing.bezier(...curve),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const fontStack = (p: TypographySystemProps): string =>
  [p.fontFamily, p.fallbackFonts, SANS].filter(Boolean).join(", ");

const safeSamples = (p: TypographySystemProps): string[] =>
  p.samples.length > 0 ? p.samples : ["Aa Bb Cc", "The quick brown fox", "0123456789"];

const safeWeights = (p: TypographySystemProps): number[] =>
  p.weights.length > 0 ? p.weights : [300, 400, 500, 700, 900];

const Background: React.FC<{ pal: Palette; p: TypographySystemProps; quiet?: boolean }> = ({ pal, p, quiet = false }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const drift = clampInterp(frame, [0, durationInFrames], [0, 1]);
  const accent = p.accentColor || pal.accent;
  const grid = Math.max(4, p.grid ?? 8);
  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", color: pal.text }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${22 + drift * 7}% ${24 - drift * 3}%, ${pal.primary}${quiet ? "12" : "24"}, transparent 42%), radial-gradient(circle at ${80 - drift * 5}% ${76 + drift * 2}%, ${accent}${quiet ? "08" : "18"}, transparent 40%)`,
        }}
      />
      {p.showGrid !== false && (
        <AbsoluteFill
          style={{
            opacity: quiet ? 0.11 : 0.2,
            backgroundImage: `linear-gradient(${pal.text}18 1px, transparent 1px), linear-gradient(90deg, ${pal.text}18 1px, transparent 1px)`,
            backgroundSize: `${grid}% ${grid}%`,
            maskImage: "linear-gradient(to bottom, black, transparent 82%)",
          }}
        />
      )}
      <div style={{ position: "absolute", left: "5%", right: "5%", top: "6%", height: 1, background: `${accent}80`, transform: `scaleX(${progress(frame, 0, 35)})`, transformOrigin: "left" }} />
      <div style={{ position: "absolute", bottom: "5%", left: "5%", fontFamily: MONO, fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: `${pal.secondary}aa` }}>{p.brandName}</div>
      <div style={{ position: "absolute", bottom: "5%", right: "5%", fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", color: `${pal.secondary}88` }}>{String(Math.round(drift * 100)).padStart(3, "0")} / TYPE SYSTEM</div>
    </AbsoluteFill>
  );
};

const Header: React.FC<{ p: TypographySystemProps; pal: Palette; label?: string }> = ({ p, pal, label = "Typography system" }) => {
  const frame = useCurrentFrame();
  const inP = progress(frame, 4, 32);
  return (
    <div style={{ position: "absolute", top: "10%", left: "7%", right: "7%", opacity: inP, transform: `translateY(${(1 - inP) * 18}px)` }}>
      <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.3em", textTransform: "uppercase", color: pal.secondary }}>{label}</div>
      <div style={{ marginTop: 13, height: 1, width: "100%", background: `${pal.text}28` }} />
    </div>
  );
};

const ScaleReveal: React.FC<{ p: TypographySystemProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const enter = progress(frame, 8, 48);
  const exit = progress(frame, 122, 154, easeInOutQuint);
  const items = [
    { label: "Display", size: 112, text: p.title },
    { label: "Heading", size: 62, text: p.subtitle },
    { label: "Body", size: 29, text: p.body },
  ];
  return (
    <AbsoluteFill style={{ opacity: 1 - exit }}>
      <Header p={p} pal={pal} label="Scale / 01" />
      <div style={{ position: "absolute", left: "8%", right: "8%", top: "27%" }}>
        {items.map((item, i) => {
          const itemIn = progress(frame, 16 + i * 13, 48 + i * 13);
          const size = Math.min(item.size * p.scale, 132);
          return (
            <div key={item.label} style={{ display: "grid", gridTemplateColumns: "100px 1fr", alignItems: "baseline", gap: 24, borderBottom: `1px solid ${pal.text}25`, padding: "13px 0", opacity: itemIn, transform: `translateX(${(1 - itemIn) * 45}px)` }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: pal.secondary, letterSpacing: "0.14em", textTransform: "uppercase" }}>{item.label}</div>
              <div style={{ color: pal.text, fontFamily: fontStack(p), fontSize: Math.min(size, i === 0 ? 84 : 50), lineHeight: 0.98, letterSpacing: i === 0 ? "-0.055em" : "-0.025em", fontWeight: i === 0 ? 700 : 400, minWidth: 0, maxWidth: "100%", whiteSpace: "normal", overflowWrap: "break-word" }}>{item.text}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: "8%", bottom: "13%", fontFamily: MONO, fontSize: 12, color: pal.secondary }}>1.250× / 1.618× / 2.618×</div>
    </AbsoluteFill>
  );
};

const PairingShowcase: React.FC<{ p: TypographySystemProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const inP = progress(frame, 8, 44);
  const bodyIn = progress(frame, 30, 65);
  return (
    <AbsoluteFill>
      <Header p={p} pal={pal} label="Pairing / 02" />
      <div style={{ position: "absolute", inset: "25% 8% 13%", display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: "8%", alignItems: "center" }}>
        <div style={{ opacity: inP, transform: `translateX(${(1 - inP) * -55}px)` }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: pal.accent, marginBottom: 18 }}>Display / {p.fontFamily}</div>
          <div style={{ color: pal.text, fontFamily: fontStack(p), fontSize: Math.min(104 * p.scale, 72), maxWidth: "100%", maxHeight: "46vh", overflow: "hidden", lineHeight: 0.92, letterSpacing: "-0.07em", fontWeight: 800, overflowWrap: "anywhere" }}>{p.title}</div>
          <div style={{ width: 170, height: 5, background: pal.accent, marginTop: 28, transform: `scaleX(${inP})`, transformOrigin: "left" }} />
        </div>
        <div style={{ opacity: bodyIn, transform: `translateY(${(1 - bodyIn) * 30}px)` }}>
          <div style={{ fontFamily: SERIF, fontSize: 38, lineHeight: 1.05, fontStyle: "italic", color: pal.secondary }}>{p.subtitle}</div>
          <p style={{ fontFamily: SANS, fontSize: 21, lineHeight: 1.45, color: `${pal.text}b8`, margin: "24px 0 0", maxWidth: 390 }}>{p.body}</p>
          <div style={{ marginTop: 38, fontFamily: MONO, fontSize: 12, letterSpacing: "0.16em", color: pal.secondary }}>SERIF + {p.fontFamily.toUpperCase()}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const WeightSpectrum: React.FC<{ p: TypographySystemProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const weights = safeWeights(p).slice(0, 7);
  return (
    <AbsoluteFill>
      <Header p={p} pal={pal} label="Weight / 03" />
      <div style={{ position: "absolute", left: "8%", right: "8%", top: "22%", bottom: "17%", overflow: "hidden" }}>
        {weights.map((weight, i) => {
          const inP = progress(frame, 10 + i * 7, 35 + i * 7);
          return (
            <div key={`${weight}-${i}`} style={{ height: 67, display: "grid", gridTemplateColumns: "68px 1fr", gap: 22, alignItems: "center", borderBottom: `1px solid ${pal.text}20`, opacity: inP, transform: `translateX(${(1 - inP) * 28}px)` }}>
              <div style={{ fontFamily: MONO, fontSize: 13, color: pal.secondary }}>{weight}</div>
              <div style={{ color: pal.text, fontFamily: fontStack(p), fontSize: Math.min(47 * p.scale, 38), lineHeight: 1, fontWeight: weight, letterSpacing: "-0.035em", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", right: "8%", top: "26%", fontFamily: MONO, fontSize: 11, color: `${pal.secondary}99`, writingMode: "vertical-rl", letterSpacing: "0.18em" }}>LIGHT → BLACK</div>
    </AbsoluteFill>
  );
};

const GridType: React.FC<{ p: TypographySystemProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const inP = progress(frame, 8, 40);
  const sample = safeSamples(p).slice(0, 6);
  return (
    <AbsoluteFill>
      <Header p={p} pal={pal} label="Grid type / 04" />
      <div style={{ position: "absolute", left: "8%", right: "8%", top: "24%", bottom: "13%", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(2, 1fr)", border: `1px solid ${pal.text}38`, opacity: inP }}>
        {sample.map((text, i) => {
          const cellIn = progress(frame, 12 + i * 8, 35 + i * 8);
          return <div key={`${text}-${i}`} style={{ borderRight: i % 3 !== 2 ? `1px solid ${pal.text}30` : undefined, borderBottom: i < 3 ? `1px solid ${pal.text}30` : undefined, padding: 26, display: "flex", flexDirection: "column", justifyContent: "space-between", opacity: cellIn, transform: `scale(${0.94 + cellIn * 0.06})` }}><span style={{ fontFamily: MONO, fontSize: 11, color: pal.secondary }}>0{i + 1} / 12 COL</span><span style={{ color: pal.text, fontFamily: fontStack(p), fontSize: Math.min(i === 0 ? 43 : 27 + (i % 2) * 8, 40), lineHeight: 1.02, fontWeight: i % 3 === 0 ? 700 : 400, overflowWrap: "anywhere" }}>{text}</span><span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", color: `${pal.secondary}99` }}>BASELINE {i + 1}</span></div>;
        })}
      </div>
    </AbsoluteFill>
  );
};

const ResponsiveType: React.FC<{ p: TypographySystemProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const t = clampInterp(frame, [8, 88], [0, 1]);
  const headline = interpolate(t, [0, 1], [94, 48]);
  const width = interpolate(t, [0, 1], [78, 44]);
  const inP = progress(frame, 6, 36);
  return (
    <AbsoluteFill>
      <Header p={p} pal={pal} label="Responsive type / 05" />
      <div style={{ position: "absolute", left: "11%", top: "27%", width: `${width}%`, opacity: inP }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", color: pal.accent, marginBottom: 15 }}>CLAMP(3.8REM, 9VW, 8.2REM)</div>
        <div style={{ color: pal.text, fontFamily: fontStack(p), fontSize: Math.min(headline * p.scale, 88), lineHeight: 0.92, letterSpacing: "-0.06em", fontWeight: 750, overflowWrap: "anywhere" }}>{p.title}</div>
        <div style={{ marginTop: 28, maxWidth: 540, fontFamily: SANS, fontSize: 21, lineHeight: 1.42, color: `${pal.text}b8`, opacity: 0.55 + t * 0.45 }}>{p.body}</div>
      </div>
      <div style={{ position: "absolute", right: "9%", top: "31%", height: "40%", width: 1, background: `${pal.text}28` }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: pal.accent, position: "absolute", left: -3.5, top: `${t * 100}%` }} /></div>
      <div style={{ position: "absolute", right: "11%", top: "75%", fontFamily: MONO, fontSize: 11, color: pal.secondary }}>DESKTOP 1440 → MOBILE 390</div>
    </AbsoluteFill>
  );
};

const EditorialType: React.FC<{ p: TypographySystemProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const inP = progress(frame, 8, 42);
  const bodyIn = progress(frame, 25, 62);
  return (
    <AbsoluteFill>
      <Header p={p} pal={pal} label="Editorial type / 06" />
      <div style={{ position: "absolute", left: "9%", right: "9%", top: "26%", display: "grid", gridTemplateColumns: "1.35fr .65fr", gap: "7%" }}>
        <div style={{ opacity: inP, transform: `translateY(${(1 - inP) * 22}px)` }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: pal.accent, letterSpacing: "0.25em", textTransform: "uppercase" }}>Issue 04 · Feature</div>
          <div style={{ color: pal.text, fontFamily: SERIF, fontSize: Math.min(86 * p.scale, 76), lineHeight: 0.92, letterSpacing: "-0.045em", marginTop: 21, overflowWrap: "anywhere" }}>{p.title}</div>
          <div style={{ width: "100%", height: 1, background: pal.text, marginTop: 30, opacity: 0.55 }} />
          <div style={{ fontFamily: SERIF, fontSize: 31, lineHeight: 1.12, marginTop: 21, maxWidth: 790, color: pal.secondary }}>{p.subtitle}</div>
        </div>
        <div style={{ alignSelf: "end", opacity: bodyIn, fontFamily: SERIF, fontSize: 19, lineHeight: 1.55, color: `${pal.text}b5` }}><span style={{ fontFamily: fontStack(p), fontSize: 70, lineHeight: 0.6, float: "left", color: pal.accent, margin: "8px 8px 0 0" }}>“</span>{p.body}</div>
      </div>
    </AbsoluteFill>
  );
};

const MonoSansPair: React.FC<{ p: TypographySystemProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const inP = progress(frame, 8, 42);
  return (
    <AbsoluteFill>
      <Header p={p} pal={pal} label="Mono / sans / 07" />
      <div style={{ position: "absolute", left: "9%", right: "9%", top: "24%", bottom: "18%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 44, overflow: "hidden" }}>
        <div style={{ border: `1px solid ${pal.secondary}70`, padding: 24, minHeight: 0, overflow: "hidden", opacity: inP, transform: `translateX(${(1 - inP) * -35}px)` }}>
          <div style={{ fontFamily: MONO, fontSize: 12, color: pal.accent, letterSpacing: "0.2em" }}>MONO / 400</div>
          <div style={{ fontFamily: MONO, fontSize: 37, lineHeight: 1.15, marginTop: 32 }}>{p.brandName}</div>
          <div style={{ fontFamily: MONO, fontSize: 15, lineHeight: 1.42, marginTop: 22, maxHeight: 126, overflow: "hidden", color: `${pal.text}b5` }}>{p.body}</div>
          <div style={{ fontFamily: MONO, fontSize: 12, marginTop: 34, color: pal.secondary }}>--tracking: 0.12em;</div>
        </div>
        <div style={{ padding: 30, opacity: inP, transform: `translateX(${(1 - inP) * 35}px)` }}>
          <div style={{ fontFamily: SANS, fontSize: 12, color: pal.accent, letterSpacing: "0.2em" }}>SANS / 700</div>
          <div style={{ color: pal.text, fontFamily: fontStack(p), fontSize: Math.min(63 * p.scale, 56), fontWeight: 750, letterSpacing: "-0.06em", lineHeight: 0.96, marginTop: 26, overflowWrap: "anywhere" }}>{p.title}</div>
          <div style={{ fontFamily: SANS, fontSize: 19, lineHeight: 1.35, marginTop: 22, maxHeight: 80, overflow: "hidden", color: `${pal.text}c7` }}>{p.subtitle}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const DisplayBody: React.FC<{ p: TypographySystemProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const inP = progress(frame, 8, 46);
  const bodyIn = progress(frame, 28, 70);
  return (
    <AbsoluteFill>
      <Header p={p} pal={pal} label="Display + body / 08" />
      <div style={{ position: "absolute", left: "9%", right: "9%", top: "28%" }}>
        <div style={{ color: pal.text, fontFamily: fontStack(p), fontSize: Math.min(116 * p.scale, 82), lineHeight: 0.9, fontWeight: 800, letterSpacing: "-0.08em", maxWidth: 1120, overflowWrap: "anywhere", opacity: inP, transform: `translateY(${(1 - inP) * 50}px)` }}>{p.title}</div>
        <div style={{ marginTop: 30, display: "flex", alignItems: "flex-start", gap: 28, opacity: bodyIn }}><div style={{ width: 96, height: 4, background: pal.accent, marginTop: 10, flexShrink: 0 }} /><div style={{ maxWidth: 600, maxHeight: 122, overflow: "hidden", fontFamily: SANS, fontSize: 18, lineHeight: 1.4, color: `${pal.text}c2` }}>{p.body}</div></div>
      </div>
    </AbsoluteFill>
  );
};

const TypeSpecimen: React.FC<{ p: TypographySystemProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const inP = progress(frame, 6, 34);
  const samples = safeSamples(p).slice(0, 5);
  return (
    <AbsoluteFill>
      <Header p={p} pal={pal} label="Type specimen / 09" />
      <div style={{ position: "absolute", left: "8%", right: "8%", top: "25%", bottom: "17%", overflow: "hidden" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.18em", color: pal.accent, marginBottom: 20 }}>{p.fontFamily.toUpperCase()} / REGULAR + DISPLAY</div>
        {samples.map((sample, i) => { const rowIn = progress(frame, 10 + i * 9, 34 + i * 9); return <div key={`${sample}-${i}`} style={{ borderTop: `1px solid ${pal.text}28`, padding: "15px 0 18px", display: "flex", justifyContent: "space-between", alignItems: "baseline", opacity: inP * rowIn, transform: `translateX(${(1 - rowIn) * 30}px)` }}><span style={{ color: pal.text, fontFamily: fontStack(p), fontSize: Math.min(37 + i * 8, 62), lineHeight: 1, fontWeight: safeWeights(p)[i % safeWeights(p).length], letterSpacing: i === 0 ? "-0.045em" : "0", minWidth: 0, maxWidth: "75%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sample}</span><span style={{ flexShrink: 0, fontFamily: MONO, fontSize: 11, color: pal.secondary }}>{String(48 + i * 12)}PX / {safeWeights(p)[i % safeWeights(p).length]}</span></div>; })}
      </div>
    </AbsoluteFill>
  );
};

const TypeLockup: React.FC<{ p: TypographySystemProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const inP = progress(frame, 8, 45);
  const detail = progress(frame, 30, 70);
  return (
    <AbsoluteFill>
      <Header p={p} pal={pal} label="Lockup / 10" />
      <div style={{ position: "absolute", inset: "28% 10% 17%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", opacity: inP }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.44em", textTransform: "uppercase", color: pal.accent, marginBottom: 24 }}>{p.subtitle}</div>
        <div style={{ color: pal.text, fontFamily: fontStack(p), fontSize: Math.min(100 * p.scale, 84), lineHeight: 0.88, fontWeight: 800, letterSpacing: "-0.075em", maxWidth: "92%", overflowWrap: "anywhere", transform: `scale(${0.92 + inP * 0.08})` }}>{p.brandName}</div>
        <div style={{ width: 220, height: 1, background: pal.text, margin: "30px 0 22px", transform: `scaleX(${detail})` }} />
        <div style={{ fontFamily: SERIF, fontSize: 26, fontStyle: "italic", color: pal.secondary, opacity: detail }}>{p.title}</div>
        <div style={{ marginTop: 35, fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", color: `${pal.text}88`, opacity: detail }}>A SYSTEM FOR EVERY EXPRESSION</div>
      </div>
    </AbsoluteFill>
  );
};

const VARIANTS: Record<TypographySystemVariant, React.FC<{ p: TypographySystemProps; pal: Palette }>> = {
  "scale-reveal": ScaleReveal,
  "pairing-showcase": PairingShowcase,
  "weight-spectrum": WeightSpectrum,
  "grid-type": GridType,
  "responsive-type": ResponsiveType,
  "editorial-type": EditorialType,
  "mono-sans-pair": MonoSansPair,
  "display-body": DisplayBody,
  "type-specimen": TypeSpecimen,
  "type-lockup": TypeLockup,
};

export const TypographySystemsTemplate: React.FC<TypographySystemProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? ScaleReveal;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return (
    <AbsoluteFill style={{ color: pal.text }}>
      <Background pal={pal} p={props} quiet={props.variant === "type-specimen"} />
      <div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><Variant p={props} pal={pal} /></div>
    </AbsoluteFill>
  );
};

const familyCast = (component: React.FC<TypographySystemProps>) =>
  component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "typography-systems-scale-reveal": familyCast(TypographySystemsTemplate),
  "typography-systems-pairing-showcase": familyCast(TypographySystemsTemplate),
  "typography-systems-weight-spectrum": familyCast(TypographySystemsTemplate),
  "typography-systems-grid-type": familyCast(TypographySystemsTemplate),
  "typography-systems-responsive-type": familyCast(TypographySystemsTemplate),
  "typography-systems-editorial-type": familyCast(TypographySystemsTemplate),
  "typography-systems-mono-sans-pair": familyCast(TypographySystemsTemplate),
  "typography-systems-display-body": familyCast(TypographySystemsTemplate),
  "typography-systems-type-specimen": familyCast(TypographySystemsTemplate),
  "typography-systems-type-lockup": familyCast(TypographySystemsTemplate),
};
