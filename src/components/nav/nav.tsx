import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { useNavigate } from "react-router";
import { Menu, X, ChartColumn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

const menu = [
  { id: 1, label: "首頁", href: "/" },
  { id: 2, label: "條狀圖", href: "/rect" },
  { id: 3, label: "線圖", href: "/line" },
  { id: 4, label: "地圖", href: "/map" },
  { id: 5, label: "圓形圖", href: "/circle" },
  { id: 6, label: "其他", href: "/other-chart" },
];

/* ──────────────────────────────────────────────────────────── */
/* Desktop Nav List                                             */
/* ──────────────────────────────────────────────────────────── */

const DesktopNavListPart = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="hidden lg:block">
      <ul className="flex-center gap-5">
        {menu.map((menuItem) => {
          const isActive = location.pathname === menuItem.href;

          return (
            <li key={menuItem.id}>
              <div
                className={
                  "cursor-pointer font-black duration-200 " +
                  (isActive ? "text-primary-hover" : "hover:text-primary-hover")
                }
                onClick={() => navigate(menuItem.href)}
              >
                {menuItem.label}
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

/* ──────────────────────────────────────────────────────────── */
/* Mobile Nav List                                              */
/* ──────────────────────────────────────────────────────────── */

const MobileNavListPart = () => {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="bg-background text-foreground hover:bg-primary! hover:text-primary-foreground!"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>

        <SheetContent
          side="right"
          className="p-0 [&>button:first-of-type]:hidden gap-0"
        >
          <SheetHeader className="border-b border-border px-4 h-17.5 bg-background text-foreground">
            <div className="flex items-center justify-between">
              <SheetTitle className="font-black">主選單</SheetTitle>
              <SheetClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-background text-foreground hover:bg-primary! hover:text-primary-foreground!"
                >
                  <X className="h-5 w-5" />
                </Button>
              </SheetClose>
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(100dvh-70px)] bg-background">
            <nav className="stack gap-2 px-2 py-4 bg-background text-foreground">
              {menu.map((menuItem) => {
                const isActive = location.pathname === menuItem.href;

                return (
                  <SheetClose asChild key={menuItem.label}>
                    <div
                      onClick={() => navigate(menuItem.href)}
                      className={
                        "w-full rounded-md p-2 font-black cursor-pointer " +
                        (isActive
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-primary hover:text-primary-foreground")
                      }
                    >
                      {menuItem.label}
                    </div>
                  </SheetClose>
                );
              })}
            </nav>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────── */
/* Responsive Nav List                                          */
/* ──────────────────────────────────────────────────────────── */

export default function ResponsiveMainMenu() {
  return (
    <header className="sticky inset-x-0 top-0 z-50 overflow-visible border-b border-border bg-background text-foreground">
      <div className="mx-auto flex items-center justify-between h-17.5 max-w-7xl px-4">
        {/* Brand */}
        <div className="flex-center gap-5">
          <Link
            to="/"
            className="flex-center gap-2 text-foreground hover:text-primary transition-colors"
          >
            <ChartColumn className="h-8 w-8" />
            <span className="text-xl font-bold">Jerry's D3 Demo</span>
          </Link>
        </div>

        {/* Mobile */}
        <div className="flex lg:hidden">
          <MobileNavListPart />
        </div>

        {/* Desktop */}
        <div className="hidden lg:flex">
          <DesktopNavListPart />
        </div>
      </div>
    </header>
  );
}
