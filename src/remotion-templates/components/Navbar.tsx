import React from 'react';
import { Film, Sparkles, Heart, Download, Search, LayoutGrid, Play, Zap } from 'lucide-react';

interface NavbarProps {
  activeTab: 'gallery' | 'preview' | 'ai-studio' | 'favorites' | 'export' | 'motion-library';
  setActiveTab: (tab: 'gallery' | 'preview' | 'ai-studio' | 'favorites' | 'export' | 'motion-library') => void;
  favoritesCount: number;
  totalTemplatesCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  favoritesCount,
  totalTemplatesCount,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('gallery')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Film className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight bg-gradient-to-r from-white via-indigo-200 to-purple-400 bg-clip-text text-transparent">
                  VY-RemotionTemplates
                </span>
                <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2.5 py-0.5 rounded-full font-mono border border-indigo-500/30">
                  {totalTemplatesCount} Templates Curados
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Fábrica de Vídeos & Motion Graphics Remotion</p>
            </div>
          </div>

          {/* Search Bar (Quick Search) */}
          <div className="hidden md:flex items-center relative max-w-xs w-full mx-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3" />
            <input
              type="text"
              placeholder="Buscar templates Remotion..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Navigation Tabs (Unificado: Gallery & Motion, AI Studio, Favorites, Render) */}
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'gallery'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-white/20'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4 text-indigo-300" />
              <span>Gallery & Motion</span>
            </button>

            <button
              onClick={() => setActiveTab('ai-studio')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'ai-studio'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-pink-300 animate-pulse" />
              <span>AI Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all relative ${
                activeTab === 'favorites'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Heart className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline">Favorites</span>
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {favoritesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('export')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'export'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Render / Export</span>
            </button>
          </nav>

        </div>
      </div>
    </header>
  );
};
