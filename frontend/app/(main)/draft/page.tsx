"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PlayerEvaluation, Position, DraftData, PlayerData, LeagueData } from '@/_lib/types';
import { getPlayers, saveDraft } from '@/_lib/api';
import { allPositions, allSearchFilterPositions } from '@/_lib/consts';
import { getEvaluatedPlayers } from '@/_lib/api';
import PlayerEvaluationPanel from '@/components/players/player_evaluation_panel';
import { useUser } from '@auth0/nextjs-auth0';

type TeamName = string;
type CellRef = { team: TeamName; pos: Position };
type PendingAction = { type: "move" | "swap"; source: CellRef } | null;
type ViewMode = "hitters" | "pitchers" | "all";

function normalizePlayerPosition(pos: string): string {
  const upper = pos.toUpperCase();
  if (["LF", "CF", "RF"].includes(upper)) return "OF";
  return upper;
}

function isPitcherPosition(pos: string): boolean {
  return ["SP", "RP", "P"].includes(normalizePlayerPosition(pos));
}

function canPlayerFitSlot(playerPositions: string[], slot: Position): boolean {
  const normalized = playerPositions.map(normalizePlayerPosition);
  const hasPitcherPosition = normalized.some(isPitcherPosition);
  if (slot.startsWith("P")) return hasPitcherPosition;
  if (slot.startsWith("OF")) return normalized.includes("OF");
  if (slot === "CI") return normalized.includes("1B") || normalized.includes("3B");
  if (slot === "MI") return normalized.includes("2B") || normalized.includes("SS");
  if (slot === "UTIL") return !hasPitcherPosition;
  return normalized.includes(slot);
}

export default function Draft() {
  const { user } = useUser();

  // -------------------------
  // CONFIG FROM SESSION STORAGE
  // -------------------------
  const [config, setConfig] = useState<LeagueData>();

  useEffect(() => {
    const raw = sessionStorage.getItem("draftConfig");
    if (raw) {
      try {
        setConfig(JSON.parse(raw));
      } catch {
        console.error("Failed to parse draft config");
      }
    }
  }, []);

  const teams: TeamName[] = useMemo(() => {
    return config?.teams ? Object.keys(config.teams) : [];
  }, [config]);

  // -------------------------
  // PLAYERS
  // -------------------------
  const [players, setPlayers] = useState<PlayerData[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getPlayers({});
        setPlayers(res.players);
      } catch (e) {
        console.error("Failed to load players", e);
      }
    };
    load();
  }, []);

  // -------------------------
  // ROSTER (display names)
  // -------------------------
  const fullRoster = useMemo(() => {
    const completed: Record<TeamName, Record<Position, string | null>> = {} as any;
    teams.forEach((team) => {
      completed[team] = {} as any;
      allPositions.forEach((pos) => {
        const playerId = config?.teams?.[team]?.[pos];
        if (playerId) {
          const match = players.find((p) => p.id === playerId);
          completed[team][pos] = match?.name ?? playerId;
        } else {
          completed[team][pos] = null;
        }
      });
    });
    return completed;
  }, [teams, config, players]);

  // -------------------------
  // ROSTER IDS
  // -------------------------
  const fullRosterIds = useMemo(() => {
    if (!config?.teams) return {} as Record<TeamName, Record<Position, string | null>>;
    const completed: Record<TeamName, Record<Position, string | null>> = {} as any;
    for (const team of teams) {
      completed[team] = {} as any;
      for (const pos of allPositions) {
        completed[team][pos] = config.teams[team]?.[pos] || null;
      }
    }
    return completed;
  }, [teams, config]);

  const [roster, setRoster] = useState<Record<TeamName, Record<Position, string | null>>>({});
  const [rosterPlayerIds, setRosterPlayerIds] = useState<Record<TeamName, Record<Position, string | null>>>({});

  useEffect(() => { setRoster(fullRoster); }, [fullRoster]);
  useEffect(() => { setRosterPlayerIds(fullRosterIds); }, [fullRosterIds]);

  // -------------------------
  // BUDGETS — debounced to prevent grid re-renders on every keystroke
  // -------------------------
  const [localBudgets, setLocalBudgets] = useState<Record<TeamName, string>>({});
  const [teamBudgets, setTeamBudgets] = useState<Record<TeamName, number>>({});
  const budgetTimers = useRef<Record<TeamName, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (!config?.teams) return;
    const initial = Object.fromEntries(teams.map((t) => [t, config.startingBudget ?? 260]));
    setTeamBudgets(initial);
    setLocalBudgets(Object.fromEntries(teams.map((t) => [t, String(config.startingBudget ?? 260)])));
  }, [teams, config]);

  const handleBudgetChange = useCallback((team: TeamName, val: string) => {
    setLocalBudgets((prev) => ({ ...prev, [team]: val }));
    if (budgetTimers.current[team]) clearTimeout(budgetTimers.current[team]);
    budgetTimers.current[team] = setTimeout(() => {
      setTeamBudgets((prev) => ({ ...prev, [team]: Number(val) }));
    }, 400);
  }, []);

  // -------------------------
  // SUBMIT
  // -------------------------
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  function buildDraftData(): Partial<DraftData>[] {
    return teams.map((team) => ({
      userId: user?.sub,
      teamName: team,
      roster: Object.fromEntries(
        allPositions.map((pos) => [pos, rosterPlayerIds?.[team]?.[pos] ?? ''])
      ) as Record<Position, string>,
    }));
  }

  async function handleConfirmDrafts() {
    setSubmitStatus('submitting');
    setSubmitError(null);
    try {
      const drafts = buildDraftData();
      await Promise.all(drafts.map((draft) => saveDraft(draft)));
      setSubmitStatus('success');
    } catch (err: any) {
      setSubmitStatus('error');
      setSubmitError(err?.message || 'Failed to save drafts');
    }
  }

  // -------------------------
  // UI STATE
  // -------------------------
  const [menuCell, setMenuCell] = useState<CellRef | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("hitters");
  const [selectedEvaluation, setSelectedEvaluation] = useState<PlayerEvaluation | null>(null);
  const [evaluationSource, setEvaluationSource] = useState<"backend" | "fallback" | null>(null);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [assignTeamByPlayer, setAssignTeamByPlayer] = useState<Partial<Record<string, TeamName>>>({});
  const [assignSlotByPlayer, setAssignSlotByPlayer] = useState<Partial<Record<string, Position>>>({});
  const [filterTakenPlayers, setFilterTakenPlayers] = useState(true);

  // -------------------------
  // ROSTER HELPERS
  // -------------------------
  const clearActionState = useCallback(() => {
    setMenuCell(null);
    setPendingAction(null);
  }, []);

  const updateCellPlayer = useCallback((
    team: TeamName,
    pos: Position,
    player: string | null,
    playerId: string | null = null
  ) => {
    setRoster((prev) => ({ ...prev, [team]: { ...prev[team], [pos]: player } }));
    setRosterPlayerIds((prev) => ({ ...prev, [team]: { ...prev[team], [pos]: playerId } }));
  }, []);

  const handleRemove = useCallback((team: TeamName, pos: Position) => {
    updateCellPlayer(team, pos, null, null);
    clearActionState();
  }, [updateCellPlayer, clearActionState]);

  const startAction = useCallback((type: "move" | "swap", source: CellRef) => {
    setPendingAction({ type, source });
    setMenuCell(null);
  }, []);

  const applyPendingAction = useCallback((target: CellRef) => {
    setPendingAction((pendingAction) => {
      if (!pendingAction) return null;
      const { source, type } = pendingAction;
      if (source.team !== target.team || source.pos === target.pos) return pendingAction;

      setRoster((prev) => {
        const sourcePlayer = prev[source.team]?.[source.pos];
        const targetPlayer = prev[target.team]?.[target.pos];
        if (!sourcePlayer) return prev;

        if (type === "move") {
          if (targetPlayer) { window.alert("Move target must be empty. Use Swap instead."); return prev; }
          return { ...prev, [source.team]: { ...prev[source.team], [source.pos]: null, [target.pos]: sourcePlayer } };
        }
        if (type === "swap") {
          if (!targetPlayer) { window.alert("Swap target must be occupied."); return prev; }
          return { ...prev, [source.team]: { ...prev[source.team], [source.pos]: targetPlayer, [target.pos]: sourcePlayer } };
        }
        return prev;
      });

      setRosterPlayerIds((prev) => {
        const sourceId = prev[source.team]?.[source.pos];
        const targetId = prev[target.team]?.[target.pos];
        if (type === "move") {
          return { ...prev, [source.team]: { ...prev[source.team], [source.pos]: null, [target.pos]: sourceId } };
        }
        return { ...prev, [source.team]: { ...prev[source.team], [source.pos]: targetId, [target.pos]: sourceId } };
      });

      setMenuCell(null);
      return null;
    });
  }, []);

  const isTargetForPending = useCallback((team: TeamName, pos: Position) => {
    if (!pendingAction) return false;
    return pendingAction.source.team === team && pendingAction.source.pos !== pos;
  }, [pendingAction]);

  // -------------------------
  // DERIVED STATE
  // -------------------------
  const visiblePositions = useMemo(() => {
    const pitcherSet = new Set<Position>(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9"]);
    if (viewMode === "all") return allPositions;
    if (viewMode === "pitchers") return allPositions.filter((pos) => pitcherSet.has(pos));
    return allPositions.filter((pos) => !pitcherSet.has(pos));
  }, [viewMode]);

  const takenPlayerIds = useMemo(() => {
    const taken = new Set<string>();
    teams.forEach((team) => {
      allPositions.forEach((pos) => {
        const playerId = rosterPlayerIds[team]?.[pos];
        if (playerId) taken.add(playerId);
      });
    });
    return taken;
  }, [teams, rosterPlayerIds]);

  const getOpenCompatibleSlots = useCallback((team: TeamName, player: PlayerEvaluation): Position[] => {
    return allPositions.filter(
      (pos) => !roster[team]?.[pos] && canPlayerFitSlot(player.positions, pos)
    );
  }, [roster]);

  // -------------------------
  // PLAYER PANEL HANDLERS
  // -------------------------
  const handleAssignTeamChange = useCallback((playerId: string, team: TeamName, player: PlayerEvaluation) => {
    setAssignTeamByPlayer((prev) => ({ ...prev, [playerId]: team }));
    setAssignSlotByPlayer((prev) => ({
      ...prev,
      [playerId]: allPositions.find((pos) => !roster[team]?.[pos] && canPlayerFitSlot(player.positions, pos)),
    } as any));
  }, [roster]);

  const handleAddFromSearch = useCallback((player: PlayerEvaluation) => {
    setAssignTeamByPlayer((prevTeams) => {
      const team = prevTeams[player.id] ?? teams[0];
      setAssignSlotByPlayer((prevSlots) => {
        const openSlots = allPositions.filter(
          (pos) => !roster[team]?.[pos] && canPlayerFitSlot(player.positions, pos)
        );
        const slot = prevSlots[player.id] ?? openSlots[0];
        if (!slot) { window.alert("No compatible open slot for this team."); return prevSlots; }
        updateCellPlayer(team, slot, player.name, player.id);
        return prevSlots;
      });
      return prevTeams;
    });
  }, [teams, roster, updateCellPlayer]);

  // -------------------------
  // SELECTED PLAYER EVALUATION
  // -------------------------
  const activeCell = menuCell ?? pendingAction?.source ?? null;
  const activePlayerName = activeCell ? roster[activeCell.team]?.[activeCell.pos] : null;

  useEffect(() => {
    const load = async () => {
      if (!activePlayerName) {
        setSelectedEvaluation(null);
        setEvaluationSource(null);
        setEvaluationError(null);
        return;
      }
      try {
        setEvaluationLoading(true);
        const response = await getEvaluatedPlayers({name: activePlayerName });
        const exact = response.players.find(
          (p) => p.name.toLowerCase() === activePlayerName.toLowerCase()
        );
        setSelectedEvaluation(exact ?? response.players[0] ?? null);
        setEvaluationSource(response.meta.source);
        setEvaluationError(null);
      } catch {
        setSelectedEvaluation(null);
        setEvaluationSource(null);
        setEvaluationError("Could not load selected player evaluation.");
      } finally {
        setEvaluationLoading(false);
      }
    };
    load();
  }, [activePlayerName]);

  // -------------------------
  // PLAYER PANEL COLUMNS
  // -------------------------
  const availablePlayerColumns = useMemo(() => [
    {
      header: "Player",
      sortField: "name",
      renderCell: (player: PlayerEvaluation) => (
        <span className="font-semibold">{player.name}</span>
      ),
    },
    {
      header: "Pos",
      sortField: "positions",
      renderCell: (player: PlayerEvaluation) => player.positions.join(", "),
    },
    {
      header: "Value",
      sortField: "suggestedValue",
      renderCell: (player: PlayerEvaluation) => `$${player.suggestedValue}`,
    },
    {
      header: "Eval",
      sortField: "evaluation.score",
      renderCell: (player: PlayerEvaluation) =>
        `${player.evaluation.score} (${player.evaluation.tier})`,
    },
    {
      header: "Assign Team",
      renderCell: (player: PlayerEvaluation) => {
        const selectedTeam = assignTeamByPlayer[player.id] ?? teams[0];
        return (
          <select
            value={selectedTeam}
            onChange={(e) => handleAssignTeamChange(player.id, e.target.value as TeamName, player)}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
          >
            {teams.map((team) => (
              <option key={`${player.id}-${team}`} value={team}>{team}</option>
            ))}
          </select>
        );
      },
    },
    {
      header: "Assign Slot",
      renderCell: (player: PlayerEvaluation) => {
        const selectedTeam = assignTeamByPlayer[player.id] ?? teams[0];
        const openSlots = getOpenCompatibleSlots(selectedTeam, player);
        const selectedSlot =
          assignSlotByPlayer[player.id] && openSlots.includes(assignSlotByPlayer[player.id] as Position)
            ? (assignSlotByPlayer[player.id] as Position)
            : openSlots[0];
        return (
          <select
            value={selectedSlot ?? ""}
            onChange={(e) =>
              setAssignSlotByPlayer((prev) => ({ ...prev, [player.id]: e.target.value as Position }))
            }
            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
            disabled={openSlots.length === 0}
          >
            {openSlots.length === 0 ? (
              <option value="">No open match</option>
            ) : (
              openSlots.map((slot) => (
                <option key={`${player.id}-${selectedTeam}-${slot}`} value={slot}>{slot}</option>
              ))
            )}
          </select>
        );
      },
    },
    {
      header: "Action",
      renderCell: (player: PlayerEvaluation) => {
        const selectedTeam = assignTeamByPlayer[player.id] ?? teams[0];
        const openSlots = getOpenCompatibleSlots(selectedTeam, player);
        const isTaken = takenPlayerIds.has(player.id);
        const isDisabled = openSlots.length === 0 || isTaken;
        return (
          <button
            type="button"
            onClick={() => handleAddFromSearch(player)}
            disabled={isDisabled}
            className={`min-w-[50px] rounded-md px-2 py-1 text-xs font-semibold ${
              isDisabled
                ? "cursor-not-allowed bg-slate-100 text-slate-400"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {isTaken ? "Taken" : "Add"}
          </button>
        );
      },
    },
  ], [assignTeamByPlayer, assignSlotByPlayer, teams, getOpenCompatibleSlots, takenPlayerIds, handleAssignTeamChange, handleAddFromSearch]);

  // -------------------------
  // RENDER
  // -------------------------
  return (
    <div className="space-y-6">

      {/* SAVE BUTTON */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleConfirmDrafts}
          disabled={submitStatus === 'submitting'}
          className="rounded-md bg-emerald-700 px-4 py-2 text-white font-semibold hover:bg-emerald-800 disabled:opacity-60"
        >
          {submitStatus === 'submitting' ? 'Saving...' : 'Confirm & Save All Drafts'}
        </button>
        {submitStatus === 'success' && <span className="text-emerald-700 font-semibold">Drafts saved!</span>}
        {submitStatus === 'error' && <span className="text-rose-700 font-semibold">{submitError}</span>}
      </div>

      {/* HEADER */}
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

        {/* VIEW MODE */}
        <div className="mt-3 flex flex-wrap gap-2">
          {(["hitters", "pitchers", "all"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
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

        {/* PENDING ACTION BANNER */}
        {pendingAction && (
          <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900">
            {pendingAction.type === "move"
              ? `Move mode active: choose a destination in ${pendingAction.source.team}.`
              : `Swap mode active: choose another position in ${pendingAction.source.team}.`}
            <button
              type="button"
              onClick={clearActionState}
              className="ml-3 rounded-md border border-amber-500 px-2 py-1 text-xs font-semibold hover:bg-amber-100"
            >
              Cancel
            </button>
          </div>
        )}

        {/* SELECTED PLAYER EVALUATION */}
        {activePlayerName && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Selected Evaluation</h2>
              {evaluationSource && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  evaluationSource === "backend"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-800"
                }`}>
                  {evaluationSource}
                </span>
              )}
            </div>
            {evaluationLoading ? (
              <p className="mt-1 text-xs text-slate-500">Loading evaluation...</p>
            ) : evaluationError ? (
              <p className="mt-1 text-xs font-semibold text-rose-700">{evaluationError}</p>
            ) : selectedEvaluation ? (
              <div className="mt-2 grid gap-2 sm:grid-cols-4">
                {[
                  { label: "Player", value: selectedEvaluation.name },
                  { label: "Value", value: `$${selectedEvaluation.suggestedValue}` },
                  { label: "Eval Score", value: selectedEvaluation.evaluation.score },
                  { label: "Tier / Confidence", value: `${selectedEvaluation.evaluation.tier} / ${Math.round(selectedEvaluation.evaluation.confidence * 100)}%` },
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

      {/* ROSTER GRID */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-md">
        <div
          className="grid"
          style={{ gridTemplateColumns: `88px repeat(${teams.length}, minmax(170px, 1fr))` }}
        >
          {/* Header row */}
          <div className="border-b border-r bg-slate-100 p-2" />
          {teams.map((team) => (
            <div key={team} className="border-b border-r bg-slate-100 p-2 text-center">
              <div className="text-lg font-bold tracking-tight text-slate-900">{team}</div>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span className="text-sm font-bold text-emerald-700">$</span>
                <input
                  type="number"
                  value={localBudgets[team] ?? ""}
                  onChange={(e) => handleBudgetChange(team, e.target.value)}
                  className="w-16 rounded border border-emerald-300 bg-white px-1 py-0.5 text-sm font-bold text-emerald-700 text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-sm font-bold text-emerald-700">left</span>
              </div>
            </div>
          ))}

          {/* Position rows */}
          {visiblePositions.map((pos) => (
            <div key={pos} className="contents">
              <div className="border-b border-r bg-slate-50 px-2 py-1 text-base font-bold text-slate-800">
                {pos}
              </div>

              {teams.map((team) => {
                const player = roster[team]?.[pos];
                const selected = menuCell?.team === team && menuCell?.pos === pos;
                const isPendingSource = pendingAction?.source.team === team && pendingAction?.source.pos === pos;
                const showInlineCancel = selected || isPendingSource;
                const showPendingTarget =
                  isTargetForPending(team, pos) &&
                  ((pendingAction?.type === "move" && !player) ||
                    (pendingAction?.type === "swap" && Boolean(player)));

                return (
                  <div
                    key={`${team}-${pos}`}
                    className={`relative border-b border-r px-2 py-1 text-sm transition ${
                      isPendingSource ? "bg-amber-100" : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    {player ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="block font-medium text-slate-900">{player}</span>
                          {showInlineCancel ? (
                            <button
                              type="button"
                              onClick={clearActionState}
                              className="shrink-0 rounded-md border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                            >
                              Cancel
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setPendingAction(null);
                                setMenuCell((prev) =>
                                  prev?.team === team && prev?.pos === pos ? null : { team, pos }
                                );
                              }}
                              className="shrink-0 rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              Select
                            </button>
                          )}
                        </div>
                        {selected && (
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => handleRemove(team, pos)}
                              className="rounded-md bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-700">
                              Remove
                            </button>
                            <button type="button" onClick={() => startAction("move", { team, pos })}
                              className="rounded-md bg-amber-500 px-2 py-1 text-xs font-semibold text-white hover:bg-amber-600">
                              Move
                            </button>
                            <button type="button" onClick={() => startAction("swap", { team, pos })}
                              className="rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700">
                              Swap
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}

                    {showPendingTarget && (
                      <button
                        type="button"
                        onClick={() => applyPendingAction({ team, pos })}
                        className="mt-2 rounded-md border border-indigo-500 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                      >
                        {pendingAction?.type === "move" ? "Move Here" : "Swap Here"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* PLAYER SEARCH PANEL */}
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