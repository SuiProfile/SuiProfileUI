import { Transaction } from "@mysten/sui/transactions";
import { SuiClient } from "@mysten/sui/client";
import { bcs } from "@mysten/sui/bcs";
import { StatisticsData } from "../models/statistics-data";

export class StatisticsService {
  constructor(
    private packageId: string,
    private statsRegistryId: string,
    private clockId: string = "0x6"
  ) {}

  /**
   * Profil için istatistik objesi oluşturur
   */
  createStatistics(profileId: string): Transaction {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.packageId}::statistics::create_statistics`,
      arguments: [
        tx.object(this.statsRegistryId),
        tx.pure(bcs.Address.serialize(profileId)),
        tx.object(this.clockId),
      ],
    });

    return tx;
  }

  /**
   * Link tıklamasını kaydeder
   */
  trackClick(statsId: string, label: string, source: string = ""): Transaction {
    const tx = new Transaction();
    
    const labelBytes = Array.from(new TextEncoder().encode(label));
    const sourceBytes = Array.from(new TextEncoder().encode(source));
    
    tx.moveCall({
      target: `${this.packageId}::statistics::track_click`,
      arguments: [
        tx.object(statsId),
        tx.pure(bcs.vector(bcs.U8).serialize(labelBytes)),
        tx.pure(bcs.vector(bcs.U8).serialize(sourceBytes)),
        tx.object(this.clockId),
      ],
    });

    return tx;
  }

  /**
   * Reset statistics
   */
  resetStatistics(statsId: string): Transaction {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.packageId}::statistics::reset_statistics`,
      arguments: [
        tx.object(statsId),
      ],
    });

    return tx;
  }

  /**
   * Benzersiz ziyaretçi sayacını artırır
   */
  incrementUniqueVisitor(statsId: string): Transaction {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.packageId}::statistics::increment_unique_visitor`,
      arguments: [
        tx.object(statsId),
      ],
    });

    return tx;
  }

  /**
   * Profil ID'sinden istatistik objesi adresini bulur
   */
  async resolveStats(client: SuiClient, profileId: string): Promise<string | null> {
    try {
      const result = await client.devInspectTransactionBlock({
        sender: "0x0000000000000000000000000000000000000000000000000000000000000000",
        transactionBlock: (() => {
          const tx = new Transaction();
          tx.moveCall({
            target: `${this.packageId}::statistics::resolve_stats`,
            arguments: [
              tx.object(this.statsRegistryId),
              tx.pure(bcs.Address.serialize(profileId)),
            ],
          });
          return tx;
        })(),
      });

      if (result.results && result.results[0]?.returnValues) {
        const bytes = result.results[0].returnValues[0][0];
        return `0x${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`;
      }
      return null;
    } catch (error) {
      console.error("Error resolving stats:", error);
      return null;
    }
  }

  /**
   * İstatistik detaylarını getirir
   */
  async getStatistics(client: SuiClient, statsId: string): Promise<StatisticsData | null> {
    try {
      const object = await client.getObject({
        id: statsId,
        options: {
          showContent: true,
        },
      });

      if (!object.data || object.data.content?.dataType !== "moveObject") {
        return null;
      }

      const fields = object.data.content.fields as any;
      
      return {
        id: statsId,
        profileId: fields.profile_id,
        owner: fields.owner,
        totalClicks: parseInt(fields.total_clicks),
        uniqueVisitors: parseInt(fields.unique_visitors),
        linkClicks: new Map(Object.entries(fields.link_clicks?.fields || {}).map(([k, v]) => [k, parseInt(v as string)])),
        sourceClicks: new Map(Object.entries(fields.source_clicks?.fields || {}).map(([k, v]) => [k, parseInt(v as string)])),
        lastClickMs: parseInt(fields.last_click_ms),
        createdAt: parseInt(fields.created_at),
      };
    } catch (error) {
      console.error("Error getting statistics:", error);
      return null;
    }
  }

  /**
   * Profil için istatistik var mı kontrol eder
   */
  async statsExists(client: SuiClient, profileId: string): Promise<boolean> {
    const statsId = await this.resolveStats(client, profileId);
    return statsId !== null;
  }
}

