// ==========================================================================
// Theme Manager - Modern Dark / Light Mode with Persistence
// ==========================================================================

import { eventBus } from './event-bus.js';

export class ThemeManager {
  static STORAGE_KEY = 'testgenai_theme';

  static init() {
    this.applyTheme(this.getTheme());

    // Bind theme toggle buttons
    document.querySelectorAll('.btn-toggle-theme').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.toggle();
      });
    });
  }

  static getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }

  static applyTheme(theme) {
    const target = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', target);
    try { localStorage.setItem(this.STORAGE_KEY, target); } catch { /* Keep switching available without storage. */ }

    // Update icon states across the app
    this.updateIcons(target);
    eventBus.emit('theme:changed', target);
  }

  static toggle() {
    const current = this.getTheme();
    const next = current === 'light' ? 'dark' : 'light';
    clearTimeout(this.transitionTimer);
    document.documentElement.classList.add('theme-changing');
    this.applyTheme(next);
    this.transitionTimer = setTimeout(() => document.documentElement.classList.remove('theme-changing'), 350);
    return next;
  }

  static updateIcons(theme) {
    const isLight = theme === 'light';
    document.querySelectorAll('.theme-icon-sun').forEach((el) => {
      el.hidden = isLight;
    });
    document.querySelectorAll('.theme-icon-moon').forEach((el) => {
      el.hidden = !isLight;
    });
    document.querySelectorAll('.btn-toggle-theme').forEach(btn => {
      const label = isLight ? 'Modo oscuro' : 'Modo claro';
      btn.setAttribute('aria-label', `Activar ${label.toLowerCase()}`);
      btn.title = `Activar ${label.toLowerCase()}`;
      btn.querySelector('.theme-toggle-label').textContent = label;
    });
  }
}
