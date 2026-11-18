import React from 'react';
import { Composition, Folder } from 'remotion';
import { TornDocumentClip } from './compositions/TornDocumentClip';
import { TornMultiVerseClip } from './compositions/TornMultiVerseClip';
import { CenaVivaStatement, CenaVivaChapter } from './compositions/CenaVivaDocumentary';
import { ViralKineticHook } from './compositions/ViralKineticHook';
import { TypewriterQuote } from './compositions/TypewriterQuote';
import { SaaSMockup } from './compositions/SaaSMockup';
import { StepProcessInfographic } from './compositions/infographics/StepProcessInfographic';
import { TimelineInfographic } from './compositions/infographics/TimelineInfographic';
import { HandDrawnSketch } from './compositions/infographics/HandDrawnSketch';
import { AnimatedChartInfographic } from './compositions/infographics/AnimatedChartInfographic';
import { MorphCameraZoom } from './compositions/infographics/MorphCameraZoom';
import { CircularProcessInfographic } from './compositions/infographics/CircularProcessInfographic';
import { SplitComparisonInfographic } from './compositions/infographics/SplitComparisonInfographic';
import { DocumentaryCollageScene } from './compositions/DocumentaryCollageScene';
import { OneMinuteMasterpiece } from './compositions/OneMinuteMasterpiece';
import { KineticCaptionsScene } from './compositions/KineticCaptionsScene';
import { AudiogramWaveformScene } from './compositions/AudiogramWaveformScene';
import GlitchText from './scenes/rve/glitch-text';
import CountdownIntro from './scenes/rve/countdown-intro';
import DonutChart from './scenes/rve/donut-chart';
import AreaChart from './scenes/rve/area-chart';
import { CinematicDocumentary } from './scenes/ae/scenes/CinematicAnimations/CinematicDocumentary';
import { Theme3DGlassThreeJS } from './scenes/ae/scenes/ThemeAnimations/Theme3DGlassThreeJS';
import { RenderCompFolder } from './rendercomp/RenderCompFolder';
import registryJson from './registry.json';
import { COMPONENT_MAP } from './components';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="AliAbassi-1000Templates">
        {(registryJson as any[]).map((t) => {
          const Comp = COMPONENT_MAP[t.id];
          if (!Comp) return null;
          return (
            <Composition
              key={t.id}
              id={t.id}
              component={Comp}
              durationInFrames={t.durationInFrames}
              fps={t.fps}
              width={t.width}
              height={t.height}
              defaultProps={t.defaultProps ?? {}}
            />
          );
        })}
      </Folder>

      <Folder name="CenaViva-Documentary">
        <Composition
          id="OneMinuteMasterpiece"
          component={OneMinuteMasterpiece}
          durationInFrames={1800}
          fps={30}
          width={1920}
          height={1080}
        />

        <Composition
          id="DocumentaryCollageScene"
          component={DocumentaryCollageScene}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            headline: 'O "NÃO" MAIS CARO DA HISTÓRIA',
            subheadline: 'Em 2000, a Blockbuster recusou comprar a Netflix por US$ 50 milhões.',
            badgeText: 'RECUSA DE US$ 50M',
            quoteText: '"Eles riram de nós na sala de reuniões." — Reed Hastings',
            yearLabel: 'ANO 2000 vs 2010',
            accentColor: '#f59e0b',
          }}
        />

        <Composition
          id="DocumentaryCollageSceneShorts"
          component={DocumentaryCollageScene}
          durationInFrames={150}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            headline: 'O "NÃO" MAIS CARO DA HISTÓRIA',
            subheadline: 'Em 2000, a Blockbuster recusou comprar a Netflix por US$ 50 milhões.',
            badgeText: 'RECUSA DE US$ 50M',
            quoteText: '"Eles riram de nós na sala de reuniões."',
            yearLabel: 'ANO 2000 vs 2010',
            accentColor: '#f59e0b',
          }}
        />

        <Composition
          id="TornDocumentClip"
          component={TornDocumentClip}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            topLabel: 'comunicado do conselho da NVIDIA',
            dateLabel: '8 de novembro de 2026',
            contextQuote:
              '...O conselho prioriza a segurança nacional e econômica dos EUA, que é primordial para os interesses da NVIDIA.',
            mainQuote:
              'Embora o conselho não tenha motivo para acreditar que a segurança nacional ou segredos da NVIDIA tenham sido comprometidos, a apuração vai examinar todas as informações disponíveis.',
            highlightedText: 'não tenha motivo para acreditar que a segurança nacional',
            paperColor: '#F2EDE4',
          }}
        />

        <Composition
          id="TornDocumentClipShorts"
          component={TornDocumentClip}
          durationInFrames={150}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            topLabel: 'comunicado do conselho da NVIDIA',
            dateLabel: '8 de novembro de 2026',
            contextQuote: '...O conselho prioriza a segurança nacional e econômica dos EUA.',
            mainQuote:
              'Embora o conselho não tenha motivo para acreditar que a segurança nacional ou segredos da NVIDIA tenham sido comprometidos.',
            highlightedText: 'não tenha motivo para acreditar',
            paperColor: '#F2EDE4',
          }}
        />

        <Composition
          id="TornMultiVerseClip"
          component={TornMultiVerseClip}
          durationInFrames={405}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            bookName: 'ISAÍAS',
            chapterNumber: 41,
            framesPerVerse: 135,
            transitionFrames: 18,
          }}
        />

        <Composition
          id="CenaVivaStatement"
          component={CenaVivaStatement}
          durationInFrames={120}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            phrase:
              'O maior risco não é errar rápido. É passar dez anos construindo a coisa errada com perfeita eficiência.',
            source: 'O Bobo de Wall Street — Ep. 14',
            accentColor: '#e5c07b',
          }}
        />

        <Composition
          id="CenaVivaChapter"
          component={CenaVivaChapter}
          durationInFrames={90}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            chapterNumber: 'PARTE 02',
            chapterTitle: 'A LIQUIDEZ OCULTA',
            subtitle: 'Como balanços maquiados enganaram reguladores por mais de uma década',
          }}
        />
      </Folder>

      <Folder name="Social-Kinetic">
        <Composition
          id="ViralKineticHook"
          component={ViralKineticHook}
          durationInFrames={90}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            title: 'PARE DE ROLAR AGORA!',
            subtitle: 'O segredo de vídeo que ninguém te contou sobre Remotion.',
            accentColor: '#f43f5e',
          }}
        />

        <Composition
          id="TypewriterQuote"
          component={TypewriterQuote}
          durationInFrames={120}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            quoteText: 'A simplicidade é o último grau de sofisticação.',
            author: 'Leonardo da Vinci',
            typingSpeed: 0.5,
          }}
        />

        <Composition
          id="SaaSMockup"
          component={SaaSMockup}
          durationInFrames={120}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            appTitle: 'studio.antigravity.ai',
            tagline: 'Automação Integral de Edição com Código Remotion',
            metricLabel: 'Crescimento de Retenção',
            metricValue: '+342%',
          }}
        />
      </Folder>

      <Folder name="PowerPoint-MotionGraphics">
        <Composition
          id="StepProcessInfographic"
          component={StepProcessInfographic}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="TimelineInfographic"
          component={TimelineInfographic}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="HandDrawnSketch"
          component={HandDrawnSketch}
          durationInFrames={120}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="AnimatedChartInfographic"
          component={AnimatedChartInfographic}
          durationInFrames={120}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="MorphCameraZoom"
          component={MorphCameraZoom}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="CircularProcessInfographic"
          component={CircularProcessInfographic}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="SplitComparisonInfographic"
          component={SplitComparisonInfographic}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
        />
      </Folder>

      <Folder name="Kinetic-Captions">
        <Composition
          id="KineticCaptionsScene"
          component={KineticCaptionsScene}
          durationInFrames={240}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            theme: 'beast',
            primaryColor: '#FFE81F',
            secondaryColor: '#FF2A6D',
            fontSize: 88,
            showSafeZone: true,
            title: 'Hormozi / MrBeast Captions',
          }}
        />
        <Composition
          id="KineticCaptionsHustle"
          component={KineticCaptionsScene}
          durationInFrames={240}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            theme: 'hustle',
            primaryColor: '#10B981',
            secondaryColor: '#F59E0B',
            fontSize: 84,
            showSafeZone: true,
            title: 'Hustle Kinetic Captions',
          }}
        />
      </Folder>

      <Folder name="Audiogram-Waveforms">
        <Composition
          id="AudiogramWaveformScene"
          component={AudiogramWaveformScene}
          durationInFrames={300}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            title: 'PODCAST: A Mente & O Algoritmo',
            subtitle: 'Episódio 42 • Como o feed manipula a dopamina diária',
            hostName: 'STUDIO CRIAÇÃO • ÁUDIO REATIVO',
            mode: 'bars',
            primaryColor: '#38bdf8',
            secondaryColor: '#818cf8',
            barCount: 48,
          }}
        />
      </Folder>

      <Folder name="ReactVideoEditor-Cenas">
        <Composition
          id="GlitchTextScene"
          component={GlitchText}
          durationInFrames={90}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="CountdownIntroScene"
          component={CountdownIntro}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="DonutChartScene"
          component={DonutChart}
          durationInFrames={120}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="AreaChartScene"
          component={AreaChart}
          durationInFrames={120}
          fps={30}
          width={1920}
          height={1080}
        />
      </Folder>

      <Folder name="AfterEffects-Cenas">
        <Composition
          id="CinematicDocumentaryScene"
          component={CinematicDocumentary}
          durationInFrames={120}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="Theme3DGlassScene"
          component={Theme3DGlassThreeJS}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            title: '3D GLASS MORPHISM',
            subtitle: 'Profundidade Procedural & Reflexos de Luz',
          }}
        />
      </Folder>

      <RenderCompFolder />
    </>
  );
};

