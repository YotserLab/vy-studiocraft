import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, GradientMeshBackground, clampInterp, resolvePalette, seededRand, type Palette } from "../lib/primitives";

/** Deterministic relationship, dependency, influence, and service-network diagrams. */
export type NetworkGraphVariant =
  | "force-network"
  | "dependency-tree"
  | "hub-spoke"
  | "community-clusters"
  | "flow-network"
  | "org-chart"
  | "citation-web"
  | "service-mesh"
  | "relationship-reveal"
  | "network-alert";

type NetworkNode = {
  id: string;
  label: string;
  x?: number;
  y?: number;
  group?: string;
  kind?: "root" | "service" | "person" | "document" | "alert" | "default";
  color?: string;
  size?: number;
};

type NetworkEdge = {
  from: string;
  to: string;
  label?: string;
  weight?: number;
  color?: string;
  directed?: boolean;
};

export interface NetworkGraphsProps {
  variant: NetworkGraphVariant;
  title: string;
  subtitle?: string;
  paletteName: string;
  nodes?: NetworkNode[];
  edges?: NetworkEdge[];
  groups?: string[];
  labels?: string[];
  focusNode?: string;
  layoutSeed?: number;
  colors?: string[];
  captions?: string[];
  accentColor?: string;
  showGrid?: boolean;
  showLabels?: boolean;
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const FALLBACK_LABELS = ["Core", "Atlas", "Beacon", "Cinder", "Delta", "Echo", "Flux", "Gateway", "Helix", "Index"];
const VARIANT_LABEL: Record<NetworkGraphVariant, string> = {
  "force-network": "FORCE NETWORK",
  "dependency-tree": "DEPENDENCY TREE",
  "hub-spoke": "HUB / SPOKE",
  "community-clusters": "COMMUNITY CLUSTERS",
  "flow-network": "FLOW NETWORK",
  "org-chart": "ORG CHART",
  "citation-web": "CITATION WEB",
  "service-mesh": "SERVICE MESH",
  "relationship-reveal": "RELATIONSHIP REVEAL",
  "network-alert": "NETWORK ALERT",
};

const layouts: Record<NetworkGraphVariant, Array<[number, number]>> = {
  "force-network": [[600, 350], [300, 180], [440, 150], [830, 155], [960, 305], [825, 540], [485, 550], [225, 410], [600, 170], [600, 540]],
  "dependency-tree": [[600, 130], [340, 270], [860, 270], [205, 445], [470, 445], [730, 445], [995, 445], [360, 610], [620, 610], [880, 610]],
  "hub-spoke": [[600, 355], [265, 175], [390, 545], [875, 165], [1020, 380], [840, 575], [380, 265], [810, 300], [600, 110], [600, 600]],
  "community-clusters": [[320, 235], [220, 410], [415, 420], [860, 230], [760, 415], [1010, 420], [600, 330], [600, 555], [150, 220], [1080, 220]],
  "flow-network": [[150, 350], [330, 190], [330, 510], [545, 350], [760, 190], [760, 510], [1035, 350], [545, 135], [545, 565], [900, 350]],
  "org-chart": [[600, 125], [355, 285], [845, 285], [200, 485], [390, 485], [710, 485], [1000, 485], [290, 650], [600, 650], [905, 650]],
  "citation-web": [[600, 345], [285, 150], [420, 260], [840, 150], [770, 300], [270, 540], [500, 560], [850, 540], [1010, 340], [600, 125]],
  "service-mesh": [[210, 200], [490, 180], [780, 200], [1000, 410], [740, 505], [460, 510], [190, 420], [600, 340], [600, 600], [940, 115]],
  "relationship-reveal": [[600, 350], [255, 220], [330, 510], [860, 205], [970, 495], [600, 135], [600, 590], [155, 350], [1045, 350], [390, 350]],
  "network-alert": [[600, 340], [260, 180], [370, 520], [850, 180], [980, 500], [600, 145], [600, 575], [170, 350], [1030, 350], [840, 520]],
};

const defaultNodes = (variant: NetworkGraphVariant, labels?: string[], groups?: string[]): NetworkNode[] => {
  const names = labels?.length ? labels : FALLBACK_LABELS;
  return names.slice(0, 10).map((label, i) => ({
    id: `node-${i + 1}`,
    label,
    group: groups?.[i] ?? (variant === "community-clusters" ? (i < 3 ? "A" : i < 6 ? "B" : "Core") : undefined),
    kind: i === 0 ? "root" : variant === "org-chart" ? "person" : variant === "citation-web" ? "document" : variant === "network-alert" && i === 3 ? "alert" : "default",
    size: i === 0 ? 26 : 19,
  }));
};

const defaultEdges = (variant: NetworkGraphVariant, nodes: NetworkNode[]): NetworkEdge[] => {
  const n = nodes.length;
  if (n < 2) return [];
  const link = (from: number, to: number, label?: string): NetworkEdge => ({ from: nodes[from % n].id, to: nodes[to % n].id, label, directed: variant === "flow-network" || variant === "dependency-tree" || variant === "service-mesh" });
  if (variant === "dependency-tree" || variant === "org-chart") return [link(0, 1), link(0, 2), link(1, 3), link(1, 4), link(2, 5), link(2, 6), link(3, 7), link(4, 8), link(6, 9)];
  if (variant === "hub-spoke") return nodes.slice(1).map((_, i) => link(0, i + 1));
  if (variant === "flow-network") return [link(0, 1, "ingest"), link(0, 2, "queue"), link(1, 3), link(2, 3), link(3, 4), link(3, 5), link(4, 6, "ship"), link(5, 6), link(3, 7), link(3, 8), link(7, 9)];
  if (variant === "community-clusters") return [link(0, 1), link(0, 2), link(1, 2), link(3, 4), link(3, 5), link(4, 5), link(0, 6), link(3, 6), link(6, 7), link(2, 8), link(5, 9)];
  if (variant === "citation-web") return [link(1, 0), link(2, 0), link(2, 1), link(3, 0), link(4, 3), link(4, 6), link(5, 2), link(6, 0), link(7, 4), link(8, 1), link(9, 0)];
  if (variant === "service-mesh") return [link(0, 1), link(1, 2), link(2, 3), link(3, 4), link(4, 5), link(5, 6), link(6, 0), link(7, 1), link(7, 4), link(7, 8), link(8, 2), link(9, 7)];
  if (variant === "relationship-reveal") return [link(0, 1, "trust"), link(0, 2), link(0, 3, "shared"), link(0, 4), link(1, 5), link(2, 6), link(3, 7), link(4, 8), link(8, 9)];
  if (variant === "network-alert") return [link(0, 1), link(0, 2), link(0, 3, "warning"), link(3, 4, "impact"), link(3, 5), link(5, 6), link(3, 7), link(3, 8), link(8, 9)];
  return nodes.slice(1).map((_, i) => link(i, (i + 1) % n)).concat([link(0, 4), link(2, 7), link(5, 9), link(1, 6)]);
};

const NetworkNodeView: React.FC<{ node: NetworkNode; x: number; y: number; index: number; active: boolean; pal: Palette; accent: string; colors: string[]; frame: number; showLabels: boolean }> = ({ node, x, y, index, active, pal, accent, colors, frame, showLabels }) => {
  const reveal = clampInterp(frame, [8 + index * 6, 25 + index * 6], [0, 1]);
  const pulse = active ? 1 + Math.sin(frame * 0.16) * 0.06 : 1;
  const nodeColor = node.color ?? colors[index % colors.length] ?? (active ? accent : pal.primary);
  const r = node.size ?? (active ? 24 : 18);
  return (
    <g opacity={reveal} transform={`translate(${x} ${y}) scale(${pulse})`}>
      {active && <><circle r={r + 19} fill="none" stroke={accent} strokeWidth="2" strokeOpacity=".22"><animate attributeName="r" values={`${r + 10};${r + 28};${r + 10}`} dur="2.1s" repeatCount="indefinite" /></circle><circle r={r + 10} fill={accent} opacity=".08" /></>}
      <circle r={r} fill={`${nodeColor}2a`} stroke={active ? accent : `${nodeColor}b8`} strokeWidth={active ? 3 : 2} />
      <circle r={Math.max(4, r * .32)} fill={nodeColor} opacity=".9" />
      {node.kind === "alert" && <path d={`M 0 ${-r - 14} l 9 15 h-18 z`} fill="#ff5263" stroke={pal.bg} strokeWidth="2" />}
      {showLabels && <><text y={r + 27} textAnchor="middle" fill={pal.text} fontFamily={FONT} fontSize="16" fontWeight="750">{node.label.slice(0, 16)}</text><text y={r + 43} textAnchor="middle" fill={`${pal.text}66`} fontFamily={MONO} fontSize="9" letterSpacing="1.5">{node.kind?.toUpperCase() ?? "NODE"}</text></>}
    </g>
  );
};

export const NetworkGraphsTemplate: React.FC<NetworkGraphsProps> = (props) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  const pal = resolvePalette(props.paletteName);
  const accent = props.accentColor ?? pal.accent;
  const colors = props.colors?.length ? props.colors : [pal.primary, pal.secondary, accent, "#fbbf24", "#34d399"];
  const nodes = props.nodes?.length ? props.nodes.slice(0, 10) : defaultNodes(props.variant, props.labels, props.groups);
  const layout = layouts[props.variant];
  const seed = props.layoutSeed ?? 7;
  const points = nodes.map((node, i) => {
    const base = layout[i % layout.length];
    const drift = props.variant === "force-network" || props.variant === "community-clusters" ? 10 : 3;
    return { ...node, x: node.x ?? base[0] + (seededRand(seed + i * 2) - .5) * drift, y: node.y ?? base[1] + (seededRand(seed + i * 2 + 1) - .5) * drift };
  });
  const byId = new Map(points.map((node) => [node.id, node]));
  const edges = props.edges?.length ? props.edges : defaultEdges(props.variant, points);
  const focus = props.focusNode ?? points[Math.min(0, points.length - 1)]?.id;
  const focusIndex = Math.max(0, points.findIndex((node) => node.id === focus));
  const intro = clampInterp(frame, [0, 18], [0, 1]);
  const camera = props.variant === "relationship-reveal" ? clampInterp(frame, [18, durationInFrames * .66], [0, 1]) : 0;
  const cameraX = props.variant === "relationship-reveal" ? interpolate(camera, [0, 1], [0, -38]) : Math.sin(frame * .006) * 4;
  const cameraY = props.variant === "relationship-reveal" ? interpolate(camera, [0, 1], [0, -22]) : Math.cos(frame * .006) * 3;
  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg, color: pal.text, fontFamily: FONT, overflow: "hidden" }}>
      <GradientMeshBackground palette={pal} speed={0.16} blobs={3} />
      {props.showGrid !== false && <AbsoluteFill style={{ opacity: .16, backgroundImage: `linear-gradient(${pal.text}0c 1px, transparent 1px), linear-gradient(90deg, ${pal.text}0c 1px, transparent 1px)`, backgroundSize: "72px 72px", maskImage: "linear-gradient(to bottom, transparent, black 18%, black 88%, transparent)" }} />}
      <FadeEdges inFrames={12} outFrames={14}><div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><AbsoluteFill style={{ padding: "72px 94px 64px", opacity: intro }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", height: 110 }}>
          <div><div style={{ color: accent, fontSize: 14, fontWeight: 850, letterSpacing: ".24em" }}>{VARIANT_LABEL[props.variant]}</div><div style={{ marginTop: 14, fontSize: 48, lineHeight: 1, fontWeight: 850, letterSpacing: "-.045em" }}>{props.title}</div>{props.subtitle && <div style={{ marginTop: 12, color: `${pal.text}88`, fontSize: 18 }}>{props.subtitle}</div>}</div>
          <div style={{ color: `${pal.text}66`, fontFamily: MONO, fontSize: 12, letterSpacing: ".16em", paddingTop: 10 }}>{String(nodes.length).padStart(2, "0")} NODES / {String(edges.length).padStart(2, "0")} EDGES</div>
        </div>
        <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
          <svg width="100%" height="100%" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid meet" style={{ overflow: "visible" }}>
            <g transform={`translate(${cameraX} ${cameraY})`}>
              {props.variant === "community-clusters" && ["A", "B", "Core"].map((group, i) => {
                const members = points.filter((node) => node.group === group);
                if (!members.length) return null;
                const cx = members.reduce((sum, node) => sum + (node.x ?? 0), 0) / members.length;
                const cy = members.reduce((sum, node) => sum + (node.y ?? 0), 0) / members.length;
                return <ellipse key={group} cx={cx} cy={cy} rx={i === 2 ? 180 : 155} ry={i === 2 ? 125 : 145} fill={colors[i % colors.length]} fillOpacity=".06" stroke={colors[i % colors.length]} strokeOpacity=".3" strokeDasharray="5 9" />;
              })}
              {edges.map((edge, i) => {
                const from = byId.get(edge.from) ?? points[i % points.length];
                const to = byId.get(edge.to) ?? points[(i + 1) % points.length];
                if (!from || !to) return null;
                const active = edge.from === focus || edge.to === focus || props.variant === "network-alert" && (edge.label === "warning" || edge.label === "impact");
                const reveal = clampInterp(frame, [14 + i * 4, 34 + i * 4], [0, 1]);
                const color = edge.color ?? (active ? accent : `${pal.text}48`);
                const midX = ((from.x ?? 0) + (to.x ?? 0)) / 2;
                const midY = ((from.y ?? 0) + (to.y ?? 0)) / 2;
                const curve = props.variant === "force-network" || props.variant === "citation-web" ? (i % 2 ? 34 : -34) : 0;
                const path = curve ? `M ${from.x} ${from.y} Q ${midX} ${midY + curve} ${to.x} ${to.y}` : `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
                const motion = (frame * (active ? 2 : .45) + i * 18) % 100;
                return <g key={`${edge.from}-${edge.to}-${i}`} opacity={reveal}>
                  <path d={path} fill="none" stroke={color} strokeWidth={active ? (edge.weight ?? 3.5) : (edge.weight ?? 1.8)} strokeDasharray={active ? "10 7" : "4 9"} strokeDashoffset={-frame * (active ? 1.2 : .2)} />
                  {edge.directed && <polygon points={`${to.x},${to.y} ${((to.x ?? 0) * .92 + (from.x ?? 0) * .08)},${((to.y ?? 0) * .92 + (from.y ?? 0) * .08) - 6} ${((to.x ?? 0) * .92 + (from.x ?? 0) * .08)},${((to.y ?? 0) * .92 + (from.y ?? 0) * .08) + 6}`} fill={color} />}
                  <circle r={active ? 6 : 4} fill={active ? accent : pal.secondary} opacity=".8"><animateMotion dur={active ? "1.8s" : "4.5s"} repeatCount="indefinite" path={path.slice(2)} /></circle>
                  {edge.label && <text x={midX} y={midY - 10} fill={`${pal.text}82`} fontFamily={MONO} fontSize="11" textAnchor="middle">{edge.label}</text>}
                  {active && <circle cx={interpolate((motion % 100) / 100, [0, 1], [from.x ?? 0, to.x ?? 0])} cy={interpolate((motion % 100) / 100, [0, 1], [from.y ?? 0, to.y ?? 0])} r="5" fill={accent} />}
                </g>;
              })}
              {points.map((node, i) => <NetworkNodeView key={node.id} node={node} x={node.x!} y={node.y!} index={i} active={node.id === focus || i === focusIndex && props.variant === "relationship-reveal"} pal={pal} accent={accent} colors={colors} frame={frame} showLabels={props.showLabels !== false} />)}
              {props.captions?.slice(0, 3).map((caption, i) => <g key={`caption-${i}`} opacity={clampInterp(frame, [42 + i * 8, 60 + i * 8], [0, 1])}><rect x={40 + i * 235} y={625} width="215" height="34" rx="10" fill={`${pal.bg}dd`} stroke={`${accent}66`} /><text x={147 + i * 235} y={647} fill={pal.text} fontFamily={FONT} fontSize="13" textAnchor="middle">{caption.slice(0, 24)}</text></g>)}
            </g>
          </svg>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: `${pal.text}62`, fontFamily: MONO, fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase" }}><span>{VARIANT_LABEL[props.variant]}</span><span>Deterministic relationship map</span></div>
      </AbsoluteFill></div></FadeEdges>
    </AbsoluteFill>
  );
};

const familyCast = (component: React.FC<NetworkGraphsProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;
export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "network-graphs-force-network": familyCast(NetworkGraphsTemplate),
  "network-graphs-dependency-tree": familyCast(NetworkGraphsTemplate),
  "network-graphs-hub-spoke": familyCast(NetworkGraphsTemplate),
  "network-graphs-community-clusters": familyCast(NetworkGraphsTemplate),
  "network-graphs-flow-network": familyCast(NetworkGraphsTemplate),
  "network-graphs-org-chart": familyCast(NetworkGraphsTemplate),
  "network-graphs-citation-web": familyCast(NetworkGraphsTemplate),
  "network-graphs-service-mesh": familyCast(NetworkGraphsTemplate),
  "network-graphs-relationship-reveal": familyCast(NetworkGraphsTemplate),
  "network-graphs-network-alert": familyCast(NetworkGraphsTemplate),
};
