import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = new URL(process.argv[2] || '');
if (origin.protocol !== 'https:' || !origin.hostname.endsWith('.onrender.com') || origin.pathname !== '/' || origin.username || origin.password || origin.search || origin.hash) {
  throw new Error('Provide the HTTPS origin of the Render backend');
}
const destination = path.join(root, '.vercel-frontend');
fs.mkdirSync(destination, { recursive: true });
fs.cpSync(path.join(root, 'frontend'), path.join(destination, 'public'), {
  recursive: true, filter: source => path.basename(source) !== 'package.json',
});
fs.writeFileSync(path.join(destination, '.vercelignore'), '.vercel/\n.env\n.env.*\nnode_modules/\n');
fs.writeFileSync(path.join(destination, 'vercel.json'), JSON.stringify({
  $schema: 'https://openapi.vercel.sh/vercel.json',
  framework: null, buildCommand: '', installCommand: '', outputDirectory: 'public',
  rewrites: [{ source: '/api/:path*', destination: `${origin.origin}/api/:path*` }],
  headers: [
    { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
    { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }] },
    { source: '/(.*)', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'; style-src 'self' https: 'unsafe-inline'; font-src 'self' https: data:; img-src 'self' data:; frame-ancestors 'self'; object-src 'none'" },
    ] },
  ],
}, null, 2));
console.log('Prepared static frontend with API proxy to ' + origin.origin);
