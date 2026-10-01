// ==========================================================================
// Matriz de Trazabilidad 360° (Mejora #46)
// Requisito ↔ Caso de Prueba ↔ Script de Automatización ↔ Riesgo
// ==========================================================================

import { store } from '../state.js';
import { toast } from '../toast.js';

export function renderTraceability360(container) {
  const requirements = store.get('requirements') || [];
  const testCases = store.get('testCases') || [];
  const activeProject = store.get('activeProject');

  // Calcular métricas de trazabilidad 360°
  const totalReqs = requirements.length;
  const reqsWithCases = requirements.filter((r) =>
    testCases.some((tc) => tc.requirementId === r.id)
  ).length;
  const coveragePercent = totalReqs > 0 ? Math.round((reqsWithCases / totalReqs) * 100) : 0;
  const approvedCases = testCases.filter((tc) => tc.status === 'APPROVED').length;

  container.innerHTML = `
    <div class="view-header">
      <div>
        <h2 class="view-title">🌐 Matriz de Trazabilidad 360°</h2>
        <p class="view-subtitle">Alineación integral: Requisito ↔ Caso de Prueba ↔ Automatización Playwright/Cypress ↔ Riesgo</p>
      </div>
      <div class="view-actions">
        <button type="button" class="btn btn-outline" id="btn-export-360-csv">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Exportar Matriz CSV
        </button>
      </div>
    </div>

    <!-- Tarjetas de Trazabilidad -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Requisitos Totales</div>
        <div class="metric-value font-mono">${totalReqs}</div>
        <div class="metric-trend">Historias y especificaciones</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Cobertura 360°</div>
        <div class="metric-value font-mono ${coveragePercent === 100 ? 'text-success' : 'text-warning'}">${coveragePercent}%</div>
        <div class="metric-trend">${reqsWithCases} de ${totalReqs} requisitos con pruebas</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Casos Validados</div>
        <div class="metric-value font-mono">${approvedCases} / ${testCases.length}</div>
        <div class="metric-trend">Aprobados por el líder QA</div>
      </div>
    </div>

    <!-- Tabla de Trazabilidad 360° -->
    <div class="card mt-4">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID Req</th>
              <th>Título Requisito</th>
              <th>ID Caso</th>
              <th>Título del Caso</th>
              <th>Tipo ISTQB</th>
              <th>Estado Revisión</th>
              <th>Script Automatizado</th>
              <th>Nivel de Riesgo</th>
            </tr>
          </thead>
          <tbody>
            ${
              requirements.length === 0
                ? `<tr><td colspan="8" class="text-center py-4 text-muted">No hay requisitos registrados en el proyecto activo.</td></tr>`
                : requirements
                    .map((req) => {
                      const cases = testCases.filter((tc) => tc.requirementId === req.id);
                      if (cases.length === 0) {
                        return `
                          <tr class="row-uncovered">
                            <td class="font-mono font-bold">${req.code}</td>
                            <td>${escapeHtml(req.title)}</td>
                            <td colspan="4" class="text-danger font-medium">⚠️ Sin casos de prueba asociados (Brecha de cobertura)</td>
                            <td><span class="badge badge-subtle">No generado</span></td>
                            <td><span class="badge badge-danger">ALTO</span></td>
                          </tr>
                        `;
                      }

                      return cases
                        .map(
                          (tc, idx) => `
                            <tr>
                              ${
                                idx === 0
                                  ? `<td rowspan="${cases.length}" class="font-mono font-bold align-top">${req.code}</td>
                                     <td rowspan="${cases.length}" class="align-top font-medium">${escapeHtml(req.title)}</td>`
                                  : ''
                              }
                              <td class="font-mono">${tc.code}</td>
                              <td>${escapeHtml(tc.title)}</td>
                              <td><span class="badge badge-subtle">${tc.type}</span></td>
                              <td>
                                <span class="badge ${
                                  tc.status === 'APPROVED'
                                    ? 'badge-success'
                                    : tc.status === 'REJECTED'
                                    ? 'badge-danger'
                                    : 'badge-warning'
                                }">${tc.status}</span>
                              </td>
                              <td>
                                <span class="badge badge-info font-mono">Playwright / Cy</span>
                              </td>
                              <td>
                                <span class="badge ${tc.priority === 'high' ? 'badge-danger' : 'badge-subtle'}">
                                  ${tc.priority === 'high' ? 'CRÍTICO' : 'MEDIO'}
                                </span>
                              </td>
                            </tr>
                          `
                        )
                        .join('');
                    })
                    .join('')
            }
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.querySelector('#btn-export-360-csv')?.addEventListener('click', () => {
    exportToCsv(requirements, testCases, activeProject?.name || 'TestGenAI');
  });
}

function exportToCsv(requirements, testCases, projectName) {
  const headers = ['Req_Code', 'Req_Title', 'Case_Code', 'Case_Title', 'Type', 'Status', 'Priority'];
  const rows = [headers.join(',')];

  requirements.forEach((req) => {
    const cases = testCases.filter((tc) => tc.requirementId === req.id);
    if (cases.length === 0) {
      rows.push(`"${req.code}","${req.title}","N/A","SIN COBERTURA","N/A","PENDIENTE","ALTO"`);
    } else {
      cases.forEach((tc) => {
        rows.push(
          `"${req.code}","${req.title}","${tc.code}","${tc.title}","${tc.type}","${tc.status}","${tc.priority}"`
        );
      });
    }
  });

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `trazabilidad_360_${projectName}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('Matriz 360° exportada en formato CSV');
}

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
