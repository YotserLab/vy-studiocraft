import React from "react";
import { Composition, Folder } from "remotion";

// ── Logo & Brand ──
import { BrushStrokeReveal, defaultBrushStrokeRevealProps } from "./components/brush-stroke-reveal/BrushStrokeReveal";
import { LogoBlurReveal, defaultLogoBlurRevealProps } from "./components/logo-blur-reveal/LogoBlurReveal";
import { LogoBounceDrop, defaultLogoBounceDropProps } from "./components/logo-bounce-drop/LogoBounceDrop";
import { LogoMaskWipe, defaultLogoMaskWipeProps } from "./components/logo-mask-wipe/LogoMaskWipe";
import { LogoSplitReveal, defaultLogoSplitRevealProps } from "./components/logo-split-reveal/LogoSplitReveal";
import { LogoStrokeDraw, defaultLogoStrokeDrawProps } from "./components/logo-stroke-draw/LogoStrokeDraw";
import { NeonSign, defaultNeonSignProps } from "./components/neon-sign/NeonSign";
import { ShatterReveal, defaultShatterRevealProps } from "./components/shatter-reveal/ShatterReveal";

// ── Text & Titles ──
import { BounceInHeadline, defaultBounceInHeadlineProps } from "./components/bounce-in-headline/BounceInHeadline";
import { ChapterTitle, defaultChapterTitleProps } from "./components/chapter-title/ChapterTitle";
import { FourToneMonoTitler, defaultFourToneMonoTitlerProps } from "./components/four-tone-mono-titler/FourToneMonoTitler";
import { GlitchText, defaultGlitchTextProps } from "./components/glitch-text/GlitchText";
import { GradientTextSweep, defaultGradientTextSweepProps } from "./components/gradient-text-sweep/GradientTextSweep";
import { KineticWordStack, defaultKineticWordStackProps } from "./components/kinetic-word-stack/KineticWordStack";
import { PixelTypewriterQuote, defaultPixelTypewriterQuoteProps } from "./components/pixel-typewriter-quote/PixelTypewriterQuote";
import { ScrambleText, defaultScrambleTextProps } from "./components/scramble-text/ScrambleText";
import { TextMaskReveal, defaultTextMaskRevealProps } from "./components/text-mask-reveal/TextMaskReveal";
import { Typewriter, defaultTypewriterProps } from "./components/typewriter/Typewriter";
import { WaveText, defaultWaveTextProps } from "./components/wave-text/WaveText";

// ── Transitions ──
import { CameraShake, defaultCameraShakeProps } from "./components/camera-shake/CameraShake";
import { CardFlipTransition, defaultCardFlipTransitionProps } from "./components/card-flip-transition/CardFlipTransition";
import { TransitionCircleWipe, defaultTransitionCircleWipeProps } from "./components/transition-circle-wipe/TransitionCircleWipe";
import { InkSpreadTransition, defaultInkSpreadTransitionProps } from "./components/ink-spread-transition/InkSpreadTransition";
import { FlipPageTransition, defaultFlipPageTransitionProps } from "./components/flip-page-transition/FlipPageTransition";
import { PixelMosaicTransition, defaultPixelMosaicTransitionProps } from "./components/pixel-mosaic-transition/PixelMosaicTransition";
import { SlideWipe, defaultSlideWipeProps } from "./components/slide-wipe/SlideWipe";
import { WhipPan, defaultWhipPanProps } from "./components/whip-pan/WhipPan";

// ── Data & Charts ──
import { BarChartAnim, defaultBarChartAnimProps } from "./components/bar-chart-anim/BarChartAnim";
import { LineChartAnim, defaultLineChartAnimProps } from "./components/line-chart-anim/LineChartAnim";
import { PouroverDripFillGauge, defaultPouroverDripFillGaugeProps } from "./components/pourover-drip-fill-gauge/PouroverDripFillGauge";
import { KpiCounter, defaultKpiCounterProps } from "./components/kpi-counter/KpiCounter";
import { PixelCandlestickOhlc, defaultPixelCandlestickOhlcProps } from "./components/pixel-candlestick-ohlc/PixelCandlestickOhlc";
import { RacingChart, defaultRacingChartProps } from "./components/racing-chart/RacingChart";

// ── Social & UI ──
import { CommunityChat, defaultCommunityChatProps } from "./components/community-chat/CommunityChat";
import { EndCard, defaultEndCardProps } from "./components/end-card/EndCard";
import { EyeReveal, defaultEyeRevealProps } from "./components/eye-reveal/EyeReveal";
import { LowerThirdGlassCard, defaultLowerThirdGlassCardProps } from "./components/lower-third-glass-card/LowerThirdGlassCard";
import { CharacterJumping, defaultCharacterJumpingProps } from "./components/character-jumping/CharacterJumping";
import { SocialReel, defaultSocialReelProps } from "./components/social-reel/SocialReel";
import { SplitScreen, defaultSplitScreenProps } from "./components/split-screen/SplitScreen";
import { ThinkingBubble, defaultThinkingBubbleProps } from "./components/thinking-bubble/ThinkingBubble";
import { WaveHello, defaultWaveHelloProps } from "./components/wave-hello/WaveHello";

// ── Loops & Backgrounds ──
import { BokehCircles, defaultBokehCirclesProps } from "./components/bokeh-circles/BokehCircles";
import { FireworksBurst, defaultFireworksBurstProps } from "./components/fireworks-burst/FireworksBurst";
import { LoopGridWave, defaultLoopGridWaveProps } from "./components/loop-grid-wave/LoopGridWave";
import { ParallaxPan, defaultParallaxPanProps } from "./components/parallax-pan/ParallaxPan";
import { PencilDraw, defaultPencilDrawProps } from "./components/pencil-draw/PencilDraw";
import { PixelWaterfallCycle, defaultPixelWaterfallCycleProps } from "./components/pixel-waterfall-cycle/PixelWaterfallCycle";
import { ParticleSnow, defaultParticleSnowProps } from "./components/particle-snow/ParticleSnow";
import { Starfield, defaultStarfieldProps } from "./components/starfield/Starfield";

const FPS = 30;

export const RENDERCOMP_COMPONENTS: Record<string, React.ComponentType<any>> = {
  'rc-brush-stroke-reveal': BrushStrokeReveal,
  'rc-logo-blur-reveal': LogoBlurReveal,
  'rc-logo-bounce-drop': LogoBounceDrop,
  'rc-logo-mask-wipe': LogoMaskWipe,
  'rc-logo-split-reveal': LogoSplitReveal,
  'rc-logo-stroke-draw': LogoStrokeDraw,
  'rc-neon-sign': NeonSign,
  'rc-shatter-reveal': ShatterReveal,
  'rc-bounce-in-headline': BounceInHeadline,
  'rc-chapter-title': ChapterTitle,
  'rc-four-tone-mono-titler': FourToneMonoTitler,
  'rc-glitch-text': GlitchText,
  'rc-gradient-text-sweep': GradientTextSweep,
  'rc-kinetic-word-stack': KineticWordStack,
  'rc-pixel-typewriter-quote': PixelTypewriterQuote,
  'rc-scramble-text': ScrambleText,
  'rc-text-mask-reveal': TextMaskReveal,
  'rc-typewriter': Typewriter,
  'rc-wave-text': WaveText,
  'rc-camera-shake': CameraShake,
  'rc-card-flip-transition': CardFlipTransition,
  'rc-transition-circle-wipe': TransitionCircleWipe,
  'rc-ink-spread-transition': InkSpreadTransition,
  'rc-flip-page-transition': FlipPageTransition,
  'rc-pixel-mosaic-transition': PixelMosaicTransition,
  'rc-slide-wipe': SlideWipe,
  'rc-whip-pan': WhipPan,
  'rc-bar-chart-anim': BarChartAnim,
  'rc-line-chart-anim': LineChartAnim,
  'rc-pourover-drip-fill-gauge': PouroverDripFillGauge,
  'rc-kpi-counter': KpiCounter,
  'rc-pixel-candlestick-ohlc': PixelCandlestickOhlc,
  'rc-racing-chart': RacingChart,
  'rc-community-chat': CommunityChat,
  'rc-end-card': EndCard,
  'rc-eye-reveal': EyeReveal,
  'rc-lower-third-glass-card': LowerThirdGlassCard,
  'rc-character-jumping': CharacterJumping,
  'rc-social-reel': SocialReel,
  'rc-split-screen': SplitScreen,
  'rc-thinking-bubble': ThinkingBubble,
  'rc-wave-hello': WaveHello,
  'rc-bokeh-circles': BokehCircles,
  'rc-fireworks-burst': FireworksBurst,
  'rc-loop-grid-wave': LoopGridWave,
  'rc-parallax-pan': ParallaxPan,
  'rc-pencil-draw': PencilDraw,
  'rc-pixel-waterfall-cycle': PixelWaterfallCycle,
  'rc-particle-snow': ParticleSnow,
  'rc-starfield': Starfield,
};

export const RenderCompFolder: React.FC = () => (
  <Folder name="RenderComp-50Templates">
    <Folder name="Logo-and-Brand">
      <Composition id="rc-brush-stroke-reveal" component={BrushStrokeReveal} durationInFrames={120} fps={FPS} width={1920} height={1080} defaultProps={defaultBrushStrokeRevealProps} />
      <Composition id="rc-logo-blur-reveal" component={LogoBlurReveal} durationInFrames={120} fps={FPS} width={1920} height={1080} defaultProps={defaultLogoBlurRevealProps} />
      <Composition id="rc-logo-bounce-drop" component={LogoBounceDrop} durationInFrames={90} fps={FPS} width={1920} height={1080} defaultProps={defaultLogoBounceDropProps} />
      <Composition id="rc-logo-mask-wipe" component={LogoMaskWipe} durationInFrames={100} fps={FPS} width={1920} height={1080} defaultProps={defaultLogoMaskWipeProps} />
      <Composition id="rc-logo-split-reveal" component={LogoSplitReveal} durationInFrames={120} fps={FPS} width={1920} height={1080} defaultProps={defaultLogoSplitRevealProps} />
      <Composition id="rc-logo-stroke-draw" component={LogoStrokeDraw} durationInFrames={110} fps={FPS} width={1920} height={1080} defaultProps={defaultLogoStrokeDrawProps} />
      <Composition id="rc-neon-sign" component={NeonSign} durationInFrames={100} fps={FPS} width={1080} height={1080} defaultProps={defaultNeonSignProps} />
      <Composition id="rc-shatter-reveal" component={ShatterReveal} durationInFrames={120} fps={FPS} width={1920} height={1080} defaultProps={defaultShatterRevealProps} />
    </Folder>
    <Folder name="Text-and-Titles">
      <Composition id="rc-bounce-in-headline" component={BounceInHeadline} durationInFrames={120} fps={FPS} width={1920} height={1080} defaultProps={defaultBounceInHeadlineProps} />
      <Composition id="rc-chapter-title" component={ChapterTitle} durationInFrames={150} fps={FPS} width={1920} height={1080} defaultProps={defaultChapterTitleProps} />
      <Composition id="rc-four-tone-mono-titler" component={FourToneMonoTitler} durationInFrames={120} fps={FPS} width={1920} height={1080} defaultProps={defaultFourToneMonoTitlerProps} />
      <Composition id="rc-glitch-text" component={GlitchText} durationInFrames={120} fps={FPS} width={1920} height={1080} defaultProps={defaultGlitchTextProps} />
      <Composition id="rc-gradient-text-sweep" component={GradientTextSweep} durationInFrames={110} fps={FPS} width={1920} height={1080} defaultProps={defaultGradientTextSweepProps} />
      <Composition id="rc-kinetic-word-stack" component={KineticWordStack} durationInFrames={120} fps={FPS} width={1920} height={1080} defaultProps={defaultKineticWordStackProps} />
      <Composition id="rc-pixel-typewriter-quote" component={PixelTypewriterQuote} durationInFrames={180} fps={FPS} width={1920} height={1080} defaultProps={defaultPixelTypewriterQuoteProps} />
      <Composition id="rc-scramble-text" component={ScrambleText} durationInFrames={150} fps={FPS} width={1920} height={1080} defaultProps={defaultScrambleTextProps} />
      <Composition id="rc-text-mask-reveal" component={TextMaskReveal} durationInFrames={110} fps={FPS} width={1920} height={1080} defaultProps={defaultTextMaskRevealProps} />
      <Composition id="rc-typewriter" component={Typewriter} durationInFrames={100} fps={FPS} width={1080} height={1080} defaultProps={defaultTypewriterProps} />
      <Composition id="rc-wave-text" component={WaveText} durationInFrames={150} fps={FPS} width={1920} height={1080} defaultProps={defaultWaveTextProps} />
    </Folder>
    <Folder name="Transitions">
      <Composition id="rc-camera-shake" component={CameraShake} durationInFrames={120} fps={FPS} width={1920} height={1080} defaultProps={defaultCameraShakeProps} />
      <Composition id="rc-card-flip-transition" component={CardFlipTransition} durationInFrames={120} fps={FPS} width={1920} height={1080} defaultProps={defaultCardFlipTransitionProps} />
      <Composition id="rc-transition-circle-wipe" component={TransitionCircleWipe} durationInFrames={90} fps={FPS} width={1920} height={1080} defaultProps={defaultTransitionCircleWipeProps} />
      <Composition id="rc-ink-spread-transition" component={InkSpreadTransition} durationInFrames={120} fps={FPS} width={1920} height={1080} defaultProps={defaultInkSpreadTransitionProps} />
      <Composition id="rc-flip-page-transition" component={FlipPageTransition} durationInFrames={120} fps={FPS} width={1920} height={1080} defaultProps={defaultFlipPageTransitionProps} />
      <Composition id="rc-pixel-mosaic-transition" component={PixelMosaicTransition} durationInFrames={90} fps={FPS} width={1920} height={1080} defaultProps={defaultPixelMosaicTransitionProps} />
      <Composition id="rc-slide-wipe" component={SlideWipe} durationInFrames={120} fps={FPS} width={1920} height={1080} defaultProps={defaultSlideWipeProps} />
      <Composition id="rc-whip-pan" component={WhipPan} durationInFrames={120} fps={FPS} width={1920} height={1080} defaultProps={defaultWhipPanProps} />
    </Folder>
    <Folder name="Data-and-Charts">
      <Composition id="rc-bar-chart-anim" component={BarChartAnim} durationInFrames={150} fps={FPS} width={1920} height={1080} defaultProps={defaultBarChartAnimProps} />
      <Composition id="rc-line-chart-anim" component={LineChartAnim} durationInFrames={150} fps={FPS} width={1920} height={1080} defaultProps={defaultLineChartAnimProps} />
      <Composition id="rc-pourover-drip-fill-gauge" component={PouroverDripFillGauge} durationInFrames={180} fps={FPS} width={1920} height={1080} defaultProps={defaultPouroverDripFillGaugeProps} />
      <Composition id="rc-kpi-counter" component={KpiCounter} durationInFrames={120} fps={FPS} width={1920} height={1080} defaultProps={defaultKpiCounterProps} />
      <Composition id="rc-pixel-candlestick-ohlc" component={PixelCandlestickOhlc} durationInFrames={180} fps={FPS} width={1920} height={1080} defaultProps={defaultPixelCandlestickOhlcProps} />
      <Composition id="rc-racing-chart" component={RacingChart} durationInFrames={210} fps={FPS} width={1920} height={1080} defaultProps={defaultRacingChartProps} />
    </Folder>
    <Folder name="Social-and-UI">
      <Composition id="rc-community-chat" component={CommunityChat} durationInFrames={270} fps={FPS} width={1080} height={1920} defaultProps={defaultCommunityChatProps} />
      <Composition id="rc-end-card" component={EndCard} durationInFrames={150} fps={FPS} width={1920} height={1080} defaultProps={defaultEndCardProps} />
      <Composition id="rc-eye-reveal" component={EyeReveal} durationInFrames={90} fps={FPS} width={1080} height={1080} defaultProps={defaultEyeRevealProps} />
      <Composition id="rc-lower-third-glass-card" component={LowerThirdGlassCard} durationInFrames={120} fps={FPS} width={1920} height={1080} defaultProps={defaultLowerThirdGlassCardProps} />
      <Composition id="rc-character-jumping" component={CharacterJumping} durationInFrames={120} fps={FPS} width={1080} height={1080} defaultProps={defaultCharacterJumpingProps} />
      <Composition id="rc-social-reel" component={SocialReel} durationInFrames={150} fps={FPS} width={1920} height={1080} defaultProps={defaultSocialReelProps} />
      <Composition id="rc-split-screen" component={SplitScreen} durationInFrames={150} fps={FPS} width={1920} height={1080} defaultProps={defaultSplitScreenProps} />
      <Composition id="rc-thinking-bubble" component={ThinkingBubble} durationInFrames={120} fps={FPS} width={1080} height={1080} defaultProps={defaultThinkingBubbleProps} />
      <Composition id="rc-wave-hello" component={WaveHello} durationInFrames={90} fps={FPS} width={1080} height={1080} defaultProps={defaultWaveHelloProps} />
    </Folder>
    <Folder name="Loops-and-Backgrounds">
      <Composition id="rc-bokeh-circles" component={BokehCircles} durationInFrames={150} fps={FPS} width={1920} height={1080} defaultProps={defaultBokehCirclesProps} />
      <Composition id="rc-fireworks-burst" component={FireworksBurst} durationInFrames={110} fps={FPS} width={1080} height={1080} defaultProps={defaultFireworksBurstProps} />
      <Composition id="rc-loop-grid-wave" component={LoopGridWave} durationInFrames={90} fps={FPS} width={1920} height={1080} defaultProps={defaultLoopGridWaveProps} />
      <Composition id="rc-parallax-pan" component={ParallaxPan} durationInFrames={120} fps={FPS} width={1920} height={1080} defaultProps={defaultParallaxPanProps} />
      <Composition id="rc-pencil-draw" component={PencilDraw} durationInFrames={100} fps={FPS} width={1080} height={1080} defaultProps={defaultPencilDrawProps} />
      <Composition id="rc-pixel-waterfall-cycle" component={PixelWaterfallCycle} durationInFrames={180} fps={FPS} width={1080} height={1920} defaultProps={defaultPixelWaterfallCycleProps} />
      <Composition id="rc-particle-snow" component={ParticleSnow} durationInFrames={150} fps={FPS} width={1080} height={1080} defaultProps={defaultParticleSnowProps} />
      <Composition id="rc-starfield" component={Starfield} durationInFrames={150} fps={FPS} width={1920} height={1080} defaultProps={defaultStarfieldProps} />
    </Folder>
  </Folder>
);

