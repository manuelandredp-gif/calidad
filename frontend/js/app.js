// ==========================================================================
// Main Application Controller - TestGenAI SPA
// ==========================================================================

import { api } from './api.js';
import { store } from './state.js';
import { toast } from './toast.js';
import { modals } from './modals.js';

// Views
import { authView } from './views/auth.js';
import { renderDashboard } from './views/dashboard.js';
import { renderProjects } from './views/projects.js';
import { renderRequirements } from './views/requirements.js';
import { renderTestCases } from './views/testCases.js';
import { renderTraceability } from './views/traceability.js';
import { renderMetrics } from './views/metrics.js';
import { renderSettings } from './views/settings.js';
import { GridReviewView } from './views/grid-review.js';
import { renderTraceability360 } from './views/traceability-360.js';
import { renderRoiCalculator } from './views/roi-calculator.js';
import { renderSplitView } from './views/split-view.js';
import { AccessibilityManager } from './accessibility.js';
import { eventBus } from './event-bus.js';
import { ThemeManager } from './theme-manager.js';
import { CommandPalette } from './command-palette.js';
import { ShortcutsModal } from './shortcuts-modal.js';
import { QACopilot } from './copilot.js';
import { MagneticCursor } from './effects/magnetic-cursor.js';
import { CardTilt } from './effects/card-tilt.js';
import { TextScramble } from './effects/text-scramble.js';
import { FlipCounter } from './effects/flip-counter.js';

class App {
  constructor() {
    this.views = {
      dashboard: renderDashboard,
      projects: renderProjects,
      requirements: renderRequirements,
      'test-cases': renderTestCases,
      'grid-review': (container) => new GridReviewView().render(container),
      'split-view': renderSplitView,
      'traceability-360': renderTraceability360,
      'roi-calculator': renderRoiCalculator,
      traceability: renderTraceability,
      metrics: renderMetrics,
      settings: renderSettings,
    };
    this.currentView = 'dashboard';
  }

  async init() {
    console.log('[TestGenAI] Inicializando aplicación cliente...');

    // Setup Studio Award Custom Cursor & 3D Tilt
    this.cursor = new MagneticCursor();
    this.cursor.init();
    CardTilt.initAll();

    // Setup accessibility WCAG 2.1 AA
    AccessibilityManager.init();

    // Setup Theme Manager (Dark / Light)
    ThemeManager.init();

    // Setup Command Palette (Ctrl + K)
    CommandPalette.init();

    // Setup Shortcuts Reference Modal (?)
    ShortcutsModal.init();

    // Setup QA Copilot Assistant (Ctrl + J)
    QACopilot.init();

    // Setup topbar action buttons
    document.getElementById('btn-topbar-shortcuts')?.addEventListener('click', () => {
      ShortcutsModal.open();
    });

    document.getElementById('btn-topbar-copilot')?.addEventListener('click', () => {
      QACopilot.toggle();
    });

    // Quick export listener
    eventBus.on('export:quick', async (format) => {
      const proj = store.get('activeProject');
      if (!proj) {
        toast.warning('Selecciona un proyecto primero para exportar');
        return;
      }
      try {
        toast.info(`Generando exportación en formato ${format.toUpperCase()}...`);
        const token = api.getToken();
        const res = await fetch(`/api/v1/export/project/${proj.id}?format=${format}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('Fallo en la descarga del archivo');
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ext = format === 'playwright' ? 'spec.ts' : format === 'cypress' ? 'cy.js' : format === 'postman' ? 'postman_collection.json' : 'zip';
        a.download = `${proj.name.toLowerCase().replace(/\s+/g, '_')}_${format}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success(`Exportación ${format.toUpperCase()} descargada con éxito.`);
      } catch (err) {
        toast.error(`Error al exportar: ${err.message}`);
      }
    });

    // Setup event bus listeners
    eventBus.on('view:switch', (viewName) => {
      this.navigate(viewName);
    });

    // Setup modals
    modals.setupEventListeners();


    // Setup navigation listeners
    this._setupNavigation();

    // Setup topbar project selector
    this._setupProjectSelector();

    // Setup mobile sidebar toggle
    this._setupSidebarToggle();

    // Setup "Más opciones" collapsible group
    this._setupNavMore();

    // Setup logout button
    this._setupLogout();

    // Setup auth view handler
    authView.init((user) => {
      this._onAuthSuccess(user);
    });

    // Subscribe to testCases changes to update pending badge
    store.subscribe('testCases', (cases) => {
      this._updatePendingBadge(cases);
    });

    // Backend status check
    this._checkBackendHealth();

    // Check auth & bootstrap
    const isAuthenticated = await this._bootstrapAuth();
    if (isAuthenticated) {
      await this._loadInitialData();
      this.navigate(this.currentView);
    }
  }

  _setupLogout() {
    const logoutBtn = document.getElementById('btn-sidebar-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.logout();
      });
    }
  }

  logout() {
    api.logout();
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
    const token = api.getToken();

    if (!token) {
      // Mostrar pantalla de Login
      authView.show();
      return false;
    }

    try {
      const meRes = await api.getMe();
      if (meRes.data) {
        store.set('user', meRes.data);
        this._updateUserUI(meRes.data);
        authView.hide();
        return true;
      }
    } catch (e) {
      console.warn('Token expirado o inválido:', e);
      api.setToken(null);
      authView.show();
      return false;
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
    if (roleEl) roleEl.textContent = user.role || 'QA_LEAD';
  }

  async _loadInitialData() {
    try {
      // Fetch projects
      const projRes = await api.getProjects();
      const projects = projRes.data || [];
      store.set('projects', projects);

      if (projects.length > 0) {
        const activeProj = projects[0];
        store.set('activeProjectId', activeProj.id);
        store.set('activeProject', activeProj);

        // Populate topbar select
        this._updateProjectSelectDropdown(projects, activeProj.id);

        // Fetch requirements
        const reqRes = await api.getRequirements(activeProj.id);
        const requirements = reqRes.data || [];
        store.set('requirements', requirements);

        if (requirements.length > 0) {
          const activeReq = requirements[0];
          store.set('activeRequirementId', activeReq.id);
          store.set('activeRequirement', activeReq);
        }

        // Fetch all test cases for active project
        try {
          const tcRes = await api.getProjectTestCases(activeProj.id);
          const allCases = tcRes.data || [];
          store.set('testCases', allCases);
          this._updatePendingBadge(allCases);
        } catch {
          if (requirements.length > 0) {
            const tcRes = await api.getTestCases(requirements[0].id);
            store.set('testCases', tcRes.data || []);
            this._updatePendingBadge(tcRes.data || []);
          }
        }

        // Fetch metrics
        try {
          const metRes = await api.getMetrics(activeProj.id);
          if (metRes.data) store.set('metrics', metRes.data);
        } catch {}
      }
    } catch (err) {
      console.error('Error al cargar datos iniciales:', err);
      toast.error('No se pudo conectar con el servidor backend');
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
      badge.style.background = 'rgba(245, 158, 11, 0.2)';
      badge.style.color = '#fbbf24';
      badge.style.border = '1px solid rgba(245, 158, 11, 0.4)';
    } else {
      // Sin pendientes: ocultamos el badge para reducir ruido visual
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

        // Auto close sidebar on mobile
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
        toast.info(`Cambiando al proyecto: ${selected.name}`);

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

          // Fetch all test cases for newly selected project
          try {
            const allTcRes = await api.getProjectTestCases(projId);
            const allCases = allTcRes.data || [];
            store.set('testCases', allCases);
            this._updatePendingBadge(allCases);
          } catch {
            store.set('testCases', []);
            this._updatePendingBadge([]);
          }

          // Re-render current view
          this.navigate(this.currentView);
        } catch (err) {
          toast.error(`Error al cargar proyecto: ${err.message}`);
        }
      }
    });
  }

  _updateProjectSelectDropdown(projects, activeId) {
    const select = document.getElementById('project-select');
    if (!select) return;

    select.innerHTML = projects
      .map((p) => `<option value="${p.id}" ${p.id === activeId ? 'selected' : ''}>${p.name}</option>`)
      .join('');
  }

  _setupNavMore() {
    const toggle = document.getElementById('btn-nav-more');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
      const group = document.getElementById('nav-more-group');
      const willOpen = group?.hasAttribute('hidden');
      this._toggleNavMore(willOpen);
    });
  }

  _toggleNavMore(open) {
    const group = document.getElementById('nav-more-group');
    const toggle = document.getElementById('btn-nav-more');
    if (!group || !toggle) return;
    group.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.classList.toggle('expanded', open);
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

    // Update sidebar nav active state
    document.querySelectorAll('.nav-item[data-view]').forEach((item) => {
      if (item.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update topbar title
    const titleEl = document.getElementById('current-view-title');
    const titles = {
      dashboard: '⚡ Generador Rápido de Casos de Prueba',
      projects: '📁 Gestor de Proyectos',
      requirements: '📁 Requisitos & Módulos del Sistema',
      'test-cases': '📋 Casos de Prueba Generados',
      'grid-review': 'Modo Cuadrícula (Hotkeys)',
      'split-view': 'Pantalla Dividida (Split)',
      'traceability-360': 'Trazabilidad 360°',
      'roi-calculator': 'Calculadora de Ahorro ROI',
      traceability: 'Matriz de Cobertura ISTQB',
      metrics: '📊 Resumen & Métricas',
      settings: 'Ajustes del Sistema',
    };
    if (titleEl) titleEl.textContent = titles[viewName] || 'TestGenAI';

    // Si la vista pertenece al grupo avanzado, expándelo para mostrar el ítem activo
    if (['grid-review', 'split-view', 'traceability-360', 'roi-calculator', 'projects', 'traceability', 'settings'].includes(viewName)) {
      this._toggleNavMore(true);
    }

    // Render into view content area with View Transitions API if supported
    const contentArea = document.getElementById('content-area');
    if (contentArea) {
      const render = () => {
        contentArea.innerHTML = '';
        this.views[viewName](contentArea);
        requestAnimationFrame(() => {
          this._initViewStudioEffects(contentArea);
        });
      };

      if (document.startViewTransition) {
        document.startViewTransition(render);
      } else {
        render();
      }
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  _initViewStudioEffects(container) {
    if (!container) return;

    // 1. Kinetic Flip Counters en métricas numéricas
    container.querySelectorAll('.kpi-value, .home-stat > div:first-child').forEach((el) => {
      const val = el.textContent.trim();
      if (val && !isNaN(parseInt(val, 10))) {
        FlipCounter.animate(el, val);
      }
    });

    // 2. 3D Tilt en tarjetas
    CardTilt.initAll('[data-tilt], .test-case-card, .kpi-card, .card');

    // 3. Magnetismo elástico en botones
    this.cursor?.attachMagnetics();

    // 4. Text Scramble en títulos seleccionados con [data-scramble]
    const scrambleElements = container.querySelectorAll('[data-scramble]');
    scrambleElements.forEach((el, idx) => {
      if (idx < 6 && el.textContent.trim()) {
        const text = el.textContent.trim();
        const scrambler = new TextScramble(el);
        setTimeout(() => scrambler.setText(text), idx * 80);
      }
    });
  }

  // Re-renderiza la vista actual y refresca el selector de proyectos.
  // Lo usan los modales tras crear/editar para reflejar el cambio al instante.
  refresh() {
    const projects = store.get('projects') || [];
    const activeId = store.get('activeProjectId');
    this._updateProjectSelectDropdown(projects, activeId);
    this.navigate(this.currentView);
  }
}

// Instantiate and export app singleton
export const app = new App();

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
