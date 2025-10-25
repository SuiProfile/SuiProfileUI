// src/app/router.tsx
import { createBrowserRouter, Outlet } from "react-router-dom";
import { lazy, Suspense } from "react";
import ScrollToTop from "../components/ScrollToTop";
import PublicLayout from "../layout/PublicLayout";
import ProtectedRoute from "../guards/ProtectedRoute";
import AppLayout from "../layout/AppLayout";

// Lazy pages
const Auth = lazy(() => import("../page/Auth"));
const Dashboard = lazy(() => import("../page/Dashboard"));
const RegisterUsername = lazy(() => import("../page/RegisterUsername"));
const CreateProfile = lazy(() => import("../page/CreateProfile"));
const EditProfile = lazy(() => import("../page/EditProfile"));
const PublicProfile = lazy(() => import("../page/PublicProfile"));
const Statistics = lazy(() => import("../page/Statistics"));
const MyProfiles = lazy(() => import("../page/MyProfiles"));
const GeneralStats = lazy(() => import("../page/GeneralStats"));
const Settings = lazy(() => import("../page/Settings"));
const Links = lazy(() => import("../page/Links"));
const NotFound = lazy(() => import("../page/NotFound"));

const withSuspense = (el: JSX.Element) => (
  <Suspense fallback={<div className="p-8">Yükleniyor…</div>}>{el}</Suspense>
);

// Public profile rotası (tamamen ayrı, layout’suz)
const PublicProfileRoot = {
  path: "/:username/:slug",
  element: withSuspense(<PublicProfile />),
};

// Public (Auth) rotaları
const PublicRoot = {
  element: (
    <>
      <ScrollToTop />
      <PublicLayout />
    </>
  ),
  children: [
    { path: "/", element: withSuspense(<Auth />) },
  ],
};

// Protected rotalar (guard + AppLayout)
const ProtectedRoot = {
  element: (
    <>
      <ScrollToTop />
      <ProtectedRoute />
    </>
  ),
  children: [
    {
      element: <AppLayout />,
      children: [
        { path: "/dashboard", element: withSuspense(<Dashboard />) },
        { path: "/my-profiles", element: withSuspense(<MyProfiles />) },
        { path: "/stats", element: withSuspense(<GeneralStats />) },
        { path: "/links", element: withSuspense(<Links />) },
        { path: "/settings", element: withSuspense(<Settings />) },
        { path: "/register-username", element: withSuspense(<RegisterUsername />) },
        { path: "/profile/create", element: withSuspense(<CreateProfile />) },
        { path: "/profile/:profileId/edit", element: withSuspense(<EditProfile />) },
        { path: "/profile/:profileId/stats", element: withSuspense(<Statistics />) },
      ],
    },
  ],
};

// NotFound
const FallbackRoot = { path: "*", element: withSuspense(<NotFound />) };

export const router = createBrowserRouter([
  PublicProfileRoot,
  PublicRoot,
  ProtectedRoot,
  FallbackRoot,
]);
