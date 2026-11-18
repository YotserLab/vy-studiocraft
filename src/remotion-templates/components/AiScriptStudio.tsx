import React, { useState } from 'react';
import { VIDEO_PROFILES } from '../data/templatesData';
import { AiScriptData, RemotionTemplate } from '../types';
import { Sparkles, Film, Loader2, Copy, Check, Play, Send, Sliders, Wand2, Heart, CheckSquare, Square } from 'lucide-react';

interface AiScriptStudioProps {
  templates: RemotionTemplate[];
  favorites: string[];
  onOpenExport: (template: RemotionTemplate) => void;
}

export const AiScriptStudio: React.FC<AiScriptStudioProps> = ({ templates, favorites, onOpenExport }) => {
  const [selectedProfileId, setSelectedProfileId] = useState(VIDEO_PROFILES[0].id);
  const [topicInput, setTopicInput] = useState('Top 3 AI Productivity Hacks for 2026');
  const [tone, setTone] = useState('Energetic & Engaging');
  const [duration, setDuration] = useState('30 seconds');
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id || 'rem-001');
  
  // Selected preferred templates for AI generation
  const [preferredTemplateIds, setPreferredTemplateIds] = useState<string[]>(favorites);

  const [isLoading, setIsLoading] = useState(false);
  const [scriptResult, setScriptResult] = useState<AiScriptData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const selectedProfile = VIDEO_PROFILES.find((p) => p.id === selectedProfileId) || VIDEO_PROFILES[0];
  const targetTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
  const favoriteTemplatesList = templates.filter((t) => favorites.includes(t.id));

  const togglePreferred = (id: string) => {
    setPreferredTemplateIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim()) return;

    setIsLoading(true);
    setErrorMsg('');

    const preferredTemplatesTitles = templates
      .filter((t) => preferredTemplateIds.includes(t.id))
      .map((t) => `${t.title} (${t.category})`);

    try {
      const res = await fetch('/api/gemini/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicInput,
          templateTitle: targetTemplate.title,
          videoType: selectedProfile.name,
          tone,
          duration,
          preferredTemplates: preferredTemplatesTitles,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setScriptResult(data.data);
      } else {
        setErrorMsg(data.error || 'Failed to generate script');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySnippet = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono mb-2 border border-purple-500/30">
            <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" /> Powered by Gemini AI SDK & Catalog Preferred Animation Director
          </div>
          <h1 className="text-3xl font-black text-white">AI Video Script & Preferred Animation Studio</h1>
          <p className="text-slate-400 text-sm">Select favorite templates from the gallery to instruct Gemini AI on which animation styles to incorporate into each video scene.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Configuration Form (1 col) */}
        <div className="space-y-6">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-400" /> Video Type Profiles
            </h2>

            {/* Profiles Gallery Selector */}
            <div className="space-y-2">
              {VIDEO_PROFILES.map((profile) => (
                <div
                  key={profile.id}
                  onClick={() => {
                    setSelectedProfileId(profile.id);
                    setTopicInput(profile.defaultPrompt);
                    setSelectedTemplateId(profile.recommendedTemplateId);
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    selectedProfileId === profile.id
                      ? 'bg-purple-950/40 border-purple-500/60 shadow-lg shadow-purple-900/20'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm text-white">{profile.name}</div>
                  <p className="text-xs text-slate-400 mt-1">{profile.description}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleGenerate} className="space-y-4 pt-4 border-t border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Topic or Prompt Brief</label>
                <textarea
                  rows={3}
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  placeholder="Describe what your video is about..."
                />
              </div>

              {/* Preferred Templates Selection */}
              {favoriteTemplatesList.length > 0 && (
                <div className="space-y-2 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                  <label className="block text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" /> Preferred Animations from Favorites ({preferredTemplateIds.length} selected)
                  </label>
                  <p className="text-[11px] text-slate-400">Gemini will use these preferred catalog styles in the generated scenes:</p>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {favoriteTemplatesList.map((t) => {
                      const isSelected = preferredTemplateIds.includes(t.id);
                      return (
                        <div
                          key={t.id}
                          onClick={() => togglePreferred(t.id)}
                          className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-900 hover:bg-slate-800 cursor-pointer transition-colors border border-slate-800"
                        >
                          <span className="truncate text-slate-200 font-medium">{t.title}</span>
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-purple-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Remotion Template Base</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Energetic & Engaging">Energetic</option>
                    <option value="Professional & Corporate">Professional</option>
                    <option value="Cinematic & Epic">Cinematic</option>
                    <option value="Educational & Calm">Educational</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="15 seconds">15s Short</option>
                    <option value="30 seconds">30s Standard</option>
                    <option value="60 seconds">60s Deep Dive</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-sm transition-all shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating AI Script with Preferred Animations...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-pink-300" /> Generate AI Script & Storyboard
                  </>
                )}
              </button>
            </form>

            {errorMsg && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                {errorMsg}
              </div>
            )}
          </div>
        </div>

        {/* Results Panel (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {!scriptResult && !isLoading && (
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400">
                <Wand2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Ready to Generate Your Video Script</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                Select favorite templates from the gallery to suggest preferred animations to the AI, then click Generate.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-16 text-center space-y-4">
              <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto" />
              <h3 className="text-lg font-bold text-white">Gemini AI is crafting your video production script...</h3>
              <p className="text-slate-400 text-xs">Synthesizing scene pacing, voiceover dialogue, and your preferred catalog animations.</p>
            </div>
          )}

          {scriptResult && !isLoading && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Summary Card */}
              <div className="bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-950 border border-purple-900/50 rounded-3xl p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-purple-500/20 text-purple-300 text-xs px-3 py-1 rounded-full font-mono border border-purple-500/30">
                    Duration: {scriptResult.durationSeconds || 30}s
                  </span>
                  <button
                    onClick={() => onOpenExport(targetTemplate)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-lg shadow-purple-600/30"
                  >
                    <Film className="w-3.5 h-3.5" /> Open in Render Studio
                  </button>
                </div>
                <h2 className="text-2xl font-black text-white">{scriptResult.title}</h2>
                <p className="text-slate-300 text-sm">{scriptResult.summary}</p>
              </div>

              {/* Scenes Breakdown */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Film className="w-5 h-5 text-purple-400" /> Scene-by-Scene Storyboard & Preferred Animations
                </h3>

                {scriptResult.scenes?.map((scene, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-purple-400 font-bold">
                        Scene {scene.sceneNumber}: {scene.title} ({scene.duration}s)
                      </span>
                      <button
                        onClick={() => handleCopySnippet(scene.codePropsSnippet, idx)}
                        className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors"
                      >
                        {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedIndex === idx ? 'Copied Props' : 'Copy Props'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                        <span className="font-semibold text-slate-400 block mb-1">Visual Direction & Preferred Animation:</span>
                        <p className="text-slate-200">{scene.visualDescription}</p>
                      </div>
                      <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                        <span className="font-semibold text-slate-400 block mb-1">Voiceover / Audio:</span>
                        <p className="text-slate-200 italic">"{scene.voiceover}"</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
};
