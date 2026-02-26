import { defineConfig } from 'vite';

export default defineConfig({
    // Set base to './' so it works on GitHub Pages in subfolders
    base: './',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
    },
    server: {
        port: 3000,
        open: true
    }
});
