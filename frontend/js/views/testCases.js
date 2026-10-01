// ==========================================================================
// TestGenAI — Centro de Casos de Prueba (Simple, Claro y Fácil de Entender)
// ==========================================================================

import { store } from '../state.js';
import { modals } from '../modals.js';
import { api } from '../api.js';
import { toast } from '../toast.js';
import { DiffViewer } from './diff-viewer.js';
import { eventBus } from '../event-bus.js';

let activeCategoryFilter = 'ALL'; // 'ALL' | 'positive' | 'negative' | 'boundary' | 'validation' | 'PENDING'
let filterSearch = '';
let filterRequirementId = 'ALL';

// Exportación rápida a Excel (CSV con formato UTF-8)
function exportCasesToCsv(cases, projectName = 'Proyecto') {
  if (!cases || cases.length === 0) {
    toast.warning('No hay casos para exportar.');
    return;
  }
  const headers = [
    'Código',
    'Tipo de Prueba',
    'Título del Caso',
    'Precondiciones',
    'Pasos a Seguir',
    'Datos de Prueba',
    'Resultado Esperado',
    'Estado de Revisión',
  ];

  const typeLabels = {
    positive: 'Camino Feliz (Uso Normal)',
    negative: 'Caso de Error (Manejo de Fallos)',
    boundary: 'Valores Límite (Casos Extremos)',
    validation: 'Validación de Campos',
    alternative: 'Flujo Alternativo',
  };

  const rows = cases.map((c) => {
    const rawSteps = Array.isArray(c.steps) ? c.steps.join(' | ') : c.steps || '';
    const rawPre = Array.isArray(c.preconditions) ? c.preconditions.join(' | ') : c.preconditions || '';
    const readableType = typeLabels[c.type] || c.type || 'General';

    return [
      `"${c.code || ''}"`,
      `"${readableType}"`,
      `"${(c.title || '').replace(/"/g, '""')}"`,
      `"${rawPre.replace(/"/g, '""')}"`,
      `"${rawSteps.replace(/"/g, '""')}"`,
      `"${(c.testData || '').replace(/"/g, '""')}"`,
      `"${(c.expectedResult || '').replace(/"/g, '""')}"`,
      `"${c.status || 'PENDING'}"`,
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = projectName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  a.download = `casos_de_prueba_${safeName}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success('¡Archivo Excel (CSV) descargado con éxito!');
}

export async function renderTestCases(container) {
  const projectId = store.get('activeProjectId');
  const project = store.get('activeProject');
  const requirements = store.get('requirements') || [];
  let testCases = store.get('testCases') || [];

  // Recarga si está vacío
  if (projectId && testCases.length === 0) {
    try {
      const allTcRes = await api.getProjectTestCases(projectId);
      if (allTcRes.data) {
        testCases = allTcRes.data;
        store.set('testCases', testCases);
      }
    } catch (e) {
      console.warn('Fallback loading test cases:', e);
    }
  }

  // Filtrado simple
  const filteredCases = testCases.filter((tc) => {
    // Filtro por pestaña rápida
    if (activeCategoryFilter === 'PENDING' && tc.status !== 'PENDING') return false;
    if (activeCategoryFilter === 'positive' && tc.type !== 'positive') return false;
    if (activeCategoryFilter === 'negative' && tc.type !== 'negative') return false;
    if (activeCategoryFilter === 'boundary' && tc.type !== 'boundary') return false;
    if (activeCategoryFilter === 'validation' && tc.type !== 'validation') return false;

    // Filtro por requisito si fue seleccionado
    if (filterRequirementId !== 'ALL' && tc.requirementId !== filterRequirementId) return false;

    // Búsqueda por palabra clave
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      const mCode = tc.code?.toLowerCase().includes(q);
      const mTitle = tc.title?.toLowerCase().includes(q);
      const mData = tc.testData?.toLowerCase().includes(q);
      const mResult = tc.expectedResult?.toLowerCase().includes(q);
      if (!mCode && !mTitle && !mData && !mResult) return false;
    }

    return true;
  });

  // Conteo de casos
  const total = testCases.length;
  const pending = testCases.filter((c) => c.status === 'PENDING').length;
  const approved = testCases.filter((c) => c.status === 'APPROVED').length;
  const happyCount = testCases.filter((c) => c.type === 'positive').length;
  const errorCount = testCases.filter((c) => c.type === 'negative').length;
  const limitCount = testCases.filter((c) => c.type === 'boundary').length;
  const valCount = testCases.filter((c) => c.type === 'validation').length;

  container.innerHTML = `
    <!-- Header Principal -->
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:14px;">
      <div>
        <h2 style="font-size:1.35rem; font-weight:800; margin-bottom:4px;">
          📋 Casos de Prueba Generados
        </h2>
        <p style="font-size:0.85rem; color:var(--text-secondary);">
          Revisa y aprueba cada prueba con 1 clic. Tú decides qué casos forman parte de tu suite oficial.
        </p>
      </div>

      <!-- Barra de Acciones Globales -->
      <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
        <button class="btn btn-outline" id="btn-export-csv-testcases" title="Descargar todos los casos mostrados en Excel">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          <span style="color:#34d399; font-weight:600;">Descargar en Excel (.csv)</span>
        </button>

        ${
          pending > 0
            ? `
          <button class="btn btn-success" id="btn-batch-approve">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Aprobar Todos los Pendientes (${pending})
          </button>
        `
            : ''
        }

        <button class="btn btn-primary" id="btn-new-manual-case">
          + Nuevo Caso Manual
        </button>
      </div>
    </div>

    <!-- Pestañas Rápidas de Categorías (Ultra-Fácil de Entender) -->
    <div class="quick-filter-tabs">
      <button type="button" class="quick-filter-tab ${activeCategoryFilter === 'ALL' ? 'active' : ''}" data-cat="ALL">
        <span>🔘 Todas</span>
        <span class="badge-count">${total}</span>
      </button>
      <button type="button" class="quick-filter-tab ${activeCategoryFilter === 'positive' ? 'active' : ''}" data-cat="positive">
        <span>🟢 Casos de Éxito</span>
        <span class="badge-count">${happyCount}</span>
      </button>
      <button type="button" class="quick-filter-tab ${activeCategoryFilter === 'negative' ? 'active' : ''}" data-cat="negative">
        <span>🔴 Casos de Error</span>
        <span class="badge-count">${errorCount}</span>
      </button>
      <button type="button" class="quick-filter-tab ${activeCategoryFilter === 'boundary' ? 'active' : ''}" data-cat="boundary">
        <span>🟡 Casos Límite</span>
        <span class="badge-count">${limitCount}</span>
      </button>
      <button type="button" class="quick-filter-tab ${activeCategoryFilter === 'validation' ? 'active' : ''}" data-cat="validation">
        <span>🟣 Campos Obligatorios</span>
        <span class="badge-count">${valCount}</span>
      </button>
      <button type="button" class="quick-filter-tab ${activeCategoryFilter === 'PENDING' ? 'active' : ''}" data-cat="PENDING">
        <span>⏳ Por Revisar</span>
        <span class="badge-count">${pending}</span>
      </button>
    </div>

    <!-- Barra de Búsqueda Rápida y Filtro por Requisito -->
    <div class="card" style="padding:14px 18px; margin-bottom:20px; display:flex; align-items:center; gap:14px; flex-wrap:wrap;">
      <div style="flex:1; min-width:240px; position:relative;">
        <input
          type="text"
          id="tc-search-input"
          class="form-input"
          placeholder="🔍 Buscar por palabra clave (ej. contraseña, saldo, correo, error)..."
          value="${filterSearch}"
          style="padding-left:14px;"
        />
      </div>

      ${
        requirements.length > 1
          ? `
        <div style="min-width:220px;">
          <select id="tc-select-req" class="form-select" style="font-size:0.84rem;">
            <option value="ALL">📁 Todos los requisitos (${requirements.length})</option>
            ${requirements.map((r) => `<option value="${r.id}" ${r.id === filterRequirementId ? 'selected' : ''}>${r.code} — ${r.title}</option>`).join('')}
          </select>
        </div>
      `
          : ''
      }

      ${
        filterSearch || filterRequirementId !== 'ALL' || activeCategoryFilter !== 'ALL'
          ? `
        <button type="button" class="btn btn-secondary btn-sm" id="btn-clear-all-filters">
          ✕ Limpiar Filtros
        </button>
      `
          : ''
      }
    </div>

    <!-- Lista de Tarjetas de Casos -->
    <div id="test-cases-list" style="display:flex; flex-direction:column; gap:16px;">
      ${
        filteredCases.length > 0
          ? filteredCases.map((tc) => renderHumanTestCaseCard(tc)).join('')
          : `
          <div class="card" style="text-align:center; padding:50px 20px;">
            <div style="font-size:2rem; margin-bottom:8px;">🔍</div>
            <h3 style="font-size:1.05rem; font-weight:700; margin-bottom:6px;">No se encontraron casos de prueba</h3>
            <p style="color:var(--text-secondary); font-size:0.85rem; margin-bottom:14px;">
              Intenta cambiar la categoría o limpiar los términos de búsqueda.
            </p>
            <button class="btn btn-secondary btn-sm" id="btn-reset-empty-search">Ver todos los casos</button>
          </div>
        `
      }
    </div>
  `;

  // --- Manejo de Eventos ---

  // 1. Pestañas de Filtro Rápido
  container.querySelectorAll('.quick-filter-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      activeCategoryFilter = tab.getAttribute('data-cat');
      renderTestCases(container);
    });
  });

  // 2. Búsqueda en Tiempo Real
  const searchInput = container.querySelector('#tc-search-input');
  searchInput?.addEventListener('input', (e) => {
    filterSearch = e.target.value;
    renderTestCases(container);
    // Recuperar foco al final del texto
    const refreshed = container.querySelector('#tc-search-input');
    if (refreshed) {
      refreshed.focus();
      refreshed.setSelectionRange(refreshed.value.length, refreshed.value.length);
    }
  });

  // 3. Filtro por Requisito
  container.querySelector('#tc-select-req')?.addEventListener('change', (e) => {
    filterRequirementId = e.target.value;
    renderTestCases(container);
  });

  // 4. Limpiar Filtros
  const clearFilters = () => {
    activeCategoryFilter = 'ALL';
    filterSearch = '';
    filterRequirementId = 'ALL';
    renderTestCases(container);
  };
  container.querySelector('#btn-clear-all-filters')?.addEventListener('click', clearFilters);
  container.querySelector('#btn-reset-empty-search')?.addEventListener('click', clearFilters);

  // 5. Descargar a Excel
  container.querySelector('#btn-export-csv-testcases')?.addEventListener('click', () => {
    exportCasesToCsv(filteredCases, project?.name || 'TestGenAI');
  });

  // 6. Nuevo Caso Manual
  container.querySelector('#btn-new-manual-case')?.addEventListener('click', () => {
    modals.open('modal-manual-testcase');
  });

  // 7. Aprobación Masiva
  container.querySelector('#btn-batch-approve')?.addEventListener('click', async () => {
    const pendings = filteredCases.filter((c) => c.status === 'PENDING');
    if (pendings.length === 0) return;
    if (!confirm(`¿Deseas aprobar todos los ${pendings.length} casos pendientes visibles?`)) return;

    try {
      const ids = pendings.map((c) => c.id);
      await api.batchReviewTestCases(ids, 'APPROVED', 'Aprobación en lote desde Casos de Prueba');
      toast.success(`¡Se aprobaron ${ids.length} casos con éxito!`);
      const pId = store.get('activeProjectId');
      if (pId) {
        const res = await api.getProjectTestCases(pId);
        if (res.data) store.set('testCases', res.data);
      }
      renderTestCases(container);
    } catch (err) {
      toast.error(`Error al aprobar: ${err.message}`);
    }
  });

  // 8. Eventos de cada tarjeta (Aprobar, Modificar, Rechazar, Clonar, Eliminar)
  setupCardActions(container, testCases);
}

// Renderiza una tarjeta de caso con diseño limpio, comprensible y sin tecnicismos oscuros
function renderHumanTestCaseCard(tc) {
  const steps = Array.isArray(tc.steps) ? tc.steps : [tc.steps];
  const preconditions = Array.isArray(tc.preconditions) ? tc.preconditions : [tc.preconditions];

  const typeConfig = {
    positive: { label: '🟢 Caso de Éxito', border: '#10b981', desc: 'Verifica que funcione bien con datos correctos' },
    negative: { label: '🔴 Caso de Error', border: '#ef4444', desc: 'Verifica que avise si el usuario se equivoca' },
    boundary: { label: '🟡 Caso Límite', border: '#f59e0b', desc: 'Verifica las cantidades mínimas y máximas exactas' },
    validation: { label: '🟣 Campos Obligatorios', border: '#8b5cf6', desc: 'Verifica campos vacíos o formatos requeridos' },
  };

  const conf = typeConfig[tc.type] || { label: '🔵 Prueba General', border: 'var(--primary)', desc: 'Caso de verificación del sistema' };

  let statusBadge = `<span class="badge badge-pending">⏳ Por Revisar</span>`;
  if (tc.status === 'APPROVED') statusBadge = `<span class="badge badge-approved">✓ Aprobado</span>`;
  else if (tc.status === 'MODIFIED') statusBadge = `<span class="badge badge-modified">✏ Modificado</span>`;
  else if (tc.status === 'REJECTED') statusBadge = `<span class="badge badge-rejected">✕ Rechazado</span>`;

  return `
    <div class="card" id="card-${tc.id}" style="border-left:4px solid ${conf.border}; padding:18px 22px;">
      <!-- Encabezado de la Tarjeta -->
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-family:var(--font-mono); font-weight:800; font-size:0.88rem; color:var(--text-muted); background:rgba(0,0,0,0.3); padding:2px 8px; border-radius:var(--radius-sm);">${tc.code}</span>
          <span style="font-size:0.82rem; font-weight:700; color:${conf.border};">${conf.label}</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          ${statusBadge}
        </div>
      </div>

      <!-- Título y Objetivo -->
      <div style="font-size:1.08rem; font-weight:700; color:var(--text-primary); margin-bottom:12px;">
        ${tc.title}
      </div>

      <!-- Antes de empezar si existe -->
      ${
        preconditions.length > 0 && preconditions[0]
          ? `
        <div style="font-size:0.8rem; color:var(--text-secondary); background:rgba(255,255,255,0.03); padding:6px 12px; border-radius:var(--radius-sm); margin-bottom:12px;">
          <strong style="color:var(--text-muted);">Antes de empezar:</strong> ${preconditions.join(' • ')}
        </div>
      `
          : ''
      }

      <!-- Pasos a Seguir -->
      <div style="margin-bottom:14px;">
        <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:6px; letter-spacing:0.04em;">
          📋 ¿Cómo probarlo? (Pasos sencillos):
        </div>
        <div style="display:flex; flex-direction:column; gap:5px; font-size:0.88rem; color:var(--text-secondary); padding-left:4px;">
          ${steps
            .map(
              (step, idx) => `
            <div style="display:flex; align-items:baseline; gap:8px;">
              <span style="font-weight:700; color:var(--text-primary); min-width:18px;">${idx + 1}.</span>
              <span>${step}</span>
            </div>
          `
            )
            .join('')}
        </div>
      </div>

      <!-- Datos de Entrada y Resultado Esperado -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:12px; margin-bottom:16px;">
        <div style="background:rgba(0,0,0,0.25); padding:10px 14px; border-radius:var(--radius-sm); border:1px solid rgba(255,255,255,0.04);">
          <div style="font-size:0.72rem; font-weight:700; color:var(--text-muted); margin-bottom:3px;">⌨️ ¿Qué debes escribir?:</div>
          <div style="font-size:0.85rem; color:var(--text-secondary); font-family:var(--font-mono);">${tc.testData || 'Datos estándar'}</div>
        </div>
        <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.25); padding:10px 14px; border-radius:var(--radius-sm);">
          <div style="font-size:0.72rem; font-weight:700; color:#34d399; margin-bottom:3px;">✅ ¿Qué debe responder la pantalla?:</div>
          <div style="font-size:0.86rem; color:var(--text-primary); font-weight:600;">${tc.expectedResult || 'El sistema responde adecuadamente'}</div>
        </div>
      </div>

      <!-- Justificación o Cita del Requisito -->
      ${
        tc.evidenceText
          ? `
        <div style="font-size:0.78rem; color:var(--text-muted); background:rgba(0,0,0,0.2); padding:6px 12px; border-radius:var(--radius-sm); margin-bottom:14px; border-left:2px solid var(--primary);">
          💡 Según tu regla: <em>"${tc.evidenceText}"</em>
        </div>
      `
          : ''
      }

      <!-- Barra de Acciones del Caso -->
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; border-top:1px solid rgba(255,255,255,0.06); padding-top:12px;">
        <!-- Acciones Secundarias (Clonar, Diff, Eliminar) -->
        <div style="display:flex; align-items:center; gap:6px;">
          <button class="btn btn-sm btn-outline btn-diff-case" data-id="${tc.id}" title="Comparar con tu texto original">
            Comparar
          </button>
          <button class="btn btn-sm btn-outline btn-clone-case" data-id="${tc.id}" title="Duplicar este caso">
            Duplicar
          </button>
          <button class="btn btn-sm btn-outline btn-delete-case" data-id="${tc.id}" style="color:var(--error); border-color:rgba(239,68,68,0.3);" title="Eliminar este caso">
            Eliminar
          </button>
        </div>

        <!-- Acciones Principales de Aprobación Humana -->
        <div style="display:flex; align-items:center; gap:8px;">
          <button class="btn btn-sm btn-secondary btn-edit-case" data-id="${tc.id}">
            ✏ Modificar
          </button>
          ${
            tc.status !== 'REJECTED'
              ? `
            <button class="btn btn-sm btn-danger btn-reject-case" data-id="${tc.id}">
              ✕ Rechazar
            </button>
          `
              : ''
          }
          ${
            tc.status !== 'APPROVED'
              ? `
            <button class="btn btn-sm btn-success btn-approve-case" data-id="${tc.id}">
              ✓ Aprobar Prueba
            </button>
          `
              : `
            <button class="btn btn-sm btn-outline" style="color:#34d399; pointer-events:none; border-color:rgba(52,211,153,0.3);">
              ✓ Prueba Aprobada
            </button>
          `
          }
        </div>
      </div>
    </div>
  `;
}

function setupCardActions(container, testCases) {
  // Aprobar
  container.querySelectorAll('.btn-approve-case').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span>';
      try {
        await api.reviewTestCase(id, {
          reviewStatus: 'APPROVED',
          comments: 'Aprobado formalmente por revisor humano QA',
        });
        toast.success('✓ Caso aprobado correctamente');
        const tc = testCases.find((c) => c.id === id);
        if (tc) tc.status = 'APPROVED';
        store.set('testCases', [...testCases]);
        renderTestCases(container);
      } catch (err) {
        toast.error(`Error: ${err.message}`);
        btn.disabled = false;
        btn.innerHTML = '✓ Aprobar Caso';
      }
    });
  });

  // Modificar
  container.querySelectorAll('.btn-edit-case').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const tc = testCases.find((c) => c.id === id);
      if (tc) modals.populateEditTestCase(tc);
    });
  });

  // Rechazar
  container.querySelectorAll('.btn-reject-case').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const tc = testCases.find((c) => c.id === id);
      if (tc) modals.populateRejectTestCase(tc);
    });
  });

  // Duplicar / Clonar
  container.querySelectorAll('.btn-clone-case').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      btn.disabled = true;
      try {
        const res = await api.cloneTestCase(id);
        toast.success(`Caso duplicado como ${res.data?.code || 'nuevo caso'}`);
        const pId = store.get('activeProjectId');
        if (pId) {
          const tcRes = await api.getProjectTestCases(pId);
          if (tcRes.data) store.set('testCases', tcRes.data);
        }
        renderTestCases(container);
      } catch (err) {
        toast.error(`Error al duplicar: ${err.message}`);
        btn.disabled = false;
      }
    });
  });

  // Eliminar
  container.querySelectorAll('.btn-delete-case').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const tc = testCases.find((c) => c.id === id);
      if (!confirm(`¿Seguro que deseas eliminar el caso ${tc?.code || ''}?`)) return;
      btn.disabled = true;
      try {
        await api.deleteTestCase(id);
        toast.success(`Caso ${tc?.code || ''} eliminado`);
        const updated = testCases.filter((c) => c.id !== id);
        store.set('testCases', updated);
        renderTestCases(container);
      } catch (err) {
        toast.error(`Error al eliminar: ${err.message}`);
        btn.disabled = false;
      }
    });
  });

  // Diff 360
  container.querySelectorAll('.btn-diff-case').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const tc = testCases.find((c) => c.id === id);
      if (!tc) return;
      const requirements = store.get('requirements') || [];
      const req = requirements.find((r) => r.id === tc.requirementId);

      DiffViewer.showModal({
        title: `Comparación: ${tc.code} vs Requisito`,
        originalLabel: req ? `Requisito [${req.code}] ${req.title}` : 'Requisito Base',
        modifiedLabel: `Caso de Prueba [${tc.code}] ${tc.title}`,
        originalText: req
          ? `Descripción:\n${req.description}\n\nCriterios de Aceptación:\n${req.acceptanceCriteria}`
          : 'N/A',
        modifiedText: `Título: ${tc.title}\nTipo: ${tc.type}\n\nResultado Esperado:\n${tc.expectedResult}\n\nPasos:\n${(Array.isArray(tc.steps) ? tc.steps : [tc.steps]).join('\n')}`,
      });
    });
  });
}
