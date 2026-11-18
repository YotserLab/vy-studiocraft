import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface StepItem {
  number: string;
  title: string;
  desc: string;
  color?: string;
}

export interface StepProcessInfographicProps {
  categoryLabel?: string;
  mainTitle?: string;
  steps?: StepItem[];
  bgStyle?: 'dark' | 'cena-viva';
}

const DEFAULT_STEPS: StepItem[] = [
  {
    number: '01',
    title: 'Origem Silenciosa',
    desc: 'Primeiros sinais negligenciados pelas instituições.',
    color: '#38bdf8',
  },
  {
    number: '02',
    title: 'A Escalada',
    desc: 'Ruptura das regras fiscais e sobrealavancagem.',
    color: '#fbbf24',
  },
  {
    number: '03',
    title: 'O Ponto de Ruptura',
    desc: 'Colapso repentino da liquidez no mercado.',
    color: '#f87171',
  },
  {
    number: '04',
    title: 'Nova Ordem',
    desc: 'Reestruturação inevitável e novos paradigmas.',
    color: '#4ade80',
  },
];

export const StepProcessInfographic: React.FC<StepProcessInfographicProps> = ({
  categoryLabel = 'INFOGRÁFICO DE PROCESSO • FLUXO ESTRATÉGICO',
  mainTitle = 'As 4 Fases do Ciclo Sistêmico',
  steps = DEFAULT_STEPS,
  bgStyle = 'dark',
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  // Header entrance
  const headerSpring = spring({ frame, fps, config: { damping: 15 } });
  const headerOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const headerY = interpolate(headerSpring, [0, 1], [-30, 0]);

  // Total connecting line progress
  const lineProgress = interpolate(frame, [15, 80], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgStyle === 'cena-viva' ? '#0a0d14' : '#030712',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isVertical ? '50px 30px' : '60px 80px',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Subtle radial ambient light */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 30%, rgba(56, 189, 248, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: isVertical ? '40px' : '60px',
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
        }}
      >
        <div
          style={{
            fontFamily: "'Courier Prime', 'Roboto Mono', monospace",
            fontSize: isVertical ? '14px' : '15px',
            color: '#e5c07b',
            letterSpacing: '0.18em',
            marginBottom: '10px',
            fontWeight: 600,
          }}
        >
          {categoryLabel}
        </div>
        <h1
          style={{
            fontSize: isVertical ? '34px' : '46px',
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '-0.03em',
            margin: 0,
          }}
        >
          {mainTitle}
        </h1>
      </div>

      {/* Process Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '1240px',
          position: 'relative',
        }}
      >
        {/* Horizontal Connector Line (desktop) */}
        {!isVertical && (
          <div
            style={{
              position: 'absolute',
              top: '36px',
              left: '8%',
              right: '8%',
              height: '3px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              zIndex: 1,
            }}
          >
            <div
              style={{
                width: `${lineProgress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #38bdf8, #fbbf24, #f87171, #4ade80)',
                boxShadow: '0 0 15px rgba(56, 189, 248, 0.6)',
              }}
            />
          </div>
        )}

        {/* Steps Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isVertical ? '1fr' : `repeat(${steps.length}, 1fr)`,
            gap: isVertical ? '20px' : '28px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {steps.map((step, idx) => {
            const stepDelay = 20 + idx * 16;
            const spr = spring({
              frame: frame - stepDelay,
              fps,
              config: { damping: 13, stiffness: 95 },
            });

            const scale = interpolate(spr, [0, 1], [0.8, 1]);
            const opacity = interpolate(frame - stepDelay, [0, 10], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const translateY = interpolate(spr, [0, 1], [40, 0]);

            const stepColor = step.color || '#38bdf8';
            const isActive = frame >= stepDelay + 15;

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: isVertical ? 'row' : 'column',
                  alignItems: isVertical ? 'flex-start' : 'center',
                  gap: '16px',
                  opacity,
                  transform: `translateY(${translateY}px) scale(${scale})`,
                }}
              >
                {/* Number Node */}
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    backgroundColor: '#0f172a',
                    border: `3px solid ${isActive ? stepColor : '#334155'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Courier Prime', monospace",
                    fontSize: '22px',
                    fontWeight: 900,
                    color: isActive ? '#ffffff' : '#94a3b8',
                    boxShadow: isActive ? `0 0 25px ${stepColor}60` : 'none',
                    transition: 'all 0.3s ease',
                    flexShrink: 0,
                  }}
                >
                  {step.number}
                </div>

                {/* Card Body */}
                <div
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '20px',
                    padding: '24px 20px',
                    textAlign: isVertical ? 'left' : 'center',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(12px)',
                    width: isVertical ? 'auto' : '100%',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      color: stepColor,
                      marginBottom: '8px',
                      marginTop: 0,
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '13.5px',
                      lineHeight: 1.5,
                      color: '#94a3b8',
                      margin: 0,
                    }}
                  >
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

