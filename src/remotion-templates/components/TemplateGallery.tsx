import React, { useState, useMemo } from 'react';
import { RemotionTemplate, TemplateCategory, DifficultyLevel } from '../types';
import { Search, Filter, Heart, Eye, Play, Sparkles, Layers, ArrowUpDown, Code, Check, Zap, Film } from 'lucide-react';
import { MiniPreviewCanvas } from './MiniPreviewCanvas';

interface TemplateGalleryProps {
  templates: RemotionTemplate[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onPreviewTemplate: (template: RemotionTemplate) => void;
  onOpenExport: (template: RemotionTemplate) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const DIFFICULTIES: ('All' | DifficultyLevel)[] = ['All', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  templates,
  favorites,
  onToggleFavorite,
  onPreviewTemplate,
  onOpenExport,
  searchQuery,
  setSearchQuery,
}) => {
  const [selectedCollection, setSelectedCollection] = useState<'all' | 'curated' | 'shotpack' | 'catalog'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | DifficultyLevel>('All');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'difficulty'>('popular');
  const [visibleCount, setVisibleCount] = useState(24);

  // Dynamic categories filtered by selected collection
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    templates.forEach((t) => {
      const matchesCollection =
        selectedCollection === 'all' ||
        (selectedCollection === 'curated' && (t.id.startsWith('rem-') || t.id.startsWith('rc-') || t.author.includes('Studio Criação') || t.author.includes('RenderComp'))) ||
        (selectedCollection === 'shotpack' && t.id.startsWith('shotpack-')) ||
        (selectedCollection === 'catalog' && !t.id.startsWith('shotpack-') && !t.id.startsWith('rem-') && !t.id.startsWith('rc-'));
      if (matchesCollection && t.category) set.add(t.category);
    });
    return ['All', ...Array.from(set).sort()];
  }, [templates, selectedCollection]);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesCollection =
        selectedCollection === 'all' ||
        (selectedCollection === 'curated' && (t.id.startsWith('rem-') || t.id.startsWith('rc-') || t.author.includes('Studio Criação') || t.author.includes('RenderComp'))) ||
        (selectedCollection === 'shotpack' && t.id.startsWith('shotpack-')) ||
        (selectedCollection === 'catalog' && !t.id.startsWith('shotpack-') && !t.id.startsWith('rem-') && !t.id.startsWith('rc-'));
      const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'All' || t.difficulty === selectedDifficulty;
      const matchesSearch = 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCollection && matchesCategory && matchesDifficulty && matchesSearch;
    }).sort((a, b) => {
      if (sortBy === 'popular') return b.views - a.views;
      if (sortBy === 'newest') return b.id.localeCompare(a.id);
      if (sortBy === 'difficulty') {
        const order = { Beginner: 1, Intermediate: 2, Advanced: 3, Expert: 4 };
        return order[a.difficulty] - order[b.difficulty];
      }
      return 0;
    });
  }, [templates, selectedCollection, selectedCategory, selectedDifficulty, searchQuery, sortBy]);

  const paginatedTemplates = filteredTemplates.slice(0, visibleCount);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-slate-900 border border-slate-800 p-8 sm:p-10 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" /> Remotion Engine 4.0 • Experiência Integrada de Cards • Player + Motion Specs
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Galeria & Biblioteca de Motion Integrada
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Mais de 1.190 templates e tomadas atômicas integradas diretamente nos cards. Passe o mouse para preview animado, clique no card para abrir o Live Player Remotion, ajustar props em tempo real, consultar motion specs e exportar em MP4.
          </p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="space-y-4 bg-slate-950/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
        
        {/* Collection Selector Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 overflow-x-auto">
          <button
            onClick={() => {
              setSelectedCollection('all');
              setSelectedCategory('All');
              setVisibleCount(24);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              selectedCollection === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Todos os Modelos ({templates.length})
          </button>

          <button
            onClick={() => {
              setSelectedCollection('curated');
              setSelectedCategory('All');
              setVisibleCount(24);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              selectedCollection === 'curated'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Estúdio & RenderComp 50
          </button>

          <button
            onClick={() => {
              setSelectedCollection('shotpack');
              setSelectedCategory('All');
              setVisibleCount(24);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              selectedCollection === 'shotpack'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Shotpack Motion Shots (173)
          </button>

          <button
            onClick={() => {
              setSelectedCollection('catalog');
              setSelectedCategory('All');
              setVisibleCount(24);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              selectedCollection === 'catalog'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-cyan-400" /> Catálogo Remotion (1.000)
          </button>
        </div>
        
        {/* Categories Horizontal Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setVisibleCount(24);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Secondary Filters (Difficulty & Sort) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-800/80">
          
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Difficulty:
            </span>
            {DIFFICULTIES.map((diff) => (
              <button
                key={diff}
                onClick={() => {
                  setSelectedDifficulty(diff);
                  setVisibleCount(24);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedDifficulty === diff
                    ? 'bg-slate-800 text-indigo-400 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-white bg-slate-900/50'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs text-slate-400 font-mono">
              Showing <span className="text-white font-bold">{paginatedTemplates.length}</span> of {filteredTemplates.length} templates
            </span>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Newest Added</option>
                <option value="difficulty">Difficulty Level</option>
              </select>
            </div>
          </div>

        </div>

      </div>

      {/* Template Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-20 bg-slate-950/40 border border-slate-800 rounded-3xl">
          <p className="text-slate-400 text-lg">No templates found matching your search or batch filters.</p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSelectedDifficulty('All');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-500 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedTemplates.map((template) => {
            const isFav = favorites.includes(template.id);
            return (
              <div
                key={template.id}
                className="group bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-500/10"
              >
                <div>
                  <div className="relative">
                    <MiniPreviewCanvas
                      template={template}
                      onPreview={() => onPreviewTemplate(template)}
                    />
                    
                    <div className="absolute top-3 right-3 z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(template.id);
                        }}
                        className={`p-1.5 rounded-lg backdrop-blur-md transition-colors ${
                          isFav
                            ? 'bg-rose-500 text-white shadow-lg'
                            : 'bg-black/60 text-slate-300 hover:text-white border border-white/10'
                        }`}
                        title={isFav ? 'Remove from Favorites' : 'Add to Favorites'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-white' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-indigo-300 transition-colors">
                      {template.title}
                    </h3>
                    <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                      {template.description}
                    </p>
                  </div>
                </div>

                <div className="px-4 pb-3.5 pt-2 flex items-center justify-between border-t border-slate-900/80 bg-slate-950/40">
                  <span className="text-[11px] text-slate-500 font-mono truncate max-w-[130px]">
                    {template.author.split('/')[0].trim()}
                  </span>

                  {/* Botões pequenos e elegantes */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onPreviewTemplate(template)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-[11px] font-medium border border-slate-800 transition-colors"
                      title="Visualizar no Player Remotion"
                    >
                      <Play className="w-3 h-3 text-indigo-400" /> Preview
                    </button>
                    <button
                      onClick={() => onOpenExport(template)}
                      className="inline-flex items-center px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-medium transition-colors shadow-sm"
                      title="Renderizar MP4"
                    >
                      Render
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More Button if more templates exist */}
      {visibleCount < filteredTemplates.length && (
        <div className="text-center pt-8">
          <button
            onClick={() => setVisibleCount((prev) => prev + 24)}
            className="px-8 py-3 bg-slate-900 border border-slate-800 hover:border-indigo-500 text-white rounded-2xl text-sm font-semibold transition-all shadow-xl hover:shadow-indigo-500/20"
          >
            Load More Templates ({filteredTemplates.length - visibleCount} remaining)
          </button>
        </div>
      )}

    </div>
  );
};
