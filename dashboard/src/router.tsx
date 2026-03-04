import {
  createRouter,
  createRootRoute,
  createRoute,
  redirect,
  Outlet,
} from "@tanstack/react-router";
import Sidebar from "./components/Sidebar";
import { navItems, defaultRoute } from "./navItems";

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Sidebar />
      <div className="main">
        <Outlet />
      </div>
    </>
  ),
});

const pageRoutes = navItems.map((item) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: item.to,
    component: item.component,
  }),
);

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    throw redirect({ to: defaultRoute as any });
  },
});

const routeTree = rootRoute.addChildren([indexRoute, ...pageRoutes]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
