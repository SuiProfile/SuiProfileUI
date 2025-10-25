export class WalrusService {
  private publisherUrls: string[];
  private aggregatorUrls: string[];
  private currentPublisherIndex: number = 0;
  private currentAggregatorIndex: number = 0;

  constructor(publisherUrls: string[], aggregatorUrls: string[]) {
    this.publisherUrls = publisherUrls;
    this.aggregatorUrls = aggregatorUrls;
    console.log("🔧 WalrusService initialized:", {
      publisherUrls: this.publisherUrls,
      aggregatorUrls: this.aggregatorUrls
    });
  }

  buildUrl(cid: string): string {
    const baseUrl = this.aggregatorUrls[this.currentAggregatorIndex];
    const base = baseUrl.replace(/\/$/, "");
    return `${base}/v1/blobs/${cid}`;
  }

  private getCurrentUploadUrl(): string {
    const baseUrl = this.publisherUrls[this.currentPublisherIndex];
    const base = baseUrl.replace(/\/$/, "");
    return `${base}/v1/blobs?epochs=5`;
  }

  private async tryNextPublisher(): Promise<boolean> {
    this.currentPublisherIndex++;
    if (this.currentPublisherIndex >= this.publisherUrls.length) {
      this.currentPublisherIndex = 0;
      return false;
    }
    console.log(`🔄 Trying next Walrus Publisher: ${this.publisherUrls[this.currentPublisherIndex]}`);
    return true;
  }

  async upload(file: File): Promise<string> {
    console.log("📤 Starting file upload:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      currentPublisher: this.publisherUrls[this.currentPublisherIndex]
    });

    // Validate file
    if (!file || file.size === 0) {
      throw new Error("Dosya seçilmedi veya boş dosya");
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error("Dosya boyutu 5MB'dan büyük olamaz");
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error("Desteklenmeyen dosya türü. Sadece JPG, PNG, GIF, WebP kabul edilir");
    }

    let lastError: Error | null = null;
    let attempts = 0;
    const maxAttempts = this.publisherUrls.length;

    while (attempts < maxAttempts) {
      try {
        const uploadUrl = this.getCurrentUploadUrl();
        console.log(`🚀 Attempt ${attempts + 1}/${maxAttempts} - Uploading to: ${uploadUrl}`);
        
        // Method 1: Try direct binary upload (recommended for images)
        let response = await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            'Content-Type': file.type,
          },
          body: file,
        });

        // If direct upload fails, try FormData
        if (!response.ok) {
          console.log("Direct upload failed, trying FormData...");
          const formData = new FormData();
          formData.append('file', file, file.name);
          
          response = await fetch(uploadUrl, {
            method: "PUT",
            body: formData,
          });
        }

        console.log("📡 Response received:", {
          status: response.status,
          statusText: response.statusText,
          url: uploadUrl
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => "Unknown error");
          throw new Error(`Walrus upload failed: ${response.status} ${errorText}`);
        }

        // Parse response
        const result = await response.json();
        console.log("📊 Walrus response:", result);
        
        // Extract blob ID from response
        let blobId = null;
        
        if (result.newlyCreated && result.newlyCreated.blobObject) {
          blobId = result.newlyCreated.blobObject.blobId;
        } else if (result.blobId) {
          blobId = result.blobId;
        } else if (result.id) {
          blobId = result.id;
        } else if (result.blob_id) {
          blobId = result.blob_id;
        }
        
        if (!blobId) {
          throw new Error(`No blob ID found in response: ${JSON.stringify(result)}`);
        }
        
        console.log("✅ Upload successful, BlobId:", blobId);
        return blobId;

      } catch (error) {
        console.error(`❌ Upload error for ${this.publisherUrls[this.currentPublisherIndex]}:`, error);
        lastError = error instanceof Error ? error : new Error(`Upload failed: ${error}`);
        
        // Try next publisher
        const hasNextPublisher = await this.tryNextPublisher();
        if (!hasNextPublisher) {
          console.error("❌ All Walrus publishers failed");
          break;
        }
        
        attempts++;
      }
    }

    // If we get here, all publishers failed
    console.error("❌ All Walrus publishers failed after", attempts, "attempts");
    throw lastError || new Error("All Walrus publishers failed");
  }
}
