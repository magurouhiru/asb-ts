import {
  createHashHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
// biome-ignore lint/suspicious/noTsIgnore: vita でビルド時に作成されるので無視する
// @ts-ignore
import { routeTree } from "./routeTree.gen";
import "./index.css";
import { Toast } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import NotFound from "./components/404";
import { OcrProvider } from "./contexts";

// Set up a Router instance
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
  basepath: "ASB-web",
  history: createHashHistory(),
});

// Register things for typesafety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const queryClient = new QueryClient();

const rootElement = document.getElementById("app");

if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <Toast.Provider />
      <QueryClientProvider client={queryClient}>
        <OcrProvider>
          <RouterProvider router={router} defaultNotFoundComponent={NotFound} />
        </OcrProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
} else {
}
