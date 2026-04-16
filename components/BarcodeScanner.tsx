"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Html5QrcodeScanner,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type BarcodeScannerProps = {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
};

export default function BarcodeScanner({
  isOpen,
  onClose,
  onDetected,
}: BarcodeScannerProps) {
  const scannerRegionIdRef = useRef(`barcode-scanner-${Math.random().toString(36).slice(2)}`);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const hasRenderedRef = useRef(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    if (hasRenderedRef.current) return;

    hasRenderedRef.current = true;
    setErrorText("");

    const scanner = new Html5QrcodeScanner(
      scannerRegionIdRef.current,
      {
        fps: 10,
        qrbox: { width: 250, height: 120 },
        rememberLastUsedCamera: true,
        supportedScanTypes: [0, 1], // camera + file
        videoConstraints: {
          facingMode: { ideal: "environment" },
        },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.ITF,
        ],
      },
      false
    );

    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        onDetected(decodedText);
      },
      () => {
        // ignore scan errors while camera is searching
      }
    );

    return () => {
      hasRenderedRef.current = false;

      if (scannerRef.current) {
        scannerRef.current
          .clear()
          .catch((err) => {
            console.error("Failed to clear barcode scanner", err);
          })
          .finally(() => {
            scannerRef.current = null;
          });
      }
    };
  }, [isOpen, onDetected]);

  useEffect(() => {
    if (!isOpen && scannerRef.current) {
      scannerRef.current
        .clear()
        .catch((err) => {
          console.error("Failed to clear barcode scanner", err);
        })
        .finally(() => {
          scannerRef.current = null;
          hasRenderedRef.current = false;
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-2xl rounded-[28px] border border-rose-100 bg-white p-4 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Scan Barcode</h2>
            <p className="text-sm text-slate-600">
              Point your camera at the lipstick barcode, or upload a barcode image.
            </p>
          </div>

          <Button
            variant="outline"
            className="rounded-2xl border-rose-100"
            onClick={onClose}
          >
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
        </div>

        {errorText ? (
          <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorText}
          </div>
        ) : null}

        <div
          id={scannerRegionIdRef.current}
          className="overflow-hidden rounded-2xl border border-rose-100"
        />
      </div>
    </div>
  );
}