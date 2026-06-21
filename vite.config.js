import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages: /OakRidgeSquadronContacts/ — override with VITE_BASE_PATH=/ for local root dev
  base: process.env.VITE_BASE_PATH || '/OakRidgeSquadronContacts/',
});
