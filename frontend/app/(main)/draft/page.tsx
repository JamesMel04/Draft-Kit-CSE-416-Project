"use client";

import { getEvaluatedPlayers } from "@/_lib/api";
import { allPositions, allSearchFilterPositions } from "@/_lib/consts";
import { EvaluatedPlayer, Position } from "@/_lib/types";
import PlayerEvaluationPanel from "@/components/players/player_evaluation_panel";
import { useEffect, useMemo, useState } from "react";

type TeamName = "My Team" | "Team 2" | "Team 3" | "Team 4";
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

  if (slot.startsWith("P")) {
    return hasPitcherPosition;
  }

  if (slot.startsWith("OF")) {
    return normalized.includes("OF");
  }

  if (slot === "CI") {
    return normalized.includes("1B") || normalized.includes("3B");
  }

  if (slot === "MI") {
    return normalized.includes("2B") || normalized.includes("SS");
  }

  if (slot === "UTIL") {
    return !hasPitcherPosition;
  }

  return normalized.includes(slot);
}

export default function Draft() {
  const teams: TeamName[] = ["My Team", "Team 2", "Team 3", "Team 4"];

  const emptyTeamRoster = allPositions.reduce((acc, pos) => {
    acc[pos] = null;
    return acc;
  }, {} as Record<Position, string | null>);

  const seededRoster: Record<TeamName, Partial<Record<Position, string | null>>> = {
    "My Team": {
      ...emptyTeamRoster,
      "1B": "Freddie Freeman",
      "OF1": "Shohei Ohtani",
    },
    "Team 2": { ...emptyTeamRoster },
    "Team 3": { ...emptyTeamRoster },
    "Team 4": { ...emptyTeamRoster },
  };

  const fullRoster = useMemo(() => {
    const completed: Record<TeamName, Record<Position, string | null>> = {
      "My Team": {} as Record<Position, string | null>,
      "Team 2": {} as Record<Position, string | null>,
      "Team 3": {} as Record<Position, string | null>,
      "Team 4": {} as Record<Position, string | null>,
    };

    teams.forEach((team) => {
      allPositions.forEach((pos) => {
        completed[team][pos] = seededRoster[team][pos] ?? null;
      });
    });

    return completed;
  }, []);

  const fullRosterIds = useMemo(() => {
    const completed: Record<TeamName, Record<Position, string | null>> = {
      "My Team": {} as Record<Position, string | null>,
      "Team 2": {} as Record<Position, string | null>,
      "Team 3": {} as Record<Position, string | null>,
      "Team 4": {} as Record<Position, string | null>,
    };

    teams.forEach((team) => {
      allPositions.forEach((pos) => {
        completed[team][pos] = null;
      });
    });

    return completed;
  }, []);

  const [roster, setRoster] = useState(fullRoster);
  const [rosterPlayerIds, setRosterPlayerIds] = useState(fullRosterIds);
  const [menuCell, setMenuCell] = useState<CellRef | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("hitters");
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluatedPlayer | null>(null);
  const [evaluationSource, setEvaluationSource] = useState<"backend" | "fallback" | null>(null);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [assignTeamByPlayer, setAssignTeamByPlayer] = useState<Partial<Record<string, TeamName>>>({});
  const [assignSlotByPlayer, setAssignSlotByPlayer] = useState<Partial<Record<string, Position>>>({});
  const [filterTakenPlayers, setFilterTakenPlayers] = useState(true);

  const teamBudgets: Record<TeamName, string> = {
    "My Team": "$212",
    "Team 2": "$197",
    "Team 3": "$204",
    "Team 4": "$189",
  };

  const clearActionState = () => {
    setMenuCell(null);
    setPendingAction(null);
  };

  const updateCellPlayer = (
    team: TeamName,
    pos: Position,
    player: string | null,
    playerId: string | null = null
  ) => {
    setRoster((prev) => ({
      ...prev,
      [team]: {
        ...prev[team],
        [pos]: player,
      },
    }));

    setRosterPlayerIds((prev) => ({
      ...prev,
      [team]: {
        ...prev[team],
        [pos]: playerId,
      },
    }));
  };

  const handleRemove = (team: TeamName, pos: Position) => {
    updateCellPlayer(team, pos, null, null);
    clearActionState();
  };

  const startAction = (type: "move" | "swap", source: CellRef) => {
    setPendingAction({ type, source });
    setMenuCell(null);
  };

  const applyPendingAction = (target: CellRef) => {
    if (!pendingAction) return;

    const { source, type } = pendingAction;
    if (source.team !== target.team || source.pos === target.pos) return;

    const sourcePlayer = roster[source.team][source.pos];
    const targetPlayer = roster[target.team][target.pos];
    const sourcePlayerId = rosterPlayerIds[source.team][source.pos];
    const targetPlayerId = rosterPlayerIds[target.team][target.pos];

    if (!sourcePlayer) {
      clearActionState();
      return;
    }

    if (type === "move") {
      if (targetPlayer) {
        window.alert("Move target must be empty. Use Swap instead.");
        return;
      }

      setRoster((prev) => ({
        ...prev,
        [source.team]: {
          ...prev[source.team],
          [source.pos]: null,
          [target.pos]: sourcePlayer,
        },
      }));

      setRosterPlayerIds((prev) => ({
        ...prev,
        [source.team]: {
          ...prev[source.team],
          [source.pos]: null,
          [target.pos]: sourcePlayerId,
        },
      }));
    }

    if (type === "swap") {
      if (!targetPlayer) {
        window.alert("Swap target must be occupied.");
        return;
      }

      setRoster((prev) => ({
        ...prev,
        [source.team]: {
          ...prev[source.team],
          [source.pos]: targetPlayer,
          [target.pos]: sourcePlayer,
        },
      }));

      setRosterPlayerIds((prev) => ({
        ...prev,
        [source.team]: {
          ...prev[source.team],
          [source.pos]: targetPlayerId,
          [target.pos]: sourcePlayerId,
        },
      }));
    }

    clearActionState();
  };

  const isTargetForPending = (team: TeamName, pos: Position) => {
    if (!pendingAction) return false;
    return pendingAction.source.team === team && pendingAction.source.pos !== pos;
  };

  const visiblePositions = useMemo(() => {
    const pitcherSet = new Set<Position>(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9"]);
    if (viewMode === "all") return allPositions;
    if (viewMode === "pitchers") return allPositions.filter((pos) => pitcherSet.has(pos));
    return allPositions.filter((pos) => !pitcherSet.has(pos));
  }, [allPositions, viewMode]);

  const takenPlayerIds = useMemo(() => {
    const taken = new Set<string>();
    teams.forEach((team) => {
      allPositions.forEach((pos) => {
        const playerId = rosterPlayerIds[team][pos];
        if (playerId) taken.add(playerId);
      });
    });
    return taken;
  }, [teams, allPositions, rosterPlayerIds]);

  const getOpenCompatibleSlots = (team: TeamName, player: EvaluatedPlayer): Position[] => {
    return allPositions.filter(
      (pos) => !roster[team][pos] && canPlayerFitSlot(player.positions, pos)
    );
  };


  const handleAssignTeamChange = (playerId: string, team: TeamName, player: EvaluatedPlayer) => {
    setAssignTeamByPlayer((prev) => ({ ...prev, [playerId]: team }));
    const openSlots = getOpenCompatibleSlots(team, player);
    setAssignSlotByPlayer((prev) => ({ ...prev, [playerId]: openSlots[0] }));
  };

  const handleAddFromSearch = (player: EvaluatedPlayer) => {
    const team = assignTeamByPlayer[player.id] ?? teams[0];
    const openSlots = getOpenCompatibleSlots(team, player);
    const slot = assignSlotByPlayer[player.id] ?? openSlots[0];

    if (!slot) {
      window.alert("No compatible open slot for this team.");
      return;
    }

    updateCellPlayer(team, slot, player.name, player.id);
  };

  const activeCell = menuCell ?? pendingAction?.source ?? null;
  const activePlayerName = activeCell ? roster[activeCell.team][activeCell.pos] : null;

  useEffect(() => {
    const loadSelectedPlayerEvaluation = async () => {
      if (!activePlayerName) {
        setSelectedEvaluation(null);
        setEvaluationSource(null);
        setEvaluationError(null);
        return;
      }

      try {
        setEvaluationLoading(true);
        const response = await getEvaluatedPlayers({
          name: activePlayerName,
          limit: 5,
          sort: "suggestedValue",
          asc: false,
        });

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

    loadSelectedPlayerEvaluation();
  }, [activePlayerName]);

  const availablePlayerColumns = [
    {
      header: "Player",
      renderCell: (player: EvaluatedPlayer) => <span className="font-semibold">{player.name}</span>,
    },
    {
      header: "Pos",
      renderCell: (player: EvaluatedPlayer) => player.positions.join(", "),
    },
    {
      header: "Value",
      renderCell: (player: EvaluatedPlayer) => `$${player.suggestedValue}`,
    },
    {
      header: "Eval",
      renderCell: (player: EvaluatedPlayer) => `${player.evaluation.score} (${player.evaluation.tier})`,
    },
    {
      header: "Assign Team",
      renderCell: (player: EvaluatedPlayer) => {
        const selectedTeam = assignTeamByPlayer[player.id] ?? teams[0];
        return (
          <select
            value={selectedTeam}
            onChange={(e) => handleAssignTeamChange(player.id, e.target.value as TeamName, player)}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
          >
            {teams.map((team) => (
              <option key={`${player.id}-${team}`} value={team}>
                {team}
              </option>
            ))}
          </select>
        );
      },
    },
    {
      header: "Assign Slot",
      renderCell: (player: EvaluatedPlayer) => {
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
              setAssignSlotByPlayer((prev) => ({
                ...prev,
                [player.id]: e.target.value as Position,
              }))
            }
            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
            disabled={openSlots.length === 0}
          >
            {openSlots.length === 0 ? (
              <option value="">No open match</option>
            ) : (
              openSlots.map((slot) => (
                <option key={`${player.id}-${selectedTeam}-${slot}`} value={slot}>
                  {slot}
                </option>
              ))
            )}
          </select>
        );
      },
    },
    {
      header: "Action",
      renderCell: (player: EvaluatedPlayer) => {
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
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Placeholder League Draft Tracker</h1>
        <p className="mt-1 text-sm text-slate-600">Personal companion board for tracking your draft strategy.</p>
        <div className="mt-3 flex flex-wrap gap-3 rounded-xl bg-gradient-to-r from-slate-700 to-blue-700 px-4 py-3 text-white shadow-sm">
          <span className="font-semibold">League: Placeholder League</span>
          <span>Format: 12-Team Auction</span>
          <span>Budget Cap: $260</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setViewMode("hitters")}
            className={`rounded-md px-3 py-1 text-xs font-semibold ${
              viewMode === "hitters"
                ? "bg-slate-800 text-white"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Hitters
          </button>
          <button
            type="button"
            onClick={() => setViewMode("pitchers")}
            className={`rounded-md px-3 py-1 text-xs font-semibold ${
              viewMode === "pitchers"
                ? "bg-slate-800 text-white"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Pitchers
          </button>
          <button
            type="button"
            onClick={() => setViewMode("all")}
            className={`rounded-md px-3 py-1 text-xs font-semibold ${
              viewMode === "all"
                ? "bg-slate-800 text-white"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            All
          </button>
        </div>

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

        {activePlayerName && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Selected Evaluation</h2>
              {evaluationSource && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    evaluationSource === "backend"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
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
                <div>
                  <div className="text-xs text-slate-500">Player</div>
                  <div className="text-sm font-semibold text-slate-900">{selectedEvaluation.name}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Value</div>
                  <div className="text-sm font-semibold text-slate-900">${selectedEvaluation.suggestedValue}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Eval Score</div>
                  <div className="text-sm font-semibold text-slate-900">{selectedEvaluation.evaluation.score}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Tier / Confidence</div>
                  <div className="text-sm font-semibold text-slate-900">
                    {selectedEvaluation.evaluation.tier} / {Math.round(selectedEvaluation.evaluation.confidence * 100)}%
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-xs text-slate-500">No evaluation data found for this player.</p>
            )}
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-md">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `88px repeat(${teams.length}, minmax(170px, 1fr))`,
          }}
        >
          <div className="border-b border-r bg-slate-100 p-2"></div>

          {teams.map((team) => (
            <div
              key={team}
              className="border-b border-r bg-slate-100 p-2 text-center"
            >
              <div className="text-lg font-bold tracking-tight text-slate-900">{team}</div>
              <div className="text-xs font-semibold text-emerald-700">Money Left: {teamBudgets[team]}</div>
            </div>
          ))}

          {visiblePositions.map((pos) => (
            <div key={pos} className="contents">
              <div
                className="border-b border-r bg-slate-50 px-2 py-1 text-base font-bold text-slate-800"
              >
                {pos}
              </div>

              {teams.map((team) => {
                const player = roster[team][pos];
                const selected = menuCell?.team === team && menuCell?.pos === pos;
                const showPendingTarget =
                  isTargetForPending(team, pos) &&
                  ((pendingAction?.type === "move" && !player) ||
                    (pendingAction?.type === "swap" && Boolean(player)));
                const isPendingSource =
                  pendingAction?.source.team === team && pendingAction?.source.pos === pos;
                const showInlineCancel = selected || isPendingSource;

                const targetText = pendingAction?.type === "move" ? "Move Here" : "Swap Here";

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
                              className="shrink-0 rounded-md border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                              onClick={clearActionState}
                            >
                              Cancel
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="shrink-0 rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                              onClick={() => {
                                setPendingAction(null);
                                setMenuCell((prev) =>
                                  prev?.team === team && prev?.pos === pos ? null : { team, pos }
                                );
                              }}
                            >
                              Select
                            </button>
                          )}
                        </div>

                        {selected && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleRemove(team, pos)}
                              className="rounded-md bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-700"
                            >
                              Remove
                            </button>
                            <button
                              type="button"
                              onClick={() => startAction("move", { team, pos })}
                              className="rounded-md bg-amber-500 px-2 py-1 text-xs font-semibold text-white hover:bg-amber-600"
                            >
                              Move
                            </button>
                            <button
                              type="button"
                              onClick={() => startAction("swap", { team, pos })}
                              className="rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                            >
                              Swap
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}

                    {showPendingTarget && (
                      <button
                        type="button"
                        onClick={() => applyPendingAction({ team, pos })}
                        className="mt-2 rounded-md border border-indigo-500 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                      >
                        {targetText}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
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
        />
      </div>
    </div>
  );
}