#!/usr/bin/env node
const { build } = require('esbuild');

build({
  entryPoints: ['src/content/index.ts', 'src/timechimp.ts'],
  outdir: 'build',
  minify: true,
  bundle: true,
  sourcemap: true,
}).catch(() => process.exit(1));
