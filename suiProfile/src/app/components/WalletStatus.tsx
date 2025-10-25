import { useCurrentAccount } from "@mysten/dapp-kit";
import { Container, Flex, Heading, Text } from "@radix-ui/themes";
import { OwnedObjects } from "./OwnedObjects";
import { walletMessages } from "../static/messages";

export function WalletStatus() {
  const account = useCurrentAccount();

  return (
    <Container my="2">
      <Heading mb="2">{walletMessages.status.title}</Heading>

      {account ? (
        <Flex direction="column">
          <Text>{walletMessages.status.connected}</Text>
          <Text>{walletMessages.status.address} {account.address}</Text>
        </Flex>
      ) : (
        <Text>{walletMessages.status.notConnected}</Text>
      )}
      <OwnedObjects />
    </Container>
  );
}