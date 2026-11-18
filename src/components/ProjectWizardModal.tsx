import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { fsApi, type FsDoc } from '../lib/dataClient';
import {
  buildVersaoInicialPayload,
  buildWizardProjectPayload,
  KANBAN_STAGES,
  projetosCollectionPath,
  WIZARD_STEPS,
} from '../lib/projetosLogic';
import type { KanbanStage } from '../lib/projetosLogic';
import { navigate } from '../lib/router';

interface CanalOption {
  nome: string;
  nicho: string;
  tipo: string;
}

interface RadarOption {
  nome: string;
  nicho: string;
  sinais?: string[];
}

interface ProjectWizardModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (projectId: string) => void;
}

const DEFAULT_CHECKLIST_LONG = [
  'Definir 3 variações de título + conceito de thumbnail',
  'Validar gancho dos primeiros 30 segundos',
  'Escrever roteiro completo por blocos',
  'Gravar A-roll e capturas de B-roll',
  'Revisar retenção e mixagem antes de publicar',
];

const DEFAULT_CHECKLIST_SHORTS = [
  'Definir gancho visual nos primeiros 2 segundos',
  'Escrever texto curto (<140 palavras)',
  'Gravar vertical 9:16 com legenda dinâmica',
];

// PRJ-R08: estágios centralizados em src/lib/projetosLogic.ts
const STAGES = KANBAN_STAGES;

export function ProjectWizardModal({ open, onClose, onCreated }: ProjectWizardModalProps) {
  const { user, notify } = useApp();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [saving, setSaving] = useState(false);

  const [canais, setCanais] = useState<FsDoc<CanalOption>[]>([]);
  const [radars, setRadars] = useState<FsDoc<RadarOption>[]>([]);

  // Step 1
  const [canalNome, setCanalNome] = useState('Canal Principal');
  const [formato, setFormato] = useState<'long' | 'shorts'>('long');
  const [prioridade, setPrioridade] = useState<'alta' | 'media' | 'baixa'>('media');
  const [origemRadarId, setOrigemRadarId] = useState('');

  // Step 2
  const [titulo, setTitulo] = useState('');
  const [thumbConcept, setThumbConcept] = useState('');
  const [ctrAlvo, setCtrAlvo] = useState('8.0');
  const [ganchoResumo, setGanchoResumo] = useState('');

  // Step 3
  const [estagio, setEstagio] = useState<KanbanStage>('ideacao');
  const [dataPublicacaoAlvo, setDataPublicacaoAlvo] = useState('');
  const [checklistItems, setChecklistItems] = useState<string[]>(DEFAULT_CHECKLIST_LONG);
  const [newCheckItem, setNewCheckItem] = useState('');

  useEffect(() => {
    if (!open || !user) return;
    setStep(1);
    setFormato('long');
    setPrioridade('media');
    setOrigemRadarId('');
    setTitulo('');
    setThumbConcept('');
    setCtrAlvo('8.0');
    setGanchoResumo('');
    setEstagio('ideacao');
    setDataPublicacaoAlvo('');
    setChecklistItems(DEFAULT_CHECKLIST_LONG);
    setNewCheckItem('');

    Promise.all([
      fsApi.listDocs<CanalOption>(`usuarios/${user.id}/canais`),
      fsApi.listDocs<RadarOption>(`usuarios/${user.id}/radar_perfis`),
    ])
      .then(([cDocs, rDocs]) => {
        const safeCanais = Array.isArray(cDocs) ? cDocs : [];
        const own = safeCanais.filter((c) => c?.data?.tipo !== 'referencia');
        setCanais(own);
        if (own.length > 0) {
          setCanalNome(own[0].data.nome);
        } else {
          setCanalNome('Canal Principal');
        }
        setRadars(Array.isArray(rDocs) ? rDocs : []);
      })
      .catch(() => {
        setCanais([]);
        setRadars([]);
      });
  }, [open, user?.id]);

  const handleFormatChange = (nextFmt: 'long' | 'shorts') => {
    setFormato(nextFmt);
    setChecklistItems(nextFmt === 'shorts' ? DEFAULT_CHECKLIST_SHORTS : DEFAULT_CHECKLIST_LONG);
  };

  const handleApplyRadar = (id: string) => {
    setOrigemRadarId(id);
    const found = radars.find((r) => r.id === id);
    if (found) {
      if (!titulo.trim()) setTitulo(found.data.nome);
      if (!ganchoResumo.trim() && found.data.sinais?.[0]) {
        setGanchoResumo(found.data.sinais[0]);
      }
    }
  };

  const addChecklistEntry = () => {
    if (!newCheckItem.trim()) return;
    setChecklistItems((prev) => [...prev, newCheckItem.trim()]);
    setNewCheckItem('');
  };

  const handleFinish = async () => {
    // PRJ-R01/R03/R05/R07: payload do projeto extraído para src/lib/projetosLogic.ts
    const payload = buildWizardProjectPayload({
      titulo,
      canalNome,
      estagio,
      formato,
      prioridade,
      dataPublicacaoAlvo,
      ctrAlvo,
      conceitoThumbnail: thumbConcept,
      ganchoResumo,
      origemRadarId,
      checklistItems,
    });
    if (!user || !payload) return;
    setSaving(true);
    try {
      const created = await fsApi.createDoc(projetosCollectionPath(user.id), payload); // PRJ-R06

      // PRJ-R04: projeto nasce com versaoAtual=1 e doc versoes/v1
      await fsApi.setDoc(
        `usuarios/${user.id}/projetos/${created.id}/versoes/v1`,
        buildVersaoInicialPayload({ autor: user.displayName, titulo, ganchoResumo })
      );

      notify('Projeto criado com sucesso pelo assistente.', 'ok');
      onClose();
      if (onCreated) {
        onCreated(created.id);
      } else {
        navigate(`/projetos/${created.id}`);
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao criar projeto.', 'err');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-label="Wizard de Criação de Projeto">
      <div className="vy-card w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between gap-4" style={{ borderColor: 'var(--border-hairline)' }}>
          <div>
            <h2 className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>
              Assistente de Novo Projeto
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Passo {step} de 4 · {WIZARD_STEPS.find((s) => s.n === step)?.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Fechar assistente"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-2.5 border-b grid grid-cols-4 gap-2 text-xs" style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-subtle)' }}>
          {WIZARD_STEPS.map((item) => (
            <button
              key={item.n}
              type="button"
              onClick={() => {
                if (item.n < step || (item.n > 1 && titulo.trim())) {
                  setStep(item.n as 1 | 2 | 3 | 4);
                }
              }}
              className="py-1 px-2 rounded text-left font-medium truncate transition-colors"
              style={{
                backgroundColor: step === item.n ? 'var(--accent-soft)' : 'transparent',
                color: step === item.n ? 'var(--accent)' : step > item.n ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              {item.shortLabel}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {step === 1 && (
            <div className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Canal de Destino
                </span>
                {canais.length > 0 ? (
                  <select
                    value={canalNome}
                    onChange={(e) => setCanalNome(e.target.value)}
                    className="vy-input w-full px-3 py-2 text-sm"
                  >
                    {canais.map((c) => (
                      <option key={c.id} value={c.data.nome}>
                        {c.data.nome} ({c.data.nicho})
                      </option>
                    ))}
                    <option value="Canal Principal">Outro / Canal Principal</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={canalNome}
                    onChange={(e) => setCanalNome(e.target.value)}
                    placeholder="Nome do canal"
                    className="vy-input w-full px-3 py-2 text-sm"
                  />
                )}
              </label>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-medium block" style={{ color: 'var(--text-secondary)' }}>
                    Formato do Vídeo
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {(['long', 'shorts'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => handleFormatChange(fmt)}
                        className="p-3 rounded-lg border text-left text-xs font-medium"
                        style={{
                          borderColor: formato === fmt ? 'var(--accent)' : 'var(--border-hairline)',
                          backgroundColor: formato === fmt ? 'var(--accent-soft)' : 'var(--bg-subtle)',
                          color: formato === fmt ? 'var(--accent)' : 'var(--text-primary)',
                        }}
                      >
                        <div>{fmt === 'long' ? 'Vídeo Longo' : 'YouTube Shorts'}</div>
                        <div className="text-[11px] font-normal mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {fmt === 'long' ? '16:9 · 8–20 min' : '9:16 · <60s'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Prioridade Editorial
                  </span>
                  <select
                    value={prioridade}
                    onChange={(e) => setPrioridade(e.target.value as 'alta' | 'media' | 'baixa')}
                    className="vy-input w-full px-3 py-2 text-sm"
                  >
                    <option value="alta">Alta (Publicação prioritária)</option>
                    <option value="media">Média (Cadência normal)</option>
                    <option value="baixa">Baixa (Backlog / Evergreen)</option>
                  </select>
                </label>
              </div>

              {radars.length > 0 && (
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Vincular Sinal do Radar (Opcional)
                  </span>
                  <select
                    value={origemRadarId}
                    onChange={(e) => handleApplyRadar(e.target.value)}
                    className="vy-input w-full px-3 py-2 text-sm"
                  >
                    <option value="">Nenhum sinal vinculado</option>
                    {radars.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.data.nome} ({r.data.nicho})
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Título Provisório *
                </span>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Como Estruturar Agentes de Roteiro Sem Perder Autenticidade"
                  className="vy-input w-full px-3 py-2 text-sm"
                />
              </label>

              <div className="grid sm:grid-cols-3 gap-3">
                <label className="block space-y-1.5 sm:col-span-2">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Conceito Visual da Thumbnail
                  </span>
                  <input
                    type="text"
                    value={thumbConcept}
                    onChange={(e) => setThumbConcept(e.target.value)}
                    placeholder="Ex: Antes/Depois com texto curto de 3 palavras"
                    className="vy-input w-full px-3 py-2 text-sm"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    CTR Alvo (%)
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    value={ctrAlvo}
                    onChange={(e) => setCtrAlvo(e.target.value)}
                    className="vy-input w-full px-3 py-2 text-sm font-mono-num"
                  />
                </label>
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Gancho Inicial (00:00 – 00:30)
                </span>
                <textarea
                  rows={4}
                  value={ganchoResumo}
                  onChange={(e) => setGanchoResumo(e.target.value)}
                  placeholder="O que o espectador vê e ouve nos primeiros 30 segundos para confirmar o clique..."
                  className="vy-input w-full px-3 py-2 text-sm"
                />
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Coluna Inicial no Kanban
                  </span>
                  <select
                    value={estagio}
                    onChange={(e) => setEstagio(e.target.value as KanbanStage)}
                    className="vy-input w-full px-3 py-2 text-sm"
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Data Alvo de Publicação
                  </span>
                  <input
                    type="date"
                    value={dataPublicacaoAlvo}
                    onChange={(e) => setDataPublicacaoAlvo(e.target.value)}
                    className="vy-input w-full px-3 py-2 text-sm font-mono-num"
                  />
                </label>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-medium block" style={{ color: 'var(--text-secondary)' }}>
                  Checklist Inicial de Produção
                </span>
                <ul className="space-y-1.5">
                  {checklistItems.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm"
                      style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-subtle)' }}
                    >
                      <span style={{ color: 'var(--text-primary)' }}>{item}</span>
                      <button
                        type="button"
                        onClick={() => setChecklistItems((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1 opacity-70 hover:opacity-100"
                        style={{ color: 'var(--status-err)' }}
                        aria-label="Remover item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newCheckItem}
                    onChange={(e) => setNewCheckItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addChecklistEntry();
                      }
                    }}
                    placeholder="Adicionar tarefa personalizada..."
                    className="vy-input flex-1 px-3 py-1.5 text-sm"
                  />
                  <button type="button" onClick={addChecklistEntry} className="vy-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Incluir</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border space-y-3" style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-subtle)' }}>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {canalNome} · {formato === 'shorts' ? 'Shorts' : 'Vídeo Longo'} · Prioridade {prioridade}
                </div>
                <div className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                  {titulo}
                </div>
                {thumbConcept && (
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <strong>Thumbnail:</strong> {thumbConcept} (CTR alvo {ctrAlvo}%)
                  </div>
                )}
                {ganchoResumo && (
                  <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    <strong>Gancho 0–30s:</strong> {ganchoResumo}
                  </div>
                )}
                <div className="pt-2 border-t text-xs flex flex-wrap gap-4" style={{ borderColor: 'var(--border-hairline)', color: 'var(--text-muted)' }}>
                  <span>Coluna: {STAGES.find((s) => s.id === estagio)?.label}</span>
                  <span>Publicação alvo: {dataPublicacaoAlvo || 'Não definida'}</span>
                  <span>Checklist: {checklistItems.length} itens</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between gap-3" style={{ borderColor: 'var(--border-hairline)' }}>
          <button
            type="button"
            onClick={() => (step === 1 ? onClose() : setStep((s) => (s - 1) as 1 | 2 | 3 | 4))}
            className="vy-btn-secondary px-4 py-2 text-xs font-medium inline-flex items-center gap-1.5"
          >
            {step > 1 && <ArrowLeft className="w-3.5 h-3.5" />}
            <span>{step === 1 ? 'Cancelar' : 'Anterior'}</span>
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 2 && !titulo.trim()) {
                  notify('Informe um título provisório para avançar.', 'err');
                  return;
                }
                setStep((s) => (s + 1) as 1 | 2 | 3 | 4);
              }}
              className="vy-btn-primary px-4 py-2 text-xs font-medium inline-flex items-center gap-1.5"
            >
              <span>Próximo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={handleFinish}
              className="vy-btn-primary px-5 py-2 text-xs font-medium inline-flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{saving ? 'Criando...' : 'Criar Projeto no Kanban'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
