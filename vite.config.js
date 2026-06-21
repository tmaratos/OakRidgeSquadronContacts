import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Use VITE_BASE_PATH=/OakRidgeSquadronContacts/ for GitHub Pages; defaults to / for Firebase Hosting
  base: process.env.VITE_BASE_PATH || '/',
});
