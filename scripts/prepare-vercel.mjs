import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.resolve(root, '.vercel-deploy');
if (path.dirname(destination) !== root || path.basename(destination) !== '.vercel-deploy') {
  throw new Error('Invalid deployment directory');
}
const compiled = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc'], {
  cwd: path.join(root, 'backend'), stdio: 'inherit',
});
if (compiled.status !== 0) process.exit(compiled.status || 1);
// This directory contains generated deployment files only. Never copy .env/data.
fs.mkdirSync(destination, { recursive: true });
fs.mkdirSync(path.join(destination, 'backend/prisma'), { recursive: true });
fs.cpSync(path.join(root, 'backend/dist'), path.join(destination, 'backend/dist'), { recursive: true });
fs.copyFileSync(path.join(root, 'backend/prisma/schema.prisma'), path.join(destination, 'backend/prisma/schema.prisma'));
fs.cpSync(path.join(root, 'frontend'), path.join(destination, 'public'), { recursive: true,
  filter: source => path.basename(source) !== 'package.json',
});
const backendPackage = JSON.parse(fs.readFileSync(path.join(root, 'backend/package.json'), 'utf8'));
fs.writeFileSync(path.join(destination, 'package.json'), JSON.stringify({
  name: 'testgenai-vercel', version: backendPackage.version, private: true,
  engines: { node: '22.x' },
  scripts: { build: 'prisma generate --schema backend/prisma/schema.prisma' },
  dependencies: backendPackage.dependencies,
}, null, 2));
fs.writeFileSync(path.join(destination, 'server.cjs'), `const express = require('express');
const backend = require('./backend/dist/main.js').default;
const app = express();
app.use(backend);
module.exports = app;
`);
fs.writeFileSync(path.join(destination, '.vercelignore'), 'node_modules/\n.vercel/\n.env\n.env.*\n*.log\n');
fs.writeFileSync(path.join(destination, 'vercel.json'), JSON.stringify({
  $schema: 'https://openapi.vercel.sh/vercel.json',
  framework: 'express',
  installCommand: 'npm ci',
  buildCommand: 'npm run build',
  functions: { 'server.cjs': { maxDuration: 120, includeFiles: 'public/**' } },
  headers: [{ source: '/(.*)', headers: [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'no-referrer' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'; style-src 'self' https: 'unsafe-inline'; font-src 'self' https: data:; img-src 'self' data:; frame-ancestors 'self'; object-src 'none'" },
  ] }, { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }] }],
}, null, 2));
console.log('Prepared .vercel-deploy: compiled API, public frontend and Prisma schema. No environment files or database backups copied.');
