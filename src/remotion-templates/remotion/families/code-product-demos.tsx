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
  seededRand,
  type Palette,
} from "../lib/primitives";

/**
 * FAMILY: code-product-demos
 * Ten deterministic, asset-free developer-product storytelling systems.
 * Pass codeLines/output/command to replace the procedural examples.
 */
type CodeProductVariant =
  | "terminal-command"
  | "code-type-on"
  | "diff-review"
  | "error-to-fix"
  | "api-response"
  | "log-stream"
  | "split-editor"
  | "test-pass"
  | "deploy-pipeline"
  | "code-to-preview";

export interface CodeProductDemosProps {
  variant: CodeProductVariant;
  title: string;
  subtitle: string;
  paletteName: string;
  language?: string;
  command?: string;
  codeLines?: string[];
  output?: string[];
  highlights?: number[];
  cursor?: boolean;
  lineNumbers?: boolean;
  theme?: "dark" | "light";
  accentLabel?: string;
  error?: string;
  steps?: string[];
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';

const DEFAULT_CODE = [
  "const result = await workflow.run({",
  '  input: "campaign-brief",',
  "  retries: 2,",
  "});",
  "return result.output;",
];
const DEFAULT_OUTPUT = [
  "✓ connected to workflow runtime",
  "✓ received structured result",
  "done in 1.42s",
];
const DEFAULT_LOGS = [
  "15:42:01  INFO   booting preview server",
  "15:42:02  INFO   loaded 12 composition modules",
  "15:42:03  DEBUG  compiling responsive layout",
  "15:42:04  INFO   assets resolved from local cache",
  "15:42:05  WARN   fallback font selected",
  "15:42:06  INFO   render completed successfully",
  "15:42:07  INFO   ready on localhost:3000",
  "15:42:08  INFO   watching for changes",
];

const splitText = (value: string, fallback: string[]): string[] => {
  const items = value.split("|").map((item) => item.trim()).filter(Boolean);
  return items.length ? items : fallback;
};

const ProgressLabel: React.FC<{ pal: Palette; label: string; frame: number; delay?: number }> = ({ pal, label, frame, delay = 0 }) => {
  const opacity = clampInterp(frame, [delay, delay + 16], [0, 1]);
  return (
    <div style={{ opacity, color: pal.accent, font: `800 15px ${MONO}`, letterSpacing: "0.18em", textTransform: "uppercase" }}>
      {label}
    </div>
  );
};

const Intro: React.FC<{ pal: Palette; p: CodeProductDemosProps; align?: "left" | "center"; compact?: boolean }> = ({ pal, p, align = "left", compact = false }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const opacity = clampInterp(frame, [3, 22], [0, 1]);
  const titleSize = compact ? Math.max(30, Math.min(42, width * 0.052)) : 68;
  const subtitleSize = compact ? Math.max(14, Math.min(19, width * 0.023)) : 24;
  return (
    <div style={{ color: pal.text, textAlign: align, fontFamily: FONT, opacity, transform: `translateY(${clampInterp(frame, [3, 22], [24, 0])}px)`, minWidth: 0 }}>
      <div style={{ color: pal.accent, font: `800 ${compact ? Math.max(11, width * 0.016) : 16}px ${MONO}`, letterSpacing: "0.22em", textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.accentLabel ?? "DEVELOPER WORKFLOW"}</div>
      <div style={{ marginTop: compact ? 8 : 15, fontSize: titleSize, lineHeight: 0.98, fontWeight: 900, letterSpacing: "-0.06em", maxWidth: "100%" }}>{p.title}</div>
      <div style={{ marginTop: compact ? 10 : 18, maxWidth: align === "center" ? 780 : 540, color: `${pal.text}aa`, fontSize: subtitleSize, lineHeight: 1.35, overflowWrap: "anywhere" }}>{p.subtitle}</div>
    </div>
  );
};

const WindowDots: React.FC<{ pal: Palette; title: string; light?: boolean }> = ({ pal, title, light = false }) => (
  <div style={{ height: 50, padding: "0 18px", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 8, background: light ? "#f3f5f7" : `${pal.text}0c`, borderBottom: `1px solid ${light ? "#c9d0d8" : `${pal.text}20`}`, fontFamily: MONO }}>
    {["#ff5f57", "#ffbd2e", "#28c840"].map((color) => <span key={color} style={{ width: 10, height: 10, borderRadius: 10, background: color }} />)}
    <span style={{ marginLeft: 12, color: light ? "#506070" : `${pal.text}70`, fontSize: 13 }}>{title}</span>
  </div>
);

const SyntaxLine: React.FC<{ line: string; index: number; pal: Palette; highlighted?: boolean; light?: boolean; lineNumbers?: boolean }> = ({ line, index, pal, highlighted = false, light = false, lineNumbers = true }) => {
  const base = light ? "#192631" : pal.text;
  const muted = light ? "#82909a" : `${pal.text}55`;
  const keyword = light ? "#7a3b9b" : pal.secondary;
  const stringColor = light ? "#1e765c" : "#9ee493";
  const numberColor = light ? "#a25e17" : pal.accent;
  const pieces = line.split(/(\"[^\"]*\"|'[^']*'|\b(?:const|return|await|async|import|from|export|new|if|else|true|false)\b|\b\d+(?:\.\d+)?\b)/g);
  return (
    <div style={{ minHeight: 30, display: "flex", alignItems: "center", padding: "0 16px", boxSizing: "border-box", background: highlighted ? `${pal.accent}${light ? "18" : "20"}` : "transparent", borderLeft: highlighted ? `3px solid ${pal.accent}` : "3px solid transparent", font: `500 17px/1.55 ${MONO}`, whiteSpace: "pre" }}>
      {lineNumbers && <span style={{ width: 34, marginRight: 17, textAlign: "right", color: muted, fontSize: 14, userSelect: "none" }}>{String(index + 1).padStart(2, "0")}</span>}
      <span>{pieces.map((piece, i) => {
        const isString = /^['\"]/.test(piece);
        const isKeyword = /^(const|return|await|async|import|from|export|new|if|else|true|false)$/.test(piece);
        const isNumber = /^\d/.test(piece);
        return <span key={`${index}-${i}`} style={{ color: isString ? stringColor : isKeyword ? keyword : isNumber ? numberColor : base }}>{piece}</span>;
      })}</span>
    </div>
  );
};

const CodeWindow: React.FC<{ pal: Palette; lines: string[]; title?: string; highlighted?: number[]; light?: boolean; lineNumbers?: boolean; topLabel?: string }> = ({ pal, lines, title = "main.ts", highlighted = [], light = false, lineNumbers = true, topLabel }) => (
  <div style={{ width: "100%", height: "100%", overflow: "hidden", borderRadius: 16, background: light ? "#fbfcfd" : "#11151c", border: `1px solid ${light ? "#cbd3da" : `${pal.text}30`}`, boxShadow: `0 28px 70px ${pal.bg}aa`, fontFamily: MONO }}>
    <WindowDots pal={pal} title={topLabel ?? title} light={light} />
    <div style={{ paddingTop: 14 }}>{lines.map((line, i) => <SyntaxLine key={`${i}-${line}`} line={line} index={i} pal={pal} highlighted={highlighted.includes(i + 1)} light={light} lineNumbers={lineNumbers} />)}</div>
  </div>
);

const TerminalWindow: React.FC<{ pal: Palette; command: string; output: string[]; progress?: number; light?: boolean }> = ({ pal, command, output, progress = 1, light = false }) => {
  const visibleOutput = output.slice(0, Math.max(0, Math.ceil(output.length * progress)));
  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden", borderRadius: 16, background: light ? "#fbfcfd" : "#0d1117", border: `1px solid ${light ? "#cbd3da" : `${pal.text}30`}`, boxShadow: `0 28px 70px ${pal.bg}aa`, color: light ? "#192631" : pal.text, font: `500 19px/1.65 ${MONO}` }}>
      <WindowDots pal={pal} title="terminal" light={light} />
      <div style={{ padding: 28 }}>
        <div><span style={{ color: pal.accent }}>❯</span> <span>{command}</span><span style={{ display: "inline-block", width: 9, height: 22, marginLeft: 7, verticalAlign: "-4px", background: pal.accent, opacity: 0.85 }} /></div>
        <div style={{ marginTop: 18, color: light ? "#506070" : `${pal.text}a8` }}>{visibleOutput.map((line, i) => <div key={`${i}-${line}`} style={{ color: /^✓|PASS|done|success/i.test(line) ? (light ? "#16825a" : "#65e6a4") : undefined }}>{line}</div>)}</div>
      </div>
    </div>
  );
};

const TerminalCommand: React.FC<{ p: CodeProductDemosProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const progress = clampInterp(frame, [22, 80], [0, 1]);
  return <AbsoluteFill style={{ padding: "82px 105px", boxSizing: "border-box", display: "flex", gap: 72, alignItems: "center" }}>
    <div style={{ width: "44%", minWidth: 0 }}><Intro pal={pal} p={p} /><div style={{ marginTop: 30, color: `${pal.text}72`, font: `14px ${MONO}` }}>LOCAL / REPRODUCIBLE / TRACEABLE</div></div>
    <div style={{ flex: 1, height: 580, transform: `translateY(${clampInterp(frame, [0, 25], [80, 0])}px)` }}><TerminalWindow pal={pal} command={p.command ?? "npm run build:preview"} output={p.output ?? DEFAULT_OUTPUT} progress={progress} light={p.theme === "light"} /></div>
  </AbsoluteFill>;
};

const CodeTypeOn: React.FC<{ p: CodeProductDemosProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const lines = p.codeLines?.length ? p.codeLines : DEFAULT_CODE;
  const count = Math.min(lines.length, Math.floor(clampInterp(frame, [18, 96], [0, lines.length + 1])));
  const visible = lines.slice(0, count);
  return <AbsoluteFill style={{ padding: "76px 110px", boxSizing: "border-box" }}>
    <div style={{ width: 700 }}><Intro pal={pal} p={p} /><div style={{ marginTop: 28, color: `${pal.text}72`, font: `14px ${MONO}` }}>{p.language ?? "TYPESCRIPT"} / LIVE TYPING</div></div>
    <div style={{ position: "absolute", left: 760, right: 110, top: 170, height: 620 }}><CodeWindow pal={pal} lines={visible.length ? visible : [" "]} highlighted={p.highlights} lineNumbers={p.lineNumbers !== false} title={`src/${p.language?.toLowerCase() ?? "workflow"}.ts`} /></div>
    <div style={{ position: "absolute", left: 792, bottom: 92, color: pal.secondary, font: `700 14px ${MONO}` }}>{String(count).padStart(2, "0")} / {String(lines.length).padStart(2, "0")} LINES <span style={{ color: `${pal.text}55` }}>•</span> <span style={{ display: "inline-block", width: 8, height: 16, background: pal.accent, verticalAlign: "-3px" }} /></div>
  </AbsoluteFill>;
};

const DiffReview: React.FC<{ p: CodeProductDemosProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const compact = width < 1200 || height < 700;
  const lines = p.codeLines?.length ? p.codeLines : DEFAULT_CODE;
  const oldLines = lines.map((line, i) => i === 2 ? "  retries: 0," : line);
  const padX = compact ? Math.max(36, width * 0.06) : 118;
  const panelTop = compact ? Math.max(232, height * 0.56) : 328;
  const panelHeight = compact ? Math.min(174, Math.max(154, height * 0.37)) : 500;
  const rowHeight = compact ? Math.max(24, Math.min(30, (panelHeight - 28) / Math.max(5, lines.length))) : 50;
  const panelFont = compact ? Math.max(12, Math.min(15, width * 0.018)) : 18;
  return <AbsoluteFill style={{ padding: `${compact ? 34 : 72}px ${padX}px`, boxSizing: "border-box", overflow: "hidden" }}>
    <div style={{ maxWidth: compact ? width - padX * 2 : 1120, minWidth: 0 }}><Intro pal={pal} p={p} compact={compact} /></div>
    <div style={{ position: "absolute", left: padX, right: padX, top: panelTop, height: panelHeight, display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: compact ? 10 : 22, minWidth: 0 }}>
      {[{ label: "BEFORE", rows: oldLines, tint: "#ef6a7a", sign: "−" }, { label: "AFTER", rows: lines, tint: "#65e6a4", sign: "+" }].map((pane, paneIndex) => <div key={pane.label} style={{ minWidth: 0, minHeight: 0, opacity: clampInterp(frame, [18 + paneIndex * 8, 36 + paneIndex * 8], [0, 1]) }}><div style={{ color: pane.tint, font: `800 ${compact ? 11 : 14}px ${MONO}`, letterSpacing: ".2em", marginBottom: compact ? 6 : 10 }}>{pane.sign} {pane.label}</div><div style={{ height: "calc(100% - 24px)", minHeight: 0, overflow: "hidden", borderRadius: compact ? 9 : 15, border: `1px solid ${pane.tint}55`, background: `${pane.tint}0b` }}>{pane.rows.map((line, i) => <div key={i} style={{ minHeight: rowHeight, height: rowHeight, display: "flex", alignItems: "center", gap: compact ? 7 : 12, padding: `0 ${compact ? 10 : 18}px`, boxSizing: "border-box", color: pal.text, background: `${pane.tint}${i === 2 ? "22" : "08"}`, font: `500 ${panelFont}px/${Math.max(1.25, 1.45)} ${MONO}`, overflow: "hidden" }}><span style={{ flex: "0 0 auto", color: pane.tint }}>{pane.sign}</span><span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{line}</span></div>)}</div></div>)}
    </div>
    <div style={{ position: "absolute", left: padX, right: padX, bottom: compact ? 8 : 54, color: `${pal.text}76`, font: `800 ${compact ? 10 : 14}px ${MONO}`, letterSpacing: ".08em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>REVIEW / {p.language ?? "CONFIG"} / {p.highlights?.length ?? 1} CHANGED LINES</div>
  </AbsoluteFill>;
};

const ErrorToFix: React.FC<{ p: CodeProductDemosProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const compact = width < 1200 || height < 700;
  const resolved = clampInterp(frame, [54, 90], [0, 1]);
  const lines = p.codeLines?.length ? p.codeLines : DEFAULT_CODE;
  const padX = compact ? Math.max(36, width * 0.06) : 100;
  const footerHeight = compact ? 58 : 76;
  const panelTop = compact ? Math.max(190, height * 0.44) : 310;
  const panelBottom = compact ? footerHeight + 14 : 92;
  const panelHeight = compact ? Math.max(150, height - panelTop - panelBottom - 10) : 440;
  const footerFont = compact ? Math.max(11, Math.min(14, width * 0.017)) : 17;
  return <AbsoluteFill style={{ padding: `${compact ? 34 : 70}px ${padX}px`, boxSizing: "border-box", overflow: "hidden" }}>
    <div style={{ width: "100%", maxWidth: compact ? width - padX * 2 : 690, minWidth: 0 }}><Intro pal={pal} p={p} compact={compact} /><div style={{ marginTop: compact ? 14 : 32, display: "inline-flex", maxWidth: "100%", boxSizing: "border-box", padding: compact ? "7px 11px" : "9px 14px", borderRadius: 7, color: pal.bg, background: resolved > 0.5 ? "#65e6a4" : "#ef6a7a", font: `900 ${compact ? 11 : 13}px ${MONO}`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{resolved > 0.5 ? "FIXED / BUILD PASSING" : "BLOCKED / NEEDS ATTENTION"}</div></div>
    <div style={{ position: "absolute", left: padX, right: padX, top: panelTop, height: panelHeight, minHeight: 0, overflow: "hidden" }}><CodeWindow pal={pal} lines={lines} highlighted={[2, 3]} lineNumbers={p.lineNumbers !== false} title="src/handler.ts" /></div>
    <div style={{ position: "absolute", left: padX, right: padX, bottom: compact ? 14 : 92, height: footerHeight, minHeight: 0, padding: compact ? "10px 14px" : "18px 24px", display: "flex", alignItems: "center", boxSizing: "border-box", overflow: "hidden", borderRadius: 12, background: resolved > 0.5 ? "#65e6a422" : "#ef6a7a1d", border: `1px solid ${resolved > 0.5 ? "#65e6a4" : "#ef6a7a"}`, color: pal.text, font: `600 ${footerFont}px/${compact ? 1.25 : 1.4} ${MONO}` }}><span style={{ flex: "0 0 auto", marginRight: 8, color: resolved > 0.5 ? "#65e6a4" : "#ef6a7a" }}>{resolved > 0.5 ? "✓" : "×"}</span><span style={{ minWidth: 0, overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: compact ? 2 : 3 }}>{resolved > 0.5 ? "Typecheck passed — the fix is ready to ship." : (p.error ?? "TypeError: property is missing from the input contract")}</span></div>
  </AbsoluteFill>;
};

const ApiResponse: React.FC<{ p: CodeProductDemosProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const data = p.output ?? ["status: 200", 'requestId: "req_8f3a"', 'duration: "142ms"', 'items: 24'];
  return <AbsoluteFill style={{ padding: "76px 100px", boxSizing: "border-box" }}>
    <div style={{ width: 630 }}><Intro pal={pal} p={p} /><div style={{ marginTop: 38, color: `${pal.text}6b`, font: `15px ${MONO}` }}>POST /v1/{p.command ?? "render"}</div></div>
    <div style={{ position: "absolute", left: 790, top: 150, right: 110, height: 710, borderRadius: 18, background: `${pal.text}0b`, border: `1px solid ${pal.text}26`, padding: 30, boxSizing: "border-box", fontFamily: MONO }}>
      <div style={{ display: "flex", justifyContent: "space-between", color: pal.secondary, fontSize: 15 }}><span>RESPONSE / JSON</span><span style={{ color: "#65e6a4" }}>● 200 OK</span></div>
      <div style={{ marginTop: 25, color: `${pal.text}68`, fontSize: 17 }}>{"{"}</div>
      {data.slice(0, 6).map((item, i) => { const [key, ...rest] = item.split(":"); const t = clampInterp(frame, [18 + i * 9, 34 + i * 9], [0, 1]); return <div key={item} style={{ marginLeft: 24, opacity: t, color: pal.text, fontSize: 20, lineHeight: 1.85 }}><span style={{ color: pal.secondary }}>{JSON.stringify(key.trim())}</span><span style={{ color: `${pal.text}68` }}>: </span><span style={{ color: pal.accent }}>{JSON.stringify(rest.join(":").trim() || item)}</span>{i < Math.min(data.length, 6) - 1 ? "," : ""}</div>; })}
      <div style={{ marginTop: 7, color: `${pal.text}68`, fontSize: 17 }}>{"}"}</div>
      <div style={{ position: "absolute", left: 30, right: 30, bottom: 26, height: 5, borderRadius: 5, background: `${pal.text}18` }}><div style={{ width: `${clampInterp(frame, [12, 60], [0, 100])}%`, height: "100%", borderRadius: 5, background: pal.accent }} /></div>
    </div>
  </AbsoluteFill>;
};

const LogStream: React.FC<{ p: CodeProductDemosProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const logs = p.output?.length ? p.output : DEFAULT_LOGS;
  const shift = clampInterp(frame, [12, 118], [0, Math.max(0, logs.length - 5) * 43]);
  return <AbsoluteFill style={{ padding: "74px 105px", boxSizing: "border-box", display: "flex", gap: 70, alignItems: "center" }}>
    <div style={{ width: "40%", minWidth: 0 }}><Intro pal={pal} p={p} /><div style={{ marginTop: 28, color: `${pal.text}68`, font: `14px ${MONO}` }}>STREAM / LIVE EVENTS / 30 FPS</div></div>
    <div style={{ flex: 1, height: 600, overflow: "hidden", borderRadius: 16, background: "#0c1117", border: `1px solid ${pal.text}28`, boxShadow: `0 30px 80px ${pal.bg}` }}>
      <WindowDots pal={pal} title="runtime.log" />
      <div style={{ padding: "24px 26px", transform: `translateY(${-shift}px)` }}>{[...logs, ...logs.slice(0, 3)].map((line, i) => <div key={`${i}-${line}`} style={{ height: 43, display: "flex", alignItems: "center", color: i === Math.floor(frame / 16) % logs.length ? pal.accent : `${pal.text}b4`, font: `500 16px ${MONO}`, whiteSpace: "nowrap" }}><span style={{ width: 15, height: 15, marginRight: 13, borderRadius: 20, background: i === Math.floor(frame / 16) % logs.length ? pal.accent : `${pal.text}35`, boxShadow: i === Math.floor(frame / 16) % logs.length ? `0 0 16px ${pal.accent}` : "none" }} />{line}</div>)}</div>
    </div>
  </AbsoluteFill>;
};

const PreviewPanel: React.FC<{ pal: Palette; progress?: number }> = ({ pal, progress = 1 }) => (
  <div style={{ height: "100%", borderRadius: 15, overflow: "hidden", background: `${pal.text}0e`, border: `1px solid ${pal.text}28` }}>
    <div style={{ height: 48, padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", color: `${pal.text}7a`, font: `700 13px ${MONO}` }}><span>PREVIEW</span><span style={{ color: "#65e6a4" }}>● LIVE</span></div>
    <div style={{ margin: "30px auto", width: "72%", height: "55%", borderRadius: 12, background: `linear-gradient(135deg, ${pal.primary}aa, ${pal.secondary}66 52%, ${pal.accent}99)`, transform: `scale(${0.9 + progress * 0.1})`, boxShadow: `0 18px 45px ${pal.bg}cc`, position: "relative" }}><div style={{ position: "absolute", left: "15%", right: "15%", top: "18%", height: 12, borderRadius: 10, background: `${pal.text}c8` }} /><div style={{ position: "absolute", left: "15%", right: "30%", top: "29%", height: 7, borderRadius: 10, background: `${pal.text}62` }} /><div style={{ position: "absolute", left: "15%", right: "15%", bottom: "18%", height: 52, borderRadius: 10, background: `${pal.bg}48` }} /></div>
    <div style={{ margin: "0 auto", width: "72%", height: 6, borderRadius: 6, background: `${pal.text}22` }}><div style={{ width: `${progress * 100}%`, height: "100%", borderRadius: 6, background: pal.accent }} /></div>
  </div>
);

const SplitEditor: React.FC<{ p: CodeProductDemosProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const progress = clampInterp(frame, [18, 74], [0, 1]);
  const lines = p.codeLines?.length ? p.codeLines : DEFAULT_CODE;
  return <AbsoluteFill style={{ padding: "72px 100px", boxSizing: "border-box" }}><Intro pal={pal} p={p} /><div style={{ position: "absolute", left: 100, right: 100, top: 285, bottom: 75, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}><CodeWindow pal={pal} lines={lines} highlighted={p.highlights ?? [2, 4]} title="Editor / component.tsx" /><PreviewPanel pal={pal} progress={progress} /></div></AbsoluteFill>;
};

const TestPass: React.FC<{ p: CodeProductDemosProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const tests = (p.steps ?? ["renders default props", "accepts custom palette", "keeps timing deterministic", "exports composition"]).slice(0, 5);
  const passed = Math.min(tests.length, Math.floor(clampInterp(frame, [18, 92], [0, tests.length + 1])));
  return <AbsoluteFill style={{ padding: "76px 110px", boxSizing: "border-box", display: "flex", gap: 60, alignItems: "center" }}><div style={{ width: "46%", minWidth: 0 }}><Intro pal={pal} p={p} /><div style={{ marginTop: 30, color: "#65e6a4", font: `800 18px ${MONO}` }}>{passed === tests.length ? "PASSING / ALL CHECKS GREEN" : "RUNNING / VERIFYING"}</div></div><div style={{ flex: 1, padding: 28, borderRadius: 16, background: `${pal.text}0b`, border: `1px solid ${pal.text}28`, fontFamily: MONO }}>{tests.map((test, i) => { const done = i < passed; const t = clampInterp(frame, [14 + i * 8, 30 + i * 8], [0, 1]); return <div key={test} style={{ opacity: t, minHeight: 70, display: "flex", alignItems: "center", gap: 18, borderBottom: i < tests.length - 1 ? `1px solid ${pal.text}16` : "none", color: pal.text, fontSize: 18 }}><span style={{ width: 30, height: 30, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 20, color: done ? pal.bg : `${pal.text}82`, background: done ? "#65e6a4" : `${pal.text}14`, border: done ? "none" : `1px solid ${pal.text}35` }}>{done ? "✓" : "·"}</span><span style={{ flex: 1 }}>{test}</span><span style={{ color: done ? "#65e6a4" : `${pal.text}55`, fontSize: 13 }}>{done ? "PASS" : "PENDING"}</span></div>; })}<div style={{ marginTop: 22, display: "flex", justifyContent: "space-between", color: `${pal.text}68`, fontSize: 14 }}><span>TEST SUITE / {p.language ?? "REMOTION"}</span><span>{passed}/{tests.length}</span></div></div></AbsoluteFill>;
};

const DeployPipeline: React.FC<{ p: CodeProductDemosProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const stages = (p.steps ?? ["COMMIT", "BUILD", "VERIFY", "DEPLOY"]).slice(0, 4);
  const active = clampInterp(frame, [15, 120], [0, stages.length]);
  return <AbsoluteFill style={{ padding: "78px 100px", boxSizing: "border-box" }}><Intro pal={pal} p={p} align="center" /><div style={{ position: "absolute", left: 150, right: 150, top: 500, display: "flex", alignItems: "center" }}>{stages.map((stage, i) => { const done = active > i + 0.72; const shown = clampInterp(frame, [18 + i * 10, 37 + i * 10], [0, 1]); return <React.Fragment key={stage}><div style={{ flex: "0 0 190px", textAlign: "center", opacity: shown, color: pal.text, fontFamily: MONO }}><div style={{ width: 92, height: 92, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 99, background: done ? "#65e6a4" : `${pal.text}13`, border: `2px solid ${done ? "#65e6a4" : pal.accent}`, color: done ? pal.bg : pal.accent, fontSize: 22, boxShadow: done ? "0 0 34px #65e6a455" : "none" }}>{done ? "✓" : String(i + 1).padStart(2, "0")}</div><div style={{ marginTop: 19, fontWeight: 800, fontSize: 15, letterSpacing: ".15em" }}>{stage}</div><div style={{ marginTop: 8, color: done ? "#65e6a4" : `${pal.text}5b`, fontSize: 12 }}>{done ? "COMPLETE" : "QUEUED"}</div></div>{i < stages.length - 1 && <div style={{ flex: 1, height: 4, background: `${pal.text}20`, overflow: "hidden" }}><div style={{ width: `${clampInterp(active, [i, i + 1], [0, 100])}%`, height: "100%", background: done ? "#65e6a4" : pal.accent }} /></div>}</React.Fragment>; })}</div><div style={{ position: "absolute", left: 100, right: 100, bottom: 80, textAlign: "center", color: `${pal.text}68`, font: `14px ${MONO}` }}>{p.command ?? "main → production"} <span style={{ color: pal.accent }}>•</span> deterministic release pipeline</div></AbsoluteFill>;
};

const CodeToPreview: React.FC<{ p: CodeProductDemosProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const progress = clampInterp(frame, [20, 78], [0, 1]);
  const lines = p.codeLines?.length ? p.codeLines : DEFAULT_CODE;
  return <AbsoluteFill style={{ padding: "72px 100px", boxSizing: "border-box" }}><Intro pal={pal} p={p} /><div style={{ position: "absolute", left: 100, right: 100, top: 300, bottom: 70, display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 38, alignItems: "center" }}><div style={{ height: 500, transform: `translateX(${interpolate(progress, [0, 1], [-24, 0])}px)`, opacity: progress }}><CodeWindow pal={pal} lines={lines} highlighted={p.highlights ?? [3]} title="component.tsx" /></div><div style={{ height: 590, transform: `translateX(${interpolate(progress, [0, 1], [80, 0])}px) scale(${interpolate(progress, [0, 1], [.93, 1])})`, opacity: progress }}><PreviewPanel pal={pal} progress={progress} /></div></div><div style={{ position: "absolute", right: 110, bottom: 82, color: pal.secondary, font: `800 14px ${MONO}` }}>{progress > .7 ? "CODE → PREVIEW / READY" : "BUILDING PREVIEW…"}</div></AbsoluteFill>;
};

const VARIANTS: Record<CodeProductVariant, React.FC<{ p: CodeProductDemosProps; pal: Palette }>> = {
  "terminal-command": TerminalCommand,
  "code-type-on": CodeTypeOn,
  "diff-review": DiffReview,
  "error-to-fix": ErrorToFix,
  "api-response": ApiResponse,
  "log-stream": LogStream,
  "split-editor": SplitEditor,
  "test-pass": TestPass,
  "deploy-pipeline": DeployPipeline,
  "code-to-preview": CodeToPreview,
};

export const CodeProductDemosTemplate: React.FC<CodeProductDemosProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const Variant = VARIANTS[props.variant] ?? TerminalCommand;
  const technical = props.variant === "terminal-command" || props.variant === "log-stream" || props.variant === "deploy-pipeline";
  return <AbsoluteFill style={{ backgroundColor: pal.bg, color: pal.text, fontFamily: FONT, overflow: "hidden" }}>
    {!technical && <GradientMeshBackground palette={pal} blobs={props.variant === "diff-review" ? 3 : 5} speed={0.38} />}
    <FadeEdges inFrames={10} outFrames={14}><Variant p={props} pal={pal} /></FadeEdges>
  </AbsoluteFill>;
};

const familyCast = (component: React.FC<CodeProductDemosProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "code-product-demos-terminal-command": familyCast(CodeProductDemosTemplate),
  "code-product-demos-code-type-on": familyCast(CodeProductDemosTemplate),
  "code-product-demos-diff-review": familyCast(CodeProductDemosTemplate),
  "code-product-demos-error-to-fix": familyCast(CodeProductDemosTemplate),
  "code-product-demos-api-response": familyCast(CodeProductDemosTemplate),
  "code-product-demos-log-stream": familyCast(CodeProductDemosTemplate),
  "code-product-demos-split-editor": familyCast(CodeProductDemosTemplate),
  "code-product-demos-test-pass": familyCast(CodeProductDemosTemplate),
  "code-product-demos-deploy-pipeline": familyCast(CodeProductDemosTemplate),
  "code-product-demos-code-to-preview": familyCast(CodeProductDemosTemplate),
};
