"use client";

import { Download, Share, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "lipstick-pwa-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function PwaInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) || isStandalone()) return;

    if (isIos()) {
      setShowIosHint(true);
      setVisible(true);
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    setDeferredPrompt(null);
    dismiss();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 lg:hidden">
      <div className="mx-auto max-w-md rounded-2xl border border-rose-100 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-900">Install as app</p>
            <p className="text-xs leading-5 text-zinc-500">
              {showIosHint
                ? "Free — tap Share, then Add to Home Screen. No app store needed."
                : "Free — add to your home screen for quick access. No app store needed."}
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-full p-1 text-zinc-400 hover:bg-rose-50 hover:text-zinc-600"
            aria-label="Dismiss install prompt"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          {showIosHint ? (
            <div className="flex w-full items-center gap-2 rounded-xl border border-rose-100 bg-rose-50/70 px-3 py-2 text-xs text-rose-700">
              <Share className="h-4 w-4 shrink-0" />
              <span>Share → Add to Home Screen</span>
            </div>
          ) : (
            <Button
              className="w-full rounded-xl bg-zinc-950 text-white hover:bg-zinc-800"
              onClick={() => void install()}
            >
              <Download className="mr-2 h-4 w-4" />
              Install app
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
