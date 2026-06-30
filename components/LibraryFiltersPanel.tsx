"use client";

import { ArrowUpDown, Funnel } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LibraryFiltersPanelProps = {
  sortBy: string;
  onSortByChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  priceTierFilter: string;
  onPriceTierFilterChange: (value: string) => void;
  finishFilter: string;
  onFinishFilterChange: (value: string) => void;
  undertoneFilter: string;
  onUndertoneFilterChange: (value: string) => void;
  colorFamilyFilter: string;
  onColorFamilyFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  ownershipFilter: string;
  onOwnershipFilterChange: (value: string) => void;
  favoritesFilter: string;
  onFavoritesFilterChange: (value: string) => void;
  className?: string;
};

export function LibraryFiltersPanel({
  sortBy,
  onSortByChange,
  typeFilter,
  onTypeFilterChange,
  priceTierFilter,
  onPriceTierFilterChange,
  finishFilter,
  onFinishFilterChange,
  undertoneFilter,
  onUndertoneFilterChange,
  colorFamilyFilter,
  onColorFamilyFilterChange,
  statusFilter,
  onStatusFilterChange,
  ownershipFilter,
  onOwnershipFilterChange,
  favoritesFilter,
  onFavoritesFilterChange,
  className = "",
}: LibraryFiltersPanelProps) {
  const selectContentProps = {
    position: "popper" as const,
    sideOffset: 4,
    className: "z-[100]",
  };

  return (
    <div className={`space-y-3 rounded-2xl bg-rose-50/35 p-4 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Funnel className="h-4 w-4 text-zinc-500" />
          <p className="text-sm font-medium text-zinc-700">Refine your library</p>
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-zinc-500" />
          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger className="w-full rounded-2xl border-rose-100 bg-white sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent {...selectContentProps}>
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

      <div className="grid gap-3 sm:grid-cols-2">
        <Select value={typeFilter} onValueChange={onTypeFilterChange}>
          <SelectTrigger className="w-full rounded-2xl border-rose-100 bg-white">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent {...selectContentProps}>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="Bullet">Bullet</SelectItem>
            <SelectItem value="Liquid">Liquid</SelectItem>
            <SelectItem value="Tint">Tint</SelectItem>
            <SelectItem value="Gloss">Gloss</SelectItem>
            <SelectItem value="Balm">Balm</SelectItem>
            <SelectItem value="Gloss Balm">Gloss Balm</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priceTierFilter} onValueChange={onPriceTierFilterChange}>
          <SelectTrigger className="w-full rounded-2xl border-rose-100 bg-white">
            <SelectValue placeholder="Price tier" />
          </SelectTrigger>
          <SelectContent {...selectContentProps}>
            <SelectItem value="all">All price tiers</SelectItem>
            <SelectItem value="Drugstore">Drugstore</SelectItem>
            <SelectItem value="High-End">High-End</SelectItem>
          </SelectContent>
        </Select>

        <Select value={finishFilter} onValueChange={onFinishFilterChange}>
          <SelectTrigger className="w-full rounded-2xl border-rose-100 bg-white">
            <SelectValue placeholder="Finish" />
          </SelectTrigger>
          <SelectContent {...selectContentProps}>
            <SelectItem value="all">All finishes</SelectItem>
            <SelectItem value="Matte">Matte</SelectItem>
            <SelectItem value="Creamy Matte">Creamy Matte</SelectItem>
            <SelectItem value="Soft Matte">Soft Matte</SelectItem>
            <SelectItem value="Satin">Satin</SelectItem>
            <SelectItem value="Glossy">Glossy</SelectItem>
            <SelectItem value="Sheer">Sheer</SelectItem>
            <SelectItem value="Tint">Tint</SelectItem>
            <SelectItem value="Shimmer">Shimmer</SelectItem>
          </SelectContent>
        </Select>

        <Select value={undertoneFilter} onValueChange={onUndertoneFilterChange}>
          <SelectTrigger className="w-full rounded-2xl border-rose-100 bg-white">
            <SelectValue placeholder="Undertone" />
          </SelectTrigger>
          <SelectContent {...selectContentProps}>
            <SelectItem value="all">All undertones</SelectItem>
            <SelectItem value="Warm">Warm</SelectItem>
            <SelectItem value="Cool">Cool</SelectItem>
            <SelectItem value="Neutral">Neutral</SelectItem>
          </SelectContent>
        </Select>

        <Select value={colorFamilyFilter} onValueChange={onColorFamilyFilterChange}>
          <SelectTrigger className="w-full rounded-2xl border-rose-100 bg-white">
            <SelectValue placeholder="Color family" />
          </SelectTrigger>
          <SelectContent {...selectContentProps}>
            <SelectItem value="all">All color families</SelectItem>
            <SelectItem value="Red">Red</SelectItem>
            <SelectItem value="Pink">Pink</SelectItem>
            <SelectItem value="Berry">Berry</SelectItem>
            <SelectItem value="Brown">Brown</SelectItem>
            <SelectItem value="Nude">Nude</SelectItem>
            <SelectItem value="Coral">Coral</SelectItem>
            <SelectItem value="Mauve">Mauve</SelectItem>
            <SelectItem value="Pinkish Brownish">Pinkish Brownish</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full rounded-2xl border-rose-100 bg-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent {...selectContentProps}>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Owned">Owned</SelectItem>
            <SelectItem value="Wishlist">Wishlist</SelectItem>
            <SelectItem value="Decluttered">Decluttered</SelectItem>
          </SelectContent>
        </Select>

        <Select value={ownershipFilter} onValueChange={onOwnershipFilterChange}>
          <SelectTrigger className="w-full rounded-2xl border-rose-100 bg-white">
            <SelectValue placeholder="Ownership" />
          </SelectTrigger>
          <SelectContent {...selectContentProps}>
            <SelectItem value="all">All lipsticks</SelectItem>
            <SelectItem value="owned">Owned by you</SelectItem>
            <SelectItem value="shared">Shared with you</SelectItem>
          </SelectContent>
        </Select>

        <Select value={favoritesFilter} onValueChange={onFavoritesFilterChange}>
          <SelectTrigger className="w-full rounded-2xl border-rose-100 bg-white">
            <SelectValue placeholder="Favorites" />
          </SelectTrigger>
          <SelectContent {...selectContentProps}>
            <SelectItem value="all">All favorites</SelectItem>
            <SelectItem value="favorites">Favorites only</SelectItem>
            <SelectItem value="nonfavorites">Non-favorites</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
