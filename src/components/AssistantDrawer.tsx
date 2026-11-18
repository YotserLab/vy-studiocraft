import React, { useMemo, useState } from 'react';
import { Copy, Loader2, MessageSquare, Plus, Send, Sparkles, StickyNote, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { aiApi, fsApi, type AssistantIdeaAction } from '../lib/dataClient';
import { navigate, useLocationPath } from '../lib/router';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatEntry {
  role: 'user' | 'assistant';
  text: string;
  ideaAction?: AssistantIdeaAction | null;
}

export function AssistantDrawer() {
  const { user, notify } = useApp();
  const { pathname } = useLocationPath();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [messages, setMessages] = useState<ChatEntry[]>([]);

  const openProjectId = useMemo(() => {
    if (pathname.startsWith('/projetos/')) {
      const id = decodeURIComponent(pathname.slice('/projetos/'.length)).split('/')[0];
      return id || undefined;
    }
    return undefined;
  }, [pathname]);

  if (!user) return null;

  const suggestions = openProjectId
    ? ['Analisar este roteiro', '3 ideias novas', 'Como vão meus vídeos', 'Melhor próximo vídeo']
    : ['3 ideias novas', 'Como vão meus vídeos', 'Melhor próximo vídeo'];

  const sendMessage = async (textToSend: string) => {
    const clean = textToSend.trim();
    if (!clean || busy) return;
    const nextHistory: ChatEntry[] = [...messages, { role: 'user', text: clean }];
    setMessages(nextHistory);
    setInput('');
    setBusy(true);

    try {
      const res = await aiApi.chat({
        messages: nextHistory.map((m) => ({ role: m.role, text: m.text })),
        projectId: openProjectId,
      });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: res.reply, ideaAction: res.ideaAction },
      ]);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao consultar Assistente VYStudioCraft.', 'err');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateFromIdea = async (idea: AssistantIdeaAction) => {
    if (!user || creatingProject) return;
    setCreatingProject(true);
    try {
      const created = await fsApi.createDoc(`usuarios/${user.id}/projetos`, {
        titulo: idea.titulo,
        canalNome: idea.canal || 'Canal Principal',
        estagio: 'ideacao',
        formato: 'long',
        prioridade: 'media',
        dataPublicacaoAlvo: '',
        ctrAlvo: 8.0,
        ganchoResumo: idea.hook || '',
        resumo: idea.resumo || '',
        porqueInteressante: idea.porque || '',
        categoria: idea.categoria || 'Geral',
        checklist: [{ id: 'c1', texto: 'Validar título e conceito de thumbnail', feito: false }],
        versaoAtual: 1,
      });
      notify('Projeto criado pelo Assistente VYStudioCraft.', 'ok');
      setOpen(false);
      navigate(`/projetos/${created.id}`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao criar projeto.', 'err');
    } finally {
      setCreatingProject(false);
    }
  };

  const handleSaveAsNote = async (text: string) => {
    if (!user) return;
    const firstLine = text.split('\n').find((l) => l.trim())?.replace(/^#+\s*/, '').replace(/\*\*/g, '') || 'Resposta do Assistente';
    await fsApi.createDoc(`usuarios/${user.id}/notas`, {
      titulo: firstLine.slice(0, 64),
      categoria: 'Assistente VYStudioCraft',
      conteudo: text,
      fixada: false,
    });
    notify('Resposta salva em Notas do Estúdio.', 'ok');
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 vy-btn-primary px-4 py-2.5 shadow-lg flex items-center gap-2 text-xs font-medium"
          aria-label="Abrir Assistente VYStudioCraft"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Assistente VYStudioCraft</span>
        </button>
      )}

      {open && (
        <aside
          className="fixed bottom-4 right-4 z-50 w-[min(460px,calc(100vw-2rem))] h-[min(640px,calc(100vh-3rem))] vy-card flex flex-col overflow-hidden shadow-xl"
          role="dialog"
          aria-label="Assistente VYStudioCraft"
        >
          <div
            className="px-4 py-3 border-b flex items-center justify-between gap-2 shrink-0"
            style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-subtle)' }}
          >
            <div className="min-w-0">
              <div className="font-display font-semibold text-sm flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                <Sparkles className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
                <span className="truncate">Assistente VYStudioCraft</span>
              </div>
              <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                {openProjectId ? 'Conectado ao projeto aberto' : 'Conectado aos seus canais e projetos'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-md"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Fechar assistente"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Pergunte sobre seus canais, projetos em andamento, ideias de próximos vídeos ou peça para criar um projeto novo diretamente no Kanban.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void sendMessage(s)}
                      className="vy-btn-secondary px-2.5 py-1.5 text-xs text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col gap-1.5 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className="max-w-[94%] rounded-lg px-3.5 py-2.5 text-xs leading-relaxed"
                    style={{
                      backgroundColor: m.role === 'user' ? 'var(--accent)' : 'var(--bg-subtle)',
                      color: m.role === 'user' ? '#ffffff' : 'var(--text-primary)',
                      border: m.role === 'user' ? 'none' : '1px solid var(--border-hairline)',
                    }}
                  >
                    {m.role === 'user' ? (
                      <div className="whitespace-pre-wrap">{m.text}</div>
                    ) : (
                      <MarkdownRenderer content={m.text} compact />
                    )}
                  </div>
                  {m.role === 'assistant' && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(m.text).catch(() => undefined);
                          notify('Texto copiado.', 'info');
                        }}
                        className="text-[11px] inline-flex items-center gap-1 hover:underline"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copiar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleSaveAsNote(m.text)}
                        className="text-[11px] inline-flex items-center gap-1 hover:underline"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <StickyNote className="w-3 h-3" />
                        <span>Salvar como Nota</span>
                      </button>
                      {m.ideaAction && (
                        <button
                          type="button"
                          disabled={creatingProject}
                          onClick={() => void handleCreateFromIdea(m.ideaAction!)}
                          className="vy-btn-primary px-2.5 py-1 text-[11px] font-medium inline-flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Criar projeto: {m.ideaAction.titulo}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
            {busy && (
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analisando dados do estúdio...</span>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage(input);
            }}
            className="p-3 border-t flex gap-2 shrink-0"
            style={{ borderColor: 'var(--border-hairline)' }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte ou peça para criar um projeto..."
              className="vy-input flex-1 px-3 py-2 text-xs"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="vy-btn-primary px-3 py-2 text-xs flex items-center justify-center"
              aria-label="Enviar mensagem"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </aside>
      )}
    </>
  );
}
