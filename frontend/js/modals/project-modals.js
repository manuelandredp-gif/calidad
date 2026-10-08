// ==========================================================================
// Project Modals Controller - Modularized Modal Handler
// ==========================================================================

import { api } from '../api.js';
import { store } from '../state.js';
import { toast } from '../toast.js';
import { app } from '../app.js';

export class ProjectModalHandler {
  constructor(modalManager) {
    this.modalManager = modalManager;
  }

  setup() {
    this._setupProjectForm();
    this._setupEditProjectForm();
  }

  _setupProjectForm() {
    const form = document.getElementById('form-new-project');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('project-name-input').value.trim();
      const description = document.getElementById('project-desc-input').value.trim();
      const depth = document.getElementById('project-depth-input')?.value || 'standard';
      const autoGen = document.getElementById('project-autogen-input')?.checked ?? false;

      if (!name) {
        toast.warning('El nombre del proyecto es obligatorio');
        return;
      }

      if (autoGen && description.length < 10) {
        toast.warning('Para generar la especificación, describe el proyecto con al menos 10 caracteres.');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Creando...';

      try {
        const res = await api.createProject({ name, description });
        const projectId = res.data.id;

        // Generación determinista de casos de uso, requisitos y casos de prueba (sin IA)
        if (autoGen) {
          submitBtn.innerHTML = '<span class="spinner"></span> Generando especificación...';
          try {
            const gen = await api.generateSpec({ projectId, name, description, depth });
            const c = gen.data?.created || {};
            toast.success(
              `Proyecto creado. Se generaron ${c.useCases || 0} casos de uso, ${c.requirements || 0} requisitos y ${c.testCases || 0} casos de prueba.`
            );
          } catch (genErr) {
            toast.warning(`Proyecto creado, pero la generación falló: ${genErr.message}`);
          }
        } else {
          toast.success(`Proyecto "${name}" creado exitosamente`);
        }

        form.reset();
        this.modalManager.close('modal-new-project');

        // Refrescar proyectos y cargar datos generados del proyecto activo
        const projRes = await api.getProjects();
        if (projRes.data) {
          store.set('projects', projRes.data);
          store.set('activeProjectId', projectId);
          store.set('activeProject', projRes.data.find((p) => p.id === projectId) || res.data);
        }
        try {
          const reqRes = await api.getRequirements(projectId);
          store.set('requirements', reqRes.data || []);
          store.set('activeRequirement', (reqRes.data && reqRes.data[0]) || null);
        } catch { store.set('requirements', []); }
        try {
          const tcRes = await api.getProjectTestCases(projectId);
          store.set('testCases', tcRes.data || []);
        } catch { store.set('testCases', []); }

        app.refresh();
        if (autoGen) app.navigate('use-cases');
      } catch (err) {
        toast.error(`Error al crear proyecto: ${err.message}`);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Crear Proyecto';
      }
    });
  }

  _setupEditProjectForm() {
    const form = document.getElementById('form-edit-project');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-project-id').value;
      const name = document.getElementById('edit-project-name').value.trim();
      const description = document.getElementById('edit-project-desc').value.trim();
      const status = document.getElementById('edit-project-status').value;

      if (!name) {
        toast.warning('El nombre del proyecto es obligatorio');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Guardando...';

      try {
        await api.updateProject(id, { name, description, status });
        toast.success(`Proyecto "${name}" actualizado`);
        this.modalManager.close('modal-edit-project');

        const projRes = await api.getProjects();
        if (projRes.data) {
          store.set('projects', projRes.data);
          const activeProj = projRes.data.find((p) => p.id === id);
          if (activeProj) store.set('activeProject', activeProj);
        }
      } catch (err) {
        toast.error(`Error al actualizar proyecto: ${err.message}`);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Guardar Cambios';
      }
    });
  }

  populateEditProject(p) {
    document.getElementById('edit-project-id').value = p.id;
    document.getElementById('edit-project-name').value = p.name || '';
    document.getElementById('edit-project-desc').value = p.description || '';
    document.getElementById('edit-project-status').value = p.status || 'ACTIVE';
    this.modalManager.open('modal-edit-project');
  }
}
