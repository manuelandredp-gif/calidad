import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  const projects = await prisma.project.findMany();
  const requirements = await prisma.requirement.findMany();
  const testCases = await prisma.testCase.findMany();
  const generations = await prisma.aiGeneration.findMany();
  const reviews = await prisma.testCaseReview.findMany();

  console.log('=== USERS ===');
  console.log(users.map(u => ({ id: u.id, email: u.email, role: u.role, fullName: u.fullName })));

  console.log('=== PROJECTS ===');
  console.log(projects.map(p => ({ id: p.id, name: p.name, ownerId: p.ownerId, status: p.status })));

  console.log('=== REQUIREMENTS ===');
  console.log(requirements.map(r => ({ id: r.id, projectId: r.projectId, code: r.code, title: r.title, version: r.version, status: r.status })));

  console.log(`=== TEST CASES (Total: ${testCases.length}) ===`);
  const sources = testCases.reduce((acc: any, tc) => {
    acc[tc.source] = (acc[tc.source] || 0) + 1;
    return acc;
  }, {});
  console.log('Test cases by source:', sources);

  console.log(`=== GENERATIONS (Total: ${generations.length}) ===`);
  console.log(generations.map(g => ({
    id: g.id,
    requirementId: g.requirementId,
    provider: g.provider,
    model: g.model,
    inputTokens: g.inputTokens,
    outputTokens: g.outputTokens,
    estimatedCost: g.estimatedCost,
    responseTimeMs: g.responseTimeMs,
    createdAt: g.createdAt
  })));

  console.log(`=== REVIEWS (Total: ${reviews.length}) ===`);
  console.log(reviews.map(r => ({ id: r.id, testCaseId: r.testCaseId, decision: r.decision })));

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
