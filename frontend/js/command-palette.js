// ==========================================================================
// Command Palette Engine (Ctrl + K / Cmd + K) - TestGenAI
// ==========================================================================

import { eventBus } from './event-bus.js';
import { modals } from './modals.js';
import { ThemeManager } from './theme-manager.js';
import { toast } from './toast.js';

export class CommandPalette {
  static isOpen = false;
  static selectedIndex = 0;
  static filteredItems = [];

  static actions = [
    // Navigation
    { id: 'nav-dashboard', category: 'Navegación', title: 'Ir a Inicio (Dashboard)', icon: 'layout', badge: 'Vista', run: () => eventBus.emit('view:switch', 'dashboard') },
    { id: 'nav-projects', category: 'Navegación', title: 'Ir a Proyectos', icon: 'folder', badge: 'Vista', run: () => eventBus.emit('view:switch', 'projects') },
    { id: 'nav-reqs', category: 'Navegación', title: 'Ir a Requisitos', icon: 'file-text', badge: 'Vista', run: () => eventBus.emit('view:switch', 'requirements') },
    { id: 'nav-cases', category: 'Navegación', title: 'Ir a Casos de Prueba', icon: 'check-square', badge: 'Vista', run: () => eventBus.emit('view:switch', 'test-cases') },
    { id: 'nav-split', category: 'Navegación', title: 'Ir a Modo Split-Screen (Doble Panel)', icon: 'columns', badge: 'Power User', run: () => eventBus.emit('view:switch', 'split-view') },
    { id: 'nav-grid', category: 'Navegación', title: 'Ir a Modo Grilla / Spreadsheet (Hotkeys)', icon: 'grid', badge: 'Productividad', run: () => eventBus.emit('view:switch', 'grid-review') },
    { id: 'nav-trace360', category: 'Navegación', title: 'Ir a Matriz de Trazabilidad 360°', icon: 'compass', badge: 'Auditoría', run: () => eventBus.emit('view:switch', 'traceability-360') },
    { id: 'nav-roi', category: 'Navegación', title: 'Ir a Calculadora de ROI de Testing', icon: 'dollar-sign', badge: 'FinOps', run: () => eventBus.emit('view:switch', 'roi-calculator') },
    { id: 'nav-metrics', category: 'Navegación', title: 'Ir a Reportes y Métricas', icon: 'bar-chart', badge: 'Reportes', run: () => eventBus.emit('view:switch', 'metrics') },
    { id: 'nav-settings', category: 'Navegación', title: 'Ir a Ajustes y Configuración', icon: 'settings', badge: 'Sistema', run: () => eventBus.emit('view:switch', 'settings') },

    // Quick Actions
    { id: 'act-new-proj', category: 'Acciones Rápidas', title: 'Crear Nuevo Proyecto QA', icon: 'plus-circle', badge: 'Modal', run: () => modals.open('modal-new-project') },
    { id: 'act-new-req', category: 'Acciones Rápidas', title: 'Registrar Nuevo Requisito Funcional', icon: 'plus', badge: 'Modal', run: () => modals.open('modal-new-requirement') },
    { id: 'act-new-tc', category: 'Acciones Rápidas', title: 'Crear Caso de Prueba Manual', icon: 'edit', badge: 'Modal', run: () => modals.open('modal-manual-testcase') },
    { id: 'act-copilot', category: 'Acciones Rápidas', title: 'Abrir Asistente Copiloto QA', icon: 'message-square', badge: 'IA', run: () => eventBus.emit('copilot:toggle') },
    { id: 'act-shortcuts', category: 'Acciones Rápidas', title: 'Ver Centro de Atajos de Teclado (?)', icon: 'help-circle', badge: 'Guía', run: () => eventBus.emit('shortcuts:open') },
    { id: 'act-theme', category: 'Ajustes', title: 'Alternar Tema Oscuro / Claro', icon: 'sun', badge: 'Tema', run: () => ThemeManager.toggle() },
    { id: 'act-export-playwright', category: 'Exportación', title: 'Exportar Casos a Playwright (TS)', icon: 'code', badge: 'Exportar', run: () => eventBus.emit('export:quick', 'playwright') },
    { id: 'act-export-cypress', category: 'Exportación', title: 'Exportar Casos a Cypress (JS)', icon: 'code', badge: 'Exportar', run: () => eventBus.emit('export:quick', 'cypress') },
    { id: 'act-export-postman', category: 'Exportación', title: 'Exportar Casos a Colección Postman v2.1', icon: 'send', badge: 'Exportar', run: () => eventBus.emit('export:quick', 'postman') },
  ];

  static init() {
    this._injectDOM();
    this._setupGlobalHotkeys();
  }

  static _injectDOM() {
    if (document.getElementById('cmd-palette-backdrop')) return;

    const el = document.createElement('div');
    el.id = 'cmd-palette-backdrop';
    el.className = 'cmd-palette-backdrop';
    el.innerHTML = `
      <div class="cmd-palette-card" role="dialog" aria-modal="true" aria-label="Paleta de Comandos">
        <div class="cmd-palette-input-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" id="cmd-palette-input" class="cmd-palette-input" placeholder="Escribe un comando o busca una vista (ej: Requisitos, Playwright, ROI)..." autocomplete="off" />
          <kbd>ESC</kbd>
        </div>
        <div class="cmd-palette-list" id="cmd-palette-list"></div>
        <div class="cmd-palette-footer">
          <span>TestGenAI Command Engine</span>
          <div class="kbd-hints">
            <span><kbd>↑</kbd> <kbd>↓</kbd> Navegar</span>
            <span><kbd>↵</kbd> Ejecutar</span>
            <span><kbd>ESC</kbd> Cerrar</span>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(el);

    // Event handlers
    el.addEventListener('click', (e) => {
      if (e.target === el) this.close();
    });

    const input = el.querySelector('#cmd-palette-input');
    input.addEventListener('input', (e) => {
      this.filter(e.target.value);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.selectNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.selectPrev();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        this.executeSelected();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }
    });

    // Topbar trigger button
    document.querySelectorAll('.btn-open-cmd-palette').forEach((btn) => {
      btn.addEventListener('click', () => this.open());
    });
  }

  static _setupGlobalHotkeys() {
    window.addEventListener('keydown', (e) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  static toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  static open() {
    const backdrop = document.getElementById('cmd-palette-backdrop');
    const input = document.getElementById('cmd-palette-input');
    if (!backdrop || !input) return;

    this.isOpen = true;
    backdrop.classList.add('open');
    input.value = '';
    this.filter('');
    setTimeout(() => input.focus(), 50);
  }

  static close() {
    const backdrop = document.getElementById('cmd-palette-backdrop');
    if (!backdrop) return;
    this.isOpen = false;
    backdrop.classList.remove('open');
  }

  static filter(query) {
    const q = (query || '').toLowerCase().trim();
    if (!q) {
      this.filteredItems = [...this.actions];
    } else {
      this.filteredItems = this.actions.filter((item) => {
        return (
          item.title.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.badge.toLowerCase().includes(q)
        );
      });
    }

    this.selectedIndex = 0;
    this.renderList();
  }

  static renderList() {
    const listEl = document.getElementById('cmd-palette-list');
    if (!listEl) return;

    if (this.filteredItems.length === 0) {
      listEl.innerHTML = `
        <div style="padding: 30px 20px; text-align:center; color:var(--text-muted); font-size:0.88rem;">
          No se encontraron comandos o vistas coincidentes.
        </div>
      `;
      return;
    }

    let lastCategory = '';
    let html = '';

    this.filteredItems.forEach((item, idx) => {
      if (item.category !== lastCategory) {
        lastCategory = item.category;
        html += `<div class="cmd-palette-group-title">${lastCategory}</div>`;
      }

      const isSelected = idx === this.selectedIndex;
      html += `
        <button class="cmd-palette-item ${isSelected ? 'selected' : ''}" data-idx="${idx}">
          <div class="cmd-palette-item-left">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            <span>${item.title}</span>
          </div>
          <span class="cmd-palette-badge">${item.badge}</span>
        </button>
      `;
    });

    listEl.innerHTML = html;

    listEl.querySelectorAll('.cmd-palette-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        this.selectedIndex = idx;
        this.executeSelected();
      });
    });
  }

  static selectNext() {
    if (this.filteredItems.length === 0) return;
    this.selectedIndex = (this.selectedIndex + 1) % this.filteredItems.length;
    this.renderList();
  }

  static selectPrev() {
    if (this.filteredItems.length === 0) return;
    this.selectedIndex = (this.selectedIndex - 1 + this.filteredItems.length) % this.filteredItems.length;
    this.renderList();
  }

  static executeSelected() {
    const item = this.filteredItems[this.selectedIndex];
    if (item && typeof item.run === 'function') {
      this.close();
      item.run();
    }
  }
}
