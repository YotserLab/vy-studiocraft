// Render service — Remotion + Gemini para a feature /templates.
// Porta padrão :8090. Em dev o Vite proxifica /api/render*, /api/gemini/* e os
// diretórios de mídia; em prod o backend Go faz o mesmo via RENDER_SERVICE_URL.
import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { GoogleGenAI } from '@google/genai';

const execAsync = promisify(exec);
const PROJECT_ROOT = path.resolve(process.cwd());
const MEDIA_DIR = path.resolve(PROJECT_ROOT, process.env.MEDIA_DIR || 'media');
const PORT = Number.parseInt(process.env.RENDER_PORT || '8090', 10);
const REMOTION_ENTRY = process.env.REMOTION_ENTRY || 'src/remotion-templates/remotion/index.ts';

const RENDERED_DIR = path.join(MEDIA_DIR, 'rendered');
const CACHE_DIR = path.join(MEDIA_DIR, 'cache');
const THUMBNAILS_DIR = path.join(MEDIA_DIR, 'thumbnails');
const PREVIEWS_DIR = path.join(MEDIA_DIR, 'previews');
const RENDERCOMP_DIR = path.join(MEDIA_DIR, 'rendercomp-thumbs');
for (const dir of [RENDERED_DIR, CACHE_DIR, THUMBNAILS_DIR, PREVIEWS_DIR, RENDERCOMP_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

const app = express();
app.use(express.json({ limit: '2mb' }));

app.use('/rendered', express.static(RENDERED_DIR));
app.use('/cache', express.static(CACHE_DIR));
app.use('/thumbnails', express.static(THUMBNAILS_DIR));
app.use('/previews', express.static(PREVIEWS_DIR));
app.use('/rendercomp-thumbs', express.static(RENDERCOMP_DIR));

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } })
  : null;

const COMPOSITION_MAP: Record<string, string> = {
  'rem-ppt-steps': 'StepProcessInfographic',
  'rem-ppt-timeline': 'TimelineInfographic',
  'rem-ppt-handdrawn': 'HandDrawnSketch',
  'rem-ppt-chart': 'AnimatedChartInfographic',
  'rem-ppt-morph': 'MorphCameraZoom',
  'rem-ppt-circular': 'CircularProcessInfographic',
  'rem-ppt-comparison': 'SplitComparisonInfographic',
  'rem-doc-collage': 'DocumentaryCollageScene',
  'DocumentaryCollageScene': 'DocumentaryCollageScene',
  'rem-1min-masterpiece': 'OneMinuteMasterpiece',
  'OneMinuteMasterpiece': 'OneMinuteMasterpiece',
  'rem-kinetic-captions': 'KineticCaptionsScene',
  'KineticCaptionsScene': 'KineticCaptionsScene',
  'rem-kinetic-hustle': 'KineticCaptionsHustle',
  'KineticCaptionsHustle': 'KineticCaptionsHustle',
  'rem-audiogram': 'AudiogramWaveformScene',
  'AudiogramWaveformScene': 'AudiogramWaveformScene',
  'rem-rve-glitch': 'GlitchTextScene',
  'GlitchTextScene': 'GlitchTextScene',
  'rem-rve-countdown': 'CountdownIntroScene',
  'CountdownIntroScene': 'CountdownIntroScene',
  'rem-rve-donut': 'DonutChartScene',
  'DonutChartScene': 'DonutChartScene',
  'rem-rve-area': 'AreaChartScene',
  'AreaChartScene': 'AreaChartScene',
  'rem-ae-doc': 'CinematicDocumentaryScene',
  'CinematicDocumentaryScene': 'CinematicDocumentaryScene',
  'rem-ae-glass3d': 'Theme3DGlassScene',
  'Theme3DGlassScene': 'Theme3DGlassScene',
  'rem-torn-doc': 'TornDocumentClip',
  'rem-torn-multiverse': 'TornMultiVerseClip',
  'rem-cena-viva-statement': 'CenaVivaStatement',
  'rem-cena-viva-chapter': 'CenaVivaChapter',
  'rem-typewriter-quote': 'TypewriterQuote',
  'rem-viral-hook': 'ViralKineticHook',
  'rem-saas-mockup': 'SaaSMockup',
  'rem-001': 'ViralKineticHook',
  'rem-002': 'SaaSMockup',
  'StepProcessInfographic': 'StepProcessInfographic',
  'TimelineInfographic': 'TimelineInfographic',
  'HandDrawnSketch': 'HandDrawnSketch',
  'AnimatedChartInfographic': 'AnimatedChartInfographic',
  'MorphCameraZoom': 'MorphCameraZoom',
  'TornDocumentClip': 'TornDocumentClip',
  'TornMultiVerseClip': 'TornMultiVerseClip',
  'CenaVivaStatement': 'CenaVivaStatement',
  'CenaVivaChapter': 'CenaVivaChapter',
  'TypewriterQuote': 'TypewriterQuote',
  'ViralKineticHook': 'ViralKineticHook',
  'SaaSMockup': 'SaaSMockup',
};

app.post('/api/render', async (req, res) => {
  const startTime = Date.now();
  try {
    const { templateId, compositionId, props, resolution, codec = 'h264' } = req.body;

    const compToRender =
      compositionId ||
      COMPOSITION_MAP[templateId] ||
      templateId ||
      (templateId?.includes('Shorts') ? 'TornDocumentClipShorts' : 'StepProcessInfographic');

    const timestamp = Date.now();
    const outputFilename = `render_${compToRender}_${timestamp}.mp4`;
    const outputPath = path.join(RENDERED_DIR, outputFilename);

    const tempPropsPath = path.join('/tmp', `props_${timestamp}.json`);
    const renderProps = props && typeof props === 'object' ? props : {};
    fs.writeFileSync(tempPropsPath, JSON.stringify(renderProps));

    let scaleFlag = '';
    if (resolution === '720p') scaleFlag = '--scale=0.6666666666666666';
    else if (resolution === '4K') scaleFlag = '--scale=2';

    const command = `bunx --package @remotion/cli remotion render ${REMOTION_ENTRY} ${compToRender} "${outputPath}" --props="${tempPropsPath}" --codec=${codec} ${scaleFlag} --concurrency=8 --log=warn`;
    console.log(`[render] ${command}`);

    const { stderr } = await execAsync(command, {
      cwd: PROJECT_ROOT,
      timeout: 600000,
      maxBuffer: 1024 * 1024 * 50,
    });

    try {
      if (fs.existsSync(tempPropsPath)) fs.unlinkSync(tempPropsPath);
    } catch { /* noop */ }

    if (!fs.existsSync(outputPath)) {
      throw new Error(`Output file not generated. Stderr: ${stderr}`);
    }

    const stats = fs.statSync(outputPath);
    const renderTimeMs = Date.now() - startTime;
    console.log(`[render] done in ${renderTimeMs}ms: ${outputFilename} (${stats.size} bytes)`);

    return res.json({
      success: true,
      videoUrl: `/rendered/${outputFilename}`,
      filename: outputFilename,
      sizeBytes: stats.size,
      sizeMb: (stats.size / (1024 * 1024)).toFixed(2),
      renderTimeMs,
      compositionId: compToRender,
    });
  } catch (error: any) {
    console.error('[render] error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to render video',
      details: error.stderr || error.stdout,
    });
  }
});

app.get('/api/rendered', (_req, res) => {
  try {
    const files = fs.readdirSync(RENDERED_DIR).filter((f) => f.endsWith('.mp4'));
    const videos = files
      .map((filename) => {
        const stats = fs.statSync(path.join(RENDERED_DIR, filename));
        return {
          filename,
          videoUrl: `/rendered/${filename}`,
          sizeBytes: stats.size,
          sizeMb: (stats.size / (1024 * 1024)).toFixed(2),
          createdAt: stats.mtime,
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json({ success: true, videos });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/gemini/generate-script', async (req, res) => {
  try {
    const { topic, templateTitle, videoType, tone, duration, preferredTemplates } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    if (ai) {
      const systemInstruction = `You are an expert video director, motion designer, and Remotion video architect.
You create engaging video production scripts, scene-by-scene storyboards, voiceover scripts, and visual style specifications that integrate seamlessly with Remotion templates.
Always output valid JSON with the following structure:
{
  "title": "Generated Video Title",
  "summary": "Short high-impact summary",
  "durationSeconds": 30,
  "visualStyle": {
    "colorPalette": ["#ff0055", "#00f0ff", "#111122"],
    "typography": "Modern Sans + Bold Mono",
    "animationVibe": "Fast-paced kinetic with smooth spring physics"
  },
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "Hook",
      "duration": 5,
      "visualDescription": "Bold kinetic headline zooming in with particle burst",
      "voiceover": "Did you know that...",
      "codePropsSnippet": "{\\n  title: 'Did you know?',\\n  accentColor: '#ff0055'\\n}"
    }
  ],
  "aiPrompt": "Cinematic 4K render of... photorealistic lighting, high detail"
}`;

      const preferredText =
        preferredTemplates && preferredTemplates.length > 0
          ? `User's Preferred Animation Templates/Styles: ${preferredTemplates.join(', ')}.`
          : '';

      const promptText = `Generate a complete video script and Remotion template config for:
- Topic/Subject: ${topic}
- Remotion Template Base: ${templateTitle || 'General Kinetic Typography'}
- Video Type / Format: ${videoType || 'TikTok / Shorts (Vertical 9:16)'}
- Tone: ${tone || 'Energetic & Professional'}
- Target Duration: ${duration || '30 seconds'}
${preferredText}
Return ONLY JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText,
        config: { systemInstruction, responseMimeType: 'application/json' },
      });

      const rawText = response.text || '{}';
      let parsedData;
      try {
        parsedData = JSON.parse(rawText);
      } catch {
        parsedData = { raw: rawText };
      }
      return res.json({ success: true, data: parsedData });
    }

    const fallbackData = {
      title: `Roteiro: ${topic}`,
      summary: `Roteiro otimizado para retenção e engajamento com templates Remotion sobre "${topic}".`,
      durationSeconds: 30,
      visualStyle: {
        colorPalette: ['#e5c07b', '#f2ede4', '#0c0e12'],
        typography: 'Lora Serif + Courier Prime Mono',
        animationVibe: 'Documentário investigativo, marca-texto dinâmico e física de mola',
      },
      scenes: [
        {
          sceneNumber: 1,
          title: 'Gancho Visual (Hook)',
          duration: 5,
          visualDescription: 'Recorte de documento confidencial rasgado entrando com mola e marca-texto amarelo vibrante.',
          voiceover: `Você já parou para pensar no que realmente acontece quando analisamos ${topic}?`,
          codePropsSnippet: `{\n  topLabel: 'investigação especial',\n  mainQuote: 'O segredo por trás de ${topic} que poucos compreendem.',\n  highlightedText: '${topic}'\n}`,
        },
        {
          sceneNumber: 2,
          title: 'Desenvolvimento e Contraste',
          duration: 15,
          visualDescription: 'Transição suave Slide & Swap para página 2 com citação e dados em alta resolução.',
          voiceover: `Os dados revelam um padrão que transforma completamente nossa perspectiva tradicional.`,
          codePropsSnippet: `{\n  phrase: 'A clareza é o poder definitivo na era da sobrecarga de informação.',\n  source: 'Relatório Executivo 2026'\n}`,
        },
        {
          sceneNumber: 3,
          title: 'Chamada para Ação (CTA)',
          duration: 10,
          visualDescription: 'Frase minimalista com aspas estilizadas em ocre e iluminação de vinheta.',
          voiceover: `Inscreva-se e ative as notificações para acompanhar a série completa no canal.`,
          codePropsSnippet: `{\n  title: 'INSCREVA-SE NO CANAL',\n  subtitle: 'Novos episódios toda semana às 19h'\n}`,
        },
      ],
      aiPrompt: `Cinematic documentary shot, archival paper exhibit with yellow highlighter mark on desk, low key dramatic lighting, 8k resolution, photorealistic.`,
    };
    return res.json({ success: true, data: fallbackData });
  } catch (error: any) {
    console.error('Gemini Script Generation Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to generate AI script' });
  }
});

app.post('/api/gemini/generate-prompt', async (req, res) => {
  try {
    const { concept, aiModel, style } = req.body;
    if (ai) {
      const promptText = `Generate 3 specialized, highly optimized video generation prompts for ${aiModel || 'Runway Gen-3 / Sora'} based on this concept: "${concept}". Style: ${style || 'Cinematic 8K'}.
Return JSON with format:
{
  "prompts": [
    {
      "title": "Cinematic Masterpiece",
      "prompt": "...",
      "cameraMotion": "Slow orbital pan",
      "lighting": "Golden hour volumetric"
    }
  ]
}`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText,
        config: { responseMimeType: 'application/json' },
      });
      const parsed = JSON.parse(response.text || '{}');
      return res.json({ success: true, data: parsed });
    }
    return res.json({
      success: true,
      data: {
        prompts: [
          {
            title: 'Cinematic Archival Realism',
            prompt: `Close-up shot of hands turning the pages of an antique leather book, soft candle flame illumination, dust motes floating in warm volumetric light, shot on 35mm film, 8k.`,
            cameraMotion: 'Slow macro dolly-in with rack focus',
            lighting: 'Warm candlelight with deep peripheral shadows',
          },
          {
            title: 'Modern Documentary Investigation',
            prompt: `Torn legal document resting on dark mahogany table, vivid yellow highlighter glowing under spotlight, film grain, anamorphic lens flare, photorealistic documentary style.`,
            cameraMotion: 'Top-down orbital pan, subtle breathing motion',
            lighting: 'Cool directional spotlight with dark vignette',
          },
        ],
      },
    });
  } catch (error: any) {
    console.error('Prompt Gen Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[render-service] ativo em http://0.0.0.0:${PORT} (MEDIA_DIR=${MEDIA_DIR}, GEMINI=${ai ? 'on' : 'off'})`);
});
