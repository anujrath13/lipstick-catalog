"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

type MobileMenuDrawerProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function MobileMenuDrawer({ open, onClose, children }: MobileMenuDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[1px] md:hidden"
            aria-label="Close menu"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="fixed inset-x-0 top-0 z-[80] flex max-h-[min(92vh,820px)] flex-col overflow-hidden rounded-b-[28px] bg-[#fff9fc] shadow-2xl md:hidden"
            style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
            role="dialog"
            aria-modal="true"
            aria-label="Library menu"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-rose-100/70 px-4 py-3">
              <p className="font-heading text-lg font-semibold text-zinc-900">Menu</p>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-zinc-500 hover:bg-rose-50"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto overscroll-contain px-4 py-4">{children}</div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
