import { useCurrentAccount, useConnectWallet, useWallets, useDisconnectWallet } from '@mysten/dapp-kit';
import { isEnokiWallet } from '@mysten/enoki';
import { Button, Flex, Text } from '@radix-ui/themes';
import { authMessages } from '../static/messages';

export function EnokiLoginButton() {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: connectWallet } = useConnectWallet();
  const { mutateAsync: disconnectWallet } = useDisconnectWallet();
  const wallets = useWallets();

  const isConnectedViaGoogleZkLogin = () => {
    if (!currentAccount) return false;
    
    const enokiWallets = wallets.filter(isEnokiWallet);
    const googleWallet = enokiWallets.find((wallet: any) => 
      wallet.provider === 'google' || wallet.name?.includes('Google')
    );
    
    return !!googleWallet && currentAccount.address !== undefined;
  };

  const handleGoogleLogin = async () => {
    try {
      if (currentAccount) {
        await disconnectWallet();
        console.log(authMessages.enoki.disconnected);
      }

      // Debug: Log all available wallets
      console.log("All wallets:", wallets);
      console.log("Enoki wallets:", wallets.filter(isEnokiWallet));
      
      // Find Enoki Google wallet
      const enokiWallets = wallets.filter(isEnokiWallet);
      const googleWallet = enokiWallets.find((wallet: any) => 
        wallet.provider === 'google' || wallet.name?.includes('Google')
      );

      console.log("Google wallet found:", googleWallet);

      if (!googleWallet) {
        console.error("Available Enoki wallets:", enokiWallets);
        alert(authMessages.enoki.walletNotFound);
        return;
      }

      // Connect with Google zkLogin
      await connectWallet({ wallet: googleWallet });
      console.log(authMessages.enoki.googleZkLoginSuccess);
    } catch (error) {
      console.error(authMessages.enoki.googleZkLoginFailed, error);
      alert(authMessages.enoki.loginFailed + (error as Error).message);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      console.log(authMessages.enoki.walletDisconnected);
    } catch (error) {
      console.error(authMessages.enoki.disconnectFailed, error);
    }
  };

  // If connected via Google zkLogin, show connected status
  if (currentAccount && isConnectedViaGoogleZkLogin()) {
    return (
      <Flex align="center" gap="2">
        <Text size="2" color="green">{authMessages.enoki.connected}</Text>
        <Button
          onClick={handleDisconnect}
          variant="soft"
          color="red"
          size="1"
        >
          {authMessages.enoki.disconnect}
        </Button>
      </Flex>
    );
  }

  // If connected via another wallet, show warning and force Google login
  if (currentAccount && !isConnectedViaGoogleZkLogin()) {
    return (
      <Flex direction="column" gap="2">
        <Text size="2" color="orange">{authMessages.enoki.connectedWithOther}</Text>
        <Flex gap="2">
          <Button
            onClick={handleGoogleLogin}
            variant="solid"
            color="blue"
          >
            {authMessages.enoki.signInWithGoogle}
          </Button>
          <Button
            onClick={handleDisconnect}
            variant="soft"
            color="gray"
            size="2"
          >
            {authMessages.enoki.disconnect}
          </Button>
        </Flex>
      </Flex>
    );
  }

  // Not connected, show Google login button
  return (
    <Flex gap="2">
      <Button
        onClick={handleGoogleLogin}
        variant="solid"
        color="blue"
      >
        {authMessages.enoki.signInWithGoogle}
      </Button>
    </Flex>
  );
}
