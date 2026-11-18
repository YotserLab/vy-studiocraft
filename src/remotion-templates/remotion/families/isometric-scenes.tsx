import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, GradientMeshBackground, resolvePalette, type Palette } from "../lib/primitives";

/**
 * FAMILY: isometric-scenes
 * Ten deterministic, asset-free isometric scene systems for product
 * architecture, operations, workflows, and service maps. The scene is drawn
 * with SVG primitives so it remains portable and headless-renderable.
 */
type IsometricVariant =
  | "city-block"
  | "cloud-stack"
  | "workflow-room"
  | "data-center"
  | "app-ecosystem"
  | "factory-line"
  | "team-desk"
  | "warehouse-flow"
  | "isometric-map"
  | "service-network";

type SceneKind = "building" | "cloud" | "room" | "server" | "app" | "factory" | "desk" | "box" | "terrain" | "service";
type SceneEdge = { from: string; to: string; label?: string };

export interface IsometricScenesProps {
  variant: IsometricVariant;
  sceneName: string;
  tagline: string;
  paletteName: string;
  nodes?: Array<{ id: string; label: string; x: number; y: number; z?: number; kind?: SceneKind; color?: string }>;
  edges?: Array<{ from: string; to: string; label?: string }>;
  highlightNode?: string;
  cameraOffset?: { x: number; y: number };
  grid?: boolean;
  density?: number;
  speed?: number;
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const FALLBACK_LABELS = ["Core", "Signal", "Flow", "Edge", "North", "Relay", "Store", "Sync", "Launch", "Scale"];

const variantKind: Record<IsometricVariant, SceneKind> = {
  "city-block": "building",
  "cloud-stack": "cloud",
  "workflow-room": "room",
  "data-center": "server",
  "app-ecosystem": "app",
  "factory-line": "factory",
  "team-desk": "desk",
  "warehouse-flow": "box",
  "isometric-map": "terrain",
  "service-network": "service",
};

const variantEyebrow: Record<IsometricVariant, string> = {
  "city-block": "URBAN SYSTEM / 001",
  "cloud-stack": "CLOUD INFRASTRUCTURE / 002",
  "workflow-room": "WORKFLOW / 003",
  "data-center": "OPERATIONS / 004",
  "app-ecosystem": "PRODUCT ECOSYSTEM / 005",
  "factory-line": "THROUGHPUT / 006",
  "team-desk": "COLLABORATION / 007",
  "warehouse-flow": "FULFILLMENT / 008",
  "isometric-map": "TERRITORY / 009",
  "service-network": "SERVICE GRAPH / 010",
};

const defaultNodes = (variant: IsometricVariant, density = 6): Array<{ id: string; label: string; x: number; y: number; z: number; kind: SceneKind }> => {
  const kind = variantKind[variant];
  const count = Math.max(4, Math.min(10, Math.round(density)));
  const patterns: Record<IsometricVariant, Array<[number, number, number]>> = {
    "city-block": [[0, 0, 1], [230, 0, 2], [460, 10, 3], [110, 250, 2], [350, 255, 1], [590, 245, 2], [235, 500, 3], [480, 500, 1], [710, 460, 2], [720, 120, 1]],
    "cloud-stack": [[0, 0, 1], [220, 30, 2], [420, 0, 3], [120, 240, 2], [350, 260, 1], [570, 240, 3], [230, 490, 2], [470, 510, 1], [700, 330, 2], [690, 60, 1]],
    "workflow-room": [[0, 0, 1], [250, 40, 1], [500, 0, 1], [100, 260, 1], [360, 260, 1], [620, 255, 1], [220, 510, 1], [500, 510, 1], [760, 390, 1], [760, 120, 1]],
    "data-center": [[0, 0, 2], [210, 20, 3], [420, 0, 2], [80, 260, 3], [330, 260, 4], [580, 260, 3], [230, 510, 2], [490, 510, 4], [750, 370, 3], [730, 80, 2]],
    "app-ecosystem": [[0, 0, 1], [260, 20, 1], [500, 0, 1], [130, 250, 1], [390, 250, 1], [650, 240, 1], [260, 500, 1], [520, 500, 1], [790, 370, 1], [760, 80, 1]],
    "factory-line": [[0, 0, 1], [230, 0, 1], [460, 0, 1], [690, 0, 1], [110, 270, 1], [340, 270, 1], [570, 270, 1], [800, 270, 1], [320, 520, 1], [610, 520, 1]],
    "team-desk": [[0, 0, 1], [250, 10, 1], [500, 0, 1], [100, 250, 1], [360, 250, 1], [620, 250, 1], [220, 500, 1], [500, 500, 1], [770, 370, 1], [760, 90, 1]],
    "warehouse-flow": [[0, 0, 1], [250, 0, 1], [500, 0, 1], [750, 0, 1], [110, 260, 1], [360, 260, 1], [610, 260, 1], [820, 260, 1], [300, 510, 1], [650, 510, 1]],
    "isometric-map": [[0, 0, 0], [240, 30, 0], [480, 0, 0], [100, 270, 0], [360, 260, 0], [620, 270, 0], [230, 520, 0], [500, 510, 0], [790, 390, 0], [760, 90, 0]],
    "service-network": [[0, 0, 1], [240, 20, 1], [480, 0, 1], [100, 260, 1], [350, 255, 1], [610, 250, 1], [220, 510, 1], [500, 510, 1], [790, 380, 1], [770, 70, 1]],
  };
  return patterns[variant].slice(0, count).map(([x, y, z], i) => ({ id: `node-${i + 1}`, label: FALLBACK_LABELS[i], x, y, z, kind }));
};

const iso = (x: number, y: number, z = 0, cameraX = 0, cameraY = 0): [number, number] => [960 + (x - y) * 0.72 + cameraX, 445 + (x + y) * 0.34 - z * 72 + cameraY];

const SceneCopy: React.FC<{ p: IsometricScenesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const y = interpolate(frame, [0, 24], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ width: 620, color: pal.text, fontFamily: FONT, opacity: interpolate(frame, [0, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), transform: `translateY(${y}px)` }}>
      <div style={{ color: pal.accent, fontSize: 15, fontWeight: 900, letterSpacing: ".24em" }}>{variantEyebrow[p.variant]}</div>
      <div style={{ marginTop: 16, fontSize: 70, lineHeight: .96, fontWeight: 900, letterSpacing: "-.065em" }}>{p.sceneName}</div>
      <div style={{ marginTop: 20, color: `${pal.text}b8`, fontSize: 24, lineHeight: 1.35 }}>{p.tagline}</div>
      <div style={{ display: "flex", gap: 10, marginTop: 32, alignItems: "center" }}>
        <span style={{ width: 9, height: 9, borderRadius: 9, background: pal.accent }} />
        <span style={{ color: `${pal.text}80`, font: `700 13px ${MONO}`, letterSpacing: ".15em" }}>ISOMETRIC SYSTEM / LIVE</span>
      </div>
    </div>
  );
};

const Grid: React.FC<{ pal: Palette; visible: boolean }> = ({ pal, visible }) => {
  if (!visible) return null;
  const lines = [];
  for (let i = -4; i <= 12; i += 1) {
    const a = iso(i * 100, -300);
    const b = iso(i * 100, 1000);
    const c = iso(-300, i * 100);
    const d = iso(1000, i * 100);
    lines.push(<path key={`x-${i}`} d={`M${a[0]} ${a[1]} L${b[0]} ${b[1]}`} stroke={`${pal.primary}36`} strokeWidth="2" />);
    lines.push(<path key={`y-${i}`} d={`M${c[0]} ${c[1]} L${d[0]} ${d[1]}`} stroke={`${pal.secondary}2b`} strokeWidth="2" />);
  }
  return <g opacity=".72">{lines}</g>;
};

const NodeShape: React.FC<{ node: { label: string; x: number; y: number; z?: number; kind?: SceneKind; color?: string }; pal: Palette; active: boolean; enter: number; index: number }> = ({ node, pal, active, enter, index }) => {
  const kind = node.kind ?? "service";
  const color = node.color ?? [pal.primary, pal.secondary, pal.accent][index % 3];
  const [x, y] = iso(node.x, node.y, node.z ?? 0);
  const height = kind === "building" || kind === "server" ? 100 + (index % 3) * 45 : kind === "cloud" ? 78 : kind === "terrain" ? 12 : 42;
  const width = kind === "building" || kind === "server" ? 92 : 106;
  const alpha = active ? 1 : .78;
  return (
    <g transform={`translate(${x} ${y})`} opacity={enter}>
      <polygon points={`0,0 ${width},${-width * .27} 0,${-width * .54} ${-width},${-width * .27}`} fill={`${color}${active ? "88" : "48"}`} stroke={active ? pal.accent : `${color}aa`} strokeWidth={active ? 4 : 2} />
      {kind === "building" || kind === "server" ? <>
        <polygon points={`0,0 ${width},${-width * .27} ${width},${-width * .27 - height} 0,${-width * .54 - height}`} fill={`${color}${active ? "cc" : "9b"}`} stroke={`${pal.text}44`} strokeWidth="2" />
        <polygon points={`0,0 ${-width},${-width * .27} ${-width},${-width * .27 - height} 0,${-width * .54 - height}`} fill={`${color}${active ? "8e" : "68"}`} stroke={`${pal.text}32`} strokeWidth="2" />
        {[0, 1, 2].map((r) => <line key={r} x1={-width + 20} y1={-width * .27 - 25 - r * 25} x2={width - 20} y2={-width * .27 - 25 - r * 25} stroke={`${pal.text}55`} strokeWidth="5" />)}
      </> : kind === "cloud" ? <>
        <ellipse cx="-26" cy="-35" rx="56" ry="36" fill={`${color}a8`} />
        <ellipse cx="27" cy="-39" rx="50" ry="42" fill={`${color}cc`} />
        <ellipse cx="0" cy="-68" rx="48" ry="38" fill={`${color}b8`} />
      </> : kind === "terrain" ? <>
        <polygon points={`0,0 ${width},${-width * .27} ${width + 20},${-width * .27 - 18} 20,${-width * .54 - 18}`} fill={`${color}70`} />
        <path d="M-50 -18 Q0 -62 45 -27 T110 -42" fill="none" stroke={`${pal.accent}b8`} strokeWidth="7" />
      </> : kind === "room" || kind === "desk" ? <>
        <rect x={-38} y={-72} width="76" height="48" rx="7" fill={`${color}a8`} stroke={`${pal.text}45`} strokeWidth="2" />
        <path d="M-52 -15h104M-30 -15v28M30 -15v28" stroke={`${pal.text}65`} strokeWidth="8" />
        <circle cx="0" cy="-90" r="14" fill={pal.accent} opacity=".9" />
      </> : kind === "factory" ? <>
        <rect x={-54} y={-85} width="108" height="62" rx="4" fill={`${color}aa`} stroke={`${pal.text}44`} strokeWidth="2" />
        <path d="M-30 -85v-42h22v42M8 -85v-55h24v55" fill={`${color}9e`} stroke={`${pal.text}44`} strokeWidth="3" />
        <circle cx="-24" cy="-52" r="10" fill={pal.accent} />
      </> : kind === "box" ? <>
        <polygon points={`-58,-29 0,-60 58,-29 0,2`} fill={`${color}b0`} stroke={`${pal.text}55`} strokeWidth="2" />
        <polygon points={`-58,-29 0,2 0,53 -58,22`} fill={`${color}8c`} stroke={`${pal.text}42`} strokeWidth="2" />
        <polygon points={`58,-29 0,2 0,53 58,22`} fill={`${color}70`} stroke={`${pal.text}35`} strokeWidth="2" />
        <path d="M0 3v47" stroke={`${pal.text}55`} strokeWidth="3" />
      </> : <>
        <circle cx="0" cy="-45" r="32" fill={`${color}c0`} stroke={active ? pal.accent : `${pal.text}50`} strokeWidth="3" />
        <circle cx="0" cy="-45" r="11" fill={pal.bg} />
        <path d="M-48 -1h96" stroke={`${pal.text}60`} strokeWidth="5" />
      </>}
      {active && <circle cx="0" cy={-height - 12} r="8" fill={pal.accent} opacity=".9" />}
      <text x="0" y={Math.min(52, 24)} textAnchor="middle" fill={pal.text} fontFamily={FONT} fontSize="16" fontWeight="800">{node.label}</text>
      <text x="0" y={Math.min(74, 44)} textAnchor="middle" fill={`${pal.text}7d`} fontFamily={MONO} fontSize="10" letterSpacing="2">{active ? "ACTIVE" : `0${index + 1}`}</text>
      <g opacity={alpha} />
    </g>
  );
};

const IsometricScene: React.FC<{ p: IsometricScenesProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const enter = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 18, stiffness: 80 } });
  const nodes = (p.nodes?.length ? p.nodes : defaultNodes(p.variant, p.density)).map((n, i) => ({ ...n, z: n.z ?? (i % 3), kind: n.kind ?? variantKind[p.variant] }));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const cameraX = (p.cameraOffset?.x ?? 0) + Math.sin(frame * 0.008 * (p.speed ?? 1)) * 18;
  const cameraY = (p.cameraOffset?.y ?? 0) + Math.cos(frame * 0.007 * (p.speed ?? 1)) * 10;
  const progress = interpolate(frame, [10, Math.max(11, durationInFrames - 30)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const edges: SceneEdge[] = p.edges?.length ? p.edges : nodes.slice(0, -1).map((n, i): SceneEdge => ({ from: n.id, to: nodes[i + 1].id }));
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", transform: `translate(${cameraX}px,${cameraY}px)` }}>
        <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <Grid pal={pal} visible={p.grid !== false} />
          <g>
            {edges.map((edge, i) => {
              const from = byId.get(edge.from); const to = byId.get(edge.to);
              if (!from || !to) return null;
              const a = iso(from.x, from.y, from.z ?? 0); const b = iso(to.x, to.y, to.z ?? 0);
              return <g key={`${edge.from}-${edge.to}-${i}`} opacity={clampOpacity(enter, .7)}>
                <path d={`M${a[0]} ${a[1]} L${(a[0] + b[0]) / 2} ${(a[1] + b[1]) / 2 - 42} L${b[0]} ${b[1]}`} fill="none" stroke={`${pal.accent}90`} strokeWidth="4" strokeDasharray="14 12" strokeDashoffset={-frame * 2.5} />
                <circle cx={a[0]} cy={a[1]} r="6" fill={pal.accent} />
                {edge.label && <text x={(a[0] + b[0]) / 2} y={(a[1] + b[1]) / 2 - 55} fill={`${pal.text}9c`} fontFamily={MONO} fontSize="12" textAnchor="middle">{edge.label}</text>}
              </g>;
            })}
          </g>
          {nodes.map((node, i) => <NodeShape key={node.id} node={node} pal={pal} active={node.id === p.highlightNode || (!p.highlightNode && i === Math.floor(progress * nodes.length) % nodes.length)} enter={clampOpacity(enter, 0.98)} index={i} />)}
        </svg>
      </div>
      <div style={{ position: "absolute", right: 120, bottom: 92, display: "flex", gap: 10, alignItems: "center", color: `${pal.text}80`, font: `700 12px ${MONO}`, letterSpacing: ".16em" }}><span style={{ width: 34, height: 3, background: pal.accent }} />SCENE / {String(nodes.length).padStart(2, "0")} NODES</div>
    </AbsoluteFill>
  );
};

const clampOpacity = (value: number, max: number): number => Math.max(0, Math.min(max, value));

const VARIANTS: Record<IsometricVariant, React.FC<{ p: IsometricScenesProps; pal: Palette }>> = {
  "city-block": IsometricScene,
  "cloud-stack": IsometricScene,
  "workflow-room": IsometricScene,
  "data-center": IsometricScene,
  "app-ecosystem": IsometricScene,
  "factory-line": IsometricScene,
  "team-desk": IsometricScene,
  "warehouse-flow": IsometricScene,
  "isometric-map": IsometricScene,
  "service-network": IsometricScene,
};

export const IsometricScenesTemplate: React.FC<IsometricScenesProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? IsometricScene;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg }}>
      <GradientMeshBackground palette={pal} blobs={4} speed={0.35} />
      <FadeEdges inFrames={12} outFrames={14}><div style={{ position: "absolute", inset: 0 }}><div style={{ position: "absolute", inset: 0, transform: "translateX(190px) scale(0.82)", transformOrigin: "60% 50%" }}><div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><Variant p={props} pal={pal} /></div></div><div style={{ position: "absolute", left: 112, top: 122 }}><SceneCopy p={props} pal={pal} /></div></div></FadeEdges>
    </AbsoluteFill>
  );
};

const familyCast = (c: React.FC<IsometricScenesProps>) => c as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "isometric-scenes-city-block": familyCast(IsometricScenesTemplate),
  "isometric-scenes-cloud-stack": familyCast(IsometricScenesTemplate),
  "isometric-scenes-workflow-room": familyCast(IsometricScenesTemplate),
  "isometric-scenes-data-center": familyCast(IsometricScenesTemplate),
  "isometric-scenes-app-ecosystem": familyCast(IsometricScenesTemplate),
  "isometric-scenes-factory-line": familyCast(IsometricScenesTemplate),
  "isometric-scenes-team-desk": familyCast(IsometricScenesTemplate),
  "isometric-scenes-warehouse-flow": familyCast(IsometricScenesTemplate),
  "isometric-scenes-isometric-map": familyCast(IsometricScenesTemplate),
  "isometric-scenes-service-network": familyCast(IsometricScenesTemplate),
};
