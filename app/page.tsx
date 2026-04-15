import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Trash2, Package2, Sparkles, Calendar, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const starterData = [
  {
    id: 1,
    brand: "MAC",
    shade: "Ruby Woo",
    type: "Bullet",
    finish: "Matte",
    undertone: "Cool",
    colorFamily: "Red",
    status: "Owned",
    purchaseDate: "2025-01-10",
    occasion: "Evening",
    notes: "Classic bold red. Great for formal events.",
  },
  {
    id: 2,
    brand: "Maybelline",
    shade: "Touch of Spice",
    type: "Bullet",
    finish: "Creamy Matte",
    undertone: "Warm",
    colorFamily: "Nude",
    status: "Owned",
    purchaseDate: "2024-11-03",
    occasion: "Daily",
    notes: "Easy everyday shade.",
  },
  {
    id: 3,
    brand: "Fenty Beauty",
    shade: "Uncuffed",
    type: "Liquid",
    finish: "Soft Matte",
    undertone: "Neutral",
    colorFamily: "Pink",
    status: "Wishlist",
    purchaseDate: "",
    occasion: "Anytime",
    notes: "Looks like a wearable rosy nude.",
  },
];

const emptyForm = {
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
  const [items, setItems] = useState(starterData);
  const [query, setQuery] = useState("");
  const [finishFilter, setFinishFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState(emptyForm);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const text = `${item.brand} ${item.shade} ${item.type} ${item.finish} ${item.undertone} ${item.colorFamily} ${item.status} ${item.occasion} ${item.notes}`.toLowerCase();
      const matchesQuery = text.includes(query.toLowerCase());
      const matchesFinish = finishFilter === "all" || item.finish === finishFilter;
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesQuery && matchesFinish && matchesStatus;
    });
  }, [items, query, finishFilter, statusFilter]);

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addLipstick = () => {
    if (!form.brand.trim() || !form.shade.trim()) return;
    setItems((prev) => [
      {
        id: Date.now(),
        ...form,
      },
      ...prev,
    ]);
    setForm(emptyForm);
  };

  const deleteLipstick = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const totalOwned = items.filter((x) => x.status === "Owned").length;
  const totalWishlist = items.filter((x) => x.status === "Wishlist").length;

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
              <p className="mt-1 text-sm text-slate-600">
                Track every lipstick you own, search shades quickly, and remember exactly what each one is.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-sm">Owned: {totalOwned}</Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-sm">Wishlist: {totalWishlist}</Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-sm">Total: {items.length}</Badge>
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
            {filteredItems.length === 0 ? (
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
              filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.03 }}
                >
                  <Card className="rounded-3xl border shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-xl font-semibold">{item.shade}</h2>
                              <Badge className="rounded-full">{item.status}</Badge>
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
                        </div>

                        <Button variant="outline" className="rounded-2xl" onClick={() => deleteLipstick(item.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
