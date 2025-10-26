import { TestnetVars } from "../models/testnet-vars";

export const TESTNET_VARS: TestnetVars = {

  packageId: import.meta.env.VITE_PACKAGE_ID ?? "",
  profileRegistryId: import.meta.env.VITE_PROFILE_REGISTRY_ID ?? "",
  statsRegistryId: import.meta.env.VITE_STATS_REGISTRY_ID ?? "",
  publisherId: import.meta.env.VITE_PUBLISHER_ID ?? "",
  displayId: import.meta.env.VITE_DISPLAY_ID ?? "",
  upgradeCapId: import.meta.env.VITE_UPGRADE_CAP_ID ?? "",
  initialSharedVersion: import.meta.env.VITE_INITIAL_SHARED_VERSION ?? "",
  clockId: import.meta.env.VITE_CLOCK_ID ?? "",
  walrusPublisherUrls: import.meta.env.VITE_WALRUS_PUBLISHER_URLS ?? "",
  walrusAggregatorUrls: import.meta.env.VITE_WALRUS_AGGREGATOR_URLS ?? "",
  dashboardCollectionId: import.meta.env.VITE_DASHBOARD_COLLECTION_ID ?? "",
} as const;