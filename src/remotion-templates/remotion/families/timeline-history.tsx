import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { ComponentType } from "react";
import { clampInterp, resolvePalette, type Palette } from "../lib/primitives";

/**
 * FAMILY: timeline-history
 * Date-led history and product progression scenes. The default event data is
 * procedural, while events/eraColors/focusIndex make every composition reusable.
 */
export type TimelineHistoryVariant =
  | "horizontal-era"
  | "vertical-milestones"
  | "zoom-century"
  | "founder-story"
  | "product-evolution"
  | "before-during-after"
  | "parallel-timelines"
  | "anniversary-count"
  | "future-roadmap"
  | "event-scrub";

export interface TimelineHistoryEvent {
  date: string;
  label: string;
  detail?: string;
  color?: string;
}

export interface TimelineHistoryProps {
  variant: TimelineHistoryVariant;
  title: string;
  subtitle: string;
  paletteName: string;
  events?: TimelineHistoryEvent[];
  focusIndex?: number;
  eraColors?: string[];
  startYear?: number;
  endYear?: number;
  founder?: string;
  productName?: string;
}

type VariantProps = { p: TimelineHistoryProps; pal: Palette };
const SANS = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const SERIF = 'Georgia, "Times New Roman", serif';

const DEFAULT_EVENTS: TimelineHistoryEvent[] = [
  { date: "2014", label: "The first sketch", detail: "A small idea becomes a shared direction." },
  { date: "2016", label: "First release", detail: "The first public milestone reaches the world." },
  { date: "2019", label: "A wider orbit", detail: "New people, places, and possibilities join in." },
  { date: "2022", label: "Built to last", detail: "The system matures without losing its point of view." },
  { date: "2026", label: "Next chapter", detail: "A deliberate step into what comes next." },
];

const eventsFor = (p: TimelineHistoryProps): TimelineHistoryEvent[] =>
  (p.events?.length ? p.events : DEFAULT_EVENTS).slice(0, 12).map((event, i) => ({
    date: event.date || String((p.startYear ?? 2014) + i * 2),
    label: event.label || `Milestone ${i + 1}`,
    detail: event.detail || "A meaningful step in the story.",
    color: event.color,
  }));

const colorFor = (event: TimelineHistoryEvent, index: number, pal: Palette, p: TimelineHistoryProps) =>
  event.color || (p.eraColors?.[index % p.eraColors.length] ?? [pal.primary, pal.secondary, pal.accent][index % 3]);

const Header: React.FC<{ p: TimelineHistoryProps; pal: Palette; eyebrow?: string; dark?: boolean }> = ({ p, pal, eyebrow = "THE LONG VIEW", dark = false }) => (
  <div style={{ position: "absolute", left: "7%", top: "6%", width: "52%", color: dark ? pal.bg : pal.text, fontFamily: SANS, zIndex: 5 }}>
    <div style={{ font: `800 17px ${MONO}`, letterSpacing: "0.22em", color: dark ? `${pal.bg}aa` : pal.accent }}>{eyebrow}</div>
    <div style={{ marginTop: 11, fontSize: 56, lineHeight: 1.02, fontWeight: 900, letterSpacing: "-0.055em" }}>{p.title}</div>
    <div style={{ marginTop: 12, maxWidth: 720, fontSize: 18, lineHeight: 1.25, color: dark ? `${pal.bg}aa` : `${pal.text}a8` }}>{p.subtitle}</div>
  </div>
);

const Stage: React.FC<{ pal: Palette; children: React.ReactNode; light?: boolean }> = ({ pal, children, light = false }) => (
  <AbsoluteFill style={{ background: light ? pal.text : pal.bg, overflow: "hidden" }}>{children}</AbsoluteFill>
);

const EventLabel: React.FC<{ event: TimelineHistoryEvent; pal: Palette; color: string; width?: number; align?: "left" | "center" | "right"; small?: boolean }> = ({ event, pal, color, width = 260, align = "left", small = false }) => (
  <div style={{ width, textAlign: align, color: pal.text, fontFamily: SANS }}>
    <div style={{ color, font: `${small ? 15 : 18}px ${MONO}`, fontWeight: 800, letterSpacing: "0.12em" }}>{event.date}</div>
    <div style={{ marginTop: 9, fontSize: small ? 21 : 27, lineHeight: 1.05, fontWeight: 850, letterSpacing: "-0.025em" }}>{event.label}</div>
    {event.detail && <div style={{ marginTop: 9, color: `${pal.text}88`, fontSize: small ? 14 : 17, lineHeight: 1.35 }}>{event.detail}</div>}
  </div>
);

const HorizontalEra: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { width } = useVideoConfig(); const items = eventsFor(p);
  const progress = clampInterp(frame, [8, 50], [0, 1]);
  return <Stage pal={pal}>
    <Header p={p} pal={pal} eyebrow="ARCHIVE / HORIZONTAL ERA" />
    <div style={{ position: "absolute", left: "8%", right: "7%", top: "57%", height: 4, background: `${pal.text}2b` }}>
      <div style={{ width: `${progress * 100}%`, height: "100%", background: pal.primary }} />
      {items.map((event, i) => {
        const trackWidth = width * 0.85; const x = ((i + 0.5) / items.length) * trackWidth;
        const c = colorFor(event, i, pal, p);
        const show = clampInterp(frame, [12 + i * 5, 28 + i * 5], [0, 1]);
        return <div key={`${event.date}-${i}`} style={{ position: "absolute", left: x, top: -14, transform: `translateX(-50%) scale(${0.7 + show * 0.3})`, opacity: show }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: c, border: `7px solid ${pal.bg}`, boxShadow: `0 0 0 2px ${c}` }} />
          <div style={{ position: "absolute", top: 58, left: "50%", transform: `translateX(-50%) ${i % 2 ? "translateY(120px)" : ""}` }}><EventLabel event={event} pal={pal} color={c} align="center" /></div>
        </div>;
      })}
    </div>
    <div style={{ position: "absolute", left: "8%", bottom: "10%", font: `700 16px ${MONO}`, color: `${pal.text}66`, letterSpacing: "0.16em" }}>{String(p.startYear ?? items[0]?.date ?? "")} — {String(p.endYear ?? items.at(-1)?.date ?? "")} / {items.length} ERA MARKERS</div>
  </Stage>;
};

const VerticalMilestones: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const items = eventsFor(p); const focus = Math.min(p.focusIndex ?? 2, items.length - 1);
  return <Stage pal={pal}>
    <Header p={p} pal={pal} eyebrow="MILESTONES / VERTICAL" />
    <div style={{ position: "absolute", top: "38%", bottom: "8%", left: "49%", width: 4, background: `${pal.primary}42` }}>
      <div style={{ height: `${clampInterp(frame, [10, 50], [0, 100])}%`, background: pal.primary }} />
      {items.map((event, i) => { const y = ((i + 0.3) / items.length) * 100; const c = colorFor(event, i, pal, p); const reveal = clampInterp(frame, [12 + i * 5, 28 + i * 5], [0, 1]); const active = i === focus; return <div key={`${event.date}-${i}`} style={{ position: "absolute", top: `${y}%`, left: "50%", opacity: reveal, transform: `translate(-50%, -50%) scale(${active ? 1.22 : 1})` }}><div style={{ width: active ? 30 : 20, height: active ? 30 : 20, borderRadius: "50%", background: c, boxShadow: active ? `0 0 0 12px ${c}22` : undefined }} /><div style={{ position: "absolute", width: 340, top: -14, left: i % 2 ? 38 : -380, textAlign: i % 2 ? "left" : "right" }}><EventLabel event={event} pal={pal} color={c} width={330} align={i % 2 ? "left" : "right"} small /></div></div>; })}
    </div>
  </Stage>;
};

const ZoomCentury: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { width } = useVideoConfig(); const items = eventsFor(p); const focus = Math.min(p.focusIndex ?? 2, items.length - 1); const zoom = interpolate(clampInterp(frame, [8, 48], [0, 1]), [0, 1], [0.62, 1.18]);
  return <Stage pal={pal}>
    <Header p={p} pal={pal} eyebrow="ZOOM / CENTURY VIEW" />
    <div style={{ position: "absolute", left: "50%", top: "62%", width: 1450, height: 4, background: pal.primary, transform: `translateX(-50%) scaleX(${zoom})`, transformOrigin: `${(focus / Math.max(1, items.length - 1)) * 100}% center` }}>
      {items.map((event, i) => { const c = colorFor(event, i, pal, p); const x = (i / Math.max(1, items.length - 1)) * 100; const reveal = clampInterp(frame, [16 + i * 4, 32 + i * 4], [0, 1]); return <div key={`${event.date}-${i}`} style={{ position: "absolute", left: `${x}%`, top: -13, transform: `translateX(-50%) scale(${reveal})` }}><div style={{ width: 28, height: 28, borderRadius: "50%", background: c }} /><div style={{ position: "absolute", top: 55, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" }}><EventLabel event={event} pal={pal} color={c} align="center" small /></div></div>; })}
    </div>
    <div style={{ position: "absolute", left: "50%", top: "43%", transform: `translateX(-50%) scale(${zoom})`, transformOrigin: `${(focus / Math.max(1, items.length - 1)) * 100}% center`, font: `900 130px ${SANS}`, letterSpacing: "-0.1em", color: `${pal.text}0b`, whiteSpace: "nowrap" }}>{p.startYear ?? "1900"}—{p.endYear ?? "2000"}</div>
  </Stage>;
};

const FounderStory: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const items = eventsFor(p); const founder = p.founder || "THE FOUNDER"; const rise = spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 18, stiffness: 90 } });
  return <Stage pal={pal}>
    <Header p={p} pal={pal} eyebrow="ORIGIN STORY" />
    <div style={{ position: "absolute", left: "9%", top: "39%", width: 270, height: 270, borderRadius: "50%", background: `radial-gradient(circle at 36% 30%, ${pal.secondary}, ${pal.primary} 48%, ${pal.bg})`, border: `8px solid ${pal.accent}`, transform: `scale(${rise})`, boxShadow: `0 30px 80px ${pal.primary}55` }}><div style={{ position: "absolute", inset: 35, borderRadius: "50%", border: `2px dashed ${pal.text}88` }} /></div>
    <div style={{ position: "absolute", left: "10%", top: "72%", color: pal.text, font: `800 18px ${MONO}`, letterSpacing: "0.16em" }}>{founder}</div>
    <div style={{ position: "absolute", left: "35%", right: "8%", top: "53%", height: 3, background: `${pal.text}33` }}>
      {items.map((event, i) => { const c = colorFor(event, i, pal, p); const show = clampInterp(frame, [15 + i * 6, 32 + i * 6], [0, 1]); return <div key={`${event.date}-${i}`} style={{ position: "absolute", left: `${(i / Math.max(1, items.length - 1)) * 100}%`, top: -13, opacity: show, transform: `translateX(-50%) translateY(${(1 - show) * 25}px)` }}><div style={{ width: 27, height: 27, borderRadius: "50%", background: c }} /><div style={{ position: "absolute", top: i % 2 ? 52 : -165, left: "50%", transform: "translateX(-50%)", whiteSpace: "normal" }}><EventLabel event={event} pal={pal} color={c} width={180} align="center" small /></div></div>; })}
    </div>
  </Stage>;
};

const ProductEvolution: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const items = eventsFor(p); const name = p.productName || p.title || "PRODUCT";
  return <Stage pal={pal}>
    <Header p={p} pal={pal} eyebrow="PRODUCT / EVOLUTION" />
    <div style={{ position: "absolute", left: "8%", right: "8%", top: "46%", height: 320, display: "flex", alignItems: "flex-end", gap: 22 }}>
      {items.slice(0, 6).map((event, i) => { const c = colorFor(event, i, pal, p); const h = 150 + i * 45; const show = clampInterp(frame, [10 + i * 5, 28 + i * 5], [0, 1]); return <div key={`${event.date}-${i}`} style={{ flex: 1, height: h, minWidth: 120, opacity: show, transform: `translateY(${(1 - show) * 80}px)` }}><div style={{ height: "100%", borderRadius: "20px 20px 5px 5px", border: `2px solid ${c}`, background: `linear-gradient(160deg, ${c}55, ${pal.bg})`, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 24, boxSizing: "border-box", color: pal.text }}><div style={{ font: `700 15px ${MONO}`, color: c }}>{event.date}</div><div style={{ marginTop: 8, font: `800 24px ${SANS}` }}>V{i + 1}</div><div style={{ marginTop: 8, font: `15px ${SANS}`, color: `${pal.text}9c` }}>{event.label}</div></div></div>; })}
    </div>
    <div style={{ position: "absolute", right: "8%", bottom: "9%", font: `800 18px ${MONO}`, color: pal.accent, letterSpacing: "0.16em" }}>{name.toUpperCase()} / ITERATION TO ITERATION</div>
  </Stage>;
};

const BeforeDuringAfter: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const items = eventsFor(p); const labels = ["BEFORE", "DURING", "AFTER"];
  return <Stage pal={pal} light>
    <Header p={p} pal={{ ...pal, text: pal.bg }} eyebrow="THEN / NOW" dark />
    <div style={{ position: "absolute", left: "7%", right: "7%", top: "52%", bottom: "8%", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
      {labels.map((label, i) => { const event = items[Math.min(i, items.length - 1)]; const c = colorFor(event, i, pal, p); const show = clampInterp(frame, [8 + i * 8, 28 + i * 8], [0, 1]); return <div key={label} style={{ position: "relative", overflow: "hidden", borderRadius: 22, background: i === 1 ? pal.bg : `${pal.bg}e8`, color: pal.text, opacity: show, transform: `translateY(${(1 - show) * 36}px)` }}><div style={{ position: "absolute", inset: 0, background: `linear-gradient(145deg, ${c}55, transparent 55%)` }} /><div style={{ position: "absolute", left: 28, top: 27, font: `800 16px ${MONO}`, letterSpacing: "0.16em", color: c }}>{label}</div><div style={{ position: "absolute", left: 28, right: 28, bottom: 28 }}><div style={{ font: `800 33px ${SANS}` }}>{event.label}</div><div style={{ marginTop: 10, font: `700 18px ${MONO}`, color: c }}>{event.date}</div></div></div>; })}
    </div>
  </Stage>;
};

const ParallelTimelines: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const items = eventsFor(p); const split = Math.ceil(items.length / 2);
  return <Stage pal={pal}>
    <Header p={p} pal={pal} eyebrow="PARALLEL / TWO THREADS" />
    {[0, 1].map((lane) => { const laneItems = items.slice(lane * split, (lane + 1) * split); const c = lane ? pal.accent : pal.primary; return <div key={lane} style={{ position: "absolute", left: "10%", right: "8%", top: `${54 + lane * 21}%`, height: 3, background: `${pal.text}44` }}><div style={{ position: "absolute", left: 0, top: -10, width: 23, height: 23, borderRadius: "50%", background: c }} />{laneItems.map((event, i) => { const show = clampInterp(frame, [12 + i * 6 + lane * 3, 30 + i * 6 + lane * 3], [0, 1]); const x = ((i + 0.5) / Math.max(1, laneItems.length)) * 100; return <div key={`${event.date}-${lane}-${i}`} style={{ position: "absolute", left: `${x}%`, top: -9, opacity: show, transform: `translateX(-50%) scale(${show})` }}><div style={{ width: 20, height: 20, borderRadius: "50%", background: c }} /><div style={{ position: "absolute", top: lane ? 38 : -130, left: "50%", transform: "translateX(-50%)", whiteSpace: "normal" }}><EventLabel event={event} pal={pal} color={c} width={165} align="center" small /></div></div>; })}</div>; })}
  </Stage>;
};

const AnniversaryCount: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const items = eventsFor(p); const count = Math.round(clampInterp(frame, [5, 52], [0, items.length])); const year = p.endYear ?? (Number(items.at(-1)?.date) || 2026);
  return <Stage pal={pal} light>
    <Header p={p} pal={{ ...pal, text: pal.bg }} eyebrow="A STORY IN NUMBERS" dark />
    <div style={{ position: "absolute", left: "50%", top: "58%", transform: "translate(-50%, -50%)", textAlign: "center", color: pal.bg, zIndex: 2 }}><div style={{ font: `950 210px ${SANS}`, lineHeight: 0.85, letterSpacing: "-0.12em" }}>{String(count).padStart(2, "0")}</div><div style={{ marginTop: 16, font: `800 17px ${MONO}`, letterSpacing: "0.18em", color: `${pal.bg}dd` }}>{year - (p.startYear ?? 2000)} YEARS / {p.productName || "THE JOURNEY"}</div></div>
    {items.map((event, i) => { const angle = (i / Math.max(1, items.length)) * Math.PI * 2 - Math.PI / 2; const radius = 270 + (i % 2) * 42; const c = colorFor(event, i, pal, p); const show = i < count ? 1 : 0; return <div key={`${event.date}-${i}`} style={{ position: "absolute", left: `calc(50% + ${Math.cos(angle) * radius}px)`, top: `calc(56% + ${Math.sin(angle) * radius}px)`, width: 20, height: 20, borderRadius: "50%", background: c, opacity: show, boxShadow: `0 0 0 8px ${c}22` }} />; })}
  </Stage>;
};

const FutureRoadmap: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const items = eventsFor(p); const progress = clampInterp(frame, [8, 58], [0, 1]);
  return <Stage pal={pal}>
    <Header p={p} pal={pal} eyebrow="LOOKING AHEAD / ROADMAP" />
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 1920 1080" preserveAspectRatio="none"><path d="M140 810 C450 560 610 850 880 620 S1370 450 1770 220" fill="none" stroke={`${pal.text}33`} strokeWidth="5" /><path d="M140 810 C450 560 610 850 880 620 S1370 450 1770 220" fill="none" stroke={pal.primary} strokeWidth="7" strokeDasharray="2100" strokeDashoffset={2100 - progress * 2100} /></svg>
    {items.map((event, i) => { const t = i / Math.max(1, items.length - 1); const x = 140 + t * 1630; const y = 810 - Math.sin(t * Math.PI) * 260 - t * 330; const c = colorFor(event, i, pal, p); const show = clampInterp(frame, [16 + i * 5, 33 + i * 5], [0, 1]); return <div key={`${event.date}-${i}`} style={{ position: "absolute", left: x, top: y, opacity: show, transform: `translate(-50%, -50%) scale(${show})` }}><div style={{ width: 31, height: 31, borderRadius: "50%", background: pal.bg, border: `7px solid ${c}`, boxShadow: `0 0 0 8px ${c}22` }} /><div style={{ position: "absolute", bottom: 57, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" }}><EventLabel event={event} pal={pal} color={c} width={220} align="center" small /></div></div>; })}
  </Stage>;
};

const EventScrub: React.FC<VariantProps> = ({ p, pal }) => {
  const frame = useCurrentFrame(); const items = eventsFor(p); const current = clampInterp(frame, [8, 85], [0, items.length - 1]);
  return <Stage pal={pal}>
    <Header p={p} pal={pal} eyebrow="EVENT SCRUB / INDEX" />
    <div style={{ position: "absolute", left: "10%", right: "9%", top: "58%", height: 120, display: "flex", gap: 18, transform: `translateX(${interpolate(current, [0, items.length - 1], [180, -180])}px)` }}>
      {items.map((event, i) => { const c = colorFor(event, i, pal, p); const active = Math.abs(i - current) < 0.55; return <div key={`${event.date}-${i}`} style={{ flex: "0 0 270px", height: 120, borderRadius: 18, padding: 18, boxSizing: "border-box", border: `2px solid ${active ? c : `${pal.text}24`}`, background: active ? `${c}22` : `${pal.text}08`, color: pal.text, transform: `scale(${active ? 1.08 : 0.92})`, opacity: active ? 1 : 0.55 }}><div style={{ font: `800 15px ${MONO}`, color: c }}>{event.date}</div><div style={{ marginTop: 12, font: `800 20px ${SANS}` }}>{event.label}</div></div>; })}
    </div>
    <div style={{ position: "absolute", left: "10%", right: "9%", top: "76%", height: 3, background: `${pal.text}33` }}><div style={{ width: `${(current / Math.max(1, items.length - 1)) * 100}%`, height: "100%", background: pal.accent }} /></div>
    <div style={{ position: "absolute", right: "9%", bottom: "10%", font: `700 15px ${MONO}`, color: `${pal.text}66`, letterSpacing: "0.12em" }}>{Math.round(current + 1)} / {items.length} EVENTS</div>
  </Stage>;
};

const COMPONENTS: Record<TimelineHistoryVariant, React.FC<VariantProps>> = {
  "horizontal-era": HorizontalEra,
  "vertical-milestones": VerticalMilestones,
  "zoom-century": ZoomCentury,
  "founder-story": FounderStory,
  "product-evolution": ProductEvolution,
  "before-during-after": BeforeDuringAfter,
  "parallel-timelines": ParallelTimelines,
  "anniversary-count": AnniversaryCount,
  "future-roadmap": FutureRoadmap,
  "event-scrub": EventScrub,
};

const TimelineHistory: React.FC<TimelineHistoryProps> = ({ variant, ...rest }) => {
  const p = { variant, ...rest } as TimelineHistoryProps;
  const pal = resolvePalette(p.paletteName);
  const Renderer = COMPONENTS[variant] ?? HorizontalEra;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <AbsoluteFill style={{ backgroundColor: pal.bg, overflow: "hidden" }}><div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><Renderer p={p} pal={pal} /></div></AbsoluteFill>;
};

const familyCast = (variant: TimelineHistoryVariant): ComponentType<Record<string, unknown>> => (props) => (
  <TimelineHistory {...(props as unknown as TimelineHistoryProps)} variant={variant} />
);

export const FAMILY_COMPONENTS: Record<string, ComponentType<Record<string, unknown>>> = {
  "timeline-history-horizontal-era": familyCast("horizontal-era"),
  "timeline-history-vertical-milestones": familyCast("vertical-milestones"),
  "timeline-history-zoom-century": familyCast("zoom-century"),
  "timeline-history-founder-story": familyCast("founder-story"),
  "timeline-history-product-evolution": familyCast("product-evolution"),
  "timeline-history-before-during-after": familyCast("before-during-after"),
  "timeline-history-parallel-timelines": familyCast("parallel-timelines"),
  "timeline-history-anniversary-count": familyCast("anniversary-count"),
  "timeline-history-future-roadmap": familyCast("future-roadmap"),
  "timeline-history-event-scrub": familyCast("event-scrub"),
};
