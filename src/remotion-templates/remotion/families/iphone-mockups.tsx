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
  seededRand,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: iphone-mockups
 * Ten procedural mobile-product presentation systems. The optional image
 * props let callers replace the generated screens without changing layout;
 * defaults stay fully local and renderable with no network access.
 */

type IPhoneMockupVariant =
  | "device-hero"
  | "screen-carousel"
  | "handoff-flow"
  | "notification-demo"
  | "dark-light"
  | "portrait-reel"
  | "tilted-orbit"
  | "multi-device-lineup"
  | "feature-callouts"
  | "app-store-showcase";

export interface IPhoneMockupProps {
  variant: IPhoneMockupVariant;
  appName: string;
  tagline: string;
  features: string[];
  paletteName: string;
  screenImage?: string;
  screenImages?: string[];
  notificationText?: string;
  rating?: string;
  price?: string;
  cta?: string;
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';

const Surface: React.FC<{ pal: Palette; children: React.ReactNode; style?: React.CSSProperties }> = ({ pal, children, style }) => (
  <div style={{ background: `${pal.text}0d`, border: `1px solid ${pal.text}20`, borderRadius: 22, ...style }}>{children}</div>
);

const Heading: React.FC<{ p: IPhoneMockupProps; pal: Palette; eyebrow?: string; width?: number; align?: "left" | "center" }> = ({ p, pal, eyebrow = "THE APP FOR WHAT'S NEXT", width = 650, align = "left" }) => {
  const frame = useCurrentFrame();
  const y = clampInterp(frame, [5, 26], [34, 0]);
  return (
    <div style={{ width, textAlign: align, color: pal.text, fontFamily: FONT, opacity: clampInterp(frame, [0, 14], [0, 1]), transform: `translateY(${y}px)` }}>
      <div style={{ color: pal.accent, fontSize: 18, fontWeight: 850, letterSpacing: ".22em" }}>{eyebrow}</div>
      <div style={{ marginTop: 14, fontSize: 76, lineHeight: .96, fontWeight: 900, letterSpacing: "-.065em" }}>{p.appName}</div>
      <div style={{ marginTop: 22, color: `${pal.text}b8`, fontSize: 27, lineHeight: 1.3 }}>{p.tagline}</div>
    </div>
  );
};

const Icon: React.FC<{ pal: Palette; index: number; size?: number }> = ({ pal, index, size = 42 }) => (
  <svg width={size} height={size} viewBox="0 0 42 42" aria-hidden="true">
    <rect x="1" y="1" width="40" height="40" rx="12" fill={`${[pal.primary, pal.secondary, pal.accent][index % 3]}22`} stroke={`${[pal.primary, pal.secondary, pal.accent][index % 3]}aa`} />
    {index % 3 === 0 ? <path d="M11 22h20M21 12v20" stroke={pal.text} strokeWidth="3" strokeLinecap="round" /> : index % 3 === 1 ? <path d="M12 28l7-8 5 5 7-11" fill="none" stroke={pal.text} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /> : <circle cx="21" cy="21" r="9" fill="none" stroke={pal.text} strokeWidth="3" />}
  </svg>
);

const GeneratedScreen: React.FC<{ p: IPhoneMockupProps; pal: Palette; mode?: "dark" | "light"; page?: number; image?: string }> = ({ p, pal, mode = "dark", page = 0, image }) => {
  const frame = useCurrentFrame();
  const light = mode === "light";
  const bg = light ? "#f7f8fb" : pal.bg;
  const fg = light ? "#101218" : pal.text;
  const muted = light ? "#69707c" : `${pal.text}8c`;
  const colors = [pal.primary, pal.secondary, pal.accent];
  if (image) {
    return <Img src={image} style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
  }
  return (
    <div style={{ width: "100%", height: "100%", background: `linear-gradient(155deg, ${bg}, ${light ? "#e9edf5" : pal.primary + "28"})`, color: fg, fontFamily: FONT, padding: 22, boxSizing: "border-box", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, fontWeight: 800, opacity: .65 }}>
        <span>9:41</span><span>▮▮▮ ᯤ ▰</span>
      </div>
      <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><div style={{ color: colors[page % 3], fontSize: 10, fontWeight: 900, letterSpacing: ".16em" }}>GOOD MORNING</div><div style={{ marginTop: 4, fontSize: 22, fontWeight: 900 }}>{p.appName}</div></div>
        <div style={{ width: 34, height: 34, borderRadius: 99, background: `linear-gradient(135deg, ${colors[0]}, ${colors[2]})`, border: `3px solid ${light ? "#fff" : pal.bg}` }} />
      </div>
      <div style={{ marginTop: 20, height: 124, borderRadius: 18, padding: 16, boxSizing: "border-box", background: `linear-gradient(135deg, ${colors[page % 3]}e8, ${colors[(page + 1) % 3]}aa)`, color: light ? "#fff" : pal.text, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -20, top: -30, width: 120, height: 120, borderRadius: "50%", border: "22px solid #ffffff22" }} />
        <div style={{ fontSize: 11, fontWeight: 700, opacity: .82 }}>{p.features[page % Math.max(1, p.features.length)] ?? "Your day, in motion"}</div>
        <div style={{ marginTop: 22, fontSize: 25, fontWeight: 950 }}>{page === 1 ? "84%" : page === 2 ? "12 min" : "On track"}</div>
      </div>
      <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        {p.features.slice(0, 4).map((feature, i) => <div key={`${feature}-${i}`} style={{ minHeight: 70, borderRadius: 14, background: light ? "#fff" : `${pal.text}0d`, border: `1px solid ${light ? "#dfe4ed" : pal.text + "18"}`, padding: 11, boxSizing: "border-box" }}><Icon pal={pal} index={i} size={24} /><div style={{ marginTop: 7, color: muted, fontSize: 10, fontWeight: 750, lineHeight: 1.1 }}>{feature}</div></div>)}
      </div>
      <div style={{ position: "absolute", left: 22, right: 22, bottom: 15, height: 2, background: `${colors[page % 3]}77`, transform: `scaleX(${clampInterp(frame, [0, 18], [0, 1])})`, transformOrigin: "left" }} />
    </div>
  );
};

const PhoneFrame: React.FC<{ p: IPhoneMockupProps; pal: Palette; image?: string; mode?: "dark" | "light"; page?: number; tilt?: number; scale?: number; shadow?: string }> = ({ p, pal, image, mode = "dark", page = 0, tilt = 0, scale = 1, shadow = "0 50px 90px #000a" }) => (
  <div style={{ width: 280, height: 570, borderRadius: 51, padding: 11, boxSizing: "border-box", background: "linear-gradient(135deg,#c8ced8,#222831 35%,#7b8492 68%,#252a33)", boxShadow: shadow, transform: `rotate(${tilt}deg) scale(${scale})`, transformOrigin: "center center" }}>
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: 41, background: mode === "light" ? "#f7f8fb" : pal.bg, border: "2px solid #090b0f" }}>
      <div style={{ position: "absolute", zIndex: 4, top: 10, left: "50%", width: 82, height: 22, transform: "translateX(-50%)", borderRadius: 20, background: "#050608" }} />
      <GeneratedScreen p={p} pal={pal} mode={mode} page={page} image={image} />
    </div>
  </div>
);

const DeviceLabel: React.FC<{ pal: Palette; children: React.ReactNode; color?: string }> = ({ pal, children, color = pal.accent }) => (
  <div style={{ color: pal.text, font: `750 17px ${FONT}`, padding: "11px 16px", borderRadius: 99, background: `${pal.bg}e8`, border: `1px solid ${color}8a`, boxShadow: `0 15px 30px ${pal.bg}` }}><span style={{ color, marginRight: 8 }}>●</span>{children}</div>
);

// 01 — clean device hero
const DeviceHero: React.FC<{ p: IPhoneMockupProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 14, stiffness: 95 } });
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 150 }}>
    <div style={{ width: 680 }}><Heading p={p} pal={pal} eyebrow="A BETTER WAY TO MOBILE" /><div style={{ display: "flex", gap: 12, marginTop: 42 }}>{p.features.slice(0, 3).map((f, i) => <DeviceLabel key={f} pal={pal} color={[pal.primary, pal.secondary, pal.accent][i]}>{f}</DeviceLabel>)}</div></div>
    <div style={{ transform: `translateY(${interpolate(enter, [0, 1], [240, 0])}px) rotateY(${interpolate(enter, [0, 1], [48, -8])}deg) scale(${interpolate(enter, [0, 1], [.72, 1])})`, perspective: 1100 }}><PhoneFrame p={p} pal={pal} image={p.screenImage} /></div>
  </AbsoluteFill>;
};

// 02 — three-screen carousel
const ScreenCarousel: React.FC<{ p: IPhoneMockupProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const travel = clampInterp(frame, [20, durationInFrames - 18], [0, -420]);
  const images = p.screenImages ?? [];
  return <AbsoluteFill style={{ overflow: "hidden" }}>
    <div style={{ position: "absolute", left: 100, top: 90 }}><Heading p={p} pal={pal} eyebrow="SWIPE THROUGH THE EXPERIENCE" width={550} /></div>
    <div style={{ position: "absolute", right: -15, top: 240, display: "flex", gap: 50, transform: `translateX(${travel}px)` }}>
      {[0, 1, 2, 3].map((i) => <div key={i} style={{ transform: `translateY(${Math.sin(frame * .03 + i) * 16}px) rotate(${(i - 1.5) * 3}deg)` }}><PhoneFrame p={p} pal={pal} page={i} image={images[i % Math.max(1, images.length)]} scale={.88} /></div>)}
    </div>
    <div style={{ position: "absolute", left: 105, bottom: 92, display: "flex", gap: 10 }}>{[0, 1, 2].map((i) => <div key={i} style={{ width: i === Math.floor((frame / Math.max(1, durationInFrames)) * 3) ? 42 : 12, height: 8, borderRadius: 9, background: i === 0 ? pal.primary : i === 1 ? pal.secondary : pal.accent }} />)}</div>
  </AbsoluteFill>;
};

// 03 — phone-to-desktop handoff flow
const HandoffFlow: React.FC<{ p: IPhoneMockupProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const pulse = (frame % 50) / 50;
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <div style={{ position: "absolute", left: 95, top: 115 }}><Heading p={p} pal={pal} eyebrow="PICK UP WHERE YOU LEFT OFF" width={570} /></div>
    <div style={{ display: "flex", alignItems: "center", gap: 55, marginTop: 120 }}>
      <div style={{ transform: `translateY(${Math.sin(frame * .035) * 8}px) rotate(-7deg)` }}><PhoneFrame p={p} pal={pal} page={1} /></div>
      <div style={{ width: 280, position: "relative", height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${pal.primary}, ${pal.accent})`, opacity: .75 }} />
        <div style={{ zIndex: 1, width: 68, height: 68, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", background: pal.bg, border: `2px solid ${pal.accent}`, color: pal.accent, fontSize: 32, transform: `translateX(${pulse * 170 - 85}px)` }}>→</div>
      </div>
      <div style={{ width: 500, height: 330, borderRadius: 22, padding: 12, background: "linear-gradient(145deg,#afb6c1,#272d36)", boxShadow: "0 40px 70px #000a", transform: "perspective(900px) rotateY(-10deg)" }}>
        <div style={{ height: "100%", borderRadius: 13, background: pal.bg, overflow: "hidden" }}><GeneratedScreen p={p} pal={pal} page={2} /></div>
      </div>
    </div>
    <div style={{ position: "absolute", right: 110, bottom: 95, color: `${pal.text}8a`, font: `600 18px ${MONO}` }}>SYNCED IN REAL TIME · 01:24</div>
  </AbsoluteFill>;
};

// 04 — notification demo
const NotificationDemo: React.FC<{ p: IPhoneMockupProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const show = clampInterp(frame, [25, 42], [0, 1]);
  const note = p.notificationText ?? `${p.appName} has something new for you`;
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 160 }}>
    <div><Heading p={p} pal={pal} eyebrow="NEVER MISS THE MOMENT" width={570} /><div style={{ marginTop: 40, color: `${pal.text}8b`, font: `18px ${MONO}` }}>LIVE NOTIFICATIONS / 03</div></div>
    <div style={{ position: "relative" }}>
      <PhoneFrame p={p} pal={pal} page={0} />
      <div style={{ position: "absolute", zIndex: 5, left: -45, right: -45, top: 105, padding: "17px 18px", borderRadius: 20, background: `${pal.bg}f5`, border: `1px solid ${pal.secondary}8a`, boxShadow: "0 24px 55px #000b", opacity: show, transform: `translateY(${interpolate(show, [0, 1], [-80, 0])}px) scale(${interpolate(show, [0, 1], [.9, 1])})`, color: pal.text, fontFamily: FONT }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 35, height: 35, borderRadius: 11, background: pal.accent, display: "flex", alignItems: "center", justifyContent: "center", color: pal.bg, fontWeight: 900 }}>✦</div><div><div style={{ fontSize: 11, fontWeight: 900, letterSpacing: ".08em" }}>{p.appName.toUpperCase()} <span style={{ opacity: .5 }}>NOW</span></div><div style={{ marginTop: 4, fontSize: 16, fontWeight: 700 }}>{note}</div></div></div></div>
      <div style={{ position: "absolute", left: -100, right: -100, top: 85, height: 220, borderRadius: "50%", border: `1px solid ${pal.accent}45`, transform: `scale(${1 + Math.sin(frame * .05) * .04})`, pointerEvents: "none" }} />
    </div>
  </AbsoluteFill>;
};

// 05 — dark/light comparison
const DarkLight: React.FC<{ p: IPhoneMockupProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const split = clampInterp(frame, [22, 60], [50, 62]);
  return <AbsoluteFill style={{ overflow: "hidden", fontFamily: FONT }}>
    <div style={{ position: "absolute", inset: 0, right: `${100 - split}%`, background: `linear-gradient(145deg, ${pal.bg}, ${pal.primary}40)` }} />
    <div style={{ position: "absolute", left: `${split}%`, insetBlock: 0, right: 0, background: "linear-gradient(145deg,#f9fbff,#dfe6f1)" }} />
    <div style={{ position: "absolute", top: 68, left: 95, color: pal.text, fontSize: 22, fontWeight: 900, letterSpacing: ".13em" }}>DARK MODE</div><div style={{ position: "absolute", top: 68, right: 95, color: "#171b23", fontSize: 22, fontWeight: 900, letterSpacing: ".13em" }}>LIGHT MODE</div>
    <div style={{ position: "absolute", left: "26%", top: 215, transform: `translateX(${clampInterp(frame, [0, 42], [-100, 0])}px) rotate(-6deg)` }}><PhoneFrame p={p} pal={pal} mode="dark" /></div>
    <div style={{ position: "absolute", left: "59%", top: 215, transform: `translateX(${clampInterp(frame, [0, 42], [100, 0])}px) rotate(6deg)` }}><PhoneFrame p={p} pal={pal} mode="light" /></div>
    <div style={{ position: "absolute", bottom: 68, left: "50%", transform: "translateX(-50%)", color: "#343945", fontSize: 18, fontWeight: 700 }}>{p.tagline}</div>
  </AbsoluteFill>;
};

// 06 — portrait reel with moving cards behind the device
const PortraitReel: React.FC<{ p: IPhoneMockupProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const images = p.screenImages ?? [];
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
    {[0, 1, 2, 3, 4].map((i) => <div key={i} style={{ position: "absolute", width: 430, height: 250, left: 150 + i * 360, top: 380 + Math.sin(frame * .025 + i) * 30, borderRadius: 24, overflow: "hidden", opacity: .7, transform: `rotate(${(i - 2) * 4}deg) translateX(${(frame * -2.2) % 360}px)`, background: `linear-gradient(135deg, ${[pal.primary, pal.secondary, pal.accent][i % 3]}aa, ${pal.bg})`, border: `1px solid ${pal.text}35` }}>{images[i % Math.max(1, images.length)] ? <Img src={images[i % images.length]} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ padding: 26, color: pal.text, font: `800 27px ${FONT}` }}>{p.features[i % Math.max(1, p.features.length)] ?? p.appName}</div>}</div>)}
    <div style={{ position: "absolute", left: 105, top: 115 }}><Heading p={p} pal={pal} eyebrow="MADE FOR THE FEED" width={500} /></div>
    <div style={{ transform: `rotate(-5deg) translateY(${Math.sin(frame * .03) * 10}px)` }}><PhoneFrame p={p} pal={pal} image={p.screenImage} /></div>
    <div style={{ position: "absolute", right: 105, bottom: 80, display: "flex", gap: 12 }}>{["↗", "♡", "⌁"].map((symbol, i) => <div key={symbol} style={{ width: 52, height: 52, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", color: pal.text, background: `${pal.bg}d9`, border: `1px solid ${[pal.primary, pal.secondary, pal.accent][i]}99`, fontSize: 24 }}>{symbol}</div>)}</div>
  </AbsoluteFill>;
};

// 07 — tilted orbit of benefit labels
const TiltedOrbit: React.FC<{ p: IPhoneMockupProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", perspective: 1200 }}>
    <div style={{ transform: `rotateY(-15deg) rotateX(5deg) translateX(230px) rotateZ(${Math.sin(frame * .025) * 2}deg)` }}><PhoneFrame p={p} pal={pal} page={1} /></div>
    <div style={{ position: "absolute", left: 105, top: 125 }}><Heading p={p} pal={pal} eyebrow="DESIGNED TO MOVE WITH YOU" width={610} /></div>
    {p.features.slice(0, 5).map((feature, i) => { const a = frame * .012 + i * Math.PI * 2 / 5; const x = 230 + Math.cos(a) * 355; const y = Math.sin(a) * 265; return <div key={feature} style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(${x}px, ${y}px)`, opacity: clampInterp(frame, [20 + i * 5, 36 + i * 5], [0, 1]) }}><DeviceLabel pal={pal} color={[pal.primary, pal.secondary, pal.accent][i % 3]}>{feature}</DeviceLabel></div>; })}
  </AbsoluteFill>;
};

// 08 — three-device lineup for a product ecosystem
const MultiDeviceLineup: React.FC<{ p: IPhoneMockupProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const phones = [{ x: -330, y: 70, r: -10, s: .76, page: 2 }, { x: 0, y: 0, r: 0, s: 1, page: 0 }, { x: 330, y: 70, r: 10, s: .76, page: 1 }];
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <div style={{ position: "absolute", left: 105, top: 90 }}><Heading p={p} pal={pal} eyebrow="ONE ACCOUNT. EVERY SCREEN." width={530} /></div>
    <div style={{ position: "relative", width: 980, height: 720, marginTop: 170 }}>{phones.map((phone, i) => <div key={i} style={{ position: "absolute", left: "50%", top: 70, transform: `translateX(calc(-50% + ${phone.x}px)) translateY(${phone.y + clampInterp(frame, [0, 35], [130 * (i === 1 ? 1 : -1), 0])}px) rotate(${phone.r}deg)`, zIndex: i === 1 ? 3 : 2 }}><PhoneFrame p={p} pal={pal} page={phone.page} image={i === 1 ? p.screenImage : p.screenImages?.[i - 1]} scale={phone.s} /></div>)}</div>
    <div style={{ position: "absolute", right: 105, bottom: 78, color: `${pal.text}88`, font: `600 18px ${MONO}` }}>MOBILE · TABLET · DESKTOP</div>
  </AbsoluteFill>;
};

// 09 — feature callouts connected by measured leader lines
const FeatureCallouts: React.FC<{ p: IPhoneMockupProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <div style={{ position: "absolute", left: 95, top: 90 }}><Heading p={p} pal={pal} eyebrow="EVERY DETAIL HAS A JOB" width={490} /></div>
    <div style={{ transform: `translateY(${Math.sin(frame * .025) * 8}px)` }}><PhoneFrame p={p} pal={pal} page={2} /></div>
    {p.features.slice(0, 4).map((feature, i) => { const left = i % 2 === 0; const y = 300 + Math.floor(i / 2) * 175; const color = [pal.primary, pal.secondary, pal.accent, pal.text][i]; return <div key={feature} style={{ position: "absolute", left: left ? 130 : 1330, top: y, width: 370, color: pal.text, fontFamily: FONT, textAlign: left ? "right" : "left" }}><div style={{ fontSize: 12, letterSpacing: ".18em", color, fontWeight: 900 }}>FEATURE 0{i + 1}</div><div style={{ marginTop: 8, fontSize: 26, fontWeight: 850 }}>{feature}</div><div style={{ position: "absolute", top: 39, [left ? "right" : "left"]: -175, width: 175, height: 1, background: `linear-gradient(${left ? "270deg" : "90deg"}, ${color}, transparent)`, transformOrigin: left ? "right" : "left", transform: `scaleX(${clampInterp(frame, [18 + i * 5, 34 + i * 5], [0, 1])})` }} /><div style={{ position: "absolute", top: 35, [left ? "right" : "left"]: -181, width: 9, height: 9, borderRadius: 99, background: color, opacity: clampInterp(frame, [18 + i * 5, 34 + i * 5], [0, 1]) }} /></div>; })}
  </AbsoluteFill>;
};

// 10 — app-store style product page
const AppStoreShowcase: React.FC<{ p: IPhoneMockupProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: Math.max(0, frame - 12), fps, config: { damping: 16, stiffness: 100 } });
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 115, flexDirection: "row" }}>
    <div style={{ width: 700, padding: 35, borderRadius: 30, background: "#f7f9fc", boxShadow: "0 35px 80px #0007", color: "#12151b", fontFamily: FONT, transform: `translateX(${interpolate(enter, [0, 1], [-170, 0])}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}><div style={{ width: 100, height: 100, borderRadius: 23, background: `linear-gradient(135deg, ${pal.primary}, ${pal.accent})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 45, fontWeight: 950 }}>✦</div><div><div style={{ fontSize: 34, fontWeight: 900 }}>{p.appName}</div><div style={{ marginTop: 7, color: "#69717d", fontSize: 17 }}>The app that keeps up with you</div></div><div style={{ marginLeft: "auto", padding: "12px 21px", borderRadius: 99, background: "#151922", color: "#fff", fontWeight: 850 }}>{p.cta ?? "GET"}</div></div>
      <div style={{ marginTop: 27, display: "flex", gap: 22, color: "#6c7480", fontSize: 14, fontWeight: 750 }}><span>★ {p.rating ?? "4.9"}</span><span>·</span><span>Productivity</span><span>·</span><span>{p.price ?? "Free"}</span></div>
      <div style={{ marginTop: 27, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>{[0, 1, 2].map((i) => <div key={i} style={{ height: 220, borderRadius: 16, overflow: "hidden", background: `linear-gradient(145deg, ${[pal.primary, pal.secondary, pal.accent][i]}bb, #17202b)` }}>{p.screenImages?.[i] ? <Img src={p.screenImages[i]} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <GeneratedScreen p={p} pal={pal} page={i} />}</div>)}</div>
      <div style={{ marginTop: 25, color: "#252a33", fontSize: 18, lineHeight: 1.45 }}>{p.tagline} {p.features.slice(0, 2).join(" and ")}.</div>
    </div>
    <div style={{ transform: `translateX(${interpolate(enter, [0, 1], [170, 0])}px) rotate(5deg) scale(${interpolate(enter, [0, 1], [.8, 1])})` }}><PhoneFrame p={p} pal={pal} image={p.screenImage} /></div>
  </AbsoluteFill>;
};

const VARIANTS: Record<IPhoneMockupVariant, React.FC<{ p: IPhoneMockupProps; pal: Palette }>> = {
  "device-hero": DeviceHero,
  "screen-carousel": ScreenCarousel,
  "handoff-flow": HandoffFlow,
  "notification-demo": NotificationDemo,
  "dark-light": DarkLight,
  "portrait-reel": PortraitReel,
  "tilted-orbit": TiltedOrbit,
  "multi-device-lineup": MultiDeviceLineup,
  "feature-callouts": FeatureCallouts,
  "app-store-showcase": AppStoreShowcase,
};

export const IPhoneMockupsTemplate: React.FC<IPhoneMockupProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? DeviceHero;
  const technical = props.variant === "dark-light" || props.variant === "feature-callouts";
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <AbsoluteFill style={{ backgroundColor: pal.bg, overflow: "hidden" }}>
    {technical ? <GridPerspectiveBackground palette={pal} /> : <GradientMeshBackground palette={pal} speed={.45} blobs={props.variant === "portrait-reel" ? 6 : 4} />}
    <FadeEdges inFrames={12} outFrames={14}><div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><Variant p={props} pal={pal} /></div></FadeEdges>
  </AbsoluteFill>;
};

const familyCast = (c: React.FC<IPhoneMockupProps>) => c as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "iphone-device-hero": familyCast(IPhoneMockupsTemplate),
  "iphone-screen-carousel": familyCast(IPhoneMockupsTemplate),
  "iphone-handoff-flow": familyCast(IPhoneMockupsTemplate),
  "iphone-notification-demo": familyCast(IPhoneMockupsTemplate),
  "iphone-dark-light-comparison": familyCast(IPhoneMockupsTemplate),
  "iphone-portrait-reel": familyCast(IPhoneMockupsTemplate),
  "iphone-tilted-orbit": familyCast(IPhoneMockupsTemplate),
  "iphone-multi-device-lineup": familyCast(IPhoneMockupsTemplate),
  "iphone-feature-callouts": familyCast(IPhoneMockupsTemplate),
  "iphone-app-store-showcase": familyCast(IPhoneMockupsTemplate),
};
