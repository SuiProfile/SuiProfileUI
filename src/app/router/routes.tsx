import { lazy } from "react";
import { createBrowserRouter, RouteObject } from "react-router-dom";
import MainLayout from "../layout/MainLayout";
import AuthLayout from "../layout/AuthLayout";

const HomePage    = lazy(() => import("../../pages/home/HomePage"));
const LandingPage    = lazy(() => import("../../pages/landing/LandingPage"));
const AuthPage    = lazy(() => import("../../pages/auth/AuthPage"));
// const WalletPage  = lazy(() => import("../../pages/wallet/WalletPage"));
// const SwapPage    = lazy(() => import("../../pages/swap/SwapPage"));
// const ExplorePage = lazy(() => import("../../pages/explore/ExplorePage"));
// const NotFound    = lazy(() => import("../../pages/not-found/NotFoundPage"));

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <LandingPage /> },
    //   { path: "wallet", element: <WalletPage /> },
    //   { path: "swap", element: <SwapPage /> },
    //   { path: "explore", element: <ExplorePage /> }
    ],
  },
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      { index: true, element: <AuthPage /> },
    ],
  },
  { path: "*" },
];

export const router = createBrowserRouter(routes);
