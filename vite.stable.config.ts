// A dev server without hot reload or file watching, for long scripted playtests while files are changing.
import { defineConfig, mergeConfig } from 'vite';
import base from './vite.config';

export default mergeConfig(
  base,
  defineConfig({
    server: { port: 5174, strictPort: true, hmr: false, watch: { ignored: ['**/*'] } },
  }),
);
