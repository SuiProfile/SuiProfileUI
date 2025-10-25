export type LinkCheckResult = {
  url: string;
  normalizedUrl: string;
  reachable: boolean;
  status?: number;
  finalUrl?: string;
  title?: string | null;
  description?: string | null;
  favicon?: string | null;
  error?: string;
  elapsedMs: number;
};

type CheckOptions = {
  timeoutMs?: number;
};

function normalizeUrl(input: string): string {
  let url = input.trim();
  // HTTP veya HTTPS ile başlıyorsa olduğu gibi döndür
  if (/^https?:\/\//i.test(url)) return url;
  // www ile başlıyorsa https ekle
  if (/^www\./i.test(url)) return `https://${url}`;
  // Sadece alan adı girdiyse https ile döndür
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(url)) return `https://${url}`;
  // Diğer durumlarda da https ile döndür
  return `https://${url}`;
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal, redirect: 'follow', mode: 'cors' });
    return res;
  } finally {
    clearTimeout(id);
  }
}

function parseHtmlMeta(html: string, baseUrl: string) {
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const description = descMatch ? descMatch[1].trim() : null;
  let favicon: string | null = null;
  const iconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  if (iconMatch) {
    const href = iconMatch[1];
    try {
      favicon = new URL(href, baseUrl).toString();
    } catch {
      favicon = null;
    }
  } else {
    try {
      const origin = new URL(baseUrl).origin;
      favicon = `${origin}/favicon.ico`;
    } catch {
      favicon = null;
    }
  }
  return { title, description, favicon };
}

export async function checkLink(url: string, opts: CheckOptions = {}): Promise<LinkCheckResult> {
  const start = performance.now();
  const normalizedUrl = normalizeUrl(url);
  const timeoutMs = opts.timeoutMs ?? 6000;
  const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.DEV;
  try {
    // In dev, use Vite proxy to avoid browser CORS
    if (isDev) {
      const endpoint = `/api/linkcheck?url=${encodeURIComponent(normalizedUrl)}`;
      const res = await fetchWithTimeout(endpoint, { method: 'GET' }, timeoutMs);
      const data = await res.json().catch(() => ({}));
      const elapsedMs = Math.round(performance.now() - start);
      // Dev proxy geri sadece reachability/status döndürüyor. Favicon için güvenli bir fallback üretelim.
      let favicon: string | null = null;
      try {
        const origin = new URL(data.finalUrl ?? normalizedUrl).origin;
        // jsdelivr favicon hizmetini kullan (çok hafif ve CORS güvenli)
        favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(origin)}&sz=64`;
      } catch {
        favicon = null;
      }
      return {
        url,
        normalizedUrl,
        reachable: !!data.reachable,
        status: data.status,
        finalUrl: data.finalUrl ?? normalizedUrl,
        title: null,
        description: null,
        favicon,
        error: data.error,
        elapsedMs
      } as LinkCheckResult;
    }

    // Try a HEAD request first
    let res: Response | null = null;
    try {
      res = await fetchWithTimeout(normalizedUrl, { method: 'HEAD' }, timeoutMs);
    } catch {
      // HEAD failed (CORS/method blocked) – fall back to GET
    }

    // If HEAD is blocked or not ok, try GET
    if (!res || (!res.ok && res.status !== 405)) {
      res = await fetchWithTimeout(normalizedUrl, { method: 'GET' }, timeoutMs);
    }

    const elapsedMs = Math.round(performance.now() - start);
    const result: LinkCheckResult = {
      url,
      normalizedUrl,
      reachable: res.ok,
      status: res.status,
      finalUrl: res.url,
      title: null,
      description: null,
      favicon: null,
      elapsedMs
    };

    const ctype = res.headers.get('content-type') || '';
    if (res.ok && /text\/html/i.test(ctype)) {
      try {
        const html = await res.text();
        const meta = parseHtmlMeta(html, res.url);
        result.title = meta.title;
        result.description = meta.description;
        result.favicon = meta.favicon;
      } catch {
        // ignore parsing errors
      }
    }
    return result;
  } catch (err: any) {
    return {
      url,
      normalizedUrl,
      reachable: false,
      error: err?.name === 'AbortError' ? 'timeout' : String(err?.message || err),
      elapsedMs: Math.round(performance.now() - start)
    };
  }
}

export default { checkLink };


