"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BarcodeScanner from "@/components/BarcodeScanner";
import {
  Search,
  Plus,
  Trash2,
  Package2,
  Sparkles,
  Calendar,
  Tag,
  LogOut,
  ChevronDown,
  ChevronUp,
  Share2,
  X,
  RotateCcw,
  SlidersHorizontal,
  Star,
  Funnel,
  ArrowUpDown,
  Heart,
  Pencil,
  Download,
  Camera,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type LipstickItem = {
  id: number;
  ownerUserId: string;
  brand: string;
  shade: string;
  type: string;
  finish: string;
  undertone: string;
  colorFamily: string;
  status: string;
  purchaseDate: string;
  occasion: string;
  notes: string;
  favorite: boolean;
  deletedAt: string | null;
  barcode: string;
  image_url_1: string | null;
  image_url_2: string | null;
  priceTier: string;
};

type ProfileRow = {
  id: string;
  email: string;
};

type ShareRow = {
  id: number;
  lipstick_id: number;
  shared_with_user_id: string;
};

type LipstickFormValues = {
  brand: string;
  shade: string;
  type: string;
  finish: string;
  undertone: string;
  colorFamily: string;
  status: string;
  purchaseDate: string;
  occasion: string;
  notes: string;
  barcode: string;
  image_url_1: string;
  image_url_2: string;
  priceTier: string;
};

const INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000;
const REMEMBER_ME_TIMEOUT_MS = 720 * 60 * 60 * 1000; // 30 day
const LAST_ACTIVITY_KEY = "lipstick_last_activity_at";
const REMEMBER_ME_KEY = "lipstick_remember_me";
const LAST_EMAIL_KEY = "lipstick_last_email";

const todayString = () => new Date().toISOString().split("T")[0];

const emptyForm: LipstickFormValues = {
  brand: "",
  shade: "",
  type: "",
  finish: "",
  undertone: "",
  colorFamily: "",
  status: "",
  purchaseDate: "",
  occasion: "",
  notes: "",
  barcode: "",
  image_url_1: "",
  image_url_2: "",
  priceTier: "",
};

const colorFamilyMap: Record<
  string,
  { dot: string; soft: string; ring: string; label: string }
> = {
  Red: {
    dot: "bg-rose-500",
    soft: "from-rose-50 to-white",
    ring: "border-rose-200",
    label: "text-rose-700",
  },
  Pink: {
    dot: "bg-pink-400",
    soft: "from-pink-50 to-white",
    ring: "border-pink-200",
    label: "text-pink-700",
  },
  Berry: {
    dot: "bg-fuchsia-500",
    soft: "from-fuchsia-50 to-white",
    ring: "border-fuchsia-200",
    label: "text-fuchsia-700",
  },
  Brown: {
    dot: "bg-amber-700",
    soft: "from-amber-50 to-white",
    ring: "border-amber-200",
    label: "text-amber-800",
  },
  Nude: {
    dot: "bg-stone-300",
    soft: "from-stone-50 to-white",
    ring: "border-stone-200",
    label: "text-stone-700",
  },
  Coral: {
    dot: "bg-orange-400",
    soft: "from-orange-50 to-white",
    ring: "border-orange-200",
    label: "text-orange-700",
  },
  Mauve: {
    dot: "bg-violet-400",
    soft: "from-violet-50 to-white",
    ring: "border-violet-200",
    label: "text-violet-700",
  },
};

export default function LipstickCatalogApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authMessage, setAuthMessage] = useState("");
  const [isLoginSuccessAnimating, setIsLoginSuccessAnimating] = useState(false);

  const [items, setItems] = useState<LipstickItem[]>([]);
  const [shareRows, setShareRows] = useState<ShareRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sharingLipstickId, setSharingLipstickId] = useState<number | null>(null);


  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priceTierFilter, setPriceTierFilter] = useState("all");
  const [finishFilter, setFinishFilter] = useState("all");
  const [undertoneFilter, setUndertoneFilter] = useState("all");
  const [colorFamilyFilter, setColorFamilyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [favoritesFilter, setFavoritesFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [ownershipFilter, setOwnershipFilter] = useState("all");
  const [quickTab, setQuickTab] = useState<"all" | "owned" | "shared" | "trash">("all");

  const [form, setForm] = useState<LipstickFormValues>(emptyForm);
  const [editingLipstickId, setEditingLipstickId] = useState<number | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  useEffect(() => {
    if (compareIds.length === 2) {
      setIsCompareOpen(true);
    }
  }, [compareIds]);

  const [isScanning, setIsScanning] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [imageFile1, setImageFile1] = useState<File | null>(null);
  const [imageFile2, setImageFile2] = useState<File | null>(null);

  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [shareEmails, setShareEmails] = useState<Record<number, string>>({});
  const [shareMessages, setShareMessages] = useState<Record<number, string>>({});
  const [shareModalItem, setShareModalItem] = useState<LipstickItem | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [pendingSave, setPendingSave] = useState<(() => Promise<void>) | null>(null);

  const inactivityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const brandInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const getStoragePathFromPublicUrl = (url: string | null | undefined) => {
    if (!url) return null;

    try {
      const parsed = new URL(url);
      const marker = "/storage/v1/object/public/lipstick-images/";
      const index = parsed.pathname.indexOf(marker);

      if (index === -1) return null;

      return decodeURIComponent(parsed.pathname.slice(index + marker.length));
    } catch {
      return null;
    }
  };

  const deleteStorageFiles = async (paths: string[]) => {
    if (paths.length === 0) return;

    const { error } = await supabase.storage
      .from("lipstick-images")
      .remove(paths);

    if (error) {
      throw error;
    }
  };

  const isEditing = editingLipstickId !== null;
  const handleBarcodeDetected = async (barcode: string) => {
    try {
      setIsBarcodeScannerOpen(false);
      setIsScanning(true);
      resetForm();
      setIsAddFormOpen(true);

      const res = await fetch("/api/lookup-barcode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ barcode }),
      });

      const data = await res.json();

      if (!res.ok) {
        showNotice("error", data?.error || "Failed to process barcode.");
        return;
      }

      const scanned = data?.result ?? {};

      setEditingLipstickId(null);

      setForm({
        ...emptyForm,
        brand: typeof scanned.brand === "string" ? scanned.brand : "",
        shade: extractShadeName(scanned.shade),
        type: typeof scanned.type === "string" ? scanned.type : "",
        finish: typeof scanned.finish === "string" ? scanned.finish : "",
        undertone: typeof scanned.undertone === "string" ? scanned.undertone : "",
        colorFamily: typeof scanned.colorFamily === "string" ? scanned.colorFamily : "",
        priceTier: typeof scanned.priceTier === "string" ? scanned.priceTier : "",
        status:
          typeof scanned.status === "string" && scanned.status.trim()
            ? scanned.status
            : "Owned",
        purchaseDate: "",
        occasion: typeof scanned.occasion === "string" ? scanned.occasion : "",
        notes:
          typeof scanned.notes === "string" && scanned.notes.trim()
            ? scanned.notes
            : typeof scanned.shade === "string" && scanned.shade.trim()
              ? `Full scanned title: ${scanned.shade}`
              : `Barcode: ${barcode}`,
        barcode:
          typeof scanned.barcode === "string"
            ? scanned.barcode
            : barcode,
        image_url_1: "",
        image_url_2: "",
      });

      showNotice("success", `Barcode scanned: ${barcode}`);
    } catch (error) {
      console.error(error);
      showNotice("error", "Could not process barcode.");
    } finally {
      setIsScanning(false);
    }
  };

  const showNotice = (type: "success" | "error", text: string) => {
    setNotice({ type, text });
    if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current);
    noticeTimeoutRef.current = setTimeout(() => setNotice(null), 3000);
  };

  const convertFileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Could not read image file."));
        }
      };

      reader.onerror = () => reject(new Error("Failed to read image file."));
      reader.readAsDataURL(file);
    });

  const normalizeScannedValue = (value: unknown) =>
    typeof value === "string" ? value.trim() : "";

  const extractShadeName = (value: unknown) => {
    if (typeof value !== "string") return "";

    const cleaned = value.trim();
    if (!cleaned) return "";

    const parts = cleaned
      .split(" - ")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length >= 2) {
      const withoutSize = parts.filter(
        (part) => !/^\d+(\.\d+)?\s?(oz|g|ml)$/i.test(part)
      );

      if (withoutSize.length >= 2) {
        return withoutSize[withoutSize.length - 1];
      }

      return parts[parts.length - 1];
    }

    return cleaned;
  };

  const compressImage = (file: File): Promise<File> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const img = new Image();

        img.onload = () => {
          const maxWidth = 1200;
          const maxHeight = 1200;

          let { width, height } = img;

          if (width > maxWidth || height > maxHeight) {
            const scale = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not create image canvas."));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Could not compress image."));
                return;
              }

              const compressedFile = new File(
                [blob],
                file.name.replace(/\.(png|jpg|jpeg|webp)$/i, ".jpg"),
                { type: "image/jpeg" }
              );

              resolve(compressedFile);
            },
            "image/jpeg",
            0.75
          );
        };

        img.onerror = () => reject(new Error("Could not load image."));
        img.src = typeof reader.result === "string" ? reader.result : "";
      };

      reader.onerror = () => reject(new Error("Could not read image."));
      reader.readAsDataURL(file);
    });

  const uploadLipstickImage = async (file: File) => {
    if (!session?.user?.id) {
      throw new Error("You must be signed in to upload images.");
    }

    const compressedFile = await compressImage(file);

    const fileExt = "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `${session.user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("lipstick-images")
      .upload(filePath, compressedFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: "image/jpeg",
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);
      throw new Error(uploadError.message || "Image upload failed.");
    }

    const { data } = supabase.storage
      .from("lipstick-images")
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error("Could not get uploaded image URL.");
    }

    return data.publicUrl;
  };

  const updateForm = (field: keyof LipstickFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingLipstickId(null);
    setImageFile1(null);
    setImageFile2(null);
  };

  const handleScanFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showNotice("error", "Please upload an image file.");
      e.target.value = "";
      return;
    }

    try {
      setIsScanning(true);
      resetForm();
      setIsAddFormOpen(true);

      const imageDataUrl = await convertFileToDataUrl(file);

      const res = await fetch("/api/scan-lipstick", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageDataUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        showNotice("error", data?.error || "Failed to scan lipstick.");
        return;
      }

      const scanned = data?.result ?? {};

      setEditingLipstickId(null);

      setForm({
        ...emptyForm,
        brand: normalizeScannedValue(scanned.brand),
        shade: extractShadeName(scanned.shade),
        type: normalizeScannedValue(scanned.type),
        finish: normalizeScannedValue(scanned.finish),
        undertone: normalizeScannedValue(scanned.undertone),
        colorFamily: normalizeScannedValue(scanned.colorFamily),
        priceTier: normalizeScannedValue(scanned.priceTier),
        status: normalizeScannedValue(scanned.status) || "Owned",
        occasion: normalizeScannedValue(scanned.occasion),
        notes:
          normalizeScannedValue(scanned.notes) ||
          (typeof scanned.shade === "string" && scanned.shade.trim()
            ? `Full scanned title: ${scanned.shade}`
            : ""),
        barcode: normalizeScannedValue(scanned.barcode),
        image_url_1: "",
        image_url_2: "",
      });

      showNotice("success", "Lipstick scanned. Review and save.");
    } catch (error) {
      console.error(error);
      showNotice("error", "Could not scan this image.");
    } finally {
      setIsScanning(false);
      e.target.value = "";
    }
  };

  useEffect(() => {
    return () => {
      if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const savedEmail = localStorage.getItem(LAST_EMAIL_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  useEffect(() => {
    if (isAddFormOpen) {
      const timer = setTimeout(() => {
        brandInputRef.current?.focus();
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [isAddFormOpen]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      void refreshDataOnly();
    } else {
      setItems([]);
      setShareRows([]);
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!session) {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
      return;
    }

    const updateLastActivity = () => {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    };

    const checkInactivity = async () => {
      const rememberMeEnabled = localStorage.getItem(REMEMBER_ME_KEY) === "true";
      const timeoutMs = rememberMeEnabled
        ? REMEMBER_ME_TIMEOUT_MS
        : INACTIVITY_TIMEOUT_MS;

      const lastActivityRaw = localStorage.getItem(LAST_ACTIVITY_KEY);

      if (!lastActivityRaw) {
        const now = Date.now();
        localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());

        if (inactivityTimeoutRef.current) {
          clearTimeout(inactivityTimeoutRef.current);
        }

        inactivityTimeoutRef.current = setTimeout(async () => {
          await supabase.auth.signOut();
          localStorage.removeItem(LAST_ACTIVITY_KEY);
          setAuthMessage(
            rememberMeEnabled
              ? "You were logged out after 30 days of inactivity."
              : "You were logged out after 20 minutes of inactivity."
          );
        }, timeoutMs);

        return;
      }

      const lastActivity = Number(lastActivityRaw);
      const now = Date.now();

      if (Number.isNaN(lastActivity)) {
        localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
        return;
      }

      if (now - lastActivity >= timeoutMs) {
        if (inactivityTimeoutRef.current) {
          clearTimeout(inactivityTimeoutRef.current);
          inactivityTimeoutRef.current = null;
        }

        await supabase.auth.signOut();
        localStorage.removeItem(LAST_ACTIVITY_KEY);

        setAuthMessage(
          rememberMeEnabled
            ? "You were logged out after 30 days of inactivity."
            : "You were logged out after 20 minutes of inactivity."
        );
        return;
      }

      const remainingTime = timeoutMs - (now - lastActivity);

      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }

      inactivityTimeoutRef.current = setTimeout(async () => {
        await supabase.auth.signOut();
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        setAuthMessage(
          rememberMeEnabled
            ? "You were logged out after 30 days of inactivity."
            : "You were logged out after 20 minutes of inactivity."
        );
      }, remainingTime);
    };

    const handleActivity = () => {
      updateLastActivity();
      void checkInactivity();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkInactivity();
      }
    };

    const handleWindowFocus = () => {
      void checkInactivity();
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    if (!localStorage.getItem(LAST_ACTIVITY_KEY)) {
      updateLastActivity();
    }

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true });
    });

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);

    void checkInactivity();

    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }

      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });

      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [session]);

  const toggleExpanded = (id: number) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const toggleCompareSelection = (id: number) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((itemId) => itemId !== id);
      }

      if (prev.length >= 2) {
        showNotice("error", "You can compare up to 2 lipsticks.");
        return prev;
      }

      return [...prev, id];
    });
  };

  const openCompare = () => {
    if (compareIds.length !== 2) {
      showNotice("error", "Select 2 lipsticks to compare.");
      return;
    }

    setIsCompareOpen(true);
  };

  const clearCompare = () => {
    setCompareIds([]);
    setIsCompareOpen(false);
  };

  const clearFilters = (showToast = true) => {
    setQuery("");
    setTypeFilter("all");
    setFinishFilter("all");
    setUndertoneFilter("all");
    setColorFamilyFilter("all");
    setPriceTierFilter("all");
    setStatusFilter("all");
    setOwnershipFilter("all");
    setFavoritesFilter("all");
    setSortBy("newest");
    setQuickTab("all");

    if (showToast) {
      showNotice("success", "Filters cleared.");
    }
  };

  const startAddLipstick = () => {
    setForm({
      brand: "",
      shade: "",
      type: "",
      finish: "",
      undertone: "",
      colorFamily: "",
      priceTier: "",
      status: "",
      purchaseDate: "",
      occasion: "",
      notes: "",
      barcode: "",
      image_url_1: "",
      image_url_2: "",
    });
    setEditingLipstickId(null);
    setImageFile1(null);
    setImageFile2(null);
    setIsAddFormOpen(true);
  };

  const handleCancelForm = () => {
    resetForm();
    setIsAddFormOpen(false);
  };

  const startEditLipstick = (item: LipstickItem) => {
    setForm({
      brand: item.brand,
      shade: item.shade,
      type: item.type,
      finish: item.finish,
      undertone: item.undertone,
      colorFamily: item.colorFamily,
      priceTier: item.priceTier,
      status: item.status,
      purchaseDate: item.purchaseDate,
      occasion: item.occasion,
      notes: item.notes,
      barcode: item.barcode,
      image_url_1: item.image_url_1 ?? "",
      image_url_2: item.image_url_2 ?? "",
    });
    setEditingLipstickId(item.id);
    setIsAddFormOpen(true);
  };

  const handleRefreshView = async () => {
    setExpandedItems([]);
    setIsAddFormOpen(false);
    setIsFiltersOpen(false);
    resetForm();
    clearFilters(false);
    await refreshDataOnly();
    showNotice("success", "Library refreshed.");
  };

  const exportVisibleItemsToCsv = () => {
    if (visibleItems.length === 0) {
      showNotice("error", "No lipsticks to export.");
      return;
    }

    const headers = [
      "Brand",
      "Shade",
      "Type",
      "Finish",
      "Undertone",
      "Color Family",
      "Price Tier",
      "Status",
      "Purchase Date",
      "Occasion",
      "Notes",
      "Favorite",
      "Ownership",
      "Deleted At",
    ];

    const escapeCsvValue = (value: string | number | boolean | null | undefined) => {
      const stringValue = String(value ?? "");
      if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
      ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const rows = visibleItems.map((item) => {
      const ownership =
        item.ownerUserId === session?.user?.id ? "Owned" : "Shared";

      return [
        item.brand,
        item.shade,
        item.type,
        item.finish,
        item.undertone,
        item.colorFamily,
        item.priceTier,
        item.status,
        item.purchaseDate,
        item.occasion,
        item.notes,
        item.favorite ? "Yes" : "No",
        ownership,
        item.deletedAt ?? "",
      ].map(escapeCsvValue);
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStamp = new Date().toISOString().split("T")[0];

    link.href = url;
    link.setAttribute("download", `lipstick-library-${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    showNotice("success", "CSV exported.");
  };

  async function ensureProfileRow(userId: string, userEmail: string | null) {
    if (!userEmail) return;

    const normalizedEmail = userEmail.trim().toLowerCase();

    const { error } = await supabase.from("profiles").upsert(
      {
        id: userId,
        email: normalizedEmail,
      },
      { onConflict: "id" }
    );

    if (error) {
      console.error("Error ensuring profile row:", error);
    }
  }

  async function fetchLipsticks() {
    if (!session?.user?.id) return;

    await ensureProfileRow(session.user.id, session.user.email ?? null);

    const { data, error } = await supabase
      .from("lipsticks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading lipsticks:", error);
      return;
    }

    const mapped: LipstickItem[] = (data ?? []).map((item) => ({
      id: item.id,
      ownerUserId: item.owner_user_id,
      brand: item.brand,
      shade: item.shade,
      type: item.type,
      finish: item.finish,
      undertone: item.undertone,
      colorFamily: item.color_family,
      priceTier: item.price_tier ?? "",
      status: item.status,
      purchaseDate: item.purchase_date ?? "",
      occasion: item.occasion,
      notes: item.notes ?? "",
      favorite: item.favorite ?? false,
      deletedAt: item.deleted_at ?? null,
      barcode: item.barcode ?? "",
      image_url_1: item.image_url_1 ?? "",
      image_url_2: item.image_url_2 ?? "",
    }));

    setItems(mapped);
  }

  async function fetchShareRows() {
    if (!session?.user?.id) return;

    const { data, error } = await supabase
      .from("lipstick_shares")
      .select("id, lipstick_id, shared_with_user_id");

    if (error) {
      console.error("Error loading share rows:", error);
      return;
    }

    setShareRows(data ?? []);
  }

  async function refreshDataOnly() {
    if (!session?.user?.id) return;
    setLoading(true);
    await Promise.all([fetchLipsticks(), fetchShareRows()]);
    setLoading(false);
  }

  async function handleForgotPassword() {
    setAuthMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setAuthMessage("Please enter your email first.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setAuthMessage("Password reset email sent. Check your inbox.");
  }

  async function handleAuth() {
    setAuthMessage("");

    if (!email.trim() || !password.trim()) {
      setAuthMessage("Please enter both email and password.");
      return;
    }

    if (authMode === "signup") {
      const normalizedEmail = email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (error) {
        setAuthMessage(error.message);
        return;
      }

      if (data.user) {
        await ensureProfileRow(data.user.id, data.user.email ?? normalizedEmail);
      }

      localStorage.setItem(LAST_EMAIL_KEY, normalizedEmail);

      setEmail(normalizedEmail);
      setPassword("");
      setAuthMessage(
        "Account created. If email confirmation is enabled, check your inbox."
      );
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    localStorage.setItem(REMEMBER_ME_KEY, rememberMe ? "true" : "false");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      setAuthMessage(error.message);
      return;
    }

    if (data.user) {
      await ensureProfileRow(data.user.id, data.user.email ?? normalizedEmail);
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      localStorage.setItem(REMEMBER_ME_KEY, rememberMe ? "true" : "false");
      localStorage.setItem(LAST_EMAIL_KEY, normalizedEmail);

      setEmail(normalizedEmail);
      setPassword("");
      setAuthMessage("Signed in.");
      setIsLoginSuccessAnimating(true);

      setTimeout(() => {
        setIsLoginSuccessAnimating(false);
      }, 2200);
    }
  }

  async function handleSignOut() {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }

    localStorage.removeItem(LAST_ACTIVITY_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
    await supabase.auth.signOut();
  }

  const validateForm = () => {
    if (!form.brand.trim() || !form.shade.trim()) {
      showNotice("error", "Brand and shade are required.");
      return false;
    }

    return true;
  };

  const performSave = async () => {
    if (!session?.user?.id) return;

    setIsSaving(true);

    try {
      let image_url_1 = form.image_url_1 || "";
      let image_url_2 = form.image_url_2 || "";

      if (imageFile1) {
        image_url_1 = await uploadLipstickImage(imageFile1);
      }

      if (imageFile2) {
        image_url_2 = await uploadLipstickImage(imageFile2);
      }

      const basePayload = {
        brand: form.brand.trim(),
        shade: form.shade.trim(),
        type: form.type,
        finish: form.finish,
        undertone: form.undertone,
        color_family: form.colorFamily,
        price_tier: form.priceTier,
        status: form.status,
        purchase_date: form.purchaseDate || todayString(),
        occasion: form.occasion,
        notes: form.notes.trim(),
        barcode: form.barcode.trim() || null,
        image_url_1: image_url_1 || null,
        image_url_2: image_url_2 || null,
      };

      if (isEditing && editingLipstickId !== null) {
        try {
          const { data: existingLipstick, error: existingError } = await supabase
            .from("lipsticks")
            .select("image_url_1, image_url_2")
            .eq("id", editingLipstickId)
            .single();

          if (existingError) {
            throw existingError;
          }

          const { error: updateError } = await supabase
            .from("lipsticks")
            .update(basePayload)
            .eq("id", editingLipstickId);

          if (updateError) {
            throw updateError;
          }

          const oldImage1 = existingLipstick?.image_url_1 ?? null;
          const oldImage2 = existingLipstick?.image_url_2 ?? null;

          const newImage1 = basePayload.image_url_1 ?? null;
          const newImage2 = basePayload.image_url_2 ?? null;

          const pathsToDelete: string[] = [];

          if (oldImage1 && oldImage1 !== newImage1) {
            const oldPath1 = getStoragePathFromPublicUrl(oldImage1);
            if (oldPath1) pathsToDelete.push(oldPath1);
          }

          if (oldImage2 && oldImage2 !== newImage2) {
            const oldPath2 = getStoragePathFromPublicUrl(oldImage2);
            if (oldPath2) pathsToDelete.push(oldPath2);
          }

          if (pathsToDelete.length > 0) {
            await deleteStorageFiles(pathsToDelete);
          }

          resetForm();
          setIsAddFormOpen(false);
          await refreshDataOnly();
          setExpandedItems((prev) =>
            prev.includes(editingLipstickId) ? prev : [editingLipstickId, ...prev]
          );
          showNotice("success", "Lipstick updated.");
          return;
        } catch (error) {
          console.error("Error updating lipstick:", error);
          showNotice("error", "Could not update lipstick.");
          return;
        }
      }

      const insertPayload = {
        owner_user_id: session.user.id,
        favorite: false,
        ...basePayload,
      };

      const { error } = await supabase.from("lipsticks").insert(insertPayload);

      if (error) {
        console.error("Error saving lipstick:", error);
        showNotice("error", "Could not save lipstick.");
        return;
      }

      resetForm();
      setIsAddFormOpen(false);
      await refreshDataOnly();
      showNotice("success", "Lipstick added.");
    } catch (error: unknown) {
      console.error("Error uploading or saving lipstick:", error);

      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "Could not upload photo or save lipstick.";

      showNotice("error", message);
    } finally {
      setIsSaving(false);
    }
  };

  const saveLipstick = async () => {
    if (!session?.user?.id) return;
    if (!validateForm()) return;

    const normalizedShade = form.shade.trim();
    const normalizedBrand = form.brand.trim();

    let query = supabase
      .from("lipsticks")
      .select("id, brand, shade")
      .ilike("shade", normalizedShade)
      .ilike("brand", normalizedBrand)
      .is("deleted_at", null)
      .limit(1);

    if (editingLipstickId !== null) {
      query = query.neq("id", editingLipstickId);
    }

    const { data: duplicate, error } = await query.maybeSingle();

    if (error) {
      console.error("Error checking duplicate lipstick:", error);
      showNotice("error", "Could not check for duplicates.");
      return;
    }

    if (duplicate) {
      setShowDuplicateDialog(true);
      setPendingSave(() => performSave);
      return;
    }

    await performSave();
  };

  const deleteOwnedLipstick = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to move this lipstick to Trash?"
    );
    if (!confirmed) return;

    const { error } = await supabase
      .from("lipsticks")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Error moving lipstick to trash:", error);
      showNotice("error", "Could not move lipstick to Trash.");
      return;
    }

    if (editingLipstickId === id) {
      resetForm();
      setIsAddFormOpen(false);
    }

    await refreshDataOnly();
    showNotice("success", "Lipstick moved to Trash.");
  };

  const restoreLipstick = async (id: number) => {
    const { error } = await supabase
      .from("lipsticks")
      .update({ deleted_at: null })
      .eq("id", id);

    if (error) {
      console.error("Error restoring lipstick:", error);
      showNotice("error", "Could not restore lipstick.");
      return;
    }

    await refreshDataOnly();
    showNotice("success", "Lipstick restored.");
  };

  const permanentlyDeleteLipstick = async (id: number) => {
    const confirmed = window.confirm(
      "This will permanently delete the lipstick. This cannot be undone. Continue?"
    );
    if (!confirmed) return;

    try {
      const { data: lipstick, error: fetchError } = await supabase
        .from("lipsticks")
        .select("image_url_1, image_url_2")
        .eq("id", id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const pathsToDelete = [
        getStoragePathFromPublicUrl(lipstick?.image_url_1),
        getStoragePathFromPublicUrl(lipstick?.image_url_2),
      ].filter((path): path is string => Boolean(path));

      if (pathsToDelete.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("lipstick-images")
          .remove(pathsToDelete);

        if (storageError) {
          throw storageError;
        }
      }

      const { error } = await supabase.from("lipsticks").delete().eq("id", id);

      if (error) {
        throw error;
      }

      await refreshDataOnly();
      showNotice("success", "Lipstick permanently deleted.");
    } catch (error) {
      console.error("Error permanently deleting lipstick:", error);
      showNotice("error", "Could not permanently delete lipstick.");
    }
  };

  const removeSharedLipstick = async (lipstickId: number) => {
    if (!session?.user?.id) return;

    const matchingShare = shareRows.find(
      (row) =>
        row.lipstick_id === lipstickId &&
        row.shared_with_user_id === session.user.id
    );

    if (!matchingShare) {
      showNotice("error", "Could not find shared item.");
      return;
    }

    const { error } = await supabase
      .from("lipstick_shares")
      .delete()
      .eq("id", matchingShare.id);

    if (error) {
      console.error("Error removing shared lipstick:", error);
      showNotice("error", "Could not remove item.");
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== lipstickId));
    setShareRows((prev) => prev.filter((row) => row.id !== matchingShare.id));
    setExpandedItems((prev) => prev.filter((itemId) => itemId !== lipstickId));
    showNotice("success", "Removed from your list.");
  };

  const shareLipstick = async (lipstickId: number) => {
    if (!session?.user?.id || !session.user.email) return;

    const emailToShare = (shareEmails[lipstickId] ?? "").trim().toLowerCase();

    if (!emailToShare) {
      setShareMessages((prev) => ({
        ...prev,
        [lipstickId]: "Enter an email to share with.",
      }));
      return;
    }

    if (emailToShare === session.user.email.toLowerCase()) {
      setShareMessages((prev) => ({
        ...prev,
        [lipstickId]: "You already own this lipstick.",
      }));
      return;
    }

    setShareMessages((prev) => ({
      ...prev,
      [lipstickId]: "",
    }));

    setSharingLipstickId(lipstickId);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", emailToShare)
      .single<ProfileRow>();

    if (profileError || !profile) {
      setSharingLipstickId(null);
      setShareMessages((prev) => ({
        ...prev,
        [lipstickId]: "No user found with that email.",
      }));
      return;
    }

    const alreadyShared = shareRows.some(
      (row) =>
        row.lipstick_id === lipstickId &&
        row.shared_with_user_id === profile.id
    );

    if (alreadyShared) {
      setSharingLipstickId(null);
      setShareMessages((prev) => ({
        ...prev,
        [lipstickId]: "This lipstick is already shared with that user.",
      }));
      return;
    }

    const { error: shareError } = await supabase.from("lipstick_shares").insert({
      lipstick_id: lipstickId,
      shared_with_user_id: profile.id,
    });

    setSharingLipstickId(null);

    if (shareError) {
      setShareMessages((prev) => ({
        ...prev,
        [lipstickId]: shareError.message,
      }));
      return;
    }

    setShareMessages((prev) => ({
      ...prev,
      [lipstickId]: "Shared successfully.",
    }));

    setShareEmails((prev) => ({
      ...prev,
      [lipstickId]: "",
    }));

    await fetchShareRows();
    setSharingLipstickId(null);
    setShareModalItem(null);
    showNotice("success", "Lipstick shared.");
  };



  const toggleFavorite = async (id: number) => {
    const currentItem = items.find((item) => item.id === id);
    if (!currentItem || currentItem.deletedAt) return;

    const nextFavorite = !currentItem.favorite;

    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, favorite: nextFavorite } : item
      )
    );

    const { error } = await supabase
      .from("lipsticks")
      .update({ favorite: nextFavorite })
      .eq("id", id);

    if (error) {
      console.error("Error updating favorite:", error);

      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, favorite: !nextFavorite } : item
        )
      );

      showNotice("error", "Could not update favorite.");
      return;
    }
  };

  const visibleItems = useMemo(() => {
    const filtered = items.filter((item) => {
      const text =
        `${item.brand} ${item.shade} ${item.type} ${item.finish} ${item.undertone} ${item.colorFamily} ${item.priceTier} ${item.status} ${item.occasion} ${item.notes}`.toLowerCase();

      const matchesQuery = text.includes(query.toLowerCase());
      const matchesType = typeFilter === "all" || item.type === typeFilter;
      const matchesFinish = finishFilter === "all" || item.finish === finishFilter;
      const matchesUndertone =
        undertoneFilter === "all" || item.undertone === undertoneFilter;
      const matchesColorFamily =
        colorFamilyFilter === "all" || item.colorFamily === colorFamilyFilter;
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesPriceTier =
        priceTierFilter === "all" || item.priceTier === priceTierFilter;

      const isOwnedByYou = session?.user?.id === item.ownerUserId;
      const isSharedWithYou = session?.user?.id !== item.ownerUserId;
      const isDeleted = !!item.deletedAt;

      if (quickTab !== "trash" && isDeleted) return false;

      const matchesOwnership =
        ownershipFilter === "all" ||
        (ownershipFilter === "owned" && isOwnedByYou) ||
        (ownershipFilter === "shared" && isSharedWithYou);

      const matchesQuickTab =
        (quickTab === "all" && !isDeleted) ||
        (quickTab === "owned" && isOwnedByYou && !isDeleted) ||
        (quickTab === "shared" && isSharedWithYou && !isDeleted) ||
        (quickTab === "trash" && isOwnedByYou && isDeleted);

      const matchesFavorite =
        favoritesFilter === "all" ||
        (favoritesFilter === "favorites" && item.favorite) ||
        (favoritesFilter === "nonfavorites" && !item.favorite);

      return (
        matchesQuery &&
        matchesType &&
        matchesFinish &&
        matchesUndertone &&
        matchesColorFamily &&
        matchesStatus &&
        matchesPriceTier &&
        matchesOwnership &&
        matchesQuickTab &&
        matchesFavorite
      );
    });


    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "newest") return b.id - a.id;
      if (sortBy === "oldest") return a.id - b.id;
      if (sortBy === "brand-az") return a.brand.localeCompare(b.brand);
      if (sortBy === "brand-za") return b.brand.localeCompare(a.brand);
      if (sortBy === "shade-az") return a.shade.localeCompare(b.shade);
      if (sortBy === "favorites-first") return Number(!!b.favorite) - Number(!!a.favorite);
      return 0;
    });

    return sorted;
  }, [
    items,
    query,
    typeFilter,
    finishFilter,
    undertoneFilter,
    colorFamilyFilter,
    priceTierFilter,
    statusFilter,
    ownershipFilter,
    quickTab,
    favoritesFilter,
    sortBy,
    session,
  ]);

  const activeFilterChips = [
    typeFilter !== "all" ? { key: "type", label: typeFilter } : null,
    finishFilter !== "all" ? { key: "finish", label: finishFilter } : null,
    undertoneFilter !== "all" ? { key: "undertone", label: undertoneFilter } : null,
    colorFamilyFilter !== "all" ? { key: "colorFamily", label: colorFamilyFilter } : null,
    priceTierFilter !== "all" ? { key: "priceTier", label: priceTierFilter } : null,
    statusFilter !== "all" ? { key: "status", label: statusFilter } : null,
    ownershipFilter !== "all"
      ? { key: "ownership", label: ownershipFilter }
      : null,
    favoritesFilter !== "all"
      ? { key: "favorites", label: favoritesFilter }
      : null,
  ].filter(Boolean) as { key: string; label: string }[];

  const compareItems = items.filter((item) => compareIds.includes(item.id));
  const compareItem1 = compareItems[0] ?? null;
  const compareItem2 = compareItems[1] ?? null;

  const totalOwned = items.filter(
    (x) => x.ownerUserId === session?.user?.id && !x.deletedAt
  ).length;
  const totalShared = items.filter(
    (x) => x.ownerUserId !== session?.user?.id && !x.deletedAt
  ).length;
  const totalFavorites = items.filter((x) => x.favorite && !x.deletedAt).length;
  const totalTrash = items.filter(
    (x) => x.ownerUserId === session?.user?.id && !!x.deletedAt
  ).length;

  const activeItems = items.filter((item) => !item.deletedAt);

  const totalActive = activeItems.length;

  const totalWishlist = activeItems.filter((item) => item.status === "Wishlist").length;

  const favoritesPercent =
    totalActive > 0 ? Math.round((totalFavorites / totalActive) * 100) : 0;

  const colorFamilyCounts = activeItems.reduce<Record<string, number>>((acc, item) => {
    const key = item.colorFamily?.trim() || "Unspecified";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const finishCounts = activeItems.reduce<Record<string, number>>((acc, item) => {
    const key = item.finish?.trim() || "Unspecified";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const colorFamilyStats = Object.entries(colorFamilyCounts)
    .sort((a, b) => b[1] - a[1]);

  const finishStats = Object.entries(finishCounts)
    .sort((a, b) => b[1] - a[1]);

  const ownershipBadgeClasses = (isOwnedByYou: boolean) =>
    isOwnedByYou
      ? "border-green-200 bg-green-100 text-green-800"
      : "border-yellow-200 bg-yellow-100 text-yellow-800";

  const getColorData = (colorFamily: string) =>
    colorFamilyMap[colorFamily] ?? {
      dot: "bg-slate-300",
      soft: "from-slate-50 to-white",
      ring: "border-slate-200",
      label: "text-slate-700",
    };

  if (authLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (session && isLoginSuccessAnimating) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-rose-50 via-white to-fuchsia-50 px-6">
        <div className="absolute inset-0">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-rose-200/30 blur-3xl" />
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-fuchsia-200/30 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-pink-100/40 blur-3xl" />
        </div>

        <div className="relative flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-rose-400">
              Welcome back
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
              Opening your lipstick library...
            </h2>
          </motion.div>

          <div className="relative h-64 w-64">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-x-6 bottom-10 h-28 rounded-[2rem] border border-rose-200 bg-gradient-to-b from-rose-100 to-rose-200 shadow-xl"
            />

            <motion.div
              initial={{ rotateX: 0, y: 0 }}
              animate={{ rotateX: -72, y: -18 }}
              transition={{ delay: 0.45, duration: 0.7, ease: "easeInOut" }}
              style={{ transformOrigin: "bottom center", transformStyle: "preserve-3d" }}
              className="absolute inset-x-6 bottom-[7.2rem] h-16 rounded-t-[2rem] border border-rose-200 bg-gradient-to-r from-rose-200 via-pink-200 to-fuchsia-200 shadow-md"
            />

            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.7 }}
              animate={{ opacity: 1, y: -8, scale: 1 }}
              transition={{ delay: 0.95, duration: 0.55 }}
              className="absolute left-1/2 top-[4.4rem] -translate-x-1/2"
            >
              <div className="flex flex-col items-center gap-3">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                  className="flex h-24 w-14 items-end justify-center rounded-t-[1.4rem] rounded-b-md bg-zinc-900 shadow-lg"
                >
                  <div className="mb-2 h-12 w-10 rounded-t-xl rounded-b-sm bg-gradient-to-b from-rose-400 to-rose-600" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0, 1, 1, 0.7], scale: [0.8, 1.05, 1] }}
                  transition={{ delay: 1.1, duration: 0.8 }}
                  className="rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-rose-600 shadow"
                >
                  Ready
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.4, 0] }}
              transition={{ delay: 0.9, duration: 1.1 }}
              className="absolute inset-0"
            >
              <div className="absolute left-10 top-10 h-3 w-3 rounded-full bg-rose-300" />
              <div className="absolute right-12 top-16 h-2.5 w-2.5 rounded-full bg-pink-300" />
              <div className="absolute left-16 top-24 h-2 w-2 rounded-full bg-fuchsia-300" />
              <div className="absolute right-16 top-28 h-3 w-3 rounded-full bg-rose-200" />
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-rose-50 via-white to-fuchsia-50">
        <div className="absolute inset-0">
          <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-rose-200/30 blur-3xl" />
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-fuchsia-200/30 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-pink-100/40 blur-3xl" />
        </div>

        <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-4 py-8 md:px-8 lg:grid-cols-2 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden lg:block"
          >
            <div className="max-w-xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/70 px-4 py-2 text-sm text-rose-700 shadow-sm backdrop-blur">
                <Sparkles className="h-4 w-4" />
                Organize your lipstick collection beautifully
              </div>

              <div className="space-y-4">
                <h1 className="text-5xl font-semibold tracking-tight text-zinc-900 xl:text-6xl">
                  Your lipstick collection,
                  <span className="block bg-gradient-to-r from-rose-500 to-fuchsia-500 bg-clip-text text-transparent">
                    styled like a luxury app.
                  </span>
                </h1>
                <p className="max-w-lg text-lg leading-8 text-zinc-600">
                  Track shades, compare finishes, save favorites, and share your collection with a cleaner,
                  more premium experience.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/60 bg-white/70 p-4 shadow-lg shadow-rose-100/40 backdrop-blur">
                  <p className="text-2xl font-semibold text-zinc-900">2x</p>
                  <p className="mt-1 text-sm text-zinc-500">Cleaner organization</p>
                </div>
                <div className="rounded-3xl border border-white/60 bg-white/70 p-4 shadow-lg shadow-rose-100/40 backdrop-blur">
                  <p className="text-2xl font-semibold text-zinc-900">Fast</p>
                  <p className="mt-1 text-sm text-zinc-500">Search, filter, compare</p>
                </div>
                <div className="rounded-3xl border border-white/60 bg-white/70 p-4 shadow-lg shadow-rose-100/40 backdrop-blur">
                  <p className="text-2xl font-semibold text-zinc-900">Secure</p>
                  <p className="mt-1 text-sm text-zinc-500">Private collection access</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="mx-auto w-full max-w-md"
          >
            <Card className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/85 shadow-2xl shadow-rose-100/50 backdrop-blur-xl">
              <div className="h-2 w-full bg-gradient-to-r from-rose-300 via-pink-300 to-fuchsia-300" />

              <CardContent className="p-6 sm:p-8">
                <div className="mb-8 space-y-3 text-center sm:text-left">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-fuchsia-100 sm:mx-0">
                    <Sparkles className="h-6 w-6 text-rose-500" />
                  </div>

                  <div>
                    <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
                      {authMode === "signin" ? "Welcome back" : "Create your account"}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      {authMode === "signin"
                        ? "Sign in to manage your lipstick library, favorites, photos, and shares."
                        : "Create an account to start organizing your lipstick collection beautifully."}
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-zinc-700">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setAuthMessage("");
                        }}
                        placeholder="you@example.com"
                        className="h-12 rounded-2xl border-rose-100 bg-white pl-11 text-base shadow-sm placeholder:text-zinc-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="password" className="text-sm font-medium text-zinc-700">
                        Password
                      </Label>

                      {authMode === "signin" ? (
                        <button
                          type="button"
                          onClick={() => void handleForgotPassword()}
                          className="text-sm font-medium text-rose-500 transition hover:text-rose-600"
                        >
                          Forgot password?
                        </button>
                      ) : null}
                    </div>

                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setAuthMessage("");
                        }}
                        placeholder="Enter your password"
                        className="h-12 rounded-2xl border-rose-100 bg-white pl-11 pr-12 text-base shadow-sm placeholder:text-zinc-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 transition hover:text-zinc-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {authMode === "signin" ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-600">
                        {rememberMe ? "Remembered ✓" : "Remember me for 30 day"}
                      </span>

                      <button
                        type="button"
                        onClick={() => setRememberMe((prev) => !prev)}
                        className={`relative h-6 w-11 rounded-full transition-all duration-300 focus:outline-none ${rememberMe
                          ? "bg-gradient-to-r from-rose-400 to-fuchsia-500 shadow-md shadow-rose-200/60"
                          : "bg-zinc-300 hover:bg-zinc-400"
                          }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300 ${rememberMe
                            ? "left-5 shadow-lg"
                            : "left-0.5"
                            }`}
                        />
                      </button>
                    </div>
                  ) : null}

                  {authMessage ? (
                    <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-zinc-700">
                      {authMessage}
                    </div>
                  ) : null}

                  <Button
                    onClick={handleAuth}
                    className="h-12 w-full rounded-2xl bg-zinc-950 text-base font-medium text-white transition hover:bg-zinc-800"
                  >
                    {authMode === "signin" ? "Sign In" : "Create Account"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() =>
                      setAuthMode((prev) => (prev === "signin" ? "signup" : "signin"))
                    }
                    className="h-12 w-full rounded-2xl border-rose-100 bg-white text-base font-medium text-zinc-800 hover:bg-rose-50"
                  >
                    {authMode === "signin"
                      ? "Need an account? Sign up"
                      : "Already have an account? Sign in"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-3 py-4 sm:px-4 sm:py-6 md:p-8"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(251,207,232,0.35), transparent 25%), radial-gradient(circle at top right, rgba(233,213,255,0.28), transparent 22%), linear-gradient(to bottom right, #fff7fb, #fffdfd, #fff7fb)",
      }}
    >
      <div className="mx-auto max-w-7xl space-y-5 md:space-y-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleScanFileChange}
        />
        <BarcodeScanner
          isOpen={isBarcodeScannerOpen}
          onClose={() => setIsBarcodeScannerOpen(false)}
          onDetected={handleBarcodeDetected}
        />
        <AnimatePresence>
          {showDuplicateDialog ? (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
              <div className="w-full max-w-md rounded-2xl border border-rose-100 bg-white p-6 shadow-lg">
                <h3 className="text-lg font-semibold">Duplicate detected</h3>
                <p className="mt-2 text-sm text-slate-600">
                  A lipstick with the same brand and shade already exists in your library.
                  Do you still want to add it?
                </p>

                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    className="rounded-2xl border-rose-100"
                    onClick={() => {
                      setShowDuplicateDialog(false);
                      setPendingSave(null);
                    }}
                  >
                    Cancel
                  </Button>

                  <Button
                    className="rounded-2xl"
                    onClick={async () => {
                      setShowDuplicateDialog(false);
                      if (pendingSave) {
                        await pendingSave();
                      }
                      setPendingSave(null);
                    }}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
          {notice ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`fixed left-1/2 top-4 z-50 w-[92%] max-w-md -translate-x-1/2 rounded-2xl border px-4 py-3 text-sm shadow-lg ${notice.type === "success"
                ? "border-green-200 bg-white text-green-800"
                : "border-rose-200 bg-white text-rose-700"
                }`}
            >
              {notice.text}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {previewImageUrl ? (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4"
            onClick={() => setPreviewImageUrl(null)}
          >
            <div
              className="relative max-h-[90vh] max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="absolute right-2 top-2 rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-slate-700 shadow"
              >
                Close
              </button>

              <img
                src={previewImageUrl}
                alt="Lipstick full preview"
                className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
              />
            </div>
          </div>
        ) : null}

        {shareModalItem ? (
          <div
            className="fixed inset-0 z-[75] flex items-center justify-center bg-black/50 px-4"
            onClick={() => setShareModalItem(null)}
          >
            <div
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">Share lipstick</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Share <span className="font-medium">{shareModalItem.shade}</span> by{" "}
                    <span className="font-medium">{shareModalItem.brand}</span>
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShareModalItem(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-4 space-y-2">
                <Label>Email</Label>
                <Input
                  value={shareEmails[shareModalItem.id] ?? ""}
                  onChange={(e) =>
                    setShareEmails((prev) => ({
                      ...prev,
                      [shareModalItem.id]: e.target.value,
                    }))
                  }
                  placeholder="friend@example.com"
                />
              </div>

              {shareMessages[shareModalItem.id] ? (
                <p className="mt-3 text-sm">
                  {shareMessages[shareModalItem.id]}
                </p>
              ) : null}

              <div className="mt-5 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShareModalItem(null)}
                >
                  Cancel
                </Button>

                <Button
                  disabled={sharingLipstickId === shareModalItem.id}
                  onClick={async () => {
                    await shareLipstick(shareModalItem.id);
                  }}
                >
                  {sharingLipstickId === shareModalItem.id ? "Sharing..." : "Share"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {isAddFormOpen ? (
          <div
            className="fixed inset-0 z-[78] flex items-center justify-center bg-black/50 px-4 py-6"
            onClick={handleCancelForm}
          >
            <div
              className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[32px] border border-white/70 bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
                    {isEditing ? "Edit lipstick" : "Add a new lipstick"}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    {isEditing
                      ? "Update the details of your selected lipstick."
                      : "Save a new shade to your library."}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={handleCancelForm}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-5">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="border-b border-rose-100/60 pb-2 flex justify-end">

                    </div>

                    <div className="space-y-3">

                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-rose-100 p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Brand</Label>
                      <Input
                        ref={brandInputRef}
                        value={form.brand}
                        onChange={(e) => updateForm("brand", e.target.value)}
                        placeholder="e.g. MAC"
                        className="rounded-2xl border-rose-100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Shade</Label>
                      <Input
                        value={form.shade}
                        onChange={(e) => updateForm("shade", e.target.value)}
                        placeholder="e.g. Velvet Teddy"
                        className="rounded-2xl border-rose-100 text-lg font-medium"
                      />
                    </div>
                  </div>
                  <p className="mt-4 mb-4 text-sm font-medium text-slate-700">
                    Formula & color
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={form.type || undefined}
                        onValueChange={(v) => updateForm("type", v)}
                      >
                        <SelectTrigger className="rounded-2xl border-rose-100">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="z-[90]">
                          <SelectItem value="Bullet">Bullet</SelectItem>
                          <SelectItem value="Liquid">Liquid</SelectItem>
                          <SelectItem value="Tint">Tint</SelectItem>
                          <SelectItem value="Gloss">Gloss</SelectItem>
                          <SelectItem value="Balm">Balm</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Price tier</Label>
                      <Select
                        value={form.priceTier || undefined}
                        onValueChange={(v) => updateForm("priceTier", v)}
                      >
                        <SelectTrigger className="rounded-2xl border-rose-100">
                          <SelectValue placeholder="Select price tier" />
                        </SelectTrigger>
                        <SelectContent className="z-[90]">
                          <SelectItem value="Drugstore">Drugstore</SelectItem>
                          <SelectItem value="High-End">High-End</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Finish</Label>
                      <Select
                        value={form.finish || undefined}
                        onValueChange={(v) => updateForm("finish", v)}
                      >
                        <SelectTrigger className="rounded-2xl border-rose-100">
                          <SelectValue placeholder="Select finish" />
                        </SelectTrigger>
                        <SelectContent className="z-[90]">
                          <SelectItem value="Matte">Matte</SelectItem>
                          <SelectItem value="Creamy Matte">Creamy Matte</SelectItem>
                          <SelectItem value="Soft Matte">Soft Matte</SelectItem>
                          <SelectItem value="Satin">Satin</SelectItem>
                          <SelectItem value="Glossy">Glossy</SelectItem>
                          <SelectItem value="Sheer">Sheer</SelectItem>
                          <SelectItem value="Tint">Tint</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Undertone</Label>
                      <Select
                        value={form.undertone || undefined}
                        onValueChange={(v) => updateForm("undertone", v)}
                      >
                        <SelectTrigger className="rounded-2xl border-rose-100">
                          <SelectValue placeholder="Select undertone" />
                        </SelectTrigger>
                        <SelectContent className="z-[90]">
                          <SelectItem value="Warm">Warm</SelectItem>
                          <SelectItem value="Cool">Cool</SelectItem>
                          <SelectItem value="Neutral">Neutral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Color family</Label>
                      <Select
                        value={form.colorFamily || undefined}
                        onValueChange={(v) => updateForm("colorFamily", v)}
                      >
                        <SelectTrigger className="rounded-2xl border-rose-100">
                          <SelectValue placeholder="Select color family" />
                        </SelectTrigger>
                        <SelectContent className="z-[90]">
                          <SelectItem value="Red">Red</SelectItem>
                          <SelectItem value="Pink">Pink</SelectItem>
                          <SelectItem value="Berry">Berry</SelectItem>
                          <SelectItem value="Brown">Brown</SelectItem>
                          <SelectItem value="Nude">Nude</SelectItem>
                          <SelectItem value="Coral">Coral</SelectItem>
                          <SelectItem value="Mauve">Mauve</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-rose-100 p-4">
                  <p className="mb-4 text-sm font-medium text-slate-700">Usage & notes</p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={form.status || undefined}
                        onValueChange={(v) => updateForm("status", v)}
                      >
                        <SelectTrigger className="rounded-2xl border-rose-100">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="z-[90]">
                          <SelectItem value="Owned">Owned</SelectItem>
                          <SelectItem value="Wishlist">Wishlist</SelectItem>
                          <SelectItem value="Decluttered">Decluttered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Best for</Label>
                      <Select
                        value={form.occasion || undefined}
                        onValueChange={(v) => updateForm("occasion", v)}
                      >
                        <SelectTrigger className="rounded-2xl border-rose-100">
                          <SelectValue placeholder="Select best use" />
                        </SelectTrigger>
                        <SelectContent className="z-[90]">
                          <SelectItem value="Daily">Daily</SelectItem>
                          <SelectItem value="Office">Office</SelectItem>
                          <SelectItem value="Evening">Evening</SelectItem>
                          <SelectItem value="Party">Party</SelectItem>
                          <SelectItem value="Anytime">Anytime</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Label>Purchase date</Label>
                    <Input
                      type="date"
                      value={form.purchaseDate}
                      onChange={(e) => updateForm("purchaseDate", e.target.value)}
                      className="rounded-2xl border-rose-100"
                    />
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Photo 1</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImageFile1(e.target.files?.[0] ?? null)}
                        className="rounded-2xl border-rose-100"
                      />
                      {form.image_url_1 ? (
                        <p className="text-xs text-slate-500">Existing photo saved</p>
                      ) : null}
                      {imageFile1 ? (
                        <p className="text-xs text-slate-500">{imageFile1.name}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label>Photo 2</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImageFile2(e.target.files?.[0] ?? null)}
                        className="rounded-2xl border-rose-100"
                      />
                      {form.image_url_2 ? (
                        <p className="text-xs text-slate-500">Existing photo saved</p>
                      ) : null}
                      {imageFile2 ? (
                        <p className="text-xs text-slate-500">{imageFile2.name}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={form.notes}
                      onChange={(e) => updateForm("notes", e.target.value)}
                      placeholder="Add dupes, wear time, where you bought it, special memories, etc."
                      className="min-h-[110px] rounded-2xl border-rose-100"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button
                    variant="outline"
                    onClick={handleCancelForm}
                    disabled={isSaving}
                    className="rounded-2xl border-rose-100"
                  >
                    Cancel
                  </Button>

                  <Button
                    onClick={() => void saveLipstick()}
                    disabled={isSaving}
                    className="rounded-2xl"
                  >
                    {isEditing ? (
                      <>
                        <Pencil className="mr-2 h-4 w-4" />
                        {isSaving ? "Updating..." : "Update Lipstick"}
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        {isSaving ? "Saving..." : "Save Lipstick"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {isCompareOpen && compareItem1 && compareItem2 ? (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4"
            onClick={() => setIsCompareOpen(false)}
          >
            <div
              className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[28px] bg-white p-4 md:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Compare Lipsticks</h2>
                <Button
                  variant="outline"
                  className="rounded-2xl border-rose-100"
                  onClick={() => setIsCompareOpen(false)}
                >
                  Close
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-rose-100 p-4">
                  <h3 className="text-xl font-semibold">{compareItem1.shade}</h3>
                  <p className="text-sm text-slate-600">{compareItem1.brand}</p>

                  {compareItem1.image_url_1 || compareItem1.image_url_2 ? (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {compareItem1.image_url_1 ? (
                        <img
                          src={compareItem1.image_url_1}
                          alt="Compare lipstick 1 photo 1"
                          className="h-24 w-24 rounded-2xl object-cover"
                        />
                      ) : null}

                      {compareItem1.image_url_2 ? (
                        <img
                          src={compareItem1.image_url_2}
                          alt="Compare lipstick 1 photo 2"
                          className="h-24 w-24 rounded-2xl object-cover"
                        />
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-4 space-y-3 text-sm">
                    <div><span className="font-medium">Type:</span> {compareItem1.type || "—"}</div>
                    <div><span className="font-medium">Finish:</span> {compareItem1.finish || "—"}</div>
                    <div><span className="font-medium">Undertone:</span> {compareItem1.undertone || "—"}</div>
                    <div><span className="font-medium">Color Family:</span> {compareItem1.colorFamily || "—"}</div>
                    <div><span className="font-medium">Status:</span> {compareItem1.status || "—"}</div>
                    <div><span className="font-medium">Purchase Date:</span> {compareItem1.purchaseDate || "—"}</div>
                    <div><span className="font-medium">Occasion:</span> {compareItem1.occasion || "—"}</div>
                    <div><span className="font-medium">Favorite:</span> {compareItem1.favorite ? "Yes" : "No"}</div>
                    <div><span className="font-medium">Notes:</span> {compareItem1.notes || "—"}</div>
                  </div>
                </div>

                <div className="rounded-3xl border border-rose-100 p-4">
                  <h3 className="text-xl font-semibold">{compareItem2.shade}</h3>
                  <p className="text-sm text-slate-600">{compareItem2.brand}</p>

                  {compareItem2.image_url_1 || compareItem2.image_url_2 ? (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {compareItem2.image_url_1 ? (
                        <img
                          src={compareItem2.image_url_1}
                          alt="Compare lipstick 2 photo 1"
                          className="h-24 w-24 rounded-2xl object-cover"
                        />
                      ) : null}

                      {compareItem2.image_url_2 ? (
                        <img
                          src={compareItem2.image_url_2}
                          alt="Compare lipstick 2 photo 2"
                          className="h-24 w-24 rounded-2xl object-cover"
                        />
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-4 space-y-3 text-sm">
                    <div><span className="font-medium">Type:</span> {compareItem2.type || "—"}</div>
                    <div><span className="font-medium">Finish:</span> {compareItem2.finish || "—"}</div>
                    <div><span className="font-medium">Undertone:</span> {compareItem2.undertone || "—"}</div>
                    <div><span className="font-medium">Color Family:</span> {compareItem2.colorFamily || "—"}</div>
                    <div><span className="font-medium">Status:</span> {compareItem2.status || "—"}</div>
                    <div><span className="font-medium">Purchase Date:</span> {compareItem2.purchaseDate || "—"}</div>
                    <div><span className="font-medium">Occasion:</span> {compareItem2.occasion || "—"}</div>
                    <div><span className="font-medium">Favorite:</span> {compareItem2.favorite ? "Yes" : "No"}</div>
                    <div><span className="font-medium">Notes:</span> {compareItem2.notes || "—"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="overflow-hidden rounded-[32px] border border-white/70 bg-white/85 shadow-[0_20px_80px_rgba(244,114,182,0.10)] backdrop-blur-xl"
        >
          <div className="h-1.5 bg-gradient-to-r from-rose-300 via-pink-300 to-fuchsia-300" />

          <div className="flex flex-col gap-6 p-4 sm:p-5 md:p-7 md:flex-row md:justify-between">
            <div className="space-y-4 sm:space-y-5 flex-1 max-w-3xl">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-rose-500">
                      <Sparkles className="h-3.5 w-3.5" />
                      Your curated collection
                    </div>

                    <Button
                      variant="ghost"
                      className="rounded-2xl text-sm text-zinc-500 hover:bg-rose-50"
                      onClick={() => void handleSignOut()}
                    >
                      <LogOut className="mr-1 h-4 w-4" />
                      Sign out
                    </Button>
                  </div>

                  <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900">
                      My Lipstick Library
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 md:text-base">
                      Organize your shades, surface favorites faster, and enjoy a more
                      editorial, premium view of your collection.
                    </p>
                  </div>

                  <p className="text-sm text-zinc-400">
                    Signed in as {session.user.email}
                  </p>
                </div>

                <div className="flex flex-row gap-2 flex-wrap">
                  <Button
                    className="rounded-2xl bg-zinc-950 px-5 text-white hover:bg-zinc-800"
                    onClick={startAddLipstick}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add lipstick
                  </Button>

                  <Button
                    variant="outline"
                    className="rounded-2xl border-rose-100 bg-white/90"
                    disabled={isScanning}
                    onClick={() => setIsBarcodeScannerOpen(true)}
                  >
                    {isScanning ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="mr-2 h-4 w-4" />
                    )}
                    {isScanning ? "Scanning..." : "Scan"}
                  </Button>

                </div>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by shade, brand, finish, notes..."
                  className="w-full h-12 sm:h-14 rounded-2xl border-rose-100 bg-white/90 pl-12 text-base shadow-sm"
                />
              </div>

              <div className="space-y-4">
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  <Button
                    variant={quickTab === "all" ? "default" : "outline"}
                    className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm ${quickTab === "all"
                      ? "bg-zinc-950 text-white"
                      : "border-rose-100 bg-white/80 text-zinc-700"
                      }`}
                    onClick={() => setQuickTab("all")}
                  >
                    All
                  </Button>

                  <Button
                    variant={quickTab === "owned" ? "default" : "outline"}
                    className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm ${quickTab === "owned"
                      ? "bg-zinc-950 text-white"
                      : "border-rose-100 bg-white/80 text-zinc-700"
                      }`}
                    onClick={() => setQuickTab("owned")}
                  >
                    Owned
                  </Button>

                  <Button
                    variant={quickTab === "shared" ? "default" : "outline"}
                    className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm ${quickTab === "shared"
                      ? "bg-zinc-950 text-white"
                      : "border-rose-100 bg-white/80 text-zinc-700"
                      }`}
                    onClick={() => setQuickTab("shared")}
                  >
                    Shared
                  </Button>

                  <Button
                    variant={quickTab === "trash" ? "default" : "outline"}
                    className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm ${quickTab === "trash"
                      ? "bg-zinc-950 text-white"
                      : "border-rose-100 bg-white/80 text-zinc-700"
                      }`}
                    onClick={() => setQuickTab("trash")}
                  >
                    Trash
                  </Button>
                </div>

                <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
                  <Button
                    variant="outline"
                    className={`shrink-0 rounded-xl h-9 px-3 text-sm ${isFiltersOpen
                      ? "border-rose-300 bg-rose-50 text-rose-700"
                      : "border-rose-100 bg-white/90 text-zinc-700"
                      }`}
                    onClick={() => setIsFiltersOpen((prev) => !prev)}
                  >
                    <Funnel className="mr-2 h-4 w-4" />
                    Filters
                    {isFiltersOpen ? (
                      <ChevronUp className="ml-2 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-2 h-4 w-4" />
                    )}
                  </Button>

                  <div className="flex shrink-0 items-center gap-2">


                    <Button
                      variant="ghost"
                      className="shrink-0 rounded-xl h-9 px-3 text-sm text-zinc-600 hover:bg-rose-50"
                      onClick={() => void handleRefreshView()}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>

                    <Button
                      variant="ghost"
                      className="shrink-0 rounded-xl h-9 px-3 text-sm text-zinc-600 hover:bg-rose-50"
                      onClick={exportVisibleItemsToCsv}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>
                {activeFilterChips.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {activeFilterChips.map((chip) => (
                      <button
                        key={chip.key}
                        type="button"
                        onClick={() => {
                          if (chip.key === "type") setTypeFilter("all");
                          if (chip.key === "finish") setFinishFilter("all");
                          if (chip.key === "undertone") setUndertoneFilter("all");
                          if (chip.key === "colorFamily") setColorFamilyFilter("all");
                          if (chip.key === "priceTier") setPriceTierFilter("all");
                          if (chip.key === "status") setStatusFilter("all");
                          if (chip.key === "ownership") setOwnershipFilter("all");
                          if (chip.key === "favorites") setFavoritesFilter("all");
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-sm text-rose-700 hover:bg-rose-100"
                      >
                        {chip.label}
                        <X className="h-3 w-3" />
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => clearFilters()}
                      className="text-sm text-zinc-500 hover:text-zinc-700"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {/* Sign out row */}
              <div className="flex justify-end">

              </div>

              {/* Stats cards */}
              <div className="flex-shrink-0 pt-6">
                <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-4">
                  <div className="rounded-[26px] border border-white/80 bg-gradient-to-br from-white to-rose-50/65 p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
                      Owned
                    </p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900">
                      {totalOwned}
                    </p>
                    <p className="mt-2 text-sm text-zinc-500">
                      In your collection
                    </p>
                  </div>

                  <div className="rounded-[26px] border border-white/80 bg-gradient-to-br from-white to-pink-50/65 p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
                      Favorites
                    </p>
                    <p className="mt-3 flex items-center gap-2 text-3xl font-semibold tracking-tight text-zinc-900">
                      <Heart className="h-5 w-5 fill-current text-rose-500" />
                      {totalFavorites}
                    </p>
                    <p className="mt-2 text-sm text-zinc-500">
                      {favoritesPercent}% of active library
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <AnimatePresence initial={false}>
            {isFiltersOpen ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden border-t border-rose-100/70 bg-rose-50/35 px-5 py-4 md:px-7"
              >
                <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2">
                    <Funnel className="h-4 w-4 text-zinc-500" />
                    <p className="text-sm font-medium text-zinc-700">Refine your library</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-zinc-500" />
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[180px] rounded-2xl border-rose-100 bg-white">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest first</SelectItem>
                        <SelectItem value="oldest">Oldest first</SelectItem>
                        <SelectItem value="brand-az">Brand A-Z</SelectItem>
                        <SelectItem value="brand-za">Brand Z-A</SelectItem>
                        <SelectItem value="shade-az">Shade A-Z</SelectItem>
                        <SelectItem value="favorites-first">Favorites first</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="rounded-2xl border-rose-100 bg-white">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="Bullet">Bullet</SelectItem>
                      <SelectItem value="Liquid">Liquid</SelectItem>
                      <SelectItem value="Tint">Tint</SelectItem>
                      <SelectItem value="Gloss">Gloss</SelectItem>
                      <SelectItem value="Balm">Balm</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priceTierFilter} onValueChange={setPriceTierFilter}>
                    <SelectTrigger className="rounded-2xl border-rose-100 bg-white">
                      <SelectValue placeholder="Price tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All price tiers</SelectItem>
                      <SelectItem value="Drugstore">Drugstore</SelectItem>
                      <SelectItem value="High-End">High-End</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={finishFilter} onValueChange={setFinishFilter}>
                    <SelectTrigger className="rounded-2xl border-rose-100 bg-white">
                      <SelectValue placeholder="Finish" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All finishes</SelectItem>
                      <SelectItem value="Matte">Matte</SelectItem>
                      <SelectItem value="Creamy Matte">Creamy Matte</SelectItem>
                      <SelectItem value="Soft Matte">Soft Matte</SelectItem>
                      <SelectItem value="Satin">Satin</SelectItem>
                      <SelectItem value="Glossy">Glossy</SelectItem>
                      <SelectItem value="Sheer">Sheer</SelectItem>
                      <SelectItem value="Tint">Tint</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={undertoneFilter} onValueChange={setUndertoneFilter}>
                    <SelectTrigger className="rounded-2xl border-rose-100 bg-white">
                      <SelectValue placeholder="Undertone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All undertones</SelectItem>
                      <SelectItem value="Warm">Warm</SelectItem>
                      <SelectItem value="Cool">Cool</SelectItem>
                      <SelectItem value="Neutral">Neutral</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={colorFamilyFilter} onValueChange={setColorFamilyFilter}>
                    <SelectTrigger className="rounded-2xl border-rose-100 bg-white">
                      <SelectValue placeholder="Color family" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All color families</SelectItem>
                      <SelectItem value="Red">Red</SelectItem>
                      <SelectItem value="Pink">Pink</SelectItem>
                      <SelectItem value="Berry">Berry</SelectItem>
                      <SelectItem value="Brown">Brown</SelectItem>
                      <SelectItem value="Nude">Nude</SelectItem>
                      <SelectItem value="Coral">Coral</SelectItem>
                      <SelectItem value="Mauve">Mauve</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="rounded-2xl border-rose-100 bg-white">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="Owned">Owned</SelectItem>
                      <SelectItem value="Wishlist">Wishlist</SelectItem>
                      <SelectItem value="Decluttered">Decluttered</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={ownershipFilter} onValueChange={setOwnershipFilter}>
                    <SelectTrigger className="rounded-2xl border-rose-100 bg-white">
                      <SelectValue placeholder="Ownership" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All lipsticks</SelectItem>
                      <SelectItem value="owned">Owned by you</SelectItem>
                      <SelectItem value="shared">Shared with you</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={favoritesFilter} onValueChange={setFavoritesFilter}>
                    <SelectTrigger className="rounded-2xl border-rose-100 bg-white">
                      <SelectValue placeholder="Favorites" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All favorites</SelectItem>
                      <SelectItem value="favorites">Favorites only</SelectItem>
                      <SelectItem value="nonfavorites">Non-favorites</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.section>

        <div className="space-y-4">
          {loading ? (
            <Card className="rounded-[28px] border border-rose-100 bg-white/95 shadow-sm">
              <CardContent className="p-5">Loading...</CardContent>
            </Card>
          ) : visibleItems.length === 0 ? (
            <Card className="rounded-[28px] border border-rose-100 bg-white/95 shadow-sm">
              <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-4 p-6 text-center">
                <div className="rounded-full bg-rose-50 p-4">
                  <Package2 className="h-10 w-10 text-rose-300" />
                </div>
                <div>
                  <h3 className="text-xl font-medium">No lipsticks match this view</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Try changing your filters or add a new shade to your library.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    variant="outline"
                    className="rounded-2xl border-rose-100"
                    onClick={() => clearFilters()}
                  >
                    Clear Filters
                  </Button>
                  <Button className="rounded-2xl" onClick={startAddLipstick}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add a lipstick
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            visibleItems.map((item, index) => {
              const isOwnedByYou = session.user.id === item.ownerUserId;
              const isExpanded = expandedItems.includes(item.id);
              const isDeleted = !!item.deletedAt;
              const colorData = getColorData(item.colorFamily);
              const deletedDaysAgo = item.deletedAt
                ? Math.floor(
                  (Date.now() - new Date(item.deletedAt).getTime()) /
                  (1000 * 60 * 60 * 24)
                )
                : null;

              const daysRemaining =
                item.deletedAt && deletedDaysAgo !== null
                  ? Math.max(0, 30 - deletedDaysAgo)
                  : null;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.03 }}
                >
                  <Card
                    className={`group overflow-hidden rounded-[30px] border bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_80px_rgba(244,114,182,0.14)] ${colorData.ring}`}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div
                        className="flex cursor-pointer flex-col gap-3"
                        onClick={() => toggleExpanded(item.id)}
                      >
                        <div className="min-w-0 space-y-3">
                          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            {item.colorFamily ? (
                              <Badge className="shrink-0 rounded-full bg-rose-100 text-rose-700 hover:bg-rose-100">
                                {item.colorFamily}
                              </Badge>
                            ) : null}

                            <Badge
                              variant="outline"
                              className={`shrink-0 rounded-full border ${ownershipBadgeClasses(isOwnedByYou)}`}
                            >
                              {isOwnedByYou ? "Owned" : "Shared"}
                            </Badge>

                            {item.favorite ? (
                              <Badge variant="outline" className="shrink-0 rounded-full border-rose-200 text-rose-600">
                                Favorite
                              </Badge>
                            ) : null}

                            {isDeleted ? (
                              <Badge
                                variant="outline"
                                className="shrink-0 rounded-full border-slate-300 bg-slate-100 text-slate-700"
                              >
                                In Trash
                              </Badge>
                            ) : null}
                          </div>

                          <div>
                            <h2 className="text-lg font-semibold leading-tight text-zinc-900 sm:text-xl">
                              {item.shade}
                            </h2>
                            <p className="mt-1 text-sm text-zinc-500">{item.brand}</p>
                          </div>

                          <p className="text-sm leading-5 text-zinc-500">
                            {[item.type, item.finish, item.undertone].filter(Boolean).join(" • ") || "No extra details yet"}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isDeleted}
                            className={`h-9 w-9 rounded-full text-zinc-400 hover:bg-rose-50 hover:text-rose-500 ${item.favorite ? "text-rose-500" : ""
                              }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              void toggleFavorite(item.id);
                            }}
                            title="Favorite"
                          >
                            <Star className={`h-5 w-5 ${item.favorite ? "fill-current" : ""}`} />
                          </Button>

                          {isOwnedByYou && !isDeleted && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-full text-zinc-400 hover:bg-rose-50 hover:text-zinc-900"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditLipstick(item);
                                }}
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-full text-zinc-400 hover:bg-rose-50 hover:text-zinc-900"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShareModalItem(item);
                                }}
                                title="Share"
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-full text-zinc-400 hover:bg-rose-50 hover:text-zinc-900"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void deleteOwnedLipstick(item.id);
                                }}
                                title="Move to Trash"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}

                          {!isOwnedByYou && !isDeleted ? (
                            <Button
                              variant="outline"
                              className="rounded-2xl border-rose-100 bg-white/95"
                              onClick={(e) => {
                                e.stopPropagation();
                                void removeSharedLipstick(item.id);
                              }}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Remove
                            </Button>
                          ) : null}

                          {isOwnedByYou && isDeleted ? (
                            <>
                              <Button
                                variant="outline"
                                className="rounded-2xl border-rose-100 bg-white/95"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void restoreLipstick(item.id);
                                }}
                              >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Restore
                              </Button>

                              <Button
                                variant="outline"
                                className="rounded-2xl border-rose-100 bg-white/95"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void permanentlyDeleteLipstick(item.id);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Forever
                              </Button>
                            </>
                          ) : null}

                          <Button
                            variant="outline"
                            className="rounded-2xl border-rose-100 bg-white/95 px-4"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpanded(item.id);
                            }}
                            title={isExpanded ? "Collapse" : "Expand"}
                          >
                            {isExpanded ? "Hide details" : "View details"}
                            {isExpanded ? (
                              <ChevronUp className="ml-2 h-4 w-4" />
                            ) : (
                              <ChevronDown className="ml-2 h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <AnimatePresence initial={false}>
                        {isExpanded ? (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-6 space-y-5 rounded-[24px] border border-rose-100/70 bg-rose-50/35 p-4 md:p-5">
                              {item.image_url_1 || item.image_url_2 ? (
                                <div className="flex flex-wrap gap-3">
                                  {item.image_url_1 ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewImageUrl(item.image_url_1);
                                      }}
                                      className="overflow-hidden rounded-2xl border border-rose-100 bg-white"
                                    >
                                      <img
                                        src={item.image_url_1}
                                        alt="Lipstick photo 1"
                                        className="h-24 w-24 object-cover"
                                      />
                                    </button>
                                  ) : null}

                                  {item.image_url_2 ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewImageUrl(item.image_url_2);
                                      }}
                                      className="overflow-hidden rounded-2xl border border-rose-100 bg-white"
                                    >
                                      <img
                                        src={item.image_url_2}
                                        alt="Lipstick photo 2"
                                        className="h-24 w-24 object-cover"
                                      />
                                    </button>
                                  ) : null}
                                </div>
                              ) : null}

                              <div className="flex gap-2 overflow-x-auto pb-1">
                                <Badge className="rounded-full">
                                  {item.status || "No status"}
                                </Badge>

                                <Badge
                                  variant="outline"
                                  className={`shrink-0 rounded-full border ${ownershipBadgeClasses(isOwnedByYou)}`}
                                >
                                  {isOwnedByYou ? "In your collection" : "Shared with you"}
                                </Badge>

                                {isDeleted ? (
                                  <Badge
                                    variant="outline"
                                    className="shrink-0 rounded-full border-slate-300 bg-slate-100 text-slate-700"
                                  >
                                    In Trash
                                  </Badge>
                                ) : null}

                                {item.type ? (
                                  <Badge variant="secondary" className="rounded-full">
                                    {item.type}
                                  </Badge>
                                ) : null}

                                {item.finish ? (
                                  <Badge variant="secondary" className="rounded-full">
                                    {item.finish}
                                  </Badge>
                                ) : null}

                                {item.undertone ? (
                                  <Badge variant="secondary" className="rounded-full">
                                    {item.undertone}
                                  </Badge>
                                ) : null}

                                {item.colorFamily ? (
                                  <Badge variant="secondary" className="rounded-full">
                                    {item.colorFamily}
                                  </Badge>
                                ) : null}

                                {item.priceTier ? (
                                  <Badge variant="secondary" className="rounded-full">
                                    {item.priceTier}
                                  </Badge>
                                ) : null}

                                {item.favorite ? (
                                  <Badge variant="secondary" className="rounded-full">
                                    Favorite
                                  </Badge>
                                ) : null}
                              </div>

                              <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="h-4 w-4" /> Best for: {item.occasion || "Not added"}
                                </div>

                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  {item.purchaseDate || "No date added"}
                                </div>

                                <div className="flex items-center gap-2 sm:col-span-2">
                                  <Tag className="h-4 w-4" />
                                  {item.notes || "No notes added yet."}
                                </div>

                                {item.barcode ? (
                                  <div className="flex items-center gap-2 sm:col-span-2">
                                    <Tag className="h-4 w-4" />
                                    Barcode: {item.barcode}
                                  </div>
                                ) : null}
                              </div>

                              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
                                {!isDeleted ? (
                                  <Button
                                    variant={compareIds.includes(item.id) ? "default" : "outline"}
                                    className="rounded-2xl border-rose-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleCompareSelection(item.id);
                                    }}
                                  >
                                    {compareIds.includes(item.id) ? "Selected" : "Compare"}
                                  </Button>
                                ) : null}

                                {isDeleted && deletedDaysAgo !== null ? (
                                  <p className="text-sm text-slate-600">
                                    Deleted {deletedDaysAgo} day{deletedDaysAgo === 1 ? "" : "s"} ago.
                                  </p>
                                ) : null}

                                {isDeleted && daysRemaining !== null ? (
                                  <p className="text-sm text-slate-600">
                                    {daysRemaining} day{daysRemaining === 1 ? "" : "s"} remaining before permanent cleanup.
                                  </p>
                                ) : null}
                              </div>


                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              );

            })
          )}
        </div>
      </div>
    </div>
  );
}