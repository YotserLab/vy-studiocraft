import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  KeyRound,
  Languages,
  Loader2,
  Newspaper,
  Palette,
  RefreshCw,
  Shield,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { TEMAS, useApp, type TemaId } from '../contexts/AppContext';
import { buildNoticiaIdeiaDoc, ideiasCollectionPath } from '../lib/ideiasLogic';
import {
  adminApi,
  aiApi,
  authApi,
  devApi,
  feedApi,
  fsApi,
  type AuditEvent,
  type FsDoc,
  type RssFeedItem,
} from '../lib/dataClient';
import { navigate } from '../lib/router';

const DEFAULT_FEEDS = [
  { nome: 'Hacker News', url: 'https://hnrss.org/frontpage' },
  { nome: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
  { nome: 'YouTube Blog', url: 'https://blog.youtube/rss/' },
];

export function NewsView() {
  const { user, notify } = useApp();
  const [feedUrl, setFeedUrl] = useState(DEFAULT_FEEDS[0].url);
  const [channelTitle, setChannelTitle] = useState('');
  const [items, setItems] = useState<RssFeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [curating, setCurating] = useState(false);
  const [translatingAll, setTranslatingAll] = useState(false);
  const [translatingIdx, setTranslatingIdx] = useState<number | null>(null);
  const [curatedReasons, setCuratedReasons] = useState<Record<number, { rank: number; reason: string }>>({});
  const [translatedMap, setTranslatedMap] = useState<Record<number, { title: string; summary: string }>>({});

  const loadFeed = async (targetUrl = feedUrl) => {
    setLoading(true);
    setError(null);
    setCuratedReasons({});
    setTranslatedMap({});
    try {
      const res = await feedApi.fetchRss(targetUrl);
      setChannelTitle(res.channelTitle);
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar feed RSS.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFeed(feedUrl);
  }, []);

  const handleCurate = async () => {
    if (items.length === 0) return;
    setCurating(true);
    try {
      const res = await aiApi.action<Array<{ index: number; reason: string }>>('news:curate', {
        headlines: items.map((it) => ({ title: it.title, source: it.source })),
      });
      const picks = Array.isArray(res.data) ? res.data : [];
      const nextMap: Record<number, { rank: number; reason: string }> = {};
      picks.forEach((p, idx) => {
        nextMap[p.index] = { rank: idx + 1, reason: p.reason };
      });
      setCuratedReasons(nextMap);
      notify(`${picks.length} pauta(s) recomendada(s) pela curadoria IA.`, 'ok');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro na curadoria IA.', 'err');
    } finally {
      setCurating(false);
    }
  };

  const handleTranslateAll = async () => {
    if (items.length === 0) return;
    setTranslatingAll(true);
    try {
      const res = await aiApi.action<Array<{ i: number; t: string; s: string }>>('translate:news', {
        items: items.map((it, i) => ({ i, t: it.title, s: it.summary })),
      });
      const list = Array.isArray(res.data) ? res.data : [];
      const next: Record<number, { title: string; summary: string }> = { ...translatedMap };
      for (const row of list) {
        next[row.i] = { title: row.t, summary: row.s };
      }
      setTranslatedMap(next);
      notify('Manchetes traduzidas para PT-BR.', 'ok');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao traduzir manchetes.', 'err');
    } finally {
      setTranslatingAll(false);
    }
  };

  const handleTranslateOne = async (idx: number, item: RssFeedItem) => {
    setTranslatingIdx(idx);
    try {
      const res = await aiApi.action<{ titulo: string; texto: string }>('translate:article', {
        title: item.title,
        text: item.summary,
      });
      if (res.data) {
        setTranslatedMap((prev) => ({
          ...prev,
          [idx]: { title: res.data!.titulo || item.title, summary: res.data!.texto || item.summary },
        }));
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao traduzir notícia.', 'err');
    } finally {
      setTranslatingIdx(null);
    }
  };

  const handleTurnIntoIdea = async (item: RssFeedItem, idx: number) => {
    if (!user) return;
    const display = translatedMap[idx] || { title: item.title, summary: item.summary };
    await fsApi.createDoc(
      ideiasCollectionPath(user.id),
      buildNoticiaIdeiaDoc({
        title: display.title,
        summary: display.summary,
        link: item.link,
        channelTitle,
      })
    );
    notify('Notícia salva em Explorar Ideias.', 'ok');
  };

  return (
    <AppShell
      title="Notícias & Tendências RSS"
      breadcrumb="Inteligência"
      primaryAction={
        items.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={translatingAll}
              onClick={() => void handleTranslateAll()}
              className="vy-btn-secondary px-3 py-1.5 text-xs font-medium whitespace-nowrap flex items-center gap-1.5"
            >
              {translatingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Languages className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />}
              <span>{translatingAll ? 'Traduzindo...' : 'Traduzir Manchetes (PT-BR)'}</span>
            </button>
            <button
              type="button"
              disabled={curating}
              onClick={() => void handleCurate()}
              className="vy-btn-primary px-3.5 py-1.5 text-xs font-medium whitespace-nowrap flex items-center gap-1.5"
            >
              {curating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{curating ? 'Selecionando...' : 'Curadoria IA (Top 8)'}</span>
            </button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <div className="vy-card p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {DEFAULT_FEEDS.map((f) => (
              <button
                key={f.url}
                type="button"
                onClick={() => {
                  setFeedUrl(f.url);
                  void loadFeed(f.url);
                }}
                className="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors"
                style={{
                  backgroundColor: feedUrl === f.url ? 'var(--accent-soft)' : 'var(--bg-subtle)',
                  borderColor: feedUrl === f.url ? 'var(--accent)' : 'var(--border-hairline)',
                  color: feedUrl === f.url ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                {f.nome}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void loadFeed(feedUrl);
            }}
            className="flex gap-2"
          >
            <input
              type="url"
              required
              value={feedUrl}
              onChange={(e) => setFeedUrl(e.target.value)}
              placeholder="https://exemplo.com/rss.xml"
              className="vy-input flex-1 px-3 py-2 text-sm"
            />
            <button type="submit" disabled={loading} className="vy-btn-primary px-4 py-2 text-xs font-medium flex items-center gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Carregar Feed</span>
            </button>
          </form>
        </div>

        {error && (
          <div className="vy-card p-4 text-sm" style={{ borderColor: 'var(--status-err)', color: 'var(--status-err)' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="vy-card p-8 h-56 animate-pulse" />
        ) : items.length === 0 ? (
          <div className="vy-card p-10 text-center space-y-2">
            <Newspaper className="w-8 h-8 mx-auto" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Nenhum item retornado pelo feed informado.
            </p>
          </div>
        ) : (
          <div className="vy-card divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
            {items.map((item, idx) => {
              const pick = curatedReasons[idx];
              const tr = translatedMap[idx];
              return (
                <div
                  key={idx}
                  className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                  style={pick ? { backgroundColor: 'var(--accent-soft)' } : undefined}
                >
                  <div className="space-y-1.5">
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {item.source} {item.pubDate ? `· ${item.pubDate}` : ''}
                      {pick && (
                        <span className="font-semibold ml-2" style={{ color: 'var(--accent)' }}>
                          · Top #{pick.rank} IA: {pick.reason}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                      {tr?.title || item.title}
                    </h3>
                    {(tr?.summary || item.summary) && (
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {tr?.summary || item.summary}
                      </p>
                    )}
                  </div>
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void handleTurnIntoIdea(item, idx)}
                      className="vy-btn-secondary px-3 py-1.5 text-xs font-medium whitespace-nowrap"
                    >
                      Salvar como Ideia
                    </button>
                    <button
                      type="button"
                      disabled={translatingIdx === idx}
                      onClick={() => void handleTranslateOne(idx, item)}
                      className="vy-btn-secondary px-3 py-1.5 text-xs font-medium inline-flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      {translatingIdx === idx ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
                      <span>Traduzir PT-BR</span>
                    </button>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="vy-btn-secondary px-3 py-1.5 text-xs inline-flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      <span>Ler Fonte</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export function SettingsView() {
  const { user, runtimeConfig, tema, setTema, setUserDirect, notify } = useApp();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [reauthPassword, setReauthPassword] = useState('');
  const [reauthTicket, setReauthTicket] = useState<string | null>(null);
  const [reauthMfaCode, setReauthMfaCode] = useState('');
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaEnrollCode, setMfaEnrollCode] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) setDisplayName(user.displayName);
  }, [user?.displayName]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await authApi.updateProfile(displayName);
      setUserDirect(res.user);
      notify('Perfil atualizado.', 'ok');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao atualizar perfil.', 'err');
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyEmail = async () => {
    const res = await authApi.verifyEmail();
    setUserDirect(res.user);
    notify('E-mail verificado.', 'ok');
  };

  const handleStartMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const re = await authApi.reauth(reauthPassword);
      if (re.mfaRequired && re.ticket) {
        setReauthTicket(re.ticket);
        return;
      }
      const started = await authApi.mfaStart();
      setMfaSecret(started.secret);
      setReauthPassword('');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Senha incorreta.', 'err');
    } finally {
      setBusy(false);
    }
  };

  const handleEnrollMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaSecret) return;
    setBusy(true);
    try {
      const res = await authApi.mfaEnroll(mfaSecret, mfaEnrollCode);
      setUserDirect(res.user);
      setMfaSecret(null);
      setMfaEnrollCode('');
      notify('MFA TOTP ativado com sucesso.', 'ok');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Código TOTP inválido.', 'err');
    } finally {
      setBusy(false);
    }
  };

  const handleUnenrollMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (reauthTicket) {
        await authApi.mfaReauth(reauthTicket, reauthMfaCode);
        setReauthTicket(null);
        setReauthMfaCode('');
      } else {
        const re = await authApi.reauth(reauthPassword);
        if (re.mfaRequired && re.ticket) {
          setReauthTicket(re.ticket);
          setBusy(false);
          return;
        }
      }
      const res = await authApi.mfaUnenroll();
      setUserDirect(res.user);
      setReauthPassword('');
      notify('MFA desativado.', 'info');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Não foi possível desativar MFA.', 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell title="Configurações" breadcrumb="Sistema">
      <div className="max-w-4xl space-y-6">
        {/* Aparência / 6 Temas */}
        <section className="vy-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <h2 className="font-display font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
              Aparência & Temas
            </h2>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Escolha um dos 6 presets visuais. A preferência é salva no seu perfil e no navegador.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TEMAS.map((t) => {
              const selected = tema === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => void setTema(t.id as TemaId)}
                  className="p-3.5 rounded-lg border text-left transition-colors flex items-center gap-3"
                  style={{
                    borderColor: selected ? 'var(--accent)' : 'var(--border-hairline)',
                    backgroundColor: selected ? 'var(--accent-soft)' : 'var(--bg-subtle)',
                  }}
                >
                  <span
                    className="w-8 h-8 rounded-md border shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: t.swatch, borderColor: 'var(--border-hairline)' }}
                  >
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.accent }} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {t.label}
                    </div>
                    <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {t.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Perfil */}
        <section className="vy-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <h2 className="font-display font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                Conta & Perfil
              </h2>
            </div>
            {user && !user.emailVerified && (
              <button type="button" onClick={handleVerifyEmail} className="vy-btn-secondary px-3 py-1.5 text-xs">
                Verificar E-mail
              </button>
            )}
          </div>
          <form onSubmit={handleSaveProfile} className="grid sm:grid-cols-3 gap-3 items-end">
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Nome de exibição</span>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="vy-input w-full px-3 py-2 text-sm"
              />
            </label>
            <button type="submit" disabled={busy} className="vy-btn-primary px-4 py-2 text-xs font-medium">
              Salvar Perfil
            </button>
          </form>
          {user && (
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              E-mail: {user.email} · Status: {user.emailVerified ? 'Verificado' : 'Pendente'} · Papel: {user.isAdmin ? 'Admin' : 'Criador'}
            </div>
          )}
        </section>

        {/* Segurança MFA TOTP */}
        <section className="vy-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <h2 className="font-display font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                Autenticação em Duas Etapas (TOTP)
              </h2>
            </div>
            <span className="text-xs font-medium flex items-center gap-1" style={{ color: user?.mfaEnabled ? 'var(--status-ok)' : 'var(--text-muted)' }}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{user?.mfaEnabled ? 'Ativo' : 'Inativo'}</span>
            </span>
          </div>

          {!user?.mfaEnabled ? (
            mfaSecret ? (
              <form onSubmit={handleEnrollMfa} className="space-y-4">
                <div className="p-4 rounded-lg border space-y-2" style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-subtle)' }}>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Adicione este segredo Base32 no seu aplicativo autenticador (Google Authenticator, 1Password, Authy):
                  </div>
                  <div className="font-mono-num text-sm font-semibold select-all" style={{ color: 'var(--text-primary)' }}>
                    {mfaSecret}
                  </div>
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={mfaEnrollCode}
                    onChange={(e) => setMfaEnrollCode(e.target.value)}
                    placeholder="Código de 6 dígitos"
                    className="vy-input px-3 py-2 text-sm font-mono-num w-48"
                  />
                  <button type="submit" disabled={busy} className="vy-btn-primary px-4 py-2 text-xs font-medium">
                    Confirmar Ativação
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleStartMfa} className="flex flex-wrap gap-3 items-center">
                <input
                  type="password"
                  required
                  value={reauthPassword}
                  onChange={(e) => setReauthPassword(e.target.value)}
                  placeholder="Confirme sua senha atual"
                  className="vy-input px-3 py-2 text-sm w-64"
                />
                <button type="submit" disabled={busy} className="vy-btn-primary px-4 py-2 text-xs font-medium">
                  Gerar Chave TOTP
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handleUnenrollMfa} className="flex flex-wrap gap-3 items-center">
              {reauthTicket ? (
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={reauthMfaCode}
                  onChange={(e) => setReauthMfaCode(e.target.value)}
                  placeholder="Código TOTP atual (6 dígitos)"
                  className="vy-input px-3 py-2 text-sm font-mono-num w-56"
                />
              ) : (
                <input
                  type="password"
                  required
                  value={reauthPassword}
                  onChange={(e) => setReauthPassword(e.target.value)}
                  placeholder="Confirme sua senha atual"
                  className="vy-input px-3 py-2 text-sm w-64"
                />
              )}
              <button type="submit" disabled={busy} className="vy-btn-secondary px-4 py-2 text-xs font-medium" style={{ color: 'var(--status-err)' }}>
                {reauthTicket ? 'Confirmar Desativação' : 'Desativar MFA'}
              </button>
            </form>
          )}
        </section>

        {runtimeConfig?.devMode && runtimeConfig?.useMockData && (
          <section className="vy-card p-6 space-y-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="space-y-1">
                <h2 className="font-display font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                  Seed de Desenvolvimento (USE_MOCK_DATA=true)
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Restaura os exemplos isolados de projetos, canais, Radar, roteiros e mídia para as contas de demonstração. Para ambiente zerado, use <code className="font-mono-num">USE_MOCK_DATA=false</code>.
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const res = await devApi.reseed();
                    notify(res.message, 'ok');
                  } catch (err) {
                    notify(err instanceof Error ? err.message : 'Erro ao restaurar seed.', 'err');
                  } finally {
                    setBusy(false);
                  }
                }}
                className="vy-btn-secondary px-4 py-2 text-xs font-medium whitespace-nowrap"
              >
                Restaurar Exemplos do Seed
              </button>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

export function HelpView() {
  return (
    <AppShell title="Ajuda & Diagrama de Produção" breadcrumb="Sistema">
      <div className="max-w-4xl space-y-6">
        <div className="vy-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <h2 className="font-display font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
              Fluxo Recomendado do Estúdio
            </h2>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            O VYStudioCraft organiza a produção audiovisual em quatro etapas contínuas para reduzir o tempo entre a descoberta de uma tendência e a publicação final no YouTube.
          </p>
          <div className="grid sm:grid-cols-4 gap-3 pt-2">
            {[
              { step: '01', title: 'Radar & Notícias', desc: 'Valide sinais de aceleração e transforme pautas em ideias.' },
              { step: '02', title: 'Roteirista & 30s', desc: 'Estruture o roteiro com IA e compare duas versões de gancho.' },
              { step: '03', title: 'Kanban & Versões', desc: 'Movimente cartões entre gravação/edição com checklist ativo.' },
              { step: '04', title: 'Mídia & Publicidade', desc: 'Centralize arquivos em disco e prazos de patrocínios.' },
            ].map((s) => (
              <div key={s.step} className="p-4 rounded-lg border space-y-1" style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-subtle)' }}>
                <div className="font-mono-num text-xs font-bold" style={{ color: 'var(--accent)' }}>{s.step}</div>
                <div className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{s.title}</div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="vy-card p-6 space-y-3">
          <h3 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Modo Zerado vs Seed de Desenvolvimento
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            O carregamento de dados iniciais de demonstração é controlado pela variável de ambiente <code className="font-mono-num">USE_MOCK_DATA</code> no servidor. Com <code className="font-mono-num">USE_MOCK_DATA=false</code> e um banco limpo, o primeiro usuário criado em <code className="font-mono-num">/cadastro</code> torna-se administrador automaticamente.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

export function AdminView({ subPath }: { subPath?: string }) {
  const { user, notify } = useApp();
  const [tab, setTab] = useState<'membros' | 'aulas' | 'planos' | 'erros'>(() => {
    if (subPath?.includes('aulas')) return 'aulas';
    if (subPath?.includes('planos')) return 'planos';
    if (subPath?.includes('erros')) return 'erros';
    return 'membros';
  });

  const [membros, setMembros] = useState<FsDoc<{ nome: string; email: string; papel: string; plano: string; status: string }>[]>([]);
  const [aulas, setAulas] = useState<FsDoc<{ titulo: string; modulo: string; duracaoMin: number; nivel: string; instrutor: string; resumo: string; ordem: number }>[]>([]);
  const [planos, setPlanos] = useState<FsDoc<{ niveis: Array<{ id: string; nome: string; limiteCanais: number; limiteProjetosAtivos: number; limiteRoteirosIaMes: number; limiteStorageMb: number }> }> | null>(null);
  const [erros, setErros] = useState<FsDoc<{ origem: string; mensagem: string; rota: string; severidade: string }>[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonModule, setNewLessonModule] = useState('Estratégia');
  const [newLessonSummary, setNewLessonSummary] = useState('');

  const loadAll = async () => {
    if (!user?.isAdmin) return;
    try {
      const [m, a, p, e, au] = await Promise.all([
        fsApi.listDocs<{ nome: string; email: string; papel: string; plano: string; status: string }>('membros'),
        fsApi.listDocs<{ titulo: string; modulo: string; duracaoMin: number; nivel: string; instrutor: string; resumo: string; ordem: number }>('aulas'),
        fsApi.getDoc<{ niveis: Array<{ id: string; nome: string; limiteCanais: number; limiteProjetosAtivos: number; limiteRoteirosIaMes: number; limiteStorageMb: number }> }>('planos/catalogo'),
        fsApi.listDocs<{ origem: string; mensagem: string; rota: string; severidade: string }>('erros'),
        adminApi.listAudit(),
      ]);
      setMembros(Array.isArray(m) ? m : []);
      setAulas(Array.isArray(a) ? a : []);
      setPlanos(p?.exists ? p : null);
      setErros(Array.isArray(e) ? e : []);
      setAudit(Array.isArray(au?.events) ? au.events : []);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao carregar dados administrativos.', 'err');
    }
  };

  useEffect(() => {
    void loadAll();
  }, [user?.id, user?.isAdmin]);

  if (!user?.isAdmin) {
    return (
      <AppShell title="Administração" breadcrumb="Sistema">
        <div className="vy-card p-8 text-center space-y-3">
          <Shield className="w-8 h-8 mx-auto" style={{ color: 'var(--status-err)' }} />
          <h2 className="font-display font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
            Acesso restrito a administradores
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Sua conta atual não possui permissões administrativas.
          </p>
        </div>
      </AppShell>
    );
  }

  const switchTab = (next: 'membros' | 'aulas' | 'planos' | 'erros') => {
    setTab(next);
    navigate(next === 'membros' ? '/admin' : `/admin/${next}`, true);
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonTitle.trim()) return;
    await fsApi.createDoc('aulas', {
      titulo: newLessonTitle.trim(),
      modulo: newLessonModule,
      duracaoMin: 15,
      nivel: 'Essencial',
      instrutor: user.displayName,
      resumo: newLessonSummary.trim() || 'Aula publicada pelo painel administrativo.',
      topicos: ['Visão geral aplicada'],
      ordem: aulas.length + 1,
    });
    setNewLessonTitle('');
    setNewLessonSummary('');
    notify('Aula publicada.', 'ok');
    void loadAll();
  };

  return (
    <AppShell title="Painel Administrativo" breadcrumb="Admin">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg border w-fit" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-hairline)' }}>
          {(['membros', 'aulas', 'planos', 'erros'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => switchTab(t)}
              className="px-3.5 py-1.5 text-xs font-medium rounded-md capitalize whitespace-nowrap"
              style={{
                backgroundColor: tab === t ? 'var(--accent-soft)' : 'transparent',
                color: tab === t ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              {t === 'planos' ? 'Limites (Planos)' : t}
            </button>
          ))}
        </div>

        {tab === 'membros' && (
          <div className="vy-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--border-hairline)', color: 'var(--text-muted)' }}>
                  <th className="px-5 py-3 font-medium">Membro</th>
                  <th className="px-4 py-3 font-medium">Papel</th>
                  <th className="px-4 py-3 font-medium">Nível de Limite</th>
                  <th className="px-5 py-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
                {membros.map((m) => (
                  <tr key={m.id}>
                    <td className="px-5 py-3">
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{m.data.nome}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.data.email}</div>
                    </td>
                    <td className="px-4 py-3 text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{m.data.papel}</td>
                    <td className="px-4 py-3">
                      <select
                        value={m.data.plano || 'solo'}
                        onChange={async (e) => {
                          await fsApi.patchDoc(`membros/${m.id}`, { plano: e.target.value });
                          notify('Limite atualizado.', 'ok');
                          void loadAll();
                        }}
                        className="vy-input px-2 py-1 text-xs"
                      >
                        <option value="solo">Solo</option>
                        <option value="estudio">Estúdio</option>
                        <option value="rede">Rede</option>
                      </select>
                    </td>
                    <td className="px-5 py-3 text-xs text-right capitalize" style={{ color: 'var(--status-ok)' }}>{m.data.status || 'ativo'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'aulas' && (
          <div className="space-y-5">
            <form onSubmit={handleAddLesson} className="vy-card p-5 grid sm:grid-cols-4 gap-3">
              <input type="text" required value={newLessonTitle} onChange={(e) => setNewLessonTitle(e.target.value)} placeholder="Título da aula" className="vy-input px-3 py-2 text-sm sm:col-span-2" />
              <input type="text" value={newLessonModule} onChange={(e) => setNewLessonModule(e.target.value)} placeholder="Módulo" className="vy-input px-3 py-2 text-sm" />
              <button type="submit" className="vy-btn-primary px-4 py-2 text-xs font-medium">Publicar Aula</button>
              <input type="text" value={newLessonSummary} onChange={(e) => setNewLessonSummary(e.target.value)} placeholder="Resumo da aula" className="vy-input px-3 py-2 text-sm sm:col-span-4" />
            </form>

            <div className="vy-card divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
              {aulas.map((a) => (
                <div key={a.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{a.data.titulo}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.data.modulo} · {a.data.duracaoMin} min</div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await fsApi.deleteDoc(`aulas/${a.id}`);
                      void loadAll();
                    }}
                    className="text-xs"
                    style={{ color: 'var(--status-err)' }}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'planos' && (
          <div className="vy-card p-6 space-y-4">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Limites operacionais por perfil de workspace (sem cobrança ou faturamento).
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              {(planos?.data.niveis || []).map((n) => (
                <div key={n.id} className="p-4 rounded-lg border space-y-2" style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-subtle)' }}>
                  <div className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{n.nome}</div>
                  <div className="text-xs font-mono-num space-y-1" style={{ color: 'var(--text-secondary)' }}>
                    <div>Canais: {n.limiteCanais}</div>
                    <div>Projetos ativos: {n.limiteProjetosAtivos}</div>
                    <div>Roteiros IA/mês: {n.limiteRoteirosIaMes}</div>
                    <div>Storage: {n.limiteStorageMb} MB</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'erros' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="vy-card p-5 space-y-3">
              <h3 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Ocorrências Registradas (erros/*)
              </h3>
              <div className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
                {erros.length === 0 ? (
                  <p className="text-xs py-3" style={{ color: 'var(--text-muted)' }}>Nenhum erro registrado.</p>
                ) : (
                  erros.map((err) => (
                    <div key={err.id} className="py-3 text-xs space-y-1">
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{err.data.mensagem}</div>
                      <div style={{ color: 'var(--text-muted)' }}>{err.data.origem} · {err.data.rota} · {err.data.severidade}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="vy-card p-5 space-y-3">
              <h3 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Auditoria Recente
              </h3>
              <div className="divide-y max-h-96 overflow-y-auto" style={{ borderColor: 'var(--border-hairline)' }}>
                {audit.map((ev) => (
                  <div key={ev.id} className="py-2.5 text-xs space-y-0.5">
                    <div className="flex justify-between">
                      <span className="font-mono-num font-medium" style={{ color: 'var(--accent)' }}>{ev.action}</span>
                      <span className="font-mono-num" style={{ color: 'var(--text-muted)' }}>
                        {new Date(ev.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>{ev.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
