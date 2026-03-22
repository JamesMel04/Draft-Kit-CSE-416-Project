import { PlayerData, SortField, SortAsc } from "../types";

export function isValidSortField(sort: SortField, players: PlayerData[] = []): boolean {
  if (players.length === 0) {
    return false;
  }

  return players.some(player => {
    if (Object.prototype.hasOwnProperty.call(player, sort)) {
      const playerValue = (player as Record<string, unknown>)[sort];
      if (typeof playerValue === 'string' || typeof playerValue === 'number') {
        return true;
      }
    }

    if (Object.prototype.hasOwnProperty.call(player.stats.projection.hitter, sort)) {
      const hitterValue = player.stats.projection.hitter[sort];
      if (typeof hitterValue === 'number') {
        return true;
      }
    }

    return false;
  });
}

const getSortValue = (player: PlayerData, sort: SortField): string | number | undefined => {
  if (Object.prototype.hasOwnProperty.call(player, sort)) {
    const playerValue = (player as Record<string, unknown>)[sort];
    if (typeof playerValue === 'string' || typeof playerValue === 'number') {
      return playerValue;
    }
  }

  if (Object.prototype.hasOwnProperty.call(player.stats.projection.hitter, sort)) {
    const hitterValue = player.stats.projection.hitter[sort];
    if (typeof hitterValue === 'number') {
      return hitterValue;
    }
  }

  return undefined;
};

export function sortPlayers(players: PlayerData[], sort: SortField, asc: SortAsc): PlayerData[] {
  return [...players].sort((a, b) => {
    const first = getSortValue(a, sort);
    const second = getSortValue(b, sort);

    const firstMissing = first === undefined || first === null;
    const secondMissing = second === undefined || second === null;

    if (firstMissing && secondMissing) {
      return 0;
    }

    if (firstMissing) {
      return 1;
    }

    if (secondMissing) {
      return -1;
    }

    if (first === second) {
      return 0;
    }

    const comparison = first > second ? 1 : -1;
    return asc? comparison : -comparison;
  });
}