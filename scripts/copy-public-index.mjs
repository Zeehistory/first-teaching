import fs from 'fs';
import path from 'path';

const root = process.cwd();
const src = path.join(root, 'dist', 'public', 'index.html');
const destDir = path.join(root, 'api', '_public');
const dest = path.join(destDir, 'index.html');

if (!fs.existsSync(src)) {
  console.error('[copy-public-index] Source not found:', src);
  process.exit(0);
}

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log('[copy-public-index] Copied index.html to', dest);

