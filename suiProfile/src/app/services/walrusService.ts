export class WalrusService {
  constructor(
    private aggregatorBaseUrl: string, // e.g. https://aggregator.walrus-testnet.walrus.space/v1
    private uploadUrl: string, // e.g. https://aggregator.walrus-testnet.walrus.space/v1/store
  ) {}

  buildUrl(cid: string): string {
    const base = this.aggregatorBaseUrl.replace(/\/$/, "");
    return `${base}/${cid}`;
  }

  async upload(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);

    const res = await fetch(this.uploadUrl, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Walrus upload failed: ${res.status} ${text}`);
    }

    // Try to parse common shapes
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json().catch(() => ({}));
      // common keys: content_id, id, cid
      const cid = data.content_id || data.id || data.cid;
      if (!cid || typeof cid !== "string") {
        throw new Error("Walrus upload: CID not found in response");
      }
      return cid;
    }

    // Fallback: plain text body contains CID
    const text = await res.text();
    const cid = text.trim();
    if (!cid) throw new Error("Walrus upload: empty response");
    return cid;
  }
}


