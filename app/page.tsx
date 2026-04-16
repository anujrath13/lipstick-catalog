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
};

const INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000;
const LAST_ACTIVITY_KEY = "lipstick_last_activity_at";

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
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authMessage, setAuthMessage] = useState("");

  const [items, setItems] = useState<LipstickItem[]>([]);
  const [shareRows, setShareRows] = useState<ShareRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sharingLipstickId, setSharingLipstickId] = useState<number | null>(null);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
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

  const [isScanning, setIsScanning] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);

  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [shareEmails, setShareEmails] = useState<Record<number, string>>({});
  const [shareMessages, setShareMessages] = useState<Record<number, string>>({});
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const inactivityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const brandInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
        shade: typeof scanned.shade === "string" ? scanned.shade : "",
        type: typeof scanned.type === "string" ? scanned.type : "",
        finish: typeof scanned.finish === "string" ? scanned.finish : "",
        undertone: typeof scanned.undertone === "string" ? scanned.undertone : "",
        colorFamily: typeof scanned.colorFamily === "string" ? scanned.colorFamily : "",
        status:
          typeof scanned.status === "string" && scanned.status.trim()
            ? scanned.status
            : "Owned",
        occasion: typeof scanned.occasion === "string" ? scanned.occasion : "",
        notes:
          typeof scanned.notes === "string"
            ? scanned.notes
            : `Barcode: ${barcode}`,
        barcode:
          typeof scanned.barcode === "string"
            ? scanned.barcode
            : barcode,
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

  const updateForm = (field: keyof LipstickFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingLipstickId(null);
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
        shade: normalizeScannedValue(scanned.shade),
        type: normalizeScannedValue(scanned.type),
        finish: normalizeScannedValue(scanned.finish),
        undertone: normalizeScannedValue(scanned.undertone),
        colorFamily: normalizeScannedValue(scanned.colorFamily),
        status: normalizeScannedValue(scanned.status) || "Owned",
        occasion: normalizeScannedValue(scanned.occasion),
        notes: normalizeScannedValue(scanned.notes),
        barcode: normalizeScannedValue(scanned.barcode),
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
      const lastActivityRaw = localStorage.getItem(LAST_ACTIVITY_KEY);
      const lastActivity = lastActivityRaw ? Number(lastActivityRaw) : Date.now();
      const now = Date.now();

      if (now - lastActivity >= INACTIVITY_TIMEOUT_MS) {
        if (inactivityTimeoutRef.current) {
          clearTimeout(inactivityTimeoutRef.current);
          inactivityTimeoutRef.current = null;
        }
        await supabase.auth.signOut();
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        setAuthMessage("You were logged out after 20 minutes of inactivity.");
        return;
      }

      const remainingTime = INACTIVITY_TIMEOUT_MS - (now - lastActivity);

      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }

      inactivityTimeoutRef.current = setTimeout(async () => {
        await supabase.auth.signOut();
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        setAuthMessage("You were logged out after 20 minutes of inactivity.");
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

  const clearFilters = (showToast = true) => {
    setQuery("");
    setTypeFilter("all");
    setFinishFilter("all");
    setUndertoneFilter("all");
    setColorFamilyFilter("all");
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
    resetForm();
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
      status: item.status,
      purchaseDate: item.purchaseDate,
      occasion: item.occasion,
      notes: item.notes,
      barcode: item.barcode ?? "",
    });
    setEditingLipstickId(item.id);
    setIsAddFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      status: item.status,
      purchaseDate: item.purchase_date ?? "",
      occasion: item.occasion,
      notes: item.notes ?? "",
      favorite: item.favorite ?? false,
      deletedAt: item.deleted_at ?? null,
      barcode: item.barcode ?? "",
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

      setEmail(normalizedEmail);
      setPassword("");
      setAuthMessage(
        "Account created. If email confirmation is enabled, check your inbox."
      );
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    if (data.user) {
      await ensureProfileRow(data.user.id, data.user.email ?? normalizedEmail);
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    }

    setEmail(normalizedEmail);
    setPassword("");
    setAuthMessage("Signed in.");
  }

  async function handleSignOut() {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    await supabase.auth.signOut();
  }

  const validateForm = () => {
    if (!form.brand.trim() || !form.shade.trim()) {
      showNotice("error", "Brand and shade are required.");
      return false;
    }

    return true;
  };

  const saveLipstick = async () => {
    if (!session?.user?.id) return;
    if (!validateForm()) return;

    setIsSaving(true);

    const basePayload = {
      brand: form.brand.trim(),
      shade: form.shade.trim(),
      type: form.type,
      finish: form.finish,
      undertone: form.undertone,
      color_family: form.colorFamily,
      status: form.status,
      purchase_date: form.purchaseDate || todayString(),
      occasion: form.occasion,
      notes: form.notes.trim(),
      barcode: form.barcode.trim() || null,
    };

    if (isEditing && editingLipstickId !== null) {
      const { error } = await supabase
        .from("lipsticks")
        .update(basePayload)
        .eq("id", editingLipstickId);

      setIsSaving(false);

      if (error) {
        console.error("Error updating lipstick:", error);
        showNotice("error", "Could not update lipstick.");
        return;
      }

      resetForm();
      setIsAddFormOpen(false);
      await refreshDataOnly();
      setExpandedItems((prev) =>
        prev.includes(editingLipstickId) ? prev : [editingLipstickId, ...prev]
      );
      showNotice("success", "Lipstick updated.");
      return;
    }

    const insertPayload = {
      owner_user_id: session.user.id,
      favorite: false,
      ...basePayload,
    };

    const { error } = await supabase.from("lipsticks").insert(insertPayload);

    setIsSaving(false);

    if (error) {
      console.error("Error saving lipstick:", error);
      showNotice("error", "Could not save lipstick.");
      return;
    }

    resetForm();
    setIsAddFormOpen(false);
    await refreshDataOnly();
    showNotice("success", "Lipstick added.");
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

    const { error } = await supabase.from("lipsticks").delete().eq("id", id);

    if (error) {
      console.error("Error permanently deleting lipstick:", error);
      showNotice("error", "Could not permanently delete lipstick.");
      return;
    }

    await refreshDataOnly();
    showNotice("success", "Lipstick permanently deleted.");
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
        `${item.brand} ${item.shade} ${item.type} ${item.finish} ${item.undertone} ${item.colorFamily} ${item.status} ${item.occasion} ${item.notes}`.toLowerCase();

      const matchesQuery = text.includes(query.toLowerCase());
      const matchesType = typeFilter === "all" || item.type === typeFilter;
      const matchesFinish = finishFilter === "all" || item.finish === finishFilter;
      const matchesUndertone =
        undertoneFilter === "all" || item.undertone === undertoneFilter;
      const matchesColorFamily =
        colorFamilyFilter === "all" || item.colorFamily === colorFamilyFilter;
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;

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
    statusFilter,
    ownershipFilter,
    quickTab,
    favoritesFilter,
    sortBy,
    session,
  ]);

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

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-white px-4 py-6 md:p-8">
        <div className="mx-auto max-w-md">
          <Card className="overflow-hidden rounded-[28px] border border-rose-100 bg-white/95 shadow-lg shadow-rose-100/40">
            <div className="h-2 bg-gradient-to-r from-rose-200 via-pink-200 to-fuchsia-200" />
            <CardHeader>
              <CardTitle className="text-3xl tracking-tight">My Lipstick Library</CardTitle>
              <p className="text-sm text-slate-600">
                Sign in to organize, filter, and share your collection.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="rounded-2xl border-rose-100"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Password</Label>
                  {authMode === "signin" ? (
                    <button
                      type="button"
                      onClick={() => void handleForgotPassword()}
                      className="text-sm font-medium text-rose-600 transition hover:text-rose-700"
                    >
                      Forgot password?
                    </button>
                  ) : null}
                </div>

                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="rounded-2xl border-rose-100"
                />
              </div>

              {authMessage ? (
                <p className="text-sm text-slate-600">{authMessage}</p>
              ) : null}

              <Button onClick={handleAuth} className="w-full rounded-2xl">
                {authMode === "signin" ? "Sign In" : "Create Account"}
              </Button>

              <Button
                variant="outline"
                onClick={() =>
                  setAuthMode((prev) => (prev === "signin" ? "signup" : "signin"))
                }
                className="w-full rounded-2xl border-rose-100"
              >
                {authMode === "signin"
                  ? "Need an account? Sign up"
                  : "Already have an account? Sign in"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-white px-3 py-4 sm:px-4 sm:py-6 md:p-8">
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

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="overflow-hidden rounded-[30px] border border-rose-100 bg-white/95 shadow-lg shadow-rose-100/30"
        >
          <div className="h-2 bg-gradient-to-r from-rose-200 via-pink-200 to-fuchsia-200" />
          <div className="space-y-5 p-4 md:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-2">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                    My Lipstick Library
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">
                    Track shades, filter faster, and keep your collection beautifully organized.
                  </p>
                </div>
                <p className="text-sm text-slate-500">Signed in as {session.user.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Owned</p>
                  <p className="mt-1 text-xl font-semibold">{totalOwned}</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Shared</p>
                  <p className="mt-1 text-xl font-semibold">{totalShared}</p>
                </div>
                <div className="rounded-2xl border border-pink-100 bg-pink-50/70 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Favorites</p>
                  <p className="mt-1 flex items-center gap-1 text-xl font-semibold">
                    <Heart className="h-4 w-4 fill-current" />
                    {totalFavorites}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Trash</p>
                  <p className="mt-1 text-xl font-semibold">{totalTrash}</p>
                </div>
                <div className="rounded-2xl border border-fuchsia-100 bg-fuchsia-50/70 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
                  <p className="mt-1 text-xl font-semibold">
                    {items.filter((x) => !x.deletedAt).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-slate-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by brand, shade, color family, or notes..."
                  className="h-14 rounded-2xl border-rose-100 bg-white pl-12 text-base shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={quickTab === "all" ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => setQuickTab("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={quickTab === "owned" ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => setQuickTab("owned")}
                  >
                    Owned
                  </Button>
                  <Button
                    variant={quickTab === "shared" ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => setQuickTab("shared")}
                  >
                    Shared
                  </Button>
                  <Button
                    variant={quickTab === "trash" ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => setQuickTab("trash")}
                  >
                    Trash
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="rounded-2xl border-rose-100"
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

                  <Button
                    variant="outline"
                    className="rounded-2xl border-rose-100"
                    onClick={() => clearFilters()}
                  >
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Clear
                  </Button>

                  <Button
                    variant="outline"
                    className="rounded-2xl border-rose-100"
                    onClick={() => void handleRefreshView()}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>

                  <Button
                    variant="outline"
                    className="rounded-2xl border-rose-100"
                    disabled={isScanning}
                    onClick={() => setIsBarcodeScannerOpen(true)}
                  >
                    {isScanning ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="mr-2 h-4 w-4" />
                    )}
                    {isScanning ? "Scanning..." : "Scan Barcode"}
                  </Button>

                  <Button
                    variant="outline"
                    className="rounded-2xl border-rose-100"
                    onClick={exportVisibleItemsToCsv}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>

                  <Button
                    variant="outline"
                    className="rounded-2xl border-rose-100"
                    onClick={() => void handleSignOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {isFiltersOpen ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden rounded-3xl border border-rose-100 bg-rose-50/50 p-4"
                  >
                    <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-2">
                        <Funnel className="h-4 w-4 text-slate-500" />
                        <p className="text-sm font-medium">Refine your view</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4 text-slate-500" />
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
            </div>
          </div>
        </motion.div>

        <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="overflow-hidden rounded-[28px] border border-rose-100 bg-white/95 shadow-sm">
              <CardHeader
                className="cursor-pointer"
                onClick={() => {
                  if (isAddFormOpen) {
                    handleCancelForm();
                  } else {
                    startAddLipstick();
                  }
                }}
              >
                <CardTitle className="flex items-center justify-between text-xl">
                  <span className="flex items-center gap-2">
                    {isEditing ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    {isEditing ? "Edit lipstick" : "Add a new lipstick"}
                  </span>
                  {isAddFormOpen ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </CardTitle>
                <p className="text-sm font-normal text-slate-600">
                  {isEditing
                    ? "Update the details of your selected lipstick."
                    : "Save a new shade to your library."}
                </p>
              </CardHeader>

              <AnimatePresence initial={false}>
                {isAddFormOpen ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <CardContent className="space-y-5">
                      <div className="rounded-2xl border border-rose-100 p-4">
                        <p className="mb-4 text-sm font-medium text-slate-700">Basic details</p>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
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
                              className="rounded-2xl border-rose-100"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-rose-100 p-4">
                        <p className="mb-4 text-sm font-medium text-slate-700">Formula & color</p>
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
                              <SelectContent>
                                <SelectItem value="Bullet">Bullet</SelectItem>
                                <SelectItem value="Liquid">Liquid</SelectItem>
                                <SelectItem value="Tint">Tint</SelectItem>
                                <SelectItem value="Gloss">Gloss</SelectItem>
                                <SelectItem value="Balm">Balm</SelectItem>
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
                              <SelectContent>
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
                              <SelectContent>
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
                              <SelectContent>
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
                              <SelectContent>
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
                              <SelectContent>
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

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          onClick={() => void saveLipstick()}
                          disabled={isSaving}
                          className="w-full rounded-2xl sm:flex-1"
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

                        <Button
                          variant="outline"
                          onClick={handleCancelForm}
                          disabled={isSaving}
                          className="w-full rounded-2xl border-rose-100 sm:w-auto"
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </Card>
          </motion.div>

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
                      className={`overflow-hidden rounded-[28px] border bg-gradient-to-r ${colorData.soft} shadow-sm transition-all hover:shadow-md ${colorData.ring}`}
                    >
                      <CardContent className="p-4 md:p-5">
                        <div
                          className="flex cursor-pointer flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                          onClick={() => toggleExpanded(item.id)}
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`h-4 w-4 rounded-full ring-4 ring-white ${colorData.dot}`}
                              />
                              <h2 className="text-2xl font-semibold tracking-tight">{item.shade}</h2>

                              <Badge className="rounded-full">{item.status || "No status"}</Badge>

                              <Badge
                                variant="outline"
                                className={`rounded-full border ${ownershipBadgeClasses(
                                  isOwnedByYou
                                )}`}
                              >
                                {isOwnedByYou ? "In your collection" : "Shared with you"}
                              </Badge>

                              {isDeleted ? (
                                <Badge
                                  variant="outline"
                                  className="rounded-full border-slate-300 bg-slate-100 text-slate-700"
                                >
                                  In Trash
                                </Badge>
                              ) : null}

                              {item.finish ? (
                                <Badge
                                  variant="secondary"
                                  className={`rounded-full ${colorData.label}`}
                                >
                                  {item.finish}
                                </Badge>
                              ) : null}
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                              <span>{item.brand}</span>
                              {item.colorFamily ? (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span>{item.colorFamily}</span>
                                </>
                              ) : null}
                              {item.undertone ? (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span>{item.undertone}</span>
                                </>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isDeleted}
                              className={`rounded-full ${item.favorite ? "text-rose-500" : "text-slate-400"
                                }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                void toggleFavorite(item.id);
                              }}
                            >
                              <Star className={`h-5 w-5 ${item.favorite ? "fill-current" : ""}`} />
                            </Button>

                            {isOwnedByYou ? (
                              isDeleted ? (
                                <>
                                  <Button
                                    variant="outline"
                                    className="rounded-2xl border-rose-100 bg-white/70"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void restoreLipstick(item.id);
                                    }}
                                  >
                                    <RotateCcw className="mr-2 h-4 w-4" /> Restore
                                  </Button>

                                  <Button
                                    variant="outline"
                                    className="rounded-2xl border-rose-100 bg-white/70"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void permanentlyDeleteLipstick(item.id);
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Forever
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="outline"
                                    className="rounded-2xl border-rose-100 bg-white/70"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditLipstick(item);
                                    }}
                                  >
                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                  </Button>

                                  <Button
                                    variant="outline"
                                    className="rounded-2xl border-rose-100 bg-white/70"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void deleteOwnedLipstick(item.id);
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Move to Trash
                                  </Button>
                                </>
                              )
                            ) : (
                              <Button
                                variant="outline"
                                className="rounded-2xl border-rose-100 bg-white/70"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void removeSharedLipstick(item.id);
                                }}
                              >
                                <X className="mr-2 h-4 w-4" /> Remove
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpanded(item.id);
                              }}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
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
                              <div className="mt-5 space-y-4">
                                <div className="flex flex-wrap gap-2">
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
                                  {item.favorite ? (
                                    <Badge variant="secondary" className="rounded-full">
                                      Favorite
                                    </Badge>
                                  ) : null}
                                </div>

                                <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                                  <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4" /> Best for:{" "}
                                    {item.occasion || "Not added"}
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

                                <div className="rounded-2xl border border-rose-100 bg-white/70 p-4">
                                  <p className="text-sm font-medium text-slate-700">
                                    {isDeleted
                                      ? "This lipstick is in Trash."
                                      : isOwnedByYou
                                        ? "You own this lipstick."
                                        : "This lipstick was shared with you."}
                                  </p>

                                  <p className="mt-1 text-sm text-slate-600">
                                    {isDeleted
                                      ? "You can restore it or permanently delete it."
                                      : isOwnedByYou
                                        ? "You can edit, move it to Trash, favorite, and share it with someone else."
                                        : "You can keep it in your list or remove it from your view."}
                                  </p>

                                  {isDeleted && deletedDaysAgo !== null ? (
                                    <p className="mt-2 text-sm text-slate-600">
                                      Deleted {deletedDaysAgo} day
                                      {deletedDaysAgo === 1 ? "" : "s"} ago.
                                    </p>
                                  ) : null}

                                  {isDeleted && daysRemaining !== null ? (
                                    <p className="mt-1 text-sm text-slate-600">
                                      {daysRemaining} day
                                      {daysRemaining === 1 ? "" : "s"} remaining before
                                      permanent cleanup.
                                    </p>
                                  ) : null}
                                </div>

                                {isOwnedByYou && !isDeleted ? (
                                  <div className="rounded-3xl border border-rose-100 bg-white/70 p-4">
                                    <h3 className="mb-3 flex items-center gap-2 text-base font-medium">
                                      <Share2 className="h-4 w-4" />
                                      Share this lipstick
                                    </h3>
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                      <Input
                                        value={shareEmails[item.id] ?? ""}
                                        onChange={(e) =>
                                          setShareEmails((prev) => ({
                                            ...prev,
                                            [item.id]: e.target.value,
                                          }))
                                        }
                                        placeholder="friend@example.com"
                                        className="rounded-2xl border-rose-100"
                                      />
                                      <Button
                                        variant="outline"
                                        className="rounded-2xl border-rose-100"
                                        disabled={sharingLipstickId === item.id}
                                        onClick={() => void shareLipstick(item.id)}
                                      >
                                        {sharingLipstickId === item.id ? "Sharing..." : "Share"}
                                      </Button>
                                    </div>
                                    {shareMessages[item.id] ? (
                                      <p className="mt-2 text-sm text-slate-600">
                                        {shareMessages[item.id]}
                                      </p>
                                    ) : null}
                                  </div>
                                ) : null}
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
    </div>
  );
}