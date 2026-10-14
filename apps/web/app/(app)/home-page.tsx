'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createProject } from './actions';
import { QualityRing } from '@/components/ui/quality-ring';

interface Project {
  id: string;
  name: string;
  updatedAt: string;
  version: number;
  summary: { reqs: number; findings: number; cases: number; score: number; verifPct: number };
}

interface Props {
  userName: string;
  projects: Project[];
}

export function HomePage({ userName, projects }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Hola, {userName}
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="h-[42px] rounded-[var(--radius-md)] bg-accent px-5 text-on-accent font-semibold text-sm transition-opacity hover:opacity-90"
        >
          Nuevo proyecto
        </button>
      </div>

      {showForm && (
        <form action={createProject as unknown as (formData: FormData) => void} className="mb-6 flex items-center gap-3 rounded-[var(--radius-lg)] border border-line bg-s1 p-4">
          <input
            name="name"
            placeholder="Nombre del proyecto"
            autoFocus
            required
            className="h-[42px] flex-1 rounded-[var(--radius-md)] border border-line-strong bg-s1 px-4 text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button type="submit" className="h-[42px] rounded-[var(--radius-md)] bg-accent px-5 text-on-accent font-semibold text-sm">Crear</button>
          <button type="button" onClick={() => setShowForm(false)} className="h-[42px] rounded-[var(--radius-md)] border border-line-strong px-5 text-ink text-sm">Cancelar</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="rounded-[var(--radius-lg)] bg-accent p-6 text-on-accent">
          <h2 className="font-display text-lg font-bold">Revisor de requisitos</h2>
          <p className="mt-1 text-sm opacity-80">Analiza la calidad contra 15 reglas trazadas al curso</p>
        </div>
        <div className="rounded-[var(--radius-lg)] bg-nav p-6 text-nav-ink">
          <h2 className="font-display text-lg font-bold">Generador de casos de prueba</h2>
          <p className="mt-1 text-sm text-nav-muted">Valores limite, particion, umbrales y condiciones</p>
        </div>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-line bg-s1 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold">Proyectos</h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre"
            className="h-[34px] w-60 rounded-[var(--radius-md)] border border-line-strong bg-s1 px-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-ink-muted text-sm py-8 text-center">
            {projects.length === 0 ? 'Crea tu primer proyecto para empezar.' : 'No se encontraron proyectos.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((p) => (
              <Link
                key={p.id}
                href={`/p/${p.id}/revisar`}
                className="group rounded-[var(--radius-md)] border border-line p-4 transition-colors hover:bg-s2 no-underline"
              >
                <div className="flex items-center gap-3 mb-3">
                  <QualityRing score={p.summary.score} size={36} />
                  <div>
                    <p className="font-semibold text-ink group-hover:text-accent truncate">{p.name}</p>
                    <p className="text-xs text-ink-muted">v{p.version} · {formatDate(p.updatedAt)}</p>
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-ink-muted">
                  <span>{p.summary.reqs} req.</span>
                  <span>{p.summary.findings} sosp.</span>
                  <span>{p.summary.cases} casos</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  } catch {
    return '';
  }
}
