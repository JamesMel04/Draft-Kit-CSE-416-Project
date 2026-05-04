import { useCallback, useRef, useState } from 'react';
import { PlayerEvaluation, Position, PlayerID, TeamName } from '@/_lib/types';
import { getOpenCompatibleSlots } from './draftUtils';

type RosterNames = Record<TeamName, { roster: Partial<Record<Position, string>> }>;

type Column = {
  header: string;
  sortField?: string;
  renderCell: (player: PlayerEvaluation) => React.ReactNode;
};

export function usePlayerAssignment(
  teams: TeamName[],
  rosterNames: RosterNames,
  takenPlayerIds: Set<PlayerID>,
  onAdd: (team: TeamName, slot: Position, name: string, id: PlayerID) => void,
) {
  const [assignTeamByPlayer, setAssignTeamByPlayer] = useState<Partial<Record<string, TeamName>>>({});
  const [assignSlotByPlayer, setAssignSlotByPlayer] = useState<Partial<Record<string, Position>>>({});

  // Refs so callbacks always read current values without stale closures
  const assignTeamRef = useRef(assignTeamByPlayer);
  const assignSlotRef = useRef(assignSlotByPlayer);
  assignTeamRef.current = assignTeamByPlayer;
  assignSlotRef.current = assignSlotByPlayer;

  const getTeamForPlayer = (playerId: PlayerID) => assignTeamByPlayer[playerId] ?? teams[0];
  const getSlotForPlayer = (playerId: PlayerID) => assignSlotByPlayer[playerId];

  const handleAssignTeamChange = useCallback((
    playerId: PlayerID,
    team: TeamName,
    player: PlayerEvaluation
  ) => {
    const firstOpenSlot = getOpenCompatibleSlots(rosterNames[team]?.roster ?? {}, player)[0];
    setAssignTeamByPlayer((prev) => ({ ...prev, [playerId]: team }));
    setAssignSlotByPlayer((prev) => ({ ...prev, [playerId]: firstOpenSlot }));
  }, [rosterNames]);

  const handleAddFromSearch = useCallback((player: PlayerEvaluation) => {
    // Read from refs to guarantee current values, not stale closure snapshots
    const team = assignTeamRef.current[player.id] ?? teams[0];
    const openSlots = getOpenCompatibleSlots(rosterNames[team]?.roster ?? {}, player);
    const slot = assignSlotRef.current[player.id] ?? openSlots[0];
    if (!slot) {
      window.alert("No compatible open slot for this team.");
      return;
    }
    onAdd(team, slot, player.name, player.id);
  }, [teams, rosterNames, onAdd]);

  const columns: Column[] = [
    {
      header: "Player",
      sortField: "name",
      renderCell: (player) => <span className="font-semibold">{player.name}</span>,
    },
    {
      header: "Pos",
      sortField: "positions",
      renderCell: (player) => player.positions.join(", "),
    },
    {
      header: "Value",
      sortField: "evaluation.auctionPrice",
      renderCell: (player) => `$${player.evaluation.auctionPrice.toFixed(2)}`,
    },
    {
      header: "Eval",
      sortField: "evaluation.score",
      renderCell: (player) => `${player.evaluation.normalizedValue}`,
    },
    {
      header: "Assign Team",
      renderCell: (player) => {
        const selectedTeam = getTeamForPlayer(player.id);
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
      renderCell: (player) => {
        const selectedTeam = getTeamForPlayer(player.id);
        const openSlots = getOpenCompatibleSlots(rosterNames[selectedTeam]?.roster ?? {}, player);
        const currentSlot = getSlotForPlayer(player.id);
        const selectedSlot = currentSlot && openSlots.includes(currentSlot) ? currentSlot : openSlots[0];
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
      renderCell: (player) => {
        const selectedTeam = getTeamForPlayer(player.id);
        const openSlots = getOpenCompatibleSlots(rosterNames[selectedTeam]?.roster ?? {}, player);
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

  return { columns, handleAddFromSearch };
}
