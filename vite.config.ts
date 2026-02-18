import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        open: true,
    },
    build: {
        rollupOptions: {
            input: ['index.html', 'vm.html'],
        },
    },
});
