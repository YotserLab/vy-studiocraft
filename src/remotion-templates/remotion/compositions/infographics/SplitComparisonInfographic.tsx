import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface ComparisonFeature {
  label: string;
  sideA: string;
  sideB: string;
}

export interface SplitComparisonInfographicProps {
  categoryLabel?: string;
  mainTitle?: string;
  sideAName?: string;
  sideBName?: string;
  sideAColor?: string;
  sideBColor?: string;
  features?: ComparisonFeature[];
}

const DEFAULT_FEATURES: ComparisonFeature[] = [
  { label: 'Estrutura de Custos', sideA: 'Custos Fixos Elevados e Inflação', sideB: 'Margem Líquida Exponencial & Código' },
  { label: 'Velocidade de Execução', sideA: 'Ciclos de Semanas / Equipes Lentas', sideB: 'Renderização Local em Milissegundos' },
  { label: 'Retenção da Audiência', sideA: 'Desengajamento após 10 segundos', sideB: '+78% de Retenção com Motion Reativo' },
  { label: 'Dependência Operacional', sideA: 'Gargalo em Softwares Proprietários', sideB: 'Autonomia Total com Código Aberto' },
];

export const SplitComparisonInfographic: React.FC<SplitComparisonInfographicProps> = ({
  categoryLabel = 'AUDITORIA COMPARATIVA • ARQUITETURA DE MÍDIA',
  mainTitle = 'Modelo Convencional vs Pipeline Remotion',
  sideAName = 'PRODUÇÃO MANUAL',
  sideBName = 'FÁBRICA AUTOMATIZADA',
  sideAColor = '#f43f5e',
  sideBColor = '#10b981',
  features = DEFAULT_FEATURES,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  // Header spring
  const headerSpr = spring({ frame, fps, config: { damping: 14 } });
  const headerOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const headerY = interpolate(headerSpr, [0, 1], [-25, 0]);

  // Split reveal spring
  const splitSpr = spring({ frame: frame - 10, fps, config: { damping: 15, stiffness: 70 } });
  const leftX = interpolate(splitSpr, [0, 1], [-120, 0]);
  const rightX = interpolate(splitSpr, [0, 1], [120, 0]);
  const splitOpacity = interpolate(frame - 10, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#07090e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isVertical ? '40px 20px' : '40px 60px',
        fontFamily: "'Inter', sans-serif",
        overflow: 'hidden',
      }}
    >
      {/* Background Subtle Gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 20%, rgba(30, 41, 59, 0.6), #07090e 70%)',
        }}
      />

      {/* Top Header */}
      <div
        style={{
          position: 'absolute',
          top: isVertical ? '40px' : '50px',
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
            color: '#e5c07b',
            letterSpacing: '0.2em',
            fontWeight: 700,
            marginBottom: '8px',
          }}
        >
          {categoryLabel}
        </div>
        <h1
          style={{
            fontSize: isVertical ? '24px' : '32px',
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          {mainTitle}
        </h1>
      </div>

      {/* Comparison Grid (Side A vs Side B) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isVertical ? '1fr' : '1fr 1fr',
          gap: isVertical ? '16px' : '32px',
          width: '100%',
          maxWidth: '1080px',
          marginTop: isVertical ? '100px' : '80px',
          zIndex: 5,
        }}
      >
        {/* Side A Card */}
        <div
          style={{
            backgroundColor: '#0f172a',
            border: `1px solid ${sideAColor}40`,
            borderTop: `4px solid ${sideAColor}`,
            borderRadius: '20px',
            padding: '24px',
            transform: `translateX(${leftX}px)`,
            opacity: splitOpacity,
            boxShadow: `0 15px 35px rgba(0,0,0,0.5)`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: sideAColor }} />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: sideAColor, letterSpacing: '0.05em' }}>
              {sideAName}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {features.map((item, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                }}
              >
                <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 600 }}>
                  {item.sideA}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Side B Card */}
        <div
          style={{
            backgroundColor: '#0f172a',
            border: `1px solid ${sideBColor}40`,
            borderTop: `4px solid ${sideBColor}`,
            borderRadius: '20px',
            padding: '24px',
            transform: `translateX(${rightX}px)`,
            opacity: splitOpacity,
            boxShadow: `0 15px 35px rgba(0,0,0,0.5), 0 0 25px ${sideBColor}15`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: sideBColor }} />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: sideBColor, letterSpacing: '0.05em' }}>
              {sideBName}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {features.map((item, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: `${sideBColor}0d`,
                  border: `1px solid ${sideBColor}25`,
                  borderRadius: '12px',
                  padding: '12px 14px',
                }}
              >
                <div style={{ fontSize: '10px', color: `${sideBColor}cc`, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 600 }}>
                  {item.sideB}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

