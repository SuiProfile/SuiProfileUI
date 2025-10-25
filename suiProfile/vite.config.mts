import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { linkCheckProxy } from './vite.linkcheck-proxy';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), linkCheckProxy()],
});