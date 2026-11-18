import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {seededRand} from "../lib/primitives";

type SportsVariant =
  | "scoreboard-bug"
  | "final-score"
  | "player-stat-card"
  | "matchup-versus"
  | "replay-tag"
  | "tournament-bracket"
  | "league-standings"
  | "record-breaker"
  | "halftime-stats"
  | "next-fixture";

export interface SportsTeam {
  name: string;
  color: string;
  score: number;
}

export interface SportsStat {
  label: string;
  value?: string | number;
  home?: number;
  away?: number;
  team?: string;
  played?: number;
  wins?: number;
  points?: number;
}

export interface SportsHighlightsProps {
  variant: SportsVariant;
  homeTeam: SportsTeam;
  awayTeam: SportsTeam;
  stats: SportsStat[];
  title: string;
  subtitle: string;
}

const FONT = 'Arial, "Helvetica Neue", Helvetica, sans-serif';
const WHITE = "#f8fafc";
const INK = "#071018";
const MUTED = "#94a3b8";

const enter = (frame: number, start = 0, duration = 18) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

const Background: React.FC<{children: React.ReactNode; accent?: string}> = ({children, accent = "#22d3ee"}) => (
  <AbsoluteFill
    style={{
      overflow: "hidden",
      color: WHITE,
      fontFamily: FONT,
      background: `radial-gradient(circle at 82% 12%, ${accent}2b 0, transparent 31%), linear-gradient(135deg, #050b12 0%, #0b1824 55%, #071018 100%)`,
    }}
  >
    <div style={{position: "absolute", inset: 0, opacity: 0.13, backgroundImage: "linear-gradient(rgba(255,255,255,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.14) 1px, transparent 1px)", backgroundSize: "64px 64px"}} />
    {children}
  </AbsoluteFill>
);

const TeamMark: React.FC<{team: SportsTeam; size?: number}> = ({team, size = 72}) => (
  <div style={{width: size, height: size, borderRadius: size * 0.24, display: "grid", placeItems: "center", background: team.color, color: WHITE, fontSize: size * 0.38, fontWeight: 900, boxShadow: `0 10px 30px ${team.color}55`}}>
    {team.name.split(/\s+/).map((word) => word[0]).join("").slice(0, 3).toUpperCase()}
  </div>
);

const ScoreboardBug: React.FC<{p: SportsHighlightsProps}> = ({p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const rise = spring({frame, fps, config: {damping: 16, stiffness: 130}});
  const clockSeconds = Math.max(0, 48 * 60 + 27 - Math.floor(frame / fps));
  const clock = `${Math.floor(clockSeconds / 60)}:${String(clockSeconds % 60).padStart(2, "0")}`;
  return (
    <Background accent={p.homeTeam.color}>
      <div style={{position: "absolute", left: 82, right: 82, bottom: 74, height: 154, display: "flex", alignItems: "stretch", transform: `translateY(${(1 - rise) * 230}px)`, filter: "drop-shadow(0 20px 35px rgba(0,0,0,.55))"}}>
        <div style={{width: 184, background: WHITE, color: INK, display: "grid", placeItems: "center", borderRadius: "18px 0 0 18px"}}>
          <div style={{textAlign: "center"}}><div style={{fontSize: 23, fontWeight: 900, letterSpacing: 4}}>LIVE</div><div style={{fontSize: 31, fontWeight: 800, marginTop: 5}}>{clock}</div></div>
        </div>
        {[p.homeTeam, p.awayTeam].map((team, i) => (
          <div key={team.name} style={{flex: 1, display: "flex", alignItems: "center", gap: 26, padding: "0 34px", background: `linear-gradient(110deg, ${team.color}, ${team.color}bb)`, borderLeft: "1px solid rgba(255,255,255,.18)"}}>
            <TeamMark team={team} size={66} />
            <div style={{minWidth: 0, flex: 1, fontSize: 29, lineHeight: 1.05, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>{team.name}</div>
            <div style={{marginLeft: 18, fontSize: 62, lineHeight: 1, fontWeight: 900}}>{team.score}</div>
          </div>
        ))}
        <div style={{width: 20, borderRadius: "0 18px 18px 0", background: "#22d3ee"}} />
      </div>
      <div style={{position: "absolute", left: 84, bottom: 242, fontSize: 20, fontWeight: 800, letterSpacing: 5, color: MUTED}}>CHAMPIONSHIP • MATCHDAY 18</div>
    </Background>
  );
};

const FinalScore: React.FC<{p: SportsHighlightsProps}> = ({p}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const split = spring({frame: frame - 4, fps, config: {damping: 18, stiffness: 110}});
  const scoreIn = spring({frame: frame - 22, fps, config: {damping: 10, stiffness: 180}});
  return (
    <AbsoluteFill style={{background: INK, color: WHITE, fontFamily: FONT, overflow: "hidden"}}>
      <div style={{position: "absolute", inset: 0, background: p.homeTeam.color, clipPath: `polygon(0 0, ${48 + split * 4}% 0, ${39 + split * 4}% 100%, 0 100%)`, transform: `translateX(${(1 - split) * -width}px)`}} />
      <div style={{position: "absolute", inset: 0, background: p.awayTeam.color, clipPath: `polygon(${48 + split * 4}% 0, 100% 0, 100% 100%, ${39 + split * 4}% 100%)`, transform: `translateX(${(1 - split) * width}px)`}} />
      <div style={{position: "absolute", top: 62, width: "100%", textAlign: "center", fontSize: 25, fontWeight: 900, letterSpacing: 9}}>FULL TIME</div>
      <div style={{position: "absolute", inset: "170px 100px 205px", display: "grid", gridTemplateColumns: "1fr 180px 1fr", alignItems: "center"}}>
        {[p.homeTeam, p.awayTeam].map((team, i) => (
          <React.Fragment key={team.name}>
            {i === 1 ? <div style={{fontSize: 44, fontWeight: 300, textAlign: "center", opacity: enter(frame, 30, 12)}}>—</div> : null}
            <div style={{minWidth: 0, textAlign: "center", transform: `scale(${0.65 + scoreIn * 0.35})`, opacity: scoreIn}}>
              <div style={{display: "flex", justifyContent: "center"}}><TeamMark team={team} size={112} /></div>
              <div style={{maxWidth: 330, margin: "22px auto 0", fontSize: 36, lineHeight: 1.05, fontWeight: 900, textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>{team.name}</div>
              <div style={{fontSize: 154, fontWeight: 900, lineHeight: 0.9, marginTop: 12}}>{team.score}</div>
            </div>
          </React.Fragment>
        ))}
      </div>
      <div style={{position: "absolute", left: 100, right: 100, bottom: 52, textAlign: "center", fontSize: 21, lineHeight: 1.15, letterSpacing: 3, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>{p.subtitle}</div>
    </AbsoluteFill>
  );
};

const PlayerStatCard: React.FC<{p: SportsHighlightsProps}> = ({p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const card = spring({frame, fps, config: {damping: 18, stiffness: 120}});
  return (
    <Background accent={p.homeTeam.color}>
      <div style={{position: "absolute", left: 170, top: 120, bottom: 120, width: 690, borderRadius: 36, overflow: "hidden", background: `linear-gradient(145deg, ${p.homeTeam.color}, #071018)`, transform: `translateX(${(1 - card) * -850}px) rotate(${(1 - card) * -5}deg)`, boxShadow: "0 35px 90px rgba(0,0,0,.5)"}}>
        <div style={{position: "absolute", width: 430, height: 430, borderRadius: "50%", right: -90, bottom: -80, border: "80px solid rgba(255,255,255,.08)"}} />
        <div style={{padding: "70px 64px"}}>
          <div style={{fontSize: 24, letterSpacing: 7, fontWeight: 800}}>PLAYER OF THE MATCH</div>
          <div style={{fontSize: 105, lineHeight: 0.94, fontWeight: 900, textTransform: "uppercase", marginTop: 260}}>{p.title}</div>
          <div style={{fontSize: 28, marginTop: 22, fontWeight: 700, color: "rgba(255,255,255,.7)"}}>{p.homeTeam.name} • {p.subtitle}</div>
        </div>
      </div>
      <div style={{position: "absolute", left: 950, right: 150, top: 155}}>
        <div style={{fontSize: 25, fontWeight: 800, letterSpacing: 6, color: p.homeTeam.color}}>MATCH IMPACT</div>
        <div style={{marginTop: 52, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26}}>
          {p.stats.slice(0, 4).map((stat, i) => {
            const t = enter(frame, 16 + i * 7, 20);
            const target = typeof stat.value === "number" ? stat.value : null;
            return <div key={`${stat.label}-${i}`} style={{padding: "34px 38px", minHeight: 188, border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.055)", borderRadius: 22, opacity: t, transform: `translateY(${(1 - t) * 35}px)`}}>
              <div style={{fontSize: 74, lineHeight: 1, fontWeight: 900, color: i === 0 ? p.homeTeam.color : WHITE}}>{target === null ? stat.value : Math.round(target * t)}</div>
              <div style={{fontSize: 21, marginTop: 24, fontWeight: 800, letterSpacing: 3, color: MUTED, textTransform: "uppercase"}}>{stat.label}</div>
            </div>;
          })}
        </div>
      </div>
    </Background>
  );
};

const MatchupVersus: React.FC<{p: SportsHighlightsProps}> = ({p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const hit = spring({frame: frame - 8, fps, config: {damping: 10, stiffness: 170}});
  return (
    <AbsoluteFill style={{fontFamily: FONT, color: WHITE, background: INK, overflow: "hidden"}}>
      <div style={{position: "absolute", inset: 0, background: p.homeTeam.color, clipPath: "polygon(0 0, 61% 0, 43% 100%, 0 100%)", transform: `translateX(${(1 - hit) * -900}px)`}} />
      <div style={{position: "absolute", inset: 0, background: p.awayTeam.color, clipPath: "polygon(61% 0, 100% 0, 100% 100%, 43% 100%)", transform: `translateX(${(1 - hit) * 900}px)`}} />
      <div style={{position: "absolute", top: 70, width: "100%", textAlign: "center", fontSize: 26, fontWeight: 900, letterSpacing: 8}}>{p.subtitle}</div>
      <div style={{position: "absolute", left: 170, top: 280, textAlign: "center", width: 570, opacity: hit}}><div style={{display: "flex", justifyContent: "center"}}><TeamMark team={p.homeTeam} size={170} /></div><div style={{fontSize: 72, fontWeight: 900, marginTop: 36, textTransform: "uppercase"}}>{p.homeTeam.name}</div></div>
      <div style={{position: "absolute", right: 170, top: 280, textAlign: "center", width: 570, opacity: hit}}><div style={{display: "flex", justifyContent: "center"}}><TeamMark team={p.awayTeam} size={170} /></div><div style={{fontSize: 72, fontWeight: 900, marginTop: 36, textTransform: "uppercase"}}>{p.awayTeam.name}</div></div>
      <div style={{position: "absolute", left: "50%", top: "51%", width: 210, height: 210, borderRadius: "50%", display: "grid", placeItems: "center", background: WHITE, color: INK, fontSize: 75, fontStyle: "italic", fontWeight: 900, transform: `translate(-50%,-50%) scale(${hit}) rotate(${(1 - hit) * -40}deg)`, boxShadow: "0 20px 60px rgba(0,0,0,.4)"}}>VS</div>
      <div style={{position: "absolute", bottom: 75, width: "100%", textAlign: "center", fontSize: 31, fontWeight: 800, letterSpacing: 5}}>{p.title}</div>
    </AbsoluteFill>
  );
};

const ReplayTag: React.FC<{p: SportsHighlightsProps}> = ({p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const stamp = spring({frame: frame - 12, fps, config: {damping: 7, stiffness: 260, mass: 0.7}});
  const scan = (frame * 18) % 1180;
  return (
    <Background accent="#facc15">
      <div style={{position: "absolute", inset: 0, background: `linear-gradient(110deg, ${p.homeTeam.color}55, transparent 52%, ${p.awayTeam.color}44)`}} />
      <div style={{position: "absolute", left: 100, top: 78, display: "flex", alignItems: "center", gap: 16, fontSize: 22, fontWeight: 900, letterSpacing: 6}}><span style={{width: 14, height: 14, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 20px #ef4444"}} /> INSTANT REPLAY</div>
      <div style={{position: "absolute", top: scan - 80, left: 0, right: 0, height: 5, background: "linear-gradient(90deg, transparent, rgba(255,255,255,.7), transparent)", opacity: 0.4}} />
      <div style={{position: "absolute", inset: 180, border: "2px solid rgba(255,255,255,.18)", borderRadius: 30}}>
        <div style={{position: "absolute", left: "50%", top: "50%", transform: `translate(-50%,-50%) rotate(-7deg) scale(${1.8 - stamp * 0.8})`, opacity: stamp, border: "14px solid #facc15", padding: "35px 70px", color: "#facc15", fontSize: 122, lineHeight: 0.9, fontWeight: 900, letterSpacing: 10, textTransform: "uppercase", textShadow: "0 12px 30px rgba(0,0,0,.6)"}}>REPLAY</div>
      </div>
      <div style={{position: "absolute", left: 102, bottom: 76, fontSize: 34, fontWeight: 900}}>{p.title}</div>
      <div style={{position: "absolute", right: 102, bottom: 76, fontSize: 24, color: MUTED, fontWeight: 700}}>{p.homeTeam.name} {p.homeTeam.score} — {p.awayTeam.score} {p.awayTeam.name}</div>
    </Background>
  );
};

const TournamentBracket: React.FC<{p: SportsHighlightsProps}> = ({p}) => {
  const frame = useCurrentFrame();
  const names = p.stats.slice(0, 8).map((s) => s.team ?? String(s.value ?? s.label));
  while (names.length < 8) names.push(`Seed ${names.length + 1}`);
  const pair = (name: string, index: number, left: number, top: number, color: string) => {
    const t = enter(frame, 8 + index * 5, 15);
    return <div key={`${name}-${index}`} style={{position: "absolute", left, top, width: 330, height: 64, display: "flex", alignItems: "center", padding: "0 22px", background: "rgba(255,255,255,.08)", borderLeft: `7px solid ${color}`, borderRadius: 8, fontSize: 24, fontWeight: 800, opacity: t, transform: `translateX(${(1 - t) * -35}px)`}}>{name}</div>;
  };
  return (
    <Background accent={p.homeTeam.color}>
      <div style={{position: "absolute", left: 86, top: 62, fontSize: 48, fontWeight: 900, textTransform: "uppercase"}}>{p.title}</div>
      <div style={{position: "absolute", left: 88, top: 126, color: MUTED, fontSize: 20, fontWeight: 700, letterSpacing: 5}}>{p.subtitle}</div>
      <div style={{position: "absolute", inset: "190px 80px 70px"}}>
        <svg width="1760" height="790" style={{position: "absolute", inset: 0, opacity: enter(frame, 24, 30)}}>
          <g fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="4">
            {[0,1,2,3].map((i) => <path key={i} d={`M 330 ${44 + i * 180} H 420 V ${89 + Math.floor(i / 2) * 360} H 500`} />)}
            {[0,1,2,3].map((i) => <path key={i} d={`M 1430 ${44 + i * 180} H 1340 V ${89 + Math.floor(i / 2) * 360} H 1260`} />)}
            <path d="M 830 180 H 865 V 395 H 880 M 930 610 H 895 V 395 H 880" />
          </g>
        </svg>
        {names.slice(0, 4).map((n, i) => pair(n, i, 0, i * 180, i % 2 ? p.awayTeam.color : p.homeTeam.color))}
        {names.slice(4).map((n, i) => pair(n, i + 4, 1430, i * 180, i % 2 ? p.homeTeam.color : p.awayTeam.color))}
        {pair(names[0], 8, 500, 58, p.homeTeam.color)}
        {pair(names[2], 9, 500, 418, p.awayTeam.color)}
        {pair(names[4], 10, 930, 58, p.awayTeam.color)}
        {pair(names[6], 11, 930, 418, p.homeTeam.color)}
        <div style={{position: "absolute", left: 715, top: 310, width: 330, height: 150, borderRadius: 20, display: "grid", placeItems: "center", textAlign: "center", background: `linear-gradient(135deg, ${p.homeTeam.color}, ${p.awayTeam.color})`, transform: `scale(${enter(frame, 58, 18)})`}}><div><div style={{fontSize: 19, letterSpacing: 5, fontWeight: 800}}>CHAMPIONSHIP</div><div style={{fontSize: 36, marginTop: 12, fontWeight: 900}}>{names[0]} vs {names[4]}</div></div></div>
      </div>
    </Background>
  );
};

const LeagueStandings: React.FC<{p: SportsHighlightsProps}> = ({p}) => {
  const frame = useCurrentFrame();
  const rows = p.stats.slice(0, 7);
  return (
    <Background accent="#38bdf8">
      <div style={{position: "absolute", left: 150, right: 150, top: 74}}>
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "end"}}><div><div style={{fontSize: 24, color: "#38bdf8", fontWeight: 900, letterSpacing: 6}}>LEAGUE TABLE</div><div style={{fontSize: 62, fontWeight: 900, marginTop: 8}}>{p.title}</div></div><div style={{fontSize: 22, color: MUTED, fontWeight: 700}}>{p.subtitle}</div></div>
        <div style={{marginTop: 44, display: "grid", gridTemplateColumns: "90px 1fr 150px 150px 160px", padding: "20px 30px", color: MUTED, fontSize: 19, letterSpacing: 3, fontWeight: 800}}><div>POS</div><div>CLUB</div><div>PLAYED</div><div>WINS</div><div style={{textAlign: "right"}}>POINTS</div></div>
        <div style={{display: "flex", flexDirection: "column", gap: 9}}>
          {rows.map((row, i) => {
            const t = enter(frame, 8 + i * 5, 17);
            const featured = row.team === p.homeTeam.name;
            return <div key={`${row.team}-${i}`} style={{height: 91, display: "grid", alignItems: "center", gridTemplateColumns: "90px 1fr 150px 150px 160px", padding: "0 30px", borderRadius: 12, borderLeft: `6px solid ${featured ? p.homeTeam.color : "transparent"}`, background: featured ? `${p.homeTeam.color}35` : "rgba(255,255,255,.055)", fontSize: 25, opacity: t, transform: `translateX(${(1 - t) * 90}px)`}}><div style={{fontWeight: 900, color: i < 3 ? "#38bdf8" : WHITE}}>{i + 1}</div><div style={{fontWeight: 850}}>{row.team ?? row.label}</div><div>{row.played ?? "—"}</div><div>{row.wins ?? "—"}</div><div style={{textAlign: "right", fontSize: 34, fontWeight: 900}}>{row.points ?? row.value ?? "—"}</div></div>;
          })}
        </div>
      </div>
    </Background>
  );
};

const RecordBreaker: React.FC<{p: SportsHighlightsProps}> = ({p}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const burst = spring({frame: frame - 6, fps, config: {damping: 9, stiffness: 160}});
  const particles = Array.from({length: 84}, (_, i) => {
    const angle = seededRand(i * 11 + 5) * Math.PI * 2;
    const speed = 250 + seededRand(i * 17 + 9) * 760;
    const distance = Math.min(frame * 0.045, 1.5) * speed;
    const x = width / 2 + Math.cos(angle) * distance;
    const y = height / 2 + Math.sin(angle) * distance + frame * frame * 0.035;
    const color = [p.homeTeam.color, "#facc15", "#ffffff", "#22d3ee"][i % 4];
    return <div key={i} style={{position: "absolute", left: x, top: y, width: 8 + seededRand(i + 31) * 16, height: 5 + seededRand(i + 44) * 10, background: color, transform: `rotate(${frame * (i % 2 ? 9 : -7) + i * 19}deg)`, opacity: interpolate(frame, [5, 80], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}} />;
  });
  return (
    <Background accent="#facc15">
      {particles}
      <div style={{position: "absolute", left: -90, right: -90, top: "50%", height: 460, transform: `translateY(-50%) rotate(-3deg) scaleX(${burst})`, background: `linear-gradient(100deg, ${p.homeTeam.color}, #facc15)`, boxShadow: "0 30px 80px rgba(0,0,0,.45)"}} />
      <div style={{position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center", transform: `scale(${0.7 + burst * 0.3})`, opacity: burst}}>
        <div><div style={{fontSize: 31, letterSpacing: 12, fontWeight: 900}}>NEW RECORD</div><div style={{fontSize: 170, lineHeight: 0.95, fontWeight: 900, textTransform: "uppercase", marginTop: 30}}>{p.title}</div><div style={{fontSize: 45, fontWeight: 800, marginTop: 28}}>{p.subtitle}</div></div>
      </div>
    </Background>
  );
};

const HalftimeStats: React.FC<{p: SportsHighlightsProps}> = ({p}) => {
  const frame = useCurrentFrame();
  return (
    <Background accent={p.awayTeam.color}>
      <div style={{position: "absolute", left: 110, right: 110, top: 62, display: "flex", justifyContent: "space-between", alignItems: "center"}}><TeamMark team={p.homeTeam} size={88} /><div style={{textAlign: "center"}}><div style={{fontSize: 22, fontWeight: 900, letterSpacing: 8, color: MUTED}}>HALF TIME</div><div style={{fontSize: 83, fontWeight: 900, marginTop: 8}}>{p.homeTeam.score}<span style={{padding: "0 34px", color: MUTED}}>—</span>{p.awayTeam.score}</div></div><TeamMark team={p.awayTeam} size={88} /></div>
      <div style={{position: "absolute", left: 210, right: 210, top: 275, bottom: 100, padding: "38px 70px", borderRadius: 30, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)"}}>
        <div style={{display: "grid", gridTemplateColumns: "1fr 220px 1fr", fontSize: 25, fontWeight: 900, marginBottom: 30}}><div>{p.homeTeam.name}</div><div /><div style={{textAlign: "right"}}>{p.awayTeam.name}</div></div>
        {p.stats.slice(0, 6).map((stat, i) => {
          const t = enter(frame, 6 + i * 5, 19);
          const home = stat.home ?? 0;
          const away = stat.away ?? 0;
          const total = Math.max(home + away, 1);
          return <div key={`${stat.label}-${i}`} style={{marginBottom: 27, opacity: t}}><div style={{display: "grid", gridTemplateColumns: "1fr 220px 1fr", alignItems: "center", fontSize: 25, fontWeight: 800}}><div>{home}</div><div style={{textAlign: "center", color: MUTED, fontSize: 19, letterSpacing: 2, textTransform: "uppercase"}}>{stat.label}</div><div style={{textAlign: "right"}}>{away}</div></div><div style={{height: 11, background: `${p.awayTeam.color}aa`, borderRadius: 99, marginTop: 10, overflow: "hidden"}}><div style={{height: "100%", width: `${(home / total) * 100 * t}%`, background: p.homeTeam.color, borderRadius: 99}} /></div></div>;
        })}
      </div>
    </Background>
  );
};

const NextFixture: React.FC<{p: SportsHighlightsProps}> = ({p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const card = spring({frame: frame - 3, fps, config: {damping: 17, stiffness: 115}});
  return (
    <Background accent={p.homeTeam.color}>
      <div style={{position: "absolute", width: 1390, height: 690, left: "50%", top: "50%", transform: `translate(-50%,-50%) scale(${0.86 + card * 0.14}) rotateX(${(1 - card) * 12}deg)`, opacity: card, borderRadius: 42, overflow: "hidden", background: "rgba(7,16,24,.86)", border: "1px solid rgba(255,255,255,.17)", boxShadow: "0 45px 100px rgba(0,0,0,.55)"}}>
        <div style={{height: 116, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 52px", background: `linear-gradient(90deg, ${p.homeTeam.color}, ${p.awayTeam.color})`}}><div style={{fontSize: 28, letterSpacing: 7, fontWeight: 900}}>UP NEXT</div><div style={{fontSize: 23, fontWeight: 800}}>{p.subtitle}</div></div>
        <div style={{height: 450, display: "grid", gridTemplateColumns: "1fr 230px 1fr", alignItems: "center", padding: "0 80px"}}>
          {[p.homeTeam, p.awayTeam].map((team, i) => <React.Fragment key={team.name}>{i === 1 ? <div style={{textAlign: "center"}}><div style={{fontSize: 53, fontWeight: 300}}>VS</div><div style={{marginTop: 23, fontSize: 19, color: MUTED, letterSpacing: 4}}>20:00</div></div> : null}<div style={{textAlign: "center"}}><div style={{display: "flex", justifyContent: "center"}}><TeamMark team={team} size={145} /></div><div style={{fontSize: 48, fontWeight: 900, textTransform: "uppercase", marginTop: 30}}>{team.name}</div></div></React.Fragment>)}
        </div>
        <div style={{height: 124, borderTop: "1px solid rgba(255,255,255,.12)", display: "grid", placeItems: "center", fontSize: 26, fontWeight: 800, letterSpacing: 4}}>{p.title}</div>
      </div>
    </Background>
  );
};

const VARIANTS: Record<SportsVariant, React.FC<{p: SportsHighlightsProps}>> = {
  "scoreboard-bug": ScoreboardBug,
  "final-score": FinalScore,
  "player-stat-card": PlayerStatCard,
  "matchup-versus": MatchupVersus,
  "replay-tag": ReplayTag,
  "tournament-bracket": TournamentBracket,
  "league-standings": LeagueStandings,
  "record-breaker": RecordBreaker,
  "halftime-stats": HalftimeStats,
  "next-fixture": NextFixture,
};

export const SportsHighlightsTemplate: React.FC<SportsHighlightsProps> = (props) => {
  const Variant = VARIANTS[props.variant] ?? ScoreboardBug;
  const { width, height } = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  return <AbsoluteFill style={{ overflow: "hidden" }}><div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${fit})`, transformOrigin: "center center" }}><Variant p={props} /></div></AbsoluteFill>;
};

const familyCast = (c: React.FC<SportsHighlightsProps>) => c as unknown as React.ComponentType<Record<string, unknown>>;

export const FAMILY_COMPONENTS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "sports-scoreboard-bug": familyCast(SportsHighlightsTemplate),
  "sports-final-score": familyCast(SportsHighlightsTemplate),
  "sports-player-stat-card": familyCast(SportsHighlightsTemplate),
  "sports-matchup-versus": familyCast(SportsHighlightsTemplate),
  "sports-replay-tag": familyCast(SportsHighlightsTemplate),
  "sports-tournament-bracket": familyCast(SportsHighlightsTemplate),
  "sports-league-standings": familyCast(SportsHighlightsTemplate),
  "sports-record-breaker": familyCast(SportsHighlightsTemplate),
  "sports-halftime-stats": familyCast(SportsHighlightsTemplate),
  "sports-next-fixture": familyCast(SportsHighlightsTemplate),
};
