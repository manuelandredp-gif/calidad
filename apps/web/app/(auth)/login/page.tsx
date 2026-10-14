'use client';

import { useActionState, useState } from 'react';
import { signIn, type LoginState } from './actions';

const initial: LoginState = {};

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, initial);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center bg-nav p-12 text-nav-ink">
        <h1 className="font-display text-4xl font-bold tracking-tight leading-tight max-w-md">
          El defecto mas barato es el que detectas antes de codificar.
        </h1>
        <div className="mt-8 space-y-3">
          {[
            { id: 'AMB-01', label: 'Termino subjetivo sin criterio medible', sev: 'Alta' },
            { id: 'VER-02', label: 'Cuantificador vago', sev: 'Media' },
            { id: 'COM-03', label: 'No define que pasa si se viola la restriccion', sev: 'Media' },
          ].map((ex) => (
            <div key={ex.id} className="rounded-[var(--radius-md)] bg-nav-2 px-4 py-3">
              <span className="font-mono text-xs text-nav-muted">{ex.id}</span>
              <p className="text-sm text-nav-ink mt-0.5">{ex.label}</p>
              <span className="text-xs text-nav-muted">Severidad: {ex.sev}</span>
            </div>
          ))}
        </div>
        <div className="mt-10 flex items-center gap-6 text-sm text-nav-muted">
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-lime" /> Revisar</span>
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-accent" /> Generar casos</span>
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-nav-muted" /> Exportar</span>
        </div>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h2 className="font-display text-2xl font-bold tracking-tight mb-8">Inicia sesion</h2>

          <form action={action} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">Correo</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="h-[52px] w-full rounded-[var(--radius-md)] border border-line-strong bg-s1 px-4 text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                placeholder="correo@ejemplo.com"
              />
              {state.error?.email?.map((e) => <p key={e} className="mt-1 text-sm text-sev-alta">{e}</p>)}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5">Contrasena</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="h-[52px] w-full rounded-[var(--radius-md)] border border-line-strong bg-s1 px-4 pr-12 text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                  placeholder="Minimo 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink text-sm"
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              {state.error?.password?.map((e) => <p key={e} className="mt-1 text-sm text-sev-alta">{e}</p>)}
            </div>

            {state.error?.form?.map((e) => (
              <p key={e} className="rounded-[var(--radius-md)] bg-sev-alta-soft px-4 py-3 text-sm text-sev-alta">{e}</p>
            ))}

            <button
              type="submit"
              disabled={pending}
              className="h-[52px] w-full rounded-[var(--radius-md)] bg-accent text-on-accent font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {pending ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
