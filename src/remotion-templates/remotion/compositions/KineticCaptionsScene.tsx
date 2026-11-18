import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { CaptionTheme } from '../captions/CaptionTheme';
import { CaptionsData } from '../captions/types';

export interface KineticCaptionsProps {
  theme?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontSize?: number;
  showSafeZone?: boolean;
  background?: 'cinematic' | 'dark' | 'transparent' | 'gradient';
  title?: string;
  customData?: CaptionsData;
}

const DEFAULT_SAMPLE_DATA: CaptionsData = {
  lines: [
    {
      words: [
        { text: 'PARE', start: 0.1, end: 0.5, emphasis: true },
        { text: 'DE', start: 0.5, end: 0.7 },
        { text: 'ROLAR', start: 0.7, end: 1.2, emphasis: true },
        { text: 'AGORA!', start: 1.2, end: 1.8, emphasis: true },
      ],
    },
    {
      words: [
        { text: 'ESTE', start: 1.9, end: 2.2 },
        { text: 'É', start: 2.2, end: 2.4 },
        { text: 'O', start: 2.4, end: 2.6 },
        { text: 'SEGREDO', start: 2.6, end: 3.2, emphasis: true },
        { text: 'DA', start: 3.2, end: 3.4 },
        { text: 'RETENÇÃO', start: 3.4, end: 4.1, emphasis: true },
      ],
    },
    {
      words: [
        { text: 'CADA', start: 4.2, end: 4.5 },
        { text: 'PALAVRA', start: 4.5, end: 5.0, emphasis: true },
        { text: 'SINCRONIZADA', start: 5.0, end: 5.8, emphasis: true },
        { text: 'QUADRO', start: 5.8, end: 6.2 },
        { text: 'A', start: 6.2, end: 6.4 },
        { text: 'QUADRO.', start: 6.4, end: 7.2, emphasis: true },
      ],
    },
  ],
};

export const KineticCaptionsScene: React.FC<KineticCaptionsProps> = ({
  theme = 'beast',
  primaryColor = '#FFE81F',
  secondaryColor = '#FF2A6D',
  fontSize = 84,
  showSafeZone = false,
  background = 'cinematic',
  title = 'Motor de Legendas Cinéticas',
  customData,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const data = customData || DEFAULT_SAMPLE_DATA;

  // Background styling
  const bgStyles: Record<string, React.CSSProperties> = {
    cinematic: {
      background: 'radial-gradient(circle at center, #1e1b4b 0%, #0f172a 60%, #020617 100%)',
    },
    dark: {
      background: '#0a0a0c',
    },
    gradient: {
      background: 'linear-gradient(135deg, #18032e 0%, #0b0f19 50%, #031326 100%)',
    },
    transparent: {
      background: 'transparent',
    },
  };

  const glowOpacity = interpolate(
    Math.sin(frame / 12),
    [-1, 1],
    [0.15, 0.35]
  );

  return (
    <AbsoluteFill style={{ ...bgStyles[background], color: '#ffffff', overflow: 'hidden' }}>
      {/* Dynamic ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '70vw',
          height: '40vh',
          background: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)`,
          opacity: glowOpacity,
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />

      {/* Grid subtle texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          opacity: 0.6,
        }}
      />

      {/* Top Header Tag */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 24px',
          borderRadius: 999,
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(12px)',
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#cbd5e1',
          zIndex: 10,
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: primaryColor }} />
        {title} • Tema: {theme}
      </div>

      {/* Main Kinetic Captions Container */}
      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 8%',
          zIndex: 20,
        }}
      >
        <CaptionTheme
          theme={theme}
          data={data}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          fontSize={fontSize}
        />
      </AbsoluteFill>

      {/* Social Safe Zone Overlay guide (optional) */}
      {showSafeZone && (
        <div
          style={{
            position: 'absolute',
            top: height * 0.12,
            bottom: height * 0.18,
            left: width * 0.08,
            right: width * 0.08,
            border: '2px dashed rgba(239, 68, 68, 0.4)',
            borderRadius: 24,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            padding: 16,
            fontSize: 16,
            color: 'rgba(239, 68, 68, 0.7)',
            fontWeight: 600,
          }}
        >
          SAFE ZONE (TikTok / Reels / Shorts 9:16)
        </div>
      )}
    </AbsoluteFill>
  );
};

