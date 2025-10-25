import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from '@tailwindcss/vite'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Aynı modül ikinci kez prebundle edilmesin:
    dedupe: [
      "react",
      "react-dom",
      "@primereact/core",
      "@primereact/core/config"
    ],
    alias: {
      // Bazı durumlarda adlar farklı çözülebiliyor; alias tekleşmeye yardım eder
      "primereact/button": "primereact/button",
      "primereact/avatar": "primereact/avatar",
      "@primereact/core/config": "@primereact/core/config"
    }
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@primereact/core/config"
    ]
  }
});
