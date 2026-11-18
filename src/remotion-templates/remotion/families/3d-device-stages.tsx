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
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: 3d-device-stages
 * CSS/SVG pseudo-3D device presentation stages. The family intentionally has
 * no WebGL or asset dependency: callers can provide screen images, while the
 * generated UI fallback keeps every default renderable in a headless browser.
 */

type DeviceStageVariant =
  | "turntable-hero"
  | "floating-stack"
  | "glass-stage"
  | "wireframe-device"
  | "light-sweep"
  | "shadow-box"
  | "shelf-display"
  | "macro-detail"
  | "orbiting-screens"
  | "portal-device";

export interface DeviceStageProps {
  variant: DeviceStageVariant;
  deviceName: string;
  tagline: string;
  features: string[];
  paletteName: string;
  screenImage?: string;
  screenImages?: string[];
  cameraAngle?: number;
  lightColor?: string;
  material?: "aluminum" | "glass" | "carbon" | "pearl";
  shadow?: string;
  background?: string;
  speed?: number;
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';

const copy = (value: string | undefined, fallback: string): string => value || fallback;

const StageTitle: React.FC<{
  p: DeviceStageProps;
  pal: Palette;
  eyebrow?: string;
  width?: number;
  align?: "left" | "center";
}> = ({ p, pal, eyebrow = "DESIGNED IN DEPTH", width = 630, align = "left" }) => {
  const frame = useCurrentFrame();
  const y = clampInterp(frame, [4, 24], [30, 0]);
  return (
    <div
      style={{
        width,
        textAlign: align,
        color: pal.text,
        fontFamily: FONT,
        opacity: clampInterp(frame, [0, 15], [0, 1]),
        transform: `translateY(${y}px)`,
      }}
    >
      <div style={{ color: pal.accent, fontSize: 16, fontWeight: 900, letterSpacing: ".24em" }}>{eyebrow}</div>
      <div style={{ marginTop: 13, fontSize: 72, lineHeight: .96, fontWeight: 900, letterSpacing: "-.06em" }}>{p.deviceName}</div>
      <div style={{ marginTop: 20, color: `${pal.text}b8`, fontSize: 26, lineHeight: 1.32 }}>{p.tagline}</div>
    </div>
  );
};

const DeviceUi: React.FC<{ p: DeviceStageProps; pal: Palette; page?: number; light?: boolean }> = ({ p, pal, page = 0, light = false }) => {
  const frame = useCurrentFrame();
  const bg = light ? "#f7f9fc" : pal.bg;
  const text = light ? "#131720" : pal.text;
  const muted = light ? "#68717d" : `${pal.text}8c`;
  const colors = [pal.primary, pal.secondary, pal.accent];
  const image = p.screenImages?.[page] || (page === 0 ? p.screenImage : undefined);
  if (image) return <Img src={image} style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
  return (
    <div style={{ width: "100%", height: "100%", boxSizing: "border-box", padding: 22, overflow: "hidden", color: text, fontFamily: FONT, background: `linear-gradient(150deg, ${bg}, ${colors[page % 3]}2c)` }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 850, opacity: .68 }}><span>9:41</span><span>▮▮▮ ᯤ ▰</span></div>
      <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><div style={{ color: colors[page % 3], fontSize: 10, fontWeight: 900, letterSpacing: ".16em" }}>DEVICE STAGE</div><div style={{ marginTop: 5, fontSize: 21, fontWeight: 900 }}>{p.deviceName}</div></div>
        <div style={{ width: 31, height: 31, borderRadius: 99, background: `linear-gradient(135deg, ${colors[0]}, ${colors[2]})`, border: `3px solid ${light ? "#fff" : pal.bg}` }} />
      </div>
      <div style={{ marginTop: 21, height: 130, borderRadius: 19, padding: 16, boxSizing: "border-box", color: light ? "#fff" : pal.text, background: `linear-gradient(135deg, ${colors[page % 3]}ee, ${colors[(page + 1) % 3]}9e)`, overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", right: -28, top: -42, width: 155, height: 155, borderRadius: 99, border: "28px solid #ffffff24" }} />
        <div style={{ fontSize: 11, fontWeight: 750, opacity: .82 }}>{p.features[page % Math.max(1, p.features.length)] ?? "A sharper way forward"}</div>
        <div style={{ marginTop: 23, fontSize: 28, fontWeight: 950 }}>{page % 3 === 0 ? "98%" : page % 3 === 1 ? "12.4k" : "Live"}</div>
      </div>
      <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 9 }}>
        {p.features.slice(0, 4).map((feature, i) => <div key={`${feature}-${i}`} style={{ minHeight: 65, borderRadius: 13, padding: 10, boxSizing: "border-box", background: light ? "#fff" : `${pal.text}0d`, border: `1px solid ${light ? "#e0e5ec" : pal.text + "1c"}` }}><div style={{ width: 22, height: 22, borderRadius: 7, background: `${colors[i % 3]}40`, border: `1px solid ${colors[i % 3]}99` }} /><div style={{ marginTop: 7, color: muted, fontSize: 9, lineHeight: 1.1, fontWeight: 750 }}>{feature}</div></div>)}
      </div>
      <div style={{ position: "absolute", left: 22, right: 22, bottom: 15, height: 2, background: `${colors[page % 3]}88`, transform: `scaleX(${clampInterp(frame, [0, 20], [0, 1])})`, transformOrigin: "left" }} />
    </div>
  );
};

const frameGradient = (p: DeviceStageProps, pal: Palette): string => {
  if (p.material === "glass") return `linear-gradient(135deg, #ffffffb8, ${pal.secondary}88 35%, #ffffff32 62%, ${pal.primary}a0)`;
  if (p.material === "carbon") return `linear-gradient(135deg, #080a0e, #555d69 38%, #11151c 72%, #727b88)`;
  if (p.material === "pearl") return `linear-gradient(135deg, #f1f4f8, ${pal.secondary} 35%, #737d8e 67%, #eef1f6)`;
  return `linear-gradient(135deg, #c8ced8, #242a34 37%, ${pal.primary} 67%, #252a33)`;
};

const DeviceFrame: React.FC<{
  p: DeviceStageProps;
  pal: Palette;
  page?: number;
  tilt?: number;
  rotateY?: number;
  scale?: number;
  wireframe?: boolean;
  light?: boolean;
  glow?: boolean;
  compact?: boolean;
}> = ({ p, pal, page = 0, tilt = 0, rotateY = 0, scale = 1, wireframe = false, light = false, glow = false, compact = false }) => {
  const width = compact ? 220 : 320;
  const height = compact ? 390 : 565;
  const pad = compact ? 8 : 11;
  const radius = compact ? 35 : 48;
  const shadow = p.shadow || "0 45px 85px #000a";
  return (
    <div style={{ position: "relative", width, height, padding: pad, boxSizing: "border-box", borderRadius: radius, background: wireframe ? "transparent" : frameGradient(p, pal), border: wireframe ? `2px solid ${p.lightColor || pal.accent}cc` : `1px solid ${pal.text}48`, boxShadow: glow ? `${shadow}, 0 0 70px ${p.lightColor || pal.accent}66` : shadow, transform: `perspective(1100px) rotateX(${p.cameraAngle ?? 0}deg) rotateY(${rotateY}deg) rotateZ(${tilt}deg) scale(${scale})`, transformOrigin: "center center" }}>
      {!wireframe && <div style={{ position: "absolute", left: -10, right: -10, bottom: -17, height: 32, borderRadius: 99, background: `${pal.bg}88`, filter: "blur(9px)", transform: "rotateX(70deg)" }} />}
      <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: radius - pad, background: wireframe ? "transparent" : pal.bg, border: wireframe ? `1px dashed ${p.lightColor || pal.secondary}88` : "2px solid #080a0d", boxSizing: "border-box" }}>
        <DeviceUi p={p} pal={pal} page={page} light={light} />
        {!wireframe && <div style={{ position: "absolute", zIndex: 3, top: compact ? 7 : 10, left: "50%", width: compact ? 58 : 78, height: compact ? 16 : 21, transform: "translateX(-50%)", borderRadius: 20, background: "#050608" }} />}
        {wireframe && <><div style={{ position: "absolute", inset: 15, border: `1px solid ${p.lightColor || pal.accent}55`, borderRadius: radius - pad - 10 }} /><div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, borderLeft: `1px dashed ${p.lightColor || pal.accent}50` }} /></>}
      </div>
      {!compact && <div style={{ position: "absolute", top: "42%", right: -5, width: 4, height: 84, borderRadius: 4, background: `${pal.text}55` }} />}
    </div>
  );
};

const Label: React.FC<{ pal: Palette; children: React.ReactNode; color?: string }> = ({ pal, children, color = pal.accent }) => (
  <div style={{ padding: "10px 15px", borderRadius: 99, background: `${pal.bg}e8`, border: `1px solid ${color}88`, color: pal.text, font: `750 16px ${FONT}`, boxShadow: `0 15px 30px ${pal.bg}` }}><span style={{ color, marginRight: 8 }}>●</span>{children}</div>
);

const TurntableHero: React.FC<{ p: DeviceStageProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const enter = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 16, stiffness: 95 } });
  const turn = interpolate(enter, [0, 1], [-34, 18]) + Math.sin(frame * .02) * 4;
  // The title + device row is wider than a thumbnail viewport. Scale the
  // composed row as one unit so the title never starts outside the canvas,
  // while keeping the device large enough to retain crisp edge contrast.
  const fit = Math.min(1, width / 1120, height / 700);
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", perspective: 1300, overflow: "hidden" }}>
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 150, transform: `scale(${fit})` }}>
      <StageTitle p={p} pal={pal} eyebrow="TURN TABLE / 01" />
      <div style={{ position: "relative", transform: `translateY(${interpolate(enter, [0, 1], [180, 0])}px)` }}><div style={{ position: "absolute", left: -100, right: -100, bottom: -40, height: 40, borderRadius: "50%", background: `${p.lightColor || pal.primary}44`, filter: "blur(18px)" }} /><DeviceFrame p={p} pal={pal} rotateY={turn} scale={.96} glow /></div>
    </div>
  </AbsoluteFill>;
};

const FloatingStack: React.FC<{ p: DeviceStageProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const devices = [{ x: -260, y: 65, r: -11, ry: -14, s: .73, page: 2 }, { x: 0, y: 0, r: 0, ry: 0, s: 1, page: 0 }, { x: 255, y: 72, r: 11, ry: 14, s: .73, page: 1 }];
  return <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}><div style={{ position: "absolute", left: 100, top: 95 }}><StageTitle p={p} pal={pal} eyebrow="STACKED PERSPECTIVE / 02" width={560} /></div><div style={{ position: "relative", width: 1000, height: 680, marginTop: 175 }}>{devices.map((d, i) => <div key={i} style={{ position: "absolute", left: "50%", top: 45, zIndex: i === 1 ? 3 : 2, transform: `translateX(calc(-50% + ${d.x}px)) translateY(${d.y + Math.sin(frame * .03 + i) * 10}px) rotate(${d.r}deg)` }}><DeviceFrame p={p} pal={pal} page={d.page} rotateY={d.ry} scale={d.s} /></div>)}</div><div style={{ position: "absolute", right: 105, bottom: 82, display: "flex", gap: 10 }}>{p.features.slice(0, 3).map((f, i) => <Label key={`${f}-${i}`} pal={pal} color={[pal.primary, pal.secondary, pal.accent][i]}>{f}</Label>)}</div></AbsoluteFill>;
};

const GlassStage: React.FC<{ p: DeviceStageProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const rise = clampInterp(frame, [8, 45], [180, 0]);
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", perspective: 1300 }}><div style={{ position: "absolute", inset: 100, borderRadius: 42, border: `1px solid ${p.lightColor || pal.secondary}55`, background: `linear-gradient(140deg, ${pal.text}0c, ${pal.primary}1c)`, boxShadow: `inset 0 0 80px ${pal.secondary}17, 0 35px 100px #0007` }} /><div style={{ position: "absolute", left: 130, top: 140 }}><StageTitle p={p} pal={pal} eyebrow="GLASS STAGE / 03" width={510} /></div><div style={{ transform: `translateY(${rise}px) rotateY(-17deg)`, opacity: clampInterp(frame, [0, 22], [0, 1]) }}><DeviceFrame p={{ ...p, material: "glass" }} pal={pal} rotateY={-17} glow /></div><div style={{ position: "absolute", left: 190, bottom: 115, color: `${pal.text}9b`, font: `600 17px ${MONO}` }}>REFRACTION / {copy(p.material, "GLASS").toUpperCase()} / 0{Math.floor(frame / 15) % 10}</div></AbsoluteFill>;
};

const WireframeDevice: React.FC<{ p: DeviceStageProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const scan = (frame * 3.5) % 100;
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}><GridPerspectiveBackground palette={pal} /><div style={{ position: "absolute", left: 110, top: 120 }}><StageTitle p={p} pal={pal} eyebrow="WIREFRAME / 04" width={500} /></div><div style={{ position: "relative", transform: `rotateY(${-24 + Math.sin(frame * .018) * 7}deg) rotateZ(-5deg)` }}><DeviceFrame p={p} pal={pal} wireframe rotateY={-24} scale={1.02} /><div style={{ position: "absolute", left: -42, right: -42, top: `${scan}%`, height: 3, background: p.lightColor || pal.accent, boxShadow: `0 0 20px ${p.lightColor || pal.accent}`, opacity: .85 }} /></div><div style={{ position: "absolute", right: 118, bottom: 120, color: p.lightColor || pal.secondary, font: `600 15px ${MONO}`, letterSpacing: ".1em" }}>MESH 09 · DEPTH 0.82 · CAMERA {Math.round(p.cameraAngle ?? 0)}°</div></AbsoluteFill>;
};

const LightSweep: React.FC<{ p: DeviceStageProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const sweep = ((frame * (p.speed ?? 1.4)) % 170) - 35;
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 160 }}><div><StageTitle p={p} pal={pal} eyebrow="LIGHT SWEEP / 05" width={560} /><div style={{ marginTop: 38, display: "flex", gap: 10 }}>{p.features.slice(0, 3).map((f, i) => <Label key={`${f}-${i}`} pal={pal} color={[pal.primary, pal.secondary, pal.accent][i]}>{f}</Label>)}</div></div><div style={{ position: "relative", overflow: "visible" }}><DeviceFrame p={p} pal={pal} rotateY={-12} glow /><div style={{ position: "absolute", inset: -80, pointerEvents: "none", transform: `translateX(${sweep}%) rotate(18deg)`, width: 90, background: `linear-gradient(90deg, transparent, ${p.lightColor || pal.text}9c, transparent)`, filter: "blur(8px)" }} /></div></AbsoluteFill>;
};

const ShadowBox: React.FC<{ p: DeviceStageProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const reveal = clampInterp(frame, [12, 44], [0, 1]);
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: `radial-gradient(ellipse at 65% 45%, ${pal.primary}35, transparent 42%)` }}><div style={{ position: "absolute", left: 120, top: 160 }}><StageTitle p={p} pal={pal} eyebrow="SHADOW BOX / 06" width={470} /></div><div style={{ position: "relative", width: 650, height: 700, marginLeft: 600, border: `1px solid ${pal.text}22`, background: "#050609aa", boxShadow: `inset 0 0 100px #000, 0 45px 100px #0008`, overflow: "hidden" }}><div style={{ position: "absolute", inset: 0, background: `linear-gradient(120deg, transparent 34%, ${p.lightColor || pal.accent}2e, transparent 65%)`, transform: `translateX(${interpolate(reveal, [0, 1], [-110, 0])}%)` }} /><div style={{ position: "absolute", left: 170, top: 65, transform: `translateY(${interpolate(reveal, [0, 1], [100, 0])}px) rotateY(-18deg)`, opacity: reveal }}><DeviceFrame p={p} pal={pal} rotateY={-18} scale={.86} /></div><div style={{ position: "absolute", left: 45, right: 45, bottom: 35, height: 2, background: pal.accent, opacity: .65 }} /></div></AbsoluteFill>;
};

const ShelfDisplay: React.FC<{ p: DeviceStageProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const items = [{ x: -340, y: 40, r: -10, s: .68, page: 1 }, { x: 0, y: -8, r: 0, s: .9, page: 0 }, { x: 330, y: 38, r: 10, s: .68, page: 2 }];
  return <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}><div style={{ position: "absolute", top: 86, left: 110 }}><StageTitle p={p} pal={pal} eyebrow="SHELF DISPLAY / 07" width={530} /></div><div style={{ position: "relative", width: 1120, height: 660, marginTop: 185 }}>{items.map((d, i) => <div key={i} style={{ position: "absolute", left: "50%", top: 40, transform: `translateX(calc(-50% + ${d.x}px)) translateY(${d.y + clampInterp(frame, [0, 30], [80 * (i === 1 ? 1 : -1), 0])}px) rotate(${d.r}deg)`, zIndex: i === 1 ? 3 : 2 }}><DeviceFrame p={p} pal={pal} page={d.page} scale={d.s} rotateY={(i - 1) * 12} compact={i !== 1} /></div>)}<div style={{ position: "absolute", left: 35, right: 35, bottom: 45, height: 28, borderRadius: 10, background: `linear-gradient(#8b94a1, #303640)`, boxShadow: "0 28px 35px #0009" }} /><div style={{ position: "absolute", left: 100, right: 100, bottom: 72, height: 2, background: `${pal.text}45` }} /></div><div style={{ position: "absolute", right: 115, bottom: 95, color: `${pal.text}88`, font: `600 16px ${MONO}` }}>DESKTOP / TABLET / MOBILE</div></AbsoluteFill>;
};

const MacroDetail: React.FC<{ p: DeviceStageProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const zoom = clampInterp(frame, [0, 42], [.72, 1.35]);
  return <AbsoluteFill style={{ overflow: "hidden", alignItems: "center", justifyContent: "center", background: `radial-gradient(circle at 58% 52%, ${pal.primary}44, ${pal.bg} 62%)` }}><div style={{ position: "absolute", left: 105, top: 110, zIndex: 3 }}><StageTitle p={p} pal={pal} eyebrow="MACRO DETAIL / 08" width={470} /></div><div style={{ transform: `translateX(230px) translateY(38px) rotateY(-21deg) rotateZ(-4deg) scale(${zoom})` }}><DeviceFrame p={p} pal={pal} page={1} rotateY={-21} scale={1} glow /></div><div style={{ position: "absolute", right: 125, bottom: 105, display: "flex", gap: 12, alignItems: "center", color: `${pal.text}9b`, font: `600 16px ${MONO}` }}><span style={{ width: 60, height: 1, background: pal.accent }} />DETAIL / 02</div></AbsoluteFill>;
};

const OrbitingScreens: React.FC<{ p: DeviceStageProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", perspective: 1300 }}><div style={{ position: "absolute", left: 105, top: 100 }}><StageTitle p={p} pal={pal} eyebrow="ORBITING SCREENS / 09" width={510} /></div><div style={{ position: "relative", width: 1200, height: 720, marginTop: 150 }}><div style={{ position: "absolute", left: "50%", top: 55, transform: "translateX(-50%)", zIndex: 4 }}><DeviceFrame p={p} pal={pal} rotateY={-8} scale={.82} glow /></div>{[0, 1, 2, 3, 4].map((i) => { const a = frame * .018 + i * Math.PI * 2 / 5; const x = Math.cos(a) * 415; const y = Math.sin(a) * 190 + 210; return <div key={i} style={{ position: "absolute", left: "50%", top: 0, transform: `translate(${x - 110}px, ${y}px) rotate(${(i - 2) * 6}deg)`, zIndex: y > 260 ? 5 : 2 }}><DeviceFrame p={p} pal={pal} page={i % 3} scale={.38} compact /></div>; })}</div><div style={{ position: "absolute", right: 115, bottom: 90, color: `${pal.text}8c`, font: `600 16px ${MONO}` }}>ORBIT RATE / {((p.speed ?? 1) * 1.8).toFixed(1)}×</div></AbsoluteFill>;
};

const PortalDevice: React.FC<{ p: DeviceStageProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const enter = spring({ frame: Math.max(0, frame - 10), fps: useVideoConfig().fps, config: { damping: 14, stiffness: 100 } });
  const ring = 1 + Math.sin(frame * .04) * .04;
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", perspective: 1200 }}><div style={{ position: "absolute", left: 110, top: 125 }}><StageTitle p={p} pal={pal} eyebrow="PORTAL DEVICE / 10" width={510} /></div><div style={{ position: "relative", marginLeft: 560, width: 580, height: 720 }}><div style={{ position: "absolute", left: 25, top: 45, width: 530, height: 630, borderRadius: "50%", border: `2px solid ${p.lightColor || pal.accent}88`, boxShadow: `0 0 45px ${p.lightColor || pal.accent}66, inset 0 0 55px ${pal.primary}66`, transform: `scale(${ring}) rotateY(${frame * .35}deg)` }} /><div style={{ position: "absolute", inset: 55, borderRadius: "50%", background: `radial-gradient(ellipse, ${pal.secondary}aa, ${pal.bg} 63%)`, opacity: .75 }} /><div style={{ position: "absolute", left: 130, top: 70, transform: `translateY(${interpolate(enter, [0, 1], [170, 0])}px) rotateY(-19deg)`, opacity: enter }}><DeviceFrame p={p} pal={pal} rotateY={-19} scale={.88} glow /></div></div><div style={{ position: "absolute", right: 110, bottom: 92, display: "flex", gap: 12 }}>{p.features.slice(0, 3).map((f, i) => <Label key={`${f}-${i}`} pal={pal} color={[pal.primary, pal.secondary, pal.accent][i]}>{f}</Label>)}</div></AbsoluteFill>;
};

// Variants compose on a 1920×1080 design canvas with absolute positions.
// Scale the composed canvas as one unit so titles/devices keep their intended
// relationship at any viewport (thumbnails render at 800×450).
const StageFit: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <AbsoluteFill style={{ overflow: "hidden" }}>
    <div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}>{children}</div>
  </AbsoluteFill>;
};

const VARIANTS: Record<DeviceStageVariant, React.FC<{ p: DeviceStageProps; pal: Palette }>> = {
  "turntable-hero": TurntableHero,
  "floating-stack": FloatingStack,
  "glass-stage": GlassStage,
  "wireframe-device": WireframeDevice,
  "light-sweep": LightSweep,
  "shadow-box": ShadowBox,
  "shelf-display": ShelfDisplay,
  "macro-detail": MacroDetail,
  "orbiting-screens": OrbitingScreens,
  "portal-device": PortalDevice,
};

export const DeviceStageTemplate: React.FC<DeviceStageProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? TurntableHero;
  const background = props.background && props.background.startsWith("#") ? props.background : pal.bg;
  const technical = props.variant === "wireframe-device" || props.variant === "orbiting-screens";
  return <AbsoluteFill style={{ backgroundColor: background, overflow: "hidden" }}>
    {technical ? <GridPerspectiveBackground palette={pal} /> : <GradientMeshBackground palette={pal} speed={props.speed ?? .65} blobs={props.variant === "glass-stage" ? 6 : 4} />}
    <FadeEdges inFrames={12} outFrames={14}>{props.variant === "turntable-hero" ? <Variant p={props} pal={pal} /> : <StageFit><Variant p={props} pal={pal} /></StageFit>}</FadeEdges>
  </AbsoluteFill>;
};

const familyCast = (c: React.FC<DeviceStageProps>) => c as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "3d-device-stages-turntable-hero": familyCast(DeviceStageTemplate),
  "3d-device-stages-floating-stack": familyCast(DeviceStageTemplate),
  "3d-device-stages-glass-stage": familyCast(DeviceStageTemplate),
  "3d-device-stages-wireframe-device": familyCast(DeviceStageTemplate),
  "3d-device-stages-light-sweep": familyCast(DeviceStageTemplate),
  "3d-device-stages-shadow-box": familyCast(DeviceStageTemplate),
  "3d-device-stages-shelf-display": familyCast(DeviceStageTemplate),
  "3d-device-stages-macro-detail": familyCast(DeviceStageTemplate),
  "3d-device-stages-orbiting-screens": familyCast(DeviceStageTemplate),
  "3d-device-stages-portal-device": familyCast(DeviceStageTemplate),
};
