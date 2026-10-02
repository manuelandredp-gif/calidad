import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
// Provenance: the legacy export and the removed seed-from-backup script.
const demoUserIds = ['0e233115-932d-4f2f-ac16-2039a9f88048', '0571e85c-ccdf-4ddf-a187-55e0c39161ff', '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d'];
const demoProjectIds = ['b036dd62-a6ce-4dd1-95c9-657f9a561a66', '75259920-6d1b-46b9-9fce-27c6691be926'];

async function main() {
  const apply = process.argv.includes('--apply') || process.argv.includes('--execute');
  await prisma.$transaction(async (tx) => {
    const projects = await tx.project.findMany({ where: { id: { in: demoProjectIds } } });
    const requirements = await tx.requirement.findMany({ where: { projectId: { in: demoProjectIds } } });
    const generations = await tx.aiGeneration.findMany({ where: { OR: [{ requirementId: { in: requirements.map(r => r.id) } }, { provider: 'mock' }, { model: { startsWith: 'mock-' } }, { model: 'fallback-heuristic-engine' }] } });
    const cases = await tx.testCase.findMany({ where: { OR: [{ requirementId: { in: requirements.map(r => r.id) } }, { generationId: { in: generations.map(g => g.id) } }] } });
    const reviews = await tx.testCaseReview.findMany({ where: { testCaseId: { in: cases.map(c => c.id) } } });
    const runs = await tx.testRun.findMany({ where: { projectId: { in: demoProjectIds } } });
    const executions = await tx.testExecutionResult.findMany({ where: { OR: [{ testRunId: { in: runs.map(r => r.id) } }, { testCaseId: { in: cases.map(c => c.id) } }] } });
    const users = await tx.user.findMany({ where: { id: { in: demoUserIds } } });
    const sessions = await tx.authSession.findMany({ where: { userId: { in: demoUserIds } } });
    const versions = await tx.requirementVersion.findMany({ where: { requirementId: { in: requirements.map(r => r.id) } } });
    const data = { users, projects, requirements, cases, generations, reviews, runs, executions, sessions, versions };
    console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', counts: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length])) }, null, 2));
    if (!apply) return;
    const unrelatedProjects = await tx.project.count({ where: { ownerId: { in: demoUserIds }, id: { notIn: demoProjectIds } } });
    const unrelatedReviews = await tx.testCaseReview.count({ where: { reviewerId: { in: demoUserIds }, testCaseId: { notIn: cases.map(c => c.id) } } });
    if (unrelatedProjects || unrelatedReviews) throw new Error('Las cuentas demo tienen contenido ajeno al manifiesto. Revise su propiedad antes de eliminarlas.');
    const directory = path.resolve(__dirname, '../data/audit');
    fs.mkdirSync(directory, { recursive: true });
    const backup = path.join(directory, `cleanup-${Date.now()}.json`);
    fs.writeFileSync(backup, JSON.stringify({ timestamp: new Date().toISOString(), data }, null, 2), { flag: 'wx', mode: 0o600 });
    console.log(`Respaldo local excluido del entregable: ${backup}`);
    await tx.testExecutionResult.deleteMany({ where: { id: { in: executions.map(e => e.id) } } });
    await tx.testCase.deleteMany({ where: { id: { in: cases.map(c => c.id) } } });
    await tx.aiGeneration.deleteMany({ where: { id: { in: generations.map(g => g.id) } } });
    await tx.project.deleteMany({ where: { id: { in: demoProjectIds } } });
    await tx.user.deleteMany({ where: { id: { in: demoUserIds } } });
    console.log('Limpieza completada. Los registros fuera del manifiesto se conservan.');
  }, { timeout: 30000 });
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
