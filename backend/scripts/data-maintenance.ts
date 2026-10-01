/**
 * TestGenAI - Comando de Mantenimiento y Limpieza de Demos
 *
 * Modo por defecto: --dry-run (SOLO SIMULACIÓN, no modifica la base de datos).
 * Para aplicar los cambios reales:
 *   npx tsx scripts/data-maintenance.ts --execute
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_MANIFEST = {
  userIds: ['0e233115-932d-4f2f-ac16-2039a9f88048'], // admin@testgenai.com (seed demo)
  projectIds: ['b036dd62-a6ce-4dd1-95c9-657f9a561a66'], // Portal E-Commerce & Checkout v2.0
  requirementIds: [
    '7a97a9d1-3a7e-4c53-9b5d-7114bd72dc75', // REQ-001
    'e795cc74-f6e7-44e4-aeaf-388f284f757e', // REQ-002
    '51954b78-0a32-4526-85a8-28acabac261e', // REQ-003
  ],
};

async function main() {
  const isExecute = process.argv.includes('--execute') || process.argv.includes('--apply');
  const mode = isExecute ? 'EJECUCIÓN REAL (--execute)' : 'MODO SEGURO / SIMULACIÓN (--dry-run)';

  console.log(`\n======================================================`);
  console.log(`  TestGenAI - Mantenimiento de Datos y Depuración Demo`);
  console.log(`  Modo: ${mode}`);
  console.log(`======================================================\n`);

  try {
    const totalUsers = await prisma.user.count();
    const totalProjects = await prisma.project.count();
    const totalRequirements = await prisma.requirement.count();
    const totalTestCases = await prisma.testCase.count();
    const totalGenerations = await prisma.aiGeneration.count();
    const totalReviews = await prisma.testCaseReview.count();

    console.log('📊 Estado actual de la base de datos:');
    console.log(`   - Usuarios:        ${totalUsers}`);
    console.log(`   - Proyectos:       ${totalProjects}`);
    console.log(`   - Requisitos:      ${totalRequirements}`);
    console.log(`   - Casos de prueba: ${totalTestCases}`);
    console.log(`   - Generaciones IA: ${totalGenerations}`);
    console.log(`   - Revisiones:      ${totalReviews}\n`);

    // Inspeccionar registros demo detectados
    const demoUsers = await prisma.user.findMany({
      where: { id: { in: DEMO_MANIFEST.userIds } },
      select: { id: true, email: true, fullName: true },
    });

    const demoProjects = await prisma.project.findMany({
      where: { id: { in: DEMO_MANIFEST.projectIds } },
      select: { id: true, name: true, ownerId: true },
    });

    const demoReqs = await prisma.requirement.findMany({
      where: { id: { in: DEMO_MANIFEST.requirementIds } },
      select: { id: true, code: true, title: true, projectId: true },
    });

    // Casos asociados a los requisitos demo
    const demoCases = await prisma.testCase.findMany({
      where: { requirementId: { in: DEMO_MANIFEST.requirementIds } },
      select: { id: true, code: true },
    });
    const demoCaseIds = demoCases.map((c) => c.id);

    // Revisiones asociadas a los casos demo
    const demoReviews = await prisma.testCaseReview.findMany({
      where: { testCaseId: { in: demoCaseIds } },
      select: { id: true },
    });

    // Generaciones mock
    const mockGenerations = await prisma.aiGeneration.findMany({
      where: {
        OR: [
          { provider: 'mock' },
          { requirementId: { in: DEMO_MANIFEST.requirementIds } },
        ],
      },
      select: { id: true, provider: true, model: true },
    });

    console.log('🔍 Elementos de muestra identificados para limpieza:');
    console.log(`   - Usuarios Demo:      ${demoUsers.length} (${demoUsers.map((u) => u.email).join(', ') || 'Ninguno'})`);
    console.log(`   - Proyectos Demo:     ${demoProjects.length} (${demoProjects.map((p) => p.name).join(', ') || 'Ninguno'})`);
    console.log(`   - Requisitos Demo:    ${demoReqs.length} (${demoReqs.map((r) => r.code).join(', ') || 'Ninguno'})`);
    console.log(`   - Casos de prueba:    ${demoCases.length}`);
    console.log(`   - Revisiones Demo:    ${demoReviews.length}`);
    console.log(`   - Generaciones Mock:  ${mockGenerations.length}\n`);

    // Comprobación de registros ambiguos (que se conservarán y reportan)
    const otherUsers = await prisma.user.findMany({
      where: { id: { notIn: DEMO_MANIFEST.userIds } },
      select: { id: true, email: true, fullName: true },
    });
    const otherProjects = await prisma.project.findMany({
      where: { id: { notIn: DEMO_MANIFEST.projectIds } },
      select: { id: true, name: true, ownerId: true },
    });

    if (otherUsers.length > 0 || otherProjects.length > 0) {
      console.log('🛡️  Registros ambiguos / de usuario preservados intactos:');
      otherUsers.forEach((u) => console.log(`   - Usuario preservado: ${u.email} (${u.fullName})`));
      otherProjects.forEach((p) => console.log(`   - Proyecto preservado: ${p.name} (ID: ${p.id})`));
      console.log('');
    }

    if (!isExecute) {
      console.log('ℹ️  SIMULACIÓN COMPLETADA (--dry-run). No se modificó ningún registro.');
      console.log('   Para aplicar la limpieza ejecute:');
      console.log('   npx tsx scripts/data-maintenance.ts --execute\n');
      return;
    }

    // Ejecución transaccional atómica en orden de claves foráneas
    console.log('⚡ Aplicando eliminación transaccional segura...');
    await prisma.$transaction(async (tx) => {
      // 1. Revisiones de casos demo
      if (demoReviews.length > 0) {
        await tx.testCaseReview.deleteMany({
          where: { id: { in: demoReviews.map((r) => r.id) } },
        });
      }

      // 2. Generaciones mock identificadas
      if (mockGenerations.length > 0) {
        await tx.aiGeneration.deleteMany({
          where: { id: { in: mockGenerations.map((g) => g.id) } },
        });
      }

      // 3. Casos demo
      if (demoCaseIds.length > 0) {
        await tx.testCase.deleteMany({
          where: { id: { in: demoCaseIds } },
        });
      }

      // 4. Requisitos demo
      if (demoReqs.length > 0) {
        await tx.requirement.deleteMany({
          where: { id: { in: DEMO_MANIFEST.requirementIds } },
        });
      }

      // 5. Proyectos demo
      if (demoProjects.length > 0) {
        await tx.project.deleteMany({
          where: { id: { in: DEMO_MANIFEST.projectIds } },
        });
      }

      // 6. Usuarios demo sin proyectos activos
      if (demoUsers.length > 0) {
        await tx.user.deleteMany({
          where: { id: { in: DEMO_MANIFEST.userIds } },
        });
      }
    });

    console.log('✅ Eliminación transaccional completada con éxito.\n');

    const afterUsers = await prisma.user.count();
    const afterProjects = await prisma.project.count();
    const afterRequirements = await prisma.requirement.count();
    const afterTestCases = await prisma.testCase.count();

    console.log('📊 Estado de la base de datos tras la limpieza:');
    console.log(`   - Usuarios:        ${afterUsers}`);
    console.log(`   - Proyectos:       ${afterProjects}`);
    console.log(`   - Requisitos:      ${afterRequirements}`);
    console.log(`   - Casos de prueba: ${afterTestCases}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('❌ Error en comando de mantenimiento:', err);
  process.exit(1);
});
