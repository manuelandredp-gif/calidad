// ==========================================================================
// Calculadora de ROI y Eficiencia del Testing (Mejora #47)
// ==========================================================================

import { store } from '../state.js';

export function renderRoiCalculator(container) {
  const testCases = store.get('testCases') || [];
  const defaultTotalCases = Math.max(testCases.length, 50);

  container.innerHTML = `
    <div class="view-header">
      <div>
        <h2 class="view-title">📈 Calculadora de ROI y Eficiencia del Testing</h2>
        <p class="view-subtitle">Cuantificación del valor económico, ahorro de horas hombre y defectos prevenidos con TestGenAI</p>
      </div>
    </div>

    <div class="roi-container grid-2-col">
      <!-- Panel de Parámetros -->
      <div class="card">
        <h3 class="card-title">Parámetros Operativos del Equipo QA</h3>
        <form id="roi-form" class="roi-form mt-3">
          <div class="form-group">
            <label class="form-label" for="roi-cases">Casos de Prueba a Derivar:</label>
            <input type="number" id="roi-cases" class="form-input font-mono" value="${defaultTotalCases}" min="1" />
          </div>

          <div class="form-group">
            <label class="form-label" for="roi-manual-time">Minutos Manuales por Caso (Tradicional):</label>
            <input type="number" id="roi-manual-time" class="form-input font-mono" value="25" min="1" />
            <small class="text-muted">Tiempo promedio de análisis, diseño y redacción manual ISTQB.</small>
          </div>

          <div class="form-group">
            <label class="form-label" for="roi-ai-time">Minutos con TestGenAI (Generación + Revisión):</label>
            <input type="number" id="roi-ai-time" class="form-input font-mono" value="2" min="1" />
            <small class="text-muted">Tiempo promedio con asistencia de IA y Modo Grid.</small>
          </div>

          <div class="form-group">
            <label class="form-label" for="roi-hourly-rate">Costo Hora/Hombre QA (USD $):</label>
            <input type="number" id="roi-hourly-rate" class="form-input font-mono" value="28" min="5" />
          </div>

          <div class="form-group">
            <label class="form-label" for="roi-defect-cost">Costo Promedio Defecto en Producción (USD $):</label>
            <input type="number" id="roi-defect-cost" class="form-input font-mono" value="450" min="50" />
            <small class="text-muted">Impacto promedio de un bug crítico según IEEE/NIST.</small>
          </div>
        </form>
      </div>

      <!-- Panel de Resultados y ROI -->
      <div class="card roi-results-card">
        <h3 class="card-title text-success">Retorno de Inversión Calculado</h3>
        
        <div class="roi-big-stat">
          <div class="roi-percentage font-mono" id="stat-roi-percent">+1150%</div>
          <div class="roi-stat-label">Retorno Porcentual de Inversión (ROI)</div>
        </div>

        <div class="roi-metrics-breakdown mt-4">
          <div class="roi-item">
            <span class="roi-item-title">Horas-Hombre Ahorradas:</span>
            <span class="roi-item-val font-mono" id="stat-hours-saved">0 hrs</span>
          </div>
          <div class="roi-item">
            <span class="roi-item-title">Ahorro Directo de Mano de Obra:</span>
            <span class="roi-item-val font-mono text-success" id="stat-labor-saved">$0 USD</span>
          </div>
          <div class="roi-item">
            <span class="roi-item-title">Bugs Críticos Prevenidos (est. 12%):</span>
            <span class="roi-item-val font-mono" id="stat-bugs-prevented">0</span>
          </div>
          <div class="roi-item">
            <span class="roi-item-title">Costo Evitado en Producción:</span>
            <span class="roi-item-val font-mono text-success" id="stat-bugs-value">$0 USD</span>
          </div>
          <div class="roi-item total-item">
            <span class="roi-item-title font-bold">VALOR ECONÓMICO TOTAL GENERADO:</span>
            <span class="roi-item-val font-mono font-bold text-success" id="stat-total-value">$0 USD</span>
          </div>
        </div>
      </div>
    </div>
  `;

  const recalculate = () => {
    const cases = parseFloat(container.querySelector('#roi-cases').value) || 0;
    const manualMin = parseFloat(container.querySelector('#roi-manual-time').value) || 0;
    const aiMin = parseFloat(container.querySelector('#roi-ai-time').value) || 0;
    const hourlyRate = parseFloat(container.querySelector('#roi-hourly-rate').value) || 0;
    const defectCost = parseFloat(container.querySelector('#roi-defect-cost').value) || 0;

    const manualHours = (cases * manualMin) / 60;
    const aiHours = (cases * aiMin) / 60;
    const hoursSaved = Math.max(0, manualHours - aiHours);
    const laborSaved = hoursSaved * hourlyRate;

    const bugsPrevented = Math.round(cases * 0.12);
    const bugsValue = bugsPrevented * defectCost;
    const totalValue = laborSaved + bugsValue;

    const investmentCost = aiHours * hourlyRate + 5; // $5 estimación tokens API
    const roiPercent = investmentCost > 0 ? Math.round(((totalValue - investmentCost) / investmentCost) * 100) : 0;

    container.querySelector('#stat-roi-percent').textContent = `+${roiPercent.toLocaleString()}%`;
    container.querySelector('#stat-hours-saved').textContent = `${Math.round(hoursSaved)} hrs (${Math.round(hoursSaved / 8)} días laborales)`;
    container.querySelector('#stat-labor-saved').textContent = `$${Math.round(laborSaved).toLocaleString()} USD`;
    container.querySelector('#stat-bugs-prevented').textContent = `${bugsPrevented} defectos`;
    container.querySelector('#stat-bugs-value').textContent = `$${Math.round(bugsValue).toLocaleString()} USD`;
    container.querySelector('#stat-total-value').textContent = `$${Math.round(totalValue).toLocaleString()} USD`;
  };

  container.querySelector('#roi-form').addEventListener('input', recalculate);
  recalculate();
}
