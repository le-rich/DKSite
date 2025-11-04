import { defineConfig } from 'vite';

export default defineConfig({
  root: '.', 
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        careers: './src/pages/careers.html',
        games: './src/pages/games.html',
        contact: './src/pages/contact.html',
      },
    },
  },
});
