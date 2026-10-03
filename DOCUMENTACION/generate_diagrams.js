const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const diagDir = 'C:/Users/LENOVO/Desktop/CALIDAD/DOCUMENTACION/diagrams';
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const diagrams = [
  // 1. Organigrama
  {
    name: 'diag_01_organigrama',
    title: 'Organigrama Funcional del Proyecto TestGenAI',
    width: 1100,
    height: 650,
    html: `
      <div style="font-family:'Segoe UI', Arial, sans-serif; background:#ffffff; padding:30px; text-align:center;">
        <h2 style="color:#1e3a8a; margin-bottom:25px; font-size:24px; font-weight:700;">Estructura Organizacional — TestGenAI QA Solutions</h2>
        
        <!-- Nivel 1 -->
        <div style="display:inline-block; background:#1e3a8a; color:#ffffff; padding:14px 35px; border-radius:8px; font-weight:bold; font-size:18px; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          Dirección General del Proyecto / Product Owner<br/>
          <span style="font-size:13px; font-weight:normal; opacity:0.9;">Gestión de Alcance, Metodología e Investigación EPIS</span>
        </div>

        <div style="width:2px; height:30px; background:#64748b; margin:0 auto;"></div>

        <!-- Nivel 2: Comite Asesor y Gobernanza -->
        <div style="display:flex; justify-content:center; align-items:center; gap:40px; margin-bottom:10px;">
          <div style="background:#f1f5f9; border:2px dashed #0284c7; color:#0369a1; padding:10px 25px; border-radius:6px; font-size:14px; font-weight:600;">
            Comité de Asesoría Metodológica & Normativa<br/>
            <span style="font-size:12px; font-weight:normal; color:#475569;">Alineación ISTQB CTFL v4.0 e ISO/IEC/IEEE 29148</span>
          </div>
          <div style="background:#fef2f2; border:2px dashed #dc2626; color:#b91c1c; padding:10px 25px; border-radius:6px; font-size:14px; font-weight:600;">
            Gobernanza de Inteligencia Artificial & Seguridad<br/>
            <span style="font-size:12px; font-weight:normal; color:#475569;">Control de Presupuesto, Enmascaramiento PII y Guardrails</span>
          </div>
        </div>

        <div style="width:2px; height:30px; background:#64748b; margin:0 auto;"></div>

        <!-- Nivel 3: Jefatura Tecnica -->
        <div style="display:inline-block; background:#0f766e; color:#ffffff; padding:12px 30px; border-radius:8px; font-weight:bold; font-size:16px;">
          Liderazgo de Ingeniería & Arquitectura de Software (QA Lead)
        </div>

        <div style="width:780px; height:2px; background:#64748b; margin:25px auto 0 auto;"></div>
        <div style="display:flex; justify-content:space-between; width:780px; margin:0 auto;">
          <div style="width:2px; height:25px; background:#64748b;"></div>
          <div style="width:2px; height:25px; background:#64748b;"></div>
          <div style="width:2px; height:25px; background:#64748b;"></div>
        </div>

        <!-- Nivel 4: Areas Especializadas -->
        <div style="display:flex; justify-content:center; gap:25px;">
          <div style="width:245px; background:#f8fafc; border:1.5px solid #cbd5e1; border-top:4px solid #2563eb; padding:15px; border-radius:6px; text-align:left;">
            <div style="font-weight:700; color:#1e293b; font-size:15px; margin-bottom:8px;">Área de Backend & Modelos</div>
            <div style="font-size:12.5px; color:#475569; line-height:1.5;">
              • Node.js, Express, TypeScript<br/>
              • Persistencia PostgreSQL & Prisma<br/>
              • Orquestador Gemini / OpenAI<br/>
              • Validadores de Esquema Zod
            </div>
          </div>

          <div style="width:245px; background:#f8fafc; border:1.5px solid #cbd5e1; border-top:4px solid #059669; padding:15px; border-radius:6px; text-align:left;">
            <div style="font-weight:700; color:#1e293b; font-size:15px; margin-bottom:8px;">Área de Frontend & UX</div>
            <div style="font-size:12.5px; color:#475569; line-height:1.5;">
              • SPA Modular nativa ES Modules<br/>
              • Sistema de diseño & Tokens CSS<br/>
              • Interfaz de Auditoría Humana<br/>
              • Accesibilidad WCAG 2.1 AA
            </div>
          </div>

          <div style="width:245px; background:#f8fafc; border:1.5px solid #cbd5e1; border-top:4px solid #d97706; padding:15px; border-radius:6px; text-align:left;">
            <div style="font-weight:700; color:#1e293b; font-size:15px; margin-bottom:8px;">Área de QA & Trazabilidad</div>
            <div style="font-size:12.5px; color:#475569; line-height:1.5;">
              • Diseño de Suites de Prueba<br/>
              • Matriz de Cobertura Requisito-Caso<br/>
              • Detección de Ambigüedad & Duplicados<br/>
              • Exportación de Artefactos Formales
            </div>
          </div>
        </div>
      </div>
    `
  },

  // 2. Proceso Actual
  {
    name: 'diag_02_proceso_actual',
    title: 'Diagrama de Actividades — Proceso Actual Manual',
    width: 1100,
    height: 700,
    html: `
      <div style="font-family:'Segoe UI', Arial, sans-serif; background:#ffffff; padding:25px;">
        <h2 style="color:#b91c1c; text-align:center; margin-bottom:20px; font-size:22px; font-weight:700;">Diagrama de Actividades: Proceso Tradicional Manual de Diseño de Pruebas</h2>
        
        <div style="display:flex; justify-content:center; align-items:flex-start; gap:20px;">
          <!-- Columna Tester -->
          <div style="width:480px; border:2px solid #cbd5e1; border-radius:8px; overflow:hidden;">
            <div style="background:#e2e8f0; padding:10px; font-weight:bold; text-align:center; color:#1e293b; font-size:16px;">
              Analista de Calidad / Tester QA (Manual)
            </div>
            <div style="padding:20px; display:flex; flex-direction:column; align-items:center; gap:16px;">
              <div style="width:24px; height:24px; background:#1e293b; border-radius:50%;"></div>
              
              <div style="background:#ffffff; border:1.5px solid #64748b; border-radius:6px; padding:10px 16px; text-align:center; font-size:13px; width:340px;">
                <b>1. Recepción y lectura manual</b> de especificaciones de requisitos o historias de usuario
              </div>
              <div style="color:#64748b; font-size:18px;">↓</div>

              <div style="background:#ffffff; border:1.5px solid #64748b; border-radius:6px; padding:10px 16px; text-align:center; font-size:13px; width:340px;">
                <b>2. Interpretación subjetiva</b> de criterios de aceptación y reglas de negocio
              </div>
              <div style="color:#64748b; font-size:18px;">↓</div>

              <div style="background:#fef2f2; border:1.5px solid #ef4444; border-radius:6px; padding:10px 16px; text-align:center; font-size:13px; width:340px; color:#991b1b;">
                ⚠️ <b>Redacción manual en Excel/Word</b><br/>
                <span style="font-size:11px;">Frecuente omisión de valores límite, validaciones y escenarios negativos</span>
              </div>
              <div style="color:#64748b; font-size:18px;">↓</div>

              <div style="background:#fef2f2; border:1.5px solid #ef4444; border-radius:6px; padding:10px 16px; text-align:center; font-size:13px; width:340px; color:#991b1b;">
                ⚠️ <b>Vinculación manual de trazabilidad</b><br/>
                <span style="font-size:11px;">Mantenimiento artesanal propenso a desactualización y enlaces rotos</span>
              </div>
              <div style="color:#64748b; font-size:18px;">↓</div>

              <div style="background:#ffffff; border:1.5px solid #64748b; border-radius:6px; padding:10px 16px; text-align:center; font-size:13px; width:340px;">
                <b>3. Consolidación de informe de pruebas</b> y entrega manual al equipo de desarrollo
              </div>
              <div style="color:#64748b; font-size:18px;">↓</div>

              <div style="width:26px; height:26px; border:2px solid #1e293b; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                <div style="width:16px; height:16px; background:#1e293b; border-radius:50%;"></div>
              </div>
            </div>
          </div>

          <!-- Columna Problemas Detectados -->
          <div style="width:480px; border:2px solid #fecaca; border-radius:8px; overflow:hidden; background:#fffaf0;">
            <div style="background:#fee2e2; padding:10px; font-weight:bold; text-align:center; color:#991b1b; font-size:16px;">
              Cuellos de Botella y Deficiencias del Proceso Actual
            </div>
            <div style="padding:20px; font-size:13px; color:#334155; line-height:1.6;">
              <p><b>1. Consumo Excesivo de Tiempo:</b> Más del 60% del tiempo de QA se invierte en redactar casos rutinarios en vez de analizar riesgos del negocio.</p>
              <p><b>2. Cobertura Asimétrica:</b> Concentración en flujos positivos (*Happy Path*); casi nula cobertura de frontera (*Boundary Value Analysis*) y valores atípicos.</p>
              <p><b>3. Ambigüedad Trasladada:</b> Criterios vagos o contradictorios en requisitos no se detectan tempranamente y se convierten en pruebas inválidas.</p>
              <p><b>4. Duplicidad y Dispersión:</b> Casos redactados con diferente redacción por distintos testers generan redundancia y costos de ejecución innecesarios.</p>
              <p><b>5. Trazabilidad Frágil:</b> Ante cambios de versión en los requisitos, las matrices en hojas de cálculo quedan obsoletas de forma inmediata.</p>
            </div>
          </div>
        </div>
      </div>
    `
  },

  // 3. Proceso Propuesto
  {
    name: 'diag_03_proceso_propuesto',
    title: 'Diagrama de Actividades — Proceso Propuesto TestGenAI',
    width: 1150,
    height: 750,
    html: `
      <div style="font-family:'Segoe UI', Arial, sans-serif; background:#ffffff; padding:20px;">
        <h2 style="color:#0f766e; text-align:center; margin-bottom:20px; font-size:22px; font-weight:700;">Diagrama de Actividades: Proceso Propuesto Asistido por IA con Auditoría Humana (TestGenAI)</h2>

        <div style="display:flex; justify-content:center; gap:15px;">
          <!-- Carril 1: Analista QA -->
          <div style="width:340px; border:1.5px solid #cbd5e1; border-radius:8px; overflow:hidden;">
            <div style="background:#0284c7; color:#ffffff; padding:8px; font-weight:bold; text-align:center; font-size:14px;">
              Analista de Pruebas (QA Tester)
            </div>
            <div style="padding:15px; display:flex; flex-direction:column; align-items:center; gap:14px; font-size:12.5px;">
              <div style="width:20px; height:20px; background:#0284c7; border-radius:50%;"></div>
              
              <div style="background:#f0f9ff; border:1px solid #7dd3fc; border-radius:6px; padding:8px 12px; text-align:center; width:280px;">
                <b>Registra o importa requisitos</b><br/>
                (CSV/JSON con criterios de aceptación)
              </div>
              <div style="color:#64748b;">↓</div>

              <div style="background:#f0fdf4; border:1px solid #86efac; border-radius:6px; padding:8px 12px; text-align:center; width:280px;">
                <b>Evalúa advertencias de ambigüedad</b><br/>
                (Detector estático ISO 29148)
              </div>
              <div style="color:#64748b;">↓</div>

              <div style="background:#f0f9ff; border:1px solid #7dd3fc; border-radius:6px; padding:8px 12px; text-align:center; width:280px;">
                <b>Solicita generación con IA</b><br/>
                (Selecciona proveedor Gemini / OpenAI)
              </div>
              <div style="color:#64748b; font-size:20px;">➔ [Pasa a TestGenAI Engine]</div>

              <div style="background:#fef3c7; border:1.5px solid #f59e0b; border-radius:6px; padding:10px 12px; text-align:center; width:280px; margin-top:110px;">
                <b>AUDITORÍA HUMANA INDIVIDUAL</b><br/>
                • Revisa caso por caso<br/>
                • Aprueba flujos válidos<br/>
                • Edita precondiciones o pasos<br/>
                • Rechaza con justificación obligatoria
              </div>
              <div style="color:#64748b;">↓</div>

              <div style="background:#f0f9ff; border:1px solid #7dd3fc; border-radius:6px; padding:8px 12px; text-align:center; width:280px;">
                <b>Consulta trazabilidad y exporta</b><br/>
                (CSV, JSON, Markdown, Gherkin)
              </div>
              <div style="color:#64748b;">↓</div>

              <div style="width:22px; height:22px; border:2px solid #0f766e; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                <div style="width:14px; height:14px; background:#0f766e; border-radius:50%;"></div>
              </div>
            </div>
          </div>

          <!-- Carril 2: Motor Backend & Seguridad -->
          <div style="width:400px; border:1.5px solid #cbd5e1; border-radius:8px; overflow:hidden;">
            <div style="background:#0f766e; color:#ffffff; padding:8px; font-weight:bold; text-align:center; font-size:14px;">
              TestGenAI Core Backend (Seguridad & Dominio)
            </div>
            <div style="padding:15px; display:flex; flex-direction:column; align-items:center; gap:12px; font-size:12px;">
              <div style="background:#ffffff; border:1px solid #94a3b8; border-radius:6px; padding:8px 12px; text-align:center; width:340px; margin-top:125px;">
                <b>1. Control de Guardrails:</b><br/>
                • PromptGuard (Anti-Inyección)<br/>
                • PIIMasker (Enmascaramiento de datos personales)<br/>
                • Validación de presupuesto de IA ($ USD)
              </div>
              <div style="color:#64748b;">↓</div>

              <div style="background:#ffffff; border:1px solid #94a3b8; border-radius:6px; padding:8px 12px; text-align:center; width:340px;">
                <b>2. Verificación de Caché SHA-256:</b><br/>
                Si existe fingerprint idéntica ➔ Retorna 0 tokens
              </div>
              <div style="color:#64748b;">↓ (Si no está en caché)</div>

              <div style="background:#ffffff; border:1px solid #94a3b8; border-radius:6px; padding:8px 12px; text-align:center; width:340px;">
                <b>3. Envía Prompt estructurado a la IA</b>
              </div>
              <div style="color:#64748b; font-size:18px;">➔ [Invocación Externa] ➔</div>

              <div style="background:#ffffff; border:1px solid #94a3b8; border-radius:6px; padding:8px 12px; text-align:center; width:340px; margin-top:10px;">
                <b>4. Validación Estricta con Zod:</b><br/>
                Verifica esquema JSON de las 5 categorías ISTQB.<br/>
                Restaura PII desenmascarando tokens.
              </div>
              <div style="color:#64748b;">↓</div>

              <div style="background:#ffffff; border:1px solid #94a3b8; border-radius:6px; padding:8px 12px; text-align:center; width:340px;">
                <b>5. Persistencia Transaccional:</b><br/>
                Asigna códigos CP-001 atómicos y guarda en estado PENDING
              </div>
              <div style="color:#64748b; font-size:18px;">➔ [Notifica a UI de Auditoría]</div>
            </div>
          </div>

          <!-- Carril 3: Proveedor de IA Real -->
          <div style="width:330px; border:1.5px solid #cbd5e1; border-radius:8px; overflow:hidden;">
            <div style="background:#475569; color:#ffffff; padding:8px; font-weight:bold; text-align:center; font-size:14px;">
              Proveedor de IA (Google Gemini / OpenAI)
            </div>
            <div style="padding:15px; display:flex; flex-direction:column; align-items:center; gap:12px; font-size:12px; margin-top:240px;">
              <div style="background:#f8fafc; border:1.5px solid #64748b; border-radius:6px; padding:12px; text-align:center; width:280px;">
                <b>Inferencia LLM Fundacional:</b><br/>
                • Procesa especificación anonimizada<br/>
                • Deduce casos: Positivo, Negativo, Límite, Alternativa y Validación<br/>
                • Devuelve JSON estructurado + tokens
              </div>
              <div style="color:#64748b;">↓</div>
              <div style="font-size:11px; color:#475569; text-align:center;">
                Retorno de respuesta HTTP con metadatos reales de latencia y uso
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  },

  // 4. Diagrama de Paquetes
  {
    name: 'diag_04_paquetes',
    title: 'Diagrama de Paquetes — Arquitectura Hexagonal y Modular',
    width: 1100,
    height: 700,
    html: `
      <div style="font-family:'Segoe UI', Arial, sans-serif; background:#ffffff; padding:25px;">
        <h2 style="color:#1e3a8a; text-align:center; margin-bottom:25px; font-size:22px; font-weight:700;">Diagrama de Paquetes del Sistema (Clean / Hexagonal Architecture)</h2>

        <div style="display:flex; flex-direction:column; gap:20px; max-width:980px; margin:0 auto;">
          <!-- Paquete Presentación -->
          <div style="border:2px solid #3b82f6; border-radius:8px; padding:15px; background:#eff6ff;">
            <div style="font-weight:bold; color:#1d4ed8; font-size:16px; margin-bottom:10px;">📦 Capa de Presentación (Frontend SPA — ES Modules)</div>
            <div style="display:flex; gap:12px; flex-wrap:wrap;">
              <div style="background:#ffffff; border:1px solid #bfdbfe; padding:8px 14px; border-radius:6px; font-size:13px;">view: Dashboard</div>
              <div style="background:#ffffff; border:1px solid #bfdbfe; padding:8px 14px; border-radius:6px; font-size:13px;">view: Projects</div>
              <div style="background:#ffffff; border:1px solid #bfdbfe; padding:8px 14px; border-radius:6px; font-size:13px;">view: Requirements</div>
              <div style="background:#ffffff; border:1px solid #bfdbfe; padding:8px 14px; border-radius:6px; font-size:13px;">view: TestCases & ReviewModal</div>
              <div style="background:#ffffff; border:1px solid #bfdbfe; padding:8px 14px; border-radius:6px; font-size:13px;">view: Traceability</div>
              <div style="background:#ffffff; border:1px solid #bfdbfe; padding:8px 14px; border-radius:6px; font-size:13px;">view: Metrics & Economics</div>
            </div>
          </div>

          <!-- Paquete Aplicación -->
          <div style="border:2px solid #059669; border-radius:8px; padding:15px; background:#f0fdf4;">
            <div style="font-weight:bold; color:#047857; font-size:16px; margin-bottom:10px;">📦 Capa de Aplicación (Casos de Uso / Orquestación)</div>
            <div style="display:flex; gap:12px; flex-wrap:wrap;">
              <div style="background:#ffffff; border:1px solid #bbf7d0; padding:8px 14px; border-radius:6px; font-size:13px;">GenerateTestCasesUseCase</div>
              <div style="background:#ffffff; border:1px solid #bbf7d0; padding:8px 14px; border-radius:6px; font-size:13px;">ReviewTestCaseUseCase</div>
              <div style="background:#ffffff; border:1px solid #bbf7d0; padding:8px 14px; border-radius:6px; font-size:13px;">RequirementImportUseCase</div>
              <div style="background:#ffffff; border:1px solid #bbf7d0; padding:8px 14px; border-radius:6px; font-size:13px;">TraceabilityMatrixUseCase</div>
              <div style="background:#ffffff; border:1px solid #bbf7d0; padding:8px 14px; border-radius:6px; font-size:13px;">ExportArtifactsUseCase</div>
            </div>
          </div>

          <!-- Paquete Dominio -->
          <div style="border:2px solid #d97706; border-radius:8px; padding:15px; background:#fffbeb;">
            <div style="font-weight:bold; color:#b45309; font-size:16px; margin-bottom:10px;">📦 Capa de Dominio (Entidades, Value Objects & Reglas Puras)</div>
            <div style="display:flex; gap:12px; flex-wrap:wrap;">
              <div style="background:#ffffff; border:1px solid #fde68a; padding:8px 14px; border-radius:6px; font-size:13px;">Entity: Requirement & Version</div>
              <div style="background:#ffffff; border:1px solid #fde68a; padding:8px 14px; border-radius:6px; font-size:13px;">Entity: TestCase & ReviewSnapshot</div>
              <div style="background:#ffffff; border:1px solid #fde68a; padding:8px 14px; border-radius:6px; font-size:13px;">VO: ISTQBTechnique</div>
              <div style="background:#ffffff; border:1px solid #fde68a; padding:8px 14px; border-radius:6px; font-size:13px;">VO: EvidenceStatus</div>
              <div style="background:#ffffff; border:1px solid #fde68a; padding:8px 14px; border-radius:6px; font-size:13px;">Service: AmbiguityDetector</div>
              <div style="background:#ffffff; border:1px solid #fde68a; padding:8px 14px; border-radius:6px; font-size:13px;">Service: DuplicateDetector</div>
            </div>
          </div>

          <!-- Paquete Infraestructura y Adaptadores -->
          <div style="display:flex; gap:20px;">
            <div style="flex:1; border:2px solid #7c3aed; border-radius:8px; padding:15px; background:#faf5ff;">
              <div style="font-weight:bold; color:#6d28d9; font-size:15px; margin-bottom:10px;">📦 Adaptadores de IA & Guardrails</div>
              <div style="font-size:13px; color:#475569; line-height:1.6;">
                • IAIProvider (Puerto / Interfaz)<br/>
                • GeminiAdapter (@google/generative-ai)<br/>
                • OpenAIAdapter (REST Client)<br/>
                • PromptGuard & PIIMasker
              </div>
            </div>

            <div style="flex:1; border:2px solid #475569; border-radius:8px; padding:15px; background:#f8fafc;">
              <div style="font-weight:bold; color:#334155; font-size:15px; margin-bottom:10px;">📦 Persistencia & Seguridad (Infraestructura)</div>
              <div style="font-size:13px; color:#475569; line-height:1.6;">
                • PostgreSQL 16 Relacional & JSONB<br/>
                • Prisma ORM & Repositorios Concretos<br/>
                • CookieSessionManager & JWT Rotativo<br/>
                • Middlewares Helmet, CORS, RateLimiter
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  },

  // 5. Casos de Uso General
  {
    name: 'diag_05_casos_uso_general',
    title: 'Diagrama General de Casos de Uso del Sistema',
    width: 1150,
    height: 750,
    html: `
      <div style="font-family:'Segoe UI', Arial, sans-serif; background:#ffffff; padding:25px;">
        <h2 style="color:#1e3a8a; text-align:center; margin-bottom:20px; font-size:22px; font-weight:700;">Diagrama General de Casos de Uso (UML Use Case Diagram)</h2>

        <div style="display:flex; justify-content:space-between; align-items:center; max-width:1050px; margin:0 auto;">
          <!-- Actores Izquierda -->
          <div style="display:flex; flex-direction:column; gap:140px;">
            <div style="text-align:center;">
              <div style="font-size:36px;">👤</div>
              <div style="font-weight:bold; color:#1e293b; font-size:14px;">QA Tester</div>
              <div style="font-size:11px; color:#64748b;">Analista de Pruebas</div>
            </div>

            <div style="text-align:center;">
              <div style="font-size:36px;">👤</div>
              <div style="font-weight:bold; color:#1e293b; font-size:14px;">QA Lead</div>
              <div style="font-size:11px; color:#64748b;">Líder de Calidad</div>
            </div>
          </div>

          <!-- Limite del Sistema (System Boundary) -->
          <div style="width:720px; border:2px solid #0284c7; border-radius:12px; background:#f8fafc; padding:20px; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
            <div style="font-weight:bold; color:#0369a1; font-size:16px; margin-bottom:15px; border-bottom:1.5px solid #bae6fd; padding-bottom:6px;">
              Sistema TestGenAI — Límite del Sistema
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
              <div style="background:#ffffff; border:1.5px solid #0284c7; border-radius:20px; padding:10px 14px; text-align:center; font-size:13px; font-weight:600; color:#0369a1;">
                CU-01: Iniciar Sesión & Sesión Segura
              </div>
              <div style="background:#ffffff; border:1.5px solid #0284c7; border-radius:20px; padding:10px 14px; text-align:center; font-size:13px; font-weight:600; color:#0369a1;">
                CU-02: Administrar Proyectos & Presupuesto
              </div>
              <div style="background:#ffffff; border:1.5px solid #0284c7; border-radius:20px; padding:10px 14px; text-align:center; font-size:13px; font-weight:600; color:#0369a1;">
                CU-03: Registrar e Importar Requisitos
              </div>
              <div style="background:#ffffff; border:1.5px solid #0284c7; border-radius:20px; padding:10px 14px; text-align:center; font-size:13px; font-weight:600; color:#0369a1;">
                CU-04: Analizar Ambigüedad (ISO 29148)
              </div>
              <div style="background:#ffffff; border:1.5px solid #0f766e; border-radius:20px; padding:10px 14px; text-align:center; font-size:13px; font-weight:bold; color:#0f766e;">
                CU-05: Generar Casos con IA Real
              </div>
              <div style="background:#ffffff; border:1.5px solid #0f766e; border-radius:20px; padding:10px 14px; text-align:center; font-size:13px; font-weight:bold; color:#0f766e;">
                CU-06: Auditar Caso (Aprobar/Editar/Rechazar)
              </div>
              <div style="background:#ffffff; border:1.5px solid #0284c7; border-radius:20px; padding:10px 14px; text-align:center; font-size:13px; font-weight:600; color:#0369a1;">
                CU-07: Consultar Matriz de Trazabilidad
              </div>
              <div style="background:#ffffff; border:1.5px solid #0284c7; border-radius:20px; padding:10px 14px; text-align:center; font-size:13px; font-weight:600; color:#0369a1;">
                CU-08: Consultar Métricas Reales & Tokens
              </div>
              <div style="background:#ffffff; border:1.5px solid #0284c7; border-radius:20px; padding:10px 14px; text-align:center; font-size:13px; font-weight:600; color:#0369a1;">
                CU-09: Exportar Casos (CSV/JSON/MD)
              </div>
              <div style="background:#ffffff; border:1.5px solid #475569; border-radius:20px; padding:10px 14px; text-align:center; font-size:13px; font-weight:600; color:#334155;">
                CU-10: Configurar Proveedores LLM & Users
              </div>
            </div>
          </div>

          <!-- Actores Derecha -->
          <div style="display:flex; flex-direction:column; gap:140px;">
            <div style="text-align:center;">
              <div style="font-size:36px;">👤</div>
              <div style="font-weight:bold; color:#1e293b; font-size:14px;">Desarrollador</div>
              <div style="font-size:11px; color:#64748b;">Consulta de Pruebas</div>
            </div>

            <div style="text-align:center;">
              <div style="font-size:36px;">👤</div>
              <div style="font-weight:bold; color:#1e293b; font-size:14px;">Administrador</div>
              <div style="font-size:11px; color:#64748b;">Gestión Global</div>
            </div>
          </div>
        </div>
      </div>
    `
  },

  // 6. Actividades con Objetos
  {
    name: 'diag_08_actividades_objetos',
    title: 'Diagrama de Actividades con Objetos y Flujo de Estados',
    width: 1100,
    height: 650,
    html: `
      <div style="font-family:'Segoe UI', Arial, sans-serif; background:#ffffff; padding:25px;">
        <h2 style="color:#0f766e; text-align:center; margin-bottom:20px; font-size:22px; font-weight:700;">Diagrama de Actividades con Objetos (Object Flow Diagram)</h2>

        <div style="display:flex; justify-content:center; align-items:center; gap:20px; flex-wrap:wrap; margin-top:20px;">
          <!-- Nodo 1 -->
          <div style="text-align:center;">
            <div style="background:#f0f9ff; border:1.5px solid #0284c7; padding:10px 16px; border-radius:8px; font-size:13px; font-weight:bold; color:#0369a1;">
              Actividad:<br/>Registrar Requisito
            </div>
            <div style="margin:10px 0; font-size:18px; color:#64748b;">↓</div>
            <div style="background:#fef3c7; border:1.5px dashed #d97706; padding:8px 14px; border-radius:4px; font-size:12px; color:#92400e;">
              [Objeto: Requirement]<br/>
              estado = ACTIVE<br/>
              version = 1
            </div>
          </div>

          <div style="font-size:24px; color:#64748b;">➔</div>

          <!-- Nodo 2 -->
          <div style="text-align:center;">
            <div style="background:#f0fdf4; border:1.5px solid #059669; padding:10px 16px; border-radius:8px; font-size:13px; font-weight:bold; color:#047857;">
              Actividad:<br/>Invocación LLM & Validación
            </div>
            <div style="margin:10px 0; font-size:18px; color:#64748b;">↓</div>
            <div style="background:#fef3c7; border:1.5px dashed #d97706; padding:8px 14px; border-radius:4px; font-size:12px; color:#92400e;">
              [Objeto: AiGeneration]<br/>
              status = SUCCEEDED<br/>
              tokens, latency, cost
            </div>
          </div>

          <div style="font-size:24px; color:#64748b;">➔</div>

          <!-- Nodo 3 -->
          <div style="text-align:center;">
            <div style="background:#f0f9ff; border:1.5px solid #0284c7; padding:10px 16px; border-radius:8px; font-size:13px; font-weight:bold; color:#0369a1;">
              Actividad:<br/>Persistencia Inicial
            </div>
            <div style="margin:10px 0; font-size:18px; color:#64748b;">↓</div>
            <div style="background:#fee2e2; border:1.5px dashed #dc2626; padding:8px 14px; border-radius:4px; font-size:12px; color:#991b1b;">
              [Objeto: TestCase]<br/>
              status = PENDING<br/>
              version = 1
            </div>
          </div>

          <div style="font-size:24px; color:#64748b;">➔</div>

          <!-- Nodo 4 -->
          <div style="text-align:center;">
            <div style="background:#fef3c7; border:1.5px solid #f59e0b; padding:10px 16px; border-radius:8px; font-size:13px; font-weight:bold; color:#b45309;">
              Actividad:<br/>Auditoría Humana (QA)
            </div>
            <div style="margin:10px 0; font-size:18px; color:#64748b;">↓</div>
            <div style="background:#f0fdf4; border:1.5px dashed #059669; padding:8px 14px; border-radius:4px; font-size:12px; color:#065f46;">
              [Objeto: TestCaseReview]<br/>
              decision = APPROVED<br/>
              snapshots inmutables
            </div>
          </div>

          <div style="font-size:24px; color:#64748b;">➔</div>

          <!-- Nodo 5 -->
          <div style="text-align:center;">
            <div style="background:#f0fdf4; border:1.5px solid #059669; padding:10px 16px; border-radius:8px; font-size:13px; font-weight:bold; color:#047857;">
              Actividad:<br/>Trazabilidad & Suite
            </div>
            <div style="margin:10px 0; font-size:18px; color:#64748b;">↓</div>
            <div style="background:#dcfce7; border:1.5px dashed #16a34a; padding:8px 14px; border-radius:4px; font-size:12px; color:#14532d;">
              [Objeto: TestCase]<br/>
              status = APPROVED<br/>
              incorporado a cobertura
            </div>
          </div>
        </div>
      </div>
    `
  },

  // 7. Secuencia IA
  {
    name: 'diag_09_secuencia_ia',
    title: 'Diagrama de Secuencia — Generación Asistida con IA Real',
    width: 1100,
    height: 700,
    html: `
      <div style="font-family:'Segoe UI', Arial, sans-serif; background:#ffffff; padding:25px;">
        <h2 style="color:#1e3a8a; text-align:center; margin-bottom:20px; font-size:22px; font-weight:700;">Diagrama de Secuencia: Invocación y Generación con IA Real (CU-05)</h2>

        <!-- Participantes -->
        <div style="display:flex; justify-content:space-between; margin-bottom:20px; border-bottom:2px solid #cbd5e1; padding-bottom:12px;">
          <div style="background:#e0f2fe; padding:8px 14px; border-radius:6px; font-weight:bold; font-size:13px; color:#0369a1;">QA Tester (UI)</div>
          <div style="background:#f1f5f9; padding:8px 14px; border-radius:6px; font-weight:bold; font-size:13px; color:#334155;">Backend Router /api/v1/ai</div>
          <div style="background:#dcfce7; padding:8px 14px; border-radius:6px; font-weight:bold; font-size:13px; color:#15803d;">GenerateTestCasesUseCase</div>
          <div style="background:#fef3c7; padding:8px 14px; border-radius:6px; font-weight:bold; font-size:13px; color:#b45309;">PromptGuard & PIIMasker</div>
          <div style="background:#fee2e2; padding:8px 14px; border-radius:6px; font-weight:bold; font-size:13px; color:#b91c1c;">AI Provider (Gemini/OpenAI)</div>
          <div style="background:#f3e8ff; padding:8px 14px; border-radius:6px; font-weight:bold; font-size:13px; color:#7e22ce;">PostgreSQL (Prisma)</div>
        </div>

        <!-- Mensajes en cascada -->
        <div style="font-size:12.5px; color:#1e293b; line-height:1.7; padding:0 20px;">
          <p><b>1.</b> Tester pulsa <i>"Generar Casos con IA"</i> ➔ <code>POST /api/v1/ai/generate { requirementId, provider }</code></p>
          <p><b>2.</b> Router autentica JWT mediante Cookie HttpOnly y delega en <code>GenerateTestCasesUseCase.execute()</code></p>
          <p><b>3.</b> UseCase consulta Requisito y verifica presupuesto del Proyecto en <code>PostgreSQL</code></p>
          <p><b>4.</b> UseCase invoca <code>PromptGuard.assertSafe()</code> y <code>PIIMasker.maskMultiple()</code> (anonimiza DNI, correos, etc.)</p>
          <p><b>5.</b> UseCase envía especificación enmascarada a <code>AIProvider.generateTestCases()</code></p>
          <p><b>6.</b> Proveedor LLM procesa en lenguaje natural y retorna JSON con casos en las 5 técnicas ISTQB</p>
          <p><b>7.</b> UseCase valida esquema estricto con <code>Zod</code> y restaura datos personales con <code>PIIMasker.unmask()</code></p>
          <p><b>8.</b> UseCase inicia transacción corta en <code>PostgreSQL</code>: registra <code>AiGeneration</code> (tokens, ms, USD) y guarda <code>TestCase</code> en estado <b>PENDING</b> con correlativos <b>CP-001...</b></p>
          <p><b>9.</b> Backend retorna código HTTP 201 con casos y advertencias de duplicidad al Frontend SPA</p>
        </div>
      </div>
    `
  },

  // 8. Secuencia Auditoria
  {
    name: 'diag_10_secuencia_auditoria',
    title: 'Diagrama de Secuencia — Auditoría Humana y Transacción Inmutable',
    width: 1100,
    height: 700,
    html: `
      <div style="font-family:'Segoe UI', Arial, sans-serif; background:#ffffff; padding:25px;">
        <h2 style="color:#0f766e; text-align:center; margin-bottom:20px; font-size:22px; font-weight:700;">Diagrama de Secuencia: Auditoría Humana y Bloqueo Optimista (CU-06)</h2>

        <!-- Participantes -->
        <div style="display:flex; justify-content:space-between; margin-bottom:20px; border-bottom:2px solid #cbd5e1; padding-bottom:12px;">
          <div style="background:#e0f2fe; padding:8px 14px; border-radius:6px; font-weight:bold; font-size:13px; color:#0369a1;">QA Tester (Modal Revisión)</div>
          <div style="background:#f1f5f9; padding:8px 14px; border-radius:6px; font-weight:bold; font-size:13px; color:#334155;">TestCases Router</div>
          <div style="background:#dcfce7; padding:8px 14px; border-radius:6px; font-weight:bold; font-size:13px; color:#15803d;">ReviewTestCaseUseCase</div>
          <div style="background:#f3e8ff; padding:8px 14px; border-radius:6px; font-weight:bold; font-size:13px; color:#7e22ce;">PostgreSQL Transaction (Prisma)</div>
        </div>

        <!-- Mensajes -->
        <div style="font-size:12.5px; color:#1e293b; line-height:1.7; padding:0 20px;">
          <p><b>1.</b> Tester inspecciona caso individual, edita pasos o resultado y presiona <i>"Aprobar"</i> o <i>"Rechazar"</i></p>
          <p><b>2.</b> Modal envía: <code>PATCH /api/v1/test-cases/:id/review { decision, comments, justification, expectedVersion }</code></p>
          <p><b>3.</b> Router valida DTO con Zod y llama a <code>ReviewTestCaseUseCase.execute()</code></p>
          <p><b>4.</b> UseCase verifica regla de negocio: si <code>decision === 'REJECTED'</code>, exige <code>comments</code> no vacío.</p>
          <p><b>5.</b> UseCase verifica regla de conflicto: si <code>evidenceStatus === 'conflict'</code> y se aprueba, exige <code>justification</code> técnica.</p>
          <p><b>6.</b> UseCase abre <code>prisma.$transaction()</code>:</p>
          <div style="background:#f8fafc; border-left:4px solid #0f766e; padding:8px 15px; margin:6px 0;">
            • Comprueba <code>case.version === expectedVersion</code>. Si no coincide ➔ <b>HTTP 409 Conflict</b> (Bloqueo optimista)<br/>
            • Actualiza <code>TestCase</code>: estado (APPROVED/MODIFIED/REJECTED), version = version + 1<br/>
            • Inserta registro inmutable en <code>TestCaseReview</code> con snapshot completo <b>previousContent</b> y <b>newContent</b>
          </div>
          <p><b>7.</b> Transacción efectúa commit atómico en PostgreSQL</p>
          <p><b>8.</b> Backend retorna caso actualizado y recalcula matriz de cobertura automáticamente en el Frontend</p>
        </div>
      </div>
    `
  },

  // 9. Diagrama de Clases
  {
    name: 'diag_11_clases_dominio',
    title: 'Diagrama de Clases — Modelo de Dominio y Persistencia',
    width: 1150,
    height: 750,
    html: `
      <div style="font-family:'Segoe UI', Arial, sans-serif; background:#ffffff; padding:20px;">
        <h2 style="color:#1e3a8a; text-align:center; margin-bottom:20px; font-size:22px; font-weight:700;">Diagrama de Clases del Dominio (Domain Entities & Value Objects)</h2>

        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:16px;">
          <!-- Clase User -->
          <div style="border:1.5px solid #64748b; border-radius:6px; overflow:hidden; font-size:11.5px;">
            <div style="background:#1e3a8a; color:#ffffff; padding:6px; font-weight:bold; text-align:center;">User</div>
            <div style="padding:8px; background:#f8fafc; border-bottom:1px solid #cbd5e1; font-family:monospace;">
              + id: string (UUID)<br/>
              + email: string<br/>
              + passwordHash: string<br/>
              + fullName: string<br/>
              + role: UserRole<br/>
              + isActive: boolean
            </div>
            <div style="padding:6px; font-size:11px; color:#475569;">
              + validatePassword(pwd): boolean<br/>
              + hasPermission(action): boolean
            </div>
          </div>

          <!-- Clase Project -->
          <div style="border:1.5px solid #64748b; border-radius:6px; overflow:hidden; font-size:11.5px;">
            <div style="background:#1e3a8a; color:#ffffff; padding:6px; font-weight:bold; text-align:center;">Project</div>
            <div style="padding:8px; background:#f8fafc; border-bottom:1px solid #cbd5e1; font-family:monospace;">
              + id: string (UUID)<br/>
              + name: string<br/>
              + description: string<br/>
              + status: ProjectStatus<br/>
              + budgetUsd: number<br/>
              + nextRequirementNumber: int
            </div>
            <div style="padding:6px; font-size:11px; color:#475569;">
              + getNextRequirementCode(): string<br/>
              + isBudgetExceeded(spent): boolean
            </div>
          </div>

          <!-- Clase Requirement -->
          <div style="border:1.5px solid #64748b; border-radius:6px; overflow:hidden; font-size:11.5px;">
            <div style="background:#0f766e; color:#ffffff; padding:6px; font-weight:bold; text-align:center;">Requirement</div>
            <div style="padding:8px; background:#f8fafc; border-bottom:1px solid #cbd5e1; font-family:monospace;">
              + id: string (UUID)<br/>
              + projectId: string<br/>
              + code: string (REQ-001)<br/>
              + title: string<br/>
              + description: string<br/>
              + acceptanceCriteria: string<br/>
              + version: int<br/>
              + nextCaseNumber: int
            </div>
            <div style="padding:6px; font-size:11px; color:#475569;">
              + createVersionSnapshot(): ReqVersion<br/>
              + getNextCaseCode(): string
            </div>
          </div>

          <!-- Clase TestCase -->
          <div style="border:1.5px solid #64748b; border-radius:6px; overflow:hidden; font-size:11.5px;">
            <div style="background:#0f766e; color:#ffffff; padding:6px; font-weight:bold; text-align:center;">TestCase</div>
            <div style="padding:8px; background:#f8fafc; border-bottom:1px solid #cbd5e1; font-family:monospace;">
              + id: string (UUID)<br/>
              + requirementId: string<br/>
              + generationId: string<br/>
              + code: string (CP-001)<br/>
              + type: ISTQBTechnique<br/>
              + title: string<br/>
              + preconditions: string[] (JSON)<br/>
              + steps: string[] (JSON)<br/>
              + testData: string<br/>
              + expectedResult: string<br/>
              + version: int (optimistic)<br/>
              + status: TestCaseStatus
            </div>
            <div style="padding:6px; font-size:11px; color:#475569;">
              + approve(reviewerId, just): void<br/>
              + reject(reviewerId, comment): void
            </div>
          </div>

          <!-- Clase TestCaseReview -->
          <div style="border:1.5px solid #64748b; border-radius:6px; overflow:hidden; font-size:11.5px;">
            <div style="background:#0f766e; color:#ffffff; padding:6px; font-weight:bold; text-align:center;">TestCaseReview</div>
            <div style="padding:8px; background:#f8fafc; border-bottom:1px solid #cbd5e1; font-family:monospace;">
              + id: string (UUID)<br/>
              + testCaseId: string<br/>
              + reviewerId: string<br/>
              + decision: ReviewDecision<br/>
              + comments: string<br/>
              + justification: string<br/>
              + previousContent: JSON<br/>
              + newContent: JSON
            </div>
            <div style="padding:6px; font-size:11px; color:#475569;">
              + getAuditSnapshot(): SnapshotDiff
            </div>
          </div>

          <!-- Clase AiGeneration -->
          <div style="border:1.5px solid #64748b; border-radius:6px; overflow:hidden; font-size:11.5px;">
            <div style="background:#475569; color:#ffffff; padding:6px; font-weight:bold; text-align:center;">AiGeneration</div>
            <div style="padding:8px; background:#f8fafc; border-bottom:1px solid #cbd5e1; font-family:monospace;">
              + id: string (UUID)<br/>
              + requirementId: string<br/>
              + provider: string (gemini/openai)<br/>
              + model: string<br/>
              + inputTokens: int<br/>
              + outputTokens: int<br/>
              + estimatedCost: float<br/>
              + responseTimeMs: int<br/>
              + inputHash: string<br/>
              + status: GenStatus
            </div>
            <div style="padding:6px; font-size:11px; color:#475569;">
              + calculateCost(pricing): float
            </div>
          </div>
        </div>
      </div>
    `
  }
];

async function main() {
  console.log('Generating HTML and PNG diagrams...');
  for (const diag of diagrams) {
    const htmlPath = path.join(diagDir, `${diag.name}.html`);
    const pngPath = path.join(diagDir, `${diag.name}.png`);
    
    fs.writeFileSync(htmlPath, `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{margin:0;padding:0;background:#ffffff;}</style></head><body>${diag.html}</body></html>`);
    
    console.log(`Rendering ${diag.name}.png...`);
    const cmd = `"${chromePath}" --headless=new --disable-gpu --screenshot="${pngPath}" --window-size=${diag.width},${diag.height} "file:///${htmlPath.replace(/\\/g, '/')}"`;
    execSync(cmd, { stdio: 'inherit' });
    console.log(`✓ Created ${diag.name}.png`);
  }
  console.log('All diagrams generated successfully!');
}

main().catch(console.error);
