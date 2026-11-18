import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { resolvePalette, type Palette } from "../lib/primitives";

/** Deterministic, asset-free animated mathematics visualizations for explainers and lessons. */
type MathVisualVariant =
  | "function-plot"
  | "geometry-proof"
  | "fraction-build"
  | "vector-field"
  | "area-under-curve"
  | "probability-bars"
  | "matrix-transform"
  | "number-line"
  | "sequence-growth"
  | "equation-solve";

export interface MathVisualsProps {
  variant: MathVisualVariant;
  title: string;
  subtitle: string;
  paletteName: string;
  equation?: string;
  points?: Array<{ x: number; y: number; label?: string }>;
  values?: number[];
  labels?: string[];
  colors?: string[];
  annotations?: string[];
  range?: { min: number; max: number };
  stepDurations?: number[];
  seed?: number;
  speed?: number;
}

type VProps = { p: MathVisualsProps; pal: Palette };
const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, monospace';
const W = 1000;
const H = 600;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const ease = (frame: number, start = 0, duration = 24) => clamp01((frame - start) / duration);
const data = (p: MathVisualsProps) => (p.values?.length ? p.values : [2, 4, 3, 7, 6, 9]);
const colors = (p: MathVisualsProps, pal: Palette) => p.colors?.length ? p.colors : [pal.primary, pal.secondary, pal.accent];
const text = (p: MathVisualsProps, fallback: string) => p.equation || fallback;
const pt = (x: number, y: number) => `${x.toFixed(1)},${y.toFixed(1)}`;

const Frame: React.FC<VProps & { children: React.ReactNode }> = ({ p, pal, children }) => {
  const frame = useCurrentFrame();
  const intro = ease(frame, 0, 22);
  return (
    <AbsoluteFill style={{ background: pal.bg, color: pal.text, fontFamily: FONT, overflow: "hidden" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-label={p.title}>
        <defs>
          <linearGradient id="math-wash" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={pal.primary} stopOpacity=".18"/><stop offset="1" stopColor={pal.accent} stopOpacity=".03"/></linearGradient>
          <filter id="math-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <rect width={W} height={H} fill="url(#math-wash)" />
        <g opacity={intro}>{children}</g>
        <text x="70" y="74" fill={pal.text} fontSize="30" fontWeight="750" letterSpacing="-.02em">{p.title}</text>
        <text x="72" y="101" fill={pal.text} opacity=".5" fontSize="14" letterSpacing="2">{p.subtitle}</text>
        <text x="850" y="74" fill={pal.accent} opacity=".8" fontFamily={MONO} fontSize="13" textAnchor="end" letterSpacing="2">MATH / STUDY</text>
      </svg>
    </AbsoluteFill>
  );
};

const Axes: React.FC<{ pal: Palette; x0?: number; y0?: number; x1?: number; y1?: number }> = ({ pal, x0 = 120, y0 = 500, x1 = 900, y1 = 145 }) => (
  <g stroke={pal.text} strokeOpacity=".25" strokeWidth="1.5"><line x1={x0} y1={y0} x2={x1} y2={y0}/><line x1={x0} y1={y0} x2={x0} y2={y1}/>{Array.from({ length: 7 }, (_, i) => <line key={i} x1={x0 + i * ((x1-x0)/6)} y1={y0} x2={x0 + i * ((x1-x0)/6)} y2={y1} strokeDasharray="2 10" opacity=".45"/>)}{Array.from({ length: 5 }, (_, i) => <line key={`h${i}`} x1={x0} y1={y0 - i * ((y0-y1)/4)} x2={x1} y2={y0 - i * ((y0-y1)/4)} strokeDasharray="2 10" opacity=".45"/>)}</g>
);

const FunctionPlot: React.FC<VProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const c = colors(p, pal); const reveal = ease(frame, 12, 48);
  const points = Array.from({ length: 100 }, (_, i) => { const x = 120 + i * 7.8; const t = (i / 99) * 8 - 4; const y = 325 - (t * t * 10 - 20 * Math.sin(t)) * 4; return [x, y] as const; });
  const d = points.map(([x,y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const dash = 850; return <Frame p={p} pal={pal}><Axes pal={pal}/><path d={d} fill="none" stroke={c[0]} strokeWidth="8" opacity=".18" filter="url(#math-glow)"/><path d={d} fill="none" stroke={c[0]} strokeWidth="4" strokeDasharray={dash} strokeDashoffset={dash * (1-reveal)} /><text x="690" y="180" fill={c[2]} fontFamily={MONO} fontSize="22">{text(p, "f(x) = x² − 2 sin x")}</text><circle cx="670" cy="325" r="7" fill={c[2]} opacity={.5 + .5 * Math.sin(frame * .08)} /></Frame>;
};

const GeometryProof: React.FC<VProps> = ({ p, pal }) => { const frame = useCurrentFrame(); const t=ease(frame,10,35); const c=colors(p,pal); const A=[220,460], B=[700,460], C=[700,190]; return <Frame p={p} pal={pal}><polygon points={[A,B,C].map(([x,y])=>pt(x,y)).join(" ")} fill={c[0]} fillOpacity={.1*t} stroke={c[0]} strokeWidth="4"/><line x1={A[0]} y1={A[1]} x2={C[0]} y2={C[1]} stroke={c[1]} strokeWidth="3" strokeDasharray="8 8" opacity={t}/><path d="M660 460 V420 H700" fill="none" stroke={c[2]} strokeWidth="4" opacity={t}/><text x="190" y="505" fill={pal.text} opacity={.65}>A</text><text x="710" y="480" fill={pal.text} opacity={.65}>B</text><text x="710" y="180" fill={pal.text} opacity={.65}>C</text><text x="260" y="210" fill={c[2]} fontFamily={MONO} fontSize="20">{text(p,"a² + b² = c²")}</text><text x="260" y="245" fill={pal.text} opacity=".55" fontSize="15">{p.annotations?.[0] ?? "Right angle preserved"}</text></Frame>; };

const FractionBuild: React.FC<VProps> = ({ p, pal }) => { const frame=useCurrentFrame(); const c=colors(p,pal); const vals=data(p); const den=Math.max(2, Math.min(12, Math.round(vals[0] ?? 8))); const num=Math.max(1, Math.min(den-1, Math.round(vals[1] ?? 3))); const t=ease(frame,8,34); return <Frame p={p} pal={pal}><text x="150" y="190" fill={c[2]} fontSize="78" fontWeight="700">{num}</text><line x1="140" y1="210" x2="240" y2="210" stroke={pal.text} strokeWidth="6"/><text x="170" y="285" fill={pal.text} fontSize="70">{den}</text><g transform="translate(350 190)">{Array.from({length:den},(_,i)=>{const fill=i<num?c[0]:pal.text;return <rect key={i} x={(i%6)*82} y={Math.floor(i/6)*82} width="64" height="64" rx="9" fill={fill} fillOpacity={i<num?t:.12} stroke={pal.text} strokeOpacity=".35"/>;})}</g><text x="350" y="470" fill={pal.text} opacity=".6" fontFamily={MONO} fontSize="20">{text(p, `${num} parts shaded of ${den}`)}</text></Frame>; };

const VectorField: React.FC<VProps> = ({ p, pal }) => { const frame=useCurrentFrame(); const c=colors(p,pal); return <Frame p={p} pal={pal}><Axes pal={pal}/>{Array.from({length:42},(_,i)=>{const x=170+(i%7)*105,y=190+Math.floor(i/7)*70; const a=Math.atan2(330-y,540-x)+Math.sin(frame*.025+i)*.35; const len=22+Math.sin(i+frame*.04)*7; const x2=x+Math.cos(a)*len,y2=y+Math.sin(a)*len; return <g key={i} stroke={c[i%3]} strokeWidth="3" opacity=".7"><line x1={x} y1={y} x2={x2} y2={y2}/><path d={`M${x2} ${y2} l${-Math.cos(a-.55)*8} ${-Math.sin(a-.55)*8} M${x2} ${y2} l${-Math.cos(a+.55)*8} ${-Math.sin(a+.55)*8}`} /></g>;})}<circle cx="540" cy="330" r="18" fill={c[2]} filter="url(#math-glow)"/><text x="150" y="180" fill={c[2]} fontFamily={MONO} fontSize="20">v(x,y) = (−y, x)</text></Frame>; };

const AreaUnderCurve: React.FC<VProps> = ({ p, pal }) => { const frame=useCurrentFrame(); const c=colors(p,pal); const t=ease(frame,12,40); const pts=Array.from({length:48},(_,i)=>{const x=190+i*13; const q=i/47; return [x,410-140*Math.sin(q*Math.PI)] as const;}); const line=pts.map(([x,y],i)=>`${i?"L":"M"}${x} ${y}`).join(" "); const area=`M${pts[0][0]} 410 ${pts.map(([x,y])=>`L${x} ${y}`).join(" ")} L${pts[pts.length-1][0]} 410 Z`; return <Frame p={p} pal={pal}><Axes pal={pal} x0={150} y0={410} x1={820} y1={165}/><path d={area} fill={c[0]} fillOpacity={.22*t}/><path d={line} fill="none" stroke={c[0]} strokeWidth="5"/><line x1="350" y1="410" x2="350" y2="306" stroke={c[2]} strokeDasharray="5 5" opacity={t}/><line x1="650" y1="410" x2="650" y2="306" stroke={c[2]} strokeDasharray="5 5" opacity={t}/><text x="380" y="245" fill={c[2]} fontFamily={MONO} fontSize="22">{text(p,"∫ f(x) dx")}</text><text x="380" y="275" fill={pal.text} opacity=".55" fontSize="15">accumulated area</text></Frame>; };

const ProbabilityBars: React.FC<VProps> = ({ p, pal }) => { const frame=useCurrentFrame(); const c=colors(p,pal); const vals=data(p).slice(0,6).map(v=>Math.max(0,v)); const max=Math.max(1,...vals); return <Frame p={p} pal={pal}><Axes pal={pal} x0={140} y0={470} x1={880} y1={165}/>{vals.map((v,i)=>{const h=250*v/max*t01(frame,i); const x=190+i*110; return <g key={i}><rect x={x} y={470-h} width="62" height={h} rx="10" fill={c[i%3]} fillOpacity=".78"/><text x={x+31} y="500" textAnchor="middle" fill={pal.text} opacity=".55" fontSize="14">{p.labels?.[i] ?? String.fromCharCode(65+i)}</text><text x={x+31} y={450-h} textAnchor="middle" fill={pal.text} fontFamily={MONO} fontSize="14">{Math.round(v/max*100)}%</text></g>;})}<text x="610" y="185" fill={c[2]} fontFamily={MONO} fontSize="19">P(outcome)</text></Frame>; };
const t01=(frame:number,index:number)=>ease(frame,index*5+8,28);

const MatrixTransform: React.FC<VProps> = ({ p, pal }) => { const frame=useCurrentFrame(); const c=colors(p,pal); const t=ease(frame,10,36); const pts=Array.from({length:16},(_,i)=>[i%4-1.5,Math.floor(i/4)-1.5] as const); return <Frame p={p} pal={pal}><g transform="translate(300 330)">{pts.map(([x,y],i)=><circle key={i} cx={x*62} cy={y*62} r="5" fill={c[0]} opacity=".65"/>)}{pts.map(([x,y],i)=>{const nx=(x*.75-y*.5)*t+x*(1-t),ny=(x*.35+y*.8)*t+y*(1-t); return <circle key={`n${i}`} cx={nx*62} cy={ny*62} r="7" fill={c[2]} opacity=".8"/>;})}<path d="M-145 0 H145 M0 -145 V145" stroke={pal.text} strokeOpacity=".22"/></g><text x="570" y="255" fill={c[2]} fontFamily={MONO} fontSize="21">{text(p,"[ 0.75  −0.50 ]")}</text><text x="570" y="288" fill={pal.text} opacity=".55" fontFamily={MONO} fontSize="18">[ 0.35   0.80 ]</text><text x="570" y="355" fill={pal.text} opacity=".5" fontSize="16">transform → rotate + scale</text></Frame>; };

const NumberLine: React.FC<VProps> = ({ p, pal }) => { const frame=useCurrentFrame(); const c=colors(p,pal); const min=p.range?.min ?? -5,max=p.range?.max ?? 5; const values=p.points?.length?p.points.map(x=>x.x):[-2,1,3]; return <Frame p={p} pal={pal}><line x1="130" y1="350" x2="870" y2="350" stroke={pal.text} strokeWidth="3"/>{Array.from({length:11},(_,i)=>{const x=130+i*74;return <g key={i}><line x1={x} y1="338" x2={x} y2="362" stroke={pal.text} strokeWidth="2"/><text x={x} y="395" textAnchor="middle" fill={pal.text} opacity=".6" fontFamily={MONO} fontSize="14">{Math.round(min+(max-min)*i/10)}</text></g>;})}{values.map((v,i)=>{const x=130+(v-min)/(max-min)*740; const y=300-i*52; const t=ease(frame,10+i*8,24); return <g key={i} opacity={t}><circle cx={x} cy={350} r="10" fill={c[i%3]}/><line x1={x} y1="350" x2={x} y2={y+12} stroke={c[i%3]} strokeDasharray="5 5"/><text x={x} y={y} textAnchor="middle" fill={c[i%3]} fontFamily={MONO} fontSize="17">{p.points?.[i]?.label ?? v}</text></g>;})}<text x="160" y="180" fill={c[2]} fontFamily={MONO} fontSize="22">{text(p,"x ∈ [−5, 5]")}</text></Frame>; };

const SequenceGrowth: React.FC<VProps> = ({ p, pal }) => { const frame=useCurrentFrame(); const c=colors(p,pal); const vals=data(p).slice(0,8); const max=Math.max(1,...vals); return <Frame p={p} pal={pal}><Axes pal={pal} x0={130} y0={470} x1={880} y1={165}/>{vals.map((v,i)=>{const h=255*v/max*t01(frame,i); const x=165+i*88; return <g key={i}><rect x={x} y={470-h} width="46" height={h} fill={c[i%3]} fillOpacity=".78"/><text x={x+23} y="500" textAnchor="middle" fill={pal.text} opacity=".55" fontSize="13">n{i+1}</text></g>;})}<path d={`M${vals.map((v,i)=>`${188+i*88} ${470-255*v/max*t01(frame,i)}`).join(" L")}`} fill="none" stroke={c[2]} strokeWidth="3" strokeDasharray="7 5"/><text x="610" y="185" fill={c[2]} fontFamily={MONO} fontSize="20">{text(p,"aₙ = 2ⁿ")}</text></Frame>; };

const EquationSolve: React.FC<VProps> = ({ p, pal }) => { const frame=useCurrentFrame(); const c=colors(p,pal); const lines=[p.equation ?? "3x + 4 = 19","3x = 15","x = 5"]; return <Frame p={p} pal={pal}><g transform="translate(190 170)">{lines.map((line,i)=>{const t=ease(frame,10+i*18,28);return <g key={i} opacity={t} transform={`translate(${(1-t)*90} 0)`}><rect x="0" y={i*110} width="620" height="78" rx="16" fill={c[i%3]} fillOpacity=".12" stroke={c[i%3]} strokeOpacity=".45"/><text x="310" y={i*110+51} textAnchor="middle" fill={pal.text} fontFamily={MONO} fontSize={28}>{line}</text>{i<2&&<text x="650" y={i*110+47} fill={c[2]} fontSize="18">{i===0?"− 4":"÷ 3"}</text>}</g>;})}</g><text x="190" y="535" fill={pal.text} opacity=".5" fontSize="15">{p.annotations?.[0] ?? "Apply the same operation to both sides"}</text></Frame>; };

const VARIANTS: Record<MathVisualVariant, React.FC<VProps>> = { "function-plot":FunctionPlot,"geometry-proof":GeometryProof,"fraction-build":FractionBuild,"vector-field":VectorField,"area-under-curve":AreaUnderCurve,"probability-bars":ProbabilityBars,"matrix-transform":MatrixTransform,"number-line":NumberLine,"sequence-growth":SequenceGrowth,"equation-solve":EquationSolve };

export const MathVisualsTemplate: React.FC<MathVisualsProps> = (props) => { const pal=resolvePalette(props.paletteName); const Variant=VARIANTS[props.variant] ?? FunctionPlot; return <Variant p={props} pal={pal}/>; };
const familyCast = (c: React.FC<MathVisualsProps>) => c as unknown as React.ComponentType<Record<string, unknown>>;
export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "math-visuals-function-plot": familyCast(MathVisualsTemplate),
  "math-visuals-geometry-proof": familyCast(MathVisualsTemplate),
  "math-visuals-fraction-build": familyCast(MathVisualsTemplate),
  "math-visuals-vector-field": familyCast(MathVisualsTemplate),
  "math-visuals-area-under-curve": familyCast(MathVisualsTemplate),
  "math-visuals-probability-bars": familyCast(MathVisualsTemplate),
  "math-visuals-matrix-transform": familyCast(MathVisualsTemplate),
  "math-visuals-number-line": familyCast(MathVisualsTemplate),
  "math-visuals-sequence-growth": familyCast(MathVisualsTemplate),
  "math-visuals-equation-solve": familyCast(MathVisualsTemplate),
};
