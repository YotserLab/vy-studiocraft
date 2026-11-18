import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  NoiseGrainOverlay,
  clampInterp,
  easeInOutQuint,
  easeOutExpo,
  resolvePalette,
  seededRand,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: title-cards
 * Ten restrained title systems for film, documentary, episodic, and auteur work.
 * Motion is deliberately curve-driven: long reveals, quiet holds, and composed exits.
 */

type TitleCardVariant =
  | "centered-serif"
  | "indie-credits"
  | "letterboxed"
  | "chapter-roman"
  | "documentary-profile"
  | "arthouse-vertical"
  | "scifi-scanline"
  | "period-ornament"
  | "streaming-stack"
  | "auteur-minimal";

export interface TitleCardProps {
  variant: TitleCardVariant;
  title: string;
  subtitle: string;
  credit: string;
  paletteName: string;
}

const SERIF = 'Georgia, "Times New Roman", Times, serif';
const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const MONO = '"SFMono-Regular", Menlo, Consolas, monospace';

const curved = (
  frame: number,
  start: number,
  end: number,
  curve: readonly [number, number, number, number] = easeOutExpo,
): number =>
  interpolate(frame, [start, end], [0, 1], {
    easing: Easing.bezier(...curve),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const useTimeline = (enterEnd = 38, exitFrames = 30) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const enter = curved(frame, 2, enterEnd);
  const exit = curved(frame, durationInFrames - exitFrames, durationInFrames, easeInOutQuint);
  const presence = enter * (1 - exit);
  const drift = clampInterp(frame, [0, durationInFrames], [0, 1]);
  return { frame, durationInFrames, width, height, enter, exit, presence, drift };
};

const FilmField: React.FC<{ palette: Palette; quiet?: boolean }> = ({ palette, quiet = false }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const drift = clampInterp(frame, [0, durationInFrames], [0, 1]);
  return (
    <AbsoluteFill style={{ backgroundColor: palette.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: [
            `radial-gradient(circle at ${24 + drift * 4}% ${28 - drift * 3}%, ${palette.primary}${quiet ? "0d" : "18"}, transparent 42%)`,
            `radial-gradient(circle at ${78 - drift * 3}% ${72 + drift * 2}%, ${palette.accent}${quiet ? "08" : "10"}, transparent 38%)`,
            `linear-gradient(145deg, ${palette.bg}, ${palette.bgAlt ?? palette.bg} 58%, ${palette.bg})`,
          ].join(", "),
          transform: `scale(${1.025 + drift * 0.018})`,
        }}
      />
      {Array.from({ length: quiet ? 8 : 18 }, (_, i) => {
        const x = seededRand(i * 5 + 1) * 100;
        const y = seededRand(i * 5 + 2) * 100;
        const size = 0.8 + seededRand(i * 5 + 3) * 1.7;
        const alpha = 0.08 + seededRand(i * 5 + 4) * 0.15;
        const float = Math.sin(frame * 0.012 + seededRand(i * 5 + 5) * 6.28) * 5;
        return (
          <div
            key={`dust-${i}`}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              borderRadius: "50%",
              background: palette.text,
              opacity: alpha,
              transform: `translateY(${float}px)`,
            }}
          />
        );
      })}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 42%, ${palette.bg}bb 112%)`,
        }}
      />
      <NoiseGrainOverlay opacity={quiet ? 0.025 : 0.045} />
    </AbsoluteFill>
  );
};

const Hairline: React.FC<{
  color: string;
  progress: number;
  width?: number | string;
  vertical?: boolean;
}> = ({ color, progress, width = 220, vertical = false }) => (
  <div
    style={{
      width: vertical ? 1 : width,
      height: vertical ? width : 1,
      background: color,
      transform: vertical ? `scaleY(${progress})` : `scaleX(${progress})`,
      transformOrigin: vertical ? "top" : "left",
    }}
  />
);

// 01 — centered serif drama with expanding tracking
const CenteredSerif: React.FC<{ p: TitleCardProps; pal: Palette }> = ({ p, pal }) => {
  const t = useTimeline(42, 34);
  const titleIn = curved(t.frame, 7, 42);
  const metaIn = curved(t.frame, 24, 50);
  const tracking = interpolate(titleIn, [0, 1], [0.34, 0.095]);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", color: pal.text, opacity: t.presence }}>
      <div
        style={{
          width: "78%",
          textAlign: "center",
          transform: `translateY(${(1 - titleIn) * 42 - t.exit * 18}px) scale(${0.985 + titleIn * 0.015 + t.drift * 0.012})`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 28, opacity: metaIn * (1 - t.exit) }}>
          <Hairline color={`${pal.secondary}88`} progress={metaIn} width={110} />
          <div style={{ fontFamily: SANS, fontSize: 18, letterSpacing: "0.38em", textTransform: "uppercase", color: pal.secondary }}>
            {p.subtitle}
          </div>
          <div style={{ transform: "scaleX(-1)" }}><Hairline color={`${pal.secondary}88`} progress={metaIn} width={110} /></div>
        </div>
        <div style={{ overflow: "hidden", marginTop: 34, padding: "0.08em 0.2em 0.16em" }}>
          <div
            style={{
              fontFamily: SERIF,
              fontSize: Math.min(t.width * 0.093, 174),
              lineHeight: 0.96,
              fontWeight: 400,
              letterSpacing: `${tracking}em`,
              textTransform: "uppercase",
              opacity: titleIn,
              transform: `translateY(${(1 - titleIn) * 105}%)`,
              textShadow: `0 18px 60px ${pal.bg}`,
            }}
          >
            {p.title}
          </div>
        </div>
        <div style={{ marginTop: 44, fontFamily: SERIF, fontSize: 20, fontStyle: "italic", letterSpacing: "0.15em", color: `${pal.text}b8`, opacity: metaIn }}>
          {p.credit}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 02 — asymmetrical independent-film credit block
const IndieCredits: React.FC<{ p: TitleCardProps; pal: Palette }> = ({ p, pal }) => {
  const t = useTimeline(40, 32);
  const words = p.title.split(/\s+/);
  return (
    <AbsoluteFill style={{ color: pal.text, opacity: 1 - t.exit }}>
      <div style={{ position: "absolute", left: "10.5%", top: "13%", display: "flex", gap: 34, height: "72%" }}>
        <Hairline color={pal.accent} progress={curved(t.frame, 4, 46) * (1 - t.exit)} width="100%" vertical />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: t.width * 0.57 }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 17,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: pal.secondary,
              opacity: curved(t.frame, 12, 36),
              transform: `translateX(${(1 - curved(t.frame, 12, 36)) * -24}px)`,
            }}
          >
            {p.subtitle}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            {words.map((word, i) => {
              const cue = curved(t.frame, 11 + i * 6, 43 + i * 6);
              return (
                <div key={`${word}-${i}`} style={{ overflow: "hidden", paddingRight: "0.08em" }}>
                  <div
                    style={{
                      fontFamily: SANS,
                      fontSize: Math.min(t.width * 0.075, 136),
                      lineHeight: 0.87,
                      fontWeight: 300,
                      letterSpacing: "-0.045em",
                      transform: `translateY(${(1 - cue) * 108}%)`,
                      opacity: cue,
                    }}
                  >
                    {word}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 16, lineHeight: 1.7, letterSpacing: "0.12em", color: `${pal.text}ad`, opacity: curved(t.frame, 35, 60) }}>
            {p.credit}
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: "6%",
          top: "50%",
          fontFamily: MONO,
          fontSize: 12,
          letterSpacing: "0.4em",
          color: `${pal.secondary}88`,
          writingMode: "vertical-rl",
          transform: `translateY(-50%) translateX(${t.exit * 24}px)`,
          opacity: t.presence,
        }}
      >
        AN INDEPENDENT PICTURE
      </div>
    </AbsoluteFill>
  );
};

// 03 — widescreen letterbox with optical zoom
const Letterboxed: React.FC<{ p: TitleCardProps; pal: Palette }> = ({ p, pal }) => {
  const t = useTimeline(46, 38);
  const titleIn = curved(t.frame, 12, 50);
  const barsIn = curved(t.frame, 0, 32, easeInOutQuint);
  const barHeight = 116 * barsIn + 76 * t.exit;
  return (
    <AbsoluteFill style={{ color: pal.text, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 44%, ${pal.primary}22, transparent 54%)`,
          transform: `scale(${1.08 - t.drift * 0.055 + t.exit * 0.025})`,
          opacity: 1 - t.exit * 0.65,
        }}
      />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: t.presence }}>
        <div style={{ textAlign: "center", transform: `scale(${0.94 + titleIn * 0.06 + t.drift * 0.035})`, filter: `blur(${(1 - titleIn) * 7 + t.exit * 5}px)` }}>
          <div style={{ fontFamily: SANS, fontSize: 16, letterSpacing: "0.55em", textTransform: "uppercase", color: pal.secondary, opacity: curved(t.frame, 25, 52) }}>
            {p.subtitle}
          </div>
          <div
            style={{
              marginTop: 24,
              fontFamily: SERIF,
              fontSize: Math.min(t.width * 0.086, 158),
              fontWeight: 400,
              letterSpacing: "0.025em",
              lineHeight: 1,
              textShadow: `0 20px 70px ${pal.bg}`,
            }}
          >
            {p.title}
          </div>
          <div style={{ marginTop: 34, fontFamily: SANS, fontSize: 15, letterSpacing: "0.31em", textTransform: "uppercase", color: `${pal.text}a8`, opacity: curved(t.frame, 38, 62) }}>
            {p.credit}
          </div>
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", inset: "0 0 auto", height: barHeight, background: "#000", transform: `translateY(${(1 - barsIn) * -120}px)` }} />
      <div style={{ position: "absolute", inset: "auto 0 0", height: barHeight, background: "#000", transform: `translateY(${(1 - barsIn) * 120}px)` }} />
    </AbsoluteFill>
  );
};

// 04 — chapter card led by a monumental roman numeral / chapter credit
const ChapterRoman: React.FC<{ p: TitleCardProps; pal: Palette }> = ({ p, pal }) => {
  const t = useTimeline(44, 34);
  const numeralIn = curved(t.frame, 4, 48);
  const copyIn = curved(t.frame, 22, 56);
  return (
    <AbsoluteFill style={{ color: pal.text, opacity: 1 - t.exit }}>
      <div
        style={{
          position: "absolute",
          left: "9%",
          top: "8%",
          fontFamily: SERIF,
          fontSize: Math.min(t.height * 0.7, 690),
          lineHeight: 1,
          color: "transparent",
          WebkitTextStroke: `1px ${pal.primary}55`,
          opacity: numeralIn * 0.72,
          transform: `translateX(${(1 - numeralIn) * -70}px) scale(${1.045 - numeralIn * 0.045 + t.drift * 0.012})`,
          transformOrigin: "left center",
          whiteSpace: "nowrap",
        }}
      >
        {p.credit}
      </div>
      <div style={{ position: "absolute", right: "9%", top: "26%", width: "48%", transform: `translateY(${(1 - copyIn) * 48 - t.exit * 28}px)`, opacity: copyIn * (1 - t.exit) }}>
        <div style={{ fontFamily: SANS, fontSize: 16, letterSpacing: "0.52em", textTransform: "uppercase", color: pal.accent }}>
          {p.subtitle}
        </div>
        <div style={{ margin: "30px 0 32px" }}><Hairline color={`${pal.text}75`} progress={copyIn} width="100%" /></div>
        <div style={{ fontFamily: SERIF, fontSize: Math.min(t.width * 0.07, 128), lineHeight: 0.98, letterSpacing: "0.015em" }}>
          {p.title}
        </div>
        <div style={{ marginTop: 38, fontFamily: MONO, fontSize: 13, letterSpacing: "0.28em", textTransform: "uppercase", color: `${pal.secondary}b8` }}>
          A CHAPTER IN MOTION
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 05 — low-profile documentary identification card
const DocumentaryProfile: React.FC<{ p: TitleCardProps; pal: Palette }> = ({ p, pal }) => {
  const t = useTimeline(35, 28);
  const rule = curved(t.frame, 7, 42);
  const copy = curved(t.frame, 18, 48);
  return (
    <AbsoluteFill style={{ color: pal.text }}>
      <div style={{ position: "absolute", left: "7%", right: "7%", bottom: "12%", opacity: t.presence, transform: `translateY(${(1 - copy) * 42 + t.exit * 28}px)` }}>
        <Hairline color={`${pal.text}70`} progress={rule * (1 - t.exit)} width="100%" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", columnGap: 70, marginTop: 24, alignItems: "end" }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 14, letterSpacing: "0.3em", textTransform: "uppercase", color: pal.accent, opacity: curved(t.frame, 12, 38) }}>
              {p.subtitle}
            </div>
            <div style={{ marginTop: 15, fontFamily: SANS, fontSize: Math.min(t.width * 0.054, 98), fontWeight: 500, lineHeight: 1.02, letterSpacing: "-0.025em" }}>
              {p.title}
            </div>
          </div>
          <div style={{ paddingBottom: 7, textAlign: "right", fontFamily: MONO, fontSize: 15, lineHeight: 1.7, letterSpacing: "0.12em", color: `${pal.text}a8` }}>
            {p.credit}
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", top: "7%", right: "5%", fontFamily: MONO, fontSize: 11, letterSpacing: "0.25em", color: `${pal.secondary}70`, opacity: t.presence }}>
        REC / {String(Math.floor(t.frame / 30)).padStart(2, "0")}:00
      </div>
    </AbsoluteFill>
  );
};

// 06 — art-house vertical title column and negative-space geometry
const ArthouseVertical: React.FC<{ p: TitleCardProps; pal: Palette }> = ({ p, pal }) => {
  const t = useTimeline(48, 36);
  const circleIn = curved(t.frame, 2, 52);
  const titleIn = curved(t.frame, 14, 58);
  return (
    <AbsoluteFill style={{ color: pal.text, opacity: 1 - t.exit }}>
      <div
        style={{
          position: "absolute",
          width: t.height * 0.66,
          height: t.height * 0.66,
          borderRadius: "50%",
          border: `1px solid ${pal.primary}55`,
          left: "37%",
          top: "17%",
          transform: `scale(${0.72 + circleIn * 0.28 + t.drift * 0.025})`,
          opacity: circleIn * (1 - t.exit),
        }}
      />
      <div style={{ position: "absolute", left: "14%", top: "10%", bottom: "10%", display: "flex", alignItems: "flex-start", gap: 28 }}>
        <div style={{ height: "100%", overflow: "hidden" }}>
          <div
            style={{
              fontFamily: SERIF,
              fontSize: Math.min(t.width * 0.058, 108),
              lineHeight: 0.9,
              letterSpacing: "0.09em",
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              transform: `translateY(${(1 - titleIn) * -100}%)`,
              opacity: titleIn * (1 - t.exit),
            }}
          >
            {p.title}
          </div>
        </div>
        <Hairline color={pal.accent} progress={titleIn * (1 - t.exit)} width="100%" vertical />
      </div>
      <div style={{ position: "absolute", left: "48%", top: "43%", width: "37%", opacity: curved(t.frame, 28, 62) * (1 - t.exit), transform: `translateX(${(1 - curved(t.frame, 28, 62)) * 34}px)` }}>
        <div style={{ fontFamily: SANS, fontSize: 18, lineHeight: 1.6, letterSpacing: "0.18em", textTransform: "uppercase", color: pal.secondary }}>
          {p.subtitle}
        </div>
        <div style={{ marginTop: 28, fontFamily: MONO, fontSize: 13, letterSpacing: "0.25em", color: `${pal.text}99` }}>
          {p.credit}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 07 — thin-cap science-fiction card with scanning luminance
const ScifiScanline: React.FC<{ p: TitleCardProps; pal: Palette }> = ({ p, pal }) => {
  const t = useTimeline(34, 30);
  const letters = p.title.toUpperCase().split("");
  const lineIn = curved(t.frame, 3, 40);
  const scanX = ((t.frame * 3.2) % (t.width + 420)) - 210;
  return (
    <AbsoluteFill style={{ color: pal.text, overflow: "hidden" }}>
      {Array.from({ length: 9 }, (_, i) => (
        <div key={`scan-${i}`} style={{ position: "absolute", left: 0, right: 0, top: `${12 + i * 9.5}%`, height: 1, background: pal.primary, opacity: 0.055 * lineIn }} />
      ))}
      <div style={{ position: "absolute", left: "7%", right: "7%", top: "50%", transform: `translateY(-50%) translateX(${-t.exit * 26}px)`, opacity: 1 - t.exit }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28, opacity: curved(t.frame, 8, 34) }}>
          <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.4em", color: pal.secondary }}>SEQUENCE / {p.credit}</div>
          <Hairline color={`${pal.primary}80`} progress={lineIn} width="100%" />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", whiteSpace: "pre" }}>
          {letters.map((letter, i) => {
            const cue = curved(t.frame, 10 + i * 1.5, 38 + i * 1.5);
            return (
              <span
                key={`${letter}-${i}`}
                style={{
                  fontFamily: SANS,
                  fontSize: Math.min(t.width * 0.064, 116),
                  fontWeight: 200,
                  letterSpacing: "0.03em",
                  color: letter === " " ? "transparent" : pal.text,
                  opacity: letter === " " ? 0 : cue * (1 - t.exit),
                  transform: `translateY(${(1 - cue) * 24}px)`,
                  textShadow: `0 0 24px ${pal.primary}55`,
                }}
              >
                {letter === " " ? "·" : letter}
              </span>
            );
          })}
        </div>
        <div style={{ marginTop: 32, display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 13, letterSpacing: "0.28em", textTransform: "uppercase", color: pal.accent, opacity: curved(t.frame, 32, 56) }}>
          <span>{p.subtitle}</span><span>STATUS / NOMINAL</span>
        </div>
      </div>
      <div style={{ position: "absolute", top: 0, bottom: 0, width: 280, left: scanX, background: `linear-gradient(90deg, transparent, ${pal.secondary}16, transparent)`, mixBlendMode: "screen", opacity: t.presence }} />
      <div style={{ position: "absolute", inset: 36, border: `1px solid ${pal.primary}25`, opacity: lineIn * (1 - t.exit) }} />
    </AbsoluteFill>
  );
};

// 08 — period-piece double frame and restrained ornament
const PeriodOrnament: React.FC<{ p: TitleCardProps; pal: Palette }> = ({ p, pal }) => {
  const t = useTimeline(50, 38);
  const frameIn = curved(t.frame, 2, 48, easeInOutQuint);
  const copyIn = curved(t.frame, 22, 60);
  const Corner: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
    <div style={{ position: "absolute", fontFamily: SERIF, fontSize: 30, color: pal.accent, opacity: frameIn, ...style }}>◆</div>
  );
  return (
    <AbsoluteFill style={{ color: pal.text, opacity: 1 - t.exit }}>
      <div style={{ position: "absolute", inset: 58, border: `1px solid ${pal.secondary}88`, transform: `scaleX(${frameIn})`, opacity: 1 - t.exit }} />
      <div style={{ position: "absolute", inset: 72, border: `1px solid ${pal.secondary}48`, transform: `scaleY(${frameIn})`, opacity: 1 - t.exit }} />
      <Corner style={{ left: 47, top: 41, transform: "rotate(45deg)" }} />
      <Corner style={{ right: 47, top: 41, transform: "rotate(135deg)" }} />
      <Corner style={{ left: 47, bottom: 41, transform: "rotate(-45deg)" }} />
      <Corner style={{ right: 47, bottom: 41, transform: "rotate(-135deg)" }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center", opacity: copyIn * (1 - t.exit), transform: `translateY(${(1 - copyIn) * 30 - t.exit * 18}px)` }}>
        <div style={{ fontFamily: SERIF, fontSize: 18, fontStyle: "italic", letterSpacing: "0.22em", color: pal.secondary }}>{p.subtitle}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, margin: "30px 0" }}>
          <Hairline color={`${pal.accent}88`} progress={copyIn} width={96} />
          <span style={{ color: pal.accent, fontSize: 18 }}>✦</span>
          <div style={{ transform: "scaleX(-1)" }}><Hairline color={`${pal.accent}88`} progress={copyIn} width={96} /></div>
        </div>
        <div style={{ maxWidth: "72%", fontFamily: SERIF, fontSize: Math.min(t.width * 0.075, 140), lineHeight: 0.98, letterSpacing: "0.025em", textShadow: `0 14px 50px ${pal.bg}` }}>
          {p.title}
        </div>
        <div style={{ marginTop: 42, fontFamily: SANS, fontSize: 14, letterSpacing: "0.4em", textTransform: "uppercase", color: `${pal.text}a8` }}>{p.credit}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 09 — contemporary streaming-series staggered stack
const StreamingStack: React.FC<{ p: TitleCardProps; pal: Palette }> = ({ p, pal }) => {
  const t = useTimeline(43, 32);
  const words = p.title.toUpperCase().split(/\s+/);
  const meta = curved(t.frame, 10, 38);
  return (
    <AbsoluteFill style={{ color: pal.text, opacity: 1 - t.exit }}>
      <div style={{ position: "absolute", left: "8%", top: "10%", fontFamily: SANS, fontSize: 14, fontWeight: 600, letterSpacing: "0.48em", textTransform: "uppercase", color: pal.accent, opacity: meta }}>
        {p.subtitle}
      </div>
      <div style={{ position: "absolute", left: "8%", top: "25%", right: "8%" }}>
        {words.map((word, i) => {
          const cue = curved(t.frame, 12 + i * 7, 47 + i * 7);
          return (
            <div key={`${word}-${i}`} style={{ overflow: "hidden", borderBottom: `1px solid ${pal.text}1f` }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  fontFamily: SANS,
                  fontSize: Math.min(t.width * 0.075, 138),
                  lineHeight: 0.92,
                  fontWeight: 700,
                  letterSpacing: "-0.055em",
                  transform: `translateY(${(1 - cue) * 105 + t.exit * (i % 2 ? -18 : 18)}%)`,
                  opacity: cue,
                }}
              >
                <span>{word}</span>
                <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 400, letterSpacing: "0.2em", color: `${pal.secondary}88` }}>{String(i + 1).padStart(2, "0")}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: "8%", right: "8%", bottom: "9%", display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 13, letterSpacing: "0.23em", textTransform: "uppercase", color: `${pal.text}a0`, opacity: curved(t.frame, 38, 65) * (1 - t.exit) }}>
        <span>{p.credit}</span><span>Original series</span>
      </div>
      <div style={{ position: "absolute", right: "4%", top: "10%", width: 5, height: `${72 * meta}%`, background: pal.accent, transformOrigin: "top", opacity: 1 - t.exit }} />
    </AbsoluteFill>
  );
};

// 10 — auteur-minimal single-line apparition
const AuteurMinimal: React.FC<{ p: TitleCardProps; pal: Palette }> = ({ p, pal }) => {
  const t = useTimeline(56, 42);
  const titleIn = curved(t.frame, 10, 58, easeInOutQuint);
  const detailIn = curved(t.frame, 38, 68);
  const line = curved(t.frame, 24, 68, easeInOutQuint);
  return (
    <AbsoluteFill style={{ color: pal.text }}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: "82%", textAlign: "center", opacity: titleIn * (1 - t.exit), filter: `blur(${(1 - titleIn) * 10 + t.exit * 8}px)`, transform: `translateY(${(1 - titleIn) * 14 - t.exit * 12}px)` }}>
          <div style={{ fontFamily: SERIF, fontSize: Math.min(t.width * 0.058, 108), lineHeight: 1.1, fontWeight: 400, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
            {p.title}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, marginTop: 38, opacity: detailIn }}>
            <div style={{ transform: "scaleX(-1)" }}><Hairline color={`${pal.secondary}70`} progress={line} width={130} /></div>
            <div style={{ fontFamily: SANS, fontSize: 13, letterSpacing: "0.38em", textTransform: "uppercase", color: pal.secondary }}>{p.subtitle}</div>
            <Hairline color={`${pal.secondary}70`} progress={line} width={130} />
          </div>
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", bottom: "7%", width: "100%", textAlign: "center", fontFamily: SERIF, fontSize: 15, fontStyle: "italic", letterSpacing: "0.16em", color: `${pal.text}82`, opacity: detailIn * (1 - t.exit) }}>
        {p.credit}
      </div>
    </AbsoluteFill>
  );
};

const VARIANTS: Record<TitleCardVariant, React.FC<{ p: TitleCardProps; pal: Palette }>> = {
  "centered-serif": CenteredSerif,
  "indie-credits": IndieCredits,
  letterboxed: Letterboxed,
  "chapter-roman": ChapterRoman,
  "documentary-profile": DocumentaryProfile,
  "arthouse-vertical": ArthouseVertical,
  "scifi-scanline": ScifiScanline,
  "period-ornament": PeriodOrnament,
  "streaming-stack": StreamingStack,
  "auteur-minimal": AuteurMinimal,
};

export const TitleCardTemplate: React.FC<TitleCardProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? CenteredSerif;
  return (
    <AbsoluteFill>
      <FilmField palette={pal} quiet={props.variant === "auteur-minimal" || props.variant === "documentary-profile"} />
      <Variant p={props} pal={pal} />
    </AbsoluteFill>
  );
};

const familyCast = (component: React.FC<TitleCardProps>) =>
  component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "title-card-centered-serif-drama": familyCast(TitleCardTemplate),
  "title-card-left-indie-credits": familyCast(TitleCardTemplate),
  "title-card-letterboxed-widescreen": familyCast(TitleCardTemplate),
  "title-card-chapter-roman": familyCast(TitleCardTemplate),
  "title-card-documentary-profile": familyCast(TitleCardTemplate),
  "title-card-arthouse-vertical": familyCast(TitleCardTemplate),
  "title-card-scifi-scanline": familyCast(TitleCardTemplate),
  "title-card-period-ornament": familyCast(TitleCardTemplate),
  "title-card-streaming-credit-stack": familyCast(TitleCardTemplate),
  "title-card-auteur-minimal": familyCast(TitleCardTemplate),
};
