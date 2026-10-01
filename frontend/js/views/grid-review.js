// ==========================================================================
// Modo Revisión Masiva / Spreadsheet Grid con Hotkeys (Mejora #22)
// ==========================================================================

import { store } from '../state.js';
import { api } from '../api.js';
import { toast } from '../toast.js';
import { eventBus } from '../event-bus.js';

export class GridReviewView {
  constructor() {
    this.selectedIndex = 0;
    this.selectedIds = new Set();
    this.testCases = [];
    this.isListening = false;
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  render(container) {
    this.container = container;
    this.testCases = store.get('testCases') || [];
    this.selectedIndex = 0;
    this.selectedIds.clear();

    this.container.innerHTML = `
      <div class="grid-review-panel">
        <!-- Barra de herramientas superior -->
        <div class="grid-toolbar">
          <div class="grid-toolbar-left">
            <h2 class="view-title">⚡ Modo Revisión Rápida (Spreadsheet Grid)</h2>
            <div class="grid-hotkeys-badge" title="Atajos de teclado habilitados">
              <span class="hotkey-pill"><kbd>A</kbd> Aprobar</span>
              <span class="hotkey-pill"><kbd>R</kbd> Rechazar</span>
              <span class="hotkey-pill"><kbd>E</kbd> Editar</span>
              <span class="hotkey-pill"><kbd>↑/↓</kbd> Navegar</span>
            </div>
          </div>
          <div class="grid-toolbar-actions">
            <button type="button" class="btn btn-sm btn-outline" id="btn-grid-select-all">Seleccionar Todos</button>
            <button type="button" class="btn btn-sm btn-success" id="btn-grid-bulk-approve">Aprobar Seleccionados</button>
            <button type="button" class="btn btn-sm btn-danger" id="btn-grid-bulk-reject">Rechazar Seleccionados</button>
            <button type="button" class="btn btn-sm btn-secondary" id="btn-grid-close">Volver a Tarjetas</button>
          </div>
        </div>

        <!-- Tabla estilo Hoja de Cálculo -->
        <div class="grid-table-container">
          <table class="grid-table" id="spreadsheet-table" tabindex="0">
            <thead>
              <tr>
                <th width="40"><input type="checkbox" id="chk-grid-all" /></th>
                <th width="100">Código</th>
                <th width="100">Tipo</th>
                <th>Título del Caso</th>
                <th width="100">Prioridad</th>
                <th width="110">Estado</th>
                <th>Resultado Esperado</th>
                <th width="140">Acción Rápida</th>
              </tr>
            </thead>
            <tbody id="grid-table-body">
              ${this._renderRows()}
            </tbody>
          </table>
        </div>
      </div>
    `;

    this._bindEvents();
    this._enableKeyboardNavigation();
  }

  _renderRows() {
    if (this.testCases.length === 0) {
      return `<tr><td colspan="8" class="text-center py-4 text-muted">No hay casos de prueba para revisar.</td></tr>`;
    }

    return this.testCases
      .map((tc, idx) => {
        const isSelected = idx === this.selectedIndex;
        const isChecked = this.selectedIds.has(tc.id);
        const statusBadgeClass =
          tc.status === 'APPROVED'
            ? 'badge-success'
            : tc.status === 'REJECTED'
            ? 'badge-danger'
            : 'badge-warning';

        return `
          <tr class="grid-row ${isSelected ? 'row-active' : ''}" data-index="${idx}" data-id="${tc.id}">
            <td><input type="checkbox" class="chk-grid-row" data-id="${tc.id}" ${isChecked ? 'checked' : ''} /></td>
            <td class="font-mono font-semibold">${tc.code}</td>
            <td><span class="badge badge-subtle">${tc.type}</span></td>
            <td class="font-medium cell-title">${this._escape(tc.title)}</td>
            <td><span class="priority-dot priority-${tc.priority}"></span> ${tc.priority}</td>
            <td><span class="badge ${statusBadgeClass}">${tc.status}</span></td>
            <td class="cell-result">${this._escape(tc.expectedResult)}</td>
            <td class="cell-actions">
              <button type="button" class="btn-grid-action btn-approve" data-id="${tc.id}" title="Aprobar (A)">✓</button>
              <button type="button" class="btn-grid-action btn-reject" data-id="${tc.id}" title="Rechazar (R)">✕</button>
            </td>
          </tr>
        `;
      })
      .join('');
  }

  _bindEvents() {
    const tableBody = this.container.querySelector('#grid-table-body');
    const chkAll = this.container.querySelector('#chk-grid-all');

    tableBody.addEventListener('click', async (e) => {
      const row = e.target.closest('tr');
      if (row && row.dataset.index !== undefined) {
        this.selectedIndex = parseInt(row.dataset.index, 10);
        this._updateActiveRowVisual();
      }

      if (e.target.classList.contains('btn-approve')) {
        const id = e.target.dataset.id;
        await this._updateStatus(id, 'APPROVED');
      } else if (e.target.classList.contains('btn-reject')) {
        const id = e.target.dataset.id;
        await this._updateStatus(id, 'REJECTED');
      } else if (e.target.classList.contains('chk-grid-row')) {
        const id = e.target.dataset.id;
        if (e.target.checked) this.selectedIds.add(id);
        else this.selectedIds.delete(id);
      }
    });

    chkAll?.addEventListener('change', (e) => {
      const checked = e.target.checked;
      this.testCases.forEach((tc) => {
        if (checked) this.selectedIds.add(tc.id);
        else this.selectedIds.delete(tc.id);
      });
      this.container.querySelectorAll('.chk-grid-row').forEach((chk) => (chk.checked = checked));
    });

    this.container.querySelector('#btn-grid-bulk-approve')?.addEventListener('click', () => {
      this._bulkUpdate('APPROVED');
    });

    this.container.querySelector('#btn-grid-bulk-reject')?.addEventListener('click', () => {
      this._bulkUpdate('REJECTED');
    });

    this.container.querySelector('#btn-grid-close')?.addEventListener('click', () => {
      this.destroy();
      eventBus.emit('view:switch', 'test-cases');
    });
  }

  _enableKeyboardNavigation() {
    if (this.isListening) return;
    this.isListening = true;
    window.addEventListener('keydown', this._handleKeyDown);
  }

  _handleKeyDown(e) {
    // Evitar interceptar si el usuario está escribiendo en un input o textarea
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
      return;
    }

    if (e.key === 'ArrowDown' || e.key === 'j') {
      e.preventDefault();
      if (this.selectedIndex < this.testCases.length - 1) {
        this.selectedIndex++;
        this._updateActiveRowVisual();
      }
    } else if (e.key === 'ArrowUp' || e.key === 'k') {
      e.preventDefault();
      if (this.selectedIndex > 0) {
        this.selectedIndex--;
        this._updateActiveRowVisual();
      }
    } else if (e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      const current = this.testCases[this.selectedIndex];
      if (current) this._updateStatus(current.id, 'APPROVED');
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      const current = this.testCases[this.selectedIndex];
      if (current) this._updateStatus(current.id, 'REJECTED');
    }
  }

  _updateActiveRowVisual() {
    const rows = this.container.querySelectorAll('.grid-row');
    rows.forEach((r, idx) => {
      if (idx === this.selectedIndex) {
        r.classList.add('row-active');
        r.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        r.classList.remove('row-active');
      }
    });
  }

  async _updateStatus(id, newStatus) {
    try {
      await api.patch(`/test-cases/${id}`, { status: newStatus });
      const current = this.testCases.find((c) => c.id === id);
      if (current) current.status = newStatus;

      // Actualizar visual de la fila
      const row = this.container.querySelector(`tr[data-id="${id}"]`);
      if (row) {
        const badge = row.querySelector('.badge:not(.badge-subtle)');
        if (badge) {
          badge.className = `badge ${newStatus === 'APPROVED' ? 'badge-success' : 'badge-danger'}`;
          badge.textContent = newStatus;
        }
      }

      toast.success(`Caso marcado como ${newStatus}`);

      // Auto-avanzar al siguiente caso para máxima velocidad
      if (this.selectedIndex < this.testCases.length - 1) {
        this.selectedIndex++;
        this._updateActiveRowVisual();
      }
    } catch {
      toast.error('No se pudo actualizar el estado del caso');
    }
  }

  async _bulkUpdate(newStatus) {
    if (this.selectedIds.size === 0) {
      toast.info('Seleccione al menos un caso de prueba para la acción masiva');
      return;
    }

    try {
      const ids = Array.from(this.selectedIds);
      for (const id of ids) {
        await api.patch(`/test-cases/${id}`, { status: newStatus });
        const c = this.testCases.find((tc) => tc.id === id);
        if (c) c.status = newStatus;
      }
      toast.success(`${ids.length} casos actualizados a ${newStatus}`);
      this.render(this.container);
    } catch {
      toast.error('Error al procesar la actualización en lote');
    }
  }

  destroy() {
    if (this.isListening) {
      window.removeEventListener('keydown', this._handleKeyDown);
      this.isListening = false;
    }
  }

  _escape(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
