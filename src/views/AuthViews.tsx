import React, { useState } from 'react';
import { Activity, ArrowRight, KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { authApi } from '../lib/dataClient';
import { Link, navigate, useLocationPath, validateReturnTo } from '../lib/router';

export function LandingView() {
  const { user, authLoading, runtimeConfig, setUserDirect, notify } = useApp();
  const [demoBusy, setDemoBusy] = useState(false);

  // NAV-R04: usuário logado em "/" é redirecionado para /visao-geral
  if (!authLoading && user) {
    navigate('/visao-geral', true);
    return null;
  }

  const demoEnabled = Boolean(runtimeConfig?.devMode && runtimeConfig?.useMockData && runtimeConfig?.hasUsers);

  const handleEnterDemo = async (role: 'admin' | 'creator') => {
    setDemoBusy(true);
    try {
      const targetEmail =
        role === 'admin'
          ? runtimeConfig?.adminEmailHint || 'admin@vystudiocraft.local'
          : 'creator@vystudiocraft.local';
      const targetPass = role === 'admin' ? 'Admin@1234' : 'Creator@1234';
      const res = await authApi.login(targetEmail, targetPass);
      if (res.user) {
        setUserDirect(res.user);
        notify('Versão demo (Seed) carregada.', 'ok');
        navigate('/visao-geral', true);
      } else {
        navigate('/entrar');
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao entrar na demo.', 'err');
    } finally {
      setDemoBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-canvas)' }}>
      <header
        className="h-16 px-6 lg:px-10 border-b flex items-center justify-between gap-8"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-hairline)' }}
      >
        <Link
          to="/"
          className="font-display font-bold text-lg tracking-tight whitespace-nowrap shrink-0 flex items-center gap-2"
          style={{ color: 'var(--text-primary)' }}
        >
          <Activity className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          <span>VYStudioCraft</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          <a href="#fluxo" className="hover:underline whitespace-nowrap shrink-0">Fluxo de Produção</a>
          <a href="#modulos" className="hover:underline whitespace-nowrap shrink-0">Módulos</a>
          <Link to="/entrar" className="hover:underline whitespace-nowrap shrink-0">Entrar</Link>
        </nav>
        <div className="shrink-0">
          <Link
            to="/entrar"
            className="vy-btn-primary px-4 py-2 text-sm font-medium whitespace-nowrap shrink-0 inline-flex items-center gap-2"
          >
            <span>Acessar Estúdio</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-16 space-y-16">
        <section className="grid lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <p className="text-xs font-medium tracking-wide" style={{ color: 'var(--accent)' }}>
              Gestão de Canais YouTube · Operação Individual ou Equipe
            </p>
            <h1
              className="font-display font-bold text-4xl lg:text-5xl leading-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              Do sinal de nicho ao roteiro validado e publicado em um único estúdio.
            </h1>
            <p className="text-base leading-relaxed max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
              Centralize Radar de nichos, pipeline Kanban de produção, Roteirista IA estruturado,
              comparador dos primeiros 30 segundos, notícias RSS, biblioteca de mídia e controle de
              publicidade sem planilhas dispersas.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {demoEnabled && (
                <button
                  type="button"
                  disabled={demoBusy}
                  onClick={() => void handleEnterDemo('admin')}
                  className="vy-btn-primary px-5 py-2.5 text-sm font-medium whitespace-nowrap inline-flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{demoBusy ? 'Entrando na Demo...' : 'Entrar na Versão Demo (Seed)'}</span>
                </button>
              )}
              <Link
                to="/entrar"
                className={
                  demoEnabled
                    ? 'vy-btn-secondary px-5 py-2.5 text-sm font-medium whitespace-nowrap inline-flex items-center gap-2'
                    : 'vy-btn-primary px-5 py-2.5 text-sm font-medium whitespace-nowrap inline-flex items-center gap-2'
                }
              >
                <span>Entrar no Estúdio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/cadastro"
                className="vy-btn-secondary px-5 py-2.5 text-sm font-medium whitespace-nowrap"
              >
                Criar Conta / Bootstrap
              </Link>
            </div>
            {demoEnabled && (
              <div className="text-xs flex flex-wrap items-center gap-3" style={{ color: 'var(--text-muted)' }}>
                <span>Seed DEV ativo (USE_MOCK_DATA=true): 6 projetos, 5 canais, Radar, Roteiros e Mídia prontos.</span>
                <button
                  type="button"
                  disabled={demoBusy}
                  onClick={() => void handleEnterDemo('creator')}
                  className="underline font-medium"
                  style={{ color: 'var(--accent)' }}
                >
                  Testar como Criador Convidado
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 vy-card p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="text-sm font-display font-semibold" style={{ color: 'var(--text-primary)' }}>
                Ciclo Completo de Produção
              </div>
              <ol className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <li className="pb-3 border-b" style={{ borderColor: 'var(--border-hairline)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>01. Radar & Pesquisa:</strong> monitore perfis,
                  taxa de outliers e fontes RSS em tempo real.
                </li>
                <li className="pb-3 border-b" style={{ borderColor: 'var(--border-hairline)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>02. Roteirista IA & Comparar 30s:</strong> gere
                  roteiros por blocos e valide o gancho antes de gravar.
                </li>
                <li className="pb-3 border-b" style={{ borderColor: 'var(--border-hairline)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>03. Projetos Kanban & Versões:</strong> acompanhe
                  da ideação à publicação com histórico por versão.
                </li>
                <li>
                  <strong style={{ color: 'var(--text-primary)' }}>04. Biblioteca & Publicidade:</strong> organize
                  ativos de mídia em disco e prazos de patrocínios.
                </li>
              </ol>
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Autenticação por sessão segura · Suporte a MFA TOTP · 6 temas configuráveis
            </div>
          </div>
        </section>

        <section id="modulos" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { t: 'Radar de Nichos', d: 'Sinais de aceleração e conversão direta para pautas no Kanban.' },
            { t: 'Roteirista IA', d: 'Estrutura modular com gancho 0–30s, marcações visuais e CTA.' },
            { t: 'Comparar 30s', d: 'Diagnóstico lado a lado de aberturas para maximizar retenção inicial.' },
            { t: 'Biblioteca & RSS', d: 'Armazenamento local por usuário e leitor de feeds sem CORS.' },
          ].map((item) => (
            <div key={item.t} className="vy-card p-5 space-y-2">
              <h2 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {item.t}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {item.d}
              </p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

export function LoginView() {
  const { runtimeConfig, setUserDirect, notify } = useApp();
  const { searchParams } = useLocationPath();
  const returnTo = validateReturnTo(searchParams.get('returnTo'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaTicket, setMfaTicket] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [resetDebugLink, setResetDebugLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await authApi.login(email, password);
      if (res.mfaRequired && res.ticket) {
        setMfaTicket(res.ticket);
      } else if (res.user) {
        setUserDirect(res.user);
        notify('Login realizado com sucesso.', 'ok');
        navigate(returnTo, true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao entrar.');
    } finally {
      setBusy(false);
    }
  };

  const handleQuickDemoLogin = async (targetEmail: string, targetPass: string) => {
    setError(null);
    setEmail(targetEmail);
    setPassword(targetPass);
    setBusy(true);
    try {
      const res = await authApi.login(targetEmail, targetPass);
      if (res.mfaRequired && res.ticket) {
        setMfaTicket(res.ticket);
      } else if (res.user) {
        setUserDirect(res.user);
        notify('Sessão demo (Seed) iniciada.', 'ok');
        navigate(returnTo, true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao iniciar sessão demo.');
    } finally {
      setBusy(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaTicket) return;
    setError(null);
    setBusy(true);
    try {
      const res = await authApi.mfaLogin(mfaTicket, mfaCode);
      setUserDirect(res.user);
      notify('Autenticação MFA concluída.', 'ok');
      navigate(returnTo, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código TOTP inválido.');
    } finally {
      setBusy(false);
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await authApi.requestReset(email);
      setResetDebugLink(res.debugLink || null);
      notify(res.message, 'ok');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao solicitar recuperação.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: 'var(--bg-canvas)' }}>
      <div className="w-full max-w-md vy-card p-6 sm:p-8 space-y-6">
        <div className="space-y-1">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-display font-bold mb-2"
            style={{ color: 'var(--accent)' }}
          >
            <Activity className="w-4 h-4" />
            <span>VYStudioCraft</span>
          </Link>
          <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
            {mfaTicket ? 'Verificação em duas etapas' : resetMode ? 'Recuperar senha' : 'Entrar no estúdio'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {mfaTicket
              ? 'Informe o código de 6 dígitos do seu aplicativo autenticador.'
              : resetMode
                ? 'Informe seu e-mail para gerar o link de redefinição.'
                : 'Acesse seus canais, projetos e roteiros.'}
          </p>
        </div>

        {error && (
          <div
            className="p-3 rounded-lg text-sm border"
            style={{
              borderColor: 'var(--status-err)',
              color: 'var(--status-err)',
              backgroundColor: 'var(--bg-subtle)',
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        {mfaTicket ? (
          <form onSubmit={handleMfaSubmit} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Código TOTP (6 dígitos)
              </span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder="000000"
                className="vy-input w-full px-3 py-2 text-base font-mono-num tracking-widest"
              />
            </label>
            <button type="submit" disabled={busy} className="vy-btn-primary w-full py-2.5 text-sm font-medium">
              {busy ? 'Validando...' : 'Confirmar código'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMfaTicket(null);
                setMfaCode('');
              }}
              className="vy-btn-secondary w-full py-2 text-sm"
            >
              Voltar
            </button>
          </form>
        ) : resetMode ? (
          <form onSubmit={handleResetRequest} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                E-mail cadastrado
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@dominio.com"
                className="vy-input w-full px-3 py-2 text-sm"
              />
            </label>
            <button type="submit" disabled={busy} className="vy-btn-primary w-full py-2.5 text-sm font-medium">
              {busy ? 'Gerando...' : 'Gerar link de recuperação'}
            </button>
            {resetDebugLink && (
              <div className="p-3 rounded-lg border text-xs space-y-1" style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-subtle)' }}>
                <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  Link de depuração (DEV_MODE):
                </div>
                <a
                  href={resetDebugLink}
                  onClick={(e) => {
                    e.preventDefault();
                    const u = new URL(resetDebugLink);
                    navigate(`${u.pathname}${u.search}`);
                  }}
                  className="underline break-all"
                  style={{ color: 'var(--accent)' }}
                >
                  {resetDebugLink}
                </a>
              </div>
            )}
            <button type="button" onClick={() => setResetMode(false)} className="vy-btn-secondary w-full py-2 text-sm">
              Voltar ao login
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Mail className="w-3.5 h-3.5" />
                <span>E-mail</span>
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@vystudiocraft.local"
                className="vy-input w-full px-3 py-2 text-sm"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Lock className="w-3.5 h-3.5" />
                <span>Senha</span>
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                className="vy-input w-full px-3 py-2 text-sm"
              />
            </label>
            <button type="submit" disabled={busy} className="vy-btn-primary w-full py-2.5 text-sm font-medium">
              {busy ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        )}

        {!mfaTicket && !resetMode && (
          <div className="space-y-4 pt-2 border-t text-xs" style={{ borderColor: 'var(--border-hairline)', color: 'var(--text-secondary)' }}>
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setResetMode(true)} className="hover:underline" style={{ color: 'var(--accent)' }}>
                Esqueci minha senha
              </button>
              <Link to="/cadastro" className="hover:underline" style={{ color: 'var(--accent)' }}>
                {runtimeConfig?.hasUsers === false ? 'Criar 1º usuário (Admin)' : 'Cadastro'}
              </Link>
            </div>

            {runtimeConfig?.devMode && runtimeConfig?.useMockData && runtimeConfig?.hasUsers && (
              <div className="p-3.5 rounded-lg border space-y-2.5" style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-subtle)' }}>
                <div className="font-medium flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                  <span>Versão Mocada (Seed DEV · USE_MOCK_DATA=true)</span>
                </div>
                <div className="font-mono-num text-[11px] space-y-0.5">
                  <div>Admin: {runtimeConfig.adminEmailHint || 'admin@vystudiocraft.local'} / Admin@1234</div>
                  <div>Convidado: creator@vystudiocraft.local / Creator@1234</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void handleQuickDemoLogin(
                        runtimeConfig.adminEmailHint || 'admin@vystudiocraft.local',
                        'Admin@1234'
                      )
                    }
                    className="vy-btn-primary px-3 py-1.5 text-xs font-medium"
                  >
                    Entrar Agora (Admin Demo)
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleQuickDemoLogin('creator@vystudiocraft.local', 'Creator@1234')}
                    className="vy-btn-secondary px-3 py-1.5 text-xs font-medium"
                  >
                    Entrar Agora (Criador Demo)
                  </button>
                </div>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Para ambiente zerado: defina <code className="font-mono-num">USE_MOCK_DATA=false</code> e limpe o banco.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function SignupView() {
  const { runtimeConfig, setUserDirect, notify } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isBootstrap = runtimeConfig?.hasUsers === false;
  const canSignup = isBootstrap || Boolean(runtimeConfig?.signupOpen);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await authApi.signup(email, password, name);
      setUserDirect(res.user);
      notify('Conta criada com sucesso.', 'ok');
      navigate('/visao-geral', true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a conta.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: 'var(--bg-canvas)' }}>
      <div className="w-full max-w-md vy-card p-6 sm:p-8 space-y-6">
        <div className="space-y-1">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-display font-bold mb-2" style={{ color: 'var(--accent)' }}>
            <Activity className="w-4 h-4" />
            <span>VYStudioCraft</span>
          </Link>
          <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
            {isBootstrap ? 'Configurar primeiro administrador' : 'Criar nova conta'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {isBootstrap
              ? 'Banco zerado detectado. O primeiro usuário será configurado como administrador.'
              : canSignup
                ? 'Preencha os dados abaixo para ingressar no estúdio.'
                : 'O cadastro público está desativado (SIGNUP_OPEN=false).'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg border text-sm" style={{ borderColor: 'var(--status-err)', color: 'var(--status-err)' }}>
            {error}
          </div>
        )}

        {canSignup ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Nome</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="vy-input w-full px-3 py-2 text-sm"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>E-mail</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                className="vy-input w-full px-3 py-2 text-sm"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Senha (mín. 6 caracteres)</span>
              <input
                type="password"
                minLength={6}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="vy-input w-full px-3 py-2 text-sm"
              />
            </label>
            <button type="submit" disabled={busy} className="vy-btn-primary w-full py-2.5 text-sm font-medium">
              {busy ? 'Criando...' : isBootstrap ? 'Criar Administrador' : 'Criar Conta'}
            </button>
          </form>
        ) : (
          <div className="p-4 rounded-lg border text-sm space-y-2" style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-subtle)' }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              Este estúdio opera em modo privado. Solicite ao administrador que habilite <code className="font-mono-num">SIGNUP_OPEN=true</code> ou utilize uma conta existente.
            </p>
          </div>
        )}

        <div className="pt-2 border-t text-xs flex justify-between" style={{ borderColor: 'var(--border-hairline)' }}>
          <Link to="/entrar" className="hover:underline" style={{ color: 'var(--accent)' }}>
            Já tenho conta — Entrar
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ResetPasswordView() {
  const { searchParams } = useLocationPath();
  const token = searchParams.get('token') || '';
  const { notify } = useApp();
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await authApi.confirmReset(token, password);
      setDone(true);
      notify('Senha redefinida com sucesso.', 'ok');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao redefinir senha.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: 'var(--bg-canvas)' }}>
      <div className="w-full max-w-md vy-card p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2 text-sm font-display font-bold" style={{ color: 'var(--accent)' }}>
          <KeyRound className="w-4 h-4" />
          <span>VYStudioCraft · Recuperar Senha</span>
        </div>
        <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
          Definir nova senha
        </h1>
        {error && (
          <div className="p-3 rounded-lg border text-sm" style={{ borderColor: 'var(--status-err)', color: 'var(--status-err)' }}>
            {error}
          </div>
        )}
        {done ? (
          <div className="space-y-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>Sua senha foi atualizada e todas as sessões anteriores foram encerradas.</p>
            <Link to="/entrar" className="vy-btn-primary inline-block px-4 py-2 text-sm font-medium">
              Ir para Login
            </Link>
          </div>
        ) : !token ? (
          <div className="space-y-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>Token de recuperação ausente na URL.</p>
            <Link to="/entrar" className="vy-btn-secondary inline-block px-4 py-2 text-sm">
              Voltar ao Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleConfirm} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Nova senha (mín. 6 caracteres)
              </span>
              <input
                type="password"
                minLength={6}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="vy-input w-full px-3 py-2 text-sm"
              />
            </label>
            <button type="submit" disabled={busy} className="vy-btn-primary w-full py-2.5 text-sm font-medium">
              {busy ? 'Salvando...' : 'Redefinir senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function NotFoundView() {
  const { user } = useApp();
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: 'var(--bg-canvas)' }}>
      <div className="vy-card p-8 max-w-md w-full text-center space-y-4">
        <div className="font-mono-num text-4xl font-bold" style={{ color: 'var(--accent)' }}>
          404
        </div>
        <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
          Rota não encontrada
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          O endereço solicitado não corresponde a nenhum módulo ou documento deste estúdio.
        </p>
        <div className="pt-2">
          <Link
            to={user ? '/visao-geral' : '/entrar'}
            className="vy-btn-primary inline-block px-4 py-2 text-sm font-medium"
          >
            {user ? 'Voltar para Visão Geral' : 'Ir para Login'}
          </Link>
        </div>
      </div>
    </div>
  );
}
