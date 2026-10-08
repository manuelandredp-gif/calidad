const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { PrismaClient } = require('@prisma/client');
const root = path.resolve(__dirname, '..');
const migration = '20261008000000_project_spec';
function run(args) {
  const result = spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), ...args], {
    cwd: root, env: process.env, stdio: 'inherit',
  });
  if (result.status !== 0) throw new Error(`Prisma ${args[0]} ${args[1]} failed`);
}
async function main() {
  const prisma = new PrismaClient({ datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } } });
  let failed;
  try {
    failed = await prisma.$queryRaw`SELECT migration_name, logs FROM "_prisma_migrations" WHERE finished_at IS NULL AND rolled_back_at IS NULL AND logs IS NOT NULL`;
  } catch (error) {
    // A fresh database has no migration metadata yet.
    if (error.code !== 'P2010' || error.meta?.code !== '42P01') throw error;
    failed = [];
  } finally {
    await prisma.$disconnect();
  }
  if (failed.length > 0) {
    if (failed.length !== 1 || failed[0].migration_name !== migration ||
        !/42701/.test(failed[0].logs || '') || !/next_use_case_number/.test(failed[0].logs || '')) {
      throw new Error('An unrelated failed migration requires manual review');
    }
    console.log('Reconciling pre-existing specification columns using the additive migration');
    run(['db', 'execute', '--file', `prisma/migrations/${migration}/migration.sql`, '--schema', 'prisma/schema.prisma']);
    run(['migrate', 'resolve', '--applied', migration]);
  }
  run(['migrate', 'deploy']);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
