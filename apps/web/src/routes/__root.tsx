import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import favicon from "@/assets/favicon.svg";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <header className="border-gray-800 border-b p-2">
        <nav className="container m-auto flex items-center">
          <Link to="/">
            <h1 className="flex items-center gap-1">
              <img
                src={favicon}
                alt="Homepage_Image"
                className="inline-block h-10 w-10"
              />
              <span className="text-xl">ASB-web</span>
            </h1>
          </Link>
        </nav>
      </header>

      <main className="grow p-2">
        <div className="container m-auto">
          <Outlet />
        </div>
      </main>

      <footer className="bg-gray-800 p-2 text-white">
        <div className="container m-auto flex flex-col gap-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <h3 className="font-semibold">Community</h3>
              <ul>
                <li>
                  <a
                    href="https://github.com/magurouhiru/ASB-web"
                    target="_blank"
                    rel="noopener"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
            <ul>
              <li>
                <Link to="/about">
                  <h3>About</h3>
                </Link>
              </li>
              <li>
                <Link to="/privacy_policy">
                  <h3>Privacy Policy</h3>
                </Link>
              </li>
            </ul>
          </div>
          <span className="text-center">Copyright (c) 2026 magurouhiru</span>
        </div>
      </footer>
    </div>
  );
}
