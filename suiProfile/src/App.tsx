// src/App.tsx
import "@mysten/dapp-kit/dist/index.css";
import "@radix-ui/themes/styles.css";

import { RouterProvider } from "react-router-dom";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Theme } from "@radix-ui/themes";
import { router } from "./app/router/router";
import { networkConfig } from "./networkConfig";
import "../src/app/styles/tailwind.css";

const queryClient = new QueryClient();

export default function App() {
  return (
    <Theme appearance="dark">
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
          <WalletProvider autoConnect>
             <RouterProvider router={router} />
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </Theme>
  );
}
