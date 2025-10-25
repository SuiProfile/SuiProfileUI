import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ConnectButton } from "@mysten/dapp-kit";
import { Box, Flex, Heading } from "@radix-ui/themes";
import { Auth } from "./page/Auth";
import { Dashboard } from "./page/Dashboard";
import { RegisterUsername } from "./page/RegisterUsername";
import { CreateProfile } from "./page/CreateProfile";
import { EditProfile } from "./page/EditProfile";
import { PublicProfile } from "./page/PublicProfile";
import { Statistics } from "./page/Statistics";

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  
  // Public profile sayfalarında header'ı gizle
  const isPublicProfile = location.pathname.startsWith("/") && 
                          !location.pathname.startsWith("/dashboard") &&
                          !location.pathname.startsWith("/profile") &&
                          !location.pathname.startsWith("/register-username") &&
                          location.pathname !== "/";

  return (
    <>
      {!isPublicProfile && (
        <Flex
          position="sticky"
          px="4"
          py="2"
          justify="between"
          style={{
            borderBottom: "1px solid var(--gray-a2)",
            background: "var(--color-background)",
            zIndex: 100,
          }}
        >
          <Box>
            <Heading style={{ cursor: "pointer" }} onClick={() => window.location.href = "/"}>
              Sui Profile
            </Heading>
          </Box>

          <Box>
            <ConnectButton />
          </Box>
        </Flex>
      )}
      {children}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/register-username" element={<RegisterUsername />} />
          <Route path="/profile/create" element={<CreateProfile />} />
          <Route path="/profile/:profileId/edit" element={<EditProfile />} />
          <Route path="/profile/:profileId/stats" element={<Statistics />} />
          <Route path="/:username/:slug" element={<PublicProfile />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;