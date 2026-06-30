"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { hapticLight } from "@/lib/haptics";

type FavoriteButtonProps = {
  active: boolean;
  disabled?: boolean;
  compact?: boolean;
  onToggle: () => void;
};

export function FavoriteButton({
  active,
  disabled,
  compact,
  onToggle,
}: FavoriteButtonProps) {
  const [burst, setBurst] = useState(false);

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={disabled}
      className={`rounded-full text-zinc-400 hover:bg-rose-50 hover:text-rose-500 ${compact ? "h-8 w-8" : "h-9 w-9"} ${active ? "text-rose-500" : ""}`}
      onClick={(event) => {
        event.stopPropagation();
        if (!active) {
          setBurst(true);
          hapticLight();
          window.setTimeout(() => setBurst(false), 450);
        } else {
          hapticLight();
        }
        onToggle();
      }}
      title="Favorite"
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
    >
      <motion.span
        animate={
          burst
            ? { scale: [1, 1.45, 1], rotate: [0, -12, 0] }
            : { scale: 1, rotate: 0 }
        }
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="inline-flex"
      >
        <Star className={`${compact ? "h-4 w-4" : "h-5 w-5"} ${active ? "fill-current" : ""}`} />
      </motion.span>
    </Button>
  );
}
