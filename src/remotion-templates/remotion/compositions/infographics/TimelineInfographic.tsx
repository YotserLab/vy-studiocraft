import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface TimelineEvent {
  year: string;
  title: string;
  detail: string;
  tag?: string;
}

export interface TimelineInfographicProps {
  heading?: string;
  subheading?: string;
  events?: TimelineEvent[];
}

const DEFAULT_EVENTS: TimelineEvent[] = [
  {
    year: '605 a.C.',
    title: 'Cativeiro Babilônico',
    detail: 'Início da dispersão e preservação dos manuscritos proféticos.',
    tag: 'IMPÉRIO NEOBABILÔNICO',
  },
  {
    year: '539 a.C.',
    title: 'Édito de Ciro',
    detail: 'Queda de Babilônia e autorização do retorno do remanescente.',
    tag: 'IMPÉRIO MEDO-PERSA',
  },
  {
    year: '331 a.C.',
    title: 'Ascensão Macedônica',
    detail: 'Disseminação da cultura helênica e tradução da Septuaginta.',
    tag: 'IMPÉRIO GREGO',
  },
  {
    year: '1947 d.C.',
    title: 'Manuscritos de Qumran',
    detail: 'Descoberta do Grande Rolo de Isaías intacto no Mar Morto.',
    tag: 'ARQUEOLOGIA MODERNA',
  },
];

export const TimelineInfographic: React.FC<TimelineInfographicProps> = ({
  heading = 'LINHA DO TEMPO HISTÓRICA',
  subheading = 'A Rota Arqueológica da Profecia',
  events = DEFAULT_EVENTS,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  // Title entrance
  const titleSpr = spring({ frame, fps, config: { damping: 14 } });
  const titleY = interpolate(titleSpr, [0, 1], [-25, 0]);
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  // Main timeline progress
  const lineProgress = interpolate(frame, [15, 90], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#090b10',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isVertical ? '40px 24px' : '50px 70px',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Background Grid Pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1px, transparent 0)',
          backgroundSize: '36px 36px',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: isVertical ? '30px' : '50px',
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontFamily: "'Courier Prime', monospace",
            fontSize: '14px',
            color: '#e5c07b',
            letterSpacing: '0.2em',
            marginBottom: '8px',
            fontWeight: 700,
          }}
        >
          {heading}
        </div>
        <h2
          style={{
            fontSize: isVertical ? '28px' : '42px',
            fontWeight: 900,
            color: '#ffffff',
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          {subheading}
        </h2>
      </div>

      {/* Timeline Section */}
      <div
        style={{
          width: '100%',
          maxWidth: '1200px',
          position: 'relative',
          padding: '20px 0',
        }}
      >
        {/* Horizontal Progress Track (desktop) */}
        {!isVertical && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '4%',
              right: '4%',
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              transform: 'translateY(-50%)',
              zIndex: 1,
            }}
          >
            <div
              style={{
                width: `${lineProgress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #d4af37, #f59e0b, #60a5fa)',
                boxShadow: '0 0 16px rgba(212, 175, 55, 0.7)',
              }}
            />
          </div>
        )}

        {/* Events Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isVertical ? '1fr' : `repeat(${events.length}, 1fr)`,
            gap: isVertical ? '24px' : '20px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {events.map((ev, i) => {
            const eventDelay = 18 + i * 18;
            const spr = spring({
              frame: frame - eventDelay,
              fps,
              config: { damping: 12, stiffness: 90 },
            });
            const opacity = interpolate(frame - eventDelay, [0, 10], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const translateY = interpolate(spr, [0, 1], [30, 0]);
            const isAbove = i % 2 === 0;

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: isVertical
                    ? 'row'
                    : isAbove
                    ? 'column'
                    : 'column-reverse',
                  alignItems: 'center',
                  opacity,
                  transform: `translateY(${translateY}px)`,
                  gap: '12px',
                }}
              >
                {/* Event Card */}
                <div
                  style={{
                    backgroundColor: '#111827',
                    border: '1px solid rgba(229, 192, 123, 0.25)',
                    borderRadius: '16px',
                    padding: '18px 16px',
                    textAlign: isVertical ? 'left' : 'center',
                    width: isVertical ? 'auto' : '100%',
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
                  }}
                >
                  {ev.tag && (
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '9.5px',
                        fontFamily: "'Courier Prime', monospace",
                        color: '#e5c07b',
                        backgroundColor: 'rgba(229, 192, 123, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        marginBottom: '8px',
                        fontWeight: 600,
                      }}
                    >
                      {ev.tag}
                    </span>
                  )}
                  <h4
                    style={{
                      fontSize: '16px',
                      fontWeight: 800,
                      color: '#ffffff',
                      margin: '0 0 6px 0',
                    }}
                  >
                    {ev.title}
                  </h4>
                  <p
                    style={{
                      fontSize: '12px',
                      lineHeight: 1.45,
                      color: '#94a3b8',
                      margin: 0,
                    }}
                  >
                    {ev.detail}
                  </p>
                </div>

                {/* Milestone Node on Line */}
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#030712',
                    border: '3px solid #d4af37',
                    boxShadow: '0 0 20px rgba(212, 175, 55, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 900,
                    color: '#e5c07b',
                    fontFamily: "'Courier Prime', monospace",
                    flexShrink: 0,
                  }}
                >
                  ●
                </div>

                {/* Date Label */}
                <div
                  style={{
                    fontFamily: "'Courier Prime', 'Roboto Mono', monospace",
                    fontSize: '15px',
                    fontWeight: 800,
                    color: '#d4af37',
                    letterSpacing: '0.05em',
                  }}
                >
                  {ev.year}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

