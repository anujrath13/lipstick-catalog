"use client";

import { Check, Loader2 } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

type PullToRefreshProps = {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  disabled?: boolean;
};

const PULL_THRESHOLD = 64;
const MAX_PULL = 112;
/** List section is pullable when its top is in this range below the viewport top. */
const PULL_TOP_MAX = 300;

export function PullToRefresh({ onRefresh, children, disabled }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const pullDistanceRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPullable = () => {
    if (disabled || refreshing) return false;
    const el = containerRef.current;
    if (!el) return window.scrollY <= 2;
    const top = el.getBoundingClientRect().top;
    return top > 0 && top <= PULL_TOP_MAX;
  };

  const setDistance = (value: number) => {
    pullDistanceRef.current = value;
    setPullDistance(value);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleTouchMove = (event: TouchEvent) => {
      if (!pulling.current || disabled || refreshing) return;

      const delta = event.touches[0].clientY - startY.current;
      if (delta > 0 && isPullable()) {
        event.preventDefault();
        setDistance(Math.min(delta * 0.55, MAX_PULL));
      } else if (delta <= 0) {
        setDistance(0);
      }
    };

    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", handleTouchMove);
  }, [disabled, refreshing]);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  const handleTouchStart = (event: React.TouchEvent) => {
    if (!isPullable()) return;
    startY.current = event.touches[0].clientY;
    pulling.current = true;
    setShowSuccess(false);
  };

  const finishPull = async () => {
    if (!pulling.current) return;
    pulling.current = false;

    const distance = pullDistanceRef.current;
    if (distance >= PULL_THRESHOLD) {
      setRefreshing(true);
      setDistance(52);
      try {
        await onRefresh();
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

  const indicatorHeight =
    pullDistance > 0 || refreshing || showSuccess
      ? Math.max(pullDistance, refreshing || showSuccess ? 52 : 0)
      : 0;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={() => void finishPull()}
      onTouchCancel={() => {
        pulling.current = false;
        setDistance(0);
      }}
    >
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
        style={{ height: indicatorHeight }}
        aria-live="polite"
      >
        {refreshing ? (
          <div className="flex items-center gap-2 text-rose-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Refreshing...</span>
          </div>
        ) : showSuccess ? (
          <div className="flex items-center gap-2 text-emerald-600">
            <Check className="h-5 w-5" />
            <span className="text-sm font-medium">Refreshed</span>
          </div>
        ) : pullDistance > PULL_THRESHOLD * 0.55 ? (
          <div className="flex items-center gap-2 text-rose-500">
            <Loader2 className="h-5 w-5" />
            <span className="text-sm font-medium">Release to refresh</span>
          </div>
        ) : pullDistance > 8 ? (
          <div className="flex items-center gap-2 text-rose-400">
            <Loader2 className="h-5 w-5 opacity-60" />
            <span className="text-sm">Pull to refresh</span>
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
}
