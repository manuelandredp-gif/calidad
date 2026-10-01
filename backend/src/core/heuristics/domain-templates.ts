import { RawGeneratedCase } from '../interfaces/ai-provider.interface';

export type DomainArchetype =
  | 'AUTH_SECURITY'
  | 'CRUD_MANAGEMENT'
  | 'PAYMENTS_FINANCE'
  | 'FILE_UPLOAD'
  | 'SEARCH_FILTER'
  | 'GENERAL';

export class DomainTemplates {
  /**
   * Identifica el arquetipo de dominio de software analizando el título, descripción y criterios.
   */
  static detectArchetype(text: string): DomainArchetype {
    const lower = text.toLowerCase();

    if (/login|iniciar sesión|sesión|autentica|credencial|contraseña|password|jwt|token|registro/i.test(lower)) {
      return 'AUTH_SECURITY';
    }
    if (/pago|tarjeta|checkout|cupón|descuento|saldo|transacci|precio|monto|compra|carrito/i.test(lower)) {
      return 'PAYMENTS_FINANCE';
    }
    if (/archivo|subir|cargar|upload|pdf|imagen|documento|adjunto|tamaño/i.test(lower)) {
      return 'FILE_UPLOAD';
    }
    if (/buscar|filtro|paginaci|consulta|listar|filtrar|criterio/i.test(lower)) {
      return 'SEARCH_FILTER';
    }
    if (/crear|editar|eliminar|actualizar|crud|formulario|guardar|borrar/i.test(lower)) {
      return 'CRUD_MANAGEMENT';
    }

    return 'GENERAL';
  }

  /**
   * Genera pruebas en lenguaje 100% claro y comprensible según el tipo de pantalla o regla.
   */
  static getArchetypeCases(
    archetype: DomainArchetype,
    requirementCode: string,
    title: string
  ): RawGeneratedCase[] {
    switch (archetype) {
      case 'AUTH_SECURITY':
        return [
          {
            type: 'negative',
            title: `Seguridad: Probar que el sistema no falle si alguien escribe símbolos o códigos raros`,
            preconditions: ['El sistema y la base de datos están activos'],
            steps: [
              "Escribir texto con comillas y símbolos extraños (ej: ' OR '1'='1) en los campos de texto",
              'Presionar el botón para iniciar sesión o enviar',
            ],
            testData: "usuario: \"' OR '1'='1 --\", clave: \"<script>alert(1)</script>\"",
            expectedResult: 'El sistema procesa el texto con seguridad, rechaza el intento y no expone errores internos de programación.',
            priority: 'high',
            evidenceStatus: 'derived',
            evidenceText: 'Protección ante datos extraños o no confiables.',
          },
          {
            type: 'validation',
            title: `Seguridad: Mostrar mensaje genérico de error si la contraseña o correo no coinciden`,
            preconditions: ['Pantalla de inicio de sesión visible'],
            steps: [
              'Probar con un correo que no existe y cualquier contraseña',
              'Probar con un correo que sí existe pero con contraseña incorrecta',
              'Comparar ambos mensajes de error que muestra la pantalla',
            ],
            testData: '1) no.existe@correo.com / 2) registrado@correo.com con clave mala',
            expectedResult: 'En ambos casos el sistema responde con el mismo mensaje claro "Correo o contraseña incorrectos", para proteger la privacidad.',
            priority: 'high',
            evidenceStatus: 'derived',
            evidenceText: 'Avisos de error seguros para el usuario.',
          },
          {
            type: 'alternative',
            title: `Cierre automático: Salir de la cuenta tras varios minutos sin usar el sistema`,
            preconditions: ['El usuario ha iniciado sesión previamente'],
            steps: [
              'Dejar la aplicación inactiva hasta que expire el tiempo de sesión',
              'Intentar hacer clic en cualquier opción protegida',
            ],
            testData: 'Sesión inactiva por tiempo límite',
            expectedResult: 'El sistema protege la cuenta del usuario cerrando la sesión y pidiéndole volver a ingresar sus datos.',
            priority: 'medium',
            evidenceStatus: 'derived',
            evidenceText: 'Protección de sesión por inactividad.',
          },
        ];

      case 'PAYMENTS_FINANCE':
        return [
          {
            type: 'boundary',
            title: `Pagos: Probar que no permita pagar montos en cero (0.00) o negativos`,
            preconditions: ['Pantalla de pago lista'],
            steps: [
              'Intentar pagar un monto de 0.00 o un monto negativo como -10.00',
              'Presionar el botón de pagar',
            ],
            testData: 'monto = 0.00 o -10.00',
            expectedResult: 'El sistema avisa que el monto a pagar debe ser mayor a cero y no permite continuar.',
            priority: 'high',
            evidenceStatus: 'derived',
            evidenceText: 'Validación de montos positivos obligatorios.',
          },
          {
            type: 'negative',
            title: `Pagos: Evitar cobrar dos veces si el usuario hace doble clic rápido en Pagar`,
            preconditions: ['Pedido listo para cobrar'],
            steps: [
              'Presionar dos veces seguidas y muy rápido el botón de Confirmar Pago',
              'Revisar cuántos cobros se registraron en el sistema',
            ],
            testData: 'Dos clics rápidos consecutivos',
            expectedResult: 'El sistema procesa un solo cobro y descarta el segundo clic para evitar cobrar doble.',
            priority: 'high',
            evidenceStatus: 'derived',
            evidenceText: 'Prevención de cobros dobles accidentales.',
          },
        ];

      case 'FILE_UPLOAD':
        return [
          {
            type: 'negative',
            title: `Archivos: Probar que rechace archivos no permitidos (ejemplo: programas .exe)`,
            preconditions: ['Formulario de adjuntar archivo abierto'],
            steps: [
              'Seleccionar un archivo no permitido (ejemplo: programa.exe o script.sh)',
              'Intentar subirlo al sistema',
            ],
            testData: 'archivo_peligroso.exe',
            expectedResult: 'El sistema no permite subir el archivo y avisa amigablemente qué formatos sí están permitidos.',
            priority: 'high',
            evidenceStatus: 'derived',
            evidenceText: 'Control de formatos de archivo permitidos.',
          },
          {
            type: 'boundary',
            title: `Archivos: Probar el tamaño máximo permitido de subida`,
            preconditions: ['Límite de tamaño configurado'],
            steps: [
              'Subir un archivo con el tamaño justo en el límite máximo permitido',
              'Subir un archivo un poco más pesado que el límite',
            ],
            testData: '1) Archivo tamaño exacto / 2) Archivo que supera el límite',
            expectedResult: 'El archivo con tamaño permitido se sube bien; el archivo que supera el peso se rechaza con aviso claro.',
            priority: 'medium',
            evidenceStatus: 'derived',
            evidenceText: 'Control de tamaño de archivo.',
          },
        ];

      case 'CRUD_MANAGEMENT':
        return [
          {
            type: 'negative',
            title: `Registros: Probar qué sucede al intentar guardar un código o correo que ya existe`,
            preconditions: ['Ya existe un registro previo con ese código o correo'],
            steps: [
              'Intentar crear un nuevo registro usando el mismo código o correo que otro ya registrado',
              'Presionar Guardar',
            ],
            testData: 'Código o correo duplicado',
            expectedResult: 'El sistema no permite duplicar el registro y muestra un aviso: "Este registro ya existe, usa uno diferente".',
            priority: 'high',
            evidenceStatus: 'derived',
            evidenceText: 'Control de registros duplicados.',
          },
          {
            type: 'validation',
            title: `Texto largo: Probar qué sucede si se escribe un texto excesivamente largo`,
            preconditions: ['Formulario abierto'],
            steps: [
              'Pegar un texto de más de 1000 caracteres en un campo corto (como nombre o teléfono)',
              'Presionar Guardar',
            ],
            testData: 'Texto de más de 1000 caracteres',
            expectedResult: 'El sistema avisa que el texto es demasiado largo y pide acortarlo.',
            priority: 'medium',
            evidenceStatus: 'derived',
            evidenceText: 'Control de cantidad máxima de caracteres.',
          },
        ];

      default:
        return [];
    }
  }
}
