import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { ComponentType } from "react";
import { clampInterp, resolvePalette, seededRand, type Palette } from "../lib/primitives";

/**
 * FAMILY: ui-annotations
 * A clean-room set of annotation systems for explaining screenshots and product
 * interfaces. Every variant works with a supplied screenshotUrl, while the
 * procedural interface fallback keeps previews deterministic and asset-free.
 */
export type UiAnnotationsVariant =
  | "arrow-callouts"
  | "bracket-focus"
  | "magnifier-lens"
  | "numbered-steps"
  | "measurement-lines"
  | "tooltip-tour"
  | "spotlight-cutout"
  | "redaction-reveal"
  | "error-highlight"
  | "feature-badges";

export interface UiAnnotationsProps {
  variant: UiAnnotationsVariant;
  title: string;
  subtitle: string;
  paletteName: string;
  screenshotUrl?: string;
  targetRects?: Array<{ x: number; y: number; width: number; height: number }>;
  callouts?: string[];
  stepLabels?: string[];
  lineColor?: string;
  labelPosition?: "left" | "right" | "top" | "bottom";
  fontSize?: number;
  appName?: string;
  accentLabel?: string;
}

type VariantProps = { p: UiAnnotationsProps; pal: Palette };
const SANS = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';

const DEFAULT_CALLOUTS = ["Primary action", "Live status", "Context menu"];
const DEFAULT_STEPS = ["Open workspace", "Choose a view", "Review result", "Share with team"];

const fade = (frame: number, start = 0, end = 18) => clampInterp(frame, [start, end], [0, 1]);
const rise = (frame: number, start = 0, end = 18, distance = 28) => interpolate(fade(frame, start, end), [0, 1], [distance, 0]);
const safeLabel = (value: string | undefined, fallback: string) => value?.trim() || fallback;

const Header: React.FC<{ p: UiAnnotationsProps; pal: Palette; eyebrow?: string }> = ({ p, pal, eyebrow = "UI ANNOTATIONS" }) => {
  const frame = useCurrentFrame();
  const opacity = fade(frame, 3, 22);
  return (
    <div style={{ position: "absolute", left: "7%", top: "7%", width: "36%", maxWidth: "360px", color: pal.text, fontFamily: SANS, opacity, transform: `translateY(${rise(frame, 3, 22)}px)` }}>
      <div style={{ color: pal.accent, font: `800 18px ${MONO}`, letterSpacing: "0.2em" }}>{eyebrow}</div>
      <div style={{ marginTop: 14, fontSize: "clamp(30px, 4.8vw, 50px)", lineHeight: 0.98, fontWeight: 900, letterSpacing: "-0.055em", overflowWrap: "anywhere" }}>{p.title}</div>
      <div style={{ marginTop: 14, color: `${pal.text}a8`, fontSize: "clamp(14px, 2vw, 20px)", lineHeight: 1.28, maxWidth: "100%", overflowWrap: "anywhere" }}>{p.subtitle}</div>
    </div>
  );
};

const ProceduralScreen: React.FC<{ pal: Palette; imageUrl?: string; compact?: boolean; variantSeed?: number }> = ({ pal, imageUrl, compact = false, variantSeed = 1 }) => {
  const frame = useCurrentFrame();
  const pad = compact ? 16 : 30;
  const r = compact ? 11 : 18;
  const rows = compact ? 4 : 6;
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: imageUrl ? `url(${imageUrl}) center / cover no-repeat` : `linear-gradient(145deg, ${pal.bgAlt ?? pal.bg}, ${pal.primary}35 55%, ${pal.bg})`, fontFamily: SANS }}>
      {!imageUrl && <>
        <div style={{ position: "absolute", inset: 0, opacity: 0.12, backgroundImage: `linear-gradient(${pal.text} 1px, transparent 1px), linear-gradient(90deg, ${pal.text} 1px, transparent 1px)`, backgroundSize: compact ? "24px 24px" : "40px 40px", transform: `translate(${-(frame % 40) * 0.25}px, ${-(frame % 32) * 0.2}px)` }} />
        <div style={{ position: "absolute", left: pad, right: pad, top: pad, height: compact ? 24 : 34, display: "flex", alignItems: "center", gap: compact ? 8 : 12 }}>
          <div style={{ width: compact ? 24 : 38, height: compact ? 24 : 38, borderRadius: compact ? 7 : 11, background: pal.primary }} />
          <div style={{ width: compact ? 74 : 160, height: compact ? 7 : 11, borderRadius: 9, background: `${pal.text}90` }} />
          <div style={{ marginLeft: "auto", width: compact ? 45 : 88, height: compact ? 7 : 11, borderRadius: 9, background: `${pal.text}32` }} />
        </div>
        <div style={{ position: "absolute", left: pad, top: compact ? 58 : 95, width: compact ? "58%" : "52%", height: compact ? 12 : 22, borderRadius: 8, background: `${pal.text}a8` }} />
        <div style={{ position: "absolute", left: pad, top: compact ? 80 : 130, width: compact ? "41%" : "35%", height: compact ? 7 : 12, borderRadius: 8, background: `${pal.text}45` }} />
        <div style={{ position: "absolute", left: pad, right: pad, top: compact ? 112 : 182, bottom: pad, display: "grid", gridTemplateColumns: compact ? "1.35fr .65fr" : "1.4fr .6fr", gap: compact ? 10 : 18 }}>
          <div style={{ borderRadius: r, background: `linear-gradient(135deg, ${pal.primary}c0, ${pal.accent}65)`, boxShadow: `0 20px 42px ${pal.bg}99` }} />
          <div style={{ display: "grid", gridTemplateRows: `repeat(${rows}, 1fr)`, gap: compact ? 6 : 10 }}>
            {Array.from({ length: rows }, (_, i) => <div key={i} style={{ borderRadius: compact ? 6 : 9, background: `${pal.text}${i === 0 ? "35" : "14"}`, border: `1px solid ${pal.text}22` }} />)}
          </div>
        </div>
        {Array.from({ length: 3 }, (_, i) => <div key={`glow-${i}`} style={{ position: "absolute", width: `${22 + seededRand(variantSeed + i) * 28}%`, height: `${18 + seededRand(variantSeed + i + 9) * 18}%`, left: `${15 + i * 27}%`, top: `${18 + (i % 2) * 35}%`, borderRadius: "50%", background: `${[pal.primary, pal.secondary, pal.accent][i]}20`, filter: "blur(26px)" }} />)}
      </>}
      {imageUrl && <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, transparent 55%, ${pal.bg}66)` }} />}
    </div>
  );
};

const ScreenFrame: React.FC<{ pal: Palette; p: UiAnnotationsProps; x?: string | number; y?: string | number; width?: string | number; height?: string | number; compact?: boolean; rotate?: number }> = ({ pal, p, x = "43%", y = "22%", width = "49%", height = "62%", compact = false, rotate = 0 }) => (
  <div style={{ position: "absolute", left: x, top: y, width, height, overflow: "hidden", borderRadius: compact ? 13 : 20, border: `1px solid ${pal.text}46`, background: pal.bg, boxShadow: `0 28px 72px ${pal.bg}cc`, transform: `rotate(${rotate}deg)` }}>
    <div style={{ height: compact ? 25 : 38, display: "flex", alignItems: "center", gap: 7, padding: "0 12px", boxSizing: "border-box", background: `${pal.text}19`, borderBottom: `1px solid ${pal.text}2f` }}>
      {['#ff605c', '#ffbd44', '#00ca4e'].map((c) => <span key={c} style={{ width: compact ? 7 : 9, height: compact ? 7 : 9, borderRadius: 99, background: c }} />)}
      <span style={{ marginLeft: 8, flex: 1, height: compact ? 14 : 20, borderRadius: 6, background: `${pal.bg}b8`, color: `${pal.text}74`, font: `${compact ? 8 : 10}px ${MONO}`, display: "flex", alignItems: "center", padding: "0 8px" }}>{p.appName ?? "app.example.com"}</span>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: compact ? 25 : 38, bottom: 0 }}><ProceduralScreen pal={pal} imageUrl={p.screenshotUrl} compact={compact} variantSeed={p.title.length} /></div>
  </div>
);

const TargetRect: React.FC<{ pal: Palette; rect: { x: number; y: number; width: number; height: number }; color?: string; dashed?: boolean; pulse?: boolean }> = ({ pal, rect, color = pal.accent, dashed = false, pulse = false }) => {
  const frame = useCurrentFrame();
  const scale = pulse ? 1 + Math.sin(frame * 0.12) * 0.025 : 1;
  return <div style={{ position: "absolute", left: `${rect.x}%`, top: `${rect.y}%`, width: `${rect.width}%`, height: `${rect.height}%`, boxSizing: "border-box", border: `${dashed ? 2 : 3}px ${dashed ? "dashed" : "solid"} ${color}`, borderRadius: 9, transform: `scale(${scale})`, boxShadow: pulse ? `0 0 0 7px ${color}25` : undefined }} />;
};

const Arrow: React.FC<{ pal: Palette; from: [number, number]; to: [number, number]; color?: string; delay?: number; dashed?: boolean }> = ({ pal, from, to, color = pal.accent, delay = 0, dashed = false }) => {
  const frame = useCurrentFrame();
  const t = fade(frame, delay, delay + 18);
  const dx = to[0] - from[0]; const dy = to[1] - from[1];
  const len = Math.sqrt(dx * dx + dy * dy); const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  return <div style={{ position: "absolute", left: `${from[0]}%`, top: `${from[1]}%`, width: `${len}%`, height: 2, background: dashed ? `repeating-linear-gradient(90deg, ${color} 0 8px, transparent 8px 14px)` : color, transformOrigin: "left center", transform: `rotate(${angle}deg) scaleX(${t})`, opacity: t }}><span style={{ position: "absolute", right: -1, top: -5, width: 10, height: 10, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}`, transform: "rotate(45deg)" }} /></div>;
};

const Label: React.FC<{ pal: Palette; text: string; x: number; y: number; index?: number; align?: "left" | "right"; delay?: number; color?: string }> = ({ pal, text, x, y, index, align = "left", delay = 0, color = pal.accent }) => {
  const frame = useCurrentFrame(); const t = fade(frame, delay, delay + 16);
  return <div style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: "min(220px, 27vw)", maxWidth: "27%", boxSizing: "border-box", opacity: t, transform: `translateY(${interpolate(t, [0, 1], [16, 0])}px)`, textAlign: align, color: pal.text, fontFamily: SANS }}>
    <div style={{ display: "flex", justifyContent: align === "right" ? "flex-end" : "flex-start", alignItems: "center", gap: 9 }}>
      {align === "right" && <span style={{ width: 34, height: 1, background: color }} />}
      {index !== undefined && <span style={{ width: 26, height: 26, borderRadius: 99, display: "inline-flex", alignItems: "center", justifyContent: "center", background: color, color: pal.bg, font: `900 12px ${MONO}` }}>{String(index).padStart(2, "0")}</span>}
      {align === "left" && <span style={{ width: 34, height: 1, background: color }} />}
    </div>
    <div style={{ marginTop: 8, padding: "9px 11px", borderRadius: 8, background: `${pal.bg}e8`, border: `1px solid ${color}6e`, fontSize: 15, lineHeight: 1.2, fontWeight: 750 }}>{text}</div>
  </div>;
};

const Base: React.FC<VariantProps & { children: React.ReactNode; eyebrow?: string }> = ({ p, pal, children, eyebrow }) => (
  <AbsoluteFill style={{ overflow: "hidden", background: `radial-gradient(circle at 76% 35%, ${pal.primary}22, transparent 37%), ${pal.bg}`, fontFamily: SANS }}>
    <div style={{ position: "absolute", inset: 0, opacity: 0.07, backgroundImage: `linear-gradient(${pal.text} 1px, transparent 1px), linear-gradient(90deg, ${pal.text} 1px, transparent 1px)`, backgroundSize: "80px 80px" }} />
    <Header p={p} pal={pal} eyebrow={eyebrow} />
    {children}
    <div style={{ position: "absolute", right: "7%", bottom: "7%", color: `${pal.text}52`, font: `12px ${MONO}`, letterSpacing: ".14em" }}>ANNOTATE / EXPLAIN / PROVE</div>
  </AbsoluteFill>
);

const ArrowCallouts: React.FC<VariantProps> = ({ p, pal }) => {
  const rects = p.targetRects ?? [{ x: 58, y: 37, width: 12, height: 10 }, { x: 75, y: 57, width: 13, height: 11 }, { x: 52, y: 66, width: 16, height: 9 }];
  const labels = (p.callouts ?? DEFAULT_CALLOUTS).slice(0, 3);
  return <Base p={p} pal={pal}><ScreenFrame pal={pal} p={p} />
    <div style={{ position: "absolute", left: "5.5%", top: "43%", width: "30%", height: "48%", boxSizing: "border-box", borderLeft: `1px solid ${pal.accent}35`, background: `linear-gradient(90deg, ${pal.accent}08, transparent 72%)`, pointerEvents: "none" }} />
    {rects.slice(0, 3).map((r, i) => <React.Fragment key={i}><TargetRect pal={pal} rect={r} color={pal.accent} dashed /><Arrow pal={pal} from={[32, 49 + i * 15]} to={[r.x, r.y + r.height / 2]} delay={12 + i * 7} /><Label pal={pal} text={labels[i] ?? `Feature ${i + 1}`} x={7} y={45 + i * 15} index={i + 1} delay={12 + i * 7} /></React.Fragment>)}
  </Base>;
};

const BracketFocus: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const rect = p.targetRects?.[0] ?? { x: 59, y: 42, width: 22, height: 17 }; const t = fade(frame, 18, 40);
  return <Base p={p} pal={pal}><ScreenFrame pal={pal} p={p} /><TargetRect pal={pal} rect={rect} color={pal.primary} /><div style={{ position: "absolute", left: `${rect.x - 1}%`, top: `${rect.y - 1}%`, width: `${rect.width + 2}%`, height: `${rect.height + 2}%`, opacity: t, transform: `scale(${interpolate(t, [0, 1], [.84, 1])})` }}>
    {["left top", "right top", "left bottom", "right bottom"].map((corner) => { const [x, y] = corner.split(" "); return <div key={corner} style={{ position: "absolute", [y]: 0, [x]: 0, width: 46, height: 46, borderTop: y === "top" ? `4px solid ${pal.accent}` : undefined, borderBottom: y === "bottom" ? `4px solid ${pal.accent}` : undefined, borderLeft: x === "left" ? `4px solid ${pal.accent}` : undefined, borderRight: x === "right" ? `4px solid ${pal.accent}` : undefined }} />; })}
  </div><div style={{ position: "absolute", left: `${rect.x + rect.width + 3}%`, top: `${rect.y + rect.height / 2}%`, color: pal.text, font: `800 16px ${MONO}`, opacity: t }}>FOCUS REGION</div></Base>;
};

const MagnifierLens: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const t = fade(frame, 15, 36); const left = 68 + Math.sin(frame * .025) * 3; const top = 48 + Math.cos(frame * .022) * 2;
  return <Base p={p} pal={pal}><ScreenFrame pal={pal} p={p} /><div style={{ position: "absolute", left: `${left}%`, top: `${top}%`, width: 230, height: 230, transform: "translate(-50%, -50%)", borderRadius: "50%", overflow: "hidden", border: `5px solid ${pal.accent}`, boxShadow: `0 0 0 9px ${pal.bg}aa, 0 22px 50px ${pal.bg}`, opacity: t }}><div style={{ position: "absolute", width: 620, height: 430, left: -190, top: -105, transform: "scale(1.7)", transformOrigin: "center" }}><ProceduralScreen pal={pal} imageUrl={p.screenshotUrl} compact variantSeed={21} /></div></div><Arrow pal={pal} from={[left - 17, top + 18]} to={[left - 5, top + 4]} color={pal.accent} delay={20} /><Label pal={pal} text={safeLabel(p.accentLabel, "Magnified detail")} x={8} y={76} delay={20} /></Base>;
};

const NumberedSteps: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const steps = (p.stepLabels ?? DEFAULT_STEPS).slice(0, 4);
  return <Base p={p} pal={pal} eyebrow="STEP-BY-STEP"><ScreenFrame pal={pal} p={p} width="46%" height="54%" x="47%" y="25%" />
    <div style={{ position: "absolute", left: "6%", top: "42%", width: "36%", height: "49%", boxSizing: "border-box", paddingRight: "2%", borderRight: `1px solid ${pal.accent}35`, display: "flex", flexDirection: "column", gap: 7 }}>
      {steps.map((step, i) => { const t = fade(frame, 12 + i * 9, 27 + i * 9); return <div key={step} style={{ width: "100%", minWidth: 0, opacity: t, transform: `translateY(${interpolate(t, [0, 1], [24, 0])}px)` }}><div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}><div style={{ flex: "0 0 38px", width: 38, height: 38, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: [pal.primary, pal.secondary, pal.accent, pal.primary][i], color: pal.bg, font: `900 15px ${MONO}` }}>{String(i + 1).padStart(2, "0")}</div><div style={{ minWidth: 0, color: pal.text, fontSize: "clamp(14px, 2.1vw, 18px)", lineHeight: 1.14, fontWeight: 800, overflowWrap: "anywhere" }}>{step}</div></div><div style={{ margin: "7px 0 0 48px", width: "calc(100% - 48px)", height: 4, borderRadius: 8, background: `${pal.text}1f`, overflow: "hidden" }}><div style={{ width: `${48 + i * 12}%`, height: "100%", background: pal.accent }} /></div></div>; })}
    </div>
  </Base>;
};

const MeasurementLines: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const t = fade(frame, 10, 28); const color = p.lineColor ?? pal.accent;
  return <Base p={p} pal={pal} eyebrow="MEASURED UI"><ScreenFrame pal={pal} p={p} /><div style={{ position: "absolute", left: "48%", top: "31%", width: "38%", height: "39%", border: `1px solid ${color}66`, opacity: t }} />
    <div style={{ position: "absolute", left: "47%", top: "76%", width: "39%", height: 2, background: color, transform: `scaleX(${t})`, transformOrigin: "left" }} /><div style={{ position: "absolute", left: "47%", top: "75.3%", height: 14, borderLeft: `2px solid ${color}` }} /><div style={{ position: "absolute", left: "86%", top: "75.3%", height: 14, borderLeft: `2px solid ${color}` }} />
    <div style={{ position: "absolute", left: "62%", top: "78%", color, font: `800 14px ${MONO}`, opacity: t }}>640 PX WIDTH</div>
    <div style={{ position: "absolute", left: "89%", top: "42%", height: "28%", width: 2, background: color, transform: `scaleY(${t})`, transformOrigin: "top" }} /><div style={{ position: "absolute", left: "88.3%", top: "42%", width: 14, borderTop: `2px solid ${color}` }} /><div style={{ position: "absolute", left: "88.3%", top: "70%", width: 14, borderTop: `2px solid ${color}` }} /><div style={{ position: "absolute", left: "89.8%", top: "54%", color, font: `800 14px ${MONO}`, writingMode: "vertical-rl", opacity: t }}>420 PX</div>
    <Label pal={pal} text={safeLabel(p.accentLabel, "Spacing system") } x={8} y={80} delay={24} color={color} /></Base>;
};

const TooltipTour: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const labels = (p.callouts ?? DEFAULT_CALLOUTS).slice(0, 3); const active = Math.floor(frame / 35) % labels.length; const t = fade(frame, 8 + active * 2, 24 + active * 2);
  const positions = [[60, 35], [74, 56], [55, 68]];
  return <Base p={p} pal={pal} eyebrow="GUIDED TOUR"><ScreenFrame pal={pal} p={p} />{positions.map((pos, i) => <React.Fragment key={i}><TargetRect pal={pal} rect={{ x: pos[0], y: pos[1], width: 9, height: 7 }} color={i === active ? pal.accent : `${pal.text}35`} pulse={i === active} /><div style={{ position: "absolute", left: `${pos[0] - 5}%`, top: `${pos[1] - 17}%`, width: 200, padding: "12px 14px", borderRadius: 11, background: pal.accent, color: pal.bg, font: `750 15px ${SANS}`, opacity: i === active ? t : 0.22, transform: `translateY(${i === active ? interpolate(t, [0, 1], [13, 0]) : 0}px)` }}>{labels[i] ?? `Step ${i + 1}`}<span style={{ position: "absolute", left: "45%", bottom: -8, width: 16, height: 16, background: pal.accent, transform: "rotate(45deg)" }} /></div></React.Fragment>)}</Base>;
};

const SpotlightCutout: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const rect = p.targetRects?.[0] ?? { x: 62, y: 42, width: 18, height: 13 }; const t = fade(frame, 12, 30); const glow = 0.92 + Math.sin(frame * .09) * .04;
  return <Base p={p} pal={pal}><ScreenFrame pal={pal} p={p} /><div style={{ position: "absolute", left: `${rect.x}%`, top: `${rect.y}%`, width: `${rect.width}%`, height: `${rect.height}%`, borderRadius: 12, boxShadow: `0 0 0 999px ${pal.bg}b8, 0 0 0 4px ${pal.accent}, 0 0 42px ${pal.accent}`, opacity: t, transform: `scale(${glow})` }} /><Label pal={pal} text={safeLabel(p.accentLabel, "Look here")} x={8} y={78} delay={24} /></Base>;
};

const RedactionReveal: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const t = fade(frame, 14, 40); const lines = (p.callouts ?? ["Revenue impact", "Activation rate", "Customer signal"]).slice(0, 3);
  return <Base p={p} pal={pal} eyebrow="REVEAL / PROOF"><div style={{ position: "absolute", left: "47%", top: "27%", width: "43%", height: "50%", padding: 34, boxSizing: "border-box", borderRadius: 20, background: `${pal.text}0b`, border: `1px solid ${pal.text}35` }}><div style={{ color: pal.text, font: `850 27px ${SANS}` }}>{p.appName ?? "Product evidence"}</div>{lines.map((line, i) => { const progress = clampInterp(frame, [18 + i * 10, 42 + i * 10], [0, 1]); return <div key={line} style={{ position: "relative", marginTop: 32, height: 38, borderBottom: `1px solid ${pal.text}20`, color: pal.text, font: `700 19px ${SANS}` }}><span style={{ opacity: t }}>{line}</span><span style={{ position: "absolute", left: 0, top: 0, width: `${(1 - progress) * 100}%`, height: 25, background: pal.text, mixBlendMode: "screen" }} /><span style={{ position: "absolute", right: 0, top: 0, color: pal.accent, font: `800 18px ${MONO}`, opacity: progress }}>VERIFIED</span></div>; })}</div><Label pal={pal} text={safeLabel(p.accentLabel, "Evidence unlocked")} x={8} y={78} delay={32} /></Base>;
};

const ErrorHighlight: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const rect = p.targetRects?.[0] ?? { x: 56, y: 49, width: 22, height: 12 }; const t = fade(frame, 8, 25); const pulse = 1 + Math.sin(frame * .22) * .035; const error = p.lineColor ?? "#ff4d67";
  return <Base p={p} pal={pal} eyebrow="DEBUG / EXPLAIN"><ScreenFrame pal={pal} p={p} /><TargetRect pal={{ ...pal, accent: error }} rect={rect} color={error} pulse /><div style={{ position: "absolute", left: `${rect.x}%`, top: `${rect.y + rect.height + 2}%`, padding: "10px 14px", borderRadius: 9, background: error, color: "#fff", font: `800 14px ${MONO}`, opacity: t, transform: `scale(${pulse})` }}>! {safeLabel(p.accentLabel, "Needs attention")}</div><Arrow pal={{ ...pal, accent: error }} from={[rect.x + rect.width / 2, rect.y + rect.height + 9]} to={[rect.x + rect.width / 2, rect.y + rect.height]} color={error} delay={10} /><Label pal={{ ...pal, accent: error }} text={safeLabel(p.callouts?.[0], "Resolve this state")} x={8} y={78} delay={20} color={error} /></Base>;
};

const FeatureBadges: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const badges = (p.callouts ?? ["Fast setup", "Live sync", "Team-ready"]).slice(0, 3); const positions = [[52, 34], [75, 48], [53, 68]];
  return <Base p={p} pal={pal} eyebrow="FEATURE MAP"><ScreenFrame pal={pal} p={p} />{badges.map((badge, i) => { const t = fade(frame, 12 + i * 10, 29 + i * 10); return <React.Fragment key={badge}><div style={{ position: "absolute", left: `${positions[i][0]}%`, top: `${positions[i][1]}%`, width: 118, height: 40, borderRadius: 99, border: `1px solid ${[pal.primary, pal.secondary, pal.accent][i]}99`, background: `${pal.bg}ee`, color: pal.text, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, font: `800 13px ${SANS}`, opacity: t, transform: `translateY(${interpolate(t, [0, 1], [18, 0])}px)` }}><span style={{ width: 8, height: 8, borderRadius: 99, background: [pal.primary, pal.secondary, pal.accent][i] }} />{badge}</div><Arrow pal={pal} from={[positions[i][0] + 4, positions[i][1] + 4]} to={[positions[i][0] + 10, positions[i][1] + 8]} color={[pal.primary, pal.secondary, pal.accent][i]} delay={12 + i * 10} dashed /></React.Fragment>; })}</Base>;
};

const VARIANT_COMPONENTS: Record<UiAnnotationsVariant, ComponentType<VariantProps>> = {
  "arrow-callouts": ArrowCallouts,
  "bracket-focus": BracketFocus,
  "magnifier-lens": MagnifierLens,
  "numbered-steps": NumberedSteps,
  "measurement-lines": MeasurementLines,
  "tooltip-tour": TooltipTour,
  "spotlight-cutout": SpotlightCutout,
  "redaction-reveal": RedactionReveal,
  "error-highlight": ErrorHighlight,
  "feature-badges": FeatureBadges,
};

const UiAnnotations: React.FC<UiAnnotationsProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Component = VARIANT_COMPONENTS[props.variant] ?? ArrowCallouts;
  return <Component p={props} pal={pal} />;
};

const familyCast = (variant: UiAnnotationsVariant): ComponentType<Record<string, unknown>> => (props) => (
  <UiAnnotations {...(props as unknown as UiAnnotationsProps)} variant={variant} />
);

export const FAMILY_COMPONENTS: Record<string, ComponentType<Record<string, unknown>>> = {
  "ui-annotations-arrow-callouts": familyCast("arrow-callouts"),
  "ui-annotations-bracket-focus": familyCast("bracket-focus"),
  "ui-annotations-magnifier-lens": familyCast("magnifier-lens"),
  "ui-annotations-numbered-steps": familyCast("numbered-steps"),
  "ui-annotations-measurement-lines": familyCast("measurement-lines"),
  "ui-annotations-tooltip-tour": familyCast("tooltip-tour"),
  "ui-annotations-spotlight-cutout": familyCast("spotlight-cutout"),
  "ui-annotations-redaction-reveal": familyCast("redaction-reveal"),
  "ui-annotations-error-highlight": familyCast("error-highlight"),
  "ui-annotations-feature-badges": familyCast("feature-badges"),
};
