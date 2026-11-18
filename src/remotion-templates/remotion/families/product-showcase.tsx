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
 * FAMILY: product-showcase
 * Ten procedural product reveal systems. Every device, package and object is
 * drawn with CSS/SVG so the templates render without external assets.
 */

type ProductVariant =
  | "laptop-reveal"
  | "phone-orbit"
  | "browser-scroll"
  | "unboxing"
  | "feature-chips"
  | "turntable"
  | "spec-sheet"
  | "price-tag"
  | "ab-winner"
  | "hero-parallax";

export interface ProductShowcaseProps {
  variant: ProductVariant;
  productName: string;
  tagline: string;
  features: string[];
  paletteName: string;
  price?: string;
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';

const Copy: React.FC<{
  p: ProductShowcaseProps;
  pal: Palette;
  align?: "left" | "center";
  eyebrow?: string;
}> = ({ p, pal, align = "left", eyebrow = "INTRODUCING" }) => {
  const frame = useCurrentFrame();
  const y = clampInterp(frame, [8, 28], [34, 0]);
  return (
    <div style={{ fontFamily: FONT, textAlign: align, color: pal.text, opacity: clampInterp(frame, [5, 20], [0, 1]), transform: `translateY(${y}px)` }}>
      <div style={{ color: pal.accent, fontSize: 19, fontWeight: 800, letterSpacing: "0.24em" }}>{eyebrow}</div>
      <div style={{ marginTop: 12, fontSize: 76, lineHeight: 0.96, fontWeight: 850, letterSpacing: "-0.055em" }}>{p.productName}</div>
      <div style={{ marginTop: 20, color: `${pal.text}b8`, fontSize: 27, lineHeight: 1.35 }}>{p.tagline}</div>
    </div>
  );
};

const UiBlocks: React.FC<{ pal: Palette; compact?: boolean }> = ({ pal, compact = false }) => (
  <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr 1fr" : "1.35fr 0.65fr", gap: compact ? 9 : 16, width: "100%", height: "100%", padding: compact ? 14 : 24, boxSizing: "border-box" }}>
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? 8 : 14 }}>
      <div style={{ width: "54%", height: compact ? 8 : 13, borderRadius: 9, background: pal.primary }} />
      <div style={{ width: "84%", height: compact ? 5 : 8, borderRadius: 9, background: `${pal.text}3a` }} />
      <div style={{ flex: 1, borderRadius: compact ? 8 : 15, background: `linear-gradient(145deg, ${pal.primary}d9, ${pal.secondary}72)` }} />
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? 8 : 14 }}>
      {[0, 1, 2].map((i) => <div key={i} style={{ flex: 1, minHeight: 12, borderRadius: compact ? 7 : 13, border: `1px solid ${pal.text}25`, background: `${pal.text}${i === 0 ? "18" : "0d"}` }} />)}
    </div>
  </div>
);

const Laptop: React.FC<{ pal: Palette; open: number }> = ({ pal, open }) => (
  <div style={{ width: 760, height: 470, position: "relative", perspective: 1300 }}>
    <div style={{ position: "absolute", left: 40, right: 40, top: 5, height: 410, borderRadius: "24px 24px 13px 13px", padding: 13, boxSizing: "border-box", background: "linear-gradient(145deg,#5f6571,#16191f)", boxShadow: "0 45px 90px #0009", transformOrigin: "bottom center", transform: `rotateX(${interpolate(open, [0, 1], [84, 0])}deg)` }}>
      <div style={{ width: "100%", height: "100%", overflow: "hidden", borderRadius: 13, background: pal.bg, border: "1px solid #ffffff20" }}><UiBlocks pal={pal} /></div>
      <div style={{ position: "absolute", top: 5, left: "50%", width: 7, height: 7, borderRadius: 9, background: "#090b0d" }} />
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 22, height: 25, borderRadius: "3px 3px 22px 22px", background: "linear-gradient(#9da3ad,#3a3e46)", transform: "perspective(600px) rotateX(58deg)", boxShadow: "0 24px 35px #0007" }} />
    <div style={{ position: "absolute", left: 310, bottom: 25, width: 140, height: 9, borderRadius: "0 0 10px 10px", background: "#252932" }} />
  </div>
);

const Phone: React.FC<{ pal: Palette }> = ({ pal }) => (
  <div style={{ width: 268, height: 540, borderRadius: 48, padding: 12, boxSizing: "border-box", background: "linear-gradient(135deg,#aeb5c0,#1c2027 38%,#727985)", boxShadow: "0 50px 90px #000a" }}>
    <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 38, overflow: "hidden", background: pal.bg, border: "2px solid #050608" }}>
      <div style={{ position: "absolute", zIndex: 3, width: 82, height: 21, top: 9, left: "50%", transform: "translateX(-50%)", borderRadius: 20, background: "#050608" }} />
      <UiBlocks pal={pal} compact />
    </div>
  </div>
);

const Bottle: React.FC<{ pal: Palette; label?: string }> = ({ pal, label = "FORM" }) => (
  <div style={{ width: 250, height: 490, position: "relative", filter: "drop-shadow(0 42px 32px #0008)" }}>
    <div style={{ position: "absolute", top: 0, left: 80, width: 90, height: 75, borderRadius: "13px 13px 5px 5px", background: "linear-gradient(90deg,#252932,#9299a6,#292d35)" }} />
    <div style={{ position: "absolute", top: 60, left: 25, width: 200, height: 420, borderRadius: "72px 72px 55px 55px / 55px 55px 42px 42px", background: `linear-gradient(105deg,${pal.primary}bb 0%,${pal.secondary}ee 43%,${pal.primary}a8 70%,${pal.bg} 100%)`, border: "2px solid #ffffff4f", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 24, top: 18, width: 26, height: 330, borderRadius: 30, background: "linear-gradient(#fff8,transparent)" }} />
      <div style={{ position: "absolute", left: 20, right: 20, top: 154, height: 125, display: "flex", justifyContent: "center", alignItems: "center", background: `${pal.bg}d9`, border: `1px solid ${pal.text}45`, color: pal.text, fontFamily: FONT, fontWeight: 900, letterSpacing: "0.18em", fontSize: 25 }}>{label.slice(0, 10).toUpperCase()}</div>
    </div>
  </div>
);

// 01 — laptop screen reveal
const LaptopReveal: React.FC<{ p: ProductShowcaseProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const open = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 16, stiffness: 105 } });
  return (
    <AbsoluteFill style={{ padding: "120px 110px", boxSizing: "border-box", flexDirection: "row", alignItems: "center", gap: 70 }}>
      <div style={{ width: "38%" }}><Copy p={p} pal={pal} eyebrow="WORK, REIMAGINED" /></div>
      <div style={{ flex: 1, transform: `translateY(${clampInterp(frame, [0, 26], [120, 0])}px) scale(.88)` }}><Laptop pal={pal} open={open} /></div>
      <div style={{ position: "absolute", left: "50%", right: 80, bottom: 76, display: "flex", gap: 14 }}>
        {p.features.slice(0, 3).map((f, i) => <div key={f} style={{ padding: "10px 17px", borderRadius: 99, background: `${pal.text}12`, border: `1px solid ${pal.text}28`, color: pal.text, font: `600 16px ${FONT}`, opacity: clampInterp(frame, [40 + i * 6, 50 + i * 6], [0, 1]) }}>{f}</div>)}
      </div>
    </AbsoluteFill>
  );
};

// 02 — phone rotate-in with orbiting callouts
const PhoneOrbit: React.FC<{ p: ProductShowcaseProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: Math.max(0, frame - 4), fps, config: { damping: 13, stiffness: 90 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", perspective: 1200 }}>
      <div style={{ position: "absolute", left: 110, top: 120, width: 480 }}><Copy p={p} pal={pal} eyebrow="IN YOUR POCKET" /></div>
      <div style={{ transform: `translateX(250px) rotateY(${interpolate(enter, [0, 1], [-105, -12])}deg) rotateZ(${interpolate(enter, [0, 1], [12, -2])}deg) scale(${interpolate(enter, [0, 1], [.65, 1])})` }}><Phone pal={pal} /></div>
      {p.features.slice(0, 3).map((f, i) => {
        const angle = frame * 0.018 + i * Math.PI * 2 / 3;
        const x = 250 + Math.cos(angle) * 330;
        const y = Math.sin(angle) * 210;
        return <div key={f} style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(${x}px,${y}px)`, padding: "13px 18px", borderRadius: 14, background: `${pal.bg}e8`, border: `1px solid ${pal.primary}75`, boxShadow: `0 12px 34px ${pal.bg}`, color: pal.text, font: `700 17px ${FONT}`, opacity: clampInterp(frame, [25 + i * 7, 38 + i * 7], [0, 1]) }}><span style={{ color: pal.accent, marginRight: 9 }}>●</span>{f}</div>;
      })}
    </AbsoluteFill>
  );
};

// 03 — browser window scroll-through
const BrowserScroll: React.FC<{ p: ProductShowcaseProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scroll = clampInterp(frame, [30, durationInFrames - 20], [0, -540]);
  return (
    <AbsoluteFill style={{ padding: "72px 100px", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", height: 135 }}>
        <Copy p={p} pal={pal} eyebrow="PRODUCT TOUR" />
        <div style={{ color: pal.secondary, font: `600 19px ${FONT}`, paddingBottom: 15 }}>{p.features.join("  ·  ")}</div>
      </div>
      <div style={{ marginTop: 35, height: 710, borderRadius: 22, overflow: "hidden", background: "#eef1f5", boxShadow: "0 35px 90px #0008", transform: `translateY(${clampInterp(frame, [0, 24], [140, 0])}px)` }}>
        <div style={{ height: 58, display: "flex", alignItems: "center", gap: 10, padding: "0 20px", background: "#dfe3e9", borderBottom: "1px solid #c7ccd4" }}>
          {["#ff605c", "#ffbd44", "#00ca4e"].map((c) => <div key={c} style={{ width: 14, height: 14, borderRadius: 14, background: c }} />)}
          <div style={{ marginLeft: 25, width: "56%", height: 30, borderRadius: 9, background: "#fff", color: "#767d87", font: `14px ${FONT}`, display: "flex", alignItems: "center", paddingLeft: 17 }}>app.{p.productName.toLowerCase().replace(/\s+/g, "")}.com</div>
        </div>
        <div style={{ height: 652, overflow: "hidden", background: pal.bg }}>
          <div style={{ height: 1190, transform: `translateY(${scroll}px)`, padding: "45px 55px", boxSizing: "border-box" }}>
            <div style={{ color: pal.text, font: `800 54px ${FONT}`, letterSpacing: "-.04em" }}>{p.tagline}</div>
            <div style={{ marginTop: 35, height: 360, borderRadius: 20 }}><UiBlocks pal={pal} /></div>
            <div style={{ marginTop: 35, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
              {p.features.slice(0, 3).map((f, i) => <div key={f} style={{ height: 220, borderRadius: 18, padding: 25, background: `${pal.text}10`, border: `1px solid ${pal.text}20`, color: pal.text, font: `700 24px ${FONT}` }}><div style={{ width: 45, height: 45, borderRadius: 12, background: [pal.primary, pal.secondary, pal.accent][i], marginBottom: 58 }} />{f}</div>)}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 04 — unboxing lid lift
const Unboxing: React.FC<{ p: ProductShowcaseProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const lift = clampInterp(frame, [12, 52], [0, 1]);
  const product = clampInterp(frame, [43, 76], [0, 1]);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", perspective: 1200 }}>
      <div style={{ position: "absolute", left: 120, top: 155, width: 470 }}><Copy p={p} pal={pal} eyebrow="THE UNBOXING" /></div>
      <div style={{ position: "relative", width: 570, height: 480, transform: "translateX(280px) rotateX(5deg)" }}>
        <div style={{ position: "absolute", left: 100, top: 180, width: 370, height: 255, background: `linear-gradient(145deg,${pal.secondary},${pal.primary})`, clipPath: "polygon(0 0,100% 0,88% 100%,12% 100%)", boxShadow: "0 55px 65px #0008" }} />
        <div style={{ position: "absolute", zIndex: 1, left: 188, top: 95, transform: `translateY(${interpolate(product, [0, 1], [150, -80])}px) scale(${interpolate(product, [0, 1], [.72, .9])})`, opacity: product }}><Bottle pal={pal} label={p.productName} /></div>
        <div style={{ position: "absolute", zIndex: 3, left: 70, top: 137, width: 430, height: 105, borderRadius: 14, background: `linear-gradient(160deg,${pal.primary},${pal.secondary})`, border: `2px solid ${pal.text}40`, transformOrigin: "center bottom", transform: `translateY(${-lift * 220}px) rotateX(${-lift * 38}deg) rotateZ(${lift * 5}deg)`, boxShadow: "0 20px 50px #0007" }}>
          <div style={{ color: pal.text, font: `900 24px ${FONT}`, textAlign: "center", paddingTop: 35, letterSpacing: ".2em" }}>{p.productName.toUpperCase()}</div>
        </div>
      </div>
      <div style={{ position: "absolute", right: 90, bottom: 80, color: `${pal.text}aa`, font: `18px ${FONT}` }}>{p.features.slice(0, 3).join("  /  ")}</div>
    </AbsoluteFill>
  );
};

const ChipIcon: React.FC<{ index: number; color: string }> = ({ index, color }) => (
  <svg width="46" height="46" viewBox="0 0 46 46">
    <rect x="1" y="1" width="44" height="44" rx="13" fill={`${color}28`} stroke={`${color}88`} />
    {index % 3 === 0 ? <path d="M13 24l7 7 14-17" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" /> : index % 3 === 1 ? <path d="M13 30l8-9 6 5 7-10" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" /> : <circle cx="23" cy="23" r="9" fill="none" stroke={color} strokeWidth="4" />}
  </svg>
);

// 05 — feature list icon chips sliding
const FeatureChips: React.FC<{ p: ProductShowcaseProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ padding: "110px 130px", boxSizing: "border-box", flexDirection: "row", alignItems: "center", gap: 120 }}>
      <div style={{ width: 650 }}><Copy p={p} pal={pal} eyebrow="BUILT DIFFERENT" /><div style={{ marginTop: 35, width: 95, height: 7, borderRadius: 9, background: pal.accent }} /></div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 22 }}>
        {p.features.slice(0, 5).map((feature, i) => {
          const t = clampInterp(frame, [8 + i * 8, 27 + i * 8], [0, 1]);
          const color = [pal.primary, pal.secondary, pal.accent][i % 3];
          return <div key={feature} style={{ height: 92, display: "flex", alignItems: "center", gap: 22, padding: "0 25px", borderRadius: 20, background: `${pal.text}0d`, border: `1px solid ${pal.text}24`, boxShadow: `0 15px 35px ${pal.bg}80`, opacity: t, transform: `translateX(${interpolate(t, [0, 1], [440 * (i % 2 ? 1 : -1), 0])}px)` }}><ChipIcon index={i} color={color} /><span style={{ color: pal.text, font: `750 25px ${FONT}` }}>{feature}</span><span style={{ marginLeft: "auto", color, font: `20px ${MONO}` }}>0{i + 1}</span></div>;
        })}
      </div>
    </AbsoluteFill>
  );
};

// 06 — turntable with sheen sweep
const Turntable: React.FC<{ p: ProductShowcaseProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const turn = frame * 1.15;
  const sheen = ((frame * 1.7) % 120) - 35;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", left: 110, top: 140, width: 500 }}><Copy p={p} pal={pal} eyebrow="EVERY ANGLE" /></div>
      <div style={{ position: "absolute", left: 95, bottom: 145, color: pal.secondary, font: `600 18px ${FONT}`, display: "flex", gap: 24 }}>{p.features.slice(0, 3).map((f) => <span key={f}>— {f}</span>)}</div>
      <div style={{ transform: "translateX(310px)", position: "relative", width: 650, height: 650 }}>
        <div style={{ position: "absolute", left: 50, bottom: 55, width: 550, height: 170, borderRadius: "50%", background: `radial-gradient(ellipse,${pal.secondary},${pal.primary} 52%,${pal.bg})`, border: `3px solid ${pal.text}36`, transform: `rotate(${turn * .16}deg)`, boxShadow: `0 55px 75px #0009, inset 0 15px 30px ${pal.text}1a` }} />
        <div style={{ position: "absolute", left: 200, top: 55, transform: `rotateY(${turn}deg)`, transformStyle: "preserve-3d" }}><Bottle pal={pal} label={p.productName} /></div>
        <div style={{ position: "absolute", pointerEvents: "none", left: 195, top: 100, width: 250, height: 430, overflow: "hidden", borderRadius: 80, transform: `rotateY(${turn}deg)` }}><div style={{ width: 70, height: 600, transform: `translateX(${sheen * 4}px) rotate(18deg)`, background: "linear-gradient(90deg,transparent,#fff9,transparent)", filter: "blur(8px)" }} /></div>
      </div>
    </AbsoluteFill>
  );
};

// 07 — spec sheet technical lines
const SpecSheet: React.FC<{ p: ProductShowcaseProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const draw = clampInterp(frame, [8, 68], [0, 1]);
  return (
    <AbsoluteFill style={{ background: pal.bg, fontFamily: MONO, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: .13, backgroundImage: `linear-gradient(${pal.primary} 1px,transparent 1px),linear-gradient(90deg,${pal.primary} 1px,transparent 1px)`, backgroundSize: "42px 42px" }} />
      <svg width="1920" height="1080" style={{ position: "absolute", inset: 0 }}>
        <g fill="none" stroke={pal.primary} strokeWidth="2" opacity=".75" strokeDasharray="1400" strokeDashoffset={1400 * (1 - draw)}>
          <path d="M780 175h640l150 150v520l-150 120H780l-120-120V325z" />
          <path d="M990 220v-80M1210 220v-80M990 150h220M730 420H560M730 690H500M560 420v270" />
          <circle cx="1100" cy="555" r="260" /><circle cx="1100" cy="555" r="190" />
          <path d="M920 365l360 380M1280 365L920 745" />
        </g>
        <g fill={pal.accent}>{[[990,150],[1210,150],[560,420],[560,690]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="6" opacity={draw} />)}</g>
      </svg>
      <div style={{ position: "absolute", left: 90, top: 90, width: 540 }}><Copy p={p} pal={pal} eyebrow="ENGINEERED TO PERFORM" /></div>
      <div style={{ position: "absolute", left: 92, bottom: 105, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "22px 45px", width: 560 }}>
        {p.features.slice(0, 4).map((f, i) => <div key={f} style={{ borderTop: `1px solid ${pal.primary}`, paddingTop: 9, color: pal.text, opacity: clampInterp(frame, [35+i*7,48+i*7],[0,1]) }}><div style={{ color: pal.accent, fontSize: 13 }}>SPEC_0{i+1}</div><div style={{ marginTop: 6, fontSize: 17 }}>{f.toUpperCase()}</div></div>)}
      </div>
      <div style={{ position: "absolute", left: 950, top: 432, width: 300, textAlign: "center", color: pal.text, fontFamily: FONT }}><div style={{ fontSize: 55, fontWeight: 900 }}>{p.productName}</div><div style={{ color: pal.secondary, marginTop: 12 }}>{p.tagline}</div></div>
      <div style={{ position: "absolute", right: 85, bottom: 60, color: `${pal.text}76`, fontSize: 14 }}>DWG / PRODUCT / REV.01</div>
    </AbsoluteFill>
  );
};

// 08 — price tag swing-in
const PriceTag: React.FC<{ p: ProductShowcaseProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 8, stiffness: 72, mass: 1.2 } });
  const rot = interpolate(s, [0, .55, .78, 1], [-72, 17, -8, 0]);
  return (
    <AbsoluteFill style={{ padding: "115px", boxSizing: "border-box", flexDirection: "row", alignItems: "center" }}>
      <div style={{ width: "47%" }}><Copy p={p} pal={pal} eyebrow="LAUNCH OFFER" /><div style={{ color: pal.secondary, font: `20px ${FONT}`, marginTop: 34 }}>{p.features.slice(0,3).map(f=>`✓ ${f}`).join("     ")}</div></div>
      <div style={{ flex: 1, position: "relative", height: 760 }}>
        <div style={{ position: "absolute", left: 220, top: 185, transform: "scale(.84)" }}><Bottle pal={pal} label={p.productName} /></div>
        <div style={{ position: "absolute", left: 40, top: -120, width: 3, height: 405, background: `${pal.text}b5`, transformOrigin: "top", transform: `rotate(${rot}deg)` }}>
          <div style={{ position: "absolute", left: -155, top: 395, width: 310, height: 210, clipPath: "polygon(16% 0,100% 0,100% 100%,0 100%,0 16%)", background: pal.accent, boxShadow: "0 35px 50px #0007", color: pal.bg, fontFamily: FONT }}>
            <div style={{ position: "absolute", left: 31, top: 31, width: 17, height: 17, borderRadius: 20, background: pal.bg }} />
            <div style={{ padding: "48px 32px 0 62px", fontSize: 19, fontWeight: 800, letterSpacing: ".12em" }}>STARTING AT</div>
            <div style={{ paddingLeft: 60, marginTop: 8, fontSize: 69, fontWeight: 950, letterSpacing: "-.06em" }}>{p.price ?? "$99"}</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 09 — A/B split with winner badge
const ABWinner: React.FC<{ p: ProductShowcaseProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const split = clampInterp(frame, [18, 50], [50, 62]);
  const win = spring({ frame: Math.max(0, frame - 48), fps: 30, config: { damping: 11, stiffness: 150 } });
  return (
    <AbsoluteFill style={{ fontFamily: FONT, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, right: `${100-split}%`, background: `linear-gradient(135deg,${pal.bg},${pal.primary}48)`, borderRight: `3px solid ${pal.text}66` }} />
      <div style={{ position: "absolute", left: `${split}%`, right: 0, top: 0, bottom: 0, background: `linear-gradient(135deg,${pal.accent}36,${pal.bg})` }} />
      <div style={{ position: "absolute", left: 80, top: 70, color: `${pal.text}8c`, fontSize: 23, fontWeight: 900 }}>A / BEFORE</div>
      <div style={{ position: "absolute", right: 80, top: 70, color: pal.accent, fontSize: 23, fontWeight: 900 }}>B / {p.productName.toUpperCase()}</div>
      <div style={{ position: "absolute", left: 180, top: 240, transform: "scale(.72)", opacity: .55, filter: "grayscale(1)" }}><Phone pal={{...pal, primary: "#777", secondary: "#999"}} /></div>
      <div style={{ position: "absolute", right: 250, top: 210, transform: `scale(${interpolate(win,[0,1],[.78,1])}) rotate(4deg)` }}><Phone pal={pal} /></div>
      <div style={{ position: "absolute", left: 90, bottom: 85, width: 660 }}><div style={{ color: pal.text, fontSize: 54, fontWeight: 850 }}>{p.tagline}</div><div style={{ color: pal.secondary, marginTop: 14, fontSize: 19 }}>{p.features.slice(0,3).join("  •  ")}</div></div>
      <div style={{ position: "absolute", right: 90, bottom: 75, width: 220, height: 220, borderRadius: "50%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: pal.accent, color: pal.bg, border: `8px solid ${pal.bg}`, boxShadow: `0 0 0 3px ${pal.accent},0 25px 45px #0008`, transform: `scale(${win}) rotate(${interpolate(win,[0,1],[-24,8])}deg)` }}><span style={{ fontSize: 22, fontWeight: 900, letterSpacing: ".12em" }}>WINNER</span><span style={{ fontSize: 48, fontWeight: 950 }}>B</span></div>
    </AbsoluteFill>
  );
};

// 10 — full-bleed hero silhouette parallax
const HeroParallax: React.FC<{ p: ProductShowcaseProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const drift = interpolate(frame, [0, durationInFrames], [-35, 35]);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: `radial-gradient(circle at 68% 45%,${pal.primary}8f,${pal.bg} 56%)` }}>
      {Array.from({length:18},(_,i)=>{
        const x=seededRand(i+1)*100; const y=seededRand(i+31)*100; const size=3+seededRand(i+61)*8;
        return <div key={i} style={{ position:"absolute",left:`${x}%`,top:`${y}%`,width:size,height:size,borderRadius:20,background:i%3?pal.secondary:pal.accent,opacity:.12+seededRand(i+91)*.3,transform:`translate(${drift*(.25+seededRand(i+121))}px,${Math.sin(frame*.02+i)*16}px)` }} />;
      })}
      <div style={{ position: "absolute", right: -80, top: -110, width: 1000, height: 1250, borderRadius: "48%", background: `linear-gradient(130deg,${pal.secondary}55,${pal.primary}1f)`, filter: "blur(2px)", transform: `translateX(${drift*.7}px) rotate(-13deg)` }} />
      <div style={{ position: "absolute", right: 260, top: 135, transform: `translate(${drift}px,${-drift*.25}px) scale(1.38) rotate(-7deg)`, filter: "brightness(.78) saturate(1.15) drop-shadow(0 80px 55px #000a)" }}><Bottle pal={pal} label={p.productName} /></div>
      <div style={{ position: "absolute", left: 115, top: 210, width: 760 }}><Copy p={p} pal={pal} eyebrow="THE NEW ICON" /><div style={{ display: "flex", gap: 14, marginTop: 45 }}>{p.features.slice(0,3).map((f,i)=><div key={f} style={{ color:pal.text,font:`650 18px ${FONT}`,padding:"13px 18px",borderRadius:99,background:`${pal.bg}88`,border:`1px solid ${[pal.primary,pal.secondary,pal.accent][i]}88` }}>{f}</div>)}</div></div>
      <div style={{ position: "absolute", left: 115, bottom: 80, width: 900, height: 1, background: `linear-gradient(90deg,${pal.text}80,transparent)` }} />
      <div style={{ position: "absolute", left: 115, bottom: 45, color: `${pal.text}73`, font: `14px ${MONO}`, letterSpacing: ".2em" }}>PRODUCT / HERO / 001</div>
    </AbsoluteFill>
  );
};

const VARIANTS: Record<ProductVariant, React.FC<{ p: ProductShowcaseProps; pal: Palette }>> = {
  "laptop-reveal": LaptopReveal,
  "phone-orbit": PhoneOrbit,
  "browser-scroll": BrowserScroll,
  unboxing: Unboxing,
  "feature-chips": FeatureChips,
  turntable: Turntable,
  "spec-sheet": SpecSheet,
  "price-tag": PriceTag,
  "ab-winner": ABWinner,
  "hero-parallax": HeroParallax,
};

export const ProductShowcaseTemplate: React.FC<ProductShowcaseProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? LaptopReveal;
  const technical = props.variant === "spec-sheet" || props.variant === "ab-winner" || props.variant === "hero-parallax";
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg }}>
      {!technical && <GradientMeshBackground palette={pal} blobs={props.variant === "feature-chips" ? 3 : 5} speed={0.55} />}
      <FadeEdges inFrames={12} outFrames={14}><div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><Variant p={props} pal={pal} /></div></FadeEdges>
    </AbsoluteFill>
  );
};

const familyCast = (c: React.FC<ProductShowcaseProps>) => c as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "product-laptop-screen-reveal": familyCast(ProductShowcaseTemplate),
  "product-phone-orbit-callouts": familyCast(ProductShowcaseTemplate),
  "product-browser-scroll-tour": familyCast(ProductShowcaseTemplate),
  "product-unboxing-lid-lift": familyCast(ProductShowcaseTemplate),
  "product-feature-chip-stack": familyCast(ProductShowcaseTemplate),
  "product-turntable-sheen": familyCast(ProductShowcaseTemplate),
  "product-spec-sheet-blueprint": familyCast(ProductShowcaseTemplate),
  "product-price-tag-swing": familyCast(ProductShowcaseTemplate),
  "product-ab-split-winner": familyCast(ProductShowcaseTemplate),
  "product-hero-silhouette-parallax": familyCast(ProductShowcaseTemplate),
};
