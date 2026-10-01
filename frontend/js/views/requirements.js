// ==========================================================================
// Requirements View - TestGenAI
// ==========================================================================

import { store } from '../state.js';
import { modals } from '../modals.js';
import { api } from '../api.js';
import { toast } from '../toast.js';
import { eventBus } from '../event-bus.js';

export function renderRequirements(container) {
  const project = store.get('activeProject');
  const requirements = store.get('requirements') || [];
  const activeReqId = store.get('activeRequirementId');

  container.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:16px;">
      <div>
        <h2 style="font-size:1.35rem; font-weight:700;">Requisitos</h2>
        <p style="font-size:0.85rem; color:var(--text-secondary);">
          Proyecto actual: <strong>${project?.name || 'Ninguno seleccionado'}</strong> (${requirements.length} requisitos)
        </p>
      </div>

      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn btn-outline" id="btn-open-split-from-reqs" title="Abrir Modo Pantalla Dividida Resizable">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"></rect><line x1="12" y1="3" x2="12" y2="17"></line></svg>
          Modo Split-Screen
        </button>
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

    <!-- Requirements Workspace Layout (2 columns: List & Detailed Inspection) -->
    <div style="display:grid; grid-template-columns: 360px 1fr; gap:24px; align-items:start;">
      <!-- Column 1: Requirements Selector List -->
      <div class="card" style="padding:16px;">
        <div style="font-size:0.82rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:12px; display:flex; justify-content:space-between;">
          <span>Listado de Requisitos</span>
          <span>${requirements.length}</span>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px; max-height:calc(100vh - 280px); overflow-y:auto;">
          ${
            requirements.length > 0
              ? requirements
                  .map((r) => {
                    const isSelected = r.id === activeReqId;
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
                        <span class="test-case-code">${r.code}</span>
                        <span class="badge ${caseCount > 0 ? 'badge-approved' : 'badge-pending'}">${caseCount} casos</span>
                      </div>
                      <div style="font-size:0.88rem; font-weight:600; color:var(--text-primary); line-height:1.3; margin-bottom:4px;">
                        ${r.title}
                      </div>
                      <div style="font-size:0.75rem; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                        ${r.description || 'Sin descripción'}
                      </div>
                    </div>
                  `;
                  })
                  .join('')
              : `<div style="text-align:center; padding:30px 10px; color:var(--text-muted); font-size:0.85rem;">No hay requisitos aún.</div>`
          }
        </div>
      </div>

      <!-- Column 2: Selected Requirement Detail & AI Generation Console -->
      <div id="req-detail-container">
        ${renderSelectedRequirement(requirements.find((r) => r.id === activeReqId) || requirements[0])}
      </div>
    </div>
  `;

  // Attach event handlers
  document.getElementById('btn-open-split-from-reqs')?.addEventListener('click', () => {
    eventBus.emit('view:switch', 'split-view');
  });

  document.getElementById('btn-new-req')?.addEventListener('click', () => {
    modals.open('modal-new-requirement');
  });

  document.getElementById('btn-import-reqs')?.addEventListener('click', () => {
    modals.open('modal-import-requirements');
  });

  container.querySelectorAll('.req-item-card').forEach((item) => {
    item.addEventListener('click', async () => {
      const reqId = item.getAttribute('data-req-id');
      const req = requirements.find((r) => r.id === reqId);
      if (req) {
        store.set('activeRequirementId', reqId);
        store.set('activeRequirement', req);

        // Fetch test cases for this req
        try {
          const tcRes = await api.getTestCases(reqId);
          if (tcRes.data) store.set('testCases', tcRes.data);
        } catch (e) {
          console.error(e);
        }

        renderRequirements(container);
      }
    });
  });

  setupRequirementDetailEvents(container);
}

function renderSelectedRequirement(req) {
  if (!req) {
    return `
      <div class="card" style="text-align:center; padding:50px 20px;">
        <p style="color:var(--text-muted);">Seleccione un requisito de la lista o cree uno nuevo.</p>
      </div>
    `;
  }

  // Format acceptance criteria with Gherkin highlights if present
  let formattedCriteria = req.acceptanceCriteria || 'No se definieron criterios de aceptación.';
  formattedCriteria = formattedCriteria
    .replace(/(Dado que|Given)/gi, '<span class="bdd-keyword">$1</span>')
    .replace(/(Cuando|When)/gi, '<span class="bdd-keyword">$1</span>')
    .replace(/(Entonces|Then)/gi, '<span class="bdd-keyword">$1</span>')
    .replace(/(Y |And )/gi, '<span class="bdd-keyword">$1</span>')
    .replace(/(Escenario:|Scenario:)/gi, '<span class="bdd-scenario">$1</span>');

  return `
    <div class="card" style="border-top:3px solid var(--primary);">
      <!-- Header -->
      <div class="card-header" style="flex-wrap:wrap; gap:12px;">
        <div>
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
            <span class="test-case-code" style="font-size:1rem; padding:4px 12px;">${req.code}</span>
            <span class="badge badge-derived">Versión v${req.version || 1}</span>
            <span class="badge ${req.status === 'GENERATED' ? 'badge-approved' : 'badge-pending'}">${req.status || 'DRAFT'}</span>
          </div>
          <h3 style="font-size:1.25rem; font-weight:700;">${req.title}</h3>
        </div>

        <!-- Action Buttons -->
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn btn-sm btn-outline btn-edit-req" data-req-id="${req.id}" title="Editar Requisito">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            Editar
          </button>
          <button class="btn btn-sm btn-outline btn-delete-req" data-req-id="${req.id}" style="color:var(--error); border-color:rgba(239,68,68,0.35);" title="Eliminar Requisito">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            Eliminar
          </button>
          <button class="btn btn-cyan btn-launch-heuristics" data-req-id="${req.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
            ⚡ Crear Pruebas Rápidas
          </button>
          <button class="btn btn-primary btn-launch-ai" data-req-id="${req.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            🤖 Crear Pruebas con IA
          </button>
        </div>
      </div>

      <!-- Description -->
      <div style="margin-bottom:20px;">
        <h4 style="font-size:0.76rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:6px;">
          ¿Qué hace esta función o pantalla?
        </h4>
        <p style="font-size:0.88rem; color:var(--text-secondary); line-height:1.6; background:rgba(0,0,0,0.15); padding:12px 14px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
          ${req.description || 'Sin descripción detallada.'}
        </p>
      </div>

      <!-- Acceptance Criteria (Gherkin/BDD Box) -->
      <div style="margin-bottom:24px;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
          <h4 style="font-size:0.76rem; font-weight:700; text-transform:uppercase; color:var(--text-muted);">
            Reglas del sistema y condiciones a cumplir
          </h4>
        </div>
        <div class="bdd-box">${formattedCriteria}</div>
      </div>

      <!-- AI Invocations History -->
      <div style="margin-bottom:20px;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
          <h4 style="font-size:0.76rem; font-weight:700; text-transform:uppercase; color:var(--text-muted);">
            Historial de pruebas creadas
          </h4>
        </div>
        <div id="ai-history-box-${req.id}" style="font-size:0.82rem; color:var(--text-secondary); background:rgba(0,0,0,0.2); padding:12px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
          <span class="spinner spinner-cyan"></span> Cargando historial...
        </div>
      </div>

      <!-- Quick Link to Test Cases Workbench -->
      <div style="display:flex; align-items:center; justify-content:space-between; padding-top:16px; border-top:1px solid var(--border-subtle);">
        <span style="font-size:0.84rem; color:var(--text-secondary);">
          ¿Quieres ver y revisar todas las pruebas creadas para esta regla?
        </span>
        <button class="btn btn-outline btn-sm btn-go-testcases" data-req-id="${req.id}">
          Ver pruebas &rarr;
        </button>
      </div>
    </div>
  `;
}

function setupRequirementDetailEvents(container) {
  // Load AI generation history async for selected requirement
  const activeReq = store.get('activeRequirement');
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
                Sin registros de inferencia IA para este requisito todavía. Ejecuta el motor arriba para comenzar el análisis.
              </div>
            `;
            return;
          }
          historyBox.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${history
                .slice(0, 3)
                .map(
                  (h) => `
                <div style="display:flex; align-items:center; justify-content:space-between; padding:6px 8px; background:rgba(255,255,255,0.02); border-radius:var(--radius-sm); font-size:0.78rem;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span class="badge badge-source-ai" style="font-size:0.68rem;">${h.provider} / ${h.model}</span>
                    <span>${h.generatedCasesCount || 0} casos generados</span>
                  </div>
                  <div style="display:flex; align-items:center; gap:12px; font-family:var(--font-mono); font-size:0.74rem;">
                    <span style="color:var(--cyan);">${h.totalTokens || (h.inputTokens + h.outputTokens)} tokens</span>
                    <span style="color:var(--warning);">${h.responseTimeMs}ms</span>
                    <span style="color:var(--success);">$${Number(h.estimatedCost || 0).toFixed(4)}</span>
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

  // Edit requirement
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

  // Delete requirement
  container.querySelectorAll('.btn-delete-req').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const reqId = btn.getAttribute('data-req-id');
      const reqs = store.get('requirements') || [];
      const req = reqs.find((r) => r.id === reqId);
      if (!confirm(`¿Está seguro de eliminar el requisito ${req?.code} ("${req?.title}")? Esto borrará sus casos de prueba asociados.`)) {
        return;
      }

      btn.disabled = true;
      try {
        await api.deleteRequirement(reqId);
        toast.success(`Requisito ${req?.code} eliminado exitosamente`);
        const updated = reqs.filter((r) => r.id !== reqId);
        store.set('requirements', updated);
        if (updated.length > 0) {
          store.set('activeRequirementId', updated[0].id);
          store.set('activeRequirement', updated[0]);
        } else {
          store.set('activeRequirementId', null);
          store.set('activeRequirement', null);
        }
        renderRequirements(container);
      } catch (err) {
        toast.error(`Error al eliminar: ${err.message}`);
        btn.disabled = false;
      }
    });
  });

  container.querySelectorAll('.btn-launch-ai').forEach((btn) => {
    btn.addEventListener('click', () => {
      const reqId = btn.getAttribute('data-req-id');
      const reqs = store.get('requirements') || [];
      const req = reqs.find((r) => r.id === reqId);
      modals.openAiGenModal(req);
    });
  });

  container.querySelectorAll('.btn-launch-heuristics').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const reqId = btn.getAttribute('data-req-id');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Generando...';

      try {
        const res = await api.generateHeuristicTests({ requirementId: reqId });
        const count = res.data?.testCases?.length || 0;
        toast.success(`¡Se generaron ${count} casos sin usar IA (motor de reglas)!`);

        const tcRes = await api.getTestCases(reqId);
        if (tcRes.data) store.set('testCases', tcRes.data);

        const projId = store.get('activeProjectId');
        if (projId) {
          const reqRes = await api.getRequirements(projId);
          if (reqRes.data) store.set('requirements', reqRes.data);
        }
        renderRequirements(container);
      } catch (err) {
        toast.error(`Error al generar sin IA: ${err.message}`);
      } finally {
        btn.disabled = false;
        btn.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
          Generar sin IA
        `;
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
