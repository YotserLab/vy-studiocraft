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
  NoiseGrainOverlay,
  clampInterp,
  resolvePalette,
  seededRand,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: social-announcements
 * Ten logo-free social announcement compositions driven by one dispatcher.
 */

type SocialAnnouncementVariant =
  | "follow-cta-handle-slide"
  | "link-in-bio-url-pill"
  | "new-post-notification-pop"
  | "story-vertical-frame-swipe-hint"
  | "giveaway-prize-pop"
  | "follower-milestone-thanks"
  | "profile-card-stats"
  | "dm-chat-bubble-reveal"
  | "share-prompt-icon-orbit"
  | "confetti-edge-banner";

export interface SocialAnnouncementProps {
  variant: SocialAnnouncementVariant;
  headline: string;
  subline: string;
  handle: string;
  url: string;
  value: string;
  actionLabel: string;
  paletteName: string;
}

const FONT_STACK = 'Inter, "Helvetica Neue", Arial, sans-serif';

type VariantProps = { p: SocialAnnouncementProps; pal: Palette };
type GlyphKind = "user" | "link" | "bell" | "gift" | "arrow" | "heart" | "plus" | "message";

const Glyph: React.FC<{ kind: GlyphKind; color: string; size?: number; stroke?: number }> = ({
  kind,
  color,
  size = 48,
  stroke = 2.4,
}) => {
  const common = { fill: "none", stroke: color, strokeWidth: stroke, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      {kind === "user" && <><circle cx="24" cy="16" r="8" {...common} /><path d="M9 41c1.8-9 7-13.5 15-13.5S37.2 32 39 41" {...common} /></>}
      {kind === "link" && <><path d="M20 30l-3.5 3.5a8 8 0 01-11.3-11.3l7-7a8 8 0 0111.3 0" {...common} /><path d="M28 18l3.5-3.5a8 8 0 0111.3 11.3l-7 7a8 8 0 01-11.3 0" {...common} /><path d="M17 31l14-14" {...common} /></>}
      {kind === "bell" && <><path d="M10 35h28l-4-6V19c0-6-4-10-10-10S14 13 14 19v10z" {...common} /><path d="M20 39c1 3 7 3 8 0" {...common} /></>}
      {kind === "gift" && <><rect x="7" y="19" width="34" height="23" rx="3" {...common} /><path d="M5 14h38v8H5zM24 14v28" {...common} /><path d="M24 14c-9 0-12-2-12-6 0-3 2-5 5-5 4 0 7 6 7 11zm0 0c9 0 12-2 12-6 0-3-2-5-5-5-4 0-7 6-7 11z" {...common} /></>}
      {kind === "arrow" && <><path d="M8 31l29-17-10 27-5-12z" {...common} /><path d="M22 29l15-15" {...common} /></>}
      {kind === "heart" && <path d="M24 41S7 31 7 18c0-9 11-13 17-5 6-8 17-4 17 5 0 13-17 23-17 23z" {...common} />}
      {kind === "plus" && <><circle cx="24" cy="24" r="18" {...common} /><path d="M24 15v18M15 24h18" {...common} /></>}
      {kind === "message" && <><path d="M7 9h34v25H20L10 41v-7H7z" {...common} /><path d="M15 20h18M15 26h12" {...common} /></>}
    </svg>
  );
};

const Avatar: React.FC<{ pal: Palette; size: number }> = ({ pal, size }) => (
  <div style={{ width: size, height: size, flex: `0 0 ${size}px`, borderRadius: "50%", display: "grid", placeItems: "center", background: `linear-gradient(145deg, ${pal.primary}, ${pal.accent})`, boxShadow: `0 0 0 ${Math.max(3, size * 0.045)}px ${pal.text}18` }}>
    <Glyph kind="user" color={pal.text} size={size * 0.52} />
  </div>
);

const Eyebrow: React.FC<{ children: React.ReactNode; pal: Palette }> = ({ children, pal }) => (
  <div style={{ fontFamily: FONT_STACK, color: pal.secondary, fontSize: 22, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" }}>{children}</div>
);

const FollowCta: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const scale = Math.min(width / 1920, height / 1080);
  const enter = spring({ frame: frame - 8, fps, config: { damping: 16, stiffness: 125 } });
  const button = spring({ frame: frame - 28, fps, config: { damping: 11, stiffness: 180 } });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT_STACK }}>
      <div style={{ display: "flex", alignItems: "center", gap: 28 * scale, padding: `${28 * scale}px ${34 * scale}px`, minWidth: Math.min(width * 0.72, 1040 * scale), border: `1px solid ${pal.text}24`, borderRadius: 34 * scale, background: `${pal.bg}d9`, boxShadow: `0 30px 90px ${pal.bg}aa`, transform: `translateX(${interpolate(enter, [0, 1], [-width * 0.8, 0])}px) rotate(${interpolate(enter, [0, 1], [-4, 0])}deg)`, opacity: enter }}>
        <Avatar pal={pal} size={112 * scale} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Eyebrow pal={pal}>{p.headline}</Eyebrow>
          <div style={{ marginTop: 8 * scale, color: pal.text, fontSize: 48 * scale, fontWeight: 850, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.handle}</div>
          <div style={{ marginTop: 5 * scale, color: `${pal.text}88`, fontSize: 23 * scale }}>{p.subline}</div>
        </div>
        <div style={{ padding: `${17 * scale}px ${30 * scale}px`, borderRadius: 999, color: pal.bg, background: pal.accent, fontSize: 24 * scale, fontWeight: 900, transform: `scale(${interpolate(button, [0, 1], [0, 1])})` }}>{p.actionLabel}</div>
      </div>
    </AbsoluteFill>
  );
};

const LinkInBio: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = Math.min(width / 1920, height / 1080);
  const reveal = spring({ frame: frame - 12, fps, config: { damping: 15, stiffness: 115 } });
  const travel = clampInterp(frame, [28, 52], [0, 1]);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT_STACK }}>
      <div style={{ textAlign: "center", width: "84%" }}>
        <Eyebrow pal={pal}>{p.subline}</Eyebrow>
        <div style={{ marginTop: 18 * s, color: pal.text, fontSize: Math.min(width * 0.067, 112 * s), fontWeight: 900, letterSpacing: "-0.035em", transform: `translateY(${interpolate(reveal, [0, 1], [60, 0])}px)`, opacity: reveal }}>{p.headline}</div>
        <div style={{ position: "relative", margin: `${58 * s}px auto 0`, maxWidth: 1080 * s, height: 112 * s, borderRadius: 999, border: `2px solid ${pal.primary}88`, display: "flex", alignItems: "center", gap: 22 * s, padding: `0 ${34 * s}px`, color: pal.text, background: `${pal.bg}cc`, fontSize: 32 * s, fontWeight: 700, boxShadow: `0 22px 70px ${pal.primary}20`, clipPath: `inset(0 ${interpolate(reveal, [0, 1], [50, 0])}% round 999px)` }}>
          <Glyph kind="link" color={pal.primary} size={48 * s} />
          <span style={{ flex: 1, textAlign: "left" }}>{p.url}</span>
          <div style={{ width: 58 * s, height: 58 * s, borderRadius: "50%", display: "grid", placeItems: "center", background: pal.accent, transform: `translateX(${interpolate(travel, [0, 1], [-18, 0])}px)` }}><Glyph kind="arrow" color={pal.bg} size={30 * s} stroke={3} /></div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const NewPostNotification: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = Math.min(width / 1920, height / 1080);
  const pop = spring({ frame: frame - 12, fps, config: { damping: 10, stiffness: 185, mass: 0.8 } });
  const imageReveal = clampInterp(frame, [26, 55], [0, 1]);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT_STACK }}>
      <div style={{ width: Math.min(width * 0.7, 950 * s), padding: 24 * s, borderRadius: 38 * s, background: pal.text, color: pal.bg, boxShadow: `0 35px 100px ${pal.bg}99`, transform: `scale(${interpolate(pop, [0, 1], [0.55, 1])}) translateY(${interpolate(pop, [0, 1], [120, 0])}px)`, opacity: pop }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22 * s }}>
          <div style={{ width: 70 * s, height: 70 * s, borderRadius: 20 * s, background: pal.primary, display: "grid", placeItems: "center" }}><Glyph kind="bell" color={pal.text} size={38 * s} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 19 * s, color: `${pal.bg}88`, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase" }}>{p.actionLabel}</div>
            <div style={{ fontSize: 34 * s, fontWeight: 900, marginTop: 4 * s }}>{p.headline}</div>
            <div style={{ fontSize: 23 * s, color: `${pal.bg}99`, marginTop: 5 * s }}>{p.handle} · {p.subline}</div>
          </div>
          <div style={{ width: 130 * s, height: 96 * s, borderRadius: 22 * s, overflow: "hidden", background: `linear-gradient(135deg, ${pal.primary}, ${pal.accent})`, transform: `scale(${imageReveal})` }}>
            <div style={{ width: 46 * s, height: 46 * s, borderRadius: "50%", background: `${pal.text}50`, margin: `${16 * s}px 0 0 ${62 * s}px` }} />
            <div style={{ width: 170 * s, height: 80 * s, background: `${pal.bg}30`, transform: "rotate(-18deg) translate(-18px, 8px)" }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const StorySwipe: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const portrait = height > width;
  const s = Math.min(width / 1080, height / 1920);
  const card = spring({ frame: frame - 8, fps, config: { damping: 18, stiffness: 95 } });
  const arrowY = interpolate(frame % 30, [0, 18, 30], [25, -18, 25]);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: FONT_STACK }}>
      <div style={{ position: "absolute", top: portrait ? 86 * s : 42, left: portrait ? 74 * s : "8%", right: portrait ? 74 * s : "8%", display: "flex", gap: 9 * s }}>
        {Array.from({ length: 5 }, (_, i) => <div key={i} style={{ flex: 1, height: 7 * s, borderRadius: 99, background: i === 0 ? pal.text : `${pal.text}32`, transform: i === 0 ? `scaleX(${clampInterp(frame, [10, 75], [0, 1])})` : undefined, transformOrigin: "left" }} />)}
      </div>
      <div style={{ width: portrait ? width * 0.84 : Math.min(width * 0.34, 520), height: portrait ? height * 0.69 : height * 0.72, borderRadius: 52 * s, position: "relative", overflow: "hidden", border: `2px solid ${pal.text}35`, background: `linear-gradient(155deg, ${pal.primary}cc, ${pal.bg} 60%, ${pal.accent}99)`, boxShadow: `0 32px 110px ${pal.bg}bb`, transform: `translateX(${interpolate(card, [0, 1], [width, 0])}px) rotate(${interpolate(card, [0, 1], [10, 0])}deg)`, opacity: card }}>
        <div style={{ position: "absolute", inset: 0, background: `repeating-linear-gradient(120deg, transparent 0 70px, ${pal.text}08 70px 72px)` }} />
        <div style={{ position: "absolute", inset: 0, padding: `${120 * s}px ${64 * s}px`, display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center" }}>
          <Eyebrow pal={pal}>{p.handle}</Eyebrow>
          <div style={{ color: pal.text, fontSize: portrait ? 92 * s : 58, lineHeight: 0.98, fontWeight: 950, marginTop: 28 * s, letterSpacing: "-0.05em" }}>{p.headline}</div>
          <div style={{ color: `${pal.text}b0`, fontSize: 31 * s, lineHeight: 1.35, marginTop: 28 * s }}>{p.subline}</div>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: portrait ? 100 * s : 35, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 * s, color: pal.text, transform: `translateY(${arrowY * s}px)` }}>
        <div style={{ fontSize: 23 * s, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase" }}>{p.actionLabel}</div>
        <div style={{ width: 30 * s, height: 30 * s, borderLeft: `3px solid ${pal.text}`, borderTop: `3px solid ${pal.text}`, transform: "rotate(45deg)" }} />
      </div>
    </AbsoluteFill>
  );
};

const GiveawayPrize: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = Math.min(width / 1920, height / 1080);
  const gift = spring({ frame: frame - 10, fps, config: { damping: 8, stiffness: 150, mass: 0.9 } });
  const lid = spring({ frame: frame - 32, fps, config: { damping: 10, stiffness: 170 } });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT_STACK }}>
      {Array.from({ length: 14 }, (_, i) => {
        const angle = (Math.PI * 2 * i) / 14;
        const r = clampInterp(frame, [26, 55], [0, (250 + seededRand(i) * 160) * s]);
        return <div key={i} style={{ position: "absolute", left: "50%", top: "50%", width: (10 + seededRand(i + 30) * 10) * s, height: (10 + seededRand(i + 50) * 34) * s, borderRadius: i % 3 ? 3 : "50%", background: [pal.primary, pal.secondary, pal.accent][i % 3], transform: `translate(${Math.cos(angle) * r}px, ${Math.sin(angle) * r}px) rotate(${frame * (2 + i % 4)}deg)`, opacity: clampInterp(frame, [25, 34, 72], [0, 1, 0]) }} />;
      })}
      <div style={{ display: "flex", alignItems: "center", gap: 84 * s, width: "76%" }}>
        <div style={{ flex: 1 }}>
          <Eyebrow pal={pal}>{p.actionLabel}</Eyebrow>
          <div style={{ color: pal.text, fontSize: Math.min(width * 0.072, 112 * s), lineHeight: 0.94, fontWeight: 950, letterSpacing: "-0.05em", marginTop: 20 * s }}>{p.headline}</div>
          <div style={{ color: pal.accent, fontSize: 48 * s, fontWeight: 900, marginTop: 25 * s }}>{p.value}</div>
          <div style={{ color: `${pal.text}aa`, fontSize: 27 * s, marginTop: 13 * s }}>{p.subline}</div>
        </div>
        <div style={{ width: 350 * s, height: 350 * s, display: "grid", placeItems: "center", borderRadius: "50%", background: `${pal.primary}22`, transform: `scale(${interpolate(gift, [0, 1], [0, 1])}) rotate(${interpolate(gift, [0, 1], [-18, 0])}deg)` }}>
          <div style={{ transform: `translateY(${interpolate(lid, [0, 1], [42, 0])}px) rotate(${interpolate(lid, [0, 1], [-12, 0])}deg)` }}><Glyph kind="gift" color={pal.text} size={220 * s} stroke={1.8} /></div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const FollowerMilestone: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const s = Math.min(width / 1920, height / 1080);
  const count = clampInterp(frame, [8, 58], [0, 1]);
  const ring = clampInterp(frame, [4, 68], [0, 360]);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT_STACK, textAlign: "center" }}>
      <div style={{ width: 570 * s, height: 570 * s, borderRadius: "50%", padding: 10 * s, background: `conic-gradient(${pal.accent} ${ring}deg, ${pal.text}14 ${ring}deg)`, display: "grid", placeItems: "center", transform: `scale(${0.88 + count * 0.12})` }}>
        <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: pal.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <Eyebrow pal={pal}>{p.headline}</Eyebrow>
          <div style={{ color: pal.text, fontSize: 145 * s, fontWeight: 950, letterSpacing: "-0.065em", lineHeight: 1, marginTop: 16 * s, fontVariantNumeric: "tabular-nums" }}>{p.value}</div>
          <div style={{ color: pal.accent, fontSize: 33 * s, fontWeight: 850, marginTop: 12 * s }}>{p.actionLabel}</div>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: "9%", color: `${pal.text}b0`, fontSize: 30 * s, letterSpacing: "0.03em", opacity: clampInterp(frame, [48, 64], [0, 1]) }}>{p.subline} · {p.handle}</div>
    </AbsoluteFill>
  );
};

const ProfileStats: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = Math.min(width / 1920, height / 1080);
  const enter = spring({ frame: frame - 7, fps, config: { damping: 17, stiffness: 105 } });
  const stats = [p.value, "128", "4.9K"];
  const labels = ["followers", "posts", "likes"];
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT_STACK }}>
      <div style={{ width: Math.min(width * 0.76, 1060 * s), borderRadius: 46 * s, padding: `${54 * s}px ${64 * s}px`, color: pal.text, background: `linear-gradient(145deg, ${pal.text}12, ${pal.text}05)`, border: `1px solid ${pal.text}24`, backdropFilter: "blur(20px)", transform: `translateY(${interpolate(enter, [0, 1], [180, 0])}px)`, opacity: enter }}>
        <div style={{ display: "flex", alignItems: "center", gap: 34 * s }}>
          <Avatar pal={pal} size={144 * s} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 46 * s, fontWeight: 900 }}>{p.handle}</div>
            <div style={{ fontSize: 25 * s, color: `${pal.text}92`, marginTop: 8 * s }}>{p.subline}</div>
          </div>
          <div style={{ border: `2px solid ${pal.accent}`, color: pal.accent, padding: `${13 * s}px ${25 * s}px`, borderRadius: 999, fontSize: 22 * s, fontWeight: 900 }}>{p.actionLabel}</div>
        </div>
        <div style={{ height: 1, background: `${pal.text}20`, margin: `${42 * s}px 0 ${34 * s}px` }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
          {stats.map((stat, i) => {
            const t = spring({ frame: frame - 26 - i * 5, fps, config: { damping: 14, stiffness: 135 } });
            return <div key={labels[i]} style={{ textAlign: "center", borderLeft: i ? `1px solid ${pal.text}20` : undefined, transform: `translateY(${interpolate(t, [0, 1], [35, 0])}px)`, opacity: t }}><div style={{ color: i === 0 ? pal.accent : pal.text, fontSize: 50 * s, fontWeight: 950 }}>{stat}</div><div style={{ color: `${pal.text}75`, fontSize: 19 * s, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 7 * s }}>{labels[i]}</div></div>;
          })}
        </div>
        <div style={{ marginTop: 35 * s, color: pal.secondary, fontSize: 24 * s, fontWeight: 800, textAlign: "center" }}>{p.headline}</div>
      </div>
    </AbsoluteFill>
  );
};

const DmChat: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = Math.min(width / 1920, height / 1080);
  const messages = [p.headline, p.subline, p.actionLabel];
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT_STACK }}>
      <div style={{ width: Math.min(width * 0.72, 880 * s), padding: 34 * s, borderRadius: 40 * s, border: `1px solid ${pal.text}1f`, background: `${pal.bg}df`, boxShadow: `0 35px 100px ${pal.bg}bb` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 * s, paddingBottom: 24 * s, borderBottom: `1px solid ${pal.text}1b` }}><Avatar pal={pal} size={68 * s} /><div><div style={{ color: pal.text, fontSize: 25 * s, fontWeight: 900 }}>{p.handle}</div><div style={{ color: pal.secondary, fontSize: 17 * s, marginTop: 3 * s }}>active now</div></div><div style={{ marginLeft: "auto" }}><Glyph kind="message" color={pal.secondary} size={34 * s} /></div></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 * s, padding: `${34 * s}px 0 ${20 * s}px` }}>
          {messages.map((message, i) => {
            const mine = i === 1;
            const pop = spring({ frame: frame - 12 - i * 15, fps, config: { damping: 13, stiffness: 175 } });
            return <div key={i} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "76%", padding: `${17 * s}px ${24 * s}px`, borderRadius: mine ? `${25 * s}px ${25 * s}px ${5 * s}px ${25 * s}px` : `${25 * s}px ${25 * s}px ${25 * s}px ${5 * s}px`, background: mine ? pal.primary : `${pal.text}13`, color: pal.text, fontSize: 25 * s, lineHeight: 1.35, transform: `translateX(${interpolate(pop, [0, 1], [mine ? 90 : -90, 0])}px) scale(${interpolate(pop, [0, 1], [0.75, 1])})`, opacity: pop }}>{message}</div>;
          })}
        </div>
        <div style={{ height: 60 * s, borderRadius: 999, border: `1px solid ${pal.text}22`, display: "flex", alignItems: "center", padding: `0 ${23 * s}px`, color: `${pal.text}55`, fontSize: 19 * s }}>Message…<div style={{ marginLeft: "auto" }}><Glyph kind="arrow" color={pal.accent} size={30 * s} /></div></div>
      </div>
    </AbsoluteFill>
  );
};

const ShareOrbit: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = Math.min(width / 1920, height / 1080);
  const center = spring({ frame: frame - 8, fps, config: { damping: 12, stiffness: 150 } });
  const icons: GlyphKind[] = ["heart", "message", "link", "plus"];
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT_STACK, textAlign: "center" }}>
      <div style={{ position: "relative", width: 650 * s, height: 650 * s, display: "grid", placeItems: "center" }}>
        <div style={{ position: "absolute", inset: 65 * s, borderRadius: "50%", border: `1px dashed ${pal.secondary}55`, transform: `rotate(${frame * 0.6}deg)` }} />
        {icons.map((kind, i) => {
          const angle = frame * (i % 2 ? -0.012 : 0.012) + (Math.PI * 2 * i) / icons.length;
          const r = (210 + (i % 2) * 38) * s;
          const reveal = clampInterp(frame, [17 + i * 4, 32 + i * 4], [0, 1]);
          return <div key={kind} style={{ position: "absolute", width: 78 * s, height: 78 * s, borderRadius: 24 * s, background: i % 2 ? pal.primary : `${pal.text}15`, border: `1px solid ${pal.text}25`, display: "grid", placeItems: "center", transform: `translate(${Math.cos(angle) * r}px, ${Math.sin(angle) * r}px) scale(${reveal})` }}><Glyph kind={kind} color={pal.text} size={39 * s} /></div>;
        })}
        <div style={{ width: 270 * s, height: 270 * s, borderRadius: "50%", background: pal.accent, color: pal.bg, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", boxShadow: `0 0 90px ${pal.accent}55`, transform: `scale(${center})` }}>
          <Glyph kind="arrow" color={pal.bg} size={74 * s} stroke={2.8} />
          <div style={{ fontSize: 25 * s, fontWeight: 950, marginTop: 9 * s, textTransform: "uppercase", letterSpacing: "0.08em" }}>{p.actionLabel}</div>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: "9%", color: pal.text, fontSize: 43 * s, fontWeight: 900 }}>{p.headline}<div style={{ color: pal.secondary, fontSize: 23 * s, fontWeight: 500, marginTop: 9 * s }}>{p.subline}</div></div>
    </AbsoluteFill>
  );
};

const ConfettiEdgeBanner: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const portrait = height > width;
  const s = Math.min(width / (portrait ? 1080 : 1920), height / (portrait ? 1920 : 1080));
  const banner = spring({ frame: frame - 9, fps, config: { damping: 13, stiffness: 135 } });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", overflow: "hidden", fontFamily: FONT_STACK }}>
      {Array.from({ length: 44 }, (_, i) => {
        const leftEdge = i % 2 === 0;
        const x = leftEdge ? seededRand(i * 3) * 13 : 87 + seededRand(i * 3) * 13;
        const y = ((seededRand(i * 3 + 1) * 115 + frame * (0.35 + seededRand(i) * 0.65)) % 115) - 8;
        return <div key={i} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: (8 + seededRand(i + 40) * 13) * s, height: (15 + seededRand(i + 80) * 32) * s, borderRadius: i % 4 === 0 ? "50%" : 3, background: [pal.primary, pal.secondary, pal.accent, pal.text][i % 4], opacity: 0.8, transform: `rotate(${frame * (1 + i % 5) + seededRand(i) * 180}deg)` }} />;
      })}
      <div style={{ width: portrait ? "78%" : "72%", padding: portrait ? `${100 * s}px ${55 * s}px` : `${64 * s}px ${95 * s}px`, textAlign: "center", background: pal.text, color: pal.bg, borderRadius: 28 * s, boxShadow: `18px 18px 0 ${pal.accent}`, transform: `scaleX(${interpolate(banner, [0, 1], [0, 1])}) rotate(${interpolate(banner, [0, 1], [-3, 0])}deg)`, overflow: "hidden" }}>
        <div style={{ fontSize: 21 * s, fontWeight: 900, color: pal.primary, textTransform: "uppercase", letterSpacing: "0.22em" }}>{p.actionLabel}</div>
        <div style={{ fontSize: portrait ? 92 * s : 92 * s, fontWeight: 950, letterSpacing: "-0.055em", lineHeight: 0.96, marginTop: 22 * s }}>{p.headline}</div>
        <div style={{ color: `${pal.bg}99`, fontSize: 28 * s, marginTop: 24 * s }}>{p.subline}</div>
        <div style={{ display: "inline-block", marginTop: 30 * s, padding: `${12 * s}px ${24 * s}px`, borderRadius: 999, background: pal.bg, color: pal.text, fontSize: 21 * s, fontWeight: 850 }}>{p.handle}</div>
      </div>
    </AbsoluteFill>
  );
};

const VARIANTS: Record<SocialAnnouncementVariant, React.FC<VariantProps>> = {
  "follow-cta-handle-slide": FollowCta,
  "link-in-bio-url-pill": LinkInBio,
  "new-post-notification-pop": NewPostNotification,
  "story-vertical-frame-swipe-hint": StorySwipe,
  "giveaway-prize-pop": GiveawayPrize,
  "follower-milestone-thanks": FollowerMilestone,
  "profile-card-stats": ProfileStats,
  "dm-chat-bubble-reveal": DmChat,
  "share-prompt-icon-orbit": ShareOrbit,
  "confetti-edge-banner": ConfettiEdgeBanner,
};

export const SocialAnnouncementTemplate: React.FC<SocialAnnouncementProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? FollowCta;
  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg }}>
      <GradientMeshBackground palette={pal} blobs={4} speed={0.65} />
      <FadeEdges inFrames={8} outFrames={10}>
        <Variant p={props} pal={pal} />
      </FadeEdges>
      <NoiseGrainOverlay opacity={0.035} />
    </AbsoluteFill>
  );
};

const familyCast = (component: React.FC<SocialAnnouncementProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "social-follow-cta-handle-slide": familyCast(SocialAnnouncementTemplate),
  "social-link-in-bio-url-pill": familyCast(SocialAnnouncementTemplate),
  "social-new-post-notification-pop": familyCast(SocialAnnouncementTemplate),
  "social-story-vertical-frame-swipe-hint": familyCast(SocialAnnouncementTemplate),
  "social-giveaway-prize-pop": familyCast(SocialAnnouncementTemplate),
  "social-follower-milestone-thanks": familyCast(SocialAnnouncementTemplate),
  "social-profile-card-stats": familyCast(SocialAnnouncementTemplate),
  "social-dm-chat-bubble-reveal": familyCast(SocialAnnouncementTemplate),
  "social-share-prompt-icon-orbit": familyCast(SocialAnnouncementTemplate),
  "social-confetti-edge-banner": familyCast(SocialAnnouncementTemplate),
};
