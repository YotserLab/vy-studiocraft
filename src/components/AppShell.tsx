import React, { useState } from 'react';
import {
  Activity,
  BookOpen,
  Compass,
  FileText,
  FolderOpen,
  GitCompare,
  GraduationCap,
  HelpCircle,
  Kanban,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Newspaper,
  Radar,
  Search,
  Settings,
  Shield,
  Sparkles,
  StickyNote,
  Tv,
  Users,
  Video,
  X,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Link, navigate, useLocationPath } from '../lib/router';
import { AssistantDrawer } from './AssistantDrawer';

interface NavGroup {
  label: string;
  items: Array<{
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    adminOnly?: boolean;
  }>;
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Operação',
    items: [
      { to: '/visao-geral', label: 'Visão Geral', icon: LayoutDashboard },
      { to: '/projetos', label: 'Projetos', icon: Kanban },
      { to: '/roteirista', label: 'Roteirista IA', icon: Sparkles },
      { to: '/comparar-30s', label: 'Comparar 30s', icon: GitCompare },
      { to: '/playbook', label: 'Playbook', icon: BookOpen },
    ],
  },
  {
    label: 'Inteligência',
    items: [
      { to: '/radar', label: 'Radar', icon: Radar },
      { to: '/explorar', label: 'Explorar', icon: Compass },
      { to: '/pesquisa', label: 'Pesquisa', icon: Search },
      { to: '/canais', label: 'Canais Ref.', icon: Users },
      { to: '/noticias', label: 'Notícias', icon: Newspaper },
    ],
  },
  {
    label: 'Ativos',
    items: [
      { to: '/meus-canais', label: 'Meus Canais', icon: Tv },
      { to: '/videos-salvos', label: 'Vídeos Salvos', icon: Video },
      { to: '/biblioteca', label: 'Biblioteca', icon: FolderOpen },
      { to: '/notas', label: 'Notas', icon: StickyNote },
      { to: '/aulas', label: 'Aulas', icon: GraduationCap },
      { to: '/publicidade', label: 'Publicidade', icon: Megaphone },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { to: '/configuracoes', label: 'Configurações', icon: Settings },
      { to: '/ajuda', label: 'Ajuda', icon: HelpCircle },
      { to: '/admin', label: 'Admin', icon: Shield, adminOnly: true },
    ],
  },
];

export interface AppShellProps {
  title: string;
  breadcrumb?: string;
  primaryAction?: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ title, breadcrumb, primaryAction, children }: AppShellProps) {
  const { user, logout, notify } = useApp();
  const { pathname } = useLocationPath();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState('');

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = quickQuery.trim();
    navigate(q ? `/pesquisa?q=${encodeURIComponent(q)}` : '/pesquisa');
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    notify('Sessão encerrada.', 'info');
    navigate('/entrar');
  };

  const isActive = (to: string) => {
    if (pathname === to) return true;
    if (to !== '/' && pathname.startsWith(`${to}/`)) return true;
    return false;
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div
        className="h-14 px-5 flex items-center justify-between border-b shrink-0"
        style={{ borderColor: 'var(--border-hairline)' }}
      >
        <Link
          to="/visao-geral"
          onClick={() => setMobileOpen(false)}
          className="font-display font-bold text-base tracking-tight whitespace-nowrap shrink-0 flex items-center gap-2"
          style={{ color: 'var(--text-primary)' }}
        >
          <Activity className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
          <span>VYStudioCraft</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-md"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Fechar menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5" aria-label="Navegação principal">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((i) => !i.adminOnly || user?.isAdmin);
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label}>
              <div
                className="px-3 mb-1.5 text-xs font-medium tracking-wide"
                style={{ color: 'var(--text-muted)' }}
              >
                {group.label}
              </div>
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
                        style={{
                          backgroundColor: active ? 'var(--accent-soft)' : 'transparent',
                          color: active ? 'var(--accent)' : 'var(--text-secondary)',
                        }}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {user && (
        <div
          className="p-3 border-t shrink-0"
          style={{ borderColor: 'var(--border-hairline)' }}
        >
          <div className="px-2 py-1.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {user.displayName}
              </div>
              <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {user.isAdmin ? 'Administrador' : 'Criador'} · {user.email}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-md shrink-0 transition-colors hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
              title="Sair"
              aria-label="Sair da conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-canvas)' }}>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:block w-64 shrink-0 border-r sticky top-0 h-screen"
        style={{
          backgroundColor: 'var(--bg-sidebar)',
          borderColor: 'var(--border-hairline)',
        }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="relative w-64 max-w-[85vw] h-full border-r z-10"
            style={{
              backgroundColor: 'var(--bg-sidebar)',
              borderColor: 'var(--border-hairline)',
            }}
          >
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header
          className="h-14 px-4 lg:px-6 border-b flex items-center justify-between gap-4 sticky top-0 z-30"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 rounded-md"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex items-center gap-2 text-sm">
              {breadcrumb && (
                <>
                  <span className="hidden sm:inline truncate" style={{ color: 'var(--text-muted)' }}>
                    {breadcrumb}
                  </span>
                  <span className="hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
                    /
                  </span>
                </>
              )}
              <h1 className="font-display font-semibold text-base truncate" style={{ color: 'var(--text-primary)' }}>
                {title}
              </h1>
            </div>
          </div>

          <form onSubmit={handleQuickSearch} className="hidden md:flex items-center flex-1 max-w-sm">
            <div className="relative w-full">
              <Search
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="search"
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                placeholder="Buscar projetos, notas, canais..."
                className="vy-input w-full pl-9 pr-3 py-1.5 text-sm"
              />
            </div>
          </form>

          <div className="flex items-center gap-2 shrink-0">
            {primaryAction || (
              <Link
                to="/roteirista"
                className="vy-btn-primary px-3.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Novo Roteiro</span>
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 max-w-[1440px] w-full mx-auto">{children}</main>
      </div>
      <AssistantDrawer />
    </div>
  );
}
