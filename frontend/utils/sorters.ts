import { PlayerData, PlayerEvaluation, SortField, SortAsc, Position, SearchFilterPosition } from '@/_lib/types';

type SortValue = string | number | null | undefined;
type SortFieldInput = SortField | null | undefined;
const DEFAULT_SORT_FIELD: SortField = 'suggestedValue';

function isMissingSortValue(value: SortValue): boolean {
  return value === undefined || value === null;
}

function compareSortValues(valueA: SortValue, valueB: SortValue, isAscending: SortAsc): number {
  const isValueAMissing = isMissingSortValue(valueA);
  const isValueBMissing = isMissingSortValue(valueB);

  if (isValueAMissing && isValueBMissing) {
    return 0;
  }

  if (isValueAMissing) {
    return 1;
  }

  if (isValueBMissing) {
    return -1;
  }

  if (valueA === valueB) {
    return 0;
  }

  const comparison = typeof valueA === 'string' && typeof valueB === 'string'
    ? valueA.localeCompare(valueB)
    : Number(valueA) - Number(valueB);

  return isAscending ? comparison : -comparison;
}

function getPlayerDataSortValue(player: PlayerData, sortField: SortField): SortValue {
  if (Object.prototype.hasOwnProperty.call(player, sortField)) {
    const playerValue = (player as Record<string, unknown>)[sortField];

    if (typeof playerValue === 'string' || typeof playerValue === 'number') {
      return playerValue;
    }

    if (Array.isArray(playerValue) && typeof playerValue[0] === 'string') {
      return playerValue[0];
    }
  }

  if (Object.prototype.hasOwnProperty.call(player.stats.projection.hitter, sortField)) {
    const hitterValue = player.stats.projection.hitter[sortField];
    if (typeof hitterValue === 'number') {
      return hitterValue;
    }
  }

  return undefined;
}

function isValidPlayerDataSortField(sortField: SortFieldInput, players: PlayerData[] = []): boolean {
  if (!sortField || !players.length) {
    return false;
  }

  return players.some((player) => getPlayerDataSortValue(player, sortField) !== undefined);
}

function resolvePlayerDataSortField(sortField: SortFieldInput, players: PlayerData[] = []): SortField {
  if (!sortField) {
    return DEFAULT_SORT_FIELD;
  }

  return isValidPlayerDataSortField(sortField, players) ? sortField : DEFAULT_SORT_FIELD;
}

export function sortPlayers(players: PlayerData[], sortField: SortFieldInput, isAscending: SortAsc): PlayerData[] {
  const resolvedSortField = resolvePlayerDataSortField(sortField, players);

  return [...players].sort((playerA, playerB) => {
    const valueA = getPlayerDataSortValue(playerA, resolvedSortField);
    const valueB = getPlayerDataSortValue(playerB, resolvedSortField);
    return compareSortValues(valueA, valueB, isAscending);
  });
}

function getPlayerEvaluationSortValue(player: PlayerEvaluation, sortField: SortField): SortValue {
  if (Object.prototype.hasOwnProperty.call(player, sortField)) {
    const playerValue = (player as Record<string, unknown>)[sortField];

    if (typeof playerValue === 'string' || typeof playerValue === 'number') {
      return playerValue;
    }

    if (Array.isArray(playerValue) && typeof playerValue[0] === 'string') {
      return playerValue[0];
    }
  }

  if (sortField === 'auctionPrice' || sortField === 'evaluation.auctionPrice') {
    return player.evaluation.auctionPrice;
  }

  if (sortField === 'normalizedValue' || sortField === 'evaluation.normalizedValue') {
    return player.evaluation.normalizedValue;
  }

  return undefined;
}

function isValidPlayerEvaluationSortField(sortField: SortFieldInput, players: PlayerEvaluation[] = []): boolean {
  if (!sortField || !players.length) {
    return false;
  }

  return players.some((player) => getPlayerEvaluationSortValue(player, sortField) !== undefined);
}

function resolvePlayerEvaluationSortField(sortField: SortFieldInput, players: PlayerEvaluation[] = []): SortField {
  if (!sortField) {
    return DEFAULT_SORT_FIELD;
  }

  return isValidPlayerEvaluationSortField(sortField, players) ? sortField : DEFAULT_SORT_FIELD;
}

export function sortEvaluatedPlayers(players: PlayerEvaluation[], sortField: SortFieldInput, isAscending: SortAsc): PlayerEvaluation[] {
  const resolvedSortField = resolvePlayerEvaluationSortField(sortField, players);

  return [...players].sort((playerA, playerB) => {
    const valueA = getPlayerEvaluationSortValue(playerA, resolvedSortField);
    const valueB = getPlayerEvaluationSortValue(playerB, resolvedSortField);
    return compareSortValues(valueA, valueB, isAscending);
  });
}