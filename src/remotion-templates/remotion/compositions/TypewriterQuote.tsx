import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

export interface TypewriterQuoteProps {
  quoteText?: string;
  author?: string;
  typingSpeed?: number; // chars per frame
}

export const TypewriterQuote: React.FC<TypewriterQuoteProps> = ({
  quoteText = 'A simplicidade é o último grau de sofisticação.',
  author = 'Leonardo da Vinci',
  typingSpeed = 0.5,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const isVertical = height > width;

  const currentChars = Math.min(
    quoteText.length,
    Math.floor(frame * typingSpeed)
  );
  const displayedText = quoteText.slice(0, currentChars);
  const isDoneTyping = currentChars >= quoteText.length;
  const cursorBlink = Math.floor(frame / 15) % 2 === 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0b0f19',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isVertical ? '50px 30px' : '60px 100px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: "'Courier Prime', 'Roboto Mono', monospace",
          fontSize: isVertical ? '34px' : '44px',
          lineHeight: 1.5,
          color: '#f8fafc',
          maxWidth: '1000px',
        }}
      >
        <span>"{displayedText}"</span>
        <span
          style={{
            display: 'inline-block',
            width: '12px',
            height: isVertical ? '34px' : '44px',
            backgroundColor: cursorBlink ? '#60a5fa' : 'transparent',
            marginLeft: '6px',
            verticalAlign: 'middle',
          }}
        />
      </div>

      {isDoneTyping && (
        <div
          style={{
            marginTop: '36px',
            fontFamily: "'Inter', sans-serif",
            fontSize: isVertical ? '20px' : '22px',
            color: '#94a3b8',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          — {author}
        </div>
      )}
    </AbsoluteFill>
  );
};

