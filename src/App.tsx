import React, { Suspense, lazy, useEffect } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { navigate, useLocationPath, validateReturnTo } from './lib/router';
import { CANAIS_ROUTE } from './lib/canaisLogic';
import { IDEIAS_ROUTE } from './lib/ideiasLogic';
import {
  LandingView,
  LoginView,
  NotFoundView,
  ResetPasswordView,
  SignupView,
} from './views/AuthViews';
import { OverviewView } from './views/OverviewView';
import { RadarListView, RadarProfileDetailView } from './views/RadarViews';
import { ProjectDetailView, ProjectsKanbanView } from './views/ProjectsViews';
import { Compare30sView, ScriptwriterView } from './views/AiStudioViews';
import {
  ChannelDetailView,
  ChannelsListView,
  ExploreView,
  GlobalSearchView,
} from './views/ChannelsViews';
import {
  AdvertisingView,
  LessonsView,
  LibraryView,
  NotesView,
  PlaybookView,
  SavedVideosView,
} from './views/MediaAndContentViews';
import {
  AdminView,
  HelpView,
  NewsView,
  SettingsView,
} from './views/NewsAndSystemViews';

// Feature remotion-templates carregada sob demanda (bundle pesado: Player + registry)
const TemplatesGalleryView = lazy(() =>
  import('./views/TemplatesViews').then((m) => ({ default: m.TemplatesGalleryView }))
);
const TemplateDetailView = lazy(() =>
  import('./views/TemplatesViews').then((m) => ({ default: m.TemplateDetailView }))
);
const TemplatesAiStudioView = lazy(() =>
  import('./views/TemplatesViews').then((m) => ({ default: m.TemplatesAiStudioView }))
);
const TemplatesMotionLibraryView = lazy(() =>
  import('./views/TemplatesViews').then((m) => ({ default: m.TemplatesMotionLibraryView }))
);

// NAV-R01: rota privada redireciona para /entrar?returnTo=
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useApp();
  const { pathname, search } = useLocationPath();

  useEffect(() => {
    if (!authLoading && !user) {
      const target = validateReturnTo(`${pathname}${search}`);
      navigate(`/entrar?returnTo=${encodeURIComponent(target)}`, true);
    }
  }, [authLoading, user, pathname, search]);

  if (authLoading || !user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-sm"
        style={{ backgroundColor: 'var(--bg-canvas)', color: 'var(--text-secondary)' }}
      >
        Verificando sessão...
      </div>
    );
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { pathname } = useLocationPath();
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

  // Public routes
  if (clean === '/') return <LandingView />;
  if (clean === '/entrar') return <LoginView />;
  if (clean === '/cadastro') return <SignupView />;
  if (clean === '/recuperar-senha') return <ResetPasswordView />;

  // NAV-R05: galeria de templates Remotion pública (SEO-friendly via pré-render)
  if (clean === '/templates') {
    return <Suspense fallback={null}><TemplatesGalleryView /></Suspense>;
  }
  if (clean === '/templates/ai-studio') {
    return <Suspense fallback={null}><TemplatesAiStudioView /></Suspense>;
  }
  if (clean === '/templates/motion-library') {
    return <Suspense fallback={null}><TemplatesMotionLibraryView /></Suspense>;
  }
  if (clean.startsWith('/templates/')) {
    const id = decodeURIComponent(clean.slice('/templates/'.length));
    if (id) return <Suspense fallback={null}><TemplateDetailView id={id} /></Suspense>;
  }

  // Private exact routes
  if (clean === '/visao-geral') return <PrivateRoute><OverviewView /></PrivateRoute>;
  if (clean === '/radar') return <PrivateRoute><RadarListView /></PrivateRoute>;
  if (clean === '/projetos') return <PrivateRoute><ProjectsKanbanView /></PrivateRoute>;
  if (clean === '/videos-salvos') return <PrivateRoute><SavedVideosView /></PrivateRoute>;
  if (clean === '/aulas') return <PrivateRoute><LessonsView /></PrivateRoute>;
  if (clean === '/meus-canais') return <PrivateRoute><ChannelsListView mode="proprios" /></PrivateRoute>;
  if (clean === CANAIS_ROUTE) return <PrivateRoute><ChannelsListView mode="todos" /></PrivateRoute>;
  if (clean === IDEIAS_ROUTE) return <PrivateRoute><ExploreView /></PrivateRoute>;
  if (clean === '/pesquisa') return <PrivateRoute><GlobalSearchView /></PrivateRoute>;
  if (clean === '/biblioteca') return <PrivateRoute><LibraryView /></PrivateRoute>;
  if (clean === '/notas') return <PrivateRoute><NotesView /></PrivateRoute>;
  if (clean === '/roteirista') return <PrivateRoute><ScriptwriterView /></PrivateRoute>;
  if (clean === '/playbook') return <PrivateRoute><PlaybookView /></PrivateRoute>;
  if (clean === '/comparar-30s') return <PrivateRoute><Compare30sView /></PrivateRoute>;
  if (clean === '/noticias') return <PrivateRoute><NewsView /></PrivateRoute>;
  if (clean === '/publicidade') return <PrivateRoute><AdvertisingView /></PrivateRoute>;
  if (clean === '/configuracoes') return <PrivateRoute><SettingsView /></PrivateRoute>;
  if (clean === '/ajuda') return <PrivateRoute><HelpView /></PrivateRoute>;
  if (clean === '/admin') return <PrivateRoute><AdminView /></PrivateRoute>;

  // Private prefix routes
  if (clean.startsWith('/projetos/')) {
    const id = decodeURIComponent(clean.slice('/projetos/'.length));
    if (id) return <PrivateRoute><ProjectDetailView id={id} /></PrivateRoute>;
  }
  if (clean.startsWith(`${CANAIS_ROUTE}/`)) {
    const id = decodeURIComponent(clean.slice(CANAIS_ROUTE.length + 1));
    if (id) return <PrivateRoute><ChannelDetailView id={id} /></PrivateRoute>;
  }
  if (clean.startsWith('/radar/perfis/')) {
    const id = decodeURIComponent(clean.slice('/radar/perfis/'.length));
    if (id) return <PrivateRoute><RadarProfileDetailView id={id} /></PrivateRoute>;
  }
  // NAV-R08: /admin/{tab} sincroniza a tab do painel com a URL
  if (clean.startsWith('/admin/')) {
    const sub = clean.slice('/admin/'.length);
    return <PrivateRoute><AdminView subPath={sub} /></PrivateRoute>;
  }

  // NAV-R06: rota desconhecida -> NotFoundView
  return <NotFoundView />;
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}
