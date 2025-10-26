import { Transaction } from "@mysten/sui/transactions";
import { SuiClient } from "@mysten/sui/client";

export class DashboardNFTService {
  private packageId: string;
  private clockId: string;

  constructor(packageId: string, clockId: string) {
    this.packageId = packageId;
    this.clockId = clockId;
  }

  /**
   * Dashboard snapshot'ı NFT olarak mint et
   */
  mintSnapshot(
    collectionId: string,
    profileId: string,
    username: string,
    snapshotCid: string,
    dataCid: string,
    totalClicks: number,
    totalLinks: number,
    title: string,
    description: string
  ): Transaction {
    const tx = new Transaction();

    // Move contract'ın mint_dashboard_snapshot entry function'ını çağır
    tx.moveCall({
      target: `${this.packageId}::dashboard_nft::mint_dashboard_snapshot`,
      arguments: [
        tx.object(collectionId), // DashboardCollection
        tx.pure.address(profileId), // profile_id
        tx.pure.string(username), // username
        tx.pure.string(snapshotCid), // snapshot_cid
        tx.pure.string(dataCid), // data_cid
        tx.pure.u64(totalClicks), // total_clicks
        tx.pure.u64(totalLinks), // total_links
        tx.pure.string(title), // title
        tx.pure.string(description), // description
        tx.object(this.clockId), // clock
      ],
    });

    return tx;
  }

  /**
   * Dashboard collection oluştur
   */
  createCollection(): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::dashboard_nft::create_collection`,
      arguments: [],
    });

    return tx;
  }

  /**
   * NFT'nin detaylarını getir
   */
  async getNFTDetails(client: SuiClient, nftId: string) {
    try {
      const nft = await client.getObject({
        id: nftId,
        options: {
          showContent: true,
          showDisplay: true,
        },
      });

      if (!nft.data) return null;

      return {
        id: nftId,
        owner: nft.data.owner,
        content: nft.data.content,
        display: nft.data.display,
      };
    } catch (error) {
      console.error("Error fetching NFT details:", error);
      return null;
    }
  }

  /**
   * Kullanıcının tüm dashboard NFT'lerini getir
   */
  async getUserDashboardNFTs(client: SuiClient, userAddress: string) {
    try {
      const objects = await client.getOwnedObjects({
        owner: userAddress,
        filter: {
          StructType: `${this.packageId}::dashboard_nft::DashboardNFT`,
        },
        options: {
          showContent: true,
          showDisplay: true,
        },
      });

      return objects.data.map((obj) => ({
        id: obj.data?.objectId,
        owner: obj.data?.owner,
        content: obj.data?.content,
        display: obj.data?.display,
      }));
    } catch (error) {
      console.error("Error fetching user dashboard NFTs:", error);
      return [];
    }
  }

  /**
   * Collection'ın detaylarını getir
   */
  async getCollectionDetails(client: SuiClient, collectionId: string) {
    try {
      const collection = await client.getObject({
        id: collectionId,
        options: {
          showContent: true,
        },
      });

      if (!collection.data) return null;

      return {
        id: collectionId,
        owner: collection.data.owner,
        content: collection.data.content,
      };
    } catch (error) {
      console.error("Error fetching collection details:", error);
      return null;
    }
  }
}
