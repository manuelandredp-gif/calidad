import {
  IAIProvider,
  AIGenerationResult,
  RawGeneratedCase,
  GenerateOptions,
} from '../interfaces/ai-provider.interface';
import { calculateAICost } from '../../config/ai-pricing';
import { CURRENT_PROMPT_VERSION } from '../prompts/prompt-builder';

export class MockAIAdapter implements IAIProvider {
  readonly providerName = 'mock' as const;

  async generateTestCases(
    requirementCode: string,
    requirementTitle: string,
    description: string,
    acceptanceCriteria: string,
    options?: GenerateOptions
  ): Promise<AIGenerationResult> {
    const startTime = Date.now();
    const model = options?.model || 'mock-istqb-v1';

    // Simulación de latencia realista de red/LLM (600 a 1100 ms)
    await new Promise((resolve) => setTimeout(resolve, 800));

    const isLogin = requirementTitle.toLowerCase().includes('sesión') || description.toLowerCase().includes('login');
    const isCoupon = requirementTitle.toLowerCase().includes('cupón') || description.toLowerCase().includes('descuento');

    let generatedCases: RawGeneratedCase[] = [];

    if (isLogin) {
      generatedCases = [
        {
          type: 'positive',
          title: 'Inicio de sesión exitoso con credenciales válidas registradas',
          preconditions: [
            'El usuario se encuentra previamente registrado en la plataforma',
            'La cuenta del usuario está en estado ACTIVA',
          ],
          steps: [
            'Navegar a la pantalla de inicio de sesión',
            'Ingresar correo electrónico válido registrado',
            'Ingresar la contraseña correcta asociada a la cuenta',
            'Hacer clic en el botón "Iniciar Sesión"',
          ],
          testData: 'email: "cliente.activo@test.com", password: "PasswordValido123*"',
          expectedResult:
            'El sistema autentica al usuario exitosamente, genera el token de sesión y redirige al Dashboard principal.',
          priority: 'high',
          evidenceStatus: 'derived',
          evidenceText: 'Si las credenciales son correctas, el sistema redirige al dashboard y genera un token de sesión.',
        },
        {
          type: 'negative',
          title: 'Intento de inicio de sesión con contraseña incorrecta',
          preconditions: ['El usuario está registrado en el sistema'],
          steps: [
            'Navegar al formulario de login',
            'Ingresar el correo registrado del usuario',
            'Ingresar una contraseña equivocada',
            'Hacer clic en "Iniciar Sesión"',
          ],
          testData: 'email: "cliente.activo@test.com", password: "PasswordErroneo999"',
          expectedResult:
            'Se deniega el acceso y se muestra el mensaje de error genérico "Credenciales inválidas" sin revelar qué campo falló.',
          priority: 'high',
          evidenceStatus: 'derived',
          evidenceText:
            'Si la contraseña es errónea, se muestra "Credenciales inválidas" sin especificar si falló el correo o la clave.',
        },
        {
          type: 'validation',
          title: 'Validación de campos obligatorios vacíos en login',
          preconditions: ['El usuario se encuentra en la pantalla de inicio de sesión'],
          steps: [
            'Dejar el campo de correo electrónico en blanco',
            'Dejar el campo de contraseña en blanco',
            'Presionar el botón "Iniciar Sesión"',
          ],
          testData: 'email: "", password: ""',
          expectedResult:
            'El formulario bloquea el envío y muestra alertas visuales de campos obligatorios requeridos.',
          priority: 'medium',
          evidenceStatus: 'derived',
          evidenceText: 'El usuario debe ingresar un correo electrónico con formato válido y contraseña.',
        },
        {
          type: 'boundary',
          title: 'Bloqueo temporal de cuenta tras alcanzar el límite de 5 intentos fallidos',
          preconditions: ['El usuario tiene 4 intentos fallidos registrados previamente'],
          steps: [
            'Ingresar el correo del usuario',
            'Ingresar una contraseña incorrecta por 5ta vez consecutiva',
            'Hacer clic en "Iniciar Sesión"',
          ],
          testData: '5 intentos erróneos consecutivos',
          expectedResult:
            'El sistema bloquea la cuenta por 15 minutos y muestra mensaje informativo de bloqueo por seguridad.',
          priority: 'high',
          evidenceStatus: 'derived',
          evidenceText: 'Tras 5 intentos fallidos consecutivos, la cuenta se bloquea temporalmente por 15 minutos.',
        },
        {
          type: 'alternative',
          title: 'Acceso mediante enlace "Olvidé mi contraseña" desde pantalla de login',
          preconditions: ['El usuario no recuerda su contraseña'],
          steps: [
            'En la pantalla de inicio de sesión, seleccionar "¿Olvidaste tu contraseña?"',
            'Ingresar el correo electrónico registrado',
            'Presionar "Enviar instrucciones"',
          ],
          testData: 'email: "cliente.activo@test.com"',
          expectedResult:
            'El sistema procesa la solicitud y envía un token seguro de restablecimiento por correo.',
          priority: 'low',
          evidenceStatus: 'suggested',
          evidenceText: 'Escenario de recuperación inferido por mejores prácticas de autenticación (no explícito en criterio).',
        },
      ];
    } else if (isCoupon) {
      generatedCases = [
        {
          type: 'positive',
          title: 'Aplicación exitosa de cupón porcentual vigente cumpliendo monto mínimo',
          preconditions: [
            'Carrito de compras con un total de S/ 100 (supera el mínimo de S/ 50)',
            'Cupón "VERANO20" activo con 20% de descuento',
          ],
          steps: [
            'Ir a la pantalla de Checkout / Carrito',
            'Ingresar el código "VERANO20" en el campo de cupón promocional',
            'Presionar el botón "Aplicar"',
          ],
          testData: 'código: "VERANO20", total original: S/ 100',
          expectedResult:
            'Se descuenta S/ 20 del total, recalculando el importe a pagar a S/ 80 en tiempo real con etiqueta de descuento.',
          priority: 'high',
          evidenceStatus: 'derived',
          evidenceText: 'Si el cupón es válido, se calcula el descuento correspondiente y se actualiza el resumen del pedido.',
        },
        {
          type: 'negative',
          title: 'Rechazo de cupón con fecha de vigencia vencida',
          preconditions: ['El cupón "EXPIRADO10" venció el día de ayer'],
          steps: [
            'Ingresar el código de cupón expirado en el carrito',
            'Hacer clic en "Aplicar"',
          ],
          testData: 'código: "EXPIRADO10"',
          expectedResult:
            'No se aplica descuento y el sistema despliega el mensaje de error "Cupón inválido o expirado".',
          priority: 'high',
          evidenceStatus: 'derived',
          evidenceText: 'Si el cupón venció o no existe, se muestra el mensaje "Cupón inválido o expirado".',
        },
        {
          type: 'boundary',
          title: 'Validación en el límite exacto del monto mínimo de compra (S/ 50.00)',
          preconditions: ['El carrito tiene productos por un valor exacto de S/ 50.00'],
          steps: [
            'Ingresar código de cupón que exige mínimo S/ 50.00',
            'Hacer clic en "Aplicar"',
          ],
          testData: 'montoCarrito: 50.00, cupón: "MINIMO50"',
          expectedResult:
            'El cupón es aceptado al cumplir la frontera mínima de compra requerida.',
          priority: 'medium',
          evidenceStatus: 'derived',
          evidenceText: 'El cupón debe cumplir con el monto mínimo de compra configurado (ej. mínimo S/ 50).',
        },
        {
          type: 'negative',
          title: 'Intento de acumular dos cupones de descuento en una misma orden',
          preconditions: ['El carrito ya tiene aplicado un cupón de 10%'],
          steps: [
            'Ingresar un segundo código de cupón promocional',
            'Hacer clic en "Aplicar"',
          ],
          testData: 'segundo cupón: "EXTRA5"',
          expectedResult:
            'El sistema rechaza la acumulación notificando que solo se permite un cupón por orden.',
          priority: 'medium',
          evidenceStatus: 'derived',
          evidenceText: 'No se permite acumular más de un cupón por orden de compra.',
        },
      ];
    } else {
      // Caso genérico contextualizado
      generatedCases = [
        {
          type: 'positive',
          title: `Ejecución estándar del flujo exitoso para ${requirementCode}`,
          preconditions: ['Datos maestros cargados y sesión de usuario activa'],
          steps: [
            'Acceder a la funcionalidad correspondiente',
            'Completar los campos requeridos con valores válidos',
            'Confirmar la acción en el sistema',
          ],
          testData: 'Entradas válidas según especificación',
          expectedResult: 'El sistema procesa la solicitud satisfactoriamente y actualiza el estado correspondiente.',
          priority: 'high',
          evidenceStatus: 'derived',
          evidenceText: description.slice(0, 100),
        },
        {
          type: 'negative',
          title: `Manejo de error ante entradas inválidas en ${requirementCode}`,
          preconditions: ['Pantalla principal cargada'],
          steps: [
            'Ingresar valores fuera de formato o vacíos',
            'Intentar procesar la acción',
          ],
          testData: 'Valores nulos o cadenas con caracteres no admitidos',
          expectedResult: 'El sistema intercepta el error, no realiza cambios en base de datos y muestra mensaje instructivo.',
          priority: 'high',
          evidenceStatus: 'derived',
          evidenceText: acceptanceCriteria.slice(0, 100),
        },
        {
          type: 'boundary',
          title: `Comprobación de límites en las fronteras de datos para ${requirementCode}`,
          preconditions: ['Configuración estándar de pruebas'],
          steps: [
            'Probar con valores en los límites mínimos y máximos tolerados',
            'Verificar el comportamiento del sistema en los extremos',
          ],
          testData: 'Límite inferior y límite superior',
          expectedResult: 'El sistema acepta los valores en el borde y rechaza inmediatamente los valores que lo exceden.',
          priority: 'medium',
          evidenceStatus: 'suggested',
          evidenceText: 'Análisis de valores frontera derivado de principios ISTQB.',
        },
      ];
    }

    const inputTokens = Math.floor(description.length * 1.5 + acceptanceCriteria.length * 1.8 + 250);
    const outputTokens = Math.floor(JSON.stringify(generatedCases).length / 3.5);
    const responseTimeMs = Date.now() - startTime;
    const estimatedCost = calculateAICost(model, inputTokens, outputTokens);

    return {
      provider: 'mock',
      model,
      promptVersion: CURRENT_PROMPT_VERSION,
      inputTokens,
      outputTokens,
      responseTimeMs,
      estimatedCost,
      cases: generatedCases,
    };
  }
}
