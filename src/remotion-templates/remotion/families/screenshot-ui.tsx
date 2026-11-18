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
  clampInterp,
  resolvePalette,
  seededRand,
  stagger,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: screenshot-ui
 * Ten reusable, asset-free systems for presenting product screenshots and UI
 * evidence. Set imageUrl/secondaryImageUrl to real screenshots when available;
 * the procedural fallback keeps every template renderable out of the box.
 */
type ScreenshotUiVariant =
  | "browser-frame"
  | "app-screenshot"
  | "annotation-callouts"
  | "before-after"
  | "focus-zoom"
  | "cursor-walkthrough"
  | "stacked-screens"
  | "window-chrome"
  | "evidence-spotlight"
  | "ui-flow-map";

export interface ScreenshotUiProps {
  variant: ScreenshotUiVariant;
  title: string;
  subtitle: string;
  paletteName: string;
  imageUrl?: string;
  secondaryImageUrl?: string;
  url?: string;
  callouts?: string[];
  steps?: string[];
  accentLabel?: string;
  cursorLabel?: string;
  metric?: string;
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';

const FallbackScreen: React.FC<{ pal: Palette; compact?: boolean; imageUrl?: string; tone?: "primary" | "secondary" }> = ({ pal, compact = false, imageUrl, tone = "primary" }) => {
  const frame = useCurrentFrame();
  const color = tone === "primary" ? pal.primary : pal.secondary;
  const rows = compact ? 4 : 6;
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: imageUrl ? `url(${imageUrl}) center / cover no-repeat` : `linear-gradient(145deg, ${pal.bg}, ${color}2b 52%, ${pal.bgAlt ?? pal.bg})`, fontFamily: FONT }}>
      {!imageUrl && (
        <>
          <div style={{ position: "absolute", inset: 0, opacity: 0.13, backgroundImage: `linear-gradient(${pal.text} 1px, transparent 1px), linear-gradient(90deg, ${pal.text} 1px, transparent 1px)`, backgroundSize: compact ? "28px 28px" : "44px 44px", transform: `translate(${(frame % 44) * -0.3}px, ${(frame % 30) * -0.25}px)` }} />
          <div style={{ position: "absolute", left: compact ? 18 : 42, right: compact ? 18 : 42, top: compact ? 18 : 36, height: compact ? 24 : 38, display: "flex", alignItems: "center", gap: compact ? 8 : 14 }}>
            <div style={{ width: compact ? 24 : 44, height: compact ? 24 : 44, borderRadius: compact ? 7 : 12, background: color }} />
            <div style={{ width: compact ? 80 : 180, height: compact ? 7 : 12, borderRadius: 20, background: `${pal.text}7a` }} />
            <div style={{ marginLeft: "auto", width: compact ? 42 : 100, height: compact ? 7 : 12, borderRadius: 20, background: `${pal.text}30` }} />
          </div>
          <div style={{ position: "absolute", left: compact ? 18 : 42, top: compact ? 62 : 118, width: compact ? "62%" : "56%", height: compact ? 12 : 24, borderRadius: 9, background: `${pal.text}b0` }} />
          <div style={{ position: "absolute", left: compact ? 18 : 42, top: compact ? 84 : 154, width: compact ? "44%" : "38%", height: compact ? 7 : 13, borderRadius: 9, background: `${pal.text}42` }} />
          <div style={{ position: "absolute", left: compact ? 18 : 42, right: compact ? 18 : 42, top: compact ? 122 : 220, bottom: compact ? 18 : 40, display: "grid", gridTemplateColumns: compact ? "1fr 1fr" : "1.4fr .6fr", gap: compact ? 10 : 20 }}>
            <div style={{ borderRadius: compact ? 10 : 18, background: `linear-gradient(135deg, ${color}bc, ${pal.accent}70)`, boxShadow: `0 16px 35px ${pal.bg}99` }} />
            <div style={{ display: "grid", gridTemplateRows: `repeat(${rows}, 1fr)`, gap: compact ? 7 : 12 }}>
              {Array.from({ length: rows }, (_, i) => <div key={i} style={{ borderRadius: compact ? 6 : 10, background: `${pal.text}${i === 0 ? "28" : "12"}`, border: `1px solid ${pal.text}20` }} />)}
            </div>
          </div>
        </>
      )}
      {imageUrl && <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${pal.bg}00 60%, ${pal.bg}55)` }} />}
    </div>
  );
};

const BrowserBar: React.FC<{ pal: Palette; url?: string; compact?: boolean }> = ({ pal, url = "app.example.com", compact = false }) => (
  <div style={{ height: compact ? 34 : 58, display: "flex", alignItems: "center", gap: compact ? 6 : 10, padding: compact ? "0 12px" : "0 20px", boxSizing: "border-box", background: `${pal.text}16`, borderBottom: `1px solid ${pal.text}28`, fontFamily: FONT }}>
    {["#ff605c", "#ffbd44", "#00ca4e"].map((c) => <span key={c} style={{ width: compact ? 8 : 13, height: compact ? 8 : 13, borderRadius: 20, background: c }} />)}
    <div style={{ marginLeft: compact ? 8 : 18, flex: 1, height: compact ? 20 : 32, borderRadius: compact ? 5 : 8, background: `${pal.bg}99`, color: `${pal.text}8c`, display: "flex", alignItems: "center", padding: compact ? "0 9px" : "0 14px", fontSize: compact ? 10 : 15 }}>{url}</div>
  </div>
);

const BrowserFrame: React.FC<{ pal: Palette; imageUrl?: string; url?: string; compact?: boolean; children?: React.ReactNode }> = ({ pal, imageUrl, url, compact = false, children }) => (
  <div style={{ width: "100%", height: "100%", overflow: "hidden", borderRadius: compact ? 12 : 20, background: pal.bg, border: `1px solid ${pal.text}35`, boxShadow: `0 35px 80px ${pal.bg}cc`, fontFamily: FONT }}>
    <BrowserBar pal={pal} url={url} compact={compact} />
    <div style={{ height: `calc(100% - ${compact ? 34 : 58}px)` }}>{children ?? <FallbackScreen pal={pal} imageUrl={imageUrl} compact={compact} />}</div>
  </div>
);

const Caption: React.FC<{ pal: Palette; title: string; subtitle: string; align?: "left" | "center" }> = ({ pal, title, subtitle, align = "left" }) => {
  const frame = useCurrentFrame();
  return <div style={{ textAlign: align, color: pal.text, fontFamily: FONT, opacity: clampInterp(frame, [4, 22], [0, 1]), transform: `translateY(${clampInterp(frame, [4, 22], [24, 0])}px)` }}>
    <div style={{ color: pal.accent, fontSize: 18, fontWeight: 850, letterSpacing: "0.24em", textTransform: "uppercase" }}>UI EVIDENCE</div>
    <div style={{ marginTop: 12, fontSize: 66, lineHeight: 0.98, fontWeight: 900, letterSpacing: "-0.055em" }}>{title}</div>
    <div style={{ marginTop: 18, color: `${pal.text}ae`, fontSize: 25, lineHeight: 1.32 }}>{subtitle}</div>
  </div>;
};

const Callout: React.FC<{ pal: Palette; label: string; index: number; x: number; y: number; align?: "left" | "right" }> = ({ pal, label, index, x, y, align = "left" }) => {
  const frame = useCurrentFrame();
  const t = clampInterp(frame, [22 + index * 8, 38 + index * 8], [0, 1]);
  return <div style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: 270, color: pal.text, fontFamily: FONT, opacity: t, transform: `translate(${interpolate(t, [0, 1], [align === "left" ? -24 : 24, 0])}px, -50%)`, textAlign: align }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: align === "left" ? "flex-start" : "flex-end", gap: 10 }}>
      {align === "right" && <span style={{ width: 52, height: 1, background: pal.accent }} />}
      <span style={{ width: 30, height: 30, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 99, background: pal.accent, color: pal.bg, font: `900 14px ${MONO}`, boxShadow: `0 0 0 6px ${pal.accent}25` }}>{String(index + 1).padStart(2, "0")}</span>
      {align === "left" && <span style={{ width: 52, height: 1, background: pal.accent }} />}
    </div>
    <div style={{ marginTop: 10, padding: "11px 13px", borderRadius: 10, background: `${pal.bg}dd`, border: `1px solid ${pal.accent}66`, fontSize: 17, fontWeight: 750, lineHeight: 1.2 }}>{label}</div>
  </div>;
};

const Cursor: React.FC<{ pal: Palette; x: number; y: number; label?: string }> = ({ pal, x, y, label }) => (
  <div style={{ position: "absolute", left: `${x}%`, top: `${y}%`, zIndex: 4, color: pal.bg, transform: "rotate(-18deg)", filter: `drop-shadow(0 5px 6px ${pal.bg}aa)` }}>
    <svg width="32" height="42" viewBox="0 0 32 42"><path d="M3 2l2 34 9-8 7 12 5-3-7-12 12-1z" fill={pal.text} stroke={pal.bg} strokeWidth="2" /></svg>
    {label && <span style={{ position: "absolute", left: 24, top: 27, whiteSpace: "nowrap", padding: "6px 9px", borderRadius: 6, background: pal.accent, color: pal.bg, font: `800 13px ${FONT}` }}>{label}</span>}
  </div>
);

const BrowserFrameVariant: React.FC<{ p: ScreenshotUiProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const lift = clampInterp(frame, [4, 25], [90, 0]);
  return <AbsoluteFill style={{ padding: "96px 110px", boxSizing: "border-box", display: "flex", gap: 70, alignItems: "center" }}>
    <div style={{ width: "35%", transform: `translateY(${lift}px)` }}><Caption pal={pal} title={p.title} subtitle={p.subtitle} /><div style={{ marginTop: 35, color: `${pal.text}7d`, font: `15px ${MONO}` }}>{p.url ?? "https://app.example.com"}</div></div>
    <div style={{ flex: 1, height: 680, transform: `translateY(${lift}px) scale(${interpolate(frame, [0, 25], [.92, 1])})` }}><BrowserFrame pal={pal} imageUrl={p.imageUrl} url={p.url} /></div>
  </AbsoluteFill>;
};

const AppScreenshotVariant: React.FC<{ p: ScreenshotUiProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 16, stiffness: 100 } });
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 100, padding: 100, boxSizing: "border-box" }}>
    <div style={{ width: 560 }}><Caption pal={pal} title={p.title} subtitle={p.subtitle} /><div style={{ display: "flex", gap: 12, marginTop: 34 }}>{(p.steps ?? ["Open", "Explore", "Share"]).slice(0, 3).map((s, i) => <span key={s} style={{ padding: "10px 14px", borderRadius: 99, background: `${pal.text}12`, border: `1px solid ${pal.text}26`, color: pal.text, font: `650 16px ${FONT}`, opacity: clampInterp(frame, [28 + i * 7, 40 + i * 7], [0, 1]) }}>{s}</span>)}</div></div>
    <div style={{ width: 360, height: 700, padding: 12, boxSizing: "border-box", borderRadius: 52, background: "linear-gradient(135deg,#aeb5c0,#15181e 45%,#707783)", boxShadow: `0 45px 90px ${pal.bg}dd`, transform: `translateY(${interpolate(enter, [0, 1], [180, 0])}px) rotate(${interpolate(enter, [0, 1], [8, 0])}deg) scale(${interpolate(enter, [0, 1], [.74, 1])})` }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 41, overflow: "hidden", background: pal.bg, border: "2px solid #050608" }}><div style={{ position: "absolute", zIndex: 2, top: 10, left: "50%", transform: "translateX(-50%)", width: 94, height: 23, borderRadius: 20, background: "#050608" }} /><FallbackScreen pal={pal} imageUrl={p.imageUrl} compact /></div>
    </div>
  </AbsoluteFill>;
};

const AnnotationVariant: React.FC<{ p: ScreenshotUiProps; pal: Palette }> = ({ p, pal }) => (
  <AbsoluteFill style={{ padding: "82px 90px", boxSizing: "border-box" }}>
    <div style={{ position: "absolute", left: 92, top: 65, width: 480 }}><Caption pal={pal} title={p.title} subtitle={p.subtitle} /></div>
    <div style={{ position: "absolute", left: 475, top: 190, width: 1010, height: 650 }}><BrowserFrame pal={pal} imageUrl={p.imageUrl} url={p.url} /></div>
    {(p.callouts ?? ["Primary action", "Live status", "Context menu"]).slice(0, 3).map((label, i) => <Callout key={label} pal={pal} label={label} index={i} x={[11, 80, 79][i]} y={[46, 42, 76][i]} align={i === 0 ? "left" : "right"} />)}
    <svg width="1920" height="1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}><path d="M330 505L490 505M1540 450L1370 450M1535 815L1320 750" fill="none" stroke={pal.accent} strokeWidth="2" strokeDasharray="7 8" opacity={clampInterp(useCurrentFrame(), [18, 40], [0, 0.8])} /></svg>
  </AbsoluteFill>
);

const BeforeAfterVariant: React.FC<{ p: ScreenshotUiProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const split = clampInterp(frame, [16, 52], [50, 67]);
  return <AbsoluteFill style={{ overflow: "hidden", fontFamily: FONT }}>
    <div style={{ position: "absolute", inset: 0, background: pal.bg }} />
    <div style={{ position: "absolute", inset: 0, right: `${100 - split}%`, overflow: "hidden", background: `linear-gradient(145deg, ${pal.bg}, ${pal.primary}42)` }}><div style={{ width: 1920, height: 1080, padding: "120px 120px", boxSizing: "border-box", filter: "grayscale(.8)" }}><FallbackScreen pal={{ ...pal, primary: "#727784", secondary: "#989da8", accent: "#b7bac1" }} imageUrl={p.imageUrl} /></div></div>
    <div style={{ position: "absolute", left: `${split}%`, right: 0, top: 0, bottom: 0, overflow: "hidden", background: `linear-gradient(145deg, ${pal.accent}40, ${pal.bg})` }}><div style={{ width: 1920, height: 1080, padding: "120px 120px", boxSizing: "border-box" }}><FallbackScreen pal={pal} imageUrl={p.secondaryImageUrl ?? p.imageUrl} /></div></div>
    <div style={{ position: "absolute", left: 100, top: 70, color: `${pal.text}9a`, font: `900 21px ${FONT}`, letterSpacing: ".2em" }}>BEFORE</div><div style={{ position: "absolute", right: 100, top: 70, color: pal.accent, font: `900 21px ${FONT}`, letterSpacing: ".2em" }}>AFTER</div>
    <div style={{ position: "absolute", left: 100, bottom: 65, width: 760 }}><Caption pal={pal} title={p.title} subtitle={p.subtitle} /></div><div style={{ position: "absolute", right: 90, bottom: 85, padding: "14px 20px", borderRadius: 12, color: pal.bg, background: pal.accent, font: `900 18px ${MONO}` }}>{p.metric ?? "+42% clarity"}</div>
    <div style={{ position: "absolute", top: 0, bottom: 0, left: `${split}%`, width: 3, background: pal.text, boxShadow: `0 0 0 1px ${pal.bg}88` }} />
  </AbsoluteFill>;
};

const FocusZoomVariant: React.FC<{ p: ScreenshotUiProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const scale = clampInterp(frame, [14, 68], [1, 2.05]);
  const x = clampInterp(frame, [14, 68], [0, -190]);
  const y = clampInterp(frame, [14, 68], [0, -80]);
  return <AbsoluteFill style={{ padding: "72px 100px", boxSizing: "border-box" }}>
    <div style={{ position: "absolute", left: 100, top: 67, width: 520 }}><Caption pal={pal} title={p.title} subtitle={p.subtitle} /></div>
    <div style={{ position: "absolute", left: 410, top: 185, width: 1110, height: 690, borderRadius: 22, overflow: "hidden", background: pal.bg, border: `1px solid ${pal.text}38`, boxShadow: `0 35px 90px ${pal.bg}` }}>
      <div style={{ transform: `translate(${x}px, ${y}px) scale(${scale})`, transformOrigin: "center center", width: "100%", height: "100%" }}><FallbackScreen pal={pal} imageUrl={p.imageUrl} /></div>
      <div style={{ position: "absolute", left: "62%", top: "54%", width: 90, height: 90, borderRadius: "50%", border: `3px solid ${pal.accent}`, boxShadow: `0 0 0 999px ${pal.bg}30`, opacity: clampInterp(frame, [45, 61], [0, 1]) }} />
    </div>
    <div style={{ position: "absolute", right: 100, bottom: 90, padding: "12px 16px", borderRadius: 8, background: `${pal.bg}e8`, border: `1px solid ${pal.accent}72`, color: pal.text, font: `700 15px ${MONO}` }}>FOCUS / DETAIL</div>
  </AbsoluteFill>;
};

const CursorWalkthroughVariant: React.FC<{ p: ScreenshotUiProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const points = [[18, 30], [47, 43], [73, 27], [63, 70]];
  const phase = (frame / 34) % points.length;
  const from = points[Math.floor(phase)]; const to = points[(Math.floor(phase) + 1) % points.length];
  const local = phase % 1;
  const x = interpolate(local, [0, 1], [from[0], to[0]]); const y = interpolate(local, [0, 1], [from[1], to[1]]);
  const steps = p.steps ?? ["Open workspace", "Choose a view", "Adjust filters", "Share result"];
  return <AbsoluteFill style={{ padding: "70px 100px", boxSizing: "border-box" }}>
    <div style={{ position: "absolute", left: 100, top: 64, width: 500 }}><Caption pal={pal} title={p.title} subtitle={p.subtitle} /></div>
    <div style={{ position: "absolute", left: 410, top: 210, width: 1100, height: 660 }}><BrowserFrame pal={pal} imageUrl={p.imageUrl} url={p.url} /></div>
    <Cursor pal={pal} x={x + 21} y={y + 20} label={p.cursorLabel ?? steps[Math.floor(phase) % steps.length]} />
    <div style={{ position: "absolute", left: 112, bottom: 70, display: "flex", gap: 10 }}>{steps.slice(0, 4).map((step, i) => <div key={step} style={{ padding: "10px 13px", borderRadius: 8, background: i === Math.floor(phase) ? pal.accent : `${pal.text}10`, color: i === Math.floor(phase) ? pal.bg : `${pal.text}9d`, font: `700 14px ${FONT}`, border: `1px solid ${i === Math.floor(phase) ? pal.accent : `${pal.text}28`}` }}>{String(i + 1).padStart(2, "0")} {step}</div>)}</div>
  </AbsoluteFill>;
};

const StackedScreensVariant: React.FC<{ p: ScreenshotUiProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const screens = [p.imageUrl, p.secondaryImageUrl, undefined];
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 50, padding: 90, boxSizing: "border-box" }}>
    <div style={{ width: 520 }}><Caption pal={pal} title={p.title} subtitle={p.subtitle} /><div style={{ marginTop: 36, display: "grid", gap: 13 }}>{(p.steps ?? ["Capture", "Review", "Ship"]).slice(0, 3).map((s, i) => <div key={s} style={{ padding: "13px 16px", borderLeft: `4px solid ${[pal.primary, pal.secondary, pal.accent][i]}`, color: pal.text, background: `${pal.text}0d`, font: `700 18px ${FONT}`, opacity: clampInterp(frame, [25 + i * 8, 40 + i * 8], [0, 1]) }}>{s}</div>)}</div></div>
    <div style={{ position: "relative", width: 900, height: 730 }}>
      {screens.map((image, i) => { const t = clampInterp(frame, [8 + i * 9, 28 + i * 9], [0, 1]); return <div key={i} style={{ position: "absolute", left: `${i * 95}px`, top: `${i * 42}px`, width: 760, height: 570, transform: `translate(${interpolate(t, [0, 1], [120 * (2 - i), 0])}px, ${interpolate(t, [0, 1], [80, 0])}px) rotate(${(i - 1) * 4}deg)`, opacity: t, zIndex: 3 - i }}><BrowserFrame pal={pal} imageUrl={image} compact /></div>; })}
    </div>
  </AbsoluteFill>;
};

const WindowChromeVariant: React.FC<{ p: ScreenshotUiProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const windows = [p.imageUrl, p.secondaryImageUrl, undefined];
  return <AbsoluteFill style={{ padding: "82px 100px", boxSizing: "border-box" }}>
    <div style={{ position: "absolute", left: 100, top: 70, width: 470 }}><Caption pal={pal} title={p.title} subtitle={p.subtitle} /></div>
    {windows.map((image, i) => { const t = clampInterp(frame, [i * 10 + 5, i * 10 + 24], [0, 1]); return <div key={i} style={{ position: "absolute", left: 480 + i * 120, top: 230 + i * 70, width: 1010, height: 570, opacity: t, zIndex: 3 - i, transform: `translate(${interpolate(t, [0, 1], [100, 0])}px, ${interpolate(t, [0, 1], [50, 0])}px) rotate(${(i - 1) * 2}deg)` }}><BrowserFrame pal={pal} imageUrl={image} url={i === 0 ? p.url : "settings.example.com"} /></div>; })}
    <div style={{ position: "absolute", left: 110, bottom: 80, color: `${pal.text}6d`, font: `14px ${MONO}`, letterSpacing: ".16em" }}>WINDOWS / CONTEXT / {String(windows.length).padStart(2, "0")}</div>
  </AbsoluteFill>;
};

const EvidenceSpotlightVariant: React.FC<{ p: ScreenshotUiProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const pulse = 0.93 + Math.sin(frame * 0.07) * 0.035;
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: `radial-gradient(circle at 53% 48%, ${pal.primary}42, ${pal.bg} 47%)` }}>
    <div style={{ position: "absolute", left: 120, top: 80, width: 540 }}><Caption pal={pal} title={p.title} subtitle={p.subtitle} /></div>
    <div style={{ position: "relative", width: 940, height: 630, transform: `scale(${pulse})` }}><BrowserFrame pal={pal} imageUrl={p.imageUrl} url={p.url} />
      <div style={{ position: "absolute", left: "50%", top: "50%", width: 240, height: 170, transform: "translate(-50%, -50%)", border: `3px solid ${pal.accent}`, borderRadius: 16, boxShadow: `0 0 0 999px ${pal.bg}58, 0 0 38px ${pal.accent}88` }} />
      <div style={{ position: "absolute", left: "50%", top: "calc(50% + 110px)", transform: "translateX(-50%)", padding: "8px 13px", borderRadius: 99, background: pal.accent, color: pal.bg, font: `800 14px ${FONT}`, whiteSpace: "nowrap" }}>{p.accentLabel ?? "KEY MOMENT"}</div>
    </div>
  </AbsoluteFill>;
};

const UiFlowMapVariant: React.FC<{ p: ScreenshotUiProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const steps = (p.steps ?? ["Sign in", "Choose project", "Review screen", "Publish"]).slice(0, 4);
  return <AbsoluteFill style={{ padding: "86px 100px", boxSizing: "border-box" }}>
    <div style={{ width: 620 }}><Caption pal={pal} title={p.title} subtitle={p.subtitle} /></div>
    <div style={{ position: "absolute", left: 110, right: 110, top: 410, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      {steps.map((step, i) => { const t = clampInterp(frame, stagger(i, steps.length, 18, 80), [0, 1]); return <React.Fragment key={step}><div style={{ width: 250, height: 230, borderRadius: 18, padding: 14, boxSizing: "border-box", background: `${pal.text}0d`, border: `1px solid ${[pal.primary, pal.secondary, pal.accent, pal.primary][i]}88`, opacity: t, transform: `translateY(${interpolate(t, [0, 1], [45, 0])}px)` }}><div style={{ height: 150, borderRadius: 10, overflow: "hidden" }}><FallbackScreen pal={pal} imageUrl={i === 0 ? p.imageUrl : i === 1 ? p.secondaryImageUrl : undefined} compact /></div><div style={{ marginTop: 10, color: pal.text, font: `800 16px ${FONT}` }}>{String(i + 1).padStart(2, "0")} / {step}</div></div>{i < steps.length - 1 && <div style={{ width: 85, height: 2, background: pal.accent, opacity: t, position: "relative" }}><span style={{ position: "absolute", right: -1, top: -5, width: 10, height: 10, borderTop: `2px solid ${pal.accent}`, borderRight: `2px solid ${pal.accent}`, transform: "rotate(45deg)" }} /></div>}</React.Fragment>; })}
    </div>
    <div style={{ position: "absolute", right: 115, bottom: 72, color: `${pal.text}6c`, font: `14px ${MONO}` }}>FLOW / {steps.length} STATES / INTERACTION MAP</div>
  </AbsoluteFill>;
};

const VARIANTS: Record<ScreenshotUiVariant, React.FC<{ p: ScreenshotUiProps; pal: Palette }>> = {
  "browser-frame": BrowserFrameVariant,
  "app-screenshot": AppScreenshotVariant,
  "annotation-callouts": AnnotationVariant,
  "before-after": BeforeAfterVariant,
  "focus-zoom": FocusZoomVariant,
  "cursor-walkthrough": CursorWalkthroughVariant,
  "stacked-screens": StackedScreensVariant,
  "window-chrome": WindowChromeVariant,
  "evidence-spotlight": EvidenceSpotlightVariant,
  "ui-flow-map": UiFlowMapVariant,
};

export const ScreenshotUiTemplate: React.FC<ScreenshotUiProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? BrowserFrameVariant;
  const technical = props.variant === "ui-flow-map" || props.variant === "window-chrome";
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <AbsoluteFill style={{ backgroundColor: pal.bg, fontFamily: FONT }}>
    {!technical && <GradientMeshBackground palette={pal} blobs={props.variant === "before-after" ? 3 : 5} speed={0.45} />}
    <FadeEdges inFrames={10} outFrames={14}><div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><Variant p={props} pal={pal} /></div></FadeEdges>
  </AbsoluteFill>;
};

const familyCast = (c: React.FC<ScreenshotUiProps>) => c as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "screenshot-browser-frame": familyCast(ScreenshotUiTemplate),
  "screenshot-app-device": familyCast(ScreenshotUiTemplate),
  "screenshot-annotation-callouts": familyCast(ScreenshotUiTemplate),
  "screenshot-before-after-wipe": familyCast(ScreenshotUiTemplate),
  "screenshot-focus-zoom": familyCast(ScreenshotUiTemplate),
  "screenshot-cursor-walkthrough": familyCast(ScreenshotUiTemplate),
  "screenshot-stacked-screens": familyCast(ScreenshotUiTemplate),
  "screenshot-window-chrome": familyCast(ScreenshotUiTemplate),
  "screenshot-evidence-spotlight": familyCast(ScreenshotUiTemplate),
  "screenshot-ui-flow-map": familyCast(ScreenshotUiTemplate),
};
