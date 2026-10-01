// ==========================================================================
// Virtual Scrolling para Listas Masivas de Casos de Prueba (Mejora #24)
// ==========================================================================

export class VirtualScroll {
  /**
   * Calcula el rango de elementos visibles para renderizado en ventana deslizante.
   */
  static calculateWindow({
    totalItems,
    itemHeight = 60,
    containerHeight = 600,
    scrollTop = 0,
    buffer = 5,
  }) {
    const totalHeight = totalItems * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + buffer * 2;
    const endIndex = Math.min(totalItems, startIndex + visibleCount);

    const topSpacerHeight = startIndex * itemHeight;
    const bottomSpacerHeight = Math.max(0, (totalItems - endIndex) * itemHeight);

    return {
      startIndex,
      endIndex,
      visibleCount: endIndex - startIndex,
      totalHeight,
      topSpacerHeight,
      bottomSpacerHeight,
    };
  }

  /**
   * Conecta el virtual scroller a un contenedor de scroll y actualiza el viewport.
   */
  static attach(scrollContainer, options, onUpdate) {
    const handleScroll = () => {
      const calculation = this.calculateWindow({
        totalItems: options.totalItems,
        itemHeight: options.itemHeight || 60,
        containerHeight: scrollContainer.clientHeight || 600,
        scrollTop: scrollContainer.scrollTop,
        buffer: options.buffer || 4,
      });
      onUpdate(calculation);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Cálculo inicial

    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }
}
