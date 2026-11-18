import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, interpolateColors } from 'remotion';

export interface AudiogramWaveformProps {
  title?: string;
  subtitle?: string;
  hostName?: string;
  mode?: 'bars' | 'line' | 'circular';
  primaryColor?: string;
  secondaryColor?: string;
  barCount?: number;
  audioSrc?: string;
  avatarUrl?: string;
  showProgress?: boolean;
}

export const AudiogramWaveformScene: React.FC<AudiogramWaveformProps> = ({
  title = 'PODCAST: A Mente & O Algoritmo',
  subtitle = 'Episódio 42 • Como o feed manipula a dopamina diária',
  hostName = 'STUDIO CRIAÇÃO • ÁUDIO REATIVO',
  mode = 'bars',
  primaryColor = '#38bdf8',
  secondaryColor = '#818cf8',
  barCount = 48,
  avatarUrl,
  showProgress = true,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  // Procedural audio reactivity calculation (fallback & dynamic sync)
  const progress = frame / durationInFrames;
  const currentSeconds = Math.floor(frame / fps);
  const totalSeconds = Math.floor(durationInFrames / fps);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Avatar beat bounce
  const beat = (Math.sin(frame / 4) + Math.cos(frame / 6) + Math.sin(frame / 2.5)) / 3;
  const avatarScale = interpolate(beat, [-1, 1], [0.97, 1.05]);

  // Generate frequency bar heights procedurally
  const bars = Array.from({ length: barCount }, (_, i) => {
    const phase = (i / barCount) * Math.PI * 2;
    const wave1 = Math.sin(frame * 0.15 + phase * 2);
    const wave2 = Math.cos(frame * 0.08 - phase * 3);
    const wave3 = Math.sin(frame * 0.22 + phase);
    const rawVal = Math.abs(wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2);
    // Center bars tend to be higher (mid-range frequencies)
    const bellCurve = Math.sin((i / (barCount - 1)) * Math.PI);
    return Math.max(8, rawVal * 120 * (0.4 + bellCurve * 0.8));
  });

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at 50% 40%, #0f172a 0%, #020617 80%, #000000 100%)',
        color: '#ffffff',
        fontFamily: 'Inter, system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '80px 100px',
        overflow: 'hidden',
      }}
    >
      {/* Background ambient light */}
      <div
        style={{
          position: 'absolute',
          top: '35%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          height: 600,
          background: `radial-gradient(circle, ${primaryColor}22 0%, ${secondaryColor}11 50%, transparent 70%)`,
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      {/* Header Tag */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 24px',
          borderRadius: 999,
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(10px)',
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: primaryColor,
          textTransform: 'uppercase',
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#ef4444',
            boxShadow: '0 0 12px #ef4444',
            animation: 'pulse 1.5s infinite',
          }}
        />
        {hostName}
      </div>

      {/* Centerpiece: Reactive Avatar / Icon Disc */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 36,
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: 220,
            height: 220,
            borderRadius: '50%',
            padding: 8,
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            boxShadow: `0 0 50px ${primaryColor}44`,
            transform: `scale(${avatarScale})`,
            transition: 'transform 0.05s linear',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: '#090d16',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <svg width="84" height="84" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            )}
          </div>
        </div>

        {/* Titles */}
        <div style={{ textAlign: 'center', maxWidth: 1100 }}>
          <h1
            style={{
              fontSize: 52,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              margin: '0 0 16px 0',
              lineHeight: 1.15,
              background: `linear-gradient(to right, #ffffff, #e2e8f0, ${primaryColor})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: 26,
              color: '#94a3b8',
              margin: 0,
              fontWeight: 500,
            }}
          >
            {subtitle}
          </p>
        </div>
      </div>

      {/* Waveform Visualization (Bars or Line) */}
      <div
        style={{
          width: '100%',
          maxWidth: 1200,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          zIndex: 10,
        }}
      >
        {mode === 'bars' ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              height: 140,
              width: '100%',
            }}
          >
            {bars.map((h, idx) => {
              const barColor = interpolateColors(
                idx / barCount,
                [0, 0.5, 1],
                [primaryColor, '#38bdf8', secondaryColor]
              );
              return (
                <div
                  key={idx}
                  style={{
                    width: 10,
                    height: `${h}px`,
                    borderRadius: 999,
                    background: barColor,
                    boxShadow: `0 0 12px ${barColor}66`,
                    transition: 'height 0.05s ease',
                  }}
                />
              );
            })}
          </div>
        ) : (
          <svg
            viewBox="0 0 1000 120"
            style={{ width: '100%', height: 120, overflow: 'visible' }}
          >
            <path
              d={bars.reduce((acc, h, i) => {
                const x = (i / (bars.length - 1)) * 1000;
                const y = 60 + (i % 2 === 0 ? h / 2 : -h / 2);
                return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }, '')}
              fill="none"
              stroke={primaryColor}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`drop-shadow(0 0 10px ${primaryColor})`}
            />
          </svg>
        )}

        {/* Audio Progress Bar & Timestamps */}
        {showProgress && (
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              fontSize: 20,
              fontWeight: 600,
              color: '#64748b',
            }}
          >
            <span>{formatTime(currentSeconds)}</span>
            <div
              style={{
                flex: 1,
                height: 8,
                borderRadius: 999,
                background: 'rgba(255, 255, 255, 0.1)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: `${progress * 100}%`,
                  background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
                  borderRadius: 999,
                  boxShadow: `0 0 10px ${primaryColor}`,
                }}
              />
            </div>
            <span>{formatTime(totalSeconds)}</span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
