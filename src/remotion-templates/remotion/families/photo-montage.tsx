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
  NoiseGrainOverlay,
  clampInterp,
  resolvePalette,
  seededRand,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: photo-montage
 * Editorial photo montage structures with deterministic, asset-free placeholders.
 * Supply imageUrls to replace any placeholder frame with real media.
 */
export type PhotoMontageVariant =
  | "contact-sheet"
  | "photo-wipe"
  | "grid-montage"
  | "memory-flash"
  | "photo-ribbon"
  | "album-turn"
  | "date-montage"
  | "portrait-wall"
  | "triptych-reel"
  | "photo-finale";

export interface PhotoMontageProps {
  variant: PhotoMontageVariant;
  title: string;
  subtitle: string;
  captions: string[];
  dates: string[];
  imageUrls?: string[];
  paletteName: string;
  focalPoints?: Array<{ x: number; y: number }>;
  speed?: number;
}

const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';

const captionAt = (p: PhotoMontageProps, index: number): string =>
  p.captions[index % Math.max(1, p.captions.length)] ?? `Memory ${String(index + 1).padStart(2, "0")}`;
const dateAt = (p: PhotoMontageProps, index: number): string =>
  p.dates[index % Math.max(1, p.dates.length)] ?? `20${String(20 + index).padStart(2, "0")}`;

const Tile: React.FC<{
  p: PhotoMontageProps;
  pal: Palette;
  index: number;
  style?: React.CSSProperties;
  label?: boolean;
  radius?: number;
  darken?: number;
  imageTransform?: string;
  fallbackMode?: "previous" | "active";
}> = ({ p, pal, index, style, label = true, radius = 12, darken = 0, imageTransform = "scale(1)", fallbackMode }) => {
  const image = p.imageUrls?.[index % Math.max(1, p.imageUrls.length)];
  const focal = p.focalPoints?.[index % Math.max(1, p.focalPoints?.length ?? 1)] ?? { x: 50, y: 50 };
  const a = seededRand(index * 23 + 4);
  const b = seededRand(index * 23 + 8);
  const c = seededRand(index * 23 + 17);
  const colors = [pal.primary, pal.secondary, pal.accent, pal.bg];
  const first = colors[index % colors.length];
  const second = colors[(index + 1) % colors.length];

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: radius,
        backgroundColor: pal.bg,
        ...style,
      }}
    >
      {image ? (
        <img
          src={image}
          alt=""
          style={{
            position: "absolute",
            inset: "-7%",
            width: "114%",
            height: "114%",
            objectFit: "cover",
            objectPosition: `${focal.x}% ${focal.y}%`,
            transform: imageTransform,
          }}
        />
      ) : (
        <>
          <div
            style={{
              position: "absolute",
              inset: "-8%",
              transform: imageTransform,
              background: fallbackMode === "active"
                ? [
                    `linear-gradient(24deg, ${pal.bg} 0%, ${pal.primary} 42%, ${pal.accent} 100%)`,
                    `repeating-linear-gradient(112deg, transparent 0 46px, ${pal.text}24 47px 50px)`,
                  ].join(", ")
                : fallbackMode === "previous"
                  ? [
                      `linear-gradient(142deg, ${pal.secondary} 0%, ${pal.bg} 46%, ${pal.primary} 100%)`,
                      `radial-gradient(circle at 76% 24%, ${pal.text}55 0 9%, transparent 10%)`,
                      `radial-gradient(circle at 20% 78%, ${pal.accent}aa 0 18%, transparent 19%)`,
                    ].join(", ")
                  : [
                      `radial-gradient(circle at ${18 + a * 64}% ${18 + b * 64}%, ${pal.text}42 0%, transparent 24%)`,
                      `radial-gradient(circle at ${76 - b * 36}% ${72 - c * 42}%, ${pal.accent}dd 0%, transparent 39%)`,
                      `linear-gradient(${100 + a * 160}deg, ${first}, ${second} 52%, ${pal.bg})`,
                    ].join(", "),
            }}
          />
          {fallbackMode && (
            <div
              style={{
                position: "absolute",
                inset: "10%",
                border: `2px solid ${pal.text}55`,
                background: fallbackMode === "active" ? `radial-gradient(circle at 24% 28%, ${pal.text}38 0 2%, transparent 3%), radial-gradient(circle at 72% 70%, ${pal.text}28 0 14%, transparent 15%)` : `linear-gradient(132deg, transparent 0 42%, ${pal.text}28 43% 47%, transparent 48%)`,
                opacity: 0.9,
              }}
            />
          )}
        </>
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(155deg, transparent 34%, ${pal.bg}${darken > 0 ? "" : "26"} 100%)`,
          opacity: darken > 0 ? darken + 0.25 : 1,
        }}
      />
      {label && (
        <div
          style={{
            position: "absolute",
            left: 18,
            right: 18,
            bottom: 16,
            color: pal.text,
            fontFamily: SANS,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            textShadow: "0 2px 9px rgba(0,0,0,0.75)",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {captionAt(p, index)}
        </div>
      )}
    </div>
  );
};

const Kicker: React.FC<{ children: React.ReactNode; color: string }> = ({ children, color }) => (
  <div style={{ color, fontFamily: SANS, fontSize: 20, fontWeight: 800, letterSpacing: "0.28em", textTransform: "uppercase" }}>
    {children}
  </div>
);

const ContactSheet: React.FC<{ p: PhotoMontageProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${pal.bg}, ${pal.primary}24)`, padding: 86, overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <Kicker color={pal.accent}>{p.subtitle}</Kicker>
          <div style={{ marginTop: 12, color: pal.text, fontFamily: SERIF, fontSize: 72, lineHeight: 0.98 }}>{p.title}</div>
        </div>
        <div style={{ color: `${pal.text}99`, fontFamily: SANS, fontSize: 22, letterSpacing: "0.14em" }}>CONTACT SHEET / {p.captions.length || 9} FRAMES</div>
      </div>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(3, 1fr)", gap: 18 }}>
        {Array.from({ length: 9 }, (_, i) => {
          const enter = spring({ frame: Math.max(0, frame - i * 3), fps, config: { damping: 15, stiffness: 145 } });
          return <Tile key={i} p={p} pal={pal} index={i} radius={8} style={{ opacity: enter, transform: `scale(${interpolate(enter, [0, 1], [0.78, 1])})` }} />;
        })}
      </div>
    </AbsoluteFill>
  );
};

const PhotoWipe: React.FC<{ p: PhotoMontageProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const count = 4;
  const segment = durationInFrames / count;
  const active = Math.min(count - 1, Math.floor(frame / segment));
  const local = frame - active * segment;
  const reveal = clampInterp(local, [0, 24], [0, 1]);
  // Keep the previous frame underneath while the next photo is revealed from
  // right to left. The clip boundary and separator share the same progress,
  // so the transition is a real wipe rather than a moving accent line.
  const clipLeft = interpolate(reveal, [0, 1], [100, 0]);
  const previous = active === 0 ? active : active - 1;
  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg, overflow: "hidden" }}>
      <Tile p={p} pal={pal} index={previous} label={false} radius={0} darken={0.2} fallbackMode="previous" style={{ position: "absolute", inset: 0 }} imageTransform={`scale(${1.045 + previous * 0.015})`} />
      <Tile
        p={p}
        pal={pal}
        index={active}
        label={false}
        radius={0}
        fallbackMode="active"
        style={{ position: "absolute", inset: 0, clipPath: `inset(0 0 0 ${clipLeft}%)` }}
        imageTransform={`scale(${1.06 + active * 0.015})`}
      />
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${pal.bg}ee, transparent 70%)` }} />
      <div style={{ position: "absolute", left: 110, bottom: 120, width: 860, opacity: clampInterp(local, [12, 35], [0, 1]) }}>
        <Kicker color={pal.accent}>{dateAt(p, active)}</Kicker>
        <div style={{ marginTop: 16, color: pal.text, fontFamily: SERIF, fontSize: 78, lineHeight: 1.02 }}>{captionAt(p, active)}</div>
        <div style={{ marginTop: 22, color: `${pal.text}99`, fontFamily: SANS, fontSize: 24 }}>{p.title}</div>
      </div>
      <div style={{ position: "absolute", top: 0, bottom: 0, left: `${clipLeft}%`, width: 8, background: pal.accent, boxShadow: `0 0 26px ${pal.accent}` }} />
      <div style={{ position: "absolute", top: 64, right: 84, color: pal.text, fontFamily: SANS, fontSize: 20, letterSpacing: "0.22em" }}>{String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</div>
    </AbsoluteFill>
  );
};

const GridMontage: React.FC<{ p: PhotoMontageProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const widths = ["1.3fr", "0.8fr", "1fr", "0.72fr"];
  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg, padding: 74, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 76, top: 62, zIndex: 2 }}><Kicker color={pal.secondary}>{p.subtitle}</Kicker><div style={{ marginTop: 10, color: pal.text, fontFamily: SANS, fontSize: 42, fontWeight: 800 }}>{p.title}</div></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gridTemplateRows: "repeat(2, 1fr)", gap: 16, height: "100%", paddingTop: 128 }}>
        {Array.from({ length: 8 }, (_, i) => {
          const pop = spring({ frame: Math.max(0, frame - i * 5), fps, config: { damping: 12, stiffness: 130 } });
          return <Tile key={i} p={p} pal={pal} index={i} label={i % 2 === 0} style={{ opacity: pop, transform: `translateY(${interpolate(pop, [0, 1], [180, 0])}px) scale(${interpolate(pop, [0, 1], [0.92, 1])})`, gridColumn: i === 0 ? "span 2" : undefined, gridRow: i === 0 ? "span 2" : undefined }} radius={10} />;
        })}
      </div>
      <div style={{ position: "absolute", right: 82, bottom: 50, display: "flex", gap: 8 }}>{widths.map((_, i) => <div key={i} style={{ width: i === 0 ? 62 : 24, height: 4, background: i === 0 ? pal.accent : `${pal.text}44` }} />)}</div>
    </AbsoluteFill>
  );
};

const MemoryFlash: React.FC<{ p: PhotoMontageProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const count = 7;
  const active = Math.min(count - 1, Math.floor((frame / Math.max(1, durationInFrames)) * count));
  const local = (frame % Math.max(1, Math.floor(durationInFrames / count))) / Math.max(1, Math.floor(durationInFrames / count));
  const scale = interpolate(clampInterp(local, [0, 1], [0, 1]), [0, 1], [1.13, 1.03]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#050505" }}>
      <Tile p={p} pal={pal} index={active} label={false} radius={0} style={{ position: "absolute", inset: 42 }} darken={0.16} imageTransform={`scale(${scale})`} />
      <div style={{ position: "absolute", inset: 42, border: `2px solid ${pal.text}55`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: 90, top: 80, color: pal.text, fontFamily: SANS, fontSize: 18, fontWeight: 800, letterSpacing: "0.3em" }}>MEMORY / {String(active + 1).padStart(2, "0")}</div>
      <div style={{ position: "absolute", left: 90, bottom: 88, maxWidth: 800, color: pal.text, fontFamily: SERIF, fontSize: 72, textShadow: "0 3px 18px #000" }}>{captionAt(p, active)}</div>
      <div style={{ position: "absolute", right: 90, bottom: 92, color: pal.accent, fontFamily: SANS, fontSize: 22, letterSpacing: "0.16em" }}>{dateAt(p, active)}</div>
    </AbsoluteFill>
  );
};

const PhotoRibbon: React.FC<{ p: PhotoMontageProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const drift = (frame * (p.speed ?? 1) * 1.6) % 540;
  const items = Array.from({ length: 8 }, (_, i) => i);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${pal.bg}, ${pal.primary}20)`, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 100, top: 118, zIndex: 2 }}><Kicker color={pal.accent}>A MOVING ALBUM</Kicker><div style={{ marginTop: 14, color: pal.text, fontFamily: SERIF, fontSize: 74 }}>{p.title}</div></div>
      <div style={{ position: "absolute", left: -480 - drift, top: 330, display: "flex", gap: 24, transform: "rotate(-5deg)" }}>
        {items.map((i) => <Tile key={i} p={p} pal={pal} index={i} style={{ flex: "0 0 520px", height: 370 }} radius={8} />)}
      </div>
      <div style={{ position: "absolute", left: 480 - drift * 0.7, top: 760, display: "flex", gap: 24, transform: "rotate(-5deg)" }}>
        {items.slice().reverse().map((i) => <Tile key={i} p={pal === pal ? p : p} pal={pal} index={i + 2} style={{ flex: "0 0 360px", height: 250 }} radius={8} />)}
      </div>
      <div style={{ position: "absolute", left: 102, bottom: 86, color: `${pal.text}99`, fontFamily: SANS, fontSize: 22, letterSpacing: "0.12em" }}>{p.subtitle} / {p.dates[0] ?? "ARCHIVE"}</div>
    </AbsoluteFill>
  );
};

const AlbumTurn: React.FC<{ p: PhotoMontageProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const turn = spring({ frame, fps, config: { damping: 16, stiffness: 85, mass: 1 } });
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, ${pal.secondary}22, ${pal.bg} 62%)`, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: "50%", top: "50%", width: 940, height: 700, transform: `translate(-50%, -45%) rotateY(${interpolate(turn, [0, 1], [88, 0])}deg) rotateZ(-2deg)`, transformStyle: "preserve-3d", transformOrigin: "left center", background: "#f6f0e4", padding: 28, boxShadow: "0 32px 90px rgba(0,0,0,0.45)" }}>
        <Tile p={p} pal={pal} index={0} radius={3} style={{ width: "100%", height: "100%" }} label={false} />
        <div style={{ position: "absolute", left: 46, bottom: 36, color: "#2a2825", fontFamily: SERIF, fontSize: 30 }}>{p.title}</div>
      </div>
      <div style={{ position: "absolute", left: 100, top: 96, color: pal.text, fontFamily: SANS, fontSize: 20, letterSpacing: "0.3em", fontWeight: 800 }}>ALBUM / {p.subtitle}</div>
      <div style={{ position: "absolute", right: 100, bottom: 82, color: pal.accent, fontFamily: SANS, fontSize: 22 }}>{dateAt(p, 0)}</div>
    </AbsoluteFill>
  );
};

const DateMontage: React.FC<{ p: PhotoMontageProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg, padding: 86 }}>
      <Kicker color={pal.accent}>{p.subtitle}</Kicker>
      <div style={{ marginTop: 14, color: pal.text, fontFamily: SERIF, fontSize: 76 }}>{p.title}</div>
      <div style={{ position: "absolute", left: 100, top: 270, bottom: 100, width: 5, background: `${pal.text}44` }} />
      {Array.from({ length: 4 }, (_, i) => {
        const enter = spring({ frame: Math.max(0, frame - i * 12), fps, config: { damping: 14, stiffness: 125 } });
        return <div key={i} style={{ position: "absolute", left: 70, top: 310 + i * 160, display: "flex", gap: 36, alignItems: "center", opacity: enter, transform: `translateX(${interpolate(enter, [0, 1], [-100, 0])}px)` }}><div style={{ width: 64, height: 64, borderRadius: "50%", background: pal.accent, border: `10px solid ${pal.bg}` }} /><div style={{ color: pal.secondary, fontFamily: SANS, fontSize: 21, letterSpacing: "0.14em", width: 150 }}>{dateAt(p, i)}</div><Tile p={p} pal={pal} index={i} style={{ width: 230, height: 112 }} radius={6} label={false} /><div style={{ color: pal.text, fontFamily: SERIF, fontSize: 30, width: 560 }}>{captionAt(p, i)}</div></div>;
      })}
    </AbsoluteFill>
  );
};

const PortraitWall: React.FC<{ p: PhotoMontageProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${pal.bg}, ${pal.primary}1c)`, padding: 78, overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}><div><Kicker color={pal.secondary}>PORTRAIT WALL</Kicker><div style={{ marginTop: 10, color: pal.text, fontFamily: SERIF, fontSize: 68 }}>{p.title}</div></div><div style={{ color: `${pal.text}88`, fontFamily: SANS, fontSize: 20 }}>{p.subtitle}</div></div>
      <div style={{ flex: 1, display: "flex", gap: 16, alignItems: "stretch" }}>
        {Array.from({ length: 6 }, (_, i) => { const enter = spring({ frame: Math.max(0, frame - i * 6), fps, config: { damping: 13, stiffness: 135 } }); return <Tile key={i} p={p} pal={pal} index={i} style={{ flex: 1, opacity: enter, transform: `translateY(${interpolate(enter, [0, 1], [120, 0])}px)`, minWidth: 0 }} label={i === 5} radius={5} />; })}
      </div>
    </AbsoluteFill>
  );
};

const TriptychReel: React.FC<{ p: PhotoMontageProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#090909", padding: 74, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 82, top: 68, zIndex: 2 }}><Kicker color={pal.accent}>TRIPTYCH / {p.subtitle}</Kicker></div>
      <div style={{ position: "absolute", left: 74, right: 74, top: 174, bottom: 100, display: "flex", gap: 18 }}>
        {Array.from({ length: 3 }, (_, i) => { const enter = spring({ frame: Math.max(0, frame - i * 11), fps, config: { damping: 14, stiffness: 120 } }); return <Tile key={i} p={p} pal={pal} index={i} style={{ flex: 1, opacity: enter, transform: `scaleY(${interpolate(enter, [0, 1], [0.2, 1])})`, transformOrigin: "bottom" }} label={false} radius={6} />; })}
      </div>
      <div style={{ position: "absolute", left: 82, bottom: 48, color: pal.text, fontFamily: SERIF, fontSize: 42 }}>{p.title}</div>
      <div style={{ position: "absolute", right: 82, bottom: 58, color: `${pal.text}88`, fontFamily: SANS, fontSize: 20, letterSpacing: "0.14em" }}>{captionAt(p, 1)}</div>
    </AbsoluteFill>
  );
};

const PhotoFinale: React.FC<{ p: PhotoMontageProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const reveal = clampInterp(frame, [0, 36], [0, 1]);
  const outro = clampInterp(frame, [durationInFrames - 34, durationInFrames], [1, 0]);
  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg }}>
      <Tile p={p} pal={pal} index={0} radius={0} label={false} darken={0.15} style={{ position: "absolute", inset: 0, opacity: reveal * outro }} imageTransform={`scale(${interpolate(reveal, [0, 1], [1.2, 1.04])})`} />
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${pal.bg}ee, transparent 80%)`, opacity: reveal * outro }} />
      <div style={{ position: "absolute", left: 112, bottom: 128, maxWidth: 900, opacity: reveal * outro, transform: `translateY(${interpolate(reveal, [0, 1], [45, 0])}px)` }}><Kicker color={pal.accent}>{p.subtitle}</Kicker><div style={{ marginTop: 16, color: pal.text, fontFamily: SERIF, fontSize: 92, lineHeight: 0.98 }}>{p.title}</div><div style={{ marginTop: 24, color: `${pal.text}bb`, fontFamily: SANS, fontSize: 26 }}>{captionAt(p, 0)} / {dateAt(p, 0)}</div></div>
      <div style={{ position: "absolute", right: 84, bottom: 76, display: "flex", gap: 8, opacity: reveal }}>{Array.from({ length: 5 }, (_, i) => <div key={i} style={{ width: 48, height: 3, background: i === 0 ? pal.accent : `${pal.text}55` }} />)}</div>
      <NoiseGrainOverlay opacity={0.045} />
    </AbsoluteFill>
  );
};

const VARIANTS: Record<PhotoMontageVariant, React.FC<{ p: PhotoMontageProps; pal: Palette }>> = {
  "contact-sheet": ContactSheet,
  "photo-wipe": PhotoWipe,
  "grid-montage": GridMontage,
  "memory-flash": MemoryFlash,
  "photo-ribbon": PhotoRibbon,
  "album-turn": AlbumTurn,
  "date-montage": DateMontage,
  "portrait-wall": PortraitWall,
  "triptych-reel": TriptychReel,
  "photo-finale": PhotoFinale,
};

export const PhotoMontageTemplate: React.FC<PhotoMontageProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? ContactSheet;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <AbsoluteFill style={{ backgroundColor: pal.bg }}><FadeEdges inFrames={10} outFrames={14}><div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><Variant p={props} pal={pal} /></div></FadeEdges></AbsoluteFill>;
};

const familyCast = (c: React.FC<PhotoMontageProps>) => c as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "photo-montage-contact-sheet": familyCast(PhotoMontageTemplate),
  "photo-montage-photo-wipe": familyCast(PhotoMontageTemplate),
  "photo-montage-grid-montage": familyCast(PhotoMontageTemplate),
  "photo-montage-memory-flash": familyCast(PhotoMontageTemplate),
  "photo-montage-photo-ribbon": familyCast(PhotoMontageTemplate),
  "photo-montage-album-turn": familyCast(PhotoMontageTemplate),
  "photo-montage-date-montage": familyCast(PhotoMontageTemplate),
  "photo-montage-portrait-wall": familyCast(PhotoMontageTemplate),
  "photo-montage-triptych-reel": familyCast(PhotoMontageTemplate),
  "photo-montage-photo-finale": familyCast(PhotoMontageTemplate),
};
