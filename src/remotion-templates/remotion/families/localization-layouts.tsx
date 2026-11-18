import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FadeEdges, clampInterp, resolvePalette, type Palette } from "../lib/primitives";

/**
 * FAMILY: localization-layouts
 * Production-minded examples for language expansion, RTL ordering, script fallback,
 * subtitle stacks, locale switching, and locale-specific formatting.
 */
type LocalizationVariant =
  | "text-expansion"
  | "rtl-layout"
  | "dual-language"
  | "cjk-fallback"
  | "long-german"
  | "short-japanese"
  | "arabic-ui"
  | "subtitle-stack"
  | "locale-switch"
  | "currency-locale";

type Direction = "ltr" | "rtl" | "auto";

export interface LocalizationLayoutsProps {
  variant: LocalizationVariant;
  headline: string;
  body: string;
  sourceText: string;
  primaryLabel: string;
  secondaryLabel: string;
  paletteName: string;
  locale: string;
  locales: string[];
  direction: Direction;
  fontFallbacks?: string[];
  currencyCode: string;
  amount: number;
  dateValue: string;
  dateFormat: string;
  localizedStrings?: Record<string, string>;
  subtitleLines?: string[];
  cjkText?: string;
  arabicText?: string;
  accentColor?: string;
  layout?: "wide" | "compact" | "stacked";
  imageUrl?: string;
}

const SANS = 'Arial, "Helvetica Neue", "Noto Sans", sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const RTL_LOCALES = /^(ar|fa|he|ur)([-_]|$)/i;

const text = (p: LocalizationLayoutsProps, key: string, fallback: string): string =>
  p.localizedStrings?.[key] ?? fallback;

const languageName = (locale: string): string => {
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(locale.split(/[-_]/)[0]) ?? locale;
  } catch {
    return locale;
  }
};

const resolvedDirection = (p: LocalizationLayoutsProps): "ltr" | "rtl" => {
  if (p.direction === "rtl") return "rtl";
  if (p.direction === "ltr") return "ltr";
  return RTL_LOCALES.test(p.locale) ? "rtl" : "ltr";
};

const fontStack = (p: LocalizationLayoutsProps): string =>
  [...(p.fontFallbacks ?? []), SANS].join(", ");

const formatMoney = (amount: number, currency: string, locale: string): string => {
  try {
    return new Intl.NumberFormat(locale || "en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency || "USD"} ${amount.toFixed(2)}`;
  }
};

const formatDate = (value: string, locale: string, dateFormat: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  try {
    const options: Intl.DateTimeFormatOptions = dateFormat === "long"
      ? { year: "numeric", month: "long", day: "numeric" }
      : dateFormat === "short"
        ? { year: "2-digit", month: "2-digit", day: "2-digit" }
        : { year: "numeric", month: "short", day: "numeric" };
    return new Intl.DateTimeFormat(locale || "en-US", options).format(date);
  } catch {
    return value;
  }
};

const Backdrop: React.FC<{
  p: LocalizationLayoutsProps;
  pal: Palette;
  children: React.ReactNode;
  dark?: boolean;
}> = ({ p, pal, children, dark = false }) => {
  const frame = useCurrentFrame();
  const bg = dark ? pal.bg : pal.bg === "#0a0a12" ? "#f7f8fb" : pal.bg;
  const fg = dark ? pal.text : pal.text;
  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        background: bg,
        color: fg,
        fontFamily: fontStack(p),
        direction: resolvedDirection(p),
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.16,
          backgroundImage: `linear-gradient(${fg}18 1px, transparent 1px), linear-gradient(90deg, ${fg}18 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
          transform: `translate(${(frame % 48) - 48}px, ${(frame * 0.35) % 48 - 48}px)`,
        }}
      />
      <div style={{ position: "absolute", top: -280, right: -150, width: 720, height: 720, borderRadius: "50%", background: `${p.accentColor ?? pal.accent}18`, filter: "blur(8px)" }} />
      {children}
    </AbsoluteFill>
  );
};

const Header: React.FC<{ p: LocalizationLayoutsProps; pal: Palette; kicker: string; dark?: boolean }> = ({ p, pal, kicker, dark = false }) => {
  const fg = dark ? pal.text : pal.text;
  return (
    <div style={{ position: "absolute", top: 58, left: 92, right: 92, display: "flex", justifyContent: "space-between", alignItems: "center", color: fg, fontFamily: SANS }}>
      <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: ".24em", textTransform: "uppercase" }}>{kicker}</div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 14, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", opacity: .72 }}>
        <span>{p.locale || "en-US"}</span>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.accentColor ?? pal.accent }} />
        <span>{resolvedDirection(p).toUpperCase()}</span>
      </div>
    </div>
  );
};

const Label: React.FC<{ children: React.ReactNode; pal: Palette; color?: string }> = ({ children, pal, color }) => (
  <div style={{ color: color ?? pal.accent, font: `800 15px ${SANS}`, letterSpacing: ".2em", textTransform: "uppercase" }}>{children}</div>
);

const TextExpansion: React.FC<{ p: LocalizationLayoutsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const left = clampInterp(frame, [8, 28], [0, 1]);
  const right = clampInterp(frame, [18, 38], [0, 1]);
  const localized = text(p, "expanded", p.body);
  return (
    <Backdrop p={p} pal={pal}>
      <Header p={p} pal={pal} kicker="Localization / 01" />
      <div style={{ position: "absolute", left: 94, right: 94, top: 178 }}>
        <Label pal={pal}>Text expansion test</Label>
        <div style={{ marginTop: 18, font: `800 68px/1 ${SANS}`, letterSpacing: "-.06em", maxWidth: 1080 }}>{p.headline}</div>
        <div style={{ marginTop: 38, display: "grid", gridTemplateColumns: "1fr 1.32fr", gap: 18 }}>
          {[
            { title: "SOURCE / EN", value: p.sourceText, progress: left, color: pal.primary },
            { title: `TRANSLATED / ${p.locale.toUpperCase()}`, value: localized, progress: right, color: p.accentColor ?? pal.accent },
          ].map((item) => (
            <div key={item.title} style={{ minHeight: 300, padding: 30, border: `1px solid ${pal.text}35`, borderRadius: 18, background: `${pal.text}08`, opacity: item.progress, transform: `translateY(${(1 - item.progress) * 35}px)` }}>
              <div style={{ color: item.color, font: `800 15px ${SANS}`, letterSpacing: ".16em" }}>{item.title}</div>
              <div style={{ marginTop: 30, font: `600 34px/1.22 ${SANS}`, overflowWrap: "anywhere" }}>{item.value}</div>
              <div style={{ marginTop: 36, height: 8, borderRadius: 8, background: `${pal.text}20` }}><div style={{ width: `${Math.min(100, 42 + item.value.length * 1.5)}%`, height: "100%", borderRadius: 8, background: item.color }} /></div>
              <div style={{ marginTop: 10, color: `${pal.text}88`, font: `12px ${MONO}` }}>{item.value.length} characters · expansion aware</div>
            </div>
          ))}
        </div>
      </div>
    </Backdrop>
  );
};

const RtlLayout: React.FC<{ p: LocalizationLayoutsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const progress = clampInterp(frame, [8, 30], [0, 1]);
  const rtl = { direction: "rtl" as const, textAlign: "right" as const };
  return (
    <Backdrop p={p} pal={pal} dark>
      <Header p={p} pal={pal} kicker="Localization / 02" dark />
      <div style={{ position: "absolute", left: 105, right: 105, top: 174, opacity: progress, transform: `translateX(${(1 - progress) * (resolvedDirection(p) === "rtl" ? 70 : -70)}px)` }}>
        <Label pal={pal}>RTL layout mirror</Label>
        <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between", alignItems: "end" }}>
          <div style={{ font: `800 68px/1 ${SANS}`, letterSpacing: "-.06em", maxWidth: 900 }}>{p.headline}</div>
          <div style={{ padding: "12px 16px", borderRadius: 99, background: `${p.accentColor ?? pal.accent}22`, color: p.accentColor ?? pal.accent, font: `800 15px ${MONO}` }}>dir = rtl</div>
        </div>
        <div style={{ marginTop: 48, display: "grid", gridTemplateColumns: "1fr 1.35fr", gap: 18 }}>
          <div style={{ padding: 30, border: `1px solid ${pal.text}35`, borderRadius: 18, background: `${pal.text}08`, ...rtl }}>
            <div style={{ color: pal.accent, font: `800 15px ${SANS}` }}>واجهة مترجمة</div>
            <div style={{ marginTop: 24, font: `600 38px/1.3 ${SANS}` }}>{p.arabicText ?? "تجربة واضحة لكل لغة"}</div>
            <div style={{ marginTop: 32, color: `${pal.text}88`, font: `18px/1.5 ${SANS}` }}>{p.body}</div>
          </div>
          <div style={{ padding: 30, borderRadius: 18, background: `${pal.primary}30`, ...rtl }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexDirection: "row-reverse", alignItems: "center", font: `800 18px ${SANS}` }}><span>القائمة</span><span style={{ color: pal.accent }}>←</span></div>
            {["الرئيسية", "الميزات", "الأسعار", "تواصل معنا"].map((item, i) => <div key={item} style={{ display: "flex", justifyContent: "space-between", flexDirection: "row-reverse", padding: "19px 0", borderBottom: `1px solid ${pal.text}20`, opacity: clampInterp(frame, [18 + i * 5, 32 + i * 5], [0, 1]), font: `600 24px ${SANS}` }}><span>{item}</span><span style={{ color: pal.accent }}>0{i + 1}</span></div>)}
          </div>
        </div>
      </div>
    </Backdrop>
  );
};

const DualLanguage: React.FC<{ p: LocalizationLayoutsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const lines = p.subtitleLines?.length ? p.subtitleLines : [p.body, "A clear message should survive every translation."];
  return (
    <Backdrop p={p} pal={pal}>
      <Header p={p} pal={pal} kicker="Localization / 03" />
      <div style={{ position: "absolute", left: 108, right: 108, top: 180 }}>
        <Label pal={pal}>Dual-language composition</Label>
        <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, borderTop: `1px solid ${pal.text}45`, borderBottom: `1px solid ${pal.text}45` }}>
          {[{ code: "EN", value: p.sourceText }, { code: (p.locales?.[1] ?? p.locale).toUpperCase(), value: lines[0] }].map((item, i) => (
            <div key={item.code} style={{ minHeight: 470, padding: "40px 42px", borderLeft: i === 1 ? `1px solid ${pal.text}35` : undefined, opacity: clampInterp(frame, [8 + i * 8, 25 + i * 8], [0, 1]), transform: `translateY(${(1 - clampInterp(frame, [8 + i * 8, 25 + i * 8], [0, 1])) * 50}px)`, direction: i === 1 ? resolvedDirection(p) : "ltr" }}>
              <div style={{ color: i === 0 ? pal.primary : pal.accent, font: `800 16px ${MONO}`, letterSpacing: ".2em" }}>{item.code}</div>
              <div style={{ marginTop: 68, font: `700 ${i === 0 ? 47 : 43}px/1.17 ${SANS}`, overflowWrap: "anywhere" }}>{item.value}</div>
              <div style={{ position: "absolute", bottom: 38, left: 42, right: 42, height: 5, background: i === 0 ? pal.primary : pal.accent }} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 30, color: `${pal.text}88`, font: `18px ${SANS}` }}>{p.headline} · {lines.length} synchronized subtitle lines</div>
      </div>
    </Backdrop>
  );
};

const CjkFallback: React.FC<{ p: LocalizationLayoutsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const chars = Array.from(p.cjkText ?? "多言語のデザイン").slice(0, 9);
  return (
    <Backdrop p={p} pal={pal} dark>
      <Header p={p} pal={pal} kicker="Localization / 04" dark />
      <div style={{ position: "absolute", left: 105, right: 105, top: 178 }}>
        <Label pal={pal}>CJK fallback specimen</Label>
        <div style={{ marginTop: 22, font: `800 64px/1 ${SANS}`, letterSpacing: "-.05em" }}>{p.headline}</div>
        <div style={{ marginTop: 42, display: "flex", gap: 16, alignItems: "stretch", justifyContent: "center" }}>
          {chars.map((char, i) => { const t = clampInterp(frame, [8 + i * 3, 21 + i * 3], [0, 1]); return <div key={`${char}-${i}`} style={{ width: 118, height: 220, border: `1px solid ${pal.text}35`, borderRadius: 14, background: i % 2 ? `${pal.primary}25` : `${pal.accent}18`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: t, transform: `translateY(${(1 - t) * 40}px)` }}><div style={{ font: `500 68px/1 "Noto Sans CJK SC", "Noto Sans JP", ${SANS}` }}>{char}</div><div style={{ marginTop: 24, color: `${pal.text}88`, font: `11px ${MONO}` }}>glyph {String(i + 1).padStart(2, "0")}</div></div>; })}
        </div>
        <div style={{ marginTop: 30, padding: "17px 22px", borderRadius: 10, background: `${pal.text}10`, color: `${pal.text}aa`, font: `16px ${MONO}` }}>fallback stack → {(p.fontFallbacks ?? ["Noto Sans CJK", "Arial Unicode"]).join(" → ")}</div>
      </div>
    </Backdrop>
  );
};

const LongGerman: React.FC<{ p: LocalizationLayoutsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const progress = clampInterp(frame, [7, 28], [0, 1]);
  const german = text(p, "de", "Die verständliche Gestaltung mehrsprachiger Produktinformationen");
  // German compounds are deliberately long, so keep both the headline and the
  // translated specimen inside a measurable column instead of relying on a
  // single fixed display size that can push glyphs past the right safe edge.
  const headingSize = german.length > 48 ? 48 : 60;
  const copySize = german.length > 56 ? 34 : german.length > 42 ? 38 : 43;
  return (
    <Backdrop p={p} pal={pal}>
      <Header p={p} pal={pal} kicker="Localization / 05" />
      <div style={{ position: "absolute", left: 112, top: 180, width: 1040, maxWidth: "calc(100% - 224px)", opacity: progress, transform: `translateY(${(1 - progress) * 48}px)` }}>
        <Label pal={pal}>Long German compound test</Label>
        <div style={{ marginTop: 23, maxWidth: 1040, font: `800 ${headingSize}px/1.05 ${SANS}`, letterSpacing: "-.055em", overflowWrap: "anywhere" }}>Wenn Worte länger werden</div>
        <div style={{ marginTop: 45, maxWidth: "100%", padding: 38, boxSizing: "border-box", borderRadius: 18, background: `${pal.primary}16`, border: `1px solid ${pal.primary}45`, direction: "ltr" }}>
          <div style={{ color: pal.primary, font: `800 15px ${MONO}`, letterSpacing: ".15em" }}>DE-DE / EXPANSION CASE</div>
          <div style={{ marginTop: 24, maxWidth: "100%", font: `700 ${copySize}px/1.18 ${SANS}`, overflowWrap: "anywhere", wordBreak: "break-word" }}>{german}</div>
          <div style={{ marginTop: 28, maxWidth: "100%", color: `${pal.text}99`, font: `18px/1.4 ${SANS}`, overflowWrap: "anywhere" }}>{p.body}</div>
        </div>
        <div style={{ marginTop: 28, display: "flex", gap: 12, alignItems: "center", font: `14px ${MONO}` }}><span style={{ color: pal.primary }}>SAFE</span><div style={{ flex: 1, minWidth: 0, height: 8, background: `${pal.text}18`, borderRadius: 8 }}><div style={{ width: `${Math.min(100, 38 + german.length * .85)}%`, height: "100%", background: pal.primary, borderRadius: 8 }} /></div><span style={{ whiteSpace: "nowrap" }}>{german.length} chars</span></div>
      </div>
    </Backdrop>
  );
};

const ShortJapanese: React.FC<{ p: LocalizationLayoutsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const progress = clampInterp(frame, [6, 32], [0, 1]);
  return (
    <Backdrop p={p} pal={pal} dark>
      <Header p={p} pal={pal} kicker="Localization / 06" dark />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", opacity: progress, transform: `scale(${.92 + progress * .08})` }}>
        <div>
          <div style={{ color: pal.accent, font: `800 15px ${MONO}`, letterSpacing: ".3em" }}>JA-JP / SHORT COPY</div>
          <div style={{ marginTop: 28, font: `500 120px/1.15 "Noto Sans JP", "Hiragino Kaku Gothic ProN", ${SANS}`, letterSpacing: ".08em" }}>{p.cjkText ?? "未来をつくる"}</div>
          <div style={{ marginTop: 34, color: `${pal.text}99`, font: `24px ${SANS}` }}>{p.headline} · {p.primaryLabel}</div>
          <div style={{ marginTop: 44, display: "inline-flex", padding: "12px 22px", border: `1px solid ${pal.text}55`, borderRadius: 999, font: `700 14px ${MONO}` }}>短い言葉 / MORE SPACE</div>
        </div>
      </div>
    </Backdrop>
  );
};

const ArabicUi: React.FC<{ p: LocalizationLayoutsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const progress = clampInterp(frame, [8, 30], [0, 1]);
  const arabic = p.arabicText ?? "اكتشف تجربة أبسط";
  return (
    <Backdrop p={p} pal={pal}>
      <Header p={p} pal={pal} kicker="Localization / 07" />
      <div style={{ position: "absolute", left: 120, right: 120, top: 174, opacity: progress }}>
        <Label pal={pal}>Arabic interface direction</Label>
        <div style={{ marginTop: 25, display: "flex", flexDirection: "row-reverse", gap: 24, alignItems: "stretch", direction: "rtl" }}>
          <div style={{ flex: 1, minHeight: 470, padding: 38, borderRadius: 20, background: `${pal.primary}20`, border: `1px solid ${pal.primary}55`, textAlign: "right" }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexDirection: "row-reverse", alignItems: "center", font: `800 18px ${SANS}` }}><span>{p.primaryLabel}</span><span style={{ width: 32, height: 32, borderRadius: 10, background: pal.accent }} /></div>
            <div style={{ marginTop: 65, font: `600 50px/1.18 "Noto Sans Arabic", "Geeza Pro", ${SANS}` }}>{arabic}</div>
            <div style={{ marginTop: 25, color: `${pal.text}99`, font: `22px/1.45 ${SANS}` }}>{p.body}</div>
            <div style={{ marginTop: 35, display: "inline-flex", padding: "14px 24px", borderRadius: 10, color: pal.bg, background: pal.accent, font: `800 18px ${SANS}` }}>{p.secondaryLabel} ←</div>
          </div>
          <div style={{ width: 260, padding: 26, borderRadius: 20, background: `${pal.text}10`, textAlign: "right", direction: "rtl" }}>
            <div style={{ color: pal.accent, font: `800 14px ${MONO}` }}>قائمة التنقل</div>
            {["الرئيسية", "المميزات", "الأسعار", "الدعم"].map((item, i) => <div key={item} style={{ padding: "18px 0", borderBottom: `1px solid ${pal.text}20`, font: `600 20px ${SANS}`, opacity: clampInterp(frame, [14 + i * 4, 25 + i * 4], [0, 1]) }}>{item}</div>)}
          </div>
        </div>
      </div>
    </Backdrop>
  );
};

const SubtitleStack: React.FC<{ p: LocalizationLayoutsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const lines = p.subtitleLines?.length ? p.subtitleLines : [p.sourceText, p.body, text(p, "translated", "Your message, in every language.")];
  return (
    <Backdrop p={p} pal={pal} dark>
      <Header p={p} pal={pal} kicker="Localization / 08" dark />
      <div style={{ position: "absolute", left: 170, right: 170, top: 158, bottom: 110, borderRadius: 22, overflow: "hidden", background: p.imageUrl ? `url(${p.imageUrl}) center/cover` : `linear-gradient(135deg, ${pal.primary}85, ${pal.secondary}36 50%, ${pal.bg})`, border: `1px solid ${pal.text}35` }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 35%, #0009 100%)" }} />
        <div style={{ position: "absolute", left: 42, right: 42, bottom: 38, textAlign: "center" }}>
          {lines.slice(0, 3).map((line, i) => { const t = clampInterp(frame, [10 + i * 7, 24 + i * 7], [0, 1]); return <div key={`${line}-${i}`} style={{ marginTop: i ? 9 : 0, color: "#fff", textShadow: "0 2px 8px #000", font: `${i === 0 ? 700 : 500} ${i === 0 ? 36 : 25}px/1.18 ${SANS}`, opacity: t, transform: `translateY(${(1 - t) * 24}px)` }}>{line}</div>; })}
          <div style={{ marginTop: 20, color: pal.accent, font: `800 12px ${MONO}`, letterSpacing: ".18em" }}>{p.locale.toUpperCase()} · {resolvedDirection(p).toUpperCase()} · SUBTITLE STACK</div>
        </div>
      </div>
    </Backdrop>
  );
};

const LocaleSwitch: React.FC<{ p: LocalizationLayoutsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const locales = (p.locales?.length ? p.locales : ["en-US", "de-DE", "ja-JP"]).slice(0, 3);
  const active = Math.min(locales.length - 1, Math.floor(clampInterp(frame, [14, 105], [0, locales.length - .01])));
  const current = locales[active] ?? p.locale;
  const copy = [p.sourceText, text(p, "de", "Eine klare Botschaft für jedes Publikum."), p.cjkText ?? "すべての人へ"];
  return (
    <Backdrop p={p} pal={pal}>
      <Header p={p} pal={pal} kicker="Localization / 09" />
      <div style={{ position: "absolute", left: 130, right: 130, top: 192 }}>
        <Label pal={pal}>Locale switch / same layout</Label>
        <div style={{ marginTop: 25, display: "flex", gap: 12 }}>{locales.map((locale, i) => <div key={locale} style={{ padding: "12px 17px", borderRadius: 10, color: i === active ? pal.bg : pal.text, background: i === active ? pal.accent : `${pal.text}14`, font: `800 15px ${MONO}` }}>{locale}</div>)}</div>
        <div style={{ marginTop: 28, minHeight: 360, padding: 48, borderRadius: 20, background: `${pal.primary}18`, border: `1px solid ${pal.text}35`, direction: RTL_LOCALES.test(current) ? "rtl" : "ltr", textAlign: RTL_LOCALES.test(current) ? "right" : "left" }}>
          <div style={{ color: pal.accent, font: `800 16px ${MONO}` }}>{languageName(current)} / {current}</div>
          <div style={{ marginTop: 33, font: `800 58px/1.05 ${SANS}`, letterSpacing: "-.055em" }}>{copy[active] ?? p.headline}</div>
          <div style={{ marginTop: 24, color: `${pal.text}99`, font: `22px/1.4 ${SANS}` }}>{p.body}</div>
        </div>
        <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", color: `${pal.text}88`, font: `14px ${MONO}` }}><span>frame {String(frame).padStart(3, "0")}</span><span>layout stable · copy swapped</span></div>
      </div>
    </Backdrop>
  );
};

const CurrencyLocale: React.FC<{ p: LocalizationLayoutsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const progress = clampInterp(frame, [8, 30], [0, 1]);
  const locales = (p.locales?.length ? p.locales : ["en-US", "de-DE", "ja-JP"]).slice(0, 3);
  const amount = Number.isFinite(p.amount) ? p.amount : 1299;
  return (
    <Backdrop p={p} pal={pal} dark>
      <Header p={p} pal={pal} kicker="Localization / 10" dark />
      <div style={{ position: "absolute", left: 110, right: 110, top: 180 }}>
        <Label pal={pal}>Currency + date formatting</Label>
        <div style={{ marginTop: 21, font: `800 64px/1 ${SANS}`, letterSpacing: "-.06em" }}>{p.headline}</div>
        <div style={{ marginTop: 42, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {locales.map((locale, i) => { const t = clampInterp(frame, [9 + i * 7, 26 + i * 7], [0, 1]); return <div key={locale} style={{ padding: 27, minHeight: 265, borderRadius: 16, border: `1px solid ${pal.text}35`, background: `${pal.text}08`, opacity: t, transform: `translateY(${(1 - t) * 35}px)` }}><div style={{ color: i === 1 ? pal.accent : pal.secondary, font: `800 15px ${MONO}` }}>{locale}</div><div style={{ marginTop: 34, font: `800 48px/1 ${SANS}`, letterSpacing: "-.055em" }}>{formatMoney(amount, i === 2 ? "JPY" : i === 1 ? "EUR" : p.currencyCode, locale)}</div><div style={{ marginTop: 28, color: `${pal.text}99`, font: `18px ${SANS}` }}>{formatDate(p.dateValue, locale, p.dateFormat)}</div></div>; })}
        </div>
        <div style={{ marginTop: 30, color: `${pal.text}88`, font: `15px ${MONO}` }}>same amount · locale-aware currency · locale-aware date</div>
      </div>
    </Backdrop>
  );
};

const VARIANTS: Record<LocalizationVariant, React.FC<{ p: LocalizationLayoutsProps; pal: Palette }>> = {
  "text-expansion": TextExpansion,
  "rtl-layout": RtlLayout,
  "dual-language": DualLanguage,
  "cjk-fallback": CjkFallback,
  "long-german": LongGerman,
  "short-japanese": ShortJapanese,
  "arabic-ui": ArabicUi,
  "subtitle-stack": SubtitleStack,
  "locale-switch": LocaleSwitch,
  "currency-locale": CurrencyLocale,
};

export const LocalizationLayoutsTemplate: React.FC<LocalizationLayoutsProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? TextExpansion;
  return <FadeEdges inFrames={10} outFrames={12}><Variant p={props} pal={pal} /></FadeEdges>;
};

const familyCast = (component: React.FC<LocalizationLayoutsProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "localization-layouts-text-expansion": familyCast(LocalizationLayoutsTemplate),
  "localization-layouts-rtl-layout": familyCast(LocalizationLayoutsTemplate),
  "localization-layouts-dual-language": familyCast(LocalizationLayoutsTemplate),
  "localization-layouts-cjk-fallback": familyCast(LocalizationLayoutsTemplate),
  "localization-layouts-long-german": familyCast(LocalizationLayoutsTemplate),
  "localization-layouts-short-japanese": familyCast(LocalizationLayoutsTemplate),
  "localization-layouts-arabic-ui": familyCast(LocalizationLayoutsTemplate),
  "localization-layouts-subtitle-stack": familyCast(LocalizationLayoutsTemplate),
  "localization-layouts-locale-switch": familyCast(LocalizationLayoutsTemplate),
  "localization-layouts-currency-locale": familyCast(LocalizationLayoutsTemplate),
};
