import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { navigate } from '../lib/router';
import { generateAllTemplates } from '../remotion-templates/data/templatesData';
import type { RemotionTemplate } from '../remotion-templates/types';
import { TemplateGallery } from '../remotion-templates/components/TemplateGallery';
import { ExportStudio } from '../remotion-templates/components/ExportStudio';
import { AiScriptStudio } from '../remotion-templates/components/AiScriptStudio';
import { MotionLibraryStudio } from '../remotion-templates/components/MotionLibraryStudio';
import { ArrowLeft, Heart, LayoutGrid, Sparkles, Layers } from 'lucide-react';

const FAVORITES_KEY = 'remotion_favorites';

function useRemotionTemplates() {
  const [templates] = useState<RemotionTemplate[]>(() => generateAllTemplates());
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  };

  return { templates, favorites, toggleFavorite };
}

function TemplatesNav() {
  return (
    <div className="flex items-center gap-1 border-b border-slate-800 bg-slate-950/80 px-4 sm:px-6">
      <a
        href="/templates"
        className="flex items-center gap-2 px-3 py-3 text-sm font-medium text-slate-300 hover:text-white border-b-2 border-transparent hover:border-indigo-500 transition-colors"
      >
        <LayoutGrid className="w-4 h-4" /> Galeria
      </a>
      <a
        href="/templates/ai-studio"
        className="flex items-center gap-2 px-3 py-3 text-sm font-medium text-slate-300 hover:text-white border-b-2 border-transparent hover:border-indigo-500 transition-colors"
      >
        <Sparkles className="w-4 h-4" /> AI Script Studio
      </a>
      <a
        href="/templates/motion-library"
        className="flex items-center gap-2 px-3 py-3 text-sm font-medium text-slate-300 hover:text-white border-b-2 border-transparent hover:border-indigo-500 transition-colors"
      >
        <Layers className="w-4 h-4" /> Motion Library
      </a>
    </div>
  );
}

export function TemplatesGalleryView() {
  const { templates, favorites, toggleFavorite } = useRemotionTemplates();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    document.title = 'Templates de Vídeo Remotion — VYStudioCraft';
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <TemplatesNav />
      <div className="px-4 sm:px-6 pt-5 pb-2 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Templates de Vídeo</h1>
          <p className="text-sm text-slate-400">
            {templates.length} templates Remotion prontos — preview ao vivo, props personalizáveis e export MP4.
          </p>
        </div>
      </div>
      <main className="flex-1">
        <TemplateGallery
          templates={templates}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onPreviewTemplate={(t) => navigate(`/templates/${encodeURIComponent(t.id)}`)}
          onOpenExport={(t) => navigate(`/templates/${encodeURIComponent(t.id)}`)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </main>
    </div>
  );
}

export function TemplateDetailView({ id }: { id: string }) {
  const { templates, favorites, toggleFavorite } = useRemotionTemplates();
  const [tab, setTab] = useState<'detalhes' | 'exportar'>('detalhes');

  const template = useMemo(
    () => templates.find((t) => t.id === id) || null,
    [templates, id]
  );

  useEffect(() => {
    if (template) {
      document.title = `${template.title} — Templates VYStudioCraft`;
    }
  }, [template]);

  if (!template) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <TemplatesNav />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-slate-400">Template não encontrado.</p>
          <a href="/templates" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
            Voltar para a galeria
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <TemplatesNav />
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <a
            href="/templates"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Galeria
          </a>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab('detalhes')}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                tab === 'detalhes'
                  ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                  : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              Detalhes
            </button>
            <button
              onClick={() => setTab('exportar')}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                tab === 'exportar'
                  ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                  : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              Exportar MP4
            </button>
            <button
              onClick={() => toggleFavorite(template.id)}
              aria-label="Favoritar"
              className={`p-2 rounded-xl border transition-colors ${
                favorites.includes(template.id)
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Heart className={`w-5 h-5 ${favorites.includes(template.id) ? 'fill-rose-400' : ''}`} />
            </button>
          </div>
        </div>

        {tab === 'detalhes' ? (
          <TemplateDetailPanel
            template={template}
            isFavorite={favorites.includes(template.id)}
            onToggleFavorite={toggleFavorite}
            onOpenExport={() => setTab('exportar')}
          />
        ) : (
          <ExportStudio selectedTemplate={template} allTemplates={templates} />
        )}
      </div>
    </div>
  );
}

const TemplateDetailContent = React.lazy(() =>
  import('../remotion-templates/components/TemplateDetailContent').then((m) => ({
    default: m.TemplateDetailContent,
  }))
);

function TemplateDetailPanel(props: {
  template: RemotionTemplate;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpenExport: (t: RemotionTemplate) => void;
}) {
  return (
    <Suspense fallback={<div className="text-slate-400 text-sm p-6">Carregando player...</div>}>
      <TemplateDetailContent key={props.template.id} {...props} />
    </Suspense>
  );
}

export function TemplatesAiStudioView() {
  const { templates, favorites } = useRemotionTemplates();
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <TemplatesNav />
      <main className="flex-1">
        <AiScriptStudio
          templates={templates}
          favorites={favorites}
          onOpenExport={(t) => navigate(`/templates/${encodeURIComponent(t.id)}`)}
        />
      </main>
    </div>
  );
}

export function TemplatesMotionLibraryView() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <TemplatesNav />
      <main className="flex-1">
        <MotionLibraryStudio />
      </main>
    </div>
  );
}
