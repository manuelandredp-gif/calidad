'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ENGINE_VERSION } from '@qualireq/engine';
import { ThemeToggle } from './theme-toggle';

interface Props {
  projectId?: string;
  projectName?: string;
  findingsCount?: number;
  casesCount?: number;
  activeRules?: number;
  userName?: string;
  onSignOut?: () => void;
}

export function Sidebar({ projectId, projectName, findingsCount = 0, casesCount = 0, activeRules = 15, userName, onSignOut }: Props) {
  const pathname = usePathname();

  const navItem = (href: string, label: string, badge?: number | string) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={`flex items-center justify-between gap-2 rounded-[var(--radius-md)] px-3 py-2 text-[15px] transition-colors ${active ? 'bg-nav-2 text-lime font-semibold' : 'text-nav-ink hover:bg-nav-2/50'}`}
      >
        <span>{label}</span>
        {badge !== undefined && (
          <span className={`rounded-[var(--radius-pill)] px-2 py-0.5 text-xs font-medium ${active ? 'bg-lime/20 text-lime' : 'bg-nav-2 text-nav-muted'}`}>
            {badge}
          </span>
        )}
      </Link>
    );
  };

  const initials = userName
    ? userName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  return (
    <aside className="flex h-screen w-[260px] shrink-0 flex-col bg-nav text-nav-ink">
      <div className="px-5 pt-6 pb-4">
        <Link href="/" className="text-2xl font-bold font-display tracking-tight text-nav-ink no-underline">
          Quali<span className="text-lime">Req</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-1">
        {navItem('/', 'Inicio')}

        {projectId && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-xs font-medium text-nav-muted uppercase tracking-wider">
                Modulos · {projectName ?? 'Proyecto'}
              </p>
            </div>
            {navItem(`/p/${projectId}/revisar`, 'Revisor de requisitos', findingsCount > 0 ? findingsCount : undefined)}
            {navItem(`/p/${projectId}/generar`, 'Generador de casos', casesCount > 0 ? casesCount : undefined)}
            {navItem(`/p/${projectId}/exportar`, 'Exportar')}

            <div className="pt-4 pb-1 px-3">
              <p className="text-xs font-medium text-nav-muted uppercase tracking-wider">Proyecto</p>
            </div>
            {navItem(`/p/${projectId}/versiones`, 'Versiones')}
            {navItem(`/p/${projectId}/reglas`, 'Reglas y diccionario', `${activeRules}/15`)}
          </>
        )}
      </nav>

      <div className="mx-3 mb-3 rounded-[var(--radius-md)] bg-nav-2 p-3">
        <p className="text-xs text-nav-muted">
          Motor v{ENGINE_VERSION} · Determinista. Analiza en tu navegador
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-nav-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-nav-2 text-xs font-semibold text-nav-ink">
            {initials}
          </span>
          <span className="text-sm text-nav-ink truncate max-w-[120px]">{userName ?? 'Usuario'}</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="rounded-[var(--radius-md)] p-1.5 text-nav-muted hover:text-nav-ink hover:bg-nav-2 transition-colors"
              title="Cerrar sesion"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
