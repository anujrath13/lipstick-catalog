"use client";

import { animate, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { Pencil, RotateCcw, Star, Trash2 } from "lucide-react";
import { useRef, type ReactNode } from "react";

type SwipeableCardProps = {
  children: ReactNode;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  rightLabel?: string;
  leftLabel?: string;
  leftIcon?: "trash" | "edit" | "restore";
  disabled?: boolean;
};

const SWIPE_THRESHOLD = 72;

export function SwipeableCard({
  children,
  onSwipeRight,
  onSwipeLeft,
  rightLabel = "Favorite",
  leftLabel = "Trash",
  leftIcon = "trash",
  disabled = false,
}: SwipeableCardProps) {
  const x = useMotionValue(0);
  const didSwipe = useRef(false);
  const rightOpacity = useTransform(x, [0, 72], [0, 1]);
  const leftOpacity = useTransform(x, [0, -72], [0, 1]);

  const LeftIcon = leftIcon === "edit" ? Pencil : leftIcon === "restore" ? RotateCcw : Trash2;

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled) {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 35 });
      return;
    }

    if (info.offset.x > SWIPE_THRESHOLD) {
      didSwipe.current = true;
      onSwipeRight?.();
    } else if (info.offset.x < -SWIPE_THRESHOLD && onSwipeLeft) {
      didSwipe.current = true;
      onSwipeLeft();
    }

    animate(x, 0, { type: "spring", stiffness: 500, damping: 35 });
  };

  return (
    <div className="relative overflow-hidden rounded-[30px]">
      <div className="pointer-events-none absolute inset-0 flex items-stretch rounded-[30px]">
        <motion.div
          style={{ opacity: rightOpacity }}
          className="flex w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-l-[30px] bg-rose-100 text-rose-600"
        >
          <Star className="h-5 w-5" />
          <span className="text-[10px] font-medium uppercase tracking-wide">{rightLabel}</span>
        </motion.div>
        <div className="flex-1" />
        <motion.div
          style={{ opacity: leftOpacity }}
          className="flex w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-r-[30px] bg-red-50 text-red-600"
        >
          <LeftIcon className="h-5 w-5" />
          <span className="text-[10px] font-medium uppercase tracking-wide">{leftLabel}</span>
        </motion.div>
      </div>

      <motion.div
        drag={disabled ? false : "x"}
        dragConstraints={{ left: -108, right: 108 }}
        dragElastic={0.14}
        style={{ x }}
        onDragEnd={handleDragEnd}
        onClickCapture={(event) => {
          if (didSwipe.current) {
            didSwipe.current = false;
            event.preventDefault();
            event.stopPropagation();
          }
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
