import { LeagueData, LeagueSettings, LeagueState, Player, PlayerData, PlayerEvaluation, PlayerPools, PlayerStats, PlayerValuation, SeasonStats } from '@/types';
import { defaultRosterSlotsCounts } from '@/consts';

export function convertSeasonStatsToPlayerStats(seasonStats: SeasonStats): PlayerStats {
	if (seasonStats.hitting) {
		return {
			seasons: seasonStats.seasons,
			hitter: seasonStats.hitting as unknown as Record<string, number>
		};
	} else if (seasonStats.pitching) {
		return {
			seasons: seasonStats.seasons,
			hitter: seasonStats.pitching as unknown as Record<string, number>
		};
	}
	
	return {
    seasons: seasonStats.seasons,
    hitter: {}
  };
}

export function convertPlayerToPlayerData(player: Player): PlayerData {
	return {
		id: player.id,
		name: player.name,
		team: player.team,
		positions: player.positions,
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