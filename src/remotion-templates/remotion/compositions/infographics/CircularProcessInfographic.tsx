import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface CircularStep {
  number: string;
  title: string;
  description: string;
  color: string;
}

export interface CircularProcessInfographicProps {
  mainTitle?: string;
  subtitle?: string;
  centerLabel?: string;
  steps?: CircularStep[];
}

const DEFAULT_STEPS: CircularStep[] = [
  { number: '01', title: 'Captação', description: 'Atração orgânica e mapeamento de sinais', color: '#38bdf8' },
  { number: '02', title: 'Retenção', description: 'Engajamento cirúrgico nos primeiros 3s', color: '#818cf8' },
  { number: '03', title: 'Conversão', description: 'Quebra de objeções e ancoragem de valor', color: '#4ade80' },
  { number: '04', title: 'Escala', description: 'Multiplicação automatizada do pipeline', color: '#f59e0b' },
];

export const CircularProcessInfographic: React.FC<CircularProcessInfographicProps> = ({
  mainTitle = 'O Ciclo Perpétuo de Atenção & Conversão',
  subtitle = 'ARQUITETURA CIRCULAR EM 4 FASES CONTÍNUAS',
  centerLabel = 'NÚCLEO 360°',
  steps = DEFAULT_STEPS,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  // Header animation
  const headerSpring = spring({ frame, fps, config: { damping: 14 } });
  const headerOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const headerY = interpolate(headerSpring, [0, 1], [-30, 0]);

  // Center ring rotation and scale
  const ringSpring = spring({ frame: frame - 10, fps, config: { damping: 16, stiffness: 60 } });
  const ringScale = interpolate(ringSpring, [0, 1], [0.4, 1]);
  const rotation = interpolate(frame, [0, 150], [0, 45]);

  // Coordinates for 4 circular quadrants (angles: -45, 45, 135, 225 deg)
  const radius = isVertical ? 220 : 250;
  const stepPositions = [
    { x: -radius, y: -radius * 0.65 }, // Top-Left
    { x: radius, y: -radius * 0.65 },  // Top-Right
    { x: radius, y: radius * 0.65 },   // Bottom-Right
    { x: -radius, y: radius * 0.65 },  // Bottom-Left
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#07090e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        fontFamily: "'Inter', sans-serif",
        overflow: 'hidden',
      }}
    >
      {/* Background Subtle Tech Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1.5px, transparent 0)',
          backgroundSize: '36px 36px',
        }}
      />

      {/* Header */}
      <div
        style={{
          position: 'absolute',
          top: isVertical ? '50px' : '60px',
          textAlign: 'center',
          transform: `translateY(${headerY}px)`,
          opacity: headerOpacity,
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontFamily: "'Courier Prime', monospace",
            fontSize: '12px',
            color: '#38bdf8',
            letterSpacing: '0.25em',
            fontWeight: 700,
            marginBottom: '8px',
          }}
        >
          {subtitle}
        </div>
        <h1
          style={{
            fontSize: isVertical ? '26px' : '34px',
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            margin: 0,
            textShadow: '0 4px 20px rgba(0,0,0,0.8)',
          }}
        >
          {mainTitle}
        </h1>
      </div>

      {/* Central Circular Structure */}
      <div
        style={{
          position: 'relative',
          width: '600px',
          height: '600px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: isVertical ? '40px' : '50px',
        }}
      >
        {/* Outer Rotating SVG Orbit Rings */}
        <svg
          style={{
            position: 'absolute',
            width: '460px',
            height: '460px',
            transform: `scale(${ringScale}) rotate(${rotation}deg)`,
            pointerEvents: 'none',
          }}
          viewBox="0 0 460 460"
        >
          <circle
            cx="230"
            cy="230"
            r="190"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="2"
            strokeDasharray="8 8"
          />
          <circle
            cx="230"
            cy="230"
            r="150"
            fill="none"
            stroke="rgba(56, 189, 248, 0.25)"
            strokeWidth="3"
            strokeDasharray="40 120"
          />
        </svg>

        {/* Central Core Glowing Hub */}
        <div
          style={{
            width: '130px',
            height: '130px',
            borderRadius: '50%',
            backgroundColor: '#0f172a',
            border: '2px solid rgba(56, 189, 248, 0.6)',
            boxShadow: '0 0 40px rgba(56, 189, 248, 0.25), inset 0 0 20px rgba(56, 189, 248, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5,
            transform: `scale(${ringScale})`,
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#38bdf8',
              marginBottom: '6px',
              boxShadow: '0 0 10px #38bdf8',
            }}
          />
          <span
            style={{
              fontFamily: "'Courier Prime', monospace",
              fontSize: '11px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '0.12em',
            }}
          >
            {centerLabel}
          </span>
        </div>

        {/* 4 Quadrant Steps */}
        {steps.map((step, idx) => {
          const pos = stepPositions[idx % stepPositions.length];
          const stepDelay = 18 + idx * 12;
          const stepSpring = spring({
            frame: frame - stepDelay,
            fps,
            config: { damping: 13, stiffness: 75 },
          });

          const stepScale = interpolate(stepSpring, [0, 1], [0.6, 1]);
          const stepOpacity = interpolate(frame - stepDelay, [0, 10], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                transform: `translate(${pos.x}px, ${pos.y}px) scale(${stepScale})`,
                opacity: stepOpacity,
                width: isVertical ? '190px' : '230px',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${step.color}40`,
                borderLeft: `4px solid ${step.color}`,
                borderRadius: '16px',
                padding: '16px',
                boxShadow: `0 10px 30px rgba(0, 0, 0, 0.5), 0 0 15px ${step.color}15`,
                zIndex: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span
                  style={{
                    fontFamily: "'Courier Prime', monospace",
                    fontSize: '13px',
                    fontWeight: 900,
                    color: step.color,
                    backgroundColor: `${step.color}18`,
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}
                >
                  {step.number}
                </span>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
                  {step.title}
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', lineHeight: 1.45 }}>
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

