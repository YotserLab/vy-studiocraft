import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface CenaVivaStatementProps {
  phrase?: string;
  source?: string;
  accentColor?: string;
}

export const CenaVivaStatement: React.FC<CenaVivaStatementProps> = ({
  phrase = 'O maior risco não é errar rápido. É passar dez anos construindo a coisa errada com perfeita eficiência.',
  source = 'O Bobo de Wall Street — Ep. 14',
  accentColor = '#e5c07b',
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  const scale = spring({
    frame,
    fps,
    config: { damping: 15, mass: 0.8, stiffness: 70 },
  });

  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const sourceOpacity = interpolate(frame, [25, 45], [0, 0.75], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0c10',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isVertical ? '60px 40px' : '80px 140px',
        textAlign: 'center',
      }}
    >
      {/* Film grain / vignette overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, transparent 35%, rgba(0,0,0,0.92) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Decorative top quote icon */}
      <div
        style={{
          fontSize: isVertical ? '60px' : '72px',
          color: accentColor,
          opacity: 0.4,
          lineHeight: 1,
          marginBottom: '20px',
          fontFamily: 'serif',
        }}
      >
        “
      </div>

      <h1
        style={{
          fontFamily: "'Lora', 'Merriweather', Georgia, serif",
          fontSize: isVertical ? '38px' : '48px',
          fontWeight: 700,
          lineHeight: 1.45,
          color: '#f0ece1',
          maxWidth: '1200px',
          transform: `scale(${interpolate(scale, [0, 1], [0.95, 1])})`,
          opacity,
          letterSpacing: '-0.02em',
        }}
      >
        {phrase}
      </h1>

      <div
        style={{
          marginTop: '36px',
          fontFamily: "'Courier Prime', 'Roboto Mono', monospace",
          fontSize: isVertical ? '20px' : '18px',
          color: accentColor,
          opacity: sourceOpacity,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        — {source}
      </div>
    </AbsoluteFill>
  );
};

export interface CenaVivaChapterProps {
  chapterNumber?: string;
  chapterTitle?: string;
  subtitle?: string;
}

export const CenaVivaChapter: React.FC<CenaVivaChapterProps> = ({
  chapterNumber = 'PARTE 02',
  chapterTitle = 'A LIQUIDEZ OCULTA',
  subtitle = 'Como balanços maquiados enganaram reguladores por mais de uma década',
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  const spr = spring({
    frame,
    fps,
    config: { damping: 13, stiffness: 80 },
  });

  const translateY = interpolate(spr, [0, 1], [40, 0]);
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const lineScale = interpolate(frame, [15, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#090a0f',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isVertical ? '50px 30px' : '60px 80px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: "'Courier Prime', monospace",
          fontSize: isVertical ? '22px' : '20px',
          letterSpacing: '0.25em',
          color: '#e5c07b',
          opacity,
          marginBottom: '18px',
        }}
      >
        {chapterNumber}
      </div>

      <div
        style={{
          width: '80px',
          height: '2px',
          backgroundColor: '#e5c07b',
          transform: `scaleX(${lineScale})`,
          marginBottom: '26px',
        }}
      />

      <h1
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: isVertical ? '46px' : '64px',
          fontWeight: 900,
          color: '#ffffff',
          letterSpacing: '-0.03em',
          transform: `translateY(${translateY}px)`,
          opacity,
          maxWidth: '1100px',
          textTransform: 'uppercase',
        }}
      >
        {chapterTitle}
      </h1>

      <p
        style={{
          fontFamily: "'Lora', serif",
          fontSize: isVertical ? '22px' : '24px',
          color: '#9aa0a6',
          maxWidth: '850px',
          marginTop: '24px',
          lineHeight: 1.5,
          opacity: interpolate(frame, [25, 45], [0, 0.85], { extrapolateRight: 'clamp' }),
        }}
      >
        {subtitle}
      </p>
    </AbsoluteFill>
  );
};

