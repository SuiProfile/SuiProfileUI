import { TestnetVars } from "../models/testnet-vars";

export const EMPTY_TESTNET_VARS: TestnetVars = {
  packageId: "",
  profileRegistryId: "",
  statsRegistryId: "",
  publisherId: "",
  displayId: "",
  upgradeCapId: "",
  initialSharedVersion: "",
  clockId: "",
  walrusPublisherUrls: "",
  walrusAggregatorUrls: "",
  dashboardCollectionId: ""
} as const;