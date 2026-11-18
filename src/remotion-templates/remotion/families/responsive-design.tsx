import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, GradientMeshBackground, clampInterp, resolvePalette, stagger, type Palette } from "../lib/primitives";

/** Responsive layout choreography: original, asset-free UI proof templates. */
type ResponsiveVariant =
  | "desktop-to-mobile"
  | "fluid-breakpoint"
  | "grid-collapse"
  | "nav-to-menu"
  | "card-reflow"
  | "typography-scale"
  | "image-art-direction"
  | "sidebar-to-drawer"
  | "table-to-cards"
  | "responsive-scrub";

export interface ResponsiveDesignProps {
  variant: ResponsiveVariant;
  title: string;
  subtitle: string;
  paletteName: string;
  eyebrow?: string;
  screenshotUrl?: string;
  secondaryImageUrl?: string;
  breakpointLabels?: string[];
  viewportWidths?: number[];
  highlight?: string;
  labels?: string[];
  metrics?: string[];
  rows?: string[];
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, monospace';
const DEFAULT_LABELS = ["Overview", "Activity", "Reports", "Settings"];
const DEFAULT_METRICS = ["12.4k", "+28%", "98.6%"];
const DEFAULT_ROWS = ["Northstar", "Atlas", "Orbit", "Harbor"];

const Heading: React.FC<{ pal: Palette; p: ResponsiveDesignProps; width?: number }> = ({ pal, p, width = 560 }) => {
  const frame = useCurrentFrame();
  const t = clampInterp(frame, [4, 24], [0, 1]);
  return <div style={{ width, opacity: t, transform: `translateY(${interpolate(t, [0, 1], [32, 0])}px)`, color: pal.text, fontFamily: FONT }}>
    <div style={{ color: pal.accent, font: `850 15px ${MONO}`, letterSpacing: ".22em", textTransform: "uppercase" }}>{p.eyebrow ?? "RESPONSIVE SYSTEM"}</div>
    <div style={{ marginTop: 15, fontSize: 64, lineHeight: .97, fontWeight: 900, letterSpacing: "-.055em" }}>{p.title}</div>
    <div style={{ marginTop: 18, maxWidth: 500, color: `${pal.text}ad`, fontSize: 23, lineHeight: 1.34 }}>{p.subtitle}</div>
  </div>;
};

const BrowserChrome: React.FC<{ pal: Palette; mobile?: boolean }> = ({ pal, mobile = false }) => (
  <div style={{ height: mobile ? 22 : 38, padding: mobile ? "0 8px" : "0 13px", display: "flex", alignItems: "center", gap: mobile ? 4 : 7, background: `${pal.text}13`, borderBottom: `1px solid ${pal.text}22`, boxSizing: "border-box" }}>
    {!mobile && ["#ff605c", "#ffbd44", "#00ca4e"].map((c) => <span key={c} style={{ width: 8, height: 8, borderRadius: 99, background: c }} />)}
    <div style={{ marginLeft: mobile ? 0 : 8, flex: 1, height: mobile ? 12 : 20, borderRadius: 5, background: `${pal.bg}99`, color: `${pal.text}70`, font: `${mobile ? 7 : 10}px ${MONO}`, display: "flex", alignItems: "center", padding: "0 7px", overflow: "hidden", whiteSpace: "nowrap" }}>northstar.example / dashboard</div>
  </div>
);

const PageContent: React.FC<{ pal: Palette; p: ResponsiveDesignProps; mode?: "desktop" | "tablet" | "mobile"; textScale?: number; art?: boolean }> = ({ pal, p, mode = "desktop", textScale = 1, art = false }) => {
  const labels = p.labels?.length ? p.labels : DEFAULT_LABELS;
  const metrics = p.metrics?.length ? p.metrics : DEFAULT_METRICS;
  const cols = mode === "mobile" ? 1 : mode === "tablet" ? 2 : 3;
  return <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", padding: mode === "mobile" ? 14 : mode === "tablet" ? 22 : 30, boxSizing: "border-box", color: pal.text, fontFamily: FONT, background: art ? `linear-gradient(135deg, ${pal.primary}4f, ${pal.bg} 55%, ${pal.accent}32)` : `linear-gradient(145deg, ${pal.bg}, ${pal.primary}20)` }}>
    <div style={{ display: "flex", alignItems: "center", gap: mode === "mobile" ? 7 : 12, marginBottom: mode === "mobile" ? 18 : 28 }}>
      <div style={{ width: mode === "mobile" ? 18 : 28, height: mode === "mobile" ? 18 : 28, borderRadius: mode === "mobile" ? 5 : 8, background: pal.accent }} />
      <div style={{ width: mode === "mobile" ? 52 : 88, height: mode === "mobile" ? 5 : 8, borderRadius: 99, background: `${pal.text}9c` }} />
      {mode !== "mobile" && <div style={{ marginLeft: "auto", display: "flex", gap: 16 }}>{labels.slice(0, 3).map((l) => <span key={l} style={{ color: `${pal.text}78`, fontSize: 11 }}>{l}</span>)}</div>}
      {mode === "mobile" && <div style={{ marginLeft: "auto", width: 18, height: 13, borderTop: `2px solid ${pal.text}`, borderBottom: `2px solid ${pal.text}`, position: "relative" }}><span style={{ position: "absolute", top: 4, left: 0, right: 0, borderTop: `2px solid ${pal.text}` }} /></div>}
    </div>
    <div style={{ width: mode === "mobile" ? "88%" : "64%", fontSize: (mode === "mobile" ? 20 : 31) * textScale, fontWeight: 900, lineHeight: 1, letterSpacing: "-.05em" }}>{p.title}</div>
    <div style={{ width: mode === "mobile" ? "96%" : "58%", height: mode === "mobile" ? 6 : 9, marginTop: 11, borderRadius: 9, background: `${pal.text}40` }} />
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: mode === "mobile" ? 9 : 14, marginTop: mode === "mobile" ? 22 : 34 }}>
      {metrics.slice(0, 3).map((metric, i) => <div key={metric} style={{ minHeight: mode === "mobile" ? 65 : 92, padding: mode === "mobile" ? 10 : 15, borderRadius: mode === "mobile" ? 9 : 13, background: `${pal.text}0d`, border: `1px solid ${pal.text}20` }}><div style={{ color: pal.accent, font: `850 ${mode === "mobile" ? 15 : 22}px ${MONO}` }}>{metric}</div><div style={{ marginTop: 7, width: "75%", height: 5, borderRadius: 5, background: `${pal.text}35` }} /></div>)}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: mode === "mobile" ? "1fr" : "1.35fr .65fr", gap: mode === "mobile" ? 10 : 16, marginTop: mode === "mobile" ? 12 : 18, height: mode === "mobile" ? 155 : 240 }}>
      <div style={{ borderRadius: mode === "mobile" ? 9 : 14, background: `linear-gradient(145deg, ${pal.primary}b8, ${pal.secondary}70)`, position: "relative", overflow: "hidden" }}><div style={{ position: "absolute", inset: "45% 0 auto", height: 1, background: `${pal.text}77`, transform: "rotate(-8deg)" }} /><div style={{ position: "absolute", left: "20%", top: "24%", width: "58%", height: 3, background: pal.text, transform: "rotate(-8deg)" }} /></div>
      {mode !== "mobile" && <div style={{ display: "grid", gap: 10 }}>{Array.from({ length: 4 }, (_, i) => <div key={i} style={{ borderRadius: 9, background: `${pal.text}${i === 0 ? "22" : "0e"}`, border: `1px solid ${pal.text}18` }} />)}</div>}
    </div>
  </div>;
};

const Viewport: React.FC<{ pal: Palette; p: ResponsiveDesignProps; mode: "desktop" | "tablet" | "mobile"; width: number; height: number; x?: number; y?: number; opacity?: number; rotate?: number; textScale?: number; art?: boolean }> = ({ pal, p, mode, width, height, x = 0, y = 0, opacity = 1, rotate = 0, textScale, art }) => (
  <div style={{ width, height, opacity, transform: `translate(${x}px, ${y}px) rotate(${rotate}deg)`, borderRadius: mode === "mobile" ? 22 : 14, overflow: "hidden", background: pal.bg, border: `1px solid ${pal.text}45`, boxShadow: `0 28px 70px ${pal.bg}cc`, flexShrink: 0 }}>
    <BrowserChrome pal={pal} mobile={mode === "mobile"} />
    <div style={{ height: `calc(100% - ${mode === "mobile" ? 22 : 38}px)` }}><PageContent pal={pal} p={p} mode={mode} textScale={textScale} art={art || Boolean(p.screenshotUrl)} /></div>
  </div>
);

const DesktopToMobile: React.FC<{ p: ResponsiveDesignProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const modes: Array<"desktop" | "tablet" | "mobile"> = ["desktop", "tablet", "mobile"];
  return <AbsoluteFill style={{ padding: "80px 92px", boxSizing: "border-box" }}><Heading pal={pal} p={p} />
    <div style={{ position: "absolute", right: 90, top: 142, display: "flex", alignItems: "flex-end", gap: 20 }}>{modes.map((mode, i) => { const t = clampInterp(frame, stagger(i, 3, 16, 88), [0, 1]); const dims = mode === "desktop" ? [610, 370] : mode === "tablet" ? [300, 400] : [166, 336]; return <div key={mode} style={{ opacity: t, transform: `translateY(${interpolate(t, [0, 1], [80, 0])}px)` }}><Viewport pal={pal} p={p} mode={mode} width={dims[0]} height={dims[1]} /><div style={{ marginTop: 12, textAlign: "center", color: `${pal.text}9a`, font: `700 13px ${MONO}`, letterSpacing: ".1em" }}>{mode.toUpperCase()} / {mode === "desktop" ? "1440" : mode === "tablet" ? "768" : "390"}px</div></div>; })}</div>
  </AbsoluteFill>;
};

const FluidBreakpoint: React.FC<{ p: ResponsiveDesignProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const progress = clampInterp(frame, [12, 110], [0, 1]);
  const w = interpolate(progress, [0, 1], [660, 240]);
  const mode = progress > .75 ? "mobile" : progress > .38 ? "tablet" : "desktop";
  const label = (p.breakpointLabels ?? ["1440px / desktop", "768px / tablet", "390px / mobile"])[progress > .75 ? 2 : progress > .38 ? 1 : 0];
  return <AbsoluteFill style={{ padding: "76px 100px", boxSizing: "border-box" }}><Heading pal={pal} p={p} width={500} /><div style={{ position: "absolute", right: 160, top: 180, width: 700, height: 650, display: "flex", alignItems: "center", justifyContent: "center" }}><Viewport pal={pal} p={p} mode={mode as "desktop" | "tablet" | "mobile"} width={w} height={mode === "mobile" ? 570 : 420} textScale={interpolate(progress, [0, 1], [1, .76])} /><div style={{ position: "absolute", bottom: 0, left: 20, right: 20, height: 2, background: `${pal.text}40` }}><div style={{ position: "absolute", left: `${progress * 100}%`, top: -7, width: 16, height: 16, borderRadius: 99, background: pal.accent, transform: "translateX(-50%)", boxShadow: `0 0 0 7px ${pal.accent}25` }} /></div><div style={{ position: "absolute", bottom: -42, color: pal.accent, font: `800 15px ${MONO}` }}>{label}</div></div></AbsoluteFill>;
};

const GridCollapse: React.FC<{ p: ResponsiveDesignProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const t = clampInterp(frame, [12, 92], [0, 1]);
  const cols = t < .35 ? 4 : t < .7 ? 2 : 1;
  const cards = ["Research", "Design", "Build", "Launch", "Measure", "Learn"];
  return <AbsoluteFill style={{ padding: "76px 94px", boxSizing: "border-box" }}><Heading pal={pal} p={p} width={470} /><div style={{ position: "absolute", left: 650, right: 95, top: 210, display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 14, transition: "none" }}>{cards.map((card, i) => <div key={card} style={{ height: cols === 1 ? 88 : 145, borderRadius: 14, padding: 18, boxSizing: "border-box", background: `${[pal.primary, pal.secondary, pal.accent][i % 3]}${cols === 1 ? "25" : "55"}`, border: `1px solid ${pal.text}32`, color: pal.text, opacity: clampInterp(frame, [18 + i * 3, 33 + i * 3], [0, 1]), transform: `translateY(${clampInterp(frame, [18 + i * 3, 33 + i * 3], [22, 0])}px)` }}><div style={{ font: `850 ${cols === 1 ? 22 : 17}px ${FONT}` }}>{card}</div><div style={{ marginTop: 10, width: "75%", height: 5, borderRadius: 4, background: `${pal.text}42` }} /><span style={{ position: "absolute", marginTop: cols === 1 ? 28 : 50, color: `${pal.text}80`, font: `11px ${MONO}` }}>CARD / {String(i + 1).padStart(2, "0")}</span></div>)}</div><div style={{ position: "absolute", right: 100, bottom: 72, color: pal.accent, font: `800 14px ${MONO}` }}>{cols} COLUMNS / {cols === 1 ? "STACKED" : "FLUID GRID"}</div></AbsoluteFill>;
};

const NavToMenu: React.FC<{ p: ResponsiveDesignProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const t = clampInterp(frame, [18, 90], [0, 1]);
  const labels = p.labels?.length ? p.labels : DEFAULT_LABELS;
  return <AbsoluteFill style={{ padding: "90px 105px", boxSizing: "border-box" }}><Heading pal={pal} p={p} width={500} /><div style={{ position: "absolute", left: 630, right: 100, top: 275, height: 430, borderRadius: 24, padding: 30, boxSizing: "border-box", background: `${pal.text}0d`, border: `1px solid ${pal.text}25` }}><div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 34, height: 34, borderRadius: 9, background: pal.accent }} /><span style={{ color: pal.text, font: `850 22px ${FONT}` }}>NORTHSTAR</span><div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}><div style={{ display: "flex", gap: 22, opacity: 1 - t, transform: `translateX(${t * 24}px)` }}>{labels.map(l => <span key={l} style={{ color: pal.text, font: `650 15px ${FONT}`, whiteSpace: "nowrap" }}>{l}</span>)}</div><div style={{ width: 44, height: 38, borderRadius: 9, display: "grid", placeItems: "center", background: `${pal.accent}${t > .5 ? "ff" : "25"}`, opacity: t, transform: `scale(${interpolate(t, [0, 1], [.7, 1])})` }}><div style={{ width: 18, height: 14, borderTop: `2px solid ${t > .5 ? pal.bg : pal.accent}`, borderBottom: `2px solid ${t > .5 ? pal.bg : pal.accent}`, position: "relative" }}><span style={{ position: "absolute", top: 5, left: 0, right: 0, borderTop: `2px solid ${t > .5 ? pal.bg : pal.accent}` }} /></div></div></div></div><div style={{ marginTop: 70, color: pal.text, font: `900 46px ${FONT}`, letterSpacing: "-.04em" }}>{p.title}</div><div style={{ marginTop: 14, width: "55%", height: 9, background: `${pal.text}35`, borderRadius: 8 }} /></div><div style={{ position: "absolute", right: 108, bottom: 74, color: pal.accent, font: `800 14px ${MONO}` }}>{t > .5 ? "MENU / CLOSED NAV" : "NAV / FULL LINKS"}</div></AbsoluteFill>;
};

const CardReflow: React.FC<{ p: ResponsiveDesignProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const t = clampInterp(frame, [15, 96], [0, 1]);
  const items = ["Signal", "Context", "Action"];
  return <AbsoluteFill style={{ padding: "78px 94px", boxSizing: "border-box" }}><Heading pal={pal} p={p} width={480} /><div style={{ position: "absolute", left: 630, top: 190, width: 1040, height: 680, borderRadius: 22, background: `${pal.text}0a`, border: `1px solid ${pal.text}26`, overflow: "hidden", padding: 30, boxSizing: "border-box" }}><div style={{ display: "flex", justifyContent: "space-between", color: `${pal.text}70`, font: `12px ${MONO}`, letterSpacing: ".16em" }}>CONTENT MODULES <span>{t > .5 ? "MOBILE / 390" : "DESKTOP / 1440"}</span></div><div style={{ position: "relative", height: 535, marginTop: 26 }}>{items.map((item, i) => { const x0 = i * 326; const y0 = 90; const x1 = 0; const y1 = i * 164; const x = interpolate(t, [0, 1], [x0, x1]); const y = interpolate(t, [0, 1], [y0, y1]); const width = interpolate(t, [0, 1], [290, 920]); return <div key={item} style={{ position: "absolute", left: x, top: y, width, height: 136, padding: 20, boxSizing: "border-box", borderRadius: 14, background: `${[pal.primary, pal.secondary, pal.accent][i]}${t > .5 ? "45" : "70"}`, border: `1px solid ${pal.text}30`, color: pal.text, transform: `scale(${interpolate(t, [0, 1], [1, .98])})`, transformOrigin: "left center" }}><div style={{ font: `850 23px ${FONT}` }}>{item}</div><div style={{ marginTop: 12, width: "64%", height: 6, borderRadius: 5, background: `${pal.text}45` }} /></div>; })}</div></div></AbsoluteFill>;
};

const TypographyScale: React.FC<{ p: ResponsiveDesignProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const t = clampInterp(frame, [12, 112], [0, 1]);
  const size = interpolate(t, [0, 1], [78, 40]);
  return <AbsoluteFill style={{ padding: "85px 105px", boxSizing: "border-box" }}><Heading pal={pal} p={p} width={470} /><div style={{ position: "absolute", left: 650, top: 165, width: 1050, height: 650, borderRadius: 20, padding: 48, boxSizing: "border-box", background: `linear-gradient(145deg, ${pal.primary}40, ${pal.text}0c)`, border: `1px solid ${pal.text}28` }}><div style={{ color: pal.accent, font: `800 14px ${MONO}` }}>TYPE SCALE / {Math.round(size)}PX</div><div style={{ marginTop: 70, fontSize: size, lineHeight: .95, fontWeight: 900, letterSpacing: "-.065em", color: pal.text, maxWidth: 800 }}>{p.title}</div><div style={{ marginTop: 26, width: `${interpolate(t, [0, 1], [70, 92])}%`, height: 10, background: `${pal.text}36`, borderRadius: 9 }} /><div style={{ marginTop: 50, display: "flex", justifyContent: "space-between", color: `${pal.text}88`, font: `13px ${MONO}` }}><span>1440 / DISPLAY</span><span>390 / COMPACT</span></div><div style={{ position: "absolute", left: 48, right: 48, bottom: 46, height: 2, background: `${pal.text}38` }}><div style={{ width: `${t * 100}%`, height: 2, background: pal.accent }} /></div></div></AbsoluteFill>;
};

const ImageArtDirection: React.FC<{ p: ResponsiveDesignProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const t = clampInterp(frame, [15, 95], [0, 1]);
  const wideBackground = p.screenshotUrl
    ? `url(${p.screenshotUrl}) center / cover`
    : `linear-gradient(110deg, ${pal.primary}, ${pal.secondary} 48%, ${pal.accent})`;
  const narrowBackground = p.secondaryImageUrl
    ? `url(${p.secondaryImageUrl}) center / cover`
    : `radial-gradient(circle at 70% 35%, ${pal.accent}, ${pal.primary} 34%, ${pal.bg} 80%)`;
  return (
    <AbsoluteFill style={{ padding: "78px 100px", boxSizing: "border-box" }}>
      <Heading pal={pal} p={p} width={480} />
      <div style={{ position: "absolute", left: 650, top: 190, width: 1040, height: 650, borderRadius: 24, overflow: "hidden", border: `1px solid ${pal.text}35`, background: pal.bg }}>
        <div style={{ position: "absolute", inset: 0, opacity: 1 - t, background: wideBackground }} />
        <div style={{ position: "absolute", inset: 0, opacity: t, background: narrowBackground }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${pal.bg}00 55%, ${pal.bg}cc)` }} />
        <div style={{ position: "absolute", left: 34, bottom: 32, color: pal.text, font: `800 15px ${MONO}` }}>{t > .5 ? "MOBILE CROP / ART-DIRECTED" : "DESKTOP CROP / WIDE FOCAL"}</div>
        <div style={{ position: "absolute", right: 34, bottom: 32, width: 170, height: 4, background: `${pal.text}55` }}>
          <div style={{ width: `${t * 100}%`, height: 4, background: pal.accent }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SidebarDrawer: React.FC<{ p: ResponsiveDesignProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const t = clampInterp(frame, [16, 94], [0, 1]);
  const shift = interpolate(t, [0, 1], [0, -210]);
  const nav = ["Home", "Projects", "People", "Settings"];
  return (
    <AbsoluteFill style={{ padding: "82px 100px", boxSizing: "border-box" }}>
      <Heading pal={pal} p={p} width={470} />
      <div style={{ position: "absolute", left: 620, top: 190, width: 1060, height: 660, overflow: "hidden", borderRadius: 22, background: `${pal.text}0b`, border: `1px solid ${pal.text}28` }}>
        <div style={{ position: "absolute", left: shift, top: 0, bottom: 0, width: 270, padding: 30, boxSizing: "border-box", background: `${pal.primary}75`, borderRight: `1px solid ${pal.text}25` }}>
          <div style={{ color: pal.text, font: `850 19px ${FONT}` }}>WORKSPACE</div>
          {nav.map((x, i) => <div key={x} style={{ marginTop: 26, color: i === 0 ? pal.accent : `${pal.text}82`, font: `650 15px ${FONT}` }}>{x}</div>)}
        </div>
        <div style={{ position: "absolute", left: interpolate(t, [0, 1], [300, 28]), top: 28, right: 28, bottom: 28, padding: 28, boxSizing: "border-box", borderRadius: 14, background: `${pal.bg}bb` }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ color: pal.text, font: `850 23px ${FONT}` }}>Dashboard</span>
            <div style={{ marginLeft: "auto", width: 42, height: 34, borderRadius: 8, background: `${pal.accent}${t > .5 ? "ff" : "33"}`, display: "grid", placeItems: "center", opacity: t }}>
              <span style={{ width: 17, height: 12, borderTop: `2px solid ${pal.bg}`, borderBottom: `2px solid ${pal.bg}` }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: t > .5 ? "1fr" : "repeat(2,1fr)", gap: 14, marginTop: 30 }}>
            {DEFAULT_METRICS.map((x) => <div key={x} style={{ height: 112, borderRadius: 12, background: `${pal.secondary}35`, border: `1px solid ${pal.text}20`, padding: 15, boxSizing: "border-box", color: pal.text, font: `850 23px ${MONO}` }}>{x}</div>)}
          </div>
        </div>
        <div style={{ position: "absolute", right: 28, bottom: 22, color: pal.accent, font: `800 13px ${MONO}` }}>{t > .5 ? "DRAWER / OVERLAY" : "SIDEBAR / PERSISTENT"}</div>
      </div>
    </AbsoluteFill>
  );
};

const TableCards: React.FC<{ p: ResponsiveDesignProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const t = clampInterp(frame, [18, 100], [0, 1]);
  const rows = p.rows?.length ? p.rows : DEFAULT_ROWS;
  return <AbsoluteFill style={{ padding: "82px 100px", boxSizing: "border-box" }}><Heading pal={pal} p={p} width={470} /><div style={{ position: "absolute", left: 630, top: 190, width: 1040, height: 650, borderRadius: 22, overflow: "hidden", border: `1px solid ${pal.text}28`, background: `${pal.text}09`, padding: 28, boxSizing: "border-box" }}><div style={{ display: "grid", gridTemplateColumns: t < .62 ? "1.4fr 1fr 1fr .6fr" : "1fr", gap: 1, background: `${pal.text}22` }}>{rows.map((row, i) => <React.Fragment key={row}><div style={{ gridColumn: t >= .62 ? "auto" : undefined, padding: "18px 16px", minHeight: t >= .62 ? 76 : 54, boxSizing: "border-box", background: `${pal.bg}dd`, color: pal.text, font: `${i === 0 ? 800 : 650} ${t >= .62 ? 19 : 15}px ${FONT}`, display: "flex", alignItems: "center", gap: 14, borderRadius: t >= .62 ? 12 : 0 }}><span style={{ width: 28, height: 28, borderRadius: 8, background: [pal.primary, pal.secondary, pal.accent][i % 3] }} />{row}<span style={{ marginLeft: "auto", color: pal.accent, font: `800 ${t >= .62 ? 15 : 13}px ${MONO}` }}>{i === 0 ? "STATUS" : i % 2 ? "ACTIVE" : "READY"}</span></div>{t < .62 && i === 0 && <><div style={{ padding: 16, background: `${pal.bg}dd`, color: `${pal.text}78`, font: `800 12px ${MONO}` }}>OWNER</div><div style={{ padding: 16, background: `${pal.bg}dd`, color: `${pal.text}78`, font: `800 12px ${MONO}` }}>HEALTH</div><div style={{ padding: 16, background: `${pal.bg}dd`, color: `${pal.text}78`, font: `800 12px ${MONO}` }}>STATE</div></>}</React.Fragment>)}</div><div style={{ position: "absolute", right: 30, bottom: 22, color: pal.accent, font: `800 13px ${MONO}` }}>{t > .62 ? "CARD LIST / 390PX" : "TABLE / 1440PX"}</div></div></AbsoluteFill>;
};

const ResponsiveScrub: React.FC<{ p: ResponsiveDesignProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const cycle = (frame % 150) / 150;
  const t = cycle < .5 ? cycle * 2 : 2 - cycle * 2;
  const w = interpolate(t, [0, 1], [650, 240]);
  const mode = t > .76 ? "mobile" : t > .4 ? "tablet" : "desktop";
  return <AbsoluteFill style={{ padding: "70px 96px", boxSizing: "border-box" }}><Heading pal={pal} p={p} width={470} /><div style={{ position: "absolute", left: 610, right: 96, top: 165, height: 700, display: "flex", alignItems: "center", justifyContent: "center" }}><Viewport pal={pal} p={p} mode={mode as "desktop" | "tablet" | "mobile"} width={w} height={mode === "mobile" ? 590 : 430} textScale={interpolate(t, [0, 1], [1, .78])} /><div style={{ position: "absolute", left: 45, right: 45, bottom: 28, height: 8, borderRadius: 5, background: `${pal.text}25` }}><div style={{ width: `${t * 100}%`, height: 8, borderRadius: 5, background: pal.accent }} /><div style={{ position: "absolute", left: `${t * 100}%`, top: -7, width: 22, height: 22, borderRadius: 99, background: pal.accent, transform: "translateX(-50%)", boxShadow: `0 0 0 8px ${pal.accent}2d` }} /></div><div style={{ position: "absolute", bottom: -2, left: 45, color: pal.text, font: `700 13px ${MONO}` }}>{mode.toUpperCase()}</div><div style={{ position: "absolute", right: 45, bottom: -2, color: `${pal.text}70`, font: `13px ${MONO}` }}>DRAG / SCRUB WIDTH</div></div></AbsoluteFill>;
};

const VARIANTS: Record<ResponsiveVariant, React.FC<{ p: ResponsiveDesignProps; pal: Palette }>> = {
  "desktop-to-mobile": DesktopToMobile,
  "fluid-breakpoint": FluidBreakpoint,
  "grid-collapse": GridCollapse,
  "nav-to-menu": NavToMenu,
  "card-reflow": CardReflow,
  "typography-scale": TypographyScale,
  "image-art-direction": ImageArtDirection,
  "sidebar-to-drawer": SidebarDrawer,
  "table-to-cards": TableCards,
  "responsive-scrub": ResponsiveScrub,
};

export const ResponsiveDesignTemplate: React.FC<ResponsiveDesignProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? DesktopToMobile;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <AbsoluteFill style={{ backgroundColor: pal.bg, fontFamily: FONT }}><GradientMeshBackground palette={pal} blobs={props.variant === "image-art-direction" ? 3 : 5} speed={.35} /><FadeEdges inFrames={10} outFrames={14}><div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><Variant p={props} pal={pal} /></div></FadeEdges></AbsoluteFill>;
};

const familyCast = (c: React.FC<ResponsiveDesignProps>) => c as unknown as React.ComponentType<Record<string, unknown>>;
export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "responsive-design-desktop-to-mobile": familyCast(ResponsiveDesignTemplate),
  "responsive-design-fluid-breakpoint": familyCast(ResponsiveDesignTemplate),
  "responsive-design-grid-collapse": familyCast(ResponsiveDesignTemplate),
  "responsive-design-nav-to-menu": familyCast(ResponsiveDesignTemplate),
  "responsive-design-card-reflow": familyCast(ResponsiveDesignTemplate),
  "responsive-design-typography-scale": familyCast(ResponsiveDesignTemplate),
  "responsive-design-image-art-direction": familyCast(ResponsiveDesignTemplate),
  "responsive-design-sidebar-to-drawer": familyCast(ResponsiveDesignTemplate),
  "responsive-design-table-to-cards": familyCast(ResponsiveDesignTemplate),
  "responsive-design-responsive-scrub": familyCast(ResponsiveDesignTemplate),
};
