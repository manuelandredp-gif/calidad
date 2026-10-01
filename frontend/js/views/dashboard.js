// ==========================================================================
// TestGenAI — Generador Rápido & Centro de Inicio Ultra-Intuitivo
// Diseñado para ser extremadamente fácil de usar y entender sin esfuerzo
// ==========================================================================

import { store } from '../state.js';
import { modals } from '../modals.js';
import { api } from '../api.js';
import { toast } from '../toast.js';

function go(view) {
  document.querySelector(`.nav-item[data-view="${view}"]`)?.click();
}

// Descarga directa a Excel (.csv) con soporte UTF-8 completo
function downloadCasesToCsv(cases, projectName = 'Proyecto') {
  if (!cases || cases.length === 0) {
    toast.warning('No hay casos de prueba disponibles para exportar.');
    return;
  }
  const headers = [
    'Código',
    'Tipo (Lenguaje Claro)',
    'Título de la Prueba',
    'Precondiciones',
    'Pasos a Seguir',
    'Datos de Prueba',
    'Resultado Esperado',
    'Estado',
  ];

  const typeLabels = {
    positive: 'Camino Feliz (Uso Normal)',
    negative: 'Caso de Error (Manejo de Fallos)',
    boundary: 'Valores Límite (Casos Extremos)',
    validation: 'Validación de Campos',
    alternative: 'Flujo Alternativo',
  };

  const rows = cases.map((c) => {
    const rawSteps = Array.isArray(c.steps) ? c.steps.join(' | ') : c.steps || '';
    const rawPre = Array.isArray(c.preconditions) ? c.preconditions.join(' | ') : c.preconditions || '';
    const readableType = typeLabels[c.type] || c.type || 'General';

    return [
      `"${c.code || ''}"`,
      `"${readableType}"`,
      `"${(c.title || '').replace(/"/g, '""')}"`,
      `"${rawPre.replace(/"/g, '""')}"`,
      `"${rawSteps.replace(/"/g, '""')}"`,
      `"${(c.testData || '').replace(/"/g, '""')}"`,
      `"${(c.expectedResult || '').replace(/"/g, '""')}"`,
      `"${c.status || 'PENDING'}"`,
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = projectName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  a.download = `casos_de_prueba_${safeName}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success('¡Archivo Excel (CSV) descargado con éxito!');
}

export function renderDashboard(container) {
  const user = store.get('user');
  let project = store.get('activeProject');
  const projects = store.get('projects') || [];
  const requirements = store.get('requirements') || [];
  let testCases = store.get('testCases') || [];

  const totalReqs = requirements.length;
  const totalCases = testCases.length;
  const pendingCases = testCases.filter((tc) => tc.status === 'PENDING').length;
  const approvedCases = testCases.filter((tc) => tc.status === 'APPROVED').length;

  const displayName = user?.fullName || user?.email ? (user.fullName || user.email).split(' ')[0] : 'colega';

  // Clasificación amigable en lenguaje humano de los casos existentes
  const happyCases = testCases.filter((c) => c.type === 'positive');
  const errorCases = testCases.filter((c) => c.type === 'negative');
  const limitCases = testCases.filter((c) => c.type === 'boundary');
  const valCases = testCases.filter((c) => c.type === 'validation' || c.type === 'alternative' || !['positive', 'negative', 'boundary'].includes(c.type));

  container.innerHTML = `
    <!-- 1. Banner de Bienvenida y Proyecto Activo -->
    <div class="card" style="margin-bottom:20px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:14px; border:1px solid rgba(255,255,255,0.08); background:rgba(15,23,42,0.65);">
      <div>
        <h2 style="font-size:1.35rem; font-weight:800; margin-bottom:4px; display:flex; align-items:center; gap:8px;">
          <span>¡Hola, ${displayName}! 👋</span>
        </h2>
        <p style="color:var(--text-secondary); font-size:0.88rem;">
          ${
            project
              ? `Estás trabajando en: <strong style="color:var(--text-primary);">${project.name}</strong>`
              : 'Selecciona o crea un proyecto para comenzar a generar pruebas.'
          }
        </p>
      </div>
      <div style="display:flex; gap:10px; align-items:center;">
        <button class="btn btn-outline btn-sm" id="btn-dashboard-new-project">+ Nuevo Proyecto</button>
        <button class="btn btn-primary btn-sm" id="btn-dashboard-view-all-cases">📋 Ver todos los casos (${totalCases})</button>
      </div>
    </div>

    <!-- 2. Guía Visual Rápida de 3 Pasos (Sin confusión, 100% claro) -->
    <div class="easy-workflow-banner">
      <div class="workflow-step-pill active">
        <div class="step-pill-number">1</div>
        <div class="step-pill-text">
          <div class="step-pill-title">Pega o escribe tu regla</div>
          <div class="step-pill-sub">En español simple, sin términos raros</div>
        </div>
      </div>
      <div class="workflow-step-pill active">
        <div class="step-pill-number">2</div>
        <div class="step-pill-text">
          <div class="step-pill-title">Clic en Generar Casos</div>
          <div class="step-pill-sub">Crea pruebas normales, límites y errores</div>
        </div>
      </div>
      <div class="workflow-step-pill active">
        <div class="step-pill-number">3</div>
        <div class="step-pill-text">
          <div class="step-pill-title">Revisa y Descarga</div>
          <div class="step-pill-sub">Aprueba con 1 clic y exporta a Excel</div>
        </div>
      </div>
    </div>

    <!-- 3. EL GENERADOR MÁGICO INSTANTÁNEO (HERO INTERACTIVO) -->
    <div class="instant-generator-card" id="instant-generator-box">
      <div class="instant-gen-header">
        <div class="instant-gen-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00ff87" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          <span>¿Qué deseas probar hoy? Genera tus casos de prueba en segundos</span>
        </div>
        <p class="instant-gen-subtitle">
          Escribe lo que hace tu pantalla, formulario o regla de negocio. Si lo prefieres, prueba con uno de los ejemplos listos abajo:
        </p>
      </div>

      <!-- Botones de Ejemplo Rápido (1 Clic para rellenar) -->
      <div class="sample-prompts-row">
        <span class="sample-prompts-label">💡 Probar con un ejemplo:</span>
        <button type="button" class="sample-prompt-chip" data-sample="login">
          <span>🔑 Inicio de Sesión & Bloqueo</span>
        </button>
        <button type="button" class="sample-prompt-chip" data-sample="cart">
          <span>🛒 Carrito & Cupón de Descuento</span>
        </button>
        <button type="button" class="sample-prompt-chip" data-sample="transfer">
          <span>💳 Transferencia con Monto Máximo</span>
        </button>
      </div>

      <!-- Cuadro de texto principal -->
      <textarea
        id="instant-req-text"
        class="instant-gen-textarea"
        placeholder="Ejemplo: El usuario inicia sesión ingresando su correo y contraseña. Si las credenciales son correctas, entra al panel. Si introduce una clave incorrecta, se muestra un mensaje de error. Si falla 3 veces consecutivas, la cuenta queda bloqueada por 15 minutos..."
      ></textarea>

      <!-- Barra de acciones y botón de generación -->
      <div class="instant-gen-actions">
        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
          <div class="gen-mode-toggle" title="Elige la forma de generar">
            <button type="button" class="gen-mode-btn active" id="mode-fast-btn">
              ⚡ Modo Rápido (1 segundo)
            </button>
            <button type="button" class="gen-mode-btn" id="mode-ai-btn">
              🤖 Modo Asistido por IA
            </button>
          </div>
          <span style="font-size:0.76rem; color:var(--text-muted);" id="mode-desc-text">
            ✓ Crea automáticamente pruebas de éxito, errores comunes y cantidades máximas y mínimas.
          </span>
        </div>

        <button type="button" id="btn-generate-instant" class="btn-instant-generate">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          <span id="btn-generate-text">✨ CREAR MIS PRUEBAS AHORA</span>
        </button>
      </div>
    </div>

    <!-- 4. Resumen Explicado en Lenguaje Humano (Si ya existen casos) -->
    ${
      totalCases > 0
        ? `
      <div id="results-summary-section" style="margin-bottom:24px;">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:14px;">
          <div>
            <h3 style="font-size:1.15rem; font-weight:700;">Pruebas Listas para tu Sistema</h3>
            <p style="font-size:0.82rem; color:var(--text-secondary);">
              Organizadas en 4 grupos claros para que sepas qué evalúa cada una:
            </p>
          </div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn btn-sm btn-outline" id="btn-export-excel-dashboard" style="color:#34d399; border-color:rgba(52,211,153,0.4);">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              📊 Descargar Todo en Excel
            </button>
            ${
              pendingCases > 0
                ? `
              <button class="btn btn-sm btn-success" id="btn-approve-all-dashboard">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                ✓ Aprobar todas las pruebas (${pendingCases})
              </button>
            `
                : ''
            }
          </div>
        </div>

        <!-- Tiras de Categorías en Lenguaje Humano -->
        <div class="results-category-strip">
          <div class="category-chip-box happy" title="Pruebas donde todo funciona como el usuario espera">
            <div class="cat-box-count happy">${happyCases.length}</div>
            <div>
              <div class="cat-box-label">🟢 Casos de Éxito</div>
              <div class="cat-box-sub">Cuando todo sale bien</div>
            </div>
          </div>
          <div class="category-chip-box error" title="Pruebas de errores, contraseñas malas o fallos del usuario">
            <div class="cat-box-count error">${errorCases.length}</div>
            <div>
              <div class="cat-box-label">🔴 Casos de Error</div>
              <div class="cat-box-sub">Si el usuario se equivoca</div>
            </div>
          </div>
          <div class="category-chip-box limit" title="Pruebas en los valores máximos, mínimos y fronteras">
            <div class="cat-box-count limit">${limitCases.length}</div>
            <div>
              <div class="cat-box-label">🟡 Casos Límite</div>
              <div class="cat-box-sub">Cantidades mínimas y máximas</div>
            </div>
          </div>
          <div class="category-chip-box val" title="Pruebas de campos vacíos o formatos incorrectos">
            <div class="cat-box-count val">${valCases.length}</div>
            <div>
              <div class="cat-box-label">🟣 Campos Obligatorios</div>
              <div class="cat-box-sub">Si falta llenar algún dato</div>
            </div>
          </div>
        </div>

        <!-- Muestra de Tarjetas Legibles (Primeras 4 o las generadas) -->
        <div style="display:flex; flex-direction:column; gap:14px;" id="dashboard-recent-cases">
          ${testCases
            .slice(0, 5)
            .map((tc) => renderFriendlyCard(tc))
            .join('')}
        </div>

        ${
          testCases.length > 5
            ? `
          <div style="text-align:center; margin-top:16px;">
            <button class="btn btn-outline" id="btn-see-more-cases" style="padding:10px 24px;">
              Ver los ${testCases.length} casos completos en la lista ➔
            </button>
          </div>
        `
            : ''
        }
      </div>
    `
        : `
      <!-- Estado vacío amigable cuando aún no hay casos -->
      <div class="card" style="text-align:center; padding:40px 20px; border:1px dashed var(--border-subtle); margin-bottom:24px;">
        <div style="font-size:2.2rem; margin-bottom:10px;">✨</div>
        <h3 style="font-size:1.1rem; font-weight:700; margin-bottom:6px;">Aún no has generado casos de prueba</h3>
        <p style="color:var(--text-secondary); font-size:0.85rem; max-width:540px; margin:0 auto 16px;">
          Escribe lo que hace tu aplicación en el recuadro superior o haz clic en cualquiera de los ejemplos para generar tu primera suite de pruebas en 1 clic.
        </p>
      </div>
    `
    }

    <!-- 5. Indicadores Generales de Estado -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:16px;">
      <div class="card home-stat" data-nav="requirements" style="cursor:pointer; text-align:center; padding:18px;">
        <div class="kpi-value font-display" style="font-size:2rem; font-weight:800;">${totalReqs}</div>
        <div style="color:var(--text-secondary); font-size:0.84rem;">Requisitos Guardados</div>
      </div>
      <div class="card home-stat" data-nav="test-cases" style="cursor:pointer; text-align:center; padding:18px;">
        <div class="kpi-value font-display" style="font-size:2rem; font-weight:800;">${totalCases}</div>
        <div style="color:var(--text-secondary); font-size:0.84rem;">Total Casos de Prueba</div>
      </div>
      <div class="card home-stat" data-nav="test-cases" style="cursor:pointer; text-align:center; padding:18px;">
        <div class="kpi-value font-display" style="font-size:2rem; font-weight:800; color:${pendingCases > 0 ? '#fbbf24' : '#34d399'};">${pendingCases}</div>
        <div style="color:var(--text-secondary); font-size:0.84rem;">Pendientes de Revisión</div>
      </div>
      <div class="card home-stat" data-nav="test-cases" style="cursor:pointer; text-align:center; padding:18px;">
        <div class="kpi-value font-display" style="font-size:2rem; font-weight:800; color:#34d399;">${approvedCases}</div>
        <div style="color:var(--text-secondary); font-size:0.84rem;">Aprobados para Pruebas</div>
      </div>
    </div>
  `;

  // --- Lógica de Interacción ---

  // 1. Botones de Ejemplos Rápido
  const samplePrompts = {
    login:
      'El usuario ingresa su correo electrónico y contraseña en la pantalla de inicio de sesión. Si los datos son correctos, el sistema le da acceso al panel principal. Si introduce credenciales incorrectas, se muestra un mensaje de alerta. Si se equivoca 3 veces consecutivas, la cuenta queda bloqueada automáticamente por 15 minutos.',
    cart:
      'El cliente agrega artículos a su carrito de compras. Si el total supera los $100 y aplica el código de cupón "PROMO20", recibe un 20% de descuento inmediato. Si el total es menor a $100 el cupón no se aplica. El envío es gratis para compras mayores o iguales a $50.',
    transfer:
      'El usuario realiza una transferencia bancaria a otra cuenta. El monto mínimo permitido es de $1 y el máximo de $5,000 por transacción. El usuario debe tener saldo disponible suficiente. Para transferencias superiores a $2,000, el sistema solicita un código de seguridad de 6 dígitos enviado por SMS.',
  };

  const textarea = container.querySelector('#instant-req-text');

  container.querySelectorAll('.sample-prompt-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const type = chip.getAttribute('data-sample');
      if (samplePrompts[type] && textarea) {
        textarea.value = samplePrompts[type];
        textarea.focus();
        toast.info('Ejemplo cargado. ¡Haz clic en "GENERAR CASOS DE PRUEBA AHORA"!');
      }
    });
  });

  // 2. Selector de Modo de Generación (Rápido vs IA)
  let selectedMode = 'fast'; // 'fast' | 'ai'
  const fastBtn = container.querySelector('#mode-fast-btn');
  const aiBtn = container.querySelector('#mode-ai-btn');
  const modeDesc = container.querySelector('#mode-desc-text');

  fastBtn?.addEventListener('click', () => {
    selectedMode = 'fast';
    fastBtn.classList.add('active');
    aiBtn?.classList.remove('active');
    if (modeDesc) modeDesc.textContent = '✓ Instantáneo, sin costo de tokens, validación de caminos normales y de error.';
  });

  aiBtn?.addEventListener('click', () => {
    selectedMode = 'ai';
    aiBtn.classList.add('active');
    fastBtn?.classList.remove('active');
    if (modeDesc) modeDesc.textContent = '✓ Análisis semántico profundo con Inteligencia Artificial.';
  });

  // 3. Ejecución del Generador Instantáneo
  const generateBtn = container.querySelector('#btn-generate-instant');
  const generateText = container.querySelector('#btn-generate-text');

  generateBtn?.addEventListener('click', async () => {
    const text = textarea?.value.trim();
    if (!text || text.length < 15) {
      toast.warning('Por favor escribe o pega una regla de al menos 15 caracteres (o elige un ejemplo arriba).');
      textarea?.focus();
      return;
    }

    // Deshabilitar botón durante generación
    generateBtn.disabled = true;
    generateText.textContent = '⏳ Analizando y generando casos de prueba...';

    try {
      // 1. Asegurar proyecto activo
      let currentProjectId = store.get('activeProjectId');
      let currentProjects = store.get('projects') || [];

      if (!currentProjectId || currentProjects.length === 0) {
        // Crear proyecto automático en background
        const newProjRes = await api.createProject({
          name: 'Mi Sistema de Software',
          code: 'PROJ-01',
          description: 'Proyecto creado automáticamente para pruebas rápidas',
        });
        if (newProjRes.data) {
          project = newProjRes.data;
          currentProjectId = project.id;
          store.set('activeProjectId', project.id);
          store.set('activeProject', project);
          store.set('projects', [project]);
        }
      }

      // 2. Crear el requisito a partir del texto
      const firstLine = text.split('\n')[0].replace(/[^a-zA-Z0-9 áéíóúÁÉÍÓÚñÑ]/g, '').trim();
      const reqTitle = firstLine.length > 5 && firstLine.length < 60 ? firstLine : 'Regla de negocio: ' + text.slice(0, 45) + '...';
      const reqCode = `REQ-${Math.floor(100 + Math.random() * 900)}`;

      const newReqRes = await api.createRequirement({
        projectId: currentProjectId,
        code: reqCode,
        title: reqTitle,
        description: text,
        acceptanceCriteria: text,
      });

      const createdReq = newReqRes.data;
      store.set('activeRequirementId', createdReq.id);
      store.set('activeRequirement', createdReq);

      // 3. Generar casos según el modo elegido
      if (selectedMode === 'fast') {
        await api.generateHeuristicTests({
          requirementId: createdReq.id,
          clearPrevious: false,
        });
      } else {
        await api.generateAiTests({
          requirementId: createdReq.id,
          provider: 'mock',
          model: 'gpt-4o-mini',
          clearPreviousUnapproved: false,
          useCache: true,
        });
      }

      // 4. Actualizar estado y recargar casos del proyecto
      const allTcRes = await api.getProjectTestCases(currentProjectId);
      if (allTcRes.data) {
        store.set('testCases', allTcRes.data);
      }
      const reqsRes = await api.getRequirements(currentProjectId);
      if (reqsRes.data) {
        store.set('requirements', reqsRes.data);
      }

      toast.success('🎉 ¡Casos de prueba generados con éxito!');
      // Re-renderizar vista
      renderDashboard(container);
    } catch (err) {
      console.error('Error al generar casos:', err);
      toast.error(`No se pudo completar la generación: ${err.message || 'Error del servidor'}`);
      generateBtn.disabled = false;
      generateText.textContent = '✨ GENERAR CASOS DE PRUEBA AHORA';
    }
  });

  // 4. Exportar a Excel desde el Dashboard
  container.querySelector('#btn-export-excel-dashboard')?.addEventListener('click', () => {
    downloadCasesToCsv(testCases, project?.name || 'TestGenAI');
  });

  // 5. Aprobar todos los pendientes desde el Dashboard
  container.querySelector('#btn-approve-all-dashboard')?.addEventListener('click', async () => {
    const pendings = testCases.filter((c) => c.status === 'PENDING');
    if (pendings.length === 0) return;
    try {
      const ids = pendings.map((c) => c.id);
      await api.batchReviewTestCases(ids, 'APPROVED', 'Aprobado desde el inicio rápido');
      toast.success(`¡Se aprobaron los ${ids.length} casos con éxito!`);
      const pId = store.get('activeProjectId');
      if (pId) {
        const res = await api.getProjectTestCases(pId);
        if (res.data) store.set('testCases', res.data);
      }
      renderDashboard(container);
    } catch (err) {
      toast.error(`Error al aprobar: ${err.message}`);
    }
  });

  // 6. Navegación a la lista completa
  container.querySelector('#btn-dashboard-view-all-cases')?.addEventListener('click', () => go('test-cases'));
  container.querySelector('#btn-see-more-cases')?.addEventListener('click', () => go('test-cases'));
  container.querySelector('#btn-dashboard-new-project')?.addEventListener('click', () => modals.open('modal-new-project'));

  container.querySelectorAll('.home-stat').forEach((c) => {
    c.addEventListener('click', () => go(c.getAttribute('data-nav')));
  });

  // 7. Acciones directas en las tarjetas de muestra (Aprobar, Editar)
  container.querySelectorAll('.btn-card-quick-approve').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      try {
        await api.reviewTestCase(id, { decision: 'APPROVED', comments: 'Aprobado desde inicio rápido' });
        toast.success('✓ Caso aprobado correctamente');
        const pId = store.get('activeProjectId');
        if (pId) {
          const res = await api.getProjectTestCases(pId);
          if (res.data) store.set('testCases', res.data);
        }
        renderDashboard(container);
      } catch (err) {
        toast.error(`Error: ${err.message}`);
      }
    });
  });

  container.querySelectorAll('.btn-card-quick-edit').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const tc = testCases.find((c) => c.id === id);
      if (tc) modals.populateEditTestCase(tc);
    });
  });
}

// Renderiza una tarjeta de caso con lenguaje amigable y sin jerga incomprensible
function renderFriendlyCard(tc) {
  const steps = Array.isArray(tc.steps) ? tc.steps : [tc.steps];

  const typeConfig = {
    positive: { label: '🟢 Caso de Éxito', border: '#10b981', desc: 'Comprueba que funcione bien con datos correctos' },
    negative: { label: '🔴 Caso de Error', border: '#ef4444', desc: 'Comprueba que avise al usuario si se equivoca' },
    boundary: { label: '🟡 Caso Límite', border: '#f59e0b', desc: 'Comprueba las cantidades mínimas o máximas' },
    validation: { label: '🟣 Revisión de Campos', border: '#8b5cf6', desc: 'Comprueba campos obligatorios o formatos especiales' },
  };

  const conf = typeConfig[tc.type] || { label: '🔵 Prueba General', border: 'var(--primary)', desc: 'Caso de verificación del sistema' };

  let statusBadge = `<span class="badge badge-pending">⏳ Por Revisar</span>`;
  if (tc.status === 'APPROVED') statusBadge = `<span class="badge badge-approved">✓ Aprobado</span>`;
  else if (tc.status === 'MODIFIED') statusBadge = `<span class="badge badge-modified">✏ Modificado</span>`;
  else if (tc.status === 'REJECTED') statusBadge = `<span class="badge badge-rejected">✕ Rechazado</span>`;

  return `
    <div class="card" style="border-left:4px solid ${conf.border}; padding:16px 20px;">
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; margin-bottom:10px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-family:var(--font-mono); font-weight:700; font-size:0.85rem; color:var(--text-muted);">${tc.code}</span>
          <span style="font-size:0.82rem; font-weight:700; color:${conf.border};">${conf.label}</span>
        </div>
        <div>${statusBadge}</div>
      </div>

      <div style="font-weight:700; font-size:1.02rem; margin-bottom:10px; color:var(--text-primary);">
        ${tc.title}
      </div>

      <!-- Pasos a seguir explicados -->
      <div style="margin-bottom:12px;">
        <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:4px;">
          📋 ¿Cómo probarlo? (Pasos sencillos):
        </div>
        <div style="display:flex; flex-direction:column; gap:4px; font-size:0.86rem; color:var(--text-secondary);">
          ${steps.map((step, idx) => `<div><strong>${idx + 1}.</strong> ${step}</div>`).join('')}
        </div>
      </div>

      <!-- Datos y Resultado Esperado -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:12px; margin-bottom:14px;">
        ${
          tc.testData
            ? `
          <div style="background:rgba(0,0,0,0.25); padding:8px 12px; border-radius:var(--radius-sm);">
            <div style="font-size:0.72rem; font-weight:700; color:var(--text-muted); margin-bottom:2px;">⌨️ ¿Qué debes escribir?:</div>
            <div style="font-size:0.84rem; color:var(--text-secondary);">${tc.testData}</div>
          </div>
        `
            : ''
        }
        <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.25); padding:8px 12px; border-radius:var(--radius-sm);">
          <div style="font-size:0.72rem; font-weight:700; color:#34d399; margin-bottom:2px;">✅ ¿Qué debe responder la pantalla?:</div>
          <div style="font-size:0.84rem; color:var(--text-primary); font-weight:500;">${tc.expectedResult || 'El sistema responde adecuadamente.'}</div>
        </div>
      </div>

      <!-- Botones de Acción Inmediata -->
      <div style="display:flex; align-items:center; justify-content:flex-end; gap:8px;">
        <button class="btn btn-sm btn-outline btn-card-quick-edit" data-id="${tc.id}">
          ✏ Modificar
        </button>
        ${
          tc.status !== 'APPROVED'
            ? `
          <button class="btn btn-sm btn-success btn-card-quick-approve" data-id="${tc.id}">
            ✓ Aprobar esta prueba
          </button>
        `
            : ''
        }
      </div>
    </div>
  `;
}
