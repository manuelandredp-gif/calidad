// ==========================================================================
// Split-Screen Workspace View - TestGenAI (Power User Dual Pane)
// ==========================================================================

import { store } from '../state.js';
import { api } from '../api.js';
import { toast } from '../toast.js';
import { modals } from '../modals.js';
import { eventBus } from '../event-bus.js';

export function renderSplitView(container) {
  const project = store.get('activeProject');
  const requirements = store.get('requirements') || [];
  let activeReqId = store.get('activeRequirementId') || (requirements[0]?.id || null);
  let activeReq = requirements.find((r) => r.id === activeReqId) || requirements[0];
  let testCases = store.get('testCases') || [];

  // Saved pane width from localStorage
  const savedWidth = localStorage.getItem('testgenai_split_left_width') || '45%';

  container.innerHTML = `
    <!-- Top toolbar of Split View -->
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
      <div>
        <div style="display:flex; align-items:center; gap:10px;">
          <h2 style="font-size:1.35rem; font-weight:700;">Modo Split-Screen</h2>
          <span class="badge badge-derived">Dual Pane Resizable</span>
        </div>
        <p style="font-size:0.84rem; color:var(--text-secondary);">
          Requisito a la izquierda y casos de prueba a la derecha. Arrastra el divisor central para ajustar el ancho.
        </p>
      </div>

      <div style="display:flex; gap:10px; align-items:center;">
        <select class="form-select" id="split-req-select" style="min-width:240px; font-weight:600;">
          ${
            requirements.length > 0
              ? requirements
                  .map((r) => `<option value="${r.id}" ${r.id === activeReqId ? 'selected' : ''}>${r.code} - ${r.title}</option>`)
                  .join('')
              : '<option value="">Sin requisitos</option>'
          }
        </select>
        <button class="btn btn-secondary btn-sm" id="btn-split-reset-width" title="Restablecer división 50/50">
          50/50
        </button>
      </div>
    </div>

    <!-- Dual Pane Container -->
    <div class="split-screen-container" id="split-screen-container">
      <!-- Left Pane: Requirement Inspector -->
      <div class="split-pane split-pane-left" id="split-pane-left" style="width: ${savedWidth};">
        <div id="split-req-content">
          ${renderLeftRequirementPane(activeReq)}
        </div>
      </div>

      <!-- Draggable Divider -->
      <div class="split-divider" id="split-divider" title="Arrastra para redimensionar (Doble clic para 50/50)"></div>

      <!-- Right Pane: Test Cases & Live Execution -->
      <div class="split-pane split-pane-right" id="split-pane-right">
        <div id="split-cases-content">
          ${renderRightTestCasesPane(activeReq, testCases.filter((tc) => tc.requirementId === activeReqId))}
        </div>
      </div>
    </div>
  `;

  // Attach Resizing Handlers
  setupSplitResizer();

  // Attach Requirement Dropdown Handler
  const reqSelect = document.getElementById('split-req-select');
  reqSelect?.addEventListener('change', async (e) => {
    const newId = e.target.value;
    activeReqId = newId;
    activeReq = requirements.find((r) => r.id === newId);
    store.set('activeRequirementId', newId);
    store.set('activeRequirement', activeReq);

    // Refresh left pane
    const leftEl = document.getElementById('split-req-content');
    if (leftEl) leftEl.innerHTML = renderLeftRequirementPane(activeReq);

    // Fetch test cases for selected requirement
    try {
      const tcRes = await api.getTestCases(newId);
      if (tcRes.data) {
        testCases = tcRes.data;
        const rightEl = document.getElementById('split-cases-content');
        if (rightEl) rightEl.innerHTML = renderRightTestCasesPane(activeReq, testCases);
        setupRightPaneEvents(activeReq);
      }
    } catch (err) {
      console.warn('Error cargando casos en split:', err);
    }

    setupLeftPaneEvents(activeReq);
  });

  setupLeftPaneEvents(activeReq);
  setupRightPaneEvents(activeReq);
}

function renderLeftRequirementPane(req) {
  if (!req) {
    return `<div style="text-align:center; padding:50px 20px; color:var(--text-muted);">No hay requisito seleccionado.</div>`;
  }

  let formattedCriteria = req.acceptanceCriteria || 'No se definieron criterios de aceptación.';
  formattedCriteria = formattedCriteria
    .replace(/(Dado que|Given)/gi, '<span class="bdd-keyword">$1</span>')
    .replace(/(Cuando|When)/gi, '<span class="bdd-keyword">$1</span>')
    .replace(/(Entonces|Then)/gi, '<span class="bdd-keyword">$1</span>')
    .replace(/(Y |And )/gi, '<span class="bdd-keyword">$1</span>');

  return `
    <div style="display:flex; flex-direction:column; gap:16px;">
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="test-case-code" style="font-size:0.95rem;">${req.code}</span>
          <span class="badge badge-derived">v${req.version || 1}</span>
        </div>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-sm btn-outline" id="btn-split-edit-req">Editar</button>
          <button class="btn btn-sm btn-cyan" id="btn-split-heuristics">Generar Heurísticas</button>
          <button class="btn btn-sm btn-primary" id="btn-split-ai">Generar con IA</button>
        </div>
      </div>

      <h3 style="font-size:1.15rem; font-weight:700; color:var(--text-primary);">${req.title}</h3>

      <div>
        <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:6px;">
          Descripción Funcional
        </div>
        <div style="font-size:0.86rem; color:var(--text-secondary); line-height:1.6; background:rgba(0,0,0,0.15); padding:12px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
          ${req.description || 'Sin descripción.'}
        </div>
      </div>

      <div>
        <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:6px;">
          Criterios de Aceptación (Gherkin / Reglas)
        </div>
        <div class="bdd-box" style="font-size:0.84rem; max-height:220px; overflow-y:auto;">
          ${formattedCriteria}
        </div>
      </div>

      <div style="margin-top:8px; padding:12px; border-radius:var(--radius-sm); background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.2);">
        <div style="font-size:0.8rem; font-weight:700; color:var(--primary); margin-bottom:4px;">
          💡 Atajo rápido Copiloto
        </div>
        <div style="font-size:0.78rem; color:var(--text-secondary);">
          Presiona <kbd>Ctrl</kbd> + <kbd>J</kbd> para auditar ambigüedades en este texto con el Asistente IA.
        </div>
      </div>
    </div>
  `;
}

function renderRightTestCasesPane(req, cases) {
  const count = cases ? cases.length : 0;
  const approved = (cases || []).filter((c) => c.status === 'APPROVED').length;
  const pending = (cases || []).filter((c) => c.status === 'PENDING').length;

  return `
    <div style="display:flex; flex-direction:column; gap:16px;">
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <h3 style="font-size:1.15rem; font-weight:700;">Casos de Prueba</h3>
          <span class="badge ${count > 0 ? 'badge-approved' : 'badge-pending'}">${count} casos</span>
          <span style="font-size:0.8rem; color:var(--text-muted);">${approved} aprobados • ${pending} pendientes</span>
        </div>

        <button class="btn btn-sm btn-outline" id="btn-split-toggle-heatmap">
          🔥 Mapa de Calor
        </button>
      </div>

      <div style="display:flex; flex-direction:column; gap:10px; max-height: calc(100vh - 240px); overflow-y:auto; padding-right:4px;">
        ${
          count > 0
            ? cases
                .map((tc) => {
                  return `
                  <div class="card heatmap-step" data-case-id="${tc.id}" style="padding:12px 14px; margin-bottom:0;">
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
                      <div style="display:flex; align-items:center; gap:8px;">
                        <span class="test-case-code">${tc.code}</span>
                        <span class="badge badge-derived">${tc.type}</span>
                      </div>
                      <span class="badge ${tc.status === 'APPROVED' ? 'badge-approved' : tc.status === 'REJECTED' ? 'badge-rejected' : 'badge-pending'}">
                        ${tc.status}
                      </span>
                    </div>

                    <div style="font-size:0.88rem; font-weight:600; color:var(--text-primary); margin-bottom:6px;">
                      ${tc.title}
                    </div>

                    <div style="font-size:0.78rem; color:var(--text-secondary); line-height:1.4; margin-bottom:8px;">
                      <strong>Pasos:</strong> ${tc.steps ? tc.steps.replace(/\n/g, ' ➔ ') : 'Sin pasos'}
                    </div>

                    <div style="font-size:0.78rem; color:var(--success); background:rgba(16,185,129,0.08); padding:6px 8px; border-radius:4px;">
                      <strong>Esperado:</strong> ${tc.expectedResult || 'N/A'}
                    </div>
                  </div>
                `;
                })
                .join('')
            : `
              <div style="text-align:center; padding:40px 20px; color:var(--text-muted);">
                <p>No hay casos de prueba aún para este requisito.</p>
                <p style="font-size:0.8rem; margin-top:6px;">Usa los botones del panel izquierdo para generar casos con IA o Heurísticas.</p>
              </div>
            `
        }
      </div>
    </div>
  `;
}

function setupSplitResizer() {
  const divider = document.getElementById('split-divider');
  const leftPane = document.getElementById('split-pane-left');
  const container = document.getElementById('split-screen-container');
  const resetBtn = document.getElementById('btn-split-reset-width');

  if (!divider || !leftPane || !container) return;

  let isDragging = false;

  divider.addEventListener('pointerdown', (e) => {
    isDragging = true;
    divider.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  window.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const rect = container.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const totalWidth = rect.width;
    let percentage = (offsetX / totalWidth) * 100;

    // Clamp between 25% and 75%
    if (percentage < 25) percentage = 25;
    if (percentage > 75) percentage = 75;

    const widthStr = `${percentage.toFixed(1)}%`;
    leftPane.style.width = widthStr;
    localStorage.setItem('testgenai_split_left_width', widthStr);
  });

  window.addEventListener('pointerup', () => {
    if (isDragging) {
      isDragging = false;
      divider.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });

  // Double click resets to 50%
  divider.addEventListener('dblclick', () => {
    leftPane.style.width = '50%';
    localStorage.setItem('testgenai_split_left_width', '50%');
    toast.info('División restablecida a 50/50');
  });

  resetBtn?.addEventListener('click', () => {
    leftPane.style.width = '50%';
    localStorage.setItem('testgenai_split_left_width', '50%');
    toast.info('División restablecida a 50/50');
  });
}

function setupLeftPaneEvents(req) {
  if (!req) return;

  document.getElementById('btn-split-ai')?.addEventListener('click', () => {
    modals.open('modal-generate-cases');
  });

  document.getElementById('btn-split-heuristics')?.addEventListener('click', async () => {
    try {
      toast.info('Generando matriz determinista ISTQB...');
      const res = await api.generateHeuristics(req.id);
      toast.success(`Se generaron ${res.data?.length || 0} casos heurísticos.`);
      eventBus.emit('view:switch', 'split-view');
    } catch (e) {
      toast.error('Error generando heurísticas: ' + e.message);
    }
  });

  document.getElementById('btn-split-edit-req')?.addEventListener('click', () => {
    modals.open('modal-edit-requirement');
  });
}

function setupRightPaneEvents(req) {
  document.getElementById('btn-split-toggle-heatmap')?.addEventListener('click', () => {
    toast.info('Modo Mapa de Calor activado. Pasa el cursor por los casos para ver su correlación.');
    document.querySelectorAll('.heatmap-step').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        const bddBox = document.querySelector('.split-pane-left .bdd-box');
        if (bddBox) {
          bddBox.style.boxShadow = '0 0 15px var(--cyan-glow)';
          bddBox.style.borderColor = 'var(--cyan)';
        }
      });
      el.addEventListener('mouseleave', () => {
        const bddBox = document.querySelector('.split-pane-left .bdd-box');
        if (bddBox) {
          bddBox.style.boxShadow = '';
          bddBox.style.borderColor = '';
        }
      });
    });
  });
}
