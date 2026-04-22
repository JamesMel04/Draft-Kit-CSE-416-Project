"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { getPlayers } from "@/_lib/api";
import { allPositions } from "@/_lib/consts";
import { LeagueData, PlayerData, Position } from "@/_lib/types";

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
    const ids = new Set<string>();
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
    setTeams((prev) => [...prev, { name: `Team ${prev.length + 1}`, roster: {} }]);
  };

  const handleRemoveTeam = (idx: number) => {
    setTeams((prev) => prev.filter((_, i) => i !== idx));
    setLocalTeamNames((prev) => { const n = { ...prev }; delete n[idx]; return n; });
  };

  const handleAssignTeam = useCallback((playerId: string, newIdx: number) => {
    setAssignTeamByPlayer((prev) => ({ ...prev, [playerId]: newIdx }));
    setAssignPosByPlayer((prev) => { const n = { ...prev }; delete n[playerId]; return n; });
  }, []);

  const handleAssignPos = useCallback((playerId: string, pos: Position) => {
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
    const payload: LeagueData = {
      id: `league-${Date.now()}`,
      name: leagueName,
      startingBudget: budget,
      teams: Object.fromEntries(
        teams.map((t) => [
          t.name,
          Object.fromEntries(
            allPositions.map((pos) => [pos, t.roster[pos]?.id ?? ""])
          ) as Record<Position, string>,
        ])
      ),
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