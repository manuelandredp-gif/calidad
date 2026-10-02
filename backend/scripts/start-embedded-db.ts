import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';
import fs from 'fs';

async function main() {
  const dbDir = path.resolve(__dirname, '../data/postgres');
  const isFirstTime = !fs.existsSync(dbDir);

  const pg = new EmbeddedPostgres({
    databaseDir: dbDir,
    port: 5432,
    user: 'postgres',
    password: 'postgres_password_2026',
    persistent: true,
  });

  if (isFirstTime) {
    console.log('Inicializando cluster PostgreSQL embebido...');
    await pg.initialise();
  }

  console.log('Iniciando PostgreSQL en puerto 5432...');
  await pg.start();
  console.log('PostgreSQL iniciado correctamente.');

  if (isFirstTime) {
    try {
      console.log('Creando base de datos calidad_db...');
      await pg.createDatabase('calidad_db');
      console.log('Base de datos calidad_db creada.');
    } catch (e: any) {
      console.log('Nota sobre creación de base de datos:', e.message);
    }
  }

  console.log('PG listo y escuchando en localhost:5432');
}

main().catch(console.error);
