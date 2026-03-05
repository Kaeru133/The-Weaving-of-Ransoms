import { defineConfig } from 'vite';

export default defineConfig({
    // Base should be your repository name for GitHub Pages to work correctly
    base: '/Game-1/',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
    },
    server: {
        port: 3000,
        open: true
    }
});
