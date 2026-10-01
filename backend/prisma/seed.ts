import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando siembra de base de datos...');

  // 1. Limpiar datos existentes de forma ordenada
  await prisma.testCaseReview.deleteMany();
  await prisma.aiGeneration.deleteMany();
  await prisma.testCase.deleteMany();
  await prisma.requirement.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // 2. Crear Usuarios por defecto
  const passwordHash = await bcrypt.hash('Admin123*TestGenAI', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@testgenai.com',
      fullName: 'Administrador Principal',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const qaTester = await prisma.user.create({
    data: {
      email: 'qa.tester@testgenai.com',
      fullName: 'Analista QA Senior',
      passwordHash,
      role: 'QA_TESTER',
    },
  });

  console.log(`✅ Usuarios creados: ${admin.email} (ADMIN), ${qaTester.email} (QA_TESTER)`);

  // 3. Crear Proyecto Demo
  const demoProject = await prisma.project.create({
    data: {
      name: 'Portal E-Commerce & Checkout v2.0',
      description: 'Plataforma web de comercio electrónico con pasarela de pagos y gestión de pedidos.',
      ownerId: admin.id,
      status: 'ACTIVE',
    },
  });

  console.log(`✅ Proyecto Demo creado: ${demoProject.name}`);

  // 4. Crear Requisitos Iniciales
  const req1 = await prisma.requirement.create({
    data: {
      projectId: demoProject.id,
      code: 'REQ-001',
      title: 'Inicio de Sesión de Clientes con Email y Contraseña',
      description: 'Como cliente registrado, deseo iniciar sesión mediante correo electrónico y contraseña para acceder a mi historial de compras y realizar pedidos.',
      acceptanceCriteria: `1. El usuario debe ingresar un correo electrónico con formato válido y registrado.
2. La contraseña debe tener al menos 8 caracteres y coincidir con la registrada.
3. Si las credenciales son correctas, el sistema redirige al dashboard y genera un token de sesión.
4. Si la contraseña es errónea, se muestra "Credenciales inválidas" sin especificar si falló el correo o la clave.
5. Tras 5 intentos fallidos consecutivos, la cuenta se bloquea temporalmente por 15 minutos.`,
      version: 1,
      status: 'READY_FOR_AI',
    },
  });

  const req2 = await prisma.requirement.create({
    data: {
      projectId: demoProject.id,
      code: 'REQ-002',
      title: 'Aplicación de Cupón de Descuento en Carrito',
      description: 'Como comprador, deseo ingresar un código de cupón promocional en el carrito de compras para obtener un descuento porcentual sobre el total de la compra antes de impuestos.',
      acceptanceCriteria: `1. El cupón debe existir en el sistema y estar dentro de su fecha de vigencia.
2. El cupón debe cumplir con el monto mínimo de compra configurado (ej. mínimo S/ 50).
3. No se permite acumular más de un cupón por orden de compra.
4. Si el cupón es válido, se calcula el descuento correspondiente y se actualiza el resumen del pedido en tiempo real.
5. Si el cupón venció o no existe, se muestra el mensaje "Cupón inválido o expirado".`,
      version: 1,
      status: 'READY_FOR_AI',
    },
  });

  const req3 = await prisma.requirement.create({
    data: {
      projectId: demoProject.id,
      code: 'REQ-003',
      title: 'Transferencia de Fondos entre Cuentas Propias',
      description: 'Como usuario bancario, deseo transferir dinero entre mis cuentas de ahorros y corriente de manera inmediata.',
      acceptanceCriteria: `Escenario: Transferencia exitosa con saldo suficiente
Dado que el cliente tiene una cuenta de ahorros con saldo de S/ 500.00
Y tiene una cuenta corriente activa
Cuando solicita transferir S/ 200.00 a su cuenta corriente
Entonces el sistema debita S/ 200.00 de la cuenta de ahorros
Y acredita S/ 200.00 en la cuenta corriente
Y emite un comprobante con código de operación

Escenario: Rechazo por saldo insuficiente en cuenta origen
Dado que la cuenta de ahorros tiene saldo de S/ 50.00
Cuando intenta transferir S/ 100.00
Entonces el sistema rechaza la operación con el mensaje "Saldo insuficiente"
Y no realiza ningún débito en la cuenta`,
      version: 1,
      status: 'READY_FOR_AI',
    },
  });

  console.log(`✅ Requisitos creados: ${req1.code}, ${req2.code} y ${req3.code} (con BDD/Gherkin)`);
  console.log('✨ Siembra completada con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
