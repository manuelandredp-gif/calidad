// ==========================================================================
// Use Cases View - TestGenAI (MVP Real)
// Casos de uso generados por el motor determinista (sin IA) a partir del
// tema y la descripción del proyecto. Vista maestro-detalle.
// ==========================================================================

import { store } from '../state.js';
import { api } from '../api.js';
import { toast } from '../toast.js';

export async function renderUseCases(container) {
  const project = store.get('activeProject');
  const projectId = store.get('activeProjectId');

  if (!projectId) {
    container.innerHTML = `
      <div class="card" style="text-align:center; padding:50px 20px;">
        <p style="color:var(--text-muted);">Seleccione o cree un proyecto para visualizar sus casos de uso.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:16px;">
      <div>
        <h2 style="font-size:1.35rem; font-weight:700;">Casos de Uso del Sistema</h2>
        <p style="font-size:0.84rem; color:var(--text-secondary);">
          Generados por el motor determinista a partir del tema y la descripción del proyecto${project ? ` · <strong>${escapeHtml(project.name)}</strong>` : ''}.
        </p>
      </div>
      <button class="btn btn-primary btn-sm" id="btn-generate-spec">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
        Generar Especificación
      </button>
    </div>

    <div id="use-cases-container">
      <div class="card" style="text-align:center; padding:40px;">
        <span class="spinner-inline"></span>
        <p style="color:var(--text-muted); margin-top:10px; font-size:0.85rem;">Cargando casos de uso...</p>
      </div>
    </div>
  `;

  container.querySelector('#btn-generate-spec')?.addEventListener('click', () => {
    generateSpecForProject(project, projectId, container);
  });

  loadUseCases(projectId, container);
}

async function generateSpecForProject(project, projectId, container) {
  const description = (project?.description || '').trim();
  if (description.length < 10) {
    toast.warning('El proyecto necesita una descripción de al menos 10 caracteres. Edítalo y vuelve a intentar.');
    return;
  }
  const btn = container.querySelector('#btn-generate-spec');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Generando...'; }
  try {
    const gen = await api.generateSpec({ projectId, name: project.name, description, depth: 'standard' });
    const c = gen.data?.created || {};
    toast.success(`Se generaron ${c.useCases || 0} casos de uso, ${c.requirements || 0} requisitos y ${c.testCases || 0} casos de prueba.`);
    // Recargar requisitos y casos de prueba en el store
    try { const r = await api.getRequirements(projectId); store.set('requirements', r.data || []); } catch { /* noop */ }
    try { const t = await api.getProjectTestCases(projectId); store.set('testCases', t.data || []); } catch { /* noop */ }
    loadUseCases(projectId, container);
  } catch (err) {
    toast.error(`Error al generar especificación: ${err.message}`);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '⚡ Generar Especificación'; }
  }
}

async function loadUseCases(projectId, container) {
  const host = container.querySelector('#use-cases-container');
  try {
    const res = await api.getProjectUseCases(projectId);
    const useCases = res.data || [];
    renderMasterDetail(useCases, host, container);
  } catch (err) {
    if (host) {
      host.innerHTML = `<div class="card" style="text-align:center; padding:40px; color:var(--error);">Error al cargar casos de uso: ${escapeHtml(err.message)}</div>`;
    }
  }
}

function renderMasterDetail(useCases, host, container) {
  if (!host) return;

  if (useCases.length === 0) {
    host.innerHTML = `
      <div class="card" style="text-align:center; padding:48px 20px;">
        <p style="color:var(--text-muted); margin-bottom:16px;">Este proyecto aún no tiene casos de uso generados.</p>
        <button class="btn btn-primary" id="btn-generate-empty">⚡ Generar Especificación ahora</button>
      </div>
    `;
    host.querySelector('#btn-generate-empty')?.addEventListener('click', () => {
      container.querySelector('#btn-generate-spec')?.click();
    });
    return;
  }

  host.innerHTML = `
    <div class="use-cases-grid" style="display:grid; grid-template-columns:minmax(260px, 340px) 1fr; gap:16px; align-items:start;">
      <div class="card" style="padding:12px; max-height:72vh; overflow:auto;">
        <div style="font-size:0.72rem; text-transform:uppercase; color:var(--text-muted); font-weight:700; letter-spacing:0.5px; margin:4px 6px 10px;">Listado · ${useCases.length}</div>
        <div id="uc-list" style="display:flex; flex-direction:column; gap:8px;"></div>
      </div>
      <div class="card" id="uc-detail" style="padding:22px; min-height:300px;"></div>
    </div>
  `;

  const listEl = host.querySelector('#uc-list');
  listEl.innerHTML = useCases
    .map(
      (uc, i) => `
      <button class="uc-list-item" data-idx="${i}" style="text-align:left; background:var(--bg-elevated,#161a24); border:1px solid var(--border,#272c3a); border-radius:10px; padding:12px; cursor:pointer; width:100%; transition:border-color .15s;">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px;">
          <span class="test-case-code">${escapeHtml(uc.code)}</span>
          <span class="badge ${priorityBadge(uc.priority)}" style="font-size:0.65rem;">${escapeHtml((uc.priority || 'medium').toUpperCase())}</span>
        </div>
        <div style="font-weight:600; font-size:0.86rem; line-height:1.25; margin-bottom:4px;">${escapeHtml(uc.name)}</div>
        <div style="font-size:0.74rem; color:var(--text-muted);">👤 ${escapeHtml(uc.actor || '—')} · ${(uc.requirements || []).length} req.</div>
      </button>
    `
    )
    .join('');

  const detailEl = host.querySelector('#uc-detail');
  const select = (idx) => {
    listEl.querySelectorAll('.uc-list-item').forEach((el) => {
      el.style.borderColor = el.getAttribute('data-idx') === String(idx) ? 'var(--primary)' : 'var(--border,#272c3a)';
    });
    renderDetail(useCases[idx], detailEl);
  };

  listEl.querySelectorAll('.uc-list-item').forEach((el) => {
    el.addEventListener('click', () => select(Number(el.getAttribute('data-idx'))));
  });

  select(0);
}

function renderDetail(uc, el) {
  if (!el || !uc) return;
  const pre = asArray(uc.preconditions);
  const post = asArray(uc.postconditions);
  const main = asArray(uc.mainFlow);
  const alt = asArray(uc.alternativeFlows);
  const exc = asArray(uc.exceptionFlows);

  el.innerHTML = `
    <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:10px;">
      <span class="test-case-code">${escapeHtml(uc.code)}</span>
      <span class="badge badge-outline">👤 ${escapeHtml(uc.actor || '—')}</span>
      <span class="badge badge-outline">${escapeHtml(uc.moduleName || '')}</span>
      <span class="badge ${priorityBadge(uc.priority)}">PRIORIDAD ${escapeHtml((uc.priority || 'medium').toUpperCase())}</span>
    </div>
    <h3 style="font-size:1.15rem; font-weight:700; line-height:1.3; margin-bottom:8px;">${escapeHtml(uc.name)}</h3>
    <p style="font-size:0.88rem; color:var(--text-secondary); margin-bottom:18px;">${escapeHtml(uc.description || '')}</p>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-bottom:18px;">
      ${columnBlock('PRECONDICIONES', pre.map((p) => `<li>${escapeHtml(p)}</li>`).join('') || '<li style="color:var(--text-muted);">—</li>')}
      ${columnBlock('POSTCONDICIONES', post.map((p) => `<li>${escapeHtml(p)}</li>`).join('') || '<li style="color:var(--text-muted);">—</li>')}
    </div>

    ${sectionBlock('FLUJO PRINCIPAL', `<ol style="margin:0; padding-left:20px; display:flex; flex-direction:column; gap:4px;">${main.map((s) => `<li>${escapeHtml(stepText(s))}</li>`).join('') || '<li style="color:var(--text-muted);">—</li>'}</ol>`)}

    ${alt.length ? sectionBlock('FLUJOS ALTERNATIVOS', alt.map((f) => flowCard(f, 'alt')).join('')) : ''}
    ${exc.length ? sectionBlock('FLUJOS DE EXCEPCIÓN', exc.map((f) => flowCard(f, 'exc')).join('')) : ''}

    ${(uc.requirements || []).length ? sectionBlock('REQUISITOS DERIVADOS', `<div style="display:flex; flex-wrap:wrap; gap:6px;">${uc.requirements.map((r) => `<span class="badge badge-outline" title="${escapeHtml(r.title)}">${escapeHtml(r.code)} · ${r._count?.testCases ?? 0} casos</span>`).join('')}</div>`) : ''}
  `;
}

function columnBlock(title, inner) {
  return `
    <div>
      <div style="font-size:0.72rem; text-transform:uppercase; color:var(--text-muted); font-weight:700; letter-spacing:0.5px; margin-bottom:6px;">${title}</div>
      <ul style="margin:0; padding-left:18px; font-size:0.85rem; display:flex; flex-direction:column; gap:3px;">${inner}</ul>
    </div>
  `;
}

function sectionBlock(title, inner) {
  return `
    <div style="margin-bottom:18px;">
      <div style="font-size:0.72rem; text-transform:uppercase; color:var(--text-muted); font-weight:700; letter-spacing:0.5px; margin-bottom:8px;">${title}</div>
      <div style="font-size:0.85rem;">${inner}</div>
    </div>
  `;
}

function flowCard(flow, kind) {
  const border = kind === 'exc' ? 'rgba(239,68,68,.4)' : 'rgba(96,165,250,.35)';
  const label = flow.name || flow.title || (kind === 'exc' ? 'Excepción' : 'Alternativo');
  const cond = flow.condition || flow.trigger;
  const steps = asArray(flow.steps);
  const expected = flow.expectedError || flow.expectedResult;
  return `
    <div style="border:1px solid ${border}; border-radius:10px; padding:12px 14px; margin-bottom:8px; background:var(--bg-elevated,#161a24);">
      <div style="font-weight:600; margin-bottom:4px;">${kind === 'exc' ? '⚠️' : '⤴'} ${escapeHtml(label)}</div>
      ${cond ? `<div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:6px;">${kind === 'exc' ? 'Disparador' : 'Condición'}: ${escapeHtml(cond)}</div>` : ''}
      <ol style="margin:0; padding-left:18px; display:flex; flex-direction:column; gap:3px;">${steps.map((s) => `<li>${escapeHtml(stepText(s))}</li>`).join('')}</ol>
      ${expected ? `<div style="font-size:0.8rem; color:${kind === 'exc' ? 'var(--error,#f87171)' : 'var(--text-secondary)'}; margin-top:6px;">${kind === 'exc' ? 'Error esperado' : 'Resultado'}: ${escapeHtml(expected)}</div>` : ''}
    </div>
  `;
}

function stepText(s) {
  if (s == null) return '';
  if (typeof s === 'string') return s;
  return s.text || s.step || s.action || s.description || JSON.stringify(s);
}

function asArray(v) {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  if (typeof v === 'string') {
    try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; }
  }
  return [];
}

function priorityBadge(p) {
  const v = (p || 'medium').toLowerCase();
  if (v === 'high') return 'badge-pending';
  if (v === 'low') return 'badge-outline';
  return 'badge-approved';
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
