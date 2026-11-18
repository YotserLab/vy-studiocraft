import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface SaaSMockupProps {
  appTitle?: string;
  tagline?: string;
  metricLabel?: string;
  metricValue?: string;
}

export const SaaSMockup: React.FC<SaaSMockupProps> = ({
  appTitle = 'studio.antigravity.ai',
  tagline = 'Automação Integral de Edição com Código Remotion',
  metricLabel = 'Crescimento de Retenção',
  metricValue = '+342%',
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  const spr = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const translateY = interpolate(spr, [0, 1], [60, 0]);
  const counterVal = Math.min(342, Math.floor(frame * 6));

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#030712',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isVertical ? '40px 20px' : '50px 80px',
      }}
    >
      <div
        style={{
          width: isVertical ? '96%' : '85%',
          maxWidth: '1100px',
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '24px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9)',
          overflow: 'hidden',
          transform: `translateY(${translateY}px)`,
        }}
      >
        {/* Browser header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid #1e293b',
            backgroundColor: '#0b1120',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#eab308' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
          </div>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '14px',
              color: '#64748b',
              backgroundColor: '#030712',
              padding: '4px 16px',
              borderRadius: '8px',
            }}
          >
            {appTitle}
          </div>
          <div style={{ width: '36px' }} />
        </div>

        {/* Content body */}
        <div style={{ padding: isVertical ? '30px 24px' : '48px 48px' }}>
          <h2
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: isVertical ? '28px' : '40px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              marginBottom: '14px',
            }}
          >
            {tagline}
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isVertical ? '1fr' : 'repeat(3, 1fr)',
              gap: '20px',
              marginTop: '36px',
            }}
          >
            <div
              style={{
                backgroundColor: '#1e293b',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid #334155',
              }}
            >
              <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>{metricLabel}</div>
              <div style={{ fontSize: '36px', fontWeight: 900, color: '#38bdf8' }}>
                +{counterVal}%
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#1e293b',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid #334155',
              }}
            >
              <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>Tempo de Render</div>
              <div style={{ fontSize: '36px', fontWeight: 900, color: '#4ade80' }}>
                7.5s
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#1e293b',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid #334155',
              }}
            >
              <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>Economia de Tokens</div>
              <div style={{ fontSize: '36px', fontWeight: 900, color: '#c084fc' }}>
                98.4%
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

