import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import {
  FadeEdges,
  clampInterp,
  resolvePalette,
  seededRand,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: minimal-corporate
 * Ten restrained business layouts using only fades, 12px rises, and drawn rules.
 */

type CorporateVariant =
  | "agenda"
  | "section-divider"
  | "key-message"
  | "point-counterpoint"
  | "timeline"
  | "team-grid"
  | "quote"
  | "process"
  | "kpi-strip"
  | "closing";

export interface CorporateProps {
  variant: CorporateVariant;
  headline: string;
  body: string;
  paletteName: string;
}

const FONT_STACK = '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';

const parts = (body: string): string[] =>
  body
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

const labeledPart = (value: string): { label: string; detail: string } => {
  const [label, ...detail] = value.split(":");
  return { label: label.trim(), detail: detail.join(":").trim() };
};

const Rise: React.FC<{
  children: React.ReactNode;
  frame: number;
  delay?: number;
  duration?: number;
  style?: React.CSSProperties;
}> = ({ children, frame, delay = 0, duration = 14, style }) => {
  const progress = clampInterp(frame, [delay, delay + duration], [0, 1]);
  return (
    <div
      style={{
        ...style,
        opacity: progress,
        transform: `translateY(${(1 - progress) * 12}px)`,
      }}
    >
      {children}
    </div>
  );
};

const Hairline: React.FC<{
  frame: number;
  color: string;
  delay?: number;
  vertical?: boolean;
  style?: React.CSSProperties;
}> = ({ frame, color, delay = 0, vertical = false, style }) => {
  const progress = clampInterp(frame, [delay, delay + 20], [0, 1]);
  return (
    <div
      style={{
        width: vertical ? 1 : "100%",
        height: vertical ? "100%" : 1,
        backgroundColor: color,
        transformOrigin: vertical ? "top" : "left",
        ...style,
        transform: vertical ? `scaleY(${progress})` : `scaleX(${progress})`,
      }}
    />
  );
};

const Eyebrow: React.FC<{ children: React.ReactNode; color: string }> = ({ children, color }) => (
  <div
    style={{
      color,
      fontSize: 18,
      fontWeight: 650,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
    }}
  >
    {children}
  </div>
);

const Scene: React.FC<{ pal: Palette; children: React.ReactNode }> = ({ pal, children }) => (
  <AbsoluteFill
    style={{
      backgroundColor: pal.bg,
      color: pal.text,
      fontFamily: FONT_STACK,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 54,
        right: 64,
        width: 8,
        height: 8,
        backgroundColor: pal.accent,
      }}
    />
    <FadeEdges inFrames={12} outFrames={14}>{children}</FadeEdges>
  </AbsoluteFill>
);

// ---------------- agenda list reveal ----------------
const Agenda: React.FC<{ p: CorporateProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const items = parts(p.body).slice(0, 5);
  return (
    <AbsoluteFill style={{ padding: "112px 150px 96px" }}>
      <Rise frame={frame} delay={2}>
        <Eyebrow color={pal.accent}>Meeting agenda</Eyebrow>
      </Rise>
      <Rise frame={frame} delay={6} style={{ marginTop: 26, maxWidth: 1000 }}>
        <div style={{ fontSize: 72, lineHeight: 1.08, fontWeight: 560, letterSpacing: "-0.035em" }}>
          {p.headline}
        </div>
      </Rise>
      <Hairline frame={frame} delay={10} color={`${pal.text}33`} style={{ marginTop: 58 }} />
      <div style={{ marginTop: 10 }}>
        {items.map((item, index) => (
          <Rise key={item} frame={frame} delay={18 + index * 7}>
            <div
              style={{
                height: 116,
                display: "grid",
                gridTemplateColumns: "110px 1fr 100px",
                alignItems: "center",
                borderBottom: `1px solid ${pal.text}24`,
              }}
            >
              <div style={{ color: pal.secondary, fontSize: 19, fontVariantNumeric: "tabular-nums" }}>
                {String(index + 1).padStart(2, "0")}
              </div>
              <div style={{ fontSize: 32, fontWeight: 480 }}>{item}</div>
              <div style={{ color: `${pal.text}77`, fontSize: 16, textAlign: "right" }}>
                {index === items.length - 1 ? "DECIDE" : "DISCUSS"}
              </div>
            </div>
          </Rise>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ---------------- section divider with number ----------------
const SectionDivider: React.FC<{ p: CorporateProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const [number = "01", descriptor = ""] = parts(p.body);
  return (
    <AbsoluteFill style={{ padding: "104px 138px" }}>
      <Rise frame={frame} delay={2}>
        <Eyebrow color={pal.secondary}>Section</Eyebrow>
      </Rise>
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "42% 1px 58%",
          alignItems: "center",
          marginTop: 22,
        }}
      >
        <Rise frame={frame} delay={8} style={{ paddingRight: 90 }}>
          <div
            style={{
              color: pal.primary,
              fontSize: 330,
              lineHeight: 0.9,
              fontWeight: 250,
              letterSpacing: "-0.08em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {number}
          </div>
        </Rise>
        <Hairline frame={frame} delay={12} color={`${pal.text}3d`} vertical />
        <div style={{ paddingLeft: 112, maxWidth: 830 }}>
          <Rise frame={frame} delay={18}>
            <div style={{ fontSize: 82, lineHeight: 1.04, fontWeight: 560, letterSpacing: "-0.045em" }}>
              {p.headline}
            </div>
          </Rise>
          <Rise frame={frame} delay={25} style={{ marginTop: 34 }}>
            <div style={{ color: pal.secondary, fontSize: 27, lineHeight: 1.45, maxWidth: 650 }}>
              {descriptor}
            </div>
          </Rise>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- key-message single statement ----------------
const KeyMessage: React.FC<{ p: CorporateProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ padding: "114px 156px 105px", justifyContent: "space-between" }}>
      <Rise frame={frame} delay={2}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ width: 42, height: 1, backgroundColor: pal.accent }} />
          <Eyebrow color={pal.accent}>Key message</Eyebrow>
        </div>
      </Rise>
      <div style={{ maxWidth: 1510 }}>
        <Rise frame={frame} delay={10}>
          <div style={{ fontSize: 94, lineHeight: 1.12, fontWeight: 470, letterSpacing: "-0.046em" }}>
            {p.headline}
          </div>
        </Rise>
        <Hairline frame={frame} delay={18} color={pal.primary} style={{ width: 180, marginTop: 48 }} />
      </div>
      <Rise frame={frame} delay={27} style={{ alignSelf: "flex-end", width: 660 }}>
        <div style={{ color: pal.secondary, fontSize: 29, lineHeight: 1.5 }}>{p.body}</div>
      </Rise>
    </AbsoluteFill>
  );
};

// ---------------- two-column point / counterpoint ----------------
const PointCounterpoint: React.FC<{ p: CorporateProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const columns = parts(p.body).slice(0, 2).map(labeledPart);
  return (
    <AbsoluteFill style={{ padding: "102px 138px 98px" }}>
      <Rise frame={frame} delay={2}>
        <Eyebrow color={pal.accent}>Two perspectives</Eyebrow>
      </Rise>
      <Rise frame={frame} delay={6} style={{ marginTop: 22 }}>
        <div style={{ fontSize: 66, fontWeight: 540, letterSpacing: "-0.035em" }}>{p.headline}</div>
      </Rise>
      <Hairline frame={frame} delay={10} color={`${pal.text}30`} style={{ marginTop: 44 }} />
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1px 1fr", marginTop: 54 }}>
        <Rise frame={frame} delay={18} style={{ padding: "22px 100px 0 18px" }}>
          <div style={{ color: pal.primary, fontSize: 20, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            {columns[0]?.label ?? "Point"}
          </div>
          <div style={{ marginTop: 38, fontSize: 43, lineHeight: 1.34, fontWeight: 430 }}>
            {columns[0]?.detail ?? "A clear case for focused investment."}
          </div>
          <div style={{ marginTop: 58, width: 34, height: 3, backgroundColor: pal.primary }} />
        </Rise>
        <Hairline frame={frame} delay={15} color={`${pal.text}38`} vertical />
        <Rise frame={frame} delay={25} style={{ padding: "22px 18px 0 100px" }}>
          <div style={{ color: pal.accent, fontSize: 20, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            {columns[1]?.label ?? "Counterpoint"}
          </div>
          <div style={{ marginTop: 38, fontSize: 43, lineHeight: 1.34, fontWeight: 430 }}>
            {columns[1]?.detail ?? "A measured view of the tradeoffs."}
          </div>
          <div style={{ marginTop: 58, width: 34, height: 3, backgroundColor: pal.accent }} />
        </Rise>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- horizontal timeline milestones ----------------
const Timeline: React.FC<{ p: CorporateProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const milestones = parts(p.body).slice(0, 4).map(labeledPart);
  return (
    <AbsoluteFill style={{ padding: "104px 142px 94px" }}>
      <Rise frame={frame} delay={2}>
        <Eyebrow color={pal.accent}>Roadmap</Eyebrow>
      </Rise>
      <Rise frame={frame} delay={6} style={{ marginTop: 24 }}>
        <div style={{ fontSize: 70, fontWeight: 540, letterSpacing: "-0.04em" }}>{p.headline}</div>
      </Rise>
      <div style={{ position: "relative", flex: 1, marginTop: 56 }}>
        <Hairline
          frame={frame}
          delay={14}
          color={`${pal.text}55`}
          style={{ position: "absolute", left: 20, right: 20, top: "50%", width: "auto" }}
        />
        <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: `repeat(${Math.max(1, milestones.length)}, 1fr)` }}>
          {milestones.map((milestone, index) => {
            const above = index % 2 === 0;
            const reveal = clampInterp(frame, [21 + index * 8, 33 + index * 8], [0, 1]);
            return (
              <div key={`${milestone.label}-${index}`} style={{ position: "relative", padding: "0 28px" }}>
                <div
                  style={{
                    position: "absolute",
                    left: 30,
                    top: "50%",
                    width: 15,
                    height: 15,
                    borderRadius: "50%",
                    backgroundColor: pal.bg,
                    border: `3px solid ${index === milestones.length - 1 ? pal.accent : pal.primary}`,
                    opacity: reveal,
                    transform: `translate(-50%, -50%) scale(${0.75 + reveal * 0.25})`,
                  }}
                />
                <Rise
                  frame={frame}
                  delay={23 + index * 8}
                  style={{ position: "absolute", left: 28, right: 30, top: above ? "13%" : "58%" }}
                >
                  <div style={{ color: pal.secondary, fontSize: 18, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {milestone.label}
                  </div>
                  <div style={{ marginTop: 16, fontSize: 31, lineHeight: 1.3, fontWeight: 520 }}>
                    {milestone.detail}
                  </div>
                </Rise>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- team grid with deterministic initial avatars ----------------
const TeamGrid: React.FC<{ p: CorporateProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const members = parts(p.body).slice(0, 4).map(labeledPart);
  const avatarColors = [pal.primary, pal.secondary, pal.accent];
  return (
    <AbsoluteFill style={{ padding: "104px 140px 94px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <Rise frame={frame} delay={2}>
          <Eyebrow color={pal.accent}>Leadership</Eyebrow>
          <div style={{ marginTop: 24, fontSize: 70, fontWeight: 540, letterSpacing: "-0.04em" }}>{p.headline}</div>
        </Rise>
        <Rise frame={frame} delay={10}>
          <div style={{ color: pal.secondary, fontSize: 20 }}>{String(members.length).padStart(2, "0")} team members</div>
        </Rise>
      </div>
      <Hairline frame={frame} delay={12} color={`${pal.text}30`} style={{ marginTop: 46 }} />
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 42, alignItems: "center" }}>
        {members.map((member, index) => {
          const initials = member.label
            .split(/\s+/)
            .map((word) => word[0] ?? "")
            .join("")
            .slice(0, 2)
            .toUpperCase();
          const colorIndex = Math.floor(seededRand(index + member.label.length * 3) * avatarColors.length);
          return (
            <Rise key={`${member.label}-${index}`} frame={frame} delay={18 + index * 7}>
              <div style={{ minHeight: 480, borderLeft: `1px solid ${pal.text}28`, paddingLeft: 34, paddingTop: 34 }}>
                <div
                  style={{
                    width: 148,
                    height: 148,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: avatarColors[colorIndex],
                    color: pal.bg,
                    fontSize: 43,
                    fontWeight: 570,
                    letterSpacing: "0.04em",
                  }}
                >
                  {initials}
                </div>
                <div style={{ marginTop: 52, fontSize: 31, fontWeight: 560 }}>{member.label}</div>
                <div style={{ marginTop: 12, color: pal.secondary, fontSize: 20, lineHeight: 1.4 }}>{member.detail}</div>
                <div style={{ marginTop: 46, width: 26, height: 2, backgroundColor: avatarColors[colorIndex] }} />
              </div>
            </Rise>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------- corporate quote and attribution ----------------
const Quote: React.FC<{ p: CorporateProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const [name = "", role = ""] = parts(p.body);
  return (
    <AbsoluteFill style={{ padding: "102px 146px 104px" }}>
      <Rise frame={frame} delay={2}>
        <Eyebrow color={pal.accent}>Perspective</Eyebrow>
      </Rise>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "210px 1fr", alignItems: "center" }}>
        <Rise frame={frame} delay={7}>
          <div style={{ color: pal.primary, fontFamily: "Georgia, serif", fontSize: 210, lineHeight: 0.6 }}>“</div>
        </Rise>
        <div style={{ maxWidth: 1280 }}>
          <Rise frame={frame} delay={12}>
            <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 70, lineHeight: 1.28, letterSpacing: "-0.025em" }}>
              {p.headline}
            </div>
          </Rise>
          <div style={{ display: "flex", alignItems: "center", gap: 30, marginTop: 58 }}>
            <Hairline frame={frame} delay={21} color={pal.accent} style={{ width: 92, flex: "none" }} />
            <Rise frame={frame} delay={26}>
              <div style={{ fontSize: 24, fontWeight: 650 }}>{name}</div>
              <div style={{ color: pal.secondary, fontSize: 19, marginTop: 8 }}>{role}</div>
            </Rise>
          </div>
        </div>
      </div>
      <Rise frame={frame} delay={32} style={{ alignSelf: "flex-end" }}>
        <div style={{ color: `${pal.text}66`, fontSize: 16, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Leadership note
        </div>
      </Rise>
    </AbsoluteFill>
  );
};

// ---------------- process steps 1–2–3 ----------------
const Process: React.FC<{ p: CorporateProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const steps = parts(p.body).slice(0, 3).map(labeledPart);
  return (
    <AbsoluteFill style={{ padding: "102px 140px 100px" }}>
      <Rise frame={frame} delay={2}>
        <Eyebrow color={pal.accent}>How we work</Eyebrow>
      </Rise>
      <Rise frame={frame} delay={6} style={{ marginTop: 24 }}>
        <div style={{ fontSize: 68, fontWeight: 540, letterSpacing: "-0.04em" }}>{p.headline}</div>
      </Rise>
      <div style={{ position: "relative", flex: 1, marginTop: 62 }}>
        <Hairline frame={frame} delay={13} color={`${pal.text}34`} style={{ position: "absolute", top: 75, left: 74, right: 74, width: "auto" }} />
        <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 50 }}>
          {steps.map((step, index) => (
            <Rise key={`${step.label}-${index}`} frame={frame} delay={18 + index * 9}>
              <div style={{ backgroundColor: pal.bg, paddingRight: 38 }}>
                <div
                  style={{
                    width: 150,
                    height: 150,
                    borderRadius: "50%",
                    border: `1px solid ${index === 1 ? pal.accent : pal.primary}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 50,
                    fontWeight: 300,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {index + 1}
                </div>
                <div style={{ marginTop: 54, fontSize: 35, fontWeight: 570 }}>{step.label}</div>
                <div style={{ marginTop: 20, color: pal.secondary, fontSize: 23, lineHeight: 1.5, maxWidth: 410 }}>
                  {step.detail}
                </div>
              </div>
            </Rise>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- KPI strip under headline ----------------
const KpiStrip: React.FC<{ p: CorporateProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const metrics = parts(p.body).slice(0, 4).map(labeledPart);
  return (
    <AbsoluteFill style={{ padding: "106px 140px 94px" }}>
      <Rise frame={frame} delay={2}>
        <Eyebrow color={pal.accent}>Performance snapshot</Eyebrow>
      </Rise>
      <Rise frame={frame} delay={7} style={{ marginTop: 36, maxWidth: 1420 }}>
        <div style={{ fontSize: 86, lineHeight: 1.12, fontWeight: 520, letterSpacing: "-0.045em" }}>{p.headline}</div>
      </Rise>
      <div style={{ flex: 1 }} />
      <Hairline frame={frame} delay={15} color={`${pal.text}3d`} />
      <div style={{ height: 330, display: "grid", gridTemplateColumns: `repeat(${Math.max(1, metrics.length)}, 1fr)` }}>
        {metrics.map((metric, index) => (
          <Rise key={`${metric.label}-${index}`} frame={frame} delay={20 + index * 7}>
            <div
              style={{
                height: "100%",
                padding: "58px 42px 20px",
                borderRight: index < metrics.length - 1 ? `1px solid ${pal.text}2b` : undefined,
              }}
            >
              <div style={{ color: index === metrics.length - 1 ? pal.accent : pal.primary, fontSize: 76, lineHeight: 1, fontWeight: 430, letterSpacing: "-0.045em" }}>
                {metric.label}
              </div>
              <div style={{ marginTop: 30, color: pal.secondary, fontSize: 20, lineHeight: 1.35 }}>{metric.detail}</div>
            </div>
          </Rise>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ---------------- closing slide with contact block ----------------
const Closing: React.FC<{ p: CorporateProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const contact = parts(p.body);
  return (
    <AbsoluteFill style={{ padding: "106px 142px 98px" }}>
      <Rise frame={frame} delay={2}>
        <Eyebrow color={pal.accent}>Next conversation</Eyebrow>
      </Rise>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.25fr 1px 0.75fr", alignItems: "center", marginTop: 32 }}>
        <div style={{ paddingRight: 120 }}>
          <Rise frame={frame} delay={8}>
            <div style={{ fontSize: 104, lineHeight: 1.04, fontWeight: 510, letterSpacing: "-0.052em" }}>{p.headline}</div>
          </Rise>
          <Hairline frame={frame} delay={17} color={pal.accent} style={{ width: 150, marginTop: 54 }} />
        </div>
        <Hairline frame={frame} delay={14} color={`${pal.text}3d`} vertical />
        <Rise frame={frame} delay={22} style={{ paddingLeft: 92 }}>
          <div style={{ color: pal.secondary, fontSize: 17, letterSpacing: "0.16em", textTransform: "uppercase" }}>Contact</div>
          <div style={{ marginTop: 42, fontSize: 31, lineHeight: 1.7, fontWeight: 500 }}>
            {contact.map((line, index) => (
              <div key={`${line}-${index}`} style={{ color: index === 0 ? pal.text : pal.secondary }}>
                {line}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 58, display: "flex", alignItems: "center", gap: 15 }}>
            <div style={{ width: 9, height: 9, backgroundColor: pal.accent }} />
            <div style={{ color: `${pal.text}88`, fontSize: 17 }}>Available for follow-up</div>
          </div>
        </Rise>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", color: `${pal.text}66`, fontSize: 15, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        <span>Confidential</span>
        <span>Thank you</span>
      </div>
    </AbsoluteFill>
  );
};

const VARIANTS: Record<CorporateVariant, React.FC<{ p: CorporateProps; pal: Palette }>> = {
  agenda: Agenda,
  "section-divider": SectionDivider,
  "key-message": KeyMessage,
  "point-counterpoint": PointCounterpoint,
  timeline: Timeline,
  "team-grid": TeamGrid,
  quote: Quote,
  process: Process,
  "kpi-strip": KpiStrip,
  closing: Closing,
};

export const MinimalCorporateTemplate: React.FC<CorporateProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? Agenda;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return (
    <Scene pal={pal}>
      <div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}>
        <Variant p={props} pal={pal} />
      </div>
    </Scene>
  );
};

const familyCast = (component: React.FC<CorporateProps>) =>
  component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "corporate-agenda-reveal": familyCast(MinimalCorporateTemplate),
  "corporate-section-divider": familyCast(MinimalCorporateTemplate),
  "corporate-key-message": familyCast(MinimalCorporateTemplate),
  "corporate-point-counterpoint": familyCast(MinimalCorporateTemplate),
  "corporate-timeline-milestones": familyCast(MinimalCorporateTemplate),
  "corporate-team-grid": familyCast(MinimalCorporateTemplate),
  "corporate-quote-attribution": familyCast(MinimalCorporateTemplate),
  "corporate-process-steps": familyCast(MinimalCorporateTemplate),
  "corporate-kpi-strip": familyCast(MinimalCorporateTemplate),
  "corporate-closing-contact": familyCast(MinimalCorporateTemplate),
};
