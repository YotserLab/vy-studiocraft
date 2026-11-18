import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RemotionTemplate } from '../types';
import { Play, Pause, RotateCcw, Sliders, Code, Copy, Check, Download, Sparkles, MonitorPlay } from 'lucide-react';
import { Player, PlayerRef } from '@remotion/player';
import { getCompositionForTemplate } from '../remotion/registry';
import { TemplateRenderer } from './TemplateRenderers';

interface PreviewStudioProps {
  templates: RemotionTemplate[];
  selectedTemplate: RemotionTemplate | null;
  onOpenExport: (template: RemotionTemplate) => void;
}

export const PreviewStudio: React.FC<PreviewStudioProps> = ({ templates, selectedTemplate, onOpenExport }) => {
  const [currentTemplateId, setCurrentTemplateId] = useState<string>(
    selectedTemplate?.id || templates[0]?.id || 'rem-torn-doc'
  );
  const [previewMode, setPreviewMode] = useState<'remotion' | 'dom'>('remotion');
  const [isPlaying, setIsPlaying] = useState(true);
  const [frame, setFrame] = useState(0);
  const [copied, setCopied] = useState(false);
  const playerRef = useRef<PlayerRef>(null);

  const activeTemplate = templates.find((t) => t.id === currentTemplateId) || templates[0];

  const [customTitle, setCustomTitle] = useState(activeTemplate?.previewConfig.defaultTitle || '');
  const [customSubtitle, setCustomSubtitle] = useState(activeTemplate?.previewConfig.defaultSubtitle || '');
  const [primaryColor, setPrimaryColor] = useState(activeTemplate?.previewConfig.primaryColor || '#6366f1');

  useEffect(() => {
    if (activeTemplate) {
      setCustomTitle(activeTemplate.previewConfig.defaultTitle);
      setCustomSubtitle(activeTemplate.previewConfig.defaultSubtitle);
      setPrimaryColor(activeTemplate.previewConfig.primaryColor);
      setFrame(0);
    }
  }, [currentTemplateId]);

  useEffect(() => {
    let timer: any;
    if (isPlaying && previewMode === 'dom') {
      timer = setInterval(() => {
        setFrame((f) => (f + 1) % 90);
      }, 40);
    }
    return () => clearInterval(timer);
  }, [isPlaying, previewMode]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeTemplate.codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Resolve active Remotion component
  const ActiveComponent = useMemo(() => {
    return getCompositionForTemplate(activeTemplate.compositionId, activeTemplate.category);
  }, [activeTemplate.compositionId, activeTemplate.category]);

  // Merge custom input props for Remotion Player
  const inputProps = useMemo(() => {
    const base = activeTemplate.defaultProps || {};
    return {
      ...base,
      topLabel: customTitle,
      title: customTitle,
      mainQuote: customSubtitle,
      subtitle: customSubtitle,
      phrase: customSubtitle,
      quoteText: customSubtitle,
      tagline: customSubtitle,
      primaryColor,
      accentColor: primaryColor,
    };
  }, [activeTemplate.defaultProps, customTitle, customSubtitle, primaryColor]);

  const durationInFrames = activeTemplate.durationInFrames || 150;
  const compWidth = activeTemplate.width || 1920;
  const compHeight = activeTemplate.height || 1080;
  const compFps = activeTemplate.fps || 30;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono mb-2 border border-indigo-500/30">
            <MonitorPlay className="w-3.5 h-3.5 text-indigo-400" /> Remotion Engine 4.0 Native Player
          </div>
          <h1 className="text-3xl font-black text-white">Live Preview & Player Studio</h1>
          <p className="text-slate-400 text-sm">
            Interactive real-time player running with the official Remotion runtime. Scrub, inspect frames, and customize props.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setPreviewMode('remotion')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                previewMode === 'remotion'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🎬 Remotion Player
            </button>
            <button
              onClick={() => setPreviewMode('dom')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                previewMode === 'dom'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ Fast DOM
            </button>
          </div>

          <div className="w-full sm:w-72">
            <select
              value={currentTemplateId}
              onChange={(e) => setCurrentTemplateId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.category})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Preview Player (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative aspect-video bg-black rounded-3xl border border-slate-800 overflow-hidden flex items-center justify-center shadow-2xl group">
            {previewMode === 'remotion' ? (
              <div className="w-full h-full flex items-center justify-center bg-black">
                <Player
                  ref={playerRef}
                  component={ActiveComponent}
                  inputProps={inputProps}
                  durationInFrames={durationInFrames}
                  compositionWidth={compWidth}
                  compositionHeight={compHeight}
                  fps={compFps}
                  style={{
                    width: '100%',
                    height: '100%',
                    maxHeight: '100%',
                  }}
                  controls
                  loop
                  autoPlay
                />
              </div>
            ) : (
              <>
                <TemplateRenderer
                  template={activeTemplate}
                  title={customTitle}
                  subtitle={customSubtitle}
                  primaryColor={primaryColor}
                  frame={frame}
                />

                {/* Player Controls Bar for DOM mode */}
                <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-2xl px-5 py-3 flex items-center justify-between text-xs text-slate-300 shadow-xl">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors shadow-lg shadow-indigo-600/30"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                    </button>
                    <button
                      onClick={() => setFrame(0)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono">Frame {frame} / 90 ({activeTemplate.duration})</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-slate-400 font-mono">60 FPS</span>
                    <span className="text-slate-400 font-mono">1080p</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Code Viewer */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-400" /> Remotion Component Source Code
              </h3>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl text-xs transition-colors border border-slate-800 font-mono"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied Source!' : 'Copy Code'}
              </button>
            </div>
            <pre className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 font-mono text-xs text-indigo-300 overflow-x-auto max-h-64">
              {activeTemplate.codeSnippet}
            </pre>
          </div>
        </div>

        {/* Props Customizer & Render Action (1 col) */}
        <div className="space-y-6">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-5">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" /> Real-Time Prop Customizer
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Top Label / Title</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Quote / Subtitle / Text</label>
                <textarea
                  rows={3}
                  value={customSubtitle}
                  onChange={(e) => setCustomSubtitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Accent / Highlight Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-300">{primaryColor}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => onOpenExport(activeTemplate)}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Render & Export Video
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-950/40 to-purple-950/40 border border-indigo-900/50 rounded-3xl p-6 space-y-2">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" /> 100% Remotion Fidelity
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              The preview runs directly with Remotion React hooks (<code className="text-indigo-300">useCurrentFrame</code>, <code className="text-indigo-300">interpolate</code>, <code className="text-indigo-300">spring</code>). What you see here is frame-by-frame identical to the exported MP4!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
