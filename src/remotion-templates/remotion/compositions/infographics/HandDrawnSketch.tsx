import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface HandDrawnSketchProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  lineColor?: string;
}

export const HandDrawnSketch: React.FC<HandDrawnSketchProps> = ({
  title = 'A Rota da Investigação Forense',
  subtitle = 'Conexões documentais que ligam transações ocultas ao banco central',
  badge = 'ESBOÇO FORENSE • ANÁLISE DE VÍNCULOS',
  lineColor = '#e5c07b',
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  // Drawing progress for primary and secondary strokes
  const strokeProgress1 = interpolate(frame, [10, 65], [1000, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const strokeProgress2 = interpolate(frame, [35, 85], [1000, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Nodes reveal
  const nodeSpring1 = spring({ frame: frame - 40, fps, config: { damping: 12 } });
  const nodeSpring2 = spring({ frame: frame - 60, fps, config: { damping: 12 } });
  const nodeSpring3 = spring({ frame: frame - 75, fps, config: { damping: 12 } });

  // Text title typewriter reveal
  const titleLetters = Math.min(title.length, Math.floor(frame * 0.8));
  const displayedTitle = title.slice(0, titleLetters);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0c0f17',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isVertical ? '40px 20px' : '50px 70px',
        fontFamily: "'Courier Prime', 'Roboto Mono', monospace",
        color: '#f8fafc',
      }}
    >
      {/* Chalkboard / Blackboard Vignette Texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.85) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Badge */}
      <div
        style={{
          fontSize: '13px',
          color: lineColor,
          letterSpacing: '0.22em',
          marginBottom: '12px',
          fontWeight: 700,
          opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      >
        {badge}
      </div>

      {/* Main Title Hand-written */}
      <h2
        style={{
          fontFamily: "'Lora', 'Merriweather', serif",
          fontSize: isVertical ? '28px' : '40px',
          fontWeight: 800,
          color: '#ffffff',
          textAlign: 'center',
          maxWidth: '900px',
          minHeight: '48px',
          margin: '0 0 8px 0',
        }}
      >
        {displayedTitle}
        <span
          style={{
            display: 'inline-block',
            width: '3px',
            height: '32px',
            backgroundColor: frame % 16 < 8 ? lineColor : 'transparent',
            marginLeft: '4px',
            verticalAlign: 'bottom',
          }}
        />
      </h2>

      <p
        style={{
          fontSize: '14px',
          color: '#94a3b8',
          textAlign: 'center',
          maxWidth: '750px',
          marginBottom: '40px',
          opacity: interpolate(frame, [20, 35], [0, 0.85], { extrapolateRight: 'clamp' }),
        }}
      >
        {subtitle}
      </p>

      {/* Hand-drawn SVG Network Diagram */}
      <div
        style={{
          width: '100%',
          maxWidth: '850px',
          height: isVertical ? '280px' : '320px',
          position: 'relative',
        }}
      >
        <svg
          viewBox="0 0 800 300"
          style={{
            width: '100%',
            height: '100%',
            overflow: 'visible',
          }}
        >
          {/* Connecting Curved Lines drawn with strokeDashoffset */}
          <path
            d="M 120 150 Q 250 40 400 150 T 680 150"
            fill="none"
            stroke={lineColor}
            strokeWidth="3.5"
            strokeDasharray="1000"
            strokeDashoffset={strokeProgress1}
            strokeLinecap="round"
          />

          <path
            d="M 120 150 Q 350 280 680 150"
            fill="none"
            stroke="rgba(255, 255, 255, 0.35)"
            strokeWidth="2"
            strokeDasharray="8 8"
            strokeDashoffset={strokeProgress2}
          />

          {/* Node 1 */}
          <g style={{ transform: `scale(${interpolate(nodeSpring1, [0, 1], [0, 1])})`, transformOrigin: '120px 150px' }}>
            <circle cx="120" cy="150" r="38" fill="#111827" stroke={lineColor} strokeWidth="3" />
            <text x="120" y="145" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">CONTA</text>
            <text x="120" y="162" textAnchor="middle" fill={lineColor} fontSize="10">ORIGEM</text>
          </g>

          {/* Node 2 */}
          <g style={{ transform: `scale(${interpolate(nodeSpring2, [0, 1], [0, 1])})`, transformOrigin: '400px 150px' }}>
            <circle cx="400" cy="150" r="46" fill="#111827" stroke="#60a5fa" strokeWidth="3.5" />
            <text x="400" y="145" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="bold">EMPRESA</text>
            <text x="400" y="163" textAnchor="middle" fill="#60a5fa" fontSize="11">FACHADA</text>
          </g>

          {/* Node 3 */}
          <g style={{ transform: `scale(${interpolate(nodeSpring3, [0, 1], [0, 1])})`, transformOrigin: '680px 150px' }}>
            <circle cx="680" cy="150" r="38" fill="#111827" stroke="#4ade80" strokeWidth="3" />
            <text x="680" y="145" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">DESTINO</text>
            <text x="680" y="162" textAnchor="middle" fill="#4ade80" fontSize="10">OFFSHORE</text>
          </g>
        </svg>
      </div>
    </AbsoluteFill>
  );
};
