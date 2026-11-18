import React, { useEffect, useState } from 'react';
import { BookOpen, GitCompare, Loader2, Plus, Save, Sparkles, Trash2 } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useApp } from '../contexts/AppContext';
import {
  aiApi,
  fsApi,
  type Comparison30sResult,
  type FsDoc,
  type GeneratedScript,
} from '../lib/dataClient';
import { buildComparisonDoc, buildCompareRequest, comparacoesCollectionPath, comparisonWinnerLabel } from '../lib/comparadorLogic';
import { buildPlaybookDocFromChecklist, playbookCollectionPath } from '../lib/playbookLogic';
import { projetosCollectionPath } from '../lib/projetosLogic';
import { buildCapitulosFromScript, buildGenerateScriptPayload, roteiristaPerfisPath, roteirosCollectionPath } from '../lib/roteiristaLogic';
import { navigate } from '../lib/router';

interface SavedScriptDoc extends GeneratedScript {
  channelName?: string;
  niche?: string;
  format?: 'long' | 'shorts';
}

interface SavedComparisonDoc {
  niche: string;
  titleA: string;
  hookA: string;
  visualCutsA: string;
  titleB: string;
  hookB: string;
  visualCutsB: string;
  result: Comparison30sResult;
}

interface WriterProfile {
  id: string;
  nome: string;
  prompt: string;
}

const DEFAULT_WRITER_PROFILE: WriterProfile = {
  id: 'doc_editorial',
  nome: 'Documentário Editorial (Padrão)',
  prompt:
    'Você é um roteirista de vídeos documentais/investigativos para YouTube em português do Brasil.\nESTILO: narrativa envolvente, tom editorial e levemente provocativo. Frases de impacto, ritmo que prende.\nABERTURA: os primeiros 15 segundos precisam de um HOOK forte.\nESTRUTURA: cada parte encadeia na próxima com um gancho. Usa dados concretos da base de conhecimento.\nLINGUAGEM: acessível, fala com o espectador ("você"). Marque [B-ROLL: ...] e [SFX: ...] quando fizer sentido.',
};

interface ProjectQuickRef {
  titulo: string;
  canalNome: string;
  ganchoResumo: string;
}

export function ScriptwriterView() {
  const { user, notify } = useApp();
  const [topic, setTopic] = useState('');
  const [channelName, setChannelName] = useState('Tech & Automação BR');
  const [niche, setNiche] = useState('Tecnologia & Produtividade');
  const [audience, setAudience] = useState('Criadores digitais e profissionais técnicos');
  const [format, setFormat] = useState<'long' | 'shorts'>('long');
  const [tone, setTone] = useState('Didático, prático e direto ao ponto');
  const [durationMinutes, setDurationMinutes] = useState(12);
  const [partsCount, setPartsCount] = useState(6);
  const [ppm, setPpm] = useState(145);
  const [angle, setAngle] = useState('');
  const [knowledgeBase, setKnowledgeBase] = useState('');
  const [hookStyle, setHookStyle] = useState('Prova visual imediata nos primeiros 15 segundos');
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);

  // Perfis de Roteirista
  const [profiles, setProfiles] = useState<WriterProfile[]>([DEFAULT_WRITER_PROFILE]);
  const [selectedProfileId, setSelectedProfileId] = useState(DEFAULT_WRITER_PROFILE.id);
  const [editingProfile, setEditingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [profilePromptDraft, setProfilePromptDraft] = useState(DEFAULT_WRITER_PROFILE.prompt);

  const [currentScript, setCurrentScript] = useState<GeneratedScript | null>(null);
  const [savedList, setSavedList] = useState<FsDoc<SavedScriptDoc>[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const loadData = async () => {
    if (!user) return;
    setLoadingList(true);
    try {
      const [docs, profDoc] = await Promise.all([
        fsApi.listDocs<SavedScriptDoc>(roteirosCollectionPath(user.id)), // ROT-R05
        fsApi.getDoc<{ perfis?: WriterProfile[]; selectedId?: string }>(
          roteiristaPerfisPath(user.id) // ROT-R04
        ),
      ]);
      const safeDocs = Array.isArray(docs) ? docs : [];
      setSavedList(safeDocs);
      if (!currentScript && safeDocs.length > 0) {
        setCurrentScript(safeDocs[0].data);
      }
      if (profDoc?.exists && Array.isArray(profDoc.data?.perfis) && profDoc.data.perfis.length > 0) {
        setProfiles(profDoc.data.perfis);
        const selId = profDoc.data.selectedId || profDoc.data.perfis[0].id;
        setSelectedProfileId(selId);
        const active = profDoc.data.perfis.find((p) => p.id === selId) || profDoc.data.perfis[0];
        setProfilePromptDraft(active.prompt);
      }
    } catch (err) {
      setSavedList([]);
      notify(err instanceof Error ? err.message : 'Erro ao carregar roteiros.', 'err');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [user?.id]);

  const activeProfile = profiles.find((p) => p.id === selectedProfileId) || profiles[0];

  const handleSaveProfile = async () => {
    if (!user) return;
    const nextProfiles = profiles.map((p) =>
      p.id === selectedProfileId ? { ...p, prompt: profilePromptDraft } : p
    );
    setProfiles(nextProfiles);
    await fsApi.setDoc(roteiristaPerfisPath(user.id), { // ROT-R04
      perfis: nextProfiles,
      selectedId: selectedProfileId,
    });
    setEditingProfile(false);
    notify('Perfil de roteirista salvo.', 'ok');
  };

  const handleCreateProfile = async () => {
    if (!user || !newProfileName.trim()) return;
    const created: WriterProfile = {
      id: `prof_${Date.now()}`,
      nome: newProfileName.trim(),
      prompt: profilePromptDraft || DEFAULT_WRITER_PROFILE.prompt,
    };
    const nextProfiles = [...profiles, created];
    setProfiles(nextProfiles);
    setSelectedProfileId(created.id);
    setNewProfileName('');
    await fsApi.setDoc(roteiristaPerfisPath(user.id), { // ROT-R04
      perfis: nextProfiles,
      selectedId: created.id,
    });
    notify(`Perfil "${created.nome}" criado.`, 'ok');
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    // ROT-R01/R02/R07/R08: payload da geração extraído para src/lib/roteiristaLogic.ts
    const payload = buildGenerateScriptPayload({
      topic,
      channelName,
      niche,
      audience,
      format,
      tone,
      durationMinutes,
      hookStyle,
      notes,
      profilePrompt: profilePromptDraft,
      fallbackProfilePrompt: activeProfile.prompt,
      partsCount,
      ppm,
      angle,
      knowledgeBase,
    });
    if (!payload) return;
    setGenerating(true);
    try {
      const res = await aiApi.generateScript(payload);
      setCurrentScript(res.script);
      notify('Roteiro estruturado gerado via Gemini.', 'ok');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao gerar roteiro.', 'err');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveScript = async () => {
    if (!user || !currentScript) return;
    await fsApi.createDoc(roteirosCollectionPath(user.id), { // ROT-R05
      ...currentScript,
      channelName,
      niche,
      format,
    });
    notify('Roteiro salvo na sua biblioteca.', 'ok');
    void loadData();
  };

  const handleSendToKanban = async () => {
    if (!user || !currentScript) return;
    // ROT-R03: primeiro capítulo é sempre o gancho '00 — Gancho (00:00 – 00:30)'
    const capitulos = buildCapitulosFromScript(currentScript);

    const created = await fsApi.createDoc(projetosCollectionPath(user.id), {
      titulo: currentScript.title,
      canalNome: channelName,
      estagio: 'roteiro',
      formato: format,
      prioridade: 'alta',
      dataPublicacaoAlvo: '',
      ctrAlvo: 8.5,
      ganchoResumo: currentScript.hook0to30,
      resumo: currentScript.promise,
      capitulos,
      checklist: [
        { id: 'c1', texto: 'Revisar gancho 0–30s', feito: false },
        { id: 'c2', texto: 'Preparar B-rolls dos capítulos', feito: false },
      ],
      versaoAtual: 1,
    });
    notify('Projeto criado no Kanban com todos os capítulos.', 'ok');
    navigate(`/projetos/${created.id}`);
  };

  const handleDeleteSaved = async (id: string) => {
    if (!user) return;
    await fsApi.deleteDoc(`usuarios/${user.id}/roteiros/${id}`);
    notify('Roteiro removido.', 'info');
    void loadData();
  };

  return (
    <AppShell
      title="Roteirista IA"
      breadcrumb="Operação"
      primaryAction={
        currentScript ? (
          <button
            type="button"
            onClick={handleSaveScript}
            className="vy-btn-primary px-3.5 py-1.5 text-xs font-medium whitespace-nowrap flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar Roteiro</span>
          </button>
        ) : undefined
      }
    >
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Briefing Form + Perfil + Saved List */}
        <div className="lg:col-span-4 space-y-6">
          <form onSubmit={handleGenerate} className="vy-card p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Sparkles className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span>Briefing do Roteiro</span>
              </h2>
              <button
                type="button"
                onClick={() => setEditingProfile((v) => !v)}
                className="text-xs font-medium hover:underline"
                style={{ color: 'var(--accent)' }}
              >
                {editingProfile ? 'Fechar Perfil' : 'Configurar Perfil'}
              </button>
            </div>

            <label className="block space-y-1">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Perfil de Roteirista</span>
              <select
                value={selectedProfileId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setSelectedProfileId(nextId);
                  const found = profiles.find((p) => p.id === nextId);
                  if (found) setProfilePromptDraft(found.prompt);
                }}
                className="vy-input w-full px-3 py-1.5 text-sm"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </label>

            {editingProfile && (
              <div className="p-3 rounded-lg border space-y-2.5" style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-subtle)' }}>
                <textarea
                  rows={5}
                  value={profilePromptDraft}
                  onChange={(e) => setProfilePromptDraft(e.target.value)}
                  className="vy-input w-full px-2.5 py-2 text-xs leading-relaxed"
                  placeholder="Instruções de estilo, abertura e estrutura do perfil..."
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleSaveProfile()}
                    className="vy-btn-primary px-3 py-1.5 text-xs font-medium flex-1"
                  >
                    Salvar Alterações do Perfil
                  </button>
                </div>
                <div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
                  <input
                    type="text"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="Nome de novo perfil..."
                    className="vy-input flex-1 px-2.5 py-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => void handleCreateProfile()}
                    className="vy-btn-secondary px-2.5 py-1 text-xs inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Criar</span>
                  </button>
                </div>
              </div>
            )}

            <label className="block space-y-1">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Tema / Pauta</span>
              <textarea
                rows={2}
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: Como criar um fluxo semanal de gravação em lote sem perder espontaneidade"
                className="vy-input w-full px-3 py-2 text-sm"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Ângulo / Tese (opcional)</span>
              <input
                type="text"
                value={angle}
                onChange={(e) => setAngle(e.target.value)}
                placeholder="Ex: Mostrar por que a maioria desiste na 3ª semana"
                className="vy-input w-full px-3 py-1.5 text-sm"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Canal</span>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="vy-input w-full px-3 py-1.5 text-sm"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Nicho</span>
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="vy-input w-full px-3 py-1.5 text-sm"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Formato</span>
                <select value={format} onChange={(e) => setFormat(e.target.value as 'long' | 'shorts')} className="vy-input w-full px-3 py-1.5 text-sm">
                  <option value="long">Vídeo Longo</option>
                  <option value="shorts">Shorts (&lt;60s)</option>
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Duração (min)</span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  disabled={format === 'shorts'}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value) || 10)}
                  className="vy-input w-full px-3 py-1.5 text-sm font-mono-num"
                />
              </label>
            </div>

            {format === 'long' && (
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Partes / Capítulos</span>
                  <input
                    type="number"
                    min={2}
                    max={12}
                    value={partsCount}
                    onChange={(e) => setPartsCount(Number(e.target.value) || 6)}
                    className="vy-input w-full px-3 py-1.5 text-sm font-mono-num"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Ritmo (PPM)</span>
                  <input
                    type="number"
                    min={100}
                    max={210}
                    value={ppm}
                    onChange={(e) => setPpm(Number(e.target.value) || 145)}
                    className="vy-input w-full px-3 py-1.5 text-sm font-mono-num"
                  />
                </label>
              </div>
            )}

            <label className="block space-y-1">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Público-alvo</span>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="vy-input w-full px-3 py-1.5 text-sm"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Estilo de Gancho</span>
              <input
                type="text"
                value={hookStyle}
                onChange={(e) => setHookStyle(e.target.value)}
                className="vy-input w-full px-3 py-1.5 text-sm"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Tom & Observações</span>
              <input
                type="text"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="vy-input w-full px-3 py-1.5 text-sm"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Base de Conhecimento / Fatos (opcional)</span>
              <textarea
                rows={3}
                value={knowledgeBase}
                onChange={(e) => setKnowledgeBase(e.target.value)}
                placeholder="Cole dados, trechos de pesquisa ou citações reais que o roteiro deve respeitar..."
                className="vy-input w-full px-3 py-2 text-xs"
              />
            </label>

            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionais (opcional)"
              className="vy-input w-full px-3 py-1.5 text-sm"
            />

            <button
              type="submit"
              disabled={generating}
              className="vy-btn-primary w-full py-2.5 text-sm font-medium flex items-center justify-center gap-2"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{generating ? 'Gerando roteiro...' : 'Gerar Roteiro com Gemini'}</span>
            </button>
          </form>

          <div className="vy-card p-5 space-y-3">
            <h3 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Roteiros Salvos
            </h3>
            {loadingList ? (
              <div className="h-20 animate-pulse rounded" style={{ backgroundColor: 'var(--bg-subtle)' }} />
            ) : savedList.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Nenhum roteiro salvo ainda.
              </p>
            ) : (
              <ul className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
                {savedList.map((item) => (
                  <li key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentScript(item.data)}
                      className="text-left text-xs font-medium hover:underline truncate flex-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {item.data.title}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteSaved(item.id)}
                      className="p-1 opacity-70 hover:opacity-100"
                      style={{ color: 'var(--status-err)' }}
                      aria-label="Remover roteiro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Script Output */}
        <div className="lg:col-span-8">
          {!currentScript ? (
            <div className="vy-card p-12 text-center space-y-3">
              <Sparkles className="w-8 h-8 mx-auto" style={{ color: 'var(--text-muted)' }} />
              <h2 className="font-display font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                Pronto para estruturar seu próximo vídeo
              </h2>
              <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                Preencha o briefing ao lado para gerar gancho de 30s, capítulos com indicações visuais, quebras de ritmo e ideias de thumbnail.
              </p>
            </div>
          ) : (
            <div className="vy-card p-6 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-hairline)' }}>
                <div className="space-y-1">
                  <div className="text-xs font-mono-num" style={{ color: 'var(--text-muted)' }}>
                    Duração estimada: {currentScript.estimatedDurationMin} min · Perfil: {activeProfile?.nome}
                  </div>
                  <h2 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
                    {currentScript.title}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={handleSaveScript} className="vy-btn-secondary px-3 py-1.5 text-xs font-medium">
                    Salvar Cópia
                  </button>
                  <button type="button" onClick={handleSendToKanban} className="vy-btn-primary px-3 py-1.5 text-xs font-medium">
                    Enviar para Kanban
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-semibold text-sm" style={{ color: 'var(--accent)' }}>
                  Gancho (00:00 – 00:30)
                </h3>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-primary)' }}>
                  {currentScript.hook0to30}
                </p>
                <p className="text-xs pt-1" style={{ color: 'var(--text-secondary)' }}>
                  <strong>Promessa central:</strong> {currentScript.promise}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  Capítulos & Direção Visual
                </h3>
                <div className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
                  {(currentScript.chapters || []).map((ch, idx) => (
                    <div key={idx} className="py-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {ch.heading}
                        </span>
                        <span className="font-mono-num text-xs" style={{ color: 'var(--text-muted)' }}>
                          {ch.durationHint}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>
                        {ch.scriptText}
                      </p>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        <strong>Visual / B-roll:</strong> {ch.visualCue}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 pt-4 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
                <div className="space-y-2">
                  <h4 className="font-display font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Conceitos de Thumbnail
                  </h4>
                  <ul className="space-y-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {(currentScript.thumbnailIdeas || []).map((idea, i) => (
                      <li key={i}>• {idea}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-display font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Pontos de Retenção & CTA
                  </h4>
                  <ul className="space-y-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {(currentScript.retentionBeats || []).map((b, i) => (
                      <li key={i}>• {b}</li>
                    ))}
                  </ul>
                  <p className="text-sm pt-2" style={{ color: 'var(--text-primary)' }}>
                    <strong>CTA:</strong> {currentScript.cta}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export function Compare30sView() {
  const { user, notify } = useApp();
  const [niche, setNiche] = useState('Tecnologia & Produtividade');
  const [titleA, setTitleA] = useState('Opção A — Prova Direta');
  const [hookA, setHookA] = useState('');
  const [visualCutsA, setVisualCutsA] = useState('');
  const [titleB, setTitleB] = useState('Opção B — Pergunta Aberta');
  const [hookB, setHookB] = useState('');
  const [visualCutsB, setVisualCutsB] = useState('');
  const [result, setResult] = useState<Comparison30sResult | null>(null);
  const [history, setHistory] = useState<FsDoc<SavedComparisonDoc>[]>([]);
  const [projects, setProjects] = useState<FsDoc<ProjectQuickRef>[]>([]);
  const [running, setRunning] = useState(false);
  const [savingPlaybook, setSavingPlaybook] = useState(false);

  const loadData = async () => {
    if (!user) return;
    try {
      const [docs, projs] = await Promise.all([
        fsApi.listDocs<SavedComparisonDoc>(comparacoesCollectionPath(user.id)), // CMP-R03
        fsApi.listDocs<ProjectQuickRef>(projetosCollectionPath(user.id)),
      ]);
      const safeDocs = Array.isArray(docs) ? docs : [];
      const safeProjs = Array.isArray(projs) ? projs : [];
      setHistory(safeDocs);
      setProjects(safeProjs);
      if (!hookA && safeDocs.length > 0 && safeDocs[0]?.data) {
        const latest = safeDocs[0].data;
        setNiche(latest.niche || 'Tecnologia & Produtividade');
        setTitleA(latest.titleA || 'Opção A');
        setHookA(latest.hookA || '');
        setVisualCutsA(latest.visualCutsA || '');
        setTitleB(latest.titleB || 'Opção B');
        setHookB(latest.hookB || '');
        setVisualCutsB(latest.visualCutsB || '');
        setResult(latest.result || null);
      }
    } catch (err) {
      setHistory([]);
      setProjects([]);
      notify(err instanceof Error ? err.message : 'Erro ao carregar histórico de comparações.', 'err');
    }
  };

  useEffect(() => {
    void loadData();
  }, [user?.id]);

  const handleImportProject = (side: 'A' | 'B', projId: string) => {
    const found = projects.find((p) => p.id === projId);
    if (!found) return;
    if (side === 'A') {
      setTitleA(found.data.titulo);
      setHookA(found.data.ganchoResumo || '');
    } else {
      setTitleB(found.data.titulo);
      setHookB(found.data.ganchoResumo || '');
    }
  };

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    // CMP-R01: gate do submit exige os dois ganchos preenchidos
    const payload = buildCompareRequest({ niche, titleA, hookA, visualCutsA, titleB, hookB, visualCutsB });
    if (!payload) return;
    setRunning(true);
    try {
      const res = await aiApi.compare30s(payload);
      setResult(res.comparison);
      if (user) {
        // CMP-R03: resultado salvo em usuarios/{uid}/comparacoes
        await fsApi.createDoc(
          comparacoesCollectionPath(user.id),
          buildComparisonDoc(payload, res.comparison)
        );
        void loadData();
      }
      notify('Análise comparativa dos 30s concluída.', 'ok');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao comparar aberturas.', 'err');
    } finally {
      setRunning(false);
    }
  };

  const handleSaveChecklistToPlaybook = async () => {
    if (!user || !result || result.actionChecklist.length === 0) return;
    setSavingPlaybook(true);
    try {
      for (const rawLine of result.actionChecklist) {
        await fsApi.createDoc(
          playbookCollectionPath(user.id),
          buildPlaybookDocFromChecklist({ rawLine, niche, titleA, titleB })
        );
      }
      notify(`${result.actionChecklist.length} regra(s) salva(s) no Playbook Editorial.`, 'ok');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao salvar no Playbook.', 'err');
    } finally {
      setSavingPlaybook(false);
    }
  };

  return (
    <AppShell title="Comparar 30s" breadcrumb="Operação">
      <div className="space-y-6">
        <form onSubmit={handleCompare} className="vy-card p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                Laboratório de Retenção Inicial (00:00 – 00:30)
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Compare duas propostas de abertura falada e ritmo visual antes de gravar, ou importe ganchos de projetos existentes.
              </p>
            </div>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="Nicho do vídeo"
              className="vy-input px-3 py-1.5 text-sm w-64"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              {projects.length > 0 && (
                <select
                  defaultValue=""
                  onChange={(e) => handleImportProject('A', e.target.value)}
                  className="vy-input w-full px-3 py-1.5 text-xs"
                >
                  <option value="">Importar gancho de um projeto para Opção A...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.data.titulo}</option>
                  ))}
                </select>
              )}
              <input
                type="text"
                value={titleA}
                onChange={(e) => setTitleA(e.target.value)}
                className="vy-input w-full px-3 py-1.5 text-sm font-medium"
              />
              <textarea
                rows={4}
                required
                value={hookA}
                onChange={(e) => setHookA(e.target.value)}
                placeholder="Texto falado nos primeiros 30s da Opção A..."
                className="vy-input w-full px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={visualCutsA}
                onChange={(e) => setVisualCutsA(e.target.value)}
                placeholder="Cortes visuais / B-rolls da Opção A"
                className="vy-input w-full px-3 py-1.5 text-xs"
              />
            </div>

            <div className="space-y-3">
              {projects.length > 0 && (
                <select
                  defaultValue=""
                  onChange={(e) => handleImportProject('B', e.target.value)}
                  className="vy-input w-full px-3 py-1.5 text-xs"
                >
                  <option value="">Importar gancho de um projeto para Opção B...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.data.titulo}</option>
                  ))}
                </select>
              )}
              <input
                type="text"
                value={titleB}
                onChange={(e) => setTitleB(e.target.value)}
                className="vy-input w-full px-3 py-1.5 text-sm font-medium"
              />
              <textarea
                rows={4}
                required
                value={hookB}
                onChange={(e) => setHookB(e.target.value)}
                placeholder="Texto falado nos primeiros 30s da Opção B..."
                className="vy-input w-full px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={visualCutsB}
                onChange={(e) => setVisualCutsB(e.target.value)}
                placeholder="Cortes visuais / B-rolls da Opção B"
                className="vy-input w-full px-3 py-1.5 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={running} className="vy-btn-primary px-5 py-2.5 text-sm font-medium flex items-center gap-2">
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitCompare className="w-4 h-4" />}
              <span>{running ? 'Analisando aberturas...' : 'Comparar Primeiros 30s com IA'}</span>
            </button>
          </div>
        </form>

        {result && (
          <div className="vy-card p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b" style={{ borderColor: 'var(--border-hairline)' }}>
              <h3 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                Diagnóstico: {comparisonWinnerLabel(result.winner)}{/* CMP-R02 */}
              </h3>
              <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                Critérios qualitativos de retenção
              </span>
            </div>

            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {result.summary}
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--border-hairline)', color: 'var(--text-muted)' }}>
                    <th className="py-2 pr-4 font-medium">Critério</th>
                    <th className="py-2 px-4 font-medium">{titleA}</th>
                    <th className="py-2 px-4 font-medium">{titleB}</th>
                    <th className="py-2 pl-4 font-medium text-right">Melhor</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
                  {result.criteria.map((c, idx) => (
                    <tr key={idx}>
                      <td className="py-3 pr-4 font-medium align-top" style={{ color: 'var(--text-primary)' }}>{c.name}</td>
                      <td className="py-3 px-4 align-top" style={{ color: 'var(--text-secondary)' }}>{c.assessmentA}</td>
                      <td className="py-3 px-4 align-top" style={{ color: 'var(--text-secondary)' }}>{c.assessmentB}</td>
                      <td className="py-3 pl-4 text-right font-mono-num font-semibold align-top" style={{ color: 'var(--accent)' }}>{c.edge}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
              <div className="space-y-1.5">
                <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Versão Aprimorada — A</div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{result.improvedHookA}</p>
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Versão Aprimorada — B</div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{result.improvedHookB}</p>
              </div>
            </div>

            <div className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--border-hairline)' }}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Checklist Antes de Gravar & Regras Extraídas
                </div>
                <button
                  type="button"
                  disabled={savingPlaybook}
                  onClick={() => void handleSaveChecklistToPlaybook()}
                  className="vy-btn-secondary px-3 py-1.5 text-xs font-medium inline-flex items-center gap-1.5"
                >
                  {savingPlaybook ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookOpen className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />}
                  <span>Salvar Regras no Playbook</span>
                </button>
              </div>
              <ul className="space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {result.actionChecklist.map((item, idx) => (
                  <li key={idx}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="vy-card p-5 space-y-3">
            <h3 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Comparações Anteriores
            </h3>
            <div className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
              {history.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => {
                    setNiche(h.data.niche);
                    setTitleA(h.data.titleA);
                    setHookA(h.data.hookA);
                    setVisualCutsA(h.data.visualCutsA);
                    setTitleB(h.data.titleB);
                    setHookB(h.data.hookB);
                    setVisualCutsB(h.data.visualCutsB);
                    setResult(h.data.result);
                  }}
                  className="w-full py-2.5 text-left flex items-center justify-between text-xs hover:opacity-80"
                >
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {h.data.titleA} vs {h.data.titleB} ({h.data.niche})
                  </span>
                  <span style={{ color: 'var(--accent)' }}>Vencedor: {h.data.result.winner}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
