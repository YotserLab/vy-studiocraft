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
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: website-showcase
 * Ten procedural browser-product narratives. Screens are CSS/SVG by default,
 * but screenshotUrl/screenshotUrls can replace individual panels when supplied.
 */

type WebsiteVariant =
  | "browser-hero-reveal"
  | "landing-page-tour"
  | "feature-section-sequence"
  | "responsive-breakpoint"
  | "tab-switching"
  | "ecommerce-product-page"
  | "saas-dashboard-tour"
  | "portfolio-reel"
  | "before-after-redesign"
  | "multi-page-montage";

export interface WebsiteShowcaseProps {
  variant: WebsiteVariant;
  siteName: string;
  headline: string;
  subheadline: string;
  cta: string;
  navItems: string[];
  features: string[];
  paletteName: string;
  screenshotUrl?: string;
  screenshotUrls?: string[];
  price?: string;
  url?: string;
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const safeItems = (items: string[] | undefined, fallback: string[]): string[] => (items?.length ? items : fallback);
const screenshotFor = (p: WebsiteShowcaseProps, index: number): string | undefined => p.screenshotUrls?.[index] ?? p.screenshotUrl;

const BrowserChrome: React.FC<{ pal: Palette; url: string; compact?: boolean }> = ({ pal, url, compact = false }) => (
  <div style={{ height: compact ? 38 : 56, display: "flex", alignItems: "center", gap: compact ? 7 : 10, padding: compact ? "0 13px" : "0 20px", boxSizing: "border-box", background: "#e3e7ed", borderBottom: "1px solid #c8ced8" }}>
    {["#ff5f57", "#febc2e", "#28c840"].map((color) => <div key={color} style={{ width: compact ? 9 : 13, height: compact ? 9 : 13, borderRadius: 20, background: color }} />)}
    <div style={{ flex: 1, marginLeft: compact ? 10 : 18, height: compact ? 22 : 30, borderRadius: 7, background: "#fff", color: "#77808b", display: "flex", alignItems: "center", padding: "0 12px", font: `${compact ? 11 : 14}px ${MONO}`, overflow: "hidden", whiteSpace: "nowrap" }}>{url}</div>
  </div>
);

const BrowserFrame: React.FC<{ pal: Palette; children: React.ReactNode; url?: string; style?: React.CSSProperties; compact?: boolean }> = ({ pal, children, url = "yourbrand.com", style, compact = false }) => (
  <div style={{ overflow: "hidden", borderRadius: compact ? 14 : 20, background: "#f6f8fb", boxShadow: compact ? "0 20px 45px #0007" : "0 34px 85px #0009", border: "1px solid #ffffff38", ...style }}>
    <BrowserChrome pal={pal} url={url} compact={compact} />
    {children}
  </div>
);

const SiteNav: React.FC<{ p: WebsiteShowcaseProps; pal: Palette; compact?: boolean }> = ({ p, pal, compact = false }) => {
  const nav = safeItems(p.navItems, ["Product", "Solutions", "Pricing", "About"]);
  return <div style={{ height: compact ? 58 : 78, display: "flex", alignItems: "center", justifyContent: "space-between", padding: compact ? "0 20px" : "0 38px", boxSizing: "border-box", color: pal.text, fontFamily: FONT }}>
    <div style={{ display: "flex", alignItems: "center", gap: compact ? 9 : 13, fontSize: compact ? 17 : 21, fontWeight: 900, letterSpacing: "-.04em" }}><div style={{ width: compact ? 22 : 29, height: compact ? 22 : 29, borderRadius: compact ? 7 : 9, background: `linear-gradient(135deg, ${pal.primary}, ${pal.accent})`, transform: "rotate(9deg)" }} />{p.siteName}</div>
    <div style={{ display: "flex", gap: compact ? 14 : 26, alignItems: "center", color: `${pal.text}aa`, fontSize: compact ? 11 : 14, fontWeight: 700 }}>{nav.slice(0, compact ? 3 : 4).map((item) => <span key={item}>{item}</span>)}<span style={{ padding: compact ? "7px 11px" : "10px 16px", borderRadius: 99, color: pal.bg, background: pal.accent }}>{p.cta}</span></div>
  </div>;
};

const MediaPanel: React.FC<{ p: WebsiteShowcaseProps; pal: Palette; index?: number; style?: React.CSSProperties; label?: string }> = ({ p, pal, index = 0, style, label = "LIVE PREVIEW" }) => {
  const image = screenshotFor(p, index);
  return <div style={{ position: "relative", overflow: "hidden", background: `linear-gradient(135deg, ${pal.primary}d9, ${pal.secondary}75 48%, ${pal.accent}8c)`, ...style }}>
    {image ? <img src={image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : <>
      <div style={{ position: "absolute", inset: 0, opacity: .34, backgroundImage: `linear-gradient(${pal.text}22 1px, transparent 1px), linear-gradient(90deg, ${pal.text}22 1px, transparent 1px)`, backgroundSize: "34px 34px" }} />
      <div style={{ position: "absolute", left: "12%", top: "18%", width: "70%", height: "18%", borderRadius: 12, background: `${pal.text}dc`, opacity: .8 }} />
      <div style={{ position: "absolute", left: "12%", top: "45%", width: "50%", height: "7%", borderRadius: 7, background: `${pal.text}8c` }} />
      <div style={{ position: "absolute", left: "12%", top: "58%", width: "34%", height: "7%", borderRadius: 7, background: `${pal.text}62` }} />
      {[0, 1, 2].map((i) => <div key={i} style={{ position: "absolute", left: `${12 + i * 27}%`, bottom: "12%", width: "20%", height: "15%", borderRadius: 10, background: `${pal.bg}68`, border: `1px solid ${pal.text}55` }} />)}
    </>}
    <div style={{ position: "absolute", left: 16, bottom: 14, padding: "7px 10px", borderRadius: 7, background: `${pal.bg}c7`, color: pal.text, font: `700 11px ${MONO}`, letterSpacing: ".12em" }}>{label}</div>
  </div>;
};

const Headline: React.FC<{ p: WebsiteShowcaseProps; pal: Palette; align?: "left" | "center"; eyebrow?: string }> = ({ p, pal, align = "left", eyebrow = "THE WEB, REIMAGINED" }) => {
  const frame = useCurrentFrame();
  const y = clampInterp(frame, [4, 24], [34, 0]);
  return <div style={{ textAlign: align, color: pal.text, fontFamily: FONT, opacity: clampInterp(frame, [4, 18], [0, 1]), transform: `translateY(${y}px)` }}>
    <div style={{ color: pal.accent, fontSize: 15, fontWeight: 900, letterSpacing: ".24em" }}>{eyebrow}</div>
    <div style={{ marginTop: 14, fontSize: 68, lineHeight: .96, fontWeight: 900, letterSpacing: "-.065em" }}>{p.headline}</div>
    <div style={{ marginTop: 19, color: `${pal.text}b8`, fontSize: 23, lineHeight: 1.35 }}>{p.subheadline}</div>
  </div>;
};

const ProgressRail: React.FC<{ pal: Palette; count: number; active: number }> = ({ pal, count, active }) => <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{Array.from({ length: count }, (_, i) => <div key={i} style={{ width: i === active ? 32 : 8, height: 8, borderRadius: 9, background: i === active ? pal.accent : `${pal.text}45`, transition: "none" }} />)}</div>;

const BrowserHeroReveal: React.FC<{ p: WebsiteShowcaseProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 16, stiffness: 95 } });
  return <AbsoluteFill style={{ padding: "80px 100px", boxSizing: "border-box", justifyContent: "center" }}>
    <BrowserFrame pal={pal} url={p.url ?? `${p.siteName.toLowerCase().replace(/\s+/g, "")}.com`} style={{ transform: `translateY(${interpolate(enter, [0, 1], [180, 0])}px) scale(${interpolate(enter, [0, 1], [.82, 1])})`, opacity: enter }}>
      <div style={{ height: 860, background: pal.bg }}><SiteNav p={p} pal={pal} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.05fr", gap: 34, alignItems: "center", padding: "55px 62px" }}>
          <div><Headline p={p} pal={pal} eyebrow="A NEW DIGITAL PRESENCE" /><div style={{ display: "flex", gap: 12, marginTop: 34, color: pal.bg, font: `800 16px ${FONT}` }}><span style={{ padding: "13px 18px", borderRadius: 9, background: pal.accent }}>{p.cta}</span><span style={{ padding: "13px 18px", borderRadius: 9, border: `1px solid ${pal.text}42`, color: pal.text }}>Explore</span></div></div>
          <MediaPanel p={p} pal={pal} index={0} style={{ height: 500, borderRadius: 22, transform: `rotate(${interpolate(enter, [0, 1], [5, -2])}deg)` }} label="HERO / 001" />
        </div>
      </div>
    </BrowserFrame>
  </AbsoluteFill>;
};

const LandingPageTour: React.FC<{ p: WebsiteShowcaseProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  // Keep the hero headline readable at the catalog frame while still reaching the proof section by the end.
  const scroll = clampInterp(frame, [24, durationInFrames - 18], [0, -360]);
  const sections = safeItems(p.features, ["Strategy", "Design", "Ship", "Grow"]);
  return <AbsoluteFill style={{ padding: "70px 120px", boxSizing: "border-box" }}>
    <div style={{ position: "absolute", left: 120, top: 35, color: `${pal.text}95`, font: `700 14px ${MONO}`, letterSpacing: ".16em" }}>SCROLL STORY / 02</div>
    <BrowserFrame pal={pal} style={{ height: 900 }} url={p.url ?? "studio.example/launch"}>
      <div style={{ height: 844, overflow: "hidden", background: pal.bg }}><div style={{ transform: `translateY(${scroll}px)` }}>
        <SiteNav p={p} pal={pal} />
        <div style={{ minHeight: 400, padding: "55px 70px", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 55 }}><div style={{ flex: "1 1 0", minWidth: 0, overflow: "hidden" }}><Headline p={p} pal={pal} eyebrow="SCROLL TO DISCOVER" /></div><MediaPanel p={p} pal={pal} index={0} style={{ flex: "0 0 470px", width: 470, maxWidth: "100%", height: 300, borderRadius: 20 }} label="SECTION / HERO" /></div>
        <div style={{ minHeight: 280, padding: "30px 70px", boxSizing: "border-box", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>{sections.slice(0, 4).map((item, i) => <div key={item} style={{ padding: 20, borderRadius: 15, border: `1px solid ${pal.text}20`, background: `${pal.text}0d`, color: pal.text, opacity: clampInterp(frame, [20 + i * 8, 34 + i * 8], [0, 1]), transform: `translateY(${clampInterp(frame, [20 + i * 8, 34 + i * 8], [35, 0])}px)` }}><div style={{ color: pal.accent, font: `800 13px ${MONO}` }}>0{i + 1}</div><div style={{ marginTop: 30, font: `800 19px ${FONT}` }}>{item}</div></div>)}</div>
        <MediaPanel p={p} pal={pal} index={1} style={{ height: 350, margin: "0 70px 50px", borderRadius: 20 }} label="SECTION / PROOF" />
      </div></div>
    </BrowserFrame>
    <div style={{ position: "absolute", right: 122, bottom: 45 }}><ProgressRail pal={pal} count={4} active={Math.min(3, Math.floor(frame / Math.max(1, durationInFrames / 4)))} /></div>
  </AbsoluteFill>;
};

const FeatureSectionSequence: React.FC<{ p: WebsiteShowcaseProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const features = safeItems(p.features, ["Automate", "Collaborate", "Measure", "Scale"]);
  const active = Math.min(features.length - 1, Math.floor((frame / durationInFrames) * features.length));
  return <AbsoluteFill style={{ padding: "115px", boxSizing: "border-box", flexDirection: "row", alignItems: "center", gap: 90 }}>
    <div style={{ width: 490 }}><div style={{ color: pal.accent, font: `900 15px ${MONO}`, letterSpacing: ".22em" }}>FEATURE SEQUENCE / 03</div><div style={{ marginTop: 18, color: pal.text, font: `900 62px/.98 ${FONT}`, letterSpacing: "-.06em" }}>{features[active]}</div><div style={{ marginTop: 22, color: `${pal.text}aa`, font: `22px/1.4 ${FONT}` }}>{p.subheadline}</div><div style={{ display: "flex", gap: 9, marginTop: 40 }}>{features.map((feature, i) => <div key={feature} style={{ width: 65, height: 5, borderRadius: 5, background: i === active ? pal.accent : `${pal.text}35` }} />)}</div></div>
    <BrowserFrame pal={pal} compact style={{ flex: 1, height: 650 }} url={p.url ?? "app.example/features"}><div style={{ height: 592, background: pal.bg, padding: 25, boxSizing: "border-box" }}><SiteNav p={p} pal={pal} compact /><div style={{ position: "relative", height: 465 }}><MediaPanel p={p} pal={pal} index={active} style={{ position: "absolute", inset: 0, borderRadius: 15, opacity: clampInterp(frame % Math.max(1, durationInFrames / features.length), [0, 8, 17], [0, 1, 1]) }} label={`FEATURE / 0${active + 1}`} /><div style={{ position: "absolute", right: 20, bottom: 20, padding: "12px 16px", borderRadius: 9, background: `${pal.bg}dd`, color: pal.text, font: `700 14px ${FONT}` }}>{p.cta} <span style={{ color: pal.accent, marginLeft: 8 }}>→</span></div></div></div></BrowserFrame>
  </AbsoluteFill>;
};

const ResponsiveBreakpoint: React.FC<{ p: WebsiteShowcaseProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const order = ["DESKTOP", "TABLET", "MOBILE"];
  return <AbsoluteFill style={{ padding: "90px 100px", boxSizing: "border-box" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 35 }}><Headline p={p} pal={pal} eyebrow="ONE SYSTEM / EVERY SCREEN" /><div style={{ color: pal.accent, font: `800 17px ${MONO}` }}>RESPONSIVE READY</div></div><div style={{ display: "flex", alignItems: "end", justifyContent: "center", gap: 24, height: 620 }}>{order.map((label, i) => { const active = Math.min(2, Math.floor(frame / 42)); const widths = [570, 370, 205]; const heights = [390, 480, 540]; const scale = clampInterp(frame, [i * 8, i * 8 + 18], [.75, 1]); return <div key={label} style={{ width: widths[i], height: heights[i], transform: `scale(${scale}) translateY(${active === i ? -22 : 0}px)`, transformOrigin: "bottom center", opacity: clampInterp(frame, [i * 8, i * 8 + 16], [0, 1]) }}><BrowserFrame pal={pal} compact={i > 0} url={`${label.toLowerCase()}.example`} style={{ height: "100%" }}><div style={{ height: "100%", background: pal.bg, padding: i === 0 ? 18 : 9, boxSizing: "border-box" }}><SiteNav p={p} pal={pal} compact={i > 0} /><MediaPanel p={p} pal={pal} index={i} style={{ height: i === 0 ? 260 : i === 1 ? 325 : 365, borderRadius: 10 }} label={label} /></div></BrowserFrame><div style={{ textAlign: "center", marginTop: 15, color: i === active ? pal.accent : `${pal.text}75`, font: `800 14px ${MONO}`, letterSpacing: ".12em" }}>{label}</div></div>; })}</div></AbsoluteFill>;
};

const TabSwitching: React.FC<{ p: WebsiteShowcaseProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const tabs = safeItems(p.features, ["Overview", "Analytics", "Integrations", "Security"]);
  const active = Math.min(tabs.length - 1, Math.floor(frame / Math.max(1, 48)) % tabs.length);
  return <AbsoluteFill style={{ padding: "100px 150px", boxSizing: "border-box", alignItems: "center" }}><div style={{ width: "100%", maxWidth: 1500 }}><div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", marginBottom: 28 }}><Headline p={p} pal={pal} eyebrow="INTERACTIVE TOUR" /><div style={{ color: `${pal.text}8f`, font: `700 14px ${MONO}` }}>TAB {String(active + 1).padStart(2, "0")} / {String(tabs.length).padStart(2, "0")}</div></div><BrowserFrame pal={pal} url={p.url ?? "dashboard.example/workspace"}><div style={{ height: 730, background: pal.bg, padding: "0 40px 40px", boxSizing: "border-box" }}><SiteNav p={p} pal={pal} /><div style={{ display: "flex", gap: 8, padding: "15px 0", borderBottom: `1px solid ${pal.text}25` }}>{tabs.map((tab, i) => <div key={tab} style={{ padding: "12px 18px", borderRadius: "8px 8px 0 0", color: i === active ? pal.text : `${pal.text}72`, background: i === active ? `${pal.primary}35` : "transparent", borderBottom: `3px solid ${i === active ? pal.accent : "transparent"}`, font: `800 16px ${FONT}` }}>{tab}</div>)}</div><div style={{ marginTop: 30, display: "grid", gridTemplateColumns: "1.25fr .75fr", gap: 26, height: 490 }}><MediaPanel p={p} pal={pal} index={active} style={{ borderRadius: 17 }} label={`TAB / ${tabs[active]}`} /><div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{["Fast setup", "Shared context", "Clear actions"].map((item, i) => <div key={item} style={{ flex: 1, padding: 22, borderRadius: 14, background: `${pal.text}0d`, border: `1px solid ${pal.text}20`, color: pal.text, font: `700 18px ${FONT}` }}><div style={{ color: pal.accent, font: `900 12px ${MONO}` }}>0{i + 1}</div><div style={{ marginTop: 25 }}>{item}</div><div style={{ marginTop: 14, height: 5, width: `${52 + i * 16}%`, background: pal.primary, borderRadius: 8 }} /></div>)}</div></div></div></BrowserFrame></div></AbsoluteFill>;
};

const EcommerceProductPage: React.FC<{ p: WebsiteShowcaseProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const cart = clampInterp(frame, [54, 78], [0, 1]);
  const name = p.siteName || "Atelier";
  return <AbsoluteFill style={{ padding: "75px 120px", boxSizing: "border-box" }}><BrowserFrame pal={pal} url={p.url ?? "shop.example/product"}><div style={{ height: 840, background: "#faf9f6", color: "#202020" }}><div style={{ height: 75, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 42px", boxSizing: "border-box", borderBottom: "1px solid #20202022", font: `800 17px ${FONT}` }}><span style={{ letterSpacing: ".12em" }}>{name.toUpperCase()}</span><span style={{ color: "#777", fontSize: 13 }}>NEW ARRIVALS　STUDIO　ABOUT</span><span style={{ padding: "10px 14px", border: "1px solid #222", borderRadius: 99 }}>BAG (0{Math.round(cart)})</span></div><div style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 55, padding: "55px 65px" }}><MediaPanel p={p} pal={pal} index={0} style={{ height: 570, borderRadius: 5 }} label="PRODUCT / MAIN" /><div style={{ paddingTop: 35 }}><div style={{ color: "#8a5b37", font: `800 13px ${MONO}`, letterSpacing: ".18em" }}>FEATURED OBJECT</div><div style={{ marginTop: 18, font: `900 52px/.97 ${FONT}`, letterSpacing: "-.06em" }}>{p.headline}</div><div style={{ marginTop: 18, font: `22px ${FONT}`, color: "#67625c" }}>{p.subheadline}</div><div style={{ marginTop: 35, font: `800 28px ${FONT}` }}>{p.price ?? "$148"}</div><div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 12 }}>{safeItems(p.features, ["Hand finished", "Ships in 48 hours", "One year warranty"]).slice(0, 3).map((item) => <div key={item} style={{ padding: "13px 0", borderTop: "1px solid #2223", font: `600 15px ${FONT}` }}>＋ {item}</div>)}</div><div style={{ marginTop: 35, padding: "17px 20px", textAlign: "center", background: "#202020", color: "#fff", borderRadius: 3, font: `800 15px ${FONT}`, transform: `scale(${interpolate(cart, [0, 1], [1, 1.03])})` }}>ADD TO BAG　→</div></div></div></div></BrowserFrame></AbsoluteFill>;
};

const SaaSDashboardTour: React.FC<{ p: WebsiteShowcaseProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const draw = clampInterp(frame, [20, 72], [0, 1]);
  const metrics = ["98.4%", "+24.8%", "12.6k", "4.8/5"];
  return <AbsoluteFill style={{ padding: "76px 100px", boxSizing: "border-box" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 25, minWidth: 0 }}><div style={{ minWidth: 0, color: pal.text, font: `900 26px ${FONT}`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.siteName} <span style={{ color: pal.accent }}>/</span> Analytics</div><div style={{ flex: "0 0 auto", marginLeft: 24, color: `${pal.text}88`, font: `700 14px ${MONO}` }}>LIVE WORKSPACE · 09:41</div></div><div style={{ display: "grid", gridTemplateColumns: "235px minmax(0, 1fr)", minWidth: 0, height: 770, borderRadius: 18, overflow: "hidden", background: pal.bg, border: `1px solid ${pal.text}20`, boxShadow: "0 35px 80px #0008" }}><div style={{ minWidth: 0, boxSizing: "border-box", padding: 25, background: `${pal.primary}15`, borderRight: `1px solid ${pal.text}1c`, color: `${pal.text}a5`, font: `700 15px ${FONT}` }}><div style={{ color: pal.text, fontSize: 20, fontWeight: 900, marginBottom: 38, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.siteName}</div>{["Overview", "Reports", "Customers", "Automations", "Settings"].map((item, i) => <div key={item} style={{ padding: "13px 12px", marginBottom: 5, borderRadius: 8, background: i === 0 ? `${pal.accent}32` : "transparent", color: i === 0 ? pal.text : `${pal.text}82`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item}</div>)}</div><div style={{ minWidth: 0, boxSizing: "border-box", overflow: "hidden", padding: 34, color: pal.text, fontFamily: FONT }}><div style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", font: `800 28px ${FONT}` }}>{p.headline}</div><div style={{ minWidth: 0, marginTop: 8, color: `${pal.text}82`, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.subheadline}</div><div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 13, minWidth: 0, marginTop: 28 }}>{metrics.map((metric, i) => <div key={metric} style={{ minWidth: 0, boxSizing: "border-box", overflow: "hidden", padding: 17, borderRadius: 11, background: `${pal.text}0b`, border: `1px solid ${pal.text}18` }}><div style={{ color: `${pal.text}80`, font: `700 11px ${MONO}`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{["RETENTION", "GROWTH", "ACTIVE", "NPS"][i]}</div><div style={{ marginTop: 14, font: `900 27px ${FONT}`, whiteSpace: "nowrap" }}>{metric}</div></div>)}</div><div style={{ minWidth: 0, boxSizing: "border-box", overflow: "hidden", marginTop: 22, padding: 22, height: 335, borderRadius: 13, background: `${pal.text}0b`, border: `1px solid ${pal.text}18` }}><div style={{ display: "flex", minWidth: 0, justifyContent: "space-between", gap: 16, font: `800 15px ${FONT}` }}><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Performance over time</span><span style={{ flex: "0 0 auto", color: pal.accent, font: `700 12px ${MONO}` }}>LAST 30 DAYS</span></div><svg viewBox="0 0 800 250" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: 250, marginTop: 20 }}><path d="M0 205 C70 180 78 140 150 170 S245 120 310 145 S395 75 465 115 S555 45 615 80 S720 28 800 44" fill="none" stroke={pal.accent} strokeWidth="6" strokeDasharray="1100" strokeDashoffset={1100 * (1 - draw)} /><path d="M0 205 C70 180 78 140 150 170 S245 120 310 145 S395 75 465 115 S555 45 615 80 S720 28 800 44 V250 H0Z" fill={`${pal.primary}28`} opacity={draw} /></svg></div></div></div></AbsoluteFill>;
};

const PortfolioReel: React.FC<{ p: WebsiteShowcaseProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, 180], [0, -720]);
  const projects = safeItems(p.features, ["Arc / Identity", "Field Notes", "North / Product", "Studio 24"]);
  return <AbsoluteFill style={{ padding: "100px 110px", boxSizing: "border-box", overflow: "hidden" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}><Headline p={p} pal={pal} eyebrow="SELECTED WORK" /><div style={{ color: `${pal.text}82`, font: `700 14px ${MONO}` }}>DRAG / SCROLL / EXPLORE</div></div><div style={{ display: "flex", gap: 24, marginTop: 50, transform: `translateX(${x}px)` }}>{projects.concat(projects.slice(0, 2)).map((project, i) => <div key={`${project}-${i}`} style={{ flex: "0 0 480px", color: pal.text, fontFamily: FONT }}><MediaPanel p={p} pal={pal} index={i} style={{ height: 410, borderRadius: 16, filter: `hue-rotate(${i * 18}deg)` }} label={`PROJECT / ${String(i + 1).padStart(2, "0")}`} /><div style={{ marginTop: 15, display: "flex", justifyContent: "space-between", font: `800 19px ${FONT}` }}><span>{project}</span><span style={{ color: pal.accent, font: `700 13px ${MONO}` }}>VIEW ↗</span></div></div>)}</div><div style={{ position: "absolute", left: 110, right: 110, bottom: 70, height: 1, background: `${pal.text}32` }}><div style={{ width: "36%", height: 3, background: pal.accent, transform: `translateX(${clampInterp(frame, [0, 180], [0, 100])}%)` }} /></div></AbsoluteFill>;
};

const BeforeAfterRedesign: React.FC<{ p: WebsiteShowcaseProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const split = clampInterp(frame, [20, 62], [43, 62]);
  return <AbsoluteFill style={{ padding: "88px 110px", boxSizing: "border-box" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 30 }}><Headline p={p} pal={pal} eyebrow="DESIGN EVOLUTION" /><div style={{ color: pal.accent, font: `800 14px ${MONO}` }}>BEFORE → AFTER</div></div><div style={{ position: "relative", height: 630, overflow: "hidden", borderRadius: 18, boxShadow: "0 35px 80px #0009", background: "#e9ebee" }}><div style={{ position: "absolute", inset: 0, background: "#e9ebee", color: "#26282c", padding: 45, boxSizing: "border-box" }}><div style={{ font: `900 27px ${FONT}` }}>OLD SITE</div><div style={{ marginTop: 28, height: 70, background: "#d4d7dc" }} /><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 32 }}>{[0, 1, 2, 3].map((i) => <div key={i} style={{ height: 175, background: i % 2 ? "#d1d5da" : "#c2c7cd", padding: 18, boxSizing: "border-box" }}><div style={{ width: "72%", height: 12, background: "#9da3ab" }} /><div style={{ marginTop: 18, width: "90%", height: 8, background: "#b1b6bc" }} /></div>)}</div></div><div style={{ position: "absolute", inset: 0, left: `${split}%`, background: pal.bg, color: pal.text, overflow: "hidden", padding: 45, boxSizing: "border-box" }}><div style={{ font: `900 27px ${FONT}` }}>{p.siteName.toUpperCase()}</div><div style={{ marginTop: 28, height: 70, borderRadius: 12, background: `linear-gradient(90deg, ${pal.primary}, ${pal.accent})` }} /><div style={{ marginTop: 32, font: `900 34px ${FONT}` }}>{p.headline}</div><div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 13 }}>{[0, 1, 2].map((i) => <MediaPanel key={i} p={p} pal={pal} index={i} style={{ height: 190, borderRadius: 12 }} label={`NEW / 0${i + 1}`} />)}</div></div><div style={{ position: "absolute", top: 0, bottom: 0, left: `${split}%`, width: 4, background: pal.accent, boxShadow: "0 0 0 1px #fff8" }}><div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 52, height: 52, borderRadius: 99, background: pal.accent, color: pal.bg, display: "flex", alignItems: "center", justifyContent: "center", font: `900 21px ${FONT}` }}>↔</div></div></div></AbsoluteFill>;
};

const MultiPageMontage: React.FC<{ p: WebsiteShowcaseProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const pages = ["HOME", "PRODUCT", "STORY", "CONTACT"];
  return <AbsoluteFill style={{ padding: "100px 95px", boxSizing: "border-box", alignItems: "center" }}><div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 38 }}><Headline p={p} pal={pal} eyebrow="A COMPLETE DIGITAL WORLD" /><div style={{ color: `${pal.text}82`, font: `700 14px ${MONO}` }}>MULTI-PAGE / 010</div></div><div style={{ position: "relative", width: 1470, height: 610 }}>{pages.map((page, i) => { const dx = (i - 1.5) * 345; const lift = Math.abs(i - 1.5) * 24; const reveal = spring({ frame: Math.max(0, frame - i * 8), fps: 30, config: { damping: 15, stiffness: 115 } }); return <div key={page} style={{ position: "absolute", left: "50%", top: lift, width: 510, transformOrigin: "center bottom", transform: `translateX(calc(-50% + ${dx}px)) translateY(${interpolate(reveal, [0, 1], [180, 0])}px) rotate(${(i - 1.5) * 4}deg) scale(${interpolate(reveal, [0, 1], [.78, 1])})`, zIndex: i, opacity: reveal }}><BrowserFrame pal={pal} compact url={`${page.toLowerCase()}.example`}><div style={{ height: 420, padding: 14, boxSizing: "border-box", background: pal.bg }}><SiteNav p={p} pal={pal} compact /><MediaPanel p={p} pal={pal} index={i} style={{ height: 315, borderRadius: 10 }} label={page} /></div></BrowserFrame></div>; })}</div><div style={{ color: pal.accent, font: `800 14px ${MONO}`, letterSpacing: ".16em" }}>{p.cta}　·　{p.url ?? "YOURBRAND.COM"}</div></AbsoluteFill>;
};

const VARIANTS: Record<WebsiteVariant, React.FC<{ p: WebsiteShowcaseProps; pal: Palette }>> = {
  "browser-hero-reveal": BrowserHeroReveal,
  "landing-page-tour": LandingPageTour,
  "feature-section-sequence": FeatureSectionSequence,
  "responsive-breakpoint": ResponsiveBreakpoint,
  "tab-switching": TabSwitching,
  "ecommerce-product-page": EcommerceProductPage,
  "saas-dashboard-tour": SaaSDashboardTour,
  "portfolio-reel": PortfolioReel,
  "before-after-redesign": BeforeAfterRedesign,
  "multi-page-montage": MultiPageMontage,
};

export const WebsiteShowcaseTemplate: React.FC<WebsiteShowcaseProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? BrowserHeroReveal;
  const quiet = props.variant === "ecommerce-product-page" || props.variant === "before-after-redesign";
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <AbsoluteFill style={{ backgroundColor: pal.bg }}>
    {!quiet && <GradientMeshBackground palette={pal} blobs={props.variant === "saas-dashboard-tour" ? 3 : 5} speed={0.45} />}
    <FadeEdges inFrames={10} outFrames={13}><div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><Variant p={props} pal={pal} /></div></FadeEdges>
  </AbsoluteFill>;
};

const familyCast = (c: React.FC<WebsiteShowcaseProps>) => c as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "website-browser-hero-reveal": familyCast(WebsiteShowcaseTemplate),
  "website-landing-page-tour": familyCast(WebsiteShowcaseTemplate),
  "website-feature-section-sequence": familyCast(WebsiteShowcaseTemplate),
  "website-responsive-breakpoint": familyCast(WebsiteShowcaseTemplate),
  "website-tab-switching": familyCast(WebsiteShowcaseTemplate),
  "website-ecommerce-product-page": familyCast(WebsiteShowcaseTemplate),
  "website-saas-dashboard-tour": familyCast(WebsiteShowcaseTemplate),
  "website-portfolio-reel": familyCast(WebsiteShowcaseTemplate),
  "website-before-after-redesign": familyCast(WebsiteShowcaseTemplate),
  "website-multi-page-montage": familyCast(WebsiteShowcaseTemplate),
};
