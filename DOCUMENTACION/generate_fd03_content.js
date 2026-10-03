// ==============================================================================
// Generador Completo de Contenido OpenXML para FD03 SRS TestGenAI (Norma APA 7)
// ==============================================================================

const { p, h1, h2, h3, h4, apaTable, apaFigure, apaReference, pageBreak } = require('./xml_helpers');

function generateBodyXml() {
  const parts = [];

  // ----------------------------------------------------------------------------
  // PORTADA INSTITUCIONAL (Universidad Privada de Tacna)
  // ----------------------------------------------------------------------------
  parts.push(`
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="160"/></w:pPr>
      <w:r>
        <w:drawing>
          <wp:inline distB="0" distT="0" distL="0" distR="0">
            <wp:extent cx="1200000" cy="1613000"/>
            <wp:docPr id="1" name="Logo UPT"/>
            <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                  <pic:nvPicPr>
                    <pic:cNvPr id="0" name="image2.png"/>
                    <pic:cNvPicPr preferRelativeResize="0"/>
                  </pic:nvPicPr>
                  <pic:blipFill>
                    <a:blip r:embed="rIdLogo"/>
                    <a:stretch><a:fillRect/></a:stretch>
                  </pic:blipFill>
                  <pic:spPr>
                    <a:xfrm><a:off x="0" y="0"/><a:ext cx="1200000" cy="1613000"/></a:xfrm>
                    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                  </pic:spPr>
                </pic:pic>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>
  `);

  parts.push(p('UNIVERSIDAD PRIVADA DE TACNA', { align: 'center', bold: true, size: 30, font: 'Arial', color: '1E3A8A', after: 60 }));
  parts.push(p('FACULTAD DE INGENIERÍA', { align: 'center', bold: true, size: 24, font: 'Arial', color: '334155', after: 40 }));
  parts.push(p('Escuela Profesional de Ingeniería de Sistemas', { align: 'center', bold: true, size: 22, font: 'Arial', color: '0F766E', after: 200 }));

  parts.push(p('INFORME FINAL — ESPECIFICACIÓN DE REQUERIMIENTOS DE SOFTWARE (SRS)', { align: 'center', bold: true, size: 20, font: 'Arial', color: '475569', after: 120 }));

  parts.push(p('“TestGenAI: Sistema Inteligente de Generación, Validación y Trazabilidad de Casos de Prueba Funcionales a partir de Requisitos de Software mediante Inteligencia Artificial Generativa”', { align: 'center', bold: true, size: 26, font: 'Arial', color: '1E3A8A', after: 240 }));

  parts.push(p('Curso: Calidad y Pruebas de Software', { align: 'center', size: 22, font: 'Calibri', color: '1E293B', after: 60 }));
  parts.push(p('Docente: [PENDIENTE DE VALIDACIÓN]', { align: 'center', italic: true, size: 22, font: 'Calibri', color: '64748B', after: 160 }));

  parts.push(p('Autores / Integrantes:', { align: 'center', bold: true, size: 22, font: 'Arial', color: '1E293B', after: 60 }));
  parts.push(p('Dongo Palza, Manuel Andree (Código: 2023076842)', { align: 'center', size: 22, font: 'Calibri', color: '1E293B', after: 40 }));
  parts.push(p('Flores Chino, Milton H. (Código: 2023078333)', { align: 'center', size: 22, font: 'Calibri', color: '1E293B', after: 260 }));

  parts.push(p('Tacna – Perú', { align: 'center', bold: true, size: 22, font: 'Arial', color: '334155', after: 40 }));
  parts.push(p('2026', { align: 'center', bold: true, size: 22, font: 'Arial', color: '334155', after: 120 }));

  parts.push(pageBreak());

  // ----------------------------------------------------------------------------
  // CONTROL DE VERSIONES
  // ----------------------------------------------------------------------------
  parts.push(h1('CONTROL DE VERSIONES'));
  parts.push(p('El presente registro resume el ciclo de revisiones, autorías y aprobaciones formales del Documento de Especificación de Requerimientos de Software (SRS) de TestGenAI, garantizando consistencia técnica entre la especificación y la arquitectura implementada en el sistema.', { after: 140 }));

  parts.push(apaTable(
    '1',
    'Registro de Control de Versiones del Documento SRS',
    ['Versión', 'Hecha por', 'Revisada por', 'Aprobada por', 'Fecha', 'Motivo / Descripción del Cambio'],
    [
      ['1.0', 'Dongo Palza, M. A.\nFlores Chino, M. H.', 'Comité de Evaluación EPIS\nÁrea de Calidad QA Lead', 'Dirección de Escuela EPIS\nUniversidad Privada de Tacna', '02/10/2026', 'Versión Definitiva del SRS consolidado para el MVP Real de TestGenAI, integrando requerimientos funcionales, no funcionales, reglas de negocio, modelos conceptuales y lógica de persistencia.']
    ],
    [900, 1600, 1500, 1500, 1000, 2000],
    'Documento rector del sistema TestGenAI (Flores Chino & Dongo Palza, 2026).'
  ));

  parts.push(p('TestGenAI — Sistema Inteligente de Generación y Gestión de Pruebas Funcionales', { bold: true, size: 22, color: '1E3A8A', align: 'center', after: 40 }));
  parts.push(p('Versión 1.0 (MVP Real Consolidado)', { italic: true, size: 20, color: '64748B', align: 'center', after: 180 }));

  parts.push(pageBreak());

  // ----------------------------------------------------------------------------
  // ÍNDICE GENERAL
  // ----------------------------------------------------------------------------
  parts.push(h1('INDICE GENERAL'));
  
  const tocItems = [
    ['INTRODUCCIÓN', '4'],
    ['I. Generalidades de la Empresa', '5'],
    ['   1. Nombre de la Empresa', '5'],
    ['   2. Visión', '5'],
    ['   3. Misión', '5'],
    ['   4. Organigrama', '5'],
    ['II. Visionamiento de la Empresa', '6'],
    ['   1. Descripción del Problema', '6'],
    ['   2. Objetivos de Negocios', '8'],
    ['   3. Objetivos de Diseño', '8'],
    ['   4. Alcance del Proyecto', '9'],
    ['   5. Viabilidad del Sistema', '10'],
    ['   6. Información Obtenida del Levantamiento de Información', '11'],
    ['III. Análisis de Procesos', '12'],
    ['   a) Diagrama del Proceso Actual — Diagrama de actividades', '12'],
    ['      3.1. Problemas identificados', '13'],
    ['   b) Diagrama del Proceso Propuesto — Diagrama de actividades', '14'],
    ['      3.2. Beneficios del proceso propuesto', '15'],
    ['IV. Especificación de Requerimientos de Software', '16'],
    ['   a) Cuadro de Requerimientos Funcionales (Inicial)', '16'],
    ['   b) Cuadro de Requerimientos No Funcionales', '19'],
    ['   c) Cuadro de Requerimientos Funcionales (Final)', '21'],
    ['   d) Reglas de Negocio', '25'],
    ['V. Fase de Desarrollo', '28'],
    ['   1. Perfiles de Usuario', '28'],
    ['   2. Modelo Conceptual', '29'],
    ['      a) Diagrama de Paquetes', '29'],
    ['      b) Diagrama de Casos de Uso', '30'],
    ['      c) Escenarios de Caso de Uso (Narrativa)', '34'],
    ['   3. Modelo Lógico', '41'],
    ['      a) Análisis de Objetos', '41'],
    ['      b) Diagrama de Actividades con Objetos', '43'],
    ['      c) Diagramas de Secuencia', '44'],
    ['      d) Diagrama de Clases', '47'],
    ['CONCLUSIONES', '49'],
    ['RECOMENDACIONES', '50'],
    ['BIBLIOGRAFÍA', '51'],
    ['WEBGRAFÍA', '52']
  ];

  parts.push(apaTable(
    '2',
    'Estructura y Contenido Temático del Documento SRS',
    ['Sección / Capítulo del Documento', 'Página'],
    tocItems,
    [7200, 1300],
    'Paginación estructurada según formato de titulación de la Escuela Profesional de Ingeniería de Sistemas (EPIS).'
  ));

  parts.push(pageBreak());

  // ----------------------------------------------------------------------------
  // INTRODUCCIÓN
  // ----------------------------------------------------------------------------
  parts.push(h1('INTRODUCCIÓN'));
  parts.push(p('El presente documento constituye la Especificación de Requerimientos de Software (SRS) para la plataforma TestGenAI, elaborado con estricto apego a las normas internacionales ISO/IEC/IEEE 29148:2018 (Ingeniería de Requisitos) y alineado con los principios de aseguramiento de calidad del International Software Testing Qualifications Board (ISTQB, 2024).', { after: 120 }));

  parts.push(p('En la ingeniería de software contemporánea, la derivación de casos de prueba funcionales a partir de especificaciones, historias de usuario y criterios de aceptación constituye una de las tareas más críticas y a la vez más demandantes en horas-hombre. La identificación de condiciones de frontera, flujos alternativos, validaciones y caminos negativos suele verse afectada por restricciones de tiempo y fatiga cognitiva, derivando en omisiones que alcanzan etapas tardías con costos exponenciales de corrección.', { after: 120 }));

  parts.push(p('TestGenAI surge como una solución tecnológica diseñada para asistir al profesional de aseguramiento de calidad (QA) mediante la incorporación de Inteligencia Artificial Generativa fundada en modelos de lenguaje masivos (LLMs), operando bajo un paradigma estricto de auditoría humana ("Human-in-the-Loop"). La plataforma no reemplaza el juicio técnico del evaluador, sino que actúa como un motor inteligente de aceleración inicial con trazabilidad matemática y formal del 100%.', { after: 120 }));

  parts.push(p('El propósito central de este informe es especificar de forma rigurosa y verificable los requerimientos funcionales, no funcionales, reglas de negocio y modelos lógicos que rigen el MVP Real de TestGenAI. El sistema incorpora mecanismos de seguridad como enmascaramiento bidireccional de PII, guardrails contra inyecciones de prompt, validación tipada con esquemas Zod y persistencia transaccional sobre PostgreSQL 16.', { after: 140 }));

  // ----------------------------------------------------------------------------
  // I. GENERALIDADES DE LA EMPRESA
  // ----------------------------------------------------------------------------
  parts.push(h1('I. Generalidades de la Empresa'));

  parts.push(h2('1. Nombre de la Empresa'));
  parts.push(p('Iniciativa Tecnológica: TestGenAI QA Solutions', { bold: true }));
  parts.push(p('Marco Institucional: Laboratorio de Calidad y Pruebas de Software — Escuela Profesional de Ingeniería de Sistemas (EPIS), Facultad de Ingeniería, Universidad Privada de Tacna.', { after: 120 }));

  parts.push(h2('2. Visión'));
  parts.push(p('Consolidarse como la plataforma tecnológica y metodológica de referencia en el ámbito académico y profesional del sur del Perú y la región para la derivación asistida, auditoría humana y trazabilidad formal de pruebas de software, promoviendo la adopción de inteligencia artificial generativa ética, medible y alineada con estándares internacionales de calidad de software (ISTQB CTFL v4.0 e ISO/IEC/IEEE 29148).', { after: 120 }));

  parts.push(h2('3. Misión'));
  parts.push(p('Proveer a analistas de aseguramiento de calidad (QA Testers), líderes de prueba (QA Leads) y desarrolladores una plataforma web robusta, modular e intuitiva que reduzca drásticamente los tiempos de diseño de pruebas funcionales, garantice la cobertura sistemática de escenarios límite y negativos, preserve la soberanía del evaluador humano y brinde métricas fidedignas de costos y trazabilidad inmutable sin introducir alucinaciones en el ciclo de entrega de software.', { after: 120 }));

  parts.push(h2('4. Organigrama'));
  parts.push(p('La estructura organizacional de TestGenAI QA Solutions está configurada para garantizar tanto el rigor técnico de la arquitectura de software como la gobernanza ética y de seguridad en el consumo de modelos de inteligencia artificial externa (Flores Chino & Dongo Palza, 2026):', { after: 120 }));

  parts.push(apaFigure(
    '1',
    'Organigrama Funcional y Estructura de Gobernanza del Proyecto TestGenAI',
    'rIdDiag01',
    'Desglose jerárquico de roles directivos, comités de gobernanza y áreas de desarrollo especializado.',
    5400000, 3190000, 101
  ));

  parts.push(p('Descripción funcional del organigrama:', { bold: true, after: 60 }));
  parts.push(p('• Dirección General del Proyecto / Product Owner: Responsable de la definición del alcance, cumplimiento de objetivos metodológicos de investigación, priorización del backlog y alineación con la Escuela Profesional de Ingeniería de Sistemas (EPIS).', { after: 40 }));
  parts.push(p('• Comité de Asesoría Metodológica & Normativa: Órgano consultivo encargado de supervisar que cada escenario generado cumpla con los estándares ISTQB CTFL v4.0 (técnicas de caja negra, partición de equivalencia, BVA) y directrices de especificación ISO/IEC/IEEE 29148.', { after: 40 }));
  parts.push(p('• Gobernanza de Inteligencia Artificial & Seguridad: Responsable de auditar los guardrails de protección, supervisar las directivas contra Prompt Injection, verificar el enmascaramiento de información de identificación personal (PII) y controlar los límites presupuestarios en USD.', { after: 40 }));
  parts.push(p('• Liderazgo de Ingeniería & Arquitectura (QA Lead): Conduce el diseño de la arquitectura hexagonal, modelado relacional en PostgreSQL y la orquestación del backend en TypeScript.', { after: 40 }));
  parts.push(p('• Áreas Especializadas de Desarrollo: Distribuidas en Backend & Modelos (Node.js/Prisma), Frontend & UX (SPA nativa accesible) y QA & Trazabilidad (validación de matrices de cobertura y pruebas automatizadas).', { after: 140 }));

  parts.push(pageBreak());

  // ----------------------------------------------------------------------------
  // II. VISIONAMIENTO DE LA EMPRESA
  // ----------------------------------------------------------------------------
  parts.push(h1('II. Visionamiento de la Empresa'));

  parts.push(h2('1. Descripción del Problema'));
  parts.push(p('El diseño y mantenimiento de pruebas funcionales es una actividad neurálgica en la ingeniería de software. De acuerdo con el estándar ISTQB (2024), el análisis y diseño de pruebas exige examinar las bases de prueba (requisitos del sistema, especificaciones de diseño e historias de usuario con criterios de aceptación) para identificar condiciones comprobables y transformarlas en casos de prueba formales con precondiciones, pasos estructurados, datos y resultados esperados.', { after: 100 }));

  parts.push(p('En proyectos de desarrollo donde este proceso se ejecuta manualmente, se evidencian diez problemas recurrentes documentados por Flores Chino y Dongo Palza (2026):', { after: 80 }));
  parts.push(p('1. Alto consumo de tiempo: Al crecer la cantidad y complejidad de los requisitos, el tiempo exigido para redactar pruebas se incrementa de forma desproporcionada, reduciendo el margen disponible para la ejecución y análisis exploratorio.', { after: 40 }));
  parts.push(p('2. Omisión involuntaria de flujos negativos: Los analistas tienden a priorizar el camino feliz (Happy Path), omitiendo condiciones de fallo, datos anómalos o comportamientos bajo excepción.', { after: 40 }));
  parts.push(p('3. Poca consideración de valores límite (BVA): Los errores en software se concentran con frecuencia en las fronteras de los rangos válidos e inválidos; su omisión deja brechas severas de calidad.', { after: 40 }));
  parts.push(p('4. Duplicación y dispersión sintáctica: Múltiples evaluadores redactan casos equivalentes con diferente terminología, inflando artificialmente el tamaño de la suite.', { after: 40 }));
  parts.push(p('5. Pérdida de trazabilidad requisito–caso: Mantener tablas en hojas de cálculo o wikis manuales provoca que, ante cualquier modificación en una historia de usuario, los casos de prueba queden desalineados y desactualizados.', { after: 40 }));
  parts.push(p('6. Heterogeneidad en el nivel de detalle: Dependencia excesiva de la experiencia individual de cada tester.', { after: 40 }));
  parts.push(p('7. Traslado de ambigüedad a las pruebas: Requisitos con términos vagos ("rápido", "adecuado", "seguro", "etcétera") se traducen en pruebas no verificables que generan falsos positivos.', { after: 40 }));
  parts.push(p('8. Costo elevado de sincronización ante cambios de alcance: Dificultad para identificar qué casos se volvieron obsoletos tras una actualización del requisito.', { after: 40 }));
  parts.push(p('9. Trabajo repetitivo y desmotivante: Sobrecarga operativa de redacción de plantillas repetitivas.', { after: 40 }));
  parts.push(p('10. Imposibilidad de medir cobertura objetiva en tiempo real: Falta de visibilidad sobre qué requisitos cuentan con casos aprobados vigentes.', { after: 100 }));

  parts.push(p('Por otra parte, el uso ingenuo de interfaces de chat de inteligencia artificial (chatbots directos sin arquitectura) introduce riesgos inadmisibles para el aseguramiento de calidad corporativo: respuestas no estructuradas, invención de supuestos no respaldados en el requisito (alucinaciones), falta de auditoría inmutable, ausencia de control de costos y riesgo de fuga de datos sensibles hacia proveedores externos (Arora et al., 2024; Bhatia et al., 2024; Sami et al., 2024).', { after: 120 }));

  parts.push(h2('2. Objetivos de Negocios'));
  parts.push(p('• Objetivo General de Negocio: Proveer un sistema inteligente que optimice en al menos un 40% el tiempo requerido para el diseño de suites de prueba funcionales a partir de requisitos, garantizando un 100% de trazabilidad verificable y asegurando que ninguna prueba sea incorporada a la base oficial sin revisión y aprobación humana.', { after: 80 }));
  parts.push(p('• Objetivos Específicos de Negocio:', { bold: true, after: 40 }));
  parts.push(p('1. Lograr que al menos el 80% de los casos de prueba propuestos por la IA sean aptos para aprobación directa o con ajustes menores por parte del tester evaluador.', { after: 40 }));
  parts.push(p('2. Asegurar que menos del 15% de los casos generados contengan supuestos no fundamentados en los criterios de aceptación, clasificándolos con advertencias explícitas de evidencia.', { after: 40 }));
  parts.push(p('3. Mantener el costo promedio de inferencia por requisito funcional por debajo de USD 0.005 gracias a mecanismos deterministas de caché por huella digital.', { after: 40 }));
  parts.push(p('4. Proveer reportes de cobertura en tiempo real y exportaciones interoperables en formatos abiertos (CSV, JSON, Markdown).', { after: 120 }));

  parts.push(h2('3. Objetivos de Diseño'));
  parts.push(p('• Arquitectura Modular Limpia: Implementar principios de Arquitectura Hexagonal (Puertos y Adaptadores) que desacoplen completamente el dominio central de la infraestructura de persistencia y de las APIs de proveedores LLM.', { after: 40 }));
  parts.push(p('• Frontend SPA Ultra-Ligero: Construcción con tecnologías web estándar (HTML5, Vanilla CSS con variables de diseño, JavaScript nativo con ES Modules), garantizando máxima velocidad sin sobrecargas de empaquetadores complejos.', { after: 40 }));
  parts.push(p('• Persistencia Robusta y Atómica: Almacenamiento sobre PostgreSQL 16 con Prisma ORM, utilizando transacciones ACID, bloqueo optimista concurrente para revisiones y tipos nativos JSONB para precondiciones, pasos y snapshots de auditoría.', { after: 40 }));
  parts.push(p('• Seguridad en Capas: Manejo de sesiones seguras mediante cookies HttpOnly; SameSite=Strict; Secure, tokens JWT rotativos y protección activa contra ataques CSRF e inyección de fórmulas en exportaciones.', { after: 120 }));

  parts.push(h2('4. Alcance del Proyecto'));
  parts.push(p('El alcance del sistema TestGenAI (MVP Real Consolidado) se define formalmente en los siguientes límites funcionales:', { after: 80 }));

  parts.push(p('Alcance Incluido:', { bold: true, color: '0F766E', after: 40 }));
  parts.push(p('• Módulo de Autenticación y Gobernanza RBAC: Registro público limitado al rol QA_TESTER, inicio de sesión seguro, cierre de sesión con revocación de tokens en BD y script seguro de creación de administradores (`admin:create`).', { after: 40 }));
  parts.push(p('• Módulo de Gestión de Proyectos: Creación, configuración de presupuesto mensual de IA en USD, archivado y control multitenant de proyectos.', { after: 40 }));
  parts.push(p('• Módulo de Requisitos Funcionales: Registro con código único (`REQ-XXX`), edición con versionado histórico atómico (`RequirementVersion`), importación masiva por lotes CSV/JSON y análisis estático de ambigüedad basado en ISO/IEC/IEEE 29148.', { after: 40 }));
  parts.push(p('• Motor de Derivación Inteligente con IA Real: Adaptadores reales para Google Gemini y OpenAI, guardrails preventivos (PromptGuard y PIIMasker), verificación de caché por huella SHA-256, validación estricta Zod y derivación en las 5 técnicas ISTQB (positivo, negativo, límite, alternativa, validación).', { after: 40 }));
  parts.push(p('• Centro de Auditoría Humana y Revisión: Modal de auditoría individual, editor de casos con visor de diferencias (Diff Viewer), bloqueo concurrente optimista con `expectedVersion`, justificación técnica obligatoria ante conflictos y snapshots inmutables antes/después.', { after: 40 }));
  parts.push(p('• Matriz de Trazabilidad y Cobertura: Visualización interactiva bidireccional requisito <-> casos aprobados y exportación oficial en CSV protegido, JSON y Markdown.', { after: 40 }));
  parts.push(p('• Monitoreo Analítico y Economía de IA: Historial de llamadas, cálculo de latencia en milisegundos, consumo de tokens de entrada/salida y costo real acumulado en USD.', { after: 40 }));
  parts.push(p('• Plataforma Dual Sin IA: Módulo complementario de diseño manual estructurado y cálculo de valores límite deterministas (BVA de 3 puntos).', { after: 100 }));

  parts.push(p('Exclusiones Explícitas (Fuera de Alcance):', { bold: true, color: 'B91C1C', after: 40 }));
  parts.push(p('• Entrenamiento o fine-tuning de un modelo fundacional propio (se utilizan modelos pre-entrenados mediante API oficial).', { after: 40 }));
  parts.push(p('• Ejecución automatizada en navegadores reales mediante Selenium o Playwright (el sistema se enfoca en el diseño, estructuración y auditoría formal del caso de prueba).', { after: 40 }));
  parts.push(p('• Pruebas de seguridad dinámicas (DAST), pruebas de carga masiva o pruebas móviles nativas.', { after: 40 }));
  parts.push(p('• Integración bidireccional compleja con Jira Enterprise o sincronizadores Git automáticos (quedan como trabajo futuro).', { after: 40 }));
  parts.push(p('• Interfaz de chat conversacional libre o agentes sin supervisión (se exige salida estructurada y auditoría humana caso por caso).', { after: 120 }));

  parts.push(h2('5. Viabilidad del Sistema'));
  parts.push(apaTable(
    '3',
    'Evaluación de Dimensiones de Viabilidad del Sistema TestGenAI',
    ['Dimensión de Viabilidad', 'Evaluación', 'Sustento Técnico y Operativo'],
    [
      ['Viabilidad Técnica', 'ALTA (9.5 / 10)', 'El backend utiliza Node.js 20+ con TypeScript y Express en arquitectura modular limpia. La persistencia opera sobre PostgreSQL 16 con Prisma ORM, esquema relacional normalizado y campos JSONB. La inferencia de IA delega en APIs oficiales de Google y OpenAI con contratos tipados mediante Zod. La suite de pruebas unitarias y de arquitectura con Vitest cuenta con 51 pruebas pasando al 100%.'],
      ['Viabilidad Económica', 'SOBRESALIENTE (9.8 / 10)', 'El costo de inferencia es extremadamente bajo: con modelos modernos (Gemini 2.5 Flash-Lite a $0.10/$0.40 por millón de tokens, o GPT-4o-mini), generar 5 casos para un requisito promedio cuesta menos de $0.001 USD. La caché determinista SHA-256 reutiliza generaciones idénticas con costo incremental cero. No se requiere inversión en hardware GPU propio; el servidor backend opera en entornos ligeros de 1 a 2 GB de RAM.'],
      ['Viabilidad Operativa', 'MUY ALTA (9.0 / 10)', 'La interfaz respeta la ergonomía y lenguaje del analista QA. El flujo de auditoría individual no busca desplazar al evaluador, sino proporcionarle una primera propuesta estructurada que reduce el tiempo de redacción repetitiva. El sistema incluye atajos de teclado y filtros por técnica ISTQB.'],
      ['Viabilidad Legal y Seguridad', 'ALTA (9.5 / 10)', 'Se implementa enmascaramiento bidireccional de datos personales sensibles (PII Masker) para anonimizar correos, números de documento (DNI) y tokens antes del envío a la API externa. Las sesiones se protegen mediante cookies HttpOnly blindadas contra scripts maliciosos (XSS) y con verificación de origen contra CSRF.']
    ],
    [1800, 1500, 5200],
    'Evaluación de viabilidad multidimensional fundamentada en pruebas y análisis de costos (Flores Chino & Dongo Palza, 2026).'
  ));

  parts.push(h2('6. Información Obtenida del Levantamiento de Información'));
  parts.push(p('El levantamiento de información para la concepción de TestGenAI se realizó mediante una triangulación de fuentes documentales, entrevistas con profesionales de aseguramiento de calidad y revisión de literatura científica especializada:', { after: 80 }));
  parts.push(p('• Revisión de Estándares Internacionales: Se analizaron el Syllabus ISTQB CTFL v4.0.1 (ISTQB, 2024), la norma ISO/IEC/IEEE 29148:2018 de ingeniería de requisitos y la norma ISO/IEC/IEEE 29119 sobre documentación de pruebas (Test Plan, Test Design, Test Cases).', { after: 40 }));
  parts.push(p('• Evidencia Científica de la Literatura: Se incorporaron los hallazgos de Arora, Herda & Homm (2024), quienes demostraron la viabilidad de generar escenarios de prueba con LLMs en proyectos industriales, identificando al mismo tiempo la necesidad de validación humana en secuencias exactas. Asimismo, el estudio de Bhatia et al. (2024) reveló que el 87% de los casos generados por LLMs son válidos pero un 13% contiene redundancias, fundamentando la necesidad de los detectores estáticos de TestGenAI.', { after: 40 }));
  parts.push(p('• Entrevistas con Analistas QA: Se identificó que la principal molestia operativa reside en la redacción manual de datos de prueba y valores de frontera en hojas de cálculo, así como la dificultad de reportar trazabilidad fidedigna a la gerencia de proyectos.', { after: 140 }));

  parts.push(pageBreak());

  // ----------------------------------------------------------------------------
  // III. ANÁLISIS DE PROCESOS
  // ----------------------------------------------------------------------------
  parts.push(h1('III. Análisis de Procesos'));

  parts.push(h2('a) Diagrama del Proceso Actual — Diagrama de actividades'));
  parts.push(p('El proceso actual de diseño y gestión de pruebas se realiza de forma manual y fragmentada. El analista recibe especificaciones textuales y redacta casos en herramientas de ofimática, generando asimetrías de cobertura y pérdida de trazabilidad ante modificaciones del software (Flores Chino & Dongo Palza, 2026):', { after: 120 }));

  parts.push(apaFigure(
    '2',
    'Diagrama de Actividades del Proceso Tradicional Manual de Testing',
    'rIdDiag02',
    'Flujo lineal caracterizado por redacción en hojas de cálculo y desactualización frecuente de matrices de trazabilidad.',
    5400000, 3430000, 102
  ));

  parts.push(h3('3.1. Problemas identificados:'));
  parts.push(p('A partir de la descomposición del proceso actual, se identifican cinco cuellos de botella fundamentales:', { after: 60 }));
  parts.push(p('1. Interpretación subjetiva no estandarizada: Cada evaluador interpreta los criterios de aceptación según su criterio particular, omitiendo sistemáticamente escenarios de error y validaciones de campo.', { after: 40 }));
  parts.push(p('2. Alta propensión al error en valores límite: Los escenarios de valores de frontera (BVA) raramente son calculados con precisión matemática en hojas de cálculo.', { after: 40 }));
  parts.push(p('3. Duplicación oculta: Redacción de casos equivalentes con diferente sintaxis que incrementa el costo de ejecución en etapas de regresión.', { after: 40 }));
  parts.push(p('4. Desconexión de la trazabilidad: La asociación entre el requisito original y los casos de prueba depende de referencias textuales manuales que se rompen con cada iteración del proyecto.', { after: 40 }));
  parts.push(p('5. Falta de control sobre costos y esfuerzos: Imposibilidad de medir objetivamente las horas invertidas por caso y el porcentaje de cobertura real alcanzado.', { after: 120 }));

  parts.push(h2('b) Diagrama del Proceso Propuesto — Diagrama de actividades'));
  parts.push(p('El proceso propuesto por TestGenAI combina la automatización asistida por IA con un flujo determinista de guardrails y auditoría humana individual obligatoria:', { after: 120 }));

  parts.push(apaFigure(
    '3',
    'Diagrama de Actividades del Proceso Propuesto Asistido por IA (TestGenAI)',
    'rIdDiag03',
    'Integración de carriles para QA Tester, Backend Core y Proveedores LLM con auditoría humana individual (Human-in-the-Loop).',
    5400000, 3520000, 103
  ));

  parts.push(h3('3.2. Beneficios del proceso propuesto:'));
  parts.push(p('1. Reducción sustancial del tiempo de preparación: La generación automatizada de la propuesta inicial toma menos de 10 segundos por requisito, permitiendo al evaluador concentrarse de inmediato en la revisión y afinamiento de reglas de negocio.', { after: 40 }));
  parts.push(p('2. Cobertura sistemática y balanceada: El motor exige la entrega estructurada de las 5 técnicas ISTQB (positivo, negativo, frontera, alternativa y validación), garantizando que no se descuiden los flujos de excepción.', { after: 40 }));
  parts.push(p('3. Detección temprana de ambigüedades: El analizador estático ISO/IEC/IEEE 29148 alerta al tester sobre términos vagos antes de generar pruebas, promoviendo la mejora de la especificación.', { after: 40 }));
  parts.push(p('4. Privacidad y seguridad de extremo a extremo: Anonimización de datos sensibles antes de abandonar el perímetro institucional y control de inyección de código.', { after: 40 }));
  parts.push(p('5. Trazabilidad e inmutabilidad garantizadas: La matriz de trazabilidad se actualiza en tiempo real de forma automatizada sobre la base de datos relacional PostgreSQL.', { after: 40 }));
  parts.push(p('6. Auditoría humana rigurosa: Ningún caso ingresa a la suite oficial sin aprobación explícita; los rechazos exigen comentarios obligatorios y los conflictos exigen justificación técnica.', { after: 140 }));

  parts.push(pageBreak());

  // ----------------------------------------------------------------------------
  // IV. ESPECIFICACIÓN DE REQUERIMIENTOS DE SOFTWARE
  // ----------------------------------------------------------------------------
  parts.push(h1('IV. Especificación de Requerimientos de Software'));

  parts.push(h2('a) Cuadro de Requerimientos Funcionales (Inicial)'));
  parts.push(p('A continuación se presenta el catálogo inicial de requerimientos funcionales derivados del alcance del sistema y de la propuesta académica rectora (Flores Chino & Dongo Palza, 2026):', { after: 100 }));

  const rfInicial = [
    ['RF-01', 'Autenticación y Sesión Segura', 'Permite el registro e inicio de sesión seguro de usuarios, fijando el rol público a QA_TESTER y administrando sesiones mediante cookies HttpOnly y JWT.', 'Alta'],
    ['RF-02', 'Gestión de Proyectos', 'Permite crear, consultar, listar y archivar proyectos de software con control de propiedad estricto y configuración de presupuesto de IA en USD.', 'Alta'],
    ['RF-03', 'Gestión de Requisitos Funcionales', 'Permite registrar, editar con versionado atómico e importar masivamente requisitos de software con código correlativo (REQ-XXX).', 'Alta'],
    ['RF-04', 'Generación Asistida con IA Real', 'Orquesta la llamada a Google Gemini u OpenAI mediante APIs oficiales reales, aplicando guardrails de seguridad y validación de esquema Zod.', 'Alta'],
    ['RF-05', 'Clasificación Estructurada de Casos', 'Estructura la salida en las 5 técnicas ISTQB (positivo, negativo, límite, alternativa y validación) asignando estado inicial PENDING.', 'Alta'],
    ['RF-06', 'Auditoría y Revisión Humana Individual', 'Provee un modal interactivo para revisar individualmente cada caso, permitiendo editar, aprobar o rechazar con control de concurrencia optimista.', 'Alta'],
    ['RF-07', 'Matriz de Trazabilidad y Cobertura', 'Calcula y presenta la matriz bidireccional requisito ↔ casos aprobados vigentes, determinando el porcentaje de cobertura real.', 'Alta'],
    ['RF-08', 'Regeneración Preservando Historial', 'Permite solicitar una nueva generación con IA creando nuevos registros sin sobreescribir ni eliminar los casos previamente auditados.', 'Media'],
    ['RF-09', 'Métricas de Calidad de Pruebas', 'Consolida indicadores cuantitativos de casos totales, aprobados, modificados, rechazados y pendientes sobre datos reales persistidos.', 'Alta'],
    ['RF-10', 'Monitoreo y Economía de IA', 'Registra fidedignamente tokens consumidos, latencia en milisegundos y costo real en USD acumulado por proyecto y requisito.', 'Alta'],
    ['RF-11', 'Exportación de Casos Aprobados', 'Permite la descarga oficial de la suite de pruebas en formatos CSV (protegido contra inyección de fórmulas), JSON y Markdown.', 'Media'],
    ['RF-12', 'Historial Inmutable de Revisiones', 'Permite consultar el histórico de ejecuciones de IA y el registro de cambios (antes vs. después) mediante visor de diferencias visuales.', 'Media'],
    ['RF-13', 'Detección Estática de Ambigüedad', 'Analiza términos vagos y cláusulas no verificables en los criterios de aceptación bajo lineamientos ISO/IEC/IEEE 29148.', 'Media'],
    ['RF-14', 'Detección Básica de Duplicados', 'Compara similitud entre casos propuestos del mismo requisito para advertir redundancias sin suprimir datos de forma automática.', 'Baja'],
    ['RF-15', 'Plataforma Dual de Diseño Sin IA', 'Permite la creación manual asistida de casos y el cálculo matemático determinista de valores límite (BVA de 3 puntos) sin invocar LLMs.', 'Media'],
    ['RF-16', 'Compendio de Plataforma y Ejecución', 'Provee soporte para registrar ejecuciones de prueba (Test Runs) y métricas de salud profunda del sistema (/api/health/deep).', 'Baja']
  ];

  parts.push(apaTable(
    '4',
    'Cuadro de Requerimientos Funcionales Iniciales del Sistema TestGenAI',
    ['ID', 'Nombre del Requerimiento', 'Descripción Resumida', 'Prioridad'],
    rfInicial,
    [1000, 2400, 4100, 1000],
    'Catálogo preliminar de requerimientos funcionales clasificados por orden de prioridad para el MVP Real.'
  ));

  parts.push(h2('b) Cuadro de Requerimientos No Funcionales'));
  parts.push(p('Los requerimientos no funcionales definen los atributos de calidad, desempeño, seguridad, mantenibilidad y normativas técnicas que rigen el sistema:', { after: 100 }));

  const rnfData = [
    ['RNF-01', 'Rendimiento de Interfaz', 'Las vistas de la SPA deben renderizar y responder ante interacciones locales en menos de 200 ms. La carga inicial de la aplicación no debe exceder 1.5 segundos en redes estándar.', 'Tiempo de respuesta ≤ 200 ms'],
    ['RNF-02', 'Seguridad de Sesiones', 'Los tokens de acceso y refresco deben gestionarse mediante cookies HttpOnly; SameSite=Strict; Secure. Las mutaciones deben validar origen contra ataques CSRF.', 'Cero exposición de tokens en localStorage'],
    ['RNF-03', 'Privacidad y Enmascaramiento PII', 'Ningún dato de identificación personal (correos, documentos de identidad, números de tarjeta) debe enviarse a proveedores externos de IA sin ser ofuscado previamente.', '100% tokens PII enmascarados'],
    ['RNF-04', 'Confiabilidad y Fallo Explícito', 'Si el proveedor de IA no cuenta con API key o retorna un error 429/503, el sistema debe informar un error explícito (HTTP 502/503) sin simular casos falsos ni utilizar generadores mock.', 'Cero simuladores en producción'],
    ['RNF-05', 'Usabilidad y Accesibilidad', 'La interfaz debe satisfacer los criterios de conformidad WCAG 2.1 nivel AA, proveyendo contraste adecuado, focus trap en diálogos modales y soporte de temas visuales.', 'Cumplimiento WCAG 2.1 AA'],
    ['RNF-06', 'Mantenibilidad Arquitectónica', 'El backend debe estar desacoplado según principios de Arquitectura Hexagonal. El código TypeScript debe compilar con 0 errores bajo tipado estricto (tsc --noEmit).', '0 errores tsc; suite Vitest 100% passing'],
    ['RNF-07', 'Portabilidad y Contenedores', 'Toda la solución (Backend API, Frontend SPA y base de datos relacional) debe ser desplegable de manera automatizada mediante Docker y Docker Compose.', 'Despliegue unificado con docker compose up'],
    ['RNF-08', 'Integridad Transaccional ACID', 'Toda operación que involucre actualización de estado de casos y registro de auditoría debe ejecutarse bajo transacciones atómicas en PostgreSQL.', 'Consistencia 100% en TestCaseReview']
  ];

  parts.push(apaTable(
    '5',
    'Cuadro de Requerimientos No Funcionales (Criterios de Calidad)',
    ['ID', 'Categoría / Atributo', 'Descripción del Requerimiento No Funcional', 'Criterio de Medición'],
    rnfData,
    [1000, 2200, 3800, 1500],
    'Requerimientos no funcionales alineados con normativas de seguridad OWASP y rendimiento de software.'
  ));

  parts.push(h2('c) Cuadro de Requerimientos Funcionales (Final)'));
  parts.push(p('El cuadro final detalla el comportamiento verificable, precondiciones de ejecución y criterios de aceptación para cada funcionalidad principal del sistema:', { after: 100 }));

  const rfFinal = [
    ['RF-01F', 'Autenticación con Cookies HttpOnly y RBAC', 'El sistema debe validar credenciales con bcryptjs (mínimo 10 rounds). Si son válidas, establece cookie HttpOnly de access token (1h) y persiste el refresh token rotativo en la tabla auth_sessions (7d). El registro público fija el rol en QA_TESTER.', 'Usuario registrado o existente en BD.', 'Sesión activa verificable en /api/v1/auth/me sin exponer tokens en JavaScript.'],
    ['RF-02F', 'Gestión Segura de Proyectos y Presupuesto', 'El usuario debe poder crear proyectos asignando un nombre, descripción opcional y tope presupuestario de IA en USD. El sistema impide que usuarios sin permisos accedan a proyectos ajenos (anti-IDOR).', 'Sesión iniciada con rol válido.', 'Proyecto registrado con ID UUIDv4 y contador next_requirement_number inicializado en 1.'],
    ['RF-03F', 'Registro, Importación Masiva y Versionado de Requisitos', 'Permite crear requisitos con código REQ-XXX correlativo único por proyecto. Permite subir archivos CSV/JSON validando campos requeridos. Al editar título, descripción o criterios, se crea un registro inmutable en requirement_versions con el snapshot previo.', 'Proyecto activo seleccionado.', 'Requisito persistido con version incrementada atómicamente y snapshot inmutable.'],
    ['RF-04F', 'Generación Asistida con IA Real sin Simuladores', 'Invoca al proveedor seleccionado (Gemini/OpenAI) transmitiendo el requisito previa sanitización con PromptGuard y enmascaramiento con PIIMasker. Si la clave no está configurada o falla la API, retorna error 502/503.', 'Requisito activo; API key configurada en backend.', 'Generación registrada en ai_generations con tokens, latencia ms y costo estimado.'],
    ['RF-05F', 'Validación Estricta Zod en 5 Técnicas ISTQB', 'La salida del LLM se valida contra el esquema Zod AITestCasesOutputSchema. Cada caso debe contener código secuencial CP-XXX, tipo (positive, negative, alternative, boundary, validation), título, precondiciones (array), pasos (array) y resultado esperado.', 'Respuesta HTTP 200 de la API de IA.', 'Casos persistidos en test_cases en estado PENDING con source=AI_GENERATED.'],
    ['RF-06F', 'Auditoría Humana Individual y Bloqueo Optimista', 'El evaluador revisa cada caso de forma individual en modal dedicado. Si aprueba un caso en conflicto (evidenceStatus=conflict), exige justificación técnica. Si rechaza, exige comentario obligatorio. Exige expectedVersion para prevenir carreras concurrentes.', 'Caso en estado PENDING o MODIFIED.', 'Transacción atómica que actualiza TestCase e inserta snapshot inmutable en TestCaseReview.'],
    ['RF-07F', 'Cálculo Dinámico de Cobertura y Trazabilidad', 'Calcula la matriz de trazabilidad considerando únicamente requisitos de proyectos activos y casos en estado APPROVED que pertenezcan a la versión vigente del requisito.', 'Al menos un requisito registrado.', 'Porcentaje de cobertura = (Requisitos con al menos 1 caso aprobado / Total requisitos activos) * 100.'],
    ['RF-08F', 'Regeneración con Preservación Histórica', 'Al solicitar regeneración de un requisito, el sistema crea un nuevo registro AiGeneration y nuevos casos con códigos correlativos CP-XXX incrementales, sin alterar ni borrar los casos previos ni sus revisiones.', 'Requisito existente.', 'Historial previo 100% accesible con identificadores de generación independientes.'],
    ['RF-09F', 'Consolidación de Métricas sobre Datos Reales', 'Calcula métricas globales de calidad: total de casos, distribución por técnica ISTQB, tasa de aprobación, tasa de modificación y tasa de rechazo, calculadas sobre el total del proyecto en base de datos.', 'Proyecto con casos generados.', 'Dashboard visual actualizado sin cifras estáticas ni simuladas.'],
    ['RF-10F', 'Auditoría Económica y Consumo de Tokens', 'Monitorea el consumo real de tokens de entrada y salida, latencia en milisegundos y gasto en USD acumulado, bloqueando nuevas solicitudes si se supera el presupuesto asignado al proyecto.', 'Generaciones de IA efectuadas.', 'Reporte económico en pantalla y bloqueo ante superación de budget_usd.'],
    ['RF-11F', 'Exportación Multiformato Protegida', 'Permite descargar casos aprobados vigentes en formatos CSV, JSON y Markdown. Los archivos CSV deben neutralizar caracteres de inyección de fórmulas (=, +, -, @) anteponiendo comilla simple.', 'Casos aprobados en el proyecto.', 'Archivo descargable con formato estricto y sin riesgo de vulnerabilidad de inyección.'],
    ['RF-12F', 'Visor de Diferencias Históricas (Diff Viewer)', 'Muestra visualmente las diferencias entre el contenido original generado por la IA y el contenido editado por el evaluador humano, resaltando modificaciones en pasos y precondiciones.', 'Caso con revisiones registradas.', 'Comparador visual antes/después accesible desde el modal de auditoría.']
  ];

  parts.push(apaTable(
    '6',
    'Especificación Final de Requerimientos Funcionales y Criterios de Aceptación',
    ['ID', 'Nombre', 'Descripción Técnica y Comportamiento Esperado', 'Precondición', 'Criterio de Aceptación'],
    rfFinal,
    [800, 1800, 3100, 1400, 1400],
    'Especificaciones funcionales detalladas verificadas mediante pruebas automatizadas en Vitest.'
  ));

  parts.push(h2('d) Reglas de Negocio'));
  parts.push(p('Las reglas de negocio establecen las directrices, restricciones lógicas e invariantes que garantizan la integridad y el rigor del sistema TestGenAI:', { after: 100 }));

  const rnData = [
    ['RN-01', 'Restricción de Rol en Registro Público', 'Todo usuario que se registre a través del formulario público de la aplicación web adquiere obligatoriamente el rol QA_TESTER. La asignación de roles superiores (QA_LEAD, DEVELOPER, ADMIN) se reserva exclusivamente a administradores mediante el CLI interactivo (npm run admin:create).'],
    ['RN-02', 'Aislamiento Multitenant de Proyectos (Anti-IDOR)', 'Un usuario únicamente puede visualizar, consultar o modificar requisitos y casos de prueba que pertenezcan a proyectos donde figure como propietario, a menos que posea el rol global de ADMIN.'],
    ['RN-03', 'Correlatividad Atómica Secuencial (REQ y CP)', 'Los códigos de requisitos deben seguir el patrón REQ-XXX y los casos de prueba CP-XXX. La asignación de numeración se realiza mediante bloqueo a nivel de fila (ROW LOCK en PostgreSQL) para evitar colisiones ante transacciones concurrentes.'],
    ['RN-04', 'Inmutabilidad de Versiones de Requisitos', 'Al editar un requisito, nunca se sobreescribe el registro histórico. Se incrementa el contador version y se inserta una copia inmutable en requirement_versions vinculada al autor de la modificación.'],
    ['RN-05', 'Fallo Explícito sin Fallback Heurístico Falso', 'Si la llamada al modelo LLM falla por agotamiento de cuota, error 429/503 o clave ausente, el sistema debe registrar el fallo en ai_generations y retornar un código HTTP 502/503 al cliente. Queda estrictamente prohibido simular casos ficticios mediante mocks.'],
    ['RN-06', 'Bloqueo Concurrente Optimista en Revisiones', 'Toda solicitud de revisión (PATCH /test-cases/:id/review) debe incluir el campo expectedVersion. Si la versión actual en la base de datos es mayor a la esperada, la operación se cancela con HTTP 409 Conflict para evitar sobreescritura accidental.'],
    ['RN-07', 'Justificación Obligatoria en Aprobación de Conflictos', 'Si un caso de prueba posee evidenceStatus = "conflict" (supuesto no respaldado o en contradicción con el requisito), el sistema bloquea su aprobación a menos que el evaluador ingrese una justificación técnica formal en el campo justification.'],
    ['RN-08', 'Obligatoriedad de Comentario en Rechazo de Casos', 'Todo caso de prueba que sea marcado como REJECTED debe incluir de manera obligatoria una justificación de al menos 10 caracteres en el campo comments, garantizando trazabilidad para el historial.'],
    ['RN-09', 'Cálculo Estricto de Cobertura sobre Aprobados Vigentes', 'La cobertura de pruebas sólo considera requisitos en estado ACTIVE que posean al menos un caso en estado APPROVED vinculado a la versión vigente del requisito (requirement_version = requirement.version).'],
    ['RN-10', 'Sanitización de Exportaciones CSV contra Inyección de Fórmulas', 'Toda celda exportada a CSV cuyo texto inicie con caracteres ejecutables (=, +, -, @, comillas tabulares) debe ser sanitizada anteponiendo un carácter de comilla simple (\') para neutralizar la ejecución de macros en Microsoft Excel o LibreOffice.']
  ];

  parts.push(apaTable(
    '7',
    'Catálogo de Reglas de Negocio e Invariantes del Sistema',
    ['ID', 'Nombre de la Regla de Negocio', 'Especificación y Restricción Lógica'],
    rnData,
    [900, 2600, 5000],
    'Reglas operativas implementadas en los casos de uso del backend e interceptores de seguridad.'
  ));

  parts.push(pageBreak());

  // ----------------------------------------------------------------------------
  // V. FASE DE DESARROLLO
  // ----------------------------------------------------------------------------
  parts.push(h1('V. Fase de Desarrollo'));

  parts.push(h2('1. Perfiles de Usuario'));
  parts.push(p('El sistema implementa una matriz de Control de Acceso Basado en Roles (RBAC) con cuatro perfiles formales que reflejan la estructura de un equipo de ingeniería de software:', { after: 100 }));

  const perfilesData = [
    ['QA_TESTER\n(Analista de Pruebas)', 'Perfil por defecto asignado en el registro. Responsable del alta y mantenimiento de requisitos, solicitud de generación de casos con IA, ejecución de la auditoría humana individual (edición, aprobación y rechazo), consulta de trazabilidad y exportación de suites de prueba.'],
    ['QA_LEAD\n(Líder de Calidad)', 'Supervisa la calidad y cobertura global de los proyectos. Posee permisos para reabrir casos rechazados, auditar justificaciones de conflictos, monitorear el consumo de tokens y presupuesto de IA por proyecto, y validar suites para su pase a producción.'],
    ['DEVELOPER\n(Desarrollador)', 'Perfil enfocado en la consulta. Puede acceder a los requisitos funcionales y revisar los casos de prueba aprobados asociados a cada funcionalidad para guiar el desarrollo guiado por pruebas (TDD/BDD) y entender los criterios de aceptación esperados.'],
    ['ADMIN\n(Administrador)', 'Perfil de máxima autoridad técnica. Gestiona el ciclo de vida de los usuarios (activación/desactivación), supervisa métricas de salud profunda del sistema (/api/health/deep), configura parámetros globales de proveedores LLM y asigna presupuestos de IA.']
  ];

  parts.push(apaTable(
    '8',
    'Matriz de Perfiles de Usuario, Responsabilidades y Alcance RBAC',
    ['Perfil de Usuario (Rol)', 'Responsabilidades, Alcance y Privilegios en el Sistema'],
    perfilesData,
    [2400, 6100],
    'Gobernanza de control de accesos basada en el middleware authenticateJWT y guardrails de propiedad de proyectos.'
  ));

  parts.push(h2('2. Modelo Conceptual'));

  parts.push(h3('a) Diagrama de Paquetes'));
  parts.push(p('La arquitectura del sistema responde al patrón de Monolito Modular con principios de Arquitectura Hexagonal (Puertos y Adaptadores), organizando las responsabilidades en capas estrictamente desacopladas:', { after: 120 }));

  parts.push(apaFigure(
    '4',
    'Diagrama de Paquetes Arquitectónicos (Hexagonal / Clean Architecture)',
    'rIdDiag04',
    'Desacoplamiento entre capas Presentation, Application, Domain, Infrastructure e AI Integration.',
    5400000, 3430000, 104
  ));

  parts.push(p('Descripción técnica de las capas:', { bold: true, after: 60 }));
  parts.push(p('• Capa de Presentación (Frontend SPA): Compuesta por vistas modulares en JavaScript nativo (ES Modules) comunicadas con el backend mediante API REST y cookies protegidas.', { after: 40 }));
  parts.push(p('• Capa de Aplicación (Use Cases): Aloja los orquestadores GenerateTestCasesUseCase, ReviewTestCaseUseCase y ExportTraceabilityUseCase, coordinando la lógica de negocio sin depender de frameworks de persistencia.', { after: 40 }));
  parts.push(p('• Capa de Dominio: Entidades ricas (Requirement, TestCase), Value Objects inmutables (ISTQBTechnique, TestCaseStatus) y servicios puros como AmbiguityDetector y RequirementFingerprintService.', { after: 40 }));
  parts.push(p('• Capa de Infraestructura & Persistencia: Implementaciones concretas sobre PostgreSQL 16 utilizando Prisma ORM, repositorios transaccionales y esquemas de sesión.', { after: 40 }));
  parts.push(p('• Capa de Adaptadores de IA & Guardrails: Proveedores GeminiAdapter y OpenAIAdapter desacoplados tras la interfaz IAIProvider, protegidos por PromptGuard y PIIMasker.', { after: 140 }));

  parts.push(h3('b) Diagrama de Casos de Uso'));
  parts.push(p('A continuación se exhibe el Diagrama General de Casos de Uso del Sistema, seguido de los subdiagramas detallados por paquete funcional:', { after: 120 }));

  parts.push(apaFigure(
    '5',
    'Diagrama General de Casos de Uso del Sistema TestGenAI',
    'rIdDiag05',
    'Límite del sistema con interacciones de los cuatro actores principales (QA Tester, QA Lead, Desarrollador y Administrador).',
    5400000, 3520000, 105
  ));

  parts.push(p('Subdiagramas detallados por subsistema funcional:', { bold: true, after: 80 }));

  parts.push(apaFigure(
    '6',
    'Diagrama de Casos de Uso — Subsistema Requisitos y Generación con IA',
    'rIdDiag06',
    'Interacciones para el registro, importación, análisis de ambigüedad y derivación estructurada con IA.',
    5200000, 3000000, 106
  ));

  parts.push(apaFigure(
    '7',
    'Diagrama de Casos de Uso — Subsistema Auditoría Humana y Casos de Prueba',
    'rIdDiag07',
    'Flujos del evaluador humano para auditar, editar con Diff Viewer, aprobar con justificación y diseñar sin IA.',
    5200000, 3000000, 107
  ));

  parts.push(apaFigure(
    '8',
    'Diagrama de Casos de Uso — Subsistema Trazabilidad, Métricas y Exportación',
    'rIdDiag07b',
    'Cálculo de matrices de cobertura, analítica de costos y exportación multiformato.',
    5200000, 3000000, 108
  ));

  parts.push(apaFigure(
    '9',
    'Diagrama de Casos de Uso — Subsistema Administración y Seguridad',
    'rIdDiag07c',
    'Gestión de sesiones seguras, configuración de API keys y monitoreo de salud profunda.',
    5200000, 3000000, 109
  ));

  parts.push(h3('c) Escenarios de Caso de Uso — Narrativa'));
  parts.push(p('A continuación se documentan formalmente los 10 casos de uso principales del sistema bajo el formato estándar de narrativa de ingeniería de software:', { after: 120 }));

  // CU-01
  parts.push(apaTable(
    '10',
    'Especificación Narrativa del Caso de Uso CU-01: Iniciar Sesión y Sesión Segura',
    ['Elemento', 'Descripción Detallada'],
    [
      ['Código y Nombre', 'CU-01: Iniciar Sesión y Gestionar Sesión Segura'],
      ['Actores', 'QA Tester, QA Lead, Desarrollador, Administrador.'],
      ['Propósito', 'Autenticar la identidad del usuario y emitir cookies HttpOnly seguras con tokens rotativos.'],
      ['Precondiciones', 'El usuario debe estar registrado en la base de datos y tener isActive = true.'],
      ['Disparador', 'El usuario ingresa credenciales en la pantalla de inicio y pulsa "Ingresar al Sistema".'],
      ['Flujo Principal', '1. El usuario envía email y contraseña mediante formulario seguro.\n2. El backend busca el usuario por email.\n3. Valida el hash bcrypt de la contraseña.\n4. Genera Access Token (1h) y Refresh Token (7d).\n5. Persiste el hash del Refresh Token en auth_sessions.\n6. Establece cookies HttpOnly (SameSite=Strict, Secure).\n7. Retorna código HTTP 200 con datos de perfil.'],
      ['Flujos Alternativos', '2a. Si el usuario no existe o la contraseña no coincide ➔ Retorna HTTP 401 "Credenciales inválidas".\n3a. Si isActive es false ➔ Retorna HTTP 403 "Cuenta inactiva. Contacte al administrador".'],
      ['Postcondiciones', 'Sesión establecida; cookie HttpOnly activa; entrada auditada en auth_sessions.'],
      ['Requisitos Relacionados', 'RF-01, RF-01F, RNF-02, RN-01.']
    ],
    [2400, 6100],
    'Gestión de identidad y sesiones persistidas en PostgreSQL con revocación remota.'
  ));

  // CU-02
  parts.push(apaTable(
    '11',
    'Especificación Narrativa del Caso de Uso CU-02: Administrar Proyectos de Software',
    ['Elemento', 'Descripción Detallada'],
    [
      ['Código y Nombre', 'CU-02: Administrar Proyectos y Presupuesto'],
      ['Actores', 'QA Tester, QA Lead, Administrador.'],
      ['Propósito', 'Crear y configurar proyectos delimitando alcance y presupuesto mensual de IA en USD.'],
      ['Precondiciones', 'Usuario autenticado con sesión válida.'],
      ['Disparador', 'El usuario abre la vista "Proyectos" y selecciona "Nuevo Proyecto".'],
      ['Flujo Principal', '1. El usuario completa nombre, descripción y presupuesto opcional en USD.\n2. El sistema valida los datos con esquema Zod.\n3. Inserta el proyecto en PostgreSQL con status = ACTIVE y ownerId del usuario.\n4. Inicializa next_requirement_number en 1.\n5. Retorna HTTP 201 y actualiza el selector de proyectos en la cabecera.'],
      ['Flujos Alternativos', '3a. El usuario archiva un proyecto existente ➔ status cambia a ARCHIVED y se bloquea la edición de requisitos.'],
      ['Postcondiciones', 'Proyecto activo registrado y disponible para la asociación de requisitos.'],
      ['Requisitos Relacionados', 'RF-02, RF-02F, RN-02.']
    ],
    [2400, 6100],
    'Control multitenant y límites presupuestarios configurables por proyecto.'
  ));

  // CU-03
  parts.push(apaTable(
    '12',
    'Especificación Narrativa del Caso de Uso CU-03: Registrar e Importar Requisitos Funcionales',
    ['Elemento', 'Descripción Detallada'],
    [
      ['Código y Nombre', 'CU-03: Registrar e Importar Requisitos Funcionales'],
      ['Actores', 'QA Tester, QA Lead.'],
      ['Propósito', 'Ingresar especificaciones funcionales manuales o masivas con código secuencial atómico.'],
      ['Precondiciones', 'Proyecto activo seleccionado con estado ACTIVE.'],
      ['Disparador', 'El usuario pulsa "Nuevo Requisito" o "Importar CSV/JSON".'],
      ['Flujo Principal', '1. El usuario ingresa título, descripción y criterios de aceptación (formato Gherkin o narrativo).\n2. El backend ejecuta transacción reservando el código secuencial (REQ-001, REQ-002...).\n3. Almacena el requisito en requirements con version = 1.\n4. Si se trata de importación CSV, procesa cada fila en lotes atómicos reportando registros creados y errores de sintaxis.\n5. Notifica éxito y refresca la grilla de requisitos.'],
      ['Flujos Alternativos', '1a. Edición de requisito existente ➔ Se incrementa version a version + 1 y se guarda snapshot previo en requirement_versions.'],
      ['Postcondiciones', 'Requisito persistido con código correlativo único en el proyecto.'],
      ['Requisitos Relacionados', 'RF-03, RF-03F, RN-03, RN-04.']
    ],
    [2400, 6100],
    'Versionado inmutable y numeración correlativa atómica bajo transacciones ACID.'
  ));

  // CU-04
  parts.push(apaTable(
    '13',
    'Especificación Narrativa del Caso de Uso CU-04: Analizar Ambigüedad de Criterios (ISO 29148)',
    ['Elemento', 'Descripción Detallada'],
    [
      ['Código y Nombre', 'CU-04: Analizar Ambigüedad de Criterios de Aceptación'],
      ['Actores', 'QA Tester, QA Lead.'],
      ['Propósito', 'Evaluar estáticamente el requisito identificando términos vagos o no verificables antes de llamar a la IA.'],
      ['Precondiciones', 'Requisito registrado con criterios de aceptación.'],
      ['Disparador', 'El usuario visualiza el detalle del requisito o solicita derivación.'],
      ['Flujo Principal', '1. El servicio AmbiguityDetector analiza el texto buscando patrones subjetivos ("fácil", "rápido", "seguro", "adecuado", "etc").\n2. Evalúa completitud de estructura (Dado-Cuando-Entonces o enunciados verificables).\n3. Calcula un puntaje de claridad (0-100) y clasifica advertencias.\n4. Muestra tarjeta informativa en pantalla con recomendaciones de reformulación sin bloquear el flujo.'],
      ['Flujos Alternativos', 'Si el texto no contiene términos ambiguos ➔ Informa "Requisito con alta verificabilidad (Score: 100/100)".'],
      ['Postcondiciones', 'Advertencias desplegadas en la interfaz para concientización del evaluador.'],
      ['Requisitos Relacionados', 'RF-13, RNF-05.']
    ],
    [2400, 6100],
    'Análisis sintáctico estático alineado con directivas de calidad de requisitos ISO/IEC/IEEE 29148.'
  ));

  // CU-05
  parts.push(apaTable(
    '14',
    'Especificación Narrativa del Caso de Uso CU-05: Derivar Casos de Prueba con IA Real',
    ['Elemento', 'Descripción Detallada'],
    [
      ['Código y Nombre', 'CU-05: Derivar Casos de Prueba con IA Real (Google Gemini / OpenAI)'],
      ['Actores', 'QA Tester.'],
      ['Propósito', 'Obtener automáticamente casos de prueba funcionales en las 5 técnicas ISTQB invocando LLMs externos bajo estricta seguridad.'],
      ['Precondiciones', 'Requisito registrado; API key del proveedor configurada en .env; presupuesto disponible.'],
      ['Disparador', 'El usuario pulsa el botón "Generar con IA" en la tarjeta del requisito.'],
      ['Flujo Principal', '1. El usuario selecciona proveedor (Gemini o OpenAI).\n2. El backend calcula huella SHA-256 (Fingerprint). Si existe generación idéntica en caché, la retorna con 0 tokens.\n3. PromptGuard valida que no existan ataques de inyección.\n4. PIIMasker anonimiza datos personales sensibles.\n5. Invoca la API externa recibiendo respuesta estructurada.\n6. Zod valida el esquema AITestCasesOutputSchema.\n7. PIIMasker restaura los datos personales.\n8. Inicia transacción: registra AiGeneration y guarda casos en test_cases en estado PENDING con correlativos CP-XXX.\n9. Retorna casos al Frontend con métricas de tiempo y tokens.'],
      ['Flujos Alternativos', '5a. Falla de API o clave ausente ➔ Registra generación FAILED y responde HTTP 502/503 con mensaje explícito sin inventar casos.\n2a. Presupuesto excedido ➔ Responde HTTP 400 informando límite alcanzado.'],
      ['Postcondiciones', 'Casos creados en estado PENDING disponibles para auditoría humana individual.'],
      ['Requisitos Relacionados', 'RF-04, RF-04F, RF-05, RF-05F, RN-03, RN-05.']
    ],
    [2400, 6100],
    'Orquestación de IA real con guardrails de seguridad, validación Zod y auditoría de tokens.'
  ));

  // CU-06
  parts.push(apaTable(
    '15',
    'Especificación Narrativa del Caso de Uso CU-06: Auditar y Revisar Caso de Prueba (Human-in-the-Loop)',
    ['Elemento', 'Descripción Detallada'],
    [
      ['Código y Nombre', 'CU-06: Auditar y Revisar Caso de Prueba Individual'],
      ['Actores', 'QA Tester, QA Lead.'],
      ['Propósito', 'Ejecutar la revisión humana individual obligatoria aprobando, editando o rechazando el caso con control de versiones.'],
      ['Precondiciones', 'Caso de prueba en estado PENDING, MODIFIED o REJECTED.'],
      ['Disparador', 'El usuario hace clic en un caso en la grilla para abrir el modal de auditoría.'],
      ['Flujo Principal', '1. El evaluador inspecciona título, técnica, precondiciones, pasos, datos y resultado.\n2. Puede modificar los textos según su juicio técnico.\n3. Selecciona una decisión: APROBAR, MODIFICAR o RECHAZAR.\n4. Si el caso tiene evidencia en conflicto (conflict) y se aprueba, el sistema exige justificación técnica obligatoria.\n5. Si el caso se rechaza, exige comentario explicativo.\n6. El backend comprueba expectedVersion (bloqueo optimista).\n7. Ejecuta transacción atómica: actualiza TestCase e inserta snapshot inmutable en TestCaseReview.\n8. Retorna caso actualizado y refresca la matriz de trazabilidad.'],
      ['Flujos Alternativos', '6a. Conflicto concurrente (expectedVersion != version) ➔ Retorna HTTP 409 solicitando recargar datos.'],
      ['Postcondiciones', 'Caso actualizado en BD; snapshot inmutable antes/después registrado en la auditoría.'],
      ['Requisitos Relacionados', 'RF-06, RF-06F, RN-06, RN-07, RN-08.']
    ],
    [2400, 6100],
    'Auditoría humana con control de concurrencia optimista y justificación obligatoria en conflictos.'
  ));

  // CU-07
  parts.push(apaTable(
    '16',
    'Especificación Narrativa del Caso de Uso CU-07: Consultar Matriz de Trazabilidad y Cobertura',
    ['Elemento', 'Descripción Detallada'],
    [
      ['Código y Nombre', 'CU-07: Consultar Matriz de Trazabilidad y Cobertura'],
      ['Actores', 'QA Tester, QA Lead, Desarrollador, Administrador.'],
      ['Propósito', 'Visualizar la vinculación biunívoca entre requisitos de software y casos de prueba aprobados vigentes.'],
      ['Precondiciones', 'Proyecto activo con requisitos registrados.'],
      ['Disparador', 'El usuario hace clic en "Trazabilidad" en el menú de navegación principal.'],
      ['Flujo Principal', '1. El cliente solicita datos a GET /api/v1/traceability/:projectId.\n2. El backend consulta requisitos activos y filtra casos aprobados vigentes.\n3. Calcula el porcentaje de cobertura oficial: (Reqs cubiertos / Reqs totales) * 100.\n4. Renderiza tabla interactiva con estado de cobertura, técnica ISTQB y enlaces directos al caso auditado.\n5. Habilita opciones de exportación inmediata.'],
      ['Flujos Alternativos', 'Si el proyecto no tiene requisitos ➔ Informa "No hay requisitos registrados para calcular cobertura".'],
      ['Postcondiciones', 'Matriz de cobertura desplegada con exactitud matemática.'],
      ['Requisitos Relacionados', 'RF-07, RF-07F, RN-09.']
    ],
    [2400, 6100],
    'Trazabilidad bidireccional requisito ↔ caso con cálculo matemático de cobertura.'
  ));

  // CU-08
  parts.push(apaTable(
    '17',
    'Especificación Narrativa del Caso de Uso CU-08: Monitorear Métricas Reales y Consumo de Tokens/Costo',
    ['Elemento', 'Descripción Detallada'],
    [
      ['Código y Nombre', 'CU-08: Monitorear Métricas de Calidad y Consumo de IA'],
      ['Actores', 'QA Lead, Administrador.'],
      ['Propósito', 'Supervisar indicadores cuantitativos del proceso de testing y auditar el gasto real de inferencia en USD.'],
      ['Precondiciones', 'Proyecto con casos y generaciones registradas.'],
      ['Disparador', 'El usuario selecciona "Métricas & IA" en el menú.'],
      ['Flujo Principal', '1. El backend agrega contadores reales desde PostgreSQL (casos totales, aprobados, modificados, rechazados).\n2. Suma tokens de entrada, salida y costo estimado acumulado en ai_generations.\n3. Calcula latencia promedio en milisegundos de las llamadas de inferencia.\n4. Despliega panel analítico con gráficos de distribución por técnica y alertas de duplicidad.'],
      ['Flujos Alternativos', 'Si no hay llamadas a IA ➔ Muestra contadores en cero y estado "Sin consumo registrado".'],
      ['Postcondiciones', 'Visibilidad transparente del retorno de inversión y consumo de recursos.'],
      ['Requisitos Relacionados', 'RF-09, RF-10, RF-10F.']
    ],
    [2400, 6100],
    'Analítica operativa y económica calculada sobre registros persistidos reales.'
  ));

  // CU-09
  parts.push(apaTable(
    '18',
    'Especificación Narrativa del Caso de Uso CU-09: Exportar Suite Oficial de Pruebas',
    ['Elemento', 'Descripción Detallada'],
    [
      ['Código y Nombre', 'CU-09: Exportar Suite Oficial en CSV, JSON y Markdown'],
      ['Actores', 'QA Tester, QA Lead, Desarrollador.'],
      ['Propósito', 'Descargar los casos aprobados vigentes en formatos estandarizados para integración con herramientas externas.'],
      ['Precondiciones', 'Existen casos en estado APPROVED asociados a requisitos activos.'],
      ['Disparador', 'El usuario pulsa "Exportar Casos Aprobados" o "Exportar Matriz".'],
      ['Flujo Principal', '1. El usuario selecciona formato: CSV, JSON o Markdown.\n2. El backend filtra exclusivamente casos aprobados vigentes.\n3. Si es CSV, aplica regla de sanitización anteponiendo comilla simple a caracteres de inyección de fórmulas.\n4. Genera el payload y transmite el archivo con cabeceras Content-Disposition: attachment.\n5. El navegador inicia la descarga del artefacto formal.'],
      ['Flujos Alternativos', 'Si no hay casos aprobados ➔ Alerta "No existen casos aprobados vigentes para exportar".'],
      ['Postcondiciones', 'Archivo estructurado descargado en la estación de trabajo del evaluador.'],
      ['Requisitos Relacionados', 'RF-11, RF-11F, RN-10.']
    ],
    [2400, 6100],
    'Interoperabilidad multiformato con protección activa contra inyecciones CSV.'
  ));

  // CU-10
  parts.push(apaTable(
    '19',
    'Especificación Narrativa del Caso de Uso CU-10: Diseñar Casos Manuales y BVA Sin IA',
    ['Elemento', 'Descripción Detallada'],
    [
      ['Código y Nombre', 'CU-10: Diseñar Casos Manuales y Valores Límite Sin IA (Plataforma Dual)'],
      ['Actores', 'QA Tester.'],
      ['Propósito', 'Crear casos de prueba estructurados de forma manual o asistida por algoritmos deterministas de valores de frontera sin requerir modelos LLM.'],
      ['Precondiciones', 'Requisito activo registrado.'],
      ['Disparador', 'El usuario selecciona "Crear Caso Sin IA" o "Generador BVA" en la vista de casos.'],
      ['Flujo Principal', '1. Para BVA: El usuario ingresa límite inferior y superior de una variable numérica o longitud de texto.\n2. El algoritmo matemático calcula automáticamente los 3 puntos de frontera (min-1, min, min+1, max-1, max, max+1).\n3. Deduce casos válidos e inválidos con sus resultados esperados.\n4. Asigna código secuencial atómico CP-XXX con source = MANUAL.\n5. Persiste los casos en PostgreSQL en estado PENDING o APPROVED directo.'],
      ['Flujos Alternativos', 'Para diseño manual: El usuario redacta directamente pasos y resultado usando plantillas ISTQB.'],
      ['Postcondiciones', 'Casos deterministas incorporados a la suite con trazabilidad idéntica a los casos de IA.'],
      ['Requisitos Relacionados', 'RF-15, RN-03, RN-09.']
    ],
    [2400, 6100],
    'Plataforma dual que complementa modelos de lenguaje con cálculo determinista de frontera.'
  ));

  parts.push(pageBreak());

  // ----------------------------------------------------------------------------
  // 3. MODELO LÓGICO
  // ----------------------------------------------------------------------------
  parts.push(h2('3. Modelo Lógico'));

  parts.push(h3('a) Análisis de Objetos'));
  parts.push(p('A partir de la arquitectura modular y la persistencia transaccional del sistema, se identifican las entidades y objetos lógicos del dominio:', { after: 100 }));

  const objetosData = [
    ['User (Usuario)', 'Representa al evaluador o administrador. Atributos: id (UUID), email, passwordHash (bcrypt), fullName, role (QA_TESTER, QA_LEAD, DEVELOPER, ADMIN), isActive, preferences (JSON). Responsable de la auditoría y propiedad de proyectos.'],
    ['AuthSession (Sesión)', 'Mantiene las sesiones persistidas para rotación de Refresh Tokens. Atributos: id, userId, tokenHash (SHA-256), expiresAt, isRevoked, userAgent, ipAddress. Permite invalidación remota y logout seguro.'],
    ['Project (Proyecto)', 'Agrupa requisitos y casos bajo un mismo dominio de software. Atributos: id, name, description, ownerId, status (ACTIVE, ARCHIVED), budgetUsd, nextRequirementNumber. Controla el límite presupuestario mensual de IA.'],
    ['Requirement (Requisito)', 'Especificación funcional a verificar. Atributos: id, projectId, code (REQ-001), title, description, acceptanceCriteria, version, status (READY_FOR_AI, GENERATED, OBSOLETE), nextCaseNumber.'],
    ['RequirementVersion (Versión de Requisito)', 'Snapshot inmutable del historial de cambios. Atributos: id, requirementId, version, title, description, acceptanceCriteria, authorId, changeSummary, createdAt. Garantiza trazabilidad temporal.'],
    ['AiGeneration (Generación con IA)', 'Registro fidedigno de cada llamada al LLM externo. Atributos: id, requirementId, userId, provider (gemini, openai), model, inputTokens, outputTokens, estimatedCost, responseTimeMs, inputHash, status (SUCCEEDED, FAILED).'],
    ['TestCase (Caso de Prueba)', 'Escenario formal de prueba. Atributos: id, requirementId, generationId, code (CP-001), type (positive, negative, alternative, boundary, validation), title, preconditions (JSONB), steps (JSONB), testData, expectedResult, priority, version, status (PENDING, APPROVED, MODIFIED, REJECTED).'],
    ['TestCaseReview (Revisión de Auditoría)', 'Registro histórico inmutable de auditoría humana. Atributos: id, testCaseId, reviewerId, decision, comments, justification, reviewedRequirementVersion, previousContent (JSONB), newContent (JSONB).']
  ];

  parts.push(apaTable(
    '20',
    'Análisis de Entidades, Value Objects y Objetos del Dominio',
    ['Objeto / Entidad de Dominio', 'Atributos Principales y Responsabilidad en el Sistema'],
    objetosData,
    [2400, 6100],
    'Modelo conceptual mapeado a entidades relacionales y colecciones JSONB en PostgreSQL 16.'
  ));

  parts.push(h3('b) Diagrama de Actividades con Objetos'));
  parts.push(p('El diagrama de actividades con objetos ilustra la transformación de estado de las entidades a lo largo del pipeline de derivación, auditoría y trazabilidad:', { after: 120 }));

  parts.push(apaFigure(
    '10',
    'Diagrama de Actividades con Objetos y Transición de Estados',
    'rIdDiag08',
    'Ciclo de vida de entidades: Requisito [ACTIVE] ➔ AiGeneration [SUCCEEDED] ➔ TestCase [PENDING] ➔ TestCaseReview [AUDITED] ➔ TestCase [APPROVED].',
    5400000, 3190000, 110
  ));

  parts.push(h3('c) Diagramas de Secuencia'));
  parts.push(p('Los diagramas de secuencia especifican el flujo temporal de mensajes entre los componentes del sistema para los dos casos de uso más críticos: la derivación con IA y la auditoría humana con bloqueo optimista.', { after: 100 }));

  parts.push(h4('Secuencia 1: Generación Asistida con IA Real (CU-05)'));
  parts.push(apaFigure(
    '11',
    'Diagrama de Secuencia — Invocación, Guardrails y Generación con IA Real (CU-05)',
    'rIdDiag09',
    'Interacción cronológica entre Tester UI, Express Router, UseCase, PromptGuard, PIIMasker, Gemini/OpenAI Provider y PostgreSQL.',
    5400000, 3430000, 111
  ));

  parts.push(h4('Secuencia 2: Auditoría Humana y Bloqueo Optimista (CU-06)'));
  parts.push(apaFigure(
    '12',
    'Diagrama de Secuencia — Auditoría Humana y Transacción Atómica con Bloqueo Concurrente (CU-06)',
    'rIdDiag10',
    'Transacción atómica en PostgreSQL con verificación de versión esperada (expectedVersion) y snapshots inmutables.',
    5400000, 3430000, 112
  ));

  parts.push(h3('d) Diagrama de Clases'));
  parts.push(p('El Diagrama de Clases modela las entidades del dominio, tipos de datos, enumeraciones y relaciones relacionales implementadas sobre PostgreSQL y Prisma ORM:', { after: 120 }));

  parts.push(apaFigure(
    '13',
    'Diagrama de Clases del Dominio y Persistencia Relacional',
    'rIdDiag11',
    'Estructura de entidades relacionales, campos nativos JSONB y multiplicidades implementadas en Prisma ORM.',
    5400000, 3520000, 113
  ));

  parts.push(pageBreak());

  // ----------------------------------------------------------------------------
  // CONCLUSIONES
  // ----------------------------------------------------------------------------
  parts.push(h1('CONCLUSIONES'));
  parts.push(p('1. La arquitectura modular de TestGenAI basada en principios de Arquitectura Hexagonal y Monolito por Capas desacopla eficazmente la lógica del dominio de pruebas de los proveedores externos de inteligencia artificial (Google Gemini y OpenAI), permitiendo la interoperabilidad y sustitución de modelos fundacionales sin impacto sobre el esquema de persistencia ni la interfaz de usuario.', { after: 100 }));

  parts.push(p('2. El paradigma "Human-in-the-Loop" implementado en el módulo de auditoría humana resuelve de forma concluyente el problema de las alucinaciones y supuestos no respaldados presentes en la inteligencia artificial generativa, garantizando que el 100% de los casos incorporados a la suite de pruebas cuenten con revisión, trazabilidad inmutable y justificación técnica ante conflictos.', { after: 100 }));

  parts.push(p('3. La combinación de validación de esquemas con Zod y enmascaramiento bidireccional de datos sensibles (PII Masker) asegura un nivel óptimo de robustez operativa y cumplimiento de privacidad, neutralizando vectores de ataque como Prompt Injection y protegiendo información institucional confidencial antes de su transmisión hacia APIs de terceros.', { after: 100 }));

  parts.push(p('4. La evaluación de viabilidad económica demuestra que la utilización de modelos fundacionales compactos (Gemini 2.5 Flash-Lite / GPT-4o-mini) reduce el costo por requisito a fracciones de centavo de dólar ($0.001 USD), complementado por una caché determinista basada en huella SHA-256 que elimina cobros redundantes ante ejecuciones sucesivas de requisitos idénticos.', { after: 100 }));

  parts.push(p('5. El sistema consolida una trazabilidad bidireccional automática del 100% calculada sobre la base de datos PostgreSQL 16, superando las deficiencias históricas de desincronización, duplicidad y pérdida de cobertura características de la gestión manual en hojas de cálculo.', { after: 140 }));

  // ----------------------------------------------------------------------------
  // RECOMENDACIONES
  // ----------------------------------------------------------------------------
  parts.push(h1('RECOMENDACIONES'));
  parts.push(p('1. Extensión de la Plataforma Dual Determinista: Se recomienda continuar profundizando en la integración de algoritmos de combinatoria ortogonal (Pairwise / All-Pairs) y tablas de decisión 2^N para complementar de manera híbrida la inferencia lingüística de los LLMs en requisitos con alta densidad lógica.', { after: 100 }));

  parts.push(p('2. Gobernanza de Modelos LLM: Se sugiere mantener actualizadas periódicamente las tablas de tarifas de tokens en la configuración del backend conforme los proveedores ajusten sus costos, permitiendo un monitoreo financiero preciso en tiempo real.', { after: 100 }));

  parts.push(p('3. Ejecución del Estudio Empírico Formal: Conforme a la propuesta académica de investigación (Flores Chino & Dongo Palza, 2026), se recomienda someter la plataforma a un experimento formal con al menos 15 analistas de prueba evaluando un catálogo estandarizado de requisitos para recolectar métricas empíricas de ahorro de tiempo (%) y tasa de aprobación sin modificaciones (%).', { after: 100 }));

  parts.push(p('4. Exportación hacia Herramientas de Gestión de Pruebas: Para etapas posteriores a este MVP, se aconseja desarrollar conectores de exportación directa hacia suites corporativas como Jira / Xray y Azure DevOps mediante sus APIs REST oficiales.', { after: 100 }));

  parts.push(p('5. Promoción de Mejores Prácticas de Especificación: Aprovechar los reportes del analizador estático de ambigüedad ISO/IEC/IEEE 29148 para capacitar a los equipos de desarrollo en la redacción de criterios de aceptación más precisos y verificables.', { after: 140 }));

  parts.push(pageBreak());

  // ----------------------------------------------------------------------------
  // BIBLIOGRAFÍA Y WEBGRAFÍA (Norma APA 7 con sangría francesa)
  // ----------------------------------------------------------------------------
  parts.push(h1('BIBLIOGRAFÍA'));

  parts.push(apaReference(
    'Alagarsamy, M., Sridhar, R., Kumar, A., & Raman, V. (2024).',
    'Quality assessment of test cases generated from natural language requirements using large language models',
    'arXiv preprint. https://doi.org/10.48550/arXiv.2402.11910'
  ));

  parts.push(apaReference(
    'Arora, C., Herda, N., & Homm, F. (2024).',
    'Test scenario generation with LLMs in industrial projects: Opportunities, challenges, and lessons learned',
    'arXiv preprint. https://doi.org/10.48550/arXiv.2404.12772'
  ));

  parts.push(apaReference(
    'Bhatia, A., Gandhi, N., Kumar, R., & Jalote, P. (2024).',
    'Generating test designs from software requirements documents using large language models',
    'arXiv preprint. https://doi.org/10.48550/arXiv.2412.03693'
  ));

  parts.push(apaReference(
    'Flores Chino, M. H., & Dongo Palza, M. A. (2026).',
    'TestGenAI: Sistema inteligente para la generación, validación y trazabilidad de casos de prueba funcionales a partir de requisitos de software mediante inteligencia artificial generativa',
    'Propuesta de Investigación de Tesis de Grado, Escuela Profesional de Ingeniería de Sistemas, Facultad de Ingeniería, Universidad Privada de Tacna.'
  ));

  parts.push(apaReference(
    'International Software Testing Qualifications Board. (2024).',
    'Certified Tester Foundation Level (CTFL) Syllabus (Versión 4.0.1)',
    'International Software Testing Qualifications Board (ISTQB). https://www.istqb.org'
  ));

  parts.push(apaReference(
    'International Organization for Standardization. (2018).',
    'Systems and software engineering — Life cycle processes — Requirements engineering (ISO/IEC/IEEE Standard N.° 29148:2018)',
    'IEEE. https://standards.ieee.org/ieee/29148/7266/'
  ));

  parts.push(apaReference(
    'International Organization for Standardization. (2013).',
    'Software and systems engineering — Software testing — Part 1: Concepts and definitions (ISO/IEC/IEEE Standard N.° 29119-1:2013)',
    'IEEE. https://standards.ieee.org/ieee/29119-1/5412/'
  ));

  parts.push(apaReference(
    'Sami, R., Patel, H., & Chen, Y. (2024).',
    'A web-based tool for automated test scenario generation from requirements using large language models',
    'arXiv preprint. https://doi.org/10.48550/arXiv.2406.07021'
  ));

  parts.push(h1('WEBGRAFÍA'));

  parts.push(apaReference(
    'Google AI Studio. (2026).',
    'Gemini API documentation & pricing models',
    'Google Cloud. https://ai.google.dev/gemini-api/docs/pricing'
  ));

  parts.push(apaReference(
    'OpenAI. (2026).',
    'OpenAI models and API pricing documentation',
    'OpenAI Documentation. https://developers.openai.com/api/docs/models'
  ));

  parts.push(apaReference(
    'PostgreSQL Global Development Group. (2026).',
    'PostgreSQL 16 official documentation',
    'PostgreSQL. https://www.postgresql.org/docs/16/'
  ));

  parts.push(apaReference(
    'Prisma ORM. (2026).',
    'Prisma client and schema documentation for PostgreSQL',
    'Prisma. https://www.prisma.io/docs'
  ));

  parts.push(apaReference(
    'World Wide Web Consortium. (2023).',
    'Web Content Accessibility Guidelines (WCAG) 2.1',
    'W3C. https://www.w3.org/TR/WCAG21/'
  ));

  // ----------------------------------------------------------------------------
  // SECTION PROPERTIES (A4, Margins, Header, Footer)
  // ----------------------------------------------------------------------------
  parts.push(`
    <w:sectPr>
      <w:headerReference r:id="rId20" w:type="default"/>
      <w:footerReference r:id="rId21" w:type="default"/>
      <w:pgSz w:h="16838" w:w="11906" w:orient="portrait"/>
      <w:pgMar w:bottom="1417" w:top="1417" w:left="1701" w:right="1701" w:header="708" w:footer="708"/>
      <w:pgNumType w:start="1"/>
      <w:titlePg/>
    </w:sectPr>
  `);

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:sl="http://schemas.openxmlformats.org/schemaLibrary/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:lc="http://schemas.openxmlformats.org/drawingml/2006/lockedCanvas" xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" xmlns:w16="http://schemas.microsoft.com/office/word/2018/wordml" xmlns:w16cex="http://schemas.microsoft.com/office/word/2018/wordml/cex" xmlns:w16cid="http://schemas.microsoft.com/office/word/2016/wordml/cid">
  <w:body>
    ${parts.join('\n')}
  </w:body>
</w:document>`;
}

module.exports = { generateBodyXml };
