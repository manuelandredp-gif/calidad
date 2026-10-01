// ==========================================================================
// QA Copilot Sidebar Assistant - TestGenAI
// ==========================================================================

import { store } from './state.js';
import { eventBus } from './event-bus.js';
import { api } from './api.js';

export class QACopilot {
  static isOpen = false;
  static messages = [
    {
      sender: 'bot',
      text: '¡Hola! Soy tu **Copiloto QA**. Conozco los requerimientos de tu proyecto y las mejores prácticas de **ISTQB**.\n\nPuedo sugerirte casos límite, ayudarte a redactar criterios BDD o auditar posibles ambigüedades en tus requisitos.',
    },
  ];

  static init() {
    this._injectDOM();
    this._setupEvents();

    eventBus.on('copilot:toggle', () => this.toggle());
    eventBus.on('copilot:open', () => this.open());
    eventBus.on('copilot:ask', (question) => {
      this.open();
      this.handleUserQuestion(question);
    });
  }

  static _injectDOM() {
    if (document.getElementById('copilot-floating-btn')) return;

    // 1. Floating trigger button
    const floatBtn = document.createElement('button');
    floatBtn.id = 'copilot-floating-btn';
    floatBtn.className = 'copilot-floating-btn';
    floatBtn.title = 'Abrir QA Copilot (Ctrl + J)';
    floatBtn.innerHTML = `
      <div class="copilot-pulse"></div>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `;
    document.body.appendChild(floatBtn);

    // 2. Slide-over drawer
    const drawer = document.createElement('aside');
    drawer.id = 'copilot-drawer';
    drawer.className = 'copilot-drawer';
    drawer.setAttribute('aria-label', 'Panel de Asistente Copiloto QA');
    drawer.innerHTML = `
      <div class="copilot-header">
        <div class="copilot-header-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" stroke-width="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
          <span>QA Copilot</span>
          <span class="badge badge-derived" style="font-size:0.72rem; padding:2px 6px;">IA Activa</span>
        </div>
        <button class="btn-icon" id="btn-close-copilot" title="Cerrar">&times;</button>
      </div>

      <div class="copilot-body" id="copilot-messages-container"></div>

      <div class="copilot-footer">
        <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:8px; display:flex; justify-content:space-between;">
          <span id="copilot-context-info">Contexto: Proyecto General</span>
          <span>Shift+Enter para salto de línea</span>
        </div>
        <form class="copilot-input-form" id="copilot-form">
          <input type="text" id="copilot-input" class="copilot-input" placeholder="Pregunta sobre tus pruebas o requisitos..." autocomplete="off" />
          <button type="submit" class="btn btn-primary btn-sm" id="btn-send-copilot">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    `;
    document.body.appendChild(drawer);

    this.renderMessages();
  }

  static _setupEvents() {
    const floatBtn = document.getElementById('copilot-floating-btn');
    floatBtn?.addEventListener('click', () => this.toggle());

    const closeBtn = document.getElementById('btn-close-copilot');
    closeBtn?.addEventListener('click', () => this.close());

    const form = document.getElementById('copilot-form');
    const input = document.getElementById('copilot-input');

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = input.value.trim();
      if (!val) return;
      input.value = '';
      this.handleUserQuestion(val);
    });

    // Hotkey: Ctrl + J
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
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
    const drawer = document.getElementById('copilot-drawer');
    if (!drawer) return;
    this.isOpen = true;
    drawer.classList.add('open');
    this.updateContextInfo();
    setTimeout(() => {
      document.getElementById('copilot-input')?.focus();
    }, 150);
  }

  static close() {
    const drawer = document.getElementById('copilot-drawer');
    if (!drawer) return;
    this.isOpen = false;
    drawer.classList.remove('open');
  }

  static updateContextInfo() {
    const info = document.getElementById('copilot-context-info');
    if (!info) return;
    const req = store.get('activeRequirement');
    const proj = store.get('activeProject');
    if (req) {
      info.textContent = `Req: ${req.code} (${req.title.substring(0, 18)}...)`;
    } else if (proj) {
      info.textContent = `Proyecto: ${proj.name.substring(0, 20)}`;
    } else {
      info.textContent = 'Contexto General';
    }
  }

  static renderMessages() {
    const container = document.getElementById('copilot-messages-container');
    if (!container) return;

    let html = '';
    this.messages.forEach((msg) => {
      const formatted = msg.text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br/>');

      html += `
        <div class="copilot-message ${msg.sender}">
          <div class="copilot-bubble">${formatted}</div>
        </div>
      `;
    });

    // Add quick suggestions at the bottom
    html += `
      <div class="copilot-quick-prompts">
        <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">Sugerencias Rápidas:</div>
        <button class="copilot-pill" data-prompt="¿Qué casos negativos y de seguridad recomiendas para este requisito?">
          🛡️ Sugerir casos negativos y de seguridad
        </button>
        <button class="copilot-pill" data-prompt="¿Cómo aplico la técnica de Valores Límite (BVA) a este flujo?">
          📐 Explicar técnica de Valores Límite (BVA)
        </button>
        <button class="copilot-pill" data-prompt="¿Cuáles son las ambigüedades clave detectadas en el texto actual?">
          🔍 Analizar ambigüedades del requisito (ISO 29148)
        </button>
        <button class="copilot-pill" data-prompt="¿Cuántos casos de prueba tenemos aprobados y pendientes?">
          📊 Resumen de cobertura del proyecto actual
        </button>
      </div>
    `;

    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;

    // Attach click listeners to pills
    container.querySelectorAll('.copilot-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        const prompt = btn.getAttribute('data-prompt');
        this.handleUserQuestion(prompt);
      });
    });
  }

  static async handleUserQuestion(q) {
    // 1. Append user message
    this.messages.push({ sender: 'user', text: q });
    this.renderMessages();

    // 2. Prepare context
    const req = store.get('activeRequirement');
    const proj = store.get('activeProject');
    const cases = store.get('testCases') || [];
    const pendingCount = cases.filter((c) => c.status === 'PENDING').length;
    const approvedCount = cases.filter((c) => c.status === 'APPROVED').length;

    // 3. Show typing indicator
    this.messages.push({ sender: 'bot', text: 'Pensando...' });
    this.renderMessages();

    // Small delay to simulate intelligent AI response
    await new Promise((r) => setTimeout(r, 600));

    // Remove typing indicator
    this.messages.pop();

    // 4. Generate intelligent contextual QA response
    let answer = '';
    const qLower = q.toLowerCase();

    if (qLower.includes('negativo') || qLower.includes('seguridad')) {
      answer = `Para el requisito **${req ? req.code : 'seleccionado'}**, sugiero las siguientes pruebas de robustez:\n\n1. **Inyección de caracteres especiales:** Comillas simples, tags HTML (\`<script>\`) y emojis en campos de texto.\n2. **Tolerancia a timeouts de red:** Simular corte de conexión en el milisegundo exacto de confirmación.\n3. **Manipulación de sesión:** Enviar la petición con un token expirado o firma inválida.`;
    } else if (qLower.includes('bva') || qLower.includes('límite') || qLower.includes('limite')) {
      answer = `La técnica **ISTQB de Valores Límite (BVA)** se aplica testeando los extremos de cada partición de equivalencia:\n\n- **Mínimo:** min - 1 (Inválido), min (Válido), min + 1 (Válido).\n- **Máximo:** max - 1 (Válido), max (Válido), max + 1 (Inválido).\n\nEn TestGenAI puedes generar estos casos automáticamente pulsando **"Generar sin IA"** en la vista de requisitos.`;
    } else if (qLower.includes('ambigüedad') || qLower.includes('ambiguedad') || qLower.includes('iso')) {
      answer = `El detector **ISO 29148** evalúa términos como *"rápido"*, *"fácil"*, *"aproximadamente"* o modales débiles como *"debería"* en lugar de *"debe"*.\n\nEn tu requisito **${req ? req.code : 'activo'}**, asegúrate de cuantificar tiempos exactos (ej: *"en menos de 2 segundos"*) para lograr un score de claridad del 100%.`;
    } else if (qLower.includes('cobertura') || qLower.includes('cuántos') || qLower.includes('resumen')) {
      answer = `Estado actual del proyecto **${proj ? proj.name : 'activo'}**:\n\n- **Total casos:** ${cases.length}\n- **Aprobados:** ${approvedCount} (${cases.length ? Math.round((approvedCount / cases.length) * 100) : 0}%)\n- **Pendientes:** ${pendingCount}\n\nPuedes revisar los pendientes con atajos rápidos en el **Modo Grilla (Hotkeys A/R/E)**.`;
    } else {
      answer = `Analizando tu consulta sobre **"${q}"**:\n\nTe recomiendo estructurar este caso con la sintaxis **Gherkin (Dado que / Cuando / Entonces)** y verificar que incluya precondiciones de base de datos claras. ¿Deseas que preparemos un caso de prueba manual para agregarlo al proyecto?`;
    }

    this.messages.push({ sender: 'bot', text: answer });
    this.renderMessages();
  }
}
