import { Navigate, Outlet } from "react-router-dom";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useZkLogin } from "../hooks/useZkLogin";

export default function ProtectedRoute() {
  const account = useCurrentAccount();
  const { isAuthenticated } = useZkLogin();

  if (account || isAuthenticated) {
    return <Outlet />;
  }
  return <Navigate to="/" replace />;
}