import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface TornDocumentClipProps {
  topLabel?: string;
  dateLabel?: string;
  contextQuote?: string;
  mainQuote?: string;
  highlightedText?: string;
  paperColor?: string;
  highlightColor?: string;
  fontFamily?: string;
  bgTheme?: 'dark' | 'transparent' | 'light';
}

export const TornDocumentClip: React.FC<TornDocumentClipProps> = ({
  topLabel = 'comunicado do conselho da NVIDIA',
  dateLabel = '8 de novembro de 2026',
  contextQuote = '...O conselho prioriza a segurança nacional e econômica dos EUA, que é primordial para os interesses da NVIDIA e de seus acionistas.',
  mainQuote = 'Embora o conselho não tenha motivo para acreditar que a segurança nacional ou segredos da NVIDIA tenham sido comprometidos, a apuração vai examinar todas as informações disponíveis.',
  highlightedText = 'não tenha motivo para acreditar que a segurança nacional',
  paperColor = '#F2EDE4',
  highlightColor = 'rgba(254, 240, 138, 0.85)',
  bgTheme = 'dark',
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  // Paper entrance animation
  const paperSpring = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.9, stiffness: 85 },
  });

  const translateY = interpolate(paperSpring, [0, 1], [60, 0]);
  const paperOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Highlighter animation (starts at frame 30)
  const highlightProgress = interpolate(frame, [30, 85], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Top labels fade in
  const labelOpacity = interpolate(frame, [8, 25], [0, 0.9], {
    extrapolateRight: 'clamp',
  });

  // Torn paper SVG clip-path
  const tornClipPath =
    'polygon(' +
    '0% 4%, 3% 1%, 7% 5%, 11% 2%, 15% 4%, 19% 1%, 23% 3%, 28% 1%, 32% 5%, 37% 2%, 42% 4%, 47% 1%, 52% 4%, 57% 2%, 62% 4%, 67% 1%, 72% 3%, 77% 1%, 82% 4%, 87% 2%, 92% 5%, 96% 2%, 100% 4%, ' +
    '99% 25%, 100% 50%, 99% 75%, 100% 96%, ' +
    '97% 98%, 93% 95%, 88% 99%, 84% 96%, 79% 98%, 75% 95%, 70% 98%, 66% 96%, 61% 99%, 56% 95%, 51% 98%, 46% 96%, 41% 99%, 36% 95%, 31% 98%, 26% 96%, 22% 99%, 17% 95%, 12% 98%, 8% 96%, 4% 99%, 0% 96%, ' +
    '1% 75%, 0% 50%, 1% 25%' +
    ')';

  // Highlight segment rendering
  const renderHighlightedContent = () => {
    if (!highlightedText || !mainQuote.includes(highlightedText)) {
      return <span>{mainQuote}</span>;
    }
    const parts = mainQuote.split(highlightedText);
    return (
      <>
        {parts[0]}
        <span
          style={{
            backgroundImage: `linear-gradient(to right, ${highlightColor} ${highlightProgress}%, transparent ${highlightProgress}%)`,
            backgroundRepeat: 'no-repeat',
            padding: '2px 6px',
            borderRadius: '4px',
            boxDecorationBreak: 'clone',
            WebkitBoxDecorationBreak: 'clone',
            transition: 'background-size 0.1s ease',
          }}
        >
          {highlightedText}
        </span>
        {parts.slice(1).join(highlightedText)}
      </>
    );
  };

  const isLight = bgTheme === 'light' || bgTheme === 'transparent';
  const bgColor = bgTheme === 'light' ? '#ffffff' : bgTheme === 'transparent' ? 'transparent' : '#0c0e12';
  const labelColor = isLight ? '#4b5563' : '#8c95a6';
  const paperShadow = isLight
    ? 'drop-shadow(0 22px 35px rgba(0, 0, 0, 0.18)) drop-shadow(0 8px 12px rgba(0, 0, 0, 0.10))'
    : 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.75))';

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isVertical ? '40px 30px' : '60px 100px',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Background vignette & subtle grain (only for dark mode) */}
      {!isLight && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.85) 100%)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Top documentary metadata */}
      <div
        style={{
          width: isVertical ? '92%' : '82%',
          marginBottom: '22px',
          opacity: labelOpacity,
          fontFamily: "'Courier Prime', 'Roboto Mono', monospace",
          color: labelColor,
          fontSize: isVertical ? '22px' : '20px',
          letterSpacing: '0.04em',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <div style={{ textTransform: 'lowercase', fontWeight: 600 }}>{topLabel}</div>
        <div style={{ fontSize: isVertical ? '18px' : '16px', opacity: 0.75 }}>{dateLabel}</div>
      </div>

      {/* Torn Paper Container */}
      <div
        style={{
          width: isVertical ? '94%' : '84%',
          transform: `translateY(${translateY}px) rotateZ(-0.4deg)`,
          opacity: paperOpacity,
          filter: paperShadow,
        }}
      >
        <div
          style={{
            backgroundColor: paperColor,
            clipPath: tornClipPath,
            padding: isVertical ? '50px 36px 55px 36px' : '55px 65px 60px 65px',
            color: '#1a1816',
          }}
        >
          {contextQuote && (
            <div
              style={{
                fontFamily: "'Lora', 'Merriweather', serif",
                fontSize: isVertical ? '22px' : '22px',
                color: '#5c544d',
                fontStyle: 'italic',
                lineHeight: 1.5,
                marginBottom: '24px',
              }}
            >
              {contextQuote}
            </div>
          )}

          <div
            style={{
              fontFamily: "'Lora', 'Merriweather', Georgia, serif",
              fontSize: isVertical ? '32px' : '36px',
              fontWeight: 700,
              lineHeight: 1.55,
              color: '#141210',
            }}
          >
            {renderHighlightedContent()}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

