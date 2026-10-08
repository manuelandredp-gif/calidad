import { api } from '../api.js';
import { store } from '../state.js';
import { toast } from '../toast.js';
import { app } from '../app.js';

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

export class SpecModalHandler {
  constructor(manager) {
    this.manager = manager;
    this.project = null;
    this.previewReady = false;
    this.busy = false;
  }

  setup() {
    document.getElementById('btn-spec-preview').addEventListener('click', () => this.preview());
    document.getElementById('form-project-spec').addEventListener('submit', (event) => {
      event.preventDefault();
      this.generate();
    });
    for (const id of ['spec-description', 'spec-depth']) {
      document.getElementById(id).addEventListener('input', () => {
        this.previewReady = false;
        document.getElementById('btn-spec-generate').disabled = true;
        document.getElementById('spec-preview-result').textContent = 'Analiza la descripción para actualizar la vista previa.';
      });
    }
  }

  open(project) {
    if (this.busy) return;
    this.project = project;
    this.previewReady = false;
    document.getElementById('spec-project-name').textContent = project.name;
    document.getElementById('spec-description').value = project.description || '';
    document.getElementById('spec-depth').value = 'standard';
    document.getElementById('spec-preview-result').textContent = 'Describe actores, funciones y reglas del proyecto para generar una propuesta de pruebas.';
    document.getElementById('btn-spec-generate').disabled = true;
    this.manager.open('modal-project-spec');
    if ((project.description || '').trim().length >= 10) this.preview();
  }

  payload() {
    return {
      name: this.project.name,
      description: document.getElementById('spec-description').value.trim(),
      depth: document.getElementById('spec-depth').value,
      includeNonFunctional: true,
      includeEntityCrud: true,
    };
  }

  setBusy(value) {
    this.busy = value;
    for (const id of ['spec-description', 'spec-depth', 'btn-spec-preview']) {
      document.getElementById(id).disabled = value;
    }
    document.getElementById('btn-spec-generate').disabled = value || !this.previewReady;
  }

  async preview() {
    if (this.busy) return;
    const payload = this.payload();
    if (payload.description.length < 10) {
      toast.warning('Escribe una descripción de al menos 10 caracteres.');
      return;
    }
    this.previewReady = false;
    this.setBusy(true);
    const result = document.getElementById('spec-preview-result');
    result.textContent = 'Analizando la descripción…';
    try {
      const response = await api.previewProjectSpec(payload);
      const spec = response.data;
      result.innerHTML = `
        <p><strong>${spec.summary.totalUseCases} casos de uso · ${spec.summary.totalRequirements} requisitos · ${spec.summary.estimatedTestCases} pruebas estimadas</strong></p>
        <p style="margin-top:12px;">Actores: ${escapeHtml(spec.actors.map(actor => actor.label).join(', ') || 'Sin actores específicos')}</p>
        <ul style="padding-left:20px; margin-top:12px;">${spec.useCases.slice(0, 6).map(useCase => `<li>${escapeHtml(useCase.name)}</li>`).join('')}</ul>
        ${spec.warnings.length ? `<p style="margin-top:12px;">${escapeHtml(spec.warnings.join(' '))}</p>` : ''}
        <p style="margin-top:12px;">La propuesta requiere revisión. La generación agrega elementos nuevos y omite los que ya existen.</p>`;
      this.previewReady = true;
    } catch (error) {
      result.textContent = `No se pudo analizar: ${error.message}`;
      toast.error(error.message);
    } finally {
      this.setBusy(false);
    }
  }

  async generate() {
    if (this.busy || !this.previewReady) return;
    this.setBusy(true);
    const button = document.getElementById('btn-spec-generate');
    button.textContent = 'Generando…';
    try {
      const response = await api.generateProjectSpec({ projectId: this.project.id, ...this.payload() });
      const created = response.data.created;
      this.previewReady = false;
      const [projects, requirements, cases] = await Promise.all([
        api.getProjects(), api.getRequirements(this.project.id), api.getProjectTestCases(this.project.id),
      ]);
      const currentProject = projects.data.find(project => project.id === this.project.id) || this.project;
      store.update({
        projects: projects.data,
        activeProjectId: this.project.id,
        activeProject: currentProject,
        requirements: requirements.data,
        activeRequirementId: requirements.data[0]?.id || null,
        activeRequirement: requirements.data[0] || null,
        testCases: cases.data,
      });
      this.manager.close('modal-project-spec');
      app.refresh();
      app.navigate('requirements');
      toast.success(`Generados: ${created.useCases} casos de uso, ${created.requirements} requisitos y ${created.testCases} pruebas.`);
    } catch (error) {
      document.getElementById('spec-preview-result').textContent = `No se pudo completar: ${error.message}. Puedes analizar otra vez y reintentar; los elementos existentes se conservan.`;
      toast.error(error.message);
    } finally {
      button.textContent = 'Generar y guardar';
      this.setBusy(false);
    }
  }
}
