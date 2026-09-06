import { cpSync, rmSync, existsSync } from 'node:fs';
if (!existsSync('apps/web/out/index.html')) throw new Error('Static export is missing');
rmSync('out', { recursive: true, force: true });
cpSync('apps/web/out', 'out', { recursive: true });
