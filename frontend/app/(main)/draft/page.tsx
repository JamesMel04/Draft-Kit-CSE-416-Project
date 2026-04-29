"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PlayerEvaluation, Position, DraftData, PlayerData, LeagueData, TeamName, PlayerID } from '@/_lib/types';
import { getPlayers, saveDraft, getEvaluatedPlayers } from '@/_lib/api';
import { allPositions, allSearchFilterPositions } from '@/_lib/consts';
import PlayerEvaluationPanel from '@/components/players/player_evaluation_panel';
import { useUser } from '@auth0/nextjs-auth0';
import { useRoster } from '@/components/draft/useRoster';
import { useCellActions } from '@/components/draft/useCellActions';
import { usePlayerAssignment } from '@/components/draft/usePlayerAssignment';

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = "hitters" | "pitchers" | "all";
type DraftPrices = Record<TeamName, Partial<Record<Position, number>>>;

const PITCHER_POSITIONS = new Set<Position>(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9"]);
const VIEW_MODES: ViewMode[] = ["hitters", "pitchers", "all"];

// ─── Draft Component ──────────────────────────────────────────────────────────

export default function Draft() {
  const { user } = useUser();

  // Config ───────────────────────────────────────────────────────────────────
  const [config, setConfig] = useState<LeagueData>();

  useEffect(() => {
    const raw = sessionStorage.getItem("draftConfig");
    if (!raw) return;
    try { setConfig(JSON.parse(raw)); }
    catch { console.error("Failed to parse draft config"); }
  }, []);

  const teams: TeamName[] = useMemo(
    () => (config?.teams ? Object.keys(config.teams) : []),
    [config]
  );

  // Players ──────────────────────────────────────────────────────────────────
  const [players, setPlayers] = useState<PlayerData[]>([]);

  useEffect(() => {
    getPlayers({})
      .then((res) => setPlayers(res.players))
      .catch((e) => console.error("Failed to load players", e));
  }, []);

  // Roster ───────────────────────────────────────────────────────────────────
  const {
    rosterNames,
    rosterIds,
    updateCell,
    takenPlayerIds,
    movePlayer,
    swapPlayers,
  } = useRoster(teams, players, config);

  // Cell Actions ─────────────────────────────────────────────────────────────
  const {
    menuCell,
    pendingAction,
    activeCell,
    clearActionState,
    toggleMenuCell,
    startAction,
    applyPendingAction,
    isTargetForPending,
  } = useCellActions(movePlayer, swapPlayers);

  // Draft Prices — keyed by team + position, set at add-time via modal ────────
  const [draftPrices, setDraftPrices] = useState<DraftPrices>({});

  const setDraftPrice = useCallback((team: TeamName, pos: Position, price: number) => {
    setDraftPrices((prev) => ({
      ...prev,
      [team]: { ...prev[team], [pos]: price },
    }));
  }, []);

  const clearDraftPrice = useCallback((team: TeamName, pos: Position) => {
    setDraftPrices((prev) => {
      const teamPrices = { ...prev[team] };
      delete teamPrices[pos];
      return { ...prev, [team]: teamPrices };
    });
  }, []);

  // Budget — derived from draftPrices ────────────────────────────────────────
  const startingBudget = config?.startingBudget ?? 260;

  const budgetRemaining = useMemo(() => {
    const remaining: Record<TeamName, number> = {};
    teams.forEach((team) => {
      const spent = allPositions.reduce((sum, pos) => {
        return sum + (draftPrices[team]?.[pos] ?? 0);
      }, 0);
      remaining[team] = startingBudget - spent;
    });
    return remaining;
  }, [teams, draftPrices, startingBudget]);

  // Price Modal ──────────────────────────────────────────────────────────────
  type PendingAdd = { team: TeamName; pos: Position; playerName: string; playerId: PlayerID };
  const [pendingAdd, setPendingAdd] = useState<PendingAdd | null>(null);

  // Called by usePlayerAssignment when user clicks Add
  const handleRequestAdd = useCallback((
    team: TeamName,
    pos: Position,
    playerName: string,
    playerId: PlayerID
  ) => {
    setPendingAdd({ team, pos, playerName, playerId });
  }, []);

  const handleConfirmAdd = useCallback((price: number) => {
    if (!pendingAdd) return;
    const { team, pos, playerName, playerId } = pendingAdd;
    updateCell(team, pos, playerName, playerId);
    setDraftPrice(team, pos, price);
    setPendingAdd(null);
  }, [pendingAdd, updateCell, setDraftPrice]);

  const handleCancelAdd = useCallback(() => setPendingAdd(null), []);

  // Remove also clears the stored price ─────────────────────────────────────
  const handleRemove = useCallback((team: TeamName, pos: Position) => {
    updateCell(team, pos);
    clearDraftPrice(team, pos);
    clearActionState();
  }, [updateCell, clearDraftPrice, clearActionState]);

  // Player Assignment (search panel) ────────────────────────────────────────
  const { columns: availablePlayerColumns } = usePlayerAssignment(
    teams,
    rosterNames,
    takenPlayerIds,
    handleRequestAdd,
  );

  // Submit ───────────────────────────────────────────────────────────────────
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleConfirmDrafts = useCallback(async () => {
    setSubmitStatus('submitting');
    setSubmitError(null);
    try {
      const drafts: Partial<DraftData>[] = teams.map((team) => ({
        userId: user?.sub,
        teamName: team,
        roster: Object.fromEntries(allPositions.map((pos) => [pos, rosterIds?.[team]?.roster[pos]])),
      }));
      await Promise.all(drafts.map((draft) => saveDraft(draft)));
      setSubmitStatus('success');
    } catch (err: any) {
      setSubmitStatus('error');
      setSubmitError(err?.message ?? 'Failed to save drafts');
    }
  }, [teams, user?.sub, rosterIds]);

  // Player Evaluation (active cell) ──────────────────────────────────────────
  const activePlayerName = activeCell
    ? rosterNames[activeCell.team]?.roster[activeCell.pos]
    : null;

  const [selectedEvaluation, setSelectedEvaluation] = useState<PlayerEvaluation | null>(null);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  useEffect(() => {
    if (!activePlayerName) {
      setSelectedEvaluation(null);
      setEvaluationError(null);
      return;
    }
    let cancelled = false;
    setEvaluationLoading(true);
    getEvaluatedPlayers()
      .then((res) => {
        if (cancelled) return;
        const match = res.players.find((p) => p.name === activePlayerName);
        setSelectedEvaluation(match ?? res.players[0] ?? null);
        setEvaluationError(null);
      })
      .catch(() => {
        if (!cancelled) {
          setSelectedEvaluation(null);
          setEvaluationError("Could not load selected player evaluation.");
        }
      })
      .finally(() => { if (!cancelled) setEvaluationLoading(false); });
    return () => { cancelled = true; };
  }, [activePlayerName]);

  // View ─────────────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>("hitters");
  const [filterTakenPlayers, setFilterTakenPlayers] = useState(true);

  const visiblePositions = useMemo(() => {
    if (viewMode === "all") return allPositions;
    if (viewMode === "pitchers") return allPositions.filter((p) => PITCHER_POSITIONS.has(p));
    return allPositions.filter((p) => !PITCHER_POSITIONS.has(p));
  }, [viewMode]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Price Modal */}
      {pendingAdd && (
        <PriceModal
          playerName={pendingAdd.playerName}
          team={pendingAdd.team}
          onConfirm={handleConfirmAdd}
          onCancel={handleCancelAdd}
        />
      )}

      {/* Save */}
      <SaveBar
        status={submitStatus}
        error={submitError}
        onSave={handleConfirmDrafts}
      />

      {/* Header */}
      <DraftHeader
        config={config}
        teams={teams}
        viewMode={viewMode}
        pendingAction={pendingAction}
        activePlayerName={activePlayerName}
        selectedEvaluation={selectedEvaluation}
        evaluationLoading={evaluationLoading}
        evaluationError={evaluationError}
        onViewModeChange={setViewMode}
        onCancelPending={clearActionState}
      />

      {/* Roster Grid */}
      <RosterGrid
        teams={teams}
        visiblePositions={visiblePositions}
        rosterNames={rosterNames}
        menuCell={menuCell}
        pendingAction={pendingAction}
        budgetRemaining={budgetRemaining}
        draftPrices={draftPrices}
        onToggleMenuCell={toggleMenuCell}
        onRemove={handleRemove}
        onStartAction={startAction}
        onApplyPending={applyPendingAction}
        isTargetForPending={isTargetForPending}
        onClearAction={clearActionState}
      />

      {/* Player Search */}
      <div className="space-y-2">
        <label className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={filterTakenPlayers}
            onChange={(e) => setFilterTakenPlayers(e.target.checked)}
          />
          Hide already drafted players
        </label>

        <PlayerEvaluationPanel
          title="Available Players"
          description="Search and evaluate players in place, then add them to any team if a compatible slot is open."
          showClearFilters
          positionOptions={allSearchFilterPositions}
          columns={availablePlayerColumns}
          emptyMessage="No available players for current filters."
          hiddenPlayerIds={filterTakenPlayers ? Array.from(takenPlayerIds) : undefined}
          initialSearchOnMount
          buildFilters={(base) => ({
            ...base,
            alreadyTakenIds: filterTakenPlayers ? Array.from(takenPlayerIds) : undefined,
          })}
          leagueData={config}
        />
      </div>
    </div>
  );
}

// ─── Price Modal ──────────────────────────────────────────────────────────────

function PriceModal({
  playerName,
  team,
  onConfirm,
  onCancel,
}: {
  playerName: string;
  team: TeamName;
  onConfirm: (price: number) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = () => {
    const price = Number(value);
    if (!value || isNaN(price) || price < 0) return;
    onConfirm(price);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h2 className="text-base font-bold text-slate-900">Set Draft Price</h2>
        <p className="mt-1 text-sm text-slate-500">
          What did <span className="font-semibold text-slate-700">{playerName}</span> sell for on{" "}
          <span className="font-semibold text-slate-700">{team}</span>?
        </p>

        <div className="mt-4 flex items-center gap-2">
          <span className="text-lg font-bold text-emerald-700">$</span>
          <input
            ref={inputRef}
            type="number"
            min={0}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="0"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!value || isNaN(Number(value)) || Number(value) < 0}
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

function SaveBar({
  status,
  error,
  onSave,
}: {
  status: SubmitStatus;
  error: string | null;
  onSave: () => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={onSave}
        disabled={status === 'submitting'}
        className="rounded-md bg-emerald-700 px-4 py-2 text-white font-semibold hover:bg-emerald-800 disabled:opacity-60"
      >
        {status === 'submitting' ? 'Saving...' : 'Confirm & Save All Drafts'}
      </button>
      {status === 'success' && <span className="text-emerald-700 font-semibold">Drafts saved!</span>}
      {status === 'error' && <span className="text-rose-700 font-semibold">{error}</span>}
    </div>
  );
}

function DraftHeader({
  config,
  teams,
  viewMode,
  pendingAction,
  activePlayerName,
  selectedEvaluation,
  evaluationLoading,
  evaluationError,
  onViewModeChange,
  onCancelPending,
}: {
  config?: LeagueData;
  teams: TeamName[];
  viewMode: ViewMode;
  pendingAction: ReturnType<typeof useCellActions>['pendingAction'];
  activePlayerName: string | null | undefined;
  selectedEvaluation: PlayerEvaluation | null;
  evaluationLoading: boolean;
  evaluationError: string | null;
  onViewModeChange: (mode: ViewMode) => void;
  onCancelPending: () => void;
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        {config?.name ?? "Draft Tracker"}
      </h1>
      <p className="mt-1 text-sm text-slate-600">Personal companion board for tracking your draft strategy.</p>

      <div className="mt-3 flex flex-wrap gap-3 rounded-xl bg-gradient-to-r from-slate-700 to-blue-700 px-4 py-3 text-white shadow-sm">
        <span className="font-semibold">League: {config?.name ?? "—"}</span>
        <span>Format: {teams.length}-Team Auction</span>
        <span>Starting Budget: ${config?.startingBudget ?? "—"}</span>
      </div>

      {/* View Mode Tabs */}
      <div className="mt-3 flex flex-wrap gap-2">
        {VIEW_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onViewModeChange(mode)}
            className={`rounded-md px-3 py-1 text-xs font-semibold capitalize ${
              viewMode === mode
                ? "bg-slate-800 text-white"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Pending Action Banner */}
      {pendingAction && (
        <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {pendingAction.type === "move"
            ? `Move mode active: choose a destination in ${pendingAction.source.team}.`
            : `Swap mode active: choose another position in ${pendingAction.source.team}.`}
          <button
            type="button"
            onClick={onCancelPending}
            className="ml-3 rounded-md border border-amber-500 px-2 py-1 text-xs font-semibold hover:bg-amber-100"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Selected Player Evaluation */}
      {activePlayerName && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          {evaluationLoading ? (
            <p className="mt-1 text-xs text-slate-500">Loading evaluation...</p>
          ) : evaluationError ? (
            <p className="mt-1 text-xs font-semibold text-rose-700">{evaluationError}</p>
          ) : selectedEvaluation ? (
            <div className="mt-2 grid gap-2 sm:grid-cols-4">
              {[
                { label: "Player", value: selectedEvaluation.name },
                { label: "Value", value: `$${selectedEvaluation.evaluation.auctionPrice}` },
                { label: "Eval", value: selectedEvaluation.evaluation.normalizedValue },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-xs text-slate-500">{label}</div>
                  <div className="text-sm font-semibold text-slate-900">{value}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-xs text-slate-500">No evaluation data found for this player.</p>
          )}
        </div>
      )}
    </div>
  );
}

function RosterGrid({
  teams,
  visiblePositions,
  rosterNames,
  menuCell,
  pendingAction,
  budgetRemaining,
  draftPrices,
  onToggleMenuCell,
  onRemove,
  onStartAction,
  onApplyPending,
  isTargetForPending,
  onClearAction,
}: {
  teams: TeamName[];
  visiblePositions: Position[];
  rosterNames: Record<TeamName, { roster: Partial<Record<Position, string>> }>;
  menuCell: ReturnType<typeof useCellActions>['menuCell'];
  pendingAction: ReturnType<typeof useCellActions>['pendingAction'];
  budgetRemaining: Record<TeamName, number>;
  draftPrices: DraftPrices;
  onToggleMenuCell: (team: TeamName, pos: Position) => void;
  onRemove: (team: TeamName, pos: Position) => void;
  onStartAction: (type: "move" | "swap", source: { team: TeamName; pos: Position }) => void;
  onApplyPending: (target: { team: TeamName; pos: Position }) => void;
  isTargetForPending: (team: TeamName, pos: Position) => boolean;
  onClearAction: () => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-md">
      <div
        className="grid"
        style={{ gridTemplateColumns: `88px repeat(${teams.length}, minmax(170px, 1fr))` }}
      >
        {/* Header Row */}
        <div className="border-b border-r bg-slate-100 p-2" />
        {teams.map((team) => (
          <div key={team} className="border-b border-r bg-slate-100 p-2 text-center">
            <div className="text-lg font-bold tracking-tight text-slate-900">{team}</div>
            <div className="mt-1 text-sm font-bold text-emerald-700">
              ${budgetRemaining[team] ?? "—"} left
            </div>
          </div>
        ))}

        {/* Position Rows */}
        {visiblePositions.map((pos) => (
          <div key={pos} className="contents">
            <div className="border-b border-r bg-slate-50 px-2 py-1 text-base font-bold text-slate-800">
              {pos}
            </div>
            {teams.map((team) => (
              <RosterCell
                key={`${team}-${pos}`}
                team={team}
                pos={pos}
                playerName={rosterNames[team]?.roster[pos]}
                draftPrice={draftPrices[team]?.[pos]}
                isSelected={menuCell?.team === team && menuCell?.pos === pos}
                isPendingSource={pendingAction?.source.team === team && pendingAction?.source.pos === pos}
                isPendingTarget={isTargetForPending(team, pos)}
                pendingType={pendingAction?.type}
                onToggleSelect={() => onToggleMenuCell(team, pos)}
                onRemove={() => onRemove(team, pos)}
                onMove={() => onStartAction("move", { team, pos })}
                onSwap={() => onStartAction("swap", { team, pos })}
                onApplyPending={() => onApplyPending({ team, pos })}
                onClearAction={onClearAction}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function RosterCell({
  playerName,
  draftPrice,
  isSelected,
  isPendingSource,
  isPendingTarget,
  pendingType,
  onToggleSelect,
  onRemove,
  onMove,
  onSwap,
  onApplyPending,
  onClearAction,
}: {
  team: TeamName;
  pos: Position;
  playerName?: string;
  draftPrice?: number;
  isSelected: boolean;
  isPendingSource: boolean;
  isPendingTarget: boolean;
  pendingType?: "move" | "swap";
  onToggleSelect: () => void;
  onRemove: () => void;
  onMove: () => void;
  onSwap: () => void;
  onApplyPending: () => void;
  onClearAction: () => void;
}) {
  const showInlineCancel = isSelected || isPendingSource;
  const showPendingTargetBtn =
    isPendingTarget &&
    ((pendingType === "move" && !playerName) || (pendingType === "swap" && Boolean(playerName)));

  return (
    <div
      className={`relative border-b border-r px-2 py-1 text-sm transition ${
        isPendingSource ? "bg-amber-100" : "bg-white hover:bg-slate-50"
      }`}
    >
      {playerName ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="block font-medium text-slate-900">{playerName}</span>
              {draftPrice !== undefined && (
                <span className="text-xs font-semibold text-emerald-700">${draftPrice}</span>
              )}
            </div>
            {showInlineCancel ? (
              <button
                type="button"
                onClick={onClearAction}
                className="shrink-0 rounded-md border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={onToggleSelect}
                className="shrink-0 rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Select
              </button>
            )}
          </div>

          {isSelected && (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onRemove}
                className="rounded-md bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-700">
                Remove
              </button>
              <button type="button" onClick={onMove}
                className="rounded-md bg-amber-500 px-2 py-1 text-xs font-semibold text-white hover:bg-amber-600">
                Move
              </button>
              <button type="button" onClick={onSwap}
                className="rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700">
                Swap
              </button>
            </div>
          )}
        </div>
      ) : (
        <span className="text-slate-300">—</span>
      )}

      {showPendingTargetBtn && (
        <button
          type="button"
          onClick={onApplyPending}
          className="mt-2 rounded-md border border-indigo-500 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
        >
          {pendingType === "move" ? "Move Here" : "Swap Here"}
        </button>
      )}
    </div>
  );
}
