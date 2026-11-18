import React from 'react';
import { RemotionTemplate } from '../types';

interface TemplateRendererProps {
  template: RemotionTemplate;
  title: string;
  subtitle: string;
  primaryColor: string;
  frame: number;
}

// Helper for spring physics calculation
const getSpringScale = (frame: number, delay = 0) => {
  const f = Math.max(0, frame - delay);
  const progress = 1 - Math.exp(-f * 0.15) * Math.cos(f * 0.3);
  return Math.min(1.2, Math.max(0.2, progress));
};

export const TemplateRenderer: React.FC<TemplateRendererProps> = ({
  template,
  title,
  subtitle,
  primaryColor,
  frame,
}) => {
  const cat = template.category;
  const springScale = getSpringScale(frame);
  const pulse = 1 + Math.sin(frame * 0.2) * 0.05;

  if (cat === 'Social Media' || cat === 'Kinetic Typography') {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 max-w-3xl relative overflow-hidden">
        {/* Floating background glowing orb */}
        <div 
          className="absolute w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ backgroundColor: primaryColor, transform: `scale(${1 + Math.sin(frame * 0.1) * 0.3})` }}
        />
        
        <div
          className="text-5xl sm:text-7xl font-black text-white tracking-tight mb-4 drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] relative z-10"
          style={{ transform: `scale(${springScale})`, color: primaryColor }}
        >
          {title}
        </div>
        
        <div 
          className="text-lg sm:text-xl text-slate-100 font-bold px-8 py-3 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/20 shadow-2xl relative z-10"
          style={{ opacity: Math.min(1, frame * 0.1), transform: `translateY(${Math.max(0, 20 - frame * 2)}px)` }}
        >
          ✨ {subtitle}
        </div>
      </div>
    );
  }

  if (cat === 'SaaS & Tech') {
    const slideIn = Math.min(0, 50 - frame * 5);
    return (
      <div 
        className="w-full max-w-2xl p-8 bg-slate-950/95 backdrop-blur-2xl rounded-3xl border border-indigo-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col gap-6 relative overflow-hidden"
        style={{ transform: `translateY(${slideIn}px)` }}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"/><div className="w-3 h-3 rounded-full bg-yellow-500"/><div className="w-3 h-3 rounded-full bg-green-500"/>
            <span className="text-xs font-mono text-slate-400 ml-2">app.remotionverse.io/analytics</span>
          </div>
          <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-mono border border-emerald-500/30">● Live Stream</span>
        </div>

        <div className="space-y-1">
          <h3 className="text-3xl font-black text-white tracking-tight">{title}</h3>
          <p className="text-slate-400 text-sm">{subtitle}</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400 mb-1">Conversion Rate</div>
            <div className="text-2xl font-black text-emerald-400">+{(12.4 + Math.sin(frame * 0.2) * 1.5).toFixed(1)}%</div>
          </div>
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400 mb-1">Active Renders</div>
            <div className="text-2xl font-black text-indigo-400">{Math.floor(1240 + frame * 3)}</div>
          </div>
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400 mb-1">Render Speed</div>
            <div className="text-2xl font-black text-purple-400">60 FPS</div>
          </div>
        </div>
      </div>
    );
  }

  if (cat === 'Neon & FX') {
    const glitchX = (frame % 7 === 0) ? (Math.random() * 6 - 3) : 0;
    return (
      <div className="text-center p-8 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15),transparent_70%)] pointer-events-none" />
        <span className="text-xs font-mono tracking-widest text-cyan-400 mb-3 uppercase block animate-pulse">
          ⚡ CYBERNETIC REMOTION ENGINE [FRAME {frame}]
        </span>
        <h1 
          className="text-6xl sm:text-8xl font-black text-white tracking-tighter drop-shadow-[0_0_35px_rgba(6,182,212,0.9)]"
          style={{ transform: `translateX(${glitchX}px) scale(${springScale})`, color: primaryColor }}
        >
          {title}
        </h1>
        <p className="text-cyan-200 font-mono text-lg mt-4 bg-cyan-950/40 px-6 py-2 rounded-xl inline-block border border-cyan-500/30">
          {subtitle}
        </p>
      </div>
    );
  }

  if (cat === 'E-Commerce') {
    return (
      <div className="w-80 bg-white text-slate-900 rounded-3xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.7)] flex flex-col gap-4 transform transition-all" style={{ transform: `scale(${springScale})` }}>
        <div className="flex items-center justify-between">
          <span className="bg-emerald-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow">⚡ FLASH SALE</span>
          <span className="text-xs font-mono text-slate-400">LIMITED 4K</span>
        </div>
        <div className="h-40 bg-gradient-to-tr from-slate-100 to-indigo-50 rounded-2xl flex items-center justify-center font-bold text-slate-500 shadow-inner">
          <span className="animate-bounce text-4xl">🎧</span>
        </div>
        <h3 className="text-2xl font-black text-slate-900 line-clamp-1">{title}</h3>
        <p className="text-xs text-slate-500">{subtitle}</p>
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-3xl font-extrabold text-indigo-600">$299.00</span>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30">
            Buy Now
          </button>
        </div>
      </div>
    );
  }

  if (cat === 'Podcast & Audio') {
    return (
      <div className="flex flex-col items-center justify-center p-8 max-w-xl text-center space-y-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-2xl text-3xl text-white font-black" style={{ transform: `scale(${pulse})` }}>
            🎙️
          </div>
          <div className="absolute -inset-2 rounded-full border-2 border-amber-400/50 animate-ping pointer-events-none" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-white mb-2">{title}</h2>
          <p className="text-amber-200/90 text-sm font-medium">"{subtitle}"</p>
        </div>
        <div className="flex items-center gap-1.5 h-16 justify-center bg-black/40 px-6 py-3 rounded-2xl border border-white/10">
          {[30, 80, 50, 100, 35, 90, 65, 85, 40, 95, 60, 85].map((h, i) => (
            <div 
              key={i} 
              style={{ height: `${Math.max(10, (h + Math.sin(frame * 0.3 + i * 0.5) * 40))}%` }} 
              className="w-2 bg-gradient-to-t from-amber-500 to-yellow-300 rounded-full transition-all duration-75" 
            />
          ))}
        </div>
      </div>
    );
  }

  if (cat === 'Gaming') {
    return (
      <div className="w-full max-w-2xl bg-gradient-to-r from-red-950 via-slate-950 to-blue-950 border-2 border-indigo-500/50 rounded-3xl p-8 flex items-center justify-between shadow-[0_25px_60px_rgba(0,0,0,0.8)]" style={{ transform: `scale(${springScale})` }}>
        <div className="text-center">
          <div className="text-xs font-mono text-red-400 uppercase tracking-widest">ALPHA SQUAD</div>
          <div className="text-6xl font-black text-white italic mt-1">13</div>
        </div>
        <div className="text-center px-4">
          <div className="bg-yellow-500 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase mb-2 tracking-widest animate-pulse">MATCH POINT</div>
          <div className="text-4xl font-black text-white">VS</div>
          <div className="text-xs text-slate-300 font-mono mt-1">{title}</div>
        </div>
        <div className="text-center">
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest">OMEGA CLAN</div>
          <div className="text-6xl font-black text-white italic mt-1">11</div>
        </div>
      </div>
    );
  }

  // Cinematic / Explainer default
  return (
    <div className="text-center p-8 max-w-3xl space-y-4">
      <span className="text-amber-400 font-serif tracking-[0.3em] uppercase text-xs border-b border-amber-400/40 pb-1">
        {cat} PRODUCTION
      </span>
      <h1 className="text-5xl sm:text-7xl font-serif text-amber-100 font-light tracking-wide drop-shadow-2xl" style={{ color: primaryColor, transform: `scale(${springScale})` }}>
        {title}
      </h1>
      <p className="text-slate-300 font-serif italic text-lg max-w-xl mx-auto">
        {subtitle}
      </p>
    </div>
  );
};
