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
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: browser-chrome
 * Browser-window choreography for product demos, website tours, and UI evidence.
 * Every default is procedural so the family renders without external assets.
 */

type BrowserChromeVariant =
  | "minimal-window"
  | "macos-window"
  | "tab-switch"
  | "address-bar-zoom"
  | "window-stack"
  | "browser-popover"
  | "split-browser"
  | "incognito-mode"
  | "devtools-drawer"
  | "full-bleed-tab";

export interface BrowserChromeProps {
  variant: BrowserChromeVariant;
  siteName: string;
  url: string;
  headline: string;
  subheadline: string;
  tabs: string[];
  lines: string[];
  paletteName: string;
  browserLabel?: string;
  cta?: string;
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const fallbackTabs = ["Overview", "Product", "Pricing", "About"];
const fallbackLines = ["A clearer way to show your product.", "Bring the important details forward.", "Make every interaction feel intentional."];

const list = (values: string[] | undefined, fallback: string[]) => values?.length ? values : fallback;

const Dots: React.FC<{ dark?: boolean; small?: boolean }> = ({ dark = false, small = false }) => (
  <div style={{ display: "flex", gap: small ? 6 : 8, alignItems: "center" }}>
    {["#ff5f57", "#febc2e", "#28c840"].map((color) => <div key={color} style={{ width: small ? 9 : 12, height: small ? 9 : 12, borderRadius: 99, background: dark ? `${color}bb` : color }} />)}
  </div>
);

const TabStrip: React.FC<{ tabs: string[]; active: number; pal: Palette; dark?: boolean; compact?: boolean }> = ({ tabs, active, pal, dark = false, compact = false }) => (
  <div style={{ height: compact ? 32 : 42, display: "flex", alignItems: "stretch", gap: 4, padding: compact ? "0 12px" : "0 18px", background: dark ? "#191b22" : "#dfe4eb", overflow: "hidden" }}>
    {tabs.slice(0, compact ? 3 : 5).map((tab, i) => <div key={`${tab}-${i}`} style={{ minWidth: compact ? 100 : 145, maxWidth: compact ? 170 : 210, display: "flex", alignItems: "center", gap: 8, padding: "0 13px", borderRadius: "8px 8px 0 0", color: i === active ? (dark ? "#f5f7fb" : pal.text) : (dark ? "#8790a2" : `${pal.text}80`), background: i === active ? (dark ? "#292d38" : "#f7f9fc") : "transparent", font: `${compact ? 10 : 12}px ${FONT}`, fontWeight: i === active ? 800 : 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><span style={{ width: 7, height: 7, borderRadius: 99, background: i === active ? pal.accent : `${pal.text}45` }} />{tab}</div>)}
    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", color: dark ? "#8c94a4" : `${pal.text}85`, font: `${compact ? 14 : 18}px ${FONT}` }}>＋</div>
  </div>
);

const BrowserBar: React.FC<{ pal: Palette; url: string; tabs: string[]; active?: number; dark?: boolean; compact?: boolean; incognito?: boolean }> = ({ pal, url, tabs, active = 0, dark = false, compact = false, incognito = false }) => (
  <>
    <div style={{ height: compact ? 42 : 58, display: "flex", alignItems: "center", gap: compact ? 9 : 13, padding: compact ? "0 13px" : "0 20px", boxSizing: "border-box", background: dark ? "#252832" : "#eef1f5", color: dark ? "#d6dae5" : pal.text }}>
      <Dots dark={dark} small={compact} />
      <div style={{ display: "flex", gap: compact ? 8 : 12, color: dark ? "#949caf" : `${pal.text}75`, font: `${compact ? 13 : 17}px ${FONT}` }}><span>‹</span><span>›</span><span>↻</span></div>
      <div style={{ flex: 1, minWidth: 0, height: compact ? 24 : 32, borderRadius: 8, display: "flex", alignItems: "center", gap: 8, padding: "0 12px", boxSizing: "border-box", background: dark ? "#171920" : "#fff", color: dark ? "#b4bbca" : `${pal.text}82`, border: `1px solid ${dark ? "#ffffff12" : "#00000010"}`, font: `${compact ? 10 : 13}px ${MONO}`, overflow: "hidden", whiteSpace: "nowrap" }}><span style={{ color: incognito ? "#a78bfa" : pal.accent, flex: "0 0 auto" }}>{incognito ? "◈" : "⌁"}</span><span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</span></div>
      <div style={{ color: dark ? "#9da5b7" : `${pal.text}70`, font: `${compact ? 14 : 18}px ${FONT}` }}>☆</div>
      <div style={{ color: dark ? "#9da5b7" : `${pal.text}70`, font: `${compact ? 15 : 20}px ${FONT}` }}>⋮</div>
    </div>
    <TabStrip tabs={tabs} active={active} pal={pal} dark={dark} compact={compact} />
  </>
);

const BrowserWindow: React.FC<{ children: React.ReactNode; pal: Palette; p: BrowserChromeProps; active?: number; dark?: boolean; compact?: boolean; incognito?: boolean; style?: React.CSSProperties }> = ({ children, pal, p, active = 0, dark = false, compact = false, incognito = false, style }) => (
  <div style={{ overflow: "hidden", borderRadius: compact ? 13 : 18, background: dark ? "#171920" : "#f7f9fc", border: `1px solid ${dark ? "#ffffff22" : "#ffffff65"}`, boxShadow: compact ? "0 22px 52px #0008" : "0 32px 90px #000a", ...style }}>
    <BrowserBar pal={pal} url={p.url} tabs={list(p.tabs, fallbackTabs)} active={active} dark={dark} compact={compact} incognito={incognito} />
    {children}
  </div>
);

const PageContent: React.FC<{ p: BrowserChromeProps; pal: Palette; dark?: boolean; compact?: boolean; mode?: "hero" | "dashboard" | "docs" | "incognito"; active?: number }> = ({ p, pal, dark = false, compact = false, mode = "hero", active = 0 }) => {
  const lines = list(p.lines, fallbackLines);
  const tabs = list(p.tabs, fallbackTabs);
  const text = dark ? "#f2f4fa" : pal.text;
  if (mode === "docs") {
    return <div style={{ height: compact ? 430 : 650, display: "grid", gridTemplateColumns: compact ? "145px 1fr" : "220px 1fr", background: dark ? "#1d2029" : pal.bg, color: text, fontFamily: FONT }}>
      <div style={{ padding: compact ? 14 : 24, borderRight: `1px solid ${dark ? "#ffffff14" : `${pal.text}18`}`, color: `${text}90`, fontSize: compact ? 10 : 13 }}><div style={{ color: text, fontWeight: 900, fontSize: compact ? 13 : 18, marginBottom: compact ? 22 : 30 }}>{p.siteName}</div>{tabs.slice(0, 5).map((tab, i) => <div key={tab} style={{ padding: compact ? "8px 7px" : "11px 9px", marginBottom: 4, borderRadius: 6, background: i === active ? `${pal.accent}30` : "transparent", color: i === active ? text : `${text}78` }}>{tab}</div>)}</div>
      <div style={{ padding: compact ? 22 : 42 }}><div style={{ color: pal.accent, font: `800 ${compact ? 10 : 13}px ${MONO}`, letterSpacing: ".15em" }}>DOCUMENTATION / 0{active + 1}</div><div style={{ marginTop: compact ? 12 : 18, font: `900 ${compact ? 28 : 48}px/.98 ${FONT}`, letterSpacing: "-.05em" }}>{lines[active % lines.length]}</div><div style={{ marginTop: compact ? 16 : 24, color: `${text}98`, fontSize: compact ? 12 : 18, lineHeight: 1.5 }}>{p.subheadline}</div><div style={{ marginTop: compact ? 24 : 38, display: "flex", flexDirection: "column", gap: compact ? 8 : 12 }}>{lines.map((line, i) => <div key={`${line}-${i}`} style={{ height: compact ? 7 : 10, width: `${58 + (i % 3) * 13}%`, borderRadius: 8, background: `${text}${i === active % lines.length ? "70" : "28"}` }} />)}</div></div>
    </div>;
  }
  if (mode === "dashboard") {
    return <div style={{ height: compact ? 430 : 650, background: dark ? "#1a1c24" : pal.bg, color: text, padding: compact ? 18 : 32, boxSizing: "border-box", fontFamily: FONT }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ font: `900 ${compact ? 18 : 25}px ${FONT}` }}>{p.siteName} <span style={{ color: pal.accent }}>/</span> Workspace</div><div style={{ color: `${text}75`, font: `${compact ? 9 : 12}px ${MONO}` }}>LIVE · 09:41</div></div><div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: compact ? 8 : 13, marginTop: compact ? 24 : 35 }}>{["84.2%", "+18.6%", "12.4k"].map((metric, i) => <div key={metric} style={{ padding: compact ? 12 : 18, borderRadius: 10, background: `${text}0c`, border: `1px solid ${text}18` }}><div style={{ color: `${text}75`, font: `${compact ? 8 : 11}px ${MONO}` }}>{["RETENTION", "GROWTH", "ACTIVE"][i]}</div><div style={{ marginTop: compact ? 8 : 13, font: `900 ${compact ? 20 : 30}px ${FONT}` }}>{metric}</div></div>)}</div><div style={{ marginTop: compact ? 14 : 22, height: compact ? 220 : 360, borderRadius: 12, background: `${text}0b`, border: `1px solid ${text}18`, padding: compact ? 12 : 20, boxSizing: "border-box" }}><div style={{ color: `${text}90`, font: `700 ${compact ? 10 : 14}px ${FONT}` }}>{p.headline}</div><svg viewBox="0 0 800 220" preserveAspectRatio="none" style={{ width: "100%", height: "80%", marginTop: compact ? 10 : 20 }}><path d="M0 180 C90 160 100 88 200 125 S320 80 390 105 S505 28 585 85 S700 20 800 42" fill="none" stroke={pal.accent} strokeWidth="6" /><path d="M0 180 C90 160 100 88 200 125 S320 80 390 105 S505 28 585 85 S700 20 800 42 V220 H0Z" fill={`${pal.primary}35`} /></svg></div></div>;
  }
  return <div style={{ height: compact ? 430 : 650, background: dark ? "#20232c" : pal.bg, color: text, padding: compact ? 22 : 46, boxSizing: "border-box", fontFamily: FONT }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}><div style={{ display: "flex", alignItems: "center", gap: compact ? 8 : 12, font: `900 ${compact ? 18 : 25}px ${FONT}`, letterSpacing: "-.04em" }}><span style={{ width: compact ? 18 : 27, height: compact ? 18 : 27, borderRadius: 8, background: `linear-gradient(135deg, ${pal.primary}, ${pal.accent})`, transform: "rotate(10deg)" }} />{p.siteName}</div><div style={{ display: "flex", gap: compact ? 9 : 17, color: `${text}78`, font: `${compact ? 9 : 12}px ${FONT}` }}>{tabs.slice(0, 3).map((tab) => <span key={tab}>{tab}</span>)}</div></div><div style={{ marginTop: compact ? 58 : 95, maxWidth: compact ? 430 : 740 }}><div style={{ color: pal.accent, font: `900 ${compact ? 10 : 14}px ${MONO}`, letterSpacing: ".22em" }}>BROWSER CHROME / 0{active + 1}</div><div style={{ marginTop: compact ? 12 : 18, font: `900 ${compact ? 34 : 67}px/.96 ${FONT}`, letterSpacing: "-.065em" }}>{p.headline}</div><div style={{ marginTop: compact ? 14 : 22, color: `${text}9b`, fontSize: compact ? 13 : 21, lineHeight: 1.4 }}>{p.subheadline}</div><div style={{ marginTop: compact ? 24 : 36, display: "flex", gap: 10 }}><span style={{ padding: compact ? "9px 13px" : "13px 19px", borderRadius: 8, background: pal.accent, color: pal.bg, font: `800 ${compact ? 11 : 14}px ${FONT}` }}>{p.cta ?? "Explore"}</span><span style={{ padding: compact ? "9px 13px" : "13px 19px", borderRadius: 8, border: `1px solid ${text}35`, color: text, font: `800 ${compact ? 11 : 14}px ${FONT}` }}>Learn more</span></div></div><div style={{ position: "absolute", right: compact ? 25 : 48, bottom: compact ? 24 : 45, width: compact ? 180 : 310, height: compact ? 125 : 205, borderRadius: compact ? 12 : 19, background: `linear-gradient(135deg, ${pal.primary}d9, ${pal.secondary}80 48%, ${pal.accent}8c)`, border: `1px solid ${text}38`, transform: `rotate(${active % 2 ? -2 : 3}deg)` }}><div style={{ position: "absolute", inset: 0, opacity: .35, backgroundImage: `linear-gradient(${text}30 1px, transparent 1px), linear-gradient(90deg, ${text}30 1px, transparent 1px)`, backgroundSize: compact ? "20px 20px" : "30px 30px" }} /></div></div>;
};

const MinimalWindow: React.FC<{ p: BrowserChromeProps; pal: Palette }> = ({ p, pal }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const enter = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 16, stiffness: 100 } }); return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 90, boxSizing: "border-box" }}><BrowserWindow p={p} pal={pal} style={{ width: 1420, transform: `translateY(${interpolate(enter, [0, 1], [150, 0])}px) scale(${interpolate(enter, [0, 1], [.82, 1])})`, opacity: enter }}><PageContent p={p} pal={pal} /></BrowserWindow><div style={{ position: "absolute", left: 110, top: 70, color: pal.accent, font: `800 14px ${MONO}`, letterSpacing: ".2em" }}>MINIMAL WINDOW / 01</div></AbsoluteFill>; };

const MacosWindow: React.FC<{ p: BrowserChromeProps; pal: Palette }> = ({ p, pal }) => { const frame = useCurrentFrame(); const reveal = clampInterp(frame, [10, 38], [0, 1]); return <AbsoluteFill style={{ padding: "85px 105px", boxSizing: "border-box" }}><div style={{ color: pal.text, font: `900 48px ${FONT}`, letterSpacing: "-.06em", opacity: reveal, transform: `translateY(${clampInterp(frame, [10, 38], [25, 0])}px)` }}>A familiar frame, made cinematic.</div><div style={{ marginTop: 45, transform: `translateY(${clampInterp(frame, [14, 48], [100, 0])}px)`, opacity: reveal }}><BrowserWindow p={p} pal={pal} style={{ width: 1450 }}><PageContent p={p} pal={pal} mode="dashboard" /></BrowserWindow></div><div style={{ position: "absolute", right: 115, top: 95, padding: "10px 14px", borderRadius: 99, background: `${pal.text}12`, color: `${pal.text}9c`, font: `700 13px ${MONO}` }}>macOS / PRODUCT TOUR</div></AbsoluteFill>; };

const TabSwitch: React.FC<{ p: BrowserChromeProps; pal: Palette }> = ({ p, pal }) => { const frame = useCurrentFrame(); const tabs = list(p.tabs, fallbackTabs); const active = Math.min(tabs.length - 1, Math.floor(frame / 42) % tabs.length); return <AbsoluteFill style={{ padding: "72px 100px", boxSizing: "border-box" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 28 }}><div style={{ color: pal.text, font: `900 50px/.95 ${FONT}`, letterSpacing: "-.06em" }}>{p.headline}</div><div style={{ color: pal.accent, font: `800 14px ${MONO}` }}>TAB {String(active + 1).padStart(2, "0")} / {String(tabs.length).padStart(2, "0")}</div></div><BrowserWindow p={p} pal={pal} active={active} style={{ width: "100%" }}><PageContent p={p} pal={pal} mode={active % 2 ? "dashboard" : "hero"} active={active} /></BrowserWindow></AbsoluteFill>; };

const AddressBarZoom: React.FC<{ p: BrowserChromeProps; pal: Palette }> = ({ p, pal }) => { const frame = useCurrentFrame(); const zoom = clampInterp(frame, [15, 62], [1, 1.1]); const x = clampInterp(frame, [15, 62], [0, 120]); return <AbsoluteFill style={{ padding: 90, boxSizing: "border-box", alignItems: "center" }}><div style={{ position: "absolute", left: 110, top: 50, color: pal.accent, font: `800 14px ${MONO}`, letterSpacing: ".18em" }}>ADDRESS BAR / FOCUS ZOOM</div><BrowserWindow p={p} pal={pal} style={{ width: 1350, transform: `scale(${zoom}) translateX(${x}px)`, transformOrigin: "left 32%" }}><PageContent p={p} pal={pal} mode="docs" /></BrowserWindow><div style={{ position: "absolute", bottom: 65, left: 90, right: 90, maxWidth: 760, margin: "0 auto", padding: "13px 18px", boxSizing: "border-box", borderRadius: 10, background: `${pal.bg}e8`, border: `1px solid ${pal.text}25`, color: pal.text, font: `700 14px ${MONO}`, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>⌕ {p.url}</div></AbsoluteFill>; };

const WindowStack: React.FC<{ p: BrowserChromeProps; pal: Palette }> = ({ p, pal }) => { const frame = useCurrentFrame(); const windows = [0, 1, 2]; return <AbsoluteFill style={{ padding: 90, boxSizing: "border-box", alignItems: "center" }}><div style={{ color: pal.text, font: `900 58px/.95 ${FONT}`, letterSpacing: "-.07em", marginBottom: 40 }}>{p.headline}</div><div style={{ position: "relative", width: 1460, height: 710 }}>{windows.map((i) => { const e = spring({ frame: Math.max(0, frame - i * 10 - 8), fps: 30, config: { damping: 15, stiffness: 100 } }); return <BrowserWindow key={i} p={p} pal={pal} active={i} compact={i === 0} style={{ position: "absolute", width: i === 0 ? 1080 : 1240, left: `${i * 6}%`, top: `${i * 6}%`, zIndex: i, opacity: e, transform: `translateY(${interpolate(e, [0, 1], [100, 0])}px) rotate(${(i - 1) * 3}deg)`, transformOrigin: "center bottom" }}><PageContent p={p} pal={pal} mode={i === 1 ? "dashboard" : "hero"} compact={i === 0} active={i} /></BrowserWindow>; })}</div></AbsoluteFill>; };

const BrowserPopover: React.FC<{ p: BrowserChromeProps; pal: Palette }> = ({ p, pal }) => { const frame = useCurrentFrame(); const pop = clampInterp(frame, [36, 58], [0, 1]); return <AbsoluteFill style={{ padding: "90px 120px", boxSizing: "border-box", alignItems: "center" }}><BrowserWindow p={p} pal={pal} style={{ width: 1430 }}><PageContent p={p} pal={pal} /><div style={{ position: "absolute", top: 88, right: 32, width: 330, padding: 20, borderRadius: 14, background: `${pal.bg}f4`, border: `1px solid ${pal.text}25`, boxShadow: "0 20px 50px #0008", color: pal.text, opacity: pop, transform: `translateY(${interpolate(pop, [0, 1], [-22, 0])}px)` }}><div style={{ display: "flex", justifyContent: "space-between", font: `800 14px ${FONT}` }}><span>Quick actions</span><span style={{ color: pal.accent }}>×</span></div>{["Share this page", "Copy link", "Open in new tab"].map((item, i) => <div key={item} style={{ marginTop: 15, padding: "11px 10px", borderRadius: 7, background: i === 0 ? `${pal.primary}22` : "transparent", color: `${pal.text}b0`, font: `600 13px ${FONT}` }}>⌁　{item}</div>)}</div></BrowserWindow><div style={{ marginTop: 24, color: `${pal.text}85`, font: `700 13px ${MONO}` }}>CLICK · REVEAL · CONTINUE</div></AbsoluteFill>; };

const SplitBrowser: React.FC<{ p: BrowserChromeProps; pal: Palette }> = ({ p, pal }) => { const frame = useCurrentFrame(); const progress = clampInterp(frame, [8, 38], [0, 1]); return <AbsoluteFill style={{ padding: "94px 75px", boxSizing: "border-box" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 35, opacity: progress }}><div style={{ color: pal.text, font: `900 55px/.95 ${FONT}`, letterSpacing: "-.07em" }}>{p.headline}</div><div style={{ color: pal.accent, font: `800 14px ${MONO}` }}>COMPARE / LIVE</div></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, transform: `translateY(${clampInterp(frame, [8, 38], [80, 0])}px)`, opacity: progress }}><BrowserWindow p={p} pal={pal} active={0} compact style={{ transform: "rotate(-1.5deg)" }}><PageContent p={p} pal={pal} compact active={0} /></BrowserWindow><BrowserWindow p={p} pal={pal} active={1} compact style={{ transform: "rotate(1.5deg)" }}><PageContent p={p} pal={pal} compact mode="dashboard" active={1} /></BrowserWindow></div><div style={{ position: "absolute", left: "50%", top: "55%", transform: "translate(-50%,-50%)", width: 44, height: 44, borderRadius: 99, background: pal.accent, color: pal.bg, display: "flex", alignItems: "center", justifyContent: "center", font: `900 18px ${FONT}`, boxShadow: "0 8px 24px #0006" }}>↔</div></AbsoluteFill>; };

const IncognitoMode: React.FC<{ p: BrowserChromeProps; pal: Palette }> = ({ p, pal }) => { const frame = useCurrentFrame(); const enter = clampInterp(frame, [12, 38], [0, 1]); return <AbsoluteFill style={{ padding: "80px 140px", boxSizing: "border-box", alignItems: "center", background: "#090a0d" }}><div style={{ position: "absolute", top: 52, color: "#a78bfa", font: `900 14px ${MONO}`, letterSpacing: ".2em" }}>PRIVATE MODE / 08</div><BrowserWindow p={p} pal={pal} dark incognito style={{ width: 1380, transform: `scale(${interpolate(enter, [0, 1], [.9, 1])}) translateY(${interpolate(enter, [0, 1], [80, 0])}px)`, opacity: enter }}><PageContent p={p} pal={pal} dark mode="incognito" /></BrowserWindow><div style={{ marginTop: 28, color: "#8d93a2", font: `700 13px ${MONO}` }}>◈ NOTHING SAVED TO HISTORY</div></AbsoluteFill>; };

const DevtoolsDrawer: React.FC<{ p: BrowserChromeProps; pal: Palette }> = ({ p, pal }) => { const frame = useCurrentFrame(); const drawer = clampInterp(frame, [54, 82], [0, 1]); return <AbsoluteFill style={{ padding: "70px 92px", boxSizing: "border-box", alignItems: "center" }}><BrowserWindow p={p} pal={pal} style={{ width: 1460 }}><div style={{ height: 610, overflow: "hidden" }}><PageContent p={p} pal={pal} mode="dashboard" /></div><div style={{ height: 230, background: "#1b1d24", color: "#cbd2df", transform: `translateY(${interpolate(drawer, [0, 1], [230, 0])}px)`, borderTop: "2px solid #a78bfa", font: `12px ${MONO}`, padding: 18, boxSizing: "border-box" }}><div style={{ display: "flex", gap: 20, color: "#d7b6ff", fontWeight: 800, marginBottom: 15 }}><span>Elements</span><span>Console</span><span>Network</span><span>Sources</span></div><div style={{ color: "#8e98aa" }}>&lt;main className="product-shell"&gt;</div><div style={{ paddingLeft: 18, marginTop: 9, color: "#9cd7ff" }}>　&lt;h1&gt;<span style={{ color: "#f0f3f8" }}>{p.headline}</span>&lt;/h1&gt;</div><div style={{ paddingLeft: 18, marginTop: 9, color: "#8e98aa" }}>　&lt;section data-state="ready" /&gt;</div></div></BrowserWindow><div style={{ marginTop: 18, color: `${pal.text}88`, font: `800 13px ${MONO}` }}>INSPECT THE STORY / DEVTOOLS DRAWER</div></AbsoluteFill>; };

const FullBleedTab: React.FC<{ p: BrowserChromeProps; pal: Palette }> = ({ p, pal }) => { const frame = useCurrentFrame(); const pan = clampInterp(frame, [12, 110], [0, -125]); return <AbsoluteFill style={{ background: pal.bg, color: pal.text, fontFamily: FONT }}><div style={{ height: 90, display: "flex", alignItems: "center", gap: 18, padding: "0 40px", background: `${pal.text}0d`, borderBottom: `1px solid ${pal.text}20` }}><Dots /><div style={{ color: pal.accent, font: `900 17px ${FONT}` }}>{p.siteName}</div><div style={{ flex: 1, height: 34, borderRadius: 9, background: `${pal.text}0d`, border: `1px solid ${pal.text}20`, display: "flex", alignItems: "center", padding: "0 14px", color: `${pal.text}75`, font: `12px ${MONO}` }}>{p.url}</div><div style={{ color: `${pal.text}85`, font: `800 14px ${FONT}` }}>↗ Share　⋮</div></div><div style={{ position: "absolute", inset: "90px 0 0", overflow: "hidden", transform: `translateY(${pan}px)` }}><div style={{ maxWidth: 1560, margin: "0 auto", padding: "90px 100px 160px", boxSizing: "border-box" }}><div style={{ color: pal.accent, font: `900 14px ${MONO}`, letterSpacing: ".25em" }}>FULL-BLEED EXPERIENCE / 10</div><div style={{ marginTop: 22, font: `900 98px/.91 ${FONT}`, letterSpacing: "-.08em", maxWidth: 1050 }}>{p.headline}</div><div style={{ marginTop: 30, color: `${pal.text}a0`, font: `24px/1.4 ${FONT}`, maxWidth: 700 }}>{p.subheadline}</div><div style={{ marginTop: 65, height: 420, borderRadius: 24, background: `linear-gradient(135deg, ${pal.primary}, ${pal.secondary}95 55%, ${pal.accent})`, position: "relative", overflow: "hidden", boxShadow: "0 32px 80px #0007" }}><div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${pal.text}28 1px, transparent 1px), linear-gradient(90deg, ${pal.text}28 1px, transparent 1px)`, backgroundSize: "38px 38px" }} /><div style={{ position: "absolute", left: 55, bottom: 45, color: pal.bg, font: `800 16px ${MONO}`, letterSpacing: ".18em" }}>{p.cta ?? "ENTER EXPERIENCE"}　→</div></div><div style={{ marginTop: 70, display: "flex", gap: 20 }}>{list(p.lines, fallbackLines).map((line, i) => <div key={`${line}-${i}`} style={{ flex: 1, padding: 22, borderTop: `2px solid ${pal.accent}`, font: `700 17px ${FONT}` }}>{line}</div>)}</div></div></div></AbsoluteFill>; };

const VARIANTS: Record<BrowserChromeVariant, React.FC<{ p: BrowserChromeProps; pal: Palette }>> = {
  "minimal-window": MinimalWindow,
  "macos-window": MacosWindow,
  "tab-switch": TabSwitch,
  "address-bar-zoom": AddressBarZoom,
  "window-stack": WindowStack,
  "browser-popover": BrowserPopover,
  "split-browser": SplitBrowser,
  "incognito-mode": IncognitoMode,
  "devtools-drawer": DevtoolsDrawer,
  "full-bleed-tab": FullBleedTab,
};

// Variants compose on a ~1920×1080 design canvas with pixel-sized windows.
// Scale the composed canvas as one unit so browser frames stay inside view.
const StageFit: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <AbsoluteFill style={{ overflow: "hidden" }}>
    <div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}>{children}</div>
  </AbsoluteFill>;
};

export const BrowserChromeTemplate: React.FC<BrowserChromeProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? MinimalWindow;
  const dark = props.variant === "incognito-mode";
  return <AbsoluteFill style={{ backgroundColor: dark ? "#090a0d" : pal.bg }}>
    {!dark && <GradientMeshBackground palette={pal} blobs={props.variant === "full-bleed-tab" ? 3 : 5} speed={0.35} />}
    <FadeEdges inFrames={10} outFrames={12}><StageFit><Variant p={props} pal={pal} /></StageFit></FadeEdges>
  </AbsoluteFill>;
};

const familyCast = (c: React.FC<BrowserChromeProps>) => c as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "browser-chrome-minimal-window": familyCast(BrowserChromeTemplate),
  "browser-chrome-macos-window": familyCast(BrowserChromeTemplate),
  "browser-chrome-tab-switch": familyCast(BrowserChromeTemplate),
  "browser-chrome-address-bar-zoom": familyCast(BrowserChromeTemplate),
  "browser-chrome-window-stack": familyCast(BrowserChromeTemplate),
  "browser-chrome-browser-popover": familyCast(BrowserChromeTemplate),
  "browser-chrome-split-browser": familyCast(BrowserChromeTemplate),
  "browser-chrome-incognito-mode": familyCast(BrowserChromeTemplate),
  "browser-chrome-devtools-drawer": familyCast(BrowserChromeTemplate),
  "browser-chrome-full-bleed-tab": familyCast(BrowserChromeTemplate),
};
