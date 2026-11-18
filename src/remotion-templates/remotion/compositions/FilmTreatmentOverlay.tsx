import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

export interface FilmTreatmentProps {
  scanlinesOpacity?: number;
  grainOpacity?: number;
  vignetteStrength?: number;
  gateWeave?: boolean;
  cornerBlur?: boolean;
  warmTint?: boolean;
}

/**
 * FilmTreatmentOverlay
 * Camadas analógicas cinematográficas inspiradas no workflow do MoSidd / Bobo de Wall Street.
 * Converte imagens digitais vetoriais e fotos em estética analógica (16mm / TV vintage / documental).
 */
export const FilmTreatmentOverlay: React.FC<FilmTreatmentProps> = ({
  scanlinesOpacity = 0.16,
  grainOpacity = 0.12,
  vignetteStrength = 0.45,
  gateWeave = true,
  cornerBlur = true,
  warmTint = true,
}) => {
  const frame = useCurrentFrame();

  // 1. Gate Weave: micro-tremulação analógica imperceptível de projetor de película
  const weaveX = gateWeave ? Math.sin(frame * 1.3) * 0.75 + Math.cos(frame * 0.7) * 0.35 : 0;
  const weaveY = gateWeave ? Math.cos(frame * 1.1) * 0.65 + Math.sin(frame * 0.8) * 0.25 : 0;
  const weaveRotate = gateWeave ? Math.sin(frame * 0.5) * 0.08 : 0;

  // 2. Grain seed dinâmico para animação de granulação quadro a quadro
  const grainSeed = (frame * 17) % 100;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        zIndex: 999,
        transform: `translate3d(${weaveX}px, ${weaveY}px, 0px) rotate(${weaveRotate}deg)`,
      }}
    >
      {/* Dynamic Animated Film Grain via SVG Procedural Turbulence */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: grainOpacity,
          mixBlendMode: 'overlay',
        }}
      >
        <filter id={`film-grain-${grainSeed}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="3"
            seed={grainSeed}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#film-grain-${grainSeed})`} />
      </svg>

      {/* CRT Scanlines (Linhas horizontais de 1.6px espaçadas) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: scanlinesOpacity,
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.9) 0px, rgba(0, 0, 0, 0.9) 1.6px, transparent 1.6px, transparent 3.2px)',
          backgroundSize: '100% 3.2px',
          mixBlendMode: 'multiply',
        }}
      />

      {/* Cinematic Vignette (Bordas escurecidas em radial gradient) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(5, 5, 8, ${vignetteStrength * 0.6}) 75%, rgba(0, 0, 0, ${vignetteStrength}) 100%)`,
          mixBlendMode: 'multiply',
        }}
      />

      {/* Corner Blur (Desfoque óptico periférico de lente vintage) */}
      {cornerBlur && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backdropFilter: 'blur(1.2px)',
            maskImage:
              'radial-gradient(ellipse at center, transparent 65%, black 100%)',
            WebkitMaskImage:
              'radial-gradient(ellipse at center, transparent 65%, black 100%)',
          }}
        />
      )}

      {/* Warm Analog Color Tint (Color grading sépia/âmbar suave de arquivo) */}
      {warmTint && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#d97706',
            opacity: 0.04,
            mixBlendMode: 'color',
          }}
        />
      )}
    </AbsoluteFill>
  );
};

