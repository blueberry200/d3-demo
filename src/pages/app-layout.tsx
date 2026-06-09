import { Outlet, useLocation, useNavigation } from "react-router-dom";
import { useLayoutEffect } from "react";
import { TimedOverlay } from "@/components/timed-overlay";
import ResponsiveMainMenu from "@/components/nav/nav";

function ScrollToTopOnPathname() {
  const { pathname } = useLocation();
  useLayoutEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

export default function AppLayout() {
  const navigation = useNavigation();
  const isNavigating =
    navigation.state === "loading" || navigation.state === "submitting";

  return (
    <div className="min-h-dvh flex flex-col">
      <ScrollToTopOnPathname />
      <TimedOverlay
        show={isNavigating}
        delay={150}
        minDuration={500}
        text="Loading..."
      />
      <ResponsiveMainMenu />
      <main className="flex-1">
        <Outlet />
      </main>
      <div className="flex justify-end items-center text-center text-md font-bold h-12 w-full px-4 border-t border-foreground">
        © {new Date().getFullYear()} Jerry's D3.js Demo Web.
      </div>
    </div>
  );
}
