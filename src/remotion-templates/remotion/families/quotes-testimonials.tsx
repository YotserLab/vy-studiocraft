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
 * FAMILY: quotes-testimonials
 * Ten distinct quote and testimonial compositions. All portraits are generated
 * initials, so every variant remains deterministic and asset-free.
 */

type QuoteVariant =
  | "giant-serif"
  | "centered-minimal"
  | "card-stack"
  | "testimonial-wall"
  | "tweet-card"
  | "star-rating"
  | "editorial-pull"
  | "video-frame"
  | "rotating-emphasis"
  | "marquee-row";

interface QuoteItem {
  quote: string;
  author: string;
  role: string;
  handle?: string;
  rating?: number;
}

export interface QuoteProps {
  variant: QuoteVariant;
  quote: string;
  author: string;
  role: string;
  paletteName: string;
  handle?: string;
  rating?: number;
  emphasisWord?: string;
  caption?: string;
  testimonials?: QuoteItem[];
}

const SANS = 'Inter, "Helvetica Neue", Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "?";

const Avatar: React.FC<{
  name: string;
  pal: Palette;
  size?: number;
  index?: number;
}> = ({ name, pal, size = 68, index = 0 }) => {
  const colors = [pal.primary, pal.secondary, pal.accent];
  const color = colors[index % colors.length];
  return (
    <div
      style={{
        width: size,
        height: size,
        flex: `0 0 ${size}px`,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(145deg, ${color}, ${pal.bg})`,
        border: `2px solid ${color}`,
        color: pal.text,
        fontFamily: SANS,
        fontWeight: 800,
        fontSize: size * 0.32,
        letterSpacing: "0.04em",
        boxShadow: `0 10px 34px ${pal.bg}88`,
      }}
    >
      {initials(name)}
    </div>
  );
};

const Byline: React.FC<{
  author: string;
  role: string;
  pal: Palette;
  align?: "left" | "center";
  avatar?: boolean;
}> = ({ author, role, pal, align = "left", avatar = true }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: align === "center" ? "center" : "flex-start",
      gap: 18,
      textAlign: align,
    }}
  >
    {avatar ? <Avatar name={author} pal={pal} size={62} /> : null}
    <div style={{ fontFamily: SANS }}>
      <div style={{ color: pal.text, fontWeight: 750, fontSize: 27 }}>{author}</div>
      <div style={{ color: pal.secondary, fontSize: 20, marginTop: 4 }}>{role}</div>
    </div>
  </div>
);

const Backdrop: React.FC<{ pal: Palette }> = ({ pal }) => (
  <AbsoluteFill
    style={{
      backgroundColor: pal.bg,
      backgroundImage: `radial-gradient(circle at 18% 10%, ${pal.primary}22, transparent 34%), radial-gradient(circle at 85% 88%, ${pal.accent}1f, transparent 38%)`,
    }}
  />
);

const sourceItems = (p: QuoteProps): QuoteItem[] => [
  { quote: p.quote, author: p.author, role: p.role, handle: p.handle, rating: p.rating },
  ...(p.testimonials ?? []),
];

// ---------------- giant quotation mark + serif quote ----------------
const GiantSerif: React.FC<{ p: QuoteProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const reveal = clampInterp(frame, [8, 30], [0, 1]);
  const markY = clampInterp(frame, [0, 24], [-90, 0]);
  return (
    <AbsoluteFill style={{ padding: "105px 140px", justifyContent: "center", overflow: "hidden" }}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 90,
          top: -100 + markY,
          color: `${pal.primary}35`,
          fontFamily: SERIF,
          fontSize: 620,
          lineHeight: 1,
        }}
      >
        “
      </div>
      <div style={{ position: "relative", width: "82%", marginLeft: "8%" }}>
        <div
          style={{
            fontFamily: SERIF,
            color: pal.text,
            fontSize: Math.min(width * 0.058, 94),
            lineHeight: 1.18,
            letterSpacing: "-0.025em",
            clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)`,
          }}
        >
          “{p.quote}”
        </div>
        <div
          style={{
            marginTop: 54,
            opacity: clampInterp(frame, [30, 45], [0, 1]),
            transform: `translateX(${clampInterp(frame, [30, 45], [-28, 0])}px)`,
          }}
        >
          <Byline author={p.author} role={p.role} pal={pal} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- centered minimal + delayed author fade ----------------
const CenteredMinimal: React.FC<{ p: QuoteProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const line = clampInterp(frame, [4, 26], [0, 1]);
  const authorFade = clampInterp(frame, [34, 54], [0, 1]);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 180 }}>
      <div style={{ width: 84, height: 4, background: pal.accent, transform: `scaleX(${line})` }} />
      <div
        style={{
          maxWidth: 1300,
          marginTop: 54,
          fontFamily: SANS,
          fontWeight: 420,
          fontSize: Math.min(width * 0.045, 76),
          lineHeight: 1.32,
          textAlign: "center",
          color: pal.text,
          opacity: clampInterp(frame, [12, 34], [0, 1]),
          transform: `translateY(${clampInterp(frame, [12, 34], [18, 0])}px)`,
        }}
      >
        {p.quote}
      </div>
      <div style={{ marginTop: 52, opacity: authorFade }}>
        <Byline author={p.author} role={p.role} pal={pal} align="center" avatar={false} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------- auto-advancing stack of three cards ----------------
const CardStack: React.FC<{ p: QuoteProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const items = sourceItems(p).slice(0, 3);
  const segment = durationInFrames / Math.max(1, items.length);
  const active = Math.min(items.length - 1, Math.floor(frame / segment));
  const local = frame - active * segment;
  const enter = clampInterp(local, [0, 12], [0, 1]);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", perspective: 1400 }}>
      <div style={{ position: "relative", width: 1110, height: 610 }}>
        {items.map((item, i) => {
          const relative = (i - active + items.length) % items.length;
          const depth = relative === 0 ? 0 : relative;
          const x = relative === 0 ? interpolate(enter, [0, 1], [130, 0]) : depth * 34;
          const y = depth * 30;
          const scale = 1 - depth * 0.055;
          return (
            <div
              key={`${item.author}-${i}`}
              style={{
                position: "absolute",
                inset: 0,
                padding: "78px 88px",
                borderRadius: 38,
                boxSizing: "border-box",
                background: `linear-gradient(145deg, ${pal.bg}, ${pal.primary}20)`,
                border: `2px solid ${depth === 0 ? pal.primary : `${pal.secondary}33`}`,
                boxShadow: `0 35px 90px ${pal.bg}`,
                opacity: depth === 0 ? enter : 0.64 - depth * 0.14,
                transform: `translate3d(${x}px, ${y}px, ${-depth * 90}px) scale(${scale}) rotate(${depth * 1.5}deg)`,
                zIndex: items.length - depth,
              }}
            >
              {depth === 0 && <>
                <div style={{ color: pal.accent, fontFamily: SERIF, fontSize: 94, lineHeight: 0.6 }}>“</div>
                <div style={{ color: pal.text, fontFamily: SERIF, fontSize: 54, lineHeight: 1.3, marginTop: 32 }}>
                  {item.quote}
                </div>
                <div style={{ position: "absolute", left: 88, bottom: 68 }}>
                  <Byline author={item.author} role={item.role} pal={pal} />
                </div>
                <div style={{ position: "absolute", right: 74, bottom: 75, color: pal.secondary, fontFamily: SANS, fontSize: 20 }}>
                  {String(active + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
                </div>
              </>}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------- testimonial wall pop-in grid ----------------
const TestimonialWall: React.FC<{ p: QuoteProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = sourceItems(p).slice(0, 6);
  return (
    <AbsoluteFill style={{ padding: "92px 105px" }}>
      <div style={{ color: pal.text, fontFamily: SANS, fontSize: 30, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 44 }}>
        What people are saying
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, flex: 1 }}>
        {items.map((item, i) => {
          const delay = 5 + i * 5 + Math.floor(seededRand(i + 9) * 5);
          const pop = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 13, stiffness: 155, mass: 0.8 } });
          const tilt = (seededRand(i + 31) - 0.5) * 3;
          return (
            <div
              key={`${item.author}-${i}`}
              style={{
                minHeight: 300,
                padding: "34px 38px",
                boxSizing: "border-box",
                borderRadius: 24,
                background: i % 2 ? `${pal.primary}16` : `${pal.text}0b`,
                border: `1px solid ${pal.secondary}2e`,
                transform: `scale(${interpolate(pop, [0, 1], [0.55, 1])}) rotate(${tilt * (1 - pop)}deg)`,
                opacity: pop,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div style={{ color: pal.text, fontFamily: SERIF, fontSize: 29, lineHeight: 1.38 }}>“{item.quote}”</div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 24 }}>
                <Avatar name={item.author} pal={pal} size={50} index={i} />
                <div style={{ fontFamily: SANS }}>
                  <div style={{ color: pal.text, fontSize: 18, fontWeight: 750 }}>{item.author}</div>
                  <div style={{ color: pal.secondary, fontSize: 15, marginTop: 3 }}>{item.role}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------- tweet-style social card ----------------
const TweetCard: React.FC<{ p: QuoteProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const settle = spring({ frame: Math.max(0, frame - 6), fps, config: { damping: 16, stiffness: 120 } });
  const handle = p.handle || `@${p.author.toLowerCase().replace(/[^a-z0-9]+/g, "")}`;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          width: 1060,
          minHeight: 540,
          boxSizing: "border-box",
          padding: "62px 70px",
          borderRadius: 34,
          background: `${pal.text}0c`,
          border: `1px solid ${pal.secondary}52`,
          boxShadow: `0 40px 120px ${pal.bg}`,
          opacity: settle,
          transform: `translateY(${interpolate(settle, [0, 1], [90, 0])}px) rotateX(${interpolate(settle, [0, 1], [12, 0])}deg)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <Avatar name={p.author} pal={pal} size={76} />
          <div style={{ fontFamily: SANS, marginLeft: 20 }}>
            <div style={{ color: pal.text, fontSize: 28, fontWeight: 800 }}>{p.author} <span style={{ color: pal.primary, fontSize: 22 }}>●</span></div>
            <div style={{ color: pal.secondary, fontSize: 21, marginTop: 4 }}>{handle}</div>
          </div>
          <div style={{ marginLeft: "auto", color: pal.primary, fontFamily: SANS, fontWeight: 900, fontSize: 48 }}>t</div>
        </div>
        <div style={{ color: pal.text, fontFamily: SANS, fontSize: 47, lineHeight: 1.35, marginTop: 52 }}>{p.quote}</div>
        <div style={{ borderTop: `1px solid ${pal.secondary}38`, marginTop: 50, paddingTop: 25, display: "flex", color: pal.secondary, fontFamily: SANS, fontSize: 20, gap: 52 }}>
          <span>9:41 AM · Customer story</span><span style={{ color: pal.accent }}>♥ 2.4K</span><span>↗ Share</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- star-rating blurb ----------------
const StarRating: React.FC<{ p: QuoteProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const rating = Math.max(0, Math.min(5, Math.round(p.rating ?? 5)));
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center", padding: 150 }}>
      <div style={{ display: "flex", gap: 22 }}>
        {Array.from({ length: 5 }, (_, i) => {
          const pop = spring({ frame: Math.max(0, frame - 5 - i * 4), fps, config: { damping: 10, stiffness: 180 } });
          return <span key={i} style={{ color: i < rating ? pal.accent : `${pal.secondary}44`, fontSize: 74, display: "inline-block", transform: `scale(${pop}) rotate(${(1 - pop) * -40}deg)` }}>★</span>;
        })}
      </div>
      <div style={{ color: pal.text, fontFamily: SERIF, fontSize: Math.min(width * 0.052, 84), lineHeight: 1.25, maxWidth: 1300, marginTop: 44, opacity: clampInterp(frame, [24, 44], [0, 1]) }}>
        “{p.quote}”
      </div>
      <div style={{ marginTop: 54, opacity: clampInterp(frame, [42, 58], [0, 1]) }}>
        <Byline author={p.author} role={p.role} pal={pal} align="center" />
      </div>
    </AbsoluteFill>
  );
};

// ---------------- editorial pull quote with rules ----------------
const EditorialPull: React.FC<{ p: QuoteProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const rule = clampInterp(frame, [4, 28], [0, 1]);
  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg, padding: "105px 135px", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "stretch", gap: 70 }}>
        <div style={{ width: "24%", borderTop: `3px solid ${pal.primary}`, paddingTop: 30, transform: `scaleX(${rule})`, transformOrigin: "left top" }}>
          <div style={{ color: pal.primary, fontFamily: SANS, fontSize: 18, letterSpacing: "0.25em", textTransform: "uppercase", fontWeight: 800 }}>In their words</div>
          <div style={{ color: pal.secondary, fontFamily: SANS, fontSize: 21, lineHeight: 1.5, marginTop: 250 }}>{p.role}</div>
        </div>
        <div style={{ width: "76%", borderTop: `3px solid ${pal.text}`, borderBottom: `3px solid ${pal.text}`, padding: "58px 0 65px" }}>
          <div style={{ color: pal.text, fontFamily: SERIF, fontSize: Math.min(width * 0.055, 88), lineHeight: 1.16, letterSpacing: "-0.025em", opacity: clampInterp(frame, [18, 42], [0, 1]) }}>
            {p.quote}
          </div>
          <div style={{ color: pal.accent, fontFamily: SANS, fontSize: 23, letterSpacing: "0.16em", textTransform: "uppercase", marginTop: 58, opacity: clampInterp(frame, [36, 52], [0, 1]) }}>
            — {p.author}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- video-testimonial placeholder + caption bar ----------------
const VideoFrame: React.FC<{ p: QuoteProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 18, stiffness: 105 } });
  const pulse = 1 + Math.sin(frame * 0.1) * 0.035;
  return (
    <AbsoluteFill style={{ padding: "86px 110px", justifyContent: "center" }}>
      <div style={{ display: "flex", height: 770, borderRadius: 34, overflow: "hidden", border: `2px solid ${pal.secondary}38`, transform: `scale(${interpolate(reveal, [0, 1], [0.92, 1])})`, opacity: reveal }}>
        <div style={{ position: "relative", width: "61%", background: `linear-gradient(145deg, ${pal.primary}42, ${pal.bg} 70%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 32, border: `1px solid ${pal.secondary}44`, borderRadius: 22 }} />
          <div style={{ textAlign: "center" }}>
            <Avatar name={p.author} pal={pal} size={190} />
            <div style={{ color: pal.secondary, fontFamily: SANS, fontSize: 20, letterSpacing: "0.16em", textTransform: "uppercase", marginTop: 28 }}>Video testimonial</div>
          </div>
          <div style={{ position: "absolute", width: 96, height: 96, borderRadius: "50%", background: pal.accent, display: "flex", alignItems: "center", justifyContent: "center", right: 58, bottom: 52, transform: `scale(${pulse})`, boxShadow: `0 0 0 14px ${pal.accent}22` }}>
            <span style={{ color: pal.bg, fontSize: 40, marginLeft: 7 }}>▶</span>
          </div>
          <div style={{ position: "absolute", top: 48, left: 52, color: pal.text, fontFamily: SANS, fontSize: 18, padding: "10px 16px", borderRadius: 999, background: `${pal.bg}99` }}>● 01:24</div>
        </div>
        <div style={{ width: "39%", background: `${pal.text}09`, padding: "68px 58px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: pal.accent, fontFamily: SERIF, fontSize: 74, lineHeight: 0.7 }}>“</div>
            <div style={{ color: pal.text, fontFamily: SERIF, fontSize: 38, lineHeight: 1.36, marginTop: 30 }}>{p.quote}</div>
          </div>
          <Byline author={p.author} role={p.role} pal={pal} avatar={false} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 110, right: 110, bottom: 86, height: 76, background: pal.primary, display: "flex", alignItems: "center", padding: "0 34px", boxSizing: "border-box", color: pal.bg, fontFamily: SANS, fontSize: 24, fontWeight: 700 }}>
        CC&nbsp;&nbsp; {p.caption || p.quote}
      </div>
    </AbsoluteFill>
  );
};

// ---------------- rotating word emphasis ----------------
const RotatingEmphasis: React.FC<{ p: QuoteProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width } = useVideoConfig();
  const words = p.quote.split(/\s+/);
  const requested = p.emphasisWord ? words.findIndex((word) => word.toLowerCase().replace(/[^a-z0-9]/g, "") === p.emphasisWord?.toLowerCase().replace(/[^a-z0-9]/g, "")) : -1;
  const cycle = Math.max(1, Math.floor(durationInFrames / Math.max(1, words.length)));
  const active = requested >= 0 && frame < durationInFrames * 0.32 ? requested : Math.floor(frame / cycle) % Math.max(1, words.length);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 150 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.24em", maxWidth: 1450, fontFamily: SANS, fontSize: Math.min(width * 0.064, 104), fontWeight: 820, lineHeight: 1.2 }}>
        {words.map((word, i) => {
          const isActive = i === active;
          return (
            <span key={`${word}-${i}`} style={{ display: "inline-block", position: "relative", color: isActive ? pal.bg : pal.text, padding: "0.02em 0.09em", transform: `rotate(${isActive ? -2 : 0}deg) scale(${isActive ? 1.08 : 1})`, transition: "none", zIndex: isActive ? 1 : 0 }}>
              {isActive ? <span style={{ position: "absolute", inset: "-0.04em -0.08em", background: pal.accent, borderRadius: 8, zIndex: -1, transform: `rotate(${Math.sin(frame * 0.12) * 1.5}deg)` }} /> : null}
              {word}
            </span>
          );
        })}
      </div>
      <div style={{ marginTop: 70, opacity: clampInterp(frame, [18, 34], [0, 1]) }}>
        <Byline author={p.author} role={p.role} pal={pal} align="center" />
      </div>
    </AbsoluteFill>
  );
};

// ---------------- continuous testimonial marquee row ----------------
const MarqueeRow: React.FC<{ p: QuoteProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const items = sourceItems(p);
  const strip = [...items, ...items, ...items];
  const cardWidth = 510;
  const gap = 28;
  const loopWidth = items.length * (cardWidth + gap);
  const x = loopWidth > 0 ? -((frame * 3.2) % loopWidth) : 0;
  return (
    <AbsoluteFill style={{ justifyContent: "center", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 95, left: 0, right: 0, textAlign: "center", color: pal.text, fontFamily: SANS, fontSize: 28, fontWeight: 800, letterSpacing: "0.25em", textTransform: "uppercase" }}>Customer voices</div>
      <div style={{ display: "flex", gap, width: "max-content", transform: `translateX(${x - cardWidth}px)` }}>
        {strip.map((item, i) => (
          <div key={`${item.author}-${i}`} style={{ width: cardWidth, height: 440, flex: `0 0 ${cardWidth}px`, boxSizing: "border-box", padding: "46px 42px", borderRadius: 28, border: `1px solid ${pal.secondary}40`, background: i % 2 ? `${pal.primary}17` : `${pal.text}0a`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: pal.accent, fontSize: 27, letterSpacing: "0.13em" }}>{"★".repeat(Math.max(1, Math.min(5, Math.round(item.rating ?? 5))))}</div>
              <div style={{ color: pal.text, fontFamily: SERIF, fontSize: 32, lineHeight: 1.38, marginTop: 30 }}>“{item.quote}”</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Avatar name={item.author} pal={pal} size={54} index={i} />
              <div style={{ fontFamily: SANS }}><div style={{ color: pal.text, fontSize: 19, fontWeight: 800 }}>{item.author}</div><div style={{ color: pal.secondary, fontSize: 15, marginTop: 4 }}>{item.role}</div></div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `linear-gradient(90deg, ${pal.bg} 0%, transparent ${Math.min(14, width / 140)}%, transparent 86%, ${pal.bg} 100%)` }} />
    </AbsoluteFill>
  );
};

const VARIANTS: Record<QuoteVariant, React.FC<{ p: QuoteProps; pal: Palette }>> = {
  "giant-serif": GiantSerif,
  "centered-minimal": CenteredMinimal,
  "card-stack": CardStack,
  "testimonial-wall": TestimonialWall,
  "tweet-card": TweetCard,
  "star-rating": StarRating,
  "editorial-pull": EditorialPull,
  "video-frame": VideoFrame,
  "rotating-emphasis": RotatingEmphasis,
  "marquee-row": MarqueeRow,
};

export const QuotesTestimonialsTemplate: React.FC<QuoteProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? GiantSerif;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return (
    <AbsoluteFill style={{ fontFamily: SANS }}>
      <Backdrop pal={pal} />
      <FadeEdges inFrames={10} outFrames={14}>
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><Variant p={props} pal={pal} /></div>
      </FadeEdges>
    </AbsoluteFill>
  );
};

const familyCast = (component: React.FC<QuoteProps>) =>
  component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "quote-giant-serif": familyCast(QuotesTestimonialsTemplate),
  "quote-centered-minimal": familyCast(QuotesTestimonialsTemplate),
  "quote-card-stack": familyCast(QuotesTestimonialsTemplate),
  "quote-testimonial-wall": familyCast(QuotesTestimonialsTemplate),
  "quote-tweet-card": familyCast(QuotesTestimonialsTemplate),
  "quote-star-rating": familyCast(QuotesTestimonialsTemplate),
  "quote-editorial-pull": familyCast(QuotesTestimonialsTemplate),
  "quote-video-frame": familyCast(QuotesTestimonialsTemplate),
  "quote-rotating-emphasis": familyCast(QuotesTestimonialsTemplate),
  "quote-marquee-row": familyCast(QuotesTestimonialsTemplate),
};
