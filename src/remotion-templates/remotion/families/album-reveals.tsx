import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, GradientMeshBackground, NoiseGrainOverlay, resolvePalette, seededRand, type Palette } from "../lib/primitives";

export type AlbumRevealVariant =
  | "cover-reveal" | "tracklist-scroll" | "vinyl-drop" | "release-date" | "side-a-side-b"
  | "artist-title" | "limited-edition" | "back-cover" | "single-launch" | "album-loop";

export interface AlbumRevealProps {
  variant: AlbumRevealVariant;
  album: string;
  artist: string;
  tracks: string[];
  releaseDate: string;
  label: string;
  coverUrl: string;
  paletteName: string;
  texture: string;
  /** Fixed calendar year used for deterministic back-cover credits. */
  copyrightYear: number;
}

const FONT = '"Inter", "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Menlo, Consolas, monospace';
const safeTracks = (tracks: string[]) => (tracks?.length ? tracks : ["Opening", "Second Light", "Interlude", "Afterglow", "Finale"]);

const Artwork: React.FC<{ p: AlbumRevealProps; pal: Palette; size?: number; rotate?: number }> = ({ p, pal, size = 480, rotate = 0 }) => (
  <div style={{ width: size, height: size, transform: `rotate(${rotate}deg)`, background: `linear-gradient(135deg, ${pal.primary}, ${pal.accent} 48%, ${pal.secondary})`, boxShadow: `0 ${size * .08}px ${size * .25}px #0008`, overflow: "hidden", position: "relative", flexShrink: 0 }}>
    {p.coverUrl ? <Img src={p.coverUrl} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : null}
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 25% 22%, #ffffff66, transparent 26%), repeating-linear-gradient(135deg, transparent 0 32px, #ffffff16 33px 35px)", mixBlendMode: "screen" }} />
    {!p.coverUrl ? <div style={{ position: "absolute", left: size * .08, right: size * .08, bottom: size * .09, color: pal.text, font: `850 ${Math.max(26, size * .075)}px/0.92 ${FONT}`, letterSpacing: "-0.06em" }}>{p.album}</div> : null}
  </div>
);

const Header: React.FC<{ p: AlbumRevealProps; pal: Palette; light?: boolean }> = ({ p, pal, light = false }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", color: light ? pal.bg : pal.text, fontFamily: MONO, fontSize: 20, letterSpacing: "0.16em", textTransform: "uppercase" }}>
    <span>{p.artist}</span><span>{p.label || "INDEPENDENT"}</span>
  </div>
);

const CoverReveal: React.FC<{ p: AlbumRevealProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 90 } });
  return <AbsoluteFill style={{ padding: 86, justifyContent: "center" }}><Header p={p} pal={pal} />
    <div style={{ display: "flex", alignItems: "center", gap: 100, justifyContent: "center", transform: `translateY(${interpolate(enter, [0, 1], [100, 0])}px)`, opacity: enter }}>
      <Artwork p={p} pal={pal} size={610} rotate={interpolate(enter, [0, 1], [-8, -2])} />
      <div style={{ maxWidth: 620 }}><div style={{ color: pal.secondary, font: `700 24px ${MONO}`, letterSpacing: "0.2em" }}>NEW ALBUM</div><h1 style={{ color: pal.text, font: `850 92px/0.92 ${FONT}`, letterSpacing: "-0.07em", margin: "22px 0" }}>{p.album}</h1><div style={{ color: pal.accent, font: `600 34px ${FONT}` }}>{p.releaseDate}</div></div>
    </div></AbsoluteFill>;
};

const TracklistScroll: React.FC<{ p: AlbumRevealProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const tracks = safeTracks(p.tracks); const offset = interpolate(frame, [0, 120], [80, -tracks.length * 42], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ padding: 88 }}><Header p={p} pal={pal} /><div style={{ display: "flex", gap: 100, marginTop: 80 }}><Artwork p={p} pal={pal} size={370} /><div style={{ flex: 1, overflow: "hidden", height: 610, position: "relative" }}><div style={{ transform: `translateY(${offset}px)` }}>{tracks.map((t, i) => <div key={`${t}-${i}`} style={{ display: "flex", gap: 32, alignItems: "baseline", borderBottom: `1px solid ${pal.text}22`, padding: "20px 0", color: pal.text, font: `600 39px ${FONT}` }}><span style={{ color: pal.accent, font: `600 20px ${MONO}`, width: 44 }}>{String(i + 1).padStart(2, "0")}</span>{t}<span style={{ marginLeft: "auto", color: pal.secondary, font: `500 18px ${MONO}` }}>03:{String(12 + i * 7).padStart(2, "0")}</span></div>)}</div></div></div></AbsoluteFill>;
};

const VinylDrop: React.FC<{ p: AlbumRevealProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const spin = frame * 4; const drop = interpolate(frame, [0, 40], [-400, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}><div style={{ position: "absolute", top: 70, left: 84 }}><Header p={p} pal={pal} /></div><div style={{ display: "flex", alignItems: "center", gap: 90, transform: `translateY(${drop}px)` }}><div style={{ width: 590, height: 590, borderRadius: "50%", background: `repeating-radial-gradient(circle, #15151c 0 8px, #292933 9px 11px)`, border: `18px solid #111`, transform: `rotate(${spin}deg)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 28px 80px #0009" }}><div style={{ width: 190, height: 190, borderRadius: "50%", background: `linear-gradient(135deg, ${pal.primary}, ${pal.accent})`, display: "flex", alignItems: "center", justifyContent: "center", color: pal.text, textAlign: "center", font: `750 24px ${FONT}` }}>{p.album}</div></div><div><div style={{ color: pal.secondary, font: `700 22px ${MONO}`, letterSpacing: "0.2em" }}>VINYL EDITION</div><h1 style={{ color: pal.text, font: `850 82px/0.95 ${FONT}`, maxWidth: 580, margin: "20px 0" }}>{p.album}</h1><div style={{ color: pal.accent, font: `600 32px ${FONT}` }}>{p.artist}</div></div></div></AbsoluteFill>;
};

const ReleaseDate: React.FC<{ p: AlbumRevealProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const pulse = 1 + Math.sin(frame * .08) * .035;
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}><Header p={p} pal={pal} /><div style={{ marginTop: 160, color: pal.secondary, font: `700 27px ${MONO}`, letterSpacing: "0.3em" }}>MARK YOUR CALENDAR</div><div style={{ margin: "28px 0", color: pal.text, font: `900 155px/0.85 ${FONT}`, letterSpacing: "-0.08em", transform: `scale(${pulse})` }}>{p.releaseDate}</div><div style={{ color: pal.accent, font: `650 42px ${FONT}` }}>{p.album}</div><Artwork p={p} pal={pal} size={230} rotate={-5} /></AbsoluteFill>;
};

const SideAB: React.FC<{ p: AlbumRevealProps; pal: Palette }> = ({ p, pal }) => <AbsoluteFill style={{ flexDirection: "row" }}>{["SIDE A", "SIDE B"].map((side, i) => <div key={side} style={{ flex: 1, padding: 70, background: i ? `${pal.accent}20` : `${pal.primary}24`, borderRight: i === 0 ? `1px solid ${pal.text}22` : undefined }}><div style={{ color: i ? pal.accent : pal.secondary, font: `800 25px ${MONO}`, letterSpacing: ".2em" }}>{side}</div><h2 style={{ color: pal.text, font: `850 66px ${FONT}`, margin: "44px 0" }}>{p.album}</h2>{safeTracks(p.tracks).slice(i * 3, i * 3 + 3).map((t, j) => <div key={t} style={{ color: pal.text, padding: "18px 0", borderBottom: `1px solid ${pal.text}22`, font: `600 30px ${FONT}` }}>{i * 3 + j + 1}. {t}</div>)}</div>)}</AbsoluteFill>;

const ArtistTitle: React.FC<{ p: AlbumRevealProps; pal: Palette }> = ({ p, pal }) => { const frame = useCurrentFrame(); const x = interpolate(frame, [0, 90], [100, -40]); return <AbsoluteFill style={{ justifyContent: "center", overflow: "hidden" }}><div style={{ position: "absolute", left: x + "%", whiteSpace: "nowrap", color: `${pal.text}09`, font: `900 300px ${FONT}`, letterSpacing: "-0.1em" }}>{p.artist.toUpperCase()}</div><div style={{ padding: 90 }}><div style={{ color: pal.accent, font: `700 24px ${MONO}`, letterSpacing: ".25em" }}>PRESENTS</div><h1 style={{ color: pal.text, font: `900 145px/0.82 ${FONT}`, maxWidth: 1200, margin: "28px 0" }}>{p.album}</h1><div style={{ color: pal.secondary, font: `600 41px ${FONT}` }}>{p.artist}</div></div><Artwork p={p} pal={pal} size={300} rotate={8} /></AbsoluteFill>; };

const LimitedEdition: React.FC<{ p: AlbumRevealProps; pal: Palette }> = ({ p, pal }) => <AbsoluteFill style={{ padding: 78, alignItems: "center", justifyContent: "center", border: `16px solid ${pal.accent}` }}><div style={{ position: "absolute", top: 58, left: 74, color: pal.accent, font: `800 22px ${MONO}`, letterSpacing: ".2em" }}>LIMITED EDITION · 001 / 300</div><Artwork p={p} pal={pal} size={470} rotate={-3} /><h1 style={{ color: pal.text, font: `850 74px ${FONT}`, margin: "35px 0 8px" }}>{p.album}</h1><div style={{ color: pal.secondary, font: `600 28px ${FONT}` }}>{p.artist} · {p.releaseDate}</div></AbsoluteFill>;

const BackCover: React.FC<{ p: AlbumRevealProps; pal: Palette }> = ({ p, pal }) => <AbsoluteFill style={{ padding: 100, justifyContent: "center" }}><Header p={p} pal={pal} /><div style={{ display: "flex", gap: 100, marginTop: 70 }}><div style={{ flex: 1 }}><div style={{ color: pal.secondary, font: `700 22px ${MONO}`, letterSpacing: ".2em" }}>TRACKLIST</div>{safeTracks(p.tracks).map((t, i) => <div key={t} style={{ color: pal.text, font: `550 28px ${FONT}`, padding: "11px 0" }}>{String(i + 1).padStart(2, "0")} · {t}</div>)}<div style={{ marginTop: 46, color: `${pal.text}88`, font: `500 18px ${MONO}` }}>© {p.copyrightYear} {p.label || p.artist}<br />All rights reserved.</div></div><div style={{ width: 420, height: 520, border: `2px solid ${pal.secondary}88`, padding: 30, display: "flex", flexDirection: "column", justifyContent: "space-between" }}><div style={{ color: pal.text, font: `800 34px ${FONT}` }}>{p.album}</div><div style={{ height: 160, background: `repeating-linear-gradient(90deg, ${pal.text} 0 3px, transparent 3px 8px)` }} /><div style={{ color: pal.secondary, font: `500 18px ${MONO}` }}>ALBUM · {p.releaseDate}</div></div></div></AbsoluteFill>;

const SingleLaunch: React.FC<{ p: AlbumRevealProps; pal: Palette }> = ({ p, pal }) => { const frame = useCurrentFrame(); const a = interpolate(frame, [0, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }); return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}><div style={{ color: pal.accent, font: `800 23px ${MONO}`, letterSpacing: ".25em" }}>NEW SINGLE OUT NOW</div><div style={{ margin: "38px 0", transform: `scale(${interpolate(a, [0, 1], [.7, 1])})`, opacity: a }}><Artwork p={p} pal={pal} size={410} /></div><h1 style={{ color: pal.text, font: `850 72px ${FONT}`, margin: 0 }}>{safeTracks(p.tracks)[0]}</h1><div style={{ color: pal.secondary, font: `600 30px ${FONT}`, marginTop: 18 }}>{p.artist}</div></AbsoluteFill>; };

const AlbumLoop: React.FC<{ p: AlbumRevealProps; pal: Palette }> = ({ p, pal }) => { const frame = useCurrentFrame(); const r = Math.sin(frame * .025) * 10; const y = Math.sin(frame * .05) * 18; return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}><Artwork p={p} pal={pal} size={570} rotate={r} /><div style={{ position: "absolute", bottom: 90, left: 0, right: 0, textAlign: "center", color: pal.text, font: `850 54px ${FONT}`, transform: `translateY(${y}px)` }}>{p.album}<span style={{ color: pal.accent }}> · </span>{p.artist}</div><NoiseGrainOverlay opacity={.04} /></AbsoluteFill>; };

// Variants compose on a 1920×1080 design canvas (large type + artwork with
// absolute offsets). Scale the composed canvas as one unit so headlines and
// track lists stay inside the frame at any viewport (thumbnails are 800×450).
const StageFit: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <AbsoluteFill style={{ overflow: "hidden" }}>
    <div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}>{children}</div>
  </AbsoluteFill>;
};

const VARIANTS: Record<AlbumRevealVariant, React.FC<{ p: AlbumRevealProps; pal: Palette }>> = {
  "cover-reveal": CoverReveal, "tracklist-scroll": TracklistScroll, "vinyl-drop": VinylDrop, "release-date": ReleaseDate, "side-a-side-b": SideAB,
  "artist-title": ArtistTitle, "limited-edition": LimitedEdition, "back-cover": BackCover, "single-launch": SingleLaunch, "album-loop": AlbumLoop,
};

export const AlbumRevealsTemplate: React.FC<AlbumRevealProps> = (props) => {
  const pal = resolvePalette(props.paletteName); const Variant = VARIANTS[props.variant] ?? CoverReveal;
  return <AbsoluteFill style={{ background: pal.bg, fontFamily: FONT, overflow: "hidden" }}><GradientMeshBackground palette={pal} blobs={4} speed={.45} /><FadeEdges inFrames={12} outFrames={14}><StageFit><Variant p={props} pal={pal} /></StageFit></FadeEdges></AbsoluteFill>;
};

const familyCast = (component: React.FC<AlbumRevealProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;
export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "album-reveals-cover-reveal": familyCast(AlbumRevealsTemplate), "album-reveals-tracklist-scroll": familyCast(AlbumRevealsTemplate), "album-reveals-vinyl-drop": familyCast(AlbumRevealsTemplate), "album-reveals-release-date": familyCast(AlbumRevealsTemplate), "album-reveals-side-a-side-b": familyCast(AlbumRevealsTemplate), "album-reveals-artist-title": familyCast(AlbumRevealsTemplate), "album-reveals-limited-edition": familyCast(AlbumRevealsTemplate), "album-reveals-back-cover": familyCast(AlbumRevealsTemplate), "album-reveals-single-launch": familyCast(AlbumRevealsTemplate), "album-reveals-album-loop": familyCast(AlbumRevealsTemplate),
};
