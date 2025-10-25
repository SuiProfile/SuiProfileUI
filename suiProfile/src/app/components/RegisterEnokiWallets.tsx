import { useEffect } from "react";
import { isEnokiNetwork, registerEnokiWallets } from "@mysten/enoki";
import { useSuiClientContext } from "@mysten/dapp-kit";

export function RegisterEnokiWallets() {
    const { client, network } = useSuiClientContext();

    useEffect(() => {
        if (!isEnokiNetwork(network)) {
            console.log("Not an Enoki network, skipping wallet registration");
            return;
        }

        // Check if required environment variables are present
        const apiKey = import.meta.env.VITE_ENOKI_PUBLIC_KEY;
        const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

        if (!apiKey || !googleClientId) {
            console.error("Missing required environment variables for Enoki");
            return;
        }

        console.log("Registering Enoki wallets...");
        
        const { unregister } = registerEnokiWallets({
            apiKey: apiKey,
            providers: {
                google: {
                    clientId: googleClientId,
                },
            },
            client: client as any,
            network,
        });

        return unregister;
    }, [client, network]);

    return null;
}