import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";

function OverlayUI({
  text,
  debugId = "__timed_overlay__",
}: {
  text?: string;
  debugId?: string;
}) {
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // visible 時把焦點拉上來（OverlayUI 只在 visible 時 render）
  useEffect(() => {
    overlayRef.current?.focus();
  }, []);

  return createPortal(
    <div
      id={debugId}
      ref={overlayRef}
      tabIndex={-1}
      role="alert"
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-2147483647 pointer-events-auto grid place-items-center bg-background/50 backdrop-blur-sm"
      // 保險：攔截 pointer / wheel，避免事件穿透 & 背景捲動
      onPointerDown={(e) => e.preventDefault()}
      onWheel={(e) => e.preventDefault()}
      // fallback：如果 inert 在某些環境沒生效，至少不要讓 Tab 跑到背景
      onKeyDown={(e) => {
        if (e.key === "Tab") {
          e.preventDefault();
          overlayRef.current?.focus();
        }
      }}
    >
      <div className="stack flex-center gap-2 px-4 py-2 text-xl">
        <Loader2 className="h-12 w-12 animate-spin" />
        {text ?? "Loading..."}
      </div>
    </div>,
    document.body,
  );
}

/**
 * show = true 時會：
 * - 延遲 delay 才顯示（避免閃）
 * - 一旦顯示，至少維持 minDuration（避免抖）
 * - visible 時阻擋底層互動、鎖住 body 滾動、阻擋 Tab 跑到底下（inert）
 */
export function TimedOverlay({
  show,
  delay = 150,
  minDuration = 500,
  text,
}: {
  show: boolean;
  delay?: number;
  minDuration?: number;
  text?: string;
}) {
  const [visible, setVisible] = useState(false);

  const showTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);
  const shownAt = useRef<number | null>(null);

  // 記住 overlay 出現前的焦點，關閉後還原（像 Sheet）
  const prevFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (showTimer.current) window.clearTimeout(showTimer.current);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    showTimer.current = null;
    hideTimer.current = null;

    if (show) {
      showTimer.current = window.setTimeout(
        () => {
          // 記住當下焦點（只記一次）
          if (!visible) {
            prevFocusedRef.current =
              document.activeElement as HTMLElement | null;
          }

          setVisible(true);
          shownAt.current = Date.now();
          showTimer.current = null;
        },
        Math.max(delay, 0),
      );

      return () => {
        if (showTimer.current) window.clearTimeout(showTimer.current);
        showTimer.current = null;
      };
    }

    if (!visible) {
      shownAt.current = null;
      return;
    }

    const start = shownAt.current ?? Date.now();
    const elapsed = Date.now() - start;
    const remain = Math.max(minDuration - elapsed, 0);

    hideTimer.current = window.setTimeout(() => {
      setVisible(false);
      shownAt.current = null;
      hideTimer.current = null;
    }, remain);

    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
      // shownAt.current = null;
      // prevFocusedRef.current = null;
      // setVisible(false);
      // if (showTimer.current) window.clearTimeout(showTimer.current);
      // showTimer.current = null;
    };
  }, [show, visible, delay, minDuration]);

  // visible 時鎖住背景滾動（像 Sheet）
  useEffect(() => {
    if (!visible) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [visible]);

  // visible 時把背景整個變成不可互動 + 不可聚焦（Tab 不會跑到底下）
  useEffect(() => {
    if (!visible) return;

    const appRoot = document.getElementById("root");
    if (!appRoot) return;

    const prevAriaHidden = appRoot.getAttribute("aria-hidden");
    const prevInert = (appRoot as any).inert;

    // 讓背景不可被操作/聚焦
    appRoot.setAttribute("aria-hidden", "true");
    (appRoot as any).inert = true;

    return () => {
      // 還原
      if (prevAriaHidden === null) appRoot.removeAttribute("aria-hidden");
      else appRoot.setAttribute("aria-hidden", prevAriaHidden);

      (appRoot as any).inert = prevInert ?? false;
    };
  }, [visible]);

  // overlay 關閉後，把焦點還給原本元素（更像 Sheet）
  useEffect(() => {
    if (visible) return;

    const el = prevFocusedRef.current;
    if (el && typeof el.focus === "function") {
      // 下一輪 microtask 再 focus，避免跟路由切換/卸載搶時序
      queueMicrotask(() => el.focus());
    }
    prevFocusedRef.current = null;
  }, [visible]);

  if (!visible) return null;
  return <OverlayUI text={text} />;
}
