import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, GradientMeshBackground, clampInterp, resolvePalette, seededRand, type Palette } from "../lib/primitives";

/** FAMILY: app-install-ads — ten mobile-acquisition narratives with procedural defaults. */
type AppInstallVariant =
  | "pain-to-app"
  | "screen-swipe"
  | "feature-stack"
  | "rating-proof"
  | "store-badges"
  | "notification-value"
  | "one-tap-demo"
  | "offline-mode"
  | "privacy-proof"
  | "install-cta";

export interface AppInstallAdsProps {
  variant: AppInstallVariant;
  appName: string;
  headline: string;
  subline: string;
  painPoint: string;
  cta: string;
  rating: string;
  reviewCount: string;
  paletteName: string;
  screenUrls?: string[];
  features?: string[];
  storeLinks?: string[];
  device?: "phone" | "tablet" | "both";
  privacyLabel?: string;
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const fallbackFeatures = ["Plan in seconds", "Smart reminders", "Works everywhere", "Made for focus"];

const Label: React.FC<{ children: React.ReactNode; pal: Palette; center?: boolean }> = ({ children, pal, center = false }) => (
  <div style={{ color: pal.accent, font: `850 18px ${FONT}`, letterSpacing: ".22em", textTransform: "uppercase", textAlign: center ? "center" : "left" }}>{children}</div>
);

const Copy: React.FC<{ p: AppInstallAdsProps; pal: Palette; eyebrow?: string; center?: boolean }> = ({ p, pal, eyebrow = "MADE FOR MOMENTUM", center = false }) => {
  const frame = useCurrentFrame();
  const y = clampInterp(frame, [4, 23], [32, 0]);
  return <div style={{ color: pal.text, fontFamily: FONT, textAlign: center ? "center" : "left", opacity: clampInterp(frame, [4, 18], [0, 1]), transform: `translateY(${y}px)` }}>
    <Label pal={pal} center={center}>{eyebrow}</Label>
    <div style={{ marginTop: 15, fontSize: "clamp(42px, 5.6vw, 92px)", lineHeight: .96, fontWeight: 950, letterSpacing: "-.06em" }}>{p.headline}</div>
    <div style={{ marginTop: 20, color: `${pal.text}ad`, fontSize: "clamp(19px, 1.7vw, 29px)", lineHeight: 1.35 }}>{p.subline}</div>
  </div>;
};

const AppIcon: React.FC<{ pal: Palette; size?: number }> = ({ pal, size = 82 }) => (
  <div style={{ width: size, height: size, borderRadius: size * .24, display: "grid", placeItems: "center", flex: `0 0 ${size}px`, background: `linear-gradient(145deg, ${pal.primary}, ${pal.accent})`, boxShadow: `0 ${size * .2}px ${size * .55}px ${pal.bg}99`, color: pal.text, font: `950 ${size * .38}px ${FONT}` }}>A</div>
);

const StoreBadge: React.FC<{ pal: Palette; kind: "apple" | "play"; label?: string; scale?: number }> = ({ pal, kind, label, scale = 1 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 * scale, minWidth: 190 * scale, padding: `${10 * scale}px ${15 * scale}px`, borderRadius: 12 * scale, background: pal.text, color: pal.bg, boxShadow: `0 12px 28px ${pal.bg}88`, fontFamily: FONT }}>
    <div style={{ fontSize: 28 * scale, lineHeight: 1 }}>{kind === "apple" ? "●" : "▶"}</div>
    <div><div style={{ fontSize: 10 * scale, opacity: .7 }}>{label ?? (kind === "apple" ? "Download on the" : "GET IT ON")}</div><div style={{ fontSize: 20 * scale, fontWeight: 850, lineHeight: 1.1 }}>{kind === "apple" ? "App Store" : "Google Play"}</div></div>
  </div>
);

const Rating: React.FC<{ pal: Palette; value: string; count: string; scale?: number }> = ({ pal, value, count, scale = 1 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12 * scale, color: pal.text, fontFamily: FONT }}><span style={{ color: pal.accent, fontSize: 24 * scale, letterSpacing: 3 * scale }}>★★★★★</span><strong style={{ fontSize: 24 * scale }}>{value}</strong><span style={{ color: `${pal.text}86`, fontSize: 17 * scale }}>({count})</span></div>
);

const Phone: React.FC<{ pal: Palette; imageUrl?: string; scale?: number; tilt?: number; tablet?: boolean; children?: React.ReactNode }> = ({ pal, imageUrl, scale = 1, tilt = 0, tablet = false, children }) => {
  const w = (tablet ? 390 : 282) * scale;
  const h = (tablet ? 550 : 570) * scale;
  return <div style={{ width: w, height: h, padding: 12 * scale, boxSizing: "border-box", borderRadius: (tablet ? 38 : 48) * scale, background: "linear-gradient(135deg,#b7bec8,#171a21 43%,#6c7380)", boxShadow: `0 45px 90px ${pal.bg}cc`, transform: `rotate(${tilt}deg)`, flex: `0 0 ${w}px` }}>
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: (tablet ? 28 : 39) * scale, border: `${2 * scale}px solid #050608`, background: imageUrl ? `url(${imageUrl}) center / cover no-repeat` : `linear-gradient(145deg, ${pal.bg}, ${pal.primary}36 55%, ${pal.secondary}24)`, fontFamily: FONT }}>
      {!tablet && <div style={{ position: "absolute", zIndex: 3, top: 9 * scale, left: "50%", transform: "translateX(-50%)", width: 84 * scale, height: 21 * scale, borderRadius: 20 * scale, background: "#050608" }} />}
      {!imageUrl && <><div style={{ position: "absolute", left: "10%", right: "10%", top: "14%", height: 10 * scale, borderRadius: 9, background: `${pal.text}8a` }} /><div style={{ position: "absolute", left: "10%", top: "21%", width: "54%", height: 5 * scale, borderRadius: 9, background: `${pal.text}42` }} /><div style={{ position: "absolute", left: "10%", right: "10%", top: "30%", bottom: "13%", display: "grid", gridTemplateColumns: "1.4fr .6fr", gap: 10 * scale }}><div style={{ borderRadius: 12 * scale, background: `linear-gradient(145deg, ${pal.primary}cf, ${pal.accent}77)` }} /><div style={{ display: "grid", gap: 8 * scale }}>{[0, 1, 2, 3].map(i => <div key={i} style={{ borderRadius: 7 * scale, background: `${pal.text}${i === 0 ? "2c" : "13"}`, border: `1px solid ${pal.text}20` }} />)}</div></div></>}
      {children}
    </div>
  </div>;
};

const Tap: React.FC<{ pal: Palette; x?: string; y?: string; scale?: number }> = ({ pal, x = "50%", y = "58%", scale = 1 }) => { const frame = useCurrentFrame(); const r = clampInterp(frame % 40, [0, 12, 28, 40], [8, 42, 26, 8]); return <div style={{ position: "absolute", left: x, top: y, width: r * scale, height: r * scale, borderRadius: "50%", border: `${3 * scale}px solid ${pal.accent}`, transform: "translate(-50%,-50%)", opacity: clampInterp(frame % 40, [0, 12, 28, 40], [0, .95, .2, 0]), boxShadow: `0 0 0 ${r * .35 * scale}px ${pal.accent}22` }} />; };

const Base: React.FC<{ p: AppInstallAdsProps; pal: Palette; children: React.ReactNode; grid?: boolean }> = ({ p, pal, children, grid = true }) => <AbsoluteFill style={{ color: pal.text, fontFamily: FONT, overflow: "hidden", padding: "clamp(44px, 7vw, 110px) clamp(38px, 8vw, 130px)", boxSizing: "border-box" }}>{grid && <div style={{ position: "absolute", inset: 0, opacity: .12, backgroundImage: `linear-gradient(${pal.text} 1px, transparent 1px), linear-gradient(90deg, ${pal.text} 1px, transparent 1px)`, backgroundSize: "48px 48px" }} />}{children}<div style={{ position: "absolute", left: "6%", right: "6%", bottom: "3.5%", display: "flex", justifyContent: "space-between", color: `${pal.text}62`, font: `700 14px ${MONO}`, letterSpacing: ".14em" }}><span>{p.appName.toUpperCase()}</span><span>AVAILABLE NOW</span></div></AbsoluteFill>;

const PainToApp: React.FC<{ p: AppInstallAdsProps; pal: Palette }> = ({ p, pal }) => { const frame = useCurrentFrame(); const enter = spring({ frame: frame - 15, fps: useVideoConfig().fps, config: { damping: 16, stiffness: 95 } }); return <Base p={p} pal={pal}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 50, height: "100%", position: "relative", zIndex: 1 }}><div style={{ width: "43%" }}><Label pal={pal}>THE OLD WAY</Label><div style={{ marginTop: 20, color: `${pal.text}b5`, fontSize: "clamp(28px,3.2vw,56px)", fontWeight: 850, lineHeight: 1.02 }}>{p.painPoint}</div><div style={{ width: 120, height: 7, marginTop: 26, background: pal.accent, borderRadius: 9 }} /><div style={{ marginTop: 50, transform: `translateY(${interpolate(enter,[0,1],[80,0])}px)`, opacity: enter }}><Copy p={p} pal={pal} eyebrow="THE BETTER WAY" /></div></div><div style={{ transform: `translateX(${interpolate(enter,[0,1],[500,0])}px) rotate(${interpolate(enter,[0,1],[12,0])}deg) scale(${interpolate(enter,[0,1],[.72,1])})`, opacity: enter }}><Phone pal={pal} imageUrl={p.screenUrls?.[0]} /></div></div></Base>; };

const ScreenSwipe: React.FC<{ p: AppInstallAdsProps; pal: Palette }> = ({ p, pal }) => { const frame = useCurrentFrame(); const phase = (frame / 45) % 3; return <Base p={p} pal={pal}><div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}><Copy p={p} pal={pal} center eyebrow="ONE APP. EVERY MOMENT." /><div style={{ display: "flex", alignItems: "center", marginTop: 60, transform: `translateX(${interpolate(phase % 1,[0,1],[80,-80])}px)` }}>{[0,1,2].map(i => <Phone key={i} pal={pal} imageUrl={p.screenUrls?.[i]} scale={i===1?1:0.82} tilt={(i-1)*8}><div style={{ position: "absolute", bottom: "13%", left: "10%", right: "10%", padding: "10px 5px", borderRadius: 8, color: pal.bg, background: pal.accent, textAlign: "center", fontWeight: 850, fontSize: 14 }}>{(p.features ?? fallbackFeatures)[i]}</div></Phone>)}</div><div style={{ display: "flex", gap: 9, marginTop: 28 }}>{[0,1,2].map(i=><span key={i} style={{ width: i===Math.floor(phase)?30:8, height:8, borderRadius:9, background:i===Math.floor(phase)?pal.accent:`${pal.text}38` }} />)}</div></div></Base>; };

const FeatureStack: React.FC<{ p: AppInstallAdsProps; pal: Palette }> = ({ p, pal }) => { const frame=useCurrentFrame(); const features=(p.features??fallbackFeatures).slice(0,4); return <Base p={p} pal={pal}><div style={{ position:"relative",zIndex:1,height:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",gap:60 }}><div style={{width:"42%"}}><Copy p={p} pal={pal} eyebrow="BUILT AROUND YOU" /></div><div style={{display:"flex",flexDirection:"column",gap:15,width:"48%"}}>{features.map((f,i)=>{const t=clampInterp(frame,[10+i*9,28+i*9],[0,1]);return <div key={f} style={{display:"flex",alignItems:"center",gap:18,padding:"17px 20px",borderRadius:17,background:`${pal.text}10`,border:`1px solid ${pal.text}25`,opacity:t,transform:`translateX(${interpolate(t,[0,1],[240,0])}px)`}}><span style={{width:38,height:38,borderRadius:12,display:"grid",placeItems:"center",background:[pal.primary,pal.secondary,pal.accent][i%3],color:pal.bg,fontWeight:950}}>{i+1}</span><span style={{fontSize:"clamp(18px,1.7vw,28px)",fontWeight:750}}>{f}</span></div>})}</div></div></Base>; };

const RatingProof: React.FC<{ p: AppInstallAdsProps; pal: Palette }> = ({ p, pal }) => { const frame=useCurrentFrame(); const pop=spring({frame:frame-12,fps:useVideoConfig().fps,config:{damping:12,stiffness:115}}); return <Base p={p} pal={pal}><div style={{position:"relative",zIndex:1,height:"100%",display:"flex",alignItems:"center",justifyContent:"space-around",gap:60}}><Phone pal={pal} imageUrl={p.screenUrls?.[0]} scale={.9} tilt={-5}/><div style={{maxWidth:670,transform:`translateY(${interpolate(pop,[0,1],[100,0])}px)`,opacity:pop}}><Label pal={pal}>LOVED BY PEOPLE</Label><div style={{fontSize:"clamp(48px,6vw,100px)",fontWeight:950,letterSpacing:"-.06em",lineHeight:.9,marginTop:22}}>{p.rating}<span style={{fontSize:".38em",color:pal.accent}}> / 5</span></div><Rating pal={pal} value={p.rating} count={p.reviewCount} scale={1.25}/><div style={{marginTop:30,padding:"24px 28px",borderRadius:20,background:`${pal.text}10`,border:`1px solid ${pal.text}24`,fontSize:"clamp(18px,1.8vw,28px)",lineHeight:1.35,color:`${pal.text}c7`}}>“{p.subline}”</div></div></div></Base>; };

const StoreBadges: React.FC<{ p: AppInstallAdsProps; pal: Palette }> = ({ p, pal }) => { const frame=useCurrentFrame(); const t=clampInterp(frame,[10,35],[0,1]); return <Base p={p} pal={pal}><div style={{position:"relative",zIndex:1,height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center"}}><AppIcon pal={pal} size={110}/><div style={{marginTop:25}}><Copy p={p} pal={pal} center eyebrow="DOWNLOAD FREE"/></div><div style={{display:"flex",gap:16,marginTop:42,opacity:t,transform:`translateY(${interpolate(t,[0,1],[40,0])}px)`}}><StoreBadge pal={pal} kind="apple" scale={1.12}/><StoreBadge pal={pal} kind="play" scale={1.12}/></div><div style={{marginTop:22,color:`${pal.text}75`,font: `16px ${MONO}` }}>NO CREDIT CARD REQUIRED</div></div></Base>; };

const NotificationValue: React.FC<{ p: AppInstallAdsProps; pal: Palette }> = ({ p, pal }) => { const frame=useCurrentFrame(); const notes=["Your plan is ready","A new moment to remember","You are right on track"]; return <Base p={p} pal={pal}><div style={{position:"relative",zIndex:1,height:"100%",display:"flex",alignItems:"center",justifyContent:"space-around",gap:40}}><div style={{width:"42%"}}><Copy p={p} pal={pal} eyebrow="THE RIGHT NUDGE"/><div style={{marginTop:30,color:pal.accent,fontSize:"clamp(18px,1.6vw,27px)",fontWeight:800}}>Quietly helpful. Never noisy.</div></div><Phone pal={pal} imageUrl={p.screenUrls?.[0]}><div style={{position:"absolute",top:"19%",left:"-8%",right:"-8%",display:"grid",gap:10}}>{notes.map((n,i)=>{const t=clampInterp(frame,[18+i*14,34+i*14],[0,1]);return <div key={n} style={{padding:"12px 15px",borderRadius:14,background:`${pal.text}ef`,color:pal.bg,fontSize:15,fontWeight:750,boxShadow:"0 9px 22px #0007",opacity:t,transform:`translateX(${interpolate(t,[0,1],[120,0])}px)`}}><span style={{color:pal.accent}}>●</span> {n}</div>})}</div></Phone></div></Base>; };

const OneTapDemo: React.FC<{ p: AppInstallAdsProps; pal: Palette }> = ({ p, pal }) => { const frame=useCurrentFrame(); const press=clampInterp(frame,[26,38,50],[0,1,0]); return <Base p={p} pal={pal}><div style={{position:"relative",zIndex:1,height:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:100}}><div style={{width:"42%"}}><Copy p={p} pal={pal} eyebrow="ONE TAP IS ALL IT TAKES"/><div style={{marginTop:35,padding:"18px 28px",borderRadius:999,display:"inline-block",background:pal.accent,color:pal.bg,fontWeight:900,fontSize:"clamp(19px,1.8vw,30px)",transform:`scale(${1+press*.06})`}}>{p.cta}</div></div><Phone pal={pal} imageUrl={p.screenUrls?.[0]}><Tap pal={pal}/><div style={{position:"absolute",left:"12%",right:"12%",bottom:"13%",padding:"15px 8px",borderRadius:13,background:pal.accent,color:pal.bg,textAlign:"center",fontSize:17,fontWeight:900}}>START NOW</div></Phone></div></Base>; };

const OfflineMode: React.FC<{ p: AppInstallAdsProps; pal: Palette }> = ({ p, pal }) => { const frame=useCurrentFrame(); const plane=clampInterp(frame,[14,40],[0,1]); return <Base p={p} pal={pal}><div style={{position:"relative",zIndex:1,height:"100%",display:"flex",alignItems:"center",justifyContent:"space-around",gap:60}}><div style={{width:"44%"}}><Label pal={pal}>NO SIGNAL. NO PROBLEM.</Label><div style={{marginTop:18,fontSize:"clamp(43px,5.8vw,94px)",fontWeight:950,letterSpacing:"-.06em",lineHeight:.92}}>Works wherever you go.</div><div style={{marginTop:27,color:`${pal.text}a8`,fontSize:"clamp(18px,1.7vw,28px)"}}>{p.subline}</div><div style={{marginTop:34,display:"inline-flex",padding:"12px 17px",borderRadius:999,background:`${pal.primary}35`,border:`1px solid ${pal.primary}88`,fontWeight:800}}>✈ OFFLINE MODE</div></div><div style={{transform:`translateY(${interpolate(plane,[0,1],[250,0])}px) rotate(${interpolate(plane,[0,1],[-12,0])}deg)`,opacity:plane}}><Phone pal={pal} imageUrl={p.screenUrls?.[0]}><div style={{position:"absolute",top:"10%",left:"9%",right:"9%",padding:"12px",borderRadius:12,background:`${pal.accent}e8`,color:pal.bg,fontSize:15,fontWeight:850,textAlign:"center"}}>NO CONNECTION NEEDED</div></Phone></div></div></Base>; };

const PrivacyProof: React.FC<{ p: AppInstallAdsProps; pal: Palette }> = ({ p, pal }) => { const frame=useCurrentFrame(); const items=[p.privacyLabel??"Your data stays yours","No tracking by default","Private by design"]; return <Base p={p} pal={pal}><div style={{position:"relative",zIndex:1,height:"100%",display:"flex",alignItems:"center",justifyContent:"space-around",gap:60}}><div style={{width:"43%"}}><Label pal={pal}>TRUST BUILT IN</Label><div style={{marginTop:20,fontSize:"clamp(43px,5.4vw,88px)",fontWeight:950,letterSpacing:"-.06em",lineHeight:.92}}>Privacy is a feature.</div><div style={{marginTop:28,display:"grid",gap:13}}>{items.map((x,i)=>{const t=clampInterp(frame,[10+i*12,27+i*12],[0,1]);return <div key={x} style={{display:"flex",alignItems:"center",gap:12,color:`${pal.text}c2`,fontSize:"clamp(17px,1.6vw,25px)",opacity:t,transform:`translateX(${interpolate(t,[0,1],[-40,0])}px)`}}><span style={{width:28,height:28,borderRadius:9,display:"grid",placeItems:"center",background:pal.accent,color:pal.bg,fontWeight:950}}>✓</span>{x}</div>})}</div></div><div style={{position:"relative"}}><div style={{position:"absolute",inset:"-15%",borderRadius:"50%",border:`1px solid ${pal.accent}55`,transform:`scale(${1+Math.sin(frame*.04)*.04})`}}/><div style={{fontSize:210,color:pal.accent,textAlign:"center",filter:`drop-shadow(0 20px 40px ${pal.accent}55)`}}>⌁</div><div style={{textAlign:"center",marginTop:12,color:pal.text,fontWeight:900,letterSpacing:".18em"}}>LOCKED DOWN</div></div></div></Base>; };

const InstallCta: React.FC<{ p: AppInstallAdsProps; pal: Palette }> = ({ p, pal }) => { const frame=useCurrentFrame(); const pop=spring({frame:frame-10,fps:useVideoConfig().fps,config:{damping:14,stiffness:110}}); return <Base p={p} pal={pal}><div style={{position:"relative",zIndex:1,height:"100%",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",textAlign:"center"}}>{Array.from({length:18},(_,i)=>{const a=seededRand(i)*Math.PI*2;const r=clampInterp(frame,[20,80],[0,480]);return <span key={i} style={{position:"absolute",left:"50%",top:"48%",width:9,height:9,borderRadius:"50%",background:[pal.primary,pal.secondary,pal.accent][i%3],transform:`translate(${Math.cos(a)*r}px,${Math.sin(a)*r}px)`,opacity:clampInterp(frame,[20,35,80],[0,1,0])}}/>})}<div style={{transform:`scale(${interpolate(pop,[0,1],[.72,1])})`,opacity:pop}}><AppIcon pal={pal} size={108}/><Copy p={p} pal={pal} center eyebrow="READY WHEN YOU ARE"/><div style={{marginTop:34,display:"inline-flex",padding:"19px 35px",borderRadius:999,background:pal.accent,color:pal.bg,fontSize:"clamp(20px,2vw,32px)",fontWeight:950,boxShadow:`0 16px 45px ${pal.accent}55`}}>{p.cta}</div><div style={{marginTop:18,color:`${pal.text}70`,font: `15px ${MONO}` }}>{p.appName.toLowerCase().replace(/\s+/g,"-")}.app</div></div></div></Base>; };

const VARIANTS: Record<AppInstallVariant, React.FC<{ p: AppInstallAdsProps; pal: Palette }>> = { "pain-to-app": PainToApp, "screen-swipe": ScreenSwipe, "feature-stack": FeatureStack, "rating-proof": RatingProof, "store-badges": StoreBadges, "notification-value": NotificationValue, "one-tap-demo": OneTapDemo, "offline-mode": OfflineMode, "privacy-proof": PrivacyProof, "install-cta": InstallCta };

export const AppInstallAdsTemplate: React.FC<AppInstallAdsProps> = (props) => { const pal = resolvePalette(props.paletteName); const Variant = VARIANTS[props.variant] ?? PainToApp; return <AbsoluteFill style={{ background: pal.bg, overflow: "hidden" }}><GradientMeshBackground palette={pal} blobs={5} speed={.45}/><FadeEdges inFrames={10} outFrames={14}><Variant p={props} pal={pal}/></FadeEdges></AbsoluteFill>; };

const familyCast = (c: React.FC<AppInstallAdsProps>) => c as unknown as React.ComponentType<Record<string, unknown>>;
export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "app-install-ads-pain-to-app": familyCast(AppInstallAdsTemplate),
  "app-install-ads-screen-swipe": familyCast(AppInstallAdsTemplate),
  "app-install-ads-feature-stack": familyCast(AppInstallAdsTemplate),
  "app-install-ads-rating-proof": familyCast(AppInstallAdsTemplate),
  "app-install-ads-store-badges": familyCast(AppInstallAdsTemplate),
  "app-install-ads-notification-value": familyCast(AppInstallAdsTemplate),
  "app-install-ads-one-tap-demo": familyCast(AppInstallAdsTemplate),
  "app-install-ads-offline-mode": familyCast(AppInstallAdsTemplate),
  "app-install-ads-privacy-proof": familyCast(AppInstallAdsTemplate),
  "app-install-ads-install-cta": familyCast(AppInstallAdsTemplate),
};
