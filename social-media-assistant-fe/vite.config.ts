import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'; // Use Vite plugin

export default defineConfig({
  plugins: [
    react(),
    tailwindcss() // Add this
  ],
});
