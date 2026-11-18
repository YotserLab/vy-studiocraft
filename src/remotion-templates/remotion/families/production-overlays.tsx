import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clampInterp, resolvePalette, type Palette } from "../lib/primitives";

/**
 * FAMILY: production-overlays
 * Production-facing overlays that remain legible over footage and render cleanly
 * without footage, image assets, or network access. All controls are props so the
 * same compositions can be used for review exports and delivery masters.
 */
export type ProductionOverlayVariant =
  | "timecode-overlay"
  | "slate-card"
  | "frame-guides"
  | "color-bars"
  | "review-notes"
  | "version-stamp"
  | "watermark-toggle"
  | "burn-in-caption"
  | "chapter-marker"
  | "delivery-card";

export interface ProductionOverlayProps {
  variant: ProductionOverlayVariant;
  project: string;
  version: string;
  timecode: string;
  notes: string[];
  guides: string[];
  watermark: string;
  deliverySpec: string;
  colors: string[];
  caption: string;
  chapter: string;
  operator: string;
  status: string;
  paletteName: string;
  showTimecode?: boolean;
  showWatermark?: boolean;
  reviewStatus?: string;
  frameRate?: number;
  scene?: string;
}

const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const FALLBACK_COLORS = ["#f4f4f4", "#f4cc28", "#45b7e8", "#4fbe74", "#e65252", "#2d318f", "#111111"];

const fallback = (value: string | undefined, valueIfEmpty: string): string => value?.trim() || valueIfEmpty;
const list = (values: string[] | undefined, defaults: string[]): string[] => {
  const result = (values ?? []).map((value) => value.trim()).filter(Boolean);
  return result.length ? result : defaults;
};

const parseTimecode = (value: string): [number, number, number, number] => {
  const parts = value.split(":").map((part) => Number(part));
  if (parts.length === 4 && parts.every((part) => Number.isFinite(part))) return parts as [number, number, number, number];
  return [0, 0, 0, 0];
};

const formatTimecode = (start: string, frame: number, fps: number): string => {
  const [hours, minutes, seconds, frames] = parseTimecode(start);
  const total = Math.max(0, Math.round(((hours * 3600 + minutes * 60 + seconds) * fps + frames) + frame));
  const currentFrames = total % fps;
  const totalSeconds = Math.floor(total / fps);
  const currentSeconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const currentMinutes = totalMinutes % 60;
  const currentHours = Math.floor(totalMinutes / 60);
  return [currentHours, currentMinutes, currentSeconds, currentFrames]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
};

const fadeIn = (frame: number, start = 0, duration = 16): number => clampInterp(frame, [start, start + duration], [0, 1]);
const fadeOut = (frame: number, duration: number, frames = 14): number => clampInterp(frame, [Math.max(0, duration - frames), duration], [1, 0]);

const Panel: React.FC<{
  children: React.ReactNode;
  pal: Palette;
  opacity?: number;
  style?: React.CSSProperties;
  border?: string;
}> = ({ children, pal, opacity = 1, style, border = `${pal.text}36` }) => (
  <div
    style={{
      background: `${pal.bg}e8`,
      border: `1px solid ${border}`,
      boxShadow: `0 12px 45px ${pal.bg}99`,
      color: pal.text,
      opacity,
      ...style,
    }}
  >
    {children}
  </div>
);

const Label: React.FC<{ children: React.ReactNode; color: string }> = ({ children, color }) => (
  <div style={{ color, font: `700 12px ${MONO}`, letterSpacing: "0.16em", textTransform: "uppercase" }}>{children}</div>
);

const CornerMark: React.FC<{ pal: Palette; label: string }> = ({ pal, label }) => (
  <div style={{ position: "absolute", top: "3.5vh", left: "3.5vw", color: pal.text, font: `700 12px ${MONO}`, letterSpacing: "0.16em", opacity: 0.78 }}>
    <span style={{ color: pal.accent }}>●</span> {label}
  </div>
);

const Grid: React.FC<{ pal: Palette; opacity?: number }> = ({ pal, opacity = 0.12 }) => (
  <AbsoluteFill style={{ opacity, pointerEvents: "none", backgroundImage: `linear-gradient(${pal.text} 1px, transparent 1px), linear-gradient(90deg, ${pal.text} 1px, transparent 1px)`, backgroundSize: "8.333% 8.333%" }} />
);

const Footer: React.FC<{ p: ProductionOverlayProps; pal: Palette; timecode: string }> = ({ p, pal, timecode }) => {
  const watermark = fallback(p.watermark, "PRODUCTION REVIEW");
  return (
    <div style={{ position: "absolute", left: "3.5vw", right: "3.5vw", bottom: "3.5vh", display: "flex", justifyContent: "space-between", alignItems: "center", color: pal.text, font: `11px ${MONO}`, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.8 }}>
      <span>{fallback(p.project, "UNTITLED PROJECT")} / {fallback(p.version, "V01")}</span>
      <span>{timecode}</span>
      <span>{watermark}</span>
    </div>
  );
};

const TimecodeOverlay: React.FC<{ p: ProductionOverlayProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const opacity = fadeIn(frame) * fadeOut(frame, durationInFrames);
  const timecode = formatTimecode(fallback(p.timecode, "00:00:00:00"), frame, p.frameRate ?? fps);
  return (
    <AbsoluteFill style={{ opacity, color: pal.text, fontFamily: MONO, pointerEvents: "none" }}>
      <Grid pal={pal} opacity={0.035} />
      <div style={{ position: "absolute", top: "5vh", right: "4vw", padding: "10px 14px", background: `${pal.bg}b8`, border: `1px solid ${pal.text}4a`, fontSize: "clamp(18px, 2.4vw, 38px)", letterSpacing: "0.08em", fontVariantNumeric: "tabular-nums" }}>{timecode}</div>
      <CornerMark pal={pal} label={fallback(p.project, "PROJECT")}/>
      <Footer p={p} pal={pal} timecode={timecode} />
    </AbsoluteFill>
  );
};

const SlateCard: React.FC<{ p: ProductionOverlayProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const intro = fadeIn(frame, 0, 12);
  const scale = interpolate(frame, [0, 18], [0.94, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const notes = list(p.notes, ["No notes", "Slate / sync / review"]);
  return (
    <AbsoluteFill style={{ background: pal.bg, color: pal.text, fontFamily: SANS, opacity: intro * fadeOut(frame, durationInFrames) }}>
      <Grid pal={pal} opacity={0.08} />
      <div style={{ position: "absolute", inset: "11vh 10vw", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${scale})` }}>
        <Panel pal={pal} border={pal.accent} style={{ width: "min(780px, 76vw)", padding: "6vh 6vw", textAlign: "center" }}>
          <Label color={pal.accent}>Production slate</Label>
          <div style={{ marginTop: 22, font: `700 clamp(42px, 7vw, 108px) ${SANS}`, letterSpacing: "-0.04em" }}>{fallback(p.project, "UNTITLED PROJECT")}</div>
          <div style={{ marginTop: 18, color: pal.secondary, font: `500 clamp(18px, 2vw, 30px) ${MONO}` }}>{fallback(p.scene, "SCENE 01")} / {fallback(p.version, "V01")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginTop: 42, textAlign: "left", font: `13px ${MONO}` }}>
            {notes.slice(0, 4).map((note, index) => <div key={`${note}-${index}`} style={{ padding: "12px 14px", borderTop: `1px solid ${pal.text}38`, color: index === 0 ? pal.accent : pal.text }}>{note}</div>)}
          </div>
          <div style={{ marginTop: 38, color: pal.muted ?? pal.secondary, font: `12px ${MONO}`, letterSpacing: "0.1em" }}>{fallback(p.operator, "OPERATOR")} / {fallback(p.status, "READY")}</div>
        </Panel>
      </div>
      <Footer p={p} pal={pal} timecode={formatTimecode(p.timecode, frame, p.frameRate ?? 30)} />
    </AbsoluteFill>
  );
};

const SafeFrame: React.FC<{ pal: Palette; inset: string; label: string; color: string; dashed?: boolean }> = ({ pal, inset, label, color, dashed = false }) => (
  <div style={{ position: "absolute", inset, border: `2px ${dashed ? "dashed" : "solid"} ${color}`, pointerEvents: "none" }}>
    <div style={{ position: "absolute", top: -22, left: 0, color, background: pal.bg, padding: "3px 7px", font: `11px ${MONO}`, letterSpacing: "0.12em" }}>{label}</div>
    <div style={{ position: "absolute", top: "50%", left: "50%", width: 16, height: 16, transform: "translate(-50%, -50%)", border: `1px solid ${color}`, borderRadius: "50%" }} />
  </div>
);

const FrameGuides: React.FC<{ p: ProductionOverlayProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = fadeIn(frame, 0, 10) * fadeOut(frame, durationInFrames, 10);
  const guides = list(p.guides, ["ACTION SAFE 90%", "TITLE SAFE 80%"]);
  return (
    <AbsoluteFill style={{ opacity, color: pal.text, fontFamily: MONO }}>
      <Grid pal={pal} opacity={0.07} />
      <SafeFrame pal={pal} inset="5%" label={guides[0]} color={pal.accent} />
      <SafeFrame pal={pal} inset="10%" label={guides[1]} color={pal.secondary} dashed />
      <div style={{ position: "absolute", inset: 0, border: `1px solid ${pal.text}3a` }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", width: "12%", height: "21.333%", transform: "translate(-50%, -50%)", border: `1px solid ${pal.text}66` }} />
      <div style={{ position: "absolute", left: "3.5vw", top: "3.5vh", fontSize: 12, letterSpacing: "0.12em" }}>FRAME GUIDES / {fallback(p.project, "PROJECT")}</div>
      <div style={{ position: "absolute", right: "3.5vw", top: "3.5vh", color: pal.accent, fontSize: 12 }}>16:9 / 100%</div>
      <Footer p={p} pal={pal} timecode={formatTimecode(p.timecode, frame, p.frameRate ?? 30)} />
    </AbsoluteFill>
  );
};

const ColorBars: React.FC<{ p: ProductionOverlayProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const colors = list(p.colors, FALLBACK_COLORS);
  const opacity = fadeIn(frame, 0, 8) * fadeOut(frame, durationInFrames, 8);
  return (
    <AbsoluteFill style={{ background: "#111", color: "#fff", fontFamily: MONO, opacity }}>
      <div style={{ position: "absolute", inset: "12% 6% 24%", display: "flex" }}>{colors.slice(0, 7).map((color, index) => <div key={`${color}-${index}`} style={{ flex: 1, background: color }} />)}</div>
      <div style={{ position: "absolute", left: "6%", right: "6%", bottom: "12%", height: "12%", display: "flex" }}><div style={{ flex: 1, background: "#111" }} /><div style={{ flex: 1, background: "#fff" }} /><div style={{ flex: 1, background: pal.accent }} /><div style={{ flex: 1, background: pal.secondary }} /><div style={{ flex: 1, background: "#111" }} /></div>
      <div style={{ position: "absolute", top: "4%", left: "6%", fontSize: "clamp(18px, 2.5vw, 38px)", letterSpacing: "0.08em" }}>COLOR BARS / {fallback(p.project, "PROJECT")}</div>
      <div style={{ position: "absolute", top: "4%", right: "6%", color: pal.accent }}>{fallback(p.status, "CALIBRATION")}</div>
      <Footer p={p} pal={pal} timecode={formatTimecode(p.timecode, frame, p.frameRate ?? 30)} />
    </AbsoluteFill>
  );
};

const ReviewNotes: React.FC<{ p: ProductionOverlayProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width } = useVideoConfig();
  const notes = list(p.notes, ["Confirm title safe", "Check music dip at 00:12", "Client review pending"]);
  const active = Math.min(notes.length - 1, Math.floor(frame / Math.max(1, Math.floor(durationInFrames / notes.length))));
  const bubbleWidth = Math.min(280, Math.max(190, width * 0.24));
  return (
    <AbsoluteFill style={{ background: `${pal.bg}cc`, color: pal.text, fontFamily: SANS }}>
      <div style={{ position: "absolute", left: "6vw", top: "8vh", width: "min(680px, 58vw)", maxWidth: "calc(100vw - 12vw)", minWidth: 0 }}>
        <Label color={pal.accent}>Client review / notes</Label>
        <div style={{ marginTop: 16, maxWidth: "100%", minWidth: 0, font: `700 clamp(30px, 4vw, 62px) ${SANS}`, lineHeight: 1.05, whiteSpace: "normal", overflowWrap: "anywhere", wordBreak: "break-word" }}>{fallback(p.project, "UNTITLED PROJECT")}</div>
        <div style={{ marginTop: 10, color: pal.secondary, font: `14px ${MONO}` }}>{fallback(p.reviewStatus, "IN REVIEW")} / {fallback(p.version, "V01")}</div>
        <div style={{ marginTop: 38, display: "grid", gap: 10, width: "100%" }}>{notes.slice(0, 5).map((note, index) => <div key={`${note}-${index}`} style={{ display: "flex", gap: 16, alignItems: "flex-start", boxSizing: "border-box", width: "100%", minWidth: 0, padding: "15px 18px", background: index === active ? `${pal.accent}22` : `${pal.text}08`, border: `1px solid ${index === active ? pal.accent : `${pal.text}1e`}`, opacity: index > active ? 0.45 : 1 }}><span style={{ flex: "0 0 23px", width: 23, height: 23, display: "grid", placeItems: "center", borderRadius: "50%", background: index < active ? pal.secondary : index === active ? pal.accent : "transparent", border: `1px solid ${index <= active ? "transparent" : pal.text + "66"}`, color: pal.bg, font: `700 12px ${MONO}` }}>{index < active ? "✓" : String(index + 1).padStart(2, "0")}</span><span style={{ flex: 1, minWidth: 0, font: `16px ${SANS}`, lineHeight: 1.3, overflowWrap: "anywhere", wordBreak: "break-word" }}>{note}</span></div>)}</div>
      </div>
      <div style={{ position: "absolute", right: "6vw", top: "11vh", width: bubbleWidth, maxWidth: "calc(100vw - 12vw)", boxSizing: "border-box", padding: "16px 18px", borderLeft: `3px solid ${pal.accent}`, background: `${pal.bg}e8`, color: pal.secondary, font: `12px ${MONO}`, lineHeight: 1.35, overflow: "hidden", overflowWrap: "anywhere", wordBreak: "break-word" }}>
        <Label color={pal.accent}>NOTE {String(active + 1).padStart(2, "0")} / {String(notes.length).padStart(2, "0")}</Label>
        <div style={{ marginTop: 10, color: pal.text, font: `600 clamp(14px, 1.2vw, 20px) ${SANS}`, lineHeight: 1.25, display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 4, overflow: "hidden", overflowWrap: "anywhere", wordBreak: "break-word" }}>{notes[active]}</div>
        <div style={{ marginTop: 12, color: pal.secondary }}>{fallback(p.operator, "EDITORIAL")}</div>
      </div>
      <Footer p={p} pal={pal} timecode={formatTimecode(p.timecode, frame, p.frameRate ?? 30)} />
    </AbsoluteFill>
  );
};

const VersionStamp: React.FC<{ p: ProductionOverlayProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const enter = fadeIn(frame, 0, 18);
  const exit = fadeOut(frame, durationInFrames, 18);
  return (
    <AbsoluteFill style={{ color: pal.text, fontFamily: MONO, opacity: enter * exit }}>
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, transparent 0 44%, ${pal.accent}20 44% 56%, transparent 56%)` }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: `translate(-50%, -50%) rotate(-12deg) scale(${0.88 + enter * 0.12})`, border: `4px solid ${pal.accent}`, padding: "22px 42px", color: pal.accent, textAlign: "center" }}>
        <div style={{ fontSize: 14, letterSpacing: "0.24em" }}>VERSION STAMP</div>
        <div style={{ marginTop: 10, font: `900 clamp(58px, 12vw, 180px) ${MONO}`, letterSpacing: "-0.08em" }}>{fallback(p.version, "V01")}</div>
        <div style={{ marginTop: 12, fontSize: 14, letterSpacing: "0.14em" }}>{fallback(p.status, "INTERNAL REVIEW")}</div>
      </div>
      <div style={{ position: "absolute", top: "6vh", left: "6vw", fontSize: 14, letterSpacing: "0.16em" }}>{fallback(p.project, "PROJECT")}</div>
      <Footer p={p} pal={pal} timecode={formatTimecode(p.timecode, frame, p.frameRate ?? 30)} />
    </AbsoluteFill>
  );
};

const WatermarkToggle: React.FC<{ p: ProductionOverlayProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const isVisible = p.showWatermark !== false;
  const pulse = 0.76 + Math.sin(frame * 0.08) * 0.12;
  const reveal = isVisible ? fadeIn(frame, 10, 14) * fadeOut(frame, durationInFrames, 12) : 0;
  return (
    <AbsoluteFill style={{ color: pal.text, fontFamily: MONO }}>
      <div style={{ position: "absolute", inset: 0, border: `2px solid ${pal.accent}`, opacity: 0.22 }} />
      <div style={{ position: "absolute", top: "5vh", right: "4vw", opacity: reveal * pulse, padding: "9px 13px", border: `1px solid ${pal.accent}`, color: pal.accent, fontSize: "clamp(14px, 1.8vw, 25px)", letterSpacing: "0.14em", background: `${pal.bg}99` }}>{fallback(p.watermark, "PREVIEW / DO NOT DISTRIBUTE")}</div>
      <div style={{ position: "absolute", left: "4vw", top: "5vh", color: pal.secondary, opacity: 0.8, fontSize: 12 }}>WATERMARK {isVisible ? "ON" : "OFF"}</div>
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", color: pal.text, opacity: 0.14, font: `700 clamp(40px, 9vw, 140px) ${MONO}`, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{isVisible ? "REVIEW" : "CLEAN"}</div>
      <Footer p={p} pal={pal} timecode={formatTimecode(p.timecode, frame, p.frameRate ?? 30)} />
    </AbsoluteFill>
  );
};

const BurnInCaption: React.FC<{ p: ProductionOverlayProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const caption = fallback(p.caption, "Burn-in caption preview");
  const progress = fadeIn(frame, 5, 12) * fadeOut(frame, durationInFrames, 12);
  return (
    <AbsoluteFill style={{ color: pal.text, fontFamily: SANS }}>
      <div style={{ position: "absolute", left: "8vw", right: "8vw", bottom: "13vh", opacity: progress }}>
        <div style={{ display: "inline-block", padding: "8px 12px", background: pal.accent, color: pal.bg, font: `700 11px ${MONO}`, letterSpacing: "0.14em" }}>CAPTION / {fallback(p.operator, "SPEAKER")}</div>
        <div style={{ marginTop: 8, maxWidth: "86vw", padding: "14px 20px", background: `${pal.bg}e8`, borderLeft: `4px solid ${pal.accent}`, font: `600 clamp(24px, 3.5vw, 56px) ${SANS}`, lineHeight: 1.12 }}>{caption}</div>
        <div style={{ marginTop: 10, height: 3, width: `${clampInterp(frame, [5, 45], [8, 100])}%`, background: pal.accent }} />
      </div>
      <div style={{ position: "absolute", top: "5vh", left: "5vw", color: pal.secondary, font: `12px ${MONO}`, letterSpacing: "0.12em" }}>BURN-IN / {fallback(p.version, "V01")}</div>
      <Footer p={p} pal={pal} timecode={formatTimecode(p.timecode, frame, p.frameRate ?? 30)} />
    </AbsoluteFill>
  );
};

const ChapterMarker: React.FC<{ p: ProductionOverlayProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const enter = fadeIn(frame, 0, 20);
  const chapter = fallback(p.chapter, "CHAPTER 01 / OPENING");
  const progress = clampInterp(frame, [0, durationInFrames], [0, 1]);
  return (
    <AbsoluteFill style={{ color: pal.text, fontFamily: SANS, opacity: enter * fadeOut(frame, durationInFrames, 18) }}>
      <div style={{ position: "absolute", left: "7vw", right: "7vw", top: "50%", transform: "translateY(-50%)" }}>
        <Label color={pal.accent}>Chapter marker</Label>
        <div style={{ marginTop: 20, font: `700 clamp(48px, 9vw, 140px) ${SANS}`, letterSpacing: "-0.06em" }}>{chapter}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 32 }}><span style={{ color: pal.accent, font: `700 14px ${MONO}` }}>00</span><div style={{ flex: 1, height: 5, background: `${pal.text}26` }}><div style={{ width: `${progress * 100}%`, height: "100%", background: pal.accent }} /></div><span style={{ color: pal.secondary, font: `700 14px ${MONO}` }}>01</span></div>
        <div style={{ marginTop: 16, color: pal.secondary, font: `14px ${MONO}`, letterSpacing: "0.08em" }}>{fallback(p.project, "PROJECT")} / {fallback(p.version, "V01")}</div>
      </div>
      <div style={{ position: "absolute", left: "7vw", right: "7vw", top: "37%", height: 1, background: pal.accent, transform: `scaleX(${clampInterp(frame, [0, 18], [0, 1])})`, transformOrigin: "left" }} />
      <Footer p={p} pal={pal} timecode={formatTimecode(p.timecode, frame, p.frameRate ?? 30)} />
    </AbsoluteFill>
  );
};

const DeliveryCard: React.FC<{ p: ProductionOverlayProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const specs = list(p.deliverySpec.split("|"), ["1920 × 1080", "30 FPS", "H.264 / PRORES", "STEREO / 48KHZ"]);
  const enter = fadeIn(frame, 0, 16);
  return (
    <AbsoluteFill style={{ background: pal.bg, color: pal.text, fontFamily: SANS, opacity: enter * fadeOut(frame, durationInFrames, 16) }}>
      <Grid pal={pal} opacity={0.06} />
      <div style={{ position: "absolute", left: "9vw", right: "9vw", top: "10vh", bottom: "11vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", borderBottom: `2px solid ${pal.accent}`, paddingBottom: 20 }}><div><Label color={pal.accent}>Delivery specification</Label><div style={{ marginTop: 16, font: `700 clamp(36px, 6vw, 86px) ${SANS}` }}>{fallback(p.project, "UNTITLED PROJECT")}</div></div><div style={{ color: pal.secondary, font: `700 18px ${MONO}` }}>{fallback(p.version, "V01")}</div></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1, marginTop: 38, background: `${pal.text}2c` }}>{specs.slice(0, 8).map((spec, index) => <div key={`${spec}-${index}`} style={{ minHeight: 90, padding: "20px 22px", background: pal.bg, color: index === 0 ? pal.accent : pal.text, font: `500 clamp(16px, 2vw, 28px) ${MONO}` }}><span style={{ display: "block", color: pal.secondary, font: `11px ${MONO}`, letterSpacing: "0.14em", marginBottom: 12 }}>SPEC {String(index + 1).padStart(2, "0")}</span>{spec}</div>)}</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32, color: pal.secondary, font: `13px ${MONO}` }}><span>{fallback(p.operator, "POST PRODUCTION")}</span><span style={{ color: pal.accent }}>{fallback(p.status, "READY FOR DELIVERY")}</span></div>
      </div>
      <Footer p={p} pal={pal} timecode={formatTimecode(p.timecode, frame, p.frameRate ?? 30)} />
    </AbsoluteFill>
  );
};

const ProductionRenderer: React.FC<{ p: ProductionOverlayProps; pal: Palette }> = ({ p, pal }) => {
  switch (p.variant) {
    case "timecode-overlay": return <TimecodeOverlay p={p} pal={pal} />;
    case "slate-card": return <SlateCard p={p} pal={pal} />;
    case "frame-guides": return <FrameGuides p={p} pal={pal} />;
    case "color-bars": return <ColorBars p={p} pal={pal} />;
    case "review-notes": return <ReviewNotes p={p} pal={pal} />;
    case "version-stamp": return <VersionStamp p={p} pal={pal} />;
    case "watermark-toggle": return <WatermarkToggle p={p} pal={pal} />;
    case "burn-in-caption": return <BurnInCaption p={p} pal={pal} />;
    case "chapter-marker": return <ChapterMarker p={p} pal={pal} />;
    case "delivery-card": return <DeliveryCard p={p} pal={pal} />;
    default: return <TimecodeOverlay p={p} pal={pal} />;
  }
};

export const ProductionOverlays: React.FC<{ p: ProductionOverlayProps; pal: Palette }> = ({ p, pal }) => <ProductionRenderer p={p} pal={pal} />;

const familyCast = (variant: ProductionOverlayVariant) => ((props: Record<string, unknown>) => {
  const p = { ...(props as unknown as ProductionOverlayProps), variant };
  return <ProductionOverlays p={p} pal={resolvePalette(p.paletteName ?? "midnight")} />;
}) as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "production-overlays-timecode-overlay": familyCast("timecode-overlay"),
  "production-overlays-slate-card": familyCast("slate-card"),
  "production-overlays-frame-guides": familyCast("frame-guides"),
  "production-overlays-color-bars": familyCast("color-bars"),
  "production-overlays-review-notes": familyCast("review-notes"),
  "production-overlays-version-stamp": familyCast("version-stamp"),
  "production-overlays-watermark-toggle": familyCast("watermark-toggle"),
  "production-overlays-burn-in-caption": familyCast("burn-in-caption"),
  "production-overlays-chapter-marker": familyCast("chapter-marker"),
  "production-overlays-delivery-card": familyCast("delivery-card"),
};
