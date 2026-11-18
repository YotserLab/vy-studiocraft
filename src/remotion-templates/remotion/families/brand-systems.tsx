import React from "react";
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, clampInterp, resolvePalette, type Palette } from "../lib/primitives";

/**
 * FAMILY: brand-systems
 * A deterministic identity-system toolkit: logo, palette, typography, voice,
 * applications, rollout, and closing frames. Every scene renders without assets;
 * logoUrl and other media are optional overrides for production use.
 */
export type BrandVariant =
  | "identity-open"
  | "logo-to-system"
  | "palette-reveal"
  | "type-pairing"
  | "application-grid"
  | "brand-in-motion"
  | "voice-values"
  | "system-carousel"
  | "brand-rollout"
  | "identity-close";

export interface BrandSystemProps {
  variant: BrandVariant;
  brandName: string;
  tagline?: string;
  logoUrl?: string;
  colors?: string[];
  fonts?: string[];
  values?: string[];
  applications?: string[];
  background?: string;
  motionStyle?: string;
  paletteName?: string;
}

const FONT_STACK = '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
const SERIF_STACK = 'Georgia, "Times New Roman", serif';

const splitList = (value: string | string[] | undefined, fallback: string[]): string[] => {
  const items = Array.isArray(value)
    ? value.map((item) => item.trim()).filter(Boolean)
    : (value ?? "").split("|").map((item) => item.trim()).filter(Boolean);
  return items.length > 0 ? items : fallback;
};

const motionValue = (value: string | undefined): string => value?.trim() || "Measured motion";

const reveal = (frame: number, start: number, duration = 18): React.CSSProperties => {
  const progress = clampInterp(frame, [start, start + duration], [0, 1]);
  return {
    opacity: progress,
    transform: `translateY(${(1 - progress) * 22}px)`,
  };
};

const scaleReveal = (frame: number, start: number, duration = 22): React.CSSProperties => {
  const progress = clampInterp(frame, [start, start + duration], [0, 1]);
  return {
    opacity: progress,
    transform: `scale(${0.84 + progress * 0.16})`,
  };
};

const lineReveal = (frame: number, start: number, duration = 24): React.CSSProperties => ({
  transform: `scaleX(${clampInterp(frame, [start, start + duration], [0, 1])})`,
  transformOrigin: "left center",
});

const LogoMark: React.FC<{
  name: string;
  logoUrl?: string;
  color: string;
  size?: number;
  inverse?: boolean;
}> = ({ name, logoUrl, color, size = 92, inverse = false }) => {
  const initial = (name.trim()[0] || "B").toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        background: inverse ? color : `linear-gradient(135deg, ${color}, ${color}bb)`,
        color: inverse ? "#101014" : "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
        boxShadow: `0 ${Math.max(8, size * 0.14)}px ${Math.max(18, size * 0.3)}px ${color}28`,
      }}
    >
      {logoUrl ? (
        <Img src={logoUrl} style={{ width: "100%", height: "100%", objectFit: "contain", backgroundColor: "#fff" }} />
      ) : (
        <span style={{ fontFamily: SERIF_STACK, fontSize: size * 0.52, lineHeight: 1, fontWeight: 700 }}>{initial}</span>
      )}
    </div>
  );
};

const MiniLogo: React.FC<{ name: string; logoUrl?: string; color: string; size?: number }> = ({ name, logoUrl, color, size = 42 }) => (
  <LogoMark name={name} logoUrl={logoUrl} color={color} size={size} />
);

const Wordmark: React.FC<{ name: string; pal: Palette; size?: number; serif?: boolean }> = ({ name, pal, size = 42, serif = false }) => (
  <div style={{ color: pal.text, fontSize: size, fontWeight: serif ? 400 : 680, letterSpacing: serif ? "-0.035em" : "-0.045em", fontFamily: serif ? SERIF_STACK : FONT_STACK }}>
    {name}
  </div>
);

const Rule: React.FC<{ pal: Palette; frame: number; start: number; color?: string; width?: number | string }> = ({ pal, frame, start, color, width = "100%" }) => (
  <div style={{ width, height: 2, backgroundColor: color ?? `${pal.text}38`, ...lineReveal(frame, start) }} />
);

const Scene: React.FC<{ pal: Palette; background?: string; children: React.ReactNode }> = ({ pal, background, children }) => (
  <AbsoluteFill style={{ background: background || pal.bg, color: pal.text, fontFamily: FONT_STACK, overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 0, opacity: 0.38, backgroundImage: `linear-gradient(${pal.text}0d 1px, transparent 1px), linear-gradient(90deg, ${pal.text}0d 1px, transparent 1px)`, backgroundSize: "96px 96px", maskImage: "linear-gradient(to bottom, black, transparent 82%)" }} />
    <div style={{ position: "absolute", top: 54, left: 64, right: 64, display: "flex", justifyContent: "space-between", color: `${pal.text}70`, fontSize: 14, letterSpacing: "0.19em", textTransform: "uppercase" }}>
      <span>Identity system</span>
      <span>Brand / 01</span>
    </div>
    <FadeEdges inFrames={10} outFrames={14}>{children}</FadeEdges>
  </AbsoluteFill>
);

const IdentityOpen: React.FC<{ p: BrandSystemProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 100 }}>
      <div style={{ ...scaleReveal(frame, 4), position: "relative" }}>
        <div style={{ position: "absolute", inset: -70, border: `1px solid ${pal.accent}66`, borderRadius: "50%", transform: `rotate(${frame * 0.35}deg) scale(${1 + Math.sin(frame * 0.03) * 0.03})` }} />
        <LogoMark name={p.brandName} logoUrl={p.logoUrl} color={pal.accent} size={156} />
      </div>
      <div style={{ ...reveal(frame, 20), marginTop: 48 }}><Wordmark name={p.brandName} pal={pal} size={92} serif /></div>
      <div style={{ ...reveal(frame, 34), color: pal.secondary, marginTop: 20, fontSize: 22, letterSpacing: "0.18em", textTransform: "uppercase" }}>{p.tagline || "A clearer way forward"}</div>
      <div style={{ ...reveal(frame, 48), marginTop: 66, display: "flex", alignItems: "center", gap: 18, color: `${pal.text}68`, fontSize: 15, letterSpacing: "0.15em", textTransform: "uppercase" }}>
        <span style={{ width: 42, height: 1, background: pal.accent }} />
        <span>Identity, made tangible</span>
        <span style={{ width: 42, height: 1, background: pal.accent }} />
      </div>
    </AbsoluteFill>
  );
};

const LogoToSystem: React.FC<{ p: BrandSystemProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const colors = p.colors?.length ? p.colors : [pal.accent, pal.primary, pal.secondary, pal.text];
  const items = ["Mark", "Wordmark", "Clearspace", "Lockup"];
  return (
    <AbsoluteFill style={{ padding: "138px 126px 92px" }}>
      <div style={{ ...reveal(frame, 2), display: "flex", alignItems: "end", justifyContent: "space-between" }}>
        <div><div style={{ color: pal.accent, fontSize: 17, letterSpacing: "0.2em", textTransform: "uppercase" }}>From one signal</div><div style={{ marginTop: 18, fontSize: 66, fontWeight: 650, letterSpacing: "-0.05em" }}>One system, many expressions.</div></div>
        <div style={{ color: pal.secondary, fontSize: 18 }}>{p.brandName} / Foundations</div>
      </div>
      <Rule pal={pal} frame={frame} start={16} color={`${pal.text}40`} />
      <div style={{ marginTop: 44, display: "grid", gridTemplateColumns: "1.15fr 1fr 1fr 1fr", gap: 18 }}>
        {items.map((label, index) => (
          <div key={label} style={{ ...reveal(frame, 24 + index * 7), minHeight: 470, border: `1px solid ${pal.text}2b`, borderRadius: 16, padding: 30, display: "flex", flexDirection: "column", justifyContent: "space-between", background: `${pal.text}06` }}>
            <div style={{ color: `${pal.text}70`, fontSize: 15, letterSpacing: "0.16em", textTransform: "uppercase" }}>0{index + 1}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
              {index === 0 ? <LogoMark name={p.brandName} logoUrl={p.logoUrl} color={pal.accent} size={146} /> : index === 1 ? <Wordmark name={p.brandName} pal={pal} size={36} serif /> : index === 2 ? <div style={{ border: `1px dashed ${pal.accent}`, padding: 52, color: pal.accent, fontSize: 44, fontWeight: 700 }}>{(p.brandName[0] || "B").toUpperCase()}</div> : <div style={{ display: "flex", alignItems: "center", gap: 14 }}><MiniLogo name={p.brandName} logoUrl={p.logoUrl} color={pal.accent} /><Wordmark name={p.brandName} pal={pal} size={24} /></div>}
            </div>
            <div><div style={{ fontSize: 27, fontWeight: 600 }}>{label}</div><div style={{ marginTop: 10, color: pal.secondary, fontSize: 16, lineHeight: 1.4 }}>{index === 2 ? "Protect the breathing room." : "A consistent, recognizable cue."}</div></div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const PaletteReveal: React.FC<{ p: BrandSystemProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const colors = p.colors?.length ? p.colors : [pal.accent, pal.primary, pal.secondary, pal.text, pal.bg];
  return (
    <AbsoluteFill style={{ padding: "146px 130px 108px" }}>
      <div style={{ ...reveal(frame, 2), display: "flex", justifyContent: "space-between", alignItems: "end" }}><div><div style={{ color: pal.accent, fontSize: 17, letterSpacing: "0.2em", textTransform: "uppercase" }}>02 / Color language</div><div style={{ marginTop: 18, fontSize: 76, fontWeight: 620, letterSpacing: "-0.06em" }}>Color carries meaning.</div></div><MiniLogo name={p.brandName} logoUrl={p.logoUrl} color={pal.accent} size={62} /></div>
      <div style={{ marginTop: 35, color: pal.secondary, fontSize: 22 }}>{p.tagline || "A palette built for contrast, warmth, and recognition."}</div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(colors.length, 5)}, 1fr)`, gap: 16, marginTop: 74 }}>
        {colors.slice(0, 5).map((color, index) => {
          const shade = color.startsWith("#") ? color : [pal.accent, pal.primary, pal.secondary, pal.text, pal.bg][index % 5];
          return <div key={`${shade}-${index}`} style={{ ...reveal(frame, 22 + index * 8), height: 440, borderRadius: 18, background: shade, color: index === 4 ? pal.text : "#fff", padding: 28, display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: `0 24px 70px ${shade}35` }}><div style={{ fontSize: 16, letterSpacing: "0.15em", textTransform: "uppercase", opacity: 0.72 }}>Color / 0{index + 1}</div><div><div style={{ fontFamily: SERIF_STACK, fontSize: 37 }}>{["Signal", "Foundation", "Support", "Ink", "Canvas"][index]}</div><div style={{ marginTop: 12, fontFamily: "monospace", fontSize: 17, opacity: 0.74 }}>{shade}</div></div></div>;
        })}
      </div>
      <div style={{ ...reveal(frame, 66), marginTop: 24, display: "flex", justifyContent: "space-between", color: `${pal.text}6e`, fontSize: 15, letterSpacing: "0.12em", textTransform: "uppercase" }}><span>Accessible contrast is a feature</span><span>{colors.length} core tokens</span></div>
    </AbsoluteFill>
  );
};

const TypePairing: React.FC<{ p: BrandSystemProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const fonts = p.fonts?.length ? p.fonts : ["Display / Editorial", "Sans / Utility", "Mono / Detail"];
  return (
    <AbsoluteFill style={{ padding: "140px 142px 104px" }}>
      <div style={{ ...reveal(frame, 2), display: "flex", justifyContent: "space-between" }}><div><div style={{ color: pal.accent, fontSize: 17, letterSpacing: "0.2em", textTransform: "uppercase" }}>03 / Typography</div><div style={{ marginTop: 18, fontSize: 74, fontWeight: 620, letterSpacing: "-0.06em" }}>The voice has a shape.</div></div><div style={{ color: pal.secondary, fontSize: 18, paddingTop: 34 }}>{motionValue(p.motionStyle)}</div></div>
      <Rule pal={pal} frame={frame} start={17} color={`${pal.text}40`} />
      <div style={{ marginTop: 44, display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 22 }}>
        <div style={{ ...reveal(frame, 25), border: `1px solid ${pal.text}2b`, borderRadius: 18, padding: 42, minHeight: 560, background: `${pal.text}06` }}><div style={{ color: pal.secondary, fontSize: 15, letterSpacing: "0.16em", textTransform: "uppercase" }}>{fonts[0]}</div><div style={{ marginTop: 76, fontFamily: SERIF_STACK, fontSize: 92, lineHeight: 0.98, letterSpacing: "-0.065em" }}>{p.brandName}</div><div style={{ marginTop: 32, fontFamily: SERIF_STACK, color: pal.secondary, fontSize: 31, lineHeight: 1.2 }}>{p.tagline || "Make room for a better point of view."}</div></div>
        <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 22 }}>
          <div style={{ ...reveal(frame, 34), border: `1px solid ${pal.text}2b`, borderRadius: 18, padding: 34 }}><div style={{ color: pal.secondary, fontSize: 15, letterSpacing: "0.16em", textTransform: "uppercase" }}>{fonts[1] || "Sans / Utility"}</div><div style={{ marginTop: 35, fontSize: 48, fontWeight: 650 }}>Build with intent.</div><div style={{ marginTop: 18, color: pal.secondary, fontSize: 20 }}>Hierarchy that stays legible in motion.</div></div>
          <div style={{ ...reveal(frame, 43), border: `1px solid ${pal.text}2b`, borderRadius: 18, padding: 34, background: pal.accent, color: "#101014" }}><div style={{ fontFamily: "monospace", fontSize: 15, letterSpacing: "0.14em", textTransform: "uppercase" }}>{fonts[2] || "Mono / Detail"}</div><div style={{ marginTop: 42, fontFamily: "monospace", fontSize: 25, lineHeight: 1.55 }}>type.scale(04)<br />motion.ease("inOut")<br />voice = clear</div></div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ApplicationGrid: React.FC<{ p: BrandSystemProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const applications = splitList(p.applications, ["Digital product", "Social story", "Packaging", "Event space"]);
  return (
    <AbsoluteFill style={{ padding: "140px 132px 100px" }}>
      <div style={{ ...reveal(frame, 2), display: "flex", justifyContent: "space-between", alignItems: "end" }}><div><div style={{ color: pal.accent, fontSize: 17, letterSpacing: "0.2em", textTransform: "uppercase" }}>04 / Applications</div><div style={{ marginTop: 18, fontSize: 74, fontWeight: 620, letterSpacing: "-0.06em" }}>A system made to travel.</div></div><Wordmark name={p.brandName} pal={pal} size={28} /></div>
      <div style={{ marginTop: 48, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
        {applications.slice(0, 4).map((application, index) => <div key={`${application}-${index}`} style={{ ...reveal(frame, 18 + index * 8), height: 294, borderRadius: 16, overflow: "hidden", border: `1px solid ${pal.text}2b`, position: "relative", background: index % 2 === 0 ? `${pal.text}09` : pal.primary }}><div style={{ position: "absolute", inset: 0, opacity: 0.26, background: index % 2 === 0 ? `radial-gradient(circle at ${30 + index * 18}% 30%, ${pal.accent}, transparent 45%)` : `linear-gradient(130deg, ${pal.secondary}88, transparent 54%)` }} /><div style={{ position: "absolute", inset: 0, padding: 28, display: "flex", flexDirection: "column", justifyContent: "space-between" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><MiniLogo name={p.brandName} logoUrl={p.logoUrl} color={index % 2 === 0 ? pal.accent : pal.text} size={42} /><span style={{ color: `${pal.text}90`, fontSize: 14, letterSpacing: "0.15em", textTransform: "uppercase" }}>0{index + 1}</span></div><div><div style={{ fontSize: 30, fontWeight: 630 }}>{application}</div><div style={{ marginTop: 8, color: `${pal.text}9c`, fontSize: 16 }}>{p.tagline || "Same signal. New context."}</div></div></div></div>)}
      </div>
      <div style={{ ...reveal(frame, 58), marginTop: 28, color: pal.secondary, fontSize: 18 }}>Rules stay recognizable. Expression stays open.</div>
    </AbsoluteFill>
  );
};

const BrandInMotion: React.FC<{ p: BrandSystemProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const colors = p.colors?.length ? p.colors : [pal.accent, pal.primary, pal.secondary];
  return (
    <AbsoluteFill style={{ padding: "150px 140px" }}>
      <div style={{ ...reveal(frame, 2), position: "relative", zIndex: 2 }}><div style={{ color: pal.accent, fontSize: 17, letterSpacing: "0.2em", textTransform: "uppercase" }}>05 / Motion principle</div><div style={{ marginTop: 18, fontSize: 78, fontWeight: 620, letterSpacing: "-0.065em" }}>{motionValue(p.motionStyle)}</div></div>
      <div style={{ position: "absolute", left: "50%", top: "56%", transform: "translate(-50%, -50%)", width: 680, height: 360, borderRadius: "50%", border: `1px solid ${pal.text}25`, perspective: 700, transformStyle: "preserve-3d" }}>
        {Array.from({ length: 7 }, (_, index) => { const angle = frame * (1.3 + index * 0.17) + index * 51; const x = Math.cos(angle * Math.PI / 180) * (220 + index * 23); const y = Math.sin(angle * Math.PI / 180) * (110 + index * 12); const color = colors[index % colors.length] || pal.accent; return <div key={index} style={{ position: "absolute", left: "50%", top: "50%", width: 42 + index * 7, height: 42 + index * 7, borderRadius: index % 2 ? "50%" : 12, background: color, boxShadow: `0 0 45px ${color}aa`, transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${angle}deg)`, opacity: 0.98 - index * 0.07 }} />; })}
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}><LogoMark name={p.brandName} logoUrl={p.logoUrl} color={pal.accent} size={118} /></div>
      </div>
      <div style={{ ...reveal(frame, 32), position: "absolute", right: 140, bottom: 112, width: 330, color: pal.secondary, fontSize: 20, lineHeight: 1.45 }}>A living identity uses rhythm, not noise. Every transition returns to the same center.</div>
    </AbsoluteFill>
  );
};

const VoiceValues: React.FC<{ p: BrandSystemProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const values = splitList(p.values, ["Clear", "Warm", "Curious", "Useful"]);
  return (
    <AbsoluteFill style={{ padding: "142px 138px 100px" }}>
      <div style={{ ...reveal(frame, 2), display: "flex", justifyContent: "space-between" }}><div><div style={{ color: pal.accent, fontSize: 17, letterSpacing: "0.2em", textTransform: "uppercase" }}>06 / Voice & values</div><div style={{ marginTop: 18, fontSize: 76, fontWeight: 620, letterSpacing: "-0.06em" }}>How it sounds. How it behaves.</div></div><div style={{ paddingTop: 32, color: pal.secondary, fontSize: 18 }}>{p.brandName}</div></div>
      <div style={{ marginTop: 66, display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 84, alignItems: "center" }}>
        <div style={{ ...reveal(frame, 18), fontFamily: SERIF_STACK, fontSize: 65, lineHeight: 1.11, letterSpacing: "-0.045em" }}>We make the complex feel <span style={{ color: pal.accent }}>possible.</span></div>
        <div>{values.slice(0, 4).map((value, index) => <div key={`${value}-${index}`} style={{ ...reveal(frame, 25 + index * 9), display: "flex", alignItems: "center", gap: 22, padding: "22px 0", borderBottom: `1px solid ${pal.text}2e` }}><div style={{ width: 38, height: 38, borderRadius: "50%", background: index === 0 ? pal.accent : `${pal.text}14`, color: index === 0 ? "#101014" : pal.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700 }}>0{index + 1}</div><div style={{ fontSize: 31, fontWeight: 580 }}>{value}</div><div style={{ marginLeft: "auto", color: pal.secondary, fontSize: 16 }}>{["Say less, mean more.", "Invite people in.", "Ask better questions.", "Earn the next step."][index]}</div></div>)}</div>
      </div>
    </AbsoluteFill>
  );
};

const SystemCarousel: React.FC<{ p: BrandSystemProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const cards = ["Logo", "Palette", "Typography", "Voice", "Applications"];
  const shift = clampInterp(frame, [12, 75], [0, -310]);
  return (
    <AbsoluteFill style={{ padding: "146px 0 100px" }}>
      <div style={{ ...reveal(frame, 2), padding: "0 136px" }}><div style={{ color: pal.accent, fontSize: 17, letterSpacing: "0.2em", textTransform: "uppercase" }}>07 / The system</div><div style={{ marginTop: 18, fontSize: 76, fontWeight: 620, letterSpacing: "-0.06em" }}>Everything connects.</div></div>
      <div style={{ marginTop: 72, display: "flex", gap: 20, transform: `translateX(${shift}px)`, paddingLeft: 136 }}>
        {cards.map((card, index) => <div key={card} style={{ ...reveal(frame, 16 + index * 7), width: 390, height: 430, flexShrink: 0, border: `1px solid ${pal.text}2e`, borderRadius: 18, padding: 30, background: index === 1 ? pal.accent : `${pal.text}08`, color: index === 1 ? "#101014" : pal.text }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, letterSpacing: "0.15em", textTransform: "uppercase", opacity: 0.75 }}><span>0{index + 1}</span><span>Foundation</span></div><div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>{index === 0 ? <LogoMark name={p.brandName} logoUrl={p.logoUrl} color={pal.accent} size={124} /> : index === 1 ? <div style={{ display: "flex", gap: 8 }}>{[pal.accent, pal.primary, pal.secondary, pal.text].map((color, colorIndex) => <div key={colorIndex} style={{ width: 50, height: 150 - colorIndex * 20, background: color, borderRadius: 8 }} />)}</div> : index === 2 ? <div style={{ fontFamily: SERIF_STACK, fontSize: 68 }}>Aa</div> : index === 3 ? <div style={{ fontSize: 24, lineHeight: 1.45, textAlign: "center" }}>Clear.<br />Warm.<br /><span style={{ color: pal.accent }}>Useful.</span></div> : <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 86px)", gap: 10 }}>{[0, 1, 2, 3].map((n) => <div key={n} style={{ width: 86, height: 68, borderRadius: 8, background: `${pal.primary}${n % 2 ? "aa" : "55"}` }} />)}</div>}</div><div style={{ fontSize: 28, fontWeight: 620 }}>{card}</div></div>)}
      </div>
      <div style={{ ...reveal(frame, 62), position: "absolute", bottom: 94, left: 136, right: 136, display: "flex", justifyContent: "space-between", color: pal.secondary, fontSize: 17 }}><span>Swipe through the foundations</span><span>01 — 05</span></div>
    </AbsoluteFill>
  );
};

const BrandRollout: React.FC<{ p: BrandSystemProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const steps = ["Define the signal", "Build the kit", "Train the team", "Ship consistently"];
  return (
    <AbsoluteFill style={{ padding: "142px 138px 112px" }}>
      <div style={{ ...reveal(frame, 2), display: "flex", justifyContent: "space-between", alignItems: "end" }}><div><div style={{ color: pal.accent, fontSize: 17, letterSpacing: "0.2em", textTransform: "uppercase" }}>08 / Rollout</div><div style={{ marginTop: 18, fontSize: 76, fontWeight: 620, letterSpacing: "-0.06em" }}>From guideline to habit.</div></div><MiniLogo name={p.brandName} logoUrl={p.logoUrl} color={pal.accent} size={64} /></div>
      <div style={{ position: "relative", marginTop: 100, paddingTop: 3 }}><div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 2, background: `${pal.text}38`, ...lineReveal(frame, 15) }} /><div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 22 }}>{steps.map((step, index) => { const progress = clampInterp(frame, [24 + index * 10, 43 + index * 10], [0, 1]); return <div key={step} style={{ ...reveal(frame, 20 + index * 9) }}><div style={{ width: 34, height: 34, borderRadius: "50%", background: progress > 0.8 ? pal.accent : pal.bg, border: `2px solid ${pal.accent}`, color: progress > 0.8 ? "#101014" : pal.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>0{index + 1}</div><div style={{ marginTop: 28, fontSize: 29, fontWeight: 600 }}>{step}</div><div style={{ marginTop: 12, color: pal.secondary, fontSize: 18, lineHeight: 1.45 }}>{["A distinctive point of view.", "Reusable rules and tokens.", "Confidence at every touchpoint.", "Recognition over time."][index]}</div></div>; })}</div></div>
      <div style={{ ...reveal(frame, 69), position: "absolute", left: 138, right: 138, bottom: 94, display: "flex", justifyContent: "space-between", color: `${pal.text}75`, fontSize: 16, letterSpacing: "0.14em", textTransform: "uppercase" }}><span>{p.brandName} / Launch kit</span><span>Built to be used</span></div>
    </AbsoluteFill>
  );
};

const IdentityClose: React.FC<{ p: BrandSystemProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ padding: "128px 140px 104px", justifyContent: "space-between" }}>
      <div style={{ ...reveal(frame, 2), display: "flex", justifyContent: "space-between", color: `${pal.text}75`, fontSize: 15, letterSpacing: "0.17em", textTransform: "uppercase" }}><span>Identity system / 10</span><span>End frame</span></div>
      <div style={{ display: "flex", alignItems: "center", gap: 42 }}><div style={{ ...scaleReveal(frame, 14) }}><LogoMark name={p.brandName} logoUrl={p.logoUrl} color={pal.accent} size={148} /></div><div style={{ ...reveal(frame, 26) }}><Wordmark name={p.brandName} pal={pal} size={96} serif /><div style={{ marginTop: 15, color: pal.secondary, fontSize: 22, letterSpacing: "0.12em", textTransform: "uppercase" }}>{p.tagline || "Make meaning visible."}</div></div></div>
      <div style={{ ...reveal(frame, 43), display: "flex", justifyContent: "space-between", alignItems: "end" }}><div style={{ maxWidth: 560, color: pal.secondary, fontSize: 22, lineHeight: 1.45 }}>A flexible identity system for clear ideas, consistent expression, and the next chapter.</div><div style={{ textAlign: "right" }}><Rule pal={pal} frame={frame} start={43} color={pal.accent} width={170} /><div style={{ marginTop: 20, color: `${pal.text}72`, fontSize: 16, letterSpacing: "0.15em", textTransform: "uppercase" }}>Designed for motion</div></div></div>
    </AbsoluteFill>
  );
};

const VARIANTS: Record<BrandVariant, React.FC<{ p: BrandSystemProps; pal: Palette }>> = {
  "identity-open": IdentityOpen,
  "logo-to-system": LogoToSystem,
  "palette-reveal": PaletteReveal,
  "type-pairing": TypePairing,
  "application-grid": ApplicationGrid,
  "brand-in-motion": BrandInMotion,
  "voice-values": VoiceValues,
  "system-carousel": SystemCarousel,
  "brand-rollout": BrandRollout,
  "identity-close": IdentityClose,
};

// Variants compose on a 1920×1080 design canvas. Scale the composed canvas
// as one unit so type/cards keep their intended relationship at any viewport.
const StageFit: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <AbsoluteFill style={{ overflow: "hidden" }}>
    <div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}>{children}</div>
  </AbsoluteFill>;
};

export const BrandSystemsTemplate: React.FC<BrandSystemProps> = (props) => {
  const pal = resolvePalette(props.paletteName || "midnight");
  const Variant = VARIANTS[props.variant] ?? IdentityOpen;
  return <Scene pal={pal} background={props.background}><StageFit><Variant p={props} pal={pal} /></StageFit></Scene>;
};

const familyCast = (component: React.FC<BrandSystemProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "brand-systems-identity-open": familyCast(BrandSystemsTemplate),
  "brand-systems-logo-to-system": familyCast(BrandSystemsTemplate),
  "brand-systems-palette-reveal": familyCast(BrandSystemsTemplate),
  "brand-systems-type-pairing": familyCast(BrandSystemsTemplate),
  "brand-systems-application-grid": familyCast(BrandSystemsTemplate),
  "brand-systems-brand-in-motion": familyCast(BrandSystemsTemplate),
  "brand-systems-voice-values": familyCast(BrandSystemsTemplate),
  "brand-systems-system-carousel": familyCast(BrandSystemsTemplate),
  "brand-systems-brand-rollout": familyCast(BrandSystemsTemplate),
  "brand-systems-identity-close": familyCast(BrandSystemsTemplate),
};
