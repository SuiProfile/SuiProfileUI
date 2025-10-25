import { useMemo } from "react";
import { useNetworkVariable } from "../networkConfig";
import { ProfileService } from "../services/profileService";
import { StatisticsService } from "../services/statisticsService";
import { useSuiClient } from "@mysten/dapp-kit";

export function useSuiServices() {
  const client = useSuiClient();
  const packageId = useNetworkVariable("packageId");
  const profileRegistryId = useNetworkVariable("profileRegistryId");
  const statsRegistryId = useNetworkVariable("statsRegistryId");
  const clockId = useNetworkVariable("clockId");

  const profileService = useMemo(
    () => new ProfileService(packageId, profileRegistryId, clockId),
    [packageId, profileRegistryId, clockId]
  );

  const statisticsService = useMemo(
    () => new StatisticsService(packageId, statsRegistryId, clockId),
    [packageId, statsRegistryId, clockId]
  );

  return {
    client,
    profileService,
    statisticsService,
  };
}

