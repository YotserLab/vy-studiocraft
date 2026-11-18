import React, { useState, useEffect } from 'react';
import { RemotionTemplate } from '../types';
import { Download, Terminal, Settings, CheckCircle2, Loader2, Sparkles, Copy, Check, Play, Film, AlertCircle } from 'lucide-react';

interface ExportStudioProps {
  selectedTemplate: RemotionTemplate | null;
  allTemplates: RemotionTemplate[];
}

interface RenderedVideoItem {
  filename: string;
  videoUrl: string;
  sizeMb: string;
  createdAt: string;
}

export const ExportStudio: React.FC<ExportStudioProps> = ({ selectedTemplate, allTemplates }) => {
  const [targetTemplateId, setTargetTemplateId] = useState<string>(
    selectedTemplate?.id || allTemplates[0]?.id || 'rem-torn-doc'
  );
  const [resolution, setResolution] = useState<'1080p' | '4K' | '720p' | 'Vertical 9:16'>('1080p');
  const [fps, setFps] = useState<number>(30);
  const [codec, setCodec] = useState<'h264' | 'prores' | 'vp9'>('h264');
  const [isRendering, setIsRendering] = useState(false);
  const [renderComplete, setRenderComplete] = useState(false);
  const [renderedVideo, setRenderedVideo] = useState<{
    videoUrl: string;
    filename: string;
    sizeMb: string;
    renderTimeMs: number;
  } | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [copiedCli, setCopiedCli] = useState(false);
  const [recentVideos, setRecentVideos] = useState<RenderedVideoItem[]>([]);

  const activeTemplate = allTemplates.find((t) => t.id === targetTemplateId) || allTemplates[0];

  const compositionName = activeTemplate.compositionId || 'TornDocumentClip';
  const cliCommand = `bunx --package @remotion/cli remotion render src/remotion/index.ts ${compositionName} out/${compositionName}.mp4 --codec=${codec}`;

  // Fetch recently rendered videos
  const fetchRecentVideos = async () => {
    try {
      const res = await fetch('/api/rendered');
      const data = await res.json();
      if (data.success && data.videos) {
        setRecentVideos(data.videos);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchRecentVideos();
  }, []);

  const handleStartRender = async () => {
    setIsRendering(true);
    setRenderError(null);
    setRenderComplete(false);
    setRenderedVideo(null);

    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: activeTemplate.id,
          compositionId: activeTemplate.compositionId,
          props: activeTemplate.defaultProps || {},
          resolution,
          fps,
          codec,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao renderizar o vídeo.');
      }

      setRenderedVideo({
        videoUrl: data.videoUrl,
        filename: data.filename,
        sizeMb: data.sizeMb,
        renderTimeMs: data.renderTimeMs,
      });
      setRenderComplete(true);
      fetchRecentVideos();
    } catch (err: any) {
      console.error('Render error:', err);
      setRenderError(err.message || 'Erro inesperado na renderização.');
    } finally {
      setIsRendering(false);
    }
  };

  const handleCopyCli = () => {
    navigator.clipboard.writeText(cliCommand);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono mb-2 border border-indigo-500/30">
            <Settings className="w-3.5 h-3.5 text-indigo-400" /> High-Performance Remotion Renderer
          </div>
          <h1 className="text-3xl font-black text-white">Video Render & Export Studio</h1>
          <p className="text-slate-400 text-sm">
            Trigger real server-side MP4 video renders using Remotion 4.0, download the exported file, or copy CLI commands.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Render Configuration Panel (2 cols) */}
        <div className="space-y-6 lg:col-span-2">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-indigo-400" /> Export Configuration
            </h2>

            {/* Template Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Select Template to Render</label>
              <select
                value={targetTemplateId}
                onChange={(e) => setTargetTemplateId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {allTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Quality & Encoding Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Output Resolution</label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="1080p">Full HD (1920x1080)</option>
                  <option value="Vertical 9:16">Shorts / Reels (1080x1920)</option>
                  <option value="720p">Fast 720p (1280x720)</option>
                  <option value="4K">Ultra HD 4K (3840x2160)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Frame Rate (FPS)</label>
                <select
                  value={fps}
                  onChange={(e) => setFps(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={30}>30 FPS (Standard Cinematic)</option>
                  <option value={60}>60 FPS (Ultra Smooth Motion)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Video Codec</label>
                <select
                  value={codec}
                  onChange={(e) => setCodec(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="h264">H.264 / AVC (Universal Web)</option>
                  <option value="prores">Apple ProRes 422 (Editing Master)</option>
                  <option value="vp9">VP9 (High Compression)</option>
                </select>
              </div>
            </div>

            {/* Error Message */}
            {renderError && (
              <div className="p-4 bg-red-950/60 border border-red-800/80 rounded-2xl flex items-center gap-3 text-red-200 text-xs">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span>{renderError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-4">
              <button
                disabled={isRendering}
                onClick={handleStartRender}
                className={`w-full sm:w-auto flex-1 py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl ${
                  isRendering
                    ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-indigo-600/30'
                }`}
              >
                {isRendering ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Rendering with Remotion Engine...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-yellow-300" /> Start Real Video Render (MP4)
                  </>
                )}
              </button>

              <button
                onClick={handleCopyCli}
                className="w-full sm:w-auto py-4 px-5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl text-xs font-mono text-slate-300 flex items-center justify-center gap-2 transition-colors"
              >
                {copiedCli ? <Check className="w-4 h-4 text-emerald-400" /> : <Terminal className="w-4 h-4" />}
                {copiedCli ? 'Copied Command!' : 'Copy CLI Command'}
              </button>
            </div>
          </div>

          {/* Render Result Card */}
          {renderedVideo && (
            <div className="bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Vídeo Renderizado com Sucesso!</h3>
                    <p className="text-xs text-slate-400">
                      Tempo de render: {(renderedVideo.renderTimeMs / 1000).toFixed(1)}s • Tamanho: {renderedVideo.sizeMb} MB
                    </p>
                  </div>
                </div>

                <a
                  href={renderedVideo.videoUrl}
                  download={renderedVideo.filename}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <Download className="w-4 h-4" /> Baixar MP4
                </a>
              </div>

              {/* Video Player */}
              <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
                <video src={renderedVideo.videoUrl} controls autoPlay className="w-full h-full object-contain" />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Recent Renders Gallery (1 col) */}
        <div className="space-y-6">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Film className="w-4 h-4 text-indigo-400" /> Recent Renders ({recentVideos.length})
            </h3>

            {recentVideos.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No rendered videos found yet.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {recentVideos.map((video) => (
                  <div
                    key={video.filename}
                    className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="truncate flex-1">
                      <div className="font-medium text-white truncate">{video.filename}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {video.sizeMb} MB • {new Date(video.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={video.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                        title="Preview"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={video.videoUrl}
                        download={video.filename}
                        className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Remotion Architecture Specs */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-3xl p-6 space-y-3 text-xs text-slate-300">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" /> CLI Command Specs
            </h4>
            <pre className="bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-indigo-300 overflow-x-auto">
              {cliCommand}
            </pre>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Renders execute locally via headless Chrome and FFmpeg concurrency directly on your hardware.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
