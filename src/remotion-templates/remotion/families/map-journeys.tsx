import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, GradientMeshBackground, resolvePalette, type Palette } from "../lib/primitives";

type MapJourneysVariant =
  | "route-draw"
  | "multi-stop"
  | "origin-destination"
  | "branching-route"
  | "day-by-day"
  | "flight-path"
  | "delivery-route"
  | "migration-map"
  | "walking-tour"
  | "map-to-photo";

type JourneyPoint = { x: number; y: number; label?: string; detail?: string; color?: string };

export interface MapJourneysProps {
  variant: MapJourneysVariant;
  title: string;
  subtitle: string;
  paletteName: string;
  mapStyle?: "dark" | "paper" | "terrain" | "ocean";
  stops?: JourneyPoint[];
  routePoints?: JourneyPoint[];
  labels?: string[];
  highlightStop?: number | string;
  travelTime?: string;
  speed?: number;
  showGrid?: boolean;
  showLabels?: boolean;
  imageUrls?: string[];
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const VARIANT_EYEBROW: Record<MapJourneysVariant, string> = {
  "route-draw": "JOURNEY / ROUTE DRAW",
  "multi-stop": "JOURNEY / MULTI STOP",
  "origin-destination": "JOURNEY / ORIGIN → DESTINATION",
  "branching-route": "JOURNEY / BRANCHING ROUTE",
  "day-by-day": "JOURNEY / DAY BY DAY",
  "flight-path": "JOURNEY / FLIGHT PATH",
  "delivery-route": "JOURNEY / DELIVERY ROUTE",
  "migration-map": "JOURNEY / MIGRATION MAP",
  "walking-tour": "JOURNEY / WALKING TOUR",
  "map-to-photo": "JOURNEY / MAP TO PHOTO",
};
const VARIANT_MODE: Record<MapJourneysVariant, "road" | "flight" | "branch" | "day" | "photo"> = {
  "route-draw": "road",
  "multi-stop": "road",
  "origin-destination": "road",
  "branching-route": "branch",
  "day-by-day": "day",
  "flight-path": "flight",
  "delivery-route": "road",
  "migration-map": "branch",
  "walking-tour": "photo",
  "map-to-photo": "photo",
};

const fallbackPoints: Record<MapJourneysVariant, JourneyPoint[]> = {
  "route-draw": [{ x: 235, y: 690, label: "Northport" }, { x: 430, y: 560, label: "Signal Hill" }, { x: 700, y: 620, label: "Central" }, { x: 930, y: 385, label: "Harbor" }, { x: 1250, y: 260, label: "Summit" }],
  "multi-stop": [{ x: 190, y: 650, label: "01 / Start" }, { x: 410, y: 410, label: "02 / Market" }, { x: 680, y: 570, label: "03 / Studio" }, { x: 920, y: 300, label: "04 / Park" }, { x: 1270, y: 440, label: "05 / Finish" }],
  "origin-destination": [{ x: 240, y: 590, label: "ORIGIN" }, { x: 1260, y: 355, label: "DESTINATION" }],
  "branching-route": [{ x: 230, y: 570, label: "Hub" }, { x: 520, y: 340, label: "West" }, { x: 820, y: 560, label: "East" }, { x: 1180, y: 245, label: "North" }, { x: 1240, y: 710, label: "South" }],
  "day-by-day": [{ x: 185, y: 650, label: "DAY 01" }, { x: 430, y: 400, label: "DAY 02" }, { x: 700, y: 600, label: "DAY 03" }, { x: 960, y: 350, label: "DAY 04" }, { x: 1270, y: 480, label: "DAY 05" }],
  "flight-path": [{ x: 220, y: 650, label: "SFO" }, { x: 520, y: 470, label: "DEN" }, { x: 840, y: 350, label: "CHI" }, { x: 1270, y: 470, label: "JFK" }],
  "delivery-route": [{ x: 180, y: 630, label: "WAREHOUSE" }, { x: 420, y: 450, label: "PICKUP" }, { x: 680, y: 620, label: "SORT" }, { x: 980, y: 390, label: "LAST MILE" }, { x: 1300, y: 540, label: "DOOR" }],
  "migration-map": [{ x: 180, y: 690, label: "ORIGIN" }, { x: 410, y: 520, label: "PHASE 01" }, { x: 700, y: 420, label: "PHASE 02" }, { x: 1000, y: 310, label: "PHASE 03" }, { x: 1300, y: 250, label: "NEW HOME" }],
  "walking-tour": [{ x: 230, y: 650, label: "START" }, { x: 420, y: 500, label: "CAFE" }, { x: 650, y: 570, label: "GALLERY" }, { x: 870, y: 360, label: "PLAZA" }, { x: 1180, y: 450, label: "VIEWPOINT" }],
  "map-to-photo": [{ x: 190, y: 640, label: "01" }, { x: 430, y: 430, label: "02" }, { x: 700, y: 580, label: "03" }, { x: 1000, y: 320, label: "04" }, { x: 1280, y: 470, label: "05" }],
};

const pointList = (p: MapJourneysProps): JourneyPoint[] => {
  const supplied = p.routePoints?.length ? p.routePoints : p.stops;
  return (supplied?.length ? supplied : fallbackPoints[p.variant]).slice(0, 12);
};

const mapColors = (p: MapJourneysProps, pal: Palette) => {
  // These paper-map variants place a light map directly beneath white editorial copy.
  // Use a stronger terrain contrast so routes, labels, and stops remain readable at
  // the catalog frame without making the paper treatment look like a dark theme.
  const highContrastPaper = p.variant === "multi-stop" || p.variant === "day-by-day" || p.variant === "walking-tour";
  if (p.mapStyle === "paper") {
    if (highContrastPaper) return { land: "#d1c4ae", land2: "#a48f76", water: "#8db5bb", road: "#4d514b", text: "#182326" };
    return { land: "#e8e1d5", land2: "#d8cfbf", water: "#c7dce0", road: "#8c8170", text: "#28241f" };
  }
  if (p.mapStyle === "terrain") return { land: `${pal.primary}30`, land2: `${pal.secondary}25`, water: `${pal.secondary}18`, road: `${pal.secondary}80`, text: pal.text };
  if (p.mapStyle === "ocean") return { land: "#12384a", land2: "#1d5868", water: "#062333", road: `${pal.secondary}a0`, text: pal.text };
  return { land: `${pal.primary}28`, land2: `${pal.secondary}18`, water: `${pal.bg}88`, road: `${pal.primary}76`, text: pal.text };
};

const routePath = (points: JourneyPoint[], mode: string) => {
  if (points.length < 2) return "";
  const parts = [`M ${points[0].x} ${points[0].y}`];
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]; const b = points[i];
    if (mode === "flight" || mode === "branch") {
      const bend = (a.x + b.x) / 2;
      parts.push(`C ${bend} ${a.y - 130 - i * 8}, ${bend} ${b.y + 130}, ${b.x} ${b.y}`);
    } else {
      const bend = (a.x + b.x) / 2;
      parts.push(`C ${bend} ${a.y}, ${bend} ${b.y}, ${b.x} ${b.y}`);
    }
  }
  return parts.join(" ");
};

// Branching routes deliberately fan out from the hub (point 0). Keeping one
// path per destination makes the branching treatment work for custom points,
// rather than silently drawing the same sequential route as every other mode.
const branchPaths = (points: JourneyPoint[]) => {
  if (points.length < 2) return [];
  const hub = points[0];
  return points.slice(1).map((point, index) => {
    const bend = (hub.x + point.x) / 2;
    return `M ${hub.x} ${hub.y} C ${bend} ${hub.y - 110 - index * 10}, ${bend} ${point.y + 110}, ${point.x} ${point.y}`;
  });
};

const MapTerrain: React.FC<{ pal: Palette; colors: ReturnType<typeof mapColors>; variant: MapJourneysVariant; frame: number }> = ({ pal, colors, variant, frame }) => {
  const wave = Math.sin(frame * 0.025) * 5;
  const highContrastPaper = variant === "multi-stop" || variant === "day-by-day" || variant === "walking-tour";
  const roads = variant === "flight-path" ? null : <g fill="none" stroke={colors.road} strokeWidth="5" opacity=".55"><path d="M80 730 C330 520 470 700 690 470 S1080 170 1420 340" /><path d="M120 300 C390 420 510 170 830 280 S1170 720 1480 610" /><path d="M390 820 C560 590 800 690 980 480 S1250 350 1510 170" /></g>;
  return <g>
    {highContrastPaper && <defs><linearGradient id="map-journeys-title-shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={pal.bg} stopOpacity=".92" /><stop offset=".68" stopColor={pal.bg} stopOpacity=".62" /><stop offset="1" stopColor={pal.bg} stopOpacity="0" /></linearGradient></defs>}
    <rect x="0" y="0" width="1560" height="900" rx="48" fill={colors.water} />
    <path d={`M0 250 C180 180 240 340 390 250 S640 120 810 230 S1040 360 1220 220 S1430 120 1560 190 L1560 0 L0 0 Z`} fill={colors.land} />
    <path d={`M0 690 C180 620 300 770 460 680 S720 540 900 670 S1180 780 1370 630 S1510 570 1560 620 L1560 900 L0 900 Z`} fill={colors.land2} />
    <path d="M520 0 C620 180 590 300 720 400 S880 620 800 900" fill="none" stroke={`${pal.accent}35`} strokeWidth="80" />
    {Array.from({ length: 11 }, (_, i) => <path key={i} d={`M${-100 + i * 190} ${780 - i * 21} L${220 + i * 160} ${-40 + i * 31}`} stroke={`${colors.road}28`} strokeWidth="2" />)}
    {roads}
    <g opacity=".55" fill="none" stroke={`${pal.text}35`} strokeWidth="3" strokeDasharray="14 18"><path d={`M0 ${510 + wave} C260 450 420 560 610 470 S970 390 1560 510`} /><path d={`M0 ${560 - wave} C270 610 420 470 680 550 S1120 610 1560 450`} /></g>
    {highContrastPaper && <rect x="0" y="0" width="1560" height="370" fill="url(#map-journeys-title-shade)" />}
  </g>;
};

const MapJourneysVisual: React.FC<{ p: MapJourneysProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const points = pointList(p);
  const mode = VARIANT_MODE[p.variant];
  const colors = mapColors(p, pal);
  const enter = spring({ frame: Math.max(0, frame - 7), fps, config: { damping: 18, stiffness: 90 } });
  const progress = interpolate(frame, [14, Math.max(15, durationInFrames - 26)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const active = Math.min(points.length - 1, Math.floor(progress * points.length));
  const path = routePath(points, mode);
  const branches = branchPaths(points);
  const pathLength = 2600;
  const photo = p.imageUrls?.[active % Math.max(1, p.imageUrls?.length ?? 1)];
  const isBranching = p.variant === "branching-route";
  const isWalkingTour = p.variant === "walking-tour";
  const isMapToPhoto = p.variant === "map-to-photo";
  const photoTransition = isMapToPhoto ? interpolate(progress, [.48, .82], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  return <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
    <svg width="1560" height="900" viewBox="0 0 1560 900" style={{ position: "absolute", left: 120, top: 102, width: 1560, height: 900, borderRadius: 48, boxShadow: `0 28px 90px ${pal.bg}88` }}>
      <MapTerrain pal={pal} colors={colors} variant={p.variant} frame={frame} />
      {p.showGrid !== false && <g opacity=".16" stroke={colors.text} strokeWidth="1">{Array.from({ length: 9 }, (_, i) => <path key={`h${i}`} d={`M0 ${80 + i * 95}H1560`} />)}{Array.from({ length: 16 }, (_, i) => <path key={`v${i}`} d={`M${i * 104} 0V900`} />)}</g>}
      {isBranching ? branches.map((branch, index) => <g key={`branch-${index}`}>
        <path d={branch} fill="none" stroke={`${pal.bg}99`} strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" opacity=".7" pathLength="1000" />
        <path d={branch} fill="none" stroke={points[index + 1]?.color ?? pal.accent} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" pathLength="1000" style={{ strokeDasharray: 1000, strokeDashoffset: 1000 * (1 - interpolate(progress, [index * .08, .72 + index * .05], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })) }} />
      </g>) : <>
        <path d={path} fill="none" stroke={`${pal.bg}99`} strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" opacity=".7" />
        <path d={path} fill="none" stroke={pal.accent} strokeWidth="8" strokeLinecap="round" strokeDasharray={mode === "flight" ? "18 18" : isWalkingTour ? "10 16" : undefined} strokeDashoffset={-frame * (p.speed ?? 1) * 3} pathLength={pathLength} style={{ strokeDasharray: mode === "flight" ? "18 18" : isWalkingTour ? "10 16" : pathLength, strokeDashoffset: mode === "flight" ? -frame * 3 : pathLength * (1 - progress) }} />
      </>}
      {points.map((point, i) => {
        const isActive = i <= active || (typeof p.highlightStop === "number" && i === p.highlightStop);
        const delay = 10 + i * 7;
        const reveal = interpolate(frame, [delay, delay + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return <g key={`${point.x}-${point.y}-${i}`} opacity={reveal}>
          <circle cx={point.x} cy={point.y} r={isActive ? 17 : 11} fill={isActive ? pal.accent : colors.water} stroke={isActive ? pal.text : `${pal.text}aa`} strokeWidth="4" />
          <circle cx={point.x} cy={point.y} r="5" fill={isActive ? pal.text : pal.accent} />
          {p.showLabels !== false && <g transform={`translate(${point.x + 22} ${point.y - 18})`}><rect x="0" y="-25" width={Math.max(100, (point.label ?? `STOP ${i + 1}`).length * 10 + 28)} height="34" rx="8" fill={`${colors.water}e8`} stroke={`${pal.text}35`} /><text x="14" y="-3" fill={colors.text} fontFamily={MONO} fontSize="13" fontWeight="800" letterSpacing="1">{point.label ?? `STOP ${i + 1}`}</text></g>}
          {mode === "day" && <text x={point.x} y={point.y + 52} textAnchor="middle" fill={pal.text} fontFamily={MONO} fontSize="12" fontWeight="800">DAY {String(i + 1).padStart(2, "0")}</text>}
        </g>;
      })}
      {mode === "flight" && <g transform={`translate(${points[active].x} ${points[active].y})`} opacity={enter}><path d="M-27 0L22 -12L37 0L22 12Z" fill={pal.text} stroke={pal.accent} strokeWidth="3" /><path d="M-4 -2L-20 -25M-4 2L-20 25" stroke={pal.text} strokeWidth="5" strokeLinecap="round" /></g>}
      {isWalkingTour && <foreignObject x="86" y="742" width="820" height="112"><div style={{ width: "820px", height: "112px", display: "flex", alignItems: "center", gap: 22, padding: "18px 24px", boxSizing: "border-box", borderRadius: 18, border: `2px solid ${pal.accent}88`, background: `${colors.water}e8`, color: colors.text, fontFamily: MONO }}><div style={{ color: pal.accent, fontSize: 13, fontWeight: 900, letterSpacing: ".16em" }}>WALKING TOUR</div><div style={{ width: 2, height: 42, background: `${colors.text}44` }} />{points.slice(0, 4).map((point, index) => <div key={`tour-stop-${index}`} style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 110 }}><div style={{ fontSize: 11, color: `${colors.text}88`, letterSpacing: ".1em" }}>STOP {String(index + 1).padStart(2, "0")}</div><div style={{ fontSize: 13, fontWeight: 800 }}>{point.label ?? "WAYPOINT"}</div></div>)}</div></foreignObject>}
      {isMapToPhoto && <foreignObject x="930" y="120" width="510" height="620"><div style={{ width: "510px", height: "620px", overflow: "hidden", borderRadius: 28, border: `3px solid ${pal.text}88`, background: colors.water, opacity: photoTransition, transform: `translateY(${(1 - photoTransition) * 70}px) scale(${.82 + photoTransition * .18})`, transformOrigin: "center bottom", boxShadow: `0 24px 70px ${pal.bg}99`, color: colors.text, fontFamily: FONT }}>{photo ? <Img src={photo} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 34, boxSizing: "border-box", background: `linear-gradient(145deg, ${pal.secondary}, ${pal.primary} 48%, ${pal.accent})` }}><div style={{ fontFamily: MONO, fontSize: 13, letterSpacing: ".18em", opacity: .78 }}>MAP → MEMORY</div><div style={{ marginTop: 12, fontSize: 40, fontWeight: 900, lineHeight: .98 }}>A PLACE<br />WORTH THE DETOUR</div><div style={{ marginTop: 20, fontFamily: MONO, fontSize: 12, opacity: .76 }}>{points[Math.min(active, points.length - 1)]?.label ?? "THE NEXT STOP"}</div></div>}</div></foreignObject>}
      {!isMapToPhoto && photo && <foreignObject x="1110" y="610" width="330" height="220"><div style={{ width: "330px", height: "220px", overflow: "hidden", borderRadius: 18, border: `3px solid ${pal.text}66`, background: colors.water }}><Img src={photo} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div></foreignObject>}
    </svg>
    <div style={{ position: "absolute", right: 152, top: 142, color: `${pal.text}a8`, font: `700 12px ${MONO}`, letterSpacing: ".16em" }}>{p.travelTime ?? `${Math.max(1, points.length - 1)} STOPS / LIVE ROUTE`}</div>
  </div>;
};

const Copy: React.FC<{ p: MapJourneysProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const y = interpolate(frame, [0, 24], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <div style={{ width: 660, transform: `translateY(${y}px)`, opacity: interpolate(frame, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}><div style={{ color: pal.accent, fontFamily: MONO, fontSize: 14, fontWeight: 800, letterSpacing: ".2em" }}>{VARIANT_EYEBROW[p.variant]}</div><div style={{ marginTop: 16, color: pal.text, fontFamily: FONT, fontWeight: 900, fontSize: 62, lineHeight: .98, letterSpacing: "-.06em" }}>{p.title}</div><div style={{ marginTop: 16, color: `${pal.text}b8`, fontFamily: FONT, fontSize: 22, lineHeight: 1.35 }}>{p.subtitle}</div><div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 10, color: `${pal.text}80`, fontFamily: MONO, fontSize: 12, letterSpacing: ".14em" }}><span style={{ width: 30, height: 3, background: pal.accent }} />PATH / PROGRESS / PLACE</div></div>;
};

export const MapJourneysTemplate: React.FC<MapJourneysProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <AbsoluteFill style={{ backgroundColor: pal.bg }}><GradientMeshBackground palette={pal} speed={.28} blobs={4} /><FadeEdges inFrames={12} outFrames={14}><div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><MapJourneysVisual p={props} pal={pal} /><div style={{ position: "absolute", left: 112, top: 92 }}><Copy p={props} pal={pal} /></div></div></FadeEdges></AbsoluteFill>;
};

const familyCast = (c: React.FC<MapJourneysProps>) => c as unknown as React.ComponentType<Record<string, unknown>>;
export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "map-journeys-route-draw": familyCast(MapJourneysTemplate),
  "map-journeys-multi-stop": familyCast(MapJourneysTemplate),
  "map-journeys-origin-destination": familyCast(MapJourneysTemplate),
  "map-journeys-branching-route": familyCast(MapJourneysTemplate),
  "map-journeys-day-by-day": familyCast(MapJourneysTemplate),
  "map-journeys-flight-path": familyCast(MapJourneysTemplate),
  "map-journeys-delivery-route": familyCast(MapJourneysTemplate),
  "map-journeys-migration-map": familyCast(MapJourneysTemplate),
  "map-journeys-walking-tour": familyCast(MapJourneysTemplate),
  "map-journeys-map-to-photo": familyCast(MapJourneysTemplate),
};
