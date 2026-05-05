"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PlayerEvaluation, Position, RosterSlot, DraftData, LeagueData, Player, PlayerID } from '@/_lib/types';
import { getPlayers, saveDraft, getEvaluatedPlayers } from '@/_lib/api';
import { allPositions, allSearchFilterPositions } from '@/_lib/consts';
import PlayerEvaluationPanel from '@/components/players/player_evaluation_panel';
import { useUser } from '@auth0/nextjs-auth0';

type TeamName = string;
type CellRef = { team: TeamName; pos: Position };
type PendingAction = { type: "move" | "swap"; source: CellRef } | null;
type ViewMode = "hitters" | "pitchers" | "all";
type DraftView = "main" | "taxi";

function canPlayerFitSlot(playerPositions: RosterSlot[], slot: Position): boolean {
  if (slot.startsWith("P"))  return playerPositions.includes("P");
  if (slot.startsWith("OF")) return playerPositions.includes("OF");
  if (slot === "UTIL")       return playerPositions.includes("U");
  return playerPositions.includes(slot as RosterSlot);
}

export default function Draft() {
  const { user } = useUser();

  // -------------------------
  // CONFIG FROM SESSION STORAGE
  // -------------------------
  const [config, setConfig] = useState<LeagueData>();

  useEffect(() => {
    const raw = sessionStorage.getItem("draftConfig");
    if (!raw) return;
    try { setConfig(JSON.parse(raw)); }
    catch { console.error("Failed to parse draft config"); }
  }, []);

  const teams: TeamName[] = useMemo(() => {
    return config?.teams ? Object.keys(config.teams) : [];
  }, [config]);

  // -------------------------
  // PLAYERS
  // -------------------------
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = (await getPlayers({})).players;
        setPlayers([...res.hitters, ...res.pitchers]);
      } catch (e) {
        console.error("Failed to load players", e);
      }
    };
    load();
  }, []);

  // useMemp: caches a computed value between renders, only recompute when parameter [players] changes
  const playerById = useMemo(() => {
    // creates a look up table for id, player
    return new Map(players.map((player) => [player.id, player]));
  }, [players]);

  // major league: not include minor leaguer
  const mainDraftPlayerIds = useMemo(() => {
    return players.filter((player) => !player.isMinorLeaguer).map((player) => player.id);
  }, [players]);

  //taxi: only minor leaguer
  const taxiEligiblePlayers = useMemo(() => {
    return players.filter((player) => player.isMinorLeaguer);
  }, [players]);

  const playersLoaded = players.length > 0;

  // -------------------------
  // ROSTER (display names)
  // -------------------------
  const fullRoster = useMemo(() => {
    const completed: Record<TeamName, Record<Position, string | null>> = {} as any;
    teams.forEach((team) => {
      completed[team] = {} as any;
      allPositions.forEach((pos) => {
        const playerId = config?.teams?.[team]?.roster[pos];
        if (playerId) {
          const match = players.find((p) => p.id === playerId);
          completed[team][pos] = match?.name ?? String(playerId);
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
    if (!config?.teams) return {} as Record<TeamName, Record<Position, PlayerID | null>>;
    const completed: Record<TeamName, Record<Position, PlayerID | null>> = {} as any;
    for (const team of teams) {
      completed[team] = {} as any;
      for (const pos of allPositions) {
        completed[team][pos] = config.teams[team]?.roster[pos] ?? null;
      }
    }
    return completed;
  }, [teams, config]);

  const [roster, setRoster] = useState<Record<TeamName, Record<Position, string | null>>>({});
  const [rosterPlayerIds, setRosterPlayerIds] = useState<Record<TeamName, Record<Position, PlayerID | null>>>({});

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
        allPositions.map((pos) => [pos, rosterPlayerIds?.[team]?.[pos] ?? undefined])
      ) as Partial<Record<Position, PlayerID | undefined>>,
    }));
  }

  async function handleConfirmDrafts() {
    setSubmitStatus('submitting');
    setSubmitError(null);
    try {
      const drafts = buildDraftData();
      await Promise.all(drafts.map((draft) => saveDraft(draft)));
      setSubmitStatus('success');
    } catch (err) {
      setSubmitStatus('error');
      setSubmitError(err instanceof Error ? err.message : 'Failed to save drafts');
    }
  }

  // -------------------------
  // UI STATE
  // -------------------------
  const [menuCell, setMenuCell] = useState<CellRef | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("hitters");
  const [selectedEvaluation, setSelectedEvaluation] = useState<PlayerEvaluation | null>(null);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [assignTeamByPlayer, setAssignTeamByPlayer] = useState<Partial<Record<string, TeamName>>>({});
  const [assignSlotByPlayer, setAssignSlotByPlayer] = useState<Partial<Record<string, Position>>>({});
  const [filterTakenPlayers, setFilterTakenPlayers] = useState(true);
  const [draftView, setDraftView] = useState<DraftView>("main");
  const [taxiRosters, setTaxiRosters] = useState<Record<TeamName, PlayerID[]>>({});
  const [taxiPickIndex, setTaxiPickIndex] = useState(0);
  const [filterTaxiTakenPlayers, setFilterTaxiTakenPlayers] = useState(true);
  const [taxiSearch, setTaxiSearch] = useState("");

  const taxiConfig = config?.taxiDraft;
  const taxiEnabled = Boolean(taxiConfig?.enabled && taxiConfig.rosterSlots > 0);
  const taxiRosterSlots = taxiConfig?.rosterSlots ?? 0;

  // Taxi Order
  const taxiDraftOrder = useMemo(() => {
    if (!taxiEnabled) return [];
    const configuredOrder = taxiConfig?.draftOrder?.filter((team) => teams.includes(team)) ?? [];
    return configuredOrder.length ? configuredOrder : teams;
  }, [taxiConfig?.draftOrder, taxiEnabled, teams]);

  // runs whenever taxi draft config changes
  useEffect(() => {
    if (!taxiEnabled) {
      setDraftView("main");
      setTaxiRosters({});
      setTaxiPickIndex(0);
      return;
    }

    // prepares data that the taxi table uses
    // preserve user picks
    setTaxiRosters((prev) => {
      const next: Record<TeamName, PlayerID[]> = {};
      teams.forEach((team) => {
        const existingRoster = prev[team] ?? [];
        if (existingRoster.length) {
          next[team] = existingRoster.slice(0, taxiRosterSlots);
          return;
        }

        const storedPlayerIds = taxiConfig?.rosters?.[team] ?? [];
        next[team] = storedPlayerIds.slice(0, taxiRosterSlots);
      });
      return next;
    });
  }, [taxiConfig?.rosters, taxiEnabled, taxiRosterSlots, teams]);

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
    playerId: PlayerID | null = null
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
    const taken = new Set<PlayerID>();
    teams.forEach((team) => {
      allPositions.forEach((pos) => {
        const playerId = rosterPlayerIds[team]?.[pos];
        if (playerId) taken.add(playerId);
      });
    });
    return taken;
  }, [teams, rosterPlayerIds]);

  // builds a set of all player IDs that is already drafted on taxi 
  const taxiTakenPlayerIds = useMemo(() => {
    const taken = new Set<PlayerID>();
    Object.values(taxiRosters).forEach((teamRoster) => {
      teamRoster.forEach((playerId) => taken.add(playerId));
    });
    return taken;
  }, [taxiRosters]);

  // Filled taxi slots across all teams
  const taxiFilledSlots = useMemo(() => {
    return teams.reduce((total, team) => total + (taxiRosters[team]?.length ?? 0), 0);
  }, [taxiRosters, teams]);

  // Shows only visible players for Taxi
  const visibleTaxiEligiblePlayers = useMemo(() => {
    const q = taxiSearch.trim().toLowerCase();
    return taxiEligiblePlayers.filter((player) => {
      if (filterTaxiTakenPlayers && taxiTakenPlayerIds.has(player.id)) {
        return false;
      }

      if (!q) {
        return true;
      }

      return player.name.toLowerCase().includes(q) || Boolean(player.team?.toLowerCase().includes(q));
    });
  }, [filterTaxiTakenPlayers, taxiEligiblePlayers, taxiSearch, taxiTakenPlayerIds]);

  const taxiTotalSlots = taxiEnabled ? teams.length * taxiRosterSlots : 0;
  const taxiComplete = taxiEnabled && taxiTotalSlots > 0 && taxiFilledSlots >= taxiTotalSlots;
  const currentTaxiTeam = taxiEnabled && taxiDraftOrder.length
    ? taxiDraftOrder[taxiPickIndex % taxiDraftOrder.length]
    : undefined;


  // Controls who gets to pick next
  const getNextTaxiPickIndex = useCallback((rosters: Record<TeamName, PlayerID[]>, startIndex: number) => {
    if (!taxiEnabled || !taxiDraftOrder.length) return 0;

    for (let offset = 0; offset < taxiDraftOrder.length; offset += 1) {
      const nextIndex = (startIndex + offset) % taxiDraftOrder.length;
      const team = taxiDraftOrder[nextIndex];
      if ((rosters[team]?.length ?? 0) < taxiRosterSlots) {
        return nextIndex;
      }
    }

    return startIndex % taxiDraftOrder.length;
  }, [taxiDraftOrder, taxiEnabled, taxiRosterSlots]);

  const getOpenCompatibleSlots = useCallback((team: TeamName, player: PlayerEvaluation): Position[] => {
    return allPositions.filter(
      (pos) => !roster[team]?.[pos] && canPlayerFitSlot(player.positions, pos)
    );
  }, [roster]);

  // -------------------------
  // PLAYER PANEL HANDLERS
  // -------------------------
  const handleAssignTeamChange = useCallback((playerId: PlayerID, team: TeamName, player: PlayerEvaluation) => {
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

  // runs when click on "Draft" on a taxi eligible player
  const handleTaxiDraftPlayer = useCallback((player: Player) => {
    if (!taxiEnabled || !currentTaxiTeam) {
      window.alert("Taxi draft is not available for this league.");
      return;
    }

    setTaxiRosters((prev) => {
      const alreadyTaken = Object.values(prev).some((teamRoster) =>
        teamRoster.includes(player.id)
      );
      if (alreadyTaken) {
        window.alert(`${player.name} is already on a taxi roster.`);
        return prev;
      }

      const currentRoster = prev[currentTaxiTeam] ?? [];
      if (currentRoster.length >= taxiRosterSlots) {
        window.alert(`${currentTaxiTeam}'s taxi roster is full.`);
        return prev;
      }

      const next = {
        ...prev,
        [currentTaxiTeam]: [...currentRoster, player.id],
      };
      setTaxiPickIndex(getNextTaxiPickIndex(next, taxiPickIndex + 1));
      return next;
    });
  }, [currentTaxiTeam, getNextTaxiPickIndex, taxiEnabled, taxiPickIndex, taxiRosterSlots]);

  const handleRemoveTaxiPlayer = useCallback((team: TeamName, playerId: PlayerID) => {
    setTaxiRosters((prev) => ({
      ...prev,
      [team]: (prev[team] ?? []).filter((rosteredPlayerId) => rosteredPlayerId !== playerId),
    }));
  }, []);

  const handleMoveTaxiPlayer = useCallback((fromTeam: TeamName, toTeam: TeamName, playerId: PlayerID) => {
    if (fromTeam === toTeam) return;

    setTaxiRosters((prev) => {
      const targetRoster = prev[toTeam] ?? [];
      if (targetRoster.length >= taxiRosterSlots) {
        window.alert(`${toTeam}'s taxi roster is full.`);
        return prev;
      }

      return {
        ...prev,
        [fromTeam]: (prev[fromTeam] ?? []).filter((rosteredPlayerId) => rosteredPlayerId !== playerId),
        [toTeam]: [...targetRoster, playerId],
      };
    });
  }, [taxiRosterSlots]);

  useEffect(() => {
    if (!taxiEnabled || !config?.taxiDraft) return;

    const nextConfig: LeagueData = {
      ...config,
      taxiDraft: {
        ...config.taxiDraft,
        rosters: Object.fromEntries(
          teams.map((team) => [team, taxiRosters[team] ?? []])
        ),
      },
    };
    sessionStorage.setItem("draftConfig", JSON.stringify(nextConfig));
  }, [config, taxiEnabled, taxiRosters, teams]);

  // -------------------------
  // SELECTED PLAYER EVALUATION
  // -------------------------
  const activeCell = menuCell ?? pendingAction?.source ?? null;
  const activePlayerName = activeCell ? roster[activeCell.team]?.[activeCell.pos] : null;

  useEffect(() => {
    const load = async () => {
      if (!activePlayerName) {
        setSelectedEvaluation(null);
        setEvaluationError(null);
        return;
      }
      try {
        setEvaluationLoading(true);
        const response = await getEvaluatedPlayers({ name: activePlayerName });
        const exact = response.players.find(
          (p) => p.name.toLowerCase() === activePlayerName.toLowerCase()
        );
        setSelectedEvaluation(exact ?? response.players[0] ?? null);
        setEvaluationError(null);
      } catch {
        setSelectedEvaluation(null);
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
      sortField: "name" as const,
      renderCell: (player: PlayerEvaluation) => (
        <span className="font-semibold">{player.name}</span>
      ),
    },
    {
      header: "Pos",
      sortField: "positions" as const,
      renderCell: (player: PlayerEvaluation) => player.positions.join(", "),
    },
    {
      header: "Value",
      renderCell: (player: PlayerEvaluation) => `$${player.suggestedValue}`,
    },
    {
      header: "Eval",
      renderCell: (player: PlayerEvaluation) => `${player.evaluation.normalizedValue}`,
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
        <div className="mt-3 flex flex-wrap gap-3 rounded-xl bg-linear-to-r from-slate-700 to-blue-700 px-4 py-3 text-white shadow-sm">
          <span className="font-semibold">League: {config?.name ?? "—"}</span>
          <span>Format: {teams.length}-Team Auction</span>
          <span>Starting Budget: ${config?.startingBudget ?? "—"}</span>
          {taxiEnabled && <span>Taxi Draft: {taxiRosterSlots} slots/team</span>}
        </div>

        {taxiEnabled && (
          <div className="mt-3 flex flex-wrap gap-2">
            {([
              { id: "main", label: "Main Draft" },
              { id: "taxi", label: "Taxi Draft" },
            ] as { id: DraftView; label: string }[]).map((view) => (
              <button
                key={view.id}
                type="button"
                onClick={() => {
                  clearActionState();
                  setDraftView(view.id);
                }}
                className={`rounded-md px-3 py-1 text-xs font-semibold ${
                  draftView === view.id
                    ? "bg-emerald-700 text-white"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>
        )}

        {/* VIEW MODE */}
        {draftView === "main" && (
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
        )}

        {/* PENDING ACTION BANNER */}
        {draftView === "main" && pendingAction && (
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
        {draftView === "main" && activePlayerName && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Selected Evaluation</h2>
            {evaluationLoading ? (
              <p className="mt-1 text-xs text-slate-500">Loading evaluation...</p>
            ) : evaluationError ? (
              <p className="mt-1 text-xs font-semibold text-rose-700">{evaluationError}</p>
            ) : selectedEvaluation ? (
              <div className="mt-2 grid gap-2 sm:grid-cols-4">
                {[
                  { label: "Player", value: selectedEvaluation.name },
                  { label: "Suggested Value", value: `$${selectedEvaluation.suggestedValue}` },
                  { label: "Auction Price", value: `$${selectedEvaluation.evaluation.auctionPrice}` },
                  { label: "Eval Score", value: selectedEvaluation.evaluation.normalizedValue },
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

      {draftView === "main" && (
      <>
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

        {playersLoaded ? (
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
              playerIds: mainDraftPlayerIds.length ? mainDraftPlayerIds : [-1],
              alreadyTakenIds: filterTakenPlayers ? Array.from(takenPlayerIds) : undefined,
            })}
            leagueData={config}
          />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
            Loading player pool...
          </div>
        )}
      </div>

      </>
      )}

      {draftView === "taxi" && taxiEnabled && (
        <div className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Taxi Draft</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Draft minor-league eligible players into taxi rosters.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">On Clock</div>
                  <div className="text-sm font-bold text-slate-900">{taxiComplete ? "Complete" : currentTaxiTeam ?? "-"}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Slots</div>
                  <div className="text-sm font-bold text-slate-900">{taxiFilledSlots}/{taxiTotalSlots}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Eligible</div>
                  <div className="text-sm font-bold text-slate-900">{taxiEligiblePlayers.length} minor leaguers</div>
                </div>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all"
                style={{ width: `${taxiTotalSlots ? Math.min(100, (taxiFilledSlots / taxiTotalSlots) * 100) : 0}%` }}
              />
            </div>
          </section>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-md">
            <div
              className="grid"
              style={{ gridTemplateColumns: `88px repeat(${teams.length}, minmax(210px, 1fr))` }}
            >
              <div className="border-b border-r bg-slate-100 p-2" />
              {teams.map((team) => {
                const isCurrent = currentTaxiTeam === team && !taxiComplete;
                return (
                  <div
                    key={team}
                    className={`border-b border-r p-3 text-center ${
                      isCurrent ? "bg-emerald-50 ring-2 ring-inset ring-emerald-500" : "bg-slate-100"
                    }`}
                  >
                    <div className="text-lg font-bold tracking-tight text-slate-900">{team}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">
                      {(taxiRosters[team]?.length ?? 0)}/{taxiRosterSlots} taxi slots
                    </div>
                  </div>
                );
              })}

              {Array.from({ length: taxiRosterSlots }).map((_, slotIndex) => (
                <div key={`taxi-slot-${slotIndex}`} className="contents">
                  <div className="border-b border-r bg-slate-50 px-2 py-2 text-base font-bold text-slate-800">
                    T{slotIndex + 1}
                  </div>
                  {teams.map((team) => {
                    const playerId = taxiRosters[team]?.[slotIndex];
                    const player = playerId ? playerById.get(playerId) : undefined;
                    return (
                      <div key={`${team}-taxi-${slotIndex}`} className="border-b border-r bg-white px-3 py-2 text-sm">
                        {playerId ? (
                          <div className="space-y-2">
                            <div>
                              <div className="font-semibold text-slate-900">{player?.name ?? `Player ${playerId}`}</div>
                              <div className="text-xs text-slate-500">
                                {player?.team || "Minor leaguer"}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <select
                                value={team}
                                onChange={(e) => handleMoveTaxiPlayer(team, e.target.value, playerId)}
                                className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                              >
                                {teams.map((targetTeam) => (
                                  <option key={`${playerId}-${targetTeam}`} value={targetTeam}>
                                    Move to {targetTeam}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => handleRemoveTaxiPlayer(team, playerId)}
                                className="rounded-md border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-300">Empty</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filterTaxiTakenPlayers}
                onChange={(e) => setFilterTaxiTakenPlayers(e.target.checked)}
              />
              Hide taxi-rostered players
            </label>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Taxi Eligible Players</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {currentTaxiTeam ? `${currentTaxiTeam} is on the clock.` : "Minor-league eligible player pool."}
                  </p>
                </div>
                <div className="text-xs font-semibold text-slate-500">
                  {visibleTaxiEligiblePlayers.length} shown
                </div>
              </div>

              <input
                value={taxiSearch}
                onChange={(e) => setTaxiSearch(e.target.value)}
                placeholder="Search by name or team..."
                className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />

              <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left font-bold">Player</th>
                      <th className="px-3 py-2 text-left font-bold">Team</th>
                      <th className="px-3 py-2 text-left font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!playersLoaded ? (
                      <tr>
                        <td className="px-3 py-3 text-slate-500" colSpan={3}>Loading taxi-eligible players...</td>
                      </tr>
                    ) : visibleTaxiEligiblePlayers.length ? (
                      visibleTaxiEligiblePlayers.map((player) => {
                        const isTaken = taxiTakenPlayerIds.has(player.id);
                        const isDisabled = !currentTaxiTeam || taxiComplete || isTaken;
                        return (
                          <tr key={player.id} className="border-t border-slate-200 hover:bg-slate-50">
                            <td className="px-3 py-2 font-semibold text-slate-900">{player.name}</td>
                            <td className="px-3 py-2 text-slate-600">{player.team || "-"}</td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => handleTaxiDraftPlayer(player)}
                                disabled={isDisabled}
                                className={`min-w-[92px] rounded-md px-2 py-1 text-xs font-semibold ${
                                  isDisabled
                                    ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                                }`}
                              >
                                {isTaken ? "Rostered" : taxiComplete ? "Full" : "Draft"}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td className="px-3 py-3 text-slate-500" colSpan={3}>No taxi-eligible players for current filters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
