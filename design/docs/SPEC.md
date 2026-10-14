# QualiReq — Especificación de producto y arquitectura (v2)

**Curso:** SI-784 Calidad y Pruebas de Software · UPT Tacna
**Alcance:** (1) Revisor de requisitos con correcciones y (2) Generador de casos de prueba
**Restricciones:** sin IA embebida, motor 100 % determinista, acceso solo con correo y contraseña
**Stack:** Next.js (App Router) + TypeScript en Vercel · Supabase (Auth + Postgres)
**Versión del documento:** 2 · 14-oct-2026 · reemplaza a la v1 del 12-oct-2026

> Los precios y límites fueron consultados entre el 12 y el 14-oct-2026; verifícalos antes de sustentar. Lo marcado como *hipótesis* o *supuesto* no es un dato medido.

### Cambios respecto a la v1

| Tema | v1 | v2 |
|---|---|---|
| Acceso | Modo anónimo + Auth.js con GitHub/Google | **Solo correo y contraseña** con Supabase Auth. Sin modo anónimo, sin registro público |
| Base de datos | Neon o Render Postgres + Drizzle | **Supabase Postgres** con migraciones SQL, RLS y tipos generados |
| Revisor | Hallazgos con aceptar/rechazar | Hallazgos + **corrección editable** por sospecha, versión corregida por requisito y «Aplicar todas» |
| Exportación | Casos (CSV, MD, JSON, Gherkin) | + **Requisitos mejorados** (.txt, MD, CSV, JSON) y sospechas |
| Pantallas | Una vista con pestañas | 5 pantallas: Login, Inicio, Espacio de trabajo (Revisar · Generar · Exportar), Versiones, Reglas y diccionario |
| Tipografía | Geist | Bricolage Grotesque + Plus Jakarta Sans + JetBrains Mono |

---

## 0. Cómo usar este documento con Claude Code

1. Copia este archivo en la raíz del repositorio como `docs/SPEC.md` y crea un `CLAUDE.md` corto que diga: «La especificación vive en `docs/SPEC.md`. Sigue los hitos de la sección 12 en orden y no avances sin cumplir sus criterios de aceptación.»
2. Trabaja **un hito por sesión**. Al iniciar, pide: «Implementa el hito N de `docs/SPEC.md`». Al cerrar, pide que corra `pnpm lint && pnpm typecheck && pnpm test`.
3. El diseño de referencia está en el lienzo de diseño de QualiReq (Design artifact). Si hay contradicción entre el lienzo y este documento, **manda este documento**.
4. Convenciones obligatorias:
   - TypeScript estricto (`"strict": true`), sin `any` salvo en límites justificados.
   - El motor (`packages/engine`) no importa nada de React, Next.js, DOM ni Node.
   - Todo texto de interfaz en español neutro, frases cortas, sin signos de exclamación, sin emoji.
   - Toda entrada del usuario que llega al servidor se valida con Zod.
   - Nunca se registra en logs el texto de los requisitos.
   - La clave secreta de Supabase **nunca** se usa en el código de la app.

---

## 1. La idea

**QualiReq** toma requisitos escritos en lenguaje natural y hace tres cosas:

1. **Revisa su calidad** contra los 8 atributos del curso (necesario, no ambiguo, verificable, completo, correcto, viable, priorizable, consistente). Cada sospecha cita una regla con ID, el atributo y la fuente.
2. **Propone una corrección** determinista para cada sospecha, que el usuario puede editar y aplicar. El requisito se reescribe y se vuelve a analizar.
3. **Genera casos de prueba** trazados al requisito: valores límite, partición de equivalencia, umbrales, condiciones y casos no funcionales.

Hilo conductor del curso: **el defecto más barato es el que se detecta antes de codificar.**

### Por qué determinista

| Criterio | QualiReq (reglas) | IA de chat |
|---|---|---|
| Mismo input → mismo output | Sí; la interfaz muestra la huella del texto | No garantizado (arXiv 2308.02828) |
| Trazabilidad | ID de regla + atributo + fuente | Explicación libre |
| Privacidad | El análisis corre en el navegador | El texto viaja a un tercero |
| Costo marginal | ≈ 0 | Por uso o suscripción |
| Calidad medible | Precisión/recall sobre conjunto de oro | Difícil de fijar |
| Semántica y contradicciones | Limitada | Mejor |

**Posicionamiento:** base determinista y auditable. La IA queda fuera del MVP.

---

## 2. Viabilidad económica

### 2.1 Costos

| Escenario | Stack | USD/mes |
|---|---|---|
| Demo / sustentación | Vercel Hobby + Supabase Free | 0 |
| Producción mínima | Vercel Pro ($20) + Supabase Pro ($25) | ≈ 45 |

Restricciones a declarar:

- **Vercel Hobby** es solo para uso personal no comercial. Límites (12-oct-2026): 1 M invocaciones de funciones, 100 GB de transferencia, 100 despliegues/día.
- **Supabase Free** (precios de may-2026, verificados el 14-oct-2026): 500 MB de Postgres, 50 000 usuarios activos mensuales en Auth, 2 proyectos por organización. **El proyecto se pausa tras 7 días sin actividad**: abrir la app o el panel unos días antes de la sustentación.

### 2.2 Punto de equilibrio (supuesto)

Con un costo fijo supuesto de ~US$45/mes: 9 equipos a $5, 5 equipos a $10, 3 equipos a $20. Los precios de venta son **hipótesis**.

### 2.3 Retorno

1. **Académico (seguro):** producto desplegado, motor testeado, reglas trazadas al curso.
2. **Ahorro de tiempo (por medir):** experimento de la sección 13.
3. **Ingresos (hipótesis sin verificar):** talleres, licencias a universidades, revisión de TdR.

### 2.4 Qué NO afirmar en la sustentación

- «Es mejor que ChatGPT».
- La regla «1:10:100» del costo de defectos.
- Cifras de precisión propias antes de medirlas.
- Tamaño de mercado en Tacna.
- «La IA es cara».

### 2.5 Respaldo en la literatura

- **Requirements Smells** (arXiv 1611.08847): reglas derivadas de ISO 29148; precisión promedio ≈ 59 %; lenguaje subjetivo 0,96 de precisión y 0,82 de recall; hay falsos positivos.
- **Estudio MDH/Alstom** (ARM, QuARS, RETA, RCM sobre 180 requisitos): precisión 0,41–0,68, recall 0,08–0,98.
- **IEEE 830** fue reemplazada por **ISO/IEC/IEEE 29148** en 2011.

**Consecuencia de diseño:** los hallazgos se llaman *sospechas*, con confirmar / falso positivo / desactivar regla, diccionario de dominio y precisión medida sobre un conjunto de oro.

---

## 3. Alcance

### Dentro del MVP

- Inicio de sesión con correo y contraseña (Supabase Auth). Los usuarios los crea el administrador.
- Proyectos por usuario, con versiones del conjunto de requisitos (borrador + versiones guardadas).
- Editor de requisitos, análisis en el navegador con las reglas de la sección 6.
- Corrección editable por sospecha, versión corregida por requisito y «Aplicar todas las correcciones».
- Confirmar / falso positivo por sospecha, persistido.
- Generación de casos con trazabilidad.
- Exportación en el navegador: requisitos mejorados, casos y sospechas.
- Reglas activables por proyecto y diccionario de dominio.
- Comparación entre versiones (diferencia por palabra).

### Fuera del MVP

- IA/LLM, registro público, inicio de sesión social, recuperación de contraseña por correo (el administrador la restablece).
- Ejecución de pruebas, integraciones (Jira, Azure DevOps), notificaciones.
- Carga real de archivos `.csv` / `.md` (el botón existe; en el MVP solo `.txt`, ver hito 5).
- Multi-idioma, pagos, equipos compartidos.

---

## 4. Pantallas y flujo (según el diseño)

### 4.1 Mapa de rutas

| Ruta | Pantalla | Acceso |
|---|---|---|
| `/login` | Inicio de sesión | Público. Si hay sesión, redirige a `/` |
| `/` | Inicio y módulos | Requiere sesión |
| `/p/[projectId]/revisar` | Espacio de trabajo · paso 1 | Requiere sesión y ser dueño |
| `/p/[projectId]/generar` | Espacio de trabajo · paso 2 | Ídem |
| `/p/[projectId]/exportar` | Espacio de trabajo · paso 3 | Ídem |
| `/p/[projectId]/versiones` | Versiones y comparación | Ídem |
| `/p/[projectId]/reglas` | Reglas y diccionario | Ídem |
| `/p/[projectId]` | Redirige a `/p/[projectId]/revisar` | Ídem |

Cada paso del espacio de trabajo es **una ruta**, no un estado local: así el menú lateral enlaza directamente a cada módulo.

### 4.2 Menú lateral (todas las pantallas salvo login)

- Logo «Quali» + «Req» (Req en verde lima) → `/`.
- **Inicio** → `/`.
- Grupo «Módulos · ‹nombre del proyecto activo›»:
  - **Revisor de requisitos** → `/p/[id]/revisar`, con contador de sospechas abiertas.
  - **Generador de casos** → `/p/[id]/generar`, con contador de casos.
  - **Exportar** → `/p/[id]/exportar`.
- Grupo «Proyecto»: **Versiones**, **Reglas y diccionario** (contador «n/15» de reglas activas).
- Tarjeta «Motor v‹ENGINE_VERSION› · Determinista. Analiza en tu navegador».
- Usuario (iniciales + nombre) con «Cerrar sesión».

**Proyecto activo:** el último abierto, guardado en `profiles.last_project_id`. Si no hay ninguno, los enlaces de módulos llevan a `/` con el formulario de «Nuevo proyecto» abierto. El ítem de la ruta actual lleva `aria-current="page"`.

### 4.3 Login (`/login`)

- Panel izquierdo oscuro: titular «El defecto más barato es el que detectas antes de codificar.», un ejemplo de revisión con 3 casos alternables (AMB-01, VER-02, COM-03) y los pasos Revisar · Generar casos · Exportar.
- Panel derecho: «Inicia sesión», campos **Correo** y **Contraseña** (con botón Mostrar/Ocultar) y botón **Ingresar**. No hay otra forma de entrar.
- Validación en el cliente con Zod: correo con formato válido; contraseña de al menos 8 caracteres. Errores bajo cada campo.
- Error del servidor: un mensaje único «Correo o contraseña incorrectos.» (no revelar cuál falló).
- Al iniciar sesión → `/`.

### 4.4 Inicio (`/`)

- «Hola, ‹nombre›» y botón **Nuevo proyecto** (formulario en línea: nombre, Crear, Cancelar).
- Dos tarjetas de módulo: **Revisor de requisitos** (fondo verde) y **Generador de casos de prueba** (fondo oscuro), y un recuadro «Cómo funciona» en 3 pasos.
- **Proyectos**: buscador por nombre y tarjetas con anillo de calidad, versión, nº de requisitos, sospechas, casos y última actividad. Clic → `/p/[id]/revisar`.
- Los números de la tarjeta salen de `requirement_sets.summary` de la última versión.

### 4.5 Espacio de trabajo

Cabecera: migas «Proyectos / ‹proyecto›», nombre, insignia «Versión N · borrador», huella del texto analizado, cambio de tema y **Guardar versión**. Debajo, el paso a paso: **1 Revisar y corregir** · **2 Generar casos** · **3 Exportar**, cada uno con un subtítulo dinámico.

Un aviso tipo *toast* aparece tras aplicar correcciones: «Corrección X aplicada a RF-01. Se volvió a analizar.» con **Deshacer**.

#### 4.5.1 Revisar y corregir

1. **Editor** (protagonista, ancho completo, borde y halo de acento):
   - Etiqueta «Paso 1», título «Escribe o pega tus requisitos» y la ayuda de formato.
   - Fila con el modelo de redacción en chips: [lugar/tiempo/evento] + debe + acción + sujeto + resultado.
   - Barra: Cargar ejemplo, Subir archivo, Limpiar.
   - Área de texto sin ajuste de línea (`wrap="off"`), 16 px, interlineado de 28 px, con **canal de números de línea**. Junto a cada número, un punto con la calidad del requisito de esa línea (verde ≥ 80, ámbar ≥ 50, naranja < 50); si hay cambios sin analizar, punto vacío.
   - Pie: las 8 etapas del pipeline (se iluminan una a una al analizar, ~120 ms por etapa, solo visual), «Analizado en X ms · mismo texto, mismo resultado», leyenda de colores, botón **Exportar mejorados** y botón **Analizar** grande.
   - Insignia «Cambios sin analizar» cuando el texto del editor difiere del último analizado.
2. **Resumen**: anillo de calidad global y tres tarjetas de severidad (Alta «Bloquean la verificación», Media «Dificultan la prueba», Baja «Mejoras de forma») que funcionan como filtro.
3. **Lista de requisitos** (izquierda): anillo con su puntuación, ID, tipo RF/RNF, nº de sospechas y texto. Clic selecciona o deselecciona.
4. **Detalle del requisito seleccionado** (derecha, arriba):
   - Texto con los términos sospechosos resaltados.
   - Partes del modelo de redacción detectadas: Evento o condición (opcional), Sujeto, Debe, Acción, Resultado; las que faltan se marcan «Falta».
   - Los 8 atributos con estado Cumple / Revisar / Juicio humano.
   - **Versión corregida** con todas las correcciones juntas, editable, con Restablecer y **Aplicar versión corregida**.
5. **Sospechas y correcciones**: título con contador, filtros activos como chips, chips de reglas desactivadas (clic para reactivar) y **Aplicar todas las correcciones**. Cada tarjeta muestra:
   - Severidad, ID de regla, atributo, ID del requisito (clic lo selecciona).
   - Título, términos detectados entre «», y por qué / cómo se corrige.
   - **Corrección propuesta** editable con una ayuda contextual (si hay ‹marcadores›, pedir completarlos).
   - Botones: Restablecer (si se editó), Falso positivo, Desactivar regla, **Aplicar corrección**.
   - Si es falso positivo: insignia y Deshacer; la corrección se oculta.
6. Botón «Siguiente: generar casos».

#### 4.5.2 Generar casos

- Izquierda: «Todos los casos» + un ítem por requisito con su tipo de restricción (Rango, Umbral, Condición, Máximo, Mínimo, Carga) o «No verificable».
- Requisito con restricción: restricción en texto (ej. «Rango 8–16 caracteres, inclusive»), técnica usada, **recta numérica** con la zona válida y un punto por caso coloreado por tipo; clic en un punto resalta su fila.
- Requisito sin restricción: «‹ID› no genera casos», explicación y botón «Corregir ‹ID› en el revisor».
- «Todos»: tarjetas con el conteo por tipo y aviso de los requisitos sin casos.
- Tabla: ID, Requisito, Tipo, Técnica, Datos, Resultado esperado, Prioridad; filtro por tipo; botón «Ver en Gherkin».

#### 4.5.3 Exportar

- Selector de contenido: **Requisitos mejorados** (por defecto) · Casos de prueba · Sospechas.
- Formatos según contenido:
  - Mejorados: TXT, Markdown, CSV, JSON.
  - Casos: CSV, Markdown, JSON, Gherkin.
  - Sospechas: CSV, Markdown, JSON.
- En «Mejorados»: «n de m mejorados», «n con valores por completar» y casilla «Incluir el texto original».
- Vista previa, Copiar y **Descargar** (Blob en el cliente; nada pasa por el servidor).

### 4.6 Versiones (`/p/[id]/versiones`)

- Historial (más reciente arriba): anillo de calidad, nombre (v1, v2…), fecha, autor, nota, conteos y botones **Base** / **Comparar**. La versión en borrador lleva la insignia «Borrador».
- Comparación: cambios en calidad global, sospechas, casos y nº de requisitos (verde si mejora, naranja si empeora); conteo de Nuevos / Modificados / Eliminados / Sin cambios; lista por requisito con diferencia **por palabra** (LCS) entre las dos versiones, emparejando por ID.
- Botón «Abrir versión N» → carga esa versión en el espacio de trabajo en modo solo lectura (o como nuevo borrador si el usuario elige «Restaurar»).

### 4.7 Reglas y diccionario (`/p/[id]/reglas`)

- Filtro por atributo y lista de las 15 reglas con interruptor activar/desactivar.
- Ficha de la regla seleccionada: ID, severidad, atributo, tipo (Léxico, Patrón, Estructura, Heurística, Marca de revisión), título, justificación, términos que detecta, ejemplo con la sospecha y ejemplo correcto, sugerencia, fuente y «Precisión medida: pendiente del conjunto de oro».
- **Diccionario de dominio**: agregar y quitar términos. Un término del diccionario se ignora en las reglas léxicas (AMB-01, VER-02, VIA-01). Ejemplo: «Pago rápido».
- Los cambios se guardan en `rule_overrides` y `domain_terms` y afectan al análisis del proyecto.

---

## 5. Sistema visual

### 5.1 Tipografía (Google Fonts)

| Uso | Fuente | Detalle |
|---|---|---|
| Títulos, cifras, nombres de paso | **Bricolage Grotesque** (opsz 12–96, peso 500–800) | peso 700, tracking −0.02 a −0.035em |
| Interfaz y texto | **Plus Jakarta Sans** (400, 500, 600, 700) | base 15 px / 24 px |
| IDs (RF-01, AMB-01, TC-RF01-03), huella, exportación | **JetBrains Mono** (500, 600) | 13 px / 20 px |

Nada por debajo de 13 px. Cifras con `font-variant-numeric: tabular-nums`. Rótulos en tipo oración, nunca en mayúsculas sostenidas.

### 5.2 Tokens de color

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `s0` | #f4f3ee | #0f1110 | Fondo de página |
| `s1` | #ffffff | #181a18 | Paneles, tarjetas |
| `s2` | #ecebe4 | #232521 | Rellenos sutiles, selección |
| `s3` | #dedcd2 | #33352f | Pista de anillos y ejes |
| `line` | #e1dfd6 | #30322d | Bordes de 1 px |
| `line-strong` | #8c8a80 | #77786f | Borde de controles |
| `ink` | #15201d | #edece6 | Texto |
| `ink-muted` | #585c55 | #a7a89f | Texto secundario |
| `accent` | #0e6656 | #5cc7ae | Acción primaria, cumple, válido |
| `accent-soft` | #dcede7 | #16302a | Fondo de insignias válidas y de corrección |
| `sev-alta` / soft | #b03d0b / #fbe6da | #ff9c66 / #3b2114 | Severidad alta, inválido |
| `sev-media` / soft | #835500 / #f6ead0 | #e9b850 / #33290f | Severidad media, revisar |
| `sev-baja` / soft | #4c5864 / #e6eaee | #a9b6c2 / #262c31 | Severidad baja, juicio humano |
| `tc-limite` / soft | #35557d / #e3eaf4 | #93b4dc / #1d2836 | Caso límite |
| `tc-nf` / soft | #56621f / #ecefd8 | #bfcc7e / #262a14 | Caso no funcional |
| `nav` / `nav-2` | #0f1f1b / #1b342d | #0a1412 / #16291f | Menú lateral |
| `nav-ink` / `nav-muted` | #eef3ef / #a9bdb4 | igual | Texto del menú |
| `lime` | #c6f06a | igual | Solo sobre fondos oscuros: activo del menú, «Paso 1», número del paso activo |

Reglas: el color siempre va acompañado de la palabra («Alta», «Límite»). Texto 4.5:1, bordes de control y foco 3:1. Anillo de foco de 2 px con 2 px de separación.

### 5.3 Forma y componentes

- Radios: 10–12 px botones e inputs, 16–18 px tarjetas y paneles, 24 px el editor, 999 px insignias y filtros.
- Jerarquía con bordes de 1 px; sombra solo en el segmento activo de un filtro.
- Controles de 42 px (34 px en tarjetas, 52 px el botón Analizar y los campos del login).
- Iconos de trazo en línea (16–20 px, grosor 1.75, `currentColor`). Sin librería externa de iconos ni logotipo gráfico.
- Anillos de calidad con `conic-gradient(color p%, s3 0)`; color por puntuación: ≥ 80 accent, ≥ 50 sev-media, < 50 sev-alta.
- Implementación sugerida: Tailwind CSS con los tokens como variables CSS (`:root` y `.dark`) + componentes propios; shadcn/ui opcional para el diálogo y el toast.

---

## 6. Motor (`packages/engine`)

Librería TypeScript **pura e isomórfica** (sin DOM, Node, React ni red). Corre en un Web Worker en el navegador y en Node para pruebas. `ENGINE_VERSION = "0.1.0"`; subir la versión menor cada vez que cambie una regla o una corrección.

### 6.1 API pública

```ts
export const ENGINE_VERSION: string;

export type Kind = 'RF' | 'RNF';
export type Priority = 'Alta' | 'Media' | 'Baja';
export type Severity = 'alta' | 'media' | 'baja';
export type Attribute = 'necesario' | 'no_ambiguo' | 'verificable' | 'completo'
  | 'correcto' | 'viable' | 'priorizable' | 'consistente';

export interface Requirement {
  id: string;          // 'RF-01' o 'R-03' si no trae ID
  hasId: boolean;
  line: number;        // índice de línea en el texto original (0-based)
  kind: Kind;
  priority: Priority | null;
  text: string;        // sin ID ni sufijo de prioridad
  constraint: Constraint | null;
}

export type Constraint =
  | { type: 'rango'; a: number; b: number; unit: string; raw: string }
  | { type: 'umbral'; v: number; unit: string; strict: boolean; raw: string }
  | { type: 'condicion'; v: number; money: boolean; less: boolean; consequence: string; raw: string }
  | { type: 'max' | 'min'; v: number; unit: string; raw: string }
  | { type: 'carga'; v: number; unit: 'usuarios'; raw: string };

export interface Finding {
  key: string;         // `${reqId}|${ruleId}|${line}`; estable para el mismo texto
  reqId: string; ruleId: string; attribute: Attribute; severity: Severity;
  title: string; why: string; terms: string[];
}

export type CaseType = 'valido' | 'invalido' | 'limite' | 'nf';
export interface TestCase {
  id: string;          // 'TC-RF01-03'
  reqId: string; value: number; type: CaseType; technique: string;
  data: string; expected: string; priority: Priority | 'Sin prioridad';
}

export interface AnalyzeOptions { disabledRules?: string[]; domainTerms?: string[] }
export interface Analysis {
  engineVersion: string; hash: string; lines: string[];
  requirements: Requirement[]; findings: Finding[]; cases: TestCase[];
}

export function analyze(text: string, opts?: AnalyzeOptions): Analysis;
export function suggestFix(ruleId: string, req: Requirement, all: Requirement[]): string;
export function improve(req: Requirement, ruleIds: string[], all: Requirement[]): string;
export function applyReplacements(text: string, items: { req: Requirement; replacement: string }[]): string;
export function scoreRequirement(reqId: string, openFindings: Finding[]): number;   // 0–100
export function globalScore(reqs: Requirement[], openFindings: Finding[]): number;
export function wordDiff(a: string, b: string): { t: string; op: 'eq' | 'del' | 'ins' }[];
export const RULES: RuleDefinition[];          // catálogo (6.4), como datos
export const exporters: {
  improvedTxt(a: Analysis, open: Finding[], opts: { withOriginal: boolean; project: string; version: number }): string;
  improvedMd(...): string; improvedCsv(...): string; improvedJson(...): string;
  casesCsv(a: Analysis): string; casesMd(a: Analysis): string; casesJson(a: Analysis): string; casesGherkin(a: Analysis): string;
  findingsCsv(open: Finding[]): string; findingsMd(open: Finding[]): string; findingsJson(open: Finding[], a: Analysis): string;
};
```

«Sospechas abiertas» (`open`) = hallazgos de reglas activas cuyo estado no es «rechazado».

### 6.2 Pipeline

```
texto → segmentar (una línea no vacía = un requisito, máx. 200)
      → parsear ID (^((?:RNF|RF|R)-?\d+)\s*[:.\-–]?\s*) y prioridad («Prioridad: Alta|Media|Baja» al final)
      → extraer restricción (6.3)
      → evaluar reglas activas (6.4), enmascarando términos del diccionario
      → derivar casos (6.5)
      → huella djb2 del texto completo (hex, 6 caracteres)
```

- `kind = 'RNF'` si el ID empieza por `RNF`; si no, `'RF'`.
- Sin ID: `R-01`, `R-02`… en orden.
- Diccionario: antes de las reglas léxicas, cada término del diccionario (sin distinguir mayúsculas) se reemplaza por espacios del mismo largo en una copia en minúsculas.
- Coincidencia de palabra (`findWord`): límites de palabra manuales con la clase `[a-z0-9áéíóúñü]`, porque `\b` de JavaScript no reconoce tildes.
- Regexes sin cuantificadores anidados (ReDoS); prueba de propiedad con tiempo máximo.

### 6.3 Extracción de restricciones (primera que coincida, sobre el texto en minúsculas)

| Tipo | Patrón | Ejemplo |
|---|---|---|
| rango | `(entre\|de) N (y\|a) M [unidad]` con M > N | «entre 8 y 16 caracteres» |
| umbral | `(en menos de\|menos de\|como máximo\|máximo de\|no más de\|hasta) N (ms\|s\|segundos\|minutos\|min)`; `strict` si contiene «menos» | «en menos de 30 s» |
| condición | `si … (supera\|excede\|es mayor a/que\|es menor a/que) [S/ o $] N`; la consecuencia es el texto tras la coma sin «el sistema debe» | «si el monto supera S/ 500, …» |
| max / min | `(máximo\|como mínimo\|mínimo\|al menos) [de] N [unidad]` | «máximo 5 intentos» |
| carga | `N usuarios concurrentes` | «200 usuarios concurrentes» |

Etiqueta legible: «Rango 8–16 caracteres, inclusive», «Umbral < 30 s», «Condición: monto > S/ 500», «Máximo 5 intentos», «Carga 200 usuarios».

### 6.4 Catálogo de reglas

Cada regla es un registro de datos (`id`, `attribute`, `severity`, `kind`, `title`, `why`, `terms`, `examples.bad/good`, `rewriteHint`, `source`, `enabled`). Fuente de todas: «IEEE 830 / ISO/IEC/IEEE 29148 · atributo ‹x›».

| ID | Atributo | Sev. | Tipo | Detección exacta |
|---|---|---|---|---|
| AMB-01 | No ambiguo | Alta | Léxico | Alguna palabra de: adecuado, adecuada, rápido, rápida, fácil, amigable, eficiente, robusto, intuitivo, sencillo, óptimo, moderno |
| AMB-02 | No ambiguo | Alta | Léxico | Subcadena: «etc.», «y/o», «según corresponda», «si es posible», «entre otros», «cuando sea necesario» |
| AMB-03 | No ambiguo | Media | Patrón | `(será\|serán\|es\|son\|fue\|fueron\|sea\|sean) + participio (‑ado/‑ada/‑ido/‑ida[s])` |
| VER-01 | Verificable | Alta | Estructura | RNF sin ningún dígito |
| VER-02 | Verificable | Media | Léxico | varios, varias, algunos, algunas, muchos, muchas, pocos, pocas, diversos |
| COM-01 | Completo | Alta | Estructura | Sin voz pasiva y sin sujeto (el sistema, la aplicación, el módulo, la plataforma, el servidor, la app) |
| COM-02 | Completo | Media | Patrón | `debe (ser\|estar) palabra` |
| COM-03 | Completo | Media | Estructura | Restricción rango/max/min y sin (rechaz, error, mensaje, impid, bloque, no permit, deneg) |
| COM-04 | Completo | Alta | Léxico | Marcadores `‹…›`, «TBD», «por definir», «pendiente», «??» |
| COR-01 | Correcto | Media | Estructura | Más de un «debe», o «participio y participio», o «debe verbo‑r y verbo‑r» |
| VIA-01 | Viable | Media | Léxico | siempre, nunca, todos, todas, 100 %, 100%, totalmente, ningún |
| PRI-01 | Priorizable | Baja | Estructura | Sin prioridad |
| CON-01 | Consistente | Alta | Estructura | ID repetido en el conjunto |
| CON-02 | Consistente | Media | Heurística | Reservada: umbrales contradictorios sobre el mismo sujeto. **No implementada en el MVP** (0 hallazgos) |
| NEC-01 | Necesario | Baja | Marca de revisión | No se dispara automáticamente: Necesario es juicio humano |

Las reglas léxicas (AMB-01, VER-02, VIA-01) respetan el diccionario de dominio.

### 6.5 Generación de casos

ID: `TC-` + ID sin guion + `-` + correlativo de 2 dígitos. Prioridad heredada (o «Sin prioridad»).

| Restricción | Casos (valor · tipo · técnica · resultado esperado) |
|---|---|
| Rango [a, b] | a−1 inválido «BVA · a−1» «Rechaza el valor y muestra un mensaje de error»; a límite; a+1 válido; nominal = round((a+b)/2) válido «EP · nominal»; b−1 válido; b límite; b+1 inválido. Valores repetidos se omiten. Válidos y límite: «Acepta el valor» |
| Umbral estricto (< v) | v−1 no funcional «Cumple: menos de v u»; v límite «No cumple: se exige menos de v u»; v+1 inválido «No cumple: se registra la falla» |
| Umbral inclusivo (≤ v) | v−1 no funcional «Cumple»; v límite «Cumple: justo en el máximo»; v+1 inválido |
| Condición (> v) | paso = 0,01 si es dinero, si no 1. v+paso válido «Se ejecuta: ‹consecuencia›»; v límite «No se ejecuta»; v−paso válido «Condición no cumplida» «No se ejecuta». Para «menor» se invierte |
| Máximo n | n−1 válido; n límite; n+1 inválido «Rechaza el valor» |
| Mínimo n | n−1 inválido; n límite; n+1 válido |
| Carga n | n no funcional «Perfil de carga» «Mantiene el criterio de aceptación definido» |
| Sin restricción | No genera casos; la interfaz remite a VER-01 |

Dinero se muestra «S/ 500.00». Datos de umbral: «Medido: 29 s».

### 6.6 Correcciones deterministas

`suggestFix(regla, req)` devuelve **la línea completa** (ID + texto + « Prioridad: X» si la hay); puede devolver varias líneas separadas por `\n` (división). `improve(req, reglas)` encadena todas las correcciones del requisito en este orden: AMB-02 → AMB-03 → AMB-01/COM-02 → VER-02 → VER-01 → VIA-01 → COM-01 → COM-03 → COR-01 (división al final) → PRI-01 → CON-01.

| Regla | Transformación |
|---|---|
| AMB-01 | Si hay «debe ser/estar …»: «‹sujeto› debe ‹cláusulas›» uniendo una cláusula medible por término. Si no: cada término → «‹cláusula›». Cláusulas: rápido → «responder en menos de ‹2 s›»; fácil → «permitir completar ‹la tarea› en no más de ‹3› pasos»; amigable/intuitivo/sencillo → «permitir que el ‹90 %› de los usuarios nuevos complete ‹la tarea› sin ayuda»; eficiente → «consumir menos de ‹n› ‹recurso› por operación»; robusto → «operar ‹720› horas continuas sin fallas»; adecuado/óptimo → «cumplir ‹criterio medible con unidad›»; moderno → «seguir la ‹guía de estilo vigente›» |
| AMB-02 | «y/o» → «y»; se eliminan «etc.», «según corresponda», «si es posible», «entre otros», «cuando sea necesario» |
| AMB-03 | `^(artículo) (sujeto) (ser) participio [y participio]… resto` → «El sistema debe ‹infinitivos› ‹artículo sujeto› resto» (‑ado → ‑ar, ‑ido → ‑ir) |
| VER-01 | Si hay término subjetivo, como AMB-01; si no, añade « con ‹criterio medible y unidad›» |
| VER-02 | Cuantificador vago → «‹100›» |
| COM-01 | «El sistema debe » + texto (o reemplaza lo anterior a «debe») |
| COM-02 | Si hay término subjetivo, como AMB-01; si no, «debe ser X» → «debe ‹acción observable› y mostrar ‹resultado verificable›» |
| COM-03 | Añade « y rechazar cualquier otro valor mostrando un mensaje de error.» |
| COM-04 | Devuelve el texto igual: el usuario escribe el valor real en el editor de la corrección |
| COR-01 | Pasa a voz activa si aplica y divide: «debe A y B complemento» → «debe A objeto.» + nueva línea «‹nuevo ID› … debe B complemento.» El nuevo ID es el siguiente libre del mismo tipo |
| VIA-01 | siempre → «en el ‹99,5 %› de los casos»; nunca → «en menos del ‹0,5 %› de los casos»; todos/todas → «‹cada uno de›/‹cada una de›»; 100 % → «‹99,5 %›»; totalmente → «en un ‹95 %›» |
| PRI-01 | Añade « Prioridad: Media» |
| CON-01 | Cambia el ID por el siguiente libre |

Los marcadores `‹…›` son intencionales: la corrección queda aplicada pero COM-04 la marca hasta que el usuario escriba el dato real.

`applyReplacements`: reemplaza la línea `req.line` por las líneas de la corrección (de abajo hacia arriba para no desplazar índices). Si la primera línea no empieza con un ID y el requisito tenía ID, se le antepone.

Ejemplo (texto de muestra del diseño):

| Original | `improve` |
|---|---|
| RNF-01 El sistema debe ser rápido y fácil de usar. | RNF-01 El sistema debe responder en menos de ‹2 s› y permitir completar ‹la tarea› en no más de ‹3› pasos. Prioridad: Media |
| RF-03 Los reportes serán generados y exportados a PDF y/o Excel, etc. | RF-03 El sistema debe generar los reportes. Prioridad: Media<br>RF-05 El sistema debe exportar los reportes a PDF y Excel. Prioridad: Media |
| RF-01 … contraseña de entre 8 y 16 caracteres. | RF-01 … contraseña de entre 8 y 16 caracteres y rechazar cualquier otro valor mostrando un mensaje de error. Prioridad: Media |

### 6.7 Puntuación

- Atributos decidibles por reglas: no ambiguo, verificable, completo, viable, priorizable, consistente (6).
- `scoreRequirement` = round(atributos decidibles sin sospechas abiertas / 6 × 100).
- `globalScore` = promedio redondeado de los requisitos.
- Necesario y Correcto se muestran como «Juicio humano» salvo que COR-01 marque Correcto como «Revisar».
- % verificable = requisitos con restricción / total.
- Con el texto de muestra: 6 requisitos, 13 sospechas, 13 casos, calidad global 72 %, 50 % verificable (sirve como prueba *golden*).

### 6.8 Exportación «Requisitos mejorados» (.txt)

```
QualiReq · Requisitos mejorados
Proyecto: ‹nombre› · versión ‹N›
Motor v0.1.0 · huella ‹hash› · ‹dd/mm/aaaa›
Completa los valores entre ‹ › antes de aprobar los requisitos.

RF-01 …
    Antes: …                    (solo si «Incluir el texto original» y cambió)
    Reglas corregidas: COM-03, PRI-01
```

Cada requisito sale con `improve()` sobre sus sospechas abiertas; si no tiene, sale igual. CSV: `id,original,mejorado,reglas_corregidas` (varias líneas unidas con « | »). JSON: `{ engine_version, huella, requisitos: [{ id, original, mejorado: string[], reglas_corregidas }] }`. Nombre: `qualireq-requisitos-mejorados.txt`.

---

## 7. Arquitectura

### 7.1 Vista general

```
┌──────────────────────────── Navegador ─────────────────────────────┐
│ Next.js (React, App Router)                                        │
│  ├─ UI: Login · Inicio · Revisar · Generar · Exportar · Versiones · │
│  │      Reglas                                                     │
│  ├─ Zustand: estado del espacio de trabajo por proyecto            │
│  ├─ Web Worker ── packages/engine (análisis, correcciones, casos,  │
│  │                exportadores)  → SIN red                         │
│  └─ supabase-js (createBrowserClient) solo para la sesión          │
└───────────────┬────────────────────────────────────────────────────┘
                │ cookies de sesión (HttpOnly) · Server Actions
┌───────────────▼──────────────── Vercel ────────────────────────────┐
│ proxy.ts (o middleware.ts) → refresca sesión, protege rutas        │
│ Server Components → lecturas con createServerClient (RLS activo)   │
│ Server Actions (Zod) → escrituras con la sesión del usuario        │
└───────────────┬────────────────────────────────────────────────────┘
                │ PostgREST / Auth (HTTPS)
┌───────────────▼──────────────── Supabase ──────────────────────────┐
│ Auth: correo + contraseña, sin registro público                    │
│ Postgres: profiles · projects · requirement_sets · finding_decisions│
│           · rule_overrides · domain_terms   (RLS por dueño)         │
└────────────────────────────────────────────────────────────────────┘
```

**Principios**

1. **El análisis nunca sale del navegador.** El servidor solo guarda el texto crudo, las decisiones y la configuración.
2. **No se guardan hallazgos ni casos**: se recalculan con `analyze(raw_text)` y el `engine_version` guardado. Así el análisis es reproducible y la base es pequeña.
3. **RLS es la barrera de seguridad.** El servidor usa siempre la sesión del usuario (clave publicable), nunca la clave secreta.
4. Sin API REST propia en el MVP: lecturas en Server Components y escrituras en Server Actions. `/api/analyze` queda para el hito de CLI/CI.

### 7.2 Frontend

| Pieza | Elección |
|---|---|
| Framework | Next.js estable vigente (App Router) + React + TypeScript |
| Estilos | Tailwind CSS con tokens como variables CSS; tema claro/oscuro con clase `.dark` |
| Fuentes | `next/font/google`: Bricolage Grotesque, Plus Jakarta Sans, JetBrains Mono |
| Estado | Zustand: `text`, `analyzedText`, `analysis`, `decisions`, `edits`, `toast`, selección y filtros |
| Cómputo | Web Worker con `packages/engine` (`comlink` opcional) |
| Formularios | Zod en cliente y servidor (mismos esquemas en `apps/web/lib/schemas.ts`) |
| Tablas | HTML semántico; TanStack Table solo si hace falta ordenar |

**Guardado del borrador:** cada cambio en el editor o en una decisión se guarda con *debounce* de 1,5 s mediante la Server Action `saveDraft`. Indicador discreto «Guardado» / «Guardando…» en la cabecera.

### 7.3 Autenticación con Supabase

**Configuración en el panel de Supabase (Authentication):**

1. Providers → Email: habilitado. Los demás proveedores, deshabilitados.
2. Sign In / Providers → **Allow new users to sign up: desactivado** (no hay registro público).
3. Contraseña: longitud mínima **8**.
4. Usuarios: Authentication → Users → **Add user → Create new user**, con «Auto Confirm User». Así el administrador crea las cuentas del equipo y del docente.
5. URL Configuration → Site URL: la URL de Vercel; añadir `http://localhost:3000` para desarrollo.

**Paquetes:** `@supabase/supabase-js` y `@supabase/ssr`.

**Archivos:**

| Archivo | Contenido |
|---|---|
| `apps/web/lib/supabase/client.ts` | `createBrowserClient(URL, PUBLISHABLE_KEY)` |
| `apps/web/lib/supabase/server.ts` | `createServerClient` con `cookies()` de `next/headers` usando `getAll` / `setAll` |
| `apps/web/lib/supabase/proxy.ts` | `updateSession(request)`: crea el cliente, llama a `auth.getClaims()`, redirige a `/login` si no hay sesión y la ruta no es `/login`; redirige a `/` si hay sesión y la ruta es `/login`. Devuelve **siempre** la respuesta con las cookies que construyó `setAll` |
| `apps/web/proxy.ts` | Next.js ≥ 16: `export async function proxy(req) { return updateSession(req) }` + `config.matcher` que excluye `_next/static`, `_next/image`, `favicon.ico` e imágenes. **En Next.js ≤ 15 el archivo se llama `middleware.ts` y exporta `middleware`** (un `proxy.ts` no se ejecuta en esas versiones) |

**Verificación de identidad:** en el servidor usar `supabase.auth.getClaims()` para proteger páginas y datos. No usar el usuario de `getSession()` para autorizar.

**Server Actions de auth (`apps/web/app/(auth)/login/actions.ts`):**

```ts
'use server';
const LoginSchema = z.object({
  email: z.string().trim().email('El correo no tiene un formato válido.'),
  password: z.string().min(8, 'La contraseña tiene al menos 8 caracteres.'),
});

export async function signIn(_: unknown, formData: FormData) {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  const supabase = await createClient();                 // lib/supabase/server
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: { form: ['Correo o contraseña incorrectos.'] } };
  redirect('/');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
```

Supabase Auth aplica límites de intentos propios; revisar la configuración de *rate limits* en el panel antes de la demo.

### 7.4 Modelo de datos

```
auth.users (Supabase)
   │ 1:1
profiles ──1:N── projects ──1:N── requirement_sets ──1:N── finding_decisions
                    │ 1:N
                    ├── rule_overrides
                    └── domain_terms
```

| Tabla | Campos | Notas |
|---|---|---|
| `profiles` | `id` (= auth.users.id), `email`, `full_name`, `last_project_id`, `created_at` | Se crea por trigger al crear el usuario |
| `projects` | `id`, `owner_id`, `name`, `created_at`, `updated_at` | Un dueño por proyecto |
| `requirement_sets` | `id`, `project_id`, `version`, `raw_text`, `note`, `engine_version`, `text_hash`, `summary` (jsonb), `is_draft`, `created_at`, `updated_at` | Un solo borrador por proyecto. `summary = { reqs, findings, cases, score, verifPct }` para Inicio y Versiones |
| `finding_decisions` | `set_id`, `finding_key`, `status` (`aceptado`/`rechazado`), `decided_at` | PK compuesta. Alimenta la precisión por regla |
| `rule_overrides` | `project_id`, `rule_id`, `enabled` | Solo se guarda lo que difiere del catálogo |
| `domain_terms` | `id`, `project_id`, `term` | Único por proyecto sin distinguir mayúsculas |

**Ciclo de versiones:** al crear un proyecto se crea el borrador `version = 1`. «Guardar versión» marca el borrador como `is_draft = false` con su nota y crea un nuevo borrador `version + 1` copiando `raw_text` y las decisiones. «Restaurar» copia una versión guardada al borrador actual.

### 7.5 Migración inicial (`supabase/migrations/0001_init.sql`)

```sql
-- Perfiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  last_project_id uuid,
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Proyectos
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_owner_idx on public.projects (owner_id);

alter table public.profiles
  add constraint profiles_last_project_fk
  foreign key (last_project_id) references public.projects (id) on delete set null;

-- Versiones del conjunto de requisitos
create table public.requirement_sets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  version int not null check (version >= 1),
  raw_text text not null default '' check (char_length(raw_text) <= 51200),
  note text check (char_length(note) <= 280),
  engine_version text not null,
  text_hash text,
  summary jsonb not null default '{}'::jsonb,
  is_draft boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, version)
);
create unique index one_draft_per_project on public.requirement_sets (project_id) where is_draft;

-- Decisiones sobre sospechas
create table public.finding_decisions (
  set_id uuid not null references public.requirement_sets (id) on delete cascade,
  finding_key text not null check (char_length(finding_key) <= 120),
  status text not null check (status in ('aceptado', 'rechazado')),
  decided_at timestamptz not null default now(),
  primary key (set_id, finding_key)
);

-- Configuración de reglas y diccionario
create table public.rule_overrides (
  project_id uuid not null references public.projects (id) on delete cascade,
  rule_id text not null check (rule_id ~ '^[A-Z]{3}-\d{2}$'),
  enabled boolean not null,
  primary key (project_id, rule_id)
);

create table public.domain_terms (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  term text not null check (char_length(term) between 1 and 60)
);
create unique index domain_terms_unique on public.domain_terms (project_id, lower(term));

-- updated_at automático
create function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger projects_touch before update on public.projects for each row execute function public.touch_updated_at();
create trigger sets_touch before update on public.requirement_sets for each row execute function public.touch_updated_at();

-- Función de pertenencia (evita repetir el join en cada política)
create function public.owns_project(pid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.projects p where p.id = pid and p.owner_id = (select auth.uid()));
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.requirement_sets enable row level security;
alter table public.finding_decisions enable row level security;
alter table public.rule_overrides enable row level security;
alter table public.domain_terms enable row level security;

create policy "perfil propio: leer" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "perfil propio: editar" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "proyectos propios" on public.projects for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy "versiones de proyectos propios" on public.requirement_sets for all to authenticated
  using (public.owns_project(project_id)) with check (public.owns_project(project_id));

create policy "decisiones de proyectos propios" on public.finding_decisions for all to authenticated
  using (public.owns_project((select project_id from public.requirement_sets s where s.id = set_id)))
  with check (public.owns_project((select project_id from public.requirement_sets s where s.id = set_id)));

create policy "reglas de proyectos propios" on public.rule_overrides for all to authenticated
  using (public.owns_project(project_id)) with check (public.owns_project(project_id));

create policy "diccionario de proyectos propios" on public.domain_terms for all to authenticated
  using (public.owns_project(project_id)) with check (public.owns_project(project_id));

-- Guardar versión: congela el borrador y abre el siguiente (atómico, respeta RLS)
create function public.save_version(pid uuid, p_note text)
returns int language plpgsql security invoker set search_path = '' as $$
declare d public.requirement_sets; nid uuid;
begin
  select * into d from public.requirement_sets where project_id = pid and is_draft for update;
  if not found then raise exception 'Sin borrador'; end if;
  update public.requirement_sets set is_draft = false, note = p_note where id = d.id;
  insert into public.requirement_sets (project_id, version, raw_text, engine_version, text_hash, summary, is_draft)
  values (pid, d.version + 1, d.raw_text, d.engine_version, d.text_hash, d.summary, true)
  returning id into nid;
  insert into public.finding_decisions (set_id, finding_key, status)
  select nid, finding_key, status from public.finding_decisions where set_id = d.id;
  return d.version;
end; $$;
```

Después de aplicar la migración: `supabase gen types typescript --project-id <id> > apps/web/lib/supabase/database.types.ts`.

### 7.6 Capa de datos (Server Actions)

Todas en `apps/web/app/(app)/**/actions.ts`, con `'use server'`, validación Zod, cliente de servidor y `revalidatePath` cuando corresponda. Devuelven `{ ok: true, data } | { ok: false, error }`.

| Acción | Entrada (Zod) | Efecto |
|---|---|---|
| `createProject` | `{ name: 1..120 }` | Inserta proyecto + borrador v1 vacío; actualiza `last_project_id`; redirige a `/p/[id]/revisar` |
| `renameProject` / `deleteProject` | `{ id, name? }` | Actualiza / borra en cascada |
| `saveDraft` | `{ projectId, rawText ≤ 51200, textHash, summary }` | Upsert del borrador con `engine_version` actual |
| `saveVersion` | `{ projectId, note ≤ 280 }` | Congela el borrador y crea el siguiente (transacción vía función SQL `save_version(pid, note)` con `security invoker`) |
| `restoreVersion` | `{ projectId, version }` | Copia `raw_text` de esa versión al borrador |
| `setDecision` | `{ setId, findingKey, status: 'aceptado' \| 'rechazado' \| null }` | Upsert o delete |
| `setRuleEnabled` | `{ projectId, ruleId, enabled }` | Upsert; si coincide con el catálogo, delete |
| `addDomainTerm` / `removeDomainTerm` | `{ projectId, term 1..60 }` / `{ id }` | Insert / delete |
| `setLastProject` | `{ projectId }` | Actualiza `profiles.last_project_id` |

**Lecturas (Server Components):**

- `/`: proyectos del usuario con la última versión (`summary`, `version`, `updated_at`).
- `/p/[id]/*`: proyecto, borrador, decisiones del borrador, `rule_overrides`, `domain_terms`. Si el proyecto no existe o no es del usuario, `notFound()`.
- `/p/[id]/versiones`: todas las versiones (`version`, `note`, `raw_text`, `summary`, `created_at`). La diferencia se calcula en el cliente con `wordDiff`.

### 7.7 Seguridad

- **RLS** activado en todas las tablas; ninguna política para `anon`.
- **Claves:** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en el cliente; la clave secreta solo para scripts de administración locales, nunca en Vercel ni en el repositorio.
- **Límites:** `raw_text` ≤ 50 KB (CHECK + Zod), máx. 200 requisitos en el motor.
- **ReDoS:** regexes sin cuantificadores anidados; prueba de propiedad con tiempo máximo por entrada.
- **XSS:** React escapa por defecto; prohibido `dangerouslySetInnerHTML`. Encabezados CSP en `next.config`.
- **Privacidad:** no registrar `raw_text` en logs ni en errores reportados.
- **Datos personales:** si los requisitos pueden contener datos personales, revisar la Ley 29733 (no es asesoría legal).

---

## 8. Estructura del repositorio (monorepo pnpm)

```
qualireq/
├─ CLAUDE.md
├─ docs/
│  ├─ SPEC.md                    # este documento
│  └─ trazabilidad.md            # regla → PDF y página del curso
├─ packages/
│  └─ engine/
│     ├─ src/
│     │  ├─ index.ts             # API pública (6.1)
│     │  ├─ segment.ts  parse.ts  constraints.ts
│     │  ├─ rules/catalog.ts     # RULES como datos
│     │  ├─ rules/evaluate.ts
│     │  ├─ fixes.ts             # suggestFix, improve, applyReplacements
│     │  ├─ testgen.ts  score.ts  diff.ts  hash.ts
│     │  └─ export/{improved,cases,findings}.ts
│     └─ test/{rules,fixes,testgen,golden,properties}.test.ts
├─ apps/
│  └─ web/
│     ├─ app/
│     │  ├─ (auth)/login/{page.tsx,actions.ts}
│     │  ├─ (app)/layout.tsx                 # menú lateral
│     │  ├─ (app)/page.tsx                   # Inicio
│     │  ├─ (app)/p/[projectId]/{layout.tsx,revisar,generar,exportar,versiones,reglas}/
│     │  └─ globals.css                      # tokens
│     ├─ components/{nav,editor,findings,cases,export,versions,rules,ui}/
│     ├─ lib/supabase/{client.ts,server.ts,proxy.ts,database.types.ts}
│     ├─ lib/{schemas.ts,store.ts}
│     ├─ workers/engine.worker.ts
│     └─ proxy.ts                            # o middleware.ts en Next ≤ 15
├─ supabase/
│  ├─ config.toml
│  ├─ migrations/0001_init.sql
│  └─ seed.sql                               # proyecto de ejemplo opcional
├─ gold/requisitos.csv                       # conjunto de oro etiquetado
├─ .github/workflows/ci.yml
└─ pnpm-workspace.yaml
```

---

## 9. Configuración y variables de entorno

`apps/web/.env.local` (y en Vercel → Settings → Environment Variables):

```
NEXT_PUBLIC_SUPABASE_URL=https://<proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Pasos:

1. Crear el proyecto en Supabase (región más cercana disponible).
2. `pnpm dlx supabase login` → `supabase link --project-ref <ref>` → `supabase db push` para aplicar `0001_init.sql`.
3. Configurar Auth (7.3) y crear los usuarios.
4. `supabase gen types typescript --project-id <ref> > apps/web/lib/supabase/database.types.ts`.
5. `pnpm install` → `pnpm --filter web dev`.

Desarrollo local opcional con `supabase start` (requiere Docker).

---

## 10. Despliegue en Vercel

1. Subir el repositorio a GitHub.
2. Vercel → Add New Project → importar → **Root Directory:** `apps/web`.
3. Build: `pnpm --filter web build`.
4. Variables de entorno de la sección 9.
5. En Supabase → URL Configuration, poner la URL de producción como Site URL.
6. Las migraciones se aplican con `supabase db push` desde local o desde CI (secreto `SUPABASE_ACCESS_TOKEN`), nunca en el build de Vercel.
7. Cada Pull Request genera un *preview deploy*. Para no tocar la base de producción desde previews, usar un segundo proyecto Supabase (el plan gratuito permite 2).

---

## 11. Estrategia de pruebas

| Nivel | Herramienta | Qué verifica |
|---|---|---|
| Unitarias por regla | Vitest | Cada regla con sus `examples.bad` (dispara) y `examples.good` (no dispara) |
| Correcciones | Vitest | Tras `applyReplacements(suggestFix(r))`, la regla `r` deja de dispararse (salvo que la corrección deje ‹marcadores›, entonces solo COM-04) |
| Casos | Vitest | Tabla 6.5 para cada tipo de restricción |
| Golden | Vitest | Texto de muestra → 6 requisitos, 13 sospechas, 13 casos, 72 % global, huella estable; salida de `improve` de la tabla 6.6 |
| Propiedades | fast-check | Determinismo, nunca lanza excepción, idempotencia de `analyze`, tiempo < 50 ms para 200 líneas aleatorias |
| Conjunto de oro | Vitest + `gold/` | Precisión y recall por regla; el CI falla si bajan del umbral acordado |
| RLS | SQL (pgTAP) o Vitest con dos usuarios | Un usuario no ve ni modifica proyectos de otro |
| E2E | Playwright | Login → crear proyecto → pegar ejemplo → aplicar una corrección → exportar .txt → guardar versión → comparar |
| Accesibilidad | axe | Sin violaciones críticas |
| CI | GitHub Actions | Lint, tipos, pruebas, build |

**Conjunto de oro:** 30–50 requisitos reales o realistas, etiquetados por dos personas de forma independiente.

---

## 12. Plan de implementación (hitos para Claude Code)

| # | Hito | Criterios de aceptación |
|---|---|---|
| 1 | **Monorepo y motor base**: pnpm workspace, `packages/engine` con segmentación, parseo, extracción y las reglas de 6.4 | Pruebas por regla y golden de conteos (6 requisitos, 13 sospechas) en verde |
| 2 | **Casos, puntuación, correcciones y exportadores** | Tablas 6.5–6.8 cubiertas por pruebas; golden de `improve`; pruebas de propiedades |
| 3 | **Next.js + sistema visual**: tokens, fuentes, componentes base, menú lateral, tema oscuro | Página de muestra con todos los componentes; axe sin errores críticos |
| 4 | **Supabase y login**: migración, Auth, `proxy.ts`/`middleware.ts`, login y cierre de sesión | Sin sesión, cualquier ruta redirige a `/login`; con credenciales válidas entra a `/`; error genérico con credenciales inválidas; prueba RLS con dos usuarios |
| 5 | **Inicio y proyectos**: listar, buscar, crear, `last_project_id` | Crear proyecto lleva a su espacio de trabajo; los enlaces del menú apuntan al proyecto activo |
| 6 | **Revisar y corregir**: editor con canal de líneas, Web Worker, resumen, lista, detalle, tarjetas con corrección editable, aplicar, aplicar todas, deshacer, decisiones persistidas, guardado del borrador. Subir `.txt` | Flujo completo con el texto de muestra; recargar la página conserva texto y decisiones |
| 7 | **Generar casos**: lista, recta numérica, tabla, filtro, Gherkin | Coincide con la tabla 6.5 para el ejemplo |
| 8 | **Exportar**: mejorados, casos, sospechas en todos los formatos; copiar y descargar | Archivos descargados idénticos a la salida de los exportadores del motor |
| 9 | **Versiones y Reglas**: guardar, restaurar, comparar; interruptores y diccionario aplicados al análisis | Desactivar AMB-01 elimina sus sospechas; agregar «Pago rápido» evita marcar «rápido» en esa frase |
| 10 | **Calidad y despliegue**: E2E, CI, conjunto de oro, despliegue en Vercel | CI verde; URL pública con login; guion de sustentación |
| 11 (opcional) | **CLI / GitHub Action** con `POST /api/analyze` | Fuera del MVP |

---

## 13. Experimento de validación

**Pregunta:** ¿aporta QualiReq algo medible frente a pedirle a una IA de chat que revise los mismos requisitos?

1. 30–50 requisitos con defectos conocidos y requisitos sanos.
2. QualiReq 1 vez; la IA 3 veces con el mismo prompt.
3. Dos revisores clasifican cada hallazgo: útil / no útil / falso positivo.
4. Medir consistencia entre corridas, precisión y recall, tiempo de revisión por requisito, % de hallazgos con regla y fuente verificables y % de correcciones aceptadas sin edición.
5. Meta de trabajo (no resultado): al menos 70 % de hallazgos útiles.

**Resultado honesto esperable:** QualiReq gana en consistencia, trazabilidad y privacidad; la IA puede ganar en hallazgos semánticos.

---

## 14. Riesgos

| Riesgo | Mitigación |
|---|---|
| Falsos positivos | Presentar como sospechas; falso positivo; desactivar regla; diccionario; medir precisión |
| Correcciones con mala redacción en casos raros | La corrección siempre es editable antes de aplicar; Deshacer; ‹marcadores› visibles |
| Claves de hallazgo cambian al mover líneas | Aceptado en el MVP: la decisión se pierde si el requisito cambia de línea; documentarlo |
| Supabase Free se pausa tras 7 días | Abrir la app antes de la demo; plan Pro si se usa en producción |
| Vercel Hobby no permite uso comercial | Pasar a Pro antes de cobrar |
| Exposición de datos entre usuarios | RLS en todas las tablas + prueba automatizada con dos usuarios |
| Clave secreta filtrada | Solo variables con clave publicable en la app; revisión en CI (`gitleaks`) |
| ReDoS y entradas enormes | Regexes revisadas, límites de tamaño, pruebas de propiedades |
| Alcance excesivo | Hitos en orden; el 11 es opcional |

---

## 15. Trazabilidad con el curso

| Contenido del curso | Dónde aparece |
|---|---|
| 8 atributos de un buen requisito | Reglas, puntuación y atributos del detalle |
| Modelo [lugar/tiempo/evento] + debe + acción + sujeto + resultado | Chips del editor, partes detectadas y correcciones |
| Revisiones e inspecciones (IEEE 1028), pruebas estáticas | Revisión automática antes de codificar |
| Casos con entradas válidas/inválidas y resultado esperado | Generador de casos |
| Partición de equivalencia y valores límite | Recta numérica y técnicas por caso |
| Defecto / falla / error | Vocabulario de interfaz y exportaciones |
| Matriz de priorización | Prioridad, PRI-01 y prioridad heredada por los casos |
| Costo total de calidad | Panel opcional (fase posterior) |

*Pendiente:* completar `docs/trazabilidad.md` con el PDF y la página exacta de cada regla.

---

## 16. Fuentes

- Supabase, Auth del lado del servidor con Next.js: https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs
- Supabase, precios: https://supabase.com/pricing (límites del plan gratuito resumidos en https://automationatlas.io/answers/supabase-free-tier-limits-2026/)
- Vercel Hobby plan: https://vercel.com/docs/plans/hobby
- Non-determinism of ChatGPT in code generation: https://arxiv.org/abs/2308.02828
- Requirements Smells (ISO 29148): https://arxiv.org/abs/1611.08847
- IEEE 830 reemplazada por ISO/IEC/IEEE 29148: https://en.wikipedia.org/wiki/Software_requirements_specification
- Comparación de herramientas de ambigüedad (MDH/Alstom, 180 requisitos): recuperar la URL antes de la sustentación.
- Material del curso SI-784: PDFs del proyecto «Calidad y pruebas de Software».
