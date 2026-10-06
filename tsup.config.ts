import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    target: 'es2020',
    treeshake: true,
  },
  {
    // Bản dùng trực tiếp qua <script> (CDN): window.N2Cur
    entry: { n2cur: 'src/index.ts' },
    format: ['iife'],
    globalName: 'N2Cur',
    minify: true,
    sourcemap: true,
    target: 'es2020',
  },
]);
