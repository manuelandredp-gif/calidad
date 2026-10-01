// ==========================================================================
// AI Generation Modal Controller - Modularized Modal Handler
// ==========================================================================

import { api } from '../api.js';
import { store } from '../state.js';
import { toast } from '../toast.js';

export class AiModalHandler {
  constructor(modalManager) {
    this.modalManager = modalManager;
  }

  setup() {
    this._setupAiGenerateForm();
  }

  _setupAiGenerateForm() {
    const form = document.getElementById('form-ai-generate');
    if (!form) return;

    const providerSelect = document.getElementById('ai-gen-provider');
    const modelSelect = document.getElementById('ai-gen-model');
    const tempSelect = document.getElementById('ai-gen-temp');

    if (providerSelect && modelSelect) {
      providerSelect.addEventListener('change', () => {
        const val = providerSelect.value;
        if (val === 'gemini') {
          modelSelect.disabled = false;
          if (tempSelect) tempSelect.disabled = false;
          modelSelect.innerHTML = `
            <option value="gemini-1.5-pro" selected>gemini-1.5-pro (Calidad Máxima)</option>
            <option value="gemini-1.5-flash">gemini-1.5-flash (Ultra Rápido)</option>
          `;
        } else if (val === 'openai') {
          modelSelect.disabled = false;
          if (tempSelect) tempSelect.disabled = false;
          modelSelect.innerHTML = `
            <option value="gpt-4o" selected>gpt-4o (Completo)</option>
            <option value="gpt-4o-mini">gpt-4o-mini (Económico)</option>
          `;
        } else if (val === 'heuristics') {
          modelSelect.disabled = true;
          if (tempSelect) tempSelect.disabled = true;
          modelSelect.innerHTML = `<option value="offline-istqb" selected>Reglas ISTQB Offline (Zero-Token)</option>`;
        }
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const requirementId = document.getElementById('ai-gen-req-id').value;
      const provider = document.getElementById('ai-gen-provider').value;
      const model = document.getElementById('ai-gen-model').value;
      const temperature = parseFloat(document.getElementById('ai-gen-temp').value) || 0.2;
      const clearPreviousUnapproved = document.getElementById('ai-gen-clear-unapproved')?.checked || false;
      const isHeuristic = provider === 'heuristics';

      if (!requirementId) {
        toast.warning('Seleccione un requisito');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const progressBox = document.getElementById('ai-gen-progress');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Generando casos...';
      if (progressBox) progressBox.style.display = 'block';

      try {
        if (isHeuristic) {
          const result = await api.generateHeuristicTests({ requirementId, clearPrevious: clearPreviousUnapproved });
          toast.success(`¡Generados ${result.data?.testCases?.length || 0} casos con Heurísticas ISTQB!`);
        } else {
          const result = await api.generateAiTests({
            requirementId,
            provider,
            model,
            temperature,
            clearPreviousUnapproved,
          });
          const count = result.data?.testCases?.length || 0;
          toast.success(`¡Generados ${count} casos de prueba con ${provider.toUpperCase()}!`);
        }

        this.modalManager.close('modal-ai-generate');
        form.reset();

        // Refresh test cases and requirements
        const tcRes = await api.getTestCases(requirementId);
        if (tcRes.data) {
          store.set('testCases', tcRes.data);
        }

        const projectId = store.get('activeProjectId');
        if (projectId) {
          const reqRes = await api.getRequirements(projectId);
          if (reqRes.data) store.set('requirements', reqRes.data);
        }
      } catch (err) {
        toast.error(`Fallo en generación: ${err.message}`);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Iniciar Generación';
        if (progressBox) progressBox.style.display = 'none';
      }
    });
  }

  openAiGenModal(requirement) {
    if (!requirement) {
      toast.warning('Seleccione un requisito para generar casos');
      return;
    }
    document.getElementById('ai-gen-req-id').value = requirement.id;
    document.getElementById('ai-gen-req-label').textContent = `${requirement.code} — ${requirement.title}`;
    this.modalManager.open('modal-ai-generate');
  }
}
