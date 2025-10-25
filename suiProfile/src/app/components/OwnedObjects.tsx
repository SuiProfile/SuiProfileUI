import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { Flex, Heading, Text } from "@radix-ui/themes";
import { walletMessages } from "../static/messages";

export function OwnedObjects() {
  const account = useCurrentAccount();
  const { data, isPending, error } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address as string,
    },
    {
      enabled: !!account,
    },
  );

  if (!account) {
    return;
  }

  if (error) {
    return <Flex>{walletMessages.objects.error} {error.message}</Flex>;
  }

  if (isPending || !data) {
    return <Flex>{walletMessages.objects.loading}</Flex>;
  }

  return (
    <Flex direction="column" my="2">
      {data.data.length === 0 ? (
        <Text>{walletMessages.objects.noObjects}</Text>
      ) : (
        <Heading size="4">{walletMessages.objects.objectsTitle}</Heading>
      )}
      {data.data.map((object) => (
        <Flex key={object.data?.objectId}>
          <Text>{walletMessages.objects.objectId} {object.data?.objectId}</Text>
        </Flex>
      ))}
    </Flex>
  );
}
