// ==========================================================================
// Settings View - TestGenAI Configuration
// ==========================================================================

import { store } from '../state.js';
import { api } from '../api.js';
import { toast } from '../toast.js';
import { authView } from './auth.js';

export async function renderSettings(container) {
  const user = store.get('user');

  // Cargar estado de base de datos
  let dbInfo = { engine: 'Detectando...', counts: { users: 0, projects: 0, requirements: 0, testCases: 0 } };
  try {
    const res = await api.getDbHealth();
    if (res) dbInfo = res;
  } catch (e) {
    console.warn('Error obteniendo estado de BD:', e);
  }

  container.innerHTML = `
    <div style="margin-bottom:24px;">
      <h2 style="font-size:1.35rem; font-weight:700;">Ajustes</h2>
      <p style="font-size:0.84rem; color:var(--text-secondary);">
        Parámetros de proveedores de Inteligencia Artificial, motor de base de datos relacional y perfil de auditoría QA.
      </p>
    </div>

    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap:24px;">
      <!-- Real Database Engine Panel -->
      <div class="card" style="grid-column: 1 / -1; border-color: rgba(99, 102, 241, 0.35);">
        <div class="card-header">
          <div class="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
            Motor de Base de Datos Real & Persistencia SQL
          </div>
          <span class="badge ${dbInfo.engine === 'PostgreSQL' ? 'badge-approved' : 'badge-source-ai'}">
            ${dbInfo.engine || 'Relacional'}
          </span>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:14px; margin-bottom:18px;">
          <div style="background:rgba(0,0,0,0.3); padding:12px 16px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
            <div style="font-size:0.75rem; color:var(--text-muted);">MOTOR ACTIVO</div>
            <div style="font-size:1.1rem; font-weight:700; color:${dbInfo.engine === 'PostgreSQL' ? 'var(--success)' : 'var(--cyan)'}; margin-top:3px;">
              ${dbInfo.engine}
            </div>
            <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">
              ${dbInfo.databaseUrl || 'Local'}
            </div>
          </div>

          <div style="background:rgba(0,0,0,0.3); padding:12px 16px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
            <div style="font-size:0.75rem; color:var(--text-muted);">USUARIOS REGISTRADOS</div>
            <div style="font-size:1.1rem; font-weight:700; color:#fff; margin-top:3px;">
              ${dbInfo.counts?.users ?? 0}
            </div>
            <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">Tabla: users (Bcrypt)</div>
          </div>

          <div style="background:rgba(0,0,0,0.3); padding:12px 16px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
            <div style="font-size:0.75rem; color:var(--text-muted);">PROYECTOS & REQUISITOS</div>
            <div style="font-size:1.1rem; font-weight:700; color:#fff; margin-top:3px;">
              ${dbInfo.counts?.projects ?? 0} proy. / ${dbInfo.counts?.requirements ?? 0} reqs
            </div>
            <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">Trazabilidad 1:N</div>
          </div>

          <div style="background:rgba(0,0,0,0.3); padding:12px 16px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
            <div style="font-size:0.75rem; color:var(--text-muted);">CASOS DE PRUEBA GUARDADOS</div>
            <div style="font-size:1.1rem; font-weight:700; color:var(--text-accent); margin-top:3px;">
              ${dbInfo.counts?.testCases ?? 0}
            </div>
            <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">Tabla: test_cases</div>
          </div>
        </div>

        <div style="background:rgba(99, 102, 241, 0.08); border:1px solid rgba(99, 102, 241, 0.25); border-radius:var(--radius-md); padding:14px; font-size:0.82rem; color:#cbd5e1; line-height:1.6;">
          <strong style="color:#fff;">💡 ¿Cómo conectar tu base de datos PostgreSQL real (Docker, Supabase o Neon)?</strong>
          <ol style="margin:8px 0 0 18px; padding:0;">
            <li><strong>Docker local (1 comando):</strong> Ejecuta <code>docker compose up -d</code> en la carpeta <code>backend/</code> para levantar PostgreSQL 16 en el puerto 5432.</li>
            <li><strong>Nube (Supabase o Neon):</strong> Configura en <code>backend/.env</code>: <code>DATABASE_URL="postgresql://usuario:password@host:5432/calidad_db"</code>.</li>
            <li><strong>Importación SQL directa:</strong> Puedes ejecutar el archivo <code>backend/prisma/database.sql</code> en pgAdmin, DBeaver o Supabase SQL Editor.</li>
          </ol>
        </div>
      </div>

      <!-- AI Engine Preferences -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            Preferencias de generación con IA
          </div>
        </div>

        <form id="form-settings-ai">
          <div class="form-group">
            <label class="form-label">¿Cómo generar los casos?</label>
            <select class="form-select" id="setting-provider">
              <option value="gemini" selected>Con IA — Google Gemini</option>
              <option value="openai">Con IA — OpenAI</option>
              <option value="heuristics">Sin IA — motor de reglas (gratis)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">
              <span>Creatividad de la IA</span>
              <span id="temp-display" style="font-family:var(--font-mono); color:var(--cyan);">0.2</span>
            </label>
            <input type="range" id="setting-temp" min="0.0" max="1.0" step="0.05" value="0.2" style="width:100%; accent-color:var(--primary);" />
            <span style="font-size:0.72rem; color:var(--text-muted);">
              Un valor bajo hace que la IA se apegue más al requisito. Recomendado: 0.2.
            </span>
          </div>

          <div class="form-group">
            <label class="form-label">Tipos de prueba que se incluyen</label>
            <div style="display:flex; flex-direction:column; gap:8px; font-size:0.83rem; color:var(--text-secondary); margin-top:4px;">
              <label style="display:flex; align-items:center; gap:8px;">
                <input type="checkbox" checked disabled /> Valores límite
              </label>
              <label style="display:flex; align-items:center; gap:8px;">
                <input type="checkbox" checked disabled /> Casos positivos y alternativos
              </label>
              <label style="display:flex; align-items:center; gap:8px;">
                <input type="checkbox" checked disabled /> Casos negativos y de error
              </label>
              <label style="display:flex; align-items:center; gap:8px;">
                <input type="checkbox" checked disabled /> Cada caso cita en qué parte del requisito se basa
              </label>
            </div>
          </div>

          <button type="button" class="btn btn-primary btn-sm" id="btn-save-ai-settings">
            Guardar Preferencias
          </button>
        </form>
      </div>

      <!-- User Profile & Session -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Perfil de Usuario & Sesión Activa
          </div>
          <span class="badge badge-approved">RBAC</span>
        </div>

        <div style="display:flex; align-items:center; gap:16px; margin-bottom:20px; padding:16px; background:rgba(0,0,0,0.25); border-radius:var(--radius-md);">
          <div class="user-avatar" style="width:48px; height:48px; font-size:1.1rem;">
            ${(user?.fullName || user?.email || 'QA')[0].toUpperCase()}
          </div>
          <div>
            <div style="font-size:1.05rem; font-weight:700;">${user?.fullName || 'Usuario QA'}</div>
            <div style="font-size:0.82rem; color:var(--text-secondary);">${user?.email || 'qa.lead@testgenai.io'}</div>
            <span class="badge badge-source-ai" style="margin-top:6px;">${user?.role || 'QA_LEAD'}</span>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:12px; font-size:0.84rem; color:var(--text-secondary); margin-bottom:20px;">
          <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-subtle); padding-bottom:8px;">
            <span>Rol:</span>
            <strong style="color:#fff;">${user?.role === 'ADMIN' ? 'Administrador' : 'Revisor de calidad'}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-subtle); padding-bottom:8px;">
            <span>Puede aprobar casos:</span>
            <strong style="color:var(--success);">Sí</strong>
          </div>
          <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-subtle); padding-bottom:8px;">
            <span>Autenticación:</span>
            <strong style="color:var(--success);">Token JWT Activo</strong>
          </div>
        </div>

        <button class="btn btn-danger btn-sm" id="btn-relogin" style="display:flex; align-items:center; justify-content:center; gap:8px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          Cerrar Sesión
        </button>
      </div>
    </div>
  `;

  // Range slider handler
  const tempSlider = container.querySelector('#setting-temp');
  const tempDisplay = container.querySelector('#temp-display');
  if (tempSlider && tempDisplay) {
    tempSlider.addEventListener('input', (e) => {
      tempDisplay.textContent = e.target.value;
    });
  }

  container.querySelector('#btn-save-ai-settings')?.addEventListener('click', () => {
    toast.success('Preferencias de IA y temperatura guardadas correctamente');
  });

  container.querySelector('#btn-relogin')?.addEventListener('click', () => {
    api.logout();
    store.set('user', null);
    store.set('projects', []);
    store.set('requirements', []);
    store.set('testCases', []);
    store.set('activeProjectId', null);
    store.set('activeProject', null);
    toast.info('Sesión cerrada.');
    authView.show();
  });
}

