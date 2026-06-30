"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { hapticLight } from "@/lib/haptics";

type SwipeBackGestureProps = {
  enabled: boolean;
  onBack: () => void;
  label?: string;
};

const EDGE_WIDTH = 28;
const THRESHOLD = 72;

export function SwipeBackGesture({
  enabled,
  onBack,
  label = "Dashboard",
}: SwipeBackGestureProps) {
  const tracking = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!enabled) {
      tracking.current = false;
      setProgress(0);
      return;
    }

    const isMobile = () => window.matchMedia("(max-width: 767px)").matches;

    const onTouchStart = (e: TouchEvent) => {
      if (!isMobile()) return;
      const touch = e.touches[0];
      if (!touch || touch.clientX > EDGE_WIDTH) return;
      tracking.current = true;
      start.current = { x: touch.clientX, y: touch.clientY };
      setProgress(0);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking.current) return;
      const touch = e.touches[0];
      if (!touch) return;

      const dx = touch.clientX - start.current.x;
      const dy = touch.clientY - start.current.y;

      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 16) {
        tracking.current = false;
        setProgress(0);
        return;
      }

      if (dx > 0) {
        setProgress(Math.min(dx / THRESHOLD, 1));
      }
    };

    const finish = (dx: number) => {
      if (!tracking.current) return;
      tracking.current = false;
      if (dx >= THRESHOLD) {
        hapticLight();
        onBack();
      }
      setProgress(0);
    };

    const onTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      finish(touch ? touch.clientX - start.current.x : 0);
    };

    const onTouchCancel = () => {
      tracking.current = false;
      setProgress(0);
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [enabled, onBack]);

  if (!enabled || progress <= 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-y-0 left-0 z-[45] flex items-center md:hidden"
      style={{ width: `${Math.min(progress * 96, 96)}px` }}
      aria-hidden
    >
      <div
        className="flex items-center gap-1 rounded-r-2xl border border-rose-100/80 bg-white/95 px-3 py-2 shadow-md backdrop-blur"
        style={{ opacity: 0.5 + progress * 0.5 }}
      >
        <ChevronLeft className="h-4 w-4 text-rose-500" />
        <span className="text-xs font-medium text-rose-600">{label}</span>
      </div>
    </div>
  );
}
