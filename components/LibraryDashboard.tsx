"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Heart,
  Layers,
  Package2,
  Plus,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type DashboardLipstick = {
  id: number;
  ownerUserId: string;
  brand: string;
  shade: string;
  finish: string;
  undertone: string;
  colorFamily: string;
  status: string;
  favorite: boolean;
  deletedAt: string | null;
  image_url_1: string | null;
  priceTier: string;
  occasion: string;
};

export type CollectionFilter = {
  quickTab?: "all" | "owned" | "shared" | "trash";
  favoritesOnly?: boolean;
  colorFamily?: string;
  finish?: string;
  status?: string;
};

type ColorFamilyStyle = {
  dot: string;
  soft: string;
  ring: string;
  label: string;
};

type LibraryDashboardProps = {
  items: DashboardLipstick[];
  userId: string;
  colorFamilyMap: Record<string, ColorFamilyStyle>;
  loading?: boolean;
  onOpenCollection: (filter?: CollectionFilter) => void;
  onAddLipstick: () => void;
};

const COLOR_HEX: Record<string, string> = {
  Red: "#f43f5e",
  Pink: "#f472b6",
  Berry: "#d946ef",
  Brown: "#b45309",
  Nude: "#d6d3d1",
  Coral: "#fb923c",
  Mauve: "#a78bfa",
  Unspecified: "#d4d4d8",
};

function countBy<T extends string>(
  list: DashboardLipstick[],
  pick: (item: DashboardLipstick) => T | undefined | null
) {
  const counts: Record<string, number> = {};
  for (const item of list) {
    const key = pick(item)?.trim() || "Unspecified";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function buildInsight(active: DashboardLipstick[]) {
  if (active.length === 0) {
    return "Add shades to unlock personalized insights about your vanity.";
  }

  const finishes = countBy(active, (item) => item.finish);
  const colors = countBy(active, (item) => item.colorFamily);
  const brands = countBy(active, (item) => item.brand);

  const parts: string[] = [];
  if (finishes[0] && finishes[0][0] !== "Unspecified") {
    parts.push(`${finishes[0][0]} finishes dominate`);
  }
  if (colors[0] && colors[0][0] !== "Unspecified") {
    parts.push(`${colors[0][0]} is your top color family`);
  }
  if (brands[0] && brands[0][0] !== "Unspecified") {
    parts.push(`${brands[0][0]} leads with ${brands[0][1]} shade${brands[0][1] === 1 ? "" : "s"}`);
  }

  return parts.join(" · ");
}

function StatCard({
  label,
  value,
  hint,
  icon,
  onClick,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: ReactNode;
  onClick?: () => void;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
          {label}
        </p>
        <div className="text-rose-400">{icon}</div>
      </div>
      <p className="mt-2 font-heading text-3xl font-semibold tracking-tight text-zinc-900">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="rounded-2xl bg-gradient-to-br from-white to-rose-50/50 p-4 text-left shadow-sm transition hover:shadow-md"
      >
        {body}
      </button>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-white to-rose-50/50 p-4 shadow-sm">
      {body}
    </div>
  );
}

export function LibraryDashboard({
  items,
  userId,
  colorFamilyMap,
  loading,
  onOpenCollection,
  onAddLipstick,
}: LibraryDashboardProps) {
  const active = items.filter((item) => !item.deletedAt);
  const owned = active.filter((item) => item.ownerUserId === userId);
  const shared = active.filter((item) => item.ownerUserId !== userId);
  const favorites = active.filter((item) => item.favorite);
  const wishlist = active.filter((item) => item.status === "Wishlist");
  const brandCount = new Set(owned.map((item) => item.brand).filter(Boolean)).size;

  const colorStats = countBy(active, (item) => item.colorFamily);
  const finishStats = countBy(active, (item) => item.finish);
  const brandStats = countBy(owned, (item) => item.brand);
  const priceStats = countBy(owned, (item) => item.priceTier);
  const undertoneStats = countBy(active, (item) => item.undertone);

  const finishChart = finishStats
    .filter(([name]) => name !== "Unspecified")
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));

  const recent = owned.slice(0, 5);
  const favoriteItems = favorites.slice(0, 8);
  const maxColor = colorStats[0]?.[1] ?? 1;
  const maxBrand = brandStats[0]?.[1] ?? 1;

  if (loading) {
    return (
      <div className="order-3 rounded-2xl bg-white/80 p-8 text-center text-sm text-zinc-500 shadow-sm">
        Loading your dashboard...
      </div>
    );
  }

  if (active.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="order-3 rounded-[28px] bg-gradient-to-br from-white via-rose-50/30 to-white p-8 text-center shadow-sm"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
          <Sparkles className="h-8 w-8 text-rose-500" />
        </div>
        <h2 className="font-heading mt-4 text-2xl font-semibold text-zinc-900">
          Your dashboard is ready
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
          Add lipsticks to see color breakdowns, brand rankings, favorites, and
          collection insights here.
        </p>
        <Button className="btn-rose mt-6 rounded-2xl" onClick={onAddLipstick}>
          <Plus className="mr-2 h-4 w-4" />
          Add your first lipstick
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="order-3 space-y-5"
    >
      <div className="rounded-[28px] bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-fuchsia-500/10 p-4 md:p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-white/80 p-2.5 text-rose-500 shadow-sm">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-rose-500">
              Collection insight
            </p>
            <p className="mt-1 text-sm leading-6 text-zinc-700 md:text-base">
              {buildInsight(active)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Owned"
          value={owned.length}
          hint={`${shared.length} shared with you`}
          icon={<Package2 className="h-4 w-4" />}
          onClick={() => onOpenCollection({ quickTab: "owned" })}
        />
        <StatCard
          label="Favorites"
          value={favorites.length}
          hint={
            active.length > 0
              ? `${Math.round((favorites.length / active.length) * 100)}% of library`
              : undefined
          }
          icon={<Heart className="h-4 w-4" />}
          onClick={() => onOpenCollection({ favoritesOnly: true })}
        />
        <StatCard
          label="Brands"
          value={brandCount}
          hint="In your collection"
          icon={<Tag className="h-4 w-4" />}
        />
        <StatCard
          label="Wishlist"
          value={wishlist.length}
          hint="Shades to try"
          icon={<Star className="h-4 w-4" />}
          onClick={() => onOpenCollection({ status: "Wishlist" })}
        />
      </div>

      {favoriteItems.length > 0 ? (
        <section className="rounded-[28px] bg-white/90 p-4 shadow-sm md:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-heading text-lg font-semibold text-zinc-900">
              Favorites shelf
            </h2>
            <button
              type="button"
              className="text-sm text-rose-600 hover:text-rose-700"
              onClick={() => onOpenCollection({ favoritesOnly: true })}
            >
              View all
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            {favoriteItems.map((item) => {
              const color = colorFamilyMap[item.colorFamily];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    onOpenCollection({
                      favoritesOnly: true,
                      colorFamily:
                        item.colorFamily && item.colorFamily !== "Unspecified"
                          ? item.colorFamily
                          : undefined,
                    })
                  }
                  className="w-28 shrink-0 rounded-2xl bg-rose-50/40 p-2 text-left transition hover:bg-rose-50"
                >
                  <div className="relative mb-2 aspect-square overflow-hidden rounded-xl bg-white">
                    {item.image_url_1 ? (
                      <img
                        src={item.image_url_1}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${color?.soft ?? "from-slate-50 to-white"}`}
                      >
                        <span
                          className={`h-8 w-8 rounded-full ${color?.dot ?? "bg-slate-300"}`}
                        />
                      </div>
                    )}
                    <Heart className="absolute right-1.5 top-1.5 h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                  </div>
                  <p className="truncate text-xs font-medium text-zinc-900">
                    {item.shade}
                  </p>
                  <p className="truncate text-[11px] text-zinc-500">{item.brand}</p>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-[28px] bg-white/90 p-4 shadow-sm md:p-5">
          <h2 className="font-heading text-lg font-semibold text-zinc-900">
            Your palette
          </h2>
          <p className="mt-1 text-sm text-zinc-500">Tap a color to browse shades</p>
          <div className="mt-4 space-y-3">
            {colorStats.slice(0, 7).map(([name, count]) => {
              const color = colorFamilyMap[name];
              const width = Math.max(12, Math.round((count / maxColor) * 100));
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() =>
                    name !== "Unspecified"
                      ? onOpenCollection({ colorFamily: name })
                      : undefined
                  }
                  className="flex w-full items-center gap-3 text-left"
                  disabled={name === "Unspecified"}
                >
                  <span
                    className={`h-3.5 w-3.5 shrink-0 rounded-full ${color?.dot ?? "bg-slate-300"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                      <span className="truncate text-zinc-700">{name}</span>
                      <span className="shrink-0 text-zinc-400">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-rose-50">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${width}%`,
                          backgroundColor: COLOR_HEX[name] ?? "#d4d4d8",
                        }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-[28px] bg-white/90 p-4 shadow-sm md:p-5">
          <h2 className="font-heading text-lg font-semibold text-zinc-900">
            Finish breakdown
          </h2>
          <p className="mt-1 text-sm text-zinc-500">What you reach for most</p>
          <div className="mt-4 h-56 w-full">
            {finishChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={finishChart} layout="vertical" margin={{ left: 4, right: 8 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={72}
                    tick={{ fontSize: 12, fill: "#71717a" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(251, 207, 232, 0.25)" }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #fecdd3",
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 8, 8, 0]}
                    onClick={(data) => {
                      const name = (data as { name?: string }).name;
                      if (name) onOpenCollection({ finish: name });
                    }}
                  >
                    {finishChart.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={["#fb7185", "#f472b6", "#e11d48", "#fda4af", "#f9a8d4", "#be123c"][index % 6]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center justify-center text-sm text-zinc-400">
                Add finish details to see this chart
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-[28px] bg-white/90 p-4 shadow-sm md:p-5">
          <h2 className="font-heading text-lg font-semibold text-zinc-900">
            Top brands
          </h2>
          <div className="mt-4 space-y-3">
            {brandStats.slice(0, 5).map(([brand, count], index) => (
              <div key={brand} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-50 text-xs font-semibold text-rose-600">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-medium text-zinc-800">{brand}</span>
                    <span className="text-zinc-400">{count}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-rose-50">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-400 to-pink-500"
                      style={{ width: `${Math.max(10, (count / maxBrand) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] bg-white/90 p-4 shadow-sm md:p-5">
          <h2 className="font-heading text-lg font-semibold text-zinc-900">
            Recently added
          </h2>
          <div className="mt-4 space-y-2">
            {recent.map((item) => {
              const color = colorFamilyMap[item.colorFamily];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onOpenCollection({ quickTab: "owned" })}
                  className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition hover:bg-rose-50/60"
                >
                  <span
                    className={`h-3 w-3 shrink-0 rounded-full ${color?.dot ?? "bg-slate-300"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900">
                      {item.shade}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {item.brand}
                      {item.finish ? ` · ${item.finish}` : ""}
                    </p>
                  </div>
                  {item.favorite ? (
                    <Heart className="h-3.5 w-3.5 shrink-0 fill-rose-400 text-rose-400" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <section className="rounded-[28px] bg-white/90 p-4 shadow-sm md:p-5">
          <div className="mb-3 flex items-center gap-2">
            <Layers className="h-4 w-4 text-rose-400" />
            <h2 className="font-heading text-base font-semibold text-zinc-900">
              Undertones
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {undertoneStats
              .filter(([name]) => name !== "Unspecified")
              .slice(0, 6)
              .map(([name, count]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => onOpenCollection()}
                  className="rounded-full bg-rose-50 px-3 py-1.5 text-xs text-rose-700"
                >
                  {name} <span className="text-rose-400">({count})</span>
                </button>
              ))}
          </div>
        </section>

        <section className="rounded-[28px] bg-white/90 p-4 shadow-sm md:p-5">
          <div className="mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4 text-rose-400" />
            <h2 className="font-heading text-base font-semibold text-zinc-900">
              Price tier
            </h2>
          </div>
          <div className="space-y-2">
            {priceStats
              .filter(([name]) => name !== "Unspecified")
              .map(([name, count]) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-xl bg-rose-50/50 px-3 py-2 text-sm"
                >
                  <span className="text-zinc-700">{name}</span>
                  <span className="font-medium text-zinc-900">{count}</span>
                </div>
              ))}
            {priceStats.filter(([name]) => name !== "Unspecified").length === 0 ? (
              <p className="text-sm text-zinc-400">No price tiers tagged yet</p>
            ) : null}
          </div>
        </section>
      </div>
    </motion.div>
  );
}
