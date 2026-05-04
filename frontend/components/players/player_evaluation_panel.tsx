"use client";

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import { PlayerEvaluation, PlayerEvaluationQueryParams, Position, SortAsc, SortField, LeagueData, PlayerID, SearchFilterPosition } from '@/_lib/types';
import { getEvaluatedPlayers } from '@/_lib/api';
import { sortEvaluatedPlayers } from '@/utils/sorters';

type PlayerEvaluationColumn = {
  header: string;
  sortField?: SortField;
  renderCell: (player: PlayerEvaluation) => ReactNode;
};

type PlayerEvaluationPanelProps = {
  title: string;
  description: string;
  columns: PlayerEvaluationColumn[];
  positionOptions: SearchFilterPosition[];
  emptyMessage: string;
  showClearFilters?: boolean;
  defaultSort?: SortField;
  defaultAsc?: SortAsc;
  initialSearchOnMount?: boolean;
  hiddenPlayerIds?: PlayerID[];
  buildFilters?: (base: PlayerEvaluationQueryParams) => PlayerEvaluationQueryParams;
  onResultsChange?: (payload: {
    players: PlayerEvaluation[];
  }) => void;
  leagueData?: LeagueData;
};

export default function PlayerEvaluationPanel({
  title,
  description,
  columns,
  positionOptions,
  emptyMessage,
  showClearFilters = false,
  defaultSort = "suggestedValue",
  defaultAsc = false,
  initialSearchOnMount = false,
  hiddenPlayerIds,
  buildFilters,
  onResultsChange,
  leagueData = undefined,
}: PlayerEvaluationPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [selectedPositions, setSelectedPositions] = useState<SearchFilterPosition[]>([]);
  const [players, setPlayers] = useState<PlayerEvaluation[]>([]);
  const [sortField, setSortField] = useState<SortField>(defaultSort);
  const [sortAsc, setSortAsc] = useState<SortAsc>(defaultAsc);

  const sortedPlayers = useMemo(() => {
    return sortEvaluatedPlayers(players, sortField, sortAsc);
  }, [players, sortField, sortAsc]);

  const handleSort = (columnSortField?: SortField) => {
    if (!columnSortField) {
      return;
    }

    if (columnSortField === sortField) {
      setSortAsc((prev) => !prev);
      return;
    }

    setSortField(columnSortField);
    setSortAsc(false);
  };

  const visiblePlayers = useMemo(() => {
    if (!hiddenPlayerIds?.length) return sortedPlayers;
    const hiddenSet = new Set(hiddenPlayerIds);
    return sortedPlayers.filter((player) => !hiddenSet.has(player.id));
  }, [hiddenPlayerIds, sortedPlayers]);

  const runSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      const baseFilters: PlayerEvaluationQueryParams = {
        name: nameInput || undefined,
        positions: selectedPositions,
        minPrice: minPriceInput ? Number(minPriceInput) : undefined,
        maxPrice: maxPriceInput ? Number(maxPriceInput) : undefined,
      };

      const filters = buildFilters ? buildFilters(baseFilters) : baseFilters;
      const response = await getEvaluatedPlayers(filters, leagueData);

      setPlayers(response.players);
      onResultsChange?.({ players: response.players });
    } catch {
      setPlayers([]);
      setError("Failed to evaluate players.");
      onResultsChange?.({ players: [] });
    } finally {
      setLoading(false);
    }
  };

  const togglePosition = (position: SearchFilterPosition) => {
    setSelectedPositions((prev) =>
      prev.includes(position) ? prev.filter((p) => p !== position) : [...prev, position]
    );
  };

  const clearFilters = () => {
    setNameInput("");
    setMinPriceInput("");
    setMaxPriceInput("");
    setSelectedPositions([]);
  };

  useEffect(() => {
    if (!initialSearchOnMount) return;
    runSearch();
  }, []);

  useEffect(() => {
    setSortField(defaultSort);
    setSortAsc(defaultAsc);
  }, [defaultSort, defaultAsc]);

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">{title}</h2>
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
          onClick={runSearch}
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
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-slate-100 text-slate-800">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.header}
                  className={`px-3 py-2 text-left font-bold ${column.sortField ? "cursor-pointer select-none" : ""}`}
                  onClick={() => handleSort(column.sortField)}
                >
                  <span className="inline-flex items-center gap-1">
                    {column.header}
                    {column.sortField && sortField === column.sortField ? (
                      sortAsc ? <ArrowUpIcon className="h-4 w-4 text-blue-600" /> : <ArrowDownIcon className="h-4 w-4 text-blue-600" />
                    ) : null}
                  </span>
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
    </div>
  );
}
