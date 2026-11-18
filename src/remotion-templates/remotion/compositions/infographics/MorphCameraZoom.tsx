import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface MorphCard {
  id: string;
  badge: string;
  title: string;
  quote: string;
  accentColor: string;
}

export interface MorphCameraZoomProps {
  overviewTitle?: string;
  cards?: MorphCard[];
}

const DEFAULT_CARDS: MorphCard[] = [
  {
    id: 'c1',
    badge: 'CAPÍTULO 1',
    title: 'A Promessa Inicial',
    quote: 'Não temas, porque eu sou contigo...',
    accentColor: '#e5c07b',
  },
  {
    id: 'c2',
    badge: 'CAPÍTULO 2',
    title: 'O Conflito Oculto',
    quote: 'Eis que envergonhados serão os que se indignaram...',
    accentColor: '#38bdf8',
  },
  {
    id: 'c3',
    badge: 'CAPÍTULO 3',
    title: 'A Vitória Definitiva',
    quote: 'Tornar-se-ão como o nada os que guerreiam contra ti.',
    accentColor: '#4ade80',
  },
];

export const MorphCameraZoom: React.FC<MorphCameraZoomProps> = ({
  overviewTitle = 'PANORAMA NARRATIVO • ZOOM MORFODINÂMICO',
  cards = DEFAULT_CARDS,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  // Phase 1 (0-40 frames): Overview camera
  // Phase 2 (40-90 frames): Morph Zoom-in on Card 2 (Center)
  // Phase 3 (90-130 frames): Morph Zoom-in on Card 3 (Right)

  const zoomSpring = spring({
    frame: frame - 35,
    fps,
    config: { damping: 15, mass: 1, stiffness: 70 },
  });

  const zoomScale = interpolate(zoomSpring, [0, 1], [1, 1.45]);
  const cameraX = interpolate(zoomSpring, [0, 1], [0, isVertical ? 0 : -80]);
  const cameraY = interpolate(zoomSpring, [0, 1], [0, isVertical ? -80 : 0]);

  const overviewOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#05070c',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Background Deep Grid */}
      <div
        style={{
          position: 'absolute',
          inset: '-20%',
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(229, 192, 123, 0.12) 1.5px, transparent 0)',
          backgroundSize: '40px 40px',
          transform: `scale(${zoomScale * 0.9}) translate(${cameraX * 0.3}px, ${cameraY * 0.3}px)`,
          transition: 'transform 0.1s linear',
        }}
      />

      {/* Top Floating Badge */}
      <div
        style={{
          position: 'absolute',
          top: '36px',
          fontFamily: "'Courier Prime', monospace",
          fontSize: '13px',
          color: '#e5c07b',
          letterSpacing: '0.2em',
          fontWeight: 700,
          opacity: overviewOpacity,
          zIndex: 20,
        }}
      >
        {overviewTitle}
      </div>

      {/* Zoomable Canvas */}
      <div
        style={{
          display: 'flex',
          flexDirection: isVertical ? 'column' : 'row',
          gap: '28px',
          transform: `scale(${zoomScale}) translate(${cameraX}px, ${cameraY}px)`,
          transformOrigin: 'center center',
          transition: 'transform 0.05s linear',
          zIndex: 10,
          width: '90%',
          maxWidth: '1200px',
          justifyContent: 'center',
        }}
      >
        {cards.map((card, i) => {
          const isFocal = i === 1; // Card 2 is the focal point of the zoom
          const cardSpr = spring({
            frame: frame - 10 - i * 8,
            fps,
            config: { damping: 13 },
          });

          return (
            <div
              key={card.id}
              style={{
                flex: 1,
                backgroundColor: isFocal ? '#0f172a' : '#090d16',
                border: `2px solid ${isFocal ? card.accentColor : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '24px',
                padding: '32px 24px',
                boxShadow: isFocal
                  ? `0 20px 50px ${card.accentColor}35, 0 0 30px ${card.accentColor}25`
                  : '0 10px 30px rgba(0, 0, 0, 0.6)',
                transform: `scale(${interpolate(cardSpr, [0, 1], [0.85, 1])})`,
                opacity: interpolate(cardSpr, [0, 1], [0, 1]),
                position: 'relative',
              }}
            >
              <div
                style={{
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: '11px',
                  color: card.accentColor,
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  marginBottom: '12px',
                }}
              >
                {card.badge}
              </div>

              <h3
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: '#ffffff',
                  margin: '0 0 12px 0',
                }}
              >
                {card.title}
              </h3>

              <p
                style={{
                  fontFamily: "'Lora', serif",
                  fontSize: '14.5px',
                  fontStyle: 'italic',
                  lineHeight: 1.5,
                  color: '#cbd5e1',
                  margin: 0,
                }}
              >
                "{card.quote}"
              </p>

              {isFocal && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '16px',
                    right: '20px',
                    fontSize: '10px',
                    fontFamily: "'Courier Prime', monospace",
                    color: card.accentColor,
                    backgroundColor: `${card.accentColor}15`,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontWeight: 700,
                  }}
                >
                  ● FOCO ZOOM
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

