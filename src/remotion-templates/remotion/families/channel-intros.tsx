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
  clampInterp,
  resolvePalette,
  seededRand,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: channel-intros
 * Ten standalone 5–7 second channel openers. Every variant follows a
 * build-up → identity reveal → quiet settle arc and uses only procedural art.
 */

type IntroVariant =
  | "geometric-assembly"
  | "light-streaks"
  | "glitch-letters"
  | "orbit-system"
  | "ink-splash"
  | "line-draw"
  | "retro-badge"
  | "audio-equalizer"
  | "spotlight-stage"
  | "cube-rotate";

export interface ChannelIntroProps {
  variant: IntroVariant;
  channelName: string;
  tagline: string;
  paletteName: string;
  seed?: number;
}

const FONT = '"Inter", "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';

const progress = (frame: number, duration: number, start: number, end: number) =>
  clampInterp(frame, [duration * start, duration * end], [0, 1]);

const polarPoints = (count: number, radius: number, seed: number, jitter = 0) =>
  Array.from({ length: count }, (_, i) => {
    const angle = -Math.PI / 2 + (i / count) * Math.PI * 2;
    const r = radius * (1 - jitter + seededRand(seed + i * 7) * jitter * 2);
    return `${50 + Math.cos(angle) * r},${50 + Math.sin(angle) * r}`;
  }).join(" ");

/** A deterministic procedural emblem; no image or font asset is required. */
const ProceduralMark: React.FC<{
  palette: Palette;
  seed: number;
  size?: number;
  draw?: number;
  filled?: boolean;
}> = ({ palette, seed, size = 220, draw = 1, filled = false }) => {
  const outer = polarPoints(6, 40, seed, 0.08);
  const inner = polarPoints(3 + (seed % 3), 20, seed + 90, 0.12);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <circle
        cx="50"
        cy="50"
        r="44"
        fill="none"
        stroke={palette.secondary}
        strokeWidth="1.2"
        opacity={0.35 * draw}
        strokeDasharray="280"
        strokeDashoffset={280 * (1 - draw)}
        transform="rotate(-90 50 50)"
      />
      <polygon
        points={outer}
        fill={filled ? `${palette.primary}24` : "none"}
        stroke={palette.primary}
        strokeWidth="3"
        strokeLinejoin="round"
        strokeDasharray="300"
        strokeDashoffset={300 * (1 - draw)}
      />
      <polygon
        points={inner}
        fill={filled ? palette.accent : "none"}
        stroke={palette.accent}
        strokeWidth="2.4"
        strokeLinejoin="round"
        opacity={draw}
        transform={`rotate(${(1 - draw) * 90} 50 50)`}
      />
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <line
            key={i}
            x1="50"
            y1="50"
            x2={50 + Math.cos(angle) * 38}
            y2={50 + Math.sin(angle) * 38}
            stroke={palette.text}
            strokeWidth="0.65"
            opacity={0.18 * draw}
          />
        );
      })}
    </svg>
  );
};

const Tagline: React.FC<{ text: string; palette: Palette; opacity: number }> = ({ text, palette, opacity }) => (
  <div
    style={{
      marginTop: 20,
      color: palette.secondary,
      fontFamily: FONT,
      fontSize: 24,
      fontWeight: 500,
      letterSpacing: "0.34em",
      textTransform: "uppercase",
      opacity,
      transform: `translateY(${(1 - opacity) * 12}px)`,
    }}
  >
    {text}
  </div>
);

// ---------------- geometric mark assembly + name ----------------
const GeometricAssembly: React.FC<{ p: ChannelIntroProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const seed = p.seed ?? 11;
  const build = progress(frame, durationInFrames, 0.04, 0.36);
  const reveal = spring({ frame: Math.max(0, frame - durationInFrames * 0.34), fps, config: { damping: 16, stiffness: 120 } });
  const pieces = Array.from({ length: 12 }, (_, i) => {
    const angle = seededRand(seed + i) * Math.PI * 2;
    const distance = 430 + seededRand(seed + i + 30) * 480;
    const x = Math.cos(angle) * distance * (1 - build);
    const y = Math.sin(angle) * distance * (1 - build);
    return { x, y, angle, size: 18 + seededRand(seed + i + 70) * 42 };
  });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ position: "relative", width: 250, height: 250 }}>
        {pieces.map((piece, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 125 - piece.size / 2,
              top: 125 - piece.size / 2,
              width: piece.size,
              height: piece.size,
              border: `2px solid ${i % 3 === 0 ? pal.accent : pal.primary}`,
              transform: `translate(${piece.x}px, ${piece.y}px) rotate(${piece.angle * 180 / Math.PI + frame * 2}deg) scale(${0.5 + build * 0.5})`,
              opacity: 1 - progress(frame, durationInFrames, 0.3, 0.4),
            }}
          />
        ))}
        <div style={{ opacity: progress(frame, durationInFrames, 0.24, 0.42), transform: `scale(${0.7 + build * 0.3})` }}>
          <ProceduralMark palette={pal} seed={seed} size={250} draw={build} filled />
        </div>
      </div>
      <div style={{ marginTop: 24, textAlign: "center", opacity: reveal, transform: `translateY(${interpolate(reveal, [0, 1], [30, 0])}px)` }}>
        <div style={{ color: pal.text, fontFamily: FONT, fontSize: 76, fontWeight: 800, letterSpacing: "0.08em" }}>{p.channelName}</div>
        <Tagline text={p.tagline} palette={pal} opacity={progress(frame, durationInFrames, 0.52, 0.66)} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------- light streaks converge to wordmark ----------------
const LightStreaks: React.FC<{ p: ChannelIntroProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width } = useVideoConfig();
  const converge = progress(frame, durationInFrames, 0.03, 0.42);
  const reveal = progress(frame, durationInFrames, 0.34, 0.54);
  const seed = p.seed ?? 23;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
      {Array.from({ length: 18 }, (_, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const y = (seededRand(seed + i * 4) - 0.5) * 720;
        const x = side * (width * 0.65 + seededRand(seed + i * 4 + 1) * 400) * (1 - converge);
        const length = 140 + seededRand(seed + i * 4 + 2) * 440;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: length,
              height: i % 4 === 0 ? 5 : 2,
              background: `linear-gradient(${side < 0 ? 90 : 270}deg, transparent, ${i % 3 ? pal.primary : pal.accent})`,
              boxShadow: `0 0 22px ${pal.primary}`,
              transform: `translate(${x - (side < 0 ? length : 0)}px, ${y * (1 - converge * 0.72)}px) scaleX(${0.25 + converge * 0.75})`,
              opacity: clampInterp(converge, [0, 0.18, 0.82, 1], [0, 0.85, 1, 0]),
            }}
          />
        );
      })}
      <div style={{ position: "absolute", width: 540, height: 540, borderRadius: "50%", background: `radial-gradient(circle, ${pal.primary}35, transparent 65%)`, opacity: reveal }} />
      <div style={{ textAlign: "center", clipPath: `inset(0 ${(1 - reveal) * 50}% 0 ${(1 - reveal) * 50}%)` }}>
        <div style={{ color: pal.text, fontFamily: FONT, fontSize: 112, fontWeight: 900, letterSpacing: "-0.035em", textShadow: `0 0 35px ${pal.primary}99` }}>{p.channelName}</div>
        <div style={{ height: 2, margin: "18px auto 0", width: `${reveal * 100}%`, background: `linear-gradient(90deg, transparent, ${pal.accent}, transparent)` }} />
        <Tagline text={p.tagline} palette={pal} opacity={progress(frame, durationInFrames, 0.52, 0.65)} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------- letter-by-letter glitch assembly ----------------
const GlitchLetters: React.FC<{ p: ChannelIntroProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width } = useVideoConfig();
  const chars = p.channelName.split("");
  const settle = progress(frame, durationInFrames, 0.4, 0.62);
  const seed = p.seed ?? 37;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", maxWidth: width * 0.9 }}>
        {chars.map((char, i) => {
          const appear = progress(frame, durationInFrames, 0.06 + i * 0.018, 0.18 + i * 0.018);
          const tick = Math.floor(frame / 2);
          const jx = (seededRand(seed + i * 97 + tick * 13) - 0.5) * 70 * (1 - settle);
          const jy = (seededRand(seed + i * 71 + tick * 17) - 0.5) * 42 * (1 - settle);
          const slice = Math.floor(seededRand(seed + i + tick) * 70);
          return (
            <span key={i} style={{ position: "relative", display: "inline-block", whiteSpace: "pre", opacity: appear, transform: `translate(${jx}px, ${jy}px) skewX(${(1 - settle) * (i % 2 ? -8 : 8)}deg)` }}>
              {settle < 0.95 && char !== " " && (
                <>
                  <span aria-hidden style={{ position: "absolute", color: pal.accent, transform: `translate(${8 * (1 - settle)}px, -3px)`, clipPath: `inset(${slice}% 0 ${Math.max(0, 70 - slice)}% 0)` }}>{char}</span>
                  <span aria-hidden style={{ position: "absolute", color: pal.secondary, transform: `translate(${-8 * (1 - settle)}px, 3px)`, clipPath: `inset(${Math.max(0, slice - 25)}% 0 ${Math.max(0, 85 - slice)}% 0)` }}>{char}</span>
                </>
              )}
              <span style={{ color: pal.text, fontFamily: MONO, fontSize: Math.min(100, width / Math.max(8, chars.length) * 0.78), fontWeight: 800 }}>{char === " " ? "\u00A0" : char}</span>
            </span>
          );
        })}
      </div>
      <div style={{ marginTop: 34, width: 620, maxWidth: "65%", height: 1, background: pal.primary, transform: `scaleX(${settle})`, boxShadow: `0 0 12px ${pal.primary}` }} />
      <Tagline text={p.tagline} palette={pal} opacity={progress(frame, durationInFrames, 0.58, 0.7)} />
      <div style={{ position: "absolute", top: 70, left: 80, color: `${pal.secondary}88`, font: `16px ${MONO}`, letterSpacing: "0.2em", opacity: 1 - settle }}>SIGNAL // ASSEMBLING</div>
    </AbsoluteFill>
  );
};

// ---------------- orbit system with center name ----------------
const OrbitSystem: React.FC<{ p: ChannelIntroProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const build = progress(frame, durationInFrames, 0.05, 0.4);
  const reveal = progress(frame, durationInFrames, 0.34, 0.55);
  const settle = progress(frame, durationInFrames, 0.56, 0.76);
  const seed = p.seed ?? 41;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {[240, 350, 470].map((radius, ring) => (
        <div
          key={radius}
          style={{
            position: "absolute",
            width: radius * 2,
            height: radius * 2,
            border: `1px solid ${ring === 1 ? pal.primary : pal.secondary}`,
            borderRadius: "50%",
            opacity: 0.12 + build * 0.2,
            transform: `scale(${0.45 + build * 0.55}) rotate(${frame * (ring % 2 ? -0.15 : 0.1)}deg)`,
          }}
        >
          {Array.from({ length: ring + 2 }, (_, i) => {
            const angle = (i / (ring + 2)) * Math.PI * 2 + frame * 0.018 * (ring % 2 ? -1 : 1) * (1 - settle * 0.72);
            return <div key={i} style={{ position: "absolute", left: "50%", top: "50%", width: 10 + ring * 4, height: 10 + ring * 4, borderRadius: "50%", background: i % 2 ? pal.accent : pal.primary, boxShadow: `0 0 18px ${pal.primary}`, transform: `translate(-50%, -50%) translate(${Math.cos(angle) * radius}px, ${Math.sin(angle) * radius}px)`, opacity: build }} />;
          })}
        </div>
      ))}
      <div style={{ width: 350, height: 350, borderRadius: "50%", background: `radial-gradient(circle, ${pal.bg} 45%, ${pal.primary}33 72%, transparent 73%)`, display: "flex", justifyContent: "center", alignItems: "center", transform: `scale(${0.7 + reveal * 0.3})` }}>
        <div style={{ position: "absolute", opacity: 0.42 }}><ProceduralMark palette={pal} seed={seed} size={300} draw={build} /></div>
        <div style={{ zIndex: 1, textAlign: "center", opacity: reveal }}>
          <div style={{ color: pal.text, font: `800 54px ${FONT}`, letterSpacing: "0.05em" }}>{p.channelName}</div>
          <Tagline text={p.tagline} palette={pal} opacity={progress(frame, durationInFrames, 0.5, 0.65)} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- ink splash silhouette reveal ----------------
const InkSplash: React.FC<{ p: ChannelIntroProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const splash = progress(frame, durationInFrames, 0.06, 0.38);
  const reveal = progress(frame, durationInFrames, 0.23, 0.52);
  const seed = p.seed ?? 59;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: pal.text, overflow: "hidden" }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", inset: 0 }} aria-hidden>
        <rect width={width} height={height} fill={pal.text} />
        {Array.from({ length: 28 }, (_, i) => {
          const angle = seededRand(seed + i * 5) * Math.PI * 2;
          const distance = (80 + seededRand(seed + i * 5 + 1) * 560) * splash;
          const r = (10 + seededRand(seed + i * 5 + 2) * 80) * clampInterp(splash, [0, 0.3, 1], [0, 1.2, 1]);
          return <circle key={i} cx={width / 2 + Math.cos(angle) * distance} cy={height / 2 + Math.sin(angle) * distance * 0.65} r={r} fill={i % 5 === 0 ? pal.accent : pal.bg} />;
        })}
        <ellipse cx={width / 2} cy={height / 2} rx={520 * splash} ry={250 * splash} fill={pal.bg} />
      </svg>
      <div style={{ zIndex: 1, textAlign: "center", clipPath: `circle(${reveal * 75}% at 50% 50%)` }}>
        <div style={{ color: pal.text, font: `900 126px ${FONT}`, letterSpacing: "-0.045em", textTransform: "uppercase" }}>{p.channelName}</div>
        <div style={{ color: pal.accent, font: `600 25px ${FONT}`, letterSpacing: "0.42em", textTransform: "uppercase", marginTop: 26, opacity: progress(frame, durationInFrames, 0.48, 0.62) }}>{p.tagline}</div>
      </div>
      {Array.from({ length: 10 }, (_, i) => {
        const x = seededRand(seed + 300 + i) * width;
        return <div key={i} style={{ position: "absolute", left: x, top: height / 2 + (seededRand(seed + 400 + i) - 0.5) * 260, width: 3 + seededRand(seed + 500 + i) * 7, height: splash * (80 + seededRand(seed + 600 + i) * 260), background: pal.bg, borderRadius: 999, transformOrigin: "top" }} />;
      })}
    </AbsoluteFill>
  );
};

// ---------------- minimal line-draw emblem ----------------
const LineDraw: React.FC<{ p: ChannelIntroProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const fit = Math.min(1, width / 1920, height / 1080);
  const draw = progress(frame, durationInFrames, 0.04, 0.5);
  // Finish the wordmark reveal before the catalog midpoint so the representative
  // thumbnail shows the complete identity, while the draw motion remains intact.
  const reveal = progress(frame, durationInFrames, 0.34, 0.52);
  const markSize = 280 * fit;
  const textWidth = Math.min(650 * fit, width * 0.58);
  const titleSize = Math.max(28, Math.min(88 * fit, width * 0.22));
  const seed = p.seed ?? 67;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 64 * fit, maxWidth: width * 0.92 }}>
        <div style={{ flex: "0 0 auto", transform: `rotate(${(1 - draw) * -35}deg)` }}><ProceduralMark palette={pal} seed={seed} size={markSize} draw={draw} /></div>
        <div style={{ flex: "0 0 auto", width: Math.max(1, draw * 2 * fit), height: 260 * fit, background: pal.primary, opacity: 0.7 }} />
        <div style={{ overflow: "hidden", width: textWidth, minWidth: 0 }}>
          <div style={{ transform: `translateX(${(1 - reveal) * -100}%)`, opacity: reveal }}>
            <div style={{ color: pal.text, font: `300 ${titleSize}px ${FONT}`, letterSpacing: "0.08em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.channelName}</div>
            <div style={{ color: pal.secondary, font: `500 ${Math.max(10, 21 * fit)}px ${FONT}`, letterSpacing: `${Math.max(0.08, 0.38 * fit)}em`, textTransform: "uppercase", marginTop: 22 * fit, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.tagline}</div>
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 140 * fit, width: `${draw * 56}%`, height: Math.max(1, fit), background: `linear-gradient(90deg, transparent, ${pal.secondary}, transparent)` }} />
    </AbsoluteFill>
  );
};

// ---------------- retro badge spin-in ----------------
const RetroBadge: React.FC<{ p: ChannelIntroProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const enter = spring({ frame: Math.max(0, frame - 6), fps, config: { damping: 13, stiffness: 95, mass: 0.9 } });
  const settle = progress(frame, durationInFrames, 0.36, 0.62);
  const seed = p.seed ?? 73;
  const points = polarPoints(24, 45, seed, 0.035);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: `radial-gradient(circle, ${pal.primary}33, transparent 55%)` }}>
      <svg width="590" height="590" viewBox="0 0 100 100" style={{ transform: `scale(${interpolate(enter, [0, 1], [0.05, 1])}) rotate(${interpolate(enter, [0, 1], [-540, 0]) + (1 - settle) * Math.sin(frame * 0.2) * 3}deg)`, filter: `drop-shadow(0 24px 35px ${pal.bg})` }} aria-hidden>
        <polygon points={points} fill={pal.primary} stroke={pal.secondary} strokeWidth="1.5" />
        <circle cx="50" cy="50" r="37" fill={pal.bg} stroke={pal.accent} strokeWidth="1.2" />
        <circle cx="50" cy="50" r="31" fill="none" stroke={pal.secondary} strokeWidth="0.5" strokeDasharray="2 2" />
        <polygon points={polarPoints(6, 18, seed + 8, 0.05)} fill={`${pal.accent}22`} stroke={pal.accent} strokeWidth="1.4" />
        <text x="50" y="48" textAnchor="middle" fill={pal.text} fontFamily={FONT} fontSize="9" fontWeight="900" letterSpacing="0.6">{p.channelName.toUpperCase()}</text>
        <path id="badge-arc" d="M 22 57 A 31 31 0 0 0 78 57" fill="none" />
        <text fill={pal.secondary} fontFamily={FONT} fontSize="3.7" letterSpacing="0.65"><textPath href="#badge-arc" startOffset="50%" textAnchor="middle">{p.tagline.toUpperCase()}</textPath></text>
      </svg>
      <div style={{ position: "absolute", bottom: 94, color: `${pal.secondary}99`, font: `600 16px ${FONT}`, letterSpacing: "0.55em", textTransform: "uppercase", opacity: progress(frame, durationInFrames, 0.56, 0.72) }}>Est. • Original • Channel</div>
    </AbsoluteFill>
  );
};

// ---------------- audio equalizer intro ----------------
const AudioEqualizer: React.FC<{ p: ChannelIntroProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width } = useVideoConfig();
  const build = progress(frame, durationInFrames, 0.02, 0.22);
  const collapse = progress(frame, durationInFrames, 0.38, 0.58);
  const reveal = progress(frame, durationInFrames, 0.48, 0.65);
  const seed = p.seed ?? 89;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, width: width * 0.78, height: 380 }}>
        {Array.from({ length: 42 }, (_, i) => {
          const wave = Math.abs(Math.sin(frame * (0.14 + seededRand(seed + i) * 0.1) + i * 0.73));
          const envelope = 40 + wave * (170 + seededRand(seed + i + 50) * 150);
          const h = interpolate(collapse, [0, 1], [envelope * build, 3]);
          return <div key={i} style={{ flex: 1, height: h, minHeight: 3, borderRadius: 99, background: i % 7 === 0 ? pal.accent : `linear-gradient(${pal.secondary}, ${pal.primary})`, boxShadow: `0 0 ${12 * (1 - collapse)}px ${pal.primary}`, opacity: 0.35 + build * 0.65 }} />;
        })}
      </div>
      <div style={{ position: "absolute", textAlign: "center", opacity: reveal, transform: `scale(${0.92 + reveal * 0.08})` }}>
        <div style={{ color: pal.text, font: `900 96px ${FONT}`, letterSpacing: "0.025em" }}>{p.channelName}</div>
        <Tagline text={p.tagline} palette={pal} opacity={progress(frame, durationInFrames, 0.6, 0.74)} />
      </div>
      <div style={{ position: "absolute", bottom: 95, display: "flex", gap: 9, opacity: 1 - collapse }}>
        {[0, 1, 2].map((i) => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: pal.accent, opacity: (frame + i * 5) % 18 < 9 ? 1 : 0.25 }} />)}
      </div>
    </AbsoluteFill>
  );
};

// ---------------- spotlight sweep across stage text ----------------
const SpotlightStage: React.FC<{ p: ChannelIntroProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width } = useVideoConfig();
  // Let the beam complete before the catalog midpoint, then hold a readable
  // wordmark instead of leaving the title behind the clipped spotlight mask.
  const sweep = progress(frame, durationInFrames, 0.04, 0.42);
  const settle = progress(frame, durationInFrames, 0.38, 0.58);
  const lightX = interpolate(sweep, [0, 1], [-20, 120]);
  const titleSize = Math.min(120, Math.max(48, width * 0.12));
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: `linear-gradient(${pal.bg}, #000 72%)`, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: `${lightX}%`, top: -180, width: 560, height: 1250, transform: `translateX(-50%) rotate(${interpolate(sweep, [0, 1], [-18, 18])}deg)`, transformOrigin: "top", background: `linear-gradient(100deg, transparent 8%, ${pal.primary}08 22%, ${pal.text}32 50%, ${pal.primary}08 78%, transparent 92%)`, filter: "blur(12px)", opacity: 1 - settle * 0.45 }} />
      <div style={{ position: "absolute", bottom: 178, width: width * 0.82, height: 95, borderRadius: "50%", background: `radial-gradient(ellipse, ${pal.primary}44, transparent 66%)`, transform: "perspective(500px) rotateX(68deg)" }} />
      <div style={{ position: "relative", textAlign: "center" }}>
        <div style={{ color: `${pal.text}${settle > 0 ? "55" : "18"}`, font: `900 ${titleSize}px ${FONT}`, letterSpacing: "0.02em", textShadow: `0 0 24px ${pal.text}66` }}>{p.channelName}</div>
        <div style={{ position: "absolute", inset: 0, color: pal.text, font: `900 ${titleSize}px ${FONT}`, letterSpacing: "0.02em", clipPath: `inset(0 ${Math.max(0, 100 - lightX)}% 0 0)`, textShadow: `0 0 34px ${pal.text}88` }}>{p.channelName}</div>
        <Tagline text={p.tagline} palette={pal} opacity={Math.max(0.72, settle)} />
      </div>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center, transparent 25%, ${pal.bg}aa 100%)`, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// ---------------- cube rotate emblem ----------------
const CubeRotate: React.FC<{ p: ChannelIntroProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const enter = spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 14, stiffness: 100 } });
  const reveal = progress(frame, durationInFrames, 0.45, 0.64);
  const settle = progress(frame, durationInFrames, 0.4, 0.68);
  const seed = p.seed ?? 97;
  const size = 230;
  const faces = [
    ["translateZ(115px)", pal.primary],
    ["rotateY(180deg) translateZ(115px)", pal.secondary],
    ["rotateY(90deg) translateZ(115px)", pal.accent],
    ["rotateY(-90deg) translateZ(115px)", pal.primary],
    ["rotateX(90deg) translateZ(115px)", pal.secondary],
    ["rotateX(-90deg) translateZ(115px)", pal.accent],
  ] as const;
  const rotation = interpolate(enter, [0, 1], [-620, 0]) + (1 - settle) * frame * 1.2;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", perspective: 1200 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 100, transform: `translateX(${(1 - reveal) * 260}px)` }}>
        <div style={{ width: size, height: size, position: "relative", transformStyle: "preserve-3d", transform: `rotateX(${-18 + (1 - settle) * 25}deg) rotateY(${rotation}deg) scale(${0.5 + enter * 0.5})` }}>
          {faces.map(([transform, color], i) => (
            <div key={i} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", transform, background: `${color}${i === 0 ? "66" : "38"}`, border: `2px solid ${color}`, backfaceVisibility: "hidden", boxShadow: `inset 0 0 40px ${pal.bg}, 0 0 24px ${color}55` }}>
              {i === 0 && <ProceduralMark palette={pal} seed={seed} size={180} draw={enter} filled />}
            </div>
          ))}
        </div>
        <div style={{ width: 620, opacity: reveal, transform: `translateX(${(1 - reveal) * 90}px)` }}>
          <div style={{ color: pal.text, font: `800 86px ${FONT}`, letterSpacing: "0.045em" }}>{p.channelName}</div>
          <div style={{ width: reveal * 310, height: 4, background: pal.accent, marginTop: 22 }} />
          <Tagline text={p.tagline} palette={pal} opacity={progress(frame, durationInFrames, 0.58, 0.72)} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const VARIANTS: Record<IntroVariant, React.FC<{ p: ChannelIntroProps; pal: Palette }>> = {
  "geometric-assembly": GeometricAssembly,
  "light-streaks": LightStreaks,
  "glitch-letters": GlitchLetters,
  "orbit-system": OrbitSystem,
  "ink-splash": InkSplash,
  "line-draw": LineDraw,
  "retro-badge": RetroBadge,
  "audio-equalizer": AudioEqualizer,
  "spotlight-stage": SpotlightStage,
  "cube-rotate": CubeRotate,
};

export const ChannelIntroTemplate: React.FC<ChannelIntroProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? GeometricAssembly;
  const frame = useCurrentFrame();
  const seed = props.seed ?? 11;
  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, ${pal.primary}1f, transparent 54%), ${pal.bg}` }} />
      {Array.from({ length: 20 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: `${seededRand(seed + i * 3) * 100}%`, top: `${seededRand(seed + i * 3 + 1) * 100}%`, width: 2, height: 2, borderRadius: "50%", background: pal.text, opacity: 0.08 + seededRand(seed + i * 3 + 2) * 0.2, transform: `scale(${0.7 + Math.sin(frame * 0.03 + i) * 0.3})` }} />
      ))}
      <FadeEdges inFrames={10} outFrames={14}>
        <Variant p={props} pal={pal} />
      </FadeEdges>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, transparent 48%, ${pal.bg}aa 100%)`, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

const familyCast = (component: React.FC<ChannelIntroProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "intro-geometric-assembly": familyCast(ChannelIntroTemplate),
  "intro-light-streak-wordmark": familyCast(ChannelIntroTemplate),
  "intro-glitch-letter-build": familyCast(ChannelIntroTemplate),
  "intro-orbit-system": familyCast(ChannelIntroTemplate),
  "intro-ink-splash": familyCast(ChannelIntroTemplate),
  "intro-line-draw-emblem": familyCast(ChannelIntroTemplate),
  "intro-retro-badge": familyCast(ChannelIntroTemplate),
  "intro-audio-equalizer": familyCast(ChannelIntroTemplate),
  "intro-spotlight-stage": familyCast(ChannelIntroTemplate),
  "intro-cube-emblem": familyCast(ChannelIntroTemplate),
};
