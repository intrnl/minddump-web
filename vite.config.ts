import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
	build: {
		minify: 'terser',
	},
	server: {
		headers: {
			'cross-origin-embedder-policy': 'require-corp',
			'cross-origin-opener-policy': 'same-origin',
		},
	},
	optimizeDeps: {
		exclude: ['@sqlite.org/sqlite-wasm'],
	},
	plugins: [react()],
});
