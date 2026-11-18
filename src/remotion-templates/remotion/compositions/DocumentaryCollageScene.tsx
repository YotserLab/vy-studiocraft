import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { FilmTreatmentOverlay } from './FilmTreatmentOverlay';

export interface DocumentaryCollageProps {
  headline?: string;
  subheadline?: string;
  badgeText?: string;
  quoteText?: string;
  yearLabel?: string;
  accentColor?: string;
}

/**
 * DocumentaryCollageScene
 * Composição estilo documentário de colagem inspirada no método do MoSidd ("Netflix vs Blockbuster").
 * Implementa:
 * 1. Character Boil & Micro-Drift
 * 2. 2.5D Skewed Contact Shadow (Projeção no chão)
 * 3. Weld & Detach Camera Move (Desacoplamento de badge)
 * 4. Overhead Swinging Lamp com cone de luz e flicker
 * 5. Staggered Flying Newspaper Headings (Jornais voando de ângulos alternados)
 * 6. Film Treatment Sandwich (Scanlines + Grain + Vignette + Gate Weave)
 */
export const DocumentaryCollageScene: React.FC<DocumentaryCollageProps> = ({
  headline = 'O "NÃO" MAIS CARO DA HISTÓRIA',
  subheadline = 'Em 2000, a Blockbuster recusou comprar a Netflix por US$ 50 milhões.',
  badgeText = 'RECUSA DE US$ 50M',
  quoteText = '"Eles riram de nós na sala de reuniões." — Reed Hastings',
  yearLabel = 'ANO 2000 vs 2010',
  accentColor = '#f59e0b',
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // 1. Câmera lenta de aproximação (Ken Burns Push-in)
  const cameraScale = interpolate(frame, [0, 150], [1, 1.09], {
    extrapolateRight: 'clamp',
  });
  const cameraPanY = interpolate(frame, [0, 150], [0, -25], {
    extrapolateRight: 'clamp',
  });

  // 2. Balanço da Luminária Superior (Overhead Lamp Swing)
  const lampSwing = Math.sin(frame * 0.08) * 8.5; // graus de balanço
  const lampFlicker =
    frame > 20 && frame < 30
      ? (frame % 3 === 0 ? 0.6 : 1)
      : frame > 80 && frame < 86
      ? (frame % 2 === 0 ? 0.75 : 1)
      : 1;

  // 3. Character Boil & Micro-drift
  const boilX = Math.sin(frame * 0.25) * 1.5;
  const boilY = Math.cos(frame * 0.2) * 1.2;
  const boilRotate = Math.sin(frame * 0.15) * 0.4;

  // 4. Weld & Detach (Badge acompanha a câmera até o frame 45, depois descola com mola elástica)
  const detachSpring = spring({
    frame: Math.max(0, frame - 45),
    fps,
    config: { damping: 12, stiffness: 120 },
  });
  const badgeY = interpolate(detachSpring, [0, 1], [0, 35]);
  const badgeRotate = interpolate(detachSpring, [0, 1], [-2, 3]);
  const badgeScale = interpolate(detachSpring, [0, 1], [1, 1.06]);

  // 5. Staggered Flying Newspapers (3 recortes de jornal voando)
  // Jornal 1 (entra no frame 20)
  const paper1Spring = spring({
    frame: Math.max(0, frame - 20),
    fps,
    config: { damping: 14, stiffness: 90 },
  });
  const paper1X = interpolate(paper1Spring, [0, 1], [-800, -180]);
  const paper1Y = interpolate(paper1Spring, [0, 1], [400, 120]);
  const paper1Rot = interpolate(paper1Spring, [0, 1], [-45, -12]);
  const paper1Opacity = interpolate(paper1Spring, [0, 0.4, 1], [0, 1, 1]);

  // Jornal 2 (entra no frame 38, lado oposto)
  const paper2Spring = spring({
    frame: Math.max(0, frame - 38),
    fps,
    config: { damping: 13, stiffness: 85 },
  });
  const paper2X = interpolate(paper2Spring, [0, 1], [800, 220]);
  const paper2Y = interpolate(paper2Spring, [0, 1], [350, 40]);
  const paper2Rot = interpolate(paper2Spring, [0, 1], [40, 14]);
  const paper2Opacity = interpolate(paper2Spring, [0, 0.4, 1], [0, 1, 1]);

  // Jornal 3 (entra no frame 55, grande impacto frontal)
  const paper3Spring = spring({
    frame: Math.max(0, frame - 55),
    fps,
    config: { damping: 16, stiffness: 140 },
  });
  const paper3Scale = interpolate(paper3Spring, [0, 1], [2.2, 1]);
  const paper3Y = interpolate(paper3Spring, [0, 1], [-200, 240]);
  const paper3Rot = interpolate(paper3Spring, [0, 1], [15, -4]);
  const paper3Opacity = interpolate(paper3Spring, [0, 0.3, 1], [0, 1, 1]);

  // Entrada dos títulos principais
  const titleSpring = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 15, stiffness: 110 },
  });
  const titleY = interpolate(titleSpring, [0, 1], [60, 0]);
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0b10',
        color: '#f8fafc',
        fontFamily: '"Cinzel", "Times New Roman", Georgia, serif',
        overflow: 'hidden',
      }}
    >
      {/* Câmera Global com Ken Burns Pan & Zoom */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${cameraScale}) translateY(${cameraPanY}px)`,
          transformOrigin: 'center 60%',
        }}
      >
        {/* Background Vintage com Grid Documental e Textura de Parede */}
        <div
          style={{
            position: 'absolute',
            inset: -40,
            backgroundImage:
              'radial-gradient(circle at 50% 30%, #1e1e2d 0%, #0d0e15 65%, #050608 100%)',
          }}
        />

        {/* Linhas topográficas / grids de análise forense */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0.12,
          }}
        >
          <defs>
            <pattern
              id="forensic-grid"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 60 0 L 0 0 0 60"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="0.8"
                strokeDasharray="2,4"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#forensic-grid)" />
        </svg>

        {/* Cone de Luz da Luminária Superior (Luz Dinâmica com Flicker) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            width: '900px',
            height: '100%',
            transform: `translateX(-50%) rotate(${lampSwing * 0.4}deg)`,
            transformOrigin: 'top center',
            background:
              'conic-gradient(from 165deg at 50% 0%, transparent 0deg, rgba(254, 243, 199, 0.14) 15deg, rgba(254, 215, 170, 0.22) 25deg, rgba(254, 243, 199, 0.14) 35deg, transparent 50deg)',
            opacity: lampFlicker,
            pointerEvents: 'none',
            mixBlendMode: 'screen',
          }}
        />

        {/* Luminária Suspensa Balançando (Overhead Lamp Fixture) */}
        <div
          style={{
            position: 'absolute',
            top: -20,
            left: '50%',
            transform: `translateX(-50%) rotate(${lampSwing}deg)`,
            transformOrigin: 'top center',
            zIndex: 40,
          }}
        >
          {/* Fio da lâmpada */}
          <div
            style={{
              width: '3px',
              height: '160px',
              backgroundColor: '#334155',
              margin: '0 auto',
            }}
          />
          {/* Cúpula de metal da lâmpada */}
          <div
            style={{
              width: '110px',
              height: '55px',
              backgroundColor: '#1e293b',
              border: '2px solid #64748b',
              borderRadius: '55px 55px 4px 4px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
              position: 'relative',
              margin: '0 auto',
            }}
          >
            {/* Lâmpada incandescente brilhante */}
            <div
              style={{
                position: 'absolute',
                bottom: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: '#fef08a',
                boxShadow: `0 0 ${40 * lampFlicker}px #fef08a, 0 0 ${80 * lampFlicker}px #f59e0b`,
                opacity: lampFlicker,
              }}
            />
          </div>
        </div>

        {/* Cenário Central: Personagem + Sombra Projetada 2.5D (Contact Shadow) */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '16%',
            transform: `translateX(-50%) translate3d(${boilX}px, ${boilY}px, 0) rotate(${boilRotate}deg)`,
            zIndex: 25,
          }}
        >
          {/* Sombra 2.5D Skewed Projetada no Piso */}
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '42%',
              width: '280px',
              height: '460px',
              backgroundColor: '#000000',
              opacity: 0.72 * lampFlicker,
              transformOrigin: 'bottom center',
              transform: `skewX(${-(26 + lampSwing * 0.8)}deg) scaleY(0.32) scaleX(1.1)`,
              filter: 'blur(10px)',
              borderRadius: '240px 240px 10px 10px',
              zIndex: 1,
            }}
          />

          {/* Silhueta / Recorte de Personagem (Executivo / Investigação) */}
          <div
            style={{
              position: 'relative',
              width: '300px',
              height: '500px',
              zIndex: 2,
              filter: 'drop-shadow(0 15px 35px rgba(0,0,0,0.85))',
            }}
          >
            <svg
              viewBox="0 0 300 500"
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
              {/* Corpo / Terno estilizado preto com iluminação de recorte */}
              <defs>
                <linearGradient id="char-suit" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1e222d" />
                  <stop offset="50%" stopColor="#12151c" />
                  <stop offset="100%" stopColor="#08090d" />
                </linearGradient>
                <linearGradient id="rim-light" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={accentColor} stopOpacity="0.8" />
                  <stop offset="25%" stopColor={accentColor} stopOpacity="0" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.4" />
                </linearGradient>
              </defs>

              {/* Casaco / Ombros largos estilo anos 90/2000 */}
              <path
                d="M 60 210 Q 150 170 240 210 L 265 490 L 35 490 Z"
                fill="url(#char-suit)"
                stroke="url(#rim-light)"
                strokeWidth="2.5"
              />
              {/* Lapela do terno */}
              <path
                d="M 115 210 L 150 330 L 185 210 Z"
                fill="#0f1117"
                stroke="#334155"
                strokeWidth="1.5"
              />
              {/* Gravata bordô vintage */}
              <path d="M 143 230 L 157 230 L 162 380 L 150 410 L 138 380 Z" fill="#991b1b" />
              {/* Cabeça / Perfil sombrio */}
              <circle
                cx="150"
                cy="135"
                r="55"
                fill="#161922"
                stroke={accentColor}
                strokeWidth="2"
              />
              {/* Cabelo e óculos minimalistas */}
              <path
                d="M 100 130 Q 150 85 200 130 Q 150 105 100 130 Z"
                fill="#27272a"
              />
              <rect
                x="125"
                y="130"
                width="22"
                height="10"
                rx="2"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="2"
              />
              <rect
                x="155"
                y="130"
                width="22"
                height="10"
                rx="2"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="2"
              />
              <line x1="147" y1="135" x2="155" y2="135" stroke="#cbd5e1" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Weld & Detach Badge: Selo "A RECUSA DE US$ 50M" */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '52%',
            transform: `translateX(-50%) translateY(${badgeY}px) rotate(${badgeRotate}deg) scale(${badgeScale})`,
            zIndex: 35,
          }}
        >
          <div
            style={{
              backgroundColor: '#991b1b',
              border: `2px solid ${accentColor}`,
              color: '#ffffff',
              padding: '8px 24px',
              borderRadius: '6px',
              fontFamily: '"Cinzel", serif',
              fontSize: '18px',
              fontWeight: 800,
              letterSpacing: '3px',
              boxShadow: '0 12px 30px rgba(0,0,0,0.85), inset 0 0 15px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span style={{ color: accentColor }}>◆</span>
            {badgeText}
            <span style={{ color: accentColor }}>◆</span>
          </div>
        </div>

        {/* Staggered Flying Newspapers (3 recortes de manchetes) */}
        {/* Newspaper 1: Esquerda */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '32%',
            transform: `translate(${paper1X}px, ${paper1Y}px) rotate(${paper1Rot}deg)`,
            opacity: paper1Opacity,
            zIndex: 15,
            width: '320px',
            backgroundColor: '#e7e2d7',
            color: '#1a1815',
            padding: '16px 20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.85)',
            border: '1px solid #c4b5a0',
            fontFamily: '"Times New Roman", serif',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              letterSpacing: '1px',
              borderBottom: '1px solid #1a1815',
              paddingBottom: '3px',
              marginBottom: '6px',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>THE WALL STREET GAZETTE</span>
            <span>SEPTEMBER 2000</span>
          </div>
          <h4
            style={{
              fontSize: '17px',
              fontWeight: 900,
              lineHeight: 1.15,
              margin: '0 0 6px 0',
            }}
          >
            STARTUP PEDE US$ 50M; BLOCKBUSTER DIZ NÃO
          </h4>
          <p
            style={{
              fontSize: '11px',
              lineHeight: 1.3,
              margin: 0,
              color: '#44403c',
            }}
          >
            Proposta de aquisição de serviço de aluguel por correio é ignorada pelo conselho diretor.
          </p>
        </div>

        {/* Newspaper 2: Direita */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '26%',
            transform: `translate(${paper2X}px, ${paper2Y}px) rotate(${paper2Rot}deg)`,
            opacity: paper2Opacity,
            zIndex: 18,
            width: '340px',
            backgroundColor: '#f1ede4',
            color: '#1c1917',
            padding: '16px 20px',
            boxShadow: '0 25px 45px rgba(0,0,0,0.9)',
            border: '1px solid #d6cfc4',
            fontFamily: '"Times New Roman", serif',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              letterSpacing: '1px',
              borderBottom: '1px solid #1c1917',
              paddingBottom: '3px',
              marginBottom: '6px',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>FINANCIAL DISPATCH</span>
            <span>OCTOBER 2010</span>
          </div>
          <h4
            style={{
              fontSize: '18px',
              fontWeight: 900,
              lineHeight: 1.15,
              margin: '0 0 6px 0',
              color: '#991b1b',
            }}
          >
            BLOCKBUSTER DECLARA FALÊNCIA: 1.000 LOJAS FECHADAS
          </h4>
          <p
            style={{
              fontSize: '11px',
              lineHeight: 1.3,
              margin: 0,
              color: '#44403c',
            }}
          >
            Gigante de locadoras não resiste à transição digital e entra em recuperação judicial.
          </p>
        </div>

        {/* Newspaper 3: Central / Destaque de Impacto */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '20%',
            transform: `translateX(-50%) translateY(${paper3Y}px) rotate(${paper3Rot}deg) scale(${paper3Scale})`,
            opacity: paper3Opacity,
            zIndex: 22,
            width: '420px',
            backgroundColor: '#fffdf9',
            color: '#0f172a',
            padding: '20px 24px',
            boxShadow: '0 30px 60px rgba(0,0,0,0.95)',
            border: '2px solid #e2e8f0',
            fontFamily: '"Times New Roman", serif',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '2px',
              borderBottom: '2px solid #0f172a',
              paddingBottom: '4px',
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              color: '#dc2626',
            }}
          >
            <span>SPECIAL REPORT • MARKET DISRUPTION</span>
            <span>RECORD HIGH</span>
          </div>
          <h3
            style={{
              fontSize: '22px',
              fontWeight: 900,
              lineHeight: 1.15,
              margin: '0 0 8px 0',
            }}
          >
            HOJE: NETFLIX SUPERA US$ 45 BILHÕES EM FATURAMENTO
          </h3>
          <p
            style={{
              fontSize: '12px',
              lineHeight: 1.35,
              margin: 0,
              color: '#334155',
            }}
          >
            O serviço de streaming torna-se o maior império audiovisual do planeta após recusa histórica.
          </p>
        </div>

        {/* Rodapé / Lower-Third Cinematográfico */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '60px',
            right: '60px',
            zIndex: 50,
            transform: `translateY(${titleY}px)`,
            opacity: titleOpacity,
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(10, 12, 18, 0.88)',
              backdropFilter: 'blur(12px)',
              borderLeft: `4px solid ${accentColor}`,
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              padding: '18px 24px',
              borderRadius: '0 12px 12px 0',
              boxShadow: '0 15px 35px rgba(0,0,0,0.7)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '6px',
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  fontFamily: '"SFMono-Regular", Consolas, monospace',
                  color: accentColor,
                  fontWeight: 700,
                  letterSpacing: '1.5px',
                }}
              >
                {yearLabel}
              </span>
              <span style={{ color: '#475569' }}>•</span>
              <span
                style={{
                  fontSize: '11px',
                  color: '#94a3b8',
                  fontFamily: 'sans-serif',
                }}
              >
                ESTUDO DE CASO SISTÊMICO
              </span>
            </div>

            <h2
              style={{
                fontSize: '26px',
                fontWeight: 800,
                letterSpacing: '1px',
                margin: '0 0 6px 0',
                color: '#ffffff',
                fontFamily: '"Cinzel", serif',
              }}
            >
              {headline}
            </h2>

            <p
              style={{
                fontSize: '14px',
                color: '#cbd5e1',
                margin: '0 0 8px 0',
                fontFamily: 'sans-serif',
                lineHeight: 1.4,
              }}
            >
              {subheadline}
            </p>

            <div
              style={{
                fontSize: '12px',
                color: '#94a3b8',
                fontStyle: 'italic',
                fontFamily: '"Times New Roman", serif',
              }}
            >
              {quoteText}
            </div>
          </div>
        </div>
      </div>

      {/* Camada Global de Tratamento Analógico (Scanlines, Grain, Weave, Vignette) */}
      <FilmTreatmentOverlay
        scanlinesOpacity={0.16}
        grainOpacity={0.14}
        vignetteStrength={0.5}
        gateWeave={true}
        cornerBlur={true}
        warmTint={true}
      />
    </AbsoluteFill>
  );
};

