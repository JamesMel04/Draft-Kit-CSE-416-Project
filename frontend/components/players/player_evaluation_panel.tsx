"use client";

import { getEvaluatedPlayers } from "@/_lib/api";
import { EvaluatedPlayer, EvaluationPlayerFilters, EvaluationMeta, PaginationMeta } from "@/_lib/types";
import Pagination from "@/components/ui/pagination";
import { ReactNode, useEffect, useMemo, useState } from "react";

type PlayerEvaluationColumn = {
  header: string;
  renderCell: (player: EvaluatedPlayer) => ReactNode;
};

type PlayerEvaluationPanelProps = {
  title: string;
  description: string;
  columns: PlayerEvaluationColumn[];
  positionOptions: string[];
  emptyMessage: string;
  showClearFilters?: boolean;
  pageSize?: number;
  defaultSort?: string;
  defaultAsc?: boolean;
  initialSearchOnMount?: boolean;
  hiddenPlayerIds?: string[];
  buildFilters?: (base: EvaluationPlayerFilters) => EvaluationPlayerFilters;
  onResultsChange?: (payload: {
    players: EvaluatedPlayer[];
    pagination: PaginationMeta | null;
    meta: EvaluationMeta | null;
  }) => void;
};

export default function PlayerEvaluationPanel({
  title,
  description,
  columns,
  positionOptions,
  emptyMessage,
  showClearFilters = false,
  pageSize = 25,
  defaultSort = "suggestedValue",
  defaultAsc = false,
  initialSearchOnMount = false,
  hiddenPlayerIds,
  buildFilters,
  onResultsChange,
}: PlayerEvaluationPanelProps) {
  const [source, setSource] = useState<"backend" | "fallback" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [players, setPlayers] = useState<EvaluatedPlayer[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);

  const visiblePlayers = useMemo(() => {
    if (!hiddenPlayerIds?.length) return players;
    const hiddenSet = new Set(hiddenPlayerIds);
    return players.filter((player) => !hiddenSet.has(player.id));
  }, [hiddenPlayerIds, players]);

  const runSearch = async (requestedPage = page) => {
    try {
      setLoading(true);
      setError(null);

      const baseFilters: EvaluationPlayerFilters = {
        name: nameInput || undefined,
        positions: selectedPositions,
        minPrice: minPriceInput ? Number(minPriceInput) : undefined,
        maxPrice: maxPriceInput ? Number(maxPriceInput) : undefined,
        sort: defaultSort,
        asc: defaultAsc,
        page: requestedPage,
        limit: pageSize,
      };

      const filters = buildFilters ? buildFilters(baseFilters) : baseFilters;
      const response = await getEvaluatedPlayers(filters);

      setPlayers(response.players);
      setSource(response.meta.source);
      setPagination(response.pagination);
      setPage(response.pagination.page);
      onResultsChange?.({ players: response.players, pagination: response.pagination, meta: response.meta });
    } catch {
      setPlayers([]);
      setSource(null);
      setPagination(null);
      setError("Failed to evaluate players.");
      onResultsChange?.({ players: [], pagination: null, meta: null });
    } finally {
      setLoading(false);
    }
  };

  const togglePosition = (position: string) => {
    setSelectedPositions((prev) =>
      prev.includes(position) ? prev.filter((p) => p !== position) : [...prev, position]
    );
  };

  const clearFilters = () => {
    setNameInput("");
    setMinPriceInput("");
    setMaxPriceInput("");
    setSelectedPositions([]);
    setPage(1);
  };

  useEffect(() => {
    if (!initialSearchOnMount) return;
    runSearch(1);
  }, []);

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">{title}</h2>
        {source && (
          <span
            className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
              source === "backend"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {source}
          </span>
        )}
      </div>

      <p className="text-xs text-slate-500">{description}</p>

      <div className="grid gap-2 md:grid-cols-3">
        <input
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          placeholder="Name search"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
        />
        <input
          value={minPriceInput}
          onChange={(e) => setMinPriceInput(e.target.value)}
          type="number"
          placeholder="Min value"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
        />
        <input
          value={maxPriceInput}
          onChange={(e) => setMaxPriceInput(e.target.value)}
          type="number"
          placeholder="Max value"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
        />
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="mb-2 text-xs font-semibold uppercase text-slate-600">Positions</div>
        <div className="flex flex-wrap gap-2">
          {positionOptions.map((pos) => {
            const selected = selectedPositions.includes(pos);
            return (
              <label
                key={pos}
                className={`cursor-pointer rounded-md border px-2 py-1 text-xs font-semibold transition ${
                  selected
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => togglePosition(pos)}
                  className="sr-only"
                />
                {pos}
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => runSearch(1)}
          className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          {loading ? "Searching..." : "Search"}
        </button>

        {showClearFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Clear Filters
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        {pagination && (
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              disabled={loading}
              onPrev={() => runSearch(Math.max(1, page - 1))}
              onNext={() => runSearch(page + 1)}
            />
          </div>
        )}

        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-slate-100 text-slate-800">
            <tr>
              {columns.map((column) => (
                <th key={column.header} className="px-3 py-2 text-left font-bold">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!visiblePlayers.length ? (
              <tr>
                <td className="px-3 py-3 text-slate-500" colSpan={columns.length}>
                  {loading ? "Loading players..." : emptyMessage}
                </td>
              </tr>
            ) : (
              visiblePlayers.map((player) => (
                <tr key={player.id} className="border-t border-slate-200 hover:bg-slate-50">
                  {columns.map((column) => (
                    <td key={`${player.id}-${column.header}`} className="px-3 py-2">
                      {column.renderCell(player)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between text-xs text-slate-600">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            disabled={loading}
            onPrev={() => runSearch(Math.max(1, page - 1))}
            onNext={() => runSearch(page + 1)}
          />
        </div>
      )}
    </div>
  );
}
