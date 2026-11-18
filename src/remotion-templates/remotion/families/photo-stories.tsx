import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  FadeEdges,
  NoiseGrainOverlay,
  clampInterp,
  resolvePalette,
  seededRand,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: photo-stories
 * Ten asset-free photo-memory layouts. Every image is a deterministic,
 * labeled gradient placeholder that can be swapped for real media later.
 */

type PhotoVariant =
  | "ken-burns"
  | "polaroid-stack"
  | "filmstrip"
  | "crossfade"
  | "diptych"
  | "scrapbook"
  | "magazine"
  | "postcards"
  | "year-grid"
  | "letterbox";

export interface PhotoStoriesProps {
  variant: PhotoVariant;
  title: string;
  subtitle: string;
  captions: string[];
  location: string;
  year: string;
  paletteName: string;
}

const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';

const captionAt = (p: PhotoStoriesProps, index: number): string =>
  p.captions[index % Math.max(1, p.captions.length)] ?? `Memory ${String(index + 1).padStart(2, "0")}`;

const photoLabel = (index: number): string => `PHOTO ${String(index + 1).padStart(2, "0")}`;

const PhotoFrame: React.FC<{
  index: number;
  pal: Palette;
  style?: React.CSSProperties;
  imageTransform?: string;
  darken?: number;
  labelScale?: number;
}> = ({ index, pal, style, imageTransform = "scale(1)", darken = 0, labelScale = 1 }) => {
  const a = seededRand(index * 17 + 2);
  const b = seededRand(index * 17 + 7);
  const c = seededRand(index * 17 + 13);
  const colors = [pal.primary, pal.secondary, pal.accent, pal.bg];
  const first = colors[index % colors.length];
  const second = colors[(index + 1) % colors.length];
  const third = colors[(index + 2) % colors.length];

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        backgroundColor: pal.bg,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "-8%",
          transform: imageTransform,
          transformOrigin: `${25 + a * 50}% ${25 + b * 50}%`,
          background: [
            `radial-gradient(circle at ${18 + a * 64}% ${18 + b * 64}%, ${pal.text}38 0%, transparent 28%)`,
            `radial-gradient(circle at ${78 - b * 45}% ${70 - c * 42}%, ${third}dd 0%, transparent 42%)`,
            `linear-gradient(${110 + a * 140}deg, ${first}, ${second} 52%, ${pal.bg})`,
          ].join(", "),
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: [
            `linear-gradient(${20 + c * 120}deg, transparent 35%, ${pal.bg}35 100%)`,
            `rgba(0,0,0,${darken})`,
          ].join(", "),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) scale(${labelScale})`,
          padding: "0.45em 0.8em",
          border: `2px solid ${pal.text}88`,
          color: pal.text,
          fontFamily: SANS,
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: "0.22em",
          whiteSpace: "nowrap",
          textShadow: "0 2px 16px rgba(0,0,0,0.35)",
          background: "rgba(0,0,0,0.12)",
        }}
      >
        {photoLabel(index)}
      </div>
    </div>
  );
};

const SmallCaps: React.FC<{ children: React.ReactNode; color: string; style?: React.CSSProperties }> = ({ children, color, style }) => (
  <div
    style={{
      color,
      fontFamily: SANS,
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: "0.26em",
      textTransform: "uppercase",
      ...style,
    }}
  >
    {children}
  </div>
);

// ---------------- variant: Ken Burns single frame ----------------
const KenBurns: React.FC<{ p: PhotoStoriesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = frame / Math.max(1, durationInFrames - 1);
  const scale = interpolate(progress, [0, 1], [1.04, 1.24]);
  const x = interpolate(progress, [0, 1], [-2.5, 2.5]);
  const captionIn = clampInterp(frame, [16, 35], [0, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg }}>
      <PhotoFrame
        index={0}
        pal={pal}
        darken={0.1}
        style={{ position: "absolute", inset: 0 }}
        imageTransform={`translateX(${x}%) scale(${scale})`}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 50%, rgba(0,0,0,0.78) 100%)" }} />
      <div
        style={{
          position: "absolute",
          left: 112,
          right: 112,
          bottom: 82,
          borderLeft: `6px solid ${pal.accent}`,
          paddingLeft: 30,
          opacity: captionIn,
          transform: `translateY(${interpolate(captionIn, [0, 1], [34, 0])}px)`,
        }}
      >
        <SmallCaps color={pal.secondary}>{p.subtitle}</SmallCaps>
        <div style={{ marginTop: 10, color: pal.text, fontFamily: SERIF, fontSize: 68, lineHeight: 1.06 }}>{p.title}</div>
        <div style={{ marginTop: 14, color: `${pal.text}cc`, fontFamily: SANS, fontSize: 28 }}>{captionAt(p, 0)}</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- variant: falling polaroid stack ----------------
const PolaroidStack: React.FC<{ p: PhotoStoriesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cards = Array.from({ length: 5 }, (_, i) => i);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${pal.bg}, ${pal.primary}22)`, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 110, top: 100, width: 500 }}>
        <SmallCaps color={pal.accent}>{p.subtitle}</SmallCaps>
        <div style={{ marginTop: 18, color: pal.text, fontFamily: SERIF, fontSize: 78, lineHeight: 1.02 }}>{p.title}</div>
        <div style={{ marginTop: 30, color: `${pal.text}99`, fontFamily: SANS, fontSize: 26, lineHeight: 1.5 }}>A handful of moments, kept close.</div>
      </div>
      {cards.map((i) => {
        const enter = spring({
          frame: Math.max(0, frame - i * 9),
          fps,
          config: { damping: 12, stiffness: 125, mass: 0.9 },
        });
        const rotate = -13 + i * 6 + (seededRand(i + 31) - 0.5) * 5;
        const left = 950 + (seededRand(i + 44) - 0.5) * 190;
        const top = 132 + (seededRand(i + 52) - 0.5) * 80;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left,
              top,
              width: 580,
              height: 760,
              padding: "24px 24px 94px",
              background: "#fffdf8",
              boxShadow: "0 28px 65px rgba(0,0,0,0.34)",
              transformOrigin: "50% 10%",
              transform: `translateY(${interpolate(enter, [0, 1], [-1050, 0])}px) rotate(${interpolate(enter, [0, 1], [rotate - 18, rotate])}deg)`,
            }}
          >
            <PhotoFrame index={i} pal={pal} style={{ width: "100%", height: 610 }} labelScale={0.9} />
            <div style={{ marginTop: 22, color: "#26221e", fontFamily: SERIF, fontSize: 28, textAlign: "center" }}>{captionAt(p, i)}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------- variant: three-column filmstrip ----------------
const Filmstrip: React.FC<{ p: PhotoStoriesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const columns = Array.from({ length: 3 }, (_, i) => i);

  return (
    <AbsoluteFill style={{ backgroundColor: "#090909", padding: "34px 58px", overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 32, height: "100%" }}>
        {columns.map((col) => {
          const direction = col % 2 === 0 ? 1 : -1;
          const entrance = clampInterp(frame, [col * 7, col * 7 + 38], [direction * 1120, 0]);
          const drift = Math.sin(frame * 0.025 + col) * 12;
          return (
            <div
              key={col}
              style={{
                position: "relative",
                flex: 1,
                padding: "26px 38px",
                background: "#171717",
                boxShadow: `0 0 0 2px ${pal.secondary}22`,
                transform: `translateY(${entrance + drift}px)`,
              }}
            >
              {Array.from({ length: 11 }, (_, hole) => (
                <React.Fragment key={hole}>
                  <div style={{ position: "absolute", left: 10, top: 15 + hole * 94, width: 14, height: 40, borderRadius: 3, background: "#050505" }} />
                  <div style={{ position: "absolute", right: 10, top: 15 + hole * 94, width: 14, height: 40, borderRadius: 3, background: "#050505" }} />
                </React.Fragment>
              ))}
              <div style={{ display: "flex", height: "100%", flexDirection: "column", gap: 20 }}>
                {Array.from({ length: 4 }, (_, row) => {
                  const index = col * 4 + row;
                  return (
                    <div key={row} style={{ flex: 1, minHeight: 0, position: "relative" }}>
                      <PhotoFrame index={index} pal={pal} style={{ width: "100%", height: "100%" }} labelScale={0.68} />
                      <div style={{ position: "absolute", left: 16, bottom: 12, color: pal.text, fontFamily: SANS, fontSize: 17, letterSpacing: "0.08em", textShadow: "0 2px 8px #000" }}>{captionAt(p, index)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, padding: "28px 72px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(#090909ee, transparent)" }}>
        <div style={{ color: pal.text, fontFamily: SANS, fontSize: 30, fontWeight: 800, letterSpacing: "0.18em" }}>{p.title.toUpperCase()}</div>
        <SmallCaps color={pal.accent}>{p.subtitle}</SmallCaps>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- variant: full-screen crossfade slideshow ----------------
const Crossfade: React.FC<{ p: PhotoStoriesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const count = 5;
  const segment = durationInFrames / count;
  const active = Math.min(count - 1, Math.floor(frame / segment));
  const local = frame - active * segment;
  const fade = clampInterp(local, [segment * 0.72, segment], [0, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg }}>
      {Array.from({ length: count }, (_, i) => {
        const isActive = i === active;
        const isNext = i === Math.min(count - 1, active + 1);
        const opacity = isActive ? 1 - fade : isNext ? fade : 0;
        const localProgress = isActive ? local / segment : 0;
        return (
          <PhotoFrame
            key={i}
            index={i}
            pal={pal}
            darken={0.2}
            style={{ position: "absolute", inset: 0, opacity }}
            imageTransform={`scale(${1.06 + localProgress * 0.08})`}
          />
        );
      })}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.48), transparent 60%), linear-gradient(transparent 65%, rgba(0,0,0,0.5))" }} />
      <div style={{ position: "absolute", left: 92, bottom: 102, width: 760 }}>
        <SmallCaps color={pal.accent}>{p.subtitle}</SmallCaps>
        <div style={{ marginTop: 12, color: pal.text, fontFamily: SERIF, fontSize: 76 }}>{p.title}</div>
        <div key={active} style={{ marginTop: 14, color: `${pal.text}dd`, fontFamily: SANS, fontSize: 29, opacity: clampInterp(local, [0, 10], [0, 1]) }}>{captionAt(p, active)}</div>
      </div>
      <div style={{ position: "absolute", right: 90, bottom: 82, display: "flex", gap: 15 }}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} style={{ width: i === active ? 46 : 12, height: 12, borderRadius: 99, background: i === active ? pal.accent : `${pal.text}66` }} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ---------------- variant: split-screen diptych ----------------
const Diptych: React.FC<{ p: PhotoStoriesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const reveal = clampInterp(frame, [5, 42], [0, 1]);
  const divider = clampInterp(frame, [32, 55], [0, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg, padding: 58 }}>
      <div style={{ position: "relative", display: "flex", flex: 1, gap: 22, overflow: "hidden" }}>
        <div style={{ position: "relative", flex: 1, transform: `translateX(${interpolate(reveal, [0, 1], [-105, 0])}%)` }}>
          <PhotoFrame index={0} pal={pal} style={{ width: "100%", height: "100%" }} imageTransform={`scale(${1.14 - reveal * 0.08})`} />
          <div style={{ position: "absolute", left: 28, bottom: 25, color: pal.text, fontFamily: SANS, fontSize: 25, textShadow: "0 2px 12px #000" }}>{captionAt(p, 0)}</div>
        </div>
        <div style={{ width: 3, background: pal.accent, transform: `scaleY(${divider})`, transformOrigin: "center" }} />
        <div style={{ position: "relative", flex: 1, transform: `translateX(${interpolate(reveal, [0, 1], [105, 0])}%)` }}>
          <PhotoFrame index={1} pal={pal} style={{ width: "100%", height: "100%" }} imageTransform={`scale(${1.14 - reveal * 0.08})`} />
          <div style={{ position: "absolute", right: 28, bottom: 25, color: pal.text, fontFamily: SANS, fontSize: 25, textAlign: "right", textShadow: "0 2px 12px #000" }}>{captionAt(p, 1)}</div>
        </div>
      </div>
      <div style={{ height: 155, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ color: pal.text, fontFamily: SERIF, fontSize: 58 }}>{p.title}</div>
        <div style={{ textAlign: "right" }}>
          <SmallCaps color={pal.secondary}>{p.subtitle}</SmallCaps>
          <div style={{ marginTop: 8, color: `${pal.text}77`, fontFamily: SANS, fontSize: 20 }}>{p.location} · {p.year}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- variant: scrapbook tilt collage ----------------
const Scrapbook: React.FC<{ p: PhotoStoriesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const placements: React.CSSProperties[] = [
    { left: 95, top: 125, width: 500, height: 340 },
    { left: 635, top: 85, width: 430, height: 300 },
    { right: 95, top: 150, width: 650, height: 380 },
    { left: 190, bottom: 90, width: 610, height: 365 },
    { right: 250, bottom: 70, width: 540, height: 330 },
  ];

  return (
    <AbsoluteFill style={{ background: "#eee6d7", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.32, backgroundImage: "repeating-linear-gradient(0deg, transparent 0 31px, #82756333 31px 32px)" }} />
      <div style={{ position: "absolute", left: 76, top: 42, color: "#302a24", fontFamily: SERIF, fontStyle: "italic", fontSize: 56, transform: "rotate(-2deg)" }}>{p.title}</div>
      <div style={{ position: "absolute", right: 84, top: 54, color: "#6d6255", fontFamily: SANS, fontSize: 20, letterSpacing: "0.22em", textTransform: "uppercase" }}>{p.subtitle} · {p.year}</div>
      {placements.map((placement, i) => {
        const pop = spring({ frame: Math.max(0, frame - 6 - i * 8), fps, config: { damping: 14, stiffness: 150 } });
        const rotate = (seededRand(i + 80) - 0.5) * 12;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              padding: "15px 15px 52px",
              background: i % 2 ? "#fffaf0" : "#f7f1e5",
              boxShadow: "0 14px 30px rgba(72,57,42,0.25)",
              ...placement,
              opacity: pop,
              transform: `scale(${interpolate(pop, [0, 1], [0.45, 1])}) rotate(${rotate}deg)`,
            }}
          >
            <PhotoFrame index={i} pal={pal} style={{ width: "100%", height: "100%" }} labelScale={0.7} />
            <div style={{ position: "absolute", left: 20, right: 20, bottom: 14, color: "#3c342c", fontFamily: SERIF, fontStyle: "italic", fontSize: 21 }}>{captionAt(p, i)}</div>
            <div style={{ position: "absolute", left: "50%", top: -18, width: 112, height: 35, transform: "translateX(-50%) rotate(-2deg)", background: `${pal.secondary}99`, opacity: 0.7 }} />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 52, bottom: 40, width: 72, height: 72, border: `4px solid ${pal.accent}`, borderRadius: "50%", opacity: 0.65 }} />
    </AbsoluteFill>
  );
};

// ---------------- variant: magazine cover ----------------
const Magazine: React.FC<{ p: PhotoStoriesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const coverIn = clampInterp(frame, [0, 30], [0, 1]);
  const linesIn = clampInterp(frame, [25, 58], [0, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#d9d4ca", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          position: "relative",
          width: 760,
          height: 980,
          overflow: "hidden",
          background: pal.bg,
          boxShadow: "0 35px 80px rgba(0,0,0,0.32)",
          opacity: coverIn,
          transform: `perspective(1400px) rotateY(${interpolate(coverIn, [0, 1], [-18, 0])}deg) scale(${interpolate(coverIn, [0, 1], [0.92, 1])})`,
        }}
      >
        <PhotoFrame index={0} pal={pal} darken={0.24} style={{ position: "absolute", inset: 0 }} imageTransform={`scale(${1.16 - coverIn * 0.08})`} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(rgba(0,0,0,0.36), transparent 30%, transparent 55%, rgba(0,0,0,0.62))" }} />
        <div style={{ position: "absolute", top: 24, left: 28, right: 28, textAlign: "center", color: pal.text, fontFamily: SERIF, fontSize: 100, lineHeight: 0.88, letterSpacing: "-0.06em", borderBottom: `2px solid ${pal.text}aa`, paddingBottom: 10 }}>{p.title}</div>
        <SmallCaps color={pal.accent} style={{ position: "absolute", top: 143, left: 35 }}>{p.subtitle}</SmallCaps>
        <div style={{ position: "absolute", left: 36, top: 300, width: 270, opacity: linesIn, transform: `translateX(${interpolate(linesIn, [0, 1], [-45, 0])}px)` }}>
          {p.captions.slice(0, 3).map((caption, i) => (
            <div key={i} style={{ marginBottom: 30, paddingTop: 12, borderTop: `3px solid ${i === 0 ? pal.accent : pal.text}`, color: pal.text, fontFamily: SANS, fontSize: i === 0 ? 32 : 25, fontWeight: 800, lineHeight: 1.08 }}>{caption}</div>
          ))}
        </div>
        <div style={{ position: "absolute", right: 34, bottom: 42, color: pal.text, textAlign: "right" }}>
          <div style={{ fontFamily: SERIF, fontSize: 53, lineHeight: 0.95 }}>{p.location}</div>
          <div style={{ marginTop: 8, fontFamily: SANS, fontSize: 18, letterSpacing: "0.22em" }}>THE {p.year} EDITION</div>
        </div>
        <div style={{ position: "absolute", left: 35, bottom: 38, width: 115, height: 54, background: "repeating-linear-gradient(90deg, #fff 0 3px, transparent 3px 7px)" }} />
      </div>
      <div style={{ position: "absolute", right: 130, bottom: 70, color: "#6c655d", fontFamily: SANS, fontSize: 18, letterSpacing: "0.18em", writingMode: "vertical-rl" }}>ISSUE 01 · PHOTO STORIES</div>
    </AbsoluteFill>
  );
};

// ---------------- variant: travel postcard stack ----------------
const Postcards: React.FC<{ p: PhotoStoriesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cards = [2, 1, 0];

  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, ${pal.secondary}33, transparent 45%), ${pal.bg}`, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 88, top: 70 }}>
        <SmallCaps color={pal.accent}>{p.subtitle}</SmallCaps>
        <div style={{ marginTop: 8, color: pal.text, fontFamily: SERIF, fontSize: 72 }}>{p.title}</div>
      </div>
      {cards.map((i, order) => {
        const enter = spring({ frame: Math.max(0, frame - order * 10), fps, config: { damping: 15, stiffness: 115 } });
        const rotation = (i - 1) * 7;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 305 + i * 45,
              top: 245 + i * 28,
              width: 1260,
              height: 680,
              display: "flex",
              padding: 30,
              gap: 34,
              background: "#f8f1df",
              color: "#312b25",
              boxShadow: "0 24px 65px rgba(0,0,0,0.34)",
              opacity: enter,
              transform: `translateX(${interpolate(enter, [0, 1], [1250, 0])}px) rotate(${rotation}deg)`,
            }}
          >
            <PhotoFrame index={i} pal={pal} style={{ width: "63%", height: "100%" }} labelScale={0.9} />
            <div style={{ position: "relative", flex: 1, padding: "22px 10px 10px" }}>
              <div style={{ position: "absolute", right: 0, top: 0, width: 112, height: 138, border: `4px double ${pal.accent}`, display: "flex", alignItems: "center", justifyContent: "center", color: pal.accent, fontFamily: SERIF, fontSize: 22, textAlign: "center" }}>AIR<br />MAIL</div>
              <div style={{ marginTop: 35, fontFamily: SERIF, fontSize: 44, fontStyle: "italic" }}>Wish you were here!</div>
              <div style={{ marginTop: 34, fontFamily: SERIF, fontSize: 27, lineHeight: 1.45 }}>{captionAt(p, i)}</div>
              <div style={{ position: "absolute", left: 6, right: 6, bottom: 56 }}>
                {[0, 1, 2].map((line) => <div key={line} style={{ height: 1, marginTop: 34, background: "#786f633f" }} />)}
              </div>
              <div style={{ position: "absolute", right: 10, bottom: 15, width: 150, height: 150, border: `4px solid ${pal.accent}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(-12deg)", color: pal.accent, fontFamily: SANS, fontSize: 18, fontWeight: 800, letterSpacing: "0.08em", textAlign: "center" }}>{p.location.toUpperCase()}<br />{p.year}</div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------- variant: year-in-review grid pop ----------------
const YearGrid: React.FC<{ p: PhotoStoriesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg, padding: "62px 72px" }}>
      <div style={{ height: 122, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <SmallCaps color={pal.accent}>{p.subtitle}</SmallCaps>
          <div style={{ marginTop: 8, color: pal.text, fontFamily: SANS, fontSize: 47, fontWeight: 800 }}>{p.title}</div>
        </div>
        <div style={{ color: pal.primary, fontFamily: SANS, fontSize: 110, lineHeight: 0.8, fontWeight: 900, letterSpacing: "-0.08em" }}>{p.year}</div>
      </div>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(3, 1fr)", gap: 18 }}>
        {Array.from({ length: 9 }, (_, i) => {
          const pop = spring({ frame: Math.max(0, frame - 5 - i * 4), fps, config: { damping: 11, stiffness: 175 } });
          return (
            <div key={i} style={{ position: "relative", minHeight: 0, opacity: pop, transform: `scale(${interpolate(pop, [0, 1], [0.2, 1])})` }}>
              <PhotoFrame index={i} pal={pal} style={{ width: "100%", height: "100%", borderRadius: 10 }} labelScale={0.56} />
              <div style={{ position: "absolute", left: 12, right: 12, bottom: 10, color: pal.text, fontFamily: SANS, fontSize: 16, textShadow: "0 2px 8px #000", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{captionAt(p, i)}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------- variant: cinematic letterbox sequence ----------------
const Letterbox: React.FC<{ p: PhotoStoriesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const count = 4;
  const segment = durationInFrames / count;
  const active = Math.min(count - 1, Math.floor(frame / segment));
  const local = frame - active * segment;
  const sceneOpacity = Math.min(
    clampInterp(local, [0, 10], [0, 1]),
    clampInterp(local, [segment - 12, segment], [1, 0]),
  );
  const bars = clampInterp(frame, [0, 24], [0, 1]);
  const sceneProgress = local / segment;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <PhotoFrame
        key={active}
        index={active}
        pal={pal}
        darken={0.22}
        style={{ position: "absolute", inset: 0, opacity: sceneOpacity }}
        imageTransform={`translateX(${interpolate(sceneProgress, [0, 1], [-2, 2])}%) scale(${1.12 + sceneProgress * 0.05})`}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.42), transparent 55%)" }} />
      <div style={{ position: "absolute", left: 100, bottom: 212, opacity: sceneOpacity }}>
        <SmallCaps color={pal.accent}>Scene {String(active + 1).padStart(2, "0")}</SmallCaps>
        <div style={{ marginTop: 12, maxWidth: 850, color: pal.text, fontFamily: SERIF, fontSize: 62, lineHeight: 1.05 }}>{captionAt(p, active)}</div>
      </div>
      <div style={{ position: "absolute", left: 100, top: 178, color: pal.text, fontFamily: SANS, fontSize: 25, fontWeight: 800, letterSpacing: "0.28em", textTransform: "uppercase" }}>{p.title}</div>
      <div style={{ position: "absolute", right: 100, top: 178, color: `${pal.text}99`, fontFamily: SANS, fontSize: 18, letterSpacing: "0.18em" }}>{p.location} / {p.year}</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: interpolate(bars, [0, 1], [0, 142]), background: "#000" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: interpolate(bars, [0, 1], [0, 142]), background: "#000" }} />
      <div style={{ position: "absolute", right: 100, bottom: 176, display: "flex", gap: 8 }}>
        {Array.from({ length: count }, (_, i) => <div key={i} style={{ width: 52, height: 3, background: i <= active ? pal.accent : `${pal.text}44` }} />)}
      </div>
      <NoiseGrainOverlay opacity={0.045} />
    </AbsoluteFill>
  );
};

const VARIANTS: Record<PhotoVariant, React.FC<{ p: PhotoStoriesProps; pal: Palette }>> = {
  "ken-burns": KenBurns,
  "polaroid-stack": PolaroidStack,
  filmstrip: Filmstrip,
  crossfade: Crossfade,
  diptych: Diptych,
  scrapbook: Scrapbook,
  magazine: Magazine,
  postcards: Postcards,
  "year-grid": YearGrid,
  letterbox: Letterbox,
};

export const PhotoStoriesTemplate: React.FC<PhotoStoriesProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? KenBurns;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg }}>
      <FadeEdges inFrames={10} outFrames={14}>
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}>
          <Variant p={props} pal={pal} />
        </div>
      </FadeEdges>
    </AbsoluteFill>
  );
};

const familyCast = (c: React.FC<PhotoStoriesProps>) => c as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "photo-ken-burns-caption": familyCast(PhotoStoriesTemplate),
  "photo-polaroid-stack-drop": familyCast(PhotoStoriesTemplate),
  "photo-filmstrip-three-column": familyCast(PhotoStoriesTemplate),
  "photo-crossfade-progress": familyCast(PhotoStoriesTemplate),
  "photo-diptych-split": familyCast(PhotoStoriesTemplate),
  "photo-scrapbook-collage": familyCast(PhotoStoriesTemplate),
  "photo-magazine-cover": familyCast(PhotoStoriesTemplate),
  "photo-travel-postcards": familyCast(PhotoStoriesTemplate),
  "photo-year-review-grid": familyCast(PhotoStoriesTemplate),
  "photo-cinematic-letterbox": familyCast(PhotoStoriesTemplate),
};

void Easing;
