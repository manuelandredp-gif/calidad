// ==========================================================================
// Main Application Controller - TestGenAI SPA (MVP Real)
// ==========================================================================

import { api } from './api.js';
import { store } from './state.js';
import { toast } from './toast.js';
import { modals } from './modals.js';

// Views del MVP
import { authView } from './views/auth.js';
import { renderDashboard } from './views/dashboard.js';
import { renderProjects } from './views/projects.js';
import { renderRequirements } from './views/requirements.js';
import { renderTestCases } from './views/testCases.js';
import { renderTraceability } from './views/traceability.js';
import { renderMetrics } from './views/metrics.js';
import { renderSettings } from './views/settings.js';
import { ThemeManager } from './theme-manager.js';
import { AccessibilityManager } from './accessibility.js';
import { eventBus } from './event-bus.js';

class App {
  constructor() {
    this.views = {
      dashboard: renderDashboard,
      projects: renderProjects,
      requirements: renderRequirements,
      'test-cases': renderTestCases,
      traceability: renderTraceability,
      metrics: renderMetrics,
      settings: renderSettings,
    };
    this.currentView = 'dashboard';
  }

  async init() {
    console.log('[TestGenAI] Inicializando aplicación cliente MVP...');

    // Inicializar accesibilidad básica y tema visual
    AccessibilityManager.init();
    ThemeManager.init();

    // Event bus para cambio de vistas
    eventBus.on('view:switch', (viewName) => {
      this.navigate(viewName);
    });

    // Event bus para exportación
    eventBus.on('export:quick', async (format) => {
      const proj = store.get('activeProject');
      if (!proj) {
        toast.warning('Selecciona un proyecto primero para exportar');
        return;
      }
      try {
        toast.info(`Generando exportación en formato ${format.toUpperCase()}...`);
        await api.downloadExport(proj.id, format);
        toast.success(`Exportación ${format.toUpperCase()} descargada con éxito.`);
      } catch (err) {
        toast.error(`Error al exportar: ${err.message}`);
      }
    });

    // Escuchar expiración de sesión desde el cliente API
    window.addEventListener('auth:expired', () => {
      this.logout();
    });

    // Configurar modales
    modals.setupEventListeners();

    // Configurar navegación
    this._setupNavigation();

    // Configurar selector de proyecto
    this._setupProjectSelector();

    // Configurar toggle móvil
    this._setupSidebarToggle();

    // Configurar logout
    this._setupLogout();

    // Configurar vista de autenticación
    authView.init((user) => {
      this._onAuthSuccess(user);
    });

    // Suscripción a casos de prueba para actualizar badge de pendientes
    store.subscribe('testCases', (cases) => {
      this._updatePendingBadge(cases);
    });

    // Comprobación de salud del backend
    this._checkBackendHealth();

    // Comprobar sesión actual y arrancar
    const isAuthenticated = await this._bootstrapAuth();
    if (isAuthenticated) {
      await this._loadInitialData();
      this.navigate(this.currentView);
    }
  }

  _setupLogout() {
    const logoutBtn = document.getElementById('btn-sidebar-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await this.logout();
      });
    }
  }

  async logout() {
    await api.logout();
    store.set('user', null);
    store.set('projects', []);
    store.set('requirements', []);
    store.set('testCases', []);
    store.set('activeProjectId', null);
    store.set('activeProject', null);
    toast.info('Sesión cerrada correctamente');
    authView.show();
  }

  async _onAuthSuccess(user) {
    store.set('user', user);
    this._updateUserUI(user);
    authView.hide();
    await this._loadInitialData();
    this.navigate(this.currentView || 'dashboard');
  }

  async _bootstrapAuth() {
    try {
      const user = await api.getMe();
      if (user) {
        store.set('user', user);
        this._updateUserUI(user);
        authView.hide();
        return true;
      }
    } catch {
      // Sesión no iniciada o inválida
    }

    authView.show();
    return false;
  }

  _updateUserUI(user) {
    if (!user) return;
    const nameEl = document.getElementById('sidebar-user-name');
    const avatarEl = document.getElementById('sidebar-user-avatar');
    const roleEl = document.getElementById('sidebar-user-role');
    if (nameEl) nameEl.textContent = user.fullName || user.email;
    if (avatarEl) avatarEl.textContent = (user.fullName || user.email || 'Q')[0].toUpperCase();
    if (roleEl) roleEl.textContent = user.role || 'QA_TESTER';
  }

  async _loadInitialData() {
    try {
      const projRes = await api.getProjects();
      const projects = projRes.data || [];
      store.set('projects', projects);

      if (projects.length > 0) {
        const activeProj = projects[0];
        store.set('activeProjectId', activeProj.id);
        store.set('activeProject', activeProj);

        this._updateProjectSelectDropdown(projects, activeProj.id);

        const reqRes = await api.getRequirements(activeProj.id);
        const requirements = reqRes.data || [];
        store.set('requirements', requirements);

        if (requirements.length > 0) {
          const activeReq = requirements[0];
          store.set('activeRequirementId', activeReq.id);
          store.set('activeRequirement', activeReq);
        } else {
          store.set('activeRequirementId', null);
          store.set('activeRequirement', null);
        }

        try {
          const tcRes = await api.getProjectTestCases(activeProj.id);
          const allCases = tcRes.data || [];
          store.set('testCases', allCases);
          this._updatePendingBadge(allCases);
        } catch {
          store.set('testCases', []);
          this._updatePendingBadge([]);
        }

        try {
          const metRes = await api.getMetrics(activeProj.id);
          if (metRes.data) store.set('metrics', metRes.data);
        } catch {
          store.set('metrics', null);
        }
      } else {
        store.set('activeProjectId', null);
        store.set('activeProject', null);
        store.set('requirements', []);
        store.set('testCases', []);
        store.set('metrics', null);
        this._updateProjectSelectDropdown([], null);
      }
    } catch (err) {
      console.warn('Error al cargar datos iniciales:', err);
    }
  }

  _updatePendingBadge(cases) {
    const badge = document.getElementById('sidebar-pending-badge');
    if (!badge) return;
    const testCases = cases || store.get('testCases') || [];
    const pendingCount = testCases.filter((c) => c.status === 'PENDING').length;
    if (pendingCount > 0) {
      badge.textContent = String(pendingCount);
      badge.title = `${pendingCount} casos pendientes por revisar`;
      badge.style.display = '';
    } else {
      badge.textContent = '';
      badge.style.display = 'none';
    }
  }

  _setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-view]');
    navItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.getAttribute('data-view');
        this.navigate(view);

        const sidebar = document.querySelector('.sidebar');
        if (sidebar && window.innerWidth <= 1024) {
          sidebar.classList.remove('open');
        }
      });
    });
  }

  _setupProjectSelector() {
    const select = document.getElementById('project-select');
    if (!select) return;

    select.addEventListener('change', async (e) => {
      const projId = e.target.value;
      const projects = store.get('projects') || [];
      const selected = projects.find((p) => p.id === projId);

      if (selected) {
        store.set('activeProjectId', projId);
        store.set('activeProject', selected);
        toast.info(`Proyecto activo: ${selected.name}`);

        try {
          const reqRes = await api.getRequirements(projId);
          const requirements = reqRes.data || [];
          store.set('requirements', requirements);

          if (requirements.length > 0) {
            store.set('activeRequirementId', requirements[0].id);
            store.set('activeRequirement', requirements[0]);
          } else {
            store.set('activeRequirementId', null);
            store.set('activeRequirement', null);
          }

          try {
            const allTcRes = await api.getProjectTestCases(projId);
            const allCases = allTcRes.data || [];
            store.set('testCases', allCases);
            this._updatePendingBadge(allCases);
          } catch {
            store.set('testCases', []);
            this._updatePendingBadge([]);
          }

          this.navigate(this.currentView);
        } catch (err) {
          toast.error(`Error al cargar datos del proyecto: ${err.message}`);
        }
      }
    });
  }

  _updateProjectSelectDropdown(projects, activeId) {
    const select = document.getElementById('project-select');
    if (!select) return;

    if (projects.length === 0) {
      select.innerHTML = '<option value="">Sin proyectos registrados</option>';
      return;
    }

    select.innerHTML = projects
      .map((p) => `<option value="${p.id}" ${p.id === activeId ? 'selected' : ''}>${p.name}</option>`)
      .join('');
  }

  _setupSidebarToggle() {
    const toggleBtn = document.getElementById('btn-toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }
  }

  async _checkBackendHealth() {
    const dot = document.getElementById('backend-status-dot');
    const text = document.getElementById('backend-status-text');

    try {
      const res = await api.getHealth();
      if (res.status === 'online') {
        if (dot) dot.classList.remove('offline');
        if (text) text.textContent = 'Conectado';
      }
    } catch {
      if (dot) dot.classList.add('offline');
      if (text) text.textContent = 'Sin conexión';
    }
  }

  navigate(viewName) {
    if (!this.views[viewName]) {
      viewName = 'dashboard';
    }

    this.currentView = viewName;
    store.set('currentView', viewName);

    // Actualizar nav active
    document.querySelectorAll('.nav-item[data-view]').forEach((item) => {
      if (item.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Actualizar título
    const titleEl = document.getElementById('current-view-title');
    const titles = {
      dashboard: 'Inicio / Resumen del Proyecto',
      projects: 'Gestión de Proyectos',
      requirements: 'Requisitos Funcionales',
      'test-cases': 'Casos de Prueba & Revisión',
      traceability: 'Matriz de Trazabilidad y Cobertura',
      metrics: 'Métricas Reales e Historial de IA',
      settings: 'Configuración del Sistema',
    };
    if (titleEl) titleEl.textContent = titles[viewName] || 'TestGenAI';

    const contentArea = document.getElementById('content-area');
    if (contentArea) {
      contentArea.innerHTML = '';
      this.views[viewName](contentArea);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  refresh() {
    const projects = store.get('projects') || [];
    const activeId = store.get('activeProjectId');
    this._updateProjectSelectDropdown(projects, activeId);
    this.navigate(this.currentView);
  }
}

export const app = new App();

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
