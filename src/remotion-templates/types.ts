export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export type TemplateCategory = 
  | 'All'
  | 'Featured & Curated'
  | 'Social Media' 
  | 'Kinetic Typography' 
  | 'SaaS & Tech' 
  | 'E-Commerce' 
  | 'Gaming' 
  | 'Podcast & Audio' 
  | 'Cinematic' 
  | 'Explainer & Education'
  | 'Neon & FX'
  | string;

export interface TemplatePreviewConfig {
  defaultTitle: string;
  defaultSubtitle: string;
  primaryColor: string;
  secondaryColor: string;
  speed: number;
}

export interface RemotionTemplate {
  id: string;
  title: string;
  category: TemplateCategory;
  description: string;
  difficulty: DifficultyLevel;
  views: number;
  author: string;
  tags: string[];
  duration: string; // e.g. "15s"
  codeSnippet: string;
  previewConfig: TemplatePreviewConfig;
  isFavorite?: boolean;
  thumbnailGradient: string;
  previewImageUrl?: string;
  previewVideoUrl?: string;
  compositionId?: string;
  durationInFrames?: number;
  fps?: number;
  width?: number;
  height?: number;
  aspectRatio?: string;
  defaultProps?: Record<string, any>;
}

export interface VideoProfile {
  id: string;
  name: string;
  category: string;
  description: string;
  iconName: string;
  defaultPrompt: string;
  recommendedTemplateId: string;
}

export interface AiScene {
  sceneNumber: number;
  title: string;
  duration: number;
  visualDescription: string;
  voiceover: string;
  codePropsSnippet: string;
}

export interface AiScriptData {
  title: string;
  summary: string;
  durationSeconds: number;
  visualStyle: {
    colorPalette: string[];
    typography: string;
    animationVibe: string;
  };
  scenes: AiScene[];
  aiPrompt: string;
}
