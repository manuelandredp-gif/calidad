// ==========================================================================
// MagneticCursor Engine - Custom Fluid Inertia Cursor & Magnetic Elements
// Inspired by Active Theory & Locomotive Studio Standards
// ==========================================================================

export class MagneticCursor {
  constructor() {
    this.cursor = null;
    this.dot = null;
    this.mouse = { x: -100, y: -100 };
    this.pos = { x: -100, y: -100 };
    this.speed = 0.16;
    this.isActive = false;
    this.rafId = null;
  }

  init() {
    // No activar cursor custom en dispositivos táctiles o si el usuario pide movimiento reducido
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (this.isActive) return;

    this._createDOM();
    this._attachEvents();
    this._animate();
    this.isActive = true;
  }

  _createDOM() {
    let existingCursor = document.querySelector('.studio-cursor');
    let existingDot = document.querySelector('.studio-cursor-dot');

    if (!existingCursor) {
      this.cursor = document.createElement('div');
      this.cursor.className = 'studio-cursor';
      document.body.appendChild(this.cursor);
    } else {
      this.cursor = existingCursor;
    }

    if (!existingDot) {
      this.dot = document.createElement('div');
      this.dot.className = 'studio-cursor-dot';
      document.body.appendChild(this.dot);
    } else {
      this.dot = existingDot;
    }
  }

  _attachEvents() {
    window.addEventListener(
      'mousemove',
      (e) => {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        if (this.dot) {
          this.dot.style.transform = `translate3d(${this.mouse.x - 3}px, ${this.mouse.y - 3}px, 0)`;
        }
      },
      { passive: true }
    );

    // Detección de elementos interactivos (expansión de halo)
    const interactiveSelectors = 'button, a, .btn, .card, [data-magnetic], input, textarea, select, .badge';

    document.addEventListener(
      'mouseover',
      (e) => {
        const target = e.target.closest(interactiveSelectors);
        if (target) {
          document.body.classList.add('cursor-hovering');
          if (target.classList.contains('btn-primary') || target.dataset.cursorStyle === 'emerald') {
            document.body.classList.add('cursor-hovering-accent');
          }
        }
      },
      { passive: true }
    );

    document.addEventListener(
      'mouseout',
      (e) => {
        const target = e.target.closest(interactiveSelectors);
        if (target) {
          document.body.classList.remove('cursor-hovering', 'cursor-hovering-accent');
        }
      },
      { passive: true }
    );

    // Efecto magnético para elementos con [data-magnetic] o botones clave
    this.attachMagnetics();
  }

  attachMagnetics(selector = '[data-magnetic], .btn-primary, .btn-cyan') {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      if (el.dataset.magneticActive) return;
      el.dataset.magneticActive = 'true';

      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distX = e.clientX - centerX;
        const distY = e.clientY - centerY;

        el.style.transform = `translate3d(${distX * 0.22}px, ${distY * 0.22}px, 0)`;
        el.style.transition = 'transform 0.1s ease-out';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
        el.style.transform = 'translate3d(0, 0, 0)';
      });
    });
  }

  _animate() {
    this.pos.x += (this.mouse.x - this.pos.x) * this.speed;
    this.pos.y += (this.mouse.y - this.pos.y) * this.speed;

    if (this.cursor) {
      this.cursor.style.transform = `translate3d(${this.pos.x - 18}px, ${this.pos.y - 18}px, 0)`;
    }

    this.rafId = requestAnimationFrame(() => this._animate());
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.cursor) this.cursor.remove();
    if (this.dot) this.dot.remove();
    this.isActive = false;
  }
}
