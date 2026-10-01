// ==========================================================================
// FlipCounter Engine - Kinetic Rolling Number Matrix
// Mechanical wheel counter with stagger delays for statistics & KPI metrics
// ==========================================================================

export class FlipCounter {
  /**
   * Anima un elemento numérico simulando un odómetro mecánico / ruleta
   * @param {HTMLElement} element - Contenedor
   * @param {number|string} targetValue - Valor destino (soporta números o strings como "98%")
   */
  static animate(element, targetValue) {
    if (!element) return;

    const rawStr = String(targetValue).trim();
    const suffix = rawStr.match(/[%a-zA-Z]+$/)?.[0] || '';
    const numericPart = parseInt(rawStr.replace(/\D/g, ''), 10) || 0;
    const digits = String(numericPart).split('');

    element.innerHTML = `
      <span class="kinetic-counter-wrap" aria-label="${targetValue}">
        ${digits
          .map(
            (d, idx) => `
          <span class="kinetic-digit" style="--digit-index: ${idx}">
            <span class="kinetic-wheel" data-target="${d}">
              ${Array.from({ length: 10 }, (_, i) => `<span class="kinetic-num">${i}</span>`).join('')}
            </span>
          </span>
        `
          )
          .join('')}
        ${suffix ? `<span class="kinetic-suffix">${suffix}</span>` : ''}
      </span>
    `;

    // Disparar la rotación vertical con stagger
    requestAnimationFrame(() => {
      const wheels = element.querySelectorAll('.kinetic-wheel');
      wheels.forEach((wheel, idx) => {
        const targetDigit = parseInt(wheel.dataset.target, 10);
        const delay = idx * 60; // 60ms stagger

        setTimeout(() => {
          wheel.style.transform = `translate3d(0, -${targetDigit * 10}%, 0)`;
        }, delay);
      });
    });
  }
}
