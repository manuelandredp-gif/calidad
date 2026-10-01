// ==========================================================================
// Plantillas ISTQB Deterministas para Generación Sin IA (RF-15)
// Generan casos de prueba estructurados basados en patrones comunes.
// No reemplazan la IA; la complementan como punto de partida.
// ==========================================================================

export interface TemplateCase {
  type: 'positive' | 'negative' | 'alternative' | 'boundary' | 'validation';
  titleTemplate: string;
  preconditions: string[];
  steps: string[];
  expectedResultTemplate: string;
  priority: 'high' | 'medium' | 'low';
  evidenceStatus: 'derived' | 'suggested';
}

export interface TemplateCategory {
  key: string;
  name: string;
  description: string;
  icon: string;
  cases: TemplateCase[];
}

// Helper para inyectar el nombre del requisito en los templates
export function hydrateTemplate(template: TemplateCase, reqTitle: string): TemplateCase {
  const inject = (s: string) => s.replace(/\{REQ\}/g, reqTitle);
  return {
    ...template,
    titleTemplate: inject(template.titleTemplate),
    preconditions: template.preconditions.map(inject),
    steps: template.steps.map(inject),
    expectedResultTemplate: inject(template.expectedResultTemplate),
  };
}

export const ISTQB_TEMPLATES: TemplateCategory[] = [
  // ──────────────────────────────────────────────────────────────────
  // 1. CRUD — Operaciones básicas de datos
  // ──────────────────────────────────────────────────────────────────
  {
    key: 'crud',
    name: 'CRUD (Crear, Leer, Actualizar, Eliminar)',
    description: 'Casos para validar operaciones estándar de datos: alta, consulta, modificación y baja.',
    icon: '🗃️',
    cases: [
      {
        type: 'positive',
        titleTemplate: 'Crear registro válido — {REQ}',
        preconditions: ['El usuario tiene sesión activa', 'El formulario de creación está disponible'],
        steps: [
          'Navegar al formulario de creación',
          'Completar todos los campos obligatorios con datos válidos',
          'Presionar el botón "Guardar" o "Crear"',
        ],
        expectedResultTemplate: 'El sistema crea el registro exitosamente y muestra mensaje de confirmación',
        priority: 'high',
        evidenceStatus: 'derived',
      },
      {
        type: 'positive',
        titleTemplate: 'Consultar registro existente — {REQ}',
        preconditions: ['Existe al menos un registro en el sistema'],
        steps: [
          'Navegar al listado de registros',
          'Seleccionar un registro existente',
          'Verificar que se muestra la información completa',
        ],
        expectedResultTemplate: 'El sistema muestra todos los campos del registro con datos correctos',
        priority: 'high',
        evidenceStatus: 'derived',
      },
      {
        type: 'positive',
        titleTemplate: 'Actualizar registro existente — {REQ}',
        preconditions: ['El usuario tiene permisos de edición', 'Existe un registro a modificar'],
        steps: [
          'Abrir el registro existente en modo edición',
          'Modificar uno o más campos con datos válidos',
          'Guardar los cambios',
        ],
        expectedResultTemplate: 'El sistema actualiza el registro y refleja los cambios inmediatamente',
        priority: 'high',
        evidenceStatus: 'derived',
      },
      {
        type: 'positive',
        titleTemplate: 'Eliminar registro existente — {REQ}',
        preconditions: ['El usuario tiene permisos de eliminación', 'Existe un registro a eliminar'],
        steps: [
          'Seleccionar el registro a eliminar',
          'Confirmar la acción de eliminación en el diálogo de confirmación',
        ],
        expectedResultTemplate: 'El sistema elimina el registro y lo remueve del listado',
        priority: 'high',
        evidenceStatus: 'derived',
      },
      {
        type: 'negative',
        titleTemplate: 'Crear registro con campos obligatorios vacíos — {REQ}',
        preconditions: ['El formulario de creación está disponible'],
        steps: [
          'Dejar vacíos los campos obligatorios',
          'Intentar guardar el registro',
        ],
        expectedResultTemplate: 'El sistema muestra mensajes de validación indicando los campos requeridos',
        priority: 'high',
        evidenceStatus: 'derived',
      },
      {
        type: 'negative',
        titleTemplate: 'Crear registro con datos duplicados — {REQ}',
        preconditions: ['Ya existe un registro con los mismos datos únicos'],
        steps: [
          'Intentar crear un registro con los mismos datos únicos que uno existente',
          'Guardar el registro',
        ],
        expectedResultTemplate: 'El sistema rechaza la creación y muestra error de duplicado',
        priority: 'medium',
        evidenceStatus: 'suggested',
      },
      {
        type: 'negative',
        titleTemplate: 'Eliminar registro sin confirmación — {REQ}',
        preconditions: ['Existe un registro a eliminar'],
        steps: [
          'Iniciar eliminación de un registro',
          'Cancelar el diálogo de confirmación',
        ],
        expectedResultTemplate: 'El sistema no elimina el registro y lo mantiene intacto',
        priority: 'medium',
        evidenceStatus: 'derived',
      },
      {
        type: 'boundary',
        titleTemplate: 'Crear registro con datos en el límite máximo — {REQ}',
        preconditions: ['El formulario de creación está disponible'],
        steps: [
          'Completar campos de texto con la longitud máxima permitida',
          'Guardar el registro',
        ],
        expectedResultTemplate: 'El sistema acepta los datos en el límite máximo sin errores',
        priority: 'medium',
        evidenceStatus: 'suggested',
      },
      {
        type: 'validation',
        titleTemplate: 'Validación de tipos de datos en formulario — {REQ}',
        preconditions: ['El formulario de creación está disponible'],
        steps: [
          'Ingresar texto en campos numéricos',
          'Ingresar números en campos de texto libre',
          'Ingresar caracteres especiales en todos los campos',
          'Verificar el comportamiento de validación',
        ],
        expectedResultTemplate: 'El sistema valida correctamente los tipos de datos y muestra mensajes claros',
        priority: 'medium',
        evidenceStatus: 'suggested',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // 2. Autenticación — Login, registro, sesión
  // ──────────────────────────────────────────────────────────────────
  {
    key: 'authentication',
    name: 'Autenticación y Sesión',
    description: 'Casos para validar inicio de sesión, registro, cierre de sesión y manejo de credenciales.',
    icon: '🔐',
    cases: [
      {
        type: 'positive',
        titleTemplate: 'Login exitoso con credenciales válidas — {REQ}',
        preconditions: ['El usuario está registrado en el sistema', 'El usuario no tiene sesión activa'],
        steps: [
          'Navegar a la página de login',
          'Ingresar email válido',
          'Ingresar contraseña correcta',
          'Presionar "Iniciar Sesión"',
        ],
        expectedResultTemplate: 'El sistema autentica al usuario y redirige al dashboard principal',
        priority: 'high',
        evidenceStatus: 'derived',
      },
      {
        type: 'positive',
        titleTemplate: 'Registro de nuevo usuario — {REQ}',
        preconditions: ['El formulario de registro está disponible'],
        steps: [
          'Navegar al formulario de registro',
          'Completar nombre, email y contraseña válidos',
          'Confirmar contraseña',
          'Enviar el formulario',
        ],
        expectedResultTemplate: 'El sistema crea la cuenta y redirige al usuario autenticado',
        priority: 'high',
        evidenceStatus: 'derived',
      },
      {
        type: 'positive',
        titleTemplate: 'Cierre de sesión exitoso — {REQ}',
        preconditions: ['El usuario tiene una sesión activa'],
        steps: [
          'Presionar el botón "Cerrar Sesión"',
          'Verificar redirección a la página de login',
        ],
        expectedResultTemplate: 'La sesión se invalida y el usuario no puede acceder a rutas protegidas',
        priority: 'high',
        evidenceStatus: 'derived',
      },
      {
        type: 'negative',
        titleTemplate: 'Login con contraseña incorrecta — {REQ}',
        preconditions: ['El usuario está registrado'],
        steps: [
          'Ingresar email válido',
          'Ingresar contraseña incorrecta',
          'Presionar "Iniciar Sesión"',
        ],
        expectedResultTemplate: 'El sistema muestra error genérico sin revelar si el email existe',
        priority: 'high',
        evidenceStatus: 'derived',
      },
      {
        type: 'negative',
        titleTemplate: 'Login con usuario inexistente — {REQ}',
        preconditions: ['El email no está registrado en el sistema'],
        steps: [
          'Ingresar un email no registrado',
          'Ingresar cualquier contraseña',
          'Presionar "Iniciar Sesión"',
        ],
        expectedResultTemplate: 'El sistema muestra el mismo error genérico que con contraseña incorrecta',
        priority: 'high',
        evidenceStatus: 'derived',
      },
      {
        type: 'negative',
        titleTemplate: 'Acceso a ruta protegida sin sesión — {REQ}',
        preconditions: ['El usuario no tiene sesión activa'],
        steps: [
          'Intentar acceder directamente a una URL protegida del sistema',
        ],
        expectedResultTemplate: 'El sistema redirige a la página de login con código 401',
        priority: 'high',
        evidenceStatus: 'derived',
      },
      {
        type: 'boundary',
        titleTemplate: 'Login con campos vacíos — {REQ}',
        preconditions: ['El formulario de login está disponible'],
        steps: [
          'Dejar el campo email vacío',
          'Dejar el campo contraseña vacío',
          'Presionar "Iniciar Sesión"',
        ],
        expectedResultTemplate: 'El sistema muestra validación de campos requeridos sin enviar petición',
        priority: 'medium',
        evidenceStatus: 'derived',
      },
      {
        type: 'validation',
        titleTemplate: 'Registro con email en formato inválido — {REQ}',
        preconditions: ['El formulario de registro está disponible'],
        steps: [
          'Ingresar un email sin formato válido (ej. "usuario@", "abc.com")',
          'Completar los demás campos correctamente',
          'Intentar enviar el formulario',
        ],
        expectedResultTemplate: 'El sistema rechaza el registro e indica el formato de email esperado',
        priority: 'medium',
        evidenceStatus: 'derived',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // 3. Validación de Formularios
  // ──────────────────────────────────────────────────────────────────
  {
    key: 'form_validation',
    name: 'Validación de Formularios',
    description: 'Casos para validar entradas de usuario, formatos, restricciones y mensajes de error.',
    icon: '📝',
    cases: [
      {
        type: 'positive',
        titleTemplate: 'Envío de formulario completo con datos válidos — {REQ}',
        preconditions: ['El formulario está disponible y accesible'],
        steps: [
          'Completar todos los campos obligatorios con datos válidos',
          'Completar campos opcionales',
          'Enviar el formulario',
        ],
        expectedResultTemplate: 'El formulario se envía exitosamente y los datos se persisten correctamente',
        priority: 'high',
        evidenceStatus: 'derived',
      },
      {
        type: 'positive',
        titleTemplate: 'Envío de formulario con solo campos obligatorios — {REQ}',
        preconditions: ['El formulario está disponible'],
        steps: [
          'Completar únicamente los campos obligatorios',
          'Dejar vacíos los campos opcionales',
          'Enviar el formulario',
        ],
        expectedResultTemplate: 'El formulario se envía exitosamente sin requerir campos opcionales',
        priority: 'medium',
        evidenceStatus: 'derived',
      },
      {
        type: 'negative',
        titleTemplate: 'Envío de formulario sin completar campos obligatorios — {REQ}',
        preconditions: ['El formulario está disponible'],
        steps: [
          'Dejar vacíos uno o más campos obligatorios',
          'Intentar enviar el formulario',
        ],
        expectedResultTemplate: 'El sistema bloquea el envío y señala los campos faltantes',
        priority: 'high',
        evidenceStatus: 'derived',
      },
      {
        type: 'boundary',
        titleTemplate: 'Entrada de texto con longitud mínima — {REQ}',
        preconditions: ['El formulario tiene campos con longitud mínima definida'],
        steps: [
          'Ingresar exactamente el mínimo de caracteres permitidos',
          'Enviar el formulario',
        ],
        expectedResultTemplate: 'El sistema acepta la entrada en el límite mínimo',
        priority: 'medium',
        evidenceStatus: 'suggested',
      },
      {
        type: 'boundary',
        titleTemplate: 'Entrada de texto excediendo longitud máxima — {REQ}',
        preconditions: ['El formulario tiene campos con longitud máxima definida'],
        steps: [
          'Ingresar más caracteres que el máximo permitido',
          'Verificar si el campo trunca o rechaza la entrada',
        ],
        expectedResultTemplate: 'El sistema limita la entrada al máximo permitido o muestra error de validación',
        priority: 'medium',
        evidenceStatus: 'suggested',
      },
      {
        type: 'validation',
        titleTemplate: 'Inyección de caracteres especiales en campos de texto — {REQ}',
        preconditions: ['El formulario está disponible'],
        steps: [
          'Ingresar caracteres como <script>, comillas, ampersands en campos de texto',
          'Enviar el formulario',
          'Verificar que los datos se almacenan de forma segura (escapados)',
        ],
        expectedResultTemplate: 'El sistema sanitiza la entrada y no ejecuta código inyectado',
        priority: 'high',
        evidenceStatus: 'suggested',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // 4. Búsqueda y Filtrado
  // ──────────────────────────────────────────────────────────────────
  {
    key: 'search_filter',
    name: 'Búsqueda y Filtrado',
    description: 'Casos para validar consultas, filtros, paginación y ordenamiento de resultados.',
    icon: '🔍',
    cases: [
      {
        type: 'positive',
        titleTemplate: 'Búsqueda con término existente — {REQ}',
        preconditions: ['Existen registros que coinciden con el término de búsqueda'],
        steps: [
          'Ingresar un término de búsqueda que coincida con registros existentes',
          'Ejecutar la búsqueda',
        ],
        expectedResultTemplate: 'El sistema muestra solo los registros que coinciden con el término',
        priority: 'high',
        evidenceStatus: 'derived',
      },
      {
        type: 'positive',
        titleTemplate: 'Filtrado por categoría o estado — {REQ}',
        preconditions: ['Existen registros con diferentes categorías o estados'],
        steps: [
          'Seleccionar un filtro de categoría o estado',
          'Verificar que los resultados corresponden al filtro aplicado',
        ],
        expectedResultTemplate: 'El listado muestra únicamente los registros que cumplen el criterio de filtro',
        priority: 'high',
        evidenceStatus: 'derived',
      },
      {
        type: 'positive',
        titleTemplate: 'Paginación de resultados — {REQ}',
        preconditions: ['Existen suficientes registros para generar más de una página'],
        steps: [
          'Navegar a la primera página del listado',
          'Avanzar a la siguiente página',
          'Retroceder a la página anterior',
        ],
        expectedResultTemplate: 'Los registros se muestran correctamente en cada página sin duplicados',
        priority: 'medium',
        evidenceStatus: 'derived',
      },
      {
        type: 'negative',
        titleTemplate: 'Búsqueda con término sin resultados — {REQ}',
        preconditions: ['El campo de búsqueda está disponible'],
        steps: [
          'Ingresar un término que no coincida con ningún registro',
          'Ejecutar la búsqueda',
        ],
        expectedResultTemplate: 'El sistema muestra mensaje "Sin resultados" y no muestra registros',
        priority: 'medium',
        evidenceStatus: 'derived',
      },
      {
        type: 'boundary',
        titleTemplate: 'Búsqueda con un solo carácter — {REQ}',
        preconditions: ['El campo de búsqueda está disponible'],
        steps: [
          'Ingresar un solo carácter en el campo de búsqueda',
          'Ejecutar la búsqueda',
        ],
        expectedResultTemplate: 'El sistema aplica el filtro correctamente o indica longitud mínima',
        priority: 'low',
        evidenceStatus: 'suggested',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // 5. Flujo de Estados / Transiciones
  // ──────────────────────────────────────────────────────────────────
  {
    key: 'state_flow',
    name: 'Flujo de Estados',
    description: 'Casos para validar transiciones de estado legales e ilegales en entidades del sistema.',
    icon: '🔄',
    cases: [
      {
        type: 'positive',
        titleTemplate: 'Transición de estado válida (avance) — {REQ}',
        preconditions: ['La entidad está en un estado inicial válido'],
        steps: [
          'Verificar el estado actual de la entidad',
          'Ejecutar la acción que produce la transición al siguiente estado',
          'Verificar que el estado cambió correctamente',
        ],
        expectedResultTemplate: 'La entidad transiciona al nuevo estado y se registra el cambio en el historial',
        priority: 'high',
        evidenceStatus: 'derived',
      },
      {
        type: 'positive',
        titleTemplate: 'Transición de estado válida (retroceso) — {REQ}',
        preconditions: ['La entidad permite retroceso de estado'],
        steps: [
          'Verificar el estado actual avanzado',
          'Ejecutar la acción de retroceso o rechazo',
          'Verificar que el estado regresó al anterior',
        ],
        expectedResultTemplate: 'La entidad retrocede al estado previo con registro de justificación',
        priority: 'medium',
        evidenceStatus: 'derived',
      },
      {
        type: 'negative',
        titleTemplate: 'Transición de estado inválida (ilegal) — {REQ}',
        preconditions: ['La entidad está en un estado que no permite la transición solicitada'],
        steps: [
          'Intentar ejecutar una acción de transición no permitida desde el estado actual',
        ],
        expectedResultTemplate: 'El sistema rechaza la transición y mantiene el estado actual sin cambios',
        priority: 'high',
        evidenceStatus: 'derived',
      },
      {
        type: 'negative',
        titleTemplate: 'Acción sobre entidad en estado final — {REQ}',
        preconditions: ['La entidad ha alcanzado su estado final (cerrado, archivado, etc.)'],
        steps: [
          'Intentar ejecutar cualquier acción de modificación sobre la entidad',
        ],
        expectedResultTemplate: 'El sistema impide la acción y muestra mensaje indicando que la entidad está cerrada',
        priority: 'medium',
        evidenceStatus: 'derived',
      },
      {
        type: 'alternative',
        titleTemplate: 'Transición concurrente al mismo recurso — {REQ}',
        preconditions: ['Dos usuarios acceden a la misma entidad simultáneamente'],
        steps: [
          'Usuario A abre la entidad y prepara una transición',
          'Usuario B transiciona la entidad antes que A',
          'Usuario A intenta completar su transición',
        ],
        expectedResultTemplate: 'El sistema detecta el conflicto (concurrencia optimista) y alerta al segundo usuario',
        priority: 'medium',
        evidenceStatus: 'suggested',
      },
      {
        type: 'validation',
        titleTemplate: 'Registro de auditoría en transiciones de estado — {REQ}',
        preconditions: ['La entidad ha pasado por múltiples transiciones de estado'],
        steps: [
          'Consultar el historial de cambios de la entidad',
          'Verificar que cada transición registra: quién, cuándo y el estado anterior vs nuevo',
        ],
        expectedResultTemplate: 'El historial contiene un registro inmutable de todas las transiciones con metadatos completos',
        priority: 'medium',
        evidenceStatus: 'derived',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // 6. Exportación
  // ──────────────────────────────────────────────────────────────────
  {
    key: 'export',
    name: 'Exportación de Datos',
    description: 'Casos para validar la descarga de datos en formatos CSV, JSON y otros.',
    icon: '📤',
    cases: [
      {
        type: 'positive',
        titleTemplate: 'Exportación exitosa en formato CSV — {REQ}',
        preconditions: ['Existen registros aprobados para exportar'],
        steps: [
          'Seleccionar formato CSV',
          'Presionar "Exportar"',
          'Verificar que se descarga un archivo .csv',
        ],
        expectedResultTemplate: 'El archivo CSV se descarga con las columnas esperadas y datos correctos',
        priority: 'high',
        evidenceStatus: 'derived',
      },
      {
        type: 'positive',
        titleTemplate: 'Exportación exitosa en formato JSON — {REQ}',
        preconditions: ['Existen registros aprobados para exportar'],
        steps: [
          'Seleccionar formato JSON',
          'Presionar "Exportar"',
          'Verificar que se descarga un archivo .json válido',
        ],
        expectedResultTemplate: 'El archivo JSON se descarga con estructura válida y datos completos',
        priority: 'medium',
        evidenceStatus: 'derived',
      },
      {
        type: 'negative',
        titleTemplate: 'Exportación sin registros disponibles — {REQ}',
        preconditions: ['No existen registros aprobados para exportar'],
        steps: [
          'Intentar exportar datos cuando no hay registros disponibles',
        ],
        expectedResultTemplate: 'El sistema muestra mensaje indicando que no hay datos para exportar',
        priority: 'medium',
        evidenceStatus: 'derived',
      },
      {
        type: 'validation',
        titleTemplate: 'Protección contra inyección de fórmulas en CSV — {REQ}',
        preconditions: ['Existen registros con datos que inician con =, +, -, @'],
        steps: [
          'Exportar datos que contengan caracteres de fórmula en sus campos',
          'Abrir el archivo CSV en un editor de texto',
          'Verificar que los caracteres de fórmula están escapados',
        ],
        expectedResultTemplate: 'Los campos potencialmente peligrosos están prefijados para evitar ejecución de fórmulas',
        priority: 'high',
        evidenceStatus: 'derived',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // 7. Permisos y Roles
  // ──────────────────────────────────────────────────────────────────
  {
    key: 'permissions',
    name: 'Permisos y Control de Acceso',
    description: 'Casos para validar que cada rol accede solo a lo que le corresponde.',
    icon: '🛡️',
    cases: [
      {
        type: 'positive',
        titleTemplate: 'Acceso permitido con rol autorizado — {REQ}',
        preconditions: ['El usuario tiene un rol con permisos para la acción'],
        steps: [
          'Iniciar sesión con un usuario del rol autorizado',
          'Ejecutar la acción protegida',
        ],
        expectedResultTemplate: 'El sistema permite la acción y se ejecuta exitosamente',
        priority: 'high',
        evidenceStatus: 'derived',
      },
      {
        type: 'negative',
        titleTemplate: 'Acceso denegado con rol no autorizado — {REQ}',
        preconditions: ['El usuario tiene un rol sin permisos para la acción'],
        steps: [
          'Iniciar sesión con un usuario sin el rol requerido',
          'Intentar ejecutar la acción protegida',
        ],
        expectedResultTemplate: 'El sistema rechaza la acción con código 403 Forbidden',
        priority: 'high',
        evidenceStatus: 'derived',
      },
      {
        type: 'negative',
        titleTemplate: 'Acceso a recurso de otro usuario (IDOR) — {REQ}',
        preconditions: ['Existen recursos pertenecientes a diferentes usuarios'],
        steps: [
          'Iniciar sesión como Usuario A',
          'Intentar acceder o modificar un recurso del Usuario B mediante su ID',
        ],
        expectedResultTemplate: 'El sistema rechaza el acceso y retorna 403 o 404',
        priority: 'high',
        evidenceStatus: 'derived',
      },
      {
        type: 'alternative',
        titleTemplate: 'Escalamiento de privilegios mediante manipulación de rol — {REQ}',
        preconditions: ['El usuario tiene rol básico (QA_TESTER)'],
        steps: [
          'Interceptar la petición de actualización de perfil',
          'Inyectar role: "ADMIN" en el payload',
          'Enviar la petición modificada',
        ],
        expectedResultTemplate: 'El sistema ignora el campo de rol inyectado y mantiene el rol original',
        priority: 'high',
        evidenceStatus: 'derived',
      },
    ],
  },
];
