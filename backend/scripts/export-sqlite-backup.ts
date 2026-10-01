import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function exportFullDb() {
  const users = await prisma.user.findMany();
  const projects = await prisma.project.findMany();
  const requirements = await prisma.requirement.findMany();
  const testCases = await prisma.testCase.findMany();
  const aiGenerations = await prisma.aiGeneration.findMany();
  const reviews = await prisma.testCaseReview.findMany();

  const exportData = {
    exportedAt: new Date().toISOString(),
    sourceDatabase: 'SQLite dev.db',
    counts: {
      users: users.length,
      projects: projects.length,
      requirements: requirements.length,
      testCases: testCases.length,
      aiGenerations: aiGenerations.length,
      testCaseReviews: reviews.length,
    },
    data: {
      users,
      projects,
      requirements,
      testCases,
      aiGenerations,
      reviews,
    },
  };

  const backupDir = path.resolve(__dirname, '../prisma/backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const exportPath = path.join(backupDir, 'dev-db-export.json');
  fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2), 'utf8');
  console.log(`✅ Backup JSON exportado exitosamente a: ${exportPath}`);
  console.log('Resumen exportado:', exportData.counts);

  await prisma.$disconnect();
}

exportFullDb().catch(err => {
  console.error('Error al exportar base de datos:', err);
  process.exit(1);
});
