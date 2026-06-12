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
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { StrictMode } from "react";
import NotFound from "./components/404";
import { OcrProvider } from "./contexts";
// biome-ignore lint/suspicious/noTsIgnore: vita でビルド時に作成されるので無視する
// @ts-ignore
import { messages } from "./locales/ja/messages";

// デフォルトは日本語
i18n.load("ja", messages);
i18n.activate("ja");

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

const rootElement = document.getElementById("app");

if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <I18nProvider i18n={i18n}>
        <Toast.Provider />
        <OcrProvider>
          <RouterProvider router={router} defaultNotFoundComponent={NotFound} />
        </OcrProvider>
      </I18nProvider>
    </StrictMode>,
  );
} else {
}
