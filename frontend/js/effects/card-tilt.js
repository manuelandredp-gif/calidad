// ==========================================================================
// CardTilt Engine - Physical 3D Perspective & Specular Glare
// Inspired by Apple & Locomotive: Real physical depth without heavy WebGL
// ==========================================================================

export class CardTilt {
  static initAll(selector = '[data-tilt], .test-case-card, .kpi-card') {
    // Solo activar en dispositivos con puntero fino (mouse/trackpad), no touch
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const cards = document.querySelectorAll(selector);
    cards.forEach((card) => {
      if (card.dataset.tiltInitialized) return;
      card.dataset.tiltInitialized = 'true';
      this.attach(card);
    });
  }

  static attach(card) {
    let shine = card.querySelector('.card-shine');
    if (!shine) {
      shine = document.createElement('div');
      shine.className = 'card-shine';
      card.appendChild(shine);
    }

    let isHovered = false;

    const onMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calcular ángulos de rotación (-8deg a +8deg)
      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-3px)`;
      card.style.transition = 'transform 0.08s ease-out';

      // Posicionar el reflejo especular de luz
      shine.style.opacity = '1';
      shine.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(0, 255, 135, 0.18) 0%, rgba(255, 255, 255, 0.05) 30%, transparent 65%)`;
    };

    const onMouseEnter = () => {
      isHovered = true;
      card.style.willChange = 'transform';
    };

    const onMouseLeave = () => {
      isHovered = false;
      card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
      shine.style.opacity = '0';
      setTimeout(() => {
        if (!isHovered) card.style.willChange = 'auto';
      }, 500);
    };

    card.addEventListener('mousemove', onMouseMove, { passive: true });
    card.addEventListener('mouseenter', onMouseEnter, { passive: true });
    card.addEventListener('mouseleave', onMouseLeave, { passive: true });
  }
}
