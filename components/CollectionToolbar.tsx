"use client";

import { forwardRef } from "react";
import {
  Download,
  Funnel,
  RotateCcw,
  Rows3,
  Search,
  Square,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type QuickTab = "all" | "owned" | "shared" | "trash";
type CardViewMode = "compact" | "comfortable";

type CollectionToolbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  quickTab: QuickTab;
  onQuickTabChange: (tab: QuickTab) => void;
  cardView: CardViewMode;
  onCardViewChange: (mode: CardViewMode) => void;
  isFiltersOpen: boolean;
  onToggleFilters: () => void;
  onRefresh: () => void;
  onExport: () => void;
  activeFilterChips: { key: string; label: string }[];
  onClearChip: (key: string) => void;
  onClearAllFilters: () => void;
  className?: string;
};

export const CollectionToolbar = forwardRef<HTMLDivElement, CollectionToolbarProps>(
  function CollectionToolbar(
    {
      query,
      onQueryChange,
      quickTab,
      onQuickTabChange,
      cardView,
      onCardViewChange,
      isFiltersOpen,
      onToggleFilters,
      onRefresh,
      onExport,
      activeFilterChips,
      onClearChip,
      onClearAllFilters,
      className = "",
    },
    ref
  ) {
    return (
      <div ref={ref} className={`space-y-3 ${className}`}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search shades, brands, notes..."
            className="h-11 w-full rounded-2xl border-rose-100/60 bg-white/90 pl-12 text-base shadow-sm"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-4 overflow-x-auto border-b border-rose-100/60 pb-0.5 no-scrollbar">
            {(
              [
                ["all", "All"],
                ["owned", "Owned"],
                ["shared", "Shared"],
                ["trash", "Trash"],
              ] as const
            ).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                className={`shrink-0 border-b-2 px-0.5 pb-2 text-sm transition-colors ${quickTab === tab
                  ? "tab-underline-active"
                  : "border-transparent text-zinc-500"
                  }`}
                onClick={() => onQuickTabChange(tab)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 rounded-xl ${isFiltersOpen
                ? "bg-rose-50 text-rose-600"
                : "text-zinc-600 hover:bg-rose-50"
                }`}
              onClick={onToggleFilters}
              title="Filters"
              aria-label="Filters"
            >
              <Funnel className="h-4 w-4" />
            </Button>

            <div className="flex rounded-xl bg-rose-50/50 p-0.5">
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-lg ${cardView === "compact"
                  ? "bg-white text-rose-600 shadow-sm"
                  : "text-zinc-500 hover:bg-white/80"
                  }`}
                onClick={() => onCardViewChange("compact")}
                title="Compact view"
                aria-label="Compact view"
              >
                <Rows3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-lg ${cardView === "comfortable"
                  ? "bg-white text-rose-600 shadow-sm"
                  : "text-zinc-500 hover:bg-white/80"
                  }`}
                onClick={() => onCardViewChange("comfortable")}
                title="Comfortable view"
                aria-label="Comfortable view"
              >
                <Square className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-zinc-600 hover:bg-rose-50"
              onClick={onRefresh}
              title="Refresh"
              aria-label="Refresh"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-zinc-600 hover:bg-rose-50"
              onClick={onExport}
              title="Export"
              aria-label="Export"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {activeFilterChips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {activeFilterChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => onClearChip(chip.key)}
                className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs text-rose-700 hover:bg-rose-100"
              >
                {chip.label}
                <X className="h-3 w-3" />
              </button>
            ))}
            <button
              type="button"
              onClick={onClearAllFilters}
              className="text-xs text-zinc-500 hover:text-zinc-700"
            >
              Clear all
            </button>
          </div>
        ) : null}
      </div>
    );
  }
);
