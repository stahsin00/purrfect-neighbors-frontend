import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      src: "/src"
    }
  },
  server: {
    port: 4000
  },
  base: 'https://github.com/stahsin00/purrfect-neighbors.git',
  build: {
    outDir: 'dist'
  }
});
