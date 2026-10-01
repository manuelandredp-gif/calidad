// ==========================================================================
// Traceability Matrix View - TestGenAI ISTQB Compliance
// ==========================================================================

import { store } from '../state.js';
import { api } from '../api.js';
import { toast } from '../toast.js';

export async function renderTraceability(container) {
  const project = store.get('activeProject');
  const projectId = store.get('activeProjectId');

  if (!projectId) {
    container.innerHTML = `
      <div class="card" style="text-align:center; padding:50px 20px;">
        <p style="color:var(--text-muted);">Seleccione un proyecto activo para visualizar la matriz de trazabilidad.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:16px;">
      <div>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
          <h2 style="font-size:1.35rem; font-weight:700;">Cobertura de requisitos</h2>
        </div>
        <p style="font-size:0.84rem; color:var(--text-secondary);">
          Qué requisitos ya tienen casos de prueba aprobados y cuáles aún no.
        </p>
      </div>

      <!-- Export Toolbar -->
      <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
        <label style="display:flex; align-items:center; gap:6px; font-size:0.82rem; color:var(--text-secondary); cursor:pointer;">
          <input type="checkbox" id="chk-export-approved-only" checked />
          Solo Casos Aprobados
        </label>
        <button class="btn btn-secondary btn-sm" id="btn-export-csv">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Exportar CSV
        </button>
        <button class="btn btn-secondary btn-sm" id="btn-export-md">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          Exportar Markdown
        </button>
        <button class="btn btn-secondary btn-sm" id="btn-export-json">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 18l6-6-6-6"></path><path d="M8 6l-6 6 6 6"></path></svg>
          Exportar JSON
        </button>
      </div>
    </div>

    <!-- Table Container Loading placeholder -->
    <div id="trace-table-container">
      <div class="card" style="text-align:center; padding:40px;">
        <span class="spinner"></span>
        <p style="color:var(--text-muted); margin-top:10px; font-size:0.85rem;">Calculando cobertura...</p>
      </div>
    </div>
  `;

  // Fetch traceability data
  try {
    const res = await api.getTraceability(projectId);
    const matrix = res.data?.matrix || res.data || [];
    renderMatrixTable(matrix, container);
  } catch (err) {
    const tableContainer = container.querySelector('#trace-table-container');
    if (tableContainer) {
      tableContainer.innerHTML = `
        <div class="card" style="text-align:center; padding:40px; color:var(--error);">
          Error al cargar trazabilidad: ${err.message}
        </div>
      `;
    }
  }

  // Setup Export Buttons
  setupExportButtons(projectId, container);
}

function renderMatrixTable(matrix, container) {
  const tableContainer = container.querySelector('#trace-table-container');
  if (!tableContainer) return;

  if (!Array.isArray(matrix) || matrix.length === 0) {
    tableContainer.innerHTML = `
      <div class="card" style="text-align:center; padding:40px; color:var(--text-muted);">
        No hay datos de trazabilidad disponibles aún para este proyecto.
      </div>
    `;
    return;
  }

  // Summary counts
  const totalReqs = matrix.length;
  const coveredReqs = matrix.filter((row) => (row.testCases || []).some((c) => c.status === 'APPROVED')).length;
  const coveragePct = totalReqs > 0 ? Math.round((coveredReqs / totalReqs) * 100) : 0;

  tableContainer.innerHTML = `
    <!-- Matrix KPI Summary -->
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:14px; margin-bottom:20px;">
      <div class="card" style="padding:14px; background:rgba(6, 182, 212, 0.08); border-color:rgba(6, 182, 212, 0.25);">
        <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted);">Requisitos Evaluados</div>
        <div style="font-size:1.6rem; font-weight:800; color:var(--cyan);">${totalReqs}</div>
      </div>
      <div class="card" style="padding:14px; background:rgba(16, 185, 129, 0.08); border-color:rgba(16, 185, 129, 0.25);">
        <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted);">Requisitos con casos aprobados</div>
        <div style="font-size:1.6rem; font-weight:800; color:var(--success);">${coveredReqs}</div>
      </div>
      <div class="card" style="padding:14px; background:rgba(99, 102, 241, 0.08); border-color:rgba(99, 102, 241, 0.25);">
        <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted);">Cobertura total</div>
        <div style="font-size:1.6rem; font-weight:800; color:var(--primary);">${coveragePct}%</div>
      </div>
    </div>

    <!-- Interactive Table -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:110px;">Requisito</th>
            <th>Título del Requisito</th>
            <th>Casos de prueba (clic para revisar)</th>
            <th>Tipos cubiertos</th>
            <th>Estado</th>
            <th style="width:140px; text-align:center;">Cobertura</th>
          </tr>
        </thead>
        <tbody>
          ${matrix
            .map((row) => {
              const req = row.requirement || row;
              const cases = row.testCases || [];
              const totalCases = cases.length;
              const approvedCount = cases.filter((c) => c.status === 'APPROVED').length;
              const hasCases = totalCases > 0;

              // Unique types covered
              const types = [...new Set(cases.map((c) => c.type || 'positive'))];

              // Coverage status
              let coveragePill = `<span class="badge badge-rejected">Sin Casos</span>`;
              if (approvedCount > 0 && approvedCount >= totalCases * 0.7) {
                coveragePill = `<span class="badge badge-approved">✓ Óptima (${Math.round((approvedCount / totalCases) * 100)}%)</span>`;
              } else if (hasCases) {
                coveragePill = `<span class="badge badge-pending">Parcial (${approvedCount}/${totalCases})</span>`;
              }

              return `
              <tr>
                <td>
                  <span class="test-case-code req-jump-link" data-req-id="${req.requirementId || req.id}" style="cursor:pointer;" title="Ver requisito en detalle">
                    ${req.code || 'REQ-?'}
                  </span>
                </td>
                <td style="font-weight:600; max-width:240px;">
                  ${req.title || 'Sin título'}
                </td>
                <td>
                  <div style="display:flex; flex-wrap:wrap; gap:5px; max-width:340px;">
                    ${
                      cases.length > 0
                        ? cases
                            .map((c) => {
                              let badgeColor = 'badge-pending';
                              if (c.status === 'APPROVED') badgeColor = 'badge-approved';
                              else if (c.status === 'MODIFIED') badgeColor = 'badge-modified';
                              else if (c.status === 'REJECTED') badgeColor = 'badge-rejected';
                              return `<span class="badge ${badgeColor} tc-jump-link" data-req-id="${req.requirementId || req.id}" data-tc-code="${c.code}" style="cursor:pointer;" title="Clic para revisar ${c.code}: ${c.title}">${c.code}</span>`;
                            })
                            .join('')
                        : `<span style="color:var(--text-muted); font-size:0.75rem;">Ningún caso asociado</span>`
                    }
                  </div>
                </td>
                <td>
                  <div style="display:flex; flex-wrap:wrap; gap:4px;">
                    ${
                      types.length > 0
                        ? types
                            .map((t) => `<span class="badge badge-type-${t}" style="font-size:0.65rem;">${t}</span>`)
                            .join('')
                        : `<span style="color:var(--text-muted); font-size:0.75rem;">N/A</span>`
                    }
                  </div>
                </td>
                <td>
                  <div style="font-size:0.8rem; display:flex; gap:8px;">
                    <span style="color:#34d399;">${approvedCount} apr.</span>
                    <span style="color:#fbbf24;">${cases.filter((c) => c.status === 'PENDING').length} pend.</span>
                    <span style="color:#f87171;">${cases.filter((c) => c.status === 'REJECTED').length} rech.</span>
                  </div>
                </td>
                <td style="text-align:center;">${coveragePill}</td>
              </tr>
            `;
            })
            .join('')}
        </tbody>
      </table>
    </div>
  `;

  // Attach click-to-jump on test case badges
  tableContainer.querySelectorAll('.tc-jump-link').forEach((badge) => {
    badge.addEventListener('click', () => {
      const reqId = badge.getAttribute('data-req-id');
      const tcCode = badge.getAttribute('data-tc-code');
      if (reqId) store.set('activeRequirementId', reqId);
      // Navigate to test-cases review
      const navItem = document.querySelector('.nav-item[data-view="test-cases"]');
      if (navItem) navItem.click();
      toast.info(`Navegando a caso: ${tcCode}`);
    });
  });

  // Attach click-to-jump on requirement code
  tableContainer.querySelectorAll('.req-jump-link').forEach((link) => {
    link.addEventListener('click', () => {
      const reqId = link.getAttribute('data-req-id');
      if (reqId) store.set('activeRequirementId', reqId);
      const navItem = document.querySelector('.nav-item[data-view="requirements"]');
      if (navItem) navItem.click();
    });
  });
}

function setupExportButtons(projectId, container) {
  const getOnlyApproved = () => container.querySelector('#chk-export-approved-only')?.checked || false;

  const downloadFile = (format) => {
    const onlyApproved = getOnlyApproved();

    api
      .request(`/export/${projectId}?format=${format}&onlyApproved=${onlyApproved}`)
      .then((res) => {
        let content = '';
        let mimeType = 'text/plain';
        let ext = format;

        if (format === 'csv') {
          content = typeof res === 'string' ? res : (res?.data?.csvContent || (typeof res?.data === 'string' ? res.data : JSON.stringify(res)));
          mimeType = 'text/csv;charset=utf-8;';
        } else if (format === 'markdown') {
          content = typeof res === 'string' ? res : (res?.data?.markdownContent || (typeof res?.data === 'string' ? res.data : JSON.stringify(res)));
          mimeType = 'text/markdown;charset=utf-8;';
          ext = 'md';
        } else {
          content = JSON.stringify(res?.data || res, null, 2);
          mimeType = 'application/json;charset=utf-8;';
        }

        const blob = new Blob([content], { type: mimeType });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `matriz_trazabilidad_${projectId.slice(0, 8)}_${Date.now()}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);

        toast.success(`Exportación a ${format.toUpperCase()} descargada exitosamente`);
      })
      .catch((err) => {
        toast.error(`Error al exportar: ${err.message}`);
      });
  };

  container.querySelector('#btn-export-csv')?.addEventListener('click', () => downloadFile('csv'));
  container.querySelector('#btn-export-md')?.addEventListener('click', () => downloadFile('markdown'));
  container.querySelector('#btn-export-json')?.addEventListener('click', () => downloadFile('json'));
}
