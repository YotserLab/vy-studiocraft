import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, clampInterp, resolvePalette, type Palette } from "../lib/primitives";

/**
 * FAMILY: editorial-headlines
 * Magazine and newspaper-inspired headline systems for editorial explainers.
 */
type EditorialVariant =
  | "headline-stack"
  | "section-break"
  | "pull-quote"
  | "source-card"
  | "five-stories"
  | "editorial-cover"
  | "breaking-strip"
  | "opinion-frame"
  | "fact-check"
  | "closing-index";

export interface EditorialHeadlinesProps {
  variant: EditorialVariant;
  headline: string;
  subhead: string;
  source: string;
  section: string;
  paletteName: string;
  stories?: string[];
  imageUrls?: string[];
  accentColor?: string;
  timestamp?: string;
  author?: string;
  body?: string;
  pullQuote?: string;
}

const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = 'Arial, "Helvetica Neue", sans-serif';
const CONDENSED = 'Impact, "Arial Narrow", Arial, sans-serif';

const items = (values: string[] | undefined, fallback: string): string[] => {
  const source = values && values.length > 0 ? values : [fallback];
  return source.flatMap((value) => value.split("|").map((part) => part.trim())).filter(Boolean);
};

// Keep editorial defaults expressive while ensuring arbitrary agent-supplied copy has a
// usable size at the fixed 1920×1080 composition. Text still wraps inside its reserved
// column; this only reduces the display size as copy gets longer.
const fitFontSize = (text: string | undefined, maximum: number, minimum: number, idealCharsPerLine: number): number => {
  const length = Math.max(1, (text ?? "").trim().length);
  // Linear sizing is deliberately conservative: a long headline should wrap into
  // two readable lines, not keep a display size that pushes the next block off-frame.
  return Math.max(minimum, Math.min(maximum, Math.round(maximum * idealCharsPerLine / length)));
};

const safeText: React.CSSProperties = { overflowWrap: "anywhere", wordBreak: "break-word" };

const Rule: React.FC<{ pal: Palette; color?: string; vertical?: boolean }> = ({ pal, color, vertical }) => (
  <div
    style={{
      background: color ?? `${pal.text}55`,
      width: vertical ? 1 : "100%",
      height: vertical ? "100%" : 2,
      transformOrigin: vertical ? "top" : "left",
    }}
  />
);

const Backdrop: React.FC<{
  pal: Palette;
  dark?: boolean;
  image?: string;
  accent?: string;
  children?: React.ReactNode;
}> = ({ pal, dark = false, image, accent, children }) => {
  const frame = useCurrentFrame();
  const base = dark ? "#101217" : pal.bg === "#0a0a12" ? "#f7f3ed" : pal.bg;
  const text = dark ? "#f8f4ee" : pal.text;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: base, color: text, fontFamily: SERIF }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: image
            ? `linear-gradient(90deg, ${base}ee 0%, ${base}88 48%, transparent 100%), url(${image})`
            : `radial-gradient(circle at 82% 15%, ${(accent ?? pal.accent)}22, transparent 30%), repeating-linear-gradient(0deg, transparent 0 43px, ${text}08 44px)`,
          backgroundSize: image ? "cover" : undefined,
          backgroundPosition: image ? "center" : undefined,
          opacity: image ? 0.7 : 1,
        }}
      />
      <div style={{ position: "absolute", inset: 0, opacity: 0.08, transform: `translateX(${(frame % 28) - 28}px)`, backgroundImage: `linear-gradient(90deg, ${text} 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />
      {children}
    </AbsoluteFill>
  );
};

const Masthead: React.FC<{ p: EditorialHeadlinesProps; pal: Palette; dark?: boolean }> = ({ p, pal, dark = false }) => {
  const color = dark ? "#f8f4ee" : pal.text;
  return (
    <div style={{ position: "absolute", left: 92, right: 92, top: 56, color, fontFamily: SANS }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 17, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase" }}>
        <span>{p.section}</span>
        <span style={{ opacity: 0.6 }}>{p.timestamp ?? "VOL. 04 · NO. 12"}</span>
      </div>
      <div style={{ marginTop: 18 }}><Rule pal={{ ...pal, text: color }} color={`${color}77`} /></div>
    </div>
  );
};

const HeadlineStack: React.FC<{ p: EditorialHeadlinesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const rise = clampInterp(frame, [4, 26], [90, 0]);
  return (
    <Backdrop pal={pal} image={p.imageUrls?.[0]} accent={p.accentColor}>
      <Masthead p={p} pal={pal} />
      <div style={{ position: "absolute", left: 92, top: 132, width: 1080, maxWidth: "calc(100% - 184px)", transform: `translateY(${rise}px)`, opacity: clampInterp(frame, [4, 20], [0, 1]) }}>
        <div style={{ color: p.accentColor ?? pal.accent, font: `700 22px ${SANS}`, letterSpacing: "0.23em", textTransform: "uppercase", ...safeText }}>{p.source}</div>
        <div style={{ marginTop: 25, maxWidth: 1040, font: `700 ${fitFontSize(p.headline, 92, 46, 18)}px/0.94 ${SERIF}`, letterSpacing: "-0.055em", ...safeText }}>{p.headline}</div>
        <div style={{ marginTop: 30, maxWidth: 780, font: `400 ${fitFontSize(p.subhead, 32, 23, 58)}px/1.25 ${SERIF}`, color: `${pal.text}bb`, ...safeText }}>{p.subhead}</div>
      </div>
      <div style={{ position: "absolute", left: 92, right: 92, bottom: 82 }}><Rule pal={pal} color={p.accentColor ?? pal.accent} /></div>
    </Backdrop>
  );
};

const SectionBreak: React.FC<{ p: EditorialHeadlinesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const sweep = clampInterp(frame, [5, 34], [-55, 0]);
  return (
    <Backdrop pal={pal} dark image={p.imageUrls?.[0]} accent={p.accentColor}>
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(120deg, ${pal.primary}cc, transparent 60%)` }} />
      <div style={{ position: "absolute", left: 120, top: 145, color: pal.accent, font: `700 24px ${SANS}`, letterSpacing: "0.28em", textTransform: "uppercase" }}>{p.source}</div>
      <div style={{ position: "absolute", left: 110, top: 250, transform: `translateX(${sweep}%)`, width: 1450, maxWidth: "calc(100% - 220px)" }}>
        <div style={{ color: "#fff", font: `900 ${fitFontSize(p.section, 178, 88, 10)}px/0.84 ${CONDENSED}`, letterSpacing: "-0.025em", textTransform: "uppercase", ...safeText }}>{p.section}</div>
        <div style={{ marginTop: 34, width: 210, height: 10, background: p.accentColor ?? pal.accent }} />
        <div style={{ marginTop: 26, maxWidth: 980, color: "#ffffffcc", font: `400 ${fitFontSize(p.subhead, 34, 24, 58)}px/1.25 ${SERIF}`, ...safeText }}>{p.subhead}</div>
      </div>
      <div style={{ position: "absolute", right: 120, bottom: 88, color: "#fff", font: `700 20px ${SANS}`, letterSpacing: "0.18em" }}>{p.timestamp ?? "EDITORIAL / 01"}</div>
    </Backdrop>
  );
};

const PullQuote: React.FC<{ p: EditorialHeadlinesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const scale = clampInterp(frame, [8, 30], [0.84, 1]);
  return (
    <Backdrop pal={pal} dark={false} image={p.imageUrls?.[0]} accent={p.accentColor}>
      <Masthead p={p} pal={pal} />
      <div style={{ position: "absolute", left: 150, top: 190, width: 820, maxWidth: "calc(100% - 300px)", transform: `scale(${scale})`, transformOrigin: "left top", opacity: clampInterp(frame, [8, 24], [0, 1]) }}>
        <div style={{ color: p.accentColor ?? pal.accent, font: `900 126px/0.5 ${SERIF}` }}>“</div>
        <div style={{ marginTop: -4, maxWidth: 920, font: `italic 700 ${fitFontSize(p.pullQuote ?? p.headline, 74, 42, 26)}px/1.08 ${SERIF}`, letterSpacing: "-0.035em", ...safeText }}>{p.pullQuote ?? p.headline}</div>
        <div style={{ marginTop: 34, display: "flex", alignItems: "center", gap: 18, font: `700 20px ${SANS}`, letterSpacing: "0.15em", textTransform: "uppercase", ...safeText }}><span style={{ width: 65, height: 3, background: p.accentColor ?? pal.accent, flexShrink: 0 }} />{p.author ?? p.source}</div>
      </div>
      <div style={{ position: "absolute", right: 90, bottom: 62, width: 450, maxHeight: 150, zIndex: 2, overflow: "hidden", padding: "18px 20px", boxSizing: "border-box", background: pal.bg, borderTop: `2px solid ${p.accentColor ?? pal.accent}`, font: `400 ${fitFontSize(p.body ?? p.subhead, 25, 19, 48)}px/1.35 ${SERIF}`, color: `${pal.text}99`, ...safeText }}>{p.body ?? p.subhead}</div>
    </Backdrop>
  );
};

const SourceCard: React.FC<{ p: EditorialHeadlinesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const progress = clampInterp(frame, [6, 28], [0, 1]);
  return (
    <Backdrop pal={pal} dark image={p.imageUrls?.[0]} accent={p.accentColor}>
      <div style={{ position: "absolute", left: 105, top: 106, color: pal.accent, font: `700 18px ${SANS}`, letterSpacing: "0.3em", textTransform: "uppercase" }}>SOURCE / {p.source}</div>
      <div style={{ position: "absolute", left: 105, top: 172, width: 1180, maxWidth: "calc(100% - 210px)", boxSizing: "border-box", padding: "34px 46px", border: `1px solid #ffffff66`, background: "#0d1014dd", transform: `translateY(${(1 - progress) * 80}px)`, opacity: progress }}>
        <div style={{ color: "#ffffff88", font: `700 17px ${SANS}`, letterSpacing: "0.2em", textTransform: "uppercase", ...safeText }}>{p.timestamp ?? "DOCUMENTED / VERIFIED"}</div>
        <div style={{ marginTop: 22, maxWidth: 1060, font: `700 ${fitFontSize(p.headline, 82, 44, 22)}px/1.04 ${SERIF}`, ...safeText }}>{p.headline}</div>
        <div style={{ marginTop: 26, maxWidth: 1000, font: `400 ${fitFontSize(p.subhead, 30, 22, 54)}px/1.35 ${SERIF}`, color: "#ffffffbb", ...safeText }}>{p.subhead}</div>
        <div style={{ marginTop: 30, display: "flex", gap: 28, alignItems: "center", color: pal.accent, font: `700 20px ${SANS}`, ...safeText }}><span style={{ width: 52, height: 3, background: pal.accent, flexShrink: 0 }} />{p.source}</div>
      </div>
    </Backdrop>
  );
};

const FiveStories: React.FC<{ p: EditorialHeadlinesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const stories = items(p.stories, p.headline).slice(0, 5);
  return (
    <Backdrop pal={pal}>
      <Masthead p={p} pal={pal} />
      <div style={{ position: "absolute", left: 95, right: 95, top: 175 }}>
        <div style={{ font: `700 74px/0.95 ${SERIF}`, letterSpacing: "-0.04em" }}>{p.headline}</div>
        <div style={{ margin: "28px 0 20px" }}><Rule pal={pal} color={p.accentColor ?? pal.accent} /></div>
        {stories.map((story, i) => {
          const t = clampInterp(frame, [12 + i * 7, 28 + i * 7], [0, 1]);
          const [title, detail = p.section] = story.split("::");
          return <div key={`${title}-${i}`} style={{ display: "grid", gridTemplateColumns: "80px 1fr 240px", alignItems: "center", minHeight: 122, borderBottom: `1px solid ${pal.text}30`, opacity: t, transform: `translateX(${(1 - t) * 90}px)` }}><span style={{ color: p.accentColor ?? pal.accent, font: `700 25px ${SANS}` }}>{String(i + 1).padStart(2, "0")}</span><span style={{ font: `700 34px ${SERIF}` }}>{title}</span><span style={{ justifySelf: "end", color: `${pal.text}88`, font: `700 16px ${SANS}`, letterSpacing: "0.14em", textTransform: "uppercase" }}>{detail}</span></div>;
        })}
      </div>
    </Backdrop>
  );
};

const EditorialCover: React.FC<{ p: EditorialHeadlinesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const rotate = interpolate(clampInterp(frame, [4, 30], [0, 1]), [0, 1], [-4, 0]);
  return (
    <Backdrop pal={pal} image={p.imageUrls?.[0]} accent={p.accentColor}>
      <div style={{ position: "absolute", left: 100, top: 62, color: pal.text, font: `900 35px ${SANS}`, letterSpacing: "0.2em" }}>THE {p.section.toUpperCase()}</div>
      <div style={{ position: "absolute", left: 100, top: 94, width: 1350, maxWidth: "calc(100% - 200px)", transform: `rotate(${rotate}deg)`, transformOrigin: "left top" }}>
        <div style={{ color: p.accentColor ?? pal.accent, font: `900 24px ${SANS}`, letterSpacing: "0.22em", textTransform: "uppercase", ...safeText }}>{p.source}</div>
        <div style={{ marginTop: 22, maxWidth: 1380, font: `900 ${fitFontSize(p.headline, 92, 44, 16)}px/0.92 ${SERIF}`, letterSpacing: "-0.07em", ...safeText }}>{p.headline}</div>
        <div style={{ marginTop: 30, maxWidth: 820, font: `400 ${fitFontSize(p.subhead, 32, 24, 58)}px/1.2 ${SERIF}`, ...safeText }}>{p.subhead}</div>
      </div>
      <div style={{ position: "absolute", left: 100, right: 100, bottom: 88, display: "flex", justifyContent: "space-between", font: `700 18px ${SANS}`, letterSpacing: "0.16em", textTransform: "uppercase" }}><span>{p.timestamp ?? "SPRING ISSUE"}</span><span>{p.author ?? "EDITORIAL DESK"}</span></div>
    </Backdrop>
  );
};

const BreakingStrip: React.FC<{ p: EditorialHeadlinesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, 120], [0, -500], { extrapolateLeft: "clamp", extrapolateRight: "extend" });
  return (
    <Backdrop pal={pal} dark>
      <div style={{ position: "absolute", top: 150, left: 0, right: 0, height: 210, display: "flex", alignItems: "center", background: p.accentColor ?? pal.accent, transform: `translateX(${clampInterp(frame, [4, 18], [-100, 0])}%)` }}>
        <div style={{ marginLeft: 95, color: "#fff", font: `900 55px ${SANS}`, letterSpacing: "0.18em", textTransform: "uppercase" }}>BREAKING</div>
      </div>
      <div style={{ position: "absolute", left: 95, top: 440, right: 95, overflow: "hidden" }}><div style={{ whiteSpace: "nowrap", transform: `translateX(${x}px)`, font: `900 122px/0.9 ${CONDENSED}`, textTransform: "uppercase" }}>{p.headline} &nbsp;—&nbsp; {p.headline}</div></div>
      <div style={{ position: "absolute", left: 100, bottom: 100, color: "#ffffffaa", font: `400 29px ${SERIF}` }}>{p.subhead} · {p.timestamp ?? "JUST NOW"}</div>
    </Backdrop>
  );
};

const OpinionFrame: React.FC<{ p: EditorialHeadlinesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const progress = clampInterp(frame, [5, 25], [0, 1]);
  return (
    <Backdrop pal={pal}>
      <div style={{ position: "absolute", left: 110, top: 90, color: p.accentColor ?? pal.accent, font: `900 20px ${SANS}`, letterSpacing: "0.24em", textTransform: "uppercase" }}>OPINION / {p.section}</div>
      <div style={{ position: "absolute", left: 110, top: 132, width: 1200, maxWidth: "calc(100% - 520px)", paddingLeft: 38, borderLeft: `10px solid ${p.accentColor ?? pal.accent}`, transform: `translateY(${(1 - progress) * 50}px)`, opacity: progress }}>
        <div style={{ maxWidth: 1160, font: `italic 700 ${fitFontSize(p.headline, 82, 42, 18)}px/1.04 ${SERIF}`, letterSpacing: "-0.05em", ...safeText }}>{p.headline}</div>
        <div style={{ marginTop: 30, maxWidth: 1080, font: `400 ${fitFontSize(p.body ?? p.subhead, 31, 22, 54)}px/1.35 ${SERIF}`, color: `${pal.text}aa`, ...safeText }}>{p.body ?? p.subhead}</div>
        <div style={{ marginTop: 32, font: `700 20px ${SANS}`, letterSpacing: "0.15em", textTransform: "uppercase", ...safeText }}>{p.author ?? p.source}</div>
      </div>
      <div style={{ position: "absolute", right: 130, bottom: 100, width: 230, height: 230, borderRadius: "50%", border: `2px solid ${pal.text}44`, display: "flex", alignItems: "center", justifyContent: "center", color: `${pal.text}77`, font: `700 17px ${SANS}`, letterSpacing: "0.15em", textAlign: "center" }}>COLUMN<br />{p.timestamp ?? "04"}</div>
    </Backdrop>
  );
};

const FactCheck: React.FC<{ p: EditorialHeadlinesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const verify = clampInterp(frame, [16, 36], [0, 1]);
  return (
    <Backdrop pal={pal} dark>
      <Masthead p={p} pal={pal} dark />
      <div style={{ position: "absolute", left: 110, top: 112, width: 1250, maxWidth: "calc(100% - 220px)" }}>
        <div style={{ color: pal.accent, font: `700 20px ${SANS}`, letterSpacing: "0.25em", textTransform: "uppercase", ...safeText }}>FACT CHECK / {p.source}</div>
        <div style={{ marginTop: 24, maxWidth: 1210, font: `700 ${fitFontSize(p.headline, 82, 44, 22)}px/1.04 ${SERIF}`, ...safeText }}>{p.headline}</div>
        <div style={{ marginTop: 28, maxWidth: 1160, maxHeight: 190, overflow: "hidden", padding: "26px 32px", boxSizing: "border-box", border: "1px solid #ffffff55", color: "#ffffffaa", font: `400 ${fitFontSize(p.body ?? p.subhead, 29, 22, 56)}px/1.35 ${SERIF}`, ...safeText }}>{p.body ?? p.subhead}</div>
        <div style={{ marginTop: 26, display: "flex", alignItems: "center", gap: 24, opacity: verify, transform: `scaleX(${verify})`, transformOrigin: "left" }}><div style={{ width: 86, height: 86, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: pal.accent, color: "#101217", font: `900 42px ${SANS}`, flexShrink: 0 }}>✓</div><div style={{ font: `900 31px ${SANS}`, letterSpacing: "0.16em", textTransform: "uppercase", ...safeText }}>SUPPORTED</div></div>
      </div>
    </Backdrop>
  );
};

const ClosingIndex: React.FC<{ p: EditorialHeadlinesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const stories = items(p.stories, p.headline).slice(0, 6);
  return (
    <Backdrop pal={pal}>
      <Masthead p={p} pal={pal} />
      <div style={{ position: "absolute", left: 95, right: 95, top: 175 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}><div style={{ font: `700 84px ${SERIF}`, letterSpacing: "-0.05em" }}>In this issue</div><div style={{ font: `700 18px ${SANS}`, letterSpacing: "0.2em", textTransform: "uppercase", color: p.accentColor ?? pal.accent }}>{p.timestamp ?? "INDEX"}</div></div>
        <div style={{ marginTop: 24 }}><Rule pal={pal} color={p.accentColor ?? pal.accent} /></div>
        {stories.map((story, i) => { const t = clampInterp(frame, [8 + i * 6, 22 + i * 6], [0, 1]); return <div key={`${story}-${i}`} style={{ display: "flex", alignItems: "baseline", gap: 30, padding: "22px 0", borderBottom: `1px solid ${pal.text}33`, opacity: t, transform: `translateY(${(1 - t) * 26}px)` }}><span style={{ color: p.accentColor ?? pal.accent, font: `700 19px ${SANS}` }}>{String(i + 1).padStart(2, "0")}</span><span style={{ font: `700 34px ${SERIF}` }}>{story}</span><span style={{ flex: 1, borderBottom: `1px dotted ${pal.text}44` }} /><span style={{ color: `${pal.text}88`, font: `700 18px ${SANS}` }}>{String(4 + i * 3).padStart(2, "0")}</span></div>; })}
      </div>
    </Backdrop>
  );
};

const VARIANTS: Record<EditorialVariant, React.FC<{ p: EditorialHeadlinesProps; pal: Palette }>> = {
  "headline-stack": HeadlineStack,
  "section-break": SectionBreak,
  "pull-quote": PullQuote,
  "source-card": SourceCard,
  "five-stories": FiveStories,
  "editorial-cover": EditorialCover,
  "breaking-strip": BreakingStrip,
  "opinion-frame": OpinionFrame,
  "fact-check": FactCheck,
  "closing-index": ClosingIndex,
};

export const EditorialHeadlinesTemplate: React.FC<EditorialHeadlinesProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? HeadlineStack;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <FadeEdges inFrames={10} outFrames={12}><div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><Variant p={props} pal={pal} /></div></FadeEdges>;
};

const familyCast = (component: React.FC<EditorialHeadlinesProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "editorial-headlines-headline-stack": familyCast(EditorialHeadlinesTemplate),
  "editorial-headlines-section-break": familyCast(EditorialHeadlinesTemplate),
  "editorial-headlines-pull-quote": familyCast(EditorialHeadlinesTemplate),
  "editorial-headlines-source-card": familyCast(EditorialHeadlinesTemplate),
  "editorial-headlines-five-stories": familyCast(EditorialHeadlinesTemplate),
  "editorial-headlines-editorial-cover": familyCast(EditorialHeadlinesTemplate),
  "editorial-headlines-breaking-strip": familyCast(EditorialHeadlinesTemplate),
  "editorial-headlines-opinion-frame": familyCast(EditorialHeadlinesTemplate),
  "editorial-headlines-fact-check": familyCast(EditorialHeadlinesTemplate),
  "editorial-headlines-closing-index": familyCast(EditorialHeadlinesTemplate),
};
