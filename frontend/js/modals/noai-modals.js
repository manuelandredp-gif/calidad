// ==========================================================================
// RF-15 Modal Handlers - Manual Test Case & ISTQB Template Generation
// Creación de casos de prueba SIN dependencia de IA
// ==========================================================================

import { api } from '../api.js';
import { toast } from '../toast.js';
import { store } from '../state.js';

export class NoAiModalHandler {
  constructor(modalManager) {
    this.mm = modalManager;
    this.selectedTemplate = null;
  }

  setup() {
    this._setupManualForm();
    this._setupTemplateModal();
  }

  // ─── Manual Test Case Modal ─────────────────────────────────────

  openManualModal(requirement) {
    document.getElementById('manual-tc-req-id').value = requirement.id;
    document.getElementById('manual-tc-req-label').textContent =
      `Requisito: ${requirement.code} — ${requirement.title}`;

    // Reset form
    const form = document.getElementById('form-manual-testcase');
    form.reset();
    document.getElementById('manual-tc-req-id').value = requirement.id;

    this.mm.open('modal-manual-testcase');
  }

  _setupManualForm() {
    const form = document.getElementById('form-manual-testcase');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const requirementId = document.getElementById('manual-tc-req-id').value;
      const type = document.getElementById('manual-tc-type').value;
      const title = document.getElementById('manual-tc-title').value.trim();
      const priority = document.getElementById('manual-tc-priority').value;
      const expectedResult = document.getElementById('manual-tc-expected').value.trim();
      const testData = document.getElementById('manual-tc-testdata').value.trim() || null;

      // Parse multiline inputs
      const preconditionsRaw = document.getElementById('manual-tc-preconditions').value.trim();
      const stepsRaw = document.getElementById('manual-tc-steps').value.trim();

      const preconditions = preconditionsRaw
        ? preconditionsRaw.split('\n').map((s) => s.trim()).filter(Boolean)
        : [];
      const steps = stepsRaw
        ? stepsRaw.split('\n').map((s) => s.trim()).filter(Boolean)
        : [];

      if (steps.length === 0) {
        toast.error('Se requiere al menos un paso.');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-inline"></span> Creando...';

      try {
        const res = await api.createManualTestCase({
          requirementId,
          type,
          title,
          preconditions,
          steps,
          testData,
          expectedResult,
          priority,
        });

        toast.success(`Caso ${res.data?.code || ''} creado manualmente ✍️`);
        this.mm.close('modal-manual-testcase');

        // Reload test cases
        await this._refreshTestCases(requirementId);
      } catch (err) {
        toast.error(err.message || 'Error al crear el caso manual');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          Crear Caso Manual
        `;
      }
    });
  }

  // ─── Template Generation Modal ──────────────────────────────────

  async openTemplateModal(requirement) {
    document.getElementById('template-req-id').value = requirement.id;
    document.getElementById('template-req-label').textContent =
      `Requisito: ${requirement.code} — ${requirement.title}`;

    this.selectedTemplate = null;
    const confirmBtn = document.getElementById('btn-confirm-template');
    confirmBtn.disabled = true;
    document.getElementById('template-selection-label').textContent = 'Selecciona una categoría';

    // Load templates from API
    const grid = document.getElementById('template-categories-grid');
    grid.innerHTML = '<span class="spinner-inline"></span> Cargando plantillas...';

    try {
      const res = await api.getTemplates();
      const templates = res.data || [];

      grid.innerHTML = templates
        .map(
          (t) => `
          <div class="template-card" data-template-key="${t.key}" style="
            padding:14px;
            border-radius:var(--radius-md);
            border:1px solid var(--border-subtle);
            background:rgba(255,255,255,0.02);
            cursor:pointer;
            transition:all var(--transition-fast);
          ">
            <div style="font-size:1.3rem; margin-bottom:6px;">${t.icon}</div>
            <div style="font-size:0.88rem; font-weight:700; color:var(--text-primary); margin-bottom:4px;">${t.name}</div>
            <div style="font-size:0.76rem; color:var(--text-muted); line-height:1.4; margin-bottom:8px;">${t.description}</div>
            <span class="badge badge-derived">${t.casesCount} casos</span>
          </div>
        `
        )
        .join('');

      // Selection handling
      grid.querySelectorAll('.template-card').forEach((card) => {
        card.addEventListener('click', () => {
          grid.querySelectorAll('.template-card').forEach((c) => {
            c.style.border = '1px solid var(--border-subtle)';
            c.style.background = 'rgba(255,255,255,0.02)';
          });
          card.style.border = '2px solid var(--primary)';
          card.style.background = 'rgba(99, 102, 241, 0.1)';

          this.selectedTemplate = card.getAttribute('data-template-key');
          const tmpl = templates.find((t) => t.key === this.selectedTemplate);
          confirmBtn.disabled = false;
          document.getElementById('template-selection-label').textContent =
            `${tmpl.icon} ${tmpl.name} — ${tmpl.casesCount} casos`;
        });
      });
    } catch (err) {
      grid.innerHTML = `<span style="color:var(--error);">Error al cargar plantillas: ${err.message}</span>`;
    }

    this.mm.open('modal-template-generate');
  }

  _setupTemplateModal() {
    const confirmBtn = document.getElementById('btn-confirm-template');
    if (!confirmBtn) return;

    confirmBtn.addEventListener('click', async () => {
      if (!this.selectedTemplate) return;

      const requirementId = document.getElementById('template-req-id').value;

      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<span class="spinner-inline"></span> Generando...';

      try {
        const res = await api.generateFromTemplate(requirementId, this.selectedTemplate);
        const tmpl = res.data?.templateUsed;

        toast.success(
          `📋 ${tmpl?.casesGenerated || '?'} casos generados desde plantilla "${tmpl?.name || this.selectedTemplate}"`
        );
        this.mm.close('modal-template-generate');

        // Reload test cases
        await this._refreshTestCases(requirementId);
      } catch (err) {
        toast.error(err.message || 'Error al generar desde plantilla');
      } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          Generar Casos
        `;
      }
    });
  }

  // ─── Shared Helpers ─────────────────────────────────────────────

  async _refreshTestCases(requirementId) {
    try {
      // Refresh requirement to get updated case count
      const projectId = store.get('activeProjectId');
      if (projectId) {
        const reqsRes = await api.getRequirements(projectId);
        if (reqsRes.data) {
          store.set('requirements', reqsRes.data);
        }

        const casesRes = await api.getProjectTestCases(projectId);
        if (casesRes.data) {
          store.set('testCases', casesRes.data);
        }
      }

      // Re-render current view
      window.dispatchEvent(new CustomEvent('navigate:refresh'));
    } catch (err) {
      console.warn('[NoAiModalHandler] Error refreshing after creation:', err);
    }
  }
}
