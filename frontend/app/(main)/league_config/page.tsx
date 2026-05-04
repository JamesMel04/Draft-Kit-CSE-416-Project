"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { getPlayers } from "@/_lib/api";
import { allPositions } from "@/_lib/consts";
import { LeagueData, PlayerData, PlayerID, Position } from "@/_lib/types";

type TeamState = {
  name: string;
  roster: Partial<Record<Position, PlayerData>>;
};

export default function LeagueConfigPage() {
  const router = useRouter();

  const [leagueName, setLeagueName] = useState("My League");
  const [budget, setBudget] = useState(260);
  const [teams, setTeams] = useState<TeamState[]>([
    { name: "Team 1", roster: {} },
    { name: "Team 2", roster: {} },
  ]);

  // Taxi league config
  const [taxiDraftEnabled, setTaxiDraftEnabled] = useState(true);
  const [taxiRosterSlots, setTaxiRosterSlots] = useState(4);
  const [taxiDraftOrder, setTaxiDraftOrder] = useState<number[]>([0, 1]);

  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");
  const [assignTeamByPlayer, setAssignTeamByPlayer] = useState<Record<string, number>>({});
  const [assignPosByPlayer, setAssignPosByPlayer] = useState<Record<string, Position>>({});

  // Local input states for instant feedback
  const [localLeagueName, setLocalLeagueName] = useState("My League");
  const [localBudget, setLocalBudget] = useState("260");
  const [localTeamNames, setLocalTeamNames] = useState<Record<number, string>>({});
  const leagueNameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const budgetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const teamNameTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const listContainerRef = useRef<HTMLDivElement>(null);

  // -------------------------
  // LOAD PLAYERS
  // -------------------------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getPlayers({});
        setPlayers(res.players);
      } catch (e) {
        console.error("Failed to load players", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // -------------------------
  // DERIVED STATE
  // -------------------------
  const assignedPlayerIds = useMemo(() => {
    const ids = new Set<PlayerID>();
    teams.forEach((t) =>
      Object.values(t.roster).forEach((p) => { if (p) ids.add(p.id); })
    );
    return ids;
  }, [teams]);

  const filteredPlayers = useMemo(() => {
    const q = playerSearch.trim().toLowerCase();
    const available = players.filter((p) => !assignedPlayerIds.has(p.id));
    if (!q) return available;
    return available.filter(
      (p) => p.name.toLowerCase().includes(q) || p.team?.toLowerCase().includes(q)
    );
  }, [players, assignedPlayerIds, playerSearch]);

  const virtualizer = useVirtualizer({
    count: filteredPlayers.length,
    getScrollElement: () => listContainerRef.current,
    estimateSize: () => 56,
    overscan: 10,
  });

  // -------------------------
  // HANDLERS
  // -------------------------
  const handleLeagueNameChange = (val: string) => {
    setLocalLeagueName(val);
    if (leagueNameTimer.current) clearTimeout(leagueNameTimer.current);
    leagueNameTimer.current = setTimeout(() => setLeagueName(val), 400);
  };

  const handleBudgetChange = (val: string) => {
    setLocalBudget(val);
    if (budgetTimer.current) clearTimeout(budgetTimer.current);
    budgetTimer.current = setTimeout(() => setBudget(Number(val)), 400);
  };

  const handleTeamNameChange = (idx: number, val: string) => {
    setLocalTeamNames((prev) => ({ ...prev, [idx]: val }));
    if (teamNameTimers.current[idx]) clearTimeout(teamNameTimers.current[idx]);
    teamNameTimers.current[idx] = setTimeout(() => {
      setTeams((prev) => prev.map((t, i) => (i === idx ? { ...t, name: val } : t)));
    }, 400);
  };

  const handleAddTeam = () => {
    const newTeamIndex = teams.length;
    setTeams((prev) => [...prev, { name: `Team ${prev.length + 1}`, roster: {} }]);
    // Each team gets a separate taxi team in the defined order
    setTaxiDraftOrder((prev) => [...prev, newTeamIndex]);
  };

  const handleRemoveTeam = (idx: number) => {
    setTeams((prev) => prev.filter((_, i) => i !== idx));
    setLocalTeamNames((prev) => { const n = { ...prev }; delete n[idx]; return n; });
    setTaxiDraftOrder((prev) =>
      prev
        .filter((teamIndex) => teamIndex !== idx)
        .map((teamIndex) => (teamIndex > idx ? teamIndex - 1 : teamIndex))
    );
  };

  // Handler when Taxi Slots per team changes by the user
  const handleTaxiRosterSlotsChange = (value: string) => {
    const nextValue = Math.max(0, Number(value) || 0);
    setTaxiRosterSlots(nextValue);
  };

  // Arrows to change taxi draft order
  const moveTaxiDraftOrderTeam = (orderIndex: number, direction: -1 | 1) => {
    setTaxiDraftOrder((prev) => {
      const nextIndex = orderIndex + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) {
        return prev;
      }

      const next = [...prev];
      [next[orderIndex], next[nextIndex]] = [next[nextIndex], next[orderIndex]];
      return next;
    });
  };

  // to match the order to main draft
  const resetTaxiDraftOrder = () => {
    setTaxiDraftOrder(teams.map((_, idx) => idx));
  };

  const getTeamDisplayName = (idx: number) => localTeamNames[idx] ?? teams[idx]?.name ?? `Team ${idx + 1}`;

  const handleAssignTeam = useCallback((playerId: PlayerID, newIdx: number) => {
    setAssignTeamByPlayer((prev) => ({ ...prev, [playerId]: newIdx }));
    setAssignPosByPlayer((prev) => { const n = { ...prev }; delete n[playerId]; return n; });
  }, []);

  const handleAssignPos = useCallback((playerId: PlayerID, pos: Position) => {
    setAssignPosByPlayer((prev) => ({ ...prev, [playerId]: pos }));
  }, []);

  const handleAssign = useCallback((player: PlayerData) => {
    setTeams((prev) => {
      const teamIndex = assignTeamByPlayer[player.id] ?? 0;
      const currentTeam = prev[teamIndex];
      if (!currentTeam) return prev;
      const openSlots = allPositions.filter((pos) => !currentTeam.roster[pos]);
      const storedPos = assignPosByPlayer[player.id];
      const selectedPos = storedPos && openSlots.includes(storedPos) ? storedPos : openSlots[0];
      if (!selectedPos) { alert("No open slots on this team."); return prev; }
      if (currentTeam.roster[selectedPos]) { alert(`${selectedPos} is already filled.`); return prev; }
      return prev.map((t, i) =>
        i === teamIndex ? { ...t, roster: { ...t.roster, [selectedPos]: player } } : t
      );
    });
  }, [assignTeamByPlayer, assignPosByPlayer]);

  const removePlayer = useCallback((teamIdx: number, pos: Position) => {
    setTeams((prev) =>
      prev.map((t, i) =>
        i === teamIdx ? { ...t, roster: { ...t.roster, [pos]: undefined } } : t
      )
    );
  }, []);

  const handleStartDraft = () => {
    const parsedBudget = Number(localBudget);
    const resolvedLeagueName = localLeagueName.trim() || leagueName;
    const resolvedBudget = Number.isFinite(parsedBudget) && parsedBudget >= 0 ? parsedBudget : budget;
    const resolvedTeams = teams.map((team, idx) => ({
      ...team,
      name: (localTeamNames[idx] ?? team.name).trim() || `Team ${idx + 1}`,
    }));
    const taxiDraftOrderNames = taxiDraftOrder.reduce<string[]>((order, teamIndex) => {
      const teamName = resolvedTeams[teamIndex]?.name;
      if (teamName) order.push(teamName);
      return order;
    }, []);

    // Stores draftConfig into session
    const payload: LeagueData = {
      id: `league-${Date.now()}`,
      name: resolvedLeagueName,
      startingBudget: resolvedBudget,
      teams: Object.fromEntries(
        resolvedTeams.map((t) => [
          t.name,
          {
            roster: Object.fromEntries(allPositions.map((pos) => [pos, t.roster[pos]?.id]))
          }
        ])
      ),
      taxiDraft: {
        enabled: taxiDraftEnabled,
        rosterSlots: taxiDraftEnabled ? taxiRosterSlots : 0,
        eligiblePlayerType: "minor-leaguers",
        draftOrder: taxiDraftEnabled ? taxiDraftOrderNames : [],
        rosters: Object.fromEntries(resolvedTeams.map((team) => [team.name, []])),
      },
    };
    sessionStorage.setItem("draftConfig", JSON.stringify(payload));
    router.push("/draft");
  };

  // -------------------------
  // RENDER
  // -------------------------
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* HEADER */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">League Configuration</h1>
            <p className="mt-1 text-sm text-slate-500">Set up your teams and pre-seed rosters before the draft.</p>
          </div>
          <button
            onClick={handleStartDraft}
            className="self-start md:self-auto rounded-lg bg-emerald-600 px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
          >
            Start Draft →
          </button>
        </div>

        {/* SETTINGS CARD */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 flex flex-wrap gap-8">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              League Name
            </label>
            <input
              value={localLeagueName}
              onChange={(e) => handleLeagueNameChange(e.target.value)}
              className="w-56 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="My League"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Starting Budget
            </label>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">$</span>
              <input
                type="number"
                value={localBudget}
                onChange={(e) => handleBudgetChange(e.target.value)}
                className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* TAXI DRAFT SETUP */}
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className={`flex flex-col gap-4 md:flex-row md:items-center md:justify-between ${taxiDraftEnabled ? "border-b border-slate-100 pb-5" : ""}`}>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Taxi Draft</h2>
              <p className="mt-1 text-sm text-slate-500">Set taxi roster size, eligibility, and pick order.</p>
            </div>

            <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
              <span>{taxiDraftEnabled ? "Enabled" : "Disabled"}</span>
              <input
                type="checkbox"
                checked={taxiDraftEnabled}
                onChange={(e) => setTaxiDraftEnabled(e.target.checked)}
                className="peer sr-only"
              />
              <span className="relative h-6 w-11 rounded-full bg-slate-200 transition-colors after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-emerald-600 peer-checked:after:translate-x-5" />
            </label>
          </div>

          {taxiDraftEnabled ? (
          <div className="grid gap-6 pt-5 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Taxi Slots Per Team
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={taxiRosterSlots}
                    onChange={(e) => handleTaxiRosterSlotsChange(e.target.value)}
                    disabled={!taxiDraftEnabled}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Eligible Players
                  </label>
                  <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
                    Minor leaguers only
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-slate-800">Taxi Roster Preview</h3>
                  <span className="text-xs font-semibold text-slate-400">
                    {teams.length * taxiRosterSlots} slots
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  {teams.map((_, teamIdx) => (
                    <div key={teamIdx} className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="mb-2 text-sm font-semibold text-slate-800">
                        {getTeamDisplayName(teamIdx)}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {Array.from({ length: taxiRosterSlots }).map((__, slotIdx) => (
                          <div
                            key={slotIdx}
                            className="rounded-md border border-dashed border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-400"
                          >
                            T{slotIdx + 1} Empty
                          </div>
                        ))}
                        {taxiRosterSlots === 0 ? (
                          <div className="col-span-2 text-xs font-medium text-slate-400">
                            No taxi slots
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200">
              <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-bold text-slate-800">Taxi Draft Order</h3>
                <button
                  type="button"
                  onClick={resetTaxiDraftOrder}
                  disabled={!taxiDraftEnabled}
                  className="self-start rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  Match Team List
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {taxiDraftOrder.map((teamIndex, orderIndex) => (
                  <div key={`${teamIndex}-${orderIndex}`} className="grid grid-cols-[44px_minmax(0,1fr)_80px] items-center gap-3 px-4 py-3">
                    <div className="text-sm font-bold text-slate-400">
                      {orderIndex + 1}
                    </div>
                    <div className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800">
                      {getTeamDisplayName(teamIndex)}
                    </div>
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        aria-label={`Move ${getTeamDisplayName(teamIndex)} earlier`}
                        onClick={() => moveTaxiDraftOrderTeam(orderIndex, -1)}
                        disabled={!taxiDraftEnabled || orderIndex === 0}
                        className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                      >
                        ^
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${getTeamDisplayName(teamIndex)} later`}
                        onClick={() => moveTaxiDraftOrderTeam(orderIndex, 1)}
                        disabled={!taxiDraftEnabled || orderIndex === taxiDraftOrder.length - 1}
                        className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                      >
                        v
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          ) : null}
        </section>

        {/* MAIN GRID */}
        <div className="grid gap-6 lg:grid-cols-2 items-start">

          {/* TEAMS COLUMN */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Teams <span className="text-sm font-normal text-slate-400">({teams.length})</span>
              </h2>
              <button
                onClick={handleAddTeam}
                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
              >
                + Add Team
              </button>
            </div>

            {teams.map((team, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                  <input
                    value={localTeamNames[idx] ?? team.name}
                    onChange={(e) => handleTeamNameChange(idx, e.target.value)}
                    className="flex-1 bg-transparent text-sm font-bold text-slate-800 focus:outline-none border-0 placeholder:text-slate-300"
                    placeholder="Team name"
                  />
                  <button
                    onClick={() => handleRemoveTeam(idx)}
                    className="text-xs text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    Remove
                  </button>
                </div>

                <div className="divide-y divide-slate-50">
                  {allPositions.map((pos) => {
                    const player = team.roster[pos];
                    return (
                      <div
                        key={pos}
                        className="flex items-center gap-3 px-4 py-1.5 hover:bg-slate-50 transition-colors"
                      >
                        <span className="w-10 shrink-0 text-xs font-bold text-slate-400">{pos}</span>
                        {player ? (
                          <>
                            <span className="flex-1 text-sm text-slate-800 truncate">{player.name}</span>
                            <button
                              onClick={() => removePlayer(idx, pos)}
                              className="shrink-0 text-xs text-rose-400 hover:text-rose-600 transition-colors"
                            >
                              Remove
                            </button>
                          </>
                        ) : (
                          <span className="flex-1 text-xs text-slate-300">Empty</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* PLAYER POOL COLUMN */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
              <h2 className="text-base font-bold text-slate-900">
                Player Pool{" "}
                {loading ? (
                  <span className="text-xs font-normal text-slate-400">Loading...</span>
                ) : (
                  <span className="text-xs font-normal text-slate-400">
                    ({filteredPlayers.length} shown)
                  </span>
                )}
              </h2>
              <input
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                placeholder="Search by name or team..."
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {filteredPlayers.length === 0 && !loading ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">
                {playerSearch ? "No players match your search." : "No players available."}
              </p>
            ) : (
              <div
                ref={listContainerRef}
                className="overflow-y-auto"
                style={{ height: "600px" }}
              >
                <div
                  style={{ height: virtualizer.getTotalSize(), position: "relative" }}
                >
                  {virtualizer.getVirtualItems().map((virtualItem) => {
                    const player = filteredPlayers[virtualItem.index];
                    const teamIndex = assignTeamByPlayer[player.id] ?? 0;
                    const currentTeam = teams[teamIndex];
                    const openSlots = currentTeam
                      ? allPositions.filter((pos) => !currentTeam.roster[pos])
                      : [];
                    const storedPos = assignPosByPlayer[player.id];
                    const selectedPos =
                      storedPos && openSlots.includes(storedPos) ? storedPos : openSlots[0];

                    return (
                      <div
                        key={player.id}
                        style={{
                          position: "absolute",
                          top: virtualItem.start,
                          left: 0,
                          right: 0,
                          height: virtualItem.size,
                        }}
                        className="flex items-center gap-3 px-4 border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-800 truncate">{player.name}</div>
                          <div className="text-xs text-slate-400">{player.team}</div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <select
                            value={teamIndex}
                            onChange={(e) => handleAssignTeam(player.id, Number(e.target.value))}
                            className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          >
                            {teams.map((t, i) => (
                              <option key={i} value={i}>{t.name}</option>
                            ))}
                          </select>

                          <select
                            value={selectedPos ?? ""}
                            onChange={(e) => handleAssignPos(player.id, e.target.value as Position)}
                            disabled={openSlots.length === 0}
                            className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                          >
                            {openSlots.length === 0 ? (
                              <option value="">Full</option>
                            ) : (
                              openSlots.map((pos) => (
                                <option key={pos} value={pos}>{pos}</option>
                              ))
                            )}
                          </select>

                          <button
                            onClick={() => handleAssign(player)}
                            disabled={!selectedPos || openSlots.length === 0}
                            className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
