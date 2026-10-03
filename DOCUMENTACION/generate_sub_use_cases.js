const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const diagDir = 'C:/Users/LENOVO/Desktop/CALIDAD/DOCUMENTACION/diagrams';
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const subDiags = [
  {
    name: 'diag_06_cu_requisitos_ia',
    title: 'Diagrama de Casos de Uso — Módulo Requisitos y Generación con IA',
    width: 900,
    height: 520,
    html: `
      <div style="font-family:'Segoe UI', Arial, sans-serif; background:#ffffff; padding:20px;">
        <h3 style="color:#0f766e; text-align:center; font-size:18px; margin-bottom:20px;">Subsistema: Gestión de Requisitos y Generación con IA</h3>
        <div style="display:flex; justify-content:space-between; align-items:center; max-width:820px; margin:0 auto;">
          <div style="text-align:center;">
            <div style="font-size:36px;">👤</div>
            <div style="font-weight:bold; color:#1e293b; font-size:14px;">QA Tester</div>
          </div>
          <div style="width:580px; border:2px solid #0f766e; border-radius:10px; background:#f0fdf4; padding:15px;">
            <div style="display:flex; flex-direction:column; gap:10px;">
              <div style="background:#ffffff; border:1.5px solid #0f766e; border-radius:16px; padding:8px 14px; text-align:center; font-size:12.5px; font-weight:600; color:#065f46;">
                CU-03: Registrar Requisito Funcional (Código REQ-001, Criterios)
              </div>
              <div style="background:#ffffff; border:1.5px solid #0f766e; border-radius:16px; padding:8px 14px; text-align:center; font-size:12.5px; font-weight:600; color:#065f46;">
                CU-03.1: Importar Requisitos Masivamente (CSV / JSON validado)
              </div>
              <div style="background:#ffffff; border:1.5px solid #0f766e; border-radius:16px; padding:8px 14px; text-align:center; font-size:12.5px; font-weight:600; color:#065f46;">
                CU-04: Analizar Ambigüedad de Criterios (ISO/IEC/IEEE 29148)
              </div>
              <div style="background:#ffffff; border:1.5px solid #047857; border-radius:16px; padding:8px 14px; text-align:center; font-size:12.5px; font-weight:bold; color:#064e3b; box-shadow:0 2px 4px rgba(0,0,0,0.05);">
                CU-05: Derivar Casos de Prueba con IA Real (Gemini / OpenAI)
              </div>
              <div style="background:#ffffff; border:1.5px solid #0f766e; border-radius:16px; padding:8px 14px; text-align:center; font-size:12.5px; font-weight:600; color:#065f46;">
                CU-05.1: Detectar Duplicados y Clasificar Evidencia ISTQB
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    name: 'diag_07_cu_auditoria_casos',
    title: 'Diagrama de Casos de Uso — Módulo Auditoría Humana y Casos de Prueba',
    width: 900,
    height: 520,
    html: `
      <div style="font-family:'Segoe UI', Arial, sans-serif; background:#ffffff; padding:20px;">
        <h3 style="color:#1e3a8a; text-align:center; font-size:18px; margin-bottom:20px;">Subsistema: Auditoría Humana y Gestión de Casos de Prueba</h3>
        <div style="display:flex; justify-content:space-between; align-items:center; max-width:820px; margin:0 auto;">
          <div style="text-align:center;">
            <div style="font-size:36px;">👤</div>
            <div style="font-weight:bold; color:#1e293b; font-size:14px;">QA Tester / QA Lead</div>
          </div>
          <div style="width:580px; border:2px solid #1e3a8a; border-radius:10px; background:#eff6ff; padding:15px;">
            <div style="display:flex; flex-direction:column; gap:10px;">
              <div style="background:#ffffff; border:1.5px solid #2563eb; border-radius:16px; padding:8px 14px; text-align:center; font-size:12.5px; font-weight:600; color:#1e40af;">
                CU-06: Auditar Caso en Modal Individual (Human-in-the-Loop)
              </div>
              <div style="background:#ffffff; border:1.5px solid #2563eb; border-radius:16px; padding:8px 14px; text-align:center; font-size:12.5px; font-weight:600; color:#1e40af;">
                CU-06.1: Editar Pasos, Precondiciones y Datos de Prueba (Diff Viewer)
              </div>
              <div style="background:#ffffff; border:1.5px solid #2563eb; border-radius:16px; padding:8px 14px; text-align:center; font-size:12.5px; font-weight:600; color:#1e40af;">
                CU-06.2: Aprobar Caso con Justificación de Conflicto (Control Concurrencia)
              </div>
              <div style="background:#ffffff; border:1.5px solid #2563eb; border-radius:16px; padding:8px 14px; text-align:center; font-size:12.5px; font-weight:600; color:#1e40af;">
                CU-06.3: Rechazar Caso con Motivo Obligatorio para Historial
              </div>
              <div style="background:#ffffff; border:1.5px solid #2563eb; border-radius:16px; padding:8px 14px; text-align:center; font-size:12.5px; font-weight:600; color:#1e40af;">
                CU-10: Diseñar Casos Manuales y BVA Sin IA (Plataforma Dual)
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    name: 'diag_07b_cu_trazabilidad_metricas',
    title: 'Diagrama de Casos de Uso — Módulo Trazabilidad, Métricas y Exportación',
    width: 900,
    height: 520,
    html: `
      <div style="font-family:'Segoe UI', Arial, sans-serif; background:#ffffff; padding:20px;">
        <h3 style="color:#d97706; text-align:center; font-size:18px; margin-bottom:20px;">Subsistema: Trazabilidad, Analítica y Exportación</h3>
        <div style="display:flex; justify-content:space-between; align-items:center; max-width:820px; margin:0 auto;">
          <div style="text-align:center;">
            <div style="font-size:36px;">👤</div>
            <div style="font-weight:bold; color:#1e293b; font-size:14px;">QA Lead / Dev</div>
          </div>
          <div style="width:580px; border:2px solid #d97706; border-radius:10px; background:#fffbeb; padding:15px;">
            <div style="display:flex; flex-direction:column; gap:10px;">
              <div style="background:#ffffff; border:1.5px solid #d97706; border-radius:16px; padding:8px 14px; text-align:center; font-size:12.5px; font-weight:600; color:#92400e;">
                CU-07: Visualizar Matriz de Trazabilidad y Cobertura Requisito ↔ Caso
              </div>
              <div style="background:#ffffff; border:1.5px solid #d97706; border-radius:16px; padding:8px 14px; text-align:center; font-size:12.5px; font-weight:600; color:#92400e;">
                CU-08: Consultar Indicadores de Calidad (Aprobados, Modificados, Rechazados)
              </div>
              <div style="background:#ffffff; border:1.5px solid #d97706; border-radius:16px; padding:8px 14px; text-align:center; font-size:12.5px; font-weight:600; color:#92400e;">
                CU-08.1: Monitorear Consumo Real de Tokens, Latencia y Costos USD
              </div>
              <div style="background:#ffffff; border:1.5px solid #d97706; border-radius:16px; padding:8px 14px; text-align:center; font-size:12.5px; font-weight:600; color:#92400e;">
                CU-09: Exportar Suite Oficial en CSV Protegido, JSON y Markdown
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    name: 'diag_07c_cu_administracion',
    title: 'Diagrama de Casos de Uso — Módulo Administración del Sistema y Seguridad',
    width: 900,
    height: 520,
    html: `
      <div style="font-family:'Segoe UI', Arial, sans-serif; background:#ffffff; padding:20px;">
        <h3 style="color:#475569; text-align:center; font-size:18px; margin-bottom:20px;">Subsistema: Administración del Sistema y Gobernanza de Seguridad</h3>
        <div style="display:flex; justify-content:space-between; align-items:center; max-width:820px; margin:0 auto;">
          <div style="text-align:center;">
            <div style="font-size:36px;">👤</div>
            <div style="font-weight:bold; color:#1e293b; font-size:14px;">Administrador</div>
          </div>
          <div style="width:580px; border:2px solid #475569; border-radius:10px; background:#f8fafc; padding:15px;">
            <div style="display:flex; flex-direction:column; gap:10px;">
              <div style="background:#ffffff; border:1.5px solid #475569; border-radius:16px; padding:8px 14px; text-align:center; font-size:12.5px; font-weight:600; color:#334155;">
                CU-01: Gestionar Sesiones Seguras con Cookies HttpOnly y Revocación
              </div>
              <div style="background:#ffffff; border:1.5px solid #475569; border-radius:16px; padding:8px 14px; text-align:center; font-size:12.5px; font-weight:600; color:#334155;">
                CU-02: Gestionar Proyectos de Software y Límites de Presupuesto ($ USD)
              </div>
              <div style="background:#ffffff; border:1.5px solid #475569; border-radius:16px; padding:8px 14px; text-align:center; font-size:12.5px; font-weight:600; color:#334155;">
                CU-10: Configurar Proveedores de IA (Gemini / OpenAI API Keys)
              </div>
              <div style="background:#ffffff; border:1.5px solid #475569; border-radius:16px; padding:8px 14px; text-align:center; font-size:12.5px; font-weight:600; color:#334155;">
                CU-10.1: Administrar Cuentas de Usuario y Matriz de Roles (RBAC)
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }
];

for (const diag of subDiags) {
  const htmlPath = path.join(diagDir, `${diag.name}.html`);
  const pngPath = path.join(diagDir, `${diag.name}.png`);
  fs.writeFileSync(htmlPath, `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{margin:0;padding:0;background:#ffffff;}</style></head><body>${diag.html}</body></html>`);
  console.log(`Rendering ${diag.name}.png...`);
  const cmd = `"${chromePath}" --headless=new --disable-gpu --screenshot="${pngPath}" --window-size=${diag.width},${diag.height} "file:///${htmlPath.replace(/\\/g, '/')}"`;
  execSync(cmd, { stdio: 'inherit' });
  console.log(`✓ Created ${diag.name}.png`);
}
