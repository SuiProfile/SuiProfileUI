import { useMemo } from "react";
import { useNetworkVariable } from "../networkConfig";
import { ProfileService } from "../services/profileService";
import { StatisticsService } from "../services/statisticsService";
import { useSuiClient } from "@mysten/dapp-kit";
import { WalrusService } from "../services/walrusService";

export function useSuiServices() {
  const client = useSuiClient();
  const packageId = useNetworkVariable("packageId");
  const profileRegistryId = useNetworkVariable("profileRegistryId");
  const statsRegistryId = useNetworkVariable("statsRegistryId");
  const clockId = useNetworkVariable("clockId");
  const walrusAggregatorBaseUrl = useNetworkVariable("walrusAggregatorBaseUrl");
  const walrusUploadUrl = useNetworkVariable("walrusUploadUrl");

  const profileService = useMemo(
    () => new ProfileService(packageId, profileRegistryId, clockId),
    [packageId, profileRegistryId, clockId]
  );

  const statisticsService = useMemo(
    () => new StatisticsService(packageId, statsRegistryId, clockId),
    [packageId, statsRegistryId, clockId]
  );

  const walrusService = useMemo(
    () => new WalrusService(walrusAggregatorBaseUrl, walrusUploadUrl),
    [walrusAggregatorBaseUrl, walrusUploadUrl]
  );

  return {
    client,
    profileService,
    statisticsService,
    walrusService,
  };
}

