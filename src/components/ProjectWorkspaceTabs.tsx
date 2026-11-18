import React, { useState } from 'react';
import {
  CheckSquare,
  Copy,
  ExternalLink,
  Loader2,
  MessageCircle,
  Music,
  Plus,
  Sparkles,
  Square,
  Trash2,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { aiApi, fsApi, increment, type FsDoc } from '../lib/dataClient';
import { navigate } from '../lib/router';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { KanbanStage, ProjetoDoc } from '../views/ProjectsViews';

export interface ProjetoFonte {
  id: string;
  tipo: string;
  titulo: string;
  url: string;
  obs: string;
}

export interface ProjetoCapitulo {
  id: string;
  titulo: string;
  texto: string;
}

export interface ProjetoThumbItem {
  id: string;
  nome: string;
  texto: string;
  ctr: string;
}

export interface ProjetoPlanoRow {
  tempo: string;
  narracao: string;
  visual: string;
  sfx: string;
  musica: string;
}

export interface ProjetoExtendedDoc extends ProjetoDoc {
  resumo?: string;
  porqueInteressante?: string;
  categoria?: string;
  palavrasChave?: string;
  titulosAlternativos?: string;
  descricaoYoutube?: string;
  tagsYoutube?: string;
  capitulos?: ProjetoCapitulo[];
  fontes?: ProjetoFonte[];
  thumbConceito?: string;
  thumbRefs?: string;
  thumbsFeitas?: ProjetoThumbItem[];
  plano?: ProjetoPlanoRow[];
  retencaoCurva?: string;
  metricasPos?: {
    views?: string;
    impressoes?: string;
    ctr?: string;
    retencao?: string;
    ret30?: string;
    duracaoMedia?: string;
    inscritos?: string;
    likes?: string;
    comentarios?: string;
    funcionou?: string;
    naoFuncionou?: string;
    repetir?: string;
    evitar?: string;
    comentariosNotas?: string;
  };
}

interface VersaoDoc {
  versao: number;
  autor: string;
  resumoMudanca: string;
  conteudo: string;
}

type TabKey = 'info' | 'roteiro' | 'pesquisa' | 'thumb' | 'pos';

const STAGES: Array<{ id: KanbanStage; label: string }> = [
  { id: 'ideacao', label: 'Ideação' },
  { id: 'roteiro', label: 'Roteiro' },
  { id: 'gravacao', label: 'Gravação' },
  { id: 'edicao', label: 'Edição' },
  { id: 'publicado', label: 'Publicado' },
];

export function ProjectWorkspaceTabs({
  proj,
  versions,
  onReload,
}: {
  proj: FsDoc<ProjetoExtendedDoc>;
  versions: FsDoc<VersaoDoc>[];
  onReload: () => Promise<void>;
}) {
  const { user, notify } = useApp();
  const [tab, setTab] = useState<TabKey>('info');
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [aiOutput, setAiOutput] = useState<{ action: string; title: string; text: string } | null>(null);

  // Local editable states initialized from proj.data
  const d = proj.data;
  const [titulo, setTitulo] = useState(d.titulo || '');
  const [ganchoResumo, setGanchoResumo] = useState(d.ganchoResumo || '');
  const [resumo, setResumo] = useState(d.resumo || '');
  const [porqueInteressante, setPorqueInteressante] = useState(d.porqueInteressante || '');
  const [categoria, setCategoria] = useState(d.categoria || '');
  const [palavrasChave, setPalavrasChave] = useState(d.palavrasChave || '');
  const [titulosAlternativos, setTitulosAlternativos] = useState(d.titulosAlternativos || '');
  const [descricaoYoutube, setDescricaoYoutube] = useState(d.descricaoYoutube || '');
  const [tagsYoutube, setTagsYoutube] = useState(d.tagsYoutube || '');

  const [newCheckText, setNewCheckText] = useState('');
  const [verSummary, setVerSummary] = useState('');
  const [verContent, setVerContent] = useState('');

  // Script chapters
  const [capitulos, setCapitulos] = useState<ProjetoCapitulo[]>(
    d.capitulos && d.capitulos.length > 0
      ? d.capitulos
      : [
          {
            id: 'cap_1',
            titulo: '01 — Abertura & Gancho (00:00 – 00:30)',
            texto: d.ganchoResumo || '',
          },
        ]
  );

  // Research sources
  const [fontes, setFontes] = useState<ProjetoFonte[]>(d.fontes || []);
  const [newFonteTipo, setNewFonteTipo] = useState('Artigo');
  const [newFonteTitulo, setNewFonteTitulo] = useState('');
  const [newFonteUrl, setNewFonteUrl] = useState('');
  const [newFonteObs, setNewFonteObs] = useState('');

  // Thumb
  const [thumbConceito, setThumbConceito] = useState(d.thumbConceito || '');
  const [thumbRefs, setThumbRefs] = useState(d.thumbRefs || '');
  const [thumbsFeitas, setThumbsFeitas] = useState<ProjetoThumbItem[]>(d.thumbsFeitas || []);
  const [newThumbNome, setNewThumbNome] = useState('');
  const [newThumbTexto, setNewThumbTexto] = useState('');
  const [newThumbCtr, setNewThumbCtr] = useState('');

  // Plan & Post
  const [plano, setPlano] = useState<ProjetoPlanoRow[]>(d.plano || []);
  const [pendingPlano, setPendingPlano] = useState<ProjetoPlanoRow[] | null>(null);
  const [retencaoCurva, setRetencaoCurva] = useState(d.retencaoCurva || '');
  const [metricasPos, setMetricasPos] = useState(d.metricasPos || {});

  // Comments reply
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentExtra, setCommentExtra] = useState('');
  const [commentReply, setCommentReply] = useState('');

  const patchProject = async (fields: Record<string, unknown>, msg?: string) => {
    if (!user) return;
    await fsApi.patchDoc(`usuarios/${user.id}/projetos/${proj.id}`, fields);
    if (msg) notify(msg, 'ok');
    await onReload();
  };

  const buildPayloadProject = () => ({
    titulo,
    canalNome: d.canalNome,
    estagio: d.estagio,
    ganchoResumo,
    resumo,
    porqueInteressante,
    categoria,
    palavrasChave,
    capitulos,
    fontes,
    thumbConceito,
    thumbRefs,
    thumbsFeitas,
    retencaoCurva,
    metricasPos,
  });

  const runTextAction = async (action: string, title: string, extra: Record<string, unknown> = {}) => {
    setAiBusy(action);
    try {
      const res = await aiApi.action(action, {
        project: buildPayloadProject(),
        ...extra,
      });
      setAiOutput({ action, title, text: res.text || '' });
      notify(`${title} concluída.`, 'ok');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao executar IA.', 'err');
    } finally {
      setAiBusy(null);
    }
  };

  const handleApplyAiOutput = async () => {
    if (!aiOutput) return;
    const { action, text } = aiOutput;

    if (action === 'project:titles_20') {
      const cleaned = text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => /^\d+[\).\-\s]/.test(l))
        .map((l) => l.replace(/^\d+[\).\-\s]+/, '').replace(/\*\*/g, '').trim())
        .slice(0, 20)
        .join('\n');
      const finalVal = cleaned || text;
      setTitulosAlternativos(finalVal);
      await patchProject({ titulosAlternativos: finalVal }, 'Títulos aplicados ao projeto.');
      return;
    }

    if (action === 'project:hooks_5') {
      const match = text.match(/##\s*Hook\s*1[^\n]*\n+([\s\S]*?)(?=\n##\s*Hook\s*2|$)/i);
      const hook1 = (match ? match[1] : text.split('\n\n')[0] || '').trim();
      setGanchoResumo(hook1);
      await patchProject({ ganchoResumo: hook1 }, 'Hook 1 aplicado ao projeto.');
      return;
    }

    if (action === 'project:desc_tags') {
      const descMatch = text.match(/##\s*Descri[çc][ãa]o[\s\S]*?\n([\s\S]*?)(?=\n##\s*Palavras-chave|$)/i);
      const kwMatch = text.match(/##\s*Palavras-chave[^\n]*\n+([^\n#]+)/i);
      const tagsMatch = text.match(/##\s*Tags[^\n]*\n+([^\n#]+)/i);
      const nextDesc = descMatch ? descMatch[1].trim() : text;
      const nextKw = kwMatch ? kwMatch[1].trim() : palavrasChave;
      const nextTags = tagsMatch ? tagsMatch[1].trim() : tagsYoutube;
      setDescricaoYoutube(nextDesc);
      setPalavrasChave(nextKw);
      setTagsYoutube(nextTags);
      await patchProject(
        { descricaoYoutube: nextDesc, palavrasChave: nextKw, tagsYoutube: nextTags },
        'Descrição, palavras-chave e tags aplicadas.'
      );
      return;
    }

    if (action === 'project:script_chapters' || action === 'project:script_revise') {
      const sections = text.split(/\n(?=##\s+)/).filter((s) => s.trim().startsWith('##'));
      if (sections.length > 0) {
        const parsedCaps: ProjetoCapitulo[] = [];
        sections.forEach((sec, idx) => {
          const lines = sec.trim().split('\n');
          const heading = lines[0].replace(/^##\s+/, '').trim();
          if (/o que mudei/i.test(heading)) return;
          const body = lines.slice(1).join('\n').trim();
          parsedCaps.push({
            id: `cap_${Date.now()}_${idx}`,
            titulo: heading,
            texto: action === 'project:script_chapters' ? body : body,
          });
        });
        if (parsedCaps.length > 0) {
          setCapitulos(parsedCaps);
          await patchProject({ capitulos: parsedCaps }, 'Capítulos aplicados ao roteiro.');
        }
      }
      return;
    }

    if (action === 'project:post_analysis') {
      const extractSec = (label: string) => {
        const re = new RegExp(`##\\s*${label}[^\\n]*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, 'i');
        const m = text.match(re);
        return m ? m[1].trim() : '';
      };
      const nextPos = {
        ...metricasPos,
        funcionou: extractSec('O que funcionou') || metricasPos.funcionou,
        naoFuncionou: extractSec('O que não funcionou') || metricasPos.naoFuncionou,
        repetir: extractSec('O que repetir') || metricasPos.repetir,
        evitar: extractSec('O que evitar') || metricasPos.evitar,
      };
      setMetricasPos(nextPos);
      await patchProject({ metricasPos: nextPos }, 'Lições pós-publicação aplicadas.');
      return;
    }

    if (action === 'project:post_playbook' && user) {
      const ruleLines = text
        .split('\n')
        .map((l) => l.trim().replace(/^[-*]\s*/, ''))
        .filter((l) => /^\[[a-zçãõ]+\]/i.test(l));
      for (const line of ruleLines) {
        const m = line.match(/^\[([^\]]+)\]\s*(.+)$/);
        if (m) {
          await fsApi.createDoc(`usuarios/${user.id}/playbook`, {
            categoria: m[1].trim(),
            titulo: `${m[1].trim().toUpperCase()} — ${titulo.slice(0, 42)}`,
            regra: m[2].trim(),
            impacto: 'Extraído da análise pós-publicação',
          });
        }
      }
      notify(`${ruleLines.length} regra(s) adicionada(s) ao Playbook.`, 'ok');
    }
  };

  const appendChecklistText = async (texto: string) => {
    const clean = texto.replace(/\*\*/g, '').trim();
    if (!clean) return;
    const nextList = [...(d.checklist || []), { id: `chk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, texto: clean, feito: false }];
    await patchProject({ checklist: nextList }, 'Item adicionado ao checklist.');
  };

  const canApplyAi =
    aiOutput &&
    [
      'project:titles_20',
      'project:hooks_5',
      'project:desc_tags',
      'project:script_chapters',
      'project:script_revise',
      'project:post_analysis',
      'project:post_playbook',
    ].includes(aiOutput.action);

  const toggleCheck = async (checkId: string) => {
    const nextList = (d.checklist || []).map((c) => (c.id === checkId ? { ...c, feito: !c.feito } : c));
    await patchProject({ checklist: nextList });
  };

  const addCheckItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheckText.trim()) return;
    const nextList = [...(d.checklist || []), { id: `chk_${Date.now()}`, texto: newCheckText.trim(), feito: false }];
    await patchProject({ checklist: nextList });
    setNewCheckText('');
  };

  const saveNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !verContent.trim()) return;
    const nextVer = (d.versaoAtual || 1) + 1;
    await fsApi.setDoc(`usuarios/${user.id}/projetos/${proj.id}/versoes/v${nextVer}`, {
      versao: nextVer,
      autor: user.displayName,
      resumoMudanca: verSummary.trim() || `Revisão v${nextVer}`,
      conteudo: verContent.trim(),
    });
    await fsApi.patchDoc(`usuarios/${user.id}/projetos/${proj.id}`, { versaoAtual: increment(1) });
    setVerSummary('');
    setVerContent('');
    notify(`Versão v${nextVer} salva.`, 'ok');
    await onReload();
  };

  return (
    <div className="space-y-6">
      {/* Sub-header metadata + Tabs */}
      <div className="vy-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {d.canalNome} · {d.formato === 'shorts' ? 'Shorts' : 'Vídeo Longo'} · Versão v{d.versaoAtual || 1}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-lg border" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-hairline)' }}>
            {(
              [
                { id: 'info', label: 'Informações' },
                { id: 'roteiro', label: 'Roteiro & Suno' },
                { id: 'pesquisa', label: 'Pesquisa' },
                { id: 'thumb', label: 'Thumbnail' },
                { id: 'pos', label: 'Plano & Pós' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className="px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors"
                style={{
                  backgroundColor: tab === t.id ? 'var(--bg-surface)' : 'transparent',
                  color: tab === t.id ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <select
            value={d.estagio}
            onChange={(e) => void patchProject({ estagio: e.target.value }, 'Estágio atualizado.')}
            className="vy-input px-3 py-1.5 text-xs"
          >
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Shared Interactive AI Output Panel */}
      {aiOutput && (
        <div className="vy-card p-5 space-y-4" style={{ borderColor: 'var(--accent)' }}>
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--border-hairline)' }}>
            <div className="font-display font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--accent)' }}>
              <Sparkles className="w-4 h-4" />
              <span>{aiOutput.title}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canApplyAi && (
                <button
                  type="button"
                  onClick={() => void handleApplyAiOutput()}
                  className="vy-btn-primary px-3 py-1 text-xs font-medium"
                >
                  Aplicar Tudo no Projeto
                </button>
              )}
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(aiOutput.text).catch(() => undefined);
                  notify('Resposta copiada.', 'info');
                }}
                className="vy-btn-secondary px-2.5 py-1 text-xs inline-flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>Copiar</span>
              </button>
              <button
                type="button"
                onClick={() => setAiOutput(null)}
                className="vy-btn-secondary px-2.5 py-1 text-xs"
              >
                Fechar
              </button>
            </div>
          </div>

          <div className="max-h-[32rem] overflow-y-auto pr-1">
            <MarkdownRenderer
              content={aiOutput.text}
              renderSectionAction={({ heading, body }) => {
                if (!body) return null;
                const action = aiOutput.action;

                if (action === 'project:analyze_idea') {
                  if (/ângulo/i.test(heading)) {
                    return (
                      <button
                        type="button"
                        onClick={async () => {
                          setResumo(body);
                          await patchProject({ resumo: body }, 'Ângulo aplicado ao Resumo.');
                        }}
                        className="vy-btn-primary px-2.5 py-0.5 text-[11px] font-medium"
                      >
                        Aplicar no Resumo
                      </button>
                    );
                  }
                  if (/público/i.test(heading)) {
                    return (
                      <button
                        type="button"
                        onClick={async () => {
                          setPorqueInteressante(body);
                          await patchProject({ porqueInteressante: body }, 'Público aplicado ao briefing.');
                        }}
                        className="vy-btn-secondary px-2.5 py-0.5 text-[11px] font-medium"
                      >
                        Aplicar em Por que interessa
                      </button>
                    );
                  }
                }

                if (action === 'project:hooks_5' && /hook/i.test(heading)) {
                  return (
                    <button
                      type="button"
                      onClick={async () => {
                        setGanchoResumo(body);
                        await patchProject({ ganchoResumo: body }, `${heading} aplicado ao gancho.`);
                      }}
                      className="vy-btn-primary px-2.5 py-0.5 text-[11px] font-medium"
                    >
                      Usar este Hook
                    </button>
                  );
                }

                if (action === 'project:desc_tags') {
                  if (/descri/i.test(heading)) {
                    return (
                      <button
                        type="button"
                        onClick={async () => {
                          setDescricaoYoutube(body);
                          await patchProject({ descricaoYoutube: body }, 'Descrição aplicada.');
                        }}
                        className="vy-btn-primary px-2.5 py-0.5 text-[11px] font-medium"
                      >
                        Aplicar Descrição
                      </button>
                    );
                  }
                  if (/palavras/i.test(heading)) {
                    return (
                      <button
                        type="button"
                        onClick={async () => {
                          setPalavrasChave(body);
                          await patchProject({ palavrasChave: body }, 'Palavras-chave aplicadas.');
                        }}
                        className="vy-btn-secondary px-2.5 py-0.5 text-[11px] font-medium"
                      >
                        Aplicar Palavras-chave
                      </button>
                    );
                  }
                  if (/tags/i.test(heading)) {
                    return (
                      <button
                        type="button"
                        onClick={async () => {
                          setTagsYoutube(body);
                          await patchProject({ tagsYoutube: body }, 'Tags aplicadas.');
                        }}
                        className="vy-btn-secondary px-2.5 py-0.5 text-[11px] font-medium"
                      >
                        Aplicar Tags
                      </button>
                    );
                  }
                }

                if (action === 'project:script_chapters' || action === 'project:script_revise') {
                  if (/o que mudei/i.test(heading)) return null;
                  return (
                    <button
                      type="button"
                      onClick={async () => {
                        const nextCaps = [
                          ...capitulos,
                          { id: `cap_${Date.now()}`, titulo: heading, texto: body },
                        ];
                        setCapitulos(nextCaps);
                        await patchProject({ capitulos: nextCaps }, `Capítulo "${heading}" adicionado.`);
                      }}
                      className="vy-btn-secondary px-2.5 py-0.5 text-[11px] font-medium"
                    >
                      + Adicionar Capítulo
                    </button>
                  );
                }

                if (action === 'project:script_cta' && /opç/i.test(heading)) {
                  return (
                    <button
                      type="button"
                      onClick={async () => {
                        const nextCaps = [
                          ...capitulos,
                          { id: `cap_${Date.now()}`, titulo: `CTA Final (${heading})`, texto: body },
                        ];
                        setCapitulos(nextCaps);
                        await patchProject({ capitulos: nextCaps }, 'CTA inserido como capítulo final.');
                      }}
                      className="vy-btn-primary px-2.5 py-0.5 text-[11px] font-medium"
                    >
                      + Inserir CTA no Roteiro
                    </button>
                  );
                }

                if (action === 'project:thumb_concepts' && /conceito/i.test(heading)) {
                  return (
                    <button
                      type="button"
                      onClick={async () => {
                        const val = `${heading}\n${body}`;
                        setThumbConceito(val);
                        await patchProject({ thumbConceito: val }, 'Conceito aplicado na aba Thumbnail.');
                      }}
                      className="vy-btn-primary px-2.5 py-0.5 text-[11px] font-medium"
                    >
                      Usar Conceito
                    </button>
                  );
                }

                if (action === 'project:thumb_prompts' && /prompt/i.test(heading)) {
                  return (
                    <button
                      type="button"
                      onClick={async () => {
                        const next = thumbRefs ? `${thumbRefs}\n\n${heading}: ${body}` : `${heading}: ${body}`;
                        setThumbRefs(next);
                        await patchProject({ thumbRefs: next }, 'Prompt salvo em Referências de Thumbnail.');
                      }}
                      className="vy-btn-secondary px-2.5 py-0.5 text-[11px] font-medium"
                    >
                      Salvar em Referências
                    </button>
                  );
                }

                if (action === 'project:post_analysis') {
                  if (/o que funcionou/i.test(heading)) {
                    return (
                      <button
                        type="button"
                        onClick={async () => {
                          const nextPos = { ...metricasPos, funcionou: body };
                          setMetricasPos(nextPos);
                          await patchProject({ metricasPos: nextPos }, 'Campo "O que funcionou" atualizado.');
                        }}
                        className="vy-btn-secondary px-2.5 py-0.5 text-[11px]"
                      >
                        Aplicar
                      </button>
                    );
                  }
                  if (/não funcionou/i.test(heading)) {
                    return (
                      <button
                        type="button"
                        onClick={async () => {
                          const nextPos = { ...metricasPos, naoFuncionou: body };
                          setMetricasPos(nextPos);
                          await patchProject({ metricasPos: nextPos }, 'Campo "O que não funcionou" atualizado.');
                        }}
                        className="vy-btn-secondary px-2.5 py-0.5 text-[11px]"
                      >
                        Aplicar
                      </button>
                    );
                  }
                  if (/repetir/i.test(heading)) {
                    return (
                      <button
                        type="button"
                        onClick={async () => {
                          const nextPos = { ...metricasPos, repetir: body };
                          setMetricasPos(nextPos);
                          await patchProject({ metricasPos: nextPos }, 'Campo "O que repetir" atualizado.');
                        }}
                        className="vy-btn-secondary px-2.5 py-0.5 text-[11px]"
                      >
                        Aplicar
                      </button>
                    );
                  }
                  if (/evitar/i.test(heading)) {
                    return (
                      <button
                        type="button"
                        onClick={async () => {
                          const nextPos = { ...metricasPos, evitar: body };
                          setMetricasPos(nextPos);
                          await patchProject({ metricasPos: nextPos }, 'Campo "O que evitar" atualizado.');
                        }}
                        className="vy-btn-secondary px-2.5 py-0.5 text-[11px]"
                      >
                        Aplicar
                      </button>
                    );
                  }
                }

                return null;
              }}
              renderListItemAction={({ text, heading, ordered }) => {
                const action = aiOutput.action;
                const clean = text.replace(/\*\*/g, '').trim();

                if (action === 'project:titles_20' && ordered) {
                  return (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          setTitulo(clean);
                          await patchProject({ titulo: clean }, 'Título principal atualizado.');
                        }}
                        className="vy-btn-primary px-2 py-0.5 text-[11px] font-medium whitespace-nowrap"
                      >
                        Usar Título
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const nextAlt = titulosAlternativos ? `${titulosAlternativos}\n${clean}` : clean;
                          setTitulosAlternativos(nextAlt);
                          await patchProject({ titulosAlternativos: nextAlt }, 'Adicionado aos títulos alternativos.');
                        }}
                        className="vy-btn-secondary px-2 py-0.5 text-[11px] whitespace-nowrap"
                      >
                        + Alt
                      </button>
                    </div>
                  );
                }

                if (action === 'project:thumb_texts' && ordered) {
                  return (
                    <button
                      type="button"
                      onClick={async () => {
                        const next = [
                          ...thumbsFeitas,
                          { id: `th_${Date.now()}`, nome: `Ideia ${thumbsFeitas.length + 1}`, texto: clean, ctr: '' },
                        ];
                        setThumbsFeitas(next);
                        await patchProject({ thumbsFeitas: next }, 'Texto adicionado às variações A/B.');
                      }}
                      className="vy-btn-secondary px-2 py-0.5 text-[11px] whitespace-nowrap"
                    >
                      + Variação A/B
                    </button>
                  );
                }

                if (action === 'project:post_playbook') {
                  const m = clean.match(/^\[([^\]]+)\]\s*(.+)$/);
                  if (m && user) {
                    return (
                      <button
                        type="button"
                        onClick={async () => {
                          await fsApi.createDoc(`usuarios/${user.id}/playbook`, {
                            categoria: m[1].trim(),
                            titulo: `${m[1].trim().toUpperCase()} — ${titulo.slice(0, 42)}`,
                            regra: m[2].trim(),
                            impacto: 'Extraído da análise pós-publicação',
                          });
                          notify('Regra adicionada ao Playbook.', 'ok');
                        }}
                        className="vy-btn-secondary px-2 py-0.5 text-[11px] whitespace-nowrap"
                      >
                        + Playbook
                      </button>
                    );
                  }
                }

                if (action === 'project:post_next_video' && /ideias/i.test(heading || '') && user) {
                  return (
                    <button
                      type="button"
                      onClick={async () => {
                        const created = await fsApi.createDoc(`usuarios/${user.id}/projetos`, {
                          titulo: clean.slice(0, 95),
                          canalId: d.canalId,
                          canalNome: d.canalNome,
                          estagio: 'ideacao',
                          formato: d.formato,
                          prioridade: 'media',
                          dataPublicacaoAlvo: '',
                          ctrAlvo: d.ctrAlvo || 8.0,
                          ganchoResumo: '',
                          resumo: `Sequência sugerida a partir de "${titulo}".`,
                          checklist: [{ id: 'c1', texto: 'Definir título e capa', feito: false }],
                          versaoAtual: 1,
                        });
                        notify('Novo projeto criado no Kanban.', 'ok');
                        navigate(`/projetos/${created.id}`);
                      }}
                      className="vy-btn-primary px-2 py-0.5 text-[11px] font-medium whitespace-nowrap"
                    >
                      + Criar Projeto
                    </button>
                  );
                }

                if (
                  action === 'project:script_retention' ||
                  action === 'project:script_broll' ||
                  action === 'project:research_gaps' ||
                  action === 'project:research_check'
                ) {
                  return (
                    <button
                      type="button"
                      onClick={() => void appendChecklistText(clean.slice(0, 120))}
                      className="vy-btn-secondary px-2 py-0.5 text-[11px] whitespace-nowrap"
                    >
                      + Checklist
                    </button>
                  );
                }

                return null;
              }}
            />
          </div>
        </div>
      )}

      {/* TAB 1: INFORMAÇÕES */}
      {tab === 'info' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <div className="vy-card p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  Briefing & Packaging
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { action: 'project:analyze_idea', label: 'Análise da ideia' },
                    { action: 'project:titles_20', label: '20 títulos' },
                    { action: 'project:hooks_5', label: '5 hooks' },
                    { action: 'project:desc_tags', label: 'Descrição e tags' },
                  ].map((btn) => (
                    <button
                      key={btn.action}
                      type="button"
                      disabled={aiBusy !== null}
                      onClick={() => void runTextAction(btn.action, btn.label)}
                      className="vy-btn-secondary px-2.5 py-1 text-xs inline-flex items-center gap-1"
                    >
                      {aiBusy === btn.action ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" style={{ color: 'var(--accent)' }} />}
                      <span>{btn.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Título Provisório</span>
                  <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="vy-input w-full px-3 py-2 text-sm" />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Hook / Gancho (0–30s)</span>
                  <textarea rows={3} value={ganchoResumo} onChange={(e) => setGanchoResumo(e.target.value)} className="vy-input w-full px-3 py-2 text-sm" />
                </label>

                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="block space-y-1">
                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Categoria</span>
                    <input type="text" value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Ex: Tecnologia, Produto" className="vy-input w-full px-3 py-1.5 text-sm" />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Palavras-chave</span>
                    <input type="text" value={palavrasChave} onChange={(e) => setPalavrasChave(e.target.value)} placeholder="palavra 1, palavra 2..." className="vy-input w-full px-3 py-1.5 text-sm" />
                  </label>
                </div>

                <label className="block space-y-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Resumo / Tese Central</span>
                  <textarea rows={2} value={resumo} onChange={(e) => setResumo(e.target.value)} className="vy-input w-full px-3 py-2 text-sm" />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Por que é interessante para o público</span>
                  <textarea rows={2} value={porqueInteressante} onChange={(e) => setPorqueInteressante(e.target.value)} className="vy-input w-full px-3 py-2 text-sm" />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Títulos Alternativos</span>
                  <textarea rows={3} value={titulosAlternativos} onChange={(e) => setTitulosAlternativos(e.target.value)} placeholder="1 título por linha..." className="vy-input w-full px-3 py-2 text-xs" />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Descrição YouTube & Tags</span>
                  <textarea rows={3} value={descricaoYoutube} onChange={(e) => setDescricaoYoutube(e.target.value)} placeholder="Descrição otimizada..." className="vy-input w-full px-3 py-2 text-xs" />
                  <input type="text" value={tagsYoutube} onChange={(e) => setTagsYoutube(e.target.value)} placeholder="Tags separadas por vírgula" className="vy-input w-full px-3 py-1.5 text-xs mt-1.5" />
                </label>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      void patchProject(
                        {
                          titulo,
                          ganchoResumo,
                          resumo,
                          porqueInteressante,
                          categoria,
                          palavrasChave,
                          titulosAlternativos,
                          descricaoYoutube,
                          tagsYoutube,
                        },
                        'Informações do projeto salvas.'
                      )
                    }
                    className="vy-btn-primary px-4 py-2 text-xs font-medium"
                  >
                    Salvar Informações
                  </button>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="vy-card p-5 space-y-3">
              <h3 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Checklist de Produção
              </h3>
              <ul className="space-y-2">
                {(d.checklist || []).map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => void toggleCheck(item.id)}
                      className="flex items-center gap-2.5 text-sm text-left w-full py-1"
                      style={{
                        color: item.feito ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: item.feito ? 'line-through' : 'none',
                      }}
                    >
                      {item.feito ? (
                        <CheckSquare className="w-4 h-4 shrink-0" style={{ color: 'var(--status-ok)' }} />
                      ) : (
                        <Square className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                      )}
                      <span>{item.texto}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <form onSubmit={addCheckItem} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newCheckText}
                  onChange={(e) => setNewCheckText(e.target.value)}
                  placeholder="Novo item do checklist..."
                  className="vy-input flex-1 px-3 py-1.5 text-sm"
                />
                <button type="submit" className="vy-btn-secondary px-3 py-1.5 text-xs font-medium">
                  Adicionar
                </button>
              </form>
            </div>
          </div>

          {/* Right column: Versions */}
          <div className="lg:col-span-5 space-y-6">
            <div className="vy-card p-5 space-y-4">
              <h3 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Histórico de Versões (Subcoleção)
              </h3>
              <form onSubmit={saveNewVersion} className="space-y-2.5">
                <input
                  type="text"
                  value={verSummary}
                  onChange={(e) => setVerSummary(e.target.value)}
                  placeholder="Resumo da alteração"
                  className="vy-input w-full px-3 py-1.5 text-sm"
                />
                <textarea
                  rows={3}
                  required
                  value={verContent}
                  onChange={(e) => setVerContent(e.target.value)}
                  placeholder="Conteúdo da nova versão..."
                  className="vy-input w-full px-3 py-2 text-sm"
                />
                <button type="submit" className="vy-btn-primary w-full py-2 text-xs font-medium">
                  Registrar Versão v{(d.versaoAtual || 1) + 1}
                </button>
              </form>

              <div className="divide-y pt-2" style={{ borderColor: 'var(--border-hairline)' }}>
                {versions.length === 0 ? (
                  <p className="text-xs py-3" style={{ color: 'var(--text-muted)' }}>
                    Nenhuma versão registrada ainda.
                  </p>
                ) : (
                  versions.map((v) => (
                    <div key={v.id} className="py-3 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono-num font-semibold" style={{ color: 'var(--accent)' }}>
                          v{v.data.versao} · {v.data.resumoMudanca}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>{v.data.autor}</span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {v.data.conteudo}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROTEIRO & SUNO */}
      {tab === 'roteiro' && (
        <div className="space-y-5">
          <div className="vy-card p-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {[
                { action: 'project:script_retention', label: 'Análise de retenção' },
                { action: 'project:script_chapters', label: 'Estrutura por capítulos' },
                { action: 'project:script_broll', label: 'B-roll por parágrafo' },
                { action: 'project:script_cta', label: 'Gerar 3 CTAs' },
                { action: 'project:script_revise', label: 'Revisão de texto' },
              ].map((btn) => (
                <button
                  key={btn.action}
                  type="button"
                  disabled={aiBusy !== null}
                  onClick={() => void runTextAction(btn.action, btn.label)}
                  className="vy-btn-secondary px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
                >
                  {aiBusy === btn.action ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />}
                  <span>{btn.label}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setCapitulos((prev) => [
                    ...prev,
                    { id: `cap_${Date.now()}`, titulo: `Capítulo ${prev.length + 1}`, texto: '' },
                  ])
                }
                className="vy-btn-secondary px-3 py-1.5 text-xs inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Capítulo</span>
              </button>
              <button
                type="button"
                onClick={() => void patchProject({ capitulos }, 'Capítulos do roteiro salvos.')}
                className="vy-btn-primary px-4 py-1.5 text-xs font-medium"
              >
                Salvar Roteiro
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {capitulos.map((cap, idx) => (
              <div key={cap.id} className="vy-card p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <input
                    type="text"
                    value={cap.titulo}
                    onChange={(e) =>
                      setCapitulos((prev) => prev.map((c, i) => (i === idx ? { ...c, titulo: e.target.value } : c)))
                    }
                    className="vy-input flex-1 px-3 py-1.5 text-sm font-semibold"
                  />
                  <button
                    type="button"
                    disabled={aiBusy !== null}
                    onClick={() =>
                      void runTextAction('project:suno_chapter', `Música Suno — ${cap.titulo}`, {
                        canal: d.canalNome,
                        titulo,
                        capituloTitulo: cap.titulo,
                        trecho: cap.texto,
                      })
                    }
                    className="vy-btn-secondary px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
                  >
                    <Music className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                    <span>Prompt Suno</span>
                  </button>
                  {capitulos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setCapitulos((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1.5"
                      style={{ color: 'var(--status-err)' }}
                      aria-label="Remover capítulo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <textarea
                  rows={5}
                  value={cap.texto}
                  onChange={(e) =>
                    setCapitulos((prev) => prev.map((c, i) => (i === idx ? { ...c, texto: e.target.value } : c)))
                  }
                  placeholder="Escreva a narração deste capítulo..."
                  className="vy-input w-full px-3 py-2 text-sm leading-relaxed"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PESQUISA */}
      {tab === 'pesquisa' && (
        <div className="space-y-6">
          <div className="vy-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Fontes de Pesquisa do Projeto
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { action: 'project:research_summary', label: 'Resumo das fontes' },
                  { action: 'project:research_gaps', label: 'Lacunas de pesquisa' },
                  { action: 'project:research_check', label: 'Checagem do roteiro' },
                ].map((btn) => (
                  <button
                    key={btn.action}
                    type="button"
                    disabled={aiBusy !== null}
                    onClick={() => void runTextAction(btn.action, btn.label)}
                    className="vy-btn-secondary px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
                  >
                    {aiBusy === btn.action ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />}
                    <span>{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newFonteTitulo.trim()) return;
                const next = [
                  ...fontes,
                  {
                    id: `src_${Date.now()}`,
                    tipo: newFonteTipo,
                    titulo: newFonteTitulo.trim(),
                    url: newFonteUrl.trim(),
                    obs: newFonteObs.trim(),
                  },
                ];
                setFontes(next);
                setNewFonteTitulo('');
                setNewFonteUrl('');
                setNewFonteObs('');
                await patchProject({ fontes: next }, 'Fonte adicionada.');
              }}
              className="grid sm:grid-cols-4 gap-3 pt-2 border-t"
              style={{ borderColor: 'var(--border-hairline)' }}
            >
              <select value={newFonteTipo} onChange={(e) => setNewFonteTipo(e.target.value)} className="vy-input px-3 py-2 text-sm">
                <option value="Artigo">Artigo</option>
                <option value="Documento">Documento Oficial</option>
                <option value="Estudo">Estudo / Dado</option>
                <option value="Vídeo">Vídeo / Entrevista</option>
              </select>
              <input type="text" required value={newFonteTitulo} onChange={(e) => setNewFonteTitulo(e.target.value)} placeholder="Título da fonte" className="vy-input px-3 py-2 text-sm sm:col-span-2" />
              <input type="url" value={newFonteUrl} onChange={(e) => setNewFonteUrl(e.target.value)} placeholder="URL (opcional)" className="vy-input px-3 py-2 text-sm" />
              <input type="text" value={newFonteObs} onChange={(e) => setNewFonteObs(e.target.value)} placeholder="O que esta fonte comprova..." className="vy-input px-3 py-2 text-sm sm:col-span-3" />
              <button type="submit" className="vy-btn-primary px-4 py-2 text-xs font-medium">Adicionar Fonte</button>
            </form>

            <div className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
              {fontes.length === 0 ? (
                <p className="text-xs py-4" style={{ color: 'var(--text-muted)' }}>
                  Nenhuma fonte adicionada ainda.
                </p>
              ) : (
                fontes.map((f) => (
                  <div key={f.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs" style={{ color: 'var(--accent)' }}>{f.tipo}</div>
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{f.titulo}</div>
                      {f.obs && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{f.obs}</p>}
                      {f.url && (
                        <a href={f.url} target="_blank" rel="noreferrer" className="text-xs inline-flex items-center gap-1 hover:underline" style={{ color: 'var(--accent)' }}>
                          <span>Abrir link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        const next = fontes.filter((x) => x.id !== f.id);
                        setFontes(next);
                        await patchProject({ fontes: next });
                      }}
                      className="text-xs"
                      style={{ color: 'var(--status-err)' }}
                    >
                      Remover
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: THUMBNAIL */}
      {tab === 'thumb' && (
        <div className="vy-card p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Direção de Thumbnail & CTR
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {[
                { action: 'project:thumb_concepts', label: '5 conceitos visuais' },
                { action: 'project:thumb_texts', label: '15 textos curtos' },
                { action: 'project:thumb_prompts', label: '5 prompts de imagem' },
              ].map((btn) => (
                <button
                  key={btn.action}
                  type="button"
                  disabled={aiBusy !== null}
                  onClick={() => void runTextAction(btn.action, btn.label)}
                  className="vy-btn-secondary px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
                >
                  {aiBusy === btn.action ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />}
                  <span>{btn.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Conceito atual da capa</span>
              <textarea rows={3} value={thumbConceito} onChange={(e) => setThumbConceito(e.target.value)} placeholder="Composição, emoção, contraste..." className="vy-input w-full px-3 py-2 text-sm" />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Referências visuais</span>
              <textarea rows={3} value={thumbRefs} onChange={(e) => setThumbRefs(e.target.value)} placeholder="Links ou observações de capas inspiradoras..." className="vy-input w-full px-3 py-2 text-sm" />
            </label>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void patchProject({ thumbConceito, thumbRefs }, 'Conceito de thumbnail salvo.')}
              className="vy-btn-primary px-4 py-2 text-xs font-medium"
            >
              Salvar Conceito
            </button>
          </div>

          <div className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--border-hairline)' }}>
            <h3 className="font-display font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Variações Registradas (Teste A/B)
            </h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newThumbNome.trim()) return;
                const next = [...thumbsFeitas, { id: `th_${Date.now()}`, nome: newThumbNome.trim(), texto: newThumbTexto.trim(), ctr: newThumbCtr.trim() }];
                setThumbsFeitas(next);
                setNewThumbNome('');
                setNewThumbTexto('');
                setNewThumbCtr('');
                await patchProject({ thumbsFeitas: next }, 'Variação registrada.');
              }}
              className="grid sm:grid-cols-4 gap-2"
            >
              <input type="text" required value={newThumbNome} onChange={(e) => setNewThumbNome(e.target.value)} placeholder="Nome (ex: Versão A)" className="vy-input px-3 py-1.5 text-sm" />
              <input type="text" value={newThumbTexto} onChange={(e) => setNewThumbTexto(e.target.value)} placeholder="Texto na capa" className="vy-input px-3 py-1.5 text-sm" />
              <input type="text" value={newThumbCtr} onChange={(e) => setNewThumbCtr(e.target.value)} placeholder="CTR % (opcional)" className="vy-input px-3 py-1.5 text-sm font-mono-num" />
              <button type="submit" className="vy-btn-secondary px-3 py-1.5 text-xs font-medium">Adicionar Variação</button>
            </form>
            {thumbsFeitas.length > 0 && (
              <div className="grid sm:grid-cols-3 gap-3">
                {thumbsFeitas.map((t) => (
                  <div key={t.id} className="p-3 rounded-lg border text-xs space-y-1" style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-subtle)' }}>
                    <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{t.nome}</div>
                    <div style={{ color: 'var(--text-secondary)' }}>Texto: "{t.texto || '—'}"</div>
                    <div className="font-mono-num" style={{ color: 'var(--accent)' }}>CTR: {t.ctr || '—'}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: PLANO DE EDIÇÃO + PÓS-PUBLICAÇÃO + COMENTÁRIOS */}
      {tab === 'pos' && (
        <div className="space-y-6">
          {/* Plano de Edição */}
          <div className="vy-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Plano de Edição (145 ppm)
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={aiBusy !== null}
                  onClick={async () => {
                    setAiBusy('project:edit_plan_json');
                    try {
                      const res = await aiApi.action<ProjetoPlanoRow[]>('project:edit_plan_json', {
                        project: buildPayloadProject(),
                      });
                      if (Array.isArray(res.data)) {
                        setPendingPlano(res.data);
                        notify('Plano de edição gerado. Revise e clique em Aplicar.', 'ok');
                      }
                    } catch (err) {
                      notify(err instanceof Error ? err.message : 'Erro ao gerar plano.', 'err');
                    } finally {
                      setAiBusy(null);
                    }
                  }}
                  className="vy-btn-secondary px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
                >
                  {aiBusy === 'project:edit_plan_json' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />}
                  <span>Gerar Plano de Edição (JSON)</span>
                </button>
                {pendingPlano && (
                  <button
                    type="button"
                    onClick={async () => {
                      setPlano(pendingPlano);
                      setPendingPlano(null);
                      await patchProject({ plano: pendingPlano }, 'Plano de edição aplicado ao projeto.');
                    }}
                    className="vy-btn-primary px-3 py-1.5 text-xs font-medium"
                  >
                    Aplicar Plano ({pendingPlano.length} linhas)
                  </button>
                )}
              </div>
            </div>

            {(pendingPlano || plano).length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Clique em "Gerar Plano de Edição (JSON)" para transformar os capítulos em decupagem com B-roll, SFX e música.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left" style={{ borderColor: 'var(--border-hairline)', color: 'var(--text-muted)' }}>
                      <th className="py-2 pr-3">Tempo</th>
                      <th className="py-2 px-3">Narração</th>
                      <th className="py-2 px-3">Visual / B-Roll</th>
                      <th className="py-2 px-3">SFX</th>
                      <th className="py-2 pl-3">Música</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
                    {(pendingPlano || plano).map((row, idx) => (
                      <tr key={idx}>
                        <td className="py-2 pr-3 font-mono-num whitespace-nowrap" style={{ color: 'var(--accent)' }}>{row.tempo}</td>
                        <td className="py-2 px-3" style={{ color: 'var(--text-primary)' }}>{row.narracao}</td>
                        <td className="py-2 px-3" style={{ color: 'var(--text-secondary)' }}>{row.visual}</td>
                        <td className="py-2 px-3" style={{ color: 'var(--text-muted)' }}>{row.sfx}</td>
                        <td className="py-2 pl-3" style={{ color: 'var(--text-muted)' }}>{row.musica}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pós-publicação */}
          <div className="vy-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Desempenho Pós-Publicação & Lições
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { action: 'project:post_analysis', label: 'Análise pós-publicação' },
                  { action: 'project:post_playbook', label: 'Regras pro playbook' },
                  { action: 'project:post_next_video', label: 'Próximo vídeo' },
                ].map((btn) => (
                  <button
                    key={btn.action}
                    type="button"
                    disabled={aiBusy !== null}
                    onClick={() => void runTextAction(btn.action, btn.label)}
                    className="vy-btn-secondary px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
                  >
                    {aiBusy === btn.action ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />}
                    <span>{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {[
                { key: 'views', label: 'Views' },
                { key: 'impressoes', label: 'Impressões' },
                { key: 'ctr', label: 'CTR (%)' },
                { key: 'retencao', label: 'Retenção média (%)' },
                { key: 'ret30', label: 'Retenção 0:30 (%)' },
              ].map((m) => (
                <label key={m.key} className="block space-y-1">
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{m.label}</span>
                  <input
                    type="text"
                    value={String((metricasPos as Record<string, string | undefined>)[m.key] || '')}
                    onChange={(e) => setMetricasPos((prev) => ({ ...prev, [m.key]: e.target.value }))}
                    className="vy-input w-full px-2.5 py-1.5 text-sm font-mono-num"
                  />
                </label>
              ))}
            </div>

            <label className="block space-y-1">
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Observações da curva de retenção (quedas / picos)</span>
              <input type="text" value={retencaoCurva} onChange={(e) => setRetencaoCurva(e.target.value)} placeholder="Ex: 68% aos 0:30, queda aos 03:10 durante explicação técnica..." className="vy-input w-full px-3 py-1.5 text-sm" />
            </label>

            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { key: 'funcionou', label: 'O que funcionou' },
                { key: 'naoFuncionou', label: 'O que não funcionou' },
                { key: 'repetir', label: 'O que repetir' },
                { key: 'evitar', label: 'O que evitar' },
              ].map((f) => (
                <label key={f.key} className="block space-y-1">
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{f.label}</span>
                  <textarea
                    rows={2}
                    value={String((metricasPos as Record<string, string | undefined>)[f.key] || '')}
                    onChange={(e) => setMetricasPos((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    className="vy-input w-full px-3 py-1.5 text-xs"
                  />
                </label>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void patchProject({ metricasPos, retencaoCurva }, 'Métricas pós-publicação salvas.')}
                className="vy-btn-primary px-4 py-2 text-xs font-medium"
              >
                Salvar Pós-Publicação
              </button>
            </div>
          </div>

          {/* Responder Comentários */}
          <div className="vy-card p-5 space-y-4">
            <h2 className="font-display font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <MessageCircle className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <span>Responder Comentário do YouTube</span>
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!commentText.trim()) return;
                setAiBusy('project:comment_reply');
                try {
                  const res = await aiApi.action('project:comment_reply', {
                    videoTitle: titulo,
                    authorDisplayName: commentAuthor || 'Inscrito',
                    textDisplay: commentText,
                    extraInstructions: commentExtra,
                  });
                  setCommentReply(res.text || '');
                } catch (err) {
                  notify(err instanceof Error ? err.message : 'Erro ao gerar resposta.', 'err');
                } finally {
                  setAiBusy(null);
                }
              }}
              className="space-y-3"
            >
              <div className="grid sm:grid-cols-2 gap-3">
                <input type="text" value={commentAuthor} onChange={(e) => setCommentAuthor(e.target.value)} placeholder="Nome do autor do comentário" className="vy-input px-3 py-1.5 text-sm" />
                <input type="text" value={commentExtra} onChange={(e) => setCommentExtra(e.target.value)} placeholder="Instruções extras (opcional)" className="vy-input px-3 py-1.5 text-sm" />
              </div>
              <textarea rows={2} required value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Cole aqui o comentário do espectador..." className="vy-input w-full px-3 py-2 text-sm" />
              <button type="submit" disabled={aiBusy !== null} className="vy-btn-secondary px-4 py-2 text-xs font-medium inline-flex items-center gap-1.5">
                {aiBusy === 'project:comment_reply' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />}
                <span>Gerar Resposta no Tom do Canal</span>
              </button>
            </form>
            {commentReply && (
              <div className="p-3.5 rounded-lg border space-y-2" style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-subtle)' }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                    Resposta sugerida
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(commentReply).catch(() => undefined);
                      notify('Resposta copiada.', 'info');
                    }}
                    className="vy-btn-secondary px-2 py-0.5 text-[11px] inline-flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copiar</span>
                  </button>
                </div>
                <MarkdownRenderer content={commentReply} compact />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
