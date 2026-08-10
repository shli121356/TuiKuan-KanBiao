import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { openFilePlugin } from './vite-plugin-open-file';

export default defineConfig({
  base: '/TuiKuan-KanBiao/',
  plugins: [react(), openFilePlugin()],
});
