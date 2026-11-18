import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, clampInterp, resolvePalette, type Palette } from "../lib/primitives";

/**
 * FAMILY: quote-cards-premium
 * Editorial and cinematic quotation treatments. The family is intentionally
 * separate from customer testimonials: its emphasis is typography, source,
 * rhythm, and the reveal of an authored quotation.
 */

type QuoteCardsPremiumVariant =
  | "kinetic-quote"
  | "paper-quote"
  | "typewriter-quote"
  | "split-quote"
  | "quote-over-photo"
  | "quote-wall"
  | "source-reveal"
  | "quote-underline"
  | "longform-pullquote"
  | "quote-to-logo";

interface QuoteCardItem {
  quote: string;
  author?: string;
  source?: string;
  citation?: string;
  imageUrl?: string;
}

export interface QuoteCardsPremiumProps {
  variant: QuoteCardsPremiumVariant;
  quote: string;
  author: string;
  source: string;
  paletteName: string;
  imageUrl?: string;
  logoUrl?: string;
  background?: string;
  accentColor?: string;
  citation?: string;
  body?: string;
  quotes?: QuoteCardItem[];
  emphasisWord?: string;
}

const SANS = 'Inter, "Helvetica Neue", Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

const words = (value: string): string[] => value.trim().split(/\s+/).filter(Boolean);
const quoteItems = (p: QuoteCardsPremiumProps): QuoteCardItem[] => [
  { quote: p.quote, author: p.author, source: p.source, citation: p.citation, imageUrl: p.imageUrl },
  ...(p.quotes ?? []),
];
const accent = (p: QuoteCardsPremiumProps, pal: Palette) => p.accentColor ?? pal.accent;

const Initial = ({ name, pal, size = 72 }: { name: string; pal: Palette; size?: number }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flex: `0 0 ${size}px`,
      background: `linear-gradient(145deg, ${pal.primary}, ${pal.bg})`,
      border: `2px solid ${pal.secondary}88`,
      color: pal.text,
      fontFamily: SANS,
      fontSize: size * 0.31,
      fontWeight: 800,
      letterSpacing: "0.04em",
    }}
  >
    {(name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "Q")}
  </div>
);

const Attribution = ({
  p,
  pal,
  centered = false,
  light = false,
}: {
  p: QuoteCardItem | QuoteCardsPremiumProps;
  pal: Palette;
  centered?: boolean;
  light?: boolean;
}) => {
  const primary = light ? "#ffffff" : pal.text;
  const secondary = light ? "#ffffffb8" : `${pal.secondary}`;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: centered ? "center" : "flex-start",
        gap: 16,
        color: primary,
        fontFamily: SANS,
        textAlign: centered ? "center" : "left",
      }}
    >
      <Initial name={p.author ?? "Anonymous"} pal={pal} size={centered ? 58 : 66} />
      <div>
        <div style={{ fontSize: centered ? 22 : 24, fontWeight: 760 }}>{p.author ?? "Anonymous"}</div>
        <div style={{ marginTop: 5, color: secondary, fontSize: centered ? 17 : 18 }}>{p.source ?? "Source"}</div>
      </div>
    </div>
  );
};

const Backdrop: React.FC<{ pal: Palette; p: QuoteCardsPremiumProps }> = ({ pal, p }) => (
  <AbsoluteFill
    style={{
      background: p.background ?? pal.bg,
      color: pal.text,
      overflow: "hidden",
      fontFamily: SANS,
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(circle at 12% 12%, ${accent(p, pal)}20, transparent 34%), radial-gradient(circle at 88% 86%, ${pal.primary}18, transparent 40%)`,
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: 0.08,
        backgroundImage: `linear-gradient(${pal.text} 1px, transparent 1px), linear-gradient(90deg, ${pal.text} 1px, transparent 1px)`,
        backgroundSize: "72px 72px",
        maskImage: "linear-gradient(to bottom, black, transparent 80%)",
      }}
    />
  </AbsoluteFill>
);

const KineticQuote: React.FC<{ p: QuoteCardsPremiumProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const list = words(p.quote);
  const shown = list.map((word, i) => {
    const progress = clampInterp(frame, [8 + i * 3, 18 + i * 3], [0, 1]);
    return (
      <span
        key={`${word}-${i}`}
        style={{
          display: "inline-block",
          marginRight: "0.25em",
          opacity: progress,
          transform: `translateY(${(1 - progress) * 34}px) rotate(${(1 - progress) * (i % 2 ? 2 : -2)}deg)`,
        }}
      >
        {word}
      </span>
    );
  });
  return (
    <AbsoluteFill style={{ padding: "118px 142px", justifyContent: "center" }}>
      <div style={{ color: accent(p, pal), fontFamily: MONO, fontSize: 18, letterSpacing: "0.2em", textTransform: "uppercase" }}>
        VOICE / 01
      </div>
      <div
        style={{
          marginTop: 38,
          maxWidth: 1450,
          color: pal.text,
          fontFamily: SERIF,
          fontSize: Math.min(width * 0.053, 92),
          lineHeight: 1.14,
          letterSpacing: "-0.035em",
        }}
      >
        “{shown}”
      </div>
      <div style={{ marginTop: 58, opacity: clampInterp(frame, [54, 70], [0, 1]), transform: `translateX(${clampInterp(frame, [54, 70], [-22, 0])}px)` }}>
        <Attribution p={p} pal={pal} />
      </div>
    </AbsoluteFill>
  );
};

const PaperQuote: React.FC<{ p: QuoteCardsPremiumProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const reveal = clampInterp(frame, [10, 34], [0, 1]);
  const line = clampInterp(frame, [30, 54], [0, 1]);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 130 }}>
      <div
        style={{
          position: "relative",
          width: "76%",
          minHeight: 590,
          boxSizing: "border-box",
          padding: "86px 112px",
          color: "#241f1a",
          background: "#f7f0df",
          boxShadow: "18px 24px 0 #00000022, 0 40px 90px #00000033",
          transform: `rotate(${clampInterp(frame, [0, 30], [2.4, 0.6])}deg)`,
          clipPath: "polygon(1% 3%, 98% 0%, 100% 96%, 95% 100%, 51% 98%, 2% 100%, 0% 9%)",
        }}
      >
        <div style={{ color: accent(p, pal), fontFamily: MONO, fontSize: 17, letterSpacing: "0.18em", textTransform: "uppercase" }}>FIELD NOTES</div>
        <div style={{ marginTop: 42, fontFamily: SERIF, fontSize: 58, lineHeight: 1.28, opacity: reveal, transform: `translateY(${(1 - reveal) * 20}px)` }}>“{p.quote}”</div>
        <div style={{ width: "42%", height: 3, marginTop: 46, background: accent(p, pal), transformOrigin: "left", transform: `scaleX(${line})` }} />
        <div style={{ marginTop: 28, fontFamily: SANS, fontSize: 21, fontWeight: 700 }}>{p.author}</div>
        <div style={{ marginTop: 6, color: "#756b5d", fontFamily: SANS, fontSize: 17 }}>{p.source}</div>
      </div>
    </AbsoluteFill>
  );
};

const TypewriterQuote: React.FC<{ p: QuoteCardsPremiumProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const chars = Math.min(p.quote.length, Math.max(0, Math.floor(clampInterp(frame, [12, 100], [0, p.quote.length]))));
  const text = p.quote.slice(0, chars);
  return (
    <AbsoluteFill style={{ padding: "150px 160px", justifyContent: "center", background: `${pal.bg}ee` }}>
      <div style={{ color: accent(p, pal), fontFamily: MONO, fontSize: 19, letterSpacing: "0.14em" }}>TRANSCRIPT / {p.source.toUpperCase()}</div>
      <div style={{ marginTop: 45, maxWidth: 1440, color: pal.text, fontFamily: MONO, fontSize: Math.min(width * 0.038, 62), lineHeight: 1.4 }}>
        {"> "}{text}<span style={{ color: accent(p, pal), opacity: frame % 18 < 9 ? 1 : 0 }}>▌</span>
      </div>
      <div style={{ marginTop: 54, color: pal.secondary, fontFamily: SANS, fontSize: 23, opacity: clampInterp(frame, [100, 118], [0, 1]) }}>
        — {p.author}
      </div>
    </AbsoluteFill>
  );
};

const SplitQuote: React.FC<{ p: QuoteCardsPremiumProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const reveal = clampInterp(frame, [8, 28], [0, 1]);
  // Keep the editorial scale, but reserve enough vertical room for custom copy.
  const quoteSize = p.quote.length > 110 ? 40 : p.quote.length > 78 ? 48 : 56;
  const side = p.imageUrl ? (
    <img src={p.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.86 }} />
  ) : (
    <div style={{ width: "100%", height: "100%", background: `linear-gradient(145deg, ${pal.primary}, ${pal.bg} 66%, ${pal.accent})` }} />
  );
  return (
    <AbsoluteFill style={{ display: "grid", gridTemplateColumns: "44% 56%", background: pal.bg }}>
      <div style={{ position: "relative", overflow: "hidden" }}>{side}<div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, transparent, ${pal.bg}99)` }} /></div>
      <div style={{ minWidth: 0, padding: "96px 110px 84px 82px", display: "flex", flexDirection: "column", justifyContent: "center", boxSizing: "border-box" }}>
        <div style={{ color: accent(p, pal), fontFamily: MONO, fontSize: 17, letterSpacing: "0.2em" }}>THE WORDS</div>
        <div style={{ maxWidth: "100%", overflowWrap: "break-word", marginTop: 32, color: pal.text, fontFamily: SERIF, fontSize: quoteSize, lineHeight: 1.18, opacity: reveal, transform: `translateX(${(1 - reveal) * 28}px)` }}>“{p.quote}”</div>
        <div style={{ marginTop: 52, opacity: clampInterp(frame, [30, 46], [0, 1]) }}><Attribution p={p} pal={pal} /></div>
      </div>
    </AbsoluteFill>
  );
};

const QuoteOverPhoto: React.FC<{ p: QuoteCardsPremiumProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const progress = clampInterp(frame, [0, 40], [0, 1]);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {p.imageUrl ? <img src={p.imageUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.12 - progress * 0.06})` }} /> : <AbsoluteFill style={{ background: `linear-gradient(120deg, ${pal.primary}, ${pal.bg} 54%, ${pal.accent})`, transform: `scale(${1.12 - progress * 0.06})` }} />}
      <AbsoluteFill style={{ background: "linear-gradient(90deg, #000000bb, #00000038 65%, #00000088)" }} />
      <div style={{ position: "relative", width: "72%", color: "#fff", textAlign: "center" }}>
        <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: "0.24em", color: "#ffffffcc" }}>AN OBSERVATION</div>
        <div style={{ marginTop: 34, fontFamily: SERIF, fontSize: 72, lineHeight: 1.2, opacity: clampInterp(frame, [15, 38], [0, 1]) }}>“{p.quote}”</div>
        <div style={{ marginTop: 45, fontFamily: SANS, fontSize: 23, opacity: clampInterp(frame, [42, 58], [0, 1]) }}>{p.author} · {p.source}</div>
      </div>
    </AbsoluteFill>
  );
};

const QuoteWall: React.FC<{ p: QuoteCardsPremiumProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const items = quoteItems(p).slice(0, 6);
  while (items.length < 6) items.push({ quote: p.quote, author: p.author, source: p.source });
  return (
    <AbsoluteFill style={{ padding: "90px 120px", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ color: pal.text, fontFamily: SERIF, fontSize: 54 }}>Voices worth keeping</div>
        <div style={{ color: accent(p, pal), fontFamily: MONO, fontSize: 17, letterSpacing: "0.16em" }}>SELECTED QUOTES</div>
      </div>
      <div style={{ marginTop: 42, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, flex: 1 }}>
        {items.map((item, i) => {
          const e = clampInterp(frame, [8 + i * 5, 22 + i * 5], [0, 1]);
          return <div key={`${item.author}-${i}`} style={{ minHeight: 270, padding: 28, boxSizing: "border-box", border: `1px solid ${pal.text}28`, background: `${pal.primary}12`, opacity: e, transform: `translateY(${(1 - e) * 22}px) rotate(${(i % 2 ? 1 : -1) * (1 - e) * 1.5}deg)` }}><div style={{ color: accent(p, pal), fontFamily: SERIF, fontSize: 48, lineHeight: 0.6 }}>“</div><div style={{ marginTop: 20, color: pal.text, fontFamily: SERIF, fontSize: 27, lineHeight: 1.25 }}>{item.quote}</div><div style={{ position: "absolute", bottom: 22, color: pal.secondary, fontFamily: SANS, fontSize: 15 }}>{item.author} · {item.source}</div></div>;
        })}
      </div>
    </AbsoluteFill>
  );
};

const SourceReveal: React.FC<{ p: QuoteCardsPremiumProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const quoteIn = clampInterp(frame, [8, 30], [0, 1]);
  const sourceIn = clampInterp(frame, [55, 78], [0, 1]);
  const quoteSize = p.quote.length > 110 ? 48 : p.quote.length > 78 ? 56 : 64;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "170px 140px", boxSizing: "border-box" }}>
      <div style={{ width: "75%", maxWidth: 1440, minWidth: 0, textAlign: "center" }}>
        <div style={{ maxWidth: "100%", overflowWrap: "break-word", color: pal.text, fontFamily: SERIF, fontSize: quoteSize, lineHeight: 1.16, opacity: quoteIn, transform: `scale(${0.96 + quoteIn * 0.04})` }}>“{p.quote}”</div>
        <div style={{ height: 2, width: "100%", margin: "48px 0", background: `${pal.text}2b`, transformOrigin: "center", transform: `scaleX(${sourceIn})` }} />
        <div style={{ opacity: sourceIn, transform: `translateY(${(1 - sourceIn) * 16}px)` }}>
          <div style={{ color: accent(p, pal), fontFamily: MONO, fontSize: 18, letterSpacing: "0.16em" }}>SOURCE REVEALED</div>
          <div style={{ marginTop: 15, color: pal.text, fontFamily: SANS, fontSize: 26, fontWeight: 700 }}>{p.author}</div>
          <div style={{ marginTop: 6, color: pal.secondary, fontFamily: SANS, fontSize: 20 }}>{p.source}{p.citation ? ` · ${p.citation}` : ""}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const QuoteUnderline: React.FC<{ p: QuoteCardsPremiumProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const target = p.emphasisWord?.trim() || words(p.quote)[Math.max(0, Math.floor(words(p.quote).length / 2))] || "idea";
  const chunks = p.quote.split(new RegExp(`(${target.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")})`, "i"));
  const underline = clampInterp(frame, [38, 62], [0, 1]);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 140 }}>
      <div style={{ maxWidth: 1450, textAlign: "center", color: pal.text, fontFamily: SERIF, fontSize: 72, lineHeight: 1.25 }}>
        “{chunks.map((chunk, i) => chunk.toLowerCase() === target.toLowerCase() ? <span key={i} style={{ position: "relative", color: accent(p, pal) }}>{chunk}<span style={{ position: "absolute", left: 0, right: 0, bottom: -7, height: 5, background: accent(p, pal), transformOrigin: "left", transform: `scaleX(${underline})` }} /></span> : <React.Fragment key={i}>{chunk}</React.Fragment>)}”
      </div>
      <div style={{ marginTop: 60, color: pal.secondary, fontFamily: SANS, fontSize: 22, opacity: clampInterp(frame, [62, 78], [0, 1]) }}>— {p.author}, {p.source}</div>
    </AbsoluteFill>
  );
};

const LongformPullquote: React.FC<{ p: QuoteCardsPremiumProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const body = p.body || "A considered sentence can carry a room. Let the words breathe, then let the source make them matter.";
  const inProgress = clampInterp(frame, [10, 32], [0, 1]);
  const quoteSize = p.quote.length > 110 ? 42 : p.quote.length > 78 ? 50 : 56;
  return (
    <AbsoluteFill style={{ padding: "88px 150px", boxSizing: "border-box", overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)", height: "100%", minWidth: 0, alignItems: "center", gap: 64 }}>
        <div style={{ minWidth: 0, borderTop: `3px solid ${accent(p, pal)}`, paddingTop: 26, opacity: inProgress }}>
          <div style={{ color: accent(p, pal), fontFamily: MONO, fontSize: 17, letterSpacing: "0.15em" }}>PULL QUOTE</div>
          <div style={{ maxWidth: "100%", overflowWrap: "break-word", marginTop: 26, color: pal.text, fontFamily: SERIF, fontSize: quoteSize, lineHeight: 1.16 }}>“{p.quote}”</div>
          <div style={{ marginTop: 32, color: pal.secondary, fontFamily: SANS, fontSize: 20 }}>{p.author}<br />{p.source}</div>
        </div>
        <div style={{ minWidth: 0, borderLeft: `1px solid ${pal.text}38`, paddingLeft: 64, color: pal.secondary, fontFamily: SERIF, fontSize: 28, lineHeight: 1.5, overflowWrap: "break-word", opacity: clampInterp(frame, [28, 52], [0, 1]) }}>
          {body}
          <div style={{ marginTop: 24, color: `${pal.secondary}99`, fontFamily: MONO, fontSize: 16, lineHeight: 1.4 }}>{p.citation || "A considered source, carried with care."}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const QuoteToLogo: React.FC<{ p: QuoteCardsPremiumProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const quoteOut = clampInterp(frame, [10, 40, 80], [0, 1, 0]);
  const logoIn = clampInterp(frame, [65, 95], [0, 1]);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: pal.bg }}>
      <div style={{ position: "absolute", width: "76%", textAlign: "center", opacity: quoteOut, transform: `translateY(${(1 - quoteOut) * -18}px)` }}>
        <div style={{ color: pal.text, fontFamily: SERIF, fontSize: 68, lineHeight: 1.22 }}>“{p.quote}”</div>
        <div style={{ marginTop: 34, color: pal.secondary, fontFamily: SANS, fontSize: 21 }}>{p.author} · {p.source}</div>
      </div>
      <div style={{ opacity: logoIn, transform: `scale(${0.82 + logoIn * 0.18})`, textAlign: "center" }}>
        {p.logoUrl ? <img src={p.logoUrl} alt="" style={{ maxWidth: 330, maxHeight: 150, objectFit: "contain" }} /> : <div style={{ color: pal.text, fontFamily: SANS, fontSize: 64, fontWeight: 800, letterSpacing: "-0.06em" }}>{p.source || "STUDIO"}</div>}
        <div style={{ width: 90, height: 4, margin: "25px auto 0", background: accent(p, pal) }} />
      </div>
    </AbsoluteFill>
  );
};

const VARIANTS: Record<QuoteCardsPremiumVariant, React.FC<{ p: QuoteCardsPremiumProps; pal: Palette }>> = {
  "kinetic-quote": KineticQuote,
  "paper-quote": PaperQuote,
  "typewriter-quote": TypewriterQuote,
  "split-quote": SplitQuote,
  "quote-over-photo": QuoteOverPhoto,
  "quote-wall": QuoteWall,
  "source-reveal": SourceReveal,
  "quote-underline": QuoteUnderline,
  "longform-pullquote": LongformPullquote,
  "quote-to-logo": QuoteToLogo,
};

export const QuoteCardsPremiumTemplate: React.FC<QuoteCardsPremiumProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? KineticQuote;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return (
    <AbsoluteFill style={{ fontFamily: SANS }}>
      <Backdrop pal={pal} p={props} />
      <FadeEdges inFrames={8} outFrames={12}>
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><Variant p={props} pal={pal} /></div>
      </FadeEdges>
    </AbsoluteFill>
  );
};

const familyCast = (component: React.FC<QuoteCardsPremiumProps>) =>
  component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "quote-cards-premium-kinetic-quote": familyCast(QuoteCardsPremiumTemplate),
  "quote-cards-premium-paper-quote": familyCast(QuoteCardsPremiumTemplate),
  "quote-cards-premium-typewriter-quote": familyCast(QuoteCardsPremiumTemplate),
  "quote-cards-premium-split-quote": familyCast(QuoteCardsPremiumTemplate),
  "quote-cards-premium-quote-over-photo": familyCast(QuoteCardsPremiumTemplate),
  "quote-cards-premium-quote-wall": familyCast(QuoteCardsPremiumTemplate),
  "quote-cards-premium-source-reveal": familyCast(QuoteCardsPremiumTemplate),
  "quote-cards-premium-quote-underline": familyCast(QuoteCardsPremiumTemplate),
  "quote-cards-premium-longform-pullquote": familyCast(QuoteCardsPremiumTemplate),
  "quote-cards-premium-quote-to-logo": familyCast(QuoteCardsPremiumTemplate),
};
