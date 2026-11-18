import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeEdges, GradientMeshBackground, clampInterp, resolvePalette, type Palette } from "../lib/primitives";

/** A presentation-ready animated table system for rankings, comparisons, and scorecards. */
export type TablesRankingsVariant =
  | "rank-reveal"
  | "table-sort"
  | "row-highlight"
  | "leaderboard"
  | "price-table"
  | "feature-matrix"
  | "scorecard"
  | "delta-table"
  | "top-bottom-split"
  | "table-to-chart";

type Cell = string | number | boolean;
export interface TableRow {
  label: string;
  values?: Record<string, Cell>;
  value?: number;
  previous?: number;
  delta?: number;
  rank?: number;
  group?: string;
  color?: string;
}

export interface TablesRankingsProps {
  variant: TablesRankingsVariant;
  title: string;
  subtitle: string;
  paletteName: string;
  columns: string[];
  rows: TableRow[];
  sortKey?: string;
  highlights?: string[];
  highlightRow?: string;
  unit?: string;
  prefix?: string;
  suffix?: string;
  footer?: string;
  showRank?: boolean;
  maxValue?: number;
}

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const FALLBACK_COLUMNS = ["Revenue", "Growth", "Score"];
const FALLBACK_ROWS: TableRow[] = [
  { label: "Northstar", values: { Revenue: 94, Growth: 28, Score: 92 }, value: 94, delta: 8 },
  { label: "Atlas", values: { Revenue: 81, Growth: 19, Score: 86 }, value: 81, delta: 5 },
  { label: "Daybreak", values: { Revenue: 73, Growth: 14, Score: 79 }, value: 73, delta: -2 },
  { label: "Juniper", values: { Revenue: 62, Growth: 9, Score: 71 }, value: 62, delta: 4 },
  { label: "Meridian", values: { Revenue: 51, Growth: 6, Score: 64 }, value: 51, delta: -5 },
];

const dataRows = (p: TablesRankingsProps): TableRow[] => (p.rows?.length ? p.rows : FALLBACK_ROWS);
const dataColumns = (p: TablesRankingsProps): string[] => (p.columns?.length ? p.columns : FALLBACK_COLUMNS);
const colors = (pal: Palette): string[] => [pal.primary, pal.secondary, pal.accent, "#a78bfa", "#22d3ee", "#fb7185"];
const numberFrom = (value: Cell | undefined, fallback = 0): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = Number(value.replace(/[^0-9.+-]/g, ""));
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
};
const cell = (row: TableRow, column: string, index: number): Cell => {
  if (row.values && row.values[column] !== undefined) return row.values[column];
  if (index === 0 && row.value !== undefined) return row.value;
  if (index === 1 && row.delta !== undefined) return row.delta;
  if (index === 2 && row.previous !== undefined) return row.previous;
  return [row.value ?? 0, row.delta ?? 0, row.previous ?? 0][index] ?? 0;
};
const display = (value: Cell, p: TablesRankingsProps): string => {
  if (typeof value === "boolean") return value ? "✓" : "—";
  if (typeof value === "number") return `${p.prefix ?? ""}${Math.round(value).toLocaleString("en-US")}${p.suffix ?? p.unit ?? ""}`;
  return value;
};
const numericValue = (row: TableRow, column: string, index: number): number => numberFrom(cell(row, column, index), row.value ?? 0);

const Panel: React.FC<{ pal: Palette; children: React.ReactNode; style?: React.CSSProperties }> = ({ pal, children, style }) => (
  <div style={{ height: "100%", borderRadius: 28, border: `1px solid ${pal.text}20`, background: `linear-gradient(145deg, ${pal.text}10, ${pal.text}04)`, boxShadow: `0 26px 70px ${pal.bg}aa`, overflow: "hidden", ...style }}>{children}</div>
);

const Header: React.FC<{ p: TablesRankingsProps; pal: Palette; kicker?: string }> = ({ p, pal, kicker = "DATA STORY" }) => (
  <div style={{ height: 126, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
    <div>
      <div style={{ color: pal.accent, fontSize: 14, fontWeight: 800, letterSpacing: "0.22em" }}>{kicker}</div>
      <div style={{ marginTop: 12, fontSize: 45, lineHeight: 1.04, fontWeight: 780, letterSpacing: "-0.04em" }}>{p.title}</div>
      <div style={{ marginTop: 12, color: `${pal.text}8f`, fontSize: 20, letterSpacing: "0.025em" }}>{p.subtitle}</div>
    </div>
    <div style={{ marginTop: 9, color: `${pal.text}76`, fontFamily: MONO, fontSize: 14, letterSpacing: "0.14em", textTransform: "uppercase" }}>Live ranking</div>
  </div>
);

const RowReveal: React.FC<{ row: TableRow; index: number; total: number; p: TablesRankingsProps; pal: Palette; columns: string[]; rank?: number; highlighted?: boolean; accent?: string; showBar?: boolean }> = ({ row, index, total, p, pal, columns, rank, highlighted = false, accent, showBar = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({ frame: Math.max(0, frame - 14 - index * 5), fps, config: { damping: 18, stiffness: 120, mass: 0.8 } });
  const peak = Math.max(1, p.maxValue ?? Math.max(...dataRows(p).map((r, i) => numericValue(r, columns[0], i))));
  const bar = Math.max(0, Math.min(1, numericValue(row, columns[0], index) / peak));
  return (
    <div style={{ position: "relative", display: "grid", gridTemplateColumns: `${rank !== undefined ? "72px " : ""}minmax(220px, 1.55fr) repeat(${columns.length}, minmax(110px, 0.8fr))`, alignItems: "center", minHeight: 76, padding: "0 24px", borderTop: `1px solid ${pal.text}13`, background: highlighted ? `${accent ?? pal.accent}16` : "transparent", opacity: reveal, transform: `translateY(${(1 - reveal) * 22}px)`, overflow: "hidden" }}>
      {showBar && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${bar * 100}%`, background: `linear-gradient(90deg, ${accent ?? pal.primary}18, transparent)`, opacity: 0.9 }} />}
      {rank !== undefined && <div style={{ position: "relative", fontFamily: MONO, fontWeight: 800, fontSize: rank < 4 ? 25 : 18, color: rank === 1 ? pal.accent : `${pal.text}73` }}>{String(rank).padStart(2, "0")}</div>}
      <div style={{ position: "relative", minWidth: 0, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: accent ?? pal.primary, boxShadow: `0 0 16px ${accent ?? pal.primary}80` }} />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 21, fontWeight: highlighted ? 760 : 600 }}>{row.label}</span>
      </div>
      {columns.map((column, columnIndex) => {
        const value = cell(row, column, columnIndex);
        const isDelta = column.toLowerCase().includes("delta") || column.toLowerCase().includes("change") || column.toLowerCase().includes("growth");
        const n = numberFrom(value);
        return <div key={`${row.label}-${column}`} style={{ position: "relative", textAlign: "right", color: isDelta ? (n >= 0 ? pal.secondary : pal.accent) : pal.text, fontFamily: typeof value === "number" ? MONO : FONT, fontSize: 19, fontWeight: 700 }}>{isDelta && typeof value === "number" ? `${n >= 0 ? "+" : ""}${display(value, p)}` : display(value, p)}</div>;
      })}
    </div>
  );
};

const TableHeader: React.FC<{ pal: Palette; columns: string[]; rank?: boolean }> = ({ pal, columns, rank = false }) => (
  <div style={{ display: "grid", gridTemplateColumns: `${rank ? "72px " : ""}minmax(220px, 1.55fr) repeat(${columns.length}, minmax(110px, 0.8fr))`, padding: "0 24px", minHeight: 52, alignItems: "center", color: `${pal.text}63`, fontSize: 13, fontWeight: 800, letterSpacing: "0.13em", textTransform: "uppercase" }}>
    {rank && <div>#</div>}<div>Entity</div>{columns.map((column) => <div key={column} style={{ textAlign: "right" }}>{column}</div>)}
  </div>
);

const StandardTable: React.FC<{ p: TablesRankingsProps; pal: Palette; rows?: TableRow[]; rank?: boolean; highlight?: string; bar?: boolean; kicker?: string }> = ({ p, pal, rows = dataRows(p), rank = false, highlight, bar = false, kicker }) => {
  const columns = dataColumns(p);
  return <Panel pal={pal}><div style={{ padding: "34px 28px 28px" }}><Header p={p} pal={pal} kicker={kicker} /><TableHeader pal={pal} columns={columns} rank={rank} /><div>{rows.map((row, i) => <RowReveal key={`${row.label}-${i}`} row={row} index={i} total={rows.length} p={p} pal={pal} columns={columns} rank={rank ? (row.rank ?? i + 1) : undefined} highlighted={highlight === row.label || p.highlights?.includes(row.label)} accent={row.color ?? colors(pal)[i % colors(pal).length]} showBar={bar} />)}</div>{p.footer && <div style={{ margin: "22px 24px 0", paddingTop: 18, borderTop: `1px solid ${pal.text}15`, color: `${pal.text}63`, fontSize: 15 }}>{p.footer}</div>}</div></Panel>;
};

const RankReveal: React.FC<{ p: TablesRankingsProps; pal: Palette }> = ({ p, pal }) => <StandardTable p={p} pal={pal} rank bar kicker="RANK REVEAL" />;
const TableSort: React.FC<{ p: TablesRankingsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const columns = dataColumns(p);
  const key = p.sortKey ?? columns[0];
  const sorted = [...dataRows(p)].sort((a, b) => numericValue(b, key, columns.indexOf(key)) - numericValue(a, key, columns.indexOf(key)));
  return <StandardTable p={{ ...p, subtitle: `${p.subtitle}  ·  sorted by ${key}` }} pal={pal} rows={frame < 35 ? dataRows(p) : sorted} bar kicker="TABLE SORT" />;
};
const RowHighlight: React.FC<{ p: TablesRankingsProps; pal: Palette }> = ({ p, pal }) => <StandardTable p={p} pal={pal} highlight={p.highlightRow ?? p.highlights?.[0] ?? dataRows(p)[1]?.label} kicker="ROW HIGHLIGHT" />;

const Leaderboard: React.FC<{ p: TablesRankingsProps; pal: Palette }> = ({ p, pal }) => {
  const rows = dataRows(p);
  const frame = useCurrentFrame();
  const reveal = clampInterp(frame, [8, 42], [0, 1]);
  const top = rows.slice(0, 3);
  return <Panel pal={pal}><div style={{ padding: "34px 36px" }}><Header p={p} pal={pal} kicker="LEADERBOARD" /><div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 20, height: 260, marginBottom: 24 }}>{[1, 0, 2].map((index) => { const row = top[index]; if (!row) return null; const place = index === 0 ? 2 : index === 1 ? 1 : 3; const height = place === 1 ? 220 : place === 2 ? 175 : 145; return <div key={row.label} style={{ width: 250, height, borderRadius: "22px 22px 10px 10px", padding: "22px 18px", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", background: `linear-gradient(180deg, ${colors(pal)[place - 1]}42, ${colors(pal)[place - 1]}0b)`, border: `1px solid ${colors(pal)[place - 1]}55`, opacity: reveal, transform: `translateY(${(1 - reveal) * 28}px)` }}><div style={{ color: `${pal.text}75`, fontFamily: MONO, fontSize: 14 }}>#{place}</div><div style={{ marginTop: 10, fontSize: 23, fontWeight: 760, textAlign: "center" }}>{row.label}</div><div style={{ marginTop: 9, fontFamily: MONO, fontSize: 28, color: colors(pal)[place - 1] }}>{display(cell(row, dataColumns(p)[0], 0), p)}</div></div>; })}</div><TableHeader pal={pal} columns={dataColumns(p)} /><div>{rows.slice(3).map((row, i) => <RowReveal key={row.label} row={row} index={i + 3} total={rows.length} p={p} pal={pal} rank={i + 4} columns={dataColumns(p)} accent={row.color ?? pal.secondary} />)}</div></div></Panel>;
};

const PriceTable: React.FC<{ p: TablesRankingsProps; pal: Palette; matrix?: boolean }> = ({ p, pal, matrix = false }) => {
  const frame = useCurrentFrame();
  const rows = dataRows(p);
  const columns = dataColumns(p);
  return <Panel pal={pal}><div style={{ padding: "34px 36px" }}><Header p={p} pal={pal} kicker={matrix ? "FEATURE MATRIX" : "PRICE TABLE"} /><div style={{ display: "grid", gridTemplateColumns: `minmax(280px, 1.45fr) repeat(${columns.length}, 1fr)`, border: `1px solid ${pal.text}18`, borderRadius: 18, overflow: "hidden" }}><div style={{ minHeight: 70, padding: 22, background: `${pal.text}09`, color: `${pal.text}70`, fontSize: 14, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>Features</div>{columns.map((column, i) => <div key={column} style={{ minHeight: 70, padding: 22, background: `${colors(pal)[i % colors(pal).length]}18`, color: colors(pal)[i % colors(pal).length], textAlign: "center", fontSize: 19, fontWeight: 800 }}>{column}</div>)}{rows.map((row, rowIndex) => <React.Fragment key={row.label}><div style={{ minHeight: 67, padding: "20px 22px", borderTop: `1px solid ${pal.text}13`, color: `${pal.text}c4`, fontSize: 19, fontWeight: 600, opacity: clampInterp(frame, [15 + rowIndex * 4, 28 + rowIndex * 4], [0, 1]) }}>{row.label}</div>{columns.map((column, columnIndex) => { const value = cell(row, column, columnIndex); return <div key={`${row.label}-${column}`} style={{ minHeight: 67, display: "flex", justifyContent: "center", alignItems: "center", borderTop: `1px solid ${pal.text}13`, color: typeof value === "boolean" ? (value ? pal.secondary : `${pal.text}38`) : pal.text, fontFamily: typeof value === "number" ? MONO : FONT, fontSize: typeof value === "boolean" ? 27 : 18, fontWeight: 760, opacity: clampInterp(frame, [18 + rowIndex * 4, 31 + rowIndex * 4], [0, 1]) }}>{display(value, p)}</div>; })}</React.Fragment>)}</div>{p.footer && <div style={{ marginTop: 20, color: `${pal.text}67`, fontSize: 15 }}>{p.footer}</div>}</div></Panel>;
};

const Scorecard: React.FC<{ p: TablesRankingsProps; pal: Palette }> = ({ p, pal }) => {
  const columns = dataColumns(p);
  const rows = dataRows(p);
  const frame = useCurrentFrame();
  const max = Math.max(1, p.maxValue ?? 0, ...rows.map((row, i) => numericValue(row, columns[0], i)));
  return <Panel pal={pal}><div style={{ padding: "34px 38px" }}><Header p={p} pal={pal} kicker="SCORECARD" /><div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", gap: 18 }}>{rows.map((row, i) => { const value = numericValue(row, columns[0], i); const width = clampInterp(frame, [15 + i * 5, 60 + i * 5], [0, (value / max) * 100]); return <React.Fragment key={row.label}><div style={{ display: "flex", alignItems: "center", gap: 13, borderTop: `1px solid ${pal.text}14`, fontSize: 21, color: `${pal.text}c4`, opacity: clampInterp(frame, [12 + i * 4, 27 + i * 4], [0, 1]) }}><span style={{ width: 9, height: 9, borderRadius: "50%", background: colors(pal)[i % colors(pal).length] }} />{row.label}</div><div style={{ display: "flex", alignItems: "center", gap: 16, borderTop: `1px solid ${pal.text}14` }}><div style={{ flex: 1, height: 18, borderRadius: 99, background: `${pal.text}12`, overflow: "hidden" }}><div style={{ height: "100%", width: `${width}%`, borderRadius: 99, background: `linear-gradient(90deg, ${colors(pal)[i % colors(pal).length]}, ${pal.secondary})` }} /></div><div style={{ width: 74, textAlign: "right", fontFamily: MONO, fontSize: 22, fontWeight: 800 }}>{display(value, p)}</div></div></React.Fragment>; })}</div></div></Panel>;
};

const DeltaTable: React.FC<{ p: TablesRankingsProps; pal: Palette }> = ({ p, pal }) => {
  const rows = dataRows(p);
  const columns = dataColumns(p);
  return <StandardTable p={{ ...p, columns: columns.length ? columns : ["Current", "Change"] }} pal={pal} rows={rows.map((row) => ({ ...row, values: { ...(row.values ?? {}), Change: row.delta ?? row.values?.Change ?? 0 } }))} kicker="DELTA TABLE" />;
};

const TopBottomSplit: React.FC<{ p: TablesRankingsProps; pal: Palette }> = ({ p, pal }) => {
  const rows = dataRows(p);
  const sorted = [...rows].sort((a, b) => numericValue(b, dataColumns(p)[0], 0) - numericValue(a, dataColumns(p)[0], 0));
  return <Panel pal={pal}><div style={{ padding: "34px 36px" }}><Header p={p} pal={pal} kicker="TOP / BOTTOM" /><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>{[["Leading", sorted.slice(0, 3), pal.secondary], ["Needs attention", sorted.slice(-3).reverse(), pal.accent]].map(([heading, group, color]) => <div key={String(heading)} style={{ border: `1px solid ${String(color)}45`, borderRadius: 20, overflow: "hidden" }}><div style={{ padding: "18px 22px", color: String(color), fontWeight: 800, letterSpacing: "0.13em", textTransform: "uppercase", fontSize: 14 }}>{heading as string}</div>{(group as TableRow[]).map((row, i) => <RowReveal key={row.label} row={row} index={i} total={3} p={p} pal={pal} columns={dataColumns(p).slice(0, 1)} rank={i + 1} accent={String(color)} />)}</div>)}</div></div></Panel>;
};

const TableToChart: React.FC<{ p: TablesRankingsProps; pal: Palette }> = ({ p, pal }) => {
  const frame = useCurrentFrame();
  const chart = clampInterp(frame, [42, 92], [0, 1]);
  const columns = dataColumns(p);
  const rows = dataRows(p);
  const max = Math.max(1, ...rows.map((row, i) => numericValue(row, columns[0], i)));
  return <Panel pal={pal}><div style={{ padding: "34px 36px" }}><Header p={p} pal={pal} kicker={chart > 0.5 ? "TABLE TO CHART" : "TABLE SNAPSHOT"} /><div style={{ position: "relative", minHeight: 590 }}>{rows.map((row, i) => { const value = numericValue(row, columns[0], i); const width = (value / max) * 100; const y = i * 92; return <div key={row.label} style={{ position: "absolute", left: 0, right: 0, top: y, height: 72, display: "flex", alignItems: "center", gap: 18, opacity: 1 - chart * 0.82 }}><div style={{ width: 230, fontSize: 20, fontWeight: 650 }}>{row.label}</div><div style={{ flex: 1, height: 34, borderRadius: 8, background: `${pal.text}10`, overflow: "hidden" }}><div style={{ height: "100%", width: `${width}%`, background: colors(pal)[i % colors(pal).length], transformOrigin: "left", transform: `scaleX(${chart})` }} /></div><div style={{ width: 110, textAlign: "right", fontFamily: MONO }}>{display(value, p)}</div></div>; })}<div style={{ position: "absolute", inset: 0, opacity: chart, display: "flex", flexDirection: "column", justifyContent: "space-around", padding: "12px 0" }}>{rows.map((row, i) => <div key={`chart-${row.label}`} style={{ display: "flex", alignItems: "center", gap: 18 }}><div style={{ width: 230, fontSize: 19, color: `${pal.text}b4` }}>{row.label}</div><div style={{ flex: 1, height: 39, borderRadius: 8, background: `linear-gradient(90deg, ${colors(pal)[i % colors(pal).length]}d8, ${colors(pal)[i % colors(pal).length]}55)`, transform: `scaleX(${clampInterp(frame, [42, 92], [0, widthFor(row, rows, columns)] ) / 100})`, transformOrigin: "left" }} /><div style={{ width: 110, textAlign: "right", fontFamily: MONO, fontSize: 20 }}>{display(cell(row, columns[0], i), p)}</div></div>)}</div></div></div></Panel>;
};
const widthFor = (row: TableRow, rows: TableRow[], columns: string[]): number => {
  const max = Math.max(1, ...rows.map((r, i) => numericValue(r, columns[0], i)));
  return (numericValue(row, columns[0], rows.indexOf(row)) / max) * 100;
};

const Variant: React.FC<{ p: TablesRankingsProps; pal: Palette }> = ({ p, pal }) => {
  switch (p.variant) {
    case "rank-reveal": return <RankReveal p={p} pal={pal} />;
    case "table-sort": return <TableSort p={p} pal={pal} />;
    case "row-highlight": return <RowHighlight p={p} pal={pal} />;
    case "leaderboard": return <Leaderboard p={p} pal={pal} />;
    case "price-table": return <PriceTable p={p} pal={pal} />;
    case "feature-matrix": return <PriceTable p={p} pal={pal} matrix />;
    case "scorecard": return <Scorecard p={p} pal={pal} />;
    case "delta-table": return <DeltaTable p={p} pal={pal} />;
    case "top-bottom-split": return <TopBottomSplit p={p} pal={pal} />;
    case "table-to-chart": return <TableToChart p={p} pal={pal} />;
    default: return <RankReveal p={p} pal={pal} />;
  }
};

export const TablesRankingsTemplate: React.FC<TablesRankingsProps> = (props) => {
  const pal = resolvePalette(props.paletteName);
  const { width, height } = useVideoConfig();
  // The renderer's thumbnail/gate passes use a smaller CSS viewport, while the
  // family layout is authored on a 1920×1080 design canvas. Keep the complete
  // table on that canvas and scale it as one unit so headers, rows, and footers
  // cannot collide or clip at 800×450/640×360 smoke sizes.
  const designScale = Math.min(1, width / 1920, height / 1080);
  return <AbsoluteFill style={{ backgroundColor: pal.bg, color: pal.text, fontFamily: FONT, overflow: "hidden" }}><GradientMeshBackground palette={pal} speed={0.24} blobs={4} /><FadeEdges inFrames={10} outFrames={14}><AbsoluteFill style={{ overflow: "hidden" }}><div style={{ position: "relative", width: 1920, height: 1080, transform: `scale(${designScale})`, transformOrigin: "top left" }}><AbsoluteFill style={{ width: 1920, height: 1080, right: "auto", bottom: "auto", padding: "58px 76px" }}><Variant p={props} pal={pal} /></AbsoluteFill></div></AbsoluteFill></FadeEdges></AbsoluteFill>;
};

const familyCast = (component: React.FC<TablesRankingsProps>) => component as unknown as React.ComponentType<Record<string, unknown>>;
export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "tables-rankings-rank-reveal": familyCast(TablesRankingsTemplate),
  "tables-rankings-table-sort": familyCast(TablesRankingsTemplate),
  "tables-rankings-row-highlight": familyCast(TablesRankingsTemplate),
  "tables-rankings-leaderboard": familyCast(TablesRankingsTemplate),
  "tables-rankings-price-table": familyCast(TablesRankingsTemplate),
  "tables-rankings-feature-matrix": familyCast(TablesRankingsTemplate),
  "tables-rankings-scorecard": familyCast(TablesRankingsTemplate),
  "tables-rankings-delta-table": familyCast(TablesRankingsTemplate),
  "tables-rankings-top-bottom-split": familyCast(TablesRankingsTemplate),
  "tables-rankings-table-to-chart": familyCast(TablesRankingsTemplate),
};
