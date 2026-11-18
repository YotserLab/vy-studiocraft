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
 * FAMILY: outro-endcards
 * Ten structurally distinct closing cards for channels, series, playlists, and calls to action.
 * All imagery is procedural so every template renders without external assets.
 */

type OutroVariant =
  | "two-thumbnail"
  | "subscribe-bell"
  | "thanks-monogram"
  | "next-episode"
  | "social-grid"
  | "newsletter"
  | "playlist-stack"
  | "logo-tagline"
  | "credits-roll"
  | "watch-more";

export interface OutroProps {
  variant: OutroVariant;
  channelName: string;
  tagline: string;
  primaryLink: string;
  secondaryLink: string;
  nextTitle: string;
  socialLinks: string[];
  credits: string[];
  paletteName: string;
}

const FONT_STACK = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO_STACK = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';

const monogramFor = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? `${words[0][0]}${words[1][0]}` : words[0]?.slice(0, 2) || "NX").toUpperCase();
};

const splitPair = (value: string): [string, string] => {
  const [first, ...rest] = value.split("|");
  return [first.trim(), rest.join("|").trim()];
};

// ---------------- shared procedural artwork ----------------
const ProceduralThumbnail: React.FC<{
  pal: Palette;
  seed: number;
  label: string;
  style?: React.CSSProperties;
}> = ({ pal, seed, label, style }) => {
  const frame = useCurrentFrame();
  const angle = Math.round(seededRand(seed) * 220 + 70);
  const x = 20 + seededRand(seed + 1) * 60;
  const y = 18 + seededRand(seed + 2) * 64;
  const drift = Math.sin(frame * 0.025 + seed) * 2.5;
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(${angle}deg, ${pal.primary}, ${pal.accent} 52%, ${pal.secondary})`,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: "64%",
          aspectRatio: "1",
          left: `${x}%`,
          top: `${y + drift}%`,
          transform: "translate(-50%, -50%) rotate(18deg)",
          borderRadius: seed % 2 ? "50%" : "18%",
          background: `${pal.text}1f`,
          border: `2px solid ${pal.text}38`,
          boxShadow: `0 0 90px ${pal.bg}66`,
        }}
      />
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={`line-${seed}-${i}`}
          style={{
            position: "absolute",
            width: `${18 + seededRand(seed * 10 + i) * 42}%`,
            height: 5,
            left: `${8 + seededRand(seed * 20 + i) * 65}%`,
            top: `${12 + i * 19}%`,
            background: `${pal.text}${i % 2 ? "38" : "70"}`,
            transform: `rotate(${seededRand(seed * 30 + i) * 18 - 9}deg)`,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: 28,
          bottom: 24,
          padding: "9px 15px",
          borderRadius: 999,
          background: `${pal.bg}cc`,
          color: pal.text,
          font: `700 18px ${FONT_STACK}`,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
};

const ChannelMark: React.FC<{ name: string; pal: Palette; size?: number }> = ({ name, pal, size = 84 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "28%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      background: `linear-gradient(145deg, ${pal.primary}, ${pal.accent})`,
      color: pal.text,
      font: `900 ${size * 0.31}px ${FONT_STACK}`,
      letterSpacing: "-0.06em",
      boxShadow: `0 16px 50px ${pal.primary}44`,
    }}
  >
    {monogramFor(name)}
  </div>
);

// ---------------- variant: two-thumbnail ----------------
const TwoThumbnailEndcard: React.FC<{ p: OutroProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 18, stiffness: 110 } });
  const pulse = 1 + Math.sin(frame * 0.14) * 0.012;
  return (
    <AbsoluteFill style={{ padding: "70px 96px", fontFamily: FONT_STACK }}>
      <div style={{ display: "flex", alignItems: "center", gap: 25, opacity: intro, transform: `translateY(${(1 - intro) * -30}px)` }}>
        <ChannelMark name={p.channelName} pal={pal} size={82} />
        <div>
          <div style={{ color: pal.text, fontSize: 38, fontWeight: 800 }}>{p.channelName}</div>
          <div style={{ color: `${pal.text}99`, fontSize: 22, marginTop: 5 }}>{p.tagline}</div>
        </div>
        <div style={{ marginLeft: "auto", color: pal.secondary, fontSize: 19, letterSpacing: "0.16em", textTransform: "uppercase" }}>{p.primaryLink}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, marginTop: 58 }}>
        {["Watch next", "Recommended"].map((label, i) => {
          const card = spring({ frame: Math.max(0, frame - 10 - i * 8), fps, config: { damping: 16, stiffness: 105 } });
          return (
            <div key={label} style={{ opacity: card, transform: `translateY(${(1 - card) * 70}px) scale(${i === 0 ? pulse : 1})` }}>
              <ProceduralThumbnail
                pal={pal}
                seed={31 + i * 17}
                label={label}
                style={{ aspectRatio: "16 / 9", borderRadius: 24, border: `3px solid ${i === 0 ? `${pal.primary}${Math.round(120 + Math.sin(frame * 0.14) * 80).toString(16).padStart(2, "0")}` : `${pal.text}18`}`, boxShadow: `0 24px 80px ${pal.bg}99` }}
              />
              <div style={{ color: pal.text, fontSize: 27, fontWeight: 700, marginTop: 20 }}>{i === 0 ? p.nextTitle : p.secondaryLink}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------- variant: subscribe-bell ----------------
const SubscribeBell: React.FC<{ p: OutroProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 13, stiffness: 120 } });
  const morph = clampInterp(frame, [35, 60], [0, 1]);
  const bellIn = spring({ frame: Math.max(0, frame - 62), fps, config: { damping: 10, stiffness: 170 } });
  const wiggle = frame > 72 && frame < 100 ? Math.sin((frame - 72) * 0.75) * clampInterp(frame, [72, 100], [18, 0]) : 0;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: FONT_STACK }}>
      <div style={{ textAlign: "center", transform: `translateY(${(1 - enter) * 60}px)`, opacity: enter }}>
        <div style={{ color: `${pal.text}88`, fontSize: 22, letterSpacing: "0.35em", textTransform: "uppercase", marginBottom: 30 }}>{p.channelName}</div>
        <div style={{ color: pal.text, fontSize: 72, lineHeight: 1.05, fontWeight: 850, maxWidth: 980 }}>{p.tagline}</div>
      </div>
      <div style={{ marginTop: 58, height: 112, display: "flex", alignItems: "center", gap: 25 }}>
        <div
          style={{
            width: interpolate(morph, [0, 1], [430, 500]),
            height: 92,
            borderRadius: interpolate(morph, [0, 1], [20, 46]),
            background: morph < 0.55 ? pal.accent : `${pal.primary}22`,
            border: `2px solid ${morph < 0.55 ? pal.accent : pal.primary}`,
            color: pal.text,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 29,
            fontWeight: 850,
            letterSpacing: "0.13em",
            transform: `scale(${enter})`,
            boxShadow: `0 18px 70px ${pal.accent}33`,
          }}
        >
          <span style={{ transform: `scale(${clampInterp(frame, [52, 60, 68], [1, 0.72, 1])})` }}>{morph < 0.55 ? "SUBSCRIBE" : "✓ SUBSCRIBED"}</span>
        </div>
        <div
          style={{
            width: 92,
            height: 92,
            borderRadius: "50%",
            border: `2px solid ${pal.secondary}`,
            transform: `scale(${bellIn}) rotate(${wiggle}deg)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div style={{ width: 28, height: 32, borderRadius: "16px 16px 8px 8px", background: pal.secondary, position: "relative" }}>
            <div style={{ position: "absolute", width: 36, height: 5, borderRadius: 4, left: -4, bottom: 1, background: pal.secondary }} />
            <div style={{ position: "absolute", width: 8, height: 8, borderRadius: "50%", left: 10, bottom: -8, background: pal.secondary }} />
          </div>
          {[0, 1].map((i) => (
            <div key={i} style={{ position: "absolute", inset: -10 - i * 13, border: `1px solid ${pal.secondary}`, borderRadius: "50%", opacity: bellIn * (0.38 - i * 0.12) }} />
          ))}
        </div>
      </div>
      <div style={{ marginTop: 34, color: `${pal.text}77`, font: `18px ${MONO_STACK}` }}>{p.primaryLink}</div>
    </AbsoluteFill>
  );
};

// ---------------- variant: thanks-monogram ----------------
const ThanksMonogram: React.FC<{ p: OutroProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const mark = spring({ frame, fps, config: { damping: 22, stiffness: 70, mass: 1.4 } });
  const line = clampInterp(frame, [18, 55], [0, 1]);
  // Thumbnail renders scale the 1920×1080 design canvas down to 800×450.
  // Keep the editorial title and signature inside the reduced safe area.
  const viewportScale = Math.min(1, width / 1920, height / 1080);
  return (
    <AbsoluteFill style={{ padding: `${74 * viewportScale}px ${110 * viewportScale}px`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          right: -35,
          top: -145,
          fontSize: Math.min(width * 0.45, 790),
          fontWeight: 950,
          lineHeight: 1,
          letterSpacing: "-0.13em",
          color: "transparent",
          WebkitTextStroke: `3px ${pal.primary}40`,
          transform: `scale(${0.82 + mark * 0.18}) rotate(${(1 - mark) * -8}deg)`,
        }}
      >
        {monogramFor(p.channelName)}
      </div>
      <div style={{ marginTop: 150 * viewportScale, position: "relative", zIndex: 2, maxWidth: "100%" }}>
        <div style={{ width: `${line * 180 * viewportScale}px`, height: Math.max(2, 7 * viewportScale), background: pal.accent, marginBottom: 35 * viewportScale }} />
        <div style={{ color: pal.text, fontSize: Math.max(24, 104 * viewportScale), fontWeight: 850, letterSpacing: "-0.045em", lineHeight: 0.98, maxWidth: "100%", opacity: clampInterp(frame, [8, 28], [0, 1]), transform: `translateX(${clampInterp(frame, [8, 28], [-80 * viewportScale, 0])}px)` }}>
          Thanks for<br />watching.
        </div>
        <div style={{ color: pal.secondary, fontSize: Math.max(14, 28 * viewportScale), marginTop: 38 * viewportScale, letterSpacing: "0.04em", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: clampInterp(frame, [30, 48], [0, 1]) }}>{p.tagline}</div>
      </div>
      <div style={{ position: "absolute", bottom: 72 * viewportScale, left: 110 * viewportScale, right: 110 * viewportScale, display: "flex", justifyContent: "space-between", gap: 16 * viewportScale, color: `${pal.text}88`, fontSize: Math.max(12, 20 * viewportScale) }}>
        <span>{p.channelName}</span><span>{p.primaryLink}</span>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- variant: next-episode ----------------
const NextEpisode: React.FC<{ p: OutroProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps, width, height } = useVideoConfig();
  const reveal = spring({ frame: Math.max(0, frame - 6), fps, config: { damping: 18, stiffness: 90 } });
  const seconds = Math.max(0, Math.ceil((durationInFrames - frame) / fps));
  const viewportScale = Math.min(1, width / 1920, height / 1080);
  return (
    <AbsoluteFill style={{ display: "grid", gridTemplateColumns: "42% 58%", fontFamily: FONT_STACK, overflow: "hidden" }}>
      <div style={{ padding: `${92 * viewportScale}px ${68 * viewportScale}px ${80 * viewportScale}px ${100 * viewportScale}px`, display: "flex", flexDirection: "column", justifyContent: "space-between", borderRight: `1px solid ${pal.text}1c`, minWidth: 0 }}>
        <div>
          <div style={{ color: pal.accent, fontSize: Math.max(11, 19 * viewportScale), fontWeight: 750, letterSpacing: "0.24em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Up next in {seconds}s</div>
          <div style={{ color: pal.text, fontSize: Math.max(28, 82 * viewportScale), fontWeight: 880, lineHeight: 1.02, marginTop: 30 * viewportScale, letterSpacing: "-0.04em", maxWidth: "100%", overflowWrap: "anywhere", transform: `translateX(${(1 - reveal) * -60 * viewportScale}px)`, opacity: reveal }}>{p.nextTitle}</div>
          <div style={{ color: `${pal.text}88`, fontSize: Math.max(14, 25 * viewportScale), lineHeight: 1.35, marginTop: 30 * viewportScale, maxWidth: "100%", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{p.tagline}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 * viewportScale, minWidth: 0 }}>
          <ChannelMark name={p.channelName} pal={pal} size={Math.max(30, 62 * viewportScale)} />
          <div style={{ minWidth: 0 }}><div style={{ color: pal.text, fontWeight: 750, fontSize: Math.max(14, 23 * viewportScale), overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.channelName}</div><div style={{ color: `${pal.text}66`, marginTop: 4 * viewportScale, fontSize: Math.max(10, 16 * viewportScale), overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.primaryLink}</div></div>
        </div>
      </div>
      <div style={{ padding: 82 * viewportScale, display: "flex", alignItems: "center", minWidth: 0 }}>
        <div style={{ width: "100%", minWidth: 0, transform: `translateX(${(1 - reveal) * 100 * viewportScale}px)`, opacity: reveal }}>
          <ProceduralThumbnail pal={pal} seed={118} label="Next episode" style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: Math.max(12, 28 * viewportScale), boxShadow: `0 38px 100px ${pal.bg}` }} />
          <div style={{ height: Math.max(3, 7 * viewportScale), background: `${pal.text}22`, marginTop: 25 * viewportScale, borderRadius: 8, overflow: "hidden" }}>
            <div style={{ width: `${clampInterp(frame, [0, durationInFrames], [0, 100])}%`, height: "100%", background: pal.accent }} />
          </div>
          <div style={{ marginTop: 19 * viewportScale, display: "flex", justifyContent: "space-between", gap: 12 * viewportScale, color: `${pal.text}88`, fontSize: Math.max(11, 19 * viewportScale), minWidth: 0 }}><span>Autoplay enabled</span><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.secondaryLink}</span></div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- variant: social-grid ----------------
const SocialGrid: React.FC<{ p: OutroProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const links = p.socialLinks.slice(0, 4);
  return (
    <AbsoluteFill style={{ padding: "78px 105px", fontFamily: FONT_STACK }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ color: pal.text, fontSize: 70, fontWeight: 850, letterSpacing: "-0.04em" }}>Stay in the loop.</div>
          <div style={{ color: `${pal.text}88`, fontSize: 25, marginTop: 15 }}>{p.tagline}</div>
        </div>
        <ChannelMark name={p.channelName} pal={pal} size={78} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 62 }}>
        {links.map((item, i) => {
          const [network, handle] = splitPair(item);
          const enter = spring({ frame: Math.max(0, frame - 8 - i * 6), fps, config: { damping: 17, stiffness: 105 } });
          const hover = i === Math.floor(frame / 28) % Math.max(links.length, 1);
          return (
            <div
              key={`${network}-${i}`}
              style={{
                height: 230,
                borderRadius: 24,
                border: `1px solid ${hover ? pal.primary : `${pal.text}22`}`,
                background: hover ? `${pal.primary}18` : `${pal.bg}88`,
                padding: 34,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                opacity: enter,
                transform: `translateY(${(1 - enter) * 45}px)`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, display: "grid", placeItems: "center", color: pal.bg, background: [pal.primary, pal.secondary, pal.accent, pal.text][i % 4], fontWeight: 900 }}>{network.slice(0, 1).toUpperCase()}</div>
                <div style={{ color: hover ? pal.primary : `${pal.text}55`, fontSize: 28 }}>↗</div>
              </div>
              <div><div style={{ color: `${pal.text}77`, textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 15 }}>{network}</div><div style={{ color: pal.text, fontSize: 28, fontWeight: 700, marginTop: 8 }}>{handle || p.channelName}</div></div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------- variant: newsletter ----------------
const NewsletterSignup: React.FC<{ p: OutroProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const panel = spring({ frame, fps, config: { damping: 19, stiffness: 90 } });
  const typedSource = "you@example.com";
  const typedCount = Math.min(typedSource.length, Math.max(0, Math.floor((frame - 24) / 2)));
  const submitted = frame >= 78;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT_STACK, padding: 110 }}>
      <div style={{ width: "100%", maxWidth: 1420, textAlign: "center", opacity: panel, transform: `scale(${0.92 + panel * 0.08})` }}>
        <div style={{ color: pal.accent, letterSpacing: "0.28em", textTransform: "uppercase", fontSize: 18, fontWeight: 750 }}>{p.channelName} newsletter</div>
        <div style={{ color: pal.text, fontSize: 83, lineHeight: 1.05, fontWeight: 850, letterSpacing: "-0.04em", marginTop: 26 }}>One useful idea,<br />every Friday.</div>
        <div style={{ color: `${pal.text}88`, fontSize: 25, marginTop: 24 }}>{p.tagline}</div>
        <div style={{ display: "flex", height: 105, margin: "55px auto 0", maxWidth: 1050, border: `2px solid ${submitted ? pal.primary : `${pal.text}38`}`, borderRadius: 18, background: `${pal.bg}cc`, overflow: "hidden", boxShadow: `0 25px 90px ${pal.primary}22` }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 34px", color: typedCount ? pal.text : `${pal.text}44`, font: `24px ${MONO_STACK}`, textAlign: "left" }}>
            {submitted ? "You're on the list." : typedSource.slice(0, typedCount)}{!submitted && <span style={{ opacity: frame % 14 < 8 ? 1 : 0, color: pal.accent }}>▍</span>}
          </div>
          <div style={{ width: 285, display: "grid", placeItems: "center", background: submitted ? pal.primary : pal.accent, color: submitted ? pal.bg : pal.text, fontSize: 21, fontWeight: 850, letterSpacing: "0.1em" }}>{submitted ? "✓ WELCOME" : "SIGN ME UP"}</div>
        </div>
        <div style={{ color: `${pal.text}55`, fontSize: 17, marginTop: 22 }}>{p.primaryLink} · No spam, unsubscribe anytime.</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- variant: playlist-stack ----------------
const PlaylistStack: React.FC<{ p: OutroProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const spread = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 17, stiffness: 90 } });
  return (
    <AbsoluteFill style={{ display: "grid", gridTemplateColumns: "56% 44%", padding: "75px 80px", fontFamily: FONT_STACK, overflow: "hidden" }}>
      <div style={{ position: "relative" }}>
        {[3, 2, 1, 0].map((i) => {
          const x = i * 44 * spread;
          const y = i * 29 * spread;
          const rot = (i - 1.5) * 2.5 * spread;
          return (
            <ProceduralThumbnail
              key={i}
              pal={pal}
              seed={240 + i * 13}
              label={`0${i + 1}`}
              style={{
                position: "absolute",
                left: 45 + x,
                top: 95 + y,
                width: 690,
                aspectRatio: "16 / 9",
                borderRadius: 22,
                border: `2px solid ${pal.text}24`,
                boxShadow: `0 25px 65px ${pal.bg}cc`,
                transform: `rotate(${rot}deg)`,
              }}
            />
          );
        })}
      </div>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: 55, position: "relative", zIndex: 5 }}>
        <div style={{ color: pal.accent, fontSize: 18, letterSpacing: "0.25em", fontWeight: 800, textTransform: "uppercase" }}>Curated playlist · 8 videos</div>
        <div style={{ color: pal.text, fontSize: 80, fontWeight: 880, lineHeight: 1.02, letterSpacing: "-0.05em", marginTop: 28 }}>Keep the<br />momentum.</div>
        <div style={{ color: `${pal.text}88`, fontSize: 25, lineHeight: 1.5, marginTop: 30 }}>{p.tagline}</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 18, marginTop: 43, color: pal.text, fontSize: 22, fontWeight: 750 }}><span style={{ width: 52, height: 52, borderRadius: "50%", display: "grid", placeItems: "center", background: pal.primary, color: pal.bg }}>▶</span> PLAY ALL</div>
        <div style={{ color: `${pal.text}55`, fontSize: 17, marginTop: 28 }}>{p.primaryLink}</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- variant: logo-tagline ----------------
const LogoTagline: React.FC<{ p: OutroProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame, fps, config: { damping: 14, stiffness: 90, mass: 1.1 } });
  const orbit = frame * 0.5;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT_STACK, overflow: "hidden" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ position: "absolute", width: 360 + i * 150, height: 360 + i * 150, borderRadius: "50%", border: `1px solid ${pal.primary}${i === 0 ? "55" : "24"}`, transform: `rotate(${orbit * (i % 2 ? -1 : 1)}deg) scale(${logo})` }}>
          <div style={{ position: "absolute", width: 10 + i * 3, height: 10 + i * 3, borderRadius: "50%", background: i === 1 ? pal.accent : pal.secondary, left: "50%", top: -6 }} />
        </div>
      ))}
      <div style={{ width: 270, height: 270, borderRadius: 64, background: `linear-gradient(145deg, ${pal.primary}, ${pal.accent})`, display: "grid", placeItems: "center", color: pal.text, fontSize: 86, fontWeight: 950, letterSpacing: "-0.08em", transform: `scale(${logo}) rotate(${(1 - logo) * -20}deg)`, boxShadow: `0 40px 120px ${pal.primary}55`, zIndex: 3 }}>{monogramFor(p.channelName)}</div>
      <div style={{ position: "absolute", top: "72%", textAlign: "center", opacity: clampInterp(frame, [28, 50], [0, 1]), transform: `translateY(${clampInterp(frame, [28, 50], [25, 0])}px)` }}>
        <div style={{ color: pal.text, fontSize: 39, fontWeight: 800, letterSpacing: "0.02em" }}>{p.channelName}</div>
        <div style={{ color: pal.secondary, fontSize: 21, letterSpacing: "0.13em", marginTop: 13 }}>{p.tagline}</div>
        <div style={{ color: `${pal.text}66`, font: `16px ${MONO_STACK}`, marginTop: 23 }}>{p.primaryLink}</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- variant: credits-roll ----------------
const CreditsRoll: React.FC<{ p: OutroProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const items = p.credits.length ? p.credits : ["Created by|Your Team"];
  const y = interpolate(frame, [0, durationInFrames], [820, -items.length * 135 - 240]);
  return (
    <AbsoluteFill style={{ fontFamily: FONT_STACK, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: "0 50% 0 0", borderRight: `1px solid ${pal.text}20`, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "82px 90px" }}>
        <ChannelMark name={p.channelName} pal={pal} size={92} />
        <div>
          <div style={{ color: pal.text, fontSize: 73, fontWeight: 870, letterSpacing: "-0.05em", lineHeight: 1.02 }}>{p.channelName}</div>
          <div style={{ color: pal.secondary, fontSize: 24, lineHeight: 1.5, marginTop: 22 }}>{p.tagline}</div>
        </div>
        <div style={{ color: `${pal.text}55`, font: `17px ${MONO_STACK}` }}>{p.primaryLink}</div>
      </div>
      <div style={{ position: "absolute", left: "50%", right: 0, top: 0, bottom: 0, overflow: "hidden" }}>
        <div style={{ transform: `translateY(${y}px)`, padding: "0 90px" }}>
          <div style={{ color: pal.accent, fontSize: 18, letterSpacing: "0.28em", textTransform: "uppercase", fontWeight: 800, marginBottom: 80 }}>Credits</div>
          {items.map((item, i) => {
            const [role, name] = splitPair(item);
            return (
              <div key={`${item}-${i}`} style={{ minHeight: 135, borderTop: `1px solid ${pal.text}18`, paddingTop: 25 }}>
                <div style={{ color: `${pal.text}66`, fontSize: 16, textTransform: "uppercase", letterSpacing: "0.2em" }}>{role}</div>
                <div style={{ color: pal.text, fontSize: 34, fontWeight: 720, marginTop: 10 }}>{name || role}</div>
              </div>
            );
          })}
          <div style={{ borderTop: `1px solid ${pal.text}18`, paddingTop: 45, color: pal.secondary, fontSize: 29 }}>Thank you for watching.</div>
        </div>
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(${pal.bg} 0%, transparent 16%, transparent 84%, ${pal.bg} 100%)`, pointerEvents: "none" }} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------- variant: watch-more ----------------
const WatchMore: React.FC<{ p: OutroProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const line = clampInterp(frame, [12, 48], [0, 1]);
  const text = clampInterp(frame, [4, 26], [0, 1]);
  return (
    <AbsoluteFill style={{ padding: "82px 100px", fontFamily: FONT_STACK }}>
      <div style={{ display: "flex", justifyContent: "space-between", color: `${pal.text}70`, fontSize: 18, letterSpacing: "0.16em", textTransform: "uppercase" }}><span>{p.channelName}</span><span>{p.primaryLink}</span></div>
      <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
        <div style={{ width: "100%" }}>
          <div style={{ color: pal.text, fontSize: 154, fontWeight: 900, letterSpacing: "-0.075em", lineHeight: 0.82, opacity: text, transform: `translateY(${(1 - text) * 70}px)` }}>WATCH</div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 42 }}>
            <div style={{ color: "transparent", WebkitTextStroke: `2px ${pal.secondary}`, fontSize: 154, fontWeight: 900, letterSpacing: "-0.075em", lineHeight: 0.82, opacity: text }}>MORE</div>
            <div style={{ height: 5, flex: line, minWidth: 0, background: pal.accent, marginLeft: 55, position: "relative", transformOrigin: "left" }}>
              <div style={{ position: "absolute", right: -2, top: -14, width: 32, height: 32, borderTop: `5px solid ${pal.accent}`, borderRight: `5px solid ${pal.accent}`, transform: "rotate(45deg)" }} />
            </div>
          </div>
          <div style={{ color: `${pal.text}72`, fontSize: 25, marginTop: 55, maxWidth: 700, lineHeight: 1.5, opacity: clampInterp(frame, [38, 56], [0, 1]) }}>{p.nextTitle} · {p.tagline}</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: pal.secondary, fontSize: 19 }}>{p.secondaryLink}</span>
        <span style={{ width: 13, height: 13, borderRadius: "50%", background: pal.accent, boxShadow: `0 0 0 ${10 + Math.sin(frame * 0.12) * 6}px ${pal.accent}22` }} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------- dispatcher ----------------
const VARIANTS: Record<OutroVariant, React.FC<{ p: OutroProps; pal: Palette }>> = {
  "two-thumbnail": TwoThumbnailEndcard,
  "subscribe-bell": SubscribeBell,
  "thanks-monogram": ThanksMonogram,
  "next-episode": NextEpisode,
  "social-grid": SocialGrid,
  newsletter: NewsletterSignup,
  "playlist-stack": PlaylistStack,
  "logo-tagline": LogoTagline,
  "credits-roll": CreditsRoll,
  "watch-more": WatchMore,
};

export const OutroEndcardTemplate: React.FC<OutroProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? TwoThumbnailEndcard;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg }}>
      <GradientMeshBackground palette={pal} speed={0.35} blobs={props.variant === "watch-more" || props.variant === "credits-roll" ? 2 : 4} />
      <FadeEdges inFrames={10} outFrames={14}>
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}>
          <Variant p={props} pal={pal} />
        </div>
      </FadeEdges>
    </AbsoluteFill>
  );
};

const familyCast = (c: React.FC<OutroProps>) => c as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "outro-two-thumbnail-pulse": familyCast(OutroEndcardTemplate),
  "outro-subscribe-bell-morph": familyCast(OutroEndcardTemplate),
  "outro-thanks-monogram": familyCast(OutroEndcardTemplate),
  "outro-next-episode-teaser": familyCast(OutroEndcardTemplate),
  "outro-social-links-grid": familyCast(OutroEndcardTemplate),
  "outro-newsletter-signup": familyCast(OutroEndcardTemplate),
  "outro-playlist-stack": familyCast(OutroEndcardTemplate),
  "outro-logo-tagline": familyCast(OutroEndcardTemplate),
  "outro-credits-roll": familyCast(OutroEndcardTemplate),
  "outro-minimal-watch-more": familyCast(OutroEndcardTemplate),
};
