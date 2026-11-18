import React, { useState, useMemo } from 'react';
import { RemotionTemplate } from '../types';
import { Copy, Check, Download, Code, Sliders, MonitorPlay, Zap, Sparkles, ShieldCheck } from 'lucide-react';
import { Player } from '@remotion/player';
import { getCompositionForTemplate } from '../remotion/registry';

interface TemplateDetailContentProps {
  template: RemotionTemplate;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpenExport: (t: RemotionTemplate) => void;
}

// Versão em página do TemplatePreviewModal (sem overlay/Escape) — usada na rota /templates/:id.
export const TemplateDetailContent: React.FC<TemplateDetailContentProps> = ({
  template,
  onOpenExport,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'props' | 'specs' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [showSafeZone, setShowSafeZone] = useState(false);
  const [customTitle, setCustomTitle] = useState(template.previewConfig?.defaultTitle || template.title);
  const [customSubtitle, setCustomSubtitle] = useState(template.previewConfig?.defaultSubtitle || '');
  const [primaryColor, setPrimaryColor] = useState(template.previewConfig?.primaryColor || '#6366f1');

  const ActiveComponent = useMemo(() => {
    return getCompositionForTemplate(template.id, template.compositionId);
  }, [template.id, template.compositionId]);

  const inputProps = useMemo(() => {
    const base = template.defaultProps || {};
    return {
      ...base,
      title: customTitle,
      topLabel: customTitle,
      mainTitle: customTitle,
      diagramTitle: customTitle,
      chartTitle: customTitle,
      canvasTitle: customTitle,
      documentTitle: customTitle,
      mainQuote: customSubtitle,
      subtitle: customSubtitle,
      phrase: customSubtitle,
      quoteText: customSubtitle,
      tagline: customSubtitle,
      primaryColor,
      accentColor: primaryColor,
    };
  }, [template.defaultProps, customTitle, customSubtitle, primaryColor]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(template.codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const durationInFrames = template.durationInFrames || 150;
  const compWidth = template.width || 1920;
  const compHeight = template.height || 1080;
  const compFps = template.fps || 30;
  const isVertical = compHeight > compWidth || template.aspectRatio === '9/16';

  const tabCls = (t: string) =>
    `py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
      activeTab === t ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'
    }`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2.5 py-1 rounded-lg font-mono border border-indigo-500/30">
            {template.category}
          </span>
          <h1 className="text-xl font-bold text-white">{template.title}</h1>
          {template.compositionId && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {template.compositionId}
            </span>
          )}
        </div>
      </div>

      <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 gap-6 overflow-x-auto">
        <button onClick={() => setActiveTab('preview')} className={tabCls('preview')}>
          <MonitorPlay className="w-4 h-4" /> Live Player
        </button>
        <button onClick={() => setActiveTab('props')} className={tabCls('props')}>
          <Sliders className="w-4 h-4" /> Personalizar Props
        </button>
        <button onClick={() => setActiveTab('specs')} className={tabCls('specs')}>
          <Zap className="w-4 h-4 text-amber-400" /> Motion Specs & Técnicas
        </button>
        <button onClick={() => setActiveTab('code')} className={tabCls('code')}>
          <Code className="w-4 h-4" /> Código Remotion
        </button>
      </div>

      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {activeTab === 'preview' && (
            <div className="relative aspect-video bg-black rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center">
              {ActiveComponent ? (
                <div className="relative w-full h-full">
                  <Player
                    component={ActiveComponent}
                    inputProps={inputProps}
                    durationInFrames={durationInFrames}
                    compositionWidth={compWidth}
                    compositionHeight={compHeight}
                    fps={compFps}
                    style={{ width: '100%', height: '100%' }}
                    controls
                    autoPlay
                    loop
                  />
                  {showSafeZone && isVertical && (
                    <div className="absolute inset-0 pointer-events-none border-2 border-emerald-500/50 flex flex-col justify-between p-4">
                      <div className="bg-red-500/20 text-red-300 text-[10px] font-mono px-2 py-1 rounded text-center">
                        Safe Zone Top: UI do TikTok / Reels (evitar texto)
                      </div>
                      <div className="bg-red-500/20 text-red-300 text-[10px] font-mono px-2 py-1 rounded text-center">
                        Safe Zone Bottom: Legendas do App & Botões de Ação
                      </div>
                    </div>
                  )}
                </div>
              ) : template.previewVideoUrl ? (
                <video src={template.previewVideoUrl} controls autoPlay loop className="w-full h-full object-contain" />
              ) : (
                <div className="text-slate-400 text-sm">Carregando composição...</div>
              )}

              {isVertical && (
                <button
                  onClick={() => setShowSafeZone(!showSafeZone)}
                  className="absolute top-3 left-3 z-30 bg-black/70 hover:bg-black text-xs text-white px-2.5 py-1 rounded-lg border border-white/20 backdrop-blur-md flex items-center gap-1.5 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  {showSafeZone ? 'Ocultar Safe-Zone' : 'Ver Safe-Zone (9:16)'}
                </button>
              )}
            </div>
          )}

          {activeTab === 'props' && (
            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 space-y-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" /> Parâmetros Reativos do Template
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Título / Frase Principal</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Subtítulo / Citação / Texto Secundário</label>
                  <input
                    type="text"
                    value={customSubtitle}
                    onChange={(e) => setCustomSubtitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Cor de Realce / Accent</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-300">{primaryColor}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('preview')}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm transition-colors shadow-lg shadow-indigo-600/30"
              >
                Ver no Player Remotion
              </button>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 space-y-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" /> Especificações Cinemáticas & Motion Blueprint
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Resolução</span>
                  <span className="text-sm font-bold text-white font-mono">{compWidth} × {compHeight}</span>
                  <span className="text-[10px] text-indigo-400 block mt-0.5">{isVertical ? '9:16 Vertical (Shorts/Reels)' : '16:9 Widescreen'}</span>
                </div>
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Frame Rate</span>
                  <span className="text-sm font-bold text-white font-mono">{compFps} FPS</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Determinístico frame-a-frame</span>
                </div>
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Duração Total</span>
                  <span className="text-sm font-bold text-white font-mono">{durationInFrames} frames</span>
                  <span className="text-[10px] text-emerald-400 block mt-0.5">{template.duration}</span>
                </div>
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Física de Mola</span>
                  <span className="text-sm font-bold text-white font-mono">spring()</span>
                  <span className="text-[10px] text-purple-400 block mt-0.5">damping: 12, mass: 0.5</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Curva de Easing Recomendada
                  </div>
                  <code className="block bg-slate-950 p-2.5 rounded-lg text-xs font-mono text-indigo-300 border border-slate-800">
                    Easing.bezier(0.25, 0.1, 0.25, 1.0) // Easing cúbico para entrada suave de texto e cards
                  </code>
                </div>
                <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Regras de Retenção & Safe-Zones
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {isVertical
                      ? 'Formato vertical 9:16 respeita as zonas seguras para evitar sobreposição dos botões de curtir/comentar do TikTok/Instagram e barra de navegação superior.'
                      : 'Formato 16:9 calibrado com contraste elevado de texto sobre fundos monocromáticos escuros para legibilidade máxima sem fadiga visual.'}
                  </p>
                </div>
                {template.tags && template.tags.length > 0 && (
                  <div>
                    <span className="text-xs text-slate-400 block mb-2">Tags de Motion & Estilo</span>
                    <div className="flex flex-wrap gap-1.5">
                      {template.tags.map((tag) => (
                        <span key={tag} className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-indigo-300 overflow-x-auto max-h-[380px]">
              <button
                onClick={handleCopyCode}
                className="absolute top-4 right-4 flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado!' : 'Copiar Código'}
              </button>
              <pre>{template.codeSnippet}</pre>
            </div>
          )}

          <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="text-xs text-slate-400">Criador</span>
              <p className="font-semibold text-white">{template.author}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Dificuldade</span>
              <p className="font-semibold text-indigo-400">{template.difficulty}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Duração / Frames</span>
              <p className="font-semibold text-white font-mono">{durationInFrames} frames ({template.duration})</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h4 className="font-bold text-white text-sm">Ações Rápidas</h4>
            <button
              onClick={() => onOpenExport(template)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/30"
            >
              <Download className="w-4 h-4" /> Renderizar & Exportar MP4
            </button>
            <p className="text-xs text-slate-400 leading-relaxed">
              Este template utiliza composição Remotion nativa em 1080p a 30fps com física de mola e renderização real via Node.js/Bun.
            </p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
            <p className="text-xs text-slate-400 leading-relaxed">{template.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
