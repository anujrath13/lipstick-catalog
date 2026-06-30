"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { DancingCat } from "@/components/DancingCat";

type PullToRefreshProps = {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  disabled?: boolean;
  /** Unused — kept for API compatibility. Pull only works at document scroll top. */
  scrollAnchorRef?: RefObject<HTMLElement | null>;
};

const PULL_THRESHOLD = 72;
const PULL_ACTIVATION = 18;
const MAX_PULL = 112;
const SCROLL_TOP_TOLERANCE = 1;

export function PullToRefresh({
  onRefresh,
  children,
  disabled,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const startY = useRef(0);
  const startX = useRef(0);
  const touchActive = useRef(false);
  const pullCommitted = useRef(false);
  const pullDistanceRef = useRef(0);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRefreshRef = useRef(onRefresh);
  const disabledRef = useRef(disabled);

  onRefreshRef.current = onRefresh;
  disabledRef.current = disabled;

  const setDistance = (value: number) => {
    pullDistanceRef.current = value;
    setPullDistance(value);
  };

  const isAtScrollTop = () => window.scrollY <= SCROLL_TOP_TOLERANCE;

  const resetTouch = () => {
    touchActive.current = false;
    pullCommitted.current = false;
    setDistance(0);
  };

  useEffect(() => {
    const handleTouchStart = (event: TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("input, textarea, select, [contenteditable='true']")) return;
      if (disabledRef.current || refreshing || !isAtScrollTop()) return;

      startY.current = event.touches[0].clientY;
      startX.current = event.touches[0].clientX;
      touchActive.current = true;
      pullCommitted.current = false;
      setShowSuccess(false);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!touchActive.current || disabledRef.current || refreshing) return;

      if (!isAtScrollTop()) {
        resetTouch();
        return;
      }

      const touch = event.touches[0];
      const deltaY = touch.clientY - startY.current;
      const deltaX = touch.clientX - startX.current;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        resetTouch();
        return;
      }

      // Finger moving up — normal scroll, never hijack.
      if (deltaY < 0) {
        if (!pullCommitted.current) {
          touchActive.current = false;
        }
        setDistance(0);
        return;
      }

      if (!pullCommitted.current) {
        if (deltaY < PULL_ACTIVATION) return;
        pullCommitted.current = true;
      }

      event.preventDefault();
      setDistance(Math.min((deltaY - PULL_ACTIVATION) * 0.65, MAX_PULL));
    };

    const finishPull = async () => {
      if (!touchActive.current) return;

      const distance = pullDistanceRef.current;
      const committed = pullCommitted.current;
      touchActive.current = false;
      pullCommitted.current = false;

      if (committed && distance >= PULL_THRESHOLD) {
        setRefreshing(true);
        setDistance(72);
        try {
          await onRefreshRef.current();
          setShowSuccess(true);
          if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
          successTimeoutRef.current = setTimeout(() => {
            setShowSuccess(false);
          }, 1400);
        } finally {
          setRefreshing(false);
          setDistance(0);
        }
        return;
      }

      setDistance(0);
    };

    const handleTouchEnd = () => {
      void finishPull();
    };

    const handleTouchCancel = () => {
      resetTouch();
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    document.addEventListener("touchcancel", handleTouchCancel, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [refreshing]);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  const indicatorHeight =
    pullDistance > 0 || refreshing || showSuccess
      ? Math.max(pullDistance, refreshing || showSuccess ? 72 : 0)
      : 0;

  const isActive = indicatorHeight > 0;

  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex items-end justify-center overflow-hidden transition-[height] duration-200 ease-out lg:hidden"
        style={{
          height: indicatorHeight,
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
        aria-live="polite"
        aria-hidden={!isActive}
      >
        {refreshing ? (
          <div className="mb-2 flex items-center gap-2 rounded-full border border-rose-100 bg-white/95 px-4 py-2 text-rose-500 shadow-sm backdrop-blur">
            <DancingCat mode="dance" size={40} />
            <span className="text-sm font-medium">Refreshing...</span>
          </div>
        ) : showSuccess ? (
          <div className="mb-2 flex items-center gap-2 rounded-full border border-emerald-100 bg-white/95 px-4 py-2 text-emerald-600 shadow-sm backdrop-blur">
            <DancingCat mode="success" size={40} />
            <span className="text-sm font-medium">Refreshed</span>
          </div>
        ) : pullDistance > PULL_THRESHOLD * 0.55 ? (
          <div className="mb-2 flex items-center gap-2 rounded-full border border-rose-100 bg-white/95 px-4 py-2 text-rose-500 shadow-sm backdrop-blur">
            <DancingCat mode="dance" size={36} />
            <span className="text-sm font-medium">Release to refresh</span>
          </div>
        ) : pullDistance > 20 ? (
          <div className="mb-2 flex items-center gap-2 rounded-full border border-rose-100/80 bg-white/90 px-4 py-2 text-rose-400 shadow-sm backdrop-blur">
            <DancingCat mode="pull" size={34} />
            <span className="text-sm">Pull to refresh</span>
          </div>
        ) : null}
      </div>
      {children}
    </>
  );
}
