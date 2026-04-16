"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Trash2, Package2, Sparkles, Calendar, Tag, LogOut, Share2 } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
};

const emptyForm: Omit<LipstickItem, "id" | "ownerUserId"> = {
  brand: "",
  shade: "",
  type: "Bullet",
  finish: "Matte",
  undertone: "Neutral",
  colorFamily: "Nude",
  status: "Owned",
  purchaseDate: "",
  occasion: "Daily",
  notes: "",
};

export default function LipstickCatalogApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authMessage, setAuthMessage] = useState("");

  const [items, setItems] = useState<LipstickItem[]>([]);
  const [query, setQuery] = useState("");
  const [finishFilter, setFinishFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState<Omit<LipstickItem, "id" | "ownerUserId">>(emptyForm);
  const [loading, setLoading] = useState(true);

  const [shareEmails, setShareEmails] = useState<Record<number, string>>({});
  const [shareMessages, setShareMessages] = useState<Record<number, string>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);

      if (newSession?.user?.email) {
        await ensureProfile(newSession.user.id, newSession.user.email);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchLipsticks();
    } else {
      setItems([]);
      setLoading(false);
    }
  }, [session]);

  async function ensureProfile(userId: string, userEmail: string) {
    await supabase.from("profiles").upsert(
      {
        id: userId,
        email: userEmail.toLowerCase(),
      },
      { onConflict: "id" }
    );
  }

  async function fetchLipsticks() {
    setLoading(true);

    const { data, error } = await supabase
      .from("lipsticks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading lipsticks:", error);
      setLoading(false);
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
    }));

    setItems(mapped);
    setLoading(false);
  }

  async function handleAuth() {
    setAuthMessage("");

    if (!email.trim() || !password.trim()) {
      setAuthMessage("Please enter both email and password.");
      return;
    }

    if (authMode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setAuthMessage(error.message);
        return;
      }

      if (data.user?.id && data.user.email) {
        await ensureProfile(data.user.id, data.user.email);
      }

      setAuthMessage("Account created. If email confirmation is enabled, check your inbox.");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    if (data.user?.id && data.user.email) {
      await ensureProfile(data.user.id, data.user.email);
    }

    setAuthMessage("Signed in.");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const text =
        `${item.brand} ${item.shade} ${item.type} ${item.finish} ${item.undertone} ${item.colorFamily} ${item.status} ${item.occasion} ${item.notes}`.toLowerCase();

      const matchesQuery = text.includes(query.toLowerCase());
      const matchesFinish = finishFilter === "all" || item.finish === finishFilter;
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;

      return matchesQuery && matchesFinish && matchesStatus;
    });
  }, [items, query, finishFilter, statusFilter]);

  const updateForm = (field: keyof Omit<LipstickItem, "id" | "ownerUserId">, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addLipstick = async () => {
    if (!session?.user?.id) return;
    if (!form.brand.trim() || !form.shade.trim()) return;

    const { error } = await supabase.from("lipsticks").insert({
      owner_user_id: session.user.id,
      brand: form.brand,
      shade: form.shade,
      type: form.type,
      finish: form.finish,
      undertone: form.undertone,
      color_family: form.colorFamily,
      status: form.status,
      purchase_date: form.purchaseDate || null,
      occasion: form.occasion,
      notes: form.notes,
    });

    if (error) {
      console.error("Error saving lipstick:", error);
      return;
    }

    setForm(emptyForm);
    fetchLipsticks();
  };

  const deleteLipstick = async (id: number) => {
    const { error } = await supabase.from("lipsticks").delete().eq("id", id);

    if (error) {
      console.error("Error deleting lipstick:", error);
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateShareEmail = (lipstickId: number, value: string) => {
    setShareEmails((prev) => ({ ...prev, [lipstickId]: value }));
  };

  const shareLipstick = async (lipstickId: number) => {
    const shareEmail = (shareEmails[lipstickId] || "").trim().toLowerCase();

    if (!shareEmail) {
      setShareMessages((prev) => ({
        ...prev,
        [lipstickId]: "Enter an email to share with.",
      }));
      return;
    }

    if (shareEmail === session?.user?.email?.toLowerCase()) {
      setShareMessages((prev) => ({
        ...prev,
        [lipstickId]: "You already own this lipstick.",
      }));
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", shareEmail)
      .single();

    if (profileError || !profile) {
      setShareMessages((prev) => ({
        ...prev,
        [lipstickId]: "No user found with that email.",
      }));
      return;
    }

    const { error: shareError } = await supabase.from("lipstick_shares").insert({
      lipstick_id: lipstickId,
      shared_with_user_id: profile.id,
    });

    if (shareError) {
      setShareMessages((prev) => ({
        ...prev,
        [lipstickId]: shareError.message.includes("duplicate")
          ? "Already shared with this user."
          : shareError.message,
      }));
      return;
    }

    setShareMessages((prev) => ({
      ...prev,
      [lipstickId]: "Lipstick shared successfully.",
    }));
    setShareEmails((prev) => ({ ...prev, [lipstickId]: "" }));
  };

  if (authLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-pink-50 p-4 md:p-8">
        <div className="mx-auto max-w-md">
          <Card className="rounded-3xl border shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Sign in to My Lipstick Library</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="rounded-2xl"
                />
              </div>

              {authMessage ? <p className="text-sm text-slate-600">{authMessage}</p> : null}

              <Button onClick={handleAuth} className="w-full rounded-2xl">
                {authMode === "signin" ? "Sign In" : "Create Account"}
              </Button>

              <Button
                variant="outline"
                onClick={() => setAuthMode((prev) => (prev === "signin" ? "signup" : "signin"))}
                className="w-full rounded-2xl"
              >
                {authMode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalOwned = items.filter((x) => x.ownerUserId === session.user.id).length;
  const totalShared = items.filter((x) => x.ownerUserId !== session.user.id).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-pink-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col gap-4 rounded-3xl border bg-white/80 p-6 shadow-sm backdrop-blur"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">My Lipstick Library</h1>
              <p className="mt-1 text-sm text-slate-600">Signed in as {session.user.email}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-sm">
                Owned: {totalOwned}
              </Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-sm">
                Shared with me: {totalShared}
              </Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-sm">
                Total: {items.length}
              </Badge>
              <Button variant="outline" className="rounded-2xl" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative md:col-span-1">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by brand, shade, color, notes..."
                className="rounded-2xl pl-9"
              />
            </div>

            <Select value={finishFilter} onValueChange={setFinishFilter}>
              <SelectTrigger className="rounded-2xl">
                <SelectValue placeholder="Filter by finish" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All finishes</SelectItem>
                <SelectItem value="Matte">Matte</SelectItem>
                <SelectItem value="Creamy Matte">Creamy Matte</SelectItem>
                <SelectItem value="Soft Matte">Soft Matte</SelectItem>
                <SelectItem value="Satin">Satin</SelectItem>
                <SelectItem value="Glossy">Glossy</SelectItem>
                <SelectItem value="Sheer">Sheer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="rounded-2xl">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Owned">Owned</SelectItem>
                <SelectItem value="Wishlist">Wishlist</SelectItem>
                <SelectItem value="Decluttered">Decluttered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            <Card className="rounded-3xl border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Plus className="h-5 w-5" /> Add a Lipstick
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Brand</Label>
                    <Input value={form.brand} onChange={(e) => updateForm("brand", e.target.value)} placeholder="e.g. MAC" className="rounded-2xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Shade</Label>
                    <Input value={form.shade} onChange={(e) => updateForm("shade", e.target.value)} placeholder="e.g. Velvet Teddy" className="rounded-2xl" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={(v) => updateForm("type", v)}>
                      <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
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
                    <Select value={form.finish} onValueChange={(v) => updateForm("finish", v)}>
                      <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Matte">Matte</SelectItem>
                        <SelectItem value="Creamy Matte">Creamy Matte</SelectItem>
                        <SelectItem value="Soft Matte">Soft Matte</SelectItem>
                        <SelectItem value="Satin">Satin</SelectItem>
                        <SelectItem value="Glossy">Glossy</SelectItem>
                        <SelectItem value="Sheer">Sheer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Undertone</Label>
                    <Select value={form.undertone} onValueChange={(v) => updateForm("undertone", v)}>
                      <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Warm">Warm</SelectItem>
                        <SelectItem value="Cool">Cool</SelectItem>
                        <SelectItem value="Neutral">Neutral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Color family</Label>
                    <Select value={form.colorFamily} onValueChange={(v) => updateForm("colorFamily", v)}>
                      <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => updateForm("status", v)}>
                      <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Owned">Owned</SelectItem>
                        <SelectItem value="Wishlist">Wishlist</SelectItem>
                        <SelectItem value="Decluttered">Decluttered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Best for</Label>
                    <Select value={form.occasion} onValueChange={(v) => updateForm("occasion", v)}>
                      <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
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

                <div className="space-y-2">
                  <Label>Purchase date</Label>
                  <Input type="date" value={form.purchaseDate} onChange={(e) => updateForm("purchaseDate", e.target.value)} className="rounded-2xl" />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => updateForm("notes", e.target.value)}
                    placeholder="Add dupes, wear time, where you bought it, special memories, etc."
                    className="min-h-[100px] rounded-2xl"
                  />
                </div>

                <Button onClick={addLipstick} className="w-full rounded-2xl">
                  <Plus className="mr-2 h-4 w-4" /> Save Lipstick
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <div className="space-y-4">
            {loading ? (
              <Card className="rounded-3xl border shadow-sm">
                <CardContent className="p-5">Loading...</CardContent>
              </Card>
            ) : filteredItems.length === 0 ? (
              <Card className="rounded-3xl border shadow-sm">
                <CardContent className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-center">
                  <Package2 className="h-10 w-10 text-slate-400" />
                  <div>
                    <h3 className="text-lg font-medium">No matches found</h3>
                    <p className="text-sm text-slate-600">Try a different search or add a new lipstick.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredItems.map((item, index) => {
                const isOwner = session.user.id === item.ownerUserId;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.03 }}
                  >
                    <Card className="rounded-3xl border shadow-sm">
                      <CardContent className="p-5">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-3 flex-1">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-xl font-semibold">{item.shade}</h2>
                                <Badge className="rounded-full">{item.status}</Badge>
                                {isOwner ? (
                                  <Badge variant="secondary" className="rounded-full">Owned by you</Badge>
                                ) : (
                                  <Badge variant="secondary" className="rounded-full">Shared with you</Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-600">{item.brand}</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary" className="rounded-full">{item.type}</Badge>
                              <Badge variant="secondary" className="rounded-full">{item.finish}</Badge>
                              <Badge variant="secondary" className="rounded-full">{item.undertone}</Badge>
                              <Badge variant="secondary" className="rounded-full">{item.colorFamily}</Badge>
                            </div>

                            <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                              <div className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Best for: {item.occasion}</div>
                              <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {item.purchaseDate || "No date added"}</div>
                              <div className="flex items-center gap-2 sm:col-span-2"><Tag className="h-4 w-4" /> {item.notes || "No notes added"}</div>
                            </div>

                            {isOwner ? (
                              <div className="rounded-2xl border p-3 space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                  <Share2 className="h-4 w-4" /> Share this lipstick
                                </div>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                  <Input
                                    value={shareEmails[item.id] || ""}
                                    onChange={(e) => updateShareEmail(item.id, e.target.value)}
                                    placeholder="friend@example.com"
                                    className="rounded-2xl"
                                  />
                                  <Button
                                    variant="outline"
                                    className="rounded-2xl"
                                    onClick={() => shareLipstick(item.id)}
                                  >
                                    Share
                                  </Button>
                                </div>
                                {shareMessages[item.id] ? (
                                  <p className="text-sm text-slate-600">{shareMessages[item.id]}</p>
                                ) : null}
                              </div>
                            ) : null}
                          </div>

                          {isOwner ? (
                            <Button variant="outline" className="rounded-2xl" onClick={() => deleteLipstick(item.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </Button>
                          ) : null}
                        </div>
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