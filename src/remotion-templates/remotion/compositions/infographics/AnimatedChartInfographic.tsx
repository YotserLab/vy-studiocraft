import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface ChartBarItem {
  label: string;
  sublabel: string;
  value: number; // 0 to 100
  color: string;
}

export interface AnimatedChartInfographicProps {
  title?: string;
  tagline?: string;
  bars?: ChartBarItem[];
}

const DEFAULT_BARS: ChartBarItem[] = [
  {
    label: 'Open Source / Linux',
    sublabel: 'Servidores de Nuvem Global',
    value: 92,
    color: '#4ade80',
  },
  {
    label: 'Big Tech Proprietary',
    sublabel: 'Sistemas Fechados Corporativos',
    value: 48,
    color: '#38bdf8',
  },
  {
    label: 'Legacy Mainframes',
    sublabel: 'Bancos e Governos Antigos',
    value: 23,
    color: '#f87171',
  },
];

export const AnimatedChartInfographic: React.FC<AnimatedChartInfographicProps> = ({
  title = 'A Verdadeira Infraestrutura do Planeta',
  tagline = 'Comparativo de Dependência Operacional dos Servidores Críticos',
  bars = DEFAULT_BARS,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  const headerSpr = spring({ frame, fps, config: { damping: 14 } });
  const headerOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const headerY = interpolate(headerSpr, [0, 1], [-25, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#07090e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isVertical ? '40px 24px' : '50px 80px',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'rgba(74, 222, 128, 0.06)',
          filter: 'blur(140px)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '48px',
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
        }}
      >
        <span
          style={{
            fontFamily: "'Courier Prime', monospace",
            fontSize: '13px',
            color: '#e5c07b',
            letterSpacing: '0.2em',
            fontWeight: 700,
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: '8px',
          }}
        >
          DADOS & ESTATÍSTICAS FORENSES
        </span>
        <h2
          style={{
            fontSize: isVertical ? '28px' : '38px',
            fontWeight: 900,
            color: '#ffffff',
            margin: '0 0 6px 0',
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontSize: isVertical ? '14px' : '15px',
            color: '#94a3b8',
            margin: 0,
          }}
        >
          {tagline}
        </p>
      </div>

      {/* Bars Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '920px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {bars.map((item, index) => {
          const val = typeof item.value === 'number' ? item.value : (typeof (item as any).percentage === 'number' ? (item as any).percentage : (typeof (item as any).percent === 'number' ? (item as any).percent : 50));
          const color = item.color || '#38bdf8';
          const sublabel = item.sublabel || (item as any).value || '';
          const barDelay = 15 + index * 12;
          const spr = spring({
            frame: frame - barDelay,
            fps,
            config: { damping: 14, stiffness: 80 },
          });

          const currentWidth = interpolate(spr, [0, 1], [0, val] as [number, number]);
          const currentCounter = Math.min(
            val,
            Math.floor((interpolate(spr, [0, 1], [0, val] as [number, number])) as number)
          );
          const opacity = interpolate(frame - barDelay, [0, 8], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          return (
            <div
              key={index}
              style={{
                backgroundColor: '#111827',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '18px',
                padding: '20px 24px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
                opacity,
              }}
            >
              {/* Row Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '10px',
                }}
              >
                <div>
                  <h4 style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    {item.label}
                  </h4>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {item.sublabel}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: "'Courier Prime', monospace",
                    fontSize: '28px',
                    fontWeight: 900,
                    color: item.color,
                  }}
                >
                  {currentCounter}%
                </div>
              </div>

              {/* Progress Track */}
              <div
                style={{
                  width: '100%',
                  height: '14px',
                  backgroundColor: '#1f2937',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: `${currentWidth}%`,
                    height: '100%',
                    backgroundColor: item.color,
                    borderRadius: '10px',
                    boxShadow: `0 0 15px ${item.color}80`,
                    transition: 'width 0.1s linear',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

