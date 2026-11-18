import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Download,
  ExternalLink,
  FileText,
  Folder,
  FolderOpen,
  GraduationCap,
  Languages,
  Loader2,
  Megaphone,
  Plus,
  StickyNote,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useApp } from '../contexts/AppContext';
import { aiApi, filesApi, fsApi, type FileItem, type FsDoc } from '../lib/dataClient';

export function LibraryView() {
  const { user, notify } = useApp();
  const basePrefix = user ? `usuarios/${user.id}` : '';
  const [prefix, setPrefix] = useState(basePrefix);
  const [items, setItems] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [subFolderInput, setSubFolderInput] = useState('');

  useEffect(() => {
    if (user && !prefix) setPrefix(`usuarios/${user.id}`);
  }, [user?.id]);

  const load = async (targetPrefix = prefix) => {
    if (!user || !targetPrefix) return;
    setLoading(true);
    try {
      const res = await filesApi.list(targetPrefix);
      setItems(res.items);
      setFolders(res.prefixes);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao listar arquivos.', 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (prefix) void load(prefix);
  }, [prefix]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const cleanFolder = subFolderInput.trim().replace(/^\/+|\/+$/g, '');
      const targetDir = cleanFolder ? `${prefix}/${cleanFolder}` : prefix;
      const targetPath = `${targetDir}/${file.name}`;
      await filesApi.upload(targetPath, file);
      notify(`Arquivo "${file.name}" enviado.`, 'ok');
      setSubFolderInput('');
      void load(prefix);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Falha no upload.', 'err');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (fullPath: string) => {
    await filesApi.remove(fullPath);
    notify('Arquivo removido.', 'info');
    void load(prefix);
  };

  const relativeSegments = prefix.replace(basePrefix, '').split('/').filter(Boolean);

  return (
    <AppShell
      title="Biblioteca de Mídia"
      breadcrumb="Ativos"
      primaryAction={
        <label className="vy-btn-primary px-3.5 py-1.5 text-xs font-medium whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5">
          <Upload className="w-3.5 h-3.5" />
          <span>{uploading ? 'Enviando...' : 'Enviar Arquivo'}</span>
          <input type="file" onChange={handleUpload} disabled={uploading} className="hidden" />
        </label>
      }
    >
      <div className="space-y-5">
        <div className="vy-card p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs flex-wrap">
            <button
              type="button"
              onClick={() => setPrefix(basePrefix)}
              className="font-medium hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              Raiz do Estúdio
            </button>
            {relativeSegments.map((seg, idx) => {
              const segPath = `${basePrefix}/${relativeSegments.slice(0, idx + 1).join('/')}`;
              return (
                <React.Fragment key={segPath}>
                  <span style={{ color: 'var(--text-muted)' }}>/</span>
                  <button
                    type="button"
                    onClick={() => setPrefix(segPath)}
                    className="font-medium hover:underline"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {seg}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
          <input
            type="text"
            value={subFolderInput}
            onChange={(e) => setSubFolderInput(e.target.value)}
            placeholder="Subpasta para próximo upload (opcional)"
            className="vy-input px-3 py-1.5 text-xs w-64"
          />
        </div>

        {loading ? (
          <div className="vy-card p-8 h-48 animate-pulse" />
        ) : folders.length === 0 && items.length === 0 ? (
          <div className="vy-card p-10 text-center space-y-2">
            <FolderOpen className="w-8 h-8 mx-auto" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Pasta vazia. Envie thumbnails, áudios, roteiros ou B-rolls usando o botão acima.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {folders.length > 0 && (
              <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {folders.map((f) => {
                  const name = f.split('/').pop() || f;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setPrefix(f)}
                      className="vy-card p-4 flex items-center gap-3 text-left hover:opacity-85 transition-opacity"
                    >
                      <Folder className="w-5 h-5 shrink-0" style={{ color: 'var(--accent)' }} />
                      <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {items.length > 0 && (
              <div className="vy-card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--border-hairline)', color: 'var(--text-muted)' }}>
                      <th className="px-5 py-3 font-medium">Arquivo</th>
                      <th className="px-4 py-3 font-medium">Tipo</th>
                      <th className="px-4 py-3 font-medium text-right">Tamanho</th>
                      <th className="px-5 py-3 font-medium text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
                    {items.map((item) => (
                      <tr key={item.fullPath}>
                        <td className="px-5 py-3 font-medium flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                          <FileText className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                          <span>{item.name}</span>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {item.contentType}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono-num text-right" style={{ color: 'var(--text-secondary)' }}>
                          {item.size < 1024 ? `${item.size} B` : `${(item.size / 1024).toFixed(1)} KB`}
                        </td>
                        <td className="px-5 py-3 text-right space-x-2 whitespace-nowrap">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="vy-btn-secondary inline-flex items-center gap-1 px-2.5 py-1 text-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Abrir</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => void handleDelete(item.fullPath)}
                            className="vy-btn-secondary inline-flex items-center gap-1 px-2.5 py-1 text-xs"
                            style={{ color: 'var(--status-err)' }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export function SavedVideosView() {
  const { user, notify } = useApp();
  const [videos, setVideos] = useState<FsDoc<{ titulo: string; tituloPt?: string; canal: string; url: string; duracao: string; motivoSalvo: string; categoria: string }>[]>([]);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [canal, setCanal] = useState('');
  const [url, setUrl] = useState('');
  const [motivoSalvo, setMotivoSalvo] = useState('');

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const docs = await fsApi.listDocs<{
        titulo: string;
        tituloPt?: string;
        canal: string;
        url: string;
        duracao: string;
        motivoSalvo: string;
        categoria: string;
      }>(`usuarios/${user.id}/videos_salvos`);
      setVideos(Array.isArray(docs) ? docs : []);
    } catch (err) {
      setVideos([]);
      notify(err instanceof Error ? err.message : 'Erro ao carregar vídeos salvos.', 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [user?.id]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !titulo.trim()) return;
    await fsApi.createDoc(`usuarios/${user.id}/videos_salvos`, {
      titulo: titulo.trim(),
      canal: canal.trim() || 'Referência',
      url: url.trim() || 'https://www.youtube.com',
      duracao: '10:00',
      motivoSalvo: motivoSalvo.trim(),
      categoria: 'Referência',
    });
    setTitulo('');
    setCanal('');
    setUrl('');
    setMotivoSalvo('');
    notify('Vídeo salvo na curadoria.', 'ok');
    void load();
  };

  const handleTranslateTitles = async () => {
    if (!user || videos.length === 0) return;
    setTranslating(true);
    try {
      const payloadItems = videos.map((v) => ({ id: v.id, title: v.data.titulo }));
      const res = await aiApi.action<Array<{ id: string; pt: string }>>('translate:titles', {
        items: payloadItems,
      });
      const list = Array.isArray(res.data) ? res.data : [];
      for (const item of list) {
        if (item.id && item.pt) {
          await fsApi.patchDoc(`usuarios/${user.id}/videos_salvos/${item.id}`, { tituloPt: item.pt });
        }
      }
      notify(`${list.length} título(s) traduzido(s) para PT-BR.`, 'ok');
      void load();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao traduzir títulos.', 'err');
    } finally {
      setTranslating(false);
    }
  };

  return (
    <AppShell
      title="Vídeos Salvos"
      breadcrumb="Ativos"
      primaryAction={
        videos.length > 0 ? (
          <button
            type="button"
            disabled={translating}
            onClick={() => void handleTranslateTitles()}
            className="vy-btn-secondary px-3.5 py-1.5 text-xs font-medium whitespace-nowrap flex items-center gap-1.5"
          >
            {translating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Languages className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />}
            <span>{translating ? 'Traduzindo...' : 'Traduzir Títulos (PT-BR)'}</span>
          </button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <form onSubmit={handleAdd} className="vy-card p-5 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input type="text" required value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título do vídeo referência" className="vy-input px-3 py-2 text-sm lg:col-span-2" />
          <input type="text" value={canal} onChange={(e) => setCanal(e.target.value)} placeholder="Canal" className="vy-input px-3 py-2 text-sm" />
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL do vídeo" className="vy-input px-3 py-2 text-sm" />
          <button type="submit" className="vy-btn-primary px-4 py-2 text-xs font-medium">Salvar Referência</button>
          <input type="text" value={motivoSalvo} onChange={(e) => setMotivoSalvo(e.target.value)} placeholder="Por que este vídeo é uma boa referência?" className="vy-input px-3 py-2 text-sm sm:col-span-2 lg:col-span-5" />
        </form>

        {loading ? (
          <div className="vy-card p-8 h-40 animate-pulse" />
        ) : videos.length === 0 ? (
          <div className="vy-card p-10 text-center space-y-2">
            <Video className="w-8 h-8 mx-auto" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Nenhum vídeo salvo ainda.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((v) => (
              <div key={v.id} className="vy-card p-5 flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {v.data.canal} · {v.data.duracao} · {v.data.categoria}
                  </div>
                  <h3 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {v.data.tituloPt || v.data.titulo}
                  </h3>
                  {v.data.tituloPt && v.data.tituloPt !== v.data.titulo && (
                    <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Original: {v.data.titulo}
                    </div>
                  )}
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {v.data.motivoSalvo || 'Referência salva sem notas.'}
                  </p>
                </div>
                <div className="pt-3 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border-hairline)' }}>
                  <a href={v.data.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline" style={{ color: 'var(--accent)' }}>
                    <span>Assistir</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={async () => {
                      await fsApi.deleteDoc(`usuarios/${user!.id}/videos_salvos/${v.id}`);
                      void load();
                    }}
                    style={{ color: 'var(--status-err)' }}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export function NotesView() {
  const { user, notify } = useApp();
  const [notas, setNotas] = useState<FsDoc<{ titulo: string; categoria: string; conteudo: string; fixada?: boolean }>[]>([]);
  const [loading, setLoading] = useState(true);
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('Editorial');
  const [conteudo, setConteudo] = useState('');

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const docs = await fsApi.listDocs<{
        titulo: string;
        categoria: string;
        conteudo: string;
        fixada?: boolean;
      }>(`usuarios/${user.id}/notas`);
      setNotas(Array.isArray(docs) ? docs : []);
    } catch (err) {
      setNotas([]);
      notify(err instanceof Error ? err.message : 'Erro ao carregar notas.', 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [user?.id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !titulo.trim()) return;
    await fsApi.createDoc(`usuarios/${user.id}/notas`, {
      titulo: titulo.trim(),
      categoria,
      conteudo: conteudo.trim(),
      fixada: false,
    });
    setTitulo('');
    setConteudo('');
    notify('Nota salva.', 'ok');
    void load();
  };

  return (
    <AppShell title="Notas do Estúdio" breadcrumb="Ativos">
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <form onSubmit={handleCreate} className="lg:col-span-4 vy-card p-5 space-y-3">
          <h2 className="font-display font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <StickyNote className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <span>Nova Nota</span>
          </h2>
          <input type="text" required value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título da nota" className="vy-input w-full px-3 py-2 text-sm" />
          <input type="text" value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Categoria" className="vy-input w-full px-3 py-2 text-sm" />
          <textarea rows={5} required value={conteudo} onChange={(e) => setConteudo(e.target.value)} placeholder="Escreva sua nota..." className="vy-input w-full px-3 py-2 text-sm" />
          <button type="submit" className="vy-btn-primary w-full py-2 text-xs font-medium">Salvar Nota</button>
        </form>

        <div className="lg:col-span-8">
          {loading ? (
            <div className="vy-card p-8 h-48 animate-pulse" />
          ) : notas.length === 0 ? (
            <div className="vy-card p-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>Nenhuma nota criada ainda.</div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {notas.map((n) => (
                <div key={n.id} className="vy-card p-5 flex flex-col justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {n.data.categoria} {n.data.fixada ? '· Fixada' : ''}
                    </div>
                    <h3 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{n.data.titulo}</h3>
                    <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>{n.data.conteudo}</p>
                  </div>
                  <div className="pt-2 border-t flex justify-end" style={{ borderColor: 'var(--border-hairline)' }}>
                    <button
                      type="button"
                      onClick={async () => {
                        await fsApi.deleteDoc(`usuarios/${user!.id}/notas/${n.id}`);
                        void load();
                      }}
                      className="text-xs"
                      style={{ color: 'var(--status-err)' }}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export function PlaybookView() {
  const { user, notify } = useApp();
  const [rules, setRules] = useState<FsDoc<{ categoria: string; titulo: string; regra: string; impacto: string }>[]>([]);
  const [loading, setLoading] = useState(true);
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('Primeiros 30s');
  const [regra, setRegra] = useState('');
  const [impacto, setImpacto] = useState('');

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const docs = await fsApi.listDocs<{
        categoria: string;
        titulo: string;
        regra: string;
        impacto: string;
      }>(`usuarios/${user.id}/playbook`);
      setRules(Array.isArray(docs) ? docs : []);
    } catch (err) {
      setRules([]);
      notify(err instanceof Error ? err.message : 'Erro ao carregar playbook.', 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [user?.id]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !titulo.trim()) return;
    await fsApi.createDoc(`usuarios/${user.id}/playbook`, {
      titulo: titulo.trim(),
      categoria,
      regra: regra.trim(),
      impacto: impacto.trim() || 'Consistência editorial',
    });
    setTitulo('');
    setRegra('');
    setImpacto('');
    notify('Regra adicionada ao Playbook.', 'ok');
    void load();
  };

  return (
    <AppShell title="Playbook Editorial" breadcrumb="Operação">
      <div className="space-y-6">
        <form onSubmit={handleAdd} className="vy-card p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input type="text" required value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título da diretriz" className="vy-input px-3 py-2 text-sm" />
          <input type="text" value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Categoria" className="vy-input px-3 py-2 text-sm" />
          <input type="text" value={impacto} onChange={(e) => setImpacto(e.target.value)} placeholder="Impacto esperado" className="vy-input px-3 py-2 text-sm" />
          <button type="submit" className="vy-btn-primary px-4 py-2 text-xs font-medium">Adicionar Regra</button>
          <input type="text" required value={regra} onChange={(e) => setRegra(e.target.value)} placeholder="Descrição prática da regra do estúdio..." className="vy-input px-3 py-2 text-sm sm:col-span-2 lg:col-span-4" />
        </form>

        {loading ? (
          <div className="vy-card p-8 h-40 animate-pulse" />
        ) : rules.length === 0 ? (
          <div className="vy-card p-8 text-center space-y-2">
            <BookOpen className="w-8 h-8 mx-auto" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Nenhuma regra cadastrada no Playbook.</p>
          </div>
        ) : (
          <div className="vy-card divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
            {rules.map((r) => (
              <div key={r.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs" style={{ color: 'var(--accent)' }}>{r.data.categoria}</div>
                  <h3 className="font-display font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{r.data.titulo}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{r.data.regra}</p>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Impacto: {r.data.impacto}</div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await fsApi.deleteDoc(`usuarios/${user!.id}/playbook/${r.id}`);
                    void load();
                  }}
                  className="text-xs shrink-0"
                  style={{ color: 'var(--status-err)' }}
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export function LessonsView() {
  const [aulas, setAulas] = useState<FsDoc<{ titulo: string; modulo: string; duracaoMin: number; nivel: string; instrutor: string; resumo: string; topicos: string[]; ordem: number }>[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fsApi
      .listDocs<{ titulo: string; modulo: string; duracaoMin: number; nivel: string; instrutor: string; resumo: string; topicos: string[]; ordem: number }>('aulas', {
        orderBy: { field: 'ordem' },
      })
      .then((docs) => {
        const list = Array.isArray(docs) ? docs : [];
        setAulas(list);
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .catch(() => setAulas([]))
      .finally(() => setLoading(false));
  }, []);

  const current = aulas.find((a) => a.id === selectedId) || aulas[0] || null;

  return (
    <AppShell title="Aulas & Academia" breadcrumb="Ativos">
      {loading ? (
        <div className="vy-card p-8 h-56 animate-pulse" />
      ) : aulas.length === 0 ? (
        <div className="vy-card p-10 text-center space-y-2">
          <GraduationCap className="w-8 h-8 mx-auto" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Nenhuma aula publicada pelo administrador ainda.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 vy-card divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
            {aulas.map((a) => {
              const active = a.id === current?.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedId(a.id)}
                  className="w-full p-4 text-left transition-colors"
                  style={{ backgroundColor: active ? 'var(--accent-soft)' : 'transparent' }}
                >
                  <div className="text-xs font-mono-num" style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}>
                    {a.data.modulo} · {a.data.duracaoMin} min
                  </div>
                  <div className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>
                    {a.data.titulo}
                  </div>
                </button>
              );
            })}
          </div>

          {current && (
            <div className="lg:col-span-8 vy-card p-6 space-y-5">
              <div className="space-y-1 pb-4 border-b" style={{ borderColor: 'var(--border-hairline)' }}>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {current.data.modulo} · Nível {current.data.nivel} · Instrutor: {current.data.instrutor}
                </div>
                <h2 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
                  {current.data.titulo}
                </h2>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {current.data.resumo}
              </p>
              <div className="space-y-2">
                <h3 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  Pontos-chave da aula
                </h3>
                <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {(current.data.topicos || []).map((t, idx) => (
                    <li key={idx}>• {t}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

export function AdvertisingView() {
  const { user, notify } = useApp();
  const [publis, setPublis] = useState<FsDoc<{ marca: string; canalNome: string; status: string; formato: string; valorAcordado: string; prazoEntrega: string; entregaveis: string }>[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [marca, setMarca] = useState('');
  const [canalNome, setCanalNome] = useState('Tech & Automação BR');
  const [formato, setFormato] = useState('Integração 60s');
  const [valorAcordado, setValorAcordado] = useState('');
  const [prazoEntrega, setPrazoEntrega] = useState('');
  const [entregaveis, setEntregaveis] = useState('');

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const docs = await fsApi.listDocs<{
        marca: string;
        canalNome: string;
        status: string;
        formato: string;
        valorAcordado: string;
        prazoEntrega: string;
        entregaveis: string;
      }>(`usuarios/${user.id}/publicidade`);
      setPublis(Array.isArray(docs) ? docs : []);
    } catch (err) {
      setPublis([]);
      notify(err instanceof Error ? err.message : 'Erro ao carregar campanhas.', 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [user?.id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !marca.trim()) return;
    await fsApi.createDoc(`usuarios/${user.id}/publicidade`, {
      marca: marca.trim(),
      canalNome,
      status: 'negociacao',
      formato,
      valorAcordado: valorAcordado.trim() || 'A definir',
      prazoEntrega,
      entregaveis: entregaveis.trim(),
    });
    setMarca('');
    setValorAcordado('');
    setEntregaveis('');
    setCreating(false);
    notify('Campanha de publicidade registrada.', 'ok');
    void load();
  };

  return (
    <AppShell
      title="Publicidade & Patrocínios"
      breadcrumb="Ativos"
      primaryAction={
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="vy-btn-primary px-3.5 py-1.5 text-xs font-medium whitespace-nowrap flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{creating ? 'Fechar' : 'Nova Campanha'}</span>
        </button>
      }
    >
      <div className="space-y-6">
        {creating && (
          <form onSubmit={handleCreate} className="vy-card p-5 space-y-3">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input type="text" required value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Marca / Anunciante" className="vy-input px-3 py-2 text-sm" />
              <input type="text" value={canalNome} onChange={(e) => setCanalNome(e.target.value)} placeholder="Canal" className="vy-input px-3 py-2 text-sm" />
              <input type="text" value={formato} onChange={(e) => setFormato(e.target.value)} placeholder="Formato" className="vy-input px-3 py-2 text-sm" />
              <input type="text" value={valorAcordado} onChange={(e) => setValorAcordado(e.target.value)} placeholder="Valor acordado (ex: R$ 5.000)" className="vy-input px-3 py-2 text-sm" />
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <input type="date" value={prazoEntrega} onChange={(e) => setPrazoEntrega(e.target.value)} className="vy-input px-3 py-2 text-sm font-mono-num" />
              <input type="text" value={entregaveis} onChange={(e) => setEntregaveis(e.target.value)} placeholder="Entregáveis e links UTM" className="vy-input px-3 py-2 text-sm sm:col-span-2" />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="vy-btn-primary px-4 py-2 text-xs font-medium">Salvar Campanha</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="vy-card p-8 h-48 animate-pulse" />
        ) : publis.length === 0 ? (
          <div className="vy-card p-10 text-center space-y-2">
            <Megaphone className="w-8 h-8 mx-auto" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Nenhuma campanha de publicidade cadastrada.</p>
          </div>
        ) : (
          <div className="vy-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--border-hairline)', color: 'var(--text-muted)' }}>
                  <th className="px-5 py-3 font-medium">Anunciante</th>
                  <th className="px-4 py-3 font-medium">Canal & Formato</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Prazo</th>
                  <th className="px-5 py-3 font-medium text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
                {publis.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3.5">
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{p.data.marca}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.data.entregaveis}</div>
                    </td>
                    <td className="px-4 py-3.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {p.data.canalNome} · {p.data.formato}
                    </td>
                    <td className="px-4 py-3.5">
                      <select
                        value={p.data.status}
                        onChange={async (e) => {
                          await fsApi.patchDoc(`usuarios/${user!.id}/publicidade/${p.id}`, { status: e.target.value });
                          void load();
                        }}
                        className="vy-input px-2 py-1 text-xs"
                      >
                        <option value="negociacao">Negociação</option>
                        <option value="em_producao">Em Produção</option>
                        <option value="aprovacao">Aprovação</option>
                        <option value="concluida">Concluída</option>
                      </select>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-mono-num" style={{ color: 'var(--text-secondary)' }}>
                      {p.data.prazoEntrega || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono-num text-right font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {p.data.valorAcordado}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
