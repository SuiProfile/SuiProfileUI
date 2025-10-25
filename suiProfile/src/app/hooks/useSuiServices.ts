import { useMemo } from "react";
import { ProfileService } from "../services/profile.service";
import { StatisticsService } from "../services/statistics.service";
import { useSuiClient } from "@mysten/dapp-kit";
import { WalrusService } from "../services/walrus.service";
import { useNetworkVariable } from "../config/networkConfig";

export function useSuiServices() {
  const client = useSuiClient();
  const packageId = useNetworkVariable("packageId");
  const profileRegistryId = useNetworkVariable("profileRegistryId");
  const statsRegistryId = useNetworkVariable("statsRegistryId");
  const clockId = useNetworkVariable("clockId");
  
  // Get Walrus URLs from environment
  const walrusPublisherUrlsString = useNetworkVariable("walrusPublisherUrls");
  const walrusAggregatorUrlsString = useNetworkVariable("walrusAggregatorUrls");

  // Debug: Log network variables
  console.log("🔧 Network variables:", {
    packageId,
    profileRegistryId,
    statsRegistryId,
    clockId,
    walrusPublisherUrlsString,
    walrusAggregatorUrlsString
  });

  const profileService = useMemo(
    () => new ProfileService(packageId, profileRegistryId, clockId),
    [packageId, profileRegistryId, clockId]
  );

  const statisticsService = useMemo(
    () => new StatisticsService(packageId, statsRegistryId, clockId),
    [packageId, statsRegistryId, clockId]
  );

  const walrusService = useMemo(() => {
    // Parse Walrus URLs from environment variables
    let publisherUrls: string[] = [];
    let aggregatorUrls: string[] = [];
    
    if (walrusPublisherUrlsString) {
      publisherUrls = walrusPublisherUrlsString.split(',').map(url => url.trim());
    }
    
    if (walrusAggregatorUrlsString) {
      aggregatorUrls = walrusAggregatorUrlsString.split(',').map(url => url.trim());
    }
    
    // Fallback URLs if environment variables are not set
    if (publisherUrls.length === 0) {
      publisherUrls = [
        "https://publisher.walrus-testnet.walrus.space",
        "https://walrus-testnet-publisher.stakely.io",
        "https://walrus-testnet-publisher.nami.cloud",
        "https://walrus-testnet-publisher.stakecraft.com",
        "https://walrus-testnet-publisher.everstake.one",
        "https://walrus-testnet-publisher.chainbase.online",
        "https://walrus-testnet-publisher.crouton.digital",
        "https://walrus-testnet-publisher.dzdaic.com"
      ];
    }
    
    if (aggregatorUrls.length === 0) {
      aggregatorUrls = [
        "https://aggregator.walrus-testnet.walrus.space",
        "https://walrus-testnet-aggregator.stakely.io",
        "https://walrus-testnet-aggregator.nami.cloud",
        "https://walrus-testnet-aggregator.stakecraft.com",
        "https://walrus-testnet-aggregator.everstake.one",
        "https://walrus-testnet-aggregator.chainbase.online",
        "https://walrus-testnet-aggregator.crouton.digital",
        "https://walrus-testnet-aggregator.dzdaic.com"
      ];
    }
    
    console.log("🔧 Using Walrus URLs:", {
      publisherUrls,
      aggregatorUrls,
      fromEnv: {
        walrusPublisherUrlsString,
        walrusAggregatorUrlsString
      }
    });
    
    return new WalrusService(publisherUrls, aggregatorUrls);
  }, [walrusPublisherUrlsString, walrusAggregatorUrlsString]);

  return {
    client,
    profileService,
    statisticsService,
    walrusService,
  };
}