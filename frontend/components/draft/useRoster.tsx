import { useCallback, useEffect, useMemo, useState } from 'react';
import { Position, PlayerID, TeamName, RosterData, PlayerData, LeagueData } from '@/_lib/types';
import { allPositions } from '@/_lib/consts';

type RosterNames = Record<TeamName, { roster: Partial<Record<Position, string>> }>;

export function useRoster(
  teams: TeamName[],
  players: PlayerData[],
  config: LeagueData | undefined
) {
  const playerNameById = useMemo(
    () => Object.fromEntries(players.map((p) => [p.id, p.name])),
    [players]
  );

  const initialRosterNames = useMemo((): RosterNames => {
    const result: RosterNames = {};
    teams.forEach((team) => {
      result[team] = { roster: {} };
      allPositions.forEach((pos) => {
        const playerId = config?.teams?.[team]?.roster[pos];
        if (playerId) result[team].roster[pos] = playerNameById[playerId] ?? "Unknown Player";
      });
    });
    return result;
  }, [teams, config, playerNameById]);

  const initialRosterIds = useMemo((): Record<TeamName, RosterData> => {
    const result: Record<TeamName, RosterData> = {};
    if (!config?.teams) return result;
    for (const team of teams) {
      result[team] = { roster: {} } as RosterData;
      for (const pos of allPositions) {
        const playerId = config.teams[team]?.roster[pos];
        if (playerId) result[team].roster[pos] = playerId;
      }
    }
    return result;
  }, [teams, config]);

  const [rosterNames, setRosterNames] = useState<RosterNames>(initialRosterNames);
  const [rosterIds, setRosterIds] = useState<Record<TeamName, RosterData>>(initialRosterIds);

  // useEffect (not useMemo) is the correct way to sync derived state into useState
  useEffect(() => { setRosterNames(initialRosterNames); }, [initialRosterNames]);
  useEffect(() => { setRosterIds(initialRosterIds); }, [initialRosterIds]);

  const updateCell = useCallback((
    team: TeamName,
    pos: Position,
    name?: string,
    id?: PlayerID
  ) => {
    setRosterNames((prev) => ({ ...prev, [team]: { ...prev[team], roster: { ...prev[team]?.roster, [pos]: name } } }));
    setRosterIds((prev) => ({ ...prev, [team]: { ...prev[team], roster: { ...prev[team]?.roster, [pos]: id } } }));
  }, []);

  const takenPlayerIds = useMemo(() => {
    const taken = new Set<PlayerID>();
    teams.forEach((team) => {
      allPositions.forEach((pos) => {
        const id = rosterIds[team]?.roster[pos];
        if (id) taken.add(id);
      });
    });
    return taken;
  }, [teams, rosterIds]);

  const movePlayer = useCallback((
    team: TeamName,
    sourcePos: Position,
    targetPos: Position
  ) => {
    setRosterNames((prev) => {
      const sourcePlayer = prev[team]?.roster[sourcePos];
      const targetPlayer = prev[team]?.roster[targetPos];
      if (!sourcePlayer || targetPlayer) return prev;
      return { ...prev, [team]: { roster: { ...prev[team]?.roster, [sourcePos]: undefined, [targetPos]: sourcePlayer } } };
    });
    setRosterIds((prev) => {
      const sourceId = prev[team]?.roster[sourcePos];
      const targetId = prev[team]?.roster[targetPos];
      if (!sourceId || targetId) return prev;
      return { ...prev, [team]: { roster: { ...prev[team]?.roster, [sourcePos]: undefined, [targetPos]: sourceId } } };
    });
  }, []);

  const swapPlayers = useCallback((
    team: TeamName,
    posA: Position,
    posB: Position
  ) => {
    setRosterNames((prev) => {
      const a = prev[team]?.roster[posA];
      const b = prev[team]?.roster[posB];
      if (!a || !b) return prev;
      return { ...prev, [team]: { roster: { ...prev[team]?.roster, [posA]: b, [posB]: a } } };
    });
    setRosterIds((prev) => {
      const a = prev[team]?.roster[posA];
      const b = prev[team]?.roster[posB];
      if (!a || !b) return prev;
      return { ...prev, [team]: { roster: { ...prev[team]?.roster, [posA]: b, [posB]: a } } };
    });
  }, []);

  return { rosterNames, rosterIds, updateCell, takenPlayerIds, movePlayer, swapPlayers };
}
