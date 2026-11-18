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
  FadeEdges,
  GradientMeshBackground,
  NoiseGrainOverlay,
  clampInterp,
  resolvePalette,
  seededRand,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: scroll-effects
 * Ten reusable viewport choreographies for product tours, editorial motion,
 * engineering demos, social feeds, and explainer sequences. Everything is
 * procedural by default; callers can replace copy, rows, and optional image
 * URLs without changing the motion system.
 */
type ScrollVariant =
  | "page-scroll"
  | "section-snap"
  | "parallax-layers"
  | "horizontal-gallery"
  | "infinite-ticker"
  | "chat-feed"
  | "code-scroll"
  | "document-highlight"
  | "timeline-scroll"
  | "mobile-feed-swipe";

export interface ScrollEffectsProps {
  variant: ScrollVariant;
  headline: string;
  subline: string;
  paletteName: string;
  items?: string[];
  codeLines?: string[];
  imageSrc?: string;
  accentLabel?: string;
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", "SF Mono", Menlo, Consolas, monospace';

const DEFAULT_ITEMS = ["Overview", "Design system", "Built for teams", "Make it yours", "Start today"];
const DEFAULT_CODE = [
  "const motion = createScrollTimeline({",
  "  duration: 420,",
  "  easing: easeInOutQuint,",
  "});",
  "",
  "motion.on(\"progress\", ({ value }) => {",
  "  viewport.style.transform = `translateY(${value}px)`;",
  "});",
  "",
  "export default motion;",
];

function itemsOf(p: ScrollEffectsProps): string[] {
  return (p.items?.length ? p.items : DEFAULT_ITEMS).slice(0, 8);
}

function codeOf(p: ScrollEffectsProps): string[] {
  return (p.codeLines?.length ? p.codeLines : DEFAULT_CODE).slice(0, 18);
}

const Label: React.FC<{ children: React.ReactNode; pal: Palette; color?: string }> = ({ children, pal, color }) => (
  <div style={{ fontFamily: FONT, color: color ?? pal.accent, fontSize: 17, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" }}>{children}</div>
);

const Heading: React.FC<{ p: ScrollEffectsProps; pal: Palette; align?: "left" | "center" }> = ({ p, pal, align = "left" }) => (
  <div style={{ color: pal.text, fontFamily: FONT, textAlign: align, maxWidth: 820 }}>
    <div style={{ fontSize: 68, lineHeight: 0.98, fontWeight: 850, letterSpacing: "-0.055em" }}>{p.headline}</div>
    <div style={{ marginTop: 18, color: `${pal.text}ad`, fontSize: 25, lineHeight: 1.35 }}>{p.subline}</div>
  </div>
);

const Grid: React.FC<{ pal: Palette; opacity?: number }> = ({ pal, opacity = 0.13 }) => (
  <AbsoluteFill style={{ opacity, backgroundImage: `linear-gradient(${pal.text} 1px, transparent 1px), linear-gradient(90deg, ${pal.text} 1px, transparent 1px)`, backgroundSize: "72px 72px", maskImage: "linear-gradient(to bottom, transparent, black 22%, black 78%, transparent)" }} />
);

const BrowserChrome: React.FC<{ pal: Palette; url?: string }> = ({ pal, url = "studio.example/scroll" }) => (
  <div style={{ height: 58, flexShrink: 0, display: "flex", alignItems: "center", gap: 10, padding: "0 19px", background: `${pal.text}12`, borderBottom: `1px solid ${pal.text}20`, fontFamily: FONT }}>
    {[
      ["#ff5f57", "#ffbd2e", "#28c840"],
    ][0].map((c) => <div key={c} style={{ width: 13, height: 13, borderRadius: 99, background: c }} />)}
    <div style={{ marginLeft: 20, flex: 1, height: 29, display: "flex", alignItems: "center", padding: "0 14px", borderRadius: 8, background: `${pal.bg}99`, color: `${pal.text}88`, fontSize: 14 }}>{url}</div>
    <div style={{ color: pal.secondary, fontSize: 18 }}>⋯</div>
  </div>
);

const BrowserFrame: React.FC<{ pal: Palette; children: React.ReactNode; width?: number; height?: number; url?: string; style?: React.CSSProperties }> = ({ pal, children, width = 1180, height = 710, url, style }) => (
  <div style={{ width, height, overflow: "hidden", borderRadius: 22, background: pal.bg, border: `1px solid ${pal.text}25`, boxShadow: `0 38px 100px ${pal.bg}cc`, ...style }}>
    <BrowserChrome pal={pal} url={url} />
    <div style={{ position: "relative", height: height - 58, overflow: "hidden" }}>{children}</div>
  </div>
);

const Pill: React.FC<{ children: React.ReactNode; pal: Palette; filled?: boolean }> = ({ children, pal, filled = false }) => (
  <div style={{ display: "inline-flex", alignItems: "center", padding: "9px 15px", borderRadius: 999, color: filled ? pal.bg : pal.text, background: filled ? pal.accent : `${pal.text}0e`, border: `1px solid ${filled ? pal.accent : `${pal.text}2a`}`, font: `700 15px ${FONT}`, whiteSpace: "nowrap" }}>{children}</div>
);

const SectionMock: React.FC<{ pal: Palette; title: string; index: number; imageSrc?: string }> = ({ pal, title, index, imageSrc }) => (
  <div style={{ minHeight: 360, padding: "42px 56px", boxSizing: "border-box", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center", borderBottom: `1px solid ${pal.text}16` }}>
    <div>
      <div style={{ color: pal.accent, font: `800 16px ${MONO}`, letterSpacing: "0.12em" }}>0{index + 1} / 05</div>
      <div style={{ marginTop: 14, color: pal.text, font: `800 42px ${FONT}`, letterSpacing: "-0.04em" }}>{title}</div>
      <div style={{ marginTop: 16, width: "90%", color: `${pal.text}98`, font: `21px/1.4 ${FONT}` }}>A considered section that moves into view with a measured rhythm and clear visual hierarchy.</div>
      <div style={{ marginTop: 24, display: "flex", gap: 8 }}><Pill pal={pal} filled>Explore</Pill><Pill pal={pal}>Details ↗</Pill></div>
    </div>
    <div style={{ position: "relative", height: 230, overflow: "hidden", borderRadius: 18, background: imageSrc ? `url(${imageSrc}) center/cover` : `linear-gradient(135deg, ${pal.primary}bb, ${pal.secondary}45 46%, ${pal.accent}80)` }}>
      {!imageSrc && <><div style={{ position: "absolute", width: 210, height: 210, top: -78, right: -20, borderRadius: "50%", border: `22px solid ${pal.text}24` }} /><div style={{ position: "absolute", left: 30, right: 30, bottom: 28, height: 4, background: `${pal.text}66` }} /></>}
      <div style={{ position: "absolute", left: 22, top: 20, color: pal.text, font: `700 14px ${MONO}` }}>SCROLL / {String(index + 1).padStart(2, "0")}</div>
    </div>
  </div>
);

// 01 — smooth page scroll through a browser viewport.
const PageScroll: React.FC<{ p: ScrollEffectsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const items = itemsOf(p);
  const travel = clampInterp(frame, [22, durationInFrames - 16], [0, -Math.max(0, items.length * 360 - 650)]);
  return <AbsoluteFill style={{ background: pal.bg, padding: "70px 100px", boxSizing: "border-box" }}>
    <Grid pal={pal} />
    <div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 34 }}>
      <div><Label pal={pal}>01 / smooth page scroll</Label><div style={{ marginTop: 12 }}><Heading p={p} pal={pal} /></div></div>
      <div style={{ color: `${pal.text}99`, font: `700 16px ${MONO}` }}>SCROLL PROGRESS&nbsp;&nbsp; {String(Math.round(clampInterp(frame, [22, durationInFrames - 16], [0, 100]))).padStart(3, "0")} %</div>
    </div>
    <BrowserFrame pal={pal} url={`${p.headline.toLowerCase().replace(/\s+/g, "-")}.com`} style={{ position: "relative", zIndex: 2, margin: "0 auto" }}>
      <div style={{ position: "absolute", inset: 0, background: pal.bg, transform: `translateY(${travel}px)` }}>
        {items.slice(0, 5).map((item, i) => <SectionMock key={`${item}-${i}`} pal={pal} title={item} index={i} imageSrc={p.imageSrc} />)}
      </div>
      <div style={{ position: "absolute", right: 18, top: 24, bottom: 24, width: 4, borderRadius: 9, background: `${pal.text}20` }}><div style={{ width: 4, height: `${Math.max(7, (650 / (items.length * 360)) * 100)}%`, borderRadius: 9, background: pal.accent, transform: `translateY(${clampInterp(frame, [22, durationInFrames - 16], [0, 480])}px)` }} /></div>
    </BrowserFrame>
    <FadeEdges><div /></FadeEdges>
  </AbsoluteFill>;
};

// 02 — snap between full sections with a persistent rail.
const SectionSnap: React.FC<{ p: ScrollEffectsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const items = itemsOf(p).slice(0, 5);
  const step = Math.max(1, Math.floor((durationInFrames - 28) / items.length));
  const active = Math.min(items.length - 1, Math.floor(Math.max(0, frame - 16) / step));
  const local = (frame - 16 - active * step) / Math.max(1, step);
  const settle = spring({ frame: Math.max(0, frame - 16 - active * step), fps, config: { damping: 18, stiffness: 150 } });
  return <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", padding: "90px 120px", boxSizing: "border-box" }}>
    <GradientMeshBackground palette={pal} speed={0.45} blobs={4} /><Grid pal={pal} opacity={0.06} />
    <div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "space-between" }}>
      <div><Label pal={pal}>02 / section snap</Label><div style={{ marginTop: 18 }}><Heading p={p} pal={pal} /></div></div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "end", gap: 9, font: `700 15px ${MONO}`, color: `${pal.text}88` }}>{items.map((item, i) => <div key={item} style={{ color: i === active ? pal.text : `${pal.text}55` }}><span style={{ color: i === active ? pal.accent : `${pal.text}44` }}>0{i + 1}</span>&nbsp; {item.toUpperCase()}</div>)}</div>
    </div>
    <div style={{ position: "absolute", zIndex: 2, left: 120, right: 300, top: 395, bottom: 120, perspective: 1000 }}>
      {items.map((item, i) => {
        const offset = i - active;
        const enter = i === active ? settle : clampInterp(local, [0, 1], [offset < 0 ? -1 : 1, offset < 0 ? -0.2 : 0.2]);
        const isActive = i === active;
        return <div key={item} style={{ position: "absolute", inset: 0, padding: 38, boxSizing: "border-box", overflow: "hidden", borderRadius: 28, border: `1px solid ${isActive ? pal.accent : pal.text}35`, background: `${pal.bg}f2`, transform: `translateY(${offset * 34 + enter * 70}px) scale(${isActive ? interpolate(settle, [0, 1], [0.9, 1]) : 0.88}) rotateX(${offset * -4}deg)`, opacity: isActive ? 1 : 0, boxShadow: isActive ? `0 28px 70px ${pal.bg}99` : "none" }}>
          <div style={{ color: pal.accent, font: `800 14px ${MONO}` }}>SNAP POINT / 0{i + 1}</div><div style={{ marginTop: 18, maxWidth: "68%", color: pal.text, font: `800 50px/1.04 ${FONT}`, letterSpacing: "-0.05em", overflowWrap: "anywhere" }}>{item}</div><div style={{ marginTop: 18, maxWidth: "68%", color: `${pal.text}99`, font: `22px/1.45 ${FONT}` }}>A complete viewport state. Scroll input resolves into a clean, intentional landing rather than stopping halfway between ideas.</div><div style={{ position: "absolute", right: 42, bottom: 38, width: 180, height: 110, borderRadius: 16, background: `linear-gradient(135deg, ${pal.primary}dd, ${pal.secondary}88)` }} /></div>;
      })}
    </div>
    <div style={{ position: "absolute", left: 120, bottom: 70, width: "calc(100% - 240px)", height: 4, background: `${pal.text}1d` }}><div style={{ width: `${((active + local) / Math.max(1, items.length - 1)) * 100}%`, height: 4, background: pal.accent }} /></div>
  </AbsoluteFill>;
};

// 03 — depth-separated parallax layers.
const ParallaxLayers: React.FC<{ p: ScrollEffectsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = clampInterp(frame, [0, durationInFrames], [0, 1]);
  const layers = [
    { speed: 0.15, color: `${pal.primary}35`, size: 900, x: 14, y: 25 },
    { speed: 0.32, color: `${pal.secondary}45`, size: 600, x: 72, y: 48 },
    { speed: 0.55, color: `${pal.accent}62`, size: 330, x: 45, y: 70 },
  ];
  return <AbsoluteFill style={{ background: pal.bg, overflow: "hidden" }}>
    <Grid pal={pal} opacity={0.08} />
    {layers.map((layer, i) => <div key={i} style={{ position: "absolute", left: `${layer.x}%`, top: `${layer.y}%`, width: layer.size, height: layer.size, borderRadius: "50%", background: `radial-gradient(circle, ${layer.color}, transparent 67%)`, transform: `translate(-50%, calc(-50% + ${(progress - 0.5) * layer.speed * -520}px)) rotate(${progress * (i + 1) * 28}deg)` }} />)}
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(120deg, ${pal.bg} 0%, transparent 43%, ${pal.bg}88 100%)` }} />
    <div style={{ position: "relative", zIndex: 2, padding: "112px 130px", display: "flex", justifyContent: "space-between" }}><div><Label pal={pal}>03 / parallax layers</Label><div style={{ marginTop: 20 }}><Heading p={p} pal={pal} /></div></div><div style={{ width: 280, marginTop: 90, color: `${pal.text}88`, font: `16px/1.55 ${MONO}` }}>DEPTH MAP<br /><br />FOREGROUND&nbsp;&nbsp; 1.00<br />MIDGROUND&nbsp;&nbsp;&nbsp; 0.55<br />BACKGROUND&nbsp;&nbsp; 0.15</div></div>
    <div style={{ position: "absolute", left: 130, bottom: 106, right: 130, display: "flex", alignItems: "center", gap: 22 }}><div style={{ flex: 1, height: 1, background: `${pal.text}35` }} /><Pill pal={pal} filled>{p.accentLabel ?? "MOVE THROUGH DEPTH"}</Pill><div style={{ flex: 1, height: 1, background: `${pal.text}35` }} /></div>
    <NoiseGrainOverlay opacity={0.035} />
  </AbsoluteFill>;
};

// 04 — horizontal gallery with a deliberate momentum curve.
const HorizontalGallery: React.FC<{ p: ScrollEffectsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width } = useVideoConfig();
  const items = itemsOf(p);
  const shift = clampInterp(frame, [18, durationInFrames - 18], [0, -(items.length - 1) * 340]);
  return <AbsoluteFill style={{ background: pal.bg, padding: "92px 100px", boxSizing: "border-box", overflow: "hidden" }}>
    <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", position: "relative", zIndex: 2 }}><div><Label pal={pal}>04 / horizontal gallery</Label><div style={{ marginTop: 17 }}><Heading p={p} pal={pal} /></div></div><div style={{ color: `${pal.text}88`, font: `700 15px ${MONO}` }}>DRAG / SWIPE&nbsp;&nbsp; →</div></div>
    <div style={{ position: "absolute", left: 100, right: 0, top: 405, height: 430, overflow: "hidden" }}><div style={{ display: "flex", gap: 24, transform: `translateX(${shift}px)`, paddingLeft: 0 }}>
      {items.map((item, i) => <div key={`${item}-${i}`} style={{ flex: "0 0 316px", height: 410, padding: 23, boxSizing: "border-box", borderRadius: 22, border: `1px solid ${pal.text}${i === Math.round(-shift / 340) ? "78" : "35"}`, background: i % 2 ? `linear-gradient(150deg, ${pal.secondary}66, ${pal.bg})` : `linear-gradient(150deg, ${pal.primary}76, ${pal.bg})`, transform: `translateY(${Math.sin(i * 1.7) * 12}px)`, boxShadow: `0 25px 50px ${pal.bg}99` }}><div style={{ height: 220, borderRadius: 14, background: p.imageSrc ? `url(${p.imageSrc}) center/cover` : `linear-gradient(${125 + i * 13}deg, ${[pal.primary, pal.secondary, pal.accent][i % 3]}f0, ${pal.bg} 88%)`, border: `1px solid ${pal.text}30` }} /><div style={{ marginTop: 20, color: pal.accent, font: `800 14px ${MONO}` }}>FRAME {String(i + 1).padStart(2, "0")}</div><div style={{ marginTop: 8, color: pal.text, font: `800 25px/1.1 ${FONT}`, maxWidth: "100%", overflowWrap: "anywhere" }}>{item}</div><div style={{ marginTop: 8, color: `${pal.text}b0`, font: `16px ${FONT}` }}>Swipe to continue</div></div>)}
    </div></div>
    <div style={{ position: "absolute", left: 100, right: 100, bottom: 82, height: 3, background: `${pal.text}20` }}><div style={{ height: 3, width: `${Math.min(100, Math.max(4, ((-shift + width * 0.06) / Math.max(1, (items.length - 1) * 340)) * 100))}%`, background: pal.accent }} /></div>
  </AbsoluteFill>;
};

// 05 — continuous ticker whose seam is invisible.
const InfiniteTicker: React.FC<{ p: ScrollEffectsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const items = itemsOf(p);
  const text = [...items, ...items].join("     ✦     ");
  const x = -((frame * 4.4) % 1160);
  return <AbsoluteFill style={{ background: pal.bg, justifyContent: "center", overflow: "hidden" }}>
    <GradientMeshBackground palette={pal} speed={0.25} blobs={3} /><Grid pal={pal} opacity={0.05} />
    <div style={{ position: "relative", zIndex: 2 }}><div style={{ textAlign: "center", marginBottom: 54 }}><Label pal={pal}>05 / infinite ticker</Label><div style={{ marginTop: 18 }}><Heading p={p} pal={pal} align="center" /></div></div>
      <div style={{ position: "relative", height: 152, overflow: "hidden", borderTop: `1px solid ${pal.text}33`, borderBottom: `1px solid ${pal.text}33`, background: `${pal.text}08` }}><div style={{ position: "absolute", whiteSpace: "nowrap", left: 0, top: 43, transform: `translateX(${x}px)`, color: pal.text, font: `800 55px ${FONT}`, letterSpacing: "-0.04em" }}>{text}</div><div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `linear-gradient(90deg, ${pal.bg}, transparent 14%, transparent 86%, ${pal.bg})` }} /></div>
      <div style={{ textAlign: "center", marginTop: 32, color: `${pal.text}88`, font: `15px ${MONO}` }}>CONTINUOUS / {String(Math.round((frame / Math.max(1, durationInFrames)) * 360)).padStart(3, "0")}°</div>
    </div>
  </AbsoluteFill>;
};

const ChatBubble: React.FC<{ pal: Palette; text: string; right?: boolean; index: number; visible: number }> = ({ pal, text, right = false, index, visible }) => <div style={{ alignSelf: right ? "end" : "start", maxWidth: "72%", padding: "15px 18px", borderRadius: right ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: right ? pal.primary : `${pal.text}13`, color: pal.text, font: `19px/1.35 ${FONT}`, opacity: clampInterp(visible, [index - 0.8, index], [0, 1]), transform: `translateY(${clampInterp(visible, [index - 0.8, index], [26, 0])}px)` }}>{text}<div style={{ marginTop: 7, textAlign: right ? "right" : "left", color: `${pal.text}66`, font: `11px ${MONO}` }}>{right ? "YOU" : "TEAM"}&nbsp;&nbsp; 09:{String(12 + index).padStart(2, "0")}</div></div>;

// 06 — chat/feed scroll with incoming bubbles.
const ChatFeed: React.FC<{ p: ScrollEffectsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const items = itemsOf(p);
  const visible = clampInterp(frame, [14, durationInFrames - 15], [0, items.length + 1]);
  return <AbsoluteFill style={{ background: pal.bg, padding: "86px 130px", boxSizing: "border-box" }}><Grid pal={pal} opacity={0.06} /><div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "space-between" }}><div><Label pal={pal}>06 / chat feed</Label><div style={{ marginTop: 18 }}><Heading p={p} pal={pal} /></div></div><div style={{ width: 340, marginTop: 44, color: `${pal.text}7a`, font: `16px/1.6 ${MONO}` }}>LIVE THREAD<br /><span style={{ color: pal.accent }}>● CONNECTED</span><br />auto-scroll / enabled</div></div>
    <div style={{ position: "absolute", zIndex: 2, left: 130, right: 130, bottom: 70, height: 500, display: "flex", flexDirection: "column", justifyContent: "end", gap: 14, padding: "25px 30px", boxSizing: "border-box", borderRadius: 25, border: `1px solid ${pal.text}25`, background: `${pal.bg}dd` }}>
      {items.slice(0, 6).map((item, i) => <ChatBubble key={`${item}-${i}`} pal={pal} text={item} index={i} visible={visible} right={i % 3 === 1} />)}
      <div style={{ alignSelf: "start", color: pal.accent, font: `13px ${MONO}`, opacity: clampInterp(visible, [items.length - 0.5, items.length], [0, 1]) }}>● typing…</div>
    </div>
  </AbsoluteFill>;
};

// 07 — code editor scroll with active-line tracking.
const CodeScroll: React.FC<{ p: ScrollEffectsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const lines = codeOf(p);
  const active = Math.min(lines.length - 1, Math.floor(clampInterp(frame, [16, durationInFrames - 16], [0, lines.length - 1])));
  const offset = clampInterp(frame, [16, durationInFrames - 16], [0, -Math.max(0, lines.length * 39 - 350)]);
  return <AbsoluteFill style={{ background: pal.bg, padding: "88px 120px", boxSizing: "border-box" }}><GradientMeshBackground palette={pal} speed={0.3} blobs={2} /><div style={{ position: "relative", zIndex: 2, display: "flex", gap: 70, alignItems: "start" }}><div style={{ width: "32%" }}><Label pal={pal}>07 / code scroll</Label><div style={{ marginTop: 20 }}><Heading p={p} pal={pal} /></div><div style={{ marginTop: 35, color: `${pal.text}78`, font: `15px/1.6 ${MONO}` }}>LINE {String(active + 1).padStart(2, "0")} / {String(lines.length).padStart(2, "0")}<br /><span style={{ color: pal.accent }}>● EXECUTING</span></div></div>
    <div style={{ flex: 1, height: 570, overflow: "hidden", borderRadius: 20, border: `1px solid ${pal.text}2b`, background: "#0b0f14e8", boxShadow: `0 35px 80px ${pal.bg}` }}><div style={{ height: 58, display: "flex", alignItems: "center", gap: 10, padding: "0 22px", borderBottom: `1px solid ${pal.text}20`, color: `${pal.text}65`, font: `14px ${MONO}` }}><span style={{ color: "#ff5f57" }}>●</span><span style={{ color: "#ffbd2e" }}>●</span><span style={{ color: "#28c840" }}>●</span><span style={{ marginLeft: 20 }}>scrollTimeline.ts</span></div><div style={{ position: "relative", height: 512, overflow: "hidden", padding: "42px 0" }}><div style={{ position: "absolute", left: 0, right: 0, top: 42 + active * 39 + offset, height: 39, background: `${pal.accent}18`, borderLeft: `3px solid ${pal.accent}` }} /> <div style={{ position: "absolute", left: 0, right: 0, top: 42 + offset }}>{lines.map((line, i) => <div key={`${line}-${i}`} style={{ height: 39, display: "flex", alignItems: "center", color: i === active ? pal.text : `${pal.text}83`, font: `17px ${MONO}`, whiteSpace: "pre" }}><span style={{ width: 58, textAlign: "right", paddingRight: 20, color: `${pal.text}35`, userSelect: "none" }}>{String(i + 1).padStart(2, "0")}</span><span style={{ color: i === active ? pal.secondary : "inherit" }}>{line || " "}</span></div>)}</div></div></div>
  </div><NoiseGrainOverlay opacity={0.03} /></AbsoluteFill>;
};

// 08 — editorial document with a moving highlight and progress rail.
const DocumentHighlight: React.FC<{ p: ScrollEffectsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const lines = itemsOf(p);
  const active = Math.min(lines.length - 1, Math.floor(clampInterp(frame, [15, durationInFrames - 15], [0, lines.length - 1])));
  return <AbsoluteFill style={{ background: pal.bg, padding: "82px 150px", boxSizing: "border-box" }}><div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "space-between", marginBottom: 38 }}><div><Label pal={pal}>08 / document highlight</Label><div style={{ marginTop: 17 }}><Heading p={p} pal={pal} /></div></div><div style={{ color: `${pal.text}70`, font: `15px ${MONO}`, paddingTop: 13 }}>READING MODE<br /><span style={{ color: pal.accent }}>SECTION {String(active + 1).padStart(2, "0")}</span></div></div>
    <div style={{ position: "relative", zIndex: 2, maxWidth: 1120, margin: "0 auto", height: 570, overflow: "hidden", padding: "32px 70px", boxSizing: "border-box", borderLeft: `1px solid ${pal.text}2c`, borderRight: `1px solid ${pal.text}2c`, background: `${pal.text}05` }}><div style={{ position: "absolute", left: 70, right: 70, top: 32 + active * 71, height: 61, borderRadius: 8, background: `${pal.accent}18`, borderLeft: `3px solid ${pal.accent}`, transition: "none" }} />{lines.map((line, i) => <div key={`${line}-${i}`} style={{ position: "relative", height: 71, display: "flex", alignItems: "center", gap: 28, color: i === active ? pal.text : `${pal.text}65`, font: `${i === 0 ? 700 : 400} 25px/1.3 ${FONT}` }}><span style={{ width: 35, color: i === active ? pal.accent : `${pal.text}38`, font: `14px ${MONO}` }}>{String(i + 1).padStart(2, "0")}</span><span>{line}</span></div>)}</div>
    <div style={{ position: "absolute", left: 150, right: 150, bottom: 68, height: 3, background: `${pal.text}20` }}><div style={{ width: `${((active + 1) / lines.length) * 100}%`, height: 3, background: pal.accent }} /></div>
  </AbsoluteFill>;
};

// 09 — timeline scroll that draws a path as milestones enter the viewport.
const TimelineScroll: React.FC<{ p: ScrollEffectsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const items = itemsOf(p).slice(0, 6);
  const progress = clampInterp(frame, [16, durationInFrames - 15], [0, items.length - 1]);
  const active = Math.floor(progress);
  return <AbsoluteFill style={{ background: pal.bg, padding: "84px 140px", boxSizing: "border-box" }}><Grid pal={pal} opacity={0.06} /><div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "space-between" }}><div><Label pal={pal}>09 / timeline scroll</Label><div style={{ marginTop: 18 }}><Heading p={p} pal={pal} /></div></div><div style={{ paddingTop: 10, color: `${pal.text}6e`, font: `15px ${MONO}` }}>MILESTONE<br /><span style={{ color: pal.accent }}>0{active + 1} / 0{items.length}</span></div></div>
    <div style={{ position: "absolute", zIndex: 2, left: 260, right: 210, bottom: 110, height: 470 }}><div style={{ position: "absolute", left: 26, top: 0, bottom: 0, width: 4, background: `${pal.text}20` }}><div style={{ width: 4, height: `${((progress + 0.12) / items.length) * 100}%`, background: pal.accent }} /></div>{items.map((item, i) => { const y = i * 83; const on = i <= active; return <div key={`${item}-${i}`} style={{ position: "absolute", left: 0, top: y, display: "flex", alignItems: "center", gap: 28, color: on ? pal.text : `${pal.text}46`, font: `${on ? 750 : 450} 27px ${FONT}`, transform: `translateX(${i === active ? clampInterp(progress - active, [0, 1], [20, 0]) : 0}px)` }}><div style={{ width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 99, background: on ? pal.accent : pal.bg, border: `3px solid ${on ? pal.accent : `${pal.text}36`}`, color: on ? pal.bg : `${pal.text}55`, font: `800 15px ${MONO}`, boxSizing: "border-box" }}>0{i + 1}</div><div>{item}<div style={{ marginTop: 5, color: on ? `${pal.text}75` : `${pal.text}30`, font: `14px ${MONO}` }}>{on ? "COMPLETE / VERIFIED" : "UP NEXT"}</div></div></div>; })}</div>
  </AbsoluteFill>;
};

const MobileShell: React.FC<{ pal: Palette; children: React.ReactNode }> = ({ pal, children }) => <div style={{ position: "relative", width: 370, height: 700, padding: 13, boxSizing: "border-box", borderRadius: 52, background: "linear-gradient(140deg,#9da4af,#252a34 35%,#737b88 80%,#1d222a)", boxShadow: "0 35px 90px #000a" }}><div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: 40, background: pal.bg, border: "2px solid #050609" }}><div style={{ position: "absolute", zIndex: 4, top: 10, left: "50%", transform: "translateX(-50%)", width: 108, height: 25, borderRadius: 20, background: "#050609" }} />{children}</div></div>;

// 10 — mobile feed pages that swipe vertically with momentum.
const MobileFeedSwipe: React.FC<{ p: ScrollEffectsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const items = itemsOf(p).slice(0, 5);
  const progress = clampInterp(frame, [18, durationInFrames - 15], [0, items.length - 1]);
  const active = Math.min(items.length - 1, Math.floor(progress));
  const frac = progress - active;
  const snap = spring({ frame: Math.max(0, frame - 18 - active * Math.floor(durationInFrames / items.length)), fps, config: { damping: 17, stiffness: 145 } });
  return <AbsoluteFill style={{ background: pal.bg, padding: "92px 150px", boxSizing: "border-box", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}><Grid pal={pal} opacity={0.06} /><div style={{ position: "relative", zIndex: 2, width: 550 }}><Label pal={pal}>10 / mobile feed swipe</Label><div style={{ marginTop: 20 }}><Heading p={p} pal={pal} /></div><div style={{ marginTop: 35, display: "flex", gap: 10 }}>{items.map((_, i) => <div key={i} style={{ width: i === active ? 38 : 10, height: 6, borderRadius: 9, background: i === active ? pal.accent : `${pal.text}35`, transition: "none" }} />)}</div><div style={{ marginTop: 25, color: `${pal.text}6f`, font: `15px ${MONO}` }}>SWIPE VELOCITY&nbsp;&nbsp; {String(Math.round(Math.abs(Math.sin(frame * 0.1)) * 100)).padStart(3, "0")} PX/S</div></div><div style={{ position: "relative", zIndex: 2, perspective: 1200, transform: `rotateY(-12deg) rotateZ(${Math.sin(frame * 0.04) * 1.5}deg)` }}><MobileShell pal={pal}><div style={{ position: "absolute", inset: 0, paddingTop: 50, transform: `translateY(${-(progress * 635) + snap * 8}px)` }}>{items.map((item, i) => <div key={`${item}-${i}`} style={{ height: 635, padding: 30, boxSizing: "border-box", background: `linear-gradient(${135 + i * 8}deg, ${[pal.primary, pal.secondary, pal.accent][i % 3]}55, ${pal.bg} 58%)` }}><div style={{ color: `${pal.text}88`, font: `13px ${MONO}` }}>FOR YOU / 0{i + 1}</div><div style={{ marginTop: 60, width: "100%", height: 260, borderRadius: 22, background: p.imageSrc ? `url(${p.imageSrc}) center/cover` : `linear-gradient(145deg, ${[pal.primary, pal.secondary, pal.accent][i % 3]}cc, ${pal.bg})` }} /><div style={{ marginTop: 24, color: pal.text, font: `800 27px ${FONT}` }}>{item}</div><div style={{ marginTop: 12, color: `${pal.text}91`, font: `17px/1.4 ${FONT}` }}>A focused story designed for thumb-first motion and a single confident swipe.</div><div style={{ marginTop: 22, color: pal.accent, font: `700 14px ${MONO}` }}>♡ 1.2K&nbsp;&nbsp; ◌ SHARE</div></div>)}</div><div style={{ position: "absolute", zIndex: 5, left: 25, right: 25, bottom: 20, height: 46, display: "flex", justifyContent: "space-around", alignItems: "center", borderRadius: 20, background: `${pal.bg}dd`, color: `${pal.text}aa`, font: `18px ${MONO}` }}>⌂&nbsp;&nbsp;&nbsp; ◇ &nbsp;&nbsp;&nbsp;＋&nbsp;&nbsp;&nbsp; ♡&nbsp;&nbsp;&nbsp; ◎</div></MobileShell></div></AbsoluteFill>;
};

const COMPONENTS: Record<ScrollVariant, React.FC<{ p: ScrollEffectsProps; pal: Palette }>> = {
  "page-scroll": PageScroll,
  "section-snap": SectionSnap,
  "parallax-layers": ParallaxLayers,
  "horizontal-gallery": HorizontalGallery,
  "infinite-ticker": InfiniteTicker,
  "chat-feed": ChatFeed,
  "code-scroll": CodeScroll,
  "document-highlight": DocumentHighlight,
  "timeline-scroll": TimelineScroll,
  "mobile-feed-swipe": MobileFeedSwipe,
};

export const ScrollEffects: React.FC<ScrollEffectsProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Component = COMPONENTS[props.variant] ?? PageScroll;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <AbsoluteFill style={{ backgroundColor: pal.bg, overflow: "hidden" }}><div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><Component p={props} pal={pal} /></div></AbsoluteFill>;
};

// Remotion's registry passes untyped defaultProps into every composition. Keep
// the internal renderer map private and expose the public family dispatcher,
// matching the convention used by the other family engines.
const familyCast = (component: React.FC<ScrollEffectsProps>) =>
  component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "scroll-page-smooth-tour": familyCast(ScrollEffects),
  "scroll-section-snap-editorial": familyCast(ScrollEffects),
  "scroll-parallax-depth-layers": familyCast(ScrollEffects),
  "scroll-horizontal-gallery-swipe": familyCast(ScrollEffects),
  "scroll-infinite-ticker-loop": familyCast(ScrollEffects),
  "scroll-chat-feed-auto-follow": familyCast(ScrollEffects),
  "scroll-code-editor-walkthrough": familyCast(ScrollEffects),
  "scroll-document-highlight-follow": familyCast(ScrollEffects),
  "scroll-timeline-milestone-reveal": familyCast(ScrollEffects),
  "scroll-mobile-feed-swipe": familyCast(ScrollEffects),
};

export default ScrollEffects;
