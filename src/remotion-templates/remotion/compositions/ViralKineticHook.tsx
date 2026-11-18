import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface ViralKineticHookProps {
  title?: string;
  subtitle?: string;
  accentColor?: string;
  bgGradient?: string;
}

export const ViralKineticHook: React.FC<ViralKineticHookProps> = ({
  title = 'PARE DE ROLAR AGORA!',
  subtitle = 'O segredo de vídeo que ninguém te contou sobre Remotion.',
  accentColor = '#f43f5e',
  bgGradient = 'from-purple-950 via-slate-950 to-black',
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  const bounce = spring({
    frame,
    fps,
    config: { damping: 10, mass: 0.7, stiffness: 120 },
  });

  const pulse = 1 + Math.sin(frame * 0.25) * 0.03;
  const subtitleSlide = interpolate(frame, [15, 35], [40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const subtitleOpacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #030712 50%, #000000 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isVertical ? '40px 24px' : '60px 80px',
        textAlign: 'center',
      }}
    >
      {/* Dynamic glow orb */}
      <div
        style={{
          position: 'absolute',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: accentColor,
          filter: 'blur(120px)',
          opacity: 0.25,
          transform: `scale(${pulse})`,
        }}
      />

      <div
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: isVertical ? '54px' : '76px',
          fontWeight: 900,
          color: '#ffffff',
          letterSpacing: '-0.04em',
          transform: `scale(${bounce})`,
          textShadow: `0 10px 40px ${accentColor}80`,
          lineHeight: 1.1,
          maxWidth: '1100px',
          zIndex: 10,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: '32px',
          fontSize: isVertical ? '24px' : '28px',
          fontWeight: 600,
          color: '#e2e8f0',
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          padding: '14px 28px',
          backdropFilter: 'blur(16px)',
          transform: `translateY(${subtitleSlide}px)`,
          opacity: subtitleOpacity,
          maxWidth: '850px',
          lineHeight: 1.4,
          zIndex: 10,
        }}
      >
        ✨ {subtitle}
      </div>
    </AbsoluteFill>
  );
};

