import React, { useState } from 'react';
import { RemotionTemplate } from '../types';
import { Play } from 'lucide-react';

interface MiniPreviewCanvasProps {
  template: RemotionTemplate;
  onPreview: () => void;
}

const ARCHETYPE_FALLBACKS: Record<string, string> = {
  OneMinuteMasterpiece: '/rendered/preview_1min_masterpiece.png',
  DocumentaryCollageScene: '/rendered/preview_doc_collage.png',
  DocumentaryCollageSceneShorts: '/rendered/preview_doc_collage.png',
  StepProcessInfographic: '/rendered/preview_step_process.png',
  TimelineInfographic: '/rendered/preview_timeline.png',
  HandDrawnSketch: '/rendered/preview_handdrawn.png',
  AnimatedChartInfographic: '/rendered/preview_chart.png',
  MorphCameraZoom: '/rendered/preview_morph_zoom.png',
  CircularProcessInfographic: '/rendered/preview_circular_process.png',
  SplitComparisonInfographic: '/rendered/preview_split_comparison.png',
  TornDocumentClip: '/rendered/preview_torn_doc.png',
  TornDocumentClipShorts: '/rendered/preview_torn_doc.png',
  TornMultiVerseClip: '/rendered/preview_torn_multiverse.png',
  CenaVivaStatement: '/rendered/preview_cena_statement.png',
  CenaVivaChapter: '/rendered/preview_cena_chapter.png',
  TypewriterQuote: '/rendered/preview_typewriter.png',
  ViralKineticHook: '/rendered/preview_viral_hook.png',
  SaaSMockup: '/rendered/preview_saas_mockup.png',
};

export const MiniPreviewCanvas: React.FC<MiniPreviewCanvasProps> = ({ template, onPreview }) => {
  const [isHovered, setIsHovered] = useState(false);
  const fallbackImg = ARCHETYPE_FALLBACKS[template.compositionId || ''] || '/rendered/preview_step_process.png';
  const initialSrc = template.previewImageUrl || fallbackImg;

  return (
    <div
      className={`relative w-full aspect-[16/9] min-h-[220px] sm:min-h-[240px] bg-slate-950 bg-gradient-to-br ${template.thumbnailGradient} flex flex-col justify-between overflow-hidden cursor-pointer group rounded-t-3xl border-b border-slate-800/80`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onPreview}
    >
      {/* Real Still Image Snapshot or Styled Gradient Card or Video on Hover */}
      <div className="absolute inset-0 overflow-hidden bg-black">
        {isHovered && template.previewVideoUrl ? (
          <video
            src={template.previewVideoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={initialSrc}
            alt={template.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              if (e.currentTarget.src !== fallbackImg) {
                e.currentTarget.src = fallbackImg;
              }
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/40 opacity-80 group-hover:opacity-40 transition-opacity" />
      </div>

      {/* Top Header info (badges discretos flutuantes) */}
      <div className="relative z-20 flex items-center justify-between p-3 pointer-events-none">
        <span className="bg-black/80 backdrop-blur-md text-white text-[10px] px-2.5 py-0.5 rounded-full font-mono border border-white/15 shadow-md">
          {template.category}
        </span>
        <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] text-indigo-300 font-mono border border-white/15 shadow-md">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{template.duration}</span>
        </div>
      </div>

      {/* Bottom Floating Info Pill (sobreposto sem bloquear imagem) */}
      <div className="relative z-20 flex items-center justify-between p-3 pointer-events-none">
        <span className="bg-slate-950/85 backdrop-blur-md text-indigo-300 text-[11px] font-mono px-2.5 py-1 rounded-lg border border-slate-700/60 shadow">
          {template.compositionId || template.id}
        </span>
      </div>

      {/* Hover Play Button Overlay */}
      <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/40 backdrop-blur-[1.5px]">
        <div className="w-12 h-12 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition-transform duration-200 border border-white/20">
          <Play className="w-5 h-5 fill-white ml-0.5" />
        </div>
      </div>
    </div>
  );
};
