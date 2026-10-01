// ==========================================================================
// Requirement Modals Controller - Modularized Modal Handler
// ==========================================================================

import { api } from '../api.js';
import { store } from '../state.js';
import { toast } from '../toast.js';
import { app } from '../app.js';

export class RequirementModalHandler {
  constructor(modalManager) {
    this.modalManager = modalManager;
  }

  setup() {
    this._setupRequirementForm();
    this._setupEditRequirementForm();
    this._setupImportForm();
  }

  _setupRequirementForm() {
    const form = document.getElementById('form-new-requirement');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const projectId = store.get('activeProjectId');
      if (!projectId) {
        toast.warning('Seleccione un proyecto activo primero');
        return;
      }

      const code = document.getElementById('req-code-input').value.trim();
      const title = document.getElementById('req-title-input').value.trim();
      const description = document.getElementById('req-desc-input').value.trim();
      const acceptanceCriteria = document.getElementById('req-criteria-input').value.trim();

      if (!code || !title || !acceptanceCriteria) {
        toast.warning('Código, título y criterios de aceptación son obligatorios');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Guardando...';

      try {
        await api.createRequirement({
          projectId,
          code,
          title,
          description,
          acceptanceCriteria,
        });

        toast.success(`Requisito ${code} creado correctamente`);
        form.reset();
        this.modalManager.close('modal-new-requirement');

        const reqRes = await api.getRequirements(projectId);
        if (reqRes.data) {
          store.set('requirements', reqRes.data);
          if (reqRes.data.length > 0 && !store.get('activeRequirement')) {
            store.set('activeRequirement', reqRes.data[0]);
            store.set('activeRequirementId', reqRes.data[0].id);
          }
        }
        app.refresh();
      } catch (err) {
        toast.error(`Error: ${err.message}`);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Guardar Requisito';
      }
    });
  }

  _setupEditRequirementForm() {
    const form = document.getElementById('form-edit-requirement');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-req-id').value;
      const title = document.getElementById('edit-req-title').value.trim();
      const description = document.getElementById('edit-req-desc').value.trim();
      const acceptanceCriteria = document.getElementById('edit-req-criteria').value.trim();

      if (!title || !acceptanceCriteria) {
        toast.warning('Título y criterios de aceptación son obligatorios');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Actualizando...';

      try {
        await api.updateRequirement(id, {
          title,
          description,
          acceptanceCriteria,
        });

        toast.success('Requisito actualizado (nueva versión registrada)');
        this.modalManager.close('modal-edit-requirement');

        const projectId = store.get('activeProjectId');
        if (projectId) {
          const reqRes = await api.getRequirements(projectId);
          if (reqRes.data) {
            store.set('requirements', reqRes.data);
            const updated = reqRes.data.find((r) => r.id === id);
            if (updated) store.set('activeRequirement', updated);
          }
        }
      } catch (err) {
        toast.error(`Error al actualizar requisito: ${err.message}`);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Actualizar Requisito';
      }
    });
  }

  _setupImportForm() {
    const form = document.getElementById('form-import-requirements');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const projectId = store.get('activeProjectId');
      if (!projectId) {
        toast.warning('Seleccione un proyecto activo');
        return;
      }

      const rawText = document.getElementById('import-text-input').value.trim();
      if (!rawText) {
        toast.warning('Ingrese el texto o contenido JSON/CSV a importar');
        return;
      }

      let parsedRequirements = [];
      try {
        if (rawText.startsWith('[') || rawText.startsWith('{')) {
          const json = JSON.parse(rawText);
          parsedRequirements = Array.isArray(json) ? json : [json];
        } else {
          const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
          const startIndex = lines[0].toLowerCase().includes('código') || lines[0].toLowerCase().includes('code') ? 1 : 0;

          for (let i = startIndex; i < lines.length; i++) {
            const parts = lines[i].split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
            if (parts.length >= 3) {
              parsedRequirements.push({
                code: parts[0] || `REQ-${i + 1}`,
                title: parts[1] || 'Sin título',
                description: parts[2] || '',
                acceptanceCriteria: parts[3] || parts[2] || 'Criterios por defecto',
              });
            }
          }
        }
      } catch {
        toast.error('Formato inválido. Ingrese JSON válido o CSV separado por comas');
        return;
      }

      if (parsedRequirements.length === 0) {
        toast.warning('No se identificaron requisitos válidos en el texto');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Importando...';

      try {
        const res = await api.importRequirements(projectId, parsedRequirements);
        toast.success(`Se importaron ${res.data?.count || parsedRequirements.length} requisitos con éxito`);
        form.reset();
        this.modalManager.close('modal-import-requirements');

        const reqRes = await api.getRequirements(projectId);
        if (reqRes.data) {
          store.set('requirements', reqRes.data);
        }
      } catch (err) {
        toast.error(`Error de importación: ${err.message}`);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Importar Requisitos';
      }
    });
  }

  populateEditRequirement(req) {
    document.getElementById('edit-req-id').value = req.id;
    document.getElementById('edit-req-code-display').value = req.code;
    document.getElementById('edit-req-title').value = req.title || '';
    document.getElementById('edit-req-desc').value = req.description || '';
    document.getElementById('edit-req-criteria').value = req.acceptanceCriteria || '';
    this.modalManager.open('modal-edit-requirement');
  }
}
