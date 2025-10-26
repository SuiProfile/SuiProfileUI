import { getFullnodeUrl } from "@mysten/sui/client";
import { createNetworkConfig } from "@mysten/dapp-kit";
import { TestnetVars } from "../models/testnet-vars";
import { EMPTY_TESTNET_VARS } from "../static/empty-testnet-vars";
import { TESTNET_VARS } from "../static/testnet-vars";

const cfg = {
  devnet: { url: getFullnodeUrl("devnet"), variables: EMPTY_TESTNET_VARS },
  testnet: { url: getFullnodeUrl("testnet"), variables: TESTNET_VARS },
  mainnet: { url: getFullnodeUrl("mainnet"), variables: EMPTY_TESTNET_VARS },
} as const satisfies Record<string, { url: string; variables: TestnetVars }>;

const { networkConfig, useNetworkVariable, useNetworkVariables } = createNetworkConfig(cfg);

export { networkConfig, useNetworkVariable, useNetworkVariables };

export type NetworkVarKey = keyof TestnetVars;
