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
  clampInterp,
  resolvePalette,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: onboarding-tutorials
 * Ten reusable product-teaching narratives. The defaults are procedural and
 * render without assets; pass screenshotUrl/content props for a real product.
 */
type OnboardingTutorialVariant =
  | "first-run"
  | "setup-wizard"
  | "three-actions"
  | "task-complete"
  | "guided-tour"
  | "shortcut-teach"
  | "role-based-start"
  | "empty-to-populated"
  | "recovery-step"
  | "completion-celebration";

export interface OnboardingTutorialsProps {
  variant: OnboardingTutorialVariant;
  productName: string;
  headline: string;
  subtitle: string;
  paletteName: string;
  steps?: string[];
  highlights?: string[];
  screenshotUrl?: string;
  accentLabel?: string;
  ctaLabel?: string;
  role?: string;
  shortcut?: string;
  errorText?: string;
  metric?: string;
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const DEFAULT_STEPS = ["Choose a workspace", "Create your first item", "Invite a teammate"];
const DEFAULT_HIGHLIGHTS = ["Navigation", "Primary action", "Activity panel", "Help menu"];

function listOf(values: string[] | undefined, fallback: string[], max = 6): string[] {
  const usable = values?.filter(Boolean);
  return (usable?.length ? usable : fallback).slice(0, max);
}

const Caption: React.FC<{ pal: Palette; p: OnboardingTutorialsProps; kicker?: string; width?: number | string }> = ({ pal, p, kicker = "PRODUCT TUTORIAL", width = 620 }) => {
  const frame = useCurrentFrame();
  const opacity = clampInterp(frame, [4, 22], [0, 1]);
  return (
    <div style={{ width, maxWidth: "100%", color: pal.text, fontFamily: FONT, opacity, transform: `translateY(${clampInterp(frame, [4, 22], [24, 0])}px)` }}>
      <div style={{ color: pal.accent, font: `850 clamp(10px, .83vw, 16px) ${MONO}`, letterSpacing: "0.2em" }}>{kicker}</div>
      <div style={{ marginTop: 12, font: `900 clamp(32px, 3.35vw, 64px)/.98 ${FONT}`, letterSpacing: "-0.06em", overflowWrap: "anywhere" }}>{p.headline}</div>
      <div style={{ marginTop: 17, color: `${pal.text}ad`, font: `clamp(15px, 1.25vw, 24px)/1.35 ${FONT}`, overflowWrap: "anywhere" }}>{p.subtitle}</div>
    </div>
  );
};

const ProductMark: React.FC<{ pal: Palette; name: string; size?: number }> = ({ pal, name, size = 36 }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.28, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: `linear-gradient(135deg, ${pal.primary}, ${pal.accent})`, color: pal.bg, font: `900 ${Math.round(size * 0.42)}px ${FONT}`, boxShadow: `0 10px 25px ${pal.primary}55` }}>{name.slice(0, 1).toUpperCase()}</div>
);

const AppSurface: React.FC<{ pal: Palette; p: OnboardingTutorialsProps; children?: React.ReactNode; imageUrl?: string; active?: number }> = ({ pal, p, children, imageUrl, active = 0 }) => {
  const nav = ["Home", "Projects", "Activity", "Settings"];
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: 22, background: imageUrl ? `linear-gradient(180deg, ${pal.bg}20, ${pal.bg}ee 78%), url(${imageUrl}) center/cover` : pal.bg, border: `1px solid ${pal.text}28`, boxShadow: `0 32px 75px ${pal.bg}cc`, fontFamily: FONT }}>
      <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "190px 1fr" }}>
        <div style={{ padding: "24px 15px", background: `${pal.text}09`, borderRight: `1px solid ${pal.text}19` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, color: pal.text, font: `850 15px ${FONT}` }}><ProductMark pal={pal} name={p.productName} size={29} />{p.productName}</div>
          <div style={{ marginTop: 45, display: "grid", gap: 8 }}>{nav.map((item, i) => <div key={item} style={{ padding: "11px 12px", borderRadius: 9, color: i === active ? pal.text : `${pal.text}67`, background: i === active ? `${pal.accent}23` : "transparent", font: `${i === active ? 800 : 600} 13px ${FONT}` }}>{item}</div>)}</div>
          <div style={{ position: "absolute", left: 15, right: 15, bottom: 22, padding: 11, borderRadius: 10, background: `${pal.text}0c`, color: `${pal.text}6e`, font: `700 11px ${FONT}` }}>Need a hand? <span style={{ color: pal.accent }}>Help ↗</span></div>
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", boxSizing: "border-box", borderBottom: `1px solid ${pal.text}1c`, color: `${pal.text}82`, font: `700 12px ${MONO}` }}><span>{p.productName.toUpperCase()} / WORKSPACE</span><span>⌕ &nbsp; ◉ &nbsp; ◇</span></div>
          <div style={{ position: "absolute", inset: "58px 0 0", padding: 28 }}>{children}</div>
        </div>
      </div>
    </div>
  );
};

const Button: React.FC<{ pal: Palette; children: React.ReactNode; ghost?: boolean; width?: string }> = ({ pal, children, ghost = false, width = "100%" }) => (
  <div style={{ width, minHeight: 43, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", padding: "0 14px", borderRadius: 11, background: ghost ? `${pal.text}0c` : pal.accent, border: `1px solid ${ghost ? `${pal.text}27` : pal.accent}`, color: ghost ? pal.text : pal.bg, font: `800 13px ${FONT}` }}>{children}</div>
);

const StepRail: React.FC<{ pal: Palette; labels: string[]; active: number }> = ({ pal, labels, active }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    {labels.map((label, i) => <React.Fragment key={label}><div style={{ display: "flex", alignItems: "center", gap: 7, color: i <= active ? pal.text : `${pal.text}53`, font: `700 12px ${FONT}` }}><span style={{ width: 23, height: 23, borderRadius: 99, display: "inline-flex", alignItems: "center", justifyContent: "center", background: i <= active ? pal.accent : `${pal.text}16`, color: i <= active ? pal.bg : `${pal.text}63`, font: `900 11px ${MONO}` }}>{i < active ? "✓" : i + 1}</span>{label}</div>{i < labels.length - 1 && <span style={{ width: 25, height: 2, background: i < active ? pal.accent : `${pal.text}1e` }} />}</React.Fragment>)}
  </div>
);

const Cursor: React.FC<{ pal: Palette; x: number; y: number; label?: string; pulse?: number }> = ({ pal, x, y, label, pulse = 0 }) => (
  <div style={{ position: "absolute", left: `${x}%`, top: `${y}%`, zIndex: 5, transform: `rotate(-18deg) scale(${1 + pulse * 0.08})`, filter: `drop-shadow(0 5px 5px ${pal.bg}aa)` }}>
    <svg width="29" height="39" viewBox="0 0 29 39"><path d="M3 2l2 32 8-7 7 10 5-3-7-11 10-1z" fill={pal.text} stroke={pal.bg} strokeWidth="2" /></svg>
    {label && <span style={{ position: "absolute", left: 23, top: 27, whiteSpace: "nowrap", padding: "6px 9px", borderRadius: 6, background: pal.accent, color: pal.bg, font: `800 12px ${FONT}` }}>{label}</span>}
  </div>
);

const Hotspot: React.FC<{ pal: Palette; x: number; y: number; label?: string; active?: boolean }> = ({ pal, x, y, label, active = true }) => {
  const frame = useCurrentFrame();
  const pulse = active ? (Math.sin(frame * 0.17) + 1) * 0.5 : 0;
  return <div style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)", zIndex: 6 }}><div style={{ width: 30, height: 30, borderRadius: 99, border: `2px solid ${pal.accent}`, boxShadow: `0 0 0 ${8 + pulse * 8}px ${pal.accent}22`, display: "flex", alignItems: "center", justifyContent: "center", color: pal.bg, background: pal.accent, font: `900 13px ${MONO}` }}>+</div>{label && <div style={{ position: "absolute", left: 22, top: -11, width: 150, padding: "8px 10px", borderRadius: 8, background: `${pal.bg}ee`, border: `1px solid ${pal.accent}67`, color: pal.text, font: `750 12px ${FONT}` }}>{label}</div>}</div>;
};

const FirstRun: React.FC<{ p: OnboardingTutorialsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const t = clampInterp(frame, [8, 28], [0, 1]);
  return <AbsoluteFill style={{ display: "flex", alignItems: "center", gap: 65, padding: "85px 120px", boxSizing: "border-box" }}><div style={{ width: 560 }}><Caption pal={pal} p={p} kicker={p.accentLabel ?? "01 / FIRST RUN"} /><div style={{ marginTop: 32, display: "flex", gap: 12 }}><Button pal={pal} width="175px">{p.ctaLabel ?? "Start tutorial"} ↗</Button><Button pal={pal} ghost width="135px">Skip</Button></div></div><div style={{ width: 1030, height: 610, transform: `translateY(${interpolate(t, [0, 1], [90, 0])}px) scale(${interpolate(t, [0, 1], [.9, 1])})` }}><AppSurface pal={pal} p={p} imageUrl={p.screenshotUrl}><div style={{ position: "relative", height: "100%", padding: 24, boxSizing: "border-box" }}><div style={{ color: pal.text, font: `850 28px ${FONT}` }}>Welcome to your workspace</div><div style={{ marginTop: 10, color: `${pal.text}78`, font: `15px ${FONT}` }}>Let's take one minute to show you around.</div><div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "1.4fr .6fr", gap: 16, height: 300 }}><div style={{ borderRadius: 16, background: `linear-gradient(145deg, ${pal.primary}88, ${pal.accent}33)` }} /><div style={{ display: "grid", gap: 12 }}><div style={{ borderRadius: 12, background: `${pal.text}18` }} /><div style={{ borderRadius: 12, background: `${pal.text}0e` }} /></div></div><Hotspot pal={pal} x={22} y={53} label="Your first project starts here" /><Cursor pal={pal} x={25 + t * 8} y={64} label="Click to begin" pulse={t} /></div></AppSurface></div></AbsoluteFill>;
};

const SetupWizard: React.FC<{ p: OnboardingTutorialsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const steps = listOf(p.steps, DEFAULT_STEPS, 4);
  const active = Math.min(steps.length - 1, Math.floor(clampInterp(frame, [14, 120], [0, steps.length - 0.01])));
  return <AbsoluteFill style={{ padding: "82px 115px", boxSizing: "border-box" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}><Caption pal={pal} p={p} kicker={p.accentLabel ?? "02 / SETUP WIZARD"} /><StepRail pal={pal} labels={steps} active={active} /></div><div style={{ position: "absolute", left: 115, right: 115, bottom: 95, height: 500, display: "flex", gap: 22 }}><div style={{ width: 270, padding: 22, borderRadius: 18, background: `${pal.text}09`, border: `1px solid ${pal.text}22` }}>{steps.map((step, i) => <div key={step} style={{ display: "flex", alignItems: "center", gap: 11, padding: "15px 10px", borderRadius: 10, background: i === active ? `${pal.accent}20` : "transparent", color: i === active ? pal.text : `${pal.text}59`, font: `700 14px ${FONT}` }}><span style={{ width: 24, height: 24, borderRadius: 7, display: "inline-flex", alignItems: "center", justifyContent: "center", background: i <= active ? pal.accent : `${pal.text}18`, color: i <= active ? pal.bg : `${pal.text}5b`, font: `900 11px ${MONO}` }}>{i < active ? "✓" : i + 1}</span>{step}</div>)}</div><div style={{ flex: 1, padding: 30, borderRadius: 18, background: `${pal.bg}d9`, border: `1px solid ${pal.text}24` }}><div style={{ color: pal.accent, font: `800 12px ${MONO}` }}>STEP {String(active + 1).padStart(2, "0")} / {steps.length}</div><div style={{ marginTop: 13, color: pal.text, font: `850 30px ${FONT}` }}>{steps[active]}</div><div style={{ marginTop: 12, width: 520, color: `${pal.text}79`, font: `16px/1.45 ${FONT}` }}>Complete this small action, then the next part of {p.productName} will be ready for you.</div><div style={{ marginTop: 30, display: "grid", gap: 12, width: 620 }}><div style={{ height: 48, borderRadius: 10, background: `${pal.text}10`, border: `1px solid ${pal.text}24` }} /><div style={{ height: 48, borderRadius: 10, background: `${pal.text}08`, border: `1px solid ${pal.text}1c` }} /></div><div style={{ marginTop: 28, display: "flex", gap: 11 }}><Button pal={pal} width="160px">{active === steps.length - 1 ? p.ctaLabel ?? "Finish setup" : "Save and continue"}</Button><Button pal={pal} ghost width="110px">Back</Button></div></div></div></AbsoluteFill>;
};

const ThreeActions: React.FC<{ p: OnboardingTutorialsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const actions = listOf(p.steps, ["Create", "Customize", "Share"], 3);
  const active = Math.min(2, Math.floor(clampInterp(frame, [10, 112], [0, 3])));
  return <AbsoluteFill style={{ padding: "8% 6.5%", boxSizing: "border-box" }}><div style={{ position: "relative", zIndex: 2, width: "44%", maxWidth: "100%", minHeight: "25%" }}><Caption pal={pal} p={p} kicker={p.accentLabel ?? "03 / THREE ACTIONS"} width="100%" /></div><div style={{ position: "absolute", top: "48%", left: "6.5%", right: "6.5%", height: "43%", display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "1.1vw", minHeight: 0 }}>{actions.map((action, i) => { const t = clampInterp(frame, [15 + i * 11, 33 + i * 11], [0, 1]); return <div key={action} style={{ minHeight: 0, height: "100%", overflow: "hidden", padding: "clamp(14px, 1.3vw, 25px)", borderRadius: "clamp(12px, 1vw, 20px)", boxSizing: "border-box", background: i <= active ? `${pal.accent}17` : `${pal.text}08`, border: `1px solid ${i === active ? `${pal.accent}88` : `${pal.text}22`}`, opacity: t, transform: `translateY(${interpolate(t, [0, 1], [35, 0])}px)` }}><div style={{ display: "flex", justifyContent: "space-between", color: i <= active ? pal.accent : `${pal.text}57`, font: `800 clamp(9px, .68vw, 13px) ${MONO}` }}><span>0{i + 1}</span><span>{i < active ? "DONE" : i === active ? "NOW" : "NEXT"}</span></div><div style={{ marginTop: "clamp(14px, 2vw, 38px)", width: "clamp(52px, 4.4vw, 85px)", height: "clamp(52px, 4.4vw, 85px)", borderRadius: "clamp(14px, 1.25vw, 24px)", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${[pal.primary, pal.secondary, pal.accent][i]}77, ${pal.bg})`, color: pal.text, font: `900 clamp(24px, 1.93vw, 37px) ${FONT}` }}>{["+", "✦", "↗"][i]}</div><div style={{ marginTop: "clamp(10px, 1.3vw, 25px)", color: pal.text, font: `850 clamp(17px, 1.35vw, 26px) ${FONT}`, overflowWrap: "anywhere" }}>{action}</div><div style={{ marginTop: "clamp(7px, .58vw, 11px)", color: `${pal.text}79`, font: `clamp(11px, .78vw, 15px)/1.4 ${FONT}` }}>A focused action with one clear result and no unnecessary choices.</div></div>; })}</div></AbsoluteFill>;
};

const TaskComplete: React.FC<{ p: OnboardingTutorialsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const items = listOf(p.steps, ["Open your workspace", "Create a project", "Share the result", "Return for the next win"], 5);
  const complete = Math.min(items.length, Math.floor(clampInterp(frame, [15, 115], [0, items.length + 0.9])));
  return <AbsoluteFill style={{ display: "flex", alignItems: "center", gap: 100, padding: "100px 145px", boxSizing: "border-box" }}><div style={{ width: 560 }}><Caption pal={pal} p={p} kicker={p.accentLabel ?? "04 / TASK COMPLETE"} /><div style={{ marginTop: 32, color: pal.accent, font: `850 18px ${MONO}` }}>{complete === items.length ? "TUTORIAL COMPLETE" : "IN PROGRESS"}</div></div><div style={{ width: 610, padding: 28, borderRadius: 22, background: `${pal.text}0a`, border: `1px solid ${pal.text}24` }}><div style={{ display: "flex", justifyContent: "space-between", color: pal.text, font: `800 18px ${FONT}` }}><span>Getting started</span><span style={{ color: pal.accent, font: `800 13px ${MONO}` }}>{complete}/{items.length}</span></div><div style={{ marginTop: 20, display: "grid", gap: 11 }}>{items.map((item, i) => { const done = i < complete; const t = clampInterp(frame, [12 + i * 8, 27 + i * 8], [0, 1]); return <div key={item} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", borderRadius: 11, background: done ? `${pal.accent}1b` : `${pal.text}08`, border: `1px solid ${done ? `${pal.accent}52` : `${pal.text}1c`}`, color: done ? pal.text : `${pal.text}7b`, opacity: t, transform: `translateX(${interpolate(t, [0, 1], [18, 0])}px)`, font: `700 14px ${FONT}` }}><span style={{ width: 23, height: 23, borderRadius: 7, display: "inline-flex", alignItems: "center", justifyContent: "center", background: done ? pal.accent : `${pal.text}18`, color: done ? pal.bg : `${pal.text}58`, font: `900 12px ${MONO}` }}>{done ? "✓" : i + 1}</span>{item}<span style={{ marginLeft: "auto", color: done ? pal.accent : `${pal.text}48`, font: `800 10px ${MONO}` }}>{done ? "DONE" : "NEXT"}</span></div>; })}</div><div style={{ marginTop: 18 }}><Button pal={pal}>{complete === items.length ? p.ctaLabel ?? "Open workspace" : "Continue"}</Button></div></div></AbsoluteFill>;
};

const GuidedTour: React.FC<{ p: OnboardingTutorialsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const points = listOf(p.highlights, DEFAULT_HIGHLIGHTS, 4);
  const active = Math.min(points.length - 1, Math.floor(clampInterp(frame, [14, 124], [0, points.length - 0.01])));
  const positions = [[21, 29], [66, 45], [76, 72], [19, 81]];
  return <AbsoluteFill style={{ padding: "78px 105px", boxSizing: "border-box" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}><Caption pal={pal} p={p} kicker={p.accentLabel ?? "05 / GUIDED TOUR"} width={530} /><div style={{ paddingTop: 13 }}><StepRail pal={pal} labels={points} active={active} /></div></div><div style={{ position: "absolute", left: 105, right: 105, bottom: 85, height: 560 }}><AppSurface pal={pal} p={p} active={1}><div style={{ position: "relative", height: "100%", padding: 14, boxSizing: "border-box" }}><div style={{ color: pal.text, font: `850 28px ${FONT}` }}>Your workspace at a glance</div><div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 15, height: 330 }}><div style={{ borderRadius: 15, background: `linear-gradient(135deg, ${pal.primary}80, ${pal.secondary}32)` }} /><div style={{ display: "grid", gap: 15 }}><div style={{ borderRadius: 14, background: `${pal.text}18` }} /><div style={{ borderRadius: 14, background: `${pal.text}0d` }} /></div></div><Hotspot pal={pal} x={positions[active][0]} y={positions[active][1]} label={points[active]} /></div></AppSurface></div></AbsoluteFill>;
};

const ShortcutTeach: React.FC<{ p: OnboardingTutorialsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const keys = (p.shortcut ?? "⌘ K").split(" ");
  const pressed = Math.min(keys.length, Math.floor(clampInterp(frame, [20, 80], [0, keys.length + 0.8])));
  return <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "100px 155px", boxSizing: "border-box" }}><div style={{ width: 570 }}><Caption pal={pal} p={p} kicker={p.accentLabel ?? "06 / SHORTCUT TEACH"} /><div style={{ marginTop: 34, color: `${pal.text}78`, font: `15px ${MONO}` }}>Teach a repeatable action without interrupting the flow.</div></div><div style={{ width: 560, textAlign: "center" }}><div style={{ color: pal.accent, font: `800 14px ${MONO}` }}>TRY THIS SHORTCUT</div><div style={{ marginTop: 23, display: "flex", alignItems: "center", justifyContent: "center", gap: 15 }}>{keys.map((key, i) => <React.Fragment key={`${key}-${i}`}><div style={{ minWidth: 90, height: 82, padding: "0 18px", boxSizing: "border-box", borderRadius: 15, display: "flex", alignItems: "center", justifyContent: "center", background: i < pressed ? pal.accent : `${pal.text}12`, border: `1px solid ${i < pressed ? pal.accent : `${pal.text}32`}`, color: i < pressed ? pal.bg : pal.text, boxShadow: i < pressed ? `0 10px 0 ${pal.accent}66` : `0 5px 0 ${pal.text}18`, transform: `translateY(${i < pressed ? 5 : 0}px)`, font: `900 26px ${FONT}` }}>{key}</div>{i < keys.length - 1 && <span style={{ color: `${pal.text}52`, font: `800 24px ${MONO}` }}>+</span>}</React.Fragment>)}</div><div style={{ marginTop: 30, padding: "16px 22px", borderRadius: 12, background: `${pal.accent}16`, border: `1px solid ${pal.accent}4c`, color: pal.text, font: `700 16px ${FONT}` }}>Open quick actions instantly</div></div></AbsoluteFill>;
};

const RoleBasedStart: React.FC<{ p: OnboardingTutorialsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const roles = [p.role ?? "Product builder", "Team lead", "Creator"];
  const active = Math.min(2, Math.floor(clampInterp(frame, [14, 95], [0, 3])));
  return <AbsoluteFill style={{ padding: "8% 6.8%", boxSizing: "border-box" }}><div style={{ position: "relative", zIndex: 2, width: "44%", maxWidth: "100%", minHeight: "25%" }}><Caption pal={pal} p={p} kicker={p.accentLabel ?? "07 / ROLE-BASED START"} width="100%" /></div><div style={{ position: "absolute", top: "48%", left: "6.8%", right: "6.8%", height: "43%", display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "1vw", minHeight: 0 }}>{roles.map((role, i) => { const t = clampInterp(frame, [18 + i * 10, 35 + i * 10], [0, 1]); return <div key={role} style={{ minHeight: 0, height: "100%", overflow: "hidden", padding: "clamp(14px, 1.25vw, 24px)", borderRadius: "clamp(12px, .94vw, 18px)", background: i === active ? `${pal.accent}18` : `${pal.text}08`, border: `1px solid ${i === active ? `${pal.accent}78` : `${pal.text}22`}`, opacity: t, transform: `translateY(${interpolate(t, [0, 1], [32, 0])}px)` }}><ProductMark pal={pal} name={role} size={50} /><div style={{ marginTop: "clamp(11px, 1.15vw, 22px)", color: pal.text, font: `850 clamp(16px, 1.2vw, 23px) ${FONT}`, overflowWrap: "anywhere" }}>{role}</div><div style={{ marginTop: "clamp(7px, .52vw, 10px)", color: `${pal.text}76`, font: `clamp(11px, .78vw, 15px)/1.4 ${FONT}` }}>See the tools and examples that matter most for your first session.</div><div style={{ marginTop: "clamp(12px, 1.05vw, 20px)", color: i === active ? pal.accent : `${pal.text}4d`, font: `800 clamp(9px, .63vw, 12px) ${MONO}` }}>{i === active ? "SELECTED / CONTINUE" : "VIEW PATH"}</div></div>; })}</div></AbsoluteFill>;
};

const EmptyToPopulated: React.FC<{ p: OnboardingTutorialsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const progress = clampInterp(frame, [15, 85], [0, 1]);
  return <AbsoluteFill style={{ padding: "80px 105px", boxSizing: "border-box" }}><Caption pal={pal} p={p} kicker={p.accentLabel ?? "08 / EMPTY TO POPULATED"} width={620} /><div style={{ position: "absolute", left: 105, right: 105, bottom: 100, display: "flex", alignItems: "center", gap: 22 }}><div style={{ flex: 1, height: 390, padding: 26, boxSizing: "border-box", borderRadius: 20, background: `${pal.text}07`, border: `1px solid ${pal.text}22`, opacity: 1 - progress * .35 }}><div style={{ color: `${pal.text}55`, font: `800 12px ${MONO}` }}>BEFORE / EMPTY STATE</div><div style={{ height: 230, marginTop: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, border: `1px dashed ${pal.text}38`, color: `${pal.text}58`, font: `700 17px ${FONT}` }}>No items yet</div></div><div style={{ width: 90, height: 90, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", background: pal.accent, color: pal.bg, font: `900 29px ${FONT}`, transform: `rotate(${progress * 180}deg) scale(${interpolate(progress, [0, 1], [.72, 1])})` }}>→</div><div style={{ flex: 1, height: 390, padding: 26, boxSizing: "border-box", borderRadius: 20, background: `${pal.accent}12`, border: `1px solid ${pal.accent}62`, transform: `translateY(${interpolate(progress, [0, 1], [28, 0])}px)` }}><div style={{ color: pal.accent, font: `800 12px ${MONO}` }}>AFTER / READY TO USE</div><div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 11, height: 220 }}><div style={{ borderRadius: 12, background: `linear-gradient(135deg, ${pal.primary}99, ${pal.secondary}44)` }} /><div style={{ display: "grid", gap: 11 }}><div style={{ borderRadius: 9, background: `${pal.text}1b` }} /><div style={{ borderRadius: 9, background: `${pal.text}10` }} /><div style={{ borderRadius: 9, background: `${pal.text}0c` }} /></div></div></div></div></AbsoluteFill>;
};

const RecoveryStep: React.FC<{ p: OnboardingTutorialsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const progress = clampInterp(frame, [18, 80], [0, 1]);
  return <AbsoluteFill style={{ display: "flex", alignItems: "center", gap: 80, padding: "100px 145px", boxSizing: "border-box" }}><div style={{ width: 580 }}><Caption pal={pal} p={p} kicker={p.accentLabel ?? "09 / RECOVERY STEP"} /><div style={{ marginTop: 33, color: `${pal.text}75`, font: `700 14px ${MONO}` }}>SHOW THE BLOCKER → EXPLAIN THE FIX → CONTINUE</div></div><div style={{ width: 640, height: 400, position: "relative" }}><div style={{ position: "absolute", inset: 0, padding: 26, boxSizing: "border-box", borderRadius: 20, background: `${pal.text}09`, border: `1px solid ${pal.text}22`, opacity: 1 - progress }}><div style={{ color: "#ff6b7a", font: `800 12px ${MONO}` }}>ACTION BLOCKED</div><div style={{ marginTop: 20, color: pal.text, font: `850 24px ${FONT}` }}>{p.errorText ?? "We need one more detail"}</div><div style={{ marginTop: 14, height: 46, borderRadius: 10, background: `${pal.text}12`, border: `1px solid #ff6b7a66` }} /><div style={{ marginTop: 22 }}><Button pal={pal} ghost>Try again</Button></div></div><div style={{ position: "absolute", inset: 0, padding: 26, boxSizing: "border-box", borderRadius: 20, background: `${pal.accent}14`, border: `1px solid ${pal.accent}66`, opacity: progress, transform: `translateY(${interpolate(progress, [0, 1], [25, 0])}px)` }}><div style={{ color: pal.accent, font: `800 12px ${MONO}` }}>RECOVERY / NEXT STEP</div><div style={{ marginTop: 20, color: pal.text, font: `850 24px ${FONT}` }}>Here's how to keep going</div><div style={{ marginTop: 14, color: `${pal.text}7f`, font: `15px/1.4 ${FONT}` }}>Add the missing detail, then your progress will be saved automatically.</div><div style={{ marginTop: 25 }}><Button pal={pal}>{p.ctaLabel ?? "Continue"} ↗</Button></div></div></div></AbsoluteFill>;
};

const CompletionCelebration: React.FC<{ p: OnboardingTutorialsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: Math.max(0, frame - 20), fps, config: { damping: 12, stiffness: 120 } });
  const pieces = Array.from({ length: 18 }, (_, i) => ({ x: (i * 47 + 11) % 100, y: (i * 31 + 7) % 100, color: [pal.primary, pal.secondary, pal.accent][i % 3], delay: i * 2 }));
  return <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 90, boxSizing: "border-box" }}><div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>{pieces.map((piece, i) => { const fall = clampInterp(frame, [18 + piece.delay, 75 + piece.delay], [-100, 118]); return <div key={i} style={{ position: "absolute", left: `${piece.x}%`, top: `${fall}%`, width: 10 + (i % 3) * 5, height: 20 + (i % 4) * 5, background: piece.color, borderRadius: i % 2 ? 99 : 3, transform: `rotate(${frame * (i % 2 ? 5 : -4) + i * 20}deg)` }} />; })}</div><div style={{ position: "relative", width: 760, textAlign: "center", color: pal.text, transform: `scale(${interpolate(pop, [0, 1], [.75, 1])})` }}><div style={{ margin: "0 auto", width: 130, height: 130, borderRadius: 42, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${pal.primary}, ${pal.accent})`, color: pal.bg, boxShadow: `0 25px 55px ${pal.accent}55`, font: `900 67px ${FONT}` }}>✓</div><div style={{ marginTop: 28, font: `900 60px/.95 ${FONT}`, letterSpacing: "-0.06em" }}>{p.headline}</div><div style={{ margin: "17px auto 0", maxWidth: 560, color: `${pal.text}ad`, font: `22px/1.4 ${FONT}` }}>{p.subtitle}</div><div style={{ margin: "29px auto 0", display: "flex", justifyContent: "center", gap: 12 }}><Button pal={pal} width="190px">{p.ctaLabel ?? "Open workspace"} ↗</Button><div style={{ width: 145, minHeight: 43, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 11, color: pal.accent, background: `${pal.accent}18`, border: `1px solid ${pal.accent}4e`, font: `850 14px ${MONO}` }}>{p.metric ?? "100% ready"}</div></div></div></AbsoluteFill>;
};

const VARIANTS: Record<OnboardingTutorialVariant, React.FC<{ p: OnboardingTutorialsProps; pal: Palette }>> = {
  "first-run": FirstRun,
  "setup-wizard": SetupWizard,
  "three-actions": ThreeActions,
  "task-complete": TaskComplete,
  "guided-tour": GuidedTour,
  "shortcut-teach": ShortcutTeach,
  "role-based-start": RoleBasedStart,
  "empty-to-populated": EmptyToPopulated,
  "recovery-step": RecoveryStep,
  "completion-celebration": CompletionCelebration,
};

export const OnboardingTutorialsTemplate: React.FC<OnboardingTutorialsProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? FirstRun;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <AbsoluteFill style={{ backgroundColor: pal.bg, fontFamily: FONT, overflow: "hidden" }}><GradientMeshBackground palette={pal} speed={0.3} blobs={5} /><FadeEdges inFrames={10} outFrames={14}><div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><Variant p={props} pal={pal} /></div></FadeEdges></AbsoluteFill>;
};

const familyCast = (c: React.FC<OnboardingTutorialsProps>) => c as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "onboarding-tutorials-first-run": familyCast(OnboardingTutorialsTemplate),
  "onboarding-tutorials-setup-wizard": familyCast(OnboardingTutorialsTemplate),
  "onboarding-tutorials-three-actions": familyCast(OnboardingTutorialsTemplate),
  "onboarding-tutorials-task-complete": familyCast(OnboardingTutorialsTemplate),
  "onboarding-tutorials-guided-tour": familyCast(OnboardingTutorialsTemplate),
  "onboarding-tutorials-shortcut-teach": familyCast(OnboardingTutorialsTemplate),
  "onboarding-tutorials-role-based-start": familyCast(OnboardingTutorialsTemplate),
  "onboarding-tutorials-empty-to-populated": familyCast(OnboardingTutorialsTemplate),
  "onboarding-tutorials-recovery-step": familyCast(OnboardingTutorialsTemplate),
  "onboarding-tutorials-completion-celebration": familyCast(OnboardingTutorialsTemplate),
};
