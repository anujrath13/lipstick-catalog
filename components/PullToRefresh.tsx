"use client";

import { Loader2 } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

type PullToRefreshProps = {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  disabled?: boolean;
};

const PULL_THRESHOLD = 72;

export function PullToRefresh({ onRefresh, children, disabled }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const handleTouchStart = (event: React.TouchEvent) => {
    if (disabled || refreshing || window.scrollY > 4) return;
    startY.current = event.touches[0].clientY;
    pulling.current = true;
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (!pulling.current || disabled || refreshing) return;

    const delta = event.touches[0].clientY - startY.current;
    if (delta > 0 && window.scrollY <= 4) {
      setPullDistance(Math.min(delta * 0.45, 96));
    }
  };

  const finishPull = async () => {
    if (!pulling.current) return;
    pulling.current = false;

    if (pullDistance >= PULL_THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(48);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
      return;
    }

    setPullDistance(0);
  };

  const indicatorHeight =
    pullDistance > 0 || refreshing ? Math.max(pullDistance, refreshing ? 48 : 0) : 0;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => void finishPull()}
      onTouchCancel={() => {
        pulling.current = false;
        setPullDistance(0);
      }}
    >
      <div
        className="flex items-center justify-center overflow-hidden text-rose-500 transition-[height] duration-200"
        style={{ height: indicatorHeight }}
        aria-hidden={indicatorHeight === 0}
      >
        <Loader2 className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
        {!refreshing && pullDistance > PULL_THRESHOLD * 0.6 ? (
          <span className="ml-2 text-sm font-medium">Release to refresh</span>
        ) : null}
        {!refreshing && pullDistance > 0 && pullDistance <= PULL_THRESHOLD * 0.6 ? (
          <span className="ml-2 text-sm text-rose-400">Pull to refresh</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}
