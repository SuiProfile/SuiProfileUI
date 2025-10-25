import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from '@tailwindcss/vite'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'dev-linkcheck-proxy',
      apply: 'serve',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          try {
            if (!req.url) return next();
            const u = new URL(req.url, "http://localhost");
            if (u.pathname !== "/api/linkcheck") return next();

            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type");
            if (req.method === "OPTIONS") { res.statusCode = 204; res.end(); return; }

            const target = u.searchParams.get("url");
            if (!target) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Missing url" }));
              return;
            }

            const timeoutMs = 6000;
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeoutMs);
            let r: Response | null = null;
            try {
              r = await fetch(target, { method: "HEAD", redirect: "follow", signal: controller.signal });
            } catch {}
            if (!r || (!r.ok && r.status !== 405)) {
              r = await fetch(target, { method: "GET", redirect: "follow", signal: controller.signal });
            }
            clearTimeout(id);

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ reachable: r.ok, status: r.status, finalUrl: r.url }));
          } catch (e: any) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ reachable: false, error: String(e?.message || e) }));
          }
        });
      }
    }
  ],
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
