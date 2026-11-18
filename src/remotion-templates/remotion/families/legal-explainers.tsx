import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { ComponentType } from "react";
import { clampInterp, resolvePalette, type Palette } from "../lib/primitives";

/**
 * FAMILY: legal-explainers
 * Neutral, procedural explainers for contracts, rights, policies, and process.
 * These compositions intentionally use informational labels and a visible
 * disclaimer; they do not assert jurisdiction-specific legal conclusions.
 */
export type LegalExplainersVariant =
  | "contract-anatomy"
  | "case-timeline"
  | "rights-flow"
  | "terms-highlight"
  | "policy-change"
  | "dispute-process"
  | "privacy-consent"
  | "compliance-check"
  | "clause-compare"
  | "legal-glossary";

export interface LegalExplainersProps {
  variant: LegalExplainersVariant;
  title: string;
  subtitle: string;
  paletteName: string;
  jurisdiction?: string;
  disclaimer?: string;
  sections?: string[];
  clauses?: string[];
  dates?: string[];
  steps?: string[];
  rights?: string[];
  terms?: string[];
  glossary?: Array<{ term: string; definition: string }>;
  leftClause?: string;
  rightClause?: string;
  logo?: string;
  accentLabel?: string;
}

type VariantProps = { p: LegalExplainersProps; pal: Palette };
const SANS = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const DEFAULT_DISCLAIMER = "FOR INFORMATION ONLY • NOT LEGAL ADVICE";
const DEFAULT_SECTIONS = ["Parties & scope", "Responsibilities", "Term & renewal", "Exit conditions"];
const DEFAULT_CLAUSES = ["Scope of work", "Data handling", "Payment terms", "Termination"];
const DEFAULT_DATES = ["01 JAN", "15 MAR", "30 JUN", "15 SEP"];
const DEFAULT_STEPS = ["Read the document", "Identify the decision", "Check local guidance", "Choose the next step"];
const DEFAULT_RIGHTS = ["Access information", "Ask for clarification", "Keep a record", "Seek independent advice"];
const DEFAULT_TERMS = ["Controller", "Consent", "Notice", "Retention"];
const DEFAULT_GLOSSARY = [
  { term: "Notice", definition: "A clear communication about a change or action." },
  { term: "Consent", definition: "A permission choice recorded with relevant context." },
  { term: "Term", definition: "The period or condition described by the document." },
];

const fade = (frame: number, start = 0, end = 18) => clampInterp(frame, [start, end], [0, 1]);
const lift = (frame: number, start = 0, end = 18, amount = 28) => interpolate(fade(frame, start, end), [0, 1], [amount, 0]);
const safe = (value: string | undefined, fallback: string) => value?.trim() || fallback;

const Header: React.FC<VariantProps & { eyebrow?: string }> = ({ p, pal, eyebrow = "LEGAL EXPLAINER" }) => {
  const frame = useCurrentFrame();
  const opacity = fade(frame, 3, 22);
  return (
    <div style={{ position: "absolute", left: "7%", top: "7%", width: "54%", color: pal.text, fontFamily: SANS, opacity, transform: `translateY(${lift(frame, 3, 22)}px)` }}>
      <div style={{ color: pal.accent, font: `800 15px ${MONO}`, letterSpacing: ".2em" }}>{eyebrow}</div>
      <div style={{ marginTop: 14, fontSize: 60, lineHeight: .98, fontWeight: 900, letterSpacing: "-.055em" }}>{p.title}</div>
      <div style={{ marginTop: 16, maxWidth: 760, color: `${pal.text}a8`, fontSize: 22, lineHeight: 1.35 }}>{p.subtitle}</div>
    </div>
  );
};

const Disclaimer: React.FC<VariantProps> = ({ p, pal }) => (
  <div style={{ position: "absolute", left: "7%", right: "7%", bottom: "5.5%", display: "flex", justifyContent: "space-between", alignItems: "center", color: `${pal.text}8c`, font: `800 12px ${MONO}`, letterSpacing: ".12em" }}>
    <span>{safe(p.disclaimer, DEFAULT_DISCLAIMER)}</span><span>{p.jurisdiction ? `CONTEXT / ${p.jurisdiction.toUpperCase()}` : "CHECK LOCAL GUIDANCE"}</span>
  </div>
);

const Base: React.FC<VariantProps & { children: React.ReactNode; eyebrow?: string }> = ({ p, pal, children, eyebrow }) => (
  <AbsoluteFill style={{ overflow: "hidden", background: `radial-gradient(circle at 80% 20%, ${pal.primary}22, transparent 38%), ${pal.bg}`, fontFamily: SANS }}>
    <div style={{ position: "absolute", inset: 0, opacity: .06, backgroundImage: `linear-gradient(${pal.text} 1px, transparent 1px), linear-gradient(90deg, ${pal.text} 1px, transparent 1px)`, backgroundSize: "84px 84px" }} />
    <Header p={p} pal={pal} eyebrow={eyebrow} />
    {children}
    <Disclaimer p={p} pal={pal} />
  </AbsoluteFill>
);

const Document: React.FC<{ pal: Palette; p: LegalExplainersProps; x?: string; y?: string; width?: string; height?: string; highlight?: number }> = ({ pal, p, x = "52%", y = "27%", width = "39%", height = "54%", highlight = 0 }) => {
  const frame = useCurrentFrame();
  const rows = (p.sections ?? DEFAULT_SECTIONS).slice(0, 5);
  return <div style={{ position: "absolute", left: x, top: y, width, height, borderRadius: 16, overflow: "hidden", background: `${pal.text}0c`, border: `1px solid ${pal.text}30`, boxShadow: `0 26px 60px ${pal.bg}cc`, opacity: fade(frame, 12, 30), transform: `translateY(${lift(frame, 12, 30, 22)}px)` }}>
    <div style={{ height: 44, display: "flex", alignItems: "center", gap: 7, padding: "0 15px", boxSizing: "border-box", background: `${pal.text}15`, borderBottom: `1px solid ${pal.text}26` }}>
      {['#ff605c', '#ffbd44', '#00ca4e'].map((c) => <span key={c} style={{ width: 8, height: 8, borderRadius: 99, background: c }} />)}
      <span style={{ marginLeft: 9, color: `${pal.text}70`, font: `700 12px ${MONO}` }}>{p.logo ?? "document / terms.pdf"}</span>
    </div>
    <div style={{ padding: 24, color: pal.text }}>
      <div style={{ width: "63%", height: 14, borderRadius: 6, background: `${pal.text}a8` }} />
      <div style={{ marginTop: 10, width: "84%", height: 6, borderRadius: 6, background: `${pal.text}35` }} />
      <div style={{ marginTop: 25, display: "grid", gap: 10 }}>{rows.map((row, i) => <div key={row} style={{ minHeight: 52, padding: "10px 12px", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 12, borderRadius: 8, background: i === highlight ? `${pal.accent}26` : `${pal.text}09`, border: `1px solid ${i === highlight ? pal.accent : `${pal.text}20`}`, color: i === highlight ? pal.text : `${pal.text}a0`, fontSize: 15, fontWeight: 750 }}><span style={{ color: i === highlight ? pal.accent : `${pal.text}55`, font: `800 12px ${MONO}` }}>{String(i + 1).padStart(2, "0")}</span>{row}</div>)}</div>
    </div>
  </div>;
};

const Pill: React.FC<{ pal: Palette; text: string; x: string; y: string; delay?: number; color?: string }> = ({ pal, text, x, y, delay = 0, color = pal.accent }) => {
  const frame = useCurrentFrame(); const t = fade(frame, delay, delay + 16);
  return <div style={{ position: "absolute", left: x, top: y, padding: "11px 16px", borderRadius: 99, background: `${pal.bg}ee`, border: `1px solid ${color}99`, color: pal.text, font: `800 14px ${MONO}`, opacity: t, transform: `translateY(${lift(frame, delay, delay + 16, 16)}px)` }}><span style={{ color, marginRight: 8 }}>●</span>{text}</div>;
};

const FlowLine: React.FC<{ pal: Palette; x: string; y: string; width: string; delay?: number }> = ({ pal, x, y, width, delay = 0 }) => { const frame = useCurrentFrame(); return <div style={{ position: "absolute", left: x, top: y, width, height: 3, background: `${pal.text}25`, overflow: "hidden" }}><div style={{ width: `${fade(frame, delay, delay + 20) * 100}%`, height: "100%", background: pal.accent }} /></div>; };

const ContractAnatomy: React.FC<VariantProps> = ({ p, pal }) => {
  const rows = (p.sections ?? DEFAULT_SECTIONS).slice(0, 4);
  return <Base p={p} pal={pal} eyebrow="DOCUMENT MAP"><Document pal={pal} p={p} highlight={1} />{rows.map((row, i) => <React.Fragment key={row}><Pill pal={pal} text={row} x="8%" y={`${35 + i * 11}%`} delay={14 + i * 8} color={[pal.primary, pal.accent, pal.secondary, pal.primary][i]} /><FlowLine pal={pal} x="29%" y={`${40 + i * 11}%`} width="17%" delay={18 + i * 8} /></React.Fragment>)}</Base>;
};

const CaseTimeline: React.FC<VariantProps> = ({ p, pal }) => {
  const dates = (p.dates ?? DEFAULT_DATES).slice(0, 4); const labels = (p.sections ?? ["Initial notice", "Information gathered", "Review point", "Next decision"]).slice(0, 4); const frame = useCurrentFrame();
  return <Base p={p} pal={pal} eyebrow="CHRONOLOGY"><div style={{ position: "absolute", left: "10%", right: "9%", top: "49%", height: 4, background: `${pal.text}2c` }}><div style={{ height: "100%", width: `${fade(frame, 15, 56) * 100}%`, background: pal.accent }} /></div>{labels.map((label, i) => { const t = fade(frame, 13 + i * 10, 30 + i * 10); return <div key={label} style={{ position: "absolute", left: `${10 + i * 26}%`, top: "43%", width: 210, opacity: t, transform: `translateX(${lift(frame, 13 + i * 10, 30 + i * 10, 18)}px)` }}><div style={{ width: 22, height: 22, borderRadius: 99, background: i === 0 ? pal.accent : pal.primary, boxShadow: `0 0 0 7px ${pal.accent}20` }} /><div style={{ marginTop: 18, color: pal.accent, font: `800 15px ${MONO}` }}>{dates[i] ?? `STEP ${i + 1}`}</div><div style={{ marginTop: 9, color: pal.text, fontSize: 18, fontWeight: 800, lineHeight: 1.15 }}>{label}</div><div style={{ marginTop: 8, color: `${pal.text}72`, fontSize: 14, lineHeight: 1.3 }}>{i === 0 ? "Record the context" : i === 1 ? "Review the available facts" : i === 2 ? "Confirm the next checkpoint" : "Choose an informed next step"}</div></div>; })}</Base>;
};

const RightsFlow: React.FC<VariantProps> = ({ p, pal }) => {
  const rights = (p.rights ?? DEFAULT_RIGHTS).slice(0, 4); const frame = useCurrentFrame();
  return <Base p={p} pal={pal} eyebrow="INFORMATION FLOW"><div style={{ position: "absolute", left: "12%", right: "12%", top: "50%", height: 3, background: `${pal.text}28` }} />{rights.map((right, i) => { const t = fade(frame, 15 + i * 10, 31 + i * 10); return <div key={right} style={{ position: "absolute", left: `${11 + i * 25}%`, top: "42%", width: 180, textAlign: "center", opacity: t, transform: `translateY(${lift(frame, 15 + i * 10, 31 + i * 10, 20)}px)` }}><div style={{ width: 82, height: 82, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: `2px solid ${i === 0 ? pal.accent : pal.primary}`, background: `${pal.text}0d`, color: i === 0 ? pal.accent : pal.text, font: `900 23px ${MONO}` }}>{String(i + 1).padStart(2, "0")}</div><div style={{ marginTop: 18, color: pal.text, fontSize: 16, fontWeight: 800 }}>{right}</div><div style={{ marginTop: 8, color: `${pal.text}68`, font: `12px ${MONO}` }}>INFORM / RECORD / REVIEW</div></div>; })}</Base>;
};

const TermsHighlight: React.FC<VariantProps> = ({ p, pal }) => {
  const terms = (p.terms ?? DEFAULT_TERMS).slice(0, 4); const frame = useCurrentFrame();
  return <Base p={p} pal={pal} eyebrow="TERMS / DEFINITIONS"><Document pal={pal} p={p} highlight={Math.floor(frame / 34) % terms.length} /><div style={{ position: "absolute", left: "8%", top: "40%", width: "34%" }}>{terms.map((term, i) => { const active = Math.floor(frame / 34) % terms.length === i; return <div key={term} style={{ marginBottom: 14, padding: "15px 18px", borderRadius: 10, background: active ? `${pal.accent}22` : `${pal.text}0a`, border: `1px solid ${active ? pal.accent : `${pal.text}20`}`, color: active ? pal.text : `${pal.text}7c`, fontSize: 19, fontWeight: 800, transform: `translateX(${active ? 10 : 0}px)` }}><span style={{ color: active ? pal.accent : `${pal.text}45`, font: `800 13px ${MONO}`, marginRight: 12 }}>{String(i + 1).padStart(2, "0")}</span>{term}</div>; })}</div></Base>;
};

const PolicyChange: React.FC<VariantProps> = ({ p, pal }) => {
  const sections = (p.sections ?? ["Current policy", "What changes", "When it applies", "What to review"]).slice(0, 4); const frame = useCurrentFrame();
  return <Base p={p} pal={pal} eyebrow="POLICY UPDATE"><div style={{ position: "absolute", left: "8%", top: "37%", width: "84%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>{["BEFORE", "AFTER"].map((label, side) => <div key={label} style={{ padding: 26, borderRadius: 16, background: `${pal.text}0a`, border: `1px solid ${side ? pal.accent : `${pal.text}28`}`, opacity: fade(frame, 12 + side * 12, 30 + side * 12) }}><div style={{ color: side ? pal.accent : `${pal.text}72`, font: `800 14px ${MONO}`, letterSpacing: ".18em" }}>{label}</div>{sections.map((section, i) => <div key={section} style={{ marginTop: 22, paddingBottom: 13, borderBottom: `1px solid ${pal.text}18`, color: pal.text, fontSize: 18, fontWeight: 750 }}><span style={{ color: side ? pal.accent : `${pal.text}55`, marginRight: 12 }}>{side ? "→" : "•"}</span>{side && i === 1 ? safe(p.subtitle, section) : section}</div>)}</div>)}</div></Base>;
};

const DisputeProcess: React.FC<VariantProps> = ({ p, pal }) => {
  const steps = (p.steps ?? DEFAULT_STEPS).slice(0, 4); const frame = useCurrentFrame();
  return <Base p={p} pal={pal} eyebrow="PROCESS OVERVIEW"><div style={{ position: "absolute", left: "10%", top: "42%", right: "10%", display: "flex", alignItems: "flex-start" }}>{steps.map((step, i) => { const t = fade(frame, 13 + i * 11, 31 + i * 11); return <React.Fragment key={step}><div style={{ width: 190, textAlign: "center", opacity: t }}><div style={{ width: 70, height: 70, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: i === steps.length - 1 ? pal.accent : `${pal.primary}aa`, color: pal.bg, font: `900 19px ${MONO}` }}>{i + 1}</div><div style={{ marginTop: 16, color: pal.text, fontWeight: 800, fontSize: 17 }}>{step}</div><div style={{ marginTop: 8, color: `${pal.text}62`, font: `12px ${MONO}` }}>CHECKPOINT {String(i + 1).padStart(2, "0")}</div></div>{i < steps.length - 1 && <div style={{ flex: 1, height: 3, marginTop: 34, background: `${pal.text}26` }}><div style={{ height: "100%", width: `${fade(frame, 22 + i * 10, 42 + i * 10) * 100}%`, background: pal.accent }} /></div>}</React.Fragment>; })}</div><div style={{ position: "absolute", left: "10%", right: "10%", top: "73%", color: `${pal.text}72`, textAlign: "center", fontSize: 16 }}>{safe(p.accentLabel, "Sequence varies by context — verify the applicable process")}</div></Base>;
};

const PrivacyConsent: React.FC<VariantProps> = ({ p, pal }) => {
  const terms = (p.terms ?? ["Purpose", "Choice", "Access", "Retention"]).slice(0, 4); const frame = useCurrentFrame();
  return <Base p={p} pal={pal} eyebrow="PRIVACY / CHOICE"><div style={{ position: "absolute", left: "9%", top: "38%", width: "35%", padding: 28, borderRadius: 16, background: `${pal.text}0b`, border: `1px solid ${pal.text}24` }}><div style={{ color: pal.text, fontSize: 25, fontWeight: 850 }}>Consent checkpoint</div><div style={{ marginTop: 13, color: `${pal.text}78`, fontSize: 16, lineHeight: 1.4 }}>Explain the purpose, the available choice, and where the record can be reviewed.</div><div style={{ marginTop: 26, display: "flex", gap: 10 }}><span style={{ padding: "10px 15px", borderRadius: 8, background: pal.accent, color: pal.bg, fontWeight: 850 }}>ALLOW</span><span style={{ padding: "10px 15px", borderRadius: 8, border: `1px solid ${pal.text}35`, color: pal.text, fontWeight: 750 }}>REVIEW</span></div></div><div style={{ position: "absolute", left: "53%", top: "38%", width: "38%" }}>{terms.map((term, i) => { const t = fade(frame, 13 + i * 9, 30 + i * 9); return <div key={term} style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 16, opacity: t }}><div style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12, background: `${[pal.primary, pal.secondary, pal.accent, pal.primary][i]}33`, color: [pal.primary, pal.secondary, pal.accent, pal.primary][i], font: `900 15px ${MONO}` }}>0{i + 1}</div><div><div style={{ color: pal.text, fontSize: 19, fontWeight: 800 }}>{term}</div><div style={{ color: `${pal.text}66`, marginTop: 4, fontSize: 14 }}>Document the choice and its context</div></div></div>; })}</div></Base>;
};

const ComplianceCheck: React.FC<VariantProps> = ({ p, pal }) => {
  const checks = (p.sections ?? ["Scope is defined", "Owner is identified", "Record is retained", "Review date is set"]).slice(0, 4); const frame = useCurrentFrame(); const complete = clampInterp(frame, [20, 95], [0, checks.length + 1]);
  return <Base p={p} pal={pal} eyebrow="COMPLIANCE CHECK"><div style={{ position: "absolute", left: "10%", top: "38%", width: "78%", padding: 28, borderRadius: 18, background: `${pal.text}0a`, border: `1px solid ${pal.text}24` }}>{checks.map((check, i) => { const done = complete > i + .72; const t = fade(frame, 14 + i * 10, 31 + i * 10); return <div key={check} style={{ display: "flex", alignItems: "center", gap: 17, minHeight: 72, borderBottom: i < checks.length - 1 ? `1px solid ${pal.text}16` : "none", opacity: t, color: pal.text }}><div style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 9, background: done ? "#65e6a4" : `${pal.text}14`, border: done ? "none" : `1px solid ${pal.text}34`, color: done ? pal.bg : pal.text, font: `900 18px ${MONO}` }}>{done ? "✓" : "·"}</div><span style={{ flex: 1, fontSize: 20, fontWeight: 780 }}>{check}</span><span style={{ color: done ? "#65e6a4" : `${pal.text}55`, font: `800 13px ${MONO}` }}>{done ? "RECORDED" : "TO REVIEW"}</span></div>; })}</div><div style={{ position: "absolute", right: "11%", top: "78%", color: pal.accent, font: `800 14px ${MONO}` }}>{complete >= checks.length ? "CHECKLIST / READY FOR REVIEW" : "CHECKLIST / IN PROGRESS"}</div></Base>;
};

const ClauseCompare: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  return <Base p={p} pal={pal} eyebrow="CLAUSE COMPARISON"><div style={{ position: "absolute", left: "8%", top: "38%", width: "39%", padding: 28, borderRadius: 16, background: `${pal.text}0a`, border: `1px solid ${pal.primary}66`, opacity: fade(frame, 12, 30) }}><div style={{ color: pal.primary, font: `800 14px ${MONO}`, letterSpacing: ".15em" }}>OPTION A / CONTEXT</div><div style={{ marginTop: 19, color: pal.text, fontSize: 22, lineHeight: 1.35, fontWeight: 760 }}>{p.leftClause ?? "The first wording describes one possible scope and responsibility."}</div></div><div style={{ position: "absolute", left: "53%", top: "38%", width: "39%", padding: 28, borderRadius: 16, background: `${pal.accent}12`, border: `1px solid ${pal.accent}88`, opacity: fade(frame, 26, 44) }}><div style={{ color: pal.accent, font: `800 14px ${MONO}`, letterSpacing: ".15em" }}>OPTION B / CONTEXT</div><div style={{ marginTop: 19, color: pal.text, fontSize: 22, lineHeight: 1.35, fontWeight: 760 }}>{p.rightClause ?? "The second wording describes another possible scope and responsibility."}</div></div><div style={{ position: "absolute", left: "46.5%", top: "56%", width: 60, height: 60, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 99, background: pal.bg, border: `2px solid ${pal.accent}`, color: pal.accent, font: `900 14px ${MONO}`, opacity: fade(frame, 36, 52) }}>VS</div></Base>;
};

const LegalGlossary: React.FC<VariantProps> = ({ p, pal }) => {
  const entries = (p.glossary ?? DEFAULT_GLOSSARY).slice(0, 3); const frame = useCurrentFrame();
  return <Base p={p} pal={pal} eyebrow="PLAIN-LANGUAGE GLOSSARY"><div style={{ position: "absolute", left: "8%", top: "38%", right: "8%", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>{entries.map((entry, i) => { const t = fade(frame, 13 + i * 10, 31 + i * 10); return <div key={entry.term} style={{ minHeight: 220, padding: 26, borderRadius: 16, background: `${pal.text}0b`, border: `1px solid ${[pal.primary, pal.secondary, pal.accent][i]}66`, opacity: t, transform: `translateY(${lift(frame, 13 + i * 10, 31 + i * 10, 18)}px)` }}><div style={{ color: [pal.primary, pal.secondary, pal.accent][i], font: `800 14px ${MONO}` }}>TERM 0{i + 1}</div><div style={{ marginTop: 18, color: pal.text, fontSize: 25, fontWeight: 900 }}>{entry.term}</div><div style={{ marginTop: 16, color: `${pal.text}9b`, fontSize: 16, lineHeight: 1.4 }}>{entry.definition}</div></div>; })}</div></Base>;
};

const COMPONENTS: Record<LegalExplainersVariant, React.FC<VariantProps>> = {
  "contract-anatomy": ContractAnatomy,
  "case-timeline": CaseTimeline,
  "rights-flow": RightsFlow,
  "terms-highlight": TermsHighlight,
  "policy-change": PolicyChange,
  "dispute-process": DisputeProcess,
  "privacy-consent": PrivacyConsent,
  "compliance-check": ComplianceCheck,
  "clause-compare": ClauseCompare,
  "legal-glossary": LegalGlossary,
};

const LegalExplainers: React.FC<LegalExplainersProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Component = COMPONENTS[props.variant] ?? ContractAnatomy;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <AbsoluteFill style={{ overflow: "hidden" }}><div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><Component p={props} pal={pal} /></div></AbsoluteFill>;
};

const familyCast = (variant: LegalExplainersVariant): ComponentType<Record<string, unknown>> => (props) => (
  <LegalExplainers {...(props as unknown as LegalExplainersProps)} variant={variant} />
);

export const FAMILY_COMPONENTS: Record<string, ComponentType<Record<string, unknown>>> = {
  "legal-explainers-contract-anatomy": familyCast("contract-anatomy"),
  "legal-explainers-case-timeline": familyCast("case-timeline"),
  "legal-explainers-rights-flow": familyCast("rights-flow"),
  "legal-explainers-terms-highlight": familyCast("terms-highlight"),
  "legal-explainers-policy-change": familyCast("policy-change"),
  "legal-explainers-dispute-process": familyCast("dispute-process"),
  "legal-explainers-privacy-consent": familyCast("privacy-consent"),
  "legal-explainers-compliance-check": familyCast("compliance-check"),
  "legal-explainers-clause-compare": familyCast("clause-compare"),
  "legal-explainers-legal-glossary": familyCast("legal-glossary"),
};
