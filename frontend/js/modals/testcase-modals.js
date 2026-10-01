// ==========================================================================
// TestCase Modals Controller - Modularized Modal Handler
// ==========================================================================

import { api } from '../api.js';
import { store } from '../state.js';
import { toast } from '../toast.js';

export class TestCaseModalHandler {
  constructor(modalManager) {
    this.modalManager = modalManager;
  }

  setup() {
    this._setupTestCaseEditForm();
    this._setupRejectForm();
    this._setupManualTestCaseForm();
  }

  _setupTestCaseEditForm() {
    const form = document.getElementById('form-edit-testcase');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-tc-id').value;
      const title = document.getElementById('edit-tc-title').value.trim();
      const testData = document.getElementById('edit-tc-testdata').value.trim();
      const expectedResult = document.getElementById('edit-tc-expected').value.trim();
      const priority = document.getElementById('edit-tc-priority').value;

      const rawSteps = document.getElementById('edit-tc-steps').value.trim();
      const steps = rawSteps.split('\n').map((s) => s.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean);

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Guardando...';

      try {
        await api.updateTestCase(id, {
          title,
          testData,
          expectedResult,
          priority,
          steps,
        });

        toast.success('Caso de prueba modificado y registrado');
        this.modalManager.close('modal-edit-testcase');

        const reqId = store.get('activeRequirementId');
        if (reqId) {
          const tcRes = await api.getTestCases(reqId);
          if (tcRes.data) store.set('testCases', tcRes.data);
        }
      } catch (err) {
        toast.error(`Error: ${err.message}`);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Guardar Cambios';
      }
    });
  }

  _setupRejectForm() {
    const form = document.getElementById('form-reject-testcase');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('reject-tc-id').value;
      const reason = document.getElementById('reject-reason-select').value;
      const notes = document.getElementById('reject-notes-input').value.trim();

      const comments = `${reason}: ${notes}`;

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Rechazando...';

      try {
        await api.reviewTestCase(id, {
          reviewStatus: 'REJECTED',
          comments,
        });

        toast.warning('Caso rechazado y marcado en auditoría');
        this.modalManager.close('modal-reject-testcase');
        form.reset();

        const reqId = store.get('activeRequirementId');
        if (reqId) {
          const tcRes = await api.getTestCases(reqId);
          if (tcRes.data) store.set('testCases', tcRes.data);
        }
      } catch (err) {
        toast.error(`Error: ${err.message}`);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Confirmar Rechazo';
      }
    });
  }

  _setupManualTestCaseForm() {
    const form = document.getElementById('form-manual-testcase');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const requirementId = store.get('activeRequirementId');
      if (!requirementId) {
        toast.warning('Seleccione un requisito primero');
        return;
      }

      const title = document.getElementById('manual-tc-title').value.trim();
      const type = document.getElementById('manual-tc-type').value;
      const priority = document.getElementById('manual-tc-priority').value;
      const testData = document.getElementById('manual-tc-data').value.trim();
      const expectedResult = document.getElementById('manual-tc-expected').value.trim();

      const rawPrecond = document.getElementById('manual-tc-precond').value.trim();
      const preconditions = rawPrecond.split('\n').map((s) => s.trim()).filter(Boolean);

      const rawSteps = document.getElementById('manual-tc-steps').value.trim();
      const steps = rawSteps.split('\n').map((s) => s.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean);

      if (!title || !expectedResult || steps.length === 0) {
        toast.warning('Título, pasos y resultado esperado son requeridos');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Guardando...';

      try {
        await api.createTestCaseManual({
          requirementId,
          title,
          type,
          priority,
          preconditions,
          steps,
          testData,
          expectedResult,
          evidenceStatus: 'derived',
          evidenceText: 'Diseño manual directo por analista QA',
        });

        toast.success('Caso de prueba manual registrado exitosamente');
        form.reset();
        this.modalManager.close('modal-manual-testcase');

        const tcRes = await api.getTestCases(requirementId);
        if (tcRes.data) store.set('testCases', tcRes.data);
      } catch (err) {
        toast.error(`Error: ${err.message}`);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Crear Caso Manual';
      }
    });
  }

  populateEditTestCase(tc) {
    document.getElementById('edit-tc-id').value = tc.id;
    document.getElementById('edit-tc-title').value = tc.title || '';
    document.getElementById('edit-tc-priority').value = tc.priority || 'medium';
    document.getElementById('edit-tc-testdata').value = tc.testData || '';
    document.getElementById('edit-tc-expected').value = tc.expectedResult || '';

    const steps = Array.isArray(tc.steps) ? tc.steps.join('\n') : (tc.steps || '');
    document.getElementById('edit-tc-steps').value = steps;

    this.modalManager.open('modal-edit-testcase');
  }

  populateRejectTestCase(tc) {
    document.getElementById('reject-tc-id').value = tc.id;
    document.getElementById('reject-tc-code-label').textContent = `${tc.code}: ${tc.title}`;
    this.modalManager.open('modal-reject-testcase');
  }
}
