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
 * FAMILY: cursor-demos
 * Ten deterministic interaction-story compositions for product demos.
 * The procedural UI is intentionally asset-free; replace labels/content or
 * layer a real screenshot underneath when a production composition needs it.
 */
type CursorDemoVariant =
  | "guided-cursor"
  | "click-ripple"
  | "drag-and-drop"
  | "hover-reveal"
  | "multi-cursor"
  | "keyboard-cursor"
  | "cursor-trail"
  | "spotlight-pointer"
  | "selection-drag"
  | "touch-pointer";

export interface CursorDemosProps {
  variant: CursorDemoVariant;
  title: string;
  subtitle: string;
  paletteName: string;
  cursorLabel?: string;
  actionLabel?: string;
  keyHint?: string;
  primaryText?: string;
  secondaryText?: string;
  labels?: string[];
  points?: Array<[number, number]>;
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';

type VariantProps = { p: CursorDemosProps; pal: Palette };

const UiChrome: React.FC<{ pal: Palette; children?: React.ReactNode; mobile?: boolean }> = ({ pal, children, mobile = false }) => (
  <div style={{ width: "100%", height: "100%", overflow: "hidden", borderRadius: mobile ? 34 : 20, background: pal.bg, border: `1px solid ${pal.text}35`, boxShadow: `0 30px 80px ${pal.bg}cc`, fontFamily: FONT }}>
    <div style={{ height: mobile ? 42 : 52, display: "flex", alignItems: "center", gap: 9, padding: mobile ? "0 15px" : "0 20px", boxSizing: "border-box", background: `${pal.text}12`, borderBottom: `1px solid ${pal.text}26` }}>
      {mobile ? <><div style={{ width: 48, height: 6, borderRadius: 99, background: `${pal.text}75`, margin: "0 auto" }} /></> : <><span style={{ width: 11, height: 11, borderRadius: 99, background: "#ff605c" }} /><span style={{ width: 11, height: 11, borderRadius: 99, background: "#ffbd44" }} /><span style={{ width: 11, height: 11, borderRadius: 99, background: "#00ca4e" }} /><div style={{ marginLeft: 15, flex: 1, height: 27, borderRadius: 7, background: `${pal.bg}aa`, color: `${pal.text}70`, display: "flex", alignItems: "center", padding: "0 12px", font: `12px ${MONO}` }}>app.example.com / workspace</div></>}
    </div>
    <div style={{ position: "relative", height: `calc(100% - ${mobile ? 42 : 52}px)`, overflow: "hidden" }}>{children}</div>
  </div>
);

const UiSurface: React.FC<{ pal: Palette; labels?: string[]; compact?: boolean }> = ({ pal, labels = ["Overview", "Activity", "Settings"], compact = false }) => {
  const items = labels.slice(0, 4);
  return <div style={{ position: "absolute", inset: 0, padding: compact ? 24 : 42, boxSizing: "border-box", background: `linear-gradient(145deg, ${pal.bg}, ${pal.primary}18 52%, ${pal.bgAlt ?? pal.bg})` }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: compact ? 22 : 32 }}>
      <div style={{ width: compact ? 28 : 40, height: compact ? 28 : 40, borderRadius: compact ? 8 : 11, background: `linear-gradient(135deg, ${pal.primary}, ${pal.accent})` }} />
      <div style={{ width: compact ? 118 : 190, height: compact ? 9 : 13, borderRadius: 99, background: `${pal.text}8c` }} />
      <div style={{ marginLeft: "auto", width: compact ? 68 : 110, height: compact ? 9 : 13, borderRadius: 99, background: `${pal.text}25` }} />
    </div>
    <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr 1fr" : "1.35fr .65fr", gap: compact ? 14 : 22, height: compact ? "calc(100% - 52px)" : "calc(100% - 72px)" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ width: "62%", height: compact ? 17 : 25, borderRadius: 8, background: `${pal.text}c2`, marginBottom: 12 }} />
        <div style={{ width: "44%", height: compact ? 8 : 12, borderRadius: 8, background: `${pal.text}42`, marginBottom: compact ? 18 : 28 }} />
        <div style={{ height: compact ? 125 : 205, borderRadius: compact ? 12 : 17, background: `linear-gradient(135deg, ${pal.primary}b8, ${pal.accent}6b)`, border: `1px solid ${pal.text}26`, boxShadow: `0 18px 30px ${pal.bg}99` }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: compact ? 8 : 12, marginTop: compact ? 10 : 16 }}>
          {items.slice(0, 3).map((_, i) => <div key={i} style={{ height: compact ? 34 : 52, borderRadius: compact ? 8 : 11, background: `${pal.text}${i === 1 ? "20" : "10"}`, border: `1px solid ${pal.text}22` }} />)}
        </div>
      </div>
      <div style={{ display: "grid", gap: compact ? 9 : 13, alignContent: "start" }}>
        {items.map((label, i) => <div key={`${label}-${i}`} style={{ minHeight: compact ? 45 : 70, borderRadius: compact ? 9 : 13, padding: compact ? "10px 11px" : "15px 16px", boxSizing: "border-box", color: pal.text, background: `${pal.text}${i === 0 ? "24" : "0d"}`, border: `1px solid ${i === 0 ? pal.accent : pal.text}38` }}><div style={{ fontSize: compact ? 10 : 13, color: `${pal.text}7d`, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em" }}>{label}</div><div style={{ width: `${54 + i * 11}%`, height: compact ? 8 : 11, marginTop: compact ? 8 : 11, borderRadius: 99, background: i === 0 ? pal.accent : `${pal.text}32` }} /></div>)}
      </div>
    </div>
  </div>;
};

const CursorIcon: React.FC<{ pal: Palette; x: number; y: number; color?: string; label?: string; scale?: number; touch?: boolean }> = ({ pal, x, y, color = pal.accent, label, scale = 1, touch = false }) => (
  <div style={{ position: "absolute", left: `${x}%`, top: `${y}%`, zIndex: 20, transform: `translate(-4px, -4px) scale(${scale})`, transformOrigin: "top left", pointerEvents: "none" }}>
    {touch ? <div style={{ width: 54, height: 54, borderRadius: "50%", border: `3px solid ${color}`, background: `${color}2a`, boxShadow: `0 0 0 10px ${color}14`, position: "relative" }}><div style={{ position: "absolute", inset: 13, borderRadius: "50%", background: color }} /></div> : <svg width="34" height="45" viewBox="0 0 34 45" style={{ filter: `drop-shadow(0 5px 6px ${pal.bg}aa)`, transform: "rotate(-18deg)" }}><path d="M3 2l2 36 9-9 8 13 6-4-8-13 11-2z" fill={color} stroke={pal.bg} strokeWidth="2.2" strokeLinejoin="round" /></svg>}
    {label && <span style={{ position: "absolute", left: touch ? 60 : 28, top: touch ? 9 : 28, whiteSpace: "nowrap", padding: "7px 10px", borderRadius: 7, background: color, color: pal.bg, font: `800 13px ${FONT}`, boxShadow: `0 8px 20px ${pal.bg}66` }}>{label}</span>}
  </div>
);

const Caption: React.FC<{ pal: Palette; title: string; subtitle: string; eyebrow?: string }> = ({ pal, title, subtitle, eyebrow = "CURSOR DEMO" }) => {
  const frame = useCurrentFrame();
  const opacity = clampInterp(frame, [5, 24], [0, 1]);
  return <div style={{ color: pal.text, fontFamily: FONT, opacity, transform: `translateY(${clampInterp(frame, [5, 24], [28, 0])}px)` }}>
    <div style={{ color: pal.accent, fontSize: 17, fontWeight: 900, letterSpacing: ".23em", textTransform: "uppercase" }}>{eyebrow}</div>
    <div style={{ marginTop: 13, fontSize: 62, lineHeight: .98, fontWeight: 900, letterSpacing: "-.055em" }}>{title}</div>
    <div style={{ marginTop: 17, color: `${pal.text}a8`, fontSize: 23, lineHeight: 1.3 }}>{subtitle}</div>
  </div>;
};

const GuidedCursor: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const points = p.points ?? [[14, 31], [40, 48], [70, 30], [62, 68]];
  const phase = (frame / 33) % points.length;
  const i = Math.floor(phase);
  const local = phase - i;
  const from = points[i % points.length];
  const to = points[(i + 1) % points.length];
  const x = interpolate(local, [0, 1], [from[0], to[0]]);
  const y = interpolate(local, [0, 1], [from[1], to[1]]);
  const labels = p.labels ?? ["Open workspace", "Choose a view", "Adjust filters", "Ship result"];
  return <AbsoluteFill style={{ padding: "84px 100px", boxSizing: "border-box" }}>
    <div style={{ position: "absolute", left: 100, top: 74, width: 490 }}><Caption pal={pal} title={p.title} subtitle={p.subtitle} /></div>
    <div style={{ position: "absolute", left: 430, top: 205, width: 1110, height: 680 }}><UiChrome pal={pal}><UiSurface pal={pal} labels={labels} /></UiChrome><CursorIcon pal={pal} x={x} y={y} label={p.cursorLabel ?? labels[i % labels.length]} /></div>
    <div style={{ position: "absolute", left: 108, bottom: 70, display: "flex", gap: 9 }}>{labels.slice(0, 4).map((label, idx) => <div key={label} style={{ padding: "10px 13px", borderRadius: 8, color: idx === i ? pal.bg : `${pal.text}9a`, background: idx === i ? pal.accent : `${pal.text}0f`, border: `1px solid ${idx === i ? pal.accent : pal.text}30`, font: `700 14px ${FONT}` }}>{String(idx + 1).padStart(2, "0")} {label}</div>)}</div>
  </AbsoluteFill>;
};

const ClickRipple: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const click = clampInterp(frame, [36, 43], [0, 1]);
  const ripple = clampInterp(frame, [40, 70], [0, 1]);
  return <AbsoluteFill style={{ padding: "84px 100px", boxSizing: "border-box" }}>
    <div style={{ width: 510 }}><Caption pal={pal} title={p.title} subtitle={p.subtitle} eyebrow="CLICK / RESPONSE" /></div>
    <div style={{ position: "absolute", left: 325, top: 235, width: 1270, height: 650 }}><UiChrome pal={pal}><UiSurface pal={pal} labels={p.labels ?? ["Publish", "Audience", "Analytics"]} /></UiChrome>
      <div style={{ position: "absolute", left: "72%", top: "35%", width: 175, height: 64, borderRadius: 12, display: "grid", placeItems: "center", background: click > .5 ? pal.secondary : pal.accent, color: pal.bg, font: `900 18px ${FONT}`, transform: `scale(${interpolate(click, [0, 1], [.96, 1.04])})`, boxShadow: `0 15px 35px ${pal.accent}44` }}>{p.actionLabel ?? "PUBLISH"}</div>
      <CursorIcon pal={pal} x={72} y={35} label={p.cursorLabel ?? "Click to publish"} />
      <div style={{ position: "absolute", left: "72%", top: "35%", width: 28 + ripple * 150, height: 28 + ripple * 150, borderRadius: "50%", border: `3px solid ${pal.accent}`, transform: "translate(-50%, -50%)", opacity: 1 - ripple, pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: "72%", top: "35%", width: 16, height: 16, borderRadius: "50%", background: pal.text, opacity: click * .9, transform: `translate(-50%, -50%) scale(${1 + click * .6})` }} />
    </div>
    <div style={{ position: "absolute", right: 115, bottom: 74, color: `${pal.text}6b`, font: `14px ${MONO}`, letterSpacing: ".15em" }}>ACTION → RESPONSE</div>
  </AbsoluteFill>;
};

const DragAndDrop: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const t = clampInterp(frame, [28, 82], [0, 1]);
  const x = interpolate(t, [0, 1], [26, 72]);
  const y = interpolate(t, [0, 1], [38, 57]);
  const settle = clampInterp(frame, [82, 98], [0, 1]);
  return <AbsoluteFill style={{ padding: "84px 100px", boxSizing: "border-box" }}>
    <div style={{ position: "absolute", left: 100, top: 74, width: 500 }}><Caption pal={pal} title={p.title} subtitle={p.subtitle} eyebrow="DRAG / DROP" /></div>
    <div style={{ position: "absolute", left: 360, top: 220, width: 1250, height: 700 }}><UiChrome pal={pal}><UiSurface pal={pal} labels={p.labels ?? ["Assets", "Canvas", "Layers"]} /></UiChrome>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}><path d="M 26 38 C 39 20, 58 72, 72 57" fill="none" stroke={pal.accent} strokeWidth="0.35" strokeDasharray="1.2 1.5" opacity={.75} /></svg>
      <div style={{ position: "absolute", left: "72%", top: "57%", width: 190, height: 125, borderRadius: 14, border: `2px dashed ${pal.accent}`, background: `${pal.accent}20`, transform: `translate(-50%, -50%) scale(${1 + settle * .05})` }}><div style={{ color: pal.accent, font: `800 14px ${FONT}`, textAlign: "center", marginTop: 48 }}>{p.actionLabel ?? "DROP HERE"}</div></div>
      <div style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: 170, height: 105, borderRadius: 13, background: `linear-gradient(135deg, ${pal.primary}, ${pal.secondary})`, border: `2px solid ${pal.text}70`, transform: `translate(-50%, -50%) rotate(${interpolate(t, [0, 1], [-5, 4])}deg) scale(${1 + settle * .08})`, boxShadow: `0 18px 35px ${pal.bg}99`, color: pal.bg, display: "grid", placeItems: "center", font: `850 15px ${FONT}` }}>{p.primaryText ?? "CARD / 01"}</div>
      <CursorIcon pal={pal} x={x + 7} y={y - 9} label={p.cursorLabel ?? "Drag me"} scale={.9} />
    </div>
  </AbsoluteFill>;
};

const HoverReveal: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const phase = (frame / 48) % 3;
  const i = Math.floor(phase);
  const local = phase - i;
  const positions: Array<[number, number]> = [[25, 49], [50, 49], [75, 49]];
  const [x, y] = positions[i];
  const reveal = clampInterp(local * 48, [20, 42], [0, 1]);
  const labels = p.labels ?? ["Instant search", "Shared views", "Smart alerts"];
  return <AbsoluteFill style={{ padding: "85px 100px", boxSizing: "border-box" }}>
    <div style={{ width: 520 }}><Caption pal={pal} title={p.title} subtitle={p.subtitle} eyebrow="HOVER / REVEAL" /></div>
    <div style={{ position: "absolute", left: 230, top: 300, right: 230, height: 500, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 25 }}>
      {labels.slice(0, 3).map((label, idx) => { const active = idx === i; return <div key={label} style={{ position: "relative", borderRadius: 20, padding: 24, boxSizing: "border-box", color: pal.text, background: active ? `linear-gradient(145deg, ${pal.primary}66, ${pal.accent}28)` : `${pal.text}0b`, border: `1px solid ${active ? pal.accent : pal.text}44`, transform: `translateY(${active ? -14 * reveal : 0}px)`, boxShadow: active ? `0 25px 60px ${pal.accent}28` : "none" }}><div style={{ width: 58, height: 58, borderRadius: 15, background: active ? pal.accent : `${pal.text}22`, marginBottom: 22 }} /><div style={{ fontSize: 22, fontWeight: 850 }}>{label}</div><div style={{ marginTop: 13, color: `${pal.text}7c`, fontSize: 15, lineHeight: 1.35 }}>Point to discover the detail.</div>{active && <div style={{ position: "absolute", left: 20, right: 20, bottom: 20, padding: "10px 12px", borderRadius: 9, background: `${pal.bg}dd`, border: `1px solid ${pal.accent}66`, color: pal.accent, font: `750 13px ${MONO}`, opacity: reveal }}>{p.actionLabel ?? "LEARN MORE"} →</div>}</div>; })}
      <CursorIcon pal={pal} x={x} y={y - 11} label={p.cursorLabel ?? labels[i]} />
    </div>
  </AbsoluteFill>;
};

const MultiCursor: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const cursors = [{ color: pal.accent, label: "Design", offset: 0 }, { color: pal.secondary, label: "Growth", offset: 17 }, { color: pal.primary, label: "Ops", offset: 34 }];
  const points: Array<[number, number]> = [[23, 43], [51, 58], [76, 37], [63, 69]];
  return <AbsoluteFill style={{ padding: "83px 100px", boxSizing: "border-box" }}>
    <div style={{ width: 550 }}><Caption pal={pal} title={p.title} subtitle={p.subtitle} eyebrow="MULTI / CURSOR" /></div>
    <div style={{ position: "absolute", left: 310, top: 220, width: 1300, height: 700 }}><UiChrome pal={pal}><UiSurface pal={pal} labels={p.labels ?? ["Design", "Growth", "Ops", "Shared"]} /></UiChrome>
      {cursors.map((cursor, idx) => { const phase = ((frame + cursor.offset) / 42) % points.length; const i = Math.floor(phase); const local = phase - i; const from = points[i]; const to = points[(i + 1) % points.length]; return <CursorIcon key={cursor.label} pal={pal} color={cursor.color} x={interpolate(local, [0, 1], [from[0], to[0]])} y={interpolate(local, [0, 1], [from[1], to[1]])} label={cursor.label} scale={.82} />; })}
    </div>
    <div style={{ position: "absolute", right: 115, bottom: 74, display: "flex", gap: 18 }}>{cursors.map(c => <span key={c.label} style={{ color: c.color, font: `750 14px ${FONT}` }}>● {c.label}</span>)}</div>
  </AbsoluteFill>;
};

const KeyboardCursor: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - 8, fps, config: { damping: 16, stiffness: 100 } });
  const key = p.keyHint ?? "⌘ K";
  const keys = ["⌘", "K", "↵"];
  return <AbsoluteFill style={{ padding: "92px 115px", boxSizing: "border-box" }}>
    <div style={{ width: 570 }}><Caption pal={pal} title={p.title} subtitle={p.subtitle} eyebrow="KEYBOARD / CURSOR" /></div>
    <div style={{ position: "absolute", left: 520, top: 280, width: 880, height: 390, borderRadius: 24, padding: 40, boxSizing: "border-box", background: `${pal.text}0c`, border: `1px solid ${pal.text}35`, boxShadow: `0 30px 80px ${pal.bg}cc`, transform: `translateY(${interpolate(enter, [0, 1], [80, 0])}px)`, opacity: enter }}>
      <div style={{ color: `${pal.text}74`, font: `800 14px ${MONO}`, letterSpacing: ".15em" }}>COMMAND PALETTE</div>
      <div style={{ marginTop: 24, height: 76, borderRadius: 12, border: `2px solid ${pal.accent}`, background: `${pal.bg}cc`, display: "flex", alignItems: "center", padding: "0 22px", color: pal.text, fontSize: 27 }}><span style={{ color: pal.accent }}>⌕</span><span style={{ marginLeft: 15 }}>{p.primaryText ?? "Search commands"}</span><span style={{ width: 2, height: 34, background: pal.accent, marginLeft: 5, opacity: frame % 30 < 18 ? 1 : 0 }} /></div>
      <div style={{ display: "flex", gap: 12, marginTop: 28 }}>{keys.map((k, i) => <div key={`${k}-${i}`} style={{ minWidth: 48, height: 43, padding: "0 13px", display: "grid", placeItems: "center", borderRadius: 9, color: pal.bg, background: i === 1 && frame > 42 ? pal.accent : `${pal.text}b8`, font: `900 16px ${MONO}`, transform: `translateY(${i === 1 ? Math.sin(frame * .18) * 2 : 0}px)` }}>{k}</div>)}<span style={{ color: `${pal.text}83`, font: `700 15px ${FONT}`, alignSelf: "center", marginLeft: 4 }}>{p.actionLabel ?? "to run"}</span></div>
    </div>
    <CursorIcon pal={pal} x={73} y={47} label={p.cursorLabel ?? "Focus input"} scale={.85} />
  </AbsoluteFill>;
};

const CursorTrail: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const points: Array<[number, number]> = [[20, 35], [39, 59], [62, 33], [78, 66], [54, 73]];
  const phase = (frame / 34) % points.length;
  const i = Math.floor(phase); const local = phase - i;
  const current = [interpolate(local, [0, 1], [points[i][0], points[(i + 1) % points.length][0]]), interpolate(local, [0, 1], [points[i][1], points[(i + 1) % points.length][1]])] as [number, number];
  return <AbsoluteFill style={{ padding: "84px 100px", boxSizing: "border-box" }}>
    <div style={{ width: 540 }}><Caption pal={pal} title={p.title} subtitle={p.subtitle} eyebrow="TRAIL / PATH" /></div>
    <div style={{ position: "absolute", left: 300, top: 225, width: 1320, height: 700, borderRadius: 24, background: `${pal.text}08`, border: `1px solid ${pal.text}25`, overflow: "hidden" }}>
      <svg width="100%" height="100%" viewBox="0 0 1320 700" preserveAspectRatio="none"><path d="M160 210 C300 90 360 520 600 190 S900 500 1120 250" fill="none" stroke={`${pal.accent}55`} strokeWidth="5" strokeDasharray="12 15" /></svg>
      {Array.from({ length: 7 }, (_, j) => { const lag = j * 5; const f = Math.max(0, frame - lag); const ph = (f / 34) % points.length; const idx = Math.floor(ph); const l = ph - idx; const x = interpolate(l, [0, 1], [points[idx][0], points[(idx + 1) % points.length][0]]); const y = interpolate(l, [0, 1], [points[idx][1], points[(idx + 1) % points.length][1]]); return <div key={j} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: 18 - j * 1.4, height: 18 - j * 1.4, borderRadius: "50%", background: pal.accent, opacity: .9 - j * .1, transform: "translate(-50%, -50%)" }} />; })}
      <CursorIcon pal={pal} x={current[0]} y={current[1]} label={p.cursorLabel ?? "Follow the path"} />
    </div>
  </AbsoluteFill>;
};

const SpotlightPointer: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const x = interpolate((frame % 120), [0, 40, 80, 120], [25, 69, 58, 25]);
  const y = interpolate((frame % 120), [0, 40, 80, 120], [40, 43, 68, 40]);
  const pulse = .92 + Math.sin(frame * .12) * .05;
  return <AbsoluteFill style={{ padding: "86px 100px", boxSizing: "border-box" }}>
    <div style={{ width: 550 }}><Caption pal={pal} title={p.title} subtitle={p.subtitle} eyebrow="SPOTLIGHT / POINTER" /></div>
    <div style={{ position: "absolute", left: 260, top: 235, width: 1380, height: 690, borderRadius: 24, overflow: "hidden", background: pal.bg, border: `1px solid ${pal.text}30` }}>
      <UiSurface pal={pal} labels={p.labels ?? ["Signal", "Proof", "Context"]} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle 130px at ${x}% ${y}%, transparent 0 65%, ${pal.bg}b8 100%)` }} />
      <div style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: 210 * pulse, height: 210 * pulse, borderRadius: "50%", border: `2px solid ${pal.accent}`, transform: "translate(-50%, -50%)", boxShadow: `0 0 40px ${pal.accent}66` }} />
      <CursorIcon pal={pal} x={x} y={y} label={p.cursorLabel ?? "Look here"} />
    </div>
  </AbsoluteFill>;
};

const SelectionDrag: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const t = clampInterp(frame, [22, 78], [0, 1]);
  const startX = 26; const endX = 68;
  return <AbsoluteFill style={{ padding: "85px 105px", boxSizing: "border-box" }}>
    <div style={{ width: 510 }}><Caption pal={pal} title={p.title} subtitle={p.subtitle} eyebrow="SELECT / DRAG" /></div>
    <div style={{ position: "absolute", left: 360, top: 220, width: 1200, height: 710, padding: 72, boxSizing: "border-box", borderRadius: 22, background: `${pal.text}0a`, border: `1px solid ${pal.text}2d`, fontFamily: MONO }}>
      <div style={{ color: `${pal.text}72`, fontSize: 14, letterSpacing: ".12em", marginBottom: 30 }}>DOCUMENT / RELEASE-NOTES.MD</div>
      {Array.from({ length: 8 }, (_, i) => <div key={i} style={{ height: 13, width: `${[78, 62, 88, 46, 71, 83, 55, 68][i]}%`, borderRadius: 5, background: `${pal.text}${i === 2 ? "bb" : "32"}`, marginTop: 20 }} />)}
      <div style={{ position: "absolute", left: `${startX + (endX - startX) * t}%`, top: 258, width: `${(endX - startX) * t}%`, height: 30, background: `${pal.accent}66`, border: `1px solid ${pal.accent}`, transform: "translateY(-50%)" }} />
      <CursorIcon pal={pal} x={startX + (endX - startX) * t} y={36} label={p.cursorLabel ?? "Select text"} scale={.82} />
    </div>
    <div style={{ position: "absolute", right: 130, bottom: 76, color: `${pal.text}70`, font: `14px ${MONO}` }}>{p.actionLabel ?? "DRAG TO SELECT"}</div>
  </AbsoluteFill>;
};

const TouchPointer: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame % 100, [0, 35, 70, 100], [25, 47, 74, 25]);
  const y = interpolate(frame % 100, [0, 35, 70, 100], [36, 62, 43, 36]);
  const tap = clampInterp(frame % 100, [32, 48], [0, 1]);
  return <AbsoluteFill style={{ padding: "82px 105px", boxSizing: "border-box" }}>
    <div style={{ width: 540 }}><Caption pal={pal} title={p.title} subtitle={p.subtitle} eyebrow="TOUCH / POINTER" /></div>
    <div style={{ position: "absolute", left: 590, top: 185, width: 440, height: 760 }}><UiChrome pal={pal} mobile><UiSurface pal={pal} compact labels={p.labels ?? ["Home", "Explore", "Saved"]} /></UiChrome><CursorIcon pal={pal} x={x} y={y} label={p.cursorLabel ?? "Swipe to explore"} touch scale={.78} />
      <div style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: 36 + tap * 140, height: 36 + tap * 140, borderRadius: "50%", border: `3px solid ${pal.accent}`, transform: "translate(-50%, -50%)", opacity: 1 - tap }} />
    </div>
    <div style={{ position: "absolute", left: 1080, top: 465, width: 430, color: pal.text, fontFamily: FONT }}><div style={{ color: pal.accent, font: `900 18px ${MONO}`, letterSpacing: ".16em" }}>MOBILE GESTURE</div><div style={{ marginTop: 18, fontSize: 37, fontWeight: 850, lineHeight: 1.05 }}>{p.primaryText ?? "Tap. Swipe. Discover."}</div><div style={{ marginTop: 18, color: `${pal.text}85`, fontSize: 20 }}>{p.secondaryText ?? "Make touch behavior obvious in a single frame."}</div></div>
  </AbsoluteFill>;
};

const VARIANTS: Record<CursorDemoVariant, React.FC<VariantProps>> = {
  "guided-cursor": GuidedCursor,
  "click-ripple": ClickRipple,
  "drag-and-drop": DragAndDrop,
  "hover-reveal": HoverReveal,
  "multi-cursor": MultiCursor,
  "keyboard-cursor": KeyboardCursor,
  "cursor-trail": CursorTrail,
  "spotlight-pointer": SpotlightPointer,
  "selection-drag": SelectionDrag,
  "touch-pointer": TouchPointer,
};

export const CursorDemosTemplate: React.FC<CursorDemosProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? GuidedCursor;
  const technical = props.variant === "spotlight-pointer" || props.variant === "cursor-trail";
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <AbsoluteFill style={{ background: pal.bg, fontFamily: FONT }}>
    {!technical && <GradientMeshBackground palette={pal} blobs={props.variant === "touch-pointer" ? 3 : 5} speed={0.42} />}
    <FadeEdges inFrames={10} outFrames={14}><div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><Variant p={props} pal={pal} /></div></FadeEdges>
  </AbsoluteFill>;
};

const familyCast = (c: React.FC<CursorDemosProps>) => c as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "cursor-demos-guided-cursor": familyCast(CursorDemosTemplate),
  "cursor-demos-click-ripple": familyCast(CursorDemosTemplate),
  "cursor-demos-drag-and-drop": familyCast(CursorDemosTemplate),
  "cursor-demos-hover-reveal": familyCast(CursorDemosTemplate),
  "cursor-demos-multi-cursor": familyCast(CursorDemosTemplate),
  "cursor-demos-keyboard-cursor": familyCast(CursorDemosTemplate),
  "cursor-demos-cursor-trail": familyCast(CursorDemosTemplate),
  "cursor-demos-spotlight-pointer": familyCast(CursorDemosTemplate),
  "cursor-demos-selection-drag": familyCast(CursorDemosTemplate),
  "cursor-demos-touch-pointer": familyCast(CursorDemosTemplate),
};
