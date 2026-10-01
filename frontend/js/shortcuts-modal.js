// ==========================================================================
// Keyboard Shortcuts Modal (?) - TestGenAI
// ==========================================================================

import { eventBus } from './event-bus.js';

export class ShortcutsModal {
  static isOpen = false;

  static init() {
    this._injectDOM();
    this._setupHotkeys();

    eventBus.on('shortcuts:open', () => this.open());
  }

  static _injectDOM() {
    if (document.getElementById('modal-shortcuts')) return;

    const overlay = document.createElement('div');
    overlay.id = 'modal-shortcuts';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-dialog" style="max-width: 680px;">
        <div class="modal-header">
          <div class="modal-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            Centro de Atajos de Teclado
          </div>
          <button class="btn-icon modal-close" id="btn-close-shortcuts">&times;</button>
        </div>
        <div class="modal-body" style="padding: 20px;">
          <p style="font-size:0.86rem; color:var(--text-secondary); margin-bottom:16px;">
            Aumenta tu velocidad de revisión y diseño de pruebas con estos atajos de productividad.
          </p>

          <div class="shortcut-grid">
            <!-- Group 1: General & Navigation -->
            <div class="shortcut-group-card">
              <div class="shortcut-group-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="12 8 8 12 12 16 12 8"></polygon></svg>
                Navegación & Sistema
              </div>
              <div class="shortcut-row">
                <span>Paleta de Comandos</span>
                <div><kbd>Ctrl</kbd> + <kbd>K</kbd></div>
              </div>
              <div class="shortcut-row">
                <span>Ver este Centro de Atajos</span>
                <div><kbd>?</kbd></div>
              </div>
              <div class="shortcut-row">
                <span>Cerrar Modal / Ventana</span>
                <div><kbd>ESC</kbd></div>
              </div>
              <div class="shortcut-row">
                <span>Alternar QA Copilot</span>
                <div><kbd>Ctrl</kbd> + <kbd>J</kbd></div>
              </div>
            </div>

            <!-- Group 2: Spreadsheet Grid Review Mode -->
            <div class="shortcut-group-card">
              <div class="shortcut-group-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                Revisión Rápida en Grilla
              </div>
              <div class="shortcut-row">
                <span>Aprobar caso seleccionado</span>
                <div><kbd>A</kbd></div>
              </div>
              <div class="shortcut-row">
                <span>Rechazar caso seleccionado</span>
                <div><kbd>R</kbd></div>
              </div>
              <div class="shortcut-row">
                <span>Editar caso seleccionado</span>
                <div><kbd>E</kbd></div>
              </div>
              <div class="shortcut-row">
                <span>Fila anterior / siguiente</span>
                <div><kbd>↑</kbd> / <kbd>↓</kbd></div>
              </div>
            </div>

            <!-- Group 3: Split-Screen & Workflows -->
            <div class="shortcut-group-card" style="grid-column: 1 / -1;">
              <div class="shortcut-group-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"></rect><line x1="12" y1="3" x2="12" y2="17"></line></svg>
                Modo Split-Screen Resizable
              </div>
              <div class="shortcut-row">
                <span>Ajustar ancho del divisor</span>
                <span>Arrastra el divisor central con el ratón</span>
              </div>
              <div class="shortcut-row">
                <span>Resetear proporción a 50/50</span>
                <span>Doble clic en el divisor central</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary modal-close" id="btn-done-shortcuts">Entendido</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelectorAll('.modal-close').forEach((btn) => {
      btn.addEventListener('click', () => this.close());
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });
  }

  static _setupHotkeys() {
    window.addEventListener('keydown', (e) => {
      // Don't trigger if user is typing in an input or textarea
      const targetTag = (e.target.tagName || '').toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') return;

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
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
    const modal = document.getElementById('modal-shortcuts');
    if (!modal) return;
    this.isOpen = true;
    modal.classList.add('active');
  }

  static close() {
    const modal = document.getElementById('modal-shortcuts');
    if (!modal) return;
    this.isOpen = false;
    modal.classList.remove('active');
  }
}
