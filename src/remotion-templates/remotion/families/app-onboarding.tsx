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
  stagger,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: app-onboarding
 * Ten reusable onboarding narratives for product launches, app walkthroughs,
 * activation stories, and upgrade moments. Screens are procedural by default,
 * while image URLs and copy can be supplied when real product assets exist.
 */
type AppOnboardingVariant =
  | "welcome-flow"
  | "permission-steps"
  | "profile-setup"
  | "feature-tour"
  | "checklist-complete"
  | "empty-state-to-value"
  | "signup-to-dashboard"
  | "paywall-preview"
  | "activation-milestones"
  | "handoff-to-home";

export interface AppOnboardingProps {
  variant: AppOnboardingVariant;
  appName: string;
  headline: string;
  subline: string;
  paletteName: string;
  stepLabels?: string[];
  steps?: string[];
  progress?: number;
  userName?: string;
  benefits?: string[];
  features?: string[];
  permissions?: string[];
  metrics?: string[];
  avatarUrl?: string;
  imageUrl?: string;
  accentLabel?: string;
  ctaLabel?: string;
  planName?: string;
  price?: string;
  durationPerStep?: number;
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const DEFAULT_STEPS = ["Welcome", "Personalize", "Explore", "Ready"];
const DEFAULT_FEATURES = ["A calmer workspace", "Smart activity signals", "One-tap collaboration"];
const DEFAULT_PERMISSIONS = ["Notifications", "Calendar access", "Workspace profile"];
const DEFAULT_BENEFITS = ["Unlimited projects", "Faster workflows", "Priority support"];
const DEFAULT_METRICS = ["First project", "Invite a teammate", "Complete a workflow", "Make it yours"];

function listOf(values: string[] | undefined, fallback: string[], max = 6): string[] {
  return (values?.filter(Boolean).length ? values.filter(Boolean) : fallback).slice(0, max);
}

const ProgressDots: React.FC<{ pal: Palette; active: number; count: number; labels?: string[]; compact?: boolean }> = ({ pal, active, count, labels, compact = false }) => (
  <div style={{ display: "flex", alignItems: "center", gap: compact ? 7 : 10 }}>
    {Array.from({ length: count }, (_, i) => (
      <React.Fragment key={i}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: compact ? 8 : 11, height: compact ? 8 : 11, borderRadius: 99, background: i <= active ? pal.accent : `${pal.text}25`, boxShadow: i === active ? `0 0 0 5px ${pal.accent}25` : "none", transition: "none" }} />
          {labels?.[i] && <span style={{ color: i === active ? pal.text : `${pal.text}60`, font: `${i === active ? 800 : 600} ${compact ? 12 : 14}px ${FONT}`, whiteSpace: "nowrap" }}>{labels[i]}</span>}
        </div>
        {i < count - 1 && <div style={{ width: compact ? 18 : 34, height: 2, background: i < active ? pal.accent : `${pal.text}20` }} />}
      </React.Fragment>
    ))}
  </div>
);

const Caption: React.FC<{ pal: Palette; p: AppOnboardingProps; kicker?: string; align?: "left" | "center"; headlineSize?: number; maxWidth?: number; sublineSize?: number }> = ({ pal, p, kicker = "APP ONBOARDING", align = "left", headlineSize = 68, maxWidth = 720, sublineSize = 24 }) => {
  const frame = useCurrentFrame();
  const opacity = clampInterp(frame, [4, 22], [0, 1]);
  return <div style={{ textAlign: align, color: pal.text, fontFamily: FONT, opacity, transform: `translateY(${clampInterp(frame, [4, 22], [22, 0])}px)` }}>
    <div style={{ color: pal.accent, fontSize: 16, fontWeight: 850, letterSpacing: "0.22em", textTransform: "uppercase" }}>{kicker}</div>
    <div style={{ marginTop: 13, fontSize: headlineSize, lineHeight: 0.98, fontWeight: 900, letterSpacing: "-0.06em", maxWidth }}>{p.headline}</div>
    <div style={{ marginTop: 18, color: `${pal.text}ad`, fontSize: sublineSize, lineHeight: 1.35, maxWidth: Math.min(maxWidth, 650) }}>{p.subline}</div>
  </div>;
};

const AppMark: React.FC<{ pal: Palette; name: string; imageUrl?: string; size?: number }> = ({ pal, name, imageUrl, size = 58 }) => (
  <div style={{ width: size, height: size, flexShrink: 0, borderRadius: size * 0.26, background: imageUrl ? `url(${imageUrl}) center/cover` : `linear-gradient(135deg, ${pal.primary}, ${pal.accent})`, display: "flex", alignItems: "center", justifyContent: "center", color: pal.bg, font: `900 ${Math.round(size * .42)}px ${FONT}`, boxShadow: `0 12px 28px ${pal.primary}55` }}>{imageUrl ? null : name.slice(0, 1).toUpperCase()}</div>
);

const PhoneFrame: React.FC<{ pal: Palette; children: React.ReactNode; imageUrl?: string; width?: number; height?: number; tilt?: number }> = ({ pal, children, imageUrl, width = 370, height = 700, tilt = 0 }) => (
  <div style={{ width, height, padding: 11, boxSizing: "border-box", borderRadius: 54, background: "linear-gradient(135deg,#aeb5c0,#15181e 45%,#707783)", boxShadow: `0 42px 90px ${pal.bg}dd, 0 0 0 1px ${pal.text}30`, transform: `rotate(${tilt}deg)`, flexShrink: 0 }}>
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: 43, background: imageUrl ? `url(${imageUrl}) center/cover` : pal.bg, border: "2px solid #050608", fontFamily: FONT }}>
      <div style={{ position: "absolute", zIndex: 5, top: 10, left: "50%", transform: "translateX(-50%)", width: 94, height: 23, borderRadius: 20, background: "#050608" }} />
      <div style={{ position: "absolute", zIndex: 4, left: 21, right: 21, top: 18, display: "flex", justifyContent: "space-between", color: `${pal.text}b8`, font: `700 11px ${MONO}` }}><span>9:41</span><span>◔ ◉ ▰</span></div>
      {children}
    </div>
  </div>
);

const ScreenSurface: React.FC<{ pal: Palette; p: AppOnboardingProps; children?: React.ReactNode; title?: string; imageUrl?: string }> = ({ pal, p, children, title, imageUrl }) => (
  <div style={{ position: "absolute", inset: 0, padding: "64px 22px 24px", boxSizing: "border-box", background: imageUrl ? `linear-gradient(180deg, ${pal.bg}15, ${pal.bg}cc 72%), url(${imageUrl}) center/cover` : `linear-gradient(160deg, ${pal.bg}, ${pal.primary}22 58%, ${pal.bgAlt ?? pal.bg})`, color: pal.text }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}><AppMark pal={pal} name={p.appName} imageUrl={p.avatarUrl} size={31} /><div style={{ font: `800 14px ${FONT}` }}>{p.appName}</div><div style={{ marginLeft: "auto", color: `${pal.text}69`, font: `700 18px ${FONT}` }}>•••</div></div>
    {title && <div style={{ marginTop: 40, font: `850 28px/1.05 ${FONT}`, letterSpacing: "-0.04em" }}>{title}</div>}
    {children}
  </div>
);

const Button: React.FC<{ pal: Palette; children: React.ReactNode; ghost?: boolean; width?: string }> = ({ pal, children, ghost = false, width = "100%" }) => (
  <div style={{ width, minHeight: 45, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", padding: "0 14px", borderRadius: 14, background: ghost ? `${pal.text}0d` : pal.accent, border: `1px solid ${ghost ? `${pal.text}25` : pal.accent}`, color: ghost ? pal.text : pal.bg, font: `800 14px ${FONT}` }}>{children}</div>
);

const Card: React.FC<{ pal: Palette; children: React.ReactNode; accent?: boolean; style?: React.CSSProperties }> = ({ pal, children, accent = false, style }) => (
  <div style={{ padding: 16, borderRadius: 16, background: accent ? `${pal.accent}18` : `${pal.text}0c`, border: `1px solid ${accent ? `${pal.accent}72` : `${pal.text}22`}`, ...style }}>{children}</div>
);

const WelcomeFlow: React.FC<{ p: AppOnboardingProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 17, stiffness: 90 } });
  return <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "95px 150px", boxSizing: "border-box" }}>
    <div style={{ width: 690 }}><Caption pal={pal} p={p} kicker={p.accentLabel ?? "01 / WELCOME FLOW"} /><div style={{ marginTop: 38 }}><ProgressDots pal={pal} active={0} count={4} labels={listOf(p.stepLabels, DEFAULT_STEPS, 4)} /></div><div style={{ marginTop: 40, display: "flex", gap: 12 }}><Button pal={pal} width="210px">{p.ctaLabel ?? "Get started"} ↗</Button><Button pal={pal} ghost width="150px">Preview</Button></div></div>
    <div style={{ position: "relative", transform: `translateY(${interpolate(enter, [0, 1], [150, 0])}px) scale(${interpolate(enter, [0, 1], [.82, 1])})` }}><PhoneFrame pal={pal} imageUrl={p.imageUrl}><ScreenSurface pal={pal} p={p} title={`Welcome to ${p.appName}`}><div style={{ marginTop: 20, textAlign: "center" }}><div style={{ width: 122, height: 122, margin: "0 auto", borderRadius: 40, background: `linear-gradient(145deg, ${pal.primary}, ${pal.accent})`, display: "flex", alignItems: "center", justifyContent: "center", color: pal.bg, font: `900 58px ${FONT}`, boxShadow: `0 20px 45px ${pal.primary}66` }}>{p.appName.slice(0, 1)}</div><div style={{ marginTop: 22, color: `${pal.text}a0`, font: `16px/1.4 ${FONT}` }}>A few quick steps, then your workspace is ready.</div><div style={{ marginTop: 34 }}><Button pal={pal}>{p.ctaLabel ?? "Let's go"}</Button></div><div style={{ marginTop: 17, color: `${pal.text}60`, font: `12px ${FONT}` }}>Takes less than a minute</div></div></ScreenSurface></PhoneFrame><div style={{ position: "absolute", right: -100, top: 95, padding: "10px 13px", borderRadius: 10, background: `${pal.bg}e8`, border: `1px solid ${pal.accent}65`, color: pal.text, font: `700 13px ${MONO}` }}>01 / READY WHEN YOU ARE</div></div>
  </AbsoluteFill>;
};

const PermissionSteps: React.FC<{ p: AppOnboardingProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const permissions = listOf(p.permissions, DEFAULT_PERMISSIONS, 4);
  const active = Math.min(permissions.length - 1, Math.floor(Math.max(0, frame - 20) / 28));
  return <AbsoluteFill style={{ padding: "78px 120px", boxSizing: "border-box" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}><div style={{ width: 650 }}><Caption pal={pal} p={p} kicker={p.accentLabel ?? "02 / PERMISSION STEPS"} headlineSize={56} maxWidth={650} sublineSize={20} /></div><div style={{ marginTop: 10, color: `${pal.text}72`, font: `700 15px ${MONO}` }}>SETUP / {String(Math.min(active + 1, permissions.length)).padStart(2, "0")} OF {String(permissions.length).padStart(2, "0")}</div></div><div style={{ position: "absolute", left: 120, right: 120, top: 508, height: 520, display: "flex", gap: 28, alignItems: "center" }}><div style={{ flex: 1, display: "grid", gap: 12 }}>{permissions.map((permission, i) => { const t = clampInterp(frame, [16 + i * 10, 33 + i * 10], [0, 1]); return <Card key={permission} pal={pal} accent={i === active} style={{ opacity: t, transform: `translateX(${interpolate(t, [0, 1], [-40, 0])}px)`, display: "flex", alignItems: "center", gap: 15 }}><div style={{ width: 35, height: 35, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", background: i <= active ? pal.accent : `${pal.text}18`, color: i <= active ? pal.bg : `${pal.text}68`, font: `900 16px ${FONT}` }}>{i <= active ? "✓" : String(i + 1)}</div><div style={{ flex: 1, color: pal.text, font: `800 19px ${FONT}` }}>{permission}</div><div style={{ color: i <= active ? pal.accent : `${pal.text}58`, font: `800 13px ${MONO}` }}>{i <= active ? "ALLOWED" : "NEXT"}</div></Card>; })}</div><PhoneFrame pal={pal} imageUrl={p.imageUrl} tilt={2} width={285} height={520}><ScreenSurface pal={pal} p={p} title="Make it yours"><div style={{ marginTop: 20, color: `${pal.text}91`, font: `14px/1.4 ${FONT}` }}>Choose what {p.appName} can use to make your experience smarter.</div><div style={{ marginTop: 21, display: "grid", gap: 8 }}>{permissions.slice(0, 3).map((permission, i) => <div key={permission} style={{ padding: "10px 10px", display: "flex", justifyContent: "space-between", borderRadius: 12, background: i === active ? `${pal.accent}25` : `${pal.text}0b`, border: `1px solid ${i === active ? `${pal.accent}65` : `${pal.text}18`}`, color: pal.text, font: `700 11px ${FONT}` }}><span>{permission}</span><span style={{ color: i <= active ? pal.accent : `${pal.text}55` }}>{i <= active ? "ON" : "OFF"}</span></div>)}</div><div style={{ position: "absolute", left: 22, right: 22, bottom: 25 }}><Button pal={pal}>{active >= permissions.length - 1 ? "Continue" : "Allow access"}</Button></div></ScreenSurface></PhoneFrame></div></AbsoluteFill>;
};

const ProfileSetup: React.FC<{ p: AppOnboardingProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const progress = clampInterp(frame, [10, 100], [0, 1]);
  const name = p.userName ?? "Alex Morgan";
  return <AbsoluteFill style={{ display: "flex", alignItems: "center", gap: 100, padding: "100px 150px", boxSizing: "border-box" }}><div style={{ width: 690 }}><Caption pal={pal} p={p} kicker={p.accentLabel ?? "03 / PROFILE SETUP"} /><div style={{ marginTop: 36, color: `${pal.text}82`, font: `15px ${MONO}` }}>PROFILE COMPLETION&nbsp; {Math.round(progress * 100)}%</div><div style={{ marginTop: 11, height: 6, borderRadius: 8, background: `${pal.text}18` }}><div style={{ width: `${progress * 100}%`, height: 6, borderRadius: 8, background: `linear-gradient(90deg, ${pal.primary}, ${pal.accent})` }} /></div><div style={{ marginTop: 34, display: "flex", gap: 10 }}>{listOf(p.steps, ["Name", "Role", "Photo"], 3).map((s, i) => <div key={s} style={{ padding: "10px 14px", borderRadius: 9, background: i / 2 <= progress ? `${pal.accent}20` : `${pal.text}0d`, border: `1px solid ${i / 2 <= progress ? `${pal.accent}66` : `${pal.text}20`}`, color: i / 2 <= progress ? pal.text : `${pal.text}58`, font: `700 14px ${FONT}` }}>{s}</div>)}</div></div><div style={{ width: 580, padding: 32, borderRadius: 28, background: `${pal.bg}dd`, border: `1px solid ${pal.text}25`, boxShadow: `0 36px 80px ${pal.bg}aa` }}><div style={{ display: "flex", alignItems: "center", gap: 17 }}><div style={{ width: 88, height: 88, borderRadius: 28, background: p.avatarUrl ? `url(${p.avatarUrl}) center/cover` : `linear-gradient(135deg, ${pal.secondary}, ${pal.accent})`, display: "flex", alignItems: "center", justifyContent: "center", color: pal.bg, font: `900 34px ${FONT}` }}>{p.avatarUrl ? null : name.slice(0, 1)}</div><div><div style={{ color: `${pal.text}60`, font: `700 13px ${MONO}` }}>YOUR PROFILE</div><div style={{ marginTop: 6, color: pal.text, font: `850 25px ${FONT}` }}>{name}</div></div></div><div style={{ marginTop: 30, display: "grid", gap: 12 }}>{["Display name", "Role / team", "What are you here to do?"].map((label, i) => <div key={label}><div style={{ color: `${pal.text}75`, font: `700 12px ${FONT}` }}>{label}</div><div style={{ marginTop: 6, height: 44, display: "flex", alignItems: "center", padding: "0 13px", borderRadius: 10, background: `${pal.text}0c`, border: `1px solid ${pal.text}20`, color: i === 0 ? pal.text : `${pal.text}42`, font: `600 15px ${FONT}` }}>{i === 0 ? name : i === 1 ? "Product design" : "Build better workflows"}</div></div>)}</div><div style={{ marginTop: 26 }}><Button pal={pal}>{p.ctaLabel ?? "Save profile"}</Button></div></div></AbsoluteFill>;
};

const FeatureTour: React.FC<{ p: AppOnboardingProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const features = listOf(p.features, DEFAULT_FEATURES, 4);
  const step = Math.min(features.length - 1, Math.floor(clampInterp(frame, [18, durationInFrames - 18], [0, features.length - 0.01])));
  const local = (clampInterp(frame, [18, durationInFrames - 18], [0, features.length - 0.01]) % 1);
  return <AbsoluteFill style={{ padding: "76px 120px", boxSizing: "border-box" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}><div style={{ width: 650 }}><Caption pal={pal} p={p} kicker={p.accentLabel ?? "04 / FEATURE TOUR"} headlineSize={56} maxWidth={650} sublineSize={20} /></div><ProgressDots pal={pal} active={step} count={features.length} compact /></div><div style={{ position: "absolute", left: 120, right: 120, top: 622, height: 400, overflow: "hidden", borderRadius: 28, border: `1px solid ${pal.text}25`, background: `${pal.text}09` }}><div style={{ display: "flex", height: "100%", transform: `translateX(-${step * 100 + local * 100}%)`, transition: "none" }}>{features.map((feature, i) => <div key={feature} style={{ minWidth: "100%", display: "flex", alignItems: "center", gap: 58, padding: "34px 58px", boxSizing: "border-box" }}><div style={{ flex: 1, minWidth: 0 }}><div style={{ color: pal.accent, font: `800 15px ${MONO}` }}>FEATURE / {String(i + 1).padStart(2, "0")}</div><div style={{ marginTop: 12, color: pal.text, font: `850 40px/1.04 ${FONT}`, letterSpacing: "-0.05em", maxWidth: 500, overflowWrap: "break-word" }}>{feature}</div><div style={{ marginTop: 14, color: `${pal.text}8c`, font: `18px/1.35 ${FONT}`, maxWidth: 460 }}>Introduce one product idea at a time, then give the viewer a clear reason to try it.</div><div style={{ marginTop: 20 }}><Button pal={pal} width="170px">{i === features.length - 1 ? "Finish tour" : "Next feature"} ↗</Button></div></div><div style={{ width: 310, height: 280, flexShrink: 0, borderRadius: 24, background: p.imageUrl ? `url(${p.imageUrl}) center/cover` : `linear-gradient(145deg, ${[pal.primary, pal.secondary, pal.accent][i % 3]}99, ${pal.bg})`, border: `1px solid ${pal.text}28`, transform: `translateY(${Math.sin(frame * .04 + i) * 8}px) rotate(${(i - step) * 2}deg)` }}><div style={{ padding: 20, color: pal.text, font: `800 13px ${MONO}` }}>{p.appName.toUpperCase()}</div><div style={{ margin: 42, width: 140, height: 62, borderRadius: 16, background: `${pal.text}28` }} /></div></div>)}</div></div></AbsoluteFill>;
};

const ChecklistComplete: React.FC<{ p: AppOnboardingProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const items = listOf(p.steps, ["Create your workspace", "Invite a teammate", "Add your first project", "Ship a result"], 5);
  const complete = Math.min(items.length, Math.floor(clampInterp(frame, [18, 112], [0, items.length + .9])));
  const progress = complete / items.length;
  return <AbsoluteFill style={{ display: "flex", alignItems: "center", gap: 110, padding: "100px 150px", boxSizing: "border-box" }}><div style={{ width: 620 }}><Caption pal={pal} p={p} kicker={p.accentLabel ?? "05 / CHECKLIST COMPLETE"} /><div style={{ marginTop: 34, display: "flex", alignItems: "center", gap: 20 }}><div style={{ position: "relative", width: 110, height: 110, borderRadius: "50%", background: `conic-gradient(${pal.accent} ${progress * 360}deg, ${pal.text}14 0deg)`, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 84, height: 84, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: pal.bg, color: pal.text, font: `900 20px ${MONO}` }}>{Math.round(progress * 100)}%</div></div><div style={{ color: `${pal.text}86`, font: `15px/1.45 ${FONT}` }}>Every completed step moves the workspace closer to its first valuable moment.</div></div></div><div style={{ width: 620, padding: 25, borderRadius: 26, background: `${pal.bg}d9`, border: `1px solid ${pal.text}25`, boxShadow: `0 30px 75px ${pal.bg}aa` }}><div style={{ display: "flex", justifyContent: "space-between", color: pal.text, font: `800 18px ${FONT}` }}><span>Setup checklist</span><span style={{ color: pal.accent, font: `800 13px ${MONO}` }}>{complete} / {items.length}</span></div><div style={{ marginTop: 20, display: "grid", gap: 11 }}>{items.map((item, i) => { const done = i < complete; const t = clampInterp(frame, [12 + i * 8, 25 + i * 8], [0, 1]); return <div key={item} style={{ display: "flex", alignItems: "center", gap: 13, padding: "14px 15px", borderRadius: 12, background: done ? `${pal.accent}18` : `${pal.text}09`, border: `1px solid ${done ? `${pal.accent}45` : `${pal.text}1a`}`, opacity: t, transform: `translateX(${interpolate(t, [0, 1], [20, 0])}px)` }}><div style={{ width: 24, height: 24, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: done ? pal.accent : `${pal.text}1c`, color: done ? pal.bg : `${pal.text}54`, font: `900 14px ${FONT}` }}>{done ? "✓" : i + 1}</div><span style={{ color: done ? pal.text : `${pal.text}90`, font: `700 15px ${FONT}` }}>{item}</span><span style={{ marginLeft: "auto", color: done ? pal.accent : `${pal.text}50`, font: `800 11px ${MONO}` }}>{done ? "DONE" : "UP NEXT"}</span></div>; })}</div><div style={{ marginTop: 18 }}><Button pal={pal}>{complete >= items.length ? p.ctaLabel ?? "Open workspace" : "Continue setup"}</Button></div></div></AbsoluteFill>;
};

const EmptyStateToValue: React.FC<{ p: AppOnboardingProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const progress = clampInterp(frame, [14, 105], [0, 1]);
  return <AbsoluteFill style={{ padding: "90px 120px", boxSizing: "border-box" }}><div style={{ width: 640 }}><Caption pal={pal} p={p} kicker={p.accentLabel ?? "06 / EMPTY STATE TO VALUE"} /></div><div style={{ position: "absolute", left: 120, right: 120, bottom: 110, display: "flex", alignItems: "center", gap: 28 }}><div style={{ flex: 1, height: 420, padding: 34, boxSizing: "border-box", borderRadius: 24, border: `1px solid ${pal.text}20`, background: `${pal.text}07`, opacity: 1 - progress * .3 }}><div style={{ color: `${pal.text}62`, font: `800 14px ${MONO}` }}>BEFORE / EMPTY WORKSPACE</div><div style={{ height: 250, marginTop: 30, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 18, border: `1px dashed ${pal.text}35`, color: `${pal.text}58`, font: `700 17px ${FONT}` }}>Nothing here yet</div><div style={{ marginTop: 20, color: `${pal.text}52`, font: `14px ${FONT}` }}>A clear starting point is still part of the experience.</div></div><div style={{ width: 100, height: 100, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: pal.accent, color: pal.bg, font: `900 30px ${FONT}`, transform: `rotate(${progress * 180}deg) scale(${interpolate(progress, [0, 1], [.75, 1])})`, boxShadow: `0 16px 36px ${pal.accent}55` }}>→</div><div style={{ flex: 1, height: 420, padding: 34, boxSizing: "border-box", borderRadius: 24, border: `1px solid ${pal.accent}66`, background: `${pal.accent}12`, opacity: .7 + progress * .3, transform: `translateY(${interpolate(progress, [0, 1], [28, 0])}px)` }}><div style={{ color: pal.accent, font: `800 14px ${MONO}` }}>AFTER / FIRST VALUE</div><div style={{ marginTop: 25, display: "grid", gridTemplateColumns: "1.3fr .7fr", gap: 14 }}><div style={{ height: 190, borderRadius: 15, background: `linear-gradient(145deg, ${pal.primary}aa, ${pal.secondary}55)` }} /><div style={{ display: "grid", gap: 10 }}>{[1, 2, 3].map(i => <div key={i} style={{ borderRadius: 9, background: `${pal.text}1b` }} />)}</div></div><div style={{ marginTop: 18, color: pal.text, font: `800 18px ${FONT}` }}>A workspace with momentum</div></div></div></AbsoluteFill>;
};

const SignupToDashboard: React.FC<{ p: AppOnboardingProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const phase = clampInterp(frame, [10, durationInFrames - 10], [0, 2.99]);
  const active = Math.floor(phase);
  const labels = ["Create account", "Verify details", "Open dashboard"];
  return <AbsoluteFill style={{ padding: "74px 110px", boxSizing: "border-box" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}><div style={{ width: 570 }}><Caption pal={pal} p={p} kicker={p.accentLabel ?? "07 / SIGNUP TO DASHBOARD"} headlineSize={54} maxWidth={570} sublineSize={19} /></div><ProgressDots pal={pal} active={active} count={3} labels={labels} compact /></div><div style={{ position: "absolute", left: 110, right: 110, top: 747, height: 285, display: "flex", alignItems: "center", justifyContent: "space-between" }}>{labels.map((label, i) => { const t = clampInterp(frame, [12 + i * 12, 30 + i * 12], [0, 1]); return <React.Fragment key={label}><div style={{ width: 420, height: 285, padding: 24, boxSizing: "border-box", borderRadius: 22, border: `1px solid ${i === active ? `${pal.accent}7a` : `${pal.text}22`}`, background: i === active ? `${pal.accent}16` : `${pal.text}08`, opacity: t, transform: `translateY(${interpolate(t, [0, 1], [40, 0])}px) scale(${i === active ? 1 : .94})` }}><div style={{ color: i === active ? pal.accent : `${pal.text}58`, font: `800 14px ${MONO}` }}>STATE / 0{i + 1}</div><div style={{ marginTop: 15, color: pal.text, font: `850 25px ${FONT}` }}>{label}</div>{i === 0 && <><div style={{ marginTop: 20, height: 40, borderRadius: 9, background: `${pal.text}14` }} /><div style={{ marginTop: 9, height: 40, borderRadius: 9, background: `${pal.text}0e` }} /></>}{i === 1 && <><div style={{ marginTop: 20, display: "flex", gap: 10 }}><div style={{ width: 52, height: 52, borderRadius: 15, background: `${pal.secondary}66` }} /><div style={{ flex: 1, height: 52, borderRadius: 10, background: `${pal.text}11` }} /></div><div style={{ marginTop: 13, height: 40, borderRadius: 9, background: `${pal.accent}52` }} /></>}{i === 2 && <><div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1.3fr .7fr", gap: 9, height: 112 }}><div style={{ borderRadius: 12, background: `linear-gradient(135deg, ${pal.primary}aa, ${pal.accent}55)` }} /><div style={{ display: "grid", gap: 9 }}><div style={{ borderRadius: 8, background: `${pal.text}18` }} /><div style={{ borderRadius: 8, background: `${pal.text}0e` }} /></div></div></>}</div>{i < labels.length - 1 && <div style={{ width: 50, height: 2, background: i < active ? pal.accent : `${pal.text}24`, position: "relative" }}><div style={{ position: "absolute", right: -1, top: -5, width: 10, height: 10, borderTop: `2px solid ${i < active ? pal.accent : `${pal.text}24`}`, borderRight: `2px solid ${i < active ? pal.accent : `${pal.text}24`}`, transform: "rotate(45deg)" }} /></div>}</React.Fragment>; })}</div></AbsoluteFill>;
};

const PaywallPreview: React.FC<{ p: AppOnboardingProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const benefits = listOf(p.benefits, DEFAULT_BENEFITS, 4);
  const lift = clampInterp(frame, [12, 52], [100, 0]);
  return <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "90px 150px", boxSizing: "border-box" }}><div style={{ width: 650 }}><Caption pal={pal} p={p} kicker={p.accentLabel ?? "08 / PAYWALL PREVIEW"} /><div style={{ marginTop: 35, display: "flex", gap: 12 }}><div style={{ color: pal.accent, font: `800 14px ${MONO}` }}>PLAN PREVIEW</div><div style={{ color: `${pal.text}56`, font: `800 14px ${MONO}` }}>NO COMMITMENT</div></div></div><div style={{ width: 460, padding: 28, boxSizing: "border-box", borderRadius: 26, background: `linear-gradient(145deg, ${pal.primary}45, ${pal.bg}e8 52%)`, border: `1px solid ${pal.accent}65`, boxShadow: `0 35px 80px ${pal.bg}cc`, transform: `translateY(${lift}px)` }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}><div><div style={{ color: pal.accent, font: `800 13px ${MONO}` }}>RECOMMENDED</div><div style={{ marginTop: 9, color: pal.text, font: `850 30px ${FONT}` }}>{p.planName ?? "Pro workspace"}</div></div><div style={{ color: pal.text, font: `900 29px ${FONT}` }}>{p.price ?? "$12"}<span style={{ color: `${pal.text}65`, font: `600 13px ${FONT}` }}>/mo</span></div></div><div style={{ marginTop: 24, display: "grid", gap: 11 }}>{benefits.map((benefit, i) => <div key={benefit} style={{ display: "flex", alignItems: "center", gap: 10, color: `${pal.text}c9`, font: `650 15px ${FONT}`, opacity: clampInterp(frame, [20 + i * 7, 34 + i * 7], [0, 1]) }}><span style={{ width: 22, height: 22, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 7, background: `${pal.accent}25`, color: pal.accent, font: `900 13px ${FONT}` }}>✓</span>{benefit}</div>)}</div><div style={{ marginTop: 25 }}><Button pal={pal}>{p.ctaLabel ?? "Start free trial"} ↗</Button></div><div style={{ marginTop: 13, textAlign: "center", color: `${pal.text}52`, font: `12px ${FONT}` }}>Change or cancel anytime</div></div></AbsoluteFill>;
};

const ActivationMilestones: React.FC<{ p: AppOnboardingProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const metrics = listOf(p.metrics, DEFAULT_METRICS, 5);
  const progress = clampInterp(frame, [10, 120], [0, metrics.length - .01]);
  const active = Math.floor(progress);
  return <AbsoluteFill style={{ padding: "95px 130px", boxSizing: "border-box" }}><div style={{ width: 680 }}><Caption pal={pal} p={p} kicker={p.accentLabel ?? "09 / ACTIVATION MILESTONES"} /></div><div style={{ position: "absolute", left: 130, right: 130, bottom: 145, height: 5, background: `${pal.text}1d` }}><div style={{ width: `${(progress / Math.max(1, metrics.length - 1)) * 100}%`, height: 5, background: `linear-gradient(90deg, ${pal.primary}, ${pal.accent})` }} /></div><div style={{ position: "absolute", left: 130, right: 130, bottom: 115, display: "flex", justifyContent: "space-between" }}>{metrics.map((metric, i) => { const done = i <= active; const t = clampInterp(frame, [12 + i * 8, 27 + i * 8], [0, 1]); return <div key={metric} style={{ width: 180, textAlign: i === 0 ? "left" : i === metrics.length - 1 ? "right" : "center", color: done ? pal.text : `${pal.text}52`, font: `700 14px ${FONT}`, opacity: t, transform: `translateY(${interpolate(t, [0, 1], [18, 0])}px)` }}><div style={{ width: 26, height: 26, margin: `0 ${i === 0 ? 0 : i === metrics.length - 1 ? "auto 0 auto auto" : "auto"}`, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", background: done ? pal.accent : `${pal.text}19`, color: done ? pal.bg : `${pal.text}5b`, font: `900 13px ${FONT}` }}>{done ? "✓" : i + 1}</div><div style={{ marginTop: 12, whiteSpace: "normal" }}>{metric}</div></div>; })}</div><div style={{ position: "absolute", right: 130, top: 105, padding: "11px 14px", borderRadius: 10, background: `${pal.text}0d`, border: `1px solid ${pal.text}20`, color: pal.accent, font: `800 14px ${MONO}` }}>MILESTONE {String(active + 1).padStart(2, "0")}</div></AbsoluteFill>;
};

const HandoffToHome: React.FC<{ p: AppOnboardingProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const handoff = clampInterp(frame, [35, durationInFrames - 28], [0, 1]);
  const x = handoff * 470;
  return (
    <AbsoluteFill style={{ boxSizing: "border-box" }}>
      <div style={{ position: "absolute", left: 130, top: 62, width: 650 }}>
        <Caption pal={pal} p={p} kicker={p.accentLabel ?? "10 / HANDOFF TO HOME"} headlineSize={56} maxWidth={650} sublineSize={20} />
      </div>
      <div style={{ position: "absolute", left: "50%", top: 365, transform: "translateX(-50%)", width: 1200, height: 620, overflow: "hidden", borderRadius: 34, border: `1px solid ${pal.text}25`, background: `${pal.bg}f2`, boxShadow: `0 35px 80px ${pal.bg}cc` }}>
        <div style={{ position: "absolute", top: 24, left: 30, right: 30, display: "flex", justifyContent: "space-between", color: `${pal.text}a6`, font: `700 13px ${MONO}` }}>
          <span>{p.appName.toUpperCase()}</span><span>ONBOARDING → HOME</span>
        </div>
        <div style={{ position: "absolute", left: 80 - x, top: 92, width: 300, height: 480 }}>
          <PhoneFrame pal={pal} imageUrl={p.imageUrl} width={250} height={465}>
            <ScreenSurface pal={pal} p={p} title="You're all set">
              <div style={{ marginTop: 15, color: `${pal.text}b8`, font: `13px/1.4 ${FONT}` }}>Your workspace is ready for its first great idea.</div>
              <div style={{ position: "absolute", left: 22, right: 22, bottom: 26 }}><Button pal={pal}>{p.ctaLabel ?? "Open my workspace"}</Button></div>
            </ScreenSurface>
          </PhoneFrame>
        </div>
        <div style={{ position: "absolute", left: 600 - x, top: 95, width: 550, height: 405, padding: 26, boxSizing: "border-box", borderRadius: 25, background: `linear-gradient(145deg, ${pal.primary}68, ${pal.bg}f5)`, border: `1px solid ${pal.accent}70` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}><AppMark pal={pal} name={p.appName} imageUrl={p.avatarUrl} size={42} /><div style={{ color: pal.text, font: `850 20px ${FONT}`, minWidth: 0, overflowWrap: "break-word" }}>Good to see you, {p.userName ?? "Alex"}</div></div>
          <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1.4fr .6fr", gap: 13, height: 175 }}><div style={{ borderRadius: 16, background: `linear-gradient(140deg, ${pal.secondary}88, ${pal.primary}44)` }} /><div style={{ display: "grid", gap: 13 }}><div style={{ borderRadius: 11, background: `${pal.text}30` }} /><div style={{ borderRadius: 11, background: `${pal.text}18` }} /></div></div>
          <div style={{ marginTop: 20, color: pal.accent, font: `800 14px ${MONO}` }}>HOME / FIRST VALUE</div>
        </div>
        <div style={{ position: "absolute", left: 30, right: 30, bottom: 22, height: 4, background: `${pal.text}25` }}><div style={{ width: `${handoff * 100}%`, height: 4, background: pal.accent }} /></div>
      </div>
    </AbsoluteFill>
  );
};

const VARIANTS: Record<AppOnboardingVariant, React.FC<{ p: AppOnboardingProps; pal: Palette }>> = {
  "welcome-flow": WelcomeFlow,
  "permission-steps": PermissionSteps,
  "profile-setup": ProfileSetup,
  "feature-tour": FeatureTour,
  "checklist-complete": ChecklistComplete,
  "empty-state-to-value": EmptyStateToValue,
  "signup-to-dashboard": SignupToDashboard,
  "paywall-preview": PaywallPreview,
  "activation-milestones": ActivationMilestones,
  "handoff-to-home": HandoffToHome,
};

// Variants compose on a 1920×1080 design canvas with absolute pixel offsets.
// Scale the composed canvas as one unit so cards/copy keep their intended
// relationship at any viewport (thumbnails render at 800×450).
const StageFit: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <AbsoluteFill style={{ overflow: "hidden" }}>
    <div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}>{children}</div>
  </AbsoluteFill>;
};

export const AppOnboardingTemplate: React.FC<AppOnboardingProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? WelcomeFlow;
  return <AbsoluteFill style={{ backgroundColor: pal.bg, fontFamily: FONT, overflow: "hidden" }}>
    <GradientMeshBackground palette={pal} speed={0.35} blobs={props.variant === "empty-state-to-value" ? 3 : 5} />
    <FadeEdges inFrames={10} outFrames={14}><StageFit><Variant p={props} pal={pal} /></StageFit></FadeEdges>
  </AbsoluteFill>;
};

const familyCast = (c: React.FC<AppOnboardingProps>) => c as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "app-onboarding-welcome-flow": familyCast(AppOnboardingTemplate),
  "app-onboarding-permission-steps": familyCast(AppOnboardingTemplate),
  "app-onboarding-profile-setup": familyCast(AppOnboardingTemplate),
  "app-onboarding-feature-tour": familyCast(AppOnboardingTemplate),
  "app-onboarding-checklist-complete": familyCast(AppOnboardingTemplate),
  "app-onboarding-empty-state-to-value": familyCast(AppOnboardingTemplate),
  "app-onboarding-signup-to-dashboard": familyCast(AppOnboardingTemplate),
  "app-onboarding-paywall-preview": familyCast(AppOnboardingTemplate),
  "app-onboarding-activation-milestones": familyCast(AppOnboardingTemplate),
  "app-onboarding-handoff-to-home": familyCast(AppOnboardingTemplate),
};
