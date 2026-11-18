import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface MultiVerseItem {
  reference: string;
  contextText?: string;
  mainText: string;
  highlightText: string;
}

export interface TornMultiVerseClipProps {
  bookName?: string;
  chapterNumber?: number;
  verses?: MultiVerseItem[];
  framesPerVerse?: number;
  transitionFrames?: number;
}

const DEFAULT_VERSES: MultiVerseItem[] = [
  {
    reference: 'Isaías 41:10',
    contextText: '...Palavra de consolo ao povo aflito nas trevas:',
    mainText: 'Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.',
    highlightText: 'eu sou contigo; não te assombres, porque eu sou o teu Deus',
  },
  {
    reference: 'Isaías 41:11',
    contextText: '...Sobre aqueles que conspiram e se levantam:',
    mainText: 'Eis que envergonhados e confundidos serão todos os que se indignaram contra ti; tornar-se-ão em nada, e os que contenderem contigo perecerão.',
    highlightText: 'envergonhados e confundidos serão todos os que se indignaram',
  },
  {
    reference: 'Isaías 41:12',
    contextText: '...A vitória final garantida pelo Todo-Poderoso:',
    mainText: 'Buscá-los-ás, mas não os acharás, a eles que pelejavam contra ti; tornar-se-ão como o nada e como coisa que não é nada os que guerreiam contra ti.',
    highlightText: 'tornar-se-ão como o nada e como coisa que não é nada',
  },
];

export const TornMultiVerseClip: React.FC<TornMultiVerseClipProps> = ({
  bookName = 'ISAÍAS',
  chapterNumber = 41,
  verses = DEFAULT_VERSES,
  framesPerVerse = 135,
  transitionFrames = 18,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  const totalVerses = verses.length;
  const activeIndex = Math.min(
    Math.floor(frame / framesPerVerse),
    totalVerses - 1
  );
  const activeVerse = verses[activeIndex];
  const frameInVerse = frame - activeIndex * framesPerVerse;

  // Entrance spring
  const enterSpring = spring({
    frame: frameInVerse,
    fps,
    config: { damping: 14, mass: 0.9, stiffness: 85 },
  });

  const enterTranslateY = interpolate(enterSpring, [0, 1], [50, 0]);
  const enterOpacity = interpolate(frameInVerse, [0, 12], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Exit animation
  const isExiting = frameInVerse >= framesPerVerse - transitionFrames && activeIndex < totalVerses - 1;
  const exitProgress = isExiting
    ? (frameInVerse - (framesPerVerse - transitionFrames)) / transitionFrames
    : 0;

  const exitTranslateY = interpolate(exitProgress, [0, 1], [0, -45]);
  const exitTranslateX = interpolate(exitProgress, [0, 1], [0, -35]);
  const exitOpacity = interpolate(exitProgress, [0, 1], [1, 0]);
  const exitRotate = interpolate(exitProgress, [0, 1], [0, -2]);

  const currentTranslateY = enterTranslateY + exitTranslateY;
  const currentTranslateX = exitTranslateX;
  const currentOpacity = enterOpacity * exitOpacity;
  const currentRotate = -0.5 + exitRotate;

  // Highlighter progress
  const highlightProgress = interpolate(frameInVerse, [25, 75], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const tornClipPath =
    'polygon(' +
    '0% 4%, 3% 1%, 7% 5%, 11% 2%, 15% 4%, 19% 1%, 23% 3%, 28% 1%, 32% 5%, 37% 2%, 42% 4%, 47% 1%, 52% 4%, 57% 2%, 62% 4%, 67% 1%, 72% 3%, 77% 1%, 82% 4%, 87% 2%, 92% 5%, 96% 2%, 100% 4%, ' +
    '99% 25%, 100% 50%, 99% 75%, 100% 96%, ' +
    '97% 98%, 93% 95%, 88% 99%, 84% 96%, 79% 98%, 75% 95%, 70% 98%, 66% 96%, 61% 99%, 56% 95%, 51% 98%, 46% 96%, 41% 99%, 36% 95%, 31% 98%, 26% 96%, 22% 99%, 17% 95%, 12% 98%, 8% 96%, 4% 99%, 0% 96%, ' +
    '1% 75%, 0% 50%, 1% 25%' +
    ')';

  const renderHighlightedContent = (text: string, highlight: string) => {
    if (!highlight || !text.includes(highlight)) {
      return <span>{text}</span>;
    }
    const parts = text.split(highlight);
    return (
      <>
        {parts[0]}
        <span
          style={{
            backgroundImage: `linear-gradient(to right, rgba(254, 240, 138, 0.88) ${highlightProgress}%, transparent ${highlightProgress}%)`,
            backgroundRepeat: 'no-repeat',
            padding: '2px 6px',
            borderRadius: '4px',
            boxDecorationBreak: 'clone',
            WebkitBoxDecorationBreak: 'clone',
          }}
        >
          {highlight}
        </span>
        {parts.slice(1).join(highlight)}
      </>
    );
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0c0e12',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isVertical ? '40px 30px' : '60px 100px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.85) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Header with live page number */}
      <div
        style={{
          width: isVertical ? '92%' : '82%',
          marginBottom: '22px',
          fontFamily: "'Courier Prime', 'Roboto Mono', monospace",
          color: '#8c95a6',
          fontSize: isVertical ? '22px' : '20px',
          letterSpacing: '0.04em',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ textTransform: 'lowercase', fontWeight: 600 }}>
          {activeVerse.reference.toLowerCase()}
        </div>
        <div
          style={{
            fontSize: isVertical ? '18px' : '16px',
            color: '#d4af37',
            background: 'rgba(212, 175, 55, 0.12)',
            padding: '3px 10px',
            borderRadius: '4px',
            fontWeight: 600,
          }}
        >
          pág. {activeIndex + 1} de {totalVerses}
        </div>
      </div>

      {/* Animated Sheet */}
      <div
        style={{
          width: isVertical ? '94%' : '84%',
          transform: `translate(${currentTranslateX}px, ${currentTranslateY}px) rotateZ(${currentRotate}deg)`,
          opacity: currentOpacity,
          filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.75))',
        }}
      >
        <div
          style={{
            backgroundColor: '#F2EDE4',
            clipPath: tornClipPath,
            padding: isVertical ? '50px 36px 55px 36px' : '55px 65px 60px 65px',
            color: '#1a1816',
          }}
        >
          {activeVerse.contextText && (
            <div
              style={{
                fontFamily: "'Lora', 'Merriweather', serif",
                fontSize: isVertical ? '22px' : '22px',
                color: '#5c544d',
                fontStyle: 'italic',
                lineHeight: 1.5,
                marginBottom: '22px',
              }}
            >
              {activeVerse.contextText}
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
            {renderHighlightedContent(activeVerse.mainText, activeVerse.highlightText)}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

