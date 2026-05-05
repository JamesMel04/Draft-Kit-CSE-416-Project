import { LeagueData, LeagueSettings, LeagueState, Player, PlayerData, PlayerEvaluation, PlayerPools, PlayerPosition, PlayerStats, PlayerValuation, RosterSlot, SearchFilterPosition, SeasonStats } from '../types';
import { defaultRosterSlotsCounts, ROSTER_SLOTS } from '../consts';

const rosterSlotSet = new Set<string>(ROSTER_SLOTS);

function normalizeToArray<T>(value: T | T[] | undefined | null): T[] {
	if (Array.isArray(value)) {
		return value;
	}

	return value === undefined || value === null ? [] : [value];
}

function isRosterSlot(position: unknown): position is RosterSlot {
	return typeof position === 'string' && rosterSlotSet.has(position);
}

export function convertSeasonStatsToPlayerStats(seasonStats: SeasonStats): PlayerStats {
	if (seasonStats.hitting) {
		return {
			seasons: seasonStats.seasons,
			hitter: seasonStats.hitting as unknown as Record<string, number>
		};
	} else if (seasonStats.pitching) {
		return {
			seasons: seasonStats.seasons,
			pitcher: seasonStats.pitching as unknown as Record<string, number>
		};
	}

	return {
		seasons: seasonStats.seasons
	};
}

export function mapPlayerPositionToFantasyPositions(position: PlayerPosition | string): RosterSlot[] {
	switch (position) {
		case 'C':
			return ['C', 'U'];
		case '1B':
			return ['1B', 'CI', 'U'];
		case '2B':
			return ['2B', 'MI', 'U'];
		case '3B':
			return ['3B', 'CI', 'U'];
		case 'SS':
			return ['SS', 'MI', 'U'];
		case 'LF':
		case 'CF':
		case 'RF':
		case 'OF':
			return ['OF', 'U'];
		case 'DH':
			return ['U'];
		case 'P':
			return ['P'];
		case 'TWP':
			return ['P', 'U'];
		case 'IF':
			return ['CI', 'MI', 'U'];
		default:
			return ['U'];
	}
}

export function mapPlayerPositionsToFantasyPositions(positions: (PlayerPosition | string)[]): RosterSlot[] {
	return Array.from(new Set(positions.flatMap(mapPlayerPositionToFantasyPositions)));
}

function getFantasyPositions(player: Player): RosterSlot[] {
	const fantasyPositions = normalizeToArray(player.fantasyPositions).filter(isRosterSlot);
	if (fantasyPositions.length) {
		return fantasyPositions;
	}

	const mlbPositions = normalizeToArray<PlayerPosition | string>(player.mlbPositions);
	if (mlbPositions.length) {
		return mapPlayerPositionsToFantasyPositions(mlbPositions);
	}

	return mapPlayerPositionToFantasyPositions(player.position);
}

export function convertPlayerToPlayerData(player: Player): PlayerData {
	return {
		id: player.id,
		name: player.name,
		team: player.team,
		positions: getFantasyPositions(player),
		suggestedValue: player.suggestedValue,
		stats: {
			projection: convertSeasonStatsToPlayerStats(player.stats.projection),
			lastYear: convertSeasonStatsToPlayerStats(player.stats.lastYear),
			threeYearAvg: convertSeasonStatsToPlayerStats(player.stats.threeYearAvg)
		}
	};
}

export function convertPlayerPoolsToPlayerData(pools: PlayerPools): { hitters: PlayerData[]; pitchers: PlayerData[] } {
	return {
		hitters: pools.hitters.map(convertPlayerToPlayerData),
		pitchers: pools.pitchers.map(convertPlayerToPlayerData)
	};
}

export function convertLeagueDataToLeagueSettings(leagueData: LeagueData): LeagueSettings | undefined {
	if (!leagueData.startingBudget || !leagueData.teams) return;

	return {
		budget: leagueData.startingBudget,
		teamCount: leagueData.teams ? Object.keys(leagueData.teams).length : 0,
		rosterSlots: defaultRosterSlotsCounts
	};
}

export function convertLeagueDataToLeagueState(leagueData: LeagueData): LeagueState | undefined {
	if (!leagueData.teams) return;

	Object.entries(leagueData.teams).forEach(([teamName, rosterData]) => {
		if (!rosterData) {
			leagueData.teams[teamName] = { roster: {} };
		} else if (!rosterData.roster) {
			rosterData.roster = {};
		}
	});

	return {
		teams: leagueData.teams
	};
}

export function convertPlayerValuationToEvaluation(player: PlayerData, valuation: PlayerValuation): PlayerEvaluation {
	return {
		id: valuation.id,
		name: player.name,
		team: player.team,
		positions: player.positions,
		suggestedValue: player.suggestedValue,
		evaluation: {
        normalizedValue: valuation.normalizedValue,
        auctionPrice: valuation.auctionPrice
    }
	};
}

export function positionToFilterPosition(pos: RosterSlot): SearchFilterPosition {
    if (["C"].includes(pos)) return "C";
    if (["1B"].includes(pos)) return "1B";
    if (["2B"].includes(pos)) return "2B";
    if (["3B"].includes(pos)) return "3B";
    if (["SS"].includes(pos)) return "SS";
    if (["OF"].includes(pos)) return "OF";
    if (["U", "CI", "MI"].includes(pos)) return "UTIL";
    if (["P"].includes(pos)) return "P";
    return pos as SearchFilterPosition;
}
