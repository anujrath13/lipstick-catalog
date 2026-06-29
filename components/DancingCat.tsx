"use client";

import { motion } from "framer-motion";

type DancingCatProps = {
  size?: number;
  mode?: "idle" | "pull" | "dance" | "success";
  className?: string;
};

export function DancingCat({
  size = 44,
  mode = "idle",
  className = "",
}: DancingCatProps) {
  const isDancing = mode === "dance" || mode === "success";
  const bobDuration = mode === "dance" ? 0.32 : mode === "pull" ? 0.55 : 0.7;
  const sway = mode === "dance" ? 10 : mode === "pull" ? 5 : 3;

  return (
    <motion.div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      animate={{
        y: isDancing ? [0, -5, 0, -3, 0] : [0, -3, 0],
        rotate: isDancing ? [-sway, sway, -sway, sway, 0] : [-sway / 2, sway / 2, -sway / 2],
      }}
      transition={{
        repeat: Infinity,
        duration: bobDuration,
        ease: "easeInOut",
      }}
      aria-hidden
    >
      <svg viewBox="0 0 64 64" fill="none" className="h-full w-full">
        <ellipse cx="32" cy="40" rx="18" ry="14" fill="#fb7185" />
        <circle cx="32" cy="24" r="16" fill="#fda4af" />
        <path d="M18 14 L22 4 L28 16 Z" fill="#fda4af" />
        <path d="M46 14 L42 4 L36 16 Z" fill="#fda4af" />
        <path d="M18 14 L22 4 L24 12 Z" fill="#fb7185" />
        <path d="M46 14 L42 4 L40 12 Z" fill="#fb7185" />
        <circle cx="26" cy="24" r="2.5" fill="#3f3f46" />
        <circle cx="38" cy="24" r="2.5" fill="#3f3f46" />
        <circle cx="27" cy="23" r="0.8" fill="white" />
        <circle cx="39" cy="23" r="0.8" fill="white" />
        <ellipse cx="32" cy="29" rx="2.2" ry="1.6" fill="#fb7185" />
        <path
          d="M30 29 Q32 31 34 29"
          stroke="#be123c"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        <motion.g
          animate={{
            rotate: isDancing ? [-18, 18, -18] : [-8, 8, -8],
            y: isDancing ? [0, -2, 0] : 0,
          }}
          transition={{ repeat: Infinity, duration: bobDuration * 0.8, ease: "easeInOut" }}
          style={{ originX: "22px", originY: "42px" }}
        >
          <ellipse cx="22" cy="46" rx="5" ry="4" fill="#fda4af" />
        </motion.g>

        <motion.g
          animate={{
            rotate: isDancing ? [18, -18, 18] : [8, -8, 8],
            y: isDancing ? [0, -2, 0] : 0,
          }}
          transition={{
            repeat: Infinity,
            duration: bobDuration * 0.8,
            ease: "easeInOut",
            delay: bobDuration * 0.4,
          }}
          style={{ originX: "42px", originY: "42px" }}
        >
          <ellipse cx="42" cy="46" rx="5" ry="4" fill="#fda4af" />
        </motion.g>

        <motion.path
          d="M48 36 Q56 30 54 42 Q52 48 48 44"
          stroke="#fb7185"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          animate={{
            rotate: isDancing ? [-12, 12, -12] : [-6, 6, -6],
          }}
          transition={{ repeat: Infinity, duration: bobDuration, ease: "easeInOut" }}
          style={{ originX: "48px", originY: "38px" }}
        />

        {mode === "success" ? (
          <>
            <motion.circle
              cx="50"
              cy="12"
              r="7"
              fill="#34d399"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.15, 1] }}
              transition={{ duration: 0.35 }}
            />
            <motion.path
              d="M47 12 L49 14 L53 10"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.25, delay: 0.1 }}
            />
          </>
        ) : null}
      </svg>
    </motion.div>
  );
}
