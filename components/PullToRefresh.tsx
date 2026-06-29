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
  /** When scrolled past the hero, pull is allowed once this element reaches the top. */
  scrollAnchorRef?: RefObject<HTMLElement | null>;
};

const PULL_THRESHOLD = 64;
const MAX_PULL = 112;
const PULL_TOP_MAX = 320;

export function PullToRefresh({
  onRefresh,
  children,
  disabled,
  scrollAnchorRef,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const startY = useRef(0);
  const startX = useRef(0);
  const pulling = useRef(false);
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

  const isPullable = () => {
    if (disabledRef.current || refreshing) return false;
    if (window.scrollY <= 4) return true;

    const anchor = scrollAnchorRef?.current;
    if (!anchor) return false;

    const top = anchor.getBoundingClientRect().top;
    return top >= -2 && top <= PULL_TOP_MAX;
  };

  useEffect(() => {
    const handleTouchStart = (event: TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("input, textarea, select, [contenteditable='true']")) return;
      if (!isPullable()) return;

      startY.current = event.touches[0].clientY;
      startX.current = event.touches[0].clientX;
      pulling.current = true;
      setShowSuccess(false);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!pulling.current || disabledRef.current || refreshing) return;

      const touch = event.touches[0];
      const deltaY = touch.clientY - startY.current;
      const deltaX = touch.clientX - startX.current;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        pulling.current = false;
        setDistance(0);
        return;
      }

      if (deltaY > 0 && isPullable()) {
        event.preventDefault();
        setDistance(Math.min(deltaY * 0.55, MAX_PULL));
      } else if (deltaY <= 0) {
        setDistance(0);
      }
    };

    const finishPull = async () => {
      if (!pulling.current) return;
      pulling.current = false;

      const distance = pullDistanceRef.current;
      if (distance >= PULL_THRESHOLD) {
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
      pulling.current = false;
      setDistance(0);
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
  }, [refreshing, scrollAnchorRef]);

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
        className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-end justify-center overflow-hidden transition-[height] duration-200 ease-out lg:hidden"
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
        ) : pullDistance > 8 ? (
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
