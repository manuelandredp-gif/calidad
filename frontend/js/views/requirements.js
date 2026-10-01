// ==========================================================================
// Requirements View - TestGenAI (MVP Real)
// Requisitos funcionales versionados con detector de ambigüedad y llamada a IA real
// ==========================================================================

import { store } from '../state.js';
import { modals } from '../modals.js';
import { api } from '../api.js';
import { toast } from '../toast.js';

export function renderRequirements(container) {
  const project = store.get('activeProject');
  const requirements = store.get('requirements') || [];
  const activeReqId = store.get('activeRequirementId');

  if (!project) {
    container.innerHTML = `
      <div class="card" style="text-align:center; padding:50px 20px;">
        <p style="color:var(--text-muted);">Seleccione o cree un proyecto activo para gestionar requisitos.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:16px;">
      <div>
        <h2 style="font-size:1.35rem; font-weight:700;">Requisitos Funcionales</h2>
        <p style="font-size:0.85rem; color:var(--text-secondary);">
          Proyecto: <strong>${escapeHtml(project.name)}</strong> (${requirements.length} requisitos registrados)
        </p>
      </div>

      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn btn-secondary" id="btn-import-reqs">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Importar CSV / JSON
        </button>
        <button class="btn btn-primary" id="btn-new-req">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Nuevo Requisito
        </button>
      </div>
    </div>

    <!-- Layout de 2 columnas: Lista e Inspección -->
    <div style="display:grid; grid-template-columns: 360px 1fr; gap:24px; align-items:start;">
      <!-- Columna 1: Listado de Requisitos -->
      <div class="card" style="padding:16px;">
        <div style="font-size:0.82rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:12px; display:flex; justify-content:space-between;">
          <span>Listado</span>
          <span>${requirements.length}</span>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px; max-height:calc(100vh - 280px); overflow-y:auto;">
          ${
            requirements.length > 0
              ? requirements
                  .map((r) => {
                    const isSelected = r.id === activeReqId || (!activeReqId && r === requirements[0]);
                    const caseCount = r._count?.testCases ?? 0;
                    return `
                    <div class="req-item-card" data-req-id="${r.id}" style="
                      padding:12px 14px;
                      border-radius:var(--radius-md);
                      background:${isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)'};
                      border:1px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'};
                      cursor:pointer;
                      transition:all var(--transition-fast);
                    ">
                      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
                        <span class="test-case-code">${escapeHtml(r.code)}</span>
                        <span class="badge ${caseCount > 0 ? 'badge-approved' : 'badge-pending'}">${caseCount} casos</span>
                      </div>
                      <div style="font-size:0.88rem; font-weight:600; color:var(--text-primary); line-height:1.3; margin-bottom:4px;">
                        ${escapeHtml(r.title)}
                      </div>
                      <div style="font-size:0.75rem; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                        ${escapeHtml(r.description || 'Sin descripción')}
                      </div>
                    </div>
                  `;
                  })
                  .join('')
              : `<div style="text-align:center; padding:30px 10px; color:var(--text-muted); font-size:0.85rem;">No hay requisitos registrados.</div>`
          }
        </div>
      </div>

      <!-- Columna 2: Detalle del Requisito Seleccionado -->
      <div id="req-detail-container">
        ${renderSelectedRequirement(requirements.find((r) => r.id === activeReqId) || requirements[0])}
      </div>
    </div>
  `;

  // Attach handlers
  container.querySelector('#btn-new-req')?.addEventListener('click', () => {
    modals.open('modal-new-requirement');
  });

  container.querySelector('#btn-import-reqs')?.addEventListener('click', () => {
    modals.open('modal-import-requirements');
  });

  container.querySelectorAll('.req-item-card').forEach((item) => {
    item.addEventListener('click', async () => {
      const reqId = item.getAttribute('data-req-id');
      const req = requirements.find((r) => r.id === reqId);
      if (req) {
        store.set('activeRequirementId', reqId);
        store.set('activeRequirement', req);
        renderRequirements(container);
      }
    });
  });

  setupRequirementDetailEvents(container);
}

function detectAmbiguity(text) {
  if (!text) return [];
  const vagueTerms = [
    'rápido',
    'fácil',
    'óptimo',
    'amigable',
    'eficiente',
    'inmediato',
    'aproximadamente',
    'en tiempo real',
    'robusto',
    'intuitivo',
  ];
  const detected = [];
  const lower = text.toLowerCase();
  for (const term of vagueTerms) {
    if (lower.includes(term)) {
      detected.push(term);
    }
  }
  return detected;
}

function renderSelectedRequirement(req) {
  if (!req) {
    return `
      <div class="card" style="text-align:center; padding:50px 20px;">
        <p style="color:var(--text-muted);">Selecciona un requisito de la lista o crea uno nuevo.</p>
      </div>
    `;
  }

  // Detector básico de ambigüedad (RF-13)
  const fullText = `${req.title} ${req.description || ''} ${req.acceptanceCriteria || ''}`;
  const ambiguityWarnings = detectAmbiguity(fullText);

  let formattedCriteria = escapeHtml(req.acceptanceCriteria || 'No se definieron criterios de aceptación.');
  formattedCriteria = formattedCriteria
    .replace(/(Dado que|Given)/gi, '<span class="bdd-keyword">$1</span>')
    .replace(/(Cuando|When)/gi, '<span class="bdd-keyword">$1</span>')
    .replace(/(Entonces|Then)/gi, '<span class="bdd-keyword">$1</span>')
    .replace(/(Y |And )/gi, '<span class="bdd-keyword">$1</span>')
    .replace(/(Escenario:|Scenario:)/gi, '<span class="bdd-scenario">$1</span>');

  const ambiguityBox =
    ambiguityWarnings.length > 0
      ? `
      <div style="background:rgba(245, 158, 11, 0.1); border:1px solid rgba(245, 158, 11, 0.35); border-radius:var(--radius-md); padding:10px 14px; margin-bottom:18px; font-size:0.82rem; color:#fbbf24;">
        <strong>⚠️ Advertencia de Ambigüedad (RF-13):</strong> Se detectaron términos imprecisos o no cuantificados en el texto: 
        <em>${ambiguityWarnings.map((w) => `"${w}"`).join(', ')}</em>. 
        Se recomienda especificar valores medibles (ej. "menos de 2 segundos" en vez de "rápido") para una mejor derivación de pruebas.
      </div>
    `
      : '';

  return `
    <div class="card" style="border-top:3px solid var(--primary);">
      <!-- Header -->
      <div class="card-header" style="flex-wrap:wrap; gap:12px; margin-bottom:16px;">
        <div>
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
            <span class="test-case-code" style="font-size:1rem; padding:4px 12px;">${escapeHtml(req.code)}</span>
            <span class="badge badge-derived">Versión v${req.version || 1}</span>
            <span class="badge ${req.status === 'GENERATED' ? 'badge-approved' : 'badge-pending'}">${req.status || 'DRAFT'}</span>
          </div>
          <h3 style="font-size:1.25rem; font-weight:700;">${escapeHtml(req.title)}</h3>
        </div>

        <!-- Action Buttons -->
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn btn-sm btn-outline btn-edit-req" data-req-id="${req.id}" title="Editar Requisito">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            Editar
          </button>
          <button class="btn btn-primary btn-launch-ai" data-req-id="${req.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            Generar Casos con IA
          </button>
        </div>
      </div>

      ${ambiguityBox}

      <!-- Description -->
      <div style="margin-bottom:20px;">
        <h4 style="font-size:0.76rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:6px;">
          Descripción / Historia de Usuario
        </h4>
        <p style="font-size:0.88rem; color:var(--text-secondary); line-height:1.6; background:rgba(0,0,0,0.15); padding:12px 14px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
          ${escapeHtml(req.description || 'Sin descripción detallada.')}
        </p>
      </div>

      <!-- Acceptance Criteria (BDD Box) -->
      <div style="margin-bottom:24px;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
          <h4 style="font-size:0.76rem; font-weight:700; text-transform:uppercase; color:var(--text-muted);">
            Criterios de Aceptación
          </h4>
        </div>
        <div class="bdd-box">${formattedCriteria}</div>
      </div>

      <!-- AI Invocations History -->
      <div style="margin-bottom:20px;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
          <h4 style="font-size:0.76rem; font-weight:700; text-transform:uppercase; color:var(--text-muted);">
            Historial de Ejecuciones IA
          </h4>
        </div>
        <div id="ai-history-box-${req.id}" style="font-size:0.82rem; color:var(--text-secondary); background:rgba(0,0,0,0.2); padding:12px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
          <span class="spinner-inline"></span> Cargando historial...
        </div>
      </div>

      <!-- Link to Test Cases -->
      <div style="display:flex; align-items:center; justify-content:space-between; padding-top:16px; border-top:1px solid var(--border-subtle);">
        <span style="font-size:0.84rem; color:var(--text-secondary);">
          Revisar los casos generados para este requisito
        </span>
        <button class="btn btn-outline btn-sm btn-go-testcases" data-req-id="${req.id}">
          Ver Casos de Prueba &rarr;
        </button>
      </div>
    </div>
  `;
}

function setupRequirementDetailEvents(container) {
  const activeReq = store.get('activeRequirement') || (store.get('requirements') || [])[0];
  if (activeReq) {
    const historyBox = container.querySelector(`#ai-history-box-${activeReq.id}`);
    if (historyBox) {
      api
        .getAiHistory(activeReq.id)
        .then((res) => {
          const history = res.data || [];
          if (history.length === 0) {
            historyBox.innerHTML = `
              <div style="color:var(--text-muted); font-size:0.8rem;">
                Sin ejecuciones de IA registradas para este requisito.
              </div>
            `;
            return;
          }
          historyBox.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${history
                .slice(0, 5)
                .map(
                  (h) => `
                <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 10px; background:rgba(255,255,255,0.02); border-radius:var(--radius-sm); font-size:0.78rem; flex-wrap:wrap; gap:6px;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span class="badge badge-source-ai">${escapeHtml(h.provider)} / ${escapeHtml(h.model)}</span>
                    <span style="color:${h.status === 'SUCCEEDED' ? 'var(--success)' : 'var(--error)'}; font-weight:600;">${h.status}</span>
                  </div>
                  <div style="display:flex; align-items:center; gap:12px; font-family:var(--font-mono); font-size:0.74rem;">
                    <span style="color:var(--cyan);">${h.totalTokens ?? 'N/D'} tokens</span>
                    <span style="color:var(--warning);">${h.latencyMs ? `${h.latencyMs}ms` : 'N/D'}</span>
                    <span style="color:var(--success);">${h.costUsd !== null && h.costUsd !== undefined ? `$${Number(h.costUsd).toFixed(5)}` : 'Costo N/D'}</span>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          `;
        })
        .catch(() => {
          historyBox.innerHTML = `<span style="color:var(--text-muted); font-size:0.8rem;">Sin historial disponible</span>`;
        });
    }
  }

  container.querySelectorAll('.btn-edit-req').forEach((btn) => {
    btn.addEventListener('click', () => {
      const reqId = btn.getAttribute('data-req-id');
      const reqs = store.get('requirements') || [];
      const req = reqs.find((r) => r.id === reqId);
      if (req) {
        modals.populateEditRequirement(req);
      }
    });
  });

  container.querySelectorAll('.btn-launch-ai').forEach((btn) => {
    btn.addEventListener('click', () => {
      const reqId = btn.getAttribute('data-req-id');
      const reqs = store.get('requirements') || [];
      const req = reqs.find((r) => r.id === reqId);
      if (req) {
        modals.openAiGenModal(req);
      }
    });
  });

  container.querySelectorAll('.btn-go-testcases').forEach((btn) => {
    btn.addEventListener('click', () => {
      const reqId = btn.getAttribute('data-req-id');
      const reqs = store.get('requirements') || [];
      const req = reqs.find((r) => r.id === reqId);
      if (req) {
        store.set('activeRequirementId', reqId);
        store.set('activeRequirement', req);
      }
      document.querySelector('[data-view="test-cases"]')?.click();
    });
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
