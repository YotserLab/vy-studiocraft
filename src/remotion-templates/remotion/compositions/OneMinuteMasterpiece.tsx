import React from 'react';
import { AbsoluteFill } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';

// Nossas composições autorais do estúdio
import { ViralKineticHook } from './ViralKineticHook';
import { DocumentaryCollageScene } from './DocumentaryCollageScene';
import { SplitComparisonInfographic } from './infographics/SplitComparisonInfographic';
import { AnimatedChartInfographic } from './infographics/AnimatedChartInfographic';
import { StepProcessInfographic } from './infographics/StepProcessInfographic';
import { CenaVivaStatement } from './CenaVivaDocumentary';
import { FilmTreatmentOverlay } from './FilmTreatmentOverlay';

/**
 * OneMinuteMasterpiece
 * Composição completa de 60 segundos exatos (1.800 frames a 30fps).
 * Estruturada conforme as diretrizes oficiais de multi-scene e TransitionSeries:
 * - 6 cenas narrativas interconectadas
 * - 5 transições elegantes com 15 frames de sobreposição cada
 * - 310 + 320 + 315 + 310 + 310 + 310 = 1.875 frames brutos - 75 frames de transição = 1.800 frames (60.0s)
 * - Cobertura global com FilmTreatmentOverlay para continuidade analógica
 */
export const OneMinuteMasterpiece: React.FC = () => {
  const transitionTiming = linearTiming({ durationInFrames: 15 });

  return (
    <AbsoluteFill style={{ backgroundColor: '#05060a' }}>
      <TransitionSeries>
        {/* CENA 1: Gancho Viral de Abertura (310 frames) */}
        <TransitionSeries.Sequence durationInFrames={310}>
          <ViralKineticHook
            title="A RECUSA HISTÓRICA"
            subtitle="O dia em que a maior locadora do planeta recusou a oferta de 50 milhões."
            accentColor="#ef4444"
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: 'from-right' })}
          timing={transitionTiming}
        />

        {/* CENA 2: O Embate Documental MoSidd / Colagem Forense (320 frames) */}
        <TransitionSeries.Sequence durationInFrames={320}>
          <DocumentaryCollageScene
            headline="NETFLIX vs BLOCKBUSTER"
            subheadline="Em setembro de 2000, Reed Hastings entrou na sede de Dallas com uma proposta irrecusável."
            badgeText="US$ 50 MILHÕES"
            quoteText='"Eles quase riram da nossa cara na sala de reuniões." — Marc Randolph'
            yearLabel="SETEMBRO 2000"
            accentColor="#f59e0b"
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={transitionTiming}
        />

        {/* CENA 3: Comparação de Modelos / Split Screen (315 frames) */}
        <TransitionSeries.Sequence durationInFrames={315}>
          <SplitComparisonInfographic
            categoryLabel="PARADIGMA"
            mainTitle="O Abismo Entre Dois Modelos"
            sideAName="Blockbuster (Físico)"
            sideBName="Netflix (Algoritmo)"
            sideAColor="#ef4444"
            sideBColor="#22c55e"
            features={[
              {
                label: 'Rede de Distribuição',
                sideA: '9.000 Lojas e Aluguéis Comerciais',
                sideB: 'Zero Lojas: Nuvem e Entrega Direta',
              },
              {
                label: 'Modelo de Receita',
                sideA: 'Multas Punitivas por Atraso',
                sideB: 'Assinatura Mensal Recorrente',
              },
              {
                label: 'Curadoria de Conteúdo',
                sideA: 'Prateleiras Limitadas ao Espaço Físico',
                sideB: 'Catálogo Ilimitado e Recomendação IA',
              },
            ]}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: 'from-bottom' })}
          timing={transitionTiming}
        />

        {/* CENA 4: A Métrica / Gráfico Animado de Desempenho (310 frames) */}
        <TransitionSeries.Sequence durationInFrames={310}>
          <AnimatedChartInfographic
            title="A Inversão Brutal de Valor de Mercado"
            tagline="Participação e valor relativo entre 2000 e os dias atuais"
            bars={[
              {
                label: 'Blockbuster (2000)',
                sublabel: 'Monopólio Global de Vídeo',
                value: 85,
                color: '#ef4444',
              },
              {
                label: 'Netflix (2000)',
                sublabel: 'Startup em Crescimento Inicial',
                value: 12,
                color: '#64748b',
              },
              {
                label: 'Blockbuster (2010)',
                sublabel: 'Falência e Colapso de 1.000 Lojas',
                value: 2,
                color: '#334155',
              },
              {
                label: 'Netflix (Hoje)',
                sublabel: 'Império de US$ 45 Bilhões/Ano',
                value: 98,
                color: '#22c55e',
              },
            ]}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={transitionTiming}
        />

        {/* CENA 5: As 4 Fases do Colapso / Step Process (310 frames) */}
        <TransitionSeries.Sequence durationInFrames={310}>
          <StepProcessInfographic
            categoryLabel="DIAGNÓSTICO SISTÊMICO"
            mainTitle="As 4 Fases da Cegueira Estratégica"
            steps={[
              {
                number: '01',
                title: 'Negação Absoluta',
                desc: 'Classificar o streaming como nicho passageiro de baixa qualidade.',
                color: '#38bdf8',
              },
              {
                number: '02',
                title: 'Dependência de Multas',
                desc: 'Incapacidade de abrir mão da receita punitiva de fitas atrasadas.',
                color: '#f59e0b',
              },
              {
                number: '03',
                title: 'Reação Tardia',
                desc: 'Tentativa de criar serviço online quando o caixa já estava drenado.',
                color: '#f43f5e',
              },
              {
                number: '04',
                title: 'Colapso Inevitável',
                desc: 'Declaração de falência em 2010 e fechamento em massa de 1.000 lojas.',
                color: '#ef4444',
              },
            ]}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: 'from-right' })}
          timing={transitionTiming}
        />

        {/* CENA 6: Conclusão / Editorial Statement (310 frames) */}
        <TransitionSeries.Sequence durationInFrames={310}>
          <CenaVivaStatement
            phrase="O maior perigo em tempos de turbulência não é a turbulência. É agir com a lógica do passado."
            source="Peter Drucker • Lições de Estratégia"
            accentColor="#e5c07b"
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Camada Unificadora de Textura de Película e Vignette */}
      <FilmTreatmentOverlay
        scanlinesOpacity={0.12}
        grainOpacity={0.1}
        vignetteStrength={0.4}
        gateWeave={true}
        cornerBlur={true}
        warmTint={true}
      />
    </AbsoluteFill>
  );
};
