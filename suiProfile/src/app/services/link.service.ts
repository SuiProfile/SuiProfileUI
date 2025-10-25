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

function nowMs(): number {
  // performance.now() yoksa güvenli fallback
  try {
    return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
  } catch {
    return Date.now();
  }
}

function normalizeUrl(input: string): string {
  let url = input.trim();

  // Kullanıcı zaten bir şema yazdıysa dokunma (http/https dışı olabilir – sonra filtreleyeceğiz)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(url)) return url;

  // www ile başlıyorsa https ekle
  if (/^www\./i.test(url)) return `https://${url}`;

  // alanadı.tld[/...] kalıbı
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(url)) return `https://${url}`;

  // Diğer durumlarda da https ile deneriz
  return `https://${url}`;
}

function isHttpLike(u: string): boolean {
  try {
    const p = new URL(u).protocol;
    return p === 'http:' || p === 'https:';
  } catch {
    return false;
  }
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(input, {
      ...init,
      signal: controller.signal,
      redirect: 'follow',
      mode: 'cors',
      headers: {
        // meta okuma ihtimali için nazik Accept
        Accept: 'text/html,application/xhtml+xml,*/*;q=0.9',
        ...(init.headers || {}),
      },
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}

// İlk 64KB'ı ayıkla (meta/head çoğu zaman yeter)
async function readHeadChunk(res: Response, limit = 64 * 1024): Promise<string> {
  try {
    const reader = res.body?.getReader?.();
    if (!reader) return await res.text();
    const chunks: Uint8Array[] = [];
    let received = 0;
    while (received < limit) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      const take = value.subarray(0, Math.max(0, Math.min(value.length, limit - received)));
      chunks.push(take);
      received += take.length;
      if (received >= limit) break;
    }
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(concatUint8(chunks));
  } catch {
    return await res.text();
  }
}

function concatUint8(arrays: Uint8Array[]) {
  const total = arrays.reduce((a, b) => a + b.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

// OG/Twitter ve klasik meta parse
function parseHtmlMeta(html: string, baseUrl: string) {
  // yalnızca head kısmını parse etmeye çalış (performans)
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const head = headMatch ? headMatch[1] : html;

  const pickMeta = (re: RegExp) => {
    const m = head.match(re);
    return m ? m[1].trim() : null;
  };

  // Title öncelik: og:title > twitter:title > <title>
  const ogTitle = pickMeta(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const twTitle = pickMeta(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const titleTag = pickMeta(/<title>([^<]*)<\/title>/i);
  const title = ogTitle || twTitle || titleTag;

  // Description öncelik: og:description > twitter:description > name="description"
  const ogDesc = pickMeta(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const twDesc = pickMeta(/<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const descTag = pickMeta(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const description = ogDesc || twDesc || descTag;

  // Favicon: icon | shortcut icon | apple-touch-icon
  let favicon: string | null = null;
  const iconMatch = head.match(
    /<link[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["'][^>]*>/i
  );
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

function googleFaviconFrom(urlLike: string): string | null {
  try {
    const u = new URL(urlLike);
    // domain paramı domain kökeni ile çalışır (protokolsüz de kabul ediyor ama güvenli olsun)
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(u.hostname)}&sz=64`;
  } catch {
    return null;
  }
}

export async function checkLink(url: string, opts: CheckOptions = {}): Promise<LinkCheckResult> {
  const start = nowMs();
  const normalizedUrl = normalizeUrl(url);
  const timeoutMs = opts.timeoutMs ?? 6000;

  // Yalnız http/https izin
  if (!isHttpLike(normalizedUrl)) {
    return {
      url,
      normalizedUrl,
      reachable: false,
      error: 'unsupported_protocol',
      elapsedMs: Math.round(nowMs() - start),
    } as LinkCheckResult;
  }

  const isDev =
    typeof import.meta !== 'undefined' &&
    (import.meta as any).env &&
    (import.meta as any).env.DEV;

  try {
    if (isDev) {
      const endpoint = `/api/linkcheck?url=${encodeURIComponent(normalizedUrl)}`;
      const res = await fetchWithTimeout(endpoint, { method: 'GET' }, timeoutMs);
      const data: any = await res.json().catch(() => ({}));
      const elapsedMs = Math.round(nowMs() - start);

      let favicon = googleFaviconFrom(data.finalUrl ?? normalizedUrl);

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
        elapsedMs,
      } as LinkCheckResult;
    }

    let res: Response | null = null;
    let usedUrl = normalizedUrl;

    // 1) HEAD
    try {
      res = await fetchWithTimeout(usedUrl, { method: 'HEAD' }, timeoutMs);
    } catch {
      // yut
    }

    // 2) GET fallback (405 dahil)
    if (!res || (!res.ok && res.status !== 405)) {
      res = await fetchWithTimeout(usedUrl, { method: 'GET' }, timeoutMs);
    }

    // 3) HTTPS hata ise ve kullanıcı şema yazmadıysa bir kere HTTP dene
    if ((!res || !res.ok) && !/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(url)) {
      try {
        const httpUrl = usedUrl.replace(/^https:/i, 'http:');
        if (httpUrl !== usedUrl) {
          usedUrl = httpUrl;
          // tekrar HEAD→GET
          try {
            res = await fetchWithTimeout(usedUrl, { method: 'HEAD' }, timeoutMs);
          } catch {}
          if (!res || (!res.ok && res.status !== 405)) {
            res = await fetchWithTimeout(usedUrl, { method: 'GET' }, timeoutMs);
          }
        }
      } catch {
        // yut
      }
    }

    const elapsedMs = Math.round(nowMs() - start);

    const result: LinkCheckResult = {
      url,
      normalizedUrl: usedUrl, // son denenen normalized
      reachable: !!res && res.ok,
      status: res?.status,
      finalUrl: res?.url,
      title: null,
      description: null,
      favicon: null,
      elapsedMs,
    } as LinkCheckResult;

    const ctype = res?.headers?.get?.('content-type') || '';
    if (res && res.ok && /text\/html/i.test(ctype)) {
      try {
        const html = await readHeadChunk(res);
        const meta = parseHtmlMeta(html, res.url);
        result.title = meta.title;
        result.description = meta.description;
        result.favicon = meta.favicon || googleFaviconFrom(res.url);
      } catch {
        // parsing hatalarını yut
        result.favicon = result.favicon || googleFaviconFrom(res.url || usedUrl);
      }
    } else {
      // HTML değilse de favicon için domain tabanlı güvenli fallback
      result.favicon = googleFaviconFrom(res?.url || usedUrl);
    }

    return result;
  } catch (err: any) {
    return {
      url,
      normalizedUrl,
      reachable: false,
      error: err?.name === 'AbortError' ? 'timeout' : String(err?.message || err),
      elapsedMs: Math.round(nowMs() - start),
    } as LinkCheckResult;
  }
}

export default { checkLink };
