import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, GradientMeshBackground, clampInterp, resolvePalette, type Palette } from "../lib/primitives";

/** Advanced chart grammar: ten deterministic, data-driven chart animations. */
export type ChartAnimationsVariant =
  | "slopegraph" | "waterfall" | "funnel" | "bullet-chart" | "box-plot"
  | "histogram" | "bump-chart" | "streamgraph" | "confidence-band" | "small-multiples";
export interface ChartDatum {
  label: string;
  value: number;
  secondary?: number;
  previous?: number;
  low?: number;
  high?: number;
  values?: number[];
  color?: string;
}
export interface ChartSeries { label: string; values: number[]; color?: string; }
export interface ChartAnimationsProps {
  variant: ChartAnimationsVariant;
  title: string;
  subtitle: string;
  paletteName: string;
  data: ChartDatum[];
  series?: ChartSeries[];
  unit?: string;
  prefix?: string;
  suffix?: string;
  maxValue?: number;
  baseline?: number;
  target?: number;
  annotations?: string[];
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, monospace';
const FALLBACK: ChartDatum[] = [
  { label: "North", value: 72, secondary: 61, previous: 54, low: 48, high: 84 },
  { label: "South", value: 58, secondary: 73, previous: 66, low: 41, high: 70 },
  { label: "East", value: 86, secondary: 79, previous: 88, low: 69, high: 96 },
  { label: "West", value: 64, secondary: 45, previous: 59, low: 48, high: 78 },
  { label: "Central", value: 47, secondary: 36, previous: 42, low: 29, high: 61 },
];
const dataOf = (p: ChartAnimationsProps) => p.data?.length ? p.data : FALLBACK;
const colors = (pal: Palette) => [pal.primary, pal.secondary, pal.accent, "#a78bfa", "#22d3ee", "#fb7185"];
const maxOf = (vals: number[], supplied?: number) => Math.max(1, supplied ?? 0, ...vals.map((v) => Math.abs(v)));
const valueText = (v: number, p: ChartAnimationsProps) => `${p.prefix ?? ""}${Math.round(v).toLocaleString("en-US")}${p.suffix ?? p.unit ?? ""}`;
const xFor = (i: number, n: number, width: number, pad = 0) => pad + (n <= 1 ? width / 2 : (i / (n - 1)) * width);
const linePath = (values: number[], width: number, height: number, lo = 0, hi = Math.max(...values, 1)) => {
  const range = Math.max(1, hi - lo);
  return values.map((v, i) => `${i ? "L" : "M"}${xFor(i, values.length, width).toFixed(1)},${(height - ((v - lo) / range) * height).toFixed(1)}`).join(" ");
};

const Panel: React.FC<{ pal: Palette; children: React.ReactNode; style?: React.CSSProperties }> = ({ pal, children, style }) => (
  <div style={{ height: "100%", borderRadius: 30, padding: "30px 38px", background: `linear-gradient(145deg, ${pal.text}12, ${pal.text}04)`, border: `1px solid ${pal.text}22`, boxShadow: `0 28px 70px ${pal.bg}aa`, ...style }}>{children}</div>
);
const Grid: React.FC<{ pal: Palette; rows?: number }> = ({ pal, rows = 5 }) => (
  <>{Array.from({ length: rows }, (_, i) => <line key={i} x1="0" x2="100%" y1={`${(i / (rows - 1)) * 100}%`} y2={`${(i / (rows - 1)) * 100}%`} stroke={`${pal.text}18`} strokeDasharray="7 10" />)}</>
);

const Slopegraph: React.FC<{ p: ChartAnimationsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const d = dataOf(p); const c = colors(pal); const vals = d.map(x => [x.previous ?? x.secondary ?? x.value * .75, x.value]); const hi = maxOf(vals.flat());
  return <Panel pal={pal}><svg viewBox="0 0 1400 650" width="100%" height="100%"><Grid pal={pal}/><text x="90" y="48" fill={`${pal.text}88`} fontSize="20">PREVIOUS</text><text x="1260" y="48" fill={`${pal.text}88`} fontSize="20">CURRENT</text>{d.map((x,i)=>{const [a,b]=vals[i];const y1=95+(1-a/hi)*470;const y2=95+(1-b/hi)*470;const reveal=clampInterp(frame,[8+i*4,45+i*4],[0,1]);const col=c[i%c.length];return <g key={x.label} opacity={reveal}><path d={`M150 ${y1} C500 ${y1},900 ${y2},1250 ${y2}`} fill="none" stroke={col} strokeWidth="7" strokeLinecap="round"/><circle cx="150" cy={y1} r="12" fill={col}/><circle cx="1250" cy={y2} r="12" fill={col}/><text x="120" y={y1+6} textAnchor="end" fill={pal.text} fontSize="22">{valueText(a,p)}</text><text x="1280" y={y2+6} fill={pal.text} fontSize="22">{valueText(b,p)}</text><text x="700" y={(y1+y2)/2-10+(i%2?18:-18)} textAnchor="middle" fill={`${pal.text}a0`} fontSize="22">{x.label}</text></g>})}</svg></Panel>;
};

const Waterfall: React.FC<{ p: ChartAnimationsProps; pal: Palette }> = ({ p, pal }) => {
  const frame=useCurrentFrame(); const d=dataOf(p); const c=colors(pal); let run=p.baseline ?? 0; const rows=d.map(x=>{const start=run;run+=x.value;return {x,start,end:run};}); const hi=maxOf([0,...rows.flatMap(r=>[r.start,r.end])]);
  return <Panel pal={pal}><svg viewBox="0 0 1400 650" width="100%" height="100%"><Grid pal={pal}/>{rows.map((r,i)=>{const y1=560-r.start/hi*440,y2=560-r.end/hi*440;const top=Math.min(y1,y2),height=Math.max(8,Math.abs(y2-y1));const reveal=clampInterp(frame,[8+i*5,38+i*5],[0,1]);const col=r.end>=r.start?c[0]:pal.accent;return <g key={r.x.label} opacity={reveal}><rect x={80+i*250} y={top+(1-reveal)*height} width={150} height={height*reveal} rx="12" fill={col} /><text x={155+i*250} y={top-16} textAnchor="middle" fill={pal.text} fontFamily={MONO} fontSize="22">{valueText(r.end,p)}</text><text x={155+i*250} y="600" textAnchor="middle" fill={`${pal.text}a0`} fontSize="20">{r.x.label}</text>{i<rows.length-1&&<line x1={230+i*250} x2={330+i*250} y1={y2} y2={y2} stroke={`${pal.text}45`} strokeDasharray="7 7"/>}</g>})}</svg></Panel>;
};

const Funnel: React.FC<{ p: ChartAnimationsProps; pal: Palette }> = ({ p, pal }) => { const frame=useCurrentFrame();const d=dataOf(p);const max=maxOf(d.map(x=>x.value));const c=colors(pal);return <Panel pal={pal}><svg viewBox="0 0 1400 650" width="100%" height="100%">{d.map((x,i)=>{const w=1080*(x.value/max);const reveal=clampInterp(frame,[8+i*5,42+i*5],[0,1]);const y=40+i*108;return <g key={x.label} opacity={reveal}><path d={`M${700-w/2} ${y} L${700+w/2} ${y} L${700+w*.42/2} ${y+82} L${700-w*.42/2} ${y+82} Z`} fill={c[i%c.length]} opacity=".9"/><text x="700" y={y+53} textAnchor="middle" fill={pal.bg} fontWeight="800" fontSize="25">{x.label} · {valueText(x.value,p)}</text></g>})}</svg></Panel>; };

const BulletChart: React.FC<{ p: ChartAnimationsProps; pal: Palette }> = ({p,pal})=>{const frame=useCurrentFrame();const d=dataOf(p);const max=maxOf(d.map(x=>Math.max(x.value,x.secondary??p.target??x.value)));return <Panel pal={pal}><div style={{height:"100%",display:"flex",flexDirection:"column",justifyContent:"space-evenly"}}>{d.map((x,i)=>{const target=x.secondary??p.target??x.value*.9;const reveal=clampInterp(frame,[8+i*4,40+i*4],[0,1]);return <div key={x.label}><div style={{display:"flex",justifyContent:"space-between",fontSize:20,color:`${pal.text}b5`,marginBottom:9}}><span>{x.label}</span><span style={{fontFamily:MONO}}>{valueText(x.value,p)} / {valueText(target,p)}</span></div><div style={{height:28,background:`${pal.text}18`,borderRadius:20,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",inset:"0 auto 0 0",width:`${(x.value/max)*100*reveal}%`,background:pal.primary,borderRadius:20}}/><div style={{position:"absolute",left:`${(target/max)*100}%`,top:-7,height:42,width:5,background:pal.accent}}/></div></div>})}</div></Panel>};

const BoxPlot: React.FC<{ p: ChartAnimationsProps; pal: Palette }> = ({p,pal})=>{const frame=useCurrentFrame();const d=dataOf(p);const c=colors(pal);return <Panel pal={pal}><svg viewBox="0 0 1400 650" width="100%" height="100%">{d.map((x,i)=>{const a=x.values?.length?x.values:[x.low??x.value*.6,x.value*.8,x.value,x.value*1.15,x.high??x.value*1.35];const s=[...a].sort((u,v)=>u-v);const lo=s[0],q1=s[Math.floor(s.length*.25)],med=s[Math.floor(s.length*.5)],q3=s[Math.floor(s.length*.75)],hi=s[s.length-1];const max=maxOf(d.flatMap(z=>z.values??[z.high??z.value*1.4]));const sc=(v:number)=>100+(v/max)*1100;const reveal=clampInterp(frame,[8+i*5,44+i*5],[0,1]);const y=105+i*100;return <g key={x.label} opacity={reveal}><line x1={sc(lo)} x2={sc(hi)} y1={y} y2={y} stroke={c[i%c.length]} strokeWidth="7"/><line x1={sc(lo)} x2={sc(lo)} y1={y-22} y2={y+22} stroke={pal.text} strokeWidth="4"/><line x1={sc(hi)} x2={sc(hi)} y1={y-22} y2={y+22} stroke={pal.text} strokeWidth="4"/><rect x={sc(q1)} y={y-30} width={Math.max(8,(sc(q3)-sc(q1))*reveal)} height="60" rx="10" fill={c[i%c.length]} opacity=".8"/><line x1={sc(med)} x2={sc(med)} y1={y-30} y2={y+30} stroke={pal.text} strokeWidth="6"/><text x="35" y={y+7} fill={pal.text} fontSize="21">{x.label}</text></g>})}</svg></Panel>};

const Histogram: React.FC<{p:ChartAnimationsProps;pal:Palette}>=({p,pal})=>{const frame=useCurrentFrame();const d=dataOf(p);const vals=d.flatMap(x=>x.values??[x.value,x.value*.8,x.value*1.15]);const lo=Math.min(...vals),hi=Math.max(...vals);const bins=Array.from({length:8},(_,i)=>vals.filter(v=>v<=lo+(hi-lo)*(i+1)/8 && (i===0?v>=lo:v>lo+(hi-lo)*i/8)).length);const peak=Math.max(1,...bins);return <Panel pal={pal}><svg viewBox="0 0 1400 650" width="100%" height="100%"><Grid pal={pal}/>{bins.map((n,i)=>{const h=n/peak*470;const r=clampInterp(frame,[8+i*4,38+i*4],[0,1]);return <g key={i}><rect x={90+i*155} y={560-h*r} width="112" height={h*r} rx="10" fill={pal.primary}/><text x={146+i*155} y="600" textAnchor="middle" fill={`${pal.text}88`} fontSize="18">{Math.round(lo+(hi-lo)*(i+.5)/8)}</text></g>})}</svg></Panel>};

const BumpChart: React.FC<{p:ChartAnimationsProps;pal:Palette}>=({p,pal})=>{const frame=useCurrentFrame();const d=dataOf(p);const c=colors(pal);const n=Math.max(1,d.length);return <Panel pal={pal}><svg viewBox="0 0 1400 650" width="100%" height="100%">{Array.from({length:5},(_,i)=><line key={i} x1="100" x2="1300" y1={100+i*105} y2={100+i*105} stroke={`${pal.text}18`} strokeDasharray="8 10"/>)}{d.map((x,i)=>{const values=x.values??[x.previous??i+1,x.value,i+2,x.secondary??n-i];const path=values.map((v,j)=>`${j?"L":"M"}${100+j*380},${80+v*70}`).join(" ");const r=clampInterp(frame,[8+i*4,55+i*4],[0,1]);return <g key={x.label} opacity={r}><path d={path} fill="none" stroke={c[i%c.length]} strokeWidth="7" pathLength="1" strokeDasharray="1" strokeDashoffset={1-r}/>{values.map((v,j)=><circle key={j} cx={100+j*380} cy={80+v*70} r="12" fill={c[i%c.length]}/>) }<text x="35" y={85+values[0]*70} fill={pal.text} fontSize="19">{x.label}</text></g>})}</svg></Panel>};

const Streamgraph: React.FC<{p:ChartAnimationsProps;pal:Palette}>=({p,pal})=>{const frame=useCurrentFrame();const series=p.series?.length?p.series:[{label:"Alpha",values:dataOf(p).map(x=>x.value)},{label:"Beta",values:dataOf(p).map(x=>x.secondary??x.value*.6)},{label:"Gamma",values:dataOf(p).map(x=>x.previous??x.value*.35)}];const n=series[0].values.length;const hi=maxOf(series.flatMap(s=>s.values));const cs=colors(pal);return <Panel pal={pal}><svg viewBox="0 0 1400 650" width="100%" height="100%">{series.map((s,k)=>{const path=s.values.map((v,i)=>`${i?"L":"M"}${xFor(i,n,1200,100)},${330-(v/hi)*430}`).join(" ")+` L1300 650 L100 650 Z`;const r=clampInterp(frame,[8+k*7,60+k*7],[0,1]);return <path key={s.label} d={path} fill={cs[k%cs.length]} opacity={.6*r} transform={`translate(0 ${k*35*r})`}/>})}<text x="100" y="610" fill={`${pal.text}88`} fontSize="19">{dataOf(p).map(x=>x.label).join("   ·   ")}</text></svg></Panel>};

const ConfidenceBand: React.FC<{p:ChartAnimationsProps;pal:Palette}>=({p,pal})=>{const frame=useCurrentFrame();const d=dataOf(p);const hi=maxOf(d.map(x=>x.high??x.value*1.2));const mid=d.map(x=>x.value);const upper=d.map(x=>x.high??x.value*1.2);const lower=d.map(x=>x.low??x.value*.8);const up=linePath(upper,1200,480,0,hi);const low=linePath(lower,1200,480,0,hi);const fill=`${up} ${low.split(" ").reverse().join(" ")} Z`;const r=clampInterp(frame,[8,65],[0,1]);return <Panel pal={pal}><svg viewBox="0 0 1400 650" width="100%" height="100%"><Grid pal={pal}/><path d={fill} fill={pal.secondary} opacity={.22*r}/><path d={linePath(mid,1200,480,0,hi)} fill="none" stroke={pal.primary} strokeWidth="9" pathLength="1" strokeDasharray="1" strokeDashoffset={1-r}/>{d.map((x,i)=><text key={x.label} x={100+i*(1200/Math.max(1,d.length-1))} y="610" textAnchor="middle" fill={`${pal.text}88`} fontSize="18">{x.label}</text>)}</svg></Panel>};

const SmallMultiples: React.FC<{p:ChartAnimationsProps;pal:Palette}>=({p,pal})=>{const frame=useCurrentFrame();const d=dataOf(p);const c=colors(pal);return <Panel pal={pal}><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:22,height:"100%"}}>{d.slice(0,6).map((x,i)=>{const values=x.values??[x.value*.65,x.value*.82,x.value,x.secondary??x.value*1.15,x.value*.94];const r=clampInterp(frame,[8+i*4,42+i*4],[0,1]);return <div key={x.label} style={{border:`1px solid ${pal.text}20`,borderRadius:18,padding:18,opacity:r}}><div style={{fontSize:19,color:`${pal.text}aa`}}>{x.label}</div><svg viewBox="0 0 300 150" width="100%" height="75%"><path d={linePath(values,280,120,0,maxOf(values))} fill="none" stroke={c[i%c.length]} strokeWidth="7" pathLength="1" strokeDasharray="1" strokeDashoffset={1-r}/></svg><div style={{fontFamily:MONO,fontSize:23}}>{valueText(x.value,p)}</div></div>})}</div></Panel>};

const VARIANTS: Record<ChartAnimationsVariant, React.FC<{p:ChartAnimationsProps;pal:Palette}>> = {"slopegraph":Slopegraph,"waterfall":Waterfall,"funnel":Funnel,"bullet-chart":BulletChart,"box-plot":BoxPlot,"histogram":Histogram,"bump-chart":BumpChart,"streamgraph":Streamgraph,"confidence-band":ConfidenceBand,"small-multiples":SmallMultiples};

export const ChartAnimationsTemplate: React.FC<ChartAnimationsProps> = (props) => { const pal=resolvePalette(props.paletteName); const Variant=VARIANTS[props.variant]??Slopegraph; const {width,height}=useVideoConfig(); const fit=Math.min(width/1920,height/1080); return <AbsoluteFill style={{backgroundColor:pal.bg,color:pal.text,fontFamily:FONT}}><GradientMeshBackground palette={pal} blobs={4} speed={.24}/><FadeEdges inFrames={12} outFrames={14}><div style={{position:"absolute",left:"50%",top:"50%",width:1920,height:1080,transform:`translate(-50%, -50%) scale(${fit})`,transformOrigin:"center center"}}><AbsoluteFill style={{padding:"78px 100px"}}><div style={{height:112}}><div style={{fontSize:45,fontWeight:800,letterSpacing:"-.04em"}}>{props.title}</div><div style={{marginTop:10,fontSize:20,color:`${pal.text}88`,letterSpacing:".04em"}}>{props.subtitle}</div></div><div style={{height:"calc(100% - 112px)"}}><Variant p={props} pal={pal}/></div></AbsoluteFill></div></FadeEdges></AbsoluteFill>; };
const familyCast=(component:React.FC<ChartAnimationsProps>)=>component as unknown as React.ComponentType<Record<string,unknown>>;
export const FAMILY_COMPONENTS: Record<string,React.ComponentType<Record<string,unknown>>> = {
  "chart-animations-slopegraph": familyCast(ChartAnimationsTemplate), "chart-animations-waterfall": familyCast(ChartAnimationsTemplate), "chart-animations-funnel": familyCast(ChartAnimationsTemplate), "chart-animations-bullet-chart": familyCast(ChartAnimationsTemplate), "chart-animations-box-plot": familyCast(ChartAnimationsTemplate), "chart-animations-histogram": familyCast(ChartAnimationsTemplate), "chart-animations-bump-chart": familyCast(ChartAnimationsTemplate), "chart-animations-streamgraph": familyCast(ChartAnimationsTemplate), "chart-animations-confidence-band": familyCast(ChartAnimationsTemplate), "chart-animations-small-multiples": familyCast(ChartAnimationsTemplate),
};
