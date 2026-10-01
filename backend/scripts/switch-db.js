/**
 * TestGenAI - Utilidad para alternar motor de base de datos entre SQLite y PostgreSQL
 * Uso:
 *   node scripts/switch-db.js postgres
 *   node scripts/switch-db.js sqlite
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const target = process.argv[2]?.toLowerCase();
if (!target || !['postgres', 'postgresql', 'sqlite'].includes(target)) {
  console.log('\n❌ Uso incorrecto. Especifica el motor:');
  console.log('   node scripts/switch-db.js postgres');
  console.log('   node scripts/switch-db.js sqlite\n');
  process.exit(1);
}

const isPostgres = target === 'postgres' || target === 'postgresql';
const prismaSchemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
const envPath = path.resolve(__dirname, '../.env');

// 1. Modificar schema.prisma
let schemaContent = fs.readFileSync(prismaSchemaPath, 'utf8');
if (isPostgres) {
  schemaContent = schemaContent.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');
} else {
  schemaContent = schemaContent.replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"');
}
fs.writeFileSync(prismaSchemaPath, schemaContent, 'utf8');
console.log(`✅ schema.prisma configurado con provider = "${isPostgres ? 'postgresql' : 'sqlite'}"`);

// 2. Actualizar .env
if (fs.existsSync(envPath)) {
  let envContent = fs.readFileSync(envPath, 'utf8');
  if (isPostgres) {
    if (!envContent.includes('postgresql://') && !envContent.includes('postgres://')) {
      envContent = envContent.replace(
        /DATABASE_URL=.*/,
        'DATABASE_URL="postgresql://postgres:postgres_password_2026@localhost:5432/calidad_db?schema=public"'
      );
    }
  } else {
    envContent = envContent.replace(/DATABASE_URL=.*/, 'DATABASE_URL="file:./dev.db"');
  }
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log(`✅ .env actualizado con DATABASE_URL`);
}

// 3. Re-generar Prisma Client
console.log('🔄 Re-generando Prisma Client...');
try {
  execSync('npx prisma generate', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
  console.log(`\n🎉 Motor de base de datos cambiado exitosamente a ${isPostgres ? 'PostgreSQL' : 'SQLite'}!\n`);
  if (isPostgres) {
    console.log('📌 Próximos pasos si usas Docker:');
    console.log('   1. docker compose up -d');
    console.log('   2. npx prisma db push\n');
  }
} catch (e) {
  console.error('⚠️  Advertencia al regenerar Prisma Client:', e.message);
}
