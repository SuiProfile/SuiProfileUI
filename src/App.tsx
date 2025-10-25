import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { AppProviders } from "./app/providers/AppProviders";

export default function App() {
  return (
    <AppProviders>
      <Suspense fallback={<div style={{ padding: 16 }}>Loading…</div>}>
        <RouterProvider router={router} />
      </Suspense>
    </AppProviders>
  );
}
