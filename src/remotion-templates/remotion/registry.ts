import React from 'react';
import { COMPONENT_MAP } from './components';
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
import { RENDERCOMP_COMPONENTS } from './rendercomp/RenderCompFolder';

export const COMPOSITION_REGISTRY: Record<string, React.ComponentType<any>> = {
  ...COMPONENT_MAP,
  ...RENDERCOMP_COMPONENTS,
  OneMinuteMasterpiece,
  DocumentaryCollageScene,
  KineticCaptionsScene,
  KineticCaptionsHustle: KineticCaptionsScene,
  AudiogramWaveformScene,
  GlitchTextScene: GlitchText,
  CountdownIntroScene: CountdownIntro,
  DonutChartScene: DonutChart,
  AreaChartScene: AreaChart,
  CinematicDocumentaryScene: CinematicDocumentary,
  Theme3DGlassScene: Theme3DGlassThreeJS,
  TornDocumentClip,
  TornMultiVerseClip,
  CenaVivaStatement,
  CenaVivaChapter,
  ViralKineticHook,
  TypewriterQuote,
  SaaSMockup,
  StepProcessInfographic,
  TimelineInfographic,
  HandDrawnSketch,
  AnimatedChartInfographic,
  MorphCameraZoom,
  CircularProcessInfographic,
  SplitComparisonInfographic,
};

export const getCompositionForTemplate = (templateId?: string, compositionId?: string) => {
  if (templateId && COMPOSITION_REGISTRY[templateId]) {
    return COMPOSITION_REGISTRY[templateId];
  }
  if (compositionId && COMPOSITION_REGISTRY[compositionId]) {
    return COMPOSITION_REGISTRY[compositionId];
  }
  return COMPOSITION_REGISTRY['CircularProcessInfographic'] || ViralKineticHook;
};

