import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, GradientMeshBackground, clampInterp, resolvePalette, type Palette } from "../lib/primitives";

/**
 * FAMILY: explainer-diagrams
 * Ten deterministic, asset-free diagram compositions for making systems,
 * architectures, flows, decisions, and concepts legible in motion.
 */
export type ExplainerDiagramVariant =
  | "system-overview"
  | "layered-architecture"
  | "input-output"
  | "zoom-into-node"
  | "cycle-diagram"
  | "before-after-system"
  | "callout-network"
  | "component-assembly"
  | "decision-tree"
  | "concept-map";

type DiagramNode = {
  id: string;
  label: string;
  x?: number;
  y?: number;
  kind?: "source" | "process" | "output" | "decision" | "note";
  color?: string;
};

type DiagramEdge = { from: string; to: string; label?: string; color?: string };

export interface ExplainerDiagramsProps {
  variant: ExplainerDiagramVariant;
  title: string;
  subtitle?: string;
  paletteName: string;
  nodes?: DiagramNode[];
  edges?: DiagramEdge[];
  labels?: string[];
  focusNode?: string;
  notes?: string[];
  cameraPath?: "wide" | "drift" | "focus";
  accentColor?: string;
  showGrid?: boolean;
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const FALLBACK_LABELS = ["Input", "Signal", "Engine", "Decision", "Output", "Context", "Review", "Result"];
const VARIANT_LABEL: Record<ExplainerDiagramVariant, string> = {
  "system-overview": "SYSTEM OVERVIEW",
  "layered-architecture": "LAYERED ARCHITECTURE",
  "input-output": "INPUT / OUTPUT",
  "zoom-into-node": "FOCUS NODE",
  "cycle-diagram": "CONTINUOUS CYCLE",
  "before-after-system": "BEFORE / AFTER",
  "callout-network": "CALLOUT NETWORK",
  "component-assembly": "COMPONENT ASSEMBLY",
  "decision-tree": "DECISION TREE",
  "concept-map": "CONCEPT MAP",
};

const layoutFor = (variant: ExplainerDiagramVariant, count: number): Array<[number, number]> => {
  const layouts: Record<ExplainerDiagramVariant, Array<[number, number]>> = {
    "system-overview": [[210, 330], [420, 210], [650, 330], [880, 210], [1010, 470], [650, 525], [420, 525], [210, 470]],
    "layered-architecture": [[600, 132], [600, 245], [600, 358], [600, 471], [600, 584], [345, 245], [855, 358], [345, 471]],
    "input-output": [[170, 350], [370, 350], [570, 350], [770, 350], [1030, 350], [570, 190], [570, 510], [370, 190]],
    "zoom-into-node": [[230, 170], [455, 210], [735, 245], [600, 380], [910, 430], [285, 505], [790, 555], [1030, 180]],
    "cycle-diagram": [[600, 125], [860, 260], [870, 485], [600, 590], [330, 485], [340, 260], [600, 350], [1020, 350]],
    "before-after-system": [[245, 230], [245, 430], [445, 330], [755, 230], [755, 430], [955, 330], [600, 330], [600, 550]],
    "callout-network": [[600, 350], [360, 180], [360, 350], [360, 520], [840, 180], [840, 350], [840, 520], [1020, 350]],
    "component-assembly": [[600, 350], [265, 190], [460, 180], [740, 180], [935, 190], [275, 530], [600, 540], [925, 530]],
    "decision-tree": [[600, 150], [410, 285], [790, 285], [260, 460], [560, 460], [740, 460], [1040, 460], [600, 585]],
    "concept-map": [[600, 350], [250, 190], [430, 150], [800, 155], [970, 220], [270, 515], [525, 570], [850, 530]],
  };
  return layouts[variant].slice(0, Math.max(3, Math.min(8, count)));
};

const defaultNodes = (variant: ExplainerDiagramVariant, labels?: string[]): DiagramNode[] => {
  const names = labels?.length ? labels : FALLBACK_LABELS;
  return names.slice(0, 8).map((label, i) => ({
    id: `node-${i + 1}`,
    label,
    kind: i === 0 ? "source" : i === names.length - 1 ? "output" : variant === "decision-tree" && i === 1 ? "decision" : "process",
  }));
};

const defaultEdges = (variant: ExplainerDiagramVariant, nodes: DiagramNode[]): DiagramEdge[] => {
  if (nodes.length < 2) return [];
  if (variant === "cycle-diagram") return nodes.slice(0, 6).map((n, i, a) => ({ from: n.id, to: a[(i + 1) % a.length].id }));
  if (variant === "decision-tree") return [
    { from: nodes[0].id, to: nodes[1].id, label: "yes" }, { from: nodes[0].id, to: nodes[2].id, label: "no" },
    { from: nodes[1].id, to: nodes[3].id }, { from: nodes[1].id, to: nodes[4].id },
    { from: nodes[2].id, to: nodes[5].id }, { from: nodes[2].id, to: nodes[6].id },
  ];
  if (variant === "before-after-system") return [
    { from: nodes[0].id, to: nodes[2].id }, { from: nodes[1].id, to: nodes[2].id },
    { from: nodes[2].id, to: nodes[3].id }, { from: nodes[2].id, to: nodes[4].id },
  ];
  if (variant === "layered-architecture") return nodes.slice(0, -1).map((n, i) => ({ from: n.id, to: nodes[i + 1].id }));
  return nodes.slice(0, -1).map((n, i) => ({ from: n.id, to: nodes[i + 1].id }));
};

const DiagramNodeView: React.FC<{ node: DiagramNode; x: number; y: number; pal: Palette; accent: string; active: boolean; index: number; frame: number }> = ({ node, x, y, pal, accent, active, index, frame }) => {
  const reveal = clampInterp(frame, [8 + index * 7, 25 + index * 7], [0, 1]);
  const pulse = active ? 1 + Math.sin(frame * 0.16) * 0.035 : 1;
  const fill = active ? `${accent}26` : `${pal.text}0a`;
  const stroke = active ? accent : `${pal.text}36`;
  return (
    <g opacity={reveal} transform={`translate(${x} ${y}) scale(${pulse})`}>
      {active && <circle r="48" fill="none" stroke={accent} strokeOpacity=".22" strokeWidth="2"><animate attributeName="r" values="42;58;42" dur="2.4s" repeatCount="indefinite" /></circle>}
      <rect x="-74" y="-32" width="148" height="64" rx="18" fill={fill} stroke={stroke} strokeWidth={active ? 3 : 2} />
      <circle cx="-51" cy="0" r="7" fill={node.color ?? (active ? accent : pal.primary)} />
      <text x="-34" y="6" fill={pal.text} fontFamily={FONT} fontSize="17" fontWeight="700">{node.label.slice(0, 18)}</text>
      {node.kind && <text x="0" y="51" textAnchor="middle" fill={`${pal.text}68`} fontFamily={MONO} fontSize="10" letterSpacing="1.8">{node.kind.toUpperCase()}</text>}
    </g>
  );
};

export const ExplainerDiagramsTemplate: React.FC<ExplainerDiagramsProps> = (props) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  const pal = resolvePalette(props.paletteName);
  const accent = props.accentColor ?? pal.accent;
  const nodes = props.nodes?.length ? props.nodes.slice(0, 8) : defaultNodes(props.variant, props.labels);
  const layout = layoutFor(props.variant, nodes.length);
  const points = nodes.map((node, i) => ({ ...node, x: node.x ?? layout[i][0], y: node.y ?? layout[i][1] }));
  const byId = new Map(points.map((node) => [node.id, node]));
  const edges = props.edges?.length ? props.edges : defaultEdges(props.variant, points);
  const focus = props.focusNode ?? (props.variant === "zoom-into-node" ? points[Math.min(3, points.length - 1)]?.id : points[0]?.id);
  const cameraProgress = props.cameraPath === "focus" ? clampInterp(frame, [20, durationInFrames * 0.64], [0, 1]) : props.cameraPath === "drift" ? clampInterp(frame, [0, durationInFrames], [0, 1]) : 0;
  const cameraX = props.cameraPath === "focus" ? interpolate(cameraProgress, [0, 1], [0, -95]) : Math.sin(frame * 0.008) * 8;
  const cameraY = props.cameraPath === "focus" ? interpolate(cameraProgress, [0, 1], [0, -42]) : Math.cos(frame * 0.007) * 5;
  const edgeLength = 940;
  const fade = clampInterp(frame, [0, 18], [0, 1]);
  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg, color: pal.text, fontFamily: FONT, overflow: "hidden" }}>
      <GradientMeshBackground palette={pal} speed={0.18} blobs={3} />
      {props.showGrid !== false && <AbsoluteFill style={{ opacity: 0.18, backgroundImage: `linear-gradient(${pal.text}0d 1px, transparent 1px), linear-gradient(90deg, ${pal.text}0d 1px, transparent 1px)`, backgroundSize: "72px 72px", maskImage: "linear-gradient(to bottom, transparent, black 20%, black 85%, transparent)" }} />}
      <FadeEdges inFrames={12} outFrames={14}>
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}>
        <AbsoluteFill style={{ padding: "76px 96px 70px", opacity: fade }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", height: 112 }}>
            <div>
              <div style={{ color: accent, fontSize: 14, fontWeight: 850, letterSpacing: ".24em" }}>{VARIANT_LABEL[props.variant]}</div>
              <div style={{ marginTop: 14, fontSize: 48, lineHeight: 1, fontWeight: 850, letterSpacing: "-.045em" }}>{props.title}</div>
              {props.subtitle && <div style={{ marginTop: 12, color: `${pal.text}88`, fontSize: 18 }}>{props.subtitle}</div>}
            </div>
            <div style={{ color: `${pal.text}68`, fontFamily: MONO, fontSize: 12, letterSpacing: ".16em", textTransform: "uppercase", paddingTop: 10 }}>FIG. {String(props.variant).split("-").map((part) => part[0]).join("").slice(0, 3)}</div>
          </div>
          <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
            <svg width="100%" height="100%" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid meet" style={{ overflow: "visible" }}>
              <g transform={`translate(${cameraX} ${cameraY})`}>
                {edges.map((edge, i) => {
                  const from = byId.get(edge.from) ?? points[i % points.length];
                  const to = byId.get(edge.to) ?? points[(i + 1) % points.length];
                  if (!from || !to) return null;
                  const active = edge.from === focus || edge.to === focus;
                  const length = Math.hypot(to.x! - from.x!, to.y! - from.y!);
                  const progress = clampInterp(frame, [18 + i * 5, 42 + i * 5], [0, 1]);
                  return <g key={`${edge.from}-${edge.to}-${i}`} opacity={progress}>
                    <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={edge.color ?? (active ? accent : `${pal.text}42`)} strokeWidth={active ? 4 : 2} strokeDasharray={active ? "9 8" : "5 9"} strokeDashoffset={-frame * (active ? 1.5 : .35)} />
                    <polygon points={`${to.x},${to.y} ${to.x! - (to.x! > from.x! ? 13 : -13)},${to.y! - 5} ${to.x! - (to.x! > from.x! ? 10 : -10)},${to.y! + 8}`} fill={edge.color ?? (active ? accent : `${pal.text}55`)} />
                    {edge.label && <text x={(from.x! + to.x!) / 2} y={(from.y! + to.y!) / 2 - 12} fill={`${pal.text}8a`} fontFamily={MONO} fontSize="12" textAnchor="middle">{edge.label}</text>}
                    <circle cx={interpolate(progress, [0, 1], [from.x!, to.x!])} cy={interpolate(progress, [0, 1], [from.y!, to.y!])} r={active ? 6 : 4} fill={active ? accent : pal.secondary} opacity={.75} />
                  </g>;
                })}
                {points.map((node, i) => <DiagramNodeView key={node.id} node={node} x={node.x!} y={node.y!} pal={pal} accent={accent} active={node.id === focus} index={i} frame={frame} />)}
                {props.notes?.slice(0, 3).map((note, i) => <g key={`note-${i}`} opacity={clampInterp(frame, [44 + i * 8, 62 + i * 8], [0, 1])}>
                  <path d={`M ${points[i % points.length]?.x ?? 600} ${points[i % points.length]?.y ?? 350} Q ${560 + i * 40} ${80 + i * 25} ${830 + i * 90} ${95 + i * 30}`} fill="none" stroke={accent} strokeOpacity=".55" strokeDasharray="3 8" />
                  <rect x={830 + i * 90} y={68 + i * 30} width="150" height="50" rx="12" fill={`${pal.bg}dd`} stroke={`${accent}77`} />
                  <text x={905 + i * 90} y={98 + i * 30} fill={pal.text} fontFamily={FONT} fontSize="13" textAnchor="middle">{note.slice(0, 20)}</text>
                </g>)}
              </g>
            </svg>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: `${pal.text}62`, fontFamily: MONO, fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase" }}>
            <span>{points.length} nodes / {edges.length} connections</span><span>Animated explanation system</span>
          </div>
          </AbsoluteFill>
        </div>
      </FadeEdges>
    </AbsoluteFill>
  );
};

const familyCast = (component: React.FC<ExplainerDiagramsProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;
export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "explainer-diagrams-system-overview": familyCast(ExplainerDiagramsTemplate),
  "explainer-diagrams-layered-architecture": familyCast(ExplainerDiagramsTemplate),
  "explainer-diagrams-input-output": familyCast(ExplainerDiagramsTemplate),
  "explainer-diagrams-zoom-into-node": familyCast(ExplainerDiagramsTemplate),
  "explainer-diagrams-cycle-diagram": familyCast(ExplainerDiagramsTemplate),
  "explainer-diagrams-before-after-system": familyCast(ExplainerDiagramsTemplate),
  "explainer-diagrams-callout-network": familyCast(ExplainerDiagramsTemplate),
  "explainer-diagrams-component-assembly": familyCast(ExplainerDiagramsTemplate),
  "explainer-diagrams-decision-tree": familyCast(ExplainerDiagramsTemplate),
  "explainer-diagrams-concept-map": familyCast(ExplainerDiagramsTemplate),
};
