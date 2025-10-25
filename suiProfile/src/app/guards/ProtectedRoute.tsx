// src/app/guards/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useCurrentAccount } from "@mysten/dapp-kit";

export default function ProtectedRoute() {
  const account = useCurrentAccount();
  const location = useLocation();

  if (!account) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
