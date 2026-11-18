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
 * FAMILY: podcast-audio
 * Ten structurally distinct podcast and audio identities. Every waveform and
 * level display is generated from deterministic seeded noise plus sine bands;
 * no audio source is required.
 */

type PodcastVariant =
  | "episode-card"
  | "dual-host"
  | "vinyl-record"
  | "full-visualizer"
  | "mic-pulse"
  | "episode-number"
  | "guest-intro"
  | "live-meter"
  | "chapter-timeline"
  | "cassette-player";

export interface PodcastProps {
  variant: PodcastVariant;
  showName: string;
  episodeTitle: string;
  guestName: string;
  hostOne: string;
  hostTwo: string;
  episodeNumber: string;
  topic: string;
  chapters: string[];
  paletteName: string;
}

const FONT = '"Inter", "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", "SF Mono", Menlo, Consolas, monospace';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const displayTime = (frame: number, fps: number) => {
  const total = Math.max(0, Math.floor(frame / fps));
  const minutes = Math.floor(total / 60).toString().padStart(2, "0");
  const seconds = (total % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

// Closed-form deterministic waveform: seeded base profile + two sine bands.
const waveHeight = (i: number, frame: number, seed: number, activity = 1) => {
  const grain = seededRand(seed * 997 + i * 17);
  const slow = Math.abs(Math.sin(frame * 0.075 + i * 0.39 + seed));
  const fast = Math.abs(Math.sin(frame * 0.17 - i * 0.23 + seed * 1.7));
  return Math.min(1, (0.12 + grain * 0.24 + slow * 0.42 + fast * 0.22) * activity);
};

const Waveform: React.FC<{
  color: string;
  bars?: number;
  seed?: number;
  height?: number;
  gap?: number;
  rounded?: boolean;
  mirror?: boolean;
  activity?: number;
  opacity?: number;
}> = ({
  color,
  bars = 64,
  seed = 1,
  height = 180,
  gap = 7,
  rounded = true,
  mirror = false,
  activity = 1,
  opacity = 1,
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height,
        gap,
        opacity,
      }}
    >
      {Array.from({ length: bars }, (_, i) => {
        const h = waveHeight(i, frame, seed, activity);
        return (
          <div
            key={`wave-${seed}-${i}`}
            style={{
              flex: "1 1 0",
              maxWidth: 20,
              minWidth: 2,
              height: Math.max(3, h * height * (mirror ? 0.48 : 0.92)),
              borderRadius: rounded ? 999 : 2,
              background: color,
              boxShadow: `0 0 ${8 + h * 18}px ${color}55`,
            }}
          />
        );
      })}
    </div>
  );
};

const Eyebrow: React.FC<{ children: React.ReactNode; color: string }> = ({ children, color }) => (
  <div
    style={{
      color,
      fontFamily: MONO,
      fontSize: 23,
      fontWeight: 700,
      letterSpacing: "0.24em",
      textTransform: "uppercase",
    }}
  >
    {children}
  </div>
);

const PlayButton: React.FC<{ pal: Palette; size?: number }> = ({ pal, size = 84 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: pal.accent,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      boxShadow: `0 16px 45px ${pal.accent}55`,
    }}
  >
    <div
      style={{
        width: 0,
        height: 0,
        borderTop: `${size * 0.16}px solid transparent`,
        borderBottom: `${size * 0.16}px solid transparent`,
        borderLeft: `${size * 0.25}px solid ${pal.bg}`,
        marginLeft: size * 0.08,
      }}
    />
  </div>
);

// ---------------- episode card with waveform underlay ----------------
const EpisodeCard: React.FC<{ p: PodcastProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 105 } });
  return (
    <AbsoluteFill style={{ padding: 110, justifyContent: "center" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 350, opacity: 0.17 }}>
        <Waveform color={pal.secondary} bars={92} height={370} gap={6} seed={11} />
      </div>
      <div
        style={{
          width: 1260,
          minHeight: 640,
          margin: "0 auto",
          padding: "72px 82px",
          border: `1px solid ${pal.text}24`,
          borderRadius: 36,
          background: `${pal.bg}df`,
          boxShadow: `0 45px 120px #00000066`,
          backdropFilter: "blur(26px)",
          transform: `translateY(${interpolate(enter, [0, 1], [70, 0])}px) scale(${interpolate(enter, [0, 1], [0.94, 1])})`,
          opacity: enter,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Eyebrow color={pal.primary}>{p.showName}</Eyebrow>
          <span style={{ fontFamily: MONO, color: pal.secondary, fontSize: 22 }}>EP {p.episodeNumber}</span>
        </div>
        <h1 style={{ margin: "70px 0 34px", maxWidth: 1000, color: pal.text, fontFamily: FONT, fontSize: 86, lineHeight: 0.98, letterSpacing: "-0.045em" }}>
          {p.episodeTitle}
        </h1>
        <div style={{ color: `${pal.text}99`, fontFamily: FONT, fontSize: 30 }}>with {p.guestName}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 30, marginTop: 70 }}>
          <PlayButton pal={pal} size={76} />
          <div style={{ flex: 1 }}><Waveform color={pal.primary} bars={48} height={90} gap={5} seed={12} /></div>
          <span style={{ color: pal.secondary, fontFamily: MONO, fontSize: 21 }}>{displayTime(frame, fps)}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- two hosts, two independent waveform lanes ----------------
const DualHost: React.FC<{ p: PodcastProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hosts = [
    { name: p.hostOne, color: pal.primary, seed: 21 },
    { name: p.hostTwo, color: pal.accent, seed: 22 },
  ];
  return (
    <AbsoluteFill style={{ flexDirection: "row" }}>
      {hosts.map((host, i) => {
        const enter = spring({ frame: frame - i * 8, fps, config: { damping: 18, stiffness: 90 } });
        return (
          <div
            key={host.name}
            style={{
              width: "50%",
              padding: "90px 72px",
              borderRight: i === 0 ? `1px solid ${pal.text}22` : undefined,
              background: i === 0 ? `${pal.primary}0d` : `${pal.accent}0d`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              transform: `translateX(${interpolate(enter, [0, 1], [i === 0 ? -100 : 100, 0])}px)`,
              opacity: enter,
            }}
          >
            <div style={{ width: 244, height: 244, borderRadius: "50%", border: `4px solid ${host.color}`, display: "flex", alignItems: "center", justifyContent: "center", color: pal.text, font: `800 78px ${FONT}`, boxShadow: `0 0 80px ${host.color}33`, background: `${host.color}18` }}>
              {initials(host.name)}
            </div>
            <div style={{ marginTop: 36, color: pal.text, font: `700 43px ${FONT}` }}>{host.name}</div>
            <div style={{ width: "86%", marginTop: 40 }}>
              <Waveform color={host.color} bars={38} height={125} gap={6} seed={host.seed} activity={i === Math.floor(frame / 48) % 2 ? 1 : 0.45} />
            </div>
          </div>
        );
      })}
      <div style={{ position: "absolute", top: 48, left: 0, right: 0, textAlign: "center", color: pal.secondary, font: `700 22px ${MONO}`, letterSpacing: "0.25em" }}>{p.showName.toUpperCase()}</div>
      <div style={{ position: "absolute", bottom: 55, left: 0, right: 0, textAlign: "center", color: pal.text, font: `600 31px ${FONT}` }}>{p.episodeTitle}</div>
    </AbsoluteFill>
  );
};

// ---------------- vinyl record deck with spinning grooves and tonearm ----------------
const VinylRecord: React.FC<{ p: PodcastProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });
  const rotation = frame * 2.6;
  return (
    <AbsoluteFill style={{ padding: "90px 120px", flexDirection: "row", alignItems: "center" }}>
      <div style={{ width: "53%", position: "relative", height: 790, transform: `scale(${interpolate(enter, [0, 1], [0.7, 1])})`, opacity: enter }}>
        <div style={{ position: "absolute", width: 690, height: 690, left: 25, top: 48, borderRadius: "50%", background: `repeating-radial-gradient(circle, #17171b 0 5px, #08080a 6px 10px)`, boxShadow: "0 40px 90px #000000aa", transform: `rotate(${rotation}deg)` }}>
          <div style={{ position: "absolute", inset: 214, borderRadius: "50%", background: pal.primary, display: "flex", alignItems: "center", justifyContent: "center", color: pal.bg, font: `900 26px ${FONT}`, textAlign: "center", padding: 20, transform: `rotate(${-rotation}deg)` }}>{p.showName}</div>
          <div style={{ position: "absolute", inset: 328, borderRadius: "50%", background: pal.text }} />
        </div>
        <div style={{ position: "absolute", width: 34, height: 500, right: 70, top: 48, borderRadius: 999, background: `linear-gradient(90deg, ${pal.secondary}, ${pal.text}, ${pal.secondary})`, transformOrigin: "17px 30px", transform: `rotate(${18 + Math.sin(frame * 0.018) * 2}deg)`, boxShadow: "0 8px 22px #0008" }}>
          <div style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", left: -43, top: -18, background: pal.secondary, border: `12px solid ${pal.bg}` }} />
          <div style={{ position: "absolute", width: 70, height: 42, borderRadius: 8, left: -18, bottom: -12, background: pal.accent }} />
        </div>
      </div>
      <div style={{ flex: 1, paddingLeft: 70 }}>
        <Eyebrow color={pal.accent}>Now spinning · EP {p.episodeNumber}</Eyebrow>
        <h1 style={{ margin: "46px 0 30px", color: pal.text, font: `800 82px/0.98 ${FONT}`, letterSpacing: "-0.045em" }}>{p.episodeTitle}</h1>
        <div style={{ color: pal.secondary, font: `400 31px ${FONT}` }}>{p.guestName}</div>
        <div style={{ marginTop: 72, width: 580 }}><Waveform color={pal.primary} bars={44} height={110} gap={6} seed={31} /></div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- full-bleed visualizer bars ----------------
const FullVisualizer: React.FC<{ p: PodcastProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = frame / Math.max(1, durationInFrames - 1);
  return (
    <AbsoluteFill style={{ justifyContent: "center", overflow: "hidden", background: `linear-gradient(135deg, ${pal.bg}, ${pal.primary}22)` }}>
      <div style={{ position: "absolute", inset: "7% 3%", display: "flex", alignItems: "center", gap: 5 }}>
        {Array.from({ length: 104 }, (_, i) => {
          const h = waveHeight(i, frame, 41, 1);
          const passed = i / 103 <= progress;
          return <div key={i} style={{ flex: 1, height: `${13 + h * 83}%`, borderRadius: 8, background: passed ? pal.accent : `linear-gradient(${pal.primary}, ${pal.secondary})`, opacity: passed ? 1 : 0.52, boxShadow: `0 0 ${h * 30}px ${passed ? pal.accent : pal.primary}66` }} />;
        })}
      </div>
      <div style={{ position: "relative", textAlign: "center", padding: "60px 90px", background: `${pal.bg}c9`, backdropFilter: "blur(18px)", borderTop: `1px solid ${pal.text}22`, borderBottom: `1px solid ${pal.text}22` }}>
        <Eyebrow color={pal.secondary}>{p.showName} · {p.episodeNumber}</Eyebrow>
        <h1 style={{ margin: "24px 0 12px", color: pal.text, font: `900 96px/1 ${FONT}`, letterSpacing: "-0.05em" }}>{p.episodeTitle}</h1>
        <div style={{ color: pal.accent, font: `600 27px ${MONO}` }}>{Math.round(progress * 100).toString().padStart(2, "0")}% PLAYED</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- minimal microphone silhouette and pulse rings ----------------
const MicPulse: React.FC<{ p: PodcastProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const pulse = (frame % 48) / 48;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: pal.bg }}>
      {[0, 1, 2].map((i) => {
        const t = (pulse + i / 3) % 1;
        return <div key={i} style={{ position: "absolute", width: 290 + t * 520, height: 290 + t * 520, borderRadius: "50%", border: `3px solid ${pal.primary}`, opacity: (1 - t) * 0.45 }} />;
      })}
      <div style={{ position: "relative", width: 220, height: 370 }}>
        <div style={{ position: "absolute", left: 45, top: 0, width: 130, height: 245, borderRadius: 80, background: pal.text, boxShadow: `0 0 65px ${pal.primary}55` }}>
          {Array.from({ length: 6 }, (_, i) => <div key={i} style={{ position: "absolute", left: 25, right: 25, top: 42 + i * 29, height: 5, background: pal.bg, borderRadius: 3, opacity: 0.65 }} />)}
        </div>
        <div style={{ position: "absolute", left: 17, top: 118, width: 186, height: 175, border: `14px solid ${pal.accent}`, borderTop: 0, borderRadius: "0 0 105px 105px" }} />
        <div style={{ position: "absolute", left: 101, top: 286, width: 18, height: 62, background: pal.accent }} />
        <div style={{ position: "absolute", left: 57, bottom: 4, width: 106, height: 18, borderRadius: 10, background: pal.accent }} />
      </div>
      <div style={{ position: "absolute", left: 110, top: 110, maxWidth: 540 }}>
        <Eyebrow color={pal.primary}>{p.showName}</Eyebrow>
        <div style={{ marginTop: 24, color: pal.text, font: `800 61px/1.03 ${FONT}`, letterSpacing: "-0.035em" }}>{p.episodeTitle}</div>
      </div>
      <div style={{ position: "absolute", right: 110, bottom: 105, color: pal.secondary, font: `500 27px ${FONT}`, textAlign: "right" }}>A conversation with<br/><strong style={{ color: pal.text }}>{p.guestName}</strong></div>
    </AbsoluteFill>
  );
};

// ---------------- giant episode numeral and looping topic ticker ----------------
const EpisodeNumber: React.FC<{ p: PodcastProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const tickerX = -((frame * 5.5) % (width * 1.6));
  const num = p.episodeNumber.replace(/^0+/, "") || "0";
  return (
    <AbsoluteFill style={{ overflow: "hidden", padding: "70px 95px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Eyebrow color={pal.accent}>{p.showName}</Eyebrow>
        <span style={{ color: pal.secondary, font: `600 22px ${MONO}` }}>NEW EPISODE</span>
      </div>
      <div style={{ position: "absolute", left: 55, bottom: 78, color: `${pal.primary}24`, font: `900 780px/0.75 ${FONT}`, letterSpacing: "-0.12em" }}>{num}</div>
      <div style={{ position: "absolute", width: 830, right: 110, top: 240, zIndex: 2 }}>
        <div style={{ color: pal.accent, font: `700 25px ${MONO}`, letterSpacing: "0.18em" }}>EPISODE {p.episodeNumber}</div>
        <h1 style={{ margin: "28px 0", color: pal.text, font: `900 88px/0.98 ${FONT}`, letterSpacing: "-0.05em" }}>{p.episodeTitle}</h1>
        <div style={{ color: pal.secondary, font: `400 29px ${FONT}` }}>Featuring {p.guestName}</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 96, background: pal.accent, display: "flex", alignItems: "center", overflow: "hidden" }}>
        <div style={{ whiteSpace: "nowrap", transform: `translateX(${tickerX}px)`, color: pal.bg, font: `900 33px ${FONT}`, letterSpacing: "0.06em" }}>{`${p.topic.toUpperCase()}  ✦  `.repeat(16)}</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- guest intro with graphic portrait field ----------------
const GuestIntro: React.FC<{ p: PodcastProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({ frame, fps, config: { damping: 18, stiffness: 75 } });
  return (
    <AbsoluteFill style={{ flexDirection: "row", padding: 72 }}>
      <div style={{ width: "45%", position: "relative", overflow: "hidden", borderRadius: 34, background: `linear-gradient(145deg, ${pal.primary}, ${pal.accent})`, transform: `translateX(${interpolate(reveal, [0, 1], [-150, 0])}px)` }}>
        <div style={{ position: "absolute", width: 530, height: 530, left: 160, top: 115, borderRadius: "50%", background: `${pal.bg}55`, border: `2px solid ${pal.text}55` }} />
        <div style={{ position: "absolute", width: 250, height: 250, left: 300, top: 190, borderRadius: "50%", background: pal.bg, display: "flex", alignItems: "center", justifyContent: "center", color: pal.text, font: `900 91px ${FONT}` }}>{initials(p.guestName)}</div>
        <div style={{ position: "absolute", width: 520, height: 390, left: 165, top: 515, borderRadius: "50% 50% 0 0", background: pal.bg }} />
        <div style={{ position: "absolute", inset: 28, border: `1px solid ${pal.text}44`, borderRadius: 24 }} />
      </div>
      <div style={{ flex: 1, padding: "95px 75px 50px 105px", display: "flex", flexDirection: "column", justifyContent: "center", opacity: reveal, transform: `translateY(${interpolate(reveal, [0, 1], [55, 0])}px)` }}>
        <Eyebrow color={pal.accent}>{p.showName} presents</Eyebrow>
        <div style={{ marginTop: 60, color: pal.secondary, font: `500 28px ${MONO}` }}>MEET THE GUEST</div>
        <h1 style={{ margin: "18px 0 34px", color: pal.text, font: `900 108px/0.92 ${FONT}`, letterSpacing: "-0.055em" }}>{p.guestName}</h1>
        <div style={{ maxWidth: 670, color: `${pal.text}bb`, font: `500 38px/1.25 ${FONT}` }}>{p.episodeTitle}</div>
        <div style={{ marginTop: 60 }}><Waveform color={pal.primary} bars={46} height={100} gap={6} seed={71} /></div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- live broadcast badge, waveform, and LED level meter ----------------
const LiveMeter: React.FC<{ p: PodcastProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const active = Math.max(2, Math.round(waveHeight(5, frame, 81) * 18));
  return (
    <AbsoluteFill style={{ padding: "65px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Eyebrow color={pal.secondary}>{p.showName}</Eyebrow>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 24px", borderRadius: 999, background: pal.accent, color: pal.bg, font: `900 23px ${MONO}`, letterSpacing: "0.12em", opacity: frame % 24 < 18 ? 1 : 0.62 }}>
          <span style={{ width: 13, height: 13, borderRadius: "50%", background: pal.bg }} /> LIVE
        </div>
      </div>
      <div style={{ display: "flex", height: 790, alignItems: "center" }}>
        <div style={{ flex: "1 1 0", minWidth: 0, maxWidth: 1220, paddingRight: 90 }}>
          <div style={{ color: pal.accent, font: `700 24px ${MONO}` }}>ON AIR · {displayTime(frame, fps)}</div>
          <h1 style={{ margin: "35px 0 20px", maxWidth: 1080, color: pal.text, font: `900 76px/1.04 ${FONT}`, letterSpacing: "-0.05em", overflowWrap: "break-word" }}>{p.episodeTitle}</h1>
          <div style={{ color: pal.secondary, font: `500 31px ${FONT}`, maxWidth: 1080, overflowWrap: "break-word" }}>{p.hostOne} + {p.guestName}</div>
          <div style={{ marginTop: 65 }}><Waveform color={pal.primary} bars={58} height={150} gap={6} seed={82} /></div>
        </div>
        <div style={{ width: 300, height: 670, padding: 36, borderRadius: 28, border: `1px solid ${pal.text}22`, background: `${pal.text}08`, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ color: pal.secondary, font: `700 18px ${MONO}`, letterSpacing: "0.18em" }}>INPUT LEVEL</span>
          <div style={{ flex: 1, display: "flex", flexDirection: "column-reverse", justifyContent: "center", gap: 9, width: 120, padding: "28px 0" }}>
            {Array.from({ length: 20 }, (_, i) => {
              const color = i > 16 ? pal.accent : i > 12 ? "#ffd166" : pal.primary;
              return <div key={i} style={{ height: 15, borderRadius: 4, background: i < active ? color : `${pal.text}12`, boxShadow: i < active ? `0 0 14px ${color}` : undefined }} />;
            })}
          </div>
          <div style={{ color: pal.text, font: `800 27px ${MONO}` }}>−{Math.max(1, 22 - active)} dB</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- chapter marker timeline ----------------
const ChapterTimeline: React.FC<{ p: PodcastProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const chapters = p.chapters.length > 0 ? p.chapters.slice(0, 5) : ["Intro", "Story", "Takeaways"];
  const progress = clampInterp(frame, [8, durationInFrames - 14], [0, 1]);
  return (
    <AbsoluteFill style={{ padding: "80px 100px", justifyContent: "space-between" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Eyebrow color={pal.primary}>{p.showName}</Eyebrow>
        <span style={{ color: pal.secondary, font: `600 21px ${MONO}` }}>EP {p.episodeNumber}</span>
      </div>
      <div>
        <h1 style={{ margin: 0, maxWidth: 1180, color: pal.text, font: `850 78px/1 ${FONT}`, letterSpacing: "-0.045em" }}>{p.episodeTitle}</h1>
        <div style={{ marginTop: 28, color: pal.accent, font: `500 29px ${FONT}` }}>{p.guestName}</div>
      </div>
      <div style={{ position: "relative", height: 360, paddingTop: 50 }}>
        <div style={{ position: "absolute", top: 127, left: 0, right: 0, height: 4, background: `${pal.text}22` }} />
        <div style={{ position: "absolute", top: 127, left: 0, width: `${progress * 100}%`, height: 4, background: pal.accent, boxShadow: `0 0 20px ${pal.accent}` }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, opacity: 0.2 }}><Waveform color={pal.secondary} bars={80} height={130} gap={7} seed={91} activity={0.55} /></div>
        <div style={{ position: "absolute", top: 0, left: 0, width: `${progress * 100}%`, overflow: "hidden" }}><div style={{ width: 1720 }}><Waveform color={pal.primary} bars={80} height={130} gap={7} seed={91} activity={0.55} /></div></div>
        <div style={{ position: "absolute", top: 104, left: `calc(${progress * 100}% - 13px)`, width: 28, height: 52, borderRadius: 20, background: pal.accent, boxShadow: `0 0 30px ${pal.accent}` }} />
        <div style={{ position: "absolute", top: 105, left: 0, right: 0, display: "flex", justifyContent: "space-between" }}>
          {chapters.map((chapter, i) => {
            const at = chapters.length === 1 ? 0 : i / (chapters.length - 1);
            const passed = progress >= at;
            return (
              <div key={`${chapter}-${i}`} style={{ width: 240, textAlign: i === 0 ? "left" : i === chapters.length - 1 ? "right" : "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: passed ? pal.accent : pal.bg, border: `3px solid ${passed ? pal.accent : pal.secondary}`, marginLeft: i === 0 ? 0 : i === chapters.length - 1 ? "auto" : "auto", marginRight: i === 0 ? "auto" : i === chapters.length - 1 ? 0 : "auto", display: "flex", alignItems: "center", justifyContent: "center", color: passed ? pal.bg : pal.secondary, font: `800 17px ${MONO}` }}>{i + 1}</div>
                <div style={{ marginTop: 20, color: passed ? pal.text : `${pal.text}77`, font: `650 23px ${FONT}` }}>{chapter}</div>
                <div style={{ marginTop: 8, color: pal.secondary, font: `500 17px ${MONO}` }}>{Math.round(at * 48).toString().padStart(2, "0")}:00</div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- retro cassette player with rotating reels ----------------
const CassettePlayer: React.FC<{ p: PodcastProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const reelRotation = frame * 5;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: `linear-gradient(160deg, ${pal.bg}, ${pal.primary}22)` }}>
      <div style={{ position: "absolute", top: 64, left: 78 }}><Eyebrow color={pal.accent}>{p.showName}</Eyebrow></div>
      <div style={{ width: 1220, height: 680, padding: "48px 62px", borderRadius: 48, background: pal.secondary, border: `8px solid ${pal.text}`, boxShadow: "18px 28px 0 #00000055", color: pal.bg, transform: `rotate(${Math.sin(frame * 0.02) * 0.4}deg)` }}>
        <div style={{ height: 150, borderRadius: 16, background: pal.text, padding: "26px 38px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: pal.bg, font: `900 26px ${MONO}` }}><span>EP {p.episodeNumber}</span><span>STEREO</span></div>
          <div style={{ color: pal.bg, font: `800 35px ${FONT}`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.episodeTitle}</div>
        </div>
        <div style={{ position: "relative", margin: "38px auto 0", width: 910, height: 330, borderRadius: 28, background: pal.bg, border: `10px solid ${pal.text}`, display: "flex", alignItems: "center", justifyContent: "space-around" }}>
          {[0, 1].map((i) => (
            <div key={i} style={{ width: 210, height: 210, borderRadius: "50%", background: `repeating-conic-gradient(${pal.primary} 0deg 12deg, ${pal.text} 12deg 24deg)`, border: `18px solid ${pal.secondary}`, transform: `rotate(${i ? -reelRotation : reelRotation}deg)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 58, height: 58, borderRadius: "50%", background: pal.bg, border: `8px solid ${pal.text}` }} />
            </div>
          ))}
          <div style={{ position: "absolute", left: 204, right: 204, bottom: 25, height: 55, borderRadius: 12, background: `${pal.secondary}44`, border: `2px solid ${pal.secondary}` }} />
          <div style={{ position: "absolute", left: 290, right: 290, top: 125 }}><Waveform color={pal.accent} bars={24} height={74} gap={4} seed={101} /></div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 31, color: pal.bg, font: `900 21px ${MONO}`, letterSpacing: "0.1em" }}><span>TYPE I · NORMAL BIAS</span><span>60 MIN · {p.guestName}</span></div>
      </div>
      <div style={{ position: "absolute", bottom: 28, left: 0, right: 0, textAlign: "center", color: `${pal.text}88`, font: `500 18px ${MONO}`, letterSpacing: "0.22em" }}>PLAY  ▶  ·  PROCEDURAL AUDIO EDITION</div>
      <NoiseGrainOverlay opacity={0.045} />
    </AbsoluteFill>
  );
};

const VARIANTS: Record<PodcastVariant, React.FC<{ p: PodcastProps; pal: Palette }>> = {
  "episode-card": EpisodeCard,
  "dual-host": DualHost,
  "vinyl-record": VinylRecord,
  "full-visualizer": FullVisualizer,
  "mic-pulse": MicPulse,
  "episode-number": EpisodeNumber,
  "guest-intro": GuestIntro,
  "live-meter": LiveMeter,
  "chapter-timeline": ChapterTimeline,
  "cassette-player": CassettePlayer,
};

export const PodcastAudioTemplate: React.FC<PodcastProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? EpisodeCard;
  const meshVariants: PodcastVariant[] = ["episode-card", "dual-host", "vinyl-record", "guest-intro", "live-meter", "chapter-timeline"];
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return (
    <AbsoluteFill style={{ background: pal.bg, fontFamily: FONT }}>
      {meshVariants.includes(props.variant) ? <GradientMeshBackground palette={pal} blobs={4} speed={0.55} /> : null}
      <FadeEdges inFrames={12} outFrames={14}>
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}>
        <Variant p={props} pal={pal} />
        </div>
      </FadeEdges>
    </AbsoluteFill>
  );
};

const familyCast = (component: React.FC<PodcastProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "podcast-episode-card-waveform": familyCast(PodcastAudioTemplate),
  "podcast-dual-host-dialogue": familyCast(PodcastAudioTemplate),
  "podcast-vinyl-record-spin": familyCast(PodcastAudioTemplate),
  "podcast-full-bleed-visualizer": familyCast(PodcastAudioTemplate),
  "podcast-mic-pulse-minimal": familyCast(PodcastAudioTemplate),
  "podcast-giant-episode-ticker": familyCast(PodcastAudioTemplate),
  "podcast-guest-intro-card": familyCast(PodcastAudioTemplate),
  "podcast-live-level-meter": familyCast(PodcastAudioTemplate),
  "podcast-chapter-marker-timeline": familyCast(PodcastAudioTemplate),
  "podcast-cassette-retro-player": familyCast(PodcastAudioTemplate),
};
