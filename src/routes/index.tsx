import {
  createBrowserRouter,
  createHashRouter,
  RouterProvider,
} from "react-router-dom";
import { TimedOverlay } from "@/components/timed-overlay";
import AppLayout from "@/pages/app-layout";

// 小工具：Router lazy 需要回傳 { Component }
const routeLazy = async (importer: () => Promise<{ default: any }>) => {
  const mod = await importer();
  return { Component: mod.default };
};

// 統一的 route 設定
const routes = [
  {
    element: <AppLayout />,
    hydrateFallbackElement: (
      <TimedOverlay show={true} delay={150} text="Loading..." />
    ),
    children: [
      {
        index: true,
        lazy: () => routeLazy(() => import("@/pages/home/home")),
      },
      {
        path: "/map",
        lazy: () => routeLazy(() => import("@/pages/map/map")),
      },
      {
        path: "/rect",
        lazy: () => routeLazy(() => import("@/pages/rect/rect")),
      },
      {
        path: "/line",
        lazy: () => routeLazy(() => import("@/pages/line/line")),
      },
      {
        path: "/circle",
        lazy: () => routeLazy(() => import("@/pages/circle/circle")),
      },
      {
        path: "/other-chart",
        lazy: () => routeLazy(() => import("@/pages/other-chart/other-chart")),
      },
    ],
  },
];

// 判斷是不是跑在 GitHub Pages（例如 your-name.github.io）
const isGithubPages = window.location.hostname.endsWith("github.io");

// GitHub Pages → Hash Router，其它情況 → Browser Router
const router = isGithubPages
  ? createHashRouter(routes)
  : createBrowserRouter(routes);

export default function AppRoutes() {
  return <RouterProvider router={router} />;
}
