import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, GradientMeshBackground, resolvePalette, type Palette } from "../lib/primitives";

/**
 * FAMILY: process-flows
 * Ten deterministic process-story systems: linear, branching, swimlane,
 * pipeline, loop, retry, handoff, blueprint, checklist, and metrics views.
 */
export type ProcessVariant =
  | "linear-process"
  | "branching-process"
  | "swimlane-flow"
  | "automation-pipeline"
  | "approval-loop"
  | "error-retry"
  | "handoff-chain"
  | "service-blueprint"
  | "checklist-flow"
  | "process-metrics";

type StepStatus = "pending" | "active" | "complete" | "blocked" | "retry";

export interface ProcessStep {
  id: string;
  label: string;
  detail?: string;
  owner?: string;
  status?: StepStatus;
  duration?: string;
  metric?: string;
}

export interface ProcessBranch {
  from: string;
  to: string;
  label?: string;
  tone?: "success" | "warning" | "neutral";
}

export interface ProcessFlowsProps {
  variant: ProcessVariant;
  title: string;
  subtitle: string;
  paletteName: string;
  steps?: ProcessStep[];
  branches?: ProcessBranch[];
  owners?: string[];
  highlightStep?: string;
  showMetrics?: boolean;
  speed?: number;
  accentColor?: string;
}

type Point = { x: number; y: number };

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const DEFAULT_STEPS: ProcessStep[] = [
  { id: "intake", label: "Intake", detail: "Capture the brief", owner: "Request", status: "complete", duration: "2m", metric: "100%" },
  { id: "shape", label: "Shape", detail: "Clarify the work", owner: "Strategy", status: "complete", duration: "8m", metric: "96%" },
  { id: "build", label: "Build", detail: "Create the output", owner: "Studio", status: "active", duration: "24m", metric: "82%" },
  { id: "review", label: "Review", detail: "Check the result", owner: "Quality", status: "pending", duration: "6m", metric: "74%" },
  { id: "approve", label: "Approve", detail: "Give the go-ahead", owner: "Owner", status: "pending", duration: "3m", metric: "68%" },
  { id: "ship", label: "Ship", detail: "Deliver the work", owner: "Delivery", status: "pending", duration: "4m", metric: "61%" },
  { id: "learn", label: "Learn", detail: "Feed the next cycle", owner: "Growth", status: "pending", duration: "5m", metric: "55%" },
  { id: "scale", label: "Scale", detail: "Repeat with confidence", owner: "Ops", status: "pending", duration: "7m", metric: "49%" },
];

const variantEyebrow: Record<ProcessVariant, string> = {
  "linear-process": "PROCESS / 001",
  "branching-process": "DECISION TREE / 002",
  "swimlane-flow": "OWNERSHIP / 003",
  "automation-pipeline": "AUTOMATION / 004",
  "approval-loop": "CONTROL LOOP / 005",
  "error-retry": "RECOVERY / 006",
  "handoff-chain": "HANDOFF / 007",
  "service-blueprint": "SERVICE BLUEPRINT / 008",
  "checklist-flow": "CHECKLIST / 009",
  "process-metrics": "OPERATIONS / 010",
};

const statusColor = (status: StepStatus | undefined, pal: Palette): string => {
  if (status === "complete") return pal.secondary;
  if (status === "active") return pal.accent;
  if (status === "blocked" || status === "retry") return "#fb7185";
  return `${pal.text}70`;
};

const normalizeSteps = (steps?: ProcessStep[]): ProcessStep[] => {
  const source = steps?.length ? steps : DEFAULT_STEPS;
  return source.slice(0, 10).map((step, i) => ({
    ...step,
    id: step.id || `step-${i + 1}`,
    label: step.label || `Step ${i + 1}`,
    owner: step.owner || ["Request", "Strategy", "Studio", "Quality", "Owner"][i % 5],
    status: step.status || (i < 2 ? "complete" : i === 2 ? "active" : "pending"),
    duration: step.duration || `${i + 2}m`,
    metric: step.metric || `${Math.max(32, 100 - i * 8)}%`,
  }));
};

const positionsFor = (variant: ProcessVariant, steps: ProcessStep[]): Point[] => {
  const n = steps.length;
  if (variant === "checklist-flow") {
    return steps.map((_, i) => ({ x: 540, y: 260 + i * 76 }));
  }
  if (variant === "approval-loop") {
    return steps.map((_, i) => {
      const angle = -Math.PI / 2 + (i / Math.max(1, n)) * Math.PI * 2;
      return { x: 1010 + Math.cos(angle) * 520, y: 570 + Math.sin(angle) * 270 };
    });
  }
  if (variant === "branching-process") {
    return steps.map((_, i) => {
      if (i < 4) return { x: 270 + i * 260, y: 510 };
      const branchIndex = i - 4;
      return { x: 790 + (branchIndex % 3) * 250, y: branchIndex % 2 === 0 ? 320 : 720 };
    });
  }
  if (variant === "swimlane-flow" || variant === "service-blueprint") {
    return steps.map((step, i) => ({ x: 285 + (i % 6) * 285, y: variant === "swimlane-flow" ? 330 + (i % 3) * 190 : i % 2 ? 690 : 410 }));
  }
  if (variant === "error-retry") {
    return steps.map((_, i) => ({ x: 250 + (i % 6) * 285, y: i === 4 || i === 6 ? 740 : 470 }));
  }
  if (variant === "process-metrics") {
    return steps.map((_, i) => ({ x: 250 + (i % 6) * 285, y: i < 6 ? 470 : 780 }));
  }
  return steps.map((_, i) => ({ x: 230 + (i / Math.max(1, n - 1)) * 1460, y: variant === "automation-pipeline" ? 520 : variant === "handoff-chain" ? 510 : 550 }));
};

const laneNames = (steps: ProcessStep[]): string[] => Array.from(new Set(steps.map((step) => step.owner || "Team"))).slice(0, 4);

const connectionsFor = (variant: ProcessVariant, steps: ProcessStep[], positions: Point[]): ProcessBranch[] => {
  const out: ProcessBranch[] = [];
  for (let i = 0; i < steps.length - 1; i += 1) {
    out.push({ from: steps[i].id, to: steps[i + 1].id, tone: steps[i + 1].status === "blocked" ? "warning" : "success" });
  }
  if (variant === "branching-process" && steps.length >= 6) {
    out.push({ from: steps[1].id, to: steps[4].id, label: "YES", tone: "success" });
    out.push({ from: steps[1].id, to: steps[5].id, label: "NO", tone: "warning" });
  }
  if (variant === "approval-loop" && steps.length > 2) {
    out.push({ from: steps[3].id, to: steps[1].id, label: "REVISE", tone: "warning" });
  }
  if (variant === "error-retry" && steps.length > 4) {
    out.push({ from: steps[4].id, to: steps[2].id, label: "RETRY", tone: "warning" });
  }
  if (variant === "service-blueprint") {
    for (let i = 0; i < Math.min(steps.length, 5); i += 1) {
      if (i + 3 < steps.length) out.push({ from: steps[i].id, to: steps[i + 3].id, label: "handoff", tone: "neutral" });
    }
  }
  return out.filter((edge) => positions.some((_, i) => steps[i].id === edge.from) && positions.some((_, i) => steps[i].id === edge.to));
};

const ProcessNode: React.FC<{
  step: ProcessStep;
  point: Point;
  index: number;
  pal: Palette;
  variant: ProcessVariant;
  highlighted: boolean;
  progress: number;
}> = ({ step, point, index, pal, variant, highlighted, progress }) => {
  const color = statusColor(step.status, pal);
  const isChecklist = variant === "checklist-flow";
  const isMetric = variant === "process-metrics";
  const cardWidth = isChecklist ? 760 : variant === "service-blueprint" ? 240 : 232;
  const cardHeight = isChecklist ? 58 : variant === "service-blueprint" ? 116 : 106;
  return (
    <div
      style={{
        position: "absolute",
        left: point.x,
        top: point.y,
        width: cardWidth,
        minHeight: cardHeight,
        transform: `translate(-50%, -50%) scale(${0.88 + progress * 0.12})`,
        opacity: progress,
        borderRadius: isChecklist ? 18 : 22,
        border: `1px solid ${highlighted ? pal.accent : `${pal.text}22`}`,
        background: highlighted ? `${pal.accent}18` : `${pal.bg}dd`,
        boxShadow: highlighted ? `0 0 0 5px ${pal.accent}16, 0 18px 50px ${pal.bg}88` : `0 18px 46px ${pal.bg}70`,
        padding: isChecklist ? "13px 20px" : "18px 18px 16px",
        boxSizing: "border-box",
        color: pal.text,
        fontFamily: FONT,
        display: "flex",
        alignItems: "center",
        gap: 14,
        zIndex: highlighted ? 4 : 2,
      }}
    >
      <div style={{ width: isChecklist ? 30 : 42, height: isChecklist ? 30 : 42, borderRadius: isChecklist ? 10 : 14, background: `${color}20`, border: `2px solid ${color}`, display: "grid", placeItems: "center", flex: "0 0 auto", color }}>
        <span style={{ font: `900 ${isChecklist ? 12 : 14}px ${MONO}` }}>{step.status === "complete" ? "✓" : String(index + 1).padStart(2, "0")}</span>
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <div style={{ fontSize: isChecklist ? 20 : 21, fontWeight: 850, letterSpacing: "-.035em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{step.label}</div>
          {isMetric && <div style={{ marginLeft: "auto", color, font: `800 15px ${MONO}` }}>{step.metric}</div>}
        </div>
        {!isChecklist && <div style={{ marginTop: 6, color: `${pal.text}91`, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{step.detail}</div>}
        <div style={{ display: "flex", gap: 9, marginTop: isChecklist ? 0 : 11, color: `${pal.text}66`, font: `700 10px ${MONO}`, letterSpacing: ".08em", textTransform: "uppercase" }}>
          <span>{step.owner}</span><span>·</span><span>{step.duration}</span><span style={{ color }}>{step.status}</span>
        </div>
      </div>
    </div>
  );
};

const ProcessBoard: React.FC<{ p: ProcessFlowsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const steps = normalizeSteps(p.steps);
  const positions = positionsFor(p.variant, steps);
  const byId = new Map(steps.map((step, i) => [step.id, positions[i]]));
  const edges = [
    ...connectionsFor(p.variant, steps, positions),
    ...(p.branches || []),
  ];
  const intro = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 18, stiffness: 90 } });
  const reveal = interpolate(frame, [8, Math.max(20, durationInFrames * 0.72)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const activeIndex = Math.min(steps.length - 1, Math.floor(reveal * steps.length));
  const highlighted = p.highlightStep || steps[activeIndex]?.id;
  const markerId = `process-arrow-${p.variant}`;
  const lanes = laneNames(steps);
  const toneStroke = (tone?: ProcessBranch["tone"]): string => tone === "warning" ? "#fb7185" : tone === "neutral" ? `${pal.text}55` : pal.accent;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {p.variant === "checklist-flow" ? <div style={{ position: "absolute", left: 140, top: 190, bottom: 120, width: 2, background: `${pal.text}18` }} /> : null}
      {p.variant === "swimlane-flow" ? lanes.map((lane, i) => <div key={lane} style={{ position: "absolute", left: 130, right: 130, top: 230 + i * 190, height: 150, borderRadius: 22, border: `1px solid ${pal.text}14`, background: `${pal.text}04` }}><div style={{ position: "absolute", left: 22, top: 18, color: `${pal.text}62`, font: `800 11px ${MONO}`, letterSpacing: ".18em" }}>{lane.toUpperCase()}</div></div>) : null}
      {p.variant === "service-blueprint" ? <>
        <div style={{ position: "absolute", left: 120, right: 120, top: 520, borderTop: `2px dashed ${pal.accent}88` }} />
        <div style={{ position: "absolute", left: 136, top: 432, color: pal.accent, font: `800 11px ${MONO}`, letterSpacing: ".18em" }}>CUSTOMER ACTION</div>
        <div style={{ position: "absolute", left: 136, top: 596, color: `${pal.text}72`, font: `800 11px ${MONO}`, letterSpacing: ".18em" }}>BACKSTAGE SYSTEM</div>
      </> : null}
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
        <defs><marker id={markerId} markerWidth="10" markerHeight="10" refX="8" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill={pal.accent} /></marker></defs>
        {edges.map((edge, i) => {
          const a = byId.get(edge.from); const b = byId.get(edge.to);
          if (!a || !b) return null;
          const curved = p.variant === "approval-loop" || p.variant === "error-retry" || p.variant === "service-blueprint";
          const midY = curved ? (a.y + b.y) / 2 + (i % 2 ? 76 : -76) : (a.y + b.y) / 2;
          const d = curved ? `M${a.x} ${a.y} Q${(a.x + b.x) / 2} ${midY} ${b.x} ${b.y}` : `M${a.x} ${a.y} L${b.x} ${b.y}`;
          return <g key={`${edge.from}-${edge.to}-${i}`} opacity={interpolate(frame, [10 + i * 3, 26 + i * 3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
            <path d={d} fill="none" stroke={toneStroke(edge.tone)} strokeWidth={edge.tone === "neutral" ? 2 : 4} strokeDasharray={edge.tone === "neutral" ? "8 10" : undefined} strokeDashoffset={-frame * (p.speed ?? 1) * 1.8} markerEnd={edge.tone === "neutral" ? undefined : `url(#${markerId})`} />
            {edge.label && <text x={(a.x + b.x) / 2} y={midY - 12} fill={toneStroke(edge.tone)} textAnchor="middle" fontFamily={MONO} fontSize="12" fontWeight="800" letterSpacing="2">{edge.label}</text>}
          </g>;
        })}
        {p.variant === "approval-loop" && <ellipse cx="1010" cy="570" rx="520" ry="270" fill="none" stroke={`${pal.accent}20`} strokeWidth="2" strokeDasharray="5 16" />}
      </svg>
      {steps.map((step, i) => <ProcessNode key={step.id} step={step} point={positions[i]} index={i} pal={pal} variant={p.variant} highlighted={step.id === highlighted} progress={Math.min(1, Math.max(0, intro * interpolate(frame, [8 + i * 3, 30 + i * 3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })))} />)}
      <div style={{ position: "absolute", right: 130, bottom: 92, color: `${pal.text}70`, font: `800 11px ${MONO}`, letterSpacing: ".16em" }}>STEPS / {String(steps.length).padStart(2, "0")} · {p.variant.replaceAll("-", " ").toUpperCase()}</div>
    </AbsoluteFill>
  );
};

const MetricsRail: React.FC<{ steps: ProcessStep[]; pal: Palette }> = ({ steps, pal }) => {
  const metrics = [
    ["CYCLE TIME", "48m"],
    ["THROUGHPUT", "2.4k"],
    ["PASS RATE", "96%"],
  ];
  return <div style={{ position: "absolute", left: 140, right: 140, bottom: 86, display: "flex", gap: 14 }}>{metrics.map(([label, value]) => <div key={label} style={{ flex: 1, border: `1px solid ${pal.text}18`, borderRadius: 16, padding: "13px 18px", background: `${pal.bg}aa` }}><div style={{ color: `${pal.text}62`, font: `800 10px ${MONO}`, letterSpacing: ".16em" }}>{label}</div><div style={{ marginTop: 5, color: pal.accent, font: `850 22px ${MONO}` }}>{value}</div></div>)}</div>;
};

export const ProcessFlowsTemplate: React.FC<ProcessFlowsProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const steps = normalizeSteps(props.steps);
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return (
    <AbsoluteFill style={{ backgroundColor: pal.bg, color: pal.text, fontFamily: FONT }}>
      <GradientMeshBackground palette={pal} blobs={pVariantBlobs(props.variant)} speed={0.32 * (props.speed ?? 1)} />
      <FadeEdges inFrames={12} outFrames={14}>
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}>
          <ProcessBoard p={props} pal={pal} />
        </div>
      </FadeEdges>
      <div style={{ position: "absolute", left: 120, top: 90, width: 1120 }}>
        <div style={{ color: props.accentColor || pal.accent, font: `900 13px ${MONO}`, letterSpacing: ".24em" }}>{variantEyebrow[props.variant]}</div>
        <div style={{ marginTop: 14, fontSize: 60, lineHeight: .96, fontWeight: 900, letterSpacing: "-.06em" }}>{props.title}</div>
        <div style={{ marginTop: 14, color: `${pal.text}8c`, fontSize: 20, lineHeight: 1.35, maxWidth: 720 }}>{props.subtitle}</div>
      </div>
      {props.variant === "process-metrics" || props.showMetrics ? <MetricsRail steps={steps} pal={pal} /> : null}
    </AbsoluteFill>
  );
};

const pVariantBlobs = (variant: ProcessVariant): number => variant === "automation-pipeline" || variant === "process-metrics" ? 5 : variant === "checklist-flow" ? 3 : 4;

const familyCast = (component: React.FC<ProcessFlowsProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "process-flows-linear-process": familyCast(ProcessFlowsTemplate),
  "process-flows-branching-process": familyCast(ProcessFlowsTemplate),
  "process-flows-swimlane-flow": familyCast(ProcessFlowsTemplate),
  "process-flows-automation-pipeline": familyCast(ProcessFlowsTemplate),
  "process-flows-approval-loop": familyCast(ProcessFlowsTemplate),
  "process-flows-error-retry": familyCast(ProcessFlowsTemplate),
  "process-flows-handoff-chain": familyCast(ProcessFlowsTemplate),
  "process-flows-service-blueprint": familyCast(ProcessFlowsTemplate),
  "process-flows-checklist-flow": familyCast(ProcessFlowsTemplate),
  "process-flows-process-metrics": familyCast(ProcessFlowsTemplate),
};
