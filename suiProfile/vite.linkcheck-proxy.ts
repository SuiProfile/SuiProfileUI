// vite.linkcheck-proxy.ts
import type { Plugin } from 'vite';

export function linkCheckProxy(): Plugin {
  return {
    name: 'linkcheck-proxy',
    configureServer(server) {
      server.middlewares.use('/api/linkcheck', async (req, res) => {
        try {
          const u = new URL(req.url || '', 'http://localhost');
          const target = u.searchParams.get('url') || '';

          // Basit güvenlik: sadece http/https izin ver
          if (!/^https?:\/\//i.test(target)) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ reachable: false, error: 'invalid_protocol' }));
            return;
          }

          // Timeout destekli fetch
          const timeoutMs = 6000;
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), timeoutMs);

          let headResp: Response | null = null;
          try {
            headResp = await fetch(target, {
              method: 'HEAD',
              redirect: 'follow',
              signal: controller.signal
            } as RequestInit);
          } catch {
            // HEAD engellenirse GET'e düşeceğiz
          }

          let resp = headResp;
          if (!resp || (!resp.ok && resp.status !== 405)) {
            try {
              resp = await fetch(target, {
                method: 'GET',
                redirect: 'follow',
                signal: controller.signal
              } as RequestInit);
            } catch (e) {
              clearTimeout(id);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({
                reachable: false,
                status: undefined,
                finalUrl: target,
                error: (e as Error).name === 'AbortError' ? 'timeout' : String((e as Error).message || e)
              }));
              return;
            }
          }

          clearTimeout(id);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({
            reachable: resp.ok,
            status: resp.status,
            finalUrl: resp.url
          }));
        } catch (err) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ reachable: false, error: String((err as Error).message || err) }));
        }
      });
    }
  };
}

export default linkCheckProxy;
